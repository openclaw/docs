---
read_when:
    - ऐसी सुविधाएँ जोड़ना जो पहुँच या स्वचालन का दायरा बढ़ाती हैं
summary: AI Gateway को शेल एक्सेस के साथ चलाने के लिए सुरक्षा संबंधी विचार और खतरा मॉडल
title: सुरक्षा
x-i18n:
    generated_at: "2026-06-28T23:13:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d4312e55f369e627a6549e7f11f2c7047f8a8f857ca6d31c5bd1b8c743a6df9
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **व्यक्तिगत सहायक trust model.** यह मार्गदर्शन प्रति gateway एक विश्वसनीय
  operator boundary (single-user, personal-assistant model) मानकर चलता है।
  OpenClaw एक agent या gateway साझा करने वाले कई विरोधी users के लिए
  **hostile multi-tenant security boundary नहीं** है। यदि आपको mixed-trust या
  adversarial-user संचालन चाहिए, तो trust boundaries अलग करें (अलग gateway +
  credentials, आदर्श रूप से अलग OS users या hosts)।
</Warning>

## पहले scope: व्यक्तिगत सहायक security model

OpenClaw security guidance एक **व्यक्तिगत सहायक** deployment मानकर चलती है: एक विश्वसनीय operator boundary, संभावित रूप से कई agents।

- समर्थित security posture: प्रति gateway एक user/trust boundary (बेहतर है प्रति boundary एक OS user/host/VPS)।
- समर्थित security boundary नहीं: परस्पर अविश्वसनीय या adversarial users द्वारा उपयोग किया गया एक साझा gateway/agent।
- यदि adversarial-user isolation आवश्यक है, तो trust boundary के अनुसार अलग करें (अलग gateway + credentials, और आदर्श रूप से अलग OS users/hosts)।
- यदि कई अविश्वसनीय users एक tool-enabled agent को message कर सकते हैं, तो उन्हें उस agent के लिए वही delegated tool authority साझा करते हुए मानें।

यह पृष्ठ **उस model के भीतर** hardening समझाता है। यह एक साझा gateway पर hostile multi-tenant isolation का दावा नहीं करता।

Remote access, DM policy, reverse proxy, या public exposure बदलने से पहले,
[Gateway exposure runbook](/hi/gateway/security/exposure-runbook) को
pre-flight और rollback checklist के रूप में उपयोग करें।

## त्वरित जांच: `openclaw security audit`

यह भी देखें: [Formal Verification (Security Models)](/hi/security/formal-verification)

