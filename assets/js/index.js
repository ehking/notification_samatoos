// const {app, BrowserWindow, dialog, session} = require('electron')
// const keytar = require('keytar');

const {app, BrowserWindow, dialog, session, Tray} = require('electron').remote
const {ipcRenderer} = require('electron');
const notifier = require('node-notifier');
const keytar = require('keytar');
const Swal = require('sweetalert');
var path = require('path');



function AjaxLogin(url_Office, username, password,capt) {
    url_salt = url_Office + 'module=Login&action=getSalt&uname=' + username;
    $.ajax({
        type:"GET",
        url:url_salt,
        timeout:5000,
        beforeSend:function () {
            showloading();
        },
        error:function () {
            error_login('ارتباط شما با سرور قطع میباشد',capt)
            hideloading();
        },
        success:function (data) {
            var salt=data;
            if (salt== '("")' ){
                error_login('نام کاربری و یا پسورد شما اشتباه میباشد لطفا دوباره تلاتش کنید',capt)
            }else{
                salt = salt.replace('("', '');
                salt = salt.replace('")', '');
                gettoken(url_Office,password,salt,capt,username);
            }
        }
    });
}

function error_login(error,capt){
    Swal("خطا در انجام عملیات",error,"error");
    if (capt===true)
        reloadcaptcha(url_Office);
    hideloading();
}
function  reloadcaptcha(url_office) {
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
    if(!capt)
        url_login = url_Office + 'module=Login&action=login' + '&username=' + username + '&pass=' + pass;
    else
        url_login = url_Office + 'module=Login&action=login' + '&username=' + username + '&pass=' + pass+'&captcha='+capt;

    // console.log(url_login);
    var res =[];
    $.ajax({
        type:"GET",
        url:url_login,
        timeout:8000,
        beforeSend:function () {
            showloading();
        },
        error:function () {
            error_login('ارتباط شما با سرور قطع میباشد',capt)
        },
        success:function (resp, status) {
            data = resp.replace('(', '');
            data = data.replace(')', '');
            var parsed = JSON.parse(data);
            arr =[];
            for (var x in parsed) {
                arr.push(parsed[x]);
            }
            if (arr[0]===true && !arr['error']){
                saveconfig(arr);
                var arry=getintro(url_Office);
            } else{
                Swal("خطا در انجام عملیات",arr[0],"error");
                error_login(arr[0],capt)
                // if (capt===true)
                //     reloadcaptcha(url_Office);
                // hideloading();
            }
        }
    });
}
// function  getsalt(url_office,username) {
//         showloading();
//         var state=false;
//         url_salt = url_office + 'module=Login&action=getSalt&uname=' + username;
//         $.ajax({
//             type:"GET",
//             url:url_salt,
//             async:false,
//             timeout:5000,
//             beforeSend:function () {
//                 showloading();
//             },
//             error:function () {
//                 hideloading();
//                 state=false;
//             },
//             success:function (data) {
//                 var salt=data;
//                 if (salt== '("")' ){
//                      state=false;
//                 }else{
//                     salt = salt.replace('("', '');
//                     salt = salt.replace('")', '');
//                     console.log(salt);
//                      state=salt;
//                 }
//             }
//         });
// return state;
// }
function gettoken(url_Office,password,salt,capt,username) {
    url_token = url_Office + 'module=Login&action=getPassToken';
    $.ajax({
        type:"GET",
        url:url_token,
        beforeSend:function () {
        showloading();
        },
        error:function () {
            error_login('ارتباط شما با سرور قطع میباشد',capt)
        },
        success:function (data, status) {
            if (status === "success") {
                var token = data;
                token = token.replace('("', '');
                token = token.replace('")', '');
                var sha1 = require('sha1');
                var md5 = require('md5');
               pass = sha1(md5(md5(password) + salt) + token);
               l_login(url_Office,capt,username,pass);
            }else{
                error_login('نام کاربری و یا پسورد شما اشتباه میباشد لطفا دوباره تلاتش کنید',capt)
            }
        }
    });
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
    if (newinbox === undefined || newinbox.length === 0){
                hideloading();
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
                // var msg=arr[j]['rname']."ds";
                notifier.notify(
                    {
                        title: 'شما یک نامه جدید دارید',
                        message: ' در سمت  '+arr[j]['rname'],
                        icon: path.join(__dirname, 'assets/icon/64x64.png'), // Absolute path (doesn't work on balloons)
                        sound: true, // Only Notification Center or Windows Toasters
                        wait: true // Wait with callback, until user action is taken against notification
                    },
                    function (err, response) {

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
                timeout:8000,
                beforeSend:function () {
                    showloading();
                },
                error:function () {
                    keylgin_try();
                },
                success:function (data, status) {

                    var key = data.replace('(', '');
                    key = key.replace(')', '')
                    var parsed = JSON.parse(key);
                    arr =[];
                    for (var x in parsed) {
                        arr.push(parsed[x]);
                    }
                    if (arr[0]=="password key not find" || arr['error']){
                        Swal("خطا در انجام عملیات","key login not find","error");
                        setTimeout(function () {
                            logout();
                        },5000)
                    }else{
                         landing_login();
                    }
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
    url_getintro = url_Office + 'module=Login&action=getIntro&reqname=intro';
    var arr = [];
     $.ajax({
        type:"GET",
        url:url_getintro,
         timeout:8000,
        success :function (res) {
            if (res !== '("access denied!")') {
                data = res.replace('(', '');
                data = data.replace(')', '');
                var parsed = JSON.parse(data);
                for (var x in parsed) {
                    arr.push(parsed[x]);
                }
                 saveintro(arr);
                 keytar.setPassword('config','on_inval',"0");
                ipcRenderer.send('landing');
            }else{
                keylgin_try();
                arr=false;
            }
        },
        beforeSend:function () {
            showloading();
        },
        error:function () {
            keylgin_try();
            // hideloading();
        }
    });
}
function getintro_landing(url_Office) {
    url_getintro = url_Office + 'module=Login&action=getIntro&reqname=intro';
    var arr = [];
    $.ajax({
        type:"GET",
        url:url_getintro,
        timeout:8000,
        success :function (res) {
            if (res !== '("access denied!")') {
                data = res.replace('(', '');
                data = data.replace(')', '');
                var parsed = JSON.parse(data);
                for (var x in parsed) {
                    arr.push(parsed[x]);
                }

                    shows_sa(arr,false);
                    hideloading();
                    cheek_intro(arr);
                    keytar.getPassword('config','time').then(function (time) {
                        set_intval(time);
                    }) // cheek_intro(arr);
            }else{
                console.log("d");
                loginkey();
            }
        },
        beforeSend:function () {
            showloading();
        },
        error:function () {
            keylgin_try();
            // hideloading();
        }
    });
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
     keytar.getPassword('url_Office','url_Office').then(function (data) {
        getintro_landing(data);
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
            time=600000;
            // time=5000;
            break;
        case "opt2":
            time=900000;
            // time=10000;
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
function cheek_captcha(url_Offices) {
    // url_Office=url_Offices+'&module=Captcha&action=show&width=173&height=50';
    url_Office=url_Offices+'&module=Captcha&action=check';
    $.ajax({
        type : "GET",
        url : url_Office,
        timeout:8000,
        // async:false,
        success: function (response) {
            data = response.replace('(', '');
            data = data.replace(')', '');
            var parsed = JSON.parse(data);
            if (parsed.success===true){
                keytar.setPassword('captcha','en_di',"true");
                captchareload(url_Offices);
            }else if (parsed.success===false) {
                setTimeout(function () {
                    $('#valid1').fadeOut(1000);
                    $('#valid2').fadeIn(2000);
                    $("#show_capt").fadeOut();
                    keytar.setPassword('url_Office','url_Office',url_Offices);
                    keytar.setPassword('captcha','en_di',"false");
                    hideloading();
                },1000)
            }
        },
        beforeSend: function(){
            showloading()
        },
        statusCode: {
            // 503: function() {
            //     alert("Username already exist");
            // }
        },
        error: function () {
            // alert("url cheeked");
            hideloading();
            swal({
                buttons:{
                    ok:{
                        text:"تلاش دوباره",
                        confirmButtonColor:"#DD6B55",
                        className:"btnok"
                    },
                    close:{
                        text:"بازگشت",
                        className:"btncan"
                    }
                },
                icon:"error",
                tittle:"خطا اتصال",
                text:" ارتباط شما با شبکه قطع میباشد"
            }).then((value)=> {
                switch (value) {
                    case "ok":
                        cheek_captcha(url_Offices);
                        break;
                    case "close":
                        break;
                    default:
                        cheek_captcha(url_Offices);
                        break;
                }
            });
        }
    });
}
function captchareload(url_Offices) {
    url_Office=url_Offices+'&module=Captcha&action=show&width=173&height=50';
    // url_Office=url_Offices+'&module=Captcha&action=check';
    $.ajax({
        type : "GET",
        url : url_Office,
        // data : JSON.stringify(data),
        timeout:5000,
        contentType: "application/json; charset=UTF-8",
        success: function (response) {
            // console.log(url_Office);
            setTimeout(function () {
                $('#imgcaptcha').attr('src',url_Office);
                $('#valid1').fadeOut(1000);
                $('#valid2').fadeIn(2000);
                $('#show_capt').fadeIn(2000);
                keytar.setPassword('url_Office','url_Office',url_Offices);
                hideloading();
            },1000)
        },
        beforeSend: function(){
            showloading()
        },
        statusCode: {
            // 503: function() {
            //     alert("Username already exist");
            // }
        },
        error: function () {
            // alert("url cheeked");
            hideloading();
            clearInterval();
            swal({
                buttons:{
                    ok:{
                        text:"تلاش دوباره",
                        confirmButtonColor:"#DD6B55",
                        className:"btnok"
                    },
                    close:{
                        text:"بازگشت",
                        className:"btncan"
                    }
                },
                icon:"error",
                tittle:"خطا اتصال",
                text:"ادرس وارد شده اشتباه و یا ارتباط شما با شبکه قطع میباشد"
            }).then((value)=> {
                switch (value) {
                    case "ok":
                        cheek_captcha(url_Offices);
                        break;
                    case "close":

                        break;
                    default:
                        cheek_captcha(url_Offices);
                        break;
                }
            });
        }
    });
    // $('#valid1').fadeOut(1000);
    //  $('#form2').fadeIn(2000);
}
