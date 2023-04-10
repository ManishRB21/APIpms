/*
Private and confidential Zenith 2019 ver.3.5.1
Last Update by 05/06/2019 by Zenith
*/

if (typeof IS_MIA_PROJECT === "undefined") {
    var IS_MIA_PROJECT = false;
}

$(document).ready(function() {
    window.addEventListener("message", function(e) {
        //logConsole('postMessage: ' + e.data);
        if(e.data === 'event_resend_am_requests') {
            localStorage.setItem("token_renew_pending", 0);
            $( window ).trigger('event_resend_am_requests');
        } else if (e.data === 'event_open_iot_setting_page') {
            location.href = 'iot-setting/index.html?callback=' + encodeURIComponent(location.href)
                //'https://' + GLOBAL_SERVER_IP + ':9443/iot-setting?callback=' + encodeURIComponent(location.href)
                + '&roomnumber=' + getCookie('roomnumber')
                + '&access_token=' + localStorage.getItem('access_token')
                + '&commType=' + COM_TYPE + '&serverip=' + GLOBAL_SERVER_IP;
        }
    }, false);

    window.addEventListener("storage", function(e){
        if(e.key ==="loadingGroupData" && e.newValue === "true") {
            setCookie("videoStartChannelNumber",  getLocalStorageObject("channellist").startupChannel, COOKIE_EXPIRE_DAYS);
        }
        if(e.key === "channellist" && parent.uiConfigUseGroups) {
            var paidChannels = JSON.parse(localStorage.getItem("paidChannellist"));

            var newChannels = JSON.parse(LZString.decompress(e.newValue));
            if(!_.isNull(paidChannels) && !_.has(newChannels, "orgChannels")) { //add paid channel
                newChannels.orgChannels = newChannels.channels;
                newChannels.channels = _.union(newChannels.channels, paidChannels);

                newChannels = LZString.compress(JSON.stringify(newChannels));
                localStorage.setItem("channellist", newChannels );
                setChannels();
            }
            // setTimeout(setChannels(undefined, updateChannelWidget), 2000); //sort channels
            setTimeout(setChannels(undefined,function(){
                if(_.isUndefined(_.find(newChannels.channels, function(ch){
                        return ch.logicalChannelNumber == parseInt(getCookie('current_channel'))
                    }))) {
                    setCookie('previous_channel', getCookie("startChannelLogicalNumber"), COOKIE_EXPIRE_DAYS);
                    if(getCookie("portal_mode") === PORTAL_MODE_TV) {
                        if(PORTAL_ACTIVE){
                            expiredChannelToStartChannel();
                        } else {
                            expiredChannelToStartChannel();
                            SetPortalStatus(SHOW_PORTAL);
                            goHomePro(function(){setTimeout(updateChannelWidget,1000);});
                        }
                    }
                } else {
                    setTimeout(updateChannelWidget,500);
                }
            }), 2000);
        }
    }, false);

    /* Whenever document including lg_common_tv.js is ready,
     * token_renew_pending should set 0.
     * When a page is reloaded or changed, callback about the refreshToken can not be called.
     * And then, do not call refreshToken again.
     * Because, the refreshToken can be called before autoMapTv is done.
     * It cause infinite loop. */
    localStorage.setItem("token_renew_pending", 0);
});

var IS_IFRAME = (window.self != window.top) || (window.location != window.parent.location);
var ENABLE_INSPECTOR = localStorage.getItem("ENABLE_INSPECTOR");
var logData = [];

var eventInfo;
var channels;
var ch_categories = new Array();
var ch_languages = new Array();
var channels_json_filepath = 'channels.json';
var session_id;
var editor_mode = getCookie("editor_mode");
var hcap_ready = 0;

var PORTAL_ACTIVE     = true;
var SHOW_PORTAL       = true;
var HIDE_PORTAL       = false;
var LOG_MESSAGE_TYPES = {
    milestone_completed: {
        'name':'milestone_completed',
        'color': 'green'
    },
    event_received: {
        'name':'event_received',
        'color': 'purple'
    },
    error: {
        'name':'error',
        'color': 'red'
    },
    information: {
        'name':'information',
        'color': 'dodgerblue'
    }
};

var GLOBAL_SERVER_IP = "10.221.44.71";
var GLOBAL_SERVER_PORT = "80";
var COM_TYPE = "IP";
var DATA_CHANNEL = "58000";
var GLOBAL_SECRET = "6143b5a7110566489711696143b5a71105c8595224596143b5a71105e6389249156143b5a71105f4394786976143b5a71106";
var currentXAIT = "223";
var screencast_array = {"status":"success"};
var master_language_array = {"al_AL":{"lang_name":"Albanian","is_default":"0","is_enabled":"0"},"ar_AE":{"lang_name":"Arabic","is_default":"0","is_enabled":"0"},"bs_BA":{"lang_name":"Bosnian","is_default":"0","is_enabled":"0"},"bg_BG":{"lang_name":"Bulgarian","is_default":"0","is_enabled":"0"},"zh_CN":{"lang_name":"Chinese (PRC)","is_default":"0","is_enabled":"0"},"zh_HK":{"lang_name":"Chinese (Hong Kong)","is_default":"0","is_enabled":"0"},"zh_SG":{"lang_name":"Chinese (Singapore)","is_default":"0","is_enabled":"0"},"zh_TW":{"lang_name":"Chinese (Taiwan)","is_default":"0","is_enabled":"0"},"hr_HR":{"lang_name":"Croatian","is_default":"0","is_enabled":"0"},"cs_CZ":{"lang_name":"Czech","is_default":"0","is_enabled":"0"},"da_DK":{"lang_name":"Danish","is_default":"0","is_enabled":"0"},"nl_NL":{"lang_name":"Dutch","is_default":"0","is_enabled":"0"},"en_CA":{"lang_name":"English (CA)","is_default":"0","is_enabled":"0"},"en_GB":{"lang_name":"English (UK)","is_default":"0","is_enabled":"0"},"en_US":{"lang_name":"English (US)","is_default":"1","is_enabled":"1"},"et_EE":{"lang_name":"Estonian","is_default":"0","is_enabled":"0"},"fa_IR":{"lang_name":"Farsi","is_default":"0","is_enabled":"0"},"fi_FI":{"lang_name":"Finnish","is_default":"0","is_enabled":"0"},"fr_FR":{"lang_name":"French","is_default":"0","is_enabled":"0"},"de_DE":{"lang_name":"German","is_default":"0","is_enabled":"0"},"el_GR":{"lang_name":"Greek","is_default":"0","is_enabled":"0"},"he_IL":{"lang_name":"Hebrew","is_default":"0","is_enabled":"0"},"hu_HU":{"lang_name":"Hungarian","is_default":"0","is_enabled":"0"},"it_IT":{"lang_name":"Italian","is_default":"0","is_enabled":"0"},"ja_JP":{"lang_name":"Japanese","is_default":"0","is_enabled":"0"},"kk_KZ":{"lang_name":"Kazakh","is_default":"0","is_enabled":"0"},"ko_KR":{"lang_name":"Korean","is_default":"0","is_enabled":"0"},"lv_LV":{"lang_name":"Latvian","is_default":"0","is_enabled":"0"},"lt_LT":{"lang_name":"Lithuanian","is_default":"0","is_enabled":"0"},"mk_MK":{"lang_name":"Macedonian","is_default":"0","is_enabled":"0"},"no_NO":{"lang_name":"Norwegian","is_default":"0","is_enabled":"0"},"pl_PL":{"lang_name":"Polish","is_default":"0","is_enabled":"0"},"pt_BR":{"lang_name":"Portuguese (Brazil)","is_default":"0","is_enabled":"0"},"pt_PT":{"lang_name":"Portuguese (Portugal)","is_default":"0","is_enabled":"0"},"ro_RO":{"lang_name":"Romanian","is_default":"0","is_enabled":"0"},"ru_RU":{"lang_name":"Russian","is_default":"0","is_enabled":"0"},"sr_RS":{"lang_name":"Serbian","is_default":"0","is_enabled":"0"},"sk_SK":{"lang_name":"Slovak","is_default":"0","is_enabled":"0"},"sl_SI":{"lang_name":"Slovene","is_default":"0","is_enabled":"0"},"es_ES":{"lang_name":"Spanish","is_default":"0","is_enabled":"0"},"sv_SE":{"lang_name":"Swedish","is_default":"0","is_enabled":"0"},"tr_TR":{"lang_name":"Turkish","is_default":"0","is_enabled":"0"},"uk_UA":{"lang_name":"Ukrainian","is_default":"0","is_enabled":"0"},"fr_CA":{"lang_name":"French (CA)","is_default":"0","is_enabled":"0"},"es_MX":{"lang_name":"Spanish (MX)","is_default":"0","is_enabled":"0"}};
var videos_array = [];
var RESOLUTION_WIDTH = 1280;
var RESOLUTION_HEIGHT = 720;
var IS_QMS = 0;
var IS_RMS = 0;
var IS_NEORCHA = 0;
var projectResolution  = 'hd';
var IS_MIA_PROJECT  = 0;
var SERVER_DATE = "Wed, 05 Apr 2023 09:11:43 GMT";

var guide_key_map_type = "";
var guide_key_map_ch = -1;
var pcd_build_version = 'v4.6-1631823201';
var tv_setup = {"status":"success","data":{"checkin":{"volume":"off","power":"off","from":"0","to":"24"}}}.data;
var deploymentMode = 'multicast';
var IS_ADVANCED_WAKEUP_IN_PROJECT = "Y";
var iot_mapping_pages = [];
var epgOnlyEnabled = 0;
localStorage.setItem("dcp",1);

if (!isPreviewMode() && !isEditorMode() && window.location.href.indexOf("/editor") < 0) {
    if (!IS_IFRAME) {
        /**
         * ALL THESE OPTIONS SHOULD BE CONFIGURABLE AT THE SERVER LEVEL.
         * Setting 'boot_sequence_option' broke MIA
         */
        if (IS_MIA_PROJECT) {
            TVSetup("input_splash_image", "0");
            TVSetup("boot_sequence_option", "0");
            TVSetup("tv_channel_ui", "0");
            TVSetup("application_channel_control", "1");
        } else {
            TVSetup("input_splash_image", "1");
            TVSetup("boot_sequence_option", "1");
        }
        TVSetup("tv_channel_control", "0");
        TVSetup("tv_caption_ui", "1");
        TVSetup("tv_channel_attribute_floating_ui", "0");
        TVSetup("block_launcher", "1");

        hcap.property.getProperty({
            "key": "model_name",
            "onSuccess": function (s) {
                if (s.value.indexOf("STB") > -1) {
                    TVSetup("screensaver_control", "1");
                }
            },
            "onFailure": function (f) {
                logProperty("ENDADuringFailCall onFailure : errorMessage = " + f.errorMessage);
            }
        });


        // Only set security level to 2 if someone is checked in
        if (isCheckedIn()) {
            TVSetup("security_level", "2");
        } else {
            TVSetup("security_level", "1");
        }
        logProperty("input_splash_image");
        logProperty("tv_channel_ui");
        logProperty("tv_channel_attribute_floating_ui");
        logProperty("block_launcher");
        logProperty("boot_sequence_option");
        logProperty("tv_channel_control");
        logProperty("tv_caption_ui");
        logProperty("screensaver_control");
        logProperty("clock_source");
    }

    function logProperty(property) {
        hcap.property.getProperty({
            "key": property,
            "onSuccess": function (s) {
                logConsole("Property:" + property + " = " + JSON.stringify(s));
            },
            "onFailure": function (f) {
                logConsole("errorMessage = " + f.errorMessage);
            }
        });
    }
}

if (!isPreviewMode()) {
    if (!IS_IFRAME) {
        if (typeof deploymentMode !== "undefined" && deploymentMode == 'unicast') {
            TVSetup("clock_source", "admin");
        } else {
            TVSetup("clock_source", "pro:centric");
        }
    }
}
if(!IS_IFRAME && typeof GLOBAL_SERVER_IP === "string") {
    /* set rms trusted ip as GLOBAL_SERVER_IP for RMS Feature in admin page since 1.20.3 hcap version */
    try {
        TVSetup("rms_trusted_ip", GLOBAL_SERVER_IP, 500);
    } catch (e) { }
}

var PORTALTIMEOUT     = parseInt(getCookie("timeout"));
var checkChannelT;

if(isNaN(PORTALTIMEOUT)){
    PORTALTIMEOUT = 0;
}

var scheduled_am_requests_array = [],
    callbacks_array = {};

var PORTALTIMEOUT_OFFSET     = 15000;
var SECRET_KEY_BUFFER     = "";

var SECRET_REBOOT_STR = "993366448844"; // ZENITH
var SECRET_REBOOT_STR_SHORT = "936484"; // ZENITH

var SECRET_DEBUG_STR = "3333228844"; // DEBUG
var SECRET_DEBUG_STR_SHORT = "33284"; // DEBUG

var SECRET_DEBUG_INDEX_STR = "4466333399"; // INDEX
var SECRET_DEBUG_INDEX_STR_SHORT = "46339"; // INDEX

var SECRET_STATS_PAGE_STR = "7788228877"; // STATS
var SECRET_STATS_PAGE_STR_SHORT = "78287"; // STATS

var SECRET_DEMO_PAGE_STR = "33336666"; // DEMO
var SECRET_DEMO_PAGE_STR_SHORT = "3366"; // DEMO

var SECRET_RELOAD_STR = "773355662233"; // RELOAD
var SECRET_RELOAD_STR_SHORT = "735623"; // RELOAD

var SECRET_SALES_STR = "7722553377"; // SALES
var SECRET_SALES_STR_SHORT = "72537"; // SALES

var SECRET_IOTSETTING_STR = "777755888844"; // IoT Pairing Setting
var SECRET_IOTSETTING_STR_SHORT = "775884"; // IoT Pairing Setting

var SECRET_DEBUG_INSPECTOR = "25800";

var PORTAL_MODE_TV = 'tv';
var PORTAL_MODE_VOD = 'vod';
var PORTAL_MODE_HDMI_1 = 'hdmi1';
var PORTAL_MODE_HDMI_2 = 'hdmi2';
var PORTAL_MODE_HDMI_3 = 'hdmi3';
var PORTAL_MODE_HDMI_STD = 'hdmi';
var PORTAL_MODE_COMPONENT = 'component';
var PORTAL_MODE_SVIDEO = 'svideo';
var PORTAL_MODE_COMPOSITE = 'composite';
var PORTAL_MODE_SCART = 'scart';
var COOKIE_EXPIRE_DAYS = 365;

current_channel     = parseInt(getCookie("current_channel"));

if(current_channel < 1 || isNaN(current_channel)) {
    current_channel  = parseInt(getCookie("startChannelLogicalNumber"));
}

function removeLocalStorage (a) {
    const l = {
        guestInfo: ["salutation", "firstName", "lastName", "fullName", "email", "phone"],
        notice: ["notice_read_list", "notifier_last_time", "remoteOnNoticeId"]
    };
    _.each(l[a], function (v) {localStorage.removeItem(v);});
}

function isDebugOn(mode) {
    try {
        switch(mode) {
            case "index":
                var INDEX_DEBUG = localStorage.getItem("INDEX_DEBUG");
                if (INDEX_DEBUG == "TRUE") {
                    return true;
                }
                break;
            default:
                var PORTAL_DEBUG = localStorage.getItem("PORTAL_DEBUG");
                if (PORTAL_DEBUG == "TRUE") {
                    return true;
                }
                break;
        }
    }
    catch(e) {
    }
    return false;
}

function updateLanguageCookie(isCheckedin, lang_code) {

    if (!isPreviewMode()) {

        //logConsole("updateLanguageCookie: starting , code: " + lang_code + ", is Checkedin: " + isCheckedin);

        // get defaults, from uiConfig.js
        var default_language = localStorage.getItem("default_language");
        var languages = localStorage.getItem("languages");
        var language_reset_hour = parseInt(localStorage.getItem("language_reset_hour"));
        var language_reset_minute = parseInt(localStorage.getItem("language_reset_minute"));

        //logConsole("updateLanguageCookie: default_language: " + default_language);
        //logConsole("updateLanguageCookie: languages array: " + JSON.stringify(languages));
        //logConsole("updateLanguageCookie reset time: " + language_reset_hour + ":" + language_reset_minute);

        var current_date = new Date(),
            target_date = new Date();

        if (typeof lang_code != 'undefined' && lang_code == 'expire') {

            //logConsole("updateLanguageCookie: request to expire - resetting to default;");
            lang_code = default_language;

        } else {

            //logConsole("updateLanguageCookie: 2. case when there is no cookie and we need to restore it to default ");
            var current_language = getCookie("active_language");
            //logConsole("updateLanguageCookie: current_language: " + current_language);

            if (current_language == null || current_language == "") {
                //logConsole("updateLanguageCookie: no cookie is set - resetting to default");
                lang_code = default_language;
            } else if (typeof lang_code == 'undefined') {
                //logConsole("updateLanguageCookie: function called with no lang_code, so cookie value stays");
                if (languages != null && languages.indexOf(current_language) > -1) {
                    //logConsole("updateLanguageCookie: " + current_language + " FOUND in uiConfig");
                    lang_code = current_language;
                } else {
                    //logConsole("updateLanguageCookie: " + current_language + " not found in uiConfig, so resetting to default");
                    lang_code = default_language;
                }
            } else {
                //logConsole("updateLanguageCookie: lang_code will be set to lang_code, passed as function parameter");
            }
        }

        //logConsole("updateLanguageCookie: lang_code: " + lang_code);

        if ((typeof isCheckedin != 'undefined' && isCheckedin) || (lang_code == default_language)) {

            target_date.setFullYear(parseInt(current_date.getFullYear()) + 1);
            // console.log('case1');
        }
        else {
            // console.log('case2');
            if (current_date.getHours() >= language_reset_hour && current_date.getMinutes() >= language_reset_minute) {
                target_date.setHours(language_reset_hour, language_reset_minute, 0, 0);
                target_date.setDate(current_date.getDate() + 1);
                // console.log('case2.1');
            } else {
                target_date.setHours(language_reset_hour, language_reset_minute, 0, 0);
                // console.log('case2.2');
            }
            // console.log('done case2');
        }

        //logConsole("updateLanguageCookie: target_date: " + target_date);
        //logConsole("updateLanguageCookie: target_date(GMT): " + target_date.toGMTString());

        var expires = "expires=" + target_date.toGMTString();
        document.cookie = "language_expires" + "=" + target_date.toGMTString() + "; " + expires + ";path=/";
        document.cookie = "active_language" + "=" + lang_code + "; " + expires + ";path=/";

        //logConsole("updateLanguageCookie: cookie set: " + getCookie("active_language"));
    }
}


// function to convert logical channel into physical major, minors
function getPhysicalChannelInfo(logical_channel) {
    var ch = {};
    var channels = getLocalStorageObject("channellist");

    if (typeof channels !== "undefined" && (typeof channels == "object" && Object.keys(channels).length)) {
        $.each(channels.channels, function(i, channel) {
            if (channel.logicalChannelNumber == logical_channel) {
                ch = channel;
                return false;
            }
        });

        // if there's no logical_channel as user is requesting, get channel at index "logical_channel"
        if (channels.hasOwnProperty(logical_channel)) {
            ch = channels[logical_channel];
            return false;
        }
    }

    return ch;
}

// function to convert channel physical lookup into logical channel
function getLogicalChannelInfo(param) {
    var ch = {};
    var channels = getLocalStorageObject("channellist");

    switch(param.channelType) {
        case hcap.channel.ChannelType.RF :
        case hcap.channel.ChannelType.RF_DATA :

            if(param.satelliteId != 0) {
                $.each(channels.channels, function(i, channel) {
                    if (parseInt(channel.satelliteID) == parseInt(param.satelliteId) && parseInt(channel.programNumber) == parseInt(param.programNumber) &&
                        parseInt(channel.frequency) == parseInt(param.frequency) && parseInt(channel.polarization) == parseInt(param.polarization) &&
                        parseInt(channel.symbolRate) == parseInt(param.symbolRate)) {
                        ch = channel;
                        return false;
                    }
                });
            } else if(param.majorNumber != 0) {
                $.each(channels.channels, function(i, channel) {
                    if (parseInt(channel.major) == parseInt(param.majorNumber) && parseInt(channel.minor) == parseInt(param.minorNumber)) {
                        ch = channel;
                        return false;
                    }
                });
            } else {
                $.each(channels.channels, function(i, channel) {
                    if (parseInt(channel.frequency) == parseInt(param.frequency) && parseInt(channel.serviceID) == parseInt(param.programNumber)) {
                        ch = channel;
                        return false;
                    }
                });
            }

            break;
        case hcap.channel.ChannelType.IP :
        case hcap.channel.ChannelType.IP_DATA :

            $.each(channels.channels, function(i, channel) {
                if (channel.ipAddress == param.ip && parseInt(channel.ipPort) == parseInt(param.port)) {
                    ch = channel;
                    return false;
                }
            });

            if(_.isEmpty(ch) && channels.startupChannel == parseInt(getCookie("previous_channel"))){
                var startchannel = _.filter(channels.channels, function(channel){return channel.logicalChannelNumber == channels.startupChannel});
                if(startchannel.length > 0){
                    ch = startchannel[0];
                    changeChannel(ch, null, 0, 'getLogicalChannelInfo', null);
                }
            }

            break;
        default :
            logConsole("Unknown BroadcastType: " + JSON.stringify(param));
            break;
    }

    return ch;
}

function reqListener(e) {
    channels = JSON.parse(this.responseText);
    sortChannelByActiveLang(0);
    getCurrentConfigChannel();
}

function getChannelList() {
    var oReq = new XMLHttpRequest();
    oReq.onload = reqListener;
    oReq.open("get", channels_json_filepath, true);
    oReq.send();
}

function retrieveEventInfoJSON(json_file) {
    //logConsole(json_file);
    $.getJSON(json_file, function(json) {
        eventInfo = json;
        //logConsole(eventInfo);
        return json;
        //logConsole("found JSON data!!!!");
    });
}

function channelUp(current_channel) {
    var channels = getLocalStorageObject("channellist");
    up_channel_idx = null;

    $.each(channels.channels, function(i, channel) {
        if (channel.logicalChannelNumber == current_channel) {
            up_channel_idx = i + 1;


            if (up_channel_idx >= channels.channels.length) {
                up_channel_idx = 0;
            }

            //logConsole("current idx: " + up_channel_idx);
            //logConsole("found: " + channels.channels[up_channel_idx].channelLabel);
            return false;
        }
    });

    if(channels.channels.hasOwnProperty(up_channel_idx)) {
        return channels.channels[up_channel_idx];
    }
    else {
        // handle channel not found
        //logConsole("channel not found");
        return null;
    }
}

function channelDown(current_channel) {
    var channels = getLocalStorageObject("channellist");
    down_channel_idx = null;

    //logConsole("current_channel: " + current_channel);
    $.each(channels.channels, function(i, channel) {
        //logConsole(channel.logicalChannelNumber);
        if (channel.logicalChannelNumber == current_channel) {
            //logConsole(channel.logicalChannelNumber + " == " + current_channel);
            down_channel_idx = i - 1;

            if (down_channel_idx < 0) {
                down_channel_idx = channels.channels.length-1;
            }
            //logConsole("current idx: " + down_channel_idx);
            //logConsole("found: " + channels.channels[down_channel_idx].channelLabel);
            return false;
        }
    });

    if(channels.channels.hasOwnProperty(down_channel_idx)) {
        return channels.channels[down_channel_idx];
    }
    else {
        // handle channel not found
        //logConsole("channel not found");
        return null;
    }
}

/* Pay Channel for PCD 2.5 */
function setPaidChannelList(list){
    localStorage.removeItem("paidChannellist");
    expireCookie("paidchannel_expires");

    var removePaidChannels = function() {
        if(_.has(channelList, "orgChannels")) {
            channelList.channels = channelList.orgChannels;
            channelList = _.omit(channelList, "orgChannels");

            channelList = LZString.compress(JSON.stringify(channelList));
            localStorage.setItem("channellist", channelList);
        }
    };

    var channelList = getLocalStorageObject("channellist");
    if(_.isUndefined(list)){     //checkout
        removePaidChannels();
        updateChannelWidget();

        setCookie('previous_channel', getCookie("startChannelLogicalNumber"), COOKIE_EXPIRE_DAYS);
        expiredChannelToStartChannel();
    } else {
        if(parent.uiConfigUseGroups) {
            list = _.reject(list, function(paychannel) {
                if(_.has(channelList, "orgChannels")) {
                    if (_.findIndex(channelList.orgChannels, {logicalChannelNumber: parseInt(paychannel.logicalChannelNumber)}) >= 0) {
                        return true
                    }
                } else {
                    if (_.findIndex(channelList.channels, {logicalChannelNumber: parseInt(paychannel.logicalChannelNumber)}) >= 0) {
                        return true
                    }
                }
                return false;
            });

            list = _.reject(list, function(paychannel){  //remove paychannel
                var result = false;

                paychannel.logicalChannelNumber = parseInt(paychannel.logicalChannelNumber);
                if(moment(paychannel.expireDate).diff(moment()) < 1000 ) {  //expired paid channel
                    result = true;
                }

                return result;
            });

            if (list.length > 0) {
                list = _.sortBy(list, function (channel) {return moment(channel.expireDate).unix();});
                localStorage.setItem("paidChannellist", JSON.stringify(list));

                var expiredTime = moment(list[0].expireDate).unix();
                setCookie("paidchannel_expires", expiredTime, COOKIE_EXPIRE_DAYS);
                parent.checkExpiredPaidChannel();

                if(!_.has(channelList, "orgChannels")) {
                    channelList.orgChannels = channelList.channels;
                }
                channelList.channels = _.union(channelList.orgChannels, list);

                channelList = LZString.compress(JSON.stringify(channelList));
                localStorage.setItem("channellist", channelList); //update

                setChannels(undefined, updateChannelWidget);
            } else {  //not valid all paid channels
                if (PORTAL_ACTIVE && _.findIndex(channelList.orgChannels, {logicalChannelNumber: parseInt(getCookie('previous_channel'))}) == -1){
                    setCookie('previous_channel', getCookie("startChannelLogicalNumber"), COOKIE_EXPIRE_DAYS);
                    parent.checkExpiredPaidChannel();
                }
                removePaidChannels();
                setTimeout(updateChannelWidget(), 2000);
            }
        }
    }
}

function updateChannelWidget(){
    if(PORTAL_ACTIVE){
        if(!_.isNull(getIframeObject()) && !_.isUndefined(getIframeObject().updateWidgets)) {
            getIframeObject().updateWidgets();
        }
    }

    if(PORTAL_ACTIVE && $('#iframe_id').contents().find("#pip").length > 0){
        restoreCurrentChannel();
    }

    if(!PORTAL_ACTIVE && getCookie("portal_mode") === PORTAL_MODE_TV) {
        var href = _.get(getIframeObject(), 'window.location.href');
        if(!_.isUndefined(href) && href.indexOf("channelbanner.html") > -1) setChannels();
    }
}

function expiredChannelToStartChannel(){
    var channel;
    if(parent.uiConfigUseGroups){
        if(getCookie("startChannelActive") == "false")
            channel = getPhysicalChannelInfo(getCookie("videoStartChannelNumber"));
        else
            channel = getPhysicalChannelInfo(getCookie("startChannelLogicalNumber"));
        if (!_.isUndefined(channel)) {
            changeChannel(channel, 0, 1, 'expiredChannelToStartChannel', null);
        }
    }
}

function reboot() {
    hcap.power.reboot({
        "onSuccess" : function() {
            logConsole("onSuccess");
        },
        "onFailure" : function(f) {
            logConsole("onFailure : errorMessage = " + f.errorMessage);
        }
    });
}

function powerOff() {
    hcap.power.powerOff({
        "onSuccess" : function() {
            logConsole("onSuccess");
        },
        "onFailure" : function(f) {
            logConsole("onFailure : errorMessage = " + f.errorMessage);
        }
    });
}

