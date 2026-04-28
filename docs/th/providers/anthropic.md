---
read_when:
    - คุณต้องการใช้โมเดลของ Anthropic ใน OpenClaw
summary: ใช้ Anthropic Claude ผ่าน API key หรือ Claude CLI ใน OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-26T11:39:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: f26f117cb4f98790c323e056d39267c18f1278b0a7a8d3d43a7cbaddbb4523c1
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic เป็นผู้พัฒนาตระกูลโมเดล **Claude** OpenClaw รองรับเส้นทางการยืนยันตัวตน 2 แบบ:

- **API key** — เข้าถึง Anthropic API โดยตรงพร้อมการเรียกเก็บเงินตามการใช้งาน (`anthropic/*` models)
- **Claude CLI** — ใช้การล็อกอิน Claude CLI ที่มีอยู่แล้วบนโฮสต์เดียวกันซ้ำ

<Warning>
ทีมงาน Anthropic แจ้งกับเราว่าการใช้งาน Claude CLI ในลักษณะของ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น
OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้งาน `claude -p` เป็นวิธีที่ได้รับอนุญาต เว้นแต่
Anthropic จะเผยแพร่นโยบายใหม่

สำหรับโฮสต์ Gateway ที่ใช้งานระยะยาว Anthropic API key ยังคงเป็นเส้นทางสำหรับ production ที่ชัดเจนและ
คาดการณ์ได้มากที่สุด

เอกสารสาธารณะปัจจุบันของ Anthropic:

