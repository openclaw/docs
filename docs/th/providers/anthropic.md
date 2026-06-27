---
read_when:
    - คุณต้องการใช้โมเดล Anthropic ใน OpenClaw
summary: ใช้ Anthropic Claude ผ่านคีย์ API หรือ Claude CLI ใน OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-27T18:10:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic สร้างตระกูลโมเดล **Claude** OpenClaw รองรับเส้นทางการยืนยันตัวตนสองแบบ:

- **คีย์ API** — เข้าถึง Anthropic API โดยตรงพร้อมการเรียกเก็บเงินตามการใช้งาน (โมเดล `anthropic/*`)
- **Claude CLI** — ใช้การเข้าสู่ระบบ Claude Code ที่มีอยู่บนโฮสต์เดียวกันซ้ำ

<Warning>
แบ็กเอนด์ Claude CLI ของ OpenClaw รัน Claude Code CLI ที่ติดตั้งไว้ใน
โหมดพิมพ์แบบไม่โต้ตอบ เอกสาร Claude Code ปัจจุบันของ Anthropic อธิบาย
`claude -p` ว่าเป็นการใช้งาน Agent SDK/แบบโปรแกรม ตั้งแต่วันที่ 15 มิถุนายน 2026 เป็นต้นไป Anthropic
ระบุว่าการใช้งาน `claude -p` ในแผนแบบสมัครสมาชิกจะไม่หักจากขีดจำกัดแผน Claude
ปกติอีกต่อไป แต่จะหักจากเครดิต Agent SDK รายเดือนแยกต่างหากก่อน จากนั้นจึงหักจาก
เครดิตการใช้งานตามอัตรา API มาตรฐานเมื่อเปิดใช้เครดิตเหล่านั้น

Claude Code แบบโต้ตอบยังคงหักจากขีดจำกัดแผน Claude ที่เข้าสู่ระบบไว้ การยืนยันตัวตนด้วยคีย์ API
ยังคงเป็นการเรียกเก็บเงิน API แบบจ่ายตามการใช้งานโดยตรง สำหรับโฮสต์ Gateway ที่ใช้งานระยะยาว
ระบบอัตโนมัติที่ใช้ร่วมกัน และค่าใช้จ่ายการผลิตที่คาดการณ์ได้ ให้ใช้คีย์ Anthropic API

เอกสารสาธารณะปัจจุบันของ Anthropic:

