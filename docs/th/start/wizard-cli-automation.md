---
read_when:
    - คุณกำลังทำให้กระบวนการเริ่มต้นใช้งานเป็นอัตโนมัติในสคริปต์หรือ CI
    - คุณต้องมีตัวอย่างแบบไม่โต้ตอบสำหรับผู้ให้บริการเฉพาะราย
sidebarTitle: CLI automation
summary: การเริ่มต้นใช้งานและการตั้งค่าเอเจนต์แบบใช้สคริปต์สำหรับ CLI ของ OpenClaw
title: การทำงานอัตโนมัติด้วย CLI
x-i18n:
    generated_at: "2026-07-12T16:44:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

ใช้ `openclaw onboard --non-interactive` เพื่อเขียนสคริปต์การตั้งค่า คำสั่งนี้ต้องใช้ `--accept-risk`: การตั้งค่าแบบไม่โต้ตอบสามารถเขียนข้อมูลรับรองและการกำหนดค่าดีมอนได้โดยไม่มีข้อความแจ้งให้ยืนยัน ดังนั้นแฟล็กนี้จึงเป็นการยอมรับความเสี่ยงอย่างชัดแจ้ง

<Note>
`--json` ไม่ได้หมายถึงโหมดไม่โต้ตอบ สำหรับสคริปต์ ให้ระบุ `--non-interactive --accept-risk` อย่างชัดเจน
</Note>

## ตัวอย่างพื้นฐานสำหรับโหมดไม่โต้ตอบ

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

เพิ่ม `--json` เพื่อรับข้อมูลสรุปที่เครื่องอ่านได้

- `--gateway-port` มีค่าเริ่มต้นเป็น `18789` ให้ระบุเฉพาะเมื่อต้องการแทนที่ค่าเริ่มต้น
- `--skip-bootstrap` จะข้ามการสร้างไฟล์พื้นที่ทำงานเริ่มต้น เหมาะสำหรับระบบอัตโนมัติที่เตรียมพื้นที่ทำงานของตนเองไว้ล่วงหน้า
- `--secret-input-mode ref` จะจัดเก็บการอ้างอิงที่ใช้ตัวแปรสภาพแวดล้อม (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) ไว้ในโปรไฟล์การยืนยันตัวตนแทนคีย์ข้อความธรรมดา ในโหมด `ref` แบบไม่โต้ตอบ ต้องตั้งค่าตัวแปรสภาพแวดล้อมของผู้ให้บริการไว้ในสภาพแวดล้อมของโพรเซสแล้ว หากส่งแฟล็กคีย์แบบอินไลน์โดยไม่มีตัวแปรสภาพแวดล้อมที่ตรงกัน ระบบจะล้มเหลวทันที

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## ตัวอย่างเฉพาะผู้ให้บริการ

<AccordionGroup>
  <Accordion title="ตัวอย่างคีย์ API ของ Anthropic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Gemini">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Mistral">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Moonshot">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Ollama">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง OpenCode">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    เปลี่ยนเป็น `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` สำหรับแค็ตตาล็อก Go
  </Accordion>
  <Accordion title="ตัวอย่าง Synthetic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Z.AI">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่างผู้ให้บริการแบบกำหนดเอง">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

    `--custom-api-key` เป็นตัวเลือก ปลายทางบางแห่งไม่ต้องใช้การยืนยันตัวตน หากละไว้ ขั้นตอนเริ่มต้นใช้งานจะตรวจสอบ `CUSTOM_API_KEY` ในตัวแปรสภาพแวดล้อม `--custom-provider-id` เป็นตัวเลือก และจะถูกสร้างโดยอัตโนมัติจาก URL ฐานเมื่อละไว้ `--custom-compatibility` มีค่าเริ่มต้นเป็น `openai` (ค่าอื่น ๆ ได้แก่ `openai-responses`, `anthropic`)

    OpenClaw อนุมานการรองรับอินพุตรูปภาพจากรูปแบบรหัสโมเดลวิชันที่รู้จัก (`gpt-4o`, `claude-3/4`, `gemini`, ส่วนต่อท้าย `-vl`/`vision` และรูปแบบที่คล้ายกัน) เพิ่ม `--custom-image-input` เพื่อบังคับเปิดใช้สำหรับโมเดลวิชันที่ระบบไม่รู้จัก หรือใช้ `--custom-text-input` เพื่อบังคับให้รองรับเฉพาะข้อความ

    รูปแบบโหมดอ้างอิง ซึ่งจัดเก็บ `apiKey` เป็น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

  </Accordion>
</AccordionGroup>

ยังคงรองรับการยืนยันตัวตนด้วยโทเค็นการตั้งค่าของ Anthropic แต่ OpenClaw จะเลือกใช้ข้อมูลเข้าสู่ระบบของ Claude CLI ซ้ำเมื่อมีการเข้าสู่ระบบ Claude CLI ภายในเครื่อง สำหรับระบบใช้งานจริง แนะนำให้ใช้คีย์ API ของ Anthropic

## เพิ่มเอเจนต์อีกหนึ่งตัว

`openclaw agents add <name>` จะสร้างเอเจนต์แยกต่างหากที่มีพื้นที่ทำงาน เซสชัน และโปรไฟล์การยืนยันตัวตนของตนเอง การเรียกใช้โดยไม่มี `--workspace` (และไม่มีแฟล็กอื่น) จะเปิดตัวช่วยแบบโต้ตอบ ส่วนการระบุ `--workspace`, `--model`, `--agent-dir`, `--bind` หรือ `--non-interactive` อย่างใดอย่างหนึ่ง จะเรียกใช้แบบไม่โต้ตอบและกำหนดให้ต้องระบุ `--workspace`

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

คีย์การกำหนดค่าที่คำสั่งนี้เขียน (รายการ `agents.list[]` สำหรับรหัสเอเจนต์ใหม่):

- `name`
- `workspace`
- `agentDir`
- `model` (เฉพาะเมื่อระบุ `--model`)

หมายเหตุ:

- พื้นที่ทำงานเริ่มต้น (เมื่อละ `--workspace` ในตัวช่วยแบบโต้ตอบ): `~/.openclaw/workspace-<agentId>`
- สามารถระบุ `--bind <channel[:accountId]>` ซ้ำได้ เพิ่มการเชื่อมโยงเพื่อกำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์ใหม่ (ตัวช่วยสามารถดำเนินการนี้แบบโต้ตอบได้เช่นกัน)
- ชื่อเอเจนต์จะถูกปรับให้อยู่ในรูปแบบรหัสเอเจนต์ที่ถูกต้อง โดยสงวน `main` ไว้

## เอกสารที่เกี่ยวข้อง

- ศูนย์รวมการเริ่มต้นใช้งาน: [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
- เอกสารอ้างอิงฉบับเต็ม: [เอกสารอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference)
- เอกสารอ้างอิงคำสั่ง: [`openclaw onboard`](/th/cli/onboard)
