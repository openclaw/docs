---
read_when:
    - मौजूदा Matrix इंस्टॉलेशन को अपग्रेड करना
    - एन्क्रिप्टेड Matrix इतिहास और डिवाइस स्थिति माइग्रेट करना
summary: OpenClaw कैसे पिछले Matrix Plugin को उसी स्थान पर अपग्रेड करता है, जिसमें एन्क्रिप्टेड-स्थिति पुनर्प्राप्ति की सीमाएँ और मैनुअल पुनर्प्राप्ति चरण शामिल हैं।
title: Matrix माइग्रेशन
x-i18n:
    generated_at: "2026-06-28T22:36:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 796d27aa3f08388b78e005d5e93ee4a04bc9ae9bb1f214b83c3ba19165042755
    source_path: channels/matrix-migration.md
    workflow: 16
---

पिछले सार्वजनिक `matrix` Plugin से वर्तमान कार्यान्वयन पर अपग्रेड करें.

अधिकांश उपयोगकर्ताओं के लिए, अपग्रेड उसी स्थान पर होता है:

- Plugin `@openclaw/matrix` ही रहता है
- चैनल `matrix` ही रहता है
- आपका कॉन्फिग `channels.matrix` के अंतर्गत ही रहता है
- कैश किए गए क्रेडेंशियल `~/.openclaw/credentials/matrix/` के अंतर्गत ही रहते हैं
- रनटाइम स्थिति `~/.openclaw/matrix/` के अंतर्गत ही रहती है

आपको कॉन्फिग कुंजियों का नाम बदलने या Plugin को किसी नए नाम के अंतर्गत फिर से इंस्टॉल करने की आवश्यकता नहीं है.
रूट `openclaw` पैकेज अब Matrix रनटाइम कोड या Matrix SDK
निर्भरताएँ बंडल नहीं करता. यदि अपडेट के बाद `openclaw channels status` दिखाता है कि Matrix कॉन्फिगर है लेकिन
Plugin अनुपस्थित है, तो `openclaw doctor --fix` या
`openclaw plugins install @openclaw/matrix` चलाएँ; Matrix SDK पैकेजों को
रूट OpenClaw पैकेज में इंस्टॉल न करें.

## माइग्रेशन स्वचालित रूप से क्या करता है

जब gateway शुरू होता है, और जब आप [`openclaw doctor --fix`](/hi/gateway/doctor) चलाते हैं, OpenClaw पुरानी Matrix स्थिति को स्वचालित रूप से सुधारने का प्रयास करता है.
किसी भी क्रियाशील Matrix माइग्रेशन चरण द्वारा ऑन-डिस्क स्थिति में बदलाव करने से पहले, OpenClaw एक केंद्रित रिकवरी स्नैपशॉट बनाता है या उसका पुनः उपयोग करता है.

जब आप `openclaw update` का उपयोग करते हैं, तो सटीक ट्रिगर इस पर निर्भर करता है कि OpenClaw कैसे इंस्टॉल किया गया है:

- सोर्स इंस्टॉल अपडेट फ़्लो के दौरान `openclaw doctor --fix` चलाते हैं, फिर डिफ़ॉल्ट रूप से gateway को पुनः शुरू करते हैं
- पैकेज-मैनेजर इंस्टॉल पैकेज को अपडेट करते हैं, एक गैर-इंटरैक्टिव doctor पास चलाते हैं, फिर डिफ़ॉल्ट gateway पुनःआरंभ पर निर्भर करते हैं ताकि स्टार्टअप Matrix माइग्रेशन पूरा कर सके
- यदि आप `openclaw update --no-restart` का उपयोग करते हैं, तो स्टार्टअप-समर्थित Matrix माइग्रेशन तब तक स्थगित रहता है जब तक आप बाद में `openclaw doctor --fix` चलाकर gateway पुनः शुरू नहीं करते

स्वचालित माइग्रेशन में शामिल है:

