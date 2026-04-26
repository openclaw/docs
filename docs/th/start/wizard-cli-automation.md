---
read_when:
    - คุณกำลังทำ onboarding แบบอัตโนมัติในสคริปต์หรือ CI
    - คุณต้องการตัวอย่างแบบไม่โต้ตอบสำหรับผู้ให้บริการเฉพาะราย
sidebarTitle: CLI automation
summary: การทำ onboarding และการตั้งค่าเอเจนต์แบบสคริปต์สำหรับ CLI ของ OpenClaw
title: การทำงานอัตโนมัติของ CLI
x-i18n:
    generated_at: "2026-04-26T11:41:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 50b6ef35554ec085012a84b8abb8d52013934ada5293d941babea56eaacf4a9f
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

ใช้ `--non-interactive` เพื่อทำ `openclaw onboard` แบบอัตโนมัติ

<Note>
`--json` ไม่ได้หมายถึงโหมดไม่โต้ตอบโดยอัตโนมัติ สำหรับสคริปต์ให้ใช้ `--non-interactive` (และ `--workspace`)
</Note>

## ตัวอย่างพื้นฐานแบบไม่โต้ตอบ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

เพิ่ม `--json` เพื่อรับสรุปที่เครื่องอ่านได้

ใช้ `--skip-bootstrap` เมื่อระบบอัตโนมัติของคุณเตรียมไฟล์ workspace ไว้ล่วงหน้าแล้ว และไม่ต้องการให้ onboarding สร้างไฟล์ bootstrap เริ่มต้น

ใช้ `--secret-input-mode ref` เพื่อจัดเก็บ ref ที่อิงกับ env ลงใน auth profile แทนการเก็บค่าแบบ plaintext
การเลือกแบบโต้ตอบระหว่าง env ref กับ ref ของผู้ให้บริการที่กำหนดค่าไว้ (`file` หรือ `exec`) มีให้ใช้ในโฟลว์ onboarding

ในโหมด `ref` แบบไม่โต้ตอบ ต้องตั้งค่า env var ของผู้ให้บริการไว้ใน process environment
ขณะนี้การส่งแฟล็กคีย์แบบ inline โดยไม่มี env var ที่ตรงกันจะล้มเหลวทันที

ตัวอย่าง:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## ตัวอย่างเฉพาะผู้ให้บริการ

<AccordionGroup>
  <Accordion title="ตัวอย่าง Anthropic API key">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    สลับเป็น `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` สำหรับ catalog ของ Go
  </Accordion>
  <Accordion title="ตัวอย่าง Ollama">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่างผู้ให้บริการแบบกำหนดเอง">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key` เป็นตัวเลือกเสริม หากไม่ระบุ onboarding จะตรวจสอบ `CUSTOM_API_KEY`

    ตัวแปรแบบ ref-mode:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    ในโหมดนี้ onboarding จะจัดเก็บ `apiKey` เป็น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`

  </Accordion>
</AccordionGroup>

setup-token ของ Anthropic ยังคงพร้อมใช้งานในฐานะเส้นทางโทเค็น onboarding ที่รองรับ แต่ขณะนี้ OpenClaw จะให้ความสำคัญกับการใช้ Claude CLI ซ้ำเมื่อมีอยู่
สำหรับ production ควรใช้ Anthropic API key

## เพิ่มเอเจนต์อีกตัว

ใช้ `openclaw agents add <name>` เพื่อสร้างเอเจนต์แยกต่างหากพร้อม workspace,
sessions และ auth profiles ของตัวเอง การรันโดยไม่มี `--workspace` จะเปิด wizard

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

สิ่งที่จะถูกตั้งค่า:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

หมายเหตุ:

- workspace เริ่มต้นจะใช้รูปแบบ `~/.openclaw/workspace-<agentId>`
- เพิ่ม `bindings` เพื่อกำหนดเส้นทางข้อความขาเข้า (wizard สามารถทำสิ่งนี้ได้)
- แฟล็กแบบไม่โต้ตอบ: `--model`, `--agent-dir`, `--bind`, `--non-interactive`

## เอกสารที่เกี่ยวข้อง

- ศูนย์กลาง onboarding: [Onboarding (CLI)](/th/start/wizard)
- เอกสารอ้างอิงฉบับเต็ม: [เอกสารอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference)
- เอกสารอ้างอิงคำสั่ง: [`openclaw onboard`](/th/cli/onboard)
