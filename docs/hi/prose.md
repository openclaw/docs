---
read_when:
    - आप .prose वर्कफ़्लो फ़ाइलें चलाना या लिखना चाहते हैं
    - आप OpenProse Plugin को सक्षम करना चाहते हैं
    - आपको यह समझना होगा कि OpenProse, OpenClaw के मूल घटकों से कैसे मैप होता है
sidebarTitle: OpenProse
summary: OpenProse मल्टी-एजेंट AI सत्रों के लिए मार्कडाउन-प्रथम वर्कफ़्लो प्रारूप है। OpenClaw में यह `/prose` स्लैश कमांड और स्किल पैक वाले Plugin के रूप में उपलब्ध होता है।
title: OpenProse
x-i18n:
    generated_at: "2026-07-16T16:48:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse, AI सत्रों के समन्वयन के लिए एक पोर्टेबल, Markdown-प्रथम वर्कफ़्लो प्रारूप है। OpenClaw में यह ऐसे Plugin के रूप में उपलब्ध होता है जो OpenProse Skills
पैक और एक `/prose` स्लैश कमांड इंस्टॉल करता है। प्रोग्राम `.prose` फ़ाइलों में रहते हैं और
स्पष्ट नियंत्रण प्रवाह के साथ कई उप-एजेंट शुरू कर सकते हैं।

<CardGroup cols={3}>
  <Card title="इंस्टॉल करें" icon="download" href="#install">
    OpenProse Plugin सक्षम करें और Gateway पुनः आरंभ करें।
  </Card>
  <Card title="प्रोग्राम चलाएँ" icon="play" href="#slash-command">
    किसी `.prose` फ़ाइल या रिमोट प्रोग्राम को निष्पादित करने के लिए `/prose run` का उपयोग करें।
  </Card>
  <Card title="प्रोग्राम लिखें" icon="pencil" href="#example-parallel-research-and-synthesis">
    समानांतर और क्रमिक चरणों वाले बहु-एजेंट वर्कफ़्लो बनाएँ।
  </Card>
</CardGroup>

## इंस्टॉल करें

<Steps>
  <Step title="Plugin सक्षम करें">
    OpenProse बंडल में शामिल है, लेकिन डिफ़ॉल्ट रूप से अक्षम रहता है। इसे सक्षम करें:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Gateway पुनः आरंभ करें">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="सत्यापित करें">
    ```bash
    openclaw plugins list | grep prose
    ```

    आपको `open-prose` सक्षम दिखाई देना चाहिए। अब `/prose` skill कमांड
    चैट में उपलब्ध है।

  </Step>
</Steps>

रेपो चेकआउट से आप Plugin को सीधे इंस्टॉल कर सकते हैं:
`openclaw plugins install ./extensions/open-prose`

## स्लैश कमांड

OpenProse, `/prose` को उपयोगकर्ता द्वारा चलाए जा सकने वाले skill कमांड के रूप में पंजीकृत करता है:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>`, `https://p.prose.md/<handle>/<slug>` में रिज़ॉल्व होता है।
प्रत्यक्ष URL को `web_fetch` टूल का उपयोग करके ज्यों का त्यों फ़ेच किया जाता है।

शीर्ष-स्तरीय रिमोट रन स्पष्ट होते हैं। किसी `.prose` प्रोग्राम के भीतर रिमोट इंपोर्ट
ट्रांज़िटिव कोड निर्भरताएँ हैं: OpenProse द्वारा किसी भी रिमोट `use` लक्ष्य को फ़ेच करने से पहले,
यह रिज़ॉल्व की गई इंपोर्ट सूची दिखाता है और उस रन के लिए ऑपरेटर से ठीक
`approve remote prose imports` उत्तर देने की अपेक्षा करता है।

## यह क्या कर सकता है

- स्पष्ट समानांतरता के साथ बहु-एजेंट शोध और संश्लेषण।
- दोहराए जा सकने वाले, अनुमोदन-सुरक्षित वर्कफ़्लो (कोड समीक्षा, घटना ट्रायेज, सामग्री पाइपलाइन)।
- पुनः उपयोग योग्य `.prose` प्रोग्राम, जिन्हें आप समर्थित एजेंट रनटाइम में चला सकते हैं।

## उदाहरण: समानांतर शोध और संश्लेषण

```prose
# समानांतर रूप से चल रहे दो एजेंट के साथ शोध + संश्लेषण।

input topic: "हमें किस विषय पर शोध करना चाहिए?"

agent researcher:
  model: sonnet
  prompt: "आप गहन शोध करते हैं और स्रोत उद्धृत करते हैं।"

agent writer:
  model: opus
  prompt: "आप एक संक्षिप्त सारांश लिखते हैं।"

parallel:
  findings = session: researcher
    prompt: "{topic} पर शोध करें।"
  draft = session: writer
    prompt: "{topic} का सारांश दें।"

session "निष्कर्षों + मसौदे को मिलाकर अंतिम उत्तर तैयार करें।"
  context: { findings, draft }
```