इसे नियमित रूप से चलाएं (विशेषकर config बदलने या network surfaces expose करने के बाद):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` जानबूझकर सीमित रहता है: यह सामान्य open group
policies को allowlists में बदलता है, `logging.redactSensitive: "tools"` पुनर्स्थापित करता है, state/config/include-file permissions को कड़ा करता है, और Windows पर चलते समय POSIX `chmod` के बजाय Windows ACL resets का उपयोग करता है।

यह सामान्य footguns flag करता है (Gateway auth exposure, browser control exposure, elevated allowlists, filesystem permissions, permissive exec approvals, और open-channel tool exposure)।

OpenClaw एक product भी है और एक experiment भी: आप frontier-model behavior को वास्तविक messaging surfaces और वास्तविक tools से जोड़ रहे हैं। **कोई "perfectly secure" setup नहीं है।** लक्ष्य इन बातों पर सोच-समझकर निर्णय लेना है:

- आपके bot से कौन बात कर सकता है
- bot को कहां act करने की अनुमति है
- bot क्या touch कर सकता है

सबसे छोटे access से शुरू करें जो फिर भी काम करता हो, फिर confidence बढ़ने पर उसे विस्तृत करें।

### Published package dependency lock

OpenClaw source checkouts `pnpm-lock.yaml` का उपयोग करते हैं। प्रकाशित `openclaw` npm
package और OpenClaw-owned npm Plugin packages में `npm-shrinkwrap.json`,
npm का publishable dependency lockfile शामिल होता है, ताकि package installs install time पर fresh graph resolve करने के बजाय release से reviewed transitive dependency graph का उपयोग करें।

Shrinkwrap supply-chain hardening और release reproducibility boundary है,
sandbox नहीं। Plain-English model, maintainer commands, और package
inspection checks के लिए [npm shrinkwrap](/hi/gateway/security/shrinkwrap) देखें।

### Deployment और host trust

OpenClaw मानता है कि host और config boundary trusted हैं:

- यदि कोई Gateway host state/config (`~/.openclaw`, जिसमें `openclaw.json` शामिल है) बदल सकता है, तो उसे trusted operator मानें।
- कई परस्पर अविश्वसनीय/adversarial operators के लिए एक Gateway चलाना **recommended setup नहीं है**।
- Mixed-trust teams के लिए, अलग gateways (या कम से कम अलग OS users/hosts) के साथ trust boundaries अलग करें।
- Recommended default: प्रति machine/host (या VPS) एक user, उस user के लिए एक gateway, और उस gateway में एक या अधिक agents।
- एक Gateway instance के भीतर, authenticated operator access एक trusted control-plane role है, per-user tenant role नहीं।
- Session identifiers (`sessionKey`, session IDs, labels) routing selectors हैं, authorization tokens नहीं।
- यदि कई लोग एक tool-enabled agent को message कर सकते हैं, तो उनमें से हर व्यक्ति उसी permission set को steer कर सकता है। Per-user session/memory isolation privacy में मदद करता है, लेकिन साझा agent को per-user host authorization में नहीं बदलता।

### Secure file operations

OpenClaw root-bounded file access, atomic writes, archive extraction, temp workspaces, और secret-file helpers के लिए `@openclaw/fs-safe` का उपयोग करता है। OpenClaw fs-safe के वैकल्पिक POSIX Python helper को default रूप से **off** रखता है; `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` या `require` केवल तब set करें जब आप अतिरिक्त fd-relative mutation hardening चाहते हों और Python runtime support कर सकते हों।

विवरण: [Secure file operations](/hi/gateway/security/secure-file-operations)।

### Shared Slack workspace: वास्तविक जोखिम

यदि "Slack में हर कोई bot को message कर सकता है," तो मुख्य जोखिम delegated tool authority है:

- कोई भी allowed sender agent की policy के भीतर tool calls (`exec`, browser, network/file tools) induce कर सकता है;
- एक sender से prompt/content injection ऐसी actions करा सकता है जो shared state, devices, या outputs को प्रभावित करें;
- यदि एक shared agent के पास sensitive credentials/files हैं, तो कोई भी allowed sender tool usage के जरिए संभावित रूप से exfiltration drive कर सकता है।

Team workflows के लिए minimal tools वाले अलग agents/gateways उपयोग करें; personal-data agents private रखें।

### Company-shared agent: स्वीकार्य pattern

यह तब स्वीकार्य है जब उस agent का उपयोग करने वाला हर व्यक्ति उसी trust boundary में हो (उदाहरण के लिए एक company team) और agent strictly business-scoped हो।

- इसे dedicated machine/VM/container पर चलाएं;
- उस runtime के लिए dedicated OS user + dedicated browser/profile/accounts उपयोग करें;
- उस runtime को personal Apple/Google accounts या personal password-manager/browser profiles में sign in न करें।

यदि आप उसी runtime पर personal और company identities मिलाते हैं, तो आप separation collapse करते हैं और personal-data exposure risk बढ़ाते हैं।

## Gateway और Node trust concept

Gateway और Node को एक operator trust domain मानें, अलग roles के साथ:

- **Gateway** control plane और policy surface है (`gateway.auth`, tool policy, routing)।
- **Node** उस Gateway से paired remote execution surface है (commands, device actions, host-local capabilities)।
- Gateway के लिए authenticated caller Gateway scope पर trusted है। Pairing के बाद, node actions उस node पर trusted operator actions हैं।
- Operator scope levels और approval-time checks का सारांश
  [Operator scopes](/hi/gateway/operator-scopes) में है।
- Shared gateway token/password से authenticated direct loopback backend clients user
  device identity प्रस्तुत किए बिना internal control-plane RPCs कर सकते हैं।
  यह remote या browser pairing bypass नहीं है: network
  clients, node clients, device-token clients, और explicit device identities
  अब भी pairing और scope-upgrade enforcement से गुजरते हैं।
- `sessionKey` routing/context selection है, per-user auth नहीं।
- Exec approvals (allowlist + ask) operator intent के guardrails हैं, hostile multi-tenant isolation नहीं।
- Trusted single-operator setups के लिए OpenClaw का product default यह है कि `gateway`/`node` पर host exec approval prompts के बिना allowed है (`security="full"`, `ask="off"` जब तक आप इसे tighten न करें)। यह default intentional UX है, अपने आप में vulnerability नहीं।
- Exec approvals exact request context और best-effort direct local file operands से bind होते हैं; वे हर runtime/interpreter loader path को semantically model नहीं करते। Strong boundaries के लिए sandboxing और host isolation उपयोग करें।

यदि आपको hostile-user isolation चाहिए, तो OS user/host के अनुसार trust boundaries अलग करें और अलग gateways चलाएं।

## Trust boundary matrix

Risk triage करते समय इसे quick model के रूप में उपयोग करें:

| Boundary या control                                      | इसका अर्थ                                         | सामान्य गलत पढ़ना                                                             |
| -------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | Gateway APIs पर callers को authenticate करता है   | "Secure होने के लिए हर frame पर per-message signatures चाहिए"                 |
| `sessionKey`                                             | Context/session selection के लिए routing key      | "Session key user auth boundary है"                                           |
| Prompt/content guardrails                                | Model abuse risk घटाते हैं                        | "Prompt injection अकेले auth bypass साबित करता है"                            |
| `canvas.eval` / browser evaluate                         | Enabled होने पर intentional operator capability   | "इस trust model में कोई भी JS eval primitive automatically vuln है"           |
| Local TUI `!` shell                                      | Explicit operator-triggered local execution       | "Local shell convenience command remote injection है"                         |
| Node pairing और node commands                            | Paired devices पर operator-level remote execution | "Remote device control को default रूप से untrusted user access माना जाना चाहिए" |
| `gateway.nodes.pairing.autoApproveCidrs`                 | Opt-in trusted-network node enrollment policy     | "Disabled-by-default allowlist automatic pairing vulnerability है"            |

## Design के अनुसार vulnerabilities नहीं

<Accordion title="सामान्य findings जो scope से बाहर हैं">

ये patterns अक्सर report होते हैं और आम तौर पर no-action के रूप में close किए जाते हैं, जब तक
real boundary bypass demonstrate न हो:

- Policy, auth, या sandbox bypass के बिना prompt-injection-only chains।
- ऐसे claims जो एक shared host या config पर hostile multi-tenant operation मानकर चलते हैं।
- ऐसे claims जो normal operator read-path access (उदाहरण के लिए
  `sessions.list` / `sessions.preview` / `chat.history`) को shared-gateway setup में IDOR के रूप में classify करते हैं।
- Localhost-only deployment findings (उदाहरण के लिए loopback-only
  gateway पर HSTS)।
- Inbound paths के लिए Discord inbound webhook signature findings जो इस repo में
  मौजूद नहीं हैं।
- Reports जो node pairing metadata को `system.run` के लिए hidden second per-command
  approval layer मानते हैं, जबकि वास्तविक execution boundary अब भी
  gateway की global node command policy और node की अपनी exec
  approvals है।
- Reports जो configured `gateway.nodes.pairing.autoApproveCidrs` को अपने आप में
  vulnerability मानते हैं। यह setting default रूप से disabled है, explicit CIDR/IP entries
  मांगती है, केवल first-time `role: node` pairing पर लागू होती है जिसमें
  no requested scopes हों, और operator/browser/Control UI,
  WebChat, role upgrades, scope upgrades, metadata changes, public-key changes,
  या same-host loopback trusted-proxy header paths को auto-approve नहीं करती,
  जब तक loopback trusted-proxy auth explicitly enabled न हो।
- "Missing per-user authorization" findings जो `sessionKey` को
  auth token मानते हैं।

</Accordion>

## 60 seconds में hardened baseline

पहले यह baseline उपयोग करें, फिर trusted agent के अनुसार tools को selectively re-enable करें:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

यह Gateway को local-only रखता है, DMs isolate करता है, और control-plane/runtime tools को default रूप से disable करता है।

## Shared inbox quick rule

यदि एक से अधिक व्यक्ति आपके bot को DM कर सकते हैं:

- `session.dmScope: "per-channel-peer"` सेट करें (या multi-account channels के लिए `"per-account-channel-peer"`).
- `dmPolicy: "pairing"` या सख्त allowlists रखें.
- साझा DMs को व्यापक tool access के साथ कभी न मिलाएं.
- यह cooperative/shared inboxes को मजबूत करता है, लेकिन जब उपयोगकर्ता host/config write access साझा करते हैं, तब इसे hostile co-tenant isolation के रूप में डिज़ाइन नहीं किया गया है.

## Context visibility मॉडल

OpenClaw दो अवधारणाओं को अलग करता है:

- **Trigger authorization**: agent को कौन trigger कर सकता है (`dmPolicy`, `groupPolicy`, allowlists, mention gates).
- **Context visibility**: model input में कौन-सा supplemental context inject किया जाता है (reply body, quoted text, thread history, forwarded metadata).

Allowlists triggers और command authorization को gate करती हैं. `contextVisibility` setting नियंत्रित करती है कि supplemental context (quoted replies, thread roots, fetched history) कैसे filter किया जाता है:

- `contextVisibility: "all"` (default) supplemental context को received रूप में रखता है.
- `contextVisibility: "allowlist"` supplemental context को active allowlist checks द्वारा allowed senders तक filter करता है.
- `contextVisibility: "allowlist_quote"` `allowlist` की तरह व्यवहार करता है, लेकिन फिर भी एक explicit quoted reply रखता है.

`contextVisibility` को प्रति channel या प्रति room/conversation सेट करें. setup विवरण के लिए [Group Chats](/hi/channels/groups#context-visibility-and-allowlists) देखें.

Advisory triage मार्गदर्शन:

- ऐसे दावे जो केवल यह दिखाते हैं कि "model non-allowlisted senders से quoted या historical text देख सकता है", `contextVisibility` से address किए जा सकने वाले hardening findings हैं; ये अपने आप में auth या sandbox boundary bypasses नहीं हैं.
- Security-impacting होने के लिए, reports में अब भी demonstrated trust-boundary bypass (auth, policy, sandbox, approval, या कोई अन्य documented boundary) चाहिए.

## Audit क्या जांचता है (उच्च स्तर)

- **Inbound access** (DM policies, group policies, allowlists): क्या strangers bot को trigger कर सकते हैं?
- **Tool blast radius** (elevated tools + open rooms): क्या prompt injection shell/file/network actions में बदल सकता है?
- **Exec filesystem drift**: क्या mutating filesystem tools denied हैं, जबकि `exec`/`process` sandbox filesystem constraints के बिना उपलब्ध रहते हैं?
- **Exec approval drift** (`security=full`, `autoAllowSkills`, `strictInlineEval` के बिना interpreter allowlists): क्या host-exec guardrails अभी भी वही कर रहे हैं जो आप समझते हैं?
  - `security="full"` एक broad posture warning है, bug का proof नहीं. यह trusted personal-assistant setups के लिए चुना गया default है; इसे केवल तब tighten करें जब आपके threat model को approval या allowlist guardrails की जरूरत हो.
- **Network exposure** (Gateway bind/auth, Tailscale Serve/Funnel, weak/short auth tokens).
- **Browser control exposure** (remote nodes, relay ports, remote CDP endpoints).
- **Local disk hygiene** (permissions, symlinks, config includes, "synced folder" paths).
- **Plugins** (plugins explicit allowlist के बिना load होते हैं).
- **Policy drift/misconfig** (sandbox docker settings configured हैं लेकिन sandbox mode off है; ineffective `gateway.nodes.denyCommands` patterns क्योंकि matching केवल exact command-name है (उदाहरण के लिए `system.run`) और shell text inspect नहीं करती; dangerous `gateway.nodes.allowCommands` entries; global `tools.profile="minimal"` per-agent profiles से overridden है; plugin-owned tools permissive tool policy के तहत reachable हैं).
- **Runtime expectation drift** (उदाहरण के लिए यह मानना कि implicit exec अभी भी `sandbox` का मतलब रखता है जबकि `tools.exec.host` अब default रूप से `auto` है, या sandbox mode off होने पर भी explicitly `tools.exec.host="sandbox"` सेट करना).
- **Model hygiene** (configured models legacy लगें तो warn करें; hard block नहीं).

यदि आप `--deep` चलाते हैं, तो OpenClaw best-effort live Gateway probe भी attempt करता है.

## Credential storage map

Access audit करते समय या क्या back up करना है तय करते समय इसका उपयोग करें:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env या `channels.telegram.tokenFile` (केवल regular file; symlinks rejected)
- **Discord bot token**: config/env या SecretRef (env/file/exec providers)
- **Slack tokens**: config/env (`channels.slack.*`)
- **Pairing allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (default account)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (non-default accounts)
- **Model auth profiles**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Codex runtime state**: `~/.openclaw/agents/<agentId>/agent/codex-home/`
- **File-backed secrets payload (optional)**: `~/.openclaw/secrets.json`
- **Legacy OAuth import**: `~/.openclaw/credentials/oauth.json`

## Security audit checklist

जब audit findings print करे, इसे priority order मानें:

1. **कुछ भी "open" + tools enabled**: पहले DMs/groups को lock down करें (pairing/allowlists), फिर tool policy/sandboxing tighten करें.
2. **Public network exposure** (LAN bind, Funnel, missing auth): तुरंत fix करें.
3. **Browser control remote exposure**: इसे operator access की तरह treat करें (tailnet-only, nodes को deliberately pair करें, public exposure से बचें).
4. **Permissions**: सुनिश्चित करें कि state/config/credentials/auth group/world-readable न हों.
5. **Plugins**: केवल वही load करें जिन पर आप explicitly trust करते हैं.
6. **Model choice**: tools वाले किसी भी bot के लिए modern, instruction-hardened models को prefer करें.

## Security audit glossary

हर audit finding एक structured `checkId` से keyed होती है (उदाहरण के लिए
`gateway.bind_no_auth` या `tools.exec.security_full_configured`). Common
critical severity classes:

- `fs.*` - state, config, credentials, auth profiles पर filesystem permissions.
- `gateway.*` - bind mode, auth, Tailscale, Control UI, trusted-proxy setup.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` - प्रति-surface hardening.
- `plugins.*`, `skills.*` - plugin/skill supply chain और scan findings.
- `security.exposure.*` - cross-cutting checks जहां access policy tool blast radius से मिलती है.

Severity levels, fix keys, और auto-fix support सहित पूरा catalog
[Security audit checks](/hi/gateway/security/audit-checks) पर देखें.

## HTTP पर Control UI

Control UI को device identity generate करने के लिए **secure context** (HTTPS या localhost) चाहिए. `gateway.controlUi.allowInsecureAuth` एक local compatibility toggle है:

- localhost पर, यह page non-secure HTTP पर loaded होने पर device identity के बिना Control UI auth allow करता है.
- यह pairing checks को bypass नहीं करता.
- यह remote (non-localhost) device identity requirements को relax नहीं करता.

