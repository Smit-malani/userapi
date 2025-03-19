const express = require('express')
const router = express.Router()
const dbConnect = require('../config/dbConnect')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const verifyUser = require('../middlewares/auth')

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body
        const { profile_pic } = req.files

        if (!name || !email || !password || !profile_pic || !role) {
            res.status(400).send('All field must required')
        }

        let uploadPath = __dirname + /upload/ + profile_pic.name

        profile_pic.mv(uploadPath, (err) => {
            if (err) {
                return res.status(500).send('Error uploading image')
            }
        })

        const connection = await dbConnect()
        const sql1 = 'INSERT INTO user(name,email,password,profile_pic, role) VALUES (?,?,?,?,?)'

        const genSalt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, genSalt)

        const token = jwt.sign(
            {
                email,
                role
            },
            process.env.JWT_Secret_KEY
        )

        const values = [name, email, hashedPassword, profile_pic.name, role]

        connection.query(sql1, values, (err, result) => {
            if (err) {
                console.log(err)
                res.status(500).send('User alredy register with this email')
                return
            }

            console.log("User register successfully")
            res.status(201).json({ message: 'User register successfully', token })
            connection.release()

        })
    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).send('please provide both email and password')
        }

        const connection = await dbConnect()
        const sql = 'SELECT * FROM user WHERE email = ?'
        connection.query(sql, [email], async (err, result) => {
            if (err) {
                console.log('Error while fething user', err)
                res.status(500).send('Server error')
                connection.release()
                return
            }

            if (result[0].deleted_at) {
                return res.status(404).json({ message: 'User not found' })
            }

            if (result.length == 0) {
                return res.status(404).send('user not found')
            }

            const user = result[0]
            const isMatch = await bcrypt.compare(password, user.password)

            if (!isMatch) {
                return res.status(400).send('Invalid credentials')
            }


            const token = jwt.sign(
                {
                    email,
                    role: user.role
                },
                process.env.JWT_Secret_KEY
            )

            res.status(200).json({
                message: 'Logged in successfuly',
                token
            })
        }
        )
    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
})

router.patch('/userupdate/:id', verifyUser(['admin']), async (req, res) => {
    try {
        const { id } = req.params
        const { name, email, role } = req.body

        if (!name && !email && !role) {
            return res.status(400).send('At list one value must be provided')
        }

        const connection = await dbConnect()
        var queryValue = []
        var setValue = []

        if (name) {
            queryValue.push('name= ?')
            setValue.push(name)
        }

        if (email) {
            queryValue.push('email= ?')
            setValue.push(email)
        }
        if (role) {
            queryValue.push('role= ?')
            setValue.push(role)
        }

        setValue.push(id)

        const sql = `UPDATE user SET ${queryValue} WHERE id = ?`
        connection.query(sql, setValue, (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send('Sever error')
            }

            if (result.affectedRows == 0) {
                res.status(404).send('User not found')
            }

            console.log('User updated successfuly')
            res.status(200).send({ message: 'User Updated successfuly' })
            connection.release()
        })

    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
})

router.delete('/userdelete/:id', verifyUser(['admin']), async (req, res) => {
    try {
        const { id } = req.params
        const now = new Date()
        const nowtime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
        const formattedNow = nowtime.toISOString().slice(0, 19).replace('T', ' ');

        const connection = await dbConnect()
        const sql = 'UPDATE user SET deleted_at= ?  WHERE id = ?'

        connection.query(sql, [formattedNow, id], (err, result) => {
            if (err) {
                console.log(err)
                res.status(500).send('server error')
            }

            if (result.affectedRows == 0) {
                res.status(404).send('User not found')
            }

            console.log('User Deleted successfuly')
            res.status(200).send({ message: 'User Deleted successfuly' })
            connection.release()

        })

    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
})

module.exports = router
