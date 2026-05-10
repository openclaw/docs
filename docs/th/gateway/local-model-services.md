---
read_when:
    - คุณต้องการให้ OpenClaw เริ่มเซิร์ฟเวอร์โมเดลภายในเครื่องเฉพาะเมื่อมีการเลือกโมเดลของเซิร์ฟเวอร์นั้น
    - คุณรัน ds4, inferrs, vLLM, llama.cpp, MLX หรือเซิร์ฟเวอร์ภายในเครื่องอื่นที่เข้ากันได้กับ OpenAI
    - คุณจำเป็นต้องควบคุมการเริ่มต้นแบบเย็น ความพร้อมทำงาน และการปิดเมื่อไม่มีการใช้งานสำหรับผู้ให้บริการในเครื่อง
summary: เริ่มเซิร์ฟเวอร์โมเดลภายในเครื่องตามต้องการก่อนคำขอโมเดลของ OpenClaw
title: บริการโมเดลภายในเครื่อง
x-i18n:
    generated_at: "2026-05-10T19:39:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: b900146c5831c784b5da66666322ed0f5d3457ccd741556f418cd197749b87b1
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` ช่วยให้ OpenClaw เริ่มเซิร์ฟเวอร์โมเดลภายในที่ผู้ให้บริการเป็นเจ้าของได้ตามต้องการ นี่คือการกำหนดค่าระดับผู้ให้บริการ: เมื่อโมเดลที่เลือกเป็นของผู้ให้บริการนั้น OpenClaw จะตรวจสอบบริการ เริ่มกระบวนการหากปลายทางไม่ทำงาน รอจนพร้อม แล้วจึงส่งคำขอโมเดล

ใช้สำหรับเซิร์ฟเวอร์ภายในที่มีต้นทุนสูงหากต้องเปิดทำงานทั้งวัน หรือสำหรับการตั้งค่าด้วยตนเองที่การเลือกโมเดลควรเพียงพอสำหรับการเริ่มแบ็กเอนด์

## วิธีทำงาน

1. คำขอโมเดลถูกแปลงไปยังผู้ให้บริการที่กำหนดค่าไว้
2. หากผู้ให้บริการนั้นมี `localService` OpenClaw จะตรวจสอบ `healthUrl`
3. หากการตรวจสอบสำเร็จ OpenClaw จะใช้เซิร์ฟเวอร์ที่มีอยู่
4. หากการตรวจสอบล้มเหลว OpenClaw จะเริ่ม `command` พร้อม `args`
5. OpenClaw จะตรวจสอบความพร้อมซ้ำจนกว่า `readyTimeoutMs` จะหมดเวลา
6. คำขอโมเดลจะถูกส่งผ่านทรานสปอร์ตปกติของผู้ให้บริการ
7. หาก OpenClaw เริ่มกระบวนการและ `idleStopMs` เป็นค่าบวก กระบวนการจะถูก
   หยุดหลังจากคำขอที่กำลังทำงานล่าสุดไม่ได้ใช้งานนานถึงระยะเวลานั้น

OpenClaw ไม่ได้ติดตั้ง launchd, systemd, Docker หรือ daemon สำหรับสิ่งนี้
เซิร์ฟเวอร์เป็นกระบวนการลูกของกระบวนการ OpenClaw ที่ต้องใช้มันก่อน

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

## ฟิลด์

- `command`: พาธสัมบูรณ์ของไฟล์ปฏิบัติการ ไม่มีการใช้การค้นหาของเชลล์
- `args`: อาร์กิวเมนต์ของกระบวนการ ไม่มีการใช้การขยายของเชลล์ pipe, globbing หรือกฎการอ้างอิง
- `cwd`: ไดเรกทอรีทำงานแบบไม่บังคับสำหรับกระบวนการ
- `env`: ตัวแปรสภาพแวดล้อมแบบไม่บังคับที่รวมทับบนสภาพแวดล้อมของกระบวนการ OpenClaw
- `healthUrl`: URL ความพร้อม หากละไว้ OpenClaw จะต่อท้าย `/models` ไปยัง
  `baseUrl` ดังนั้น `http://127.0.0.1:8000/v1` จะกลายเป็น
  `http://127.0.0.1:8000/v1/models`
- `readyTimeoutMs`: กำหนดเวลาความพร้อมตอนเริ่มต้น ค่าเริ่มต้น: `120000`
- `idleStopMs`: เวลาหน่วงก่อนปิดเมื่อไม่ได้ใช้งานสำหรับกระบวนการที่ OpenClaw เริ่ม `0` หรือ
  การละไว้จะคงกระบวนการไว้จนกว่า OpenClaw จะออก

## ตัวอย่าง Inferrs

Inferrs เป็นแบ็กเอนด์ `/v1` แบบกำหนดเองที่เข้ากันได้กับ OpenAI ดังนั้น API บริการภายในเดียวกัน
จึงทำงานกับรายการผู้ให้บริการ `inferrs` ได้

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
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

แทนที่ `command` ด้วยผลลัพธ์ของ `which inferrs` บนเครื่องที่รัน
OpenClaw

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
          command: "/Users/you/Projects/oss/ds4/ds4-server",
          args: [
            "--model",
            "/Users/you/Projects/oss/ds4/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "393216",
          ],
          cwd: "/Users/you/Projects/oss/ds4",
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

## หมายเหตุด้านการปฏิบัติการ

- กระบวนการ OpenClaw หนึ่งรายการจัดการกระบวนการลูกที่ตนเริ่ม กระบวนการ OpenClaw อีกรายการ
  ที่เห็น URL สุขภาพเดียวกันทำงานอยู่แล้วจะนำกลับมาใช้โดยไม่รับเป็นเจ้าของ
- การเริ่มต้นจะถูกทำให้เป็นลำดับต่อชุดคำสั่งและอาร์กิวเมนต์ของผู้ให้บริการ ดังนั้นคำขอที่เกิดพร้อมกัน
  จะไม่สร้างเซิร์ฟเวอร์ซ้ำสำหรับการกำหนดค่าเดียวกัน
- การตอบกลับแบบสตรีมที่ทำงานอยู่จะถือ lease ไว้ การปิดเมื่อไม่ได้ใช้งานจะรอจนกว่าการจัดการ
  เนื้อหาของการตอบกลับจะเสร็จสมบูรณ์
- ใช้ `timeoutSeconds` กับผู้ให้บริการภายในที่ช้า เพื่อให้การเริ่มแบบเย็นและการสร้างผลลัพธ์ที่ยาว
  ไม่ชนกับเวลาหมดอายุเริ่มต้นของคำขอโมเดล
- ใช้ `healthUrl` แบบชัดเจนหากเซิร์ฟเวอร์ของคุณเปิดเผยความพร้อมไว้ที่อื่น
  นอกเหนือจาก `/v1/models`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="โมเดลภายใน" href="/th/gateway/local-models" icon="server">
    การตั้งค่าโมเดลภายใน ตัวเลือกผู้ให้บริการ และคำแนะนำด้านความปลอดภัย
  </Card>
  <Card title="Inferrs" href="/th/providers/inferrs" icon="cpu">
    รัน OpenClaw ผ่านเซิร์ฟเวอร์ภายในของ inferrs ที่เข้ากันได้กับ OpenAI
  </Card>
</CardGroup>
