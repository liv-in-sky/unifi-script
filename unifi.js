// September 2019 @liv-in-sky durch viel vorarbeit von @thewhobox (api verbindung)

// Definition Login
const unifi_username = "xxx";
const unifi_password = "xxxxxxx";
const unifi_controller = "https://192.168.178.157:8443";

let siteName ="default";   //Site name 

// DEFINITION der zu anzeigenden Netzwerke am besten bis auf id und smart alle gleich setzen
const wifis = {
   "WLAN_DragonRoot1": { name: "WLAN_DragonRoot1",         id: "5cxxxxxxxxxxxx1", desc: "WLAN_DragonRoot1" } ,
   /* "WLAN11_DragonRoot1": { name: "WLAN11_DragonRoot1", id: "5cxxxxxxxxxxxx", desc: "WLAN11_DragonRoot1", smart: "WLAN11_DragonRoot1" } ,*/
   "WLAN_DragonRootGuest": { name: "WLAN_DragonRootGuest", id: "5d6xxxxxxxxxxxxx", desc: "WLAN_DragonRootGuest" }
}

const apName = {  "b4:xx:e4:xx:xx:xx" : { aname: "AP-LongR"},
                  "18:xx:xx:xx:40:e2" : { aname: "AP-Light"}}
                 // "xx:e8:xx:xx:xx:47" : {aname: "VirSwitch"}}

//Vordefinierte Vouchers für  one-click-create - wird hier etwas geändert BITTE DATENPUNKT (Vouchers_StandardList) LÖSCHEN vor Scriptstart!!!!
//BITTE alle Werte eingeben - für nichtbenutzte wie up-, download und nmb_begrenzung eine 0 eintragen
// Pflichteinträge sind dauer, anzahl, multiuse und notiz !!!
const standardVouchers = {"Vier Tage" : {dauer: 240, anzahl: 1, multiuse: 1, upload: 0, download:0, mb_begrenzung: 500, notiz:"MB Begrenzung 500 - 4 Tage"}, 
                          "Sieben Tage" : {dauer: 10080, anzahl: 1, multiuse: 1, upload: 300, download:300, mb_begrenzung: 500, notiz:"MB Begrenzung 500 - 7 Tage"},
                          "99 Minuten" : {dauer: 99, anzahl: 1, multiuse: 0, upload: 0, download:200, mb_begrenzung: 500, notiz:"www-liv-in-sky 99 Minuten"},
                          "66 Minuten" : {dauer: 99, anzahl: 1, multiuse: 0, upload: 0, download:200, mb_begrenzung: 500, notiz:"www-liv-in-sky 66 Minuten"},
                          "33 Minuten" : {dauer: 99, anzahl: 1, multiuse: 0, upload: 0, download:200, mb_begrenzung: 500, notiz:"www-liv-in-sky 33 Minuten"}
                          }

const blackList = [ ] //Blacklist - diese clients werden nicht berücksichtigt - aber nur wenn ein alias im controller definiert ist
const checkConnType=["Galaxy-S9","FireTablet7","Galaxy-S5","GalaxyTabS2","TrekStor13","MediaTabT5"];  // Datenpunkte (werden erstellt) für Überwachung von Connection (WLAN only) - aber nur wenn ein alias im controller definiert ist
                                                                           // wenn leer - keine überwachung (const checkConnType=[])

//Pause bei Umschalten der WLANnetze, damit Netzanmeldungen der clients wieder normal
const clientPauseConst = 200000;    //1000 bedeutet 1 Sekunde -  das braucht Zeit !!!

// Abfragezyklus definieren
const abfragezyklus =20000; // es ist nicht zu empfehlen unter 20000 (20 sekunden) zu gehen
const abfageoffset = 25000; // zu schnelle Abmeldungen können hier eingestellt weren - > erhöhen (15000 = 15 sek.)

//HIER Einstellungen : EIN-AUSSCHALTEN Vouchers, iqontrol-Datei erstellen, anwesenheitskontrolle-clientpflege
let iqontrol = true;
let anwesenheit = true; // beim setzen von true auf false die verzeichnisstruktur unter iobroker-objects "von hand" löschen

let vouchers = true;
let apInfo = true;
let problemWLAN=false; //bei problemen mit APs die über WLAN angebuden sind
let countFalseSetting=2; //2 bedeutet : einmal einen abfragezyklus auslassen bevor auf false gesetzt wird: Formel:  n-1
let aliasname=false; 
let disConClientsFirst=true; //zeigt disconnected clients als erstes im table (vis) oder iqontrol an

let ohneClientAbfrage=false; //schaltet das bearbeiten der clients vollständig ab - auch keine datenpunkte

let sortedByIP =false; //client anzeige nach IP sortiert


//FARBEN für IQontrol und VIS
//die farbe für die tabellen in der vis wird im widget eingestellt
//color_vis_text_client_in_table
//color_vis_text_voucher_in_table
let color_iqontrol_text__client_letzteAenderung_VIS="lightblue";
let color_iqontrol_text__client_letzteAenderung_VIS_Text="#d0cdcd";
let color_iqontrol_text_client_in_table= "black";  
let color_iqontrol_text__client_disconnected="#01A9DB";

let color_iqontrol_client_gradient1= "lightblue";   

let color_iqontrol_text_voucher_in_table= "black"; 
let color_iqontrol_voucher_gradient1= "lightblue"; 
let color_iqontrol_text__client_letzteAenderung="#848484";
let color_iqontrol_text__voucher_ueberschrift="lightblue";

let schriftart="Helvetica";  //möglich: Helvetica,Serif


//-----------------AB HIER NICHTS MEHR ÄNDERN------------------------------------------------------

const versionNr = "19122019-3.2"
const dpPrefix = "javascript."+ instance +".";
// Hier Definition iqontrol-Style für Popup
const format = "<!DOCTYPE html><html lang=\"de\"><head><title>Voucher</title><meta http-equiv=\"content-type\" content=\"text/html; charset=utf-8\"></head><body><table style=\"color:"+color_iqontrol_text_voucher_in_table+";text-align:center; font-family:"+schriftart+";background-image: linear-gradient(42deg,transparent,"+color_iqontrol_voucher_gradient1+");\">";
const format2 = "<!DOCTYPE html><html lang=\"de\"><head><title>Clients</title><meta http-equiv=\"content-type\" content=\"text/html; charset=utf-8\"></head><body><table style=\"color:"+color_iqontrol_text_client_in_table+"; font-family:"+schriftart+";background-image: linear-gradient(42deg,transparent," +color_iqontrol_client_gradient1+");\">";
const format3 = "<table style=\"color:"+color_iqontrol_text__client_letzteAenderung_VIS_Text+"; font-family:"+schriftart+";\">";
const format6 ="<tr><td>&ensp;</td><td>&ensp;</td></tr> <tr style=\"color:"+color_iqontrol_text__voucher_ueberschrift+";\">"
const apHead = "<!DOCTYPE html><html lang=\"de\"><head><title>Voucher</title><meta http-equiv=\"content-type\" content=\"text/html; charset=utf-8\"></head><body>"
const apTable = "<table style=\"color:"+color_iqontrol_text_client_in_table+"; font-family:"+schriftart+";background-image: linear-gradient(42deg,transparent," +color_iqontrol_client_gradient1+");\">";
const tableAus = "</table>";



const request = require('request-promise-native').defaults({ rejectUnauthorized: false });

const pathVoucher = "/htmlvoucher.html"; const pathClient = "/htmlclients.html"; const pathInfo = "/htmlinfo.html"; const pathAlarm = "/htmlalarm.html"; const pathAbmelung = "/htmlLog.html";
const pathOnlyWLAN = "/htmlwlan.html";const pathOnlyLAN = "/htmllan.html";const pathOnlyDISC = "/htmldisc.html";
let cookies = [];
let loggedIn = false;
let debug = false;
let mylogs = false;
let syslogs = false;
let xxClientxx="Galaxy-S9"; // falls der name leerzeichen beinhaltet müssen diese mit _ ersetzt werden z.b : "liv in sky handy"  zu  "liv_in_sky_handy"
let xxClientxxIndex=0;
let clientPause = false;
let clientPauseVal;
let wifiDPs = [];
var wlanClientDB=[];

let wifiDPsHide = [];
let vouchiesDPs=[];
let myname = 'hostname';
let respv; let respc; let respw; let resph; let respgv; let respa; let respal; //geholte Daten
let countFalse=1; 
let statusarr=[];
let writeFileVar =0;
let listValue=[];            //iqontrol löschen kachel
let listValue2;              //iqontrol löschen kachel
let listValue3;              //iqontrol löschen VIS
let nichtSchalten=true;   
//let nichtSchalten2=false;    //iqontrol löschen kachel
let versuch;
let listeDatenpunkte = [];
let listeDatenpunkteControl=[];
let countie;
let binAmArbeiten=false;
var midnight=false;
let apListeTable;
let apListe;
let healthListe;
let healthListeTable;
let notSeen=[];
let ipArrFehlt=[];
var notseenLengthOld;
var notseenLength;
let lastChange=[];
let mybodyVouchers2; // create-one-click-standard-voucher
let expire_var; // create-one-click-standard-voucher
let n_var; // create-one-click-standard-voucher
let quota_var; // create-one-click-standard-voucher
let note_var; // create-one-click-standard-voucher
let up_var; // create-one-click-standard-voucher
let down_var; // create-one-click-standard-voucher
let MBytes_var; // create-one-click-standard-voucher
let testerral=false; let testerrc=false; let testerrl=false; let testerrv=false; let testerrs=false; let testerrh=false; let testerrcv=false; let testerrdv=false; let testerrws=false; let testerrap=false; 
var scriptCounter=0;
let health = true;  // Angaben zum Systemstatus - die Healtdaten werden nur alle 5 Abfragezyklen geholt
let alarmSwitch =false;
let alarmCounter =0;
let firstTime=0;
let mybodyVouchers;
let monthChangeData=false;
let checkNetwork=false;
var wifiLength=0;
      for(let wifi_name in wifis) {      
    wifiLength++; }


 if (aliasname)  myname="name";
 if (ohneClientAbfrage) anwesenheit=false;
 writeMyFile("neugestartet ... bitte warten", pathClient);
 writeMyFile("neugestartet ... bitte warten", pathVoucher);
 writeMyFile("neugestartet ... bitte warten", pathAlarm);
 writeMyFile("neugestartet ... bitte warten", pathInfo);
 writeMyFile("neugestartet ... bitte warten", pathOnlyWLAN);
 writeMyFile("neugestartet ... bitte warten", pathOnlyLAN);
 writeMyFile("neugestartet ... bitte warten", pathOnlyDISC);
 if ( !anwesenheit) {writeMyFile("variable anwesenheit und/oder iqontrol ist nicht im unifiscript aktiviert - auf true setzen", pathClient);
                     writeMyFile("variable anwesenheit und/oder iqontrol ist nicht im unifiscript aktiviert - auf true setzen", pathOnlyWLAN);
                     writeMyFile("variable anwesenheit und/oder iqontrol ist nicht im unifiscript aktiviert - auf true setzen", pathOnlyLAN);
                     writeMyFile("variable anwesenheit und/oder iqontrol ist nicht im unifiscript aktiviert - auf true setzen", pathOnlyDISC);}


 if ( !vouchers && !iqontrol) writeMyFile("variable vouchers und/oder iqontrol ist nicht im unifiscript aktiviert - auf true setzen", pathVoucher);

for(let wifi_name in wifis) {
     wifiDPsHide.push(dpPrefix + "WLANUnifi.WLANSSIDsHide." + wifis[wifi_name].name);
     createState(dpPrefix + "WLANUnifi.WLANSSIDsHide."+ wifi_name, false, { name: wifis[wifi_name].desc, role: 'switch', read: true, write: true, type: "boolean" });}

 //Erstelle Datenpunkte für die WLANs automatisch
 for(let wifi_name in wifis) {
     wifiDPs.push(dpPrefix + "WLANUnifi." + wifis[wifi_name].name);
     createState(dpPrefix + "WLANUnifi."+ wifi_name, { name: wifis[wifi_name].desc, role: 'switch', read: true, write: true, type: "boolean" });}

 createState(dpPrefix + "WLANUnifi.Wifi_Clients", "not available",{ name: 'Clients_HTML_Table_VIS',  role: 'string', read:  true,  write: true,});
 createState(dpPrefix + "WLANUnifi.Wifi_ClientsOnlyLAN", "not available",{ name: 'Clients_LAN_HTML_Table_VIS',  role: 'string', read:  true,  write: true,});
 createState(dpPrefix + "WLANUnifi.Wifi_ClientsOnlyWLAN", "not available",{ name: 'Clients__WLAN_HTML_Table_VIS',  role: 'string', read:  true,  write: true,});
 createState(dpPrefix + "WLANUnifi.Wifi_ClientsOnlyDISC", "not available",{ name: 'Clients__Disconnected_HTML_Table_VIS',  role: 'string', read:  true,  write: true,});
 createState(dpPrefix + "WLANUnifi.Wifi_Clients_Anzahl_LAN",  { name: 'Wifi_Clients_Anzahl_LAN', desc: 'Wifi_Clients_Anzahl_LAN', type: 'number',def:0, unit: '', min: '0', max: '100', role: '',read: true, write: false });
 createState(dpPrefix + "WLANUnifi.Wifi_Clients_Anzahl_WLAN",  { name: 'Wifi_Clients_Anzahl_WLAN', desc: 'Wifi_Clients_Anzahl_WLAN', type: 'number',def:0, unit: '', min: '0', max: '100', role: '',read: true, write: false });
 createState(dpPrefix + "WLANUnifi.Wifi_Clients_Anzahl_DISC",  { name: 'Wifi_Clients_Anzahl_DISC', desc: 'Wifi_Clients_Anzahl_DISC', type: 'number',def:0, unit: '', min: '0', max: '100', role: '',read: true, write: false });
 createState(dpPrefix + "WLANUnifi.SiteLED", false, { name: 'SiteLED',  type: 'boolean', role: 'switch', read:  true,  write: true,});
 createState(dpPrefix + "WLANUnifi.Client_WhiteList", "default", { name: 'Client_WhiteList_Filter_String', desc: 'Alarm_Table', type: 'string', unit: '',  role: '',read: true, write: true }); 
 createState(dpPrefix + "WLANUnifi.Alarm.Alarm", { name: 'Alarm_Table_not_archieved', desc: 'Alarm_Table', type: 'string', unit: '',  role: '',read: true, write: true }); 
 createState(dpPrefix + "WLANUnifi.Missing_Name", "not available", { name: 'Missing_Name', desc: 'Missing_Name', type: 'string', unit: '',  role: '',read: true, write: true }); 
 createState(dpPrefix + "WLANUnifi.Alarm.Alarm_Anzahl", { name: 'Alarm_Anzahl', desc: 'Alarm_Table', type: 'number', unit: '',  role: '',read: true, write: true });
 createState(dpPrefix + "WLANUnifi.ZyklusZaehler", 1, { name: 'ZyklusZaehler', desc: 'ZyklusZaehler', type: 'number', unit: '',  role: '',read: true, write: true });
 createState(dpPrefix + "WLANUnifi.xxxScriptVersionxxx", versionNr,{ name: 'ScriptVersion', desc: 'ScriptVersion', type: 'string', unit: '',  role: '',read: true, write: true });
 if (anwesenheit) createState(dpPrefix + "WLANUnifi.Wifi_Clients_Log", { name: 'Clients_HTML_Table_VIS_Log',  role: 'string', read:  true,  write: true,});

 var foo = (aliasname) ? true : false;
 createState(dpPrefix + "WLANUnifi.AliasName", foo,  { name: ' AliasName',  desc:  'schaltet Aliasnamen ein', role: 'switch', type: 'boolean', read:  true,  write: true,
            }  , function() {setStateDelayed(dpPrefix + "WLANUnifi.AliasName", foo, 200)});

 //createState(dpPrefix + "WLANUnifi.Aussortiert", { name: 'Aussortiert',  role: 'string', read:  true,  write: true,});


 if (vouchers) {
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers", { name: 'Vouchers_HTML_Table_VIS',  role: 'string', read:  true,  write: true,});
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers_List", { name: 'Vouchers_ID_List',  role: 'string', read:  true,  write: true,});
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers_CodeList", { name: 'Vouchers_Texte_Delete_VIS_Widget',  role: 'string', read:  true,  write: true,});
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers_CodeList2", { name: 'Vouchers_Werte_Delete_VIS_Widget',  role: 'string', read:  true,  write: true,});
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers_ValueCodeList", { name: 'Vouchers_ValueList_IQontrol', desc:"ValueCodeList", role: "", type:'number', states: "1:please wait ...;2:refresh webpage", def:1, min: 0, max: 20,  read:  true,  write: true,});
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Create", false,  { name: 'A_New_Voucher_Create',  role: 'switch', type: 'boolean', read:  true,  write: true,});
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers_DeleteVIS",   { name: 'Vouchers_Schalter_Delete_VIS_Widget',  role: 'switch', type: 'number', read:  true,  write: true,});
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers_CreateStandard", 1,  { name: 'Vouchers_Schalter_Create_VIS_Widget',  role: 'switch', type: 'number', read:  true,  write: true,});
  //createState(dpPrefix + "WLANUnifi.Wifi_Create_Standard_Voucher", false,  { name: 'A_Delete_Voucher',  role: 'switch', type: 'boolean', read:  true,  write: true,});
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_Delete_Voucher.Delete", false,  { name: 'Voucher_Delete__Botton_VIS',  role: 'switch', type: 'boolean', read:  true,  write: true,});
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_Delete_Voucher.Voucher_ID", "must be set",{ name: 'A_Delete_Voucher.Voucher_ID', role: 'string', read:  true,  write: true,});
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Dauer", "must be set",{ name: ' A_New_Voucher_Dauer',  role: 'string', read:  true,  write: true,});
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.MultiUse", "must be set",{ name: ' A_New_Voucher_MultiUse',  role: 'string', read:  true,  write: true,});
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Anzahl", "must be set",{ name: ' A_New_Voucher_Anzahl',  role: 'string', read:  true,  write: true,});
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Notiz", "",{ name: ' A_New_Voucher_Notiz',  role: 'string', read:  true,  write: true,});
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Upload", "",{ name: ' A_New_Voucher_Uplaod',  role: 'string', read:  true,  write: true,});
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Download", "",{ name: ' A_New_Voucher_Download',  role: 'string', read:  true,  write: true,});
  createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Mb_Begrenzung", "", { name: ' A_New_Voucher_Mb_Begrenzung',  role: 'string', read:  true,  write: true,});

for (var i = 1; i < 21; i++) { 
    var x=i.toString();
    if (i<10) x="0"+x;
   createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+x, { name: 'Unifi Voucher_Code'+x,  role: 'string', read:  true,  write: true, });
   createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+x+".code"+x, { name: 'Unifi Voucher_Code_code'+x,  role: 'string', read:  true,  write: true, });    
   createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+x+".erstellt", { name: 'Unifi Voucher_Code_erstellt'+x,  role: 'string', read:  true,  write: true, });
   createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+x+".dauer", { name: 'Unifi Voucher_Code_duration'+x,  role: 'string', read:  true,  write: true, });
   createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+x+".abgelaufen", { name: 'Unifi Voucher_Code_expires'+x,  role: 'string', read:  true, write: true, });
   createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+x+".id", { name: 'Unifi Voucher_Code_id'+x,  role: 'string', read:  true,  write: true, });
   createState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+x+".notiz", { name: 'Unifi Voucher_Code_notiz'+x,  role: 'string', read:  true,  write: true, });
}
    let vouchiesHelper=""  //Werteliste-Datenpunkt für StandardVouchies
    let vouchiesHelper2="Wähle Standard;"
    let vouchiesHelper3="1;"
     countie=0;
    for(let vouchies in standardVouchers){
        countie++
         vouchiesHelper2 = vouchiesHelper2  + vouchies  + " ("+standardVouchers[vouchies].notiz  +");"
         vouchiesHelper3 = vouchiesHelper3+(countie+1)+";"
         vouchiesHelper  = vouchiesHelper+countie + ":" + vouchies  + " (" +standardVouchers[vouchies].notiz  +");"
         vouchiesDPs.push(vouchies);
         }
          // + " " + "("+standardVouchers[vouchies].notiz+");"} 
       //  vouchiesHelper=vouchiesHelper.substr(0, vouchiesHelper.length-1);
    vouchiesHelper=vouchiesHelper + (countie+1)+":"+"Standard-Voucher-Auswahl";
    createState(dpPrefix + "WLANUnifi.Wifi_Vouchers_StandardList", { name: 'Vouchers_StandardList_IQontrol', desc:"Vouchers_StandardList", role: "", type:'number', states: vouchiesHelper, def:(countie+1), min: 0, max: 20,  read:  true,  write: true,});
    createState(dpPrefix + "WLANUnifi.Wifi_Vouchers_CreateList", { name: 'Vouchers_Texte_Create_VIS_Widget', desc:"Wifi_Vouchers_CreateList", role: "string", type:'string',   read:  true,  write: true},   function() {
        mylog("created"); setState(dpPrefix + "WLANUnifi.Wifi_Vouchers_CreateList",vouchiesHelper2)});
    createState(dpPrefix + "WLANUnifi.Wifi_Vouchers_CreateListStandard", { name: 'Vouchers_Werte_Create_VIS_Widget', desc:"Wifi_Vouchers_CreateList", role: "string", type:'string', read:  true,  write: true},   function() {
        mylog("created"); setState(dpPrefix + "WLANUnifi.Wifi_Vouchers_CreateListStandard",vouchiesHelper3)});
                                                                              
}
createState(dpPrefix + "WLANUnifi.Wifi_Client_Pause", false,  { name: 'Wifi_Client_Pause',  role: 'switch', type: 'boolean', read:  true,  write: true,}); 
createState(dpPrefix + "WLANUnifi.Wifi_Clients_Anzahl",  { name: 'Wifi_Clients_Anzahl', desc: 'Wifi_Clients_Anzahl', type: 'number',def:0, unit: '', min: '0', max: '100', role: '',read: true, write: false });
if (vouchers) createState(dpPrefix + "WLANUnifi.Wifi_Vouchers_Anzahl", { name: 'Wifi_Vouchers_Anzahl', desc: 'Wifi_Vouchers_Anzahl', type: 'number', unit: '', min: '0', max: '100', role: '',read: true, write: true });

