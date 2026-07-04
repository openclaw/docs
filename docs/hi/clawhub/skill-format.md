---
read_when:
    - Skills प्रकाशित करना
    - प्रकाशन विफलताओं की डिबगिंग
summary: Skill फ़ोल्डर का प्रारूप, आवश्यक फ़ाइलें, अनुमत फ़ाइल प्रकार, सीमाएँ।
x-i18n:
    generated_at: "2026-07-04T06:32:10Z"
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

- `SKILL.md` (या `skill.md`; विरासत `skills.md` भी स्वीकार्य है)

वैकल्पिक:

- कोई भी सहायक _टेक्स्ट-आधारित_ फ़ाइलें (“अनुमत फ़ाइलें” देखें)
- `.clawhubignore` (प्रकाशन के लिए अनदेखा पैटर्न, विरासत `.clawdhubignore`)
- `.gitignore` (इसे भी माना जाता है)

## GitHub आयात

वेब GitHub आयातक स्थानीय publish/sync से अधिक सख्त है। यह केवल साइन-इन किए हुए GitHub खाते के स्वामित्व वाली सार्वजनिक, non-fork repositories में `SKILL.md` या विरासत `skills.md` फ़ाइलें खोजता है। यह private repos, forks, archived/disabled repos, या third-party public repos आयात नहीं करता।

स्थानीय install metadata (CLI द्वारा लिखा गया):

- `<skill>/.clawhub/origin.json` (विरासत `.clawdhub`)

Workdir install state (CLI द्वारा लिखा गया):

- `<workdir>/.clawhub/lock.json` (विरासत `.clawdhub`)

## `SKILL.md`

- वैकल्पिक YAML frontmatter वाला Markdown।
- server publish के दौरान frontmatter से metadata निकालता है।
- `description` UI/search में skill summary के रूप में उपयोग किया जाता है।

## Frontmatter metadata

Skill metadata आपके `SKILL.md` के शीर्ष पर YAML frontmatter में घोषित किया जाता है। यह registry (और security analysis) को बताता है कि आपकी skill को चलने के लिए क्या चाहिए।

### मूल frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Runtime metadata (`metadata.openclaw`)

अपनी skill की runtime requirements `metadata.openclaw` के अंतर्गत घोषित करें (aliases: `metadata.clawdbot`, `metadata.clawdis`)।

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

skill चलने से पहले मौजूद होने वाले environment variables के लिए `requires.env` का उपयोग करें। जब आपको per-variable metadata चाहिए, जिसमें `required: false` वाले optional variables भी शामिल हों, तब `envVars` का उपयोग करें।

### पूर्ण field संदर्भ

| Field              | Type       | Description                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | वे required environment variables जिनकी आपकी skill अपेक्षा करती है।                                                                                           |
| `requires.bins`    | `string[]` | CLI binaries जो सभी install होने चाहिए।                                                                                                     |
| `requires.anyBins` | `string[]` | CLI binaries जिनमें से कम से कम एक मौजूद होना चाहिए।                                                                                                  |
| `requires.config`  | `string[]` | Config file paths जिन्हें आपकी skill पढ़ती है।                                                                                                          |
| `primaryEnv`       | `string`   | आपकी skill के लिए मुख्य credential env var।                                                                                                  |
| `envVars`          | `array`    | `name`, वैकल्पिक `required`, और वैकल्पिक `description` वाली environment variable declarations। optional env vars के लिए `required: false` सेट करें। |
| `always`           | `boolean`  | यदि `true`, skill हमेशा active रहती है (explicit install आवश्यक नहीं)।                                                                              |
| `skillKey`         | `string`   | skill की invocation key override करें।                                                                                                         |
| `emoji`            | `string`   | skill के लिए display emoji।                                                                                                                 |
| `homepage`         | `string`   | skill के homepage या docs का URL।                                                                                                         |
| `os`               | `string[]` | OS restrictions (जैसे `["macos"]`, `["linux"]`)।                                                                                             |
| `install`          | `array`    | dependencies के लिए install specs (नीचे देखें)।                                                                                                  |
| `nix`              | `object`   | Nix plugin spec (README देखें)।                                                                                                                |
| `config`           | `object`   | Clawdbot config spec (README देखें)।                                                                                                           |

### Install specs

यदि आपकी skill को dependencies install करने की आवश्यकता है, तो उन्हें `install` array में घोषित करें:

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

वैकल्पिक environment variables को `metadata.openclaw.envVars` के अंतर्गत घोषित करें और `required: false` सेट करें। `requires.env` में optional entries न जोड़ें, क्योंकि `requires.env` का अर्थ है कि skill उनके बिना नहीं चल सकती।

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

ClawHub का security analysis जाँचता है कि आपकी skill जो घोषित करती है वह उसके वास्तविक कार्यों से मेल खाता है। यदि आपका code `TODOIST_API_KEY` को reference करता है लेकिन आपका frontmatter उसे `requires.env`, `primaryEnv`, या `envVars` के अंतर्गत घोषित नहीं करता, तो analysis metadata mismatch flag करेगा। declarations को accurate रखना आपकी skill को review pass करने में मदद करता है और users को यह समझने में मदद करता है कि वे क्या install कर रहे हैं।

### Example: complete frontmatter

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
- Script files upload के बाद भी scan की जाती हैं; PowerShell `.ps1`, `.psm1`, और `.psd1` files text के रूप में स्वीकार की जाती हैं।
- `text/` से शुरू होने वाले content types को text माना जाता है; साथ में एक छोटी allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG)।

Limits (server-side):

- कुल bundle size: 50MB।
- Embedding text में `SKILL.md` + लगभग 40 तक non-`.md` files शामिल हैं (best-effort cap)।

## Slugs

- default रूप से folder name से derive किए जाते हैं।
- Package scopes को ClawHub publisher handle से exact match करना चाहिए। Publisher handles lowercase letters, numbers, hyphens, dots, और underscores का उपयोग कर सकते हैं; उन्हें lowercase letter या number से शुरू और समाप्त होना चाहिए।
- Package slugs lowercase और npm-safe होने चाहिए, उदाहरण के लिए `@example.tools/demo-plugin` या `demo-plugin`।

## Versioning + tags

- प्रत्येक publish एक नया version (semver) बनाता है।
- Tags किसी version के string pointers होते हैं; `latest` सामान्यतः उपयोग किया जाता है।

## License

- ClawHub पर प्रकाशित सभी skills `MIT-0` के अंतर्गत licensed हैं।
- कोई भी published skills का उपयोग, modification, और redistribution कर सकता है, commercial रूप से भी।
- Attribution आवश्यक नहीं है।
- `SKILL.md` में conflicting license terms न जोड़ें; ClawHub per-skill license overrides support नहीं करता।

## Paid skills

- ClawHub paid skills, per-skill pricing, paywalls, या revenue sharing support नहीं करता।
- `SKILL.md` में pricing metadata न जोड़ें; यह skill format का हिस्सा नहीं है और published skill को paid नहीं बनाएगा।
- यदि आपकी skill किसी paid third-party service के साथ integrate करती है, तो skill instructions और env declarations (`requires.env` required variables के लिए, या optional variables के लिए `required: false` वाला `envVars`) में external cost और required account को स्पष्ट रूप से document करें।
