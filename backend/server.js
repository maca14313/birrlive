const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 8000;
const cors = require('cors');

// Create a connection to MySQL (without specifying a database)


const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '0925090339'
});

// Connect to MySQL
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL');

  // Create the BirrLive database
  const createDatabase = 'CREATE DATABASE IF NOT EXISTS BirrLive';
  connection.query(createDatabase, (err) => {
    if (err) throw err;
    console.log('Database BirrLive created or already exists');

    // Use the BirrLive database
    connection.query('USE BirrLive', (err) => {
      if (err) throw err;

      // Create the Banks table
      const createBanksTable = `
        CREATE TABLE IF NOT EXISTS Banks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        );
      `;

      connection.query(createBanksTable, (err) => {
        if (err) throw err;
        console.log('Banks table created or already exists');
      });

      // Create the Currencies table
      const createCurrenciesTable = `
        CREATE TABLE IF NOT EXISTS Currencies (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          country_code VARCHAR(10) NOT NULL,
          buying DECIMAL(10, 2) NOT NULL,
          selling DECIMAL(10, 2) NOT NULL,
          bank_id INT,
          FOREIGN KEY (bank_id) REFERENCES Banks(id)
        );
      `;

      connection.query(createCurrenciesTable, (err) => {
        if (err) throw err;
        console.log('Currencies table created or already exists');
      });
    });
  });
});


app.use(cors());
app.use(express.json());

////  Add a New Bank

app.post('/banks', (req, res) => {
  console.log(req.body);
  const { name } = req.body;

  if (!name) {
      return res.status(400).json({ message: 'Bank name is required' });
  }

  // First, check if the bank name already exists
  connection.query('SELECT * FROM Banks WHERE name = ?', [name], (err, results) => {
      if (err) {
          console.error('Error checking for existing bank:', err);
          return res.status(500).json({ message: 'Error checking for existing bank' });
      }

      if (results?.length > 0) {
        console.log('Bank name already exists')
          return res.status(400).json({ message: 'Bank name already exists' });
      }

      // Fetch existing currencies
      connection.query('SELECT * FROM Currencies', (err, currencies) => {
          if (err) {
              console.error('Error fetching currencies:', err);
              return res.status(500).json({ message: 'Error fetching currencies' });
          }

          // Remove duplicate currencies by name
          const uniqueCurrencies = [];
          const currencyNames = new Set();

          currencies.forEach(currency => {
              if (!currencyNames.has(currency.name)) {
                  uniqueCurrencies.push(currency);
                  currencyNames.add(currency.name);
              }
          });

          // Insert the new bank
          connection.query(
              'INSERT INTO Banks (name) VALUES (?)',
              [name],
              (err, results) => {
                  if (err) {
                      console.error('Error creating bank entry:', err);
                      return res.status(500).json({ message: 'Error creating bank entry' });
                  }
                  const newBankId = results.insertId;

                  // If there are no currencies, just return the bank creation response
                  if (uniqueCurrencies?.length === 0) {
                     console.log('Bank added successfully with no Currencies ')
                      return res.json({ message: 'Bank added successfully', id: newBankId });
                  }

                  // Prepare the queries to insert new currencies with the new bank ID
                  const currencyQueries = uniqueCurrencies.map(currency => {
                      return new Promise((resolve, reject) => {
                          connection.query(
                              'INSERT INTO Currencies (name, country_code, buying, selling, bank_id) VALUES (?, ?, ?, ?, ?)',
                              [currency.name, currency.country_code, 0.0, 0.0, newBankId],
                              (err, results) => {
                                  if (err) {
                                      reject(err);
                                  } else {
                                      resolve(results);
                                  }
                              }
                          );
                      });
                  });

                  // Execute all currency insert queries
                  Promise.all(currencyQueries)
                      .then(() => {
                        console.log('Bank added successfully')
                          res.json({ message: 'Bank added successfully', id: newBankId });
                      })
                      .catch(err => {
                          console.error('Error creating currencies for new bank:', err);
                          res.status(500).json({ message: 'Error creating currencies for new bank' });
                      });
              }
          );
      });
  });
});


/*
app.post('/banks', (req, res) => {
    console.log(req.body)
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Bank name is required' });
      }
   
    connection.query(
      'INSERT INTO Banks (name) VALUES (?)',
      [name],
      (err, results) => {
        if (err) {
          console.error('Error creating bank entry:', err);
          return res.status(500).json({ message: 'Error creating bank entry' });
        }
        res.json({ message: 'Bank added successfully', id: results.insertId });
      }
    );
  }); */

