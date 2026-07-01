---
read_when:
    - '`openclaw infer` कमांड जोड़ना या संशोधित करना'
    - स्थिर हेडलेस क्षमता ऑटोमेशन डिज़ाइन करना
summary: provider-समर्थित मॉडल, छवि, ऑडियो, TTS, वीडियो, वेब, और embedding workflows के लिए infer-first CLI
title: अनुमान CLI
x-i18n:
    generated_at: "2026-07-01T08:04:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb63996dd1364bffba58d4b132849ac4157fb612555c009da795c963142f9368
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` प्रदाता-समर्थित inference workflows के लिए canonical headless surface है।

यह जानबूझकर capability families को उजागर करता है, raw gateway RPC नामों को नहीं और raw agent tool ids को भी नहीं।

## infer को skill में बदलें

इसे किसी agent में copy और paste करें:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

एक अच्छा infer-आधारित skill चाहिए कि:

- सामान्य user intents को सही infer subcommand से map करे
- जिन workflows को यह cover करता है उनके लिए कुछ canonical infer examples शामिल करे
- examples और suggestions में `openclaw infer ...` को प्राथमिकता दे
- skill body के भीतर पूरे infer surface को फिर से document करने से बचे

सामान्य infer-केंद्रित skill coverage:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## infer का उपयोग क्यों करें

`openclaw infer` OpenClaw के भीतर प्रदाता-समर्थित inference tasks के लिए एक consistent CLI प्रदान करता है।

लाभ:

- हर backend के लिए one-off wrappers wire up करने के बजाय OpenClaw में पहले से configured providers और models का उपयोग करें।
- model, image, audio transcription, TTS, video, web, और embedding workflows को एक command tree के अंतर्गत रखें।
- scripts, automation, और agent-driven workflows के लिए स्थिर `--json` output shape का उपयोग करें।
- जब task मूल रूप से "run inference" हो, तो first-party OpenClaw surface को प्राथमिकता दें।
- अधिकांश infer commands के लिए gateway की आवश्यकता के बिना सामान्य local path का उपयोग करें।

end-to-end provider checks के लिए, lower-level provider tests green होने के बाद `openclaw infer ...` को प्राथमिकता दें। provider request किए जाने से पहले यह shipped CLI, config loading, default-agent resolution, bundled plugin activation, और shared capability runtime को exercise करता है।

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
| text/model prompt चलाएँ       | `openclaw infer model run --prompt "..." --json`                                              | default रूप से normal local path का उपयोग करता है                 |
| images पर model prompt चलाएँ  | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | multiple image inputs के लिए `--file` दोहराएँ             |
| image generate करें             | `openclaw infer image generate --prompt "..." --json`                                         | existing file से शुरू करते समय `image edit` का उपयोग करें  |
| image file या URL describe करें | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` image-capable `<provider/model>` होना चाहिए |
| audio transcribe करें              | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` `<provider/model>` होना चाहिए                  |
| speech synthesize करें             | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` gateway-oriented है                      |
| video generate करें              | `openclaw infer video generate --prompt "..." --json`                                         | `--resolution` जैसे provider hints support करता है        |
| video file describe करें         | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` `<provider/model>` होना चाहिए                  |
| web search करें                | `openclaw infer web search --query "..." --json`                                              |                                                       |
| web page fetch करें              | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| embeddings create करें             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## व्यवहार

- `openclaw infer ...` इन workflows के लिए primary CLI surface है।
- जब output को किसी दूसरे command या script द्वारा consume किया जाएगा, तो `--json` का उपयोग करें।
- जब किसी specific backend की आवश्यकता हो, तो `--provider` या `--model provider/model` का उपयोग करें।
- run को raw रखते हुए one-shot thinking/reasoning level (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh`, या `max`) pass करने के लिए `model run --thinking <level>` का उपयोग करें।
- `image describe`, `audio transcribe`, और `video describe` के लिए, `--model` को `<provider/model>` form का उपयोग करना चाहिए।
- `image describe` के लिए, `--file` local paths और HTTP(S) image URLs स्वीकार करता है। Remote URLs normal media-fetch SSRF policy का उपयोग करते हैं।
- `image describe` के लिए, explicit `--model` पहले उस provider/model को चलाता है, फिर model call fail होने पर configured `agents.defaults.imageModel.fallbacks` आज़माता है। Input preparation errors, जैसे missing files या unsupported URLs, fallback attempts से पहले fail होते हैं। model को model catalog या provider config में image-capable होना चाहिए। `codex/<model>` bounded Codex app-server image-understanding turn चलाता है; `openai/<model>` API-key या ChatGPT/Codex OAuth auth में से किसी एक के साथ OpenAI provider path का उपयोग करता है।
- Stateless execution commands default रूप से local होते हैं।
- Gateway-managed state commands default रूप से gateway होते हैं।
- normal local path को gateway running होने की आवश्यकता नहीं होती।
- Local `model run` एक lean one-shot provider completion है। यह configured agent model और auth resolve करता है, लेकिन chat-agent turn शुरू नहीं करता, tools load नहीं करता, या bundled MCP servers open नहीं करता।
- `model run --file` image files स्वीकार करता है, उनका MIME type detect करता है, और उन्हें supplied prompt के साथ selected model को भेजता है। multiple images के लिए `--file` दोहराएँ।
- `model run --file` non-image inputs reject करता है। audio files के लिए `infer audio transcribe` और video files के लिए `infer video describe` का उपयोग करें।
- `model run --gateway` Gateway routing, saved auth, provider selection, और embedded runtime को exercise करता है, लेकिन फिर भी raw model probe के रूप में चलता है: यह supplied prompt और कोई भी image attachments भेजता है, बिना prior session transcript, bootstrap/AGENTS context, context-engine assembly, tools, या bundled MCP servers के।
- `model run --gateway --model <provider/model>` को trusted operator gateway credential की आवश्यकता होती है क्योंकि request Gateway से one-off provider/model override चलाने को कहती है।
- Local `model run --thinking` lean provider-completion path का उपयोग करता है; provider-specific levels जैसे `adaptive` और `max` को closest portable simple-completion level पर map किया जाता है।

