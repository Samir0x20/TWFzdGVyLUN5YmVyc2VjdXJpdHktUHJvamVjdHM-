// https://github.com/adidax/dht11
#include <dht11.h>


const int dht11Pin = 26;

dht11 DHT11;

const int buttonPin = 27;  // the number of the pushbutton pin
const int ledPinRed = 32;    // the number of the LED pin
const int ledPinWhite = 33; 

int buttonState = 0;


void  setup()
{
    pinMode(ledPinRed, OUTPUT);
    pinMode(ledPinWhite, OUTPUT);
    pinMode(buttonPin, INPUT);
    Serial.begin(9600);
}

void loop()
{

    buttonState = digitalRead(buttonPin);

    if (buttonState == HIGH) 
    {
        digitalWrite(ledPinRed, HIGH);
        digitalWrite(ledPinWhite, HIGH);
    }
    else 
    {
        digitalWrite(ledPinRed, LOW);
        digitalWrite(ledPinWhite, LOW);
    }

    Serial.println();

    int chk = DHT11.read(dht11Pin);
    Serial.println("White ESP32");
    Serial.print("Humidity (%): ");
    Serial.println((float)DHT11.humidity, 2);
    Serial.print("Temperature  (C): ");
    Serial.println((float)DHT11.temperature, 2);

    delay(500);
}