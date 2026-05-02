---
read_when:
    - คุณต้องการใช้โมเดล OpenAI ใน OpenClaw
    - คุณต้องการใช้การยืนยันตัวตนผ่านการสมัครใช้งาน Codex แทนคีย์ API
    - คุณต้องการพฤติกรรมการดำเนินงานของเอเจนต์ GPT-5 ที่เข้มงวดยิ่งขึ้น
summary: ใช้ OpenAI ผ่านคีย์ API หรือการสมัครใช้งาน Codex ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-02T10:27:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0caf43895c1bc8494b1a0d4aeef98e575bb31aca047430a63156875bed3bb112
    source_path: providers/openai.md
    workflow: 16
---

OpenAI มี API สำหรับนักพัฒนาสำหรับโมเดล GPT และ Codex ยังพร้อมใช้งานเป็นเอเจนต์เขียนโค้ดในแผน ChatGPT ผ่านไคลเอนต์ Codex ของ OpenAI ด้วย OpenClaw แยกพื้นผิวการใช้งานเหล่านั้นออกจากกันเพื่อให้การกำหนดค่าคาดเดาได้

OpenClaw รองรับเส้นทางตระกูล OpenAI สามแบบ ผู้สมัครสมาชิก ChatGPT/Codex ส่วนใหญ่ที่ต้องการพฤติกรรมแบบ Codex ควรใช้รันไทม์ Codex app-server แบบเนทีฟ คำนำหน้าโมเดลเลือกชื่อผู้ให้บริการ/โมเดล ส่วนการตั้งค่ารันไทม์แยกต่างหากจะเลือกว่าใครเป็นผู้ดำเนินการลูปเอเจนต์ที่ฝังไว้:

- **คีย์ API** - การเข้าถึง OpenAI Platform โดยตรงพร้อมการเรียกเก็บเงินตามการใช้งาน (โมเดล `openai/*`)
- **การสมัครสมาชิก Codex พร้อมรันไทม์ Codex แบบเนทีฟ** - การลงชื่อเข้าใช้ ChatGPT/Codex พร้อมการดำเนินการผ่าน Codex app-server (โมเดล `openai/*` รวมถึง `agents.defaults.agentRuntime.id: "codex"`)
- **การสมัครสมาชิก Codex ผ่าน PI** - การลงชื่อเข้าใช้ ChatGPT/Codex พร้อมตัวรัน OpenClaw PI ปกติ (โมเดล `openai-codex/*`)

OpenAI รองรับการใช้ OAuth ของการสมัครสมาชิกในเครื่องมือและเวิร์กโฟลว์ภายนอกอย่าง OpenClaw อย่างชัดเจน

ผู้ให้บริการ โมเดล รันไทม์ และช่องทางเป็นเลเยอร์ที่แยกจากกัน หากป้ายชื่อเหล่านั้นเริ่มปะปนกัน ให้อ่าน [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes) ก่อนเปลี่ยนการกำหนดค่า

## ตัวเลือกอย่างรวดเร็ว