function getSuccessVerifyFx(callback) {
    success_verify_tune_fx = function() {
        //logConsole("In success_verify_tune_fx...");
        if(typeof callback === "function") {
            callback();
        }

        clearTimeout(checkChannelT);
        checkChannelT = setTimeout(function() {
            hcap.channel.getCurrentChannel({
                "onSuccess" : function(s) {
                    //logConsole("channel status: " + s.channelStatus + ", logical number: " + s.logicalNumber);
                    //logConsole("hcap.channel.ChannelStatus.AUDIO_VIDEO_BLOCKED: " + hcap.channel.ChannelStatus.AUDIO_VIDEO_BLOCKED);
                    //logConsole("PORTAL_ACTIVE: " + PORTAL_ACTIVE);

                    if (s.channelStatus == hcap.channel.ChannelStatus.AUDIO_VIDEO_BLOCKED) {
                        if (PORTAL_ACTIVE && !onChannelBannerPage()) {
                            var MEDIA_START_UP = localStorage.getItem("MEDIA_START_UP");
                            var callByIndex = localStorage.getItem("callByIndex");

                            if((MEDIA_START_UP == null || MEDIA_START_UP == 0) && (callByIndex == null || callByIndex != "true")
                                && IS_IFRAME && ($("#pip").length > 0 || $("#lg_video").length > 0)) {
                                //logConsole("Portal is active, doing popup");
                                // create popup overlay div
                                var popup = $('<div class="tv_popup" style="width: 300px; height: 30px;">CHANNEL IS UNAVAILABLE</div>');
                                popup.appendTo($('body'));

                                popup.css({
                                    left: (($(window).width() - 300) / 2) + 'px',
                                    top: (($(window).height() - 30) / 2) + 'px',
                                    position: 'absolute',
                                    display: 'block'
                                });

                                popupT = setTimeout(function() {
                                    popup.hide();
                                    popup.remove();
                                }, 5000);
                            }

                        }
                        else {
                            logConsole("Portal is NOT active, doing floatint UI");
                            TVSetup("tv_channel_attribute_floating_ui", "1", 0);
                        }
                    }

                    localStorage.removeItem("callByIndex");
                },
                "onFailure" : function(f) {
                    logConsole("getStatus onFailure : errorMessage = " + f.errorMessage);
                    localStorage.removeItem("callByIndex");
                }
            });
        }, 5000);
    };

    return success_verify_tune_fx;
}

function onChannelBannerPage() {
    var url = document.location.href;
    var pos = url.indexOf("channelbanner.html")

    if (pos > -1) {
        return true;
    }
    return false;
}

function getChannelParams(ch, param_update_status_bar_ind, exclude_from_history_ind, callback, errCallback, exclude_from_log) {
    update_status_bar_ind = 0;
    if (typeof param_update_status_bar_ind !== "undefiend") {
        update_status_bar_ind = param_update_status_bar_ind;
    }
    if (typeof exclude_from_log === "undefined"){
        exclude_from_log = 0;
    }
    var param = {};
    if (ch.streamType < 0) {
        streamType = 0;
    }
    else {
        streamType = ch.streamType;
    }
    var pcrPid, videoPid, videoStreamType, audioPid, audioStreamType, programNumber;

    var logical_channel = ch.logicalChannelNumber;
    var last_channel = getCookie("tmp_last_channel");

    //logConsole("exclude_from_history_ind: " + exclude_from_history_ind);
    //logConsole("update_status_bar_ind: " + update_status_bar_ind);

    // function to check if channel tunned successfully
    success_verify_tune_fx = getSuccessVerifyFx(callback);

    var fx_update_channels = function() {
        //logConsole("Executing fx_update_channels ....");

        if (!exclude_from_history_ind) {
            //logConsole("{utilities} [1] Resetting 'current_channel' to " + logical_channel);
            //logConsole("{utilities} Setting 'last_channel' to " + last_channel);
            setCookie("last_channel", last_channel, 1);
            setCookie("current_channel", logical_channel, COOKIE_EXPIRE_DAYS);

            window.localStorage.setItem("LAST_CHANNEL_NAME", ch.channelLabel.toUpperCase());
        }
        else {
            //logConsole("Skipping history update! current_channel still... " + getCookie("current_channel"));
        }
    };

    if (update_status_bar_ind) {
        fx = function() {
            initStatusBar();
            success_verify_tune_fx();
            fx_update_channels();

            if(_.isFunction(_.get(window, "logStorage.sendEvent")) && !exclude_from_log) {
                window.logStorage.sendEvent(window.logStorage.code.USAGE.CHANNEL, ch.channelLabel.toUpperCase()||"UNKNOWN");
            }
        };
    }
    else {
        fx = function() {
            //logConsole("About to execute success_verify_tune_fx....");
            success_verify_tune_fx();
            fx_update_channels();

            if(_.isFunction(_.get(window, "logStorage.sendEvent")) && !exclude_from_log) {
                window.logStorage.sendEvent(logStorage.code.USAGE.CHANNEL,ch.channelLabel.toUpperCase()||"UNKNOWN");
            }
        }
    }
    switch(ch.type) {
        case "RF_FREQ":
            audioStreamType = (ch.audioType < 0) ? 0 : ch.audioType;
            param = {
                "channelType" : hcap.channel.ChannelType.RF,
                "frequency" : parseInt(ch.frequency),
                "programNumber" : parseInt(ch.serviceID),
                "plpId" : parseInt(ch.plpId),
                "rfBroadcastType" : parseInt(streamType),
                "audioStreamType" : parseInt(audioStreamType),
                "onSuccess" : function() {
                    //logConsole("onSuccess changed channel to frequency" + parseInt(ch.frequency));
                    fx();
                },
                "onFailure" : function(f) {
                    logConsole("onFailure : errorMessage = " + f.errorMessage);
                    if(typeof errCallback === "function") {
                        errCallback();
                    }
                }
            };
            break;
        case "RF_DVB":
            param = {
                "channelType" : hcap.channel.ChannelType.RF,
                "frequency" : parseInt(ch.frequency),
                "programNumber" : parseInt(ch.programNumber),
                "rfBroadcastType" : parseInt(streamType),
                "onSuccess" : function() {
                    //logConsole("onSuccess changed channel to frequency" + parseInt(ch.frequency));
                    fx();
                },
                "onFailure" : function(f) {
                    logConsole("onFailure : errorMessage = " + f.errorMessage);
                    if(typeof errCallback === "function") {
                        errCallback();
                    }
                }
            };
            break;
        case "RF_MM":
            param = {
                "channelType" : hcap.channel.ChannelType.RF,
                "majorNumber" : parseInt(ch.major),
                "minorNumber" : parseInt(ch.minor),
                "rfBroadcastType" : parseInt(streamType),
                "onSuccess" : function() {
                    //logConsole("onSuccess changed channel to majorNumber/minorNumber" + parseInt(ch.major) + "/" + (ch.minor));
                    fx();
                },
                "onFailure" : function(f) {
                    logConsole("onFailure : errorMessage = " + f.errorMessage);
                    if(typeof errCallback === "function") {
                        errCallback();
                    }
                }
            };
            break;
        case "ATSC_3":
            param = {
                "channelType" : hcap.channel.ChannelType.RF,
                "majorNumber" : parseInt(ch.major),
                "minorNumber" : parseInt(ch.minor),
                "plpId" : parseInt(ch.plpId),
                "rfBroadcastType" : parseInt(streamType),
                "onSuccess" : function() {
                    //logConsole("onSuccess changed channel");
                    fx();
                },
                "onFailure" : function(f) {
                    logConsole("onFailure : errorMessage = " + f.errorMessage);
                    if(typeof errCallback === "function") {
                        errCallback();
                    }
                }
            };
            break;
        case "IP":
        case "LO":
            programNumber = (ch.programNumber < 0) ? 0 : ch.programNumber;
            pcrPid = (ch.PCR_PID < 0) ? 0 : ch.PCR_PID;
            videoPid = (ch.videoPID < 0) ? 0 : ch.videoPID;
            videoStreamType = (ch.videoType < 0) ? 0 : ch.videoType;
            audioPid = (ch.audioPID < 0) ? 0 : ch.audioPID;
            audioStreamType = (ch.audioType < 0) ? 0 : ch.audioType;

            param = {
                "channelType" : hcap.channel.ChannelType.IP,
                "ip" : ch.ipAddress,
                "port" : parseInt(ch.ipPort),
                "ipBroadcastType" : parseInt(streamType),
                "programNumber" : parseInt(programNumber),
                "pcrPid" : parseInt(pcrPid),
                "videoPid" : parseInt(videoPid),
                "videoStreamType" : parseInt(videoStreamType),
                "audioPid" : parseInt(audioPid),
                "audioStreamType" : parseInt(audioStreamType),
                "onSuccess" : function() {
                    logIndexConsole("onSuccess changed channel to ip:port" + ch.ipAddress + ":" + ch.ipPort);
                    fx();
                },
                "onFailure" : function(f) {
                    logIndexConsole("onFailure : errorMessage = " + f.errorMessage);
                    if(typeof errCallback === "function") {
                        errCallback();
                    }
                }
            };
            break;
        case "DVB_S2":
            param = {
                "channelType" : hcap.channel.ChannelType.RF,
                "frequency" : parseInt(ch.frequency),
                "programNumber" : parseInt(ch.programNumber),
                "satelliteId" : ch.satelliteID,
                "polarization" : ch.polarization,
                "rfBroadcastType" : hcap.channel.RfBroadcastType.SATELLITE_2,
                "symbolRate" : parseInt(ch.symbolRate),
                "onSuccess" : function() {
                    //logConsole("onSuccess changed channel to frequency/satelliteID" + ch.frequency + "/" + ch.satelliteID);
                    fx();
                },
                "onFailure" : function(f) {
                    logConsole("onFailure : errorMessage = " + f.errorMessage);
                    if(typeof errCallback === "function") {
                        errCallback();
                    }
                }
            };
            break;
        default:
            logConsole("Unsupported channelType: " + ch.type);
            break;
    }

    session_id = getCookie('session_id');
    if (session_id =='') {
        logConsole("Error! SessionID is blank!");
        session_id = setUniqueSessionID();
    }

    if(ch.hasOwnProperty("encrypted")){
        if (ch.encrypted == "true"){
            if (session_id !='') {
                param['sessionId'] = session_id;
            }
        }
    }

    return param;
}

function changeChannel(ch, param_update_status_bar_ind, exclude_from_history, referrer, callback) {
    logIndexConsole("{utilities} In changeChannel from [" + referrer + "] *********************************");

    var _change_channel_fx = function() {
        logIndexConsole("{utilities} TV is not in warm update mode - proceed changing channel", LOG_MESSAGE_TYPES.information);
        var portal_mode = getCookie("portal_mode");
        if (!_.isUndefined(portal_mode) && !_.isEmpty(portal_mode) && portal_mode != "tv") {
            setSwitchMode(portal_mode, function () {
                logConsole("RF and HDMI: change externalInput(tv/data channel -> HDMI)");
            });
            return;
        }

        var curChannel = getCookie("current_channel");
        var prevChannel = getCookie("previous_channel");
        var speechChannel = getCookie("speech_channel");

        var exclude_from_log = 0;
        if (referrer === "tuneToStartChannel" || referrer === "tuningCh") {
            exclude_from_log = 1;
        }

        var url = window.location.href;

        var update_status_bar_ind = 0;
        var exclude_from_history_ind = 0;

        if (typeof param_update_status_bar_ind !== "undefined") {
            update_status_bar_ind = param_update_status_bar_ind;
        }

        if (typeof exclude_from_history !== "undefined") {
            exclude_from_history_ind = exclude_from_history;
        }

        // clear previous timeout
        clearTimeout(checkChannelT);
        $(".tv_popup").hide();
        $(".tv_popup").remove();

        var callbackFunc = function () {
            setCookie("portal_mode", "tv", COOKIE_EXPIRE_DAYS);
            if (typeof callback === "function") {
                callback();
            }
        };

        // update current channel
        setCookie('tmp_last_channel', getCookie('current_channel'), COOKIE_EXPIRE_DAYS);
        if (!exclude_from_history_ind) setCookie('last_channel', getCookie('current_channel'), 1);
        current_channel = ch.logicalChannelNumber;
        if (typeof referrer != 'undefined' && referrer.indexOf("VIDEO widget") == -1) {
            //logConsole("{utilities} [3] Resetting 'current_channel' to " + current_channel);
            setCookie('current_channel', current_channel, COOKIE_EXPIRE_DAYS);
        }

        var param = getChannelParams(ch, update_status_bar_ind, exclude_from_history_ind, callbackFunc, callbackFunc, exclude_from_log);
        if (!isPreviewMode() && !isEditorMode()) {
            var ignoreChannelChange = 0;
            hcap.channel.getCurrentChannel({
                "onSuccess": function (s) {
                    switch (s.channelType) {
                        case hcap.channel.ChannelType.RF :
                        case hcap.channel.ChannelType.RF_DATA :
                            if (s.channelStatus != 33) {
                                if (s.satelliteId !== 0) {
                                    if (parseInt(s.satelliteId) === parseInt(param.satelliteId) && parseInt(s.programNumber) === parseInt(param.programNumber) &&
                                        parseInt(s.frequency) === parseInt(param.frequency) && parseInt(s.polarization) === parseInt(param.polarization) &&
                                        parseInt(s.symbolRate) === parseInt(param.symbolRate)){
                                        ignoreChannelChange = 1;
                                    }
                                } else if (s.majorNumber !== 0) {
                                    if (parseInt(s.majorNumber) === parseInt(param.majorNumber) && parseInt(s.minorNumber) === parseInt(param.minorNumber)) {
                                        ignoreChannelChange = 1;
                                    }
                                } else {
                                    if (parseInt(s.frequency) === parseInt(param.frequency) && parseInt(s.programNumber) === parseInt(param.serviceID)) {
                                        ignoreChannelChange = 1;
                                    }
                                }
                            }
                            break;
                        case hcap.channel.ChannelType.IP :
                        case hcap.channel.ChannelType.IP_DATA :
                            if (s.ip === param.ipAddress && parseInt(s.port) === parseInt(param.ipPort)) {
                                ignoreChannelChange = 1;
                            }
                            break;
                        default :
                            logConsole("Unknown BroadcastType: " + JSON.stringify(param));
                            break;
                    }
                    if (!ignoreChannelChange) {
                        logIndexConsole("Changing Channel to: " + JSON.stringify(param), LOG_MESSAGE_TYPES.information);
                        hcap.channel.requestChangeCurrentChannel(param);
                    } else {
                        logConsole("request channel change to same channel");
                        callbackFunc();
                    }
                },
                "onFailure": function (f) {
                    logIndexConsole("onFailure : errorMessage = " + f.errorMessage);
                    hcap.channel.requestChangeCurrentChannel(param);
                }
            });

            if (COM_TYPE == 'IP' && getCookie("portal_mode") == 'tv') {
                if (referrer.search('CH_DOWN') > -1 || referrer.search('CH_UP') > -1 || referrer.search('FLASHBK') > -1 || referrer.search('readRemoteInput') > -1) {
                    window.parent["adContentHandler"].on();
                }
            }

        }
    }

    if (typeof referrer != "undefined" && referrer == window.POWER_MODE_CHANNEL_CHANGE_REFERRER) {
        // check if TV is currently downloading
        hcap.power.isWarmUpdate({
            "onSuccess": function (s) {
                logIndexConsole("{utilities} hcap.power.isWarmUpdate success: is warm update = " + s.isWarmUpdate);
                if (s.isWarmUpdate) {
                    logIndexConsole("{utilities} TV is in WARM UPDATE mode! Do not switch channels!", LOG_MESSAGE_TYPES.information);
                } else {
                    _change_channel_fx();
                }
            },
            "onFailure": function (f) {
                logIndexConsole("{utilities} hcap.power.isWarmUpdate: errorMessage = " + f.errorMessage, LOG_MESSAGE_TYPES.error);
                _change_channel_fx();
            }
        });
    } else {
        _change_channel_fx();
    }
}

function sortChannelByActiveLang(param_force_set_ind) {
    var force_set_ind = 1;
    if(typeof param_force_set_ind !== "undefined") {
        force_set_ind = param_force_set_ind;
    }

    var sort_language = getCookie("active_channels_language");
    if (sort_language == '') {
		sort_language = getCookie("active_language");
    }

    if(typeof channels != "undefined" && channels.hasOwnProperty("channels")) {
        var includeChannels = _.sortBy(_.filter(channels.channels, function(channel) {
            return !_.isUndefined(channel.languages) && _.indexOf(channel.languages, sort_language) != -1;
        }) , 'logicalChannelNumber');

        var excludeChannels = _.sortBy(_.filter(channels.channels, function(channel) {
            return _.isUndefined(channel.languages) || (!_.isUndefined(channel.languages) && _.indexOf(channel.languages, sort_language) == -1);
        }) , 'logicalChannelNumber');

        channels.channels = _.union(includeChannels, excludeChannels);

        if(force_set_ind) {
            var channelInfo = LZString.compress(JSON.stringify(channels));
            localStorage.setItem("channellist", channelInfo);
        }
    }
}

/* NEW FEATURE (RDT): send console logs */
function sendLogConsole(message) {
    logData.push(message);
    if (logData.length > 0){
        var sendItem = logData.filter(function(data, idx){return idx < 1;});
        sendItem.forEach(function(x){logData.splice(logData.indexOf(x), 1);});
        window.parent.requestHandler.requestAM('tvLog', Crypto.MD5('' + $.now()), sendItem,
            function (res) {
                //logConsole('debug info sent');
            }).catch(function (err) {
                //logConsole(JSON.stringify(err));
        });
    };
}

function logConsolePT(message) {
    if(IS_IFRAME) {
        window.parent.console.debug("@: "+message);
    } else {
        console.info("$: "+message);
    }
}

function scrollToBottom(con) {
    if (localStorage.getItem("autoScroll") == "true") {
        con.animate({
            scrollTop: parseInt(con[0].scrollHeight)
        }, 100);
    }
}

function toggleAutoScroll() {
    if (localStorage.getItem("autoScroll") == "true") {
        localStorage.setItem("autoScroll", "false");
        $("#auto_scroll").prop('checked', false);
    }
    else if (localStorage.getItem("autoScroll") == "false") {
        localStorage.setItem("autoScroll", "true");
        $("#auto_scroll").prop('checked', true);
    }
    logIndexConsole("{admin} AutoScroll: " + localStorage.getItem("autoScroll"));
}

function logPageConsole(message, message_type) {
    var d = new Date();
    var current_time = (d.getMonth() + 1) + "/" + d.getDay() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
    message = "[" + current_time + "] " + message;

    /* always write to TV log */
    console.log(message);

    if(typeof window.vorlonBaseURL !== "undefined") {
        logConsolePT(message);
        return;
    }

    if (isDebugOn("index")) {
        var con = window.top.$(".page_console");
        if (con.length > 0) {
            con.html(con.html() + "<br />" + formatLogMessageByType(message_type, message));
            scrollToBottom(con);
        }
    }
}

function logConsole(message, message_type) {
    logIndexConsole(message, message_type);
    return;

    // var d = new Date();
    // var current_time = (d.getMonth() + 1) + "/" + d.getDay() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
    // message = "[" + current_time + "] " + message;
    // /* always write to TV log */
    // console.log(message);
    //
    // if (getCookie("RDT_DEBUGGING") !== "") {
    //     sendLogConsole(message);
    // }
    //
    // if(typeof window.vorlonBaseURL !== "undefined" || ENABLE_INSPECTOR == 'true') {
    //     logConsolePT(message);
    //     return;
    // }
    //
    // if (isDebugOn("index") || isDebugOn("portal")) {
    //     var con = $(".widget_console");
    //     if (con.length > 0) {
    //         con.html(con.html() + "<br />" + formatLogMessageByType(message_type, message));
    //         scrollToBottom(con);
    //     }
    // }
}

function logIndexConsole(message, message_type) {
    var d = new Date();
    var current_time = (d.getMonth() + 1) + "/" + d.getDay() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
    message = "[" + current_time + "] " + message;

    /* always write to TV log */
    console.log(message);

    if(typeof window.vorlonBaseURL !== "undefined") {
        logConsolePT(message);
        return;
    }

    if (isDebugOn("index")) {
        var con = window.top.$(".index_console");
        if (con.length > 0) {
            con.html(con.html() + "<br />" + formatLogMessageByType(message_type, message));
            scrollToBottom(con);
        }
    }
}

function formatLogMessageByType(message_type, message) {
    if (typeof message_type !== "undefined") {
        switch(message_type) {
            case LOG_MESSAGE_TYPES.milestone_completed:
                message = '<span style="color: ' + LOG_MESSAGE_TYPES.milestone_completed.color + ';">' + message + '</span>';
                break;
            case LOG_MESSAGE_TYPES.event_received:
                message = '<span style="color: ' + LOG_MESSAGE_TYPES.event_received.color + ';">' + message + '</span>';
                break;
            case LOG_MESSAGE_TYPES.error:
                message = '<span style="color: ' + LOG_MESSAGE_TYPES.error.color + ';">' + message + '</span>';
                break;
            case LOG_MESSAGE_TYPES.information:
                message = '<span style="color: ' + LOG_MESSAGE_TYPES.information.color + ';">' + message + '</span>';
                break;
        }
    }

    return message;
}

// cancels the project dialog box
function cancelOverlay() {
    return function() {
        // clean up existing ones
        $('.window_overlay').remove();
        $('#project_container').remove();
        $('#widget_selector').remove();
    }
}

function createPageOverlay() {
    return function() {
        d_width = parseInt($(document).width());
        d_height = parseInt($(document).height());

        var overlay = $('<div class="window_overlay"></div>');
        overlay.css({
            width: d_width,
            height: d_height,
            top: "0px",
            left: "0px",
            position: "absolute",
            'z-index': 1000001
        });
        overlay.appendTo($('body'));
    }
}

function displayGlobalNotification(status_code, message, callback) {
    $('#notification_message_block').remove();

    // Display session status
    notification_message_block = $('<div id="notification_message_block"></div>').appendTo($('body'));
    switch(status_code) {
        case "success":
            notification_message_block.addClass("status_success");
            break;
        case "error":
            notification_message_block.addClass("status_error");
            break;
        case "info":
            notification_message_block.addClass("status_info");
            break;
    }
    notification_message_block.html(message);
    window_overlay = $(".window_overlay");

    notification_message_block.css({
        left: parseInt(($(window).width() - notification_message_block.width())/2),
        top: parseInt(($(window).height() - notification_message_block.height())/2) + 50,
        position:'absolute',
        zIndex: 999999999
    });

    setTimeout(function() {
        if (typeof callback == 'function') {
            callback();
        }
    }, 2500);
}

function tuneToDataChannel(callback, isFirst) {
	logIndexConsole("In tuneToDataChannel....");

    //change to data channel
    hcap.channel.getDataChannel({
        "onSuccess" : function(s) {
            param = s;

            if (s.channelType === hcap.channel.ChannelType.RF_DATA) {
                hcap.channel.requestChangeCurrentChannel({
                    "channelType" : param.channelType, /* RF_DATA */
                    "frequency" : param.frequency,
                    "programNumber" : param.programNumber,
                    "majorNumber" : param.majorNumber,
                    "minorNumber" : param.minorNumber,
                    "rfBroadcastType" : param.rfBroadcastType, /* ATSC,DVB : 48 | ISDB-T :16 */
                    "onSuccess" : function() {
                        if( !_.isUndefined(isFirst) && GLOBAL_SOUND_SETTING == 2 && (COM_TYPE === "IP" && window.parent.CHANNEL_TYPE === 'RF_DATA')) {
                            controlBgm(0);
                            controlBgm(1);
                        }
                        if (typeof callback == 'function') {
                            var func = function() {
                                callback();
                            };

                            if (typeof window.parent.CALLBACK_FX_ARRAY != 'undefined') {
                                window.parent.CALLBACK_FX_ARRAY.callback = func;
                                window.parent.CALLBACK_FX_ARRAY.referrer = 'tuneToDataChannel';
                                window.parent.CALLBACK_ACTIVE = true;
                            }
                            else if (CALLBACK_FX_ARRAY != 'undefined') {
                                CALLBACK_FX_ARRAY.callback = func;
                                CALLBACK_FX_ARRAY.referrer = 'tuneToDataChannel';
                                CALLBACK_ACTIVE = true;
                            }
                        }
                    },
                    "onFailure" : function(f) {
                        logConsole("onFailure : errorMessage = " + f.errorMessage);
                    }
                });
            }
        },
        "onFailure" : function(e) {
            logConsole("onFailure : errorMessage = " + e.errorMessage);
        }
    });
}

function createPIP(left, top, width, height, hcap_mode, pip_id) {
    if(left < 0) {
        left = 0;
    }
    if(top < 0) {
        top = 0;
    }

    if (isPreviewMode() || isEditorMode()) {
        // position VIDEO
        $("#" + pip_id).css({
            left: parseInt(left) + "px",
            top: parseInt(top)+ "px",
            width: parseInt(width)+ "px",
            height: parseInt(height)+ "px"
        });

        // position VIDEO parent
        $("#" + pip_id).parent().css({
            left: parseInt(left) + "px",
            top: parseInt(top)+ "px"
        });

        $("#" + pip_id).show();
    }
    else {
        $("#" + pip_id).css("position","absolute");

        // [WEBCOMM17-5010]
        if($("#" + pip_id).closest('body').css('background-color') == "rgba(0, 0, 0, 0)") {
            $("#" + pip_id).css("border", "0px");
        }

        var videoheight = height;
        var videowidth = width;
        videoheight = (height+2) > RESOLUTION_HEIGHT ? RESOLUTION_HEIGHT : (height+2);
        videowidth = (width+1) > RESOLUTION_WIDTH ? RESOLUTION_WIDTH : (width+1);

        if(left + videowidth >= RESOLUTION_WIDTH) {
            videowidth = videowidth - (left + videowidth - RESOLUTION_WIDTH + 1)
        }
        if(top + videoheight >= RESOLUTION_HEIGHT) {
            videoheight = videoheight - (top + videoheight - RESOLUTION_HEIGHT + 1);
        }

        //logConsole("resizing to PIP-- screen name:");
        hcapPromise.video.setVideoSize({
            "x":left, "y":top, "width":videowidth, "height":videoheight,
            "onSuccess":function() {

            },
            "onFailure":function(f) {
                logConsole("onFailure : errorMessage = " + f.errorMessage);
            }
        }).finally(function(){
            $("#" + pip_id).css({
                left: parseInt(left) + "px",
                top: parseInt(top)+ "px",
                width: parseInt(width)+ "px",
                height: parseInt(height)+ "px"
            });

            var fDoc = parent.getIframeObject();
            if (!_.isNull(fDoc) && fDoc.document.getElementById(pip_id) !== null){
                var element = fDoc.document.getElementById(pip_id);
                element.style.backgroundImage = 'url(tv:)';
                element.style.left = parseInt(left + 1) + "px";
                element.style.top = parseInt(top + 1) + "px";
            }

            $("#" + pip_id).show();
        });

        hcap.video.setOsdTransparencyLevel({
            "level":100,
            "onSuccess":function() {
                //logConsole("onSuccess oSD");
            },
            "onFailure":function(f) {
                logConsole("onFailure OSD: errorMessage = " + f.errorMessage);
            }
        });
    }
}

function resizePIPtoFullScreen(callback){
    logConsole("{page_utilities} Resizing PIP to full screen");
    hcap.video.getVideoSize({
        "onSuccess" : function(s) {
            if(s.width != RESOLUTION_WIDTH-1 || s.height!=RESOLUTION_HEIGHT-1){
                /* fix(WEBCOMM17-3511) : only resize PIP to full screen when hcap is focused */
                //logConsole("****************************************************");
                //logConsole("s.width: " + s.width + ", s.height: " + s.height);
                //logConsole("RESOLUTION_WIDTH: " + RESOLUTION_WIDTH + ", RESOLUTION_HEIGHT: " + RESOLUTION_HEIGHT);
                //logConsole("hcap_focused: " + getCookie("hcap_focused"));
                //logConsole("****************************************************");
                if(getCookie("hcap_focused") == 1) {
                    hcap.video.setVideoSize({
                        "x":0,
                        "y":0,
                        "width":RESOLUTION_WIDTH,
                        "height":RESOLUTION_HEIGHT,
                        "onSuccess":function() {
                            //logConsole("onSuccess of FullScreen ");
                            if(typeof callback == 'function') {
                                callback();
                            }
                        },
                        "onFailure":function(f) {
                            //logConsole("Full screen reset failure  : errorMessage = " + f.errorMessage);
                            if(typeof callback == 'function') {
                                callback();
                            }
                        }
                    });
                } else {
                    logConsole("in resizePIPtoFullScreen && NOT hcap_focused && SUCCESS");
                    if(typeof callback == 'function') {
                        callback();
                    }
                }
            } else {
                if(typeof callback == 'function') {
                    callback();
                }
            }
        },
        "onFailure" : function(f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
            if(typeof callback == 'function') {
                callback();
            }
        }
    });
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return "";
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    /* fix  #[Question] Expiration date of cookie */
    /* check if index.html has SERVER_DATE then compare SERVER_DATE with TV DATE */
    if(typeof window.parent.SERVER_DATE !== "undefined" && window.parent.SERVER_DATE !== "") {
        /* in index.html window.parent is window itself so there is no side effect */
        var sd = new Date(window.parent.SERVER_DATE);
        if(sd.getTime() > d.getTime()) {
            d = sd;
        }
    }
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires + ";path=/";
}

