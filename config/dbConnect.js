const mysql = require('mysql2')

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydb',
    waitForConnections: true,
    queueLimit: 0
  })

const dbConnect = () => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection)=>{
            if (err) {
                console.error('Error connecting to DB:', err);
                reject(err);
              } else {
                console.log('DB connected');
                resolve(connection);    
              }
        })
    })
}

module.exports = dbConnect;
