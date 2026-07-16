---
read_when:
    - आप एक नया कस्टम स्किल बना रहे हैं
    - आपको SKILL.md-आधारित Skills के लिए एक त्वरित आरंभिक कार्यप्रवाह चाहिए
    - आप एजेंट समीक्षा के लिए किसी स्किल का प्रस्ताव देने हेतु स्किल वर्कशॉप का उपयोग करना चाहते हैं
sidebarTitle: Creating skills
summary: अपने OpenClaw एजेंटों के लिए कस्टम SKILL.md वर्कस्पेस Skills बनाएँ, उनका परीक्षण करें और उन्हें प्रकाशित करें।
title: Skills बनाना
x-i18n:
    generated_at: "2026-07-16T17:42:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills एजेंट को सिखाते हैं कि टूल्स का उपयोग कैसे और कब करना है। प्रत्येक skill एक डायरेक्टरी होती है
जिसमें YAML frontmatter और markdown निर्देशों वाली एक `SKILL.md` फ़ाइल होती है।
OpenClaw निर्धारित [वरीयता क्रम](/hi/tools/skills#loading-order) में कई रूट से skills लोड करता है।

## अपनी पहली skill बनाएँ

<Steps>
  <Step title="skill डायरेक्टरी बनाएँ">
    Skills आपके workspace के `skills/` फ़ोल्डर में रहती हैं:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    व्यवस्था के लिए आप skills को सबफ़ोल्डर में समूहित कर सकते हैं — skill का नाम फिर भी
    `SKILL.md` frontmatter से तय होता है, फ़ोल्डर पथ से नहीं:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill का नाम अब भी "hello-world" है, इसे /hello-world के रूप में चलाया जाता है
    ```

  </Step>

  <Step title="SKILL.md लिखें">
    frontmatter मेटाडेटा परिभाषित करता है; body एजेंट को निर्देश देता है।

    ```markdown
    ---
    name: hello-world
    description: अभिवादन प्रिंट करने वाली एक सरल skill।
    ---

    # नमस्ते दुनिया

    जब उपयोगकर्ता अभिवादन माँगे, तो यह चलाने के लिए `exec` टूल का उपयोग करें:

    ```bash
    echo "आपकी कस्टम skill की ओर से नमस्ते!"
    ```
    ```

    नामकरण नियम:
    - `name` के लिए छोटे अक्षरों, अंकों और हाइफ़न का उपयोग करें।
    - डायरेक्टरी के नाम और frontmatter के `name` को एक जैसा रखें।
    - `description` एजेंट और स्लैश-कमांड खोज में दिखाई देता है —
      इसे एक पंक्ति में और 160 वर्णों से कम रखें।

  </Step>

  <Step title="सत्यापित करें कि skill लोड हुई है">
    ```bash
    openclaw skills list
    ```

    डिफ़ॉल्ट रूप से OpenClaw skills रूट के अंतर्गत `SKILL.md` फ़ाइलों पर नज़र रखता है। यदि
    वॉचर अक्षम है या आप किसी मौजूदा सत्र को जारी रख रहे हैं, तो नया सत्र
    शुरू करें ताकि एजेंट को ताज़ा सूची मिल सके:

    ```bash
    # चैट से — वर्तमान सत्र को संग्रहित करें और नया सत्र शुरू करें
    /new

    # या Gateway को पुनः आरंभ करें
    openclaw gateway restart
    ```

  </Step>

  <Step title="इसका परीक्षण करें">
    ```bash
    openclaw agent --message "मुझे अभिवादन दें"
    ```

    या कोई चैट खोलकर सीधे एजेंट से पूछें। इसे नाम द्वारा स्पष्ट रूप से
    चलाने के लिए `/skill hello-world` का उपयोग करें।

  </Step>
</Steps>

## SKILL.md संदर्भ

### आवश्यक फ़ील्ड

| फ़ील्ड         | विवरण                                                     |
| ------------- | --------------------------------------------------------------- |
| `name`        | छोटे अक्षरों, अंकों और हाइफ़न का उपयोग करने वाला अद्वितीय स्लग        |
| `description` | एजेंट और खोज आउटपुट में दिखाई देने वाला एक-पंक्ति विवरण |

### वैकल्पिक frontmatter कुंजियाँ

| फ़ील्ड                      | डिफ़ॉल्ट | विवरण                                                                      |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | skill को उपयोगकर्ता स्लैश कमांड के रूप में उपलब्ध कराएँ                                         |
| `disable-model-invocation` | `false` | skill को एजेंट के सिस्टम प्रॉम्प्ट से बाहर रखें (यह फिर भी `/skill` के माध्यम से चलती है)        |
| `command-dispatch`         | —       | मॉडल को बायपास करके स्लैश कमांड को सीधे किसी टूल पर भेजने के लिए `tool` पर सेट करें |
| `command-tool`             | —       | `command-dispatch: tool` सेट होने पर चलाए जाने वाले टूल का नाम                         |
| `command-arg-mode`         | `raw`   | टूल डिस्पैच के लिए, अपरिवर्तित आर्ग्युमेंट स्ट्रिंग टूल को अग्रेषित करता है                      |
| `homepage`                 | —       | macOS Skills UI में "Website" के रूप में दिखाई देने वाला URL                                    |

गेटिंग फ़ील्ड (`requires.bins`, `requires.env`, आदि) के लिए
[Skills — गेटिंग](/hi/tools/skills#gating) देखें।

### `{baseDir}` का उपयोग करना

पथ हार्डकोड किए बिना skill डायरेक्टरी के भीतर की फ़ाइलों का संदर्भ दें —
एजेंट `{baseDir}` को skill की अपनी डायरेक्टरी के सापेक्ष हल करता है:

```markdown
`{baseDir}/scripts/run.sh` पर मौजूद सहायक स्क्रिप्ट चलाएँ।
```

## सशर्त सक्रियण जोड़ना

अपनी skill को गेट करें ताकि वह केवल तभी लोड हो, जब उसकी निर्भरताएँ उपलब्ध हों:

```markdown
---
name: gemini-search
description: Gemini CLI का उपयोग करके खोजें।
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="गेटिंग विकल्प">
    | कुंजी | विवरण |
    | --- | --- |
    | `requires.bins` | सभी बाइनरी `PATH` पर मौजूद होनी चाहिए |
    | `requires.anyBins` | कम-से-कम एक बाइनरी `PATH` पर मौजूद होनी चाहिए |
    | `requires.env` | प्रत्येक env var प्रोसेस या कॉन्फ़िगरेशन में मौजूद होना चाहिए |
    | `requires.config` | प्रत्येक `openclaw.json` पथ का मान truthy होना चाहिए |
    | `os` | प्लेटफ़ॉर्म फ़िल्टर: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | सभी गेट छोड़कर skill को हमेशा शामिल करने के लिए `true` सेट करें |

    पूर्ण संदर्भ: [Skills — गेटिंग](/hi/tools/skills#gating)।

  </Accordion>
  <Accordion title="परिवेश और API कुंजियाँ">
    किसी API कुंजी को `openclaw.json` में skill प्रविष्टि से जोड़ें:

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    कुंजी केवल उस एजेंट टर्न के लिए होस्ट प्रोसेस में इंजेक्ट की जाती है।
    यह सैंडबॉक्स तक नहीं पहुँचती — देखें
    [सैंडबॉक्स किए गए env vars](/hi/tools/skills-config#sandboxed-skills-and-env-vars)।

  </Accordion>
</AccordionGroup>

## Skill Workshop के माध्यम से प्रस्तावित करें

एजेंट द्वारा तैयार की गई skills के लिए, या जब आप किसी skill को
लाइव करने से पहले ऑपरेटर की समीक्षा चाहते हों, तो सीधे `SKILL.md` लिखने के बजाय
[Skill Workshop](/hi/tools/skill-workshop) प्रस्तावों का उपयोग करें।

```bash
# एक बिल्कुल नई skill प्रस्तावित करें
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "अभिवादन प्रिंट करने वाली एक सरल skill।" \
  --proposal ./PROPOSAL.md

# किसी मौजूदा skill के लिए अपडेट प्रस्तावित करें
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "अपडेट की गई अभिवादन skill"
```

जब प्रस्ताव में सहायक फ़ाइलें शामिल हों, तो `--proposal-dir` का उपयोग करें:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "अभिवादन प्रिंट करने वाली एक सरल skill।" \
  --proposal-dir ./hello-world-proposal/
```

डायरेक्टरी के रूट में `PROPOSAL.md` होना आवश्यक है। सहायक फ़ाइलें
`assets/`, `examples/`, `references/`, `scripts/`, या `templates/` के अंतर्गत रखें।

समीक्षा के बाद:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

प्रस्ताव के पूरे जीवनचक्र के लिए [Skill Workshop](/hi/tools/skill-workshop) देखें।

## ClawHub पर प्रकाशित करना

<Steps>
  <Step title="सुनिश्चित करें कि आपकी SKILL.md पूरी है">
    सुनिश्चित करें कि `name`, `description`, और सभी `metadata.openclaw` गेटिंग फ़ील्ड
    सेट हैं। यदि आपके पास कोई प्रोजेक्ट पृष्ठ है, तो `homepage` URL जोड़ें।
  </Step>
  <Step title="स्टैंडअलोन ClawHub CLI इंस्टॉल करें और लॉग इन करें">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="प्रकाशित करें">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    अनुमानित संस्करण को ओवरराइड करने या किसी विशिष्ट स्वामी के अंतर्गत प्रकाशित करने के लिए
    `--version <version>` या `--owner <owner>` जोड़ें। पूरे प्रवाह, स्वामी स्कोपिंग और अन्य
    रखरखाव कमांड (`clawhub sync`, `clawhub skill rename`, ...) के लिए
    [ClawHub — प्रकाशन](/hi/clawhub/publishing) और
    [ClawHub CLI](/hi/clawhub/cli) देखें।

  </Step>
</Steps>

## सर्वोत्तम अभ्यास

<Tip>
  - **संक्षिप्त रहें** — मॉडल को निर्देश दें कि *क्या* करना है, न कि AI कैसे बनना है।
  - **सुरक्षा पहले** — यदि आपकी skill `exec` का उपयोग करती है, तो सुनिश्चित करें कि प्रॉम्प्ट
    अविश्वसनीय इनपुट से मनमाना कमांड इंजेक्शन करने की अनुमति न दें।
  - **स्थानीय रूप से परीक्षण करें** — साझा करने से पहले `openclaw agent --message "..."` का उपयोग करें।
  - **ClawHub का उपयोग करें** — शुरुआत से बनाने से पहले [clawhub.ai](https://clawhub.ai) पर
    समुदाय की skills ब्राउज़ करें।
</Tip>

## संबंधित

<CardGroup cols={2}>
  <Card title="Skills संदर्भ" href="/hi/tools/skills" icon="puzzle-piece">
    लोडिंग क्रम, गेटिंग, अनुमतिसूचियाँ और SKILL.md प्रारूप।
  </Card>
  <Card title="Skill Workshop" href="/hi/tools/skill-workshop" icon="flask">
    एजेंट द्वारा तैयार की गई skills के लिए प्रस्ताव कतार।
  </Card>
  <Card title="Skills कॉन्फ़िगरेशन" href="/hi/tools/skills-config" icon="gear">
    संपूर्ण `skills.*` कॉन्फ़िगरेशन स्कीमा।
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    सार्वजनिक रजिस्ट्री पर skills ब्राउज़ और प्रकाशित करें।
  </Card>
  <Card title="plugins बनाना" href="/hi/plugins/building-plugins" icon="plug">
    Plugins अपने द्वारा प्रलेखित टूल्स के साथ skills वितरित कर सकते हैं।
  </Card>
</CardGroup>
