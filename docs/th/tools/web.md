---
read_when:
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า web_search
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า x_search
    - คุณต้องเลือกผู้ให้บริการค้นหา
    - คุณต้องการทำความเข้าใจการตรวจจับอัตโนมัติและการเลือกผู้ให้บริการ
sidebarTitle: Web Search
summary: web_search, x_search, and web_fetch -- ค้นหาเว็บ ค้นหาโพสต์ X หรือดึงเนื้อหาหน้าเว็บ
title: การค้นหาเว็บ
x-i18n:
    generated_at: "2026-06-27T18:34:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

เครื่องมือ `web_search` ค้นหาเว็บโดยใช้ผู้ให้บริการที่คุณกำหนดค่าไว้ และ
ส่งคืนผลลัพธ์ ผลลัพธ์จะถูกแคชตามคำค้นหาเป็นเวลา 15 นาที (กำหนดค่าได้)

OpenClaw ยังมี `x_search` สำหรับโพสต์บน X (เดิมคือ Twitter) และ
`web_fetch` สำหรับการดึง URL แบบเบา ในระยะนี้ `web_fetch` จะยังทำงาน
ภายในเครื่อง ขณะที่ `web_search` และ `x_search` สามารถใช้ xAI Responses
อยู่เบื้องหลังได้

<Info>
  `web_search` เป็นเครื่องมือ HTTP แบบเบา ไม่ใช่ระบบอัตโนมัติของเบราว์เซอร์ สำหรับ
  ไซต์ที่ใช้ JS หนักหรือการเข้าสู่ระบบ ให้ใช้ [เว็บเบราว์เซอร์](/th/tools/browser) สำหรับ
  การดึง URL เฉพาะ ให้ใช้ [Web Fetch](/th/tools/web-fetch)
</Info>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Choose a provider">
    เลือกผู้ให้บริการและตั้งค่าที่จำเป็นให้เสร็จ ผู้ให้บริการบางราย
    ไม่ต้องใช้คีย์ ขณะที่บางรายใช้ API key ดูรายละเอียดได้จากหน้า
    ผู้ให้บริการด้านล่าง
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    คำสั่งนี้จะจัดเก็บผู้ให้บริการและข้อมูลรับรองที่จำเป็น คุณยังสามารถตั้งค่า env
    var (เช่น `BRAVE_API_KEY`) และข้ามขั้นตอนนี้สำหรับผู้ให้บริการที่ใช้ API
    ได้
  </Step>
  <Step title="Use it">
    ตอนนี้ agent สามารถเรียก `web_search` ได้แล้ว:

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
    ผลลัพธ์แบบมีโครงสร้างพร้อมส่วนย่อ รองรับโหมด `llm-context` และตัวกรองประเทศ/ภาษา มีระดับใช้ฟรี
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/th/plugins/codex-harness">
    คำตอบที่ AI สังเคราะห์พร้อมแหล่งอ้างอิงผ่านบัญชี Codex app-server ของคุณ
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/th/tools/duckduckgo-search">
    ผู้ให้บริการที่ไม่ต้องใช้คีย์ ไม่ต้องใช้ API key การผสานรวมแบบไม่เป็นทางการที่ใช้ HTML
  </Card>
  <Card title="Exa" icon="brain" href="/th/tools/exa-search">
    การค้นหาแบบนิวรัล + คีย์เวิร์ดพร้อมการสกัดเนื้อหา (ไฮไลต์ ข้อความ สรุป)
  </Card>
  <Card title="Firecrawl" icon="flame" href="/th/tools/firecrawl">
    ผลลัพธ์แบบมีโครงสร้าง เหมาะที่สุดเมื่อใช้คู่กับ `firecrawl_search` และ `firecrawl_scrape` สำหรับการสกัดเชิงลึก
  </Card>
  <Card title="Gemini" icon="sparkles" href="/th/tools/gemini-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่านการยึดโยงกับ Google Search
  </Card>
  <Card title="Grok" icon="zap" href="/th/tools/grok-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่านการยึดโยงเว็บของ xAI
  </Card>
  <Card title="Kimi" icon="moon" href="/th/tools/kimi-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่านการค้นหาเว็บของ Moonshot; fallback ของแชตที่ไม่ยึดโยงจะล้มเหลวอย่างชัดเจน
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/th/tools/minimax-search">
    ผลลัพธ์แบบมีโครงสร้างผ่าน API การค้นหา MiniMax Token Plan
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/th/tools/ollama-search">
    ค้นหาผ่านโฮสต์ Ollama ภายในเครื่องที่เข้าสู่ระบบแล้ว หรือ API ของ Ollama ที่โฮสต์ไว้
  </Card>
  <Card title="Parallel" icon="layer-group" href="/th/tools/parallel-search">
    Parallel Search API แบบชำระเงิน (`PARALLEL_API_KEY`); ขีดจำกัดอัตราที่สูงขึ้นและการปรับแต่งตามวัตถุประสงค์
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/th/tools/parallel-search">
    เลือกใช้ได้โดยไม่ต้องใช้คีย์ Search MCP ฟรีของ Parallel พร้อมข้อความตัดตอนแบบหนาแน่นที่ปรับให้เหมาะกับ LLM และไม่มี API key
  </Card>
  <Card title="Perplexity" icon="search" href="/th/tools/perplexity-search">
    ผลลัพธ์แบบมีโครงสร้างพร้อมตัวควบคุมการสกัดเนื้อหาและการกรองโดเมน
  </Card>
  <Card title="SearXNG" icon="server" href="/th/tools/searxng-search">
    เมตาเสิร์ชที่โฮสต์เอง ไม่ต้องใช้ API key รวบรวมผลจาก Google, Bing, DuckDuckGo และอื่นๆ
  </Card>
  <Card title="Tavily" icon="globe" href="/th/tools/tavily">
    ผลลัพธ์แบบมีโครงสร้างพร้อมความลึกในการค้นหา การกรองหัวข้อ และ `tavily_extract` สำหรับการสกัด URL
  </Card>
