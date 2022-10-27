const puppeteer = require('puppeteer')
const {createServer} = require('http');
const sheetdb = require('sheetdb-node');

const hostname = '127.0.0.1';
const port = 3000;
var page = null;
var bScrapping = false
var ListData = null
const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

const client = sheetdb({ address: 'idd4bc1hqx5tj' });

const extractNumber = (str) => {
  let num = str.match(/\d/g);
  num = num.join("");
  return num
}

const fetchAll = async () => {
  return client.read().then( data => {
    const arr = Array.from(JSON.parse(data)).map(record => {
      if(record.Address !== ""){
        return {
          id: record.Id,
          addr: record.Address,
          bill: extractNumber(record.Bills),
          update: true
        }
      }
    });
    return arr.filter((item) => {
      return item !== undefined
    })
  }, (error => {
    console.log(error);
  }));
}

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
      return
    }
    await page.keyboard.press('Enter')

    await page.waitForNavigation({
      waitUntil: 'load',
    });
    await page.waitForSelector('body > div.view-wrap > address-view > div.main-content-wrapper > div > div > section.section.section-fine-tune > div > md-content.md-padding._md.layout-gt-sm-row.layout-column > div:nth-child(2) > md-card > md-card-content > div > div.recommended-kw')
  
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
    console.log(extractNumber(hours), extractNumber(sq), kw_bill.replace(" kW", ""))
    client.update(
      'Id', id,
      { 
        'Total Hours': extractNumber(hours), 
        'Total Sqft': extractNumber(sq),
        'Total KW': kw_bill.replace(" kW", "")
      },
      'Google Sunroof'
    ).then(function (data) {
        console.log(data);
    }, function (err) {
        console.log(err);
    });

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
  await page.goto('https://sunroof.withgoogle.com/building/40.7331699/-73.2639021/#?f=buy&b=90')
  
  setInterval(scrapByAdressList, 3000)
  // browser.close()
})();
