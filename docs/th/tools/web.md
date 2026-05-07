---
read_when:
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า web_search
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า x_search
    - คุณต้องเลือกผู้ให้บริการค้นหา
    - คุณต้องการทำความเข้าใจการตรวจจับอัตโนมัติและการใช้ผู้ให้บริการสำรอง
sidebarTitle: Web Search
summary: web_search, x_search และ web_fetch -- ค้นหาเว็บ, ค้นหาโพสต์บน X หรือดึงเนื้อหาหน้าเว็บ
title: ค้นหาเว็บ
x-i18n:
    generated_at: "2026-05-07T01:55:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 806b614fe3103439ea0a1acaaaa9f4071e22440cc2091ff814834e75b2079529
    source_path: tools/web.md
    workflow: 16
---

เครื่องมือ `web_search` ค้นหาเว็บโดยใช้ผู้ให้บริการที่คุณกำหนดค่าไว้และ
ส่งคืนผลลัพธ์ ผลลัพธ์จะถูกแคชตามคำค้นหาเป็นเวลา 15 นาที (กำหนดค่าได้)

OpenClaw ยังมี `x_search` สำหรับโพสต์ X (เดิมคือ Twitter) และ
`web_fetch` สำหรับการดึง URL แบบเบา ในระยะนี้ `web_fetch` จะยังคงทำงาน
ภายในเครื่อง ขณะที่ `web_search` และ `x_search` สามารถใช้ xAI Responses
เบื้องหลังได้

<Info>
  `web_search` เป็นเครื่องมือ HTTP แบบเบา ไม่ใช่ระบบอัตโนมัติของเบราว์เซอร์ สำหรับ
  เว็บไซต์ที่ใช้ JS หนักหรือการเข้าสู่ระบบ ให้ใช้ [เว็บเบราว์เซอร์](/th/tools/browser) สำหรับ
  การดึง URL เฉพาะ ให้ใช้ [Web Fetch](/th/tools/web-fetch)
</Info>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Choose a provider">
    เลือกผู้ให้บริการและตั้งค่าที่จำเป็นให้เสร็จ ผู้ให้บริการบางราย
    ไม่ต้องใช้คีย์ ขณะที่บางรายใช้ API keys ดูรายละเอียดได้จากหน้าผู้ให้บริการ
    ด้านล่าง
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    คำสั่งนี้จะจัดเก็บผู้ให้บริการและข้อมูลรับรองที่จำเป็น คุณยังสามารถตั้งค่า env
    var (เช่น `BRAVE_API_KEY`) และข้ามขั้นตอนนี้สำหรับผู้ให้บริการที่รองรับด้วย API
  </Step>
  <Step title="Use it">
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
    ผลลัพธ์แบบมีโครงสร้างพร้อมตัวอย่างข้อความ รองรับโหมด `llm-context` และตัวกรองประเทศ/ภาษา มีระดับใช้งานฟรี
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/th/tools/duckduckgo-search">
    ตัวเลือกสำรองที่ไม่ต้องใช้คีย์ ไม่ต้องใช้ API key การผสานรวมแบบไม่เป็นทางการที่อิง HTML
  </Card>
  <Card title="Exa" icon="brain" href="/th/tools/exa-search">
    การค้นหาแบบนิวรัล + คีย์เวิร์ด พร้อมการดึงเนื้อหา (ไฮไลต์ ข้อความ สรุป)
  </Card>
  <Card title="Firecrawl" icon="flame" href="/th/tools/firecrawl">
    ผลลัพธ์แบบมีโครงสร้าง เหมาะที่สุดเมื่อใช้คู่กับ `firecrawl_search` และ `firecrawl_scrape` สำหรับการดึงข้อมูลเชิงลึก
  </Card>
  <Card title="Gemini" icon="sparkles" href="/th/tools/gemini-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่านการยึดโยงกับ Google Search
  </Card>
  <Card title="Grok" icon="zap" href="/th/tools/grok-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่านการยึดโยงเว็บของ xAI
  </Card>
  <Card title="Kimi" icon="moon" href="/th/tools/kimi-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่านการค้นหาเว็บของ Moonshot; การสำรองเป็นแชทที่ไม่ยึดโยงจะล้มเหลวอย่างชัดเจน
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/th/tools/minimax-search">
    ผลลัพธ์แบบมีโครงสร้างผ่าน MiniMax Token Plan search API
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/th/tools/ollama-search">
    ค้นหาผ่านโฮสต์ Ollama ภายในเครื่องที่ลงชื่อเข้าใช้แล้ว หรือ Ollama API ที่โฮสต์ไว้
  </Card>
  <Card title="Perplexity" icon="search" href="/th/tools/perplexity-search">
    ผลลัพธ์แบบมีโครงสร้างพร้อมการควบคุมการดึงเนื้อหาและการกรองโดเมน
  </Card>
  <Card title="SearXNG" icon="server" href="/th/tools/searxng-search">
    เมตาเสิร์ชที่โฮสต์เอง ไม่ต้องใช้ API key รวมผลจาก Google, Bing, DuckDuckGo และอื่นๆ
  </Card>
  <Card title="Tavily" icon="globe" href="/th/tools/tavily">
    ผลลัพธ์แบบมีโครงสร้างพร้อมความลึกในการค้นหา การกรองหัวข้อ และ `tavily_extract` สำหรับการดึงข้อมูล URL
  </Card>
