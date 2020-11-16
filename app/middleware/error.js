const error = require('koa-json-error')

module.exports = () => {
    return error({
        //开发阶段不显示堆栈信息
        postFormat: (e, { stack, ...rest }) =>
            process.env.NODE_ENV === 'production' ? rest : { stack, ...rest },
    })
}