function expireCookie(cname) {
    document.cookie = cname + '=;expires=Sat, 1 Jan 2000 12:00:00 UTC;path=/';

    //logConsole("Expired cookie '" + cname + "'...");
}

function toHex(str) {
    var hex = '';
    for(var i=0;i<str.length;i++) {
        hex += ''+str.charCodeAt(i).toString(16);
    }
    return hex;
}

function setUniqueSessionID() {
    var serial_number;
    var model_name;
    session_id = 'LGE';

    session_id = session_id + Math.random() + Math.random();
    session_id = session_id.substring(0,20);
    session_id = toHex(session_id);

    setCookie('session_id', session_id, COOKIE_EXPIRE_DAYS);
    return session_id;
}

function getCurrentConfigChannel() {
    guideButtonChannel = getCookie("guideButtonChannel");
    currentchannel_cookie = getCookie("current_channel");

    if (typeof guideButtonChannel !== "undefined" && guideButtonChannel > -1 && guideButtonChannel != '') {
        current_channel = guideButtonChannel;
        logConsole("guideButtonChannel exists, current_channel = " + current_channel);
    }
    else if (typeof currentchannel_cookie !== "undefined" && currentchannel_cookie > -1 && currentchannel_cookie != ''){
        current_channel = currentchannel_cookie;
        logConsole("currentchannel_cookie exists, current_channel = " + current_channel);    }
    else {
        logConsole("current_channel not set, requesting from HCAP!");

        startChannelLogicalNumber = getCookie("startChannelLogicalNumber");
        hcap.channel.getCurrentChannel({
            "onSuccess" : function(s) {
                /*logConsole("SUCCESS :" +
                 "<br /> logical number    : " + s.logicalNumber   +
                 "<br /> program number    : " + s.programNumber   +
                 "<br /> major number      : " + s.majorNumber     +
                 "<br /> minor number      : " + s.minorNumber     +
                 "<br /> rf broadcast type : " + s.rfBroadcastType +
                 "<br /> ip                : " + s.ip);*/

                ch = getLogicalChannelInfo(s);
                current_channel = ch.logicalChannelNumber;
                // logConsole("{utilities} [2] Resetting 'current_channel' to " + current_channel);
                setCookie("current_channel", current_channel, COOKIE_EXPIRE_DAYS);

                hcap_ready = 1;
            },
            "onFailure" : function(f) {
                logConsole("FAILURE in getCurrentConfigChannel!");
            }
        });

        logConsole("got past hcap.channel.getCurrentChannel");

        if (!isEditorMode() && !isPreviewMode()) {
            setTimeout(function() {
                if (hcap_ready == 0) {
                    location.reload();
                }
            }, 10000);
        }
    }
}

function setChannels(param_force_read_ind, callback) {
    var retrievedObject;
    var filteredretrievedObject;

    force_read_ind = 0;
    if (typeof param_force_read_ind !== "undefined") {
        force_read_ind = param_force_read_ind;
    }

    // Skip trying to read from local storage
    if (force_read_ind) {
        getChannelList();
    }
    else {
        // Attempt to load from local Storage
        retrievedObject = getLocalStorageObject('channellist');
        filteredretrievedObject = getLocalStorageObject('filteredchannellist');

        if ($.isPlainObject(retrievedObject) && !$.isEmptyObject(retrievedObject) && getCookie("channel_filters_set") == "") {
            channels = retrievedObject;
            sortChannelByActiveLang();
        }
        else if ($.isPlainObject(filteredretrievedObject) && !$.isEmptyObject(filteredretrievedObject) && getCookie("channel_filters_set") != "") {
            channels = filteredretrievedObject;
            sortChannelByActiveLang(0);
        }
        // Load from json file if not available
        else {
            getChannelList();
        }
    }

    setTimeout(function() {
        parseChannelFilters(channels);

        if(_.isFunction(callback)){
            callback();
        }
    }, 500);
}

function parseChannelFilters(ch_object) {
    if (typeof ch_object !== "undefined" && Object(ch_object).hasOwnProperty("channels")) {
        $.each(ch_object.channels, function(i, ch) {
            if ($.inArray(ch.channelCategory, ch_categories) == -1) {
                ch_categories.push(ch.channelCategory);
                //logConsole("ch.channelCategory: " + ch.channelCategory);
            }

            if (typeof ch.languages !== "undefined" && ch.languages != null) {
            	$.each(ch.languages, function(i, language) {
		            if (language !== "" && $.inArray(language, ch_languages) == -1) {
		                ch_languages.push(language);
		                //logConsole("ch.language: " + language);
		            }
            	})
            }
        });

        ch_categories.sort();
        ch_languages.sort();
        //logConsole(ch_categories);
        //logConsole(ch_languages);
    }
}

function isEditorMode() {
    page_edit_area = $("#page_edit_area");
    if (page_edit_area.length) {
        //  logConsole("isEditorMode: true");
        return true;
    }
    //logConsole("isEditorMode: false");
    return false;
}

function isPreviewMode() {

    //  console.log("caller is " + arguments.callee.caller.toString());

    if (window.location.href.indexOf("/preview") > 0) {
        //  logConsole("isPreviewMode: true");
        return true;
    }
    //logConsole("isPreviewMode: false");
    return false;
}

function getJSONfilepath(cookie_name, json_file_location, filename) {
    // pms data shouldnt be wrong so always fetch new pms data not the cached one
    value = getCookie(cookie_name);

    //check if local file exist
    var read_local_fx = function() {
        if (UrlExists(filename)) {
            return filename;
        }
        else{
            logConsole('{utilities} File ' + filename + ' not found (404)');
            return '';
        }
    };

    if (isEditorMode() || isPreviewMode()) {
        return "/json_data/" + filename;
    }
    else {
        if(typeof COM_TYPE != "undefined" && "IP" == COM_TYPE && getCookie("pmsType") == 'LEGACY' && cookie_name === 'pmsfetchdone') {
            logConsole("cookie_name === pmsfetchdone : " + parent.CACHE_PATH + filename);
            if(parent.CACHE_PATH == '')
                return '';
            return parent.CACHE_PATH + filename;
        }
        else {
            switch(filename) {
                case "accuweather.json":
                case "event_data.json":
                case "customApps.json":
                case "uiConfig.json":
                    if (window.parent.COM_TYPE == 'IP') {
                        return filename;
                    }
                    else if (value != '' && (value == true || value == 'true')) {
                        return json_file_location + filename;
                    }
                    // cookie isn't set, get file from local dir
                    else {
                        return read_local_fx();
                    }
                    break;
                default:
                    if (value != '' && (value == true || value == 'true')) {
                        return json_file_location + filename;
                    }
                    // cookie isn't set, get file from local dir
                    else {
                        return read_local_fx();
                    }
                    break;
            }
        }
    }
}

function setSwitchMode(mode, callback) {
    if (typeof mode != undefined && (mode == "tv" || mode == "hdmi1" || mode == "hdmi2" || mode == "hdmi3")) {
        switch(mode) {
        case "tv":
            switchMode_type = hcap.externalinput.ExternalInputType.TV;
            switchMode_index = 0;
            break;
        case "hdmi1":
            switchMode_type = hcap.externalinput.ExternalInputType.HDMI;
            switchMode_index = 0;
            break;
        case "hdmi2":
            switchMode_type = hcap.externalinput.ExternalInputType.HDMI;
            switchMode_index = 1;
            break;
        case "hdmi3":
            switchMode_type = hcap.externalinput.ExternalInputType.HDMI;
            switchMode_index = 2;
            break;
        }

        hcap.externalinput.getCurrentExternalInput({
            "onSuccess" : function(s) {
                var input_type = parseInt(s.type);
                var input_index = parseInt(s.index);
                logConsole("Success! hcap_input: " + input_type + ", input_index: " + input_index);
                
                if(switchMode_type == input_type && switchMode_index == input_index){
                    logConsole("{utilities} Switch Mode and current external input are the same.(" + mode + ")");
                    setCookie("portal_mode", mode, COOKIE_EXPIRE_DAYS);
                    if(typeof callback === "function") {
                        callback();
                    }
                }else{
                    hcap.externalinput.setCurrentExternalInput({
                        "type" : switchMode_type,
                        "index" : switchMode_index,
                        "onSuccess" : function() {
                            logConsole("{utilities} Switching to " + mode + " mode ....");
                            setCookie("portal_mode", mode, COOKIE_EXPIRE_DAYS);
            
                            if(typeof callback === "function") {
                                callback();
                            }
                        },
                        "onFailure" : function(f) {
                            logConsole("externalinput.setCurrentExternalInput onFailure : errorMessage = " + f.errorMessage);
                            switch(mode) {
                            case "hdmi1":
                                showPopup('HDMI1 NOT AVAILABLE');
                                break;
                            case "hdmi2":
                                showPopup('HDMI2 NOT AVAILABLE');
                                break;
                            case "hdmi3":
                                showPopup('HDMI3 NOT AVAILABLE');
                                break;
                            }
            
                            if(mode == "tv") {
                                if(typeof callback === "function") {
                                    callback();
                                }
                            } else if(typeof window.parent.GLOBAL_SOUND_SETTING != "undefined" && window.parent.GLOBAL_SOUND_SETTING == 2 && typeof window.parent.controlBgm == "function") {
                                window.parent.controlBgm(1);
                            }
                        }
                    });
                }
            }, 
            "onFailure" : function(f) {
                console.log("onFailure : errorMessage = " + f.errorMessage);
            }
       });
    } else {
        logConsole("{utilities} The input parameter of function setSwitchMode is undefined: " + mode);
    }
}

function switchMode(setMode, setPortal) {
    if (isEditorMode() || isPreviewMode()) {
        console.log("In Editor/Preview mode this '" + setMode + "' is disabled");
        return;
    }

    var setPortalMode_Func = null;
    if (typeof setPortal != "undefined") {
        if (setPortal == false) {
            setPortalMode_Func = function() {
                SetPortalStatus(HIDE_PORTAL);
            };
        } else if (setPortal == true) {
            setPortalMode_Func = function() {
                SetPortalStatus(SHOW_PORTAL);
            };
        }
    }

    var setSwitchMode_Func = function() {
        setSwitchMode(setMode, setPortalMode_Func);
    };

    if(setMode == "tv") {
        if(typeof window.parent.GLOBAL_SOUND_SETTING != "undefined" && window.parent.GLOBAL_SOUND_SETTING == 2 && typeof window.parent.controlBgm == "function") {
            window.parent.controlBgm(0, setSwitchMode_Func);
        } else {
            setSwitchMode_Func();
        }
    } else {
        hcap.externalinput.getCurrentExternalInput({
            "onSuccess" : function(s) {
                // logConsole("getCurrentExternalInput onSuccess :" + " type = " + s.type + " index = " + s.index);

                if((s.type == hcap.externalinput.ExternalInputType.HDMI)
                    && ((s.index == 0 && setMode == "hdmi1") || (s.index == 1 && setMode == "hdmi2") || (s.index == 2 && setMode == "hdmi3"))) {
                        if(typeof setPortal != "undefined" && setPortal == false) {
                            SetPortalStatus(HIDE_PORTAL);
                        }
                }
                else {
                    if(typeof window.parent.GLOBAL_SOUND_SETTING != "undefined" && window.parent.GLOBAL_SOUND_SETTING == 2 && typeof window.parent.controlBgm == "function") {
                        window.parent.controlBgm(0, setSwitchMode_Func);
                    } else {
                        setSwitchMode_Func();
                    }
                }
            },
            "onFailure" : function(f) {
                logConsole("getCurrentExternalInput onFailure :" + f.errorMessage);
                showPopup("FAILED TO GET CURRENT EXTERNAL INPUT");
            }
        });
    }
}

function showGroupingFilters(element_id) {
    logConsole("In showGroupingFilters...");

    grouping_container = $('<div class="grouping_container"></div>');
    grouping_filter = $('<div class="grouping_filter"><div style="top: 20%; position: relative"">Show All</div></div>');
    grouping_filter.click(function() {
        filterChannelsByCategory('', 1)
    });
    grouping_filter.appendTo(grouping_container);

    filter_count = 1;
    $.each(ch_categories, function(i, category) {
        category_div = $('<div style="top: 20%; position: relative">' + category + '</div>');

        grouping_filter = $('<div class="grouping_filter"></div>');
        category_div.appendTo(grouping_filter);

        grouping_filter.click(function() {
            filterChannelsByCategory(category, 1)
        });
        grouping_filter.appendTo(grouping_container);
        filter_count++;
    });

    overlay = $(element_id + " > .window_overlay");
    grouping_container.appendTo(overlay);
    overlay.attr("revert_id", element_id);

    grouping_container = $(element_id + " > .window_overlay > .grouping_container");
    grouping_filter = $(element_id + " > .window_overlay > .grouping_container >.grouping_filter:eq(0)");

    filter_height = 50;
    total_height = filter_count * filter_height;

    window_height = 720;

    offset = (window_height - grouping_container.height()) / 2;

    grouping_container.css({
        marginTop:offset + "px"
    });
}

function filterChannelsByCategory(category_name, param_reload_page_ind) {
    logConsole("In filterChannelsByCategory, selecting " + category_name);
    var channelList = localStorage.getItem('channellist');
    if(channelList){
        channelList = LZString.decompress(channelList);
    }

    if(channelList != null && getCookie("channel_filters_set") == "") {
        channels = JSON.parse(channelList);
    }

    var adjusted_channels_array = [];
    var adjusted_channels = {};

    reload_page_ind = 1;
    if (typeof param_reload_page_ind !== "undefined") {
        reload_page_ind = param_reload_page_ind;
    }

    if (category_name == '' || category_name == 'Show All') {
        expireCookie("channel_filters_set");
        localStorage.removeItem('filteredchannellist');

        if (reload_page_ind == 0) {
            $.each(channels.channels, function(i, ch) {
                adjusted_channels_array.push(ch);
            });

            adjusted_channels.channels = adjusted_channels_array;
        }
    }
    else {
        $.each(channels.channels, function(i, ch) {
            if (ch.channelCategory == category_name) {
                adjusted_channels_array.push(ch);
            }
        });

        adjusted_channels.channels = adjusted_channels_array;

        setCookie("channel_filters_set", 'true', COOKIE_EXPIRE_DAYS);
        localStorage.setItem('filteredchannellist', JSON.stringify(adjusted_channels));
    }

    if (reload_page_ind) {
        location.reload();
    }

    return adjusted_channels;
}

function filterChannelsByLanguage(language_name, param_reload_page_ind) {
    // logConsole("In filterChannelsByLanguage, selecting " + language_name);
    var channelList = localStorage.getItem('channellist');
    if(channelList){
        channelList = LZString.decompress(channelList);
    }

    if(channelList != null && getCookie("channel_filters_set") == "") {
        channels = JSON.parse(channelList);
    }

    var adjusted_channels_array = [];
    var adjusted_channels = {};

    reload_page_ind = 1;
    if (typeof param_reload_page_ind !== "undefined") {
        reload_page_ind = param_reload_page_ind;
    }

    if (language_name == '' || language_name == 'Show All') {
        expireCookie("channel_filters_set");
        localStorage.removeItem('filteredchannellist');

        if (reload_page_ind == 0) {
            $.each(channels.channels, function(i, ch) {
                adjusted_channels_array.push(ch);
            });

            adjusted_channels.channels = adjusted_channels_array;
        }
    }
    else {
        $.each(channels.channels, function(i, ch) {
        	if (typeof ch.languages !== "undefined" && ch.languages != null) {
				$.each(ch.languages, function(i, language) {
		            if (language == language_name) {
		                adjusted_channels_array.push(ch);
		            }
				});
        	}
        });

        adjusted_channels.channels = adjusted_channels_array;

        setCookie("channel_filters_set", 'true', COOKIE_EXPIRE_DAYS);
        localStorage.setItem('filteredchannellist', JSON.stringify(adjusted_channels));
    }

    if (reload_page_ind) {
        location.reload();
    }

    return adjusted_channels;
}

function lookupLanguageByCode(lang_code) {
	var master_languages = {};
	var lang_name = '';

	if (lang_code == 'Show All') {
		return lang_code;
	}

	var master_languages = getLocalStorageObject("master_language_array");
	logConsole(master_languages);
	if ($.isPlainObject(master_languages) && !$.isEmptyObject(master_languages)) {
		$.each(master_languages, function(code, info) {
			if (code == lang_code) {
				lang_name = info.lang_name;
				return false;
			}
		});
	}
	else {
		lang_name = lang_code;
		logConsole("Unable to find master_language_array in wrapper or portal");
	}

	return lang_name;
}

function findDefaultLanguage() {
	var master_languages = {};
	var lang_code = '';

	var master_languages = getLocalStorageObject("master_language_array");
	logConsole(master_languages);
	if ($.isPlainObject(master_languages) && !$.isEmptyObject(master_languages)) {
		$.each(master_languages, function(code, info) {
            if(info.is_default == "1") {
                lang_code = code;
            }
		});
	} else {
		logConsole("Unable to find default setting language");
	}

	return lang_code;
}

function loadJSON(callback, JSONFile, errCallback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            console.warn("Successfully loaded " + JSONFile);
            try {
                var resp = JSON.parse(xhttp.responseText);
            }
            catch (e) {
                logConsole("eE: " + JSON.stringify(e))
            }
            callback(resp);
        }
        else if (xhttp.readyState == 4 && xhttp.status == 404) {
            if(typeof errCallback === "function") errCallback({});
            return 0;
        }
        else if (xhttp.readyState == 4){
            if(typeof errCallback === "function") errCallback({});
        }
    };
    xhttp.open("GET", JSONFile, true);
    xhttp.send();
}

function loadJSONSynchronous(JSONFile) {
    // logConsole("{utilities} Trying to read data from : " + JSONFile);
    try {
        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", JSONFile, false);
        xhttp.send();

        if (xhttp.status === 200) {
            try {
                // logConsole("{utilities} Successfully read data from " + JSONFile);
                return JSON.parse(xhttp.responseText.replace(/\\n/g, ' '));
            }
            catch (e) {
                logConsole("eE: " + JSON.stringify(e));
                return null;
            }
        }
        else if (xhttp.status == 400) {
            logConsole("{utilities} File not found (404) " + JSONFile);
            return null;
        }
    }
    catch(err) {
        return null;
    }
}

function UrlExists(url){
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status;
}


function getTvpmsGuestData(data) {
    //logConsole("starting getTvpmsGuestData(data)");
    //logConsole("data: " + JSON.stringify(data));
    try {
        //read value from data and compare to cookie value (i.e. previous value, if it is false or not)
        var old_checkedIn = getCookie("tvpmsguest"),
            RoomNumber = getCookie("roomnumber"),
            SerialNo = getCookie("tvID"),
            checkedIn = false,
            salutation = '',
            firstName = '',
            lastName = '',
            active_language = getCookie("active_language");

        //logConsole("we are in: " + RoomNumber);
        $.each(data.rooms, function(i, room){
            if (room.RoomID == RoomNumber || room.TVID == SerialNo) {
                //logConsole('found room!');
                //logConsole(JSON.stringify(room));
                checkedIn = room.checkedIn;
                active_language = room.langCode;
                salutation = room.salutation;
                firstName = room.firstName;
                lastName = room.lastName;
            }
        });

        checkedIn = checkedIn.toString().trim();
        old_checkedIn = old_checkedIn.toString().trim();

        //logConsole("old_checkedIn val: " + old_checkedIn + ", checkedIn val: " + checkedIn);

        // If the checkedIn param changes from false to true the TV needs to turn on and show the portal
        if (checkedIn == 'true' && (old_checkedIn == 'false' || old_checkedIn == '')) {

            logConsole("guest checked in");
            logConsole("Updating 'active_channels_language' to check-in language: " + active_language);
            setCookie("active_channels_language", active_language);

            var isCheckedIn = (checkedIn == 'true');
            updateLanguageCookie(isCheckedIn, active_language);

            if (lastName != '' && firstName != '' && salutation != '') {
            	logConsole("Setting name to " + salutation + " " + firstName + " " + lastName );
	            localStorage.setItem("salutation", salutation);
	            localStorage.setItem("firstName",  firstName);
                localStorage.setItem("lastName",   lastName);
			}
			else {
				removeLocalStorage('guestInfo');
            }
            
            if (isEnabledAutoPowerOn()) {
                //show portal
                SetPortalStatus(SHOW_PORTAL);
                localStorage.setItem("keyAllowed", true);

                hcap.power.getPowerMode({
                    "onSuccess" : function(s) {
                        if(s.mode == hcap.power.PowerMode.NORMAL){
                            displayWelcomeMessage(checkedIn);
                        } else {
                            // turn on the tv
                            if(tv_setup.checkin.power == "on") {
                                hcap.power.setPowerMode({
                                    "mode" : hcap.power.PowerMode.NORMAL,
                                    "onSuccess" : function() {
                                        logConsole("Turned on TV!");
                                    },
                                    "onFailure" : function(f) {
                                        console.log("onFailure : errorMessage = " + f.errorMessage);
                                    }
                                });
                                //iot checkin event
                                iotController.requestEvent("CHECK_IN");
                            }
                        }
                    },
                    "onFailure" : function(f) {
                        logConsole("onFailure : errorMessage = " + f.errorMessage);
                    }
                });
            }

            //pay channel
            if (uiConfigUseGroups && COM_TYPE == "RF"){
                parent.fetchPayChannel();
            }

        }

        //logConsole("after if");

        // save value to cookie
        setCookie("tvpmsguest", checkedIn, 1);

        if (checkedIn == 'false') {
            expireCookie("welcomeMsgDisplayed");
            localStorage.removeItem('notice_read_list');

            //logConsole("Expiring 'active_channels_language'....");
            updateLanguageCookie(false, 'expire');
            expireCookie("active_channels_language");
            removeLocalStorage('guestInfo');

            if(old_checkedIn == 'true'){
                if (uiConfigUseGroups && COM_TYPE == "RF" && pmsType == "LEGACY") {  //pay channel RF
                    setPaidChannelList(); //reset
                }

                iotController.requestEvent("CHECK_OUT");
            }
        }

    }
    catch(e) {
        logConsole("getTvpmsGuestData error " + JSON.stringify(e));
    }
}

function displayWelcomeMessage(checkedIn) {
    /* Changed displayWelcomeMessage logic for legacy and RF to use goto function */
    logConsole("************* In displayWelcomeMessage (Legacy) ***************");

    localStorage.setItem("doCheckinEvent", checkedIn);
    goHomePro();
}

function addKeyItem(keyCode, attribute, onSuccess, onFailure) {
    hcap.key.addKeyItem({
        "keycode": 0x00000000,
        "virtualKeycode": keyCode,
        "attribute": attribute,
        "onSuccess": function() {
            if(typeof onSuccess === 'function') {
                onSuccess();
            }
        },
        "onFailure": function(param) {
            if(typeof onFailure === 'function') {
                onFailure(param);
            }
        }
    });
}

function TVSetup(property, value, timeout){
    if(typeof timeout == 'undefined') {
        setProperty(property, value);
    } else {
        if(!$.isNumeric(timeout)) { timeout = 0; }
        setTimeout(function(){
            setProperty(property, value);
        }, timeout);
    }
}

function setProperty(property, value) {
    if (!isPreviewMode() && !isEditorMode()) {
        hcap.property.setProperty({
            "key": property,
            "value": value,
            "onSuccess": function (s) {
                //logConsole("successfully changed '" + property + "' to " + value);
            },
            "onFailure": function (f) {
                logConsole("error changing '" + property + "', " + f.errorMessage);
            }
        });
    }
}

function SetPortalStatus(PORTAL_TOGGLE, sendInputKey, callback) {
    try{
        var logging_message = "";
        var allowHide = localStorage.getItem("allowHide");
        var keyAllowed = localStorage.getItem("keyAllowed");
        var euroGuideButtonSet = getCookie("euroGuideButtonSet");

        if((allowHide === null || allowHide === "true") && (keyAllowed === null || keyAllowed === "true" || PORTAL_TOGGLE == SHOW_PORTAL)) {

            localStorage.setItem("keyAllowed", false);

            if(PORTAL_TOGGLE == SHOW_PORTAL){
                expireCookie("channelbanner_active");

                PORTAL_ACTIVE = true;
                if(typeof window.parent.PORTAL_ACTIVE != "undefined") {
                    window.parent.PORTAL_ACTIVE = true;
                }

                // disable tv_channel_attribute_floating_ui
                TVSetup("tv_channel_attribute_floating_ui", "0", 50);

                addKeyItem(hcap.key.Code.INPUT, 2);

                if(window.parent.GLOBAL_SOUND_SETTING != 2) {
                    // Disable subtitle
                    if (! IS_MIA_PROJECT) {
                        TVSetup("tv_caption_ui", "0", 50);
                    }
                }

                if(typeof callback == 'function') {
                    callback();
                }

                if (euroGuideButtonSet == 'true') {
                	  addKeyItem(hcap.key.Code.GUIDE, 2);
                }
            }
            else if(PORTAL_TOGGLE == HIDE_PORTAL){
                var currentChannel = getPhysicalChannelInfo(getCookie("current_channel"));
                window.logStorage.sendEvent(window.logStorage.code.USAGE.CHANNEL, currentChannel.channelLabel.toUpperCase()||"UNKNOWN");

                // Sleep Timer off
                localStorage.setItem("timer_on", "false");

                PORTAL_ACTIVE = false;
                if(typeof window.parent.PORTAL_ACTIVE != "undefined") {
                    window.parent.PORTAL_ACTIVE = false;
                }

                if (typeof window.parent == 'undefined') {
                    logConsole("window.parent = undefined!!!!!");
                    return;
                }

                if(typeof window.parent.GLOBAL_SOUND_SETTING !== 'undefined' && window.parent.GLOBAL_SOUND_SETTING != 2) {
                    // Enable subtitle
                    if (! IS_MIA_PROJECT) {
                        TVSetup("tv_caption_ui", "1", 0);
                    }

                    /* WEBCOMM17-4460 adbanner, button switchmode doesnt work */
                    if(typeof callback == 'function') {
                        callback();
                    }
                }

                resizePIPtoFullScreen(function() {
                    $(window.frameElement).addClass('hidden');
                    // TV Sound On
                    if(typeof  window.parent.GLOBAL_SOUND_SETTING != "undefined") {
                        if(window.parent.GLOBAL_SOUND_SETTING == 0 && !isVODPlaying()) {
                            if(typeof window.parent.soundOn == "function") {
                                window.parent.soundOn();
                            }
                        } else if(window.parent.GLOBAL_SOUND_SETTING == 2) {
                            if(typeof window.parent.controlBgm == "function") {
                                window.parent.controlBgm(0, callback);
                            }
                        }
                    }
                    else {
                        var tv_sound = localStorage.getItem("tv_sound");

                        if (typeof tv_sound !== "undefined" && tv_sound != "") {
                            logging_message = logging_message + "<br />Restore sound to " + tv_sound;

                            hcap.volume.setVolumeLevel({
                                "level" : parseInt(tv_sound),
                                "onSuccess" : function() {
                                    logConsole("TURNED ON TV SOUND!");
                                },
                                "onFailure" : function(f) {
                                    logConsole("onFailure : errorMessage = " + f.errorMessage);
                                }
                            });
                        }
                    }

                    if(!isVODPlaying()) {
                       if (euroGuideButtonSet == 'true') {
                           switchNativeEPG(sendInputKey);
                       }

                       addKeyItem(hcap.key.Code.INPUT, 0, function() {
                        if(typeof sendInputKey != "undefined" && sendInputKey == "INPUT") {
                            hcap.key.sendKey({
                               "virtualKeycode" : hcap.key.Code.INPUT,
                               "onSuccess" : function() {
                                    hidePortal();
                               },
                               "onFailure" : function(f) {
                                    hidePortal();
                               }
                            });
                        } else if(sendInputKey == "FLASHBK" || sendInputKey == "EPG"){
                            current_channel = parseInt(getCookie("current_channel"));
                            if(document.location.href.indexOf("channelbanner.html") < 0) {
                              TVSetup("tv_channel_attribute_floating_ui", "1", 50);
                              document.body.style.display="none";
                              goto('channelbanner');
                            } else {
                              update_channelbanner();
                            }
                        } else {
                          hidePortal();
                        }
                       }, function(param) {
                          hidePortal();
                       });
                    } else {
                        var parentBody = $(window.parent.document).find("body");
                        parentBody.css('background-image','none');
                        parentBody.css('background-color','black');
                        hidePortal();
                    }
                });

                //For RF functionality
                if(parent.CHANNEL_TYPE === 'RF_DATA' && !isVODPlaying()) {
                    if(sendInputKey != "FLASHBK" && sendInputKey != "EPG") {
                        //IDSSW-404
                        hcap.externalinput.getCurrentExternalInput({
                            "onSuccess" : function(s) {
                                var input_type = parseInt(s.type);
                                var input_index = parseInt(s.index);
                                logConsole("Success! hcap_input: " + input_type + ", input_index: " + input_index);

                                if (input_type == hcap.externalinput.ExternalInputType.TV){
                                    releaseDatachannelForCarousel(true, true);
                                }
                            },
                            "onFailure" : function(f) {
                                console.log("onFailure : errorMessage = " + f.errorMessage);
                            }
                        });
                    }
                }

            }
        }
    }
    catch(e){
        logConsole("Error in SetPortalStatus: " + JSON.stringify(e));
    }

    logConsole("PORTAL_ACTIVE: " + PORTAL_ACTIVE);
}

