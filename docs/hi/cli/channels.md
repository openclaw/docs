---
read_when:
    - आप चैनल खाते (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp और अन्य) जोड़ना या हटाना चाहते हैं
    - आप चैनल की स्थिति जाँचना या चैनल लॉग को लगातार देखना चाहते हैं
    - आपको विफल इनबाउंड चैनल इवेंट की जाँच करनी है या उसे फिर से सबमिट करना है
summary: '`openclaw channels` के लिए CLI संदर्भ (खाते, स्थिति, डेड लेटर्स, क्षमताएँ, समाधान, लॉग, लॉगिन/लॉगआउट)'
title: चैनल
x-i18n:
    generated_at: "2026-07-22T04:44:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 858f1f65de9b26dba3be712789141bc42cd0908c3a9284e40c3273c6972a0c65
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gateway पर चैट चैनल खातों और उनकी रनटाइम स्थिति को प्रबंधित करें।

संबंधित दस्तावेज़:

- चैनल मार्गदर्शिकाएँ: [चैनल](/hi/channels)
- Gateway कॉन्फ़िगरेशन: [कॉन्फ़िगरेशन](/hi/gateway/configuration)

## सामान्य कमांड

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
openclaw channels dead-letters list --channel telegram --account default
```

`channels list` केवल चैट चैनल दिखाता है: डिफ़ॉल्ट रूप से कॉन्फ़िगर किए गए खाते, प्रत्येक खाते के लिए `installed`, `configured`, और `enabled` स्थिति टैग के साथ (मशीन आउटपुट के लिए `--json`)। उन बंडल किए गए चैनलों को भी दिखाने के लिए `--all` पास करें जिनका अभी तक कोई कॉन्फ़िगर किया गया खाता नहीं है, और उन इंस्टॉल करने योग्य कैटलॉग चैनलों को भी जो अभी डिस्क पर नहीं हैं। प्रदाता प्रमाणीकरण और मॉडल उपयोग अन्यत्र उपलब्ध हैं: प्रदाता प्रमाणीकरण प्रोफ़ाइलों के लिए `openclaw models auth list`, और उपयोग/कोटा के लिए `openclaw status` या `openclaw models list`।

## स्थिति / क्षमताएँ / समाधान / लॉग

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (डिफ़ॉल्ट `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (`--channel` आवश्यक), `--target <dest>` (`--channel` आवश्यक), `--timeout <ms>` (डिफ़ॉल्ट `10000`, अधिकतम `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (डिफ़ॉल्ट `auto`), `--json`
- `channels logs`: `--channel <name|all>` (डिफ़ॉल्ट `all`), `--lines <n>` (डिफ़ॉल्ट `200`), `--json`

`channels status --probe` लाइव पथ है: पहुँच योग्य Gateway पर यह प्रत्येक खाते के लिए
`probeAccount` और वैकल्पिक `auditAccount` जाँच चलाता है, इसलिए आउटपुट में ट्रांसपोर्ट
स्थिति के साथ `works`, `probe failed`, `audit ok`, या `audit failed` जैसे जाँच परिणाम शामिल हो सकते हैं।
यदि Gateway पहुँच योग्य नहीं है, तो `channels status` लाइव जाँच आउटपुट के बजाय
केवल-कॉन्फ़िगरेशन सारांशों पर वापस चला जाता है।

## इनबाउंड डेड लेटर

अपनी पुनःप्रयास नीति समाप्त कर चुके इनबाउंड इवेंट, कतार की मौजूदा विफल-प्रविष्टि प्रतिधारण अवधि तक साझा स्थिति डेटाबेस में बने रहते हैं। किसी एक चैनल खाते का निरीक्षण इसके साथ करें:

```bash
openclaw channels dead-letters list --channel telegram --account default
openclaw channels dead-letters list --channel telegram --account default --json
```

टेक्स्ट दृश्य इवेंट आईडी, विफलता के कारण, प्रयासों की संख्या और विफलता की अवधि दिखाता है। निदान के लिए JSON आउटपुट में सुरक्षित रखा गया पेलोड, मेटाडेटा, लेन और प्रयास टाइमस्टैम्प भी शामिल होते हैं।

मूल समस्या ठीक करने के बाद, किसी एक इवेंट को उसकी मूल इवेंट आईडी के साथ फिर से कतार में डालें:

```bash
openclaw channels dead-letters resubmit <event-id> --channel telegram --account default
```

इन कमांड को Gateway होस्ट पर चलाएँ, ताकि वे चैनल रनटाइम वाले उसी साझा स्थिति डेटाबेस तक पहुँचें। पुनःसबमिशन पेलोड, मेटाडेटा और लेन को सुरक्षित रखता है, लेकिन प्रयास काउंटर और कतार की आयु रीसेट कर देता है। यह उस इवेंट के विफल मार्कर को परमाणु रूप से बदलता है, इसलिए इवेंट के लंबित या क्लेम किए हुए होने पर कमांड दोहराने से दूसरा डिस्पैच बनने के बजाय अनुरोध अस्वीकार हो जाता है। चल रहा चैनल इसे अपने अगले इनग्रेस ड्रेन पर उठा लेता है। पूर्ण हो चुके इवेंट टर्मिनल बने रहते हैं और उन्हें पुनःसबमिट नहीं किया जा सकता। पेलोड प्रतिधारण जोड़े जाने से पहले बनाई गई विफल पंक्तियाँ अब भी सूची में दिखाई दे सकती हैं, लेकिन उनका पेलोड अनुपलब्ध होने के कारण पुनःसबमिशन उन्हें अस्वीकार कर देता है।

`openclaw health` प्रत्येक चैनल खाते के लिए डेड-लेटर संख्या और सबसे पुरानी विफलता की आयु रिपोर्ट करता है। `openclaw doctor` प्रभावित खातों के नाम बताता है और निरीक्षण कमांड की ओर वापस निर्देशित करता है।

चैनल सॉकेट के स्वास्थ्य संकेत के रूप में `openclaw sessions`, Gateway `sessions.list`, या एजेंट
`sessions_list` टूल का उपयोग न करें। ये सतहें प्रदाता रनटाइम स्थिति नहीं, बल्कि
संग्रहीत वार्तालाप पंक्तियाँ रिपोर्ट करती हैं। Discord प्रदाता के पुनरारंभ के बाद,
कनेक्टेड लेकिन निष्क्रिय खाता स्वस्थ हो सकता है, जबकि अगला इनबाउंड या आउटबाउंड वार्तालाप
इवेंट आने तक Discord सत्र पंक्ति दिखाई नहीं देती।

## खाते जोड़ना / हटाना

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` प्रत्येक चैनल के फ़्लैग दिखाता है (टोकन, निजी कुंजी, ऐप टोकन, signal-cli पथ आदि)।
</Tip>

`channels remove` केवल इंस्टॉल/कॉन्फ़िगर किए गए चैनल Plugin पर काम करता है। इंस्टॉल करने योग्य कैटलॉग चैनलों के लिए पहले `channels add` का उपयोग करें। `--delete` के बिना यह खाता अक्षम करने के लिए पूछता है और उसका कॉन्फ़िगरेशन बनाए रखता है; `--delete` बिना पूछे कॉन्फ़िगरेशन प्रविष्टियाँ हटा देता है।
रनटाइम-समर्थित चैनल Plugin के लिए, `channels remove` कॉन्फ़िगरेशन अपडेट करने से पहले चल रहे Gateway से चयनित खाता रोकने के लिए भी कहता है, ताकि खाता अक्षम करने या हटाने पर पुराना लिसनर पुनरारंभ होने तक सक्रिय न रहे।

कोर-स्वामित्व वाले गैर-इंटरैक्टिव ऐड फ़्लैग `--account <id>`, `--name <name>`, `--token`, `--token-file`, और `--use-env` हैं (पर्यावरण-समर्थित प्रमाणीकरण, केवल डिफ़ॉल्ट खाता, जहाँ समर्थित हो)। चैनल Plugin अपने स्वयं के सेटअप फ़्लैग प्रदान करते हैं, जिनमें `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--workspace`, `--http-url`, और `--auth-dir` शामिल हैं। चैनल-विशिष्ट फ़्लैग में ये शामिल हैं:

| चैनल       | फ़्लैग                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

यदि फ़्लैग-आधारित ऐड कमांड के दौरान किसी चैनल Plugin को इंस्टॉल करना आवश्यक हो, तो OpenClaw इंटरैक्टिव Plugin इंस्टॉल प्रॉम्प्ट खोले बिना चैनल के डिफ़ॉल्ट इंस्टॉल स्रोत का उपयोग करता है।

जब आप बिना किसी प्रत्यक्ष खाते, क्रेडेंशियल या चैनल-कॉन्फ़िगरेशन फ़्लैग के `openclaw channels add` चलाते हैं, तो इंटरैक्टिव विज़ार्ड प्रॉम्प्ट कर सकता है। स्थितीय चैनल आईडी और `--channel <id>`, दोनों मार्गदर्शन को छोड़े बिना उस चैनल का पूर्वचयन करते हैं:

```bash
openclaw channels add telegram
openclaw channels add --channel telegram
```

विज़ार्ड इनके लिए पूछ सकता है:

- प्रत्येक चयनित चैनल के लिए खाता आईडी
- उन खातों के लिए वैकल्पिक प्रदर्शन नाम
- `Route these channel accounts to agents now?`

यदि आप अभी बाइंड करने की पुष्टि करते हैं, तो विज़ार्ड पूछता है कि प्रत्येक कॉन्फ़िगर किए गए चैनल खाते का स्वामी कौन-सा एजेंट होना चाहिए और खाता-स्कोप वाली रूटिंग बाइंडिंग लिखता है।

आप बाद में उन्हीं रूटिंग नियमों को `openclaw agents bindings`, `openclaw agents bind`, और `openclaw agents unbind` से भी प्रबंधित कर सकते हैं ([एजेंट](/hi/cli/agents) देखें)।

जब आप ऐसे चैनल में गैर-डिफ़ॉल्ट खाता जोड़ते हैं जो अभी भी एकल-खाता शीर्ष-स्तरीय सेटिंग का उपयोग कर रहा है, तो OpenClaw नया खाता लिखने से पहले उन शीर्ष-स्तरीय मानों को चैनल के खाता मैप में पदोन्नत करता है। यदि चैनल में ठीक एक नामित खाता है, या `defaultAccount` किसी खाते की ओर संकेत करता है, तो पदोन्नति मौजूदा नामित खाते का पुनः उपयोग करती है; अन्यथा मान `channels.<channel>.accounts.default` में रखे जाते हैं।

रूटिंग व्यवहार सुसंगत रहता है:

- मौजूदा केवल-चैनल बाइंडिंग (`accountId` के बिना) डिफ़ॉल्ट खाते से मेल खाती रहती हैं।
- `channels add` गैर-इंटरैक्टिव मोड में बाइंडिंग को स्वतः बनाता या फिर से लिखता नहीं है।
- इंटरैक्टिव सेटअप वैकल्पिक रूप से खाता-स्कोप वाली बाइंडिंग जोड़ सकता है।

यदि आपका कॉन्फ़िगरेशन पहले से मिश्रित स्थिति में था (नामित खाते मौजूद थे और शीर्ष-स्तरीय एकल-खाता मान भी अभी सेट थे), तो खाता-स्कोप वाले मानों को उस चैनल के लिए चुने गए पदोन्नत खाते में ले जाने हेतु `openclaw doctor --fix` चलाएँ।

## लॉगिन और लॉगआउट (इंटरैक्टिव)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login`, `--account <id>` और `--verbose` का समर्थन करता है; `channels logout`, `--account <id>` का समर्थन करता है।
- `channels login` और `logout` चैनल का अनुमान लगा सकते हैं जब केवल एक कॉन्फ़िगर किया गया चैनल उस क्रिया का समर्थन करता हो; कई चैनल होने पर `--channel` पास करें।
- जब Gateway पहुँच योग्य होता है, तो `channels logout` लाइव Gateway पथ को प्राथमिकता देता है, ताकि लॉगआउट चैनल प्रमाणीकरण स्थिति साफ़ करने से पहले किसी भी सक्रिय लिसनर को रोक दे। यदि स्थानीय Gateway पहुँच योग्य नहीं है, तो यह स्थानीय प्रमाणीकरण सफ़ाई पर वापस चला जाता है; `gateway.mode: "remote"` के साथ Gateway त्रुटि कमांड को विफल कर देती है।
- सफल लॉगिन के बाद, CLI पहुँच योग्य स्थानीय Gateway से खाता शुरू करने के लिए कहता है; रिमोट मोड में यह प्रमाणीकरण को स्थानीय रूप से सहेजता है और बताता है कि रिमोट रनटाइम पुनरारंभ नहीं किया गया।
- Gateway होस्ट के टर्मिनल से `channels login` चलाएँ। एजेंट `exec` इस इंटरैक्टिव लॉगिन प्रवाह को अवरुद्ध करता है; उपलब्ध होने पर चैट से `whatsapp_login` जैसे चैनल-नेटिव एजेंट लॉगिन टूल का उपयोग किया जाना चाहिए।

## समस्या निवारण

- व्यापक जाँच के लिए `openclaw status --deep` चलाएँ।
- मार्गदर्शित सुधारों के लिए `openclaw doctor` का उपयोग करें।
- Gateway पहुँच योग्य न होने पर `openclaw channels status` केवल-कॉन्फ़िगरेशन सारांशों पर वापस चला जाता है। यदि समर्थित चैनल क्रेडेंशियल SecretRef के माध्यम से कॉन्फ़िगर किया गया है, लेकिन वर्तमान कमांड पथ में अनुपलब्ध है, तो यह उस खाते को गैर-कॉन्फ़िगर दिखाने के बजाय अवनत स्थिति संबंधी टिप्पणियों के साथ कॉन्फ़िगर किया हुआ रिपोर्ट करता है।

## क्षमता जाँच

स्थिर सुविधा समर्थन के साथ प्रदाता क्षमता संकेत (जहाँ उपलब्ध हों वहाँ इंटेंट/स्कोप) प्राप्त करें:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

टिप्पणियाँ:

- `--channel` वैकल्पिक है; प्रत्येक चैनल (Plugin द्वारा दिए गए चैनलों सहित) को सूचीबद्ध करने के लिए इसे छोड़ दें।
- `--account` केवल `--channel` के साथ मान्य है।
- `--target`, `channel:<id>` या कच्ची संख्यात्मक चैनल आईडी स्वीकार करता है और केवल Discord पर लागू होता है। Discord वॉइस चैनलों के लिए अनुमति जाँच अनुपलब्ध `ViewChannel`, `Connect`, `Speak`, `SendMessages`, और `ReadMessageHistory` को चिह्नित करती है।
- जाँच प्रदाता-विशिष्ट होती हैं: Discord बॉट पहचान + इंटेंट और वैकल्पिक चैनल अनुमतियाँ; Slack बॉट + उपयोगकर्ता स्कोप; Telegram बॉट फ़्लैग + Webhook; Signal डेमन संस्करण; Microsoft Teams ऐप टोकन + Graph भूमिकाएँ/स्कोप (जहाँ ज्ञात हों वहाँ टिप्पणियों सहित)। बिना जाँच वाले चैनल `Probe: unavailable` रिपोर्ट करते हैं।

## नामों को आईडी में बदलना

प्रदाता डायरेक्टरी का उपयोग करके चैनल/उपयोगकर्ता नामों को आईडी में बदलें:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

टिप्पणियाँ:

- लक्ष्य प्रकार को बाध्य करने के लिए `--kind user|group|auto` का उपयोग करें।
- जब एक ही नाम वाली कई प्रविष्टियाँ हों, तो समाधान सक्रिय मिलानों को प्राथमिकता देता है।
- `channels resolve` केवल पढ़ने योग्य है। यदि कोई चयनित खाता SecretRef के माध्यम से कॉन्फ़िगर किया गया है, लेकिन वह क्रेडेंशियल वर्तमान कमांड पथ में उपलब्ध नहीं है, तो कमांड पूरा रन निरस्त करने के बजाय टिप्पणियों सहित अवनत, अनसुलझे परिणाम लौटाता है।
- `channels resolve` चैनल Plugin इंस्टॉल नहीं करता। इंस्टॉल किए जा सकने वाले कैटलॉग चैनल के नामों का समाधान करने से पहले `channels add --channel <name>` का उपयोग करें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [चैनलों का अवलोकन](/hi/channels)
