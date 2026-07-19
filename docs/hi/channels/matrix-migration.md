---
read_when:
    - मौजूदा Matrix इंस्टॉलेशन को अपग्रेड करना
    - एन्क्रिप्टेड Matrix इतिहास और डिवाइस स्थिति का माइग्रेशन
summary: OpenClaw पिछले Matrix Plugin को उसी स्थान पर कैसे अपग्रेड करता है, जिसमें एन्क्रिप्टेड-स्थिति पुनर्प्राप्ति सीमाएँ और मैन्युअल पुनर्प्राप्ति चरण शामिल हैं।
title: Matrix माइग्रेशन
x-i18n:
    generated_at: "2026-07-19T07:58:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 475c96914900a5597f37001264bd3d8f69a69dbd0600f2704c2a1be46924fac4
    source_path: channels/matrix-migration.md
    workflow: 16
---

पिछले सार्वजनिक `matrix` Plugin से वर्तमान कार्यान्वयन पर अपग्रेड करें।

अधिकांश उपयोगकर्ताओं के लिए, अपग्रेड पहले से लागू है:

- Plugin `@openclaw/matrix` ही रहता है
- चैनल `matrix` ही रहता है
- आपका कॉन्फ़िगरेशन `channels.matrix` के अंतर्गत ही रहता है
- कैश किए गए क्रेडेंशियल साझा `state/openclaw.sqlite` Plugin स्थिति में चले जाते हैं
- रनटाइम स्थिति `~/.openclaw/matrix/` के अंतर्गत ही रहती है

आपको कॉन्फ़िगरेशन कुंजियों के नाम बदलने या Plugin को नए नाम से दोबारा इंस्टॉल करने की आवश्यकता नहीं है।
रूट `openclaw` पैकेज में अब Matrix रनटाइम कोड या Matrix SDK
निर्भरताएँ बंडल नहीं होतीं। यदि `openclaw channels status` दिखाता है कि Matrix कॉन्फ़िगर किया गया है, लेकिन
Plugin इंस्टॉल नहीं है, तो `openclaw doctor --fix` या
`openclaw plugins install @openclaw/matrix` चलाएँ; Matrix SDK पैकेजों को
रूट OpenClaw पैकेज में इंस्टॉल न करें।

## माइग्रेशन स्वचालित रूप से क्या करता है

जब आप [`openclaw doctor --fix`](/hi/gateway/doctor) चलाते हैं, तब Matrix माइग्रेशन चलता है। समर्पित Matrix स्टोर के पास मौजूद फ़ाइल-आधारित साइडकार अपने क्लाइंट-स्टार्ट फ़ॉलबैक को बनाए रखते हैं, लेकिन क्रेडेंशियल-फ़ाइल आयात केवल Doctor में होता है; रनटाइम केवल कैनोनिकल SQLite क्रेडेंशियल स्थिति पढ़ता है।

Doctor माइग्रेशन में ये शामिल हैं:

- सेवानिवृत्त `~/.openclaw/credentials/matrix/credentials*.json` फ़ाइलों को संग्रहित करने से पहले आयात और सत्यापित करना
- समान खाता चयन और `channels.matrix` कॉन्फ़िगरेशन बनाए रखना
- फ़ाइल-आधारित साइडकार स्थिति (`bot-storage.json` सिंक कैश, `recovery-key.json`, `legacy-crypto-migration.json`, IndexedDB स्नैपशॉट) को Matrix SQLite स्थिति में आयात करना; माइग्रेट की गई फ़ाइलें `.migrated` प्रत्यय के साथ संग्रहित की जाती हैं
- बाद में ऐक्सेस टोकन बदलने पर उसी Matrix खाते, होमसर्वर, उपयोगकर्ता और डिवाइस के लिए सबसे पूर्ण मौजूदा टोकन-हैश स्टोरेज रूट का पुनः उपयोग करना

## 2026.4 से पुराने OpenClaw रिलीज़ से अपग्रेड करना

