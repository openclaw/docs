---
read_when:
    - คุณต้องการใช้โมเดล Anthropic ใน OpenClaw
summary: ใช้ Anthropic Claude ผ่าน API key หรือ Claude CLI ใน OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T10:20:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1e95c84a43b083d12558d8b8c86d36b79e7ef15e4ad7e96a84b2d0e1ea36585
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic เป็นผู้พัฒนาโมเดลตระกูล **Claude** OpenClaw รองรับเส้นทางการยืนยันตัวตน 2 แบบ:

- **API key** — เข้าถึง Anthropic API โดยตรงพร้อมการคิดค่าบริการตามการใช้งาน (โมเดล `anthropic/*`)
- **Claude CLI** — ใช้การล็อกอิน Claude CLI ที่มีอยู่แล้วบนโฮสต์เดียวกันซ้ำ

<Warning>
ทีมงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw สามารถใช้ได้อีกครั้ง ดังนั้น
OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้งาน `claude -p` ได้รับอนุญาต เว้นแต่
Anthropic จะเผยแพร่นโยบายใหม่

สำหรับโฮสต์ Gateway ที่ทำงานระยะยาว Anthropic API key ยังคงเป็นเส้นทางที่ชัดเจนและ
คาดการณ์ได้มากที่สุดสำหรับการใช้งานจริง

