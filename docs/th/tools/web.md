---
read_when:
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า web_search
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า x_search
    - คุณต้องเลือกผู้ให้บริการค้นหา
    - คุณต้องการทำความเข้าใจการตรวจจับอัตโนมัติและกลไกสำรองของผู้ให้บริการ
sidebarTitle: Web Search
summary: web_search, x_search และ web_fetch -- ค้นหาเว็บ ค้นหาโพสต์ X หรือดึงเนื้อหาหน้าเว็บ
title: ค้นหาเว็บ
x-i18n:
    generated_at: "2026-04-30T10:23:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9f8233a33f0729c6413eda59c4ebc3338a1e398e8280eb12650197225ef8981e
    source_path: tools/web.md
    workflow: 16
---

เครื่องมือ `web_search` ค้นหาเว็บโดยใช้ผู้ให้บริการที่คุณกำหนดค่าไว้ และ
ส่งคืนผลลัพธ์ ผลลัพธ์จะถูกแคชตามคิวรีเป็นเวลา 15 นาที (กำหนดค่าได้)

OpenClaw ยังมี `x_search` สำหรับโพสต์ X (เดิมคือ Twitter) และ
`web_fetch` สำหรับการดึง URL แบบเบา ในระยะนี้ `web_fetch` จะยังทำงาน
ภายในเครื่อง ขณะที่ `web_search` และ `x_search` สามารถใช้ xAI Responses
เบื้องหลังได้

<Info>
  `web_search` เป็นเครื่องมือ HTTP แบบเบา ไม่ใช่ระบบอัตโนมัติของเบราว์เซอร์ สำหรับ
  ไซต์ที่ใช้ JS หนักหรือการเข้าสู่ระบบ ให้ใช้ [เว็บเบราว์เซอร์](/th/tools/browser) สำหรับ
  การดึง URL เฉพาะ ให้ใช้ [Web Fetch](/th/tools/web-fetch)
</Info>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เลือกผู้ให้บริการ">
    เลือกผู้ให้บริการและดำเนินการตั้งค่าที่จำเป็นให้เสร็จสมบูรณ์ ผู้ให้บริการบางราย
    ไม่ต้องใช้คีย์ ขณะที่บางรายใช้ API keys ดูรายละเอียดได้ที่หน้าผู้ให้บริการด้านล่าง
  </Step>
  <Step title="กำหนดค่า">
    ```bash
    openclaw configure --section web
    ```
    คำสั่งนี้จะจัดเก็บผู้ให้บริการและข้อมูลรับรองที่จำเป็น คุณยังสามารถตั้งค่า env
    var (เช่น `BRAVE_API_KEY`) และข้ามขั้นตอนนี้สำหรับผู้ให้บริการที่ใช้ API
    ได้
  </Step>
  <Step title="ใช้งาน">
    ตอนนี้เอเจนต์สามารถเรียก `web_search` ได้แล้ว:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    สำหรับโพสต์ X ให้ใช้:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## การเลือกผู้ให้บริการ

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/th/tools/brave-search">
    ผลลัพธ์แบบมีโครงสร้างพร้อมส่วนย่อย รองรับโหมด `llm-context` และตัวกรองประเทศ/ภาษา มีระดับใช้งานฟรี
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/th/tools/duckduckgo-search">
    ตัวสำรองที่ไม่ต้องใช้คีย์ ไม่ต้องใช้ API key การผสานรวมแบบไม่เป็นทางการที่อิง HTML
  </Card>
  <Card title="Exa" icon="brain" href="/th/tools/exa-search">
    การค้นหาแบบนิวรัล + คีย์เวิร์ด พร้อมการดึงเนื้อหา (ไฮไลต์ ข้อความ สรุป)
  </Card>
  <Card title="Firecrawl" icon="flame" href="/th/tools/firecrawl">
    ผลลัพธ์แบบมีโครงสร้าง เหมาะที่สุดเมื่อใช้คู่กับ `firecrawl_search` และ `firecrawl_scrape` สำหรับการดึงข้อมูลเชิงลึก
  </Card>
  <Card title="Gemini" icon="sparkles" href="/th/tools/gemini-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่าน Google Search grounding
  </Card>
  <Card title="Grok" icon="zap" href="/th/tools/grok-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่าน xAI web grounding
  </Card>
  <Card title="Kimi" icon="moon" href="/th/tools/kimi-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่านการค้นหาเว็บของ Moonshot
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/th/tools/minimax-search">
    ผลลัพธ์แบบมีโครงสร้างผ่าน API ค้นหา MiniMax Coding Plan
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/th/tools/ollama-search">
    ค้นหาผ่านโฮสต์ Ollama ในเครื่องที่เข้าสู่ระบบไว้ หรือผ่าน Ollama API ที่โฮสต์ไว้
  </Card>
  <Card title="Perplexity" icon="search" href="/th/tools/perplexity-search">
    ผลลัพธ์แบบมีโครงสร้างพร้อมตัวควบคุมการดึงเนื้อหาและการกรองโดเมน
  </Card>
  <Card title="SearXNG" icon="server" href="/th/tools/searxng-search">
    เมตาเสิร์ชแบบโฮสต์เอง ไม่ต้องใช้ API key รวมผลจาก Google, Bing, DuckDuckGo และอื่นๆ
  </Card>
  <Card title="Tavily" icon="globe" href="/th/tools/tavily">
    ผลลัพธ์แบบมีโครงสร้างพร้อมระดับความลึกการค้นหา การกรองหัวข้อ และ `tavily_extract` สำหรับการดึง URL
  </Card>
