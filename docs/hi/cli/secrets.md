---
read_when:
    - रनटाइम पर सीक्रेट रेफ़रेंसों को फिर से हल करना
    - प्लेनटेक्स्ट अवशेषों और अनसुलझे संदर्भों का ऑडिट करना
    - SecretRefs को कॉन्फ़िगर करना और एकतरफ़ा स्क्रब परिवर्तन लागू करना
summary: '`openclaw secrets` के लिए CLI संदर्भ (पुनः लोड करें, ऑडिट करें, कॉन्फ़िगर करें, लागू करें)'
title: रहस्य
x-i18n:
    generated_at: "2026-07-19T08:24:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61f6f81e358ca2e6a97ac9498186b32f7a74d16052d226c398dad0030d47211e
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

SecretRefs प्रबंधित करें और सक्रिय रनटाइम स्नैपशॉट को स्वस्थ बनाए रखें।

| कमांड     | भूमिका                                                                                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | Gateway RPC (`secrets.reload`): refs को फिर से रिज़ॉल्व करता है और owner-aware रनटाइम स्नैपशॉट को परमाण्विक रूप से प्रकाशित करता है (कोई कॉन्फ़िगरेशन लेखन नहीं); योग्य owner विफलताएँ cold या stale चेतावनियों के रूप में प्रकाशित हो सकती हैं |
| `audit`     | प्लेनटेक्स्ट, अनरिज़ॉल्व्ड refs और precedence drift के लिए config/auth/generated-model स्टोर तथा legacy अवशेषों का केवल-पढ़ने योग्य स्कैन (जब तक `--allow-exec` न हो, exec refs छोड़ दिए जाते हैं)                      |
| `configure` | provider सेटअप, लक्ष्य मैपिंग और preflight के लिए इंटरैक्टिव प्लानर (TTY आवश्यक)                                                                                                       |
| `apply`     | सहेजी गई योजना निष्पादित करता है (`--dry-run` केवल सत्यापन करता है और डिफ़ॉल्ट रूप से exec जाँच छोड़ देता है; जब तक `--allow-exec` न हो, लेखन मोड exec वाली योजनाओं को अस्वीकार करता है), फिर लक्षित प्लेनटेक्स्ट अवशेष साफ़ करता है |

अनुशंसित ऑपरेटर चक्र:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

यदि आपकी योजना में `exec` SecretRefs/providers शामिल हैं, तो dry-run और लेखन वाले दोनों `apply` कमांड पर `--allow-exec` पास करें।

CI/gates के लिए एग्ज़िट कोड:

- `audit --check` निष्कर्ष मिलने पर `1` लौटाता है।
- अनरिज़ॉल्व्ड refs `2` लौटाते हैं (`--check` की परवाह किए बिना)।

संबंधित: [सीक्रेट प्रबंधन](/hi/gateway/secrets) · [SecretRef क्रेडेंशियल सरफ़ेस](/hi/reference/secretref-credential-surface) · [सुरक्षा](/hi/gateway/security)

## रनटाइम स्नैपशॉट पुनः लोड करें

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Gateway RPC विधि `secrets.reload` का उपयोग करता है। स्वस्थ owner स्वतंत्र रूप से रीफ़्रेश होते हैं। योग्य विफल owner केवल तभी stale होते हैं, जब उनकी ref पहचानें, provider परिभाषाएँ और पूर्ण गैर-सीक्रेट owner अनुबंध अपरिवर्तित हों; नई या बदली हुई विफलताएँ cold हो जाती हैं। यह degraded सक्रियण सफल होता है और `warningCount` रिपोर्ट करता है। strict या अनमैप्ड विफलताएँ त्रुटि लौटाती हैं और पहले से सक्रिय स्नैपशॉट सुरक्षित रखती हैं।

