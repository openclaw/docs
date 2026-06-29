---
read_when:
    - लाइव मॉडल मैट्रिक्स / CLI बैकएंड / ACP / मीडिया-प्रोवाइडर स्मोक चलाना
    - लाइव-टेस्ट क्रेडेंशियल रिज़ॉल्यूशन की डिबगिंग
    - नया प्रदाता-विशिष्ट लाइव परीक्षण जोड़ना
sidebarTitle: Live tests
summary: 'लाइव (नेटवर्क-स्पर्शी) परीक्षण: मॉडल मैट्रिक्स, CLI बैकएंड, ACP, मीडिया प्रदाता, क्रेडेंशियल्स'
title: 'परीक्षण: लाइव सुइट्स'
x-i18n:
    generated_at: "2026-06-28T23:17:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 087ec52b395131889d4ae113f304d71199c58dc9f61a1a5e1e511ae4c5b48c0b
    source_path: help/testing-live.md
    workflow: 16
---

त्वरित शुरुआत, QA रनर, यूनिट/इंटीग्रेशन सुइट, और Docker फ्लो के लिए, देखें
[Testing](/hi/help/testing)। यह पेज **live** (नेटवर्क-स्पर्शी) टेस्ट
सुइट कवर करता है: मॉडल मैट्रिक्स, CLI बैकएंड, ACP, और मीडिया-प्रोवाइडर live टेस्ट, साथ ही
क्रेडेंशियल हैंडलिंग।

## Live: स्थानीय स्मोक कमांड

तदर्थ live
जांचों से पहले प्रक्रिया परिवेश में आवश्यक प्रोवाइडर कुंजी एक्सपोर्ट करें।

सुरक्षित मीडिया स्मोक:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

सुरक्षित वॉइस-कॉल तैयारी स्मोक:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` एक ड्राई रन है जब तक `--yes` भी मौजूद न हो। `--yes` का उपयोग केवल
तब करें जब आप जानबूझकर वास्तविक नोटिफाई कॉल करना चाहते हों। Twilio, Telnyx, और
Plivo के लिए, सफल तैयारी जांच के लिए सार्वजनिक webhook URL आवश्यक है; केवल-स्थानीय
loopback/निजी fallback को डिजाइन के अनुसार अस्वीकार किया जाता है।

## Live: Android node क्षमता स्वीप

- टेस्ट: `src/gateway/android-node.capabilities.live.test.ts`
- स्क्रिप्ट: `pnpm android:test:integration`
- लक्ष्य: कनेक्टेड Android node द्वारा **वर्तमान में विज्ञापित हर कमांड** को invoke करना और कमांड कॉन्ट्रैक्ट व्यवहार assert करना।
- दायरा:
  - पूर्व-शर्त/मैनुअल setup (सुइट ऐप को install/run/pair नहीं करता)।
  - चुने गए Android node के लिए command-by-command gateway `node.invoke` validation।
- आवश्यक पूर्व-setup:
  - Android ऐप पहले से gateway से connected + paired हो।
  - ऐप foreground में रखा गया हो।
  - जिन capabilities के पास होने की अपेक्षा है, उनके लिए permissions/capture consent granted हो।
- वैकल्पिक target overrides:
  - `OPENCLAW_ANDROID_NODE_ID` या `OPENCLAW_ANDROID_NODE_NAME`।
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`।
- पूर्ण Android setup विवरण: [Android App](/hi/platforms/android)

## Live: model smoke (profile keys)

Live टेस्ट दो परतों में बांटे गए हैं ताकि हम failures को isolate कर सकें:

- "Direct model" हमें बताता है कि provider/model दी गई key के साथ बिल्कुल answer कर सकता है।
- "Gateway smoke" हमें बताता है कि पूरा gateway+agent pipeline उस model के लिए काम करता है (sessions, history, tools, sandbox policy, आदि)।

### Layer 1: Direct model completion (no gateway)

- टेस्ट: `src/agents/models.profiles.live.test.ts`
- लक्ष्य:
  - discovered models को enumerate करना
  - जिन models के लिए आपके पास creds हैं, उन्हें select करने के लिए `getApiKeyForModel` का उपयोग करना
  - हर model पर एक छोटा completion चलाना (और जहां जरूरत हो targeted regressions)
