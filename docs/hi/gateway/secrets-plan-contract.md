---
read_when:
    - '`openclaw secrets apply` योजनाएँ जनरेट करना या उनकी समीक्षा करना'
    - '`Invalid plan target path` त्रुटियों को डीबग करना'
    - लक्ष्य प्रकार और पथ सत्यापन व्यवहार को समझना
summary: '`secrets apply` योजनाओं के लिए अनुबंध: लक्ष्य सत्यापन, पथ मिलान, और `auth-profiles.json` लक्ष्य दायरा'
title: सीक्रेट्स लागू करने की योजना का अनुबंध
x-i18n:
    generated_at: "2026-06-28T23:13:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

यह पेज `openclaw secrets apply` द्वारा लागू किए गए सख्त अनुबंध को परिभाषित करता है।

यदि कोई लक्ष्य इन नियमों से मेल नहीं खाता, तो कॉन्फ़िगरेशन बदलने से पहले apply विफल हो जाता है।

## प्लान फ़ाइल का आकार

`openclaw secrets apply --from <plan.json>` प्लान लक्ष्यों की `targets` array की अपेक्षा करता है:

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

## Provider upserts और deletes

प्लान में दो वैकल्पिक शीर्ष-स्तरीय फ़ील्ड भी शामिल हो सकते हैं, जो प्रति-लक्ष्य writes के साथ
`secrets.providers` map को बदलते हैं:

- `providerUpserts` — provider alias के आधार पर keyed object. हर value एक
  provider definition है (वही आकार जो `openclaw.json` में
  `secrets.providers.<alias>` के तहत स्वीकार किया जाता है, जैसे कोई `exec` या `file`
  provider).
- `providerDeletes` — हटाए जाने वाले provider aliases की array.

`providerUpserts`, `targets` से पहले चलता है, इसलिए कोई `target.ref.provider`
ऐसे provider alias को संदर्भित कर सकता है जिसे वही प्लान
`providerUpserts` में पेश करता है। इसके बिना, ऐसे प्लान जो ऐसे alias को संदर्भित करते हैं जो अभी
`openclaw.json` में कॉन्फ़िगर नहीं है, `provider "<alias>" is not
configured` के साथ विफल हो जाते हैं।

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

`providerUpserts` के माध्यम से पेश किए गए exec providers अभी भी
[Exec provider consent behavior](#exec-provider-consent-behavior) में दिए गए
exec consent नियमों के अधीन हैं:
exec providers वाले प्लान के लिए write mode में `--allow-exec` आवश्यक है।

## समर्थित लक्ष्य scope

प्लान लक्ष्य इन समर्थित credential paths के लिए स्वीकार किए जाते हैं:

- [SecretRef Credential Surface](/hi/reference/secretref-credential-surface)

## लक्ष्य type व्यवहार

सामान्य नियम:

- `target.type` पहचाना हुआ होना चाहिए और normalized `target.path` shape से मेल खाना चाहिए।

मौजूदा प्लान के लिए compatibility aliases स्वीकार किए जाते रहेंगे:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Path validation नियम

हर लक्ष्य को निम्नलिखित सभी के साथ validate किया जाता है:

- `type` एक पहचाना हुआ target type होना चाहिए।
- `path` एक non-empty dot path होना चाहिए।
- `pathSegments` छोड़ा जा सकता है। यदि दिया गया हो, तो उसे `path` के बिल्कुल उसी path में normalize होना चाहिए।
- निषिद्ध segments अस्वीकार किए जाते हैं: `__proto__`, `prototype`, `constructor`.
- normalized path को target type के लिए registered path shape से मेल खाना चाहिए।
- यदि `providerId` या `accountId` सेट है, तो उसे path में encoded id से मेल खाना चाहिए।
- `auth-profiles.json` targets के लिए `agentId` आवश्यक है।
- नया `auth-profiles.json` mapping बनाते समय, `authProfileProvider` शामिल करें।

## विफलता व्यवहार

यदि कोई लक्ष्य validation में विफल होता है, तो apply इस तरह की error के साथ exit करता है:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

invalid plan के लिए कोई writes commit नहीं किए जाते।

## Exec provider consent व्यवहार

- `--dry-run` default रूप से exec SecretRef checks को skip करता है।
- exec SecretRefs/providers वाले प्लान write mode में अस्वीकार किए जाते हैं, जब तक `--allow-exec` सेट न हो।
- exec-containing plans validate/apply करते समय, dry-run और write commands दोनों में `--allow-exec` pass करें।

## Runtime और audit scope notes

- Ref-only `auth-profiles.json` entries (`keyRef`/`tokenRef`) runtime resolution और audit coverage में शामिल हैं।
- `secrets apply` समर्थित `openclaw.json` targets, समर्थित `auth-profiles.json` targets, और वैकल्पिक scrub targets लिखता है।

## Operator checks

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

यदि apply invalid target path message के साथ विफल होता है, तो `openclaw secrets configure` के साथ प्लान फिर से generate करें या target path को ऊपर दिए गए समर्थित shape में ठीक करें।

## संबंधित docs

- [Secrets Management](/hi/gateway/secrets)
- [CLI `secrets`](/hi/cli/secrets)
- [SecretRef Credential Surface](/hi/reference/secretref-credential-surface)
- [Configuration Reference](/hi/gateway/configuration-reference)