विकल्प: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`।

## ऑडिट

इनके लिए OpenClaw स्थिति स्कैन करता है:

- प्लेनटेक्स्ट सीक्रेट भंडारण
- अनरिज़ॉल्व्ड refs
- precedence drift (`auth-profiles.json` क्रेडेंशियल द्वारा `openclaw.json` refs को ओवरराइड करना)
- जनरेट किए गए `agents/*/agent/models.json` अवशेष (provider `apiKey` मान और संवेदनशील provider हेडर)
- legacy अवशेष (legacy auth स्टोर प्रविष्टियाँ, OAuth अनुस्मारक)

`.env` स्कैन प्रभावी स्थिति डायरेक्टरी और सक्रिय config वाली डायरेक्टरी को कवर करता है। जब दोनों पथ एक ही फ़ाइल को इंगित करते हैं, तो उसे एक बार स्कैन किया जाता है।

संवेदनशील provider हेडर की पहचान नाम-आधारित heuristic पर आधारित है: यह उन हेडर को फ़्लैग करती है जिनका नाम सामान्य auth/क्रेडेंशियल अंशों (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`) से मेल खाता है।

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

रिपोर्ट का स्वरूप:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- निष्कर्ष कोड: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## कॉन्फ़िगर करें (इंटरैक्टिव सहायक)

provider और SecretRef बदलाव इंटरैक्टिव रूप से बनाएँ, preflight चलाएँ और वैकल्पिक रूप से लागू करें:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

प्रवाह: पहले provider सेटअप (`secrets.providers` aliases जोड़ें/संपादित करें/हटाएँ), फिर क्रेडेंशियल मैपिंग (फ़ील्ड चुनें, `{source, provider, id}` refs असाइन करें), उसके बाद preflight और वैकल्पिक apply।

फ़्लैग:

- `--providers-only`: केवल `secrets.providers` कॉन्फ़िगर करें, क्रेडेंशियल मैपिंग छोड़ें
- `--skip-provider-setup`: provider सेटअप छोड़ें, क्रेडेंशियल को मौजूदा providers से मैप करें
- `--agent <id>`: `auth-profiles.json` लक्ष्य खोज और लेखन का दायरा एक agent स्टोर तक सीमित करें
- `--allow-exec`: preflight/apply के दौरान exec SecretRef जाँच की अनुमति दें (provider कमांड निष्पादित हो सकते हैं)

`--providers-only` और `--skip-provider-setup` को एक साथ उपयोग नहीं किया जा सकता।

टिप्पणियाँ:

- इंटरैक्टिव TTY आवश्यक है।
- चुने गए agent दायरे के लिए `openclaw.json` और `auth-profiles.json` में सीक्रेट वाले फ़ील्ड को लक्षित करता है; मानक समर्थित सरफ़ेस: [SecretRef क्रेडेंशियल सरफ़ेस](/hi/reference/secretref-credential-surface)।
- picker प्रवाह में सीधे नए `auth-profiles.json` मैपिंग बनाने का समर्थन करता है।
- apply से पहले preflight रिज़ॉल्यूशन चलाता है।
- जनरेट की गई योजनाओं में डिफ़ॉल्ट रूप से scrub विकल्प सक्षम होते हैं (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`)। scrub किए गए प्लेनटेक्स्ट मानों के लिए apply एकतरफ़ा है।
- `--plan-out` ऐसी योजना बनाने से इनकार करता है जिसका UTF-8 क्रमबद्ध रूप 16 MiB (16,777,216 bytes) से अधिक हो, जो `apply --from` इनपुट सीमा के अनुरूप है।
- `--apply` के बिना, CLI फिर भी preflight के बाद `Apply this plan now?` पूछता है।
- `--apply` के साथ (और `--yes` के बिना), CLI अपरिवर्तनीय माइग्रेशन के लिए एक अतिरिक्त पुष्टि माँगता है।
- `--json` योजना + preflight रिपोर्ट प्रिंट करता है, लेकिन फिर भी इंटरैक्टिव TTY आवश्यक है।

### Exec provider सुरक्षा

Homebrew इंस्टॉल अक्सर `/opt/homebrew/bin/*` के अंतर्गत symlink किए गए binaries उपलब्ध कराते हैं। विश्वसनीय package-manager पथों के लिए आवश्यकता होने पर ही `allowSymlinkCommand: true` सेट करें और इसे `trustedDirs` के साथ जोड़ें (उदाहरण के लिए `["/opt/homebrew"]`)। Windows पर, यदि किसी provider पथ के लिए ACL सत्यापन उपलब्ध नहीं है, तो OpenClaw सुरक्षित रूप से विफल हो जाता है; केवल विश्वसनीय पथों के लिए पथ सुरक्षा जाँच को बायपास करने हेतु उस provider पर `allowInsecurePath: true` सेट करें।

## सहेजी गई योजना लागू करें

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` फ़ाइलें लिखे बिना preflight सत्यापित करता है; dry-run में exec SecretRef जाँच डिफ़ॉल्ट रूप से छोड़ दी जाती है। लेखन मोड exec SecretRefs/providers वाली योजनाओं को अस्वीकार करता है, जब तक `--allow-exec` न हो। किसी भी मोड में exec provider जाँच/निष्पादन के लिए सहमति देने हेतु `--allow-exec` का उपयोग करें।

`--from` को 16 MiB (16,777,216 bytes) से बड़ी न होने वाली नियमित फ़ाइल की ओर इंगित करना चाहिए। byte सीमा whitespace सहित पूरी serialized फ़ाइल पर लागू होती है।

`apply` क्या अपडेट कर सकता है:

- `openclaw.json` (SecretRef लक्ष्य + provider upserts/deletes)
- `auth-profiles.json` (provider-target scrubbing)
- legacy `auth.json` अवशेष
- प्रभावी स्थिति और सक्रिय-config डायरेक्टरियों में `.env` फ़ाइलें, उन ज्ञात सीक्रेट keys के लिए जिनके मान माइग्रेट किए गए थे

योजना अनुबंध का विवरण (अनुमत लक्ष्य पथ, सत्यापन नियम, विफलता semantics): [सीक्रेट लागू करने की योजना का अनुबंध](/hi/gateway/secrets-plan-contract)।

### रोलबैक बैकअप क्यों नहीं हैं

`secrets apply` जानबूझकर पुराने प्लेनटेक्स्ट मानों वाले रोलबैक बैकअप नहीं लिखता। सुरक्षा सख़्त preflight और लगभग-परमाण्विक apply से मिलती है, जिसमें विफलता पर best-effort इन-मेमोरी पुनर्स्थापना होती है।

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
