---
read_when:
    - आप CLI से exec अनुमोदन संपादित करना चाहते हैं
    - आपको Gateway या Node होस्ट पर अनुमति-सूचियाँ प्रबंधित करनी होंगी
summary: '`openclaw approvals` और `openclaw exec-policy` के लिए CLI संदर्भ'
title: अनुमोदन
x-i18n:
    generated_at: "2026-06-28T22:46:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

**स्थानीय होस्ट**, **Gateway होस्ट**, या **नोड होस्ट** के लिए exec अनुमोदन प्रबंधित करें।
डिफ़ॉल्ट रूप से, कमांड डिस्क पर स्थानीय अनुमोदन फ़ाइल को लक्ष्य करते हैं। Gateway को लक्ष्य करने के लिए `--gateway`, या किसी विशिष्ट नोड को लक्ष्य करने के लिए `--node` का उपयोग करें।

उपनाम: `openclaw exec-approvals`

संबंधित:

- Exec अनुमोदन: [Exec अनुमोदन](/hi/tools/exec-approvals)
- नोड्स: [नोड्स](/hi/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` अनुरोधित
`tools.exec.*` कॉन्फ़िग और स्थानीय होस्ट अनुमोदन फ़ाइल को एक ही चरण में संरेखित रखने के लिए स्थानीय सुविधा कमांड है।

इसका उपयोग तब करें जब आप:

- स्थानीय अनुरोधित नीति, होस्ट अनुमोदन फ़ाइल, और प्रभावी मर्ज का निरीक्षण करना चाहते हों
- YOLO या deny-all जैसा कोई स्थानीय प्रीसेट लागू करना चाहते हों
- स्थानीय `tools.exec.*` और स्थानीय होस्ट अनुमोदन फ़ाइल को सिंक्रनाइज़ करना चाहते हों

उदाहरण:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

आउटपुट मोड:

- कोई `--json` नहीं: मानव-पठनीय तालिका दृश्य प्रिंट करता है
- `--json`: मशीन-पठनीय संरचित आउटपुट प्रिंट करता है

वर्तमान दायरा:

- `exec-policy` **केवल-स्थानीय** है
- यह स्थानीय कॉन्फ़िग फ़ाइल और स्थानीय अनुमोदन फ़ाइल को साथ में अपडेट करता है
- यह नीति को Gateway होस्ट या किसी नोड होस्ट पर पुश **नहीं** करता
- इस कमांड में `--host node` अस्वीकार किया जाता है क्योंकि नोड exec अनुमोदन रनटाइम पर नोड से प्राप्त किए जाते हैं और उन्हें इसके बजाय नोड-लक्षित अनुमोदन कमांड के माध्यम से प्रबंधित किया जाना चाहिए
- `openclaw exec-policy show` स्थानीय अनुमोदन फ़ाइल से प्रभावी नीति निकालने के बजाय `host=node` दायरों को रनटाइम पर नोड-प्रबंधित के रूप में चिह्नित करता है

यदि आपको दूरस्थ होस्ट अनुमोदन सीधे संपादित करने की आवश्यकता है, तो `openclaw approvals set --gateway`
या `openclaw approvals set --node <id|name|ip>` का उपयोग जारी रखें।

## सामान्य कमांड

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` अब स्थानीय, Gateway, और नोड लक्ष्यों के लिए प्रभावी exec नीति दिखाता है:

- अनुरोधित `tools.exec` नीति
- होस्ट अनुमोदन-फ़ाइल नीति
- प्राथमिकता नियम लागू होने के बाद प्रभावी परिणाम

प्राथमिकता जानबूझकर है:

- होस्ट अनुमोदन फ़ाइल लागू करने योग्य सत्य का स्रोत है
- अनुरोधित `tools.exec` नीति इरादे को सीमित या विस्तृत कर सकती है, लेकिन प्रभावी परिणाम फिर भी होस्ट नियमों से ही निकाला जाता है
- `--node` नोड होस्ट अनुमोदन फ़ाइल को Gateway `tools.exec` नीति के साथ जोड़ता है, क्योंकि रनटाइम पर दोनों अब भी लागू होते हैं
- यदि Gateway कॉन्फ़िग उपलब्ध नहीं है, तो CLI नोड अनुमोदन स्नैपशॉट पर वापस जाती है और नोट करती है कि अंतिम रनटाइम नीति की गणना नहीं की जा सकी

## फ़ाइल से अनुमोदन बदलें

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` JSON5 स्वीकार करता है, केवल सख्त JSON नहीं। `--file` या `--stdin` में से किसी एक का उपयोग करें, दोनों का नहीं।

## "कभी प्रॉम्प्ट न करें" / YOLO उदाहरण

ऐसे होस्ट के लिए जिसे exec अनुमोदनों पर कभी रुकना नहीं चाहिए, होस्ट अनुमोदन डिफ़ॉल्ट को `full` + `off` पर सेट करें:

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

नोड वेरिएंट:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
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

यह केवल **होस्ट अनुमोदन फ़ाइल** बदलता है। अनुरोधित OpenClaw नीति को संरेखित रखने के लिए, यह भी सेट करें:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

इस उदाहरण में `tools.exec.host=gateway` क्यों:

- `host=auto` का अर्थ अब भी "उपलब्ध होने पर sandbox, अन्यथा Gateway" है।
- YOLO अनुमोदनों के बारे में है, रूटिंग के बारे में नहीं।
- यदि sandbox कॉन्फ़िग होने पर भी आप होस्ट exec चाहते हैं, तो `gateway` या `/exec host=gateway` के साथ होस्ट चयन को स्पष्ट करें।

छोड़ा गया `askFallback` डिफ़ॉल्ट रूप से `deny` होता है। ऐसे no-UI होस्ट को अपग्रेड करते समय जिसे never-prompt व्यवहार बनाए रखना चाहिए, `askFallback: "full"`
स्पष्ट रूप से सेट करें।

स्थानीय शॉर्टकट:

```bash
openclaw exec-policy preset yolo
```

वह स्थानीय शॉर्टकट अनुरोधित स्थानीय `tools.exec.*` कॉन्फ़िग और
स्थानीय अनुमोदन डिफ़ॉल्ट दोनों को साथ में अपडेट करता है। इरादे में यह ऊपर दिए गए मैनुअल दो-चरण
सेटअप के बराबर है, लेकिन केवल स्थानीय मशीन के लिए।

## अनुमति-सूची सहायक

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## सामान्य विकल्प

`get`, `set`, और `allowlist add|remove` सभी समर्थन करते हैं:

- `--node <id|name|ip>`
- `--gateway`
- साझा नोड RPC विकल्प: `--url`, `--token`, `--timeout`, `--json`

लक्ष्यीकरण नोट्स:

- कोई लक्ष्य फ़्लैग नहीं होने का अर्थ डिस्क पर स्थानीय अनुमोदन फ़ाइल है
- `--gateway` Gateway होस्ट अनुमोदन फ़ाइल को लक्ष्य करता है
- `--node` id, नाम, IP, या id prefix हल करने के बाद एक नोड होस्ट को लक्ष्य करता है

`allowlist add|remove` यह भी समर्थन करता है:

- `--agent <id>` (डिफ़ॉल्ट `*` है)

## नोट्स

- `--node` वही रिज़ॉल्वर उपयोग करता है जो `openclaw nodes` (id, नाम, ip, या id prefix) उपयोग करता है।
- `--agent` डिफ़ॉल्ट रूप से `"*"` होता है, जो सभी एजेंटों पर लागू होता है।
- नोड होस्ट को `system.execApprovals.get/set` का विज्ञापन करना चाहिए (macOS ऐप या headless नोड होस्ट)।
- अनुमोदन फ़ाइलें OpenClaw state dir में प्रति होस्ट संग्रहीत होती हैं
  (`$OPENCLAW_STATE_DIR/exec-approvals.json`, या
  वेरिएबल अनसेट होने पर `~/.openclaw/exec-approvals.json`)।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Exec अनुमोदन](/hi/tools/exec-approvals)