- enable कैसे करें:
  - `pnpm test:live` (या Vitest को सीधे invoke करने पर `OPENCLAW_LIVE_TEST=1`)
- इस suite को वास्तव में चलाने के लिए `OPENCLAW_LIVE_MODELS=modern`, `small`, या `all` (modern का alias) सेट करें; अन्यथा यह `pnpm test:live` को gateway smoke पर केंद्रित रखने के लिए skip करता है
- models कैसे चुनें:
  - modern allowlist चलाने के लिए `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - constrained small-model allowlist चलाने के लिए `OPENCLAW_LIVE_MODELS=small` (Qwen 8B/9B local-compatible routes, Ollama Gemma, OpenRouter Qwen/GLM, और Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` modern allowlist का alias है
  - या `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (comma allowlist)
  - Local Ollama small-model runs डिफॉल्ट रूप से `http://127.0.0.1:11434` का उपयोग करते हैं; `OPENCLAW_LIVE_OLLAMA_BASE_URL` केवल LAN, custom, या Ollama Cloud endpoints के लिए सेट करें।
  - Modern/all और small sweeps डिफॉल्ट रूप से अपनी curated caps का उपयोग करते हैं; exhaustive selected-profile sweep के लिए `OPENCLAW_LIVE_MAX_MODELS=0` सेट करें या छोटे cap के लिए positive number।
  - Exhaustive sweeps पूरे direct-model test timeout के लिए `OPENCLAW_LIVE_TEST_TIMEOUT_MS` का उपयोग करते हैं। डिफॉल्ट: 60 मिनट।
  - Direct-model probes डिफॉल्ट रूप से 20-way parallelism के साथ चलते हैं; override करने के लिए `OPENCLAW_LIVE_MODEL_CONCURRENCY` सेट करें।
- providers कैसे चुनें:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (comma allowlist)
- keys कहां से आती हैं:
  - डिफॉल्ट रूप से: profile store और env fallbacks
  - केवल **profile store** enforce करने के लिए `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` सेट करें
- यह क्यों मौजूद है:
  - "provider API broken है / key invalid है" को "gateway agent pipeline broken है" से अलग करता है
  - छोटे, isolated regressions शामिल करता है (उदाहरण: OpenAI Responses/Codex Responses reasoning replay + tool-call flows)

### Layer 2: Gateway + dev agent smoke (what "@openclaw" actually does)

- टेस्ट: `src/gateway/gateway-models.profiles.live.test.ts`
- लक्ष्य:
  - एक in-process gateway spin up करना
  - `agent:dev:*` session create/patch करना (हर run पर model override)
  - models-with-keys पर iterate करना और assert करना:
    - "meaningful" response (no tools)
    - वास्तविक tool invocation काम करता है (read probe)
    - वैकल्पिक extra tool probes (exec+read probe)
    - OpenAI regression paths (tool-call-only → follow-up) काम करते रहते हैं
- Probe विवरण (ताकि आप failures को जल्दी explain कर सकें):
  - `read` probe: test workspace में nonce file लिखता है और agent से उसे `read` करने और nonce वापस echo करने को कहता है।
  - `exec+read` probe: test agent से temp file में nonce `exec`-write करने, फिर उसे वापस `read` करने को कहता है।
  - image probe: test एक generated PNG (cat + randomized code) attach करता है और model से `cat <CODE>` return करने की अपेक्षा करता है।
  - Implementation reference: `src/gateway/gateway-models.profiles.live.test.ts` और `test/helpers/live-image-probe.ts`।
- enable कैसे करें:
  - `pnpm test:live` (या Vitest को सीधे invoke करने पर `OPENCLAW_LIVE_TEST=1`)
- models कैसे चुनें:
  - डिफॉल्ट: modern allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - full gateway+agent pipeline के माध्यम से वही constrained small-model allowlist चलाने के लिए `OPENCLAW_LIVE_GATEWAY_MODELS=small`
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` modern allowlist का alias है
  - या narrow करने के लिए `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (या comma list) सेट करें
  - Modern/all और small gateway sweeps डिफॉल्ट रूप से अपनी curated caps का उपयोग करते हैं; exhaustive selected sweep के लिए `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` सेट करें या छोटे cap के लिए positive number।
