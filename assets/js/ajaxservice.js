const {app, BrowserWindow, dialog, session, Tray} = require('electron').remote
const {ipcRenderer} = require('electron');
const notifier = require('node-notifier');
const keytar = require('keytar');

function AjaxService(url_Office, username, password) {
    url_salt = url_Office + 'module=Login&action=getSalt&uname=' + username;
    $.get(url_salt, function (data, status) {
        if (status === "success") {
            var salt = data;
            salt = salt.replace('("', '');
            salt = salt.replace('")', '');
            url_token = url_Office + 'module=Login&action=getPassToken';
            $.get(url_token, function (data, status) {
                if (status === "success") {
                    var token = data;
                    token = token.replace('("', '');
                    token = token.replace('")', '');
                    var sha1 = require('sha1');
                    var md5 = require('md5');
                    var pass = sha1(md5(md5(password) + salt) + token);
                    url_login = url_Office + 'module=Login&action=login' + '&username=' + username + '&pass=' + pass;
                    $.get(url_login, function (data, status) {
                        data = data.replace('(', '');
                        data = data.replace(')', '');
                        var obj= JSON.parse(data);
                        if(obj.error==='نام كاربر و يا كلمه عبور نامعتبر مي باشد و یا مهلت نشست جاری به اتمام رسیده است و باید صفحه را بروز نمایید.')
                        {
                            alert(data);
                            captchareload();
                        }else if(obj.success=true){
                            alert('login')
                        }
                    });
                } else {
                    alert('url cheeked')
                }
            })
        } else {
            alert('url cheeked or username cheeked')
        }
    })
}


function saveintro(arr, islogin) {
    var newinbox = []
    for (var i = 0; i < arr.length; i++) {
        newinbox.push(arr[i]['state']['inbox1']);
    }
    // keytar.setPassword('inbox-store','inbox','null')
    keytar.setPassword('inbox-store', 'inbox', newinbox);
    if (islogin !== "1") {
        return  shwointro(arr);
    }
    saveconfig("1");
}

function shwointro(arr) {
    // const BrowserWindow = electron.BrowserWindow;
    // let win = new BrowserWindow({width: 400, height: 275});
    //  ipcRenderer.send('landing');
    // ipcRenderer.send('data1',arr);
    keytar.getPassword('inbox-store', 'inbox').then(function (data) {
        var sinbox = data
        sinbox = sinbox.split(',');
        // console.log(sinbox)
        console.log(arr)
        for (var j = 0; j < arr.length; j++) {
            var inbox = arr[j]['state']['inbox1']
            var ssinbox = sinbox[j]
            console.log(inbox)
            console.log(ssinbox)
            if (inbox > ssinbox) {
                notifier.notify(
                    {
                        title: 'شما یک نامه جدید دارید',
                        message: arr[j]['rname'],
                        // icon: path.join(__dirname, 'coulson.jpg'), // Absolute path (doesn't work on balloons)
                        sound: true, // Only Notification Center or Windows Toasters
                        wait: true // Wait with callback, until user action is taken against notification
                    },
                    function (err, response) {
                        // Response is response from notification
                    }
                );
            }
        }
        saveintro(arr, "1");
        keytar.getPassword('config','time').then(function (data) {
            setTimeout(cheeklogin, data)
        });
    });


    // for (var i=0;i<arr.length();i++){
    //     $(".swiper-wrapper").append("  <div class=\"blog-slider__item swiper-slide\">\n" +
    //         "            <div class=\"blog-slider__content\">\n" +
    //         "                <span class=\"blog-slider__code\">خلاصه وضعیت</span>\n" +
    //         "                <p class=\"p_title\">سمت</p>\n" +
    //         "                <div class=\"blog-slider__title\">"+arr[i][rname]+"</div>\n" +
    //         "                <div class=\"blog-slider__text\">نامه های جدید: <span class=\"badge\">"+arr[i]['state']['inbox']+"</span></div>\n" +
    //         "                <div class=\"blog-slider__text\">نامه های جدید در دست دستیار:  <span class=\"badge\">"+arr[i]['state']['inbox1']+"</span></div>\n" +
    //         "                <div class=\"blog-slider__text\">نامه های در دست اقدام:  <span class=\"badge\">"+arr[i]['state']['inbox']+"</span></div>\n" +
    //         "                <div class=\"blog-slider__text\">نامه های تحت پیگیری شما:  <span class=\"badge\">"+arr[i]['state']['inbox']+"</span></div>\n" +
    //         "                <div class=\"blog-slider__text\">نامه های پیگیری شده از شما:  <span class=\"badge\">"+arr[i]['state']['inbox']+"</span></div>\n" +
    //         "            </div>\n" +
    //         "        </div> .");
    // }


}

function saveconfig(def) {
    if (def === "1") {
        keytar.setPassword('config', 'islogin', '1');
        keytar.setPassword('config', 'time', '5');
    } else {
        // user  value  configs
    }
}

function cheeklogin() {
    const keytar = require('keytar');
    keytar.getPassword('config', 'islogin').then(function (data) {
        if (data === "2") {
            loginkey();
        } else {
            window.location.replace('login.html')
        }
    }).catch(function () {
        window.location.replace('login.html')
    });

}
function loginkey() {
   keytar.getPassword('url_Office','url_Office').then(function (data) {
       url_Offices=data;
       keytar.getPassword('keylogin','keylogin').then(function (data) {
           alert(url_Office);
           url_Office=url_Offices+'module=Login&action=KeyLogin='+data;
           $.get(url_Office,function (data,status) {
               if (data==='({"success":true})'){
                   getintro(url_Offices)
               }
           })
       });
   }).catch(function () {
       alert('not login please login')
   })
}

function getintro(url_Office) {
    url_getintro = url_Office + 'module=Login&action=getIntro&reqname=intro';
    $.get(url_getintro, function (data, status) {
        if (data !== '("access denied!")') {
            data = data.replace('(', '');
            data = data.replace(')', '');
            var parsed = JSON.parse(data);
            var arr = [];
            for (var x in parsed) {
                arr.push(parsed[x]);
            }
            keytar.getPassword('config', 'islogin').then(function (data) {
                if (data === "1") {
                    shwointro(arr);
                    return true
                } else {
                    saveintro(arr)
                    return true
                }
            }).catch(function () {
                saveintro(arr)
                return true
            });
        } else {
            alert('no');
            return false;
        }
    })
}


