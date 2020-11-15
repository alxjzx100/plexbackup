const fs = require("fs");
const findRemoveSync = require('find-remove');
const sqlite3 = require('sqlite3').verbose();
let moment = require('moment');
const dir = './txt'; //PATH where to store .txt files
const plexDb = './com.plexapp.plugins.library.db'; //PATH to Plex database file
let file_name = moment().format('D-MM-Y H_mm_ss')+".txt";

let result = findRemoveSync(dir, {age: {seconds: 86400*7}, extensions: '.txt', limit: 100}); //86400*7 - older than 7 days
console.log('Deleted '+Object.keys(result).length+' file(s)');

let db = new sqlite3.Database(plexDb, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the plex database.');
});

db.serialize(() => {
    //metadata_items.metadata_type=1  - means "Movies". May vary? Specified at library_sections table
    db.each(`SELECT 
  	metadata_items.title as Title,
  	metadata_items.year as Year,
  	media_parts.file AS Filename 
  		FROM metadata_items JOIN media_parts 
  							JOIN media_items 
  		WHERE metadata_items.metadata_type=1 
  		AND metadata_items.id=media_items.metadata_item_id 
  		AND media_items.id=media_parts.media_item_id 
  		ORDER BY metadata_items.title`, (err, row) => {
        if (err) {
            console.error(err.message);
        }
        fs.appendFileSync(dir+"/"+file_name, row.Title + ";" + row.Year + ";" + row.Filename+"\n");
    });
});

db.close();