</CardGroup>

### การเปรียบเทียบผู้ให้บริการ

| ผู้ให้บริการ                                     | รูปแบบผลลัพธ์                                                   | ตัวกรอง                                          | API key                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/th/tools/brave-search)                     | ส่วนย่อแบบมีโครงสร้าง                                          | ประเทศ ภาษา เวลา โหมด `llm-context`             | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/th/plugins/codex-harness)    | AI สังเคราะห์ + URL แหล่งที่มา                                 | โดเมน ขนาดบริบท ตำแหน่งผู้ใช้                   | ไม่มี; ใช้การลงชื่อเข้าใช้ Codex/OpenAI                                                |
| [DuckDuckGo](/th/tools/duckduckgo-search)           | ส่วนย่อแบบมีโครงสร้าง                                          | --                                               | ไม่มี (ไม่ต้องใช้คีย์)                                                                 |
| [Exa](/th/tools/exa-search)                         | แบบมีโครงสร้าง + สกัดแล้ว                                      | โหมดนิวรัล/คีย์เวิร์ด วันที่ การสกัดเนื้อหา     | `EXA_API_KEY`                                                                           |
| [Firecrawl](/th/tools/firecrawl)                    | ส่วนย่อแบบมีโครงสร้าง                                          | ผ่านเครื่องมือ `firecrawl_search`                | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/th/tools/gemini-search)                   | AI สังเคราะห์ + การอ้างอิง                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/th/tools/grok-search)                       | AI สังเคราะห์ + การอ้างอิง                                     | --                                               | xAI OAuth, `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey`             |
| [Kimi](/th/tools/kimi-search)                       | AI สังเคราะห์ + การอ้างอิง; ล้มเหลวเมื่อ fallback เป็นแชตที่ไม่ยึดโยง | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/th/tools/minimax-search)          | ส่วนย่อแบบมีโครงสร้าง                                          | ภูมิภาค (`global` / `cn`)                        | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/th/tools/ollama-search)        | ส่วนย่อแบบมีโครงสร้าง                                          | --                                               | ไม่มีสำหรับโฮสต์ภายในเครื่องที่เข้าสู่ระบบแล้ว; `OLLAMA_API_KEY` สำหรับการค้นหา `https://ollama.com` โดยตรง |
| [Parallel](/th/tools/parallel-search)               | ข้อความตัดตอนแบบหนาแน่นที่จัดอันดับสำหรับบริบท LLM            | --                                               | `PARALLEL_API_KEY` (ชำระเงิน)                                                          |
| [Parallel Search (Free)](/th/tools/parallel-search) | ข้อความตัดตอนแบบหนาแน่นที่จัดอันดับสำหรับบริบท LLM            | --                                               | ไม่มี (Search MCP ฟรี)                                                                  |
| [Perplexity](/th/tools/perplexity-search)           | ส่วนย่อแบบมีโครงสร้าง                                          | ประเทศ ภาษา เวลา โดเมน ขีดจำกัดเนื้อหา          | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/th/tools/searxng-search)                 | ส่วนย่อแบบมีโครงสร้าง                                          | หมวดหมู่ ภาษา                                   | ไม่มี (โฮสต์เอง)                                                                        |
| [Tavily](/th/tools/tavily)                          | ส่วนย่อแบบมีโครงสร้าง                                          | ผ่านเครื่องมือ `tavily_search`                   | `TAVILY_API_KEY`                                                                        |

