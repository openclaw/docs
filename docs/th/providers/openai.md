---
read_when:
    - คุณต้องการใช้โมเดล OpenAI ใน OpenClaw
    - คุณต้องการใช้การตรวจสอบสิทธิ์ด้วยการสมัครใช้งาน Codex แทนคีย์ API
    - คุณต้องการให้เอเจนต์ GPT-5 ทำงานอย่างเข้มงวดยิ่งขึ้น
summary: ใช้ OpenAI ผ่านคีย์ API หรือการสมัครใช้งาน Codex ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-03T10:18:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdffcdf53d9b17a19450c2ce47103db116e54a71a8dd432d981f5ece81cc38b3
    source_path: providers/openai.md
    workflow: 16
---

OpenAI ให้บริการ API สำหรับนักพัฒนาสำหรับโมเดล GPT และ Codex ยังมีให้ใช้งานเป็นเอเจนต์เขียนโค้ดในแผน ChatGPT ผ่านไคลเอนต์ Codex ของ OpenAI ด้วย OpenClaw แยกพื้นผิวเหล่านั้นออกจากกันเพื่อให้การกำหนดค่ายังคงคาดเดาได้

OpenClaw รองรับเส้นทางตระกูล OpenAI สามแบบ ผู้สมัครสมาชิก ChatGPT/Codex ส่วนใหญ่ที่ต้องการพฤติกรรมแบบ Codex ควรใช้รันไทม์แอปเซิร์ฟเวอร์ Codex แบบเนทีฟ คำนำหน้าโมเดลเลือกชื่อผู้ให้บริการ/โมเดล ส่วนการตั้งค่ารันไทม์แยกต่างหากเลือกผู้ที่รันลูปเอเจนต์แบบฝัง:

- **คีย์ API** - การเข้าถึง OpenAI Platform โดยตรงพร้อมการคิดค่าบริการตามการใช้งาน (โมเดล `openai/*`)
- **การสมัครสมาชิก Codex พร้อมรันไทม์ Codex แบบเนทีฟ** - การลงชื่อเข้าใช้ ChatGPT/Codex พร้อมการรันบนแอปเซิร์ฟเวอร์ Codex (โมเดล `openai/*` พร้อม `agents.defaults.agentRuntime.id: "codex"`)
- **การสมัครสมาชิก Codex ผ่าน PI** - การลงชื่อเข้าใช้ ChatGPT/Codex ด้วยรันเนอร์ OpenClaw PI ปกติ (โมเดล `openai-codex/*`)

OpenAI รองรับการใช้งาน OAuth แบบสมัครสมาชิกในเครื่องมือและเวิร์กโฟลว์ภายนอกอย่าง OpenClaw อย่างชัดเจน

ผู้ให้บริการ โมเดล รันไทม์ และแชนเนลเป็นเลเยอร์ที่แยกจากกัน หากป้ายกำกับเหล่านั้นถูกปะปนกัน ให้อ่าน [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes) ก่อนเปลี่ยนการกำหนดค่า

## ตัวเลือกแบบรวดเร็ว

