---
read_when:
    - आप युग्मित नोड्स (कैमरे, स्क्रीन, कैनवास) प्रबंधित कर रहे हैं
    - आपको अनुरोधों को स्वीकृति देनी होगी या Node कमांड चलाने होंगे
summary: '`openclaw nodes` के लिए CLI संदर्भ (स्थिति, पेयरिंग, आह्वान, कैमरा/कैनवास/स्क्रीन/स्थान/सूचना)'
title: Nodes
x-i18n:
    generated_at: "2026-07-16T14:09:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5b57235006d803fe09f626a65157dfb1f620d3d3c6f337e33132bcffdf4f1e37
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

युग्मित Node (डिवाइस) प्रबंधित करें और Node क्षमताएँ लागू करें।

संबंधित: [Node का अवलोकन](/hi/nodes) - [सक्रिय कंप्यूटर उपस्थिति](/nodes/presence) - [कैमरा Node](/hi/nodes/camera) - [इमेज Node](/hi/nodes/images)

प्रत्येक उपकमांड के सामान्य विकल्प: `--url <url>`, `--token <token>`, `--timeout <ms>` (डिफ़ॉल्ट `10000`), `--json`।

## स्थिति

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` और `list` दोनों `--connected` (केवल कनेक्टेड Node) और `--last-connected <duration>` (उदा. `24h`, `7d`; केवल वे Node जो अवधि के भीतर कनेक्ट हुए थे) स्वीकार करते हैं। `list` लंबित और युग्मित Node को अलग-अलग तालिकाओं में दिखाता है, जहाँ युग्मित पंक्तियों में सबसे हाल के कनेक्शन की अवधि (Last Connect) शामिल होती है; `status` प्रति-Node क्षमता, संस्करण और अंतिम इनपुट के विवरण वाली एक मर्ज की गई तालिका दिखाता है। कनेक्टेड macOS Node केवल Accessibility अनुमति मिलने के दौरान अंतिम इनपुट की रिपोर्ट करता है और सबसे नई पंक्ति को `active` चिह्नित किया जाता है; [सक्रिय कंप्यूटर उपस्थिति](/nodes/presence) देखें। `describe` किसी एक Node की क्षमताएँ, अनुमतियाँ, गतिविधि और प्रभावी/लंबित इनवोक कमांड प्रिंट करता है।

## युग्मन

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

ये कमांड Gateway के स्वामित्व वाले `node.pair.*` स्टोर को संचालित करते हैं, जो डिवाइस युग्मन (`openclaw devices approve`) से अलग है और Node के WS `connect` हैंडशेक को नियंत्रित करता है। दोनों के संबंध के लिए [Node](/hi/nodes) देखें।

- `remove` Node की युग्मित-भूमिका प्रविष्टि निरस्त करता है। डिवाइस-समर्थित Node के लिए, यह डिवाइस युग्मन स्टोर में `node` भूमिका निरस्त करता है और उसके Node-भूमिका सत्रों को डिस्कनेक्ट करता है: मिश्रित-भूमिका वाला डिवाइस अपनी पंक्ति बनाए रखता है और केवल `node` भूमिका खोता है, जबकि केवल-Node वाली डिवाइस पंक्ति हटा दी जाती है। यह Gateway के स्वामित्व वाले किसी भी मेल खाते लीगेसी Node युग्मन रिकॉर्ड को भी साफ़ करता है।
- `pending` को केवल `operator.pairing` स्कोप की आवश्यकता होती है।
- `gateway.nodes.pairing.autoApproveCidrs` स्पष्ट रूप से विश्वसनीय, पहली बार के `role: node` डिवाइस युग्मन के लिए लंबित चरण छोड़ सकता है। डिफ़ॉल्ट रूप से बंद; भूमिका अपग्रेड को अनुमोदित नहीं करता।
- `gateway.nodes.pairing.sshVerify` (डिफ़ॉल्ट रूप से चालू) पहली बार के `role: node` डिवाइस युग्मन को स्वतः अनुमोदित करता है, जब Gateway SSH के माध्यम से Node होस्ट पर डिवाइस कुंजी सत्यापित कर सकता है; पहली क्षमता सतह उसी चरण में अनुमोदित होती है। [Node युग्मन](/hi/gateway/pairing#ssh-verified-device-auto-approval-default) देखें।
- `approve` स्कोप की आवश्यकताएँ लंबित अनुरोध के घोषित कमांड का अनुसरण करती हैं:
  - कमांड-रहित अनुरोध: `operator.pairing`
  - सामान्य Node कमांड: `operator.pairing` + `operator.write`
  - एडमिन-संवेदनशील कमांड (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir`, और `system.execApprovals.get/set`): `operator.pairing` + `operator.admin`
