---
read_when:
    - किसी स्किल या Plugin को प्रकाशित करना
    - स्वामी या पैकेज स्कोप त्रुटियों की डिबगिंग
    - प्रकाशन UI, CLI, या बैकएंड व्यवहार जोड़ना
summary: Skills, Plugin, स्वामियों, scopes, रिलीज़ और समीक्षा के लिए ClawHub प्रकाशन कैसे काम करता है।
x-i18n:
    generated_at: "2026-06-28T22:45:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# प्रकाशन

प्रकाशन आपके चुने हुए स्वामी के अंतर्गत किसी skill फ़ोल्डर या plugin पैकेज को ClawHub पर भेजता है। ClawHub जांचता है कि आपका टोकन उस स्वामी के लिए प्रकाशित कर सकता है, metadata, नाम, संस्करण, फ़ाइलें और source जानकारी को validate करता है, फिर release को संग्रहीत करता है और स्वचालित सुरक्षा जांच शुरू करता है।

यदि validation विफल होता है, तो कुछ भी प्रकाशित नहीं होता। नए releases सामान्य install और download surfaces से तब तक बाहर भी रह सकते हैं जब तक review पूरा नहीं हो जाता।

## Skills

सबसे सरल प्रकाशन पथ CLI है। साइन इन करें, फिर एक local skill फ़ोल्डर प्रकाशित करें:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

किसी org स्वामी पर प्रकाशित करते समय `--owner <handle>` का उपयोग करें। authenticated user के रूप में प्रकाशित करने के लिए इसे छोड़ दें। प्रकाशन अपरिवर्तित content को छोड़ देता है। एक नया skill `1.0.0` से शुरू होता है, और बाद के बदलाव स्वतः अगला patch संस्करण प्रकाशित करते हैं। `--version` केवल तब पास करें जब आपको स्पष्ट संस्करण चाहिए।

catalog repos के लिए, ClawHub के reusable
[`skill-publish.yml` workflow](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
का उपयोग करें। यह `root` के अंतर्गत प्रत्येक immediate skill फ़ोल्डर के लिए `skill publish` कॉल करता है (default:
`skills`), या केवल `skill_path` के रूप में दिए गए फ़ोल्डर के लिए।

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

प्रकाशित किए बिना नए और बदले हुए skills का preview करने के लिए `dry_run: true` का उपयोग करें।

## Plugins

Plugins npm-style package names का उपयोग करते हैं। scoped package names में नाम के पहले भाग में स्वामी शामिल होता है:

```text
@owner/package-name
```

scope चयनित publish स्वामी से मेल खाना चाहिए। यदि आपके package का नाम `@openclaw/dronzer` है, तो इसे केवल `@openclaw` के रूप में प्रकाशित किया जा सकता है। यदि आप `@vintageayu` के रूप में प्रकाशित करते हैं, तो package का नाम बदलकर `@vintageayu/dronzer` करें।

यह किसी package को ऐसे org namespace का दावा करने से रोकता है जिसे publisher नियंत्रित नहीं करता।

यदि आप किसी org, brand, package scope, owner handle, या namespace के rightful owner हैं जो ClawHub पर पहले से claim या reserve किया गया है, तो public, non-sensitive proof के साथ एक
[Org / Namespace Claim issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
खोलें। क्या शामिल करना है और public issues से क्या बाहर रखना है, इसके लिए
[Org और Namespace Claims](/hi/clawhub/namespace-claims) देखें।

### Plugin प्रकाशित करने से पहले

- ऐसा स्वामी चुनें जो package scope से मेल खाता हो।
- `openclaw.plugin.json` शामिल करें। code plugins को `openclaw.compat.pluginApi` और `openclaw.build.openclawVersion` के साथ `package.json` भी चाहिए।
- custom plugin card icon दिखाने के लिए, किसी भी HTTPS image URL के साथ `openclaw.plugin.json` में `icon` जोड़ें।
- source repository और exact commit metadata शामिल करें, या GitHub-backed checkout से CLI का उपयोग करें ताकि यह उन्हें detect कर सके।
- प्रकाशित करने से पहले `clawhub package validate <source>` चलाएं। package, manifest, SDK import, या artifact findings के लिए,
  [Plugin validation fixes](/hi/clawhub/plugin-validation-fixes) देखें।
- release बनाने से पहले `clawhub package publish <source> --dry-run` चलाएं।
- नए releases के public install surfaces से बाहर रहने की अपेक्षा करें जब तक automated security checks और verification पूरा न हो जाए।

### Packages के लिए trusted publishing

Package trusted publishing दो-चरणीय setup है:

1. सामान्य manual या token-authenticated `clawhub package publish` के माध्यम से package को एक बार प्रकाशित करें। यह package row बनाता है और उन package managers को स्थापित करता है जो इसकी trusted publisher config बदल सकते हैं।
2. एक package manager GitHub Actions trusted publisher config set करता है:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

config set होने के बाद, future supported GitHub Actions publishes repository में long-lived ClawHub token संग्रहीत किए बिना OIDC/trusted publishing का उपयोग कर सकते हैं। configured repository और workflow filename GitHub Actions OIDC claim से मेल खाने चाहिए। यदि आप `--environment <name>` भी पास करते हैं, तो GitHub Actions environment claim को उस नाम से exact match करना होगा।

trusted publisher config set होने पर ClawHub configured GitHub repository को verify करता है। Public repositories को public GitHub metadata के माध्यम से verify किया जा सकता है। Private repositories के लिए ClawHub को उस repository तक GitHub access चाहिए, उदाहरण के लिए future ClawHub GitHub App installation या किसी अन्य authorized GitHub integration के माध्यम से।

current reusable package publish workflow `workflow_dispatch` publishes के लिए secretless trusted publishing support करता है जब `id-token: write` उपलब्ध हो। Tag-push real publishes को अभी भी `clawhub_token` चाहिए, इसलिए tag releases, first publishes, untrusted packages, या break-glass publishes के लिए `CLAWHUB_TOKEN` उपलब्ध रखें।

config inspect या remove करें:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

trusted publisher config हटाना rollback path है। यह future trusted publish token minting को तब तक disable करता है जब तक कोई package manager फिर से config set नहीं करता।

## FAQ

### Package scope चयनित स्वामी से मेल खाना चाहिए

यदि package scope और चयनित स्वामी मेल नहीं खाते, तो ClawHub publish को reject करता है:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

इसे ठीक करने के लिए, या तो package scope द्वारा named स्वामी चुनें, या package का नाम बदलें ताकि scope उस स्वामी से मेल खाए जिसके रूप में आप publish कर सकते हैं।

यदि package name में पहले से सही scope है लेकिन package गलत publisher के स्वामित्व में है, तो ownership transfer करें:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

package या skill transfer का उपयोग केवल तब करें जब आपके पास current owner और destination publisher दोनों का admin access हो। Package transfer आपको ऐसे scope में publish करने की अनुमति नहीं देता जिसे आप manage नहीं कर सकते।

यदि आपके पास current owner तक access नहीं है लेकिन आपको लगता है कि आपका org, project, या brand rightful namespace owner है, तो staff review के लिए public, non-sensitive proof के साथ एक
[Org / Namespace Claim issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
खोलें। file करने से पहले
[Org और Namespace Claims](/hi/clawhub/namespace-claims) देखें।

यह org namespaces की रक्षा करता है। `@openclaw/dronzer` नाम का package `@openclaw` namespace का दावा करता है, इसलिए केवल `@openclaw` स्वामी तक access रखने वाले publishers ही इसे publish कर सकते हैं।
