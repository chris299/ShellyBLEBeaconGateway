// v0.7 JavaScript (shelly scripting, see https://shelly-api-docs.shelly.cloud/gen2/Scripts/ShellyScriptLanguageFeatures)
// 2025-06-05
// based on https://github.com/ALLTERCO/shelly-script-examples/blob/main/ble-shelly-scanner.js
// and https://github.com/iobroker-community-adapters/ioBroker.shelly/blob/master/docs/en/ble-devices.md
// XIAOMI protocol: https://iot.mi.com/new/doc/accesses/direct-access/embedded-development/ble/ble-mibeacon
// XIAMOI Object IDs https://iot.mi.com/new/doc/accesses/direct-access/embedded-development/ble/object-definition
// BTHome format: https://bthome.io/format/


const SCRIPT_VERSION = '0.5';
const BTHOME_SVC_ID_STR = 'fcd2';
const XIAOMI_SVC_ID_STR = 'fe95';
const ALLTERCO_MFD_ID_STR = '0ba9';
const xiaomi_mfd_id_str = '038f';    // not used

let debug = 1;

const uint8 = 0;
const int8 = 1;
const uint16 = 2;
const int16 = 3;
const uint24 = 4;
const int24 = 5;
const uint32 = 6;
const int32 = 7;

let SHELLY_ID = undefined;

const BTH = {
    // Misc
    0x00: { n: 'pid', t: uint8 },
    0xf0: { n: 'device_type', t: uint16 },
    0xf1: { n: 'firmware_version', t: uint32 },
    0xf2: { n: 'firmware_version', t: uint24 },
    // Sensor data
    0x51: { n: 'acceleration', t: uint16, f: 0.001, u: 'm/s²' },
    0x01: { n: 'battery', t: uint8, u: '%' },
    0x12: { n: 'co2', t: uint16, u: 'ppm' },
    0x09: { n: 'count', t: uint8 },
    0x3d: { n: 'count', t: uint8 },
    0x3e: { n: 'count', t: uint8 },
    0x43: { n: 'current', t: uint16, f: 0.001, u: 'A' },
    0x08: { n: 'dewpoint', t: int16, f: 0.01, u: '°C' },
    0x40: { n: 'distance_mm', t: uint16, u: 'mm' },
    0x41: { n: 'distance_m', t: uint16, f: 0.1, u: 'm' },
    0x42: { n: 'duration', t: uint24, f: 0.001, u: 's' },
    0x4d: { n: 'energy', t: uint32, f: 0.001, u: 'kWh' },
    0x0a: { n: 'energy', t: uint24, f: 0.001, u: 'kWh' },
    0x4b: { n: 'gas', t: uint24, f: 0.001, u: 'm3' },
    0x4c: { n: 'gas', t: uint32, f: 0.001, u: 'm3' },
    0x52: { n: 'gyroscope', t: uint16, f: 0.001, u: '°/s' },
    0x03: { n: 'humidity', t: uint16, f: 0.01, u: '%' },
    0x2e: { n: 'humidity', t: uint8, u: '%' },
    0x05: { n: 'illuminance', t: uint24, f: 0.01, u: 'lux' },
    0x06: { n: 'mass_kg', t: uint16, f: 0.01, u: 'kg' },
    0x07: { n: 'mass_lb', t: uint16, f: 0.01, u: 'lb' },
    0x14: { n: 'moisture', t: uint16, f: 0.01, u: '%' },
    0x2f: { n: 'moisture', t: uint8, u: '%' },
    0x0d: { n: 'pm2_5', t: uint16, u: 'ug/m3' },
    0x0e: { n: 'pm10', t: uint16, u: 'ug/m3' },
    0x0b: { n: 'power', t: uint24, f: 0.01, u: 'W' },
    0x04: { n: 'pressure', t: uint24, f: 0.01, u: 'hPa' },
    0x3f: { n: 'rotation', t: int16, f: 0.1, u: '°' },
    0x44: { n: 'speed', t: uint16, f: 0.01, u: 'm/s' },
    0x45: { n: 'temperature', t: int16, f: 0.1, u: '°C' },
    0x02: { n: 'temperature', t: int16, f: 0.01, u: '°C' },
    0x13: { n: 'tvoc', t: uint16, u: 'ug/m3' },
    0x0c: { n: 'voltage', t: uint16, f: 0.001, u: 'V' },
    0x4a: { n: 'voltage', t: uint16, f: 0.1, u: 'V' },
    0x4e: { n: 'volume', t: uint32, f: 0.001, u: 'l' },
    0x47: { n: 'volume', t: uint16, f: 0.1, u: 'l' },
    0x48: { n: 'volume', t: uint16, u: 'ml' },
    0x55: { n: 'volume', t: uint32, f: 0.001, u: 'l' },
    0x49: { n: 'volume', t: uint16, f: 0.001, u: 'm3/h' },
    0x46: { n: 'uv_index', t: uint8, f: 0.1 },
    0x4f: { n: 'water', t: uint32, f: 0.001, u: 'l' },
    // Binary Sensor data
    0x15: { n: 'battery', t: uint8 },
    0x16: { n: 'battery_charging', t: uint8 },
    0x17: { n: 'carbon_monoxide', t: uint8 },
    0x18: { n: 'cold', t: uint8 },
    0x19: { n: 'connectivity', t: uint8 },
    0x1a: { n: 'door', t: uint8 },
    0x1b: { n: 'garage_door', t: uint8 },
    0x1c: { n: 'gas', t: uint8 },
    0x0f: { n: 'generic_boolean', t: uint8 },
    0x1d: { n: 'heat', t: uint8 },
    0x1e: { n: 'light', t: uint8 },
    0x1f: { n: 'lock', t: uint8 },
    0x20: { n: 'moisture', t: uint8 },
    0x21: { n: 'motion', t: uint8 },
    0x22: { n: 'moving', t: uint8 },
    0x23: { n: 'occupancy', t: uint8 },
    0x11: { n: 'opening', t: uint8 },
    0x24: { n: 'plug', t: uint8 },
    0x10: { n: 'power', t: uint8 },
    0x25: { n: 'presence', t: uint8 },
    0x26: { n: 'problem', t: uint8 },
    0x27: { n: 'running', t: uint8 },
    0x28: { n: 'safety', t: uint8 },
    0x29: { n: 'smoke', t: uint8 },
    0x2a: { n: 'sound', t: uint8 },
    0x2b: { n: 'tamper', t: uint8 },
    0x2c: { n: 'vibration', t: uint8 },
    0x2d: { n: 'window', t: uint8 },
    // Events
    0x3a: { n: 'button', t: uint8, b: 1 },
    0x3c: { n: 'dimmer', t: uint8 }
};

