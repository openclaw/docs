---
read_when:
    - Skills प्रकाशित करना
    - प्रकाशन विफलताओं का डीबग करना
summary: कौशल फ़ोल्डर का प्रारूप, आवश्यक फ़ाइलें, अनुमत फ़ाइल प्रकार, सीमाएँ.
x-i18n:
    generated_at: "2026-07-02T22:33:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# स्किल फ़ॉर्मैट

## डिस्क पर

एक स्किल एक फ़ोल्डर है।

आवश्यक:

- `SKILL.md` (या `skill.md`; लेगेसी `skills.md` भी स्वीकार है)

वैकल्पिक:

- कोई भी सहायक _टेक्स्ट-आधारित_ फ़ाइलें (“अनुमत फ़ाइलें” देखें)
- `.clawhubignore` (प्रकाशन के लिए अनदेखी पैटर्न, लेगेसी `.clawdhubignore`)
- `.gitignore` (इसे भी माना जाता है)

## GitHub आयात

वेब GitHub आयातक लोकल publish/sync से अधिक सख्त है। यह केवल साइन-इन किए गए GitHub खाते के स्वामित्व वाली सार्वजनिक, non-fork रिपॉज़िटरी में `SKILL.md` या लेगेसी `skills.md` फ़ाइलें खोजता है। यह निजी रेपो, forks, archived/disabled रेपो, या तृतीय-पक्ष सार्वजनिक रेपो आयात नहीं करता।

लोकल install मेटाडेटा (CLI द्वारा लिखा गया):

- `<skill>/.clawhub/origin.json` (लेगेसी `.clawdhub`)

Workdir install स्थिति (CLI द्वारा लिखी गई):

- `<workdir>/.clawhub/lock.json` (लेगेसी `.clawdhub`)

## `SKILL.md`

- वैकल्पिक YAML frontmatter वाला Markdown।
- सर्वर publish के दौरान frontmatter से मेटाडेटा निकालता है।
- `description` को UI/search में स्किल सारांश के रूप में उपयोग किया जाता है।

## Frontmatter मेटाडेटा

Skill मेटाडेटा आपके `SKILL.md` के शीर्ष पर YAML frontmatter में घोषित किया जाता है। यह registry (और सुरक्षा विश्लेषण) को बताता है कि आपकी स्किल को चलने के लिए क्या चाहिए।

### मूल frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Runtime मेटाडेटा (`metadata.openclaw`)

अपनी स्किल की runtime आवश्यकताएँ `metadata.openclaw` के अंतर्गत घोषित करें (aliases: `metadata.clawdbot`, `metadata.clawdis`)।

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

स्किल चलने से पहले मौजूद होने वाले environment variables के लिए `requires.env` का उपयोग करें। जब आपको प्रति-variable metadata चाहिए, जिसमें `required: false` वाले वैकल्पिक variables भी शामिल हैं, तब `envVars` का उपयोग करें।

### पूरा फ़ील्ड संदर्भ

| फ़ील्ड             | प्रकार     | विवरण                                                                                                                                 |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | वे आवश्यक environment variables जिनकी आपकी स्किल अपेक्षा करती है।                                                                    |
| `requires.bins`    | `string[]` | CLI binaries जो सभी installed होने चाहिए।                                                                                             |
| `requires.anyBins` | `string[]` | CLI binaries जिनमें से कम से कम एक मौजूद होना चाहिए।                                                                                  |
| `requires.config`  | `string[]` | Config फ़ाइल paths जिन्हें आपकी स्किल पढ़ती है।                                                                                       |
| `primaryEnv`       | `string`   | आपकी स्किल के लिए मुख्य credential env var।                                                                                            |
| `envVars`          | `array`    | `name`, वैकल्पिक `required`, और वैकल्पिक `description` वाली environment variable घोषणाएँ। वैकल्पिक env vars के लिए `required: false` सेट करें। |
| `always`           | `boolean`  | यदि `true` है, तो स्किल हमेशा active रहती है (explicit install की आवश्यकता नहीं)।                                                     |
| `skillKey`         | `string`   | स्किल की invocation key को override करें।                                                                                              |
| `emoji`            | `string`   | स्किल के लिए display emoji।                                                                                                            |
| `homepage`         | `string`   | स्किल के homepage या docs का URL।                                                                                                      |
| `os`               | `string[]` | OS restrictions (जैसे `["macos"]`, `["linux"]`)।                                                                                       |
| `install`          | `array`    | dependencies के लिए install specs (नीचे देखें)।                                                                                        |
| `nix`              | `object`   | Nix Plugin spec (README देखें)।                                                                                                        |
| `config`           | `object`   | Clawdbot config spec (README देखें)।                                                                                                   |

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

