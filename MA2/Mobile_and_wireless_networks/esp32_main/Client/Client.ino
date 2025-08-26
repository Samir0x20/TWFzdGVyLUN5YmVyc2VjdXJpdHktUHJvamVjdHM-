#include <dht11.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <GCM.h>
#include <AES.h>
#include <Base64.h>


typedef struct s_DHT11Data
{
    float temperature;
    float humidity;
}   DHT11Data;


const int dht11Pin = 26;
const int buttonPin = 27;
const int redLedPin = 32;
const int whiteLedPin = 33; 
int buttonState = 0; 

const char* ssid = "VIRUS";
const char* password = "V9988b00";
const char* mqtt_server_ip = "10.66.159.99";
const int   mqtt_server_port = 1883;
const char* topic = "sensor/data";


dht11 DHT11;
String local_ip;
String client_id;

int counter = 0;


GCM<AES128> gcm;
const int KEY_LENGTH = 16;
const int IV_LENGTH = 16;
const int TAG_LENGTH = 16;
const int ID_LENGTH = 8;


const char* id = "iyBY5fHf";
//const char* id = "H4RKwSde";

uint8_t key[KEY_LENGTH] = {0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6, 0xab, 0xf7, 0x97, 0x75, 0x46, 0x43, 0x4e, 0x10};
//uint8_t key[KEY_LENGTH] = {0x5c, 0x0a, 0x55, 0x3b, 0x34, 0x97, 0x3a, 0x10, 0xb4, 0xee, 0xdd, 0x19, 0xb8, 0x57, 0xae, 0xfd};

WiFiClient espClient;
PubSubClient client(espClient);


void setup() 
{ 
    Serial.begin(115200);

    InitPins();
    InitCrypto();

    InitWiFi();
    InitMQTTConnection(mqtt_server_ip, mqtt_server_port, client_id.c_str());
}

void InitCrypto()
{
    gcm.setKey(key, KEY_LENGTH);
}

void InitPins()
{    
    pinMode(redLedPin, OUTPUT);
    pinMode(whiteLedPin, OUTPUT);
    pinMode(buttonPin, INPUT);
}

void InitWiFi()
{

    while (WiFi.status() != WL_CONNECTED)
    {
        WiFi.begin(ssid, password);
        delay(1000);
        Serial.println("Connecting to WiFi...");
        digitalWrite(whiteLedPin, LOW);
        digitalWrite(redLedPin, HIGH);

    }

    local_ip = WiFi.localIP().toString();
    client_id = WiFi.macAddress();

    Serial.println("Connected to WiFi!");
    Serial.printf("IP address: %s.\n", local_ip);
}

void InitMQTTConnection(const char* ip, uint16_t port, const char* id)
{
    client.setServer(ip, port);
  
    while (!client.connected()) 
    {
        if (client.connect(id))
            Serial.println("Connected to MQTT server.");
        else
        {
            Serial.println("Connecting to MQTT...");
            digitalWrite(whiteLedPin, LOW);
            digitalWrite(redLedPin, HIGH);
        }
            
            
        delay(1000);
    }
}

void PublishMessage(const char* topic, const char* message)
{
    client.publish(topic, message);
}

DHT11Data QueryDHT11()
{
    DHT11Data result;
    
    DHT11.read(dht11Pin);

    result.temperature = (float)DHT11.temperature;
    result.humidity = (float)DHT11.humidity;

    return result;
}

void PrintBuffer(const char* prefix, const char* format, uint8_t* buffer, size_t len)
{
    Serial.printf("%s", prefix);
    for (size_t i = 0; i < len; i++)
        Serial.printf(format, (const char*) buffer[i]);
    Serial.println();
}

void PrintBuffer(const char* format, uint8_t* buffer, size_t len)
{
    for (size_t i = 0; i < len; i++)
        Serial.printf(format, (const char*) buffer[i]);
    Serial.println();
}

void EncryptMessage(uint8_t* iv, String message, size_t msgLength, uint8_t* output)
{
    size_t length = msgLength;
    const char* plaintext = message.c_str();
    uint8_t ciphertext[length];
    uint8_t result[length];

    memset(ciphertext, 0, sizeof(ciphertext));
    memset(result, 0, sizeof(result));

    gcm.setIV(iv, 16);
    gcm.encrypt(ciphertext, (const uint8_t*) plaintext, strlen(plaintext));

    memcpy(output, ciphertext, length);
}

void DecryptMessage(uint8_t* iv, uint8_t* cipherText, size_t len, uint8_t* plainText)
{
    uint8_t output[len];
    memset(plainText, 0, sizeof(plainText));

    gcm.setIV(iv, IV_LENGTH);
    gcm.decrypt(output, cipherText, len);
    
    memcpy(plainText, output, len);
}

void ComputeTag(uint8_t* iv, void* tag)
{   
    gcm.computeTag(tag, TAG_LENGTH);
}

bool CheckTag(uint8_t* iv, void* tag)
{
    gcm.setIV(iv, IV_LENGTH);
    return gcm.checkTag(tag, TAG_LENGTH);
}

void MakePayload(uint8_t* payload, uint8_t* content,  const char* id, size_t contentLength, uint8_t* iv, void* tag)
{   
    memcpy(payload, id, ID_LENGTH);
    memcpy(payload + ID_LENGTH, iv, IV_LENGTH);
    memcpy(payload + IV_LENGTH + ID_LENGTH, tag, TAG_LENGTH);
    memcpy(payload + IV_LENGTH + TAG_LENGTH + ID_LENGTH, content, contentLength);
}

void loop()
{
    if (client.connected())
    {   
        digitalWrite(whiteLedPin, HIGH);
        digitalWrite(redLedPin, LOW);

        DHT11Data dht11Response = QueryDHT11();

        counter++;

        String message = "{\"ip_address\": \"" + String(local_ip) + "\", \"temperature\": " + String(dht11Response.temperature) + ", \"humidity\": " + String(dht11Response.humidity) + ", \"counter\": " + String(counter) + "}";        

        Serial.println(message);

        size_t  messageLength = message.length();
        const char* plainText = message.c_str();

        uint8_t cipherText[messageLength];
        uint8_t result[messageLength];

        void*   tag = malloc(TAG_LENGTH);        
        bool    retTag;

        uint8_t iv[IV_LENGTH];
        esp_fill_random( (void*) iv, IV_LENGTH);

        size_t   payloadLength = messageLength + TAG_LENGTH + IV_LENGTH + ID_LENGTH;
        uint8_t* payload = (uint8_t*) malloc(payloadLength);

        EncryptMessage(iv, plainText, messageLength, cipherText);
        ComputeTag(iv, tag);
        MakePayload(payload, cipherText, id, messageLength, iv, tag);

        char encoded[Base64.encodedLength(payloadLength)];
        Base64.encode(encoded, (char*) payload, payloadLength);
    
        PublishMessage(topic, encoded);

        delay(1000);

        free(tag);
        free(payload);
    }
    else
    {
        InitWiFi();
        InitMQTTConnection(mqtt_server_ip, mqtt_server_port, client_id.c_str());
        digitalWrite(whiteLedPin, LOW);
        digitalWrite(redLedPin, HIGH);
    }
}