function getByteSize(type) {
    if (type === uint8 || type === int8) return 1;
    if (type === uint16 || type === int16) return 2;
    if (type === uint24 || type === int24) return 3;
    // impossible as advertisements are much smaller
    return 255;
}

let BTHomeDecoder = {
    utoi: function (num, bitsz) {
        let mask = 1 << (bitsz - 1);
        return num & mask ? num - (1 << bitsz) : num;
    },
    getUInt8: function (buffer) {
        return buffer.at(0);
    },
    getInt8: function (buffer) {
        return this.utoi(this.getUInt8(buffer), 8);
    },
    getUInt16LE: function (buffer) {
        return 0xffff & ((buffer.at(1) << 8) | buffer.at(0));
    },
    getInt16LE: function (buffer) {
        return this.utoi(this.getUInt16LE(buffer), 16);
    },
    getUInt24LE: function (buffer) {
        return (
            0x00ffffff & ((buffer.at(2) << 16) | (buffer.at(1) << 8) | buffer.at(0))
        );
    },
    getInt24LE: function (buffer) {
        return this.utoi(this.getUInt24LE(buffer), 24);
    },
    getUInt32LE: function (buffer) {
        return (
            0x00ffffffff & ((buffer.at(3) << 24) | (buffer.at(2) << 16) | (buffer.at(1) << 8) | buffer.at(0))
        );
    },
    getInt32LE: function (buffer) {
        return this.utoi(this.getUInt32LE(buffer), 32);
    },
    getBufValue: function (type, buffer) {
        if (buffer.length < getByteSize(type)) return null;
        let res = null;
        if (type === uint8) res = this.getUInt8(buffer);
        if (type === int8) res = this.getInt8(buffer);
        if (type === uint16) res = this.getUInt16LE(buffer);
        if (type === int16) res = this.getInt16LE(buffer);
        if (type === uint24) res = this.getUInt24LE(buffer);
        if (type === int24) res = this.getInt24LE(buffer);
        if (type === uint32) res = this.getUInt32LE(buffer);
        if (type === int32) res = this.getInt32LE(buffer);
        return res;
    },
    unpack: function (buffer) {
        // beacons might not provide BTH service data
        if (typeof buffer !== 'string' || buffer.length === 0) return null;
        let result = {};
        let _dib = buffer.at(0);
        result['encryption'] = _dib & 0x1 ? true : false;
        result['BTHome_version'] = _dib >> 5;
        if (result['BTHome_version'] !== 2) return null;
        // can not handle encrypted data
        if (result['encryption']) return result;
        buffer = buffer.slice(1);

        let _bth;
        let _value;
        let _name;
        let _btnNum = 1;
        while (buffer.length > 0) {
            _bth = BTH[buffer.at(0)];
            if (typeof _bth === 'undefined') {
                console.log('Error: unknown type ' + buffer.at(0));
                break;
            }
            buffer = buffer.slice(1);
            _value = this.getBufValue(_bth.t, buffer);
            if (_value === null) break;
            if (typeof _bth.f !== 'undefined') _value = _value * _bth.f;

            _name = _bth.n;
            if (typeof _bth.b !== "undefined") {
                _name = _name + '_' + _btnNum.toString();
                _btnNum++;
            }

            result[_name] = _value;
            buffer = buffer.slice(getByteSize(_bth.t));
        }
        return result;
    }
};

