---
read_when:
    - आप चैनल खाते (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp और अन्य) जोड़ना या हटाना चाहते हैं
    - आप चैनल की स्थिति जाँचना या चैनल लॉग का अंतिम भाग देखना चाहते हैं
    - आपको विफल इनबाउंड चैनल इवेंट की जाँच करनी है या उसे फिर से सबमिट करना है
summary: '`openclaw channels` के लिए CLI संदर्भ (खाते, स्थिति, डेड लेटर्स, क्षमताएँ, समाधान, लॉग, लॉगिन/लॉगआउट)'
title: चैनल
x-i18n:
    generated_at: "2026-07-19T09:04:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d276a1696aa9308867e5ec447788ffb3f2b8750c4d9744b2e68578b940558e8
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

`channels list` केवल चैट चैनल दिखाता है: डिफ़ॉल्ट रूप से कॉन्फ़िगर किए गए खाते, प्रत्येक खाते के लिए `installed`, `configured`, और `enabled` स्थिति टैग के साथ (मशीन आउटपुट के लिए `--json`)। उन बंडल किए गए चैनलों को भी दिखाने के लिए `--all` दें, जिनका अभी कोई कॉन्फ़िगर किया गया खाता नहीं है, और उन इंस्टॉल करने योग्य कैटलॉग चैनलों को भी, जो अभी डिस्क पर नहीं हैं। प्रदाता प्रमाणीकरण और मॉडल उपयोग अन्य स्थानों पर उपलब्ध हैं: प्रदाता प्रमाणीकरण प्रोफ़ाइलों के लिए `openclaw models auth list`, उपयोग/कोटा के लिए `openclaw status` या `openclaw models list`।

