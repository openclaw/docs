---
read_when:
    - คุณต้องการใช้โมเดล OpenAI ใน OpenClaw
    - คุณต้องการใช้การยืนยันตัวตนผ่านการสมัครสมาชิก Codex แทนคีย์ API
    - คุณต้องการพฤติกรรมการดำเนินการของเอเจนต์ GPT-5 ที่เข้มงวดยิ่งขึ้น
summary: ใช้ OpenAI ผ่านคีย์ API หรือการสมัครสมาชิก Codex ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T16:29:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e113f2418f82a8859f208f85efb55114bda7bc17beeb28f012b19e861609dad
    source_path: providers/openai.md
    workflow: 16
---

OpenAI ให้บริการ API สำหรับนักพัฒนาสำหรับโมเดล GPT และ Codex ยังพร้อมใช้งานในฐานะเอเจนต์เขียนโค้ดผ่านแผน ChatGPT ผ่านไคลเอนต์ Codex ของ OpenAI ด้วย OpenClaw แยกพื้นผิวเหล่านี้ออกจากกันเพื่อให้การกำหนดค่าคาดเดาได้

OpenClaw รองรับเส้นทางตระกูล OpenAI สามแบบ คำนำหน้าโมเดลจะเลือกเส้นทางผู้ให้บริการ/การยืนยันตัวตน ส่วนการตั้งค่ารันไทม์แยกต่างหากจะเลือกผู้ที่ดำเนินการลูปเอเจนต์ที่ฝังอยู่:

- **คีย์ API** — การเข้าถึง OpenAI Platform โดยตรงพร้อมการคิดค่าบริการตามการใช้งาน (โมเดล `openai/*`)
- **การสมัครใช้งาน Codex ผ่าน PI** — การลงชื่อเข้าใช้ ChatGPT/Codex พร้อมการเข้าถึงผ่านการสมัครใช้งาน (โมเดล `openai-codex/*`)
- **ชุดควบคุม app-server ของ Codex** — การดำเนินการ app-server ของ Codex แบบเนทีฟ (โมเดล `openai/*` รวมกับ `agents.defaults.agentRuntime.id: "codex"`)

OpenAI รองรับการใช้ OAuth แบบสมัครใช้งานอย่างชัดเจนในเครื่องมือและเวิร์กโฟลว์ภายนอกอย่าง OpenClaw

ผู้ให้บริการ โมเดล รันไทม์ และช่องทางเป็นเลเยอร์ที่แยกจากกัน หากป้ายกำกับเหล่านั้นเริ่มปะปนกัน ให้อ่าน [รันไทม์เอเจนต์](/th/concepts/agent-runtimes) ก่อนเปลี่ยนการกำหนดค่า

## ตัวเลือกแบบเร็ว

| เป้าหมาย                                      | ใช้                                              | หมายเหตุ                                                                    |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| การคิดค่าบริการด้วยคีย์ API โดยตรง           | `openai/gpt-5.5`                                 | ตั้งค่า `OPENAI_API_KEY` หรือเรียกใช้การเริ่มต้นใช้งานคีย์ API ของ OpenAI |
| GPT-5.5 พร้อมการยืนยันตัวตนผ่านการสมัครใช้งาน ChatGPT/Codex | `openai-codex/gpt-5.5`                           | เส้นทาง PI เริ่มต้นสำหรับ OAuth ของ Codex เป็นตัวเลือกแรกที่เหมาะที่สุดสำหรับการตั้งค่าแบบสมัครใช้งาน |
| GPT-5.5 พร้อมพฤติกรรม app-server ของ Codex แบบเนทีฟ | `openai/gpt-5.5` รวมกับ `agentRuntime.id: "codex"` | บังคับใช้ชุดควบคุม app-server ของ Codex สำหรับการอ้างอิงโมเดลนั้น |
| การสร้างหรือแก้ไขรูปภาพ                       | `openai/gpt-image-2`                             | ทำงานได้ทั้งกับ `OPENAI_API_KEY` หรือ OAuth ของ OpenAI Codex |
| รูปภาพพื้นหลังโปร่งใส                         | `openai/gpt-image-1.5`                           | ใช้ `outputFormat=png` หรือ `webp` และ `openai.background=transparent` |

## แผนที่การตั้งชื่อ

ชื่อคล้ายกันแต่ใช้แทนกันไม่ได้:

| ชื่อที่คุณเห็น                     | เลเยอร์           | ความหมาย                                                                                         |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | คำนำหน้าผู้ให้บริการ | เส้นทาง API ของ OpenAI Platform โดยตรง                                                           |
| `openai-codex`                     | คำนำหน้าผู้ให้บริการ | เส้นทาง OAuth/การสมัครใช้งาน OpenAI Codex ผ่านตัวรัน PI ปกติของ OpenClaw                        |
| `codex` plugin                     | Plugin            | Plugin ของ OpenClaw ที่มาพร้อมชุดโปรแกรม ซึ่งให้รันไทม์ app-server ของ Codex แบบเนทีฟและการควบคุมแชต `/codex` |
| `agentRuntime.id: codex`           | รันไทม์เอเจนต์    | บังคับใช้ชุดควบคุม app-server ของ Codex แบบเนทีฟสำหรับเทิร์นที่ฝังอยู่                          |
| `/codex ...`                       | ชุดคำสั่งแชต      | ผูก/ควบคุมเธรด app-server ของ Codex จากการสนทนา                                                  |
| `runtime: "acp", agentId: "codex"` | เส้นทางเซสชัน ACP | เส้นทางสำรองแบบชัดเจนที่รัน Codex ผ่าน ACP/acpx                                                   |

ซึ่งหมายความว่าการกำหนดค่าสามารถมีทั้ง `openai-codex/*` และ `codex` plugin ได้โดยตั้งใจ สิ่งนี้ถูกต้องเมื่อคุณต้องการ OAuth ของ Codex ผ่าน PI และยังต้องการให้การควบคุมแชต `/codex` แบบเนทีฟพร้อมใช้งานด้วย `openclaw doctor` จะเตือนเกี่ยวกับชุดค่าผสมนี้เพื่อให้คุณยืนยันได้ว่าเป็นความตั้งใจจริง และจะไม่เขียนค่าใหม่

