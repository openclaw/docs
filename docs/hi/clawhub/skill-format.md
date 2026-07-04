---
read_when:
    - Skills प्रकाशित करना
    - प्रकाशन विफलताओं की डीबगिंग
summary: कौशल फ़ोल्डर प्रारूप, आवश्यक फ़ाइलें, अनुमत फ़ाइल प्रकार, सीमाएँ।
x-i18n:
    generated_at: "2026-07-04T10:39:48Z"
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

- `SKILL.md` (या `skill.md`; legacy `skills.md` भी स्वीकार किया जाता है)

वैकल्पिक:

- कोई भी सहायक _text-based_ फ़ाइलें (“अनुमत फ़ाइलें” देखें)
- `.clawhubignore` (प्रकाशन के लिए ignore patterns, legacy `.clawdhubignore`)
- `.gitignore` (इसे भी माना जाता है)

## GitHub इम्पोर्ट

वेब GitHub importer, local publish/sync से अधिक सख्त है। यह केवल signed-in GitHub खाते के स्वामित्व वाली public, non-fork repositories में
`SKILL.md` या legacy `skills.md` फ़ाइलें खोजता है। यह private repos, forks,
archived/disabled repos, या third-party public repos इम्पोर्ट नहीं करता।

Local install metadata (CLI द्वारा लिखा गया):

- `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

Workdir install state (CLI द्वारा लिखा गया):

- `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)

## `SKILL.md`

- वैकल्पिक YAML frontmatter के साथ Markdown।
- सर्वर publish के दौरान frontmatter से metadata निकालता है।
- `description` को UI/search में स्किल सारांश के रूप में उपयोग किया जाता है।

## Frontmatter metadata

Skill metadata आपकी `SKILL.md` के शीर्ष पर YAML frontmatter में घोषित किया जाता है। यह registry (और security analysis) को बताता है कि आपकी स्किल को चलने के लिए क्या चाहिए।

### बुनियादी frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Runtime metadata (`metadata.openclaw`)

अपनी स्किल की runtime आवश्यकताएं `metadata.openclaw` के तहत घोषित करें (aliases: `metadata.clawdbot`, `metadata.clawdis`)।

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

ऐसे environment variables के लिए `requires.env` उपयोग करें जो स्किल चलने से पहले मौजूद होने चाहिए। जब आपको प्रति-variable metadata चाहिए, जिसमें `required: false` वाले वैकल्पिक variables शामिल हैं, तब `envVars` उपयोग करें।

### पूरा field reference

| फ़ील्ड              | प्रकार       | विवरण                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | आपकी स्किल द्वारा अपेक्षित आवश्यक environment variables.                                                                                           |
| `requires.bins`    | `string[]` | CLI binaries जो सभी installed होने चाहिए।                                                                                                     |
| `requires.anyBins` | `string[]` | CLI binaries जिनमें से कम से कम एक मौजूद होना चाहिए।                                                                                                  |
| `requires.config`  | `string[]` | Config file paths जिन्हें आपकी स्किल पढ़ती है।                                                                                                          |
| `primaryEnv`       | `string`   | आपकी स्किल के लिए मुख्य credential env var.                                                                                                  |
| `envVars`          | `array`    | `name`, वैकल्पिक `required`, और वैकल्पिक `description` के साथ environment variable declarations. वैकल्पिक env vars के लिए `required: false` सेट करें। |
| `always`           | `boolean`  | यदि `true`, स्किल हमेशा active रहती है (explicit install आवश्यक नहीं)।                                                                              |
| `skillKey`         | `string`   | स्किल की invocation key override करें।                                                                                                         |
| `emoji`            | `string`   | स्किल के लिए display emoji.                                                                                                                 |
| `homepage`         | `string`   | स्किल के homepage या docs का URL.                                                                                                         |
| `os`               | `string[]` | OS restrictions (जैसे `["macos"]`, `["linux"]`).                                                                                             |
| `install`          | `array`    | dependencies के लिए install specs (नीचे देखें)।                                                                                                  |
| `nix`              | `object`   | Nix Plugin spec (README देखें)।                                                                                                                |
| `config`           | `object`   | Clawdbot config spec (README देखें)।                                                                                                           |

### Install specs

यदि आपकी स्किल को dependencies installed चाहिए, तो उन्हें `install` array में घोषित करें:

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

समर्थित install kinds: `brew`, `node`, `go`, `uv`.

### वैकल्पिक environment variables

वैकल्पिक environment variables को `metadata.openclaw.envVars` के तहत घोषित करें और `required: false` सेट करें। `requires.env` में वैकल्पिक entries न जोड़ें, क्योंकि `requires.env` का मतलब है कि स्किल उनके बिना नहीं चल सकती।

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

ClawHub का security analysis जांचता है कि आपकी स्किल जो घोषित करती है, वह उसके वास्तविक काम से मेल खाता है। यदि आपका code `TODOIST_API_KEY` संदर्भित करता है लेकिन आपका frontmatter उसे `requires.env`, `primaryEnv`, या `envVars` के तहत घोषित नहीं करता, तो analysis metadata mismatch flag करेगा। घोषणाओं को सटीक रखना आपकी स्किल को review pass करने में मदद करता है और users को यह समझने में मदद करता है कि वे क्या install कर रहे हैं।

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
- Script files upload के बाद भी scan की जाती हैं; PowerShell `.ps1`, `.psm1`, और `.psd1` फ़ाइलें text के रूप में स्वीकार की जाती हैं।
- `text/` से शुरू होने वाले Content types को text माना जाता है; साथ में एक छोटी allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG) भी है।

सीमाएं (server-side):

- कुल bundle size: 50MB.
- Embedding text में `SKILL.md` + लगभग 40 तक non-`.md` फ़ाइलें शामिल हैं (best-effort cap).

## Slugs

- default रूप से folder name से derived.
- Package scopes को ClawHub publisher handle से ठीक-ठीक match करना चाहिए। Publisher handles lowercase letters, numbers, hyphens, dots, और underscores उपयोग कर सकते हैं; उन्हें lowercase letter या number से शुरू और समाप्त होना चाहिए।
- Package slugs lowercase और npm-safe होने चाहिए, उदाहरण के लिए `@example.tools/demo-plugin` या `demo-plugin`.

## Versioning + tags

- प्रत्येक publish एक नया version (semver) बनाता है।
- Tags किसी version के string pointers होते हैं; `latest` आम तौर पर उपयोग किया जाता है।

## License

- ClawHub पर प्रकाशित सभी skills `MIT-0` के तहत licensed हैं।
- कोई भी published skills का उपयोग, modification, और redistribution कर सकता है, commercial रूप से भी।
- Attribution आवश्यक नहीं है।
- `SKILL.md` में conflicting license terms न जोड़ें; ClawHub per-skill license overrides support नहीं करता।

## Paid skills

- ClawHub paid skills, per-skill pricing, paywalls, या revenue sharing support नहीं करता।
- `SKILL.md` में pricing metadata न जोड़ें; यह skill format का हिस्सा नहीं है और published skill को paid नहीं बनाएगा।
- यदि आपकी स्किल किसी paid third-party service के साथ integrate करती है, तो external cost और required account को skill instructions और env declarations में स्पष्ट रूप से document करें (`required` variables के लिए `requires.env`, या optional variables के लिए `required: false` के साथ `envVars`).
