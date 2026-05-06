---
read_when:
    - คุณต้องการใช้โมเดลของ OpenAI ใน OpenClaw
    - คุณต้องการใช้การยืนยันตัวตนด้วยการสมัครใช้งาน Codex แทนคีย์ API
    - คุณต้องการให้พฤติกรรมการปฏิบัติงานของเอเจนต์ GPT-5 เข้มงวดยิ่งขึ้น
summary: ใช้ OpenAI ผ่านคีย์ API หรือการสมัครสมาชิก Codex ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T09:28:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5606cafb8dfec888b922874202aa0fdcad8cbd4fec1a1e15a9074ad14bc5486
    source_path: providers/openai.md
    workflow: 16
---

OpenAI ให้บริการ API สำหรับนักพัฒนาสำหรับโมเดล GPT และ Codex ยังพร้อมใช้งานเป็นเอเจนต์เขียนโค้ดภายใต้แผน
ChatGPT ผ่านไคลเอนต์ Codex ของ OpenAI ด้วย OpenClaw แยกพื้นผิวเหล่านี้ออกจากกันเพื่อให้คอนฟิกคาดเดาได้

OpenClaw รองรับเส้นทางตระกูล OpenAI สามแบบ สมาชิก ChatGPT/Codex ส่วนใหญ่
ที่ต้องการพฤติกรรมแบบ Codex ควรใช้รันไทม์ app-server ของ Codex แบบเนทีฟ
คำนำหน้าโมเดลจะเลือกชื่อผู้ให้บริการ/โมเดล ส่วนการตั้งค่ารันไทม์แยกต่างหากจะเลือก
ว่าใครเป็นผู้รันลูปเอเจนต์แบบฝัง:

- **คีย์ API** - เข้าถึง OpenAI Platform โดยตรงพร้อมการเรียกเก็บเงินตามการใช้งาน (โมเดล `openai/*`)
- **การสมัครสมาชิก Codex พร้อมรันไทม์ Codex แบบเนทีฟ** - ลงชื่อเข้าใช้ ChatGPT/Codex พร้อมการรันผ่าน Codex app-server (โมเดล `openai/*` บวก `agents.defaults.agentRuntime.id: "codex"`)
- **การสมัครสมาชิก Codex ผ่าน PI** - ลงชื่อเข้าใช้ ChatGPT/Codex ด้วยตัวรัน PI ปกติของ OpenClaw (โมเดล `openai-codex/*`)

OpenAI รองรับการใช้งาน OAuth แบบสมัครสมาชิกในเครื่องมือและเวิร์กโฟลว์ภายนอกอย่าง OpenClaw อย่างชัดเจน

ผู้ให้บริการ โมเดล รันไทม์ และช่องทางเป็นเลเยอร์ที่แยกกัน หากป้ายกำกับเหล่านั้น
เริ่มปะปนกัน ให้อ่าน [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes) ก่อน
เปลี่ยนคอนฟิก

## ตัวเลือกอย่างรวดเร็ว