HTTPS (Tailscale Serve) prefer करें या UI को `127.0.0.1` पर खोलें.

केवल break-glass scenarios के लिए, `gateway.controlUi.dangerouslyDisableDeviceAuth`
device identity checks को पूरी तरह disable करता है. यह severe security downgrade है;
इसे off रखें जब तक आप actively debugging नहीं कर रहे और जल्दी revert कर सकते हैं.

उन dangerous flags से अलग, successful `gateway.auth.mode: "trusted-proxy"`
device identity के बिना **operator** Control UI sessions admit कर सकता है. यह
intentional auth-mode behavior है, `allowInsecureAuth` shortcut नहीं, और यह अभी भी
node-role Control UI sessions तक extend नहीं होता.

जब यह setting enabled हो, `openclaw security audit` warning देता है.

## Insecure या dangerous flags summary

Known insecure/dangerous debug switches enabled होने पर
`openclaw security audit` `config.insecure_or_dangerous_flags` raise करता है.
Production में इन्हें unset रखें. हर enabled flag अपनी finding के रूप में report होता है. यदि audit
suppressions configured हैं, तो matching findings के `suppressedFindings` में move होने पर भी `security.audit.suppressions.active`
active audit output में बना रहता है.

<AccordionGroup>
  <Accordion title="Audit द्वारा आज track किए जाने वाले flags">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `security.audit.suppressions configured (<count>)`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="Config schema में सभी `dangerous*` / `dangerously*` keys">
    Control UI और browser:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Channel name-matching (bundled और plugin channels; जहां लागू हो वहां प्रति
    `accounts.<accountId>` भी उपलब्ध):

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching` (plugin channel)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (plugin channel)
    - `channels.zalouser.dangerouslyAllowNameMatching` (plugin channel)
    - `channels.irc.dangerouslyAllowNameMatching` (plugin channel)
    - `channels.mattermost.dangerouslyAllowNameMatching` (plugin channel)

    Network exposure:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (प्रति account भी)

    Sandbox Docker (defaults + per-agent):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Reverse proxy configuration

यदि आप Gateway को reverse proxy (nginx, Caddy, Traefik, आदि) के पीछे चलाते हैं, तो proper forwarded-client IP handling के लिए
`gateway.trustedProxies` configure करें.

जब Gateway किसी ऐसे address से proxy headers detect करता है जो `trustedProxies` में **नहीं** है, तो वह connections को local clients नहीं मानेगा. यदि gateway auth disabled है, तो वे connections rejected होते हैं. यह authentication bypass रोकता है, जहां proxied connections अन्यथा localhost से आते हुए दिखते और automatic trust receive करते.

`gateway.trustedProxies` `gateway.auth.mode: "trusted-proxy"` को भी feed करता है, लेकिन वह auth mode stricter है:

- trusted-proxy auth default रूप से **loopback-source proxies पर fail closed होता है**
- same-host loopback reverse proxies local-client detection और forwarded IP handling के लिए `gateway.trustedProxies` का उपयोग कर सकते हैं
- same-host loopback reverse proxies `gateway.auth.mode: "trusted-proxy"` को केवल तब satisfy कर सकते हैं जब `gateway.auth.trustedProxy.allowLoopback = true`; अन्यथा token/password auth का उपयोग करें

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # Optional. Default false.
  # Only enable if your proxy cannot provide X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

जब `trustedProxies` configured होता है, Gateway client IP determine करने के लिए `X-Forwarded-For` का उपयोग करता है. `X-Real-IP` default रूप से ignored होता है जब तक `gateway.allowRealIpFallback: true` explicitly set न हो.

Trusted proxy headers node device pairing को automatically trusted नहीं बनाते.
`gateway.nodes.pairing.autoApproveCidrs` एक अलग, disabled-by-default
operator policy है. Enabled होने पर भी, loopback-source trusted-proxy header paths
node auto-approval से excluded रहते हैं क्योंकि local callers उन
headers को forge कर सकते हैं, जिसमें loopback trusted-proxy auth explicitly enabled होने पर भी शामिल है.

अच्छा reverse proxy behavior (incoming forwarding headers overwrite करें):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

खराब reverse proxy behavior (untrusted forwarding headers append/preserve करें):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS और origin notes

- OpenClaw gateway पहले local/loopback है। अगर आप reverse proxy पर TLS terminate करते हैं, तो वहां proxy-facing HTTPS domain पर HSTS सेट करें।
- अगर gateway खुद HTTPS terminate करता है, तो आप OpenClaw responses से HSTS header emit करने के लिए `gateway.http.securityHeaders.strictTransportSecurity` सेट कर सकते हैं।
- विस्तृत deployment guidance [Trusted Proxy Auth](/hi/gateway/trusted-proxy-auth#tls-termination-and-hsts) में है।
- non-loopback Control UI deployments के लिए, `gateway.controlUi.allowedOrigins` default रूप से आवश्यक है।
- `gateway.controlUi.allowedOrigins: ["*"]` एक स्पष्ट allow-all browser-origin policy है, hardened default नहीं। इसे tightly controlled local testing के बाहर इस्तेमाल करने से बचें।
- loopback पर browser-origin auth failures अब भी rate-limited होते हैं, भले ही
  general loopback exemption enabled हो, लेकिन lockout key एक shared localhost bucket के बजाय हर
  normalized `Origin` value के हिसाब से scoped होती है।
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` Host-header origin fallback mode enable करता है; इसे operator द्वारा चुनी गई खतरनाक policy मानें।
- DNS rebinding और proxy-host header behavior को deployment hardening concerns मानें; `trustedProxies` को सीमित रखें और gateway को सीधे public internet पर expose करने से बचें।

## Local session logs disk पर रहते हैं

OpenClaw session transcripts को disk पर `~/.openclaw/agents/<agentId>/sessions/*.jsonl` के अंतर्गत store करता है।
यह session continuity और (वैकल्पिक रूप से) session memory indexing के लिए आवश्यक है, लेकिन इसका यह भी मतलब है कि
**filesystem access वाला कोई भी process/user उन logs को पढ़ सकता है**। disk access को trust
boundary मानें और `~/.openclaw` पर permissions lock down करें (नीचे audit section देखें)। अगर आपको agents के बीच
मजबूत isolation चाहिए, तो उन्हें अलग OS users या अलग hosts के तहत चलाएं।

## Node execution (system.run)

अगर कोई macOS node paired है, तो Gateway उस node पर `system.run` invoke कर सकता है। यह Mac पर **remote code execution** है:

- node pairing (approval + token) आवश्यक है।
- Gateway node pairing per-command approval surface नहीं है। यह node identity/trust और token issuance establish करता है।
- Gateway `gateway.nodes.allowCommands` / `denyCommands` के जरिए coarse global node command policy लागू करता है।
- Mac पर **Settings → Exec approvals** (security + ask + allowlist) के जरिए controlled।
- per-node `system.run` policy node की अपनी exec approvals file (`exec.approvals.node.*`) है, जो gateway की global command-ID policy से अधिक strict या loose हो सकती है।
- `security="full"` और `ask="off"` के साथ चल रहा node default trusted-operator model का पालन कर रहा है। इसे expected behavior मानें जब तक आपका deployment explicitly tighter approval या allowlist stance न मांगता हो।
- Approval mode exact request context और, जब संभव हो, एक concrete local script/file operand bind करता है। अगर OpenClaw interpreter/runtime command के लिए exactly one direct local file identify नहीं कर सकता, तो approval-backed execution को full semantic coverage का promise करने के बजाय deny किया जाता है।
- `host=node` के लिए, approval-backed runs एक canonical prepared
  `systemRunPlan` भी store करते हैं; बाद के approved forwards उसी stored plan को reuse करते हैं, और gateway
  validation approval request create होने के बाद command/cwd/session context में caller edits reject करता है।
- अगर आप remote execution नहीं चाहते, तो security को **deny** पर सेट करें और उस Mac के लिए node pairing remove करें।

यह distinction triage के लिए मायने रखता है:

- अलग command list advertise करने वाला reconnecting paired node अपने-आप में vulnerability नहीं है, अगर Gateway global policy और node के local exec approvals अब भी actual execution boundary enforce करते हैं।
- node pairing metadata को दूसरे hidden per-command approval layer के रूप में मानने वाली reports आमतौर पर policy/UX confusion होती हैं, security boundary bypass नहीं।

## Dynamic skills (watcher / remote nodes)

OpenClaw session के बीच skills list refresh कर सकता है:

- **Skills watcher**: `SKILL.md` में changes अगले agent turn पर skills snapshot update कर सकते हैं।
- **Remote nodes**: macOS node connect करने से macOS-only skills eligible हो सकते हैं (bin probing के आधार पर)।

Skill folders को **trusted code** मानें और यह restrict करें कि उन्हें कौन modify कर सकता है।

## Threat model

आपका AI assistant यह कर सकता है:

- arbitrary shell commands execute करना
- files read/write करना
- network services access करना
- किसी को भी messages send करना (अगर आप उसे WhatsApp access देते हैं)

जो लोग आपको message करते हैं, वे यह कर सकते हैं:

- आपके AI को बुरे काम करने के लिए trick करने की कोशिश
- आपके data तक access के लिए social engineering
- infrastructure details के लिए probe करना

## Core concept: intelligence से पहले access control

यहां ज्यादातर failures fancy exploits नहीं हैं - वे "किसी ने bot को message किया और bot ने वही किया जो उससे कहा गया" हैं।

OpenClaw का stance:

- **पहले identity:** तय करें कि bot से कौन बात कर सकता है (DM pairing / allowlists / explicit "open")।
- **फिर scope:** तय करें कि bot को कहां act करने की अनुमति है (group allowlists + mention gating, tools, sandboxing, device permissions)।
- **अंत में model:** मानकर चलें कि model manipulate किया जा सकता है; design ऐसा करें कि manipulation का blast radius limited हो।

