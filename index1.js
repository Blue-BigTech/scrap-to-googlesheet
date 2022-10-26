// const sheetdb = require('sheetdb-node');

// // create a config file
// var config = {
//   address: 'fvudv9z06pz5j',
//   auth_login: 'BASIC_AUTH_login',
//   auth_password: 'BASIC_AUTH_password',
// };

// // Create new client
// var client = sheetdb(config);

// // Get first two rows from the first worksheet
// client.read({ limit: 2 }).then(function(data) {
//     console.log(data);
//   }, function(err){
//     console.log(err);
//   });



const puppeteer = require('puppeteer')
const {createServer} = require('http');
const hostname = '127.0.0.1';
const port = 3000;
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

async function scrape() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    // product: 'firefox',
      headless: false
  })
  
  // const browser = await puppeteer.launch()
    page = await browser.newPage()


  var obj = {
    'sunlight': '',
    'solarpanel': '',
    'bill': ''
  }

  await page.goto('https://sunroof.withgoogle.com/building/40.7331699/-73.2639021/#?f=buy&b=90')
  var elmt_Sunlight = await page.waitForSelector("body > div.view-wrap > address-view > div.main-content-wrapper > div > div > section.section.section-map > div.address-map-panel > md-card:nth-child(2) > ul > li:nth-child(1) > div.panel-fact-text.md-body")
  var txt_Sunlight = await page.evaluate(element => element.textContent, elmt_Sunlight)

  var elmt_SolarPanel = await page.waitForSelector("body > div.view-wrap > address-view > div.main-content-wrapper > div > div > section.section.section-map > div.address-map-panel > md-card:nth-child(2) > ul > li:nth-child(2) > div.panel-fact-text.md-body")
  var txt_SolarPanel = await page.evaluate(element => element.textContent, elmt_SolarPanel)

  var elmt_Bill = await page.waitForSelector("#select_value_label_1 > span:nth-child(1) > div ")
  var txt_Bill = await page.evaluate(element => element.textContent, elmt_Bill)

  var elmt_Bill = await page.waitForSelector("#select_value_label_1 > span:nth-child(1) > div ")
  var txt_Bill = await page.evaluate(element => element.textContent, elmt_Bill)
  
  obj['sunlight'] = txt_Sunlight
  obj['solarpanel'] = txt_SolarPanel
  obj['bill'] = txt_Bill

  await page.type('#input-0', '119 Louisiana Ave, Bay Shore, NY 11706');
  await page.waitForSelector('#md-option-0-0')
  await page.click('#md-option-0-0')
  await page.waitForNavigation({
    waitUntil: 'load',
  });
  await page.waitForSelector('body > div.view-wrap > address-view > div.main-content-wrapper > div > div > section.section.section-fine-tune > div > md-content.md-padding._md.layout-gt-sm-row.layout-column > div:nth-child(2) > md-card > md-card-content > div > div.recommended-kw')

  await page.waitForSelector('#select_value_label_1')
  await page.click('#select_value_label_1')

  const bill = 175
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
  
  await page.waitForTimeout(100000)
  browser.close()
}
scrape()
