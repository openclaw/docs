---
read_when:
    - '`openclaw secrets apply` योजनाएँ बनाना या उनकी समीक्षा करना'
    - '`Invalid plan target path` त्रुटियों की डीबगिंग'
    - लक्ष्य प्रकार और पथ सत्यापन के व्यवहार को समझना
summary: '`secrets apply` योजनाओं के लिए अनुबंध: लक्ष्य सत्यापन, पथ मिलान, और `auth-profiles.json` लक्ष्य दायरा'
title: सीक्रेट्स लागू करने की योजना का अनुबंध
x-i18n:
    generated_at: "2026-07-19T09:28:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71ee8afd958646930af4db3bbad08e033ff79da48890a989d72b361abcbda3bb
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

यह पृष्ठ `openclaw secrets apply` द्वारा लागू किए गए सख्त अनुबंध को परिभाषित करता है। यदि कोई लक्ष्य इन नियमों से मेल नहीं खाता, तो किसी भी फ़ाइल को बदलने से पहले लागू करने की प्रक्रिया विफल हो जाती है।

## योजना फ़ाइल की आवश्यकताएँ

`openclaw secrets apply --from <plan.json>` अधिकतम 16 MiB (16,777,216 bytes) आकार की सामान्य फ़ाइलें स्वीकार करता है। यह सीमा रिक्त स्थान सहित संपूर्ण क्रमबद्ध फ़ाइल पर लागू होती है। JSON पार्सिंग या लक्ष्य सत्यापन से पहले डायरेक्टरी, FIFO, डिवाइस फ़ाइलें और सीमा से बड़ी फ़ाइलें अस्वीकार कर दी जाती हैं।

`openclaw secrets configure --plan-out <plan.json>` फ़ाइल बनाने से पहले UTF-8 में क्रमबद्ध आउटपुट पर भी यही सीमा लागू करता है। हस्तलिखित योजनाओं और बाहरी योजना जनरेटरों को भी क्रमबद्ध फ़ाइल को इस सीमा के भीतर रखना होगा।

## योजना फ़ाइल की संरचना

`openclaw secrets apply --from <plan.json>` योजना लक्ष्यों की `targets` सरणी अपेक्षित करता है:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

`openclaw secrets configure` इसी संरचना में योजनाएँ जनरेट करता है। आप स्वयं भी कोई योजना लिख या संपादित कर सकते हैं।

## प्रदाता अपसर्ट और विलोपन

योजनाओं में दो वैकल्पिक शीर्ष-स्तरीय फ़ील्ड भी हो सकती हैं, जो प्रत्येक लक्ष्य के लेखन के साथ-साथ `secrets.providers` मैप को बदलती हैं:

- `providerUpserts` -- प्रदाता उपनाम के आधार पर कुंजीबद्ध एक ऑब्जेक्ट। प्रत्येक मान एक प्रदाता परिभाषा है (`openclaw.json` में `secrets.providers.<alias>` के अंतर्गत स्वीकार की जाने वाली वही संरचना, उदाहरण के लिए कोई `exec` या `file` प्रदाता)।
- `providerDeletes` -- हटाए जाने वाले प्रदाता उपनामों की एक सरणी।

`providerUpserts`, `targets` से पहले चलता है, इसलिए कोई `target.ref.provider` उस प्रदाता उपनाम को संदर्भित कर सकता है जिसे वही योजना `providerUpserts` में प्रस्तुत करती है। इस क्रम के बिना, `openclaw.json` में अभी तक कॉन्फ़िगर न किए गए उपनाम को संदर्भित करने वाली योजनाएँ `provider "<alias>" is not configured` के साथ विफल हो जाती हैं।

```json5
{
  version: 1,
  protocolVersion: 1,
  providerUpserts: {
    onepassword_anthropic: {
      source: "exec",
      command: "/usr/bin/op",
      args: ["read", "op://Vault/Anthropic/credential"],
    },
  },
  providerDeletes: ["legacy_unused_alias"],
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.anthropic.apiKey",
      pathSegments: ["models", "providers", "anthropic", "apiKey"],
      providerId: "anthropic",
      ref: { source: "exec", provider: "onepassword_anthropic", id: "credential" },
    },
  ],
}
```

