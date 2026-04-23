---
read_when:
    - คุณต้องการใช้ Tencent Hy models กับ OpenClaw
    - คุณต้องการการตั้งค่า TokenHub API key
summary: การตั้งค่า Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T10:22:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90fce0d5957b261439cacd2b4df2362ed69511cb047af6a76ccaf54004806041
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Tencent Cloud มาพร้อมเป็น **bundled provider plugin** ใน OpenClaw โดยให้การเข้าถึง Tencent Hy models ผ่าน endpoint ของ TokenHub (`tencent-tokenhub`)

provider นี้ใช้ API ที่เข้ากันได้กับ OpenAI

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## ตัวอย่างแบบ non-interactive

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Providers และ endpoints

| Provider           | Endpoint                      | กรณีใช้งาน              |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy ผ่าน Tencent TokenHub |

## models ที่พร้อมใช้งาน

### tencent-tokenhub

- **hy3-preview** — Hy3 preview (context 256K, reasoning, ค่าเริ่มต้น)

## หมายเหตุ

- model refs ของ TokenHub ใช้รูปแบบ `tencent-tokenhub/<modelId>`
- plugin นี้มาพร้อม metadata ราคาของ Hy3 แบบเป็นระดับอยู่แล้ว ดังนั้นการประเมินค่าใช้จ่ายจึงถูกเติมให้โดยไม่ต้อง override ราคาเอง
- สามารถ override metadata ด้านราคาและ context ได้ใน `models.providers` หากจำเป็น

## หมายเหตุเรื่อง environment

หาก Gateway รันเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า `TOKENHUB_API_KEY`
พร้อมใช้งานสำหรับ process นั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน
`env.shellEnv`)

## เอกสารที่เกี่ยวข้อง

- [OpenClaw Configuration](/th/gateway/configuration)
- [Model Providers](/th/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
