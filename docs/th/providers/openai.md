---
read_when:
    - คุณต้องการใช้โมเดล OpenAI ใน OpenClaw
    - คุณต้องการใช้การยืนยันตัวตนด้วยการสมัครสมาชิก Codex แทน API keys
    - คุณต้องการพฤติกรรมการดำเนินงานของเอเจนต์ GPT-5 ที่เข้มงวดยิ่งขึ้น
summary: ใช้ OpenAI ผ่านคีย์ API หรือการสมัครใช้งาน Codex ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-06-27T18:15:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f5346c6bb85341c4e1709e3023dee8b32a413189d5564778e9c919b7eaa78f1
    source_path: providers/openai.md
    workflow: 16
---

OpenAI มี API สำหรับนักพัฒนาสำหรับโมเดล GPT และ Codex ยังพร้อมใช้งานเป็น
เอเจนต์เขียนโค้ดในแผน ChatGPT ผ่านไคลเอนต์ Codex ของ OpenAI ด้วย OpenClaw ใช้
provider id เดียวคือ `openai` สำหรับรูปแบบการยืนยันตัวตนทั้งสองแบบ

OpenClaw ใช้ `openai/*` เป็นเส้นทางโมเดล OpenAI ตามมาตรฐาน เทิร์นของเอเจนต์แบบฝัง
บนโมเดล OpenAI จะรันผ่านรันไทม์ app-server ของ Codex แบบเนทีฟโดย
ค่าเริ่มต้น; การยืนยันตัวตนด้วยคีย์ OpenAI API โดยตรงยังพร้อมใช้งานสำหรับพื้นผิว OpenAI
ที่ไม่ใช่เอเจนต์ เช่น รูปภาพ, embeddings, เสียงพูด และ realtime

- **โมเดลเอเจนต์** - โมเดล `openai/*` ผ่านรันไทม์ Codex; ลงชื่อเข้าใช้ด้วย
  การยืนยันตัวตน Codex สำหรับการใช้งานด้วยการสมัครสมาชิก ChatGPT/Codex หรือกำหนดค่าโปรไฟล์สำรอง
  คีย์ OpenAI API ที่เข้ากันได้กับ Codex เมื่อคุณตั้งใจต้องการการยืนยันตัวตนด้วยคีย์ API
- **API ของ OpenAI ที่ไม่ใช่เอเจนต์** - การเข้าถึง OpenAI Platform โดยตรงพร้อมการคิดค่าบริการตามการใช้งาน
  ผ่าน `OPENAI_API_KEY` หรือการเริ่มต้นใช้งานด้วยคีย์ OpenAI API
- **คอนฟิกเดิม** - refs โมเดล Codex เดิมจะได้รับการซ่อมแซมโดย
  `openclaw doctor --fix` เป็น `openai/*` พร้อมรันไทม์ Codex

OpenAI รองรับการใช้งาน OAuth แบบสมัครสมาชิกในเครื่องมือและเวิร์กโฟลว์ภายนอกอย่าง OpenClaw อย่างชัดเจน

ผู้ให้บริการ โมเดล รันไทม์ และช่องทางเป็นเลเยอร์แยกกัน หากป้ายกำกับเหล่านี้
เริ่มปนกัน ให้อ่าน [รันไทม์เอเจนต์](/th/concepts/agent-runtimes) ก่อน
เปลี่ยนคอนฟิก

## ตัวเลือกด่วน

