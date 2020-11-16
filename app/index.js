const Koa = require('koa')
const app = new Koa()

const parameter = require('koa-parameter')
const koaBody = require('koa-body')
const koaStatic = require('koa-static')
const path = require('path')

const routing = require('./routes/index')
const error = require('./middleware/error')
const db = require('./startup/db')

app.use(koaStatic(path.join(__dirname, 'public')))
app.use(error())
app.use(
    koaBody({
        multipart: true,
        formidable: {
            uploadDir: path.join(__dirname, '/public/uploads'),
            keepExtensions: true,
        },
    })
)
app.use(parameter(app))

//初始化
routing(app)
db()

app.listen(8080, () => {
    console.log('app in running at 8080 port')
})
