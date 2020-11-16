const mongoose = require('mongoose')
const { dbUrl } = require('../config')

mongoose.set('useFindAndModify', false)

module.exports = () => {
    mongoose.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    mongoose.connection.on('error', () => {
        console.error
    })
    mongoose.connection.once('open', () => {
        console.log('数据库连接成功')
    })
    mongoose.connection.once('close', () => {
        console.log('数据库断开连接')
    })
}