`providerUpserts` के माध्यम से प्रस्तुत किए गए Exec प्रदाता अब भी [Exec प्रदाता सहमति व्यवहार](#exec-provider-consent-behavior) के Exec सहमति नियमों के अधीन हैं: Exec प्रदाताओं वाली योजनाओं के लिए लेखन मोड में `--allow-exec` आवश्यक है।

## समर्थित लक्ष्य दायरा

[SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface) में दिए गए समर्थित क्रेडेंशियल पथों के लिए योजना लक्ष्य स्वीकार किए जाते हैं।

## लक्ष्य प्रकार का व्यवहार

`target.type` एक मान्य लक्ष्य प्रकार होना चाहिए और सामान्यीकृत `target.path` को उस प्रकार की पंजीकृत पथ संरचना से मेल खाना चाहिए।

कुछ लक्ष्य प्रकार अपनी विहित प्रकार नाम के अतिरिक्त, मौजूदा योजनाओं के लिए `target.type` के रूप में एक संगतता उपनाम स्वीकार करते हैं:

| विहित प्रकार                       | स्वीकार्य उपनाम                                  |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## पथ सत्यापन नियम

प्रत्येक लक्ष्य को निम्नलिखित सभी नियमों के अनुसार सत्यापित किया जाता है:

- `type` एक मान्य लक्ष्य प्रकार होना चाहिए।
- `path` एक गैर-रिक्त डॉट पथ होना चाहिए।
- `pathSegments` को छोड़ा जा सकता है। यदि दिया गया हो, तो सामान्यीकरण के बाद यह ठीक उसी पथ में बदलना चाहिए जो `path` में है।
- निषिद्ध खंड अस्वीकार किए जाते हैं: `__proto__`, `prototype`, `constructor`।
- सामान्यीकृत पथ को लक्ष्य प्रकार की पंजीकृत पथ संरचना से मेल खाना चाहिए।
- यदि `providerId` या `accountId` सेट है, तो इसे पथ में एन्कोड की गई आईडी से मेल खाना चाहिए।
- `auth-profiles.json` लक्ष्यों के लिए `agentId` आवश्यक है।
- नया `auth-profiles.json` मैपिंग बनाते समय `authProfileProvider` शामिल करें।

## विफलता व्यवहार

यदि कोई लक्ष्य सत्यापन में विफल होता है, तो लागू करने की प्रक्रिया इस तरह की त्रुटि के साथ समाप्त होती है:

```text
models.providers.apiKey के लिए अमान्य योजना लक्ष्य पथ: models.providers.openai.baseUrl
```

अमान्य योजना के लिए कोई लेखन प्रतिबद्ध नहीं किया जाता: किसी भी फ़ाइल को छूने से पहले लक्ष्य समाधान और पथ सत्यापन चलाए जाते हैं। इसके अतिरिक्त, जब कोई मान्य योजना लिखना शुरू करती है, तो लागू करने की प्रक्रिया पहले प्रत्येक प्रभावित फ़ाइल का स्नैपशॉट लेती है और यदि उसी रन में बाद का कोई लेखन विफल हो जाए, तो उन स्नैपशॉट को पुनर्स्थापित कर देती है। इसलिए आंशिक लेखन कभी भी कॉन्फ़िगरेशन, प्रमाणीकरण प्रोफ़ाइल या परिवेश स्थिति को असंगत नहीं छोड़ता।

## Exec प्रदाता सहमति व्यवहार

- `--dry-run` डिफ़ॉल्ट रूप से Exec SecretRef जाँचों को छोड़ देता है।
- Exec SecretRef/प्रदाताओं वाली योजनाएँ लेखन मोड में तब तक अस्वीकार की जाती हैं, जब तक `--allow-exec` सेट न हो।
- Exec वाली योजनाओं का सत्यापन/अनुप्रयोग करते समय ड्राई-रन और लेखन, दोनों कमांड में `--allow-exec` पास करें।

## रनटाइम और ऑडिट दायरे संबंधी टिप्पणियाँ

- केवल-संदर्भ `auth-profiles.json` प्रविष्टियाँ (`keyRef`/`tokenRef`) रनटाइम क्रेडेंशियल समाधान और ऑडिट कवरेज में शामिल हैं।
- `secrets apply` समर्थित `openclaw.json` लक्ष्यों, समर्थित `auth-profiles.json` लक्ष्यों और तीन वैकल्पिक सफ़ाई चरणों को लिखता है, जिनमें से प्रत्येक डिफ़ॉल्ट रूप से चालू होता है: `scrubEnv` (प्रभावी स्थिति और सक्रिय-कॉन्फ़िगरेशन डायरेक्टरियों की `.env` फ़ाइलों से माइग्रेट किए गए प्लेनटेक्स्ट मान हटाता है), `scrubAuthProfilesForProviderTargets` (योजना द्वारा अभी-अभी माइग्रेट किए गए प्रदाताओं के लिए `auth-profiles.json` में मौजूद प्लेनटेक्स्ट/अप्रयुक्त-संदर्भ अवशेष हटाता है), और `scrubLegacyAuthJson` (पुराने `auth.json` स्टोर से माइग्रेट की गई `api_key` प्रविष्टियाँ हटाता है)। उस चरण को छोड़ने के लिए योजना में `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets`, `options.scrubLegacyAuthJson` में से संबंधित मान को `false` पर सेट करें।

## ऑपरेटर जाँच

```bash
# बिना लिखे योजना सत्यापित करें
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# फिर वास्तव में लागू करें
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Exec वाली योजनाओं के लिए दोनों मोड में स्पष्ट रूप से सहमति दें
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

यदि लागू करने की प्रक्रिया अमान्य लक्ष्य पथ संदेश के साथ विफल होती है, तो `openclaw secrets configure` से योजना दोबारा जनरेट करें या लक्ष्य पथ को ऊपर दी गई किसी समर्थित संरचना के अनुसार ठीक करें।

## संबंधित दस्तावेज़

- [सीक्रेट प्रबंधन](/hi/gateway/secrets)
- [CLI `secrets`](/hi/cli/secrets)
- [SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface)
- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)
