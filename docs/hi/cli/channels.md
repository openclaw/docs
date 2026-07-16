---
read_when:
    - आप चैनल खाते (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp आदि) जोड़ना या हटाना चाहते हैं
    - आप चैनल की स्थिति जाँचना या चैनल लॉग लगातार देखना चाहते हैं
summary: '`openclaw channels` के लिए CLI संदर्भ (खाते, स्थिति, क्षमताएँ, समाधान, लॉग, लॉगिन/लॉगआउट)'
title: चैनल
x-i18n:
    generated_at: "2026-07-16T13:51:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gateway पर चैट चैनल खातों और उनकी रनटाइम स्थिति को प्रबंधित करें।

संबंधित दस्तावेज़:

- चैनल गाइड: [चैनल](/hi/channels)
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
```

`channels list` केवल चैट चैनल दिखाता है: डिफ़ॉल्ट रूप से कॉन्फ़िगर किए गए खाते, प्रत्येक खाते के लिए `installed`, `configured`, और `enabled` स्थिति टैग के साथ (मशीन आउटपुट के लिए `--json`)। उन बंडल चैनलों को भी दिखाने के लिए `--all` पास करें जिनका अभी कोई खाता कॉन्फ़िगर नहीं है, और उन इंस्टॉल किए जा सकने वाले कैटलॉग चैनलों को भी, जो अभी डिस्क पर मौजूद नहीं हैं। प्रदाता प्रमाणीकरण और मॉडल उपयोग की जानकारी अन्यत्र उपलब्ध है: प्रदाता प्रमाणीकरण प्रोफ़ाइलों के लिए `openclaw models auth list`, और उपयोग/कोटा के लिए `openclaw status` या `openclaw models list`।

## स्थिति / क्षमताएँ / समाधान / लॉग

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (डिफ़ॉल्ट `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (`--channel` आवश्यक), `--target <dest>` (`--channel` आवश्यक), `--timeout <ms>` (डिफ़ॉल्ट `10000`, अधिकतम `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (डिफ़ॉल्ट `auto`), `--json`
- `channels logs`: `--channel <name|all>` (डिफ़ॉल्ट `all`), `--lines <n>` (डिफ़ॉल्ट `200`), `--json`

`channels status --probe` लाइव पथ है: पहुँच योग्य Gateway पर यह प्रत्येक खाते के लिए
`probeAccount` और वैकल्पिक `auditAccount` जाँच चलाता है, इसलिए आउटपुट में ट्रांसपोर्ट
स्थिति के साथ `works`, `probe failed`, `audit ok`, या `audit failed` जैसे जाँच परिणाम शामिल हो सकते हैं।
यदि Gateway तक नहीं पहुँचा जा सकता, तो `channels status` लाइव जाँच आउटपुट के बजाय
केवल-कॉन्फ़िगरेशन सारांश पर वापस आ जाता है।

चैनल सॉकेट की स्थिति के संकेत के रूप में `openclaw sessions`, Gateway `sessions.list`, या एजेंट
`sessions_list` टूल का उपयोग न करें। ये सतहें संग्रहीत वार्तालाप पंक्तियों की रिपोर्ट करती हैं,
प्रदाता की रनटाइम स्थिति की नहीं। Discord प्रदाता के पुनः आरंभ होने के बाद, कनेक्ट किया हुआ लेकिन निष्क्रिय खाता
स्वस्थ हो सकता है, जबकि अगली इनबाउंड या आउटबाउंड वार्तालाप घटना तक कोई Discord सत्र
पंक्ति दिखाई न दे।

## खाते जोड़ना / हटाना

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` प्रत्येक चैनल के फ़्लैग दिखाता है (टोकन, निजी कुंजी, ऐप टोकन, signal-cli पथ आदि)।
</Tip>

`channels remove` केवल इंस्टॉल/कॉन्फ़िगर किए गए चैनल plugins पर काम करता है। इंस्टॉल किए जा सकने वाले कैटलॉग चैनलों के लिए पहले `channels add` का उपयोग करें। `--delete` के बिना यह खाते को अक्षम करने के लिए पूछता है और उसका कॉन्फ़िगरेशन बनाए रखता है; `--delete` बिना पूछे कॉन्फ़िगरेशन प्रविष्टियाँ हटा देता है।
रनटाइम-समर्थित चैनल plugins के लिए, `channels remove` कॉन्फ़िगरेशन अपडेट करने से पहले चल रहे Gateway से चयनित खाते को रोकने के लिए भी कहता है, ताकि किसी खाते को अक्षम करने या हटाने के बाद पुराना लिसनर पुनः आरंभ होने तक सक्रिय न रहे।

सभी चैनलों में साझा गैर-इंटरैक्टिव ऐड फ़्लैग: `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir`, और `--use-env` (परिवेश-समर्थित प्रमाणीकरण, केवल डिफ़ॉल्ट खाता, जहाँ समर्थित हो)। चैनल-विशिष्ट फ़्लैग में शामिल हैं:

| चैनल       | फ़्लैग                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

यदि फ़्लैग-संचालित ऐड कमांड के दौरान किसी चैनल Plugin को इंस्टॉल करना आवश्यक हो, तो OpenClaw इंटरैक्टिव Plugin इंस्टॉल प्रॉम्प्ट खोले बिना चैनल के डिफ़ॉल्ट इंस्टॉल स्रोत का उपयोग करता है।

जब आप `openclaw channels add` को बिना फ़्लैग के चलाते हैं, तो इंटरैक्टिव विज़ार्ड इनके लिए पूछ सकता है:

- चयनित प्रत्येक चैनल के खाता आईडी
- उन खातों के लिए वैकल्पिक प्रदर्शन नाम
- `Route these channel accounts to agents now?`

यदि आप अभी बाइंड करने की पुष्टि करते हैं, तो विज़ार्ड पूछता है कि प्रत्येक कॉन्फ़िगर किए गए चैनल खाते का स्वामी कौन-सा एजेंट होना चाहिए और खाता-क्षेत्र वाले रूटिंग बाइंडिंग लिखता है।

आप बाद में इन्हीं रूटिंग नियमों को `openclaw agents bindings`, `openclaw agents bind`, और `openclaw agents unbind` के साथ भी प्रबंधित कर सकते हैं ([एजेंट](/hi/cli/agents) देखें)।

जब आप किसी ऐसे चैनल में गैर-डिफ़ॉल्ट खाता जोड़ते हैं जो अभी भी एकल-खाता शीर्ष-स्तरीय सेटिंग्स का उपयोग कर रहा है, तो OpenClaw नया खाता लिखने से पहले उन शीर्ष-स्तरीय मानों को चैनल के खाता मैप में प्रोमोट करता है। यदि चैनल में ठीक एक नामित खाता हो, या `defaultAccount` किसी खाते की ओर इंगित करता हो, तो प्रोमोशन मौजूदा नामित खाते का पुनः उपयोग करता है; अन्यथा मान `channels.<channel>.accounts.default` में पहुँचते हैं।

रूटिंग व्यवहार सुसंगत रहता है:

- मौजूदा केवल-चैनल बाइंडिंग (कोई `accountId` नहीं) डिफ़ॉल्ट खाते से मेल खाते रहते हैं।
- `channels add` गैर-इंटरैक्टिव मोड में बाइंडिंग को अपने-आप बनाता या दोबारा नहीं लिखता।
- इंटरैक्टिव सेटअप वैकल्पिक रूप से खाता-क्षेत्र वाले बाइंडिंग जोड़ सकता है।

यदि आपका कॉन्फ़िगरेशन पहले से मिश्रित स्थिति में था (नामित खाते मौजूद थे और शीर्ष-स्तरीय एकल-खाता मान भी अब तक सेट थे), तो खाता-क्षेत्र वाले मानों को उस चैनल के लिए चुने गए प्रोमोटेड खाते में ले जाने हेतु `openclaw doctor --fix` चलाएँ।

## लॉगिन और लॉगआउट (इंटरैक्टिव)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login`, `--account <id>` और `--verbose` का समर्थन करता है; `channels logout`, `--account <id>` का समर्थन करता है।
- जब केवल एक कॉन्फ़िगर किया गया चैनल उस क्रिया का समर्थन करता हो, तो `channels login` और `logout` चैनल का अनुमान लगा सकते हैं; एक से अधिक होने पर `--channel` पास करें।
- `channels logout` पहुँच योग्य होने पर लाइव Gateway पथ को प्राथमिकता देता है, ताकि चैनल प्रमाणीकरण स्थिति साफ़ करने से पहले लॉगआउट किसी भी सक्रिय लिसनर को रोक दे। यदि स्थानीय Gateway तक नहीं पहुँचा जा सकता, तो यह स्थानीय प्रमाणीकरण सफ़ाई पर वापस आ जाता है; `gateway.mode: "remote"` के साथ Gateway त्रुटि के कारण कमांड विफल हो जाता है।
- सफल लॉगिन के बाद, CLI पहुँच योग्य स्थानीय Gateway से खाता शुरू करने के लिए कहता है; रिमोट मोड में यह प्रमाणीकरण को स्थानीय रूप से सहेजता है और बताता है कि रिमोट रनटाइम पुनः आरंभ नहीं हुआ।
- `channels login` को Gateway होस्ट के टर्मिनल से चलाएँ। एजेंट `exec` इस इंटरैक्टिव लॉगिन प्रवाह को अवरुद्ध करता है; उपलब्ध होने पर चैट से `whatsapp_login` जैसे चैनल-नेटिव एजेंट लॉगिन टूल का उपयोग करना चाहिए।

## समस्या निवारण

- व्यापक जाँच के लिए `openclaw status --deep` चलाएँ।
- निर्देशित सुधारों के लिए `openclaw doctor` का उपयोग करें।
- Gateway तक न पहुँचा जा सकने पर `openclaw channels status` केवल-कॉन्फ़िगरेशन सारांश पर वापस आ जाता है। यदि कोई समर्थित चैनल क्रेडेंशियल SecretRef के माध्यम से कॉन्फ़िगर किया गया है, लेकिन वर्तमान कमांड पथ में उपलब्ध नहीं है, तो यह उस खाते को कॉन्फ़िगर नहीं दिखाने के बजाय अवक्रमित टिप्पणियों के साथ कॉन्फ़िगर किया हुआ बताता है।

## क्षमता जाँच

प्रदाता क्षमता संकेत (जहाँ उपलब्ध हों वहाँ इंटेंट/स्कोप) और स्थिर सुविधा समर्थन प्राप्त करें:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

टिप्पणियाँ:

- `--channel` वैकल्पिक है; प्रत्येक चैनल (Plugin-प्रदत्त चैनलों सहित) को सूचीबद्ध करने के लिए इसे छोड़ दें।
- `--account` केवल `--channel` के साथ मान्य है।
- `--target`, `channel:<id>` या कच्ची संख्यात्मक चैनल आईडी स्वीकार करता है और केवल Discord पर लागू होता है। Discord वॉइस चैनलों के लिए, अनुमति जाँच अनुपलब्ध `ViewChannel`, `Connect`, `Speak`, `SendMessages`, और `ReadMessageHistory` को चिह्नित करती है।
- जाँच प्रदाता-विशिष्ट होती हैं: Discord बॉट पहचान + इंटेंट और वैकल्पिक चैनल अनुमतियाँ; Slack बॉट + उपयोगकर्ता स्कोप; Telegram बॉट फ़्लैग + Webhook; Signal डेमन संस्करण; Microsoft Teams ऐप टोकन + Graph भूमिकाएँ/स्कोप (जहाँ ज्ञात हों, वहाँ टिप्पणी सहित)। बिना जाँच वाले चैनल `Probe: unavailable` रिपोर्ट करते हैं।

## नामों को आईडी में बदलना

प्रदाता डायरेक्टरी का उपयोग करके चैनल/उपयोगकर्ता नामों को आईडी में बदलें:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

टिप्पणियाँ:

- लक्ष्य प्रकार को बाध्य करने के लिए `--kind user|group|auto` का उपयोग करें।
- जब कई प्रविष्टियों का नाम समान हो, तो समाधान सक्रिय मेल को प्राथमिकता देता है।
- `channels resolve` केवल-पढ़ने योग्य है। यदि कोई चयनित खाता SecretRef के माध्यम से कॉन्फ़िगर किया गया है, लेकिन वह क्रेडेंशियल वर्तमान कमांड पथ में उपलब्ध नहीं है, तो कमांड पूरे रन को निरस्त करने के बजाय टिप्पणियों सहित अवक्रमित अनसुलझे परिणाम लौटाता है।
- `channels resolve` चैनल plugins इंस्टॉल नहीं करता। इंस्टॉल किए जा सकने वाले कैटलॉग चैनल के नाम हल करने से पहले `channels add --channel <name>` का उपयोग करें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [चैनलों का अवलोकन](/hi/channels)
