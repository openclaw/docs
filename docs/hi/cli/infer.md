---
read_when:
    - '`openclaw infer` कमांड जोड़ना या संशोधित करना'
    - स्थिर हेडलेस क्षमता ऑटोमेशन डिज़ाइन करना
summary: प्रदाता-समर्थित मॉडल, छवि, ऑडियो, TTS, वीडियो, वेब और एम्बेडिंग वर्कफ़्लो के लिए अनुमान-प्रथम CLI
title: अनुमान CLI
x-i18n:
    generated_at: "2026-06-28T22:49:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93ebb2a830bfbe6aad58cfa7aa2252cf016a6c9cb99b7592406593627e41fdd1
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` प्रदाता-समर्थित inference workflows के लिए canonical headless surface है।

यह जानबूझकर capability families को expose करता है, raw gateway RPC names या raw agent tool ids को नहीं।

## infer को skill में बदलें

इसे किसी agent में copy और paste करें:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

एक अच्छा infer-आधारित skill यह करना चाहिए:

- सामान्य user intents को सही infer subcommand से map करे
- जिन workflows को यह cover करता है उनके लिए कुछ canonical infer examples शामिल करे
- examples और suggestions में `openclaw infer ...` को प्राथमिकता दे
- skill body के अंदर पूरे infer surface को फिर से document करने से बचे

सामान्य infer-केंद्रित skill coverage:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## infer क्यों उपयोग करें

`openclaw infer` OpenClaw के अंदर प्रदाता-समर्थित inference tasks के लिए एक consistent CLI प्रदान करता है।

लाभ:

- हर backend के लिए one-off wrappers wire up करने के बजाय OpenClaw में पहले से configured providers और models का उपयोग करें।
- model, image, audio transcription, TTS, video, web, और embedding workflows को एक command tree के अंतर्गत रखें।
- scripts, automation, और agent-driven workflows के लिए stable `--json` output shape का उपयोग करें।
- जब task मूल रूप से "run inference" हो, तो first-party OpenClaw surface को प्राथमिकता दें।
- अधिकांश infer commands के लिए gateway की आवश्यकता के बिना सामान्य local path का उपयोग करें।

end-to-end provider checks के लिए, lower-level provider tests green होने के बाद `openclaw infer ...` को प्राथमिकता दें। यह provider request किए जाने से पहले shipped CLI, config loading, default-agent resolution, bundled plugin activation, और shared capability runtime को exercise करता है।

## Command tree

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## सामान्य tasks

यह table सामान्य inference tasks को संबंधित infer command से map करती है।

| Task                          | Command                                                                                       | Notes                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| text/model prompt चलाएं       | `openclaw infer model run --prompt "..." --json`                                              | default रूप से सामान्य local path का उपयोग करता है                 |
| images पर model prompt चलाएं  | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | multiple image inputs के लिए `--file` दोहराएं             |
| image generate करें             | `openclaw infer image generate --prompt "..." --json`                                         | मौजूदा file से शुरू करते समय `image edit` का उपयोग करें  |
| image file या URL का वर्णन करें | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` image-capable `<provider/model>` होना चाहिए |
| audio transcribe करें              | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` `<provider/model>` होना चाहिए                  |
| speech synthesize करें             | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` gateway-oriented है                      |
| video generate करें              | `openclaw infer video generate --prompt "..." --json`                                         | `--resolution` जैसे provider hints का समर्थन करता है        |
| video file का वर्णन करें         | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` `<provider/model>` होना चाहिए                  |
| web search करें                | `openclaw infer web search --query "..." --json`                                              |                                                       |
| web page fetch करें              | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| embeddings बनाएं             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## व्यवहार

- `openclaw infer ...` इन workflows के लिए primary CLI surface है।
- जब output किसी दूसरी command या script द्वारा consume किया जाएगा, तो `--json` का उपयोग करें।
- जब किसी specific backend की आवश्यकता हो, तो `--provider` या `--model provider/model` का उपयोग करें।
- run को raw रखते हुए one-shot thinking/reasoning level (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh`, या `max`) pass करने के लिए `model run --thinking <level>` का उपयोग करें।
- `image describe`, `audio transcribe`, और `video describe` के लिए, `--model` को `<provider/model>` form का उपयोग करना चाहिए।
- `image describe` के लिए, `--file` local paths और HTTP(S) image URLs स्वीकार करता है। Remote URLs सामान्य media-fetch SSRF policy का उपयोग करते हैं।
- `image describe` के लिए, explicit `--model` उस provider/model को सीधे चलाता है। model catalog या provider config में model image-capable होना चाहिए। `codex/<model>` bounded Codex app-server image-understanding turn चलाता है; `openai/<model>` API-key या ChatGPT/Codex OAuth auth के साथ OpenAI provider path का उपयोग करता है।
- Stateless execution commands default रूप से local होती हैं।
- Gateway-managed state commands default रूप से gateway होती हैं।
- सामान्य local path के लिए gateway चल रहा होना आवश्यक नहीं है।
- Local `model run` एक lean one-shot provider completion है। यह configured agent model और auth resolve करता है, लेकिन chat-agent turn शुरू नहीं करता, tools load नहीं करता, या bundled MCP servers नहीं खोलता।
- `model run --file` image files स्वीकार करता है, उनका MIME type detect करता है, और selected model को supplied prompt के साथ भेजता है। multiple images के लिए `--file` दोहराएं।
- `model run --file` non-image inputs को reject करता है। audio files के लिए `infer audio transcribe` और video files के लिए `infer video describe` का उपयोग करें।
- `model run --gateway` Gateway routing, saved auth, provider selection, और embedded runtime को exercise करता है, लेकिन फिर भी raw model probe की तरह चलता है: यह supplied prompt और किसी भी image attachments को prior session transcript, bootstrap/AGENTS context, context-engine assembly, tools, या bundled MCP servers के बिना भेजता है।
- `model run --gateway --model <provider/model>` के लिए trusted operator gateway credential की आवश्यकता होती है क्योंकि request Gateway से one-off provider/model override चलाने को कहती है।
- Local `model run --thinking` lean provider-completion path का उपयोग करता है; `adaptive` और `max` जैसे provider-specific levels को सबसे नज़दीकी portable simple-completion level पर map किया जाता है।