- `~/Backups/openclaw-migrations/` के अंतर्गत प्री-माइग्रेशन स्नैपशॉट बनाना या उसका पुनः उपयोग करना
- आपके कैश किए गए Matrix क्रेडेंशियल्स का पुनः उपयोग करना
- वही खाता चयन और `channels.matrix` कॉन्फिग रखना
- सबसे पुराने फ्लैट Matrix सिंक स्टोर को वर्तमान खाता-स्कोप्ड स्थान पर ले जाना
- लक्ष्य खाते को सुरक्षित रूप से हल किए जाने पर सबसे पुराने फ्लैट Matrix क्रिप्टो स्टोर को वर्तमान खाता-स्कोप्ड स्थान पर ले जाना
- पुराने rust क्रिप्टो स्टोर से पहले सहेजी गई Matrix रूम-की बैकअप डिक्रिप्शन कुंजी निकालना, जब वह कुंजी स्थानीय रूप से मौजूद हो
- बाद में एक्सेस टोकन बदलने पर उसी Matrix खाते, homeserver, और उपयोगकर्ता के लिए सबसे पूर्ण मौजूदा टोकन-हैश स्टोरेज रूट का पुनः उपयोग करना
- Matrix एक्सेस टोकन बदल गया हो लेकिन खाता/डिवाइस पहचान वही रही हो, तब लंबित एन्क्रिप्टेड-स्थिति पुनर्स्थापना मेटाडेटा के लिए sibling टोकन-हैश स्टोरेज रूट स्कैन करना
- अगले Matrix स्टार्टअप पर बैकअप की गई रूम कुंजियों को नए क्रिप्टो स्टोर में पुनर्स्थापित करना

स्नैपशॉट विवरण:

- सफल स्नैपशॉट के बाद OpenClaw `~/.openclaw/matrix/migration-snapshot.json` पर एक मार्कर फ़ाइल लिखता है ताकि बाद के स्टार्टअप और repair पास उसी आर्काइव का पुनः उपयोग कर सकें.
- ये स्वचालित Matrix माइग्रेशन स्नैपशॉट केवल कॉन्फिग + स्थिति का बैकअप लेते हैं (`includeWorkspace: false`).
- यदि Matrix में केवल चेतावनी-भर माइग्रेशन स्थिति है, उदाहरण के लिए क्योंकि `userId` या `accessToken` अभी भी अनुपस्थित है, तो OpenClaw अभी स्नैपशॉट नहीं बनाता क्योंकि कोई Matrix बदलाव क्रियाशील नहीं है.
- यदि स्नैपशॉट चरण विफल हो जाता है, तो OpenClaw रिकवरी पॉइंट के बिना स्थिति बदलने के बजाय उस रन के लिए Matrix माइग्रेशन छोड़ देता है.

मल्टी-अकाउंट अपग्रेड के बारे में:

- सबसे पुराना फ्लैट Matrix स्टोर (`~/.openclaw/matrix/bot-storage.json` और `~/.openclaw/matrix/crypto/`) एक सिंगल-स्टोर लेआउट से आया था, इसलिए OpenClaw उसे केवल एक हल किए गए Matrix खाता लक्ष्य में माइग्रेट कर सकता है
- पहले से खाता-स्कोप्ड legacy Matrix स्टोर हर कॉन्फिगर किए गए Matrix खाते के लिए पहचाने और तैयार किए जाते हैं

## माइग्रेशन स्वचालित रूप से क्या नहीं कर सकता

पिछला सार्वजनिक Matrix Plugin Matrix रूम-की बैकअप स्वचालित रूप से नहीं बनाता था. वह स्थानीय क्रिप्टो स्थिति को कायम रखता था और डिवाइस सत्यापन का अनुरोध करता था, लेकिन यह गारंटी नहीं देता था कि आपकी रूम कुंजियाँ homeserver पर बैकअप की गई हैं.

इसका अर्थ है कि कुछ एन्क्रिप्टेड इंस्टॉल केवल आंशिक रूप से माइग्रेट किए जा सकते हैं.

OpenClaw स्वचालित रूप से पुनर्प्राप्त नहीं कर सकता:

- केवल-स्थानीय रूम कुंजियाँ जिनका कभी बैकअप नहीं लिया गया
- एन्क्रिप्टेड स्थिति जब लक्ष्य Matrix खाते को अभी हल नहीं किया जा सकता क्योंकि `homeserver`, `userId`, या `accessToken` अभी भी उपलब्ध नहीं हैं
- एक साझा फ्लैट Matrix स्टोर का स्वचालित माइग्रेशन जब कई Matrix खाते कॉन्फिगर हैं लेकिन `channels.matrix.defaultAccount` सेट नहीं है
- कस्टम Plugin पाथ इंस्टॉल जो मानक Matrix पैकेज के बजाय किसी repo पाथ पर पिन किए गए हैं
- अनुपस्थित रिकवरी कुंजी जब पुराने स्टोर में बैकअप की गई कुंजियाँ थीं लेकिन डिक्रिप्शन कुंजी स्थानीय रूप से नहीं रखी गई थी