createState(dpPrefix + "WLANUnifi.Wifi_Info", { name: 'Info_HTML_Table_VIS',  role: 'string', read:  true,  write: true,});
if (health) {createState(dpPrefix + "WLANUnifi.Health.WLAN.Status", { name: 'Health_Status', desc: 'Health_Status', type: 'string', unit: '',  role: '',read: true, write: true }); 
             createState(dpPrefix + "WLANUnifi.Health.WLAN.Users", { name: 'Health_Users', desc: 'Health_Users', type: 'number', unit: '', min: '0', max: '1000', role: '',read: true, write: true }); 
             createState(dpPrefix + "WLANUnifi.Health.WLAN.Guests", { name: 'Health_Guests', desc: 'Health_Guests', type: 'number', unit: '', min: '0', max: '100', role: '',read: true, write: true }); 
             createState(dpPrefix + "WLANUnifi.Health.WLAN.TXBytes", { name: 'Health_TXBytes', desc: 'Health_TXBytes', type: 'number', unit: '', min: '0', max: '9999999', role: '',read: true, write: true });
             createState(dpPrefix + "WLANUnifi.Health.WLAN.RXBytes", { name: 'Health_RXBytes', desc: 'Health_RXBytes', type: 'number', unit: '', min: '0', max: '9999999', role: '',read: true, write: true }); 
             createState(dpPrefix + "WLANUnifi.Health.WLAN.Adopted", { name: 'Health_Adopted', desc: 'Health_Adopted', type: 'number', unit: '', min: '0', max: '100', role: '',read: true, write: true });
             createState(dpPrefix + "WLANUnifi.Health.WLAN.Disabled", { name: 'Health_Disabled', desc: 'Health_Disabled', type: 'number', unit: '', min: '0', max: '100', role: '',read: true, write: true }); 
             createState(dpPrefix + "WLANUnifi.Health.WLAN.Disconnected", { name: 'Health_Disconnected', desc: 'Health_Disconnected', type: 'number', unit: '', min: '0', max: '100', role: '',read: true, write: true });   }
if (apInfo) {  
      for(let ap_name in apName) {
        createState(dpPrefix + "WLANUnifi.APInfo."+ apName[ap_name].aname, {name:  apName[ap_name].aname,role: 'state',read: true,write: true,type: "string" } );
        createState(dpPrefix + "WLANUnifi.APInfo."+ apName[ap_name].aname+".Model", {name: "Model",role: 'state',read: true,write: true,type: "string" } );
        createState(dpPrefix + "WLANUnifi.APInfo."+ apName[ap_name].aname+".IP_Adresse", {name:"IP_Adresse",role: 'state',read: true,write: true,type: "string" } );
        createState(dpPrefix + "WLANUnifi.APInfo."+ apName[ap_name].aname+".Satisfaction", {name:"Satisfaction",role: 'state',read: true,write: true,type: "number" } );
        createState(dpPrefix + "WLANUnifi.APInfo."+ apName[ap_name].aname+".LoadAVG1", {name:"Durchschnitt Wartezeit pro Min",role: 'state',read: true,write: true, type: "number" } );
        createState(dpPrefix + "WLANUnifi.APInfo."+ apName[ap_name].aname+".LoadAVG5", {name:"Durchschnitt Wartezeit pro 5Min",role: 'state',read: true,write: true, type: "number" } );
        createState(dpPrefix + "WLANUnifi.APInfo."+ apName[ap_name].aname+".LoadAVG15", {name:"Durchschnitt Wartezeit pro 15Min",role: 'state',read: true,write: true, type: "number" } );
        createState(dpPrefix + "WLANUnifi.APInfo."+ apName[ap_name].aname+".Adopted", {name:"Adopted",role: 'state',read: true,write: true,type: "boolean" } );
        createState(dpPrefix + "WLANUnifi.APInfo."+ apName[ap_name].aname+".ToController", {name:"ToController",role: 'state',read: true,write: true,type: "string" } );
        createState(dpPrefix + "WLANUnifi.APInfo."+ apName[ap_name].aname+".State", {name:"State",role: 'state',read: true,write: true,type: "boolean" } );} 
        createState(dpPrefix + "WLANUnifi.APInfo.SpeedTest.Xput-Download", "not available", {name:"SpeedTest_Xput_Download",role: 'state',read: true,write: true,type: "string" } );
        createState(dpPrefix + "WLANUnifi.APInfo.SpeedTest.Xput-Upload", "not available", {name:"SpeedTest_Xput_Upload",role: 'state',read: true,write: true,type: "string" } );
        createState(dpPrefix + "WLANUnifi.APInfo.SpeedTest.RunTime", "not available", {name:"SpeedTest_RunTime",role: 'state',read: true,write: true,type: "string" } );
        createState(dpPrefix + "WLANUnifi.APInfo.SpeedTest.RunTimeDate", "not available", {name:"SpeedTest_RunTimeDate",role: 'state',read: true,write: true,type: "string" } );
        createState(dpPrefix + "WLANUnifi.APInfo.SpeedTest.RunTimeOrginal", "not available", {name:"SpeedTest_RunTimeOrginal",role: 'state',read: true,write: true,type: "string" } );
        createState(dpPrefix + "WLANUnifi.APInfo.SpeedTest.Latency", "not available", {name:"SpeedTest_Latency",role: 'state',read: true,write: true,type: "number" } );
        createState(dpPrefix + "WLANUnifi.WWW-OnlineTest.Internet_Verbindung", false, {name:"Internet_Verbindung",role: 'state',read: true,write: true,type: "boolean" } );
        
        }

 if (apInfo) {

        createState(dpPrefix + "WLANUnifiHelp.WAN1TransferDaily.Uplink_RX", 0, {name:"Uplink_RX",role: 'state',unit: "GB", read: true,write: true, type: "number" } );
        createState(dpPrefix + "WLANUnifiHelp.WAN1TransferDaily.Uplink_TX", 0, {name:"Uplink_TX",role: 'state',unit: "GB", read: true,write: true, type: "number" } );        
        }       

 createState(dpPrefix + "WLANUnifiHelp.Others.WLANClientDP","" ,{name:  "WLANClientDP",role: 'state',read: true,write: true, type: "string" } );


function dlog(message) {
   if(debug)
       console.log(message);
}
function mylog(message) {
   if(mylogs)
       console.log(message);
}
function syslog(message) {
   if(syslogs)
       log(message,"error");
}


 //-----------------------------------------LOGIN---------------------------------------------------------------
async function login() {
   return new Promise(async (resolve, reject) => {
       cookies=[];
       let respl = await request.post({
           resolveWithFullResponse: true,
           url: unifi_controller + "/api/login",
           body: JSON.stringify({ username: unifi_username, password: unifi_password }),
           headers: { 'Content-Type': 'application/json' }
       }).catch((e) => { log("login: reject"), reject(e);  loggedIn =false;return respl=[];});
       
       if(respl != null) {
           mylog("login: login war erfolgreich! " + ((respl.headers && respl.headers.hasOwnProperty("set-cookie")) ? "Mit Cookies":"Ohne Cookies"));
           if(respl.headers && respl.headers.hasOwnProperty("set-cookie")) {
               let set_cookies = respl.headers["set-cookie"];
               for(i = 0; i < set_cookies.length; i++) {
                   let cookie = set_cookies[i];
                   //log(set_cookies[i]);
                   cookie = cookie.split(";")[0];
                   cookies.push(cookie);
               }
           } else {
               log("login: no cookies to set!")
           }
           loggedIn = true;
                 
           resolve();
       } else {
           log("login: rejected")
             loggedIn = false;
           reject("respl = null");
       }
   });
}

  //-----------------------------------------LOGOUT---------------------------------------------------------------  
async function logout() {
    log("BIN IN LOGOUT");
   return new Promise(async (resolve, reject) => {
       let respo = await request.get({
           url: unifi_controller + "/logout",
           headers: { Cookie: cookies.join("; ") }
       }).catch((e) => { log("logout fehler" + e)/*reject(e)*/ ;return testerrl=true;} );
       if (!testerrl) {
       if(respo != null) {
           log("Du bist nun ausgedloggt.");
           dlog(respo);
           log("BIN raus aus LOGOUT");
            loggedIn = true;          
           resolve();
          
       } else {
           reject("resp = null");
       }
       } else {log("reject weil resplogin ist 00"); log("BIN raus aus LOGOUT"); reject();}
       log("BIN raus aus LOGOUT");
   });
}
 //-----------------------------------------STATUS   WIFI  ---------------------------------------------------------
//Updatet status vom Wifi
//wifi: wifi object aus der konstanten wifis
 function getStatus(wifi) {
      mylog("BIN IN STATUS");
   return new Promise(async (resolve, reject) => {
       dlog("nur mal so");
       if (!loggedIn) await login().catch((e) => reject(e));
       let resp = await request.get({
           url: unifi_controller + "/api/s/"+siteName+"/rest/wlanconf/" + wifi.id,
           headers: { Cookie: cookies.join("; ") }
       }).catch((e) => { dlog("getStatus reject " + e); /*reject(e)*/ return testerrs=true; });
     if (!testerrs) {
       dlog("got response " + JSON.stringify(resp));
       resp = JSON.parse(resp);
 
       let wlanOn = resp.data[0].enabled;
       dlog("WLAN " + wifi.name + " ist: " + (wlanOn ? "an" : "aus"));
 
       if (resp != null && resp.meta && resp.meta.rc == "ok") {
           dlog("Status erfolgreich geholt!");
           dlog(resp);
           let wlanOn = resp.data[0].enabled;
           dlog("WLAN ist: " + (wlanOn ? "an" : "aus"));
           setStateDelayed(dpPrefix + "WLANUnifi." + wifi.name, wlanOn, 200);
        
           resolve(wlanOn);
       } else {
           log("nicht ok... getStatusWifi")
           reject(JSON.stringify(resp));
       }
       } else {mylog("reject weil respslogin ist 00"); mylog("BIN raus aus LOGOUT"); reject();}
       mylog("BIN aus STATUS raus");
   });
    
}