| เป้าหมาย                                                 | ใช้                                                      | หมายเหตุ                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| การสมัครสมาชิก ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-5.5`                                         | การตั้งค่าเอเจนต์ OpenAI เริ่มต้น ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน Codex                  |
| การคิดค่าบริการด้วยคีย์ API โดยตรงสำหรับโมเดลเอเจนต์              | `openai/gpt-5.5` พร้อมโปรไฟล์คีย์ API ที่เข้ากันได้กับ Codex | ใช้ `auth.order.openai` เพื่อวางโปรไฟล์สำรองไว้หลังการยืนยันตัวตนแบบสมัครสมาชิก  |
| การคิดค่าบริการด้วยคีย์ API โดยตรงผ่าน OpenClaw อย่างชัดเจน     | `openai/gpt-5.5` พร้อมรันไทม์ provider/model `openclaw`  | เลือกโปรไฟล์คีย์ API `openai` ปกติ                             |
| นามแฝง API ล่าสุดของ ChatGPT Instant                     | `openai/chat-latest`                                     | ใช้คีย์ API โดยตรงเท่านั้น นามแฝงเคลื่อนที่สำหรับการทดลอง ไม่ใช่ค่าเริ่มต้น   |
| การยืนยันตัวตนแบบสมัครสมาชิก ChatGPT/Codex ผ่าน OpenClaw     | `openai/gpt-5.5` พร้อมรันไทม์ provider/model `openclaw`  | เลือกโปรไฟล์ OAuth `openai` สำหรับเส้นทางความเข้ากันได้         |
| การสร้างหรือแก้ไขรูปภาพ                          | `openai/gpt-image-2`                                     | ใช้งานได้กับทั้ง `OPENAI_API_KEY` หรือ OpenAI Codex OAuth             |
| รูปภาพพื้นหลังโปร่งใส                        | `openai/gpt-image-1.5`                                   | ใช้ `outputFormat=png` หรือ `webp` และ `openai.background=transparent` |

## แผนที่ชื่อ

ชื่อคล้ายกันแต่ใช้แทนกันไม่ได้:

| ชื่อที่คุณเห็น                            | เลเยอร์             | ความหมาย                                                                                           |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | คำนำหน้าผู้ให้บริการ   | เส้นทางโมเดล OpenAI ตามมาตรฐาน; เทิร์นของเอเจนต์ใช้รันไทม์ Codex                                  |
| คำนำหน้า OpenAI Codex เดิม              | คำนำหน้าเดิม     | เนมสเปซโมเดล/โปรไฟล์แบบเก่า `openclaw doctor --fix` ย้ายไปเป็น `openai`                   |
| Plugin `codex`                          | Plugin            | Plugin ที่มาพร้อม OpenClaw ซึ่งให้รันไทม์ app-server ของ Codex แบบเนทีฟและตัวควบคุมแชท `/codex` |
| provider/model `agentRuntime.id: codex` | รันไทม์เอเจนต์     | บังคับใช้ฮาร์เนส app-server ของ Codex แบบเนทีฟสำหรับเทิร์นแบบฝังที่ตรงกัน                            |
| `/codex ...`                            | ชุดคำสั่งแชท  | ผูก/ควบคุมเธรด app-server ของ Codex จากการสนทนา                                        |
| `runtime: "acp", agentId: "codex"`      | เส้นทางเซสชัน ACP | เส้นทางสำรองแบบชัดเจนที่รัน Codex ผ่าน ACP/acpx                                          |

หมายความว่าคอนฟิกสามารถตั้งใจมี refs โมเดล `openai/*` ขณะที่โปรไฟล์การยืนยันตัวตน
ชี้ไปยังข้อมูลประจำตัวแบบคีย์ API หรือ ChatGPT/Codex OAuth ก็ได้ ใช้
`auth.order.openai` สำหรับคอนฟิก; `openclaw doctor --fix` เขียน refs โมเดล
Codex เดิม, ids โปรไฟล์การยืนยันตัวตน Codex เดิม และ
ลำดับการยืนยันตัวตน Codex เดิมใหม่เป็นเส้นทาง OpenAI ตามมาตรฐาน

<Note>
GPT-5.5 พร้อมใช้งานผ่านทั้งการเข้าถึงด้วยคีย์ API ของ OpenAI Platform โดยตรงและ
เส้นทาง subscription/OAuth สำหรับการสมัครสมาชิก ChatGPT/Codex พร้อมการรันด้วย Codex
แบบเนทีฟ ให้ใช้ `openai/gpt-5.5`; การไม่ตั้งค่าคอนฟิกรันไทม์ตอนนี้จะเลือกฮาร์เนส Codex
สำหรับเทิร์นเอเจนต์ OpenAI ใช้โปรไฟล์คีย์ OpenAI API เฉพาะเมื่อคุณต้องการ
การยืนยันตัวตนด้วยคีย์ API โดยตรงสำหรับโมเดลเอเจนต์ OpenAI
</Note>

<Note>
เทิร์นโมเดลเอเจนต์ OpenAI ต้องใช้ Plugin app-server ของ Codex ที่มาพร้อมระบบ คอนฟิกรันไทม์
OpenClaw แบบชัดเจนยังพร้อมใช้งานเป็นเส้นทางความเข้ากันได้แบบเลือกใช้ เมื่อ OpenClaw ถูก
เลือกอย่างชัดเจนด้วยโปรไฟล์ OAuth `openai` OpenClaw จะคง
ref โมเดลสาธารณะเป็น `openai/*` และกำหนดเส้นทางภายในผ่านทรานสปอร์ต
การยืนยันตัวตน Codex รัน `openclaw doctor --fix` เพื่อซ่อมแซม refs โมเดล
Codex เดิม, `codex-cli/*` หรือการปักหมุดเซสชันรันไทม์เก่าที่ไม่ได้มาจาก
คอนฟิกรันไทม์แบบชัดเจน
</Note>

## ความครอบคลุมฟีเจอร์ของ OpenClaw

| ความสามารถของ OpenAI         | พื้นผิว OpenClaw                                                                              | สถานะ                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| แชท / Responses          | ผู้ให้บริการโมเดล `openai/<model>`                                                               | ใช่                                                                    |
| โมเดลการสมัครสมาชิก Codex | `openai/<model>` พร้อม OpenAI OAuth                                                            | ใช่                                                                    |
| refs โมเดล Codex เดิม   | refs โมเดล Codex เดิม หรือ `codex-cli/<model>`                                                | ซ่อมแซมโดย doctor เป็น `openai/<model>`                                 |
| ฮาร์เนส app-server ของ Codex  | `openai/<model>` โดยละรันไทม์ไว้ หรือ provider/model `agentRuntime.id: codex`              | ใช่                                                                    |
| การค้นหาเว็บฝั่งเซิร์ฟเวอร์    | เครื่องมือ OpenAI Responses แบบเนทีฟ                                                                  | ใช่ เมื่อเปิดใช้การค้นหาเว็บและไม่ได้ปักผู้ให้บริการไว้                 |
| รูปภาพ                    | `image_generate`                                                                              | ใช่                                                                    |
| วิดีโอ                    | `video_generate`                                                                              | ใช่                                                                    |
| ข้อความเป็นเสียงพูด            | `messages.tts.provider: "openai"` / `tts`                                                     | ใช่                                                                    |
| ชุดงานเสียงพูดเป็นข้อความ      | `tools.media.audio` / การทำความเข้าใจสื่อ                                                     | ใช่                                                                    |
| เสียงพูดเป็นข้อความแบบสตรีม  | Voice Call `streaming.provider: "openai"`                                                     | ใช่                                                                    |
| เสียง realtime            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | ใช่ (ต้องใช้เครดิต OpenAI Platform ไม่ใช่การสมัครสมาชิก Codex/ChatGPT) |
| Embeddings                | ผู้ให้บริการ embedding หน่วยความจำ                                                                     | ใช่                                                                    |

<Note>
  เสียง OpenAI Realtime (ที่ใช้โดย `realtime.provider: "openai"` ของ Voice Call และ
  Control UI Talk พร้อม `talk.realtime.provider: "openai"`) จะผ่าน
  **OpenAI Platform Realtime API** สาธารณะ ซึ่งคิดค่าบริการจากเครดิต OpenAI
  Platform ไม่ใช่โควตาการสมัครสมาชิก Codex/ChatGPT บัญชี
  ที่มี OpenAI OAuth สมบูรณ์และรันโมเดลแชทที่หนุนด้วย Codex ได้โดยไม่มีปัญหา
  ยังต้องมีโปรไฟล์การยืนยันตัวตนคีย์ OpenAI API หรือคีย์ Platform API ที่มีการเติมเงิน
  สำหรับการคิดค่าบริการ Platform เพื่อใช้เสียง Realtime

วิธีแก้ไข: เติมเครดิต Platform ที่
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
สำหรับองค์กรที่หนุนข้อมูลประจำตัว realtime ของคุณ เสียง Realtime ยอมรับ
โปรไฟล์การยืนยันตัวตนคีย์ API `openai` ที่สร้างโดย `openclaw onboard --auth-choice openai-api-key`,
Platform `OPENAI_API_KEY` ที่กำหนดค่าผ่าน `talk.realtime.providers.openai.apiKey`
สำหรับ Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
สำหรับ Voice Call หรือ environment variable `OPENAI_API_KEY` โปรไฟล์ OpenAI OAuth
ยังสามารถรันโมเดลแชท `openai/*` ที่หนุนด้วย Codex ในการติดตั้ง
OpenClaw เดียวกันได้ แต่จะไม่กำหนดค่าเสียง Realtime
</Note>

## Embeddings หน่วยความจำ

OpenClaw สามารถใช้ OpenAI หรือปลายทาง embedding ที่เข้ากันได้กับ OpenAI สำหรับ
การทำดัชนี `memory_search` และ embeddings คำค้น:

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
ค่าเหล่านั้นเป็นฟิลด์คำขอ `input_type` เฉพาะผู้ให้บริการ: embeddings ของคำค้นใช้
`queryInputType`; ชิ้นส่วนหน่วยความจำที่ทำดัชนีและการทำดัชนีแบบชุดใช้
`documentInputType` ดูตัวอย่างเต็มใน [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config#provider-specific-config)

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการและทำตามขั้นตอนการตั้งค่า

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

    | Ref โมเดล              | คอนฟิกรันไทม์             | เส้นทาง                       | การยืนยันตัวตน             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | ละไว้ / provider/model `agentRuntime.id: "codex"` | ฮาร์เนส app-server ของ Codex | โปรไฟล์ OpenAI ที่เข้ากันได้กับ Codex |
    | `openai/gpt-5.4-mini` | ละไว้ / provider/model `agentRuntime.id: "codex"` | ฮาร์เนส app-server ของ Codex | โปรไฟล์ OpenAI ที่เข้ากันได้กับ Codex |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | รันไทม์แบบฝังของ OpenClaw      | โปรไฟล์ `openai` ที่เลือก |

    <Note>
    โมเดลเอเจนต์ `openai/*` ใช้ harness แอปเซิร์ฟเวอร์ของ Codex หากต้องการใช้การตรวจสอบสิทธิ์
    ด้วยคีย์ API สำหรับโมเดลเอเจนต์ ให้สร้างโปรไฟล์คีย์ API ที่เข้ากันได้กับ Codex และจัดลำดับ
    ด้วย `auth.order.openai`; `OPENAI_API_KEY` ยังคงเป็น fallback โดยตรงสำหรับพื้นผิว API ของ OpenAI
    ที่ไม่ใช่เอเจนต์ เรียกใช้ `openclaw doctor --fix` เพื่อย้ายรายการลำดับการตรวจสอบสิทธิ์ Codex
    รุ่นเก่า
    </Note>

    ### ตัวอย่างการตั้งค่า

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

    `chat-latest` เป็น alias ที่เปลี่ยนตามเวลา OpenAI ระบุว่าเป็นโมเดล Instant ล่าสุด
    ที่ใช้ใน ChatGPT และแนะนำ `gpt-5.5` สำหรับการใช้งาน API ในโปรดักชัน ดังนั้น
    ให้คง `openai/gpt-5.5` เป็นค่าเริ่มต้นที่เสถียร เว้นแต่คุณต้องการพฤติกรรมของ
    alias นั้นอย่างชัดเจน ปัจจุบัน alias นี้ยอมรับเฉพาะความละเอียดข้อความระดับ `medium`
    ดังนั้น OpenClaw จะปรับ override ความละเอียดข้อความของ OpenAI ที่ไม่เข้ากันให้เป็นปกติ
    สำหรับโมเดลนี้

    <Warning>
    OpenClaw **ไม่** เปิดเผย `gpt-5.3-codex-spark` บนเส้นทางคีย์ API ของ OpenAI โดยตรง โมเดลนี้ใช้ได้เฉพาะผ่านรายการแค็ตตาล็อกการสมัครสมาชิก Codex เมื่อบัญชีที่ลงชื่อเข้าใช้ของคุณเปิดเผยโมเดลนั้น
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **เหมาะที่สุดสำหรับ:** การใช้การสมัครสมาชิก ChatGPT/Codex ของคุณกับการประมวลผลแบบเนทีฟผ่านแอปเซิร์ฟเวอร์ Codex แทนคีย์ API แยกต่างหาก Codex cloud ต้องลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        หรือเรียกใช้ OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai
        ```

        สำหรับการตั้งค่าแบบไม่มีหน้าจอหรือที่ไม่รองรับ callback ให้เพิ่ม `--device-code` เพื่อลงชื่อเข้าใช้ด้วย flow device-code ของ ChatGPT แทน callback เบราว์เซอร์ localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        ไม่จำเป็นต้องมีการตั้งค่า runtime สำหรับเส้นทางเริ่มต้น เทิร์นเอเจนต์ OpenAI
        จะเลือก runtime แอปเซิร์ฟเวอร์ Codex แบบเนทีฟโดยอัตโนมัติ และ OpenClaw
        จะติดตั้งหรือซ่อมแซม Plugin Codex ที่รวมมาให้เมื่อเลือกเส้นทางนี้
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai
        ```

        หลังจาก Gateway กำลังทำงาน ให้ส่ง `/codex status` หรือ `/codex models`
        ในแชตเพื่อตรวจสอบ runtime แอปเซิร์ฟเวอร์แบบเนทีฟ
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | การอ้างอิงโมเดล | การตั้งค่า runtime | เส้นทาง | การตรวจสอบสิทธิ์ |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | ละไว้ / provider/model `agentRuntime.id: "codex"` | harness แอปเซิร์ฟเวอร์ Codex แบบเนทีฟ | การลงชื่อเข้าใช้ Codex หรือโปรไฟล์การตรวจสอบสิทธิ์ `openai` ที่จัดลำดับไว้ |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | runtime แบบฝังของ OpenClaw พร้อม transport การตรวจสอบสิทธิ์ Codex ภายใน | โปรไฟล์ OAuth `openai` ที่เลือก |
    | การอ้างอิง Codex GPT-5.5 รุ่นเก่า | ซ่อมแซมโดย doctor | เส้นทางรุ่นเก่าที่เขียนใหม่เป็น `openai/gpt-5.5` | โปรไฟล์ OAuth ของ OpenAI ที่ย้ายแล้ว |
    | `codex-cli/gpt-5.5` | ซ่อมแซมโดย doctor | เส้นทาง CLI รุ่นเก่าที่เขียนใหม่เป็น `openai/gpt-5.5` | การตรวจสอบสิทธิ์แอปเซิร์ฟเวอร์ Codex |

    <Warning>
    ควรใช้ `openai/gpt-5.5` สำหรับการตั้งค่าเอเจนต์ใหม่ที่รองรับด้วยการสมัครสมาชิก
    การอ้างอิง Codex GPT รุ่นเก่าเป็นเส้นทาง OpenClaw รุ่นเก่า ไม่ใช่เส้นทาง runtime Codex
    แบบเนทีฟ เรียกใช้ `openclaw doctor --fix` เมื่อต้องการย้ายไปยังการอ้างอิง `openai/*`
    แบบมาตรฐาน `gpt-5.3-codex-spark` ยังคงจำกัดเฉพาะบัญชีที่แค็ตตาล็อกการสมัครสมาชิก
    Codex ประกาศโมเดลนั้นไว้ ส่วนการอ้างอิงคีย์ API ของ OpenAI โดยตรงและ Azure
    สำหรับโมเดลนี้ยังคงถูกซ่อนไว้
    </Warning>

    <Note>
    prefix โมเดล Codex รุ่นเก่าเป็นการตั้งค่ารุ่นเก่าที่ doctor ซ่อมแซม สำหรับ
    การตั้งค่าทั่วไปที่ใช้การสมัครสมาชิกพร้อม runtime แบบเนทีฟ ให้ลงชื่อเข้าใช้ด้วยการตรวจสอบสิทธิ์ Codex
    แต่คงการอ้างอิงโมเดลเป็น `openai/gpt-5.5` การตั้งค่าใหม่ควรวางลำดับการตรวจสอบสิทธิ์
    เอเจนต์ OpenAI ไว้ใต้ `auth.order.openai`; doctor จะย้ายรายการลำดับการตรวจสอบสิทธิ์ Codex
    รุ่นเก่า
    </Note>

    ### ตัวอย่างการตั้งค่า

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

    เมื่อมีคีย์ API สำรอง ให้คงโมเดลไว้บน `openai/gpt-5.5` และวางลำดับ
    การตรวจสอบสิทธิ์ไว้ใต้ `openai` OpenClaw จะลองใช้การสมัครสมาชิกก่อน จากนั้นจึงใช้
    คีย์ API โดยยังคงอยู่บน harness ของ Codex:

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
    Onboarding จะไม่นำเข้าข้อมูล OAuth จาก `~/.codex` อีกต่อไป ให้ลงชื่อเข้าใช้ด้วย OAuth ผ่านเบราว์เซอร์ (ค่าเริ่มต้น) หรือ flow device-code ด้านบน — OpenClaw จัดการข้อมูลรับรองที่ได้ในที่เก็บการตรวจสอบสิทธิ์เอเจนต์ของตนเอง
    </Note>

    ### ตรวจสอบและกู้คืนการกำหนดเส้นทาง OAuth ของ Codex

    ใช้คำสั่งเหล่านี้เพื่อดูว่าเอเจนต์เริ่มต้นของคุณกำลังใช้โมเดล runtime และเส้นทาง
    การตรวจสอบสิทธิ์ใด:

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

    หากการตั้งค่าเก่ายังคงมีการอ้างอิง Codex GPT รุ่นเก่า หรือมีการปัก runtime session ของ OpenAI
    ที่ค้างอยู่โดยไม่มีการตั้งค่า runtime อย่างชัดเจน ให้ซ่อมแซม:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    หาก `models auth list --provider openai` แสดงว่าไม่มีโปรไฟล์ที่ใช้ได้ ให้ลงชื่อเข้าใช้
    อีกครั้ง:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    ใช้ `--profile-id` เมื่อต้องการมีการเข้าสู่ระบบ OAuth ของ Codex หลายรายการในเอเจนต์เดียวกัน
    และต้องการควบคุมภายหลังผ่านการจัดลำดับการตรวจสอบสิทธิ์หรือ `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` คือเส้นทางโมเดลสำหรับเทิร์นเอเจนต์ OpenAI ผ่าน Codex เรียกใช้
    `openclaw doctor --fix` เพื่อย้าย id โปรไฟล์ prefix OpenAI Codex รุ่นเก่าและ
    รายการลำดับก่อนพึ่งพาการจัดลำดับโปรไฟล์

    ### ตัวบ่งชี้สถานะ

    แชต `/status` แสดงว่า runtime โมเดลใดกำลังใช้งานสำหรับเซสชันปัจจุบัน
    harness แอปเซิร์ฟเวอร์ Codex ที่รวมมาให้จะแสดงเป็น `Runtime: OpenAI Codex` สำหรับ
    เทิร์นโมเดลเอเจนต์ OpenAI การปัก runtime session ของ OpenAI ที่ค้างอยู่จะถูกซ่อมแซมเป็น Codex เว้นแต่
    การตั้งค่าจะปัก OpenClaw ไว้อย่างชัดเจน

    ### คำเตือนจาก doctor

    หากการอ้างอิงโมเดล Codex รุ่นเก่าหรือการปัก runtime ของ OpenAI ที่ค้างอยู่ยังคงอยู่ใน config หรือ
    สถานะเซสชัน `openclaw doctor --fix` จะเขียนใหม่เป็น `openai/*` พร้อม
    runtime Codex เว้นแต่จะตั้งค่า OpenClaw ไว้อย่างชัดเจน

    ### เพดานหน้าต่างบริบท

    OpenClaw ถือว่า metadata ของโมเดลและเพดานบริบท runtime เป็นค่าคนละค่า

    สำหรับ `openai/gpt-5.5` ผ่านแค็ตตาล็อก OAuth ของ Codex:

    - `contextWindow` แบบเนทีฟ: `1000000`
    - เพดาน runtime `contextTokens` เริ่มต้น: `272000`

    เพดานเริ่มต้นที่เล็กกว่ามีลักษณะด้าน latency และคุณภาพที่ดีกว่าในการใช้งานจริง override ได้ด้วย `contextTokens`:

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
    ใช้ `contextWindow` เพื่อประกาศ metadata โมเดลแบบเนทีฟ ใช้ `contextTokens` เพื่อจำกัดงบประมาณบริบท runtime
    </Note>

    ### การกู้คืนแค็ตตาล็อก

    OpenClaw ใช้ metadata แค็ตตาล็อก Codex ต้นทางสำหรับ `gpt-5.5` เมื่อมีอยู่
    หากการค้นพบ Codex แบบสดละเว้นแถว `gpt-5.5` ในขณะที่
    บัญชีผ่านการตรวจสอบสิทธิ์แล้ว OpenClaw จะสังเคราะห์แถวโมเดล OAuth นั้นเพื่อให้
    การรัน cron, sub-agent และโมเดลเริ่มต้นที่ตั้งค่าไว้ไม่ล้มเหลวด้วย
    `Unknown model`

  </Tab>
</Tabs>

## การตรวจสอบสิทธิ์แอปเซิร์ฟเวอร์ Codex แบบเนทีฟ

harness แอปเซิร์ฟเวอร์ Codex แบบเนทีฟใช้การอ้างอิงโมเดล `openai/*` พร้อม
การตั้งค่า runtime ที่ละไว้ หรือ provider/model `agentRuntime.id: "codex"` แต่การตรวจสอบสิทธิ์ยังคง
อิงตามบัญชี OpenClaw เลือกการตรวจสอบสิทธิ์ตามลำดับนี้:

1. โปรไฟล์การตรวจสอบสิทธิ์ OpenAI ที่จัดลำดับไว้สำหรับเอเจนต์ ควรอยู่ใต้
   `auth.order.openai` เรียกใช้ `openclaw doctor --fix` เพื่อย้าย id โปรไฟล์การตรวจสอบสิทธิ์ Codex
   รุ่นเก่าและลำดับการตรวจสอบสิทธิ์ Codex รุ่นเก่า
2. บัญชีที่มีอยู่ของแอปเซิร์ฟเวอร์ เช่น การลงชื่อเข้าใช้ ChatGPT ผ่าน Codex CLI ในเครื่อง
3. สำหรับการเปิดใช้แอปเซิร์ฟเวอร์ผ่าน local stdio เท่านั้น ให้ใช้ `CODEX_API_KEY` แล้วจึง
   `OPENAI_API_KEY` เมื่อแอปเซิร์ฟเวอร์รายงานว่าไม่มีบัญชีและยังคงต้องการ
   การตรวจสอบสิทธิ์ OpenAI

นั่นหมายความว่าการลงชื่อเข้าใช้การสมัครสมาชิก ChatGPT/Codex ในเครื่องจะไม่ถูกแทนที่เพียง
เพราะ process ของ Gateway มี `OPENAI_API_KEY` สำหรับโมเดล OpenAI โดยตรง
หรือ embeddings ด้วย fallback คีย์ API จาก env เป็นเฉพาะเส้นทาง local stdio ที่ไม่มีบัญชีเท่านั้น
และจะไม่ถูกส่งไปยังการเชื่อมต่อแอปเซิร์ฟเวอร์ WebSocket เมื่อเลือกโปรไฟล์ Codex
แบบสมัครสมาชิก OpenClaw จะกัน `CODEX_API_KEY` และ `OPENAI_API_KEY`
ออกจาก child แอปเซิร์ฟเวอร์ stdio ที่ spawn ขึ้นด้วย และส่งข้อมูลรับรองที่เลือก
ผ่าน RPC login ของแอปเซิร์ฟเวอร์ เมื่อโปรไฟล์สมัครสมาชิกนั้นถูกบล็อกด้วย
ขีดจำกัดการใช้งาน Codex OpenClaw สามารถหมุนไปยังโปรไฟล์คีย์ API `openai:*`
รายการถัดไปที่จัดลำดับไว้ได้โดยไม่เปลี่ยนโมเดลที่เลือกหรือออกจาก harness
ของ Codex เมื่อเวลาริเซ็ตการสมัครสมาชิกผ่านไป โปรไฟล์สมัครสมาชิกจะมีสิทธิ์ใช้งานอีกครั้ง

## การสร้างรูปภาพ

Plugin `openai` ที่รวมมาให้ลงทะเบียนการสร้างรูปภาพผ่านเครื่องมือ `image_generate`
รองรับทั้งการสร้างรูปภาพด้วยคีย์ API ของ OpenAI และการสร้างรูปภาพด้วย OAuth ของ Codex
ผ่านการอ้างอิงโมเดล `openai/gpt-image-2` เดียวกัน

| ความสามารถ                | คีย์ API ของ OpenAI                     | OAuth ของ Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| การอ้างอิงโมเดล                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| การตรวจสอบสิทธิ์                      | `OPENAI_API_KEY`                   | การลงชื่อเข้าใช้ OAuth ของ OpenAI Codex           |
| Transport                 | OpenAI Images API                  | backend ของ Codex Responses              |
| จำนวนรูปภาพสูงสุดต่อคำขอ    | 4                                  | 4                                    |
| โหมดแก้ไข                 | เปิดใช้ (สูงสุด 5 รูปภาพอ้างอิง) | เปิดใช้ (สูงสุด 5 รูปภาพอ้างอิง)   |
| การ override ขนาด            | รองรับ รวมถึงขนาด 2K/4K   | รองรับ รวมถึงขนาด 2K/4K     |
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
แก้ไขรูปภาพ `gpt-image-1.5`, `gpt-image-1` และ `gpt-image-1-mini` ยังคงใช้งานได้เป็น
override โมเดลอย่างชัดเจน ใช้ `openai/gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP
พื้นหลังโปร่งใส; API `gpt-image-2` ปัจจุบันปฏิเสธ
`background: "transparent"`.

สำหรับคำขอพื้นหลังโปร่งใส agent ควรเรียก `image_generate` ด้วย
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` หรือ `"webp"` และ
`background: "transparent"`; ตัวเลือก provider แบบเก่า `openai.background`
ยังคงยอมรับได้ OpenClaw ยังปกป้องเส้นทาง OAuth สาธารณะของ OpenAI และ
OpenAI Codex โดยเขียนคำขอพื้นหลังโปร่งใสเริ่มต้น `openai/gpt-image-2` ใหม่
เป็น `gpt-image-1.5`; Azure และปลายทางที่เข้ากันได้กับ OpenAI แบบกำหนดเองจะคง
ชื่อ deployment/model ที่กำหนดค่าไว้

การตั้งค่าเดียวกันนี้เปิดให้ใช้สำหรับการรัน CLI แบบไม่มีหน้าจอด้วย:

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
ใช้ `--quality low|medium|high|auto` เมื่อคุณต้องควบคุมคุณภาพและค่าใช้จ่ายของ OpenAI Images
ใช้ `--openai-moderation low|auto` เพื่อส่งคำแนะนำการกลั่นกรองเฉพาะ provider ของ OpenAI
จาก `image generate` หรือ `image edit`

สำหรับการติดตั้ง ChatGPT/Codex OAuth ให้คง ref `openai/gpt-image-2` เดิมไว้ เมื่อมีการกำหนดค่า
โปรไฟล์ OAuth ของ `openai` OpenClaw จะ resolve access token ของ OAuth ที่จัดเก็บไว้
และส่งคำขอภาพผ่าน backend Codex Responses โดยจะไม่ลองใช้ `OPENAI_API_KEY` ก่อน
หรือ fallback แบบเงียบไปยัง API key สำหรับคำขอนั้น กำหนดค่า `models.providers.openai`
อย่างชัดเจนด้วย API key, base URL แบบกำหนดเอง หรือปลายทาง Azure เมื่อคุณต้องการใช้เส้นทาง
OpenAI Images API โดยตรงแทน
หากปลายทางภาพแบบกำหนดเองนั้นอยู่บนที่อยู่ LAN/private ที่เชื่อถือได้ ให้ตั้งค่า
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ด้วย; OpenClaw จะยังคงบล็อก
ปลายทางภาพที่เข้ากันได้กับ OpenAI แบบ private/internal เว้นแต่จะมีการ opt-in นี้

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

| ความสามารถ | ค่า |
| ---------------- | --------------------------------------------------------------------------------- |
| โมเดลเริ่มต้น | `openai/sora-2` |
| โหมด | ข้อความเป็นวิดีโอ, ภาพเป็นวิดีโอ, การแก้ไขวิดีโอเดี่ยว |
| อินพุตอ้างอิง | รูปภาพ 1 ภาพหรือวิดีโอ 1 รายการ |
| การ override ขนาด | รองรับสำหรับข้อความเป็นวิดีโอและภาพเป็นวิดีโอ |
| การ override อื่น ๆ | `aspectRatio`, `resolution`, `audio`, `watermark` จะถูกละเว้นพร้อมคำเตือนจากเครื่องมือ |

คำขอภาพเป็นวิดีโอของ OpenAI ใช้ `POST /v1/videos` พร้อมภาพ
`input_reference` การแก้ไขวิดีโอเดี่ยวใช้ `POST /v1/videos/edits` พร้อม
วิดีโอที่อัปโหลดในฟิลด์ `video`

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

OpenClaw เพิ่มการเพิ่ม prompt ร่วมสำหรับการรันตระกูล GPT-5 บนพื้นผิว prompt ที่ OpenClaw ประกอบขึ้น โดยใช้ตาม model id ดังนั้นเส้นทาง OpenClaw/provider เช่น ref ก่อนซ่อมแซมแบบ legacy (ref GPT-5.5 ของ Codex แบบ legacy), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` และ ref GPT-5 อื่น ๆ ที่เข้ากันได้จะได้รับ overlay เดียวกัน โมเดล GPT-4.x ที่เก่ากว่าจะไม่ได้รับ

harness Codex แบบ native ที่รวมมาให้จะไม่ได้รับ overlay GPT-5 ของ OpenClaw นี้ผ่านคำสั่ง developer ของ Codex app-server Codex แบบ native จะคงพฤติกรรม base, model และ project-doc ที่ Codex เป็นเจ้าของไว้ ขณะที่ OpenClaw ปิด personality ในตัวของ Codex สำหรับ thread แบบ native เพื่อให้ไฟล์ personality ของ workspace agent ยังคงเป็นแหล่งอ้างอิงหลัก OpenClaw เพิ่มเฉพาะบริบท runtime เช่น การส่งผ่านช่องทาง เครื่องมือแบบไดนามิกของ OpenClaw การ delegate ผ่าน ACP บริบท workspace และ OpenClaw Skills

การเพิ่ม GPT-5 เพิ่มสัญญาพฤติกรรมแบบติดแท็กสำหรับการคงอยู่ของ persona ความปลอดภัยในการดำเนินการ วินัยการใช้เครื่องมือ รูปร่างเอาต์พุต การตรวจสอบความเสร็จสิ้น และการยืนยันบน prompt ที่ OpenClaw ประกอบขึ้นซึ่งตรงกัน พฤติกรรมการตอบกลับเฉพาะช่องทางและข้อความเงียบยังอยู่ใน system prompt ร่วมของ OpenClaw และนโยบายการส่งออก เลเยอร์รูปแบบการโต้ตอบที่เป็นมิตรจะแยกต่างหากและกำหนดค่าได้

| ค่า | ผล |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้เลเยอร์รูปแบบการโต้ตอบที่เป็นมิตร |
| `"on"` | Alias สำหรับ `"friendly"` |
| `"off"` | ปิดเฉพาะเลเยอร์รูปแบบที่เป็นมิตร |

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
ค่าจะไม่แยกตัวพิมพ์เล็กใหญ่ที่ runtime ดังนั้น `"Off"` และ `"off"` ต่างก็ปิดเลเยอร์รูปแบบที่เป็นมิตร
</Tip>

<Note>
`plugins.entries.openai.config.personality` แบบ legacy ยังคงถูกอ่านเป็น compatibility fallback เมื่อยังไม่ได้ตั้งค่าการตั้งค่าร่วม `agents.defaults.promptOverlays.gpt5.personality`
</Note>

## เสียงและคำพูด

<AccordionGroup>
  <Accordion title="การสังเคราะห์เสียงพูด (TTS)">
    Plugin `openai` ที่รวมมาให้ลงทะเบียนการสังเคราะห์เสียงพูดสำหรับพื้นผิว `messages.tts`

    | การตั้งค่า | พาธ config | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | เสียง | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | ความเร็ว | `messages.tts.providers.openai.speed` | (ไม่ได้ตั้งค่า) |
    | คำสั่ง | `messages.tts.providers.openai.instructions` | (ไม่ได้ตั้งค่า, เฉพาะ `gpt-4o-mini-tts`) |
    | รูปแบบ | `messages.tts.providers.openai.responseFormat` | `opus` สำหรับโน้ตเสียง, `mp3` สำหรับไฟล์ |
    | API key | `messages.tts.providers.openai.apiKey` | Fallback ไปยัง `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | body เพิ่มเติม | `messages.tts.providers.openai.extraBody` / `extra_body` | (ไม่ได้ตั้งค่า) |

    โมเดลที่พร้อมใช้งาน: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd` เสียงที่พร้อมใช้งาน: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`

    `extraBody` จะถูก merge เข้าใน JSON คำขอ `/audio/speech` หลังฟิลด์ที่ OpenClaw สร้างขึ้น ดังนั้นให้ใช้สำหรับปลายทางที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้คีย์เพิ่มเติม เช่น `lang` คีย์ prototype จะถูกละเว้น

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
    ตั้งค่า `OPENAI_TTS_BASE_URL` เพื่อ override base URL ของ TTS โดยไม่กระทบปลายทาง chat API ทั้ง OpenAI TTS และเสียง Realtime กำหนดค่าผ่าน API key ของ OpenAI Platform; การติดตั้งแบบ OAuth-only ยังใช้โมเดล chat ที่รองรับโดย Codex ได้ แต่ใช้การพูดโต้ตอบสดของ OpenAI ไม่ได้
    </Note>

  </Accordion>

  <Accordion title="เสียงพูดเป็นข้อความ">
    Plugin `openai` ที่รวมมาให้ลงทะเบียนเสียงพูดเป็นข้อความแบบ batch ผ่าน
    พื้นผิวถอดเสียงเพื่อความเข้าใจสื่อของ OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - ปลายทาง: OpenAI REST `/v1/audio/transcriptions`
    - พาธอินพุต: การอัปโหลดไฟล์เสียงแบบ multipart
    - รองรับโดย OpenClaw ในทุกที่ที่การถอดเสียงขาเข้าใช้
      `tools.media.audio` รวมถึงเซกเมนต์ช่องเสียงของ Discord และไฟล์แนบเสียงของช่องทาง

    เพื่อบังคับใช้ OpenAI สำหรับการถอดเสียงขาเข้า:

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

    คำแนะนำด้านภาษาและ prompt จะถูกส่งต่อไปยัง OpenAI เมื่อระบุโดย
    config สื่อเสียงร่วม หรือคำขอถอดเสียงรายครั้ง

  </Accordion>

  <Accordion title="การถอดเสียงแบบเรียลไทม์">
    Plugin `openai` ที่รวมมาให้ลงทะเบียนการถอดเสียงแบบเรียลไทม์สำหรับ Voice Call Plugin

    | การตั้งค่า | พาธ config | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | ภาษา | `...openai.language` | (ไม่ได้ตั้งค่า) |
    | Prompt | `...openai.prompt` | (ไม่ได้ตั้งค่า) |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `800` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | Auth | `...openai.apiKey`, `OPENAI_API_KEY` หรือ OAuth ของ `openai` | API key เชื่อมต่อโดยตรง; OAuth ออก client secret สำหรับการถอดเสียง Realtime |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียง G.711 u-law (`g711_ulaw` / `audio/pcmu`) เมื่อกำหนดค่าเฉพาะ OAuth ของ `openai` Gateway จะออก client secret สำหรับการถอดเสียง Realtime ชั่วคราวก่อนเปิด WebSocket provider แบบ streaming นี้ใช้สำหรับพาธการถอดเสียงแบบเรียลไทม์ของ Voice Call; ปัจจุบันเสียง Discord จะบันทึกเซกเมนต์สั้น ๆ และใช้พาธการถอดเสียงแบบ batch `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="เสียงเรียลไทม์">
    Plugin `openai` ที่รวมมาให้ลงทะเบียนเสียงเรียลไทม์สำหรับ Voice Call Plugin

    | การตั้งค่า | พาธ config | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | เสียง | `...openai.voice` | `alloy` |
    | Temperature (บริดจ์ deployment ของ Azure) | `...openai.temperature` | `0.8` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `500` |
    | Padding นำหน้า | `...openai.prefixPaddingMs` | `300` |
    | Reasoning effort | `...openai.reasoningEffort` | (ไม่ได้ตั้งค่า) |
    | Auth | โปรไฟล์ auth แบบ API-key ของ `openai`, `...openai.apiKey` หรือ `OPENAI_API_KEY` | ต้องใช้ API key ของ OpenAI Platform; OpenAI OAuth ไม่ได้กำหนดค่าเสียง Realtime |

    เสียง Realtime ในตัวที่พร้อมใช้งานสำหรับ `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`
    OpenAI แนะนำ `marin` และ `cedar` เพื่อคุณภาพ Realtime ที่ดีที่สุด ชุดนี้
    แยกจากเสียง Text-to-speech ด้านบน; อย่าสันนิษฐานว่าเสียง TTS
    เช่น `fable`, `nova` หรือ `onyx` ใช้ได้กับเซสชัน Realtime

    <Note>
    บริดจ์ OpenAI realtime ฝั่ง backend ใช้รูปแบบเซสชัน GA Realtime WebSocket ซึ่งไม่ยอมรับ `session.temperature` deployment ของ Azure OpenAI ยังคงใช้งานได้ผ่าน `azureEndpoint` และ `azureDeployment` และคงรูปแบบเซสชันที่เข้ากันได้กับ deployment รองรับการเรียกเครื่องมือสองทิศทางและเสียง G.711 u-law
    </Note>

    <Note>
    เสียง Realtime จะถูกเลือกเมื่อสร้างเซสชัน OpenAI อนุญาตให้ฟิลด์เซสชันส่วนใหญ่
    เปลี่ยนในภายหลังได้ แต่ไม่สามารถเปลี่ยนเสียงได้หลังจากโมเดลปล่อยเสียงในเซสชันนั้นแล้ว
    ปัจจุบัน OpenClaw เปิดเผย id เสียง Realtime ในตัวเป็นสตริง
    </Note>

    <Note>
    Control UI Talk ใช้เซสชันเรียลไทม์บนเบราว์เซอร์ของ OpenAI โดยมี
    client secret ชั่วคราวที่ Gateway ออกให้ และการแลกเปลี่ยน WebRTC SDP
    จากเบราว์เซอร์โดยตรงกับ OpenAI Realtime API Gateway ออก client secret
    นั้นด้วยโปรไฟล์การยืนยันตัวตนด้วยคีย์ API ของ `openai` ที่เลือกไว้ หรือ
    OpenAI Platform API key ที่กำหนดค่าไว้ รีเลย์ของ Gateway และบริดจ์
    WebSocket เรียลไทม์ของแบ็กเอนด์ Voice Call ใช้เส้นทางการยืนยันตัวตน
    เฉพาะคีย์ API เดียวกันสำหรับ endpoint ดั้งเดิมของ OpenAI การตรวจสอบจริง
    โดยผู้ดูแลพร้อมใช้งานด้วย
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ฝั่ง OpenAI ตรวจสอบทั้งบริดจ์ WebSocket ของแบ็กเอนด์และการแลกเปลี่ยน
    WebRTC SDP ของเบราว์เซอร์โดยไม่บันทึก secrets
    </Note>

  </Accordion>
</AccordionGroup>

## endpoint ของ Azure OpenAI

ผู้ให้บริการ `openai` ที่รวมมาให้สามารถชี้ไปยังทรัพยากร Azure OpenAI
สำหรับการสร้างภาพได้โดยการ override base URL ในเส้นทางการสร้างภาพ OpenClaw
จะตรวจจับชื่อโฮสต์ Azure บน `models.providers.openai.baseUrl` และสลับไปใช้
รูปแบบคำขอของ Azure โดยอัตโนมัติ

<Note>
เสียงเรียลไทม์ใช้เส้นทางการกำหนดค่าแยกต่างหาก
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
และไม่ได้รับผลจาก `models.providers.openai.baseUrl` ดูการตั้งค่า Azure
ได้ที่ accordion **เสียงเรียลไทม์** ใต้ [เสียงและการพูด](#voice-and-speech)
</Note>

ใช้ Azure OpenAI เมื่อ:

- คุณมีการสมัครใช้งาน Azure OpenAI, quota หรือข้อตกลงระดับองค์กรอยู่แล้ว
- คุณต้องการการพำนักของข้อมูลในภูมิภาคหรือการควบคุมด้าน compliance ที่ Azure มีให้
- คุณต้องการเก็บทราฟฟิกไว้ภายใน tenancy ของ Azure ที่มีอยู่

### การกำหนดค่า

สำหรับการสร้างภาพผ่านผู้ให้บริการ `openai` ที่รวมมาให้ ให้ชี้
`models.providers.openai.baseUrl` ไปยังทรัพยากร Azure ของคุณ และตั้งค่า
`apiKey` เป็นคีย์ Azure OpenAI (ไม่ใช่ OpenAI Platform key):

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

OpenClaw รู้จัก suffix ของโฮสต์ Azure เหล่านี้สำหรับเส้นทางการสร้างภาพของ
Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

สำหรับคำขอสร้างภาพบนโฮสต์ Azure ที่รู้จัก OpenClaw จะ:

- ส่ง header `api-key` แทน `Authorization: Bearer`
- ใช้ path ที่ผูกกับ deployment (`/openai/deployments/{deployment}/...`)
- เติม `?api-version=...` ต่อท้ายแต่ละคำขอ
- ใช้ timeout คำขอค่าเริ่มต้น 600 วินาทีสำหรับการเรียกสร้างภาพของ Azure
  ค่า `timeoutMs` รายคำขอยังคง override ค่าเริ่มต้นนี้ได้

base URL อื่นๆ (OpenAI สาธารณะ, proxy ที่เข้ากันได้กับ OpenAI) จะยังคงใช้
รูปแบบคำขอสร้างภาพมาตรฐานของ OpenAI

<Note>
การกำหนดเส้นทาง Azure สำหรับเส้นทางสร้างภาพของผู้ให้บริการ `openai` ต้องใช้
OpenClaw 2026.4.22 หรือใหม่กว่า เวอร์ชันก่อนหน้าจะปฏิบัติต่อ
`openai.baseUrl` แบบกำหนดเองเหมือน endpoint OpenAI สาธารณะ และจะล้มเหลว
เมื่อใช้กับ deployment ภาพของ Azure
</Note>

### เวอร์ชัน API

ตั้งค่า `AZURE_OPENAI_API_VERSION` เพื่อตรึงเวอร์ชัน preview หรือ GA ของ Azure
สำหรับเส้นทางการสร้างภาพของ Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

ค่าเริ่มต้นคือ `2024-12-01-preview` เมื่อไม่ได้ตั้งค่าตัวแปร

### ชื่อโมเดลคือชื่อ deployment

Azure OpenAI ผูกโมเดลกับ deployment สำหรับคำขอสร้างภาพของ Azure ที่กำหนด
เส้นทางผ่านผู้ให้บริการ `openai` ที่รวมมาให้ ฟิลด์ `model` ใน OpenClaw
ต้องเป็น **ชื่อ deployment ของ Azure** ที่คุณกำหนดค่าไว้ในพอร์ทัล Azure
ไม่ใช่ id โมเดล OpenAI สาธารณะ

หากคุณสร้าง deployment ชื่อ `gpt-image-2-prod` ที่ให้บริการ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

กฎชื่อ deployment เดียวกันนี้ใช้กับการเรียกสร้างภาพที่กำหนดเส้นทางผ่าน
ผู้ให้บริการ `openai` ที่รวมมาให้

### ความพร้อมใช้งานตามภูมิภาค

ปัจจุบันการสร้างภาพของ Azure พร้อมใช้งานเฉพาะในบางภูมิภาคเท่านั้น
(เช่น `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`) ตรวจสอบรายการภูมิภาคปัจจุบันของ Microsoft ก่อนสร้าง
deployment และยืนยันว่าโมเดลเฉพาะนั้นมีให้บริการในภูมิภาคของคุณ

### ความแตกต่างของพารามิเตอร์

Azure OpenAI และ OpenAI สาธารณะไม่ได้ยอมรับพารามิเตอร์ภาพชุดเดียวกันเสมอไป
Azure อาจปฏิเสธตัวเลือกที่ OpenAI สาธารณะอนุญาต (เช่นค่า `background`
บางค่าบน `gpt-image-2`) หรือเปิดเผยเฉพาะบนเวอร์ชันโมเดลบางรุ่น
ความแตกต่างเหล่านี้มาจาก Azure และโมเดลพื้นฐาน ไม่ใช่ OpenClaw หากคำขอ
Azure ล้มเหลวด้วยข้อผิดพลาดการตรวจสอบ ให้ตรวจสอบชุดพารามิเตอร์ที่รองรับโดย
deployment และเวอร์ชัน API เฉพาะของคุณในพอร์ทัล Azure

<Note>
Azure OpenAI ใช้ transport ดั้งเดิมและพฤติกรรม compat แต่ไม่ได้รับ header
attribution แบบซ่อนของ OpenClaw — ดู accordion **เส้นทางดั้งเดิมเทียบกับ
เส้นทางที่เข้ากันได้กับ OpenAI** ใต้ [การกำหนดค่าขั้นสูง](#advanced-configuration)

สำหรับทราฟฟิก chat หรือ Responses บน Azure (นอกเหนือจากการสร้างภาพ) ให้ใช้
flow onboarding หรือการกำหนดค่าผู้ให้บริการ Azure โดยเฉพาะ — แค่
`openai.baseUrl` เพียงอย่างเดียวจะไม่เลือกใช้รูปแบบ API/auth ของ Azure
มีผู้ให้บริการ `azure-openai-responses/*` แยกต่างหาก; ดู accordion
Server-side compaction ด้านล่าง
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw ใช้ WebSocket ก่อน พร้อม fallback เป็น SSE (`"auto"`) สำหรับ `openai/*`

    ในโหมด `"auto"` OpenClaw จะ:
    - ลองใหม่หนึ่งครั้งเมื่อ WebSocket ล้มเหลวตั้งแต่ต้น ก่อน fallback เป็น SSE
    - หลังเกิดความล้มเหลว ทำเครื่องหมาย WebSocket ว่า degraded เป็นเวลาประมาณ 60 วินาที และใช้ SSE ระหว่างช่วง cool-down
    - แนบ header ระบุตัวตนของเซสชันและ turn ที่เสถียรสำหรับการลองใหม่และการเชื่อมต่อใหม่
    - normalize ตัวนับการใช้งาน (`input_tokens` / `prompt_tokens`) ระหว่าง transport variants

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
    - [Realtime API พร้อม WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [การตอบสนอง Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Fast mode">
    OpenClaw เปิดเผย toggle fast-mode ที่ใช้ร่วมกันสำหรับ `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    เมื่อเปิดใช้ OpenClaw จะ map fast mode ไปยัง priority processing ของ OpenAI (`service_tier = "priority"`) ค่า `service_tier` ที่มีอยู่จะถูกคงไว้ และ fast mode จะไม่เขียนทับ `reasoning` หรือ `text.verbosity` `fastMode: "auto"` จะเริ่มการเรียกโมเดลใหม่แบบเร็วไปจนถึง auto cutoff จากนั้นจึงเริ่มการเรียก retry, fallback, tool-result หรือ continuation ภายหลังโดยไม่มี fast mode ค่า cutoff เริ่มต้นคือ 60 วินาที; ตั้งค่า `params.fastAutoOnSeconds` บนโมเดลที่ใช้งานอยู่เพื่อเปลี่ยนค่า

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
    การ override ของเซสชันมีสิทธิ์เหนือ config การล้างการ override ของเซสชันใน Sessions UI จะคืนเซสชันกลับไปยังค่าเริ่มต้นที่กำหนดค่าไว้
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    API ของ OpenAI เปิดเผย priority processing ผ่าน `service_tier` ตั้งค่ารายโมเดลใน OpenClaw:

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
    `serviceTier` จะถูกส่งต่อเฉพาะไปยัง endpoint ดั้งเดิมของ OpenAI (`api.openai.com`) และ endpoint ดั้งเดิมของ Codex (`chatgpt.com/backend-api`) หากคุณกำหนดเส้นทางผู้ให้บริการใดผู้ให้บริการหนึ่งผ่าน proxy OpenClaw จะปล่อย `service_tier` ไว้ตามเดิม
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    สำหรับโมเดล OpenAI Responses โดยตรง (`openai/*` บน `api.openai.com`) stream wrapper ของ OpenClaw ใน Plugin OpenAI จะเปิดใช้ server-side compaction โดยอัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ model compat ตั้งค่า `supportsStore: false`)
    - inject `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - ค่าเริ่มต้น `compact_threshold`: 70% ของ `contextWindow` (หรือ `80000` เมื่อไม่มีข้อมูล)

    สิ่งนี้ใช้กับเส้นทาง runtime ในตัวของ OpenClaw และกับ hook ของผู้ให้บริการ OpenAI ที่ใช้โดย embedded runs harness app-server ดั้งเดิมของ Codex จัดการ context ของตัวเองผ่าน Codex และถูกกำหนดค่าโดย route agent เริ่มต้นของ OpenAI หรือนโยบาย runtime ของผู้ให้บริการ/โมเดล

    <Tabs>
      <Tab title="Enable explicitly">
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
    `responsesServerCompaction` ควบคุมเฉพาะการ inject `context_management` เท่านั้น โมเดล OpenAI Responses โดยตรงยังคงบังคับ `store: true` เว้นแต่ compat จะตั้งค่า `supportsStore: false`
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT mode">
    สำหรับการรันในตระกูล GPT-5 บน `openai/*` OpenClaw สามารถใช้สัญญาการดำเนินการแบบ embedded ที่เข้มงวดขึ้น:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    ด้วย `strict-agentic` OpenClaw จะ:
    - เปิดใช้ `update_plan` โดยอัตโนมัติสำหรับงานที่มีสาระสำคัญ
    - ลอง turn ที่ว่างในเชิงโครงสร้างหรือมีเฉพาะ reasoning ใหม่ด้วย continuation ที่มีคำตอบที่มองเห็นได้
    - ใช้เหตุการณ์แผนของ harness แบบ explicit เมื่อ harness ที่เลือกมีให้

    OpenClaw ไม่จัดประเภท prose ของ assistant เพื่อตัดสินว่า turn เป็นแผน การอัปเดตความคืบหน้า หรือคำตอบสุดท้าย

    <Note>
    จำกัดเฉพาะการรันตระกูล GPT-5 ของ OpenAI และ Codex เท่านั้น ผู้ให้บริการอื่นและตระกูลโมเดลเก่ากว่ายังคงใช้พฤติกรรมเริ่มต้น
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw ปฏิบัติต่อ endpoint โดยตรงของ OpenAI, Codex และ Azure OpenAI ต่างจาก proxy `/v1` ทั่วไปที่เข้ากันได้กับ OpenAI:

    **เส้นทางดั้งเดิม** (`openai/*`, Azure OpenAI):
    - คง `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับ effort `none` ของ OpenAI
    - ละ reasoning ที่ปิดใช้งานสำหรับโมเดลหรือ proxy ที่ปฏิเสธ `reasoning.effort: "none"`
    - ตั้งค่า tool schemas เป็นโหมด strict โดยค่าเริ่มต้น
    - แนบ header attribution แบบซ่อนเฉพาะบนโฮสต์ดั้งเดิมที่ตรวจสอบแล้วเท่านั้น
    - คงการจัดรูปแบบคำขอเฉพาะ OpenAI (`service_tier`, `store`, reasoning-compat, prompt-cache hints)

    **เส้นทางพร็อกซี/ที่เข้ากันได้:**
    - ใช้พฤติกรรมความเข้ากันได้ที่ผ่อนปรนกว่า
    - ตัด Completions `store` ออกจากเพย์โหลด `openai-completions` ที่ไม่ใช่แบบเนทีฟ
    - ยอมรับ JSON ส่งผ่านขั้นสูง `params.extra_body`/`params.extraBody` สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI
    - ยอมรับ `params.chat_template_kwargs` สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI เช่น vLLM
    - ไม่บังคับใช้สคีมาเครื่องมือแบบเข้มงวดหรือเฮดเดอร์เฉพาะเนทีฟ

    Azure OpenAI ใช้การขนส่งแบบเนทีฟและพฤติกรรมความเข้ากันได้ แต่ไม่ได้รับเฮดเดอร์การระบุแหล่งที่มาที่ซ่อนอยู่

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ทางเลือกสำรอง
  </Card>
  <Card title="การสร้างรูปภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือรูปภาพร่วมและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอร่วมและการเลือกผู้ให้บริการ
  </Card>
  <Card title="OAuth และการตรวจสอบสิทธิ์" href="/th/gateway/authentication" icon="key">
    รายละเอียดการตรวจสอบสิทธิ์และกฎการใช้ข้อมูลประจำตัวซ้ำ
  </Card>
</CardGroup>