## การตรวจจับอัตโนมัติ

## การค้นหาเว็บ OpenAI แบบเนทีฟ

โมเดล OpenAI Responses โดยตรงจะใช้เครื่องมือ `web_search` ที่ OpenAI โฮสต์โดยอัตโนมัติเมื่อเปิดใช้งานการค้นหาเว็บของ OpenClaw และไม่ได้ตรึงผู้ให้บริการที่มีการจัดการไว้ นี่เป็นพฤติกรรมที่ผู้ให้บริการเป็นเจ้าของใน OpenAI plugin ที่รวมมาให้ และมีผลเฉพาะกับทราฟฟิก OpenAI API แบบเนทีฟ ไม่ใช่ URL ฐานของพร็อกซีที่เข้ากันได้กับ OpenAI หรือเส้นทาง Azure ตั้งค่า `tools.web.search.provider` เป็นผู้ให้บริการรายอื่น เช่น `brave` เพื่อคงเครื่องมือ `web_search` ที่มีการจัดการไว้สำหรับโมเดล OpenAI หรือตั้งค่า `tools.web.search.enabled: false` เพื่อปิดทั้งการค้นหาที่มีการจัดการและการค้นหา OpenAI แบบเนทีฟ

## การค้นหาเว็บ Codex แบบเนทีฟ

รันไทม์ Codex app-server จะใช้เครื่องมือ `web_search` ที่ Codex โฮสต์โดยอัตโนมัติ
เมื่อเปิดใช้งานการค้นหาเว็บและไม่ได้เลือกผู้ให้บริการที่มีการจัดการ การค้นหาที่โฮสต์แบบเนทีฟ
และเครื่องมือไดนามิก `web_search` ที่มีการจัดการของ OpenClaw ใช้พร้อมกันไม่ได้
ดังนั้นการค้นหาที่มีการจัดการจึงไม่สามารถเลี่ยงข้อจำกัดโดเมนแบบเนทีฟได้ OpenClaw ใช้
เครื่องมือที่มีการจัดการเมื่อการค้นหาที่โฮสต์ใช้งานไม่ได้ ถูกปิดไว้อย่างชัดเจน หรือ
ถูกแทนที่ด้วยผู้ให้บริการที่มีการจัดการที่เลือกไว้ OpenClaw ปิดใช้ส่วนขยาย `web.run`
แบบสแตนด์อโลนของ Codex ไว้ เพราะทราฟฟิก app-server ระดับโปรดักชันปฏิเสธ namespace
`web` ที่ผู้ใช้กำหนดเอง

- กำหนดค่าการค้นหาแบบเนทีฟภายใต้ `tools.web.search.openaiCodex`
- ตั้งค่า `tools.web.search.provider: "codex"` เพื่อจัดเตรียม Codex Hosted Search เป็น
  ผู้ให้บริการ `web_search` ที่มีการจัดการสำหรับโมเดลหลักใดๆ แต่ละการเรียกจะรัน
  เทิร์น Codex app-server ชั่วคราวแบบมีขอบเขต และจะล้มเหลวหาก Codex ไม่ปล่อยรายการ
  `webSearch` ที่โฮสต์ไว้
- `mode: "cached"` เป็นค่ากำหนดเริ่มต้น แต่ Codex จะแปลงเป็นการเข้าถึงภายนอกแบบสด
  สำหรับเทิร์น app-server ที่ไม่ถูกจำกัด; ตั้งค่า `"live"` เพื่อขอการเข้าถึง
  แบบสดอย่างชัดเจน