वर्तमान चेतावनी दायरा:

- कस्टम Matrix Plugin पाथ इंस्टॉल gateway स्टार्टअप और `openclaw doctor` दोनों द्वारा दिखाए जाते हैं

यदि आपके पुराने इंस्टॉलेशन में केवल-स्थानीय एन्क्रिप्टेड इतिहास था जिसका कभी बैकअप नहीं लिया गया, तो अपग्रेड के बाद कुछ पुराने एन्क्रिप्टेड संदेश अपठनीय रह सकते हैं.

## अनुशंसित अपग्रेड फ़्लो

1. OpenClaw और Matrix Plugin को सामान्य रूप से अपडेट करें.
   सादे `openclaw update` को `--no-restart` के बिना प्राथमिकता दें ताकि स्टार्टअप Matrix माइग्रेशन तुरंत पूरा कर सके.
2. चलाएँ:

   ```bash
   openclaw doctor --fix
   ```

   यदि Matrix में क्रियाशील माइग्रेशन कार्य है, तो doctor पहले प्री-माइग्रेशन स्नैपशॉट बनाएगा या उसका पुनः उपयोग करेगा और आर्काइव पाथ प्रिंट करेगा.

3. gateway शुरू या पुनः शुरू करें.
4. वर्तमान सत्यापन और बैकअप स्थिति जाँचें:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. जिस Matrix खाते को आप सुधार रहे हैं उसकी रिकवरी कुंजी को खाता-विशिष्ट environment variable में रखें. एकल डिफ़ॉल्ट खाते के लिए, `MATRIX_RECOVERY_KEY` ठीक है. कई खातों के लिए, प्रति खाते एक variable का उपयोग करें, उदाहरण के लिए `MATRIX_RECOVERY_KEY_ASSISTANT`, और कमांड में `--account assistant` जोड़ें.

6. यदि OpenClaw बताता है कि रिकवरी कुंजी आवश्यक है, तो मेल खाते खाते के लिए कमांड चलाएँ:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. यदि यह डिवाइस अभी भी असत्यापित है, तो मेल खाते खाते के लिए कमांड चलाएँ:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   यदि रिकवरी कुंजी स्वीकार हो जाती है और बैकअप उपयोग योग्य है, लेकिन `Cross-signing verified`
   अभी भी `no` है, तो किसी अन्य Matrix क्लाइंट से self-verification पूरा करें:

   ```bash
   openclaw matrix verify self
   ```

   किसी अन्य Matrix क्लाइंट में अनुरोध स्वीकार करें, emoji या decimals की तुलना करें,
   और केवल मेल खाने पर `yes` टाइप करें. कमांड केवल
   `Cross-signing verified` के `yes` बनने के बाद सफलतापूर्वक समाप्त होती है.

8. यदि आप जानबूझकर अपुनर्प्राप्तनीय पुराने इतिहास को छोड़ रहे हैं और भविष्य के संदेशों के लिए नई बैकअप baseline चाहते हैं, तो चलाएँ:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. यदि अभी तक कोई server-side key backup मौजूद नहीं है, तो भविष्य की रिकवरी के लिए एक बनाएँ:

   ```bash
   openclaw matrix verify bootstrap
   ```

## एन्क्रिप्टेड माइग्रेशन कैसे काम करता है

एन्क्रिप्टेड माइग्रेशन दो-चरणीय प्रक्रिया है:

1. यदि एन्क्रिप्टेड माइग्रेशन क्रियाशील है, तो स्टार्टअप या `openclaw doctor --fix` प्री-माइग्रेशन स्नैपशॉट बनाता है या उसका पुनः उपयोग करता है.
2. स्टार्टअप या `openclaw doctor --fix` सक्रिय Matrix Plugin इंस्टॉल के माध्यम से पुराने Matrix क्रिप्टो स्टोर की जाँच करता है.
3. यदि बैकअप डिक्रिप्शन कुंजी मिलती है, तो OpenClaw उसे नए रिकवरी-की फ़्लो में लिखता है और रूम-की पुनर्स्थापना को लंबित के रूप में चिह्नित करता है.
4. अगले Matrix स्टार्टअप पर, OpenClaw बैकअप की गई रूम कुंजियों को नए क्रिप्टो स्टोर में स्वचालित रूप से पुनर्स्थापित करता है.

यदि पुराना स्टोर ऐसी रूम कुंजियों की रिपोर्ट करता है जिनका कभी बैकअप नहीं लिया गया, तो OpenClaw रिकवरी सफल होने का दिखावा करने के बजाय चेतावनी देता है.

