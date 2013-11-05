const int FREQ = A0;
const int FILTER_FREQ = A1;
const int DELAY = A2;
const int FEEDBACK = A3;

void setup() {
  Serial.begin(9600);
  pinMode(FREQ, INPUT);
  pinMode(FILTER_FREQ, INPUT);
  pinMode(DELAY, INPUT);
  pinMode(FEEDBACK, INPUT);
}

void loop() {
  char ascii[46];
  sprintf(ascii, "{\"fr\":%i,\"fi\":%i,\"de\":%i,\"fe\":%i}", analogRead(FREQ), analogRead(FILTER_FREQ), analogRead(DELAY), analogRead(FEEDBACK));
  Serial.print(ascii);
  delay(100);
}
