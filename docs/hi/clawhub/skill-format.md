---
read_when:
    - Skills प्रकाशित करना
    - प्रकाशन विफलताओं की डिबगिंग
summary: Skill फ़ोल्डर फ़ॉर्मैट, आवश्यक फ़ाइलें, अनुमत फ़ाइल प्रकार, सीमाएँ।
x-i18n:
    generated_at: "2026-07-02T00:56:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# कौशल फ़ॉर्मैट

## डिस्क पर

कौशल एक फ़ोल्डर होता है।

आवश्यक:

- `SKILL.md` (या `skill.md`; लेगेसी `skills.md` भी स्वीकार किया जाता है)

वैकल्पिक:

- कोई भी सहायक _text-based_ फ़ाइलें (“अनुमत फ़ाइलें” देखें)
- `.clawhubignore` (प्रकाशन के लिए ignore पैटर्न, लेगेसी `.clawdhubignore`)
- `.gitignore` (इसका भी सम्मान किया जाता है)

## GitHub इम्पोर्ट

वेब GitHub इम्पोर्टर स्थानीय publish/sync की तुलना में अधिक सख्त है। यह केवल
साइन-इन किए गए GitHub खाते के स्वामित्व वाली सार्वजनिक, non-fork repositories में
`SKILL.md` या लेगेसी `skills.md` फ़ाइलें खोजता है। यह निजी repos, forks,
archived/disabled repos, या third-party public repos इम्पोर्ट नहीं करता।

स्थानीय install metadata (CLI द्वारा लिखा गया):

- `<skill>/.clawhub/origin.json` (लेगेसी `.clawdhub`)

Workdir install state (CLI द्वारा लिखा गया):

- `<workdir>/.clawhub/lock.json` (लेगेसी `.clawdhub`)

## `SKILL.md`

- वैकल्पिक YAML frontmatter के साथ Markdown।
- सर्वर publish के दौरान frontmatter से metadata निकालता है।
- `description` को UI/search में कौशल सारांश के रूप में उपयोग किया जाता है।

## Frontmatter metadata

कौशल metadata आपके `SKILL.md` के शीर्ष पर YAML frontmatter में घोषित किया जाता है। यह registry (और security analysis) को बताता है कि आपके कौशल को चलने के लिए क्या चाहिए।

### बुनियादी frontmatter

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

कौशल के चलने से पहले मौजूद रहने वाले environment variables के लिए `requires.env` का उपयोग करें। जब आपको per-variable metadata चाहिए, जिसमें `required: false` वाले वैकल्पिक variables भी शामिल हैं, तो `envVars` का उपयोग करें।

### पूरा फ़ील्ड संदर्भ

| फ़ील्ड              | प्रकार       | विवरण                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | आवश्यक environment variables जिनकी आपका कौशल अपेक्षा करता है।                                                                                           |
| `requires.bins`    | `string[]` | CLI binaries जो सभी install होने चाहिए।                                                                                                     |
| `requires.anyBins` | `string[]` | CLI binaries जिनमें से कम से कम एक मौजूद होना चाहिए।                                                                                                  |
| `requires.config`  | `string[]` | Config फ़ाइल पथ जिन्हें आपका कौशल पढ़ता है।                                                                                                          |
| `primaryEnv`       | `string`   | आपके कौशल के लिए मुख्य credential env var।                                                                                                  |
| `envVars`          | `array`    | `name`, वैकल्पिक `required`, और वैकल्पिक `description` के साथ environment variable घोषणाएँ। वैकल्पिक env vars के लिए `required: false` सेट करें। |
| `always`           | `boolean`  | यदि `true`, तो कौशल हमेशा active रहता है (explicit install की आवश्यकता नहीं)।                                                                              |
| `skillKey`         | `string`   | कौशल की invocation key को override करें।                                                                                                         |
| `emoji`            | `string`   | कौशल के लिए display emoji।                                                                                                                 |
| `homepage`         | `string`   | कौशल के homepage या docs का URL।                                                                                                         |
| `os`               | `string[]` | OS restrictions (जैसे `["macos"]`, `["linux"]`)।                                                                                             |
| `install`          | `array`    | dependencies के लिए install specs (नीचे देखें)।                                                                                                  |
| `nix`              | `object`   | Nix plugin spec (README देखें)।                                                                                                                |
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

वैकल्पिक environment variables को `metadata.openclaw.envVars` के अंतर्गत घोषित करें और `required: false` सेट करें। वैकल्पिक entries को `requires.env` में न जोड़ें, क्योंकि `requires.env` का अर्थ है कि कौशल उनके बिना नहीं चल सकता।

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

ClawHub का security analysis जाँचता है कि आपका कौशल जो घोषित करता है, वह वास्तव में जो करता है उससे मेल खाता है। यदि आपका code `TODOIST_API_KEY` को reference करता है लेकिन आपका frontmatter इसे `requires.env`, `primaryEnv`, या `envVars` के अंतर्गत घोषित नहीं करता, तो analysis metadata mismatch flag करेगा। घोषणाओं को सटीक रखने से आपके कौशल को review पास करने में मदद मिलती है और users को समझने में मदद मिलती है कि वे क्या install कर रहे हैं।

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

publish द्वारा केवल “text-based” फ़ाइलें स्वीकार की जाती हैं।

- Extension allowlist `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) में है।
- Script फ़ाइलें upload के बाद भी scan की जाती हैं; PowerShell `.ps1`, `.psm1`, और `.psd1` फ़ाइलें text के रूप में स्वीकार की जाती हैं।
- `text/` से शुरू होने वाले content types को text माना जाता है; साथ ही एक छोटी allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG)।

सीमाएँ (server-side):

- कुल bundle size: 50MB।
- Embedding text में `SKILL.md` + लगभग 40 तक non-`.md` फ़ाइलें शामिल हैं (best-effort cap)।

## Slugs

- डिफ़ॉल्ट रूप से folder name से derived।
- Package scopes को ClawHub publisher handle से ठीक-ठीक मेल खाना चाहिए। Publisher handles lowercase letters, numbers, hyphens, dots, और underscores का उपयोग कर सकते हैं; उन्हें lowercase letter या number से शुरू और समाप्त होना चाहिए।
- Package slugs lowercase और npm-safe होने चाहिए, उदाहरण के लिए `@example.tools/demo-plugin` या `demo-plugin`।

## Versioning + tags

- प्रत्येक publish एक नया version (semver) बनाता है।
- Tags किसी version के लिए string pointers होते हैं; `latest` आम तौर पर उपयोग होता है।

## License

- ClawHub पर प्रकाशित सभी skills `MIT-0` के अंतर्गत licensed हैं।
- कोई भी प्रकाशित skills का उपयोग, modification, और redistribution कर सकता है, commercial रूप से भी।
- Attribution आवश्यक नहीं है।
- `SKILL.md` में conflicting license terms न जोड़ें; ClawHub per-skill license overrides support नहीं करता।

## भुगतान वाले कौशल

- ClawHub paid skills, per-skill pricing, paywalls, या revenue sharing support नहीं करता।
- `SKILL.md` में pricing metadata न जोड़ें; यह skill format का हिस्सा नहीं है और published skill को paid नहीं बनाएगा।
- यदि आपका कौशल किसी paid third-party service के साथ integrate करता है, तो external cost और required account को skill instructions और env declarations में स्पष्ट रूप से document करें (required variables के लिए `requires.env`, या optional variables के लिए `required: false` के साथ `envVars`)।
