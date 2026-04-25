---
read_when:
    - คุณต้องการใช้โมเดล OpenAI ใน OpenClaw
    - คุณต้องการใช้การยืนยันตัวตนด้วยการสมัครใช้งาน Codex แทนคีย์ API
    - คุณต้องการพฤติกรรมการทำงานของเอเจนต์ GPT-5 ที่เข้มงวดมากขึ้น
summary: ใช้ OpenAI ผ่านคีย์ API หรือการสมัครใช้งาน Codex ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T13:57:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 576a453f42fff8d90837ebee3894443c37f177c611c134113944fbf0d11c2455
    source_path: providers/openai.md
    workflow: 15
---

OpenAI ให้บริการ API สำหรับนักพัฒนาสำหรับโมเดล GPT โดย OpenClaw รองรับเส้นทางในตระกูล OpenAI อยู่ 3 แบบ ซึ่ง prefix ของโมเดลจะเป็นตัวเลือกเส้นทาง:

- **API key** — เข้าถึง OpenAI Platform โดยตรงพร้อมการคิดค่าบริการตามการใช้งาน (`openai/*` models)
- **การสมัครใช้งาน Codex ผ่าน PI** — ลงชื่อเข้าใช้ ChatGPT/Codex พร้อมสิทธิ์การเข้าถึงจากการสมัครใช้งาน (`openai-codex/*` models)
- **Codex app-server harness** — การทำงานผ่าน Codex app-server แบบเนทีฟ (`openai/*` models ร่วมกับ `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI รองรับการใช้งาน OAuth แบบสมัครใช้งานในเครื่องมือภายนอกและเวิร์กโฟลว์อย่าง OpenClaw อย่างชัดเจน

Provider, model, runtime และ channel เป็นคนละชั้นกัน หากป้ายกำกับเหล่านี้
เริ่มปะปนกัน ให้อ่าน [Agent runtimes](/th/concepts/agent-runtimes) ก่อน
เปลี่ยน config

## ตัวเลือกแบบรวดเร็ว

| เป้าหมาย                                      | ใช้                                                      | หมายเหตุ                                                                      |
| --------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| คิดค่าบริการโดยตรงผ่าน API key                | `openai/gpt-5.4`                                         | ตั้งค่า `OPENAI_API_KEY` หรือรัน onboarding สำหรับ OpenAI API key             |
| GPT-5.5 พร้อมการยืนยันตัวตนด้วยการสมัคร ChatGPT/Codex | `openai-codex/gpt-5.5`                             | เส้นทาง PI เริ่มต้นสำหรับ Codex OAuth เป็นตัวเลือกแรกที่ดีที่สุดสำหรับการตั้งค่าที่ใช้การสมัครใช้งาน |
| GPT-5.5 พร้อมพฤติกรรม Codex app-server แบบเนทีฟ | `openai/gpt-5.5` พร้อม `embeddedHarness.runtime: "codex"` | ใช้ Codex app-server harness ไม่ใช่เส้นทาง OpenAI API สาธารณะ              |
| การสร้างหรือแก้ไขภาพ                          | `openai/gpt-image-2`                                     | ใช้งานได้ทั้งกับ `OPENAI_API_KEY` หรือ OpenAI Codex OAuth                    |

<Note>
ขณะนี้ GPT-5.5 พร้อมใช้งานใน OpenClaw ผ่านเส้นทางแบบสมัครใช้งาน/OAuth:
`openai-codex/gpt-5.5` กับ PI runner หรือ `openai/gpt-5.5` กับ
Codex app-server harness การเข้าถึง `openai/gpt-5.5` โดยตรงผ่าน API key
จะรองรับเมื่อ OpenAI เปิดใช้ GPT-5.5 บน public API; จนกว่าจะถึงตอนนั้นให้ใช้
โมเดลที่เปิดใช้ API แล้ว เช่น `openai/gpt-5.4` สำหรับการตั้งค่า `OPENAI_API_KEY`
</Note>

<Note>
การเปิดใช้งาน OpenAI plugin หรือการเลือกโมเดล `openai-codex/*` ไม่ได้
เปิดใช้งาน Codex app-server plugin ที่มีมาในตัว OpenClaw จะเปิดใช้งาน plugin นั้นก็ต่อเมื่อ
คุณเลือก native Codex harness อย่างชัดเจนด้วย
`embeddedHarness.runtime: "codex"` หรือใช้ model ref แบบเดิม `codex/*`
</Note>

## ขอบเขตความสามารถของ OpenClaw

| ความสามารถของ OpenAI      | พื้นที่ใช้งานใน OpenClaw                                  | สถานะ                                                   |
| ------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| Chat / Responses          | provider โมเดล `openai/<model>`                            | ใช่                                                      |
| โมเดลจากการสมัครใช้งาน Codex | `openai-codex/<model>` พร้อม OAuth `openai-codex`        | ใช่                                                      |
| Codex app-server harness  | `openai/<model>` พร้อม `embeddedHarness.runtime: codex`    | ใช่                                                      |
| การค้นหาเว็บฝั่งเซิร์ฟเวอร์ | เครื่องมือ OpenAI Responses แบบเนทีฟ                      | ใช่ เมื่อเปิดใช้ web search และไม่ได้ pin provider ไว้   |
| ภาพ                      | `image_generate`                                           | ใช่                                                      |
| วิดีโอ                    | `video_generate`                                           | ใช่                                                      |
| การแปลงข้อความเป็นเสียง   | `messages.tts.provider: "openai"` / `tts`                  | ใช่                                                      |
| การแปลงเสียงเป็นข้อความแบบแบตช์ | `tools.media.audio` / การทำความเข้าใจสื่อ            | ใช่                                                      |
| การแปลงเสียงเป็นข้อความแบบสตรีมมิง | Voice Call `streaming.provider: "openai"`          | ใช่                                                      |
| เสียงแบบเรียลไทม์         | Voice Call `realtime.provider: "openai"` / Control UI Talk | ใช่                                                      |
| Embeddings                | memory embedding provider                                  | ใช่                                                      |

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่ต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **เหมาะสำหรับ:** การเข้าถึง API โดยตรงและการคิดค่าบริการตามการใช้งาน

    <Steps>
      <Step title="รับ API key ของคุณ">
        สร้างหรือคัดลอก API key จาก [แดชบอร์ด OpenAI Platform](https://platform.openai.com/api-keys)
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

    | Model ref | เส้นทาง | การยืนยันตัวตน |
    |-----------|---------|----------------|
    | `openai/gpt-5.4` | OpenAI Platform API โดยตรง | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | OpenAI Platform API โดยตรง | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | เส้นทาง API โดยตรงในอนาคต เมื่อ OpenAI เปิดใช้ GPT-5.5 บน API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` คือเส้นทาง OpenAI API แบบ API key โดยตรง เว้นแต่คุณจะบังคับ
    ให้ใช้ Codex app-server harness อย่างชัดเจน GPT-5.5 เองในขณะนี้รองรับเฉพาะแบบสมัครใช้งาน/OAuth
    เท่านั้น; ใช้ `openai-codex/*` สำหรับ Codex OAuth ผ่าน PI runner เริ่มต้น หรือ
    ใช้ `openai/gpt-5.5` พร้อม `embeddedHarness.runtime: "codex"` สำหรับการทำงานผ่าน
    Codex app-server แบบเนทีฟ
    </Note>

    ### ตัวอย่าง config

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **ไม่** เปิดให้ใช้ `openai/gpt-5.3-codex-spark` คำขอ OpenAI API แบบใช้งานจริงจะปฏิเสธโมเดลนี้ และ catalog ของ Codex ปัจจุบันก็ไม่ได้เปิดให้ใช้เช่นกัน
    </Warning>

  </Tab>

  <Tab title="การสมัครใช้งาน Codex">
    **เหมาะสำหรับ:** ใช้การสมัครใช้งาน ChatGPT/Codex ของคุณแทน API key แยกต่างหาก โดย Codex cloud ต้องใช้การลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="รัน Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        หรือรัน OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        สำหรับการตั้งค่าแบบ headless หรือสภาพแวดล้อมที่ไม่เหมาะกับ callback ให้เพิ่ม `--device-code` เพื่อใช้การลงชื่อเข้าใช้ ChatGPT แบบ device-code flow แทน localhost browser callback:

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

    | Model ref | เส้นทาง | การยืนยันตัวตน |
    |-----------|---------|----------------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth ผ่าน PI | การลงชื่อเข้าใช้ Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | การยืนยันตัวตนของ Codex app-server |

    <Note>
    ให้ใช้ provider id `openai-codex` ต่อไปสำหรับคำสั่ง auth/profile
    โดย prefix โมเดล `openai-codex/*` ก็เป็นเส้นทาง PI แบบชัดเจนสำหรับ Codex OAuth เช่นกัน
    มันไม่ได้เลือกหรือเปิดใช้งาน bundled Codex app-server harness โดยอัตโนมัติ
    </Note>

    ### ตัวอย่าง config

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding จะไม่ import ข้อมูล OAuth จาก `~/.codex` อีกต่อไป ให้ลงชื่อเข้าใช้ด้วย browser OAuth (ค่าเริ่มต้น) หรือ device-code flow ข้างต้น — OpenClaw จะจัดการ credentials ที่ได้ไว้ในที่เก็บ agent auth ของตัวเอง
    </Note>

    ### ตัวบ่งชี้สถานะ

    Chat `/status` จะแสดงว่า model runtime ใดกำลังทำงานอยู่สำหรับเซสชันปัจจุบัน
    โดย PI harness เริ่มต้นจะแสดงเป็น `Runtime: OpenClaw Pi Default` เมื่อ
    เลือก bundled Codex app-server harness แล้ว `/status` จะแสดง
    `Runtime: OpenAI Codex` เซสชันที่มีอยู่จะคง harness id ที่บันทึกไว้ ดังนั้นให้ใช้
    `/new` หรือ `/reset` หลังจากเปลี่ยน `embeddedHarness` หากคุณต้องการให้ `/status` สะท้อน
    ตัวเลือก PI/Codex ใหม่

    ### เพดาน context window

    OpenClaw มอง metadata ของโมเดลและเพดาน context ของ runtime เป็นคนละค่า

    สำหรับ `openai-codex/gpt-5.5` ผ่าน Codex OAuth:

    - `contextWindow` แบบเนทีฟ: `1000000`
    - เพดาน `contextTokens` ของ runtime เริ่มต้น: `272000`

    เพดานเริ่มต้นที่เล็กกว่านี้ให้คุณลักษณะด้านความหน่วงและคุณภาพที่ดีกว่าในการใช้งานจริง โดยคุณสามารถ override ได้ด้วย `contextTokens`:

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
    ใช้ `contextWindow` เพื่อประกาศ metadata ดั้งเดิมของโมเดล และใช้ `contextTokens` เพื่อจำกัดงบประมาณ context ของ runtime
    </Note>

    ### การกู้คืน Catalog

    OpenClaw ใช้ metadata ของ catalog จาก Codex ต้นทางสำหรับ `gpt-5.5` เมื่อ
    มีข้อมูลนั้นอยู่ หากการค้นหา Codex แบบใช้งานจริงไม่มีแถว `openai-codex/gpt-5.5` ทั้งที่
    บัญชีได้รับการยืนยันตัวตนแล้ว OpenClaw จะสังเคราะห์แถวโมเดล OAuth นั้นขึ้นมาเพื่อให้
    Cron, sub-agent และการรันด้วยโมเดลเริ่มต้นตาม config ไม่ล้มเหลวด้วยข้อผิดพลาด
    `Unknown model`

  </Tab>
</Tabs>

## การสร้างภาพ

Plugin `openai` ที่มีมาในตัวจะลงทะเบียนการสร้างภาพผ่านเครื่องมือ `image_generate`
โดยรองรับทั้งการสร้างภาพด้วย OpenAI API key และการสร้างภาพด้วย Codex OAuth
ผ่าน model ref เดียวกันคือ `openai/gpt-image-2`

| ความสามารถ                | OpenAI API key                     | Codex OAuth                         |
| ------------------------- | ---------------------------------- | ----------------------------------- |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                |
| การยืนยันตัวตน            | `OPENAI_API_KEY`                   | การลงชื่อเข้าใช้ OpenAI Codex OAuth |
| การขนส่งข้อมูล            | OpenAI Images API                  | Codex Responses backend             |
| จำนวนภาพสูงสุดต่อคำขอ    | 4                                  | 4                                   |
| โหมดแก้ไข                 | เปิดใช้งาน (ภาพอ้างอิงได้สูงสุด 5 ภาพ) | เปิดใช้งาน (ภาพอ้างอิงได้สูงสุด 5 ภาพ) |
| การ override ขนาด         | รองรับ รวมถึงขนาด 2K/4K            | รองรับ รวมถึงขนาด 2K/4K             |
| อัตราส่วนภาพ / ความละเอียด | ไม่ส่งต่อไปยัง OpenAI Images API | แมปไปยังขนาดที่รองรับเมื่อปลอดภัย   |

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

`gpt-image-2` เป็นค่าเริ่มต้นสำหรับทั้งการสร้างภาพจากข้อความของ OpenAI และการแก้ไขภาพ
โดย `gpt-image-1` ยังใช้งานได้ในฐานะการ override โมเดลแบบระบุชัดเจน แต่
เวิร์กโฟลว์ภาพใหม่ของ OpenAI ควรใช้ `openai/gpt-image-2`

สำหรับการติดตั้งแบบ Codex OAuth ให้คงการอ้างอิง `openai/gpt-image-2` เดิมไว้ เมื่อมีการตั้งค่า
โปรไฟล์ OAuth `openai-codex` แล้ว OpenClaw จะ resolve OAuth access token ที่จัดเก็บไว้นั้น
และส่งคำขอภาพผ่าน Codex Responses backend โดยจะไม่ลองใช้ `OPENAI_API_KEY` ก่อน
หรือ fallback ไปใช้ API key สำหรับคำขอนั้นแบบเงียบ ๆ หากต้องการใช้เส้นทาง OpenAI Images API โดยตรง
ให้กำหนด `models.providers.openai` อย่างชัดเจนด้วย API key,
custom base URL หรือ Azure endpoint แทน
หาก image endpoint แบบกำหนดเองนั้นอยู่บน LAN ที่เชื่อถือได้หรือเป็น private address ให้ตั้งค่า
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เพิ่มเติมด้วย; OpenClaw จะยังคงบล็อก
OpenAI-compatible image endpoint แบบ private/internal ไว้ เว้นแต่จะมีการ opt-in นี้

สร้าง:

```
/tool image_generate model=openai/gpt-image-2 prompt="โปสเตอร์เปิดตัว OpenClaw บน macOS ที่ดูประณีต" size=3840x2160 count=1
```

แก้ไข:

```
/tool image_generate model=openai/gpt-image-2 prompt="คงรูปทรงของวัตถุไว้ เปลี่ยนวัสดุเป็นแก้วโปร่งแสง" image=/path/to/reference.png size=1024x1536
```

## การสร้างวิดีโอ

Plugin `openai` ที่มีมาในตัวจะลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ `video_generate`

| ความสามารถ       | ค่า                                                                                |
| ---------------- | ---------------------------------------------------------------------------------- |
| โมเดลเริ่มต้น    | `openai/sora-2`                                                                    |
| โหมด             | ข้อความเป็นวิดีโอ, ภาพเป็นวิดีโอ, แก้ไขวิดีโอเดี่ยว                              |
| อินพุตอ้างอิง    | 1 ภาพ หรือ 1 วิดีโอ                                                                |
| การ override ขนาด | รองรับ                                                                            |
| การ override อื่น ๆ | `aspectRatio`, `resolution`, `audio`, `watermark` จะถูกละเว้นพร้อมคำเตือนจากเครื่องมือ |

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

## การเพิ่ม prompt สำหรับ GPT-5

OpenClaw เพิ่ม prompt contribution แบบใช้ร่วมกันสำหรับการรันตระกูล GPT-5 ข้าม provider โดยจะใช้ตาม model id ดังนั้น `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` และ ref GPT-5 อื่น ๆ ที่เข้ากันได้จะได้รับ overlay เดียวกัน ส่วนโมเดล GPT-4.x รุ่นเก่าจะไม่ได้รับ

native Codex harness ที่มีมาในตัวใช้พฤติกรรม GPT-5 และ Heartbeat overlay เดียวกันผ่าน developer instructions ของ Codex app-server ดังนั้นเซสชัน `openai/gpt-5.x` ที่บังคับผ่าน `embeddedHarness.runtime: "codex"` จะยังคงมีแนวทางการติดตามงานต่อและ Heartbeat เชิงรุกแบบเดียวกัน แม้ว่า Codex จะเป็นผู้ควบคุม prompt ส่วนที่เหลือของ harness ก็ตาม

GPT-5 contribution จะเพิ่มสัญญาพฤติกรรมแบบติดแท็กสำหรับการคงบุคลิก การทำงานอย่างปลอดภัย วินัยในการใช้เครื่องมือ รูปแบบเอาต์พุต การตรวจสอบความสมบูรณ์ และการยืนยันผล ส่วนพฤติกรรมการตอบกลับเฉพาะ channel และพฤติกรรมข้อความเงียบยังคงอยู่ใน system prompt แบบใช้ร่วมกันของ OpenClaw และนโยบายการส่งออกขาออก โดยคำแนะนำสำหรับ GPT-5 จะเปิดใช้งานเสมอสำหรับโมเดลที่ตรงกัน ส่วนเลเยอร์รูปแบบการโต้ตอบแบบเป็นมิตรนั้นแยกออกมาและกำหนดค่าได้

| ค่า                    | ผลลัพธ์                                      |
| ---------------------- | -------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้งานเลเยอร์รูปแบบการโต้ตอบแบบเป็นมิตร |
| `"on"`                 | alias ของ `"friendly"`                       |
| `"off"`                | ปิดเฉพาะเลเยอร์สไตล์แบบเป็นมิตร             |

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
ค่าต่าง ๆ ไม่สนตัวพิมพ์เล็กใหญ่ใน runtime ดังนั้นทั้ง `"Off"` และ `"off"` จะปิดเลเยอร์สไตล์แบบเป็นมิตร
</Tip>

<Note>
`plugins.entries.openai.config.personality` แบบเดิมยังคงถูกอ่านเป็น compatibility fallback เมื่อยังไม่ได้ตั้งค่า `agents.defaults.promptOverlays.gpt5.personality` แบบใช้ร่วมกัน
</Note>

## เสียงพูดและเสียง

<AccordionGroup>
  <Accordion title="การสังเคราะห์เสียงพูด (TTS)">
    Plugin `openai` ที่มีมาในตัวจะลงทะเบียนการสังเคราะห์เสียงพูดสำหรับพื้นที่ใช้งาน `messages.tts`

    | การตั้งค่า | เส้นทาง config | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | เสียง | `messages.tts.providers.openai.voice` | `coral` |
    | ความเร็ว | `messages.tts.providers.openai.speed` | (ไม่ตั้งค่า) |
    | คำสั่ง | `messages.tts.providers.openai.instructions` | (ไม่ตั้งค่า, ใช้ได้กับ `gpt-4o-mini-tts` เท่านั้น) |
    | รูปแบบ | `messages.tts.providers.openai.responseFormat` | `opus` สำหรับ voice notes, `mp3` สำหรับไฟล์ |
    | API key | `messages.tts.providers.openai.apiKey` | ใช้ `OPENAI_API_KEY` เป็นค่า fallback |
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
    ตั้งค่า `OPENAI_TTS_BASE_URL` เพื่อ override TTS base URL โดยไม่กระทบกับ chat API endpoint
    </Note>

  </Accordion>

  <Accordion title="การแปลงเสียงเป็นข้อความ">
    Plugin `openai` ที่มีมาในตัวจะลงทะเบียนการแปลงเสียงเป็นข้อความแบบแบตช์ผ่าน
    พื้นที่ใช้งานการถอดเสียงของการทำความเข้าใจสื่อใน OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - เอนด์พอยต์: OpenAI REST `/v1/audio/transcriptions`
    - เส้นทางอินพุต: อัปโหลดไฟล์เสียงแบบ multipart
    - OpenClaw รองรับทุกที่ที่การถอดเสียงขาเข้าใช้
      `tools.media.audio` รวมถึงช่วงเสียงในช่องเสียงของ Discord และ
      ไฟล์แนบเสียงใน channel

    หากต้องการบังคับให้ใช้ OpenAI สำหรับการถอดเสียงขาเข้า:

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

    คำใบ้ภาษาและ prompt จะถูกส่งต่อไปยัง OpenAI เมื่อมีการระบุจาก
    config สื่อเสียงแบบใช้ร่วมกัน หรือจากคำขอถอดเสียงรายครั้ง

  </Accordion>

  <Accordion title="การถอดเสียงแบบเรียลไทม์">
    Plugin `openai` ที่มีมาในตัวจะลงทะเบียนการถอดเสียงแบบเรียลไทม์สำหรับ Voice Call plugin

    | การตั้งค่า | เส้นทาง config | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | ภาษา | `...openai.language` | (ไม่ตั้งค่า) |
    | Prompt | `...openai.prompt` | (ไม่ตั้งค่า) |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `800` |
    | ค่า threshold ของ VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | ใช้ `OPENAI_API_KEY` เป็นค่า fallback |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียง G.711 u-law (`g711_ulaw` / `audio/pcmu`) โดย provider แบบสตรีมมิงนี้ใช้สำหรับเส้นทางการถอดเสียงแบบเรียลไทม์ของ Voice Call; ส่วนเสียงของ Discord ในปัจจุบันจะบันทึกเป็นช่วงสั้น ๆ และใช้เส้นทางการถอดเสียงแบบแบตช์ `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="เสียงแบบเรียลไทม์">
    Plugin `openai` ที่มีมาในตัวจะลงทะเบียนเสียงแบบเรียลไทม์สำหรับ Voice Call plugin

    | การตั้งค่า | เส้นทาง config | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | เสียง | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | ค่า threshold ของ VAD | `...openai.vadThreshold` | `0.5` |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | ใช้ `OPENAI_API_KEY` เป็นค่า fallback |

    <Note>
    รองรับ Azure OpenAI ผ่านคีย์ config `azureEndpoint` และ `azureDeployment` รองรับการเรียกใช้เครื่องมือแบบสองทิศทาง และใช้รูปแบบเสียง G.711 u-law
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI endpoints

provider `openai` ที่มีมาในตัวสามารถกำหนดเป้าหมายไปยังทรัพยากร Azure OpenAI สำหรับการสร้างภาพได้
ด้วยการ override base URL บนเส้นทางการสร้างภาพ OpenClaw
จะตรวจจับ Azure hostname บน `models.providers.openai.baseUrl` และสลับไปใช้
รูปแบบคำขอของ Azure โดยอัตโนมัติ

<Note>
เสียงแบบเรียลไทม์ใช้เส้นทาง config แยกต่างหาก
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
และไม่ได้รับผลจาก `models.providers.openai.baseUrl` โปรดดู accordion **เสียงแบบเรียลไทม์**
ใน [เสียงพูดและเสียง](#voice-and-speech) สำหรับการตั้งค่า Azure ของฟังก์ชันนี้
</Note>

ใช้ Azure OpenAI เมื่อ:

- คุณมีการสมัครใช้งาน Azure OpenAI, โควตา หรือข้อตกลงระดับองค์กรอยู่แล้ว
- คุณต้องการ data residency ระดับภูมิภาคหรือการควบคุมด้าน compliance ที่ Azure มีให้
- คุณต้องการให้ทราฟฟิกอยู่ภายใน Azure tenancy ที่มีอยู่เดิม

### การตั้งค่า

สำหรับการสร้างภาพผ่าน Azure ด้วย provider `openai` ที่มีมาในตัว ให้ชี้
`models.providers.openai.baseUrl` ไปยังทรัพยากร Azure ของคุณ และตั้ง `apiKey` เป็น
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

OpenClaw จะรู้จัก suffix ของ Azure host ต่อไปนี้สำหรับเส้นทางการสร้างภาพของ Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

สำหรับคำขอการสร้างภาพบน Azure host ที่รู้จัก OpenClaw จะ:

- ส่ง header `api-key` แทน `Authorization: Bearer`
- ใช้เส้นทางแบบผูกกับ deployment (`/openai/deployments/{deployment}/...`)
- เพิ่ม `?api-version=...` ต่อท้ายทุกคำขอ

base URL อื่น ๆ (OpenAI สาธารณะ, proxy ที่เข้ากันได้กับ OpenAI) จะยังคงใช้
รูปแบบคำขอภาพมาตรฐานของ OpenAI

<Note>
การกำหนดเส้นทาง Azure สำหรับเส้นทางการสร้างภาพของ provider `openai`
ต้องใช้ OpenClaw 2026.4.22 หรือใหม่กว่า เวอร์ชันก่อนหน้านี้จะมอง
`openai.baseUrl` แบบกำหนดเองใด ๆ เหมือนเป็นเอนด์พอยต์ OpenAI สาธารณะและจะล้มเหลวเมื่อใช้กับ Azure
image deployment
</Note>

### เวอร์ชัน API

ตั้งค่า `AZURE_OPENAI_API_VERSION` เพื่อ pin เวอร์ชัน preview หรือ GA ของ Azure แบบระบุชัดเจน
สำหรับเส้นทางการสร้างภาพของ Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

ค่าเริ่มต้นคือ `2024-12-01-preview` เมื่อไม่ได้ตั้งค่าตัวแปรนี้

### ชื่อโมเดลคือชื่อ deployment

Azure OpenAI ผูกโมเดลเข้ากับ deployment สำหรับคำขอการสร้างภาพผ่าน Azure
ที่ถูกกำหนดเส้นทางผ่าน provider `openai` ที่มีมาในตัว ฟิลด์ `model` ใน OpenClaw
ต้องเป็น **ชื่อ deployment ของ Azure** ที่คุณตั้งค่าไว้ใน Azure portal ไม่ใช่
model id สาธารณะของ OpenAI

หากคุณสร้าง deployment ชื่อ `gpt-image-2-prod` ที่ให้บริการ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="โปสเตอร์ที่ดูสะอาดตา" size=1024x1024 count=1
```

กฎเรื่องชื่อ deployment เดียวกันนี้ใช้กับการเรียกการสร้างภาพที่ถูกกำหนดเส้นทางผ่าน
provider `openai` ที่มีมาในตัวเช่นกัน

### ความพร้อมใช้งานตามภูมิภาค

ขณะนี้การสร้างภาพของ Azure ใช้งานได้เฉพาะในบางภูมิภาคเท่านั้น
(ตัวอย่างเช่น `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`) โปรดตรวจสอบรายการภูมิภาคล่าสุดของ Microsoft ก่อนสร้าง
deployment และยืนยันว่าโมเดลที่ต้องการมีให้ใช้ในภูมิภาคของคุณ

### ความแตกต่างของพารามิเตอร์

Azure OpenAI และ OpenAI สาธารณะไม่ได้ยอมรับพารามิเตอร์ภาพชุดเดียวกันเสมอไป
Azure อาจปฏิเสธตัวเลือกที่ OpenAI สาธารณะยอมรับได้ (เช่นค่า `background`
บางค่าใน `gpt-image-2`) หรือเปิดให้ใช้ได้เฉพาะในบางเวอร์ชันของโมเดล
ความแตกต่างเหล่านี้มาจาก Azure และโมเดลพื้นฐาน ไม่ใช่จาก
OpenClaw หากคำขอ Azure ล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบความถูกต้อง ให้ตรวจสอบ
ชุดพารามิเตอร์ที่ deployment และเวอร์ชัน API ที่คุณใช้อยู่รองรับใน
Azure portal

<Note>
Azure OpenAI ใช้ transport และพฤติกรรม compat แบบเนทีฟ แต่จะไม่ได้รับ
hidden attribution headers ของ OpenClaw — ดู accordion **เส้นทางแบบเนทีฟเทียบกับแบบ OpenAI-compatible**
ใต้หัวข้อ [การตั้งค่าขั้นสูง](#advanced-configuration)

สำหรับทราฟฟิก chat หรือ Responses บน Azure (นอกเหนือจากการสร้างภาพ) ให้ใช้
flow onboarding หรือ config provider สำหรับ Azure โดยเฉพาะ — `openai.baseUrl` เพียงอย่างเดียว
จะไม่เลือกใช้รูปแบบ API/auth ของ Azure มี provider
`azure-openai-responses/*` แยกต่างหากอยู่แล้ว; ดู
accordion การทำ Compaction ฝั่งเซิร์ฟเวอร์ด้านล่าง
</Note>

## การตั้งค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การขนส่งข้อมูล (WebSocket เทียบกับ SSE)">
    OpenClaw ใช้ WebSocket ก่อนและ fallback ไป SSE (`"auto"`) สำหรับทั้ง `openai/*` และ `openai-codex/*`

    ในโหมด `"auto"` OpenClaw จะ:
    - ลองใหม่หนึ่งครั้งเมื่อ WebSocket ล้มเหลวในช่วงต้น ก่อน fallback ไป SSE
    - หลังความล้มเหลว จะทำเครื่องหมายว่า WebSocket เสื่อมสภาพเป็นเวลาประมาณ 60 วินาที และใช้ SSE ระหว่างช่วง cool-down
    - แนบ header ระบุตัวตนของ session และ turn ที่คงที่สำหรับการลองใหม่และการเชื่อมต่อใหม่
    - ปรับตัวนับการใช้งาน (`input_tokens` / `prompt_tokens`) ให้เป็นมาตรฐานเดียวกันระหว่างรูปแบบ transport ต่าง ๆ

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
            "openai/gpt-5.4": {
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

  <Accordion title="การอุ่นเครื่อง WebSocket">
    OpenClaw เปิดใช้การอุ่นเครื่อง WebSocket โดยค่าเริ่มต้นสำหรับ `openai/*` และ `openai-codex/*` เพื่อลดความหน่วงของเทิร์นแรก

    ```json5
    // ปิดการอุ่นเครื่อง
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="โหมดเร็ว">
    OpenClaw เปิดให้ใช้การสลับโหมดเร็วแบบใช้ร่วมกันสำหรับ `openai/*` และ `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    เมื่อเปิดใช้งาน OpenClaw จะจับคู่โหมดเร็วกับการประมวลผลแบบ priority ของ OpenAI (`service_tier = "priority"`) โดยค่า `service_tier` ที่มีอยู่จะยังคงไว้ และโหมดเร็วจะไม่เขียนทับ `reasoning` หรือ `text.verbosity`

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    การ override ระดับ session มีผลเหนือกว่า config เมื่อเคลียร์การ override ระดับ session ใน Sessions UI แล้ว session จะกลับไปใช้ค่าเริ่มต้นตาม config
    </Note>

  </Accordion>

  <Accordion title="การประมวลผลแบบ priority (service_tier)">
    API ของ OpenAI เปิดให้ใช้การประมวลผลแบบ priority ผ่าน `service_tier` โดยสามารถตั้งค่าต่อโมเดลใน OpenClaw ได้:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    ค่าที่รองรับ: `auto`, `default`, `flex`, `priority`

    <Warning>
    `serviceTier` จะถูกส่งต่อเฉพาะไปยังเอนด์พอยต์ OpenAI แบบเนทีฟ (`api.openai.com`) และเอนด์พอยต์ Codex แบบเนทีฟ (`chatgpt.com/backend-api`) เท่านั้น หากคุณกำหนดเส้นทาง provider ใด provider หนึ่งผ่าน proxy OpenClaw จะปล่อย `service_tier` ไว้ตามเดิม
    </Warning>

  </Accordion>

  <Accordion title="Compaction ฝั่งเซิร์ฟเวอร์ (Responses API)">
    สำหรับโมเดล OpenAI Responses แบบโดยตรง (`openai/*` บน `api.openai.com`) stream wrapper ของ Pi-harness ใน OpenAI plugin จะเปิดใช้ Compaction ฝั่งเซิร์ฟเวอร์โดยอัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ compat ของโมเดลจะตั้ง `supportsStore: false`)
    - แทรก `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - ค่า `compact_threshold` เริ่มต้น: 70% ของ `contextWindow` (หรือ `80000` หากไม่มีข้อมูล)

    สิ่งนี้ใช้กับเส้นทาง Pi harness ที่มีมาในตัว และกับ OpenAI provider hooks ที่ใช้โดยการรันแบบ embedded ด้วย ส่วน native Codex app-server harness จะจัดการ context ของตัวเองผ่าน Codex และตั้งค่าแยกต่างหากด้วย `agents.defaults.embeddedHarness.runtime`

    <Tabs>
      <Tab title="เปิดใช้งานแบบชัดเจน">
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
      <Tab title="เกณฑ์แบบกำหนดเอง">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
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
                "openai/gpt-5.4": {
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
    `responsesServerCompaction` ควบคุมเฉพาะการแทรก `context_management` เท่านั้น โมเดล OpenAI Responses แบบโดยตรงยังคงบังคับ `store: true` เว้นแต่ compat จะตั้ง `supportsStore: false`
    </Note>

  </Accordion>

  <Accordion title="โหมด GPT แบบ agentic เข้มงวด">
    สำหรับการรันตระกูล GPT-5 บน `openai/*` OpenClaw สามารถใช้สัญญาการทำงานแบบ embedded ที่เข้มงวดกว่าเดิมได้:

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
    - ไม่ถือว่าเทิร์นที่มีแต่แผนเป็นความคืบหน้าที่สำเร็จอีกต่อไป หากมีการกระทำผ่านเครื่องมือที่ทำได้
    - ลองเทิร์นนั้นใหม่พร้อมแนวทางบังคับให้ลงมือทันที
    - เปิดใช้ `update_plan` โดยอัตโนมัติสำหรับงานที่มีเนื้อหาสำคัญ
    - แสดงสถานะติดขัดอย่างชัดเจน หากโมเดลยังคงวางแผนโดยไม่ลงมือทำ

    <Note>
    จำกัดเฉพาะการรันตระกูล GPT-5 ของ OpenAI และ Codex เท่านั้น provider อื่นและตระกูลโมเดลรุ่นเก่าจะยังคงใช้พฤติกรรมเริ่มต้น
    </Note>

  </Accordion>

  <Accordion title="เส้นทางแบบเนทีฟเทียบกับแบบ OpenAI-compatible">
    OpenClaw ปฏิบัติต่อเอนด์พอยต์ OpenAI โดยตรง, Codex และ Azure OpenAI แตกต่างจาก proxy `/v1` ทั่วไปที่เข้ากันได้กับ OpenAI:

    **เส้นทางแบบเนทีฟ** (`openai/*`, Azure OpenAI):
    - คง `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับ `none` effort ของ OpenAI
    - ละเว้น disabled reasoning สำหรับโมเดลหรือ proxy ที่ปฏิเสธ `reasoning.effort: "none"`
    - ใช้ strict mode เป็นค่าเริ่มต้นสำหรับ schema ของเครื่องมือ
    - แนบ hidden attribution headers เฉพาะบนโฮสต์แบบเนทีฟที่ยืนยันแล้วเท่านั้น
    - คงรูปแบบคำขอเฉพาะของ OpenAI (`service_tier`, `store`, reasoning-compat, prompt-cache hints)

    **เส้นทางแบบ proxy/compatible:**
    - ใช้พฤติกรรม compat ที่ยืดหยุ่นกว่า
    - ตัด `store` ของ Completions ออกจาก payload `openai-completions` ที่ไม่ใช่แบบเนทีฟ
    - ยอมรับ JSON แบบ pass-through สำหรับ `params.extra_body`/`params.extraBody` ขั้นสูงสำหรับ proxy Completions ที่เข้ากันได้กับ OpenAI
    - ไม่บังคับ strict tool schemas หรือ native-only headers

    Azure OpenAI ใช้ transport และพฤติกรรม compat แบบเนทีฟ แต่จะไม่ได้รับ hidden attribution headers

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือภาพแบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอแบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการนำ credentials กลับมาใช้ซ้ำ
  </Card>
</CardGroup>