//-----------------------------------------GETCLIENTS---------------------------------------------------------------
async function getClients() {
     mylog("BIN IN getclients");
    
    return new Promise(async (resolve, reject) => {
        dlog("getclient nur mal so" + loggedIn);
       if(!loggedIn) await login().catch((e) => reject(e));
         respc = await request.get({
            url: unifi_controller + "/api/s/"+siteName+"/stat/sta",
            headers: { Cookie: cookies.join("; ") }
        }).catch((e) => { log("getStatus reject " + e); /*reject(e)*/ return testerrc=true; }); 
         
   if (!testerrc) {     
dlog("got respconse nach log in getclient " + JSON.stringify(respc));
dlog(typeof respc);
dlog("--------------------- " + respc);
//respc = JSON.stringify(testemal2);

//Sortierung Daten und Verwandlung Json
var unfiltered = [];
unfiltered = JSON.parse(respc).data;
dlog("bin da");
dlog(unfiltered[5][myname] + unfiltered[2].mac);
 versuch = [];
  let trash="";
  //let county=0


 //log("status 1");

     
    for (var blackie in blackList){                             //BLACKLIST aussortiert aber nur mit existierenden alias
             for(var index in unfiltered) {                              
                 if (unfiltered[index].hasOwnProperty("name")){
                     if (  unfiltered[index].name.indexOf(blackList[blackie]) == -1 ) {  
                         // log("anfang : "+ unfiltered[index].name.indexOf(blackList[blackie]) + " name : " + unfiltered[index].name);
                     }else { dlog( "Raus ist: " +unfiltered[index].name);
                             unfiltered.splice(index,1)  } }}}
//log("status 2");

for(var index in unfiltered) { 

    let device = unfiltered[index];
    mylog(device)
    let switchHelper3=0;
    mylog(unfiltered[index].hasOwnProperty(myname)+"-----IP---:"+unfiltered[index].ip+"---name---:"+unfiltered[index].hostname+"----alias---:"+unfiltered[index].name);
    mylog(unfiltered[index].ip)

     
    
    let fehlerName=false;
    if (!unfiltered[index].hasOwnProperty("ip") || unfiltered[index].ip == undefined ||unfiltered[index].ip == null || unfiltered[index].ip == "undefined") {switchHelper3=3;mylog("_____________________fehler")} 
    else{ 
          if (unfiltered[index].hasOwnProperty(myname) && device[myname] !== undefined && device[myname] !== null && device[myname] !== "") {switchHelper3=2;} else {fehlerName=true;}
          if (unfiltered[index].hasOwnProperty("name") && device.name !== undefined && device.name !== null  && device.name !== "") {switchHelper3=1;}} //Alias hat vorrang
    // log("status 3 case : "+switchHelper3);                                               
    switch (switchHelper3) {
           case 0:         // kein hostname und kein alias    
             device[myname]=unfiltered[index].ip.replace(/\./g,"-")+"--repaired";
             unfiltered[index].essid="<b>MISSING ALIAS</b>"
             versuch.push(device);
             trash = trash+"<tr><td>"+unfiltered[index].ip.replace(".","-")+"-missing: client alias in controller</td></tr>";
             mylog("ein fehler: -----------------"+device[myname])
             break;
           case 1:         // kein hostname
             device[myname]=unfiltered[index].name;
             if (device[myname].indexOf(".")>-1) { device[myname]=device[myname].replace(/\./g, "-");trash = trash+"<tr><td>"+device[myname]+" - hat Punkt im Alias !!!</td></tr>";unfiltered[index].essid="<b>PKT IM ALIAS</b>"} else{dlog(device[myname])}
             versuch.push(device);
             mylog("hat nur alias: -----------------"+device[myname])
             if ( fehlerName) trash = trash+"<tr><td>"+unfiltered[index].ip.replace(".","-")+"-missing: hostname</td></tr>";
             break;
           case 2:        // alles in ordnung mit client
          //   if (device[myname].indexOf(".")>-1) { device[myname]=device[myname].replace(/\./g, "-")+"---change-alias";trash = trash+device[myname]+" hat Punkt im Namen !!!"} else{dlog(device[myname])}
             versuch.push(device);
             mylog("ein richtiger: -----------------"+device[myname])
           break;   
           case 3:        //IP FEHLT - DANGER
             //versuch.push(device);
             //log("IP Adresse fehlt (Unifi Client): -----------------"+device[myname],"warn");
             if (unfiltered[index].hasOwnProperty("name")) {
                 if(unfiltered[index].name ==""){
                       unfiltered[index].ip="<b>IP Adresse fehlt-"+index+"</b>";
                       unfiltered[index].hostname=unfiltered[index].mac
                       versuch.push(device); 
                       trash = trash+"<tr><td>"+unfiltered[index].mac + " -- IP Adresse fehlt"+"</td></tr>";
                 }
                 
                 else{
                unfiltered[index].ip="<b>IP Adresse fehlt-"+index+"</b>";
                unfiltered[index].hostname=unfiltered[index].name;
                versuch.push(device);  
                trash = trash+"<tr><td>"+unfiltered[index].name + " -- IP Adresse fehlt"+"</td></tr>";} }
             else {
                 //trash = trash+"<tr><td>"+unfiltered[index].hostname + " IP Adresse fehlt"+"</td></tr>"
                unfiltered[index].ip="<b>IP Adresse fehlt-"+index+"</b>";
                unfiltered[index].hostname="Alias_fehlt-"+index;
                versuch.push(device);
                trash = trash+"<tr><td>Name-Alias und  IP Adresse fehlt"+"</td></tr>"}
           break;       
    }
//device[myname]=device[myname].replace(/\s/g,"_")

       }
//log("status 4");

mylog("trash -------------"+trash);
setState(dpPrefix + "WLANUnifi.Missing_Name", "<table>"+trash+"</table>");
if (!sortedByIP) {versuch.sort(function (alpha, beta) {
    if (alpha[myname].toLowerCase() < beta[myname].toLowerCase())
        return -1;
    if (alpha[myname].toLowerCase() > beta[myname].toLowerCase())
        return 1;
    return 0;
});}
else {
versuch.sort(function (alpha, beta) {
    if (alpha.ip.toLowerCase() < beta.ip.toLowerCase())
        return -1;
    if (alpha.ip.toLowerCase() > beta.ip.toLowerCase())
        return 1;
    return 0;
});}
//log("status 5");
resolve();
   } else {log("reject weil respc 00"); reject() } mylog("bin raus aus  getclients");
}); //new promise

} //getclientend
//-----------------------------------------workCLIENTS---------------------------------------------------------------
function workClients() {


     mylog("BIN IN workclients");
     dlog("got respconse versuch " + JSON.stringify(versuch));
     dlog(typeof respc);
     dlog("--------------------- " + respc);

    //let writeFile = true;
    let  writeFileVar = 0;
    let fileeWriteHelper=false;
    let writeClientTable = true;
    let writeAnwesenheit = true;
    var fileeWriteHelperOld;
    var anzahlClients = versuch.length;
    //setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Clients_Anzahl",anzahlClients,100);

    // überprüfe ob aliasname einen punkt enthält !!! ist in getclient !!!!
    /*if(aliasname) {for (var i = 0; i < versuch.length; i++)  {
        if (versuch[i][myname].indexOf(".")>-1) { versuch[i][myname]=versuch[i][myname].replace(/\./g, "-")+"---change-alias";log(versuch[i][myname])} else{dlog(versuch[i][myname])}
    }}*/

    //var clientListe = "";
    var clientListeArray=[];
    var clientListeArrayWLAN=[];
    var clientListeArrayLAN=[];
    var clientListeArrayDISC=[];
     wlanClientDB=[];
     let wlanClientDBhelp= getState(dpPrefix + "WLANUnifiHelp.Others.WLANClientDP").val;
     //log("+++++++++++"+getState(dpPrefix + "WLANUnifiHelp.Others.WLANClientDP").val);
        wlanClientDB=wlanClientDBhelp.split(",");

         getExistingClients();

           //für zugehörigkeit netzwerk
           for (var z = 0; z < listeDatenpunkte.length; z++)  {
                   for (var checkyConn in checkConnType ) {
                       if( checkConnType[checkyConn]==listeDatenpunkte[z] ) {dlog(listeDatenpunkte[z]+checkConnType[checkyConn]);
                            checkNetwork=true;
                            createState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+listeDatenpunkte[z], { name: checkConnType[checkyConn]+'_Netwok',  type: 'string',  role: '',read: true, write: true }); }}}
  

    mylog("Status1");

    var listeDatenpunkteNew=[];                                                        //erstelle aktuelles array von controller daten
    //log(versuch.length.toString())
    for (var i = 0; i < versuch.length; i++) { 
                     
                                         // hier name des zu überwachenden clients                          
               // listeDatenpunkteNew[i] = versuch[i][myname];
                listeDatenpunkteNew.push(versuch[i][myname]);
              //  log(i.toString()+listeDatenpunkteNew[i]+ versuch[i][myname])
                if(syslogs && listeDatenpunkteNew[i]==xxClientxx) {xxClientxxIndex=i;syslog("__client hat Indexnummer: "+ i + " Gesamtanzahl Cliens: "+listeDatenpunkteNew.length.toString());} 
                if( versuch[i].hasOwnProperty("_last_seen_by_uap") && !wlanClientDB.includes(versuch[i][myname]))  { 
                    dlog("write"+versuch[i][myname]);
                     wlanClientDB.push(versuch[i][myname]); }
                
          }
         // log("____"+wlanClientDB.toString());
          setState(dpPrefix + "WLANUnifiHelp.Others.WLANClientDP", wlanClientDB.toString());
    dlog (listeDatenpunkteNew[22]);
      //syslog("___Anzahl Clients: "+listeDatenpunkteNew.length.toString());
     // log("+++++++++++"+getState(dpPrefix + "WLANUnifiHelp.Others.WLANClientDP").val);

    if (true) {
    // sind clients von controller in verzeichnisliste ? 
    for (var z = 0; z < listeDatenpunkteNew.length; z++) {
            if ( listeDatenpunkte.indexOf(listeDatenpunkteNew[z]) == -1 ){   //ist controller-client existent nicht in verzeichnis-list
                   mylog("Datenpunktanlegen" + listeDatenpunkteNew[z] +"index:"+ listeDatenpunkte.indexOf(listeDatenpunkteNew[z]).toString());
                   var ipWandler= versuch[z].ip;
                   var data = dpPrefix + "WLANUnifi.Wifi_Client_States."+listeDatenpunkteNew[z];
                   createState(data, true, {name: ipWandler,  role: 'boolean',read:  true,  write: true, }, function() {mylog("created"); });
                   //setState(dpPrefix + "WLANUnifi.Wifi_Client_States."+ versuch[z][myname], true);
                   fileeWriteHelper=true;
                   mylog("Datenpunktanlegen fertig" + listeDatenpunkteNew[z] + listeDatenpunkte[z]) ;
                   
             }
  
                                                                                                                                     
        }
    mylog("Status2");
     }
    //sind datenpunkte noch in controller vorhanden
    if (anwesenheit) {
     
     dlog("checknetwork: "+checkNetwork.toString());

      notSeen=[];
      countFalse++; mylog("------------countFalse: "+countFalse.toString());
      for (var z = 0; z < listeDatenpunkte.length; z++)  {
               
            if ( listeDatenpunkteNew.indexOf(listeDatenpunkte[z]) == -1 ){        //ist datenpunkt-verzeihnis existent und nicht in controller liste
                 notSeen.push(listeDatenpunkte[z]); mylog(listeDatenpunkte[z]);            //array der notSeen datenpunkte sind nicht im controller
                 if(!problemWLAN && countFalse==countFalseSetting ) {
                      if (getState(dpPrefix + "WLANUnifi.Wifi_Client_States."+listeDatenpunkte[z]).val) {           // setze datenpunkt auf false - nur wenn true war
                          //log("bin davor1"+listeDatenpunkte[z])
                          setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Client_States."+listeDatenpunkte[z], false, 200);
                         // if (checkNetwork){ for (var checkyConn in checkConnType ) { if( checkConnType[checkyConn]==versuch[z][myname] ) setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+versuch[z][myname],"noConn"); }}
                          if (checkNetwork){ for (var checkyConn in checkConnType ) { if( checkConnType[checkyConn]==listeDatenpunkte[z] ) {setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+listeDatenpunkte[z],"noConn");dlog("setzte Datenpunkt auf false");} }}
                          fileeWriteHelper=true;
                          countFalse=0;
                          if(syslogs && listeDatenpunkte[z]==xxClientxx){syslog("_______________________________________Datenpunkt ist falsch zu setzen (normalWLAN) - da nicht mehr in Daten "+listeDatenpunkte[z]);}
                         // syslog("Datenpunkt ist falsch zu setzen - da nicht mehr in Daten "+listeDatenpunkte[z]);
                         } //else{  if (checkNetwork){ for (var checkyConn in checkConnType ) {
                            //if( checkConnType[checkyConn]==listeDatenpunkte[z] ) {setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+listeDatenpunkte[z],"noConn");dlog("setzte Datenpunkt auf false");} }}}
                          }//}
                if(problemWLAN && countFalse==countFalseSetting+1 ) {
                      if (getState(dpPrefix + "WLANUnifi.Wifi_Client_States."+listeDatenpunkte[z]).val) {          // setze datenpunkt auf false - nur wenn true war
                          mylog("bin davor2" +listeDatenpunkte[z])
                          setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Client_States."+listeDatenpunkte[z], false, 200);
                          if (checkNetwork){ for (var checkyConn in checkConnType ) { if( checkConnType[checkyConn]==listeDatenpunkte[z] ) {setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+listeDatenpunkte[z],"noConn");dlog("setzte Datenpunkt auf false");} }}
                          fileeWriteHelper=true;
                          countFalse=0;
                         // syslog("Datenpunkt ist falsch zu setzen - da nicht mehr in daten"+listeDatenpunkte[z]);
                          if(syslogs && listeDatenpunkte[z]==xxClientxx){syslog("_______________________________________Datenpunkt ist falsch zu setzen (problemWLAN) - da nicht mehr in daten "+listeDatenpunkte[z]);}
                          } //else{  if (checkNetwork){ for (var checkyConn in checkConnType ) {
                              //if( checkConnType[checkyConn]==listeDatenpunkte[z] ) {setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+listeDatenpunkte[z],"noConn");dlog("setzte Datenpunkt auf false");} }} }
                          } //}               
               //} else {dlog("ist noch im controller" + listeDatenpunkte[z]);    }
                //if (checkNetwork){ for (var checkyConn in checkConnType ) { if( checkConnType[checkyConn]==listeDatenpunkte[z] ) {setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+listeDatenpunkte[z],"noConn");dlog("setzte Datenpunkt auf false");} }}


            } //ende if  DP nicht in neuer liste      
            
        } //for liste datenpunkt ende
  } //anwesenheit ende

   if (!problemWLAN && countFalse==countFalseSetting ) countFalse=0;
   if (problemWLAN && countFalse==countFalseSetting+1 ) countFalse=0;
   notseenLengthOld=notseenLength;  // ist für writefile wenn datenpunkte schon falsch sind
   notseenLength=notSeen.length;
   if (notseenLength!=notseenLengthOld) fileeWriteHelper=true;


  //sind datenpunkte nicht in controller vorhanden
   mylog("Status3"); 

   // setze datenpunkte nach last_seen_by_uap - ausnahme: controller-clients sind nicht mehr connectet aber in vereichnis 

   let lastChangeList;
   if (anwesenheit) {
    var timeout = setTimeout(function () {  //wegen createstate und zu schnelles setstate

         let caseHelper=0;
        
         for (var z = 0; z < listeDatenpunkteNew.length; z++)  {
             
           if(versuch[z].hasOwnProperty("last_seen")) caseHelper=1;
           if(versuch[z].hasOwnProperty("_last_seen_by_ugw") && versuch[z].hasOwnProperty("gw_mac") ) caseHelper=2;
           if(versuch[z].hasOwnProperty("_last_seen_by_usw") && versuch[z].hasOwnProperty("sw_mac") ) caseHelper=3;
           if(versuch[z].hasOwnProperty("_last_seen_by_uap") && versuch[z].hasOwnProperty("ap_mac") ) caseHelper=4;
           if(!versuch[z].hasOwnProperty("_last_seen_by_uap") && wlanClientDB.includes(versuch[z][myname])) caseHelper=5;


        
           if (listeDatenpunkteNew[z]==xxClientxx && syslogs) syslog("____Client hat Case : "+caseHelper);              //Fehlersuche
           
           let tester;

           //log(caseHelper.toString());
           switch (caseHelper) {
                case 1:  /*________________________------------------------------------_____CASE1*/
                                 dlog(caseHelper.toString());
                  tester = parseInt((new Date().getTime())) - (versuch[z].last_seen*1000);
                   
            
            dlog(tester.toString() + "laenge : " +listeDatenpunkteNew.length);
            if (parseInt((new Date().getTime())) - (versuch[z].last_seen*1000) > abfragezyklus+abfageoffset && getState(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname]).val) {
               setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname], false, 100); fileeWriteHelper=true;
               mylog("abgesetzt: " +listeDatenpunkteNew[z] + " um " +formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss") + " Uhr");
               if(syslogs && listeDatenpunkteNew[z]==xxClientxx){syslog("_______________________________________Datenpunkt false über lastSeen - zeit: "+tester);}
               mylog(tester.toString());
               if (lastChange.length>=10) lastChange.shift()
               lastChange.push("<tr><td>"+listeDatenpunkteNew[z]+"&ensp;&ensp;</td><td>"+formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss")+"&ensp;&ensp;&ensp;&ensp;</td><td>out</td><td>&ensp;&ensp;vor: "+tester/1000+" Sek</td></tr>");
               mylog(lastChange[0]);
     
              }
              if (!wlanClientDB.includes(versuch[z][myname])) {
            if (parseFloat((new Date().getTime())) - (versuch[z].last_seen*1000) < abfragezyklus && !getState(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname]).val || getState(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname]).val ==null ) {
              setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname], true, 100);fileeWriteHelper=true;
              if(syslogs && listeDatenpunkteNew[z]==xxClientxx){syslog("_______________________________________Datenpunkt true über lastSeen - zeit: "+tester);}
              mylog("gesetzt" +listeDatenpunkteNew[z]+" " +formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss") + " Uhr");
              if (lastChange.length>=10) lastChange.shift()
              lastChange.push("<tr><td>"+listeDatenpunkteNew[z]+"&ensp;&ensp;</td><td>"+formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss")+"&ensp;&ensp;&ensp;&ensp;</td><td>in</td><td>&ensp;&ensp;vor: " + tester/1000+" Sek</td></tr>");
              }}
                  break;  /*________________________------------------------------------_____CASE1*/
                case 2:  /*________________________------------------------------------_____CASE2*/
                                  dlog(caseHelper.toString());
                  tester = parseInt((new Date().getTime())) - (versuch[z]._last_seen_by_ugw*1000);
                 
                 
            dlog(tester.toString() + "laenge : " +listeDatenpunkteNew.length);
            if (parseInt((new Date().getTime())) - (versuch[z]._last_seen_by_ugw*1000) > abfragezyklus+abfageoffset && getState(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname]).val) {
               setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname], false, 100);fileeWriteHelper=true;
               if(syslogs && listeDatenpunkteNew[z]==xxClientxx){syslog("_______________________________________Datenpunkt false über lastSeen ugw - zeit: "+tester);}
               mylog("abgesetzt: " +listeDatenpunkteNew[z] + " um " +formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss") + " Uhr");
               mylog(tester.toString());
               if (lastChange.length>=10) lastChange.shift()
               lastChange.push("<tr><td>"+listeDatenpunkteNew[z]+"&ensp;&ensp;</td><td>"+formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss")+"&ensp;&ensp;&ensp;&ensp;</td><td>out</td><td>&ensp;&ensp;vor: "+tester/1000+" Sek</td></tr>");
               mylog(lastChange[0]);
     
              }
               if (!wlanClientDB.includes(versuch[z][myname])) {    // log("---------------------"+versuch[z][myname]+" datenbank :" +wlanClientDB);
            if (parseFloat((new Date().getTime())) - (versuch[z]._last_seen_by_ugw*1000) < abfragezyklus && !getState(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname]).val || getState(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname]).val ==null ) {
              setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname], true, 100);fileeWriteHelper=true;
              if(syslogs && listeDatenpunkteNew[z]==xxClientxx){syslog("_______________________________________Datenpunkt true über lastSeen ugw - zeit: "+tester);}
              mylog("gesetzt" +listeDatenpunkteNew[z]+" " +formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss") + " Uhr");
              if (lastChange.length>=10) lastChange.shift()
              lastChange.push("<tr><td>"+listeDatenpunkteNew[z]+"&ensp;&ensp;</td><td>"+formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss")+"&ensp;&ensp;&ensp;&ensp;</td><td>in</td><td>&ensp;&ensp;vor: " + tester/1000+" Sek</td></tr>");
              }}
                  break; /*________________________------------------------------------_____CASE2*/
                case 3:  /*________________________------------------------------------_____CASE3*/
                 dlog(caseHelper.toString());
                  tester = parseInt((new Date().getTime())) - (versuch[z]._last_seen_by_usw*1000);
            
                   
            dlog(tester.toString() + "laenge : " +listeDatenpunkteNew.length);
            if (parseInt((new Date().getTime())) - (versuch[z]._last_seen_by_usw*1000) > abfragezyklus+abfageoffset && getState(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname]).val) {
               setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname], false, 100);fileeWriteHelper=true;
               if(syslogs && listeDatenpunkteNew[z]==xxClientxx){syslog("_______________________________________Datenpunkt false über lastSeen usw - zeit: "+tester);}
               mylog("abgesetzt: " +listeDatenpunkteNew[z] + " um " +formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss") + " Uhr");
               mylog(tester.toString());
               if (lastChange.length>=10) lastChange.shift()
               lastChange.push("<tr><td>"+listeDatenpunkteNew[z]+"&ensp;&ensp;</td><td>"+formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss")+"&ensp;&ensp;&ensp;&ensp;</td><td>out</td><td>&ensp;&ensp;vor: "+tester/1000+" Sek</td></tr>");
               mylog(lastChange[0]);
     
              }
              if (!wlanClientDB.includes(versuch[z][myname])) {   
            if (parseFloat((new Date().getTime())) - (versuch[z]._last_seen_by_usw*1000) < abfragezyklus && !getState(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname]).val || getState(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname]).val ==null ) {
              setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname], true, 100);fileeWriteHelper=true;
              if(syslogs && listeDatenpunkteNew[z]==xxClientxx){syslog("_______________________________________Datenpunkt true über lastSeen usw - zeit: "+tester);}
              mylog("gesetzt" +listeDatenpunkteNew[z]+" " +formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss") + " Uhr");
              if (lastChange.length>=10) lastChange.shift()
              lastChange.push("<tr><td>"+listeDatenpunkteNew[z]+"&ensp;&ensp;</td><td>"+formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss")+"&ensp;&ensp;&ensp;&ensp;</td><td>in</td><td>&ensp;&ensp;vor: " + tester/1000+" Sek</td></tr>");
              }}
                  break;/*________________________------------------------------------_____CASE3*/
                case 4:  /*________________________------------------------------------_____CASE4*/
                 dlog(caseHelper.toString());
                  tester = parseInt((new Date().getTime())) - (versuch[z]._last_seen_by_uap*1000);
                 if(listeDatenpunkteNew[z]==xxClientxx && syslogs){syslog("___________________________LAST_SEEN-BY_UAP: "+versuch[z]._last_seen_by_uap+" Time: "+formatDate(getDateObject(parseFloat(versuch[z]._last_seen_by_uap)*1000), "SS:mm:ss")+ " Jetzt: "+formatDate(getDateObject((parseFloat(new Date().getTime()))), "SS:mm:ss"));}
            dlog(tester.toString() + "laenge : " +listeDatenpunkteNew.length);
            if (parseInt((new Date().getTime())) - (versuch[z]._last_seen_by_uap*1000) > abfragezyklus+abfageoffset && getState(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname]).val) {
               setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname], false, 100);fileeWriteHelper=true;
              // if (checkNetwork){ for (var checkyConn in checkConnType ) { if( checkConnType[checkyConn]==versuch[i][myname] ) setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+versuch[i][myname],"noConn"); }}
               if(syslogs && listeDatenpunkteNew[z]==xxClientxx){syslog("_______________________________________Datenpunkt false über lastSeen uap - zeit: "+tester);}
               mylog("abgesetzt: " +listeDatenpunkteNew[z] + " um " +formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss") + " Uhr");
               mylog(tester.toString());
               if (lastChange.length>=10) lastChange.shift()
               lastChange.push("<tr><td>"+listeDatenpunkteNew[z]+"&ensp;&ensp;</td><td>"+formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss")+"&ensp;&ensp;&ensp;&ensp;</td><td>out</td><td>&ensp;&ensp;vor: "+tester/1000+" Sek</td></tr>");
               mylog(lastChange[0]);
     
              }
            if (parseFloat((new Date().getTime())) - (versuch[z]._last_seen_by_uap*1000) < abfragezyklus && !getState(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname]).val || getState(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname]).val ==null ) {
              setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname], true, 100);fileeWriteHelper=true;
              if(syslogs && listeDatenpunkteNew[z]==xxClientxx){syslog("_______________________________________Datenpunkt true über lastSeen uap - zeit: "+tester);}
              mylog("gesetzt" +listeDatenpunkteNew[z]+" " +formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss") + " Uhr");
              if (lastChange.length>=10) lastChange.shift()
              lastChange.push("<tr><td>"+listeDatenpunkteNew[z]+"&ensp;&ensp;</td><td>"+formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss")+"&ensp;&ensp;&ensp;&ensp;</td><td>in</td><td>&ensp;&ensp;vor: " + tester/1000+" Sek</td></tr>");
              }
                  break;  /*________________________------------------------------------_____CASE4*/
           
           case 5: //Sonderfall unifi bug
            if(getState(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname]).val) {
               setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Client_States."+versuch[z][myname], false, 100);fileeWriteHelper=true;
               if(syslogs && listeDatenpunkteNew[z]==xxClientxx){syslog("_______________________________________Datenpunkt false über sonderfall case 5 - zeit: ");}
               //mylog("abgesetzt: " +listeDatenpunkteNew[z] + " um " +formatDate(getDateObject((parseFloat((new Date().getTime())) - tester)), "SS:mm:ss") + " Uhr");
               
               if (lastChange.length>=10) lastChange.shift()
               lastChange.push("<tr><td>"+listeDatenpunkteNew[z]+"&ensp;&ensp;</td><td>"+"Sonderfall"+"&ensp;&ensp;&ensp;&ensp;</td><td>out</td><td>&ensp;&ensp;vor: "+"UnifiBug"+" Sek</td></tr>");
               mylog(lastChange[0]);
           }
                         

           break;
           } //case

         }

 

