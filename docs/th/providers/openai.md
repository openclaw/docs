---
read_when:
    - คุณต้องการใช้โมเดล OpenAI ใน OpenClaw
    - คุณต้องการใช้การตรวจสอบสิทธิ์แบบสมัครสมาชิกของ Codex แทนคีย์ API
    - คุณต้องการพฤติกรรมการดำเนินงานของเอเจนต์ GPT-5 ที่เข้มงวดยิ่งขึ้น
summary: ใช้ OpenAI ผ่านคีย์ API หรือการสมัครใช้งาน Codex ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-07T13:25:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a37c0b2c227674b6762aea70ce6d640d49044117c9244377058032ade561d6b
    source_path: providers/openai.md
    workflow: 16
---

OpenAI มี API สำหรับนักพัฒนาสำหรับโมเดล GPT และ Codex ยังพร้อมใช้งานเป็นเอเจนต์เขียนโค้ดในแผน ChatGPT ผ่านไคลเอนต์ Codex ของ OpenAI ด้วย OpenClaw แยกส่วนติดต่อเหล่านั้นออกจากกันเพื่อให้ config คาดเดาได้

OpenClaw ใช้ `openai/*` เป็นเส้นทางโมเดล OpenAI มาตรฐาน เทิร์นของเอเจนต์แบบฝังบนโมเดล OpenAI จะรันผ่านรันไทม์ app-server ของ Codex แบบเนทีฟโดยค่าเริ่มต้น ส่วนการยืนยันตัวตนด้วยคีย์ OpenAI API โดยตรงยังคงพร้อมใช้งานสำหรับส่วนติดต่อ OpenAI ที่ไม่ใช่เอเจนต์ เช่น รูปภาพ, embeddings, เสียงพูด และ realtime

- **โมเดลเอเจนต์** - โมเดล `openai/*` ผ่านรันไทม์ Codex; ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน `openai-codex` สำหรับการใช้การสมัครใช้งาน ChatGPT/Codex หรือกำหนดค่าโปรไฟล์คีย์ API `openai-codex` เมื่อคุณตั้งใจต้องการการยืนยันตัวตนด้วยคีย์ API
- **API OpenAI ที่ไม่ใช่เอเจนต์** - การเข้าถึง OpenAI Platform โดยตรงพร้อมการเรียกเก็บเงินตามการใช้งานผ่าน `OPENAI_API_KEY` หรือการเริ่มต้นใช้งานคีย์ OpenAI API
- **Config เดิม** - refs โมเดล `openai-codex/*` จะถูกซ่อมแซมโดย `openclaw doctor --fix` เป็น `openai/*` พร้อมรันไทม์ Codex

OpenAI รองรับการใช้ OAuth แบบสมัครใช้งานในเครื่องมือและเวิร์กโฟลว์ภายนอกอย่าง OpenClaw อย่างชัดเจน

ผู้ให้บริการ, โมเดล, รันไทม์ และช่องทางเป็นเลเยอร์ที่แยกจากกัน หากป้ายกำกับเหล่านั้นเริ่มปะปนกัน ให้อ่าน [รันไทม์เอเจนต์](/th/concepts/agent-runtimes) ก่อนเปลี่ยน config

## ตัวเลือกด่วน

