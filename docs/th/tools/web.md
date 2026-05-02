---
read_when:
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า web_search
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า x_search
    - คุณต้องเลือกผู้ให้บริการค้นหา
    - คุณต้องการทำความเข้าใจการตรวจหาอัตโนมัติและการใช้ผู้ให้บริการสำรอง
sidebarTitle: Web Search
summary: web_search, x_search และ web_fetch -- ค้นหาเว็บ ค้นหาโพสต์บน X หรือดึงเนื้อหาของหน้าเว็บ
title: การค้นหาเว็บ
x-i18n:
    generated_at: "2026-05-02T10:32:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: faa333a522a6690e92e8bd00c6096c84b386a97cbfeb508654929a409b39b8ef
    source_path: tools/web.md
    workflow: 16
---

เครื่องมือ `web_search` ค้นหาเว็บโดยใช้ผู้ให้บริการที่คุณกำหนดค่าไว้และ
ส่งคืนผลลัพธ์ ผลลัพธ์ถูกแคชตามคำค้นหาเป็นเวลา 15 นาที (กำหนดค่าได้)

OpenClaw ยังมี `x_search` สำหรับโพสต์บน X (เดิมคือ Twitter) และ
`web_fetch` สำหรับการดึง URL แบบเบา ในระยะนี้ `web_fetch` ยังคงทำงานภายในเครื่อง
ขณะที่ `web_search` และ `x_search` สามารถใช้ xAI Responses อยู่เบื้องหลังได้

<Info>
  `web_search` เป็นเครื่องมือ HTTP แบบเบา ไม่ใช่ระบบอัตโนมัติของเบราว์เซอร์ สำหรับ
  ไซต์ที่ใช้ JS หนักหรือการเข้าสู่ระบบ ให้ใช้ [เว็บเบราว์เซอร์](/th/tools/browser) สำหรับ
  การดึง URL เฉพาะ ให้ใช้ [การดึงข้อมูลเว็บ](/th/tools/web-fetch)
</Info>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Choose a provider">
    เลือกผู้ให้บริการและตั้งค่าที่จำเป็นให้เสร็จ ผู้ให้บริการบางราย
    ไม่ต้องใช้คีย์ ขณะที่รายอื่นใช้คีย์ API ดูรายละเอียดได้ในหน้าผู้ให้บริการ
    ด้านล่าง
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    คำสั่งนี้จะจัดเก็บผู้ให้บริการและข้อมูลรับรองที่จำเป็น คุณยังสามารถตั้งค่า env
    var (เช่น `BRAVE_API_KEY`) แล้วข้ามขั้นตอนนี้สำหรับผู้ให้บริการที่ใช้ API
    ได้
  </Step>
  <Step title="Use it">
    ตอนนี้เอเจนต์สามารถเรียก `web_search` ได้แล้ว:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    สำหรับโพสต์บน X ให้ใช้:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## การเลือกผู้ให้บริการ

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/th/tools/brave-search">
    ผลลัพธ์แบบมีโครงสร้างพร้อมข้อความตัวอย่าง รองรับโหมด `llm-context` และตัวกรองประเทศ/ภาษา มีระดับใช้งานฟรี
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/th/tools/duckduckgo-search">
    ตัวสำรองที่ไม่ต้องใช้คีย์ ไม่ต้องใช้คีย์ API การผสานรวมแบบไม่เป็นทางการที่อิง HTML
  </Card>
  <Card title="Exa" icon="brain" href="/th/tools/exa-search">
    การค้นหาแบบนิวรัล + คีย์เวิร์ดพร้อมการสกัดเนื้อหา (ไฮไลต์ ข้อความ สรุป)
  </Card>
  <Card title="Firecrawl" icon="flame" href="/th/tools/firecrawl">
    ผลลัพธ์แบบมีโครงสร้าง เหมาะที่สุดเมื่อใช้คู่กับ `firecrawl_search` และ `firecrawl_scrape` สำหรับการสกัดข้อมูลเชิงลึก
  </Card>
  <Card title="Gemini" icon="sparkles" href="/th/tools/gemini-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่านการยึดโยงกับ Google Search
  </Card>
  <Card title="Grok" icon="zap" href="/th/tools/grok-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่านการยึดโยงเว็บของ xAI
  </Card>
  <Card title="Kimi" icon="moon" href="/th/tools/kimi-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่านการค้นหาเว็บของ Moonshot; ตัวสำรองแชตที่ไม่ยึดโยงจะล้มเหลวอย่างชัดเจน
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/th/tools/minimax-search">
    ผลลัพธ์แบบมีโครงสร้างผ่าน API ค้นหา MiniMax Token Plan
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/th/tools/ollama-search">
    ค้นหาผ่านโฮสต์ Ollama ภายในเครื่องที่เข้าสู่ระบบแล้วหรือ API ของ Ollama ที่โฮสต์ไว้
  </Card>
  <Card title="Perplexity" icon="search" href="/th/tools/perplexity-search">
    ผลลัพธ์แบบมีโครงสร้างพร้อมการควบคุมการสกัดเนื้อหาและการกรองโดเมน
  </Card>
  <Card title="SearXNG" icon="server" href="/th/tools/searxng-search">
    เมตาเสิร์ชที่โฮสต์เอง ไม่ต้องใช้คีย์ API รวมผลจาก Google, Bing, DuckDuckGo และอื่นๆ
  </Card>
  <Card title="Tavily" icon="globe" href="/th/tools/tavily">
    ผลลัพธ์แบบมีโครงสร้างพร้อมความลึกของการค้นหา การกรองหัวข้อ และ `tavily_extract` สำหรับการสกัด URL
  </Card>
