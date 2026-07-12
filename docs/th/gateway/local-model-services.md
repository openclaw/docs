---
read_when:
    - คุณต้องการให้ OpenClaw เริ่มเซิร์ฟเวอร์โมเดลภายในเครื่องเฉพาะเมื่อมีการเลือกผู้ให้บริการโมเดลหรือการฝังเวกเตอร์ของเซิร์ฟเวอร์นั้นเท่านั้น
    - คุณใช้งาน ds4, inferrs, vLLM, llama.cpp, MLX หรือเซิร์ฟเวอร์ภายในเครื่องอื่นที่รองรับ OpenAI ได้อย่างเข้ากันได้
    - คุณต้องควบคุมการเริ่มต้นจากสถานะหยุดนิ่ง ความพร้อมใช้งาน และการปิดระบบเมื่อไม่มีการใช้งานสำหรับผู้ให้บริการภายในเครื่อง
summary: เริ่มเซิร์ฟเวอร์โมเดลภายในเครื่องตามต้องการก่อนส่งคำขอโมเดลและการฝังเวกเตอร์ของ OpenClaw
title: บริการโมเดลภายในเครื่อง
x-i18n:
    generated_at: "2026-07-12T16:10:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` เริ่มเซิร์ฟเวอร์โมเดลภายในเครื่องที่ผู้ให้บริการเป็นเจ้าของเมื่อมีการร้องขอ เมื่อคำขอโมเดลหรือ embedding เลือกผู้ให้บริการนั้น OpenClaw จะตรวจสอบ endpoint สุขภาพ เริ่มโปรเซสหากเซิร์ฟเวอร์ไม่ทำงาน รอจนพร้อม แล้วจึงส่งคำขอ ใช้ตัวเลือกนี้เพื่อหลีกเลี่ยงการเปิดเซิร์ฟเวอร์ภายในเครื่องที่ใช้ทรัพยากรสูงไว้ตลอดทั้งวัน

## วิธีการทำงาน

1. คำขอโมเดลหรือ embedding จะถูกจับคู่กับผู้ให้บริการที่กำหนดค่าไว้
2. หากผู้ให้บริการนั้นมี `localService` OpenClaw จะตรวจสอบ `healthUrl`
3. หากตรวจสอบสำเร็จ OpenClaw จะใช้เซิร์ฟเวอร์ที่กำลังทำงานอยู่
4. หากตรวจสอบไม่สำเร็จ OpenClaw จะสร้างโปรเซส `command` พร้อม `args`
5. OpenClaw จะตรวจสอบ endpoint สุขภาพเป็นระยะจนกว่า `readyTimeoutMs` จะหมดเวลา
6. คำขอจะส่งผ่านช่องทางรับส่งโมเดลหรือ embedding ตามปกติ
7. หาก OpenClaw เป็นผู้เริ่มโปรเซสและมีการตั้งค่า `idleStopMs` ระบบจะหยุดโปรเซสหลังจากคำขอที่กำลังดำเนินการรายการสุดท้ายไม่มีการใช้งานครบตามระยะเวลานั้น

OpenClaw จะไม่ติดตั้ง launchd, systemd, Docker หรือ daemon ใดๆ สำหรับการทำงานนี้ เซิร์ฟเวอร์เป็นเพียงโปรเซสลูกของโปรเซส OpenClaw ที่ต้องใช้งานเซิร์ฟเวอร์นี้เป็นครั้งแรก

การเริ่มทำงานจะดำเนินการทีละรายการสำหรับผู้ให้บริการและชุดคำสั่ง/อาร์กิวเมนต์/ตัวแปรสภาพแวดล้อมที่กำหนดค่าไว้ ดังนั้นคำขอแชตและ embedding ที่เกิดขึ้นพร้อมกันสำหรับบริการเดียวกันจะไม่สร้างเซิร์ฟเวอร์ซ้ำ แต่ละคำขอจะถือสิทธิ์การใช้งานของตนเองไว้จนกว่าการประมวลผลการตอบกลับจะเสร็จสิ้น ดังนั้นการปิดเมื่อไม่มีการใช้งานจะรอคำขอโมเดลและ embedding ที่กำลังดำเนินการทั้งหมด นามแฝงของผู้ให้บริการที่กำหนดค่าไว้ยังคงแยกจากกัน โดยนามแฝงสองรายการสามารถชี้ไปยังโฮสต์ GPU คนละเครื่องได้โดยไม่ถูกรวมเข้ากับรหัสอะแดปเตอร์ Ollama, LM Studio หรืออะแดปเตอร์ที่เข้ากันได้กับ OpenAI เดียวกัน

