---
read_when:
    - Skills प्रकाशित करना
    - प्रकाशन विफलताओं की डिबगिंग
summary: Skill फ़ोल्डर प्रारूप, अनिवार्य फ़ाइलें, अनुमत फ़ाइल प्रकार, सीमाएँ।
x-i18n:
    generated_at: "2026-07-03T02:47:40Z"
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

- `SKILL.md` (या `skill.md`; लेगेसी `skills.md` भी स्वीकार्य है)

वैकल्पिक:

- कोई भी सहायक _टेक्स्ट-आधारित_ फ़ाइलें (“अनुमत फ़ाइलें” देखें)
- `.clawhubignore` (प्रकाशन के लिए अनदेखा पैटर्न, लेगेसी `.clawdhubignore`)
- `.gitignore` (इसका भी सम्मान किया जाता है)

## GitHub आयात

वेब GitHub आयातक स्थानीय प्रकाशन/सिंक से अधिक सख्त है। यह केवल साइन-इन किए हुए GitHub खाते के स्वामित्व वाली सार्वजनिक, नॉन-फोर्क रिपॉज़िटरी में `SKILL.md` या लेगेसी `skills.md` फ़ाइलें खोजता है। यह निजी रिपॉज़िटरी, फोर्क, आर्काइव/अक्षम रिपॉज़िटरी, या तृतीय-पक्ष सार्वजनिक रिपॉज़िटरी आयात नहीं करता।

स्थानीय इंस्टॉल मेटाडेटा (CLI द्वारा लिखा गया):

- `<skill>/.clawhub/origin.json` (लेगेसी `.clawdhub`)

वर्कडिर इंस्टॉल स्थिति (CLI द्वारा लिखी गई):

- `<workdir>/.clawhub/lock.json` (लेगेसी `.clawdhub`)

## `SKILL.md`

- वैकल्पिक YAML frontmatter के साथ Markdown।
- सर्वर प्रकाशन के दौरान frontmatter से मेटाडेटा निकालता है।
- `description` UI/खोज में कौशल सारांश के रूप में उपयोग किया जाता है।

## Frontmatter मेटाडेटा

कौशल मेटाडेटा आपकी `SKILL.md` के शीर्ष पर YAML frontmatter में घोषित किया जाता है। यह रजिस्ट्री (और सुरक्षा विश्लेषण) को बताता है कि आपके कौशल को चलने के लिए क्या चाहिए।

### बुनियादी frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### रनटाइम मेटाडेटा (`metadata.openclaw`)

अपने कौशल की रनटाइम आवश्यकताएँ `metadata.openclaw` के अंतर्गत घोषित करें (उपनाम: `metadata.clawdbot`, `metadata.clawdis`)।

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

उन environment variables के लिए `requires.env` उपयोग करें जो कौशल चलने से पहले मौजूद होने चाहिए। प्रति-variable मेटाडेटा चाहिए हो, जिसमें `required: false` वाले वैकल्पिक variables भी शामिल हैं, तो `envVars` उपयोग करें।

### पूर्ण फ़ील्ड संदर्भ

| फ़ील्ड              | प्रकार       | विवरण                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | आपके कौशल द्वारा अपेक्षित आवश्यक environment variables।                                                                                           |
| `requires.bins`    | `string[]` | CLI binaries जिनका सभी इंस्टॉल होना आवश्यक है।                                                                                                     |
| `requires.anyBins` | `string[]` | CLI binaries जिनमें से कम से कम एक मौजूद होना चाहिए।                                                                                                  |
| `requires.config`  | `string[]` | वे कॉन्फ़िग फ़ाइल पथ जिन्हें आपका कौशल पढ़ता है।                                                                                                          |
| `primaryEnv`       | `string`   | आपके कौशल के लिए मुख्य credential env var।                                                                                                  |
| `envVars`          | `array`    | `name`, वैकल्पिक `required`, और वैकल्पिक `description` के साथ environment variable घोषणाएँ। वैकल्पिक env vars के लिए `required: false` सेट करें। |
| `always`           | `boolean`  | यदि `true` है, तो कौशल हमेशा सक्रिय रहता है (स्पष्ट इंस्टॉल की आवश्यकता नहीं)।                                                                              |
| `skillKey`         | `string`   | कौशल की invocation key को ओवरराइड करें।                                                                                                         |
| `emoji`            | `string`   | कौशल के लिए display emoji।                                                                                                                 |
| `homepage`         | `string`   | कौशल के homepage या docs का URL।                                                                                                         |
| `os`               | `string[]` | OS प्रतिबंध (उदाहरण `["macos"]`, `["linux"]`)।                                                                                             |
| `install`          | `array`    | dependencies के लिए इंस्टॉल specs (नीचे देखें)।                                                                                                  |
| `nix`              | `object`   | Nix Plugin spec (README देखें)।                                                                                                                |
| `config`           | `object`   | Clawdbot कॉन्फ़िग spec (README देखें)।                                                                                                           |

