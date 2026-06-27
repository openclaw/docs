---
read_when:
    - คุณต้องการเลือกผู้ให้บริการโมเดล
    - คุณต้องการตัวอย่างการตั้งค่าอย่างรวดเร็วสำหรับการยืนยันตัวตน LLM + การเลือกโมเดล
summary: ผู้ให้บริการโมเดล (LLMs) ที่ OpenClaw รองรับ
title: คู่มือเริ่มต้นใช้งานผู้ให้บริการโมเดลอย่างรวดเร็ว
x-i18n:
    generated_at: "2026-06-27T18:14:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca59b0203b4b5e327b2718a356f6fc1da2f868dac4ca219a2597a96dbf949804
    source_path: providers/models.md
    workflow: 16
---

OpenClaw สามารถใช้ผู้ให้บริการ LLM ได้หลายราย เลือกหนึ่งราย ยืนยันตัวตน แล้วตั้งค่าโมเดลเริ่มต้น
เป็น `provider/model`

## เริ่มต้นอย่างรวดเร็ว (สองขั้นตอน)

1. ยืนยันตัวตนกับผู้ให้บริการ (โดยปกติผ่าน `openclaw onboard`)
2. ตั้งค่าโมเดลเริ่มต้น:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## ผู้ให้บริการที่รองรับ (ชุดเริ่มต้น)

- [Alibaba Model Studio](/th/providers/alibaba)
- [Amazon Bedrock](/th/providers/bedrock)
- [Anthropic (API + Claude CLI)](/th/providers/anthropic)
- [BytePlus (International)](/th/concepts/model-providers#byteplus-international)
- [Chutes](/th/providers/chutes)
- [Cohere](/th/providers/cohere)
- [ComfyUI](/th/providers/comfy)
- [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
- [DeepInfra](/th/providers/deepinfra)
- [fal](/th/providers/fal)
- [Fireworks](/th/providers/fireworks)
- [MiniMax](/th/providers/minimax)
- [Mistral](/th/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
- [OpenAI (API + Codex)](/th/providers/openai)
- [OpenCode (Zen + Go)](/th/providers/opencode)
- [OpenRouter](/th/providers/openrouter)
- [Qianfan](/th/providers/qianfan)
- [Qwen](/th/providers/qwen)
- [Runway](/th/providers/runway)
- [StepFun](/th/providers/stepfun)
- [Synthetic](/th/providers/synthetic)
- [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/th/providers/venice)
- [xAI](/th/providers/xai)
- [Z.AI (GLM)](/th/providers/zai)

## ตัวแปรผู้ให้บริการเพิ่มเติม

- `anthropic-vertex` - ติดตั้ง `@openclaw/anthropic-vertex-provider` เพื่อรองรับ Anthropic แบบแฝงบน Google Vertex เมื่อมีข้อมูลประจำตัว Vertex พร้อมใช้งาน; ไม่มีตัวเลือกการยืนยันตัวตนสำหรับการเริ่มต้นใช้งานแยกต่างหาก
- `copilot-proxy` - บริดจ์ VS Code Copilot Proxy ภายในเครื่อง; ใช้ `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - โฟลว์ OAuth ของ Gemini CLI ที่ไม่เป็นทางการ; ต้องมีการติดตั้ง `gemini` ในเครื่อง (`brew install gemini-cli` หรือ `npm install -g @google/gemini-cli`); โมเดลเริ่มต้น `google-gemini-cli/gemini-3-flash-preview`; ใช้ `openclaw onboard --auth-choice google-gemini-cli` หรือ `openclaw models auth login --provider google-gemini-cli --set-default`

สำหรับแคตตาล็อกผู้ให้บริการทั้งหมด (xAI, Groq, Mistral ฯลฯ) และการกำหนดค่าขั้นสูง
ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers)

## ที่เกี่ยวข้อง

- [การเลือกโมเดล](/th/concepts/model-providers)
- [การสลับโมเดลเมื่อขัดข้อง](/th/concepts/model-failover)
- [Models CLI](/th/cli/models)