| เป้าหมาย                                                 | ใช้                                              | หมายเหตุ                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| การสมัครสมาชิก ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-5.5` บวก `agentRuntime.id: "codex"` | การตั้งค่า Codex ที่แนะนำสำหรับผู้ใช้ส่วนใหญ่ ลงชื่อเข้าใช้ด้วย auth `openai-codex` |
| การเรียกเก็บเงินด้วยคีย์ API โดยตรง                               | `openai/gpt-5.5`                                 | ตั้งค่า `OPENAI_API_KEY` หรือรันการเริ่มต้นใช้งานคีย์ API ของ OpenAI                    |
| การยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex ผ่าน PI           | `openai-codex/gpt-5.5`                           | ใช้เฉพาะเมื่อคุณต้องการตัวรัน PI ปกติโดยตั้งใจ                |
| การสร้างหรือแก้ไขรูปภาพ                          | `openai/gpt-image-2`                             | ทำงานได้ทั้งกับ `OPENAI_API_KEY` หรือ OpenAI Codex OAuth                 |
| รูปภาพพื้นหลังโปร่งใส                        | `openai/gpt-image-1.5`                           | ใช้ `outputFormat=png` หรือ `webp` และ `openai.background=transparent`     |

## แผนที่การตั้งชื่อ

ชื่อคล้ายกันแต่ใช้แทนกันไม่ได้:

| ชื่อที่คุณเห็น                       | เลเยอร์             | ความหมาย                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | คำนำหน้าผู้ให้บริการ   | เส้นทาง API ของ OpenAI Platform โดยตรง                                                                 |
| `openai-codex`                     | คำนำหน้าผู้ให้บริการ   | เส้นทาง OAuth/การสมัครสมาชิก OpenAI Codex ผ่านตัวรัน PI ปกติของ OpenClaw                      |
| Plugin `codex`                     | Plugin            | Plugin ที่มากับ OpenClaw ซึ่งให้รันไทม์ app-server ของ Codex แบบเนทีฟและตัวควบคุมแชต `/codex` |
| `agentRuntime.id: codex`           | รันไทม์เอเจนต์     | บังคับใช้ฮาร์เนส app-server ของ Codex แบบเนทีฟสำหรับเทิร์นแบบฝัง                                     |
| `/codex ...`                       | ชุดคำสั่งแชต  | ผูก/ควบคุมเธรด app-server ของ Codex จากการสนทนา                                        |
| `runtime: "acp", agentId: "codex"` | เส้นทางเซสชัน ACP | เส้นทางสำรองแบบชัดเจนที่รัน Codex ผ่าน ACP/acpx                                          |

นี่หมายความว่าคอนฟิกสามารถตั้งใจมีทั้ง `openai-codex/*` และ Plugin
`codex` ได้ ซึ่งถูกต้องเมื่อคุณต้องการ Codex OAuth ผ่าน PI และยังต้องการให้
ตัวควบคุมแชต `/codex` แบบเนทีฟพร้อมใช้งาน `openclaw doctor` จะเตือนเกี่ยวกับ
ชุดค่าผสมนั้นเพื่อให้คุณยืนยันว่าเป็นความตั้งใจจริง และจะไม่เขียนค่าใหม่

<Note>
GPT-5.5 พร้อมใช้งานผ่านทั้งการเข้าถึงด้วยคีย์ API ของ OpenAI Platform โดยตรงและ
เส้นทางการสมัครสมาชิก/OAuth สำหรับการสมัครสมาชิก ChatGPT/Codex พร้อมการรัน
Codex แบบเนทีฟ ให้ใช้ `openai/gpt-5.5` กับ `agentRuntime.id: "codex"` ใช้
`openai-codex/gpt-5.5` เฉพาะสำหรับ Codex OAuth ผ่าน PI หรือ `openai/gpt-5.5`
โดยไม่มีการโอเวอร์ไรด์รันไทม์ Codex สำหรับทราฟฟิก `OPENAI_API_KEY` โดยตรง
</Note>

<Note>
การเปิดใช้งาน Plugin OpenAI หรือการเลือกโมเดล `openai-codex/*` ไม่ได้
เปิดใช้งาน Plugin app-server ของ Codex ที่รวมมาให้ OpenClaw จะเปิดใช้ Plugin นั้นเฉพาะ
เมื่อคุณเลือกรันไทม์ฮาร์เนส Codex แบบเนทีฟอย่างชัดเจนด้วย
`agentRuntime.id: "codex"` หรือใช้การอ้างอิงโมเดล `codex/*` แบบเดิม
หาก Plugin `codex` ที่รวมมาเปิดใช้งานอยู่แต่ `openai-codex/*` ยัง resolve
ผ่าน PI, `openclaw doctor` จะเตือนและคงเส้นทางไว้ตามเดิม
</Note>

## ความครอบคลุมฟีเจอร์ของ OpenClaw

| ความสามารถของ OpenAI         | พื้นผิวของ OpenClaw                                           | สถานะ                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| แชต / Responses          | ผู้ให้บริการโมเดล `openai/<model>`                            | ใช่                                                    |
| โมเดลการสมัครสมาชิก Codex | `openai-codex/<model>` พร้อม OAuth `openai-codex`           | ใช่                                                    |
| ฮาร์เนส app-server ของ Codex  | `openai/<model>` พร้อม `agentRuntime.id: codex`             | ใช่                                                    |
| การค้นหาเว็บฝั่งเซิร์ฟเวอร์    | เครื่องมือ Responses แบบเนทีฟของ OpenAI                               | ใช่ เมื่อเปิดใช้งานการค้นหาเว็บและไม่ได้ปักหมุดผู้ให้บริการ |
| รูปภาพ                    | `image_generate`                                           | ใช่                                                    |
| วิดีโอ                    | `video_generate`                                           | ใช่                                                    |
| ข้อความเป็นเสียงพูด            | `messages.tts.provider: "openai"` / `tts`                  | ใช่                                                    |
| เสียงพูดเป็นข้อความแบบแบตช์      | `tools.media.audio` / การทำความเข้าใจสื่อ                  | ใช่                                                    |
| เสียงพูดเป็นข้อความแบบสตรีม  | Voice Call `streaming.provider: "openai"`                  | ใช่                                                    |
| เสียงแบบเรียลไทม์            | Voice Call `realtime.provider: "openai"` / Control UI Talk | ใช่                                                    |
| Embeddings                | ผู้ให้บริการ embedding ของหน่วยความจำ                                  | ใช่                                                    |

## Embeddings ของหน่วยความจำ

OpenClaw สามารถใช้ OpenAI หรือ endpoint embedding ที่เข้ากันได้กับ OpenAI สำหรับ
การทำดัชนี `memory_search` และ embeddings ของคำค้น:

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

สำหรับ endpoint ที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้ป้ายกำกับ embedding แบบไม่สมมาตร ให้ตั้งค่า
`queryInputType` และ `documentInputType` ใต้ `memorySearch` OpenClaw จะส่งต่อ
ค่าเหล่านั้นเป็นฟิลด์คำขอ `input_type` เฉพาะผู้ให้บริการ: embeddings ของคำค้นใช้
`queryInputType`; ชิ้นส่วนหน่วยความจำที่ทำดัชนีและการทำดัชนีแบบแบตช์ใช้
`documentInputType` ดูตัวอย่างเต็มได้ที่ [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config#provider-specific-config)

## เริ่มต้นใช้งาน

เลือกวิธี auth ที่คุณต้องการและทำตามขั้นตอนการตั้งค่า

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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | การอ้างอิงโมเดล              | คอนฟิกรันไทม์             | เส้นทาง                       | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | ละไว้ / `agentRuntime.id: "pi"`    | API ของ OpenAI Platform โดยตรง  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | ละไว้ / `agentRuntime.id: "pi"`    | API ของ OpenAI Platform โดยตรง  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | ฮาร์เนส app-server ของ Codex    | Codex app-server |

    <Note>
    `openai/*` คือเส้นทางคีย์ API ของ OpenAI โดยตรง เว้นแต่คุณจะบังคับใช้
    ฮาร์เนส app-server ของ Codex อย่างชัดเจน ใช้ `openai-codex/*` สำหรับ Codex OAuth ผ่าน
    ตัวรัน PI เริ่มต้น หรือใช้ `openai/gpt-5.5` กับ
    `agentRuntime.id: "codex"` สำหรับการรัน app-server ของ Codex แบบเนทีฟ
    </Note>

    ### ตัวอย่างคอนฟิก

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw ไม่ได้เปิดเผย `openai/gpt-5.3-codex-spark` คำขอ OpenAI API แบบสดจะปฏิเสธโมเดลนั้น และแคตตาล็อก Codex ปัจจุบันก็ไม่ได้เปิดเผยโมเดลนั้นเช่นกัน
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **เหมาะที่สุดสำหรับ:** การใช้การสมัครสมาชิก ChatGPT/Codex ของคุณพร้อมการรัน app-server ของ Codex แบบเนทีฟแทนคีย์ API แยกต่างหาก Codex cloud ต้องลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        หรือรัน OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        สำหรับการตั้งค่าแบบไม่มีหน้าจอหรือไม่เหมาะกับ callback ให้เพิ่ม `--device-code` เพื่อลงชื่อเข้าใช้ด้วยโฟลว์รหัสอุปกรณ์ของ ChatGPT แทน callback เบราว์เซอร์ localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use the native Codex runtime">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai-codex
        ```

        หลังจาก Gateway ทำงานแล้ว ให้ส่ง `/codex status` หรือ `/codex models`
        ในแชตเพื่อตรวจสอบรันไทม์ app-server แบบเนทีฟ
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | การอ้างอิงโมเดล | คอนฟิกรันไทม์ | เส้นทาง | Auth |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | ฮาร์เนส app-server ของ Codex แบบเนทีฟ | ลงชื่อเข้าใช้ Codex หรือโปรไฟล์ `openai-codex` ที่เลือก |
    | `openai-codex/gpt-5.5` | ละไว้ / `runtime: "pi"` | ChatGPT/Codex OAuth ผ่าน PI | ลงชื่อเข้าใช้ Codex |
    | `openai-codex/gpt-5.4-mini` | ละไว้ / `runtime: "pi"` | ChatGPT/Codex OAuth ผ่าน PI | ลงชื่อเข้าใช้ Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | ยังคงเป็น PI เว้นแต่ Plugin จะ claim `openai-codex` อย่างชัดเจน | ลงชื่อเข้าใช้ Codex |

    <Warning>
    อย่าคอนฟิกการอ้างอิงโมเดล `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` หรือ
    `openai-codex/gpt-5.3*` รุ่นเก่า บัญชี ChatGPT/Codex OAuth ตอนนี้จะปฏิเสธ
    โมเดลเหล่านั้น ใช้ `openai-codex/gpt-5.5` สำหรับเส้นทาง PI OAuth หรือ
    `openai/gpt-5.5` กับ `agentRuntime.id: "codex"` สำหรับการรันรันไทม์ Codex
    แบบเนทีฟ
    </Warning>

    <Note>
    ใช้ id ผู้ให้บริการ `openai-codex` ต่อไปสำหรับคำสั่ง auth/profile ส่วน
    คำนำหน้าโมเดล `openai-codex/*` ยังเป็นเส้นทาง PI แบบชัดเจนสำหรับ Codex OAuth ด้วย
    ค่านี้ไม่ได้เลือกหรือเปิดใช้งานฮาร์เนส app-server ของ Codex ที่รวมมาโดยอัตโนมัติ สำหรับ
    การตั้งค่าทั่วไปแบบใช้ subscription พร้อม native runtime ให้ลงชื่อเข้าใช้ด้วย
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

    หากต้องการให้ Codex OAuth อยู่บนตัวรัน PI ปกติแทน ให้ใช้
    `openai-codex/gpt-5.5` และละเว้นการ override runtime ของ Codex

    <Note>
    การเริ่มต้นใช้งานจะไม่นำเข้าข้อมูล OAuth จาก `~/.codex` อีกต่อไป ให้ลงชื่อเข้าใช้ด้วย OAuth ผ่านเบราว์เซอร์ (ค่าเริ่มต้น) หรือโฟลว์ device-code ข้างต้น — OpenClaw จะจัดการข้อมูลรับรองที่ได้ในที่เก็บ auth ของ agent ของตัวเอง
    </Note>

    ### ตัวบ่งชี้สถานะ

    แชต `/status` แสดงว่า model runtime ใดกำลังทำงานอยู่สำหรับเซสชันปัจจุบัน
    ฮาร์เนส PI เริ่มต้นจะแสดงเป็น `Runtime: OpenClaw Pi Default` เมื่อเลือก
    ฮาร์เนส app-server ของ Codex ที่รวมมา `/status` จะแสดง
    `Runtime: OpenAI Codex` เซสชันที่มีอยู่จะคง id ฮาร์เนสที่บันทึกไว้ ดังนั้นให้ใช้
    `/new` หรือ `/reset` หลังจากเปลี่ยน `agentRuntime` หากต้องการให้ `/status`
    สะท้อนตัวเลือก PI/Codex ใหม่

    ### คำเตือน Doctor

    หากเปิดใช้งาน Plugin `codex` ที่รวมมาในขณะที่เลือกเส้นทาง `openai-codex/*`
    อยู่ `openclaw doctor` จะเตือนว่าโมเดลยังคง resolve ผ่าน PI
    คงการกำหนดค่าไว้ไม่เปลี่ยนแปลงเฉพาะเมื่อเส้นทาง auth ผ่าน subscription ของ PI นั้น
    เป็นความตั้งใจ ให้เปลี่ยนเป็น `openai/<model>` พร้อม `agentRuntime.id: "codex"` เมื่อ
    ต้องการการทำงานของ app-server Codex แบบ native

    ### ขีดจำกัด context window

    OpenClaw ถือว่าเมทาดาทาของโมเดลและขีดจำกัด context ของ runtime เป็นค่าที่แยกกัน

    สำหรับ `openai-codex/gpt-5.5` ผ่าน Codex OAuth:

    - `contextWindow` แบบ native: `1000000`
    - ขีดจำกัด `contextTokens` เริ่มต้นของ runtime: `272000`

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
    ใช้ `contextWindow` เพื่อประกาศเมทาดาทาของโมเดลแบบ native ใช้ `contextTokens` เพื่อจำกัดงบประมาณ context ของ runtime
    </Note>

    ### การกู้คืนแค็ตตาล็อก

    OpenClaw ใช้เมทาดาทาแค็ตตาล็อก Codex จาก upstream สำหรับ `gpt-5.5` เมื่อมีอยู่
    หากการค้นพบ Codex แบบ live ละเว้นแถว `openai-codex/gpt-5.5` ในขณะที่
    บัญชีผ่านการรับรองแล้ว OpenClaw จะสังเคราะห์แถวโมเดล OAuth นั้นเพื่อให้
    Cron, sub-agent และการรัน default-model ที่กำหนดค่าไว้ไม่ล้มเหลวด้วย
    `Unknown model`

  </Tab>
</Tabs>

## Auth ของ app-server Codex แบบ native

ฮาร์เนส app-server Codex แบบ native ใช้ model refs `openai/*` พร้อม
`agentRuntime.id: "codex"` แต่ auth ยังคงอิงตามบัญชี OpenClaw
เลือก auth ตามลำดับนี้:

1. โปรไฟล์ auth `openai-codex` ของ OpenClaw แบบชัดเจนที่ผูกกับ agent
2. บัญชีที่มีอยู่ของ app-server เช่น การลงชื่อเข้าใช้ ChatGPT ผ่าน Codex CLI ภายในเครื่อง
3. สำหรับการเปิด app-server ผ่าน stdio ภายในเครื่องเท่านั้น ให้ใช้ `CODEX_API_KEY` แล้วจึง
   `OPENAI_API_KEY` เมื่อ app-server รายงานว่าไม่มีบัญชีและยังต้องใช้
   auth ของ OpenAI

นั่นหมายความว่าการลงชื่อเข้าใช้ subscription ของ ChatGPT/Codex ภายในเครื่องจะไม่ถูกแทนที่เพียง
เพราะกระบวนการ Gateway มี `OPENAI_API_KEY` สำหรับโมเดล OpenAI โดยตรง
หรือ embeddings ด้วย การ fallback ไปใช้ env API-key เป็นเพียงเส้นทาง local stdio แบบไม่มีบัญชีเท่านั้น และ
จะไม่ถูกส่งไปยังการเชื่อมต่อ WebSocket app-server เมื่อเลือกโปรไฟล์ Codex
แบบ subscription แล้ว OpenClaw จะกัน `CODEX_API_KEY` และ `OPENAI_API_KEY`
ออกจาก child app-server stdio ที่ spawn ขึ้นมา และส่งข้อมูลรับรองที่เลือก
ผ่าน RPC login ของ app-server

## การสร้างรูปภาพ

Plugin `openai` ที่รวมมาลงทะเบียนการสร้างรูปภาพผ่านเครื่องมือ `image_generate`
รองรับทั้งการสร้างรูปภาพด้วย API-key ของ OpenAI และการสร้างรูปภาพด้วย Codex OAuth
ผ่าน model ref `openai/gpt-image-2` เดียวกัน

| ความสามารถ                | API key ของ OpenAI                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | การลงชื่อเข้าใช้ OpenAI Codex OAuth           |
| Transport                 | OpenAI Images API                  | แบ็กเอนด์ Codex Responses              |
| จำนวนรูปภาพสูงสุดต่อคำขอ    | 4                                  | 4                                    |
| โหมดแก้ไข                 | เปิดใช้งาน (สูงสุด 5 รูปภาพอ้างอิง) | เปิดใช้งาน (สูงสุด 5 รูปภาพอ้างอิง)   |
| การ override ขนาด            | รองรับ รวมถึงขนาด 2K/4K   | รองรับ รวมถึงขนาด 2K/4K     |
| อัตราส่วนภาพ / ความละเอียด | ไม่ส่งต่อไปยัง OpenAI Images API | แมปไปยังขนาดที่รองรับเมื่อปลอดภัย |

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
ดู [การสร้างรูปภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

`gpt-image-2` เป็นค่าเริ่มต้นสำหรับทั้งการสร้างรูปภาพจากข้อความของ OpenAI และการแก้ไขรูปภาพ
`gpt-image-1.5`, `gpt-image-1` และ `gpt-image-1-mini` ยังคงใช้งานได้เป็น
การ override โมเดลแบบชัดเจน ใช้ `openai/gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP
พื้นหลังโปร่งใส API `gpt-image-2` ปัจจุบันปฏิเสธ
`background: "transparent"`

สำหรับคำขอพื้นหลังโปร่งใส agent ควรเรียก `image_generate` ด้วย
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` หรือ `"webp"` และ
`background: "transparent"`; ตัวเลือกผู้ให้บริการ `openai.background` แบบเก่า
ยังคงยอมรับได้ OpenClaw ยังปกป้องเส้นทาง OpenAI สาธารณะและ
OpenAI Codex OAuth โดยเขียนคำขอแบบโปร่งใส `openai/gpt-image-2` เริ่มต้นใหม่
เป็น `gpt-image-1.5`; Azure และ endpoint แบบกำหนดเองที่เข้ากันได้กับ OpenAI จะคง
ชื่อ deployment/model ที่กำหนดค่าไว้

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
`openclaw infer image edit` เมื่อเริ่มจากไฟล์อินพุต
`--openai-background` ยังคงมีให้ใช้เป็น alias เฉพาะ OpenAI

สำหรับการติดตั้ง Codex OAuth ให้คง ref `openai/gpt-image-2` เดิมไว้ เมื่อกำหนดค่า
โปรไฟล์ OAuth `openai-codex` แล้ว OpenClaw จะ resolve access token OAuth
ที่เก็บไว้นั้นและส่งคำขอรูปภาพผ่านแบ็กเอนด์ Codex Responses โดย
จะไม่ลอง `OPENAI_API_KEY` ก่อนหรือ fallback ไปใช้ API key แบบเงียบสำหรับ
คำขอนั้น กำหนดค่า `models.providers.openai` อย่างชัดเจนด้วย API key,
base URL แบบกำหนดเอง หรือ Azure endpoint เมื่อคุณต้องการเส้นทาง OpenAI Images API
โดยตรงแทน
หาก endpoint รูปภาพแบบกำหนดเองนั้นอยู่บน LAN/ที่อยู่ private ที่เชื่อถือได้ ให้ตั้งค่า
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ด้วย; OpenClaw จะยังคง
บล็อก endpoint รูปภาพภายใน/private ที่เข้ากันได้กับ OpenAI เว้นแต่จะมีการ opt-in นี้

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

Plugin `openai` ที่รวมมาลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ `video_generate`

| ความสามารถ       | ค่า                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| โมเดลเริ่มต้น    | `openai/sora-2`                                                                   |
| โหมด            | ข้อความเป็นวิดีโอ, รูปภาพเป็นวิดีโอ, การแก้ไขวิดีโอเดี่ยว                                  |
| อินพุตอ้างอิง | 1 รูปภาพ หรือ 1 วิดีโอ                                                                |
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

## การมีส่วนร่วมพรอมต์ GPT-5

OpenClaw เพิ่มการมีส่วนร่วมพรอมต์ GPT-5 ที่ใช้ร่วมกันสำหรับการรันตระกูล GPT-5 ข้ามผู้ให้บริการ การทำงานนี้ใช้ตาม model id ดังนั้น `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` และ refs GPT-5 อื่น ๆ ที่เข้ากันได้จะได้รับ overlay เดียวกัน โมเดล GPT-4.x รุ่นเก่าจะไม่ได้รับ

ฮาร์เนส Codex แบบ native ที่รวมมาใช้พฤติกรรม GPT-5 และ overlay Heartbeat เดียวกันผ่านคำสั่ง developer ของ Codex app-server ดังนั้นเซสชัน `openai/gpt-5.x` ที่บังคับผ่าน `agentRuntime.id: "codex"` จะคงคำแนะนำการทำงานต่อเนื่องและ Heartbeat เชิงรุกแบบเดิม แม้ว่า Codex จะเป็นเจ้าของพรอมต์ฮาร์เนสส่วนที่เหลือก็ตาม

การมีส่วนร่วม GPT-5 เพิ่มสัญญาพฤติกรรมแบบมีแท็กสำหรับการคง persona, ความปลอดภัยในการดำเนินการ, วินัยในการใช้เครื่องมือ, รูปทรงเอาต์พุต, การตรวจสอบความสมบูรณ์ และการยืนยันความถูกต้อง พฤติกรรมการตอบกลับเฉพาะช่องทางและ silent-message จะยังอยู่ในพรอมต์ระบบ OpenClaw ที่ใช้ร่วมกันและนโยบายการส่งออก คำแนะนำ GPT-5 จะเปิดใช้งานเสมอสำหรับโมเดลที่ตรงกัน เลเยอร์สไตล์การโต้ตอบที่เป็นมิตรจะแยกต่างหากและกำหนดค่าได้

| ค่า                  | ผล                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้งานเลเยอร์สไตล์การโต้ตอบที่เป็นมิตร |
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
ค่าจะไม่สนใจตัวพิมพ์ใหญ่เล็กใน runtime ดังนั้น `"Off"` และ `"off"` จึงปิดใช้งานเลเยอร์สไตล์ที่เป็นมิตรทั้งคู่
</Tip>

<Note>
`plugins.entries.openai.config.personality` แบบ legacy ยังคงถูกอ่านเป็น compatibility fallback เมื่อไม่ได้ตั้งค่า `agents.defaults.promptOverlays.gpt5.personality` ที่ใช้ร่วมกัน
</Note>

## เสียงและคำพูด

<AccordionGroup>
  <Accordion title="การสังเคราะห์เสียงพูด (TTS)">
    Plugin `openai` ที่รวมมาลงทะเบียนการสังเคราะห์เสียงพูดสำหรับพื้นผิว `messages.tts`

    | การตั้งค่า | พาธการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | เสียง | `messages.tts.providers.openai.voice` | `coral` |
    | ความเร็ว | `messages.tts.providers.openai.speed` | (ไม่ได้ตั้งค่า) |
    | คำสั่ง | `messages.tts.providers.openai.instructions` | (ไม่ได้ตั้งค่า, เฉพาะ `gpt-4o-mini-tts` เท่านั้น) |
    | รูปแบบ | `messages.tts.providers.openai.responseFormat` | `opus` สำหรับข้อความเสียง, `mp3` สำหรับไฟล์ |
    | คีย์ API | `messages.tts.providers.openai.apiKey` | สำรองไปใช้ `OPENAI_API_KEY` |
    | URL ฐาน | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | เนื้อหาเพิ่มเติม | `messages.tts.providers.openai.extraBody` / `extra_body` | (ไม่ได้ตั้งค่า) |

    โมเดลที่ใช้ได้: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd` เสียงที่ใช้ได้: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`

    `extraBody` จะถูกรวมเข้าใน JSON คำขอ `/audio/speech` หลังจากฟิลด์ที่ OpenClaw สร้าง ดังนั้นให้ใช้สำหรับปลายทางที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้คีย์เพิ่มเติม เช่น `lang` คีย์ต้นแบบจะถูกละเว้น

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
    ตั้งค่า `OPENAI_TTS_BASE_URL` เพื่อเขียนทับ URL ฐานของ TTS โดยไม่กระทบปลายทาง API แชต
    </Note>

  </Accordion>

  <Accordion title="เสียงเป็นข้อความ">
    Plugin `openai` ที่รวมมาให้จะลงทะเบียนเสียงเป็นข้อความแบบแบตช์ผ่านพื้นผิวการถอดเสียงเพื่อทำความเข้าใจสื่อของ OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - ปลายทาง: OpenAI REST `/v1/audio/transcriptions`
    - พาธอินพุต: การอัปโหลดไฟล์เสียงแบบ multipart
    - รองรับโดย OpenClaw ในทุกที่ที่การถอดเสียงเสียงขาเข้าใช้
      `tools.media.audio` รวมถึงเซ็กเมนต์ช่องเสียงของ Discord และไฟล์แนบเสียงของช่องทาง

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

    คำใบ้ภาษาและพรอมป์จะถูกส่งต่อไปยัง OpenAI เมื่อมีการระบุผ่านการกำหนดค่าสื่อเสียงที่ใช้ร่วมกันหรือคำขอถอดเสียงรายครั้ง

  </Accordion>

  <Accordion title="การถอดเสียงแบบเรียลไทม์">
    Plugin `openai` ที่รวมมาให้จะลงทะเบียนการถอดเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | พาธการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | ภาษา | `...openai.language` | (ไม่ได้ตั้งค่า) |
    | พรอมป์ | `...openai.prompt` | (ไม่ได้ตั้งค่า) |
    | ระยะเวลาความเงียบ | `...openai.silenceDurationMs` | `800` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | คีย์ API | `...openai.apiKey` | สำรองไปใช้ `OPENAI_API_KEY` |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียง G.711 u-law (`g711_ulaw` / `audio/pcmu`) ผู้ให้บริการสตรีมมิงนี้ใช้สำหรับพาธการถอดเสียงแบบเรียลไทม์ของ Voice Call; ปัจจุบันเสียงของ Discord จะบันทึกเซ็กเมนต์สั้น ๆ และใช้พาธการถอดเสียงแบบแบตช์ `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="เสียงแบบเรียลไทม์">
    Plugin `openai` ที่รวมมาให้จะลงทะเบียนเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | พาธการกำหนดค่า | ค่าเริ่มต้น |
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
    Control UI Talk ใช้เซสชันเรียลไทม์ของเบราว์เซอร์ OpenAI พร้อมความลับไคลเอนต์ชั่วคราวที่ Gateway ออกให้ และการแลกเปลี่ยน WebRTC SDP โดยตรงจากเบราว์เซอร์กับ OpenAI Realtime API การตรวจสอบสดสำหรับผู้ดูแลมีให้ใช้ด้วย
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ฝั่ง OpenAI จะออกความลับไคลเอนต์ใน Node, สร้างข้อเสนอ SDP ของเบราว์เซอร์พร้อมสื่อไมโครโฟนจำลอง, โพสต์ไปยัง OpenAI และใช้คำตอบ SDP โดยไม่บันทึกความลับ
    </Note>

  </Accordion>
</AccordionGroup>

## ปลายทาง Azure OpenAI

ผู้ให้บริการ `openai` ที่รวมมาให้สามารถชี้ไปยังทรัพยากร Azure OpenAI สำหรับการสร้างภาพได้โดยเขียนทับ URL ฐาน บนพาธการสร้างภาพ OpenClaw จะตรวจจับชื่อโฮสต์ Azure บน `models.providers.openai.baseUrl` และสลับไปใช้รูปแบบคำขอของ Azure โดยอัตโนมัติ

<Note>
เสียงแบบเรียลไทม์ใช้พาธการกำหนดค่าแยกต่างหาก
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
และไม่ได้รับผลจาก `models.providers.openai.baseUrl` ดู Accordion **เสียงแบบเรียลไทม์** ภายใต้ [เสียงและคำพูด](#voice-and-speech) สำหรับการตั้งค่า Azure ของส่วนนั้น
</Note>

ใช้ Azure OpenAI เมื่อ:

- คุณมีการสมัครใช้งาน Azure OpenAI, โควตา หรือข้อตกลงระดับองค์กรอยู่แล้ว
- คุณต้องใช้ที่พำนักของข้อมูลตามภูมิภาคหรือการควบคุมด้านการปฏิบัติตามข้อกำหนดที่ Azure มีให้
- คุณต้องการเก็บทราฟฟิกไว้ภายใน tenancy Azure ที่มีอยู่

### การกำหนดค่า

สำหรับการสร้างภาพด้วย Azure ผ่านผู้ให้บริการ `openai` ที่รวมมาให้ ให้ชี้
`models.providers.openai.baseUrl` ไปที่ทรัพยากร Azure ของคุณ และตั้งค่า `apiKey` เป็นคีย์ Azure OpenAI (ไม่ใช่คีย์ OpenAI Platform):

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

OpenClaw รู้จักส่วนต่อท้ายโฮสต์ Azure เหล่านี้สำหรับเส้นทางการสร้างภาพของ Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

สำหรับคำขอสร้างภาพบนโฮสต์ Azure ที่รู้จัก OpenClaw จะ:

- ส่งส่วนหัว `api-key` แทน `Authorization: Bearer`
- ใช้พาธที่มีขอบเขตตาม deployment (`/openai/deployments/{deployment}/...`)
- เพิ่ม `?api-version=...` ต่อท้ายแต่ละคำขอ
- ใช้ timeout คำขอเริ่มต้น 600 วินาทีสำหรับการเรียกสร้างภาพของ Azure
  ค่า `timeoutMs` รายครั้งยังคงเขียนทับค่าเริ่มต้นนี้ได้

URL ฐานอื่น ๆ (OpenAI สาธารณะ, พร็อกซีที่เข้ากันได้กับ OpenAI) จะยังคงใช้รูปแบบคำขอภาพมาตรฐานของ OpenAI

<Note>
การกำหนดเส้นทาง Azure สำหรับพาธการสร้างภาพของผู้ให้บริการ `openai` ต้องใช้
OpenClaw 2026.4.22 หรือใหม่กว่า เวอร์ชันก่อนหน้าจะปฏิบัติกับ `openai.baseUrl` แบบกำหนดเองเหมือนปลายทาง OpenAI สาธารณะ และจะล้มเหลวกับ deployment ภาพของ Azure
</Note>

### เวอร์ชัน API

ตั้งค่า `AZURE_OPENAI_API_VERSION` เพื่อตรึงเวอร์ชัน preview หรือ GA ของ Azure ที่ต้องการสำหรับพาธการสร้างภาพของ Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

ค่าเริ่มต้นคือ `2024-12-01-preview` เมื่อไม่ได้ตั้งค่าตัวแปรนี้

### ชื่อโมเดลคือชื่อ deployment

Azure OpenAI ผูกโมเดลกับ deployment สำหรับคำขอสร้างภาพของ Azure ที่กำหนดเส้นทางผ่านผู้ให้บริการ `openai` ที่รวมมาให้ ฟิลด์ `model` ใน OpenClaw ต้องเป็น **ชื่อ deployment ของ Azure** ที่คุณกำหนดค่าในพอร์ทัล Azure ไม่ใช่รหัสโมเดล OpenAI สาธารณะ

หากคุณสร้าง deployment ชื่อ `gpt-image-2-prod` ที่ให้บริการ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

กฎชื่อ deployment เดียวกันนี้ใช้กับการเรียกสร้างภาพที่กำหนดเส้นทางผ่านผู้ให้บริการ `openai` ที่รวมมาให้

### ความพร้อมใช้งานตามภูมิภาค

ปัจจุบันการสร้างภาพของ Azure มีให้ใช้เฉพาะในบางภูมิภาคเท่านั้น
(เช่น `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`) ตรวจสอบรายการภูมิภาคปัจจุบันของ Microsoft ก่อนสร้าง
deployment และยืนยันว่าโมเดลที่ต้องการมีให้ใช้ในภูมิภาคของคุณ

### ความแตกต่างของพารามิเตอร์

Azure OpenAI และ OpenAI สาธารณะไม่ได้ยอมรับพารามิเตอร์ภาพเดียวกันเสมอไป
Azure อาจปฏิเสธตัวเลือกที่ OpenAI สาธารณะอนุญาต (เช่น ค่า `background` บางค่าบน `gpt-image-2`) หรือเปิดให้ใช้เฉพาะในโมเดลบางเวอร์ชัน ความแตกต่างเหล่านี้มาจาก Azure และโมเดลพื้นฐาน ไม่ใช่ OpenClaw หากคำขอ Azure ล้มเหลวด้วยข้อผิดพลาดการตรวจสอบ ให้ตรวจสอบชุดพารามิเตอร์ที่ deployment และเวอร์ชัน API เฉพาะของคุณรองรับในพอร์ทัล Azure

<Note>
Azure OpenAI ใช้การขนส่งแบบ native และพฤติกรรม compat แต่ไม่ได้รับส่วนหัวการระบุแหล่งที่มาที่ซ่อนอยู่ของ OpenClaw — ดู Accordion **เส้นทาง Native เทียบกับเส้นทางที่เข้ากันได้กับ OpenAI** ภายใต้ [การกำหนดค่าขั้นสูง](#advanced-configuration)

สำหรับทราฟฟิกแชตหรือ Responses บน Azure (นอกเหนือจากการสร้างภาพ) ให้ใช้โฟลว์การเริ่มต้นใช้งานหรือการกำหนดค่าผู้ให้บริการ Azure เฉพาะ — `openai.baseUrl` เพียงอย่างเดียวจะไม่ใช้รูปแบบ API/การยืนยันตัวตนของ Azure ผู้ให้บริการ `azure-openai-responses/*` แยกต่างหากมีอยู่; ดู Accordion การ Compaction ฝั่งเซิร์ฟเวอร์ด้านล่าง
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การขนส่ง (WebSocket เทียบกับ SSE)">
    OpenClaw ใช้ WebSocket เป็นลำดับแรกพร้อม fallback เป็น SSE (`"auto"`) สำหรับทั้ง `openai/*` และ `openai-codex/*`

    ในโหมด `"auto"` OpenClaw จะ:
    - ลองใหม่หลัง WebSocket ล้มเหลวช่วงต้นหนึ่งครั้งก่อน fallback ไปยัง SSE
    - หลังจากล้มเหลว ทำเครื่องหมาย WebSocket ว่าเสื่อมสภาพประมาณ 60 วินาที และใช้ SSE ระหว่างช่วงพัก
    - แนบส่วนหัวตัวตนของเซสชันและ turn ที่เสถียรสำหรับการลองใหม่และการเชื่อมต่อใหม่
    - ทำให้ตัวนับการใช้งาน (`input_tokens` / `prompt_tokens`) เป็นมาตรฐานข้ามตัวแปรการขนส่ง

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
    - [การตอบกลับ API แบบสตรีมมิง (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="การวอร์มอัป WebSocket">
    OpenClaw เปิดใช้การวอร์มอัป WebSocket เป็นค่าเริ่มต้นสำหรับ `openai/*` และ `openai-codex/*` เพื่อลดเวลาแฝงของ turn แรก

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
    OpenClaw เปิดเผยตัวสลับโหมดเร็วที่ใช้ร่วมกันสำหรับ `openai/*` และ `openai-codex/*`:

    - **แชต/UI:** `/fast status|on|off`
    - **การกำหนดค่า:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    เมื่อเปิดใช้งาน OpenClaw จะแมปโหมดเร็วไปยังการประมวลผลแบบมีลำดับความสำคัญของ OpenAI (`service_tier = "priority"`) ค่า `service_tier` ที่มีอยู่จะถูกคงไว้ และโหมดเร็วจะไม่เขียน `reasoning` หรือ `text.verbosity` ใหม่

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
    การเขียนทับของเซสชันมีผลเหนือการกำหนดค่า การล้างการเขียนทับของเซสชันใน UI เซสชันจะคืนเซสชันกลับสู่ค่าเริ่มต้นที่กำหนดค่าไว้
    </Note>

  </Accordion>

  <Accordion title="การประมวลผลแบบมีลำดับความสำคัญ (service_tier)">
    API ของ OpenAI เปิดเผยการประมวลผลแบบมีลำดับความสำคัญผ่าน `service_tier` ตั้งค่ารายโมเดลใน OpenClaw:

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
    `serviceTier` จะถูกส่งต่อไปยังปลายทาง OpenAI แบบ native (`api.openai.com`) และปลายทาง Codex แบบ native (`chatgpt.com/backend-api`) เท่านั้น หากคุณส่ง provider ใด provider หนึ่งผ่าน proxy OpenClaw จะปล่อย `service_tier` ไว้เหมือนเดิม
    </Warning>

  </Accordion>

  <Accordion title="Compaction ฝั่งเซิร์ฟเวอร์ (Responses API)">
    สำหรับโมเดล OpenAI Responses โดยตรง (`openai/*` บน `api.openai.com`) ตัวห่อสตรีม Pi-harness ของ Plugin OpenAI จะเปิดใช้ Compaction ฝั่งเซิร์ฟเวอร์โดยอัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ความเข้ากันได้ของโมเดลจะตั้งค่า `supportsStore: false`)
    - แทรก `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - ค่าเริ่มต้นของ `compact_threshold`: 70% ของ `contextWindow` (หรือ `80000` เมื่อไม่พร้อมใช้งาน)

    สิ่งนี้ใช้กับเส้นทาง Pi harness ในตัว และกับ hook ของ provider OpenAI ที่ใช้โดยการรันแบบฝังตัว harness ของแอปเซิร์ฟเวอร์ Codex แบบ native จัดการบริบทของตัวเองผ่าน Codex และกำหนดค่าแยกต่างหากด้วย `agents.defaults.agentRuntime.id`

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
    `responsesServerCompaction` ควบคุมเฉพาะการแทรก `context_management` เท่านั้น โมเดล OpenAI Responses โดยตรงยังคงบังคับ `store: true` เว้นแต่ความเข้ากันได้จะตั้งค่า `supportsStore: false`
    </Note>

  </Accordion>

  <Accordion title="โหมด GPT แบบ strict-agentic">
    สำหรับการรันในตระกูล GPT-5 บน `openai/*` OpenClaw สามารถใช้สัญญาการดำเนินการแบบฝังตัวที่เข้มงวดยิ่งขึ้นได้:

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
    - ไม่ถือว่าเทิร์นที่มีแต่แผนเป็นความคืบหน้าที่สำเร็จอีกต่อไปเมื่อมีการกระทำด้วยเครื่องมือให้ใช้
    - ลองเทิร์นใหม่พร้อมการชี้นำให้ลงมือทำทันที
    - เปิดใช้ `update_plan` โดยอัตโนมัติสำหรับงานที่มีสาระสำคัญ
    - แสดงสถานะถูกบล็อกอย่างชัดเจนหากโมเดลยังคงวางแผนโดยไม่ลงมือทำ

    <Note>
    จำกัดเฉพาะการรันในตระกูล GPT-5 ของ OpenAI และ Codex เท่านั้น provider อื่นและตระกูลโมเดลที่เก่ากว่ายังคงใช้พฤติกรรมเริ่มต้น
    </Note>

  </Accordion>

  <Accordion title="เส้นทาง native เทียบกับเส้นทางที่เข้ากันได้กับ OpenAI">
    OpenClaw ปฏิบัติต่อปลายทาง OpenAI, Codex และ Azure OpenAI โดยตรงแตกต่างจาก proxy `/v1` ทั่วไปที่เข้ากันได้กับ OpenAI:

    **เส้นทาง native** (`openai/*`, Azure OpenAI):
    - เก็บ `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับ effort `none` ของ OpenAI
    - ละเว้น reasoning ที่ปิดใช้งานสำหรับโมเดลหรือ proxy ที่ปฏิเสธ `reasoning.effort: "none"`
    - ตั้ง schema ของเครื่องมือเป็นโหมด strict โดยค่าเริ่มต้น
    - แนบส่วนหัว attribution ที่ซ่อนไว้เฉพาะบนโฮสต์ native ที่ยืนยันแล้วเท่านั้น
    - คงการปรับรูปแบบคำขอที่ใช้เฉพาะกับ OpenAI (`service_tier`, `store`, reasoning-compat, คำใบ้ prompt-cache)

    **เส้นทาง proxy/ที่เข้ากันได้:**
    - ใช้พฤติกรรมความเข้ากันได้ที่ผ่อนคลายกว่า
    - ตัด `store` ของ Completions ออกจาก payload `openai-completions` ที่ไม่ใช่ native
    - ยอมรับ JSON ส่งผ่านขั้นสูง `params.extra_body`/`params.extraBody` สำหรับ proxy Completions ที่เข้ากันได้กับ OpenAI
    - ยอมรับ `params.chat_template_kwargs` สำหรับ proxy Completions ที่เข้ากันได้กับ OpenAI เช่น vLLM
    - ไม่บังคับ schema ของเครื่องมือแบบ strict หรือส่วนหัวที่ใช้เฉพาะกับ native

    Azure OpenAI ใช้การขนส่งและพฤติกรรมความเข้ากันได้แบบ native แต่จะไม่ได้รับส่วนหัว attribution ที่ซ่อนไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="การสร้างรูปภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือรูปภาพที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="OAuth และ auth" href="/th/gateway/authentication" icon="key">
    รายละเอียด auth และกฎการใช้ credential ซ้ำ
  </Card>
</CardGroup>
