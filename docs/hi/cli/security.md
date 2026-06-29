---
read_when:
    - आप config/state पर एक त्वरित सुरक्षा ऑडिट चलाना चाहते हैं
    - आप सुरक्षित "सुधार" सुझाव लागू करना चाहते हैं (अनुमतियाँ, डिफ़ॉल्ट को अधिक सख़्त करना)
summary: '`openclaw security` के लिए CLI संदर्भ (सामान्य सुरक्षा चूकों का ऑडिट और सुधार)'
title: सुरक्षा
x-i18n:
    generated_at: "2026-06-28T22:52:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

सुरक्षा टूल्स (ऑडिट + वैकल्पिक सुधार)।

संबंधित:

- सुरक्षा गाइड: [सुरक्षा](/hi/gateway/security)

## ऑडिट

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

सादा `security audit` ठंडे config/filesystem/read-only पथ पर रहता है। यह डिफ़ॉल्ट रूप से Plugin runtime सुरक्षा कलेक्टरों को खोजता नहीं है, इसलिए नियमित ऑडिट हर इंस्टॉल किए गए Plugin runtime को लोड नहीं करते। सर्वोत्तम-प्रयास लाइव Gateway प्रोब और Plugin-स्वामित्व वाले सुरक्षा ऑडिट कलेक्टर शामिल करने के लिए `--deep` का उपयोग करें; स्पष्ट आंतरिक कॉलर भी उन Plugin-स्वामित्व वाले कलेक्टरों में ऑप्ट इन कर सकते हैं जब उनके पास पहले से उपयुक्त runtime scope हो।

जब कई DM प्रेषक मुख्य सत्र साझा करते हैं, तो ऑडिट चेतावनी देता है और **सुरक्षित DM मोड** की सिफारिश करता है: साझा inbox के लिए `session.dmScope="per-channel-peer"` (या multi-account channels के लिए `per-account-channel-peer`)।
यह cooperative/shared inbox hardening के लिए है। परस्पर अविश्वसनीय/विरोधी operators द्वारा साझा किया गया एकल Gateway अनुशंसित setup नहीं है; अलग gateways (या अलग OS users/hosts) के साथ trust boundaries को विभाजित करें।
जब config संभावित साझा-user ingress का संकेत देता है (उदाहरण के लिए खुली DM/group policy, configured group targets, या wildcard sender rules), तो यह `security.trust_model.multi_user_heuristic` भी emit करता है, और याद दिलाता है कि OpenClaw डिफ़ॉल्ट रूप से personal-assistant trust model है।
जानबूझकर shared-user setups के लिए, ऑडिट guidance है कि सभी sessions को sandbox करें, filesystem access को workspace-scoped रखें, और personal/private identities या credentials को उस runtime से दूर रखें।
जब छोटे models (`<=300B`) sandboxing के बिना और web/browser tools enabled के साथ उपयोग किए जाते हैं, तो यह चेतावनी भी देता है।
Webhook ingress के लिए, startup एक non-fatal security warning log करता है और audit active Gateway shared-secret auth values के `hooks.token` reuse को flag करता है, जिसमें `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` और `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` शामिल हैं। यह तब भी चेतावनी देता है जब:

- `hooks.token` छोटा हो
- `hooks.path="/"`
- `hooks.defaultSessionKey` unset हो
- `hooks.allowedAgentIds` unrestricted हो
- request `sessionKey` overrides enabled हों
- overrides `hooks.allowedSessionKeyPrefixes` के बिना enabled हों

अगर Gateway password auth केवल startup पर supplied है, तो वही value `openclaw security audit --auth password --password <password>` को pass करें ताकि audit उसे `hooks.token` के विरुद्ध check कर सके।
persisted reused `hooks.token` को rotate करने के लिए `openclaw doctor --fix` चलाएं, फिर external hook senders को नया hook token उपयोग करने के लिए update करें।

