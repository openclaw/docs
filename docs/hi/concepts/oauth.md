---
read_when:
    - आप OpenClaw OAuth को शुरू से अंत तक समझना चाहते हैं
    - आपको टोकन अमान्यकरण / लॉगआउट समस्याएँ आईं
    - आप Claude CLI या OAuth प्रमाणीकरण प्रवाह चाहते हैं
    - आप कई खाते या प्रोफ़ाइल रूटिंग चाहते हैं
summary: 'OpenClaw में OAuth: टोकन विनिमय, भंडारण, और बहु-खाता प्रतिमान'
title: OAuth
x-i18n:
    generated_at: "2026-07-02T22:34:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cffefec8bb3e755bcd4583a7957510c7ba3b605e21a3fd876f27c8fc9aa65aa
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw उन प्रदाताओं के लिए OAuth के माध्यम से "सब्सक्रिप्शन auth" का समर्थन करता है जो इसे प्रदान करते हैं
(विशेष रूप से **OpenAI Codex (ChatGPT OAuth)**)। Anthropic के लिए, व्यावहारिक विभाजन
अब यह है:

- **Anthropic API key**: सामान्य Anthropic API बिलिंग
- **Anthropic Claude CLI / OpenClaw के अंदर सब्सक्रिप्शन auth**: Anthropic कर्मचारियों ने
  हमें बताया कि यह उपयोग फिर से अनुमत है

OpenAI Codex OAuth को OpenClaw जैसे बाहरी टूल में उपयोग के लिए स्पष्ट रूप से समर्थित किया गया है।

OpenClaw OpenAI API-key auth और ChatGPT/Codex OAuth दोनों को
कैनोनिकल provider id `openai` के अंतर्गत संग्रहीत करता है। पुराने `openai-codex:*` profile ids और
`auth.order.openai-codex` प्रविष्टियाँ legacy state हैं जिन्हें
`openclaw doctor --fix` द्वारा सुधारा जाता है; नए config के लिए `openai:*` profile ids और `auth.order.openai` का उपयोग करें।

उत्पादन में Anthropic के लिए, API key auth अधिक सुरक्षित अनुशंसित पथ है।

यह पृष्ठ समझाता है:

- OAuth **token exchange** कैसे काम करता है (PKCE)
- tokens कहाँ **stored** होते हैं (और क्यों)
- **multiple accounts** कैसे संभालें (profiles + प्रति-session overrides)

OpenClaw **provider plugins** का भी समर्थन करता है जो अपने OAuth या API-key
flows के साथ आते हैं। उन्हें इस तरह चलाएँ:

```bash
openclaw models auth login --provider <id>
```

## टोकन सिंक (यह क्यों मौजूद है)

OAuth providers आमतौर पर login/refresh flows के दौरान एक **नया refresh token** जारी करते हैं। कुछ providers (या OAuth clients) उसी user/app के लिए नया token जारी होने पर पुराने refresh tokens को अमान्य कर सकते हैं।

व्यावहारिक लक्षण:

- आप OpenClaw _और_ Claude Code / Codex CLI के माध्यम से log in करते हैं → उनमें से एक बाद में अचानक "logged out" हो जाता है

इसे कम करने के लिए, OpenClaw `auth-profiles.json` को एक **token sink** की तरह मानता है:

- runtime credentials को **एक ही जगह** से पढ़ता है
- हम multiple profiles रख सकते हैं और उन्हें deterministic तरीके से route कर सकते हैं
- बाहरी CLI reuse provider-specific है: Codex CLI एक खाली
  `openai:default` profile को bootstrap कर सकता है, लेकिन जब OpenClaw के पास local OAuth profile हो,
  तो local refresh token canonical होता है। अगर वह local refresh token reject हो जाता है,
  OpenClaw re-authentication के लिए managed profile की रिपोर्ट करता है, बजाय इसके कि
  Codex CLI token material को sibling runtime fallback की तरह उपयोग करे। अन्य integrations
  externally managed रह सकती हैं और अपने CLI auth store को फिर से पढ़ सकती हैं
