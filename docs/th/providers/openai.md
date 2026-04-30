---
read_when:
    - คุณต้องการใช้โมเดล OpenAI ใน OpenClaw
    - คุณต้องการใช้การยืนยันตัวตนด้วยการสมัครใช้งาน Codex แทนคีย์ API
    - คุณต้องการพฤติกรรมการดำเนินการของเอเจนต์ GPT-5 ที่เข้มงวดยิ่งขึ้น
summary: ใช้ OpenAI ผ่านคีย์ API หรือการสมัครสมาชิก Codex ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T10:12:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: be0e2cd14990a53533c800cd8d305c9c50b0fa7131f6638e7b9d8dd9f2942fe8
    source_path: providers/openai.md
    workflow: 16
---

OpenAI มี API สำหรับนักพัฒนาสำหรับโมเดล GPT และ Codex ยังพร้อมใช้งานในฐานะเอเจนต์เขียนโค้ดของแผน ChatGPT ผ่านไคลเอนต์ Codex ของ OpenAI ด้วย OpenClaw แยกพื้นผิวเหล่านี้ออกจากกันเพื่อให้ config คาดเดาได้

OpenClaw รองรับเส้นทางตระกูล OpenAI สามเส้นทาง prefix ของโมเดลจะเลือกเส้นทาง provider/auth ส่วนการตั้งค่า runtime แยกต่างหากจะเลือกผู้ที่รันลูปเอเจนต์แบบฝัง:

- **คีย์ API** — การเข้าถึง OpenAI Platform โดยตรงพร้อมการเรียกเก็บเงินตามการใช้งาน (โมเดล `openai/*`)
- **การสมัครสมาชิก Codex ผ่าน PI** — การลงชื่อเข้าใช้ ChatGPT/Codex พร้อมการเข้าถึงแบบสมัครสมาชิก (โมเดล `openai-codex/*`)
- **harness ของ app-server Codex** — การรัน app-server Codex แบบเนทีฟ (โมเดล `openai/*` พร้อม `agents.defaults.agentRuntime.id: "codex"`)

OpenAI รองรับการใช้ OAuth แบบสมัครสมาชิกในเครื่องมือและเวิร์กโฟลว์ภายนอกอย่าง OpenClaw อย่างชัดเจน

Provider, โมเดล, runtime และช่องทางเป็นเลเยอร์ที่แยกจากกัน หากป้ายกำกับเหล่านี้ถูกปนกัน โปรดอ่าน [runtime ของเอเจนต์](/th/concepts/agent-runtimes) ก่อนเปลี่ยน config

## ตัวเลือกแบบรวดเร็ว

| เป้าหมาย                                      | ใช้                                              | หมายเหตุ                                                                    |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| การเรียกเก็บเงินด้วยคีย์ API โดยตรง          | `openai/gpt-5.5`                                 | ตั้งค่า `OPENAI_API_KEY` หรือรันการเริ่มต้นใช้งานคีย์ API ของ OpenAI        |
| GPT-5.5 พร้อม auth แบบสมัครสมาชิก ChatGPT/Codex | `openai-codex/gpt-5.5`                           | เส้นทาง PI เริ่มต้นสำหรับ Codex OAuth เป็นตัวเลือกแรกที่ดีที่สุดสำหรับการตั้งค่าแบบสมัครสมาชิก |
| GPT-5.5 พร้อมพฤติกรรม app-server Codex แบบเนทีฟ | `openai/gpt-5.5` พร้อม `agentRuntime.id: "codex"` | บังคับใช้ harness ของ app-server Codex สำหรับ ref ของโมเดลนั้น             |
| การสร้างหรือแก้ไขรูปภาพ                       | `openai/gpt-image-2`                             | ใช้งานได้กับทั้ง `OPENAI_API_KEY` หรือ OpenAI Codex OAuth                   |
| รูปภาพพื้นหลังโปร่งใส                         | `openai/gpt-image-1.5`                           | ใช้ `outputFormat=png` หรือ `webp` และ `openai.background=transparent`       |

## แผนผังชื่อ

ชื่อเหล่านี้คล้ายกันแต่ใช้แทนกันไม่ได้:

| ชื่อที่คุณเห็น                    | เลเยอร์          | ความหมาย                                                                                         |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | prefix ของ provider | เส้นทาง API ของ OpenAI Platform โดยตรง                                                           |
| `openai-codex`                     | prefix ของ provider | เส้นทาง OAuth/สมัครสมาชิกของ OpenAI Codex ผ่าน runner PI ปกติของ OpenClaw                       |
| `codex` plugin                     | Plugin            | Plugin ที่มาพร้อม OpenClaw ซึ่งให้ runtime ของ app-server Codex แบบเนทีฟและการควบคุมแชต `/codex` |
| `agentRuntime.id: codex`           | runtime ของเอเจนต์ | บังคับใช้ harness ของ app-server Codex แบบเนทีฟสำหรับ turn แบบฝัง                              |
| `/codex ...`                       | ชุดคำสั่งแชต     | ผูก/ควบคุม thread ของ app-server Codex จากการสนทนา                                             |
| `runtime: "acp", agentId: "codex"` | เส้นทางเซสชัน ACP | เส้นทาง fallback แบบชัดเจนที่รัน Codex ผ่าน ACP/acpx                                            |