mylog("Status4");
// erstelle htmlclientliste  
     
      for (var i = 0; i < versuch.length; i++)  {

           if(versuch[i].hasOwnProperty("last_seen")) caseHelper=1;
           if(versuch[i].hasOwnProperty("_last_seen_by_ugw") && versuch[i].hasOwnProperty("gw_mac") ) caseHelper=2;
           if(versuch[i].hasOwnProperty("_last_seen_by_usw") && versuch[i].hasOwnProperty("sw_mac") ) caseHelper=3;
           if(versuch[i].hasOwnProperty("_last_seen_by_uap") && versuch[i].hasOwnProperty("ap_mac") ) caseHelper=4;
           if(!versuch[i].hasOwnProperty("_last_seen_by_uap") && wlanClientDB.includes(versuch[i][myname])) caseHelper=5;
           //log(caseHelper.toString());
        if (versuch[i][myname]==xxClientxx && syslogs) syslog("__________________________Client hat Case bei listen-schreiben: "+caseHelper);              //Fehlersuche
           switch (caseHelper) {
                case 1:
                        if (checkNetwork && anwesenheit){ for (var checkyConn in checkConnType ) { if( checkConnType[checkyConn]==versuch[i][myname] )    //prüfung network connection
                            {dlog(versuch[i]+checkConnType[checkyConn]);setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+versuch[i][myname],"noConn");}}}  
                                                    if  (parseInt((new Date().getTime())) - (versuch[i].last_seen*1000) < abfragezyklus+abfageoffset) {  
                       for(let device_name in apName) {                            //Abfrage welcher AP
                         dlog(versuch[i].ap_mac +" - " + device_name +" - " + apName[device_name].aname); 
                         if (versuch[i].sw_mac==device_name) var apTransfer = apName[device_name].aname}; 
                         if (versuch[i][myname]==xxClientxx && syslogs) syslog("______________________________Client ist angemeldet : "+apTransfer +" mit: " + versuch[i].sw_mac);              //Fehlersuche
                         if (checkNetwork && anwesenheit){ for (var checkyConn in checkConnType ) { if( checkConnType[checkyConn]==versuch[i][myname] && !wlanClientDB.includes(versuch[i][myname]) ) 
                            {dlog(versuch[i]+checkConnType[checkyConn]);setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+versuch[i][myname],apTransfer);}}}

                        // clientListe = clientListe.concat("<tr><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>"+apTransfer+"</td></tr>");
                         clientListeArray.push("<tr><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>"+apTransfer+"</td></tr>");
                         clientListeArrayLAN.push("<tr><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>"+apTransfer+"</td></tr>");
                        ;} 
                  else {anzahlClients=anzahlClients-1; //clientListe = clientListe.concat("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>noConn</td></tr>");
               //  if (checkNetwork && anwesenheit){ for (var checkyConn in checkConnType ) { if( checkConnType[checkyConn]==versuch[i][myname] )    //prüfung network connection
                 //           {dlog(versuch[i]+checkConnType[checkyConn]);setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+versuch[i][myname],"noConn");}}}                       
                        clientListeArray.push("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>noConn</td></tr>");
                        clientListeArrayLAN.push("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>noConn</td></tr>");}
         
                  break;
                case 2:
                        if (checkNetwork && anwesenheit){ for (var checkyConn in checkConnType ) { if( checkConnType[checkyConn]==versuch[i][myname] )    //prüfung network connection
                            {dlog(versuch[i]+checkConnType[checkyConn]);setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+versuch[i][myname],"noConn");}}}                 
                                   if  (parseInt((new Date().getTime())) - (versuch[i]._last_seen_by_ugw*1000) < abfragezyklus+abfageoffset) {  
                       for(let device_name in apName) {                            //Abfrage welcher AP
                         dlog(versuch[i].ap_mac +" - " + device_name +" - " + apName[device_name].aname); 
                         if (versuch[i].gw_mac==device_name) var apTransfer = apName[device_name].aname}; 
                         if (versuch[i][myname]==xxClientxx && syslogs) syslog("______________________________Client ist angemeldet : "+apTransfer +" mit: " + versuch[i].gw_mac);              //Fehlersuche                   
                        // clientListe = clientListe.concat("<tr><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>"+apTransfer+"</td></tr>");
                        clientListeArray.push("<tr><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>"+apTransfer+"</td></tr>");
                        clientListeArrayLAN.push("<tr><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>"+apTransfer+"</td></tr>");
                        ;} 
                  else {anzahlClients=anzahlClients-1; //clientListe = clientListe.concat("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>noConn</td></tr>");
              //   if (checkNetwork && anwesenheit){ for (var checkyConn in checkConnType ) { if( checkConnType[checkyConn]==versuch[i][myname] )    //prüfung network connection
                //            {dlog(versuch[i]+checkConnType[checkyConn]);setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+versuch[i][myname],"noConn");}}}                  
                  clientListeArray.push("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>noConn</td></tr>");
                  clientListeArrayLAN.push("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>noConn</td></tr>");}
         
                  break;
                case 3:
                  dlog(versuch[i][myname] + " --- " + versuch[i].essid + " --- " + versuch[i].ip);
                  if (checkNetwork && anwesenheit){ for (var checkyConn in checkConnType ) { if( checkConnType[checkyConn]==versuch[i][myname] )    //prüfung network connection
                            {dlog(versuch[i]+checkConnType[checkyConn]);setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+versuch[i][myname],"noConn");}}}  
                  if  (parseInt((new Date().getTime())) - (versuch[i]._last_seen_by_usw*1000) < abfragezyklus+abfageoffset) {  
                       for(let device_name in apName) {                            //Abfrage welcher AP
                         dlog(versuch[i].ap_mac +" - " + device_name +" - " + apName[device_name].aname); 
                         if (versuch[i].sw_mac==device_name) var apTransfer = apName[device_name].aname};   
                         if (versuch[i][myname]==xxClientxx && syslogs) syslog("______________________________Client ist angemeldet : "+apTransfer +" mit: " + versuch[i].sw_mac);              //Fehlersuche                 
                        // clientListe = clientListe.concat("<tr><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>"+apTransfer+"</td></tr>");
                         clientListeArray.push("<tr><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>"+apTransfer+"</td></tr>");
                         clientListeArrayLAN.push("<tr><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>"+apTransfer+"</td></tr>");
                         ;} 
                  else {anzahlClients=anzahlClients-1; //clientListe = clientListe.concat("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>noConn</td></tr>");
                  //if (checkNetwork && anwesenheit){ for (var checkyConn in checkConnType ) { if( checkConnType[checkyConn]==versuch[i][myname] )    //prüfung network connection
                    //        {dlog(versuch[i]+checkConnType[checkyConn]);setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+versuch[i][myname],"noConn");}}}                 
                  clientListeArray.push("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>noConn</td></tr>");
                  clientListeArrayLAN.push("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+versuch[i][myname]+"&ensp;</td><td>LAN&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>noConn</td></tr>");}
         
              
                  dlog("------------------ist nicht war");
                  break;
                case 4:
                 dlog("------------------uap ist war");
             
          

               dlog(versuch[i][myname] + " --- " + versuch[i].essid + " --- " + versuch[i].ip);
               if  (parseInt((new Date().getTime())) - (versuch[i]._last_seen_by_uap*1000) < abfragezyklus+abfageoffset) {  
                   
                    for(let device_name in apName) {                            //Abfrage welcher AP
                      dlog(versuch[i].ap_mac +" - " + device_name +" - " + apName[device_name].aname); 
                      if (versuch[i].ap_mac==device_name) var apTransfer = apName[device_name].aname};  
                      if (versuch[i][myname]==xxClientxx && syslogs) syslog("______________________________Client :"+versuch[i][myname]+ " ist angemeldet "+apTransfer +" mit: " + versuch[i].ap_mac);              //Fehlersuche
                      if (checkNetwork && anwesenheit){ for (var checkyConn in checkConnType ) { if( checkConnType[checkyConn]==versuch[i][myname] )                                        //prüfung network connection
                            { fileeWriteHelperOld=getState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+versuch[i][myname]).val;setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+versuch[i][myname],apTransfer);}}}
                  
                      //clientListe = clientListe.concat("<tr><td>"+versuch[i][myname]+"&ensp;</td><td>"+versuch[i].essid+"&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>"+apTransfer+"</td></tr>");
                      clientListeArray.push("<tr><td>"+versuch[i][myname]+"&ensp;</td><td>"+versuch[i].essid+"&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>"+apTransfer+"</td></tr>");
                      clientListeArrayWLAN.push("<tr><td>"+versuch[i][myname]+"&ensp;</td><td>"+versuch[i].essid+"&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>"+apTransfer+"</td></tr>");
                      ;} 
                 else {anzahlClients=anzahlClients-1; //clientListe = clientListe.concat("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+versuch[i][myname]+"&ensp;</td><td>"+versuch[i].essid+"&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>noConn</td></tr>");
                 if (checkNetwork && anwesenheit){ for (var checkyConn in checkConnType ) { if( checkConnType[checkyConn]==versuch[i][myname] )    //prüfung network connection
                 if (versuch[i][myname]==xxClientxx && syslogs) syslog("______________________________Client ist angemeldet : "+"" +" mit: " +""); 
                            { fileeWriteHelperOld=getState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+versuch[i][myname]).val;setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+versuch[i][myname],"noConn");}}}
                  
                 clientListeArray.push("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+versuch[i][myname]+"&ensp;</td><td>"+versuch[i].essid+"&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>noConn</td></tr>");
                 clientListeArrayWLAN.push("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+versuch[i][myname]+"&ensp;</td><td>"+versuch[i].essid+"&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>noConn</td></tr>");}
                 if (fileeWriteHelperOld!=apTransfer)fileeWriteHelper=true;
                  break;

                  case 5:  //Sonderfall unifi bug
                    anzahlClients=anzahlClients-1;
                    if (checkNetwork && anwesenheit){ for (var checkyConn in checkConnType ) { if( checkConnType[checkyConn]==versuch[i][myname] && getState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+versuch[i][myname]).val != "noConn" )    //prüfung network connection
                            { fileeWriteHelperOld=getState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+versuch[i][myname]).val;setState(dpPrefix + "WLANUnifi.Wifi_Client_Network."+versuch[i][myname],"noConn");}}}
                    clientListeArray.push("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+versuch[i][myname]+"&ensp;</td><td>"+"no SSID"+"&ensp;&ensp;&ensp;&ensp;</td><td>"+"no IP"+"&ensp;&ensp;</td><td>noConn</td></tr>");
                 clientListeArrayWLAN.push("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+versuch[i][myname]+"&ensp;</td><td>"+"no SSID"+"&ensp;&ensp;&ensp;&ensp;</td><td>"+versuch[i].ip+"&ensp;&ensp;</td><td>noConn</td></tr>");
                  if (fileeWriteHelperOld!=apTransfer)fileeWriteHelper=true;

           break;
           } //case
        
           
        } //for
        checkNetwork=false;  

      setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Clients_Anzahl",anzahlClients,100);   //korrigiert
     
       

       for (var h =0; h<notSeen.length;h++){    
              if (notSeen.indexOf(versuch[i]) == -1 ) 
              //clientListe = clientListe.concat("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+notSeen[h]+
              //"&ensp;</td><td>noConn&ensp;&ensp;&ensp;&ensp;</td><td>noConn&ensp;&ensp;</td><td>noConn</td></tr>");
              if (disConClientsFirst) {
              clientListeArray.unshift("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+notSeen[h]+
              "&ensp;</td><td>noConn&ensp;&ensp;&ensp;&ensp;</td><td>noConn&ensp;&ensp;</td><td>noConn</td></tr>");    
              } 
              else{
              clientListeArray.push("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+notSeen[h]+
              "&ensp;</td><td>noConn&ensp;&ensp;&ensp;&ensp;</td><td>noConn&ensp;&ensp;</td><td>noConn</td></tr>");}
              clientListeArrayDISC.push("<tr style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";font-style: italic;\" ><td>"+notSeen[h]+
              "&ensp;</td><td>noConn&ensp;&ensp;&ensp;&ensp;</td><td>noConn&ensp;&ensp;</td><td>noConn</td></tr>");
       }
       //setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Clients_Anzahl",anzahlClients,100);   //korrigiert
