---
read_when:
    - Skills प्रकाशित करना
    - प्रकाशन विफलताओं की डीबगिंग
summary: Skill फ़ोल्डर फ़ॉर्मैट, आवश्यक फ़ाइलें, अनुमत फ़ाइल प्रकार, सीमाएँ।
x-i18n:
    generated_at: "2026-07-01T13:00:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# कौशल प्रारूप

## डिस्क पर

कौशल एक फ़ोल्डर है।

आवश्यक:

- `SKILL.md` (या `skill.md`; विरासती `skills.md` भी स्वीकार्य है)

वैकल्पिक:

- कोई भी सहायक _पाठ-आधारित_ फ़ाइलें (“अनुमत फ़ाइलें” देखें)
- `.clawhubignore` (प्रकाशन के लिए अनदेखा पैटर्न, विरासती `.clawdhubignore`)
- `.gitignore` (इसका भी पालन किया जाता है)

## GitHub इंपोर्ट

वेब GitHub इंपोर्टर स्थानीय प्रकाशन/सिंक की तुलना में अधिक सख्त है। यह केवल
साइन-इन किए गए GitHub खाते के स्वामित्व वाले सार्वजनिक, गैर-फोर्क रिपॉज़िटरी में
`SKILL.md` या विरासती `skills.md` फ़ाइलें खोजता है। यह निजी रिपो, फोर्क,
आर्काइव/अक्षम रिपो, या तृतीय-पक्ष सार्वजनिक रिपो इंपोर्ट नहीं करता।

स्थानीय इंस्टॉल मेटाडेटा (CLI द्वारा लिखा गया):

- `<skill>/.clawhub/origin.json` (विरासती `.clawdhub`)

Workdir इंस्टॉल स्थिति (CLI द्वारा लिखी गई):

- `<workdir>/.clawhub/lock.json` (विरासती `.clawdhub`)

## `SKILL.md`

- वैकल्पिक YAML frontmatter के साथ Markdown।
- सर्वर प्रकाशन के दौरान frontmatter से मेटाडेटा निकालता है।
- `description` का उपयोग UI/खोज में कौशल सारांश के रूप में किया जाता है।

## Frontmatter मेटाडेटा

कौशल मेटाडेटा आपकी `SKILL.md` के शीर्ष पर YAML frontmatter में घोषित किया जाता है। यह registry (और सुरक्षा विश्लेषण) को बताता है कि आपके कौशल को चलने के लिए क्या चाहिए।

### मूल frontmatter

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

कौशल चलाने से पहले मौजूद रहने वाले environment variables के लिए `requires.env` का उपयोग करें। जब आपको प्रति-variable मेटाडेटा चाहिए, जिसमें `required: false` वाले वैकल्पिक variables शामिल हैं, तो `envVars` का उपयोग करें।

### पूरा फ़ील्ड संदर्भ

| फ़ील्ड              | प्रकार       | विवरण                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | वे आवश्यक environment variables जिनकी आपका कौशल अपेक्षा करता है।                                                                                           |
| `requires.bins`    | `string[]` | CLI binaries जिनका सभी इंस्टॉल होना आवश्यक है।                                                                                                     |
| `requires.anyBins` | `string[]` | CLI binaries जिनमें से कम से कम एक मौजूद होना आवश्यक है।                                                                                                  |
| `requires.config`  | `string[]` | Config फ़ाइल पथ जिन्हें आपका कौशल पढ़ता है।                                                                                                          |
| `primaryEnv`       | `string`   | आपके कौशल के लिए मुख्य credential env var।                                                                                                  |
| `envVars`          | `array`    | `name`, वैकल्पिक `required`, और वैकल्पिक `description` के साथ environment variable घोषणाएँ। वैकल्पिक env vars के लिए `required: false` सेट करें। |
| `always`           | `boolean`  | यदि `true`, तो कौशल हमेशा सक्रिय रहता है (स्पष्ट इंस्टॉल की आवश्यकता नहीं)।                                                                              |
| `skillKey`         | `string`   | कौशल की invocation key को override करें।                                                                                                         |
| `emoji`            | `string`   | कौशल के लिए display emoji।                                                                                                                 |
| `homepage`         | `string`   | कौशल के homepage या docs का URL।                                                                                                         |
| `os`               | `string[]` | OS प्रतिबंध (जैसे `["macos"]`, `["linux"]`)।                                                                                             |
| `install`          | `array`    | dependencies के लिए install specs (नीचे देखें)।                                                                                                  |
| `nix`              | `object`   | Nix Plugin spec (README देखें)।                                                                                                                |
| `config`           | `object`   | Clawdbot config spec (README देखें)।                                                                                                           |

