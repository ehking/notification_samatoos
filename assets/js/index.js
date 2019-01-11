// const {app, BrowserWindow, dialog, session} = require('electron')
// const keytar = require('keytar');

const {app, BrowserWindow, dialog, session, Tray} = require('electron').remote
const {ipcRenderer} = require('electron');
const notifier = require('node-notifier');
const keytar = require('keytar');
const Swal = require('sweetalert');


function AjaxService(url_Office, username, password,capt) {
    var salt=getsalt(url_Office,username);
    if (salt){
        var pass=gettoken(url_Office,password,salt);
        if (pass){
            var login=l_login(url_Office,capt,username,pass);
            if (login){
                console.log(login);
            }
        }
    }
    setTimeout(function () {
        Swal("error","error","error");
        hideloading();
    },2000);
}
function l_login(url_Office,capt,username,pass) {
    if(!capt)
        url_login = url_Office + 'module=Login&action=login' + '&username=' + username + '&pass=' + pass;
    else
        url_login = url_Office + 'module=Login&action=login' + '&username=' + username + '&pass=' + pass+'&captcha='+capt;

    $.ajax({
        type:"GET",
        url:url_login,
        async:false,
        beforeSend:function () {
            showloading();
            var islogin = false;
        },
        error:function () {
            islogin=false;
        },
        success:function (data, status) {
            data = data.replace('(', '');
            data = data.replace(')', '');
            islogin= JSON.parse(data);
        }
    });
    return islogin;

}
function  getsalt(url_office,username) {

        url_salt = url_office + 'module=Login&action=getSalt&uname=' + username;

        $.ajax({
            type:"GET",
            url:url_salt,
            async:false,
            beforeSend:function () {
                showloading();
                var state=false;
            },
            error:function () {
                hideloading();
                state=false;
            },
            success:function (data) {
                var  salt=data;
                if (salt== '("")' ){
                     state=false;
                }else{
                    salt = salt.replace('("', '');
                    salt = salt.replace('")', '');
                     state=salt;
                }
            }
        });
return state;
}
function gettoken(url_Office,password,salt) {
    url_token = url_Office + 'module=Login&action=getPassToken';
    $.ajax({
        type:"GET",
        url:url_token,
        async: false,
        beforeSend:function () {
        showloading();
            var  pass=false;
        },
        error:function () {
            hideloading();
            pass=false;
        },
        success:function (data, status) {
            if (status === "success") {
                var token = data;
                token = token.replace('("', '');
                token = token.replace('")', '');
                var sha1 = require('sha1');
                var md5 = require('md5');
               pass = sha1(md5(md5(password) + salt) + token);
            }
        }
    });
    return pass;
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
            ipcRenderer.send('login');
        }
    }).catch(function () {
        ipcRenderer.send('login');
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
function showloading() {
    $('.load-wrapp').fadeIn()
}
function hideloading() {
    $('.load-wrapp').fadeOut()
}

//  function alerts(titile,message,icon) {
//      alert("er");
//     switch (icon) {
//         case 1:
//             icon='success';
//             break;
//         case 2:
//             icon='error';
//             break;
//         case 3:
//             icon='warning';
//             break;
//         case 4:
//             icon='info';
//             break;
//         case 5:
//             icon='question';
//             break;
//         default :
//             icon='info';
//
//
//             Swal(
//                 'fgh',
//                 'fgfgh',
//                 'info'
//             )
//     }
// }


