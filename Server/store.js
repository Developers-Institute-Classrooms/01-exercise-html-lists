const fs = require('fs');


const dataInitFilename = key => `db/${key}.init.json`;
const dataStoreFilename = key => `db/${key}.store.json`;

const load = (key, done) => {
  const storeFilename = dataStoreFilename(key);
  fs.readFile(`${__dirname}/${storeFilename}`, 'utf8', (storeErr, storeData) => {
    if (!storeErr) {
      console.log(`${key} loaded from ${storeFilename}`);
      done( JSON.parse(storeData) );

    } else {
      const initFilename = dataInitFilename(key);
      fs.readFile(`${__dirname}/${initFilename}`, 'utf8', (initErr, initData) => {
        if (!initErr) {
          console.log(`${key} loaded from ${initFilename}`);
          done( JSON.parse(initData) );
    
        } else {
          console.log(`${key} set to []`);
          done( [] );
        }
      });
    }
  });
};

const persist = (key, value) => {
  const storeFilename = dataStoreFilename(key);
  const json = JSON.stringify(value);
  fs.writeFile(`${__dirname}/${storeFilename}`, json, (err) => {
    if (err) {
      throw err;
    } else {
      console.log(`stored ${key}`);
    }
  });
};


module.exports = { load, persist };
