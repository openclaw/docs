---
read_when:
    - exec अनुमोदन या अनुमति-सूचियाँ कॉन्फ़िगर करना
    - macOS ऐप में exec अनुमोदन UX लागू करना
    - सैंडबॉक्स-एस्केप प्रॉम्प्ट और उनके निहितार्थों की समीक्षा करना
sidebarTitle: Exec approvals
summary: 'होस्ट exec अनुमोदन: नीति नियंत्रण, अनुमति-सूचियाँ, और YOLO/सख्त कार्यप्रवाह'
title: Exec अनुमोदन
x-i18n:
    generated_at: "2026-07-19T09:49:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4553f129db78cce95bfde7c4a13b95a2282f9d1ab38ba5819a0816a4fd5ea4c6
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec अनुमोदन एक सैंडबॉक्स्ड एजेंट को वास्तविक होस्ट (`gateway` या `node`) पर कमांड चलाने देने के लिए **सहायक ऐप / Node होस्ट सुरक्षा-सीमा** हैं। कमांड केवल तभी चलते हैं जब नीति + अनुमति-सूची + (वैकल्पिक) उपयोगकर्ता अनुमोदन, सभी सहमत हों।
अनुमोदन टूल नीति और एलिवेटेड गेटिंग के **ऊपर अतिरिक्त रूप से** लागू होते हैं (एलिवेटेड
`full` उन्हें छोड़ देता है)।

`deny`, `allowlist`, `ask`, `auto`, `full`,
Codex Guardian मैपिंग और ACPX हार्नेस अनुमतियों के मोड-प्रथम अवलोकन के लिए,
[अनुमति मोड](/hi/tools/permission-modes) देखें।

<Note>
प्रभावी नीति, `tools.exec.*` और अनुमोदन डिफ़ॉल्ट में से **अधिक कठोर** होती है: अनुमोदन केवल कॉन्फ़िगरेशन-व्युत्पन्न सुरक्षा/पूछताछ को अधिक कठोर बना सकते हैं, कभी भी
उन्हें शिथिल नहीं कर सकते। यदि कोई अनुमोदन फ़ील्ड छोड़ा गया है, तो `tools.exec` मान
का उपयोग होता है। होस्ट Exec उस मशीन पर स्थानीय अनुमोदन स्थिति का भी उपयोग करता है—निष्पादन होस्ट की अनुमोदन फ़ाइल में होस्ट-स्थानीय `ask: "always"`, सत्र या कॉन्फ़िगरेशन डिफ़ॉल्ट द्वारा `ask: "on-miss"` का अनुरोध किए जाने पर भी
संकेत देता रहता है।
</Note>

## यह कहाँ लागू होता है

Exec अनुमोदन निष्पादन होस्ट पर स्थानीय रूप से लागू किए जाते हैं:

- **Gateway होस्ट** -> Gateway मशीन पर `openclaw` प्रक्रिया।
- **Node होस्ट** -> Node रनर (macOS सहायक ऐप या हेडलेस Node होस्ट)।

### विश्वास मॉडल

- Gateway-प्रमाणित कॉलर उस Gateway के विश्वसनीय ऑपरेटर होते हैं।
- युग्मित Node उस विश्वसनीय ऑपरेटर क्षमता को Node होस्ट तक विस्तारित करते हैं।
- अनुमोदन आकस्मिक निष्पादन का जोखिम कम करते हैं, लेकिन वे **प्रति-उपयोगकर्ता प्रमाणीकरण सीमा या फ़ाइल-सिस्टम केवल-पठन नीति नहीं** हैं।
- अनुमोदित होने के बाद, कोई कमांड चुने गए होस्ट या सैंडबॉक्स फ़ाइल-सिस्टम अनुमतियों के अनुसार फ़ाइलें बदल सकता है।
- अनुमोदित Node-होस्ट रन प्रामाणिक निष्पादन संदर्भ को बाँधते हैं: cwd, सटीक argv, मौजूद होने पर env बाइंडिंग, और लागू होने पर पिन किया गया निष्पादनयोग्य पथ।
- शेल स्क्रिप्ट और सीधे इंटरप्रेटर/रनटाइम फ़ाइल आह्वानों के लिए, OpenClaw एक ठोस स्थानीय फ़ाइल ऑपरेंड को भी बाँधने का प्रयास करता है। यदि वह फ़ाइल अनुमोदन के बाद लेकिन निष्पादन से पहले बदलती है, तो परिवर्तित सामग्री चलाने के बजाय रन अस्वीकार कर दिया जाता है।
- फ़ाइल बाइंडिंग सर्वोत्तम-प्रयास है, प्रत्येक इंटरप्रेटर/रनटाइम लोडर पथ का पूर्ण मॉडल नहीं। यदि ठीक एक ठोस स्थानीय फ़ाइल पहचानी नहीं जा सकती, तो OpenClaw पूर्ण कवरेज का दिखावा करने के बजाय अनुमोदन-समर्थित रन बनाने से इनकार करता है।

