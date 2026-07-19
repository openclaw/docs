---
read_when:
    - macOS Canvas पैनल का कार्यान्वयन
    - विज़ुअल वर्कस्पेस के लिए एजेंट नियंत्रण जोड़ना
    - WKWebView कैनवास लोड की डीबगिंग
summary: कस्टम URL स्कीम के साथ WKWebView के माध्यम से एम्बेड किया गया, एजेंट-नियंत्रित Canvas पैनल
title: कैनवस
x-i18n:
    generated_at: "2026-07-19T09:00:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 56532246bc06601aa753a59f85f33bfa8d6599deecade591a03972e8b9b16fc2
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS ऐप `WKWebView` का उपयोग करके एजेंट-नियंत्रित **Canvas पैनल** एम्बेड करता है, जो
HTML/CSS/JS, A2UI और छोटे इंटरैक्टिव UI
सतहों के लिए एक हल्का विज़ुअल कार्यक्षेत्र है।

## Canvas कहाँ स्थित है

Canvas की स्थिति Application Support के अंतर्गत संग्रहीत होती है:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas पैनल उन फ़ाइलों को एक कस्टम URL स्कीम,
`openclaw-canvas://<session>/<path>`, के माध्यम से उपलब्ध कराता है:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

यदि रूट पर कोई `index.html` मौजूद नहीं है, तो ऐप एक अंतर्निहित स्कैफ़ोल्ड पृष्ठ दिखाता है।

## पैनल का व्यवहार

- बॉर्डर-रहित, आकार बदलने योग्य पैनल, जो मेनू बार (या माउस कर्सर) के पास स्थित होता है।
- Canvas प्रस्तुत करने से ऐप स्विच नहीं होते और न ही कीबोर्ड फ़ोकस छीना जाता है।
- प्रति सत्र आकार/स्थिति याद रखता है।
- स्थानीय Canvas फ़ाइलें बदलने पर स्वतः पुनः लोड होता है।
- एक समय में केवल एक Canvas पैनल दिखाई देता है (आवश्यकतानुसार सत्र स्विच होते हैं)।

Canvas को Settings -> **Allow Canvas** से अक्षम किया जा सकता है। अक्षम होने पर,
Canvas Node कमांड `CANVAS_DISABLED` लौटाते हैं।

## एजेंट API सतह

Canvas को Gateway WebSocket के माध्यम से उपलब्ध कराया जाता है, जिससे एजेंट
पैनल दिखा/छिपा सकता है, किसी पथ या URL पर नेविगेट कर सकता है, JavaScript का मूल्यांकन कर सकता है और
स्नैपशॉट छवि कैप्चर कर सकता है:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`eval` और `a2ui.*` पैनल को खोले या प्रकट किए बिना सामग्री अपडेट करते हैं। केवल
`present`, `navigate` या उपयोगकर्ता की कार्रवाई इसे दिखाती है; छिपाने के बाद भी सामग्री अपडेट
छिपे हुए पैनल पर लागू होते रहते हैं। `snapshot` के लिए पैनल का दिखाई देना आवश्यक है और
अन्यथा यह `CANVAS_HIDDEN` लौटाता है; पहले `present` चलाएँ।

`canvas.navigate` स्थानीय Canvas पथ, `http(s)` URL और `file://`
URL स्वीकार करता है। `"/"` देने पर स्थानीय स्कैफ़ोल्ड या `index.html` दिखाई देता है।

`/__openclaw__/canvas/` और
`/__openclaw__/a2ui/` के अंतर्गत Gateway द्वारा होस्ट किए गए लक्ष्यों को Node सत्र के वर्तमान सीमित-दायरे वाले
Canvas URL के माध्यम से रिज़ॉल्व किया जाता है। ऐप नेविगेशन से पहले उस अल्पकालिक क्षमता को रीफ़्रेश करता है;
आपको स्वयं क्षमता URL बनाने या कॉपी करने की आवश्यकता नहीं है।

## Canvas में A2UI

A2UI को Gateway Canvas होस्ट द्वारा होस्ट किया जाता है और Canvas
पैनल के भीतर रेंडर किया जाता है। जब Gateway किसी Canvas होस्ट का विज्ञापन करता है, तो macOS ऐप पहली बार खोलने पर
स्वतः A2UI होस्ट पृष्ठ पर नेविगेट करता है।

विज्ञापित URL क्षमता-दायरा वाला होता है, उदाहरण के लिए
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`।
इसे अस्थायी क्रेडेंशियल मानें, स्थायी लिंक नहीं।

### A2UI कमांड (v0.8)

Canvas A2UI v0.8 सर्वर-से-क्लाइंट संदेश स्वीकार करता है: `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface`। `createSurface` (v0.9) अभी
समर्थित नहीं है।

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"यदि आप इसे पढ़ सकते हैं, तो A2UI पुश काम कर रहा है।"},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

त्वरित स्मोक परीक्षण:

```bash
openclaw nodes canvas a2ui push --node <id> --text "A2UI की ओर से नमस्ते"
```

## Canvas से एजेंट रन ट्रिगर करना

Canvas `openclaw://agent?...` डीप लिंक के माध्यम से नए एजेंट रन ट्रिगर कर सकता है:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

समर्थित क्वेरी पैरामीटर:

| पैरामीटर                  | अर्थ                                               |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | पहले से भरा हुआ एजेंट प्रॉम्प्ट।                               |
| `sessionKey`               | स्थायी सत्र पहचानकर्ता।                            |
| `thinking`                 | वैकल्पिक चिंतन प्रोफ़ाइल।                            |
| `deliver`, `to`, `channel` | डिलीवरी लक्ष्य।                                      |
| `timeoutSeconds`           | वैकल्पिक रन टाइमआउट।                                 |
| `key`                      | विश्वसनीय स्थानीय कॉलर के लिए ऐप द्वारा जनरेट किया गया सुरक्षा टोकन। |

जब तक कोई मान्य कुंजी प्रदान नहीं की जाती, ऐप पुष्टि के लिए संकेत देता है। बिना कुंजी वाले
लिंक अनुमोदन से पहले संदेश और URL दिखाते हैं तथा डिलीवरी रूटिंग
फ़ील्ड को अनदेखा करते हैं; कुंजी वाले लिंक सामान्य Gateway रन पथ का उपयोग करते हैं।

## सुरक्षा संबंधी टिप्पणियाँ

- Canvas स्कीम डायरेक्टरी ट्रैवर्सल को अवरुद्ध करती है; फ़ाइलें सत्र रूट के अंतर्गत ही होनी चाहिए।
- स्थानीय Canvas सामग्री कस्टम स्कीम का उपयोग करती है (लूपबैक सर्वर आवश्यक नहीं है)।
- बाहरी `http(s)` URL केवल तभी अनुमत होते हैं जब उन पर स्पष्ट रूप से नेविगेट किया जाए।
- सामान्य वेब पृष्ठ केवल रेंडर किए जा सकते हैं। एजेंट कार्रवाइयाँ केवल
  ऐप-स्वामित्व वाली Canvas स्कीम या ऐप द्वारा चुने गए सटीक क्षमता-दायरा वाले Gateway A2UI दस्तावेज़ से
  स्वीकार की जाती हैं; सबफ़्रेम, रीडायरेक्ट, पुरानी क्षमताएँ और बदली हुई
  क्वेरी कार्रवाइयाँ डिस्पैच नहीं कर सकतीं।

## संबंधित

- [macOS ऐप](/hi/platforms/macos)
- [WebChat](/hi/web/webchat)
