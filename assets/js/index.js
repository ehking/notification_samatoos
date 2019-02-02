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
                // console.log(login);
                if (login['success']===true && !login['error']){
                    // Swal("success",'success',"success");
                    // getintro(url_Office);
                    saveconfig(1);
                    ipcRenderer.send('landing');
                    return;
                } else{
                    Swal("خطا در انجام عملیات",login.error,"error");
                    reloadcaptcha(url_Office);
                    hideloading();
                    return;
                }
            }
        }
    }
    setTimeout(function () {
        Swal("error","error","error");
        reloadcaptcha(url_Office);
        hideloading();
    },1000);
}

function  reloadcaptcha(url_office) {
    // keytar.getPassword('captcha','en_di').then(function (data) {
    //    if (data===true){
    //        url_Office=url_Offices+'&module=Captcha&action=check';
    //    }
    // });
   url_captcha=url_office+'&module=Captcha&action=show&width=173&height=50';
   $.ajax({
       type:'GET',
       url:url_captcha,
       contentType: "application/json; charset=UTF-8",
       success:function (res) {
           $('#imgcaptcha').attr('src',url_Office);
       },
       error:function () {
           Swal("error","error","error");
       }
   });
}
function l_login(url_Office,capt,username,pass) {
    showloading();
    if(!capt)
        url_login = url_Office + 'module=Login&action=login' + '&username=' + username + '&pass=' + pass;
    else
        url_login = url_Office + 'module=Login&action=login' + '&username=' + username + '&pass=' + pass+'&captcha='+capt;

    // console.log(url_login);
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
        showloading();
        url_salt = url_office + 'module=Login&action=getSalt&uname=' + username;
        $.ajax({
            type:"GET",
            url:url_salt,
            async:false,
            timeout:5000,
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

function  logout() {
    // logout user
    keytar.deletePassword('config','islogin');
    ipcRenderer.send('login');
    Swal("success",'logout',"info");
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
    // saveconfig("1");
}

function shwointro(arr) {
    // const BrowserWindow = electron.BrowserWindow;
    // let win = new BrowserWindow({width: 400, height: 275});
    //  ipcRenderer.send('landing');
    // ipcRenderer.send('data1',arr);
    keytar.getPassword('inbox-store', 'inbox').then(function (data) {
        var sinbox = data;
        sinbox = sinbox.split(',');
        // console.log(sinbox)
        console.log(arr);
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
    if (def ===1) {
        keytar.setPassword('config', 'islogin', '1');
        keytar.setPassword('config', 'time', '5');
    } else {
        // user  value  configs
    }
}

function cheeklogin() {
    const keytar = require('keytar');
    keytar.getPassword('config', 'islogin').then(function (data) {
        console.log(data);
        if (data === 1) {
            // loginkey();
            ipcRenderer.send('landing');
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
    var arr = [];
     $.ajax({
        type:"GET",
        url:url_getintro,
        async:false,
        success :function (res) {
            if (res !== '("access denied!")') {
                data = res.replace('(', '');
                data = data.replace(')', '');
                var parsed = JSON.parse(data);
                for (var x in parsed) {
                    arr.push(parsed[x]);
                }
            }
        },
        beforeSend:function () {
            showloading();
        },
        error:function () {
            Swal("error","wedwed",'error');
            hideloading();
        }
    });
     return arr;
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


function logintry() {
    swal({
        buttons:{
            ok:{
                text:"تلاش دوباره"
            }
        },
        icon:"error",
        tittle:"خطا اتصال",
        text:"ادرس وارد شده اشتباه و یا ارتباط شما با شبکه قطع میباشد"
    }).then((value)=> {
        switch (value) {
            case "ok":
                // try login key login
                captchareload(url_Offices);
                break;
            default:
                captchareload(url_Offices);
                break;
        }
    });
}
function  shows_sa(arr){
    console.log(arr);
    for (var i=0;i<arr.length;i++){
        $(".swiper-wrapper").append("<div class=\"background swiper-slide\">\n" +
            "    <div class=\"container \">\n" +
            "        <div class=\"panel pricing-table\" style=\"background: linear-gradient(135deg,rgba(158, 15, 184, 0.70) -10%,rgba(5, 232, 255, 0.8) 180%);border-radius: 0;color: white\" >\n" +
            "\n" +
            "            <div class=\"pricing-plan\" >\n" +
            "                <h3 style=\"font-size:18px;position: absolute;margin: 0;top: 14px;right: 52px\">خلاصه وضعیت</h3>\n" +
            "                <p style=\"margin-bottom: 0\">سمت کاربر</p>\n" +
            "                <h2 class=\"pricing-header\" style=\"margin: 0;color: #47485f;font-size: 22px\">"+arr[i]['rname']+"</h2>\n" +
            "                </div>\n" +
            "\n" +
            "        </div>\n" +
            "    </div>\n" +
            "    <ul class=\"pricing-features\" style=\"float: right;margin-top: 0\">\n" +
            "        <li><span class=\"badge\" style=\"float: left\">"+arr[i]['state']['inbox1']+"</span>نامه های جدید </li>\n" +
            "        <li><span class=\"badge\" style=\"float: left\">"+arr[i]['state']['inbox2']+"</span>نامه های جدید در دست دستیار</li>\n" +
            "        <li><span class=\"badge\" style=\"float: left\">"+arr[i]['state']['performing']+"</span>نامه های در دست اقدام </li>\n" +
            "        <li><span class=\"badge\" style=\"float: left\">"+arr[i]['state']['track1']+"</span>نامه های تحت پیگیری شما</li>\n" +
            "        <li><span class=\"badge\" style=\"float: left\">"+arr[i]['state']['track2']+"</span>نامه های پیگیری شده از شما </li>\n" +
            "    </ul>\n" +
            "</div>");
    }
    swiper_load();
}
function  swiper_load() {
    var swiper = new Swiper('.swiper-container', {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        keyboard: {
            enabled: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });
}
function  landing_login(){
    // key login cheek
    // var y=getItem("url_Office","url_Office");
console.log("we");
    var y= keytar.getPassword('url_Office','url_Office').then(function (data) {
        var arr=getintro(data);
        shows_sa(arr);
        hideloading();
    });


    //
    //
    // showloading();
    //     console.log('dfg');

}


