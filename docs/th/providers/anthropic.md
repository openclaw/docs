---
read_when:
    - คุณต้องการใช้โมเดลของ Anthropic ใน OpenClaw
summary: ใช้ Anthropic Claude ผ่านคีย์ API หรือ Claude CLI ใน OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-05-10T19:53:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: c36764f1adb7585389d241303e9c61c1fe2fa49fefdfb28c314abbafa646b273
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic สร้างตระกูลโมเดล **Claude** OpenClaw รองรับเส้นทางการยืนยันตัวตนสองแบบ:

- **คีย์ API** — เข้าถึง Anthropic API โดยตรงพร้อมการเรียกเก็บเงินตามการใช้งาน (โมเดล `anthropic/*`)
- **Claude CLI** — ใช้การเข้าสู่ระบบ Claude CLI ที่มีอยู่บนโฮสต์เดียวกันซ้ำ

<Warning>
เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น
OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` ได้รับการอนุมัติ เว้นแต่
Anthropic จะเผยแพร่นโยบายใหม่

สำหรับโฮสต์ Gateway ที่ใช้งานระยะยาว คีย์ Anthropic API ยังคงเป็นเส้นทางสำหรับโปรดักชันที่ชัดเจนและ
คาดการณ์ได้มากที่สุด

เอกสารสาธารณะปัจจุบันของ Anthropic:

- [คู่มืออ้างอิง Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [ภาพรวม Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [การใช้ Claude Code กับแผน Pro หรือ Max ของคุณ](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [การใช้ Claude Code กับแผน Team หรือ Enterprise ของคุณ](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="คีย์ API">
    **เหมาะสำหรับ:** การเข้าถึง API มาตรฐานและการเรียกเก็บเงินตามการใช้งาน

    <Steps>
      <Step title="รับคีย์ API ของคุณ">
        สร้างคีย์ API ใน [Anthropic Console](https://console.anthropic.com/)
      </Step>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน">
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
    **เหมาะสำหรับ:** การใช้การเข้าสู่ระบบ Claude CLI ที่มีอยู่ซ้ำโดยไม่ต้องมีคีย์ API แยกต่างหาก

    <Steps>
      <Step title="ตรวจสอบให้แน่ใจว่าติดตั้งและเข้าสู่ระบบ Claude CLI แล้ว">
        ตรวจสอบด้วย:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน">
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
          models: {
            "anthropic/claude-opus-4-7": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    การอ้างอิงโมเดลแบบเดิม `claude-cli/claude-opus-4-7` ยังคงใช้งานได้เพื่อ
    ความเข้ากันได้ แต่การกำหนดค่าใหม่ควรเก็บการเลือก provider/model เป็น
    `anthropic/*` และใส่แบ็กเอนด์การทำงานไว้ในนโยบายรันไทม์ของ provider/model

    <Tip>
    หากคุณต้องการเส้นทางการเรียกเก็บเงินที่ชัดเจนที่สุด ให้ใช้คีย์ Anthropic API แทน OpenClaw ยังรองรับตัวเลือกแบบสมัครสมาชิกจาก [OpenAI Codex](/th/providers/openai), [Qwen Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax), และ [Z.AI / GLM](/th/providers/glm)
    </Tip>

  </Tab>
</Tabs>

## ค่าเริ่มต้นของการคิด (Claude 4.6)

โมเดล Claude 4.6 มีค่าเริ่มต้นเป็นการคิดแบบ `adaptive` ใน OpenClaw เมื่อไม่ได้ตั้งค่าระดับการคิดไว้อย่างชัดเจน

แทนที่แบบรายข้อความด้วย `/think:<level>` หรือในพารามิเตอร์โมเดล:

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

| ค่า               | ระยะเวลาแคช | คำอธิบาย                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (ค่าเริ่มต้น) | 5 นาที      | ใช้โดยอัตโนมัติสำหรับการยืนยันตัวตนด้วยคีย์ API |
| `"long"`            | 1 ชั่วโมง         | แคชแบบขยาย                         |
| `"none"`            | ไม่มีการแคช     | ปิดใช้งานการแคชพรอมป์                 |

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
  <Accordion title="การแทนที่แคชต่อเอเจนต์">
    ใช้พารามิเตอร์ระดับโมเดลเป็นค่าพื้นฐาน แล้วแทนที่เอเจนต์เฉพาะผ่าน `agents.list[].params`:

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
    2. `agents.list[].params` (จับคู่ `id`, แทนที่ตามคีย์)

    สิ่งนี้ช่วยให้เอเจนต์หนึ่งรักษาแคชระยะยาวไว้ได้ ขณะที่เอเจนต์อีกตัวบนโมเดลเดียวกันปิดการแคชสำหรับทราฟฟิกที่มาเป็นช่วง ๆ หรือมีการใช้ซ้ำน้อย

  </Accordion>

  <Accordion title="หมายเหตุ Bedrock Claude">
    - โมเดล Anthropic Claude บน Bedrock (`amazon-bedrock/*anthropic.claude*`) ยอมรับการส่งผ่าน `cacheRetention` เมื่อกำหนดค่าไว้
    - โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับเป็น `cacheRetention: "none"` ขณะรันไทม์
    - ค่าเริ่มต้นอัจฉริยะสำหรับคีย์ API ยังตั้งต้น `cacheRetention: "short"` สำหรับการอ้างอิง Claude-on-Bedrock เมื่อไม่ได้ตั้งค่าไว้อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมดเร็ว">
    สวิตช์ `/fast` ที่ใช้ร่วมกันของ OpenClaw รองรับทราฟฟิก Anthropic โดยตรง (คีย์ API และ OAuth ไปยัง `api.anthropic.com`)

    | คำสั่ง | แมปไปยัง |
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
    - ฉีดเฉพาะสำหรับคำขอโดยตรงไปยัง `api.anthropic.com` เส้นทางพร็อกซีจะปล่อย `service_tier` ไว้ตามเดิม
    - พารามิเตอร์ `serviceTier` หรือ `service_tier` ที่ตั้งไว้อย่างชัดเจนจะแทนที่ `/fast` เมื่อมีการตั้งค่าทั้งคู่
    - สำหรับบัญชีที่ไม่มีความจุ Priority Tier, `service_tier: "auto"` อาจแก้ค่าเป็น `standard`

    </Note>

  </Accordion>

  <Accordion title="การเข้าใจสื่อ (รูปภาพและ PDF)">
    Plugin Anthropic ที่มาพร้อมระบบลงทะเบียนการเข้าใจรูปภาพและ PDF OpenClaw
    แก้ความสามารถด้านสื่อโดยอัตโนมัติจากการยืนยันตัวตน Anthropic ที่กำหนดค่าไว้ — ไม่จำเป็นต้องมี
    การกำหนดค่าเพิ่มเติม

    | คุณสมบัติ        | ค่า                 |
    | --------------- | --------------------- |
    | โมเดลเริ่มต้น   | `claude-opus-4-7`     |
    | อินพุตที่รองรับ | รูปภาพ, เอกสาร PDF |

    เมื่อแนบรูปภาพหรือ PDF กับการสนทนา OpenClaw จะกำหนดเส้นทางผ่านผู้ให้บริการการเข้าใจสื่อของ Anthropic โดยอัตโนมัติ

  </Accordion>

  <Accordion title="หน้าต่างบริบท 1M (เบต้า)">
    หน้าต่างบริบท 1M ของ Anthropic ถูกควบคุมด้วยเบต้า เปิดใช้ต่อโมเดล:

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

    OpenClaw แมปสิ่งนี้เป็น `anthropic-beta: context-1m-2025-08-07` บนคำขอ

    `params.context1m: true` ยังใช้กับแบ็กเอนด์ Claude CLI
    (`claude-cli/*`) สำหรับโมเดล Opus และ Sonnet ที่มีสิทธิ์ โดยขยายหน้าต่างบริบท
    ของรันไทม์สำหรับเซสชัน CLI เหล่านั้นให้ตรงกับพฤติกรรม API โดยตรง

    <Warning>
    ต้องมีสิทธิ์เข้าถึงบริบทยาวในข้อมูลรับรอง Anthropic ของคุณ การยืนยันตัวตนด้วยโทเค็นแบบเดิม (`sk-ant-oat-*`) จะถูกปฏิเสธสำหรับคำขอบริบท 1M — OpenClaw บันทึกคำเตือนและถอยกลับไปใช้หน้าต่างบริบทมาตรฐาน
    </Warning>

  </Accordion>

  <Accordion title="บริบท 1M ของ Claude Opus 4.7">
    `anthropic/claude-opus-4.7` และเวอร์ชัน `claude-cli` ของมันมีหน้าต่างบริบท 1M
    โดยค่าเริ่มต้น — ไม่ต้องใช้ `params.context1m: true`
  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ข้อผิดพลาด 401 / โทเค็นใช้งานไม่ได้กะทันหัน">
    การยืนยันตัวตนด้วยโทเค็นของ Anthropic หมดอายุและอาจถูกเพิกถอนได้ สำหรับการตั้งค่าใหม่ ให้ใช้คีย์ Anthropic API แทน
  </Accordion>

  <Accordion title='ไม่พบคีย์ API สำหรับ provider "anthropic"'>
    การยืนยันตัวตน Anthropic เป็นแบบ **ต่อเอเจนต์** — เอเจนต์ใหม่จะไม่สืบทอดคีย์ของเอเจนต์หลัก เรียกใช้การเริ่มต้นใช้งานอีกครั้งสำหรับเอเจนต์นั้น (หรือกำหนดค่าคีย์ API บนโฮสต์ Gateway) แล้วตรวจสอบด้วย `openclaw models status`
  </Accordion>

  <Accordion title='ไม่พบข้อมูลรับรองสำหรับโปรไฟล์ "anthropic:default"'>
    เรียกใช้ `openclaw models status` เพื่อดูว่าโปรไฟล์การยืนยันตัวตนใดกำลังใช้งานอยู่ เรียกใช้การเริ่มต้นใช้งานอีกครั้ง หรือกำหนดค่าคีย์ API สำหรับเส้นทางโปรไฟล์นั้น
  </Accordion>

  <Accordion title="ไม่มีโปรไฟล์การยืนยันตัวตนที่พร้อมใช้งาน (ทั้งหมดอยู่ในคูลดาวน์)">
    ตรวจสอบ `openclaw models status --json` สำหรับ `auth.unusableProfiles` คูลดาวน์ของการจำกัดอัตรา Anthropic อาจกำหนดขอบเขตตามโมเดล ดังนั้นโมเดล Anthropic ข้างเคียงอาจยังใช้งานได้ เพิ่มโปรไฟล์ Anthropic อีกโปรไฟล์หนึ่งหรือรอให้คูลดาวน์สิ้นสุด
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ตัวสำรอง
  </Card>
  <Card title="แบ็กเอนด์ CLI" href="/th/gateway/cli-backends" icon="terminal">
    การตั้งค่าแบ็กเอนด์ Claude CLI และรายละเอียดรันไทม์
  </Card>
  <Card title="การแคชพรอมป์" href="/th/reference/prompt-caching" icon="database">
    วิธีการทำงานของการแคชพรอมป์ข้ามผู้ให้บริการ
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
