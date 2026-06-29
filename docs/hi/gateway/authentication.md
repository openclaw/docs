---
read_when:
    - मॉडल प्रमाणीकरण या OAuth समाप्ति को डीबग करना
    - प्रमाणीकरण या क्रेडेंशियल संग्रहण का दस्तावेज़ीकरण
summary: 'मॉडल प्रमाणीकरण: OAuth, API कुंजियाँ, Claude CLI का पुनः उपयोग, और Anthropic setup-token'
title: प्रमाणीकरण
x-i18n:
    generated_at: "2026-06-28T23:05:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
यह पृष्ठ **model provider** प्रमाणीकरण संदर्भ है (API कुंजियां, OAuth, Claude CLI पुनः उपयोग, और Anthropic setup-token)। **gateway connection** प्रमाणीकरण (token, password, trusted-proxy) के लिए, [Configuration](/hi/gateway/configuration) और [Trusted Proxy Auth](/hi/gateway/trusted-proxy-auth) देखें।
</Note>

OpenClaw मॉडल प्रदाताओं के लिए OAuth और API कुंजियों का समर्थन करता है। हमेशा चालू रहने वाले Gateway
होस्ट के लिए, API कुंजियां आमतौर पर सबसे पूर्वानुमेय विकल्प होती हैं। Subscription/OAuth
प्रवाह भी तब समर्थित हैं जब वे आपके प्रदाता खाते के मॉडल से मेल खाते हैं।

पूर्ण OAuth प्रवाह और स्टोरेज
लेआउट के लिए [/concepts/oauth](/hi/concepts/oauth) देखें।
SecretRef-आधारित auth (`env`/`file`/`exec` प्रदाताओं) के लिए, [Secrets Management](/hi/gateway/secrets) देखें।
`models status --probe` द्वारा उपयोग किए जाने वाले credential eligibility/reason-code नियमों के लिए, देखें
[Auth Credential Semantics](/hi/auth-credential-semantics).

## अनुशंसित सेटअप (API कुंजी, कोई भी प्रदाता)

यदि आप लंबे समय तक चलने वाला Gateway चला रहे हैं, तो अपने चुने हुए
प्रदाता के लिए API कुंजी से शुरू करें।
विशेष रूप से Anthropic के लिए, API key auth अभी भी सबसे पूर्वानुमेय सर्वर
सेटअप है, लेकिन OpenClaw स्थानीय Claude CLI login का पुनः उपयोग भी समर्थित करता है।

1. अपने प्रदाता कंसोल में API कुंजी बनाएं।
2. इसे **Gateway होस्ट** (वह मशीन जो `openclaw gateway` चला रही है) पर रखें।

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. यदि Gateway systemd/launchd के अंतर्गत चलता है, तो कुंजी को
   `~/.openclaw/.env` में रखना बेहतर है ताकि daemon उसे पढ़ सके:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

फिर daemon को पुनः आरंभ करें (या अपनी Gateway प्रक्रिया पुनः आरंभ करें) और फिर से जांचें:

```bash
openclaw models status
openclaw doctor
```

यदि आप env vars स्वयं प्रबंधित नहीं करना चाहते, तो onboarding daemon उपयोग के लिए
API कुंजियां संग्रहीत कर सकता है: `openclaw onboard`.

env inheritance (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) के विवरण के लिए [Help](/hi/help) देखें।

## Anthropic: Claude CLI और token संगतता

Anthropic setup-token auth अभी भी OpenClaw में समर्थित token
पथ के रूप में उपलब्ध है। Anthropic staff ने बाद में हमें बताया है कि OpenClaw-शैली Claude CLI उपयोग
फिर से अनुमत है, इसलिए OpenClaw इस integration के लिए Claude CLI reuse और `claude -p` उपयोग को
स्वीकृत मानता है, जब तक Anthropic कोई नई नीति प्रकाशित नहीं करता। जब
Claude CLI reuse होस्ट पर उपलब्ध हो, तो अब वही पसंदीदा पथ है।

लंबे समय तक चलने वाले Gateway होस्ट के लिए, Anthropic API कुंजी अभी भी सबसे पूर्वानुमेय
सेटअप है। यदि आप उसी होस्ट पर मौजूदा Claude login का पुनः उपयोग करना चाहते हैं, तो onboarding/configure में
Anthropic Claude CLI पथ का उपयोग करें।

Claude CLI reuse के लिए अनुशंसित होस्ट सेटअप:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

यह दो-चरण वाला सेटअप है:

1. Claude Code को स्वयं Gateway होस्ट पर Anthropic में login करें।
2. OpenClaw को Anthropic मॉडल चयन को स्थानीय `claude-cli`
   backend पर स्विच करने और मेल खाने वाली OpenClaw auth profile संग्रहीत करने के लिए कहें।

यदि `claude` `PATH` पर नहीं है, तो पहले Claude Code install करें या
`agents.defaults.cliBackends.claude-cli.command` को वास्तविक binary path पर सेट करें।

Manual token entry (कोई भी प्रदाता; per-agent SQLite auth store लिखता है + config अपडेट करता है):

```bash
openclaw models auth paste-token --provider openrouter
```

auth profile store केवल credentials रखता है। पुराने `auth-profiles.json` files ने इस canonical shape का उपयोग किया था:

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw अब प्रत्येक agent के `openclaw-agent.sqlite` से auth profiles पढ़ता है। यदि किसी पुराने install में अभी भी `auth-profiles.json`, `auth-state.json`, या `{ "openrouter": { "apiKey": "..." } }` जैसी flat auth profile file है, तो इसे SQLite में import करने के लिए `openclaw doctor --fix` चलाएं; doctor मूल JSON files के पास timestamped backups रखता है। `baseUrl`, `api`, model ids, headers, और timeouts जैसे endpoint details `openclaw.json` या `models.json` में `models.providers.<id>` के अंतर्गत आते हैं, auth profiles में नहीं।

Bedrock `auth: "aws-sdk"` जैसे external auth routes भी credentials नहीं हैं। यदि आप named Bedrock route चाहते हैं, तो `openclaw.json` में `auth.profiles.<id>.mode: "aws-sdk"` रखें; auth profile store में `type: "aws-sdk"` न लिखें। `openclaw doctor --fix` legacy AWS SDK markers को credential store से config metadata में ले जाता है।

Static credentials के लिए auth profile refs भी समर्थित हैं:

- `api_key` credentials `keyRef: { source, provider, id }` का उपयोग कर सकते हैं
- `token` credentials `tokenRef: { source, provider, id }` का उपयोग कर सकते हैं
- OAuth-mode profiles SecretRef credentials का समर्थन नहीं करते; यदि `auth.profiles.<id>.mode` `"oauth"` पर सेट है, तो उस profile के लिए SecretRef-backed `keyRef`/`tokenRef` input अस्वीकृत किया जाता है।

Automation-friendly check (expired/missing होने पर exit `1`, expiring होने पर `2`):

```bash
openclaw models status --check
```

Live auth probes:

```bash
openclaw models status --probe
```

नोट्स:

- Probe rows auth profiles, env credentials, या `models.json` से आ सकती हैं।
- यदि स्पष्ट `auth.order.<provider>` किसी stored profile को छोड़ देता है, तो probe उसे आजमाने के बजाय
  उस profile के लिए `excluded_by_auth_order` रिपोर्ट करता है।
- यदि auth मौजूद है लेकिन OpenClaw उस provider के लिए probeable model candidate resolve नहीं कर सकता,
  तो probe `status: no_model` रिपोर्ट करता है।
- Rate-limit cooldowns model-scoped हो सकते हैं। किसी एक
  model के लिए cooling down profile उसी provider पर sibling model के लिए अब भी usable हो सकती है।