| เป้าหมาย                                                 | ใช้                                              | หมายเหตุ                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| การสมัครสมาชิก ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-5.5` พร้อม `agentRuntime.id: "codex"` | การตั้งค่า Codex ที่แนะนำสำหรับผู้ใช้ส่วนใหญ่ ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน `openai-codex` |
| การคิดค่าบริการด้วยคีย์ API โดยตรง                               | `openai/gpt-5.5`                                 | ตั้งค่า `OPENAI_API_KEY` หรือรันการเริ่มต้นใช้งานคีย์ API ของ OpenAI                    |
| การยืนยันตัวตนการสมัครสมาชิก ChatGPT/Codex ผ่าน PI           | `openai-codex/gpt-5.5`                           | ใช้เฉพาะเมื่อคุณตั้งใจต้องการรันเนอร์ PI ปกติ                |
| การสร้างหรือแก้ไขรูปภาพ                          | `openai/gpt-image-2`                             | ทำงานได้กับทั้ง `OPENAI_API_KEY` หรือ OpenAI Codex OAuth                 |
| รูปภาพพื้นหลังโปร่งใส                        | `openai/gpt-image-1.5`                           | ใช้ `outputFormat=png` หรือ `webp` และ `openai.background=transparent`     |

## แผนที่การตั้งชื่อ

ชื่อคล้ายกันแต่ใช้แทนกันไม่ได้:

| ชื่อที่คุณเห็น                       | เลเยอร์             | ความหมาย                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | คำนำหน้าผู้ให้บริการ   | เส้นทาง API ของ OpenAI Platform โดยตรง                                                                 |
| `openai-codex`                     | คำนำหน้าผู้ให้บริการ   | เส้นทาง OAuth/การสมัครสมาชิก OpenAI Codex ผ่านรันเนอร์ OpenClaw PI ปกติ                      |
| `codex` plugin                     | Plugin            | Plugin OpenClaw ที่รวมมาให้ ซึ่งให้รันไทม์แอปเซิร์ฟเวอร์ Codex แบบเนทีฟและตัวควบคุมแชต `/codex` |
| `agentRuntime.id: codex`           | รันไทม์ของเอเจนต์     | บังคับใช้ฮาร์เนสแอปเซิร์ฟเวอร์ Codex แบบเนทีฟสำหรับเทิร์นแบบฝัง                                     |
| `/codex ...`                       | ชุดคำสั่งแชต  | ผูก/ควบคุมเธรดแอปเซิร์ฟเวอร์ Codex จากการสนทนา                                        |
| `runtime: "acp", agentId: "codex"` | เส้นทางเซสชัน ACP | เส้นทางสำรองที่ระบุชัดเจนซึ่งรัน Codex ผ่าน ACP/acpx                                          |

หมายความว่าการกำหนดค่าสามารถมีทั้ง `openai-codex/*` และ Plugin `codex` ได้โดยตั้งใจ ซึ่งถูกต้องเมื่อคุณต้องการ Codex OAuth ผ่าน PI และยังต้องการให้ตัวควบคุมแชต `/codex` แบบเนทีฟพร้อมใช้งาน `openclaw doctor` จะเตือนเกี่ยวกับการรวมกันนี้เพื่อให้คุณยืนยันได้ว่าเป็นความตั้งใจ และจะไม่เขียนใหม่

<Note>
GPT-5.5 พร้อมใช้งานผ่านทั้งการเข้าถึงด้วยคีย์ API ของ OpenAI Platform โดยตรงและเส้นทางการสมัครสมาชิก/OAuth สำหรับการสมัครสมาชิก ChatGPT/Codex พร้อมการรัน Codex แบบเนทีฟ ให้ใช้ `openai/gpt-5.5` กับ `agentRuntime.id: "codex"` ใช้ `openai-codex/gpt-5.5` เฉพาะสำหรับ Codex OAuth ผ่าน PI หรือใช้ `openai/gpt-5.5` โดยไม่มีการ override รันไทม์ Codex สำหรับทราฟฟิก `OPENAI_API_KEY` โดยตรง
</Note>

<Note>
การเปิดใช้งาน Plugin OpenAI หรือการเลือกโมเดล `openai-codex/*` จะไม่เปิดใช้งาน Plugin แอปเซิร์ฟเวอร์ Codex ที่รวมมาให้ OpenClaw จะเปิดใช้งาน Plugin นั้นเฉพาะเมื่อคุณเลือกฮาร์เนส Codex แบบเนทีฟอย่างชัดเจนด้วย `agentRuntime.id: "codex"` หรือใช้การอ้างอิงโมเดล `codex/*` แบบเก่า
หาก Plugin `codex` ที่รวมมาให้ถูกเปิดใช้งาน แต่ `openai-codex/*` ยัง resolve ผ่าน PI อยู่ `openclaw doctor` จะเตือนและปล่อยเส้นทางไว้ไม่เปลี่ยนแปลง
</Note>

## ความครอบคลุมฟีเจอร์ของ OpenClaw

| ความสามารถของ OpenAI         | พื้นผิวของ OpenClaw                                           | สถานะ                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| แชต / Responses          | ผู้ให้บริการโมเดล `openai/<model>`                            | ใช่                                                    |
| โมเดลการสมัครสมาชิก Codex | `openai-codex/<model>` พร้อม OAuth `openai-codex`           | ใช่                                                    |
| ฮาร์เนสแอปเซิร์ฟเวอร์ Codex  | `openai/<model>` พร้อม `agentRuntime.id: codex`             | ใช่                                                    |
| การค้นเว็บฝั่งเซิร์ฟเวอร์    | เครื่องมือ OpenAI Responses แบบเนทีฟ                               | ใช่ เมื่อเปิดใช้งานการค้นเว็บและไม่ได้ปักหมุดผู้ให้บริการ |
| รูปภาพ                    | `image_generate`                                           | ใช่                                                    |
| วิดีโอ                    | `video_generate`                                           | ใช่                                                    |
| แปลงข้อความเป็นเสียง            | `messages.tts.provider: "openai"` / `tts`                  | ใช่                                                    |
| แปลงเสียงเป็นข้อความแบบแบตช์      | `tools.media.audio` / การทำความเข้าใจสื่อ                  | ใช่                                                    |
| แปลงเสียงเป็นข้อความแบบสตรีมมิง  | Voice Call `streaming.provider: "openai"`                  | ใช่                                                    |
| เสียงแบบเรียลไทม์            | Voice Call `realtime.provider: "openai"` / Control UI Talk | ใช่                                                    |
| Embeddings                | ผู้ให้บริการ embedding หน่วยความจำ                                  | ใช่                                                    |

## Memory embeddings

OpenClaw สามารถใช้ OpenAI หรือ endpoint embedding ที่เข้ากันได้กับ OpenAI สำหรับการทำดัชนี `memory_search` และ query embeddings:

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

สำหรับ endpoint ที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้ป้ายกำกับ embedding แบบอสมมาตร ให้ตั้งค่า `queryInputType` และ `documentInputType` ภายใต้ `memorySearch` OpenClaw จะส่งค่าเหล่านั้นต่อเป็นฟิลด์คำขอ `input_type` เฉพาะผู้ให้บริการ: query embeddings ใช้ `queryInputType`; ชิ้นส่วนหน่วยความจำที่ทำดัชนีและการทำดัชนีแบบแบตช์ใช้ `documentInputType` ดูตัวอย่างเต็มได้ที่ [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config#provider-specific-config)

## เริ่มต้นใช้งาน

เลือกวิธียืนยันตัวตนที่คุณต้องการและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="คีย์ API (OpenAI Platform)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง API โดยตรงและการคิดค่าบริการตามการใช้งาน

    <Steps>
      <Step title="รับคีย์ API ของคุณ">
        สร้างหรือคัดลอกคีย์ API จาก [แดชบอร์ด OpenAI Platform](https://platform.openai.com/api-keys)
      </Step>
      <Step title="รันการเริ่มต้นใช้งาน">
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

    | การอ้างอิงโมเดล              | การกำหนดค่ารันไทม์             | เส้นทาง                       | การยืนยันตัวตน             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | ละไว้ / `agentRuntime.id: "pi"`    | API ของ OpenAI Platform โดยตรง  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | ละไว้ / `agentRuntime.id: "pi"`    | API ของ OpenAI Platform โดยตรง  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | ฮาร์เนสแอปเซิร์ฟเวอร์ Codex    | แอปเซิร์ฟเวอร์ Codex |

    <Note>
    `openai/*` คือเส้นทางคีย์ API ของ OpenAI โดยตรง เว้นแต่คุณจะบังคับใช้ฮาร์เนสแอปเซิร์ฟเวอร์ Codex อย่างชัดเจน ใช้ `openai-codex/*` สำหรับ Codex OAuth ผ่านรันเนอร์ PI เริ่มต้น หรือใช้ `openai/gpt-5.5` กับ `agentRuntime.id: "codex"` สำหรับการรันแอปเซิร์ฟเวอร์ Codex แบบเนทีฟ
    </Note>

    ### ตัวอย่างการกำหนดค่า

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw ไม่ได้เปิดเผย `openai/gpt-5.3-codex-spark` คำขอ OpenAI API แบบสดจะปฏิเสธโมเดลนั้น และแค็ตตาล็อก Codex ปัจจุบันก็ไม่ได้เปิดเผยโมเดลนั้นเช่นกัน
    </Warning>

  </Tab>

  <Tab title="การสมัครสมาชิก Codex">
    **เหมาะที่สุดสำหรับ:** การใช้การสมัครสมาชิก ChatGPT/Codex ของคุณกับการรันแอปเซิร์ฟเวอร์ Codex แบบเนทีฟแทนคีย์ API แยกต่างหาก Codex cloud ต้องใช้การลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="รัน Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        หรือรัน OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        สำหรับการตั้งค่าแบบ headless หรือที่ไม่เป็นมิตรกับ callback ให้เพิ่ม `--device-code` เพื่อลงชื่อเข้าใช้ด้วยโฟลว์ device-code ของ ChatGPT แทน callback ผ่านเบราว์เซอร์ localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="ใช้รันไทม์ Codex แบบเนทีฟ">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="ตรวจสอบว่าการยืนยันตัวตน Codex พร้อมใช้งาน">
        ```bash
        openclaw models list --provider openai-codex
        ```

        หลังจาก Gateway ทำงานแล้ว ให้ส่ง `/codex status` หรือ `/codex models`
        ในแชตเพื่อตรวจสอบรันไทม์แอปเซิร์ฟเวอร์แบบเนทีฟ
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | การอ้างอิงโมเดล | การกำหนดค่ารันไทม์ | เส้นทาง | การยืนยันตัวตน |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | ฮาร์เนสแอปเซิร์ฟเวอร์ Codex แบบเนทีฟ | การลงชื่อเข้าใช้ Codex หรือโปรไฟล์ `openai-codex` ที่เลือก |
    | `openai-codex/gpt-5.5` | ละไว้ / `runtime: "pi"` | ChatGPT/Codex OAuth ผ่าน PI | การลงชื่อเข้าใช้ Codex |
    | `openai-codex/gpt-5.4-mini` | ละไว้ / `runtime: "pi"` | ChatGPT/Codex OAuth ผ่าน PI | การลงชื่อเข้าใช้ Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | ยังคงเป็น PI เว้นแต่ Plugin จะอ้างสิทธิ์ `openai-codex` อย่างชัดเจน | การลงชื่อเข้าใช้ Codex |

    <Note>
    ใช้ id ผู้ให้บริการ `openai-codex` สำหรับคำสั่ง auth/profile ต่อไป คำนำหน้าโมเดล
    `openai-codex/*` ยังเป็นเส้นทาง PI แบบระบุชัดเจนสำหรับ Codex OAuth ด้วย
    ค่านี้ไม่ได้เลือกหรือเปิดใช้ harness app-server ของ Codex ที่บันเดิลมาโดยอัตโนมัติ สำหรับ
    การตั้งค่าทั่วไปแบบมีการสมัครสมาชิกพร้อม runtime ดั้งเดิม ให้ลงชื่อเข้าใช้ด้วย
    `openai-codex` แต่คงการอ้างอิงโมเดลเป็น `openai/gpt-5.5` และตั้งค่า
    `agentRuntime.id: "codex"`
    </Note>

    ### ตัวอย่างการตั้งค่า

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    หากต้องการให้ Codex OAuth อยู่บนตัวรัน PI ปกติแทน ให้ใช้
    `openai-codex/gpt-5.5` และละเว้นการ override runtime ของ Codex

    <Note>
    Onboarding จะไม่นำเข้าข้อมูล OAuth จาก `~/.codex` อีกต่อไป ลงชื่อเข้าใช้ด้วย OAuth ผ่านเบราว์เซอร์ (ค่าเริ่มต้น) หรือโฟลว์ device-code ด้านบน — OpenClaw จะจัดการข้อมูลรับรองที่ได้ในที่เก็บ auth ของ agent ของตัวเอง
    </Note>

    ### ตัวบ่งชี้สถานะ

    แชต `/status` จะแสดงว่า runtime ของโมเดลใดทำงานอยู่สำหรับเซสชันปัจจุบัน
    harness PI เริ่มต้นจะแสดงเป็น `Runtime: OpenClaw Pi Default` เมื่อเลือก
    harness app-server ของ Codex ที่บันเดิลมา `/status` จะแสดง
    `Runtime: OpenAI Codex` เซสชันที่มีอยู่จะคง id ของ harness ที่บันทึกไว้ ดังนั้นให้ใช้
    `/new` หรือ `/reset` หลังจากเปลี่ยน `agentRuntime` หากต้องการให้ `/status`
    สะท้อนตัวเลือก PI/Codex ใหม่

    ### คำเตือนของ Doctor

    หาก Plugin `codex` ที่บันเดิลมาเปิดใช้อยู่ในขณะที่เลือกเส้นทาง `openai-codex/*`
    `openclaw doctor` จะเตือนว่าโมเดลยังคง resolve ผ่าน PI
    คงการตั้งค่าเดิมไว้เฉพาะเมื่อเส้นทาง auth ผ่านการสมัครสมาชิก PI นั้นเป็น
    ความตั้งใจ เปลี่ยนเป็น `openai/<model>` พร้อม `agentRuntime.id: "codex"` เมื่อ
    ต้องการการทำงานของ app-server Codex แบบดั้งเดิม

    ### ขีดจำกัดหน้าต่างบริบท

    OpenClaw ถือว่า metadata ของโมเดลและขีดจำกัดบริบทของ runtime เป็นคนละค่า

    สำหรับ `openai-codex/gpt-5.5` ผ่าน Codex OAuth:

    - `contextWindow` ดั้งเดิม: `1000000`
    - ขีดจำกัด `contextTokens` ของ runtime เริ่มต้น: `272000`

    ขีดจำกัดเริ่มต้นที่เล็กกว่ามีคุณลักษณะด้าน latency และคุณภาพที่ดีกว่าในทางปฏิบัติ override ได้ด้วย `contextTokens`:

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
    ใช้ `contextWindow` เพื่อประกาศ metadata ของโมเดลดั้งเดิม ใช้ `contextTokens` เพื่อจำกัดงบประมาณบริบทของ runtime
    </Note>

    ### การกู้คืน Catalog

    OpenClaw ใช้ metadata catalog ของ Codex ต้นทางสำหรับ `gpt-5.5` เมื่อมีอยู่
    หากการค้นหา Codex แบบ live ละเว้นแถว `openai-codex/gpt-5.5` ในขณะที่
    บัญชีผ่านการรับรองความถูกต้องแล้ว OpenClaw จะสังเคราะห์แถวโมเดล OAuth นั้นเพื่อให้
    การรัน cron, sub-agent และโมเดลเริ่มต้นที่กำหนดค่าไว้ไม่ล้มเหลวด้วย
    `Unknown model`

  </Tab>
</Tabs>

## Auth ของ app-server Codex ดั้งเดิม

harness app-server Codex ดั้งเดิมใช้การอ้างอิงโมเดล `openai/*` พร้อม
`agentRuntime.id: "codex"` แต่ auth ยังคงอิงตามบัญชี OpenClaw
เลือก auth ตามลำดับนี้:

1. โปรไฟล์ auth `openai-codex` ของ OpenClaw ที่ระบุชัดเจนและผูกกับ agent
2. บัญชีที่มีอยู่ของ app-server เช่น การลงชื่อเข้าใช้ ChatGPT ของ Codex CLI ในเครื่อง
3. สำหรับการเรียกใช้ app-server แบบ stdio ในเครื่องเท่านั้น ใช้ `CODEX_API_KEY` แล้วตามด้วย
   `OPENAI_API_KEY` เมื่อ app-server รายงานว่าไม่มีบัญชีและยังต้องใช้
   auth ของ OpenAI

นั่นหมายความว่าการลงชื่อเข้าใช้ด้วยการสมัครสมาชิก ChatGPT/Codex ในเครื่องจะไม่ถูกแทนที่เพียง
เพราะ process Gateway มี `OPENAI_API_KEY` สำหรับโมเดล OpenAI โดยตรง
หรือ embeddings ด้วย fallback แบบ env API-key ใช้เฉพาะเส้นทาง stdio ในเครื่องที่ไม่มีบัญชีเท่านั้น และ
จะไม่ถูกส่งไปยังการเชื่อมต่อ app-server แบบ WebSocket เมื่อเลือกโปรไฟล์ Codex
แบบการสมัครสมาชิก OpenClaw ยังกัน `CODEX_API_KEY` และ `OPENAI_API_KEY`
ออกจาก child app-server stdio ที่ spawn ขึ้น และส่งข้อมูลรับรองที่เลือก
ผ่าน RPC เข้าสู่ระบบของ app-server

## การสร้างภาพ

Plugin `openai` ที่บันเดิลมาจะลงทะเบียนการสร้างภาพผ่านเครื่องมือ `image_generate`
รองรับทั้งการสร้างภาพด้วย API key ของ OpenAI และการสร้างภาพด้วย Codex OAuth
ผ่านการอ้างอิงโมเดล `openai/gpt-image-2` เดียวกัน

| ความสามารถ                | API key ของ OpenAI                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| การอ้างอิงโมเดล                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | การลงชื่อเข้าใช้ OpenAI Codex OAuth           |
| การขนส่ง                 | OpenAI Images API                  | backend Codex Responses              |
| จำนวนภาพสูงสุดต่อคำขอ    | 4                                  | 4                                    |
| โหมดแก้ไข                 | เปิดใช้ (สูงสุด 5 ภาพอ้างอิง) | เปิดใช้ (สูงสุด 5 ภาพอ้างอิง)   |
| การ override ขนาด            | รองรับ รวมถึงขนาด 2K/4K   | รองรับ รวมถึงขนาด 2K/4K     |
| อัตราส่วนภาพ / ความละเอียด | ไม่ส่งต่อไปยัง OpenAI Images API | map เป็นขนาดที่รองรับเมื่อปลอดภัย |

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
ดู [การสร้างภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

`gpt-image-2` เป็นค่าเริ่มต้นสำหรับทั้งการสร้างภาพจากข้อความของ OpenAI และการ
แก้ไขภาพ `gpt-image-1.5`, `gpt-image-1` และ `gpt-image-1-mini` ยังสามารถใช้เป็น
การ override โมเดลแบบระบุชัดเจน ใช้ `openai/gpt-image-1.5` สำหรับเอาต์พุต
PNG/WebP แบบพื้นหลังโปร่งใส API `gpt-image-2` ปัจจุบันปฏิเสธ
`background: "transparent"`

สำหรับคำขอพื้นหลังโปร่งใส agent ควรเรียก `image_generate` ด้วย
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` หรือ `"webp"` และ
`background: "transparent"`; ตัวเลือกผู้ให้บริการ `openai.background` รุ่นเก่า
ยังรองรับอยู่ OpenClaw ยังปกป้องเส้นทาง OpenAI สาธารณะและ
OpenAI Codex OAuth โดยเขียนคำขอพื้นหลังโปร่งใส `openai/gpt-image-2` เริ่มต้นใหม่
เป็น `gpt-image-1.5`; endpoint ของ Azure และ OpenAI-compatible แบบกำหนดเองจะคง
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
`--openai-background` ยังคงใช้งานได้ในฐานะ alias เฉพาะ OpenAI

สำหรับการติดตั้ง Codex OAuth ให้คงการอ้างอิง `openai/gpt-image-2` เดิมไว้ เมื่อกำหนดค่า
โปรไฟล์ OAuth `openai-codex` แล้ว OpenClaw จะ resolve token การเข้าถึง OAuth
ที่เก็บไว้และส่งคำขอภาพผ่าน backend Codex Responses โดย
จะไม่ลอง `OPENAI_API_KEY` ก่อนหรือ fallback ไปยัง API key อย่างเงียบ ๆ สำหรับคำขอนั้น
กำหนดค่า `models.providers.openai` อย่างชัดเจนด้วย API key,
URL ฐานแบบกำหนดเอง หรือ endpoint ของ Azure เมื่อต้องการใช้เส้นทาง OpenAI Images API
โดยตรงแทน
หาก endpoint ภาพแบบกำหนดเองนั้นอยู่บนที่อยู่ LAN/ส่วนตัวที่เชื่อถือได้ ให้ตั้งค่า
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ด้วย OpenClaw จะยังบล็อก
endpoint ภาพ OpenAI-compatible แบบส่วนตัว/ภายใน เว้นแต่จะมีการ opt-in นี้อยู่

สร้าง:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

สร้าง PNG โปร่งใส:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

แก้ไข:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## การสร้างวิดีโอ

Plugin `openai` ที่บันเดิลมาจะลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ `video_generate`

| ความสามารถ       | ค่า                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| โมเดลเริ่มต้น    | `openai/sora-2`                                                                   |
| โหมด            | ข้อความเป็นวิดีโอ, ภาพเป็นวิดีโอ, แก้ไขวิดีโอเดียว                                  |
| อินพุตอ้างอิง | 1 ภาพหรือ 1 วิดีโอ                                                                |
| การ override ขนาด   | รองรับ                                                                         |
| การ override อื่น ๆ  | `aspectRatio`, `resolution`, `audio`, `watermark` จะถูกละเว้นพร้อมคำเตือนของเครื่องมือ |

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การมีส่วนร่วมของ prompt GPT-5

OpenClaw เพิ่มการมีส่วนร่วมของ prompt GPT-5 ที่ใช้ร่วมกันสำหรับการรันตระกูล GPT-5 ข้ามผู้ให้บริการ โดยใช้ตาม id โมเดล ดังนั้น `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` และการอ้างอิง GPT-5 อื่น ๆ ที่เข้ากันได้จะได้รับ overlay เดียวกัน โมเดล GPT-4.x ที่เก่ากว่าจะไม่ได้รับ

harness Codex ดั้งเดิมที่บันเดิลมาใช้พฤติกรรม GPT-5 เดียวกันและ overlay Heartbeat ผ่านคำสั่งสำหรับนักพัฒนาของ app-server Codex ดังนั้นเซสชัน `openai/gpt-5.x` ที่บังคับผ่าน `agentRuntime.id: "codex"` จะคงแนวทางการทำงานให้จบและ Heartbeat เชิงรุกเดิม แม้ว่า Codex จะเป็นเจ้าของส่วนที่เหลือของ prompt harness ก็ตาม

การมีส่วนร่วมของ GPT-5 เพิ่มสัญญาพฤติกรรมแบบ tagged สำหรับการคง persona, ความปลอดภัยในการดำเนินการ, วินัยการใช้เครื่องมือ, รูปแบบเอาต์พุต, การตรวจสอบความสมบูรณ์ และการยืนยันผล พฤติกรรมการตอบกลับและข้อความเงียบเฉพาะช่องทางยังอยู่ใน prompt ระบบ OpenClaw ที่ใช้ร่วมกันและนโยบายการส่งออก คำแนะนำ GPT-5 เปิดใช้อยู่เสมอสำหรับโมเดลที่ตรงกัน เลเยอร์สไตล์การโต้ตอบที่เป็นมิตรแยกต่างหากและกำหนดค่าได้

| ค่า                  | ผล                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้เลเยอร์สไตล์การโต้ตอบที่เป็นมิตร |
| `"on"`                 | alias สำหรับ `"friendly"`                      |
| `"off"`                | ปิดเฉพาะเลเยอร์สไตล์ที่เป็นมิตร       |

<Tabs>
  <Tab title="การตั้งค่า">
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
ค่าจะไม่แยกตัวพิมพ์เล็กใหญ่ที่ runtime ดังนั้น `"Off"` และ `"off"` ต่างก็ปิดเลเยอร์สไตล์ที่เป็นมิตร
</Tip>

<Note>
`plugins.entries.openai.config.personality` รุ่นเก่ายังคงถูกอ่านเป็น fallback เพื่อความเข้ากันได้เมื่อไม่ได้ตั้งค่า `agents.defaults.promptOverlays.gpt5.personality` ที่ใช้ร่วมกัน
</Note>

## เสียงและคำพูด

<AccordionGroup>
  <Accordion title="การสังเคราะห์เสียงพูด (TTS)">
    Plugin `openai` ที่บันเดิลมาจะลงทะเบียนการสังเคราะห์เสียงพูดสำหรับพื้นผิว `messages.tts`

    | การตั้งค่า | เส้นทางการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | เสียง | `messages.tts.providers.openai.voice` | `coral` |
    | ความเร็ว | `messages.tts.providers.openai.speed` | (ไม่ได้ตั้งค่า) |
    | คำสั่ง | `messages.tts.providers.openai.instructions` | (ไม่ได้ตั้งค่า, เฉพาะ `gpt-4o-mini-tts`) |
    | รูปแบบ | `messages.tts.providers.openai.responseFormat` | `opus` สำหรับข้อความเสียง, `mp3` สำหรับไฟล์ |
    | คีย์ API | `messages.tts.providers.openai.apiKey` | สำรองไปใช้ `OPENAI_API_KEY` |
    | URL ฐาน | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | บอดีเพิ่มเติม | `messages.tts.providers.openai.extraBody` / `extra_body` | (ไม่ได้ตั้งค่า) |

    โมเดลที่มีให้ใช้: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd` เสียงที่มีให้ใช้: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`

    `extraBody` จะถูกรวมเข้าใน JSON คำขอ `/audio/speech` หลังฟิลด์ที่ OpenClaw สร้างไว้ ดังนั้นให้ใช้สำหรับเอนด์พอยต์ที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้คีย์เพิ่มเติม เช่น `lang` คีย์ Prototype จะถูกละเว้น

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
    ตั้งค่า `OPENAI_TTS_BASE_URL` เพื่อแทนที่ URL ฐานของ TTS โดยไม่กระทบต่อเอนด์พอยต์ API แชต
    </Note>

  </Accordion>

  <Accordion title="การแปลงเสียงเป็นข้อความ">
    Plugin `openai` ที่มาพร้อมชุดจะลงทะเบียนการแปลงเสียงเป็นข้อความแบบแบตช์ผ่านพื้นผิวการถอดเสียงเพื่อทำความเข้าใจสื่อของ OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - เอนด์พอยต์: OpenAI REST `/v1/audio/transcriptions`
    - เส้นทางอินพุต: การอัปโหลดไฟล์เสียงแบบ multipart
    - รองรับโดย OpenClaw ในทุกที่ที่การถอดเสียงขาเข้าใช้
      `tools.media.audio` รวมถึงเซ็กเมนต์ช่องเสียงของ Discord และไฟล์แนบเสียงของช่องทาง

    หากต้องการบังคับใช้ OpenAI สำหรับการถอดเสียงขาเข้า:

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

    คำใบ้ภาษาและพรอมป์จะถูกส่งต่อไปยัง OpenAI เมื่อมีการระบุไว้โดยการกำหนดค่าสื่อเสียงร่วม หรือคำขอถอดเสียงรายครั้ง

  </Accordion>

  <Accordion title="การถอดเสียงแบบเรียลไทม์">
    Plugin `openai` ที่มาพร้อมชุดจะลงทะเบียนการถอดเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | เส้นทางการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | ภาษา | `...openai.language` | (ไม่ได้ตั้งค่า) |
    | พรอมป์ | `...openai.prompt` | (ไม่ได้ตั้งค่า) |
    | ระยะเวลาความเงียบ | `...openai.silenceDurationMs` | `800` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | คีย์ API | `...openai.apiKey` | สำรองไปใช้ `OPENAI_API_KEY` |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียง G.711 u-law (`g711_ulaw` / `audio/pcmu`) ผู้ให้บริการสตรีมมิงนี้ใช้สำหรับเส้นทางการถอดเสียงแบบเรียลไทม์ของ Voice Call; ระบบเสียงของ Discord ปัจจุบันจะบันทึกเซ็กเมนต์สั้น ๆ และใช้เส้นทางการถอดเสียงแบบแบตช์ `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="เสียงแบบเรียลไทม์">
    Plugin `openai` ที่มาพร้อมชุดจะลงทะเบียนเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | เส้นทางการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | เสียง | `...openai.voice` | `alloy` |
    | อุณหภูมิ | `...openai.temperature` | `0.8` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | ระยะเวลาความเงียบ | `...openai.silenceDurationMs` | `500` |
    | คีย์ API | `...openai.apiKey` | สำรองไปใช้ `OPENAI_API_KEY` |

    <Note>
    รองรับ Azure OpenAI ผ่านคีย์การกำหนดค่า `azureEndpoint` และ `azureDeployment` สำหรับบริดจ์เรียลไทม์ฝั่งแบ็กเอนด์ รองรับการเรียกใช้เครื่องมือแบบสองทิศทาง ใช้รูปแบบเสียง G.711 u-law
    </Note>

    <Note>
    Control UI Talk ใช้เซสชันเรียลไทม์ของ OpenAI บนเบราว์เซอร์ พร้อม client secret ชั่วคราวที่ Gateway สร้างขึ้น และการแลกเปลี่ยน WebRTC SDP โดยตรงของเบราว์เซอร์กับ OpenAI Realtime API ผู้ดูแลสามารถตรวจสอบแบบสดได้ด้วย `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`; ฝั่ง OpenAI จะสร้าง client secret ใน Node สร้างข้อเสนอ SDP ของเบราว์เซอร์พร้อมสื่อไมโครโฟนจำลอง โพสต์ไปยัง OpenAI และใช้คำตอบ SDP โดยไม่บันทึกข้อมูลลับลงล็อก
    </Note>

  </Accordion>
</AccordionGroup>

## เอนด์พอยต์ Azure OpenAI

ผู้ให้บริการ `openai` ที่มาพร้อมชุดสามารถชี้ไปยังทรัพยากร Azure OpenAI สำหรับการสร้างภาพได้โดยการแทนที่ URL ฐาน ในเส้นทางการสร้างภาพ OpenClaw จะตรวจจับชื่อโฮสต์ Azure บน `models.providers.openai.baseUrl` และสลับไปใช้รูปแบบคำขอของ Azure โดยอัตโนมัติ

<Note>
เสียงแบบเรียลไทม์ใช้เส้นทางการกำหนดค่าแยกต่างหาก
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
และไม่ได้รับผลจาก `models.providers.openai.baseUrl` ดูแอคคอร์เดียน **เสียงแบบเรียลไทม์** ใต้ [เสียงและคำพูด](#voice-and-speech) สำหรับการตั้งค่า Azure ของส่วนนี้
</Note>

ใช้ Azure OpenAI เมื่อ:

- คุณมีการสมัครใช้งาน Azure OpenAI, โควตา หรือข้อตกลงระดับองค์กรอยู่แล้ว
- คุณต้องการการเก็บข้อมูลในภูมิภาคหรือการควบคุมการปฏิบัติตามข้อกำหนดที่ Azure มีให้
- คุณต้องการให้ทราฟฟิกอยู่ภายในผู้เช่า Azure ที่มีอยู่

### การกำหนดค่า

สำหรับการสร้างภาพด้วย Azure ผ่านผู้ให้บริการ `openai` ที่มาพร้อมชุด ให้ชี้
`models.providers.openai.baseUrl` ไปยังทรัพยากร Azure ของคุณ และตั้งค่า `apiKey` เป็นคีย์ Azure OpenAI (ไม่ใช่คีย์ OpenAI Platform):

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

OpenClaw จดจำส่วนต่อท้ายโฮสต์ Azure เหล่านี้สำหรับเส้นทางการสร้างภาพของ Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

สำหรับคำขอสร้างภาพบนโฮสต์ Azure ที่จดจำได้ OpenClaw จะ:

- ส่งส่วนหัว `api-key` แทน `Authorization: Bearer`
- ใช้เส้นทางตามขอบเขต deployment (`/openai/deployments/{deployment}/...`)
- เติม `?api-version=...` ต่อท้ายแต่ละคำขอ
- ใช้ timeout คำขอเริ่มต้น 600 วินาทีสำหรับการเรียกสร้างภาพของ Azure
  ค่า `timeoutMs` รายครั้งยังคงแทนที่ค่าเริ่มต้นนี้ได้

URL ฐานอื่น ๆ (OpenAI สาธารณะ, พร็อกซีที่เข้ากันได้กับ OpenAI) จะยังคงใช้รูปแบบคำขอภาพมาตรฐานของ OpenAI

<Note>
การกำหนดเส้นทาง Azure สำหรับเส้นทางการสร้างภาพของผู้ให้บริการ `openai` ต้องใช้
OpenClaw 2026.4.22 หรือใหม่กว่า เวอร์ชันก่อนหน้าจะปฏิบัติต่อ `openai.baseUrl` แบบกำหนดเองเหมือนเอนด์พอยต์ OpenAI สาธารณะ และจะล้มเหลวกับ deployment ภาพของ Azure
</Note>

### เวอร์ชัน API

ตั้งค่า `AZURE_OPENAI_API_VERSION` เพื่อตรึงเวอร์ชันพรีวิวหรือ GA ของ Azure ที่เฉพาะเจาะจงสำหรับเส้นทางการสร้างภาพของ Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

ค่าเริ่มต้นคือ `2024-12-01-preview` เมื่อไม่ได้ตั้งค่าตัวแปร

### ชื่อโมเดลคือชื่อ deployment

Azure OpenAI ผูกโมเดลกับ deployment สำหรับคำขอสร้างภาพของ Azure ที่กำหนดเส้นทางผ่านผู้ให้บริการ `openai` ที่มาพร้อมชุด ฟิลด์ `model` ใน OpenClaw ต้องเป็น **ชื่อ deployment ของ Azure** ที่คุณกำหนดค่าไว้ในพอร์ทัล Azure ไม่ใช่รหัสโมเดล OpenAI สาธารณะ

หากคุณสร้าง deployment ชื่อ `gpt-image-2-prod` ที่ให้บริการ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

กฎชื่อ deployment เดียวกันนี้ใช้กับการเรียกสร้างภาพที่กำหนดเส้นทางผ่านผู้ให้บริการ `openai` ที่มาพร้อมชุด

### ความพร้อมใช้งานตามภูมิภาค

ขณะนี้การสร้างภาพของ Azure พร้อมใช้งานเฉพาะในบางภูมิภาคเท่านั้น
(เช่น `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`) ตรวจสอบรายชื่อภูมิภาคปัจจุบันของ Microsoft ก่อนสร้าง deployment และยืนยันว่าโมเดลที่ต้องการมีให้ใช้ในภูมิภาคของคุณ

### ความแตกต่างของพารามิเตอร์

Azure OpenAI และ OpenAI สาธารณะไม่ได้ยอมรับพารามิเตอร์ภาพชุดเดียวกันเสมอไป
Azure อาจปฏิเสธตัวเลือกที่ OpenAI สาธารณะอนุญาต (เช่นค่า `background` บางค่าใน `gpt-image-2`) หรือเปิดเผยตัวเลือกเหล่านั้นเฉพาะในเวอร์ชันโมเดลบางรุ่น ความแตกต่างเหล่านี้มาจาก Azure และโมเดลพื้นฐาน ไม่ใช่ OpenClaw หากคำขอ Azure ล้มเหลวด้วยข้อผิดพลาดการตรวจสอบความถูกต้อง ให้ตรวจสอบชุดพารามิเตอร์ที่รองรับโดย deployment และเวอร์ชัน API เฉพาะของคุณในพอร์ทัล Azure

<Note>
Azure OpenAI ใช้การขนส่งแบบเนทีฟและพฤติกรรมความเข้ากันได้ แต่ไม่ได้รับส่วนหัวการระบุที่มาที่ซ่อนอยู่ของ OpenClaw โปรดดูแอคคอร์เดียน **เส้นทางแบบเนทีฟเทียบกับแบบที่เข้ากันได้กับ OpenAI** ใต้ [การกำหนดค่าขั้นสูง](#advanced-configuration)

สำหรับทราฟฟิกแชตหรือ Responses บน Azure (นอกเหนือจากการสร้างภาพ) ให้ใช้ขั้นตอนเริ่มต้นใช้งานหรือการกำหนดค่าผู้ให้บริการ Azure เฉพาะ การตั้งค่า `openai.baseUrl` เพียงอย่างเดียวจะไม่ใช้รูปแบบ API/การยืนยันตัวตนของ Azure มีผู้ให้บริการ `azure-openai-responses/*` แยกต่างหาก ดูแอคคอร์เดียน Compaction ฝั่งเซิร์ฟเวอร์ด้านล่าง
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การขนส่ง (WebSocket เทียบกับ SSE)">
    OpenClaw ใช้ WebSocket ก่อนพร้อม SSE เป็นทางสำรอง (`"auto"`) สำหรับทั้ง `openai/*` และ `openai-codex/*`

    ในโหมด `"auto"` OpenClaw จะ:
    - ลองความล้มเหลวของ WebSocket ช่วงต้นอีกหนึ่งครั้งก่อนเปลี่ยนไปใช้ SSE
    - หลังจากเกิดความล้มเหลว จะทำเครื่องหมาย WebSocket ว่าคุณภาพลดลงเป็นเวลาประมาณ 60 วินาที และใช้ SSE ในช่วงพัก
    - แนบส่วนหัวระบุตัวตนของเซสชันและรอบการสนทนาที่คงที่สำหรับการลองใหม่และการเชื่อมต่อใหม่
    - ปรับตัวนับการใช้งาน (`input_tokens` / `prompt_tokens`) ให้เป็นมาตรฐานข้ามตัวเลือกการขนส่ง

    | ค่า | ลักษณะการทำงาน |
    |-------|----------|
    | `"auto"` (ค่าเริ่มต้น) | WebSocket ก่อน, SSE เป็นทางสำรอง |
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
    - [Realtime API ด้วย WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [การตอบกลับ API แบบสตรีม (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="การวอร์มอัป WebSocket">
    OpenClaw เปิดใช้การวอร์มอัป WebSocket เป็นค่าเริ่มต้นสำหรับ `openai/*` และ `openai-codex/*` เพื่อลดเวลาแฝงของรอบแรก

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
    OpenClaw เปิดเผยตัวสลับโหมดเร็วร่วมสำหรับ `openai/*` และ `openai-codex/*`:

    - **แชต/UI:** `/fast status|on|off`
    - **การกำหนดค่า:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    เมื่อเปิดใช้ OpenClaw จะแมปโหมดเร็วไปยังการประมวลผลแบบมีลำดับความสำคัญของ OpenAI (`service_tier = "priority"`) ค่า `service_tier` ที่มีอยู่จะถูกคงไว้ และโหมดเร็วจะไม่เขียน `reasoning` หรือ `text.verbosity` ใหม่

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
    ค่าทับซ้อนระดับเซสชันมีผลเหนือกว่าการกำหนดค่า การล้างค่าทับซ้อนของเซสชันใน UI เซสชันจะคืนเซสชันกลับไปใช้ค่าเริ่มต้นที่กำหนดค่าไว้
    </Note>

  </Accordion>

  <Accordion title="การประมวลผลแบบมีลำดับความสำคัญ (service_tier)">
    API ของ OpenAI เปิดเผยการประมวลผลแบบมีลำดับความสำคัญผ่าน `service_tier` ตั้งค่านี้ต่อโมเดลใน OpenClaw:

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

    ค่าที่รองรับ: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` จะถูกส่งต่อไปยัง endpoint ดั้งเดิมของ OpenAI (`api.openai.com`) และ endpoint ดั้งเดิมของ Codex (`chatgpt.com/backend-api`) เท่านั้น หากคุณกำหนดเส้นทางผู้ให้บริการใดผู้ให้บริการหนึ่งผ่านพร็อกซี OpenClaw จะปล่อย `service_tier` ไว้โดยไม่แก้ไข
    </Warning>

  </Accordion>

  <Accordion title="Compaction ฝั่งเซิร์ฟเวอร์ (Responses API)">
    สำหรับโมเดล OpenAI Responses โดยตรง (`openai/*` บน `api.openai.com`) ตัวห่อสตรีม Pi-harness ของ Plugin OpenAI จะเปิดใช้ Compaction ฝั่งเซิร์ฟเวอร์โดยอัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ความเข้ากันได้ของโมเดลจะตั้งค่า `supportsStore: false`)
    - แทรก `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - ค่าเริ่มต้น `compact_threshold`: 70% ของ `contextWindow` (หรือ `80000` เมื่อไม่มีค่า)

    สิ่งนี้ใช้กับเส้นทาง Pi harness ในตัว และกับ hook ของผู้ให้บริการ OpenAI ที่ใช้โดยการรันแบบฝังตัว ส่วน harness ของแอปเซิร์ฟเวอร์ Codex ดั้งเดิมจะจัดการบริบทของตัวเองผ่าน Codex และกำหนดค่าแยกต่างหากด้วย `agents.defaults.agentRuntime.id`

    <Tabs>
      <Tab title="เปิดใช้อย่างชัดเจน">
        มีประโยชน์สำหรับ endpoint ที่เข้ากันได้ เช่น Azure OpenAI Responses:

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
      <Tab title="เกณฑ์แบบกำหนดเอง">
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
    `responsesServerCompaction` ควบคุมเฉพาะการแทรก `context_management` เท่านั้น โมเดล OpenAI Responses โดยตรงยังคงบังคับ `store: true` เว้นแต่ความเข้ากันได้จะตั้งค่า `supportsStore: false`
    </Note>

  </Accordion>

  <Accordion title="โหมด GPT แบบ strict-agentic">
    สำหรับการรันตระกูล GPT-5 บน `openai/*` OpenClaw สามารถใช้สัญญาการทำงานแบบฝังตัวที่เข้มงวดยิ่งขึ้นได้:

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
    - ไม่ถือว่าเทิร์นที่มีแต่แผนเป็นความคืบหน้าที่สำเร็จอีกต่อไป เมื่อมีการทำงานผ่านเครื่องมือให้ใช้ได้
    - ลองเทิร์นนั้นใหม่พร้อมการชี้นำให้ลงมือทำทันที
    - เปิดใช้ `update_plan` โดยอัตโนมัติสำหรับงานที่มีนัยสำคัญ
    - แสดงสถานะถูกบล็อกอย่างชัดเจนหากโมเดลยังคงวางแผนโดยไม่ลงมือทำ

    <Note>
    จำกัดเฉพาะการรันตระกูล GPT-5 ของ OpenAI และ Codex เท่านั้น ผู้ให้บริการอื่นและตระกูลโมเดลรุ่นเก่ายังคงใช้พฤติกรรมเริ่มต้น
    </Note>

  </Accordion>

  <Accordion title="เส้นทางดั้งเดิมเทียบกับเส้นทางที่เข้ากันได้กับ OpenAI">
    OpenClaw ปฏิบัติต่อ endpoint ของ OpenAI โดยตรง, Codex และ Azure OpenAI แตกต่างจากพร็อกซี `/v1` ทั่วไปที่เข้ากันได้กับ OpenAI:

    **เส้นทางดั้งเดิม** (`openai/*`, Azure OpenAI):
    - เก็บ `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับ effort `none` ของ OpenAI
    - ละเว้น reasoning ที่ปิดใช้งานสำหรับโมเดลหรือพร็อกซีที่ปฏิเสธ `reasoning.effort: "none"`
    - ตั้งค่าสคีมาของเครื่องมือเป็นโหมดเข้มงวดโดยค่าเริ่มต้น
    - แนบส่วนหัวการระบุแหล่งที่มาที่ซ่อนไว้เฉพาะบนโฮสต์ดั้งเดิมที่ตรวจสอบแล้วเท่านั้น
    - เก็บการปรับรูปแบบคำขอเฉพาะ OpenAI (`service_tier`, `store`, ความเข้ากันได้ของ reasoning, คำใบ้ prompt-cache)

    **เส้นทางพร็อกซี/ที่เข้ากันได้:**
    - ใช้พฤติกรรมความเข้ากันได้ที่ผ่อนปรนกว่า
    - ตัด `store` ของ Completions ออกจาก payload `openai-completions` ที่ไม่ใช่ดั้งเดิม
    - ยอมรับ JSON ส่งผ่านขั้นสูง `params.extra_body`/`params.extraBody` สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI
    - ยอมรับ `params.chat_template_kwargs` สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI เช่น vLLM
    - ไม่บังคับใช้สคีมาของเครื่องมือแบบเข้มงวดหรือส่วนหัวที่ใช้เฉพาะเส้นทางดั้งเดิม

    Azure OpenAI ใช้การขนส่งดั้งเดิมและพฤติกรรมความเข้ากันได้ แต่ไม่ได้รับส่วนหัวการระบุแหล่งที่มาที่ซ่อนไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="การสร้างรูปภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือรูปภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลประจำตัวซ้ำ
  </Card>
</CardGroup>
