---
read_when:
    - Skills प्रकाशित करना
    - प्रकाशन विफलताओं की डिबगिंग
summary: Skill फ़ोल्डर फ़ॉर्मैट, आवश्यक फ़ाइलें, अनुमत फ़ाइल प्रकार, सीमाएँ।
x-i18n:
    generated_at: "2026-06-30T22:14:43Z"
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

- `SKILL.md` (या `skill.md`; legacy `skills.md` भी स्वीकार किया जाता है)

वैकल्पिक:

- कोई भी सहायक _text-based_ फ़ाइलें (“अनुमत फ़ाइलें” देखें)
- `.clawhubignore` (प्रकाशन के लिए अनदेखा पैटर्न, legacy `.clawdhubignore`)
- `.gitignore` (इसे भी माना जाता है)

## GitHub आयात

वेब GitHub importer स्थानीय publish/sync से अधिक सख्त है। यह केवल
साइन-इन किए हुए GitHub खाते के स्वामित्व वाली सार्वजनिक, non-fork रिपॉज़िटरी में
`SKILL.md` या legacy `skills.md` फ़ाइलें खोजता है। यह निजी रिपो, forks,
archived/disabled रिपो, या third-party सार्वजनिक रिपो आयात नहीं करता।

स्थानीय install metadata (CLI द्वारा लिखा गया):

- `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

Workdir install state (CLI द्वारा लिखा गया):

- `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)

## `SKILL.md`

- वैकल्पिक YAML frontmatter के साथ Markdown।
- सर्वर publish के दौरान frontmatter से metadata निकालता है।
- `description` को UI/search में कौशल सारांश के रूप में इस्तेमाल किया जाता है।

## Frontmatter metadata

कौशल metadata आपके `SKILL.md` के शीर्ष पर YAML frontmatter में घोषित किया जाता है। यह registry (और security analysis) को बताता है कि आपके कौशल को चलने के लिए क्या चाहिए।

### मूल frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Runtime metadata (`metadata.openclaw`)

अपने कौशल की runtime आवश्यकताएँ `metadata.openclaw` के अंतर्गत घोषित करें (aliases: `metadata.clawdbot`, `metadata.clawdis`)।

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

कौशल चलने से पहले मौजूद होने वाली environment variables के लिए `requires.env` का उपयोग करें। जब आपको प्रति-variable metadata चाहिए, जिसमें `required: false` वाली वैकल्पिक variables भी शामिल हों, तो `envVars` का उपयोग करें।

### पूर्ण field reference

| Field              | Type       | Description                                                                                                                               |
| ------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | आपके कौशल द्वारा अपेक्षित आवश्यक environment variables।                                                                                  |
| `requires.bins`    | `string[]` | CLI binaries जिनका सभी का installed होना आवश्यक है।                                                                                      |
| `requires.anyBins` | `string[]` | CLI binaries जिनमें कम से कम एक मौजूद होना आवश्यक है।                                                                                    |
| `requires.config`  | `string[]` | Config file paths जिन्हें आपका कौशल पढ़ता है।                                                                                            |
| `primaryEnv`       | `string`   | आपके कौशल के लिए मुख्य credential env var।                                                                                               |
| `envVars`          | `array`    | `name`, वैकल्पिक `required`, और वैकल्पिक `description` के साथ environment variable घोषणाएँ। वैकल्पिक env vars के लिए `required: false` सेट करें। |
| `always`           | `boolean`  | यदि `true`, कौशल हमेशा active रहता है (स्पष्ट install आवश्यक नहीं)।                                                                      |
| `skillKey`         | `string`   | कौशल की invocation key override करें।                                                                                                     |
| `emoji`            | `string`   | कौशल के लिए display emoji।                                                                                                                |
| `homepage`         | `string`   | कौशल के homepage या docs का URL।                                                                                                          |
| `os`               | `string[]` | OS restrictions (जैसे `["macos"]`, `["linux"]`)।                                                                                          |
| `install`          | `array`    | dependencies के लिए install specs (नीचे देखें)।                                                                                           |
| `nix`              | `object`   | Nix plugin spec (README देखें)।                                                                                                           |
| `config`           | `object`   | Clawdbot config spec (README देखें)।                                                                                                      |

### Install specs

यदि आपके कौशल को dependencies installed चाहिए, तो उन्हें `install` array में घोषित करें:

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

वैकल्पिक environment variables को `metadata.openclaw.envVars` के अंतर्गत घोषित करें और `required: false` सेट करें। वैकल्पिक entries को `requires.env` में न जोड़ें, क्योंकि `requires.env` का मतलब है कि कौशल उनके बिना नहीं चल सकता।

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

### यह क्यों महत्वपूर्ण है

ClawHub का security analysis जाँचता है कि आपका कौशल जो घोषित करता है, वह वास्तव में किए जाने वाले काम से मेल खाता है। यदि आपका code `TODOIST_API_KEY` reference करता है लेकिन आपका frontmatter इसे `requires.env`, `primaryEnv`, या `envVars` के अंतर्गत घोषित नहीं करता, तो analysis metadata mismatch flag करेगा। घोषणाओं को सटीक रखने से आपका कौशल review pass कर पाता है और उपयोगकर्ताओं को यह समझने में मदद मिलती है कि वे क्या install कर रहे हैं।

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

Publish द्वारा केवल “text-based” फ़ाइलें स्वीकार की जाती हैं।

- Extension allowlist `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) में है।
- Upload के बाद भी script files scan की जाती हैं; PowerShell `.ps1`, `.psm1`, और `.psd1` फ़ाइलें text के रूप में स्वीकार की जाती हैं।
- `text/` से शुरू होने वाले content types को text माना जाता है; साथ ही एक छोटी allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG) भी है।

सीमाएँ (server-side):

- कुल bundle size: 50MB।
- Embedding text में `SKILL.md` + लगभग 40 तक non-`.md` फ़ाइलें शामिल होती हैं (best-effort cap)।

## Slugs

- डिफ़ॉल्ट रूप से folder name से व्युत्पन्न।
- Package scopes को ClawHub publisher handle से ठीक-ठीक मेल खाना चाहिए। Publisher handles lowercase letters, numbers, hyphens, dots, और underscores का उपयोग कर सकते हैं; उन्हें lowercase letter या number से शुरू और समाप्त होना चाहिए।
- Package slugs lowercase और npm-safe होने चाहिए, उदाहरण के लिए `@example.tools/demo-plugin` या `demo-plugin`।

## Versioning + tags

- प्रत्येक publish एक नया version (semver) बनाता है।
- Tags किसी version के लिए string pointers होते हैं; `latest` आमतौर पर इस्तेमाल होता है।

## License

- ClawHub पर प्रकाशित सभी skills `MIT-0` के अंतर्गत licensed हैं।
- कोई भी published skills का उपयोग, modification, और redistribution कर सकता है, including commercially।
- Attribution आवश्यक नहीं है।
- `SKILL.md` में conflicting license terms न जोड़ें; ClawHub per-skill license overrides support नहीं करता।

## Paid skills

- ClawHub paid skills, per-skill pricing, paywalls, या revenue sharing support नहीं करता।
- `SKILL.md` में pricing metadata न जोड़ें; यह skill format का हिस्सा नहीं है और published skill को paid नहीं बनाएगा।
- यदि आपका कौशल किसी paid third-party service के साथ integrate करता है, तो skill instructions और env declarations में external cost और required account को स्पष्ट रूप से document करें (`requires.env` required variables के लिए, या वैकल्पिक variables के लिए `required: false` के साथ `envVars`)।
