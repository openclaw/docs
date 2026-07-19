---
read_when:
    - आप CLI से exec अनुमोदनों को संपादित करना चाहते हैं
    - आपको Gateway या Node होस्ट पर अनुमति-सूचियाँ प्रबंधित करनी होंगी
    - आपको चैट इंटरफ़ेस के बिना किसी लंबित अनुमोदन को सूचीबद्ध या हल करना है
summary: '`openclaw approvals` और `openclaw exec-policy` के लिए CLI संदर्भ'
title: अनुमोदन
x-i18n:
    generated_at: "2026-07-19T18:49:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 739d9521dc625571affe1590d5bb2511560029ac6f007b2a422f0606bdb90059
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

**स्थानीय होस्ट**, **Gateway होस्ट**, या **Node होस्ट** के लिए exec अनुमोदन प्रबंधित करें। कोई लक्ष्य फ़्लैग न होने पर, कमांड डिस्क पर मौजूद स्थानीय अनुमोदन फ़ाइल को पढ़ते/लिखते हैं। Gateway को लक्षित करने के लिए `--gateway` या किसी विशिष्ट Node को लक्षित करने के लिए `--node <id|name|ip>` का उपयोग करें।

उपनाम: `openclaw exec-approvals`

संबंधित: [Exec अनुमोदन](/hi/tools/exec-approvals), [Nodes](/hi/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` **केवल-स्थानीय** सुविधाजनक कमांड है, जो अनुरोधित `tools.exec.*` कॉन्फ़िगरेशन और स्थानीय होस्ट अनुमोदन फ़ाइल को एक ही चरण में समन्वयित रखता है:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

प्रीसेट (`yolo`, `cautious`, `deny-all`) `host`, `security`, `ask`, और `askFallback` को एक साथ लागू करते हैं। `set` केवल आपके दिए गए फ़्लैग लागू करता है; प्रत्येक स्वीकृत मान सत्यापित किया जाता है (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`)।

दायरा:

- स्थानीय कॉन्फ़िगरेशन फ़ाइल और स्थानीय अनुमोदन फ़ाइल को एक साथ अपडेट करता है; नीति को Gateway या किसी Node होस्ट पर नहीं भेजता।
- `--host node` अस्वीकार कर दिया जाता है: Node के exec अनुमोदन रनटाइम पर Node से प्राप्त किए जाते हैं, इसलिए स्थानीय `exec-policy` उन्हें समन्वयित नहीं कर सकता। इसके बजाय `openclaw approvals set --node <id|name|ip>` का उपयोग करें।
- `exec-policy show`, स्थानीय अनुमोदन फ़ाइल से प्रभावी नीति प्राप्त करने के बजाय, रनटाइम पर `host=node` दायरों को Node-प्रबंधित के रूप में चिह्नित करता है।

दूरस्थ होस्ट अनुमोदनों के लिए, सीधे `openclaw approvals set --gateway` या `openclaw approvals set --node <id|name|ip>` का उपयोग करें।