## Command authorization model

Slash commands और directives केवल **authorized senders** के लिए honored होते हैं। Authorization
channel allowlists/pairing और `commands.useAccessGroups` से derived होता है ([Configuration](/hi/gateway/configuration)
और [Slash commands](/hi/tools/slash-commands) देखें)। अगर channel allowlist empty है या `"*"` include करती है,
तो उस channel के लिए commands effectively open हैं।

`/exec` authorized operators के लिए session-only convenience है। यह config write नहीं करता या
other sessions को change नहीं करता।

## Control plane tools risk

दो built-in tools persistent control-plane changes कर सकते हैं:

- `gateway` `config.schema.lookup` / `config.get` के साथ config inspect कर सकता है, और `config.apply`, `config.patch`, और `update.run` के साथ persistent changes कर सकता है।
- `cron` scheduled jobs create कर सकता है जो original chat/task खत्म होने के बाद भी चलते रहते हैं।

Agent-facing `gateway` runtime tool अब भी
`tools.exec.ask` या `tools.exec.security` rewrite करने से इनकार करता है; legacy `tools.bash.*` aliases को
write से पहले same protected exec paths में normalized किया जाता है।
Agent-driven `gateway config.apply` और `gateway config.patch` edits
default रूप से fail-closed हैं: केवल low-risk runtime tuning,
mention-gating, और visible-reply paths का एक narrow set agent-tunable है। Global model defaults
और prompt overlays operator-controlled रहते हैं। इसलिए नए sensitive config trees
protected होते हैं जब तक उन्हें जानबूझकर allowlist में add न किया जाए।

Untrusted content handle करने वाले किसी भी agent/surface के लिए, इन्हें default रूप से deny करें:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` केवल restart actions block करता है। यह `gateway` config/update actions disable नहीं करता।

## Plugins

Plugins Gateway के साथ **in-process** run होते हैं। उन्हें trusted code मानें:

- केवल trusted sources से plugins install करें।
- Explicit `plugins.allow` allowlists को prefer करें।
- Enable करने से पहले plugin config review करें।
- Plugin changes के बाद Gateway restart करें।
- अगर आप plugins install या update करते हैं (`openclaw plugins install <package>`, `openclaw plugins update <id>`), तो इसे untrusted code चलाने जैसा मानें:
  - install path active plugin install root के अंतर्गत per-plugin directory है।
  - OpenClaw install/update के दौरान built-in local dangerous-code blocking नहीं चलाता। Operator-owned local allow/block decisions के लिए `security.installPolicy` और diagnostic scanning के लिए `openclaw security audit --deep` इस्तेमाल करें।
  - npm और git plugin installs केवल explicit install/update flow के दौरान package-manager dependency convergence run करते हैं। Local paths और archives को self-contained plugin packages माना जाता है; OpenClaw उन्हें `npm install` चलाए बिना copy/reference करता है।
  - Pinned, exact versions (`@scope/pkg@1.2.3`) prefer करें, और enable करने से पहले disk पर unpacked code inspect करें।
  - `--dangerously-force-unsafe-install` deprecated है और अब plugin install/update behavior नहीं बदलता।
  - जब operators को skill और plugin installs के लिए host-specific allow/block decisions करने वाली trusted local command चाहिए, तो `security.installPolicy` configure करें। यह policy source material staged होने के बाद लेकिन installation जारी रहने से पहले run होती है, ClawHub skills पर भी apply होती है, और deprecated unsafe flags से bypass नहीं होती।

Details: [Plugins](/hi/tools/plugin)

## DM access model: pairing, allowlist, open, disabled

सभी current DM-capable channels एक DM policy (`dmPolicy` या `*.dm.policy`) support करते हैं, जो message process होने से **पहले** inbound DMs gate करती है:

- `pairing` (default): unknown senders को short pairing code मिलता है और bot उनका message approved होने तक ignore करता है। Codes 1 hour के बाद expire होते हैं; repeated DMs नया request create होने तक code resend नहीं करेंगे। Pending requests default रूप से **3 per channel** तक capped हैं।
- `allowlist`: unknown senders blocked होते हैं (कोई pairing handshake नहीं)।
- `open`: किसी को भी DM करने दें (public)। Channel allowlist में `"*"` include होना **आवश्यक** है (explicit opt-in)।
- `disabled`: inbound DMs को पूरी तरह ignore करें।

CLI के जरिए approve करें:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Details + disk पर files: [Pairing](/hi/channels/pairing)

## DM session isolation (multi-user mode)

Default रूप से, OpenClaw **सभी DMs को main session में route** करता है ताकि आपके assistant के पास devices और channels में continuity रहे। अगर **कई लोग** bot को DM कर सकते हैं (open DMs या multi-person allowlist), तो DM sessions isolate करने पर विचार करें:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

यह group chats को isolated रखते हुए cross-user context leakage रोकता है।

यह messaging-context boundary है, host-admin boundary नहीं। अगर users mutually adversarial हैं और वही Gateway host/config share करते हैं, तो trust boundary के हिसाब से separate gateways चलाएं।

### Secure DM mode (recommended)

ऊपर दिए snippet को **secure DM mode** मानें:

- Default: `session.dmScope: "main"` (continuity के लिए सभी DMs एक session share करते हैं)।
- Local CLI onboarding default: unset होने पर `session.dmScope: "per-channel-peer"` write करता है (existing explicit values रखता है)।
- Secure DM mode: `session.dmScope: "per-channel-peer"` (हर channel+sender pair को isolated DM context मिलता है)।
- Cross-channel peer isolation: `session.dmScope: "per-peer"` (हर sender को same type के सभी channels में एक session मिलता है)।

अगर आप same channel पर multiple accounts चलाते हैं, तो इसके बजाय `per-account-channel-peer` इस्तेमाल करें। अगर same person आपसे multiple channels पर contact करता है, तो उन DM sessions को एक canonical identity में collapse करने के लिए `session.identityLinks` इस्तेमाल करें। [Session Management](/hi/concepts/session) और [Configuration](/hi/gateway/configuration) देखें।

## DMs और groups के लिए Allowlists

OpenClaw में दो अलग "who can trigger me?" layers हैं:

- **DM allowlist** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; पुराना: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): direct messages में bot से बात करने की अनुमति किसे है।
  - जब `dmPolicy="pairing"` हो, तो approvals account-scoped pairing allowlist store में `~/.openclaw/credentials/` के अंतर्गत लिखे जाते हैं (default account के लिए `<channel>-allowFrom.json`, non-default accounts के लिए `<channel>-<accountId>-allowFrom.json`), और config allowlists के साथ merge किए जाते हैं।
- **Group allowlist** (channel-specific): bot किन groups/channels/guilds से messages बिल्कुल स्वीकार करेगा।
  - सामान्य patterns:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: per-group defaults जैसे `requireMention`; set होने पर, यह group allowlist की तरह भी काम करता है (allow-all behavior बनाए रखने के लिए `"*"` शामिल करें)।
    - `groupPolicy="allowlist"` + `groupAllowFrom`: group session के _अंदर_ bot को कौन trigger कर सकता है, इसे सीमित करें (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams)।
    - `channels.discord.guilds` / `channels.slack.channels`: per-surface allowlists + mention defaults।
  - Group checks इस क्रम में चलते हैं: पहले `groupPolicy`/group allowlists, दूसरे mention/reply activation।
  - bot message का reply देना (implicit mention) `groupAllowFrom` जैसी sender allowlists को bypass **नहीं** करता।
  - **सुरक्षा नोट:** `dmPolicy="open"` और `groupPolicy="open"` को last-resort settings मानें। इनका उपयोग बहुत कम होना चाहिए; pairing + allowlists को प्राथमिकता दें जब तक आप room के हर member पर पूरी तरह भरोसा न करते हों।

विवरण: [Configuration](/hi/gateway/configuration) और [Groups](/hi/channels/groups)

## Prompt injection (यह क्या है, यह क्यों मायने रखता है)

Prompt injection तब होता है जब कोई attacker ऐसा message बनाता है जो model को कुछ unsafe करने के लिए manipulate करता है ("ignore your instructions", "dump your filesystem", "follow this link and run commands", आदि)।

मजबूत system prompts के साथ भी, **prompt injection हल नहीं हुआ है**। System prompt guardrails सिर्फ soft guidance हैं; hard enforcement tool policy, exec approvals, sandboxing, और channel allowlists से आता है (और operators इन्हें design के अनुसार disable कर सकते हैं)। व्यवहार में क्या मदद करता है:

- Inbound DMs को locked down रखें (pairing/allowlists)।
- Groups में mention gating को प्राथमिकता दें; public rooms में "always-on" bots से बचें।
- Links, attachments, और pasted instructions को default रूप से hostile मानें।
- Sensitive tool execution को sandbox में चलाएँ; secrets को agent के reachable filesystem से बाहर रखें।
- नोट: sandboxing opt-in है। अगर sandbox mode off है, तो implicit `host=auto` gateway host पर resolve होता है। Explicit `host=sandbox` फिर भी fail closed होता है क्योंकि कोई sandbox runtime उपलब्ध नहीं है। अगर आप चाहते हैं कि यह behavior config में explicit हो, तो `host=gateway` set करें।
- High-risk tools (`exec`, `browser`, `web_fetch`, `web_search`) को trusted agents या explicit allowlists तक सीमित करें।
- अगर आप interpreters (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`) को allowlist करते हैं, तो `tools.exec.strictInlineEval` enable करें ताकि inline eval forms को फिर भी explicit approval चाहिए।
- Shell approval analysis **unquoted heredocs** के अंदर POSIX parameter-expansion forms (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) को भी reject करता है, इसलिए allowlisted heredoc body plain text के रूप में allowlist review से shell expansion को चुपके से पार नहीं करा सकता। Literal body semantics में opt in करने के लिए heredoc terminator को quote करें (उदाहरण के लिए `<<'EOF'`); unquoted heredocs जो variables expand करते, उन्हें reject किया जाता है।
- **Model choice मायने रखती है:** पुराने/छोटे/legacy models prompt injection और tool misuse के खिलाफ काफी कम robust होते हैं। Tool-enabled agents के लिए, उपलब्ध सबसे मजबूत latest-generation, instruction-hardened model का उपयोग करें।

