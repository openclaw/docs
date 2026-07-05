---
read_when:
    - Skills प्रकाशित करना
    - प्रकाशन विफलताओं की डीबगिंग
summary: Skill फ़ोल्डर प्रारूप, आवश्यक फ़ाइलें, अनुमत फ़ाइल प्रकार, सीमाएँ।
x-i18n:
    generated_at: "2026-07-05T05:05:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill प्रारूप

## डिस्क पर

Skill एक फ़ोल्डर है।

आवश्यक:

- `SKILL.md` (या `skill.md`; लेगेसी `skills.md` भी स्वीकार्य है)

वैकल्पिक:

- कोई भी सहायक _टेक्स्ट-आधारित_ फ़ाइलें (“अनुमत फ़ाइलें” देखें)
- `.clawhubignore` (प्रकाशन के लिए अनदेखा पैटर्न, लेगेसी `.clawdhubignore`)
- `.gitignore` (इसका भी सम्मान किया जाता है)

## GitHub आयात

वेब GitHub इम्पोर्टर स्थानीय publish/sync से अधिक सख्त है। यह केवल साइन-इन किए हुए GitHub खाते के स्वामित्व वाले सार्वजनिक, नॉन-फोर्क रिपॉज़िटरी में मौजूद
`SKILL.md` या लेगेसी `skills.md` फ़ाइलों को खोजता है। यह निजी रिपो, फोर्क,
आर्काइव/अक्षम रिपो, या तृतीय-पक्ष सार्वजनिक रिपो आयात नहीं करता।

स्थानीय इंस्टॉल मेटाडेटा (CLI द्वारा लिखा गया):

- `<skill>/.clawhub/origin.json` (लेगेसी `.clawdhub`)

Workdir इंस्टॉल स्थिति (CLI द्वारा लिखी गई):

- `<workdir>/.clawhub/lock.json` (लेगेसी `.clawdhub`)

## `SKILL.md`

- वैकल्पिक YAML frontmatter के साथ Markdown।
- सर्वर publish के दौरान frontmatter से मेटाडेटा निकालता है।
- `description` को UI/search में Skill सारांश के रूप में उपयोग किया जाता है।

## Frontmatter मेटाडेटा

Skill मेटाडेटा आपके `SKILL.md` के शीर्ष पर YAML frontmatter में घोषित किया जाता है। यह registry (और सुरक्षा विश्लेषण) को बताता है कि आपके Skill को चलने के लिए क्या चाहिए।

### बुनियादी frontmatter

```yaml
---
name: my-skill
description: यह Skill क्या करता है इसका संक्षिप्त सारांश।
version: 1.0.0
---
```

### Runtime मेटाडेटा (`metadata.openclaw`)

अपने Skill की runtime आवश्यकताएँ `metadata.openclaw` के अंतर्गत घोषित करें (उपनाम: `metadata.clawdbot`, `metadata.clawdis`)।

```yaml
---
name: my-skill
description: Todoist API के ज़रिए कार्य प्रबंधित करें।
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

उन environment variables के लिए `requires.env` का उपयोग करें जो Skill चलने से पहले मौजूद होने चाहिए। जब आपको प्रति-variable मेटाडेटा चाहिए, जिसमें `required: false` वाले वैकल्पिक variables शामिल हैं, तो `envVars` का उपयोग करें।

### पूर्ण फ़ील्ड संदर्भ

| फ़ील्ड              | प्रकार       | विवरण                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | आपके Skill द्वारा अपेक्षित आवश्यक environment variables।                                                                                           |
| `requires.bins`    | `string[]` | CLI binaries जिनका सभी का इंस्टॉल होना आवश्यक है।                                                                                                     |
| `requires.anyBins` | `string[]` | CLI binaries जिनमें से कम से कम एक मौजूद होना आवश्यक है।                                                                                                  |
| `requires.config`  | `string[]` | Config फ़ाइल पाथ जिन्हें आपका Skill पढ़ता है।                                                                                                          |
| `primaryEnv`       | `string`   | आपके Skill के लिए मुख्य credential env var।                                                                                                  |
| `envVars`          | `array`    | `name`, वैकल्पिक `required`, और वैकल्पिक `description` के साथ environment variable घोषणाएँ। वैकल्पिक env vars के लिए `required: false` सेट करें। |
| `always`           | `boolean`  | यदि `true`, Skill हमेशा सक्रिय रहता है (स्पष्ट install की आवश्यकता नहीं)।                                                                              |
| `skillKey`         | `string`   | Skill की invocation key को override करें।                                                                                                         |
| `emoji`            | `string`   | Skill के लिए display emoji।                                                                                                                 |
| `homepage`         | `string`   | Skill के homepage या docs का URL।                                                                                                         |
| `os`               | `string[]` | OS restrictions (जैसे `["macos"]`, `["linux"]`)।                                                                                             |
| `install`          | `array`    | dependencies के लिए install specs (नीचे देखें)।                                                                                                  |
| `nix`              | `object`   | Nix plugin spec (README देखें)।                                                                                                                |
| `config`           | `object`   | Clawdbot config spec (README देखें)।                                                                                                           |

### Install specs

यदि आपके Skill को dependencies इंस्टॉल करने की आवश्यकता है, तो उन्हें `install` array में घोषित करें:

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

समर्थित install kinds: `brew`, `node`, `go`, `uv`।

### वैकल्पिक environment variables

वैकल्पिक environment variables को `metadata.openclaw.envVars` के अंतर्गत घोषित करें और `required: false` सेट करें। वैकल्पिक entries को `requires.env` में न जोड़ें, क्योंकि `requires.env` का अर्थ है कि Skill उनके बिना नहीं चल सकता।

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: प्रमाणित requests के लिए उपयोग किया जाने वाला Todoist API token।
      - name: TODOIST_PROJECT_ID
        required: false
        description: जब उपयोगकर्ता कोई project ID निर्दिष्ट नहीं करता, तब वैकल्पिक default project ID।
```

