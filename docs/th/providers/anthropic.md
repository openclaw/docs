---
read_when:
    - คุณต้องการใช้โมเดลของ Anthropic ใน OpenClaw
summary: ใช้ Anthropic Claude ผ่านคีย์ API หรือ Claude CLI ใน OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:45:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic สร้างตระกูลโมเดล **Claude** OpenClaw รองรับเส้นทางการยืนยันตัวตนสองแบบ:

- **คีย์ API** — เข้าถึง Anthropic API โดยตรงพร้อมการเรียกเก็บเงินตามการใช้งาน (โมเดล `anthropic/*`)
- **Claude CLI** — ใช้การเข้าสู่ระบบ Claude Code ที่มีอยู่แล้วบนโฮสต์เดียวกัน

<Warning>
แบ็กเอนด์ Claude CLI ของ OpenClaw เรียกใช้ Claude Code CLI ที่ติดตั้งไว้ใน
โหมดพิมพ์แบบไม่โต้ตอบ เอกสาร Claude Code ปัจจุบันของ Anthropic อธิบาย
`claude -p` ว่าเป็นการใช้งาน Agent SDK/แบบโปรแกรม อัปเดตฝ่ายสนับสนุนของ Anthropic วันที่ 15 มิถุนายน 2026
หยุดชั่วคราวการเปลี่ยนแปลงการเรียกเก็บเงิน Agent SDK ที่ประกาศไว้ก่อนหน้านี้ สำหรับตอนนี้ Anthropic ระบุว่า
การใช้งาน Claude Agent SDK, `claude -p` และแอปของบุคคลที่สามยังคงใช้จาก
ขีดจำกัดการใช้งานของแผนสมัครสมาชิก เครดิต Agent SDK รายเดือนที่ประกาศไว้ก่อนหน้านี้
ยังไม่พร้อมใช้งานระหว่างที่ Anthropic ปรับแผนนั้นใหม่

Claude Code แบบโต้ตอบยังคงใช้จากขีดจำกัดของแผน Claude ที่ลงชื่อเข้าใช้อยู่ การยืนยันตัวตนด้วยคีย์ API
ยังคงเป็นการเรียกเก็บเงิน API แบบจ่ายตามการใช้งานโดยตรง สำหรับโฮสต์ Gateway ที่ทำงานยาวนาน
ระบบอัตโนมัติที่ใช้ร่วมกัน และค่าใช้จ่ายการผลิตที่คาดการณ์ได้ ให้ใช้คีย์ Anthropic API

ตรวจสอบบทความสนับสนุนปัจจุบันของ Anthropic ก่อนพึ่งพาพฤติกรรม
การเรียกเก็บเงินของแผนสมัครสมาชิก:

- [เอกสารอ้างอิง Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [ใช้ Claude Agent SDK กับแผน Claude ของคุณ](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [ใช้ Claude Code กับแผน Pro หรือ Max ของคุณ](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [ใช้ Claude Code กับแผน Team หรือ Enterprise ของคุณ](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [จัดการค่าใช้จ่าย Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="API key">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง API มาตรฐานและการเรียกเก็บเงินตามการใช้งาน

    <Steps>
      <Step title="Get your API key">
        สร้างคีย์ API ใน [Anthropic Console](https://console.anthropic.com/)
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        หรือส่งคีย์โดยตรง:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
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
    **เหมาะที่สุดสำหรับ:** การใช้การเข้าสู่ระบบ Claude CLI ที่มีอยู่แล้วโดยไม่ต้องมีคีย์ API แยกต่างหาก

    <Steps>
      <Step title="Ensure Claude CLI is installed and logged in">
        ตรวจสอบด้วย:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw ตรวจพบและใช้ข้อมูลประจำตัว Claude CLI ที่มีอยู่แล้ว
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    รายละเอียดการตั้งค่าและรันไทม์สำหรับแบ็กเอนด์ Claude CLI อยู่ใน [แบ็กเอนด์ CLI](/th/gateway/cli-backends)
    </Note>

    <Warning>
    การใช้ Claude CLI ซ้ำคาดหวังให้กระบวนการ OpenClaw ทำงานบนโฮสต์เดียวกับ
    การเข้าสู่ระบบ Claude CLI การติดตั้ง Docker สามารถเก็บโฮมของคอนเทนเนอร์ถาวรและเข้าสู่ระบบ
    Claude Code ที่นั่นได้ ดู
    [แบ็กเอนด์ Claude CLI ใน Docker](/th/install/docker#claude-cli-backend-in-docker)
    การติดตั้งคอนเทนเนอร์อื่น เช่น [Podman](/th/install/podman) จะไม่เมานต์ `~/.claude` ของโฮสต์
    เข้าในการตั้งค่าหรือรันไทม์ ให้ใช้คีย์ Anthropic API ที่นั่น หรือเลือก
    ผู้ให้บริการที่มี OAuth ซึ่ง OpenClaw จัดการ เช่น
    [OpenAI Codex](/th/providers/openai)
    </Warning>

    ### ตัวอย่างการกำหนดค่า

    แนะนำให้ใช้การอ้างอิงโมเดล Anthropic แบบมาตรฐานร่วมกับการแทนที่รันไทม์ CLI:

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

    การอ้างอิงโมเดล `claude-cli/claude-opus-4-7` แบบเดิมยังคงทำงานเพื่อ
    ความเข้ากันได้ แต่การกำหนดค่าใหม่ควรเก็บการเลือกผู้ให้บริการ/โมเดลเป็น
    `anthropic/*` และวางแบ็กเอนด์การดำเนินการไว้ในนโยบายรันไทม์ของผู้ให้บริการ/โมเดล

    ### การเรียกเก็บเงินและ `claude -p`

    OpenClaw ใช้เส้นทาง `claude -p` แบบไม่โต้ตอบของ Claude Code สำหรับการรัน Claude CLI
    ปัจจุบัน Anthropic ถือว่าเส้นทางนั้นเป็นการใช้งาน Agent SDK/แบบโปรแกรม:

    - อัปเดตฝ่ายสนับสนุนของ Anthropic วันที่ 15 มิถุนายน 2026 หยุดชั่วคราวแผน
      เครดิต Agent SDK แยกต่างหากที่ประกาศไว้ก่อนหน้านี้
    - สำหรับตอนนี้ การใช้งาน Claude Agent SDK, `claude -p` และแอปของบุคคลที่สาม
      ภายใต้แผนสมัครสมาชิกยังคงใช้จากขีดจำกัดการใช้งานของแผนสมัครสมาชิกที่ลงชื่อเข้าใช้อยู่
    - เครดิต Agent SDK รายเดือนที่ประกาศไว้ก่อนหน้านี้ยังไม่พร้อมใช้งานระหว่างที่
      Anthropic ปรับแผนนั้นใหม่
    - การเข้าสู่ระบบ Console/คีย์ API ใช้การเรียกเก็บเงิน API แบบจ่ายตามการใช้งานและไม่ได้รับ
      เครดิต Agent SDK ของแผนสมัครสมาชิก

    ดู [บทความแผน Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    ของ Anthropic สำหรับประกาศหยุดชั่วคราว และบทความแผน Claude Code สำหรับพฤติกรรม
    แผนสมัครสมาชิก
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    และ
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)

    Anthropic สามารถเปลี่ยนพฤติกรรมการเรียกเก็บเงินและการจำกัดอัตราของ Claude Code ได้โดยไม่ต้องมี
    รุ่นเผยแพร่ของ OpenClaw ตรวจสอบ `claude auth status`, `/status` และ
    เอกสารที่ลิงก์ของ Anthropic เมื่อความคาดการณ์ได้ของการเรียกเก็บเงินเป็นเรื่องสำคัญ

    <Tip>
    สำหรับระบบอัตโนมัติการผลิตที่ใช้ร่วมกัน ให้ใช้คีย์ Anthropic API แทน
    Claude CLI OpenClaw ยังรองรับตัวเลือกแบบแผนสมัครสมาชิกจาก
    [OpenAI Codex](/th/providers/openai), [Qwen Cloud](/th/providers/qwen),
    [MiniMax](/th/providers/minimax) และ [Z.AI / GLM](/th/providers/zai)
    </Tip>

  </Tab>
</Tabs>

## ค่าเริ่มต้นการคิด (Claude Fable 5, 4.8 และ 4.6)

`anthropic/claude-fable-5` ใช้การคิดแบบปรับได้เสมอและตั้งค่าเริ่มต้นเป็นความพยายาม `high`
เนื่องจาก Anthropic ไม่อนุญาตให้ปิดการคิดสำหรับโมเดลนี้
`/think off` และ `/think minimal` จึงใช้ความพยายาม `low` OpenClaw ยังละเว้นค่า
temperature แบบกำหนดเองสำหรับคำขอ Fable 5 ด้วย

Claude Opus 4.8 จะปิดการคิดเป็นค่าเริ่มต้นใน OpenClaw เมื่อคุณเปิดใช้การคิดแบบปรับได้อย่างชัดเจนด้วย `/think high|xhigh|max` OpenClaw จะส่งค่าความพยายาม Opus 4.8 ของ Anthropic โมเดล Claude 4.6 ตั้งค่าเริ่มต้นเป็น `adaptive`

แทนที่เป็นรายข้อความด้วย `/think:<level>` หรือในพารามิเตอร์โมเดล:

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
- [การคิดแบบปรับได้](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [การคิดแบบขยาย](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## การแคชพรอมป์

OpenClaw รองรับฟีเจอร์การแคชพรอมป์ของ Anthropic สำหรับการยืนยันตัวตนด้วยคีย์ API

| ค่า                 | ระยะเวลาแคช | คำอธิบาย                                  |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (ค่าเริ่มต้น) | 5 นาที        | ใช้อัตโนมัติสำหรับการยืนยันตัวตนด้วยคีย์ API |
| `"long"`            | 1 ชั่วโมง      | แคชแบบขยาย                              |
| `"none"`            | ไม่มีการแคช    | ปิดการแคชพรอมป์                         |

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

    ลำดับการรวมการกำหนดค่า:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (`id` ที่ตรงกัน แทนที่ตามคีย์)

    สิ่งนี้ช่วยให้เอเจนต์หนึ่งเก็บแคชที่มีอายุยาวได้ ขณะที่อีกเอเจนต์บนโมเดลเดียวกันปิดการแคชสำหรับทราฟฟิกที่มาเป็นช่วงสั้น ๆ/มีการใช้ซ้ำน้อย

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - โมเดล Anthropic Claude บน Bedrock (`amazon-bedrock/*anthropic.claude*`) ยอมรับการส่งผ่าน `cacheRetention` เมื่อกำหนดค่าไว้
    - โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับให้เป็น `cacheRetention: "none"` ที่รันไทม์
    - ค่าเริ่มต้นอัจฉริยะของคีย์ API ยังตั้งค่าเริ่มต้น `cacheRetention: "short"` สำหรับการอ้างอิง Claude-on-Bedrock เมื่อไม่มีค่าที่ตั้งไว้อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Fast mode">
    สวิตช์ `/fast` ที่ใช้ร่วมกันของ OpenClaw รองรับทราฟฟิก Anthropic โดยตรง (คีย์ API และ OAuth ไปยัง `api.anthropic.com`)

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
    - ฉีดเข้าไปเฉพาะสำหรับคำขอ `api.anthropic.com` โดยตรง เส้นทางพร็อกซีจะปล่อย `service_tier` ไว้เหมือนเดิม
    - พารามิเตอร์ `serviceTier` หรือ `service_tier` ที่กำหนดอย่างชัดเจนจะแทนที่ `/fast` เมื่อตั้งค่าทั้งคู่
    - ในบัญชีที่ไม่มีความจุ Priority Tier, `service_tier: "auto"` อาจถูกแปลงเป็น `standard`

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    Anthropic Plugin ที่รวมมาด้วยลงทะเบียนความเข้าใจรูปภาพและ PDF OpenClaw
    แก้ไขความสามารถด้านสื่อโดยอัตโนมัติจากการยืนยันตัวตน Anthropic ที่กำหนดค่าไว้ โดยไม่ต้องมี
    การกำหนดค่าเพิ่มเติม

    | คุณสมบัติ        | ค่า                   |
    | --------------- | --------------------- |
    | โมเดลเริ่มต้น   | `claude-opus-4-8`     |
    | อินพุตที่รองรับ | รูปภาพ, เอกสาร PDF   |

    เมื่อแนบรูปภาพหรือ PDF เข้ากับการสนทนา OpenClaw จะกำหนดเส้นทางผ่าน
    ผู้ให้บริการความเข้าใจสื่อของ Anthropic โดยอัตโนมัติ

  </Accordion>

  <Accordion title="1M context window">
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

    การกำหนดค่าเก่ายังคงใช้ `params.context1m: true` ได้ แต่ OpenClaw จะไม่ส่ง
    เฮดเดอร์เบตา `context-1m-2025-08-07` ที่เลิกใช้แล้วอีกต่อไป รายการการกำหนดค่า `anthropicBeta` แบบเก่า
    ที่มีค่านั้นจะถูกละเว้นระหว่างการแก้ไขเฮดเดอร์คำขอ และ
    โมเดล Claude รุ่นเก่าที่ไม่รองรับจะยังคงใช้หน้าต่างบริบทปกติของตน

    `params.context1m: true` ยังใช้กับแบ็กเอนด์ Claude CLI
    (`claude-cli/*`) สำหรับโมเดล Opus และ Sonnet ที่รองรับ GA และมีสิทธิ์ใช้งาน เพื่อคง
    หน้าต่างบริบทรันไทม์สำหรับเซสชัน CLI เหล่านั้นให้ตรงกับพฤติกรรม
    direct-API

    <Warning>
    ต้องมีสิทธิ์เข้าถึงบริบทยาวบนข้อมูลประจำตัว Anthropic ของคุณ การยืนยันตัวตนด้วยโทเค็น OAuth/แผนสมัครสมาชิกยังคงรักษาเฮดเดอร์เบตา Anthropic ที่จำเป็นไว้ แต่ OpenClaw จะลบเฮดเดอร์เบตา 1M ที่เลิกใช้แล้วหากยังคงอยู่ในการกำหนดค่าเก่า
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 บริบท 1M">
    `anthropic/claude-opus-4-8` และตัวแปร `claude-cli` มีหน้าต่างบริบท
    1M เป็นค่าเริ่มต้น — ไม่จำเป็นต้องใช้ `params.context1m: true`
  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ข้อผิดพลาด 401 / token ใช้ไม่ได้กะทันหัน">
    การยืนยันตัวตนด้วย token ของ Anthropic หมดอายุได้และอาจถูกเพิกถอนได้ สำหรับการตั้งค่าใหม่ ให้ใช้คีย์ API ของ Anthropic แทน
  </Accordion>

  <Accordion title='ไม่พบคีย์ API สำหรับ provider "anthropic"'>
    การยืนยันตัวตนของ Anthropic เป็นแบบ **ต่อ agent** — agent ใหม่จะไม่สืบทอดคีย์ของ agent หลัก ให้รัน onboarding สำหรับ agent นั้นอีกครั้ง (หรือกำหนดค่าคีย์ API บนโฮสต์ Gateway) จากนั้นตรวจสอบด้วย `openclaw models status`
  </Accordion>

  <Accordion title='ไม่พบข้อมูลประจำตัวสำหรับโปรไฟล์ "anthropic:default"'>
    รัน `openclaw models status` เพื่อดูว่าโปรไฟล์การยืนยันตัวตนใดกำลังใช้งานอยู่ ให้รัน onboarding อีกครั้ง หรือกำหนดค่าคีย์ API สำหรับเส้นทางโปรไฟล์นั้น
  </Accordion>

  <Accordion title="ไม่มีโปรไฟล์การยืนยันตัวตนที่พร้อมใช้งาน (ทั้งหมดอยู่ในคูลดาวน์)">
    ตรวจสอบ `openclaw models status --json` สำหรับ `auth.unusableProfiles` คูลดาวน์จาก rate limit ของ Anthropic อาจจำกัดตามโมเดล ดังนั้นโมเดล Anthropic ที่เป็น sibling อาจยังใช้งานได้ เพิ่มโปรไฟล์ Anthropic อีกโปรไฟล์หนึ่งหรือรอให้คูลดาวน์สิ้นสุด
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="แบ็กเอนด์ CLI" href="/th/gateway/cli-backends" icon="terminal">
    รายละเอียดการตั้งค่าและ runtime ของแบ็กเอนด์ Claude CLI
  </Card>
  <Card title="Prompt caching" href="/th/reference/prompt-caching" icon="database">
    วิธีที่ prompt caching ทำงานข้าม provider
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการนำข้อมูลประจำตัวกลับมาใช้
  </Card>
</CardGroup>