// Xiaomi Datentyp-Definitionen
const XIAOMI_OBJECT_DEFINITIONS = {
    0x1002: { n: 'sleep', f: 1 },
    0x1003: { n: 'rssi', f: 1 },
    0x1004: { n: 'temperature', f: 0.1, u: '°C' },
    0x1006: { n: 'humidity', f: 0.1, u: '%' },
    0x1007: { n: 'illuminance', f: 1, u: 'lux' },
    0x1008: { n: 'soil_moisture', f: 1, u: '%' },
    0x1009: { n: 'soil_ec', f: 1, u: 'µS/cm' },
    0x100A: { n: 'power', f: 1, u: 'W' },
    0x100E: { n: 'lock', f: 1 },
    0x100F: { n: 'door', f: 1 },
    0x1010: { n: 'formaldehyde', f: 0.01, u: 'mg/m³' },
    0x1011: { n: 'binding', f: 1 },
    0x1012: { n: 'switch', f: 1 },
    0x1013: { n: 'remaining_supplies', f: 1, u: '%' },
    0x1014: { n: 'flooding', f: 1 },
    0x1015: { n: 'smoke', f: 1 },
    0x1016: { n: 'gas', f: 1 },
    0x1017: { n: 'no_one_moving', f: 1 },
    0x1018: { n: 'light_intensity', f: 1 },
    0x1019: { n: 'door_sensor', f: 1 },
    0x101A: { n: 'weight', f: 1, u: 'g' },
    0x101B: { n: 'no_one_moves_timeout', f: 1 },
    0x101C: { n: 'smart_pillow', f: 1 },
    0x101D: { n: 'formaldehyde_new', f: 0.01, u: 'mg/m³' }
};

// Füge diese Funktion hinzu für erweiterte Speicher-Info
function getMemoryInfo() {
    // Shelly-spezifische Speicher-Info (falls verfügbar)
    Shelly.call("Sys.GetStatus", {}, function(result, error_code, error_msg) {
        if (error_code === 0 && result) {
         //   console.log('System Status: ' + JSON.stringify(result));
            if (result.ram_size) {
                console.log('RAM Total: ' + result.ram_size + ', Free: ' + result.ram_free);
            }
        }
    });
}