</CardGroup>

### การเปรียบเทียบผู้ให้บริการ

| ผู้ให้บริการ                                  | รูปแบบผลลัพธ์               | ตัวกรอง                                          | API key                                                                                 |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/th/tools/brave-search)              | ส่วนย่อยแบบมีโครงสร้าง        | ประเทศ ภาษา เวลา โหมด `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/th/tools/duckduckgo-search)    | ส่วนย่อยแบบมีโครงสร้าง        | --                                               | ไม่มี (ไม่ต้องใช้คีย์)                                                                         |
| [Exa](/th/tools/exa-search)                  | แบบมีโครงสร้าง + ดึงข้อมูลแล้ว     | โหมดนิวรัล/คีย์เวิร์ด วันที่ การดึงเนื้อหา    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/th/tools/firecrawl)             | ส่วนย่อยแบบมีโครงสร้าง        | ผ่านเครื่องมือ `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/th/tools/gemini-search)            | AI สังเคราะห์ + การอ้างอิง | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/th/tools/grok-search)                | AI สังเคราะห์ + การอ้างอิง | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/th/tools/kimi-search)                | AI สังเคราะห์ + การอ้างอิง | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/th/tools/minimax-search)   | ส่วนย่อยแบบมีโครงสร้าง        | ภูมิภาค (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                      |
| [Ollama Web Search](/th/tools/ollama-search) | ส่วนย่อยแบบมีโครงสร้าง        | --                                               | ไม่มีสำหรับโฮสต์ในเครื่องที่เข้าสู่ระบบไว้; `OLLAMA_API_KEY` สำหรับการค้นหา `https://ollama.com` โดยตรง |
| [Perplexity](/th/tools/perplexity-search)    | ส่วนย่อยแบบมีโครงสร้าง        | ประเทศ ภาษา เวลา โดเมน ขีดจำกัดเนื้อหา | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/th/tools/searxng-search)          | ส่วนย่อยแบบมีโครงสร้าง        | หมวดหมู่ ภาษา                             | ไม่มี (โฮสต์เอง)                                                                      |
| [Tavily](/th/tools/tavily)                   | ส่วนย่อยแบบมีโครงสร้าง        | ผ่านเครื่องมือ `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## การตรวจจับอัตโนมัติ

## การค้นหาเว็บ OpenAI แบบเนทีฟ

โมเดล OpenAI Responses โดยตรงจะใช้เครื่องมือ `web_search` ที่ OpenAI โฮสต์ไว้โดยอัตโนมัติเมื่อเปิดใช้การค้นหาเว็บของ OpenClaw และไม่ได้ตรึงผู้ให้บริการที่จัดการไว้ นี่เป็นพฤติกรรมที่ผู้ให้บริการเป็นเจ้าของใน Plugin OpenAI ที่รวมมาให้ และมีผลเฉพาะกับทราฟฟิก OpenAI API แบบเนทีฟเท่านั้น ไม่ใช่ URL ฐานของพร็อกซีที่เข้ากันได้กับ OpenAI หรือเส้นทาง Azure ตั้งค่า `tools.web.search.provider` เป็นผู้ให้บริการรายอื่น เช่น `brave` เพื่อคงเครื่องมือ `web_search` ที่จัดการไว้สำหรับโมเดล OpenAI หรือ set `tools.web.search.enabled: false` เพื่อปิดใช้ทั้งการค้นหาที่จัดการไว้และการค้นหา OpenAI แบบเนทีฟ

## การค้นหาเว็บ Codex แบบเนทีฟ

โมเดลที่รองรับ Codex สามารถเลือกใช้เครื่องมือ Responses `web_search` แบบเนทีฟของผู้ให้บริการแทนฟังก์ชัน `web_search` ที่ OpenClaw จัดการได้

- กำหนดค่าไว้ใต้ `tools.web.search.openaiCodex`
- จะเปิดใช้งานเฉพาะกับโมเดลที่รองรับ Codex (`openai-codex/*` หรือผู้ให้บริการที่ใช้ `api: "openai-codex-responses"`)
- `web_search` ที่จัดการไว้ยังคงใช้กับโมเดลที่ไม่ใช่ Codex
- `mode: "cached"` เป็นค่าเริ่มต้นและเป็นการตั้งค่าที่แนะนำ
- `tools.web.search.enabled: false` จะปิดใช้ทั้งการค้นหาที่จัดการไว้และการค้นหาแบบเนทีฟ

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

หากเปิดใช้การค้นหา Codex แบบเนทีฟ แต่โมเดลปัจจุบันไม่รองรับ Codex, OpenClaw จะคงพฤติกรรม `web_search` ที่จัดการไว้ตามปกติ

## การตั้งค่าการค้นหาเว็บ

รายการผู้ให้บริการในเอกสารและโฟลว์การตั้งค่าจัดเรียงตามตัวอักษร การตรวจจับอัตโนมัติจะมี
ลำดับความสำคัญแยกต่างหาก

หากไม่ได้ตั้งค่า `provider`, OpenClaw จะตรวจสอบผู้ให้บริการตามลำดับนี้และใช้
รายแรกที่พร้อมใช้งาน:

ผู้ให้บริการที่ใช้ API ก่อน:

1. **Brave** -- `BRAVE_API_KEY` หรือ `plugins.entries.brave.config.webSearch.apiKey` (ลำดับ 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` หรือ `plugins.entries.minimax.config.webSearch.apiKey` (ลำดับ 15)
3. **Gemini** -- `GEMINI_API_KEY` หรือ `plugins.entries.google.config.webSearch.apiKey` (ลำดับ 20)
4. **Grok** -- `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey` (ลำดับ 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` หรือ `plugins.entries.moonshot.config.webSearch.apiKey` (ลำดับ 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` หรือ `plugins.entries.perplexity.config.webSearch.apiKey` (ลำดับ 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webSearch.apiKey` (ลำดับ 60)
8. **Exa** -- `EXA_API_KEY` หรือ `plugins.entries.exa.config.webSearch.apiKey` (ลำดับ 65)
9. **Tavily** -- `TAVILY_API_KEY` หรือ `plugins.entries.tavily.config.webSearch.apiKey` (ลำดับ 70)

ตัวสำรองที่ไม่ต้องใช้คีย์หลังจากนั้น:

10. **DuckDuckGo** -- ตัวสำรอง HTML ที่ไม่ต้องใช้คีย์ โดยไม่ต้องมีบัญชีหรือ API key (ลำดับ 100)
11. **Ollama Web Search** -- ตัวสำรองที่ไม่ต้องใช้คีย์ผ่านโฮสต์ Ollama ในเครื่องที่คุณกำหนดค่าไว้เมื่อเข้าถึงได้และเข้าสู่ระบบด้วย `ollama signin`; สามารถใช้ bearer auth ของผู้ให้บริการ Ollama ซ้ำได้เมื่อโฮสต์ต้องการ และสามารถเรียกการค้นหา `https://ollama.com` โดยตรงเมื่อกำหนดค่าด้วย `OLLAMA_API_KEY` (ลำดับ 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl` (ลำดับ 200)

หากตรวจไม่พบผู้ให้บริการ ระบบจะถอยกลับไปใช้ Brave (คุณจะได้รับข้อผิดพลาด
คีย์หายไปที่แจ้งให้คุณกำหนดค่า)

<Note>
  ฟิลด์คีย์ของผู้ให้บริการทั้งหมดรองรับออบเจ็กต์ SecretRef SecretRefs
  ที่อยู่ในขอบเขต Plugin ภายใต้ `plugins.entries.<plugin>.config.webSearch.apiKey` จะถูก resolve สำหรับ
  ผู้ให้บริการค้นหาเว็บที่ใช้ API และรวมมาให้ ซึ่งรวมถึง Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity และ Tavily
  ไม่ว่าจะเลือกผู้ให้บริการโดยตรงผ่าน `tools.web.search.provider` หรือ
  เลือกผ่านการตรวจจับอัตโนมัติ ในโหมดตรวจจับอัตโนมัติ OpenClaw จะ resolve เฉพาะ
  คีย์ของผู้ให้บริการที่เลือก -- SecretRefs ที่ไม่ได้เลือกจะยังไม่ทำงาน เพื่อให้คุณ
  กำหนดค่าผู้ให้บริการหลายรายไว้ได้โดยไม่ต้องเสียต้นทุนการ resolve สำหรับ
  รายที่คุณไม่ได้ใช้
</Note>

## การกำหนดค่า

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

การกำหนดค่าเฉพาะผู้ให้บริการ (API keys, URL ฐาน, โหมด) อยู่ภายใต้
`plugins.entries.<plugin>.config.webSearch.*` ดูตัวอย่างได้ที่หน้าผู้ให้บริการ

การเลือกผู้ให้บริการสำรองของ `web_fetch` แยกต่างหาก:

- เลือกด้วย `tools.web.fetch.provider`
- หรือเว้นฟิลด์นั้นไว้ แล้วให้ OpenClaw ตรวจจับผู้ให้บริการ web-fetch
  รายแรกที่พร้อมใช้งานจากข้อมูลรับรองที่มีโดยอัตโนมัติ
- ปัจจุบันผู้ให้บริการ web-fetch ที่รวมมาให้คือ Firecrawl ซึ่งกำหนดค่าไว้ภายใต้
  `plugins.entries.firecrawl.config.webFetch.*`

เมื่อคุณเลือก **Kimi** ระหว่าง `openclaw onboard` หรือ
`openclaw configure --section web`, OpenClaw ยังสามารถถามถึง:

- ภูมิภาค Moonshot API (`https://api.moonshot.ai/v1` หรือ `https://api.moonshot.cn/v1`)
- โมเดลการค้นหาเว็บ Kimi เริ่มต้น (ค่าเริ่มต้นคือ `kimi-k2.6`)

สำหรับ `x_search` ให้กำหนดค่า `plugins.entries.xai.config.xSearch.*` โดยใช้การสำรองค่า `XAI_API_KEY` เดียวกับการค้นหาเว็บของ Grok
ค่า config เดิม `tools.web.x_search.*` จะถูกย้ายโดยอัตโนมัติด้วย `openclaw doctor --fix`
เมื่อคุณเลือก Grok ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web`
OpenClaw ยังสามารถเสนอการตั้งค่า `x_search` เพิ่มเติมโดยใช้คีย์เดียวกันได้ด้วย
นี่เป็นขั้นตอนติดตามผลแยกต่างหากภายในเส้นทางของ Grok ไม่ใช่ตัวเลือกผู้ให้บริการ
ค้นหาเว็บระดับบนสุดที่แยกออกมา หากคุณเลือกผู้ให้บริการรายอื่น OpenClaw จะไม่
แสดงพรอมต์ `x_search`

### การจัดเก็บ API keys

<Tabs>
  <Tab title="Config file">
    เรียกใช้ `openclaw configure --section web` หรือตั้งค่าคีย์โดยตรง:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Environment variable">
    ตั้งค่าตัวแปร env ของผู้ให้บริการในสภาพแวดล้อมของกระบวนการ Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    สำหรับการติดตั้ง gateway ให้ใส่ไว้ใน `~/.openclaw/.env`
    ดู [ตัวแปร env](/th/help/faq#env-vars-and-env-loading)

  </Tab>
</Tabs>

## พารามิเตอร์ของเครื่องมือ

| พารามิเตอร์             | คำอธิบาย                                           |
| --------------------- | ----------------------------------------------------- |
| `query`               | คำค้นหา (จำเป็น)                               |
| `count`               | จำนวนผลลัพธ์ที่จะส่งคืน (1-10, ค่าเริ่มต้น: 5)                  |
| `country`             | รหัสประเทศ ISO 2 ตัวอักษร (เช่น "US", "DE")           |
| `language`            | รหัสภาษา ISO 639-1 (เช่น "en", "de")             |
| `search_lang`         | รหัสภาษาสำหรับการค้นหา (เฉพาะ Brave)                     |
| `freshness`           | ตัวกรองเวลา: `day`, `week`, `month` หรือ `year`        |
| `date_after`          | ผลลัพธ์หลังวันที่นี้ (YYYY-MM-DD)                  |
| `date_before`         | ผลลัพธ์ก่อนวันที่นี้ (YYYY-MM-DD)                 |
| `ui_lang`             | รหัสภาษา UI (เฉพาะ Brave)                         |
| `domain_filter`       | อาร์เรย์ allowlist/denylist ของโดเมน (เฉพาะ Perplexity)     |
| `max_tokens`          | งบประมาณเนื้อหารวม ค่าเริ่มต้น 25000 (เฉพาะ Perplexity) |
| `max_tokens_per_page` | ขีดจำกัดโทเค็นต่อหน้า ค่าเริ่มต้น 2048 (เฉพาะ Perplexity)  |

<Warning>
  พารามิเตอร์บางตัวไม่ได้ใช้ได้กับผู้ให้บริการทุกราย โหมด `llm-context` ของ Brave
  ปฏิเสธ `ui_lang`, `freshness`, `date_after` และ `date_before`
  Gemini, Grok และ Kimi จะส่งคืนคำตอบที่สังเคราะห์ขึ้นหนึ่งคำตอบพร้อมการอ้างอิง โดย
  รับ `count` เพื่อความเข้ากันได้กับเครื่องมือร่วม แต่จะไม่เปลี่ยนรูปแบบของ
  คำตอบที่มีแหล่งอ้างอิงรองรับ
  Perplexity ทำงานในลักษณะเดียวกันเมื่อคุณใช้เส้นทางความเข้ากันได้ของ Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` หรือ `OPENROUTER_API_KEY`)
  SearXNG รับ `http://` เฉพาะสำหรับโฮสต์เครือข่ายส่วนตัวที่เชื่อถือได้หรือโฮสต์ loopback เท่านั้น;
  ปลายทาง SearXNG สาธารณะต้องใช้ `https://`
  Firecrawl และ Tavily รองรับเฉพาะ `query` และ `count` ผ่าน `web_search`
  -- ใช้เครื่องมือเฉพาะของพวกเขาสำหรับตัวเลือกขั้นสูง
</Warning>

## x_search

`x_search` สืบค้นโพสต์บน X (เดิมคือ Twitter) โดยใช้ xAI และส่งคืน
คำตอบที่ AI สังเคราะห์ขึ้นพร้อมการอ้างอิง โดยรับคำค้นหาภาษาธรรมชาติและ
ตัวกรองแบบมีโครงสร้างที่เลือกใช้ได้ OpenClaw เปิดใช้เครื่องมือ `x_search`
ของ xAI ที่มีในตัวเฉพาะกับคำขอที่ให้บริการการเรียกใช้เครื่องมือนี้เท่านั้น

<Note>
  xAI ระบุในเอกสารว่า `x_search` รองรับการค้นหาด้วยคีย์เวิร์ด การค้นหาเชิงความหมาย การค้นหาผู้ใช้
  และการดึงเธรด สำหรับสถิติการมีส่วนร่วมต่อโพสต์ เช่น การรีโพสต์
  การตอบกลับ บุ๊กมาร์ก หรือจำนวนการดู ให้ใช้การค้นหาแบบเจาะจงสำหรับ URL ของโพสต์ที่แน่นอน
  หรือ ID สถานะจะดีกว่า การค้นหาด้วยคีย์เวิร์ดแบบกว้างอาจพบโพสต์ที่ถูกต้องแต่ส่งคืน
  metadata ต่อโพสต์ได้ไม่ครบถ้วนเท่า รูปแบบที่ดีคือ: ค้นหาโพสต์ให้พบก่อน จากนั้น
  เรียกใช้คำค้นหา `x_search` ครั้งที่สองโดยเน้นที่โพสต์นั้นโดยตรง
</Note>

### config ของ x_search

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
}
```

### พารามิเตอร์ของ x_search

| พารามิเตอร์                    | คำอธิบาย                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | คำค้นหา (จำเป็น)                                |
| `allowed_x_handles`          | จำกัดผลลัพธ์ไว้เฉพาะ X handles ที่ระบุ                 |
| `excluded_x_handles`         | ไม่รวม X handles ที่ระบุ                             |
| `from_date`                  | รวมเฉพาะโพสต์ในวันที่นี้หรือหลังจากวันที่นี้ (YYYY-MM-DD)  |
| `to_date`                    | รวมเฉพาะโพสต์ในวันที่นี้หรือก่อนวันที่นี้ (YYYY-MM-DD) |
| `enable_image_understanding` | ให้ xAI ตรวจสอบรูปภาพที่แนบมากับโพสต์ที่ตรงกัน      |
| `enable_video_understanding` | ให้ xAI ตรวจสอบวิดีโอที่แนบมากับโพสต์ที่ตรงกัน      |

### ตัวอย่าง x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## ตัวอย่าง

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## โปรไฟล์เครื่องมือ

หากคุณใช้โปรไฟล์เครื่องมือหรือ allowlists ให้เพิ่ม `web_search`, `x_search` หรือ `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## ที่เกี่ยวข้อง

- [Web Fetch](/th/tools/web-fetch) -- ดึง URL และแยกเนื้อหาที่อ่านได้
- [Web Browser](/th/tools/browser) -- การทำงานอัตโนมัติของเบราว์เซอร์แบบเต็มสำหรับไซต์ที่ใช้ JS หนัก
- [Grok Search](/th/tools/grok-search) -- Grok ในฐานะผู้ให้บริการ `web_search`
- [Ollama Web Search](/th/tools/ollama-search) -- การค้นหาเว็บแบบไม่ต้องใช้คีย์ผ่านโฮสต์ Ollama ของคุณ
