---
read_when:
    - คุณต้องการเลือกผู้ให้บริการโมเดล
    - คุณต้องการตัวอย่างการตั้งค่าแบบรวดเร็วสำหรับการยืนยันตัวตนของ LLM และการเลือกโมเดล
summary: ผู้ให้บริการโมเดล (LLM) ที่ OpenClaw รองรับ
title: คู่มือเริ่มต้นใช้งานผู้ให้บริการโมเดลอย่างรวดเร็ว
x-i18n:
    generated_at: "2026-07-12T16:35:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

เลือกผู้ให้บริการ ยืนยันตัวตน จากนั้นตั้งค่าโมเดลเริ่มต้นเป็น `provider/model`

## เริ่มต้นอย่างรวดเร็ว (สองขั้นตอน)

1. ยืนยันตัวตนกับผู้ให้บริการ (โดยทั่วไปผ่าน `openclaw onboard`)
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
- [BytePlus (ระหว่างประเทศ)](/th/concepts/model-providers#byteplus-international)
- [Chutes](/th/providers/chutes)
- [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
- [Cohere](/th/providers/cohere)
- [ComfyUI](/th/providers/comfy)
- [DeepInfra](/th/providers/deepinfra)
- [fal](/th/providers/fal)
- [Fireworks](/th/providers/fireworks)
- [MiniMax](/th/providers/minimax)
- [Mistral](/th/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
- [NovitaAI](/th/providers/novita)
- [OpenAI (API + Codex)](/th/providers/openai)
- [OpenCode (Zen + Go)](/th/providers/opencode)
- [OpenRouter](/th/providers/openrouter)
- [Qianfan](/th/providers/qianfan)
- [Qwen](/th/providers/qwen)
- [Runway](/th/providers/runway)
- [StepFun](/th/providers/stepfun)
- [Synthetic](/th/providers/synthetic)
- [Venice (Venice AI)](/th/providers/venice)
- [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
- [xAI](/th/providers/xai)
- [Z.AI (GLM)](/th/providers/zai)

สำหรับรายการผู้ให้บริการทั้งหมดและการกำหนดค่าขั้นสูง โปรดดู
[ไดเรกทอรีผู้ให้บริการ](/th/providers/index) และ [ผู้ให้บริการโมเดล](/th/concepts/model-providers)

## รูปแบบผู้ให้บริการเพิ่มเติม

- `anthropic-vertex` - ติดตั้ง `@openclaw/anthropic-vertex-provider` เพื่อรองรับ Anthropic บน Google Vertex โดยอัตโนมัติเมื่อมีข้อมูลประจำตัวของ Vertex โดยไม่มีตัวเลือกการยืนยันตัวตนแยกต่างหากในขั้นตอนเริ่มต้นใช้งาน
- `copilot-proxy` - บริดจ์ VS Code Copilot Proxy ภายในเครื่อง ใช้ `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - ขั้นตอน OAuth ของ Gemini CLI ที่ไม่เป็นทางการ ต้องติดตั้ง `gemini` ภายในเครื่อง (`brew install gemini-cli` หรือ `npm install -g @google/gemini-cli`) โมเดลเริ่มต้นคือ `google-gemini-cli/gemini-3-flash-preview` ใช้ `openclaw onboard --auth-choice google-gemini-cli` หรือ `openclaw models auth login --provider google-gemini-cli --set-default`

## เนื้อหาที่เกี่ยวข้อง

- [ไดเรกทอรีผู้ให้บริการ](/th/providers/index)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การสลับใช้โมเดลสำรอง](/th/concepts/model-failover)
- [CLI สำหรับโมเดล](/th/cli/models)
