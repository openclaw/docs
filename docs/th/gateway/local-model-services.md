---
read_when:
    - คุณต้องการให้ OpenClaw เริ่มเซิร์ฟเวอร์โมเดลภายในเครื่องเฉพาะเมื่อเลือกโมเดลของเซิร์ฟเวอร์นั้น
    - คุณใช้งาน ds4, inferrs, vLLM, llama.cpp, MLX หรือเซิร์ฟเวอร์ภายในเครื่องอื่นที่เข้ากันได้กับ OpenAI
    - คุณต้องควบคุมการเริ่มต้นแบบเย็น ความพร้อมใช้งาน และการปิดเมื่อไม่ได้ใช้งานสำหรับผู้ให้บริการภายในเครื่อง
summary: เริ่มเซิร์ฟเวอร์โมเดลในเครื่องตามต้องการก่อนคำขอโมเดลของ OpenClaw
title: บริการโมเดลในเครื่อง
x-i18n:
    generated_at: "2026-06-27T17:35:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 399648e32dd51faba7687a26de75ef349f1197269b5cca03d34552f0cd9cce28
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` ช่วยให้ OpenClaw เริ่มเซิร์ฟเวอร์โมเดลภายในเครื่องที่ผู้ให้บริการเป็นเจ้าของได้เมื่อต้องการ เป็นคอนฟิกระดับผู้ให้บริการ: เมื่อโมเดลที่เลือกเป็นของผู้ให้บริการนั้น OpenClaw จะตรวจสอบบริการ เริ่มโปรเซสหากปลายทางไม่ทำงาน รอจนพร้อม แล้วจึงส่งคำขอโมเดล

ใช้สำหรับเซิร์ฟเวอร์ภายในเครื่องที่มีค่าใช้จ่ายสูงหากเปิดทิ้งไว้ทั้งวัน หรือสำหรับการตั้งค่าแบบแมนนวลที่การเลือกโมเดลควรเพียงพอสำหรับการเปิดแบ็กเอนด์

## วิธีการทำงาน

1. คำขอโมเดลถูกจับคู่ไปยังผู้ให้บริการที่คอนฟิกไว้
2. หากผู้ให้บริการนั้นมี `localService` OpenClaw จะตรวจสอบ `healthUrl`
3. หากการตรวจสอบสำเร็จ OpenClaw จะใช้เซิร์ฟเวอร์ที่มีอยู่
4. หากการตรวจสอบล้มเหลว OpenClaw จะเริ่ม `command` พร้อม `args`
5. OpenClaw จะสำรวจความพร้อมจนกว่า `readyTimeoutMs` จะหมดเวลา
6. คำขอโมเดลจะถูกส่งผ่านทรานสปอร์ตของผู้ให้บริการตามปกติ
7. หาก OpenClaw เป็นผู้เริ่มโปรเซสและ `idleStopMs` เป็นค่าบวก โปรเซสจะถูกหยุดหลังจากคำขอที่กำลังดำเนินการล่าสุดว่างเป็นเวลานานเท่านั้น

OpenClaw ไม่ได้ติดตั้ง launchd, systemd, Docker หรือเดมอนสำหรับสิ่งนี้ เซิร์ฟเวอร์เป็นโปรเซสลูกของโปรเซส OpenClaw ที่ต้องใช้มันเป็นครั้งแรก

## รูปแบบคอนฟิก

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

- `command`: พาธไฟล์ปฏิบัติการแบบสัมบูรณ์ ไม่มีการใช้การค้นหาผ่านเชลล์
- `args`: อาร์กิวเมนต์ของโปรเซส ไม่มีการขยายค่าผ่านเชลล์ ไปป์ globbing หรือกฎการอ้างอิงด้วยเครื่องหมายคำพูด
- `cwd`: ไดเรกทอรีทำงานแบบไม่บังคับสำหรับโปรเซส
- `env`: ตัวแปรสภาพแวดล้อมแบบไม่บังคับที่ผสานทับสภาพแวดล้อมของโปรเซส OpenClaw
- `healthUrl`: URL สำหรับความพร้อม หากละไว้ OpenClaw จะเติม `/models` ต่อท้าย `baseUrl` ดังนั้น `http://127.0.0.1:8000/v1` จะกลายเป็น `http://127.0.0.1:8000/v1/models`
- `readyTimeoutMs`: กำหนดเวลาสิ้นสุดสำหรับความพร้อมตอนเริ่มต้น ค่าเริ่มต้น: `120000`
- `idleStopMs`: ระยะหน่วงการปิดเมื่อว่างสำหรับโปรเซสที่ OpenClaw เริ่ม `0` หรือการละไว้จะคงโปรเซสไว้จนกว่า OpenClaw จะออก

## ตัวอย่าง Inferrs

Inferrs เป็นแบ็กเอนด์ `/v1` แบบกำหนดเองที่เข้ากันได้กับ OpenAI ดังนั้น API ของบริการภายในเครื่องเดียวกันจึงทำงานกับรายการผู้ให้บริการ `inferrs` ได้

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

แทนที่ `command` ด้วยผลลัพธ์ของ `which inferrs` บนเครื่องที่รัน OpenClaw

## ตัวอย่าง ds4

สำหรับการตั้งค่าเต็มรูปแบบ คำแนะนำเกี่ยวกับขนาดคอนเท็กซ์ และคำสั่งตรวจสอบ โปรดดู [ds4](/th/providers/ds4)

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

## หมายเหตุด้านการปฏิบัติการ

- โปรเซส OpenClaw หนึ่งตัวจะจัดการโปรเซสลูกที่ตนเริ่ม โปรเซส OpenClaw อีกตัวที่เห็น URL ตรวจสอบสุขภาพเดียวกันทำงานอยู่แล้วจะนำกลับมาใช้โดยไม่รับช่วงจัดการ
- การเริ่มต้นจะถูกทำให้เป็นลำดับต่อชุดคำสั่งและอาร์กิวเมนต์ของผู้ให้บริการ ดังนั้นคำขอพร้อมกันจะไม่สร้างเซิร์ฟเวอร์ซ้ำสำหรับคอนฟิกเดียวกัน
- การตอบสนองแบบสตรีมที่ยังทำงานอยู่จะถือสิทธิ์การใช้งานชั่วคราว การปิดเมื่อว่างจะรอจนกว่าการจัดการเนื้อหาการตอบสนองจะเสร็จสมบูรณ์
- ใช้ `timeoutSeconds` กับผู้ให้บริการภายในเครื่องที่ช้า เพื่อให้การเริ่มแบบเย็นและการสร้างผลลัพธ์ที่ใช้เวลานานไม่ชนกับเวลาหมดอายุเริ่มต้นของคำขอโมเดล
- ใช้ `healthUrl` แบบชัดเจนหากเซิร์ฟเวอร์ของคุณเปิดเผยความพร้อมไว้ที่อื่นนอกเหนือจาก `/v1/models`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Local models" href="/th/gateway/local-models" icon="server">
    การตั้งค่าโมเดลภายในเครื่อง ตัวเลือกผู้ให้บริการ และคำแนะนำด้านความปลอดภัย
  </Card>
  <Card title="Inferrs" href="/th/providers/inferrs" icon="cpu">
    รัน OpenClaw ผ่านเซิร์ฟเวอร์ภายในเครื่องของ inferrs ที่เข้ากันได้กับ OpenAI
  </Card>
</CardGroup>
