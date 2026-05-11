---
read_when:
    - คุณต้องการใช้โมเดล OpenAI ใน OpenClaw
    - คุณต้องการใช้การตรวจสอบสิทธิ์ด้วยการสมัครใช้งาน Codex แทนคีย์ API
    - คุณต้องการพฤติกรรมการดำเนินงานของเอเจนต์ GPT-5 ที่เข้มงวดยิ่งขึ้น
summary: ใช้ OpenAI ผ่านคีย์ API หรือการสมัครสมาชิก Codex ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-11T20:36:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: d63b8eff93ecffd85c2110f42044c26621ff50eb62c35b7cc99a07f0e6be1ffb
    source_path: providers/openai.md
    workflow: 16
---

OpenAI มี API สำหรับนักพัฒนาสำหรับโมเดล GPT และ Codex ยังพร้อมใช้งานเป็นเอเจนต์เขียนโค้ดตามแผน ChatGPT ผ่านไคลเอนต์ Codex ของ OpenAI ด้วย OpenClaw แยกพื้นผิวเหล่านั้นออกจากกันเพื่อให้การกำหนดค่าคาดเดาได้

OpenClaw ใช้ `openai/*` เป็นเส้นทางโมเดล OpenAI มาตรฐาน เทิร์นเอเจนต์แบบฝังบนโมเดล OpenAI จะรันผ่านรันไทม์แอปเซิร์ฟเวอร์ Codex แบบเนทีฟตามค่าเริ่มต้น; การยืนยันตัวตนด้วยคีย์ OpenAI API โดยตรงยังคงพร้อมใช้งานสำหรับพื้นผิว OpenAI ที่ไม่ใช่เอเจนต์ เช่น รูปภาพ, embeddings, เสียงพูด และเรียลไทม์

- **โมเดลเอเจนต์** - โมเดล `openai/*` ผ่านรันไทม์ Codex; ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน Codex สำหรับการใช้งานผ่านการสมัครสมาชิก ChatGPT/Codex หรือกำหนดค่าโปรไฟล์สำรองคีย์ OpenAI API ที่เข้ากันได้กับ Codex เมื่อคุณตั้งใจต้องการการยืนยันตัวตนด้วยคีย์ API
- **OpenAI API ที่ไม่ใช่เอเจนต์** - การเข้าถึง OpenAI Platform โดยตรงพร้อมการเรียกเก็บเงินตามการใช้งานผ่าน `OPENAI_API_KEY` หรือการเริ่มต้นใช้งานคีย์ OpenAI API
- **การกำหนดค่าเดิม** - การอ้างอิงโมเดล `openai-codex/*` จะถูกซ่อมโดย `openclaw doctor --fix` เป็น `openai/*` พร้อมรันไทม์ Codex

OpenAI รองรับการใช้งาน OAuth จากการสมัครสมาชิกในเครื่องมือและเวิร์กโฟลว์ภายนอกอย่าง OpenClaw อย่างชัดเจน

ผู้ให้บริการ, โมเดล, รันไทม์ และช่องทางเป็นเลเยอร์ที่แยกจากกัน หากป้ายกำกับเหล่านี้เริ่มปนกัน ให้อ่าน [รันไทม์เอเจนต์](/th/concepts/agent-runtimes) ก่อนเปลี่ยนการกำหนดค่า

## ตัวเลือกด่วน

| เป้าหมาย                                                 | ใช้                                                      | หมายเหตุ                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| การสมัครสมาชิก ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-5.5`                                         | การตั้งค่าเอเจนต์ OpenAI เริ่มต้น ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน Codex                  |
| การเรียกเก็บเงินด้วยคีย์ API โดยตรงสำหรับโมเดลเอเจนต์              | `openai/gpt-5.5` พร้อมโปรไฟล์คีย์ API ที่เข้ากันได้กับ Codex | ใช้ `auth.order.openai` เพื่อวางโปรไฟล์สำรองไว้หลังการยืนยันตัวตนแบบสมัครสมาชิก  |
| การเรียกเก็บเงินด้วยคีย์ API โดยตรงผ่าน PI แบบชัดเจน           | `openai/gpt-5.5` พร้อมรันไทม์ผู้ให้บริการ/โมเดล `pi`        | เลือกโปรไฟล์คีย์ API `openai` ปกติ                             |
| alias API ของ ChatGPT Instant ล่าสุด                     | `openai/chat-latest`                                     | ใช้คีย์ API โดยตรงเท่านั้น alias ที่เปลี่ยนไปสำหรับการทดลอง ไม่ใช่ค่าเริ่มต้น   |
| การยืนยันตัวตนการสมัครสมาชิก ChatGPT/Codex ผ่าน PI แบบชัดเจน  | `openai/gpt-5.5` พร้อมรันไทม์ผู้ให้บริการ/โมเดล `pi`        | เลือกโปรไฟล์การยืนยันตัวตน `openai-codex` สำหรับเส้นทางความเข้ากันได้    |
| การสร้างหรือแก้ไขรูปภาพ                          | `openai/gpt-image-2`                                     | ใช้งานได้กับทั้ง `OPENAI_API_KEY` หรือ OpenAI Codex OAuth             |
| รูปภาพพื้นหลังโปร่งใส                        | `openai/gpt-image-1.5`                                   | ใช้ `outputFormat=png` หรือ `webp` และ `openai.background=transparent` |

## แผนที่ชื่อ

ชื่อคล้ายกันแต่ใช้แทนกันไม่ได้:

| ชื่อที่คุณเห็น                            | เลเยอร์                      | ความหมาย                                                                                                              |
| --------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openai`                                | คำนำหน้าผู้ให้บริการ            | เส้นทางโมเดล OpenAI มาตรฐาน; เทิร์นเอเจนต์ใช้รันไทม์ Codex                                                     |
| `openai-codex`                          | คำนำหน้าการยืนยันตัวตน/โปรไฟล์เดิม | เนมสเปซโปรไฟล์ OAuth/การสมัครสมาชิก OpenAI Codex รุ่นเก่า โปรไฟล์ที่มีอยู่และ `auth.order.openai-codex` ยังใช้งานได้ |
| `codex` plugin                          | Plugin                     | Plugin OpenClaw ที่มาพร้อมระบบซึ่งให้รันไทม์แอปเซิร์ฟเวอร์ Codex แบบเนทีฟและการควบคุมแชต `/codex`                    |
| provider/model `agentRuntime.id: codex` | รันไทม์เอเจนต์              | บังคับใช้ harness แอปเซิร์ฟเวอร์ Codex แบบเนทีฟสำหรับเทิร์นแบบฝังที่ตรงกัน                                               |
| `/codex ...`                            | ชุดคำสั่งแชต           | ผูก/ควบคุมเธรดแอปเซิร์ฟเวอร์ Codex จากการสนทนา                                                           |
| `runtime: "acp", agentId: "codex"`      | เส้นทางเซสชัน ACP          | เส้นทางสำรองที่ชัดเจนซึ่งรัน Codex ผ่าน ACP/acpx                                                             |

