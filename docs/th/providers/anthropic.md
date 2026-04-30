---
read_when:
    - คุณต้องการใช้โมเดล Anthropic ใน OpenClaw
summary: ใช้ Anthropic Claude ผ่านคีย์ API หรือ Claude CLI ใน OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-30T10:10:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfaba2eea6a2d263d76036d1e6859fc3b487e886ec460ef2ced83e5e8e834327
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic สร้างตระกูลโมเดล **Claude** OpenClaw รองรับเส้นทางการยืนยันตัวตนสองแบบ:

- **คีย์ API** — เข้าถึง Anthropic API โดยตรงพร้อมการเรียกเก็บเงินตามการใช้งาน (โมเดล `anthropic/*`)
- **Claude CLI** — ใช้การเข้าสู่ระบบ Claude CLI ที่มีอยู่บนโฮสต์เดียวกันซ้ำ

<Warning>
เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น
OpenClaw จะถือว่าการใช้ Claude CLI ซ้ำและการใช้งาน `claude -p` เป็นสิ่งที่ได้รับอนุมัติ เว้นแต่
Anthropic จะเผยแพร่นโยบายใหม่

สำหรับโฮสต์ Gateway ที่ใช้งานระยะยาว คีย์ Anthropic API ยังเป็นเส้นทางการผลิตที่ชัดเจนและ
คาดการณ์ได้มากที่สุด

เอกสารสาธารณะปัจจุบันของ Anthropic:

- [เอกสารอ้างอิง Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [ภาพรวม Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [การใช้ Claude Code กับแผน Pro หรือ Max ของคุณ](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [การใช้ Claude Code กับแผน Team หรือ Enterprise ของคุณ](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="API key">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง API มาตรฐานและการเรียกเก็บเงินตามการใช้งาน

    <Steps>
      <Step title="รับคีย์ API ของคุณ">
        สร้างคีย์ API ใน [Anthropic Console](https://console.anthropic.com/)
      </Step>
      <Step title="เรียกใช้ออนบอร์ดดิ้ง">
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

    ### ตัวอย่างการกำหนดค่า

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **เหมาะที่สุดสำหรับ:** การใช้การเข้าสู่ระบบ Claude CLI ที่มีอยู่ซ้ำโดยไม่ต้องมีคีย์ API แยกต่างหาก

    <Steps>
      <Step title="ตรวจสอบให้แน่ใจว่าติดตั้ง Claude CLI และเข้าสู่ระบบแล้ว">
        ตรวจสอบด้วย:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="เรียกใช้ออนบอร์ดดิ้ง">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw ตรวจพบและใช้ข้อมูลรับรอง Claude CLI ที่มีอยู่ซ้ำ
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    รายละเอียดการตั้งค่าและรันไทม์สำหรับแบ็กเอนด์ Claude CLI อยู่ใน [แบ็กเอนด์ CLI](/th/gateway/cli-backends)
    </Note>

    ### ตัวอย่างการกำหนดค่า

    แนะนำให้ใช้การอ้างอิงโมเดล Anthropic แบบมาตรฐานร่วมกับการแทนที่รันไทม์ CLI:

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

    การอ้างอิงโมเดลเดิมแบบ `claude-cli/claude-opus-4-7` ยังทำงานได้เพื่อ
    ความเข้ากันได้ แต่การกำหนดค่าใหม่ควรเก็บการเลือกผู้ให้บริการ/โมเดลเป็น
    `anthropic/*` และใส่แบ็กเอนด์การดำเนินการไว้ใน `agentRuntime.id`

    <Tip>
    หากคุณต้องการเส้นทางการเรียกเก็บเงินที่ชัดเจนที่สุด ให้ใช้คีย์ Anthropic API แทน OpenClaw ยังรองรับตัวเลือกแบบสมัครสมาชิกจาก [OpenAI Codex](/th/providers/openai), [Qwen Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax) และ [Z.AI / GLM](/th/providers/glm)
    </Tip>

  </Tab>
</Tabs>

## ค่าเริ่มต้นการคิด (Claude 4.6)

โมเดล Claude 4.6 ใช้การคิดแบบ `adaptive` เป็นค่าเริ่มต้นใน OpenClaw เมื่อไม่ได้ตั้งค่าระดับการคิดไว้อย่างชัดเจน

แทนที่ต่อข้อความด้วย `/think:<level>` หรือในพารามิเตอร์โมเดล:

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
- [การคิดแบบ Adaptive](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [การคิดแบบ Extended](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## การแคชพรอมป์

OpenClaw รองรับฟีเจอร์การแคชพรอมป์ของ Anthropic สำหรับการยืนยันตัวตนด้วยคีย์ API

| ค่า                 | ระยะเวลาแคช | คำอธิบาย                              |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (ค่าเริ่มต้น) | 5 นาที       | ใช้โดยอัตโนมัติสำหรับการยืนยันตัวตนด้วยคีย์ API |
| `"long"`            | 1 ชั่วโมง     | แคชแบบขยาย                           |
| `"none"`            | ไม่มีการแคช   | ปิดใช้งานการแคชพรอมป์                 |

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
  <Accordion title="Per-agent cache overrides">
    ใช้พารามิเตอร์ระดับโมเดลเป็นพื้นฐาน แล้วแทนที่เอเจนต์เฉพาะผ่าน `agents.list[].params`:

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

    ลำดับการผสานการกำหนดค่า:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (`id` ที่ตรงกัน แทนที่ตามคีย์)

    สิ่งนี้ทำให้เอเจนต์หนึ่งคงแคชระยะยาวไว้ได้ ขณะที่อีกเอเจนต์บนโมเดลเดียวกันปิดใช้งานการแคชสำหรับทราฟฟิกแบบเป็นช่วงหรือมีการใช้ซ้ำน้อย

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - โมเดล Anthropic Claude บน Bedrock (`amazon-bedrock/*anthropic.claude*`) ยอมรับการส่งผ่าน `cacheRetention` เมื่อกำหนดค่าไว้
    - โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับให้เป็น `cacheRetention: "none"` ขณะรันไทม์
    - ค่าเริ่มต้นอัจฉริยะของคีย์ API ยังตั้งต้น `cacheRetention: "short"` สำหรับการอ้างอิง Claude-on-Bedrock เมื่อไม่ได้ตั้งค่าไว้อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Fast mode">
    สวิตช์ `/fast` แบบใช้ร่วมกันของ OpenClaw รองรับทราฟฟิก Anthropic โดยตรง (คีย์ API และ OAuth ไปยัง `api.anthropic.com`)

    | คำสั่ง | แมปเป็น |
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
    - แทรกเฉพาะคำขอโดยตรงไปยัง `api.anthropic.com` เท่านั้น เส้นทางพร็อกซีจะปล่อย `service_tier` ไว้ตามเดิม
    - พารามิเตอร์ `serviceTier` หรือ `service_tier` ที่ตั้งไว้อย่างชัดเจนจะแทนที่ `/fast` เมื่อมีการตั้งค่าทั้งคู่
    - ในบัญชีที่ไม่มีความจุ Priority Tier, `service_tier: "auto"` อาจแปลงเป็น `standard`

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    Plugin Anthropic ที่รวมมาให้ลงทะเบียนความเข้าใจรูปภาพและ PDF OpenClaw
    แก้ไขความสามารถด้านสื่อโดยอัตโนมัติจากการยืนยันตัวตน Anthropic ที่กำหนดค่าไว้ โดยไม่ต้องมี
    การกำหนดค่าเพิ่มเติม

    | คุณสมบัติ       | ค่า                  |
    | -------------- | -------------------- |
    | โมเดลเริ่มต้น  | `claude-opus-4-6`    |
    | อินพุตที่รองรับ | รูปภาพ, เอกสาร PDF |

    เมื่อแนบรูปภาพหรือ PDF กับการสนทนา OpenClaw จะกำหนดเส้นทางผ่านผู้ให้บริการความเข้าใจสื่อของ Anthropic โดยอัตโนมัติ

  </Accordion>

  <Accordion title="1M context window (beta)">
    หน้าต่างบริบท 1M ของ Anthropic อยู่ภายใต้เบต้าเกต เปิดใช้ต่อโมเดล:

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

    OpenClaw แมปค่านี้เป็น `anthropic-beta: context-1m-2025-08-07` ในคำขอ

    `params.context1m: true` ยังใช้กับแบ็กเอนด์ Claude CLI
    (`claude-cli/*`) สำหรับโมเดล Opus และ Sonnet ที่มีสิทธิ์ โดยขยายหน้าต่างบริบท
    รันไทม์สำหรับเซสชัน CLI เหล่านั้นให้ตรงกับพฤติกรรม API โดยตรง

    <Warning>
    ต้องมีสิทธิ์เข้าถึงบริบทยาวบนข้อมูลรับรอง Anthropic ของคุณ การยืนยันตัวตนด้วยโทเค็นเดิม (`sk-ant-oat-*`) จะถูกปฏิเสธสำหรับคำขอบริบท 1M — OpenClaw จะบันทึกคำเตือนและย้อนกลับไปใช้หน้าต่างบริบทมาตรฐาน
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M context">
    `anthropic/claude-opus-4.7` และตัวแปร `claude-cli` ของโมเดลนี้มีหน้าต่างบริบท 1M
    เป็นค่าเริ่มต้น — ไม่ต้องใช้ `params.context1m: true`
  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    การยืนยันตัวตนด้วยโทเค็น Anthropic หมดอายุได้และอาจถูกเพิกถอนได้ สำหรับการตั้งค่าใหม่ ให้ใช้คีย์ Anthropic API แทน
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    การยืนยันตัวตน Anthropic เป็นแบบ **ต่อเอเจนต์** — เอเจนต์ใหม่จะไม่สืบทอดคีย์ของเอเจนต์หลัก เรียกใช้ออนบอร์ดดิ้งใหม่สำหรับเอเจนต์นั้น (หรือกำหนดค่าคีย์ API บนโฮสต์ Gateway) จากนั้นตรวจสอบด้วย `openclaw models status`
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    เรียกใช้ `openclaw models status` เพื่อดูว่าโปรไฟล์การยืนยันตัวตนใดกำลังใช้งานอยู่ เรียกใช้ออนบอร์ดดิ้งใหม่ หรือกำหนดค่าคีย์ API สำหรับเส้นทางโปรไฟล์นั้น
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    ตรวจสอบ `openclaw models status --json` สำหรับ `auth.unusableProfiles` คูลดาวน์การจำกัดอัตราของ Anthropic อาจกำหนดขอบเขตตามโมเดล ดังนั้นโมเดล Anthropic อื่นในกลุ่มเดียวกันอาจยังใช้งานได้ เพิ่มโปรไฟล์ Anthropic อื่นหรือรอให้คูลดาวน์สิ้นสุด
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับใช้งานเมื่อเกิดข้อผิดพลาด
  </Card>
  <Card title="CLI backends" href="/th/gateway/cli-backends" icon="terminal">
    การตั้งค่าแบ็กเอนด์ Claude CLI และรายละเอียดรันไทม์
  </Card>
  <Card title="Prompt caching" href="/th/reference/prompt-caching" icon="database">
    วิธีการทำงานของการแคชพรอมป์ระหว่างผู้ให้บริการ
  </Card>
  <Card title="OAuth and auth" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
