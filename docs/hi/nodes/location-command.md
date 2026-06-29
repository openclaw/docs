---
read_when:
    - स्थान नोड समर्थन या अनुमतियाँ UI जोड़ना
    - Android लोकेशन अनुमतियों या foreground व्यवहार को डिज़ाइन करना
summary: नोड्स के लिए स्थान कमांड (location.get), अनुमति मोड, और Android अग्रभूमि व्यवहार
title: स्थान कमांड
x-i18n:
    generated_at: "2026-06-28T23:25:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63ed754bfdda1cf379dcb7ac40817c0b93cc1efe4526512d70258072da4bc8a7
    source_path: nodes/location-command.md
    workflow: 16
---

## संक्षेप में

- `location.get` एक नोड कमांड है (`node.invoke` के ज़रिए)।
- डिफ़ॉल्ट रूप से बंद।
- Android ऐप सेटिंग्स एक चयनकर्ता का उपयोग करती हैं: बंद / उपयोग के दौरान।
- अलग टॉगल: सटीक स्थान।

## चयनकर्ता क्यों (सिर्फ स्विच नहीं)

OS अनुमतियाँ बहु-स्तरीय होती हैं। हम ऐप में चयनकर्ता दिखा सकते हैं, लेकिन वास्तविक अनुमति अब भी OS तय करता है।

- iOS/macOS सिस्टम prompts/Settings में **उपयोग के दौरान** या **हमेशा** दिखा सकते हैं।
- Android ऐप फ़िलहाल केवल foreground location का समर्थन करता है।
- सटीक स्थान एक अलग अनुमति है (iOS 14+ "Precise", Android "fine" बनाम "coarse")।

UI में चयनकर्ता हमारे अनुरोधित मोड को नियंत्रित करता है; वास्तविक अनुमति OS सेटिंग्स में रहती है।

## सेटिंग्स मॉडल

प्रति नोड डिवाइस:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI व्यवहार:

- `whileUsing` चुनने पर foreground permission का अनुरोध होता है।
- यदि OS अनुरोधित स्तर अस्वीकार करता है, तो सबसे ऊंचे स्वीकृत स्तर पर वापस जाएँ और स्थिति दिखाएँ।

## अनुमतियों की मैपिंग (node.permissions)

वैकल्पिक। macOS नोड permissions map के ज़रिए `location` रिपोर्ट करता है; iOS/Android इसे छोड़ सकते हैं।

## कमांड: `location.get`

`node.invoke` के ज़रिए कॉल किया जाता है।

पैरामीटर (सुझाए गए):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

प्रतिक्रिया पेलोड:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

त्रुटियाँ (स्थिर कोड):

- `LOCATION_DISABLED`: चयनकर्ता बंद है।
- `LOCATION_PERMISSION_REQUIRED`: अनुरोधित मोड के लिए अनुमति नहीं है।
- `LOCATION_BACKGROUND_UNAVAILABLE`: ऐप पृष्ठभूमि में है, लेकिन केवल उपयोग के दौरान अनुमति है।
- `LOCATION_TIMEOUT`: समय पर कोई fix नहीं मिला।
- `LOCATION_UNAVAILABLE`: सिस्टम विफलता / कोई provider नहीं।

## पृष्ठभूमि व्यवहार

- Android ऐप पृष्ठभूमि में होने पर `location.get` को अस्वीकार करता है।
- Android पर स्थान का अनुरोध करते समय OpenClaw खुला रखें।
- अन्य नोड प्लेटफ़ॉर्म अलग हो सकते हैं।

## मॉडल/टूलिंग एकीकरण

- टूल सतह: `nodes` टूल `location_get` action जोड़ता है (नोड आवश्यक)।
- CLI: `openclaw nodes location get --node <id>`।
- एजेंट दिशानिर्देश: केवल तब कॉल करें जब उपयोगकर्ता ने स्थान सक्षम किया हो और scope समझता हो।

## UX कॉपी (सुझाई गई)

- बंद: "स्थान साझा करना अक्षम है।"
- उपयोग के दौरान: "केवल जब OpenClaw खुला हो।"
- सटीक: "सटीक GPS स्थान का उपयोग करें। अनुमानित स्थान साझा करने के लिए टॉगल बंद करें।"

## संबंधित

- [चैनल स्थान parsing](/hi/channels/location)
- [कैमरा capture](/hi/nodes/camera)
- [Talk mode](/hi/nodes/talk)
