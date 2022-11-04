const {createServer} = require('http');
const puppeteer = require('puppeteer')
const axios = require('axios')

const hostname = '127.0.0.1';
const port = 3000;
var page = null;
var bScrapping = false
var ListData = null

const appID = "4e8a89a1-ad1e-40c3-ad69-d1736da8ec8f"
const tblName = "Sunroof"
const apiKey = "V2-huKTT-gDxM6-IHs4Q-z8mWS-FnAQr-qbQ5H-RkmoO-gwRqQ"
const url = 'https://api.appsheet.com/api/v2/apps/' + appID + '/tables/'+ tblName +'/Action?applicationAccessKey=' + apiKey

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

//////////========Authentication and cridential part ========////////////

const fs = require('fs').promises;
const path = require('path');
const process = require('process');
//////////========Authentication and cridential end ========////////////

const extractNumber = (str) => {
  let num = str.match(/\d/g);
  num = num.join("");
  return num
}

async function readDataAPI() {
  let res = await axios({
    method: 'post',
    url: url,
    data: {
        "Action": "Find",
        "Properties": {
            "Locale": "en-US",
        },
        "Rows": [
        ]
    }
  })
  let rows = res.data
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }
  const arr = Array.from(rows).map(record => {
    return {
      id: record.Id,
      addr: record.Address,
      bill: record.Bills,
      update: true
    }
  });
  return arr.filter((item) => {
    return item.addr !== ""
  })
}

async function writeDataAPI(id, totalHours, totalSq, totalKW, usage) {
  await axios({
    method: 'post',
    url: url,
    data: {
        "Action": "Edit",
        "Properties": {
            "Locale": "en-US",
        },
        "Rows": [
            {
                "Id": id,
                "Total hours": totalHours,
                "Total Sqft": totalSq,
                "Total KW": totalKW,
                "Usage": usage,
            }
        ]            
    }
  }).then(res =>{
    console.log(`${res.status}, write one`)
  })
}

const fetchAll = async () =>{
  return await readDataAPI()
}

const updateData = async (id, totalHours, totalSq, totalKW, usage) =>{
  await writeDataAPI(id, totalHours, totalSq, totalKW, usage)
}


////////////////////========scrapping=========///////////////////////


const _AddNew = (item, id) => {
  let bIs = false
  const cnt = ListData.length
  if(id >= cnt){
    bIs = true
    ListData.push(item)
  } else {
    if(ListData[id].addr !== item.addr || ListData[id].bill !== item.bill){
      ListData[id].addr = item.addr
      ListData[id].bill = item.bill
      ListData[id].update = true
      bIs = true
    }
  }
  return bIs
}

const detectUpdate = async () => {
  const newArr = await fetchAll()
  const newCnt = newArr.length
  for(let i=0; i<newCnt; i++){
    if(_AddNew(newArr[i], i))
      console.log("new address\n")
  }
}

const scrapByAdressList = async () => {
  if(bScrapping){
    return
  }
  await detectUpdate()
  bScrapping = true
  const count = ListData.length
  for(let i=0; i<count; i++){
    if(ListData[i].update){
      ListData[i].update = false
      await scrapFunc(ListData[i].addr, ListData[i].bill, ListData[i].id)
    }
  }
  bScrapping = false
}

const scrapFunc = async (address, bill, id) => {
  try{
    console.log(address)
    await page.type('#input-0', address);
    try{
      await page.waitForSelector('#md-option-0-0')
    }catch(e){
      console.log("Wrong Address")
      await updateData(id, -1, -1, -1, -1)
      return
    }
    await page.keyboard.press('Enter')

    await page.waitForNavigation({
      waitUntil: 'load',
    });

    try{
      await page.waitForSelector('body > div.view-wrap > address-view > div.main-content-wrapper > div > div > section.section.section-fine-tune > div > md-content.md-padding._md.layout-gt-sm-row.layout-column > div:nth-child(2) > md-card > md-card-content > div > div.recommended-kw')
    }catch(e){
      await updateData(id, -1, -1, -1, -1)
      console.log("Can't extract data")
      return
    }

    await page.waitForSelector('#select_value_label_1')
    await page.click('#select_value_label_1')

    const mdLists = await page.evaluate(() => {
      const elementAll = document.querySelector('#select_container_3 > md-select-menu > md-content').childNodes
      return Array.from(elementAll).map(item => {
        return {
          id : item.id,
          bill : item.value
        }
      })
    })
    const count = mdLists.length
    let s_Selector = '#select_option_7'
    for(let i=0; i<count; i++){
      if(bill == mdLists[i].bill){
        s_Selector = '#' + mdLists[i].id
        break
      }
    }
  
    await page.waitForSelector(s_Selector)
    await page.focus(s_Selector)
    await page.keyboard.press('Enter')
 
    await page.waitForSelector('body > div.view-wrap > address-view > div.main-content-wrapper > div > div > section.section.section-fine-tune > div > md-content.md-padding._md.layout-gt-sm-row.layout-column > div:nth-child(2) > md-card > md-card-content > div > div.recommended-kw')
    let kw_bill = await page.evaluate(() => {
      return document.querySelector('body > div.view-wrap > address-view > div.main-content-wrapper > div > div > section.section.section-fine-tune > div > md-content.md-padding._md.layout-gt-sm-row.layout-column > div:nth-child(2) > md-card > md-card-content > div > div.recommended-kw').innerText
    })
  
    let hours = await page.evaluate(() => {
      return document.querySelector('body > div.view-wrap > address-view > div.main-content-wrapper > div > div > section.section.section-map > div.address-map-panel > md-card:nth-child(2) > ul > li:nth-child(1) > div.panel-fact-text.md-body').innerText
    })
  
    let sq = await page.evaluate(() => {
      return document.querySelector('body > div.view-wrap > address-view > div.main-content-wrapper > div > div > section.section.section-map > div.address-map-panel > md-card:nth-child(2) > ul > li:nth-child(2) > div.panel-fact-text.md-body').innerText
    })

    let usage = await page.evaluate(() => {
      return document.querySelector('body > div.view-wrap > address-view > div.main-content-wrapper > div > div > section.section.section-fine-tune > div > md-content.md-padding._md.layout-gt-sm-row.layout-column > div:nth-child(2) > md-card > md-card-content > p').innerText
    })
    console.log(id, extractNumber(hours), extractNumber(sq), kw_bill.replace(" kW", ""), extractNumber(usage))
    await updateData(id, extractNumber(hours), extractNumber(sq), kw_bill.replace(" kW", ""), extractNumber(usage))

    await page.waitForTimeout(500)
  }
  catch(e){
    throw e
  }
}

(async () => {
  ListData = await fetchAll();

  console.log(ListData)
  // return
  const browser = await puppeteer.launch()
  // const browser = await puppeteer.launch({
  //     executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  //   headless: false
  // })
  page = await browser.newPage()
  await page.goto('https://sunroof.withgoogle.com/building/40.7331699/-73.2639021/#?f=buy')
  setInterval(scrapByAdressList, 3000)
  // browser.close()
})();