- providers कैसे चुनें ("OpenRouter everything" से बचें):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (comma allowlist)
- Tool + image probes इस live test में हमेशा on रहते हैं:
  - `read` probe + `exec+read` probe (tool stress)
  - image probe तब चलता है जब model image input support advertise करता है
  - Flow (high level):
    - Test "CAT" + random code वाला छोटा PNG generate करता है (`test/helpers/live-image-probe.ts`)
    - इसे `agent` के जरिए `attachments: [{ mimeType: "image/png", content: "<base64>" }]` के रूप में भेजता है
    - Gateway attachments को `images[]` में parse करता है (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent model को multimodal user message forward करता है
    - Assertion: reply में `cat` + code शामिल है (OCR tolerance: छोटी गलतियां allowed)

<Tip>
यह देखने के लिए कि आप अपनी मशीन पर क्या test कर सकते हैं (और exact `provider/model` ids), चलाएं:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## लाइव: CLI बैकएंड स्मोक (Claude, Gemini, या अन्य स्थानीय CLI)

- परीक्षण: `src/gateway/gateway-cli-backend.live.test.ts`
- लक्ष्य: आपके डिफ़ॉल्ट कॉन्फ़िग को छुए बिना, किसी स्थानीय CLI बैकएंड का उपयोग करके Gateway + एजेंट पाइपलाइन को सत्यापित करना।
- बैकएंड-विशिष्ट स्मोक डिफ़ॉल्ट अपने स्वामी extension की `cli-backend.ts` परिभाषा के साथ रहते हैं।
- सक्षम करें:
  - `pnpm test:live` (या Vitest को सीधे चलाने पर `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- डिफ़ॉल्ट:
  - डिफ़ॉल्ट प्रदाता/मॉडल: `claude-cli/claude-sonnet-4-6`
  - कमांड/args/छवि व्यवहार स्वामी CLI बैकएंड plugin मेटाडेटा से आते हैं।
- ओवरराइड (वैकल्पिक):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` वास्तविक छवि अटैचमेंट भेजने के लिए (पाथ प्रॉम्प्ट में इंजेक्ट किए जाते हैं)। Docker रेसिपी में यह स्पष्ट रूप से अनुरोध न किए जाने तक डिफ़ॉल्ट रूप से बंद रहता है।
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` छवि फ़ाइल पाथ को प्रॉम्प्ट इंजेक्शन के बजाय CLI args के रूप में पास करने के लिए।
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (या `"list"`) यह नियंत्रित करने के लिए कि `IMAGE_ARG` सेट होने पर छवि args कैसे पास किए जाते हैं।
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` दूसरा turn भेजने और resume flow सत्यापित करने के लिए।
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` Claude Sonnet -> Opus उसी-सत्र continuity probe में शामिल होने के लिए, जब चयनित मॉडल switch target का समर्थन करता हो। Docker रेसिपी में यह aggregate reliability के लिए डिफ़ॉल्ट रूप से बंद रहता है।
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` MCP/tool loopback probe में शामिल होने के लिए। Docker रेसिपी में यह स्पष्ट रूप से अनुरोध न किए जाने तक डिफ़ॉल्ट रूप से बंद रहता है।

उदाहरण:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

सस्ता Gemini MCP कॉन्फ़िग स्मोक:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

यह Gemini से प्रतिक्रिया जनरेट करने को नहीं कहता। यह वही सिस्टम
settings लिखता है जो OpenClaw Gemini को देता है, फिर `gemini --debug mcp list` चलाता है ताकि साबित हो सके कि
सहेजा गया `transport: "streamable-http"` सर्वर Gemini के HTTP MCP
shape में normalize होता है और स्थानीय streamable-HTTP MCP सर्वर से कनेक्ट कर सकता है।

Docker रेसिपी:

```bash
pnpm test:docker:live-cli-backend
```

एकल-प्रदाता Docker रेसिपी:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

नोट्स:

- Docker runner `scripts/test-live-cli-backend-docker.sh` पर रहता है।
- यह repo Docker image के अंदर non-root `node` उपयोगकर्ता के रूप में live CLI-backend smoke चलाता है।
- यह स्वामी extension से CLI smoke metadata resolve करता है, फिर matching Linux CLI package (`@anthropic-ai/claude-code` या `@google/gemini-cli`) को `OPENCLAW_DOCKER_CLI_TOOLS_DIR` पर cached writable prefix में install करता है (डिफ़ॉल्ट: `~/.cache/openclaw/docker-cli-tools`)।
- `pnpm test:docker:live-cli-backend:claude-subscription` के लिए `claudeAiOauth.subscriptionType` वाले `~/.claude/.credentials.json` या `claude setup-token` से `CLAUDE_CODE_OAUTH_TOKEN` के माध्यम से portable Claude Code subscription OAuth चाहिए। यह पहले Docker में सीधे `claude -p` साबित करता है, फिर Anthropic API-key env vars को preserve किए बिना दो Gateway CLI-backend turns चलाता है। यह subscription lane Claude MCP/tool और image probes को डिफ़ॉल्ट रूप से disable करता है क्योंकि यह signed-in subscription की usage limits consume करता है और Anthropic, OpenClaw release के बिना Claude Agent SDK / `claude -p` billing और rate-limit behavior बदल सकता है।
- live CLI-backend smoke अब Claude और Gemini के लिए वही end-to-end flow exercise करता है: text turn, image classification turn, फिर gateway CLI के माध्यम से सत्यापित MCP `cron` tool call।
- Claude का default smoke session को Sonnet से Opus में patch भी करता है और verifies करता है कि resumed session को पहले का note अब भी याद है।

## लाइव: APNs HTTP/2 proxy reachability

- परीक्षण: `src/infra/push-apns-http2.live.test.ts`
- लक्ष्य: स्थानीय HTTP CONNECT proxy के माध्यम से Apple के sandbox APNs endpoint तक tunnel करना, APNs HTTP/2 validation request भेजना, और assert करना कि Apple की वास्तविक `403 InvalidProviderToken` response proxy path के माध्यम से वापस आती है।
- सक्षम करें:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- वैकल्पिक timeout:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## लाइव: ACP bind smoke (`/acp spawn ... --bind here`)

- परीक्षण: `src/gateway/gateway-acp-bind.live.test.ts`
- लक्ष्य: लाइव ACP एजेंट के साथ वास्तविक ACP conversation-bind प्रवाह को मान्य करना:
  - `/acp spawn <agent> --bind here` भेजें
  - सिंथेटिक message-channel बातचीत को उसी स्थान पर bind करें
  - उसी बातचीत पर सामान्य follow-up भेजें
  - सत्यापित करें कि follow-up bound ACP session transcript में पहुंचता है
- सक्षम करें:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- डिफॉल्ट:
  - Docker में ACP एजेंट: `claude,codex,gemini`
  - सीधे `pnpm test:live ...` के लिए ACP एजेंट: `claude`
  - सिंथेटिक चैनल: Slack DM-शैली बातचीत संदर्भ
  - ACP बैकएंड: `acpx`
- ओवरराइड:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- नोट्स:
  - यह lane gateway `chat.send` surface का उपयोग admin-only सिंथेटिक originating-route fields के साथ करता है, ताकि परीक्षण message-channel संदर्भ जोड़ सकें बिना बाहरी delivery का दिखावा किए।
  - जब `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` सेट नहीं होता, परीक्षण चुने गए ACP harness agent के लिए embedded `acpx` Plugin की built-in agent registry का उपयोग करता है।
  - Bound-session cron MCP creation डिफॉल्ट रूप से best-effort है, क्योंकि बाहरी ACP harnesses bind/image proof पास होने के बाद MCP calls cancel कर सकते हैं; उस post-bind cron probe को strict बनाने के लिए `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` सेट करें।

उदाहरण:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker विधि:

```bash
pnpm test:docker:live-acp-bind
```

एकल-एजेंट Docker विधियां:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker नोट्स:

- Docker runner `scripts/test-live-acp-bind-docker.sh` पर रहता है।
- डिफॉल्ट रूप से, यह ACP bind smoke को aggregate live CLI agents के विरुद्ध क्रम में चलाता है: `claude`, `codex`, फिर `gemini`।
- matrix को सीमित करने के लिए `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, या `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` का उपयोग करें।
- यह matching CLI auth material को container में stage करता है, फिर अनुरोधित live CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli`, या `opencode-ai`) missing होने पर install करता है। ACP backend स्वयं official `acpx` Plugin से embedded `acpx/runtime` package है।
- Droid Docker variant settings के लिए `~/.factory` stage करता है, `FACTORY_API_KEY` forward करता है, और उस API key की आवश्यकता होती है क्योंकि local Factory OAuth/keyring auth container में portable नहीं है। यह ACPX की built-in `droid exec --output-format acp` registry entry का उपयोग करता है।
- OpenCode Docker variant एक strict single-agent regression lane है। यह `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (डिफॉल्ट `opencode/kimi-k2.6`) से temporary `OPENCODE_CONFIG_CONTENT` default model लिखता है, और `pnpm test:docker:live-acp-bind:opencode` generic post-bind skip स्वीकार करने के बजाय bound assistant transcript मांगता है।
- Direct `acpx` CLI calls Gateway के बाहर behavior compare करने के लिए केवल manual/workaround path हैं। Docker ACP bind smoke OpenClaw के embedded `acpx` runtime backend को exercise करता है।

## लाइव: Codex app-server harness smoke

- लक्ष्य: सामान्य gateway
  `agent` method के जरिए Plugin-owned Codex harness को मान्य करना:
  - bundled `codex` Plugin load करें
  - `openai/gpt-5.5` चुनें, जो OpenAI agent turns को डिफॉल्ट रूप से Codex के जरिए route करता है
  - Codex harness selected रखते हुए `openai/gpt-5.5` को पहला gateway agent turn भेजें
  - उसी OpenClaw session को दूसरा turn भेजें और सत्यापित करें कि app-server
    thread resume कर सकता है
  - उसी gateway command
    path के जरिए `/codex status` और `/codex models` चलाएं
  - वैकल्पिक रूप से दो Guardian-reviewed escalated shell probes चलाएं: एक benign
    command जिसे approved होना चाहिए और एक fake-secret upload जिसे
    denied होना चाहिए ताकि agent वापस पूछे
- परीक्षण: `src/gateway/gateway-codex-harness.live.test.ts`
- सक्षम करें: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- डिफॉल्ट model: `openai/gpt-5.5`
- वैकल्पिक image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- वैकल्पिक MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- वैकल्पिक Guardian probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke provider/model `agentRuntime.id: "codex"` को force करता है, ताकि broken Codex
  harness OpenClaw पर silently fallback करके pass न हो सके।
- Auth: local Codex subscription login से Codex app-server auth। Docker
  smokes लागू होने पर non-Codex probes के लिए `OPENAI_API_KEY` भी provide कर सकते हैं,
  साथ में वैकल्पिक copied `~/.codex/auth.json` और `~/.codex/config.toml`।

स्थानीय विधि:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker विधि:

```bash
pnpm test:docker:live-codex-harness
```

Docker नोट्स:

- Docker runner `scripts/test-live-codex-harness-docker.sh` पर रहता है।
- यह `OPENAI_API_KEY` pass करता है, मौजूद होने पर Codex CLI auth files copy करता है, `@openai/codex` को writable mounted npm
  prefix में install करता है, source tree stage करता है, फिर केवल Codex-harness live test चलाता है।
- Docker image, MCP/tool, और Guardian probes को डिफॉल्ट रूप से enable करता है। जब आपको narrow debug
  run चाहिए, तब `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` या
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` या
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` सेट करें।
- Docker वही explicit Codex runtime config उपयोग करता है, इसलिए legacy aliases या OpenClaw
  fallback Codex harness regression को छिपा नहीं सकते।

### अनुशंसित live विधियां

Narrow, explicit allowlists सबसे तेज और least flaky हैं:

- Single model, direct (कोई gateway नहीं):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Small-model direct profile:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Small-model gateway profile:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API smoke:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Single model, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- कई providers में tool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 direct smoke:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google focus (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke:
  - Gemini 3 dynamic default: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamic budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

नोट्स:

- `google/...` Gemini API (API key) का उपयोग करता है।
- `google-antigravity/...` Antigravity OAuth bridge (Cloud Code Assist-style agent endpoint) का उपयोग करता है।
- `google-gemini-cli/...` आपकी machine पर local Gemini CLI का उपयोग करता है (अलग auth + tooling quirks)।
- Gemini API बनाम Gemini CLI:
  - API: OpenClaw HTTP के जरिए Google's hosted Gemini API call करता है (API key / profile auth); अधिकांश users "Gemini" से यही मतलब लेते हैं।
  - CLI: OpenClaw local `gemini` binary को shell out करता है; इसका अपना auth होता है और यह अलग behavior दिखा सकता है (streaming/tool support/version skew)।

## लाइव: model matrix (हम क्या cover करते हैं)

कोई fixed "CI model list" नहीं है (live opt-in है), लेकिन ये dev machine पर keys के साथ नियमित रूप से cover करने के लिए **अनुशंसित** models हैं।

### Modern smoke set (tool calling + image)

यह "common models" run है जिसके working रहने की अपेक्षा है:

- OpenAI (non-Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (या `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` और `google/gemini-3-flash-preview` (पुराने Gemini 2.x models से बचें)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` और `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` और `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (general API) या `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

tools + image के साथ gateway smoke चलाएं:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + वैकल्पिक Exec)