## स्थिति / क्षमताएँ / समाधान / लॉग

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (डिफ़ॉल्ट `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (`--channel` आवश्यक), `--target <dest>` (`--channel` आवश्यक), `--timeout <ms>` (डिफ़ॉल्ट `10000`, अधिकतम `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (डिफ़ॉल्ट `auto`), `--json`
- `channels logs`: `--channel <name|all>` (डिफ़ॉल्ट `all`), `--lines <n>` (डिफ़ॉल्ट `200`), `--json`

`channels status --probe` लाइव पथ है: पहुँच योग्य Gateway पर यह प्रत्येक खाते के लिए
`probeAccount` और वैकल्पिक `auditAccount` जाँच चलाता है, इसलिए आउटपुट में ट्रांसपोर्ट
स्थिति के साथ `works`, `probe failed`, `audit ok`, या `audit failed` जैसे जाँच परिणाम शामिल हो सकते हैं।
यदि Gateway तक नहीं पहुँचा जा सकता, तो `channels status` लाइव जाँच आउटपुट के बजाय
केवल-कॉन्फ़िगरेशन सारांश पर वापस चला जाता है।

## इनबाउंड डेड लेटर

इनबाउंड इवेंट जो अपनी पुनःप्रयास नीति समाप्त कर देते हैं, क्यू की मौजूदा विफल-प्रविष्टि अवधारण अवधि तक साझा स्थिति डेटाबेस में रहते हैं। किसी एक चैनल खाते का निरीक्षण इसके साथ करें:

```bash
openclaw channels dead-letters list --channel telegram --account default
openclaw channels dead-letters list --channel telegram --account default --json
```

टेक्स्ट दृश्य इवेंट आईडी, विफलता के कारण, प्रयासों की संख्या और विफलता की अवधि दिखाता है। निदान के लिए JSON आउटपुट में संरक्षित पेलोड, मेटाडेटा, लेन और प्रयासों के टाइमस्टैम्प भी शामिल होते हैं।

मूल समस्या ठीक करने के बाद, किसी एक इवेंट को उसकी मूल इवेंट आईडी के साथ फिर से क्यू में डालें:

```bash
openclaw channels dead-letters resubmit <event-id> --channel telegram --account default
```

इन कमांड को Gateway होस्ट पर चलाएँ, ताकि वे चैनल रनटाइम के समान साझा स्थिति डेटाबेस तक पहुँचें। पुनःसबमिशन पेलोड, मेटाडेटा और लेन को बनाए रखता है, लेकिन प्रयास काउंटर और क्यू की अवधि को रीसेट करता है। यह उस इवेंट के विफलता मार्कर को परमाण्विक रूप से बदल देता है, इसलिए इवेंट के लंबित या क्लेम किए हुए होने पर कमांड दोहराने से दूसरा डिस्पैच बनाने के बजाय अनुरोध अस्वीकार हो जाता है। चल रहा चैनल इसे अपने अगले इनग्रेस ड्रेन में उठा लेता है। पूर्ण हो चुके इवेंट अंतिम स्थिति में रहते हैं और उन्हें फिर से सबमिट नहीं किया जा सकता। पेलोड अवधारण जोड़े जाने से पहले बनाई गई विफल पंक्तियाँ अब भी सूची में दिखाई दे सकती हैं, लेकिन उनका पेलोड उपलब्ध न होने के कारण पुनःसबमिशन उन्हें अस्वीकार कर देता है।

`openclaw health` प्रत्येक चैनल खाते के लिए डेड-लेटर संख्या और सबसे पुरानी विफलता की अवधि रिपोर्ट करता है। `openclaw doctor` प्रभावित खातों के नाम देता है और निरीक्षण कमांड की ओर वापस निर्देशित करता है।

चैनल सॉकेट के स्वास्थ्य संकेत के रूप में `openclaw sessions`, Gateway `sessions.list`, या एजेंट
`sessions_list` टूल का उपयोग न करें। ये सतहें संग्रहीत वार्तालाप पंक्तियाँ रिपोर्ट करती हैं,
प्रदाता रनटाइम स्थिति नहीं। Discord प्रदाता को पुनः आरंभ करने के बाद,
कनेक्टेड लेकिन निष्क्रिय खाता स्वस्थ हो सकता है, जबकि अगले इनबाउंड या आउटबाउंड वार्तालाप इवेंट तक
कोई Discord सत्र पंक्ति दिखाई न दे।

## खाते जोड़ना / हटाना

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` प्रत्येक चैनल के फ़्लैग (टोकन, निजी कुंजी, ऐप टोकन, signal-cli पथ आदि) दिखाता है।
</Tip>

`channels remove` केवल इंस्टॉल/कॉन्फ़िगर किए गए चैनल plugins पर कार्य करता है। इंस्टॉल करने योग्य कैटलॉग चैनलों के लिए पहले `channels add` का उपयोग करें। `--delete` के बिना यह खाते को अक्षम करने के लिए पूछता है और उसका कॉन्फ़िगरेशन बनाए रखता है; `--delete` बिना पूछे कॉन्फ़िगरेशन प्रविष्टियाँ हटा देता है।
रनटाइम-समर्थित चैनल plugins के लिए, `channels remove` कॉन्फ़िगरेशन अपडेट करने से पहले चल रहे Gateway को चयनित खाता रोकने के लिए भी कहता है, ताकि खाता अक्षम करने या हटाने पर पुराना लिसनर पुनः आरंभ होने तक सक्रिय न रहे।

सभी चैनलों में साझा गैर-इंटरैक्टिव ऐड फ़्लैग: `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir`, और `--use-env` (परिवेश-समर्थित प्रमाणीकरण, केवल डिफ़ॉल्ट खाता, जहाँ समर्थित हो)। चैनल-विशिष्ट फ़्लैग में शामिल हैं:

| चैनल     | फ़्लैग                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

यदि फ़्लैग-चालित ऐड कमांड के दौरान किसी चैनल plugin को इंस्टॉल करने की आवश्यकता हो, तो OpenClaw इंटरैक्टिव plugin इंस्टॉल प्रॉम्प्ट खोले बिना चैनल के डिफ़ॉल्ट इंस्टॉल स्रोत का उपयोग करता है।

जब `openclaw channels add` को बिना फ़्लैग के चलाया जाता है, तो इंटरैक्टिव विज़ार्ड निम्न के लिए संकेत दे सकता है:

- प्रत्येक चयनित चैनल के लिए खाता आईडी
- उन खातों के लिए वैकल्पिक प्रदर्शन नाम
- `Route these channel accounts to agents now?`

यदि अभी बाइंड करने की पुष्टि की जाती है, तो विज़ार्ड पूछता है कि प्रत्येक कॉन्फ़िगर किए गए चैनल खाते का स्वामी कौन-सा एजेंट होना चाहिए और खाता-स्कोप वाले रूटिंग बाइंडिंग लिखता है।

बाद में इन्हीं रूटिंग नियमों को `openclaw agents bindings`, `openclaw agents bind`, और `openclaw agents unbind` के साथ भी प्रबंधित किया जा सकता है ([एजेंट](/hi/cli/agents) देखें)।

जब किसी ऐसे चैनल में गैर-डिफ़ॉल्ट खाता जोड़ा जाता है जो अभी भी एकल-खाता शीर्ष-स्तरीय सेटिंग का उपयोग कर रहा हो, तो OpenClaw नया खाता लिखने से पहले उन शीर्ष-स्तरीय मानों को चैनल के खाता मैप में प्रोमोट करता है। यदि चैनल में ठीक एक नामित खाता हो, या `defaultAccount` किसी खाते की ओर संकेत करता हो, तो प्रोमोशन मौजूदा नामित खाते का पुनः उपयोग करता है; अन्यथा मान `channels.<channel>.accounts.default` में जाते हैं।

रूटिंग व्यवहार एकसमान रहता है:

- मौजूदा केवल-चैनल बाइंडिंग (कोई `accountId` नहीं) डिफ़ॉल्ट खाते से मेल खाते रहते हैं।
- `channels add` गैर-इंटरैक्टिव मोड में बाइंडिंग को स्वतः बनाता या पुनर्लिखता नहीं है।
- इंटरैक्टिव सेटअप वैकल्पिक रूप से खाता-स्कोप वाली बाइंडिंग जोड़ सकता है।

यदि आपका कॉन्फ़िगरेशन पहले से मिश्रित स्थिति में था (नामित खाते मौजूद थे और शीर्ष-स्तरीय एकल-खाता मान भी सेट थे), तो खाते के स्कोप वाले मानों को उस चैनल के लिए चुने गए प्रोमोटेड खाते में ले जाने के लिए `openclaw doctor --fix` चलाएँ।

## लॉगिन और लॉगआउट (इंटरैक्टिव)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login`, `--account <id>` और `--verbose` का समर्थन करता है; `channels logout`, `--account <id>` का समर्थन करता है।
- जब केवल एक कॉन्फ़िगर किया गया चैनल उस क्रिया का समर्थन करता है, तो `channels login` और `logout` चैनल का अनुमान लगा सकते हैं; एकाधिक होने पर `--channel` दें।
- पहुँच योग्य होने पर `channels logout` लाइव Gateway पथ को प्राथमिकता देता है, इसलिए लॉगआउट चैनल प्रमाणीकरण स्थिति साफ़ करने से पहले किसी भी सक्रिय लिसनर को रोक देता है। यदि स्थानीय Gateway तक नहीं पहुँचा जा सकता, तो यह स्थानीय प्रमाणीकरण सफ़ाई पर वापस चला जाता है; `gateway.mode: "remote"` के साथ Gateway त्रुटि के कारण कमांड विफल हो जाता है।
- सफल लॉगिन के बाद, CLI पहुँच योग्य स्थानीय Gateway से खाता शुरू करने के लिए कहता है; रिमोट मोड में यह प्रमाणीकरण स्थानीय रूप से सहेजता है और बताता है कि रिमोट रनटाइम को पुनः आरंभ नहीं किया गया।
- Gateway होस्ट के टर्मिनल से `channels login` चलाएँ। एजेंट `exec` इस इंटरैक्टिव लॉगिन प्रवाह को अवरुद्ध करता है; उपलब्ध होने पर चैट से `whatsapp_login` जैसे चैनल-नेटिव एजेंट लॉगिन टूल का उपयोग किया जाना चाहिए।

## समस्या निवारण

- व्यापक जाँच के लिए `openclaw status --deep` चलाएँ।
- निर्देशित सुधारों के लिए `openclaw doctor` का उपयोग करें।
- Gateway तक नहीं पहुँचा जा सकने पर `openclaw channels status` केवल-कॉन्फ़िगरेशन सारांश पर वापस चला जाता है। यदि किसी समर्थित चैनल क्रेडेंशियल को SecretRef के माध्यम से कॉन्फ़िगर किया गया है, लेकिन वह वर्तमान कमांड पथ में उपलब्ध नहीं है, तो यह खाते को गैर-कॉन्फ़िगर दिखाने के बजाय अवनत टिप्पणियों के साथ कॉन्फ़िगर किया हुआ रिपोर्ट करता है।

## क्षमताओं की जाँच

स्थिर सुविधा समर्थन के साथ प्रदाता क्षमता संकेत (जहाँ उपलब्ध हों वहाँ इंटेंट/स्कोप) प्राप्त करें:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

टिप्पणियाँ:

- `--channel` वैकल्पिक है; प्रत्येक चैनल (plugin-प्रदत्त चैनलों सहित) सूचीबद्ध करने के लिए इसे छोड़ दें।
- `--account` केवल `--channel` के साथ मान्य है।
- `--target`, `channel:<id>` या कच्ची संख्यात्मक चैनल आईडी स्वीकार करता है और केवल Discord पर लागू होता है। Discord वॉइस चैनलों के लिए अनुमति जाँच अनुपलब्ध `ViewChannel`, `Connect`, `Speak`, `SendMessages`, और `ReadMessageHistory` को चिह्नित करती है।
- जाँच प्रदाता-विशिष्ट होती हैं: Discord बॉट पहचान + इंटेंट और वैकल्पिक चैनल अनुमतियाँ; Slack बॉट + उपयोगकर्ता स्कोप; Telegram बॉट फ़्लैग + webhook; Signal डेमन संस्करण; Microsoft Teams ऐप टोकन + Graph भूमिकाएँ/स्कोप (जहाँ ज्ञात हो वहाँ टिप्पणी सहित)। बिना जाँच वाले चैनल `Probe: unavailable` रिपोर्ट करते हैं।

## नामों का आईडी में समाधान

प्रदाता डायरेक्टरी का उपयोग करके चैनल/उपयोगकर्ता नामों को आईडी में बदलें:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

टिप्पणियाँ:

- लक्ष्य प्रकार को बाध्य करने के लिए `--kind user|group|auto` का उपयोग करें।
- जब एकाधिक प्रविष्टियों का नाम समान हो, तो समाधान सक्रिय मिलानों को प्राथमिकता देता है।
- `channels resolve` केवल-पठन है। यदि किसी चयनित खाते को SecretRef के माध्यम से कॉन्फ़िगर किया गया है, लेकिन वह क्रेडेंशियल वर्तमान कमांड पथ में उपलब्ध नहीं है, तो कमांड संपूर्ण रन निरस्त करने के बजाय टिप्पणियों सहित अवनत अनसुलझे परिणाम लौटाता है।
- `channels resolve` चैनल plugins इंस्टॉल नहीं करता। इंस्टॉल करने योग्य कैटलॉग चैनल के नामों का समाधान करने से पहले `channels add --channel <name>` का उपयोग करें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [चैनलों का अवलोकन](/hi/channels)
