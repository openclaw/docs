---
read_when:
    - '`openclaw secrets apply` योजनाएँ बनाना या उनकी समीक्षा करना'
    - '`Invalid plan target path` त्रुटियों की डीबगिंग'
    - लक्ष्य प्रकार और पथ सत्यापन के व्यवहार को समझना
summary: '`secrets apply` योजनाओं के लिए अनुबंध: लक्ष्य सत्यापन, पथ मिलान, और `auth-profiles.json` लक्ष्य का दायरा'
title: सीक्रेट्स लागू करने की योजना का अनुबंध
x-i18n:
    generated_at: "2026-07-16T15:02:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

यह पृष्ठ `openclaw secrets apply` द्वारा लागू किए गए सख्त अनुबंध को परिभाषित करता है। यदि कोई लक्ष्य इन नियमों से मेल नहीं खाता, तो किसी भी फ़ाइल में बदलाव करने से पहले लागू करने की प्रक्रिया विफल हो जाती है।

## योजना फ़ाइल की संरचना

`openclaw secrets apply --from <plan.json>` योजना लक्ष्यों की एक `targets` सरणी अपेक्षित करता है:

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

`openclaw secrets configure` इसी संरचना में योजनाएँ बनाता है। आप स्वयं भी कोई योजना लिख या संपादित कर सकते हैं।

## प्रदाता अपसर्ट और विलोपन

योजनाओं में दो वैकल्पिक शीर्ष-स्तरीय फ़ील्ड भी शामिल हो सकते हैं, जो प्रत्येक लक्ष्य के लेखन के साथ `secrets.providers` मैप में बदलाव करते हैं:

- `providerUpserts` -- प्रदाता उपनाम द्वारा कुंजीबद्ध एक ऑब्जेक्ट। प्रत्येक मान एक प्रदाता परिभाषा है (वही संरचना जो `openclaw.json` में `secrets.providers.<alias>` के अंतर्गत स्वीकार की जाती है, जैसे कोई `exec` या `file` प्रदाता)।
- `providerDeletes` -- हटाए जाने वाले प्रदाता उपनामों की एक सरणी।

`providerUpserts`, `targets` से पहले चलता है, इसलिए कोई `target.ref.provider` ऐसे प्रदाता उपनाम को संदर्भित कर सकता है जिसे वही योजना `providerUpserts` में प्रस्तुत करती है। इस क्रम के बिना, `openclaw.json` में अभी तक कॉन्फ़िगर न किए गए उपनाम को संदर्भित करने वाली योजनाएँ `provider "<alias>" is not configured` के साथ विफल हो जाती हैं।

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

