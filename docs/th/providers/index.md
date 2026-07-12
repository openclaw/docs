---
read_when:
    - คุณต้องการเลือกผู้ให้บริการโมเดล
    - คุณต้องการภาพรวมคร่าว ๆ ของระบบเบื้องหลัง LLM ที่รองรับ
summary: ผู้ให้บริการโมเดล (LLM) ที่ OpenClaw รองรับ
title: ไดเรกทอรีผู้ให้บริการ
x-i18n:
    generated_at: "2026-07-12T16:37:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b59843b53265500866e87ee8d888892dacd6045bdb9401a1e7ec08ad4f364090
    source_path: providers/index.md
    workflow: 16
---

OpenClaw สามารถใช้ผู้ให้บริการ LLM ได้หลายราย เลือกผู้ให้บริการ ยืนยันตัวตน แล้วตั้งค่า
โมเดลเริ่มต้นเป็น `provider/model`

กำลังมองหาเอกสารช่องทางแชต (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/ฯลฯ) อยู่หรือไม่? ดู[ช่องทาง](/th/channels)

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
- [BytePlus (ระหว่างประเทศ)](/th/concepts/model-providers#byteplus-international)
- [Cerebras](/th/providers/cerebras)
- [Chutes](/th/providers/chutes)
- [ClawRouter (การกำหนดเส้นทางหลายผู้ให้บริการแบบมีการจัดการ)](/th/providers/clawrouter)
- [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
- [Cohere](/th/providers/cohere)
- [ComfyUI](/th/providers/comfy)
- [DeepSeek](/th/providers/deepseek)
- [ds4 (DeepSeek V4 ภายในเครื่อง)](/th/providers/ds4)
- [ElevenLabs](/th/providers/elevenlabs)
- [fal](/th/providers/fal)
- [Featherless AI](/providers/featherless)
- [Fireworks](/th/providers/fireworks)
- [GitHub Copilot](/th/providers/github-copilot)
- [GMI Cloud](/th/providers/gmi)
- [Google (Gemini)](/th/providers/google)
- [Gradium](/th/providers/gradium)
- [Groq (การอนุมานด้วย LPU)](/th/providers/groq)
- [Hugging Face (การอนุมาน)](/th/providers/huggingface)
- [inferrs (โมเดลภายในเครื่อง)](/th/providers/inferrs)
- [Kilocode](/th/providers/kilocode)
- [LiteLLM (Gateway แบบรวมศูนย์)](/th/providers/litellm)
- [LM Studio (โมเดลภายในเครื่อง)](/th/providers/lmstudio)
- [LongCat](/th/providers/longcat)
- [MiniMax](/th/providers/minimax)
- [Mistral](/th/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
- [NovitaAI](/th/providers/novita)
- [NVIDIA](/th/providers/nvidia)
- [Ollama (โมเดลบนคลาวด์ + ภายในเครื่อง)](/th/providers/ollama)
- [Ollama Cloud](/th/providers/ollama-cloud)
- [OpenAI (API + Codex)](/th/providers/openai)
- [OpenCode](/th/providers/opencode)
- [OpenCode Go](/th/providers/opencode-go)
- [OpenRouter](/th/providers/openrouter)
- [Perplexity (การค้นหาเว็บ)](/th/providers/perplexity-provider)
- [Qianfan](/th/providers/qianfan)
- [Qwen Cloud](/th/providers/qwen)
- [Qwen OAuth / Portal](/th/providers/qwen-oauth)
- [Runway](/th/providers/runway)
- [SenseAudio](/th/providers/senseaudio)
- [SGLang (โมเดลภายในเครื่อง)](/th/providers/sglang)
- [StepFun](/th/providers/stepfun)
- [Synthetic](/th/providers/synthetic)
- [Tencent Cloud (TokenHub / TokenPlan)](/th/providers/tencent)
- [Together AI](/th/providers/together)
- [Venice (Venice AI ที่เน้นความเป็นส่วนตัว)](/th/providers/venice)
- [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
- [vLLM (โมเดลภายในเครื่อง)](/th/providers/vllm)
- [Volcengine (Doubao)](/th/providers/volcengine)
- [Vydra](/th/providers/vydra)
- [xAI](/th/providers/xai)
- [Xiaomi](/th/providers/xiaomi)
- [Z.AI (GLM)](/th/providers/zai)

## หน้าภาพรวมที่ใช้ร่วมกัน

- [ตัวเลือกเพิ่มเติมของผู้ให้บริการ](/th/providers/models#additional-provider-variants) - Anthropic Vertex, Copilot Proxy และ Gemini CLI OAuth
- [การสร้างรูปภาพ](/th/tools/image-generation) - เครื่องมือ `image_generate` ที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และการสลับไปใช้ระบบสำรอง
- [การสร้างเพลง](/th/tools/music-generation) - เครื่องมือ `music_generate` ที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และการสลับไปใช้ระบบสำรอง
- [การสร้างวิดีโอ](/th/tools/video-generation) - เครื่องมือ `video_generate` ที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และการสลับไปใช้ระบบสำรอง

## ผู้ให้บริการถอดเสียง

- [Deepgram (การถอดเสียงจากเสียง)](/th/providers/deepgram)
- [ElevenLabs](/th/providers/elevenlabs#speech-to-text)
- [Mistral](/th/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/th/providers/openai)
- [SenseAudio](/th/providers/senseaudio)
- [xAI](/th/providers/xai)

## เครื่องมือจากชุมชน

- [Claude Max API Proxy](/th/providers/claude-max-api-proxy) - พร็อกซีจากชุมชนสำหรับข้อมูลประจำตัวของการสมัครสมาชิก Claude (ตรวจสอบนโยบาย/ข้อกำหนดของ Anthropic ก่อนใช้งาน)

สำหรับแค็ตตาล็อกผู้ให้บริการทั้งหมด (xAI, Groq, Mistral ฯลฯ) และการกำหนดค่าขั้นสูง
โปรดดู[ผู้ให้บริการโมเดล](/th/concepts/model-providers)
