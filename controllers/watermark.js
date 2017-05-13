/**
 * Created by as on 2017/5/6.
 */
module.exports = {
    'POST /figure': async (ctx, next) => {
        let mu = parseInt(ctx.request.body.mu, 10);
        let sigma = parseInt(ctx.request.body.sigma, 10);
        let num = parseInt(ctx.request.body.num, 10);
        let N = function (mu, sigma, x) {
            return 10000000 / (Math.sqrt(2 * Math.PI) * sigma) * Math.exp(- (x - mu) * (x - mu) / (2 * sigma * sigma));
        };
        var fx = [], x = [], T = 1000, fx2 = [], x3 = [];
        for (var i = 0; i < 1000; i ++) {
            fx2[i] = 0;
        }
        var x1 = mu - 3 * sigma, x2 = mu + 3 * sigma;
        for (var i = 0; i < 1000; i ++) {
            x3.push(i);
        }
        for (var i = x1; i <= x2; i += Math.round(6 * sigma / num)) {
            x.push(i);
            var temp = i + Math.random() * i / 50000 - i / 100000;
            fx.push(N(mu, sigma, temp));
            fx2[Math.round(temp) % T] ++;
        }
        let data = {};
        data.x = x;
        data.fx = fx;
        data.x3 = x3;
        data.fx2 = fx2;
        ctx.response.type = 'application/json';
        ctx.response.body = JSON.stringify(data, null, 4);
    },

    'POST /ISBW': async (ctx, next) => {
        // 生成水印编码
        let waterMark = [];
        for (let i = 0; i < 32; i ++) {
            let temp = Math.round(Math.random());
            if (temp === 0)
                temp = -1;
            waterMark.push(temp);
        }
        let o = 10000, T = 500, l = 32, r = 12;
        // interval[i]: 第i个时隙开始的时间
        let interval = [10000];
        let n = l * r;
        for (var i = 1; i < 2 * n; i ++) {
            interval[i] = interval[i - 1] + T;
        }

        console.log(interval.length);

        let A = [], B = [];

        // 随机函数，从0到2n-1中随机选出n个不同的数
        function groupA(n) {
            var A = [];
            for (var i = 0; i < 2 * n; i++) {
                A.push(i);
            }
            A.sort(
                function () {
                    return 0.5 - Math.random();
                }
            );
            A.length = n;
            return A;
        }

        A = groupA(n);
        for (var i = 0; i < 2 * n; i ++) {
            var flag = 0;
            for (let j = 0; j < n; j ++) {
                if (i === A[j]) {
                    flag = 1;
                    break;
                }
            }
            if (flag === 0) {
                B.push(i);
            }
        }

        console.log(B.length === A.length);
        // 判断是否有重复
        function f(arr) {
            for (var i = 0; i < arr.length; i ++) {
                for (var j = i + 1; j < arr.length; j ++) {
                    if (arr[i] === arr[j]) {
                        return false;
                    }
                }
            }
            return true;
        }

        console.log(f(A) + ' ' + f(B) + ' ' + f(A.concat(B)));
        var flag = 1;
        for (var i in A) {
            for (var j in B) {
                if (A[i] === B[j]) {
                    flag = 0;
                    break;
                }
            }
            if (flag === 0)
                break;
        }
        console.log(flag);
        console.log(A.length === l * r);

        // 获取数据包
        // 数据包数量以及数据包对象组成的数组
        let pNum = 8000, A1 = [], B1 = [];
        for (var i = 0; i < pNum; i ++) {
            let temp = {};
            // 数据包的绝对时间戳
            temp.t1 = Math.round(Math.random() * 2 * n * T + o);
            // 计算数据包的所属时隙
            for (var j = 0; j < interval.length -1; j ++) {
                if (temp.t1 >= interval[j] && temp.t1 < interval[j + 1]) {
                    temp.index = j;
                    break;
                }
            }
            // 判断数据包的分组
            temp.group = 'B';
            for (var j in A) {
                if (temp.index === A[j]) {
                    temp.group = 'A';
                    break;
                }
            }
            if (temp.group === 'A') {
                A1.push(temp);
            } else {
                B1.push(temp);
            }
        }
        var x = [], fx = [];
        for (var i =  0; i < T; i ++) {
            x[i] = i;
            fx[i] = 0;
        }
        let pkg = A1.concat(B1);
        for (var i in pkg) {
            fx[(pkg[i].t1 - o) % T] ++;
        }
        let data = {
            x: x,
            fx: fx
        };
        let sum = 0;
        for (let i = 0; i < T; i ++) {
            sum += x[i] * fx[i];
        }
        console.log(sum / pNum);
        
        function cent() {
            
        }
        ctx.response.type = 'application/json';
        ctx.response.body = JSON.stringify(data, null, 4);
        await next();
    }
};