### यह क्यों महत्वपूर्ण है

ClawHub का सुरक्षा विश्लेषण जाँचता है कि आपका Skill जो घोषित करता है वह वास्तव में किए जाने वाले काम से मेल खाता है। यदि आपका code `TODOIST_API_KEY` का संदर्भ देता है लेकिन आपका frontmatter इसे `requires.env`, `primaryEnv`, या `envVars` के अंतर्गत घोषित नहीं करता, तो विश्लेषण मेटाडेटा mismatch को flag करेगा। घोषणाओं को सटीक रखने से आपका Skill review पास करने में मदद मिलती है और उपयोगकर्ताओं को यह समझने में मदद मिलती है कि वे क्या install कर रहे हैं।

### उदाहरण: पूर्ण frontmatter

```yaml
---
name: todoist-cli
description: command line से Todoist tasks, projects, और labels प्रबंधित करें।
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token।
      - name: TODOIST_PROJECT_ID
        required: false
        description: वैकल्पिक default project ID।
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## अनुमत फ़ाइलें

publish द्वारा केवल “टेक्स्ट-आधारित” फ़ाइलें स्वीकार की जाती हैं।

- Extension allowlist `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) में है।
- Script फ़ाइलें upload के बाद भी scan की जाती हैं; PowerShell `.ps1`, `.psm1`, और `.psd1` फ़ाइलें text के रूप में स्वीकार की जाती हैं।
- `text/` से शुरू होने वाले content types को text माना जाता है; साथ में एक छोटी allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG) भी है।

सीमाएँ (server-side):

- कुल bundle size: 50MB।
- Embedding text में `SKILL.md` + लगभग 40 तक non-`.md` फ़ाइलें शामिल हैं (best-effort cap)।

## Slugs

- डिफ़ॉल्ट रूप से फ़ोल्डर नाम से derive किए जाते हैं।
- Package scopes को ClawHub publisher handle से बिल्कुल मेल खाना चाहिए। Publisher handles lowercase letters, numbers, hyphens, dots, और underscores का उपयोग कर सकते हैं; उन्हें lowercase letter या number से शुरू और समाप्त होना चाहिए।
- Package slugs lowercase और npm-safe होने चाहिए, उदाहरण के लिए `@example.tools/demo-plugin` या `demo-plugin`।

## Versioning + tags

- हर publish एक नया version (semver) बनाता है।
- Tags किसी version के लिए string pointers हैं; `latest` आमतौर पर उपयोग किया जाता है।

## License

- ClawHub पर प्रकाशित सभी Skills `MIT-0` के अंतर्गत licensed हैं।
- कोई भी प्रकाशित Skills का उपयोग, संशोधन, और पुनर्वितरण कर सकता है, जिसमें वाणिज्यिक उपयोग भी शामिल है।
- Attribution आवश्यक नहीं है।
- `SKILL.md` में conflicting license terms न जोड़ें; ClawHub प्रति-Skill license overrides का समर्थन नहीं करता।

## Paid skills

- ClawHub paid skills, प्रति-Skill pricing, paywalls, या revenue sharing का समर्थन नहीं करता।
- `SKILL.md` में pricing metadata न जोड़ें; यह Skill format का हिस्सा नहीं है और प्रकाशित Skill को paid नहीं बनाएगा।
- यदि आपका Skill किसी paid third-party service से integrate करता है, तो बाहरी cost और आवश्यक account को Skill instructions और env declarations में स्पष्ट रूप से document करें (`requires.env` आवश्यक variables के लिए, या वैकल्पिक variables के लिए `required: false` के साथ `envVars`)।