function escapeNonPrintable(str) {
    var result = "";
    for (var i = 0; i < str.length; i++) {
        var charCode = str.charCodeAt(i);
        // Nicht-druckbare Zeichen (0-31, außer Tab/LF/CR, und 127-255)
        if ((charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) || 
            charCode === 127 || charCode > 255) {
            var hex = charCode.toString(16);
            if (hex.length === 1) hex = "0" + hex;
            result += "\\x" + hex;
        } else {
            result += str.charAt(i);
        }
    }
    return result;
}



function hexToBytes(hexStr) {
    let bytes = [];
    for (let i = 0; i < hexStr.length; i += 2) {
      bytes.push(parseInt(hexStr.substr(i, 2), 16));
    }
    return bytes;
}

function byteToHex(byte) {
    let hex = byte.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}

function bytesToHexString(data) {
    let result = '';
    for (let i = 0; i < data.length; i++) {
        if (i > 0) result += ' ';
        result += byteToHex(data.at(i));
    }
    return result;
}

function padString(str, length, char) {
    while (str.length < length) {
        str = char + str;
    }
    return str;
}



// Nach der BTHomeDecoder-Klasse, fügen wir einen XiaomiDecoder hinzu
let XiaomiDecoder = {
    parseServiceData: function(serviceData) {
        if (serviceData.length < 5) {
            console.log('Xiaomi data too short');
            return null;
        }
        
        let result = {};
        
        // Frame Control - 2 bytes, little endian
        let frameControl = (serviceData.at(1) << 8) | serviceData.at(0);
        
        // Interpretiere die Frame Control Bits; definition from protocol version 5, earlier versions are slightly different   
        result.frame_control = {
            mesh: (frameControl & 0x0080) === 0x0080,            // Bit 7
            registered: (frameControl & 0x0100) === 0x0100,      // Bit 8
            solicited: (frameControl & 0x0200) === 0x0200,       // Bit 9
            auth_mode: (frameControl >> 10) & 0x03,              // Bits 10-11
            version: (frameControl >> 12) & 0x0F                 // Bits 12-15
        };
        
        // Wandle auth_mode in lesbaren Text um
        switch(result.frame_control.auth_mode) {
            case 0:
                result.frame_control.auth_mode_str = "Old version certification";
                break;
            case 1:
                result.frame_control.auth_mode_str = "Safety certification";
                break;
            case 2:
                result.frame_control.auth_mode_str = "Standard certification";
                break;
            case 3:
                result.frame_control.auth_mode_str = "Reserved";
                break;
        }
        
        // Prüfe auf unerwartete Mesh-Konfiguration
        if (result.frame_control.mesh) {
            console.log('Warnung: Mesh-Bit ist gesetzt, was für Standard BLE und High Security nicht erlaubt ist');
        }
        
        // Product ID - 2 bytes, little endian
        let productId = (serviceData.at(3) << 8) | serviceData.at(2);
        
        // Frame Counter - 1 byte
        let frameCounter = serviceData.at(4);
        
        // Prüfe ob Daten verschlüsselt sind (Bit 3)
        let isEncrypted = ((frameControl >> 3) & 1) === 1;
        if (isEncrypted) {
            console.log('Encrypted Xiaomi data not supported');
            return null;
        }
        
        let index = 5; // Start nach den ersten 5 Bytes
        
        // MAC Address wenn Bit 4 gesetzt
        if ((frameControl >> 4) & 1) {
            if (index + 6 > serviceData.length) return null;
            let mac = [];
            // Durchlaufe die Bytes in umgekehrter Reihenfolge
            for (let i = 5; i >= 0; i--) {
                mac.push(byteToHex(serviceData.at(index + i)));
            }
            result.mac = mac.join(':');
            index += 6;
        }
        
        // Capability wenn Bit 5 gesetzt
        if ((frameControl >> 5) & 1) {
            if (index + 1 > serviceData.length) return null;
            let capability = serviceData.at(index);
            result.capability = capability;
            
            // Interpretiere BondAbility (Bits 3-4)
            let bondAbility = (capability >> 3) & 0x03;  // Extrahiere Bits 3-4
            let bondType;
            switch(bondAbility) {
                case 0: bondType = "no binding"; break;
                case 1: bondType = "front binding"; break;
                case 2: bondType = "back binding"; break;
                case 3: bondType = "combo"; break;
            }
            
            // Interpretiere die einzelnen Capability-Bits
            result.capabilities = {
                connectable: (capability & 0x01) === 0x01,    // Bit 0
                centralable: (capability & 0x02) === 0x02,    // Bit 1
                encryptable: (capability & 0x04) === 0x04,    // Bit 2
                bond_ability: bondType                        // Bits 3-4
            };
            
            // Prüfe auf unbekannte gesetzte Bits (alle außer 0,1,2,3,4,5)
            let unknownBits = capability & ~(0x3F);  // 0x3F = Bits 0,1,2,3,4,5
            if (unknownBits !== 0) {
                let binaryStr = unknownBits.toString(2);
                let paddedBinary = padString(binaryStr, 8, '0');
                console.log('Warnung: Unbekannte Capability-Bits gesetzt: 0x' + capability.toString(16).toUpperCase() + 
                           ' (Bits: ' + paddedBinary + ')');
            }
            
            index += 1;
            
            // Wenn Bit 5 der Capability gesetzt ist, füge 2 weitere Bytes für IO-Capabilities hinzu
            if ((capability >> 5) & 1) {
                if (index + 2 > serviceData.length) {
                    console.log('Warnung: IO-Capability Bytes erwartet, aber nicht genügend Daten vorhanden');
                    return null;
                }
                result.io_capability = (serviceData.at(index + 1) << 8) | serviceData.at(index);
                index += 2;
            }
        }
        
        // Object Data wenn Bit 6 gesetzt
        if ((frameControl >> 6) & 1) {
            while (index + 4 <= serviceData.length) {
                // Object ID - 2 bytes, little endian
                let objectId = (serviceData.at(index + 1) << 8) | serviceData.at(index);
                // Object Length - 1 byte
                let objectLength = serviceData.at(index + 2);
                
                index += 3;
                
                if (index + objectLength > serviceData.length) {
                    console.log('Ungültige Objektlänge: Index + Länge überschreitet Datenlänge');
                    break;
                }
                
                // Object Data entsprechend der Length
                if (XIAOMI_OBJECT_DEFINITIONS[objectId]) {
                    let value = 0;
                    if (objectLength > 3) {
                        console.log('Warnung: Unerwartete Objektlänge ' + objectLength + ' Bytes für Objekt-ID: 0x' + objectId.toString(16).toUpperCase());
                        value = 0;
                    } else if (objectLength === 3) {
                        value = (serviceData.at(index + 2) << 16) | (serviceData.at(index + 1) << 8) | serviceData.at(index);
                    } else if (objectLength === 2) {
                        value = (serviceData.at(index + 1) << 8) | serviceData.at(index);
                    } else if (objectLength === 1) {
                        value = serviceData.at(index);
                    }
                    
                    let sensor = XIAOMI_OBJECT_DEFINITIONS[objectId];
                    if (sensor.f) {
                        value = value * sensor.f;
                    }
                    
                    result[sensor.n] = value;
                    if (sensor.u) {
                        result[sensor.n + '_unit'] = sensor.u;
                    }
                } else {
                    console.log('Unbekannte Xiaomi Objekt-ID: 0x' + objectId.toString(16).toUpperCase());
                }
                
                index += objectLength;
            }
        }
        
        // Füge Basis-Informationen hinzu
        result.frameControl = frameControl;
        result.productId = productId;
        result.frameCounter = frameCounter;
        
        return result;
    }
};