function hidePortal() {
    logConsole("In hidePortal....");

    portal_mode = getCookie("portal_mode");
    if (portal_mode == '') {
        portal_mode = PORTAL_MODE_TV;
    }
    logConsole("portal_mode: " + portal_mode);

    var redirect_prefix = '';
    var url = window.location.href;

    if (isPreviewMode() && url.indexOf("preview")== -1) {
        redirect_prefix = "src/";
    }

    if (portal_mode == PORTAL_MODE_TV || portal_mode == '') {
        var prevChannel = parseInt(getCookie('previous_channel'));
        var speechChannel = parseInt(getCookie('speech_channel'));
        if (prevChannel > -1){
            current_channel = prevChannel;
            var physical_channel = getPhysicalChannelInfo(current_channel);
            if (!_.isUndefined(physical_channel) && !_.isEmpty(physical_channel)){
                changeChannel(physical_channel, 0, 0, 'hidePortal', function() {
                    setCookie('previous_channel', -1, COOKIE_EXPIRE_DAYS);
                    TVSetup("tv_channel_attribute_floating_ui", "1", 250);
                    document.body.style.display="none";
                    goto('channelbanner');
                });

            }
            else {
                logConsole("Unable to find physical channel info for " + current_channel);
            }
        } else if(speechChannel > -1) {
            current_channel = speechChannel;
            var physical_channel = getPhysicalChannelInfo(current_channel);
            if (!_.isUndefined(physical_channel) && !_.isEmpty(physical_channel)){
                changeChannel(physical_channel, 0, 0, 'hidePortal', function() {
                    setCookie('speech_channel', -1, COOKIE_EXPIRE_DAYS);
                    TVSetup("tv_channel_attribute_floating_ui", "1", 250);
                    document.body.style.display="none";
                    goto('channelbanner');
                });

            }
            else {
                logConsole("Unable to find physical channel info for " + current_channel);
            }
        } else {
            current_channel = parseInt(getCookie("current_channel"));
            var physical_channel = getPhysicalChannelInfo(current_channel);
            changeChannel(physical_channel, 0, 0, 'hidePortal', function() {
                TVSetup("tv_channel_attribute_floating_ui", "1", 250);
                document.body.style.display="none";
                goto('channelbanner');
            });
        }
    }
    else {
        TVSetup("tv_channel_attribute_floating_ui", "1", 250);
        if (portal_mode == PORTAL_MODE_VOD) {
            document.body.style.display="none";
            window.location = redirect_prefix + "channelbanner.html?mode=VOD&vod_idx=" + getCookie("vod_idx");
        }
        else if (portal_mode == PORTAL_MODE_HDMI_1) {
            document.body.style.display="none";
            window.location = redirect_prefix + "channelbanner.html?mode=HDMI1";
        }
        else if (portal_mode == PORTAL_MODE_HDMI_2) {
            document.body.style.display="none";
            window.location = redirect_prefix + "channelbanner.html?mode=HDMI2";
        }
        else if (portal_mode == PORTAL_MODE_HDMI_3) {
            document.body.style.display="none";
            window.location = redirect_prefix + "channelbanner.html?mode=HDMI3";
        }
        else if (portal_mode == PORTAL_MODE_COMPONENT) {
            document.body.style.display="none";
            window.location = redirect_prefix + "channelbanner.html?mode=component";
        }
        else if (portal_mode == PORTAL_MODE_COMPOSITE) {
            document.body.style.display="none";
            window.location = redirect_prefix + "channelbanner.html?mode=composite";
        }
        else if (portal_mode == PORTAL_MODE_SVIDEO) {
            document.body.style.display="none";
            window.location = redirect_prefix + "channelbanner.html?mode=svideo";
        }
        else if (portal_mode == PORTAL_MODE_SCART) {
            document.body.style.display="none";
            window.location = redirect_prefix + "channelbanner.html?mode=scart";
        }
    }
}

function loadWidgetJSON(attributes, callback, JSONFile, errCallback) {
    logConsole("In loadWidgetJSON...." + JSONFile);
    var pmsType = getCookie("pmsType");

    if (typeof JSONFile == "undefined") {
        return false;
    }

    if (JSONFile === 'tvpms.json' && ('IP' == COM_TYPE && pmsType != 'LEGACY')) {
        //logConsole("FETCH FROM AM " + JSONFile);
        fetchAMData('fetchtvpms', 'ip', function (data) {
            logConsole("{PMS} Step 2/2: PMS data fetched " + JSON.stringify(data));
            if (typeof(data.rooms) !== 'undefined' && data.rooms.length > 0 && typeof(data.rooms[0].lastName) !== 'undefined' && data.rooms[0].lastName != 'null' && data.rooms[0].lastName != null) {

                if('null' == data.rooms[0].salutation || null == data.rooms[0].salutation) {
                    data.rooms[0].salutation = '';
                }
                localStorage.setItem("salutation", data.rooms[0].salutation);
                localStorage.setItem("firstName",  data.rooms[0].firstName);
                localStorage.setItem("lastName",   data.rooms[0].lastName);
                localStorage.setItem("fullName", data.rooms[0].fullName);
                if (!_.isNull(data.rooms[0].email)){
                    localStorage.setItem("email", data.rooms[0].email);
                }
                if (!_.isNull(data.rooms[0].phone)){
                    localStorage.setItem("phone", data.rooms[0].phone);
                }
                updateLanguageCookie(true);
                //logConsole('///////  guest name: ' + localStorage.getItem("salutation") + ' ' + localStorage.getItem("firstName") + ' ' + localStorage.getItem("lastName"));
                //unsetClearAndReboot(function(){ var md5 =  Crypto.MD5('' + $.now()); getAMData('getPaidChannelList', md5); });
                
                if (!IS_MIA_PROJECT && _.isEmpty(localStorage.getItem("doCheckinEvent")) && isCheckedIn() && !_.isEmpty(getCookie("popup_frequency")) && getCookie("welcomeMsgDisplayed") !== "true") {
                    doCheckin(data, "live");
                }
            }
            else {
                //logConsole('/////// GUEST NAME NOT DEFINED');
                removeLocalStorage('guestInfo');
                updateLanguageCookie(false);
            }
            callback(attributes, data);
        }, null);
    }
    else if (JSONFile === 'fetchGuestName' && ('IP' == COM_TYPE && pmsType != 'LEGACY')) {
        //logConsole("FETCH FROM AM " + JSONFile);
        fetchAMData('fetchGuestName', 'ip', function (data) {
            if (typeof(data) !== 'undefined' && typeof(data.checkedIn) !== 'undefined' && data.checkedIn == true && typeof(data.lastName) !== 'undefined' && data.lastName != 'null' && data.lastName != null) {

                if ('null' == data.salutation || null == data.salutation) {
                    data.salutation = '';
                }
                localStorage.setItem("salutation", data.salutation);
                localStorage.setItem("firstName", data.firstName);
                localStorage.setItem("lastName", data.lastName);
                updateTvOccupancyStatus('checked-in');
                //logConsole('///////  guest name: ' + localStorage.getItem("salutation") + ' ' + localStorage.getItem("firstName") + ' ' + localStorage.getItem("lastName"));
                unsetClearAndReboot();

            } else {
                //logConsole('/////// GUEST NAME NOT DEFINED');
                removeLocalStorage('guestInfo');
                updateTvOccupancyStatus('checked-out');
            }
            callback(attributes, data);
        }, null);

    }
    else if (JSONFile.indexOf("event_data.json") > -1 && (typeof COM_TYPE !== 'undefined' && 'IP' == COM_TYPE && pmsType != 'LEGACY')) {

        //logConsole("FETCH FROM AM " + JSONFile);
        loadJsonFromAsyncManager("event_data.json", "event_data" , callback, attributes);

    }
    else if(JSONFile === 'accuweather.json'  && 'IP' == COM_TYPE && !isEditorMode() ){
        var md5 =  Crypto.MD5('' + $.now());
        var now_ts = moment().unix();
        if(localStorage.getItem("weather_data") !== null){
            var weather_data = JSON.parse(localStorage.getItem('weather_data'));
            var last_weather_update = parseInt(weather_data.lastUpdateTime / 1000);
            var diff = now_ts - last_weather_update;
            if ( diff < 1800) {
                callback(attributes, weather_data);
            }
            else{
                callbacks_array[md5] = function (data){
                    callback(attributes, data);
                };
                callbacks_array[md5]["JSONFile"] = JSONFile;
                getAMData('gettvweather',md5);
            }

        }else{
            callbacks_array[md5] = function (data){
                callback(attributes, data);
            };
            callbacks_array[md5]["JSONFile"] = JSONFile;
            getAMData('gettvweather',md5);
        }
    }
    else if(JSONFile === 'inroom.json' && !isEditorMode()  && ('IP' == COM_TYPE && pmsType != 'LEGACY') ){
        //logConsole("inroom.json");
        var md5 =  Crypto.MD5('' + $.now());
        var now_ts = moment().unix();
        if(localStorage.getItem("inroom_data") !== null){
            var weather_data = JSON.parse(localStorage.getItem('inroom_data'));
            var last_weather_update = parseInt(weather_data.lastUpdateTime / 1000);
            var diff = now_ts - last_weather_update;
            if ( diff < 1800) {
                callback(attributes, weather_data);
            }else{
                callbacks_array[md5] = function (data){
                    callback(attributes, data);
                };
                getAMData('getDeviceList',md5);
            }

        }else{
            callbacks_array[md5] = function (data){
                callback(attributes, data);
            };
            getAMData('getDeviceList',md5);
        }
    }
    else {
        errCallback = (typeof errCallback !== "function") ? _.noop : errCallback;

        if (_.isEmpty(JSONFile)) {
            console.log("{utilities} JSONFile is empty");
            return;
        }
        var uncached_file = JSONFile + "?timestamp=" + new Date().getUTCMilliseconds();
        console.log("{utilities} uncached_file: " + uncached_file);

        var xobj = new XMLHttpRequest();
        xobj.open("GET", uncached_file + "?" + Date.now(), true);
        logConsole("Trying to load: " + uncached_file);
        xobj.onreadystatechange = function () {

            try {
                if (xobj.readyState == XMLHttpRequest.DONE && xobj.status == "200") {
                    // Replace all line breaks with spaces
                    data = JSON.parse(xobj.responseText.replace(/\\n/g, ' '));

                    if (JSONFile.indexOf("event_data.json") > -1) {
                        logIndexConsole("{data} Successfully read EPG data from " + JSONFile);
                        setCookie("eventInfoFound", 1, COOKIE_EXPIRE_DAYS);
                    }

                    if (JSONFile.indexOf("accuweather.json") > -1) {
                        logIndexConsole("{data} Successfully read weather data from " + JSONFile);
                        localStorage.setItem("weather_data", JSON.stringify(data));
                    }

                    callback(attributes, data);
                } else if (xobj.readyState == XMLHttpRequest.DONE) {
                    errCallback(attributes);
                    logConsole("XMLHttpRequest.DONE AND xobj.status == " + xobj.status + " for JSONFile: " + JSONFile);

                    if (JSONFile.indexOf("event_data.json") > -1) {
                        logConsole("Failed loading event_data.json, try again.... ");
                        expireCookie("eventInfoFound", 1, 1);
                    }
                    else if(xobj.status == "404") {
                        var CAROUSEL_PATH = localStorage.getItem("CAROUSEL_PATH");
                        if (CAROUSEL_PATH == null) CAROUSEL_PATH = "";
                        logConsole("Loadwidgetjson failed! request carousel from carousel path " + CAROUSEL_PATH + JSONFile.split("/").pop());

                        hcap.carousel.requestCacheCarouselData({
                            "url": CAROUSEL_PATH + JSONFile.split("/").pop(),
                            "onSuccess": function() {
                                logConsole("onSuccess");
                            },
                            "onFailure": function(f) {
                                logConsole("onFailure : errorMessage = " + f.errorMessage);
                            }
                        });
                    }
                }
            } catch (e) {
                logConsole("{utilities} error: " + JSON.stringify(e));
                console.trace("tracing error...");
                if (JSONFile.indexOf("event_data.json") > -1) {
                    expireCookie("eventInfoFound", 1, 1);
                }
                errCallback(attributes);
            }
        };
        xobj.send(null);
    }
}

function SyncBackgroundSettingsToParent(lookup_page_url) {
    logConsole('SyncBackgroundSettingsToParent');
    /* If the problem does not occur in the PCD 3.5 DV event, remove the unused code*/
    if(lookup_page_url != 'none') return;

    var current_url;
    pos = location.pathname.lastIndexOf("/");
    pre_path = location.pathname.substring(0, pos + 1);
    current_url = location.pathname.replace(pre_path, "").replace(".html","");

    // Only do on TV
    if (isPreviewMode() || isEditorMode()) {
        return;
    }

    var bg_attributes = null;
    var parentBody = $(window.parent.document).find("body");

    if (lookup_page_url == 'none') {
        if (!IS_MIA_PROJECT) {
            TVSetup("tv_caption_ui", "1");
        }
        parentBody.css('background-image','url(tv:)');
        parentBody.css('background-color','transparent');
        return;
    }

    if (!IS_MIA_PROJECT) {
        TVSetup("tv_caption_ui", "0");
    }

    $.each(preloaded_images, function(page_name, attributes) {
        if (lookup_page_url == page_name) {
            bg_attributes = attributes;

            if (attributes.background_transition != 'none' && attributes.background_transition != '' ) {
                logConsole("Transition found, setting index to current page");
                lookup_page_url = current_url;

                $.each(preloaded_images, function(page_name2, attributes2) {
                    if (current_url == page_name2) {
                        bg_attributes = attributes2;
                        return false;
                    }
                });
                return false;
            }
            return false;
        }
    });

    logConsole("Syncing with " + lookup_page_url);
    //logConsole(bg_attributes);

    // Sync index.html with target page settings
    if (bg_attributes != null) {

        if (bg_attributes.background_color == 'none' || bg_attributes.background_color == 'transparent') {
            parentBody.css('background-image', 'url(tv:)');
        }
        else {
            parentBody.css('background-color', bg_attributes.background_color);
        }

        if (bg_attributes.background_url.length > 3 && bg_attributes.background_transition == 'none') {

            parentBody.css('background-image', 'url(' + bg_attributes.background_url + ')');
            parentBody.css('background-repeat', bg_attributes.background_repeat);

            if (bg_attributes.background_image_stretch == '1') {
                var res = RESOLUTION_WIDTH + 'px' +' '+ RESOLUTION_HEIGHT + 'px';
                parentBody.css('background-position', '0 0');
                parentBody.css('background-size', res);
            } else {
                //if parent bg wasn't set to stretch reset the size
                parentBody.css('background-size', 'auto');
                parentBody.css('background-position', bg_attributes.background_image_left + 'px ' + bg_attributes.background_image_top + 'px');
            }
        }
        else {
            parentBody.css('background-image', 'none');
        }
    }
}

function preloadBackgroundImages() {
    //logConsole("preloadBackgroundImages");
    preloaded_images_div = $(".preloaded_images");

    if (preloaded_images_div.length) {
        $.each(preloaded_images, function(page_name, attributes) {

            if (attributes.background_url != "none") {
                var img = new Image();
                img.src = attributes.background_url;
                //$('<img src="' + attributes.background_url + '" width="10" height="10" />').appendTo(preloaded_images_div);
            }
        });
    }
}

function getEPGLanguageValue(eventName, active_language) {
    tmp_eventName = eventName;
    if (tmp_eventName.indexOf("{") > -1) {
        arr = tmp_eventName.split("{");
        $.each(arr, function(i, pair) {
            if (pair != "") {
                pair = pair.replace("}", "");

                cols = pair.split(";");
                lang = cols[0];
                value = cols[1];

                if (active_language == lang) {
                    if (value.indexOf("%20") > -1) {
                        value = decodeURI(value);
                    }
                    tmp_eventName = value;
                }
            }
        });
    }

    return tmp_eventName;
}

function getCurrentLanguage(translations_arr) {
    current_language = getCookie("active_language");
    if (current_language == null || current_language == "") {
        var default_language = localStorage.getItem("default_language");

        if(localStorage.getItem("defaultLanguage") != null && localStorage.getItem("defaultLanguage") != "") {
            default_language = localStorage.getItem("defaultLanguage");
        } else {
            translations_arr = (typeof translations_array !== "undefined") ? translations_array : translations_arr;
            if (typeof translations_arr !== "undefined") {
                $.each(translations_arr, function(unique_id, translations) {
                    $.each(translations, function(code, info) {
                        $.each(info, function(key, value) {
                            default_language = code;
                            return false;
                        });
                    });
                });
            }
        }

        current_language = default_language ;
    }

    return current_language;
}

function setBrowserDebugMode(mode) {
    hcap.system.setBrowserDebugMode({
        "debugMode": mode,
        "onSuccess": function () {
            if (mode) {
                logIndexConsole("Enabled debug inspector - Rebooting in 2 seconds", LOG_MESSAGE_TYPES.milestone_completed);
            } else {
                logIndexConsole("Disabled debug inspector - Rebooting in 2 seconds", LOG_MESSAGE_TYPES.milestone_completed);
                localStorage.removeItem("ENABLE_INSPECTOR");
            }

            setTimeout(function() {
                reboot();
            }, 2000);
        },
        "onFailure": function (f) {
            logIndexConsole("{bootup} Failed to set debug inspector: " + f.errorMessage, LOG_MESSAGE_TYPES.error);
        }
    });
}

function isBrowserDebugAllowed() {
    // Don't do this for STB5500 because this property doesn't exist.
    return window.parent.VOICE_FOR_STB5500 != true;
}

function toggleIndexDebugPanel() {
    logConsole("In toggleIndexDebugPanel...");

    localStorage.setItem("INDEX_DEBUG", "TRUE");
    localStorage.setItem("debugRoomId", localStorage.getItem("room_number"));
    window.parent.setDebugPanelState();
    window.parent.toggleConsole(1);
}

function determineSmartAppBrowserID(url) {
    decoded = decodeURIComponent(url);
    logConsole("decoded: " + decoded);
    arr = decoded.split(/\|/);

    if (arr.length > 1) {
        browser_type = arr[0];
        url = arr[1];
    }
    else {
        browser_type = "0";
        url = decoded;
    }
    logConsole("decoded url: " + url);

    switch(browser_type) {
        case "0":
            app_id = SMART_APP_BROWSER_ID;
            break;
        case "1":
            app_id = SMART_APP_KBROWSER_ID;
            break;
        case "2":
            app_id = SMART_APP_NKBROWSER_ID;
            break;
    }

    browser_obj = {
        app_id: app_id,
        url: url,
        browser_type: browser_type
    };

    return browser_obj;
}

function findSmartAppById(source_array, id) {
    var tmp_app = {};
    $.each(source_array, function(i, app) {
        if (app.id == id) {
            tmp_app = app;
            return false;
        }
    });

    return tmp_app;
}

function findSmartAppByAppId(source_array, app_id) {
    var tmp_app = {};
	$.each(source_array, function(i, app) {
		if (app.app_id == app_id) {
			tmp_app = app;
			return false;
		}
	});

    return tmp_app;
}

function AnimatePageBackgroundEntrance(background_color, background_image_url,  background_repeat, background_image_left, background_image_top, background_image_stretch, background_transition, background_speed, is_channelbanner){

    //logConsole('AnimatePageBackgroundEntrance');

    var parentBody = $(window.parent.document.body);
    if((!isEditorMode() && !isPreviewMode()) && (pageHasVideoOrPipWidget())) {
        parentBody.css('background-color', '#000');
    } else {
        parentBody.css('background-color', 'transparent');
    }

    var page_body = $('body');

    if (background_color == 'transparent' || is_channelbanner) {
        page_body.css('background-image','url(tv:)');
        page_body.css('background-color','transparent');
    } else {
        page_body.css('background-color', background_color);
    }

    if (background_transition == '' || background_transition == 'none' || background_transition == 0) {
        // static background
        //logConsole('static background');

        if (background_image_url.length > 3) {

            page_body.css('background-image', 'url(' + background_image_url + ')');
            page_body.css('background-repeat', background_repeat);

            if (background_image_stretch) {
                page_body.css('background-position', '0 0');
                var res = RESOLUTION_WIDTH + 'px' +' '+ RESOLUTION_HEIGHT + 'px';
                page_body.css('background-size', res);
            } else {
                page_body.css('background-position', background_image_left + 'px ' + background_image_top + 'px');
                page_body.css('background-size', '');
            }
        }

    } else {

        // animated background
        //logConsole('animated background');

        // entrance effect
        var x_offset = 0,
            y_offset = 0;


        // calculate fly-in distance
        switch(background_transition) {
            case "left":
                x_offset = - 1280 + background_image_left;
                y_offset = background_image_top;
                break;
            case "right":
                x_offset = 1280 + background_image_left;
                y_offset = background_image_top;
                break;
            case "top":
                x_offset = background_image_left;
                y_offset = -720 + background_image_top;
                break;
            case "bottom":
                x_offset = background_image_left;
                y_offset = 720 + background_image_top;
                break;
        }

        if (background_image_url.length > 3) {

            page_body.css('background-image', 'url(' + background_image_url + ')');
            page_body.css('background-repeat', background_repeat);

            if (background_image_stretch) {
                var res = RESOLUTION_WIDTH + 'px' +' '+ RESOLUTION_HEIGHT + 'px';
                page_body.css('background-size', res);
                page_body.css('background-position-x', (x_offset - background_image_left) + 'px');
                page_body.css('background-position-y', (y_offset - background_image_top) + 'px');

            } else {
                page_body.css('background-size', '');
                page_body.css('background-position-x', x_offset + 'px');
                page_body.css('background-position-y', y_offset + 'px');
            }
        }

        // set delay to animate element
        //logConsole("aninimate page background");
        page_body.animate({
            'background-position-x': background_image_left + 'px',
            'background-position-y': background_image_top + 'px'
        }, background_speed);

        // exit effect
        //logConsole('yes');
        window.animation_status_array++;

        // assign custom event handler for exit effect animations
        $( window ).on('exit_event', function(event) {

            //logConsole("aninimate page background exit");

            page_body.animate({
                    'background-position-x': x_offset + 'px',
                    'background-position-y': y_offset + 'px'
                }, background_speed,
                function(){
                    if (window.animation_status_array > 0) {
                        window.animation_status_array--;
                    }
                }
            );

            return false;
        });
    }
}

function AnimateWidget(element_id, entrance_effect, entrance_direction, entrance_delay, entrance_speed, exit_effect, exit_direction, exit_delay, exit_speed, other_effect, other_direction, other_delay, other_speed){

    //logConsole('AnimateWidget (pre-check) ' + element_id);

    //check if this is not editor
    if ($('.phoenix_main').length > 0) {
        //logConsole('is editor');
        return false;
    } else {
        //logConsole('not editor');
        //logConsole(window.animation_status_array);
    }

    var element = $(element_id + '> div');
    if (_.isEmpty(element)){
        return false;
    }
    // save current position and size of the widget
    var final_position = {};
    final_position.top = parseInt(element.css('top').replace("px", ""));
    final_position.left = parseInt(element.css('left').replace("px", ""));

    var final_top = final_position.top,
        final_left = final_position.left,
        final_width = element.width(),
        final_height = element.height();

    // get this from cookies later_
    var page_width = 1280,
        page_height = 720;

    //logConsole(entrance_effect);
    //logConsole(entrance_direction);

    //logConsole('position: ' + final_left + ' - ' + final_top + ' - ' + final_width + ' - ' + final_height );

    switch (entrance_effect) {
        case "None":
            break;
        case "Fly in":
            var x_offset = 0,
                y_offset = 0;

            // calculate fly-in distance
            switch(entrance_direction) {
                case "left":
                    x_offset = - final_left - final_width;
                    break;
                case "right":
                    x_offset = page_width - final_left;
                    break;
                case "top":
                    y_offset = - final_top - final_height;
                    break;
                case "bottom":
                    y_offset = page_height - final_top;
                    break;
            }

            // position element outside of the visible area
            var padding = parseInt(element.css('padding')) * 2;
            var border = parseInt(element.css('border-width'));

            element.css('left', final_left + x_offset - (padding + border)  + 'px');
            element.css('top', final_top + y_offset - (padding + border)   + 'px');

            // set delay to animate element
            setTimeout(
                function(){
                    if (x_offset != 0) {
                        //logConsole("aninimate x");
                        $(element_id + '> div').animate({left: final_left + 'px'}, entrance_speed);
                    }
                    if (y_offset != 0) {
                        //logConsole("aninimate y");
                        $(element_id + '> div').animate({top: final_top + 'px'}, entrance_speed);

                    }
                }, entrance_delay * 1000);
            break;
        case "Expand":
            // shrink object, and place top and left to the center
            element.css('left', final_left + parseInt(final_width / 2) + 'px');
            element.css('top', final_top + parseInt(final_height / 2) + 'px');
            element.css('width', 0);
            element.css('height', 0);
            element.addClass('hidden');

            // animate size, as well as position, to keep object centered
            setTimeout(
                function(){
                    //logConsole("aninimate expand");
                    $(element_id + '> div').removeClass('hidden');
                    $(element_id + '> div').animate({
                        left: final_left + 'px',
                        top: final_top + 'px',
                        width: final_width + 'px',
                        height: final_height + 'px'
                    }, entrance_speed);

                }, entrance_delay * 1000);

            break;
        case "Fade in":
            element.css('opacity', 0);

            // set delay to animate element
            setTimeout(
                function(){
                    //logConsole("aninimate opacity");
                    $(element_id + '> div').animate({opacity: 1}, entrance_speed);

                }, entrance_delay * 1000);
            break;
    }

    switch (exit_effect) {
        case "None":
            break;
        case "Fly out":
        case "Shrink":
        case "Fade out":
            window.animation_status_array++;
            break;
    }



// assign custom event handler for exit effect animations
    $( window ).on('exit_event', function(event) {

        switch (exit_effect) {
            case "None":
                break;
            case "Fly out":

                x_offset = 0;
                y_offset = 0;
                var animation_status = 0;

                // calculate fly-in distance
                switch (exit_direction) {
                    case "left":
                        x_offset = -final_left - final_width;
                        break;
                    case "right":
                        x_offset = page_width - final_left;
                        break;
                    case "top":
                        y_offset = -final_top - final_height;
                        break;
                    case "bottom":
                        y_offset = page_height - final_top;
                        break;
                }

                // animate element
                if (x_offset != 0) {
                    //logConsole("aninimate x");
                    $(element_id + '> div').animate({left: final_left + x_offset + 'px'}, exit_speed,
                        function(){ animation_status = 1; window.animation_status_array--; }
                    );
                }
                if (y_offset != 0) {
                    //logConsole("aninimate y");
                    $(element_id + '> div').animate({top: final_top + y_offset + 'px'}, exit_speed,
                        function(){ animation_status = 1; window.animation_status_array--;}
                    );
                }

                break;
            case "Shrink":

                // animate size, as well as position, to keep object centered
                //logConsole("aninimate shrink");
                $(element_id + '> div').animate({
                        left: final_left + parseInt(final_width / 2) + 'px',
                        top: final_top + parseInt(final_height / 2) + 'px',
                        width: 0 + 'px',
                        height: 0 + 'px'
                    }, exit_speed,
                    function(){
                        if (window.animation_status_array > 0) {
                            window.animation_status_array--;
                        }
                    }
                );

                break;
            case "Fade out":

                element.css('opacity', 1);

                // set delay to animate element
                //logConsole("aninimate opacity");
                $(element_id + '> div').animate({opacity: 0}, exit_speed,
                    function(){
                        if (window.animation_status_array > 0) {
                            window.animation_status_array--;
                        }
                    }
                );

                break;
        }
    });

    switch (other_effect) {
        case "None":
            break;
        case "Rotate":
            switch (other_speed) {
                case "slow":
                    var duration = 8000;
                    break;
                case "medium":
                    duration = 5000;
                    break;
                case "fast":
                    duration = 2000;
                    break;
            }

            switch (other_direction){
                case "clockwise":
                    var sign = '+',
                        anti_sign= '-';
                    break;
                case "anti-clockwise":
                    sign = '-';
                    anti_sign= '+';
                    break;
            }

        function rotate_widget() {

            var rotation_tag = {};

            rotation_tag["transform"] = 'rotate(' + anti_sign + '180deg)';
            rotation_tag["webkit-transform"] = 'rotate(' + anti_sign + '180deg)';
            rotation_tag["moz-transform"] = 'rotate(' + anti_sign + '180deg)';
            rotation_tag["ms-transform"] = 'rotate(' + anti_sign + '180deg)';
            rotation_tag["o-transform"] = 'rotate(' + anti_sign + '180deg)';

            $(element_id + '> div').css(rotation_tag);
            $(element_id + '> div').animate({rotation : sign+'=360'},{
                duration: duration,
                easing: "linear",
                step: function(now, fx) {
                    rotation_tag["transform"] = 'rotate(' + now + 'deg)';
                    rotation_tag["webkit-transform"] = 'rotate(' + now + 'deg)';
                    rotation_tag["moz-transform"] = 'rotate(' + now + 'deg)';
                    rotation_tag["ms-transform"] = 'rotate(' + now + 'deg)';
                    rotation_tag["o-transform"] = 'rotate(' + now + 'deg)';
                    $(this).css(rotation_tag);
                },
                complete: function(){
                    rotate_widget();
                }
            });
        }

            setTimeout( rotate_widget, entrance_delay * 1000);
            break;
    }
}