## सामान्य संदेश और उनका अर्थ

### अपग्रेड और पहचान संदेश

`Matrix plugin upgraded in place.`

- अर्थ: पुरानी ऑन-डिस्क Matrix स्थिति पहचानी गई और वर्तमान लेआउट में माइग्रेट की गई.
- क्या करें: कुछ नहीं, जब तक उसी आउटपुट में चेतावनियाँ भी शामिल न हों.

`Matrix migration snapshot created before applying Matrix upgrades.`

- अर्थ: OpenClaw ने Matrix स्थिति बदलने से पहले एक रिकवरी आर्काइव बनाया.
- क्या करें: प्रिंट किया गया आर्काइव पाथ तब तक रखें जब तक आप पुष्टि न कर लें कि माइग्रेशन सफल हुआ.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- अर्थ: OpenClaw को मौजूदा Matrix माइग्रेशन स्नैपशॉट मार्कर मिला और उसने duplicate backup बनाने के बजाय उसी आर्काइव का पुनः उपयोग किया.
- क्या करें: प्रिंट किया गया आर्काइव पाथ तब तक रखें जब तक आप पुष्टि न कर लें कि माइग्रेशन सफल हुआ.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- अर्थ: पुरानी Matrix स्थिति मौजूद है, लेकिन OpenClaw उसे वर्तमान Matrix खाते से मैप नहीं कर सकता क्योंकि Matrix कॉन्फिगर नहीं है.
- क्या करें: `channels.matrix` कॉन्फिगर करें, फिर `openclaw doctor --fix` दोबारा चलाएँ या gateway पुनः शुरू करें.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- अर्थ: OpenClaw को पुरानी स्थिति मिली, लेकिन वह अभी भी सटीक वर्तमान खाता/डिवाइस रूट निर्धारित नहीं कर सकता.
- क्या करें: काम करने वाले Matrix लॉगिन के साथ gateway एक बार शुरू करें, या कैश किए गए क्रेडेंशियल उपलब्ध होने के बाद `openclaw doctor --fix` दोबारा चलाएँ.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- अर्थ: OpenClaw को एक साझा फ्लैट Matrix स्टोर मिला, लेकिन वह अनुमान लगाने से इनकार करता है कि किस नामित Matrix खाते को यह मिलना चाहिए.
- क्या करें: `channels.matrix.defaultAccount` को इच्छित खाते पर सेट करें, फिर `openclaw doctor --fix` दोबारा चलाएँ या gateway पुनः शुरू करें.

`Matrix legacy sync store not migrated because the target already exists (...)`

- अर्थ: नए खाता-स्कोप्ड स्थान पर पहले से sync या crypto store है, इसलिए OpenClaw ने उसे स्वचालित रूप से overwrite नहीं किया.
- क्या करें: विरोधी target को मैन्युअल रूप से हटाने या ले जाने से पहले सत्यापित करें कि वर्तमान खाता सही है.

`Failed migrating Matrix legacy sync store (...)` या `Failed migrating Matrix legacy crypto store (...)`