2026.6 शृंखला तक के रिलीज़ मूल सपाट एकल-स्टोर
Matrix लेआउट (`~/.openclaw/matrix/bot-storage.json` और
`~/.openclaw/matrix/crypto/`) को भी माइग्रेट करते थे और पुराने rust क्रिप्टो स्टोर से
एन्क्रिप्टेड स्थिति की पुनर्प्राप्ति तैयार करते थे। वर्तमान रिलीज़ में अब वह माइग्रेशन शामिल नहीं है।

यदि आप ऐसे इंस्टॉलेशन को अपग्रेड कर रहे हैं जो अब भी सपाट लेआउट का उपयोग करता है, तो पहले
2026.6 रिलीज़ पर अपग्रेड करें, `openclaw doctor --fix` चलाएँ और Gateway को
एक बार शुरू करें, ताकि सपाट स्टोर और पुनर्प्राप्त किए जा सकने वाले सभी रूम कुंजी माइग्रेट हो जाएँ। इसके बाद
नवीनतम रिलीज़ पर अपडेट करें।

पिछला सार्वजनिक Matrix Plugin Matrix रूम-कुंजी बैकअप स्वचालित रूप से **नहीं** बनाता था। यदि आपके पुराने इंस्टॉलेशन में केवल स्थानीय रूप से उपलब्ध एन्क्रिप्टेड इतिहास था जिसका कभी बैकअप नहीं लिया गया, तो माइग्रेशन पथ चाहे जो भी हो, अपग्रेड के बाद कुछ पुराने एन्क्रिप्टेड संदेश अपठनीय रह सकते हैं।

## अनुशंसित अपग्रेड प्रवाह

1. OpenClaw और Matrix Plugin को सामान्य तरीके से अपडेट करें।
2. चलाएँ:

   ```bash
   openclaw doctor --fix
   ```

3. Gateway को शुरू या पुनः शुरू करें।
4. वर्तमान सत्यापन और बैकअप स्थिति जाँचें:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. जिस Matrix खाते की आप मरम्मत कर रहे हैं, उसकी पुनर्प्राप्ति कुंजी को खाता-विशिष्ट पर्यावरण चर में रखें। एकल डिफ़ॉल्ट खाते के लिए `MATRIX_RECOVERY_KEY` पर्याप्त है। एकाधिक खातों के लिए प्रत्येक खाते हेतु एक चर उपयोग करें, उदाहरण के लिए `MATRIX_RECOVERY_KEY_ASSISTANT`, और कमांड में `--account assistant` जोड़ें।

6. यदि OpenClaw बताता है कि पुनर्प्राप्ति कुंजी आवश्यक है, तो संबंधित खाते के लिए कमांड चलाएँ:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. यदि यह डिवाइस अब भी असत्यापित है, तो संबंधित खाते के लिए कमांड चलाएँ:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   यदि पुनर्प्राप्ति कुंजी स्वीकार कर ली जाती है और बैकअप उपयोग योग्य है, लेकिन `Cross-signing verified`
   अब भी `no` है, तो किसी अन्य Matrix क्लाइंट से स्व-सत्यापन पूरा करें:

   ```bash
   openclaw matrix verify self
   ```

   किसी अन्य Matrix क्लाइंट में अनुरोध स्वीकार करें, इमोजी या दशमलवों की तुलना करें,
   और केवल उनके मेल खाने पर `yes` टाइप करें। सफलता की सूचना देने से पहले कमांड पूर्ण Matrix
   पहचान विश्वास की प्रतीक्षा करता है।

8. यदि आप जानबूझकर पुनर्प्राप्त न हो सकने वाले पुराने इतिहास को छोड़ रहे हैं और भविष्य के संदेशों के लिए नया बैकअप आधार चाहते हैं, तो चलाएँ:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   केवल तभी `--rotate-recovery-key` जोड़ें जब पुरानी पुनर्प्राप्ति कुंजी से नए बैकअप को अनलॉक करना बंद कराना हो।

9. यदि अभी तक सर्वर-साइड कुंजी बैकअप मौजूद नहीं है, तो भविष्य की पुनर्प्राप्तियों के लिए एक बैकअप बनाएँ:

   ```bash
   openclaw matrix verify bootstrap
   ```

## सामान्य संदेश और उनके अर्थ

`Failed migrating legacy Matrix client storage: ...`