- ตั้งค่า `tools.web.search.provider` เป็นผู้ให้บริการที่มีการจัดการ เช่น `brave` เพื่อใช้
  `web_search` ที่มีการจัดการของ OpenClaw แทน
- ตั้งค่า `tools.web.search.openaiCodex.enabled: false` เพื่อไม่ใช้การค้นหา
  ที่ Codex โฮสต์; ผู้ให้บริการที่มีการจัดการรายอื่นยังคงใช้งานได้
- การจำกัดพื้นผิวเครื่องมือแบบเนทีฟของ Codex ยังทำให้ `web_search` ที่มีการจัดการ
  ยังคงใช้งานได้
- เมื่อตั้งค่า `allowedDomains` แล้ว fallback ที่มีการจัดการโดยอัตโนมัติจะล้มเหลวแบบปิด
  หากการค้นหาที่โฮสต์ใช้งานไม่ได้ เพื่อไม่ให้ข้าม allowlist แบบเนทีฟได้
- การรันแบบ LLM-only ที่ปิดใช้เครื่องมือจะปิดทั้งการค้นหาแบบเนทีฟและแบบมีการจัดการ
- `tools.web.search.enabled: false` ปิดทั้งการค้นหาแบบมีการจัดการและแบบเนทีฟ

การเปลี่ยนนโยบายการค้นหา Codex ที่มีผลแบบถาวรจะเริ่มเธรดที่ผูกไว้ใหม่ เพื่อให้
เธรด app-server ที่โหลดแล้วไม่สามารถเก็บสิทธิ์เข้าถึง hosted-search ที่ล้าสมัยไว้ได้
ข้อจำกัดชั่วคราวรายเทิร์นจะใช้เธรดชั่วคราวที่ถูกจำกัด และคงการผูกที่มีอยู่ไว้สำหรับการกลับมาทำต่อภายหลัง

ทราฟฟิก OpenAI ChatGPT Responses โดยตรงก็สามารถใช้เครื่องมือ `web_search`
ที่ OpenAI โฮสต์ได้เช่นกัน เส้นทางแยกนี้ยังคงเป็นแบบเลือกใช้ผ่าน
`tools.web.search.openaiCodex.enabled: true` และมีผลเฉพาะกับโมเดล
`openai/*` ที่เข้าเงื่อนไขซึ่งใช้ `api: "openai-chatgpt-responses"`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: use Codex Hosted Search from non-Codex parent models too.
        provider: "codex",
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

สำหรับรันไทม์และผู้ให้บริการที่ไม่รองรับการค้นหา Codex แบบเนทีฟ Codex สามารถ
ใช้ fallback `web_search` ที่มีการจัดการผ่าน namespace เครื่องมือไดนามิกของ OpenClaw ได้
ใช้ผู้ให้บริการที่มีการจัดการอย่างชัดเจนเมื่อคุณต้องการตัวควบคุมเครือข่ายเฉพาะผู้ให้บริการ
ของ OpenClaw แทนการค้นหาที่ Codex โฮสต์

การเลือก `provider: "codex"` จะเปิดใช้งาน Plugin `codex` ที่รวมมาให้ และใช้ข้อจำกัด
`tools.web.search.openaiCodex` เดียวกับที่แสดงไว้ด้านบน ให้ยืนยันตัวตนกับ
Codex app-server ก่อนด้วย `openclaw models auth login --provider openai`
เอเจนต์แม่สามารถใช้โมเดลหรือรันไทม์ใดก็ได้ มีเพียง worker ค้นหาแบบจำกัดขอบเขตเท่านั้น
ที่รันผ่าน Codex

## ความปลอดภัยของเครือข่าย