### macOS विभाजन

- **Node होस्ट सेवा**, `system.run` को स्थानीय IPC पर **macOS ऐप** को अग्रेषित करती है।
- **macOS ऐप** अनुमोदन लागू करता है और UI संदर्भ में कमांड निष्पादित करता है।

## प्रभावी नीति का निरीक्षण

| कमांड                                                          | यह क्या दिखाता है                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | अनुरोधित नीति, होस्ट नीति स्रोत और प्रभावी परिणाम।                       |
| `openclaw exec-policy show`                                      | स्थानीय-मशीन का मर्ज किया गया दृश्य।                                                             |
| `openclaw exec-policy set` / `preset`                            | स्थानीय अनुरोधित नीति को स्थानीय होस्ट अनुमोदन फ़ाइल के साथ एक चरण में समकालित करता है। |

<Note>
प्रति-सत्र `/exec` ओवरराइड शामिल नहीं हैं। संबंधित सत्र के वर्तमान डिफ़ॉल्ट का निरीक्षण करने के लिए उसमें `/exec` चलाएँ। [सत्र ओवरराइड](/hi/tools/exec#session-overrides-exec) देखें।
</Note>

पूर्ण CLI संदर्भ (फ़्लैग, JSON आउटपुट, अनुमति-सूची जोड़ना/हटाना): [अनुमोदन CLI](/hi/cli/approvals)।

जब कोई स्थानीय स्कोप `host=node` का अनुरोध करता है, तो `exec-policy show` स्थानीय अनुमोदन फ़ाइल को सत्य का स्रोत मानने के बजाय
उस स्कोप को रनटाइम पर Node-प्रबंधित बताता है।

यदि सहायक ऐप UI **उपलब्ध नहीं है**, तो सामान्य रूप से संकेत देने वाला कोई भी अनुरोध **पूछताछ फ़ॉलबैक** (डिफ़ॉल्ट: `deny`) द्वारा हल किया जाता है।

<Tip>
नेटिव चैट अनुमोदन क्लाइंट लंबित अनुमोदन संदेश पर चैनल-विशिष्ट सुविधाएँ पहले से जोड़ सकते हैं। Matrix प्रतिक्रिया शॉर्टकट (`✅` एक बार अनुमति दें,
`♾️` हमेशा अनुमति दें, `❌` अस्वीकार करें) जोड़ता है, जबकि फ़ॉलबैक के रूप में संदेश में `/approve ...` भी बनाए रखता है।
</Tip>

## सेटिंग और भंडारण

अनुमोदन निष्पादन होस्ट पर एक स्थानीय JSON फ़ाइल में रहते हैं। जब
`OPENCLAW_STATE_DIR` सेट होता है, तो फ़ाइल उस स्थिति निर्देशिका का अनुसरण करती है;
अन्यथा यह डिफ़ॉल्ट OpenClaw स्थिति निर्देशिका का उपयोग करती है:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# अन्यथा
~/.openclaw/exec-approvals.json
```

डिफ़ॉल्ट अनुमोदन सॉकेट उसी रूट का अनुसरण करता है:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, या
चर के अनसेट होने पर `~/.openclaw/exec-approvals.sock`।

स्थिति निर्देशिकाएँ स्वतंत्र विश्वास स्कोप हैं। जब `OPENCLAW_STATE_DIR`
किसी अन्य स्थान की ओर संकेत करता है, तो OpenClaw कभी भी
`~/.openclaw/exec-approvals.json` को आयात या संग्रहित नहीं करता; कस्टम स्थिति निर्देशिका के लिए अनुमोदन अलग से कॉन्फ़िगर करें। Doctor भी विरासती
`plugin-binding-approvals.json` को केवल तभी आयात करता है, जब वह सक्रिय स्थिति निर्देशिका से संबंधित हो।

उदाहरण स्कीमा:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "source": "allow-always",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## नीति नियंत्रण

### `tools.exec.mode`

`tools.exec.mode` होस्ट Exec के लिए पसंदीदा सामान्यीकृत नीति सतह है:

| मान       | व्यवहार                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | होस्ट Exec को अवरुद्ध करें।                                                                                                                                                          |
| `allowlist` | बिना पूछे केवल अनुमति-सूचीबद्ध कमांड चलाएँ।                                                                                                                             |
| `ask`       | अनुमति-सूची नीति का उपयोग करें और मेल न मिलने पर पूछें।                                                                                                                                   |
| `auto`      | अनुमति-सूची नीति का उपयोग करें, निर्धारक मेल सीधे चलाएँ, और अनुमोदन न मिलने के मामलों को मानव अनुमोदन मार्ग पर फ़ॉलबैक करने से पहले OpenClaw के नेटिव स्वचालित समीक्षक को भेजें। |
| `full`      | अनुमोदन संकेतों के बिना होस्ट Exec चलाएँ।                                                                                                                                   |

विरासती `tools.exec.security` / `tools.exec.ask` समर्थित बने हुए हैं और उस स्कोप पर जहाँ भी `mode` अनसेट है, अब भी
लागू होते हैं।

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - सभी होस्ट Exec अनुरोध अवरुद्ध करें।
  - `allowlist` - केवल अनुमति-सूचीबद्ध कमांड की अनुमति दें।
  - `full` - सभी की अनुमति दें (एलिवेटेड के समतुल्य)।

Gateway/Node होस्ट के लिए डिफ़ॉल्ट `full` है; इसके बजाय `sandbox` होस्ट का डिफ़ॉल्ट
`deny` होता है।
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  होस्ट Exec के लिए कॉन्फ़िगर की गई पूछताछ नीति। `tools.exec.ask` और होस्ट अनुमोदन डिफ़ॉल्ट से आधारभूत अनुमोदन
  संकेत व्यवहार को नियंत्रित करती है।
  डिफ़ॉल्ट `off` है। प्रति-कॉल `ask` टूल पैरामीटर ([Exec टूल](/hi/tools/exec#parameters) देखें) केवल उस आधाररेखा को अधिक कठोर बना सकता है, और
  प्रभावी होस्ट पूछताछ `off` होने पर चैनल-मूल मॉडल कॉल इसे अनदेखा करते हैं।

- `off` - कभी संकेत न दें।
- `on-miss` - केवल तभी संकेत दें जब अनुमति-सूची मेल न खाए।
- `always` - प्रत्येक कमांड पर संकेत दें। प्रभावी पूछताछ मोड `always` होने पर `allow-always` स्थायी विश्वास संकेतों को **नहीं** रोकता।

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  जब संकेत आवश्यक हो लेकिन कोई UI पहुँच योग्य न हो (या संकेत का समय समाप्त हो जाए), तब समाधान। छोड़े जाने पर डिफ़ॉल्ट `deny` होता है।

- `deny` - अवरुद्ध करें।
- `allowlist` - केवल अनुमति-सूची के मेल खाने पर अनुमति दें।
- `full` - अनुमति दें।

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true` होने पर, इनलाइन कोड-मूल्यांकन रूपों को केवल-अनुमोदन मानता है, भले ही
  इंटरप्रेटर बाइनरी स्वयं अनुमति-सूचीबद्ध हो। उन इंटरप्रेटर लोडरों के लिए गहन प्रतिरक्षा जो एक स्थिर फ़ाइल ऑपरेंड से साफ़ तौर पर मैप नहीं होते।
</ParamField>

सख़्त मोड द्वारा पकड़े जाने वाले उदाहरण: `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (साथ ही `awk`,
`sed`, `make`, `find -exec`, और `xargs` इनलाइन रूप)।

सख़्त मोड में इन कमांडों को समीक्षक या स्पष्ट अनुमोदन चाहिए। `tools.exec.mode: "auto"` के साथ, जब कमांड में लागू की जा सकने वाली योजना हो, तो समीक्षक एक कम-जोखिम निष्पादन की अनुमति दे सकता है; अन्यथा OpenClaw किसी मानव से पूछता है।
समीक्षक फ़ॉलबैक तक पहुँचने वाले `Codex app-server` कमांड अनुमोदन किसी मानव से पूछते हैं, क्योंकि उनके अनुमोदन अनुरोध लागू किया जा सकने वाला समाधान किया हुआ
निष्पादनयोग्य उजागर नहीं करते।
`allow-always` इनलाइन-मूल्यांकन कमांड के लिए नई अनुमति-सूची प्रविष्टियाँ स्थायी नहीं करता।

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  केवल प्रस्तुति: सक्षम होने पर, OpenClaw पार्सर-व्युत्पन्न
  कमांड विस्तार संलग्न कर सकता है, ताकि Web अनुमोदन संकेत कमांड टोकन को हाइलाइट कर सकें। यह
  `security`, `ask`, अनुमति-सूची मिलान, सख़्त इनलाइन-मूल्यांकन
  व्यवहार, अनुमोदन अग्रेषण या कमांड निष्पादन को **नहीं** बदलता।
</ParamField>

इसे वैश्विक रूप से `tools.exec.commandHighlighting` के अंतर्गत या प्रति एजेंट
`agents.list[].tools.exec.commandHighlighting` के अंतर्गत सेट करें।

## YOLO मोड (बिना-अनुमोदन)

अनुमोदन संकेतों के बिना होस्ट Exec चलाने के लिए, **दोनों** नीति परतें खोलें:
OpenClaw कॉन्फ़िगरेशन में अनुरोधित Exec नीति (`tools.exec.*`) **और**
निष्पादन होस्ट अनुमोदन फ़ाइल में होस्ट-स्थानीय अनुमोदन नीति।

छोड़े गए `askFallback` का डिफ़ॉल्ट `deny` होता है। जब बिना-UI अनुमोदन संकेत को अनुमति पर फ़ॉलबैक करना चाहिए, तो होस्ट `askFallback` को स्पष्ट रूप से `full` पर सेट करें।

| परत                 | YOLO सेटिंग               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` पर `full` |
| `tools.exec.ask`      | `off`                      |
| होस्ट `askFallback`    | `full`                     |

<Warning>
**महत्वपूर्ण अंतर:**

- `tools.exec.host=auto` चुनता है कि exec **कहाँ** चलता है: उपलब्ध होने पर sandbox में, अन्यथा gateway पर।
- YOLO चुनता है कि host exec को **कैसे** स्वीकृति दी जाती है: `security=full` और `ask=off`।
- YOLO, कॉन्फ़िगर की गई host exec नीति के ऊपर कोई अलग ह्यूरिस्टिक कमांड-अस्पष्टीकरण स्वीकृति गेट या स्क्रिप्ट-प्रीफ़्लाइट अस्वीकृति परत **नहीं** जोड़ता।
- `auto` sandbox किए गए सत्र से gateway रूटिंग को स्वतंत्र रूप से ओवरराइड करने योग्य नहीं बनाता। प्रति-कॉल `host=node` अनुरोध की अनुमति `auto` से है; `host=gateway` की अनुमति `auto` से केवल तभी है, जब कोई sandbox रनटाइम सक्रिय न हो। स्थिर non-auto डिफ़ॉल्ट के लिए, `tools.exec.host` सेट करें या स्पष्ट रूप से `/exec host=...` का उपयोग करें।

</Warning>

अपने स्वयं के गैर-इंटरैक्टिव अनुमति मोड उपलब्ध कराने वाले CLI-आधारित प्रदाता
इस नीति का पालन कर सकते हैं। जब OpenClaw की प्रभावी exec
नीति YOLO होती है, तो Claude CLI
`--permission-mode bypassPermissions` जोड़ता है। OpenClaw द्वारा प्रबंधित Claude लाइव सत्रों के लिए, OpenClaw की
प्रभावी exec नीति Claude के मूल अनुमति मोड पर आधिकारिक होती है:
YOLO लाइव लॉन्च को `--permission-mode bypassPermissions` में सामान्यीकृत करता है, और
प्रतिबंधात्मक प्रभावी exec नीति लाइव लॉन्च को
`--permission-mode default` में सामान्यीकृत करती है, भले ही कच्चे Claude backend आर्ग्युमेंट कोई अन्य
मोड निर्दिष्ट करें।

यदि आप अधिक रूढ़िवादी सेटअप चाहते हैं, तो OpenClaw exec नीति को वापस
`allowlist` / `on-miss` या `deny` तक सख्त करें।

### स्थायी gateway-host "कभी संकेत न दें" सेटअप

<Steps>
  <Step title="अनुरोधित कॉन्फ़िगरेशन नीति सेट करें">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="host approvals फ़ाइल का मिलान करें">
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
  </Step>
</Steps>

### स्थानीय शॉर्टकट

```bash
openclaw exec-policy preset yolo
```

यह स्थानीय `tools.exec.host/security/ask` और स्थानीय approvals
फ़ाइल के डिफ़ॉल्ट (जिसमें `askFallback: "full"` शामिल है), दोनों को अपडेट करता है। इसे जानबूझकर
केवल स्थानीय रखा गया है। gateway-host या node-host approvals को दूरस्थ रूप से बदलने के लिए,
`openclaw approvals set --gateway` या `openclaw approvals set --node
<id|name|ip>` का उपयोग करें।

अन्य अंतर्निर्मित प्रीसेट: `cautious` (`host=gateway`, `security=allowlist`,
`ask=on-miss`, `askFallback=deny`) और `deny-all` (`host=gateway`,
`security=deny`, `ask=off`, `askFallback=deny`)। उसी तरह लागू करें:
`openclaw exec-policy preset cautious`।

पूर्ण प्रीसेट के बजाय अलग-अलग फ़ील्ड सेट करने के लिए,
इनमें से किसी भी फ़्लैग के उपसमुच्चय के साथ `openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` का उपयोग करें।

### Node host

इसके बजाय Node पर वही approvals फ़ाइल लागू करें:

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

<Note>
**केवल-स्थानीय सीमाएँ:**

- `openclaw exec-policy` Node approvals को सिंक्रनाइज़ नहीं करता।
- `openclaw exec-policy set --host node` अस्वीकार कर दिया जाता है।
- Node exec approvals रनटाइम पर Node से प्राप्त किए जाते हैं, इसलिए Node-लक्षित अपडेट के लिए `openclaw approvals --node ...` का उपयोग करना आवश्यक है।

</Note>

### केवल-सत्र शॉर्टकट

- `/exec security=full ask=off` केवल वर्तमान सत्र को बदलता है।
- `/elevated full` एक आपातकालीन शॉर्टकट है, जो exec approvals को केवल
  तभी छोड़ता है, जब अनुरोधित नीति और host approvals फ़ाइल, दोनों
  `security: "full"` और `ask: "off"` में परिणत हों। `ask:
"always"` जैसी अधिक सख्त host फ़ाइल फिर भी संकेत देती है।

यदि host approvals फ़ाइल कॉन्फ़िगरेशन से अधिक सख्त रहती है, तो अधिक सख्त host
नीति ही प्रभावी रहती है।

## अनुमति-सूची (प्रति एजेंट)

अनुमति-सूचियाँ **प्रति एजेंट** होती हैं। यदि कई एजेंट मौजूद हैं, तो macOS ऐप में
वह एजेंट बदलें जिसे आप संपादित कर रहे हैं। पैटर्न glob मिलान हैं।

पैटर्न resolved binary path globs या केवल command-name globs हो सकते हैं।
केवल नाम उन्हीं कमांड से मेल खाते हैं जिन्हें `PATH` के माध्यम से चलाया जाता है, इसलिए जब कमांड `rg` हो, तब `rg`
`/opt/homebrew/bin/rg` से मेल खा सकता है, लेकिन `./rg` या
`/tmp/rg` से **नहीं**। किसी विशिष्ट binary स्थान पर भरोसा करने के लिए path glob का उपयोग करें।

पुरानी `agents.default` प्रविष्टियाँ लोड होने पर `agents.main` में माइग्रेट की जाती हैं।
`echo ok && pwd` जैसी shell chains में भी प्रत्येक शीर्ष-स्तरीय खंड को
अनुमति-सूची नियमों को पूरा करना आवश्यक है।

उदाहरण:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### argPattern से आर्ग्युमेंट प्रतिबंधित करना

जब किसी अनुमति-सूची प्रविष्टि को binary और किसी विशिष्ट आर्ग्युमेंट संरचना से मेल खाना हो, तो
`argPattern` जोड़ें। OpenClaw प्रत्येक host पर ECMAScript (JavaScript) regular
expression semantics का उपयोग करता है और expression का मूल्यांकन
पार्स किए गए command arguments के विरुद्ध करता है, जिसमें executable token (`argv[0]`) शामिल नहीं होता।
हाथ से लिखी प्रविष्टियों के लिए, arguments को एकल स्पेस से जोड़ा जाता है, इसलिए
सटीक मिलान की आवश्यकता होने पर pattern को anchor करें।

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

वह प्रविष्टि `python3 safe.py` की अनुमति देती है; `python3 other.py` अनुमति-सूची से
मेल नहीं खाता। यदि उसी binary के लिए केवल-path प्रविष्टि भी मौजूद है, तो मेल न खाने वाले
arguments अभी भी उस केवल-path प्रविष्टि पर fallback कर सकते हैं। यदि लक्ष्य binary को घोषित arguments तक
सीमित करना है, तो केवल-path प्रविष्टि को छोड़ दें।

स्वीकृति प्रवाहों द्वारा सहेजी गई प्रविष्टियाँ सटीक
argv मिलान के लिए आंतरिक separator format का उपयोग करती हैं। encoded value को हाथ से संपादित करने के बजाय उन प्रविष्टियों को
फिर से बनाने के लिए UI या स्वीकृति प्रवाह को प्राथमिकता दें। यदि OpenClaw किसी command segment के लिए argv
पार्स नहीं कर पाता, तो `argPattern` वाली प्रविष्टियाँ मेल नहीं खातीं।

प्रत्येक अनुमति-सूची प्रविष्टि इसका समर्थन करती है:

| फ़ील्ड              | अर्थ                                              |
| ------------------ | ---------------------------------------------------- |
| `pattern`          | resolved binary path glob या केवल command-name glob  |
| `argPattern`       | वैकल्पिक ECMAScript argv regex; अनुपस्थित होने पर केवल-path |
| `id`               | स्थिर opaque ID; अनुपस्थित होने पर UUID के रूप में जनरेट किया जाता है    |
| `source`           | प्रविष्टि स्रोत, जैसे `allow-always`                 |
| `commandText`      | पुराना plaintext input; लोड होने के दौरान हटा दिया जाता है        |
| `lastUsedAt`       | अंतिम उपयोग का timestamp                                  |
| `lastUsedCommand`  | अंतिम मेल खाने वाला command                            |
| `lastResolvedPath` | अंतिम resolved binary path                            |

## Skill CLI को स्वतः अनुमति देना

जब **Skill CLI को स्वतः अनुमति दें** (`autoAllowSkills`) सक्षम होता है, तो ज्ञात Skills द्वारा
संदर्भित executables को Nodes (macOS Node
या headless Node host) पर अनुमति-सूचीबद्ध माना जाता है। यह Skill bin list प्राप्त करने के लिए Gateway RPC पर `skills.bins` का
उपयोग करता है। यदि आप सख्त मैन्युअल
अनुमति-सूचियाँ चाहते हैं, तो इसे अक्षम करें।

<Warning>
- यह मैन्युअल path अनुमति-सूची प्रविष्टियों से अलग एक **अंतर्निहित सुविधाजनक अनुमति-सूची** है।
- यह उन विश्वसनीय ऑपरेटर परिवेशों के लिए है, जहाँ Gateway और Node एक ही विश्वास सीमा में होते हैं।
- यदि आपको सख्त स्पष्ट विश्वास चाहिए, तो `autoAllowSkills: false` बनाए रखें और केवल मैन्युअल path अनुमति-सूची प्रविष्टियों का उपयोग करें।

</Warning>

## सुरक्षित binaries और स्वीकृति अग्रेषण

सुरक्षित binaries (केवल-stdin तेज़ पथ), interpreter binding विवरण, और
स्वीकृति संकेतों को Slack/Discord/Telegram पर अग्रेषित करने (या उन्हें
मूल स्वीकृति क्लाइंट के रूप में चलाने) के तरीके के लिए,
[Exec approvals - उन्नत](/hi/tools/exec-approvals-advanced) देखें।

## Control UI में संपादन

डिफ़ॉल्ट, प्रति-एजेंट ओवरराइड और अनुमति-सूचियाँ संपादित करने के लिए **Control UI -> Nodes -> Exec approvals** कार्ड का उपयोग करें।
एक कार्यक्षेत्र (Defaults या कोई एजेंट) चुनें,
नीति समायोजित करें, अनुमति-सूची पैटर्न जोड़ें/हटाएँ, फिर **Save** करें। सूची को व्यवस्थित रखने में सहायता के लिए UI
प्रत्येक पैटर्न के अंतिम उपयोग का metadata दिखाता है।

लक्ष्य selector **Gateway** (स्थानीय approvals) या कोई **Node** चुनता है।
Nodes को `system.execApprovals.get/set` विज्ञापित करना आवश्यक है (macOS ऐप या headless
Node host)। यदि कोई Node अभी exec approvals विज्ञापित नहीं करता, तो उसकी
स्थानीय approvals फ़ाइल सीधे संपादित करें।

Windows companion सहित कुछ Node hosts की अपनी अलग approval
policy format होती है। Control UI इन host-native policies को read-only दिखाता है। उन्हें संपादित करने के लिए
companion ऐप या native
policy shape के साथ `openclaw approvals set --node <id|name|ip>` का उपयोग करें; [Approvals CLI](/hi/cli/approvals) देखें।

CLI: `openclaw approvals` Gateway या Node संपादन का समर्थन करता है — देखें
[Approvals CLI](/hi/cli/approvals)।

## स्वीकृति प्रवाह

जब संकेत आवश्यक होता है, तो Gateway ऑपरेटर क्लाइंट को
`exec.approval.requested` प्रसारित करता है। Control UI और macOS
ऐप इसे `exec.approval.resolve` के माध्यम से हल करते हैं, फिर Gateway स्वीकृत अनुरोध को
Node host पर अग्रेषित करता है।

`host=node` के लिए, स्वीकृति अनुरोधों में canonical `systemRunPlan`
payload शामिल होता है। स्वीकृत `system.run` अनुरोधों को अग्रेषित करते समय Gateway उस योजना को आधिकारिक command/cwd/session
संदर्भ के रूप में उपयोग करता है:

- Node exec पथ शुरुआत में ही एक canonical योजना तैयार करता है।
- स्वीकृति रिकॉर्ड उस योजना और उसके binding metadata को संग्रहीत करता है।
- स्वीकृति मिलने के बाद, अंतिम अग्रेषित `system.run` कॉल बाद के caller edits पर भरोसा करने के बजाय संग्रहीत योजना का पुनः उपयोग करती है।
- यदि स्वीकृति अनुरोध बनाए जाने के बाद caller `command`, `rawCommand`, `cwd`, `agentId`, या `sessionKey` बदलता है, तो Gateway अग्रेषित run को स्वीकृति बेमेल के रूप में अस्वीकार कर देता है।

## सिस्टम घटनाएँ और अस्वीकृतियाँ

Node द्वारा पूर्णता रिपोर्ट करने के बाद exec lifecycle एजेंट के
सत्र में `Exec finished` सिस्टम संदेश पोस्ट करता है। स्वीकृति मिलने के बाद,
`tools.exec.approvalRunningNoticeMs` बीतने पर OpenClaw
प्रगति में होने की सूचना भी भेज सकता है (डिफ़ॉल्ट `10000`, `0` इसे अक्षम
करता है)। अस्वीकृत exec approvals host command के लिए अंतिम होती हैं: command
नहीं चलता।

- मूल सत्र वाले मुख्य-एजेंट के async approvals के लिए, OpenClaw
  अस्वीकृति को आंतरिक followup के रूप में उसी सत्र में वापस पोस्ट करता है, ताकि एजेंट
  async command की प्रतीक्षा बंद कर सके और missing-result
  repair से बच सके।
- यदि कोई सत्र नहीं है या सत्र फिर से शुरू नहीं किया जा सकता, तो OpenClaw
  फिर भी ऑपरेटर या सीधे chat route पर संक्षिप्त अस्वीकृति रिपोर्ट कर सकता है।
- उप-एजेंट और Cron सत्रों की अस्वीकृतियाँ उस
  सत्र में वापस पोस्ट नहीं की जातीं।

Gateway-host exec approvals भी वही completion lifecycle event उत्सर्जित करते हैं।
स्वीकृति-गेटेड execs लंबित
अनुरोध को उसके completion/denial संदेश (`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`) से सहसंबद्ध करने के लिए approval id का पुनः उपयोग करते हैं।

## निहितार्थ

- **`full`** शक्तिशाली है; संभव होने पर अनुमति-सूचियों को प्राथमिकता दें।
- **`ask`** तेज़ approvals की अनुमति देते हुए भी आपको प्रक्रिया में शामिल रखता है।
- प्रति-एजेंट अनुमति-सूचियाँ एक एजेंट की approvals को दूसरे एजेंटों तक पहुँचने से रोकती हैं।
- Approvals केवल **अधिकृत प्रेषकों** से आने वाले host exec अनुरोधों पर लागू होती हैं। अनधिकृत प्रेषक `/exec` जारी नहीं कर सकते।
- `/exec security=full` अधिकृत ऑपरेटरों के लिए सत्र-स्तरीय सुविधा है और डिज़ाइन के अनुसार approvals को छोड़ देता है। host exec को पूरी तरह अवरुद्ध करने के लिए, approvals security को `deny` पर सेट करें या tool policy के माध्यम से `exec` tool को अस्वीकार करें।

## संबंधित

<CardGroup cols={2}>
  <Card title="Exec अनुमोदन - उन्नत" href="/hi/tools/exec-approvals-advanced" icon="gear">
    सुरक्षित बिन, इंटरप्रेटर बाइंडिंग और चैट में अनुमोदन अग्रेषण।
  </Card>
  <Card title="Exec टूल" href="/hi/tools/exec" icon="terminal">
    शेल कमांड निष्पादन टूल।
  </Card>
  <Card title="एलिवेटेड मोड" href="/hi/tools/elevated" icon="shield-exclamation">
    आपातकालीन मार्ग, जो अनुमोदनों को भी छोड़ देता है।
  </Card>
  <Card title="सैंडबॉक्सिंग" href="/hi/gateway/sandboxing" icon="box">
    सैंडबॉक्स मोड और कार्यस्थान की पहुँच।
  </Card>
  <Card title="सुरक्षा" href="/hi/gateway/security" icon="lock">
    सुरक्षा मॉडल और सुदृढ़ीकरण।
  </Card>
  <Card title="सैंडबॉक्स बनाम टूल नीति बनाम एलिवेटेड" href="/hi/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    प्रत्येक नियंत्रण का उपयोग कब करें।
  </Card>
  <Card title="Skills" href="/hi/tools/skills" icon="sparkles">
    Skill-समर्थित स्वतः-अनुमति व्यवहार।
  </Card>
</CardGroup>
