---
read_when:
    - auth प्रोफ़ाइल समाधान या क्रेडेंशियल रूटिंग पर काम करना
    - मॉडल प्रमाणीकरण विफलताओं या प्रोफ़ाइल क्रम की डिबगिंग
summary: प्रमाणीकरण प्रोफ़ाइलों के लिए कैनोनिकल क्रेडेंशियल पात्रता और रिज़ॉल्यूशन सिमैंटिक्स
title: प्रमाणीकरण क्रेडेंशियल सेमांटिक्स
x-i18n:
    generated_at: "2026-06-28T22:32:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 591c0384e1d43512252aaa7b362141b6bc93183b30b5847168758f86127f0663
    source_path: auth-credential-semantics.md
    workflow: 16
---

यह दस्तावेज़ इन जगहों पर उपयोग किए जाने वाले मानक क्रेडेंशियल पात्रता और समाधान सेमांटिक्स परिभाषित करता है:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

लक्ष्य selection-time और runtime व्यवहार को संरेखित रखना है।

## स्थिर probe reason codes

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Token credentials

Token credentials (`type: "token"`) inline `token` और/या `tokenRef` का समर्थन करते हैं।

### पात्रता नियम

1. जब `token` और `tokenRef` दोनों अनुपस्थित हों, तब token profile अपात्र होता है।
2. `expires` वैकल्पिक है।
3. यदि `expires` मौजूद है, तो यह `0` से बड़ा finite number होना चाहिए।
4. यदि `expires` अमान्य है (`NaN`, `0`, negative, non-finite, या wrong type), तो profile `invalid_expires` के साथ अपात्र होता है।
5. यदि `expires` भूतकाल में है, तो profile `expired` के साथ अपात्र होता है।
6. `tokenRef`, `expires` validation को bypass नहीं करता।

### समाधान नियम

1. `expires` के लिए Resolver semantics, eligibility semantics से मेल खाते हैं।
2. पात्र profiles के लिए, token material inline value या `tokenRef` से resolve किया जा सकता है।
3. Unresolvable refs `models status --probe` output में `unresolved_ref` उत्पन्न करते हैं।

## Agent copy portability

Agent auth inheritance read-through है। जब किसी agent के पास local profile नहीं होता, तो वह runtime पर default/main agent store से profiles resolve कर सकता है, बिना secret material को अपने `auth-profiles.json` में copy किए।

Explicit copy flows, जैसे `openclaw agents add`, यह portability policy उपयोग करते हैं:

- `api_key` profiles portable हैं, जब तक `copyToAgents: false` न हो।
- `token` profiles portable हैं, जब तक `copyToAgents: false` न हो।
- `oauth` profiles default रूप से portable नहीं हैं, क्योंकि refresh tokens single-use या rotation-sensitive हो सकते हैं।
- Provider-owned OAuth flows केवल तब `copyToAgents: true` के साथ opt in कर सकते हैं, जब agents के बीच refresh material copy करना known safe हो।

Non-portable profiles read-through inheritance के माध्यम से उपलब्ध रहते हैं, जब तक target agent अलग से sign in करके अपना local profile नहीं बनाता।

## Config-only auth routes

`mode: "aws-sdk"` वाली `auth.profiles` entries routing metadata हैं, stored credentials नहीं। वे तब valid होती हैं जब target provider `models.providers.<id>.auth: "aws-sdk"` या plugin-owned Amazon Bedrock setup AWS SDK route उपयोग करता है। ये profile ids `auth.order` और session overrides में दिख सकते हैं, भले ही `auth-profiles.json` में matching entry मौजूद न हो।

`auth-profiles.json` में `type: "aws-sdk"` न लिखें। यदि किसी legacy install में ऐसा marker है, तो `openclaw doctor --fix` उसे `auth.profiles` में move करता है और credential store से marker हटाता है।

## स्पष्ट auth order filtering

- जब किसी provider के लिए `auth.order.<provider>` या auth-store order override set हो, तो `models status --probe` केवल उन profile ids को probe करता है जो उस provider के resolved auth order में बने रहते हैं।
- उस provider के लिए stored profile, जिसे explicit order से omit किया गया है, बाद में silently try नहीं किया जाता। Probe output उसे `reasonCode: excluded_by_auth_order` और detail `Excluded by auth.order for this provider.` के साथ report करता है।

## Probe target resolution

- Probe targets auth profiles, environment credentials, या `models.json` से आ सकते हैं।
- यदि किसी provider के पास credentials हैं लेकिन OpenClaw उसके लिए probeable model candidate resolve नहीं कर सकता, तो `models status --probe` `reasonCode: no_model` के साथ `status: no_model` report करता है।

## External CLI credential discovery

- External CLIs के स्वामित्व वाले Runtime-only credentials केवल तब discover किए जाते हैं जब provider, runtime, या auth profile current operation के scope में हो, या जब उस external source के लिए stored local profile पहले से मौजूद हो।
- Auth-store callers को explicit external-CLI discovery mode चुनना चाहिए: केवल persisted/plugin auth के लिए `none`, पहले से stored external CLI profiles को refresh करने के लिए `existing`, या concrete provider/profile set के लिए `scoped`।
- Read-only/status paths `allowKeychainPrompt: false` pass करते हैं; वे केवल file-backed external CLI credentials उपयोग करते हैं और macOS Keychain results को read या reuse नहीं करते।

## OAuth SecretRef Policy Guard

- SecretRef input केवल static credentials के लिए है।
- यदि profile credential `type: "oauth"` है, तो उस profile credential material के लिए SecretRef objects समर्थित नहीं हैं।
- यदि `auth.profiles.<id>.mode` `"oauth"` है, तो उस profile के लिए SecretRef-backed `keyRef`/`tokenRef` input reject किया जाता है।
- Violations startup/reload auth resolution paths में hard failures हैं।

## Legacy-Compatible Messaging

Script compatibility के लिए, probe errors की यह पहली line अपरिवर्तित रहती है:

`Auth profile credentials are missing or expired.`

Human-friendly detail और stable reason codes बाद की lines में जोड़े जा सकते हैं।

## संबंधित

- [Secrets management](/hi/gateway/secrets)
- [Auth storage](/hi/concepts/oauth)