// Hilfsfunktion zum Ersetzen der Doppelpunkte 
function encodeMAC(mac) {
    let result = '';
    for (let i = 0; i < mac.length; i++) {
        if (mac[i] === ':') {
            result += '%3A';
        } else {
            result += mac[i];
        }
    }
    return result;
}

// Sensor Name Mapping 
const SENSOR_NAME_MAPPING = {
    'soil_ec': 'fertility',
    'soil_moisture': 'moisture'
};

function mapSensorName(originalName) {
    return SENSOR_NAME_MAPPING[originalName] || originalName;
}

let lastPacketId = 0x100;

const HTTP_HOST = '192.168.246.131:8093';
const HTTP_PATH = '/v1/state/';
const STATE_ID_PREFIX = 'ble.0.';


// Queue-System für HTTP-Aufrufe
let httpQueue = [];
let queueIndex = 0;
let activeHttpCalls = 0;
const MAX_CONCURRENT_CALLS = 2;



// Erweiterte Response-Handler Funktion
function handleStateUpdateResponse(response, error_code, error_message, ud) {
    // Reduziere die Anzahl der aktiven Aufrufe
    activeHttpCalls--;
    
    if (error_code !== 0 || response.code !== 200) {
        console.log('HTTP GET Fehler für ' + ud + ': ' + 
                  'Error Code: ' + error_code + 
                  ', Response Code: ' + (response ? response.code : 'N/A') +
                  ', Error Message: ' + error_message);
    }
    
    // Verarbeite nächsten Aufruf in der Queue
    processNextHttpCall();
    
    // Queue bereinigen wenn alle Elemente verarbeitet wurden  
    if (queueIndex >= httpQueue.length && activeHttpCalls === 0) {
      httpQueue = [];
      queueIndex = 0;
      if (debug == 1) {
        console.log('Queue bereinigt - alle HTTP-Calls abgeschlossen');
      }
    }
}

