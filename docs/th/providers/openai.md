---
read_when:
    - คุณต้องการใช้โมเดล OpenAI ใน OpenClaw
    - คุณต้องการใช้การยืนยันตัวตนด้วยการสมัครใช้งาน Codex แทน API keys
    - คุณต้องการพฤติกรรมการทำงานของเอเจนต์ GPT-5 ที่เข้มงวดมากขึ้น
summary: ใช้ OpenAI ผ่าน API keys หรือการสมัครใช้งาน Codex ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-26T11:40:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4c3e734217ca82e1a5965c41686341a8bd87b4d2194c6d9e286e1087fa53320
    source_path: providers/openai.md
    workflow: 15
---

  OpenAI มี developer APIs สำหรับโมเดล GPT และ Codex ก็พร้อมใช้งานเช่นกันในฐานะ coding agent ของแผน ChatGPT ผ่านไคลเอนต์ Codex ของ OpenAI OpenClaw แยกพื้นผิวเหล่านั้นออกจากกันเพื่อให้ config มีความคาดเดาได้

  OpenClaw รองรับเส้นทางตระกูล OpenAI สามแบบ prefix ของโมเดลใช้เลือก
  เส้นทาง provider/auth; ส่วนการตั้งค่ารันไทม์แยกต่างหากใช้เลือกว่าผู้ใดจะเป็นผู้รัน
  embedded agent loop:

  - **API key** — เข้าถึง OpenAI Platform โดยตรงพร้อมการคิดค่าบริการตามการใช้งาน (`openai/*` models)
  - **การสมัครใช้งาน Codex ผ่าน PI** — ลงชื่อเข้าใช้ ChatGPT/Codex พร้อมสิทธิ์จากการสมัครใช้งาน (`openai-codex/*` models)
  - **Codex app-server harness** — การรัน native Codex app-server (`openai/*` models พร้อม `agents.defaults.agentRuntime.id: "codex"`)

  OpenAI รองรับการใช้งาน subscription OAuth ในเครื่องมือและเวิร์กโฟลว์ภายนอกอย่าง OpenClaw อย่างชัดเจน

  Provider, model, runtime และ channel เป็นคนละชั้นกัน หากป้ายกำกับเหล่านี้
  เริ่มปะปนกัน ให้อ่าน [Agent runtimes](/th/concepts/agent-runtimes) ก่อน
  เปลี่ยน config

  ## ตัวเลือกอย่างรวดเร็ว

  | เป้าหมาย | ใช้ | หมายเหตุ |
  | --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
  | การคิดค่าบริการแบบ API-key โดยตรง | `openai/gpt-5.5` | ตั้งค่า `OPENAI_API_KEY` หรือรัน onboarding สำหรับ OpenAI API-key |
  | GPT-5.5 พร้อมการยืนยันตัวตนด้วยการสมัครใช้งาน ChatGPT/Codex | `openai-codex/gpt-5.5` | เส้นทาง PI เริ่มต้นสำหรับ Codex OAuth เป็นตัวเลือกแรกที่ดีที่สุดสำหรับการตั้งค่าด้วยการสมัครใช้งาน |
  | GPT-5.5 พร้อมพฤติกรรม native Codex app-server | `openai/gpt-5.5` พร้อม `agentRuntime.id: "codex"` | บังคับใช้ Codex app-server harness สำหรับ model ref นั้น |
  | การสร้างหรือแก้ไขภาพ | `openai/gpt-image-2` | ใช้งานได้ทั้งกับ `OPENAI_API_KEY` หรือ OpenAI Codex OAuth |
  | ภาพพื้นหลังโปร่งใส | `openai/gpt-image-1.5` | ใช้ `outputFormat=png` หรือ `webp` และ `openai.background=transparent` |

  ## แผนที่ชื่อเรียก

  ชื่อมีความคล้ายกันแต่ใช้แทนกันไม่ได้:

  | ชื่อที่คุณเห็น | ชั้น | ความหมาย |
  | ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
  | `openai` | Provider prefix | เส้นทาง OpenAI Platform API โดยตรง |
  | `openai-codex` | Provider prefix | เส้นทาง OpenAI Codex OAuth/การสมัครใช้งานผ่าน OpenClaw PI runner ปกติ |
  | `codex` plugin | Plugin | Plugin แบบ bundled ของ OpenClaw ที่ให้ native Codex app-server runtime และตัวควบคุมแชต `/codex` |
  | `agentRuntime.id: codex` | Agent runtime | บังคับใช้ native Codex app-server harness สำหรับ embedded turns |
  | `/codex ...` | ชุดคำสั่งแชต | ผูก/ควบคุม threads ของ Codex app-server จากการสนทนา |
  | `runtime: "acp", agentId: "codex"` | ACP session route | เส้นทาง fallback แบบ explicit ที่รัน Codex ผ่าน ACP/acpx |

  ซึ่งหมายความว่า config สามารถมีทั้ง `openai-codex/*` และ
  `codex` plugin พร้อมกันโดยตั้งใจได้ นั่นถูกต้องเมื่อคุณต้องการ Codex OAuth ผ่าน PI และยังต้องการให้มี
  ตัวควบคุมแชต `/codex` แบบ native พร้อมใช้งานด้วย `openclaw doctor` จะเตือนเกี่ยวกับ
  การจับคู่นี้เพื่อให้คุณยืนยันว่าเป็นความตั้งใจ โดยจะไม่เขียนทับค่าให้

  <Note>
  GPT-5.5 ใช้งานได้ทั้งผ่านการเข้าถึง OpenAI Platform API-key โดยตรง และผ่าน
  เส้นทาง subscription/OAuth ใช้ `openai/gpt-5.5` สำหรับทราฟฟิก `OPENAI_API_KEY`
  โดยตรง, ใช้ `openai-codex/gpt-5.5` สำหรับ Codex OAuth ผ่าน PI หรือใช้
  `openai/gpt-5.5` พร้อม `agentRuntime.id: "codex"` สำหรับ native Codex
  app-server harness
  </Note>

  <Note>
  การเปิดใช้ OpenAI plugin หรือการเลือกโมเดล `openai-codex/*` จะไม่
  เปิดใช้งาน bundled Codex app-server plugin โดยอัตโนมัติ OpenClaw จะเปิดใช้ plugin นั้นก็ต่อเมื่อ
  คุณเลือก native Codex harness อย่างชัดเจนด้วย
  `agentRuntime.id: "codex"` หรือใช้ model ref แบบ legacy `codex/*`
  หาก bundled `codex` plugin ถูกเปิดใช้งาน แต่ `openai-codex/*` ยัง resolve
  ผ่าน PI, `openclaw doctor` จะเตือนและปล่อยให้เส้นทางเดิมไม่เปลี่ยน
  </Note>

  ## ความครอบคลุมของฟีเจอร์ OpenClaw

  | ความสามารถของ OpenAI | พื้นผิวใน OpenClaw | สถานะ |
  | ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses | provider ของโมเดล `openai/<model>` | ใช่ |
  | โมเดลการสมัครใช้งาน Codex | `openai-codex/<model>` พร้อม OAuth `openai-codex` | ใช่ |
  | Codex app-server harness | `openai/<model>` พร้อม `agentRuntime.id: codex` | ใช่ |
  | การค้นหาเว็บฝั่งเซิร์ฟเวอร์ | เครื่องมือ Native OpenAI Responses | ใช่ เมื่อเปิดใช้งาน web search และไม่ได้ปักหมุด provider |
  | รูปภาพ | `image_generate` | ใช่ |
  | วิดีโอ | `video_generate` | ใช่ |
  | Text-to-speech | `messages.tts.provider: "openai"` / `tts` | ใช่ |
  | Batch speech-to-text | `tools.media.audio` / media understanding | ใช่ |
  | Streaming speech-to-text | Voice Call `streaming.provider: "openai"` | ใช่ |
  | Realtime voice | Voice Call `realtime.provider: "openai"` / Control UI Talk | ใช่ |
  | Embeddings | provider สำหรับการฝังหน่วยความจำ | ใช่ |

  ## เริ่มต้นใช้งาน

  เลือกวิธียืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

  <Tabs>
  <Tab title="API key (OpenAI Platform)">
    **เหมาะสำหรับ:** การเข้าถึง API โดยตรงและการคิดค่าบริการตามการใช้งาน

    <Steps>
      <Step title="รับ API key ของคุณ">
        สร้างหรือคัดลอก API key จาก [OpenAI Platform dashboard](https://platform.openai.com/api-keys)
      </Step>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        หรือส่ง key โดยตรง:

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

    | Model ref | Runtime config | เส้นทาง | Auth |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5` | ละไว้ / `agentRuntime.id: "pi"` | OpenAI Platform API โดยตรง | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | ละไว้ / `agentRuntime.id: "pi"` | OpenAI Platform API โดยตรง | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Codex app-server harness | Codex app-server |

    <Note>
    `openai/*` เป็นเส้นทาง OpenAI API-key โดยตรง เว้นแต่คุณจะบังคับใช้
    Codex app-server harness อย่างชัดเจน ใช้ `openai-codex/*` สำหรับ Codex OAuth ผ่าน
    PI runner เริ่มต้น หรือใช้ `openai/gpt-5.5` พร้อม
    `agentRuntime.id: "codex"` สำหรับการรัน native Codex app-server
    </Note>

    ### ตัวอย่าง config

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **ไม่** เปิดให้ใช้ `openai/gpt-5.3-codex-spark` คำขอ OpenAI API แบบ live จะปฏิเสธโมเดลนี้ และแคตตาล็อก Codex ปัจจุบันก็ไม่ได้เปิดให้ใช้เช่นกัน
    </Warning>

  </Tab>

  <Tab title="การสมัครใช้งาน Codex">
    **เหมาะสำหรับ:** การใช้การสมัครใช้งาน ChatGPT/Codex ของคุณแทน API key แยกต่างหาก Codex cloud ต้องใช้การลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="รัน Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        หรือรัน OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        สำหรับการตั้งค่าแบบ headless หรือแบบที่ไม่เอื้อต่อ callback ให้เพิ่ม `--device-code` เพื่อเข้าสู่ระบบด้วย ChatGPT device-code flow แทน localhost browser callback:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | Model ref | Runtime config | Route | Auth |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | ละไว้ / `runtime: "pi"` | ChatGPT/Codex OAuth ผ่าน PI | การลงชื่อเข้าใช้ Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | ยังคงเป็น PI เว้นแต่จะมี plugin ที่ claim `openai-codex` อย่างชัดเจน | การลงชื่อเข้าใช้ Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Codex app-server harness | Codex app-server auth |

    <Note>
    ให้ใช้ provider id `openai-codex` ต่อไปสำหรับคำสั่ง auth/profile
    prefix ของโมเดล `openai-codex/*` ก็เป็นเส้นทาง PI แบบ explicit สำหรับ Codex OAuth เช่นกัน
    มันไม่ได้เลือกหรือเปิดใช้งาน bundled Codex app-server harness โดยอัตโนมัติ
    </Note>

    ### ตัวอย่าง config

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    ตอนนี้ onboarding จะไม่ import ข้อมูล OAuth จาก `~/.codex` อีกต่อไป ให้ลงชื่อเข้าใช้ด้วย browser OAuth (ค่าเริ่มต้น) หรือ device-code flow ด้านบน — OpenClaw จะจัดการ credentials ที่ได้ไว้ใน agent auth store ของตนเอง
    </Note>

    ### ตัวบ่งชี้สถานะ

    แชต `/status` จะแสดงว่า model runtime ใดกำลังทำงานอยู่สำหรับเซสชันปัจจุบัน
    PI harness เริ่มต้นจะแสดงเป็น `Runtime: OpenClaw Pi Default` เมื่อเลือก
    bundled Codex app-server harness แล้ว `/status` จะแสดง
    `Runtime: OpenAI Codex` เซสชันที่มีอยู่จะยังคงใช้ harness id ที่บันทึกไว้ ดังนั้นให้ใช้
    `/new` หรือ `/reset` หลังจากเปลี่ยน `agentRuntime` หากคุณต้องการให้ `/status`
    สะท้อนตัวเลือก PI/Codex ใหม่

    ### คำเตือนจาก doctor

    หาก bundled `codex` plugin ถูกเปิดใช้งานในขณะที่เลือก
    เส้นทาง `openai-codex/*` ของแท็บนี้ `openclaw doctor` จะเตือนว่าโมเดล
    ยังคง resolve ผ่าน PI ให้คง config เดิมไว้เมื่อเส้นทางยืนยันตัวตนด้วยการสมัครใช้งานนี้เป็น
    สิ่งที่ตั้งใจไว้ เปลี่ยนไปใช้ `openai/<model>` พร้อม
    `agentRuntime.id: "codex"` เฉพาะเมื่อคุณต้องการการรัน native Codex
    app-server

    ### เพดาน context window

    OpenClaw มอง metadata ของโมเดลและเพดาน context ของ runtime เป็นคนละค่า

    สำหรับ `openai-codex/gpt-5.5` ผ่าน Codex OAuth:

    - `contextWindow` แบบ native: `1000000`
    - เพดาน `contextTokens` ของ runtime ค่าเริ่มต้น: `272000`

    เพดานค่าเริ่มต้นที่เล็กกว่านี้ให้คุณลักษณะด้าน latency และคุณภาพที่ดีกว่าในทางปฏิบัติ คุณสามารถ override ได้ด้วย `contextTokens`:

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
    ใช้ `contextWindow` เพื่อประกาศ metadata แบบ native ของโมเดล ใช้ `contextTokens` เพื่อจำกัดงบประมาณ context ของ runtime
    </Note>

    ### การกู้คืนแคตตาล็อก

    OpenClaw ใช้ metadata ของแคตตาล็อก Codex ต้นทางสำหรับ `gpt-5.5` เมื่อมี
    หากการค้นหา Codex แบบ live ละเว้นแถว `openai-codex/gpt-5.5` ทั้งที่
    บัญชีผ่านการยืนยันตัวตนแล้ว OpenClaw จะสังเคราะห์แถวโมเดล OAuth นั้นขึ้นมา
    เพื่อไม่ให้การรันของ Cron, sub-agent และ default-model ที่กำหนดค่าไว้ล้มเหลวด้วย
    `Unknown model`

  </Tab>
</Tabs>

## การสร้างภาพ

bundled `openai` plugin จะลงทะเบียนการสร้างภาพผ่านเครื่องมือ `image_generate`
โดยรองรับทั้งการสร้างภาพด้วย OpenAI API key และการสร้างภาพผ่าน Codex OAuth
ด้วย model ref เดียวกันคือ `openai/gpt-image-2`

| ความสามารถ | OpenAI API key | Codex OAuth |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref | `openai/gpt-image-2` | `openai/gpt-image-2` |
| Auth | `OPENAI_API_KEY` | การลงชื่อเข้าใช้ OpenAI Codex OAuth |
| Transport | OpenAI Images API | Codex Responses backend |
| จำนวนภาพสูงสุดต่อคำขอ | 4 | 4 |
| โหมดแก้ไข | เปิดใช้ได้ (อ้างอิงภาพได้สูงสุด 5 ภาพ) | เปิดใช้ได้ (อ้างอิงภาพได้สูงสุด 5 ภาพ) |
| การ override ขนาด | รองรับ รวมถึงขนาด 2K/4K | รองรับ รวมถึงขนาด 2K/4K |
| อัตราส่วนภาพ / ความละเอียด | ไม่ถูกส่งต่อไปยัง OpenAI Images API | จับคู่เป็นขนาดที่รองรับเมื่อปลอดภัย |

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
ดู [Image Generation](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

`gpt-image-2` เป็นค่าเริ่มต้นสำหรับทั้งการสร้างภาพจากข้อความของ OpenAI และการแก้ไขภาพ
ส่วน `gpt-image-1.5`, `gpt-image-1` และ `gpt-image-1-mini` ยังสามารถใช้งานได้เป็น
การ override โมเดลแบบ explicit ใช้ `openai/gpt-image-1.5` สำหรับเอาต์พุต
PNG/WebP พื้นหลังโปร่งใส; API ของ `gpt-image-2` ปัจจุบันปฏิเสธ
`background: "transparent"`

สำหรับคำขอภาพพื้นหลังโปร่งใส เอเจนต์ควรเรียก `image_generate` ด้วย
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` หรือ `"webp"` และ
`background: "transparent"`; ตัวเลือก provider แบบเก่า `openai.background` ยังคงยอมรับอยู่
OpenClaw ยังปกป้องเส้นทางสาธารณะของ OpenAI และ
OpenAI Codex OAuth โดยการเขียนคำขอโปร่งใสค่าเริ่มต้นของ `openai/gpt-image-2` ใหม่
ให้เป็น `gpt-image-1.5`; ส่วน Azure และ endpoint แบบ OpenAI-compatible ที่กำหนดเอง
จะยังคงใช้ชื่อ deployment/model ที่ตั้งค่าไว้

การตั้งค่าเดียวกันนี้เปิดให้ใช้สำหรับการรัน CLI แบบ headless ด้วย:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

ใช้ flags `--output-format` และ `--background` เดียวกันกับ
`openclaw infer image edit` เมื่อตั้งต้นจากไฟล์อินพุต
`--openai-background` ยังคงใช้ได้ในฐานะ alias เฉพาะของ OpenAI

สำหรับการติดตั้งแบบ Codex OAuth ให้คงใช้ ref `openai/gpt-image-2` เดิม เมื่อมี
การตั้งค่าโปรไฟล์ OAuth ของ `openai-codex` แล้ว OpenClaw จะ resolve access token
OAuth ที่จัดเก็บไว้นั้นและส่งคำขอภาพผ่าน Codex Responses backend โดยตรง
มันจะไม่ลองใช้ `OPENAI_API_KEY` ก่อน และจะไม่ fallback ไปใช้ API key แบบเงียบ ๆ สำหรับ
คำขอนั้น ให้กำหนด `models.providers.openai` แบบ explicit ด้วย API key,
base URL แบบกำหนดเอง หรือ Azure endpoint เมื่อคุณต้องการใช้เส้นทาง
OpenAI Images API โดยตรงแทน
หาก custom image endpoint นั้นอยู่บน LAN ที่เชื่อถือได้หรือที่อยู่ private ให้ตั้งค่า
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ด้วย; OpenClaw จะยังคง
บล็อก endpoint ภาพแบบ OpenAI-compatible ที่เป็น private/internal เว้นแต่จะมีการ opt-in นี้

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

bundled `openai` plugin จะลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ `video_generate`

| ความสามารถ | ค่า |
| ---------------- | --------------------------------------------------------------------------------- |
| โมเดลเริ่มต้น | `openai/sora-2` |
| โหมด | ข้อความเป็นวิดีโอ, ภาพเป็นวิดีโอ, แก้ไขวิดีโอเดี่ยว |
| อินพุตอ้างอิง | 1 ภาพ หรือ 1 วิดีโอ |
| การ override ขนาด | รองรับ |
| การ override อื่น ๆ | `aspectRatio`, `resolution`, `audio`, `watermark` จะถูกละเลยพร้อมคำเตือนจากเครื่องมือ |

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
ดู [Video Generation](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

## การเสริมพรอมป์ GPT-5

OpenClaw เพิ่มการเสริมพรอมป์ GPT-5 แบบใช้ร่วมกันสำหรับการรันตระกูล GPT-5 ข้าม providers โดยใช้ตาม model id ดังนั้น `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` และ GPT-5 refs ที่เข้ากันได้อื่น ๆ จะได้รับ overlay เดียวกัน ส่วนโมเดล GPT-4.x รุ่นเก่าจะไม่ได้รับ

native Codex harness แบบ bundled ใช้พฤติกรรม GPT-5 และ Heartbeat overlay เดียวกันผ่านคำสั่งสำหรับนักพัฒนาของ Codex app-server ดังนั้นเซสชัน `openai/gpt-5.x` ที่ถูกบังคับผ่าน `agentRuntime.id: "codex"` จะยังคงมีแนวทางการติดตามงานต่อและ Heartbeat เชิงรุกแบบเดียวกัน แม้ว่า Codex จะเป็นผู้ดูแลพรอมป์ส่วนที่เหลือของ harness

การเสริม GPT-5 จะเพิ่มสัญญาพฤติกรรมแบบมีแท็กสำหรับการคงอยู่ของ persona, ความปลอดภัยในการทำงาน, วินัยในการใช้เครื่องมือ, รูปแบบเอาต์พุต, การตรวจสอบความสมบูรณ์ และการยืนยันผล พฤติกรรมการตอบกลับเฉพาะ channel และพฤติกรรมข้อความเงียบยังคงอยู่ใน system prompt แบบใช้ร่วมกันของ OpenClaw และนโยบายการส่งออกขาออก แนวทาง GPT-5 จะเปิดใช้งานเสมอสำหรับโมเดลที่ตรงกัน ส่วนเลเยอร์สไตล์การโต้ตอบแบบเป็นมิตรจะแยกออกมาและกำหนดค่าได้

| ค่า | ผลลัพธ์ |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้เลเยอร์สไตล์การโต้ตอบแบบเป็นมิตร |
| `"on"` | alias สำหรับ `"friendly"` |
| `"off"` | ปิดเฉพาะเลเยอร์สไตล์แบบเป็นมิตร |

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
ค่าจะไม่สนตัวพิมพ์เล็กใหญ่ระหว่างรันไทม์ ดังนั้น `"Off"` และ `"off"` จะปิดเลเยอร์สไตล์แบบเป็นมิตรเหมือนกัน
</Tip>

<Note>
ระบบยังคงอ่าน `plugins.entries.openai.config.personality` แบบ legacy เป็น compatibility fallback เมื่อยังไม่ได้ตั้งค่า `agents.defaults.promptOverlays.gpt5.personality` แบบใช้ร่วมกัน
</Note>

## เสียงพูดและคำพูด

<AccordionGroup>
  <Accordion title="การสังเคราะห์เสียงพูด (TTS)">
    bundled `openai` plugin ลงทะเบียนการสังเคราะห์เสียงพูดสำหรับพื้นผิว `messages.tts`

    | การตั้งค่า | พาธ config | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | เสียง | `messages.tts.providers.openai.voice` | `coral` |
    | ความเร็ว | `messages.tts.providers.openai.speed` | (ไม่ได้ตั้งค่า) |
    | คำสั่ง | `messages.tts.providers.openai.instructions` | (ไม่ได้ตั้งค่า, `gpt-4o-mini-tts` เท่านั้น) |
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
    ตั้งค่า `OPENAI_TTS_BASE_URL` เพื่อ override TTS base URL โดยไม่กระทบ endpoint ของ chat API
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    bundled `openai` plugin ลงทะเบียน batch speech-to-text ผ่าน
    พื้นผิว transcription ของ media-understanding ใน OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - พาธอินพุต: อัปโหลดไฟล์เสียงแบบ multipart
    - OpenClaw รองรับทุกที่ที่การถอดเสียงขาเข้าของเสียงใช้
      `tools.media.audio` รวมถึงส่วนของช่องเสียง Discord และไฟล์แนบเสียงของ channel

    หากต้องการบังคับใช้ OpenAI สำหรับการถอดเสียงขาเข้าของเสียง:

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

    คำใบ้ด้านภาษาและพรอมป์จะถูกส่งต่อไปยัง OpenAI เมื่อมีการระบุจาก
    การตั้งค่า audio media แบบใช้ร่วมกันหรือคำขอ transcription รายครั้ง

  </Accordion>

  <Accordion title="Realtime transcription">
    bundled `openai` plugin ลงทะเบียน realtime transcription สำหรับ Voice Call plugin

    | การตั้งค่า | พาธ config | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | ภาษา | `...openai.language` | (ไม่ได้ตั้งค่า) |
    | พรอมป์ | `...openai.prompt` | (ไม่ได้ตั้งค่า) |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `800` |
    | ค่า VAD threshold | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียง G.711 u-law (`g711_ulaw` / `audio/pcmu`) provider แบบสตรีมนี้มีไว้สำหรับเส้นทาง realtime transcription ของ Voice Call; ปัจจุบัน Discord voice ยังคงบันทึกเป็นช่วงสั้น ๆ และใช้เส้นทาง batch transcription ของ `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    bundled `openai` plugin ลงทะเบียน realtime voice สำหรับ Voice Call plugin

    | การตั้งค่า | พาธ config | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | เสียง | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | ค่า VAD threshold | `...openai.vadThreshold` | `0.5` |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |

    <Note>
    รองรับ Azure OpenAI ผ่านคีย์ config `azureEndpoint` และ `azureDeployment` รองรับ bidirectional tool calling ใช้รูปแบบเสียง G.711 u-law
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI endpoints

bundled `openai` provider สามารถกำหนดเป้าหมายไปยังทรัพยากร Azure OpenAI สำหรับการสร้างภาพ
ได้โดยการ override base URL บนเส้นทาง image-generation OpenClaw
จะตรวจจับ Azure hostnames บน `models.providers.openai.baseUrl` และสลับไปใช้
รูปแบบคำขอของ Azure โดยอัตโนมัติ

<Note>
Realtime voice ใช้พาธการตั้งค่าแยกต่างหาก
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
และไม่ได้รับผลจาก `models.providers.openai.baseUrl` ดูส่วน **Realtime
voice** แบบ accordion ใต้ [Voice and speech](#voice-and-speech) สำหรับการตั้งค่า Azure
ของส่วนนี้
</Note>

ใช้ Azure OpenAI เมื่อ:

- คุณมีการสมัครใช้งาน Azure OpenAI, โควตา หรือข้อตกลงระดับองค์กรอยู่แล้ว
- คุณต้องการการคงอยู่ของข้อมูลในภูมิภาคหรือการควบคุมด้าน compliance ที่ Azure มีให้
- คุณต้องการให้ทราฟฟิกอยู่ภายใน Azure tenancy ที่มีอยู่เดิม

### การกำหนดค่า

สำหรับการสร้างภาพผ่าน Azure โดยใช้ bundled `openai` provider ให้ชี้
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

OpenClaw จดจำ suffix ของโฮสต์ Azure ต่อไปนี้สำหรับเส้นทาง Azure image-generation:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

สำหรับคำขอ image-generation บนโฮสต์ Azure ที่รู้จัก OpenClaw จะ:

- ส่ง header `api-key` แทน `Authorization: Bearer`
- ใช้พาธแบบผูกกับ deployment (`/openai/deployments/{deployment}/...`)
- เติม `?api-version=...` ต่อท้ายทุกคำขอ
- ใช้ค่า request timeout เริ่มต้น 600 วินาทีสำหรับการเรียก Azure image-generation
  โดยค่า `timeoutMs` รายคำขอยังคง override ค่าเริ่มต้นนี้ได้

ส่วน base URLs อื่น ๆ (OpenAI สาธารณะ, OpenAI-compatible proxies) จะยังคงใช้
รูปแบบคำขอภาพมาตรฐานของ OpenAI

<Note>
การกำหนดเส้นทาง Azure สำหรับเส้นทาง image-generation ของ `openai` provider ต้องใช้
OpenClaw 2026.4.22 หรือใหม่กว่า เวอร์ชันก่อนหน้านี้จะถือว่า
`openai.baseUrl` แบบกำหนดเองทั้งหมดเหมือนกับ endpoint สาธารณะของ OpenAI และจะล้มเหลวเมื่อใช้กับ Azure
image deployments
</Note>

### เวอร์ชัน API

ตั้งค่า `AZURE_OPENAI_API_VERSION` เพื่อปักหมุดเวอร์ชัน preview หรือ GA ของ Azure ที่เฉพาะเจาะจง
สำหรับเส้นทาง Azure image-generation:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

ค่าเริ่มต้นคือ `2024-12-01-preview` เมื่อไม่ได้ตั้งค่าตัวแปรนี้

### ชื่อโมเดลคือชื่อ deployment

Azure OpenAI จะผูกโมเดลเข้ากับ deployments สำหรับคำขอ Azure image-generation
ที่ถูกกำหนดเส้นทางผ่าน bundled `openai` provider ฟิลด์ `model` ใน OpenClaw
ต้องเป็น **ชื่อ Azure deployment** ที่คุณตั้งค่าไว้ใน Azure portal ไม่ใช่
model id สาธารณะของ OpenAI

หากคุณสร้าง deployment ชื่อ `gpt-image-2-prod` ที่ให้บริการ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

กฎเรื่องชื่อ deployment เดียวกันนี้ใช้กับการเรียก image-generation
ที่ถูกกำหนดเส้นทางผ่าน bundled `openai` provider ด้วย

### ความพร้อมใช้งานตามภูมิภาค

ขณะนี้ Azure image generation พร้อมใช้งานเฉพาะบางภูมิภาคเท่านั้น
(ตัวอย่างเช่น `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`) โปรดตรวจสอบรายการภูมิภาคล่าสุดของ Microsoft ก่อนสร้าง
deployment และยืนยันว่าโมเดลที่ต้องการมีให้ใช้ในภูมิภาคของคุณ

### ความแตกต่างของพารามิเตอร์

Azure OpenAI และ OpenAI สาธารณะอาจไม่ได้ยอมรับพารามิเตอร์ภาพชุดเดียวกันเสมอไป
Azure อาจปฏิเสธตัวเลือกที่ OpenAI สาธารณะยอมรับได้ (เช่นค่า
`background` บางค่าใน `gpt-image-2`) หรือเปิดให้ใช้เฉพาะในบางเวอร์ชันของโมเดล
ความแตกต่างเหล่านี้มาจาก Azure และโมเดลพื้นฐาน ไม่ใช่
OpenClaw หากคำขอ Azure ล้มเหลวพร้อม validation error ให้ตรวจสอบ
ชุดพารามิเตอร์ที่ deployment และ API version ของคุณรองรับใน
Azure portal

<Note>
Azure OpenAI ใช้ transport และพฤติกรรม compat แบบ native แต่จะไม่ได้รับ
hidden attribution headers ของ OpenClaw — ดู accordion **Native vs OpenAI-compatible
routes** ใต้ [Advanced configuration](#advanced-configuration)

สำหรับทราฟฟิก chat หรือ Responses บน Azure (นอกเหนือจาก image generation) ให้ใช้
onboarding flow หรือ config ของ Azure provider โดยเฉพาะ — `openai.baseUrl` เพียงอย่างเดียว
จะไม่ใช้รูปแบบ API/auth ของ Azure โดยอัตโนมัติ มี provider
`azure-openai-responses/*` แยกต่างหาก; ดู
accordion เรื่อง Server-side compaction ด้านล่าง
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw ใช้ WebSocket-first พร้อม SSE fallback (`"auto"`) สำหรับทั้ง `openai/*` และ `openai-codex/*`

    ในโหมด `"auto"` OpenClaw จะ:
    - ลองใหม่หนึ่งครั้งเมื่อเกิดความล้มเหลว WebSocket ช่วงต้น ก่อน fallback ไปใช้ SSE
    - หลังเกิดความล้มเหลว จะทำเครื่องหมายว่า WebSocket เสื่อมสภาพไว้ประมาณ 60 วินาที และใช้ SSE ระหว่างช่วง cool-down
    - แนบ stable session และ turn identity headers สำหรับการลองใหม่และการเชื่อมต่อใหม่
    - ทำ normalization ของตัวนับการใช้งาน (`input_tokens` / `prompt_tokens`) ข้าม transport แต่ละรูปแบบ

    | ค่า | พฤติกรรม |
    |-------|----------|
    | `"auto"` (ค่าเริ่มต้น) | WebSocket ก่อน, fallback ไป SSE |
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
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    เอกสาร OpenAI ที่เกี่ยวข้อง:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
    OpenClaw เปิดใช้ WebSocket warm-up โดยค่าเริ่มต้นสำหรับ `openai/*` และ `openai-codex/*` เพื่อลด latency ของเทิร์นแรก

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

  <Accordion title="Fast mode">
    OpenClaw แสดงสวิตช์ fast-mode แบบใช้ร่วมกันสำหรับ `openai/*` และ `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    เมื่อเปิดใช้ OpenClaw จะจับคู่ fast mode ไปยัง priority processing ของ OpenAI (`service_tier = "priority"`) ค่า `service_tier` ที่มีอยู่จะยังคงเดิม และ fast mode จะไม่เขียนทับ `reasoning` หรือ `text.verbosity`

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
    การ override ระดับเซสชันมีผลเหนือ config การล้าง session override ใน Sessions UI จะทำให้เซสชันกลับไปใช้ค่าเริ่มต้นตาม config
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    API ของ OpenAI แสดง priority processing ผ่าน `service_tier` ตั้งค่าแบบรายโมเดลใน OpenClaw ได้ดังนี้:

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
    `serviceTier` จะถูกส่งต่อเฉพาะไปยัง native OpenAI endpoints (`api.openai.com`) และ native Codex endpoints (`chatgpt.com/backend-api`) เท่านั้น หากคุณกำหนดเส้นทาง provider ใด provider หนึ่งผ่าน proxy, OpenClaw จะปล่อย `service_tier` ไว้โดยไม่แตะต้อง
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    สำหรับโมเดล OpenAI Responses โดยตรง (`openai/*` บน `api.openai.com`) stream wrapper ของ Pi-harness ใน OpenAI plugin จะเปิดใช้ server-side Compaction โดยอัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ model compat จะตั้งค่า `supportsStore: false`)
    - แทรก `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - ค่าเริ่มต้น `compact_threshold`: 70% ของ `contextWindow` (หรือ `80000` เมื่อไม่มีค่า)

    สิ่งนี้ใช้กับเส้นทาง built-in Pi harness และกับ OpenAI provider hooks ที่ใช้โดย embedded runs native Codex app-server harness จะจัดการ context ของตัวเองผ่าน Codex และกำหนดค่าแยกต่างหากด้วย `agents.defaults.agentRuntime.id`

    <Tabs>
      <Tab title="Enable explicitly">
        มีประโยชน์สำหรับ endpoints ที่เข้ากันได้ เช่น Azure OpenAI Responses:

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
    `responsesServerCompaction` ควบคุมเฉพาะการแทรก `context_management` เท่านั้น โมเดล OpenAI Responses โดยตรงจะยังคงบังคับ `store: true` เว้นแต่ compat จะตั้งค่า `supportsStore: false`
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT mode">
    สำหรับการรันตระกูล GPT-5 บน `openai/*` OpenClaw สามารถใช้สัญญาการทำงานแบบ embedded ที่เข้มงวดขึ้นได้:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    เมื่อใช้ `strict-agentic`, OpenClaw จะ:
    - ไม่ถือว่าเทิร์นที่มีเพียงแผนเป็นความคืบหน้าที่สำเร็จอีกต่อไปเมื่อมีการกระทำผ่านเครื่องมือที่พร้อมใช้
    - ลองเทิร์นใหม่พร้อมการชี้นำให้ลงมือทำทันที
    - เปิดใช้ `update_plan` โดยอัตโนมัติสำหรับงานที่มีสาระสำคัญ
    - แสดงสถานะติดขัดอย่างชัดเจนหากโมเดลยังคงวางแผนโดยไม่ลงมือทำ

    <Note>
    มีผลเฉพาะกับการรันตระกูล GPT-5 ของ OpenAI และ Codex เท่านั้น providers อื่นและโมเดลตระกูลเก่าจะยังคงใช้พฤติกรรมเริ่มต้น
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw ปฏิบัติต่อ direct OpenAI, Codex และ Azure OpenAI endpoints แตกต่างจาก `/v1` proxies แบบ OpenAI-compatible ทั่วไป:

    **เส้นทาง native** (`openai/*`, Azure OpenAI):
    - คง `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับค่า OpenAI `none` effort
    - ละ reasoning ที่ปิดใช้งานสำหรับโมเดลหรือ proxies ที่ปฏิเสธ `reasoning.effort: "none"`
    - ใช้ strict mode เป็นค่าเริ่มต้นสำหรับ tool schemas
    - แนบ hidden attribution headers เฉพาะบนโฮสต์ native ที่ตรวจสอบแล้วเท่านั้น
    - คงรูปแบบคำขอเฉพาะของ OpenAI (`service_tier`, `store`, reasoning-compat, prompt-cache hints)

    **เส้นทาง proxy/compatible:**
    - ใช้พฤติกรรม compat ที่ยืดหยุ่นกว่า
    - ตัด `store` ของ Completions ออกจาก payloads ของ `openai-completions` ที่ไม่ใช่ native
    - ยอมรับ JSON แบบ pass-through สำหรับ `params.extra_body`/`params.extraBody` ขั้นสูงสำหรับ OpenAI-compatible Completions proxies
    - ยอมรับ `params.chat_template_kwargs` สำหรับ OpenAI-compatible Completions proxies เช่น vLLM
    - ไม่บังคับ strict tool schemas หรือ headers ที่ใช้ได้เฉพาะ native

    Azure OpenAI ใช้ transport และพฤติกรรม compat แบบ native แต่จะไม่ได้รับ hidden attribution headers

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือภาพที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="OAuth และ auth" href="/th/gateway/authentication" icon="key">
    รายละเอียด auth และกฎการนำ credentials กลับมาใช้ซ้ำ
  </Card>
</CardGroup>
