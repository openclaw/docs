---
read_when:
    - आप OpenClaw OAuth को शुरू से अंत तक समझना चाहते हैं
    - आपको टोकन अमान्यकरण / लॉगआउट समस्याएँ आ रही हैं
    - आप Claude CLI या OAuth प्रमाणीकरण प्रवाह चाहते हैं
    - आप एकाधिक खाते या प्रोफ़ाइल रूटिंग चाहते हैं
summary: 'OpenClaw में OAuth: टोकन विनिमय, संग्रहण, और बहु-खाता पैटर्न'
title: OAuth
x-i18n:
    generated_at: "2026-06-28T23:00:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4aa48fd468a541ed72935833a3196105798380799fa6135fe1dd9f68838307b6
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw उन providers के लिए OAuth के माध्यम से "सदस्यता प्रमाणीकरण" का समर्थन करता है जो इसे देते हैं
(विशेष रूप से **OpenAI Codex (ChatGPT OAuth)**)। Anthropic के लिए, व्यावहारिक विभाजन
अब यह है:

- **Anthropic API कुंजी**: सामान्य Anthropic API बिलिंग
- **OpenClaw के अंदर Anthropic Claude CLI / सदस्यता प्रमाणीकरण**: Anthropic कर्मचारियों ने
  हमें बताया कि यह उपयोग फिर से अनुमत है

OpenAI Codex OAuth, OpenClaw जैसे बाहरी टूल में उपयोग के लिए स्पष्ट रूप से समर्थित है.

OpenClaw, OpenAI API-कुंजी प्रमाणीकरण और ChatGPT/Codex OAuth दोनों को
canonical provider id `openai` के अंतर्गत संग्रहीत करता है. पुराने `openai-codex:*` प्रोफ़ाइल ids और
`auth.order.openai-codex` प्रविष्टियां legacy state हैं जिन्हें
`openclaw doctor --fix` द्वारा ठीक किया जाता है; नई config के लिए `openai:*` प्रोफ़ाइल ids और `auth.order.openai` का उपयोग करें.

Production में Anthropic के लिए, API कुंजी प्रमाणीकरण अधिक सुरक्षित अनुशंसित मार्ग है.

यह पेज समझाता है:

- OAuth **टोकन exchange** कैसे काम करता है (PKCE)
- टोकन कहां **संग्रहीत** होते हैं (और क्यों)
- **कई accounts** कैसे संभालें (profiles + per-session overrides)

OpenClaw **provider plugins** का भी समर्थन करता है जो अपने OAuth या API-कुंजी
flows के साथ आते हैं. उन्हें इस तरह चलाएं:

```bash
openclaw models auth login --provider <id>
```

## टोकन sink (यह क्यों मौजूद है)

OAuth providers आम तौर पर login/refresh flows के दौरान एक **नया refresh token** बनाते हैं. कुछ providers (या OAuth clients) उसी user/app के लिए नया token जारी होने पर पुराने refresh tokens को अमान्य कर सकते हैं.

व्यावहारिक लक्षण:

- आप OpenClaw _और_ Claude Code / Codex CLI के माध्यम से login करते हैं → उनमें से एक बाद में बेतरतीब ढंग से "logged out" हो जाता है

इसे कम करने के लिए, OpenClaw `auth-profiles.json` को **टोकन sink** की तरह मानता है:

- runtime credentials को **एक जगह** से पढ़ता है
- हम कई profiles रख सकते हैं और उन्हें deterministic तरीके से route कर सकते हैं
- external CLI reuse provider-specific है: Codex CLI एक खाली
  `openai:default` profile bootstrap कर सकता है, लेकिन जब OpenClaw के पास local OAuth profile हो,
  तो local refresh token canonical होता है. यदि वह local refresh token अस्वीकार हो जाए,
  तो OpenClaw runtime-only fallback के रूप में उसी account का usable Codex CLI token उपयोग कर सकता है;
  अन्य integrations externally managed रह सकते हैं और अपने
  CLI auth store को फिर से पढ़ सकते हैं