## Model

provider-backed text inference और model/provider inspection के लिए `model` का उपयोग करें।

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Gateway शुरू किए बिना या full agent tool surface load किए बिना किसी specific provider को smoke-test करने के लिए full `<provider/model>` refs का उपयोग करें:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

नोट्स:

- Local `model run` provider/model/auth health के लिए सबसे narrow CLI smoke है क्योंकि, non-Codex providers के लिए, यह selected model को केवल supplied prompt भेजता है।
- Local `model run --model <provider/model>` उस provider को config में लिखे जाने से पहले `models list --all` से exact bundled static catalog rows का उपयोग कर सकता है। Provider auth फिर भी required है; missing credentials auth errors के रूप में fail होते हैं, `Unknown model` के रूप में नहीं।
- Mistral Medium 3.5 reasoning probes के लिए, temperature unset/default छोड़ें। Mistral `reasoning_effort="high"` plus `temperature: 0` को reject करता है; default temperature या `0.7` जैसे non-zero reasoning-mode value के साथ `mistral/mistral-medium-3-5` का उपयोग करें।
- Codex Responses local probes narrow exception हैं: OpenClaw minimal system instruction जोड़ता है ताकि transport अपने required `instructions` field को populate कर सके, full agent context, tools, memory, या session transcript जोड़े बिना।
- Local `model run --file` उस lean path को बनाए रखता है और single user message में image content सीधे attach करता है। PNG, JPEG, और WebP जैसी common image files तब काम करती हैं जब उनका MIME type `image/*` के रूप में detect हो; unsupported या unrecognized files provider call किए जाने से पहले fail हो जाती हैं।
- जब आप selected multimodal text model को सीधे test करना चाहते हैं, तो `model run --file` सबसे अच्छा है। जब आप OpenClaw की image-understanding provider selection और default image-model routing चाहते हैं, तो `infer image describe` का उपयोग करें।
- selected model को image input support करना चाहिए; text-only models provider layer पर request reject कर सकते हैं।
- `model run --prompt` में non-whitespace text होना चाहिए; empty prompts local providers या Gateway call किए जाने से पहले reject कर दिए जाते हैं।
- जब provider कोई text output return नहीं करता, तो Local `model run` non-zero exit करता है, इसलिए unreachable local providers और empty completions successful probes जैसे नहीं दिखते।
- जब आपको model input raw रखते हुए Gateway routing, agent-runtime setup, या Gateway-managed provider state test करना हो, तो `model run --gateway` का उपयोग करें। जब आपको full agent context, tools, memory, और session transcript चाहिए, तो `openclaw agent` या chat surfaces का उपयोग करें।
- `model auth login`, `model auth logout`, और `model auth status` saved provider auth state manage करते हैं।