इन red flags को untrusted मानें:

- "Read this file/URL and do exactly what it says."
- "Ignore your system prompt or safety rules."
- "Reveal your hidden instructions or tool outputs."
- "Paste the full contents of ~/.openclaw or your logs."

## External content special-token sanitization

OpenClaw wrapped external content और metadata से common self-hosted LLM chat-template special-token literals को model तक पहुँचने से पहले strip करता है। Covered marker families में Qwen/ChatML, Llama, Gemma, Mistral, Phi, और GPT-OSS role/turn tokens शामिल हैं।

क्यों:

- Self-hosted models के सामने लगे OpenAI-compatible backends कभी-कभी user text में दिखने वाले special tokens को mask करने के बजाय preserve कर देते हैं। ऐसा attacker जो inbound external content (fetched page, email body, file contents tool output) में लिख सकता है, अन्यथा synthetic `assistant` या `system` role boundary inject कर सकता है और wrapped-content guardrails से बच सकता है।
- Sanitization external-content wrapping layer पर होता है, इसलिए यह per-provider होने के बजाय fetch/read tools और inbound channel content पर समान रूप से लागू होता है।
- Outbound model responses में पहले से एक अलग sanitizer है जो final channel delivery boundary पर user-visible replies से leaked `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>`, और इसी तरह के internal runtime scaffolding को strip करता है। External-content sanitizer उसका inbound counterpart है।

यह इस page की दूसरी hardening को replace नहीं करता - `dmPolicy`, allowlists, exec approvals, sandboxing, और `contextVisibility` अभी भी primary काम करते हैं। यह self-hosted stacks के खिलाफ एक specific tokenizer-layer bypass बंद करता है, जो user text को special tokens intact रखकर forward करते हैं।

## Unsafe external content bypass flags

OpenClaw में explicit bypass flags शामिल हैं जो external-content safety wrapping को disable करते हैं:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron payload field `allowUnsafeExternalContent`

Guidance:

- Production में इन्हें unset/false रखें।
- केवल tightly scoped debugging के लिए temporary रूप से enable करें।
- अगर enable हो, तो उस agent को isolate करें (sandbox + minimal tools + dedicated session namespace)।

Hooks risk note:

- Hook payloads untrusted content हैं, भले ही delivery उन systems से आए जिन्हें आप control करते हैं (mail/docs/web content prompt injection carry कर सकता है)।
- Weak model tiers इस risk को बढ़ाते हैं। Hook-driven automation के लिए, strong modern model tiers को प्राथमिकता दें और tool policy tight रखें (`tools.profile: "messaging"` या stricter), साथ में जहाँ संभव हो sandboxing।

### Prompt injection के लिए public DMs आवश्यक नहीं हैं

भले ही **सिर्फ आप** bot को message कर सकते हों, prompt injection फिर भी
bot द्वारा पढ़े जाने वाले किसी भी **untrusted content** के जरिए हो सकता है (web search/fetch results, browser pages,
emails, docs, attachments, pasted logs/code)। दूसरे शब्दों में: sender ही
एकमात्र threat surface नहीं है; **content itself** adversarial instructions carry कर सकता है।

Tools enabled होने पर, typical risk context exfiltrate करना या
tool calls trigger करना होता है। Blast radius कम करें:

- Untrusted content को summarize करने के लिए read-only या tool-disabled **reader agent** का उपयोग करें,
  फिर summary को अपने main agent को pass करें।
- Tool-enabled agents के लिए `web_search` / `web_fetch` / `browser` off रखें जब तक जरूरत न हो।
- OpenResponses URL inputs (`input_file` / `input_image`) के लिए, tight
  `gateway.http.endpoints.responses.files.urlAllowlist` और
  `gateway.http.endpoints.responses.images.urlAllowlist` set करें, और `maxUrlParts` low रखें।
  Empty allowlists को unset माना जाता है; अगर आप URL fetching पूरी तरह disable करना चाहते हैं तो `files.allowUrl: false` / `images.allowUrl: false`
  का उपयोग करें।
- OpenResponses file inputs के लिए, decoded `input_file` text फिर भी
  **untrusted external content** के रूप में injected होता है। सिर्फ इसलिए file text को trusted न मानें
  क्योंकि Gateway ने उसे locally decode किया। Injected block में अभी भी explicit
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` boundary markers और `Source: External`
  metadata होता है, भले ही यह path लंबे `SECURITY NOTICE:` banner को omit करता हो।
- जब media-understanding attached documents से text extract करता है और उसे media prompt में append करता है, तब वही marker-based wrapping लागू होती है।
- किसी भी ऐसे agent के लिए sandboxing और strict tool allowlists enable करें जो untrusted input को touch करता है।
- Secrets को prompts से बाहर रखें; उन्हें gateway host पर env/config के जरिए pass करें।

### Self-hosted LLM backends

OpenAI-compatible self-hosted backends जैसे vLLM, SGLang, TGI, LM Studio,
या custom Hugging Face tokenizer stacks hosted providers से अलग हो सकते हैं कि
chat-template special tokens कैसे handle किए जाते हैं। अगर कोई backend literal strings
जैसे `<|im_start|>`, `<|start_header_id|>`, या `<start_of_turn>` को
user content के अंदर structural chat-template tokens के रूप में tokenize करता है, तो untrusted text tokenizer layer पर
role boundaries forge करने की कोशिश कर सकता है।

OpenClaw wrapped external content से common model-family special-token literals को model पर dispatch करने से पहले strip करता है। External-content
wrapping enabled रखें, और जब उपलब्ध हों तो backend settings को प्राथमिकता दें जो user-provided content में special
tokens को split या escape करती हैं। OpenAI
और Anthropic जैसे hosted providers पहले से अपनी request-side sanitization लागू करते हैं।

### Model strength (security note)

Prompt injection resistance model tiers में **एकसमान नहीं** होती। Smaller/cheaper models आम तौर पर tool misuse और instruction hijacking के लिए अधिक susceptible होते हैं, खासकर adversarial prompts के तहत।

<Warning>
Tool-enabled agents या untrusted content पढ़ने वाले agents के लिए, पुराने/छोटे models के साथ prompt-injection risk अक्सर बहुत ज्यादा होता है। उन workloads को weak model tiers पर न चलाएँ।
</Warning>

Recommendations:

- Tools चला सकने वाले या files/networks touch कर सकने वाले किसी भी bot के लिए **latest generation, best-tier model का उपयोग करें**।
- Tool-enabled agents या untrusted inboxes के लिए **older/weaker/smaller tiers का उपयोग न करें**; prompt-injection risk बहुत ज्यादा है।
- अगर आपको smaller model का उपयोग करना ही हो, तो **blast radius कम करें** (read-only tools, strong sandboxing, minimal filesystem access, strict allowlists)।
- Small models चलाते समय, **सभी sessions के लिए sandboxing enable करें** और inputs tightly controlled न हों तो **web_search/web_fetch/browser disable करें**।
- Trusted input और no tools वाले chat-only personal assistants के लिए, smaller models आम तौर पर ठीक होते हैं।

## Groups में reasoning और verbose output

`/reasoning`, `/verbose`, और `/trace` internal reasoning, tool
output, या plugin diagnostics expose कर सकते हैं जो
public channel के लिए नहीं था। Group settings में, इन्हें **debug
only** मानें और जब तक आपको स्पष्ट रूप से जरूरत न हो, इन्हें off रखें।

Guidance:

- Public rooms में `/reasoning`, `/verbose`, और `/trace` disabled रखें।
- अगर आप इन्हें enable करते हैं, तो केवल trusted DMs या tightly controlled rooms में करें।
- याद रखें: verbose और trace output में tool args, URLs, plugin diagnostics, और model द्वारा देखा गया data शामिल हो सकता है।

## Configuration hardening examples

### File permissions

Gateway host पर config + state private रखें:

- `~/.openclaw/openclaw.json`: `600` (केवल user read/write)
- `~/.openclaw`: `700` (केवल user)

`openclaw doctor` warn कर सकता है और इन permissions को tighten करने की पेशकश कर सकता है।

### Network exposure (bind, port, firewall)

Gateway एक ही port पर **WebSocket + HTTP** multiplex करता है:

- Default: `18789`
- Config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

इस HTTP surface में Control UI और canvas host शामिल हैं:

- Control UI (SPA assets) (default base path `/`)
- Canvas host: `/__openclaw__/canvas/` और `/__openclaw__/a2ui/` (arbitrary HTML/JS; untrusted content मानें)

अगर आप canvas content को normal browser में load करते हैं, तो इसे किसी भी अन्य untrusted web page की तरह treat करें:

- Canvas host को untrusted networks/users के सामने expose न करें।
- जब तक आप implications को पूरी तरह न समझते हों, canvas content को privileged web surfaces के same origin share न करने दें।

Bind mode control करता है कि Gateway कहाँ listen करता है:

- `gateway.bind: "loopback"` (default): केवल local clients connect कर सकते हैं।
- Non-loopback binds (`"lan"`, `"tailnet"`, `"custom"`) attack surface बढ़ाते हैं। इन्हें केवल gateway auth (shared token/password या correctly configured trusted proxy) और real firewall के साथ उपयोग करें।

Rules of thumb:

- LAN बाइंड की बजाय Tailscale Serve को प्राथमिकता दें (Serve Gateway को लूपबैक पर रखता है, और Tailscale एक्सेस संभालता है)।
- यदि आपको LAN से बाइंड करना ही पड़े, तो पोर्ट को स्रोत IPs की सख्त allowlist तक फ़ायरवॉल करें; इसे व्यापक रूप से port-forward न करें।
- Gateway को कभी भी `0.0.0.0` पर बिना प्रमाणीकरण के एक्सपोज़ न करें।

### UFW के साथ Docker पोर्ट पब्लिशिंग

यदि आप VPS पर Docker के साथ OpenClaw चलाते हैं, तो याद रखें कि पब्लिश किए गए कंटेनर पोर्ट
(`-p HOST:CONTAINER` या Compose `ports:`) Docker की forwarding
chains के ज़रिए रूट किए जाते हैं, केवल होस्ट `INPUT` नियमों से नहीं।

Docker ट्रैफ़िक को अपनी फ़ायरवॉल नीति के अनुरूप रखने के लिए, नियम
`DOCKER-USER` में लागू करें (यह chain Docker के अपने accept नियमों से पहले मूल्यांकित होती है)।
कई आधुनिक distros पर, `iptables`/`ip6tables` `iptables-nft` frontend का उपयोग करते हैं
और फिर भी ये नियम nftables backend पर लागू करते हैं।

न्यूनतम allowlist उदाहरण (IPv4):

```bash
# /etc/ufw/after.rules (append as its own *filter section)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6 की अलग tables होती हैं। यदि
Docker IPv6 सक्षम है, तो `/etc/ufw/after6.rules` में मिलती-जुलती नीति जोड़ें।