ซึ่งหมายความว่า config หนึ่งสามารถตั้งใจให้มีทั้ง `openai-codex/*` และ Plugin `codex` ได้ สิ่งนี้ถูกต้องเมื่อคุณต้องการ Codex OAuth ผ่าน PI และยังต้องการให้การควบคุมแชต `/codex` แบบเนทีฟพร้อมใช้งานด้วย `openclaw doctor` จะเตือนเกี่ยวกับการรวมกันนี้เพื่อให้คุณยืนยันได้ว่าเป็นความตั้งใจจริง และจะไม่เขียนทับ

<Note>
GPT-5.5 พร้อมใช้งานผ่านทั้งการเข้าถึงด้วยคีย์ API ของ OpenAI Platform โดยตรงและเส้นทาง subscription/OAuth ใช้ `openai/gpt-5.5` สำหรับทราฟฟิก `OPENAI_API_KEY` โดยตรง, `openai-codex/gpt-5.5` สำหรับ Codex OAuth ผ่าน PI หรือ `openai/gpt-5.5` พร้อม `agentRuntime.id: "codex"` สำหรับ harness ของ app-server Codex แบบเนทีฟ
</Note>

<Note>
การเปิดใช้ Plugin OpenAI หรือการเลือกโมเดล `openai-codex/*` ไม่ได้เปิดใช้ Plugin app-server Codex ที่มาพร้อมกัน OpenClaw จะเปิดใช้ Plugin นั้นเฉพาะเมื่อคุณเลือก harness Codex แบบเนทีฟอย่างชัดเจนด้วย `agentRuntime.id: "codex"` หรือใช้ ref โมเดล `codex/*` แบบเดิม หาก Plugin `codex` ที่มาพร้อมกันถูกเปิดใช้แต่ `openai-codex/*` ยัง resolve ผ่าน PI อยู่ `openclaw doctor` จะเตือนและปล่อยเส้นทางไว้ตามเดิม
</Note>

## ความครอบคลุมฟีเจอร์ของ OpenClaw

| ความสามารถของ OpenAI     | พื้นผิวของ OpenClaw                                      | สถานะ                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| แชต / Responses           | provider โมเดล `openai/<model>`                           | ใช่                                                    |
| โมเดลสมัครสมาชิก Codex   | `openai-codex/<model>` พร้อม OAuth ของ `openai-codex`      | ใช่                                                    |
| harness ของ app-server Codex | `openai/<model>` พร้อม `agentRuntime.id: codex`             | ใช่                                                    |
| การค้นเว็บฝั่งเซิร์ฟเวอร์ | เครื่องมือ OpenAI Responses แบบเนทีฟ                       | ใช่ เมื่อเปิดใช้การค้นเว็บและไม่ได้ pin provider      |
| รูปภาพ                    | `image_generate`                                           | ใช่                                                    |
| วิดีโอ                    | `video_generate`                                           | ใช่                                                    |
| ข้อความเป็นเสียง          | `messages.tts.provider: "openai"` / `tts`                  | ใช่                                                    |
| เสียงเป็นข้อความแบบ batch | `tools.media.audio` / การทำความเข้าใจสื่อ                  | ใช่                                                    |
| เสียงเป็นข้อความแบบ streaming | Voice Call `streaming.provider: "openai"`                  | ใช่                                                    |
| เสียงเรียลไทม์           | Voice Call `realtime.provider: "openai"` / Control UI Talk | ใช่                                                    |
| Embeddings                | provider embedding ของหน่วยความจำ                          | ใช่                                                    |

## embedding ของหน่วยความจำ

OpenClaw สามารถใช้ OpenAI หรือ endpoint embedding ที่เข้ากันได้กับ OpenAI สำหรับการทำดัชนี `memory_search` และ embedding ของคำค้นหา:

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

