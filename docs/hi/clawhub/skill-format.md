---
read_when:
    - Skills प्रकाशित करना
    - प्रकाशन विफलताओं की डीबगिंग
summary: Skill फ़ोल्डर का फ़ॉर्मैट, आवश्यक फ़ाइलें, अनुमत फ़ाइल प्रकार, सीमाएँ.
x-i18n:
    generated_at: "2026-07-02T08:17:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# स्किल फ़ॉर्मैट

## डिस्क पर

स्किल एक फ़ोल्डर है।

आवश्यक:

- `SKILL.md` (या `skill.md`; पुराना `skills.md` भी स्वीकार्य है)

वैकल्पिक:

- कोई भी सहायक _टेक्स्ट-आधारित_ फ़ाइलें (“अनुमत फ़ाइलें” देखें)
- `.clawhubignore` (प्रकाशन के लिए ignore पैटर्न, पुराना `.clawdhubignore`)
- `.gitignore` (इसका भी सम्मान किया जाता है)

## GitHub इम्पोर्ट

वेब GitHub इम्पोर्टर स्थानीय publish/sync से अधिक सख्त है। यह केवल साइन-इन किए गए GitHub खाते के स्वामित्व वाली सार्वजनिक, non-fork रिपॉज़िटरी में `SKILL.md` या पुराने `skills.md` फ़ाइलों को खोजता है। यह निजी repos, forks, archived/disabled repos, या third-party public repos इम्पोर्ट नहीं करता।

स्थानीय install metadata (CLI द्वारा लिखा गया):

- `<skill>/.clawhub/origin.json` (पुराना `.clawdhub`)

Workdir install state (CLI द्वारा लिखा गया):

- `<workdir>/.clawhub/lock.json` (पुराना `.clawdhub`)

## `SKILL.md`

- वैकल्पिक YAML frontmatter के साथ Markdown।
- सर्वर publish के दौरान frontmatter से metadata निकालता है।
- `description` को UI/खोज में स्किल सारांश के रूप में उपयोग किया जाता है।

## Frontmatter metadata

स्किल metadata आपके `SKILL.md` के शीर्ष पर YAML frontmatter में घोषित किया जाता है। यह registry (और security analysis) को बताता है कि आपकी स्किल को चलने के लिए क्या चाहिए।

### बेसिक frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Runtime metadata (`metadata.openclaw`)

अपनी स्किल की runtime requirements को `metadata.openclaw` के अंतर्गत घोषित करें (aliases: `metadata.clawdbot`, `metadata.clawdis`)।

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

उन environment variables के लिए `requires.env` का उपयोग करें जो स्किल चलने से पहले मौजूद होने चाहिए। जब आपको optional variables सहित per-variable metadata चाहिए, तो `envVars` का उपयोग करें, जिसमें `required: false` शामिल हो।

### पूरा field reference

| फ़ील्ड              | प्रकार       | विवरण                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | आपकी स्किल जिन आवश्यक environment variables की अपेक्षा करती है।                                                                                           |
| `requires.bins`    | `string[]` | CLI binaries जो सभी install होने चाहिए।                                                                                                     |
| `requires.anyBins` | `string[]` | CLI binaries जिनमें से कम से कम एक मौजूद होना चाहिए।                                                                                                  |
| `requires.config`  | `string[]` | Config file paths जिन्हें आपकी स्किल पढ़ती है।                                                                                                          |
| `primaryEnv`       | `string`   | आपकी स्किल के लिए मुख्य credential env var।                                                                                                  |
| `envVars`          | `array`    | `name`, वैकल्पिक `required`, और वैकल्पिक `description` के साथ environment variable declarations। Optional env vars के लिए `required: false` सेट करें। |
| `always`           | `boolean`  | यदि `true`, स्किल हमेशा active रहती है (explicit install की आवश्यकता नहीं)।                                                                              |
| `skillKey`         | `string`   | स्किल की invocation key को override करें।                                                                                                         |
| `emoji`            | `string`   | स्किल के लिए display emoji।                                                                                                                 |
| `homepage`         | `string`   | स्किल के homepage या docs का URL।                                                                                                         |
| `os`               | `string[]` | OS restrictions (उदा. `["macos"]`, `["linux"]`)।                                                                                             |
| `install`          | `array`    | dependencies के लिए install specs (नीचे देखें)।                                                                                                  |
| `nix`              | `object`   | Nix plugin spec (README देखें)।                                                                                                                |
| `config`           | `object`   | Clawdbot config spec (README देखें)।                                                                                                           |

### Install specs

यदि आपकी स्किल को dependencies install करने की आवश्यकता है, तो उन्हें `install` array में घोषित करें:

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

वैकल्पिक environment variables को `metadata.openclaw.envVars` के अंतर्गत घोषित करें और `required: false` सेट करें। `requires.env` में optional entries न जोड़ें, क्योंकि `requires.env` का अर्थ है कि स्किल उनके बिना नहीं चल सकती।

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

ClawHub का security analysis जांचता है कि आपकी स्किल जो घोषित करती है, वह वास्तव में किए जाने वाले काम से मेल खाता है। यदि आपका code `TODOIST_API_KEY` को reference करता है लेकिन आपका frontmatter इसे `requires.env`, `primaryEnv`, या `envVars` के अंतर्गत घोषित नहीं करता, तो analysis metadata mismatch flag करेगा। Declarations को सटीक रखना आपकी स्किल को review पास करने में मदद करता है और users को यह समझने में मदद करता है कि वे क्या install कर रहे हैं।

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
- Script files को upload के बाद भी scan किया जाता है; PowerShell `.ps1`, `.psm1`, और `.psd1` फ़ाइलें text के रूप में स्वीकार की जाती हैं।
- `text/` से शुरू होने वाले content types को text माना जाता है; साथ में एक छोटी allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG)।

सीमाएँ (server-side):

- कुल bundle size: 50MB।
- Embedding text में `SKILL.md` + लगभग 40 तक non-`.md` फ़ाइलें शामिल हैं (best-effort cap)।

## Slugs

- डिफ़ॉल्ट रूप से folder name से derive होते हैं।
- Package scopes को ClawHub publisher handle से बिल्कुल match करना चाहिए। Publisher handles lowercase letters, numbers, hyphens, dots, और underscores का उपयोग कर सकते हैं; उन्हें lowercase letter या number से शुरू और समाप्त होना चाहिए।
- Package slugs lowercase और npm-safe होने चाहिए, उदाहरण के लिए `@example.tools/demo-plugin` या `demo-plugin`।

## Versioning + tags

- प्रत्येक publish एक नया version (semver) बनाता है।
- Tags किसी version के लिए string pointers हैं; `latest` आमतौर पर उपयोग किया जाता है।

## License

- ClawHub पर publish की गई सभी skills `MIT-0` के अंतर्गत licensed हैं।
- कोई भी published skills का उपयोग, modification, और redistribution कर सकता है, commercial रूप से भी।
- Attribution आवश्यक नहीं है।
- `SKILL.md` में conflicting license terms न जोड़ें; ClawHub per-skill license overrides support नहीं करता।

## Paid skills

- ClawHub paid skills, per-skill pricing, paywalls, या revenue sharing support नहीं करता।
- `SKILL.md` में pricing metadata न जोड़ें; यह skill format का हिस्सा नहीं है और published skill को paid नहीं बनाएगा।
- यदि आपकी स्किल paid third-party service के साथ integrate करती है, तो external cost और required account को skill instructions और env declarations में स्पष्ट रूप से document करें (`requires.env` required variables के लिए, या optional variables के लिए `required: false` के साथ `envVars`)।