mylog("Status5");

      lastChangeList=format3; // erstellt die liste für letzte änderung im netzwerk
    for (var g = lastChange.length-1; g >= 0 ; g--)  {
        lastChangeList=lastChangeList.concat(lastChange[g]/*+"</table>"*/);          
        lastChangeList.concat(lastChange[g]+"</table>");
       }
       //log(lastChangeList,"error");
    
   // log(clientListeArray.toString());


     

     //Filterfunktion - comma-separated list
      var whitelist=getState(dpPrefix + "WLANUnifi.Client_WhiteList").val.split(',');
      var clientListArrayStg="";
      var clientListArrayStgLAN="";
      var clientListArrayStgWLAN="";
      var clientListArrayStgDISC="";
      dlog(whitelist.join());

      // erstelle client-table aus array
      for (var wz=0; wz < clientListeArray.length ; wz++){
          if(whitelist.toString().includes("default") || whitelist.toString=="") { dlog("-------------default im filter");
          clientListArrayStg=clientListArrayStg+clientListeArray[wz]; } 
          else{ for(let filter in whitelist){
              dlog("filter  : "+whitelist[filter] +"   -------   name  :"+clientListeArray[wz]);
              if (clientListeArray[wz].includes(whitelist[filter]) && !clientListArrayStg.includes(clientListeArray[wz]) ) clientListArrayStg=clientListArrayStg+clientListeArray[wz];} }     //str.includes("world");
          }
          var cliAnz1 =0; var cliAnz2 =0; var cliAnz3 =0;
       for ( cliAnz1=0; cliAnz1 < clientListeArrayLAN.length ; cliAnz1++){clientListArrayStgLAN=clientListArrayStgLAN+clientListeArrayLAN[cliAnz1];}; setState(dpPrefix + "WLANUnifi.Wifi_Clients_Anzahl_LAN",cliAnz1);
       for ( cliAnz2=0; cliAnz2 < clientListeArrayWLAN.length ; cliAnz2++){clientListArrayStgWLAN=clientListArrayStgWLAN+clientListeArrayWLAN[cliAnz2];}; setState(dpPrefix + "WLANUnifi.Wifi_Clients_Anzahl_WLAN",cliAnz2);
       for ( cliAnz3=0; cliAnz3 < clientListeArrayDISC.length ; cliAnz3++){clientListArrayStgDISC=clientListArrayStgDISC+clientListeArrayDISC[cliAnz3];}; setState(dpPrefix + "WLANUnifi.Wifi_Clients_Anzahl_DISC",cliAnz3);

      


       


   if (iqontrol && anwesenheit && fileeWriteHelper ) {
        var lastUpdate=formatDate(getDateObject((parseFloat((new Date().getTime())))), "SS:mm:ss");
        var clientTableEnde="</table><p style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";\">Geamtanzahl angemeldeter Clients:"+anzahlClients+"<br>Insgesamt Clients registriert: "+ listeDatenpunkte.length+
                                                       "</p><p style=\"color:"+color_iqontrol_text__client_letzteAenderung+"; font-family:"+schriftart+";\">Letztes File Update: "+lastUpdate+"</p>"+
                                                       "<p style=\"color:"+color_iqontrol_text__client_letzteAenderung+"; font-family:"+schriftart+";\">Letzter Wechsel im Netzwerk:<br>"+lastChangeList+"</table></body>"
        var clientTableEndeWLAN="</table><p style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";\">Geamtanzahl angemeldeter WLAN Clients:"+cliAnz2+"<br>Insgesamt Clients registriert: "+ listeDatenpunkte.length+
                                                       "</p><p style=\"color:"+color_iqontrol_text__client_letzteAenderung+"; font-family:"+schriftart+";\">Letztes File Update: "+lastUpdate+"</p>"+
                                                       "<p style=\"color:"+color_iqontrol_text__client_letzteAenderung+"; font-family:"+schriftart+";\">Letzter Wechsel im Netzwerk:<br>"+lastChangeList+"</table></body>"    
        var clientTableEndeLAN="</table><p style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";\">Geamtanzahl angemeldeter LAN Clients:"+cliAnz1+"<br>Insgesamt Clients registriert: "+ listeDatenpunkte.length+
                                                       "</p><p style=\"color:"+color_iqontrol_text__client_letzteAenderung+"; font-family:"+schriftart+";\">Letztes File Update: "+lastUpdate+"</p>"+
                                                       "<p style=\"color:"+color_iqontrol_text__client_letzteAenderung+"; font-family:"+schriftart+";\">Letzter Wechsel im Netzwerk:<br>"+lastChangeList+"</table></body>"  
        var clientTableEndeDISC="</table><p style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";\">Geamtanzahl angemeldeter LAN Clients:"+cliAnz3+"<br>Insgesamt Clients registriert: "+ listeDatenpunkte.length+
                                                       "</p><p style=\"color:"+color_iqontrol_text__client_letzteAenderung+"; font-family:"+schriftart+";\">Letztes File Update: "+lastUpdate+"</p>"+
                                                       "<p style=\"color:"+color_iqontrol_text__client_letzteAenderung+"; font-family:"+schriftart+";\">Letzter Wechsel im Netzwerk:<br>"+lastChangeList+"</table></body>"
      //log("clientfile wird geschrieben","error");

     /* let  dataHelp = format2+clientListe.concat("</table><p style=\"color:"+color_iqontrol_text__client_disconnected+"; font-family:"+schriftart+";\">Geamtanzahl angemeldeter Clients:"+anzahlClients+"<br>Insgesamt Clients registriert: "+ listeDatenpunkte.length+
                                                       "</p><p style=\"color:"+color_iqontrol_text__client_letzteAenderung+"; font-family:"+schriftart+";\">Letztes File Update: "+formatDate(getDateObject((parseFloat((new Date().getTime())))), "SS:mm:ss")+"</p>"+
                                                       "<p style=\"color:"+color_iqontrol_text__client_letzteAenderung+"; font-family:"+schriftart+";\">Letzter Wechsel im Netzwerk:<br>"+lastChangeList+"</table></body>");
      */                                           
      //writeMyFile(dataHelp, pathClient);
     writeMyFile(format2+clientListArrayStg+clientTableEnde, pathClient);
     writeMyFile(format2+clientListArrayStgWLAN+clientTableEndeWLAN, pathOnlyWLAN);
     writeMyFile(format2+clientListArrayStgLAN+clientTableEndeLAN, pathOnlyLAN);
     writeMyFile(format2+clientListArrayStgDISC+clientTableEndeDISC, pathOnlyDISC);
     }

    //if (lastChange.length>10) lastChange=[];

dlog("ClientFile schreibt! "+iqontrol.toString()+writeClientTable.toString());
//if (true) setState(dpPrefix + "WLANUnifi.Wifi_Clients", "<table>"+clientListe.concat("</table>")); //schreibe client table
if (true) setState(dpPrefix + "WLANUnifi.Wifi_Clients", "<table>"+clientListArrayStg+"</table>") ;//schreibe client table
          setState(dpPrefix + "WLANUnifi.Wifi_ClientsOnlyLAN", "<table>"+clientListArrayStgLAN+"</table>");
          setState(dpPrefix + "WLANUnifi.Wifi_ClientsOnlyWLAN", "<table>"+clientListArrayStgWLAN+"</table>");
          setState(dpPrefix + "WLANUnifi.Wifi_ClientsOnlyDISC", "<table>"+clientListArrayStgDISC+"</table>");
       
if (anwesenheit) setState(dpPrefix + "WLANUnifi.Wifi_Clients_Log", "<p style=\"color:"+color_iqontrol_text__client_letzteAenderung_VIS+"; font-family:"+schriftart+";\">Letzter Wechsel im Netzwerk:<i>"+lastChangeList+"</i></p>");
     
    // log("------------------------frstTime: ------"+ firstTime, "warn")
    if (firstTime < 2 && iqontrol && anwesenheit) writeMyFile(format2+clientListArrayStg+clientTableEnde, pathClient);
 
    if (anwesenheit) getWrongIPClients();
  

}, 3000);}

mylog("bin raus aus  workclients");


} //workclientend

//-----------------------------------------WRITING FILES---------------------------------------------------------------
    function writeMyFile(dataHelpWrite, path) {
    mylog("bin in writemyfile")
  writeFile('iqontrol.meta', path ,dataHelpWrite, function (error) {
    mylog('file written');
});

//readFile('iqontrol.meta', '/htmltest3.html', function (error, data) {
  //  mylog("mein text:  ----:"+data.substring(0, 50));});

mylog("bin raus aus writemyfile")
}

 //-----------------------------------------EXISTING CLIENTS---------------------------------------------------------------
   function getExistingClients() {
      dlog("BIN IN EXISTING CLIENTS");
      listeDatenpunkte = [];
      var cacheSelectorState = $("state[state.id=" + dpPrefix + "WLANUnifi.Wifi_Client_States.*]");
      cacheSelectorState.each(function (id, c) {
        if (!id.includes("undefined")) {
          listeDatenpunkte[c] = id.replace(dpPrefix + "WLANUnifi.Wifi_Client_States.", "");
         }
       });

       dlog("bin raus a existing clients");
     }
 //-----------------------------------------DELETE CLIENTS mit fehlender ip adresse---------------------------------------------------------------
   function getWrongIPClients() {
      ipArrFehlt=[];
      dlog("BIN IN WRONG IP  CLIENTS");
      listeDatenpunkte = [];
      var cacheSelectorState = $("state[state.id=" + dpPrefix + "WLANUnifi.Wifi_Client_States.*]");
      cacheSelectorState.each(function (id, c) {

              if (getObject(id).common.name =="IP Adresse fehlt"){
         deleteState(id);}
        
       });

       dlog("bin raus WRONG IP clients");
     }

//-----------------------------------------GET--VOUCHERS---------------------------------------------------------------
async function getVouchers() {
     if (vouchers)  {
      mylog("BIN IN getvouchers");
    return new Promise(async (resolve, reject) => {
        dlog("nur mal so");
        if(!loggedIn) await login().catch((e) => reject(e));
         respv = await request.get({
            url: unifi_controller + "/api/s/"+siteName+"/stat/voucher",
            headers: { Cookie: cookies.join("; ") }
        }).catch((e) => { dlog("getStatus reject " + e); /*reject(e)*/ return testerrv=true; });  
   if (!testerrv) {
dlog("got response " + JSON.stringify(respv));
dlog(typeof respv);
dlog("--------------------- " + respv);


resolve("done");
   } else {log("reject weil respv ist 00"); reject();}
mylog("bin raus a GET vouchers");
});
}}

//-----------------------------------------WORK--VOUCHERS---------------------------------------------------------------
function workVouchers() {
    if (vouchers)  {
  //  mylog("BIN IN  workvouchers");
    dlog("got response " + JSON.stringify(respv));
    dlog(typeof respv);
    dlog("--------------------- " + respv);
respv = JSON.parse(respv);
//if (respv.data == null) log("respv ist NULLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL -"+ respv.length)
 mylog(JSON.stringify(respv.data).length.toString() + "----------------------writeFilevr : " + writeFileVar.toString())
 dlog(respv.meta);dlog(respv.meta.rc);

var writeDatei=true;
var laengeMessage=JSON.stringify(respv.data).length;
if (laengeMessage==writeFileVar) {writeDatei = false;} else {writeDatei=true}
mylog("writefile: "+ writeDatei)
writeFileVar=JSON.stringify(respv.data).length;

if (writeDatei) {
mylog("------------------------------------------------schreibe")

 var list ="";
 var listCode="";
 listValue=[];
 listValue2=[];
 listValue3=[];
 let   listHelper2='';

//zuerst Datenpunktealt löschen

for (i = 0; i < 20; i++) { 
       var y=i+1; 
   var yy=y.toString();
   if (y<10 )  yy="0"+yy;
       setState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+yy+".code"+yy, " na " );
       setState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+yy+".erstellt", " na " );
       setState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+yy+".dauer", " na " );
       setState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+yy+".abgelaufen", " na " );
       setState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+yy+".id", "na" );
       setState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+yy+".notiz", "na" );
}
//tabelle vorbereiten
var clientListe = "<tr style=\"color:"+color_iqontrol_text__voucher_ueberschrift+";\"><td>Nr.&ensp;</td><td>DAUER&ensp;</td><td>FERTIG&ensp;&ensp;&ensp;&ensp;</td><td>CODE&ensp;&ensp;</td><td>ERSTELLT&ensp;&ensp;</td><td>NOTIZ</td></tr> ";


for (var r = 1; r < 21; r++) { 
    var x=r.toString();
    if ( r < 10) { var yyy="0"+x;} else {yyy=x}; 
     setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+yyy, "", 100);
     }
    
    
 
for (var i = 0; i < respv.data.length; i++) { 
   var zeit= respv.data[i].create_time*1000
   listValue.push(respv.data[i]._id);
   listValue3.push((i+1));
   list=list.concat(respv.data[i]._id,";")  // für VIS anzeige - löschen
   
   let zeit1 =  formatDate(getDateObject(zeit), "TT.MM.JJJJ SS:mm").toString();
   let notizen;
  
   if (respv.data[i].note !== null) { notizen=respv.data[i].note} else {notizen= "&ensp;&ensp; - &ensp;&ensp;&ensp; ";}
    
   
   var y=i+1; 
   var yy=y.toString();
   if (y<10 )  yy="0"+yy;

    clientListe = clientListe.concat("<tr><td>"+yy+"&ensp;</td><td>"+respv.data[i].duration+"&ensp;</td><td>"+respv.data[i].status_expires+"&ensp;&ensp;&ensp;&ensp;</td><td>"+respv.data[i].code.slice(0,5)
                                      +"-"+respv.data[i].code.slice(5)+"&ensp;&ensp;</td><td>" +zeit1 + "&ensp;&ensp;</td><td>"+notizen+"</td></tr>");
  

   if (i<20  )  {
       listValue2.push("CODE"+yy);
       listCode = listCode.concat("CODE"+yy , ";");     // für VIS anzeige - löschen
       dlog(zeit1);
       setState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+yy+".code"+yy, respv.data[i].code.slice(0,5)+"-"+respv.data[i].code.slice(5) );  //respv.data[i].code
       setState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+yy+".erstellt", zeit1 );
       setState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+yy+".dauer", respv.data[i].duration );
       setState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+yy+".abgelaufen", respv.data[i].status_expires );
       setState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+yy+".id", respv.data[i]._id );
       if(respv.data[i].note !== null) {
             setState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+yy+".notiz", respv.data[i].note );} 
       else {setState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.CODE"+yy+".notiz", "  - " );}
       
   }}
    //nur für Löschen Iqontrol VIS
    listCode=listCode+"Wähle Code"
    list=list+"xxx"
    listValue3.push((respv.data.length+1));
    setState(dpPrefix + "WLANUnifi.Wifi_Vouchers_CodeList2",listValue3.join(";"))
    setState(dpPrefix + "WLANUnifi.Wifi_Vouchers_DeleteVIS",(respv.data.length+1))
   //setState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_Delete_Voucher.Voucher_ID",(respv.data.length+1))
   


    //nur für Löschen Iqontrol Kachel
      for (i=0; i<listValue.length;i++){
          mylog(listValue.length.toString());
          listHelper2=listHelper2+(i+1)        +":"+listValue2[i]+";"}
         // listHelper =listHelper+"'"+listValue2[i]+"'"+":"+"'"+listValue[i]+"'"+";"  }

      mylog("----: "+listHelper2)
      listHelper2=listHelper2.substr(0, listHelper2.length-1);
      mylog("----: "+listHelper2)
      listHelper2=listHelper2+";"+(listValue2.length+1)+":Voucher-Code-Auswahl"
      //object "states" ändern
      var obj = getObject(dpPrefix + "WLANUnifi.Wifi_Vouchers_ValueCodeList");
      obj.common.states=listHelper2;
      setObject(dpPrefix + "WLANUnifi.Wifi_Vouchers_ValueCodeList", obj);
      mylog("object2 : "+obj.common.states )
      //setzt ausahl in iqontrol damit letzter eintrag gelöscht werden kann
      nichtSchalten=true; //verhindert das durch schalter gelscht wird
      setState(dpPrefix + "WLANUnifi.Wifi_Vouchers_ValueCodeList",listValue2.length+1)
     

}   
                          
}