## Model

प्रदाता-समर्थित text inference और model/provider inspection के लिए `model` का उपयोग करें।

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

Notes:

- Local `model run` provider/model/auth health के लिए सबसे narrow CLI smoke है क्योंकि, non-Codex providers के लिए, यह selected model को केवल supplied prompt भेजता है।
- Local `model run --model <provider/model>` provider config में लिखे जाने से पहले `models list --all` से exact bundled static catalog rows का उपयोग कर सकता है। Provider auth अभी भी required है; missing credentials auth errors के रूप में fail होते हैं, `Unknown model` के रूप में नहीं।
- Mistral Medium 3.5 reasoning probes के लिए, temperature unset/default छोड़ें। Mistral `reasoning_effort="high"` plus `temperature: 0` reject करता है; default temperature या `0.7` जैसे non-zero reasoning-mode value के साथ `mistral/mistral-medium-3-5` का उपयोग करें।
- Codex Responses local probes narrow exception हैं: OpenClaw minimal system instruction जोड़ता है ताकि transport अपने required `instructions` field को populate कर सके, बिना full agent context, tools, memory, या session transcript जोड़े।
- Local `model run --file` उस lean path को बनाए रखता है और image content को directly single user message से attach करता है। PNG, JPEG, और WebP जैसी common image files तब काम करती हैं जब उनका MIME type `image/*` के रूप में detect होता है; unsupported या unrecognized files provider को call किए जाने से पहले fail होती हैं।
- `model run --file` तब best है जब आप selected multimodal text model को directly test करना चाहते हैं। जब आप OpenClaw की image-understanding provider selection और default image-model routing चाहते हैं, तो `infer image describe` का उपयोग करें।
- selected model को image input support करना चाहिए; text-only models provider layer पर request reject कर सकते हैं।
- `model run --prompt` में non-whitespace text होना चाहिए; empty prompts local providers या Gateway को call किए जाने से पहले reject होते हैं।
- Local `model run` तब non-zero exit करता है जब provider कोई text output return नहीं करता, ताकि unreachable local providers और empty completions successful probes जैसे न दिखें।
- Gateway routing, agent-runtime setup, या Gateway-managed provider state को test करने के लिए `model run --gateway` का उपयोग करें, जबकि model input raw रहे। जब आप full agent context, tools, memory, और session transcript चाहते हैं, तो `openclaw agent` या chat surfaces का उपयोग करें।
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

टिप्पणियां:

- मौजूदा इनपुट फाइलों से शुरू करते समय `image edit` का उपयोग करें।
- उन प्रदाताओं/मॉडलों के लिए `image edit` के साथ `--size`, `--aspect-ratio`, या `--resolution` का उपयोग करें जो संदर्भ-इमेज संपादनों पर ज्योमेट्री संकेतों का समर्थन करते हैं।
- पारदर्शी-बैकग्राउंड OpenAI PNG आउटपुट के लिए `--model openai/gpt-image-1.5` के साथ `--output-format png --background transparent` का उपयोग करें; `--openai-background` OpenAI-विशिष्ट उपनाम के रूप में उपलब्ध रहता है। जो प्रदाता बैकग्राउंड समर्थन घोषित नहीं करते, वे संकेत को अनदेखे ओवरराइड के रूप में रिपोर्ट करते हैं।
- OpenAI सहित, इमेज गुणवत्ता संकेतों का समर्थन करने वाले प्रदाताओं के लिए `--quality low|medium|high|auto` का उपयोग करें। OpenAI प्रदाता-विशिष्ट मॉडरेशन संकेत के लिए `--openai-moderation low|auto` भी स्वीकार करता है।
- कौन से बंडल किए गए इमेज प्रदाता खोजे जा सकते हैं, कॉन्फिगर किए गए हैं, चयनित हैं, और प्रत्येक प्रदाता कौन सी जनरेशन/एडिट क्षमताएं उजागर करता है, यह सत्यापित करने के लिए `image providers --json` का उपयोग करें।
- इमेज जनरेशन परिवर्तनों के लिए सबसे संकीर्ण लाइव CLI स्मोक के रूप में `image generate --model <provider/model> --json` का उपयोग करें। उदाहरण:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON प्रतिक्रिया `ok`, `provider`, `model`, `attempts`, और लिखे गए आउटपुट पथों को रिपोर्ट करती है। जब `--output` सेट हो, अंतिम एक्सटेंशन प्रदाता द्वारा लौटाए गए MIME प्रकार का अनुसरण कर सकता है।

- `image describe` और `image describe-many` के लिए, विज़न मॉडल को OCR, तुलना, UI निरीक्षण, या संक्षिप्त कैप्शनिंग जैसे कार्य-विशिष्ट निर्देश देने के लिए `--prompt` का उपयोग करें।
- धीमे स्थानीय विज़न मॉडलों या ठंडे Ollama स्टार्ट के साथ `--timeout-ms` का उपयोग करें।
- `image describe` के लिए, `--model` एक इमेज-सक्षम `<provider/model>` होना चाहिए। सेट होने पर, OpenClaw पहले उस स्पष्ट मॉडल को आजमाता है और फिर मॉडल कॉल विफल होने पर कॉन्फिगर किए गए इमेज-मॉडल फ़ॉलबैक आजमाता है।
- स्थानीय Ollama विज़न मॉडलों के लिए, पहले मॉडल पुल करें और `OLLAMA_API_KEY` को किसी भी प्लेसहोल्डर मान पर सेट करें, उदाहरण के लिए `ollama-local`। [Ollama](/hi/providers/ollama#vision-and-image-description) देखें।

## ऑडियो

फाइल ट्रांसक्रिप्शन के लिए `audio` का उपयोग करें।

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

टिप्पणियां:

- `audio transcribe` फाइल ट्रांसक्रिप्शन के लिए है, रीयलटाइम सत्र प्रबंधन के लिए नहीं।
- `--model` `<provider/model>` होना चाहिए।

## TTS

स्पीच सिंथेसिस और TTS प्रदाता स्थिति के लिए `tts` का उपयोग करें।

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

टिप्पणियां:

- `tts status` डिफ़ॉल्ट रूप से Gateway पर जाता है क्योंकि यह Gateway-प्रबंधित TTS स्थिति को दर्शाता है।
- TTS व्यवहार का निरीक्षण और कॉन्फिगरेशन करने के लिए `tts providers`, `tts voices`, और `tts set-provider` का उपयोग करें।

## वीडियो

जनरेशन और विवरण के लिए `video` का उपयोग करें।

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

टिप्पणियां:

- `video generate` `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark`, और `--timeout-ms` स्वीकार करता है और उन्हें वीडियो-जनरेशन रनटाइम को अग्रेषित करता है।
- `video describe` के लिए `--model` `<provider/model>` होना चाहिए।

## वेब

खोज और फ़ेच वर्कफ़्लो के लिए `web` का उपयोग करें।

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

टिप्पणियां:

- उपलब्ध, कॉन्फिगर किए गए, और चयनित प्रदाताओं का निरीक्षण करने के लिए `web providers` का उपयोग करें।

## एम्बेडिंग

वेक्टर निर्माण और एम्बेडिंग प्रदाता निरीक्षण के लिए `embedding` का उपयोग करें।

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON आउटपुट

Infer कमांड JSON आउटपुट को साझा एनवेलप के अंतर्गत सामान्यीकृत करते हैं:

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

शीर्ष-स्तरीय फ़ील्ड स्थिर हैं:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

जनरेट किए गए मीडिया कमांडों के लिए, `outputs` में OpenClaw द्वारा लिखी गई फाइलें शामिल होती हैं। मानव-पठनीय stdout को पार्स करने के बजाय ऑटोमेशन के लिए उस ऐरे में `path`, `mimeType`, `size`, और किसी भी मीडिया-विशिष्ट आयामों का उपयोग करें।

## सामान्य गलतियां

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

## टिप्पणियां

- `openclaw capability ...`, `openclaw infer ...` का उपनाम है।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [मॉडल](/hi/concepts/models)
