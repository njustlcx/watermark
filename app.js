/**
 * Created by as on 2017/5/4.
 */
const Koa = require('koa');
const bodyPaser = require('koa-bodyparser');
const router = require('koa-router')();
const serve = require('koa-static');
const views = require('koa-views');
const controller = require('./controller');

const app = new Koa();

app.use(views(__dirname + '/views', {
    map: {
        html: 'ejs'
    }
}));

app.use(bodyPaser());
app.use(router.routes());
app.use(serve(__dirname + '/public'));
app.use(controller());
app.listen(3000);
console.log('The server is running on http://localhost:3000/');