if (iqontrol && writeDatei) {
                           var dataHelp = format + clientListe.concat("</table><p style=\"color:"+color_iqontrol_text__voucher_ueberschrift+"; font-family:"+schriftart+
                                                                                ";\">Geamtanzahl Vouchers:"+respv.data.length+"</p>")+"<p style=\"color:"+color_iqontrol_text__client_letzteAenderung+"; font-family:"+schriftart+";\">Letztes File Update: "+formatDate(getDateObject((parseFloat((new Date().getTime())))), "SS:mm:ss")+"</p></body></html>"; 
                           //fs.writeFileSync(datei, dataHelp);
                           writeMyFile(dataHelp, pathVoucher);}
if (writeDatei) setState(dpPrefix + "WLANUnifi.Wifi_Vouchers", "<table>"+clientListe.concat("</table><p style=\"color:"+color_iqontrol_text__voucher_ueberschrift+"; font-family:"+schriftart+
                                                                                ";\">Geamtanzahl Vouchers:"+respv.data.length+"</p>"));
if (writeDatei) {setState(dpPrefix + "WLANUnifi.Wifi_Vouchers_Anzahl", respv.data.length);

  mylog(listCode +" -- " +list)
 setState(dpPrefix + "WLANUnifi.Wifi_Vouchers_List", list );  // für VIS anzeige - löschen
 setState(dpPrefix + "WLANUnifi.Wifi_Vouchers_CodeList", listCode ); } // für VIS anzeige - löschen
 //mylog("BIN RAUS AUS  workvouchers");

}

 //-----------------------------------------GET--Health---------------------------------------------------------------
async function getHealth() {
     if (health)  {
      mylog("BIN IN gethealth");
    return new Promise(async (resolve, reject) => {
        dlog("nur mal so");
        if(!loggedIn) await login().catch((e) => reject(e));
         resph = await request.get({
            url: unifi_controller + "/api/s/"+siteName+"/stat/health",
            headers: { Cookie: cookies.join("; ") }
        }).catch((e) => { log("getStatus reject " + e); /*reject(e)*/ return testerrh=true; });  
   if (!testerrh) {
dlog("got response " + JSON.stringify(resph));
dlog(typeof resph);
mylog("--------------------- " + resph);
resolve("done");
   } else {log("reject weil resph ist 00"); reject();}
mylog("bin raus a GET health");
});
}}
//-----------------------------------------WORK--HEALTH---------------------------------------------------------------
function workHealth() {
    
    mylog("BIN IN  workhealth");
    dlog("got response " + JSON.stringify(resph));
    dlog(typeof resph);
    mylog("--------------------- " + resph);
   
    resph=resph.replace(/-r/g, "_r")
    resph = JSON.parse(resph);
    
    if(resph.data[1].hasOwnProperty("wan_ip")) { createState(dpPrefix + "WLANUnifi.Health.WAN.WAN_IP", {name: 'WAN_Adresse', desc: 'WAN_IP', role: 'state',read: true,write: true,type: 'string' }); 
                                                 var ipWAN=true;} else {ipWAN=false;}
    
    
    mylog(resph.data[0].rx_bytes_r);
    setState(dpPrefix + "WLANUnifi.Health.WLAN.Status",resph.data[0].status );
    setState(dpPrefix + "WLANUnifi.Health.WLAN.Users",resph.data[0].num_user);
    setState(dpPrefix + "WLANUnifi.Health.WLAN.Guests",resph.data[0].num_guest );
    setState(dpPrefix + "WLANUnifi.Health.WLAN.TXBytes",resph.data[0].tx_bytes_r );
    setState(dpPrefix + "WLANUnifi.Health.WLAN.RXBytes",resph.data[0].rx_bytes_r );
    setState(dpPrefix + "WLANUnifi.Health.WLAN.Adopted",resph.data[0].num_adopted );
    setState(dpPrefix + "WLANUnifi.Health.WLAN.Disabled",resph.data[0].num_disabled );
    setState(dpPrefix + "WLANUnifi.Health.WLAN.Disconnected",resph.data[0].num_disconnected );
    if (ipWAN) setStateDelayed(dpPrefix + "WLANUnifi.Health.WAN.WAN_IP",resph.data[1].wan_ip, 1000 );
    
   // if (apInfo) healthListe = apHead;
    healthListe = "";
    healthListeTable="";
    //healthListe = apHead + apTable +"<tr style=\"color:"+color_iqontrol_text__voucher_ueberschrift+"; \"><td><b>Health-Daten:</b></td><td></td></tr>"
    healthListeTable =                         "<tr><td>Status&ensp;&ensp;</td><td>"+resph.data[0].status+
                                               "</td></tr><tr><td>Users&ensp;&ensp;</td><td>"+resph.data[0].num_user +
                                               "</td></tr><tr><td>Gäste&ensp;&ensp;&ensp;&ensp;</td><td>" +resph.data[0].num_guest +
                                               "</td></tr><tr><td>TxBytes&ensp;&ensp;</td><td>"+resph.data[0].tx_bytes_r +
                                               "</td></tr><tr><td>RxBytes</td><td>"+resph.data[0].rx_bytes_r+
                                               "</td></tr><tr><td>Disabled</td><td>"+resph.data[0].num_disabled+
                                               "</td></tr><tr><td>Adopted</td><td>"+resph.data[0].num_adopted+
                                               "</td></tr><tr><td>Disconnected</td><td>"+resph.data[0].num_disconnected+
                                               "</td></tr>"
    
    healthListe = apHead + apTable +"<tr style=\"color:"+color_iqontrol_text__voucher_ueberschrift+"; \"><td><b>Health-Daten:</b></td><td></td></tr>" + healthListeTable;
    healthListeTable="<tr style=\"color:"+color_iqontrol_text__voucher_ueberschrift+";\"><td><b>Health Daten:</b></td><td></td></tr>" + healthListeTable;
    mylog(healthListe);

    mylog("bin raus a work health");
}
 //-----------------------------------------SET WIFIS - WIFI EIN-AUSSCHALTEN----------------------------------------------
 //Wifi an-/ausschalten
//enabled: true = anschalten; false = ausschalten
//wifi: wifi object aus der konstanten wifis
async function setWifi(enabled, wifi) {
   if (!clientPause) {
   return new Promise(async (resolve, reject) => {
       dlog("setWifi: start set Wifi_haupt");
       if (!loggedIn) { dlog("need to login"); await login().catch((e) => reject(e)); }
       dlog("setWifi: now setting Wifi_haupt");
       let resp = request.post({
           url: unifi_controller + "/api/s/"+siteName+"/upd/wlanconf/" + wifi.id,
           body: JSON.stringify({ enabled }),
           headers: { 'Content-Type': 'application/json', Cookie: cookies.join("; ") }
       }).catch((e) => { dlog("setWifi: rejected: " + e); /*reject(e)*/ return testerrws=true; });
       dlog("setWifi: got response")
 
       if (resp != null) {
           dlog("setWifi: Wifi wurde erfolgreich " + (enabled ? "eingeschaltet" : "ausgeschaltet"));
           dlog(resp);
                   // getclient()  Pause für umschalten

      
          if (firstTime>=wifiLength) {       
            //   if (true) {       
           clientPause = true;
           setState(dpPrefix + "WLANUnifi.Wifi_Client_Pause",true);
           clientPauseVal=parseInt((new Date().getTime()));     //clientPauseConst
           var timeoutClientPause = setTimeout(function () {
           clientPause = false;
           setState(dpPrefix + "WLANUnifi.Wifi_Client_Pause",false);
           }, clientPauseConst);
           }
        
           setState(dpPrefix + "WLANUnifi." + wifi.name, enabled, enabled);
           resolve();
       } else {
           dlog("setWifi: rejetced")
           dlog("resp: " + JSON.stringify(resp));
           reject("msg: " + JSON.parse(resp.body).meta.msg);}
       
   });
} else { log("WLAN wird gerade umgeschaltet"); }
}

//-----------------------------------------CREATE VOUCHERS----------------------------------------------

async function createVoucher (mybody) {

   mylog(JSON.stringify( mybody ));
   return new Promise(async (resolve, reject) => {
       mylog("createVoucher in aktion");
       if (!loggedIn) { mylog("need to login"); await login().catch((e) => reject(e)); }
       mylog("do it !");
       let respcv = request.post({
           url: unifi_controller + "/api/s/"+siteName+"/cmd/hotspot/" ,
           body: JSON.stringify( mybody ),
           // body: mybody,
           headers: { 'Content-Type': 'application/json', Cookie: cookies.join("; ") }
       }).catch((e) => { log("setWifi: rejected: " + e);  /*reject(e)*/ return testerrcv=true; });
       dlog("setWifi: got response")
       dlog("------------: "+respcv);
       dlog("resp: " + JSON.stringify(respcv));
   });
}
//-----------------------------------------DELETE VOUCHERS----------------------------------------------

async function deleteVoucher (mybody) {

   mylog(JSON.stringify( mybody ));
   return new Promise(async (resolve, reject) => {
       dlog("deleteVoucher in aktion");
       if (!loggedIn) { mylog("need to login"); await login().catch((e) => reject(e)); }
       mylog("do it !");
       let respdv = request.post({
           url: unifi_controller + "/api/s/"+siteName+"/cmd/hotspot/" ,
           body: JSON.stringify( mybody ),
           // body: mybody,
           headers: { 'Content-Type': 'application/json', Cookie: cookies.join("; ") }
       }).catch((e) => { log("setWifi: rejected: " + e);  /*reject(e)*/ return testerrdv=true; });
       dlog("setWifi: got response")
       dlog("------------: "+respdv);
       dlog("resp: " + JSON.stringify(respdv));
       dlog("resp: " + JSON.parse(respdv));
   });
}
//-----------------------------------------GET--APs---------------------------------------------------------------
async function getAp(id) {
     if (apInfo)  {
      mylog("BIN IN getap mit Wert" + id);
       return new Promise(async (resolve, reject) => {
        dlog("nur mal so");
        if(!loggedIn) await login().catch((e) => reject(e));
            respa = await request.get({
            url: unifi_controller + "/api/s/"+siteName+"/stat/device/"+id,
            headers: { Cookie: cookies.join("; ") }
        }).catch((e) => { dlog("getStatus reject " + e); /*reject(e)*/ return testerrap=true; });  
   if (!testerrv) {
dlog("got response " + JSON.stringify(respa));
dlog(typeof respa);
dlog("--------------------- " + respa);
resolve("done");
   } else {log("reject weil respv ist 00"); reject();}
mylog("bin raus a GETap");
});
}}

