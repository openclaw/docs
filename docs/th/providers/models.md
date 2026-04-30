---
read_when:
    - คุณต้องการเลือกผู้ให้บริการโมเดล
    - คุณต้องการตัวอย่างการตั้งค่าอย่างรวดเร็วสำหรับการยืนยันตัวตนของ LLM และการเลือกโมเดล
summary: ผู้ให้บริการโมเดล (โมเดลภาษาขนาดใหญ่) ที่ OpenClaw รองรับ
title: คู่มือเริ่มต้นใช้งานอย่างรวดเร็วสำหรับผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-04-30T10:12:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f71f9ab34df2b545128bfeed3cab82f31b741d4a66263113068568ce6b77cd6
    source_path: providers/models.md
    workflow: 16
---

# ผู้ให้บริการโมเดล

OpenClaw สามารถใช้ผู้ให้บริการ LLM ได้หลายราย เลือกหนึ่งราย ยืนยันตัวตน แล้วตั้งค่าโมเดลเริ่มต้นเป็น `provider/model`

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
- [BytePlus (นานาชาติ)](/th/concepts/model-providers#byteplus-international)
- [Chutes](/th/providers/chutes)
- [ComfyUI](/th/providers/comfy)
- [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
- [DeepInfra](/th/providers/deepinfra)
- [fal](/th/providers/fal)
- [Fireworks](/th/providers/fireworks)
- [โมเดล GLM](/th/providers/glm)
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
- [Z.AI](/th/providers/zai)

## ตัวแปรผู้ให้บริการเพิ่มเติมที่รวมมา

- `anthropic-vertex` - รองรับ Anthropic บน Google Vertex โดยอัตโนมัติเมื่อมีข้อมูลประจำตัว Vertex ให้ใช้งาน; ไม่มีตัวเลือกการยืนยันตัวตนแยกต่างหากในการเริ่มต้นใช้งาน
- `copilot-proxy` - บริดจ์ VS Code Copilot Proxy ภายในเครื่อง; ใช้ `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - โฟลว์ OAuth ของ Gemini CLI ที่ไม่เป็นทางการ; ต้องติดตั้ง `gemini` ไว้ภายในเครื่อง (`brew install gemini-cli` หรือ `npm install -g @google/gemini-cli`); โมเดลเริ่มต้น `google-gemini-cli/gemini-3-flash-preview`; ใช้ `openclaw onboard --auth-choice google-gemini-cli` หรือ `openclaw models auth login --provider google-gemini-cli --set-default`

สำหรับแค็ตตาล็อกผู้ให้บริการฉบับเต็ม (xAI, Groq, Mistral ฯลฯ) และการกำหนดค่าขั้นสูง
ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers)

## ที่เกี่ยวข้อง

- [การเลือกโมเดล](/th/concepts/model-providers)
- [การสลับโมเดลสำรอง](/th/concepts/model-failover)
- [Models CLI](/th/cli/models)
