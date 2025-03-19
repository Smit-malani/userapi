const express = require('express');
const router = express.Router();
const dbConnect = require('../config/dbConnect');
const verifyUser = require('../middlewares/auth');

router.post('/addcategory', async (req, res) => {
    try {
        const { name } = req.body
        if (!name) {
            res.status(400).send('name is required')
        }

        const connection = await dbConnect()

        const sql = 'insert into category(name) values(?)'
        connection.query(sql, [name], (err, result) => {
            if (err) {
                console.log(err);    
                res.status(500).send('Error while inserting data')
                return;
            } 
            console.log("Category added successfully")
            res.status(201).json({ message: 'Category added successfully' })
            connection.release()
        })

    } catch (err) {
        console.log(err)
        res.status(500).send('Server error');
    }
})

router.patch('/updatecategory/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { name } = req.body

        if (!id) {
            res.status(400).send('id is required')
        }

        if (!name) {
            res.status(400).send('name is required')
        }

        const connection = await dbConnect()

        const queryValue = []
        const setValue = []

        if (name) {
            queryValue.push('name = ?')
            setValue.push(name)
        }

        setValue.push(id)

        const sql = `UPDATE category SET  ${queryValue}  WHERE id = ?`
        connection.query(sql, setValue, (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send('Sever error')
            }

            if (result.affectedRows == 0) {
                return res.status(404).send('Category not found')
            }

            console.log('Category updated successfuly')
            res.status(200).send({ message: 'Category Updated successfuly' })
            connection.release()
        })

    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
})

router.delete('/deletecategory/:id', async (req, res) => {
    try {
        const { id } = req.params

        const now = new Date()
        const nowtime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
        const formattedNow = nowtime.toISOString().slice(0, 19).replace('T', ' ')
        

        const connection = await dbConnect()

        const sql = 'UPDATE category SET deleted_at= ?  WHERE id = ?'

        connection.query(sql, [formattedNow, id], (err, result) => {
            if (err) {
                console.log(err) 
                res.status(500).send('server error')
            }

            if (result.affectedRows == 0) {
                res.status(404).send('Category not found')
            }


            const sql2 = 'UPDATE product SET deleted_at = ? WHERE category_id = ?'
            connection.query(sql2, [formattedNow, id],(err, result)=>{
                if(err){
                    console.log(err)
                    res.status(500).send('Server error')
                }
            })

            console.log('Category Deleted successfuly')
            res.status(200).send({ message: 'Category Deleted successfuly' })
            connection.release()
        })
    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
})

router.get('/getcategory', async (req, res) => {
    try {
        const connection = await dbConnect()

        connection.query('select * from category', (err, result) => {
            const filterResult = result.filter((data) => !data.deleted_at)

            if (err) {
                console.log(err)
                return res.status(500).send('Error while fetching Product')
            }

            console.log('category fetched successfully')
            res.status(200).json({ message: 'category fetch successfully', result: filterResult })
        })

    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
})

module.exports = router;