- status और startup paths जो पहले से configured provider set जानते हैं, वे
  external CLI discovery को उसी set तक सीमित रखते हैं, ताकि unrelated CLI login store को
  single-provider setup के लिए probe न किया जाए

## स्टोरेज (tokens कहाँ रहते हैं)

Secrets agent auth stores में संग्रहीत होते हैं:

- Auth profiles (OAuth + API keys + optional value-level refs): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy compatibility file: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (static `api_key` entries मिलते ही scrub कर दी जाती हैं)

Legacy import-only file (अब भी समर्थित, लेकिन main store नहीं):

- `~/.openclaw/credentials/oauth.json` (पहले उपयोग पर `auth-profiles.json` में imported)

ऊपर की सभी चीजें `$OPENCLAW_STATE_DIR` (state dir override) का भी सम्मान करती हैं। पूरा reference: [/gateway/configuration](/hi/gateway/configuration-reference#auth-storage)

Static secret refs और runtime snapshot activation behavior के लिए, [Secrets Management](/hi/gateway/secrets) देखें।

जब किसी secondary agent के पास local auth profile नहीं होती, OpenClaw default/main agent store से read-through
inheritance का उपयोग करता है। यह read पर main
agent के `auth-profiles.json` को clone नहीं करता। OAuth refresh tokens विशेष रूप से
sensitive होते हैं: सामान्य copy flows उन्हें default रूप से skip करते हैं क्योंकि कुछ providers उपयोग के बाद
refresh tokens को rotate या invalidate कर देते हैं। जब किसी
agent को independent account चाहिए, तो उसके लिए अलग OAuth login configure करें।

## Anthropic legacy token compatibility

<Warning>
Anthropic के public Claude Code docs कहते हैं कि direct Claude Code उपयोग
Claude subscription limits के भीतर रहता है, और Anthropic कर्मचारियों ने हमें बताया कि OpenClaw-style Claude
CLI उपयोग फिर से अनुमत है। इसलिए OpenClaw Claude CLI reuse और
`claude -p` उपयोग को इस integration के लिए sanctioned मानता है, जब तक Anthropic
नई policy publish नहीं करता।

Anthropic के current direct-Claude-Code plan docs के लिए, [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
और [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/) देखें।

अगर आप OpenClaw में अन्य subscription-style options चाहते हैं, तो [OpenAI
Codex](/hi/providers/openai), [Qwen Cloud Coding
Plan](/hi/providers/qwen), [MiniMax Coding Plan](/hi/providers/minimax),
और [Z.AI / GLM Coding Plan](/hi/providers/zai) देखें।
</Warning>

OpenClaw Anthropic setup-token को भी समर्थित token-auth path के रूप में expose करता है, लेकिन अब उपलब्ध होने पर Claude CLI reuse और `claude -p` को प्राथमिकता देता है।

## Anthropic Claude CLI migration

OpenClaw Anthropic Claude CLI reuse को फिर से समर्थन देता है। अगर आपके पास host पर पहले से local
Claude login है, तो onboarding/configure उसे सीधे reuse कर सकता है।

## OAuth exchange (login कैसे काम करता है)

OpenClaw के interactive login flows `openclaw/plugin-sdk/llm` में implement किए गए हैं और wizards/commands से जुड़े हैं।

### Anthropic setup-token

Flow shape:

1. OpenClaw से Anthropic setup-token शुरू करें या paste-token करें
2. OpenClaw परिणामी Anthropic credential को auth profile में store करता है
3. model selection `anthropic/...` पर रहता है
4. मौजूदा Anthropic auth profiles rollback/order control के लिए उपलब्ध रहती हैं

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth को Codex CLI के बाहर उपयोग के लिए स्पष्ट रूप से समर्थित किया गया है, जिसमें OpenClaw workflows शामिल हैं।

Login command अब भी canonical OpenAI provider id का उपयोग करता है:

```bash
openclaw models auth login --provider openai
```

एक agent में multiple ChatGPT/Codex OAuth accounts के लिए `--profile-id openai:<name>` उपयोग करें।
नई profiles के लिए `openai-codex:<name>` का उपयोग न करें। Doctor
उस पुराने prefix को collision-free `openai:*` profile id में migrate करता है; repair के बाद
profile ids को `auth.order` या `/model ...@<profileId>` में copy करने से पहले
`openclaw models auth list --provider openai` चलाएँ।

Flow shape (PKCE):

1. PKCE verifier/challenge + random `state` generate करें
2. `https://auth.openai.com/oauth/authorize?...` खोलें
3. `http://127.0.0.1:1455/auth/callback` पर callback capture करने की कोशिश करें
4. अगर callback bind नहीं हो सकता (या आप remote/headless हैं), redirect URL/code paste करें
5. `https://auth.openai.com/oauth/token` पर exchange करें
6. access token से `accountId` निकालें और `{ access, refresh, expires, accountId }` store करें

Wizard path `openclaw onboard` → auth choice `openai` है।

## Refresh + expiry

Profiles एक `expires` timestamp store करती हैं।

Runtime पर:

- अगर `expires` भविष्य में है → stored access token उपयोग करें
- अगर expired है → refresh करें (file lock के अंतर्गत) और stored credentials overwrite करें
- अगर secondary agent inherited main-agent OAuth profile पढ़ता है, तो refresh
  refresh token को secondary agent store में copy करने के बजाय main agent store में वापस लिखता है
- exception: कुछ external CLI credentials externally managed रहते हैं; OpenClaw
  copied refresh tokens खर्च करने के बजाय उन CLI auth stores को फिर से पढ़ता है।
  Codex CLI bootstrap जानबूझकर संकरा है: यह केवल तब खाली
  `openai:default` या explicitly requested OpenAI profile seed कर सकता है जब OpenClaw
  provider के लिए OAuth own करने से पहले हो। उसके बाद, OpenClaw-owned refreshes local
  profiles को canonical रखते हैं और discovery किसी भी sibling
  slot में Codex CLI auth नहीं जोड़ती। अगर managed refresh fail होता है, OpenClaw external CLI token material लौटाने के बजाय
  re-authentication के लिए affected profile की रिपोर्ट करता है।

Refresh flow automatic है; आम तौर पर आपको tokens manually manage करने की जरूरत नहीं होती।

## Multiple accounts (profiles) + routing

दो patterns:

### 1) Preferred: अलग agents

अगर आप चाहते हैं कि "personal" और "work" कभी interact न करें, isolated agents (separate sessions + credentials + workspace) उपयोग करें:

```bash
openclaw agents add work
openclaw agents add personal
```

फिर per-agent auth configure करें (wizard) और chats को सही agent तक route करें।

### 2) Advanced: एक agent में multiple profiles

`auth-profiles.json` same provider के लिए multiple profile IDs support करता है।

कौन-सी profile उपयोग होगी, यह चुनें:

- config ordering (`auth.order`) के माध्यम से globally
- `/model ...@<profileId>` के माध्यम से per-session

Example (session override):

- `/model Opus@anthropic:work`

कौन-सी profile IDs मौजूद हैं, यह कैसे देखें:

- `openclaw channels list --json` (`auth[]` दिखाता है)

संबंधित docs:

- [Model failover](/hi/concepts/model-failover) (rotation + cooldown rules)
- [Slash commands](/hi/tools/slash-commands) (command surface)

## संबंधित

- [Authentication](/hi/gateway/authentication) - model provider auth overview
- [Secrets](/hi/gateway/secrets) - credential storage और SecretRef
- [Configuration Reference](/hi/gateway/configuration-reference#auth-storage) - auth config keys