हर provider family से कम से कम एक चुनें:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (या `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (या `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (general API) या `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

वैकल्पिक अतिरिक्त coverage (हो तो अच्छा):

- xAI: `xai/grok-4.3` (या latest available)
- Mistral: `mistral/`… (आपने enable किया हुआ एक "tools" capable model चुनें)
- Cerebras: `cerebras/`… (अगर आपके पास access है)
- LM Studio: `lmstudio/`… (local; tool calling API mode पर निर्भर करता है)

### Vision: image send (attachment → multimodal message)

image probe exercise करने के लिए `OPENCLAW_LIVE_GATEWAY_MODELS` में कम से कम एक image-capable model शामिल करें (Claude/Gemini/OpenAI vision-capable variants, आदि)।

### Aggregators / alternate gateways

अगर आपके पास keys enabled हैं, तो हम इनके जरिए testing भी support करते हैं:

- OpenRouter: `openrouter/...` (सैकड़ों models; tool+image capable candidates ढूंढने के लिए `openclaw models scan` का उपयोग करें)
- OpenCode: Zen के लिए `opencode/...` और Go के लिए `opencode-go/...` (auth via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

और providers जिन्हें आप live matrix में शामिल कर सकते हैं (अगर आपके पास creds/config हैं):

- अंतर्निहित: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` के माध्यम से (कस्टम एंडपॉइंट): `minimax` (क्लाउड/API), साथ ही कोई भी OpenAI/Anthropic-संगत प्रॉक्सी (LM Studio, vLLM, LiteLLM, आदि)

<Tip>
दस्तावेज़ों में "all models" को हार्डकोड न करें। आधिकारिक सूची वही है जो आपकी मशीन पर `discoverModels(...)` लौटाता है, और जो भी कुंजियां उपलब्ध हैं।
</Tip>

## क्रेडेंशियल (कभी कमिट न करें)

लाइव परीक्षण क्रेडेंशियल उसी तरह खोजते हैं जैसे CLI करता है। व्यावहारिक प्रभाव:

- यदि CLI काम करता है, तो लाइव परीक्षणों को वही कुंजियां मिलनी चाहिए।
- यदि कोई लाइव परीक्षण "no creds" कहता है, तो उसी तरह डीबग करें जैसे आप `openclaw models list` / मॉडल चयन को डीबग करेंगे।

- प्रति-एजेंट auth प्रोफाइल: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (लाइव परीक्षणों में "profile keys" का अर्थ यही है)
- कॉन्फ़िग: `~/.openclaw/openclaw.json` (या `OPENCLAW_CONFIG_PATH`)
- लेगेसी स्टेट dir: `~/.openclaw/credentials/` (मौजूद होने पर staged live home में कॉपी किया जाता है, लेकिन मुख्य profile-key store नहीं है)
- लाइव स्थानीय रन सक्रिय कॉन्फ़िग, प्रति-एजेंट `auth-profiles.json` फ़ाइलें, लेगेसी `credentials/`, और समर्थित बाहरी CLI auth dirs को डिफ़ॉल्ट रूप से एक अस्थायी test home में कॉपी करते हैं; staged live homes `workspace/` और `sandboxes/` को छोड़ देते हैं, और `agents.*.workspace` / `agentDir` path overrides हटा दिए जाते हैं ताकि probes आपके वास्तविक host workspace से दूर रहें।

यदि आप env keys पर निर्भर रहना चाहते हैं, तो उन्हें स्थानीय परीक्षणों से पहले export करें या नीचे दिए गए
Docker runners को स्पष्ट `OPENCLAW_PROFILE_FILE` के साथ उपयोग करें।

## Deepgram लाइव (ऑडियो ट्रांसक्रिप्शन)

- परीक्षण: `extensions/deepgram/audio.live.test.ts`
- सक्षम करें: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan लाइव

- परीक्षण: `extensions/byteplus/live.test.ts`
- सक्षम करें: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- वैकल्पिक मॉडल override: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media लाइव

- परीक्षण: `extensions/comfy/comfy.live.test.ts`
- सक्षम करें: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- दायरा:
  - bundled comfy image, video, और `music_generate` paths को चलाता है
  - जब तक `plugins.entries.comfy.config.<capability>` कॉन्फ़िगर न हो, हर capability को छोड़ देता है
  - comfy workflow submission, polling, downloads, या Plugin registration बदलने के बाद उपयोगी

## इमेज जनरेशन लाइव

- परीक्षण: `test/image-generation.runtime.live.test.ts`
- कमांड: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- दायरा:
  - हर registered image-generation provider Plugin को enumerate करता है
  - probing से पहले पहले से exported provider env vars का उपयोग करता है
  - डिफ़ॉल्ट रूप से stored auth profiles से पहले live/env API keys का उपयोग करता है, ताकि `auth-profiles.json` में stale test keys वास्तविक shell credentials को mask न करें
  - जिन providers के पास usable auth/profile/model नहीं है, उन्हें छोड़ देता है
  - हर configured provider को shared image-generation runtime से चलाता है:
    - `<provider>:generate`
    - `<provider>:edit` जब provider edit support घोषित करता है
- कवर किए गए मौजूदा bundled providers:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- वैकल्पिक सीमितकरण:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- वैकल्पिक auth व्यवहार:
  - profile-store auth को बाध्य करने और env-only overrides को अनदेखा करने के लिए `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

shipped CLI path के लिए, provider/runtime live
test पास होने के बाद एक `infer` smoke जोड़ें:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

यह CLI argument parsing, config/default-agent resolution, bundled
Plugin activation, shared image-generation runtime, और live provider
request को कवर करता है। Plugin dependencies runtime load से पहले मौजूद होने की अपेक्षा है।

## म्यूज़िक जनरेशन लाइव

- परीक्षण: `extensions/music-generation-providers.live.test.ts`
- सक्षम करें: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- दायरा:
  - shared bundled music-generation provider path को चलाता है
  - फिलहाल Google और MiniMax को कवर करता है
  - probing से पहले पहले से exported provider env vars का उपयोग करता है
  - डिफ़ॉल्ट रूप से stored auth profiles से पहले live/env API keys का उपयोग करता है, ताकि `auth-profiles.json` में stale test keys वास्तविक shell credentials को mask न करें
  - जिन providers के पास usable auth/profile/model नहीं है, उन्हें छोड़ देता है
  - उपलब्ध होने पर दोनों घोषित runtime modes चलाता है:
    - prompt-only input के साथ `generate`
    - जब provider `capabilities.edit.enabled` घोषित करता है तब `edit`
  - मौजूदा shared-lane coverage:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: अलग Comfy live file, यह shared sweep नहीं
- वैकल्पिक सीमितकरण:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- वैकल्पिक auth व्यवहार:
  - profile-store auth को बाध्य करने और env-only overrides को अनदेखा करने के लिए `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## वीडियो जनरेशन लाइव

- परीक्षण: `extensions/video-generation-providers.live.test.ts`
- सक्षम करें: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- दायरा:
  - shared bundled video-generation provider path को चलाता है
  - release-safe smoke path पर डिफ़ॉल्ट करता है: non-FAL providers, हर provider के लिए एक text-to-video request, one-second lobster prompt, और `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` से प्रति-provider operation cap (डिफ़ॉल्ट रूप से `180000`)
  - FAL को डिफ़ॉल्ट रूप से छोड़ देता है क्योंकि provider-side queue latency release time पर हावी हो सकती है; इसे स्पष्ट रूप से चलाने के लिए `--video-providers fal` या `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` पास करें
  - probing से पहले पहले से exported provider env vars का उपयोग करता है
  - डिफ़ॉल्ट रूप से stored auth profiles से पहले live/env API keys का उपयोग करता है, ताकि `auth-profiles.json` में stale test keys वास्तविक shell credentials को mask न करें
  - जिन providers के पास usable auth/profile/model नहीं है, उन्हें छोड़ देता है
  - डिफ़ॉल्ट रूप से केवल `generate` चलाता है
  - उपलब्ध होने पर घोषित transform modes भी चलाने के लिए `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` सेट करें:
    - जब provider `capabilities.imageToVideo.enabled` घोषित करता है और selected provider/model shared sweep में buffer-backed local image input स्वीकार करता है तब `imageToVideo`
    - जब provider `capabilities.videoToVideo.enabled` घोषित करता है और selected provider/model shared sweep में buffer-backed local video input स्वीकार करता है तब `videoToVideo`
  - shared sweep में मौजूदा declared-but-skipped `imageToVideo` providers:
    - `vydra` क्योंकि bundled `veo3` text-only है और bundled `kling` को remote image URL चाहिए
  - Provider-specific Vydra coverage:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - वह फ़ाइल डिफ़ॉल्ट रूप से `veo3` text-to-video और एक `kling` lane चलाती है जो remote image URL fixture का उपयोग करता है
  - मौजूदा `videoToVideo` live coverage:
    - `runway` केवल तब जब selected model `runway/gen4_aleph` हो
  - shared sweep में मौजूदा declared-but-skipped `videoToVideo` providers:
    - `alibaba`, `qwen`, `xai` क्योंकि उन paths को अभी remote `http(s)` / MP4 reference URLs चाहिए
    - `google` क्योंकि मौजूदा shared Gemini/Veo lane local buffer-backed input का उपयोग करता है और वह path shared sweep में स्वीकार नहीं किया जाता
    - `openai` क्योंकि मौजूदा shared lane में org-specific video edit access guarantees नहीं हैं
- वैकल्पिक सीमितकरण:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL सहित default sweep में हर provider शामिल करने के लिए `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - aggressive smoke run के लिए हर provider operation cap घटाने हेतु `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- वैकल्पिक auth व्यवहार:
  - profile-store auth को बाध्य करने और env-only overrides को अनदेखा करने के लिए `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## मीडिया लाइव Harness

- कमांड: `pnpm test:live:media`
- उद्देश्य:
  - shared image, music, और video live suites को एक repo-native entrypoint से चलाता है
  - पहले से exported provider env vars का उपयोग करता है
  - डिफ़ॉल्ट रूप से हर suite को उन providers तक auto-narrow करता है जिनके पास अभी usable auth है
  - `scripts/test-live.mjs` को reuse करता है, इसलिए Heartbeat और quiet-mode व्यवहार consistent रहते हैं
- उदाहरण:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## संबंधित

- [परीक्षण](/hi/help/testing) - unit, integration, QA, और Docker suites
