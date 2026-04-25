---
read_when:
    - คุณกำลังทำ onboarding แบบอัตโนมัติในสคริปต์หรือ CI
    - คุณต้องการตัวอย่างแบบ non-interactive สำหรับ providers เฉพาะ
sidebarTitle: CLI automation
summary: การทำ onboarding และการตั้งค่า agent แบบสคริปต์สำหรับ CLI ของ OpenClaw
title: การทำงานอัตโนมัติของ CLI
x-i18n:
    generated_at: "2026-04-25T13:59:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d36801439b9243ea5cc0ab93757dde23d1ecd86c8f5b991541ee14f41bf05ac
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

ใช้ `--non-interactive` เพื่อทำ `openclaw onboard` แบบอัตโนมัติ

<Note>
`--json` ไม่ได้หมายความว่าเป็นโหมด non-interactive โดยอัตโนมัติ สำหรับสคริปต์ ให้ใช้ `--non-interactive` (และ `--workspace`)
</Note>

## ตัวอย่าง non-interactive พื้นฐาน

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

เพิ่ม `--json` เพื่อให้ได้สรุปแบบ machine-readable

ใช้ `--skip-bootstrap` เมื่อระบบอัตโนมัติของคุณเตรียมไฟล์ workspace ไว้ล่วงหน้าและไม่ต้องการให้ onboarding สร้างไฟล์บูตสแตรปเริ่มต้น

ใช้ `--secret-input-mode ref` เพื่อจัดเก็บ ref ที่อ้างอิง env ใน auth profiles แทนค่าข้อความล้วน
การเลือกแบบ interactive ระหว่าง env refs และ configured provider refs (`file` หรือ `exec`) มีให้ใช้ใน flow ของ onboarding

ในโหมด `ref` แบบ non-interactive ต้องตั้งค่าตัวแปร env ของ provider ไว้ใน process environment
การส่ง flags คีย์แบบ inline โดยไม่มี env var ที่ตรงกันจะล้มเหลวทันที

ตัวอย่าง:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## ตัวอย่างแยกตาม provider

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
    สลับเป็น `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` สำหรับแค็ตตาล็อก Go
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
  <Accordion title="ตัวอย่าง custom provider">
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

    `--custom-api-key` เป็นทางเลือก หากไม่ระบุ onboarding จะตรวจสอบ `CUSTOM_API_KEY`

    รูปแบบ ref-mode:

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

Anthropic setup-token ยังคงพร้อมใช้งานเป็นเส้นทาง onboarding token ที่รองรับ แต่ตอนนี้ OpenClaw จะใช้การนำ Claude CLI กลับมาใช้ใหม่เป็นอันดับแรกเมื่อมีให้ใช้
สำหรับ production ควรใช้ Anthropic API key

## เพิ่ม agent อีกตัว

ใช้ `openclaw agents add <name>` เพื่อสร้าง agent แยกต่างหากที่มี workspace,
sessions และ auth profiles ของตัวเอง การรันโดยไม่มี `--workspace` จะเปิดตัวช่วยสร้าง

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

สิ่งที่ระบบตั้งค่าให้:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

หมายเหตุ:

- workspace เริ่มต้นจะอยู่ในรูปแบบ `~/.openclaw/workspace-<agentId>`
- เพิ่ม `bindings` เพื่อกำหนดเส้นทางข้อความขาเข้า (ตัวช่วยสร้างทำสิ่งนี้ได้)
- flags สำหรับ non-interactive: `--model`, `--agent-dir`, `--bind`, `--non-interactive`

## เอกสารที่เกี่ยวข้อง

- ศูนย์กลาง onboarding: [Onboarding (CLI)](/th/start/wizard)
- ข้อมูลอ้างอิงแบบเต็ม: [CLI Setup Reference](/th/start/wizard-cli-reference)
- ข้อมูลอ้างอิงคำสั่ง: [`openclaw onboard`](/th/cli/onboard)
