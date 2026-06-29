---
read_when:
    - exec टूल का उपयोग या संशोधन
    - stdin या TTY व्यवहार की डीबगिंग
summary: Exec टूल का उपयोग, stdin मोड, और TTY समर्थन
title: Exec टूल
x-i18n:
    generated_at: "2026-06-29T00:18:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

वर्कस्पेस में शेल कमांड चलाएं। `exec` एक परिवर्तनकारी शेल सतह है: कमांड उन सभी जगहों पर फ़ाइलें बना, संपादित या हटा सकते हैं जहां चयनित होस्ट या सैंडबॉक्स फ़ाइल सिस्टम अनुमति देता है। `write`, `edit`, या `apply_patch` जैसे OpenClaw फ़ाइल सिस्टम टूल अक्षम करने से `exec` केवल-पढ़ने योग्य नहीं हो जाता।

`process` के ज़रिए अग्रभूमि + पृष्ठभूमि निष्पादन का समर्थन करता है। यदि `process` अस्वीकृत है, तो `exec` समकालिक रूप से चलता है और `yieldMs`/`background` को अनदेखा करता है।
पृष्ठभूमि सत्र प्रति एजेंट सीमित होते हैं; `process` केवल उसी एजेंट के सत्र देखता है।

## पैरामीटर

<ParamField path="command" type="string" required>
चलाने के लिए शेल कमांड।
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
कमांड के लिए कार्यशील डायरेक्टरी।
</ParamField>