</CardGroup>

### การเปรียบเทียบผู้ให้บริการ

| ผู้ให้บริการ                              | รูปแบบผลลัพธ์                                                | ตัวกรอง                                         | คีย์ API                                                                                |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/th/tools/brave-search)              | ข้อความตัวอย่างแบบมีโครงสร้าง                                | ประเทศ ภาษา เวลา โหมด `llm-context`             | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/th/tools/duckduckgo-search)    | ข้อความตัวอย่างแบบมีโครงสร้าง                                | --                                               | ไม่มี (ไม่ต้องใช้คีย์)                                                                 |
| [Exa](/th/tools/exa-search)                  | มีโครงสร้าง + สกัดแล้ว                                       | โหมดนิวรัล/คีย์เวิร์ด วันที่ การสกัดเนื้อหา    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/th/tools/firecrawl)             | ข้อความตัวอย่างแบบมีโครงสร้าง                                | ผ่านเครื่องมือ `firecrawl_search`               | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/th/tools/gemini-search)            | AI สังเคราะห์ + การอ้างอิง                                    | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/th/tools/grok-search)                | AI สังเคราะห์ + การอ้างอิง                                    | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/th/tools/kimi-search)                | AI สังเคราะห์ + การอ้างอิง; ล้มเหลวเมื่อใช้ตัวสำรองแชตที่ไม่ยึดโยง | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/th/tools/minimax-search)   | ข้อความตัวอย่างแบบมีโครงสร้าง                                | ภูมิภาค (`global` / `cn`)                        | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/th/tools/ollama-search) | ข้อความตัวอย่างแบบมีโครงสร้าง                                | --                                               | ไม่มีสำหรับโฮสต์ภายในเครื่องที่เข้าสู่ระบบแล้ว; `OLLAMA_API_KEY` สำหรับการค้นหาโดยตรงที่ `https://ollama.com` |
| [Perplexity](/th/tools/perplexity-search)    | ข้อความตัวอย่างแบบมีโครงสร้าง                                | ประเทศ ภาษา เวลา โดเมน ขีดจำกัดเนื้อหา          | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/th/tools/searxng-search)          | ข้อความตัวอย่างแบบมีโครงสร้าง                                | หมวดหมู่ ภาษา                                   | ไม่มี (โฮสต์เอง)                                                                       |
| [Tavily](/th/tools/tavily)                   | ข้อความตัวอย่างแบบมีโครงสร้าง                                | ผ่านเครื่องมือ `tavily_search`                  | `TAVILY_API_KEY`                                                                        |

## การตรวจจับอัตโนมัติ

## การค้นหาเว็บ OpenAI แบบเนทีฟ

