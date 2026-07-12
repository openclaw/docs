---
read_when:
    - คุณต้องการใช้เวิร์กโฟลว์ ComfyUI ภายในเครื่องร่วมกับ OpenClaw
    - คุณต้องการใช้ Comfy Cloud กับเวิร์กโฟลว์รูปภาพ วิดีโอ หรือเพลง
    - คุณต้องใช้คีย์การกำหนดค่าของ Plugin comfy ที่มาพร้อมระบบ
summary: การตั้งค่าการสร้างภาพ วิดีโอ และเพลงด้วยเวิร์กโฟลว์ ComfyUI ใน OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-07-12T16:36:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw มาพร้อมกับ Plugin `comfy` ที่รวมมาให้สำหรับเรียกใช้ ComfyUI ตามเวิร์กโฟลว์
Plugin นี้ขับเคลื่อนด้วยเวิร์กโฟลว์ทั้งหมด กล่าวคือ OpenClaw จะไม่นำตัวควบคุมทั่วไปอย่าง `size`,
`aspectRatio`, `resolution`, `durationSeconds` หรือตัวควบคุมแบบ TTS
ไปแมปกับกราฟของคุณ

| คุณสมบัติ             | รายละเอียด                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------- |
| ผู้ให้บริการ          | `comfy`                                                                                     |
| โมเดล                 | `comfy/workflow`                                                                            |
| เครื่องมือที่ใช้ร่วมกัน | `image_generate`, `video_generate`, `music_generate`                                        |
| การยืนยันตัวตน        | ไม่ต้องใช้สำหรับ ComfyUI ภายในเครื่อง; ใช้ `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` สำหรับ Comfy Cloud |
| API                  | ComfyUI `/prompt` / `/history` / `/view`; Comfy Cloud `/api/*`                              |

## ความสามารถที่รองรับ

- สร้างและแก้ไขรูปภาพจาก JSON เวิร์กโฟลว์ (การแก้ไขรับรูปภาพอ้างอิงที่อัปโหลด 1 รูป)
- สร้างวิดีโอจาก JSON เวิร์กโฟลว์ ทั้งจากข้อความเป็นวิดีโอหรือจากรูปภาพเป็นวิดีโอ (รูปภาพอ้างอิง 1 รูป)
- สร้างเพลง/เสียงผ่านเครื่องมือ `music_generate` ที่ใช้ร่วมกัน โดยเลือกระบุรูปภาพอ้างอิงได้ 1 รูป
- ดาวน์โหลดผลลัพธ์จาก Node ที่กำหนดค่าไว้ หรือจาก Node ผลลัพธ์ทั้งหมดที่ตรงกันเมื่อไม่ได้กำหนด Node ไว้

## เริ่มต้นใช้งาน

เลือกว่าจะเรียกใช้ ComfyUI บนเครื่องของคุณเองหรือใช้ Comfy Cloud

