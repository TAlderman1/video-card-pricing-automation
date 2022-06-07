import { Builder, By, Key, until } from 'selenium-webdriver';
import fs from 'fs';
import * as _ from "lodash";

(async function primaryAutomation() {
    // inteface for tally object
    interface modelNumbers {
        3080: number,
        3070: number,
        3060: number
    }

    // create objects for storage of all prices on page, will filter later
    function createObjects(item: string, price: string, url: string) {
        return {
            "item": item,
            "price": price,
            "date": getFormatttedDate(),
            "URL": url
        }
    };

    // get date in format M/D/YYYY
    function getFormatttedDate() {
        const today = new Date();
        const month = ("0" + (today.getMonth() + 1)).slice(-2);
        const day = ("0" + today.getDate()).slice(-2);
        const date = `${month}/${day}/${today.getFullYear()}`;
        return date;
    }

    // array of video card model numbers
    const videoCardModels = [3080,3070,3060];

    // initialize final array
    let finalArrProductInfo: any = [];

    // initialize final model top 3 pricing array of arrays of objects
    let finalArrProductInfoSorted: any = [];

    // initialize tally object
    const finalTallyObj: modelNumbers = {
        3080: 0,
        3070: 0,
        3060: 0
    }

    // Build browser, maximize window, navigate to URL
    let driver = await new Builder().forBrowser('chrome').build();
    await driver.manage().window().maximize();

    // search for each video model, and begin primary work to scrape data
    for (const videoCardModel of videoCardModels){

        // open homepage amazon
        await driver.get('https://amazon.com');

        // enter in video card models into search bar
        await driver.findElement(By.id('twotabsearchtextbox')).sendKeys(`NVIDIA ${videoCardModel}`, Key.ENTER);
    
        // gather array of elements matching '3080' for ex.
        let searchProductsArray = await driver.findElements(By.xpath(`//a/span[contains(text(), "${videoCardModel}")]`));

        // iterate over all links containing product number and gather information
        for (let i=0; i<searchProductsArray.length; i++){

            finalTallyObj[videoCardModel as keyof modelNumbers]++;
            console.log(finalTallyObj);

            // refresh list of search results
            searchProductsArray = await driver.findElements(By.xpath(`//a/span[contains(text(), "${videoCardModel}")]`));
            
            // click on link based on iterable
            await searchProductsArray[i].click();

            // delay 1s page load
            await driver.sleep(1000);

            // scrape product title, price, and URL
            const productTitle = await driver.findElement(By.xpath('//span[@id="productTitle"]')).getText();
            const productURL = await driver.getCurrentUrl();
            let productPriceBackup: string = "";
            let outputObj = null;
            
            // price selector try/catch setup due to inconsistent formatting/selectors
            try {
                try {
                    const productPriceArr: string = await driver.findElement(By.xpath('//*[@id="olp_feature_div"]')).getText();
                    const productPrice: RegExpMatchArray | any = productPriceArr.match(/\d?\,?\d{1,3}.\d{2}/g);
                    outputObj = createObjects(productTitle, productPrice[0].replace(',', '').replace('\\n','.'), productURL);
                } catch {
                    try {
                        productPriceBackup = await driver.findElement(By.xpath('//*[@class="a-price aok-align-center"]')).getText();
                    } catch {
                        productPriceBackup = await driver.findElement(By.xpath('//span[contains(@class, "offer-price")]')).getText();
                    } finally {
                        outputObj = createObjects(productTitle, productPriceBackup, productURL);
                    }
                }
            } catch {
                outputObj = createObjects(productTitle, "error finding pricing information", productURL)
            }
            
            // create output object of item info and push to array
            finalArrProductInfo.push(outputObj);

            // back in browser & delay
            await driver.navigate().back();
            await driver.sleep(2000);
        }

        // sort array of objects by price
        finalArrProductInfo = _.sortBy(finalArrProductInfo, ["price"]);

        // get best 3 prices for products in arrays
        await finalArrProductInfoSorted.push(finalArrProductInfo.slice(0,3));

        // flatten array of array of objects
        finalArrProductInfoSorted = await finalArrProductInfoSorted.flat();

        // csv formatting logic
        const csvString: string = [
            [
              "Item Information",
              "Price",
              "Date of check",
              "URL for Amazon Listing"
            ],
            ...finalArrProductInfoSorted.map((prodInfo: { item: string; price: string|number; date: string; URL: string; }) => [
              prodInfo.item,
              prodInfo.price,
              prodInfo.date,
              prodInfo.URL
            ])
          ]
           .map(e => e.join(",")) 
           .join("\n");
        
        // write output CSV file
        fs.writeFile('finalResults.csv', csvString, (err) => {
            if (err) {  throw err;  }
            console.log("JSON data is saved.");
    });
    };
    // log when automation completes work
    console.log("...automation complete...")

    // close browser
    await driver.quit();
})();