ซึ่งหมายความว่าการกำหนดค่าสามารถตั้งใจมีการอ้างอิงโมเดล `openai/*` ในขณะที่โปรไฟล์การยืนยันตัวตนยังชี้ไปยังข้อมูลประจำตัวที่เข้ากันได้กับ Codex ได้ ควรใช้ `auth.order.openai` สำหรับการกำหนดค่าใหม่; โปรไฟล์ `openai-codex:*` และ `auth.order.openai-codex` ที่มีอยู่ยังคงรองรับอยู่ `openclaw doctor --fix` จะเขียนการอ้างอิงโมเดล `openai-codex/*` เดิมใหม่เป็นเส้นทางโมเดล OpenAI มาตรฐาน

<Note>
GPT-5.5 พร้อมใช้งานผ่านทั้งการเข้าถึงด้วยคีย์ API ของ OpenAI Platform โดยตรงและเส้นทางการสมัครสมาชิก/OAuth สำหรับการสมัครสมาชิก ChatGPT/Codex พร้อมการรัน Codex แบบเนทีฟ ให้ใช้ `openai/gpt-5.5`; การไม่ตั้งค่ารันไทม์ตอนนี้จะเลือก harness Codex สำหรับเทิร์นเอเจนต์ OpenAI ใช้โปรไฟล์คีย์ OpenAI API เฉพาะเมื่อคุณต้องการการยืนยันตัวตนด้วยคีย์ API โดยตรงสำหรับโมเดลเอเจนต์ OpenAI
</Note>

<Note>
เทิร์นโมเดลเอเจนต์ OpenAI ต้องใช้ Plugin แอปเซิร์ฟเวอร์ Codex ที่มาพร้อมระบบ การกำหนดค่ารันไทม์ PI แบบชัดเจนยังคงพร้อมใช้งานเป็นเส้นทางความเข้ากันได้แบบเลือกใช้ เมื่อเลือก PI อย่างชัดเจนพร้อมโปรไฟล์การยืนยันตัวตน `openai-codex` OpenClaw จะคงการอ้างอิงโมเดลสาธารณะเป็น `openai/*` และกำหนดเส้นทาง PI ภายในผ่านการขนส่งการยืนยันตัวตน Codex แบบเดิม รัน `openclaw doctor --fix` เพื่อซ่อมการอ้างอิงโมเดล `openai-codex/*` ที่ล้าสมัย หรือพินเซสชัน PI เก่าที่ไม่ได้มาจากการกำหนดค่ารันไทม์แบบชัดเจน
</Note>

## ความครอบคลุมฟีเจอร์ของ OpenClaw

| ความสามารถของ OpenAI         | พื้นผิว OpenClaw                                                                 | สถานะ                                                 |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| แชต / Responses          | ผู้ให้บริการโมเดล `openai/<model>`                                                  | ใช่                                                    |
| โมเดลการสมัครสมาชิก Codex | `openai/<model>` พร้อม OAuth `openai-codex`                                       | ใช่                                                    |
| การอ้างอิงโมเดล Codex เดิม   | `openai-codex/<model>`                                                           | ถูกซ่อมโดย doctor เป็น `openai/<model>`                 |
| harness แอปเซิร์ฟเวอร์ Codex  | `openai/<model>` พร้อมรันไทม์ที่ละไว้ หรือผู้ให้บริการ/โมเดล `agentRuntime.id: codex` | ใช่                                                    |
| การค้นหาเว็บฝั่งเซิร์ฟเวอร์    | เครื่องมือ OpenAI Responses แบบเนทีฟ                                                     | ใช่ เมื่อเปิดใช้งานการค้นหาเว็บและไม่มีการพินผู้ให้บริการ |
| รูปภาพ                    | `image_generate`                                                                 | ใช่                                                    |
| วิดีโอ                    | `video_generate`                                                                 | ใช่                                                    |
| ข้อความเป็นเสียงพูด            | `messages.tts.provider: "openai"` / `tts`                                        | ใช่                                                    |
| การถอดเสียงพูดเป็นข้อความแบบชุด      | `tools.media.audio` / ความเข้าใจสื่อ                                        | ใช่                                                    |
| การถอดเสียงพูดเป็นข้อความแบบสตรีม  | Voice Call `streaming.provider: "openai"`                                        | ใช่                                                    |
| เสียงเรียลไทม์            | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | ใช่                                                    |
| Embeddings                | ผู้ให้บริการ embedding หน่วยความจำ                                                        | ใช่                                                    |

## Embeddings หน่วยความจำ

OpenClaw สามารถใช้ OpenAI หรือปลายทาง embedding ที่เข้ากันได้กับ OpenAI สำหรับการทำดัชนี `memory_search` และ embeddings สำหรับคำค้นหา:

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