สำหรับ endpoint ที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้ป้ายกำกับ embedding แบบไม่สมมาตร ให้ตั้งค่า `queryInputType` และ `documentInputType` ใต้ `memorySearch` OpenClaw จะส่งต่อค่าเหล่านั้นเป็นฟิลด์คำขอ `input_type` เฉพาะ provider: embedding ของคำค้นหาใช้ `queryInputType`; ชิ้นส่วนหน่วยความจำที่ทำดัชนีและการทำดัชนีแบบ batch ใช้ `documentInputType` ดูตัวอย่างเต็มได้ที่ [ข้อมูลอ้างอิงการตั้งค่าหน่วยความจำ](/th/reference/memory-config#provider-specific-config)

## เริ่มต้นใช้งาน

เลือกวิธี auth ที่คุณต้องการและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **เหมาะสำหรับ:** การเข้าถึง API โดยตรงและการเรียกเก็บเงินตามการใช้งาน

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

    | ref โมเดล              | config runtime             | เส้นทาง                    | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | ละไว้ / `agentRuntime.id: "pi"`    | API ของ OpenAI Platform โดยตรง | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | ละไว้ / `agentRuntime.id: "pi"`    | API ของ OpenAI Platform โดยตรง | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | harness ของ app-server Codex    | app-server Codex |

    <Note>
    `openai/*` คือเส้นทางคีย์ API ของ OpenAI โดยตรง เว้นแต่คุณจะบังคับใช้ harness ของ app-server Codex อย่างชัดเจน ใช้ `openai-codex/*` สำหรับ Codex OAuth ผ่าน runner PI เริ่มต้น หรือใช้ `openai/gpt-5.5` พร้อม `agentRuntime.id: "codex"` สำหรับการรัน app-server Codex แบบเนทีฟ
    </Note>

    ### ตัวอย่าง config

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **ไม่** เปิดเผย `openai/gpt-5.3-codex-spark` คำขอ API ของ OpenAI แบบ live จะปฏิเสธโมเดลนั้น และแค็ตตาล็อก Codex ปัจจุบันก็ไม่เปิดเผยโมเดลนี้เช่นกัน
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **เหมาะสำหรับ:** การใช้การสมัครสมาชิก ChatGPT/Codex ของคุณแทนคีย์ API แยกต่างหาก Codex cloud ต้องลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        หรือรัน OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        สำหรับการตั้งค่าแบบ headless หรือที่ไม่เหมาะกับ callback ให้เพิ่ม `--device-code` เพื่อลงชื่อเข้าใช้ด้วย flow device-code ของ ChatGPT แทน callback ของเบราว์เซอร์ localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Set the default model">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | ref โมเดล | config runtime | เส้นทาง | Auth |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | ละไว้ / `runtime: "pi"` | ChatGPT/Codex OAuth ผ่าน PI | การลงชื่อเข้าใช้ Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | ยังเป็น PI เว้นแต่ Plugin จะ claim `openai-codex` อย่างชัดเจน | การลงชื่อเข้าใช้ Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | harness ของ app-server Codex | auth ของ app-server Codex |

    <Note>
    ใช้ id provider `openai-codex` ต่อไปสำหรับคำสั่ง auth/profile prefix โมเดล `openai-codex/*` ยังเป็นเส้นทาง PI แบบชัดเจนสำหรับ Codex OAuth ด้วย เส้นทางนี้ไม่ได้เลือกหรือเปิดใช้ harness ของ app-server Codex ที่มาพร้อมกันโดยอัตโนมัติ
    </Note>

    <Warning>
    `openai-codex/gpt-5.4-mini` ไม่ใช่เส้นทาง Codex OAuth ที่รองรับ ใช้ `openai/gpt-5.4-mini` พร้อมคีย์ API ของ OpenAI หรือใช้ `openai-codex/gpt-5.5` พร้อม Codex OAuth
    </Warning>

    ### ตัวอย่าง config

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    การเริ่มต้นใช้งานจะไม่นำเข้าวัสดุ OAuth จาก `~/.codex` อีกต่อไป ลงชื่อเข้าใช้ด้วย OAuth ผ่านเบราว์เซอร์ (ค่าเริ่มต้น) หรือ flow device-code ข้างต้น — OpenClaw จัดการข้อมูลประจำตัวที่ได้ใน store auth ของเอเจนต์ของตัวเอง
    </Note>

    ### ตัวบ่งชี้สถานะ

    Chat `/status` จะแสดงว่ารันไทม์ของโมเดลใดกำลังทำงานอยู่สำหรับเซสชันปัจจุบัน
    ฮาร์เนส PI เริ่มต้นจะแสดงเป็น `Runtime: OpenClaw Pi Default` เมื่อเลือก
    ฮาร์เนสแอปเซิร์ฟเวอร์ Codex ที่รวมมาให้ `/status` จะแสดง
    `Runtime: OpenAI Codex` เซสชันที่มีอยู่จะยังคงใช้ id ฮาร์เนสที่บันทึกไว้ ดังนั้นให้ใช้
    `/new` หรือ `/reset` หลังจากเปลี่ยน `agentRuntime` หากคุณต้องการให้ `/status`
    แสดงตัวเลือก PI/Codex ใหม่

    ### คำเตือนจาก Doctor

    หากเปิดใช้ Plugin `codex` ที่รวมมาให้ขณะที่เลือกเส้นทาง
    `openai-codex/*` ของแท็บนี้ `openclaw doctor` จะเตือนว่าโมเดล
    ยังคงถูก resolve ผ่าน PI ให้คงการกำหนดค่าไว้เหมือนเดิมเมื่อเป็นเส้นทาง
    auth แบบ subscription ที่ต้องการ เปลี่ยนไปใช้ `openai/<model>` พร้อม
    `agentRuntime.id: "codex"` เฉพาะเมื่อคุณต้องการให้ Codex
    app-server ทำงานแบบเนทีฟ

    ### เพดานหน้าต่างบริบท

    OpenClaw ถือว่าเมทาดาทาของโมเดลและเพดานบริบทของรันไทม์เป็นคนละค่า

    สำหรับ `openai-codex/gpt-5.5` ผ่าน Codex OAuth:

    - `contextWindow` แบบเนทีฟ: `1000000`
    - เพดาน `contextTokens` เริ่มต้นของรันไทม์: `272000`

    เพดานเริ่มต้นที่เล็กกว่านี้ให้คุณลักษณะด้านเวลาแฝงและคุณภาพที่ดีกว่าในทางปฏิบัติ Override ได้ด้วย `contextTokens`:

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
    ใช้ `contextWindow` เพื่อประกาศเมทาดาทาเนทีฟของโมเดล ใช้ `contextTokens` เพื่อจำกัดงบประมาณบริบทของรันไทม์
    </Note>

    ### การกู้คืนแคตตาล็อก

    OpenClaw ใช้เมทาดาทาแคตตาล็อก Codex จาก upstream สำหรับ `gpt-5.5` เมื่อมีอยู่
    หากการค้นพบ Codex แบบสดละเว้นแถว `openai-codex/gpt-5.5` ขณะที่
    บัญชีผ่านการยืนยันตัวตนแล้ว OpenClaw จะสังเคราะห์แถวโมเดล OAuth นั้นเพื่อให้
    การรัน cron, sub-agent และ default-model ที่กำหนดค่าไว้ไม่ล้มเหลวด้วย
    `Unknown model`

  </Tab>
</Tabs>

## Auth ของ Codex app-server แบบเนทีฟ

ฮาร์เนส Codex app-server แบบเนทีฟใช้ model refs `openai/*` พร้อม
`agentRuntime.id: "codex"` แต่ auth ของมันยังคงอิงบัญชี OpenClaw
เลือก auth ตามลำดับนี้:

1. โปรไฟล์ auth `openai-codex` ของ OpenClaw ที่ระบุชัดเจนและผูกกับ agent
2. บัญชีที่มีอยู่ของ app-server เช่น การลงชื่อเข้าใช้ ChatGPT ของ Codex CLI ภายในเครื่อง
3. สำหรับการเปิด app-server แบบ stdio ภายในเครื่องเท่านั้น ใช้ `CODEX_API_KEY` แล้วจึง
   `OPENAI_API_KEY` เมื่อ app-server รายงานว่าไม่มีบัญชีและยังต้องใช้
   OpenAI auth

นั่นหมายความว่าการลงชื่อเข้าใช้ subscription ChatGPT/Codex ภายในเครื่องจะไม่ถูกแทนที่เพียงเพราะ
กระบวนการ Gateway มี `OPENAI_API_KEY` สำหรับโมเดล OpenAI โดยตรง
หรือ embeddings ด้วย การ fallback ไปใช้ env API-key เป็นเฉพาะเส้นทาง stdio ภายในเครื่องที่ไม่มีบัญชีเท่านั้น
และจะไม่ถูกส่งไปยังการเชื่อมต่อ WebSocket app-server เมื่อเลือกโปรไฟล์ Codex
แบบ subscription OpenClaw ยังกัน `CODEX_API_KEY` และ `OPENAI_API_KEY`
ออกจาก child ของ stdio app-server ที่ spawn ขึ้นมา และส่ง credentials ที่เลือกไว้
ผ่าน RPC เข้าสู่ระบบของ app-server

## การสร้างภาพ

Plugin `openai` ที่รวมมาให้ลงทะเบียนการสร้างภาพผ่านเครื่องมือ `image_generate`
รองรับทั้งการสร้างภาพด้วย OpenAI API-key และการสร้างภาพด้วย Codex OAuth
ผ่าน model ref `openai/gpt-image-2` เดียวกัน

| ความสามารถ                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | การลงชื่อเข้าใช้ OpenAI Codex OAuth |
| การรับส่งข้อมูล           | OpenAI Images API                  | Codex Responses backend              |
| จำนวนภาพสูงสุดต่อคำขอ    | 4                                  | 4                                    |
| โหมดแก้ไข                 | เปิดใช้แล้ว (สูงสุด 5 ภาพอ้างอิง) | เปิดใช้แล้ว (สูงสุด 5 ภาพอ้างอิง)   |
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
ดู [การสร้างภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

`gpt-image-2` เป็นค่าเริ่มต้นสำหรับทั้งการสร้างภาพจากข้อความของ OpenAI และการ
แก้ไขภาพ `gpt-image-1.5`, `gpt-image-1` และ `gpt-image-1-mini` ยังคงใช้ได้เมื่อเป็น
การ override โมเดลแบบระบุชัดเจน ใช้ `openai/gpt-image-1.5` สำหรับเอาต์พุต
PNG/WebP ที่มีพื้นหลังโปร่งใส; API `gpt-image-2` ปัจจุบันปฏิเสธ
`background: "transparent"`

สำหรับคำขอพื้นหลังโปร่งใส agent ควรเรียก `image_generate` ด้วย
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` หรือ `"webp"` และ
`background: "transparent"`; ตัวเลือก provider รุ่นเก่า `openai.background` ยัง
ยอมรับอยู่ OpenClaw ยังปกป้องเส้นทาง OpenAI สาธารณะและ
OpenAI Codex OAuth โดย rewrite คำขอพื้นหลังโปร่งใสเริ่มต้น `openai/gpt-image-2`
ไปเป็น `gpt-image-1.5`; Azure และ endpoint แบบ custom ที่เข้ากันได้กับ OpenAI จะยังคง
ใช้ชื่อ deployment/model ที่กำหนดค่าไว้

การตั้งค่าเดียวกันนี้เปิดให้ใช้สำหรับการรัน CLI แบบ headless ด้วย:

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
`--openai-background` ยังคงพร้อมใช้งานเป็น alias เฉพาะ OpenAI

สำหรับการติดตั้ง Codex OAuth ให้คง ref `openai/gpt-image-2` เดิมไว้ เมื่อกำหนดค่า
โปรไฟล์ OAuth `openai-codex` แล้ว OpenClaw จะ resolve access token OAuth ที่เก็บไว้
และส่งคำขอภาพผ่าน Codex Responses backend โดยจะไม่ลองใช้
`OPENAI_API_KEY` ก่อนหรือ fallback เป็น API key แบบเงียบสำหรับคำขอนั้น
กำหนดค่า `models.providers.openai` อย่างชัดเจนด้วย API key,
base URL แบบ custom หรือ Azure endpoint เมื่อคุณต้องการใช้เส้นทาง OpenAI Images API
โดยตรงแทน
หาก image endpoint แบบ custom นั้นอยู่บน LAN/private address ที่เชื่อถือได้ ให้ตั้งค่า
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ด้วย; OpenClaw จะยังคง
บล็อก image endpoint แบบ private/internal ที่เข้ากันได้กับ OpenAI เว้นแต่จะมี opt-in นี้

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

| ความสามารถ       | ค่า                                                                               |
| ---------------- | --------------------------------------------------------------------------------- |
| โมเดลเริ่มต้น    | `openai/sora-2`                                                                   |
| โหมด             | ข้อความเป็นวิดีโอ, ภาพเป็นวิดีโอ, แก้ไขวิดีโอเดี่ยว                              |
| อินพุตอ้างอิง    | 1 ภาพ หรือ 1 วิดีโอ                                                               |
| การ override ขนาด | รองรับ                                                                           |
| การ override อื่น | `aspectRatio`, `resolution`, `audio`, `watermark` จะถูกละเว้นพร้อมคำเตือนจากเครื่องมือ |

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

## การมีส่วนร่วมของพรอมป์ GPT-5

OpenClaw เพิ่มการมีส่วนร่วมของพรอมป์ GPT-5 ที่ใช้ร่วมกันสำหรับการรันตระกูล GPT-5 ข้าม providers โดยใช้ตาม model id ดังนั้น `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` และ refs GPT-5 อื่นที่เข้ากันได้จะได้รับ overlay เดียวกัน โมเดล GPT-4.x รุ่นเก่าจะไม่ได้รับ

ฮาร์เนส Codex เนทีฟที่รวมมาให้ใช้พฤติกรรม GPT-5 และ overlay Heartbeat เดียวกันผ่านคำสั่งสำหรับนักพัฒนาของ Codex app-server ดังนั้นเซสชัน `openai/gpt-5.x` ที่บังคับผ่าน `agentRuntime.id: "codex"` จะยังคงคำแนะนำเรื่อง follow-through และ Heartbeat เชิงรุกเหมือนเดิม แม้ว่า Codex จะเป็นเจ้าของส่วนที่เหลือของพรอมป์ฮาร์เนสก็ตาม

การมีส่วนร่วมของ GPT-5 เพิ่มสัญญาพฤติกรรมแบบมีแท็กสำหรับการคง persona, ความปลอดภัยในการดำเนินการ, วินัยในการใช้เครื่องมือ, รูปแบบเอาต์พุต, การตรวจสอบความเสร็จสมบูรณ์ และการยืนยันความถูกต้อง พฤติกรรมการตอบกลับเฉพาะช่องทางและ silent-message ยังคงอยู่ในพรอมป์ระบบ OpenClaw ที่ใช้ร่วมกันและนโยบายการส่งออก คำแนะนำ GPT-5 จะเปิดใช้เสมอสำหรับโมเดลที่ตรงกัน เลเยอร์สไตล์การโต้ตอบแบบเป็นมิตรจะแยกต่างหากและกำหนดค่าได้

| ค่า                    | ผลลัพธ์                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้เลเยอร์สไตล์การโต้ตอบแบบเป็นมิตร |
| `"on"`                 | Alias สำหรับ `"friendly"`                   |
| `"off"`                | ปิดเฉพาะเลเยอร์สไตล์แบบเป็นมิตร            |

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
ค่าจะไม่สนตัวพิมพ์เล็กใหญ่ใน runtime ดังนั้น `"Off"` และ `"off"` ต่างก็ปิดเลเยอร์สไตล์แบบเป็นมิตร
</Tip>

<Note>
`plugins.entries.openai.config.personality` รุ่นเก่ายังคงถูกอ่านเป็น fallback เพื่อความเข้ากันได้เมื่อไม่ได้ตั้งค่า `agents.defaults.promptOverlays.gpt5.personality` ที่ใช้ร่วมกัน
</Note>

## เสียงและคำพูด

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    Plugin `openai` ที่รวมมาให้ลงทะเบียนการสังเคราะห์เสียงพูดสำหรับพื้นผิว `messages.tts`

    | การตั้งค่า | เส้นทาง config | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | เสียง | `messages.tts.providers.openai.voice` | `coral` |
    | ความเร็ว | `messages.tts.providers.openai.speed` | (ไม่ได้ตั้งค่า) |
    | คำสั่ง | `messages.tts.providers.openai.instructions` | (ไม่ได้ตั้งค่า, เฉพาะ `gpt-4o-mini-tts`) |
    | รูปแบบ | `messages.tts.providers.openai.responseFormat` | `opus` สำหรับ voice notes, `mp3` สำหรับไฟล์ |
    | API key | `messages.tts.providers.openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    โมเดลที่ใช้ได้: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd` เสียงที่ใช้ได้: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`

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
    ตั้งค่า `OPENAI_TTS_BASE_URL` เพื่อ override base URL ของ TTS โดยไม่กระทบ endpoint ของ chat API
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `openai` ที่รวมมาให้ลงทะเบียน speech-to-text แบบ batch ผ่าน
    พื้นผิวการถอดเสียง media-understanding ของ OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - เส้นทางอินพุต: การอัปโหลดไฟล์เสียงแบบ multipart
    - รองรับโดย OpenClaw ทุกที่ที่การถอดเสียงขาเข้าใช้
      `tools.media.audio` รวมถึงส่วนเสียงของ voice-channel ใน Discord และ
      ไฟล์แนบเสียงของช่องทาง

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

    คำใบ้ภาษาและพร้อมต์จะถูกส่งต่อไปยัง OpenAI เมื่อระบุผ่านการกำหนดค่าสื่อเสียง
    แบบใช้ร่วมกันหรือคำขอถอดเสียงรายครั้ง

  </Accordion>

  <Accordion title="การถอดเสียงแบบเรียลไทม์">
    Plugin `openai` ที่มาพร้อมระบบจะลงทะเบียนการถอดเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | เส้นทางการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | ภาษา | `...openai.language` | (ไม่ได้ตั้งค่า) |
    | พร้อมต์ | `...openai.prompt` | (ไม่ได้ตั้งค่า) |
    | ระยะเวลาความเงียบ | `...openai.silenceDurationMs` | `800` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | คีย์ API | `...openai.apiKey` | ย้อนกลับไปใช้ `OPENAI_API_KEY` |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียง G.711 u-law (`g711_ulaw` / `audio/pcmu`) ผู้ให้บริการสตรีมมิงนี้ใช้สำหรับเส้นทางการถอดเสียงแบบเรียลไทม์ของ Voice Call; เสียงของ Discord ในปัจจุบันจะบันทึกเป็นช่วงสั้นๆ และใช้เส้นทางการถอดเสียงแบบแบตช์ `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="เสียงแบบเรียลไทม์">
    Plugin `openai` ที่มาพร้อมระบบจะลงทะเบียนเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | เส้นทางการกำหนดค่า | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | เสียง | `...openai.voice` | `alloy` |
    | อุณหภูมิ | `...openai.temperature` | `0.8` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | ระยะเวลาความเงียบ | `...openai.silenceDurationMs` | `500` |
    | คีย์ API | `...openai.apiKey` | ย้อนกลับไปใช้ `OPENAI_API_KEY` |

    <Note>
    รองรับ Azure OpenAI ผ่านคีย์การกำหนดค่า `azureEndpoint` และ `azureDeployment` สำหรับบริดจ์เรียลไทม์ฝั่งแบ็กเอนด์ รองรับการเรียกเครื่องมือแบบสองทิศทาง ใช้รูปแบบเสียง G.711 u-law
    </Note>

    <Note>
    Control UI Talk ใช้เซสชันเรียลไทม์ในเบราว์เซอร์ของ OpenAI พร้อมความลับไคลเอนต์ชั่วคราว
    ที่ Gateway ออกให้ และการแลกเปลี่ยน WebRTC SDP จากเบราว์เซอร์โดยตรงกับ
    OpenAI Realtime API การตรวจสอบแบบสดสำหรับผู้ดูแลพร้อมใช้งานด้วย
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ฝั่ง OpenAI จะออกความลับไคลเอนต์ใน Node, สร้างข้อเสนอ SDP ของเบราว์เซอร์
    พร้อมสื่อไมโครโฟนจำลอง, โพสต์ไปยัง OpenAI และใช้คำตอบ SDP
    โดยไม่บันทึกความลับ
    </Note>

  </Accordion>
</AccordionGroup>

## เอนด์พอยต์ Azure OpenAI

ผู้ให้บริการ `openai` ที่มาพร้อมระบบสามารถชี้ไปยังทรัพยากร Azure OpenAI สำหรับการสร้างรูปภาพ
ได้โดยการแทนที่ URL ฐาน บนเส้นทางการสร้างรูปภาพ OpenClaw
จะตรวจจับชื่อโฮสต์ Azure บน `models.providers.openai.baseUrl` และสลับไปใช้
รูปแบบคำขอของ Azure โดยอัตโนมัติ

<Note>
เสียงแบบเรียลไทม์ใช้เส้นทางการกำหนดค่าแยกต่างหาก
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
และไม่ได้รับผลจาก `models.providers.openai.baseUrl` ดู Accordion **เสียงแบบเรียลไทม์**
ใต้ [เสียงและคำพูด](#voice-and-speech) สำหรับการตั้งค่า Azure
ของฟีเจอร์นี้
</Note>

ใช้ Azure OpenAI เมื่อ:

- คุณมีการสมัครใช้งาน Azure OpenAI, โควตา หรือข้อตกลงระดับองค์กรอยู่แล้ว
- คุณต้องการถิ่นที่อยู่ของข้อมูลตามภูมิภาคหรือการควบคุมการปฏิบัติตามข้อกำหนดที่ Azure มีให้
- คุณต้องการให้ทราฟฟิกอยู่ภายในผู้เช่า Azure ที่มีอยู่

### การกำหนดค่า

สำหรับการสร้างรูปภาพผ่าน Azure ด้วยผู้ให้บริการ `openai` ที่มาพร้อมระบบ ให้ชี้
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

OpenClaw รู้จักส่วนต่อท้ายโฮสต์ Azure เหล่านี้สำหรับเส้นทางการสร้างรูปภาพของ Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

สำหรับคำขอสร้างรูปภาพบนโฮสต์ Azure ที่รู้จัก OpenClaw จะ:

- ส่งส่วนหัว `api-key` แทน `Authorization: Bearer`
- ใช้เส้นทางที่มีขอบเขตตามดีพลอยเมนต์ (`/openai/deployments/{deployment}/...`)
- ต่อท้าย `?api-version=...` กับแต่ละคำขอ
- ใช้ค่าเริ่มต้นการหมดเวลาคำขอ 600 วินาทีสำหรับการเรียกสร้างรูปภาพของ Azure
  ค่า `timeoutMs` รายคำขอยังคงแทนที่ค่าเริ่มต้นนี้

URL ฐานอื่นๆ (OpenAI สาธารณะ, พร็อกซีที่เข้ากันได้กับ OpenAI) จะคงใช้
รูปแบบคำขอรูปภาพมาตรฐานของ OpenAI

<Note>
การกำหนดเส้นทาง Azure สำหรับเส้นทางการสร้างรูปภาพของผู้ให้บริการ `openai`
ต้องใช้ OpenClaw 2026.4.22 หรือใหม่กว่า เวอร์ชันก่อนหน้าจะถือว่า
`openai.baseUrl` แบบกำหนดเองใดๆ เหมือนเอนด์พอยต์ OpenAI สาธารณะและจะล้มเหลวกับ
ดีพลอยเมนต์รูปภาพของ Azure
</Note>

### เวอร์ชัน API

ตั้งค่า `AZURE_OPENAI_API_VERSION` เพื่อปักหมุดเวอร์ชัน Azure preview หรือ GA เฉพาะ
สำหรับเส้นทางการสร้างรูปภาพของ Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

ค่าเริ่มต้นคือ `2024-12-01-preview` เมื่อไม่ได้ตั้งค่าตัวแปร

### ชื่อโมเดลคือชื่อดีพลอยเมนต์

Azure OpenAI ผูกโมเดลกับดีพลอยเมนต์ สำหรับคำขอสร้างรูปภาพของ Azure
ที่กำหนดเส้นทางผ่านผู้ให้บริการ `openai` ที่มาพร้อมระบบ ฟิลด์ `model` ใน OpenClaw
ต้องเป็น **ชื่อดีพลอยเมนต์ Azure** ที่คุณกำหนดค่าไว้ในพอร์ทัล Azure ไม่ใช่
รหัสโมเดล OpenAI สาธารณะ

หากคุณสร้างดีพลอยเมนต์ชื่อ `gpt-image-2-prod` ที่ให้บริการ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

กฎชื่อดีพลอยเมนต์เดียวกันนี้ใช้กับการเรียกสร้างรูปภาพที่กำหนดเส้นทางผ่าน
ผู้ให้บริการ `openai` ที่มาพร้อมระบบ

### ความพร้อมใช้งานตามภูมิภาค

การสร้างรูปภาพของ Azure ปัจจุบันพร้อมใช้งานเฉพาะในบางภูมิภาคเท่านั้น
(เช่น `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`) ตรวจสอบรายการภูมิภาคปัจจุบันของ Microsoft ก่อนสร้าง
ดีพลอยเมนต์ และยืนยันว่าโมเดลเฉพาะนั้นมีให้บริการในภูมิภาคของคุณ

### ความแตกต่างของพารามิเตอร์

Azure OpenAI และ OpenAI สาธารณะไม่ได้ยอมรับพารามิเตอร์รูปภาพเดียวกันเสมอไป
Azure อาจปฏิเสธตัวเลือกที่ OpenAI สาธารณะอนุญาต (เช่นค่า
`background` บางค่าบน `gpt-image-2`) หรือเปิดเผยตัวเลือกเหล่านั้นเฉพาะในเวอร์ชันโมเดล
บางเวอร์ชัน ความแตกต่างเหล่านี้มาจาก Azure และโมเดลพื้นฐาน ไม่ใช่
OpenClaw หากคำขอ Azure ล้มเหลวด้วยข้อผิดพลาดการตรวจสอบความถูกต้อง ให้ตรวจสอบ
ชุดพารามิเตอร์ที่ดีพลอยเมนต์และเวอร์ชัน API เฉพาะของคุณรองรับใน
พอร์ทัล Azure

<Note>
Azure OpenAI ใช้การขนส่งแบบเนทีฟและพฤติกรรมความเข้ากันได้ แต่ไม่ได้รับ
ส่วนหัวการระบุแหล่งที่มาที่ซ่อนอยู่ของ OpenClaw — ดู Accordion **เส้นทางเนทีฟเทียบกับเส้นทางที่เข้ากันได้กับ OpenAI**
ใต้ [การกำหนดค่าขั้นสูง](#advanced-configuration)

สำหรับทราฟฟิกแชตหรือ Responses บน Azure (นอกเหนือจากการสร้างรูปภาพ) ให้ใช้
โฟลว์การเริ่มต้นใช้งานหรือการกำหนดค่าผู้ให้บริการ Azure เฉพาะ — `openai.baseUrl` เพียงอย่างเดียว
จะไม่เลือกใช้รูปแบบ API/auth ของ Azure มีผู้ให้บริการ
`azure-openai-responses/*` แยกต่างหาก; ดู
Accordion Server-side compaction ด้านล่าง
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การขนส่ง (WebSocket เทียบกับ SSE)">
    OpenClaw ใช้ WebSocket เป็นหลักพร้อม fallback เป็น SSE (`"auto"`) สำหรับทั้ง `openai/*` และ `openai-codex/*`

    ในโหมด `"auto"` OpenClaw จะ:
    - ลองใหม่เมื่อ WebSocket ล้มเหลวตั้งแต่ต้นหนึ่งครั้งก่อน fallback เป็น SSE
    - หลังจากล้มเหลว จะทำเครื่องหมาย WebSocket ว่าเสื่อมคุณภาพประมาณ 60 วินาทีและใช้ SSE ระหว่างช่วงพัก
    - แนบส่วนหัวตัวตนเซสชันและเทิร์นที่เสถียรสำหรับการลองใหม่และการเชื่อมต่อใหม่
    - ปรับตัวนับการใช้งาน (`input_tokens` / `prompt_tokens`) ให้เป็นรูปแบบเดียวกันข้ามตัวแปรการขนส่ง

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
    OpenClaw เปิดเผยสวิตช์โหมดเร็วแบบใช้ร่วมกันสำหรับ `openai/*` และ `openai-codex/*`:

    - **แชต/UI:** `/fast status|on|off`
    - **การกำหนดค่า:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    เมื่อเปิดใช้ OpenClaw จะจับคู่โหมดเร็วกับการประมวลผลแบบมีลำดับความสำคัญของ OpenAI (`service_tier = "priority"`) ค่า `service_tier` ที่มีอยู่จะถูกเก็บไว้ และโหมดเร็วจะไม่เขียน `reasoning` หรือ `text.verbosity` ใหม่

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
    การแทนที่ของเซสชันมีผลเหนือการกำหนดค่า การล้างการแทนที่ของเซสชันใน UI Sessions จะคืนเซสชันกลับไปยังค่าเริ่มต้นที่กำหนดค่าไว้
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
    `serviceTier` จะถูกส่งต่อเฉพาะไปยังเอนด์พอยต์ OpenAI แบบเนทีฟ (`api.openai.com`) และเอนด์พอยต์ Codex แบบเนทีฟ (`chatgpt.com/backend-api`) เท่านั้น หากคุณกำหนดเส้นทางผู้ให้บริการใดผู้ให้บริการหนึ่งผ่านพร็อกซี OpenClaw จะปล่อย `service_tier` ไว้โดยไม่แตะต้อง
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    สำหรับโมเดล OpenAI Responses โดยตรง (`openai/*` บน `api.openai.com`) ตัวห่อสตรีม Pi-harness ของ Plugin OpenAI จะเปิดใช้ server-side compaction โดยอัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ความเข้ากันได้ของโมเดลจะตั้งค่า `supportsStore: false`)
    - ฉีด `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - ค่าเริ่มต้น `compact_threshold`: 70% ของ `contextWindow` (หรือ `80000` เมื่อไม่พร้อมใช้งาน)

    สิ่งนี้ใช้กับเส้นทาง Pi harness ในตัวและกับฮุกผู้ให้บริการ OpenAI ที่ใช้โดยการรันแบบฝังตัว ฮาร์เนสแอปเซิร์ฟเวอร์ Codex แบบเนทีฟจัดการบริบทของตัวเองผ่าน Codex และกำหนดค่าแยกต่างหากด้วย `agents.defaults.agentRuntime.id`

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
    `responsesServerCompaction` ควบคุมเฉพาะการฉีด `context_management` เท่านั้น โมเดล OpenAI Responses โดยตรงยังคงบังคับใช้ `store: true` เว้นแต่ compat จะตั้งค่า `supportsStore: false`
    </Note>

  </Accordion>

  <Accordion title="โหมด GPT แบบ strict-agentic">
    สำหรับการรันตระกูล GPT-5 บน `openai/*` OpenClaw สามารถใช้สัญญาการดำเนินการแบบฝังที่เข้มงวดขึ้นได้:

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
    - ไม่ถือว่าเทิร์นที่มีเพียงแผนเป็นความคืบหน้าที่สำเร็จอีกต่อไปเมื่อมีการกระทำของเครื่องมือพร้อมใช้งาน
    - ลองเทิร์นนั้นอีกครั้งด้วยการชี้นำให้ลงมือทำทันที
    - เปิดใช้ `update_plan` โดยอัตโนมัติสำหรับงานที่มีสาระสำคัญ
    - แสดงสถานะถูกบล็อกอย่างชัดเจนหากโมเดลยังคงวางแผนโดยไม่ลงมือทำ

    <Note>
    จำกัดเฉพาะการรันตระกูล OpenAI และ Codex GPT-5 เท่านั้น ผู้ให้บริการอื่นและตระกูลโมเดลเก่ากว่ายังคงใช้พฤติกรรมเริ่มต้น
    </Note>

  </Accordion>

  <Accordion title="เส้นทางเนทีฟเทียบกับเส้นทางที่เข้ากันได้กับ OpenAI">
    OpenClaw จัดการเอนด์พอยต์ OpenAI โดยตรง, Codex และ Azure OpenAI แตกต่างจากพร็อกซี `/v1` ทั่วไปที่เข้ากันได้กับ OpenAI:

    **เส้นทางเนทีฟ** (`openai/*`, Azure OpenAI):
    - คง `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับ effort `none` ของ OpenAI
    - ละ reasoning ที่ปิดใช้งานสำหรับโมเดลหรือพร็อกซีที่ปฏิเสธ `reasoning.effort: "none"`
    - ตั้งค่าเริ่มต้นของสคีมาเครื่องมือเป็นโหมดเข้มงวด
    - แนบส่วนหัวการระบุแหล่งที่มาแบบซ่อนเฉพาะบนโฮสต์เนทีฟที่ยืนยันแล้วเท่านั้น
    - คงการจัดรูปคำขอเฉพาะ OpenAI (`service_tier`, `store`, compat ของ reasoning, คำใบ้ prompt-cache)

    **เส้นทางพร็อกซี/ที่เข้ากันได้:**
    - ใช้พฤติกรรม compat ที่ผ่อนปรนกว่า
    - ตัด Completions `store` ออกจากเพย์โหลด `openai-completions` ที่ไม่ใช่เนทีฟ
    - ยอมรับ JSON ส่งผ่านขั้นสูง `params.extra_body`/`params.extraBody` สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI
    - ยอมรับ `params.chat_template_kwargs` สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI เช่น vLLM
    - ไม่บังคับใช้สคีมาเครื่องมือแบบเข้มงวดหรือส่วนหัวเฉพาะเนทีฟ

    Azure OpenAI ใช้การส่งข้อมูลแบบเนทีฟและพฤติกรรม compat แต่จะไม่ได้รับส่วนหัวการระบุแหล่งที่มาแบบซ่อน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมเฟลโอเวอร์
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="OAuth และการรับรองความถูกต้อง" href="/th/gateway/authentication" icon="key">
    รายละเอียดการรับรองความถูกต้องและกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
