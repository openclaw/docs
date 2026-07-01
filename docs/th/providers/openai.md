---
read_when:
    - คุณต้องการใช้โมเดล OpenAI ใน OpenClaw
    - คุณต้องการการตรวจสอบสิทธิ์ด้วยการสมัครสมาชิก Codex แทนคีย์ API
    - คุณต้องการพฤติกรรมการทำงานของเอเจนต์ GPT-5 ที่เข้มงวดยิ่งขึ้น
summary: ใช้ OpenAI ผ่านคีย์ API หรือการสมัครสมาชิก Codex ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-01T08:52:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7078798b1d73bd1efca4820eae6d3fb6510e802b2c9193d0c135d8ab28c58fca
    source_path: providers/openai.md
    workflow: 16
---

OpenAI ให้บริการ API สำหรับนักพัฒนาสำหรับโมเดล GPT และ Codex ยังพร้อมใช้งานเป็นเอเจนต์เขียนโค้ดตามแพ็กเกจ ChatGPT ผ่านไคลเอนต์ Codex ของ OpenAI ด้วย OpenClaw ใช้รหัสผู้ให้บริการเดียวคือ `openai` สำหรับรูปแบบการยืนยันตัวตนทั้งสองแบบ

OpenClaw ใช้ `openai/*` เป็นเส้นทางโมเดล OpenAI มาตรฐาน เทิร์นของเอเจนต์แบบฝังตัวบนโมเดล OpenAI จะรันผ่านรันไทม์ app-server ของ Codex แบบเนทีฟตามค่าเริ่มต้น การยืนยันตัวตนด้วยคีย์ API ของ OpenAI โดยตรงยังคงพร้อมใช้งานสำหรับพื้นผิว OpenAI ที่ไม่ใช่เอเจนต์ เช่น รูปภาพ embedding เสียงพูด และเรียลไทม์

- **โมเดลเอเจนต์** - โมเดล `openai/*` ผ่านรันไทม์ Codex; ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน Codex เพื่อใช้การสมัครสมาชิก ChatGPT/Codex หรือกำหนดค่าโปรไฟล์สำรองคีย์ API ของ OpenAI ที่เข้ากันได้กับ Codex เมื่อคุณตั้งใจต้องการการยืนยันตัวตนด้วยคีย์ API
- **API ของ OpenAI ที่ไม่ใช่เอเจนต์** - เข้าถึง OpenAI Platform โดยตรงพร้อมการเรียกเก็บเงินตามการใช้งานผ่าน `OPENAI_API_KEY` หรือการเริ่มต้นใช้งานคีย์ API ของ OpenAI
- **การกำหนดค่าเดิม** - การอ้างอิงโมเดล Codex เดิมจะถูกซ่อมแซมโดย `openclaw doctor --fix` เป็น `openai/*` พร้อมรันไทม์ Codex

OpenAI รองรับการใช้งาน OAuth แบบสมัครสมาชิกในเครื่องมือและเวิร์กโฟลว์ภายนอกอย่าง OpenClaw อย่างชัดเจน

ผู้ให้บริการ โมเดล รันไทม์ และช่องทางเป็นเลเยอร์ที่แยกจากกัน หากป้ายกำกับเหล่านี้เริ่มปะปนกัน ให้อ่าน [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes) ก่อนเปลี่ยนการกำหนดค่า

## ตัวเลือกด่วน

