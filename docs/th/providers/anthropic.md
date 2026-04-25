---
read_when:
    - คุณต้องการใช้โมเดล Anthropic ใน OpenClaw
summary: ใช้ Anthropic Claude ผ่านคีย์ API หรือ Claude CLI ใน OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-25T13:56:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: daba524d9917321d2aec55222d0df7b850ddf7f5c1c13123b62807eebd1a7a1b
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic สร้างตระกูลโมเดล **Claude** OpenClaw รองรับเส้นทางการยืนยันตัวตน 2 แบบ:

- **คีย์ API** — เข้าถึง Anthropic API โดยตรงพร้อมการคิดค่าบริการตามการใช้งาน (โมเดล `anthropic/*`)
- **Claude CLI** — นำการเข้าสู่ระบบ Claude CLI ที่มีอยู่แล้วบนโฮสต์เดียวกันกลับมาใช้ซ้ำ

<Warning>
เจ้าหน้าที่ของ Anthropic แจ้งกับเราว่าการใช้งาน Claude CLI ในลักษณะของ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น
OpenClaw จึงถือว่าการนำ Claude CLI กลับมาใช้ซ้ำและการใช้งาน `claude -p` เป็นการใช้งานที่ได้รับอนุญาต เว้นแต่
Anthropic จะเผยแพร่นโยบายใหม่

สำหรับโฮสต์ Gateway ที่ใช้งานระยะยาว คีย์ API ของ Anthropic ยังคงเป็นแนวทางที่ชัดเจนและ
คาดการณ์ได้มากที่สุดสำหรับการใช้งานจริง

เอกสารสาธารณะปัจจุบันของ Anthropic:

- [ข้อมูลอ้างอิง Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [ภาพรวม Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [การใช้ Claude Code กับแผน Pro หรือ Max ของคุณ](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [การใช้ Claude Code กับแผน Team หรือ Enterprise ของคุณ](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="คีย์ API">
    **เหมาะสำหรับ:** การเข้าถึง API มาตรฐานและการคิดค่าบริการตามการใช้งาน

    <Steps>
      <Step title="รับคีย์ API ของคุณ">
        สร้างคีย์ API ใน [Anthropic Console](https://console.anthropic.com/)
      </Step>
      <Step title="เรียกใช้การตั้งค่าเริ่มต้น">
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

    ### ตัวอย่างการตั้งค่า

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **เหมาะสำหรับ:** การนำการเข้าสู่ระบบ Claude CLI ที่มีอยู่แล้วกลับมาใช้ซ้ำโดยไม่ต้องใช้คีย์ API แยกต่างหาก

    <Steps>
      <Step title="ตรวจสอบให้แน่ใจว่าได้ติดตั้ง Claude CLI และเข้าสู่ระบบแล้ว">
        ตรวจสอบด้วย:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="เรียกใช้การตั้งค่าเริ่มต้น">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw จะตรวจพบและนำข้อมูลรับรอง Claude CLI ที่มีอยู่กลับมาใช้ซ้ำ
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    รายละเอียดการตั้งค่าและรันไทม์สำหรับแบ็กเอนด์ Claude CLI อยู่ใน [CLI Backends](/th/gateway/cli-backends)
    </Note>

    <Tip>
    หากคุณต้องการเส้นทางการคิดค่าบริการที่ชัดเจนที่สุด ให้ใช้คีย์ API ของ Anthropic แทน OpenClaw ยังรองรับตัวเลือกแบบสมัครใช้งานจาก [OpenAI Codex](/th/providers/openai), [Qwen Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax) และ [Z.AI / GLM](/th/providers/glm) ด้วย
    </Tip>

  </Tab>
</Tabs>

## ค่าเริ่มต้นของ thinking (Claude 4.6)

โมเดล Claude 4.6 ใช้ thinking แบบ `adaptive` เป็นค่าเริ่มต้นใน OpenClaw เมื่อไม่ได้ตั้งค่าระดับ thinking แบบชัดเจน

แทนที่ต่อข้อความได้ด้วย `/think:<level>` หรือในพารามิเตอร์โมเดล:

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

OpenClaw รองรับฟีเจอร์การแคชพรอมป์ต์ของ Anthropic สำหรับการยืนยันตัวตนด้วยคีย์ API

| ค่า                | ระยะเวลาแคช | คำอธิบาย                                 |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (ค่าเริ่มต้น) | 5 นาที         | ใช้อัตโนมัติสำหรับการยืนยันตัวตนด้วยคีย์ API |
| `"long"`            | 1 ชั่วโมง      | แคชแบบขยายเวลา                         |
| `"none"`            | ไม่แคช         | ปิดการแคชพรอมป์ต์                      |

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
    ใช้พารามิเตอร์ระดับโมเดลเป็นค่าพื้นฐานของคุณ จากนั้นแทนที่เอเจนต์เฉพาะผ่าน `agents.list[].params`:

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

    ลำดับการผสานการตั้งค่า:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (ตรงกับ `id` และแทนที่ตามคีย์)

    วิธีนี้ทำให้เอเจนต์หนึ่งคงแคชระยะยาวไว้ได้ ขณะที่อีกเอเจนต์หนึ่งบนโมเดลเดียวกันปิดการแคชสำหรับทราฟฟิกที่เป็นช่วงสั้น ๆ / มีการนำกลับมาใช้น้อย

  </Accordion>

  <Accordion title="หมายเหตุเกี่ยวกับ Bedrock Claude">
    - โมเดล Anthropic Claude บน Bedrock (`amazon-bedrock/*anthropic.claude*`) รองรับการส่งต่อ `cacheRetention` เมื่อมีการตั้งค่า
    - โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับเป็น `cacheRetention: "none"` ขณะรันไทม์
    - ค่าเริ่มต้นอัจฉริยะสำหรับคีย์ API จะตั้งต้น `cacheRetention: "short"` สำหรับการอ้างอิง Claude-on-Bedrock ด้วย เมื่อไม่ได้กำหนดค่าแบบชัดเจน
  </Accordion>
</AccordionGroup>

## การตั้งค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมดเร็ว">
    ตัวสลับ `/fast` แบบใช้ร่วมกันของ OpenClaw รองรับทราฟฟิก Anthropic โดยตรง (คีย์ API และ OAuth ไปยัง `api.anthropic.com`)

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
    - จะแทรกเฉพาะสำหรับคำขอโดยตรงไปยัง `api.anthropic.com` เท่านั้น เส้นทางผ่านพร็อกซีจะไม่แตะต้อง `service_tier`
    - พารามิเตอร์ `serviceTier` หรือ `service_tier` ที่ระบุแบบชัดเจนจะมีผลเหนือกว่า `/fast` เมื่อกำหนดทั้งคู่
    - ในบัญชีที่ไม่มีความจุของ Priority Tier, `service_tier: "auto"` อาจถูกแปลงเป็น `standard`
    </Note>

  </Accordion>

  <Accordion title="การทำความเข้าใจสื่อ (รูปภาพและ PDF)">
    Plugin Anthropic ที่มาพร้อมกันได้ลงทะเบียนความสามารถในการทำความเข้าใจรูปภาพและ PDF ไว้แล้ว OpenClaw
    จะระบุความสามารถด้านสื่อจากการยืนยันตัวตน Anthropic ที่ตั้งค่าไว้โดยอัตโนมัติ โดย
    ไม่ต้องมีการตั้งค่าเพิ่มเติม

    | Property       | Value                |
    | -------------- | -------------------- |
    | โมเดลเริ่มต้น  | `claude-opus-4-6`    |
    | อินพุตที่รองรับ | รูปภาพ, เอกสาร PDF |

    เมื่อแนบรูปภาพหรือ PDF กับบทสนทนา OpenClaw จะกำหนดเส้นทาง
    ผ่านผู้ให้บริการทำความเข้าใจสื่อของ Anthropic โดยอัตโนมัติ

  </Accordion>

  <Accordion title="หน้าต่างบริบท 1M (เบต้า)">
    หน้าต่างบริบท 1M ของ Anthropic ถูกจำกัดการใช้งานระดับเบต้า เปิดใช้งานต่อโมเดลได้ดังนี้:

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

    OpenClaw จะแมปค่านี้ไปเป็น `anthropic-beta: context-1m-2025-08-07` ในคำขอ

    <Warning>
    ต้องมีสิทธิ์เข้าถึง long-context บนข้อมูลรับรอง Anthropic ของคุณ การยืนยันตัวตนแบบโทเค็นรุ่นเก่า (`sk-ant-oat-*`) จะถูกปฏิเสธสำหรับคำขอบริบท 1M — OpenClaw จะบันทึกคำเตือนและถอยกลับไปใช้หน้าต่างบริบทมาตรฐาน
    </Warning>

  </Accordion>

  <Accordion title="บริบท 1M ของ Claude Opus 4.7">
    `anthropic/claude-opus-4.7` และตัวแปร `claude-cli` ของมันมีหน้าต่างบริบท 1M
    เป็นค่าเริ่มต้นอยู่แล้ว — ไม่จำเป็นต้องใช้ `params.context1m: true`
  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ข้อผิดพลาด 401 / โทเค็นใช้ไม่ได้กะทันหัน">
    การยืนยันตัวตนด้วยโทเค็นของ Anthropic หมดอายุได้และอาจถูกเพิกถอนได้ สำหรับการตั้งค่าใหม่ ให้ใช้คีย์ API ของ Anthropic แทน
  </Accordion>

  <Accordion title='ไม่พบคีย์ API สำหรับผู้ให้บริการ "anthropic"'>
    การยืนยันตัวตน Anthropic เป็นแบบ **ต่อเอเจนต์** — เอเจนต์ใหม่จะไม่รับคีย์ของเอเจนต์หลักโดยอัตโนมัติ เรียกใช้การตั้งค่าเริ่มต้นอีกครั้งสำหรับเอเจนต์นั้น (หรือกำหนดค่าคีย์ API บนโฮสต์ Gateway) จากนั้นตรวจสอบด้วย `openclaw models status`
  </Accordion>

  <Accordion title='ไม่พบข้อมูลรับรองสำหรับโปรไฟล์ "anthropic:default"'>
    เรียกใช้ `openclaw models status` เพื่อดูว่าโปรไฟล์การยืนยันตัวตนใดกำลังใช้งานอยู่ เรียกใช้การตั้งค่าเริ่มต้นอีกครั้ง หรือกำหนดค่าคีย์ API สำหรับเส้นทางโปรไฟล์นั้น
  </Accordion>

  <Accordion title="ไม่มีโปรไฟล์การยืนยันตัวตนที่ใช้งานได้ (ทั้งหมดอยู่ในช่วง cooldown)">
    ตรวจสอบ `openclaw models status --json` สำหรับ `auth.unusableProfiles` ช่วง cooldown จากการจำกัดอัตราของ Anthropic อาจผูกกับระดับโมเดล ดังนั้นโมเดล Anthropic อื่นในกลุ่มเดียวกันอาจยังใช้งานได้ เพิ่มโปรไฟล์ Anthropic อีกตัว หรือรอให้ cooldown สิ้นสุด
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [Troubleshooting](/th/help/troubleshooting) และ [FAQ](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, การอ้างอิงโมเดล และพฤติกรรมการสลับสำรอง
  </Card>
  <Card title="CLI backends" href="/th/gateway/cli-backends" icon="terminal">
    รายละเอียดการตั้งค่าและรันไทม์ของแบ็กเอนด์ Claude CLI
  </Card>
  <Card title="การแคชพรอมป์ต์" href="/th/reference/prompt-caching" icon="database">
    วิธีการทำงานของการแคชพรอมป์ต์ข้ามผู้ให้บริการ
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการนำข้อมูลรับรองกลับมาใช้ซ้ำ
  </Card>
</CardGroup>