समर्थित install kinds: `brew`, `node`, `go`, `uv`।

### वैकल्पिक environment variables

वैकल्पिक environment variables को `metadata.openclaw.envVars` के अंतर्गत घोषित करें और `required: false` सेट करें। वैकल्पिक entries को `requires.env` में न जोड़ें, क्योंकि `requires.env` का अर्थ है कि स्किल इनके बिना नहीं चल सकती।

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

ClawHub का सुरक्षा विश्लेषण जाँचता है कि आपकी स्किल जो घोषित करती है, वह वास्तव में उसके काम से मेल खाता है। यदि आपका code `TODOIST_API_KEY` को reference करता है लेकिन आपका frontmatter उसे `requires.env`, `primaryEnv`, या `envVars` के अंतर्गत घोषित नहीं करता, तो विश्लेषण metadata mismatch flag करेगा। घोषणाओं को सटीक रखने से आपकी स्किल review पास करने में मदद मिलती है और users समझ पाते हैं कि वे क्या install कर रहे हैं।

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
- Upload के बाद भी script files scan की जाती हैं; PowerShell `.ps1`, `.psm1`, और `.psd1` फ़ाइलें text के रूप में स्वीकार की जाती हैं।
- `text/` से शुरू होने वाले content types को text माना जाता है; साथ में एक छोटी allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG) भी है।

सीमाएँ (server-side):

- कुल bundle size: 50MB।
- Embedding text में `SKILL.md` + लगभग 40 non-`.md` फ़ाइलें तक शामिल हैं (best-effort cap)।

## Slugs

- डिफ़ॉल्ट रूप से folder name से derived।
- Package scopes को ClawHub publisher handle से ठीक-ठीक मेल खाना चाहिए। Publisher handles lowercase letters, numbers, hyphens, dots, और underscores का उपयोग कर सकते हैं; उन्हें lowercase letter या number से शुरू और समाप्त होना चाहिए।
- Package slugs lowercase और npm-safe होने चाहिए, उदाहरण के लिए `@example.tools/demo-plugin` या `demo-plugin`।

## Versioning + tags

- प्रत्येक publish एक नया version (semver) बनाता है।
- Tags किसी version के लिए string pointers हैं; `latest` आम तौर पर उपयोग होता है।

## License

- ClawHub पर published सभी skills `MIT-0` के अंतर्गत licensed हैं।
- कोई भी published skills का उपयोग, संशोधन, और पुनर्वितरण कर सकता है, जिसमें commercial उपयोग भी शामिल है।
- Attribution आवश्यक नहीं है।
- `SKILL.md` में conflicting license terms न जोड़ें; ClawHub per-skill license overrides को support नहीं करता।

## Paid skills

- ClawHub paid skills, per-skill pricing, paywalls, या revenue sharing को support नहीं करता।
- `SKILL.md` में pricing metadata न जोड़ें; यह skill format का हिस्सा नहीं है और published skill को paid नहीं बनाएगा।
- यदि आपकी स्किल किसी paid third-party service के साथ integrate करती है, तो बाहरी cost और required account को skill instructions और env declarations में स्पष्ट रूप से document करें (required variables के लिए `requires.env`, या optional variables के लिए `required: false` के साथ `envVars`)।
