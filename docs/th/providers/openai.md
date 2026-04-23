---
read_when:
    - คุณต้องการใช้โมเดล OpenAI ใน OpenClaw
    - คุณต้องการการยืนยันตัวตนด้วยการสมัครใช้งาน Codex แทน API keys
    - คุณต้องการพฤติกรรมการรันเอเจนต์ของ GPT-5 ที่เข้มงวดขึ้น
summary: ใช้ OpenAI ผ่าน API keys หรือการสมัครใช้งาน Codex ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T10:22:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3d847e53c2faee5363071dfdcb1f4150b64577674161e000844f579482198d1
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI ให้บริการ API สำหรับนักพัฒนาสำหรับโมเดล GPT OpenClaw รองรับ 2 เส้นทางการยืนยันตัวตน:

  - **API key** — การเข้าถึง OpenAI Platform โดยตรงพร้อมการคิดค่าบริการตามการใช้งาน (`openai/*` models)
  - **การสมัครใช้งาน Codex** — การลงชื่อเข้าใช้ ChatGPT/Codex พร้อมการเข้าถึงผ่านการสมัครใช้งาน (`openai-codex/*` models)

  OpenAI รองรับการใช้งาน subscription OAuth ในเครื่องมือภายนอกและเวิร์กโฟลว์อย่าง OpenClaw อย่างชัดเจน

  ## ความครอบคลุมของฟีเจอร์ใน OpenClaw

  | ความสามารถของ OpenAI      | พื้นผิวใน OpenClaw                         | สถานะ                                                   |
  | ------------------------- | ------------------------------------------ | ------------------------------------------------------- |
  | Chat / Responses          | model provider `openai/<model>`            | ใช่                                                     |
  | โมเดลแบบสมัครใช้งาน Codex | model provider `openai-codex/<model>`      | ใช่                                                     |
  | การค้นหาเว็บฝั่งเซิร์ฟเวอร์ | Native OpenAI Responses tool              | ใช่ เมื่อเปิดใช้ web search และไม่ได้ pin provider ไว้ |
  | รูปภาพ                    | `image_generate`                           | ใช่                                                     |
  | วิดีโอ                    | `video_generate`                           | ใช่                                                     |
  | Text-to-speech            | `messages.tts.provider: "openai"` / `tts`  | ใช่                                                     |
  | Speech-to-text แบบแบตช์   | `tools.media.audio` / media understanding  | ใช่                                                     |
  | Speech-to-text แบบสตรีม   | Voice Call `streaming.provider: "openai"`  | ใช่                                                     |
  | เสียงแบบ Realtime         | Voice Call `realtime.provider: "openai"`   | ใช่                                                     |
  | Embeddings                | memory embedding provider                  | ใช่                                                     |

  ## เริ่มต้นใช้งาน

  เลือกวิธีการยืนยันตัวตนที่คุณต้องการ และทำตามขั้นตอนการตั้งค่า

  <Tabs>
  <Tab title="API key (OpenAI Platform)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง API โดยตรงและการคิดค่าบริการตามการใช้งาน

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

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | OpenAI Platform API โดยตรง | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | OpenAI Platform API โดยตรง | `OPENAI_API_KEY` |

    <Note>
    การลงชื่อเข้าใช้ ChatGPT/Codex จะถูกกำหนดเส้นทางผ่าน `openai-codex/*` ไม่ใช่ `openai/*`
    </Note>

    ### ตัวอย่าง config

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **ไม่** เปิดเผย `openai/gpt-5.3-codex-spark` บนเส้นทาง API โดยตรง คำขอ OpenAI API แบบ live จะปฏิเสธโมเดลนั้น Spark ใช้ได้เฉพาะกับ Codex เท่านั้น
    </Warning>

  </Tab>

  <Tab title="การสมัครใช้งาน Codex">
    **เหมาะที่สุดสำหรับ:** การใช้การสมัครใช้งาน ChatGPT/Codex ของคุณแทน API key แยกต่างหาก Codex cloud ต้องใช้การลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="รัน Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        หรือรัน OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        สำหรับการตั้งค่าแบบ headless หรือสภาพแวดล้อมที่ไม่เหมาะกับ callback ให้เพิ่ม `--device-code` เพื่อเข้าสู่ระบบด้วยโฟลว์ device-code ของ ChatGPT แทน callback ผ่านเบราว์เซอร์บน localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | การลงชื่อเข้าใช้ Codex |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | การลงชื่อเข้าใช้ Codex (ขึ้นอยู่กับ entitlement) |

    <Note>
    เส้นทางนี้ถูกแยกจาก `openai/gpt-5.4` โดยเจตนา ใช้ `openai/*` กับ API key สำหรับการเข้าถึง Platform โดยตรง และใช้ `openai-codex/*` สำหรับการเข้าถึงผ่านการสมัครใช้งาน Codex
    </Note>

    ### ตัวอย่าง config

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    Onboarding จะไม่นำเข้า OAuth material จาก `~/.codex` อีกต่อไป ให้ลงชื่อเข้าใช้ด้วย browser OAuth (ค่าเริ่มต้น) หรือโฟลว์ device-code ด้านบน — OpenClaw จะจัดการข้อมูลรับรองที่ได้ไว้ในที่เก็บ auth ของเอเจนต์ของตัวเอง
    </Note>

    ### ขีดจำกัด context window

    OpenClaw ถือว่าข้อมูลเมตาของโมเดลและเพดาน context ของรันไทม์เป็นคนละค่า

    สำหรับ `openai-codex/gpt-5.4`:

    - `contextWindow` แบบ native: `1050000`
    - เพดาน `contextTokens` ของรันไทม์โดยค่าเริ่มต้น: `272000`

    เพดานค่าเริ่มต้นที่เล็กกว่านี้ให้ latency และคุณภาพที่ดีกว่าในทางปฏิบัติ คุณสามารถ override ได้ด้วย `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    ใช้ `contextWindow` เพื่อประกาศข้อมูลเมตา native ของโมเดล ใช้ `contextTokens` เพื่อจำกัดงบประมาณ context ของรันไทม์
    </Note>

  </Tab>
</Tabs>

## การสร้างรูปภาพ

plugin `openai` ที่มากับระบบจะลงทะเบียนการสร้างรูปภาพผ่านเครื่องมือ `image_generate`

| ความสามารถ              | ค่า                                |
| ----------------------- | ---------------------------------- |
| โมเดลเริ่มต้น           | `openai/gpt-image-2`               |
| จำนวนรูปสูงสุดต่อคำขอ   | 4                                  |
| โหมดแก้ไข              | เปิดใช้ (สูงสุด 5 รูปอ้างอิง)      |
| การ override ขนาด       | รองรับ รวมถึงขนาด 2K/4K            |
| อัตราส่วนภาพ / ความละเอียด | ไม่ส่งต่อไปยัง OpenAI Images API |

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
ดู [การสร้างรูปภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือแบบใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

`gpt-image-2` เป็นค่าเริ่มต้นทั้งสำหรับการสร้างภาพจากข้อความของ OpenAI และการ
แก้ไขรูปภาพ `gpt-image-1` ยังสามารถใช้ได้ในฐานะการ override โมเดลแบบ explicit แต่
เวิร์กโฟลว์รูปภาพใหม่ของ OpenAI ควรใช้ `openai/gpt-image-2`

สร้าง:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

แก้ไข:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## การสร้างวิดีโอ

plugin `openai` ที่มากับระบบจะลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ `video_generate`

| ความสามารถ         | ค่า                                                                               |
| ------------------ | --------------------------------------------------------------------------------- |
| โมเดลเริ่มต้น      | `openai/sora-2`                                                                   |
| โหมด               | ข้อความเป็นวิดีโอ, รูปภาพเป็นวิดีโอ, แก้ไขวิดีโอเดี่ยว                         |
| อินพุตอ้างอิง      | 1 รูปภาพ หรือ 1 วิดีโอ                                                            |
| การ override ขนาด  | รองรับ                                                                            |
| การ override อื่น ๆ | `aspectRatio`, `resolution`, `audio`, `watermark` จะถูกเพิกเฉยพร้อมคำเตือนจากเครื่องมือ |

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือแบบใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

## ส่วนเสริมพรอมป์ต GPT-5

OpenClaw เพิ่มส่วนเสริมพรอมป์ต GPT-5 แบบใช้ร่วมกันสำหรับการรันตระกูล GPT-5 ข้าม providers โดยจะใช้ตาม model id ดังนั้น `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` และ GPT-5 refs อื่นที่เข้ากันได้จะได้รับ overlay เดียวกัน ส่วนโมเดล GPT-4.x รุ่นเก่าจะไม่ได้รับ

provider harness Codex แบบ native ที่มากับระบบ (`codex/*`) ใช้พฤติกรรม GPT-5 และ Heartbeat overlay เดียวกันผ่านคำสั่งสำหรับนักพัฒนาใน Codex app-server ดังนั้นเซสชัน `codex/gpt-5.x` จะคงการติดตามงานต่อและแนวทาง Heartbeat เชิงรุกแบบเดียวกัน แม้ว่า Codex จะเป็นเจ้าของพรอมป์ตส่วนที่เหลือของ harness

ส่วนเสริม GPT-5 จะเพิ่มสัญญาพฤติกรรมแบบมีแท็กสำหรับการคง persona ความปลอดภัยในการรัน วินัยการใช้เครื่องมือ รูปแบบผลลัพธ์ การตรวจสอบความเสร็จสมบูรณ์ และการตรวจสอบยืนยัน พฤติกรรมการตอบกลับและข้อความเงียบที่เฉพาะกับ channel ยังคงอยู่ใน system prompt แบบใช้ร่วมกันของ OpenClaw และนโยบายการส่งขาออก แนวทาง GPT-5 จะเปิดใช้งานเสมอสำหรับโมเดลที่ตรงกัน ส่วนเลเยอร์รูปแบบการโต้ตอบที่เป็นมิตรนั้นแยกออกมาและกำหนดค่าได้

| ค่า                    | ผลลัพธ์                                     |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้เลเยอร์รูปแบบการโต้ตอบที่เป็นมิตร   |
| `"on"`                 | alias ของ `"friendly"`                      |
| `"off"`                | ปิดเฉพาะเลเยอร์รูปแบบที่เป็นมิตร           |

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
ค่าต่าง ๆ ไม่สนใจตัวพิมพ์เล็กใหญ่ในรันไทม์ ดังนั้น `"Off"` และ `"off"` จะปิดเลเยอร์รูปแบบที่เป็นมิตรเหมือนกัน
</Tip>

<Note>
`plugins.entries.openai.config.personality` แบบเดิมยังคงถูกอ่านในฐานะ compatibility fallback เมื่อไม่ได้ตั้งค่าร่วม `agents.defaults.promptOverlays.gpt5.personality`
</Note>

## เสียงและสุนทรพจน์

<AccordionGroup>
  <Accordion title="การสังเคราะห์เสียงพูด (TTS)">
    plugin `openai` ที่มากับระบบจะลงทะเบียนการสังเคราะห์เสียงพูดสำหรับพื้นผิว `messages.tts`

    | Setting | Path config | ค่าเริ่มต้น |
    |---------|------------|-------------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voice | `messages.tts.providers.openai.voice` | `coral` |
    | Speed | `messages.tts.providers.openai.speed` | (ไม่ตั้งค่า) |
    | Instructions | `messages.tts.providers.openai.instructions` | (ไม่ตั้งค่า, เฉพาะ `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` สำหรับ voice notes, `mp3` สำหรับไฟล์ |
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
    plugin `openai` ที่มากับระบบจะลงทะเบียน speech-to-text แบบแบตช์ผ่าน
    พื้นผิวการถอดเสียงของ media-understanding ใน OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - เส้นทางอินพุต: การอัปโหลดไฟล์เสียงแบบ multipart
    - รองรับใน OpenClaw ทุกที่ที่การถอดเสียงเสียงขาเข้าใช้
      `tools.media.audio` รวมถึงเซกเมนต์ voice-channel ของ Discord และไฟล์แนบเสียงของ channel

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

    คำใบ้ภาษาและพรอมป์ตจะถูกส่งต่อไปยัง OpenAI เมื่อมีการระบุจาก
    config สื่อเสียงแบบใช้ร่วมกันหรือคำขอถอดเสียงรายครั้ง

  </Accordion>

  <Accordion title="Realtime transcription">
    plugin `openai` ที่มากับระบบจะลงทะเบียนการถอดเสียงแบบเรียลไทม์สำหรับ Voice Call plugin

    | Setting | Path config | ค่าเริ่มต้น |
    |---------|------------|-------------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Language | `...openai.language` | (ไม่ตั้งค่า) |
    | Prompt | `...openai.prompt` | (ไม่ตั้งค่า) |
    | Silence duration | `...openai.silenceDurationMs` | `800` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียง G.711 u-law (`g711_ulaw` / `audio/pcmu`) streaming provider นี้มีไว้สำหรับเส้นทางการถอดเสียงแบบเรียลไทม์ของ Voice Call; ขณะนี้เสียง Discord ยังบันทึกเป็นเซกเมนต์สั้น ๆ และใช้เส้นทางการถอดเสียงแบบแบตช์ `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    plugin `openai` ที่มากับระบบจะลงทะเบียนเสียงแบบเรียลไทม์สำหรับ Voice Call plugin

    | Setting | Path config | ค่าเริ่มต้น |
    |---------|------------|-------------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Voice | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | Silence duration | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |

    <Note>
    รองรับ Azure OpenAI ผ่านคีย์ config `azureEndpoint` และ `azureDeployment` รองรับการเรียกใช้เครื่องมือแบบสองทิศทาง ใช้รูปแบบเสียง G.711 u-law
    </Note>

  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw ใช้ WebSocket-first พร้อม SSE fallback (`"auto"`) สำหรับทั้ง `openai/*` และ `openai-codex/*`

    ในโหมด `"auto"` OpenClaw จะ:
    - ลองใหม่หนึ่งครั้งเมื่อ WebSocket ล้มเหลวในช่วงต้น ก่อน fallback ไปใช้ SSE
    - หลังเกิดความล้มเหลว จะทำเครื่องหมายว่า WebSocket เสื่อมสภาพเป็นเวลาประมาณ 60 วินาที และใช้ SSE ระหว่างช่วง cool-down
    - แนบ headers ตัวตนของ session และ turn ที่เสถียรสำหรับการลองใหม่และการเชื่อมต่อใหม่
    - ปรับมาตรฐานตัวนับการใช้งาน (`input_tokens` / `prompt_tokens`) ข้าม transport แต่ละแบบ

    | Value | พฤติกรรม |
    |-------|----------|
    | `"auto"` (ค่าเริ่มต้น) | WebSocket ก่อน, fallback เป็น SSE |
    | `"sse"` | บังคับใช้ SSE เท่านั้น |
    | `"websocket"` | บังคับใช้ WebSocket เท่านั้น |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
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
    OpenClaw เปิดใช้ WebSocket warm-up โดยค่าเริ่มต้นสำหรับ `openai/*` เพื่อลด latency ของเทิร์นแรก

    ```json5
    // ปิด warm-up
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

<a id="openai-fast-mode"></a>

  <Accordion title="Fast mode">
    OpenClaw เปิดเผยตัวสลับ fast mode แบบใช้ร่วมกันสำหรับทั้ง `openai/*` และ `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    เมื่อเปิดใช้ OpenClaw จะจับคู่ fast mode ไปยังการประมวลผลแบบ priority ของ OpenAI (`service_tier = "priority"`) ค่า `service_tier` ที่มีอยู่เดิมจะถูกรักษาไว้ และ fast mode จะไม่เขียนทับ `reasoning` หรือ `text.verbosity`

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    การ override ระดับ session มีลำดับความสำคัญเหนือ config การล้าง session override ใน Sessions UI จะทำให้ session กลับไปใช้ค่าเริ่มต้นที่กำหนดไว้
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    API ของ OpenAI เปิดเผยการประมวลผลแบบ priority ผ่าน `service_tier` ตั้งค่าเป็นรายโมเดลใน OpenClaw ได้:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    ค่าที่รองรับ: `auto`, `default`, `flex`, `priority`

    <Warning>
    `serviceTier` จะถูกส่งต่อเฉพาะไปยัง native OpenAI endpoints (`api.openai.com`) และ native Codex endpoints (`chatgpt.com/backend-api`) เท่านั้น หากคุณกำหนดเส้นทาง provider ใด provider หนึ่งผ่านพร็อกซี OpenClaw จะปล่อย `service_tier` ไว้โดยไม่แก้ไข
    </Warning>

  </Accordion>

  <Accordion title="Compaction ฝั่งเซิร์ฟเวอร์ (Responses API)">
    สำหรับโมเดล OpenAI Responses โดยตรง (`openai/*` บน `api.openai.com`) OpenClaw จะเปิดใช้ Compaction ฝั่งเซิร์ฟเวอร์โดยอัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ compat ของโมเดลจะตั้ง `supportsStore: false`)
    - แทรก `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - ค่าเริ่มต้น `compact_threshold`: 70% ของ `contextWindow` (หรือ `80000` เมื่อไม่มีค่า)

    <Tabs>
      <Tab title="เปิดใช้แบบ explicit">
        มีประโยชน์สำหรับ endpoints ที่เข้ากันได้ เช่น Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
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
    `responsesServerCompaction` ควบคุมเฉพาะการแทรก `context_management` เท่านั้น โมเดล OpenAI Responses โดยตรงยังคงบังคับ `store: true` เว้นแต่ compat จะตั้ง `supportsStore: false`
    </Note>

  </Accordion>

  <Accordion title="โหมด GPT แบบเอเจนต์เข้มงวด">
    สำหรับการรันตระกูล GPT-5 บน `openai/*` และ `openai-codex/*` OpenClaw สามารถใช้สัญญาการรันแบบฝังที่เข้มงวดยิ่งขึ้นได้:

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
    - ไม่ถือว่าเทิร์นที่มีเพียงแผนเป็นความคืบหน้าที่สำเร็จอีกต่อไปเมื่อมีการกระทำผ่านเครื่องมือที่พร้อมใช้งาน
    - ลองเทิร์นใหม่พร้อมคำชี้นำให้ลงมือทันที
    - เปิดใช้ `update_plan` อัตโนมัติสำหรับงานที่มีสาระสำคัญ
    - แสดงสถานะ blocked แบบ explicit หากโมเดลยังคงวางแผนโดยไม่ลงมือทำ

    <Note>
    จำกัดเฉพาะการรันตระกูล GPT-5 ของ OpenAI และ Codex เท่านั้น providers อื่นและตระกูลโมเดลรุ่นเก่าจะยังคงใช้พฤติกรรมค่าเริ่มต้น
    </Note>

  </Accordion>

  <Accordion title="เส้นทางแบบ native กับแบบ OpenAI-compatible">
    OpenClaw ปฏิบัติต่อ direct OpenAI, Codex และ Azure OpenAI endpoints แตกต่างจากพร็อกซี `/v1` แบบ OpenAI-compatible ทั่วไป:

    **เส้นทางแบบ native** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - คง `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับ OpenAI `none` effort
    - ละเว้น disabled reasoning สำหรับโมเดลหรือพร็อกซีที่ปฏิเสธ `reasoning.effort: "none"`
    - ใช้ strict mode เป็นค่าเริ่มต้นสำหรับ schema ของเครื่องมือ
    - แนบ attribution headers แบบซ่อนบนโฮสต์ native ที่ยืนยันแล้วเท่านั้น
    - คงการจัดรูปคำขอเฉพาะของ OpenAI (`service_tier`, `store`, reasoning-compat, prompt-cache hints)

    **เส้นทางแบบพร็อกซี/compatible:**
    - ใช้พฤติกรรม compat ที่ผ่อนปรนกว่า
    - ไม่บังคับ strict tool schemas หรือ native-only headers

    Azure OpenAI ใช้ transport และพฤติกรรม compat แบบ native แต่จะไม่ได้รับ hidden attribution headers

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
  <Card title="Image generation" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือรูปภาพแบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="Video generation" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอแบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="OAuth and auth" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