### इंस्टॉल specs

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

समर्थित इंस्टॉल प्रकार: `brew`, `node`, `go`, `uv`।

### वैकल्पिक environment variables

वैकल्पिक environment variables को `metadata.openclaw.envVars` के अंतर्गत घोषित करें और `required: false` सेट करें। `requires.env` में वैकल्पिक entries न जोड़ें, क्योंकि `requires.env` का मतलब है कि कौशल उनके बिना नहीं चल सकता।

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

ClawHub का सुरक्षा विश्लेषण जाँचता है कि आपका कौशल जो घोषित करता है, वह वास्तव में किए जाने वाले काम से मेल खाता है। यदि आपका code `TODOIST_API_KEY` को संदर्भित करता है, लेकिन आपका frontmatter इसे `requires.env`, `primaryEnv`, या `envVars` के अंतर्गत घोषित नहीं करता, तो विश्लेषण मेटाडेटा mismatch को flag करेगा। घोषणाओं को सटीक रखने से आपका कौशल review पास करने में मदद मिलती है और users को यह समझने में मदद मिलती है कि वे क्या इंस्टॉल कर रहे हैं।

### उदाहरण: पूर्ण frontmatter

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

प्रकाशन द्वारा केवल “टेक्स्ट-आधारित” फ़ाइलें स्वीकार की जाती हैं।

- Extension allowlist `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) में है।
- अपलोड के बाद भी script files स्कैन की जाती हैं; PowerShell `.ps1`, `.psm1`, और `.psd1` फ़ाइलें टेक्स्ट के रूप में स्वीकार की जाती हैं।
- `text/` से शुरू होने वाले content types को टेक्स्ट माना जाता है; साथ में एक छोटी allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG) है।

सीमाएँ (सर्वर-साइड):

- कुल bundle आकार: 50MB।
- Embedding text में `SKILL.md` + लगभग 40 तक non-`.md` फ़ाइलें शामिल हैं (सर्वोत्तम-प्रयास सीमा)।

## Slugs

- डिफ़ॉल्ट रूप से फ़ोल्डर नाम से निकाले जाते हैं।
- Package scopes को ClawHub publisher handle से बिल्कुल मेल खाना चाहिए। Publisher handles lowercase अक्षर, संख्याएँ, hyphens, dots, और underscores उपयोग कर सकते हैं; उन्हें lowercase अक्षर या संख्या से शुरू और समाप्त होना चाहिए।
- Package slugs lowercase और npm-सुरक्षित होने चाहिए, उदाहरण के लिए `@example.tools/demo-plugin` या `demo-plugin`।

## Versioning + tags

- प्रत्येक प्रकाशन एक नया version (semver) बनाता है।
- Tags किसी version की string pointers हैं; `latest` आम तौर पर उपयोग किया जाता है।

## License

- ClawHub पर प्रकाशित सभी कौशल `MIT-0` के अंतर्गत licensed हैं।
- कोई भी प्रकाशित कौशलों का उपयोग, संशोधन, और पुनर्वितरण कर सकता है, व्यावसायिक रूप से भी।
- Attribution आवश्यक नहीं है।
- `SKILL.md` में conflicting license terms न जोड़ें; ClawHub प्रति-कौशल license overrides का समर्थन नहीं करता।

## Paid skills

- ClawHub paid skills, प्रति-कौशल pricing, paywalls, या revenue sharing का समर्थन नहीं करता।
- `SKILL.md` में pricing metadata न जोड़ें; यह कौशल प्रारूप का हिस्सा नहीं है और प्रकाशित कौशल को paid नहीं बनाएगा।
- यदि आपका कौशल किसी paid तृतीय-पक्ष सेवा से integrate करता है, तो बाहरी लागत और आवश्यक account को कौशल निर्देशों और env घोषणाओं में स्पष्ट रूप से document करें (आवश्यक variables के लिए `requires.env`, या वैकल्पिक variables के लिए `required: false` के साथ `envVars`)।
