---
read_when:
    - रनटाइम पर सीक्रेट रेफ़रेंस को फिर से रिज़ॉल्व करना
    - प्लेनटेक्स्ट अवशेषों और अनसुलझे संदर्भों की जाँच करना
    - SecretRefs को कॉन्फ़िगर करना और एकतरफ़ा स्क्रब परिवर्तन लागू करना
summary: '`openclaw secrets` के लिए CLI संदर्भ (रीलोड, ऑडिट, कॉन्फ़िगर, लागू करना)'
title: गोपनीय जानकारियाँ
x-i18n:
    generated_at: "2026-07-16T14:15:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

SecretRefs प्रबंधित करें और सक्रिय रनटाइम स्नैपशॉट को स्वस्थ बनाए रखें।

| कमांड     | भूमिका                                                                                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | Gateway RPC (`secrets.reload`): रेफ़रेंस को फिर से रिज़ॉल्व करता है और केवल पूर्ण सफलता पर रनटाइम स्नैपशॉट बदलता है (कोई कॉन्फ़िगरेशन लेखन नहीं)                                                                      |
| `audit`     | प्लेनटेक्स्ट, अनरिज़ॉल्व्ड रेफ़रेंस और प्राथमिकता विचलन के लिए कॉन्फ़िगरेशन/प्रमाणीकरण/जनरेटेड-मॉडल स्टोर और पुराने अवशेषों का केवल-पठन स्कैन (जब तक `--allow-exec` न हो, exec रेफ़रेंस छोड़ दिए जाते हैं)                      |
| `configure` | प्रोवाइडर सेटअप, लक्ष्य मैपिंग और प्रीफ़्लाइट के लिए इंटरैक्टिव प्लानर (TTY आवश्यक है)                                                                                                       |
| `apply`     | सहेजी गई योजना निष्पादित करता है (`--dry-run` केवल सत्यापन करता है और डिफ़ॉल्ट रूप से exec जाँच छोड़ देता है; लेखन मोड exec वाली योजनाओं को तब तक अस्वीकार करता है, जब तक `--allow-exec` न हो), फिर लक्षित प्लेनटेक्स्ट अवशेषों को मिटाता है |

अनुशंसित ऑपरेटर चक्र:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

यदि आपकी योजना में `exec` SecretRefs/प्रोवाइडर शामिल हैं, तो ड्राई-रन और लेखन वाले दोनों `apply` कमांड पर `--allow-exec` पास करें।

CI/गेट के लिए एग्ज़िट कोड:

- `audit --check` निष्कर्ष मिलने पर `1` लौटाता है।
- अनरिज़ॉल्व्ड रेफ़रेंस `2` लौटाते हैं (`--check` से निरपेक्ष)।

संबंधित: [सीक्रेट प्रबंधन](/hi/gateway/secrets) · [SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface) · [सुरक्षा](/hi/gateway/security)

## रनटाइम स्नैपशॉट पुनः लोड करें

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Gateway RPC विधि `secrets.reload` का उपयोग करता है। यदि रिज़ॉल्यूशन विफल होता है, तो Gateway अपना अंतिम ज्ञात-सही स्नैपशॉट बनाए रखता है और त्रुटि लौटाता है (कोई आंशिक सक्रियण नहीं)। JSON प्रतिक्रिया में `warningCount` शामिल होता है।

