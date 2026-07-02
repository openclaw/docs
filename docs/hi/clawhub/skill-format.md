---
read_when:
    - Skills प्रकाशित करना
    - प्रकाशन विफलताओं की डीबगिंग
summary: Skill फ़ोल्डर प्रारूप, आवश्यक फ़ाइलें, अनुमत फ़ाइल प्रकार, सीमाएँ।
x-i18n:
    generated_at: "2026-07-02T17:38:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# कौशल प्रारूप

## डिस्क पर

कौशल एक फ़ोल्डर होता है।

आवश्यक:

- `SKILL.md` (या `skill.md`; लेगेसी `skills.md` भी स्वीकार किया जाता है)

वैकल्पिक:

- कोई भी सहायक _टेक्स्ट-आधारित_ फ़ाइलें (“अनुमत फ़ाइलें” देखें)
- `.clawhubignore` (प्रकाशन के लिए अनदेखा पैटर्न, लेगेसी `.clawdhubignore`)
- `.gitignore` (इसका भी पालन किया जाता है)

## GitHub आयात

वेब GitHub आयातक स्थानीय publish/sync से अधिक सख्त है। यह केवल साइन-इन किए हुए GitHub खाते के स्वामित्व वाली सार्वजनिक, नॉन-फोर्क रिपॉज़िटरी में मौजूद
`SKILL.md` या लेगेसी `skills.md` फ़ाइलें खोजता है। यह निजी रिपॉज़, फोर्क,
आर्काइव/अक्षम रिपॉज़, या तृतीय-पक्ष सार्वजनिक रिपॉज़ आयात नहीं करता।

स्थानीय इंस्टॉल मेटाडेटा (CLI द्वारा लिखा गया):

- `<skill>/.clawhub/origin.json` (लेगेसी `.clawdhub`)

Workdir इंस्टॉल स्थिति (CLI द्वारा लिखी गई):

- `<workdir>/.clawhub/lock.json` (लेगेसी `.clawdhub`)

## `SKILL.md`

- वैकल्पिक YAML frontmatter वाला Markdown।
- सर्वर publish के दौरान frontmatter से मेटाडेटा निकालता है।
- `description` UI/search में कौशल सारांश के रूप में उपयोग होता है।

## Frontmatter मेटाडेटा

कौशल मेटाडेटा आपके `SKILL.md` के शीर्ष पर YAML frontmatter में घोषित किया जाता है। यह registry (और सुरक्षा विश्लेषण) को बताता है कि आपके कौशल को चलने के लिए क्या चाहिए।

### बुनियादी frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Runtime मेटाडेटा (`metadata.openclaw`)

अपने कौशल की runtime आवश्यकताएँ `metadata.openclaw` के अंतर्गत घोषित करें (उपनाम: `metadata.clawdbot`, `metadata.clawdis`)।

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
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

कौशल चलने से पहले मौजूद होना आवश्यक environment variables के लिए `requires.env` का उपयोग करें। जब आपको प्रति-variable मेटाडेटा चाहिए, जिसमें `required: false` वाले वैकल्पिक variables शामिल हैं, तो `envVars` का उपयोग करें।

### पूरा field संदर्भ