## OpenClaw रनटाइम मैपिंग

OpenProse प्रोग्राम, OpenClaw के मूल घटकों पर मैप होते हैं:

| OpenProse अवधारणा         | OpenClaw टूल                                   |
| ------------------------- | ----------------------------------------------- |
| सत्र शुरू करना / Task टूल | `sessions_spawn`                                |
| फ़ाइल पढ़ना / लिखना         | `read` / `write`                                |
| वेब फ़ेच                 | `web_fetch` (POST आवश्यक होने पर `exec` + curl) |

<Warning>
  यदि आपकी टूल अनुमति-सूची `sessions_spawn`, `read`, `write`, या
  `web_fetch` को अवरुद्ध करती है, तो OpenProse प्रोग्राम विफल हो जाएँगे। अपना
  [टूल अनुमति-सूची कॉन्फ़िगरेशन](/hi/gateway/config-tools) जाँचें।
</Warning>

## फ़ाइल स्थान

OpenProse आपके कार्यस्थान में `.prose/` के अंतर्गत स्थिति रखता है:

```text
.prose/
├── .env                      # कॉन्फ़िगरेशन (key=value), उदाहरण: OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # चल रहे प्रोग्राम की प्रति
│       ├── state.md          # निष्पादन स्थिति
│       ├── bindings/
│       ├── imports/          # नेस्टेड रिमोट प्रोग्राम रन
│       └── agents/
└── agents/                   # प्रोजेक्ट-स्कोप वाले स्थायी एजेंट
```

उपयोगकर्ता-स्तरीय स्थायी एजेंट (प्रोजेक्टों में साझा) यहाँ रहते हैं:

```text
~/.prose/agents/
```

## स्थिति बैकएंड

<AccordionGroup>
  <Accordion title="फ़ाइल सिस्टम (डिफ़ॉल्ट)">
    स्थिति को कार्यस्थान में `.prose/runs/...` पर लिखा जाता है। किसी अतिरिक्त
    निर्भरता की आवश्यकता नहीं है।
  </Accordion>
  <Accordion title="इन-कॉन्टेक्स्ट">
    अस्थायी स्थिति कॉन्टेक्स्ट विंडो में रखी जाती है; `--in-context` से चुनें।
    छोटे, अल्पकालिक प्रोग्रामों के लिए उपयुक्त।
  </Accordion>
  <Accordion title="sqlite (प्रायोगिक)">
    `--state=sqlite` से चुनें। `PATH` पर `sqlite3` बाइनरी आवश्यक है
    (न मिलने पर फ़ाइल सिस्टम पर फ़ॉलबैक होता है); स्थिति
    `.prose/runs/{id}/state.db` में रखी जाती है।
  </Accordion>
  <Accordion title="postgres (प्रायोगिक)">
    `--state=postgres` से चुनें। इसके लिए `psql` और
    `OPENPROSE_POSTGRES_URL` में कनेक्शन स्ट्रिंग आवश्यक है (इसे `.prose/.env` में सेट करें)।

    <Warning>
      Postgres क्रेडेंशियल उप-एजेंट लॉग में पहुँचते हैं। एक समर्पित,
      न्यूनतम विशेषाधिकार वाला डेटाबेस उपयोग करें।
    </Warning>

  </Accordion>
</AccordionGroup>

## सुरक्षा

`.prose` फ़ाइलों को कोड की तरह मानें। चलाने से पहले उनकी समीक्षा करें, जिसमें रिमोट
`use` इंपोर्ट भी शामिल हैं। शीर्ष-स्तरीय `/prose run https://...` अनुरोध स्पष्ट होते हैं, लेकिन
ट्रांज़िटिव रिमोट इंपोर्ट को फ़ेच या निष्पादित करने से पहले हर रन के लिए अनुमोदन आवश्यक है।
दुष्प्रभावों को नियंत्रित करने के लिए OpenClaw टूल अनुमति-सूचियों और अनुमोदन गेट का उपयोग करें।
नियतात्मक, अनुमोदन-गेट वाले वर्कफ़्लो के लिए [Lobster](/hi/tools/lobster) से तुलना करें।

## संबंधित

<CardGroup cols={2}>
  <Card title="Skills संदर्भ" href="/hi/tools/skills" icon="puzzle-piece">
    OpenProse का skill पैक कैसे लोड होता है और कौन-से गेट लागू होते हैं।
  </Card>
  <Card title="उप-एजेंट" href="/hi/tools/subagents" icon="users">
    OpenClaw की मूल बहु-एजेंट समन्वय परत।
  </Card>
  <Card title="टेक्स्ट-टू-स्पीच" href="/hi/tools/tts" icon="volume-high">
    अपने वर्कफ़्लो में ऑडियो आउटपुट जोड़ें।
  </Card>
  <Card title="स्लैश कमांड" href="/hi/tools/slash-commands" icon="terminal">
    /prose सहित सभी उपलब्ध चैट कमांड।
  </Card>
</CardGroup>

आधिकारिक साइट: [https://www.prose.md](https://www.prose.md)
