---
read_when:
    - คุณต้องการใช้โมเดล OpenAI ใน OpenClaw
    - คุณต้องการใช้การยืนยันตัวตนผ่านการสมัครใช้งาน Codex แทนคีย์ API
    - คุณต้องการพฤติกรรมการดำเนินการของเอเจนต์ GPT-5 ที่เข้มงวดยิ่งขึ้น
summary: ใช้ OpenAI ผ่านคีย์ API หรือการสมัครใช้งาน Codex ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T19:35:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fda2acdb0e249f0481ab1aa20bb5ff317709bc9536f60c45be9e2d63c44702e
    source_path: providers/openai.md
    workflow: 16
---

OpenAI มี API สำหรับนักพัฒนาสำหรับโมเดล GPT และ Codex ยังพร้อมใช้งานเป็นเอเจนต์เขียนโค้ดในแผน ChatGPT ผ่านไคลเอนต์ Codex ของ OpenAI ด้วย OpenClaw แยกพื้นผิวเหล่านี้ออกจากกันเพื่อให้การกำหนดค่าคาดเดาได้

OpenClaw รองรับเส้นทางตระกูล OpenAI สามเส้นทาง ผู้สมัครใช้งาน ChatGPT/Codex ส่วนใหญ่ที่ต้องการพฤติกรรมแบบ Codex ควรใช้รันไทม์เซิร์ฟเวอร์แอป Codex แบบเนทีฟ คำนำหน้าโมเดลเลือกผู้ให้บริการ/ชื่อโมเดล ส่วนการตั้งค่ารันไทม์แยกต่างหากเลือกว่าใครเป็นผู้รันลูปเอเจนต์แบบฝัง:

- **คีย์ API** - การเข้าถึง OpenAI Platform โดยตรงพร้อมการเรียกเก็บเงินตามการใช้งาน (โมเดล `openai/*`)
- **การสมัครใช้งาน Codex พร้อมรันไทม์ Codex แบบเนทีฟ** - การลงชื่อเข้าใช้ ChatGPT/Codex พร้อมการรันผ่านเซิร์ฟเวอร์แอป Codex (โมเดล `openai/*` และ `agents.defaults.agentRuntime.id: "codex"`)
- **การสมัครใช้งาน Codex ผ่าน PI** - การลงชื่อเข้าใช้ ChatGPT/Codex ด้วยตัวรัน OpenClaw PI ปกติ (โมเดล `openai-codex/*`)

OpenAI รองรับการใช้งาน OAuth จากการสมัครใช้งานในเครื่องมือและเวิร์กโฟลว์ภายนอกอย่าง OpenClaw อย่างชัดเจน

ผู้ให้บริการ โมเดล รันไทม์ และช่องทางเป็นเลเยอร์ที่แยกจากกัน หากป้ายกำกับเหล่านั้นเริ่มปะปนกัน ให้อ่าน [รันไทม์เอเจนต์](/th/concepts/agent-runtimes) ก่อนเปลี่ยนการกำหนดค่า

## ตัวเลือกแบบเร็ว

