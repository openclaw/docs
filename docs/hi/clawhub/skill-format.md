---
read_when:
    - Skills प्रकाशित करना
    - प्रकाशन विफलताओं की डिबगिंग
summary: कौशल फ़ोल्डर प्रारूप, आवश्यक फ़ाइलें, अनुमत फ़ाइल प्रकार, सीमाएँ.
x-i18n:
    generated_at: "2026-07-04T15:18:17Z"
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

- `SKILL.md` (या `skill.md`; लीगेसी `skills.md` भी स्वीकार्य है)

वैकल्पिक:

- कोई भी सहायक _टेक्स्ट-आधारित_ फ़ाइलें (“अनुमत फ़ाइलें” देखें)
- `.clawhubignore` (प्रकाशन के लिए अनदेखा पैटर्न, लीगेसी `.clawdhubignore`)
- `.gitignore` (इसका भी सम्मान किया जाता है)

## GitHub आयात

वेब GitHub आयातक स्थानीय publish/sync से अधिक सख्त है। यह केवल साइन-इन किए गए GitHub खाते के स्वामित्व वाले सार्वजनिक, गैर-फोर्क रिपॉज़िटरी में
`SKILL.md` या लीगेसी `skills.md` फ़ाइलें खोजता है। यह निजी repos, forks,
archived/disabled repos, या तृतीय-पक्ष सार्वजनिक repos आयात नहीं करता।

स्थानीय install metadata (CLI द्वारा लिखी गई):

- `<skill>/.clawhub/origin.json` (लीगेसी `.clawdhub`)

Workdir install state (CLI द्वारा लिखी गई):

- `<workdir>/.clawhub/lock.json` (लीगेसी `.clawdhub`)

## `SKILL.md`

- वैकल्पिक YAML frontmatter के साथ Markdown।
- server publish के दौरान frontmatter से metadata निकालता है।
- `description` UI/search में skill summary के रूप में उपयोग किया जाता है।

## Frontmatter metadata

Skill metadata आपके `SKILL.md` के शीर्ष पर YAML frontmatter में घोषित किया जाता है। यह registry (और security analysis) को बताता है कि आपके skill को चलने के लिए क्या चाहिए।

### Basic frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Runtime metadata (`metadata.openclaw`)

अपने skill की runtime requirements को `metadata.openclaw` के अंतर्गत घोषित करें (aliases: `metadata.clawdbot`, `metadata.clawdis`)।

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

skill चलने से पहले मौजूद होने वाली environment variables के लिए `requires.env` का उपयोग करें। जब आपको प्रति-variable metadata चाहिए, जिसमें `required: false` वाले optional variables भी शामिल हों, तो `envVars` का उपयोग करें।

### पूर्ण फ़ील्ड संदर्भ

| फ़ील्ड              | प्रकार       | विवरण                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | आपके skill द्वारा अपेक्षित आवश्यक environment variables।                                                                                           |
| `requires.bins`    | `string[]` | CLI binaries जो सभी install होने चाहिए।                                                                                                     |
| `requires.anyBins` | `string[]` | CLI binaries जिनमें से कम से कम एक मौजूद होना चाहिए।                                                                                                  |
| `requires.config`  | `string[]` | Config file paths जिन्हें आपका skill पढ़ता है।                                                                                                          |
| `primaryEnv`       | `string`   | आपके skill के लिए मुख्य credential env var।                                                                                                  |
| `envVars`          | `array`    | `name`, optional `required`, और optional `description` के साथ environment variable declarations। optional env vars के लिए `required: false` सेट करें। |
| `always`           | `boolean`  | यदि `true`, skill हमेशा active रहता है (explicit install की आवश्यकता नहीं)।                                                                              |
| `skillKey`         | `string`   | skill की invocation key को override करें।                                                                                                         |
| `emoji`            | `string`   | skill के लिए display emoji।                                                                                                                 |
| `homepage`         | `string`   | skill के homepage या docs का URL।                                                                                                         |
| `os`               | `string[]` | OS restrictions (जैसे `["macos"]`, `["linux"]`)।                                                                                             |
| `install`          | `array`    | dependencies के लिए install specs (नीचे देखें)।                                                                                                  |
| `nix`              | `object`   | Nix plugin spec (README देखें)।                                                                                                                |
| `config`           | `object`   | Clawdbot config spec (README देखें)।                                                                                                           |

### Install specs

यदि आपके skill को dependencies install करने की आवश्यकता है, तो उन्हें `install` array में घोषित करें:

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

optional environment variables को `metadata.openclaw.envVars` के अंतर्गत घोषित करें और `required: false` सेट करें। optional entries को `requires.env` में न जोड़ें, क्योंकि `requires.env` का अर्थ है कि skill उनके बिना नहीं चल सकता।

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

ClawHub का security analysis जांचता है कि आपका skill जो घोषित करता है वह वास्तव में उसके काम से मेल खाता है। यदि आपका code `TODOIST_API_KEY` को संदर्भित करता है लेकिन आपका frontmatter उसे `requires.env`, `primaryEnv`, या `envVars` के अंतर्गत घोषित नहीं करता, तो analysis metadata mismatch को flag करेगा। declarations को accurate रखना आपके skill को review pass करने में मदद करता है और users को यह समझने में मदद करता है कि वे क्या install कर रहे हैं।

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

publish द्वारा केवल “text-based” फ़ाइलें स्वीकार की जाती हैं।

- Extension allowlist `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) में है।
- Script files upload के बाद भी scanned की जाती हैं; PowerShell `.ps1`, `.psm1`, और `.psd1` files text के रूप में स्वीकार की जाती हैं।
- `text/` से शुरू होने वाले Content types को text माना जाता है; साथ ही एक छोटी allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG)।

Limits (server-side):

- कुल bundle size: 50MB।
- Embedding text में `SKILL.md` + लगभग 40 तक non-`.md` files शामिल हैं (best-effort cap)।

## Slugs

- default रूप से folder name से derived।
- Package scopes को ClawHub publisher handle से exactly match करना चाहिए। Publisher handles lowercase letters, numbers, hyphens, dots, और underscores का उपयोग कर सकते हैं; उन्हें lowercase letter या number से शुरू और समाप्त होना चाहिए।
- Package slugs lowercase और npm-safe होने चाहिए, उदाहरण के लिए `@example.tools/demo-plugin` या `demo-plugin`।

## Versioning + tags

- प्रत्येक publish एक नया version (semver) बनाता है।
- Tags किसी version के string pointers होते हैं; `latest` सामान्यतः उपयोग किया जाता है।

## License

- ClawHub पर published सभी skills `MIT-0` के अंतर्गत licensed हैं।
- कोई भी published skills का उपयोग, संशोधन, और पुनर्वितरण कर सकता है, commercial रूप से भी।
- Attribution आवश्यक नहीं है।
- `SKILL.md` में conflicting license terms न जोड़ें; ClawHub प्रति-skill license overrides का समर्थन नहीं करता।

## Paid skills

- ClawHub paid skills, प्रति-skill pricing, paywalls, या revenue sharing का समर्थन नहीं करता।
- `SKILL.md` में pricing metadata न जोड़ें; यह skill format का हिस्सा नहीं है और published skill को paid नहीं बनाएगा।
- यदि आपका skill किसी paid third-party service के साथ integrate करता है, तो external cost और required account को skill instructions और env declarations में स्पष्ट रूप से document करें (required variables के लिए `requires.env`, या optional variables के लिए `required: false` के साथ `envVars`)।
