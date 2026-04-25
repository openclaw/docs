---
read_when:
    - คุณต้องการใช้เวิร์กโฟลว์ ComfyUI ภายในเครื่องร่วมกับ OpenClaw
    - คุณต้องการใช้ Comfy Cloud กับเวิร์กโฟลว์รูปภาพ วิดีโอ หรือเพลง
    - คุณต้องการคีย์ config ของ Plugin comfy ที่มาพร้อมระบบ
summary: การตั้งค่าการสร้างรูปภาพ วิดีโอ และเพลงของเวิร์กโฟลว์ ComfyUI ใน OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-25T13:56:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41dda4be24d5b2c283fa499a345cf9f38747ec19b4010163ceffd998307ca086
    source_path: providers/comfy.md
    workflow: 15
---

OpenClaw มาพร้อม Plugin `comfy` ที่รวมมาในระบบสำหรับการรัน ComfyUI แบบขับเคลื่อนด้วยเวิร์กโฟลว์ทั้งหมด Plugin นี้ขับเคลื่อนด้วยเวิร์กโฟลว์ทั้งหมด ดังนั้น OpenClaw จะไม่พยายามแมป `size`, `aspectRatio`, `resolution`, `durationSeconds` หรือการควบคุมแบบ TTS ทั่วไปไปยังกราฟของคุณ

| Property        | รายละเอียด                                                                        |
| --------------- | --------------------------------------------------------------------------------- |
| Provider        | `comfy`                                                                           |
| Models          | `comfy/workflow`                                                                  |
| Shared surfaces | `image_generate`, `video_generate`, `music_generate`                              |
| Auth            | ไม่มีสำหรับ ComfyUI ภายในเครื่อง; `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` สำหรับ Comfy Cloud |
| API             | ComfyUI `/prompt` / `/history` / `/view` และ Comfy Cloud `/api/*`                 |

## สิ่งที่รองรับ

- การสร้างรูปภาพจากเวิร์กโฟลว์ JSON
- การแก้ไขรูปภาพด้วยรูปอ้างอิงที่อัปโหลด 1 รูป
- การสร้างวิดีโอจากเวิร์กโฟลว์ JSON
- การสร้างวิดีโอด้วยรูปอ้างอิงที่อัปโหลด 1 รูป
- การสร้างเพลงหรือเสียงผ่านเครื่องมือ `music_generate` ที่ใช้ร่วมกัน
- การดาวน์โหลดเอาต์พุตจาก node ที่กำหนดค่าไว้ หรือจากทุก output node ที่ตรงกัน

## เริ่มต้นใช้งาน

เลือกระหว่างการรัน ComfyUI บนเครื่องของคุณเองหรือใช้ Comfy Cloud

