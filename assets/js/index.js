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
                // console.log(login[1])
                if (login[0]===true && !login['error']){
                    // Swal("success",'success',"success");
                    // getintro(url_Office);
                    saveconfig(login);
                    var arr=getintro(url_Office);
                    saveintro(arr);
                    keytar.setPassword('config','on_inval',"0");
                    ipcRenderer.send('landing');
                    return;

                } else{
                    Swal("خطا در انجام عملیات",login[0],"error");
                    if (capt===true)
                        reloadcaptcha(url_Office);
                    hideloading();
                    return;
                }
            }
        }
    }
    setTimeout(function () {
        Swal("خطا در انجام عملیات","نام کاربری و یا پسورد شما اشتباه میباشد لطفا دوباره تلاتش کنید","error");

     if (capt===true)    {
         reloadcaptcha(url_Office);
     }
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
           Swal("خطا در انجام عملیات","نام کاربری و یا پسورد شما اشتباه میباشد لطفا دوباره تلاتش کنید","error");
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
    var res =[];
    $.ajax({
        type:"GET",
        url:url_login,
        async:false,
        beforeSend:function () {
            showloading();
            res = false;
        },
        error:function () {
            res=false;
        },
        success:function (resp, status) {
            data = resp.replace('(', '');
            data = data.replace(')', '');
            var parsed = JSON.parse(data);
            arr =[];
            for (var x in parsed) {
                arr.push(parsed[x]);
            }
            res=arr;
        }
    });
    return res;
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
    keytar.deletePassword('config','islogin');
    keytar.deletePassword('keylogin','keylogin');
    keytar.deletePassword('config', 'islogin');
    keytar.deletePassword('config', 'time');
    keytar.deletePassword('config','time_che');
    ipcRenderer.send('login');
    // setTimeout(function () {
    //    // Swal("success",'logout',"info");
    // },1000)
}


function saveintro(arr) {
    var newinbox = [];
    for (var i = 0; i < arr.length; i++) {
        newinbox.push(arr[i]['state']['inbox1']);
    }
    // keytar.setPassword('inbox-store','inbox','null')
    // console.log(newinbox);
    if (newinbox === undefined || newinbox.length === 0){
            loginkey();
    }else{
        keytar.setPassword('inbox-store', 'inbox', newinbox);
    }

}

function cheek_new_letter(arr,res) {
        var sinbox = res;
        // console.log(arr);
        // console.log(res);
       var  sinbox = sinbox.split(',');
        // console.log(sinbox)
        // console.log(arr);
        for (var j = 0; j < arr.length; j++) {
            var inbox = arr[j]['state']['inbox1'];
            var ssinbox = sinbox[j];
            // console.log(inbox);
            // console.log(ssinbox);
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
        saveintro(arr);
}

function saveconfig(res) {

    var keylogin=res[1]
    keytar.setPassword('keylogin','keylogin',keylogin);
        keytar.setPassword('config', 'islogin', '1');
        keytar.setPassword('config', 'time', '900000');
    keytar.setPassword('config','time_che',"opt2");
}

function cheeklogin() {
    const keytar = require('keytar');
    keytar.getPassword('config', 'islogin').then(function (data) {
        if (data === "1") {
             loginkey();
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
            // alert(url_Office);
            url_keylogin=url_Offices+'module=Login&action=KeyLogin&KeyLogin='+data;
            $.ajax({
                type:"GET",
                url:url_keylogin,
                async: false,
                beforeSend:function () {
                    showloading();
                },
                error:function () {
                    keylgin_try();
                },
                success:function (data, status) {
                    landing_login();
                    // console.log("e");
                }
            });
        });
    }).catch(function () {
        Swal("خطا در انجام عملیات","خطا در انجام عملیات","error");
        logout();
        // ipcRenderer.send('login')
    });
}

function getintro(url_Office) {
    showloading();
    url_getintro = url_Office + 'module=Login&action=getIntro&reqname=intro';
    var arr = [];
     $.ajax({
        type:"GET",
        url:url_getintro,
        async:false,
         timeout:8000,
        success :function (res) {
            if (res !== '("access denied!")') {
                data = res.replace('(', '');
                data = data.replace(')', '');
                var parsed = JSON.parse(data);
                for (var x in parsed) {
                    arr.push(parsed[x]);
                }
            }else{
                // off internet ot keylogin
                keylgin_try();
                arr=false;
            }
        },
        beforeSend:function () {
            showloading();
        },
        error:function () {
            arr=false;
            keylgin_try();
            // hideloading();
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

function  cheek_intro(arr) {
keytar.getPassword('config','islogin').then(function (data) {
    if (data==="1"){
        keytar.getPassword('inbox-store','inbox').then(function (res) {
            // console.log(res);
            cheek_new_letter(arr,res);
        })
    } else{
        //redirect login
        ipcRenderer.send('login');
    }
})
}

function logintry() {
    swal({
        buttons:{
            ok:{
                text:"تلاش دوباره",
                confirmButtonColor:"#DD6B55",
                className:"btnok"
            },
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
function keylgin_try() {
    showloading();
    // console.log("d");
    swal({
        buttons:{
            close:{
                text:"خروج",
                className:"btncan"
            },
            ok:{
                text:"تلاش دوباره",
                confirmButtonColor:"#DD6B55",
                className:"btnok"
            },

        },
        confirmButtonColor:"#DD6B55",
        icon:"error",
        tittle:"خطا اتصال",
        text:" ارتباط شما با شبکه قطع میباشد"
    }).then((value)=> {
        switch (value) {
            case "ok":
                loginkey();
                break;
            case "close":
                logout();
                break;
            default:
                loginkey();
                break;
        }
    });
}
function  shows_sa(arr,bool){
    if(bool===true) {
        // console.log("11");
        for (var i = 0; i < arr.length; i++) {
            $(".swiper-wrapper").append("<div class=\"background swiper-slide\">\n" +
                "    <div class=\"container \">\n" +
                "        <div class=\"panel pricing-table\" style=\"background: linear-gradient(135deg,rgba(158, 15, 184, 0.70) -10%,rgba(5, 232, 255, 0.8) 180%);border-radius: 0;color: white\" >\n" +
                "\n" +
                "            <div class=\"pricing-plan\" >\n" +
                "                <h3 style=\"font-size:18px;position: absolute;margin: 0;top: 14px;right: 52px\">خلاصه وضعیت</h3>\n" +
                "                <p style=\"margin-bottom: 0\">سمت کاربر</p>\n" +
                "                <h2 class=\"pricing-header\" style=\"margin: 0;color: #47485f;font-size: 22px\">" + arr[i]['rname'] + "</h2>\n" +
                "                </div>\n" +
                "\n" +
                "        </div>\n" +
                "    </div>\n" +
                "    <ul class=\"pricing-features\" style=\"float: right;margin-top: 0\">\n" +
                "        <li><span class=\"badge\" style=\"float: left\">" + arr[i]['state']['inbox1'] + "</span>نامه های جدید </li>\n" +
                "        <li><span class=\"badge\" style=\"float: left\">" + arr[i]['state']['inbox2'] + "</span>نامه های جدید در دست دستیار</li>\n" +
                "        <li><span class=\"badge\" style=\"float: left\">" + arr[i]['state']['performing'] + "</span>نامه های در دست اقدام </li>\n" +
                "        <li><span class=\"badge\" style=\"float: left\">" + arr[i]['state']['track1'] + "</span>نامه های تحت پیگیری شما</li>\n" +
                "        <li><span class=\"badge\" style=\"float: left\">" + arr[i]['state']['track2'] + "</span>نامه های پیگیری شده از شما </li>\n" +
                "    </ul>\n" +
                "</div>");
        }
        swiper_load();
    }else{
        // console.log("22");
        $(".swiper-wrapper").empty();
        shows_sa(arr,true);
    }
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
    var y= keytar.getPassword('url_Office','url_Office').then(function (data) {
        var arr=getintro(data);
        if (arr!==false) {
            shows_sa(arr,false);
            hideloading();
            // console.log(arr);
            cheek_intro(arr);
            keytar.getPassword('config','time').then(function (time) {
                set_intval(time);
            })
        }else{
            loginkey()
        }
    });
}
function set_intval(time) {
    keytar.getPassword('config','on_inval').then(function (data) {
        if (data==="1"){

        } else{
            var id_intval=setInterval(function () {
                landing_login();
            },time);
            // console.log(time);
            keytar.setPassword('config','on_inval',"1");
            keytar.setPassword('config','id_intval',id_intval);
        }
    })
}

function set_time(id) {
    // console.log(id);
    var time;
    switch (id) {
        case "opt1":
            // time=600000
            time=5000;
            break;
        case "opt2":
            // time=900000;
            time=10000;
            break;
        case "opt3":
            time=1200000;
            break;
        case "opt4":
            time=1800000;
            break;
        case "opt5":
            time=3600000;
            break;
        default:
                time=900000;
                break
    }
    clearint();
    keytar.setPassword('config','time',time);
    keytar.setPassword('config','time_che',id);
    keytar.setPassword('config','on_inval',"-1");
    setTimeout(function () {
        set_intval(time);
    },5000);

}
function clearint(){
    keytar.getPassword('config','id_intval').then(function (data) {
        clearInterval(data);
        clearInterval();
    })
}
function  logout_alert() {
    swal({
        buttons:{
            close:{
                text:"بازگشت",
                className:"btnok"
            },
            ok:{
                text:"خروج",
                confirmButtonColor:"#DD6B55",
                className:"btncan"
            },
        },
        icon:"error",
        tittle:"خارج شدن",
        text:" آیا میخواهید از حساب کاربری خود خارج شوید"
    }).then((value)=> {
        switch (value) {
            case "ok":
                logout();
                break;
            case "close":
                break;
            default:
                break;
        }
    });
}
function app_exit(){
    swal({
        buttons:{
            ok:{
                text:"خروج",
                confirmButtonColor:"#DD6B55",
                className:"btncan"
            },
            close:{
                text:"بازگشت",
                className:"btnok"
            }
        },
        icon:"error",
        tittle:"خارج شدن",
        text:" آیا میخواهید از برنامه خارج شوید"
    }).then((value)=> {
        switch (value) {
            case "ok":
                ipcRenderer.send('exit');
                break;
            case "close":
                break;
            default:
                break;
        }
    });
}