// Funktion zum Verarbeiten des nächsten HTTP-Aufrufs in der Queue
function processNextHttpCall() {
    // Prüfe ob Queue leer ist oder bereits maximale Anzahl von Aufrufen aktiv
    if (activeHttpCalls >= MAX_CONCURRENT_CALLS) {
       if (debug == 1) { console.log('next Call: call queued; index:' + queueIndex + '; lenght: ' + httpQueue.length);};
       return;
    }
    if (queueIndex >= httpQueue.length) {
        if (debug == 1) { console.log('next Call: Queue empty; index:' + queueIndex + '; lenght: ' + httpQueue.length);};
        return;
    }
    
    // Hole nächsten Aufruf aus der Queue
    let nextCall = httpQueue[queueIndex];
    //speicher in der queue freigeben
    httpQueue[queueIndex] = null;

    
    if (debug == 1) {
      console.log('current index :' + queueIndex + ' ; current active:' + activeHttpCalls + ' ;  current url: ', nextCall.url);
     // console.log(JSON.stringify(Shelly.getMemoryUsage()));
      getMemoryInfo();
    };
    
    queueIndex++;
    activeHttpCalls++;
    
    // Führe den HTTP-Aufruf aus
    Shelly.call(
        "HTTP.GET",
        { url: nextCall.url },
        handleStateUpdateResponse,
        nextCall.stateId
    );
}



// Modifizierte sendStateUpdate Funktion mit Queue
function sendStateUpdate(mac, sensorName, value) {
    let mappedName = mapSensorName(sensorName);
    let stateId = STATE_ID_PREFIX + encodeMAC(mac) + '.' + mappedName;
    let url = 'http://' + HTTP_HOST + HTTP_PATH + stateId + 
             '?withInfo=false&timeout=0&value=' + value;

    // Füge Aufruf zur Queue hinzu
    httpQueue[httpQueue.length] = {
        url: url,
        stateId: stateId
    };
    
    // Versuche sofort einen Aufruf zu verarbeiten
    processNextHttpCall();
}

function handleMqttConfig(res, err_code, err_msg, ud) {
    SHELLY_ID = res['topic_prefix'];
    init();
}

function sanitizeForJSON(obj) {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
        // Prüfe jeden Character auf verdächtige Werte
        var hasNonPrintable = false;
        for (var i = 0; i < obj.length; i++) {
            var code = obj.charCodeAt(i);
            // Alles außer druckbaren ASCII-Zeichen (32-126) und üblichen Whitespace-Zeichen
            if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
                hasNonPrintable = true;
                break;
            }
            if (code === 127 || code > 255) {
                hasNonPrintable = true;
                break;
            }
        }
        
        // Wenn verdächtige Zeichen gefunden, konvertiere zu Hex
        if (hasNonPrintable) {
            var hex = "";
            for (var i = 0; i < obj.length; i++) {
                var code = obj.charCodeAt(i);
                hex += (code < 16 ? "0" : "") + code.toString(16);
            }
            return "hex:" + hex;
        }
        
        return obj;
    }
    
    if (typeof obj === 'object') {
        if (Array.isArray(obj)) {
            return obj.map(sanitizeForJSON);
        } else {
            var result = {};
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    result[key] = sanitizeForJSON(obj[key]);
                }
            }
            return result;
        }
    }
    
    return obj;
}