- `remove` स्कोप: `operator.pairing` गैर-ऑपरेटर Node पंक्तियाँ हटा सकता है; मिश्रित-भूमिका वाले डिवाइस पर अपनी Node भूमिका निरस्त करने वाले डिवाइस-टोकन कॉलर को अतिरिक्त रूप से `operator.admin` की आवश्यकता होती है।

## इनवोक

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

फ़्लैग:

- `--command <command>` (आवश्यक): उदा. `canvas.eval`।
- `--params <json>`: JSON ऑब्जेक्ट स्ट्रिंग (डिफ़ॉल्ट `{}`)।
- `--invoke-timeout <ms>`: Node इनवोक टाइमआउट (डिफ़ॉल्ट `15000`)।
- `--idempotency-key <key>`: वैकल्पिक आइडेम्पोटेंसी कुंजी।

`system.run` और `system.run.prepare` यहाँ ब्लॉक हैं; इसके बजाय शेल निष्पादन के लिए `host=node` के साथ `exec` टूल का उपयोग करें। `system.which` को `invoke` के माध्यम से अनुमति है।

## सूचना, पुश, स्थान, स्क्रीन

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` ऐसे Node पर स्थानीय सूचना भेजता है जो `system.notify` घोषित करता है, जिसमें macOS, iOS, Android और सीधे watchOS Node शामिल हैं। सीधे watchOS वितरण के लिए OpenClaw का सक्रिय होना आवश्यक है। `--title` या `--body` आवश्यक है। विकल्प: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (डिफ़ॉल्ट `system`), `--invoke-timeout <ms>` (डिफ़ॉल्ट `15000`)।
- `push` किसी iOS Node को APNs परीक्षण पुश भेजता है। विकल्प: `--title <text>` (डिफ़ॉल्ट `OpenClaw`), `--body <text>`, पहचाने गए APNs परिवेश को ओवरराइड करने के लिए `--environment <sandbox|production>`।
- `location get` Node का वर्तमान स्थान प्राप्त करता है। विकल्प: `--max-age <ms>` (कैश किए गए स्थान निर्धारण का पुनः उपयोग), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (डिफ़ॉल्ट `10000`), `--invoke-timeout <ms>` (डिफ़ॉल्ट `20000`)।
- `screen record` एक छोटी क्लिप कैप्चर करता है और सहेजा गया पथ प्रिंट करता है (या `--json` के साथ JSON लिखता है)। विकल्प: `--screen <index>` (डिफ़ॉल्ट `0`), `--duration <ms|10s>` (डिफ़ॉल्ट `10000`), `--fps <fps>` (डिफ़ॉल्ट `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (डिफ़ॉल्ट `120000`)।

कैमरा और Canvas कमांड के अपने दस्तावेज़ हैं: [कैमरा Node](/hi/nodes/camera), [Canvas](/hi/platforms/mac/canvas)। Canvas को बंडल किए गए प्रयोगात्मक Canvas Plugin द्वारा कार्यान्वित किया जाता है; कोर `openclaw nodes canvas` को संगतता माउंट पॉइंट के रूप में बनाए रखता है।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Node](/hi/nodes)