## सामान्य कमांड

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
openclaw approvals pending
openclaw approvals resolve <id> <allow-once|allow-always|deny>
```

`get` लक्ष्य के लिए प्रभावी exec नीति दिखाता है: अनुरोधित `tools.exec` नीति, होस्ट अनुमोदन-फ़ाइल नीति, और मर्ज किया गया प्रभावी परिणाम। Windows companion जैसे होस्ट-नेटिव नीति वाले Nodes, OpenClaw अनुमोदन-फ़ाइल नीति की गणना लागू करने के बजाय उस नीति को सीधे दिखाते हैं।

फ़ाइल-समर्थित Nodes के लिए, मर्ज किए गए दृश्य हेतु होस्ट द्वारा हल किया गया नीति स्नैपशॉट आवश्यक है। पुराने Nodes यह मानने के बजाय कि Gateway की अनुरोधित नीति होस्ट पर भी लागू होती है, प्रभावी नीति को अनुपलब्ध दिखाते हैं।

<Note>
प्रति-सत्र `/exec` ओवरराइड शामिल नहीं होते। संबंधित सत्र की वर्तमान डिफ़ॉल्ट सेटिंग्स देखने के लिए उसमें `/exec` चलाएँ।
</Note>

वरीयता क्रम:

- होस्ट अनुमोदन फ़ाइल लागू करने योग्य सत्य का स्रोत है।
- अनुरोधित `tools.exec` नीति अभिप्राय को सीमित या विस्तृत कर सकती है, लेकिन प्रभावी परिणाम होस्ट नियमों से प्राप्त होता है।
- `--node` Node होस्ट अनुमोदन फ़ाइल को Gateway की `tools.exec` नीति के साथ संयोजित करता है (दोनों रनटाइम पर लागू होती हैं)।
- यदि Gateway कॉन्फ़िगरेशन उपलब्ध नहीं है, तो CLI Node अनुमोदन स्नैपशॉट का उपयोग करता है और बताता है कि अंतिम रनटाइम नीति की गणना नहीं की जा सकी।

## लंबित अनुमोदन

Gateway से लंबित exec, Plugin, और OpenClaw सिस्टम-एजेंट अनुमोदन सूचीबद्ध करें:

```bash
openclaw approvals pending
openclaw approvals pending --json
```

पूर्ण गणना और उससे मेल खाने वाला ऑपरेटर-व्यापी `resolve` प्रवाह `operator.admin` का उपयोग करते हैं, क्योंकि अन्यथा अनुमोदन रिकॉर्ड अनुरोधकर्ता/समीक्षक फ़िल्टरिंग बनाए रखते हैं। समाधान के लिए समर्पित `operator.approvals` दायरे का भी अनुरोध किया जाता है। मानक CLI ऑपरेटर अनुदान में दोनों दायरे शामिल हैं; किसी प्रतिबंधित तृतीय-पक्ष क्लाइंट को केवल इस कमांड की नकल करने के लिए एडमिन का अनुरोध नहीं करना चाहिए।

मानव-पठनीय आउटपुट अनुमोदन का प्रकार, एजेंट/सत्र श्रेय, अनुरोध की आयु, समाप्ति तक का समय, संक्षिप्त कमांड या सारांश, और शेल-निरपेक्ष `id64_<base64url>` आईडी टोकन दिखाता है। संक्षिप्त तालिका के बाद हमेशा एक `Full request text` ब्लॉक आता है, जिसमें प्रत्येक पूर्ण टोकन और दोषरहित रूप से एस्केप किया गया अनुरोध होता है, ताकि टर्मिनल की चौड़ाई के कारण किया गया संक्षिप्तीकरण किसी प्रत्यय या समाधान के लिए आवश्यक टोकन को छिपा न सके। पूर्ण टोकन को `resolve` में कॉपी करें। अन्य फ़ील्ड में असुरक्षित टर्मिनल वर्ण दृश्यमान Unicode एस्केप के रूप में दिखाए जाते हैं। JSON आउटपुट `approvals` के अंतर्गत सामान्यीकृत प्रविष्टियाँ लौटाता है और स्क्रिप्ट के लिए मूल कच्चे `id`, `summary`, `createdAtMs`, और `expiresAtMs` को सुरक्षित रखता है; कच्चे आईडी `resolve` द्वारा तब तक स्वीकार किए जाते हैं, जब तक वे आरक्षित `id64_` प्रदर्शन-टोकन उपसर्ग का उपयोग न करें।

यदि दिया गया `id64_` मान किसी शाब्दिक कच्चे आईडी और किसी अन्य अनुमोदन के डिकोड किए गए प्रदर्शन टोकन—दोनों से मेल खाता है, तो CLI गलत अनुरोध के समाधान का जोखिम लेने के बजाय उसे संदिग्ध मानकर अस्वीकार कर देता है।

किसी एक अनुमोदन को उसके पूर्ण आईडी से हल करें:

```bash
openclaw approvals resolve <id> allow-once
openclaw approvals resolve <id> allow-always
openclaw approvals resolve <id> deny --reason "रखरखाव के दौरान अपेक्षित नहीं"
```

CLI उसका प्रकार चुनने के लिए एकीकृत अनुमोदन रिकॉर्ड पढ़ता है, रिकॉर्ड के अनुमत निर्णयों के विरुद्ध अनुरोधित निर्णय की जाँच करता है, और फिर एकीकृत रिज़ॉल्वर को कॉल करता है। पहला सफल निर्णय `0` के साथ समाप्त होता है। रिकॉर्ड किए गए निर्णय को दोहराना भी `0` के साथ समाप्त होता है और `already resolved (same decision)` की रिपोर्ट करता है। परस्पर-विरोधी निर्णय, अनुपस्थित अनुमोदन, समाप्त हो चुका अनुमोदन, या उस अनुमोदन प्रकार के लिए अनुपलब्ध निर्णय एक स्पष्ट त्रुटि प्रिंट करता है और गैर-शून्य स्थिति के साथ समाप्त होता है।

`--reason` CLI पुष्टि में एक स्थानीय टिप्पणी जोड़ता है। वर्तमान Gateway अनुमोदन रिकॉर्ड में मुक्त-पाठ समाधान-कारण फ़ील्ड नहीं है, इसलिए यह टिप्पणी स्थायी नहीं रखी जाती और न ही अन्य अनुमोदन सतहों पर भेजी जाती है।

## फ़ाइल से अनुमोदन बदलें

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` केवल सख्त JSON ही नहीं, बल्कि JSON5 भी स्वीकार करता है। `--file` या `--stdin` में से किसी एक का उपयोग करें, दोनों का नहीं।