- अर्थ: OpenClaw ने पुरानी Matrix स्थिति को ले जाने का प्रयास किया लेकिन filesystem operation विफल हो गया.
- क्या करें: filesystem permissions और disk state की जाँच करें, फिर `openclaw doctor --fix` दोबारा चलाएँ.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- अर्थ: OpenClaw को पुराना एन्क्रिप्टेड Matrix स्टोर मिला, लेकिन उसे संलग्न करने के लिए कोई वर्तमान Matrix कॉन्फिग नहीं है.
- क्या करें: `channels.matrix` कॉन्फिगर करें, फिर `openclaw doctor --fix` दोबारा चलाएँ या gateway पुनः शुरू करें.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- अर्थ: एन्क्रिप्टेड स्टोर मौजूद है, लेकिन OpenClaw सुरक्षित रूप से तय नहीं कर सकता कि यह किस वर्तमान खाते/डिवाइस से संबंधित है.
- क्या करें: काम करने वाले Matrix लॉगिन के साथ gateway एक बार शुरू करें, या कैश किए गए क्रेडेंशियल उपलब्ध होने के बाद `openclaw doctor --fix` दोबारा चलाएँ.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- अर्थ: OpenClaw को एक साझा फ्लैट legacy crypto store मिला, लेकिन वह अनुमान लगाने से इनकार करता है कि किस नामित Matrix खाते को यह मिलना चाहिए.
- क्या करें: `channels.matrix.defaultAccount` को इच्छित खाते पर सेट करें, फिर `openclaw doctor --fix` दोबारा चलाएँ या gateway पुनः शुरू करें.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- अर्थ: OpenClaw ने पुरानी Matrix स्थिति पहचानी, लेकिन माइग्रेशन अभी भी अनुपस्थित पहचान या credential data पर अवरुद्ध है.
- क्या करें: Matrix लॉगिन या कॉन्फिग सेटअप पूरा करें, फिर `openclaw doctor --fix` दोबारा चलाएँ या gateway पुनः शुरू करें.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- अर्थ: OpenClaw को पुरानी एन्क्रिप्टेड Matrix स्थिति मिली, लेकिन वह Matrix plugin से वह helper entrypoint लोड नहीं कर सका जो सामान्यतः उस store की जाँच करता है.
- क्या करें: Matrix plugin को फिर से install या repair करें (`openclaw plugins install @openclaw/matrix`, या repo checkout के लिए `openclaw plugins install ./path/to/local/matrix-plugin`), फिर `openclaw doctor --fix` दोबारा चलाएँ या gateway restart करें.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- अर्थ: OpenClaw को एक helper file path मिला जो plugin root से बाहर निकलता है या plugin boundary checks में विफल होता है, इसलिए उसने उसे import करने से मना कर दिया.
- क्या करें: Matrix plugin को किसी trusted path से फिर से install करें, फिर `openclaw doctor --fix` दोबारा चलाएँ या gateway restart करें.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- अर्थ: OpenClaw ने Matrix state में बदलाव करने से मना कर दिया क्योंकि वह पहले recovery snapshot नहीं बना सका.
- क्या करें: backup error हल करें, फिर `openclaw doctor --fix` दोबारा चलाएँ या gateway restart करें.

`Failed migrating legacy Matrix client storage: ...`

- अर्थ: Matrix client-side fallback को पुराना flat storage मिला, लेकिन move विफल हो गया. OpenClaw अब चुपचाप नए store के साथ शुरू होने के बजाय उस fallback को रोक देता है.
- क्या करें: filesystem permissions या conflicts की जाँच करें, पुराने state को intact रखें, और error ठीक करने के बाद फिर कोशिश करें.

`Matrix is installed from a custom path: ...`

- अर्थ: Matrix को path install पर pinned किया गया है, इसलिए mainline updates उसे repo के standard Matrix package से अपने आप replace नहीं करते.
- क्या करें: जब आप default Matrix plugin पर लौटना चाहें, तो `openclaw plugins install @openclaw/matrix` से फिर से install करें.

### एन्क्रिप्टेड-state recovery messages

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- अर्थ: backed-up room keys को नए crypto store में सफलतापूर्वक restore कर दिया गया.
- क्या करें: आमतौर पर कुछ नहीं.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- अर्थ: कुछ पुराने room keys केवल पुराने local store में मौजूद थे और उन्हें कभी Matrix backup पर upload नहीं किया गया था.
- क्या करें: जब तक आप उन keys को किसी दूसरे verified client से manually recover नहीं कर सकते, कुछ पुराना encrypted history unavailable रह सकता है.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- अर्थ: backup मौजूद है, लेकिन OpenClaw recovery key को अपने आप recover नहीं कर सका.
- क्या करें: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` चलाएँ.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- अर्थ: OpenClaw को पुराना encrypted store मिला, लेकिन वह recovery तैयार करने के लिए उसे पर्याप्त रूप से सुरक्षित तरीके से inspect नहीं कर सका.
- क्या करें: `openclaw doctor --fix` दोबारा चलाएँ. अगर यह फिर दोहराता है, तो पुरानी state directory intact रखें और किसी दूसरे verified Matrix client के साथ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` का उपयोग करके recover करें.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- अर्थ: OpenClaw ने backup key conflict पाया और current recovery-key file को अपने आप overwrite करने से मना कर दिया.
- क्या करें: कोई भी restore command दोबारा चलाने से पहले verify करें कि कौन-सी recovery key सही है.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- अर्थ: यह पुराने storage format की hard limit है.
- क्या करें: backed-up keys अभी भी restore की जा सकती हैं, लेकिन local-only encrypted history unavailable रह सकता है.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- अर्थ: नए plugin ने restore का प्रयास किया, लेकिन Matrix ने error लौटाया.
- क्या करें: `openclaw matrix verify backup status` चलाएँ, फिर जरूरत हो तो `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` से फिर कोशिश करें.