function getAsyncManagerUri() {
    return "https://" + GLOBAL_SERVER_IP + ":9443/asyncManager";
}

// function to renew access token
function renewAccessToken() {

    logConsole('/////////////// renewAccessToken //////////////////');

    if (!parseInt(localStorage.getItem("token_renew_pending"))) {
        localStorage.setItem("token_renew_pending", 1);

        var rObject = {
            'action':'refresh_token',
            'client_secret': GLOBAL_SECRET,
            'client_id': localStorage.getItem("client_id"),
            'refresh_token': localStorage.getItem("refresh_token")
        };
        // logConsole('BEFORE REFRESH TOKEN '+ JSON.stringify(rObject));

        $.ajax({
            type: "POST",
            url: getAsyncManagerUri(),
            data: JSON.stringify(rObject),
            headers: {
                'Content-Type': 'application/json'
            },
            dataType: "json",
            cache: false

        }).done(function (response) {
            //logConsole(JSON.stringify(response));
            if(response.access_token != '' && typeof response.access_token != 'undefined') {

                //logConsole('done REFRESH start /////');
                //logConsole('refreshed token: ' + response.access_token);
                logConsole('{utilities} SUCCESSFULLY REFRESHED access_token');

                localStorage.setItem("access_token", response.access_token);
                localStorage.setItem("token_renew_pending", 0);

                /* trigger re-sending of queued requests, which are waiting for token refresh */
                $( window ).trigger('event_resend_am_requests');
            }
            else {
                logConsole('{utilities} UNABLE TO REFRESH access_token, WILL RE-AUTOMAP [1]');
                window.parent.postMessage('retry_auto_map_tv', '*');
                localStorage.setItem("token_renew_pending", 0);
            }

        }).fail(function (code, response) {
            logConsole('{utilities} UNABLE TO REFRESH access_token, WILL RE-AUTOMAP [2]');
            window.parent.postMessage('retry_auto_map_tv', '*');
            localStorage.setItem("token_renew_pending", 0);
        });
    }
}

/**
 *  Initial request to AsyncManager to prepare data and sent push notification (event) back to TV
 *  this function to be called from widgets (like 'billing') on init
 * @param action
 * @param com_type
 * @param callback
 */