होस्ट-नेटिव Windows Nodes अपनी स्वयं की नीति संरचना का उपयोग करते हैं:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

CLI पहले Node का वर्तमान हैश पढ़ता है और उसे अपडेट के साथ भेजता है, ताकि समवर्ती स्थानीय संपादन अधिलेखित होने के बजाय अस्वीकार किए जाएँ। `rules` आवश्यक है, क्योंकि यह कार्रवाई Node की पूरी नियम सूची को बदल देती है; `defaultAction` वैकल्पिक है। जो Node अपनी नेटिव नीति को अक्षम बताता है, उसे दूरस्थ रूप से कॉन्फ़िगर नहीं किया जा सकता; पहले उस होस्ट पर नीति सक्षम या कॉन्फ़िगर करें। होस्ट-नेटिव नीतियाँ `allowlist add|remove` सहायकों का समर्थन नहीं करतीं।

## "कभी संकेत न दें" / YOLO उदाहरण

जिस होस्ट को exec अनुमोदनों पर कभी नहीं रुकना चाहिए, उसके होस्ट अनुमोदन डिफ़ॉल्ट को `full` + `off` पर सेट करें:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

OpenClaw अनुमोदन फ़ाइल उजागर करने वाले Nodes के लिए `openclaw approvals set --node <id|name|ip> --stdin` के साथ उसी बॉडी का उपयोग करें। होस्ट-नेटिव Nodes के लिए ऊपर दिखाई गई उनकी स्वामी-विशिष्ट संरचना आवश्यक है।

यह केवल **होस्ट अनुमोदन फ़ाइल** बदलता है। अनुरोधित OpenClaw नीति को संरेखित रखने के लिए यह भी सेट करें:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

यहाँ `tools.exec.host=gateway` स्पष्ट रूप से दिया गया है, क्योंकि `host=auto` का अर्थ अब भी "उपलब्ध होने पर सैंडबॉक्स, अन्यथा Gateway" है: YOLO अनुमोदनों से संबंधित है, रूटिंग से नहीं। सैंडबॉक्स कॉन्फ़िगर होने पर भी होस्ट exec चाहिए, तो `gateway` (या `/exec host=gateway`) का उपयोग करें।

छोड़े गए `askFallback` का डिफ़ॉल्ट `deny` होता है। ऐसे बिना-UI वाले होस्ट को अपग्रेड करते समय, जिसे कभी-संकेत-न-देने वाला व्यवहार बनाए रखना चाहिए, `askFallback: "full"` को स्पष्ट रूप से सेट करें।

केवल स्थानीय मशीन पर समान अभिप्राय के लिए स्थानीय शॉर्टकट:

```bash
openclaw exec-policy preset yolo
```

## अनुमत-सूची सहायक

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## सामान्य विकल्प

`get`, `set`, और `allowlist add|remove` सभी इनका समर्थन करते हैं:

- `--node <id|name|ip>` (आईडी, नाम, IP, या आईडी उपसर्ग का समाधान करता है; `openclaw nodes` के समान रिज़ॉल्वर)
- `--gateway`
- साझा Node RPC विकल्प: `--url`, `--token`, `--timeout`, `--json`

लक्ष्य फ़्लैग न होने का अर्थ डिस्क पर मौजूद स्थानीय अनुमोदन फ़ाइल है।

`allowlist add|remove`, `--agent <id>` का भी समर्थन करता है (डिफ़ॉल्ट `"*"`, जो सभी एजेंटों पर लागू होता है)।

`pending` और `resolve` हमेशा Gateway का उपयोग करते हैं, क्योंकि लंबित अनुरोध लाइव Gateway स्थिति हैं। वे साझा Gateway कनेक्शन विकल्पों `--url`, `--token`, और `--timeout` का समर्थन करते हैं; `pending`, `--json` का भी समर्थन करता है।

## टिप्पणियाँ

- Node होस्ट को `system.execApprovals.get/set` का विज्ञापन करना आवश्यक है (macOS ऐप, हेडलेस Node होस्ट, या Windows companion)।
- अनुमोदन फ़ाइलें OpenClaw स्थिति डायरेक्टरी में प्रति होस्ट संग्रहीत की जाती हैं: `$OPENCLAW_STATE_DIR/exec-approvals.json`, या वेरिएबल सेट न होने पर `~/.openclaw/exec-approvals.json`।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Exec अनुमोदन](/hi/tools/exec-approvals)