////  Add a New Currency
/*  app.post('/currencies', (req, res) => {
    console.log(req.body)
    const { name, country_code, buying, selling, bank_id } = req.body;
    connection.query(
      'INSERT INTO Currencies (name, country_code, buying, selling, bank_id) VALUES (?, ?, ?, ?, ?)',
      [name, country_code, buying, selling, bank_id],
      (err, results) => {
        if (err) throw err;
        res.json({ message: 'Currency added successfully', id: results.insertId });
      }
    );
  }); */


  app.post('/currencies', (req, res) => {
    console.log(req.body);
    const { name, country_code } = req.body;
    

    connection.query('SELECT * FROM Currencies WHERE name = ?',[name], (err, currency) => {

       if(currency==undefined || currency?.length == 0){

        console.log('currency not found')
        connection.query('SELECT id FROM Banks', (err, banks) => {
          if (err) throw err;
      
          // If no banks found, return an error
          if (banks?.length === 0) {
            return res.status(404).json({ message: 'No banks found' });
          }
      
          // Insert the new currency for each bank
          const values = banks.map(bank => [name, country_code, 0.0, 0.0, bank.id]);
      
          connection.query(
            'INSERT INTO Currencies (name, country_code, buying, selling, bank_id) VALUES ?',
            [values],
            (err, results) => {
              if (err) throw err;
              res.json({ message: 'Currency added successfully' });
            }
          );
        });
       } else{
        console.log('the same currency found')
        return res.status(404).json({ message: 'the same currency found' })
       }
    })
  
  });


  app.get('/banks-with-currencies', (req, res) => {
    const query = `
      SELECT b.id AS bank_id, b.name AS bank_name, 
             c.id AS currency_id, c.name AS currency_name, c.country_code, c.buying, c.selling
      FROM Banks b
      LEFT JOIN Currencies c ON b.id = c.bank_id
    `;
  
    connection.query(query, (err, results) => {
      if (err) throw err;
      
      const banks = {};
      
      results.forEach(row => {
        if (!banks[row.bank_id]) {
          banks[row.bank_id] = {
            id: row.bank_id,
            name: row.bank_name,
            currencies: []
          };
        }
        
        if (row.currency_id) {
          banks[row.bank_id].currencies.push({
            id: row.currency_id,
            name: row.currency_name,
            country_code: row.country_code,
            buying: row.buying,
            selling: row.selling
          });
        }
      });
      res.json(Object.values(banks));
    });
  });


  app.get('/currencies', (req, res) => {
    connection.query('SELECT * FROM Currencies', (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });

  //Currency
  
  app.put('/currencies/:id', (req, res) => {
    console.log(req.body)
    const { id } = req.params;
    const { buying, selling } = req.body;
    connection.query(
      'UPDATE Currencies SET buying = ?, selling = ? WHERE id = ?',
      [buying, selling, id],
      (err, results) => {
        if (err) throw err;
        res.json({ message: 'Currency updated successfully' });
      }
    );
  });



  app.get('/banks-currencies', (req, res) => {

    
    const getBanksQuery = 'SELECT id, name FROM Banks';
    const getCurrenciesQuery = 'SELECT DISTINCT name, country_code FROM Currencies';
    
    connection.query(getBanksQuery, (err, banks) => {
      if (err) return res.status(500).json({ message: 'Error fetching banks' });
  
      connection.query(getCurrenciesQuery, (err, currencies) => {
        if (err) return res.status(500).json({ message: 'Error fetching currencies' });
  
        // Ensure currencies include both name and country_code
        const formattedCurrencies = currencies.map(currency => ({
          name: currency.name,
          country_code: currency.country_code
        }));
  
        res.json({ banks, currencies: formattedCurrencies });
      });
    });
  });

  app.post('/convert', (req, res) => {

    console.log(req.body)
    const { amount, bankId, currencyName } = req.body;
  
    const getCurrencyQuery = `
      SELECT buying, selling 
      FROM Currencies 
      WHERE bank_id = ? AND name = ?`;
  
    connection.query(getCurrencyQuery, [bankId, currencyName], (err, results) => {
      if (err) return res.status(500).json({ message: 'Error fetching currency rates' });
  
      if (results.length === 0) return res.status(404).json({ message: 'Currency not found for selected bank' });
  
      const { buying, selling } = results[0];
  
      // Assuming conversion uses buying rate
      const convertedAmount = amount * buying;
      res.json({ convertedAmount });
    });
  });



app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