- status और startup paths जिन्हें पहले से configured provider set पता होता है, वे
  external CLI discovery को उसी set तक scope करते हैं, ताकि single-provider setup के लिए कोई असंबंधित CLI login store
  probe न किया जाए

## Storage (टोकन कहां रहते हैं)

Secrets agent auth stores में संग्रहीत होते हैं:

- Auth profiles (OAuth + API keys + optional value-level refs): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy compatibility file: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (static `api_key` entries मिलने पर scrub कर दी जाती हैं)

Legacy import-only file (अभी भी समर्थित, लेकिन मुख्य store नहीं):

- `~/.openclaw/credentials/oauth.json` (पहले उपयोग पर `auth-profiles.json` में import होती है)

ऊपर दी गई सभी चीजें `$OPENCLAW_STATE_DIR` (state dir override) का भी सम्मान करती हैं. पूरा reference: [/gateway/configuration](/hi/gateway/configuration-reference#auth-storage)

Static secret refs और runtime snapshot activation behavior के लिए, [Secrets Management](/hi/gateway/secrets) देखें.

जब किसी secondary agent के पास local auth profile नहीं होता, OpenClaw default/main agent store से read-through
inheritance का उपयोग करता है. यह read पर main
agent के `auth-profiles.json` को clone नहीं करता. OAuth refresh tokens विशेष रूप से
sensitive होते हैं: सामान्य copy flows उन्हें default रूप से छोड़ देते हैं क्योंकि कुछ providers उपयोग के बाद refresh tokens को rotate
या invalidate कर देते हैं. जब किसी
agent को independent account चाहिए, तो उसके लिए अलग OAuth login configure करें.

## Anthropic legacy token compatibility

<Warning>
Anthropic के public Claude Code docs कहते हैं कि direct Claude Code use
Claude subscription limits के भीतर रहता है, और Anthropic कर्मचारियों ने हमें बताया कि OpenClaw-style Claude
CLI usage फिर से अनुमत है. इसलिए OpenClaw इस integration के लिए Claude CLI reuse और
`claude -p` usage को sanctioned मानता है, जब तक Anthropic
नई policy प्रकाशित न करे.

Anthropic के current direct-Claude-Code plan docs के लिए, [अपने Pro या Max
plan के साथ Claude Code का उपयोग करना](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
और [अपने Team या Enterprise
plan के साथ Claude Code का उपयोग करना](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/) देखें.

यदि आप OpenClaw में अन्य subscription-style options चाहते हैं, तो [OpenAI
Codex](/hi/providers/openai), [Qwen Cloud Coding
Plan](/hi/providers/qwen), [MiniMax Coding Plan](/hi/providers/minimax),
और [Z.AI / GLM Coding Plan](/hi/providers/zai) देखें.
</Warning>

OpenClaw, Anthropic setup-token को supported token-auth path के रूप में भी expose करता है, लेकिन अब उपलब्ध होने पर Claude CLI reuse और `claude -p` को प्राथमिकता देता है.

## Anthropic Claude CLI migration

OpenClaw फिर से Anthropic Claude CLI reuse का समर्थन करता है. यदि host पर आपके पास पहले से local
Claude login है, तो onboarding/configure उसे सीधे reuse कर सकता है.

## OAuth exchange (login कैसे काम करता है)

OpenClaw के interactive login flows `openclaw/plugin-sdk/llm` में implement किए गए हैं और wizards/commands से जुड़े हैं.

### Anthropic setup-token

Flow shape:

1. OpenClaw से Anthropic setup-token शुरू करें या paste-token करें
2. OpenClaw resulting Anthropic credential को auth profile में store करता है
3. model selection `anthropic/...` पर रहता है
4. मौजूदा Anthropic auth profiles rollback/order control के लिए उपलब्ध रहते हैं

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth, Codex CLI के बाहर उपयोग के लिए स्पष्ट रूप से समर्थित है, जिसमें OpenClaw workflows शामिल हैं.

Login command अब भी canonical OpenAI provider id का उपयोग करता है:

```bash
openclaw models auth login --provider openai
```

एक agent में कई ChatGPT/Codex OAuth accounts के लिए `--profile-id openai:<name>` का उपयोग करें.
नई profiles के लिए `openai-codex:<name>` का उपयोग न करें. Doctor उस पुराने prefix को
collision-free `openai:*` profile id में migrate करता है; repair के बाद
profile ids को `auth.order` या `/model ...@<profileId>` में copy करने से पहले
`openclaw models auth list --provider openai` चलाएं.

Flow shape (PKCE):

1. PKCE verifier/challenge + random `state` generate करें
2. `https://auth.openai.com/oauth/authorize?...` खोलें
3. `http://127.0.0.1:1455/auth/callback` पर callback capture करने की कोशिश करें
4. यदि callback bind नहीं हो सकता (या आप remote/headless हैं), तो redirect URL/code paste करें
5. `https://auth.openai.com/oauth/token` पर exchange करें
6. access token से `accountId` extract करें और `{ access, refresh, expires, accountId }` store करें

Wizard path `openclaw onboard` → auth choice `openai` है.

## Refresh + expiry

Profiles एक `expires` timestamp store करते हैं.

Runtime पर:

- यदि `expires` भविष्य में है → stored access token का उपयोग करें
- यदि expired है → refresh करें (file lock के अंतर्गत) और stored credentials overwrite करें
- यदि secondary agent inherited main-agent OAuth profile पढ़ता है, तो refresh
  refresh token को secondary agent store में copy करने के बजाय main agent store में वापस लिखता है
- exception: कुछ external CLI credentials externally managed रहते हैं; OpenClaw
  copied refresh tokens खर्च करने के बजाय उन CLI auth stores को फिर से पढ़ता है.
  Codex CLI bootstrap जानबूझकर संकरा है: यह एक खाली
  `openai:default` profile seed करता है, फिर OpenClaw-owned refreshes local
  profile को canonical बनाए रखते हैं. यदि local Codex refresh fail हो जाए और Codex CLI में उसी account के लिए
  usable token हो, तो OpenClaw current
  runtime request के लिए उस token का उपयोग कर सकता है, उसे `auth-profiles.json` में वापस लिखे बिना.

Refresh flow automatic है; आम तौर पर आपको tokens manually manage करने की जरूरत नहीं होती.

## कई accounts (profiles) + routing

दो patterns:

### 1) पसंदीदा: अलग agents

यदि आप चाहते हैं कि "personal" और "work" कभी interact न करें, तो isolated agents (separate sessions + credentials + workspace) का उपयोग करें:

```bash
openclaw agents add work
openclaw agents add personal
```

फिर per-agent auth configure करें (wizard) और chats को सही agent तक route करें.

### 2) Advanced: एक agent में कई profiles

`auth-profiles.json` एक ही provider के लिए कई profile IDs का समर्थन करता है.

कौन-सी profile use होगी, इसे चुनें:

- config ordering (`auth.order`) के माध्यम से globally
- `/model ...@<profileId>` के माध्यम से per-session

Example (session override):

- `/model Opus@anthropic:work`

कौन-सी profile IDs मौजूद हैं, यह देखने का तरीका:

- `openclaw channels list --json` (`auth[]` दिखाता है)

Related docs:

- [Model failover](/hi/concepts/model-failover) (rotation + cooldown rules)
- [Slash commands](/hi/tools/slash-commands) (command surface)

## Related

- [Authentication](/hi/gateway/authentication) - model provider auth overview
- [Secrets](/hi/gateway/secrets) - credential storage और SecretRef
- [Configuration Reference](/hi/gateway/configuration-reference#auth-storage) - auth config keys