Docs snippets में `eth0` जैसे interface names को hardcode करने से बचें। Interface names
VPS images (`ens3`, `enp*`, आदि) के अनुसार बदलते हैं और mismatch गलती से
आपके deny rule को skip कर सकता है।

Reload के बाद quick validation:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

अपेक्षित external ports केवल वे होने चाहिए जिन्हें आप जानबूझकर expose करते हैं (अधिकांश
setups के लिए: SSH + आपके reverse proxy ports)।

### mDNS/Bonjour discovery

जब bundled `bonjour` Plugin सक्षम होता है, Gateway local device discovery के लिए mDNS (`_openclaw-gw._tcp` port 5353 पर) के माध्यम से अपनी उपस्थिति broadcast करता है। Full mode में, इसमें TXT records शामिल होते हैं जो operational details expose कर सकते हैं:

- `cliPath`: CLI binary का पूरा filesystem path (username और install location उजागर करता है)
- `sshPort`: host पर SSH availability advertise करता है
- `displayName`, `lanHost`: hostname information

**Operational security consideration:** Infrastructure details broadcast करने से local network पर मौजूद किसी भी व्यक्ति के लिए reconnaissance आसान हो जाती है। Filesystem paths और SSH availability जैसी “harmless” जानकारी भी attackers को आपका environment map करने में मदद करती है।

**Recommendations:**

1. **जब तक LAN discovery की आवश्यकता न हो, Bonjour disabled रखें।** Bonjour macOS hosts पर auto-start होता है और elsewhere opt-in है; direct Gateway URLs, Tailnet, SSH, या wide-area DNS-SD local multicast से बचते हैं।

2. **Minimal mode** (Bonjour सक्षम होने पर default, exposed gateways के लिए recommended): mDNS broadcasts से sensitive fields हटाएं:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

3. **mDNS mode disable करें** यदि आप Plugin enabled रखना चाहते हैं लेकिन local device discovery suppress करना चाहते हैं:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

4. **Full mode** (opt-in): TXT records में `cliPath` + `sshPort` शामिल करें:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

5. **Environment variable** (alternative): config changes के बिना mDNS disable करने के लिए `OPENCLAW_DISABLE_BONJOUR=1` set करें।

जब Bonjour minimal mode में enabled होता है, Gateway device discovery के लिए पर्याप्त जानकारी (`role`, `gatewayPort`, `transport`) broadcast करता है लेकिन `cliPath` और `sshPort` omit करता है। जिन apps को CLI path information चाहिए वे इसे authenticated WebSocket connection के माध्यम से fetch कर सकते हैं।

### Gateway WebSocket को लॉक डाउन करें (local auth)

Gateway auth **default रूप से required** है। यदि कोई valid gateway auth path configured नहीं है,
तो Gateway WebSocket connections refuse करता है (fail-closed)।

Onboarding default रूप से token generate करता है (loopback के लिए भी), इसलिए
local clients को authenticate करना होगा।

Token set करें ताकि **all** WS clients को authenticate करना पड़े:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor आपके लिए एक generate कर सकता है: `openclaw doctor --generate-gateway-token`।

