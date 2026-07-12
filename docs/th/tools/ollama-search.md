---
read_when:
    - คุณต้องการใช้ Ollama สำหรับ web_search
    - คุณต้องการผู้ให้บริการ web_search ที่ไม่ต้องใช้คีย์
    - คุณต้องการใช้ Ollama Web Search แบบโฮสต์ด้วย OLLAMA_API_KEY
    - คุณต้องการคำแนะนำในการตั้งค่า Ollama Web Search
summary: การค้นหาเว็บของ Ollama ผ่านโฮสต์ Ollama ภายในเครื่องหรือ Ollama API แบบโฮสต์ไว้ให้บริการ
title: การค้นหาเว็บด้วย Ollama
x-i18n:
    generated_at: "2026-07-12T16:47:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw รองรับ **Ollama Web Search** ในฐานะผู้ให้บริการ `web_search` ที่มาพร้อมระบบ
โดยส่งคืนชื่อเรื่อง, URL และข้อความตัวอย่างจาก API ค้นหาเว็บของ Ollama

ตามค่าเริ่มต้น Ollama แบบภายในเครื่อง/โฮสต์เองไม่ต้องใช้คีย์ API แต่ต้องมี
โฮสต์ Ollama ที่เข้าถึงได้และเรียกใช้ `ollama signin` ส่วนการค้นหาผ่านบริการโฮสต์โดยตรง
(โดยไม่มี Ollama ภายในเครื่อง) ต้องใช้ `baseUrl: "https://ollama.com"` และ
`OLLAMA_API_KEY` ที่ใช้งานได้จริง

## การตั้งค่า

<Steps>
  <Step title="เริ่ม Ollama">
    ตรวจสอบให้แน่ใจว่าได้ติดตั้ง Ollama และกำลังทำงานอยู่
  </Step>
  <Step title="ลงชื่อเข้าใช้">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="เลือก Ollama Web Search">
    ```bash
    openclaw configure --section web
    ```

    เลือก **Ollama Web Search** เป็นผู้ให้บริการ

  </Step>
</Steps>

หากคุณใช้ Ollama สำหรับโมเดลอยู่แล้ว Ollama Web Search จะใช้โฮสต์เดียวกัน
ที่กำหนดค่าไว้

<Note>
  OpenClaw จะไม่เลือก Ollama Web Search โดยอัตโนมัติแทนผู้ให้บริการที่ใช้
  ข้อมูลประจำตัวและมีลำดับความสำคัญสูงกว่า คุณต้องเลือกอย่างชัดเจนด้วย
  `tools.web.search.provider: "ollama"`
</Note>

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

การกำหนดโฮสต์ทับแบบไม่บังคับ ซึ่งมีผลเฉพาะกับการค้นหาเว็บ:

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

หรือใช้โฮสต์ที่กำหนดค่าไว้แล้วสำหรับผู้ให้บริการโมเดล Ollama:

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

`models.providers.ollama.baseUrl` เป็นคีย์มาตรฐาน ผู้ให้บริการค้นหาเว็บ
ยังยอมรับ `baseURL` ในตำแหน่งดังกล่าวเพื่อให้เข้ากันได้กับตัวอย่างการกำหนดค่า
แบบ OpenAI SDK หากไม่ได้ตั้งค่าใดไว้ OpenClaw จะใช้ค่าเริ่มต้นเป็น
`http://127.0.0.1:11434`

Ollama Web Search ผ่านบริการโฮสต์โดยตรง (โดยไม่มี Ollama ภายในเครื่อง):

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

## การยืนยันตัวตนและการกำหนดเส้นทางคำขอ

- ไม่มีฟิลด์คีย์ API สำหรับการค้นหาเว็บโดยเฉพาะ ผู้ให้บริการจะใช้
  `models.providers.ollama.apiKey` (หรือการยืนยันตัวตนของผู้ให้บริการที่ตรงกัน
  ซึ่งอ้างอิงจากตัวแปรสภาพแวดล้อม) เมื่อโฮสต์ที่กำหนดค่ามีการป้องกันด้วยการยืนยันตัวตน
- ลำดับการหาโฮสต์: `plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl` (หรือ `baseURL`) → `http://127.0.0.1:11434`
- หากโฮสต์ที่ได้คือ `https://ollama.com` OpenClaw จะเรียก
  `https://ollama.com/api/web_search` โดยตรง โดยใช้คีย์ API สำหรับการยืนยันตัวตน
  แบบ bearer
- มิฉะนั้น OpenClaw จะเรียกปลายทางพร็อกซีภายในเครื่อง
  `/api/experimental/web_search` ก่อน (ซึ่งจะลงนามและส่งต่อไปยัง Ollama
  Cloud) จากนั้นจึงใช้ `/api/web_search` บนโฮสต์เดียวกันเป็นทางเลือกสำรอง หากทั้งสองรายการ
  ล้มเหลวและมีการตั้งค่า `OLLAMA_API_KEY` ระบบจะลองอีกครั้งหนึ่งกับ
  `https://ollama.com/api/web_search` โดยใช้คีย์ดังกล่าว โดยจะไม่ส่งคีย์ไปยัง
  โฮสต์ภายในเครื่อง
- OpenClaw จะแสดงคำเตือนระหว่างการตั้งค่าหากเข้าถึง Ollama ไม่ได้หรือยังไม่ได้
  ลงชื่อเข้าใช้ แต่จะไม่ขัดขวางการเลือกผู้ให้บริการ

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจหาอัตโนมัติ
- [Ollama](/th/providers/ollama) -- การตั้งค่าโมเดล Ollama และโหมดคลาวด์/ภายในเครื่อง