## Image

generation, edit, और description के लिए `image` का उपयोग करें।

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

नोट्स:

- मौजूदा इनपुट फ़ाइलों से शुरू करते समय `image edit` का उपयोग करें।
- संदर्भ-छवि संपादनों पर ज्योमेट्री संकेतों का समर्थन करने वाले providers/models के लिए `image edit` के साथ `--size`, `--aspect-ratio`, या `--resolution` का उपयोग करें।
- पारदर्शी-पृष्ठभूमि वाले OpenAI PNG आउटपुट के लिए `--model openai/gpt-image-1.5` के साथ `--output-format png --background transparent` का उपयोग करें; `--openai-background` OpenAI-विशिष्ट alias के रूप में उपलब्ध रहता है। जो providers पृष्ठभूमि समर्थन घोषित नहीं करते, वे संकेत को अनदेखे override के रूप में रिपोर्ट करते हैं।
- OpenAI सहित, छवि गुणवत्ता संकेतों का समर्थन करने वाले providers के लिए `--quality low|medium|high|auto` का उपयोग करें। OpenAI provider-विशिष्ट moderation संकेत के लिए `--openai-moderation low|auto` भी स्वीकार करता है।
- कौन-से bundled image providers खोजे जा सकते हैं, configured हैं, selected हैं, और प्रत्येक provider कौन-सी generation/edit क्षमताएं उजागर करता है, यह सत्यापित करने के लिए `image providers --json` का उपयोग करें।
- image generation बदलावों के लिए सबसे संकीर्ण live CLI smoke के रूप में `image generate --model <provider/model> --json` का उपयोग करें। उदाहरण:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON response `ok`, `provider`, `model`, `attempts`, और लिखे गए आउटपुट पथ रिपोर्ट करता है। जब `--output` सेट हो, तो अंतिम extension provider के लौटाए गए MIME type का अनुसरण कर सकता है।

- `image describe` और `image describe-many` के लिए, vision model को OCR, तुलना, UI निरीक्षण, या संक्षिप्त captioning जैसे task-विशिष्ट निर्देश देने के लिए `--prompt` का उपयोग करें।
- धीमे local vision models या cold Ollama starts के साथ `--timeout-ms` का उपयोग करें।
- `image describe` के लिए, `--model` एक image-capable `<provider/model>` होना चाहिए।
- local Ollama vision models के लिए, पहले model pull करें और `OLLAMA_API_KEY` को किसी भी placeholder value पर सेट करें, उदाहरण के लिए `ollama-local`। [Ollama](/hi/providers/ollama#vision-and-image-description) देखें।

## ऑडियो

फ़ाइल transcription के लिए `audio` का उपयोग करें।

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

नोट्स:

- `audio transcribe` फ़ाइल transcription के लिए है, realtime session management के लिए नहीं।
- `--model` `<provider/model>` होना चाहिए।

## TTS

speech synthesis और TTS provider state के लिए `tts` का उपयोग करें।

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

नोट्स:

- `tts status` default रूप से gateway पर जाता है क्योंकि यह gateway-managed TTS state को दर्शाता है।
- TTS व्यवहार का निरीक्षण और configuration करने के लिए `tts providers`, `tts voices`, और `tts set-provider` का उपयोग करें।

## वीडियो

generation और description के लिए `video` का उपयोग करें।

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

नोट्स:

- `video generate` `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark`, और `--timeout-ms` स्वीकार करता है और उन्हें video-generation runtime को forward करता है।
- `video describe` के लिए `--model` `<provider/model>` होना चाहिए।

## वेब

search और fetch workflows के लिए `web` का उपयोग करें।

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

नोट्स:

- उपलब्ध, configured, और selected providers का निरीक्षण करने के लिए `web providers` का उपयोग करें।

## एम्बेडिंग

vector creation और embedding provider inspection के लिए `embedding` का उपयोग करें।

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON आउटपुट

Infer commands साझा envelope के अंतर्गत JSON output normalize करते हैं:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Top-level fields स्थिर हैं:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

generated media commands के लिए, `outputs` में OpenClaw द्वारा लिखी गई files शामिल होती हैं। automation के लिए human-readable stdout parse करने के बजाय उस array में `path`, `mimeType`, `size`, और कोई भी media-specific dimensions उपयोग करें।

## सामान्य चूकें

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## नोट्स

- `openclaw capability ...`, `openclaw infer ...` का alias है।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [मॉडल](/hi/concepts/models)