</CardGroup>

### การเปรียบเทียบผู้ให้บริการ

| ผู้ให้บริการ                                  | รูปแบบผลลัพธ์                                                   | ตัวกรอง                                          | API key                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/th/tools/brave-search)              | ตัวอย่างข้อความแบบมีโครงสร้าง                                            | ประเทศ ภาษา เวลา โหมด `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/th/tools/duckduckgo-search)    | ตัวอย่างข้อความแบบมีโครงสร้าง                                            | --                                               | ไม่มี (ไม่ต้องใช้คีย์)                                                                         |
| [Exa](/th/tools/exa-search)                  | แบบมีโครงสร้าง + ดึงข้อมูลแล้ว                                         | โหมดนิวรัล/คีย์เวิร์ด วันที่ การดึงเนื้อหา    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/th/tools/firecrawl)             | ตัวอย่างข้อความแบบมีโครงสร้าง                                            | ผ่านเครื่องมือ `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/th/tools/gemini-search)            | AI สังเคราะห์ + การอ้างอิง                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/th/tools/grok-search)                | AI สังเคราะห์ + การอ้างอิง                                     | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/th/tools/kimi-search)                | AI สังเคราะห์ + การอ้างอิง; ล้มเหลวเมื่อสำรองเป็นแชทที่ไม่ยึดโยง | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/th/tools/minimax-search)   | ตัวอย่างข้อความแบบมีโครงสร้าง                                            | ภูมิภาค (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/th/tools/ollama-search) | ตัวอย่างข้อความแบบมีโครงสร้าง                                            | --                                               | ไม่มีสำหรับโฮสต์ภายในเครื่องที่ลงชื่อเข้าใช้แล้ว; `OLLAMA_API_KEY` สำหรับการค้นหา `https://ollama.com` โดยตรง |
| [Perplexity](/th/tools/perplexity-search)    | ตัวอย่างข้อความแบบมีโครงสร้าง                                            | ประเทศ ภาษา เวลา โดเมน ขีดจำกัดเนื้อหา | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/th/tools/searxng-search)          | ตัวอย่างข้อความแบบมีโครงสร้าง                                            | หมวดหมู่ ภาษา                             | ไม่มี (โฮสต์เอง)                                                                      |
| [Tavily](/th/tools/tavily)                   | ตัวอย่างข้อความแบบมีโครงสร้าง                                            | ผ่านเครื่องมือ `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## การตรวจจับอัตโนมัติ

## การค้นหาเว็บ OpenAI แบบเนทีฟ

โมเดล OpenAI Responses โดยตรงจะใช้เครื่องมือ `web_search` ที่ OpenAI โฮสต์ให้อัตโนมัติเมื่อเปิดใช้งานการค้นหาเว็บของ OpenClaw และไม่ได้ปักหมุดผู้ให้บริการที่จัดการไว้ นี่เป็นพฤติกรรมที่ผู้ให้บริการเป็นเจ้าของใน Plugin OpenAI ที่บันเดิลมา และใช้กับทราฟฟิก OpenAI API แบบเนทีฟเท่านั้น ไม่รวม URL ฐานของพร็อกซีที่เข้ากันได้กับ OpenAI หรือเส้นทาง Azure ตั้งค่า `tools.web.search.provider` เป็นผู้ให้บริการรายอื่น เช่น `brave` เพื่อคงเครื่องมือ `web_search` ที่จัดการไว้สำหรับโมเดล OpenAI หรือกำหนด `tools.web.search.enabled: false` เพื่อปิดใช้งานทั้งการค้นหาที่จัดการไว้และการค้นหา OpenAI แบบเนทีฟ

## การค้นหาเว็บ Codex แบบเนทีฟ

โมเดลที่รองรับ Codex สามารถเลือกใช้เครื่องมือ `web_search` ของ Responses แบบเนทีฟจากผู้ให้บริการแทนฟังก์ชัน `web_search` ที่ OpenClaw จัดการได้

- กำหนดค่าไว้ใต้ `tools.web.search.openaiCodex`
- เปิดใช้งานเฉพาะกับโมเดลที่รองรับ Codex (`openai-codex/*` หรือผู้ให้บริการที่ใช้ `api: "openai-codex-responses"`)
- `web_search` ที่จัดการไว้ยังคงใช้กับโมเดลที่ไม่ใช่ Codex
- `mode: "cached"` เป็นค่าเริ่มต้นและเป็นการตั้งค่าที่แนะนำ
- `tools.web.search.enabled: false` ปิดใช้งานทั้งการค้นหาที่จัดการไว้และการค้นหาแบบเนทีฟ

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

## ความปลอดภัยของเครือข่าย

การเรียกผู้ให้บริการ `web_search` ที่จัดการไว้จะใช้เส้นทาง fetch ที่มีการป้องกันของ OpenClaw สำหรับ
โฮสต์ API ของผู้ให้บริการที่เชื่อถือได้ OpenClaw อนุญาตคำตอบ DNS แบบ fake-IP
ของ Surge, Clash และ sing-box ใน `198.18.0.0/15` และ `fc00::/7` เฉพาะสำหรับชื่อโฮสต์
ของผู้ให้บริการนั้นเท่านั้น ปลายทางส่วนตัว local loopback link-local และ metadata
อื่นๆ ยังคงถูกบล็อก

การอนุญาตอัตโนมัตินี้ไม่มีผลกับ URL `web_fetch` ใดๆ สำหรับ
`web_fetch` ให้เปิดใช้งาน `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` และ
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` อย่างชัดเจนเฉพาะเมื่อ
พร็อกซีที่คุณเชื่อถือเป็นเจ้าของช่วงสังเคราะห์เหล่านั้น

## การตั้งค่าการค้นหาเว็บ

รายชื่อผู้ให้บริการในเอกสารและโฟลว์การตั้งค่าจะเรียงตามตัวอักษร การตรวจจับอัตโนมัติจะใช้
ลำดับความสำคัญแยกต่างหาก

หากไม่ได้ตั้งค่า `provider`, OpenClaw จะตรวจสอบผู้ให้บริการตามลำดับนี้และใช้
รายแรกที่พร้อมใช้งาน:

ผู้ให้บริการที่รองรับด้วย API ก่อน:

1. **Brave** -- `BRAVE_API_KEY` หรือ `plugins.entries.brave.config.webSearch.apiKey` (ลำดับ 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` หรือ `plugins.entries.minimax.config.webSearch.apiKey` (ลำดับ 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY`, หรือ `models.providers.google.apiKey` (ลำดับ 20)
4. **Grok** -- `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey` (ลำดับ 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` หรือ `plugins.entries.moonshot.config.webSearch.apiKey` (ลำดับ 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` หรือ `plugins.entries.perplexity.config.webSearch.apiKey` (ลำดับ 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webSearch.apiKey` (ลำดับ 60)
8. **Exa** -- `EXA_API_KEY` หรือ `plugins.entries.exa.config.webSearch.apiKey`; `plugins.entries.exa.config.webSearch.baseUrl` ที่เป็นตัวเลือกจะแทนที่ปลายทาง Exa (ลำดับ 65)
9. **Tavily** -- `TAVILY_API_KEY` หรือ `plugins.entries.tavily.config.webSearch.apiKey` (ลำดับ 70)

ตัวเลือกสำรองที่ไม่ต้องใช้คีย์หลังจากนั้น:

10. **DuckDuckGo** -- ตัวเลือกสำรองแบบ HTML ที่ไม่ต้องใช้คีย์ โดยไม่ต้องมีบัญชีหรือ API key (ลำดับ 100)
11. **Ollama Web Search** -- ตัวเลือกสำรองที่ไม่ต้องใช้คีย์ผ่านโฮสต์ Ollama ภายในเครื่องที่คุณกำหนดค่าไว้เมื่อเข้าถึงได้และลงชื่อเข้าใช้ด้วย `ollama signin`; สามารถนำ bearer auth ของผู้ให้บริการ Ollama มาใช้ซ้ำเมื่อโฮสต์ต้องใช้ และสามารถเรียกการค้นหา `https://ollama.com` โดยตรงเมื่อกำหนดค่าด้วย `OLLAMA_API_KEY` (ลำดับ 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl` (ลำดับ 200)

หากตรวจไม่พบผู้ให้บริการ ระบบจะถอยกลับไปใช้ Brave (คุณจะได้รับข้อผิดพลาดว่าไม่มีคีย์
พร้อมแจ้งให้คุณกำหนดค่าคีย์)

<Note>
  ช่องคีย์ของผู้ให้บริการทั้งหมดรองรับวัตถุ SecretRef SecretRefs ที่อยู่ในขอบเขต Plugin
  ภายใต้ `plugins.entries.<plugin>.config.webSearch.apiKey` จะถูก resolve สำหรับ
  ผู้ให้บริการค้นหาเว็บที่รองรับด้วย API ซึ่งบันเดิลมา รวมถึง Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity และ Tavily
  ไม่ว่าผู้ให้บริการจะถูกเลือกอย่างชัดเจนผ่าน `tools.web.search.provider` หรือ
  ถูกเลือกผ่านการตรวจจับอัตโนมัติ ในโหมดตรวจจับอัตโนมัติ OpenClaw จะ resolve เฉพาะคีย์
  ของผู้ให้บริการที่ถูกเลือกเท่านั้น -- SecretRefs ที่ไม่ได้ถูกเลือกจะยังไม่ทำงาน ดังนั้นคุณจึง
  สามารถกำหนดค่าผู้ให้บริการหลายรายไว้ได้โดยไม่ต้องเสียต้นทุนการ resolve สำหรับ
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

การกำหนดค่าเฉพาะผู้ให้บริการ (API keys, base URLs, modes) อยู่ภายใต้
`plugins.entries.<plugin>.config.webSearch.*` Gemini ยังสามารถใช้
`models.providers.google.apiKey` และ `models.providers.google.baseUrl` ซ้ำเป็น
fallback ลำดับความสำคัญต่ำกว่า หลังจากการกำหนดค่า web-search เฉพาะของตัวเองและ `GEMINI_API_KEY` ดูตัวอย่างได้ใน
หน้าผู้ให้บริการ

`tools.web.search.provider` ถูกตรวจสอบกับ id ของผู้ให้บริการ web-search
ที่ประกาศโดย manifest ของ Plugin ที่มาพร้อมชุดและที่ติดตั้งไว้ รวมถึง
Plugin ผู้ให้บริการที่ทราบว่าสามารถติดตั้งได้ การพิมพ์ผิด เช่น `"brvae"` จะทำให้
การตรวจสอบการกำหนดค่าล้มเหลว แทนที่จะ fallback ไปใช้การตรวจจับอัตโนมัติแบบเงียบ ๆ หากผู้ให้บริการที่กำหนดค่าไว้เป็นที่รู้จัก แต่
Plugin เจ้าของไม่พร้อมใช้งาน OpenClaw จะทำให้การเริ่มต้นยังทนทานและรายงาน
คำเตือน เพื่อให้คุณเรียกใช้ `openclaw doctor --fix` เพื่อติดตั้งหรือเปิดใช้งาน Plugin ได้
พฤติกรรมคำเตือนแบบเดียวกันนี้ใช้กับหลักฐาน Plugin ที่ล้าสมัยด้วย เช่น บล็อก
`plugins.entries.<plugin>` ที่เหลืออยู่หลังถอนการติดตั้ง Plugin ภายนอก

การเลือกผู้ให้บริการ fallback ของ `web_fetch` แยกกันต่างหาก:

- เลือกด้วย `tools.web.fetch.provider`
- หรือไม่ระบุฟิลด์นั้น แล้วให้ OpenClaw ตรวจจับผู้ให้บริการ web-fetch รายแรก
  ที่พร้อมใช้งานจาก credentials ที่มีโดยอัตโนมัติ
- `web_fetch` ที่ไม่อยู่ใน sandbox สามารถใช้ผู้ให้บริการ Plugin ที่ติดตั้งไว้ซึ่งประกาศ
  `contracts.webFetchProviders`; การ fetch แบบ sandbox จะใช้ได้เฉพาะตัวที่มาพร้อมชุดเท่านั้น
- ปัจจุบันผู้ให้บริการ web-fetch ที่มาพร้อมชุดคือ Firecrawl ซึ่งกำหนดค่าภายใต้
  `plugins.entries.firecrawl.config.webFetch.*`

เมื่อคุณเลือก **Kimi** ระหว่าง `openclaw onboard` หรือ
`openclaw configure --section web` OpenClaw ยังสามารถถามหา:

- ภูมิภาค Moonshot API (`https://api.moonshot.ai/v1` หรือ `https://api.moonshot.cn/v1`)
- โมเดล web-search เริ่มต้นของ Kimi (ค่าเริ่มต้นคือ `kimi-k2.6`)

สำหรับ `x_search` ให้กำหนดค่า `plugins.entries.xai.config.xSearch.*` โดยใช้
fallback `XAI_API_KEY` เดียวกับการค้นหาเว็บของ Grok
การกำหนดค่าเดิม `tools.web.x_search.*` จะถูกย้ายอัตโนมัติโดย `openclaw doctor --fix`
เมื่อคุณเลือก Grok ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web`
OpenClaw ยังสามารถเสนอการตั้งค่า `x_search` แบบไม่บังคับด้วยคีย์เดียวกันได้
นี่เป็นขั้นตอนต่อเนื่องที่แยกอยู่ภายในเส้นทาง Grok ไม่ใช่ตัวเลือกผู้ให้บริการ
web-search ระดับบนสุดที่แยกต่างหาก หากคุณเลือกผู้ให้บริการอื่น OpenClaw จะไม่
แสดง prompt ของ `x_search`

### การจัดเก็บ API keys

<Tabs>
  <Tab title="ไฟล์กำหนดค่า">
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
    ตั้งค่าตัวแปรสภาพแวดล้อมของผู้ให้บริการในสภาพแวดล้อมของกระบวนการ Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    สำหรับการติดตั้ง Gateway ให้ใส่ไว้ใน `~/.openclaw/.env`
    ดู [ตัวแปรสภาพแวดล้อม](/th/help/faq#env-vars-and-env-loading)

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
| `ui_lang`             | รหัสภาษาของ UI (เฉพาะ Brave)                         |
| `domain_filter`       | อาร์เรย์ allowlist/denylist ของโดเมน (เฉพาะ Perplexity)     |
| `max_tokens`          | งบประมาณเนื้อหารวม ค่าเริ่มต้น 25000 (เฉพาะ Perplexity) |
| `max_tokens_per_page` | ขีดจำกัด token ต่อหน้า ค่าเริ่มต้น 2048 (เฉพาะ Perplexity)  |

<Warning>
  ไม่ใช่ทุกพารามิเตอร์จะใช้ได้กับทุกผู้ให้บริการ โหมด `llm-context` ของ Brave
  ปฏิเสธ `ui_lang`; `date_before` ยังต้องใช้ `date_after` ด้วย เพราะช่วง
  freshness แบบกำหนดเองของ Brave ต้องมีทั้งวันที่เริ่มต้นและวันที่สิ้นสุด
  Gemini, Grok และ Kimi ส่งคืนคำตอบสังเคราะห์หนึ่งรายการพร้อม citations โดย
  รับ `count` เพื่อความเข้ากันได้กับเครื่องมือร่วม แต่จะไม่เปลี่ยนรูปแบบ
  คำตอบที่มี grounding Gemini รองรับ `freshness`, `date_after` และ
  `date_before` โดยแปลงเป็นช่วงเวลาของ Google Search grounding
  Perplexity ทำงานแบบเดียวกันเมื่อคุณใช้เส้นทางความเข้ากันได้ Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` หรือ `OPENROUTER_API_KEY`)
  SearXNG รับ `http://` เฉพาะสำหรับโฮสต์เครือข่ายส่วนตัวหรือ loopback ที่เชื่อถือได้เท่านั้น;
  endpoint สาธารณะของ SearXNG ต้องใช้ `https://`
  Firecrawl และ Tavily รองรับเฉพาะ `query` และ `count` ผ่าน `web_search`
  -- ใช้เครื่องมือเฉพาะของพวกเขาสำหรับตัวเลือกขั้นสูง
</Warning>

## x_search

`x_search` ค้นหาโพสต์ X (เดิมคือ Twitter) โดยใช้ xAI และส่งคืน
คำตอบที่ AI สังเคราะห์พร้อม citations โดยรับ query ภาษาธรรมชาติและ
ตัวกรองแบบมีโครงสร้างที่ไม่บังคับ OpenClaw เปิดใช้งานเครื่องมือ `x_search`
ของ xAI ที่มีมาในตัวเฉพาะในคำขอที่ให้บริการการเรียกเครื่องมือนี้เท่านั้น

<Note>
  xAI ระบุในเอกสารว่า `x_search` รองรับการค้นหาด้วยคีย์เวิร์ด, การค้นหาเชิงความหมาย, การค้นหาผู้ใช้
  และการ fetch thread สำหรับสถิติ engagement ต่อโพสต์ เช่น reposts,
  replies, bookmarks หรือ views ให้ใช้การ lookup แบบเจาะจงสำหรับ URL โพสต์
  หรือ status ID ที่แน่นอนมากกว่า การค้นหาด้วยคีย์เวิร์ดแบบกว้างอาจพบโพสต์ที่ถูกต้อง แต่ส่งคืน metadata ต่อโพสต์
  ที่สมบูรณ์น้อยกว่า รูปแบบที่ดีคือ: ค้นหาโพสต์ให้เจอก่อน แล้ว
  เรียก query `x_search` ครั้งที่สองโดยโฟกัสที่โพสต์นั้นโดยตรง
</Note>

### การกำหนดค่า x_search

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

`x_search` จะ post ไปที่ `<baseUrl>/responses` เมื่อ
`plugins.entries.xai.config.xSearch.baseUrl` ถูกตั้งค่า หากละเว้นฟิลด์นั้น
จะ fallback ไปที่ `plugins.entries.xai.config.webSearch.baseUrl` จากนั้นไปที่
`tools.web.search.grok.baseUrl` แบบเดิม และสุดท้ายไปที่ endpoint สาธารณะของ xAI

### พารามิเตอร์ x_search

| พารามิเตอร์                    | คำอธิบาย                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | คำค้นหา (จำเป็น)                                |
| `allowed_x_handles`          | จำกัดผลลัพธ์ให้เป็น X handles ที่ระบุ                 |
| `excluded_x_handles`         | ยกเว้น X handles ที่ระบุ                             |
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

- [Web Fetch](/th/tools/web-fetch) -- fetch URL และดึงเนื้อหาที่อ่านได้
- [Web Browser](/th/tools/browser) -- การทำงานอัตโนมัติของเบราว์เซอร์เต็มรูปแบบสำหรับไซต์ที่ใช้ JS หนัก
- [Grok Search](/th/tools/grok-search) -- Grok เป็นผู้ให้บริการ `web_search`
- [Ollama Web Search](/th/tools/ollama-search) -- การค้นหาเว็บโดยไม่ใช้คีย์ผ่านโฮสต์ Ollama ของคุณ