- [ข้อมูลอ้างอิง Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [ใช้ Claude Agent SDK กับแผน Claude ของคุณ](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [ใช้ Claude Code กับแผน Pro หรือ Max ของคุณ](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [ใช้ Claude Code กับแผน Team หรือ Enterprise ของคุณ](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [จัดการค่าใช้จ่าย Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="คีย์ API">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง API มาตรฐานและการเรียกเก็บเงินตามการใช้งาน

    <Steps>
      <Step title="รับคีย์ API ของคุณ">
        สร้างคีย์ API ใน [Anthropic Console](https://console.anthropic.com/)
      </Step>
      <Step title="รันการเริ่มต้นใช้งาน">
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
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
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
      <Step title="รันการเริ่มต้นใช้งาน">
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

    <Warning>
    การใช้ Claude CLI ซ้ำคาดหวังให้กระบวนการ OpenClaw รันบนโฮสต์เดียวกับ
    การเข้าสู่ระบบ Claude CLI การติดตั้ง Docker สามารถคงโฮมของคอนเทนเนอร์ไว้และเข้าสู่ระบบ
    Claude Code ที่นั่นได้; ดู
    [แบ็กเอนด์ Claude CLI ใน Docker](/th/install/docker#claude-cli-backend-in-docker)
    การติดตั้งคอนเทนเนอร์อื่น เช่น [Podman](/th/install/podman) จะไม่เมานต์
    `~/.claude` ของโฮสต์เข้าไปในการตั้งค่าหรือรันไทม์; ให้ใช้คีย์ Anthropic API ที่นั่น หรือเลือก
    ผู้ให้บริการที่มี OAuth ซึ่ง OpenClaw จัดการ เช่น
    [OpenAI Codex](/th/providers/openai)
    </Warning>

    ### ตัวอย่างการกำหนดค่า

    แนะนำให้ใช้การอ้างอิงโมเดล Anthropic แบบมาตรฐานพร้อมการแทนที่รันไทม์ CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    การอ้างอิงโมเดลแบบเดิม `claude-cli/claude-opus-4-7` ยังใช้ได้เพื่อ
    ความเข้ากันได้ แต่การกำหนดค่าใหม่ควรเก็บการเลือกผู้ให้บริการ/โมเดลเป็น
    `anthropic/*` และใส่แบ็กเอนด์การดำเนินการไว้ในนโยบายรันไทม์ของผู้ให้บริการ/โมเดล

    ### การเรียกเก็บเงินและ `claude -p`

    OpenClaw ใช้เส้นทาง `claude -p` แบบไม่โต้ตอบของ Claude Code สำหรับการรัน Claude CLI
    ปัจจุบัน Anthropic ถือว่าเส้นทางนั้นเป็นการใช้งาน Agent SDK/แบบโปรแกรม:

    - จนถึงวันที่ 15 มิถุนายน 2026 การจัดการแผนแบบสมัครสมาชิกจะเป็นไปตามกฎ
      Claude Code ที่ใช้งานอยู่ของ Anthropic สำหรับบัญชีที่เข้าสู่ระบบ
    - ตั้งแต่วันที่ 15 มิถุนายน 2026 เป็นต้นไป การใช้งาน `claude -p` ในแผนแบบสมัครสมาชิกจะหักจาก
      เครดิต Agent SDK รายเดือนของผู้ใช้ก่อน จากนั้นจึงหักจากเครดิตการใช้งานตามอัตรา
      API มาตรฐานหากเปิดใช้เครดิตการใช้งาน
    - การเข้าสู่ระบบผ่าน Console/คีย์ API ใช้การเรียกเก็บเงิน API แบบจ่ายตามการใช้งานและไม่ได้รับ
      เครดิต Agent SDK ของแผนสมัครสมาชิก

    Anthropic สามารถเปลี่ยนพฤติกรรมการเรียกเก็บเงินและการจำกัดอัตราของ Claude Code ได้โดยไม่ต้องมี
    การเผยแพร่ OpenClaw ตรวจสอบ `claude auth status`, `/status` และ
    เอกสาร Anthropic ที่ลิงก์ไว้เมื่อความคาดการณ์ได้ของการเรียกเก็บเงินเป็นเรื่องสำคัญ

    <Tip>
    สำหรับระบบอัตโนมัติการผลิตที่ใช้ร่วมกัน ให้ใช้คีย์ Anthropic API แทน
    Claude CLI OpenClaw ยังรองรับตัวเลือกสไตล์สมัครสมาชิกจาก
    [OpenAI Codex](/th/providers/openai), [Qwen Cloud](/th/providers/qwen),
    [MiniMax](/th/providers/minimax) และ [Z.AI / GLM](/th/providers/zai)
    </Tip>

  </Tab>
</Tabs>

## ค่าเริ่มต้นของการคิด (Claude Fable 5, 4.8 และ 4.6)

`anthropic/claude-fable-5` ใช้การคิดแบบปรับตัวเสมอและมีค่าเริ่มต้นเป็นความพยายามระดับ `high`
เนื่องจาก Anthropic ไม่อนุญาตให้ปิดการคิดสำหรับโมเดลนี้
`/think off` และ `/think minimal` จึงใช้ความพยายามระดับ `low` OpenClaw ยังละเว้นค่า
temperature แบบกำหนดเองสำหรับคำขอ Fable 5 ด้วย

Claude Opus 4.8 ปิดการคิดไว้เป็นค่าเริ่มต้นใน OpenClaw เมื่อคุณเปิดใช้การคิดแบบปรับตัวอย่างชัดเจนด้วย `/think high|xhigh|max` OpenClaw จะส่งค่าความพยายาม Opus 4.8 ของ Anthropic; โมเดล Claude 4.6 มีค่าเริ่มต้นเป็น `adaptive`

แทนที่ต่อข้อความด้วย `/think:<level>` หรือในพารามิเตอร์โมเดล:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
เอกสาร Anthropic ที่เกี่ยวข้อง:
- [การคิดแบบปรับตัว](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [การคิดแบบขยาย](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## การแคชพรอมป์

OpenClaw รองรับฟีเจอร์การแคชพรอมป์ของ Anthropic สำหรับการรับรองความถูกต้องด้วย API key

| ค่า                  | ระยะเวลาแคช | คำอธิบาย                                      |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (ค่าเริ่มต้น) | 5 นาที         | ใช้โดยอัตโนมัติสำหรับการรับรองความถูกต้องด้วย API key |
| `"long"`            | 1 ชั่วโมง      | แคชแบบขยาย                               |
| `"none"`            | ไม่มีการแคช    | ปิดใช้งานการแคชพรอมป์                    |

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
    2. `agents.list[].params` (`id` ที่ตรงกัน แทนที่ตามคีย์)

    วิธีนี้ทำให้เอเจนต์หนึ่งคงแคชอายุยาวไว้ได้ ขณะที่อีกเอเจนต์บนโมเดลเดียวกันปิดการแคชสำหรับทราฟฟิกแบบพุ่งเป็นช่วงหรือมีการใช้ซ้ำน้อย

  </Accordion>

  <Accordion title="หมายเหตุ Bedrock Claude">
    - โมเดล Anthropic Claude บน Bedrock (`amazon-bedrock/*anthropic.claude*`) รับการส่งผ่าน `cacheRetention` เมื่อกำหนดค่าไว้
    - โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับเป็น `cacheRetention: "none"` ขณะรันไทม์
    - ค่าเริ่มต้นอัจฉริยะของ API key ยังตั้งค่าเริ่มต้น `cacheRetention: "short"` สำหรับ refs Claude-on-Bedrock เมื่อไม่ได้ตั้งค่าไว้อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมดเร็ว">
    ตัวสลับ `/fast` แบบใช้ร่วมกันของ OpenClaw รองรับทราฟฟิก Anthropic โดยตรง (API key และ OAuth ไปยัง `api.anthropic.com`)

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
    - ฉีดเข้าไปเฉพาะคำขอโดยตรงไปยัง `api.anthropic.com` เท่านั้น เส้นทางพร็อกซีจะปล่อย `service_tier` ไว้ตามเดิม
    - พารามิเตอร์ `serviceTier` หรือ `service_tier` ที่ตั้งไว้อย่างชัดเจนจะแทนที่ `/fast` เมื่อมีการตั้งค่าทั้งคู่
    - สำหรับบัญชีที่ไม่มีความจุ Priority Tier, `service_tier: "auto"` อาจถูกแปลงเป็น `standard`

    </Note>

  </Accordion>

  <Accordion title="การทำความเข้าใจสื่อ (รูปภาพและ PDF)">
    Plugin Anthropic ที่รวมมาในตัวลงทะเบียนความสามารถในการทำความเข้าใจรูปภาพและ PDF OpenClaw
    จะแก้ไขความสามารถด้านสื่อโดยอัตโนมัติจากการรับรองความถูกต้อง Anthropic ที่กำหนดค่าไว้ โดยไม่ต้องมี
    การกำหนดค่าเพิ่มเติม

    | คุณสมบัติ        | ค่า                 |
    | --------------- | --------------------- |
    | โมเดลเริ่มต้น   | `claude-opus-4-8`     |
    | อินพุตที่รองรับ | รูปภาพ, เอกสาร PDF |

    เมื่อแนบรูปภาพหรือ PDF กับการสนทนา OpenClaw จะกำหนดเส้นทางผ่านผู้ให้บริการทำความเข้าใจสื่อของ Anthropic โดยอัตโนมัติ

  </Accordion>

  <Accordion title="หน้าต่างบริบท 1M">
    หน้าต่างบริบท 1M ของ Anthropic พร้อมใช้งานบนโมเดล Claude 4.x ที่รองรับ GA
    เช่น Opus 4.8, Opus 4.7, Opus 4.6 และ Sonnet 4.6 OpenClaw กำหนดขนาดโมเดลเหล่านั้นเป็น
    1M โดยอัตโนมัติ:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    การกำหนดค่ารุ่นเก่ายังคงใช้ `params.context1m: true` ได้ แต่ OpenClaw จะไม่ส่ง
    header เบต้า `context-1m-2025-08-07` ที่เลิกใช้แล้วอีกต่อไป รายการกำหนดค่า `anthropicBeta` รุ่นเก่า
    ที่มีค่านั้นจะถูกละเว้นระหว่างการแก้ไข header ของคำขอ และ
    โมเดล Claude รุ่นเก่าที่ไม่รองรับจะยังคงใช้หน้าต่างบริบทปกติของตน

    `params.context1m: true` ยังใช้กับแบ็กเอนด์ Claude CLI
    (`claude-cli/*`) สำหรับโมเดล Opus และ Sonnet ที่รองรับ GA และเข้าเกณฑ์ โดยคง
    หน้าต่างบริบทขณะรันไทม์สำหรับเซสชัน CLI เหล่านั้นให้ตรงกับพฤติกรรมของ direct API

    <Warning>
    ต้องมีสิทธิ์เข้าถึง long-context บนข้อมูลรับรอง Anthropic ของคุณ การรับรองความถูกต้องด้วยโทเค็น OAuth/subscription จะคง header เบต้า Anthropic ที่จำเป็นไว้ แต่ OpenClaw จะตัด header เบต้า 1M ที่เลิกใช้แล้วออกหากยังเหลืออยู่ในการกำหนดค่ารุ่นเก่า
    </Warning>

  </Accordion>

  <Accordion title="บริบท 1M ของ Claude Opus 4.8">
    `anthropic/claude-opus-4-8` และตัวแปร `claude-cli` ของมันมีหน้าต่างบริบท 1M
    เป็นค่าเริ่มต้น โดยไม่ต้องใช้ `params.context1m: true`
  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ข้อผิดพลาด 401 / โทเค็นใช้ไม่ได้อย่างกะทันหัน">
    การรับรองความถูกต้องด้วยโทเค็น Anthropic หมดอายุได้และอาจถูกเพิกถอนได้ สำหรับการตั้งค่าใหม่ ให้ใช้ API key ของ Anthropic แทน
  </Accordion>

  <Accordion title='ไม่พบ API key สำหรับผู้ให้บริการ "anthropic"'>
    การยืนยันตัวตนของ Anthropic เป็นแบบ **ต่อเอเจนต์** — เอเจนต์ใหม่จะไม่สืบทอดคีย์ของเอเจนต์หลัก ให้เรียกใช้การเริ่มต้นใช้งานใหม่สำหรับเอเจนต์นั้น (หรือกำหนดค่า API key บนโฮสต์ Gateway) แล้วตรวจสอบด้วย `openclaw models status`
  </Accordion>

  <Accordion title='ไม่พบข้อมูลประจำตัวสำหรับโปรไฟล์ "anthropic:default"'>
    เรียกใช้ `openclaw models status` เพื่อดูว่าโปรไฟล์การยืนยันตัวตนใดกำลังใช้งานอยู่ ให้เรียกใช้การเริ่มต้นใช้งานใหม่ หรือกำหนดค่า API key สำหรับพาธโปรไฟล์นั้น
  </Accordion>

  <Accordion title="ไม่มีโปรไฟล์การยืนยันตัวตนที่ใช้งานได้ (ทั้งหมดอยู่ในช่วงพักรอ)">
    ตรวจสอบ `openclaw models status --json` สำหรับ `auth.unusableProfiles` ช่วงพักรอจากการจำกัดอัตราของ Anthropic อาจผูกกับโมเดลเฉพาะ ดังนั้นโมเดล Anthropic อื่นในกลุ่มเดียวกันอาจยังใช้งานได้ เพิ่มโปรไฟล์ Anthropic อีกโปรไฟล์หนึ่ง หรือรอให้ช่วงพักรอสิ้นสุด
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับสำรองเมื่อขัดข้อง
  </Card>
  <Card title="แบ็กเอนด์ CLI" href="/th/gateway/cli-backends" icon="terminal">
    การตั้งค่าแบ็กเอนด์ Claude CLI และรายละเอียดขณะรัน
  </Card>
  <Card title="การแคชพรอมป์" href="/th/reference/prompt-caching" icon="database">
    วิธีที่การแคชพรอมป์ทำงานข้ามผู้ให้บริการ
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลประจำตัวซ้ำ
  </Card>
</CardGroup>
