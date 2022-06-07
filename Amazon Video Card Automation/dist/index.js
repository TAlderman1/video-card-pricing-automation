"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
const fs_1 = __importDefault(require("fs"));
(function primaryAutomation() {
    return __awaiter(this, void 0, void 0, function* () {
        // create objects for storage of all prices on page, will filter later
        function createObjects(item, price, url) {
            return {
                "item": item,
                "price": price ? price : "Error getting pricing information",
                "date": getFormatttedDate(),
                "URL": url
            };
        }
        ;
        // get date in format M/D/YYYY
        function getFormatttedDate() {
            const today = new Date();
            const month = ("0" + (today.getMonth() + 1)).slice(-2);
            const day = ("0" + today.getDate()).slice(-2);
            const date = `${month}/${day}/${today.getFullYear()}`;
            return date;
        }
        // array of video card model numbers
        const videoCardModels = [3080, 3070, 3060];
        // initialize final array
        const finalArrProductInfo = [];
        // initialize tally object
        const finalTallyObj = {
            3080: 0,
            3070: 0,
            3060: 0
        };
        // Build browser, maximize window, navigate to URL
        let driver = yield new selenium_webdriver_1.Builder().forBrowser('chrome').build();
        yield driver.manage().window().maximize();
        // search for each video model, and begin primary work to scrape data
        for (const videoCardModel of videoCardModels) {
            // open homepage amazon
            yield driver.get('https://amazon.com');
            // enter in video card models into search bar
            yield driver.findElement(selenium_webdriver_1.By.id('twotabsearchtextbox')).sendKeys(`NVIDIA ${videoCardModel}`, selenium_webdriver_1.Key.ENTER);
            // gather array of elements matching '3080' for ex.
            let searchProductsArray = yield driver.findElements(selenium_webdriver_1.By.xpath(`//a/span[contains(text(), "${videoCardModel}")]`));
            for (let i = 0; i < searchProductsArray.length; i++) {
                finalTallyObj[videoCardModel]++;
                console.log(finalTallyObj);
                // refresh list of search results
                searchProductsArray = yield driver.findElements(selenium_webdriver_1.By.xpath(`//a/span[contains(text(), "${videoCardModel}")]`));
                // click on link based on iterable
                yield searchProductsArray[i].click();
                // delay 1s page load
                yield driver.sleep(1000);
                // scrape product title, price, and URL
                const productTitle = yield driver.findElement(selenium_webdriver_1.By.xpath('//span[@tid="productTitle"]')).getText();
                const productURL = yield driver.getCurrentUrl();
                let productPriceBackup = "";
                let outputObj = null;
                // price selector try/catch setup due to inconsistent formatting/selectors
                try {
                    const productPriceArr = yield driver.findElement(selenium_webdriver_1.By.xpath('//*[@id="olp_feature_div"]')).getText();
                    const productPrice = yield productPriceArr.match(/\d?\,?\d{1,3}.\d{2}/g);
                    outputObj = yield createObjects(productTitle, productPrice[0].replace(',', ''), productURL);
                }
                catch (_a) {
                    try {
                        productPriceBackup = yield driver.findElement(selenium_webdriver_1.By.xpath('//*[@class="a-price aok-align-center"]')).getText();
                    }
                    catch (_b) {
                        productPriceBackup = yield driver.findElement(selenium_webdriver_1.By.xpath('//span[contains(@class, "offer-price")]')).getText();
                    }
                    finally {
                        outputObj = yield createObjects(productTitle, productPriceBackup, productURL);
                    }
                }
                // create output object of item info and push to array
                finalArrProductInfo.push(outputObj);
                // back in browser & delay
                yield driver.navigate().back();
                yield driver.sleep(2000);
            }
            // write output file (array of objects)
            fs_1.default.writeFile('finalResults.json', JSON.stringify(finalArrProductInfo), (err) => {
                if (err) {
                    throw err;
                }
                console.log("JSON data is saved.");
            });
        }
        ;
        // close browser
        yield driver.quit();
    });
})();
// await driver.wait(until.elementLocated(By.id('nav-logo-sprites')), 10000);
// correct or remove checkbox click to filter to NVIDIA graphics cards or "brand"
// break objects into separate arrays by model number, sort arrays by price in objects, slice to return 3 best prices