| เป้าหมาย                                                 | ใช้                                                      | หมายเหตุ                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| การสมัครสมาชิก ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-5.5`                                         | การตั้งค่าเอเจนต์ OpenAI เริ่มต้น ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน Codex                  |
| พรีวิวแบบจำกัดของ GPT-5.6                              | `openai/gpt-5.6-sol`, `-terra`, or `-luna`               | ต้องใช้องค์กร API ที่ OpenAI อนุมัติหรือเวิร์กสเปซ Codex      |
| การเรียกเก็บเงินด้วยคีย์ API โดยตรงสำหรับโมเดลเอเจนต์              | `openai/gpt-5.5` พร้อมโปรไฟล์คีย์ API ที่เข้ากันได้กับ Codex | ใช้ `auth.order.openai` เพื่อวางสำรองไว้หลังการยืนยันตัวตนแบบสมัครสมาชิก  |
| การเรียกเก็บเงินด้วยคีย์ API โดยตรงผ่าน OpenClaw อย่างชัดเจน     | `openai/gpt-5.5` พร้อมรันไทม์ผู้ให้บริการ/โมเดล `openclaw`  | เลือกโปรไฟล์คีย์ API `openai` ปกติ                             |
| นามแฝง API ล่าสุดของ ChatGPT Instant                     | `openai/chat-latest`                                     | ใช้คีย์ API โดยตรงเท่านั้น เป็นนามแฝงเคลื่อนที่สำหรับการทดลอง ไม่ใช่ค่าเริ่มต้น   |
| การยืนยันตัวตนการสมัครสมาชิก ChatGPT/Codex ผ่าน OpenClaw     | `openai/gpt-5.5` พร้อมรันไทม์ผู้ให้บริการ/โมเดล `openclaw`  | เลือกโปรไฟล์ OAuth `openai` สำหรับเส้นทางความเข้ากันได้         |
| การสร้างหรือแก้ไขรูปภาพ                          | `openai/gpt-image-2`                                     | ทำงานได้กับทั้ง `OPENAI_API_KEY` หรือ OpenAI Codex OAuth             |
| รูปภาพพื้นหลังโปร่งใส                        | `openai/gpt-image-1.5`                                   | ใช้ `outputFormat=png` หรือ `webp` และ `openai.background=transparent` |

## แผนที่การตั้งชื่อ

ชื่อเหล่านี้คล้ายกันแต่ใช้แทนกันไม่ได้:

| ชื่อที่คุณเห็น                            | เลเยอร์             | ความหมาย                                                                                           |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | คำนำหน้าผู้ให้บริการ   | เส้นทางโมเดล OpenAI มาตรฐาน; เทิร์นของเอเจนต์ใช้รันไทม์ Codex                                  |
| คำนำหน้า OpenAI Codex เดิม              | คำนำหน้าเดิม     | เนมสเปซโมเดล/โปรไฟล์รุ่นเก่า `openclaw doctor --fix` จะย้ายไปเป็น `openai`                   |
| Plugin `codex`                          | Plugin            | Plugin ที่มาพร้อม OpenClaw ซึ่งให้รันไทม์ app-server ของ Codex แบบเนทีฟและการควบคุมแชต `/codex` |
| ผู้ให้บริการ/โมเดล `agentRuntime.id: codex` | รันไทม์เอเจนต์     | บังคับใช้ harness app-server ของ Codex แบบเนทีฟสำหรับเทิร์นแบบฝังตัวที่ตรงกัน                            |
| `/codex ...`                            | ชุดคำสั่งแชต  | ผูก/ควบคุมเธรด app-server ของ Codex จากบทสนทนา                                        |
| `runtime: "acp", agentId: "codex"`      | เส้นทางเซสชัน ACP | เส้นทางสำรองอย่างชัดเจนที่รัน Codex ผ่าน ACP/acpx                                          |

ซึ่งหมายความว่าการกำหนดค่าสามารถตั้งใจมีการอ้างอิงโมเดล `openai/*` ในขณะที่โปรไฟล์การยืนยันตัวตนชี้ไปยังข้อมูลรับรองแบบคีย์ API หรือ ChatGPT/Codex OAuth ก็ได้ ใช้ `auth.order.openai` สำหรับการกำหนดค่า; `openclaw doctor --fix` จะเขียนการอ้างอิงโมเดล Codex เดิม รหัสโปรไฟล์การยืนยันตัวตน Codex เดิม และลำดับการยืนยันตัวตน Codex เดิมใหม่เป็นเส้นทาง OpenAI มาตรฐาน

<Note>
GPT-5.5 พร้อมใช้งานผ่านทั้งการเข้าถึงด้วยคีย์ API ของ OpenAI Platform โดยตรงและเส้นทางการสมัครสมาชิก/OAuth สำหรับการสมัครสมาชิก ChatGPT/Codex พร้อมการทำงาน Codex แบบเนทีฟ ให้ใช้ `openai/gpt-5.5`; การไม่ตั้งค่ารันไทม์ตอนนี้จะเลือก harness ของ Codex สำหรับเทิร์นเอเจนต์ OpenAI ใช้โปรไฟล์คีย์ API ของ OpenAI เฉพาะเมื่อคุณต้องการการยืนยันตัวตนด้วยคีย์ API โดยตรงสำหรับโมเดลเอเจนต์ OpenAI
</Note>

## พรีวิวแบบจำกัดของ GPT-5.6

OpenClaw รู้จักรหัสโมเดล GPT-5.6 สาธารณะสามรายการ:

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

ทั้งสามรายการเปิดเผยการใช้เหตุผลระดับ `max` ในแค็ตตาล็อก app-server ของ Codex ปัจจุบัน ประกาศเปิดตัวของ OpenAI อธิบายว่า Sol เป็นระดับเรือธง Terra เป็นระดับสมดุล และ Luna เป็นระดับที่เร็วและต้นทุนต่ำกว่า ดู [ประกาศเปิดตัว GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/) และ [คู่มือการเข้าถึงพรีวิว](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna)

การเข้าถึงใช้รายการอนุญาตระหว่างช่วงพรีวิว และสามารถให้สิทธิ์แยกกันสำหรับ API และ Codex ได้ แพ็กเกจ ChatGPT แบบชำระเงินเพียงอย่างเดียวไม่ได้ให้สิทธิ์เข้าถึง OpenClaw ยังคงใช้ `openai/gpt-5.5` เป็นค่าเริ่มต้น; การเลือกการอ้างอิง GPT-5.6 โดยไม่มีสิทธิ์เข้าถึงจะส่งคืนข้อผิดพลาดการเข้าถึงจากต้นทางแทนที่จะถอยกลับแบบเงียบ ๆ

<Note>
เทิร์นของโมเดลเอเจนต์ OpenAI ต้องใช้ Plugin app-server ของ Codex ที่มาพร้อมกัน การกำหนดค่ารันไทม์ OpenClaw อย่างชัดเจนยังคงพร้อมใช้งานเป็นเส้นทางความเข้ากันได้แบบเลือกใช้ เมื่อเลือก OpenClaw อย่างชัดเจนพร้อมโปรไฟล์ OAuth `openai` OpenClaw จะคงการอ้างอิงโมเดลสาธารณะเป็น `openai/*` และกำหนดเส้นทางภายในผ่านทรานสปอร์ตที่ยืนยันตัวตนด้วย Codex รัน `openclaw doctor --fix` เพื่อซ่อมแซมการอ้างอิงโมเดล Codex เดิมที่ค้างอยู่, `codex-cli/*`, หรือการปักหมุดเซสชันรันไทม์เก่าที่ไม่ได้มาจากการกำหนดค่ารันไทม์อย่างชัดเจน
</Note>

## ความครอบคลุมฟีเจอร์ของ OpenClaw

| ความสามารถของ OpenAI         | พื้นผิว OpenClaw                                                                              | สถานะ                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| แชต / Responses          | ผู้ให้บริการโมเดล `openai/<model>`                                                               | ใช่                                                                    |
| โมเดลการสมัครสมาชิก Codex | `openai/<model>` พร้อม OpenAI OAuth                                                            | ใช่                                                                    |
| การอ้างอิงโมเดล Codex เดิม   | การอ้างอิงโมเดล Codex เดิมหรือ `codex-cli/<model>`                                                | ซ่อมแซมโดย doctor เป็น `openai/<model>`                                 |
| Codex app-server harness  | `openai/<model>` โดยละรันไทม์ไว้หรือผู้ให้บริการ/โมเดล `agentRuntime.id: codex`              | ใช่                                                                    |
| การค้นหาเว็บฝั่งเซิร์ฟเวอร์    | เครื่องมือ OpenAI Responses แบบเนทีฟ                                                                  | ใช่ เมื่อเปิดใช้งานการค้นหาเว็บและไม่ได้ปักหมุดผู้ให้บริการ                 |
| รูปภาพ                    | `image_generate`                                                                              | ใช่                                                                    |
| วิดีโอ                    | `video_generate`                                                                              | ใช่                                                                    |
| แปลงข้อความเป็นเสียง            | `messages.tts.provider: "openai"` / `tts`                                                     | ใช่                                                                    |
| แปลงเสียงเป็นข้อความแบบแบตช์      | `tools.media.audio` / ความเข้าใจสื่อ                                                     | ใช่                                                                    |
| แปลงเสียงเป็นข้อความแบบสตรีมมิง  | Voice Call `streaming.provider: "openai"`                                                     | ใช่                                                                    |
| เสียงเรียลไทม์            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | ใช่ (ต้องใช้เครดิต OpenAI Platform ไม่ใช่การสมัครสมาชิก Codex/ChatGPT) |
| Embeddings                | ผู้ให้บริการ embedding ของหน่วยความจำ                                                                     | ใช่                                                                    |

<Note>
  เสียงเรียลไทม์ของ OpenAI (ใช้โดย Voice Call `realtime.provider: "openai"` และ
  Control UI Talk พร้อม `talk.realtime.provider: "openai"`) ผ่าน
  **OpenAI Platform Realtime API** สาธารณะ ซึ่งเรียกเก็บเงินกับเครดิต OpenAI
  Platform แทนโควตาการสมัครสมาชิก Codex/ChatGPT บัญชีที่มี OpenAI OAuth
  ปกติและรันโมเดลแชตที่รองรับด้วย Codex ได้โดยไม่มีปัญหา
  ยังต้องมีโปรไฟล์ยืนยันตัวตนคีย์ API ของ OpenAI หรือคีย์ API ของ Platform ที่มีการเติมเงิน
  สำหรับการเรียกเก็บเงิน Platform เพื่อใช้เสียงเรียลไทม์

การแก้ไข: เติมเครดิต Platform ที่
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
สำหรับองค์กรที่รองรับข้อมูลรับรองเรียลไทม์ของคุณ เสียงเรียลไทม์ยอมรับ
โปรไฟล์ยืนยันตัวตนคีย์ API `openai` ที่สร้างโดย `openclaw onboard --auth-choice openai-api-key`,
คีย์ Platform `OPENAI_API_KEY` ที่กำหนดค่าผ่าน `talk.realtime.providers.openai.apiKey`
สำหรับ Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
สำหรับ Voice Call, หรือ environment variable `OPENAI_API_KEY` โปรไฟล์ OpenAI OAuth
ยังคงรันโมเดลแชต `openai/*` ที่รองรับด้วย Codex ในการติดตั้ง
OpenClaw เดียวกันได้ แต่ไม่ได้กำหนดค่าเสียงเรียลไทม์
</Note>

## Embeddings ของหน่วยความจำ

OpenClaw สามารถใช้ OpenAI หรือปลายทาง embedding ที่เข้ากันได้กับ OpenAI สำหรับ
การทำดัชนี `memory_search` และ query embeddings:

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

สำหรับปลายทางที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้ป้ายกำกับ embedding แบบอสมมาตร ให้ตั้งค่า
`queryInputType` และ `documentInputType` ใต้ `memorySearch` OpenClaw ส่งต่อ
ค่าเหล่านั้นเป็นฟิลด์คำขอ `input_type` เฉพาะผู้ให้บริการ: query embeddings ใช้
`queryInputType`; ชิ้นหน่วยความจำที่ทำดัชนีและการทำดัชนีแบบแบตช์ใช้
`documentInputType` ดูตัวอย่างแบบเต็มได้ที่ [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config#provider-specific-config)

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง API โดยตรงและการเรียกเก็บเงินตามการใช้งาน

    <Steps>
      <Step title="Get your API key">
        สร้างหรือคัดลอกคีย์ API จาก [แดชบอร์ด OpenAI Platform](https://platform.openai.com/api-keys)
      </Step>
      <Step title="Run onboarding">
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

    | อ้างอิงโมเดล              | การกำหนดค่ารันไทม์             | เส้นทาง                       | การยืนยันตัวตน             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | ละไว้ / provider/model `agentRuntime.id: "codex"` | ชุดทดสอบ app-server ของ Codex | โปรไฟล์ OpenAI ที่เข้ากันได้กับ Codex |
    | `openai/gpt-5.4-mini` | ละไว้ / provider/model `agentRuntime.id: "codex"` | ชุดทดสอบ app-server ของ Codex | โปรไฟล์ OpenAI ที่เข้ากันได้กับ Codex |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | รันไทม์แบบฝังใน OpenClaw      | โปรไฟล์ `openai` ที่เลือก |

    <Note>
    โมเดลเอเจนต์ `openai/*` ใช้ชุดทดสอบ app-server ของ Codex หากต้องการใช้การยืนยันตัวตน
    ด้วยคีย์ API สำหรับโมเดลเอเจนต์ ให้สร้างโปรไฟล์คีย์ API ที่เข้ากันได้กับ Codex และจัดลำดับ
    ด้วย `auth.order.openai`; `OPENAI_API_KEY` ยังคงเป็น fallback โดยตรงสำหรับ
    พื้นผิว OpenAI API ที่ไม่ใช่เอเจนต์ เรียกใช้ `openclaw doctor --fix` เพื่อย้ายรายการ
    ลำดับการยืนยันตัวตน Codex รุ่นเก่า
    </Note>

    ### ตัวอย่างการกำหนดค่า

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    หากต้องการลองโมเดล Instant ปัจจุบันของ ChatGPT จาก OpenAI API ให้ตั้งค่าโมเดล
    เป็น `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` เป็นนามแฝงที่เปลี่ยนแปลงได้ OpenAI ระบุว่าเป็นโมเดล Instant ล่าสุด
    ที่ใช้ใน ChatGPT และแนะนำ `gpt-5.5` สำหรับการใช้งาน API ในโปรดักชัน ดังนั้น
    ให้คง `openai/gpt-5.5` เป็นค่าเริ่มต้นที่เสถียร เว้นแต่คุณต้องการพฤติกรรม
    ของนามแฝงนั้นอย่างชัดเจน ขณะนี้นามแฝงรองรับเฉพาะความละเอียดข้อความระดับ `medium` เท่านั้น ดังนั้น
    OpenClaw จะทำให้การ override ความละเอียดข้อความของ OpenAI ที่เข้ากันไม่ได้สำหรับ
    โมเดลนี้เป็นมาตรฐาน

    <Warning>
    OpenClaw **ไม่** เปิดเผย `gpt-5.3-codex-spark` บนเส้นทางคีย์ API ของ OpenAI โดยตรง โมเดลนี้พร้อมใช้งานผ่านรายการแค็ตตาล็อกการสมัครสมาชิก Codex เท่านั้น เมื่อบัญชีที่ลงชื่อเข้าใช้ของคุณเปิดเผยโมเดลนี้
    </Warning>

  </Tab>

  <Tab title="การสมัครสมาชิก Codex">
    **เหมาะที่สุดสำหรับ:** การใช้การสมัครสมาชิก ChatGPT/Codex ของคุณพร้อมการดำเนินการ app-server ของ Codex แบบเนทีฟ แทนการใช้คีย์ API แยกต่างหาก Codex cloud ต้องลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="เรียกใช้ Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        หรือเรียกใช้ OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai
        ```

        สำหรับการตั้งค่าแบบไม่มีหน้าจอหรือไม่รองรับ callback ให้เพิ่ม `--device-code` เพื่อลงชื่อเข้าใช้ด้วยโฟลว์ device-code ของ ChatGPT แทน callback ของเบราว์เซอร์ localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="ใช้เส้นทางโมเดล OpenAI มาตรฐาน">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        ไม่ต้องมีการกำหนดค่ารันไทม์สำหรับเส้นทางเริ่มต้น เทิร์นของเอเจนต์ OpenAI
        จะเลือกรันไทม์ app-server ของ Codex แบบเนทีฟโดยอัตโนมัติ และ OpenClaw
        จะติดตั้งหรือซ่อมแซม Plugin Codex ที่รวมมาเมื่อเลือกเส้นทางนี้
      </Step>
      <Step title="ตรวจสอบว่าการยืนยันตัวตน Codex พร้อมใช้งาน">
        ```bash
        openclaw models list --provider openai
        ```

        หลังจาก Gateway ทำงานแล้ว ให้ส่ง `/codex status` หรือ `/codex models`
        ในแชตเพื่อตรวจสอบรันไทม์ app-server แบบเนทีฟ
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | อ้างอิงโมเดล | การกำหนดค่ารันไทม์ | เส้นทาง | การยืนยันตัวตน |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | ละไว้ / provider/model `agentRuntime.id: "codex"` | ชุดทดสอบ app-server ของ Codex แบบเนทีฟ | การลงชื่อเข้าใช้ Codex หรือโปรไฟล์การยืนยันตัวตน `openai` ที่จัดลำดับไว้ |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | รันไทม์แบบฝังใน OpenClaw พร้อมทรานสปอร์ตการยืนยันตัวตน Codex ภายใน | โปรไฟล์ OAuth `openai` ที่เลือก |
    | อ้างอิง Codex GPT-5.5 รุ่นเก่า | ซ่อมแซมโดย doctor | เขียนเส้นทางรุ่นเก่าใหม่เป็น `openai/gpt-5.5` | โปรไฟล์ OpenAI OAuth ที่ย้ายแล้ว |
    | `codex-cli/gpt-5.5` | ซ่อมแซมโดย doctor | เขียนเส้นทาง CLI รุ่นเก่าใหม่เป็น `openai/gpt-5.5` | การยืนยันตัวตน app-server ของ Codex |

    <Warning>
    ควรใช้ `openai/gpt-5.5` สำหรับการกำหนดค่าเอเจนต์ใหม่ที่รองรับด้วยการสมัครสมาชิก อ้างอิง
    Codex GPT รุ่นเก่าเป็นเส้นทาง OpenClaw รุ่นเก่า ไม่ใช่เส้นทางรันไทม์ Codex แบบเนทีฟ;
    เรียกใช้ `openclaw doctor --fix` เมื่อคุณต้องการย้ายไปยังอ้างอิง `openai/*`
    มาตรฐาน `gpt-5.3-codex-spark` ยังคงจำกัดเฉพาะบัญชีที่แค็ตตาล็อก
    การสมัครสมาชิก Codex โฆษณาโมเดลนั้น; อ้างอิงคีย์ API ของ OpenAI โดยตรงและ
    Azure สำหรับโมเดลนี้ยังคงถูกระงับไว้
    </Warning>

    <Note>
    คำนำหน้าโมเดล Codex รุ่นเก่าเป็นการกำหนดค่ารุ่นเก่าที่ doctor ซ่อมแซม สำหรับ
    การตั้งค่าทั่วไปที่ใช้การสมัครสมาชิกพร้อมรันไทม์แบบเนทีฟ ให้ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน Codex
    แต่คงอ้างอิงโมเดลเป็น `openai/gpt-5.5` การกำหนดค่าใหม่ควรวางลำดับ
    การยืนยันตัวตนเอเจนต์ OpenAI ไว้ใต้ `auth.order.openai`; doctor จะย้ายรายการ
    ลำดับการยืนยันตัวตน Codex รุ่นเก่า
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

    ด้วยคีย์ API สำรอง ให้คงโมเดลไว้ที่ `openai/gpt-5.5` และวางลำดับ
    การยืนยันตัวตนไว้ใต้ `openai` OpenClaw จะลองใช้การสมัครสมาชิกก่อน จากนั้น
    จึงใช้คีย์ API ขณะยังคงอยู่บนชุดทดสอบ Codex:

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
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    การเริ่มต้นใช้งานจะไม่นำเข้าวัสดุ OAuth จาก `~/.codex` อีกต่อไป ลงชื่อเข้าใช้ด้วย OAuth ผ่านเบราว์เซอร์ (ค่าเริ่มต้น) หรือโฟลว์ device-code ข้างต้น — OpenClaw จัดการข้อมูลรับรองที่ได้ในที่จัดเก็บการยืนยันตัวตนเอเจนต์ของตัวเอง
    </Note>

    ### ตรวจสอบและกู้คืนการกำหนดเส้นทาง Codex OAuth

    ใช้คำสั่งเหล่านี้เพื่อดูว่าเอเจนต์เริ่มต้นของคุณใช้โมเดล รันไทม์ และเส้นทาง
    การยืนยันตัวตนใด:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    สำหรับเอเจนต์เฉพาะ ให้เพิ่ม `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    หากการกำหนดค่าที่เก่ากว่ายังคงมีอ้างอิง Codex GPT รุ่นเก่าหรือ pin เซสชันรันไทม์ OpenAI
    ที่ล้าสมัยโดยไม่มีการกำหนดค่ารันไทม์อย่างชัดเจน ให้ซ่อมแซม:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    หาก `models auth list --provider openai` ไม่แสดงโปรไฟล์ที่ใช้ได้ ให้ลงชื่อ
    เข้าใช้อีกครั้ง:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    ใช้ `--profile-id` เมื่อคุณต้องการการเข้าสู่ระบบ Codex OAuth หลายรายการในเอเจนต์เดียวกัน
    และภายหลังต้องการควบคุมผ่านการจัดลำดับการยืนยันตัวตนหรือ `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` คือเส้นทางโมเดลสำหรับเทิร์นเอเจนต์ OpenAI ผ่าน Codex เรียกใช้
    `openclaw doctor --fix` เพื่อย้าย id โปรไฟล์คำนำหน้า OpenAI Codex รุ่นเก่าและ
    รายการลำดับ ก่อนพึ่งพาการจัดลำดับโปรไฟล์

    ### ตัวบ่งชี้สถานะ

    แชต `/status` แสดงว่ารันไทม์โมเดลใดกำลังทำงานอยู่สำหรับเซสชันปัจจุบัน
    ชุดทดสอบ app-server ของ Codex ที่รวมมาแสดงเป็น `Runtime: OpenAI Codex` สำหรับ
    เทิร์นโมเดลเอเจนต์ OpenAI pin เซสชันรันไทม์ OpenAI ที่ล้าสมัยจะถูกซ่อมแซมเป็น Codex เว้นแต่
    การกำหนดค่าจะ pin OpenClaw ไว้อย่างชัดเจน

    ### คำเตือนจาก doctor

    หากอ้างอิงโมเดล Codex รุ่นเก่าหรือ pin รันไทม์ OpenAI ที่ล้าสมัยยังคงอยู่ในการกำหนดค่าหรือ
    สถานะเซสชัน `openclaw doctor --fix` จะเขียนใหม่เป็น `openai/*` พร้อมรันไทม์
    Codex เว้นแต่ OpenClaw จะถูกกำหนดค่าไว้อย่างชัดเจน

    ### ขีดจำกัดหน้าต่างบริบท

    OpenClaw ถือว่าเมทาดาทาโมเดลและขีดจำกัดบริบทรันไทม์เป็นค่าคนละส่วนกัน

    สำหรับ `openai/gpt-5.5` ผ่านแค็ตตาล็อก Codex OAuth:

    - `contextWindow` แบบเนทีฟ: `1000000`
    - ขีดจำกัด `contextTokens` ของรันไทม์เริ่มต้น: `272000`

    ขีดจำกัดเริ่มต้นที่เล็กกว่ามีลักษณะด้านเวลาแฝงและคุณภาพที่ดีกว่าในการใช้งานจริง Override ด้วย `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          openai: {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    ใช้ `contextWindow` เพื่อประกาศเมทาดาทาโมเดลแบบเนทีฟ ใช้ `contextTokens` เพื่อจำกัดงบประมาณบริบทรันไทม์
    </Note>

    ### การกู้คืนแค็ตตาล็อก

    OpenClaw ใช้เมทาดาทาแค็ตตาล็อก Codex ต้นทางสำหรับ `gpt-5.5` เมื่อมีอยู่
    หากการค้นพบ Codex แบบสดละเว้นแถว `gpt-5.5` ในขณะที่
    บัญชีได้รับการยืนยันตัวตนแล้ว OpenClaw จะสังเคราะห์แถวโมเดล OAuth นั้นเพื่อให้
    Cron, sub-agent และการรันโมเดลเริ่มต้นที่กำหนดค่าไว้ไม่ล้มเหลวด้วย
    `Unknown model`

  </Tab>
</Tabs>

## การยืนยันตัวตน app-server ของ Codex แบบเนทีฟ

ชุดทดสอบ app-server ของ Codex แบบเนทีฟใช้อ้างอิงโมเดล `openai/*` พร้อมการกำหนดค่า
รันไทม์ที่ละไว้ หรือ provider/model `agentRuntime.id: "codex"` แต่การยืนยันตัวตนของมัน
ยังคงอิงบัญชี OpenClaw เลือกการยืนยันตัวตนตามลำดับนี้:

1. โปรไฟล์การยืนยันตัวตน OpenAI ที่จัดลำดับไว้สำหรับเอเจนต์ โดยควรอยู่ใต้
   `auth.order.openai` เรียกใช้ `openclaw doctor --fix` เพื่อย้าย id โปรไฟล์
   การยืนยันตัวตน Codex รุ่นเก่าและลำดับการยืนยันตัวตน Codex รุ่นเก่า
2. บัญชีที่มีอยู่ของ app-server เช่น การลงชื่อเข้าใช้ ChatGPT ของ Codex CLI ในเครื่อง
3. สำหรับการเปิด app-server แบบ stdio ในเครื่องเท่านั้น `CODEX_API_KEY` จากนั้น
   `OPENAI_API_KEY` เมื่อ app-server รายงานว่าไม่มีบัญชีและยังต้องใช้
   การยืนยันตัวตน OpenAI

นั่นหมายความว่าการลงชื่อเข้าใช้การสมัครสมาชิก ChatGPT/Codex ในเครื่องจะไม่ถูกแทนที่เพียง
เพราะกระบวนการ Gateway มี `OPENAI_API_KEY` สำหรับโมเดล OpenAI โดยตรง
หรือ embeddings ด้วย Fallback คีย์ API จาก env เป็นเพียงเส้นทาง stdio ในเครื่องแบบไม่มีบัญชีเท่านั้น;
จะไม่ถูกส่งไปยังการเชื่อมต่อ app-server แบบ WebSocket เมื่อเลือกโปรไฟล์ Codex
แบบการสมัครสมาชิก OpenClaw ยังกัน `CODEX_API_KEY` และ `OPENAI_API_KEY`
ออกจาก child app-server แบบ stdio ที่ spawn และส่งข้อมูลรับรองที่เลือก
ผ่าน RPC การเข้าสู่ระบบ app-server เมื่อโปรไฟล์การสมัครสมาชิกนั้นถูกบล็อกโดย
ขีดจำกัดการใช้งาน Codex OpenClaw สามารถหมุนไปยังโปรไฟล์คีย์ API `openai:*`
ถัดไปที่จัดลำดับไว้ได้โดยไม่เปลี่ยนโมเดลที่เลือกหรือออกจากชุดทดสอบ Codex
เมื่อเวลาการรีเซ็ตการสมัครสมาชิกผ่านไป โปรไฟล์การสมัครสมาชิกจะมีสิทธิ์อีกครั้ง

## การสร้างภาพ

Plugin `openai` ที่รวมมาลงทะเบียนการสร้างภาพผ่านเครื่องมือ `image_generate`
รองรับทั้งการสร้างภาพด้วยคีย์ API ของ OpenAI และการสร้างภาพด้วย Codex OAuth
ผ่านอ้างอิงโมเดล `openai/gpt-image-2` เดียวกัน

| ความสามารถ               | คีย์ OpenAI API                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| อ้างอิงโมเดล             | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| การยืนยันตัวตน            | `OPENAI_API_KEY`                   | การลงชื่อเข้าใช้ OpenAI Codex OAuth |
| การขนส่ง                 | OpenAI Images API                  | แบ็กเอนด์ Codex Responses           |
| จำนวนภาพสูงสุดต่อคำขอ    | 4                                  | 4                                    |
| โหมดแก้ไข                | เปิดใช้งาน (ภาพอ้างอิงสูงสุด 5 ภาพ) | เปิดใช้งาน (ภาพอ้างอิงสูงสุด 5 ภาพ) |
| การแทนที่ขนาด            | รองรับ รวมถึงขนาด 2K/4K            | รองรับ รวมถึงขนาด 2K/4K              |
| อัตราส่วนภาพ / ความละเอียด | ไม่ส่งต่อไปยัง OpenAI Images API   | แมปไปยังขนาดที่รองรับเมื่อปลอดภัย   |

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
ดู [การสร้างภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรมการสลับเมื่อขัดข้อง
</Note>

`gpt-image-2` เป็นค่าเริ่มต้นสำหรับทั้งการสร้างภาพจากข้อความและการแก้ไขภาพของ OpenAI `gpt-image-1.5`, `gpt-image-1` และ `gpt-image-1-mini` ยังคงใช้ได้เป็นการแทนที่โมเดลแบบระบุชัดเจน ใช้ `openai/gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP พื้นหลังโปร่งใส; API `gpt-image-2` ปัจจุบันปฏิเสธ `background: "transparent"`

สำหรับคำขอพื้นหลังโปร่งใส agent ควรเรียก `image_generate` พร้อม `model: "openai/gpt-image-1.5"`, `outputFormat: "png"` หรือ `"webp"` และ `background: "transparent"`; ตัวเลือกผู้ให้บริการ `openai.background` แบบเก่ายังคงยอมรับอยู่ OpenClaw ยังปกป้องเส้นทาง OpenAI สาธารณะและ OpenAI Codex OAuth โดยเขียนคำขอโปร่งใสค่าเริ่มต้น `openai/gpt-image-2` ใหม่เป็น `gpt-image-1.5`; Azure และปลายทางที่เข้ากันได้กับ OpenAI แบบกำหนดเองจะคงชื่อ deployment/model ที่กำหนดค่าไว้

การตั้งค่าเดียวกันเปิดให้ใช้สำหรับการรัน CLI แบบไม่มี UI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

ใช้แฟล็ก `--output-format` และ `--background` เดียวกันกับ `openclaw infer image edit` เมื่อเริ่มจากไฟล์อินพุต
`--openai-background` ยังคงพร้อมใช้งานเป็นนามแฝงเฉพาะ OpenAI
ใช้ `--quality low|medium|high|auto` เมื่อคุณต้องควบคุมคุณภาพและต้นทุนของ OpenAI Images ใช้ `--openai-moderation low|auto` เพื่อส่งคำใบ้การกลั่นกรองเฉพาะผู้ให้บริการของ OpenAI จาก `image generate` หรือ `image edit`

สำหรับการติดตั้ง ChatGPT/Codex OAuth ให้คงอ้างอิง `openai/gpt-image-2` เดิมไว้ เมื่อมีการกำหนดค่าโปรไฟล์ OAuth ของ `openai` OpenClaw จะแก้เป็นโทเค็นการเข้าถึง OAuth ที่เก็บไว้และส่งคำขอภาพผ่านแบ็กเอนด์ Codex Responses โดยจะไม่ลองใช้ `OPENAI_API_KEY` ก่อนหรือแอบถอยกลับไปใช้คีย์ API สำหรับคำขอนั้น กำหนดค่า `models.providers.openai` อย่างชัดเจนด้วยคีย์ API, URL ฐานแบบกำหนดเอง หรือปลายทาง Azure เมื่อคุณต้องการเส้นทาง OpenAI Images API โดยตรงแทน
หากปลายทางภาพแบบกำหนดเองนั้นอยู่บนที่อยู่ LAN/ส่วนตัวที่เชื่อถือได้ ให้ตั้งค่า `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ด้วย; OpenClaw จะบล็อกปลายทางภาพที่เข้ากันได้กับ OpenAI แบบส่วนตัว/ภายใน เว้นแต่จะมีการเลือกเข้าร่วมนี้

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

Plugin `openai` ที่รวมมาในชุดลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ `video_generate`

| ความสามารถ      | ค่า                                                                               |
| ---------------- | --------------------------------------------------------------------------------- |
| โมเดลเริ่มต้น    | `openai/sora-2`                                                                   |
| โหมด             | ข้อความเป็นวิดีโอ, ภาพเป็นวิดีโอ, การแก้ไขวิดีโอเดียว                              |
| อินพุตอ้างอิง    | 1 ภาพ หรือ 1 วิดีโอ                                                               |
| การแทนที่ขนาด    | รองรับสำหรับข้อความเป็นวิดีโอและภาพเป็นวิดีโอ                                      |
| การแทนที่อื่น ๆ  | `aspectRatio`, `resolution`, `audio`, `watermark` จะถูกละเว้นพร้อมคำเตือนของเครื่องมือ |

คำขอภาพเป็นวิดีโอของ OpenAI ใช้ `POST /v1/videos` พร้อม `input_reference` แบบภาพ การแก้ไขวิดีโอเดียวใช้ `POST /v1/videos/edits` พร้อมวิดีโอที่อัปโหลดในฟิลด์ `video`

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรมการสลับเมื่อขัดข้อง
</Note>

## การมีส่วนร่วมของพรอมป์ GPT-5

OpenClaw เพิ่มการมีส่วนร่วมของพรอมป์ GPT-5 ที่ใช้ร่วมกันสำหรับการรันตระกูล GPT-5 บนพื้นผิวพรอมป์ที่ OpenClaw ประกอบขึ้น โดยใช้ตาม ID โมเดล ดังนั้นเส้นทาง OpenClaw/ผู้ให้บริการ เช่น อ้างอิงก่อนซ่อมแซมแบบเดิม (อ้างอิง Codex GPT-5.5 แบบเดิม), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` และอ้างอิง GPT-5 อื่นที่เข้ากันได้ จะได้รับ overlay เดียวกัน โมเดล GPT-4.x รุ่นเก่าจะไม่ได้รับ

ฮาร์เนส Codex แบบเนทีฟที่รวมมาในชุดจะไม่ได้รับ overlay GPT-5 ของ OpenClaw นี้ผ่านคำสั่งนักพัฒนา Codex app-server Codex แบบเนทีฟจะคงพฤติกรรมฐาน โมเดล และเอกสารโปรเจกต์ที่ Codex เป็นเจ้าของไว้ ขณะที่ OpenClaw ปิดบุคลิกภาพในตัวของ Codex สำหรับเธรดแบบเนทีฟ เพื่อให้ไฟล์บุคลิกภาพของพื้นที่ทำงาน agent ยังคงเป็นแหล่งอ้างอิงหลัก OpenClaw มีส่วนร่วมเฉพาะบริบท runtime เช่น การส่งมอบช่องทาง เครื่องมือไดนามิกของ OpenClaw การมอบหมาย ACP บริบทพื้นที่ทำงาน และ Skills ของ OpenClaw

การมีส่วนร่วมของ GPT-5 เพิ่มสัญญาพฤติกรรมแบบติดแท็กสำหรับการคงอยู่ของบุคลิกภาพ ความปลอดภัยในการดำเนินการ วินัยของเครื่องมือ รูปทรงเอาต์พุต การตรวจสอบการเสร็จสิ้น และการตรวจยืนยันบนพรอมป์ที่ OpenClaw ประกอบขึ้นซึ่งตรงกัน พฤติกรรมการตอบกลับเฉพาะช่องทางและข้อความเงียบยังคงอยู่ในพรอมป์ระบบ OpenClaw ที่ใช้ร่วมกันและนโยบายการส่งออก เลเยอร์สไตล์การโต้ตอบที่เป็นมิตรแยกต่างหากและกำหนดค่าได้

| ค่า                    | ผลลัพธ์                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้งานเลเยอร์สไตล์การโต้ตอบที่เป็นมิตร |
| `"on"`                 | นามแฝงของ `"friendly"`                      |
| `"off"`                | ปิดใช้งานเฉพาะเลเยอร์สไตล์ที่เป็นมิตร      |

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
ค่าต่าง ๆ ไม่คำนึงถึงตัวพิมพ์เล็กใหญ่ใน runtime ดังนั้น `"Off"` และ `"off"` ต่างก็ปิดใช้งานเลเยอร์สไตล์ที่เป็นมิตร
</Tip>

<Note>
`plugins.entries.openai.config.personality` แบบเดิมยังคงถูกอ่านเป็น fallback สำหรับความเข้ากันได้เมื่อไม่ได้ตั้งค่าการตั้งค่า `agents.defaults.promptOverlays.gpt5.personality` ที่ใช้ร่วมกัน
</Note>

## เสียงและคำพูด

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    Plugin `openai` ที่รวมมาในชุดลงทะเบียนการสังเคราะห์เสียงพูดสำหรับพื้นผิว `messages.tts`

    | การตั้งค่า | พาธการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | เสียง | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | ความเร็ว | `messages.tts.providers.openai.speed` | (ไม่ได้ตั้งค่า) |
    | คำสั่ง | `messages.tts.providers.openai.instructions` | (ไม่ได้ตั้งค่า, เฉพาะ `gpt-4o-mini-tts`) |
    | รูปแบบ | `messages.tts.providers.openai.responseFormat` | `opus` สำหรับบันทึกเสียง, `mp3` สำหรับไฟล์ |
    | คีย์ API | `messages.tts.providers.openai.apiKey` | ถอยกลับไปใช้ `OPENAI_API_KEY` |
    | URL ฐาน | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | เนื้อหาเพิ่มเติม | `messages.tts.providers.openai.extraBody` / `extra_body` | (ไม่ได้ตั้งค่า) |

    โมเดลที่พร้อมใช้งาน: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd` เสียงที่พร้อมใช้งาน: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`

    `extraBody` จะถูกผสานเข้าไปใน JSON คำขอ `/audio/speech` หลังฟิลด์ที่ OpenClaw สร้างขึ้น ดังนั้นให้ใช้สำหรับปลายทางที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้คีย์เพิ่มเติม เช่น `lang` คีย์ prototype จะถูกละเว้น

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    ตั้งค่า `OPENAI_TTS_BASE_URL` เพื่อแทนที่ URL ฐานของ TTS โดยไม่กระทบปลายทาง API แชต OpenAI TTS และเสียง Realtime ต่างก็กำหนดค่าผ่านคีย์ OpenAI Platform API; การติดตั้งที่มีเฉพาะ OAuth ยังใช้โมเดลแชตที่รองรับโดย Codex ได้ แต่ใช้การพูดตอบกลับสดของ OpenAI ไม่ได้
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `openai` ที่รวมมาในชุดลงทะเบียนคำพูดเป็นข้อความแบบ batch ผ่านพื้นผิวการถอดเสียง media-understanding ของ OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - ปลายทาง: OpenAI REST `/v1/audio/transcriptions`
    - พาธอินพุต: การอัปโหลดไฟล์เสียงแบบ multipart
    - รองรับโดย OpenClaw ทุกที่ที่การถอดเสียงเสียงขาเข้าใช้
      `tools.media.audio` รวมถึงช่วงเสียงในช่องเสียง Discord และไฟล์แนบเสียงของช่องทาง

    เพื่อบังคับใช้ OpenAI สำหรับการถอดเสียงเสียงขาเข้า:

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

    คำใบ้ภาษาและพรอมป์จะถูกส่งต่อไปยัง OpenAI เมื่อระบุโดยการกำหนดค่า audio media ที่ใช้ร่วมกันหรือคำขอถอดเสียงรายครั้ง

  </Accordion>

  <Accordion title="Realtime transcription">
    Plugin `openai` ที่รวมมาในชุดลงทะเบียนการถอดเสียงแบบ realtime สำหรับ Plugin Voice Call

    | การตั้งค่า | พาธการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | ภาษา | `...openai.language` | (ไม่ได้ตั้งค่า) |
    | พรอมป์ | `...openai.prompt` | (ไม่ได้ตั้งค่า) |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `800` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | การยืนยันตัวตน | `...openai.apiKey`, `OPENAI_API_KEY` หรือ OAuth `openai` | คีย์ API เชื่อมต่อโดยตรง; OAuth ออก client secret สำหรับการถอดเสียงแบบ Realtime |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียง G.711 u-law (`g711_ulaw` / `audio/pcmu`) เมื่อกำหนดค่าเฉพาะ OAuth `openai` Gateway จะออก client secret สำหรับการถอดเสียงแบบ Realtime ชั่วคราวก่อนเปิด WebSocket ผู้ให้บริการสตรีมมิงนี้ใช้สำหรับพาธการถอดเสียงแบบ realtime ของ Voice Call; ปัจจุบันเสียง Discord จะบันทึกช่วงสั้น ๆ และใช้พาธการถอดเสียงแบบ batch `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Plugin `openai` ที่รวมมาในชุดลงทะเบียนเสียงแบบ realtime สำหรับ Plugin Voice Call

    | การตั้งค่า | พาธการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | เสียง | `...openai.voice` | `alloy` |
    | อุณหภูมิ (บริดจ์การปรับใช้ Azure) | `...openai.temperature` | `0.8` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `500` |
    | การเสริมส่วนหน้า | `...openai.prefixPaddingMs` | `300` |
    | ความพยายามในการให้เหตุผล | `...openai.reasoningEffort` | (ไม่ได้ตั้งค่า) |
    | การยืนยันตัวตน | โปรไฟล์การยืนยันตัวตนด้วยคีย์ API ของ `openai`, `...openai.apiKey` หรือ `OPENAI_API_KEY` | ต้องใช้คีย์ API ของ OpenAI Platform; OpenAI OAuth ไม่ได้กำหนดค่าเสียง Realtime |

    เสียง Realtime ในตัวที่พร้อมใช้งานสำหรับ `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI แนะนำ `marin` และ `cedar` เพื่อคุณภาพ Realtime ที่ดีที่สุด ชุดนี้
    แยกจากเสียง Text-to-speech ด้านบน; อย่าสรุปว่าเสียง TTS
    เช่น `fable`, `nova` หรือ `onyx` ใช้ได้กับเซสชัน Realtime

    <Note>
    บริดจ์ OpenAI realtime ฝั่งแบ็กเอนด์ใช้รูปแบบเซสชัน GA Realtime WebSocket ซึ่งไม่รับ `session.temperature` การปรับใช้ Azure OpenAI ยังคงพร้อมใช้งานผ่าน `azureEndpoint` และ `azureDeployment` และคงรูปแบบเซสชันที่เข้ากันได้กับการปรับใช้ไว้ รองรับการเรียกใช้เครื่องมือสองทิศทางและเสียง G.711 u-law
    </Note>

    <Note>
    เสียง Realtime จะถูกเลือกเมื่อสร้างเซสชัน OpenAI อนุญาตให้ฟิลด์เซสชันส่วนใหญ่
    เปลี่ยนได้ภายหลัง แต่ไม่สามารถเปลี่ยนเสียงได้หลังจากโมเดลส่งเสียงออกมาแล้ว
    ในเซสชันนั้น ขณะนี้ OpenClaw เปิดเผย id เสียง Realtime ในตัวเป็นสตริง
    </Note>

    <Note>
    Control UI Talk ใช้เซสชัน realtime ในเบราว์เซอร์ของ OpenAI พร้อม secret ไคลเอนต์ชั่วคราว
    ที่ Gateway ออกให้ และการแลกเปลี่ยน WebRTC SDP โดยตรงจากเบราว์เซอร์กับ
    OpenAI Realtime API Gateway ออก secret ไคลเอนต์นั้นด้วยโปรไฟล์การยืนยันตัวตนด้วยคีย์ API
    ของ `openai` ที่เลือกไว้ หรือคีย์ API ของ OpenAI Platform ที่กำหนดค่าไว้ บริดจ์
    Gateway relay และ Voice Call backend realtime WebSocket ใช้เส้นทางการยืนยันตัวตน
    แบบใช้คีย์ API เท่านั้นเดียวกันสำหรับปลายทาง OpenAI ดั้งเดิม การตรวจสอบแบบ live
    ของผู้ดูแลพร้อมใช้งานด้วย
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ส่วนของ OpenAI ตรวจสอบทั้งบริดจ์ WebSocket ฝั่งแบ็กเอนด์และการแลกเปลี่ยน
    WebRTC SDP ในเบราว์เซอร์โดยไม่บันทึก secret
    </Note>

  </Accordion>
</AccordionGroup>

## ปลายทาง Azure OpenAI

ผู้ให้บริการ `openai` ที่รวมมาด้วยสามารถกำหนดเป้าหมายไปยังทรัพยากร Azure OpenAI สำหรับการสร้างรูปภาพ
ได้โดยแทนที่ URL ฐาน บนเส้นทางการสร้างรูปภาพ OpenClaw
ตรวจจับชื่อโฮสต์ Azure บน `models.providers.openai.baseUrl` และสลับไปใช้
รูปแบบคำขอของ Azure โดยอัตโนมัติ

<Note>
เสียง Realtime ใช้พาธการกำหนดค่าแยกต่างหาก
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
และไม่ได้รับผลจาก `models.providers.openai.baseUrl` ดู accordion **เสียง Realtime**
ใต้ [เสียงและคำพูด](#voice-and-speech) สำหรับการตั้งค่า Azure ของส่วนนี้
</Note>

ใช้ Azure OpenAI เมื่อ:

- คุณมีการสมัครใช้งาน Azure OpenAI, quota หรือข้อตกลงระดับองค์กรอยู่แล้ว
- คุณต้องการการเก็บข้อมูลในภูมิภาคหรือการควบคุมการปฏิบัติตามข้อกำหนดที่ Azure มีให้
- คุณต้องการให้ทราฟฟิกอยู่ภายใน tenancy Azure ที่มีอยู่

### การกำหนดค่า

สำหรับการสร้างรูปภาพผ่าน Azure ด้วยผู้ให้บริการ `openai` ที่รวมมาด้วย ให้ชี้
`models.providers.openai.baseUrl` ไปที่ทรัพยากร Azure ของคุณ และตั้งค่า `apiKey` เป็น
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

OpenClaw รู้จักส่วนต่อท้ายชื่อโฮสต์ Azure เหล่านี้สำหรับเส้นทางการสร้างรูปภาพของ Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

สำหรับคำขอสร้างรูปภาพบนโฮสต์ Azure ที่รู้จัก OpenClaw จะ:

- ส่งส่วนหัว `api-key` แทน `Authorization: Bearer`
- ใช้พาธที่ผูกกับการปรับใช้ (`/openai/deployments/{deployment}/...`)
- เติม `?api-version=...` ต่อท้ายแต่ละคำขอ
- ใช้เวลาหมดอายุคำขอเริ่มต้น 600 วินาทีสำหรับการเรียกสร้างรูปภาพของ Azure
  ค่า `timeoutMs` ต่อการเรียกยังคงแทนที่ค่าเริ่มต้นนี้ได้

URL ฐานอื่นๆ (OpenAI สาธารณะ, พร็อกซีที่เข้ากันได้กับ OpenAI) จะคงรูปแบบ
คำขอรูปภาพมาตรฐานของ OpenAI

<Note>
การกำหนดเส้นทาง Azure สำหรับเส้นทางการสร้างรูปภาพของผู้ให้บริการ `openai` ต้องใช้
OpenClaw 2026.4.22 หรือใหม่กว่า เวอร์ชันก่อนหน้าจะถือว่า
`openai.baseUrl` แบบกำหนดเองใดๆ เป็นเหมือนปลายทาง OpenAI สาธารณะ และจะล้มเหลวกับ
การปรับใช้รูปภาพของ Azure
</Note>

### เวอร์ชัน API

ตั้งค่า `AZURE_OPENAI_API_VERSION` เพื่อตรึงเวอร์ชัน preview หรือ GA ของ Azure ที่เฉพาะเจาะจง
สำหรับเส้นทางการสร้างรูปภาพของ Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

ค่าเริ่มต้นคือ `2024-12-01-preview` เมื่อไม่ได้ตั้งค่าตัวแปร

### ชื่อโมเดลคือชื่อการปรับใช้

Azure OpenAI ผูกโมเดลกับการปรับใช้ สำหรับคำขอสร้างรูปภาพของ Azure
ที่กำหนดเส้นทางผ่านผู้ให้บริการ `openai` ที่รวมมาด้วย ฟิลด์ `model` ใน OpenClaw
ต้องเป็น **ชื่อการปรับใช้ Azure** ที่คุณกำหนดค่าไว้ในพอร์ทัล Azure ไม่ใช่
id โมเดล OpenAI สาธารณะ

หากคุณสร้างการปรับใช้ชื่อ `gpt-image-2-prod` ที่ให้บริการ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

กฎชื่อการปรับใช้เดียวกันนี้ใช้กับการเรียกสร้างรูปภาพที่กำหนดเส้นทางผ่าน
ผู้ให้บริการ `openai` ที่รวมมาด้วย

### ความพร้อมใช้งานตามภูมิภาค

ขณะนี้การสร้างรูปภาพของ Azure พร้อมใช้งานเฉพาะในบางภูมิภาคเท่านั้น
(เช่น `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`) ตรวจสอบรายการภูมิภาคปัจจุบันของ Microsoft ก่อนสร้าง
การปรับใช้ และยืนยันว่าโมเดลเฉพาะนั้นมีให้ใช้ในภูมิภาคของคุณ

### ความแตกต่างของพารามิเตอร์

Azure OpenAI และ OpenAI สาธารณะไม่ได้รับพารามิเตอร์รูปภาพชุดเดียวกันเสมอไป
Azure อาจปฏิเสธตัวเลือกที่ OpenAI สาธารณะอนุญาต (เช่น ค่า
`background` บางค่าบน `gpt-image-2`) หรือเปิดเผยเฉพาะบนเวอร์ชันโมเดล
บางเวอร์ชัน ความแตกต่างเหล่านี้มาจาก Azure และโมเดลพื้นฐาน ไม่ใช่
OpenClaw หากคำขอ Azure ล้มเหลวด้วยข้อผิดพลาดการตรวจสอบ ให้ตรวจสอบ
ชุดพารามิเตอร์ที่การปรับใช้และเวอร์ชัน API เฉพาะของคุณรองรับใน
พอร์ทัล Azure

<Note>
Azure OpenAI ใช้ transport ดั้งเดิมและพฤติกรรม compat แต่ไม่ได้รับ
ส่วนหัว attribution ที่ซ่อนอยู่ของ OpenClaw — ดู accordion **เส้นทางดั้งเดิมเทียบกับเส้นทางที่เข้ากันได้กับ OpenAI**
ใต้ [การกำหนดค่าขั้นสูง](#advanced-configuration)

สำหรับทราฟฟิก chat หรือ Responses บน Azure (นอกเหนือจากการสร้างรูปภาพ) ให้ใช้
ขั้นตอน onboarding หรือการกำหนดค่าผู้ให้บริการ Azure เฉพาะ — `openai.baseUrl` เพียงอย่างเดียว
จะไม่เลือกรูปแบบ Azure API/การยืนยันตัวตน มีผู้ให้บริการ
`azure-openai-responses/*` แยกต่างหาก; ดู accordion Server-side compaction ด้านล่าง
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Transport (WebSocket เทียบกับ SSE)">
    OpenClaw ใช้ WebSocket ก่อนพร้อม fallback เป็น SSE (`"auto"`) สำหรับ `openai/*`

    ในโหมด `"auto"` OpenClaw จะ:
    - ลองใหม่หลัง WebSocket ล้มเหลวช่วงต้นหนึ่งครั้ง ก่อน fallback เป็น SSE
    - หลังเกิดความล้มเหลว ทำเครื่องหมาย WebSocket ว่า degraded ประมาณ 60 วินาที และใช้ SSE ระหว่างช่วง cool-down
    - แนบส่วนหัวข้อมูลระบุเซสชันและเทิร์นที่คงที่สำหรับการลองใหม่และการเชื่อมต่อใหม่
    - ปรับตัวนับการใช้งาน (`input_tokens` / `prompt_tokens`) ให้เป็นรูปแบบเดียวกันระหว่าง transport variant

    | ค่า | พฤติกรรม |
    |-------|----------|
    | `"auto"` (ค่าเริ่มต้น) | ใช้ WebSocket ก่อน, fallback เป็น SSE |
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
    - [Realtime API ด้วย WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [การตอบกลับ Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="โหมดเร็ว">
    OpenClaw เปิดเผยตัวสลับโหมดเร็วที่ใช้ร่วมกันสำหรับ `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **การกำหนดค่า:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    เมื่อเปิดใช้งาน OpenClaw จะแมปโหมดเร็วกับการประมวลผลแบบ priority ของ OpenAI (`service_tier = "priority"`) ค่า `service_tier` ที่มีอยู่จะถูกคงไว้ และโหมดเร็วจะไม่เขียนทับ `reasoning` หรือ `text.verbosity` `fastMode: "auto"` จะเริ่มการเรียกโมเดลใหม่แบบเร็วจนถึงจุดตัดอัตโนมัติ จากนั้นเริ่มการเรียก retry, fallback, tool-result หรือ continuation ภายหลังโดยไม่มีโหมดเร็ว จุดตัดมีค่าเริ่มต้นที่ 60 วินาที; ตั้งค่า `params.fastAutoOnSeconds` บนโมเดลที่ใช้งานอยู่เพื่อเปลี่ยนค่า

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    การ override ของเซสชันมีผลเหนือการกำหนดค่า การล้างการ override ของเซสชันใน Sessions UI จะคืนเซสชันกลับไปใช้ค่าเริ่มต้นที่กำหนดค่าไว้
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

    ค่าที่รองรับ: `auto`, `default`, `flex`, `priority`

    <Warning>
    `serviceTier` จะถูกส่งต่อไปยังปลายทาง OpenAI ดั้งเดิม (`api.openai.com`) และปลายทาง Codex ดั้งเดิม (`chatgpt.com/backend-api`) เท่านั้น หากคุณกำหนดเส้นทางผู้ให้บริการใดผู้ให้บริการหนึ่งผ่านพร็อกซี OpenClaw จะปล่อย `service_tier` ไว้ตามเดิม
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    สำหรับโมเดล OpenAI Responses โดยตรง (`openai/*` บน `api.openai.com`) ตัวห่อสตรีม OpenClaw ของ Plugin OpenAI จะเปิดใช้งาน server-side compaction โดยอัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ compat ของโมเดลตั้งค่า `supportsStore: false`)
    - ฉีด `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - ค่าเริ่มต้น `compact_threshold`: 70% ของ `contextWindow` (หรือ `80000` เมื่อไม่มีข้อมูล)

    สิ่งนี้ใช้กับเส้นทางรันไทม์ OpenClaw ในตัว และกับ hook ของผู้ให้บริการ OpenAI ที่ใช้โดยการรันแบบฝังตัว แอปเซิร์ฟเวอร์ harness ของ Codex ดั้งเดิมจัดการ context ของตัวเองผ่าน Codex และถูกกำหนดค่าโดยเส้นทาง agent เริ่มต้นของ OpenAI หรือนโยบายรันไทม์ผู้ให้บริการ/โมเดล

    <Tabs>
      <Tab title="เปิดใช้งานอย่างชัดเจน">
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
    `responsesServerCompaction` ควบคุมเฉพาะการฉีด `context_management` เท่านั้น โมเดล OpenAI Responses โดยตรงยังคงบังคับ `store: true` เว้นแต่ compat จะตั้งค่า `supportsStore: false`
    </Note>

  </Accordion>

  <Accordion title="โหมด GPT แบบ agentic ที่เข้มงวด">
    สำหรับการรันตระกูล GPT-5 บน `openai/*` OpenClaw สามารถใช้สัญญาการเรียกใช้งานแบบฝังตัวที่เข้มงวดขึ้นได้:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    เมื่อใช้ `strict-agentic` OpenClaw จะ:
    - เปิดใช้ `update_plan` โดยอัตโนมัติสำหรับงานที่มีสาระสำคัญ
    - ลองใหม่เมื่อรอบการตอบว่างเปล่าในเชิงโครงสร้างหรือมีเฉพาะการให้เหตุผล ด้วยการต่อเนื่องแบบมีคำตอบที่มองเห็นได้
    - ใช้เหตุการณ์แผนของ harness อย่างชัดเจนเมื่อ harness ที่เลือกมีให้

    OpenClaw จะไม่จัดประเภทข้อความร้อยแก้วของผู้ช่วยเพื่อตัดสินว่ารอบการตอบเป็นแผน อัปเดตความคืบหน้า หรือคำตอบสุดท้าย

    <Note>
    จำกัดเฉพาะการรันตระกูล OpenAI และ Codex GPT-5 เท่านั้น ผู้ให้บริการรายอื่นและตระกูลโมเดลรุ่นเก่ายังคงใช้พฤติกรรมเริ่มต้น
    </Note>

  </Accordion>

  <Accordion title="เส้นทางเนทีฟเทียบกับเส้นทางที่เข้ากันได้กับ OpenAI">
    OpenClaw ปฏิบัติกับปลายทาง OpenAI, Codex และ Azure OpenAI โดยตรงแตกต่างจากพร็อกซี `/v1` ทั่วไปที่เข้ากันได้กับ OpenAI:

    **เส้นทางเนทีฟ** (`openai/*`, Azure OpenAI):
    - คง `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับ effort `none` ของ OpenAI
    - ละเว้น reasoning ที่ปิดใช้งานสำหรับโมเดลหรือพร็อกซีที่ปฏิเสธ `reasoning.effort: "none"`
    - ตั้งค่าสคีมาของเครื่องมือเป็นโหมดเข้มงวดโดยค่าเริ่มต้น
    - แนบส่วนหัวการระบุแหล่งที่มาแบบซ่อนเฉพาะบนโฮสต์เนทีฟที่ยืนยันแล้วเท่านั้น
    - คงการจัดรูปคำขอเฉพาะ OpenAI (`service_tier`, `store`, ความเข้ากันได้ของ reasoning, คำใบ้ prompt-cache)

    **เส้นทางพร็อกซี/ที่เข้ากันได้:**
    - ใช้พฤติกรรมความเข้ากันได้ที่ผ่อนปรนกว่า
    - ตัด `store` ของ Completions ออกจากเพย์โหลด `openai-completions` ที่ไม่ใช่เนทีฟ
    - รับ JSON แบบส่งผ่านขั้นสูง `params.extra_body`/`params.extraBody` สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI
    - รับ `params.chat_template_kwargs` สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI เช่น vLLM
    - ไม่บังคับใช้สคีมาเครื่องมือแบบเข้มงวดหรือส่วนหัวที่ใช้เฉพาะเนทีฟ

    Azure OpenAI ใช้การขนส่งแบบเนทีฟและพฤติกรรมความเข้ากันได้ แต่จะไม่ได้รับส่วนหัวการระบุแหล่งที่มาแบบซ่อน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับเมื่อเกิดความล้มเหลว
  </Card>
  <Card title="การสร้างรูปภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือรูปภาพร่วมและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอร่วมและการเลือกผู้ให้บริการ
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
