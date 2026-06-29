---
read_when:
    - आप डिफ़ॉल्ट मॉडल बदलना चाहते हैं या provider auth स्थिति देखना चाहते हैं
    - आप उपलब्ध मॉडलों/प्रदाताओं को स्कैन करना और auth प्रोफाइल डीबग करना चाहते हैं
summary: '`openclaw models` के लिए CLI संदर्भ (status/list/set/scan, उपनाम, फ़ॉलबैक, प्रमाणीकरण)'
title: मॉडल
x-i18n:
    generated_at: "2026-06-28T22:50:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15d0a01e0f8f971996359413306a1c694e5a787eaef69b13eb8ac63c2a7c8990
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

मॉडल खोज, स्कैनिंग, और कॉन्फ़िगरेशन (डिफ़ॉल्ट मॉडल, फॉलबैक, ऑथ प्रोफ़ाइलें)।

संबंधित:

- प्रोवाइडर + मॉडल: [मॉडल](/hi/providers/models)
- मॉडल चयन की अवधारणाएँ + `/models` स्लैश कमांड: [मॉडल अवधारणा](/hi/concepts/models)
- प्रोवाइडर ऑथ सेटअप: [शुरुआत करना](/hi/start/getting-started)

## सामान्य कमांड

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` हल किए गए डिफ़ॉल्ट/फॉलबैक के साथ ऑथ अवलोकन दिखाता है।
जब प्रोवाइडर उपयोग स्नैपशॉट उपलब्ध होते हैं, तो OAuth/API-key स्थिति सेक्शन में
प्रोवाइडर उपयोग विंडो और कोटा स्नैपशॉट शामिल होते हैं।
वर्तमान उपयोग-विंडो प्रोवाइडर: Anthropic, GitHub Copilot, Gemini CLI, OpenAI,
MiniMax, Xiaomi, और z.ai। उपयोग ऑथ उपलब्ध होने पर प्रोवाइडर-विशिष्ट हुक से आता है;
अन्यथा OpenClaw ऑथ प्रोफ़ाइल, env, या कॉन्फ़िग से मेल खाते OAuth/API-key
क्रेडेंशियल पर वापस जाता है।
`--json` आउटपुट में, `auth.providers` env/config/store-जागरूक प्रोवाइडर
अवलोकन है, जबकि `auth.oauth` केवल ऑथ-स्टोर प्रोफ़ाइल स्वास्थ्य है।
हर कॉन्फ़िगर की गई प्रोवाइडर प्रोफ़ाइल के विरुद्ध लाइव ऑथ प्रोब चलाने के लिए `--probe` जोड़ें।
प्रोब वास्तविक अनुरोध हैं (टोकन खर्च कर सकते हैं और रेट लिमिट ट्रिगर कर सकते हैं)।
कॉन्फ़िगर किए गए एजेंट की मॉडल/ऑथ स्थिति देखने के लिए `--agent <id>` का उपयोग करें। जब छोड़ा जाता है,
कमांड `OPENCLAW_AGENT_DIR` सेट होने पर उसका उपयोग करता है, अन्यथा
कॉन्फ़िगर किए गए डिफ़ॉल्ट एजेंट का।
प्रोब पंक्तियाँ ऑथ प्रोफ़ाइल, env क्रेडेंशियल, या `models.json` से आ सकती हैं।
OpenAI ChatGPT/Codex OAuth समस्या निवारण के लिए, `openclaw models status`,
`openclaw models auth list --provider openai`, और
`openclaw config get agents.defaults.model --json` यह पुष्टि करने का सबसे तेज़ तरीका हैं
कि किसी एजेंट के पास native Codex runtime के माध्यम से `openai/*` के लिए
उपयोग योग्य `openai` OAuth प्रोफ़ाइल है या नहीं। [OpenAI प्रोवाइडर सेटअप](/hi/providers/openai#check-and-recover-codex-oauth-routing) देखें।

नोट्स:

- `models set <model-or-alias>` `provider/model` या alias स्वीकार करता है।
- `models list` केवल-पढ़ने योग्य है: यह कॉन्फ़िग, ऑथ प्रोफ़ाइल, मौजूदा catalog
  स्थिति, और प्रोवाइडर-स्वामित्व वाली catalog पंक्तियाँ पढ़ता है, लेकिन
  `models.json` को दोबारा नहीं लिखता।
- `Auth` कॉलम प्रोवाइडर-स्तर का और केवल-पढ़ने योग्य है। यह स्थानीय
  ऑथ प्रोफ़ाइल मेटाडेटा, env markers, कॉन्फ़िगर की गई प्रोवाइडर keys, local-provider
  markers, AWS Bedrock env/profile markers, और plugin synthetic-auth metadata से गणना किया जाता है;
  यह प्रोवाइडर runtime लोड नहीं करता, keychain secrets नहीं पढ़ता, प्रोवाइडर
  APIs कॉल नहीं करता, या प्रति-मॉडल सटीक execution readiness साबित नहीं करता।
- `models list --all --provider <id>` plugin manifests या bundled provider catalog metadata से प्रोवाइडर-स्वामित्व वाली static catalog
  पंक्तियाँ शामिल कर सकता है, भले ही आपने अभी तक उस प्रोवाइडर से
  authenticate न किया हो। वे पंक्तियाँ तब भी unavailable दिखती हैं
  जब तक matching auth कॉन्फ़िगर न हो।
- `models list` प्रोवाइडर catalog discovery धीमी होने पर control plane को responsive रखता है।
  default और configured views थोड़ी प्रतीक्षा के बाद configured या
  synthetic model rows पर fallback करते हैं और discovery को
  background में पूरा होने देते हैं। जब आपको exact full discovered catalog चाहिए और
  आप provider discovery का इंतज़ार करने को तैयार हैं, तो `--all` उपयोग करें।
- व्यापक `models list --all` provider runtime supplement hooks लोड किए बिना manifest catalog rows को registry rows पर merge करता है।
  Provider-filtered manifest fast paths केवल `static` चिह्नित providers का उपयोग करते हैं; `refreshable`
  चिह्नित providers registry/cache-backed रहते हैं और manifest rows को supplements के रूप में append करते हैं, जबकि
  `runtime` चिह्नित providers registry/runtime discovery पर रहते हैं।
- `models list` native model metadata और runtime caps को अलग रखता है। table
  output में, `Ctx` `contextTokens/contextWindow` दिखाता है जब effective runtime
  cap native context window से अलग होती है; JSON rows में `contextTokens`
  शामिल होता है जब कोई provider वह cap expose करता है।
- `models list --provider <id>` provider id से filter करता है, जैसे `moonshot` या
  `openai`। यह interactive provider pickers से display labels स्वीकार नहीं करता,
  जैसे `Moonshot AI`।
- Model refs को **पहले** `/` पर split करके parse किया जाता है। अगर model ID में `/` शामिल है (OpenRouter-style), provider prefix शामिल करें (उदाहरण: `openrouter/moonshotai/kimi-k2`)।
- अगर आप provider छोड़ देते हैं, तो OpenClaw पहले input को alias के रूप में resolve करता है, फिर
  उसी exact model id के लिए unique configured-provider match के रूप में, और उसके बाद ही
  deprecation warning के साथ configured default provider पर fallback करता है।
  अगर वह provider अब configured default model expose नहीं करता, तो OpenClaw
  stale removed-provider default दिखाने के बजाय पहले configured provider/model पर fallback करता है।
- `models status` auth output में non-secret placeholders (उदाहरण `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) के लिए उन्हें secrets की तरह mask करने के बजाय `marker(<value>)` दिखा सकता है।

### मॉडल स्कैन

`models scan` OpenRouter का public `:free` catalog पढ़ता है और fallback उपयोग के लिए
candidates को rank करता है। catalog स्वयं public है, इसलिए metadata-only scans को
OpenRouter key की आवश्यकता नहीं होती।

डिफ़ॉल्ट रूप से OpenClaw live model calls के साथ tool और image support probe करने की कोशिश करता है।
अगर कोई OpenRouter key कॉन्फ़िगर नहीं है, तो command metadata-only
output पर fallback करता है और समझाता है कि `:free` models को probes और inference के लिए फिर भी `OPENROUTER_API_KEY` चाहिए।

विकल्प:

- `--no-probe` (केवल metadata; कोई config/secrets lookup नहीं)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (catalog request और per-probe timeout)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` और `--set-image` को live probes चाहिए; metadata-only scan
results सूचनात्मक हैं और config पर apply नहीं किए जाते।

### मॉडल स्थिति

विकल्प:

- `--json`
- `--plain`
- `--check` (exit 1=expired/missing, 2=expiring)
- `--probe` (configured auth profiles का live probe)
- `--probe-provider <name>` (एक provider probe करें)
- `--probe-profile <id>` (repeat या comma-separated profile ids)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (configured agent id; `OPENCLAW_AGENT_DIR` को override करता है)

`--json` stdout को JSON payload के लिए reserved रखता है। Auth-profile, provider,
और startup diagnostics stderr पर route किए जाते हैं ताकि scripts stdout को सीधे
`jq` जैसे tools में pipe कर सकें।

Probe status buckets:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

अपेक्षित probe detail/reason-code cases:

- `excluded_by_auth_order`: stored profile मौजूद है, लेकिन explicit
  `auth.order.<provider>` ने उसे omit किया, इसलिए probe उसे try करने के बजाय
  exclusion report करता है।
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profile मौजूद है लेकिन eligible/resolvable नहीं है।
- `no_model`: provider auth मौजूद है, लेकिन OpenClaw उस provider के लिए probeable
  model candidate resolve नहीं कर सका।

## Aliases + fallbacks

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## ऑथ प्रोफ़ाइलें

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` interactive auth helper है। यह provider auth
flow (OAuth/API key) launch कर सकता है या आपके चुने हुए
provider के आधार पर manual token paste में guide कर सकता है।

`models auth list` selected agent के लिए saved auth profiles list करता है,
token, API-key, या OAuth secret material print किए बिना। एक provider तक
filter करने के लिए `--provider <id>` का उपयोग करें, जैसे `openai`, और scripting के लिए `--json`।

`models auth login` provider plugin का auth flow (OAuth/API key) चलाता है। कौन से providers installed हैं, यह देखने के लिए
`openclaw plugins list` का उपयोग करें।
किसी specific configured agent store में auth results लिखने के लिए
`openclaw models auth --agent <id> <subcommand>` का उपयोग करें। parent `--agent` flag
`add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, और
`login-github-copilot` द्वारा माना जाता है।

OpenAI models के लिए, `--provider openai` default रूप से ChatGPT/Codex account login होता है।
`--method api-key` केवल तब उपयोग करें जब आप OpenAI API-key profile जोड़ना चाहते हों,
आमतौर पर Codex subscription limits के backup के रूप में। पुराने legacy OpenAI Codex prefix auth/profile state को `openai` में migrate करने के लिए `openclaw doctor --fix`
चलाएँ।

उदाहरण:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

नोट्स:

- `login` उन providers के लिए `--profile-id <id>` स्वीकार करता है जो login के दौरान named
  profiles support करते हैं। इसे same
  provider के multiple logins को अलग रखने के लिए उपयोग करें।
- `paste-api-key` कहीं और generate की गई API keys स्वीकार करता है, key
  value के लिए prompt करता है, और उसे default profile id `<provider>:manual` में लिखता है जब तक आप
  `--profile-id` पास नहीं करते। automation में, key को stdin पर pipe करें, उदाहरण के लिए
  `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` और `paste-token` उन providers के लिए generic token commands बने रहते हैं
  जो token auth methods expose करते हैं।
- `setup-token` को interactive TTY चाहिए और provider की token-auth
  method चलाता है (जब वह कोई expose करता है तो उस provider की `setup-token` method पर default करता है)।
- `paste-token` कहीं और या automation से generate की गई token string स्वीकार करता है।
- `paste-token` को `--provider` चाहिए, default रूप से token value के लिए prompt करता है,
  और उसे default profile id `<provider>:manual` में लिखता है जब तक आप
  `--profile-id` पास नहीं करते।
- automation में, token को argument के रूप में पास करने के बजाय stdin पर pipe करें ताकि
  provider credentials shell history या process lists में न दिखें।
- `paste-token --expires-in <duration>` `365d` या `12h` जैसी relative duration से
  absolute token expiry store करता है।
- `openai` के लिए, OpenAI API keys और ChatGPT/OAuth token material
  अलग auth shapes हैं। `sk-...` OpenAI API keys के लिए `paste-api-key` और
  केवल token auth material के लिए `paste-token` उपयोग करें।
- Anthropic note: Anthropic staff ने हमें बताया कि OpenClaw-style Claude CLI usage फिर से allowed है, इसलिए OpenClaw Claude CLI reuse और `claude -p` usage को इस integration के लिए sanctioned मानता है जब तक Anthropic कोई नई policy publish नहीं करता।
- Anthropic `setup-token` / `paste-token` supported OpenClaw token path के रूप में उपलब्ध रहते हैं, लेकिन OpenClaw अब उपलब्ध होने पर Claude CLI reuse और `claude -p` को prefer करता है।

## संबंधित

- [CLI reference](/hi/cli)
- [Model selection](/hi/concepts/model-providers)
- [Model failover](/hi/concepts/model-failover)