- [ข้อมูลอ้างอิง Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [ภาพรวม Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [การใช้ Claude Code กับแผน Pro หรือ Max ของคุณ](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [การใช้ Claude Code กับแผน Team หรือ Enterprise ของคุณ](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="API key">
    **เหมาะสำหรับ:** การเข้าถึง API มาตรฐานและการเรียกเก็บเงินตามการใช้งาน

    <Steps>
      <Step title="รับ API key ของคุณ">
        สร้าง API key ใน [Anthropic Console](https://console.anthropic.com/)
      </Step>
      <Step title="เรียกใช้ onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        หรือส่งคีย์โดยตรง:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### ตัวอย่าง config

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **เหมาะสำหรับ:** ใช้การล็อกอิน Claude CLI ที่มีอยู่แล้วซ้ำโดยไม่ต้องมี API key แยก

    <Steps>
      <Step title="ตรวจสอบให้แน่ใจว่าติดตั้งและล็อกอิน Claude CLI แล้ว">
        ตรวจสอบด้วย:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="เรียกใช้ onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw จะตรวจพบและใช้ข้อมูลรับรอง Claude CLI ที่มีอยู่แล้วซ้ำ
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    รายละเอียดการตั้งค่าและรันไทม์สำหรับ backend ของ Claude CLI อยู่ใน [CLI Backends](/th/gateway/cli-backends)
    </Note>

    ### ตัวอย่าง config

    ควรใช้ canonical Anthropic model ref ร่วมกับการ override รันไทม์ของ CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    model ref แบบเดิม `claude-cli/claude-opus-4-7` ยังคงใช้งานได้เพื่อ
    ความเข้ากันได้ แต่ config ใหม่ควรคงการเลือก provider/model เป็น
    `anthropic/*` และใส่ backend การประมวลผลไว้ใน `agentRuntime.id`

    <Tip>
    หากคุณต้องการเส้นทางการเรียกเก็บเงินที่ชัดเจนที่สุด ให้ใช้ Anthropic API key แทน OpenClaw ยังรองรับตัวเลือกแบบ subscription จาก [OpenAI Codex](/th/providers/openai), [Qwen Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax) และ [Z.AI / GLM](/th/providers/glm) ด้วย
    </Tip>

  </Tab>
</Tabs>

## ค่าเริ่มต้นของ thinking (Claude 4.6)

โมเดล Claude 4.6 จะใช้ thinking แบบ `adaptive` เป็นค่าเริ่มต้นใน OpenClaw เมื่อไม่ได้กำหนดระดับ thinking ไว้อย่างชัดเจน

override รายข้อความได้ด้วย `/think:<level>` หรือในพารามิเตอร์ของโมเดล:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
เอกสาร Anthropic ที่เกี่ยวข้อง:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## การแคชพรอมป์ต์

OpenClaw รองรับฟีเจอร์ prompt caching ของ Anthropic สำหรับการยืนยันตัวตนแบบ API key

| Value               | ระยะเวลาการแคช | คำอธิบาย                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (ค่าเริ่มต้น) | 5 นาที      | ใช้อัตโนมัติสำหรับการยืนยันตัวตนแบบ API key |
| `"long"`            | 1 ชั่วโมง         | แคชแบบขยายเวลา                         |
| `"none"`            | ไม่ใช้การแคช     | ปิดใช้งาน prompt caching                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="การ override แคชต่อเอเจนต์">
    ใช้พารามิเตอร์ระดับโมเดลเป็นค่าพื้นฐาน จากนั้น override เอเจนต์เฉพาะผ่าน `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    ลำดับการรวม config:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (จับคู่ตาม `id`, override ตามคีย์)

    สิ่งนี้ช่วยให้เอเจนต์หนึ่งคงแคชระยะยาวไว้ได้ ขณะที่อีกเอเจนต์หนึ่งบนโมเดลเดียวกันปิดการแคชสำหรับทราฟฟิกแบบ bursty/ใช้งานซ้ำต่ำ

  </Accordion>

  <Accordion title="หมายเหตุเกี่ยวกับ Bedrock Claude">
    - โมเดล Anthropic Claude บน Bedrock (`amazon-bedrock/*anthropic.claude*`) ยอมรับการส่งผ่าน `cacheRetention` เมื่อมีการกำหนดค่า
    - โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับเป็น `cacheRetention: "none"` ตอนรันไทม์
    - smart default สำหรับ API key จะตั้งค่าเริ่มต้น `cacheRetention: "short"` ให้กับ ref ของ Claude-on-Bedrock ด้วยเมื่อไม่ได้กำหนดค่าไว้อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมดเร็ว">
    สวิตช์ `/fast` แบบใช้ร่วมกันของ OpenClaw รองรับทราฟฟิก Anthropic โดยตรง (API key และ OAuth ไปที่ `api.anthropic.com`)

    | Command | จับคู่เป็น |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - จะถูก inject เฉพาะกับคำขอโดยตรงไปยัง `api.anthropic.com` เท่านั้น เส้นทางผ่าน proxy จะคง `service_tier` ไว้ตามเดิม
    - พารามิเตอร์ `serviceTier` หรือ `service_tier` แบบชัดเจนจะ override `/fast` เมื่อมีทั้งสองอย่าง
    - สำหรับบัญชีที่ไม่มีความจุ Priority Tier, `service_tier: "auto"` อาจ resolve เป็น `standard`

    </Note>

  </Accordion>

  <Accordion title="การทำความเข้าใจสื่อ (ภาพและ PDF)">
    Plugin Anthropic ที่บันเดิลมาจะลงทะเบียนความสามารถในการเข้าใจภาพและ PDF OpenClaw
    จะ resolve ความสามารถด้านสื่อจากการยืนยันตัวตน Anthropic ที่กำหนดค่าไว้โดยอัตโนมัติ โดย
    ไม่ต้องมี config เพิ่มเติม

    | Property       | Value                |
    | -------------- | -------------------- |
    | โมเดลเริ่มต้น  | `claude-opus-4-6`    |
    | อินพุตที่รองรับ | รูปภาพ, เอกสาร PDF |

    เมื่อมีการแนบรูปภาพหรือ PDF กับการสนทนา OpenClaw จะ
    ส่งต่อผ่านผู้ให้บริการ media understanding ของ Anthropic โดยอัตโนมัติ

  </Accordion>

  <Accordion title="หน้าต่างบริบท 1M (beta)">
    หน้าต่างบริบท 1M ของ Anthropic ถูกจำกัดด้วย beta gate เปิดใช้ต่อโมเดลได้ดังนี้:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw จะจับคู่สิ่งนี้เป็น `anthropic-beta: context-1m-2025-08-07` ในคำขอ

    `params.context1m: true` ยังใช้กับ backend ของ Claude CLI
    (`claude-cli/*`) สำหรับโมเดล Opus และ Sonnet ที่เข้าเกณฑ์ โดยขยาย
    หน้าต่างบริบทของรันไทม์สำหรับเซสชัน CLI เหล่านั้นให้ตรงกับพฤติกรรมของ direct API

    <Warning>
    ต้องมีสิทธิ์เข้าถึง long-context บนข้อมูลรับรอง Anthropic ของคุณ การยืนยันตัวตนด้วยโทเค็นแบบเดิม (`sk-ant-oat-*`) จะถูกปฏิเสธสำหรับคำขอ 1M context — OpenClaw จะบันทึกคำเตือนและ fallback ไปใช้หน้าต่างบริบทมาตรฐาน
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M context">
    `anthropic/claude-opus-4.7` และรุ่น `claude-cli` ของมันมีหน้าต่างบริบท 1M
    เป็นค่าเริ่มต้นอยู่แล้ว — ไม่ต้องใช้ `params.context1m: true`
  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ข้อผิดพลาด 401 / โทเค็นใช้ไม่ได้อย่างกะทันหัน">
    การยืนยันตัวตนด้วยโทเค็นของ Anthropic หมดอายุได้และอาจถูกเพิกถอนได้ สำหรับการตั้งค่าใหม่ ให้ใช้ Anthropic API key แทน
  </Accordion>

  <Accordion title='ไม่พบ API key สำหรับ provider "anthropic"'>
    การยืนยันตัวตนของ Anthropic เป็นแบบ **ต่อเอเจนต์** — เอเจนต์ใหม่จะไม่รับคีย์จากเอเจนต์หลักโดยอัตโนมัติ ให้เรียก onboarding ใหม่สำหรับเอเจนต์นั้น (หรือกำหนดค่า API key บนโฮสต์ Gateway) จากนั้นตรวจสอบด้วย `openclaw models status`
  </Accordion>

  <Accordion title='ไม่พบข้อมูลรับรองสำหรับโปรไฟล์ "anthropic:default"'>
    เรียก `openclaw models status` เพื่อดูว่า auth profile ใดกำลังทำงานอยู่ เรียก onboarding ใหม่ หรือกำหนดค่า API key สำหรับเส้นทางโปรไฟล์นั้น
  </Accordion>

  <Accordion title="ไม่มี auth profile ที่พร้อมใช้งาน (ทั้งหมดอยู่ในช่วง cooldown)">
    ตรวจสอบ `openclaw models status --json` สำหรับ `auth.unusableProfiles` ช่วง cooldown จากการจำกัดอัตราของ Anthropic อาจผูกกับโมเดล ดังนั้นโมเดล Anthropic อื่นในกลุ่มเดียวกันอาจยังใช้งานได้ เพิ่มโปรไฟล์ Anthropic อีกตัวหรือรอให้ cooldown หมด
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ model ref และพฤติกรรม failover
  </Card>
  <Card title="CLI backends" href="/th/gateway/cli-backends" icon="terminal">
    รายละเอียดการตั้งค่าและรันไทม์ของ backend Claude CLI
  </Card>
  <Card title="Prompt caching" href="/th/reference/prompt-caching" icon="database">
    วิธีการทำงานของ prompt caching ข้ามผู้ให้บริการ
  </Card>
  <Card title="OAuth และ auth" href="/th/gateway/authentication" icon="key">
    รายละเอียด auth และกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
