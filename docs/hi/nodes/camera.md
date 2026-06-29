---
read_when:
    - iOS/Android नोड्स या macOS पर कैमरा कैप्चर जोड़ना या संशोधित करना
    - एजेंट-सुलभ MEDIA अस्थायी-फ़ाइल वर्कफ़्लो का विस्तार
summary: 'एजेंट उपयोग के लिए कैमरा कैप्चर (iOS/Android नोड + macOS ऐप): फ़ोटो (jpg) और छोटी वीडियो क्लिप (mp4)'
title: कैमरा कैप्चर
x-i18n:
    generated_at: "2026-06-28T23:24:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw agent workflows के लिए **कैमरा कैप्चर** का समर्थन करता है:

- **iOS Node** (Gateway के जरिए पेयर किया गया): `node.invoke` के जरिए **फ़ोटो** (`jpg`) या **छोटी वीडियो क्लिप** (`mp4`, वैकल्पिक ऑडियो के साथ) कैप्चर करें।
- **Android Node** (Gateway के जरिए पेयर किया गया): `node.invoke` के जरिए **फ़ोटो** (`jpg`) या **छोटी वीडियो क्लिप** (`mp4`, वैकल्पिक ऑडियो के साथ) कैप्चर करें।
- **macOS ऐप** (Gateway के जरिए Node): `node.invoke` के जरिए **फ़ोटो** (`jpg`) या **छोटी वीडियो क्लिप** (`mp4`, वैकल्पिक ऑडियो के साथ) कैप्चर करें।

सभी कैमरा एक्सेस **उपयोगकर्ता-नियंत्रित सेटिंग्स** के पीछे नियंत्रित है।

## iOS Node

### उपयोगकर्ता सेटिंग (डिफ़ॉल्ट रूप से चालू)

- iOS Settings टैब → **Camera** → **Allow Camera** (`camera.enabled`)
  - डिफ़ॉल्ट: **चालू** (अनुपस्थित कुंजी को सक्षम माना जाता है)।
  - बंद होने पर: `camera.*` कमांड `CAMERA_DISABLED` लौटाते हैं।

### कमांड (Gateway `node.invoke` के जरिए)

- `camera.list`
  - प्रतिक्रिया payload:
    - `devices`: `{ id, name, position, deviceType }` की array

- `camera.snap`
  - Params:
    - `facing`: `front|back` (डिफ़ॉल्ट: `front`)
    - `maxWidth`: number (वैकल्पिक; iOS Node पर डिफ़ॉल्ट `1600`)
    - `quality`: `0..1` (वैकल्पिक; डिफ़ॉल्ट `0.9`)
    - `format`: वर्तमान में `jpg`
    - `delayMs`: number (वैकल्पिक; डिफ़ॉल्ट `0`)
    - `deviceId`: string (वैकल्पिक; `camera.list` से)
  - प्रतिक्रिया payload:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Payload guard: base64 payload को 5 MB से कम रखने के लिए फ़ोटो को फिर से compress किया जाता है।

- `camera.clip`
  - Params:
    - `facing`: `front|back` (डिफ़ॉल्ट: `front`)
    - `durationMs`: number (डिफ़ॉल्ट `3000`, अधिकतम `60000` तक सीमित)
    - `includeAudio`: boolean (डिफ़ॉल्ट `true`)
    - `format`: वर्तमान में `mp4`
    - `deviceId`: string (वैकल्पिक; `camera.list` से)
  - प्रतिक्रिया payload:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Foreground आवश्यकता

`canvas.*` की तरह, iOS Node केवल **foreground** में `camera.*` कमांड की अनुमति देता है। Background invocations `NODE_BACKGROUND_UNAVAILABLE` लौटाते हैं।

### CLI helper

मीडिया फ़ाइलें पाने का सबसे आसान तरीका CLI helper है, जो decoded media को temp file में लिखता है और saved path print करता है।

उदाहरण:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

नोट्स:

- `nodes camera snap` agent को दोनों views देने के लिए डिफ़ॉल्ट रूप से **दोनों** facings का उपयोग करता है।
- Output files अस्थायी होती हैं (OS temp directory में), जब तक आप अपना wrapper नहीं बनाते।

## Android Node

### Android उपयोगकर्ता सेटिंग (डिफ़ॉल्ट रूप से चालू)

- Android Settings sheet → **Camera** → **Allow Camera** (`camera.enabled`)
  - डिफ़ॉल्ट: **चालू** (अनुपस्थित कुंजी को सक्षम माना जाता है)।
  - बंद होने पर: `camera.*` कमांड `CAMERA_DISABLED` लौटाते हैं।

### अनुमतियां

- Android को runtime permissions चाहिए:
  - `camera.snap` और `camera.clip` दोनों के लिए `CAMERA`।
  - `includeAudio=true` होने पर `camera.clip` के लिए `RECORD_AUDIO`।

यदि permissions अनुपस्थित हैं, तो ऐप संभव होने पर prompt करेगा; यदि denied हो, तो `camera.*` requests
`*_PERMISSION_REQUIRED` error के साथ fail होती हैं।

### Android foreground आवश्यकता

`canvas.*` की तरह, Android Node केवल **foreground** में `camera.*` कमांड की अनुमति देता है। Background invocations `NODE_BACKGROUND_UNAVAILABLE` लौटाते हैं।

### Android कमांड (Gateway `node.invoke` के जरिए)

- `camera.list`
  - प्रतिक्रिया payload:
    - `devices`: `{ id, name, position, deviceType }` की array

### Payload guard

base64 payload को 5 MB से कम रखने के लिए फ़ोटो को फिर से compress किया जाता है।

## macOS ऐप

### उपयोगकर्ता सेटिंग (डिफ़ॉल्ट रूप से बंद)

macOS companion ऐप एक checkbox दिखाता है:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - डिफ़ॉल्ट: **बंद**
  - बंद होने पर: camera requests "Camera disabled by user" लौटाती हैं।

### CLI helper (Node invoke)

macOS Node पर camera commands invoke करने के लिए मुख्य `openclaw` CLI का उपयोग करें।

उदाहरण:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints saved path
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints saved path
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints saved path (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

नोट्स:

- `openclaw nodes camera snap` override न होने पर डिफ़ॉल्ट रूप से `maxWidth=1600` का उपयोग करता है।
- macOS पर, `camera.snap` capture करने से पहले warm-up/exposure settle के बाद `delayMs` (डिफ़ॉल्ट 2000ms) प्रतीक्षा करता है।
- base64 को 5 MB से कम रखने के लिए photo payloads को फिर से compress किया जाता है।

## सुरक्षा + व्यावहारिक सीमाएं

- Camera और microphone access सामान्य OS permission prompts trigger करते हैं (और Info.plist में usage strings की आवश्यकता होती है)।
- Video clips को oversized Node payloads (base64 overhead + message limits) से बचने के लिए सीमित किया जाता है (वर्तमान में `<= 60s`)।

## macOS screen video (OS-level)

_camera_ नहीं, बल्कि _screen_ video के लिए macOS companion का उपयोग करें:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints saved path
```

नोट्स:

- macOS **Screen Recording** permission (TCC) आवश्यक है।

## संबंधित

- [Image और media support](/hi/nodes/images)
- [Media understanding](/hi/nodes/media-understanding)
- [Location command](/hi/nodes/location-command)
