---
read_when:
    - คุณต้องการเลือก model provider
    - คุณต้องการภาพรวมอย่างรวดเร็วของแบ็กเอนด์ LLM ที่รองรับ
summary: model providers (LLMs) ที่ OpenClaw รองรับ
title: ไดเรกทอรีของ providers
x-i18n:
    generated_at: "2026-04-25T13:57:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e031e997f0dbf97e3e26d5ee05bd99c2877653daa04423d210d01b9045d8c5c
    source_path: providers/index.md
    workflow: 15
---

# Model Providers

OpenClaw สามารถใช้ LLM providers ได้หลายราย เลือก provider ทำการยืนยันตัวตน แล้วตั้งค่า
โมเดลเริ่มต้นเป็น `provider/model`

กำลังมองหาเอกสารสำหรับแชนเนลแชต (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/อื่น ๆ) อยู่หรือไม่? ดู [Channels](/th/channels)

## เริ่มต้นอย่างรวดเร็ว

1. ยืนยันตัวตนกับ provider (โดยปกติผ่าน `openclaw onboard`)
2. ตั้งค่าโมเดลเริ่มต้น:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## เอกสารของ provider

- [Alibaba Model Studio](/th/providers/alibaba)
- [Amazon Bedrock](/th/providers/bedrock)
- [Amazon Bedrock Mantle](/th/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/th/providers/anthropic)
- [Arcee AI (โมเดล Trinity)](/th/providers/arcee)
- [BytePlus (International)](/th/concepts/model-providers#byteplus-international)
- [Chutes](/th/providers/chutes)
- [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
- [ComfyUI](/th/providers/comfy)
- [DeepSeek](/th/providers/deepseek)
- [ElevenLabs](/th/providers/elevenlabs)
- [fal](/th/providers/fal)
- [Fireworks](/th/providers/fireworks)
- [GitHub Copilot](/th/providers/github-copilot)
- [Gradium](/th/providers/gradium)
- [GLM models](/th/providers/glm)
- [Google (Gemini)](/th/providers/google)
- [Groq (LPU inference)](/th/providers/groq)
- [Hugging Face (Inference)](/th/providers/huggingface)
- [inferrs (โมเดลในเครื่อง)](/th/providers/inferrs)
- [Kilocode](/th/providers/kilocode)
- [LiteLLM (เกตเวย์แบบรวม)](/th/providers/litellm)
- [LM Studio (โมเดลในเครื่อง)](/th/providers/lmstudio)
- [MiniMax](/th/providers/minimax)
- [Mistral](/th/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
- [NVIDIA](/th/providers/nvidia)
- [Ollama (โมเดลบนคลาวด์ + ในเครื่อง)](/th/providers/ollama)
- [OpenAI (API + Codex)](/th/providers/openai)
- [OpenCode](/th/providers/opencode)
- [OpenCode Go](/th/providers/opencode-go)
- [OpenRouter](/th/providers/openrouter)
- [Perplexity (การค้นหาเว็บ)](/th/providers/perplexity-provider)
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

## หน้าภาพรวมแบบใช้ร่วมกัน

- [Additional bundled variants](/th/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy และ Gemini CLI OAuth
- [Image Generation](/th/tools/image-generation) - เครื่องมือ `image_generate` แบบใช้ร่วมกัน การเลือก provider และ failover
- [Music Generation](/th/tools/music-generation) - เครื่องมือ `music_generate` แบบใช้ร่วมกัน การเลือก provider และ failover
- [Video Generation](/th/tools/video-generation) - เครื่องมือ `video_generate` แบบใช้ร่วมกัน การเลือก provider และ failover

## providers สำหรับการถอดเสียง

- [Deepgram (การถอดเสียง audio)](/th/providers/deepgram)
- [ElevenLabs](/th/providers/elevenlabs#speech-to-text)
- [Mistral](/th/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/th/providers/openai#speech-to-text)
- [SenseAudio](/th/providers/senseaudio)
- [xAI](/th/providers/xai#speech-to-text)

## เครื่องมือจากชุมชน

- [Claude Max API Proxy](/th/providers/claude-max-api-proxy) - พร็อกซีจากชุมชนสำหรับ Claude subscription credentials (ตรวจสอบนโยบาย/ข้อกำหนดของ Anthropic ก่อนใช้งาน)

สำหรับแค็ตตาล็อก provider แบบเต็ม (xAI, Groq, Mistral ฯลฯ) และการกำหนดค่าขั้นสูง
ดู [Model providers](/th/concepts/model-providers)
