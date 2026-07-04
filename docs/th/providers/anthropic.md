---
read_when:
    - คุณต้องการใช้โมเดล Anthropic ใน OpenClaw
summary: ใช้ Anthropic Claude ผ่านคีย์ API หรือ Claude CLI ใน OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:43:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic สร้างตระกูลโมเดล **Claude** OpenClaw รองรับเส้นทางการยืนยันตัวตนสองแบบ:

- **คีย์ API** — เข้าถึง Anthropic API โดยตรงพร้อมการคิดค่าบริการตามการใช้งาน (โมเดล `anthropic/*`)
- **Claude CLI** — ใช้การเข้าสู่ระบบ Claude Code ที่มีอยู่บนโฮสต์เดียวกันซ้ำ

<Warning>
แบ็กเอนด์ Claude CLI ของ OpenClaw เรียกใช้ Claude Code CLI ที่ติดตั้งไว้ใน
โหมดพิมพ์แบบไม่โต้ตอบ เอกสาร Claude Code ปัจจุบันของ Anthropic อธิบาย
`claude -p` ว่าเป็นการใช้งาน Agent SDK/แบบโปรแกรม อัปเดตฝ่ายสนับสนุนวันที่ 15 มิถุนายน 2026 ของ Anthropic
ได้หยุดพักการเปลี่ยนแปลงการคิดค่าบริการ Agent SDK ที่ประกาศไว้ ในตอนนี้ Anthropic ระบุว่า
Claude Agent SDK, `claude -p` และการใช้งานแอปของบุคคลที่สามยังคงหักจาก
ขีดจำกัดการใช้งานของการสมัครสมาชิก เครดิต Agent SDK รายเดือนที่เคยประกาศไว้
ยังไม่พร้อมใช้งานขณะที่ Anthropic กำลังปรับแผนนั้น

Claude Code แบบโต้ตอบยังคงหักจากขีดจำกัดของแผน Claude ที่เข้าสู่ระบบไว้ การยืนยันตัวตนด้วย
คีย์ API ยังคงเป็นการคิดค่าบริการ API แบบจ่ายตามการใช้งานโดยตรง สำหรับโฮสต์ Gateway ที่ใช้งานระยะยาว
ระบบอัตโนมัติที่ใช้ร่วมกัน และค่าใช้จ่ายการผลิตที่คาดการณ์ได้ ให้ใช้คีย์ Anthropic API

ตรวจสอบบทความสนับสนุนปัจจุบันของ Anthropic ก่อนพึ่งพาพฤติกรรม
การคิดค่าบริการของการสมัครสมาชิก:

- [ข้อมูลอ้างอิง Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [ใช้ Claude Agent SDK กับแผน Claude ของคุณ](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [ใช้ Claude Code กับแผน Pro หรือ Max ของคุณ](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [ใช้ Claude Code กับแผน Team หรือ Enterprise ของคุณ](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [จัดการค่าใช้จ่าย Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="คีย์ API">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง API มาตรฐานและการคิดค่าบริการตามการใช้งาน

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
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **เหมาะที่สุดสำหรับ:** การใช้การเข้าสู่ระบบ Claude CLI ที่มีอยู่ซ้ำโดยไม่ต้องใช้คีย์ API แยกต่างหาก

    <Steps>
      <Step title="ตรวจสอบให้แน่ใจว่า Claude CLI ติดตั้งและเข้าสู่ระบบแล้ว">
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

        OpenClaw ตรวจพบและใช้ข้อมูลประจำตัว Claude CLI ที่มีอยู่ซ้ำ
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
    การใช้ Claude CLI ซ้ำคาดว่ากระบวนการ OpenClaw จะรันบนโฮสต์เดียวกับการเข้าสู่ระบบ
    Claude CLI การติดตั้ง Docker สามารถคงโฮมของคอนเทนเนอร์ไว้และเข้าสู่ระบบ
    Claude Code ที่นั่นได้ ดู
    [แบ็กเอนด์ Claude CLI ใน Docker](/th/install/docker#claude-cli-backend-in-docker)
    การติดตั้งคอนเทนเนอร์อื่น เช่น [Podman](/th/install/podman) จะไม่เมานต์
    `~/.claude` ของโฮสต์เข้าไปในการตั้งค่าหรือรันไทม์ ให้ใช้คีย์ Anthropic API ที่นั่น หรือเลือก
    ผู้ให้บริการที่มี OAuth ที่ OpenClaw จัดการ เช่น
    [OpenAI Codex](/th/providers/openai)
    </Warning>

    ### ตัวอย่างการกำหนดค่า

    แนะนำให้ใช้การอ้างอิงโมเดล Anthropic แบบ canonical พร้อมการแทนที่รันไทม์ CLI:

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

    การอ้างอิงโมเดลเดิม `claude-cli/claude-opus-4-7` ยังใช้ได้เพื่อ
    ความเข้ากันได้ แต่การกำหนดค่าใหม่ควรเก็บการเลือกผู้ให้บริการ/โมเดลไว้เป็น
    `anthropic/*` และวางแบ็กเอนด์การดำเนินการไว้ในนโยบายรันไทม์ของผู้ให้บริการ/โมเดล

    ### การคิดค่าบริการและ `claude -p`

    OpenClaw ใช้เส้นทาง `claude -p` แบบไม่โต้ตอบของ Claude Code สำหรับการรัน Claude CLI
    ปัจจุบัน Anthropic ปฏิบัติต่อเส้นทางนั้นเป็นการใช้งาน Agent SDK/แบบโปรแกรม:

    - อัปเดตฝ่ายสนับสนุนวันที่ 15 มิถุนายน 2026 ของ Anthropic หยุดพักแผนเครดิต
      Agent SDK แยกต่างหากที่เคยประกาศไว้
    - ในตอนนี้ Claude Agent SDK ของแผนสมัครสมาชิก, `claude -p` และการใช้งาน
      แอปของบุคคลที่สามยังคงหักจากขีดจำกัดการใช้งานของการสมัครสมาชิกที่เข้าสู่ระบบไว้
    - เครดิต Agent SDK รายเดือนที่เคยประกาศไว้ยังไม่พร้อมใช้งานขณะที่
      Anthropic กำลังปรับแผนนั้น
    - การเข้าสู่ระบบ Console/คีย์ API ใช้การคิดค่าบริการ API แบบจ่ายตามการใช้งาน และไม่ได้รับ
      เครดิต Agent SDK ของการสมัครสมาชิก

    ดู [บทความแผน Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    ของ Anthropic สำหรับประกาศหยุดพัก และบทความแผน Claude Code สำหรับพฤติกรรมการสมัครสมาชิก
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    และ
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)

    Anthropic สามารถเปลี่ยนพฤติกรรมการคิดค่าบริการและการจำกัดอัตราของ Claude Code ได้โดยไม่ต้องมี
    รุ่น OpenClaw ตรวจสอบ `claude auth status`, `/status` และ
    เอกสารที่ลิงก์ของ Anthropic เมื่อความคาดการณ์ได้ของการคิดค่าบริการเป็นเรื่องสำคัญ

    <Tip>
    สำหรับระบบอัตโนมัติการผลิตที่ใช้ร่วมกัน ให้ใช้คีย์ Anthropic API แทน
    Claude CLI OpenClaw ยังรองรับตัวเลือกแบบสมัครสมาชิกจาก
    [OpenAI Codex](/th/providers/openai), [Qwen Cloud](/th/providers/qwen),
    [MiniMax](/th/providers/minimax) และ [Z.AI / GLM](/th/providers/zai)
    </Tip>

  </Tab>
</Tabs>

## ค่าเริ่มต้นการคิด (Claude Fable 5, 4.8 และ 4.6)

`anthropic/claude-fable-5` ใช้การคิดแบบปรับตัวเสมอและตั้งค่าเริ่มต้นเป็นความพยายามระดับ `high`
เนื่องจาก Anthropic ไม่อนุญาตให้ปิดการคิดสำหรับโมเดลนี้
`/think off` และ `/think minimal` จึงใช้ความพยายามระดับ `low` OpenClaw ยังละเว้นค่า
temperature แบบกำหนดเองสำหรับคำขอ Fable 5 ด้วย

Claude Opus 4.8 ปิดการคิดไว้ตามค่าเริ่มต้นใน OpenClaw เมื่อคุณเปิดใช้การคิดแบบปรับตัวอย่างชัดเจนด้วย `/think high|xhigh|max` OpenClaw จะส่งค่าความพยายาม Opus 4.8 ของ Anthropic โมเดล Claude 4.6 มีค่าเริ่มต้นเป็น `adaptive`

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

## การสำรองเมื่อปฏิเสธด้วยเหตุผลด้านความปลอดภัย (Claude Fable 5)

<Warning>
การใช้ Claude Fable 5 หมายถึงการใช้ Claude Opus 4.8 ด้วย Fable 5 มาพร้อม
ตัวจำแนกความปลอดภัยที่อาจปฏิเสธคำขอได้ และวิธีการกู้คืนที่ Anthropic อนุมัติ
คือให้ `claude-opus-4-8` ให้บริการเทิร์นนั้น OpenClaw เลือกใช้สิ่งนี้
โดยอัตโนมัติสำหรับคำขอคีย์ API โดยตรง ดังนั้นบางเทิร์นของ Fable จึงได้รับคำตอบ
และถูกคิดค่าบริการเป็น Claude Opus 4.8 หากนโยบายหรืองบประมาณของคุณไม่สามารถยอมรับ
เทิร์นที่ให้บริการโดย Opus ได้ อย่าเลือก `anthropic/claude-fable-5`
</Warning>

### เหตุผลที่มีสิ่งนี้

ตัวจำแนกของ Fable 5 ส่งคืน `stop_reason: "refusal"` สำหรับคำขอในโดเมนที่ถูกจำกัด
และยังให้ผลบวกลวงกับงานที่อยู่ใกล้เคียงแต่ไม่เป็นอันตราย (เครื่องมือด้านความปลอดภัย
วิทยาศาสตร์ชีวภาพ หรือแม้แต่การขอให้โมเดลสร้างเหตุผลดิบของตนซ้ำ)
หากไม่มี fallback เทิร์นจะจบด้วยข้อผิดพลาดแม้ว่าโมเดล Claude อื่น
จะให้บริการได้อย่างไม่มีปัญหา ข้อความปฏิเสธของ Anthropic เอง
บอกให้ผู้ผสานรวม API กำหนดค่าโมเดล fallback

### วิธีการทำงาน

1. สำหรับทุกคำขอคีย์ API โดยตรงไปยัง `anthropic/claude-fable-5` OpenClaw
   ส่งการเลือกใช้ fallback ฝั่งเซิร์ฟเวอร์ของ Anthropic: ส่วนหัวเบต้า
   `server-side-fallback-2026-06-01` พร้อม
   `fallbacks: [{"model": "claude-opus-4-8"}]` Claude Opus 4.8 เป็นเป้าหมาย
   fallback เดียวที่ Anthropic อนุญาตสำหรับ Fable 5
2. เฉพาะการปฏิเสธจากตัวจำแนกความปลอดภัยเท่านั้นที่ทริกเกอร์ fallback ขีดจำกัดอัตรา
   ภาวะโอเวอร์โหลด และข้อผิดพลาดเซิร์ฟเวอร์ทำงานเหมือนเดิมทุกประการและผ่าน
   [การสลับโมเดลเมื่อเกิดความล้มเหลว](/th/concepts/model-failover) ปกติของ OpenClaw
3. การกู้คืนเกิดขึ้นภายในการเรียกเดียวกัน การปฏิเสธก่อนมีเอาต์พุตใดๆ
   จะมองไม่เห็นนอกจากเวลาแฝง คำตอบทั้งหมดมาจาก Opus 4.8 สำหรับการปฏิเสธ
   ระหว่างสตรีม ข้อความบางส่วนจะถูกเก็บเป็นคำนำหน้าที่โมเดล fallback
   ดำเนินต่อจากนั้น ขณะที่เหตุผลและการเรียกใช้เครื่องมือของโมเดลที่ปฏิเสธ
   จะถูกทิ้งตามกฎการเล่นซ้ำของ Anthropic (ต้องไม่สะท้อนกลับหรือ
   ดำเนินการ)
4. หาก Claude Opus 4.8 ปฏิเสธด้วย เทิร์นจะแสดงการปฏิเสธเป็น
   ข้อผิดพลาด เหมือนก่อนมีฟีเจอร์นี้ทุกประการ

fallback เกิดขึ้นในระดับ Anthropic API ดังนั้น `claude-opus-4-8` จึงไม่
จำเป็นต้องอยู่ในรายการโมเดลที่กำหนดค่าหรือเชน fallback ของคุณ คีย์ API
ที่รองรับ Fable สามารถให้บริการ Opus ได้เสมอ

### การสังเกตการณ์และการคิดค่าบริการ

- เทิร์นที่ให้บริการโดย fallback จะบันทึกการวินิจฉัย `provider_fallback` บน
  ข้อความผู้ช่วยโดยระบุ `fromModel` และ `toModel` และ
  `responseModel` ของข้อความรายงาน `claude-opus-4-8`
- Anthropic คิดค่าบริการต่อความพยายาม: การปฏิเสธก่อนเอาต์พุตไม่มีค่าใช้จ่าย และการกู้คืน
  คิดค่าบริการตามอัตรา Claude Opus 4.8 (ปัจจุบันครึ่งหนึ่งของอัตรา Fable 5) การประมาณ
  ค่าใช้จ่ายต่อเทิร์นของ OpenClaw คิดราคาเทิร์นที่ให้บริการโดย fallback ตามอัตรา Opus เพื่อให้ตรงกัน
- การปฏิเสธระหว่างสตรีมจะคิดค่าบริการส่วนบางส่วนของ Fable ที่สตรีมไปแล้วเพิ่มเติม
  ทางฝั่ง Anthropic ส่วนนั้นถูกรายงานในการใช้งานต่อความพยายามของ API
  แต่ไม่ได้รวมเข้าในการประมาณต่อเทิร์นของ OpenClaw

### ขอบเขต

ใช้กับ `anthropic/claude-fable-5` พร้อมการยืนยันตัวตนด้วยคีย์ API กับ
`api.anthropic.com` คำขอ OAuth (การใช้การสมัครสมาชิก Claude CLI ซ้ำ), URL ฐานของพร็อกซี,
Bedrock, Vertex และ Foundry ไม่เปลี่ยนแปลงและยังคงแสดง
การปฏิเสธเป็นข้อผิดพลาดที่นั่น

ยืนยันแบบสดแล้ว: พรอมต์ที่ไม่เป็นอันตรายซึ่งขอให้ Fable 5 สร้าง chain of
thought ดิบของตนซ้ำถูกปฏิเสธด้วย `category: "reasoning_extraction"` เมื่อส่งโดยไม่มี
fallbacks และพรอมต์เดียวกันผ่าน OpenClaw ส่งคืนคำตอบปกติที่ให้บริการโดย Opus
พร้อมแนบการวินิจฉัย `provider_fallback`

ดู [คู่มือการปฏิเสธและ fallback](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
ของ Anthropic สำหรับพฤติกรรมพื้นฐาน

## การแคชพรอมต์

OpenClaw รองรับฟีเจอร์การแคชพรอมต์ของ Anthropic สำหรับการยืนยันตัวตนด้วยคีย์ API

| ค่า                 | ระยะเวลาแคช | คำอธิบาย                                      |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (ค่าเริ่มต้น) | 5 นาที         | ใช้อัตโนมัติสำหรับการยืนยันตัวตนด้วยคีย์ API |
| `"long"`            | 1 ชั่วโมง      | แคชแบบขยาย                              |
| `"none"`            | ไม่มีการแคช     | ปิดใช้งานการแคชพรอมต์                   |

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

    ลำดับการผสานการกำหนดค่า:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (`id` ที่ตรงกัน, แทนที่ตามคีย์)

    สิ่งนี้ทำให้เอเจนต์หนึ่งคงแคชอายุยาวไว้ได้ ขณะที่อีกเอเจนต์หนึ่งที่ใช้โมเดลเดียวกันปิดใช้การแคชสำหรับทราฟฟิกแบบเป็นช่วงสั้น ๆ/นำกลับมาใช้ซ้ำน้อย

  </Accordion>

  <Accordion title="หมายเหตุ Bedrock Claude">
    - โมเดล Anthropic Claude บน Bedrock (`amazon-bedrock/*anthropic.claude*`) ยอมรับการส่งผ่าน `cacheRetention` เมื่อกำหนดค่าไว้
    - โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับเป็น `cacheRetention: "none"` ขณะรันไทม์
    - ค่าเริ่มต้นอัจฉริยะของคีย์ API ยังตั้งค่าเริ่มต้น `cacheRetention: "short"` สำหรับ refs ของ Claude-on-Bedrock เมื่อไม่ได้ตั้งค่าไว้อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมดเร็ว">
    ตัวสลับ `/fast` ที่ใช้ร่วมกันของ OpenClaw รองรับทราฟฟิก Anthropic โดยตรง (คีย์ API และ OAuth ไปยัง `api.anthropic.com`)

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
    - แทรกเฉพาะสำหรับคำขอโดยตรงไปยัง `api.anthropic.com` เส้นทางพร็อกซีจะไม่แตะต้อง `service_tier`
    - พารามิเตอร์ `serviceTier` หรือ `service_tier` ที่ตั้งไว้อย่างชัดเจนจะแทนที่ `/fast` เมื่อมีการตั้งค่าทั้งคู่
    - สำหรับบัญชีที่ไม่มีความจุ Priority Tier, `service_tier: "auto"` อาจถูกปรับเป็น `standard`

    </Note>

  </Accordion>

  <Accordion title="การทำความเข้าใจสื่อ (รูปภาพและ PDF)">
    Plugin Anthropic ที่รวมมาให้จะลงทะเบียนความสามารถในการทำความเข้าใจรูปภาพและ PDF OpenClaw
    จะแก้ไขความสามารถของสื่อโดยอัตโนมัติจากการยืนยันตัวตน Anthropic ที่กำหนดค่าไว้ ไม่จำเป็นต้องมี
    การกำหนดค่าเพิ่มเติม

    | คุณสมบัติ        | ค่า                 |
    | --------------- | --------------------- |
    | โมเดลเริ่มต้น   | `claude-opus-4-8`     |
    | อินพุตที่รองรับ | รูปภาพ, เอกสาร PDF |

    เมื่อแนบรูปภาพหรือ PDF ไปกับการสนทนา OpenClaw จะกำหนดเส้นทางผ่านผู้ให้บริการความเข้าใจสื่อของ Anthropic โดยอัตโนมัติ

  </Accordion>

  <Accordion title="หน้าต่างบริบท 1M">
    หน้าต่างบริบท 1M ของ Anthropic พร้อมใช้งานบนโมเดล Claude 4.x ที่รองรับ GA
    เช่น Opus 4.8, Opus 4.7, Opus 4.6 และ Sonnet 4.6 OpenClaw จะกำหนดขนาดโมเดลเหล่านั้นเป็น
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
    เฮดเดอร์ beta `context-1m-2025-08-07` ที่เลิกใช้แล้วอีกต่อไป รายการกำหนดค่า `anthropicBeta` เก่า
    ที่มีค่านั้นจะถูกละเว้นระหว่างการแก้ไขเฮดเดอร์คำขอ และ
    โมเดล Claude รุ่นเก่าที่ไม่รองรับจะยังคงใช้หน้าต่างบริบทปกติของตน

    `params.context1m: true` ยังใช้กับแบ็กเอนด์ Claude CLI
    (`claude-cli/*`) สำหรับโมเดล Opus และ Sonnet ที่รองรับ GA ที่เข้าเงื่อนไข โดยคง
    หน้าต่างบริบทรันไทม์สำหรับเซสชัน CLI เหล่านั้นให้ตรงกับพฤติกรรมของ API โดยตรง

    <Warning>
    ต้องมีสิทธิ์เข้าถึงบริบทแบบยาวบนข้อมูลประจำตัว Anthropic ของคุณ การยืนยันตัวตนด้วย OAuth/โทเค็นสมัครสมาชิกจะคงเฮดเดอร์ beta ของ Anthropic ที่จำเป็นไว้ แต่ OpenClaw จะตัดเฮดเดอร์ beta 1M ที่เลิกใช้แล้วออกหากยังเหลืออยู่ในการกำหนดค่าเก่า
    </Warning>

  </Accordion>

  <Accordion title="บริบท 1M ของ Claude Opus 4.8">
    `anthropic/claude-opus-4-8` และตัวแปร `claude-cli` ของโมเดลนี้มีหน้าต่างบริบท 1M
    เป็นค่าเริ่มต้นอยู่แล้ว ไม่จำเป็นต้องใช้ `params.context1m: true`
  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ข้อผิดพลาด 401 / โทเค็นใช้ไม่ได้กะทันหัน">
    การยืนยันตัวตนด้วยโทเค็น Anthropic จะหมดอายุและอาจถูกเพิกถอนได้ สำหรับการตั้งค่าใหม่ ให้ใช้คีย์ API ของ Anthropic แทน
  </Accordion>

  <Accordion title='ไม่พบคีย์ API สำหรับผู้ให้บริการ "anthropic"'>
    การยืนยันตัวตน Anthropic เป็นแบบ **ต่อเอเจนต์** เอเจนต์ใหม่จะไม่สืบทอดคีย์ของเอเจนต์หลัก ให้เรียกใช้ onboarding สำหรับเอเจนต์นั้นอีกครั้ง (หรือกำหนดค่าคีย์ API บนโฮสต์ Gateway) จากนั้นตรวจสอบด้วย `openclaw models status`
  </Accordion>

  <Accordion title='ไม่พบข้อมูลประจำตัวสำหรับโปรไฟล์ "anthropic:default"'>
    เรียกใช้ `openclaw models status` เพื่อดูว่าโปรไฟล์การยืนยันตัวตนใดทำงานอยู่ เรียกใช้ onboarding อีกครั้ง หรือกำหนดค่าคีย์ API สำหรับเส้นทางโปรไฟล์นั้น
  </Accordion>

  <Accordion title="ไม่มีโปรไฟล์การยืนยันตัวตนที่พร้อมใช้งาน (ทั้งหมดอยู่ในช่วงพัก)">
    ตรวจสอบ `auth.unusableProfiles` ด้วย `openclaw models status --json` ช่วงพักจาก rate limit ของ Anthropic อาจผูกกับโมเดล ดังนั้นโมเดล Anthropic พี่น้องอาจยังใช้งานได้ เพิ่มโปรไฟล์ Anthropic อื่นหรือรอให้ช่วงพักสิ้นสุด
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, refs ของโมเดล และพฤติกรรม failover
  </Card>
  <Card title="แบ็กเอนด์ CLI" href="/th/gateway/cli-backends" icon="terminal">
    การตั้งค่าแบ็กเอนด์ Claude CLI และรายละเอียดรันไทม์
  </Card>
  <Card title="การแคชพรอมต์" href="/th/reference/prompt-caching" icon="database">
    วิธีการทำงานของการแคชพรอมต์ข้ามผู้ให้บริการ
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลประจำตัวซ้ำ
  </Card>
</CardGroup>