สำหรับปลายทางที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้ป้ายกำกับ embedding แบบอสมมาตร ให้ตั้งค่า `queryInputType` และ `documentInputType` ใต้ `memorySearch` OpenClaw จะส่งต่อค่าเหล่านั้นเป็นฟิลด์คำขอ `input_type` เฉพาะผู้ให้บริการ: embeddings สำหรับคำค้นหาใช้ `queryInputType`; ชังก์หน่วยความจำที่ทำดัชนีและการทำดัชนีแบบชุดใช้ `documentInputType` ดูตัวอย่างเต็มได้ที่ [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config#provider-specific-config)

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="คีย์ API (OpenAI Platform)">
    **เหมาะสำหรับ:** การเข้าถึง API โดยตรงและการเรียกเก็บเงินตามการใช้งาน

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
    | `openai/gpt-5.5`      | ละไว้ / ผู้ให้บริการ/โมเดล `agentRuntime.id: "codex"` | harness แอปเซิร์ฟเวอร์ Codex | โปรไฟล์ OpenAI ที่เข้ากันได้กับ Codex |
    | `openai/gpt-5.4-mini` | ละไว้ / ผู้ให้บริการ/โมเดล `agentRuntime.id: "codex"` | harness แอปเซิร์ฟเวอร์ Codex | โปรไฟล์ OpenAI ที่เข้ากันได้กับ Codex |
    | `openai/gpt-5.5`      | ผู้ให้บริการ/โมเดล `agentRuntime.id: "pi"`              | รันไทม์แบบฝัง PI      | โปรไฟล์ `openai` หรือโปรไฟล์ `openai-codex` ที่เลือก |

    <Note>
    โมเดลเอเจนต์ `openai/*` ใช้ harness แอปเซิร์ฟเวอร์ Codex หากต้องการใช้การยืนยันตัวตนด้วยคีย์ API สำหรับโมเดลเอเจนต์ ให้สร้างโปรไฟล์คีย์ API ที่เข้ากันได้กับ Codex แล้วจัดลำดับด้วย `auth.order.openai`; `OPENAI_API_KEY` ยังคงเป็นตัวสำรองโดยตรงสำหรับพื้นผิว OpenAI API ที่ไม่ใช่เอเจนต์ รายการ `auth.order.openai-codex` รุ่นเก่ายังคงใช้งานได้
    </Note>

    ### ตัวอย่างการกำหนดค่า

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    หากต้องการลองโมเดล Instant ปัจจุบันของ ChatGPT จาก OpenAI API ให้ตั้งค่าโมเดลเป็น `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` เป็น alias ที่เปลี่ยนไป OpenAI ระบุว่าเป็นโมเดล Instant ล่าสุดที่ใช้ใน ChatGPT และแนะนำ `gpt-5.5` สำหรับการใช้งาน API ในโปรดักชัน ดังนั้นให้คง `openai/gpt-5.5` เป็นค่าเริ่มต้นที่เสถียร เว้นแต่คุณต้องการพฤติกรรม alias นั้นอย่างชัดเจน ปัจจุบัน alias นี้ยอมรับความละเอียดของข้อความเฉพาะ `medium` เท่านั้น ดังนั้น OpenClaw จะปรับ override ความละเอียดข้อความ OpenAI ที่เข้ากันไม่ได้สำหรับโมเดลนี้ให้เป็นปกติ

    <Warning>
    OpenClaw **ไม่** เปิดเผย `openai/gpt-5.3-codex-spark` คำขอ OpenAI API แบบสดจะปฏิเสธโมเดลนั้น และแค็ตตาล็อก Codex ปัจจุบันก็ไม่เปิดเผยเช่นกัน
    </Warning>

  </Tab>

  <Tab title="การสมัครใช้งาน Codex">
    **เหมาะที่สุดสำหรับ:** การใช้การสมัครใช้งาน ChatGPT/Codex ของคุณร่วมกับการเรียกใช้งานแอปเซิร์ฟเวอร์ Codex แบบเนทีฟแทนการใช้ API key แยกต่างหาก Codex cloud ต้องลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="เรียกใช้ Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        หรือเรียกใช้ OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        สำหรับการตั้งค่าแบบไม่มีหน้าจอหรือการตั้งค่าที่ไม่เอื้อต่อ callback ให้เพิ่ม `--device-code` เพื่อลงชื่อเข้าใช้ด้วยโฟลว์ device-code ของ ChatGPT แทน callback เบราว์เซอร์ localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="ใช้เส้นทางโมเดล OpenAI มาตรฐาน">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        ไม่จำเป็นต้องมีการกำหนดค่า runtime สำหรับเส้นทางเริ่มต้น รอบการทำงานของเอเจนต์ OpenAI
        จะเลือก runtime แอปเซิร์ฟเวอร์ Codex แบบเนทีฟโดยอัตโนมัติ และ OpenClaw
        จะติดตั้งหรือซ่อมแซม Plugin Codex ที่บันเดิลมาเมื่อเลือกเส้นทางนี้
      </Step>
      <Step title="ตรวจสอบว่า Codex auth พร้อมใช้งาน">
        ```bash
        openclaw models list --provider openai-codex
        ```

        หลังจาก gateway กำลังทำงานแล้ว ให้ส่ง `/codex status` หรือ `/codex models`
        ในแชตเพื่อตรวจสอบ runtime แอปเซิร์ฟเวอร์แบบเนทีฟ
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | อ้างอิงโมเดล | การกำหนดค่า runtime | เส้นทาง | Auth |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | ละไว้ / provider/model `agentRuntime.id: "codex"` | ฮาร์เนสแอปเซิร์ฟเวอร์ Codex แบบเนทีฟ | การลงชื่อเข้าใช้ Codex หรือโปรไฟล์ auth `openai` ตามลำดับ |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "pi"` | runtime ฝังตัวของ PI พร้อมทรานสปอร์ต Codex-auth ภายใน | โปรไฟล์ `openai-codex` ที่เลือก |
    | `openai-codex/gpt-5.5` | ซ่อมแซมโดย doctor | เส้นทางเดิมถูกเขียนใหม่เป็น `openai/gpt-5.5` | โปรไฟล์ `openai-codex` ที่มีอยู่ |

    <Warning>
    อย่ากำหนดค่าอ้างอิงโมเดล `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` หรือ
    `openai-codex/gpt-5.3*` รุ่นเก่า บัญชี ChatGPT/Codex OAuth ตอนนี้ปฏิเสธ
    โมเดลเหล่านั้น ให้ใช้ `openai/gpt-5.5`; ตอนนี้รอบการทำงานของเอเจนต์ OpenAI จะเลือก runtime
    Codex โดยค่าเริ่มต้น
    </Warning>

    <Note>
    คำนำหน้าโมเดล `openai-codex/*` เป็นการกำหนดค่าแบบเดิมที่ซ่อมแซมโดย doctor สำหรับ
    การตั้งค่าทั่วไปที่ใช้การสมัครใช้งานร่วมกับ runtime แบบเนทีฟ ให้ลงชื่อเข้าใช้ด้วย Codex auth
    แต่คงอ้างอิงโมเดลไว้เป็น `openai/gpt-5.5` การกำหนดค่าใหม่ควรวางลำดับ auth ของเอเจนต์ OpenAI
    ไว้ใต้ `auth.order.openai`; รายการ `auth.order.openai-codex`
    รุ่นเก่ายังคงใช้ได้
    </Note>

    ### ตัวอย่างการกำหนดค่า

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    เมื่อมี API-key สำรอง ให้คงโมเดลไว้ที่ `openai/gpt-5.5` และวาง
    ลำดับ auth ไว้ใต้ `openai` OpenClaw จะลองใช้การสมัครใช้งานก่อน จากนั้น
    จึงใช้ API key โดยยังคงอยู่บนฮาร์เนส Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai-codex:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    Onboarding จะไม่นำเข้าวัสดุ OAuth จาก `~/.codex` อีกต่อไป ให้ลงชื่อเข้าใช้ด้วยเบราว์เซอร์ OAuth (ค่าเริ่มต้น) หรือโฟลว์ device-code ข้างต้น — OpenClaw จัดการข้อมูลประจำตัวที่ได้ในที่จัดเก็บ auth ของเอเจนต์ของตัวเอง
    </Note>

    ### ตรวจสอบและกู้คืนการกำหนดเส้นทาง Codex OAuth

    ใช้คำสั่งเหล่านี้เพื่อดูว่าเอเจนต์เริ่มต้นของคุณกำลังใช้โมเดล runtime และเส้นทาง auth ใด:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    สำหรับเอเจนต์เฉพาะ ให้เพิ่ม `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    หากการกำหนดค่ารุ่นเก่ายังคงมี `openai-codex/gpt-*` หรือพินเซสชัน OpenAI PI
    ที่ค้างอยู่โดยไม่มีการกำหนดค่า runtime อย่างชัดเจน ให้ซ่อมแซม:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    หาก `models auth list --provider openai-codex` ไม่แสดงโปรไฟล์ที่ใช้งานได้ ให้ลงชื่อเข้าใช้
    อีกครั้ง:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai/*` คือเส้นทางโมเดลสำหรับรอบการทำงานของเอเจนต์ OpenAI ผ่าน Codex
    provider id ของ auth/profile `openai-codex` ยังคงได้รับการยอมรับสำหรับโปรไฟล์
    ที่มีอยู่และการแสดงรายการของ CLI

    ### ตัวบ่งชี้สถานะ

    แชต `/status` จะแสดงว่า runtime ของโมเดลใดทำงานอยู่สำหรับเซสชันปัจจุบัน
    ฮาร์เนสแอปเซิร์ฟเวอร์ Codex ที่บันเดิลมาจะแสดงเป็น `Runtime: OpenAI Codex` สำหรับ
    รอบการทำงานของโมเดลเอเจนต์ OpenAI พินเซสชัน PI ที่ค้างอยู่จะถูกซ่อมแซมเป็น Codex เว้นแต่
    การกำหนดค่าจะพิน PI ไว้อย่างชัดเจน

    ### คำเตือนของ doctor

    หากเส้นทาง `openai-codex/*` หรือพิน OpenAI PI ที่ค้างอยู่ยังเหลืออยู่ในการกำหนดค่า หรือ
    สถานะเซสชัน `openclaw doctor --fix` จะเขียนใหม่เป็น `openai/*` พร้อม runtime
    Codex เว้นแต่จะกำหนดค่า PI ไว้อย่างชัดเจน

    ### เพดาน context window

    OpenClaw ถือว่า metadata ของโมเดลและเพดานคอนเท็กซ์ของ runtime เป็นค่าคนละชุดกัน

    สำหรับ `openai/gpt-5.5` ผ่านแคตตาล็อก Codex OAuth:

    - `contextWindow` แบบเนทีฟ: `1000000`
    - เพดาน `contextTokens` ของ runtime เริ่มต้น: `272000`

    เพดานเริ่มต้นที่เล็กกว่ามีคุณลักษณะด้านเวลาแฝงและคุณภาพที่ดีกว่าในการใช้งานจริง เขียนทับได้ด้วย `contextTokens`:

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
    ใช้ `contextWindow` เพื่อประกาศ metadata ของโมเดลแบบเนทีฟ ใช้ `contextTokens` เพื่อจำกัดงบประมาณคอนเท็กซ์ของ runtime
    </Note>

    ### การกู้คืนแคตตาล็อก

    OpenClaw ใช้ metadata แคตตาล็อก Codex จาก upstream สำหรับ `gpt-5.5` เมื่อมีอยู่
    หากการค้นพบ Codex แบบสดละเว้นแถว `gpt-5.5` ในขณะที่
    บัญชีผ่านการยืนยันตัวตนแล้ว OpenClaw จะสังเคราะห์แถวโมเดล OAuth นั้นเพื่อให้
    cron, sub-agent และการรัน default-model ที่กำหนดค่าไว้ไม่ล้มเหลวด้วย
    `Unknown model`

  </Tab>
</Tabs>

## Auth แอปเซิร์ฟเวอร์ Codex แบบเนทีฟ

ฮาร์เนสแอปเซิร์ฟเวอร์ Codex แบบเนทีฟใช้การอ้างอิงโมเดล `openai/*` ร่วมกับการละเว้น
การกำหนดค่า runtime หรือ provider/model `agentRuntime.id: "codex"` แต่ auth ของมัน
ยังคงอิงตามบัญชี OpenClaw เลือก auth ตามลำดับนี้:

1. โปรไฟล์ auth OpenAI ตามลำดับสำหรับเอเจนต์ โดยควรอยู่ใต้
   `auth.order.openai` โปรไฟล์ `openai-codex:*` ที่มีอยู่และ
   `auth.order.openai-codex` ยังคงใช้ได้สำหรับการติดตั้งรุ่นเก่า
2. บัญชีที่มีอยู่ของแอปเซิร์ฟเวอร์ เช่น การลงชื่อเข้าใช้ ChatGPT ของ Codex CLI ในเครื่อง
3. สำหรับการเปิดใช้แอปเซิร์ฟเวอร์ stdio ในเครื่องเท่านั้น `CODEX_API_KEY` จากนั้น
   `OPENAI_API_KEY` เมื่อแอปเซิร์ฟเวอร์รายงานว่าไม่มีบัญชีและยังต้องการ
   OpenAI auth

ซึ่งหมายความว่าการลงชื่อเข้าใช้การสมัครใช้งาน ChatGPT/Codex ในเครื่องจะไม่ถูกแทนที่เพียง
เพราะกระบวนการ gateway มี `OPENAI_API_KEY` สำหรับโมเดล OpenAI โดยตรง
หรือ embeddings ด้วย การ fallback ไปใช้ env API-key เป็นเส้นทาง stdio ในเครื่องที่ไม่มีบัญชีเท่านั้น;
จะไม่ถูกส่งไปยังการเชื่อมต่อแอปเซิร์ฟเวอร์ WebSocket เมื่อเลือกโปรไฟล์ Codex
แบบการสมัครใช้งาน OpenClaw ยังกัน `CODEX_API_KEY` และ `OPENAI_API_KEY`
ออกจาก child แอปเซิร์ฟเวอร์ stdio ที่ spawn ขึ้นมา และส่งข้อมูลประจำตัวที่เลือก
ผ่าน RPC login ของแอปเซิร์ฟเวอร์ เมื่อโปรไฟล์การสมัครใช้งานนั้นถูกบล็อกโดย
ขีดจำกัดการใช้งาน Codex OpenClaw สามารถสลับไปยังโปรไฟล์ API-key `openai:*`
ลำดับถัดไปได้โดยไม่เปลี่ยนโมเดลที่เลือกหรือออกจากฮาร์เนส Codex
เมื่อเวลาการรีเซ็ตของการสมัครใช้งานผ่านไป โปรไฟล์การสมัครใช้งานจะมีสิทธิ์ใช้งานอีกครั้ง

## การสร้างรูปภาพ

Plugin `openai` ที่บันเดิลมาจะลงทะเบียนการสร้างรูปภาพผ่านเครื่องมือ `image_generate`
รองรับทั้งการสร้างรูปภาพด้วย API-key ของ OpenAI และการสร้างรูปภาพด้วย Codex OAuth
ผ่านอ้างอิงโมเดล `openai/gpt-image-2` เดียวกัน

| ความสามารถ                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| อ้างอิงโมเดล                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | การลงชื่อเข้าใช้ OpenAI Codex OAuth           |
| ทรานสปอร์ต                 | OpenAI Images API                  | แบ็กเอนด์ Codex Responses              |
| จำนวนรูปภาพสูงสุดต่อคำขอ    | 4                                  | 4                                    |
| โหมดแก้ไข                 | เปิดใช้ (สูงสุด 5 รูปภาพอ้างอิง) | เปิดใช้ (สูงสุด 5 รูปภาพอ้างอิง)   |
| การเขียนทับขนาด            | รองรับ รวมถึงขนาด 2K/4K   | รองรับ รวมถึงขนาด 2K/4K     |
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
ดู [การสร้างรูปภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

`gpt-image-2` เป็นค่าเริ่มต้นสำหรับทั้งการสร้างรูปภาพจากข้อความของ OpenAI และการ
แก้ไขรูปภาพ `gpt-image-1.5`, `gpt-image-1` และ `gpt-image-1-mini` ยังคงใช้งานได้ในฐานะ
การเขียนทับโมเดลอย่างชัดเจน ใช้ `openai/gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP
พื้นหลังโปร่งใส; API `gpt-image-2` ปัจจุบันปฏิเสธ
`background: "transparent"`

สำหรับคำขอพื้นหลังโปร่งใส เอเจนต์ควรเรียก `image_generate` ด้วย
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` หรือ `"webp"` และ
`background: "transparent"`; ตัวเลือก provider `openai.background` รุ่นเก่า
ยังคงได้รับการยอมรับ OpenClaw ยังปกป้องเส้นทาง OpenAI สาธารณะและ
OpenAI Codex OAuth โดยเขียนคำขอพื้นหลังโปร่งใส `openai/gpt-image-2` เริ่มต้น
ใหม่เป็น `gpt-image-1.5`; Azure และปลายทางแบบเข้ากันได้กับ OpenAI แบบกำหนดเองจะคง
ชื่อ deployment/model ที่กำหนดค่าไว้

การตั้งค่าเดียวกันนี้เปิดเผยสำหรับการรัน CLI แบบไม่มีหน้าจอด้วย:

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
`--openai-background` ยังคงพร้อมใช้งานในฐานะ alias เฉพาะ OpenAI

สำหรับการติดตั้ง Codex OAuth ให้คงอ้างอิง `openai/gpt-image-2` เดิมไว้ เมื่อมีการกำหนดค่า
โปรไฟล์ OAuth `openai-codex` OpenClaw จะแปลงโทเค็นการเข้าถึง OAuth
ที่จัดเก็บไว้และส่งคำขอรูปภาพผ่านแบ็กเอนด์ Codex Responses โดยจะไม่
ลองใช้ `OPENAI_API_KEY` ก่อนหรือ fallback ไปยัง API key สำหรับคำขอนั้นแบบเงียบๆ
ให้กำหนดค่า `models.providers.openai` อย่างชัดเจนด้วย API key,
URL ฐานแบบกำหนดเอง หรือปลายทาง Azure เมื่อคุณต้องการเส้นทาง OpenAI Images API
โดยตรงแทน
หากปลายทางรูปภาพแบบกำหนดเองนั้นอยู่บนที่อยู่ LAN/private ที่เชื่อถือได้ ให้ตั้งค่า
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ด้วย; OpenClaw จะบล็อก
ปลายทางรูปภาพแบบเข้ากันได้กับ OpenAI ที่เป็น private/internal ไว้ เว้นแต่จะมีการเลือกใช้
นี้

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

Plugin `openai` ที่มาพร้อมระบบลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ `video_generate`

| ความสามารถ       | ค่า                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| โมเดลเริ่มต้น    | `openai/sora-2`                                                                   |
| โหมด            | ข้อความเป็นวิดีโอ, รูปภาพเป็นวิดีโอ, แก้ไขวิดีโอเดี่ยว                                  |
| อินพุตอ้างอิง | รูปภาพ 1 รายการหรือวิดีโอ 1 รายการ                                                                |
| การแทนที่ขนาด   | รองรับ                                                                         |
| การแทนที่อื่น ๆ  | `aspectRatio`, `resolution`, `audio`, `watermark` จะถูกละเว้นพร้อมคำเตือนจากเครื่องมือ |

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

## การสนับสนุนพรอมป์ GPT-5

OpenClaw เพิ่มการสนับสนุนพรอมป์ GPT-5 ที่ใช้ร่วมกันสำหรับการรันตระกูล GPT-5 ข้ามผู้ให้บริการ โดยใช้ตาม id ของโมเดล ดังนั้น `openai/gpt-5.5`, refs แบบเดิมก่อนการซ่อมแซม เช่น `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` และ refs GPT-5 อื่น ๆ ที่เข้ากันได้จะได้รับ overlay เดียวกัน โมเดล GPT-4.x ที่เก่ากว่าจะไม่ได้รับ

harness Codex แบบ native ที่มาพร้อมระบบใช้พฤติกรรม GPT-5 และ Heartbeat overlay เดียวกันผ่านคำสั่ง developer ของ app-server Codex ดังนั้นเซสชัน `openai/gpt-5.x` ที่ route ผ่าน Codex จะคงแนวทางการติดตามงานและ Heartbeat เชิงรุกแบบเดียวกัน แม้ว่า Codex จะเป็นเจ้าของพรอมป์ส่วนอื่นของ harness

การสนับสนุน GPT-5 เพิ่มสัญญาพฤติกรรมแบบมีแท็กสำหรับการคงบุคลิก ความปลอดภัยในการดำเนินการ วินัยการใช้เครื่องมือ รูปแบบเอาต์พุต การตรวจสอบการเสร็จสิ้น และการยืนยันผล พฤติกรรมการตอบกลับเฉพาะช่องทางและข้อความเงียบยังคงอยู่ในพรอมป์ระบบ OpenClaw ที่ใช้ร่วมกันและนโยบายการส่งออก คำแนะนำ GPT-5 จะเปิดใช้งานเสมอสำหรับโมเดลที่ตรงกัน เลเยอร์สไตล์การโต้ตอบแบบเป็นมิตรแยกต่างหากและกำหนดค่าได้

| ค่า                  | ผลลัพธ์                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้เลเยอร์สไตล์การโต้ตอบแบบเป็นมิตร |
| `"on"`                 | alias สำหรับ `"friendly"`                      |
| `"off"`                | ปิดใช้เฉพาะเลเยอร์สไตล์แบบเป็นมิตร       |

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
ค่าจะไม่แยกตัวพิมพ์เล็กใหญ่ขณะรัน ดังนั้นทั้ง `"Off"` และ `"off"` จะปิดใช้เลเยอร์สไตล์แบบเป็นมิตร
</Tip>

<Note>
ค่าเดิม `plugins.entries.openai.config.personality` ยังคงถูกอ่านเป็น fallback เพื่อความเข้ากันได้ เมื่อยังไม่ได้ตั้งค่าการตั้งค่าที่ใช้ร่วมกัน `agents.defaults.promptOverlays.gpt5.personality`
</Note>

## เสียงและคำพูด

<AccordionGroup>
  <Accordion title="การสังเคราะห์เสียงพูด (TTS)">
    Plugin `openai` ที่มาพร้อมระบบลงทะเบียนการสังเคราะห์เสียงพูดสำหรับ surface `messages.tts`

    | การตั้งค่า | path การกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | เสียง | `messages.tts.providers.openai.voice` | `coral` |
    | ความเร็ว | `messages.tts.providers.openai.speed` | (ไม่ได้ตั้งค่า) |
    | คำสั่ง | `messages.tts.providers.openai.instructions` | (ไม่ได้ตั้งค่า, เฉพาะ `gpt-4o-mini-tts`) |
    | รูปแบบ | `messages.tts.providers.openai.responseFormat` | `opus` สำหรับ voice notes, `mp3` สำหรับไฟล์ |
    | คีย์ API | `messages.tts.providers.openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |
    | URL ฐาน | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | body เพิ่มเติม | `messages.tts.providers.openai.extraBody` / `extra_body` | (ไม่ได้ตั้งค่า) |

    โมเดลที่มีให้ใช้: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd` เสียงที่มีให้ใช้: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`

    `extraBody` จะถูก merge เข้ากับ JSON คำขอ `/audio/speech` หลังฟิลด์ที่ OpenClaw สร้างขึ้น ดังนั้นให้ใช้สำหรับ endpoint ที่เข้ากันได้กับ OpenAI ซึ่งต้องการคีย์เพิ่มเติม เช่น `lang` คีย์ prototype จะถูกละเว้น

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
    ตั้งค่า `OPENAI_TTS_BASE_URL` เพื่อแทนที่ URL ฐานของ TTS โดยไม่กระทบ endpoint ของ chat API OpenAI TTS ยังคงกำหนดค่าผ่านคีย์ API; สำหรับ live talk-back ที่ใช้ OAuth เท่านั้น ให้ใช้ path เสียง Realtime แทนเสียงพูดแบบ agent-mode STT -> TTS
    </Note>

  </Accordion>

  <Accordion title="เสียงพูดเป็นข้อความ">
    Plugin `openai` ที่มาพร้อมระบบลงทะเบียนเสียงพูดเป็นข้อความแบบแบตช์ผ่าน
    surface การถอดเสียงเพื่อทำความเข้าใจสื่อของ OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - path อินพุต: การอัปโหลดไฟล์เสียงแบบ multipart
    - รองรับโดย OpenClaw ทุกที่ที่การถอดเสียงขาเข้าใช้
      `tools.media.audio` รวมถึงส่วนของช่องเสียง Discord และไฟล์แนบเสียง
      ของช่องทาง

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

    คำใบ้ภาษาและพรอมป์จะถูกส่งต่อไปยัง OpenAI เมื่อมีการระบุโดย
    การกำหนดค่าสื่อเสียงที่ใช้ร่วมกันหรือคำขอถอดเสียงรายครั้ง

  </Accordion>

  <Accordion title="Realtime transcription">
    Plugin `openai` ที่รวมมาให้ลงทะเบียนการถอดเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | เส้นทางการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | ภาษา | `...openai.language` | (ไม่ได้ตั้งค่า) |
    | พรอมป์ | `...openai.prompt` | (ไม่ได้ตั้งค่า) |
    | ระยะเวลาความเงียบ | `...openai.silenceDurationMs` | `800` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | การยืนยันตัวตน | `...openai.apiKey`, `OPENAI_API_KEY`, หรือ OAuth `openai-codex` | คีย์ API เชื่อมต่อโดยตรง; OAuth ออก client secret สำหรับการถอดเสียงแบบเรียลไทม์ |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียง G.711 u-law (`g711_ulaw` / `audio/pcmu`) เมื่อกำหนดค่าเฉพาะ OAuth `openai-codex` เท่านั้น Gateway จะออก client secret สำหรับการถอดเสียงแบบเรียลไทม์แบบชั่วคราวก่อนเปิด WebSocket ผู้ให้บริการสตรีมมิงนี้ใช้สำหรับเส้นทางการถอดเสียงแบบเรียลไทม์ของ Voice Call; ขณะนี้เสียงของ Discord บันทึกช่วงสั้น ๆ และใช้เส้นทางการถอดเสียงแบบแบตช์ `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Plugin `openai` ที่รวมมาให้ลงทะเบียนเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | เส้นทางการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | เสียง | `...openai.voice` | `alloy` |
    | อุณหภูมิ (บริดจ์การปรับใช้ Azure) | `...openai.temperature` | `0.8` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | ระยะเวลาความเงียบ | `...openai.silenceDurationMs` | `500` |
    | การเติมคำนำหน้า | `...openai.prefixPaddingMs` | `300` |
    | ระดับความพยายามในการให้เหตุผล | `...openai.reasoningEffort` | (ไม่ได้ตั้งค่า) |
    | การยืนยันตัวตน | `...openai.apiKey`, `OPENAI_API_KEY`, หรือ OAuth `openai-codex` | Browser Talk และบริดจ์แบ็กเอนด์ที่ไม่ใช่ Azure สามารถใช้ Codex OAuth ได้ |

    เสียง Realtime ในตัวที่มีให้สำหรับ `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`
    OpenAI แนะนำ `marin` และ `cedar` เพื่อคุณภาพ Realtime ที่ดีที่สุด ชุดนี้
    เป็นชุดแยกจากเสียงแปลงข้อความเป็นเสียงข้างต้น; อย่าสันนิษฐานว่าเสียง TTS
    เช่น `fable`, `nova` หรือ `onyx` ใช้ได้กับเซสชัน Realtime

    <Note>
    บริดจ์ Realtime ของ OpenAI ฝั่งแบ็กเอนด์ใช้รูปแบบเซสชัน Realtime WebSocket แบบ GA ซึ่งไม่รับ `session.temperature` การปรับใช้ Azure OpenAI ยังคงพร้อมใช้งานผ่าน `azureEndpoint` และ `azureDeployment` และรักษารูปแบบเซสชันที่เข้ากันได้กับการปรับใช้ไว้ รองรับการเรียกเครื่องมือสองทางและเสียง G.711 u-law
    </Note>

    <Note>
    เสียง Realtime จะถูกเลือกเมื่อสร้างเซสชัน OpenAI อนุญาตให้เปลี่ยนฟิลด์เซสชัน
    ส่วนใหญ่ภายหลังได้ แต่ไม่สามารถเปลี่ยนเสียงได้หลังจากโมเดลปล่อยเสียงออกมาใน
    เซสชันนั้นแล้ว ขณะนี้ OpenClaw เปิดเผย id เสียง Realtime ในตัวเป็นสตริง
    </Note>

    <Note>
    Control UI Talk ใช้เซสชัน Realtime ของ OpenAI บนเบราว์เซอร์พร้อม client secret
    แบบชั่วคราวที่ Gateway ออกให้ และการแลกเปลี่ยน SDP ของ WebRTC จากเบราว์เซอร์โดยตรงกับ
    OpenAI Realtime API เมื่อไม่ได้กำหนดค่าคีย์ OpenAI API โดยตรง
    Gateway สามารถออก client secret นั้นด้วยโปรไฟล์ OAuth `openai-codex`
    ที่เลือกไว้ได้ Gateway relay และบริดจ์ WebSocket Realtime ฝั่งแบ็กเอนด์ของ Voice Call ใช้
    OAuth fallback เดียวกันสำหรับปลายทาง OpenAI แบบเนทีฟ การตรวจสอบแบบสดสำหรับผู้ดูแล
    มีให้ใช้งานด้วย
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ขา OpenAI ตรวจสอบทั้งบริดจ์ WebSocket ฝั่งแบ็กเอนด์และการแลกเปลี่ยน SDP ของ WebRTC
    บนเบราว์เซอร์โดยไม่บันทึกความลับ
    </Note>

  </Accordion>
</AccordionGroup>

## ปลายทาง Azure OpenAI

ผู้ให้บริการ `openai` ที่รวมมาให้สามารถกำหนดเป้าหมายไปยังทรัพยากร Azure OpenAI สำหรับการสร้างภาพ
ได้โดยการแทนที่ URL ฐาน บนเส้นทางการสร้างภาพ OpenClaw
ตรวจจับชื่อโฮสต์ Azure บน `models.providers.openai.baseUrl` และสลับไปใช้
รูปแบบคำขอของ Azure โดยอัตโนมัติ

<Note>
เสียง Realtime ใช้เส้นทางการกำหนดค่าแยกต่างหาก
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
และไม่ได้รับผลกระทบจาก `models.providers.openai.baseUrl` ดูแอคคอร์เดียน **เสียง
Realtime** ใต้ [เสียงและการพูด](#voice-and-speech) สำหรับการตั้งค่า Azure
ของส่วนนี้
</Note>

ใช้ Azure OpenAI เมื่อ:

- คุณมีการสมัครใช้งาน Azure OpenAI, quota หรือข้อตกลงระดับองค์กรอยู่แล้ว
- คุณต้องการการพำนักของข้อมูลตามภูมิภาคหรือการควบคุมการปฏิบัติตามข้อกำหนดที่ Azure มีให้
- คุณต้องการให้ทราฟฟิกอยู่ภายใน Azure tenancy ที่มีอยู่

### การกำหนดค่า

สำหรับการสร้างภาพผ่าน Azure ด้วยผู้ให้บริการ `openai` ที่รวมมาให้ ให้ชี้
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

OpenClaw จดจำส่วนต่อท้ายโฮสต์ Azure เหล่านี้สำหรับเส้นทางการสร้างภาพของ Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

สำหรับคำขอสร้างภาพบนโฮสต์ Azure ที่จดจำได้ OpenClaw จะ:

- ส่งส่วนหัว `api-key` แทน `Authorization: Bearer`
- ใช้เส้นทางที่มีขอบเขตตามการปรับใช้ (`/openai/deployments/{deployment}/...`)
- ต่อท้าย `?api-version=...` ในแต่ละคำขอ
- ใช้ timeout คำขอเริ่มต้น 600 วินาทีสำหรับการเรียกสร้างภาพของ Azure
  ค่า `timeoutMs` รายการต่อการเรียกยังคงแทนที่ค่าเริ่มต้นนี้

URL ฐานอื่น ๆ (OpenAI สาธารณะ, พร็อกซีที่เข้ากันได้กับ OpenAI) ยังคงใช้
รูปแบบคำขอสร้างภาพมาตรฐานของ OpenAI

<Note>
การกำหนดเส้นทาง Azure สำหรับเส้นทางการสร้างภาพของผู้ให้บริการ `openai` ต้องใช้
OpenClaw 2026.4.22 หรือใหม่กว่า เวอร์ชันก่อนหน้าจะถือว่า
`openai.baseUrl` แบบกำหนดเองใด ๆ เป็นเหมือนปลายทาง OpenAI สาธารณะ และจะล้มเหลวกับการปรับใช้
ภาพของ Azure
</Note>

### เวอร์ชัน API

ตั้งค่า `AZURE_OPENAI_API_VERSION` เพื่อปักหมุดเวอร์ชันตัวอย่าง Azure หรือเวอร์ชัน GA เฉพาะ
สำหรับเส้นทางการสร้างภาพของ Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

ค่าเริ่มต้นคือ `2024-12-01-preview` เมื่อไม่ได้ตั้งค่าตัวแปรนี้

### ชื่อโมเดลคือชื่อ deployment

Azure OpenAI ผูกโมเดลกับ deployment สำหรับคำขอสร้างภาพของ Azure
ที่ถูกส่งผ่าน provider `openai` ที่รวมมาให้ ฟิลด์ `model` ใน OpenClaw
ต้องเป็น **ชื่อ Azure deployment** ที่คุณกำหนดค่าไว้ในพอร์ทัล Azure ไม่ใช่
id โมเดล OpenAI สาธารณะ

หากคุณสร้าง deployment ชื่อ `gpt-image-2-prod` ที่ให้บริการ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

กฎชื่อ deployment เดียวกันนี้ใช้กับการเรียกสร้างภาพที่ถูกส่งผ่าน
provider `openai` ที่รวมมาให้ด้วย

### ความพร้อมใช้งานตามภูมิภาค

ขณะนี้การสร้างภาพของ Azure พร้อมใช้งานเฉพาะในบางภูมิภาคเท่านั้น
(เช่น `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`) ตรวจสอบรายการภูมิภาคปัจจุบันของ Microsoft ก่อนสร้าง
deployment และยืนยันว่าโมเดลที่ต้องการมีให้บริการในภูมิภาคของคุณ

### ความแตกต่างของพารามิเตอร์

Azure OpenAI และ OpenAI สาธารณะไม่ได้ยอมรับพารามิเตอร์ภาพชุดเดียวกันเสมอไป
Azure อาจปฏิเสธตัวเลือกที่ OpenAI สาธารณะอนุญาต (เช่น ค่า
`background` บางค่าบน `gpt-image-2`) หรือเปิดให้ใช้เฉพาะกับเวอร์ชันโมเดล
บางเวอร์ชันเท่านั้น ความแตกต่างเหล่านี้มาจาก Azure และโมเดลพื้นฐาน ไม่ใช่
OpenClaw หากคำขอ Azure ล้มเหลวด้วยข้อผิดพลาดการตรวจสอบความถูกต้อง ให้ตรวจสอบ
ชุดพารามิเตอร์ที่ deployment และเวอร์ชัน API เฉพาะของคุณรองรับใน
พอร์ทัล Azure

<Note>
Azure OpenAI ใช้การส่งผ่านแบบเนทีฟและพฤติกรรมความเข้ากันได้ แต่ไม่ได้รับ
ส่วนหัวการระบุแหล่งที่มาที่ซ่อนอยู่ของ OpenClaw — ดูแอคคอร์เดียน **เส้นทางเนทีฟเทียบกับเส้นทางที่เข้ากันได้กับ OpenAI**
ใต้ [การกำหนดค่าขั้นสูง](#advanced-configuration)

สำหรับทราฟฟิกแชตหรือ Responses บน Azure (นอกเหนือจากการสร้างภาพ) ให้ใช้
โฟลว์ onboarding หรือ config provider Azure เฉพาะ — `openai.baseUrl` เพียงอย่างเดียว
จะไม่รับรูปแบบ API/auth ของ Azure มี provider
`azure-openai-responses/*` แยกต่างหาก โปรดดูแอคคอร์เดียน Compaction ฝั่งเซิร์ฟเวอร์ด้านล่าง
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การส่งผ่าน (WebSocket กับ SSE)">
    OpenClaw ใช้ WebSocket ก่อน โดยมี SSE เป็นทางสำรอง (`"auto"`) สำหรับ `openai/*`

    ในโหมด `"auto"` OpenClaw จะ:
    - ลอง WebSocket ซ้ำหนึ่งครั้งเมื่อเกิดความล้มเหลวตั้งแต่ต้น ก่อนถอยกลับไปใช้ SSE
    - หลังเกิดความล้มเหลว ทำเครื่องหมาย WebSocket ว่าเสื่อมคุณภาพประมาณ 60 วินาที และใช้ SSE ระหว่างช่วงพัก
    - แนบส่วนหัวตัวตน session และ turn ที่เสถียรสำหรับการลองใหม่และการเชื่อมต่อใหม่
    - ปรับตัวนับการใช้งาน (`input_tokens` / `prompt_tokens`) ให้เป็นรูปแบบเดียวกันในตัวแปรการส่งผ่านต่าง ๆ

    | ค่า | พฤติกรรม |
    |-------|----------|
    | `"auto"` (ค่าเริ่มต้น) | ใช้ WebSocket ก่อน และมี SSE เป็นทางสำรอง |
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
          },
        },
      },
    }
    ```

    เอกสาร OpenAI ที่เกี่ยวข้อง:
    - [Realtime API พร้อม WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [การตอบกลับ Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="โหมดเร็ว">
    OpenClaw เปิดเผยสวิตช์โหมดเร็วแบบใช้ร่วมกันสำหรับ `openai/*`:

    - **แชต/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    เมื่อเปิดใช้งาน OpenClaw จะจับคู่โหมดเร็วกับการประมวลผลแบบมีลำดับความสำคัญของ OpenAI (`service_tier = "priority"`) ค่า `service_tier` ที่มีอยู่จะถูกคงไว้ และโหมดเร็วจะไม่เขียน `reasoning` หรือ `text.verbosity` ใหม่

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
    การ override ของ session มีผลเหนือกว่า config การล้าง override ของ session ใน UI Sessions จะคืน session กลับเป็นค่าเริ่มต้นที่กำหนดค่าไว้
    </Note>

  </Accordion>

  <Accordion title="การประมวลผลแบบมีลำดับความสำคัญ (service_tier)">
    API ของ OpenAI เปิดให้ใช้การประมวลผลแบบมีลำดับความสำคัญผ่าน `service_tier` ตั้งค่าแยกตามโมเดลใน OpenClaw:

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
    `serviceTier` จะถูกส่งต่อไปยัง endpoint OpenAI แบบเนทีฟ (`api.openai.com`) และ endpoint Codex แบบเนทีฟ (`chatgpt.com/backend-api`) เท่านั้น หากคุณส่ง provider ใด provider หนึ่งผ่าน proxy OpenClaw จะปล่อย `service_tier` ไว้โดยไม่แก้ไข
    </Warning>

  </Accordion>

  <Accordion title="Compaction ฝั่งเซิร์ฟเวอร์ (Responses API)">
    สำหรับโมเดล OpenAI Responses โดยตรง (`openai/*` บน `api.openai.com`) ตัวครอบสตรีม Pi-harness ของ Plugin OpenAI จะเปิดใช้ Compaction ฝั่งเซิร์ฟเวอร์โดยอัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ความเข้ากันได้ของโมเดลตั้งค่า `supportsStore: false`)
    - แทรก `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - ค่าเริ่มต้นของ `compact_threshold`: 70% ของ `contextWindow` (หรือ `80000` เมื่อไม่มีข้อมูล)

    สิ่งนี้ใช้กับเส้นทาง Pi harness ในตัว และกับ hook ของ provider OpenAI ที่ใช้โดยการรันแบบฝังตัว harness ของเซิร์ฟเวอร์แอป Codex แบบเนทีฟจัดการบริบทของตนเองผ่าน Codex และถูกกำหนดค่าโดยเส้นทาง agent เริ่มต้นของ OpenAI หรือ policy runtime ของ provider/model

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
      <Tab title="เกณฑ์กำหนดเอง">
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
    สำหรับการรันตระกูล GPT-5 บน `openai/*` OpenClaw สามารถใช้สัญญาการดำเนินการแบบฝังตัวที่เข้มงวดกว่าได้:

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
    - ไม่ถือว่า turn ที่มีเฉพาะแผนเป็นความคืบหน้าที่สำเร็จอีกต่อไป เมื่อมีการดำเนินการ tool พร้อมใช้งาน
    - ลอง turn ซ้ำด้วยการชี้นำให้ลงมือทำทันที
    - เปิดใช้ `update_plan` โดยอัตโนมัติสำหรับงานที่มีนัยสำคัญ
    - แสดงสถานะถูกบล็อกอย่างชัดเจน หากโมเดลยังคงวางแผนโดยไม่ลงมือทำ

    <Note>
    จำกัดเฉพาะการรันตระกูล GPT-5 ของ OpenAI และ Codex เท่านั้น provider อื่นและตระกูลโมเดลเก่ากว่าจะคงพฤติกรรมเริ่มต้นไว้
    </Note>

  </Accordion>

  <Accordion title="เส้นทางเนทีฟเทียบกับเส้นทางที่เข้ากันได้กับ OpenAI">
    OpenClaw ปฏิบัติต่อ endpoint OpenAI, Codex และ Azure OpenAI โดยตรงต่างจาก proxy `/v1` ทั่วไปที่เข้ากันได้กับ OpenAI:

    **เส้นทางเนทีฟ** (`openai/*`, Azure OpenAI):
    - คง `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับ effort `none` ของ OpenAI
    - ละเว้น reasoning ที่ปิดใช้งานสำหรับโมเดลหรือ proxy ที่ปฏิเสธ `reasoning.effort: "none"`
    - ตั้งค่าเริ่มต้นของ schema ของ tool เป็นโหมด strict
    - แนบส่วนหัวการระบุแหล่งที่มาที่ซ่อนอยู่เฉพาะบนโฮสต์เนทีฟที่ยืนยันแล้ว
    - คงการจัดรูปคำขอเฉพาะ OpenAI (`service_tier`, `store`, reasoning-compat, hint ของ prompt-cache)

    **เส้นทาง proxy/compatible:**
    - ใช้พฤติกรรมความเข้ากันได้ที่ยืดหยุ่นกว่า
    - ตัด `store` ของ Completions ออกจาก payload `openai-completions` ที่ไม่ใช่เนทีฟ
    - ยอมรับ JSON pass-through ขั้นสูง `params.extra_body`/`params.extraBody` สำหรับ proxy Completions ที่เข้ากันได้กับ OpenAI
    - ยอมรับ `params.chat_template_kwargs` สำหรับ proxy Completions ที่เข้ากันได้กับ OpenAI เช่น vLLM
    - ไม่บังคับใช้ schema ของ tool แบบ strict หรือส่วนหัวเฉพาะเนทีฟ

    Azure OpenAI ใช้การส่งผ่านแบบเนทีฟและพฤติกรรมความเข้ากันได้ แต่ไม่ได้รับส่วนหัวการระบุแหล่งที่มาที่ซ่อนอยู่

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์ tool ภาพที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ tool วิดีโอที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="OAuth และ auth" href="/th/gateway/authentication" icon="key">
    รายละเอียด auth และกฎการนำข้อมูลรับรองกลับมาใช้
  </Card>
</CardGroup>