//-----------------------------------------WORK--APs---------------------------------------------------------------
function workAP (aliasAPname) {
     mylog("BIN IN  work ap");
    let satisfy;
    let speedyUp;
    let speedyDown;
    let lacy;
    let onlinee;
    let uplink_rx;
    let uplink_tx;
    let runtimie;
   
    dlog("got response " + JSON.stringify(respa));
    dlog(typeof respa);
    dlog("--------------------- " + respa);     
   
    let abfrage = respa.indexOf("satisfaction");
    let abfrage2 = respa.indexOf("xput_download");
    let abfrage3 = respa.indexOf("xput_upload");
    let abfrage4 = false; //latency
    let abfrage5 = false; //www-online
    let abfrage6 = false; //uplink wan1
 
                                              

    //if(respa.data[0].wan1.up !== undefined) log("ist undefined");                           
    respa = JSON.parse(respa);

   
    // hier muss mit property gearbeitet werden, da sonst die object nicht gefunden werden können
    if(respa.data[0].hasOwnProperty("speedtest-status")) {      //teste latency
          if(respa.data[0]["speedtest-status"].hasOwnProperty("latency")) {abfrage4=true;dlog("hat system-status.latency");} else {dlog("hat nicht beide- latency")}
    } else {dlog("hat nicht system-status")}

    if(respa.data[0].hasOwnProperty("wan1")) {                 //teste wan1.up = usg online
          if(respa.data[0].wan1.hasOwnProperty("up")) {abfrage5=true;dlog("hat wan1.up");} else {dlog("hat nicht beide wan1-up")}
    } else {dlog("hat nicht wan1")}

    if(respa.data[0].hasOwnProperty("uplink")  && respa.data[0].type=="ugw" /*&& respa.data[0].model == "U7LT"*/) {                 //teste wan1.up = ugw online
          if(respa.data[0].uplink.hasOwnProperty("rx_bytes")) {abfrage6=true;dlog("hat uplink.rx_bytes");createState(dpPrefix + "WLANUnifiHelp.Midnight_Uplink_RX", 0,{name: 'Midnight_Uplink_RX',unit:"kB",  role: 'state',read: true,write: true,type: 'number' });
                                                                                                         createState(dpPrefix + "WLANUnifiHelp.Midnight_Uplink_TX", 0,{name: 'Midnight_Uplink_TX',unit:"kB", role: 'state',read: true,write: true,type: 'number' }); 
                                                                                                         createState(dpPrefix + "WLANUnifiHelp.WAN1TransferMonth.Month_Uplink_RX", 0,{name: 'Month_Uplink_RX',unit:"GB",  role: 'state',read: true,write: true,type: 'number' });
                                                                                                         createState(dpPrefix + "WLANUnifiHelp.WAN1TransferMonth.Month_Uplink_TX", 0,{name: 'Month_Uplink_TX',unit:"GB",  role: 'state',read: true,write: true,type: 'number' });
                                                                                                         createState(dpPrefix + "WLANUnifiHelp.WAN1TransferBefore.Before_Uplink_RX", 0,{name: 'Before_Uplink_RX',unit:"GB",  role: 'state',read: true,write: true,type: 'number' });
                                                                                                         createState(dpPrefix + "WLANUnifiHelp.WAN1TransferBefore.Before_Uplink_TX", 0,{name: 'Before_Uplink_TX',unit:"GB",  role: 'state',read: true,write: true,type: 'number' });
                                                                                                          } else {dlog("hat nicht uplink")}
    } else {dlog("hat nicht wan1")}

   
      
         // var timeoutMid = setTimeout(function () { //wegendatenpung create


    // hier einfache abfrage da objecte eindeutig sind
          if(respa.data[0].state =="1") { //log("Gerät ist da-------------"+respa.data[0].state); 
            
          if(abfrage>-1) { dlog("------------------ist war"); satisfy = respa.data[0].satisfaction;
          } else { satisfy = 777 ;dlog("------------------ist nicht war");}
          if(abfrage2>-1) {  speedyDown = respa.data[0]["speedtest-status"].xput_download;dlog("------------------ist war---Wert ist :"+speedyDown)
            speedyDown=speedyDown.toFixed(3)
            setState(dpPrefix + "WLANUnifi.APInfo.SpeedTest.Xput-Download",  speedyDown );
            runtimie=formatDate(getDateObject(parseFloat(respa.data[0]["speedtest-status"].rundate)*1000), "TT.MM.JJJJ SS:mm:ss")  ; 
            setState(dpPrefix + "WLANUnifi.APInfo.SpeedTest.RunTime",  formatDate(getDateObject(parseFloat(respa.data[0]["speedtest-status"].rundate)*1000), "SS:mm:ss") );
            setState(dpPrefix + "WLANUnifi.APInfo.SpeedTest.RunTimeDate",  formatDate(getDateObject(parseFloat(respa.data[0]["speedtest-status"].rundate)*1000), "TT.MM.JJJJ") );
            setState(dpPrefix + "WLANUnifi.APInfo.SpeedTest.RunTimeOrginal",  respa.data[0]["speedtest-status"].rundate.toString() );
          } else { speedyDown = 777 ;dlog("------------------ist nicht war :"+speedyDown);}
          dlog("station1");            
          if(abfrage3>-1) { speedyUp = respa.data[0]["speedtest-status"].xput_upload; dlog("------------------ist war---Wert ist :"+speedyUp);
            speedyUp=speedyUp.toFixed(3)
            setState(dpPrefix + "WLANUnifi.APInfo.SpeedTest.Xput-Upload",  speedyUp );
          } else { speedyUp = 777 ;dlog("------------------ist nicht war :"+speedyUp);}
          dlog("station2");         
          if(abfrage4) { lacy = respa.data[0]["speedtest-status"].latency;dlog("------------------ist war---Wert ist :"+lacy);
            setState(dpPrefix + "WLANUnifi.APInfo.SpeedTest.Latency",  lacy );
          } else { lacy = 777 ;dlog("------------------ist nicht war :"+lacy);}
          dlog("station3");
             if(abfrage5) { onlinee = respa.data[0].wan1.up; dlog("------------------ist war---Wert ist :"+onlinee);
            setState(dpPrefix + "WLANUnifi.WWW-OnlineTest.Internet_Verbindung",  onlinee );
          } else { onlinee = 777 ;dlog("------------------ist nicht war :"+onlinee);}
          dlog("station4");
             if(abfrage6 ) { uplink_rx = respa.data[0].uplink.rx_bytes; mylog("---------------------Wert ist :"+uplink_rx);         
                            var monthNowRx=getState(dpPrefix + "WLANUnifiHelp.WAN1TransferMonth.Month_Uplink_RX").val;      // hole monatl. daten
                            var midnightHelpRX = getState(dpPrefix + "WLANUnifiHelp.Midnight_Uplink_RX").val;               // hole mitternacht wert 
                            if (midnightHelpRX==0) {midnightHelpRX=uplink_rx; setStateDelayed(dpPrefix + "WLANUnifiHelp.Midnight_Uplink_RX",  uplink_rx, 100 );} // wenn mitterncht 0 (noch nie egeschrieben )-> setze diesen wert
                            mylog("_______bin in ap: "+midnight.toString()+"data: "+uplink_rx + "  -  : "+uplink_rx);
                            if (midnight) {(setState(dpPrefix + "WLANUnifiHelp.Midnight_Uplink_RX",  uplink_rx ));}    //setzt tageszähler auf neuen wert 
                            uplink_rx= Math.round((uplink_rx - midnightHelpRX)/1000000) ;                              //rechnet    momentanen wert minus tageszähler == heute verbrauch
                            //log("----rx: "+uplink_rx);
                            setState(dpPrefix + "WLANUnifiHelp.WAN1TransferDaily.Uplink_RX",  uplink_rx/1000 );             // setzt heutigen verbrauch dp
                            if (midnight || monthChangeData ) var monthhelper=(Math.round(((uplink_rx/1000)+monthNowRx) *1000))/1000  ; //berechnet  heute plus monatlich
                            if (midnight) {setState(dpPrefix + "WLANUnifiHelp.WAN1TransferMonth.Month_Uplink_RX", monthhelper  );dlog("--midnightrx : "+monthhelper) }   //setzt monat + tageswert = gesamtmonat
                            if (monthChangeData && midnight) setState(dpPrefix + "WLANUnifiHelp.WAN1TransferBefore.Before_Uplink_RX",monthhelper);                                  // setzt monat before mit gesamtmonat 
                            if (monthChangeData && midnight) setState(dpPrefix + "WLANUnifiHelp.WAN1TransferMonth.Month_Uplink_RX", 0);//getState(dpPrefix + "WLANUnifiHelp.Month.Now_Uplink_RX").val  + uplink_rx ); setzt monat auf 0
                            
          } else { uplink_rx = 777 ;dlog("------------------ist nicht war :"+uplink_rx);}
          dlog("station5");     
             if(abfrage6 ) { uplink_tx = respa.data[0].uplink.tx_bytes; dlog("------------------ist war---Wert ist :"+uplink_tx);
                            var monthNowTx=getState(dpPrefix + "WLANUnifiHelp.WAN1TransferMonth.Month_Uplink_TX").val;
                            var midnightHelpTX = getState(dpPrefix + "WLANUnifiHelp.Midnight_Uplink_TX").val;
                            if (midnightHelpTX==0) {midnightHelpTX=uplink_tx; setStateDelayed(dpPrefix + "WLANUnifiHelp.Midnight_Uplink_TX",  uplink_tx, 100 );}
                            if (midnight) {(setState(dpPrefix + "WLANUnifiHelp.Midnight_Uplink_TX",  uplink_tx ));}
                            uplink_tx=Math.round((uplink_tx -midnightHelpTX)/1000000) ;mylog("tx nach abzug: " +uplink_tx );
                            //log("----tx: "+uplink_tx);
                            setState(dpPrefix + "WLANUnifiHelp.WAN1TransferDaily.Uplink_TX",  uplink_tx/1000 );
                            if (midnight || monthChangeData ) var monthhelper=(Math.round(((uplink_tx/1000)+monthNowTx) *1000))/1000;
                            if (midnight) {setState(dpPrefix + "WLANUnifiHelp.WAN1TransferMonth.Month_Uplink_TX", monthhelper   );dlog("--midnighttx  : "+monthhelper) }
                            if (monthChangeData && midnight) setState(dpPrefix + "WLANUnifiHelp.WAN1TransferBefore.Before_Uplink_TX", monthhelper);
                            if (monthChangeData && midnight) setState(dpPrefix + "WLANUnifiHelp.WAN1TransferMonth.Month_Uplink_TX", 0);//getState(dpPrefix + "WLANUnifiHelp.Month.Now_Uplink_TX").val  + uplink_tx ); 
                            if (midnight) { midnight=false;} 
                            if (monthChangeData) {monthChangeData=false;  }                  
                           
                           
          } else { uplink_tx = 777 ;dlog("------------------ist nicht war :"+uplink_tx);}
          dlog("station6");                 
        

/*  //für test simulation ohne hardware
    setState(dpPrefix + "WLANUnifi.APInfo.SpeedTest.Xput-Download",  44 ); setState(dpPrefix + "WLANUnifi.APInfo.SpeedTest.Xput-Upload",  11);
    setState(dpPrefix + "WLANUnifi.APInfo.WWW-OnlineTest.Online",  true ); setState(dpPrefix + "WLANUnifi.APInfo.SpeedTest.Latency",  13 );
    speedyDown = 776; speedyUp = 775;  lacy=17;   onlinee=true;
  */

    dlog(respa.data[0].model)
     setState(dpPrefix + "WLANUnifi.APInfo."+ aliasAPname+".Model",respa.data[0].model );
     setState(dpPrefix + "WLANUnifi.APInfo."+ aliasAPname+".IP_Adresse",respa.data[0].connect_request_ip );
     setState(dpPrefix + "WLANUnifi.APInfo."+ aliasAPname+".Satisfaction",  satisfy  /*respa.data[0].satisfaction*/ );
     setState(dpPrefix + "WLANUnifi.APInfo."+ aliasAPname+".Adopted",respa.data[0].adopted );
     setState(dpPrefix + "WLANUnifi.APInfo."+ aliasAPname+".LoadAVG1",parseFloat(respa.data[0].sys_stats.loadavg_1));
     setState(dpPrefix + "WLANUnifi.APInfo."+ aliasAPname+".LoadAVG5",parseFloat(respa.data[0].sys_stats.loadavg_5));
     setState(dpPrefix + "WLANUnifi.APInfo."+ aliasAPname+".LoadAVG15",parseFloat(respa.data[0].sys_stats.loadavg_15));
     setState(dpPrefix + "WLANUnifi.APInfo."+ aliasAPname+".ToController",respa.data[0].inform_ip );
     setState(dpPrefix + "WLANUnifi.APInfo."+ aliasAPname+".State",true );


 
       var apListeHelfer= /*apListeTable +*/        "<tr><td>Model&ensp;&ensp;</td><td>"+respa.data[0].model+
                                         "</td></tr><tr><td>IP-Adresse&ensp;&ensp;</td><td>"+respa.data[0].connect_request_ip +
                                         "</td></tr><tr><td>Satisfaction&ensp;&ensp;&ensp;&ensp;</td><td>" + satisfy + //respa.data[0].satisfaction +
                                         "</td></tr><tr><td>Adopted&ensp;&ensp;</td><td>"+respa.data[0].adopted +
                                          "</td></tr><tr><td>LoadAVG1&ensp;&ensp;</td><td>"+respa.data[0].sys_stats.loadavg_1 +
                                         "</td></tr><tr><td>ToController</td><td>"+respa.data[0].inform_ip+"</td></tr>";
   
      

     apListeTable= apListeTable + apListeHelfer ;
     apListe = apListe + "<tr><td>&ensp;</td><td>&ensp;</td></tr> <tr style=\"color:"+color_iqontrol_text__voucher_ueberschrift+";\">"+"<td><b>Device:</b></td><td><b><i>"+aliasAPname+"</i></b></td></tr>"+apListeHelfer;
     mylog (apListe)

     if (abfrage5) { //für www-online
          apListe = apListe + 
             "<tr><td>&ensp;</td><td>&ensp;</td></tr> <tr style=\"color:"+color_iqontrol_text__voucher_ueberschrift+";\">"+"<td><b>WWW-Online:</b></td><td><b><i>-</i></b></td></tr>"+
             "<tr><td>WAN-Online&ensp;&ensp;&ensp;&ensp;</td><td>" + onlinee +"</td></tr>";
          apListeTable= apListeTable + "<tr><td>&ensp;</td><td>&ensp;</td></tr> <tr style=\"color:"+color_iqontrol_text__voucher_ueberschrift+";\">"+"<td><b>WWW-Online:</b></td><td><b><i>-</i></b></td></tr>"+
                                       "<tr><td>WAN-Online&ensp;&ensp;&ensp;&ensp;</td><td>" + onlinee +"</td></tr>"; 
     }
     
      if(speedyDown!=777 && speedyUp!=777){ //für latency, up- und download 
          apListe = apListe + 
             "<tr><td>&ensp;</td><td>&ensp;</td></tr> <tr style=\"color:"+color_iqontrol_text__voucher_ueberschrift+";\">"+"<td><b>SpeedTest:</b></td><td><b><i>-</i></b></td></tr>"+
             "<tr><td>Xput-Download&ensp;&ensp;&ensp;&ensp;</td><td>" + speedyDown +
             "</td></tr><tr><td>Xput-Upload&ensp;&ensp;&ensp;&ensp;</td><td>" + speedyUp+
             "</td></tr><tr><td>RunTime&ensp;&ensp;&ensp;&ensp;</td><td>" + runtimie+
             "</td></tr><tr><td>Latency&ensp;&ensp;&ensp;&ensp;</td><td>" + lacy+"</td></tr>";
          apListeTable= apListeTable + "<tr><td>&ensp;</td><td>&ensp;</td></tr> <tr style=\"color:"+color_iqontrol_text__voucher_ueberschrift+";\">"+"<td><b>SpeedTest:</b></td><td><b><i>-</i></b></td></tr>"+
                                       "<tr><td>Xput-Download&ensp;&ensp;&ensp;&ensp;</td><td>" + speedyDown + 
                                       "</td></tr><tr><td>Xput-Upload&ensp;&ensp;&ensp;&ensp;</td><td>" + speedyUp+
                                       "</td></tr><tr><td>RunTime&ensp;&ensp;&ensp;&ensp;</td><td>" + runtimie+
                                       "</td></tr><tr><td>Latency&ensp;&ensp;&ensp;&ensp;</td><td>" + lacy+"</td></tr>"; 
      }

            if (abfrage6) { //Versendetes DAtenvolume pro tag
          apListe = apListe + 
             "<tr><td>&ensp;</td><td>&ensp;</td></tr> <tr style=\"color:"+color_iqontrol_text__voucher_ueberschrift+";\">"+"<td><b>WAN1-Transfer:</b></td><td><b><i>-</i></b></td></tr>"+
             "<tr><td>Empfangen&ensp;&ensp;&ensp;&ensp;</td><td>" + uplink_rx +
             "</td></tr><tr><td>Gesendet&ensp;&ensp;&ensp;&ensp;</td><td>" + uplink_tx+"</td></tr>";
          apListeTable= apListeTable + "<tr><td>&ensp;</td><td>&ensp;</td></tr> <tr style=\"color:"+color_iqontrol_text__voucher_ueberschrift+";\">"+"<td><b>WAN1-Transfer:</b></td><td><b><i>-</i></b></td></tr>"+
                                       "<tr><td>Empfangen&ensp;&ensp;&ensp;&ensp;</td><td>" + uplink_rx + 
                                       "</td></tr><tr><td>Gesendet&ensp;&ensp;&ensp;&ensp;</td><td>" + uplink_tx+"</td></tr>"; 
      }
     mylog(apListe);
          } else {setState(dpPrefix + "WLANUnifi.APInfo."+ aliasAPname+".State",false );}// wenn state ist 1  - ob gerät da 
    mylog("bin raus a work ap");
  // }, 500);
}

//-----------------------------------------GET--Alarms---------------------------------------------------------------
 function getAlarm() {
      dlog("BIN IN ALARM");
   return new Promise(async (resolve, reject) => {
       dlog("nur mal so");
       if (!loggedIn) await login().catch((e) => reject(e));
        respal = await request.get({
           url: unifi_controller + "/api/s/"+siteName+"/rest/alarm?archived=false", //?archived=false
           headers: { Cookie: cookies.join("; ") }
       }).catch((e) => { dlog("getStatus reject " + e); /*reject(e)*/ return testerral=true; });
     
       dlog("got response " + JSON.stringify(respal));
       //resp = JSON.parse(resp);
       

         if (!testerral) {


        resolve("done");
        mylog("BIN raus aus  ALARM");}
       });
     
}
 
 //-----------------------------------------WORK--Alarms---------------------------------------------------------------
function workAlarm() {

     mylog("BIN IN work ALARM")
     respal = JSON.parse(respal).data;
     dlog("--------------------- " + JSON.stringify(respal));

     let alarmHelfer="";  
     let alarmLength = Object.keys(respal).length;
     setState(dpPrefix + "WLANUnifi.Alarm.Alarm_Anzahl", alarmLength);
     mylog(Object.keys(respal).length.toString())
     mylog(alarmLength.toString())
     if (alarmLength >0) {
         for (var j=0; j < alarmLength; j++) {

             let  datum = new Date (respal[j].time).toString();
             mylog(datum.slice(0,datum.indexOf("GMT"))+"---"+respal[j].msg);
             alarmHelfer=alarmHelfer +"<tr><td>"+ datum.slice(0,datum.indexOf("GMT"))+"&ensp;&ensp;</td><td>"+respal[j].msg.slice(0, 50)  + "</td></tr>";
             }
         alarmHelfer= alarmHelfer + "</table>";
         setState(dpPrefix + "WLANUnifi.Alarm.Alarm", "<table>"+alarmHelfer);
        if (iqontrol) { var dataHelp = apHead + "<p style=\"color:"+color_iqontrol_text__voucher_ueberschrift+"; font-family:"+schriftart+
                                               ";\">Geamtanzahl nicht archivierter Alarme:"+alarmLength+"</p>" +apTable +alarmHelfer+"<p style=\"color:"+color_iqontrol_text__client_letzteAenderung+"; font-family:"+schriftart+";\">Letztes File Update: "+formatDate(getDateObject((parseFloat((new Date().getTime())))), "SS:mm:ss")+"</p></body></html>" ; 
                        writeMyFile(dataHelp, pathAlarm);}                                                       

      } else {setState(dpPrefix + "WLANUnifi.Alarm.Alarm", "keine neuen Alarme");
             if (iqontrol) {
                 var dataHelp= apHead + "<p style=\"color:"+color_iqontrol_text__voucher_ueberschrift+"; font-family:"+schriftart+
                                                                                ";\">Geamtanzahl nicht archivierter Alarme:"+alarmLength+"</p>"+"<p style=\"color:"+color_iqontrol_text__client_letzteAenderung+"; font-family:"+schriftart+";\">Letztes File Update: "+formatDate(getDateObject((parseFloat((new Date().getTime())))), "SS:mm:ss")+"</p></body></html>";
                 writeMyFile(dataHelp, pathAlarm);}
                }
 
     
    mylog("bin raus a work alarm");
   
 
}

//createState  ( dpPrefix + "WLANUnifi.WLANSSID.erstess", false,  { name: 'Wifi_Client_Pause',  role: 'switch', type: 'boolean', read:  true,  write: true,});

//-----------------------------------------schalter SSID Sichtbar---------------------------------------------------------------
async function firstSSID(wert, wifi) {

   //mylog(JSON.stringify( mybody ));
   return new Promise(async (resolve, reject) => {
     var  mybody = { hide_ssid : wert }  ;
     log(wert + wifi.id);
       log("ssid switch in aktion");
       if (!loggedIn) { mylog("need to login"); await login().catch((e) => reject(e)); }
       mylog("do it 2!");
       let respled = request.put({
           url: unifi_controller + "/api/s/"+siteName+"/rest/wlanconf/"+wifi.id,      //5cadca8e3b6a3967dd7e5381" , //     5d46feed97578425c40cefe4" , 18:e8:29:56:40:e2
           body:  JSON.stringify(mybody) , 
           headers: { 'Content-Type': 'application/json', Cookie: cookies.join("; ") }
       }).catch((e) => { log("LED: rejected: " + e);   return testerrcv=true; });
       //log("ALL SSID: got response")
       //log("------------: "+respled);
       //log("resp: " + JSON.stringify(respled)); 

         // if (firstTime>=wifiLength) {       
            //   if (true) {       
           clientPause = true;
           setState(dpPrefix + "WLANUnifi.Wifi_Client_Pause",true);
           clientPauseVal=parseInt((new Date().getTime()));     //clientPauseConst
           var timeoutClientPause = setTimeout(function () {
           clientPause = false;
           setState(dpPrefix + "WLANUnifi.Wifi_Client_Pause",false);
           }, clientPauseConst);
          // }



   });
}
//-----------------------------------------------------SCHALTER SSID------------------------------------------------
//on({id:  dpPrefix + "WLANUnifi.WLANSSID.erstess", ack: false, change: "any"}, function (obj) { 
on({id: wifiDPsHide, ack: false, change: "ne"}, function (obj) { 
    //log("!11111111_________: " + wifiDPsHide + wifiDPs);
      var value = obj.state.val;
      var dp2 = obj.name
      dlog(value+dp2); 
      if (!clientPause && firstTime ==15) {
       firstSSID(value, wifis[dp2]);
      }
    });