| Field              | Type       | Description                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | आपके कौशल द्वारा अपेक्षित आवश्यक environment variables।                                                                                           |
| `requires.bins`    | `string[]` | CLI binaries जो सभी install होने चाहिए।                                                                                                     |
| `requires.anyBins` | `string[]` | CLI binaries जिनमें से कम से कम एक मौजूद होना चाहिए।                                                                                                  |
| `requires.config`  | `string[]` | Config फ़ाइल paths जिन्हें आपका कौशल पढ़ता है।                                                                                                          |
| `primaryEnv`       | `string`   | आपके कौशल के लिए मुख्य credential env var।                                                                                                  |
| `envVars`          | `array`    | `name`, वैकल्पिक `required`, और वैकल्पिक `description` के साथ environment variable घोषणाएँ। वैकल्पिक env vars के लिए `required: false` सेट करें। |
| `always`           | `boolean`  | यदि `true`, कौशल हमेशा सक्रिय रहता है (स्पष्ट install आवश्यक नहीं)।                                                                              |
| `skillKey`         | `string`   | कौशल की invocation key override करें।                                                                                                         |
| `emoji`            | `string`   | कौशल के लिए display emoji।                                                                                                                 |
| `homepage`         | `string`   | कौशल के homepage या docs का URL।                                                                                                         |
| `os`               | `string[]` | OS प्रतिबंध (जैसे `["macos"]`, `["linux"]`)।                                                                                             |
| `install`          | `array`    | Dependencies के लिए install specs (नीचे देखें)।                                                                                                  |
| `nix`              | `object`   | Nix Plugin spec (README देखें)।                                                                                                                |
| `config`           | `object`   | Clawdbot config spec (README देखें)।                                                                                                           |

### Install specs

यदि आपके कौशल को dependencies install करने की आवश्यकता है, तो उन्हें `install` array में घोषित करें:

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

वैकल्पिक environment variables को `metadata.openclaw.envVars` के अंतर्गत घोषित करें और `required: false` सेट करें। वैकल्पिक entries को `requires.env` में न जोड़ें, क्योंकि `requires.env` का अर्थ है कि कौशल उनके बिना चल नहीं सकता।

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### यह क्यों मायने रखता है

ClawHub का सुरक्षा विश्लेषण जाँचता है कि आपका कौशल जो घोषित करता है वह उसके वास्तविक व्यवहार से मेल खाता है। यदि आपका code `TODOIST_API_KEY` को reference करता है लेकिन आपका frontmatter उसे `requires.env`, `primaryEnv`, या `envVars` के अंतर्गत घोषित नहीं करता, तो विश्लेषण मेटाडेटा mismatch flag करेगा। घोषणाओं को सटीक रखना आपके कौशल को review पास करने में मदद करता है और users को यह समझने में मदद करता है कि वे क्या install कर रहे हैं।

### उदाहरण: पूरा frontmatter

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
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
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
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

- डिफ़ॉल्ट रूप से folder name से derive किए जाते हैं।
- Package scopes को ClawHub publisher handle से ठीक-ठीक match करना चाहिए। Publisher handles lowercase letters, numbers, hyphens, dots, और underscores का उपयोग कर सकते हैं; उन्हें lowercase letter या number से शुरू और समाप्त होना चाहिए।
- Package slugs lowercase और npm-safe होने चाहिए, उदाहरण के लिए `@example.tools/demo-plugin` या `demo-plugin`।

## Versioning + tags

- प्रत्येक publish एक नया version (semver) बनाता है।
- Tags किसी version के string pointers हैं; `latest` सामान्य रूप से उपयोग होता है।

## License

- ClawHub पर प्रकाशित सभी skills `MIT-0` के अंतर्गत licensed हैं।
- कोई भी प्रकाशित skills का उपयोग, संशोधन, और पुनर्वितरण कर सकता है, व्यावसायिक रूप से भी।
- Attribution आवश्यक नहीं है।
- `SKILL.md` में विरोधाभासी license terms न जोड़ें; ClawHub प्रति-कौशल license overrides का समर्थन नहीं करता।

## Paid skills

- ClawHub paid skills, प्रति-कौशल pricing, paywalls, या revenue sharing का समर्थन नहीं करता।
- `SKILL.md` में pricing metadata न जोड़ें; यह skill format का हिस्सा नहीं है और प्रकाशित कौशल को paid नहीं बनाएगा।
- यदि आपका कौशल किसी paid third-party service के साथ integrate करता है, तो बाहरी लागत और आवश्यक account को कौशल instructions और env declarations में स्पष्ट रूप से document करें (आवश्यक variables के लिए `requires.env`, या वैकल्पिक variables के लिए `required: false` वाला `envVars`)।
