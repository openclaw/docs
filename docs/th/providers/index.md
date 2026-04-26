---
read_when:
    - คุณต้องการเลือกผู้ให้บริการโมเดล
    - คุณต้องการภาพรวมอย่างรวดเร็วของ backend LLM ที่รองรับ
summary: ผู้ให้บริการโมเดล (LLM) ที่ OpenClaw รองรับ
title: ไดเรกทอรีผู้ให้บริการ
x-i18n:
    generated_at: "2026-04-26T11:39:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5d3bf5b30bd7a1dbd8b1348f4f07f178fea9bfea523afa96cad2a30d566a139
    source_path: providers/index.md
    workflow: 15
---

# ผู้ให้บริการโมเดล

OpenClaw สามารถใช้ผู้ให้บริการ LLM ได้หลายราย เลือกผู้ให้บริการ ยืนยันตัวตน แล้วตั้งค่า
โมเดลเริ่มต้นเป็น `provider/model`

กำลังมองหาเอกสารของช่องทางแชท (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/ฯลฯ) อยู่หรือไม่? ดูที่ [Channels](/th/channels)

## เริ่มต้นอย่างรวดเร็ว

1. ยืนยันตัวตนกับผู้ให้บริการ (โดยทั่วไปผ่าน `openclaw onboard`)
2. ตั้งค่าโมเดลเริ่มต้น:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## เอกสารผู้ให้บริการ

- [Alibaba Model Studio](/th/providers/alibaba)
- [Amazon Bedrock](/th/providers/bedrock)
- [Amazon Bedrock Mantle](/th/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/th/providers/anthropic)
- [Arcee AI (โมเดล Trinity)](/th/providers/arcee)
- [Azure Speech](/th/providers/azure-speech)
- [BytePlus (นานาชาติ)](/th/concepts/model-providers#byteplus-international)
- [Chutes](/th/providers/chutes)
- [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
- [ComfyUI](/th/providers/comfy)
- [DeepSeek](/th/providers/deepseek)
- [ElevenLabs](/th/providers/elevenlabs)
- [fal](/th/providers/fal)
- [Fireworks](/th/providers/fireworks)
- [GitHub Copilot](/th/providers/github-copilot)
- [Gradium](/th/providers/gradium)
- [โมเดล GLM](/th/providers/glm)
- [Google (Gemini)](/th/providers/google)
- [Groq (การอนุมาน LPU)](/th/providers/groq)
- [Hugging Face (Inference)](/th/providers/huggingface)
- [inferrs (โมเดลแบบโลคัล)](/th/providers/inferrs)
- [Kilocode](/th/providers/kilocode)
- [LiteLLM (Gateway แบบรวมศูนย์)](/th/providers/litellm)
- [LM Studio (โมเดลแบบโลคัล)](/th/providers/lmstudio)
- [MiniMax](/th/providers/minimax)
- [Mistral](/th/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
- [NVIDIA](/th/providers/nvidia)
- [Ollama (โมเดลบนคลาวด์ + แบบโลคัล)](/th/providers/ollama)
- [OpenAI (API + Codex)](/th/providers/openai)
- [OpenCode](/th/providers/opencode)
- [OpenCode Go](/th/providers/opencode-go)
- [OpenRouter](/th/providers/openrouter)
- [Perplexity (การค้นหาเว็บ)](/th/providers/perplexity-provider)
- [Qianfan](/th/providers/qianfan)
- [Qwen Cloud](/th/providers/qwen)
- [Runway](/th/providers/runway)
- [SenseAudio](/th/providers/senseaudio)
- [SGLang (โมเดลแบบโลคัล)](/th/providers/sglang)
- [StepFun](/th/providers/stepfun)
- [Synthetic](/th/providers/synthetic)
- [Tencent Cloud (TokenHub)](/th/providers/tencent)
- [Together AI](/th/providers/together)
- [Venice (Venice AI, เน้นความเป็นส่วนตัว)](/th/providers/venice)
- [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
- [vLLM (โมเดลแบบโลคัล)](/th/providers/vllm)
- [Volcengine (Doubao)](/th/providers/volcengine)
- [Vydra](/th/providers/vydra)
- [xAI](/th/providers/xai)
- [Xiaomi](/th/providers/xiaomi)
- [Z.AI](/th/providers/zai)

## หน้าภาพรวมที่ใช้ร่วมกัน

- [รูปแบบย่อยเพิ่มเติมที่มาพร้อมกัน](/th/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy และ Gemini CLI OAuth
- [การสร้างภาพ](/th/tools/image-generation) - เครื่องมือ `image_generate` แบบใช้ร่วมกัน, การเลือกผู้ให้บริการ และ failover
- [การสร้างเพลง](/th/tools/music-generation) - เครื่องมือ `music_generate` แบบใช้ร่วมกัน, การเลือกผู้ให้บริการ และ failover
- [การสร้างวิดีโอ](/th/tools/video-generation) - เครื่องมือ `video_generate` แบบใช้ร่วมกัน, การเลือกผู้ให้บริการ และ failover

## ผู้ให้บริการการถอดเสียง

- [Deepgram (การถอดเสียงเสียงพูด)](/th/providers/deepgram)
- [ElevenLabs](/th/providers/elevenlabs#speech-to-text)
- [Mistral](/th/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/th/providers/openai#speech-to-text)
- [SenseAudio](/th/providers/senseaudio)
- [xAI](/th/providers/xai#speech-to-text)

## เครื่องมือจากชุมชน

- [Claude Max API Proxy](/th/providers/claude-max-api-proxy) - พร็อกซีจากชุมชนสำหรับข้อมูลรับรองการสมัครใช้งาน Claude (ตรวจสอบนโยบาย/ข้อกำหนดของ Anthropic ก่อนใช้งาน)

สำหรับแค็ตตาล็อกผู้ให้บริการทั้งหมด (xAI, Groq, Mistral ฯลฯ) และการกำหนดค่าขั้นสูง
ดูที่ [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