`providerUpserts` के माध्यम से प्रस्तुत किए गए Exec प्रदाता अब भी [Exec प्रदाता की सहमति का व्यवहार](#exec-provider-consent-behavior) में दिए गए Exec सहमति नियमों के अधीन हैं: Exec प्रदाताओं वाली योजनाओं को लेखन मोड में `--allow-exec` की आवश्यकता होती है।

## समर्थित लक्ष्य दायरा

[SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface) में दिए गए समर्थित क्रेडेंशियल पथों के लिए योजना लक्ष्य स्वीकार किए जाते हैं।

## लक्ष्य प्रकार का व्यवहार

`target.type` एक मान्यता-प्राप्त लक्ष्य प्रकार होना चाहिए और सामान्यीकृत `target.path` उस प्रकार की पंजीकृत पथ संरचना से मेल खाना चाहिए।

कुछ लक्ष्य प्रकार अपने प्रामाणिक प्रकार नाम के अतिरिक्त, मौजूदा योजनाओं के लिए `target.type` के रूप में एक संगतता उपनाम स्वीकार करते हैं:

| प्रामाणिक प्रकार                       | स्वीकृत उपनाम                                  |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## पथ सत्यापन नियम

प्रत्येक लक्ष्य को निम्नलिखित सभी नियमों के अनुसार सत्यापित किया जाता है:

- `type` एक मान्यता-प्राप्त लक्ष्य प्रकार होना चाहिए।
- `path` एक गैर-रिक्त डॉट पथ होना चाहिए।
- `pathSegments` को छोड़ा जा सकता है। यदि दिया गया हो, तो सामान्यीकरण के बाद यह बिल्कुल `path` वाले पथ के समान होना चाहिए।
- निषिद्ध खंड अस्वीकार कर दिए जाते हैं: `__proto__`, `prototype`, `constructor`।
- सामान्यीकृत पथ लक्ष्य प्रकार की पंजीकृत पथ संरचना से मेल खाना चाहिए।
- यदि `providerId` या `accountId` सेट हो, तो उसे पथ में एन्कोड किए गए आईडी से मेल खाना चाहिए।
- `auth-profiles.json` लक्ष्यों के लिए `agentId` आवश्यक है।
- नई `auth-profiles.json` मैपिंग बनाते समय `authProfileProvider` शामिल करें।

## विफलता का व्यवहार

यदि कोई लक्ष्य सत्यापन में विफल होता है, तो लागू करने की प्रक्रिया इस प्रकार की त्रुटि के साथ समाप्त होती है:

```text
models.providers.apiKey के लिए अमान्य योजना लक्ष्य पथ: models.providers.openai.baseUrl
```

अमान्य योजना के लिए कोई लेखन प्रतिबद्ध नहीं किया जाता: लक्ष्य समाधान और पथ सत्यापन किसी भी फ़ाइल को छूने से पहले चलते हैं। इसके अतिरिक्त, जब कोई मान्य योजना लेखन शुरू करती है, तो लागू करने की प्रक्रिया पहले प्रत्येक प्रभावित फ़ाइल का स्नैपशॉट बनाती है और यदि उसी संचालन के दौरान बाद का कोई लेखन विफल हो जाए, तो उन स्नैपशॉट को पुनर्स्थापित करती है। इसलिए आंशिक लेखन कभी भी कॉन्फ़िगरेशन, प्रमाणीकरण प्रोफ़ाइल या परिवेश स्थिति के बीच असंगति नहीं छोड़ता।

## Exec प्रदाता की सहमति का व्यवहार

- `--dry-run` डिफ़ॉल्ट रूप से Exec SecretRef जाँचों को छोड़ देता है।
- Exec SecretRefs/प्रदाताओं वाली योजनाएँ लेखन मोड में तब तक अस्वीकार की जाती हैं, जब तक `--allow-exec` सेट न हो।
- Exec वाली योजनाओं का सत्यापन/प्रयोग करते समय ड्राई-रन और लेखन, दोनों कमांड में `--allow-exec` पास करें।

## रनटाइम और ऑडिट दायरे संबंधी टिप्पणियाँ

- केवल-संदर्भ `auth-profiles.json` प्रविष्टियाँ (`keyRef`/`tokenRef`) रनटाइम क्रेडेंशियल समाधान और ऑडिट कवरेज में शामिल होती हैं।
- `secrets apply` समर्थित `openclaw.json` लक्ष्य, समर्थित `auth-profiles.json` लक्ष्य और तीन वैकल्पिक स्क्रब चरण लिखता है, जिनमें से प्रत्येक डिफ़ॉल्ट रूप से चालू होता है: `scrubEnv` (`.env` से माइग्रेट किए गए प्लेनटेक्स्ट मान हटाता है), `scrubAuthProfilesForProviderTargets` (योजना द्वारा अभी-अभी माइग्रेट किए गए प्रदाताओं के लिए `auth-profiles.json` में प्लेनटेक्स्ट/अप्रयुक्त-संदर्भ अवशेष साफ़ करता है), और `scrubLegacyAuthJson` (लेगेसी `auth.json` स्टोर से माइग्रेट की गई `api_key` प्रविष्टियाँ हटाता है)। उस चरण को छोड़ने के लिए योजना में `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets`, `options.scrubLegacyAuthJson` में से किसी को भी `false` पर सेट करें।

## ऑपरेटर जाँचें

```bash
# बिना लेखन के योजना सत्यापित करें
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# फिर वास्तव में लागू करें
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Exec वाली योजनाओं के लिए दोनों मोड में स्पष्ट रूप से सहमति दें
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

यदि लागू करने की प्रक्रिया अमान्य लक्ष्य पथ संदेश के साथ विफल होती है, तो `openclaw secrets configure` से योजना दोबारा बनाएँ या लक्ष्य पथ को ऊपर दी गई किसी समर्थित संरचना के अनुसार ठीक करें।

## संबंधित दस्तावेज़

- [सीक्रेट प्रबंधन](/hi/gateway/secrets)
- [CLI `secrets`](/hi/cli/secrets)
- [SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface)
- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)
