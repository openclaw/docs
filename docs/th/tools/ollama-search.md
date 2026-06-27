---
read_when:
    - คุณต้องการใช้ Ollama สำหรับ web_search
    - คุณต้องการผู้ให้บริการ web_search ที่ไม่ต้องใช้คีย์
    - คุณต้องการใช้การค้นหาเว็บของ Ollama แบบโฮสต์ด้วย OLLAMA_API_KEY
    - คุณต้องมีคำแนะนำการตั้งค่า Ollama Web Search
summary: การค้นหาเว็บของ Ollama ผ่านโฮสต์ Ollama ภายในเครื่องหรือ Ollama API แบบโฮสต์
title: การค้นหาเว็บของ Ollama
x-i18n:
    generated_at: "2026-06-27T18:29:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw รองรับ **Ollama Web Search** เป็นผู้ให้บริการ `web_search` ที่รวมมาด้วย โดยใช้ API ค้นหาเว็บของ Ollama และส่งคืนผลลัพธ์แบบมีโครงสร้างพร้อมชื่อเรื่อง, URL และสรุปย่อ

สำหรับ Ollama แบบ local หรือโฮสต์เอง การตั้งค่านี้ไม่ต้องใช้ API key โดยค่าเริ่มต้น แต่ต้องมี:

- โฮสต์ Ollama ที่ OpenClaw เข้าถึงได้
- `ollama signin`

สำหรับการค้นหาแบบ hosted โดยตรง ให้ตั้งค่า base URL ของผู้ให้บริการ Ollama เป็น `https://ollama.com` และระบุ `OLLAMA_API_KEY` จริง

## การตั้งค่า

<Steps>
  <Step title="เริ่ม Ollama">
    ตรวจสอบให้แน่ใจว่าติดตั้ง Ollama แล้วและกำลังทำงานอยู่
  </Step>
  <Step title="ลงชื่อเข้าใช้">
    รัน:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="เลือก Ollama Web Search">
    รัน:

    ```bash
    openclaw configure --section web
    ```

    จากนั้นเลือก **Ollama Web Search** เป็นผู้ให้บริการ

  </Step>
</Steps>

หากคุณใช้ Ollama สำหรับโมเดลอยู่แล้ว Ollama Web Search จะใช้โฮสต์ที่กำหนดค่าไว้เดียวกันซ้ำ

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

การ override โฮสต์ Ollama แบบไม่บังคับ:

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

ผู้ให้บริการโมเดล Ollama ใช้ `baseUrl` เป็นคีย์มาตรฐาน ผู้ให้บริการค้นหาเว็บยังรองรับ `baseURL` บน `models.providers.ollama` เพื่อความเข้ากันได้กับตัวอย่างการกำหนดค่าสไตล์ OpenAI SDK ด้วย

หากไม่ได้ตั้งค่า base URL ของ Ollama อย่างชัดเจน OpenClaw จะใช้ `http://127.0.0.1:11434`

หากโฮสต์ Ollama ของคุณคาดหวัง bearer auth, OpenClaw จะใช้ `models.providers.ollama.apiKey` ซ้ำ (หรือ auth ของผู้ให้บริการที่สำรองด้วย env ที่ตรงกัน) สำหรับคำขอไปยังโฮสต์ที่กำหนดค่าไว้นั้น

Ollama Web Search แบบ hosted โดยตรง:

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

- ไม่จำเป็นต้องมีฟิลด์ API key เฉพาะสำหรับการค้นหาเว็บสำหรับผู้ให้บริการนี้
- หากโฮสต์ Ollama ถูกป้องกันด้วย auth, OpenClaw จะใช้ API key ของผู้ให้บริการ Ollama ตามปกติซ้ำเมื่อมีอยู่
- หาก `baseUrl` เป็น `https://ollama.com`, OpenClaw จะเรียก `https://ollama.com/api/web_search` โดยตรง และส่ง API key ของ Ollama ที่กำหนดค่าไว้เป็น bearer auth
- หากโฮสต์ที่กำหนดค่าไว้ไม่เปิดเผยการค้นหาเว็บและตั้งค่า `OLLAMA_API_KEY` ไว้ OpenClaw สามารถ fallback ไปที่ `https://ollama.com/api/web_search` ได้โดยไม่ส่งคีย์ env นั้นไปยังโฮสต์ local
- OpenClaw จะแจ้งเตือนระหว่างการตั้งค่าหากเข้าถึง Ollama ไม่ได้หรือยังไม่ได้ลงชื่อเข้าใช้ แต่จะไม่บล็อกการเลือก
- OpenClaw จะไม่เลือก Ollama Web Search โดยอัตโนมัติเมื่อไม่มีผู้ให้บริการที่มี credential และมีลำดับความสำคัญสูงกว่าถูกกำหนดค่าไว้ ให้เลือกอย่างชัดเจนด้วย `tools.web.search.provider: "ollama"`
- โฮสต์ daemon ของ Ollama แบบ local ใช้ endpoint พร็อกซี local
  `/api/experimental/web_search` ซึ่งลงชื่อและส่งต่อไปยัง Ollama Cloud
- โฮสต์ `https://ollama.com` ใช้ endpoint แบบ hosted สาธารณะ
  `/api/web_search` โดยตรงพร้อม auth แบบ bearer API-key

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Ollama](/th/providers/ollama) -- การตั้งค่าโมเดล Ollama และโหมด cloud/local
