---
read_when:
    - คุณต้องการเลือกผู้ให้บริการโมเดล
    - คุณต้องการภาพรวมโดยย่อของแบ็กเอนด์ LLM ที่รองรับ
summary: ผู้ให้บริการโมเดล (โมเดลภาษาขนาดใหญ่) ที่ OpenClaw รองรับ
title: ไดเรกทอรีผู้ให้บริการ
x-i18n:
    generated_at: "2026-04-30T10:11:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61143200b2e7a74392cf8871bfcd210fe35dbd5118e2e8bc7b15265192fd2bde
    source_path: providers/index.md
    workflow: 16
---

# ผู้ให้บริการโมเดล

OpenClaw สามารถใช้ผู้ให้บริการ LLM ได้หลายราย เลือกผู้ให้บริการ ยืนยันตัวตน แล้วตั้งค่า
โมเดลเริ่มต้นเป็น `provider/model`

กำลังหาเอกสารช่องทางแชท (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/ฯลฯ) อยู่ใช่ไหม? ดู [ช่องทาง](/th/channels)

## เริ่มต้นอย่างรวดเร็ว

1. ยืนยันตัวตนกับผู้ให้บริการ (โดยปกติผ่าน `openclaw onboard`)
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
- [Cerebras](/th/providers/cerebras)
- [Chutes](/th/providers/chutes)
- [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
- [ComfyUI](/th/providers/comfy)
- [DeepSeek](/th/providers/deepseek)
- [ElevenLabs](/th/providers/elevenlabs)
- [fal](/th/providers/fal)
- [Fireworks](/th/providers/fireworks)
- [GitHub Copilot](/th/providers/github-copilot)
- [โมเดล GLM](/th/providers/glm)
- [Google (Gemini)](/th/providers/google)
- [Gradium](/th/providers/gradium)
- [Groq (การอนุมาน LPU)](/th/providers/groq)
- [Hugging Face (Inference)](/th/providers/huggingface)
- [inferrs (โมเดลในเครื่อง)](/th/providers/inferrs)
- [Kilocode](/th/providers/kilocode)
- [LiteLLM (gateway แบบรวมศูนย์)](/th/providers/litellm)
- [LM Studio (โมเดลในเครื่อง)](/th/providers/lmstudio)
- [MiniMax](/th/providers/minimax)
- [Mistral](/th/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
- [NVIDIA](/th/providers/nvidia)
- [Ollama (คลาวด์ + โมเดลในเครื่อง)](/th/providers/ollama)
- [OpenAI (API + Codex)](/th/providers/openai)
- [OpenCode](/th/providers/opencode)
- [OpenCode Go](/th/providers/opencode-go)
- [OpenRouter](/th/providers/openrouter)
- [Perplexity (การค้นเว็บ)](/th/providers/perplexity-provider)
- [Qianfan](/th/providers/qianfan)
- [Qwen Cloud](/th/providers/qwen)
- [Runway](/th/providers/runway)
- [SenseAudio](/th/providers/senseaudio)
- [SGLang (โมเดลในเครื่อง)](/th/providers/sglang)
- [StepFun](/th/providers/stepfun)
- [Synthetic](/th/providers/synthetic)
- [Tencent Cloud (TokenHub)](/th/providers/tencent)
- [Together AI](/th/providers/together)
- [Venice (Venice AI, เน้นความเป็นส่วนตัว)](/th/providers/venice)
- [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
- [vLLM (โมเดลในเครื่อง)](/th/providers/vllm)
- [Volcengine (Doubao)](/th/providers/volcengine)
- [Vydra](/th/providers/vydra)
- [xAI](/th/providers/xai)
- [Xiaomi](/th/providers/xiaomi)
- [Z.AI](/th/providers/zai)

## หน้าภาพรวมที่ใช้ร่วมกัน

- [ตัวแปรที่บันเดิลเพิ่มเติม](/th/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy และ Gemini CLI OAuth
- [การสร้างภาพ](/th/tools/image-generation) - เครื่องมือ `image_generate` ที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และ failover
- [การสร้างเพลง](/th/tools/music-generation) - เครื่องมือ `music_generate` ที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และ failover
- [การสร้างวิดีโอ](/th/tools/video-generation) - เครื่องมือ `video_generate` ที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และ failover

## ผู้ให้บริการถอดเสียง

- [Deepgram (การถอดเสียงจากเสียง)](/th/providers/deepgram)
- [ElevenLabs](/th/providers/elevenlabs#speech-to-text)
- [Mistral](/th/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/th/providers/openai#speech-to-text)
- [SenseAudio](/th/providers/senseaudio)
- [xAI](/th/providers/xai#speech-to-text)

## เครื่องมือชุมชน

- [Claude Max API Proxy](/th/providers/claude-max-api-proxy) - พร็อกซีชุมชนสำหรับข้อมูลประจำตัวการสมัครใช้งาน Claude (ตรวจสอบนโยบาย/ข้อกำหนดของ Anthropic ก่อนใช้)

สำหรับแค็ตตาล็อกผู้ให้บริการฉบับเต็ม (xAI, Groq, Mistral ฯลฯ) และการกำหนดค่าขั้นสูง
ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
