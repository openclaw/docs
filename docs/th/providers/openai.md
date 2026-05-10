---
read_when:
    - คุณต้องการใช้โมเดล OpenAI ใน OpenClaw
    - คุณต้องการใช้การยืนยันตัวตนด้วยการสมัครใช้งาน Codex แทนคีย์ API
    - คุณต้องการพฤติกรรมการดำเนินการของเอเจนต์ GPT-5 ที่เข้มงวดยิ่งขึ้น
summary: ใช้ OpenAI ผ่านคีย์ API หรือการสมัครใช้งาน Codex ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-10T19:55:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5022874c9517e670b70ba90fb400f99f850746c341cb6e967c2abc96d8255548
    source_path: providers/openai.md
    workflow: 16
---

OpenAI มี API สำหรับนักพัฒนาสำหรับโมเดล GPT และ Codex ก็มีให้ใช้งานในฐานะเอเจนต์เขียนโค้ดในแผน ChatGPT ผ่านไคลเอนต์ Codex ของ OpenAI ด้วย OpenClaw แยกพื้นผิวเหล่านั้นออกจากกันเพื่อให้การกำหนดค่าคาดเดาได้

OpenClaw ใช้ `openai/*` เป็นเส้นทางโมเดล OpenAI แบบมาตรฐาน เทิร์นของเอเจนต์แบบฝังบนโมเดล OpenAI จะรันผ่านรันไทม์แอปเซิร์ฟเวอร์ Codex แบบเนทีฟโดยค่าเริ่มต้น ส่วนการยืนยันตัวตนด้วยคีย์ API ของ OpenAI โดยตรงยังคงใช้ได้สำหรับพื้นผิว OpenAI ที่ไม่ใช่เอเจนต์ เช่น รูปภาพ embeddings เสียง และเรียลไทม์

- **โมเดลเอเจนต์** - โมเดล `openai/*` ผ่านรันไทม์ Codex; ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน `openai-codex` สำหรับการใช้งานการสมัครสมาชิก ChatGPT/Codex หรือกำหนดค่าโปรไฟล์คีย์ API `openai-codex` เมื่อคุณตั้งใจต้องการการยืนยันตัวตนด้วยคีย์ API
- **API ของ OpenAI ที่ไม่ใช่เอเจนต์** - เข้าถึง OpenAI Platform โดยตรงพร้อมการเรียกเก็บเงินตามการใช้งานผ่าน `OPENAI_API_KEY` หรือการเริ่มต้นใช้งานคีย์ API ของ OpenAI
- **การกำหนดค่าเดิม** - อ้างอิงโมเดล `openai-codex/*` จะถูกซ่อมแซมโดย `openclaw doctor --fix` เป็น `openai/*` พร้อมรันไทม์ Codex

OpenAI รองรับการใช้งาน OAuth แบบสมัครสมาชิกในเครื่องมือและเวิร์กโฟลว์ภายนอกอย่าง OpenClaw อย่างชัดเจน

ผู้ให้บริการ โมเดล รันไทม์ และช่องทางเป็นเลเยอร์ที่แยกกัน หากป้ายกำกับเหล่านั้นถูกปะปนกัน ให้อ่าน [รันไทม์เอเจนต์](/th/concepts/agent-runtimes) ก่อนเปลี่ยนการกำหนดค่า

## ตัวเลือกด่วน