| เป้าหมาย                                             | ใช้                                              | หมายเหตุ                                                                 |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| การสมัครสมาชิก ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-5.5` พร้อม `agentRuntime.id: "codex"` | การตั้งค่า Codex ที่แนะนำสำหรับผู้ใช้ส่วนใหญ่ ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน `openai-codex` |
| การเรียกเก็บเงินด้วยคีย์ API โดยตรง                 | `openai/gpt-5.5`                                 | ตั้งค่า `OPENAI_API_KEY` หรือรันการเริ่มต้นใช้งานคีย์ API ของ OpenAI |
| การยืนยันตัวตนการสมัครสมาชิก ChatGPT/Codex ผ่าน PI  | `openai-codex/gpt-5.5`                           | ใช้เฉพาะเมื่อคุณตั้งใจต้องการตัวรัน PI ปกติ |
| การสร้างหรือแก้ไขภาพ                                | `openai/gpt-image-2`                             | ใช้ได้กับทั้ง `OPENAI_API_KEY` หรือ OpenAI Codex OAuth |
| ภาพพื้นหลังโปร่งใส                                  | `openai/gpt-image-1.5`                           | ใช้ `outputFormat=png` หรือ `webp` และ `openai.background=transparent` |

## แผนที่ชื่อ

ชื่อคล้ายกันแต่ใช้แทนกันไม่ได้:

| ชื่อที่คุณเห็น                    | เลเยอร์           | ความหมาย                                                                                         |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | คำนำหน้าผู้ให้บริการ | เส้นทาง API ของ OpenAI Platform โดยตรง |
| `openai-codex`                     | คำนำหน้าผู้ให้บริการ | เส้นทาง OAuth/การสมัครสมาชิก OpenAI Codex ผ่านตัวรัน OpenClaw PI ปกติ |
| `codex` plugin                     | Plugin            | Plugin ของ OpenClaw ที่รวมมาในชุด ซึ่งให้รันไทม์ Codex app-server แบบเนทีฟและตัวควบคุมแชต `/codex` |
| `agentRuntime.id: codex`           | รันไทม์ของเอเจนต์ | บังคับใช้ฮาร์เนส Codex app-server แบบเนทีฟสำหรับเทิร์นที่ฝังไว้ |
| `/codex ...`                       | ชุดคำสั่งแชต      | ผูก/ควบคุมเธรด Codex app-server จากการสนทนา |
| `runtime: "acp", agentId: "codex"` | เส้นทางเซสชัน ACP | เส้นทางสำรองแบบชัดเจนที่รัน Codex ผ่าน ACP/acpx |

ซึ่งหมายความว่าการกำหนดค่าสามารถตั้งใจให้มีทั้ง `openai-codex/*` และ `codex` plugin ได้ สิ่งนี้ถูกต้องเมื่อคุณต้องการ Codex OAuth ผ่าน PI และยังต้องการให้มีตัวควบคุมแชต `/codex` แบบเนทีฟใช้งานได้ `openclaw doctor` จะเตือนเกี่ยวกับชุดค่าผสมนั้นเพื่อให้คุณยืนยันว่าเป็นความตั้งใจจริง โดยจะไม่เขียนค่าใหม่

<Note>
GPT-5.5 พร้อมใช้งานผ่านทั้งการเข้าถึงด้วยคีย์ API ของ OpenAI Platform โดยตรงและเส้นทางการสมัครสมาชิก/OAuth สำหรับการสมัครสมาชิก ChatGPT/Codex พร้อมการดำเนินการ Codex แบบเนทีฟ ให้ใช้ `openai/gpt-5.5` พร้อม `agentRuntime.id: "codex"` ใช้ `openai-codex/gpt-5.5` เฉพาะสำหรับ Codex OAuth ผ่าน PI หรือใช้ `openai/gpt-5.5` โดยไม่มีการแทนที่รันไทม์ Codex สำหรับทราฟฟิก `OPENAI_API_KEY` โดยตรง
</Note>

<Note>
การเปิดใช้ OpenAI Plugin หรือการเลือกโมเดล `openai-codex/*` ไม่ได้เปิดใช้ Plugin Codex app-server ที่รวมมาในชุด OpenClaw จะเปิดใช้ Plugin นั้นเฉพาะเมื่อคุณเลือกฮาร์เนส Codex แบบเนทีฟอย่างชัดเจนด้วย `agentRuntime.id: "codex"` หรือใช้การอ้างอิงโมเดล `codex/*` แบบเดิม
หากเปิดใช้ `codex` plugin ที่รวมมาในชุดแล้ว แต่ `openai-codex/*` ยังคง resolve ผ่าน PI อยู่ `openclaw doctor` จะเตือนและปล่อยเส้นทางไว้ตามเดิม
</Note>

## ความครอบคลุมฟีเจอร์ของ OpenClaw

| ความสามารถของ OpenAI       | พื้นผิวการใช้งาน OpenClaw                                | สถานะ                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| แชต / Responses           | ผู้ให้บริการโมเดล `openai/<model>`                        | ใช่                                                    |
| โมเดลการสมัครสมาชิก Codex | `openai-codex/<model>` พร้อม OAuth `openai-codex`          | ใช่                                                    |
| ฮาร์เนส Codex app-server  | `openai/<model>` พร้อม `agentRuntime.id: codex`            | ใช่                                                    |
| การค้นหาเว็บฝั่งเซิร์ฟเวอร์ | เครื่องมือ OpenAI Responses แบบเนทีฟ                      | ใช่ เมื่อเปิดใช้การค้นหาเว็บและไม่ได้ปักหมุดผู้ให้บริการ |
| ภาพ                      | `image_generate`                                           | ใช่                                                    |
| วิดีโอ                    | `video_generate`                                           | ใช่                                                    |
| แปลงข้อความเป็นเสียง      | `messages.tts.provider: "openai"` / `tts`                  | ใช่                                                    |
| แปลงเสียงเป็นข้อความแบบแบตช์ | `tools.media.audio` / การทำความเข้าใจสื่อ                  | ใช่                                                    |
| แปลงเสียงเป็นข้อความแบบสตรีม | Voice Call `streaming.provider: "openai"`                  | ใช่                                                    |
| เสียงเรียลไทม์            | Voice Call `realtime.provider: "openai"` / Control UI Talk | ใช่                                                    |
| Embeddings                | ผู้ให้บริการ embedding ของหน่วยความจำ                     | ใช่                                                    |

## Embeddings ของหน่วยความจำ

OpenClaw สามารถใช้ OpenAI หรือปลายทาง embedding ที่เข้ากันได้กับ OpenAI สำหรับการทำดัชนีและ query embeddings ของ `memory_search`:

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

สำหรับปลายทางที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้ป้ายกำกับ embedding แบบไม่สมมาตร ให้ตั้งค่า `queryInputType` และ `documentInputType` ภายใต้ `memorySearch` OpenClaw จะส่งต่อค่าเหล่านั้นเป็นฟิลด์คำขอ `input_type` เฉพาะผู้ให้บริการ: query embeddings ใช้ `queryInputType`; ชิ้นส่วนหน่วยความจำที่ทำดัชนีแล้วและการทำดัชนีแบบแบตช์ใช้ `documentInputType` ดูตัวอย่างฉบับเต็มได้ใน [เอกสารอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config#provider-specific-config)

## เริ่มต้นใช้งาน

เลือกวิธียืนยันตัวตนที่คุณต้องการและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="คีย์ API (OpenAI Platform)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง API โดยตรงและการเรียกเก็บเงินตามการใช้งาน

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

    | การอ้างอิงโมเดล       | การกำหนดค่ารันไทม์        | เส้นทาง                    | การยืนยันตัวตน    |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | ละไว้ / `agentRuntime.id: "pi"`    | API ของ OpenAI Platform โดยตรง | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | ละไว้ / `agentRuntime.id: "pi"`    | API ของ OpenAI Platform โดยตรง | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | ฮาร์เนส Codex app-server    | Codex app-server |

    <Note>
    `openai/*` คือเส้นทางคีย์ API ของ OpenAI โดยตรง เว้นแต่คุณจะบังคับใช้ฮาร์เนส Codex app-server อย่างชัดเจน ใช้ `openai-codex/*` สำหรับ Codex OAuth ผ่านตัวรัน PI เริ่มต้น หรือใช้ `openai/gpt-5.5` พร้อม `agentRuntime.id: "codex"` สำหรับการดำเนินการ Codex app-server แบบเนทีฟ
    </Note>

    ### ตัวอย่างการกำหนดค่า

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw ไม่ได้เปิดเผย `openai/gpt-5.3-codex-spark` คำขอ OpenAI API แบบไลฟ์ปฏิเสธโมเดลนั้น และแค็ตตาล็อก Codex ปัจจุบันก็ไม่ได้เปิดเผยโมเดลนั้นเช่นกัน
    </Warning>

  </Tab>

  <Tab title="การสมัครสมาชิก Codex">
    **เหมาะที่สุดสำหรับ:** การใช้การสมัครสมาชิก ChatGPT/Codex ของคุณกับการดำเนินการ Codex app-server แบบเนทีฟแทนคีย์ API แยกต่างหาก Codex cloud ต้องใช้การลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="รัน Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        หรือรัน OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        สำหรับการตั้งค่าแบบ headless หรือที่ callback ใช้งานยาก ให้เพิ่ม `--device-code` เพื่อลงชื่อเข้าใช้ด้วยโฟลว์ device-code ของ ChatGPT แทน callback ผ่านเบราว์เซอร์ localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="ใช้รันไทม์ Codex แบบเนทีฟ">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex","fallback":"none"}' --strict-json
        ```
      </Step>
      <Step title="ตรวจสอบว่าการยืนยันตัวตน Codex พร้อมใช้งาน">
        ```bash
        openclaw models list --provider openai-codex
        ```

        หลังจาก gateway กำลังทำงานแล้ว ให้ส่ง `/codex status` หรือ `/codex models`
        ในแชตเพื่อตรวจสอบรันไทม์ app-server แบบเนทีฟ
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | การอ้างอิงโมเดล | การกำหนดค่ารันไทม์ | เส้นทาง | การยืนยันตัวตน |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | ฮาร์เนส Codex app-server แบบเนทีฟ | การลงชื่อเข้าใช้ Codex หรือโปรไฟล์ `openai-codex` ที่เลือก |
    | `openai-codex/gpt-5.5` | ละไว้ / `runtime: "pi"` | ChatGPT/Codex OAuth ผ่าน PI | การลงชื่อเข้าใช้ Codex |
    | `openai-codex/gpt-5.4-mini` | ละไว้ / `runtime: "pi"` | ChatGPT/Codex OAuth ผ่าน PI | การลงชื่อเข้าใช้ Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | ยังเป็น PI เว้นแต่ Plugin จะอ้างสิทธิ์ `openai-codex` อย่างชัดเจน | การลงชื่อเข้าใช้ Codex |

    <Note>
    ให้ใช้ id ผู้ให้บริการ `openai-codex` ต่อไปสำหรับคำสั่ง auth/profile คำนำหน้าโมเดล
    `openai-codex/*` ยังเป็นเส้นทาง PI แบบชัดเจนสำหรับ Codex OAuth ด้วย
    เส้นทางนี้ไม่ได้เลือกหรือเปิดใช้งานชุดควบคุม app-server ของ Codex ที่รวมมาให้โดยอัตโนมัติ สำหรับ
    การตั้งค่าทั่วไปที่ใช้การสมัครใช้งานร่วมกับรันไทม์เนทีฟ ให้ลงชื่อเข้าใช้ด้วย
    `openai-codex` แต่คงการอ้างอิงโมเดลเป็น `openai/gpt-5.5` และตั้งค่า
    `agentRuntime.id: "codex"`
    </Note>

    ### ตัวอย่างการกำหนดค่า

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex", fallback: "none" },
        },
      },
    }
    ```

    หากต้องการให้ Codex OAuth อยู่บนตัวรัน PI ปกติแทน ให้ใช้
    `openai-codex/gpt-5.5` และละเว้นการ override รันไทม์ Codex

    <Note>
    การเริ่มใช้งานจะไม่นำเข้าข้อมูล OAuth จาก `~/.codex` อีกต่อไป ลงชื่อเข้าใช้ด้วย OAuth ผ่านเบราว์เซอร์ (ค่าเริ่มต้น) หรือโฟลว์รหัสอุปกรณ์ด้านบน — OpenClaw จะจัดการข้อมูลประจำตัวที่ได้ในที่เก็บ auth ของเอเจนต์ของตัวเอง
    </Note>

    ### ตัวบ่งชี้สถานะ

    แชต `/status` จะแสดงว่ารันไทม์โมเดลใดกำลังทำงานสำหรับเซสชันปัจจุบัน
    ชุดควบคุม PI ค่าเริ่มต้นจะแสดงเป็น `Runtime: OpenClaw Pi Default` เมื่อ
    เลือกชุดควบคุม app-server ของ Codex ที่รวมมาให้ `/status` จะแสดง
    `Runtime: OpenAI Codex` เซสชันที่มีอยู่จะคง id ชุดควบคุมที่บันทึกไว้ ดังนั้นให้ใช้
    `/new` หรือ `/reset` หลังจากเปลี่ยน `agentRuntime` หากคุณต้องการให้ `/status`
    สะท้อนตัวเลือก PI/Codex ใหม่

    ### คำเตือนจาก doctor

    หากเปิดใช้ Plugin `codex` ที่รวมมาให้ในขณะที่เลือกเส้นทาง `openai-codex/*`
    อยู่ `openclaw doctor` จะเตือนว่าโมเดลยังคง resolve ผ่าน PI
    คงการกำหนดค่าไว้เหมือนเดิมเฉพาะเมื่อเส้นทาง auth การสมัครใช้งาน PI นั้น
    เป็นความตั้งใจ เปลี่ยนเป็น `openai/<model>` พร้อม `agentRuntime.id: "codex"` เมื่อ
    คุณต้องการให้รันผ่าน app-server ของ Codex แบบเนทีฟ

    ### ขีดจำกัดหน้าต่างบริบท

    OpenClaw ถือว่า metadata ของโมเดลและขีดจำกัดบริบทของรันไทม์เป็นค่าคนละส่วนกัน

    สำหรับ `openai-codex/gpt-5.5` ผ่าน Codex OAuth:

    - `contextWindow` แบบเนทีฟ: `1000000`
    - ขีดจำกัด `contextTokens` ค่าเริ่มต้นของรันไทม์: `272000`

    ขีดจำกัดค่าเริ่มต้นที่เล็กกว่ามีคุณลักษณะด้านเวลาแฝงและคุณภาพที่ดีกว่าในทางปฏิบัติ Override ด้วย `contextTokens`:

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
    ใช้ `contextWindow` เพื่อประกาศ metadata ของโมเดลแบบเนทีฟ ใช้ `contextTokens` เพื่อจำกัดงบประมาณบริบทของรันไทม์
    </Note>

    ### การกู้คืนแค็ตตาล็อก

    OpenClaw ใช้ metadata แค็ตตาล็อก Codex ต้นทางสำหรับ `gpt-5.5` เมื่อมีอยู่
    หากการค้นพบ Codex แบบสดละเว้นแถว `openai-codex/gpt-5.5` ในขณะที่
    บัญชีผ่านการยืนยันตัวตนแล้ว OpenClaw จะสังเคราะห์แถวโมเดล OAuth นั้นเพื่อให้
    การรัน cron, เอเจนต์ย่อย และโมเดลค่าเริ่มต้นที่กำหนดค่าไว้ไม่ล้มเหลวด้วย
    `Unknown model`

  </Tab>
</Tabs>

## auth ของ app-server Codex แบบเนทีฟ

ชุดควบคุม app-server Codex แบบเนทีฟใช้การอ้างอิงโมเดล `openai/*` พร้อม
`agentRuntime.id: "codex"` แต่ auth ของมันยังอิงตามบัญชี OpenClaw
เลือก auth ตามลำดับนี้:

1. โปรไฟล์ auth `openai-codex` ของ OpenClaw ที่ระบุชัดเจนและผูกกับเอเจนต์
2. บัญชีที่มีอยู่ของ app-server เช่น การลงชื่อเข้าใช้ ChatGPT ของ Codex CLI ในเครื่อง
3. สำหรับการเปิด app-server แบบ stdio ในเครื่องเท่านั้น ใช้ `CODEX_API_KEY` แล้วจึง
   `OPENAI_API_KEY` เมื่อ app-server รายงานว่าไม่มีบัญชีและยังต้องใช้
   auth ของ OpenAI

ซึ่งหมายความว่าการลงชื่อเข้าใช้การสมัครใช้งาน ChatGPT/Codex ในเครื่องจะไม่ถูกแทนที่เพียง
เพราะกระบวนการ Gateway มี `OPENAI_API_KEY` สำหรับโมเดล OpenAI โดยตรง
หรือ embeddings อยู่ด้วย การ fallback ไปใช้คีย์ API จาก env เป็นเพียงเส้นทาง stdio ในเครื่องที่ไม่มีบัญชีเท่านั้น
และจะไม่ถูกส่งไปยังการเชื่อมต่อ app-server แบบ WebSocket เมื่อเลือกโปรไฟล์ Codex
แบบการสมัครใช้งาน OpenClaw จะกัน `CODEX_API_KEY` และ `OPENAI_API_KEY`
ออกจาก child app-server แบบ stdio ที่ spawn ขึ้นมา และส่งข้อมูลประจำตัวที่เลือก
ผ่าน RPC การเข้าสู่ระบบของ app-server

## การสร้างภาพ

Plugin `openai` ที่รวมมาให้ลงทะเบียนการสร้างภาพผ่านเครื่องมือ `image_generate`
รองรับทั้งการสร้างภาพด้วยคีย์ API ของ OpenAI และการสร้างภาพด้วย Codex OAuth
ผ่านการอ้างอิงโมเดล `openai/gpt-image-2` เดียวกัน

| ความสามารถ                | คีย์ API ของ OpenAI                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| การอ้างอิงโมเดล                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | การลงชื่อเข้าใช้ OpenAI Codex OAuth           |
| การส่งข้อมูล                 | OpenAI Images API                  | แบ็กเอนด์ Codex Responses              |
| จำนวนภาพสูงสุดต่อคำขอ    | 4                                  | 4                                    |
| โหมดแก้ไข                 | เปิดใช้งาน (สูงสุด 5 ภาพอ้างอิง) | เปิดใช้งาน (สูงสุด 5 ภาพอ้างอิง)   |
| Override ขนาด            | รองรับ รวมถึงขนาด 2K/4K   | รองรับ รวมถึงขนาด 2K/4K     |
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
ดู [การสร้างภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

`gpt-image-2` เป็นค่าเริ่มต้นสำหรับทั้งการสร้างภาพจากข้อความของ OpenAI และการ
แก้ไขภาพ `gpt-image-1.5`, `gpt-image-1` และ `gpt-image-1-mini` ยังคงใช้ได้เป็น
override โมเดลแบบชัดเจน ใช้ `openai/gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP
พื้นหลังโปร่งใส; API `gpt-image-2` ปัจจุบันปฏิเสธ
`background: "transparent"`

สำหรับคำขอพื้นหลังโปร่งใส เอเจนต์ควรเรียก `image_generate` ด้วย
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` หรือ `"webp"` และ
`background: "transparent"`; ตัวเลือกผู้ให้บริการ `openai.background` แบบเก่า
ยังคงยอมรับได้ OpenClaw ยังปกป้องเส้นทาง OpenAI สาธารณะและ
OpenAI Codex OAuth โดยเขียนคำขอโปร่งใสค่าเริ่มต้น `openai/gpt-image-2`
ใหม่เป็น `gpt-image-1.5`; Azure และปลายทางที่เข้ากันได้กับ OpenAI แบบกำหนดเองจะคง
ชื่อ deployment/model ที่กำหนดค่าไว้

การตั้งค่าเดียวกันถูกเปิดให้ใช้สำหรับการรัน CLI แบบ headless:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

ใช้แฟล็ก `--output-format` และ `--background` เดียวกันกับ
`openclaw infer image edit` เมื่อเริ่มจากไฟล์อินพุต
`--openai-background` ยังคงพร้อมใช้งานเป็น alias เฉพาะของ OpenAI

สำหรับการติดตั้ง Codex OAuth ให้คงการอ้างอิง `openai/gpt-image-2` เดิมไว้ เมื่อกำหนดค่า
โปรไฟล์ OAuth `openai-codex` แล้ว OpenClaw จะ resolve token การเข้าถึง OAuth
ที่จัดเก็บไว้และส่งคำขอภาพผ่านแบ็กเอนด์ Codex Responses โดย
จะไม่ลองใช้ `OPENAI_API_KEY` ก่อนหรือ fallback ไปใช้คีย์ API สำหรับคำขอนั้นแบบเงียบ ๆ
กำหนดค่า `models.providers.openai` อย่างชัดเจนด้วยคีย์ API,
URL ฐานแบบกำหนดเอง หรือปลายทาง Azure เมื่อคุณต้องการเส้นทาง OpenAI Images API
โดยตรงแทน
หากปลายทางภาพแบบกำหนดเองนั้นอยู่บน LAN/ที่อยู่ส่วนตัวที่เชื่อถือได้ ให้ตั้งค่า
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ด้วย; OpenClaw จะยังคง
บล็อกปลายทางภาพที่เข้ากันได้กับ OpenAI แบบส่วนตัว/ภายใน เว้นแต่มีการ opt-in นี้

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

Plugin `openai` ที่รวมมาให้ลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ `video_generate`

| ความสามารถ       | ค่า                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| โมเดลค่าเริ่มต้น    | `openai/sora-2`                                                                   |
| โหมด            | ข้อความเป็นวิดีโอ, ภาพเป็นวิดีโอ, การแก้ไขวิดีโอเดียว                                  |
| อินพุตอ้างอิง | 1 ภาพหรือ 1 วิดีโอ                                                                |
| Override ขนาด   | รองรับ                                                                         |
| Override อื่น ๆ  | `aspectRatio`, `resolution`, `audio`, `watermark` จะถูกละเว้นพร้อมคำเตือนจากเครื่องมือ |

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การร่วมส่งพรอมป์ GPT-5

OpenClaw เพิ่มการร่วมส่งพรอมป์ GPT-5 ร่วมสำหรับการรันตระกูล GPT-5 ในหลายผู้ให้บริการ ใช้ตาม id โมเดล ดังนั้น `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` และการอ้างอิง GPT-5 อื่นที่เข้ากันได้จะได้รับ overlay เดียวกัน โมเดล GPT-4.x รุ่นเก่าจะไม่ได้รับ

ชุดควบคุม Codex เนทีฟที่รวมมาให้ใช้พฤติกรรม GPT-5 และ overlay Heartbeat เดียวกันผ่านคำสั่งสำหรับนักพัฒนาของ app-server Codex ดังนั้นเซสชัน `openai/gpt-5.x` ที่บังคับผ่าน `agentRuntime.id: "codex"` จะยังคงคำแนะนำเรื่องการทำให้เสร็จต่อเนื่องและ Heartbeat เชิงรุกเดิม แม้ว่า Codex จะเป็นเจ้าของส่วนที่เหลือของพรอมป์ชุดควบคุมก็ตาม

การร่วมส่ง GPT-5 เพิ่มสัญญาพฤติกรรมแบบมีแท็กสำหรับการคง persona, ความปลอดภัยในการดำเนินการ, วินัยในการใช้เครื่องมือ, รูปแบบเอาต์พุต, การตรวจสอบความเสร็จสมบูรณ์ และการยืนยัน พฤติกรรมการตอบกลับเฉพาะช่องทางและข้อความเงียบจะยังอยู่ในพรอมป์ระบบร่วมของ OpenClaw และนโยบายการส่งออก คำแนะนำ GPT-5 จะเปิดใช้งานเสมอสำหรับโมเดลที่ตรงกัน เลเยอร์รูปแบบการโต้ตอบแบบเป็นมิตรจะแยกต่างหากและกำหนดค่าได้

| ค่า                  | ผล                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้เลเยอร์รูปแบบการโต้ตอบแบบเป็นมิตร |
| `"on"`                 | Alias สำหรับ `"friendly"`                      |
| `"off"`                | ปิดเฉพาะเลเยอร์รูปแบบเป็นมิตร       |

<Tabs>
  <Tab title="การกำหนดค่า">
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
ค่าไม่แยกตัวพิมพ์ใหญ่เล็กในรันไทม์ ดังนั้น `"Off"` และ `"off"` จะปิดเลเยอร์รูปแบบเป็นมิตรทั้งคู่
</Tip>

<Note>
`plugins.entries.openai.config.personality` แบบเดิมยังคงถูกอ่านเป็น fallback เพื่อความเข้ากันได้เมื่อไม่ได้ตั้งค่า `agents.defaults.promptOverlays.gpt5.personality` ร่วมไว้
</Note>

## เสียงและคำพูด

<AccordionGroup>
  <Accordion title="การสังเคราะห์เสียงพูด (TTS)">
    Plugin `openai` ที่รวมมาให้ลงทะเบียนการสังเคราะห์เสียงพูดสำหรับพื้นผิว `messages.tts`

    | การตั้งค่า | เส้นทางการตั้งค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | เสียง | `messages.tts.providers.openai.voice` | `coral` |
    | ความเร็ว | `messages.tts.providers.openai.speed` | (ไม่ได้ตั้งค่า) |
    | คำสั่ง | `messages.tts.providers.openai.instructions` | (ไม่ได้ตั้งค่า, เฉพาะ `gpt-4o-mini-tts`) |
    | รูปแบบ | `messages.tts.providers.openai.responseFormat` | `opus` สำหรับข้อความเสียง, `mp3` สำหรับไฟล์ |
    | คีย์ API | `messages.tts.providers.openai.apiKey` | ย้อนกลับไปใช้ `OPENAI_API_KEY` |
    | URL ฐาน | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | เนื้อหาเพิ่มเติม | `messages.tts.providers.openai.extraBody` / `extra_body` | (ไม่ได้ตั้งค่า) |

    โมเดลที่ใช้ได้: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd` เสียงที่ใช้ได้: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`

    `extraBody` จะถูกรวมเข้ากับ JSON คำขอ `/audio/speech` หลังจากฟิลด์ที่ OpenClaw สร้างขึ้น ดังนั้นให้ใช้สำหรับ endpoint ที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้คีย์เพิ่มเติม เช่น `lang` คีย์ prototype จะถูกละเว้น

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
    ตั้งค่า `OPENAI_TTS_BASE_URL` เพื่อแทนที่ URL ฐานของ TTS โดยไม่กระทบ endpoint ของ chat API
    </Note>

  </Accordion>

  <Accordion title="แปลงเสียงเป็นข้อความ">
    Plugin `openai` ที่มาพร้อมชุดติดตั้งจะลงทะเบียนการแปลงเสียงเป็นข้อความแบบแบตช์ผ่านพื้นผิวการถอดเสียงเพื่อทำความเข้าใจสื่อของ OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - เส้นทางอินพุต: การอัปโหลดไฟล์เสียงแบบ multipart
    - OpenClaw รองรับทุกที่ที่การถอดเสียงอินพุตเสียงใช้
      `tools.media.audio` รวมถึงเซกเมนต์ช่องเสียงของ Discord และไฟล์แนบเสียงของช่อง

    หากต้องการบังคับใช้ OpenAI สำหรับการถอดเสียงอินพุตเสียง:

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

    คำใบ้ภาษาและ prompt จะถูกส่งต่อไปยัง OpenAI เมื่อมีการระบุโดยการตั้งค่าสื่อเสียงร่วม หรือคำขอถอดเสียงรายครั้ง

  </Accordion>

  <Accordion title="การถอดเสียงแบบเรียลไทม์">
    Plugin `openai` ที่มาพร้อมชุดติดตั้งจะลงทะเบียนการถอดเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | เส้นทางการตั้งค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | ภาษา | `...openai.language` | (ไม่ได้ตั้งค่า) |
    | Prompt | `...openai.prompt` | (ไม่ได้ตั้งค่า) |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `800` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | คีย์ API | `...openai.apiKey` | ย้อนกลับไปใช้ `OPENAI_API_KEY` |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียง G.711 u-law (`g711_ulaw` / `audio/pcmu`) ผู้ให้บริการสตรีมมิงนี้ใช้สำหรับเส้นทางการถอดเสียงแบบเรียลไทม์ของ Voice Call ขณะนี้เสียงของ Discord บันทึกเซกเมนต์สั้น ๆ และใช้เส้นทางการถอดเสียงแบบแบตช์ `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="เสียงแบบเรียลไทม์">
    Plugin `openai` ที่มาพร้อมชุดติดตั้งจะลงทะเบียนเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | เส้นทางการตั้งค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | เสียง | `...openai.voice` | `alloy` |
    | อุณหภูมิ | `...openai.temperature` | `0.8` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `500` |
    | คีย์ API | `...openai.apiKey` | ย้อนกลับไปใช้ `OPENAI_API_KEY` |

    <Note>
    รองรับ Azure OpenAI ผ่านคีย์การตั้งค่า `azureEndpoint` และ `azureDeployment` สำหรับบริดจ์เรียลไทม์ฝั่งแบ็กเอนด์ รองรับการเรียกเครื่องมือแบบสองทิศทาง ใช้รูปแบบเสียง G.711 u-law
    </Note>

    <Note>
    Control UI Talk ใช้เซสชันเรียลไทม์บนเบราว์เซอร์ของ OpenAI พร้อมความลับไคลเอนต์ชั่วคราวที่ Gateway สร้างให้ และการแลกเปลี่ยน SDP ของ WebRTC โดยตรงจากเบราว์เซอร์กับ OpenAI Realtime API การยืนยันแบบสดสำหรับผู้ดูแลมีให้ใช้ด้วย
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ส่วน OpenAI จะสร้างความลับไคลเอนต์ใน Node, สร้างข้อเสนอ SDP ของเบราว์เซอร์พร้อมสื่อไมโครโฟนปลอม, โพสต์ไปยัง OpenAI และนำคำตอบ SDP ไปใช้โดยไม่บันทึกความลับ
    </Note>

  </Accordion>
</AccordionGroup>

## endpoint ของ Azure OpenAI

ผู้ให้บริการ `openai` ที่มาพร้อมชุดติดตั้งสามารถชี้ไปยังทรัพยากร Azure OpenAI สำหรับการสร้างรูปภาพได้โดยแทนที่ URL ฐาน บนเส้นทางการสร้างรูปภาพ OpenClaw จะตรวจจับชื่อโฮสต์ Azure บน `models.providers.openai.baseUrl` และสลับไปใช้รูปแบบคำขอของ Azure โดยอัตโนมัติ

<Note>
เสียงแบบเรียลไทม์ใช้เส้นทางการตั้งค่าแยกต่างหาก
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
และไม่ได้รับผลจาก `models.providers.openai.baseUrl` ดู accordion **เสียงแบบเรียลไทม์** ใต้ [เสียงและคำพูด](#voice-and-speech) สำหรับการตั้งค่า Azure ของส่วนนี้
</Note>

ใช้ Azure OpenAI เมื่อ:

- คุณมีการสมัครใช้งาน Azure OpenAI, โควตา หรือข้อตกลงองค์กรอยู่แล้ว
- คุณต้องการถิ่นที่อยู่ของข้อมูลตามภูมิภาค หรือการควบคุมการปฏิบัติตามข้อกำหนดที่ Azure มีให้
- คุณต้องการเก็บทราฟฟิกไว้ภายใน tenancy Azure ที่มีอยู่

### การตั้งค่า

สำหรับการสร้างรูปภาพ Azure ผ่านผู้ให้บริการ `openai` ที่มาพร้อมชุดติดตั้ง ให้ชี้
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

OpenClaw รู้จักส่วนท้ายชื่อโฮสต์ Azure เหล่านี้สำหรับเส้นทางการสร้างรูปภาพ Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

สำหรับคำขอสร้างรูปภาพบนโฮสต์ Azure ที่รู้จัก OpenClaw จะ:

- ส่ง header `api-key` แทน `Authorization: Bearer`
- ใช้เส้นทางแบบผูกกับ deployment (`/openai/deployments/{deployment}/...`)
- เติม `?api-version=...` ต่อท้ายแต่ละคำขอ
- ใช้ค่า timeout คำขอเริ่มต้น 600 วินาทีสำหรับการเรียกสร้างรูปภาพ Azure
  ค่า `timeoutMs` รายครั้งยังคงแทนที่ค่าเริ่มต้นนี้ได้

URL ฐานอื่น ๆ (OpenAI สาธารณะ, พร็อกซีที่เข้ากันได้กับ OpenAI) จะคงรูปแบบคำขอรูปภาพมาตรฐานของ OpenAI ไว้

<Note>
การกำหนดเส้นทาง Azure สำหรับเส้นทางการสร้างรูปภาพของผู้ให้บริการ `openai` ต้องใช้
OpenClaw 2026.4.22 หรือใหม่กว่า เวอร์ชันก่อนหน้าจะถือว่า `openai.baseUrl` ที่กำหนดเองใด ๆ เหมือน endpoint OpenAI สาธารณะ และจะล้มเหลวกับ deployment รูปภาพของ Azure
</Note>

### เวอร์ชัน API

ตั้งค่า `AZURE_OPENAI_API_VERSION` เพื่อปักหมุดเวอร์ชัน Azure preview หรือ GA เฉพาะสำหรับเส้นทางการสร้างรูปภาพ Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

ค่าเริ่มต้นคือ `2024-12-01-preview` เมื่อไม่ได้ตั้งค่าตัวแปร

### ชื่อโมเดลคือชื่อ deployment

Azure OpenAI ผูกโมเดลกับ deployment สำหรับคำขอสร้างรูปภาพ Azure ที่กำหนดเส้นทางผ่านผู้ให้บริการ `openai` ที่มาพร้อมชุดติดตั้ง ฟิลด์ `model` ใน OpenClaw ต้องเป็น **ชื่อ deployment ของ Azure** ที่คุณตั้งค่าไว้ในพอร์ทัล Azure ไม่ใช่ id โมเดล OpenAI สาธารณะ

หากคุณสร้าง deployment ชื่อ `gpt-image-2-prod` ที่ให้บริการ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

กฎชื่อ deployment เดียวกันใช้กับการเรียกสร้างรูปภาพที่กำหนดเส้นทางผ่านผู้ให้บริการ `openai` ที่มาพร้อมชุดติดตั้ง

### ความพร้อมใช้งานตามภูมิภาค

ขณะนี้การสร้างรูปภาพ Azure มีให้ใช้เฉพาะในบางภูมิภาคเท่านั้น
(ตัวอย่างเช่น `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`) ตรวจสอบรายการภูมิภาคปัจจุบันของ Microsoft ก่อนสร้าง
deployment และยืนยันว่าโมเดลเฉพาะนั้นมีให้ใช้ในภูมิภาคของคุณ

### ความแตกต่างของพารามิเตอร์

Azure OpenAI และ OpenAI สาธารณะไม่ได้ยอมรับพารามิเตอร์รูปภาพชุดเดียวกันเสมอไป
Azure อาจปฏิเสธตัวเลือกที่ OpenAI สาธารณะอนุญาต (ตัวอย่างเช่นค่า
`background` บางค่าบน `gpt-image-2`) หรือเปิดให้ใช้เฉพาะในเวอร์ชันโมเดลบางรุ่น ความแตกต่างเหล่านี้มาจาก Azure และโมเดลพื้นฐาน ไม่ใช่
OpenClaw หากคำขอ Azure ล้มเหลวด้วยข้อผิดพลาดการตรวจสอบความถูกต้อง ให้ตรวจสอบชุดพารามิเตอร์ที่ deployment และเวอร์ชัน API เฉพาะของคุณรองรับในพอร์ทัล Azure

<Note>
Azure OpenAI ใช้การขนส่งแบบเนทีฟและพฤติกรรม compat แต่ไม่ได้รับ header การระบุแหล่งที่มาที่ซ่อนอยู่ของ OpenClaw — ดู accordion **เส้นทางเนทีฟเทียบกับเส้นทางที่เข้ากันได้กับ OpenAI** ใต้ [การตั้งค่าขั้นสูง](#advanced-configuration)

สำหรับทราฟฟิก chat หรือ Responses บน Azure (นอกเหนือจากการสร้างรูปภาพ) ให้ใช้โฟลว์ onboarding หรือการตั้งค่าผู้ให้บริการ Azure เฉพาะ — แค่ `openai.baseUrl` เพียงอย่างเดียวจะไม่ใช้รูปแบบ API/auth ของ Azure มีผู้ให้บริการ
`azure-openai-responses/*` แยกต่างหาก; ดู accordion Server-side compaction ด้านล่าง
</Note>

## การตั้งค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การขนส่ง (WebSocket เทียบกับ SSE)">
    OpenClaw ใช้ WebSocket ก่อน พร้อม fallback เป็น SSE (`"auto"`) สำหรับทั้ง `openai/*` และ `openai-codex/*`

    ในโหมด `"auto"` OpenClaw จะ:
    - ลองใหม่หลัง WebSocket ล้มเหลวตั้งแต่ต้นหนึ่งครั้ง ก่อน fallback เป็น SSE
    - หลังความล้มเหลว ทำเครื่องหมาย WebSocket ว่าเสื่อมสภาพประมาณ 60 วินาที และใช้ SSE ระหว่างช่วง cool-down
    - แนบ header ตัวตนของเซสชันและ turn ที่เสถียรสำหรับการลองใหม่และการเชื่อมต่อใหม่
    - ปรับตัวนับการใช้งาน (`input_tokens` / `prompt_tokens`) ให้เป็นมาตรฐานข้ามตัวแปรการขนส่ง

    | ค่า | พฤติกรรม |
    |-------|----------|
    | `"auto"` (ค่าเริ่มต้น) | WebSocket ก่อน, fallback เป็น SSE |
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
    - [การตอบสนอง Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="การอุ่นเครื่อง WebSocket">
    OpenClaw เปิดใช้การอุ่นเครื่อง WebSocket เป็นค่าเริ่มต้นสำหรับ `openai/*` และ `openai-codex/*` เพื่อลด latency ของ turn แรก

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
    OpenClaw เปิดเผยสวิตช์โหมดเร็วร่วมสำหรับ `openai/*` และ `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **การตั้งค่า:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    เมื่อเปิดใช้ OpenClaw จะแมปโหมดเร็วกับการประมวลผลแบบ priority ของ OpenAI (`service_tier = "priority"`) ค่า `service_tier` ที่มีอยู่จะถูกรักษาไว้ และโหมดเร็วจะไม่เขียน `reasoning` หรือ `text.verbosity` ใหม่

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
    การแทนที่ของเซสชันชนะการตั้งค่า การล้างการแทนที่ของเซสชันใน UI Sessions จะคืนเซสชันกลับไปยังค่าเริ่มต้นที่ตั้งค่าไว้
    </Note>

  </Accordion>

  <Accordion title="การประมวลผลแบบ priority (service_tier)">
    API ของ OpenAI เปิดเผยการประมวลผลแบบ priority ผ่าน `service_tier` ตั้งค่าต่อโมเดลใน OpenClaw:

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
    `serviceTier` จะถูกส่งต่อไปยังปลายทาง OpenAI แบบเนทีฟ (`api.openai.com`) และปลายทาง Codex แบบเนทีฟ (`chatgpt.com/backend-api`) เท่านั้น หากคุณกำหนดเส้นทาง provider ใดผ่านพร็อกซี OpenClaw จะปล่อย `service_tier` ไว้ตามเดิม
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    สำหรับโมเดล OpenAI Responses โดยตรง (`openai/*` บน `api.openai.com`) wrapper สตรีม Pi-harness ของ Plugin OpenAI จะเปิดใช้การ Compaction ฝั่งเซิร์ฟเวอร์โดยอัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ความเข้ากันได้ของโมเดลจะตั้งค่า `supportsStore: false`)
    - แทรก `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - ค่าเริ่มต้นของ `compact_threshold`: 70% ของ `contextWindow` (หรือ `80000` เมื่อไม่มีค่า)

    สิ่งนี้ใช้กับเส้นทาง Pi harness ในตัวและกับ hook ของ provider OpenAI ที่ใช้โดยการรันแบบฝังตัว harness ของ app-server Codex แบบเนทีฟจัดการบริบทของตัวเองผ่าน Codex และกำหนดค่าแยกต่างหากด้วย `agents.defaults.agentRuntime.id`

    <Tabs>
      <Tab title="Enable explicitly">
        มีประโยชน์สำหรับปลายทางที่เข้ากันได้ เช่น Azure OpenAI Responses:

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
      <Tab title="Custom threshold">
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
      <Tab title="Disable">
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

  <Accordion title="Strict-agentic GPT mode">
    สำหรับการรันตระกูล GPT-5 บน `openai/*` OpenClaw สามารถใช้สัญญาการดำเนินการแบบฝังตัวที่เข้มงวดขึ้นได้:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    ด้วย `strict-agentic` OpenClaw จะ:
    - ไม่ถือว่าเทิร์นที่มีแต่แผนเป็นความคืบหน้าสำเร็จอีกต่อไปเมื่อมีการกระทำของเครื่องมือที่ใช้ได้
    - ลองเทิร์นอีกครั้งพร้อมการชี้นำให้ลงมือทันที
    - เปิดใช้ `update_plan` โดยอัตโนมัติสำหรับงานที่มีเนื้อหามาก
    - แสดงสถานะถูกบล็อกอย่างชัดเจนหากโมเดลยังคงวางแผนโดยไม่ลงมือทำ

    <Note>
    จำกัดเฉพาะการรันตระกูล GPT-5 ของ OpenAI และ Codex เท่านั้น provider อื่นและตระกูลโมเดลเก่ากว่าจะคงพฤติกรรมเริ่มต้นไว้
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw ปฏิบัติต่อปลายทาง OpenAI โดยตรง, Codex และ Azure OpenAI แตกต่างจากพร็อกซี `/v1` ทั่วไปที่เข้ากันได้กับ OpenAI:

    **เส้นทางแบบเนทีฟ** (`openai/*`, Azure OpenAI):
    - คง `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับ effort `none` ของ OpenAI
    - ละเว้น reasoning ที่ปิดใช้งานสำหรับโมเดลหรือพร็อกซีที่ปฏิเสธ `reasoning.effort: "none"`
    - ตั้งค่าเริ่มต้นของ schema เครื่องมือเป็นโหมดเข้มงวด
    - แนบส่วนหัว attribution ที่ซ่อนอยู่เฉพาะบนโฮสต์แบบเนทีฟที่ผ่านการตรวจสอบแล้ว
    - คงการจัดรูปคำขอเฉพาะ OpenAI (`service_tier`, `store`, reasoning-compat, คำใบ้ prompt-cache)

    **เส้นทางพร็อกซี/ที่เข้ากันได้:**
    - ใช้พฤติกรรมความเข้ากันได้ที่ผ่อนปรนกว่า
    - ลบ Completions `store` ออกจาก payload `openai-completions` ที่ไม่ใช่เนทีฟ
    - ยอมรับ JSON pass-through ขั้นสูง `params.extra_body`/`params.extraBody` สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI
    - ยอมรับ `params.chat_template_kwargs` สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI เช่น vLLM
    - ไม่บังคับ schema เครื่องมือแบบเข้มงวดหรือส่วนหัวเฉพาะเนทีฟ

    Azure OpenAI ใช้การขนส่งแบบเนทีฟและพฤติกรรมความเข้ากันได้ แต่จะไม่ได้รับส่วนหัว attribution ที่ซ่อนอยู่

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, ref ของโมเดล และพฤติกรรม failover
  </Card>
  <Card title="Image generation" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือรูปภาพที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="Video generation" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="OAuth and auth" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลประจำตัวซ้ำ
  </Card>
</CardGroup>