विकल्प: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`।

## ऑडिट

निम्न के लिए OpenClaw स्थिति को स्कैन करता है:

- प्लेनटेक्स्ट सीक्रेट भंडारण
- अनरिज़ॉल्व्ड रेफ़रेंस
- प्राथमिकता विचलन (`auth-profiles.json` क्रेडेंशियल द्वारा `openclaw.json` रेफ़रेंस को ओवरराइड करना)
- जनरेटेड `agents/*/agent/models.json` अवशेष (प्रोवाइडर `apiKey` मान और संवेदनशील प्रोवाइडर हेडर)
- पुराने अवशेष (पुराने प्रमाणीकरण स्टोर की प्रविष्टियाँ, OAuth रिमाइंडर)

संवेदनशील प्रोवाइडर हेडर की पहचान नाम-आधारित ह्यूरिस्टिक पर आधारित है: यह ऐसे हेडर चिह्नित करता है जिनका नाम सामान्य प्रमाणीकरण/क्रेडेंशियल अंशों (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`) से मेल खाता है।

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

रिपोर्ट संरचना:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- निष्कर्ष कोड: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## कॉन्फ़िगर करें (इंटरैक्टिव सहायक)

प्रोवाइडर और SecretRef परिवर्तनों को इंटरैक्टिव रूप से बनाएँ, प्रीफ़्लाइट चलाएँ और वैकल्पिक रूप से लागू करें:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

प्रवाह: पहले प्रोवाइडर सेटअप (`secrets.providers` उपनाम जोड़ें/संपादित करें/हटाएँ), फिर क्रेडेंशियल मैपिंग (फ़ील्ड चुनें, `{source, provider, id}` रेफ़रेंस निर्दिष्ट करें), फिर प्रीफ़्लाइट और वैकल्पिक लागूकरण।

फ़्लैग:

- `--providers-only`: केवल `secrets.providers` कॉन्फ़िगर करें, क्रेडेंशियल मैपिंग छोड़ें
- `--skip-provider-setup`: प्रोवाइडर सेटअप छोड़ें, क्रेडेंशियल को मौजूदा प्रोवाइडर से मैप करें
- `--agent <id>`: `auth-profiles.json` लक्ष्य खोज और लेखन को एक एजेंट स्टोर तक सीमित करें
- `--allow-exec`: प्रीफ़्लाइट/लागूकरण के दौरान exec SecretRef जाँच की अनुमति दें (प्रोवाइडर कमांड निष्पादित हो सकते हैं)

`--providers-only` और `--skip-provider-setup` को एक साथ उपयोग नहीं किया जा सकता।

नोट्स:

- इंटरैक्टिव TTY आवश्यक है।
- चयनित एजेंट दायरे के लिए `openclaw.json` और `auth-profiles.json` में सीक्रेट वाले फ़ील्ड को लक्षित करता है; मानक समर्थित सतह: [SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface)।
- पिकर प्रवाह में सीधे नई `auth-profiles.json` मैपिंग बनाने का समर्थन करता है।
- लागू करने से पहले प्रीफ़्लाइट रिज़ॉल्यूशन चलाता है।
- जनरेटेड योजनाओं में मिटाने के विकल्प डिफ़ॉल्ट रूप से सक्षम होते हैं (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`)। मिटाए गए प्लेनटेक्स्ट मानों के लिए लागूकरण एकतरफ़ा है।
- `--apply` के बिना भी CLI प्रीफ़्लाइट के बाद `Apply this plan now?` पूछता है।
- `--apply` के साथ (और `--yes` के बिना), CLI अपरिवर्तनीय माइग्रेशन की एक अतिरिक्त पुष्टि माँगता है।
- `--json` योजना + प्रीफ़्लाइट रिपोर्ट प्रिंट करता है, लेकिन फिर भी इंटरैक्टिव TTY आवश्यक है।

### Exec प्रोवाइडर सुरक्षा

Homebrew इंस्टॉलेशन अक्सर `/opt/homebrew/bin/*` के अंतर्गत सिमलिंक किए गए बाइनरी उपलब्ध कराते हैं। विश्वसनीय पैकेज-मैनेजर पथों के लिए आवश्यकता होने पर ही `allowSymlinkCommand: true` सेट करें और इसे `trustedDirs` (उदाहरण के लिए `["/opt/homebrew"]`) के साथ उपयोग करें। Windows पर, यदि किसी प्रोवाइडर पथ के लिए ACL सत्यापन उपलब्ध नहीं है, तो OpenClaw बंद-सुरक्षित रूप से विफल होता है; केवल विश्वसनीय पथों के लिए पथ सुरक्षा जाँच को बायपास करने हेतु उस प्रोवाइडर पर `allowInsecurePath: true` सेट करें।

## सहेजी गई योजना लागू करें

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` फ़ाइलें लिखे बिना प्रीफ़्लाइट सत्यापित करता है; ड्राई-रन में exec SecretRef जाँच डिफ़ॉल्ट रूप से छोड़ दी जाती है। जब तक `--allow-exec` न हो, लेखन मोड exec SecretRefs/प्रोवाइडर वाली योजनाओं को अस्वीकार करता है। किसी भी मोड में exec प्रोवाइडर जाँच/निष्पादन स्वीकार करने के लिए `--allow-exec` का उपयोग करें।

`apply` निम्न को अपडेट कर सकता है:

- `openclaw.json` (SecretRef लक्ष्य + प्रोवाइडर अपसर्ट/हटाना)
- `auth-profiles.json` (प्रोवाइडर-लक्ष्य मिटाना)
- पुराने `auth.json` अवशेष
- `~/.openclaw/.env` की ज्ञात सीक्रेट कुंजियाँ, जिनके मान माइग्रेट किए गए थे

योजना अनुबंध का विवरण (अनुमत लक्ष्य पथ, सत्यापन नियम, विफलता व्यवहार): [सीक्रेट लागूकरण योजना अनुबंध](/hi/gateway/secrets-plan-contract)।

### रोलबैक बैकअप क्यों नहीं हैं

`secrets apply` जानबूझकर पुराने प्लेनटेक्स्ट मानों वाले रोलबैक बैकअप नहीं लिखता। सुरक्षा सख़्त प्रीफ़्लाइट और लगभग परमाण्विक लागूकरण से आती है, जिसमें विफलता पर सर्वोत्तम-प्रयास इन-मेमोरी पुनर्स्थापना होती है।

## उदाहरण

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

यदि `audit --check` अब भी प्लेनटेक्स्ट निष्कर्ष रिपोर्ट करता है, तो शेष रिपोर्ट किए गए लक्ष्य पथ अपडेट करें और ऑडिट फिर से चलाएँ।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [सीक्रेट प्रबंधन](/hi/gateway/secrets)
- [Vault SecretRefs](/plugins/vault)
