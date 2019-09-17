// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

var rp = require("request-promise");

// 云函数入口函数
exports.main = async(event, context) => {
    return rp(`${event.url}&start=${event.start}&count=${event.count}`)
        .then(res => {
            console.log(res)
            return res
        })
        .catch(err => {
            console.log(err)
        })
}