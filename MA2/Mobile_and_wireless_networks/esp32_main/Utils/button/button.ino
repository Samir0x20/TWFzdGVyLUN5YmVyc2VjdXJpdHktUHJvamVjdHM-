const int buttonPin = 27;  // the number of the pushbutton pin
const int ledPinRed = 32;    // the number of the LED pin
const int ledPinWhite = 33;  

int buttonState = 0;

void setup()
{
  pinMode(ledPinRed, OUTPUT);
  pinMode(ledPinWhite, OUTPUT);

  pinMode(buttonPin, INPUT);
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
}