### Install specs

यदि आपके कौशल को dependencies इंस्टॉल करने की आवश्यकता है, तो उन्हें `install` array में घोषित करें:

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

वैकल्पिक environment variables को `metadata.openclaw.envVars` के अंतर्गत घोषित करें और `required: false` सेट करें। वैकल्पिक entries को `requires.env` में न जोड़ें, क्योंकि `requires.env` का मतलब है कि कौशल उनके बिना चल नहीं सकता।

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

ClawHub का सुरक्षा विश्लेषण जाँचता है कि आपका कौशल जो घोषित करता है, वह उसके वास्तविक कार्य से मेल खाता है। यदि आपका code `TODOIST_API_KEY` को संदर्भित करता है लेकिन आपका frontmatter इसे `requires.env`, `primaryEnv`, या `envVars` के अंतर्गत घोषित नहीं करता, तो विश्लेषण मेटाडेटा mismatch को flag करेगा। घोषणाओं को सटीक रखने से आपका कौशल review पास करने में मदद मिलती है और users समझ पाते हैं कि वे क्या इंस्टॉल कर रहे हैं।

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

प्रकाशन द्वारा केवल “पाठ-आधारित” फ़ाइलें स्वीकार की जाती हैं।

- Extension allowlist `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) में है।
- Upload के बाद script files अभी भी scan की जाती हैं; PowerShell `.ps1`, `.psm1`, और `.psd1` फ़ाइलें text के रूप में स्वीकार की जाती हैं।
- `text/` से शुरू होने वाले content types को text माना जाता है; साथ में एक छोटी allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG) भी है।

सीमाएँ (server-side):

- कुल bundle size: 50MB।
- Embedding text में `SKILL.md` + लगभग 40 तक गैर-`.md` फ़ाइलें शामिल हैं (best-effort cap)।

## Slugs

- डिफ़ॉल्ट रूप से फ़ोल्डर नाम से derived।
- Package scopes को ClawHub publisher handle से बिल्कुल मेल खाना चाहिए। Publisher handles lowercase अक्षर, संख्याएँ, hyphens, dots, और underscores का उपयोग कर सकते हैं; उन्हें lowercase अक्षर या संख्या से शुरू और समाप्त होना चाहिए।
- Package slugs lowercase और npm-safe होने चाहिए, उदाहरण के लिए `@example.tools/demo-plugin` या `demo-plugin`।

## Versioning + tags

- प्रत्येक publish एक नया version (semver) बनाता है।
- Tags किसी version के लिए string pointers होते हैं; `latest` आम तौर पर उपयोग किया जाता है।

## License

- ClawHub पर प्रकाशित सभी कौशल `MIT-0` के अंतर्गत licensed होते हैं।
- कोई भी प्रकाशित कौशलों का उपयोग, संशोधन, और पुनर्वितरण कर सकता है, व्यावसायिक रूप से भी।
- Attribution आवश्यक नहीं है।
- `SKILL.md` में conflicting license terms न जोड़ें; ClawHub प्रति-कौशल license overrides का समर्थन नहीं करता।

## Paid skills

- ClawHub paid skills, प्रति-कौशल pricing, paywalls, या revenue sharing का समर्थन नहीं करता।
- `SKILL.md` में pricing metadata न जोड़ें; यह कौशल प्रारूप का हिस्सा नहीं है और किसी प्रकाशित कौशल को paid नहीं बनाएगा।
- यदि आपका कौशल किसी paid third-party service के साथ integrate करता है, तो external cost और required account को कौशल निर्देशों और env घोषणाओं में स्पष्ट रूप से document करें (`requires.env` required variables के लिए, या वैकल्पिक variables के लिए `required: false` के साथ `envVars`)।