<Note>
GPT-5.5 พร้อมใช้งานทั้งผ่านการเข้าถึงด้วยคีย์ API ของ OpenAI Platform โดยตรงและเส้นทางการสมัครใช้งาน/OAuth ใช้ `openai/gpt-5.5` สำหรับทราฟฟิก `OPENAI_API_KEY` โดยตรง, `openai-codex/gpt-5.5` สำหรับ OAuth ของ Codex ผ่าน PI หรือ `openai/gpt-5.5` พร้อม `agentRuntime.id: "codex"` สำหรับชุดควบคุม app-server ของ Codex แบบเนทีฟ
</Note>

<Note>
การเปิดใช้งาน OpenAI plugin หรือการเลือกโมเดล `openai-codex/*` จะไม่เปิดใช้งาน Codex app-server plugin ที่มาพร้อมชุดโปรแกรม OpenClaw จะเปิดใช้งาน Plugin นั้นเฉพาะเมื่อคุณเลือกชุดควบคุม Codex แบบเนทีฟอย่างชัดเจนด้วย `agentRuntime.id: "codex"` หรือใช้การอ้างอิงโมเดล `codex/*` แบบเดิม
หาก `codex` plugin ที่มาพร้อมชุดโปรแกรมถูกเปิดใช้งาน แต่ `openai-codex/*` ยัง resolve ผ่าน PI อยู่ `openclaw doctor` จะเตือนและปล่อยเส้นทางไว้ตามเดิม
</Note>

## ความครอบคลุมฟีเจอร์ของ OpenClaw

| ความสามารถของ OpenAI      | พื้นผิว OpenClaw                                           | สถานะ                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| แชต / Responses           | ผู้ให้บริการโมเดล `openai/<model>`                         | ใช่                                                    |
| โมเดลการสมัครใช้งาน Codex | `openai-codex/<model>` พร้อม OAuth ของ `openai-codex`      | ใช่                                                    |
| ชุดควบคุม app-server ของ Codex | `openai/<model>` พร้อม `agentRuntime.id: codex`             | ใช่                                                    |
| การค้นหาเว็บฝั่งเซิร์ฟเวอร์ | เครื่องมือ OpenAI Responses แบบเนทีฟ                       | ใช่ เมื่อเปิดใช้งานการค้นหาเว็บและไม่ได้ปักหมุดผู้ให้บริการ |
| รูปภาพ                    | `image_generate`                                           | ใช่                                                    |
| วิดีโอ                    | `video_generate`                                           | ใช่                                                    |
| ข้อความเป็นเสียงพูด       | `messages.tts.provider: "openai"` / `tts`                  | ใช่                                                    |
| การถอดเสียงเป็นข้อความแบบแบตช์ | `tools.media.audio` / การทำความเข้าใจสื่อ                   | ใช่                                                    |
| การถอดเสียงเป็นข้อความแบบสตรีมมิง | Voice Call `streaming.provider: "openai"`                  | ใช่                                                    |
| เสียงเรียลไทม์            | Voice Call `realtime.provider: "openai"` / Control UI Talk | ใช่                                                    |
| Embeddings                | ผู้ให้บริการ embedding หน่วยความจำ                         | ใช่                                                    |

## Embeddings หน่วยความจำ

OpenClaw สามารถใช้ OpenAI หรือปลายทาง embedding ที่เข้ากันได้กับ OpenAI สำหรับการทำดัชนี `memory_search` และ query embeddings:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