- अर्थ: Matrix क्लाइंट-साइड फ़ॉलबैक को फ़ाइल-आधारित साइडकार स्थिति मिली, लेकिन SQLite में आयात विफल रहा। OpenClaw पूर्ण किए गए स्थानांतरण वापस लेता है और नए स्टोर के साथ चुपचाप शुरू होने के बजाय उस फ़ॉलबैक को निरस्त कर देता है।
- क्या करें: फ़ाइल सिस्टम अनुमतियों या टकरावों की जाँच करें, पुरानी स्थिति को अक्षुण्ण रखें और त्रुटि ठीक करने के बाद पुनः प्रयास करें।

`Matrix is installed from a custom path: ...`

- अर्थ: Matrix को पाथ इंस्टॉल पर पिन किया गया है, इसलिए मुख्यधारा के अपडेट उसे डिफ़ॉल्ट Matrix पैकेज से स्वचालित रूप से प्रतिस्थापित नहीं करते।
- क्या करें: जब आप डिफ़ॉल्ट Matrix Plugin पर वापस जाना चाहते हों, तो `openclaw plugins install @openclaw/matrix` के साथ दोबारा इंस्टॉल करें।

`Matrix is installed from a custom path that no longer exists: ...`

- अर्थ: आपका Plugin इंस्टॉल रिकॉर्ड ऐसे स्थानीय पाथ की ओर संकेत करता है जो अब मौजूद नहीं है।
- क्या करें: `openclaw plugins install @openclaw/matrix` के साथ दोबारा इंस्टॉल करें, या यदि आप किसी रिपॉज़िटरी चेकआउट से चला रहे हैं, तो `openclaw plugins install ./path/to/local/matrix-plugin` का उपयोग करें। `openclaw doctor --fix` आपके लिए पुराने Matrix Plugin संदर्भ भी हटा सकता है।

### मैन्युअल पुनर्प्राप्ति संदेश

जब इस डिवाइस पर रूम-कुंजी बैकअप ठीक स्थिति में नहीं होता, तब `openclaw matrix verify status` और `openclaw matrix verify backup status`, `Backup issue:` पंक्ति के साथ `Next steps:` मार्गदर्शन प्रिंट करते हैं:

| बैकअप समस्या                                                          | अर्थ                                            | समाधान                                                                                                                                       |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | पुनर्स्थापित करने के लिए कुछ नहीं है                            | रूम कुंजी बैकअप बनाने के लिए `openclaw matrix verify bootstrap`                                                                            |
| `backup decryption key is not loaded on this device`                  | कुंजी मौजूद है, लेकिन यहाँ सक्रिय नहीं है                  | `openclaw matrix verify backup restore`; यदि यह फिर भी कुंजी लोड नहीं कर पाता, तो पुनर्प्राप्ति कुंजी को `--recovery-key-stdin` के माध्यम से पाइप करें                |
| `backup decryption key could not be loaded from secret storage (...)` | गुप्त स्टोरेज लोड विफल हुआ या समर्थित नहीं है       | पुनर्प्राप्ति कुंजी पाइप करें: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`               |
| `backup key mismatch (...)`                                           | संग्रहीत कुंजी सक्रिय सर्वर बैकअप से मेल नहीं खाती | सक्रिय सर्वर बैकअप कुंजी के साथ `verify backup restore --recovery-key-stdin` फिर चलाएँ, या नए आधार के लिए `verify backup reset --yes` |
| `backup signature chain is not trusted by this device`                | डिवाइस अभी तक क्रॉस-साइनिंग शृंखला पर विश्वास नहीं करता  | `verify device --recovery-key-stdin`, फिर यदि विश्वास अब भी अधूरा है तो किसी अन्य सत्यापित क्लाइंट से `verify self`                        |
| `backup exists but is not active on this device`                      | सर्वर बैकअप मौजूद है, स्थानीय सत्र निष्क्रिय है      | पहले डिवाइस सत्यापित करें, फिर `openclaw matrix verify backup status` से दोबारा जाँचें                                                         |
| `backup trust state could not be fully determined`                    | निदान अनिर्णायक रहा                      | `openclaw matrix verify status --verbose`                                                                                                 |

अन्य पुनर्प्राप्ति त्रुटियाँ:

`Matrix recovery key is required`

- अर्थ: आपने ऐसी स्थिति में पुनर्प्राप्ति कुंजी दिए बिना पुनर्प्राप्ति चरण चलाने का प्रयास किया, जहाँ इसकी आवश्यकता थी।
- क्या करें: `--recovery-key-stdin` के साथ कमांड फिर चलाएँ, उदाहरण के लिए `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`।

`Invalid Matrix recovery key: ...`

- अर्थ: दी गई कुंजी को पार्स नहीं किया जा सका या वह अपेक्षित प्रारूप से मेल नहीं खाती।
- क्या करें: अपने Matrix क्लाइंट या पुनर्प्राप्ति-कुंजी निर्यात से मिली सटीक पुनर्प्राप्ति कुंजी के साथ पुनः प्रयास करें।

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- अर्थ: पुनर्प्राप्ति कुंजी ने उपयोग योग्य बैकअप सामग्री अनलॉक कर दी, लेकिन Matrix ने इस डिवाइस के लिए अभी तक पूर्ण क्रॉस-साइनिंग पहचान विश्वास स्थापित नहीं किया है। कमांड आउटपुट में `Recovery key accepted`, `Backup usable`, `Cross-signing verified`, और `Device verified by owner` जाँचें।
- क्या करें: `openclaw matrix verify self` चलाएँ, किसी अन्य Matrix क्लाइंट में अनुरोध स्वीकार करें, SAS की तुलना करें और केवल उसके मेल खाने पर `yes` टाइप करें। `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` का उपयोग केवल तभी करें जब आप जानबूझकर वर्तमान क्रॉस-साइनिंग पहचान को प्रतिस्थापित करना चाहते हों।

यदि आप पुनर्प्राप्त न हो सकने वाले पुराने एन्क्रिप्टेड इतिहास को खोना स्वीकार करते हैं, तो इसके बजाय
`openclaw matrix verify backup reset --yes` के साथ वर्तमान बैकअप आधार रीसेट कर सकते हैं। जब
संग्रहीत बैकअप सीक्रेट खराब होता है, तो यह रीसेट गुप्त स्टोरेज की मरम्मत भी करता है, ताकि
पुनः शुरू होने के बाद नई बैकअप कुंजी सही ढंग से लोड हो सके।

## यदि एन्क्रिप्टेड इतिहास फिर भी वापस नहीं आता

इन जाँचों को क्रम से चलाएँ:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

यदि बैकअप सफलतापूर्वक पुनर्स्थापित हो जाता है, लेकिन कुछ पुराने रूम का इतिहास अब भी अनुपलब्ध है, तो संभवतः पिछला Plugin उन अनुपलब्ध कुंजियों का कभी बैकअप नहीं ले पाया था।

## यदि आप भविष्य के संदेशों के लिए नए सिरे से शुरू करना चाहते हैं

यदि आप पुनर्प्राप्त न हो सकने वाले पुराने एन्क्रिप्टेड इतिहास को खोना स्वीकार करते हैं और आगे के लिए केवल साफ़ बैकअप आधार चाहते हैं, तो इन कमांडों को क्रम से चलाएँ:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

यदि इसके बाद भी डिवाइस असत्यापित है, तो SAS इमोजी या दशमलव कोड की तुलना करके और उनके मेल खाने की पुष्टि करके अपने Matrix क्लाइंट से सत्यापन पूरा करें।

## संबंधित

- [Matrix](/hi/channels/matrix): चैनल सेटअप और कॉन्फ़िगरेशन।
- [Matrix पुश नियम](/hi/channels/matrix-push-rules): सूचना रूटिंग।
- [Doctor](/hi/gateway/doctor): स्वास्थ्य जाँच और स्वचालित माइग्रेशन ट्रिगर।
- [माइग्रेशन मार्गदर्शिका](/hi/install/migrating): सभी माइग्रेशन पथ (मशीन स्थानांतरण, क्रॉस-सिस्टम आयात)।
- [Plugins](/hi/tools/plugin): Plugin इंस्टॉलेशन और पंजीकरण।