<ParamField path="env" type="object">
इनहेरिट किए गए वातावरण के ऊपर मर्ज किए गए की/वैल्यू वातावरण ओवरराइड।
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
इस विलंब (ms) के बाद कमांड को अपने-आप पृष्ठभूमि में भेजें।
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` की प्रतीक्षा करने के बजाय कमांड को तुरंत पृष्ठभूमि में भेजें।
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
इस कॉल के लिए कॉन्फ़िगर किए गए exec टाइमआउट को ओवरराइड करें। `timeout: 0` केवल तब सेट करें जब कमांड को exec प्रक्रिया टाइमआउट के बिना चलना चाहिए।
</ParamField>

<ParamField path="pty" type="boolean" default="false">
उपलब्ध होने पर छद्म-टर्मिनल में चलाएं। TTY-केवल CLIs, कोडिंग एजेंटों, और टर्मिनल UIs के लिए उपयोग करें।
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
कहां निष्पादित करना है। `auto` तब `sandbox` में बदलता है जब सैंडबॉक्स रनटाइम सक्रिय हो, अन्यथा `gateway` में।
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
सामान्य टूल कॉल के लिए अनदेखा किया जाता है। `gateway` / `node` सुरक्षा
`tools.exec.security` और होस्ट अनुमोदन फ़ाइल द्वारा नियंत्रित होती है; उन्नत मोड
`security=full` केवल तब बाध्य कर सकता है जब ऑपरेटर स्पष्ट रूप से उन्नत एक्सेस देता है।
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
बेसलाइन पूछने का मोड `tools.exec.ask` और होस्ट अनुमोदनों से आता है।
चैनल-मूल मॉडल कॉल के लिए, प्रति-कॉल `ask` अनदेखा किया जाता है जब
प्रभावी होस्ट ask `off` हो; अन्यथा यह केवल अधिक सख्त
मोड तक कठोर हो सकता है। वे विश्वसनीय आंतरिक/API कॉलर जो exec टूल को
स्पष्ट `ask` मान के साथ बनाते हैं, अपरिवर्तित रहते हैं।
</ParamField>

<ParamField path="node" type="string">
`host=node` होने पर Node id/name।
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
उन्नत मोड का अनुरोध करें — सैंडबॉक्स से बाहर निकलकर कॉन्फ़िगर किए गए होस्ट पथ पर जाएं। `security=full` केवल तब बाध्य होता है जब elevated `full` में बदलता है।
</ParamField>

नोट्स:

- `host` का डिफ़ॉल्ट `auto` है: सत्र के लिए सैंडबॉक्स रनटाइम सक्रिय होने पर सैंडबॉक्स, अन्यथा Gateway।
- `host` केवल `auto`, `sandbox`, `gateway`, या `node` स्वीकार करता है। यह होस्टनेम चयनकर्ता नहीं है; होस्टनेम-जैसे मान कमांड चलने से पहले अस्वीकार कर दिए जाते हैं।
- `auto` डिफ़ॉल्ट रूटिंग रणनीति है, वाइल्डकार्ड नहीं। `auto` से प्रति-कॉल `host=node` की अनुमति है; प्रति-कॉल `host=gateway` केवल तब अनुमति है जब कोई सैंडबॉक्स रनटाइम सक्रिय न हो।
- `tools.exec.mode` सामान्यीकृत नीति नॉब है। मान `deny`, `allowlist`, `ask`, `auto`, और `full` हैं। `auto` निर्धारक allowlist/safe-bin मिलानों को सीधे चलाता है और हर बाकी exec अनुमोदन मामले को मानव से पूछने से पहले OpenClaw के मूल ऑटो समीक्षक के ज़रिए रूट करता है। `ask` / `ask=always` फिर भी हर बार मानव से पूछता है।
- अतिरिक्त कॉन्फ़िग के बिना, `host=auto` फिर भी "बस काम करता है": सैंडबॉक्स न होने पर यह `gateway` में बदलता है; लाइव सैंडबॉक्स होने पर यह सैंडबॉक्स में रहता है।
- `elevated` सैंडबॉक्स से बाहर निकलकर कॉन्फ़िगर किए गए होस्ट पथ पर जाता है: डिफ़ॉल्ट रूप से `gateway`, या `node` जब `tools.exec.host=node` हो (या सत्र डिफ़ॉल्ट `host=node` हो)। यह केवल तब उपलब्ध है जब मौजूदा सत्र/प्रदाता के लिए उन्नत एक्सेस सक्षम हो।
- `gateway`/`node` अनुमोदन होस्ट अनुमोदन फ़ाइल द्वारा नियंत्रित होते हैं।
- `node` के लिए युग्मित Node (सहचर ऐप या हेडलेस Node होस्ट) आवश्यक है।
- यदि कई Node उपलब्ध हैं, तो एक चुनने के लिए `exec.node` या `tools.exec.node` सेट करें।
- `exec host=node` Node के लिए एकमात्र शेल-निष्पादन पथ है; पुराना `nodes.run` रैपर हटा दिया गया है।
- `timeout` अग्रभूमि, पृष्ठभूमि, `yieldMs`, Gateway, सैंडबॉक्स, और Node `system.run` निष्पादन पर लागू होता है। यदि छोड़ा गया हो, तो OpenClaw `tools.exec.timeoutSec` का उपयोग करता है; स्पष्ट `timeout: 0` उस कॉल के लिए exec प्रक्रिया टाइमआउट अक्षम करता है।
- गैर-Windows होस्ट पर, exec सेट होने पर `SHELL` का उपयोग करता है; यदि `SHELL` `fish` है, तो fish-असंगत स्क्रिप्ट से बचने के लिए यह `PATH` से `bash` (या `sh`)
  को प्राथमिकता देता है, फिर दोनों न मिलने पर `SHELL` पर लौटता है।
- Windows होस्ट पर, exec PowerShell 7 (`pwsh`) खोज को प्राथमिकता देता है (Program Files, ProgramW6432, फिर PATH),
  फिर Windows PowerShell 5.1 पर लौटता है।
- गैर-Windows Gateway होस्ट पर, bash और zsh exec कमांड स्टार्टअप स्नैपशॉट का उपयोग करते हैं। OpenClaw शेल स्टार्टअप फ़ाइलों से स्रोत-योग्य
  aliases/functions और एक छोटा सुरक्षित वातावरण सेट
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/` में कैप्चर करता है, फिर हर exec कमांड से पहले उस स्नैपशॉट को स्रोत करता है।
  सीक्रेट-जैसे दिखने वाले वेरिएबल बाहर रखे जाते हैं; सैंडबॉक्स और Node exec इस स्नैपशॉट का उपयोग नहीं करते। इस स्नैपशॉट पथ को अक्षम करने के लिए Gateway प्रक्रिया वातावरण में
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` सेट करें।
- होस्ट निष्पादन (`gateway`/`node`) बाइनरी हाईजैकिंग या इंजेक्टेड कोड रोकने के लिए
  `env.PATH` और लोडर ओवरराइड (`LD_*`/`DYLD_*`) अस्वीकार करता है।
- OpenClaw उत्पन्न कमांड वातावरण (PTY और सैंडबॉक्स निष्पादन सहित) में `OPENCLAW_SHELL=exec` सेट करता है ताकि शेल/प्रोफ़ाइल नियम exec-टूल संदर्भ पहचान सकें।
- चैनल-मूल रन के लिए, OpenClaw `OPENCLAW_CHANNEL_CONTEXT` में एक संकीर्ण प्रेषक/चैट पहचान JSON पेलोड भी उजागर करता है
  जब चैनल ने वे ids प्रदान किए हों।
- `openclaw channels login` को `exec` से अवरुद्ध किया गया है क्योंकि यह एक इंटरैक्टिव चैनल-auth प्रवाह है; इसे Gateway होस्ट पर टर्मिनल में चलाएं, या मौजूद होने पर चैट से चैनल-नेटिव लॉगिन टूल का उपयोग करें।
- महत्वपूर्ण: सैंडबॉक्सिंग **डिफ़ॉल्ट रूप से बंद** है। यदि सैंडबॉक्सिंग बंद है, तो निहित `host=auto`
  `gateway` में बदलता है। स्पष्ट `host=sandbox` फिर भी Gateway होस्ट पर चुपचाप
  चलने के बजाय बंद होकर विफल होता है। सैंडबॉक्सिंग सक्षम करें या अनुमोदनों के साथ `host=gateway` का उपयोग करें।
- स्क्रिप्ट प्रीफ़्लाइट जांचें (सामान्य Python/Node शेल-सिंटैक्स गलतियों के लिए) केवल प्रभावी `workdir` सीमा के अंदर की फ़ाइलों का निरीक्षण करती हैं। यदि कोई स्क्रिप्ट पथ `workdir` के बाहर हल होता है, तो उस फ़ाइल के लिए प्रीफ़्लाइट छोड़ दिया जाता है।
- लंबे समय तक चलने वाले काम के लिए जो अभी शुरू होता है, उसे एक बार शुरू करें और सक्षम होने पर स्वचालित
  पूर्णता वेक पर भरोसा करें जब कमांड आउटपुट देता है या विफल होता है।
  लॉग, स्थिति, इनपुट, या हस्तक्षेप के लिए `process` का उपयोग करें; sleep लूप, timeout लूप, या बार-बार polling से
  शेड्यूलिंग की नकल न करें।
- जो काम बाद में या शेड्यूल पर होना चाहिए, उसके लिए
  `exec` sleep/delay पैटर्न के बजाय Cron का उपयोग करें।

## कॉन्फ़िग

- `tools.exec.notifyOnExit` (डिफ़ॉल्ट: true): true होने पर, पृष्ठभूमि में भेजे गए exec सत्र बाहर निकलने पर सिस्टम इवेंट कतारबद्ध करते हैं और Heartbeat का अनुरोध करते हैं।
- `tools.exec.approvalRunningNoticeMs` (डिफ़ॉल्ट: 10000): अनुमोदन-गेटेड exec इससे अधिक देर चलने पर एकल "चल रहा है" सूचना जारी करें (0 अक्षम करता है)।
- `tools.exec.timeoutSec` (डिफ़ॉल्ट: 1800): सेकंड में डिफ़ॉल्ट प्रति-कमांड exec टाइमआउट। प्रति-कॉल `timeout` इसे ओवरराइड करता है; प्रति-कॉल `timeout: 0` exec प्रक्रिया टाइमआउट अक्षम करता है।
- `tools.exec.host` (डिफ़ॉल्ट: `auto`; सैंडबॉक्स रनटाइम सक्रिय होने पर `sandbox` में बदलता है, अन्यथा `gateway`)
- `tools.exec.security` (डिफ़ॉल्ट: सैंडबॉक्स के लिए `deny`, unset होने पर Gateway + Node के लिए `full`)
- `tools.exec.ask` (डिफ़ॉल्ट: `off`)
- Gateway + Node के लिए बिना-अनुमोदन होस्ट exec डिफ़ॉल्ट है। यदि आप अनुमोदन/allowlist व्यवहार चाहते हैं, तो `tools.exec.*` और होस्ट अनुमोदन फ़ाइल दोनों को सख्त करें; देखें [Exec अनुमोदन](/hi/tools/exec-approvals#yolo-mode-no-approval)।
- YOLO होस्ट-नीति डिफ़ॉल्ट (`security=full`, `ask=off`) से आता है, `host=auto` से नहीं। यदि आप Gateway या Node रूटिंग बाध्य करना चाहते हैं, तो `tools.exec.host` सेट करें या `/exec host=...` का उपयोग करें।
- `security=full` और `ask=off` मोड में, होस्ट exec कॉन्फ़िगर की गई नीति का सीधे पालन करता है; कोई अतिरिक्त heuristic कमांड-obfuscation prefilter या script-preflight rejection layer नहीं है।
- `tools.exec.node` (डिफ़ॉल्ट: unset)
- `tools.exec.strictInlineEval` (डिफ़ॉल्ट: false): true होने पर, `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, और `osascript -e` जैसे inline interpreter eval रूपों के लिए समीक्षक या स्पष्ट अनुमोदन आवश्यक होता है। `mode=auto` में, सामान्य exec अनुमोदन पथ मूल ऑटो समीक्षक को स्पष्ट रूप से कम-जोखिम वाले एकबारगी कमांड की अनुमति देने दे सकता है; प्रत्यक्ष Node-होस्ट `system.run` कॉल को फिर भी स्पष्ट अनुमोदन चाहिए क्योंकि वे कमांड को मानव अनुमोदन मार्ग पर नहीं भेज सकते। यदि समीक्षक पूछता है, तो अनुरोध मानव के पास जाता है। `allow-always` अब भी सौम्य interpreter/script invocations को स्थायी बना सकता है, लेकिन inline-eval रूप टिकाऊ allow rules नहीं बनते।
- `tools.exec.commandHighlighting` (डिफ़ॉल्ट: false): true होने पर, अनुमोदन प्रॉम्प्ट कमांड टेक्स्ट में parser-derived command spans को हाइलाइट कर सकते हैं। exec अनुमोदन नीति बदले बिना कमांड टेक्स्ट हाइलाइटिंग सक्षम करने के लिए वैश्विक रूप से या प्रति एजेंट `true` सेट करें।
- `tools.exec.pathPrepend`: exec रन के लिए `PATH` के आगे जोड़ने वाली डायरेक्टरियों की सूची (केवल Gateway + सैंडबॉक्स)।
- `tools.exec.safeBins`: stdin-only सुरक्षित binaries जो स्पष्ट allowlist प्रविष्टियों के बिना चल सकते हैं। व्यवहार विवरण के लिए, देखें [सुरक्षित bins](/hi/tools/exec-approvals-advanced#safe-bins-stdin-only)।
- `tools.exec.safeBinTrustedDirs`: `safeBins` पथ जांचों के लिए विश्वसनीय अतिरिक्त स्पष्ट डायरेक्टरियां। `PATH` प्रविष्टियां कभी अपने-आप विश्वसनीय नहीं होतीं। अंतर्निहित डिफ़ॉल्ट `/bin` और `/usr/bin` हैं।
- `tools.exec.safeBinProfiles`: प्रति safe bin वैकल्पिक कस्टम argv नीति (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`)।

उदाहरण:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### PATH हैंडलिंग

- `host=gateway`: आपके login-shell `PATH` को exec वातावरण में मर्ज करता है। होस्ट निष्पादन के लिए `env.PATH` ओवरराइड
  अस्वीकार किए जाते हैं। daemon स्वयं फिर भी न्यूनतम `PATH` के साथ चलता है:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
    - स्टार्टअप के दौरान उपयोगकर्ता शेल कॉन्फ़िगरेशन (जैसे `~/.zshenv` या `/etc/zshenv`) को प्राथमिकता पथों को ओवरराइड करने से रोकने के लिए, `tools.exec.pathPrepend` प्रविष्टियां निष्पादन से ठीक पहले शेल कमांड के अंदर अंतिम `PATH` के आगे सुरक्षित रूप से जोड़ी जाती हैं।
- `host=sandbox`: कंटेनर के अंदर `sh -lc` (login shell) चलाता है, इसलिए `/etc/profile` `PATH` रीसेट कर सकता है।
  OpenClaw प्रोफ़ाइल sourcing के बाद एक आंतरिक env var के ज़रिए `env.PATH` आगे जोड़ता है (कोई shell interpolation नहीं);
  `tools.exec.pathPrepend` यहां भी लागू होता है।
- `host=node`: आपके द्वारा पास किए गए केवल non-blocked env overrides Node को भेजे जाते हैं। होस्ट निष्पादन के लिए `env.PATH` ओवरराइड
  अस्वीकार किए जाते हैं और Node होस्ट द्वारा अनदेखे किए जाते हैं। यदि आपको किसी Node पर अतिरिक्त PATH प्रविष्टियों की आवश्यकता है,
  तो Node होस्ट सेवा वातावरण (systemd/launchd) कॉन्फ़िगर करें या टूल मानक स्थानों में इंस्टॉल करें।

प्रति-एजेंट Node binding (कॉन्फ़िग में agent list index का उपयोग करें):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: Nodes टैब में उन्हीं सेटिंग्स के लिए एक छोटा "Exec node binding" पैनल शामिल है।

## सत्र ओवरराइड (`/exec`)

`host`, `security`, `ask`, और `node` के लिए **प्रति-सत्र** डिफ़ॉल्ट सेट करने हेतु `/exec` का उपयोग करें।
मौजूदा मान दिखाने के लिए बिना arguments के `/exec` भेजें।

उदाहरण:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## प्राधिकरण मॉडल

`/exec` केवल **अधिकृत प्रेषकों** के लिए मान्य होता है (चैनल अनुमति-सूचियां/पेयरिंग और `commands.useAccessGroups`)।
यह केवल **सत्र स्थिति** अपडेट करता है और कॉन्फिग नहीं लिखता। अधिकृत बाहरी चैनल प्रेषक
इन सत्र डिफॉल्ट को सेट कर सकते हैं। आंतरिक gateway/webchat क्लाइंट को इन्हें स्थायी करने के लिए `operator.admin` चाहिए।
exec को पूरी तरह बंद करने के लिए, इसे टूल नीति के माध्यम से अस्वीकार करें (`tools.deny: ["exec"]` या प्रति-एजेंट)। होस्ट अनुमोदन
तब भी लागू होते हैं, जब तक आप स्पष्ट रूप से `security=full` और `ask=off` सेट नहीं करते।

## Exec अनुमोदन (सहायक ऐप / node होस्ट)

Sandboxed एजेंट `exec` के Gateway या node होस्ट पर चलने से पहले प्रति-अनुरोध अनुमोदन मांग सकते हैं।
नीति, अनुमति-सूची, और UI प्रवाह के लिए [Exec अनुमोदन](/hi/tools/exec-approvals) देखें।

जब अनुमोदन आवश्यक होते हैं, तो exec टूल तुरंत
`status: "approval-pending"` और एक अनुमोदन id के साथ लौटता है। अनुमोदित होने के बाद (या अस्वीकृत / समय-सीमा समाप्त होने पर),
Gateway केवल अनुमोदित रन के लिए कमांड प्रगति और पूर्णता सिस्टम इवेंट उत्सर्जित करता है
(`Exec running` / `Exec finished`)। अस्वीकृत या समय-सीमा समाप्त अनुमोदन अंतिम होते हैं और
एजेंट सत्र को अस्वीकृति सिस्टम इवेंट के साथ सक्रिय नहीं करते।
नेटिव अनुमोदन कार्ड/बटन वाले चैनलों पर, एजेंट को पहले उस
नेटिव UI पर निर्भर रहना चाहिए और मैन्युअल `/approve` कमांड केवल तब शामिल करनी चाहिए जब टूल
परिणाम स्पष्ट रूप से कहे कि चैट अनुमोदन उपलब्ध नहीं हैं या मैन्युअल अनुमोदन ही
एकमात्र रास्ता है।

## अनुमति-सूची + सुरक्षित बिन्स

मैन्युअल अनुमति-सूची प्रवर्तन हल किए गए बाइनरी पाथ ग्लॉब और bare कमांड-नाम
ग्लॉब से मेल खाता है। Bare नाम केवल PATH के माध्यम से चलाए गए कमांड से मेल खाते हैं, इसलिए `rg`
`/opt/homebrew/bin/rg` से मेल खा सकता है जब कमांड `rg` हो, लेकिन `./rg` या `/tmp/rg` से नहीं।
जब `security=allowlist` हो, shell कमांड केवल तभी अपने-आप अनुमत होते हैं जब हर pipeline
segment अनुमति-सूची में हो या सुरक्षित बिन हो। Chaining (`;`, `&&`, `||`) और redirections
allowlist मोड में अस्वीकार किए जाते हैं, जब तक हर शीर्ष-स्तरीय segment
अनुमति-सूची (सुरक्षित बिन्स सहित) को संतुष्ट न करे। Redirections अब भी असमर्थित हैं।
स्थायी `allow-always` भरोसा इस नियम को बायपास नहीं करता: chained कमांड को फिर भी हर
शीर्ष-स्तरीय segment के मेल की आवश्यकता होती है।

`autoAllowSkills` exec अनुमोदनों में एक अलग सुविधा पथ है। यह
मैन्युअल पाथ अनुमति-सूची प्रविष्टियों जैसा नहीं है। सख्त स्पष्ट भरोसे के लिए, `autoAllowSkills` को बंद रखें।

दोनों नियंत्रणों को अलग-अलग कामों के लिए उपयोग करें:

- `tools.exec.safeBins`: छोटे, केवल-stdin stream filters।
- `tools.exec.safeBinTrustedDirs`: safe-bin executable paths के लिए स्पष्ट अतिरिक्त भरोसेमंद directories।
- `tools.exec.safeBinProfiles`: custom safe bins के लिए स्पष्ट argv policy।
- allowlist: executable paths के लिए स्पष्ट भरोसा।

`safeBins` को generic अनुमति-सूची न मानें, और interpreter/runtime binaries (उदाहरण के लिए `python3`, `node`, `ruby`, `bash`) न जोड़ें। यदि आपको इनकी आवश्यकता है, तो स्पष्ट अनुमति-सूची प्रविष्टियां उपयोग करें और अनुमोदन prompts सक्षम रखें।
`openclaw security audit` चेतावनी देता है जब interpreter/runtime `safeBins` प्रविष्टियों में explicit profiles नहीं होते, और `openclaw doctor --fix` गायब custom `safeBinProfiles` प्रविष्टियां scaffold कर सकता है।
`openclaw security audit` और `openclaw doctor` तब भी चेतावनी देते हैं जब आप `jq` जैसे broad-behavior bins को स्पष्ट रूप से वापस `safeBins` में जोड़ते हैं।
यदि आप interpreters को स्पष्ट रूप से अनुमति-सूची में रखते हैं, तो `tools.exec.strictInlineEval` सक्षम करें ताकि inline code-eval forms को फिर भी reviewer या स्पष्ट अनुमोदन की आवश्यकता रहे।

पूरी नीति के विवरण और उदाहरणों के लिए, [Exec अनुमोदन](/hi/tools/exec-approvals-advanced#safe-bins-stdin-only) और [सुरक्षित बिन्स बनाम अनुमति-सूची](/hi/tools/exec-approvals-advanced#safe-bins-versus-allowlist) देखें।

## उदाहरण

Foreground:

```json
{ "tool": "exec", "command": "ls -la" }
```

Background + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling ऑन-डिमांड स्थिति के लिए है, waiting loops के लिए नहीं। यदि automatic completion wake
सक्षम है, तो कमांड output उत्सर्जित करने या विफल होने पर session को सक्रिय कर सकता है।

कुंजियां भेजें (tmux-style):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Submit (केवल CR भेजें):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Paste (डिफॉल्ट रूप से bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` संरचित multi-file edits के लिए `exec` का subtool है।
यह OpenAI और OpenAI Codex models के लिए डिफॉल्ट रूप से सक्षम है। Config केवल तब उपयोग करें
जब आप इसे बंद करना चाहते हों या specific models तक सीमित करना चाहते हों:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

नोट्स:

- केवल OpenAI/OpenAI Codex models के लिए उपलब्ध।
- Tool policy अब भी लागू होती है; `allow: ["write"]` implicit रूप से `apply_patch` को अनुमति देता है।
- `deny: ["write"]` `apply_patch` को deny नहीं करता; `apply_patch` को स्पष्ट रूप से deny करें या patch writes को भी block करना हो तो `deny: ["group:fs"]` उपयोग करें।
- Config `tools.exec.applyPatch` के अंतर्गत रहता है।
- `tools.exec.applyPatch.enabled` का डिफॉल्ट `true` है; OpenAI models के लिए tool को बंद करने हेतु इसे `false` पर सेट करें।
- `tools.exec.applyPatch.workspaceOnly` का डिफॉल्ट `true` है (workspace-contained)। इसे `false` पर केवल तब सेट करें जब आप जानबूझकर `apply_patch` को workspace directory के बाहर write/delete करने देना चाहते हों।

## संबंधित

- [Exec अनुमोदन](/hi/tools/exec-approvals) — shell commands के लिए approval gates
- [Sandboxing](/hi/gateway/sandboxing) — sandboxed environments में commands चलाना
- [Background Process](/hi/gateway/background-process) — long-running exec और process tool
- [Security](/hi/gateway/security) — tool policy और elevated access