//-----------------------------------------schalter LED-SITE-WIDE-APs---------------------------------------------------------------
async function allLed(toggleLED) {

   //mylog(JSON.stringify( mybody ));
   return new Promise(async (resolve, reject) => {
     var  mybody = { led_enabled : toggleLED }  ;
       mylog("createVoucher in aktion");
       if (!loggedIn) { mylog("need to login"); await login().catch((e) => reject(e)); }
       mylog("do it 2!");
       let respled = request.post({
           url: unifi_controller + "/api/s/"+siteName+"/set/setting/mgmt", //     5d46feed97578425c40cefe4" , 18:e8:29:56:40:e2
           body:  JSON.stringify(mybody) , 
           headers: { 'Content-Type': 'application/json', Cookie: cookies.join("; ") }
       }).catch((e) => { log("LED: rejected: " + e);  /*reject(e)*/ return testerrcv=true; });
       dlog("ALL LED: got response")
       dlog("------------: "+respled);
       dlog("resp: " + JSON.stringify(respled));
   });
}
//-----------------------------------------------------SCHALTER LED------------------------------------------------

on({id:  dpPrefix + "WLANUnifi.SiteLED", ack: false, change: "any"}, function (obj) { 
    if(loggedIn) {
  var toggle;
  if(getState(dpPrefix + "WLANUnifi.SiteLED").val) {
       toggle=true;}
       else { toggle=false;}
 allLed(toggle);}
    });
//-----------------------------------------------------SCHALTER WIFI------------------------------------------------
on({id: wifiDPs, ack: false, change: "ne"}, function (obj) { 
  var value = obj.state.val;
  var dp2 = obj.name
  setWifi(value, wifis[dp2]);
  dlog(wifis[dp2])
  if (firstTime<wifiLength+1) firstTime++;
           
});
//--------------------------------------------------Aliasnamen schalten------------------------------------------------
on({id:  dpPrefix + "WLANUnifi.AliasName",  change: "any"}, function (obj) { 
      if (!binAmArbeiten) {(getState(dpPrefix + "WLANUnifi.AliasName").val) ? myname='name' : myname='hostname';}
      else                {
          var timeoutAlias= setTimeout(function () {
          if (!binAmArbeiten) {(getState(dpPrefix + "WLANUnifi.AliasName").val) ? myname='name' : myname='hostname';}
            }, 2000);}

});
//-----------------------------------------------SCHALTER Delete Voucher IQONTROL------------------------------------------------
on({id:  dpPrefix + "WLANUnifi.Wifi_Vouchers_ValueCodeList", ack: false, change: "any"}, function (obj) { 

   if (!nichtSchalten){
      var mybodyVouchers;
      var icodeNumber = getState(dpPrefix + "WLANUnifi.Wifi_Vouchers_ValueCodeList").val;
      mylog(icodeNumber)
      var  id_var=listValue[icodeNumber-1]
      //   Orginal JSON Daten
      /*   mybodyVouchers = {cmd:'delete-voucher',_id:id_var}  ;*/
      if(id_var !== "Voucher-Code-Auswahl") {
          var x = "{cmd:'delete-voucher',_id:\'"+id_var+"\'}" 
          eval('var mybodyVouchers='+x);
          mylog(mybodyVouchers);                                       
          deleteVoucher(mybodyVouchers);
          nichtSchalten=true;
          setState(dpPrefix + "WLANUnifi.Wifi_Vouchers_ValueCodeList",listValue2.length+1)
        } else {log("Wähle Code aus !!!","warn")}
    } else {nichtSchalten=false;}
 });


//-----------------------------------------------SCHALTER Delete Voucher------------------------------------------------
on({id:  dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_Delete_Voucher.Delete",  val: true}, function (obj) { 
   var mybodyVouchers;
   var id_var = getState(dpPrefix +  "WLANUnifi.Wifi_Vouchers-CODES.A_Delete_Voucher.Voucher_ID").val;
   var id_var2 = getState(dpPrefix +  "WLANUnifi.Wifi_Vouchers_DeleteVIS").val
   if (id_var !=="must be set"  ) {
       mylog("lösche weil nicht must be set")
        //   Orginal JSON Daten
        /*   mybodyVouchers = {cmd:'delete-voucher',_id:id_var}  ;*/
        var x = "{cmd:'delete-voucher',_id:\'"+id_var+"\'}" 
        eval('var mybodyVouchers='+x);
        mylog(mybodyVouchers);                                            
        deleteVoucher(mybodyVouchers);
        setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_Delete_Voucher.Delete",false, 4000);
        setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_Delete_Voucher.Voucher_ID", "must be set" , 2000);

    } else { if(id_var2 != "xxx") {
        mylog("lösche weil nicht xxx")
            id_var=listValue[(id_var2-1)]; 
            mylog(id_var)
            var x = "{cmd:'delete-voucher',_id:\'"+id_var+"\'}" 
            eval('var mybodyVouchers='+x);
            mylog(mybodyVouchers);                                            
            deleteVoucher(mybodyVouchers);
            setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Vouchers_DeleteVIS",(respv.data.length+1),4000);
            setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_Delete_Voucher.Delete",false, 4000);}
           else {log("FEHLER IN createVoucher - sind die ID ausgewählt? gesetzt?","error");}}

});
//-----------------------------------------------SCHALTER One click create voucher------------------------------------------------
on({id:  dpPrefix + "WLANUnifi.Wifi_Vouchers_StandardList", ack: false, change: "any"}, function (obj) { 
  
      var ValueList = getState(dpPrefix + "WLANUnifi.Wifi_Vouchers_StandardList").val;
      if (ValueList!=(countie+1)) {
     
           expire_var = standardVouchers[vouchiesDPs[ValueList-1]].dauer; 
           n_var      = standardVouchers[vouchiesDPs[ValueList-1]].anzahl;
           quota_var  = standardVouchers[vouchiesDPs[ValueList-1]].multiuse; 
           note_var   = standardVouchers[vouchiesDPs[ValueList-1]].notiz; 
           up_var     = standardVouchers[vouchiesDPs[ValueList-1]].upload;
           down_var   = standardVouchers[vouchiesDPs[ValueList-1]].download; 
           MBytes_var = standardVouchers[vouchiesDPs[ValueList-1]].mb_begrenzung; 
  
    execCreateVoucher();
    setState(dpPrefix + "WLANUnifi.Wifi_Vouchers_StandardList",(countie+1));
      }
         
 });
//-----------------------------------------------SCHALTER Create standard Voucher vis------------------------------------------------
on({id: dpPrefix + "WLANUnifi.Wifi_Vouchers_CreateStandard",  change: "ne"}, function (obj) { 
   mylog("schalteeeeee")
    let stateHelper = parseInt(getState( dpPrefix + "WLANUnifi.Wifi_Vouchers_CreateStandard").val)
    mylog(stateHelper.toString())
    //log(standardVouchers[vouchiesDPs[stateHelper-2]].notiz);
    if ( stateHelper > 1 ){
       mylog("gewwählt: "+standardVouchers[vouchiesDPs[stateHelper-2]].notiz);
           expire_var = standardVouchers[vouchiesDPs[stateHelper-2]].dauer; 
           n_var      = standardVouchers[vouchiesDPs[stateHelper-2]].anzahl;
           quota_var  = standardVouchers[vouchiesDPs[stateHelper-2]].multiuse; 
           note_var   = standardVouchers[vouchiesDPs[stateHelper-2]].notiz; 
           up_var     = standardVouchers[vouchiesDPs[stateHelper-2]].upload;
           down_var   = standardVouchers[vouchiesDPs[stateHelper-2]].download; 
           MBytes_var = standardVouchers[vouchiesDPs[stateHelper-2]].mb_begrenzung; 

           execCreateVoucher();
    }
   
    setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Vouchers_CreateStandard",1,4000);

   });  

//-----------------------------------------------SCHALTER Create own Voucher------------------------------------------------
on({id:  dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Create",  val: true}, function (obj) { 
 
    expire_var = getState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Dauer").val;
    n_var      = getState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Anzahl").val ;
    quota_var  = getState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.MultiUse").val ;
    note_var   = getState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Notiz").val;
    up_var     = getState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Upload").val ;
    down_var   = getState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Download").val;
    MBytes_var = getState(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Mb_Begrenzung").val ;
  
    execCreateVoucher();

});
//-----------------------------------------------Create Voucher Funktion------------------------------------------------
function execCreateVoucher(){
    mylog("bin in execCreateVoucher")
     if (expire_var !="must be set" && n_var!="must be set" && quota_var!="must be set" &&  !clientPause)  {
     //   Orginal JSON Daten
     /*   mybodyVouchers = {cmd:'create-voucher',expire:expire_var,   
                                        n:n_var, 
                                        quota:quota_var,
                                        note:note_var,
                                        up:up_var, 
                                        down:down_var,  
                                        MBytes:MBytes_var };*/

      var x = "{cmd:'create-voucher',expire:"+expire_var+", n:"+n_var+", quota:"+quota_var+","

        if (note_var != "")   x= x.concat('note:\"'+note_var+'\",')
        if (up_var != "")     x= x.concat("up:"+up_var+",")
        if (down_var != "")   x= x.concat("down:"+down_var+",")                                                        
        if (MBytes_var != "") x= x.concat("MBytes:"+MBytes_var+",")  

      x=x.substr(0, x.length-1);
      x=x.concat("}");
      //log (x);
      eval('var mybodyVouchers2='+x);
      mylog(mybodyVouchers2);
                                                   
      createVoucher(mybodyVouchers2);

    } else {log("FEHLER IN createVoucher - sind die 'must be set' Werte gesetzt?","error")}

   setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Create",false, 4000);
   setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Dauer", "must be set" , 2000);
   setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Anzahl", "must be set", 2000);
   setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.MultiUse", "must be set", 2000);
   setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Notiz", "", 2000);
   setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Upload", "", 2000);
   setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Download", "", 2000);
   setStateDelayed(dpPrefix + "WLANUnifi.Wifi_Vouchers-CODES.A_New_Voucher.Mb_Begrenzung", "", 2000);
   mylog("bin raus aus execCreateVoucher")
} 



//--------------------------------------------Midnight Data WAN1-------------------------------------
schedule("0 0 * * *",  function () {   

   /*  log("-----TAG:"+ ( new Date()).toString(),"error");
    log("-----TAG:"+ ( new Date("now")).toString(),"error");*/
   // log(formatDate(getDateObject((new Date().getTime())), "TT").toString());
 //log( "bin in schedule und setze tag und addiere monat", "error");
   if ( formatDate(getDateObject((new Date().getTime())), "TT").toString() =="01" ) {
                      //log( "yes", "error");
                      monthChangeData=true;
                      //taglein="01"
                      
                      }
                      else{
                        //log("no - und Tag"+formatDate(getDateObject((new Date().getTime())), "TT").toString(),"error");
                      monthChangeData=false;

                      } 

  midnight=true;
  

        });

//-----------------------------------------------MAIN LOOP------------------------------------------------
 var intervalMain= setInterval(async () => {

    binAmArbeiten=true;
    mylog(midnight.toString());

       if (firstTime<3){ //für clientPAuse
         for (let suche in wifis) {
            if ( getState(dpPrefix + "WLANUnifi."+suche).val !== null ) {firstTime=15;mylog("datanpunkt vorhanden")
            } else {mylog("datanpunkt inicht geschrieben");}}}


     scriptCounter++
     mylog("-----------------------SCRIPTCOUNTER------------------ ist : " + scriptCounter );
     setState(dpPrefix + "WLANUnifi.ZyklusZaehler",scriptCounter)
     mylog(loggedIn.toString())
         
     await login().catch(alarm1)  

    dlog("_____"+firstTime.toString());

if (loggedIn) {
       if (alarmCounter > 5) {log("Unifi Sript funktioniert wieder - Verbindung wieder hergestellt","error");}
       if (alarmCounter > 0) {alarmCounter=0; }
     
   
    

     


       if (!ohneClientAbfrage)  await getClients().catch(alarm3)  ;
       if (vouchers) await getVouchers().catch(alarm4);
       if (health)   await getHealth().catch(alarm7);
    mylog("----------------------Werte Alarme: " + testerrl + " - " + testerrc+ " - " +testerrv + " - "+testerrs + " - "+testerrh);
       if ( !testerrl && !testerrc && !testerrv && !testerrs && !testerrh ) {
           if (vouchers) workVouchers();
           if (!clientPause && !ohneClientAbfrage) workClients();
           if ( scriptCounter>=3) {
                scriptCounter=0
                await getAlarm().catch(alarm9);
                workAlarm();
                mylog("health und APs")
                if (health) {workHealth();}
                    if (apInfo) { mylog(" APs");
                              apListe = "";
                              apListeTable="";
                              for(let ap_name in apName) {  
                                     await getAp(ap_name).catch(alarm8);
                                     apListeTable=apListeTable+"<tr><td>&ensp;</td><td>&ensp;</td></tr><tr style=\"color:"+color_iqontrol_text__voucher_ueberschrift+";\"><td><b>Device:</b></td><td><b><i>"
                                     +apName[ap_name].aname+"</i></b></td></tr>";
                                     workAP(apName[ap_name].aname); } 
                                  //schreibe Health mitAPs
                                 // mylog("bin am schreiben","error");
                                  writeMyFile(healthListe + apListe + tableAus+"</body>", pathInfo);
                                 setState(dpPrefix + "WLANUnifi.Wifi_Info", "<table>"+healthListeTable +apListeTable + tableAus);
                     } else {  //Schreibe Health ohne APs
                              writeMyFile(apHead+healthListe+tableAus+"</body>", pathInfo);
                              setState(dpPrefix + "WLANUnifi.Wifi_Info", "<table>"+ healthListeTable  + tableAus);
                    }
                
            }
         }
         
         
          
    for(let wifi_name in wifis) {
        if ( firstTime == 3 && getState(dpPrefix + "WLANUnifi."+wifi_name).val !== null ) firstTime = 3;
        await getStatus(wifis[wifi_name]).catch(alarm6)}   

      
    
}   else { alarmCounter++; 
           if (alarmCounter > 5) {log("Unifi Sript hat 'Problem mit Einloggen - Prüfe Unifi Controller, Port, Einlog-Daten","error");
                                  if  (!testerrv) log("evtl. Vouchers deaktivieren","warn");}}

                                
   if (clientPause) {
         var interim=parseInt(new Date().getTime());
         log("Unifi Script ist in Pause wegen WLAN Umschalteung- bis: " + formatDate(clientPauseVal + clientPauseConst, "SS:mm:ss"),"warn");
         if (interim - clientPauseVal > clientPauseConst) {clientPause=false;setState(dpPrefix + "WLANUnifi.Wifi_Client_Pause",false);
           log("Unifi Script hat Pause beendet"  );}  }

           
  testerrc=false;
      testerrv=false;
       testerrs=false;
        testerrl=false;
         testerrc=false;
          testerrh=false;
           testerrap=false;
             testerral=false;

    binAmArbeiten=false;
    if ( scriptCounter>=3) { scriptCounter=0 ;} 

    }, abfragezyklus); // wird oben definiert



function alarm12() {log("Im Unifi Script stimmte etwas nicht - Alarm13 - Delete Voucher","warn");     loggedIn=false; testerrdv=false;cookies=[];} 
function alarm12() {log("Im Unifi Script stimmte etwas nicht - Alarm12 - Create Voucher","warn");     loggedIn=false; testerrcv=false;cookies=[];}   
function alarm11() {log("Im Unifi Script stimmte etwas nicht - Alarm11 - WLAN schalten","warn");      loggedIn=false; testerrws=false;cookies=[];} 

function alarm9() {log("Im Unifi Script stimmte etwas nicht - Alarm9 - Alarms","warn");               loggedIn=false; testerral=false;cookies=[];} 
function alarm8() {log("Im Unifi Script stimmte etwas nicht - Alarm8 - APs","warn");                  loggedIn=false; testerrap=false;cookies=[];} 
function alarm7() {log("Im Unifi Script stimmte etwas nicht - Alarm7 - Health","warn");               loggedIn=false; testerrh=false;cookies=[];}   
function alarm6() {log("Im Unifi Script stimmte etwas nicht - Alarm6 - Statusabfrage","warn");        loggedIn=false; testerrs=false;cookies=[];}    
function alarm5() {log("Im Unifi Script stimmte etwas nicht - Alarm5 - logout","warn");               loggedIn=false; testerrl=false;cookies=[];}    
function alarm4() {log("Im Unifi Script stimmte etwas nicht - Alarm4 - getVouchers-Login","warn");    loggedIn=false; testerrv=false;cookies=[];}
function alarm3() {log("Im Unifi Script stimmte etwas nicht - Alarm3 - getClient-Login","warn");      loggedIn=false; testerrc=false;cookies=[];}
function alarm1() {log("Im Unifi Script stimmte etwas nicht - Alarm1 - Login fehlgeschlagen","warn"); loggedIn=false; ;alarmSwitch=true }



// Beispiel für
//setWifi(true, wifis.WLAN_DragonGuest);




