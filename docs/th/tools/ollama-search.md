---
read_when:
    - คุณต้องการใช้ Ollama สำหรับ web_search
    - คุณต้องการผู้ให้บริการ web_search ที่ไม่ต้องใช้คีย์
    - คุณต้องการใช้การค้นหาเว็บ Ollama แบบโฮสต์ด้วย OLLAMA_API_KEY
    - คุณต้องการคำแนะนำในการตั้งค่าการค้นหาเว็บของ Ollama
summary: การค้นหาเว็บของ Ollama ผ่านโฮสต์ Ollama ภายในเครื่องหรือ Ollama API แบบโฮสต์
title: การค้นหาเว็บของ Ollama
x-i18n:
    generated_at: "2026-04-30T10:21:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: e626ee38b80fc66aa33589f030f9b420cf27848faed2183912ade17cb222771b
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw รองรับ **Ollama Web Search** ในฐานะผู้ให้บริการ `web_search` ที่รวมมาด้วย โดยใช้ API ค้นหาเว็บของ Ollama และส่งคืนผลลัพธ์แบบมีโครงสร้างพร้อมชื่อเรื่อง, URL และสรุปข้อความ

สำหรับ Ollama แบบ local หรือ self-hosted การตั้งค่านี้ไม่จำเป็นต้องใช้ API key โดยค่าเริ่มต้น แต่ต้องมี:

- โฮสต์ Ollama ที่ OpenClaw เข้าถึงได้
- `ollama signin`

สำหรับการค้นหาแบบโฮสต์โดยตรง ให้ตั้งค่า URL ฐานของผู้ให้บริการ Ollama เป็น `https://ollama.com` และระบุ `OLLAMA_API_KEY` จริง

## การตั้งค่า

<Steps>
  <Step title="เริ่ม Ollama">
    ตรวจสอบให้แน่ใจว่า Ollama ติดตั้งและกำลังทำงานอยู่
  </Step>
  <Step title="ลงชื่อเข้าใช้">
    เรียกใช้:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="เลือก Ollama Web Search">
    เรียกใช้:

    ```bash
    openclaw configure --section web
    ```

    จากนั้นเลือก **Ollama Web Search** เป็นผู้ให้บริการ

  </Step>
</Steps>

หากคุณใช้ Ollama สำหรับโมเดลอยู่แล้ว Ollama Web Search จะใช้โฮสต์เดียวกันที่กำหนดค่าไว้

## การกำหนดค่า

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

การแทนที่โฮสต์ Ollama แบบไม่บังคับ:

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

หากคุณกำหนดค่า Ollama เป็นผู้ให้บริการโมเดลอยู่แล้ว ผู้ให้บริการค้นหาเว็บสามารถใช้โฮสต์นั้นซ้ำได้แทน:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

ผู้ให้บริการโมเดล Ollama ใช้ `baseUrl` เป็นคีย์หลัก ผู้ให้บริการค้นหาเว็บยังรองรับ `baseURL` บน `models.providers.ollama` เพื่อความเข้ากันได้กับตัวอย่างการกำหนดค่าแบบ OpenAI SDK

หากไม่ได้ตั้งค่า URL ฐานของ Ollama ไว้อย่างชัดเจน OpenClaw จะใช้ `http://127.0.0.1:11434`

หากโฮสต์ Ollama ของคุณต้องการการยืนยันตัวตนแบบ bearer auth OpenClaw จะใช้ `models.providers.ollama.apiKey` ซ้ำ (หรือการยืนยันตัวตนผู้ให้บริการที่อิง env ซึ่งตรงกัน) สำหรับคำขอไปยังโฮสต์ที่กำหนดค่าไว้นั้น

Ollama Web Search แบบโฮสต์โดยตรง:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## หมายเหตุ

- ไม่จำเป็นต้องมีช่อง API key เฉพาะสำหรับการค้นหาเว็บสำหรับผู้ให้บริการนี้
- หากโฮสต์ Ollama ได้รับการป้องกันด้วยการยืนยันตัวตน OpenClaw จะใช้ API key ของผู้ให้บริการ Ollama ตามปกติซ้ำเมื่อมีอยู่
- หาก `baseUrl` เป็น `https://ollama.com` OpenClaw จะเรียก `https://ollama.com/api/web_search` โดยตรงและส่ง API key ของ Ollama ที่กำหนดค่าไว้ในรูปแบบ bearer auth
- หากโฮสต์ที่กำหนดค่าไว้ไม่เปิดให้ใช้การค้นหาเว็บและมีการตั้งค่า `OLLAMA_API_KEY` แล้ว OpenClaw สามารถ fallback ไปยัง `https://ollama.com/api/web_search` ได้โดยไม่ส่ง env key นั้นไปยังโฮสต์ local
- OpenClaw จะแจ้งเตือนระหว่างการตั้งค่าหากติดต่อ Ollama ไม่ได้หรือยังไม่ได้ลงชื่อเข้าใช้ แต่จะไม่บล็อกการเลือก
- การตรวจจับอัตโนมัติขณะรันสามารถ fallback ไปยัง Ollama Web Search เมื่อไม่ได้กำหนดค่าผู้ให้บริการที่มีข้อมูลรับรองซึ่งมีลำดับความสำคัญสูงกว่า
- โฮสต์ daemon ของ Ollama แบบ local ใช้ endpoint พร็อกซี local `/api/experimental/web_search` ซึ่งลงชื่อและส่งต่อไปยัง Ollama Cloud
- โฮสต์ `https://ollama.com` ใช้ endpoint แบบโฮสต์สาธารณะ `/api/web_search` โดยตรงพร้อมการยืนยันตัวตนด้วย API-key แบบ bearer

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Ollama](/th/providers/ollama) -- การตั้งค่าโมเดล Ollama และโหมด cloud/local