<Tabs>
  <Tab title="Local">
    **เหมาะสำหรับ:** การรันอินสแตนซ์ ComfyUI ของคุณเองบนเครื่องหรือ LAN ของคุณ

    <Steps>
      <Step title="เริ่ม ComfyUI ภายในเครื่อง">
        ตรวจสอบให้แน่ใจว่าอินสแตนซ์ ComfyUI ภายในเครื่องของคุณกำลังทำงานอยู่ (ค่าเริ่มต้นคือ `http://127.0.0.1:8188`)
      </Step>
      <Step title="เตรียมเวิร์กโฟลว์ JSON ของคุณ">
        export หรือสร้างไฟล์เวิร์กโฟลว์ JSON ของ ComfyUI จด node ID สำหรับ prompt input node และ output node ที่คุณต้องการให้ OpenClaw อ่าน
      </Step>
      <Step title="กำหนดค่า provider">
        ตั้งค่า `mode: "local"` และชี้ไปยังไฟล์เวิร์กโฟลว์ของคุณ ด้านล่างคือตัวอย่างรูปภาพขั้นต่ำ:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "local",
                  baseUrl: "http://127.0.0.1:8188",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ชี้ OpenClaw ไปที่โมเดล `comfy/workflow` สำหรับ capability ที่คุณกำหนดค่าไว้:

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="ตรวจสอบ">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **เหมาะสำหรับ:** การรันเวิร์กโฟลว์บน Comfy Cloud โดยไม่ต้องจัดการทรัพยากร GPU ภายในเครื่อง

    <Steps>
      <Step title="รับ API key">
        สมัครใช้งานที่ [comfy.org](https://comfy.org) และสร้าง API key จากแดชบอร์ดบัญชีของคุณ
      </Step>
      <Step title="ตั้งค่า API key">
        ระบุคีย์ของคุณด้วยวิธีใดวิธีหนึ่งต่อไปนี้:

        ```bash
        # ตัวแปร environment (แนะนำ)
        export COMFY_API_KEY="your-key"

        # ตัวแปร environment ทางเลือก
        export COMFY_CLOUD_API_KEY="your-key"

        # หรือกำหนดใน config โดยตรง
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="เตรียมเวิร์กโฟลว์ JSON ของคุณ">
        export หรือสร้างไฟล์เวิร์กโฟลว์ JSON ของ ComfyUI จด node ID สำหรับ prompt input node และ output node
      </Step>
      <Step title="กำหนดค่า provider">
        ตั้งค่า `mode: "cloud"` และชี้ไปยังไฟล์เวิร์กโฟลว์ของคุณ:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        โหมด cloud ใช้ `baseUrl` เป็น `https://cloud.comfy.org` โดยค่าเริ่มต้น คุณจำเป็นต้องตั้งค่า `baseUrl` ก็ต่อเมื่อใช้ cloud endpoint แบบกำหนดเอง
        </Tip>
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="ตรวจสอบ">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## การกำหนดค่า

Comfy รองรับการตั้งค่าการเชื่อมต่อระดับบนสุดที่ใช้ร่วมกัน รวมถึงส่วนเวิร์กโฟลว์แยกตาม capability (`image`, `video`, `music`):

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
          mode: "local",
          baseUrl: "http://127.0.0.1:8188",
          image: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
          video: {
            workflowPath: "./workflows/video-api.json",
            promptNodeId: "12",
            outputNodeId: "21",
          },
          music: {
            workflowPath: "./workflows/music-api.json",
            promptNodeId: "3",
            outputNodeId: "18",
          },
        },
      },
    },
  },
}
```

### คีย์ที่ใช้ร่วมกัน

| Key                   | Type                   | คำอธิบาย                                                                                |
| --------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| `mode`                | `"local"` or `"cloud"` | โหมดการเชื่อมต่อ                                                                         |
| `baseUrl`             | string                 | ค่าเริ่มต้นคือ `http://127.0.0.1:8188` สำหรับ local หรือ `https://cloud.comfy.org` สำหรับ cloud |
| `apiKey`              | string                 | คีย์แบบ inline ที่เป็นทางเลือกแทนตัวแปร env `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`     |
| `allowPrivateNetwork` | boolean                | อนุญาต `baseUrl` แบบ private/LAN ในโหมด cloud                                           |

### คีย์แยกตาม capability

คีย์เหล่านี้ใช้ภายในส่วน `image`, `video` หรือ `music`:

| Key                          | Required | Default  | คำอธิบาย                                                                 |
| ---------------------------- | -------- | -------- | ------------------------------------------------------------------------- |
| `workflow` or `workflowPath` | Yes      | --       | พาธไปยังไฟล์เวิร์กโฟลว์ JSON ของ ComfyUI                                  |
| `promptNodeId`               | Yes      | --       | Node ID ที่รับ text prompt                                                |
| `promptInputName`            | No       | `"text"` | ชื่อ input บน prompt node                                                |
| `outputNodeId`               | No       | --       | Node ID ที่จะอ่านเอาต์พุต หากไม่ระบุ จะใช้ทุก output node ที่ตรงกัน        |
| `pollIntervalMs`             | No       | --       | ช่วงเวลา polling เป็นมิลลิวินาทีสำหรับรอให้งานเสร็จสิ้น                   |
| `timeoutMs`                  | No       | --       | ค่า timeout เป็นมิลลิวินาทีสำหรับการรันเวิร์กโฟลว์                         |

ส่วน `image` และ `video` ยังรองรับ:

| Key                   | Required                             | Default   | คำอธิบาย                                           |
| --------------------- | ------------------------------------ | --------- | --------------------------------------------------- |
| `inputImageNodeId`    | Yes (when passing a reference image) | --        | Node ID ที่รับรูปอ้างอิงที่อัปโหลด                  |
| `inputImageInputName` | No                                   | `"image"` | ชื่อ input บน image node                           |

## รายละเอียดเวิร์กโฟลว์

<AccordionGroup>
  <Accordion title="เวิร์กโฟลว์รูปภาพ">
    ตั้งค่าโมเดลรูปภาพเริ่มต้นเป็น `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **ตัวอย่างการแก้ไขด้วยรูปอ้างอิง:**

    หากต้องการเปิดใช้การแก้ไขรูปภาพด้วยรูปอ้างอิงที่อัปโหลด ให้เพิ่ม `inputImageNodeId` ลงใน config รูปภาพของคุณ:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              image: {
                workflowPath: "./workflows/edit-api.json",
                promptNodeId: "6",
                inputImageNodeId: "7",
                inputImageInputName: "image",
                outputNodeId: "9",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="เวิร์กโฟลว์วิดีโอ">
    ตั้งค่าโมเดลวิดีโอเริ่มต้นเป็น `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    เวิร์กโฟลว์วิดีโอของ Comfy รองรับ text-to-video และ image-to-video ผ่านกราฟที่กำหนดค่าไว้

    <Note>
    OpenClaw จะไม่ส่งวิดีโออินพุตเข้าไปในเวิร์กโฟลว์ Comfy อินพุตที่รองรับมีเพียง text prompts และรูปอ้างอิงเดี่ยวเท่านั้น
    </Note>

  </Accordion>

  <Accordion title="เวิร์กโฟลว์เพลง">
    Plugin ที่รวมมากับระบบจะลงทะเบียน provider สำหรับการสร้างเพลงที่กำหนดโดยเวิร์กโฟลว์สำหรับเอาต์พุตเสียงหรือเพลง ซึ่งแสดงผ่านเครื่องมือ `music_generate` ที่ใช้ร่วมกัน:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    ใช้ส่วน config `music` เพื่อชี้ไปยังเวิร์กโฟลว์ JSON สำหรับเสียงและ output node ของคุณ

  </Accordion>

  <Accordion title="ความเข้ากันได้ย้อนหลัง">
    config รูปภาพระดับบนสุดแบบเดิม (โดยไม่มีส่วน `image` แบบซ้อน) ยังใช้งานได้:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw จะถือว่าโครงสร้างแบบเดิมนี้เป็น config เวิร์กโฟลว์รูปภาพ คุณยังไม่จำเป็นต้องย้ายทันที แต่สำหรับการตั้งค่าใหม่ แนะนำให้ใช้ส่วน `image` / `video` / `music` แบบซ้อน

    <Tip>
    หากคุณใช้เฉพาะการสร้างรูปภาพ config แบบแบนเดิมและส่วน `image` แบบซ้อนใหม่จะเทียบเท่ากันในเชิงการทำงาน
    </Tip>

  </Accordion>

  <Accordion title="Live tests">
    มีการทดสอบ live แบบ opt-in สำหรับ Plugin ที่รวมมากับระบบ:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    live test จะข้ามกรณีรูปภาพ วิดีโอ หรือเพลงแต่ละกรณี หากไม่มีการกำหนดค่าส่วนเวิร์กโฟลว์ Comfy ที่ตรงกัน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้างรูปภาพ" href="/th/tools/image-generation" icon="image">
    การกำหนดค่าและการใช้งานเครื่องมือสร้างรูปภาพ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    การกำหนดค่าและการใช้งานเครื่องมือสร้างวิดีโอ
  </Card>
  <Card title="การสร้างเพลง" href="/th/tools/music-generation" icon="music">
    การตั้งค่าเครื่องมือสร้างเพลงและเสียง
  </Card>
  <Card title="ไดเรกทอรี Provider" href="/th/providers/index" icon="layers">
    ภาพรวมของ Provider ทั้งหมดและ model refs
  </Card>
  <Card title="ข้อมูลอ้างอิง config" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ข้อมูลอ้างอิง config แบบเต็ม รวมถึงค่าเริ่มต้นของ agent
  </Card>
</CardGroup>
