 const sheetdb = require('sheetdb-node');

// // create a config file
var config = {
  address: 'plzoqxqw4y5iq',
  auth_login: 'BASIC_AUTH_login',
  auth_password: 'BASIC_AUTH_password',
};

// Create new client
var client = sheetdb(config);

// var addr_temp = []
 function addrFromSheet(addr){
    client.read({offset: 1 }).then(function(data) {
      var dd = JSON.parse(data)
      console.log("asdfadfasdf")
      for(var i = 0; i < dd.length; i++){
      // console.log("---------------")
        addr.push(dd[i].INPUT);
      }
    }, function(err){
      console.log(err);
  });
}

// client.read({ limit: 2 }).then(function(data) {
//   console.log(data);
//   console.log('success')
// }, function(err){
//   console.log(err);
//   console.log('err')
// });

// addrFromSheet(addr_temp);
var temp_data = [
  { addr: '1325 Lombardy Blvd, Bay Shore, NY 11706', bill : 100},
  {addr: '11 Chenango Dr, Bay Shore, NY 11706', bill : 125},
  {addr: '1357 N Windsor Ave, Bay Shore, NY 11706', bill : 150},
  {addr: '1394 N Clinton Ave, Bay Shore, NY 11706', bill : 300},
  {addr: '15 Cortina Way, Bay Shore, NY 11706', bill : 275},
  {addr: '119 Louisiana Ave, Bay Shore, NY 11706', bill : 200},
  {addr: '1382 Saxon Ave, Bay Shore, NY 11706', bill : 150},
]

const puppeteer = require('puppeteer')
const {createServer} = require('http');

const hostname = '127.0.0.1';
const port = 3000;
var page = null;
var bScrapping = false;

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

console.log("this");

const extractNumber = (str) => {
  let num = str.match(/\d/g);
  num = num.join("");
  return num
}
const scrapByAdressList = async () => {
  scrapFunc(temp_data)
  console.log("interval")
}
 
const scrapFunc = async (listInData) => {
  if(bScrapping){
    console.log("OnScraping")
    return
  }
  bScrapping = true
  let bill = 175
  let address = '1382 Saxon Ave, Bay Shore, NY 11706'
  listInData.map(async snippet => {
    address = snippet.addr
    bill = snippet.bill
    console.log(address, bill)
    await page.type('#input-0', addresses[j]);
    console.log('#md-option-0-0')
    await page.waitForSelector('#md-option-0-0')
    console.log('#md-option-0-1')
    await page.click('#md-option-0-0')
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
    console.log(count)
    let s_Selector = '#select_option_7'
    for(let i=0; i<count; i++){
      if(bill == mdLists[i].bill){
        s_Selector = '#' + mdLists[i].id
        break
      }
    }

    await page.waitForSelector(s_Selector)
    await page.click(s_Selector)

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
    console.log(extractNumber(hours), extractNumber(sq), kw_bill)

  })
  for(var j = 0; j < addresses.length; j++){
    console.log(j)
    console.log(addresses[j])
  }
  bScrapping = false
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    // product: 'firefox',
    headless: false
  })
  page = await browser.newPage()
  await page.goto('https://sunroof.withgoogle.com/building/40.7331699/-73.2639021/#?f=buy&b=90')
  // await page.waitForTimeout(1500)
  
  setInterval(scrapByAdressList, 10000)
  
  // browser.close()
})();