| เป้าหมาย                                                 | ใช้                                                     | หมายเหตุ                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| การสมัครสมาชิก ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-5.5`                                        | การตั้งค่าเอเจนต์ OpenAI เริ่มต้น ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน `openai-codex`         |
| การเรียกเก็บเงินด้วยคีย์ API โดยตรงสำหรับโมเดลเอเจนต์              | `openai/gpt-5.5` พร้อมโปรไฟล์คีย์ API `openai-codex` | ใช้ `auth.order.openai-codex` เพื่อให้โปรไฟล์นั้นมีลำดับความสำคัญ                 |
| การเรียกเก็บเงินด้วยคีย์ API โดยตรงผ่าน PI แบบชัดเจน           | `openai/gpt-5.5` พร้อมรันไทม์ผู้ให้บริการ/โมเดล `pi`       | เลือกโปรไฟล์คีย์ API `openai` ปกติ                             |
| เอเลียส API ของ ChatGPT Instant ล่าสุด                     | `openai/chat-latest`                                    | ใช้คีย์ API โดยตรงเท่านั้น เอเลียสที่เปลี่ยนไปสำหรับการทดลอง ไม่ใช่ค่าเริ่มต้น   |
| การยืนยันตัวตนการสมัครสมาชิก ChatGPT/Codex ผ่าน PI แบบชัดเจน  | `openai/gpt-5.5` พร้อมรันไทม์ผู้ให้บริการ/โมเดล `pi`       | เลือกโปรไฟล์การยืนยันตัวตน `openai-codex` สำหรับเส้นทางความเข้ากันได้    |
| การสร้างหรือแก้ไขรูปภาพ                          | `openai/gpt-image-2`                                    | ใช้ได้กับทั้ง `OPENAI_API_KEY` หรือ OpenAI Codex OAuth             |
| รูปภาพพื้นหลังโปร่งใส                        | `openai/gpt-image-1.5`                                  | ใช้ `outputFormat=png` หรือ `webp` และ `openai.background=transparent` |

## แผนที่การตั้งชื่อ

ชื่อคล้ายกันแต่ใช้แทนกันไม่ได้:

| ชื่อที่คุณเห็น                            | เลเยอร์               | ความหมาย                                                                                           |
| --------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | คำนำหน้าผู้ให้บริการ     | เส้นทางโมเดล OpenAI แบบมาตรฐาน; เทิร์นของเอเจนต์ใช้รันไทม์ Codex                                  |
| `openai-codex`                          | คำนำหน้าการยืนยันตัวตน/โปรไฟล์ | ผู้ให้บริการโปรไฟล์การยืนยันตัวตน OpenAI Codex OAuth/การสมัครสมาชิก                                            |
| Plugin `codex`                          | Plugin              | Plugin ที่รวมมากับ OpenClaw ซึ่งให้รันไทม์แอปเซิร์ฟเวอร์ Codex แบบเนทีฟและตัวควบคุมแชต `/codex` |
| ผู้ให้บริการ/โมเดล `agentRuntime.id: codex` | รันไทม์เอเจนต์       | บังคับใช้ฮาร์เนสแอปเซิร์ฟเวอร์ Codex แบบเนทีฟสำหรับเทิร์นแบบฝังที่ตรงกัน                            |
| `/codex ...`                            | ชุดคำสั่งแชต    | ผูก/ควบคุมเธรดแอปเซิร์ฟเวอร์ Codex จากการสนทนา                                        |
| `runtime: "acp", agentId: "codex"`      | เส้นทางเซสชัน ACP   | เส้นทางสำรองแบบชัดเจนที่รัน Codex ผ่าน ACP/acpx                                          |

ซึ่งหมายความว่าการกำหนดค่าหนึ่งสามารถมีทั้งอ้างอิงโมเดล `openai/*` และโปรไฟล์การยืนยันตัวตน `openai-codex` ได้โดยตั้งใจ `openclaw doctor --fix` จะเขียนอ้างอิงโมเดลเดิม `openai-codex/*` ใหม่เป็นเส้นทางโมเดล OpenAI แบบมาตรฐาน

<Note>
GPT-5.5 ใช้งานได้ผ่านทั้งการเข้าถึงด้วยคีย์ API ของ OpenAI Platform โดยตรงและเส้นทางการสมัครสมาชิก/OAuth สำหรับการสมัครสมาชิก ChatGPT/Codex พร้อมการดำเนินการ Codex แบบเนทีฟ ให้ใช้ `openai/gpt-5.5`; การไม่ตั้งค่ารันไทม์ตอนนี้จะเลือกฮาร์เนส Codex สำหรับเทิร์นเอเจนต์ OpenAI ใช้โปรไฟล์คีย์ API ของ OpenAI เฉพาะเมื่อคุณต้องการการยืนยันตัวตนด้วยคีย์ API โดยตรงสำหรับโมเดลเอเจนต์ OpenAI
</Note>

<Note>
เทิร์นโมเดลเอเจนต์ OpenAI ต้องใช้ Plugin แอปเซิร์ฟเวอร์ Codex ที่รวมมาให้ การกำหนดค่ารันไทม์ PI แบบชัดเจนยังคงมีให้ใช้เป็นเส้นทางความเข้ากันได้แบบเลือกใช้ เมื่อเลือก PI อย่างชัดเจนพร้อมโปรไฟล์การยืนยันตัวตน `openai-codex` OpenClaw จะคงอ้างอิงโมเดลสาธารณะเป็น `openai/*` และกำหนดเส้นทาง PI ภายในผ่านทรานสปอร์ตการยืนยันตัวตน Codex เดิม รัน `openclaw doctor --fix` เพื่อซ่อมแซมอ้างอิงโมเดล `openai-codex/*` ที่ค้างอยู่หรือพินเซสชัน PI เก่าที่ไม่ได้มาจากการกำหนดค่ารันไทม์แบบชัดเจน
</Note>

## การครอบคลุมฟีเจอร์ของ OpenClaw

| ความสามารถของ OpenAI         | พื้นผิวของ OpenClaw                                                                 | สถานะ                                                 |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| แชต / การตอบสนอง          | ผู้ให้บริการโมเดล `openai/<model>`                                                  | ใช่                                                    |
| โมเดลการสมัครสมาชิก Codex | `openai/<model>` พร้อม OAuth `openai-codex`                                       | ใช่                                                    |
| อ้างอิงโมเดล Codex เดิม   | `openai-codex/<model>`                                                           | ถูกซ่อมแซมโดย doctor เป็น `openai/<model>`                 |
| ฮาร์เนสแอปเซิร์ฟเวอร์ Codex  | `openai/<model>` เมื่อไม่ระบุรันไทม์หรือผู้ให้บริการ/โมเดล `agentRuntime.id: codex` | ใช่                                                    |
| การค้นหาเว็บฝั่งเซิร์ฟเวอร์    | เครื่องมือ OpenAI Responses แบบเนทีฟ                                                     | ใช่ เมื่อเปิดใช้งานการค้นหาเว็บและไม่ได้พินผู้ให้บริการ |
| รูปภาพ                    | `image_generate`                                                                 | ใช่                                                    |
| วิดีโอ                    | `video_generate`                                                                 | ใช่                                                    |
| ข้อความเป็นเสียง            | `messages.tts.provider: "openai"` / `tts`                                        | ใช่                                                    |
| เสียงเป็นข้อความแบบแบตช์      | `tools.media.audio` / การทำความเข้าใจสื่อ                                        | ใช่                                                    |
| เสียงเป็นข้อความแบบสตรีมมิง  | Voice Call `streaming.provider: "openai"`                                        | ใช่                                                    |
| เสียงเรียลไทม์            | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | ใช่                                                    |
| Embeddings                | ผู้ให้บริการ embedding ของหน่วยความจำ                                                        | ใช่                                                    |

## Embeddings ของหน่วยความจำ

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

สำหรับปลายทางที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้ป้ายกำกับ embedding แบบอสมมาตร ให้ตั้งค่า `queryInputType` และ `documentInputType` ภายใต้ `memorySearch` OpenClaw จะส่งต่อค่าเหล่านั้นเป็นฟิลด์คำขอ `input_type` เฉพาะผู้ให้บริการ: query embeddings ใช้ `queryInputType`; ชิ้นส่วนหน่วยความจำที่ทำดัชนีและการทำดัชนีแบบแบตช์ใช้ `documentInputType` ดูตัวอย่างเต็มได้ที่ [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config#provider-specific-config)

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการและทำตามขั้นตอนการตั้งค่า

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

    | อ้างอิงโมเดล              | การกำหนดค่ารันไทม์             | เส้นทาง                       | การยืนยันตัวตน             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | ไม่ระบุ / ผู้ให้บริการ/โมเดล `agentRuntime.id: "codex"` | ฮาร์เนสแอปเซิร์ฟเวอร์ Codex | โปรไฟล์ `openai-codex` |
    | `openai/gpt-5.4-mini` | ไม่ระบุ / ผู้ให้บริการ/โมเดล `agentRuntime.id: "codex"` | ฮาร์เนสแอปเซิร์ฟเวอร์ Codex | โปรไฟล์ `openai-codex` |
    | `openai/gpt-5.5`      | ผู้ให้บริการ/โมเดล `agentRuntime.id: "pi"`              | รันไทม์แบบฝัง PI      | โปรไฟล์ `openai` หรือโปรไฟล์ `openai-codex` ที่เลือก |

    <Note>
    โมเดลเอเจนต์ `openai/*` ใช้ฮาร์เนสแอปเซิร์ฟเวอร์ Codex หากต้องการใช้การยืนยันตัวตนด้วยคีย์ API สำหรับโมเดลเอเจนต์ ให้สร้างโปรไฟล์คีย์ API `openai-codex` และจัดลำดับด้วย `auth.order.openai-codex`; `OPENAI_API_KEY` ยังคงเป็นทางสำรองโดยตรงสำหรับพื้นผิว API ของ OpenAI ที่ไม่ใช่เอเจนต์
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

    `chat-latest` เป็นเอเลียสที่เปลี่ยนไป OpenAI ระบุว่าเป็นโมเดล Instant ล่าสุดที่ใช้ใน ChatGPT และแนะนำ `gpt-5.5` สำหรับการใช้งาน API ในโปรดักชัน ดังนั้นให้คง `openai/gpt-5.5` เป็นค่าเริ่มต้นที่เสถียร เว้นแต่คุณต้องการพฤติกรรมของเอเลียสนั้นอย่างชัดเจน ขณะนี้เอเลียสยอมรับเฉพาะความละเอียดข้อความ `medium` ดังนั้น OpenClaw จึงปรับโอเวอร์ไรด์ความละเอียดข้อความของ OpenAI ที่เข้ากันไม่ได้สำหรับโมเดลนี้ให้เป็นปกติ

    <Warning>
    OpenClaw **ไม่** เปิดเผย `openai/gpt-5.3-codex-spark` คำขอ OpenAI API แบบสดจะปฏิเสธโมเดลนั้น และแค็ตตาล็อก Codex ปัจจุบันก็ไม่เปิดเผยโมเดลนี้เช่นกัน
    </Warning>

  </Tab>

  <Tab title="การสมัครสมาชิก Codex">
    **เหมาะที่สุดสำหรับ:** การใช้การสมัครสมาชิก ChatGPT/Codex ของคุณพร้อมการดำเนินการแอปเซิร์ฟเวอร์ Codex แบบเนทีฟแทนคีย์ API แยกต่างหาก Codex cloud ต้องลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="รัน Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        หรือรัน OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        สำหรับการตั้งค่าแบบไม่มีหน้าจอหรือไม่สะดวกกับคอลแบ็ก ให้เพิ่ม `--device-code` เพื่อลงชื่อเข้าใช้ด้วยโฟลว์รหัสอุปกรณ์ของ ChatGPT แทนคอลแบ็กเบราว์เซอร์ localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="ใช้เส้นทางโมเดล OpenAI ตามมาตรฐาน">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        ไม่จำเป็นต้องมีการกำหนดค่ารันไทม์สำหรับเส้นทางเริ่มต้น รอบของเอเจนต์ OpenAI
        จะเลือกรันไทม์เซิร์ฟเวอร์แอป Codex แบบเนทีฟโดยอัตโนมัติ และ OpenClaw
        จะติดตั้งหรือซ่อมแซม Codex plugin ที่รวมมาให้เมื่อเลือกเส้นทางนี้
      </Step>
      <Step title="ตรวจสอบว่าการยืนยันตัวตน Codex พร้อมใช้งาน">
        ```bash
        openclaw models list --provider openai-codex
        ```

        หลังจาก Gateway ทำงานแล้ว ให้ส่ง `/codex status` หรือ `/codex models`
        ในแชตเพื่อตรวจสอบรันไทม์เซิร์ฟเวอร์แอปแบบเนทีฟ
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | การอ้างอิงโมเดล | การกำหนดค่ารันไทม์ | เส้นทาง | การยืนยันตัวตน |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | ละไว้ / provider/model `agentRuntime.id: "codex"` | ฮาร์เนสเซิร์ฟเวอร์แอป Codex แบบเนทีฟ | การลงชื่อเข้าใช้ Codex หรือโปรไฟล์ `openai-codex` ที่เลือก |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "pi"` | รันไทม์ PI แบบฝังตัวพร้อมทรานสปอร์ต Codex-auth ภายใน | โปรไฟล์ `openai-codex` ที่เลือก |
    | `openai-codex/gpt-5.5` | ซ่อมแซมโดย doctor | เส้นทางเดิมที่เขียนใหม่เป็น `openai/gpt-5.5` | โปรไฟล์ `openai-codex` ที่มีอยู่ |

    <Warning>
    อย่ากำหนดค่าการอ้างอิงโมเดล `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` หรือ
    `openai-codex/gpt-5.3*` รุ่นเก่า บัญชี OAuth ของ ChatGPT/Codex ตอนนี้ปฏิเสธ
    โมเดลเหล่านั้นแล้ว ใช้ `openai/gpt-5.5`; รอบของเอเจนต์ OpenAI ตอนนี้เลือกรันไทม์ Codex
    เป็นค่าเริ่มต้น
    </Warning>

    <Note>
    ให้ใช้ id ผู้ให้บริการ `openai-codex` ต่อไปสำหรับคำสั่งการยืนยันตัวตน/โปรไฟล์
    คำนำหน้าโมเดล `openai-codex/*` เป็นการกำหนดค่าเดิมที่ doctor ซ่อมแซม สำหรับการตั้งค่า
    แบบสมัครสมาชิกทั่วไปพร้อมรันไทม์เนทีฟ ให้ลงชื่อเข้าใช้ด้วย `openai-codex`
    แต่เก็บการอ้างอิงโมเดลเป็น `openai/gpt-5.5`
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

    <Note>
    Onboarding จะไม่นำเข้าข้อมูล OAuth จาก `~/.codex` อีกต่อไป ลงชื่อเข้าใช้ด้วย OAuth ผ่านเบราว์เซอร์ (ค่าเริ่มต้น) หรือขั้นตอน device-code ด้านบน — OpenClaw จะจัดการข้อมูลประจำตัวที่ได้ในที่เก็บการยืนยันตัวตนของเอเจนต์ของตัวเอง
    </Note>

    ### ตรวจสอบและกู้คืนการกำหนดเส้นทาง OAuth ของ Codex

    ใช้คำสั่งเหล่านี้เพื่อดูว่าเอเจนต์เริ่มต้นของคุณกำลังใช้โมเดล รันไทม์ และเส้นทาง
    การยืนยันตัวตนใด:

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

    หากการกำหนดค่ารุ่นเก่ายังมี `openai-codex/gpt-*` หรือพินเซสชัน OpenAI PI
    ที่ล้าสมัยโดยไม่มีการกำหนดค่ารันไทม์อย่างชัดเจน ให้ซ่อมแซม:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    หาก `models auth list --provider openai-codex` ไม่แสดงโปรไฟล์ที่ใช้ได้ ให้ลงชื่อ
    เข้าใช้อีกครั้ง:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` ยังคงเป็น id ผู้ให้บริการการยืนยันตัวตน/โปรไฟล์ `openai/*` คือ
    เส้นทางโมเดลสำหรับรอบเอเจนต์ OpenAI ผ่าน Codex

    ### ตัวบ่งชี้สถานะ

    แชต `/status` แสดงว่ารันไทม์โมเดลใดกำลังใช้งานอยู่สำหรับเซสชันปัจจุบัน
    ฮาร์เนสเซิร์ฟเวอร์แอป Codex ที่รวมมาให้จะแสดงเป็น `Runtime: OpenAI Codex` สำหรับ
    รอบโมเดลเอเจนต์ OpenAI พินเซสชัน PI ที่ล้าสมัยจะถูกซ่อมแซมเป็น Codex เว้นแต่
    การกำหนดค่าจะพิน PI ไว้อย่างชัดเจน

    ### คำเตือนของ Doctor

    หากเส้นทาง `openai-codex/*` หรือพิน OpenAI PI ที่ล้าสมัยยังคงอยู่ในการกำหนดค่าหรือ
    สถานะเซสชัน `openclaw doctor --fix` จะเขียนใหม่เป็น `openai/*` พร้อมรันไทม์
    Codex เว้นแต่จะกำหนดค่า PI ไว้อย่างชัดเจน

    ### ขีดจำกัดหน้าต่างบริบท

    OpenClaw ถือว่าเมทาดาทาของโมเดลและขีดจำกัดบริบทรันไทม์เป็นค่าคนละส่วนกัน

    สำหรับ `openai/gpt-5.5` ผ่านแค็ตตาล็อก OAuth ของ Codex:

    - `contextWindow` แบบเนทีฟ: `1000000`
    - ขีดจำกัด `contextTokens` ของรันไทม์เริ่มต้น: `272000`

    ขีดจำกัดเริ่มต้นที่เล็กกว่ามีคุณลักษณะด้านเวลาแฝงและคุณภาพที่ดีกว่าในการใช้งานจริง เขียนทับได้ด้วย `contextTokens`:

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
    ใช้ `contextWindow` เพื่อประกาศเมทาดาทาโมเดลแบบเนทีฟ ใช้ `contextTokens` เพื่อจำกัดงบประมาณบริบทรันไทม์
    </Note>

    ### การกู้คืนแค็ตตาล็อก

    OpenClaw ใช้เมทาดาทาแค็ตตาล็อก Codex ต้นทางสำหรับ `gpt-5.5` เมื่อมีอยู่
    หากการค้นพบ Codex แบบสดละเว้นแถว `gpt-5.5` ขณะที่
    บัญชีได้รับการยืนยันตัวตนแล้ว OpenClaw จะสังเคราะห์แถวโมเดล OAuth นั้นเพื่อให้
    การรัน Cron, เอเจนต์ย่อย และโมเดลเริ่มต้นที่กำหนดค่าไว้ไม่ล้มเหลวด้วย
    `Unknown model`

  </Tab>
</Tabs>

## การยืนยันตัวตนของเซิร์ฟเวอร์แอป Codex แบบเนทีฟ

ฮาร์เนสเซิร์ฟเวอร์แอป Codex แบบเนทีฟใช้การอ้างอิงโมเดล `openai/*` พร้อมการละเว้น
การกำหนดค่ารันไทม์ หรือ provider/model `agentRuntime.id: "codex"` แต่การยืนยันตัวตนยังคง
อิงบัญชี OpenClaw
เลือกการยืนยันตัวตนตามลำดับนี้:

1. โปรไฟล์การยืนยันตัวตน OpenClaw `openai-codex` ที่ผูกกับเอเจนต์อย่างชัดเจน
2. บัญชีที่มีอยู่ของเซิร์ฟเวอร์แอป เช่น การลงชื่อเข้าใช้ ChatGPT ของ Codex CLI ในเครื่อง
3. สำหรับการเปิดเซิร์ฟเวอร์แอป stdio ในเครื่องเท่านั้น `CODEX_API_KEY` จากนั้น
   `OPENAI_API_KEY` เมื่อเซิร์ฟเวอร์แอปรายงานว่าไม่มีบัญชีและยังต้องการ
   การยืนยันตัวตน OpenAI

นั่นหมายความว่าการลงชื่อเข้าใช้แบบสมัครสมาชิก ChatGPT/Codex ในเครื่องจะไม่ถูกแทนที่
เพียงเพราะกระบวนการ Gateway มี `OPENAI_API_KEY` สำหรับโมเดล OpenAI โดยตรง
หรือ embeddings ด้วย ทางเลือกสำรอง API key จาก env เป็นเพียงเส้นทาง stdio ในเครื่องที่ไม่มีบัญชีเท่านั้น;
จะไม่ถูกส่งไปยังการเชื่อมต่อเซิร์ฟเวอร์แอป WebSocket เมื่อเลือกโปรไฟล์ Codex
แบบสมัครสมาชิก OpenClaw จะกัน `CODEX_API_KEY` และ `OPENAI_API_KEY`
ออกจากโปรเซสลูกของเซิร์ฟเวอร์แอป stdio ที่ spawn ขึ้นมา และส่งข้อมูลประจำตัวที่เลือก
ผ่าน RPC การเข้าสู่ระบบของเซิร์ฟเวอร์แอป

## การสร้างรูปภาพ

Plugin `openai` ที่รวมมาให้ลงทะเบียนการสร้างรูปภาพผ่านเครื่องมือ `image_generate`
รองรับทั้งการสร้างรูปภาพด้วย API key ของ OpenAI และการสร้างรูปภาพด้วย OAuth ของ Codex
ผ่านการอ้างอิงโมเดล `openai/gpt-image-2` เดียวกัน

| ความสามารถ                | API key ของ OpenAI                     | OAuth ของ Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| การอ้างอิงโมเดล                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| การยืนยันตัวตน                      | `OPENAI_API_KEY`                   | การลงชื่อเข้าใช้ OpenAI Codex OAuth           |
| ทรานสปอร์ต                 | OpenAI Images API                  | แบ็กเอนด์ Codex Responses              |
| จำนวนรูปภาพสูงสุดต่อคำขอ    | 4                                  | 4                                    |
| โหมดแก้ไข                 | เปิดใช้งาน (สูงสุด 5 รูปภาพอ้างอิง) | เปิดใช้งาน (สูงสุด 5 รูปภาพอ้างอิง)   |
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
ดู [การสร้างรูปภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรมเฟลโอเวอร์
</Note>

`gpt-image-2` เป็นค่าเริ่มต้นสำหรับทั้งการสร้างรูปภาพจากข้อความของ OpenAI และการ
แก้ไขรูปภาพ `gpt-image-1.5`, `gpt-image-1` และ `gpt-image-1-mini` ยังคงใช้ได้เป็น
การเขียนทับโมเดลอย่างชัดเจน ใช้ `openai/gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP
แบบพื้นหลังโปร่งใส; API `gpt-image-2` ปัจจุบันปฏิเสธ
`background: "transparent"`

สำหรับคำขอพื้นหลังโปร่งใส เอเจนต์ควรเรียก `image_generate` ด้วย
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` หรือ `"webp"` และ
`background: "transparent"`; ตัวเลือกผู้ให้บริการ `openai.background` รุ่นเก่า
ยังคงยอมรับอยู่ OpenClaw ยังปกป้องเส้นทาง OpenAI สาธารณะและ
OpenAI Codex OAuth โดยเขียนคำขอโปร่งใส `openai/gpt-image-2` เริ่มต้นใหม่เป็น
`gpt-image-1.5`; Azure และปลายทางที่เข้ากันได้กับ OpenAI แบบกำหนดเองจะคง
ชื่อ deployment/model ที่กำหนดค่าไว้

การตั้งค่าเดียวกันนี้เปิดเผยสำหรับการรัน CLI แบบ headless:

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
`--openai-background` ยังคงพร้อมใช้งานเป็นนามแฝงเฉพาะของ OpenAI

สำหรับการติดตั้ง Codex OAuth ให้คงการอ้างอิง `openai/gpt-image-2` เดิมไว้ เมื่อกำหนดค่า
โปรไฟล์ OAuth `openai-codex` แล้ว OpenClaw จะแปลงโทเค็นการเข้าถึง OAuth
ที่จัดเก็บไว้และส่งคำขอรูปภาพผ่านแบ็กเอนด์ Codex Responses โดยจะไม่ลอง
`OPENAI_API_KEY` ก่อนหรือเปลี่ยนไปใช้ API key สำหรับคำขอนั้นอย่างเงียบๆ
กำหนดค่า `models.providers.openai` อย่างชัดเจนด้วย API key,
URL ฐานแบบกำหนดเอง หรือปลายทาง Azure เมื่อคุณต้องการเส้นทาง OpenAI Images API
โดยตรงแทน
หากปลายทางรูปภาพแบบกำหนดเองนั้นอยู่บนที่อยู่ LAN/ส่วนตัวที่เชื่อถือได้ ให้ตั้งค่า
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ด้วย; OpenClaw จะยังคง
บล็อกปลายทางรูปภาพที่เข้ากันได้กับ OpenAI แบบส่วนตัว/ภายใน เว้นแต่จะมีการเลือกใช้นี้

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

Plugin `openai` ที่รวมมาให้ลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ `video_generate`

| ความสามารถ       | ค่า                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| โมเดลเริ่มต้น    | `openai/sora-2`                                                                   |
| โหมด            | ข้อความเป็นวิดีโอ, รูปภาพเป็นวิดีโอ, การแก้ไขวิดีโอเดียว                                  |
| อินพุตอ้างอิง | 1 รูปภาพ หรือ 1 วิดีโอ                                                                |
| การเขียนทับขนาด   | รองรับ                                                                         |
| การเขียนทับอื่นๆ  | `aspectRatio`, `resolution`, `audio`, `watermark` จะถูกละเว้นพร้อมคำเตือนของเครื่องมือ |

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรมเฟลโอเวอร์
</Note>

## การร่วมเพิ่มพรอมป์ GPT-5

OpenClaw เพิ่มการร่วมเพิ่มพรอมป์ GPT-5 ที่ใช้ร่วมกันสำหรับการรันตระกูล GPT-5 ข้ามผู้ให้บริการ โดยใช้ตาม id โมเดล ดังนั้น `openai/gpt-5.5`, การอ้างอิงเดิมก่อนซ่อมแซม เช่น `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` และการอ้างอิง GPT-5 อื่นๆ ที่เข้ากันได้จะได้รับโอเวอร์เลย์เดียวกัน โมเดล GPT-4.x รุ่นเก่าจะไม่ได้รับ

ฮาร์เนส Codex แบบเนทีฟที่รวมมาให้ใช้พฤติกรรม GPT-5 และโอเวอร์เลย์ Heartbeat เดียวกันผ่านคำสั่งสำหรับนักพัฒนาของเซิร์ฟเวอร์แอป Codex ดังนั้นเซสชัน `openai/gpt-5.x` ที่กำหนดเส้นทางผ่าน Codex จะยังคงมีแนวทางการติดตามงานให้เสร็จและ Heartbeat เชิงรุกแบบเดียวกัน แม้ว่า Codex จะเป็นเจ้าของพรอมป์ส่วนที่เหลือของฮาร์เนสก็ตาม

การสนับสนุน GPT-5 เพิ่มสัญญาพฤติกรรมแบบมีแท็กสำหรับการคงอยู่ของ persona, ความปลอดภัยในการดำเนินการ, วินัยในการใช้เครื่องมือ, รูปแบบผลลัพธ์, การตรวจสอบความเสร็จสมบูรณ์ และการยืนยันผล พฤติกรรมการตอบกลับเฉพาะช่องทางและข้อความแบบเงียบยังคงอยู่ในพรอมป์ระบบ OpenClaw ร่วมและนโยบายการส่งออก คำแนะนำ GPT-5 จะเปิดใช้งานเสมอสำหรับโมเดลที่ตรงกัน เลเยอร์สไตล์การโต้ตอบแบบเป็นมิตรจะแยกต่างหากและกำหนดค่าได้

| ค่า                    | ผลลัพธ์                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้เลเยอร์สไตล์การโต้ตอบแบบเป็นมิตร |
| `"on"`                 | นามแฝงของ `"friendly"`                      |
| `"off"`                | ปิดใช้งานเฉพาะเลเยอร์สไตล์แบบเป็นมิตร       |

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
ค่าจะไม่แยกตัวพิมพ์เล็กใหญ่ในขณะรันไทม์ ดังนั้นทั้ง `"Off"` และ `"off"` จะปิดใช้งานเลเยอร์สไตล์แบบเป็นมิตร
</Tip>

<Note>
ยังคงอ่าน `plugins.entries.openai.config.personality` แบบเดิมเป็น fallback เพื่อความเข้ากันได้ เมื่อยังไม่ได้ตั้งค่า `agents.defaults.promptOverlays.gpt5.personality` ร่วม
</Note>

## เสียงและคำพูด

<AccordionGroup>
  <Accordion title="การสังเคราะห์เสียงพูด (TTS)">
    Plugin `openai` ที่รวมมาจะลงทะเบียนการสังเคราะห์เสียงพูดสำหรับพื้นผิว `messages.tts`

    | การตั้งค่า | เส้นทางการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | เสียง | `messages.tts.providers.openai.voice` | `coral` |
    | ความเร็ว | `messages.tts.providers.openai.speed` | (ไม่ได้ตั้งค่า) |
    | คำสั่ง | `messages.tts.providers.openai.instructions` | (ไม่ได้ตั้งค่า, เฉพาะ `gpt-4o-mini-tts`) |
    | รูปแบบ | `messages.tts.providers.openai.responseFormat` | `opus` สำหรับบันทึกเสียง, `mp3` สำหรับไฟล์ |
    | คีย์ API | `messages.tts.providers.openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |
    | URL พื้นฐาน | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | เนื้อหาเพิ่มเติม | `messages.tts.providers.openai.extraBody` / `extra_body` | (ไม่ได้ตั้งค่า) |

    โมเดลที่ใช้ได้: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd` เสียงที่ใช้ได้: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`

    `extraBody` จะถูกผสานเข้าใน JSON ของคำขอ `/audio/speech` หลังจากฟิลด์ที่ OpenClaw สร้างขึ้น ดังนั้นให้ใช้สำหรับ endpoint ที่เข้ากันได้กับ OpenAI ซึ่งต้องการคีย์เพิ่มเติม เช่น `lang` คีย์ prototype จะถูกละเว้น

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
    ตั้งค่า `OPENAI_TTS_BASE_URL` เพื่อแทนที่ URL พื้นฐานของ TTS โดยไม่กระทบ endpoint ของ chat API OpenAI TTS ยังคงกำหนดค่าผ่านคีย์ API; สำหรับการพูดตอบกลับสดแบบใช้เฉพาะ OAuth ให้ใช้เส้นทางเสียง Realtime แทนเสียง agent-mode STT -> TTS
    </Note>

  </Accordion>

  <Accordion title="เสียงพูดเป็นข้อความ">
    Plugin `openai` ที่รวมมาจะลงทะเบียนเสียงพูดเป็นข้อความแบบ batch ผ่าน
    พื้นผิวการถอดเสียงเพื่อทำความเข้าใจสื่อของ OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - เส้นทางอินพุต: การอัปโหลดไฟล์เสียงแบบ multipart
    - รองรับโดย OpenClaw ทุกที่ที่การถอดเสียงอินพุตใช้
      `tools.media.audio` รวมถึงเซกเมนต์ช่องเสียง Discord และไฟล์แนบเสียงของช่องทาง

    เพื่อบังคับใช้ OpenAI สำหรับการถอดเสียงอินพุต:

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
    การกำหนดค่าสื่อเสียงร่วม หรือคำขอถอดเสียงแบบต่อครั้ง

  </Accordion>

  <Accordion title="การถอดเสียงแบบ Realtime">
    Plugin `openai` ที่รวมมาจะลงทะเบียนการถอดเสียงแบบ realtime สำหรับ Plugin Voice Call

    | การตั้งค่า | เส้นทางการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | ภาษา | `...openai.language` | (ไม่ได้ตั้งค่า) |
    | พรอมป์ | `...openai.prompt` | (ไม่ได้ตั้งค่า) |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `800` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | การตรวจสอบสิทธิ์ | `...openai.apiKey`, `OPENAI_API_KEY`, หรือ `openai-codex` OAuth | คีย์ API เชื่อมต่อโดยตรง; OAuth mint client secret สำหรับการถอดเสียง Realtime |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียง G.711 u-law (`g711_ulaw` / `audio/pcmu`) เมื่อกำหนดค่าเฉพาะ `openai-codex` OAuth เท่านั้น Gateway จะ mint client secret ชั่วคราวสำหรับการถอดเสียง Realtime ก่อนเปิด WebSocket ผู้ให้บริการสตรีมมิงนี้มีไว้สำหรับเส้นทางการถอดเสียง realtime ของ Voice Call; ปัจจุบันเสียง Discord จะบันทึกเซกเมนต์สั้นและใช้เส้นทางการถอดเสียงแบบ batch `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="เสียง Realtime">
    Plugin `openai` ที่รวมมาจะลงทะเบียนเสียง realtime สำหรับ Plugin Voice Call

    | การตั้งค่า | เส้นทางการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | เสียง | `...openai.voice` | `alloy` |
    | อุณหภูมิ (บริดจ์การปรับใช้ Azure) | `...openai.temperature` | `0.8` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `500` |
    | ระยะเติมนำหน้า | `...openai.prefixPaddingMs` | `300` |
    | ระดับความพยายามในการให้เหตุผล | `...openai.reasoningEffort` | (ไม่ได้ตั้งค่า) |
    | การตรวจสอบสิทธิ์ | `...openai.apiKey`, `OPENAI_API_KEY`, หรือ `openai-codex` OAuth | Browser Talk และบริดจ์ backend ที่ไม่ใช่ Azure สามารถใช้ Codex OAuth ได้ |

    เสียง Realtime ในตัวที่ใช้ได้สำหรับ `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`
    OpenAI แนะนำ `marin` และ `cedar` เพื่อคุณภาพ Realtime ที่ดีที่สุด ชุดนี้
    แยกต่างหากจากเสียง Text-to-speech ข้างต้น; อย่าสันนิษฐานว่าเสียง TTS
    เช่น `fable`, `nova`, หรือ `onyx` ใช้ได้กับเซสชัน Realtime

    <Note>
    บริดจ์ OpenAI realtime ฝั่ง backend ใช้รูปแบบเซสชัน GA Realtime WebSocket ซึ่งไม่รับ `session.temperature` การปรับใช้ Azure OpenAI ยังคงใช้งานได้ผ่าน `azureEndpoint` และ `azureDeployment` และยังคงใช้รูปแบบเซสชันที่เข้ากันได้กับการปรับใช้ รองรับการเรียกใช้เครื่องมือแบบสองทิศทางและเสียง G.711 u-law
    </Note>

    <Note>
    เสียง Realtime จะถูกเลือกเมื่อสร้างเซสชัน OpenAI อนุญาตให้เปลี่ยนฟิลด์เซสชันส่วนใหญ่ภายหลังได้ แต่ไม่สามารถเปลี่ยนเสียงหลังจากโมเดลปล่อยเสียงในเซสชันนั้นแล้ว ปัจจุบัน OpenClaw เปิดเผย id เสียง Realtime ในตัวเป็นสตริง
    </Note>

    <Note>
    Control UI Talk ใช้เซสชัน OpenAI browser realtime พร้อม client secret ชั่วคราวที่ Gateway mint ให้ และการแลกเปลี่ยน WebRTC SDP โดยตรงจากเบราว์เซอร์กับ OpenAI Realtime API เมื่อไม่ได้กำหนดค่าคีย์ OpenAI API โดยตรง Gateway สามารถ mint client secret นั้นด้วยโปรไฟล์ OAuth `openai-codex` ที่เลือก Gateway relay และบริดจ์ Voice Call backend realtime WebSocket ใช้ OAuth fallback เดียวกันสำหรับ endpoint OpenAI แบบ native การยืนยันสดสำหรับ maintainer ใช้ได้ด้วย
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ขา OpenAI จะยืนยันทั้งบริดจ์ WebSocket ฝั่ง backend และการแลกเปลี่ยน WebRTC SDP ของเบราว์เซอร์โดยไม่บันทึก secrets
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

ผู้ให้บริการ `openai` ที่รวมมาสามารถชี้ไปยังทรัพยากร Azure OpenAI สำหรับการสร้างภาพ
ได้ด้วยการแทนที่ URL พื้นฐาน ในเส้นทางการสร้างภาพ OpenClaw
จะตรวจจับ hostname ของ Azure บน `models.providers.openai.baseUrl` และสลับไปใช้
รูปแบบคำขอของ Azure โดยอัตโนมัติ

<Note>
เสียง Realtime ใช้เส้นทางการกำหนดค่าแยกต่างหาก
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
และไม่ได้รับผลกระทบจาก `models.providers.openai.baseUrl` ดู accordion **เสียง
Realtime** ใต้ [เสียงและคำพูด](#voice-and-speech) สำหรับการตั้งค่า Azure
</Note>

ใช้ Azure OpenAI เมื่อ:

- คุณมีการสมัครใช้งาน Azure OpenAI, โควตา หรือข้อตกลงระดับองค์กรอยู่แล้ว
- คุณต้องการ data residency ระดับภูมิภาคหรือการควบคุมด้าน compliance ที่ Azure มีให้
- คุณต้องการเก็บทราฟฟิกไว้ภายใน tenancy ของ Azure ที่มีอยู่

### การกำหนดค่า

สำหรับการสร้างภาพผ่าน Azure ด้วยผู้ให้บริการ `openai` ที่รวมมา ให้ชี้
`models.providers.openai.baseUrl` ไปยังทรัพยากร Azure ของคุณ และตั้งค่า `apiKey` เป็น
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

OpenClaw รู้จัก suffix hostname Azure เหล่านี้สำหรับ route การสร้างภาพของ Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

สำหรับคำขอสร้างภาพบน host Azure ที่รู้จัก OpenClaw จะ:

- ส่ง header `api-key` แทน `Authorization: Bearer`
- ใช้ path ที่อยู่ใน scope ของ deployment (`/openai/deployments/{deployment}/...`)
- เติม `?api-version=...` ต่อท้ายแต่ละคำขอ
- ใช้ timeout คำขอเริ่มต้น 600 วินาทีสำหรับการเรียกสร้างภาพของ Azure
  ค่า `timeoutMs` แบบต่อครั้งยังคงแทนที่ค่าเริ่มต้นนี้ได้

URL พื้นฐานอื่น ๆ (OpenAI สาธารณะ, proxy ที่เข้ากันได้กับ OpenAI) จะคงรูปแบบคำขอภาพ
มาตรฐานของ OpenAI ไว้

<Note>
การ routing ของ Azure สำหรับเส้นทางการสร้างภาพของผู้ให้บริการ `openai` ต้องใช้
OpenClaw 2026.4.22 หรือใหม่กว่า เวอร์ชันก่อนหน้าจะปฏิบัติต่อ
`openai.baseUrl` แบบกำหนดเองเหมือน endpoint OpenAI สาธารณะ และจะล้มเหลวกับ
deployment ภาพของ Azure
</Note>

### เวอร์ชัน API

ตั้งค่า `AZURE_OPENAI_API_VERSION` เพื่อ pin เวอร์ชัน Azure preview หรือ GA ที่เฉพาะเจาะจง
สำหรับเส้นทางการสร้างภาพของ Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

ค่าเริ่มต้นคือ `2024-12-01-preview` เมื่อไม่ได้ตั้งค่าตัวแปร

### ชื่อโมเดลคือชื่อ deployment

Azure OpenAI ผูกโมเดลเข้ากับ deployment สำหรับคำขอสร้างภาพของ Azure
ที่ route ผ่านผู้ให้บริการ `openai` ที่รวมมา ฟิลด์ `model` ใน OpenClaw
ต้องเป็น **ชื่อ deployment ของ Azure** ที่คุณกำหนดค่าในพอร์ทัล Azure ไม่ใช่
id โมเดล OpenAI สาธารณะ

หากคุณสร้าง deployment ชื่อ `gpt-image-2-prod` ที่ให้บริการ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

กฎชื่อ deployment เดียวกันนี้ใช้กับการเรียกสร้างภาพที่ route ผ่าน
ผู้ให้บริการ `openai` ที่รวมมา

### ความพร้อมใช้งานตามภูมิภาค

ปัจจุบันการสร้างภาพของ Azure ใช้ได้เฉพาะในบางภูมิภาค
(เช่น `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`) ตรวจสอบรายชื่อภูมิภาคปัจจุบันของ Microsoft ก่อนสร้าง
deployment และยืนยันว่าโมเดลเฉพาะนั้นมีให้บริการในภูมิภาคของคุณ

### ความแตกต่างของพารามิเตอร์

Azure OpenAI และ OpenAI สาธารณะไม่ได้รับพารามิเตอร์ภาพชุดเดียวกันเสมอไป
Azure อาจปฏิเสธตัวเลือกที่ OpenAI สาธารณะอนุญาต (เช่น ค่า
`background` บางค่าบน `gpt-image-2`) หรือเปิดเผยเฉพาะบนเวอร์ชันโมเดลบางเวอร์ชัน
ความแตกต่างเหล่านี้มาจาก Azure และโมเดลพื้นฐาน ไม่ใช่
OpenClaw หากคำขอ Azure ล้มเหลวด้วยข้อผิดพลาด validation ให้ตรวจสอบ
ชุดพารามิเตอร์ที่ deployment และเวอร์ชัน API เฉพาะของคุณรองรับใน
พอร์ทัล Azure

<Note>
Azure OpenAI ใช้ทรานสปอร์ตแบบ native และพฤติกรรม compat แต่ไม่ได้รับ
ส่วนหัวแสดงที่มาแบบซ่อนของ OpenClaw — ดู accordion **เส้นทาง Native เทียบกับเส้นทางที่เข้ากันได้กับ OpenAI**
ใต้ [การกำหนดค่าขั้นสูง](#advanced-configuration)

สำหรับทราฟฟิกแชตหรือ Responses บน Azure (นอกเหนือจากการสร้างภาพ) ให้ใช้
โฟลว์ onboarding หรือ config ผู้ให้บริการ Azure โดยเฉพาะ — `openai.baseUrl` เพียงอย่างเดียว
จะไม่รับรูปแบบ API/auth ของ Azure มีผู้ให้บริการ
`azure-openai-responses/*` แยกต่างหาก โปรดดู
accordion Server-side compaction ด้านล่าง
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ทรานสปอร์ต (WebSocket เทียบกับ SSE)">
    OpenClaw ใช้ WebSocket เป็นหลัก พร้อม fallback เป็น SSE (`"auto"`) สำหรับ `openai/*`

    ในโหมด `"auto"` OpenClaw จะ:
    - ลองใหม่เมื่อ WebSocket ล้มเหลวตั้งแต่ต้นหนึ่งครั้ง ก่อน fallback เป็น SSE
    - หลังเกิดความล้มเหลว จะทำเครื่องหมาย WebSocket ว่า degraded ประมาณ 60 วินาที และใช้ SSE ระหว่างช่วง cool-down
    - แนบส่วนหัวตัวตนของเซสชันและเทิร์นที่เสถียรสำหรับการลองใหม่และการเชื่อมต่อใหม่
    - ทำให้ตัวนับการใช้งาน (`input_tokens` / `prompt_tokens`) เป็นรูปแบบเดียวกันระหว่างตัวแปรทรานสปอร์ต

    | ค่า | พฤติกรรม |
    |-------|----------|
    | `"auto"` (ค่าเริ่มต้น) | WebSocket ก่อน, fallback เป็น SSE |
    | `"sse"` | บังคับใช้ SSE เท่านั้น |
    | `"websocket"` | บังคับใช้ WebSocket เท่านั้น |

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
    OpenClaw เปิดเผย toggle โหมดเร็วที่ใช้ร่วมกันสำหรับ `openai/*`:

    - **แชต/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    เมื่อเปิดใช้งาน OpenClaw จะ map โหมดเร็วไปยังการประมวลผลแบบ priority ของ OpenAI (`service_tier = "priority"`) ค่า `service_tier` ที่มีอยู่จะถูกคงไว้ และโหมดเร็วจะไม่เขียน `reasoning` หรือ `text.verbosity` ใหม่

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
    การ override ของเซสชันมีสิทธิ์เหนือกว่า config การล้าง override ของเซสชันใน UI Sessions จะทำให้เซสชันกลับไปใช้ค่าเริ่มต้นที่กำหนดค่าไว้
    </Note>

  </Accordion>

  <Accordion title="การประมวลผลแบบ Priority (service_tier)">
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
    `serviceTier` จะถูกส่งต่อไปยัง endpoint ของ OpenAI แบบ native (`api.openai.com`) และ endpoint ของ Codex แบบ native (`chatgpt.com/backend-api`) เท่านั้น หากคุณ route ผู้ให้บริการใดผู้ให้บริการหนึ่งผ่าน proxy OpenClaw จะปล่อย `service_tier` ไว้ตามเดิม
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    สำหรับโมเดล OpenAI Responses โดยตรง (`openai/*` บน `api.openai.com`) stream wrapper ของ Pi-harness ใน Plugin OpenAI จะเปิดใช้ server-side compaction อัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ model compat จะตั้งค่า `supportsStore: false`)
    - inject `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - ค่าเริ่มต้น `compact_threshold`: 70% ของ `contextWindow` (หรือ `80000` เมื่อไม่มีข้อมูล)

    สิ่งนี้ใช้กับเส้นทาง Pi harness ในตัวและ hook ผู้ให้บริการ OpenAI ที่ใช้โดยการรันแบบฝัง app-server harness ของ Codex แบบ native จะจัดการบริบทของตัวเองผ่าน Codex และกำหนดค่าโดย route agent เริ่มต้นของ OpenAI หรือนโยบาย runtime ของผู้ให้บริการ/โมเดล

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
      <Tab title="threshold แบบกำหนดเอง">
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
    `responsesServerCompaction` ควบคุมเฉพาะการ inject `context_management` เท่านั้น โมเดล OpenAI Responses โดยตรงยังคงบังคับ `store: true` เว้นแต่ compat จะตั้งค่า `supportsStore: false`
    </Note>

  </Accordion>

  <Accordion title="โหมด GPT แบบ strict-agentic">
    สำหรับการรันตระกูล GPT-5 บน `openai/*` OpenClaw สามารถใช้สัญญาการดำเนินการแบบฝังที่เข้มงวดยิ่งขึ้น:

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
    - ไม่ถือว่าเทิร์นที่มีแผนอย่างเดียวเป็นความคืบหน้าที่สำเร็จอีกต่อไป เมื่อมีการกระทำของเครื่องมือพร้อมใช้งาน
    - ลองเทิร์นใหม่ด้วยการชี้นำให้ลงมือทำทันที
    - เปิดใช้ `update_plan` อัตโนมัติสำหรับงานที่มีสาระสำคัญ
    - แสดงสถานะถูกบล็อกอย่างชัดเจน หากโมเดลยังคงวางแผนโดยไม่ลงมือทำ

    <Note>
    จำกัดเฉพาะการรันตระกูล GPT-5 ของ OpenAI และ Codex เท่านั้น ผู้ให้บริการอื่นและตระกูลโมเดลเก่ากว่ายังคงใช้พฤติกรรมเริ่มต้น
    </Note>

  </Accordion>

  <Accordion title="เส้นทาง Native เทียบกับเส้นทางที่เข้ากันได้กับ OpenAI">
    OpenClaw ปฏิบัติต่อ endpoint ของ OpenAI, Codex และ Azure OpenAI โดยตรงแตกต่างจาก proxy `/v1` ที่เข้ากันได้กับ OpenAI ทั่วไป:

    **เส้นทาง Native** (`openai/*`, Azure OpenAI):
    - คง `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับ effort `none` ของ OpenAI
    - ละเว้น reasoning ที่ปิดใช้งานสำหรับโมเดลหรือ proxy ที่ปฏิเสธ `reasoning.effort: "none"`
    - ตั้ง schema ของเครื่องมือเป็นโหมด strict โดยค่าเริ่มต้น
    - แนบส่วนหัวแสดงที่มาแบบซ่อนเฉพาะบน host แบบ native ที่ตรวจสอบแล้ว
    - คงการ shaping คำขอเฉพาะ OpenAI (`service_tier`, `store`, reasoning-compat, prompt-cache hints)

    **เส้นทาง Proxy/compatible:**
    - ใช้พฤติกรรม compat ที่ผ่อนปรนกว่า
    - ตัด `store` ของ Completions ออกจาก payload `openai-completions` ที่ไม่ใช่ native
    - รับ JSON pass-through ขั้นสูง `params.extra_body`/`params.extraBody` สำหรับ proxy Completions ที่เข้ากันได้กับ OpenAI
    - รับ `params.chat_template_kwargs` สำหรับ proxy Completions ที่เข้ากันได้กับ OpenAI เช่น vLLM
    - ไม่บังคับ schema ของเครื่องมือแบบ strict หรือส่วนหัวเฉพาะ native

    Azure OpenAI ใช้ทรานสปอร์ตแบบ native และพฤติกรรม compat แต่ไม่ได้รับส่วนหัวแสดงที่มาแบบซ่อน

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
  <Card title="OAuth และ auth" href="/th/gateway/authentication" icon="key">
    รายละเอียด auth และกฎการนำ credential กลับมาใช้
  </Card>
</CardGroup>