การเรียกผู้ให้บริการ HTTP `web_search` ที่จัดการโดยระบบจะใช้เส้นทาง fetch ที่มีการป้องกันของ OpenClaw สำหรับ
โฮสต์ API ของผู้ให้บริการที่เชื่อถือได้ OpenClaw อนุญาตคำตอบ DNS แบบ fake-IP ของ
Surge, Clash และ sing-box ใน `198.18.0.0/15` และ `fc00::/7` เฉพาะสำหรับชื่อโฮสต์ของผู้ให้บริการนั้นเท่านั้น
ปลายทาง private, loopback, link-local และ metadata อื่นๆ ยังคงถูกบล็อก
Codex Hosted Search เป็นข้อยกเว้น: worker แบบจำกัดขอบเขตของมันมอบหมายการเข้าถึงเครือข่าย
ให้กับเครื่องมือ `web_search` แบบ hosted ของ Codex app-server

การอนุญาตอัตโนมัตินี้ไม่ใช้กับ URL `web_fetch` ใดๆ โดยพลการ สำหรับ
`web_fetch` ให้เปิดใช้ `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` และ
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` อย่างชัดเจนเฉพาะเมื่อ
พร็อกซีที่เชื่อถือได้ของคุณเป็นเจ้าของช่วงสังเคราะห์เหล่านั้น

## การตั้งค่า web search

รายการผู้ให้บริการในเอกสารและโฟลว์การตั้งค่าเรียงตามตัวอักษร การตรวจจับอัตโนมัติจะรักษา
ลำดับความสำคัญแยกต่างหาก

หากไม่ได้ตั้งค่า `provider` OpenClaw จะตรวจสอบผู้ให้บริการตามลำดับนี้และใช้
รายแรกที่พร้อม:

ผู้ให้บริการที่มี API รองรับก่อน:

1. **Brave** -- `BRAVE_API_KEY` หรือ `plugins.entries.brave.config.webSearch.apiKey` (ลำดับ 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` หรือ `plugins.entries.minimax.config.webSearch.apiKey` (ลำดับ 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY`, หรือ `models.providers.google.apiKey` (ลำดับ 20)
4. **Grok** -- xAI OAuth, `XAI_API_KEY`, หรือ `plugins.entries.xai.config.webSearch.apiKey` (ลำดับ 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` หรือ `plugins.entries.moonshot.config.webSearch.apiKey` (ลำดับ 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` หรือ `plugins.entries.perplexity.config.webSearch.apiKey` (ลำดับ 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webSearch.apiKey` (ลำดับ 60)
8. **Exa** -- `EXA_API_KEY` หรือ `plugins.entries.exa.config.webSearch.apiKey`; `plugins.entries.exa.config.webSearch.baseUrl` แบบไม่บังคับจะแทนที่ endpoint ของ Exa (ลำดับ 65)
9. **Tavily** -- `TAVILY_API_KEY` หรือ `plugins.entries.tavily.config.webSearch.apiKey` (ลำดับ 70)
10. **Parallel** -- Parallel Search API แบบชำระเงินผ่าน `PARALLEL_API_KEY` หรือ `plugins.entries.parallel.config.webSearch.apiKey`; `plugins.entries.parallel.config.webSearch.baseUrl` แบบไม่บังคับจะแทนที่ endpoint (ลำดับ 75)

ผู้ให้บริการ endpoint ที่กำหนดค่าไว้หลังจากนั้น:

11. **SearXNG** -- `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl` (ลำดับ 200)

ผู้ให้บริการที่ไม่ต้องใช้คีย์ เช่น **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** และ **Codex Hosted Search** จะพร้อมใช้งานเฉพาะเมื่อคุณ
เลือกอย่างชัดเจนด้วย `tools.web.search.provider` หรือผ่าน
`openclaw configure --section web` OpenClaw จะไม่ส่งคำค้นหา
`web_search` ที่จัดการโดยระบบไปยังผู้ให้บริการที่ไม่ต้องใช้คีย์เพียงเพราะไม่มี
ผู้ให้บริการที่มี API รองรับถูกกำหนดค่าไว้

โมเดล OpenAI Responses เป็นข้อยกเว้น: ขณะที่ยังไม่ได้ตั้งค่า `tools.web.search.provider`
โมเดลเหล่านี้จะใช้ web search แบบ native ของ OpenAI แทนผู้ให้บริการที่จัดการโดยระบบ
ด้านบน ตั้งค่า `tools.web.search.provider` เป็น `parallel-free` (หรือผู้ให้บริการอื่น)
เพื่อกำหนดเส้นทางผ่านเส้นทางที่จัดการโดยระบบ

<Note>
  ฟิลด์คีย์ของผู้ให้บริการทั้งหมดรองรับออบเจ็กต์ SecretRef SecretRef ที่อยู่ในขอบเขต Plugin
  ภายใต้ `plugins.entries.<plugin>.config.webSearch.apiKey` จะถูก resolve สำหรับ
  ผู้ให้บริการ web search ที่มี API รองรับซึ่งติดตั้งอยู่ รวมถึง Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity และ Tavily
  ไม่ว่าผู้ให้บริการจะถูกเลือกอย่างชัดเจนผ่าน `tools.web.search.provider` หรือ
  ถูกเลือกผ่านการตรวจจับอัตโนมัติ ในโหมดตรวจจับอัตโนมัติ OpenClaw จะ resolve เฉพาะ
  คีย์ของผู้ให้บริการที่ถูกเลือกเท่านั้น -- SecretRef ที่ไม่ได้ถูกเลือกจะยังไม่ทำงาน ดังนั้นคุณสามารถ
  กำหนดค่าผู้ให้บริการหลายรายไว้ได้โดยไม่ต้องจ่ายต้นทุนการ resolve สำหรับ
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

การกำหนดค่าเฉพาะผู้ให้บริการ (คีย์ API, URL ฐาน, โหมด) อยู่ภายใต้
`plugins.entries.<plugin>.config.webSearch.*` Gemini ยังสามารถนำ
`models.providers.google.apiKey` และ `models.providers.google.baseUrl` มาใช้ซ้ำเป็น fallback
ที่มีลำดับความสำคัญต่ำกว่า หลังจากการกำหนดค่า web-search เฉพาะของมันและ `GEMINI_API_KEY` ดู
หน้าผู้ให้บริการสำหรับตัวอย่าง
Grok ยังสามารถนำโปรไฟล์การยืนยันตัวตน xAI OAuth จาก `openclaw models auth login
--provider xai --method oauth` มาใช้ซ้ำได้; การกำหนดค่าคีย์ API ยังคงเป็น fallback

`tools.web.search.provider` ถูกตรวจสอบกับ id ผู้ให้บริการ web-search
ที่ประกาศโดย manifest ของ Plugin ที่รวมมาให้และที่ติดตั้งอยู่ การพิมพ์ผิด เช่น `"brvae"`
จะทำให้การตรวจสอบการกำหนดค่าล้มเหลวแทนที่จะ fallback กลับไปใช้การตรวจจับอัตโนมัติอย่างเงียบๆ หาก
ผู้ให้บริการที่กำหนดค่าไว้มีเพียงหลักฐาน Plugin ที่ค้างอยู่ เช่น บล็อก
`plugins.entries.<plugin>` ที่เหลืออยู่หลังถอนการติดตั้ง Plugin ภายนอกของบุคคลที่สาม
OpenClaw จะรักษาการเริ่มต้นให้ทนทานและรายงานคำเตือนเพื่อให้คุณติดตั้ง
Plugin ใหม่หรือรัน `openclaw doctor --fix` เพื่อล้างการกำหนดค่าที่ค้างอยู่

การเลือกผู้ให้บริการ fallback ของ `web_fetch` แยกต่างหาก:

- เลือกด้วย `tools.web.fetch.provider`
- หรือละเว้นฟิลด์นั้นและให้ OpenClaw ตรวจจับผู้ให้บริการ web-fetch รายแรกที่พร้อม
  จากข้อมูลรับรองที่กำหนดค่าไว้โดยอัตโนมัติ
- `web_fetch` แบบไม่อยู่ในแซนด์บ็อกซ์สามารถใช้ผู้ให้บริการจาก Plugin ที่ติดตั้งอยู่ซึ่งประกาศ
  `contracts.webFetchProviders`; fetch แบบแซนด์บ็อกซ์อนุญาตผู้ให้บริการที่รวมมาให้และ
  การติดตั้ง Plugin ทางการที่ยืนยันแล้ว แต่ไม่รวม Plugin ภายนอกของบุคคลที่สาม
- Plugin Firecrawl ทางการให้ fallback ของ web-fetch ซึ่งกำหนดค่าอยู่ภายใต้
  `plugins.entries.firecrawl.config.webFetch.*`

เมื่อคุณเลือก **Kimi** ระหว่าง `openclaw onboard` หรือ
`openclaw configure --section web` OpenClaw ยังสามารถถามถึง:

- ภูมิภาค API ของ Moonshot (`https://api.moonshot.ai/v1` หรือ `https://api.moonshot.cn/v1`)
- โมเดล web-search เริ่มต้นของ Kimi (ค่าเริ่มต้นคือ `kimi-k2.6`)

สำหรับ `x_search` ให้กำหนดค่า `plugins.entries.xai.config.xSearch.*` มันใช้
โปรไฟล์การยืนยันตัวตน xAI เดียวกับแชต หรือข้อมูลรับรอง `XAI_API_KEY` / web-search ของ Plugin
ที่ใช้โดย Grok web search
การกำหนดค่าเดิม `tools.web.x_search.*` จะถูกย้ายอัตโนมัติโดย `openclaw doctor --fix`
เมื่อคุณเลือก Grok ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web`
OpenClaw ยังสามารถเสนอการตั้งค่า `x_search` แบบไม่บังคับด้วยข้อมูลรับรองเดียวกัน
นี่เป็นขั้นตอนต่อเนื่องแยกต่างหากภายในเส้นทาง Grok ไม่ใช่ตัวเลือกผู้ให้บริการ web-search
ระดับบนสุดแยกต่างหาก หากคุณเลือกผู้ให้บริการอื่น OpenClaw จะไม่
แสดงพรอมป์ `x_search`

### การจัดเก็บคีย์ API

<Tabs>
  <Tab title="ไฟล์กำหนดค่า">
    รัน `openclaw configure --section web` หรือตั้งค่าคีย์โดยตรง:

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

    สำหรับการติดตั้ง gateway ให้วางไว้ใน `~/.openclaw/.env`
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
| `search_lang`         | รหัสภาษาการค้นหา (เฉพาะ Brave)                     |
| `freshness`           | ตัวกรองเวลา: `day`, `week`, `month`, หรือ `year`        |
| `date_after`          | ผลลัพธ์หลังวันที่นี้ (YYYY-MM-DD)                  |
| `date_before`         | ผลลัพธ์ก่อนวันที่นี้ (YYYY-MM-DD)                 |
| `ui_lang`             | รหัสภาษา UI (เฉพาะ Brave)                         |
| `domain_filter`       | อาร์เรย์ allowlist/denylist ของโดเมน (เฉพาะ Perplexity)     |
| `max_tokens`          | งบประมาณเนื้อหารวม ค่าเริ่มต้น 25000 (เฉพาะ Perplexity) |
| `max_tokens_per_page` | ขีดจำกัดโทเคนต่อหน้า ค่าเริ่มต้น 2048 (เฉพาะ Perplexity)  |

<Warning>
  พารามิเตอร์บางตัวใช้ไม่ได้กับผู้ให้บริการทุกเจ้า โหมด `llm-context` ของ Brave
  ปฏิเสธ `ui_lang`; `date_before` ยังต้องใช้ `date_after` ด้วย เพราะช่วง
  freshness แบบกำหนดเองของ Brave ต้องมีทั้งวันที่เริ่มต้นและสิ้นสุด
  Gemini, Grok และ Kimi ส่งคืนคำตอบสังเคราะห์หนึ่งรายการพร้อมการอ้างอิง พวกมัน
  ยอมรับ `count` เพื่อความเข้ากันได้กับเครื่องมือร่วม แต่ไม่ได้เปลี่ยนรูปแบบ
  คำตอบที่มีแหล่งอ้างอิง Gemini ถือว่า freshness `day` เป็นคำใบ้เรื่องความใหม่; ค่า
  freshness ที่กว้างกว่าและวันที่ที่ระบุชัดจะตั้งค่าช่วงเวลาของ Google Search grounding
  Perplexity มีพฤติกรรมเดียวกันเมื่อคุณใช้เส้นทางความเข้ากันได้ของ Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` หรือ `OPENROUTER_API_KEY`)
  SearXNG ยอมรับ `http://` เฉพาะสำหรับโฮสต์เครือข่าย private หรือ loopback ที่เชื่อถือได้เท่านั้น;
  endpoint SearXNG สาธารณะต้องใช้ `https://`
  Firecrawl และ Tavily รองรับเฉพาะ `query` และ `count` ผ่าน `web_search`
  -- ใช้เครื่องมือเฉพาะของพวกมันสำหรับตัวเลือกขั้นสูง
</Warning>

## x_search

`x_search` ค้นหาโพสต์ X (เดิมคือ Twitter) โดยใช้ xAI และส่งคืน
คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิง มันยอมรับคำค้นหาภาษาธรรมชาติและ
ตัวกรองแบบมีโครงสร้างที่ไม่บังคับ OpenClaw จะเปิดใช้เครื่องมือ `x_search` ของ xAI ที่มีมาให้
เฉพาะบนคำขอที่ให้บริการการเรียกเครื่องมือนี้เท่านั้น

<Note>
  xAI ระบุในเอกสารว่า `x_search` รองรับการค้นหาด้วยคำสำคัญ, การค้นหาเชิงความหมาย, การค้นหาผู้ใช้
  และการดึง thread สำหรับสถิติ engagement ต่อโพสต์ เช่น repost,
  reply, bookmark หรือ view ให้ใช้การค้นหาแบบเจาะจงสำหรับ URL โพสต์หรือ
  status ID ที่แน่นอนจะดีกว่า การค้นหาด้วยคำสำคัญแบบกว้างอาจพบโพสต์ที่ถูกต้องแต่ส่งคืน
  metadata ต่อโพสต์ที่ไม่ครบถ้วนเท่า รูปแบบที่ดีคือ: หาโพสต์ให้พบก่อน จากนั้น
  รันคำค้นหา `x_search` ครั้งที่สองที่โฟกัสโพสต์นั้นโดยตรง
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
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` โพสต์ไปที่ `<baseUrl>/responses` เมื่อ
`plugins.entries.xai.config.xSearch.baseUrl` ถูกตั้งค่า หากละเว้นฟิลด์นั้น
มันจะ fallback ไปยัง `plugins.entries.xai.config.webSearch.baseUrl` จากนั้นไปยัง
`tools.web.search.grok.baseUrl` เดิม และสุดท้ายไปยัง endpoint xAI สาธารณะ

### พารามิเตอร์ x_search

| พารามิเตอร์                    | คำอธิบาย                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | คำค้นหา (จำเป็น)                                |
| `allowed_x_handles`          | จำกัดผลลัพธ์ไว้เฉพาะแฮนเดิล X ที่ระบุ                 |
| `excluded_x_handles`         | ยกเว้นแฮนเดิล X ที่ระบุ                             |
| `from_date`                  | รวมเฉพาะโพสต์ในวันที่นี้หรือหลังจากวันนี้ (YYYY-MM-DD)  |
| `to_date`                    | รวมเฉพาะโพสต์ในวันที่นี้หรือก่อนหน้านี้ (YYYY-MM-DD) |
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
// สถิติต่อโพสต์: ใช้ URL สถานะหรือ ID สถานะที่แน่นอนเมื่อเป็นไปได้
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## ตัวอย่าง

```javascript
// การค้นหาพื้นฐาน
await web_search({ query: "OpenClaw plugin SDK" });

// การค้นหาเฉพาะภาษาเยอรมัน
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// ผลลัพธ์ล่าสุด (สัปดาห์ที่ผ่านมา)
await web_search({ query: "AI developments", freshness: "week" });

// ช่วงวันที่
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// การกรองโดเมน (เฉพาะ Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## โปรไฟล์เครื่องมือ

หากคุณใช้โปรไฟล์เครื่องมือหรือ allowlist ให้เพิ่ม `web_search`, `x_search` หรือ `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // หรือ: allow: ["group:web"]  (รวม web_search, x_search และ web_fetch)
  },
}
```

## ที่เกี่ยวข้อง

- [Web Fetch](/th/tools/web-fetch) -- ดึงข้อมูล URL และแยกเนื้อหาที่อ่านได้
- [Web Browser](/th/tools/browser) -- การทำงานอัตโนมัติผ่านเบราว์เซอร์เต็มรูปแบบสำหรับไซต์ที่ใช้ JS หนัก
- [Grok Search](/th/tools/grok-search) -- Grok เป็นผู้ให้บริการ `web_search`
- [Ollama Web Search](/th/tools/ollama-search) -- การค้นหาเว็บแบบไม่ต้องใช้คีย์ผ่านโฮสต์ Ollama ของคุณ