function fetchAMData(action, com_type, callback, params) {

    var access_token = localStorage.getItem("access_token");
    /* logConsole('//////////////////fetchAMData: ' + action); */
    /*
     old params  attributes, callback, JSONFile, errCallback

     1. determine which data is needed (or from which widget)
     not needed, action has it

     2. check if access token is being refreshed
     */
    if (parseInt(localStorage.getItem("token_renew_pending")) || access_token === null) {

        /*  3. if yes - schedule re-schedule this function (itself, with same set of attributes)  */
        //logConsole('//////////////////SCHEDULE ' + action + ' ////////////');
        scheduled_am_requests_array.push(function(){fetchAMData(action, com_type, callback)});
    } else {
        /* 4. if no - get access token from localstorage */

        /* renerate md5 which will be a "request id" and key in array of callback functions */
        logConsole("/////////////// fetchAMDATA | " + action +" | "+md5);
        var md5 =  Crypto.MD5('' + $.now());
        window.parent.callbacks_array[md5] = callback;

        /* 5. using local storage - send ajax to AM */
        var dObject = {
            action: action,
            md5: md5
        };

        _.extend(dObject, params);

        logConsole('dObject Token: ' + access_token);

        $.ajax({
            type: "POST",
            url: getAsyncManagerUri(),
            headers: {
                'Authorization': 'Bearer ' + access_token,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(dObject),
            dataType: "json",
            cache: false
        }).done(function (response) {

            //logConsole('//////////////////DONE fetchAMData ///// ');
            //logConsole(response.status);
            return true;

        }).fail(function (response, code) {

            //logConsole('//////////////////FAIL fetchAMData  ///// ');
            response = jQuery.parseJSON(response.responseText);
            //logConsole('response: ' + JSON.stringify(response));

            if( 401 == parseInt(response.error.statusCode))  {  //unauthorized

                //logConsole("-inside 401 -------------");
                /* 7. if result is "token expired" do 2. or call renewAccessToken and do 3.  */
                scheduled_am_requests_array.push(function(){fetchAMData(action, com_type, callback)});

                if (!parseInt(localStorage.getItem("token_renew_pending"))) {
                    //logConsole("-call review---------");
                    /* request to renew access token */
                    renewAccessToken();
                }
            }
            return false;
        });
    }
}

/**
 *  Secondary request to AsyncManager for prepared data
 *  this function to be called from udp_data_received event handler (i.e. after HCAP push notification, a.k.a. 'event')
 * @param action
 * @param md5
 * @return JSON data array
 */
function getAMData(action, md5, data) {

    var access_token = localStorage.getItem("access_token");
    //logIndexConsole('////////////////////getAMData: ' + action + ' - ' + md5);

    /*
     old params  attributes, callback, JSONFile, errCallback

     1. determine which data is needed (or from which widget)
     not needed, action has it

     2. check if access token is being refreshed
     */
    if (parseInt(localStorage.getItem("token_renew_pending")) || access_token === null) {
        /*  3. if yes - schedule re-schedule this function (itself, with same set of attributes)  */
        scheduled_am_requests_array.push(function(){getAMData(action, md5)});
    } else {
        /* 4. if no - get access token from localstorage */
        /* 5. using local storage - send ajax to AM */

        if(action === "sse" && callbacks_array[md5]) {
            /* temporarily logic for message feature */
            callbacks_array[md5](data);
            delete callbacks_array[md5];
            //logConsole("sse : getAMData : success");
            return true;
        }
        /*
        var weatherCallback = _.filter(callbacks_array, function(element){
            if (element["JSONFile"] !== undefined && element["JSONFile"] === "accuweather.json"){
                return true;
            }
            return false;
        });
        if (action === "gettvweather" && weatherCallback.length > 1){
            return true;
        }
        */

        var dObject = {
            action: action
        };

        $.ajax({
            type: "POST",
            url: getAsyncManagerUri(),
            headers: {
                'Authorization': 'Bearer ' + access_token,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(dObject),
            dataType: "json",
            cache: false
        }).done(function (response) {

            //logIndexConsole('//////////////SUCCESSFULLY COMPLETED ' + action + ' IN getAMData ///// ');
            //logIndexConsole(JSON.stringify(response));

            if ('success' === response.status) {
                /* 6. if result is success - return the json to the widget  */
                //logConsole(' --- Running Callback START-----');

                if (action == "gettvweather") {
                    //logConsole(' --- Fixing GetTVweather Response-----');

                    // MIA doesn't have widgets checking weather, so the event will be printed in wrapper only (callback)
                    if (!window.parent.IS_MIA_PROJECT) {
                        var w = getLocalStorageObject('weather_data');
                        // show 1st completed fetch as 'milestone' color
                        if ($.isPlainObject(w) && $.isEmptyObject(w)) {
                            logIndexConsole("{data} SUCCESSFULLY LOADED WEATHER DATA [2]", LOG_MESSAGE_TYPES.milestone_completed);
                        }
                        // don't show scheduled weather fetch's as 'milestone' color
                        else {
                            logIndexConsole("{data} SUCCESSFULLY RE-LOADED WEATHER DATA");
                        }
                    }
                    localStorage.removeItem("weather_data");

                    if (window.parent.IS_MIA_PROJECT) delete response.data['radar'];
                    else response.data.radar = response.radar.replace(/\\n/g, "");

                    localStorage.setItem("weather_data", JSON.stringify(response.data));
                    localStorage.setItem('last_weather_fetch',  moment().unix().toString());
                    console.log("{data} response of weather: " + JSON.stringify(response));

                    for (var key in callbacks_array){
                        if (callbacks_array[key]["JSONFile"] === "accuweather.json"){
                            callbacks_array[key](response.data);
                            delete callbacks_array[key];
                        }
                    }
                    return true;
                }

                if(callbacks_array[md5]) {
                    callbacks_array[md5](response.data);
                    //logConsole(' --- Running Callback DONE-----');
                    delete callbacks_array[md5];
                }
            } else {
                if (action == "getDeviceList") {
                    if(callbacks_array[md5]) {
                        callbacks_array[md5](response);
                        //logConsole(' --- Running Callback DONE-----');
                        delete callbacks_array[md5];
                    }
                }
            }

            if (action == "getPaidChannelList"){
                // localStorage.removeItem("paidChannellist");
                // localStorage.setItem("paidChannellist", JSON.stringify(response.data));
                setPaidChannelList(response.data);
            }

            return true;

        }).fail(function (response, code) {

            logIndexConsole('//////////////////FAIL getAMData  ///// ');
            response = jQuery.parseJSON(response.responseText);
            logIndexConsole('response: ' + JSON.stringify(response));

            if( 401 == parseInt(response.error.statusCode))  {  //unauthorized

                //logConsole("-inside 401 -------------");

                /* 7. if result is "token expired" do 2. or call renewAccessToken and do 3.  */
                scheduled_am_requests_array.push(function(){getAMData(action, md5)});

                if (!parseInt(localStorage.getItem("token_renew_pending"))) {
                    //logConsole("-call review---------");
                    /* request to renew access token */
                    renewAccessToken();
                }
            }
        });
    }
}

/* event handler to re-run scheduled AM requests */
$( window ).on('event_resend_am_requests', function(event) {

    /*
     done
     1. iterate over array of scheduled request functions:  scheduled_am_requests_array
     2. pop and run each function
     */
    while(scheduled_am_requests_array.length) {
        var runner = scheduled_am_requests_array.pop();
        runner();
    }

});

function isPrimaryRoom(roomId) {
    if (roomId.indexOf("_") < 0) {
        return true;
    }
    else if (roomId.indexOf("_A") > 0 || roomId.indexOf("_a") > 0) {
        return true;
    }
    return false;
}

function getIframeObject() {
    return (typeof document.getElementById('iframe_id') == 'undefined' ||  document.getElementById('iframe_id') == null ) ? null : document.getElementById('iframe_id').contentWindow;
}

function setCheckInTvSetup() {
    return hcapPromise.power.getPowerMode({
        "onSuccess": function (s) {},
        "onFailure": function (e) {
            logConsole("Error getting tv power mode errorMessage = " + e.errorMessage);
        }
    }).then(function (powerMode) {
        return powerMode;
    }).then(function (currentPowerMode) {
        return hcapPromise.volume.getVolumeLevel({
            "onSuccess": function (s) {},
            "onFailure": function (e) {
                logConsole("Error getting tv power mode errorMessage = " + e.errorMessage);
            }
        }).then(function (currentTvVolume) {
            var checkinTvVolume =  (tv_setup.checkin.volume == 'off') ? -1 : parseInt(tv_setup.checkin.volume);

            logConsole("{Checkin} Step 3/4: checkin tv vol=" + tv_setup.checkin.volume);
            if (currentTvVolume.level != checkinTvVolume) {

                hcapPromise.volume.setVolumeLevel({
                    "level": checkinTvVolume,
                    "onSuccess": function (s) {
                        localStorage.setItem('tv_sound', checkinTvVolume);
                        localStorage.setItem('checkin_tv_vol', checkinTvVolume);
                        logConsole("Volume set successfully");
                    },
                    "onFailure": function (e) {
                        logConsole("VOLUME SET onFailure : errorMessage = " + e.errorMessage);
                        return Promise.resolve();
                    }
                });
            } else {
                logConsole("MATCH !!!");
            }

            logConsole("IN THEN AFTER VOLUME");

            logConsole("{Checkin} Step 4/4: checkin tv power");

            var newPowerMode;
            if (currentPowerMode.mode == hcap.power.PowerMode.WARM && isEnabledAutoPowerOn()) {
                newPowerMode = hcap.power.PowerMode.NORMAL;
                power_normal();
            } else if (currentPowerMode.mode == hcap.power.PowerMode.NORMAL && tv_setup.checkin.power == 'off') {
                newPowerMode = hcap.power.PowerMode.WARM;
                power_warm();
            } else {
                newPowerMode = currentPowerMode.mode;
            }
            logConsole("{utilities} newPowerMode: " + newPowerMode);
            return Promise.resolve(newPowerMode);
        });
    }).catch(function (err) {
        logConsole("IN CATCH");
        /*  return Promise.resolve(); */
    });
}

function updateTvOccupancyStatus(event) {
    var params = {
        status: event,
        serial: localStorage.getItem('client_id')
    }
    window.parent.requestHandler.requestAM('updateTvOccupancyStatus', Crypto.MD5('' + $.now()), params,
        function (res) {
            logIndexConsole('TV Occupancy status updated');
        }).catch(function (err) {
            logConsole(JSON.stringify(err));
        });
}

function getRoomStatus() {
    logConsole("{utilities} Fetching room status");
    return new Promise(function (resolve, fail) {
        var params = {
            clientip: localStorage.getItem('tv_ip_address'),
            pushid: (localStorage.getItem('last_push_event_id') == null) ? 'unknown' : localStorage.getItem('last_push_event_id')
        }
        window.parent.requestHandler.requestAM('checkRoomStatus', Crypto.MD5('' + $.now()), params,
            function (res) {
                resolve(res)
            }).catch(function (err) {
                fail(JSON.stringify(err));
            });
    });
}

function getServerTime() {
    // logIndexConsole("{utilities} Fetching server time");
    return new Promise(function (resolve, fail) {
        var params = {};
        window.parent.requestHandler.requestAM('getServerTime', Crypto.MD5('' + $.now()), params,
            function (server_time) {
                // logIndexConsole("{utilities} Response of getServerTime: " + JSON.stringify(server_time));

                hcap.time.setLocalTime({
                    "year" : server_time.year,
                    "month" : server_time.month,
                    "day" : server_time.date,
                    "hour" : server_time.hour,
                    "minute" : server_time.minute,
                    "second" : server_time.second,
                    "gmtOffsetInMinute" : server_time.offset,
                    "isDaylightSaving" : false,
                    "onSuccess" : function() {
                        logIndexConsole("{utilities} Successfully set system time!", LOG_MESSAGE_TYPES.milestone_completed);

                        // logIndexConsole("Local Time: " + moment().format('MM/DD/YYYY HH:mm:ss ZZ'));
                        // logIndexConsole("UTC Time: " + moment().utc().format('MM/DD/YYYY HH:mm:ss ZZ'));
                    },
                    "onFailure" : function(f) {
                        logIndexConsole("{utilities} Unable to set system time!", LOG_MESSAGE_TYPES.error);
                    }
                });

                resolve(server_time)
            }).catch(function (err) {
            fail(JSON.stringify(err));
        });
    });
}

function setCheckinInfo(checkedIn, title, first, last){
    if (checkedIn){
        localStorage.setItem("salutation", title);
        localStorage.setItem("firstName", first);
        localStorage.setItem("lastName", last);
        localStorage.setItem("ROOM_STATE", "checkedin");
        updateLanguageCookie(true);
        updateTvOccupancyStatus('checked-in');
    }
    else {
        localStorage.removeItem("salutation");
        localStorage.removeItem("firstName");
        localStorage.removeItem("lastName");
        localStorage.setItem("ROOM_STATE", "checkedout");
        updateLanguageCookie(false);
        updateTvOccupancyStatus('checked-out');
    }
    window.parent.fDoc.updateWidgets();
}

function start_tcp(){
        logConsole("---------------------START TCP --------------------------------------------------");
        var path = window.location.pathname;
        var page = path.split("/").pop();
        //logConsole( page );
        //logConsole("-----------continue----------START TCP --------------------------------------------------");

        /* tcp_data_received event handler (receives HCAP push notification, a.k.a. 'event')*/
        window.addEventListener(
        "tcp_data_received",
        function (param) {
            // {Number} param.port - port number of UDP connection through which UDP data is received.
            // {String} param.data - received UDP data.
            logConsole("{event_received} 'tcp_data' is received on port " + param.port, LOG_MESSAGE_TYPES.event_received);
            logConsole("{event_received} data => " + param.data, LOG_MESSAGE_TYPES.event_received);

            // MAKE SURE WE DON'T PROCESS THE SAME EVENT TWICE - BECAUSE THEY DO GET SENT TWICE
            /*
            tcp_data_event_data = localStorage.getItem("tcp_data_event_data");
            if (tcp_data_event_data != null && JSON.parse(tcp_data_event_data).action !== "doPopup") {
                if (tcp_data_event_data == param.data) {
                    logConsole("Duplicate 'tcp_data_event' received! Skip!");
                    return;
                }
            }
            localStorage.setItem("tcp_data_event_data", param.data);
            */

            if (9555 != parseInt(param.port)) {
                logConsole('----ERROR: Port is Not 9555 ----');
                return;
            }

            var data = JSON.parse(param.data);
            if (data.status === 'error') {
                logConsole(data.type + " is error: " + JSON.stringify(data.error));
                if (data.action == "doCheckout" && callbacks_array[data.md5]) {
                    callbacks_array[data.md5](false, data.error.statusCode);
                    logConsole(' --- Running Callback DONE-----');
                    delete callbacks_array[data.md5];
                }
                return;
            }

            //logIndexConsole('{events_received} ' + data.action + ': ' + JSON.stringify(data));
            var last_push_event_id = localStorage.getItem('last_push_event_id');
            if (IS_MIA_PROJECT && (data.action == 'doCheckout' || data.action == 'doCheckin')) {
                var isSwap = ((data.data.swap == true && typeof data.data.swap != 'undefined')) ? true : false;

                if (typeof data.data.id !== "undefined" && last_push_event_id != null) {
                    // logConsole("{utilities} Comparing data.data.id [" + data.data.id + "] vs. last_push_event_id [" + last_push_event_id + "]");
                    if (data.data.id == last_push_event_id) {
                        logConsole("{utilities} Duplicate 'tcp_event' detected, terminate process...");
                        return false;
                    }
                }
            }

            localStorage.removeItem("running_clear_credentials");

            switch (data.action) {
                case 'doCheckout':
                    logConsole("-- removeItem doCheckinEvent");
                    localStorage.removeItem("doCheckinEvent");
                    localStorage.setItem("ROOM_STATE", "checkedout");
                    expireCookie("welcomeMsgDisplayed");
                    expireCookie("active_channels_language");
                    localStorage.removeItem("TurnTvOnAfterReboot");
                    localStorage.removeItem("app_certs");
                    expireCookie("pmsSite");
                    expireCookie("appToken");

                    // ***************** MIA CHECKOUT ****************************************************************/
                    if (IS_MIA_PROJECT) {
                        new Promise(function (resolve, reject) {
                            var access_token = localStorage.getItem("access_token");
                            var md5 = Crypto.MD5('' + $.now());
                            var messageToken = data.data.id;
                            logConsole("{event_received} NEW MIA CHECKOUT EVENT RECEIVED! " + messageToken, LOG_MESSAGE_TYPES.event_received);

                            $.ajax({
                                type: "POST",
                                url: getAsyncManagerUri(),
                                headers: {
                                    'Authorization': 'Bearer ' + access_token,
                                    'action': 'getPushMessage',
                                    'md5': md5,
                                    'id': messageToken
                                },
                                data: {},
                                dataType: "json",
                                cache: false
                            }).done(function (response, status, xhr) {
                                localStorage.setItem('last_push_event_id', messageToken);
                                resolve(response);
                            }).fail(function(err){
                                logConsole("AJAX CALL ERR "+JSON.stringify(error));
                            });
                        }).then(function (data) {
                            var payload = JSON.parse(data.data.payload);
                            var setVolTo = payload.presets["0"].actions[1].volume;
                            var powerMode = payload.presets["0"].actions[0].power;
                            var fDoc = getIframeObject();

                                var d = {
                                    status: data.status,
                                    content: payload.content
                                };
                                removeLocalStorage('guestInfo');
                                localStorage.removeItem("dispatchMiaEvent");
                                localStorage.removeItem("CIA");
                                var changePowerMode = (param.data.swap != true || typeof param.data.swap == 'undefined') ? true : false;
                                // Check of TV is on or off
                                hcap.power.getPowerMode({
                                    "onSuccess": function (s) {

                                        if (s.mode == hcap.power.PowerMode.NORMAL) {
                                            var success = function () {
                                                logConsole("{utilities} Updating TV settings, post check-out event");
                                                power_change('off');
                                                // set volume
                                                setVolumePro(setVolTo);
                                                localStorage.setItem('tv_sound', setVolTo);
                                                setVolumePro(-1);
                                                fDoc.dispatchNewEvent('checkout_event', 'checkout', d);
                                            };

                                            fDoc.clearCredentials(fDoc.CONSTANTS.PowerMode.ON, success);
                                        }

                                    else { // WARM mode, tv off
                                        logConsole("{event_received} Currently TV is OFF...");
                                        logConsole("{event_received} Saving MIA event to execute after reboot");
                                        // store checkout flag post reboot
                                        var checkout_event = {
                                            name: "checkout_event",
                                            type: "checkout",
                                            data: payload,
                                            is_primary_room: isPrimaryRoom(localStorage.getItem("room_number"))
                                        };
                                        localStorage.setItem("dispatchMiaEvent", JSON.stringify(checkout_event));

                                        fDoc.clearCredentials(fDoc.CONSTANTS.PowerMode.OFF, null);
                                    }
                                }
                            });
                            return payload;

                        }).then(function (payload) {
                            logStorage.sendEvent(logStorage.code.STATUS.CHECK_OUT);
                            updateTvOccupancyStatus('checked-out');
                            return;
                        }).catch(function (err) {
                            logConsole('PCN ERROR  ' + JSON.stringify(err));
                        });
                    }
                    else {
                        logConsole("{Checkout} Step 1/2: checkout event received");
                        initQms();

                        $(".billing_button.checkout").html("Checkout");
                        $(".billing_button.checkout").css("width", "150px");
                        updateLanguageCookie(false, 'expire');

                        //logConsole("BEFORE setPaidChannelList");
                        try {
                            if (!_.isUndefined(_.get(getLocalStorageObject("channellist"), "groupId"))
                                && !_.isUndefined(_.get(getLocalStorageObject("channellist"), "orgChannels"))) {
                                setPaidChannelList(); //reset
                            }
                        } catch (e) {
                            logConsole("ERROR in doCheckout: " + e.message);
                        }


                        iotController.requestEvent("CHECK_OUT");
                        updateTvOccupancyStatus('checked-out');

                        switch (data.type) {
                            case 'live':
                                //logConsole(" *********** before getPowerMode in doCheckout **************");
                                logConsole("{Checkout} Step 2/2: Set powermode to Warm");
                                // Check of TV is on or off
                                hcap.power.getPowerMode({
                                    "onSuccess": function (s) {
                                        var mode, doReboot;
                                        if (s.mode == hcap.power.PowerMode.NORMAL) {
                                            //logConsole("In normal mode, about to clear....");
                                            // NORMAL MODE, tv on - clear credentials
                                            // [IDEDWBS-64033] reboot to clear app tokens
                                            mode = 'normal';
                                            doReboot = (getCookie("webos") >= 5) ? true : false;
                                        } else {
                                            //logConsole("In warm mode, about to clear....");
                                            // WARM mode, tv off - clear credentials with reboot
                                            mode = 'warm';
                                            doReboot = true;
                                        }
                                        clearUserCredentials(true, doReboot, mode, 'checkout_live');
                                    }
                                });

                                logStorage.sendEvent(logStorage.code.STATUS.CHECK_OUT);
                                break;
                            case 'swap':
                                // Check of TV is on or off
                                hcap.power.getPowerMode({
                                    "onSuccess": function (s) {
                                        if (s.mode == hcap.power.PowerMode.NORMAL) {
                                            // NORMAL MODE, tv on
                                            setClearAndReboot();

                                        } else {
                                            // WARM mode, tv off - clear and reboot
                                            clearUserCredentials(true, true, 'warm', 'checkout_swap');
                                        }
                                    }
                                });
                                logStorage.sendEvent(logStorage.code.STATUS.CHECK_OUT);
                                break;
                        }
                    }
                    break;
                case 'doCheckin':
                    // ***************** MIA CHECKIN ****************************************************************/
                    if (IS_MIA_PROJECT) {
                        localStorage.removeItem("app_certs");
                        expireCookie("pmsSite");
                        expireCookie("appToken");
                        new Promise(function (resolve, reject) {
                            var access_token = localStorage.getItem("access_token");
                            var md5 = Crypto.MD5('' + $.now());
                            var messageToken = data.data.id;
                            localStorage.setItem("doCheckinEvent", true);
                            logConsole("{event_received} NEW MIA CHECK-IN EVENT RECEIVED! "+ messageToken, LOG_MESSAGE_TYPES.event_received);

                            $.ajax({
                                type: "POST",
                                url: getAsyncManagerUri(),
                                headers: {
                                    'Authorization': 'Bearer ' + access_token,
                                    'action': 'getPushMessage',
                                    'md5': md5,
                                    'id': messageToken
                                },
                                data: {},
                                dataType: "json",
                                cache: false
                            }).done(function (response, status, xhr) {
                                localStorage.setItem('last_push_event_id', messageToken);
                                resolve(response);
                            }).fail(function(err){
                                logConsole("AJAX CALL ERROR "+ JSON.stringify(error));
                            });
                        }).then(function (data) {
                            var payload = JSON.parse(data.data.payload);
                            var powerMode = payload.presets["0"].actions[0].power;
                            var setVolTo = payload.presets["0"].actions[1].volume;
                            var fDoc = getIframeObject();
                            //payload structure'{"presets":[{"target":"8","actions":[{"power":"off"},{"volume":12}]}],"content":"UmljYXJkbyBHYXJjaWE=","roomId":"8","type":"checkin","swap":false}';
                            //prepare data to be send to PST
                            var d = {
                                status: data.status,
                                content: payload.content
                            };
                            // store checkin data post reboot
                            var checkin_event = {
                                name: "checkin_event",
                                type: "checkin",
                                is_primary_room: isPrimaryRoom(localStorage.getItem("room_number")),
                                data: payload,
                                isSwap: isSwap
                            };

                            // Actual name doesn't come through anymore, and we rely on 'lastName' to have a value in localStorage to know
                            // if someone is checked in or not
                            localStorage.setItem("lastName", "checkedin");
                            var ciaLastName = JSON.parse(atob(payload.content)).name;
                            localStorage.setItem("CIA", JSON.stringify({ lastName: ciaLastName}));

                            if (window.parent.isEnabledAutoPowerOn() && powerMode == 'on' && isPrimaryRoom(localStorage.getItem("room_number"))) {
                                powerMode = 'on';
                            } else {
                                powerMode = 'off';
                            }

                            // Check of TV is on or off
                            hcap.power.getPowerMode({
                                "onSuccess": function (s) {

                                    if (s.mode == hcap.power.PowerMode.NORMAL) {
                                        var success = function () {
                                            logConsole("{utilities} Updating TV settings, post check-in event "+isSwap);
                                            if (isSwap) {
                                                power_change('off');
                                            }
                                            else{
                                                power_change(powerMode);
                                            }

                                            // set volume
                                            setVolumePro(setVolTo);
                                            localStorage.setItem('tv_sound', setVolTo);
                                            setVolumePro(-1);

                                            fDoc.dispatchNewEvent('checkin_event', 'checkin', d);
                                        };

                                        fDoc.clearCredentials(fDoc.CONSTANTS.PowerMode.ON, success);
                                    }
                                    else { // WARM mode, tv off
                                        logConsole("{event_received} Currently TV is OFF...");
                                        logConsole("{event_received} Saving MIA event to execute after reboot");

                                        localStorage.setItem("dispatchMiaEvent", JSON.stringify(checkin_event));

                                        fDoc.clearCredentials(fDoc.CONSTANTS.PowerMode.OFF, null);
                                    }
                                }
                            });

                            return payload;
                        }).then(function (payload) {
                            logStorage.sendEvent(logStorage.code.STATUS.CHECK_IN);
                            updateTvOccupancyStatus('checked-in');
                            logIndexConsole("Init smartAppAuthHandler on CHECKIN!");
                            window.smartAppAuthHandler.init();
                            return;
                        });
                    }
                    else {
                        guestChange(data.type)
                            .then(function() {
                                doCheckin(data.data, data.type);
                            });
                    }
                    break;
                case 'fetchTvPms':
                    logConsole('---- Case fetchTvPms, now lets call getTvPms ----');
                    if(data.status === 'error') {
                        $(".billing").removeClass("nav_ready");

                        if (callbacks_array[data.md5]) {
                            callbacks_array[data.md5](data);
                            logConsole(' --- Running Callback DONE-----');
                            delete callbacks_array[data.md5];
                        }
                    } else {
                        getAMData('getTvPms', data.md5);
                    }
                    break;
                case 'fetchGuestName':
                    logConsole('---- Case fetchGuestName, now lets call getGuestName ----');
                    getAMData('getGuestName', data.md5);
                    break;
                case 'pmsStatus':
                    logConsole('---- PMS-STATUS: ' + data.data.status + ' ----');

                    switch (data.data.status) {
                        case 'down':
                            localStorage.setItem("pmsStatus", "down");
                            setClearAndReboot();
                            removeLocalStorage('guestInfo');
                            break;

                        case 'up':
                            localStorage.setItem("pmsStatus", "up");
                            localStorage.setItem("fetchAfterPMSup", "true");

                            if (!IS_MIA_PROJECT) {
                                fetchAMData('fetchGuestName', 'ip', function (data) {
                                    if (typeof (data) !== 'undefined' && typeof (data.checkedIn) !== 'undefined' && data.checkedIn == true && typeof (data.lastName) !== 'undefined' && data.lastName != 'null' && data.lastName != null) {

                                        if ('null' == data.salutation || null == data.salutation) {
                                            data.salutation = '';
                                        }
                                        localStorage.setItem("salutation", data.salutation);
                                        localStorage.setItem("firstName", data.firstName);
                                        localStorage.setItem("lastName", data.lastName);
                                        updateTvOccupancyStatus('checked-in');
                                        updateLanguageCookie(true);
                                        unsetClearAndReboot(function () {
                                            fDoc.location.reload(true);
                                        });

                                    } else {
                                        logConsole('/////// GUEST NAME NOT DEFINED');
                                        removeLocalStorage('guestInfo');
                                        updateLanguageCookie(false);
                                        updateTvOccupancyStatus('checked-out');
                                    }
                                });
                            }
                            break;
                    }
                    break;
                case 'doPopup':
                    logConsole('---- Popup Message from server: ' + data.data.message + ' ----');
                    requestHandler.getEvents(['notice', 'notifier']);

                    // ToDo implement logic here (pass message to the widger)

                    break;
                case 'doMessage':
                    if (IS_MIA_PROJECT) {
                        logConsole("MIA doMessage");
                        new Promise(function (resolve, reject) {
                            var access_token = localStorage.getItem("access_token");
                            var md5 = Crypto.MD5(''+$.now());
                            var messageToken = data.data.id;
                            logConsole("{event_received} NEW MIA DoMessage EVENT RECEIVED! " + messageToken);
                            $.ajax({
                                type: "POST",
                                url: getAsyncManagerUri(),
                                headers: {
                                    'Authorization': 'Bearer ' + access_token,
                                    'action': 'getPushMessage',
                                    'md5': md5,
                                    'id': messageToken
                                },
                                data: {},
                                dataType: "json",
                                cache: false
                            }).done(function (response, status, xhr) {
                                localStorage.setItem('last_push_event_id', messageToken);
                                resolve(response);
                            }).fail(function (err) {
                                logConsole("AJAX CALL ERROR " + JSON.stringify(error));
                            });
                        }).then(function(data) {
                            logConsole("EventMessage received, data: " + JSON.stringify(data));
                            var payload = JSON.parse(data.data.payload);
                            var message = JSON.parse(atob(payload.content)).message;
                            var fDoc = getIframeObject();
                            var d = {
                                action: "eventMsg",
                                payload: payload
                            };
                            fDoc.dispatchNewEvent('tcp_data_received_MIA', 'eventMsg', d);
                        });
                    }
                    break;
                case 'castStart':
                    tv = data.data.tv;
                    logConsole("In castStart....");
                    logConsole("screencast_array: " + JSON.stringify(screencast_array));

                    switch (screencast_array.data.provider) {
                        case "Marriott":
                        case "GuestTek":
                            switchMode(screencast_array.data.html_input);

                            setTimeout(function () {
                                SetPortalStatus(HIDE_PORTAL);
                            }, 2000);
                            break;
                        default:
                            break;
                    }
                    break;
                case 'castStop':
                    logConsole("Switching to TV");
                    switchMode('tv');

                    SetPortalStatus(SHOW_PORTAL);
                    tv = data.data.tv;
                    break;
                case 'tvControl':
                    var command = null;
                    var cmdValue = '';
                    var volume = undefined;
                    if(_.isObject(data.data.command)){
                        var validCommand = ['channel', 'input', 'power', 'volume'];
                        command = _.pick(data.data.command, validCommand);

                        if(!_.isUndefined(_.get(command, 'channel'))){
                            cmdValue = 'channel';
                        } else if(!_.isUndefined(_.get(command, 'input'))){
                            cmdValue = 'input';
                        } else if(!_.isUndefined(_.get(command, 'power'))){
                            cmdValue = _.get(command, 'power');
                        }
                        command.action = cmdValue;
                        logConsole('--------------group control----------- : ' + command.action);
                    } else {
                        try {
                            command = JSON.parse(data.data.command);
                        } catch (e) {
                            cmdValue = _.get(data.data, "command");
                            if(!_.isUndefined(cmdValue) && (cmdValue.search('hdmi') !== -1 || cmdValue.search('tv') !== -1)) {
                                command = {
                                    "action": "input",
                                    "input" : data.data.command
                                };
                            } else {
                                command = {"action" : data.data.command};
                            }

                        }
                    }
                    logConsole("{utilities} tvControl command: " + _.get(command, "action"));
                        try {
                            hcap.property.getProperty({
                                "key": "instant_power",
                                "onSuccess": function (s) {
                                    if (command.action === 'on') {
                                        logStorage.sendEvent(logStorage.code.STATUS.POWER_ON);

                                        logConsole("{utilities} Turning ON TV...");
                                        power_normal();
                                    }
                                    else if (command.action === 'off') {
                                        logStorage.sendEvent(logStorage.code.STATUS.POWER_OFF);

                                        if (s.value === 2) { //mute
                                            logConsole("{utilities} Turning OFF TV...");
                                            power_warm();
                                        }
                                        else { //reboot or normal
                                            hcap.power.powerOff({
                                                "onSuccess": function () {
                                                    logConsole("{utilities} Turning OFF TV...");
                                                },
                                                "onFailure": function (f) {
                                                    logConsole("{utilities} Unable to turn OFF TV, " + f.errorMessage);
                                                }
                                            });
                                        }
                                    }
                                    else if (command.action === 'reboot') {
                                        logStorage.sendEvent(logStorage.code.STATUS.POWER_REBOOT);

                                        logConsole("{utilities} Sending reboot command...");
                                        reboot();
                                    }
                                    else if (command.action === 'softap'){
                                        try {
                                            logConsole('-----------------------------------softap-----------------------------------');
                                            //localStorage.setItem("softap", JSON.stringify(command));
                                            command.mode = command.mode === true ? "ON" : "OFF";
                                            window.parent.softapHandler.setSoftAPInfo(command);
                                            if (command.mode === "ON"){
                                                window.parent.softapHandler.setSoftAP(command.ssid, command.pwd, command.softapDetail);
                                            }
                                            else{
                                                window.parent.softapHandler.unsetSoftAP();
                                            }
                                        }
                                        catch (e){
                                            logConsole('SOFTAP : SOFTAP error');
                                        }
                                    }
                                    else if(command.action === 'input'){
                                        volume = _.get(command, 'volume');
                                        var inputChangeFunc = function(){
                                            getIframeObject().switchMode(_.get(command, 'input'), false);
                                            if (!_.isUndefined(volume)) {
                                                setVolumePro(parseInt(volume));
                                            }
                                        };

                                        if(isVODPlaying()) {
                                            getIframeObject().exitVOD(inputChangeFunc);
                                        } else {
                                            inputChangeFunc();
                                        }
                                    }
                                    else if(command.action === 'channel') {
                                        var channel = _.get(command, 'channel');
                                        volume = _.get(command, 'volume');
                                        var changeChannelFunc = null;
                                        var physical_channel = getPhysicalChannelInfo(channel);

                                        if(!_.isUndefined(physical_channel) && (physical_channel.type != "SMART_APP" && physical_channel.type != "URL")){
                                            changeChannelFunc = function() {
                                                var log = 'GO TO CHANNEL - from OpenAPI : ' + channel;
                                                changeChannel(physical_channel, null, 0, log, function () {
                                                    setTimeout(function () {
                                                        var current_channel = physical_channel.logicalChannelNumber;
                                                        setCookie("current_channel", current_channel, COOKIE_EXPIRE_DAYS);
                                                        var url = "channelbanner.html?mode=tv&chNum=" + current_channel;
                                                        document.getElementById('iframe_id').setAttribute('src', url);

                                                        if (!_.isUndefined(volume)) {
                                                            setVolumePro(parseInt(volume));
                                                        }
                                                    }, 1500);
                                                });
                                            }
                                        };

                                        hcap.power.getPowerMode({
                                            "onSuccess" : function(s) {
                                                if(s.mode == hcap.power.PowerMode.NORMAL){
                                                    if(_.isFunction(changeChannelFunc)) {
                                                        if(isVODPlaying()) {
                                                            getIframeObject().exitVOD(changeChannelFunc);
                                                        } else {
                                                            changeChannelFunc();
                                                        }
                                                    }
                                                } else {
                                                    // turn on the tv
                                                    power_normal(changeChannelFunc);
                                                }
                                            },
                                            "onFailure" : function(f) {
                                                logConsole("onFailure : errorMessage = " + f.errorMessage);
                                            }
                                        });
                                    } else {
                                        logConsole('MONITOR : unexpected command from server');
                                    }
                                },
                                "onFailure": function (f) {
                                    logConsole("MONITOR : instant_power : onFailure : errorMessage = " + f.errorMessage);
                                }
                            });
                        } catch (e) {
                            logConsole("ERROR in tvControl: " + JSON.stringify(e));
                        }

                    break;
                case 'doWakeup':
                    logConsole("****************** WAKE UP CALL ***************");
                    try {
                        localStorage.setItem("WAKEUPBYADMIN", "ON");
                        if(typeof data.showPopupOnTv !== "undefined" && data.showPopupOnTv == true) {
                            localStorage.setItem("showPopupOnTv", data.requestId);
                        } else {
                            localStorage.removeItem('showPopupOnTv');
                        }

                        hcap.power.getPowerMode({
                            "onSuccess" : function(s) {
                                if(s.mode == hcap.power.PowerMode.NORMAL) {
                                    var wakeup_id = localStorage.getItem('showPopupOnTv');
                                    if(!_.isUndefined(wakeup_id)) {
                                        var requestData = {};
                                        requestData["id"] = wakeup_id;
                                        requestData["requestCode"] = "TV";
                                        requestData["status"] = "F";
                                        window.requestHandler.requestQMS("updateTvQmsRequest", requestData);

                                        localStorage.removeItem('showPopupOnTv');
                                    }
                                } else {
                                    hcap.power.setPowerMode({
                                        "mode": hcap.power.PowerMode.NORMAL,
                                        "onSuccess": function () {
                                            logStorage.sendEvent(logStorage.code.STATUS.POWER_ON);
                                            logConsole("WakeUpCall : setPowerMode ON - onSuccess");
                                        },
                                        "onFailure": function (f) {
                                            logConsole("WakeUpCall : setPowerMode ON - onFailure : errorMessage = " + f.errorMessage);
                                        }
                                    });
                                }
                            },
                            "onFailure": function (f) {
                                logConsole("WakeUpCall : getPowerMode : onFailure : errorMessage = " + f.errorMessage);
                            }
                        });
                    } catch (e) {
                        logConsole("{utilities} ERROR in doWakeup: " + JSON.stringify(e));
                    }
                    break;
                case 'tvStatus':
                    logConsole('---- TVSTATUS: ----');

                    var amObject = {
                        action: "update_tv_status",
                        serial: data.data.serial,
                        netStat: "connect",
                        softApPassword: data.data.softApPassword,
                        softApMode: data.data.softApMode
                    };

                    // Check of TV is on or off
                    hcap.power.getPowerMode({
                        "onSuccess": function (s) {

                            if (s.mode == hcap.power.PowerMode.NORMAL) {
                                //logConsole("In normal mode, updateTVStatus");
                                amObject.powerStat = "on";
                            } else {
                                //logConsole("In warm mode, updateTVStatus");
                                amObject.powerStat = "off";
                            }

                            //logConsole('obj: ' + JSON.stringify(amObject));

                            var access_token = localStorage.getItem("access_token");

                            $.ajax({
                                type: "POST",
                                url: getAsyncManagerUri(),
                                headers: {
                                    'Authorization': 'Bearer ' + access_token,
                                    'Content-Type': 'application/json'
                                },
                                data: JSON.stringify(amObject),
                                dataType: "json",
                                cache: false
                            }).done(function (response) {
                                logConsole("updateTVStatus done!!! response - " + JSON.stringify(response));
                            });
                        }
                    });

                    break;
                case 'eventMsg':
                    /*{
                     "status": "success",
                     "data": {
                     "id": "GuH8iLTFCrJl4Eva",
                     "type": "message",
                     "payload": "{\"status\": \"success\", \"data\": \"text\"}",
                     "param": "notice,ticker,adbanner",
                     "insertAt": "2017-09-27 02:25:19",
                     "roomId": "201"
                     }
                     }*/
                    logConsole("--- data.action : eventMsg --- " + " | " + data.data.id);

                    // IF MIA PROJECT, PASS DOWN TO HANDLER
                    if (IS_MIA_PROJECT) {
                        logConsole("--- Passing down to lg_handler.js ...");
                        fDoc.dispatchNewEvent('tcp_data_received_MIA', 'eventMsg', data);
                    }
                    else {
                        logConsole("eventMsg received, data: " + JSON.stringify(data));
                        localStorage.setItem("lastEventMsgId", data.data.id);
                        var events = JSON.parse(data.data.param || '[]');
                        requestHandler.getEvents(events);
                    }
                    break;
                case 'esStatus':
                    logConsole("set ES STATUS to localStorage");
                    localStorage.setItem("esStatus", "1");
                    logStorage.sendLogsToServer();
                    break;
                case 'updateTvChannel':
                    logConsole("********* pay channel **********");
                        var md5 = Crypto.MD5('' + $.now());
                        getAMData('getPaidChannelList', md5);

                    break;
                case 'getDeviceInfo':
                    logConsole("getDeviceInfo " + data.roomId);
                    logConsole("getDeviceInfo received, data: " + JSON.stringify(data));
                    var event = new CustomEvent('getDeviceInfo', {
                        detail: {
                            type: 'changeValue',
                            data: data
                        }
                    });
                    document.dispatchEvent(event);
                    /*fDoc.dispatchNewEvent('getDeviceInfo', 'changeValue', data);*/
                    break;
                case 'doUpdateService':
                    updateQmsService();
                    break;
                case 'doUpdateRequest':
                    updateQmsRequest();
                    break;

                /* ------ VOLARA Events ------ */

                case 'doPower':
                    logConsole('---- VOLARA doPower: ' + data.data + '----');
                    command = data.data;

                    try {
                        power_change(command);

                    } catch (e) {
                        logConsole(JSON.stringify(e));
                    }
                    break;

                case 'doVolume':
                    logConsole('---- VOLARA doVolume: ' + data.data + '----');
                    var volume_val = data.data;

                    /* volume increment */
                    const step = 1;

                    hcap.volume.getVolumeLevel({
                        "onSuccess" : function(s) {
                            switch(volume_val) {
                                case "up":
                                    setVolumePro(s.level + step);
                                    break;
                                case "down":
                                    setVolumePro(s.level - step);
                                    break;
                            }
                        },
                        "onFailure" : function(f) {
                            logConsole("onFailure : errorMessage = " + f.errorMessage);
                        }
                    });

                    break;

                case 'doMute':
                    logConsole('---- VOLARA doMute ----');
                    setVolumePro(-1);
                    break;

                case 'doChangeChannel':
                    logConsole('---- VOLARA doChangeChannel: ' + data.data + '----');
                    var channel_id = data.data;

                    ch = getPhysicalChannelInfo(channel_id);
                    if(!_.isUndefined(ch) && !_.isEmpty(ch)) {
                        logConsole("Found channel....");
                        logConsole(JSON.stringify(ch));

                        // change to last channel
                        changeChannel(ch, null, 0, 'VOLARA doChangeChannel', null);

                        logConsole("Changed channel......");
                    } else {
                        logConsole("Channel not found");
                    }
                    break;

                case 'doLaunch':
                    logConsole('---- VOLARA doLaunch: ' + data.data + '----');
                    var app_id = data.data;
                    launchSmartApp(app_id);
                    break;

                case 'getThingInfo':
                    logConsole('---- HSP 3.5 IoT getThingInfo: ' + data + '----');
                    iotController.updateThingStatus(data);
                    break;
                case 'updateMessage':
                    if( !_.isUndefined(_.get(data, "data.message")) ){
                        var message_data = data.data.message;
                        if(message_data.split("_")[0] === "ONE"){
                            var oneWayPMSMessage = message_data.split("_")[3];

                            var messageId = "";
                            var messageElement = {
                                "id": messageId,
                                "dt": Number(oneWayPMSMessage)
                            };

                            var notice_read_string = localStorage.getItem("notice_read_list");
                            var noticeReadList = [];
                            if(notice_read_string !== null){
                                try {
                                    noticeReadList = JSON.parse(notice_read_string);
                                } catch (e) {}
                            }

                            if (_.findIndex(noticeReadList, messageElement) < 0){
                                noticeReadList.push(messageElement);
                                var notice_read_string = JSON.stringify(noticeReadList);
                                localStorage.setItem("notice_read_list", notice_read_string);
                            }
                        }
                        logConsole('---- Read Message id: ' + message_data + ' ----');
                        requestHandler.getEvents(['notice', 'notifier']);
                    }
                    break;
                case 'fetchDebug':
                    if(_.isEmpty(getCookie("RDT_DEBUGGING"))) {
                        logConsole("--- Start Remote Debugging : set the cookie, RDT_DEBUGGING, true ---");
                        setCookie("RDT_DEBUGGING", true, 1/24);
                    } 
                    logConsole('--- fetchDebug : getPMS, getMessage, getStorage');
                    getStorage()
                        .then(function(values) {
                            var debugData = {
                                "jsondata": {
                                    "localStorage": values[0],
                                    "cookie": values[1]
                                }
                            };
                            /* prettify and send */
                            window.parent.requestHandler.requestAM('debug', Crypto.MD5('' + $.now()), debugData,
                            function (res) {
                                logConsole('debug info sent');
                            }).catch(function (err) {
                                logConsole(JSON.stringify(err));
                            });
                        });
                    break;
                case 'stopDebug':
                    logConsole("--- Stop Remote Debugging : expire the cookie, RDT_DEBUGGING ---");
                    expireCookie("RDT_DEBUGGING");
                    expireCookie("message");
                    expireCookie("billing");
                    break;
                case 'doSync':
                    logConsole('--- doSync');
                    doSync();
                    break;
                case 'runCommand':
                    try{
                        var command = JSON.parse(data.data).command;
                        logConsole("{runCommand}: " + command);
                        eval(command);
                    }
                    catch(e){
                        logConsole("{runCommand}: failed: " + e);
                    }
                    break;
                case 'notifyGreetings':
                    logConsole('--- notifyGreetings');
                    window.parent["WelcomeController"].getGreetings();
                    break;
                case 'notifyServiceBookingStatus':
                    console.log('--- notifyServiceBookingStatus');
                    window.parent["TravelController"].init();
                    break;
                case 'voiceAction':
                    if(data.status === "success") {
                        var command = { "action" : "", "status" : "", "data" : ""};
                        command = data.data;
                        logConsole(
                            "Event 'a4h_to_stt_status_changed' is received.\n" +
                            " action data = " + command.action +
                            ", service type = " + command.type
                        );

                        if(command.type == "page") {
                            window.parent.voiceHandler.doChangePage(command);
                        } else if(command.type == "tv") {
                            var ctrlType = window.parent.voiceHandler.determineTVControlType(command);
                            logConsole("@@@Control Type : " + ctrlType);
                            if(ctrlType == 'smartApp') {
                                window.parent.voiceHandler.doLaunchSmartApp(command);
                            } else if(ctrlType == 'tvControl') {
                                window.parent.voiceHandler.doControlTV(command);
                            } else if(ctrlType == 'channelControl') {
                                if(window.parent.powerStatus == hcap.power.PowerMode.WARM) {
                                    hcap.power.setPowerMode({
                                        "mode" : hcap.power.PowerMode.NORMAL,
                                        "onSuccess" : function() {
                                            logConsole("@@@Turned on TV From A4H");
                                            window.parent.voiceHandler.doControlChannel(command);
                                        },
                                        "onFailure" : function(f) {
                                            logConsole("onFailure : errorMessage = " + f.errorMessage);
                                        }
                                    });
                                } else {
                                    window.parent.voiceHandler.doControlChannel(command);
                                }
                            } else if(ctrlType == 'amazonPAC') {
                                var fDoc = window.parent.document.getElementById('iframe_id');
                                if(command.status == 'ACTIVE') {
                                    displayToast("Amazon account is connected!");
                                    localStorage.setItem("pac_status", "ACTIVE");
                                } else if(command.status == 'INACTIVE') {
                                    displayToast("Amazon account is diconnected!");
                                    localStorage.setItem("pac_status", "INACTIVE");
                                }

                                if(typeof fDoc.contentWindow.PACIndicatorHandler == 'object' &&
                                    typeof fDoc.contentWindow.PACIndicatorHandler.statusIndicator === 'function') {
                                    var PACStatus = localStorage.getItem("pac_status");
                                    fDoc.contentWindow.PACIndicatorHandler.statusIndicator(PACStatus);
                                }
                            }
                        } else if(command.type == "control") {
                            var intentId = command.action;
                            var param = typeof command.param == 'undefined' ? "" : command.param;

                            switch(command.action) {
                                case 'id_set_mode' :
                                    param = command.room_mode == "wake up" ? "wakeup" : command.room_mode;
                                    break;
                                case 'id_light_on' :
                                case 'id_light_off' :
                                case 'id_increase_light_brightness' :
                                case 'id_decrease_light_brightness' :
                                case 'id_light_brightness_max' :
                                    var type = command.light_type;
                                    param = typeof type == 'undefined'? "" : type;
                                    break;
                            }

                            if(_.isObject(iotController) && iotController.initialized){
                                iotController.requestVoiceIntentWithParam(intentId, param);
                            }
                        } else if(command.type == "service") {
                            var serviceType = window.parent.voiceHandler.determineServiceType(command);

                            if(serviceType == 'checkout') {
                                window.parent.voiceHandler.doExecuteService(serviceType);
                            } else if(serviceType == 'roomManage') {
                                var fDoc = window.parent.document.getElementById('iframe_id');
                                if(command.action == 'id_dnd_request') {
                                    localStorage.setItem('housekeeping',"DND");
                                    if(typeof fDoc.contentWindow.MURIndicatorHandler == 'object' &&
                                        typeof fDoc.contentWindow.MURIndicatorHandler.statusIndicator === 'function') {
                                        fDoc.contentWindow.MURIndicatorHandler.statusIndicator('DND');
                                    }

                                    if(typeof fDoc.contentWindow.DNDIndicatorHandler == 'object' &&
                                        typeof fDoc.contentWindow.DNDIndicatorHandler.statusIndicator === 'function') {
                                        fDoc.contentWindow.DNDIndicatorHandler.statusIndicator('DND');
                                    }
                                } else if(command.action == 'id_mur_request') {
                                    localStorage.setItem('housekeeping',"MUR");

                                    if(typeof fDoc.contentWindow.MURIndicatorHandler == 'object' &&
                                        typeof fDoc.contentWindow.MURIndicatorHandler.statusIndicator === 'function') {
                                        fDoc.contentWindow.MURIndicatorHandler.statusIndicator('MUR');
                                    }

                                    if(typeof fDoc.contentWindow.DNDIndicatorHandler == 'object' &&
                                        typeof fDoc.contentWindow.DNDIndicatorHandler.statusIndicator === 'function') {
                                        fDoc.contentWindow.DNDIndicatorHandler.statusIndicator('MUR');
                                    }

                                } else if(command.action == 'id_dnd_cancel' || command.action == 'id_mur_cancel') {
                                    localStorage.setItem('housekeeping',"none");
                                    if(typeof fDoc.contentWindow.MURIndicatorHandler == 'object' &&
                                        typeof fDoc.contentWindow.MURIndicatorHandler.statusIndicator === 'function') {
                                        fDoc.contentWindow.MURIndicatorHandler.statusIndicator('none');
                                    }

                                    if(typeof fDoc.contentWindow.DNDIndicatorHandler == 'object' &&
                                        typeof fDoc.contentWindow.DNDIndicatorHandler.statusIndicator === 'function') {
                                        fDoc.contentWindow.DNDIndicatorHandler.statusIndicator('none');
                                    }

                                }
                            } else {
                                logConsole("@@@ VOICE SERVICE : " + command.action);
                            }
                        }
                    }
                    /*
                    if(data.status === "success") {
                        logConsole("@@@@TRACERT POWER Status : " + window.parent.powerStatus);
                        setTimeout(function() {
                            var data = {"action":"voiceAction", "status":"success", "data": {"action": "id_restaurant_info", "type":"page" ,"facility_type":"restaurant"}};
                            var command = { "action" : "", "status" : "", "data" : ""};
                            msg = JSON.parse(localStorage.getItem('voiceMsg'));
                            var message = msg['messages'];
                            command = message[0]['message'];
                            var param = JSON.parse(command.substr(0, command.length-1));
                            var voiceData = param.data;

                            logConsole(
                               "Event 'speech_to_text_status_changed' is received.\n" +
                               " action data = " + voiceData.action +
                               ", service type = " + voiceData.type
                            );

                            logConsole("@@@@TRACERT GOGO VOICE!!!");
                            if(voiceData.type == "page") {
                                window.parent.voiceHandler.doChangePage(voiceData);
                            } else if(voiceData.type == "tv") {
                                var ctrlType = window.parent.voiceHandler.determineTVControlType(voiceData);
                                logConsole("@@@Control Type : " + ctrlType);
                                if(ctrlType == 'smartApp') {
                                   window.parent.voiceHandler.doLaunchSmartApp(voiceData);
                                } else if(ctrlType == 'tvControl') {
                                   window.parent.voiceHandler.doControlTV(voiceData);
                                } else if(ctrlType == 'channelControl') {
                                    if(window.parent.powerStatus == hcap.power.PowerMode.WARM) {
                                        hcap.power.setPowerMode({
                                          "mode" : hcap.power.PowerMode.NORMAL,
                                          "onSuccess" : function() {
                                             logConsole("@@@Turned on TV From A4H");
                                             window.parent.voiceHandler.doControlChannel(voiceData);
                                          },
                                          "onFailure" : function(f) {
                                             logConsole("onFailure : errorMessage = " + f.errorMessage);
                                          }
                                       });
                                    } else {
                                       window.parent.voiceHandler.doControlChannel(voiceData);
                                    }
                                }
                            } else if(command.type == "control") {
                                var intentId = command.action;
                                var param = command.param;
                                if(_.isObject(iotController) && iotController.initialized){
                                   iotController.requestVoiceIntentWithParam(intentId, param);
                                }
                            }
                        }, 3000);
                    }
                    */
                    break;
                case 'doUpdate':
                    setCheckinInfo(true, data.data.name.title, data.data.name.first, data.data.name.last);
                    break;
                case 'doMove':
                    fetchAMData('fetchtvpms', 'ip', function (data) {
                        if (typeof(data.rooms) !== 'undefined' && data.rooms.length > 0 && typeof(data.rooms[0].lastName) !== 'undefined' && data.rooms[0].lastName != 'null' && data.rooms[0].lastName != null) {
                            if('null' == data.rooms[0].salutation || null == data.rooms[0].salutation) {
                                data.rooms[0].salutation = '';
                            }
                            setCheckinInfo(true, data.rooms[0].salutation, data.rooms[0].firstName, data.rooms[0].lastName);
                        }
                        else {
                            setCheckinInfo(false);
                        }
                    }, null);
                    break;                
                default:
            }
        },
        false
    );
    localStorage.setItem('tcp_listener_active', 'true');
}

function initQms() {
    if (typeof IS_QMS !== 'undefined' && IS_QMS == 1) {
        if (typeof (COM_TYPE) !== 'undefined' && COM_TYPE === 'IP') {
            if(typeof IS_NEORCHA !== 'undefined' && IS_NEORCHA == '1') {
                window.parent["QmsController"].initialize();
                window.parent["QmsController"].init();
            }
        }
    }
}

function initQmsRequest() {
    if (typeof IS_QMS !== 'undefined' && IS_QMS == 1) {
        if (typeof (COM_TYPE) !== 'undefined' && COM_TYPE === 'IP') {
            if(typeof IS_NEORCHA !== 'undefined' && IS_NEORCHA == '1') {
                window.parent["QmsController"].initialize();
                window.parent["QmsController"].init();
            }
        }
    }
}

function updateQmsService() {
    if (typeof IS_QMS !== 'undefined' && IS_QMS == 1) {
        if (typeof (COM_TYPE) !== 'undefined' && COM_TYPE === 'IP') {
            if(typeof IS_NEORCHA !== 'undefined' && IS_NEORCHA == '1') {
                window.parent["QmsController"].initialize();
                window.parent["QmsController"].init();
            } else {
                window.parent["OpenQmsController"].init();
                window.parent["OpenQmsController"].getQmsServiceList();
            }
        }
    }
}

function updateQmsRequest() {
    if (typeof IS_QMS !== 'undefined' && IS_QMS == 1) {
        if (typeof (COM_TYPE) !== 'undefined' && COM_TYPE === 'IP') {
            if(typeof IS_NEORCHA !== 'undefined' && IS_NEORCHA == '1') {
                window.parent["QmsController"].initialize();
                window.parent["QmsController"].init();
            } else {
                window.parent["OpenQmsController"].init();
                window.parent["OpenQmsController"].getQmsJobHistory();
            }
        }
    }
}

function goHomePro(callback){
    logConsole("/////////// goHomePro //////// ");
    var fDoc = getIframeObject();
    if (fDoc != null && fDoc.window.currentPage === "popup_007") {   // ||  } document.getElementById('iframe_id').contentWindow.location.href.indexOf("popup_007.html") > -1) {
        logConsole("/////////// SKIP, already on popup //////// ");
        return;
    }

    goToPortal(callback);
}

function goToPortal(callback) {
    logConsole("/////////// goToPortal //////// ");
    var fDoc = getIframeObject();
    if(IS_IFRAME) {
        SyncBackgroundSettingsToParent("portal");
    } else {
        if(typeof fDoc.SyncBackgroundSettingsToParent === 'function') {
            fDoc.SyncBackgroundSettingsToParent("portal");
        }
    }

    setTimeout(function () {
        if ($("#iframe_id").length > 0) {
            if (typeof fDoc.goto === "function" && $("Iframe").contents().find("div[id^='page_']").length !== 0){
                if(fDoc.welcomeMsgRunnerFlag()) {
                    logConsole("in goto - run displayWelcomePaper");
                    fDoc.displayWelcomePaper(parseInt(getCookie("popup_frequency")));
                } else {
                    fDoc.goto("portal");
                }
            } else {
                document.getElementById('iframe_id').setAttribute('src', "portal.html");
            }
        }
        else {
            document.location.href = "portal.html";
        }
        if( _.isFunction(callback)) callback();
        popupWakeupcall();
    }, 250);
}

function getURLParam(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
        return null;
    }
    else{
        return results[1] || 0;
    }
}



function power_change(mode) {
	switch(mode) {
		case "on":
		case "normal":
			power_normal();
			break;
		case "off":
		case "warm":
			power_warm();
			break;
		default:
			logConsole("Invalid power mode '" + mode + "'");
			break;
	}
}

function power_normal(callback){
    //logIndexConsole("In power_normal...");
    hcap.power.setPowerMode({
        "mode":hcap.power.PowerMode.NORMAL,
        "onSuccess":function() {
            //logConsole("Power NORMAL Success");
            if(_.isFunction(callback)){
                callback();
            }
        },
        "onFailure":function(f) {
            logConsole("onFailure : errorMessage = " + f.errorMessage);
        }
    });
}

function power_warm(){
    //logIndexConsole("In power_warm...");
    hcap.power.setPowerMode({
        "mode":hcap.power.PowerMode.WARM,
        "onSuccess":function() {
            //logConsole("Power WARM Success");
        },
        "onFailure":function(f) {
            logConsole("onFailure : errorMessage = " + f.errorMessage);
        }
    });
}

function clearUserCredentials(clear_names_ind, do_reboot, mode, referrer){
    logIndexConsole("In clearUserCredentials from '" + referrer + "'...");
    logIndexConsole("clear_names_ind["+clear_names_ind+"], do_reboot["+do_reboot+"], mode["+mode+"]");

    if (clear_names_ind) {
        removeLocalStorage('guestInfo');

        /* clear notice data */
        removeLocalStorage('notice');
    }

    running_clear_credentials = localStorage.getItem("running_clear_credentials");
    if (running_clear_credentials == "true") {
        logIndexConsole("already trying to clear credentials... do nothing");
        return;
    }
    localStorage.setItem("running_clear_credentials", "true");

    switch(mode) {
        case "normal":
            localStorage.setItem("normal_mode_dont_reboot", "true");

            // step 1: set to 1
            hcap.property.setProperty({
                "key":"security_level",
                "value":"1",
                "onSuccess":function() {
                    hcap.property.getProperty({
                        "key": "instant_power",
                        "onSuccess": function (s) {
                            logConsole("power mode : " + s.value);
                            if(s.value == 0) {
                                if(referrer !='checkout_live' && referrer != 'checkout_swap' ) {
                        
                                    logIndexConsole("About to reboot, while in WARM mode...");
                                    reboot();
                                } else {
                                    powerOff();
                                }
                                
                            } else {
                                // step 2: go to warm
                                setTimeout(function() {
                                    hcap.power.setPowerMode({
                                        "mode" : hcap.power.PowerMode.WARM,
                                        "onSuccess" : function() {
            
                                            logIndexConsole("Set POWER_MODE: WARM");
                                            // do reboot
                                            if (do_reboot) {
                                                setTimeout(function(){
                                                    reboot();
                                                }, 3000);
                                                return;
                                            }
                                            else if( referrer !='checkout_live' && referrer != 'checkout_swap' ){
            
                                                // step 3: go to normal
                                                setTimeout(function() {
                                                    hcap.power.setPowerMode({
                                                        "mode" : hcap.power.PowerMode.NORMAL,
                                                        "onSuccess" : function() {
            
                                                            logIndexConsole("Set POWER_MODE: NORMAL");
            
                                                            // Check if page needs sound or not
                                                            var iframe = document.getElementById('iframe_id');
                                                            localStorage.setItem("isClearing", 1);
                                                            try {
                                                                if(iframe) {
                                                                    logConsole("About to goToDetermineTVSound....");
                                                                    setTimeout(iframe.contentWindow.determineTVSound(), 4000);
                                                                }
                                                                else {
                                                                    logConsole("About to determineTVSound....");
                                                                    determineTVSound();
                                                                }
                                                            } catch(e) {
                                                                logConsole("determineTVSound Error!!! " + e.message);
                                                            }
            
                                                            // step 4: reset to 2
                                                            setTimeout(function() {
                                                                hcap.property.setProperty({
                                                                    "key": "security_level",
                                                                    "value": "2",
                                                                    "onSuccess": function () {
                                                                        logIndexConsole("Set security_level: 2");
            
                                                                        localStorage.removeItem("normal_mode_dont_reboot");
            
                                                                        switch(referrer) {
                                                                            case "launchSmartApp_clear":
                                                                            case "smartapps_clear_button":
                                                                                logConsole("referrer: " + referrer + ", do nothing");
                                                                                break;
                                                                            case "checkout_live":
                                                                                logConsole("referrer: " + referrer + ", goToPortal");
                                                                                setTimeout(function(){
                                                                                    goToPortal();
                                                                                }, 1000);
                                                                                break;
                                                                            default:
                                                                                goHomePro();
                                                                                break;
            
                                                                        }
                                                                    },
                                                                    "onFailure": function (f) {
                                                                        logIndexConsole("tv_control_0 Failure : errorMessage = " + f.errorMessage);
                                                                    }
                                                                });
                                                            }, 5000);
                                                        },
                                                        "onFailure":function(f) {
                                                            logIndexConsole("unable to go to WARM Mode : errorMessage = " + f.errorMessage);
                                                        }
                                                    });
                                                }, 8500);
            
                                            } else {
            
                                                logConsole("referrer: " + referrer + ", goToPortal");
                                                setTimeout(function(){
                                                    location.reload(true);
                                                }, 1000);
            
                                            }
                                        },
                                        "onFailure":function(f) {
                                            logIndexConsole("unable to go to WARM Mode : errorMessage = " + f.errorMessage);
                                        }
                                    });
                                }, 3000);
                            }
                        },
                        "onFailure": function (f) {
                            logConsole("fail to get instant_power : onFailure : errorMessage = " + f.errorMessage);
                        }
                    });
                },
                "onFailure":function(f) {
                    logIndexConsole("tv_control_0 Failure : errorMessage = " + f.errorMessage);
                }
            });

            break;
        case "warm":
            // step 1: set to 1
            logIndexConsole("Setting security level to 1, while in WARM mode...");

            hcap.property.setProperty({
                "key":"security_level",
                "value":"1",
                "onSuccess":function() {
                    logIndexConsole("success, set to 1!");
                },
                "onFailure":function(f) {
                    logIndexConsole("tv_control_0 Failure : errorMessage = " + f.errorMessage);
                }
            });

            logIndexConsole("About to reboot, while in WARM mode...");
            setTimeout(reboot, 8000);

            break;
    }
}


function setClearAndReboot() {
    // logConsole("In setClearAndReboot...");

    // step 1: set to 1
    return hcapPromise.property.setProperty({
        "key":"security_level",
        "value":"1",
        "onSuccess":function() {
            localStorage.setItem("clearAndReboot", "true");
        },
        "onFailure":function(f) {
            logIndexConsole("setClearAndReboot: failed to set security_level = 1,  errorMessage = " + f.errorMessage);
        }
    });

}

function localStorageFilter(accepted) {
    var result = {};
    for (var type in localStorage)
        if (accepted.indexOf(type) > -1) 
            result[type] = localStorage[type];
    return result;
}

function getStorage(){
    return new Promise(function(resolve, fail){
        var pairs = document.cookie.split(";");
        var cookies = {};
        for (var i=0; i<pairs.length; i++){
            var pair = pairs[i].split("=");
            cookies[(pair[0]+'').trim()] = unescape(pair.slice(1).join('='));
        };
        var localStorageData = localStorageFilter(['CAROUSEL_PATH', 'DATAReady', 'GMTOffsetInMinutes', 'INDEX_DEBUG', 'LAST_CHANNEL_NAME', 'MEDIA_START_UP', 
        'PORTAL_DEBUG', 'QMS_JOB_HISTORY', 'QMS_SERVICE_LIST', 'ROOM_STATE', 'access_token', 'allowHide', 'client_id', 
        'default_language', 'doCheckinEvent', 'epg_fetch_date', 'epg_max_minutes', 'firstName', 'firstTime', 'fullName', 'ignoreStartVolume', 
        'inroom_controller_stop', 'keyAllowed', 'language_reset_hour', 'language_reset_minute', 'languages', 'lastEventMsgId', 'lastName', 'last_auto_map_date', 
        'last_reboot_date', 'last_weather_fetch', 'model_name', 'application_milestones', 'notifier_event_id', 'pcn_notifier_event_id',
        'pmsStatus', 'refresh_token', 'room_number', 'salutation', 'tcp_listener_active', 'token_renew_pending', 'tunerNum', 'tv_data', 'tv_ip_address', 
        'tv_sound', 'weather_data', 'xait']);
        
        resolve([localStorageData, cookies]);
    });    
}

function doSync(){
    return new Promise(function(resolve, fail){
        /* need to call this to enable isUpdate from PCN_Room */
        var roomNumber = localStorage.getItem("room_number");
        if (!_.isNil(roomNumber)){
            window.requestHandler.requestAPI('POST', '/api/v2/rooms/' + roomNumber + '/guests', '', function(data){resolve(data);});
        }
        else {
            reject();
        }
    })
    .then(function(){
        loadWidgetJSON("attribute", function(attribute, data){console.log(data);}, "tvpms.json");
    })
    .catch(function(){
        logConsole("Room Number is not Set");
    });
}

function doCheckin(data, dataType){
    //logConsole('{event_received} CHECK-IN EVENT RECEIVED', LOG_MESSAGE_TYPES.event_received);
    updateLanguageCookie(true, 'expire');
    initQms();

    logConsole("{Checkin} Step 1/4: checkin event received, ROOM_STATE = " + localStorage.getItem("ROOM_STATE"));

    if ('null' == data.rooms[0].salutation || null == data.rooms[0].salutation) {
        data.rooms[0].salutation = '';
    }
    var salutation = data.rooms[0].salutation;
    var firstName = data.rooms[0].firstName;
    var lastName = data.rooms[0].lastName;
    var fullName = data.rooms[0].fullName;
    localStorage.setItem("salutation", salutation);
    localStorage.setItem("firstName", firstName);
    localStorage.setItem("lastName", lastName);
    localStorage.setItem("fullName", fullName);
    if (checkAppCerts()) {
        logConsole('-- register app tokens');
        window.smartAppAuthHandler.init();
    }
    if (!_.isNull(data.rooms[0].email)){
        localStorage.setItem("email", data.rooms[0].email);
    }
    if (!_.isNull(data.rooms[0].phone)){
        localStorage.setItem("phone", data.rooms[0].phone);
    }

    if (localStorage.getItem("ROOM_STATE") !== "checkedin") {
        localStorage.setItem("doCheckinEvent", true);
        updateLanguageCookie(true, 'expire');
        if (typeof (data.rooms) !== 'undefined' && data.rooms.length > 0 && typeof (data.rooms[0].lastName) !== 'undefined' && data.rooms[0].lastName != 'null' && data.rooms[0].lastName != null) {

            /*
            Sorting channel list by PMS language
            http://hlm.lge.com/issue/browse/IDSWREQ-1814
            */
            if ('null' !== data.rooms[0].langCode) {
                var language = data.rooms[0].langCode;
                logConsole("{utilities} Updating 'active_channels_language' to check-in language: " + language);
                setCookie("active_channels_language", language);
                updateLanguageCookie(true, language);
            }

            logConsole("{Checkin} Step 2/4: salutation=" + salutation + " ,firstName=" + firstName + " ,lastName=" + lastName + " ,fullName=" + fullName);
        }

        switch (dataType) {
            case 'live':
                logConsole("LIVE");
                expireCookie("welcomeMsgDisplayed");
                expireCookie("channelbanner_active");
                window.parent.setAutoPowerOn();
                localStorage.setItem("CHECKIN_STATE", "live");

                ROOM_STATE = localStorage.getItem("ROOM_STATE");
                if (typeof ROOM_STATE == "undefined") {
                    ROOM_STATE = "";
                }

                setCheckInTvSetup()
                    .then(function (powerMode) { //Ok, after the init set up is done then run clear credentials taking in consideration the new power mode
                        if (powerMode == hcap.power.PowerMode.NORMAL) {
                            // NORMAL MODE, tv on - clear credentials without reboot
                            setTimeout(function () {
                                clearUserCredentials(false, false, 'normal', 'checkin_live');
                            }, 2000);
                        } else {
                            // WARM mode, tv off - clear credentials with reboot
                            setTimeout(function () {
                                clearUserCredentials(false, true, 'warm', 'checkin_live');
                            }, 2000);
                        }
                    });
                localStorage.setItem("ROOM_STATE", "checkedin");
                localStorage.setItem("clearAndReboot", "false");
                logStorage.sendEvent(logStorage.code.STATUS.CHECK_IN);
                updateTvOccupancyStatus('checked-in');

                iotController.requestEvent("CHECK_IN");
                break;
            case 'swap':
                logConsole("SWAP");
                logStorage.sendEvent(logStorage.code.STATUS.CHECK_IN);
                updateTvOccupancyStatus('checked-in');
                localStorage.setItem("CHECKIN_STATE", "swap");
                setClearAndReboot()
                    .then(function() {
                        hcap.power.getPowerMode({
                            "onSuccess" : function(s) {
                                if(s.mode == hcap.power.PowerMode.WARM) {
                                    console.log("onSuccess power mode WARM mode");
                                    if(isEnabledAutoPowerOn()) {
                                        power_normal();
                                    }
                                } else if(s.mode == hcap.power.PowerMode.NORMAL) {
                                    console.log("onSuccess power mode NORMAL mode");
                                }
                            }, 
                            "onFailure" : function(f) {
                                console.log("onFailure : errorMessage = " + f.errorMessage);
                            }
                        });
                    });
                break;
        }
    } else {
        logConsole("Room IS already CheckedIn! Skipping! Do not reset the active language!");
        updateTvOccupancyStatus('checked-in');
    }
}

function unsetClearAndReboot(callback) {
    logConsole("In unsetClearAndReboot...");
    localStorage.setItem("clearAndReboot", "false");

    // step 1: set to 2
    hcap.property.setProperty({
        "key":"security_level",
        "value":"2",
        "onSuccess":function() {
            logConsole("SUCCESS setting security_level = 2");

            if (typeof callback == "function") {
                callback();
            }

        },
        "onFailure":function(f) {
            logIndexConsole("setClearAndReboot: failed to set security_level = 1,  errorMessage = " + f.errorMessage);
        }
    });

}

function guestChange(dataType) {
    return new Promise(function(resolve, reject) {
        if(dataType == 'swap') {
            localStorage.setItem("ROOM_STATE", "checkedout");
            expireCookie("welcomeMsgDisplayed");
            localStorage.removeItem("TurnTvOnAfterReboot");
            localStorage.removeItem("app_certs");
            expireCookie("pmsSite");
            expireCookie("appToken");

            $(".billing_button.checkout").html("Checkout");
            $(".billing_button.checkout").css("width", "150px");

            try {
                if (!_.isUndefined(_.get(getLocalStorageObject("channellist"), "groupId"))
                    && !_.isUndefined(_.get(getLocalStorageObject("channellist"), "orgChannels"))) {
                    setPaidChannelList(); //reset
                }
            } catch (e) {
                logConsole("ERROR in doCheckout: " + e.message);
            }


            iotController.requestEvent("CHECK_OUT");
            updateTvOccupancyStatus('checked-out');
            logStorage.sendEvent(logStorage.code.STATUS.CHECK_OUT);
            resolve();
        } else {
            resolve();
        }
    });
}



function determineTVSound() {
    logConsole("In determineTVSound...");
    var tv_sound = localStorage.getItem("tv_sound");

    if (pageHasVideoOrPipWidget()) {
        logConsole("************ found PIP ***********");
        tv_sound = parseInt(localStorage.getItem("tv_sound"));
        setVolumePro(tv_sound, 0);
    }

    else if (localStorage.getItem("isClearing") == "1"){
        localStorage.removeItem("isClearing");
        setVolumePro(tv_sound);
        if (window.parent.GLOBAL_SOUND_SETTING == 2){
            window.parent.controlBgm(1);
        }
    }

    else {
        logConsole("************ no PIP ***********");
        setVolumePro(-1);
        setTimeout(function() {
            hcap.volume.getVolumeLevel({
                "onSuccess" : function(s) {
                    if (s.level == -1) {
                        logConsole("Volume re-check, successfully muted");
                    }
                    else {
                        logConsole("Volume re-check, muted failed, doing again...");
                        setVolumePro(-1);
                    }
                },
                "onFailure" : function(f) {
                    logConsole("onFailure : errorMessage = " + f.errorMessage);
                }
            });
        }, 500);
    }
}

function update_PCN_TV_Property(columnName, value, tvSerial) {
    logIndexConsole("{pcn_property} update_PCN_TV_Property [" + columnName + "]")

    var params = {
        columnName: columnName,
        updateComponentList: value,
        tvSerial: tvSerial
    };
    window.parent.requestHandler.requestAM('updateTvProperty', Crypto.MD5('' + $.now()), params,
        function (res) {
        logIndexConsole('{pcn_property} DONE NodeJS update_PCN_TV_Property');
        return false;
        }).catch(function (err) {
        logIndexConsole('{pcn_property} FAIL NodeJS update_PCN_TV_Property');
            logConsole(JSON.stringify(err));
        return false;
    });
}

function get_PCN_TV_Property(columnName, tvSerial) {
    logIndexConsole("{pcn_property} get_PCN_TV_Property [" + columnName + "]")
    var params = {
        columnName: columnName,
        tvSerial: tvSerial
    };
    return window.parent.requestHandler.requestAM('detailTvProperty', Crypto.MD5('' + $.now()), params, null);
}

function canOpenStreamConnection(streamType) {
    logIndexConsole("{utilities} canOpenStreamConnection for " + streamType);
    var params = {
        streamType: streamType,
    };
    return window.parent.requestHandler.requestAM('detailStreamConnections', Crypto.MD5('' + $.now()), params,null);
}

function requestStreamConnection(streamType, callback) {
    logIndexConsole("{pcn_property} requestStreamConnection for " + streamType);
    return canOpenStreamConnection(streamType).then(function(response) {
        logIndexConsole("requestStreamConnection response: " + JSON.stringify(response));
        if (response.status == "success") {
            var params = {
                streamType: streamType,
                streamOffset: 1,
            };
            logIndexConsole("{request_am} Running 'updateStreamConnections' for " + streamType);
            return window.parent.requestHandler.requestAM('updateStreamConnections', Crypto.MD5('' + $.now()), params, callback);
        }
    });
}

// DEPRECATED FUNCTION, NEW ONE USES 'requestAM'
// function update_PCN_TV_Property(column, value, tv_serial) {
//
//     var access_token = localStorage.getItem("access_token");
//     // logIndexConsole('////// update_PCN_TV_Property ///// ' + column + ' / ' + value + ' / ' + tv_serial);
//     logIndexConsole("{pcn_property} Updating PCN TV Property [" + column + "]")
//
//     var dObject = {
//         action: "updatePcnTv",
//         columnName: column,
//         updateComponentList: value,
//         tvSerial: tv_serial
//     };
//
//     /*   logConsole(JSON.stringify(dObject)); */
//
//     $.ajax({
//         type: "POST",
//         url: getAsyncManagerUri(),
//         headers: {
//             'Authorization': 'Bearer ' + access_token,
//             'Content-Type': 'application/json'
//         },
//         data: JSON.stringify(dObject),
//         dataType: "json",
//         cache: false
//     }).done(function (response) {
//         logIndexConsole('{pcn_property} DONE NodeJS update_PCN_TV_Property');
//         return false;
//
//     }).fail(function (response, code) {
//         logIndexConsole('{pcn_property} FAIL NodeJS update_PCN_TV_Property');
//         response = jQuery.parseJSON(response.responseText);
//         logIndexConsole('response: ' + JSON.stringify(response));
//         return false;
//     });
// }

function loadJsonFromAsyncManager(fileName, localStorageVarName, callback, attributes) {

    var access_token = localStorage.getItem("access_token");
    //logIndexConsole('////// loadJsonFromAsyncManager ///// ' + fileName );

    var dObject = {
        action: "getJsonFile",
        filename: fileName
    };

    //logConsole(JSON.stringify(dObject));

    $.ajax({
        type: "POST",
        url: getAsyncManagerUri(),
        headers: {
            'Authorization': 'Bearer ' + access_token,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(dObject),
        dataType: "json",
        cache: false
    }).done(function (response) {
        //logIndexConsole('//////////////////SUCCESSFULLY RETRIEVED ' + fileName + ' FROM ASYNC MANAGER.');
        if (response.status == "success") {
            setLocalStorageObject(localStorageVarName, response.data);
            if (typeof callback === "function") {
                callback(attributes, response.data);
            }
        } else {
            logIndexConsole('//////////////////FAIL[a] NodeJS loadJsonFromAsyncManager  ///// ');
            logIndexConsole('response: ' + JSON.stringify(response));
        }

        return false;

    }).fail(function (response, code) {
        logIndexConsole('//////////////////FAIL[b] NodeJS loadJsonFromAsyncManager  ///// ');
        response = jQuery.parseJSON(response.responseText);
        logIndexConsole('response: ' + JSON.stringify(response));
        return false;
    });
}

function setVolumePro(vol) {
    // logConsole("In setVolumePro: " + vol);
    if(!isPreviewMode() && !isEditorMode()) {
        hcap.volume.setVolumeLevel({
            'level' : vol,
            'onSuccess' : function() {
                // logConsole('onSuccessully adjusted sound');
            },
            'onFailure' : function(f) {
                logConsole('onFailure : errorMessage = ' + f.errorMessage);
            }
        });
    }
}

function showPopup(msg) {
    $(".tv_popup").hide();
    $(".tv_popup").remove();

    var popup = $('<div class="tv_popup" style="width: 300px; height: 30px; ">' + msg + '</div>');

    var win = $(window);
    var left = parseInt(  (parseInt(win.width())  - parseInt(popup.width())    )   / 2   );
    var top = parseInt(  (parseInt(win.height()) - parseInt(popup.height())   )   / 2    );

    popup.css({"left":left + "px", "top":top + "px", "position":"absolute", "display":"block"});

    popup.appendTo($('body'));

    setTimeout(function() {
        popup.hide();
        popup.remove();
    }, 5000);
}

function popupWakeupcall() {
    // check the status of showpopupontv when TV turns on by wakeupcall
    if (localStorage.getItem('showPopupOnTv') != null) {
        logConsole("Show popup on tv: " + localStorage.getItem('showPopupOnTv'));

        setTimeout(function () {
            showPopupForWakeupcall("It's time to get up.", "Have a good day.");
        }, 5000);
    }
}

function showPopupForWakeupcall(msg1, msg2) {
    $(".wakeupcall_popup").hide();
    $(".wakeupcall_popup").remove();

    var popup_wakeup = $('<div class="wakeupcall_popup" style="width: 500px; height: 115px; ">' + msg1 + '<br/>' + msg2 + '<footer><a href="#" class="confirm-btn" data-id="yes">OK</a></footer></div>');
    popup_wakeup.click(function() {
        var requestData = {};
        requestData["id"] = localStorage.getItem('showPopupOnTv');
        requestData["requestCode"] = "TV";
        requestData["status"] = "F";
        window.requestHandler.requestQMS("updateTvQmsRequest", requestData);

        localStorage.removeItem('showPopupOnTv');

        $(".wakeupcall_popup").hide();
        $(".wakeupcall_popup").remove();

        fDoc.focus();
    });

    var left = parseInt( (parseInt($(window).width()) - parseInt(popup_wakeup.width()) ) / 2 );
    var top = parseInt( (parseInt($(window).height()) - parseInt(popup_wakeup.height()) ) / 2 );
    popup_wakeup.css({"left":left + "px", "top":top + "px", "position":"absolute", "display":"block"});
    popup_wakeup.appendTo($('body'));

    $(".wakeupcall_popup a.confirm-btn").addClass("active");
    $(".wakeupcall_popup a.confirm-btn").focus();
}

function getPmsStatus() {
    return localStorage.getItem("pmsStatus");
}

function isCheckedIn() {
    var lastName = localStorage.getItem("lastName");
    var fullName = localStorage.getItem("fullName");
    logConsole('--- isCheckedIn() lastName:'+lastName+' fullName:'+fullName);

    /* HSP does't send lastName */
    if (!_.isEmpty(lastName) || !_.isEmpty(fullName)) {
        return true;
    }
    return false;
}

function checkAppCerts() {
    /* Return if this TV should register token to use Netflix / Amazon */
    var pmsType = getCookie("pmsType");
    var pmsSetup = (pmsType == 'SONIFI' || pmsType == 'OPENAPI' || (window.parent.IS_MIA_PROJECT && pmsType == 'MARRIOTT'));
    logIndexConsole('-- Function checkAppCerts() - PMS SETUP? ' + pmsSetup + ' WEBOS VER ? ' + getCookie("webos"));
    return getCookie("webos") >= 5 && pmsSetup;
}

function isVODPlaying() {
    var vod_playing = getCookie("vod_playing");
    //logIndexConsole("{isVODPlaying} vod_playing: " + vod_playing);
    if (vod_playing != '') {
        return true;
    }
    return false;
}

function setBackgroundToBlack() {
    $("body").css('background-color', 'black');
    $("body").css('background-image', 'none');
}

function setBackgroundToTV() {
    $("body").css('background-color','transparent');
    $("body").css('background-image','url(tv:)');
}

function getTunerNumber() {
	//logConsole("In getTunerNumber....");
    hcap.property.getProperty({
        "key": "number_of_tuner",
        "onSuccess": function(s) {
            var tunerNum = s.value;
            //logConsole("tunerNum: " + s.value);

            localStorage.setItem("tunerNum", tunerNum);

            if (tunerNum === "1" && window.parent.COM_TYPE == 'RF') { // if not RF uiConfig file will be loaded locally at the begining
                if(typeof window.parent.GLOBAL_SOUND_SETTING != "undefined" && window.parent.GLOBAL_SOUND_SETTING == 2) {
                    acquireDataChannelForInit(false);
                }
                else {
                    acquireDataChannelForInit(true);
                }
            }
            else {
                //logConsole("****** This is a saved function in acquireDataChannelForInit ******");
                logConsole("Attempting to read 'uiConfig' data [1]");
                window.parent.loadJSON(window.parent.getUIConfigData, "uiConfig.json");
            }
        },
        "onFailure": function(f) {
            logConsole("onFailure : errorMessage = " + f.errorMessage);
        }
    });
}

function acquireDataChannelForInit(isChange) {
	logConsole("In acquireDataChannelForInit...");

	if(localStorage.getItem("tunerNum") === "1") {
		hcap.channel.getDataChannel({
			"onSuccess" : function(s) {
				param = s;
				if (s.channelType === hcap.channel.ChannelType.RF_DATA) {
					window.parent.CHANNEL_TYPE = 'RF_DATA';
					if(isChange === true || isChange === 'true' && localStorage.getItem('reset_memory_reload') == null) {
						param.onSuccess = function() {
							var func = function() {
                                logConsole("Attempting to read 'uiConfig' data [2]");
								window.parent.loadJSON(window.parent.getUIConfigData, "uiConfig.json");
							};

							if (typeof CALLBACK_FX_ARRAY != 'undefined') {
								CALLBACK_FX_ARRAY.callback = func;
								CALLBACK_FX_ARRAY.referrer = 'acquireDataChannelForInit';
								CALLBACK_ACTIVE = true;
							}
						}

						//logConsole("**** About to tune to: " + JSON.stringify(param));

						hcap.channel.requestChangeCurrentChannel(param);
					} else if(isChange===false){
                        window.parent.loadJSON(window.parent.getUIConfigData, "uiConfig.json");
                    }
				}
				else if(s.channelType === hcap.channel.ChannelType.IP_DATA){
					window.parent.CHANNEL_TYPE = 'IP_DATA';
				}
			},
			"onFailure" : function(f) {
				logConsole("onFailure : errorMessage = " + f.errorMessage);
			}
		});
	}
}

function acquireDataChannelWhileBGM(method) {
	if(localStorage.getItem("tunerNum") === "1") {
        console.log("control media start up");
        return hcapPromise.channel.getDataChannel({
			"onSuccess" : function(s) {
				param = s;
				if (s.channelType === hcap.channel.ChannelType.RF_DATA) {
					var channelRange = parseInt(DATA_CHANNEL);
					if(channelRange >=2 && channelRange < 135) {
						return tuneToDataChannel();
					}
					else {
						console.log('request change current channel ================ ');
                            return hcapPromise.channel.requestChangeCurrentChannel({
                                "channelType" : param.channelType, /* RF_DATA */
                                "frequency" : param.frequency,
                                "programNumber" : param.programNumber,
                                "majorNumber" : param.majorNumber,
                                "minorNumber" : param.minorNumber,
                                "rfBroadcastType" : param.rfBroadcastType, /* ATSC,DVB : 48 | ISDB-T :16 */
                                "onSuccess" : function() {
                                    console.log('change current channel success ================ ');
                                    return hcapPromise.Media[method]({
                                        'onSuccess' : function() {
                                            logConsole('Media ' + method + ' onSuccess');
                                        },
                                        'onFailure' : function(e) {
                                            logConsole('Media ' + method + ' onFailure : errorMessage = ' + e.errorMessage);
                                        }
                                    });
                                },
                                "onFailure" : function(f) {
                                    logConsole("onFailure : errorMessage = " + f.errorMessage);
                                }
                            });
					}
				}
			},
			"onFailure" : function(e) {
				logConsole("onFailure : errorMessage = " + e.errorMessage);
			}
		});
	} else {
        return hcapPromise.Media[method]({
            'onSuccess' : function() {
                logConsole('Media ' + method + ' onSuccess');
            },
            'onFailure' : function(e) {
                logConsole('Media ' + method + ' onFailure : errorMessage = ' + e.errorMessage);
            }
        });
    }
}

function releaseDatachannelForCarousel(channel_change, hide_portal_status) {
    if(!channel_change) {
        return;
    }
    
    if(_.isUndefined(hide_portal_status)) {
        hide_portal_status = false;
    }

    logIndexConsole("Release from data channel, back to previous channel");
    if((window.parent.tunerNum === "1" && window.parent.GLOBAL_SOUND_SETTING != 2) || hide_portal_status) {
        var current_channel = getCookie('current_channel');
        var prev_channel = parseInt(getCookie('previous_channel'));
        if(!_.isUndefined(prev_channel) && prev_channel > 0){
            current_channel = prev_channel;
        } else if(typeof current_channel === "undefined" || current_channel < 0 || current_channel == '') {
            current_channel = parseInt(getCookie("startChannelLogicalNumber"));
        }

       var physical_channel = getPhysicalChannelInfo(current_channel);
       if (!_.isUndefined(physical_channel) && !_.isEmpty(physical_channel)){
           var fx = function(){};
           if(!hide_portal_status){
                fx = function() {
                    window.parent.fDoc.updateWidgets('releasing from data channel');
                };
           }
           
           changeChannel(physical_channel, 0, 0, 'releaseDatachannelForCarousel', fx);
       }
    }
    else {
        window.parent.fDoc.updateWidgets('releasing from data channel (dual tuner)');
    }
}

function restoreCurrentChannel() {
    var prevChannel = parseInt(getCookie('previous_channel'));
    if (prevChannel > -1){
        current_channel = prevChannel;
        var physical_channel = getPhysicalChannelInfo(current_channel);
        if (!_.isUndefined(physical_channel) && !_.isEmpty(physical_channel)){
            changeChannel(physical_channel, 0, 0, 'restoreCurrentChannel', null);
        }
    }
}

function acquireDatachannelForCarousel(callback) {
	if(localStorage.getItem("tunerNum") === "1") {
		hcap.channel.getCurrentChannel({
			"onSuccess" : function(s) {
				var currentParam = s;
				hcap.channel.getDataChannel({
					"onSuccess" : function(s) {
						param = s;
						if (s.channelType === hcap.channel.ChannelType.RF_DATA) {
							if(param.frequency !==  currentParam.frequency) {
// THIS DOESN'T WORK, BECAUSE ONSUCCESS ISN'T THE TRUE INDICATOR OF CHANNEL SUCCESSFULLY CHANGED.
// NEEDS TO BE ASSIGNED TO THE CALLBACK_FX_ARRAY WHICH GETS PROCESSED IN INDEX.HTML 'channel_changed' event.
// DON'T UNCOMMENT THIS UNTIL YOU CAN EXPLAIN A VALID REASON!!!!
//								param.onSuccess = function() {
//									logConsole("***@@@ DataCahnnel changed for weather or billing");
//									if(typeof callback === "function") {
//										setTimeout(function() {
//											callback();
//											}, 1000);
//									}
//								};
								//var channelRange = parseInt(DATA_CHANNEL);
								//if(channelRange >=2 && channelRange < 135) {
									if(typeof callback === "function") {
										tuneToDataChannel(callback);
									}
									else {
										tuneToDataChannel();
									}
								//}
// DON'T UNCOMMENT THIS UNTIL YOU CAN EXPLAIN A VALID REASON!!!!
// WHAT IS THIS?? WHY IS IT IMPORTANT TO CHECK RANGE OF DATA CHANNEL?
// IS IT INVALID IF OUTSIDE THE RANGE?
// IF SO WHY ARE WE TUNNING TO AN INVALID CHANNEL???
//								else {
//									hcap.channel.requestChangeCurrentChannel(param);
//								}
							}
							else {
								logConsole("***@@@requset data channel - current channel is : " + param.frequency);
								if(typeof callback === "function") {
									setTimeout(function() {
										callback();
										}, 1000);
								}
							}
						}
					},
					"onFailure" : function(f) {
						logConsole("onFailure : errorMessage = " + f.errorMessage);
					}
				});
			},
			"onFailure" : function(f) {
				logConsole("FAILURE in getDataChannelFromPowerOn!");
			}
		});
	} else {
		if(typeof callback === "function") {
			setTimeout(function() {
				callback();
				}, 1000);
		}
	}
}

function logMilestoneEvent(milestone) {
    // logIndexConsole("In logMilestoneEvent with milestone: " + milestone, LOG_MESSAGE_TYPES.information);
    try {
        var application_milestones = localStorage.getItem("application_milestones");
        var application_milestones_parsed = (application_milestones ? JSON.parse(application_milestones) : []);
        if ($.isArray(application_milestones_parsed)) {
            var timestamp = moment().unix();
            var milestone = {
                "timestamp": timestamp,
                "key": milestone.toUpperCase()
            };
            logIndexConsole("Adding " + milestone.milestone + ": " + JSON.stringify(milestone));
            application_milestones_parsed.push(milestone);
            localStorage.setItem("application_milestones", JSON.stringify(application_milestones_parsed));
        } else {
            logIndexConsole("application_milestones object NOT FOUND in localStorage", LOG_MESSAGE_TYPES.error);
        }
    } catch (error) {
        logIndexConsole("ERROR In logMilestoneEvent: " + error, LOG_MESSAGE_TYPES.error);
    }
}

function setLocalStorageObject(key, value) {
    LZString = (typeof LZString != "undefined") ? LZString : parent.LZString;
    var data;
    if ($.isPlainObject(value)) {
        data = JSON.stringify(value);
    }
    else {
        data = value;
    }
    switch(key) {
        case 'channellist':
        case 'event_data':
        case 'videoplayout':
            localStorage.setItem(key, LZString.compress(data));
            break;
        default:
            localStorage.setItem(key, data);
            break;
    }
}

function getLocalStorageObject(key) {
    var key_object = null;
    LZString = (typeof LZString != "undefined") ? LZString : parent.LZString;
    switch(key) {
        case 'channellist':
        case 'event_data':
        case 'videoplayout':
            key_object = LZString.decompress(localStorage.getItem(key));
            break;
        default:
            key_object = localStorage.getItem(key);
            break;
    }

    if (typeof key_object != 'undefined' && key_object != null && key_object != '') {
        return JSON.parse(key_object);;
    }
    else {
        key_object = {};
        return key_object;
    }
}

function trimApplicationMilestoneHistory() {
    logIndexConsole("Trimming Application Milestone History", LOG_MESSAGE_TYPES.information);
    try {
        var application_milestones = localStorage.getItem("application_milestones");
        var application_milestones_parsed = (application_milestones ? JSON.parse(application_milestones) : []);
        if ($.isArray(application_milestones_parsed)) {
            var thresholdDate = moment().subtract(2, "days");
            $.each(application_milestones_parsed, function (i, milestone) {
                if (milestone) {
                    // logIndexConsole("Verifying milestone[" + milestone.key + "] at position " + i);
                    var timestampLength = milestone.timestamp.toString().length;
                    if (timestampLength == 10) {
                        milestone.timestamp = milestone.timestamp * 1000;
                    }
                    var historyDate = moment(parseFloat(milestone.timestamp));
                    if (historyDate < thresholdDate) {
                        logIndexConsole(milestone.key + "["+ historyDate.format('MM/DD/YYYY HH:mm:ss ZZ') +"] is stale - removing");
                        application_milestones_parsed.splice(i, 1);
                    }
                } else {
                    logIndexConsole("Deleting 'undefined' milestone at position " + i);
                    application_milestones_parsed.splice(i, 1);
                }
            });
            localStorage.setItem("application_milestones", JSON.stringify(application_milestones_parsed));
        }
    } catch (error) {
        logIndexConsole("ERROR In trimApplicationMilestoneHistory: " + error, LOG_MESSAGE_TYPES.error);
    }
}

function switchNativeEPG(sendInputKey) {
    addKeyItem(hcap.key.Code.GUIDE, 0, function() {
        if(typeof sendInputKey != "undefined" && sendInputKey == "GUIDE") {
            hcap.key.sendKey({
                "virtualKeycode" : hcap.key.Code.GUIDE,
                "onSuccess" : function() {
                    logConsole("euroGuideButtonSet - onSuccess");
                },
                "onFailure" : function(f) {
                    logConsole("euroGuideButtonSet - onFailure : errorMessage = " + f.errorMessage);
                }
            });
        }
    });
}

function processSalesKey() {
    var event_data = getLocalStorageObject("event_data");
    if ($.isPlainObject(event_data) && !$.isEmptyObject(event_data)) {

	    var d = new Date(event_data.startDate);
	    var local_offset = parseInt(d.getTimezoneOffset());
	    var year = parseInt(d.getUTCFullYear());
	    var month = parseInt((d.getUTCMonth()+1));
	    var day = parseInt(d.getUTCDate());
	    var hour = parseInt(d.getHours()); // + parseInt(offset_hours);
	    var minute = parseInt(d.getUTCMinutes()); // + parseInt(offset_min);
	    var second = parseInt(d.getUTCSeconds());
	    var offset = local_offset * (-1);
	    var daylight_savings = false;

	    logConsole("setting: " + day  + '-' + month + '-' + year + ' // ' + hour +  ':' + minute + ':' + second + ' // offset: ' +  offset  );

	    hcap.time.setLocalTime({
	        "year" :    year,
	        "month" :     month,
	        "day" :     day,
	        "hour" :     hour,
	        "minute" :     minute,
	        "second" :     second ,
	        "gmtOffsetInMinute" : offset,
	        "isDaylightSaving" : daylight_savings,
	        "onSuccess" : function() {
	            updated_date = new Date();
	            logConsole("updated_date: " + updated_date.toLocaleString());
	        },
	        "onFailure" : function(f) {
	            logConsole("setLocalTime onFailure : errorMessage = " + f.errorMessage);
	        }
	    });
	}
	else {
		logConsole("Missing 'event_data' from local.storage");
	}
}

function scrollConsole(console_id, direction) {
    var target_console = $("." + console_id);

    if (target_console.length) {
        var y = target_console.scrollTop();

        switch(direction) {
            case "top":
                target_console.scrollTop(0);
                break;
            case "up":
                target_console.scrollTop(y - 50);
                break;
            case "down":
                target_console.scrollTop(y + 50);
                break;
        }
    }
}

function fetchFreshEPGData() {
    if (isEditorMode() || isPreviewMode()) {
        return;
    }
    logConsole("In fetchFreshEPGData...");
    setCookie("fetching_fresh_epg_data", "true", COOKIE_EXPIRE_DAYS);
    localStorage.removeItem("epg_retries");

    /* RF MODE */
    if (window.parent.COM_TYPE == 'RF') {
        if(localStorage.getItem("tunerNum") === "1") {
            localStorage.setItem("release_data_channel", "event_data");
            window.parent.CarouselAttemptCount.event_data = 0;
            window.parent.logConsole("{utilities} Switching to data channel to fetch new EPG data");
            tuneToDataChannel(function() {
                window.parent.logConsole("{utilities} Attempting to pull new EPG data from carousel");
                if (typeof window.parent.getCarousel == "function" && typeof window.parent.CARAUSEL_PATH !== "undefined") {
                    window.parent.getCarousel(window.parent.CARAUSEL_PATH + "event_data.json");
                }
                else {
                    logConsole("{utilities} getCarousel or CARAUSEL_PATH is undefined");
                }
            });
        }
        else {
            window.parent.logConsole("{utilities} Don't need to switch to data channel, fetching new EPG data");
            window.parent.getCarousel(window.parent.CARAUSEL_PATH + "event_data.json");
        }
    }
    /* IP MODE */
    else {
        window.parent.logConsole("{utilities} Attempting to pull new EPG data from AsyncManager");
        window.parent.fetchEventData();
    }
}

/**
 * function that checks hcap preLoadedApplicationList to determine the smart app id
 * @param app(App Name eg. "HBO GO")
 * @returns Promise
 */
var getAppId = function (app) {
    var appName = app.toLowerCase();
    var appId;

    return new Promise(function (resolve, failure) {
        hcap.preloadedApplication.getPreloadedApplicationList({
            "onSuccess": function (s) {
                var idx = _.findIndex(s.list, function (o) {
                    return o.title.toLowerCase() == appName;
                });
                appId = (s.list[idx]) ? s.list[idx].id : null;
                logConsole("APP ID FOUND " + appId);
                resolve(appId);
            },
            "onFailure": function (e) {
                failure("ERROR GETTING PRELOAD APPLICATION LIST " + JSON.stringify(e));
            }
        })
    });
}

function processSalesKey() {
    var event_data = getLocalStorageObject("event_data");
    if ($.isPlainObject(channels) && !$.isEmptyObject(channels)) {
	    logConsole("setting system time to: " + event_data.startDate);

	    var d = new Date(event_data.startDate);
	    var local_offset = parseInt(d.getTimezoneOffset());
	    var year = parseInt(d.getUTCFullYear());
	    var month = parseInt((d.getUTCMonth()+1));
	    var day = parseInt(d.getUTCDate());
	    var hour = parseInt(d.getHours()); // + parseInt(offset_hours);
	    var minute = parseInt(d.getUTCMinutes()); // + parseInt(offset_min);
	    var second = parseInt(d.getUTCSeconds());
	    var offset = local_offset * (-1);
	    var daylight_savings = false;

	    logConsole("setting: " + day  + '-' + month + '-' + year + ' // ' + hour +  ':' + minute + ':' + second + ' // offset: ' +  offset  );

	    hcap.time.setLocalTime({
	        "year" :    year,
	        "month" :     month,
	        "day" :     day,
	        "hour" :     hour,
	        "minute" :     minute,
	        "second" :     second ,
	        "gmtOffsetInMinute" : offset,
	        "isDaylightSaving" : daylight_savings,
	        "onSuccess" : function() {
	            updated_date = new Date();
	            logConsole("updated_date: " + updated_date.toLocaleString());
	        },
	        "onFailure" : function(f) {
	            logConsole("setLocalTime onFailure : errorMessage = " + f.errorMessage);
	        }
	    });
	}
	else {
		logConsole("Missing 'event_data' from local.storage");
	}
}

/*************** legacy function support *****************************/
function createLog() {
    $('<div style="background-color:#E6E6FA;" id="htmlconsole"></div>').appendTo($('body'));
}

function logError(message) {
    logConsole(message);
}
/*************** legacy function support *****************************/

/*************** rms stopDeviceInfo check and run *****************************/
function checkPreviousPageLogic() {
    var _inRoomControllerExists = (typeof InRoomController === "object");
    /*logConsole('checkPreviousPageLogic() : InRoomController exists = ' + _inRoomControllerExists);*/
    if(isPreviewMode()) {
        return;
    }
    var inroom_controller_stop = localStorage.getItem('inroom_controller_stop');
    /*logConsole('previouse page : InRoomController exists = ' + inroom_controller_stop);*/
    if(inroom_controller_stop === "true" && _inRoomControllerExists === false) {
        fetchAMData("stopDeviceInfo", "ip", function(data) {
            logConsole("stopDeviceInfo callback()");
        },
        {});
    }
    localStorage.setItem('inroom_controller_stop', _inRoomControllerExists);
}

function checkUpdateWidget() {
    var fDoc = getIframeObject();

    if(RFVariable.currentPageName === "weather" || RFVariable.currentPageName === "billing") {
       if(getCookie("imagefetchdone") == 'true' && getCookie("weatherfetchdone") == 'true') {
          fDoc.updateWidgets();
          setTimeout(function() {
            fDoc.autoEnterSelectedWidget();
          }, 1000);
       } else if(RFVariable.currentPageName === "billing" && (getCookie("pmsfetchdone") == 'true')) {
          fDoc.updateWidgets();
          setTimeout(function() {
            fDoc.autoEnterSelectedWidget();
          }, 1000);
       }
    }
}
/*************** rms stopDeviceInfo check and run *****************************/

function determineCarouselMode() {
	logConsole("In determineCarouselMode....");

	var carousel_mode = '';
	var fDoc = getIframeObject();
	if(fDoc) {
		logConsole(" -- in wrapper");
		if(typeof COM_TYPE !== "undefined" && typeof CHANNEL_TYPE !== "undefined"){
			logConsole("CHANNEL_TYPE: " + CHANNEL_TYPE);
			logConsole("COM_TYPE: " + COM_TYPE);

			if (COM_TYPE == 'RF') {
				carousel_mode = 'RF';
			}
			else if (CHANNEL_TYPE == 'RF_DATA') {
				carousel_mode = 'HYBRID';
			}
			else {
				carousel_mode = 'IP';
			}
		}
		else {
			logConsole("Undefined COM_TYPE || CHANNEL_TYPE");
		}
	}
	else {
		logConsole(" -- in iframe page");
		if(typeof window.parent.COM_TYPE !== "undefined" && typeof window.parent.CHANNEL_TYPE !== "undefined"){
			logConsole("CHANNEL_TYPE: " + window.parent.CHANNEL_TYPE);
			logConsole("COM_TYPE: " + window.parent.COM_TYPE);

			if (window.parent.COM_TYPE == 'RF') {
				carousel_mode = 'RF';
			}
			else if (window.parent.CHANNEL_TYPE == 'RF_DATA') {
				carousel_mode = 'HYBRID';
			}
			else {
				carousel_mode = 'IP';
			}
		}
		else {
			logConsole("Undefined window.parent.COM_TYPE || window.parent.CHANNEL_TYPE");
		}
	}

	logConsole("carousel_mode: " + carousel_mode);
	return carousel_mode;
}

function handle_Memory_Usage() {
    check_Memory_Usage()
	.then(function(param) {
        //logConsole("{utilities} Used memory = " + param.percentage + "%");
	   	if (param.percentage >= 88 && location.pathname.indexOf("channelbanner.html") == -1) {
            logConsole("{utilities}Memory usage " + param.percentage + " has exceeded threshold of 88%. Resetting app.");

	//		SyncBackgroundSettingsToParent('portal');

			localStorage.setItem('reset_memory_reload', 'true');
			setTimeout(function() {
				$("iframe_id").addClass('hidden');
		   		window.top.location.href = "reset_memory.html";
			},500);
        }
        return Promise.resolve(true);
    });
}

function check_Memory_Usage() {
	// logConsole("***** In check_Memory_Usage.....");
	return new Promise(function(resolve, fail){
		hcap.system.getMemoryUsage({
			"onSuccess": function (param) {
                logStorage.sendEvent(logStorage.code.STATUS.MEMORY, "tv memory", param.percentage);
				resolve(param);
			},
			"onFailure": function(f){
                console.log("{utilities} errorMessage = " + f.errorMessage);
				return fail(f);
			}
		});
	});
}

function pingServer() {
    logConsole("{utilities} In pingServer...");
    return hcapPromise.network.ping({ip: window.parent.GLOBAL_SERVER_IP})
        .then(function (s) {
            return "{utilities} Successfully pinged " + window.parent.GLOBAL_SERVER_IP + " in " + s.roundTripTimeInMs + "ms";
        })
        .catch(function (err) {
            throw err;
        });
}

function unhideVideoPIPWindow() {
    logConsole("{utilties} Looking for PIP/Video widget on the page");
    if (!isEditorMode() && !isPreviewMode() && pageHasVideoOrPipWidget()) {
        logConsole("{utilties} Found PIP/Video widget on the page, removing black background!", LOG_MESSAGE_TYPES.information);
        $("#pip").css('background-image', 'url(tv:)');
        $("#lg_video").css('background-image', 'url(tv:)');
    }
}

function pageHasVideoOrPipWidget() {
    if ($("#pip").length > 0 || $("#lg_video").length > 0) {
        return true;
    }
    return false;
}

function isWeatherFresh() {
    if (isEditorMode() || isPreviewMode()) {
        return false;
    }
    // 5 second cushion to prevent the scheduler from missing a fetch
    var now = window.parent.moment().unix() + 5;
    var lastWeatherFetch = (localStorage.getItem('last_weather_fetch') == null) ? now : parseInt(localStorage.getItem('last_weather_fetch'));
    var diff = now - lastWeatherFetch;
    logConsole('{page_utilities} LAST WEATHER FETCH '+ moment.unix(lastWeatherFetch).format('MM-DD hh:mm:ss A'));
    logConsole('{page_utilities} NOW TIME '+now);
    logConsole('{page_utilities} DIFF '+ (diff / 60) + ' MINUTES');
    if(diff > window.parent.weather_fetch_minutes_interval * 60 || diff == 0 || _.isNull(localStorage.getItem('weather_data'))) {
        return false;
    }
    return true;
}

function canDataBeRefreshed() {
    if (isEditorMode() || isPreviewMode()) {
        return false;
    }
    if (window.parent.COM_TYPE == 'IP' || window.parent.tunerNum > 1) {
        logConsole("{page_utilities} Carousel data on this page can be updated [1].");
        return true;
    }
    else {
        switch(parent.RFVariable.currentPageName) {
            case "weather":
            case "billing":
                if (!pageHasVideoOrPipWidget()) {
                    logConsole("{page_utilities} Carousel data on this page can be updated [2].");
                    return true;
                }
                break;
        }
    }
    logConsole("{page_utilities} Carousel data can NOT be updated due to page restrictions.");
    return false;
}

function isAutoMapDone() {
    return localStorage.getItem("automap_started") == null;
}
/*************** rms stopDeviceInfo check and run *****************************/