โมเดล OpenAI Responses โดยตรงจะใช้เครื่องมือ `web_search` ที่ OpenAI โฮสต์ให้อัตโนมัติเมื่อเปิดใช้งานการค้นหาเว็บของ OpenClaw และไม่ได้ปักหมุดผู้ให้บริการที่จัดการไว้ นี่เป็นพฤติกรรมที่ผู้ให้บริการเป็นเจ้าของใน Plugin OpenAI ที่รวมมาให้ และใช้ได้เฉพาะกับทราฟฟิก OpenAI API แบบเนทีฟเท่านั้น ไม่ใช่ URL ฐานของพร็อกซีที่เข้ากันได้กับ OpenAI หรือเส้นทาง Azure ตั้งค่า `tools.web.search.provider` เป็นผู้ให้บริการอื่น เช่น `brave` เพื่อใช้เครื่องมือ `web_search` ที่จัดการไว้สำหรับโมเดล OpenAI ต่อไป หรือตั้งค่า `tools.web.search.enabled: false` เพื่อปิดทั้งการค้นหาที่จัดการไว้และการค้นหา OpenAI แบบเนทีฟ

## การค้นหาเว็บ Codex แบบเนทีฟ

โมเดลที่รองรับ Codex สามารถเลือกใช้เครื่องมือ `web_search` ของ Responses แบบเนทีฟของผู้ให้บริการแทนฟังก์ชัน `web_search` ที่ OpenClaw จัดการได้

- กำหนดค่าไว้ใต้ `tools.web.search.openaiCodex`
- เปิดใช้งานเฉพาะกับโมเดลที่รองรับ Codex (`openai-codex/*` หรือผู้ให้บริการที่ใช้ `api: "openai-codex-responses"`)
- `web_search` ที่จัดการไว้ยังคงใช้กับโมเดลที่ไม่ใช่ Codex
- `mode: "cached"` เป็นค่าเริ่มต้นและการตั้งค่าที่แนะนำ
- `tools.web.search.enabled: false` จะปิดทั้งการค้นหาที่จัดการไว้และการค้นหาแบบเนทีฟ

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

หากเปิดใช้งานการค้นหา Codex แบบเนทีฟ แต่โมเดลปัจจุบันไม่รองรับ Codex, OpenClaw จะคงพฤติกรรม `web_search` ที่จัดการไว้ตามปกติ

## การตั้งค่าการค้นหาเว็บ

รายการผู้ให้บริการในเอกสารและโฟลว์การตั้งค่าเรียงตามตัวอักษร การตรวจจับอัตโนมัติใช้
ลำดับความสำคัญแยกต่างหาก

หากไม่ได้ตั้งค่า `provider`, OpenClaw จะตรวจสอบผู้ให้บริการตามลำดับนี้และใช้
รายแรกที่พร้อม:

ผู้ให้บริการที่ใช้ API ก่อน:

1. **Brave** -- `BRAVE_API_KEY` หรือ `plugins.entries.brave.config.webSearch.apiKey` (ลำดับ 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` หรือ `plugins.entries.minimax.config.webSearch.apiKey` (ลำดับ 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY`, หรือ `models.providers.google.apiKey` (ลำดับ 20)
4. **Grok** -- `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey` (ลำดับ 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` หรือ `plugins.entries.moonshot.config.webSearch.apiKey` (ลำดับ 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` หรือ `plugins.entries.perplexity.config.webSearch.apiKey` (ลำดับ 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webSearch.apiKey` (ลำดับ 60)
8. **Exa** -- `EXA_API_KEY` หรือ `plugins.entries.exa.config.webSearch.apiKey`; `plugins.entries.exa.config.webSearch.baseUrl` ซึ่งเป็นตัวเลือกเสริม จะแทนที่ปลายทาง Exa (ลำดับ 65)
9. **Tavily** -- `TAVILY_API_KEY` หรือ `plugins.entries.tavily.config.webSearch.apiKey` (ลำดับ 70)

ตัวสำรองที่ไม่ต้องใช้คีย์หลังจากนั้น:

10. **DuckDuckGo** -- ตัวสำรอง HTML ที่ไม่ต้องใช้คีย์ โดยไม่ต้องมีบัญชีหรือคีย์ API (ลำดับ 100)
11. **Ollama Web Search** -- ตัวสำรองที่ไม่ต้องใช้คีย์ผ่านโฮสต์ Ollama ภายในเครื่องที่คุณกำหนดค่าไว้ เมื่อเข้าถึงได้และเข้าสู่ระบบด้วย `ollama signin`; สามารถนำการยืนยันตัวตนแบบ bearer ของผู้ให้บริการ Ollama มาใช้ซ้ำเมื่อโฮสต์ต้องการ และสามารถเรียกการค้นหาโดยตรงที่ `https://ollama.com` เมื่อกำหนดค่าด้วย `OLLAMA_API_KEY` (ลำดับ 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl` (ลำดับ 200)

หากตรวจไม่พบผู้ให้บริการ ระบบจะถอยกลับไปใช้ Brave (คุณจะได้รับข้อผิดพลาดว่าไม่มีคีย์
เพื่อแจ้งให้คุณกำหนดค่าคีย์)

<Note>
  ฟิลด์คีย์ของผู้ให้บริการทั้งหมดรองรับอ็อบเจ็กต์ SecretRef โดย SecretRef ที่มีขอบเขตตาม Plugin
  ใต้ `plugins.entries.<plugin>.config.webSearch.apiKey` จะถูก resolve สำหรับ
  ผู้ให้บริการค้นหาเว็บที่ใช้ API ซึ่งรวมมาให้ ได้แก่ Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity และ Tavily
  ไม่ว่าผู้ให้บริการจะถูกเลือกอย่างชัดเจนผ่าน `tools.web.search.provider` หรือ
  ถูกเลือกผ่านการตรวจจับอัตโนมัติ ในโหมดตรวจจับอัตโนมัติ OpenClaw จะ resolve เฉพาะ
  คีย์ของผู้ให้บริการที่ถูกเลือก -- SecretRef ที่ไม่ได้ถูกเลือกจะยังไม่ทำงาน ดังนั้นคุณจึง
  สามารถกำหนดค่าผู้ให้บริการหลายรายไว้ได้โดยไม่ต้องจ่ายต้นทุนการ resolve สำหรับ
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

การกำหนดค่าเฉพาะผู้ให้บริการ (คีย์ API, URL ฐาน, โหมด) อยู่ใต้
`plugins.entries.<plugin>.config.webSearch.*` Gemini ยังสามารถนำ
`models.providers.google.apiKey` และ `models.providers.google.baseUrl` มาใช้ซ้ำเป็นตัวสำรองที่มีลำดับความสำคัญต่ำกว่า
หลังจากการกำหนดค่าค้นหาเว็บเฉพาะของตนและ `GEMINI_API_KEY` ดูตัวอย่างได้ใน
หน้าผู้ให้บริการ

`tools.web.search.provider` จะถูกตรวจสอบกับ ID ของผู้ให้บริการการค้นหาเว็บที่ประกาศโดยไฟล์ manifest ของ Plugin ที่รวมมากับระบบและที่ติดตั้งไว้ การพิมพ์ผิด เช่น `"brvae"` จะทำให้การตรวจสอบ config ล้มเหลวแทนที่จะ fallback ไปเป็นการตรวจจับอัตโนมัติแบบเงียบ ๆ หากผู้ให้บริการที่กำหนดค่าไว้มีเพียงหลักฐาน Plugin ที่ล้าสมัย เช่น บล็อก `plugins.entries.<plugin>` ที่ตกค้างหลังถอนการติดตั้ง Plugin ภายนอก OpenClaw จะคงการเริ่มต้นให้ทนทานและรายงานคำเตือน เพื่อให้คุณติดตั้ง Plugin ใหม่หรือเรียกใช้ `openclaw doctor --fix` เพื่อล้าง config ที่ล้าสมัย

การเลือกผู้ให้บริการ fallback ของ `web_fetch` แยกต่างหาก:

- เลือกด้วย `tools.web.fetch.provider`
- หรือละเว้นฟิลด์นั้นแล้วให้ OpenClaw ตรวจจับผู้ให้บริการ web-fetch รายแรกที่พร้อมจาก credentials ที่มีอยู่โดยอัตโนมัติ
- `web_fetch` ที่ไม่อยู่ใน sandbox สามารถใช้ผู้ให้บริการจาก Plugin ที่ติดตั้งไว้ซึ่งประกาศ `contracts.webFetchProviders`; ส่วนการ fetch ที่อยู่ใน sandbox จะใช้ได้เฉพาะที่รวมมากับระบบเท่านั้น
- ปัจจุบันผู้ให้บริการ web-fetch ที่รวมมากับระบบคือ Firecrawl ซึ่งกำหนดค่าภายใต้ `plugins.entries.firecrawl.config.webFetch.*`

เมื่อคุณเลือก **Kimi** ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web` OpenClaw ยังสามารถถามข้อมูลต่อไปนี้ได้ด้วย:

- ภูมิภาค Moonshot API (`https://api.moonshot.ai/v1` หรือ `https://api.moonshot.cn/v1`)
- โมเดลค้นหาเว็บเริ่มต้นของ Kimi (ค่าเริ่มต้นคือ `kimi-k2.6`)

สำหรับ `x_search` ให้กำหนดค่า `plugins.entries.xai.config.xSearch.*` ซึ่งใช้ fallback `XAI_API_KEY` เดียวกับการค้นหาเว็บของ Grok
config แบบเดิม `tools.web.x_search.*` จะถูกย้ายโดยอัตโนมัติด้วย `openclaw doctor --fix`
เมื่อคุณเลือก Grok ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web` OpenClaw ยังสามารถเสนอการตั้งค่า `x_search` เพิ่มเติมด้วยคีย์เดียวกันได้
นี่เป็นขั้นตอนติดตามผลแยกต่างหากภายในเส้นทาง Grok ไม่ใช่ตัวเลือกผู้ให้บริการค้นหาเว็บระดับบนสุดแยกต่างหาก หากคุณเลือกผู้ให้บริการอื่น OpenClaw จะไม่แสดงพรอมป์ `x_search`

### การจัดเก็บ API keys

<Tabs>
  <Tab title="ไฟล์ Config">
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
  <Tab title="ตัวแปรสภาพแวดล้อม">
    ตั้งค่าตัวแปรสภาพแวดล้อมของผู้ให้บริการในสภาพแวดล้อมของโปรเซส Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    สำหรับการติดตั้ง gateway ให้ใส่ไว้ใน `~/.openclaw/.env`
    ดู [ตัวแปรสภาพแวดล้อม](/th/help/faq#env-vars-and-env-loading)

  </Tab>
</Tabs>

## พารามิเตอร์ของเครื่องมือ

| พารามิเตอร์             | คำอธิบาย                                           |
| --------------------- | ----------------------------------------------------- |
| `query`               | คำค้นหา (จำเป็น)                               |
| `count`               | จำนวนผลลัพธ์ที่จะส่งกลับ (1-10, ค่าเริ่มต้น: 5)                  |
| `country`             | รหัสประเทศ ISO 2 ตัวอักษร (เช่น "US", "DE")           |
| `language`            | รหัสภาษา ISO 639-1 (เช่น "en", "de")             |
| `search_lang`         | รหัสภาษาสำหรับการค้นหา (เฉพาะ Brave)                     |
| `freshness`           | ตัวกรองเวลา: `day`, `week`, `month` หรือ `year`        |
| `date_after`          | ผลลัพธ์หลังวันที่นี้ (YYYY-MM-DD)                  |
| `date_before`         | ผลลัพธ์ก่อนวันที่นี้ (YYYY-MM-DD)                 |
| `ui_lang`             | รหัสภาษาของ UI (เฉพาะ Brave)                         |
| `domain_filter`       | อาร์เรย์ allowlist/denylist ของโดเมน (เฉพาะ Perplexity)     |
| `max_tokens`          | งบประมาณเนื้อหารวม ค่าเริ่มต้น 25000 (เฉพาะ Perplexity) |
| `max_tokens_per_page` | ขีดจำกัด token ต่อหน้า ค่าเริ่มต้น 2048 (เฉพาะ Perplexity)  |

<Warning>
  พารามิเตอร์บางรายการไม่ได้ใช้ได้กับผู้ให้บริการทุกราย โหมด Brave `llm-context`
  จะปฏิเสธ `ui_lang`; `date_before` ยังต้องมี `date_after` ด้วย เพราะช่วง
  freshness แบบกำหนดเองของ Brave ต้องมีทั้งวันที่เริ่มต้นและวันที่สิ้นสุด
  Gemini, Grok และ Kimi จะส่งกลับคำตอบที่สังเคราะห์แล้วหนึ่งรายการพร้อม citations โดย
  รับ `count` เพื่อความเข้ากันได้กับเครื่องมือร่วม แต่ไม่ได้เปลี่ยนรูปแบบ
  คำตอบที่มี grounding Gemini รองรับ `freshness`, `date_after` และ
  `date_before` โดยแปลงเป็นช่วงเวลาของ Google Search grounding
  Perplexity ทำงานแบบเดียวกันเมื่อคุณใช้เส้นทางความเข้ากันได้ Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` หรือ `OPENROUTER_API_KEY`)
  SearXNG ยอมรับ `http://` เฉพาะสำหรับโฮสต์เครือข่ายส่วนตัวที่เชื่อถือได้หรือโฮสต์ local loopback เท่านั้น;
  endpoint สาธารณะของ SearXNG ต้องใช้ `https://`
  Firecrawl และ Tavily รองรับเฉพาะ `query` และ `count` ผ่าน `web_search`
  -- ใช้เครื่องมือเฉพาะของแต่ละรายการสำหรับตัวเลือกขั้นสูง
</Warning>

## x_search

`x_search` ค้นหาโพสต์บน X (เดิมคือ Twitter) โดยใช้ xAI และส่งคืน
คำตอบที่ AI สังเคราะห์พร้อม citations โดยรับคำถามภาษาธรรมชาติและ
ตัวกรองแบบมีโครงสร้างที่เป็นทางเลือก OpenClaw จะเปิดใช้งานเครื่องมือ `x_search`
ของ xAI ในตัวเฉพาะบนคำขอที่ให้บริการการเรียกเครื่องมือนี้เท่านั้น

<Note>
  เอกสารของ xAI ระบุว่า `x_search` รองรับการค้นหาด้วยคีย์เวิร์ด การค้นหาเชิงความหมาย การค้นหาผู้ใช้
  และการดึง thread สำหรับสถิติ engagement ต่อโพสต์ เช่น reposts,
  replies, bookmarks หรือ views ให้เลือกใช้การค้นหาแบบเจาะจงสำหรับ URL ของโพสต์
  หรือ status ID ที่แน่นอนจะเหมาะกว่า การค้นหาคีย์เวิร์ดกว้าง ๆ อาจพบโพสต์ที่ถูกต้อง
  แต่ส่งคืน metadata ต่อโพสต์ได้ไม่ครบถ้วนเท่า รูปแบบที่ดีคือ: ค้นหาโพสต์ก่อน จากนั้น
  เรียก `x_search` ครั้งที่สองโดยเน้นที่โพสต์นั้นโดยตรง
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
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` จะโพสต์ไปที่ `<baseUrl>/responses` เมื่อ
มีการตั้งค่า `plugins.entries.xai.config.xSearch.baseUrl` หากละเว้นฟิลด์นั้น
จะ fallback ไปที่ `plugins.entries.xai.config.webSearch.baseUrl` จากนั้นเป็น
`tools.web.search.grok.baseUrl` แบบเดิม และสุดท้ายเป็น endpoint สาธารณะของ xAI

### พารามิเตอร์ของ x_search

| พารามิเตอร์                    | คำอธิบาย                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | คำค้นหา (จำเป็น)                                |
| `allowed_x_handles`          | จำกัดผลลัพธ์เฉพาะ X handles ที่กำหนด                 |
| `excluded_x_handles`         | ไม่รวม X handles ที่กำหนด                             |
| `from_date`                  | รวมเฉพาะโพสต์ในหรือหลังวันที่นี้ (YYYY-MM-DD)  |
| `to_date`                    | รวมเฉพาะโพสต์ในหรือก่อนวันที่นี้ (YYYY-MM-DD) |
| `enable_image_understanding` | ให้ xAI ตรวจสอบรูปภาพที่แนบกับโพสต์ที่ตรงกัน      |
| `enable_video_understanding` | ให้ xAI ตรวจสอบวิดีโอที่แนบกับโพสต์ที่ตรงกัน      |

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

- [Web Fetch](/th/tools/web-fetch) -- fetch URL และดึงเนื้อหาที่อ่านได้
- [Web Browser](/th/tools/browser) -- การทำงานอัตโนมัติของเบราว์เซอร์เต็มรูปแบบสำหรับไซต์ที่ใช้ JS หนัก
- [Grok Search](/th/tools/grok-search) -- Grok ในฐานะผู้ให้บริการ `web_search`
- [Ollama Web Search](/th/tools/ollama-search) -- การค้นหาเว็บแบบไม่ต้องใช้คีย์ผ่านโฮสต์ Ollama ของคุณ