<Note>
`gateway.remote.token` और `gateway.remote.password` client credential sources हैं। ये अपने आप local WS access को protect **नहीं** करते। Local call paths केवल तब fallback के रूप में `gateway.remote.*` का उपयोग कर सकते हैं जब `gateway.auth.*` unset हो। यदि `gateway.auth.token` या `gateway.auth.password` SecretRef के ज़रिए explicitly configured है और unresolved है, तो resolution fails closed (कोई remote fallback masking नहीं)।
</Note>
वैकल्पिक: `wss://` का उपयोग करते समय remote TLS को `gateway.remote.tlsFingerprint` से pin करें।
Plaintext `ws://` loopback, private IP literals, `.local`, और
Tailnet `*.ts.net` gateway URLs के लिए accepted है। अन्य trusted private-DNS names के लिए, client process पर
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` break-glass के रूप में set करें।
यह जानबूझकर केवल process environment है, `openclaw.json` config
key नहीं।
Mobile pairing और Android manual या scanned gateway routes अधिक सख्त हैं:
cleartext loopback के लिए accepted है, लेकिन private-LAN, link-local, `.local`, और
dotless hostnames को TLS का उपयोग करना होगा, जब तक कि आप explicitly trusted
private-network cleartext path में opt in न करें।

Local device pairing:

- same-host clients को smooth रखने के लिए direct local loopback connects के लिए device pairing auto-approved है।
- OpenClaw में trusted shared-secret helper flows के लिए एक narrow backend/container-local self-connect path भी है।
- Tailnet और LAN connects, जिनमें same-host tailnet binds शामिल हैं, pairing के लिए remote माने जाते हैं और अभी भी approval चाहिए।
- Loopback request पर forwarded-header evidence loopback
  locality को disqualify करता है। Metadata-upgrade auto-approval narrowly scoped है। दोनों नियमों के लिए
  [Gateway pairing](/hi/gateway/pairing) देखें।

Auth modes:

- `gateway.auth.mode: "token"`: shared bearer token (अधिकांश setups के लिए recommended)।
- `gateway.auth.mode: "password"`: password auth (env के ज़रिए set करना prefer करें: `OPENCLAW_GATEWAY_PASSWORD`)।
- `gateway.auth.mode: "trusted-proxy"`: users को authenticate करने और headers के ज़रिए identity pass करने के लिए identity-aware reverse proxy पर trust करें ([Trusted Proxy Auth](/hi/gateway/trusted-proxy-auth) देखें)।

Rotation checklist (token/password):

1. नया secret generate/set करें (`gateway.auth.token` या `OPENCLAW_GATEWAY_PASSWORD`)।
2. Gateway restart करें (या यदि macOS app Gateway supervise करता है तो उसे restart करें)।
3. किसी भी remote clients को update करें (`gateway.remote.token` / `.password` उन machines पर जो Gateway में call करती हैं)।
4. Verify करें कि आप पुराने credentials से अब connect नहीं कर सकते।

### Tailscale Serve identity headers

जब `gateway.auth.allowTailscale` `true` होता है (Serve के लिए default), OpenClaw
Control UI/WebSocket authentication के लिए Tailscale Serve identity headers (`tailscale-user-login`) accept करता है। OpenClaw
local Tailscale daemon (`tailscale whois`) के माध्यम से
`x-forwarded-for` address resolve करके और उसे header से match करके identity verify करता है। यह केवल उन requests के लिए trigger होता है जो loopback hit करती हैं
और Tailscale द्वारा inject किए गए `x-forwarded-for`, `x-forwarded-proto`, और `x-forwarded-host` शामिल करती हैं।
इस async identity check path के लिए, उसी `{scope, ip}` के failed attempts
limiter द्वारा failure record करने से पहले serialized होते हैं। इसलिए एक Serve client से concurrent bad retries
दो plain mismatches की तरह race through होने के बजाय दूसरे attempt को तुरंत lock out कर सकती हैं।
HTTP API endpoints (उदाहरण के लिए `/v1/*`, `/tools/invoke`, और `/api/channels/*`)
Tailscale identity-header auth का उपयोग **नहीं** करते। वे अभी भी gateway के
configured HTTP auth mode का पालन करते हैं।

Important boundary note:

- Gateway HTTP bearer auth प्रभावी रूप से all-or-nothing operator access है।
- ऐसे credentials जो `/v1/chat/completions`, `/v1/responses`, `/api/v1/admin/rpc` जैसे Plugin routes, या `/api/channels/*` call कर सकते हैं, उस gateway के लिए full-access operator secrets के रूप में treat करें।
- OpenAI-compatible HTTP surface पर, shared-secret bearer auth पूरे default operator scopes (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) और agent turns के लिए owner semantics restore करता है; narrower `x-openclaw-scopes` values उस shared-secret path को reduce नहीं करते।
- HTTP पर per-request scope semantics केवल तब apply होते हैं जब request trusted proxy auth जैसे identity-bearing mode से आती है, या explicitly no-auth private ingress से आती है।
- उन identity-bearing modes में, `x-openclaw-scopes` omit करने पर normal operator default scope set पर fallback होता है; जब narrower scope set चाहिए तो header explicitly भेजें। `x-openclaw-model` जैसे owner-level OpenAI-compatible headers को scopes narrowed होने पर `operator.admin` चाहिए।
- `/tools/invoke` और HTTP session history endpoints भी उसी shared-secret rule का पालन करते हैं: token/password bearer auth वहां भी full operator access के रूप में treated है, जबकि identity-bearing modes declared scopes को अभी भी honor करते हैं।
- ये credentials untrusted callers के साथ share न करें; हर trust boundary के लिए अलग gateways prefer करें।

**Trust assumption:** tokenless Serve auth मानता है कि gateway host trusted है।
इसे hostile same-host processes के विरुद्ध protection के रूप में treat न करें। यदि untrusted
local code gateway host पर run हो सकता है, तो `gateway.auth.allowTailscale` disable करें
और `gateway.auth.mode: "token"` या
`"password"` के साथ explicit shared-secret auth require करें।

**Security rule:** इन headers को अपने reverse proxy से forward न करें। यदि
आप gateway के सामने TLS terminate या proxy करते हैं, तो
`gateway.auth.allowTailscale` disable करें और इसके बजाय shared-secret auth (`gateway.auth.mode:
"token"` या `"password"`) या [Trusted Proxy Auth](/hi/gateway/trusted-proxy-auth)
का उपयोग करें।

Trusted proxies:

- यदि आप Gateway के सामने TLS terminate करते हैं, तो `gateway.trustedProxies` को अपने proxy IPs पर set करें।
- OpenClaw उन IPs से `x-forwarded-for` (या `x-real-ip`) पर trust करेगा ताकि local pairing checks और HTTP auth/local checks के लिए client IP determine कर सके।
- सुनिश्चित करें कि आपका proxy `x-forwarded-for` को **overwrite** करता है और Gateway port तक direct access block करता है।

[Tailscale](/hi/gateway/tailscale) और [Web overview](/hi/web) देखें।

### Node host के ज़रिए browser control (recommended)

यदि आपका Gateway remote है लेकिन browser किसी दूसरी machine पर run करता है, तो browser machine पर एक **node host**
run करें और Gateway को browser actions proxy करने दें ([Browser tool](/hi/tools/browser) देखें)।
Node pairing को admin access की तरह treat करें।

Recommended pattern:

- Gateway और node host को एक ही tailnet (Tailscale) पर रखें।
- Node को intentionally pair करें; यदि आपको इसकी आवश्यकता नहीं है तो browser proxy routing disable करें।

Avoid:

- Relay/control ports को LAN या public Internet पर expose करना।
- Browser control endpoints के लिए Tailscale Funnel (public exposure)।

### Disk पर secrets

मान लें कि `~/.openclaw/` (या `$OPENCLAW_STATE_DIR/`) के अंतर्गत कुछ भी secrets या private data contain कर सकता है:

- `openclaw.json`: config में tokens (gateway, remote gateway), provider settings, और allowlists शामिल हो सकते हैं।
- `credentials/**`: channel credentials (उदाहरण: WhatsApp creds), pairing allowlists, legacy OAuth imports।
- `agents/<agentId>/agent/auth-profiles.json`: API keys, token profiles, OAuth tokens, और optional `keyRef`/`tokenRef`।
- `agents/<agentId>/agent/codex-home/**`: per-agent Codex app-server account, config, skills, plugins, native thread state, और diagnostics।
- `secrets.json` (optional): `file` SecretRef providers (`secrets.providers`) द्वारा उपयोग किया गया file-backed secret payload।
- `agents/<agentId>/agent/auth.json`: legacy compatibility file। Static `api_key` entries discovered होने पर scrubbed होती हैं।
- `agents/<agentId>/sessions/**`: session transcripts (`*.jsonl`) + routing metadata (`sessions.json`) जिनमें private messages और tool output हो सकते हैं।
- bundled plugin packages: installed plugins (साथ में उनका `node_modules/`)।
- `sandboxes/**`: tool sandbox workspaces; sandbox के अंदर आपके द्वारा पढ़ी/लिखी गई files की copies accumulate कर सकते हैं।

Hardening tips:

- अनुमतियां कड़ी रखें (डायरेक्टरी पर `700`, फ़ाइलों पर `600`)।
- Gateway होस्ट पर पूर्ण-डिस्क एन्क्रिप्शन का उपयोग करें।
- यदि होस्ट साझा है, तो Gateway के लिए एक समर्पित OS उपयोगकर्ता खाते को प्राथमिकता दें।

### Workspace `.env` फ़ाइलें

OpenClaw एजेंटों और टूल्स के लिए workspace-local `.env` फ़ाइलें लोड करता है, लेकिन उन फ़ाइलों को Gateway runtime नियंत्रणों को चुपचाप ओवरराइड नहीं करने देता।

- Provider क्रेडेंशियल environment variables अविश्वसनीय workspace `.env` फ़ाइलों से ब्लॉक किए जाते हैं। उदाहरणों में `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`, और इंस्टॉल किए गए विश्वसनीय plugins द्वारा घोषित provider auth keys शामिल हैं। Provider क्रेडेंशियल Gateway process environment, `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`), config `env` block, या वैकल्पिक login-shell import में रखें।
- `OPENCLAW_*` से शुरू होने वाली कोई भी key अविश्वसनीय workspace `.env` फ़ाइलों से ब्लॉक की जाती है।
- Matrix, Mattermost, IRC, और Synology Chat के लिए channel endpoint settings भी workspace `.env` overrides से ब्लॉक की जाती हैं, ताकि cloned workspaces bundled connector traffic को local endpoint config के माध्यम से redirect न कर सकें। Endpoint env keys (जैसे `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) gateway process environment या `env.shellEnv` से आनी चाहिए, workspace-loaded `.env` से नहीं।
- ब्लॉक fail-closed है: भविष्य के release में जोड़ा गया नया runtime-control variable checked-in या attacker-supplied `.env` से inherited नहीं हो सकता; key को अनदेखा किया जाता है और Gateway अपना मान बनाए रखता है।
- विश्वसनीय process/OS environment variables, global runtime dotenv, config `env`, और enabled login-shell import अब भी लागू होते हैं - यह केवल workspace `.env` file loading को सीमित करता है।

क्यों: workspace `.env` फ़ाइलें अक्सर agent code के बगल में रहती हैं, गलती से committed हो जाती हैं, या tools द्वारा लिखी जाती हैं। Provider credentials को ब्लॉक करने से cloned workspace को attacker-controlled provider accounts बदलने से रोका जाता है। पूरे `OPENCLAW_*` prefix को ब्लॉक करने का मतलब है कि बाद में नया `OPENCLAW_*` flag जोड़ना कभी भी workspace state से silent inheritance में regress नहीं हो सकता।

### Logs और transcripts (redaction और retention)

Access controls सही होने पर भी logs और transcripts संवेदनशील जानकारी लीक कर सकते हैं:

- Gateway logs में tool summaries, errors, और URLs शामिल हो सकते हैं।
- Session transcripts में pasted secrets, file contents, command output, और links शामिल हो सकते हैं।

सिफ़ारिशें:

- Log और transcript redaction चालू रखें (`logging.redactSensitive: "tools"`; default)।
- `logging.redactPatterns` के माध्यम से अपने environment के लिए custom patterns जोड़ें (tokens, hostnames, internal URLs)।
- Diagnostics साझा करते समय raw logs के बजाय `openclaw status --all` (pasteable, secrets redacted) को प्राथमिकता दें।
- यदि आपको लंबी retention की आवश्यकता नहीं है, तो पुराने session transcripts और log files prune करें।

विवरण: [Logging](/hi/gateway/logging)

### DMs: डिफ़ॉल्ट रूप से pairing

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### Groups: हर जगह mention आवश्यक करें

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

Group chats में, केवल तब respond करें जब स्पष्ट रूप से mention किया गया हो।

### अलग numbers (WhatsApp, Signal, Telegram)

Phone-number-based channels के लिए, अपने personal number से अलग phone number पर अपना AI चलाने पर विचार करें:

- Personal number: आपकी conversations निजी रहती हैं
- Bot number: AI इन्हें उपयुक्त boundaries के साथ संभालता है

### Read-only mode (sandbox और tools के माध्यम से)

आप इनको मिलाकर read-only profile बना सकते हैं:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (या workspace access न होने के लिए `"none"`)
- tool allow/deny lists जो `write`, `edit`, `apply_patch`, `exec`, `process`, आदि को block करती हैं।

अतिरिक्त hardening विकल्प:

- `tools.exec.applyPatch.workspaceOnly: true` (default): सुनिश्चित करता है कि sandboxing बंद होने पर भी `apply_patch` workspace directory के बाहर write/delete नहीं कर सकता। केवल तब `false` पर set करें जब आप जानबूझकर चाहते हों कि `apply_patch` workspace के बाहर files को touch करे।
- `tools.fs.workspaceOnly: true` (optional): `read`/`write`/`edit`/`apply_patch` paths और native prompt image auto-load paths को workspace directory तक सीमित करता है (उपयोगी यदि आप आज absolute paths allow करते हैं और single guardrail चाहते हैं)।
- Filesystem roots संकरे रखें: agent workspaces/sandbox workspaces के लिए अपने home directory जैसे broad roots से बचें। Broad roots संवेदनशील local files (उदाहरण के लिए `~/.openclaw` के अंतर्गत state/config) को filesystem tools के सामने expose कर सकते हैं।

### Secure baseline (copy/paste)

एक "safe default" config जो Gateway को private रखता है, DM pairing की आवश्यकता रखता है, और always-on group bots से बचता है:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

यदि आप tool execution भी "safer by default" चाहते हैं, तो किसी भी non-owner agent के लिए sandbox + dangerous tools deny जोड़ें (नीचे "Per-agent access profiles" के अंतर्गत उदाहरण)।

Chat-driven agent turns के लिए built-in baseline: non-owner senders `cron` या `gateway` tools का उपयोग नहीं कर सकते।

## Sandboxing (अनुशंसित)

समर्पित doc: [Sandboxing](/hi/gateway/sandboxing)

दो पूरक approaches:

- **पूरा Gateway Docker में चलाएं** (container boundary): [Docker](/hi/install/docker)
- **Tool sandbox** (`agents.defaults.sandbox`, host gateway + sandbox-isolated tools; Docker default backend है): [Sandboxing](/hi/gateway/sandboxing)

<Note>
Cross-agent access रोकने के लिए, `agents.defaults.sandbox.scope` को `"agent"` (default) पर रखें या stricter per-session isolation के लिए `"session"` पर रखें। `scope: "shared"` single container या workspace का उपयोग करता है।
</Note>

Sandbox के अंदर agent workspace access पर भी विचार करें:

- `agents.defaults.sandbox.workspaceAccess: "none"` (default) agent workspace को off-limits रखता है; tools `~/.openclaw/sandboxes` के अंतर्गत sandbox workspace के विरुद्ध चलते हैं
- `agents.defaults.sandbox.workspaceAccess: "ro"` agent workspace को `/agent` पर read-only mount करता है (`write`/`edit`/`apply_patch` disable करता है)
- `agents.defaults.sandbox.workspaceAccess: "rw"` agent workspace को `/workspace` पर read/write mount करता है
- अतिरिक्त `sandbox.docker.binds` normalized और canonicalized source paths के विरुद्ध validate किए जाते हैं। Parent-symlink tricks और canonical home aliases अब भी fail closed होते हैं यदि वे `/etc`, `/var/run`, या OS home के अंतर्गत credential directories जैसे blocked roots में resolve होते हैं।

<Warning>
`tools.elevated` global baseline escape hatch है जो exec को sandbox के बाहर चलाता है। Effective host default रूप से `gateway` है, या exec target को `node` पर configure करने पर `node` होता है। `tools.elevated.allowFrom` को tight रखें और strangers के लिए इसे enable न करें। आप `agents.list[].tools.elevated` के माध्यम से per agent elevated को और restrict कर सकते हैं। देखें [Elevated mode](/hi/tools/elevated)।
</Warning>

### Sub-agent delegation guardrail

यदि आप session tools allow करते हैं, तो delegated sub-agent runs को another boundary decision मानें:

- जब तक agent को सच में delegation की आवश्यकता न हो, `sessions_spawn` deny करें।
- `agents.defaults.subagents.allowAgents` और किसी भी per-agent `agents.list[].subagents.allowAgents` overrides को known-safe target agents तक restricted रखें।
- किसी भी workflow के लिए जिसे sandboxed रहना चाहिए, `sessions_spawn` को `sandbox: "require"` के साथ call करें (default `inherit` है)।
- `sandbox: "require"` तब fast fail करता है जब target child runtime sandboxed नहीं है।

## Browser control risks

Browser control enable करने से model को real browser drive करने की क्षमता मिलती है।
यदि उस browser profile में पहले से logged-in sessions हैं, तो model उन accounts और data तक
access कर सकता है। Browser profiles को **sensitive state** मानें:

- Agent के लिए dedicated profile (default `openclaw` profile) को प्राथमिकता दें।
- Agent को अपने personal daily-driver profile की ओर point करने से बचें।
- Sandboxed agents के लिए host browser control disabled रखें, जब तक आप उन पर trust न करते हों।
- Standalone loopback browser control API केवल shared-secret auth
  (gateway token bearer auth या gateway password) को honor करता है। यह
  trusted-proxy या Tailscale Serve identity headers consume नहीं करता।
- Browser downloads को untrusted input मानें; isolated downloads directory को प्राथमिकता दें।
- यदि संभव हो, तो agent profile में browser sync/password managers disable करें (blast radius घटाता है)।
- Remote gateways के लिए, मानें कि "browser control" उस profile की पहुंच में आने वाली हर चीज़ के लिए "operator access" के बराबर है।
- Gateway और node hosts को tailnet-only रखें; browser control ports को LAN या public Internet पर expose करने से बचें।
- जब आवश्यकता न हो, browser proxy routing disable करें (`gateway.nodes.browser.mode="off"`)।
- Chrome MCP existing-session mode **"safer" नहीं** है; यह उस host Chrome profile की पहुंच वाली किसी भी चीज़ में आपकी तरह act कर सकता है।

### Browser SSRF policy (default रूप से strict)

OpenClaw की browser navigation policy default रूप से strict है: private/internal destinations तब तक blocked रहते हैं जब तक आप स्पष्ट रूप से opt in नहीं करते।

- Default: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` unset है, इसलिए browser navigation private/internal/special-use destinations को blocked रखता है।
- Legacy alias: compatibility के लिए `browser.ssrfPolicy.allowPrivateNetwork` अब भी accepted है।
- Opt-in mode: private/internal/special-use destinations allow करने के लिए `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` set करें।
- Strict mode में, explicit exceptions के लिए `hostnameAllowlist` (`*.example.com` जैसे patterns) और `allowedHostnames` (exact host exceptions, जिनमें `localhost` जैसे blocked names शामिल हैं) का उपयोग करें।
- Redirect-based pivots घटाने के लिए navigation request से पहले checked होती है और navigation के बाद final `http(s)` URL पर best-effort re-check की जाती है।

Example strict policy:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## Per-agent access profiles (multi-agent)

Multi-agent routing के साथ, प्रत्येक agent की अपनी sandbox + tool policy हो सकती है:
इसका उपयोग per agent **full access**, **read-only**, या **no access** देने के लिए करें।
पूरे विवरण और precedence rules के लिए [Multi-Agent Sandbox & Tools](/hi/tools/multi-agent-sandbox-tools) देखें।

Common use cases:

- Personal agent: full access, no sandbox
- Family/work agent: sandboxed + read-only tools
- Public agent: sandboxed + no filesystem/shell tools

### Example: full access (no sandbox)

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### Example: read-only tools + read-only workspace

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### Example: no filesystem/shell access (provider messaging allowed)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // Session tools can reveal sensitive data from transcripts. By default OpenClaw limits these tools
        // to the current session + spawned subagent sessions, but you can clamp further if needed.
        // See `tools.sessions.visibility` in the configuration reference.
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## घटना प्रतिक्रिया

यदि आपका AI कुछ गलत करता है:

### नियंत्रित करें

1. **इसे रोकें:** macOS ऐप बंद करें (यदि वह Gateway को supervise करता है) या अपनी `openclaw gateway` प्रक्रिया समाप्त करें।
2. **एक्सपोज़र बंद करें:** जब तक आप यह न समझ लें कि क्या हुआ, `gateway.bind: "loopback"` सेट करें (या Tailscale Funnel/Serve अक्षम करें)।
3. **एक्सेस फ़्रीज़ करें:** जोखिम भरे DMs/समूहों को `dmPolicy: "disabled"` पर स्विच करें / mentions आवश्यक करें, और यदि आपके पास `"*"` allow-all प्रविष्टियाँ थीं, तो उन्हें हटा दें।

### रोटेट करें (यदि सीक्रेट्स लीक हुए हैं तो समझौता मानें)

1. Gateway auth (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) रोटेट करें और restart करें।
2. Gateway को कॉल कर सकने वाली किसी भी मशीन पर remote client secrets (`gateway.remote.token` / `.password`) रोटेट करें।
3. provider/API credentials (WhatsApp creds, Slack/Discord tokens, `auth-profiles.json` में model/API keys, और उपयोग किए जाने पर encrypted secrets payload values) रोटेट करें।

### ऑडिट

1. Gateway लॉग जांचें: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (या `logging.file`)।
2. संबंधित ट्रांसक्रिप्ट देखें: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`।
3. हालिया कॉन्फ़िग बदलावों की समीक्षा करें (ऐसी कोई भी चीज़ जिसने पहुंच बढ़ाई हो सकती है: `gateway.bind`, `gateway.auth`, DM/समूह नीतियां, `tools.elevated`, Plugin बदलाव)।
4. `openclaw security audit --deep` फिर से चलाएं और पुष्टि करें कि गंभीर निष्कर्ष हल हो गए हैं।

### रिपोर्ट के लिए इकट्ठा करें

- टाइमस्टैम्प, Gateway होस्ट OS + OpenClaw संस्करण
- सत्र ट्रांसक्रिप्ट + छोटा लॉग टेल (रेडैक्ट करने के बाद)
- हमलावर ने क्या भेजा + एजेंट ने क्या किया
- क्या Gateway loopback से आगे उजागर था (LAN/Tailscale Funnel/Serve)

## सीक्रेट स्कैनिंग

CI रिपॉज़िटरी पर pre-commit `detect-private-key` हुक चलाता है। यदि यह
विफल हो, तो कमिट की गई key सामग्री हटाएं या रोटेट करें, फिर स्थानीय रूप से पुनरुत्पादित करें:

```bash
pre-commit run --all-files detect-private-key
```

## सुरक्षा समस्याओं की रिपोर्ट करना

OpenClaw में कोई vulnerability मिली? कृपया जिम्मेदारी से रिपोर्ट करें:

1. ईमेल: [security@openclaw.ai](mailto:security@openclaw.ai)
2. ठीक होने तक सार्वजनिक रूप से पोस्ट न करें
3. हम आपको श्रेय देंगे (जब तक आप गुमनाम रहना पसंद न करें)