เอกสารสาธารณะปัจจุบันของ Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="API key">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง API มาตรฐานและการคิดค่าบริการตามการใช้งาน

    <Steps>
      <Step title="รับ API key ของคุณ">
        สร้าง API key ใน [Anthropic Console](https://console.anthropic.com/)
      </Step>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        หรือส่ง key โดยตรง:

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

    ### ตัวอย่างคอนฟิก

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **เหมาะที่สุดสำหรับ:** ใช้การล็อกอิน Claude CLI ที่มีอยู่แล้วซ้ำโดยไม่ต้องมี API key แยก

    <Steps>
      <Step title="ตรวจสอบให้แน่ใจว่าติดตั้งและล็อกอิน Claude CLI แล้ว">
        ตรวจสอบด้วย:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw จะตรวจจับและใช้ข้อมูลรับรองของ Claude CLI ที่มีอยู่ซ้ำ
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
    หากคุณต้องการเส้นทางการคิดค่าบริการที่ชัดเจนที่สุด ให้ใช้ Anthropic API key แทน OpenClaw ยังรองรับตัวเลือกแบบสมัครสมาชิกจาก [OpenAI Codex](/th/providers/openai), [Qwen Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax) และ [Z.AI / GLM](/th/providers/glm) ด้วย
    </Tip>

  </Tab>
</Tabs>

## ค่าเริ่มต้นของ Thinking (Claude 4.6)

โมเดล Claude 4.6 จะใช้ thinking แบบ `adaptive` เป็นค่าเริ่มต้นใน OpenClaw เมื่อไม่ได้ตั้งค่าระดับ thinking แบบชัดเจน

แทนที่เป็นรายข้อความด้วย `/think:<level>` หรือในพารามิเตอร์ของโมเดล:

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

## Prompt caching

OpenClaw รองรับฟีเจอร์ prompt caching ของ Anthropic สำหรับการยืนยันตัวตนด้วย API key

| Value               | ระยะเวลาแคช | คำอธิบาย                                  |
| ------------------- | ----------- | ----------------------------------------- |
| `"short"` (ค่าเริ่มต้น) | 5 นาที       | ใช้อัตโนมัติสำหรับการยืนยันตัวตนด้วย API key |
| `"long"`            | 1 ชั่วโมง    | แคชแบบขยายเวลา                             |
| `"none"`            | ไม่มีแคช     | ปิดใช้งาน prompt caching                   |

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
  <Accordion title="การแทนที่แคชรายเอเจนต์">
    ใช้พารามิเตอร์ระดับโมเดลเป็น baseline แล้วแทนที่เอเจนต์เฉพาะผ่าน `agents.list[].params`:

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

    ลำดับการรวมคอนฟิก:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (ตาม `id` ที่ตรงกัน, แทนที่เป็นรายคีย์)

    วิธีนี้ช่วยให้เอเจนต์หนึ่งใช้แคชระยะยาวได้ ขณะที่อีกเอเจนต์หนึ่งบนโมเดลเดียวกันปิดการแคชสำหรับทราฟฟิกที่เป็นช่วงสั้น/นำกลับมาใช้ซ้ำน้อย

  </Accordion>

  <Accordion title="หมายเหตุเกี่ยวกับ Claude บน Bedrock">
    - โมเดล Anthropic Claude บน Bedrock (`amazon-bedrock/*anthropic.claude*`) รองรับการส่งผ่าน `cacheRetention` เมื่อกำหนดค่าไว้
    - โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับเป็น `cacheRetention: "none"` ระหว่างรันไทม์
    - ค่าเริ่มต้นอัจฉริยะแบบ API key จะตั้ง `cacheRetention: "short"` สำหรับ ref ของ Claude บน Bedrock ด้วยเมื่อไม่ได้ตั้งค่าแบบชัดเจน
  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมดเร็ว">
    ตัวสลับ `/fast` แบบใช้ร่วมกันของ OpenClaw รองรับทราฟฟิก Anthropic โดยตรง (ทั้ง API key และ OAuth ไปยัง `api.anthropic.com`)

    | Command | แมปเป็น |
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
    - จะถูกแทรกเฉพาะคำขอที่ส่งตรงไปยัง `api.anthropic.com` เท่านั้น เส้นทางผ่าน proxy จะปล่อย `service_tier` ไว้ไม่แก้ไข
    - พารามิเตอร์ `serviceTier` หรือ `service_tier` ที่ตั้งแบบชัดเจนจะมีลำดับความสำคัญเหนือ `/fast` เมื่อมีทั้งสองอย่าง
    - บนบัญชีที่ไม่มีความจุของ Priority Tier ค่า `service_tier: "auto"` อาจถูก resolve เป็น `standard`
    </Note>

  </Accordion>

  <Accordion title="ความสามารถในการเข้าใจสื่อ (ภาพและ PDF)">
    plugin Anthropic แบบ bundled จะลงทะเบียนความสามารถในการเข้าใจภาพและ PDF OpenClaw
    จะ resolve ความสามารถด้านสื่อโดยอัตโนมัติจากการยืนยันตัวตน Anthropic ที่กำหนดไว้ — ไม่ต้องมีคอนฟิกเพิ่มเติม

    | Property       | Value                |
    | -------------- | -------------------- |
    | โมเดลเริ่มต้น  | `claude-opus-4-6`    |
    | อินพุตที่รองรับ | รูปภาพ, เอกสาร PDF   |

    เมื่อมีการแนบรูปภาพหรือ PDF ไปยังบทสนทนา OpenClaw จะกำหนดเส้นทาง
    ผ่าน provider การเข้าใจสื่อของ Anthropic โดยอัตโนมัติ

  </Accordion>

  <Accordion title="หน้าต่างบริบท 1M (เบต้า)">
    หน้าต่างบริบท 1M ของ Anthropic ถูกจำกัดด้วยสถานะเบต้า ให้เปิดใช้งานเป็นรายโมเดล:

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

    OpenClaw จะแมปค่านี้เป็น `anthropic-beta: context-1m-2025-08-07` บนคำขอ

    <Warning>
    ต้องมีสิทธิ์เข้าถึงบริบทยาวบนข้อมูลรับรอง Anthropic ของคุณ การยืนยันตัวตนแบบ token รุ่นเก่า (`sk-ant-oat-*`) จะถูกปฏิเสธสำหรับคำขอบริบท 1M — OpenClaw จะบันทึกคำเตือนและ fallback ไปใช้หน้าต่างบริบทมาตรฐาน
    </Warning>

  </Accordion>

  <Accordion title="บริบท 1M ของ Claude Opus 4.7">
    `anthropic/claude-opus-4.7` และรุ่น `claude-cli` ของมันมีหน้าต่างบริบท 1M
    เป็นค่าเริ่มต้นอยู่แล้ว — ไม่ต้องใช้ `params.context1m: true`
  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ข้อผิดพลาด 401 / token ใช้งานไม่ได้กะทันหัน">
    การยืนยันตัวตนด้วย token ของ Anthropic อาจหมดอายุหรือถูกเพิกถอน สำหรับการตั้งค่าใหม่ ให้ย้ายไปใช้ Anthropic API key
  </Accordion>

  <Accordion title='ไม่พบ API key สำหรับ provider "anthropic"'>
    การยืนยันตัวตนเป็น **รายเอเจนต์** เอเจนต์ใหม่จะไม่รับคีย์ของเอเจนต์หลักโดยอัตโนมัติ ให้รัน onboarding ใหม่สำหรับเอเจนต์นั้น หรือกำหนดค่า API key บนโฮสต์ Gateway แล้วตรวจสอบด้วย `openclaw models status`
  </Accordion>

  <Accordion title='ไม่พบข้อมูลรับรองสำหรับโปรไฟล์ "anthropic:default"'>
    รัน `openclaw models status` เพื่อดูว่าโปรไฟล์ยืนยันตัวตนใดกำลังใช้งานอยู่ รัน onboarding ใหม่ หรือกำหนดค่า API key สำหรับ path ของโปรไฟล์นั้น
  </Accordion>

  <Accordion title="ไม่มีโปรไฟล์ยืนยันตัวตนที่พร้อมใช้งาน (ทั้งหมดอยู่ในช่วง cooldown)">
    ตรวจสอบ `openclaw models status --json` ที่ `auth.unusableProfiles` การ cooldown จาก rate limit ของ Anthropic อาจผูกกับโมเดล ดังนั้นโมเดล Anthropic อื่นที่อยู่ในกลุ่มเดียวกันอาจยังใช้งานได้ เพิ่มโปรไฟล์ Anthropic อีกตัวหรือรอให้ cooldown หมด
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [FAQ](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, ref ของโมเดล และพฤติกรรม failover
  </Card>
  <Card title="CLI Backends" href="/th/gateway/cli-backends" icon="terminal">
    การตั้งค่าและรายละเอียดรันไทม์ของแบ็กเอนด์ Claude CLI
  </Card>
  <Card title="Prompt caching" href="/th/reference/prompt-caching" icon="database">
    วิธีการทำงานของ prompt caching ข้าม provider
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดยืนยันตัวตนและกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