สำหรับปลายทางที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้ป้ายกำกับ embedding แบบอสมมาตร ให้ตั้งค่า `queryInputType` และ `documentInputType` ใต้ `memorySearch` OpenClaw จะส่งค่าเหล่านั้นต่อเป็นฟิลด์คำขอ `input_type` เฉพาะผู้ให้บริการ: query embeddings ใช้ `queryInputType`; ชิ้นหน่วยความจำที่ถูกทำดัชนีและการทำดัชนีแบบแบตช์ใช้ `documentInputType` ดูตัวอย่างเต็มได้ที่ [เอกสารอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config#provider-specific-config)

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="คีย์ API (OpenAI Platform)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง API โดยตรงและการคิดค่าบริการตามการใช้งาน

    <Steps>
      <Step title="รับคีย์ API ของคุณ">
        สร้างหรือคัดลอกคีย์ API จาก [แดชบอร์ด OpenAI Platform](https://platform.openai.com/api-keys)
      </Step>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        หรือส่งคีย์โดยตรง:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | การอ้างอิงโมเดล      | การกำหนดค่ารันไทม์        | เส้นทาง                    | การยืนยันตัวตน |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | ละไว้ / `agentRuntime.id: "pi"`    | API ของ OpenAI Platform โดยตรง | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | ละไว้ / `agentRuntime.id: "pi"`    | API ของ OpenAI Platform โดยตรง | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | ชุดควบคุม app-server ของ Codex | app-server ของ Codex |

    <Note>
    `openai/*` คือเส้นทางคีย์ API ของ OpenAI โดยตรง เว้นแต่คุณจะบังคับใช้ชุดควบคุม app-server ของ Codex อย่างชัดเจน ใช้ `openai-codex/*` สำหรับ OAuth ของ Codex ผ่านตัวรัน PI เริ่มต้น หรือใช้ `openai/gpt-5.5` พร้อม `agentRuntime.id: "codex"` สำหรับการดำเนินการ app-server ของ Codex แบบเนทีฟ
    </Note>

    ### ตัวอย่างการกำหนดค่า

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw ไม่เปิดให้ใช้ `openai/gpt-5.3-codex-spark` คำขอ OpenAI API แบบสดจะปฏิเสธโมเดลนั้น และแคตตาล็อก Codex ปัจจุบันก็ไม่ได้เปิดเผยโมเดลนี้เช่นกัน
    </Warning>

  </Tab>

  <Tab title="การสมัครใช้งาน Codex">
    **เหมาะที่สุดสำหรับ:** การใช้การสมัครใช้งาน ChatGPT/Codex ของคุณแทนคีย์ API แยกต่างหาก คลาวด์ Codex ต้องลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="เรียกใช้ OAuth ของ Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        หรือเรียกใช้ OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        สำหรับการตั้งค่าแบบไม่มีหน้าจอหรือไม่รองรับ callback ให้เพิ่ม `--device-code` เพื่อลงชื่อเข้าใช้ด้วยโฟลว์รหัสอุปกรณ์ของ ChatGPT แทน callback ของเบราว์เซอร์ localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | การอ้างอิงโมเดล | การกำหนดค่ารันไทม์ | เส้นทาง | การยืนยันตัวตน |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | ละไว้ / `runtime: "pi"` | OAuth ของ ChatGPT/Codex ผ่าน PI | การลงชื่อเข้าใช้ Codex |
    | `openai-codex/gpt-5.4-mini` | ละไว้ / `runtime: "pi"` | OAuth ของ ChatGPT/Codex ผ่าน PI | การลงชื่อเข้าใช้ Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | ยังคงเป็น PI เว้นแต่ Plugin จะอ้างสิทธิ์ `openai-codex` อย่างชัดเจน | การลงชื่อเข้าใช้ Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | ชุดควบคุม app-server ของ Codex | การยืนยันตัวตน app-server ของ Codex |

    <Note>
    ใช้รหัสผู้ให้บริการ `openai-codex` ต่อไปสำหรับคำสั่งการยืนยันตัวตน/โปรไฟล์ คำนำหน้าโมเดล `openai-codex/*` ยังเป็นเส้นทาง PI แบบชัดเจนสำหรับ OAuth ของ Codex ด้วย มันไม่ได้เลือกหรือเปิดใช้งานชุดควบคุม app-server ของ Codex ที่มาพร้อมชุดโปรแกรมโดยอัตโนมัติ
    </Note>

    ### ตัวอย่างการกำหนดค่า

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    การเริ่มต้นใช้งานจะไม่นำเข้าข้อมูล OAuth จาก `~/.codex` อีกต่อไป ลงชื่อเข้าใช้ด้วย OAuth ผ่านเบราว์เซอร์ (ค่าเริ่มต้น) หรือโฟลว์รหัสอุปกรณ์ด้านบน — OpenClaw จะจัดการข้อมูลประจำตัวที่ได้ในที่เก็บการยืนยันตัวตนเอเจนต์ของตนเอง
    </Note>

    ### ตัวบ่งชี้สถานะ

    แชต `/status` แสดงว่า runtime ของโมเดลใดทำงานอยู่สำหรับเซสชันปัจจุบัน
    harness ของ Pi เริ่มต้นจะแสดงเป็น `Runtime: OpenClaw Pi Default` เมื่อเลือก
    harness app-server Codex ที่บันเดิลมา `/status` จะแสดง
    `Runtime: OpenAI Codex` เซสชันที่มีอยู่จะเก็บ harness id ที่บันทึกไว้ ดังนั้นให้ใช้
    `/new` หรือ `/reset` หลังจากเปลี่ยน `agentRuntime` หากคุณต้องการให้ `/status`
    แสดงตัวเลือก Pi/Codex ใหม่

    ### คำเตือน Doctor

    หากเปิดใช้งาน Plugin `codex` ที่บันเดิลมาในขณะที่เลือก route
    `openai-codex/*` ของแท็บนี้ `openclaw doctor` จะเตือนว่าโมเดล
    ยังคง resolve ผ่าน Pi ให้คง config ไว้เหมือนเดิมเมื่อสิ่งนั้นคือ
    route การตรวจสอบสิทธิ์ด้วยการสมัครสมาชิกที่ตั้งใจไว้ เปลี่ยนเป็น `openai/<model>` พร้อม
    `agentRuntime.id: "codex"` เฉพาะเมื่อคุณต้องการให้ Codex
    app-server ทำงานแบบ native เท่านั้น

    ### ขีดจำกัดหน้าต่างบริบท

    OpenClaw ถือว่าเมทาดาทาของโมเดลและขีดจำกัดบริบทของ runtime เป็นค่าคนละชุดกัน

    สำหรับ `openai-codex/gpt-5.5` ผ่าน Codex OAuth:

    - `contextWindow` แบบ native: `1000000`
    - ขีดจำกัด `contextTokens` ของ runtime เริ่มต้น: `272000`

    ขีดจำกัดเริ่มต้นที่เล็กกว่ามีคุณลักษณะด้านเวลาแฝงและคุณภาพที่ดีกว่าในการใช้งานจริง แทนที่ได้ด้วย `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    ใช้ `contextWindow` เพื่อประกาศเมทาดาทาโมเดลแบบ native ใช้ `contextTokens` เพื่อจำกัดงบประมาณบริบทของ runtime
    </Note>

    ### การกู้คืนแคตตาล็อก

    OpenClaw ใช้เมทาดาทาแคตตาล็อก Codex จาก upstream สำหรับ `gpt-5.5` เมื่อมีอยู่
    หากการค้นพบ Codex แบบสดละเว้นแถว `openai-codex/gpt-5.5` ในขณะที่
    บัญชีผ่านการตรวจสอบสิทธิ์แล้ว OpenClaw จะสังเคราะห์แถวโมเดล OAuth นั้นขึ้นมาเพื่อให้
    cron, sub-agent และการรันโมเดลเริ่มต้นที่กำหนดค่าไว้ไม่ล้มเหลวด้วย
    `Unknown model`

  </Tab>
</Tabs>

## การตรวจสอบสิทธิ์ Codex app-server แบบ native

harness Codex app-server แบบ native ใช้ model refs `openai/*` พร้อม
`agentRuntime.id: "codex"` แต่การตรวจสอบสิทธิ์ของมันยังคงอิงบัญชี OpenClaw
เลือกการตรวจสอบสิทธิ์ตามลำดับนี้:

1. โปรไฟล์การตรวจสอบสิทธิ์ OpenClaw `openai-codex` ที่กำหนดไว้อย่างชัดเจนและผูกกับ agent
2. บัญชีที่มีอยู่ของ app-server เช่น การลงชื่อเข้าใช้ ChatGPT ของ Codex CLI ในเครื่อง
3. สำหรับการเปิด app-server แบบ local stdio เท่านั้น ใช้ `CODEX_API_KEY` แล้วตามด้วย
   `OPENAI_API_KEY` เมื่อ app-server รายงานว่าไม่มีบัญชีและยังต้องการ
   การตรวจสอบสิทธิ์ OpenAI

นั่นหมายความว่าการลงชื่อเข้าใช้การสมัครสมาชิก ChatGPT/Codex ในเครื่องจะไม่ถูกแทนที่เพียง
เพราะ process ของ Gateway มี `OPENAI_API_KEY` สำหรับโมเดล OpenAI โดยตรง
หรือ embeddings ด้วย การ fallback ไปใช้ env API-key เป็นเฉพาะเส้นทาง local stdio ที่ไม่มีบัญชีเท่านั้น
และจะไม่ถูกส่งไปยังการเชื่อมต่อ WebSocket app-server เมื่อเลือกโปรไฟล์ Codex
แบบสมัครสมาชิก OpenClaw ยังกัน `CODEX_API_KEY` และ `OPENAI_API_KEY`
ออกจาก child stdio app-server ที่ spawn ขึ้นมา และส่ง credentials ที่เลือก
ผ่าน app-server login RPC

## การสร้างภาพ

Plugin `openai` ที่บันเดิลมาลงทะเบียนการสร้างภาพผ่านเครื่องมือ `image_generate`
รองรับทั้งการสร้างภาพด้วย OpenAI API-key และการสร้างภาพด้วย Codex OAuth
ผ่าน model ref `openai/gpt-image-2` เดียวกัน

| ความสามารถ                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| การตรวจสอบสิทธิ์          | `OPENAI_API_KEY`                   | การลงชื่อเข้าใช้ OpenAI Codex OAuth |
| การขนส่ง                  | OpenAI Images API                  | backend ของ Codex Responses          |
| จำนวนภาพสูงสุดต่อคำขอ     | 4                                  | 4                                    |
| โหมดแก้ไข                 | เปิดใช้งาน (สูงสุด 5 ภาพอ้างอิง) | เปิดใช้งาน (สูงสุด 5 ภาพอ้างอิง)   |
| การ override ขนาด         | รองรับ รวมถึงขนาด 2K/4K            | รองรับ รวมถึงขนาด 2K/4K              |
| อัตราส่วนภาพ / ความละเอียด | ไม่ส่งต่อไปยัง OpenAI Images API | แมปเป็นขนาดที่รองรับเมื่อปลอดภัย |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
ดู [การสร้างภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือก provider และพฤติกรรม failover
</Note>

`gpt-image-2` เป็นค่าเริ่มต้นสำหรับทั้งการสร้างภาพจากข้อความของ OpenAI และการ
แก้ไขภาพ `gpt-image-1.5`, `gpt-image-1` และ `gpt-image-1-mini` ยังคงใช้งานได้เป็น
การ override โมเดลอย่างชัดเจน ใช้ `openai/gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP
พื้นหลังโปร่งใส API `gpt-image-2` ปัจจุบันปฏิเสธ
`background: "transparent"`

สำหรับคำขอพื้นหลังโปร่งใส agents ควรเรียก `image_generate` พร้อม
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` หรือ `"webp"` และ
`background: "transparent"`; ตัวเลือก provider `openai.background` แบบเก่า
ยังคงยอมรับได้ OpenClaw ยังปกป้อง route OpenAI สาธารณะและ
OpenAI Codex OAuth ด้วยการเขียนคำขอพื้นหลังโปร่งใสเริ่มต้นของ `openai/gpt-image-2`
ใหม่เป็น `gpt-image-1.5`; Azure และ endpoint ที่เข้ากันได้กับ OpenAI แบบกำหนดเองจะคง
ชื่อ deployment/model ที่กำหนดค่าไว้

การตั้งค่าเดียวกันนี้เปิดให้ใช้สำหรับการรัน CLI แบบ headless ด้วย:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

ใช้ flag `--output-format` และ `--background` เดียวกันกับ
`openclaw infer image edit` เมื่อเริ่มจากไฟล์อินพุต
`--openai-background` ยังคงพร้อมใช้งานเป็น alias เฉพาะ OpenAI

สำหรับการติดตั้ง Codex OAuth ให้คง ref `openai/gpt-image-2` เดิมไว้ เมื่อมีการกำหนดค่า
โปรไฟล์ OAuth `openai-codex` OpenClaw จะ resolve OAuth
access token ที่จัดเก็บไว้และส่งคำขอภาพผ่าน backend ของ Codex Responses โดย
จะไม่ลอง `OPENAI_API_KEY` ก่อน หรือ fallback ไปใช้ API key สำหรับคำขอนั้นแบบเงียบๆ
ให้กำหนดค่า `models.providers.openai` อย่างชัดเจนด้วย API key,
custom base URL หรือ endpoint Azure เมื่อคุณต้องการ route OpenAI Images API
โดยตรงแทน
หาก endpoint ภาพแบบกำหนดเองนั้นอยู่บน LAN/ที่อยู่ส่วนตัวที่เชื่อถือได้ ให้ตั้งค่า
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ด้วย; OpenClaw ยังคง
บล็อก endpoint ภาพที่เข้ากันได้กับ OpenAI แบบส่วนตัว/ภายใน เว้นแต่จะมี opt-in นี้

สร้าง:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

สร้าง PNG พื้นหลังโปร่งใส:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

แก้ไข:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## การสร้างวิดีโอ

Plugin `openai` ที่บันเดิลมาลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ `video_generate`

| ความสามารถ      | ค่า                                                                               |
| ---------------- | --------------------------------------------------------------------------------- |
| โมเดลเริ่มต้น    | `openai/sora-2`                                                                   |
| โหมด             | ข้อความเป็นวิดีโอ, ภาพเป็นวิดีโอ, แก้ไขวิดีโอเดี่ยว                              |
| อินพุตอ้างอิง    | 1 ภาพ หรือ 1 วิดีโอ                                                               |
| การ override ขนาด | รองรับ                                                                            |
| การ override อื่น | `aspectRatio`, `resolution`, `audio`, `watermark` จะถูกละเว้นพร้อมคำเตือนของเครื่องมือ |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือก provider และพฤติกรรม failover
</Note>

## การเพิ่ม prompt สำหรับ GPT-5

OpenClaw เพิ่ม prompt contribution ร่วมสำหรับ GPT-5 สำหรับการรันตระกูล GPT-5 ข้าม providers โดยใช้ตาม model id ดังนั้น `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` และ GPT-5 refs อื่นที่เข้ากันได้จะได้รับ overlay เดียวกัน โมเดล GPT-4.x รุ่นเก่าจะไม่ได้รับ

harness Codex แบบ native ที่บันเดิลมาใช้พฤติกรรม GPT-5 และ heartbeat overlay เดียวกันผ่านคำสั่งสำหรับ developer ของ Codex app-server ดังนั้นเซสชัน `openai/gpt-5.x` ที่บังคับผ่าน `agentRuntime.id: "codex"` จะยังคงแนวทางการติดตามงานให้จบและ Heartbeat เชิงรุกเหมือนเดิม แม้ว่า Codex จะเป็นเจ้าของส่วนที่เหลือของ prompt harness

GPT-5 contribution เพิ่มสัญญาพฤติกรรมแบบมีแท็กสำหรับการคง persona, ความปลอดภัยในการดำเนินการ, วินัยในการใช้เครื่องมือ, รูปแบบเอาต์พุต, การตรวจสอบความเสร็จสมบูรณ์ และการยืนยันผล พฤติกรรมการตอบกลับและข้อความเงียบเฉพาะช่องทางยังคงอยู่ใน system prompt ร่วมของ OpenClaw และนโยบายการส่งออก คำแนะนำ GPT-5 จะเปิดใช้งานเสมอสำหรับโมเดลที่ตรงกัน เลเยอร์รูปแบบการโต้ตอบที่เป็นมิตรจะแยกต่างหากและกำหนดค่าได้

| ค่า                    | ผลลัพธ์                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้งานเลเยอร์รูปแบบการโต้ตอบที่เป็นมิตร |
| `"on"`                 | Alias สำหรับ `"friendly"`                   |
| `"off"`                | ปิดใช้งานเฉพาะเลเยอร์รูปแบบที่เป็นมิตร     |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
ค่าต่างๆ ไม่คำนึงถึงตัวพิมพ์เล็กใหญ่ที่ runtime ดังนั้น `"Off"` และ `"off"` ต่างก็ปิดใช้งานเลเยอร์รูปแบบที่เป็นมิตร
</Tip>

<Note>
ยังคงอ่าน `plugins.entries.openai.config.personality` แบบ legacy เป็น fallback เพื่อความเข้ากันได้เมื่อไม่ได้ตั้งค่า `agents.defaults.promptOverlays.gpt5.personality` ร่วม
</Note>

## เสียงและคำพูด

<AccordionGroup>
  <Accordion title="การสังเคราะห์คำพูด (TTS)">
    Plugin `openai` ที่บันเดิลมาลงทะเบียนการสังเคราะห์คำพูดสำหรับ surface `messages.tts`

    | การตั้งค่า | เส้นทาง config | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | เสียง | `messages.tts.providers.openai.voice` | `coral` |
    | ความเร็ว | `messages.tts.providers.openai.speed` | (ไม่ได้ตั้งค่า) |
    | คำสั่ง | `messages.tts.providers.openai.instructions` | (ไม่ได้ตั้งค่า, เฉพาะ `gpt-4o-mini-tts`) |
    | รูปแบบ | `messages.tts.providers.openai.responseFormat` | `opus` สำหรับ voice notes, `mp3` สำหรับไฟล์ |
    | API key | `messages.tts.providers.openai.apiKey` | fallback เป็น `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    โมเดลที่พร้อมใช้งาน: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd` เสียงที่พร้อมใช้งาน: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    ตั้งค่า `OPENAI_TTS_BASE_URL` เพื่อ override TTS base URL โดยไม่กระทบ endpoint ของ chat API
    </Note>

  </Accordion>

  <Accordion title="คำพูดเป็นข้อความ">
    Plugin `openai` ที่บันเดิลมาลงทะเบียนคำพูดเป็นข้อความแบบ batch ผ่าน
    surface การถอดเสียงเพื่อความเข้าใจสื่อของ OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - เส้นทางอินพุต: การอัปโหลดไฟล์เสียงแบบ multipart
    - รองรับโดย OpenClaw ทุกที่ที่การถอดเสียงขาเข้าใช้
      `tools.media.audio` รวมถึงเซกเมนต์ช่องเสียง Discord และไฟล์แนบเสียงของช่องทาง

    หากต้องการบังคับใช้ OpenAI สำหรับการถอดเสียงจากเสียงขาเข้า:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    ระบบจะส่งต่อคำใบ้ภาษาและพรอมป์ไปยัง OpenAI เมื่อมีการระบุผ่านการกำหนดค่า
    สื่อเสียงที่ใช้ร่วมกันหรือคำขอถอดเสียงแบบรายครั้ง

  </Accordion>

  <Accordion title="การถอดเสียงแบบเรียลไทม์">
    Plugin `openai` ที่รวมมาให้ลงทะเบียนการถอดเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | พาธการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | ภาษา | `...openai.language` | (ไม่ได้ตั้งค่า) |
    | พรอมป์ | `...openai.prompt` | (ไม่ได้ตั้งค่า) |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `800` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | คีย์ API | `...openai.apiKey` | ถอยกลับไปใช้ `OPENAI_API_KEY` |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียง G.711 u-law (`g711_ulaw` / `audio/pcmu`) ผู้ให้บริการสตรีมมิงนี้ใช้สำหรับพาธการถอดเสียงแบบเรียลไทม์ของ Voice Call ส่วนเสียง Discord ในปัจจุบันจะบันทึกช่วงสั้นๆ แล้วใช้พาธการถอดเสียงแบบแบตช์ `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="เสียงแบบเรียลไทม์">
    Plugin `openai` ที่รวมมาให้ลงทะเบียนเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | พาธการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | เสียง | `...openai.voice` | `alloy` |
    | อุณหภูมิ | `...openai.temperature` | `0.8` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `500` |
    | คีย์ API | `...openai.apiKey` | ถอยกลับไปใช้ `OPENAI_API_KEY` |

    <Note>
    รองรับ Azure OpenAI ผ่านคีย์การกำหนดค่า `azureEndpoint` และ `azureDeployment` สำหรับบริดจ์เรียลไทม์ฝั่งแบ็กเอนด์ รองรับการเรียกใช้เครื่องมือแบบสองทิศทาง ใช้รูปแบบเสียง G.711 u-law
    </Note>

    <Note>
    Control UI Talk ใช้เซสชันเรียลไทม์ของ OpenAI บนเบราว์เซอร์พร้อมความลับไคลเอนต์ชั่วคราว
    ที่ Gateway สร้างให้ และการแลกเปลี่ยน WebRTC SDP ของเบราว์เซอร์โดยตรงกับ
    OpenAI Realtime API การตรวจสอบแบบสดสำหรับผู้ดูแลมีให้ใช้ด้วย
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ฝั่ง OpenAI จะสร้างความลับไคลเอนต์ใน Node, สร้างข้อเสนอ SDP ของเบราว์เซอร์
    พร้อมสื่อไมโครโฟนจำลอง, โพสต์ไปยัง OpenAI และใช้คำตอบ SDP
    โดยไม่บันทึกความลับ
    </Note>

  </Accordion>
</AccordionGroup>

## เอนด์พอยต์ Azure OpenAI

ผู้ให้บริการ `openai` ที่รวมมาให้สามารถกำหนดเป้าหมายไปยังทรัพยากร Azure OpenAI สำหรับการสร้างรูปภาพ
ได้โดยการเขียนทับ URL ฐาน ในพาธการสร้างรูปภาพ OpenClaw
จะตรวจจับชื่อโฮสต์ Azure บน `models.providers.openai.baseUrl` และสลับไปใช้
รูปแบบคำขอของ Azure โดยอัตโนมัติ

<Note>
เสียงแบบเรียลไทม์ใช้พาธการกำหนดค่าแยกต่างหาก
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
และไม่ได้รับผลกระทบจาก `models.providers.openai.baseUrl` ดูแอคคอร์เดียน **เสียงแบบเรียลไทม์**
ใต้ [เสียงและคำพูด](#voice-and-speech) สำหรับการตั้งค่า Azure
ของฟีเจอร์นี้
</Note>

ใช้ Azure OpenAI เมื่อ:

- คุณมีการสมัครใช้งาน Azure OpenAI, โควตา หรือข้อตกลงระดับองค์กรอยู่แล้ว
- คุณต้องการที่ตั้งข้อมูลตามภูมิภาคหรือการควบคุมด้านการปฏิบัติตามข้อกำหนดที่ Azure ให้บริการ
- คุณต้องการเก็บทราฟฟิกไว้ภายในเทนแนนซี Azure ที่มีอยู่

### การกำหนดค่า

สำหรับการสร้างรูปภาพ Azure ผ่านผู้ให้บริการ `openai` ที่รวมมาให้ ให้ชี้
`models.providers.openai.baseUrl` ไปยังทรัพยากร Azure ของคุณและตั้งค่า `apiKey` เป็น
คีย์ Azure OpenAI (ไม่ใช่คีย์ OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw รู้จักส่วนต่อท้ายโฮสต์ Azure ต่อไปนี้สำหรับเส้นทางการสร้างรูปภาพ
ของ Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

สำหรับคำขอสร้างรูปภาพบนโฮสต์ Azure ที่รู้จัก OpenClaw จะ:

- ส่งส่วนหัว `api-key` แทน `Authorization: Bearer`
- ใช้พาธแบบกำหนดขอบเขตตาม deployment (`/openai/deployments/{deployment}/...`)
- เติม `?api-version=...` ต่อท้ายแต่ละคำขอ
- ใช้ระยะหมดเวลาคำขอเริ่มต้น 600 วินาทีสำหรับการเรียกสร้างรูปภาพของ Azure
  ค่า `timeoutMs` แบบรายครั้งยังคงเขียนทับค่าเริ่มต้นนี้ได้

URL ฐานอื่นๆ (OpenAI สาธารณะ, พร็อกซีที่เข้ากันได้กับ OpenAI) จะยังคงใช้
รูปแบบคำขอรูปภาพมาตรฐานของ OpenAI

<Note>
การกำหนดเส้นทาง Azure สำหรับพาธการสร้างรูปภาพของผู้ให้บริการ `openai` ต้องใช้
OpenClaw 2026.4.22 หรือใหม่กว่า เวอร์ชันก่อนหน้าจะปฏิบัติกับ
`openai.baseUrl` แบบกำหนดเองใดๆ เหมือนเอนด์พอยต์ OpenAI สาธารณะและจะล้มเหลวกับ
deployment รูปภาพของ Azure
</Note>

### เวอร์ชัน API

ตั้งค่า `AZURE_OPENAI_API_VERSION` เพื่อปักหมุดเวอร์ชัน Azure preview หรือ GA ที่ต้องการ
สำหรับพาธการสร้างรูปภาพของ Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

ค่าเริ่มต้นคือ `2024-12-01-preview` เมื่อไม่ได้ตั้งค่าตัวแปร

### ชื่อโมเดลคือชื่อ deployment

Azure OpenAI ผูกโมเดลเข้ากับ deployment สำหรับคำขอสร้างรูปภาพของ Azure
ที่กำหนดเส้นทางผ่านผู้ให้บริการ `openai` ที่รวมมาให้ ฟิลด์ `model` ใน OpenClaw
ต้องเป็น **ชื่อ deployment ของ Azure** ที่คุณกำหนดค่าไว้ในพอร์ทัล Azure ไม่ใช่
รหัสโมเดล OpenAI สาธารณะ

หากคุณสร้าง deployment ชื่อ `gpt-image-2-prod` ที่ให้บริการ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

กฎชื่อ deployment เดียวกันนี้ใช้กับการเรียกสร้างรูปภาพที่กำหนดเส้นทางผ่าน
ผู้ให้บริการ `openai` ที่รวมมาให้

### ความพร้อมใช้งานตามภูมิภาค

การสร้างรูปภาพ Azure ในปัจจุบันมีให้ใช้เฉพาะในบางภูมิภาค
(เช่น `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`) ตรวจสอบรายการภูมิภาคปัจจุบันของ Microsoft ก่อนสร้าง
deployment และยืนยันว่าโมเดลที่ต้องการมีให้ใช้ในภูมิภาคของคุณ

### ความแตกต่างของพารามิเตอร์

Azure OpenAI และ OpenAI สาธารณะไม่ได้ยอมรับพารามิเตอร์รูปภาพชุดเดียวกันเสมอไป
Azure อาจปฏิเสธตัวเลือกที่ OpenAI สาธารณะอนุญาต (เช่นค่า
`background` บางค่าบน `gpt-image-2`) หรือเปิดเผยเฉพาะในเวอร์ชันโมเดล
บางรุ่นเท่านั้น ความแตกต่างเหล่านี้มาจาก Azure และโมเดลพื้นฐาน ไม่ใช่
OpenClaw หากคำขอ Azure ล้มเหลวด้วยข้อผิดพลาดการตรวจสอบความถูกต้อง ให้ตรวจสอบ
ชุดพารามิเตอร์ที่ deployment และเวอร์ชัน API เฉพาะของคุณรองรับใน
พอร์ทัล Azure

<Note>
Azure OpenAI ใช้การขนส่งแบบเนทีฟและพฤติกรรม compat แต่ไม่ได้รับ
ส่วนหัวการระบุที่มาที่ซ่อนอยู่ของ OpenClaw — ดูแอคคอร์เดียน **เส้นทางเนทีฟเทียบกับเส้นทางที่เข้ากันได้กับ OpenAI**
ใต้ [การกำหนดค่าขั้นสูง](#advanced-configuration)

สำหรับทราฟฟิกแชทหรือ Responses บน Azure (นอกเหนือจากการสร้างรูปภาพ) ให้ใช้
โฟลว์ onboarding หรือการกำหนดค่าผู้ให้บริการ Azure โดยเฉพาะ — เพียง `openai.baseUrl`
อย่างเดียวจะไม่ใช้รูปแบบ API/การยืนยันตัวตนของ Azure มีผู้ให้บริการ
`azure-openai-responses/*` แยกต่างหาก โปรดดู
แอคคอร์เดียน Compaction ฝั่งเซิร์ฟเวอร์ด้านล่าง
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การขนส่ง (WebSocket เทียบกับ SSE)">
    OpenClaw ใช้ WebSocket เป็นหลักพร้อมการถอยกลับไปใช้ SSE (`"auto"`) สำหรับทั้ง `openai/*` และ `openai-codex/*`

    ในโหมด `"auto"` OpenClaw จะ:
    - ลองใหม่หนึ่งครั้งเมื่อ WebSocket ล้มเหลวตั้งแต่ต้น ก่อนถอยกลับไปใช้ SSE
    - หลังจากล้มเหลว จะทำเครื่องหมายว่า WebSocket เสื่อมประสิทธิภาพประมาณ 60 วินาทีและใช้ SSE ระหว่างช่วงพัก
    - แนบส่วนหัวตัวตนของเซสชันและเทิร์นที่เสถียรสำหรับการลองใหม่และการเชื่อมต่อใหม่
    - ทำให้ตัวนับการใช้งาน (`input_tokens` / `prompt_tokens`) เป็นรูปแบบเดียวกันระหว่างรูปแบบการขนส่งต่างๆ

    | ค่า | พฤติกรรม |
    |-------|----------|
    | `"auto"` (ค่าเริ่มต้น) | ใช้ WebSocket ก่อน, ถอยกลับไปใช้ SSE |
    | `"sse"` | บังคับใช้เฉพาะ SSE |
    | `"websocket"` | บังคับใช้เฉพาะ WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    เอกสาร OpenAI ที่เกี่ยวข้อง:
    - [Realtime API พร้อม WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [การตอบกลับ Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="การวอร์มอัป WebSocket">
    OpenClaw เปิดใช้การวอร์มอัป WebSocket เป็นค่าเริ่มต้นสำหรับ `openai/*` และ `openai-codex/*` เพื่อลดเวลาแฝงของเทิร์นแรก

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="โหมดเร็ว">
    OpenClaw เปิดเผยสวิตช์โหมดเร็วที่ใช้ร่วมกันสำหรับ `openai/*` และ `openai-codex/*`:

    - **แชท/UI:** `/fast status|on|off`
    - **การกำหนดค่า:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    เมื่อเปิดใช้ OpenClaw จะแมปโหมดเร็วไปยังการประมวลผลลำดับความสำคัญของ OpenAI (`service_tier = "priority"`) ค่า `service_tier` ที่มีอยู่จะถูกคงไว้ และโหมดเร็วจะไม่เขียนทับ `reasoning` หรือ `text.verbosity`

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    การเขียนทับของเซสชันมีผลเหนือการกำหนดค่า การล้างการเขียนทับของเซสชันใน UI Sessions จะคืนเซสชันไปยังค่าเริ่มต้นที่กำหนดค่าไว้
    </Note>

  </Accordion>

  <Accordion title="การประมวลผลลำดับความสำคัญ (service_tier)">
    API ของ OpenAI เปิดเผยการประมวลผลลำดับความสำคัญผ่าน `service_tier` ตั้งค่าต่อโมเดลใน OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    ค่าที่รองรับ: `auto`, `default`, `flex`, `priority`

    <Warning>
    `serviceTier` จะถูกส่งต่อเฉพาะไปยังเอนด์พอยต์ OpenAI แบบเนทีฟ (`api.openai.com`) และเอนด์พอยต์ Codex แบบเนทีฟ (`chatgpt.com/backend-api`) เท่านั้น หากคุณกำหนดเส้นทางผู้ให้บริการใดผู้ให้บริการหนึ่งผ่านพร็อกซี OpenClaw จะปล่อย `service_tier` ไว้ตามเดิม
    </Warning>

  </Accordion>

  <Accordion title="Compaction ฝั่งเซิร์ฟเวอร์ (Responses API)">
    สำหรับโมเดล OpenAI Responses โดยตรง (`openai/*` บน `api.openai.com`) ตัวครอบสตรีม Pi-harness ของ Plugin OpenAI จะเปิดใช้ Compaction ฝั่งเซิร์ฟเวอร์โดยอัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ compat ของโมเดลจะตั้งค่า `supportsStore: false`)
    - แทรก `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - ค่าเริ่มต้น `compact_threshold`: 70% ของ `contextWindow` (หรือ `80000` เมื่อไม่พร้อมใช้งาน)

    สิ่งนี้ใช้กับพาธ Pi harness ในตัวและกับ hook ของผู้ให้บริการ OpenAI ที่ใช้โดยการรันแบบฝัง แอปเซิร์ฟเวอร์ harness ของ Codex แบบเนทีฟจัดการบริบทของตัวเองผ่าน Codex และกำหนดค่าแยกต่างหากด้วย `agents.defaults.agentRuntime.id`

    <Tabs>
      <Tab title="เปิดใช้อย่างชัดเจน">
        มีประโยชน์สำหรับเอนด์พอยต์ที่เข้ากันได้ เช่น Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="เกณฑ์ที่กำหนดเอง">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="ปิดใช้งาน">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` ควบคุมเฉพาะการแทรก `context_management` เท่านั้น โมเดล OpenAI Responses โดยตรงยังคงบังคับ `store: true` เว้นแต่ compat จะตั้งค่า `supportsStore: false`
    </Note>

  </Accordion>

  <Accordion title="โหมด GPT แบบ strict-agentic">
    สำหรับการรันในตระกูล GPT-5 บน `openai/*` OpenClaw สามารถใช้สัญญาการดำเนินการแบบฝังตัวที่เข้มงวดขึ้นได้:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    เมื่อใช้ `strict-agentic` OpenClaw จะ:
    - ไม่ถือว่าเทิร์นที่มีแต่แผนเป็นความคืบหน้าที่สำเร็จอีกต่อไป เมื่อมีการดำเนินการด้วยเครื่องมือพร้อมใช้งาน
    - ลองเทิร์นใหม่ด้วยการชี้นำให้ลงมือทันที
    - เปิดใช้งาน `update_plan` โดยอัตโนมัติสำหรับงานที่มีสาระสำคัญ
    - แสดงสถานะถูกบล็อกอย่างชัดเจนหากโมเดลยังคงวางแผนโดยไม่ลงมือทำ

    <Note>
    จำกัดเฉพาะการรันตระกูล GPT-5 ของ OpenAI และ Codex เท่านั้น ผู้ให้บริการรายอื่นและตระกูลโมเดลที่เก่ากว่าจะยังคงใช้พฤติกรรมเริ่มต้น
    </Note>

  </Accordion>

  <Accordion title="เส้นทางแบบเนทีฟเทียบกับเส้นทางที่เข้ากันได้กับ OpenAI">
    OpenClaw ปฏิบัติต่อ endpoint ของ OpenAI โดยตรง, Codex และ Azure OpenAI แตกต่างจากพร็อกซี `/v1` ทั่วไปที่เข้ากันได้กับ OpenAI:

    **เส้นทางแบบเนทีฟ** (`openai/*`, Azure OpenAI):
    - เก็บ `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับระดับ effort `none` ของ OpenAI
    - ละเว้น reasoning ที่ปิดใช้งานสำหรับโมเดลหรือพร็อกซีที่ปฏิเสธ `reasoning.effort: "none"`
    - ตั้งค่าเริ่มต้นของสคีมาเครื่องมือเป็นโหมด strict
    - แนบส่วนหัวการระบุแหล่งที่มาแบบซ่อนไว้เฉพาะบนโฮสต์เนทีฟที่ตรวจสอบแล้ว
    - เก็บการจัดรูปคำขอเฉพาะ OpenAI (`service_tier`, `store`, reasoning-compat, คำใบ้ prompt-cache)

    **เส้นทางพร็อกซี/ที่เข้ากันได้:**
    - ใช้พฤติกรรม compat ที่ยืดหยุ่นกว่า
    - ตัด Completions `store` ออกจาก payload `openai-completions` ที่ไม่ใช่เนทีฟ
    - รับ JSON pass-through ขั้นสูงของ `params.extra_body`/`params.extraBody` สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI
    - รับ `params.chat_template_kwargs` สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI เช่น vLLM
    - ไม่บังคับใช้สคีมาเครื่องมือแบบ strict หรือส่วนหัวเฉพาะเนทีฟ

    Azure OpenAI ใช้การขนส่งแบบเนทีฟและพฤติกรรม compat แต่ไม่ได้รับส่วนหัวการระบุแหล่งที่มาแบบซ่อน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs และพฤติกรรม failover
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