### Manual recovery messages

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- अर्थ: OpenClaw जानता है कि आपके पास backup key होनी चाहिए, लेकिन यह इस device पर active नहीं है.
- क्या करें: `openclaw matrix verify backup restore` चलाएँ, या जरूरत हो तो `MATRIX_RECOVERY_KEY` set करें और `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` चलाएँ.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- अर्थ: इस device पर फिलहाल recovery key stored नहीं है.
- क्या करें: `MATRIX_RECOVERY_KEY` set करें, `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` चलाएँ, फिर backup restore करें.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- अर्थ: stored key active Matrix backup से match नहीं करती.
- क्या करें: `MATRIX_RECOVERY_KEY` को सही key पर set करें और `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` चलाएँ.

अगर आप unrecoverable पुराने encrypted history को खोना स्वीकार करते हैं, तो आप इसके बजाय
current backup baseline को `openclaw matrix verify backup reset --yes` से reset कर सकते हैं. जब
stored backup secret broken हो, तो यह reset secret storage को भी recreate कर सकता है ताकि
नई backup key restart के बाद सही तरह load हो सके.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- अर्थ: backup मौजूद है, लेकिन यह device अभी cross-signing chain पर पर्याप्त भरोसा नहीं करता.
- क्या करें: `MATRIX_RECOVERY_KEY` set करें और `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` चलाएँ.

`Matrix recovery key is required`

- अर्थ: आपने recovery key दिए बिना recovery step चलाने की कोशिश की, जबकि वह आवश्यक थी.
- क्या करें: command को `--recovery-key-stdin` के साथ दोबारा चलाएँ, उदाहरण के लिए `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- अर्थ: दी गई key parse नहीं की जा सकी या expected format से match नहीं हुई.
- क्या करें: अपने Matrix client या recovery-key file की exact recovery key से फिर कोशिश करें.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- अर्थ: OpenClaw recovery key apply कर सका, लेकिन Matrix ने अभी भी इस device के लिए
  full cross-signing identity trust स्थापित नहीं किया है. Command output में
  `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified`, और `Device verified by owner` देखें.
- क्या करें: `openclaw matrix verify self` चलाएँ, दूसरे
  Matrix client में request accept करें, SAS compare करें, और match होने पर ही `yes` type करें. यह
  command success report करने से पहले full Matrix identity trust का इंतजार करती है. 
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  केवल तब use करें जब आप current cross-signing identity को जानबूझकर replace करना चाहते हों.

`Matrix key backup is not active on this device after loading from secret storage.`

- अर्थ: secret storage ने इस device पर active backup session नहीं बनाया.
- क्या करें: पहले device verify करें, फिर `openclaw matrix verify backup status` से दोबारा check करें.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- अर्थ: device verification complete होने तक यह device secret storage से restore नहीं कर सकता.
- क्या करें: पहले `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` चलाएँ.

### Custom plugin install messages

`Matrix is installed from a custom path that no longer exists: ...`

- अर्थ: आपका plugin install record ऐसे local path की ओर point करता है जो अब मौजूद नहीं है.
- क्या करें: `openclaw plugins install @openclaw/matrix` से फिर से install करें, या अगर आप repo checkout से चला रहे हैं, तो `openclaw plugins install ./path/to/local/matrix-plugin`.

## अगर encrypted history फिर भी वापस नहीं आती

ये checks क्रम में चलाएँ:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

अगर backup successfully restore हो जाता है लेकिन कुछ पुराने rooms में history अब भी missing है, तो वे missing keys शायद previous plugin द्वारा कभी backed up नहीं किए गए थे.

## अगर आप future messages के लिए fresh start करना चाहते हैं

अगर आप unrecoverable पुराने encrypted history को खोना स्वीकार करते हैं और आगे के लिए केवल clean backup baseline चाहते हैं, तो ये commands क्रम में चलाएँ:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

अगर उसके बाद भी device unverified है, तो अपने Matrix client से SAS emoji या decimal codes compare करके और match confirm करके verification finish करें.

## संबंधित

- [Matrix](/hi/channels/matrix): channel setup और config.
- [Matrix push rules](/hi/channels/matrix-push-rules): notification routing.
- [Doctor](/hi/gateway/doctor): health check और automatic migration trigger.
- [Migration guide](/hi/install/migrating): सभी migration paths (machine moves, cross-system imports).
- [Plugins](/hi/tools/plugin): plugin install और registration.
