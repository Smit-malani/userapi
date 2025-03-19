const express = require('express');
const router = express.Router();
const dbConnect = require('../config/dbConnect');
const verifyUser = require('../middlewares/auth');
const fs = require('fs')

router.post('/addproduct', verifyUser(['admin', 'sub-admin']), async (req, res) => {
    try {
        const { name, price, qty, category_id } = req.body
        const { product_img } = req.files

        if (!name || !price || !qty || !product_img || !category_id) {
            return res.status(400).send('All the fields are required')
        }

        let uploadPath = __dirname + /upload/ + product_img.name

        product_img.mv(uploadPath, (err) => {
            if (err) {
                return res.status(500).send('Error uploading image')
            }
        })

        const connection = await dbConnect()

        const sql = 'insert into product(name, price, qty, image, category_id)values(?,?,?,?,?)'
        const values = [name, price, qty, product_img.name, category_id]

        connection.query(sql, values, (err, result) => {
            if (err) {
                console.log(err)
                return res.send(500).send('Error while inserting data')

            }
            console.log('Product inserted successfully')
            res.status(201).json({ message: 'Productr inserted successfully', result })
            connection.release()
        })
    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
})

router.patch('/updateproduct/:id', verifyUser(['admin', 'sub-admin']), async (req, res) => {
    try {
        const { id } = req.params
        const { name, price, qty, category_id } = req.body
        const img = req?.files


        if (!name && !price && !qty && !category_id && !img) {
            return res.status(400).send('At list one value must be provided')
        }

        const connection = await dbConnect()


        connection.query(`SELECT image FROM product where id = ${id}`, (err, result) => {
            if (err) {
                console.log(err);
                res.send('Server error')
            }
            if (result.length > 0) {
                let filePath = __dirname + /upload/ + result[0].image
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err)
                        return res.send('Error while deleting file')
                    }
                })
            }
        })

        let uploadPath = __dirname + /upload/ + img?.product_img?.name

        img?.product_img.mv(uploadPath, (err) => {
            if (err) {
                return res.status(500).send('Error uploading image')
            }
        })

        const queryValue = []
        const setValue = []

        if (name) {
            queryValue.push('name = ?')
            setValue.push(name)
        }

        if (price) {
            queryValue.push('price = ?')
            setValue.push(price)
        }

        if (qty) {
            queryValue.push('qty = ?')
            setValue.push(qty)
        }

        if (category_id) {
            queryValue.push('category_id = ?')
            setValue.push(category_id)
        }

        if (img?.product_img) {
            queryValue.push('image = ? ')
            setValue.push(img?.product_img?.name)
        }

        setValue.push(id)

        const sql = `UPDATE product SET ${queryValue} WHERE id = ?`
        connection.query(sql, setValue, (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send('Error while updating data')
            }
            console.log('product updated successfully')
            res.status(200).send('Product updated successfully')
        })

    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
})

router.delete('/deleteproduct/:id', verifyUser(['admin', 'sub-admin']), async (req, res) => {
    try {
        const { id } = req.params
        const now = new Date()
        const nowtime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
        const formattedDate = nowtime.toISOString().slice(0, 19).replace('T', ' ');

        const connection = await dbConnect()

        const sql = 'UPDATE product SET deleted_at= ?  WHERE id = ?'

        connection.query(sql, [formattedDate, id], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send('User not found')
            }
            console.log('Product deleted successfully')
            res.status(200).send('Product deleted successfully')
        })
    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
})

router.get('/getproduct', async (req, res) => {
    try {
        const connection = await dbConnect()

        connection.query('select * from product', (err, result) => {
            const filterResult = result.filter((data) => !data.deleted_at)

            if (err) {
                console.log(err)
                return res.status(500).send('Error while fetching Product')
            }

            console.log('product fetched successfully')
            res.status(200).json({ message: 'Product fetch successfully', result: filterResult })
        })

    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
})

module.exports = router