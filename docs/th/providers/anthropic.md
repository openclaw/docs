---
read_when:
    - คุณต้องการใช้โมเดลของ Anthropic ใน OpenClaw
summary: ใช้ Anthropic Claude ผ่านคีย์ API หรือ Claude CLI ใน OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-05-07T13:24:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15ae1d2751d0127a45ece3d0a25bead21fd6bacc2ffc80636188fc2cb5f3d7ce
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic สร้างตระกูลโมเดล **Claude** OpenClaw รองรับการยืนยันตัวตนสองเส้นทาง:

- **API key** — เข้าถึง Anthropic API โดยตรงพร้อมการคิดค่าบริการตามการใช้งาน (โมเดล `anthropic/*`)
- **Claude CLI** — ใช้การเข้าสู่ระบบ Claude CLI ที่มีอยู่บนโฮสต์เดียวกันซ้ำ

<Warning>
ทีมงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI ในรูปแบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น
OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` ได้รับการรับรอง เว้นแต่
Anthropic จะเผยแพร่นโยบายใหม่

สำหรับโฮสต์ gateway ที่ทำงานระยะยาว Anthropic API key ยังคงเป็นเส้นทางสำหรับ production ที่ชัดเจนและ
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
    **เหมาะที่สุดสำหรับ:** การเข้าถึง API มาตรฐานและการคิดค่าบริการตามการใช้งาน

    <Steps>
      <Step title="รับ API key ของคุณ">
        สร้าง API key ใน [Anthropic Console](https://console.anthropic.com/)
      </Step>
      <Step title="เรียกใช้ออนบอร์ดิง">
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
    **เหมาะที่สุดสำหรับ:** การใช้การเข้าสู่ระบบ Claude CLI ที่มีอยู่ซ้ำโดยไม่ต้องมี API key แยกต่างหาก

    <Steps>
      <Step title="ตรวจสอบให้แน่ใจว่า Claude CLI ติดตั้งและเข้าสู่ระบบแล้ว">
        ตรวจสอบด้วย:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="เรียกใช้ออนบอร์ดิง">
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

    แนะนำให้ใช้ model ref มาตรฐานของ Anthropic พร้อมการ override รันไทม์ CLI:

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

    model refs แบบเดิม `claude-cli/claude-opus-4-7` ยังคงใช้งานได้เพื่อ
    ความเข้ากันได้ แต่การกำหนดค่าใหม่ควรเก็บการเลือก provider/model เป็น
    `anthropic/*` และวางแบ็กเอนด์การทำงานไว้ใน `agentRuntime.id`

    <Tip>
    หากคุณต้องการเส้นทางการเรียกเก็บเงินที่ชัดเจนที่สุด ให้ใช้ Anthropic API key แทน OpenClaw ยังรองรับตัวเลือกแบบ subscription จาก [OpenAI Codex](/th/providers/openai), [Qwen Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax) และ [Z.AI / GLM](/th/providers/glm)
    </Tip>

  </Tab>
</Tabs>

## ค่าเริ่มต้นการคิด (Claude 4.6)

โมเดล Claude 4.6 ใช้การคิดแบบ `adaptive` เป็นค่าเริ่มต้นใน OpenClaw เมื่อไม่ได้ตั้งค่าระดับการคิดไว้อย่างชัดเจน

Override ต่อข้อความด้วย `/think:<level>` หรือในพารามิเตอร์โมเดล:

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

OpenClaw รองรับฟีเจอร์การแคชพรอมป์ของ Anthropic สำหรับการยืนยันตัวตนด้วย API key

| ค่า                 | ระยะเวลาแคช | คำอธิบาย                                  |
| ------------------- | ------------ | ------------------------------------------ |
| `"short"` (ค่าเริ่มต้น) | 5 นาที       | ใช้โดยอัตโนมัติสำหรับการยืนยันตัวตนด้วย API key |
| `"long"`            | 1 ชั่วโมง    | แคชแบบขยาย                                |
| `"none"`            | ไม่แคช       | ปิดใช้งานการแคชพรอมป์                    |

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
  <Accordion title="Override แคชต่อเอเจนต์">
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

    ลำดับการผสานการกำหนดค่า:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (ตรงกับ `id`, override ตามคีย์)

    วิธีนี้ทำให้เอเจนต์หนึ่งคงแคชระยะยาวไว้ได้ ขณะที่อีกเอเจนต์หนึ่งบนโมเดลเดียวกันปิดแคชสำหรับทราฟฟิกที่มาเป็นช่วงสั้นๆ/มีการใช้ซ้ำต่ำ

  </Accordion>

  <Accordion title="หมายเหตุ Bedrock Claude">
    - โมเดล Anthropic Claude บน Bedrock (`amazon-bedrock/*anthropic.claude*`) ยอมรับการส่งผ่าน `cacheRetention` เมื่อตั้งค่าไว้
    - โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับเป็น `cacheRetention: "none"` ขณะรันไทม์
    - ค่าเริ่มต้นอัจฉริยะของ API key ยังเติม `cacheRetention: "short"` ให้กับ refs Claude-on-Bedrock เมื่อไม่ได้ตั้งค่าไว้อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมดเร็ว">
    toggle `/fast` แบบใช้ร่วมกันของ OpenClaw รองรับทราฟฟิก Anthropic โดยตรง (API key และ OAuth ไปยัง `api.anthropic.com`)

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
    - ฉีดเข้าไปเฉพาะสำหรับคำขอ `api.anthropic.com` โดยตรง เส้นทาง proxy จะปล่อย `service_tier` ไว้ตามเดิม
    - พารามิเตอร์ `serviceTier` หรือ `service_tier` ที่ตั้งไว้อย่างชัดเจนจะ override `/fast` เมื่อมีการตั้งค่าทั้งคู่
    - ในบัญชีที่ไม่มีความจุ Priority Tier ค่า `service_tier: "auto"` อาจได้ผลลัพธ์เป็น `standard`

    </Note>

  </Accordion>

  <Accordion title="การทำความเข้าใจสื่อ (รูปภาพและ PDF)">
    Plugin Anthropic ที่รวมมาให้ลงทะเบียนความสามารถในการทำความเข้าใจรูปภาพและ PDF OpenClaw
    แก้ไขความสามารถด้านสื่อโดยอัตโนมัติจากการยืนยันตัวตน Anthropic ที่กำหนดค่าไว้ โดยไม่ต้องมี
    การกำหนดค่าเพิ่มเติม

    | คุณสมบัติ        | ค่า                   |
    | --------------- | --------------------- |
    | โมเดลเริ่มต้น   | `claude-opus-4-7`     |
    | อินพุตที่รองรับ | รูปภาพ, เอกสาร PDF   |

    เมื่อแนบรูปภาพหรือ PDF เข้ากับการสนทนา OpenClaw จะกำหนดเส้นทางผ่านผู้ให้บริการการทำความเข้าใจสื่อของ Anthropic โดยอัตโนมัติ

  </Accordion>

  <Accordion title="หน้าต่างบริบท 1M (เบต้า)">
    หน้าต่างบริบท 1M ของ Anthropic ถูกจำกัดด้วยสถานะเบต้า เปิดใช้งานต่อโมเดล:

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
    ของรันไทม์สำหรับเซสชัน CLI เหล่านั้นให้ตรงกับพฤติกรรม direct-API

    <Warning>
    ต้องมีสิทธิ์เข้าถึงบริบทยาวในข้อมูลรับรอง Anthropic ของคุณ การยืนยันตัวตนด้วยโทเค็นแบบเดิม (`sk-ant-oat-*`) จะถูกปฏิเสธสำหรับคำขอบริบท 1M — OpenClaw บันทึกคำเตือนและถอยกลับไปใช้หน้าต่างบริบทมาตรฐาน
    </Warning>

  </Accordion>

  <Accordion title="บริบท 1M ของ Claude Opus 4.7">
    `anthropic/claude-opus-4.7` และ variant `claude-cli` ของโมเดลนี้มีหน้าต่างบริบท 1M
    เป็นค่าเริ่มต้น โดยไม่ต้องใช้ `params.context1m: true`
  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ข้อผิดพลาด 401 / โทเค็นใช้ไม่ได้กะทันหัน">
    การยืนยันตัวตนด้วยโทเค็น Anthropic หมดอายุและอาจถูกเพิกถอนได้ สำหรับการตั้งค่าใหม่ ให้ใช้ Anthropic API key แทน
  </Accordion>

  <Accordion title='ไม่พบ API key สำหรับ provider "anthropic"'>
    การยืนยันตัวตน Anthropic เป็นแบบ **ต่อเอเจนต์** — เอเจนต์ใหม่จะไม่สืบทอดคีย์ของเอเจนต์หลัก เรียกใช้ออนบอร์ดิงอีกครั้งสำหรับเอเจนต์นั้น (หรือกำหนดค่า API key บนโฮสต์ gateway) จากนั้นตรวจสอบด้วย `openclaw models status`
  </Accordion>

  <Accordion title='ไม่พบข้อมูลรับรองสำหรับโปรไฟล์ "anthropic:default"'>
    เรียกใช้ `openclaw models status` เพื่อดูว่าโปรไฟล์การยืนยันตัวตนใดทำงานอยู่ เรียกใช้ออนบอร์ดิงอีกครั้ง หรือกำหนดค่า API key สำหรับพาธโปรไฟล์นั้น
  </Accordion>

  <Accordion title="ไม่มีโปรไฟล์การยืนยันตัวตนที่พร้อมใช้งาน (ทั้งหมดอยู่ในคูลดาวน์)">
    ตรวจสอบ `openclaw models status --json` สำหรับ `auth.unusableProfiles` คูลดาวน์จาก rate limit ของ Anthropic อาจจำกัดตามโมเดล ดังนั้นโมเดล Anthropic ที่เป็นพี่น้องกันอาจยังใช้งานได้ เพิ่มโปรไฟล์ Anthropic อีกอันหรือรอให้คูลดาวน์สิ้นสุด
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [FAQ](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
  <Card title="แบ็กเอนด์ CLI" href="/th/gateway/cli-backends" icon="terminal">
    การตั้งค่าแบ็กเอนด์ Claude CLI และรายละเอียดรันไทม์
  </Card>
  <Card title="การแคชพรอมป์" href="/th/reference/prompt-caching" icon="database">
    วิธีที่การแคชพรอมป์ทำงานข้าม providers
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