| เป้าหมาย                                                 | ใช้                                                     | หมายเหตุ                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| การสมัครใช้งาน ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-5.5`                                        | การตั้งค่าเอเจนต์ OpenAI เริ่มต้น ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน `openai-codex`         |
| การเรียกเก็บเงินด้วยคีย์ API โดยตรงสำหรับโมเดลเอเจนต์              | `openai/gpt-5.5` พร้อมโปรไฟล์คีย์ API `openai-codex` | ใช้ `auth.order.openai-codex` เพื่อให้โปรไฟล์นั้นมีลำดับความสำคัญ                 |
| การเรียกเก็บเงินด้วยคีย์ API โดยตรงผ่าน PI แบบชัดเจน           | `openai/gpt-5.5` พร้อม `agentRuntime.id: "pi"`           | เลือกโปรไฟล์คีย์ API `openai` ปกติ                             |
| นามแฝง API ChatGPT Instant ล่าสุด                     | `openai/chat-latest`                                    | ใช้คีย์ API โดยตรงเท่านั้น นามแฝงแบบเคลื่อนที่สำหรับการทดลอง ไม่ใช่ค่าเริ่มต้น   |
| การยืนยันตัวตนการสมัครใช้งาน ChatGPT/Codex ผ่าน PI แบบชัดเจน  | `openai/gpt-5.5` พร้อม `agentRuntime.id: "pi"`           | เลือกโปรไฟล์การยืนยันตัวตน `openai-codex` สำหรับเส้นทางความเข้ากันได้    |
| การสร้างหรือแก้ไขรูปภาพ                          | `openai/gpt-image-2`                                    | ใช้ได้กับทั้ง `OPENAI_API_KEY` หรือ OpenAI Codex OAuth             |
| รูปภาพพื้นหลังโปร่งใส                        | `openai/gpt-image-1.5`                                  | ใช้ `outputFormat=png` หรือ `webp` และ `openai.background=transparent` |

## แผนที่ชื่อ

ชื่อคล้ายกันแต่ใช้แทนกันไม่ได้:

| ชื่อที่คุณเห็น                       | เลเยอร์               | ความหมาย                                                                                           |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | คำนำหน้าผู้ให้บริการ     | เส้นทางโมเดล OpenAI มาตรฐาน; เทิร์นของเอเจนต์ใช้รันไทม์ Codex                                  |
| `openai-codex`                     | คำนำหน้าการยืนยันตัวตน/โปรไฟล์ | ผู้ให้บริการโปรไฟล์การยืนยันตัวตน OAuth/การสมัครใช้งาน OpenAI Codex                                            |
| Plugin `codex`                     | Plugin              | Plugin OpenClaw ที่รวมมาให้ซึ่งให้รันไทม์ app-server ของ Codex แบบเนทีฟและตัวควบคุมแชต `/codex` |
| `agentRuntime.id: codex`           | รันไทม์เอเจนต์       | บังคับใช้ harness app-server ของ Codex แบบเนทีฟสำหรับเทิร์นแบบฝัง                                     |
| `/codex ...`                       | ชุดคำสั่งแชต    | ผูก/ควบคุมเธรด app-server ของ Codex จากการสนทนา                                        |
| `runtime: "acp", agentId: "codex"` | เส้นทางเซสชัน ACP   | เส้นทาง fallback แบบชัดเจนที่รัน Codex ผ่าน ACP/acpx                                          |

ซึ่งหมายความว่า config หนึ่งสามารถตั้งใจมีทั้ง refs โมเดล `openai/*` และโปรไฟล์การยืนยันตัวตน `openai-codex` ได้ `openclaw doctor --fix` จะเขียน refs โมเดลเดิม `openai-codex/*` ใหม่เป็นเส้นทางโมเดล OpenAI มาตรฐาน

<Note>
GPT-5.5 พร้อมใช้งานผ่านทั้งการเข้าถึงด้วยคีย์ API ของ OpenAI Platform โดยตรงและเส้นทางการสมัครใช้งาน/OAuth สำหรับการสมัครใช้งาน ChatGPT/Codex พร้อมการเรียกใช้ Codex แบบเนทีฟ ให้ใช้ `openai/gpt-5.5`; config รันไทม์ที่ไม่ได้ตั้งค่าจะเลือกรัน harness ของ Codex สำหรับเทิร์นเอเจนต์ OpenAI ในตอนนี้ ใช้โปรไฟล์คีย์ OpenAI API เฉพาะเมื่อคุณต้องการการยืนยันตัวตนด้วยคีย์ API โดยตรงสำหรับโมเดลเอเจนต์ OpenAI
</Note>

<Note>
เทิร์นโมเดลเอเจนต์ OpenAI ต้องใช้ Plugin app-server ของ Codex ที่รวมมาให้ config รันไทม์ PI แบบชัดเจนยังคงพร้อมใช้งานเป็นเส้นทางความเข้ากันได้แบบเลือกใช้ เมื่อเลือก PI อย่างชัดเจนพร้อมโปรไฟล์การยืนยันตัวตน `openai-codex` OpenClaw จะคง ref โมเดลสาธารณะไว้เป็น `openai/*` และกำหนดเส้นทาง PI ภายในผ่านทรานสปอร์ตยืนยันตัวตน Codex แบบเดิม รัน `openclaw doctor --fix` เพื่อซ่อม refs โมเดล `openai-codex/*` ที่ค้างอยู่หรือหมุดเซสชัน PI เก่าที่ไม่ได้มาจาก config รันไทม์แบบชัดเจน
</Note>

## ความครอบคลุมฟีเจอร์ OpenClaw

| ความสามารถของ OpenAI         | ส่วนติดต่อ OpenClaw                                                  | สถานะ                                                 |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| แชต / Responses          | ผู้ให้บริการโมเดล `openai/<model>`                                   | ใช่                                                    |
| โมเดลการสมัครใช้งาน Codex | `openai/<model>` พร้อม OAuth `openai-codex`                        | ใช่                                                    |
| refs โมเดล Codex เดิม   | `openai-codex/<model>`                                            | ซ่อมแซมโดย doctor เป็น `openai/<model>`                 |
| harness app-server ของ Codex  | `openai/<model>` พร้อมรันไทม์ที่ละไว้หรือ `agentRuntime.id: codex` | ใช่                                                    |
| การค้นหาเว็บฝั่งเซิร์ฟเวอร์    | เครื่องมือ OpenAI Responses แบบเนทีฟ                                      | ใช่ เมื่อเปิดใช้การค้นหาเว็บและไม่มีผู้ให้บริการถูกปักไว้ |
| รูปภาพ                    | `image_generate`                                                  | ใช่                                                    |
| วิดีโอ                    | `video_generate`                                                  | ใช่                                                    |
| แปลงข้อความเป็นเสียง            | `messages.tts.provider: "openai"` / `tts`                         | ใช่                                                    |
| แปลงเสียงเป็นข้อความแบบแบตช์      | `tools.media.audio` / การทำความเข้าใจสื่อ                         | ใช่                                                    |
| แปลงเสียงเป็นข้อความแบบสตรีม  | Voice Call `streaming.provider: "openai"`                         | ใช่                                                    |
| เสียง realtime            | Voice Call `realtime.provider: "openai"` / Control UI Talk        | ใช่                                                    |
| Embeddings                | ผู้ให้บริการ embedding ของหน่วยความจำ                                         | ใช่                                                    |

## Embeddings ของหน่วยความจำ

OpenClaw สามารถใช้ OpenAI หรือ endpoint embedding ที่เข้ากันได้กับ OpenAI สำหรับการทำดัชนี `memory_search` และ embeddings ของคิวรี:

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

สำหรับ endpoints ที่เข้ากันได้กับ OpenAI และต้องใช้ป้ายกำกับ embedding แบบไม่สมมาตร ให้ตั้งค่า `queryInputType` และ `documentInputType` ใต้ `memorySearch` OpenClaw จะส่งค่าดังกล่าวต่อเป็นฟิลด์คำขอ `input_type` เฉพาะผู้ให้บริการ: embeddings ของคิวรีใช้ `queryInputType`; ชิ้นส่วนหน่วยความจำที่ถูกทำดัชนีและการทำดัชนีแบบแบตช์ใช้ `documentInputType` ดูตัวอย่างเต็มได้ใน [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config#provider-specific-config)

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

    | Ref โมเดล              | Config รันไทม์             | เส้นทาง                       | การยืนยันตัวตน             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | ละไว้ / `agentRuntime.id: "codex"` | harness app-server ของ Codex | โปรไฟล์ `openai-codex` |
    | `openai/gpt-5.4-mini` | ละไว้ / `agentRuntime.id: "codex"` | harness app-server ของ Codex | โปรไฟล์ `openai-codex` |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"`              | รันไทม์ฝัง PI      | โปรไฟล์ `openai` หรือโปรไฟล์ `openai-codex` ที่เลือก |

    <Note>
    โมเดลเอเจนต์ `openai/*` ใช้ harness app-server ของ Codex หากต้องการใช้การยืนยันตัวตนด้วยคีย์ API สำหรับโมเดลเอเจนต์ ให้สร้างโปรไฟล์คีย์ API `openai-codex` และจัดลำดับด้วย `auth.order.openai-codex`; `OPENAI_API_KEY` ยังคงเป็น fallback โดยตรงสำหรับส่วนติดต่อ API OpenAI ที่ไม่ใช่เอเจนต์
    </Note>

    ### ตัวอย่าง Config

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

    `chat-latest` เป็นนามแฝงแบบเคลื่อนที่ OpenAI ระบุในเอกสารว่าเป็นโมเดล Instant ล่าสุดที่ใช้ใน ChatGPT และแนะนำ `gpt-5.5` สำหรับการใช้ API ใน production ดังนั้นให้คง `openai/gpt-5.5` เป็นค่าเริ่มต้นที่เสถียร เว้นแต่คุณต้องการพฤติกรรมของนามแฝงนั้นอย่างชัดเจน ปัจจุบันนามแฝงนี้ยอมรับเฉพาะ verbosity ข้อความระดับ `medium` ดังนั้น OpenClaw จะ normalize การ override verbosity ข้อความ OpenAI ที่เข้ากันไม่ได้สำหรับโมเดลนี้

    <Warning>
    OpenClaw **ไม่** เปิดเผย `openai/gpt-5.3-codex-spark` คำขอ OpenAI API แบบ live จะปฏิเสธโมเดลนั้น และแคตตาล็อก Codex ปัจจุบันก็ไม่เปิดเผยโมเดลนั้นเช่นกัน
    </Warning>

  </Tab>

  <Tab title="การสมัครใช้งาน Codex">
    **เหมาะที่สุดสำหรับ:** การใช้การสมัครใช้งาน ChatGPT/Codex ของคุณพร้อมการเรียกใช้ app-server ของ Codex แบบเนทีฟแทนคีย์ API แยกต่างหาก Codex cloud ต้องลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="รัน Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        หรือรัน OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        สำหรับการตั้งค่าแบบ headless หรือที่ callback ทำงานยาก ให้เพิ่ม `--device-code` เพื่อลงชื่อเข้าใช้ด้วยโฟลว์ device-code ของ ChatGPT แทน callback เบราว์เซอร์ localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="ใช้เส้นทางโมเดล OpenAI มาตรฐาน">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        ไม่จำเป็นต้องมีการกำหนดค่า runtime สำหรับเส้นทางเริ่มต้น เทิร์นของเอเจนต์ OpenAI
        จะเลือก runtime ของ app-server Codex ดั้งเดิมโดยอัตโนมัติ และ OpenClaw
        จะติดตั้งหรือซ่อมแซม Codex Plugin ที่รวมมาให้เมื่อเลือกเส้นทางนี้.
      </Step>
      <Step title="ตรวจสอบว่าการยืนยันตัวตน Codex พร้อมใช้งาน">
        ```bash
        openclaw models list --provider openai-codex
        ```

        หลังจาก Gateway ทำงานแล้ว ให้ส่ง `/codex status` หรือ `/codex models`
        ในแชตเพื่อตรวจสอบ runtime ของ app-server ดั้งเดิม.
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | อ้างอิงโมเดล | การกำหนดค่า runtime | เส้นทาง | การยืนยันตัวตน |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | ละไว้ / `agentRuntime.id: "codex"` | ชุดควบคุม app-server Codex ดั้งเดิม | การลงชื่อเข้าใช้ Codex หรือโปรไฟล์ `openai-codex` ที่เลือก |
    | `openai/gpt-5.5` | `agentRuntime.id: "pi"` | runtime PI แบบฝังพร้อม transport การยืนยันตัวตน Codex ภายใน | โปรไฟล์ `openai-codex` ที่เลือก |
    | `openai-codex/gpt-5.5` | ซ่อมแซมโดย doctor | เส้นทางเดิมถูกเขียนใหม่เป็น `openai/gpt-5.5` | โปรไฟล์ `openai-codex` ที่มีอยู่ |

    <Warning>
    อย่ากำหนดค่าอ้างอิงโมเดล `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` หรือ
    `openai-codex/gpt-5.3*` รุ่นเก่า บัญชี ChatGPT/Codex OAuth ตอนนี้ปฏิเสธ
    โมเดลเหล่านั้น ใช้ `openai/gpt-5.5`; เทิร์นของเอเจนต์ OpenAI ตอนนี้เลือก runtime
    Codex ตามค่าเริ่มต้น.
    </Warning>

    <Note>
    ใช้ provider id `openai-codex` ต่อไปสำหรับคำสั่งการยืนยันตัวตน/โปรไฟล์
    พรีฟิกซ์โมเดล `openai-codex/*` เป็นการกำหนดค่าเดิมที่ doctor ซ่อมแซม สำหรับการตั้งค่าทั่วไปแบบสมัครสมาชิกพร้อม runtime ดั้งเดิม ให้ลงชื่อเข้าใช้ด้วย `openai-codex`
    แต่คงอ้างอิงโมเดลไว้เป็น `openai/gpt-5.5`.
    </Note>

    ### ตัวอย่างการกำหนดค่า

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

    <Note>
    การเริ่มต้นใช้งานจะไม่นำเข้าข้อมูล OAuth จาก `~/.codex` อีกต่อไป ให้ลงชื่อเข้าใช้ด้วย OAuth ผ่านเบราว์เซอร์ (ค่าเริ่มต้น) หรือโฟลว์ device-code ด้านบน — OpenClaw จะจัดการข้อมูลรับรองที่ได้ในที่เก็บการยืนยันตัวตนเอเจนต์ของตนเอง.
    </Note>

    ### ตรวจสอบและกู้คืนการกำหนดเส้นทาง OAuth ของ Codex

    ใช้คำสั่งเหล่านี้เพื่อดูว่าเอเจนต์เริ่มต้นของคุณกำลังใช้โมเดล, runtime และเส้นทางการยืนยันตัวตนใด:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    สำหรับเอเจนต์เฉพาะ ให้เพิ่ม `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    หากการกำหนดค่าเก่ายังมี `openai-codex/gpt-*` หรือ pin เซสชัน OpenAI PI ที่ล้าสมัย
    โดยไม่มีการกำหนดค่า runtime อย่างชัดเจน ให้ซ่อมแซม:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    หาก `models auth list --provider openai-codex` ไม่แสดงโปรไฟล์ที่ใช้งานได้ ให้ลงชื่อเข้าใช้อีกครั้ง:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` ยังคงเป็น provider id สำหรับการยืนยันตัวตน/โปรไฟล์ `openai/*` คือ
    เส้นทางโมเดลสำหรับเทิร์นของเอเจนต์ OpenAI ผ่าน Codex.

    ### ตัวบ่งชี้สถานะ

    `/status` ในแชตจะแสดงว่า runtime โมเดลใดกำลังทำงานอยู่สำหรับเซสชันปัจจุบัน
    ชุดควบคุม app-server Codex ที่รวมมาให้จะแสดงเป็น `Runtime: OpenAI Codex` สำหรับ
    เทิร์นของโมเดลเอเจนต์ OpenAI pin เซสชัน PI ที่ล้าสมัยจะถูกซ่อมแซมเป็น Codex เว้นแต่
    การกำหนดค่าจะ pin PI ไว้อย่างชัดเจน.

    ### คำเตือนจาก doctor

    หากเส้นทาง `openai-codex/*` หรือ pin OpenAI PI ที่ล้าสมัยยังคงอยู่ในการกำหนดค่าหรือ
    สถานะเซสชัน `openclaw doctor --fix` จะเขียนใหม่เป็น `openai/*` พร้อม runtime
    Codex เว้นแต่จะกำหนดค่า PI ไว้อย่างชัดเจน.

    ### ขีดจำกัดหน้าต่างบริบท

    OpenClaw ถือว่า metadata ของโมเดลและขีดจำกัดบริบท runtime เป็นค่าที่แยกจากกัน.

    สำหรับ `openai/gpt-5.5` ผ่านแค็ตตาล็อก Codex OAuth:

    - `contextWindow` ดั้งเดิม: `1000000`
    - ขีดจำกัด `contextTokens` ของ runtime เริ่มต้น: `272000`

    ขีดจำกัดเริ่มต้นที่เล็กกว่ามีลักษณะ latency และคุณภาพที่ดีกว่าในทางปฏิบัติ แทนที่ได้ด้วย `contextTokens`:

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
    ใช้ `contextWindow` เพื่อประกาศ metadata โมเดลดั้งเดิม ใช้ `contextTokens` เพื่อจำกัดงบประมาณบริบท runtime.
    </Note>

    ### การกู้คืนแค็ตตาล็อก

    OpenClaw ใช้ metadata แค็ตตาล็อก Codex ต้นทางสำหรับ `gpt-5.5` เมื่อมีอยู่
    หากการค้นพบ Codex แบบสดละเว้นแถว `gpt-5.5` ในขณะที่
    บัญชีผ่านการยืนยันตัวตนแล้ว OpenClaw จะสังเคราะห์แถวโมเดล OAuth นั้นเพื่อให้
    การรัน Cron, sub-agent และโมเดลเริ่มต้นที่กำหนดค่าไว้ไม่ล้มเหลวด้วย
    `Unknown model`.

  </Tab>
</Tabs>

## การยืนยันตัวตน app-server Codex ดั้งเดิม

ชุดควบคุม app-server Codex ดั้งเดิมใช้อ้างอิงโมเดล `openai/*` พร้อมกับ
การละเว้นการกำหนดค่า runtime หรือ `agentRuntime.id: "codex"` แต่การยืนยันตัวตนยังคง
อิงตามบัญชี OpenClaw
เลือกการยืนยันตัวตนตามลำดับนี้:

1. โปรไฟล์การยืนยันตัวตน `openai-codex` ของ OpenClaw ที่ผูกกับเอเจนต์อย่างชัดเจน.
2. บัญชีที่มีอยู่ของ app-server เช่น การลงชื่อเข้าใช้ ChatGPT ของ Codex CLI ในเครื่อง.
3. สำหรับการเปิด app-server แบบ local stdio เท่านั้น ให้ใช้ `CODEX_API_KEY` แล้วจึง
   `OPENAI_API_KEY` เมื่อ app-server รายงานว่าไม่มีบัญชีและยังต้องใช้
   การยืนยันตัวตน OpenAI.

นั่นหมายความว่าการลงชื่อเข้าใช้ด้วยการสมัครสมาชิก ChatGPT/Codex ในเครื่องจะไม่ถูกแทนที่เพียงเพราะ
โปรเซส Gateway มี `OPENAI_API_KEY` สำหรับโมเดล OpenAI โดยตรง
หรือ embeddings ด้วย การ fallback ไปใช้ env API-key มีไว้สำหรับเส้นทาง local stdio ที่ไม่มีบัญชีเท่านั้น;
จะไม่ถูกส่งไปยังการเชื่อมต่อ app-server ผ่าน WebSocket เมื่อเลือกโปรไฟล์ Codex
แบบสมัครสมาชิก OpenClaw จะกัน `CODEX_API_KEY` และ `OPENAI_API_KEY`
ออกจาก child app-server แบบ stdio ที่ถูกสร้าง และส่งข้อมูลรับรองที่เลือก
ผ่าน RPC การเข้าสู่ระบบของ app-server.

## การสร้างภาพ

Plugin `openai` ที่รวมมาให้ลงทะเบียนการสร้างภาพผ่านเครื่องมือ `image_generate`.
รองรับทั้งการสร้างภาพด้วย OpenAI API-key และการสร้างภาพด้วย Codex OAuth
ผ่านอ้างอิงโมเดล `openai/gpt-image-2` เดียวกัน.

| ความสามารถ                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| อ้างอิงโมเดล                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| การยืนยันตัวตน                      | `OPENAI_API_KEY`                   | การลงชื่อเข้าใช้ OpenAI Codex OAuth           |
| Transport                 | OpenAI Images API                  | Codex Responses backend              |
| จำนวนภาพสูงสุดต่อคำขอ    | 4                                  | 4                                    |
| โหมดแก้ไข                 | เปิดใช้ (สูงสุด 5 ภาพอ้างอิง) | เปิดใช้ (สูงสุด 5 ภาพอ้างอิง)   |
| การแทนที่ขนาด            | รองรับ รวมถึงขนาด 2K/4K   | รองรับ รวมถึงขนาด 2K/4K     |
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
ดู [การสร้างภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือก provider และพฤติกรรม failover.
</Note>

`gpt-image-2` เป็นค่าเริ่มต้นสำหรับทั้งการสร้างภาพจากข้อความของ OpenAI และการ
แก้ไขภาพ `gpt-image-1.5`, `gpt-image-1` และ `gpt-image-1-mini` ยังคงใช้งานได้เป็น
การแทนที่โมเดลอย่างชัดเจน ใช้ `openai/gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP
ที่มีพื้นหลังโปร่งใส; API `gpt-image-2` ปัจจุบันปฏิเสธ
`background: "transparent"`.

สำหรับคำขอพื้นหลังโปร่งใส เอเจนต์ควรเรียก `image_generate` ด้วย
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` หรือ `"webp"` และ
`background: "transparent"`; ตัวเลือก provider `openai.background` รุ่นเก่า
ยังคงยอมรับ OpenClaw ยังปกป้องเส้นทาง OpenAI สาธารณะและ
OpenAI Codex OAuth โดยเขียนคำขอโปร่งใส `openai/gpt-image-2` เริ่มต้นใหม่
เป็น `gpt-image-1.5`; Azure และ endpoint แบบกำหนดเองที่เข้ากันได้กับ OpenAI จะคง
ชื่อ deployment/โมเดลที่กำหนดค่าไว้.

การตั้งค่าเดียวกันนี้เปิดเผยสำหรับการรัน CLI แบบ headless ด้วย:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

ใช้แฟล็ก `--output-format` และ `--background` เดียวกันกับ
`openclaw infer image edit` เมื่อเริ่มจากไฟล์อินพุต.
`--openai-background` ยังคงพร้อมใช้งานเป็น alias เฉพาะ OpenAI.

สำหรับการติดตั้ง Codex OAuth ให้ใช้อ้างอิง `openai/gpt-image-2` เดิม เมื่อมีการกำหนดค่า
โปรไฟล์ OAuth `openai-codex` OpenClaw จะ resolve โทเค็นการเข้าถึง OAuth
ที่เก็บไว้และส่งคำขอภาพผ่าน backend Codex Responses โดยจะไม่ลองใช้ `OPENAI_API_KEY`
ก่อนหรือ fallback เป็น API key อย่างเงียบๆ สำหรับคำขอนั้น
กำหนดค่า `models.providers.openai` อย่างชัดเจนด้วย API key,
URL ฐานแบบกำหนดเอง หรือ Azure endpoint เมื่อคุณต้องการเส้นทาง OpenAI Images API
โดยตรงแทน.
หาก endpoint ภาพแบบกำหนดเองนั้นอยู่บน LAN/ที่อยู่ส่วนตัวที่เชื่อถือได้ ให้ตั้งค่า
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ด้วย; OpenClaw จะยังคง
บล็อก endpoint ภาพที่เข้ากันได้กับ OpenAI แบบส่วนตัว/ภายใน เว้นแต่จะมี opt-in นี้.

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

Plugin `openai` ที่รวมมาให้ลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ `video_generate`.

| ความสามารถ       | ค่า                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| โมเดลเริ่มต้น    | `openai/sora-2`                                                                   |
| โหมด            | ข้อความเป็นวิดีโอ, ภาพเป็นวิดีโอ, แก้ไขวิดีโอเดี่ยว                                  |
| อินพุตอ้างอิง | 1 ภาพหรือ 1 วิดีโอ                                                                |
| การแทนที่ขนาด   | รองรับ                                                                         |
| การแทนที่อื่นๆ  | `aspectRatio`, `resolution`, `audio`, `watermark` จะถูกละเว้นพร้อมคำเตือนจากเครื่องมือ |

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือก provider และพฤติกรรม failover.
</Note>

## การมีส่วนร่วมพรอมป์ GPT-5

OpenClaw เพิ่มการมีส่วนร่วมพรอมป์ GPT-5 ร่วมสำหรับการรันตระกูล GPT-5 ข้าม provider โดยใช้ตาม id โมเดล ดังนั้น `openai/gpt-5.5`, อ้างอิงเดิมก่อนซ่อมแซม เช่น `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` และอ้างอิง GPT-5 อื่นๆ ที่เข้ากันได้จะได้รับ overlay เดียวกัน โมเดล GPT-4.x รุ่นเก่าจะไม่ได้รับ.

ชุดควบคุม Codex ดั้งเดิมที่รวมมาให้ใช้พฤติกรรม GPT-5 และ overlay Heartbeat เดียวกันผ่านคำสั่งสำหรับนักพัฒนาของ app-server Codex ดังนั้นเซสชัน `openai/gpt-5.x` ที่ถูกบังคับผ่าน `agentRuntime.id: "codex"` จะยังคงคำแนะนำเรื่องการติดตามงานให้จบและ Heartbeat เชิงรุกแบบเดิม แม้ว่า Codex จะเป็นเจ้าของส่วนที่เหลือของพรอมป์ชุดควบคุม.

การมีส่วนร่วมของ GPT-5 เพิ่มสัญญาพฤติกรรมแบบมีแท็กสำหรับการคงอยู่ของ persona, ความปลอดภัยในการดำเนินการ, วินัยการใช้เครื่องมือ, รูปแบบเอาต์พุต, การตรวจสอบความเสร็จสมบูรณ์ และการยืนยันผล พฤติกรรมการตอบกลับเฉพาะช่องทางและข้อความเงียบยังคงอยู่ในพรอมป์ระบบ OpenClaw ที่ใช้ร่วมกันและนโยบายการส่งออก คำแนะนำของ GPT-5 จะเปิดใช้งานเสมอสำหรับโมเดลที่ตรงกัน เลเยอร์รูปแบบการโต้ตอบที่เป็นมิตรแยกออกมาต่างหากและกำหนดค่าได้

| ค่า                    | ผลลัพธ์                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้เลเยอร์รูปแบบการโต้ตอบที่เป็นมิตร |
| `"on"`                 | ชื่อแทนของ `"friendly"`                      |
| `"off"`                | ปิดใช้งานเฉพาะเลเยอร์สไตล์ที่เป็นมิตร       |

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
ค่าต่าง ๆ ไม่แยกตัวพิมพ์ใหญ่เล็กขณะรันไทม์ ดังนั้น `"Off"` และ `"off"` จึงปิดใช้งานเลเยอร์สไตล์ที่เป็นมิตรได้ทั้งคู่
</Tip>

<Note>
`plugins.entries.openai.config.personality` แบบเดิมยังคงถูกอ่านเป็น fallback สำหรับความเข้ากันได้ เมื่อไม่ได้ตั้งค่า `agents.defaults.promptOverlays.gpt5.personality` ที่ใช้ร่วมกัน
</Note>

## เสียงและคำพูด

<AccordionGroup>
  <Accordion title="การสังเคราะห์เสียงพูด (TTS)">
    Plugin `openai` ที่รวมมาให้ลงทะเบียนการสังเคราะห์เสียงพูดสำหรับพื้นผิว `messages.tts`

    | การตั้งค่า | พาธการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | เสียง | `messages.tts.providers.openai.voice` | `coral` |
    | ความเร็ว | `messages.tts.providers.openai.speed` | (ไม่ได้ตั้งค่า) |
    | คำสั่ง | `messages.tts.providers.openai.instructions` | (ไม่ได้ตั้งค่า, เฉพาะ `gpt-4o-mini-tts`) |
    | รูปแบบ | `messages.tts.providers.openai.responseFormat` | `opus` สำหรับบันทึกเสียง, `mp3` สำหรับไฟล์ |
    | คีย์ API | `messages.tts.providers.openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |
    | URL ฐาน | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | body เพิ่มเติม | `messages.tts.providers.openai.extraBody` / `extra_body` | (ไม่ได้ตั้งค่า) |

    โมเดลที่มีให้ใช้: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd` เสียงที่มีให้ใช้: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`

    `extraBody` จะถูกรวมเข้าใน JSON คำขอ `/audio/speech` หลังฟิลด์ที่ OpenClaw สร้างขึ้น ดังนั้นให้ใช้สำหรับ endpoint ที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้คีย์เพิ่มเติม เช่น `lang` คีย์ prototype จะถูกละเว้น

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

  <Accordion title="เสียงพูดเป็นข้อความ">
    Plugin `openai` ที่รวมมาให้ลงทะเบียนการแปลงเสียงพูดเป็นข้อความแบบ batch ผ่าน
    พื้นผิว transcription สำหรับการเข้าใจสื่อของ OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - พาธอินพุต: การอัปโหลดไฟล์เสียงแบบ multipart
    - OpenClaw รองรับในทุกที่ที่การถอดเสียงเสียงขาเข้าใช้
      `tools.media.audio` รวมถึงส่วนเสียงของช่องเสียง Discord และไฟล์แนบเสียงของช่องทาง

    หากต้องการบังคับใช้ OpenAI สำหรับการถอดเสียงเสียงขาเข้า:

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
    การกำหนดค่าสื่อเสียงที่ใช้ร่วมกันหรือคำขอ transcription รายครั้ง

  </Accordion>

  <Accordion title="การถอดเสียงแบบเรียลไทม์">
    Plugin `openai` ที่รวมมาให้ลงทะเบียนการถอดเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | พาธการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | ภาษา | `...openai.language` | (ไม่ได้ตั้งค่า) |
    | พรอมป์ | `...openai.prompt` | (ไม่ได้ตั้งค่า) |
    | ระยะเวลาความเงียบ | `...openai.silenceDurationMs` | `800` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | คีย์ API | `...openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียง G.711 u-law (`g711_ulaw` / `audio/pcmu`) ผู้ให้บริการสตรีมมิงนี้ใช้สำหรับพาธการถอดเสียงแบบเรียลไทม์ของ Voice Call; ในปัจจุบันเสียง Discord จะบันทึกส่วนสั้น ๆ และใช้พาธการถอดเสียงแบบ batch `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="เสียงแบบเรียลไทม์">
    Plugin `openai` ที่รวมมาให้ลงทะเบียนเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | พาธการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | เสียง | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | ระยะเวลาความเงียบ | `...openai.silenceDurationMs` | `500` |
    | คีย์ API | `...openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |

    <Note>
    รองรับ Azure OpenAI ผ่านคีย์การกำหนดค่า `azureEndpoint` และ `azureDeployment` สำหรับ bridge เรียลไทม์ฝั่ง backend รองรับการเรียกใช้เครื่องมือแบบสองทิศทาง ใช้รูปแบบเสียง G.711 u-law
    </Note>

    <Note>
    Control UI Talk ใช้เซสชันเรียลไทม์ของ OpenAI บนเบราว์เซอร์ พร้อมความลับไคลเอนต์ชั่วคราวที่ Gateway สร้างให้ และการแลกเปลี่ยน WebRTC SDP โดยตรงจากเบราว์เซอร์กับ
    OpenAI Realtime API การยืนยันแบบสดสำหรับผู้ดูแลพร้อมใช้งานด้วย
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ส่วนของ OpenAI จะสร้างความลับไคลเอนต์ใน Node, สร้างข้อเสนอ SDP ของเบราว์เซอร์
    ด้วยสื่อไมโครโฟนจำลอง, ส่งไปยัง OpenAI และใช้คำตอบ SDP
    โดยไม่บันทึกความลับลง log
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint ของ Azure OpenAI

ผู้ให้บริการ `openai` ที่รวมมาให้สามารถชี้ไปยังทรัพยากร Azure OpenAI สำหรับการสร้างรูปภาพ
โดยแทนที่ URL ฐาน บนพาธการสร้างรูปภาพ OpenClaw
จะตรวจจับ hostname ของ Azure บน `models.providers.openai.baseUrl` และสลับไปใช้
รูปแบบคำขอของ Azure โดยอัตโนมัติ

<Note>
เสียงแบบเรียลไทม์ใช้พาธการกำหนดค่าแยกต่างหาก
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
และไม่ได้รับผลกระทบจาก `models.providers.openai.baseUrl` ดู accordion **เสียงแบบเรียลไทม์**
ใต้ [เสียงและคำพูด](#voice-and-speech) สำหรับการตั้งค่า Azure
</Note>

ใช้ Azure OpenAI เมื่อ:

- คุณมีการสมัครใช้งาน Azure OpenAI, โควตา หรือข้อตกลงระดับองค์กรอยู่แล้ว
- คุณต้องการการเก็บข้อมูลในภูมิภาคหรือการควบคุมด้านการปฏิบัติตามข้อกำหนดที่ Azure มีให้
- คุณต้องการเก็บ traffic ไว้ภายใน tenancy ของ Azure ที่มีอยู่

### การกำหนดค่า

สำหรับการสร้างรูปภาพ Azure ผ่านผู้ให้บริการ `openai` ที่รวมมาให้ ให้ชี้
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

OpenClaw จะรู้จัก suffix ของ host Azure ต่อไปนี้สำหรับ route
การสร้างรูปภาพของ Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

สำหรับคำขอสร้างรูปภาพบน host Azure ที่รู้จัก OpenClaw จะ:

- ส่ง header `api-key` แทน `Authorization: Bearer`
- ใช้พาธที่ผูกกับ deployment (`/openai/deployments/{deployment}/...`)
- เพิ่ม `?api-version=...` ต่อท้ายทุกคำขอ
- ใช้ timeout คำขอเริ่มต้น 600 วินาทีสำหรับการเรียกสร้างรูปภาพของ Azure
  ค่า `timeoutMs` รายคำขอยังคงแทนที่ค่าเริ่มต้นนี้ได้

URL ฐานอื่น ๆ (OpenAI สาธารณะ, proxy ที่เข้ากันได้กับ OpenAI) จะคงรูปแบบ
คำขอรูปภาพมาตรฐานของ OpenAI ไว้

<Note>
การ routing ของ Azure สำหรับพาธการสร้างรูปภาพของผู้ให้บริการ `openai` ต้องใช้
OpenClaw 2026.4.22 หรือใหม่กว่า เวอร์ชันก่อนหน้าจะถือว่า
`openai.baseUrl` แบบกำหนดเองใด ๆ เหมือน endpoint OpenAI สาธารณะ และจะล้มเหลวกับ deployment รูปภาพของ Azure
</Note>

### เวอร์ชัน API

ตั้งค่า `AZURE_OPENAI_API_VERSION` เพื่อ pin เวอร์ชัน preview หรือ GA ของ Azure ที่เฉพาะเจาะจง
สำหรับพาธการสร้างรูปภาพของ Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

ค่าเริ่มต้นคือ `2024-12-01-preview` เมื่อไม่ได้ตั้งค่าตัวแปร

### ชื่อโมเดลคือชื่อ deployment

Azure OpenAI ผูกโมเดลกับ deployment สำหรับคำขอสร้างรูปภาพของ Azure
ที่ route ผ่านผู้ให้บริการ `openai` ที่รวมมาให้ ฟิลด์ `model` ใน OpenClaw
ต้องเป็น **ชื่อ deployment ของ Azure** ที่คุณกำหนดค่าใน Azure portal ไม่ใช่
id โมเดล OpenAI สาธารณะ

หากคุณสร้าง deployment ชื่อ `gpt-image-2-prod` ที่ให้บริการ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

กฎชื่อ deployment เดียวกันนี้ใช้กับการเรียกสร้างรูปภาพที่ route ผ่าน
ผู้ให้บริการ `openai` ที่รวมมาให้

### ความพร้อมใช้งานตามภูมิภาค

การสร้างรูปภาพของ Azure มีให้ใช้ในปัจจุบันเฉพาะในบางภูมิภาค
(เช่น `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`) ตรวจสอบรายการภูมิภาคปัจจุบันของ Microsoft ก่อนสร้าง
deployment และยืนยันว่าโมเดลเฉพาะนั้นมีให้ใช้ในภูมิภาคของคุณ

### ความแตกต่างของพารามิเตอร์

Azure OpenAI และ OpenAI สาธารณะไม่ได้ยอมรับพารามิเตอร์รูปภาพเดียวกันเสมอไป
Azure อาจปฏิเสธตัวเลือกที่ OpenAI สาธารณะอนุญาต (เช่นค่า
`background` บางค่าบน `gpt-image-2`) หรือเปิดให้ใช้เฉพาะในเวอร์ชันโมเดลบางรุ่น
ความแตกต่างเหล่านี้มาจาก Azure และโมเดลพื้นฐาน ไม่ใช่
OpenClaw หากคำขอ Azure ล้มเหลวด้วยข้อผิดพลาดการตรวจสอบ ให้ตรวจสอบ
ชุดพารามิเตอร์ที่ deployment และเวอร์ชัน API เฉพาะของคุณรองรับใน
Azure portal

<Note>
Azure OpenAI ใช้ transport แบบ native และพฤติกรรม compat แต่ไม่ได้รับ
header ระบุแหล่งที่มาที่ซ่อนอยู่ของ OpenClaw — ดู accordion **Native vs OpenAI-compatible
routes** ใต้ [การกำหนดค่าขั้นสูง](#advanced-configuration)

สำหรับ traffic ของ chat หรือ Responses บน Azure (นอกเหนือจากการสร้างรูปภาพ) ให้ใช้
ขั้นตอน onboarding หรือการกำหนดค่าผู้ให้บริการ Azure โดยเฉพาะ — `openai.baseUrl` เพียงอย่างเดียว
จะไม่เลือกใช้รูปแบบ API/auth ของ Azure มีผู้ให้บริการ
`azure-openai-responses/*` แยกต่างหาก; ดู
accordion Server-side compaction ด้านล่าง
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw ใช้ WebSocket เป็นหลักพร้อม SSE fallback (`"auto"`) สำหรับ `openai/*`

    ในโหมด `"auto"` OpenClaw จะ:
    - ลองใหม่หนึ่งครั้งเมื่อ WebSocket ล้มเหลวตั้งแต่ต้น ก่อน fallback ไปยัง SSE
    - หลังจากเกิดความล้มเหลว จะทำเครื่องหมาย WebSocket ว่าเสื่อมคุณภาพประมาณ 60 วินาที และใช้ SSE ระหว่างช่วง cool-down
    - แนบ header ระบุตัวตนเซสชันและ turn ที่เสถียรสำหรับการลองใหม่และการเชื่อมต่อใหม่
    - ทำให้ตัวนับการใช้งาน (`input_tokens` / `prompt_tokens`) เป็นมาตรฐานข้าม variant ของ transport

    | ค่า | พฤติกรรม |
    |-------|----------|
    | `"auto"` (ค่าเริ่มต้น) | WebSocket ก่อน, SSE fallback |
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
    - [Realtime API กับ WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [การตอบสนอง Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="การอุ่นเครื่อง WebSocket">
    OpenClaw เปิดใช้การอุ่นเครื่อง WebSocket เป็นค่าเริ่มต้นสำหรับ `openai/*` เพื่อลดเวลาแฝงของเทิร์นแรก

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
    OpenClaw มีสวิตช์โหมดเร็วแบบใช้ร่วมกันสำหรับ `openai/*`:

    - **แชต/UI:** `/fast status|on|off`
    - **การตั้งค่า:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

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
    การแทนที่ระดับเซสชันมีสิทธิ์เหนือกว่าการตั้งค่า การล้างการแทนที่ระดับเซสชันใน UI เซสชันจะคืนเซสชันกลับไปใช้ค่าเริ่มต้นที่กำหนดไว้
    </Note>

  </Accordion>

  <Accordion title="การประมวลผลแบบมีลำดับความสำคัญ (service_tier)">
    API ของ OpenAI เปิดให้ใช้การประมวลผลแบบมีลำดับความสำคัญผ่าน `service_tier` ตั้งค่านี้ต่อโมเดลใน OpenClaw:

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
    `serviceTier` จะถูกส่งต่อเฉพาะไปยัง endpoint เนทีฟของ OpenAI (`api.openai.com`) และ endpoint เนทีฟของ Codex (`chatgpt.com/backend-api`) เท่านั้น หากคุณกำหนดเส้นทางของผู้ให้บริการใดผู้ให้บริการหนึ่งผ่านพร็อกซี OpenClaw จะปล่อย `service_tier` ไว้โดยไม่แตะต้อง
    </Warning>

  </Accordion>

  <Accordion title="Compaction ฝั่งเซิร์ฟเวอร์ (Responses API)">
    สำหรับโมเดล OpenAI Responses โดยตรง (`openai/*` บน `api.openai.com`) ตัวห่อหุ้มสตรีม Pi-harness ของ Plugin OpenAI จะเปิดใช้ Compaction ฝั่งเซิร์ฟเวอร์โดยอัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ความเข้ากันได้ของโมเดลตั้งค่า `supportsStore: false`)
    - แทรก `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - ค่าเริ่มต้นของ `compact_threshold`: 70% ของ `contextWindow` (หรือ `80000` เมื่อไม่มีข้อมูล)

    สิ่งนี้มีผลกับเส้นทาง Pi harness ในตัว และกับฮุกของผู้ให้บริการ OpenAI ที่ใช้โดยการรันแบบฝังตัว ฮาร์เนส app-server เนทีฟของ Codex จะจัดการบริบทของตัวเองผ่าน Codex และกำหนดค่าแยกต่างหากด้วย `agents.defaults.agentRuntime.id`

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
    `responsesServerCompaction` ควบคุมเฉพาะการแทรก `context_management` เท่านั้น โมเดล OpenAI Responses โดยตรงยังคงบังคับ `store: true` เว้นแต่ความเข้ากันได้จะตั้งค่า `supportsStore: false`
    </Note>

  </Accordion>

  <Accordion title="โหมด GPT แบบ strict-agentic">
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

    เมื่อใช้ `strict-agentic` OpenClaw จะ:
    - ไม่ถือว่าเทิร์นที่มีแต่แผนเป็นความคืบหน้าที่สำเร็จอีกต่อไปเมื่อมีการกระทำของเครื่องมือให้ใช้งาน
    - ลองเทิร์นนั้นอีกครั้งด้วยการชี้นำให้ลงมือทันที
    - เปิดใช้ `update_plan` โดยอัตโนมัติสำหรับงานที่มีสาระสำคัญ
    - แสดงสถานะถูกบล็อกอย่างชัดเจนหากโมเดลยังคงวางแผนโดยไม่ลงมือทำ

    <Note>
    จำกัดขอบเขตเฉพาะการรันตระกูล GPT-5 ของ OpenAI และ Codex เท่านั้น ผู้ให้บริการรายอื่นและตระกูลโมเดลที่เก่ากว่าจะยังคงใช้พฤติกรรมเริ่มต้น
    </Note>

  </Accordion>

  <Accordion title="เส้นทางแบบเนทีฟเทียบกับเส้นทางที่เข้ากันได้กับ OpenAI">
    OpenClaw ปฏิบัติต่อ endpoint โดยตรงของ OpenAI, Codex และ Azure OpenAI แตกต่างจากพร็อกซี `/v1` ทั่วไปที่เข้ากันได้กับ OpenAI:

    **เส้นทางแบบเนทีฟ** (`openai/*`, Azure OpenAI):
    - คง `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับ effort `none` ของ OpenAI
    - ละเว้น reasoning ที่ปิดใช้งานสำหรับโมเดลหรือพร็อกซีที่ปฏิเสธ `reasoning.effort: "none"`
    - ตั้งค่า schema ของเครื่องมือเป็นโหมดเข้มงวดโดยค่าเริ่มต้น
    - แนบเฮดเดอร์การระบุที่มาที่ซ่อนไว้เฉพาะบนโฮสต์เนทีฟที่ยืนยันแล้วเท่านั้น
    - คงการปรับรูปคำขอเฉพาะของ OpenAI (`service_tier`, `store`, ความเข้ากันได้ของ reasoning, คำใบ้ prompt-cache)

    **เส้นทางพร็อกซี/ที่เข้ากันได้:**
    - ใช้พฤติกรรมความเข้ากันได้ที่ผ่อนปรนกว่า
    - ตัด Completions `store` ออกจากเพย์โหลด `openai-completions` ที่ไม่ใช่เนทีฟ
    - ยอมรับ JSON ส่งผ่านขั้นสูง `params.extra_body`/`params.extraBody` สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI
    - ยอมรับ `params.chat_template_kwargs` สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI เช่น vLLM
    - ไม่บังคับใช้ schema เครื่องมือแบบเข้มงวดหรือเฮดเดอร์เฉพาะเนทีฟ

    Azure OpenAI ใช้ทรานสปอร์ตเนทีฟและพฤติกรรมความเข้ากันได้ แต่จะไม่ได้รับเฮดเดอร์การระบุที่มาที่ซ่อนไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือสร้างภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือสร้างวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="OAuth และการรับรองความถูกต้อง" href="/th/gateway/authentication" icon="key">
    รายละเอียดการรับรองความถูกต้องและกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