जब sandbox mode off होने पर sandbox Docker settings configured हों, जब `gateway.nodes.denyCommands` ineffective pattern-like/unknown entries का उपयोग करे (केवल exact Node command-name matching, shell-text filtering नहीं), जब `gateway.nodes.allowCommands` dangerous Node commands को explicitly enable करे, जब global `tools.profile="minimal"` agent tool profiles द्वारा overridden हो, जब write/edit tools disabled हों लेकिन constraining sandbox filesystem boundary के बिना `exec` अभी भी available हो, जब open DMs या groups sandbox/workspace guards के बिना runtime/filesystem tools expose करें, और जब installed Plugin tools permissive tool policy के तहत reachable हो सकते हों, तो यह चेतावनी भी देता है।
यह `gateway.allowRealIpFallback=true` (proxies misconfigured होने पर header-spoofing risk) और `discovery.mdns.mode="full"` (mDNS TXT records के जरिए metadata leakage) को भी flag करता है।
जब sandbox browser Docker `bridge` network का उपयोग `sandbox.browser.cdpSourceRange` के बिना करता है, तो यह चेतावनी भी देता है।
यह dangerous sandbox Docker network modes (जिसमें `host` और `container:*` namespace joins शामिल हैं) को भी flag करता है।
जब मौजूदा sandbox browser Docker containers में missing/stale hash labels हों (उदाहरण के लिए pre-migration containers में `openclaw.browserConfigEpoch` missing हो), तो यह चेतावनी भी देता है और `openclaw sandbox recreate --browser --all` की सिफारिश करता है।
जब npm-based Plugin/hook install records unpinned हों, integrity metadata missing हो, या currently installed package versions से drift हों, तो यह चेतावनी भी देता है।
जब channel allowlists stable IDs के बजाय mutable names/emails/tags पर निर्भर हों, तो यह चेतावनी देता है (जहां लागू हो वहां Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC scopes)।
जब `gateway.auth.mode="none"` Gateway HTTP APIs को shared secret के बिना reachable छोड़ देता है (`/tools/invoke` और कोई भी enabled `/v1/*` endpoint), तो यह चेतावनी देता है।
`dangerous`/`dangerously` prefix वाली settings explicit break-glass operator overrides हैं; इनमें से एक को enable करना अपने आप में security vulnerability report नहीं है।
पूरी dangerous-parameter inventory के लिए, [सुरक्षा](/hi/gateway/security) में "असुरक्षित या dangerous flags summary" section देखें।

जानबूझकर standing findings को `security.audit.suppressions` के साथ accept किया जा सकता है।
हर suppression एक exact `checkId` से match करता है और
`titleIncludes` और/या `detailIncludes` case-insensitive substrings के साथ narrow किया जा सकता है:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

Suppressed findings को active `summary` और `findings` list से हटा दिया जाता है।
JSON output auditability के लिए उन्हें `suppressedFindings` के अंतर्गत रखता है।
जब suppressions configured हों, active output एक unsuppressible
`security.audit.suppressions.active` info finding भी रखता है ताकि readers जान सकें कि audit
filtered था। Dangerous config flags हर finding में एक flag के रूप में emit होते हैं, इसलिए
एक dangerous flag को accept करने से उसी
`config.insecure_or_dangerous_flags` checkId को share करने वाले अन्य enabled flags hide नहीं होते।
क्योंकि suppressions standing risk को hide कर सकते हैं, उन्हें
agent-run shell commands के जरिए जोड़ने या हटाने के लिए exec approval चाहिए, जब तक exec पहले से trusted local automation के लिए
`security="full"` और `ask="off"` के साथ running न हो।

SecretRef behavior:

- `security audit` अपने targeted paths के लिए supported SecretRefs को read-only mode में resolve करता है।
- अगर current command path में कोई SecretRef unavailable है, तो audit जारी रहता है और crash करने के बजाय `secretDiagnostics` report करता है।
- `--token` और `--password` केवल उस command invocation के लिए deep-probe auth override करते हैं; वे config या SecretRef mappings को rewrite नहीं करते।

## JSON output

CI/policy checks के लिए `--json` का उपयोग करें:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

अगर `--fix` और `--json` combine किए जाते हैं, तो output में fix actions और final report दोनों शामिल होते हैं:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` क्या बदलता है

`--fix` सुरक्षित, deterministic remediations apply करता है:

- common `groupPolicy="open"` को `groupPolicy="allowlist"` में flip करता है (supported channels में account variants सहित)
- जब WhatsApp group policy `allowlist` में flip होती है, तो stored `allowFrom` file से `groupAllowFrom` seed करता है
  जब वह list मौजूद हो और config पहले से
  `allowFrom` define न करता हो
- `logging.redactSensitive` को `"off"` से `"tools"` पर set करता है
- state/config और common sensitive files के लिए permissions tighten करता है
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- `openclaw.json` से referenced config include files को भी tighten करता है
- POSIX hosts पर `chmod` और Windows पर `icacls` resets का उपयोग करता है

`--fix` यह **नहीं** करता:

- tokens/passwords/API keys rotate करना
- tools (`gateway`, `cron`, `exec`, आदि) disable करना
- gateway bind/auth/network exposure choices बदलना
- plugins/skills हटाना या rewrite करना

## संबंधित

- [CLI reference](/hi/cli)
- [Security audit](/hi/gateway/security)