| เป้าหมาย                                                 | ใช้                                              | หมายเหตุ                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| การสมัครใช้งาน ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-5.5` บวก `agentRuntime.id: "codex"` | การตั้งค่า Codex ที่แนะนำสำหรับผู้ใช้ส่วนใหญ่ ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน `openai-codex` |
| การเรียกเก็บเงินด้วยคีย์ API โดยตรง                               | `openai/gpt-5.5`                                 | ตั้งค่า `OPENAI_API_KEY` หรือรันการเริ่มต้นใช้งานคีย์ API ของ OpenAI                    |
| การยืนยันตัวตนการสมัครใช้งาน ChatGPT/Codex ผ่าน PI           | `openai-codex/gpt-5.5`                           | ใช้เฉพาะเมื่อคุณตั้งใจต้องการตัวรัน PI ปกติ                |
| การสร้างหรือแก้ไขรูปภาพ                          | `openai/gpt-image-2`                             | ทำงานได้กับทั้ง `OPENAI_API_KEY` หรือ OpenAI Codex OAuth                 |
| รูปภาพพื้นหลังโปร่งใส                        | `openai/gpt-image-1.5`                           | ใช้ `outputFormat=png` หรือ `webp` และ `openai.background=transparent`     |

## แผนที่ชื่อ

ชื่อคล้ายกันแต่ใช้แทนกันไม่ได้:

| ชื่อที่คุณเห็น                       | เลเยอร์             | ความหมาย                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | คำนำหน้าผู้ให้บริการ   | เส้นทาง OpenAI Platform API โดยตรง                                                                 |
| `openai-codex`                     | คำนำหน้าผู้ให้บริการ   | เส้นทาง OpenAI Codex OAuth/การสมัครใช้งานผ่านตัวรัน OpenClaw PI ปกติ                      |
| Plugin `codex`                     | Plugin            | Plugin ที่มาพร้อม OpenClaw ซึ่งให้รันไทม์เซิร์ฟเวอร์แอป Codex แบบเนทีฟและตัวควบคุมแชต `/codex` |
| `agentRuntime.id: codex`           | รันไทม์เอเจนต์     | บังคับใช้ฮาร์เนสเซิร์ฟเวอร์แอป Codex แบบเนทีฟสำหรับเทิร์นแบบฝัง                                     |
| `/codex ...`                       | ชุดคำสั่งแชต  | ผูก/ควบคุมเธรดเซิร์ฟเวอร์แอป Codex จากการสนทนา                                        |
| `runtime: "acp", agentId: "codex"` | เส้นทางเซสชัน ACP | เส้นทางสำรองอย่างชัดเจนที่รัน Codex ผ่าน ACP/acpx                                          |

ซึ่งหมายความว่าการกำหนดค่าสามารถมีทั้ง `openai-codex/*` และ Plugin `codex` ได้โดยตั้งใจ สิ่งนี้ถูกต้องเมื่อคุณต้องการ Codex OAuth ผ่าน PI และยังต้องการให้มีตัวควบคุมแชต `/codex` แบบเนทีฟพร้อมใช้งานด้วย `openclaw doctor` จะเตือนเกี่ยวกับชุดค่านี้เพื่อให้คุณยืนยันได้ว่าเป็นความตั้งใจจริง และจะไม่เขียนทับค่าให้ใหม่

<Note>
GPT-5.5 พร้อมใช้งานผ่านทั้งการเข้าถึงด้วยคีย์ API ของ OpenAI Platform โดยตรงและเส้นทางการสมัครใช้งาน/OAuth สำหรับการสมัครใช้งาน ChatGPT/Codex พร้อมการรัน Codex แบบเนทีฟ ให้ใช้ `openai/gpt-5.5` กับ `agentRuntime.id: "codex"` ใช้ `openai-codex/gpt-5.5` เฉพาะสำหรับ Codex OAuth ผ่าน PI หรือใช้ `openai/gpt-5.5` โดยไม่มีการแทนที่รันไทม์ Codex สำหรับทราฟฟิก `OPENAI_API_KEY` โดยตรง
</Note>

<Note>
การเปิดใช้ Plugin OpenAI หรือการเลือกโมเดล `openai-codex/*` จะไม่เปิดใช้ Plugin เซิร์ฟเวอร์แอป Codex ที่มาพร้อมระบบ OpenClaw เปิดใช้ Plugin นั้นเฉพาะเมื่อคุณเลือกฮาร์เนส Codex แบบเนทีฟอย่างชัดเจนด้วย `agentRuntime.id: "codex"` หรือใช้การอ้างอิงโมเดล `codex/*` แบบเก่า
หาก Plugin `codex` ที่มาพร้อมระบบถูกเปิดใช้ แต่ `openai-codex/*` ยัง resolve ผ่าน PI อยู่ `openclaw doctor` จะเตือนและปล่อยเส้นทางไว้ตามเดิม
</Note>

## ความครอบคลุมฟีเจอร์ของ OpenClaw

| ความสามารถของ OpenAI         | พื้นผิวของ OpenClaw                                           | สถานะ                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| แชต / Responses          | ผู้ให้บริการโมเดล `openai/<model>`                            | ใช่                                                    |
| โมเดลการสมัครใช้งาน Codex | `openai-codex/<model>` พร้อม `openai-codex` OAuth           | ใช่                                                    |
| ฮาร์เนสเซิร์ฟเวอร์แอป Codex  | `openai/<model>` พร้อม `agentRuntime.id: codex`             | ใช่                                                    |
| การค้นเว็บฝั่งเซิร์ฟเวอร์    | เครื่องมือ OpenAI Responses แบบเนทีฟ                               | ใช่ เมื่อเปิดใช้การค้นเว็บและไม่ได้ตรึงผู้ให้บริการ |
| รูปภาพ                    | `image_generate`                                           | ใช่                                                    |
| วิดีโอ                    | `video_generate`                                           | ใช่                                                    |
| ข้อความเป็นเสียง            | `messages.tts.provider: "openai"` / `tts`                  | ใช่                                                    |
| การถอดเสียงเป็นข้อความแบบแบตช์      | `tools.media.audio` / การทำความเข้าใจสื่อ                  | ใช่                                                    |
| การถอดเสียงเป็นข้อความแบบสตรีม  | Voice Call `streaming.provider: "openai"`                  | ใช่                                                    |
| เสียงแบบเรียลไทม์            | Voice Call `realtime.provider: "openai"` / Control UI Talk | ใช่                                                    |
| Embeddings                | ผู้ให้บริการ embedding หน่วยความจำ                                  | ใช่                                                    |

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

สำหรับปลายทางที่เข้ากันได้กับ OpenAI ซึ่งต้องการป้ายกำกับ embedding แบบอสมมาตร ให้ตั้งค่า `queryInputType` และ `documentInputType` ภายใต้ `memorySearch` OpenClaw จะส่งค่าพวกนั้นต่อเป็นฟิลด์คำขอ `input_type` เฉพาะผู้ให้บริการ: query embeddings ใช้ `queryInputType`; ชังก์หน่วยความจำที่ทำดัชนีและการทำดัชนีแบบแบตช์ใช้ `documentInputType` ดูตัวอย่างเต็มได้ใน [เอกสารอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config#provider-specific-config)

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการและทำตามขั้นตอนการตั้งค่า

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
    | `openai/gpt-5.5`       | ละไว้ / `agentRuntime.id: "pi"`    | OpenAI Platform API โดยตรง  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | ละไว้ / `agentRuntime.id: "pi"`    | OpenAI Platform API โดยตรง  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | ฮาร์เนสเซิร์ฟเวอร์แอป Codex    | เซิร์ฟเวอร์แอป Codex |

    <Note>
    `openai/*` คือเส้นทางคีย์ API ของ OpenAI โดยตรง เว้นแต่คุณจะบังคับใช้ฮาร์เนสเซิร์ฟเวอร์แอป Codex อย่างชัดเจน ใช้ `openai-codex/*` สำหรับ Codex OAuth ผ่านตัวรัน PI เริ่มต้น หรือใช้ `openai/gpt-5.5` กับ `agentRuntime.id: "codex"` สำหรับการรันเซิร์ฟเวอร์แอป Codex แบบเนทีฟ
    </Note>

    ### ตัวอย่างการกำหนดค่า

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **ไม่** เปิดเผย `openai/gpt-5.3-codex-spark` คำขอ OpenAI API แบบสดจะปฏิเสธโมเดลนั้น และแค็ตตาล็อก Codex ปัจจุบันก็ไม่ได้เปิดเผยโมเดลนั้นเช่นกัน
    </Warning>

  </Tab>

  <Tab title="การสมัครใช้งาน Codex">
    **เหมาะสำหรับ:** การใช้การสมัครใช้งาน ChatGPT/Codex ของคุณกับการรันเซิร์ฟเวอร์แอป Codex แบบเนทีฟแทนคีย์ API แยกต่างหาก Codex cloud ต้องใช้การลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="รัน Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        หรือรัน OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        สำหรับการตั้งค่าแบบไม่มีส่วนติดต่อหรือไม่สะดวกรับ callback ให้เพิ่ม `--device-code` เพื่อลงชื่อเข้าใช้ด้วยโฟลว์รหัสอุปกรณ์ของ ChatGPT แทน callback เบราว์เซอร์ localhost:

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

        หลังจาก Gateway ทำงานแล้ว ให้ส่ง `/codex status` หรือ `/codex models` ในแชตเพื่อตรวจสอบรันไทม์เซิร์ฟเวอร์แอปแบบเนทีฟ
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | การอ้างอิงโมเดล | การกำหนดค่ารันไทม์ | เส้นทาง | การยืนยันตัวตน |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | ฮาร์เนสเซิร์ฟเวอร์แอป Codex แบบเนทีฟ | การลงชื่อเข้าใช้ Codex หรือโปรไฟล์ `openai-codex` ที่เลือก |
    | `openai-codex/gpt-5.5` | ละไว้ / `runtime: "pi"` | ChatGPT/Codex OAuth ผ่าน PI | การลงชื่อเข้าใช้ Codex |
    | `openai-codex/gpt-5.4-mini` | ละไว้ / `runtime: "pi"` | ChatGPT/Codex OAuth ผ่าน PI | การลงชื่อเข้าใช้ Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | ยังเป็น PI เว้นแต่ Plugin จะอ้างสิทธิ์ `openai-codex` อย่างชัดเจน | การลงชื่อเข้าใช้ Codex |

    <Warning>
    อย่ากำหนดค่าการอ้างอิงโมเดล `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` หรือ `openai-codex/gpt-5.3*` ที่เก่ากว่า บัญชี ChatGPT/Codex OAuth ตอนนี้ปฏิเสธโมเดลเหล่านั้นแล้ว ใช้ `openai-codex/gpt-5.5` สำหรับเส้นทาง PI OAuth หรือ `openai/gpt-5.5` กับ `agentRuntime.id: "codex"` สำหรับการรันด้วยรันไทม์ Codex แบบเนทีฟ
    </Warning>

    <Note>
    ใช้ id ผู้ให้บริการ `openai-codex` สำหรับคำสั่ง auth/profile ต่อไป พรีฟิกซ์โมเดล
    `openai-codex/*` ยังเป็นเส้นทาง PI แบบชัดเจนสำหรับ Codex OAuth ด้วย
    มันไม่ได้เลือกหรือเปิดใช้งานชุด harness ของ app-server Codex ที่รวมมาให้โดยอัตโนมัติ สำหรับ
    การตั้งค่าทั่วไปแบบ subscription พร้อม runtime เนทีฟ ให้ลงชื่อเข้าใช้ด้วย
    `openai-codex` แต่คง model ref เป็น `openai/gpt-5.5` และตั้งค่า
    `agentRuntime.id: "codex"`
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

    หากต้องการคง Codex OAuth ไว้บนตัวรัน PI ปกติแทน ให้ใช้
    `openai-codex/gpt-5.5` และละเว้นการ override runtime ของ Codex

    <Note>
    Onboarding จะไม่นำเข้าข้อมูล OAuth จาก `~/.codex` อีกต่อไป ให้ลงชื่อเข้าใช้ด้วย OAuth ผ่านเบราว์เซอร์ (ค่าเริ่มต้น) หรือ flow แบบ device-code ด้านบน — OpenClaw จะจัดการ credentials ที่ได้ใน auth store ของ agent เอง
    </Note>

    ### ตรวจสอบและกู้คืนการกำหนดเส้นทาง Codex OAuth

    ใช้คำสั่งเหล่านี้เพื่อดูว่า agent เริ่มต้นของคุณกำลังใช้โมเดล, runtime และเส้นทาง auth ใด:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    สำหรับ agent เฉพาะ ให้เพิ่ม `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    หากการรัน `doctor --fix` ใน 2026.5.5 เปลี่ยนการตั้งค่า subscription ของ GPT-5.5 จาก
    `openai-codex/gpt-5.5` เป็น `openai/gpt-5.5` ให้เปลี่ยน agent เริ่มต้นกลับ
    ไปยังเส้นทาง PI ของ Codex OAuth:

    ```bash
    openclaw models set openai-codex/gpt-5.5
    openclaw config validate
    ```

    หาก `models auth list --provider openai-codex` ไม่แสดงโปรไฟล์ที่ใช้งานได้ ให้ลงชื่อ
    เข้าใช้อีกครั้ง:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex/*` หมายถึง ChatGPT/Codex OAuth ผ่าน PI ส่วน `openai/*` พร้อม
    `agentRuntime.id: "codex"` หมายถึงการรัน app-server Codex แบบเนทีฟ

    ### ตัวบ่งชี้สถานะ

    Chat `/status` แสดงว่า runtime ของโมเดลใดกำลังทำงานสำหรับ session ปัจจุบัน
    harness PI เริ่มต้นจะแสดงเป็น `Runtime: OpenClaw Pi Default` เมื่อเลือก
    harness app-server Codex ที่รวมมาให้ `/status` จะแสดง
    `Runtime: OpenAI Codex` session ที่มีอยู่จะคง id harness ที่บันทึกไว้ ดังนั้นให้ใช้
    `/new` หรือ `/reset` หลังจากเปลี่ยน `agentRuntime` หากคุณต้องการให้ `/status`
    สะท้อนตัวเลือก PI/Codex ใหม่

    ### คำเตือนจาก Doctor

    หาก Plugin `codex` ที่รวมมาให้เปิดใช้งานอยู่ขณะที่เลือกเส้นทาง `openai-codex/*`
    `openclaw doctor` จะเตือนว่าโมเดลยังคง resolve ผ่าน PI
    คงการกำหนดค่าไว้ไม่เปลี่ยนแปลงเฉพาะเมื่อเส้นทาง subscription-auth ของ PI นั้น
    เป็นความตั้งใจ ให้เปลี่ยนเป็น `openai/<model>` พร้อม `agentRuntime.id: "codex"` เมื่อ
    คุณต้องการการรัน app-server Codex แบบเนทีฟ

    ### ขีดจำกัดหน้าต่างบริบท

    OpenClaw ถือว่า metadata ของโมเดลและขีดจำกัดบริบทของ runtime เป็นคนละค่ากัน

    สำหรับ `openai-codex/gpt-5.5` ผ่าน Codex OAuth:

    - `contextWindow` เนทีฟ: `1000000`
    - ขีดจำกัด `contextTokens` ของ runtime เริ่มต้น: `272000`

    ขีดจำกัดเริ่มต้นที่เล็กกว่ามีลักษณะ latency และคุณภาพที่ดีกว่าในการใช้งานจริง Override ด้วย `contextTokens`:

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
    ใช้ `contextWindow` เพื่อประกาศ metadata ของโมเดลเนทีฟ ใช้ `contextTokens` เพื่อจำกัดงบประมาณบริบทของ runtime
    </Note>

    ### การกู้คืนแค็ตตาล็อก

    OpenClaw ใช้ metadata แค็ตตาล็อก Codex จาก upstream สำหรับ `gpt-5.5` เมื่อมีอยู่
    หาก live discovery ของ Codex ละเว้นแถว `openai-codex/gpt-5.5` ขณะที่
    account ได้รับการ authenticate แล้ว OpenClaw จะสังเคราะห์แถวโมเดล OAuth นั้นขึ้นมาเพื่อให้
    การรัน cron, sub-agent และ default-model ที่กำหนดค่าไว้ไม่ล้มเหลวด้วย
    `Unknown model`

  </Tab>
</Tabs>

## Auth ของ app-server Codex แบบเนทีฟ

harness app-server Codex แบบเนทีฟใช้ model refs `openai/*` พร้อม
`agentRuntime.id: "codex"` แต่ auth ของมันยังคงอิงตาม account OpenClaw
เลือก auth ตามลำดับนี้:

1. โปรไฟล์ auth `openai-codex` ของ OpenClaw แบบชัดเจนที่ผูกกับ agent
2. account ที่มีอยู่ของ app-server เช่นการลงชื่อเข้าใช้ ChatGPT ของ Codex CLI ในเครื่อง
3. สำหรับการเปิด app-server แบบ stdio ในเครื่องเท่านั้น ใช้ `CODEX_API_KEY` แล้วจึง
   `OPENAI_API_KEY` เมื่อ app-server รายงานว่าไม่มี account และยังต้องใช้
   auth ของ OpenAI

นั่นหมายความว่าการลงชื่อเข้าใช้ subscription ของ ChatGPT/Codex ในเครื่องจะไม่ถูกแทนที่เพียงเพราะ
กระบวนการ gateway มี `OPENAI_API_KEY` สำหรับโมเดล OpenAI แบบ direct
หรือ embeddings ด้วย fallback ของ env API-key เป็นเพียงเส้นทาง stdio ในเครื่องที่ไม่มี account เท่านั้น; มัน
จะไม่ถูกส่งไปยังการเชื่อมต่อ app-server แบบ WebSocket เมื่อเลือกโปรไฟล์ Codex
แบบ subscription แล้ว OpenClaw จะกัน `CODEX_API_KEY` และ `OPENAI_API_KEY`
ออกจาก child app-server แบบ stdio ที่ spawn ขึ้นมา และส่ง credentials ที่เลือก
ผ่าน RPC login ของ app-server

## การสร้างรูปภาพ

Plugin `openai` ที่รวมมาให้ลงทะเบียนการสร้างรูปภาพผ่านเครื่องมือ `image_generate`
รองรับทั้งการสร้างรูปภาพด้วย API key ของ OpenAI และการสร้างรูปภาพด้วย Codex OAuth
ผ่าน model ref เดียวกันคือ `openai/gpt-image-2`

| ความสามารถ                | API key ของ OpenAI                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | การลงชื่อเข้าใช้ OpenAI Codex OAuth           |
| Transport                 | OpenAI Images API                  | แบ็กเอนด์ Codex Responses              |
| จำนวนรูปภาพสูงสุดต่อคำขอ    | 4                                  | 4                                    |
| โหมดแก้ไข                 | เปิดใช้งาน (สูงสุด 5 รูปภาพอ้างอิง) | เปิดใช้งาน (สูงสุด 5 รูปภาพอ้างอิง)   |
| การ override ขนาด            | รองรับ รวมถึงขนาด 2K/4K   | รองรับ รวมถึงขนาด 2K/4K     |
| อัตราส่วนภาพ / ความละเอียด | ไม่ส่งต่อไปยัง OpenAI Images API | จับคู่กับขนาดที่รองรับเมื่อปลอดภัย |

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
ดู [การสร้างรูปภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

`gpt-image-2` เป็นค่าเริ่มต้นสำหรับทั้งการสร้างรูปภาพจากข้อความของ OpenAI และการ
แก้ไขรูปภาพ `gpt-image-1.5`, `gpt-image-1` และ `gpt-image-1-mini` ยังคงใช้งานได้เป็น
การ override โมเดลแบบชัดเจน ใช้ `openai/gpt-image-1.5` สำหรับเอาต์พุต
PNG/WebP พื้นหลังโปร่งใส; API `gpt-image-2` ปัจจุบันปฏิเสธ
`background: "transparent"`

สำหรับคำขอพื้นหลังโปร่งใส agent ควรเรียก `image_generate` ด้วย
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` หรือ `"webp"` และ
`background: "transparent"`; ตัวเลือกผู้ให้บริการ `openai.background` แบบเก่า
ยังคงยอมรับอยู่ OpenClaw ยังปกป้องเส้นทาง OpenAI สาธารณะและ
OpenAI Codex OAuth โดยเขียนคำขอพื้นหลังโปร่งใสที่ใช้ค่าเริ่มต้น `openai/gpt-image-2`
ใหม่เป็น `gpt-image-1.5`; Azure และ endpoint แบบกำหนดเองที่เข้ากันได้กับ OpenAI จะคง
ชื่อ deployment/model ที่กำหนดค่าไว้

การตั้งค่าเดียวกันนี้แสดงให้ใช้สำหรับการรัน CLI แบบ headless ด้วย:

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
`--openai-background` ยังคงใช้ได้เป็น alias เฉพาะ OpenAI

สำหรับการติดตั้ง Codex OAuth ให้คง ref `openai/gpt-image-2` เดิมไว้ เมื่อมีการกำหนดค่า
โปรไฟล์ OAuth `openai-codex` แล้ว OpenClaw จะ resolve OAuth
access token ที่เก็บไว้และส่งคำขอรูปภาพผ่านแบ็กเอนด์ Codex Responses มัน
จะไม่ลองใช้ `OPENAI_API_KEY` ก่อนหรือ fallback ไปยัง API key แบบเงียบๆ สำหรับคำขอนั้น
กำหนดค่า `models.providers.openai` อย่างชัดเจนด้วย API key,
base URL แบบกำหนดเอง หรือ endpoint ของ Azure เมื่อคุณต้องการเส้นทาง OpenAI Images API
แบบ direct แทน
หาก endpoint รูปภาพแบบกำหนดเองนั้นอยู่บน LAN/ที่อยู่ส่วนตัวที่เชื่อถือได้ ให้ตั้งค่า
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ด้วย; OpenClaw จะยังคง
บล็อก endpoint รูปภาพส่วนตัว/ภายในที่เข้ากันได้กับ OpenAI เว้นแต่จะมีการ opt-in นี้

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
| โมเดลเริ่มต้น    | `openai/sora-2`                                                                   |
| โหมด            | ข้อความเป็นวิดีโอ, รูปภาพเป็นวิดีโอ, การแก้ไขวิดีโอเดี่ยว                                  |
| อินพุตอ้างอิง | 1 รูปภาพ หรือ 1 วิดีโอ                                                                |
| การ override ขนาด   | รองรับ                                                                         |
| การ override อื่นๆ  | `aspectRatio`, `resolution`, `audio`, `watermark` จะถูกละเว้นพร้อมคำเตือนจากเครื่องมือ |

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

## การมีส่วนร่วมของ prompt GPT-5

OpenClaw เพิ่มการมีส่วนร่วมของ prompt GPT-5 แบบใช้ร่วมกันสำหรับการรันตระกูล GPT-5 ข้ามผู้ให้บริการ มันใช้ตาม id โมเดล ดังนั้น `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` และ GPT-5 refs อื่นที่เข้ากันได้จะได้รับ overlay เดียวกัน โมเดล GPT-4.x ที่เก่ากว่าจะไม่ได้รับ

harness Codex แบบเนทีฟที่รวมมาให้ใช้พฤติกรรม GPT-5 เดียวกันและ overlay Heartbeat ผ่านคำสั่ง developer ของ app-server Codex ดังนั้น session `openai/gpt-5.x` ที่บังคับผ่าน `agentRuntime.id: "codex"` จะคงคำแนะนำ follow-through และ Heartbeat เชิงรุกแบบเดียวกัน แม้ Codex จะเป็นเจ้าของส่วนที่เหลือของ prompt harness ก็ตาม

การมีส่วนร่วมของ GPT-5 เพิ่มสัญญาพฤติกรรมแบบ tagged สำหรับการคงอยู่ของ persona, ความปลอดภัยในการดำเนินการ, วินัยในการใช้เครื่องมือ, รูปแบบเอาต์พุต, การตรวจสอบความเสร็จสมบูรณ์ และการยืนยัน พฤติกรรมการตอบกลับเฉพาะช่องทางและ silent-message ยังคงอยู่ใน system prompt ร่วมของ OpenClaw และนโยบาย outbound delivery คำแนะนำ GPT-5 จะเปิดใช้งานเสมอสำหรับโมเดลที่ตรงกัน เลเยอร์รูปแบบการโต้ตอบที่เป็นมิตรจะแยกต่างหากและกำหนดค่าได้

| ค่า                  | ผล                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้งานเลเยอร์รูปแบบการโต้ตอบที่เป็นมิตร |
| `"on"`                 | Alias สำหรับ `"friendly"`                      |
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
ค่าต่างๆ ไม่คำนึงถึงตัวพิมพ์เล็กใหญ่ขณะรันไทม์ ดังนั้น `"Off"` และ `"off"` จะปิดเลเยอร์สไตล์ที่เป็นมิตรทั้งคู่
</Tip>

<Note>
ระบบยังคงอ่าน `plugins.entries.openai.config.personality` แบบเดิมเป็น fallback เพื่อความเข้ากันได้ เมื่อยังไม่ได้ตั้งค่า `agents.defaults.promptOverlays.gpt5.personality` ที่ใช้ร่วมกัน
</Note>

## เสียงและคำพูด

<AccordionGroup>
  <Accordion title="การสังเคราะห์เสียงพูด (TTS)">
    Plugin `openai` ที่บันเดิลมาจะลงทะเบียนการสังเคราะห์เสียงพูดสำหรับพื้นผิว `messages.tts`

    | การตั้งค่า | พาธการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | เสียง | `messages.tts.providers.openai.voice` | `coral` |
    | ความเร็ว | `messages.tts.providers.openai.speed` | (ไม่ได้ตั้งค่า) |
    | คำสั่ง | `messages.tts.providers.openai.instructions` | (ไม่ได้ตั้งค่า, เฉพาะ `gpt-4o-mini-tts`) |
    | รูปแบบ | `messages.tts.providers.openai.responseFormat` | `opus` สำหรับบันทึกเสียง, `mp3` สำหรับไฟล์ |
    | คีย์ API | `messages.tts.providers.openai.apiKey` | fallback ไปใช้ `OPENAI_API_KEY` |
    | URL ฐาน | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | เนื้อหาเพิ่มเติม | `messages.tts.providers.openai.extraBody` / `extra_body` | (ไม่ได้ตั้งค่า) |

    โมเดลที่มีให้ใช้: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd` เสียงที่มีให้ใช้: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`

    `extraBody` จะถูกผสานเข้าใน JSON คำขอ `/audio/speech` หลังฟิลด์ที่ OpenClaw สร้างขึ้น ดังนั้นให้ใช้สำหรับ endpoint ที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้คีย์เพิ่มเติม เช่น `lang` คีย์ต้นแบบจะถูกละเว้น

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
    ตั้งค่า `OPENAI_TTS_BASE_URL` เพื่อแทนที่ URL ฐานของ TTS โดยไม่กระทบ endpoint ของ API แชท
    </Note>

  </Accordion>

  <Accordion title="การแปลงเสียงพูดเป็นข้อความ">
    Plugin `openai` ที่บันเดิลมาจะลงทะเบียนการแปลงเสียงพูดเป็นข้อความแบบแบตช์ผ่าน
    พื้นผิวการถอดเสียงเพื่อทำความเข้าใจสื่อของ OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
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

    ระบบจะส่งต่อคำใบ้ภาษาและพรอมป์ไปยัง OpenAI เมื่อมีการระบุผ่าน
    การกำหนดค่าสื่อเสียงที่ใช้ร่วมกันหรือคำขอถอดเสียงรายครั้ง

  </Accordion>

  <Accordion title="การถอดเสียงแบบเรียลไทม์">
    Plugin `openai` ที่บันเดิลมาจะลงทะเบียนการถอดเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | พาธการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | ภาษา | `...openai.language` | (ไม่ได้ตั้งค่า) |
    | พรอมป์ | `...openai.prompt` | (ไม่ได้ตั้งค่า) |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `800` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | คีย์ API | `...openai.apiKey` | fallback ไปใช้ `OPENAI_API_KEY` |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียง G.711 u-law (`g711_ulaw` / `audio/pcmu`) ผู้ให้บริการสตรีมมิงนี้ใช้สำหรับพาธการถอดเสียงแบบเรียลไทม์ของ Voice Call ส่วนเสียงของ Discord ในปัจจุบันจะบันทึกเซกเมนต์สั้นๆ และใช้พาธการถอดเสียงแบบแบตช์ `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="เสียงแบบเรียลไทม์">
    Plugin `openai` ที่บันเดิลมาจะลงทะเบียนเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | พาธการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | เสียง | `...openai.voice` | `alloy` |
    | อุณหภูมิ | `...openai.temperature` | `0.8` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `500` |
    | คีย์ API | `...openai.apiKey` | fallback ไปใช้ `OPENAI_API_KEY` |

    <Note>
    รองรับ Azure OpenAI ผ่านคีย์การกำหนดค่า `azureEndpoint` และ `azureDeployment` สำหรับบริดจ์เรียลไทม์ฝั่งแบ็กเอนด์ รองรับการเรียกใช้เครื่องมือแบบสองทิศทาง ใช้รูปแบบเสียง G.711 u-law
    </Note>

    <Note>
    Control UI Talk ใช้เซสชันเรียลไทม์ของเบราว์เซอร์ OpenAI พร้อม client secret ชั่วคราวที่ออกโดย Gateway และการแลกเปลี่ยน SDP ของ WebRTC จากเบราว์เซอร์โดยตรงกับ
    OpenAI Realtime API การตรวจสอบแบบสดโดยผู้ดูแลมีให้ใช้ด้วย
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ฝั่ง OpenAI จะออก client secret ใน Node, สร้างข้อเสนอ SDP ของเบราว์เซอร์
    พร้อมสื่อไมโครโฟนจำลอง, โพสต์ไปยัง OpenAI, และใช้คำตอบ SDP
    โดยไม่บันทึก secret
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint ของ Azure OpenAI

ผู้ให้บริการ `openai` ที่บันเดิลมาสามารถชี้ไปยังทรัพยากร Azure OpenAI สำหรับการสร้างรูปภาพ
ได้โดยการแทนที่ URL ฐาน ในพาธการสร้างรูปภาพ OpenClaw
จะตรวจจับชื่อโฮสต์ Azure บน `models.providers.openai.baseUrl` และสลับไปใช้
รูปแบบคำขอของ Azure โดยอัตโนมัติ

<Note>
เสียงแบบเรียลไทม์ใช้พาธการกำหนดค่าแยกต่างหาก
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
และไม่ได้รับผลจาก `models.providers.openai.baseUrl` ดู accordion **เสียงแบบเรียลไทม์**
ใต้ [เสียงและคำพูด](#voice-and-speech) สำหรับการตั้งค่า Azure
ของส่วนนี้
</Note>

ใช้ Azure OpenAI เมื่อ:

- คุณมีการสมัครใช้งาน Azure OpenAI, โควตา, หรือข้อตกลงระดับองค์กรอยู่แล้ว
- คุณต้องการการพำนักของข้อมูลในภูมิภาคหรือการควบคุมด้านการปฏิบัติตามข้อกำหนดที่ Azure มีให้
- คุณต้องการเก็บทราฟฟิกไว้ภายใน Azure tenancy ที่มีอยู่

### การกำหนดค่า

สำหรับการสร้างรูปภาพของ Azure ผ่านผู้ให้บริการ `openai` ที่บันเดิลมา ให้ชี้
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

OpenClaw รู้จัก suffix ชื่อโฮสต์ Azure เหล่านี้สำหรับเส้นทางการสร้างรูปภาพของ Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

สำหรับคำขอสร้างรูปภาพบนโฮสต์ Azure ที่รู้จัก OpenClaw จะ:

- ส่ง header `api-key` แทน `Authorization: Bearer`
- ใช้พาธที่มีขอบเขตตาม deployment (`/openai/deployments/{deployment}/...`)
- เติม `?api-version=...` ต่อท้ายแต่ละคำขอ
- ใช้ timeout คำขอเริ่มต้น 600 วินาทีสำหรับการเรียกสร้างรูปภาพของ Azure
  ค่า `timeoutMs` รายครั้งยังคงแทนที่ค่าเริ่มต้นนี้ได้

URL ฐานอื่นๆ (OpenAI สาธารณะ, พร็อกซีที่เข้ากันได้กับ OpenAI) จะยังคงใช้
รูปแบบคำขอรูปภาพ OpenAI มาตรฐาน

<Note>
การกำหนดเส้นทาง Azure สำหรับพาธการสร้างรูปภาพของผู้ให้บริการ `openai` ต้องใช้
OpenClaw 2026.4.22 หรือใหม่กว่า เวอร์ชันก่อนหน้าจะปฏิบัติต่อ
`openai.baseUrl` แบบกำหนดเองเหมือน endpoint OpenAI สาธารณะ และจะล้มเหลวกับ
deployment รูปภาพของ Azure
</Note>

### เวอร์ชัน API

ตั้งค่า `AZURE_OPENAI_API_VERSION` เพื่อปักหมุดเวอร์ชัน Azure preview หรือ GA เฉพาะ
สำหรับพาธการสร้างรูปภาพของ Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

ค่าเริ่มต้นคือ `2024-12-01-preview` เมื่อไม่ได้ตั้งค่าตัวแปร

### ชื่อโมเดลคือชื่อ deployment

Azure OpenAI ผูกโมเดลเข้ากับ deployment สำหรับคำขอสร้างรูปภาพของ Azure
ที่กำหนดเส้นทางผ่านผู้ให้บริการ `openai` ที่บันเดิลมา ฟิลด์ `model` ใน OpenClaw
ต้องเป็น **ชื่อ deployment ของ Azure** ที่คุณกำหนดค่าไว้ใน Azure portal ไม่ใช่
id โมเดล OpenAI สาธารณะ

หากคุณสร้าง deployment ชื่อ `gpt-image-2-prod` ที่ให้บริการ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

กฎชื่อ deployment เดียวกันนี้ใช้กับการเรียกสร้างรูปภาพที่กำหนดเส้นทางผ่าน
ผู้ให้บริการ `openai` ที่บันเดิลมา

### ความพร้อมใช้งานตามภูมิภาค

การสร้างรูปภาพของ Azure ในปัจจุบันมีให้ใช้เฉพาะในบางภูมิภาค
(ตัวอย่างเช่น `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`) ตรวจสอบรายการภูมิภาคปัจจุบันของ Microsoft ก่อนสร้าง
deployment และยืนยันว่าโมเดลเฉพาะนั้นมีให้ใช้ในภูมิภาคของคุณ

### ความแตกต่างของพารามิเตอร์

Azure OpenAI และ OpenAI สาธารณะไม่ได้ยอมรับพารามิเตอร์รูปภาพชุดเดียวกันเสมอไป
Azure อาจปฏิเสธตัวเลือกที่ OpenAI สาธารณะอนุญาต (เช่น ค่า
`background` บางค่าบน `gpt-image-2`) หรือเปิดให้ใช้เฉพาะในเวอร์ชันโมเดลบางตัว
ความแตกต่างเหล่านี้มาจาก Azure และโมเดลพื้นฐาน ไม่ใช่
OpenClaw หากคำขอ Azure ล้มเหลวด้วยข้อผิดพลาดการตรวจสอบ ให้ตรวจสอบ
ชุดพารามิเตอร์ที่ deployment และเวอร์ชัน API เฉพาะของคุณรองรับใน
Azure portal

<Note>
Azure OpenAI ใช้การขนส่งแบบ native และพฤติกรรม compat แต่ไม่ได้รับ
header การระบุแหล่งที่มาที่ซ่อนอยู่ของ OpenClaw — ดู accordion **เส้นทาง Native เทียบกับเส้นทางที่เข้ากันได้กับ OpenAI**
ใต้ [การกำหนดค่าขั้นสูง](#advanced-configuration)

สำหรับทราฟฟิกแชทหรือ Responses บน Azure (นอกเหนือจากการสร้างรูปภาพ) ให้ใช้
โฟลว์ onboarding หรือการกำหนดค่าผู้ให้บริการ Azure โดยเฉพาะ — `openai.baseUrl` เพียงอย่างเดียว
จะไม่เลือกใช้รูปแบบ API/auth ของ Azure มีผู้ให้บริการ
`azure-openai-responses/*` แยกต่างหาก ดู accordion การ Compaction ฝั่งเซิร์ฟเวอร์ด้านล่าง
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การขนส่ง (WebSocket เทียบกับ SSE)">
    OpenClaw ใช้ WebSocket เป็นหลักพร้อม fallback เป็น SSE (`"auto"`) สำหรับทั้ง `openai/*` และ `openai-codex/*`

    ในโหมด `"auto"` OpenClaw จะ:
    - ลองใหม่กับความล้มเหลวของ WebSocket ในช่วงต้นหนึ่งครั้งก่อน fallback ไปใช้ SSE
    - หลังเกิดความล้มเหลว ทำเครื่องหมาย WebSocket ว่าเสื่อมสภาพประมาณ 60 วินาทีและใช้ SSE ระหว่างช่วงพัก
    - แนบ header ระบุตัวตนของเซสชันและ turn ที่คงที่สำหรับการลองใหม่และการเชื่อมต่อใหม่
    - ทำให้ตัวนับการใช้งาน (`input_tokens` / `prompt_tokens`) เป็นมาตรฐานระหว่างตัวแปรการขนส่ง

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
    - [การสตรีมการตอบกลับ API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

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
    OpenClaw เปิดเผย toggle โหมดเร็วที่ใช้ร่วมกันสำหรับ `openai/*` และ `openai-codex/*`:

    - **แชท/UI:** `/fast status|on|off`
    - **การกำหนดค่า:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    เมื่อเปิดใช้งาน OpenClaw จะแมปโหมดเร็วกับการประมวลผลแบบมีลำดับความสำคัญของ OpenAI (`service_tier = "priority"`) ค่า `service_tier` ที่มีอยู่จะถูกเก็บไว้ และโหมดเร็วจะไม่เขียน `reasoning` หรือ `text.verbosity` ใหม่

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
    การ override ของเซสชันมีผลเหนือการกำหนดค่า การล้างการ override ของเซสชันใน UI เซสชันจะคืนเซสชันกลับไปใช้ค่าเริ่มต้นที่กำหนดค่าไว้
    </Note>

  </Accordion>

  <Accordion title="การประมวลผลแบบมีลำดับความสำคัญ (service_tier)">
    API ของ OpenAI เปิดเผยการประมวลผลแบบมีลำดับความสำคัญผ่าน `service_tier` ตั้งค่าต่อโมเดลใน OpenClaw:

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
    `serviceTier` จะถูกส่งต่อไปยังปลายทาง OpenAI แบบเนทีฟ (`api.openai.com`) และปลายทาง Codex แบบเนทีฟ (`chatgpt.com/backend-api`) เท่านั้น หากคุณกำหนดเส้นทางผู้ให้บริการใดผ่านพร็อกซี OpenClaw จะปล่อย `service_tier` ไว้โดยไม่แตะต้อง
    </Warning>

  </Accordion>

  <Accordion title="Compaction ฝั่งเซิร์ฟเวอร์ (Responses API)">
    สำหรับโมเดล OpenAI Responses โดยตรง (`openai/*` บน `api.openai.com`) wrapper สตรีม Pi-harness ของ Plugin OpenAI จะเปิดใช้ Compaction ฝั่งเซิร์ฟเวอร์โดยอัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ความเข้ากันได้ของโมเดลจะตั้งค่า `supportsStore: false`)
    - แทรก `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - ค่าเริ่มต้นของ `compact_threshold`: 70% ของ `contextWindow` (หรือ `80000` เมื่อไม่มีข้อมูล)

    สิ่งนี้ใช้กับเส้นทาง Pi harness ในตัว และกับ hook ของผู้ให้บริการ OpenAI ที่ใช้โดยการรันแบบฝังตัว harness ของเซิร์ฟเวอร์แอป Codex แบบเนทีฟจัดการบริบทของตัวเองผ่าน Codex และกำหนดค่าแยกต่างหากด้วย `agents.defaults.agentRuntime.id`

    <Tabs>
      <Tab title="เปิดใช้อย่างชัดเจน">
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
    - ไม่ถือว่าเทิร์นที่มีเฉพาะแผนเป็นความคืบหน้าที่สำเร็จอีกต่อไปเมื่อมีการกระทำของเครื่องมือพร้อมใช้งาน
    - ลองเทิร์นนั้นใหม่พร้อมการชี้นำให้ลงมือทำทันที
    - เปิดใช้ `update_plan` โดยอัตโนมัติสำหรับงานที่มีสาระสำคัญ
    - แสดงสถานะถูกบล็อกอย่างชัดเจนหากโมเดลยังคงวางแผนโดยไม่ลงมือทำ

    <Note>
    จำกัดขอบเขตเฉพาะการรันตระกูล GPT-5 ของ OpenAI และ Codex เท่านั้น ผู้ให้บริการอื่นและตระกูลโมเดลเก่าจะคงพฤติกรรมเริ่มต้นไว้
    </Note>

  </Accordion>

  <Accordion title="เส้นทางแบบเนทีฟเทียบกับเส้นทางที่เข้ากันได้กับ OpenAI">
    OpenClaw ปฏิบัติต่อปลายทาง OpenAI โดยตรง, Codex และ Azure OpenAI แตกต่างจากพร็อกซี `/v1` ทั่วไปที่เข้ากันได้กับ OpenAI:

    **เส้นทางแบบเนทีฟ** (`openai/*`, Azure OpenAI):
    - เก็บ `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับ effort `none` ของ OpenAI
    - ละเว้น reasoning ที่ปิดใช้งานสำหรับโมเดลหรือพร็อกซีที่ปฏิเสธ `reasoning.effort: "none"`
    - ตั้งค่าเริ่มต้นของสคีมาเครื่องมือเป็นโหมดเข้มงวด
    - แนบส่วนหัว attribution ที่ซ่อนไว้เฉพาะบนโฮสต์เนทีฟที่ตรวจสอบแล้วเท่านั้น
    - คงการจัดรูปคำขอเฉพาะ OpenAI (`service_tier`, `store`, ความเข้ากันได้ของ reasoning, คำใบ้ prompt-cache)

    **เส้นทางพร็อกซี/ที่เข้ากันได้:**
    - ใช้พฤติกรรมความเข้ากันได้ที่ผ่อนปรนกว่า
    - ตัด Completions `store` ออกจาก payload `openai-completions` ที่ไม่ใช่เนทีฟ
    - ยอมรับ JSON pass-through ขั้นสูงของ `params.extra_body`/`params.extraBody` สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI
    - ยอมรับ `params.chat_template_kwargs` สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI เช่น vLLM
    - ไม่บังคับใช้สคีมาเครื่องมือแบบเข้มงวดหรือส่วนหัวเฉพาะเนทีฟ

    Azure OpenAI ใช้ transport แบบเนทีฟและพฤติกรรมความเข้ากันได้ แต่ไม่ได้รับส่วนหัว attribution ที่ซ่อนไว้

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