หากโปรเซส OpenClaw อื่นมีเซิร์ฟเวอร์ที่พร้อมใช้งานอยู่แล้วที่ `healthUrl` เดียวกัน โปรเซสนี้จะนำเซิร์ฟเวอร์นั้นมาใช้ซ้ำโดยไม่รับช่วงการจัดการ (แต่ละโปรเซสจะจัดการเฉพาะโปรเซสลูกที่ตนเริ่มเองเท่านั้น) บันทึกการเริ่มและสิ้นสุดการทำงานจะมีส่วนท้ายของเอาต์พุตโปรเซสลูกที่จำกัดขนาดและปกปิดข้อมูล พร้อมรายละเอียดเวลาและการสิ้นสุดการทำงาน โดยจะไม่แสดงค่าตัวแปรสภาพแวดล้อมที่กำหนดค่าไว้

## รูปแบบการกำหนดค่า

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

ตั้งค่า `timeoutSeconds` ในรายการผู้ให้บริการ (ไม่ใช่ใน `localService`) เพื่อไม่ให้การเริ่มทำงานครั้งแรกที่ช้าและการสร้างผลลัพธ์ที่ใช้เวลานานถึงขีดจำกัดเวลาเริ่มต้นของคำขอโมเดล ตั้งค่า `healthUrl` อย่างชัดเจนทุกครั้งที่เซิร์ฟเวอร์ของคุณเปิดเผยสถานะความพร้อมในตำแหน่งอื่นนอกเหนือจาก `/models` บน URL ฐาน

## ฟิลด์

| ฟิลด์            | จำเป็น | คำอธิบาย                                                                                                                          |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `command`        | ใช่      | พาธแบบสัมบูรณ์ของไฟล์ที่เรียกใช้งานได้ ไม่มีการค้นหาผ่าน PATH ของเชลล์                                                                                      |
| `args`           | ไม่       | อาร์กิวเมนต์ของโปรเซส ไม่มีการขยายค่าของเชลล์ ไปป์ การจับคู่รูปแบบไฟล์ หรือการตีความเครื่องหมายคำพูด                                                                  |
| `cwd`            | ไม่       | ไดเรกทอรีทำงานสำหรับโปรเซส                                                                                                   |
| `env`            | ไม่       | ตัวแปรสภาพแวดล้อมที่จะผสานทับสภาพแวดล้อมของโปรเซส OpenClaw                                                                  |
| `healthUrl`      | ไม่       | URL สำหรับตรวจสอบความพร้อม ค่าเริ่มต้นคือ `baseUrl` ที่ต่อท้ายด้วย `/models` (`http://127.0.0.1:8000/v1` จะกลายเป็น `http://127.0.0.1:8000/v1/models`) |
| `readyTimeoutMs` | ไม่       | กำหนดเวลาสูงสุดสำหรับความพร้อมระหว่างการเริ่มทำงาน ค่าเริ่มต้น: `120000`                                                                                       |
| `idleStopMs`     | ไม่       | ระยะหน่วงก่อนปิดโปรเซสที่ OpenClaw เริ่มไว้เมื่อไม่มีการใช้งาน ค่า `0` หรือการไม่ระบุจะทำให้โปรเซสทำงานต่อไปจนกว่า OpenClaw จะสิ้นสุดการทำงาน                             |

## ตัวอย่าง Inferrs

Inferrs เป็นแบ็กเอนด์ `/v1` แบบกำหนดเองที่เข้ากันได้กับ OpenAI ดังนั้น API `localService` เดียวกันจึงทำงานร่วมกับรายการผู้ให้บริการ `inferrs` ได้:

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

แทนที่ `command` ด้วยผลลัพธ์ของ `which inferrs` บนเครื่องที่ใช้งาน OpenClaw การตั้งค่า inferrs ฉบับเต็ม: [Inferrs](/th/providers/inferrs)

## ตัวอย่าง ds4

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

คำสั่งสำหรับการตั้งค่าฉบับเต็ม การกำหนดขนาดบริบท และการตรวจสอบ: [ds4](/th/providers/ds4)

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="โมเดลภายในเครื่อง" href="/th/gateway/local-models" icon="server">
    การตั้งค่าโมเดลภายในเครื่อง ตัวเลือกผู้ให้บริการ และแนวทางด้านความปลอดภัย
  </Card>
  <Card title="Inferrs" href="/th/providers/inferrs" icon="cpu">
    เรียกใช้ OpenClaw ผ่านเซิร์ฟเวอร์ภายในเครื่องของ inferrs ที่เข้ากันได้กับ OpenAI
  </Card>
</CardGroup>
