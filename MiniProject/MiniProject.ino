#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <WiFi.h>
#include <mqtt_client.h>
#include <esp_crt_bundle.h>
#include "secrets.h"
// #include <SensirionI2cSps30.h>

#define SDA_PIN 21
#define SCL_PIN 22
#define DHT_PIN 25
#define DHT_TYPE DHT22

#define STATIC_IP IPAddress(192, 168, 1, 220)

// ===== MQTT over WebSocket =====
// LAN ทดสอบ:  ws://192.168.1.10:9001/mqtt
// นอกบ้าน (หลังสร้าง DNS + tunnel ให้เรียบร้อย):  wss://mqtt.url.me:443/mqtt
#define PUBLISH_INTERVAL_MS 30000
#define WINDOW_SAMPLES 15   // 30s / อ่านทุก 2s
#define EMA_ALPHA 0.5f      // เก็บค่า EMA; ใกล้ 1 = ตอบสนองไว ใกล้ 0 = เรียบเนียน

Adafruit_SSD1306 display(128, 64, &Wire, -1);
DHT dht(DHT_PIN, DHT_TYPE);
// SensirionI2cSps30 sps30;

// bool hasSPS = false;
float temp = NAN, humid = NAN, pm25 = NAN;
float tempSamples[WINDOW_SAMPLES], humidSamples[WINDOW_SAMPLES];
int sampleCount = 0;
float emaTemp = NAN, emaHumid = NAN;

esp_mqtt_client_handle_t mqttClient = NULL;
unsigned long lastPublish = 0;

void mqttEventHandler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data) {
  esp_mqtt_event_handle_t event = (esp_mqtt_event_handle_t)event_data;
  switch ((esp_mqtt_event_id_t)event->event_id) {
    case MQTT_EVENT_CONNECTED:
      Serial.println(F("MQTT connected"));
      break;
    case MQTT_EVENT_DISCONNECTED:
      Serial.println(F("MQTT disconnected"));
      break;
    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN);

  // sps30.begin(Wire);
  // hasSPS = (sps30.probe() == 0);
  // if (hasSPS) sps30.start_measurement();

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 init failed"));
    while (true) delay(10);
  }
  display.clearDisplay();
  display.display();

  dht.begin();

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  WiFi.config(STATIC_IP, IPAddress(192, 168, 1, 1), IPAddress(255, 255, 255, 0), IPAddress(192, 168, 1, 1));
  Serial.print(F("Connecting to WiFi"));
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(F("."));
  }
  Serial.println();
  Serial.print(F("WiFi connected, IP: "));
  Serial.println(WiFi.localIP());

  esp_mqtt_client_config_t mqttCfg = {};
  mqttCfg.broker.address.uri = MQTT_URI;
  mqttCfg.credentials.username = MQTT_USER;
  mqttCfg.credentials.authentication.password = MQTT_PASS;
  mqttCfg.broker.verification.crt_bundle_attach = esp_crt_bundle_attach;
  mqttClient = esp_mqtt_client_init(&mqttCfg);
  esp_mqtt_client_register_event(mqttClient, (esp_mqtt_event_id_t)MQTT_EVENT_ANY, mqttEventHandler, NULL);
  esp_mqtt_client_start(mqttClient);
}

float median(float arr[], int n) {
  float tmp[WINDOW_SAMPLES];
  memcpy(tmp, arr, n * sizeof(float));
  for (int i = 0; i < n - 1; i++)
    for (int j = i + 1; j < n; j++)
      if (tmp[j] < tmp[i]) { float t = tmp[i]; tmp[i] = tmp[j]; tmp[j] = t; }
  return tmp[n / 2];
}

void readDHT() {
  temp = dht.readTemperature();
  humid = dht.readHumidity();
  Serial.print(F("DHT: Temp="));
  Serial.print(isnan(temp) ? 0 : temp, 1);
  Serial.print(F("C Humid="));
  Serial.print(isnan(humid) ? 0 : humid, 1);
  Serial.println(F("%"));
  if (!isnan(temp) && !isnan(humid) && sampleCount < WINDOW_SAMPLES) {
    tempSamples[sampleCount] = temp;
    humidSamples[sampleCount] = humid;
    sampleCount++;
  }
}

// void readSPS() {
//   float val[10];
//   uint16_t err = sps30.read_measurement(val, 10);
//   if (err != 0) {
//     pm25 = NAN;
//     return;
//   }
//   pm25 = val[2];
// }

void publishData() {
  if (sampleCount == 0) return;
  float mT = median(tempSamples, sampleCount);
  float mH = median(humidSamples, sampleCount);
  if (isnan(mT) || isnan(mH)) return;
  emaTemp = isnan(emaTemp) ? mT : EMA_ALPHA * mT + (1 - EMA_ALPHA) * emaTemp;
  emaHumid = isnan(emaHumid) ? mH : EMA_ALPHA * mH + (1 - EMA_ALPHA) * emaHumid;
  char msg[64];
  snprintf(msg, sizeof(msg), "{\"temp\":%.1f,\"humid\":%.1f}", emaTemp, emaHumid);
  esp_mqtt_client_publish(mqttClient, MQTT_TOPIC, msg, 0, 1, 0);
  Serial.print(F("Publish: "));
  Serial.println(msg);
  sampleCount = 0;
}

void render() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  display.setTextSize(1);
  display.setCursor(24, 0);
  display.print(F("PM2.5 (ug/m3)"));

  display.setTextSize(3);
  display.setCursor(32, 14);
  if (isnan(pm25)) display.print(F("--"));
  else display.print(pm25, 1);

  display.setTextSize(1);
  display.setCursor(0, 48);
  display.print(isnan(temp) ? String("T: --") : String("T: ") + temp + "C");

  display.setCursor(76, 48);
  display.print(isnan(humid) ? String("H: --") : String("H: ") + humid + "%");

  display.display();
}

void loop() {
  // static unsigned long lastDHT = 0, lastSPS = 0, lastOLED = 0;
  static unsigned long lastDHT = 0, lastOLED = 0;

  if (millis() - lastDHT >= 2000) {
    readDHT();
    lastDHT = millis();
  }

  // if (hasSPS && millis() - lastSPS >= 5000) {
  //   readSPS();
  //   lastSPS = millis();
  // }

  if (millis() - lastOLED >= 1000) {
    render();
    lastOLED = millis();
  }

  if (mqttClient != NULL && millis() - lastPublish >= PUBLISH_INTERVAL_MS) {
    publishData();
    lastPublish = millis();
  }
}