// Callback for the BLE scanner object
function bleScanCallback(event, result) {
    // exit if not a result of a scan (2 = scan result )
    if (event !== BLE.Scanner.SCAN_RESULT) {
    //    console.log('Unexpected BLE event:', event);
        return;
    };

    // Log raw BLE event data with event type
    
   if (debug == 7) {
          try {
            var sanitizedData = sanitizeForJSON(result);
            // creates stack size issues
            console.log('BLE Event Result:' + JSON.stringify(sanitizedData));
          } catch (e) {
            console.log('BLE Event Result: [Error serializing data]');
            console.log('Error:', e.message);
          }
    }
   
    if (debug == 2) {
      if (typeof result.addr !== 'undefined') {console.log('Address: ', result.addr);};
      if (typeof result.local_name !== 'string') {console.log('local name: ', result.local_name);};
    };
 
   
   if (debug == 2) {
 //   console.log('BLE Event Result:' + JSON.stringify(result));

  //    console.log('BLE Event Result:',result);
     if (typeof result.service_data !== 'undefined') {
        try {
          var sanitizedData = sanitizeForJSON(result.service_data);
          console.log('BLE Event Result from: ' + result.addr + ' service_data: ' + JSON.stringify(sanitizedData));
        } catch (e) {
          console.log('BLE Event Result.service_data: [Error serializing data]');
          console.log('Error:', e.message);
        }
       
       
     //   console.log(result.service_data);
 
     
      // console.log(bytesToHexString(result.service_data));
     }
//     console.log(bytesToHexString(result.service_data));
//     console.log('Raw BLE event data (hex):', JSON.stringify(result, function(key, value) {
//         if (typeof value === 'string' && key === 'service_data') {
//             // Konvertiere String-Daten in Hex-Darstellung
//             return Array.from(value).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
//         }
//         return value;
//     }));
    }

    //console.log(result);
//console.log('Xiaomi Packed Data:');
// console.log(bytesToHexString(result.service_data[XIAOMI_SVC_ID_STR]));
//console.log('BLE Event Result [sd_fe]:' + result.service_data[XIAOMI_SVC_ID_STR]);
//console.log('BLE Event Result [adr]:' + result.addr);
//console.log('BLE Event Result [at]:' + result.addr_type);
//console.log('BLE Event Result [ad]:' + result.advData);
//console.log('BLE Event Result [sr]:' + result.scanRsp);
//console.log('BLE Event Result [rs]:' + result.rssi);
//console.log('BLE Event Result [fl]:' + result.flags);
//console.log('BLE Event Result [ln]:' + result.local_name);
//console.log('BLE Event Result [md]:' + result.manufacturer_data);
//console.log('BLE Event Result [su]:' + result.service_uuids);
//console.log('BLE Event Result [sd]:' + result.service_data.fe95);
//console.log('BLE Event Result [tx]:' + result.tx_power_level);


    let unpackedData = null;
    let protocol = '';
 //   console.log(bytesToHexString(serviceData));

 
    // Prüfe auf Xiaomi Service Data
    if (typeof result.service_data !== 'undefined' && 
      typeof result.service_data[XIAOMI_SVC_ID_STR] !== 'undefined') {
        if (debug == 2) {
           console.log('Xiaomi Service Data(hex):' + bytesToHexString(result.service_data[XIAOMI_SVC_ID_STR]));
           // Ausgabe: "12 34 ab cd"
        }
        unpackedData = XiaomiDecoder.parseServiceData(result.service_data[XIAOMI_SVC_ID_STR]);
        protocol = 'xiaomi';
        if (debug == 2) {
           console.log('Xiaomi Service Data: ' + JSON.stringify(unpackedData));
        };
    }
    // Prüfe auf BTHome Service Data
    else if (typeof result.service_data !== 'undefined' && 
         typeof result.service_data[BTHOME_SVC_ID_STR] !== 'undefined') {
           if (debug == 1) {
             console.log('BTHOME Service Data(hex):' + bytesToHexString(result.service_data[BTHOME_SVC_ID_STR]));
             // Ausgabe: "12 34 ab cd"
           };
          unpackedData = BTHomeDecoder.unpack(result.service_data[BTHOME_SVC_ID_STR]);
          protocol = 'bthome';
          if (debug == 1) {
            console.log('BTHome Service Data: ' + JSON.stringify(unpackedData));
          };
    } else {
        if (debug == 2) {
          console.log('No valid service data found');
        };
        if (typeof result.service_data !== 'undefined' && result.service_data !== null) {
            console.log(bytesToHexString(result.service_data));
        }
        return;
    }

    // exit if unpacked data is null or the device is encrypted
    if (unpackedData === null || 
        typeof unpackedData === 'undefined' || 
        (protocol === 'bthome' && unpackedData['encryption'])) {
        console.log('unpacked data is null or encrypted');
        return;
    }

    // Für BTHome Protocol: Prüfe auf doppelte Pakete
    if (protocol === 'bthome' && lastPacketId === unpackedData.pid) {
        return;
    }

    if (protocol === 'bthome') {
        lastPacketId = unpackedData.pid;
    }

    unpackedData.rssi = result.rssi;
    unpackedData.address = result.addr;

    // create MQTT-Payload
    let message = {
        scriptVersion: SCRIPT_VERSION,
        src: SHELLY_ID,
        srcBle: {
            type: result.local_name,
            mac: result.addr,
            protocol: protocol
        },
        payload: unpackedData
    };

  // console.log('MQTT-Payload: ' + JSON.stringify(message));

    if (MQTT.isConnected()) {
     //   MQTT.publish(SHELLY_ID + '/events/ble', JSON.stringify(message)); // dont publish for now
    } else {
        console.log('MQTT is not connected. Message cannot be sent.');
    }

    if (protocol === 'xiaomi') {
        // Sende jeden Sensorwert einzeln per HTTP PATCH
        for (let key in unpackedData) {
            // Überspringe Metadaten und rssi (wird separat gesendet)
            if (key.indexOf('_unit') !== key.length - 5 &&
                key !== 'frame_control' && 
                key !== 'frameControl' && 
                key !== 'capability' && 
                key !== 'capabilities' && 
                key !== 'productId' && 
                key !== 'frameCounter' && 
                key !== 'mac' && 
                key !== 'address' &&
                key !== 'io_capability' &&
                key !== 'rssi') {  // rssi zur Liste hinzugefügt
                sendStateUpdate(result.addr, key, unpackedData[key]);
            }
        }
        
        // Sende RSSI separat
        //sendStateUpdate(result.addr, 'rssi', result.rssi);
    }

    
}

// Initializes the script and performs the necessary checks and configurations
function init() {
    console.log('init started');
    // get the config of ble component
    let bleConfig = Shelly.getComponentConfig('ble');
    console.log('bleConfig: ' + JSON.stringify(bleConfig));
    // exit if the BLE isn't enabled
    if (!bleConfig.enable) {
        console.log('Error: The Bluetooth is not enabled, please enable it in the settings');
        return;
    }

    // check if the scanner is already running
    if (BLE.Scanner.isRunning()) {
        console.log('Info: The BLE gateway is running, the BLE scan configuration is managed by the device');
    } else {
        // start the scanner
        let bleScanner = BLE.Scanner.Start({
            duration_ms: BLE.Scanner.INFINITE_SCAN,
            active: true
        });

        if (!bleScanner) {
            console.log('Error: Can not start new scanner');
        } else {
            console.log('Success: BLE Scanner started successfully');
        }
    }

    BLE.Scanner.Subscribe(bleScanCallback);
}

console.log('script started');
Shelly.call('Mqtt.GetConfig', '', handleMqttConfig);