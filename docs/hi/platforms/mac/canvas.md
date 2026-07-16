---
read_when:
    - macOS Canvas पैनल का कार्यान्वयन
    - विज़ुअल वर्कस्पेस के लिए एजेंट नियंत्रण जोड़ना
    - WKWebView कैनवास लोड की डीबगिंग
summary: WKWebView + कस्टम URL स्कीम के माध्यम से एम्बेड किया गया एजेंट-नियंत्रित Canvas पैनल
title: कैनवास
x-i18n:
    generated_at: "2026-07-16T15:51:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS ऐप, HTML/CSS/JS, A2UI और छोटी इंटरैक्टिव UI सतहों के लिए एक हल्के विज़ुअल कार्यक्षेत्र `WKWebView` का उपयोग करके एजेंट-नियंत्रित **Canvas पैनल** एम्बेड करता है।

## Canvas कहाँ स्थित है

Canvas की स्थिति Application Support के अंतर्गत संग्रहीत होती है:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas पैनल उन फ़ाइलों को एक कस्टम URL स्कीम,
`openclaw-canvas://<session>/<path>` के माध्यम से प्रस्तुत करता है:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

यदि रूट पर कोई `index.html` मौजूद नहीं है, तो ऐप एक अंतर्निहित स्कैफ़ोल्ड पेज दिखाता है।

## पैनल का व्यवहार

- बॉर्डर-रहित, आकार बदलने योग्य पैनल, जो मेनू बार (या माउस कर्सर) के पास एंकर होता है।
- प्रत्येक सत्र के लिए आकार/स्थिति याद रखता है।
- स्थानीय Canvas फ़ाइलें बदलने पर अपने-आप पुनः लोड होता है।
- एक समय में केवल एक Canvas पैनल दिखाई देता है (आवश्यकतानुसार सत्र बदलता है)।

Canvas को Settings -> **Allow Canvas** से अक्षम किया जा सकता है। अक्षम होने पर,
canvas Node कमांड `CANVAS_DISABLED` लौटाते हैं।

## एजेंट API सतह

Canvas को Gateway WebSocket के माध्यम से उपलब्ध कराया जाता है, इसलिए एजेंट
पैनल को दिखा/छिपा सकता है, किसी पथ या URL पर जा सकता है, JavaScript का मूल्यांकन
कर सकता है और स्नैपशॉट छवि कैप्चर कर सकता है:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` स्थानीय canvas पथ, `http(s)` URL और `file://`
URL स्वीकार करता है। `"/"` पास करने पर स्थानीय स्कैफ़ोल्ड या `index.html` दिखता है।

`/__openclaw__/canvas/` और
`/__openclaw__/a2ui/` के अंतर्गत Gateway द्वारा होस्ट किए गए लक्ष्यों को Node सत्र के वर्तमान स्कोप वाले
Canvas URL के माध्यम से रिज़ॉल्व किया जाता है। ऐप नेविगेशन से पहले उस अल्पकालिक क्षमता को रीफ़्रेश करता है;
आपको स्वयं क्षमता URL बनाने या कॉपी करने की आवश्यकता नहीं है।

## Canvas में A2UI

A2UI को Gateway canvas होस्ट द्वारा होस्ट किया जाता है और Canvas
पैनल के भीतर रेंडर किया जाता है। जब Gateway किसी Canvas होस्ट का विज्ञापन करता है, तो macOS ऐप पहली बार खोलने पर
अपने-आप A2UI होस्ट पेज पर जाता है।

विज्ञापित URL क्षमता-स्कोप वाला होता है, उदाहरण के लिए
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`।
इसे स्थायी लिंक नहीं, बल्कि अस्थायी क्रेडेंशियल मानें।

### A2UI कमांड (v0.8)

Canvas, A2UI v0.8 के सर्वर-से-क्लाइंट संदेश स्वीकार करता है: `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface`। `createSurface` (v0.9) अभी
समर्थित नहीं है।

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

त्वरित स्मोक परीक्षण:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Canvas से एजेंट रन ट्रिगर करना

Canvas, `openclaw://agent?...` डीप लिंक के माध्यम से नए एजेंट रन ट्रिगर कर सकता है:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

समर्थित क्वेरी पैरामीटर:

| पैरामीटर                  | अर्थ                                               |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | पहले से भरा हुआ एजेंट प्रॉम्प्ट।                               |
| `sessionKey`               | स्थिर सत्र पहचानकर्ता।                            |
| `thinking`                 | वैकल्पिक चिंतन प्रोफ़ाइल।                            |
| `deliver`, `to`, `channel` | डिलीवरी लक्ष्य।                                      |
| `timeoutSeconds`           | वैकल्पिक रन टाइमआउट।                                 |
| `key`                      | विश्वसनीय स्थानीय कॉलर के लिए ऐप द्वारा जनरेट किया गया सुरक्षा टोकन। |

मान्य कुंजी प्रदान न किए जाने पर ऐप पुष्टि के लिए संकेत देता है। बिना कुंजी वाले
लिंक स्वीकृति से पहले संदेश और URL दिखाते हैं तथा डिलीवरी रूटिंग
फ़ील्ड को अनदेखा करते हैं; कुंजी वाले लिंक सामान्य Gateway रन पथ का उपयोग करते हैं।

## सुरक्षा संबंधी टिप्पणियाँ

- Canvas स्कीम डायरेक्टरी ट्रैवर्सल को ब्लॉक करती है; फ़ाइलें सत्र रूट के अंतर्गत होनी चाहिए।
- स्थानीय Canvas सामग्री एक कस्टम स्कीम का उपयोग करती है (लूपबैक सर्वर आवश्यक नहीं है)।
- बाहरी `http(s)` URL की अनुमति केवल तभी होती है, जब उन पर स्पष्ट रूप से नेविगेट किया जाए।
- सामान्य वेब पेज केवल रेंडरिंग के लिए होते हैं। एजेंट कार्रवाइयाँ केवल
  ऐप-स्वामित्व वाली Canvas स्कीम या ऐप द्वारा चुने गए क्षमता-स्कोप वाले सटीक Gateway A2UI दस्तावेज़ से
  स्वीकार की जाती हैं; सबफ़्रेम, रीडायरेक्ट, पुरानी क्षमताएँ और बदली हुई
  क्वेरी कार्रवाइयाँ डिस्पैच नहीं कर सकतीं।

## संबंधित

- [macOS ऐप](/hi/platforms/macos)
- [WebChat](/hi/web/webchat)