Optional ops scripts (systemd/Termux) यहां दस्तावेजित हैं:
[Auth monitoring scripts](/hi/help/scripts#auth-monitoring-scripts)

## Anthropic नोट

Anthropic `claude-cli` backend फिर से समर्थित है।

- Anthropic staff ने हमें बताया कि यह OpenClaw integration path फिर से अनुमत है।
- इसलिए OpenClaw Anthropic-backed runs के लिए Claude CLI reuse और `claude -p` उपयोग को स्वीकृत
  मानता है, जब तक Anthropic कोई नई नीति प्रकाशित नहीं करता।
- Anthropic API keys लंबे समय तक चलने वाले Gateway
  होस्ट और स्पष्ट server-side billing control के लिए सबसे पूर्वानुमेय विकल्प बनी रहती हैं।

## model auth status जांचना

```bash
openclaw models status
openclaw doctor
```

## API key rotation behavior (Gateway)

कुछ providers वैकल्पिक कुंजियों के साथ request retry करने का समर्थन करते हैं जब API call
provider rate limit से टकराती है।

- प्राथमिकता क्रम:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (single override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google providers अतिरिक्त fallback के रूप में `GOOGLE_API_KEY` भी शामिल करते हैं।
- वही key list उपयोग से पहले deduplicate की जाती है।
- OpenClaw केवल rate-limit errors के लिए अगली key के साथ retry करता है (उदाहरण के लिए
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, या
  `workers_ai ... quota limit exceeded`)।
- Non-rate-limit errors को alternate keys के साथ retry नहीं किया जाता।
- यदि सभी keys विफल होती हैं, तो last attempt की final error लौटाई जाती है।

## Gateway चलने के दौरान provider auth हटाना

जब provider auth Gateway control plane के माध्यम से हटाया जाता है, तो OpenClaw उस provider के लिए
saved auth profiles हटाता है और उन active chat या agent runs को abort करता है
जिनका selected model provider हटाए गए provider से मेल खाता है। Aborted runs सामान्य chat cancellation और lifecycle events को
`stopReason: "auth-revoked"` के साथ emit करते हैं, ताकि connected clients दिखा सकें कि run
credentials हटाए जाने के कारण रोका गया था।

Saved auth हटाने से provider पर keys revoke नहीं होतीं। जब आपको provider-side invalidation चाहिए, तो
provider dashboard में key rotate या revoke करें।

## कौन सा credential उपयोग किया जाए नियंत्रित करना

### OpenAI और legacy `openai-codex` ids

OpenAI API-key profiles और ChatGPT/Codex OAuth profiles दोनों canonical
provider id `openai` का उपयोग करते हैं। New config को `openai:*` profile ids और
`auth.order.openai` का उपयोग करना चाहिए।

यदि आपको older config, auth profile ids, या
`auth.order.openai-codex` में `openai-codex` दिखे, तो इसे legacy migration input मानें। नए
`openai-codex` profiles न बनाएं। चलाएं:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor legacy `openai-codex:*` profile ids और
`auth.order.openai-codex` entries को canonical `openai` auth route में rewrite करता है। OpenAI-specific model/runtime routing के लिए, [OpenAI](/hi/providers/openai) देखें।

### Login के दौरान (CLI)

Login के दौरान named auth profiles का समर्थन करने वाले
providers के लिए `openclaw models auth login --provider <id> --profile-id <profileId>` उपयोग करें।

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

यह एक ही agent के अंदर समान provider के लिए कई OAuth logins को
अलग रखने का सबसे आसान तरीका है।

जब saved provider profile stuck, expired, या गलत account से जुड़ी हो और normal login command उसे बार-बार reuse करता रहे, तो `--force` उपयोग करें। `--force` selected agent directory में उस provider के saved auth profiles हटाता है, फिर
वही provider auth flow फिर से चलाता है। यह provider पर credentials revoke नहीं करता; जब आपको
provider-side invalidation चाहिए, तो provider dashboard में उन्हें rotate या revoke करें।

```bash
openclaw models auth login --provider anthropic --force
```

### Per-session (chat command)

Current session के लिए specific provider credential pin करने हेतु `/model <alias-or-id>@<profileId>` उपयोग करें (example profile ids: `anthropic:default`, `anthropic:work`)।

Compact picker के लिए `/model` (या `/model list`) उपयोग करें; full view (candidates + next auth profile, साथ ही configured होने पर provider endpoint details) के लिए `/model status` उपयोग करें।

### Per-agent (CLI override)

किसी agent के लिए explicit auth profile order override सेट करें (उस agent की SQLite auth state में stored):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Specific agent target करने के लिए `--agent <id>` उपयोग करें; configured default agent उपयोग करने के लिए इसे छोड़ दें।
जब आप order issues debug करते हैं, तो `openclaw models status --probe` omitted
stored profiles को silently skip करने के बजाय `excluded_by_auth_order` के रूप में दिखाता है।
जब आप cooldown issues debug करते हैं, याद रखें कि rate-limit cooldowns पूरे provider profile के बजाय
एक model id से जुड़े हो सकते हैं।

यदि आप पहले से चल रही chat के लिए auth order या profile pinning बदलते हैं,
तो fresh session शुरू करने के लिए उस chat में `/new` या `/reset` भेजें। Existing
sessions reset तक अपना current model/profile selection रख सकते हैं।

## Troubleshooting

### "No credentials found"

यदि Anthropic profile missing है, तो **Gateway होस्ट** पर Anthropic API key configure करें
या Anthropic setup-token path set up करें, फिर re-check करें:

```bash
openclaw models status
```

### Token expiring/expired

कौन सा profile expiring है इसकी पुष्टि करने के लिए `openclaw models status` चलाएं। यदि
Anthropic token profile missing या expired है, तो उस setup को
setup-token के माध्यम से refresh करें या Anthropic API key पर migrate करें।

## Related

- [Secrets management](/hi/gateway/secrets)
- [Remote access](/hi/gateway/remote)
- [Auth storage](/hi/concepts/oauth)