<Tabs>
  <Tab title="ภายในเครื่อง">
    **เหมาะสำหรับ:** เรียกใช้อินสแตนซ์ ComfyUI ของคุณเองบนเครื่องหรือ LAN

    <Steps>
      <Step title="เริ่ม ComfyUI ภายในเครื่อง">
        ตรวจสอบให้แน่ใจว่าอินสแตนซ์ ComfyUI ภายในเครื่องกำลังทำงานอยู่ (ค่าเริ่มต้นคือ `http://127.0.0.1:8188`)
      </Step>
      <Step title="เตรียม JSON เวิร์กโฟลว์">
        ส่งออกหรือสร้างไฟล์ JSON เวิร์กโฟลว์ของ ComfyUI จดรหัส Node ของ Node อินพุตพรอมต์และ Node ผลลัพธ์ที่คุณต้องการให้ OpenClaw อ่าน
      </Step>
      <Step title="กำหนดค่าผู้ให้บริการ">
        ตั้งค่า `mode: "local"` และระบุไฟล์เวิร์กโฟลว์ ตัวอย่างขั้นต่ำสำหรับรูปภาพ:

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
        กำหนดให้ OpenClaw ใช้โมเดล `comfy/workflow` สำหรับความสามารถที่คุณกำหนดค่าไว้:

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
    **เหมาะสำหรับ:** เรียกใช้เวิร์กโฟลว์บน Comfy Cloud โดยไม่ต้องจัดการทรัพยากร GPU ภายในเครื่อง

    <Steps>
      <Step title="รับคีย์ API">
        ลงทะเบียนที่ [comfy.org](https://comfy.org) และสร้างคีย์ API จากแดชบอร์ดบัญชีของคุณ
      </Step>
      <Step title="ตั้งค่าคีย์ API">
        ระบุคีย์ของคุณด้วยวิธีใดวิธีหนึ่งต่อไปนี้:

        ```bash
        # Onboarding flag
        openclaw onboard --comfy-api-key "your-key"

        # Environment variable (preferred for daemons)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="เตรียม JSON เวิร์กโฟลว์">
        ส่งออกหรือสร้างไฟล์ JSON เวิร์กโฟลว์ของ ComfyUI จดรหัส Node ของ Node อินพุตพรอมต์และ Node ผลลัพธ์
      </Step>
      <Step title="กำหนดค่าผู้ให้บริการ">
        ตั้งค่า `mode: "cloud"` และระบุไฟล์เวิร์กโฟลว์:

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
        โหมดคลาวด์กำหนดค่าเริ่มต้นของ `baseUrl` เป็น `https://cloud.comfy.org` ให้ตั้งค่า `baseUrl` เฉพาะเมื่อใช้ปลายทางคลาวด์แบบกำหนดเอง
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

Comfy รองรับการตั้งค่าการเชื่อมต่อระดับบนสุดที่ใช้ร่วมกัน พร้อมส่วนเวิร์กโฟลว์แยกตามความสามารถ (`image`, `video`, `music`):

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

| คีย์                   | ชนิด                    | คำอธิบาย                                                                                         |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| `mode`                | `"local"` หรือ `"cloud"` | โหมดการเชื่อมต่อ ค่าเริ่มต้นคือ `"local"`                                                         |
| `baseUrl`             | สตริง                   | ค่าเริ่มต้นคือ `http://127.0.0.1:8188` สำหรับภายในเครื่อง หรือ `https://cloud.comfy.org` สำหรับคลาวด์ |
| `apiKey`              | สตริง                   | คีย์แบบอินไลน์ที่เลือกใช้ได้ เป็นทางเลือกแทนตัวแปรสภาพแวดล้อม `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` |
| `allowPrivateNetwork` | บูลีน                   | อนุญาต `baseUrl` บนเครือข่ายส่วนตัว/LAN ในโหมดคลาวด์ หรือ FQDN แบบ DNS ส่วนตัวภายในเครื่อง              |

<Note>
ในโหมด `local` สามารถใช้ค่า IP แบบ local loopback/ส่วนตัวและชื่อบริการแบบป้ายกำกับเดียว เช่น `http://comfyui:8188` ได้โดยไม่ต้องใช้ `allowPrivateNetwork` ส่วน FQDN แบบ DNS ส่วนตัวที่ดูเหมือนเป็นสาธารณะ เช่น `https://comfy.local.example.com` ต้องใช้ `allowPrivateNetwork: true` ความเชื่อถือสำหรับต้นทางส่วนตัวยังคงจำกัดอยู่เฉพาะรูปแบบโปรโตคอล ชื่อโฮสต์ และพอร์ตที่กำหนดค่าไว้ การเปลี่ยนเส้นทางภายในเครื่องต้องไม่ออกจากชื่อโฮสต์ที่กำหนดค่าไว้ ขณะที่การเปลี่ยนเส้นทางบนคลาวด์ไปยัง CDN สาธารณะจะได้รับการตรวจสอบด้วยนโยบาย SSRF เริ่มต้น
</Note>

### คีย์แยกตามความสามารถ

คีย์เหล่านี้ใช้ภายในส่วน `image`, `video` หรือ `music`:

| คีย์                          | จำเป็น | ค่าเริ่มต้น | คำอธิบาย                                                                               |
| ---------------------------- | ------ | ---------- | -------------------------------------------------------------------------------------- |
| `workflow` หรือ `workflowPath` | ใช่    | --         | JSON เวิร์กโฟลว์แบบอินไลน์ หรือพาธไปยังไฟล์ JSON เวิร์กโฟลว์ของ ComfyUI                      |
| `promptNodeId`               | ใช่    | --         | รหัส Node ที่รับพรอมต์ข้อความ                                                             |
| `promptInputName`            | ไม่    | `"text"`   | ชื่ออินพุตบน Node พรอมต์                                                                 |
| `outputNodeId`               | ไม่    | --         | รหัส Node ที่ใช้อ่านผลลัพธ์ หากไม่ระบุ ระบบจะใช้ Node ผลลัพธ์ทั้งหมดที่ตรงกัน                         |
| `pollIntervalMs`             | ไม่    | `1500`     | ช่วงเวลาการตรวจสอบสถานะการเสร็จสิ้นของงาน หน่วยเป็นมิลลิวินาที                                  |
| `timeoutMs`                  | ไม่    | `300000`   | ระยะหมดเวลาสำหรับการเรียกใช้เวิร์กโฟลว์ หน่วยเป็นมิลลิวินาที                                      |

ส่วน `image` และ `video` ยังรองรับ Node อินพุตรูปภาพอ้างอิงด้วย:

| คีย์                   | จำเป็น                                 | ค่าเริ่มต้น | คำอธิบาย                                  |
| --------------------- | ------------------------------------- | ---------- | ----------------------------------------- |
| `inputImageNodeId`    | ใช่ (เมื่อส่งรูปภาพอ้างอิง)               | --         | รหัส Node ที่รับรูปภาพอ้างอิงที่อัปโหลด          |
| `inputImageInputName` | ไม่                                    | `"image"`  | ชื่ออินพุตบน Node รูปภาพ                     |

`apiKey` รับได้ทั้งสตริงตามตัวอักษรหรือออบเจ็กต์ [การอ้างอิงข้อมูลลับ](/th/gateway/configuration-reference#secrets)

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

    **ตัวอย่างการแก้ไขด้วยรูปภาพอ้างอิง:**

    หากต้องการเปิดใช้การแก้ไขรูปภาพด้วยรูปภาพอ้างอิงที่อัปโหลด ให้เพิ่ม `inputImageNodeId` ลงในการกำหนดค่ารูปภาพ:

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

    เวิร์กโฟลว์วิดีโอของ Comfy รองรับทั้งการสร้างวิดีโอจากข้อความและการสร้างวิดีโอจากรูปภาพผ่านกราฟที่กำหนดค่าไว้

    <Note>
    OpenClaw จะไม่ส่งวิดีโออินพุตเข้าไปในเวิร์กโฟลว์ของ Comfy รองรับเฉพาะพรอมต์ข้อความและรูปภาพอ้างอิงเพียงหนึ่งรูปเป็นอินพุตเท่านั้น
    </Note>

  </Accordion>

  <Accordion title="เวิร์กโฟลว์เพลง">
    Plugin ที่รวมมาให้จะลงทะเบียนผู้ให้บริการสร้างเพลงสำหรับผลลัพธ์เสียงหรือเพลงที่กำหนดด้วยเวิร์กโฟลว์ และเปิดให้ใช้งานผ่านเครื่องมือ `music_generate` ที่ใช้ร่วมกัน โดยรับรูปภาพอ้างอิงแบบเลือกได้ (สูงสุด 1 รูป):

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    ใช้ส่วนการกำหนดค่า `music` เพื่อระบุ JSON เวิร์กโฟลว์เสียงและ Node ผลลัพธ์

  </Accordion>

  <Accordion title="ความเข้ากันได้ย้อนหลัง">
    การกำหนดค่ารูปภาพระดับบนสุดที่มีอยู่เดิม (โดยไม่มีส่วน `image` แบบซ้อน) ยังคงใช้งานได้:

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

    OpenClaw จะถือว่าโครงสร้างแบบเดิมนั้นเป็นการกำหนดค่าเวิร์กโฟลว์รูปภาพ คุณไม่จำเป็นต้องย้ายข้อมูลทันที แต่แนะนำให้ใช้ส่วน `image` / `video` / `music` แบบซ้อนสำหรับการตั้งค่าใหม่ หากคุณใช้เฉพาะการสร้างรูปภาพ การกำหนดค่าแบบแบนเดิมและส่วน `image` แบบซ้อนใหม่จะมีความสามารถเทียบเท่ากัน

  </Accordion>

  <Accordion title="การทดสอบสด">
    มีการครอบคลุมด้วยการทดสอบสดแบบเลือกเข้าร่วมสำหรับ Plugin ที่รวมมาให้:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    การทดสอบแบบสดจะข้ามกรณีรูปภาพ วิดีโอ หรือเพลงแต่ละรายการ เว้นแต่จะกำหนดค่าส่วนเวิร์กโฟลว์ Comfy ที่ตรงกันไว้

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

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
  <Card title="ไดเรกทอรีผู้ให้บริการ" href="/th/providers/index" icon="layers">
    ภาพรวมของผู้ให้บริการและการอ้างอิงโมเดลทั้งหมด
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าฉบับเต็ม รวมถึงค่าเริ่มต้นของเอเจนต์
  </Card>
</CardGroup>
