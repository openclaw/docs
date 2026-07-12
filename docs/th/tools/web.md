---
read_when:
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า web_search
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า x_search
    - คุณต้องเลือกผู้ให้บริการค้นหา
    - คุณต้องการทำความเข้าใจการตรวจหาอัตโนมัติและการเลือกผู้ให้บริการ
sidebarTitle: Web Search
summary: web_search, x_search และ web_fetch -- ค้นหาเว็บ ค้นหาโพสต์บน X หรือดึงเนื้อหาของหน้าเว็บ
title: การค้นหาเว็บ
x-i18n:
    generated_at: "2026-07-12T16:52:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` ค้นหาเว็บด้วยผู้ให้บริการที่คุณกำหนดค่าไว้และส่งคืน
ผลลัพธ์ที่ปรับให้อยู่ในรูปแบบมาตรฐาน โดยแคชตามคำค้นหาเป็นเวลา 15 นาที (กำหนดค่าได้) OpenClaw
ยังรวม `x_search` สำหรับโพสต์บน X (เดิมคือ Twitter) และ `web_fetch` สำหรับ
การดึง URL แบบเบาไว้ด้วย `web_fetch` ทำงานในเครื่องเสมอ ส่วน `web_search` จะส่งต่อ
ผ่าน xAI Responses เมื่อใช้ Grok เป็นผู้ให้บริการ และ `x_search` จะใช้
xAI Responses เสมอ

<Info>
  `web_search` เป็นเครื่องมือ HTTP แบบเบา ไม่ใช่ระบบเบราว์เซอร์อัตโนมัติ สำหรับ
  เว็บไซต์ที่ใช้ JS มากหรือจำเป็นต้องเข้าสู่ระบบ ให้ใช้ [เว็บเบราว์เซอร์](/th/tools/browser) สำหรับ
  การดึง URL ที่ระบุ ให้ใช้ [การดึงเว็บ](/th/tools/web-fetch)
</Info>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เลือกผู้ให้บริการ">
    เลือกผู้ให้บริการและดำเนินการตั้งค่าที่จำเป็นให้เสร็จสิ้น ผู้ให้บริการบางราย
    ไม่ต้องใช้คีย์ ส่วนรายอื่นต้องใช้คีย์ API โปรดดูรายละเอียดในหน้า
    ของผู้ให้บริการด้านล่าง
  </Step>
  <Step title="กำหนดค่า">
    ```bash
    openclaw configure --section web
    ```
    คำสั่งนี้จะจัดเก็บผู้ให้บริการและข้อมูลรับรองที่จำเป็น สำหรับผู้ให้บริการ
    ที่ใช้ API คุณสามารถตั้งค่าตัวแปรสภาพแวดล้อมของผู้ให้บริการแทนได้ (ตัวอย่างเช่น
    `BRAVE_API_KEY`) และข้ามขั้นตอนนี้
  </Step>
  <Step title="ใช้งาน">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    สำหรับโพสต์บน X:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## การเลือกผู้ให้บริการ

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/th/tools/brave-search">
    ผลลัพธ์แบบมีโครงสร้างพร้อมข้อความตัดตอน รองรับโหมด `llm-context` และตัวกรองประเทศ/ภาษา มีแพ็กเกจฟรีให้ใช้งาน
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/th/plugins/codex-harness">
    คำตอบที่ AI สังเคราะห์และอิงแหล่งข้อมูลผ่านบัญชีเซิร์ฟเวอร์แอป Codex ของคุณ
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/th/tools/duckduckgo-search">
    ผู้ให้บริการที่ไม่ต้องใช้คีย์ ไม่จำเป็นต้องมีคีย์ API เป็นการผสานการทำงานแบบไม่เป็นทางการที่ใช้ HTML
  </Card>
  <Card title="Exa" icon="brain" href="/th/tools/exa-search">
    การค้นหาแบบโครงข่ายประสาทเทียม + คำสำคัญ พร้อมการแยกเนื้อหา (ส่วนสำคัญ ข้อความ และบทสรุป)
  </Card>
  <Card title="Firecrawl" icon="flame" href="/th/tools/firecrawl">
    ผลลัพธ์แบบมีโครงสร้าง เหมาะที่สุดเมื่อใช้ร่วมกับ `firecrawl_search` และ `firecrawl_scrape` เพื่อแยกข้อมูลเชิงลึก
  </Card>
  <Card title="Gemini" icon="sparkles" href="/th/tools/gemini-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิง โดยอิงข้อมูลจาก Google Search
  </Card>
  <Card title="Grok" icon="zap" href="/th/tools/grok-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิง โดยอิงข้อมูลเว็บจาก xAI
  </Card>
  <Card title="Kimi" icon="moon" href="/th/tools/kimi-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่านการค้นหาเว็บของ Moonshot โดยจะล้มเหลวอย่างชัดเจนเมื่อมีการย้อนกลับไปใช้แชตที่ไม่ได้อิงแหล่งข้อมูล
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/th/tools/minimax-search">
    ผลลัพธ์แบบมีโครงสร้างผ่าน API การค้นหาของ MiniMax Token Plan
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/th/tools/ollama-search">
    ค้นหาผ่านโฮสต์ Ollama ในเครื่องที่เข้าสู่ระบบแล้ว หรือ API ของ Ollama ที่ให้บริการบนโฮสต์
  </Card>
  <Card title="Parallel" icon="layer-group" href="/th/tools/parallel-search">
    Parallel Search API แบบชำระเงิน (`PARALLEL_API_KEY`) พร้อมขีดจำกัดอัตราที่สูงขึ้นและการปรับแต่งตามวัตถุประสงค์
  </Card>
  <Card title="Parallel Search (ฟรี)" icon="layer-group" href="/th/tools/parallel-search">
    เลือกใช้ได้โดยไม่ต้องใช้คีย์ Search MCP ฟรีของ Parallel พร้อมข้อความตัดตอนแบบหนาแน่นที่ปรับให้เหมาะกับ LLM และไม่ต้องใช้คีย์ API
  </Card>
  <Card title="Perplexity" icon="search" href="/th/tools/perplexity-search">
    ผลลัพธ์แบบมีโครงสร้างพร้อมการควบคุมการแยกเนื้อหาและการกรองโดเมน
  </Card>
  <Card title="SearXNG" icon="server" href="/th/tools/searxng-search">
    เมตาเสิร์ชที่โฮสต์เอง ไม่ต้องใช้คีย์ API รวบรวมผลลัพธ์จาก Google, Bing, DuckDuckGo และแหล่งอื่น ๆ
  </Card>
  <Card title="Tavily" icon="globe" href="/th/tools/tavily">
    ผลลัพธ์แบบมีโครงสร้างพร้อมระดับความลึกของการค้นหา การกรองหัวข้อ และ `tavily_extract` สำหรับแยกข้อมูลจาก URL
  </Card>
</CardGroup>

### การเปรียบเทียบผู้ให้บริการ

| ผู้ให้บริการ                                         | รูปแบบผลลัพธ์                                                   | ตัวกรอง                                          | คีย์ API                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/th/tools/brave-search)                     | ข้อความตัดตอนแบบมีโครงสร้าง                                            | ประเทศ ภาษา เวลา โหมด `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/th/plugins/codex-harness)    | AI สังเคราะห์ + URL แหล่งข้อมูล                                   | โดเมน ขนาดบริบท ตำแหน่งที่ตั้งของผู้ใช้             | ไม่มี ใช้การเข้าสู่ระบบ Codex/OpenAI                                                         |
| [DuckDuckGo](/th/tools/duckduckgo-search)           | ข้อความตัดตอนแบบมีโครงสร้าง                                            | --                                               | ไม่มี (ไม่ต้องใช้คีย์)                                                                         |
| [Exa](/th/tools/exa-search)                         | มีโครงสร้าง + แยกเนื้อหาแล้ว                                         | โหมดโครงข่ายประสาทเทียม/คำสำคัญ วันที่ การแยกเนื้อหา    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/th/tools/firecrawl)                    | ข้อความตัดตอนแบบมีโครงสร้าง                                            | ผ่านเครื่องมือ `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/th/tools/gemini-search)                   | AI สังเคราะห์ + การอ้างอิง                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/th/tools/grok-search)                       | AI สังเคราะห์ + การอ้างอิง                                     | --                                               | xAI OAuth, `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/th/tools/kimi-search)                       | AI สังเคราะห์ + การอ้างอิง; ล้มเหลวเมื่อย้อนกลับไปใช้แชตที่ไม่ได้อิงแหล่งข้อมูล | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/th/tools/minimax-search)          | ข้อความตัดตอนแบบมีโครงสร้าง                                            | ภูมิภาค (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/th/tools/ollama-search)        | ข้อความตัดตอนแบบมีโครงสร้าง                                            | --                                               | ไม่มีสำหรับโฮสต์ในเครื่องที่เข้าสู่ระบบแล้ว; ใช้ `OLLAMA_API_KEY` สำหรับการค้นหาโดยตรงผ่าน `https://ollama.com` |
| [Parallel](/th/tools/parallel-search)               | ข้อความตัดตอนแบบหนาแน่นที่จัดอันดับสำหรับบริบท LLM                          | --                                               | `PARALLEL_API_KEY` (ชำระเงิน)                                                               |
| [Parallel Search (ฟรี)](/th/tools/parallel-search) | ข้อความตัดตอนแบบหนาแน่นที่จัดอันดับสำหรับบริบท LLM                          | --                                               | ไม่มี (Search MCP ฟรี)                                                                  |
| [Perplexity](/th/tools/perplexity-search)           | ข้อความตัดตอนแบบมีโครงสร้าง                                            | ประเทศ ภาษา เวลา โดเมน ขีดจำกัดเนื้อหา | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/th/tools/searxng-search)                 | ข้อความตัดตอนแบบมีโครงสร้าง                                            | หมวดหมู่ ภาษา                             | ไม่มี (โฮสต์เอง)                                                                      |
| [Tavily](/th/tools/tavily)                          | ข้อความตัดตอนแบบมีโครงสร้าง                                            | ผ่านเครื่องมือ `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## การตรวจหาอัตโนมัติ

รายชื่อผู้ให้บริการในเอกสารและขั้นตอนการตั้งค่าจะเรียงตามตัวอักษร การตรวจหาอัตโนมัติใช้
ลำดับความสำคัญคงที่แยกต่างหาก และจะเลือกเฉพาะผู้ให้บริการที่ต้องใช้
ข้อมูลรับรอง (`requiresCredential !== false`) เมื่อพบว่ามีการกำหนดค่าไว้ หาก
ไม่ได้ตั้งค่า `provider` OpenClaw จะตรวจสอบผู้ให้บริการตามลำดับต่อไปนี้และใช้
รายแรกที่พร้อมใช้งาน:

ผู้ให้บริการที่ใช้ API ก่อน:

1. **Brave** -- `BRAVE_API_KEY` หรือ `plugins.entries.brave.config.webSearch.apiKey` (ลำดับ 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` หรือ `plugins.entries.minimax.config.webSearch.apiKey` (ลำดับ 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` หรือ `models.providers.google.apiKey` (ลำดับ 20)
4. **Grok** -- xAI OAuth, `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey` (ลำดับ 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` หรือ `plugins.entries.moonshot.config.webSearch.apiKey` (ลำดับ 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` หรือ `plugins.entries.perplexity.config.webSearch.apiKey` (ลำดับ 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webSearch.apiKey` (ลำดับ 60)
8. **Exa** -- `EXA_API_KEY` หรือ `plugins.entries.exa.config.webSearch.apiKey`; `plugins.entries.exa.config.webSearch.baseUrl` ซึ่งเป็นตัวเลือกจะเขียนทับปลายทาง Exa (ลำดับ 65)
9. **Tavily** -- `TAVILY_API_KEY` หรือ `plugins.entries.tavily.config.webSearch.apiKey` (ลำดับ 70)
10. **Parallel** -- Parallel Search API แบบชำระเงินผ่าน `PARALLEL_API_KEY` หรือ `plugins.entries.parallel.config.webSearch.apiKey`; `plugins.entries.parallel.config.webSearch.baseUrl` ซึ่งเป็นตัวเลือกจะเขียนทับปลายทาง (ลำดับ 75)

จากนั้นจึงเป็นผู้ให้บริการปลายทางที่กำหนดค่าไว้:

11. **SearXNG** -- `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl` (ลำดับ 200)

ผู้ให้บริการที่ไม่ต้องใช้คีย์ เช่น **Parallel Search (ฟรี)**, **DuckDuckGo**,
**Ollama Web Search** และ **Codex Hosted Search** จะไม่ชนะการตรวจหาอัตโนมัติ
แม้ว่าจะมีค่าลำดับภายในก็ตาม ระบบจะใช้ผู้ให้บริการเหล่านี้เฉพาะเมื่อคุณ
เลือกอย่างชัดเจนด้วย `tools.web.search.provider` หรือผ่าน
`openclaw configure --section web` OpenClaw จะไม่ส่งคำค้นหา
`web_search` ที่ระบบจัดการไปยังผู้ให้บริการที่ไม่ต้องใช้คีย์ เพียงเพราะไม่มีการกำหนดค่า
ผู้ให้บริการที่ใช้ API

โมเดล OpenAI Responses เป็นข้อยกเว้น: ขณะที่ยังไม่ได้ตั้งค่า `tools.web.search.provider`
โมเดลเหล่านี้จะใช้การค้นหาเว็บแบบเนทีฟของ OpenAI แทนผู้ให้บริการที่ระบบจัดการ
ข้างต้น (ดูด้านล่าง) ตั้งค่า `tools.web.search.provider` เป็น
`parallel-free` (หรือผู้ให้บริการรายอื่น) เพื่อส่งต่อผ่านเส้นทางที่ระบบจัดการ
แทน

<Note>
  ฟิลด์คีย์ของผู้ให้บริการทั้งหมดรองรับออบเจ็กต์ SecretRef SecretRef ที่จำกัดขอบเขตอยู่ใน Plugin
  ภายใต้ `plugins.entries.<plugin>.config.webSearch.apiKey` จะได้รับการแก้ค่าให้แก่
  ผู้ให้บริการค้นหาเว็บที่ใช้ API ซึ่งติดตั้งไว้ รวมถึง Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity และ Tavily
  ไม่ว่าจะเลือกผู้ให้บริการอย่างชัดเจนผ่าน `tools.web.search.provider` หรือ
  เลือกผ่านการตรวจหาอัตโนมัติ ในโหมดตรวจหาอัตโนมัติ OpenClaw จะแก้ค่าเฉพาะ
  คีย์ของผู้ให้บริการที่เลือกเท่านั้น ส่วน SecretRef ที่ไม่ได้เลือกจะยังคงไม่ทำงาน คุณจึงสามารถ
  กำหนดค่าผู้ให้บริการหลายรายไว้ได้โดยไม่ต้องเสียต้นทุนการแก้ค่าสำหรับ
  รายที่คุณไม่ได้ใช้งาน
</Note>

## การค้นหาเว็บแบบเนทีฟของ OpenAI

โมเดล OpenAI Responses โดยตรง (`api: "openai-responses"`, ผู้ให้บริการ `openai`,
ไม่มี URL ฐานหรือใช้ URL ฐาน OpenAI API อย่างเป็นทางการ) จะใช้เครื่องมือ
`web_search` แบบโฮสต์ของ OpenAI โดยอัตโนมัติเมื่อเปิดใช้การค้นหาเว็บของ OpenClaw
และไม่ได้กำหนดผู้ให้บริการแบบจัดการไว้ตายตัว ลักษณะการทำงานนี้เป็นความรับผิดชอบของ
ผู้ให้บริการใน Plugin OpenAI ที่รวมมาให้ และไม่ใช้กับ URL ฐานของพร็อกซีที่เข้ากันได้
กับ OpenAI หรือเส้นทาง Azure ตั้งค่า `tools.web.search.provider` เป็นผู้ให้บริการอื่น
เช่น `brave` เพื่อคงการใช้เครื่องมือ `web_search` แบบจัดการสำหรับโมเดล OpenAI
หรือตั้งค่า `tools.web.search.enabled: false` เพื่อปิดทั้งการค้นหาแบบจัดการและ
การค้นหาแบบเนทีฟของ OpenAI

## การค้นหาเว็บแบบเนทีฟของ Codex

รันไทม์ app-server ของ Codex จะใช้เครื่องมือ `web_search` แบบโฮสต์ของ Codex
โดยอัตโนมัติเมื่อเปิดใช้การค้นหาเว็บและไม่ได้เลือกผู้ให้บริการแบบจัดการ
การค้นหาแบบโฮสต์เนทีฟและเครื่องมือไดนามิก `web_search` แบบจัดการของ OpenClaw
ไม่สามารถใช้พร้อมกันได้ ดังนั้นการค้นหาแบบจัดการจึงไม่สามารถข้ามข้อจำกัดโดเมน
ของเครื่องมือเนทีฟได้ OpenClaw จะใช้เครื่องมือแบบจัดการเมื่อการค้นหาแบบโฮสต์
ไม่พร้อมใช้งาน ถูกปิดอย่างชัดเจน หรือถูกแทนที่ด้วยผู้ให้บริการแบบจัดการที่เลือกไว้
OpenClaw จะปิดส่วนขยาย `web.run` แบบสแตนด์อโลนของ Codex ไว้
(`features.standalone_web_search: false`) เนื่องจากทราฟฟิก app-server
ในระบบใช้งานจริงปฏิเสธเนมสเปซ `web` ที่ผู้ใช้กำหนดเอง

- กำหนดค่าการค้นหาแบบเนทีฟภายใต้ `tools.web.search.openaiCodex`
- ตั้งค่า `tools.web.search.provider: "codex"` เพื่อจัดเตรียม Codex Hosted Search
  เป็นผู้ให้บริการ `web_search` แบบจัดการสำหรับโมเดลแม่ใด ๆ การเรียกแต่ละครั้ง
  จะทำงานเป็นรอบ app-server ของ Codex แบบชั่วคราวที่มีขอบเขตจำกัด และจะล้มเหลว
  หาก Codex ไม่ส่งออกรายการ `webSearch` แบบโฮสต์
- `mode: "cached"` เป็นค่ากำหนดเริ่มต้น แต่ Codex จะแปลงค่านี้เป็นการเข้าถึง
  ภายนอกแบบสดสำหรับรอบ app-server ที่ไม่ถูกจำกัด ให้ตั้งค่า `"live"` เพื่อขอ
  การเข้าถึงแบบสดอย่างชัดเจน
- ตั้งค่า `tools.web.search.provider` เป็นผู้ให้บริการแบบจัดการ เช่น `brave`
  เพื่อใช้ `web_search` แบบจัดการของ OpenClaw แทน
- ตั้งค่า `tools.web.search.openaiCodex.enabled: false` เพื่อไม่ใช้การค้นหา
  แบบโฮสต์โดย Codex โดยผู้ให้บริการแบบจัดการรายอื่นยังคงพร้อมใช้งาน
- การจำกัดพื้นผิวเครื่องมือเนทีฟของ Codex จะทำให้ `web_search` แบบจัดการ
  ยังคงพร้อมใช้งานด้วย
- เมื่อตั้งค่า `allowedDomains` การใช้เครื่องมือแบบจัดการเป็นทางเลือกสำรอง
  โดยอัตโนมัติจะล้มเหลวแบบปิดหากการค้นหาแบบโฮสต์ไม่พร้อมใช้งาน เพื่อไม่ให้ข้าม
  รายการอนุญาตของเครื่องมือเนทีฟได้
- การทำงานเฉพาะ LLM ที่ปิดใช้เครื่องมือจะปิดทั้งการค้นหาแบบเนทีฟและแบบจัดการ
- `tools.web.search.enabled: false` จะปิดทั้งการค้นหาแบบจัดการและแบบเนทีฟ

การเปลี่ยนแปลงนโยบายการค้นหาของ Codex ที่มีผลแบบถาวรจะเริ่มเธรดที่ผูกใหม่
เพื่อไม่ให้เธรด app-server ที่โหลดไว้แล้วคงสิทธิ์เข้าถึงการค้นหาแบบโฮสต์ที่ล้าสมัย
ข้อจำกัดชั่วคราวต่อรอบจะใช้เธรดจำกัดสิทธิ์ชั่วคราวและคงการผูกเดิมไว้สำหรับ
การทำงานต่อในภายหลัง

ทราฟฟิก OpenAI ChatGPT Responses โดยตรงสามารถใช้เครื่องมือ `web_search`
แบบโฮสต์ของ OpenAI ได้เช่นกัน เส้นทางแยกนี้ยังคงต้องเลือกใช้ผ่าน
`tools.web.search.openaiCodex.enabled: true` และใช้ได้เฉพาะกับโมเดล
`openai/*` ที่เข้าเกณฑ์ซึ่งใช้ `api: "openai-chatgpt-responses"`

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

สำหรับรันไทม์และผู้ให้บริการที่ไม่รองรับการค้นหาแบบเนทีฟของ Codex นั้น Codex
สามารถใช้ `web_search` แบบจัดการเป็นทางเลือกสำรองผ่านเนมสเปซเครื่องมือไดนามิก
ของ OpenClaw ได้ ให้ใช้ผู้ให้บริการแบบจัดการอย่างชัดเจนเมื่อคุณต้องการ
การควบคุมเครือข่ายเฉพาะผู้ให้บริการของ OpenClaw แทนการค้นหาแบบโฮสต์โดย Codex

การเลือก `provider: "codex"` จะเปิดใช้ Plugin `codex` ที่รวมมาให้ และใช้ข้อจำกัด
`tools.web.search.openaiCodex` เดียวกับที่แสดงข้างต้น ให้ยืนยันตัวตนกับ
app-server ของ Codex ก่อนด้วย `openclaw models auth login --provider openai`
เอเจนต์แม่สามารถใช้โมเดลหรือรันไทม์ใดก็ได้ มีเพียงเวิร์กเกอร์ค้นหาแบบมีขอบเขต
จำกัดเท่านั้นที่ทำงานผ่าน Codex

## ความปลอดภัยของเครือข่าย

การเรียกผู้ให้บริการ `web_search` แบบ HTTP ที่จัดการโดยระบบจะใช้เส้นทางดึงข้อมูล
ที่มีการป้องกันของ OpenClaw โดยจำกัดขอบเขตไว้ที่ชื่อโฮสต์ของผู้ให้บริการปัจจุบัน
สำหรับชื่อโฮสต์นั้นเท่านั้น OpenClaw อนุญาตคำตอบ DNS แบบ IP จำลองของ Surge,
Clash และ sing-box ในช่วง `198.18.0.0/15` และ `fc00::/7` ปลายทางส่วนตัว,
loopback, link-local และปลายทางเมทาดาทาอื่น ๆ ยังคงถูกบล็อก Codex Hosted Search
เป็นข้อยกเว้น โดยเวิร์กเกอร์แบบมีขอบเขตจำกัดจะมอบหมายการเข้าถึงเครือข่ายให้กับ
เครื่องมือ `web_search` แบบโฮสต์ของ app-server ของ Codex

การอนุญาตอัตโนมัตินี้ไม่ใช้กับ URL `web_fetch` ใด ๆ โดยพลการ สำหรับ `web_fetch`
ให้เปิดใช้ `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` และ
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` อย่างชัดเจน เฉพาะเมื่อ
พร็อกซีที่เชื่อถือได้ของคุณเป็นเจ้าของช่วงสังเคราะห์เหล่านั้น

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
`plugins.entries.<plugin>.config.webSearch.*` นอกจากนี้ Gemini ยังสามารถใช้
`models.providers.google.apiKey` และ `models.providers.google.baseUrl`
ซ้ำเป็นทางเลือกสำรองที่มีลำดับความสำคัญต่ำกว่า หลังจากการกำหนดค่าการค้นหาเว็บ
เฉพาะของตนและ `GEMINI_API_KEY` โปรดดูตัวอย่างในหน้าของผู้ให้บริการ
Grok ยังสามารถใช้โปรไฟล์การยืนยันตัวตน OAuth ของ xAI ซ้ำจาก
`openclaw models auth login --provider xai --method oauth` โดยการกำหนดค่าคีย์ API
ยังคงเป็นทางเลือกสำรอง

`tools.web.search.provider` จะได้รับการตรวจสอบกับรหัสผู้ให้บริการค้นหาเว็บ
ที่ประกาศโดยแมนิเฟสต์ของ Plugin ที่รวมมาให้และที่ติดตั้งไว้ การพิมพ์ผิด เช่น
`"brvae"` จะทำให้การตรวจสอบการกำหนดค่าล้มเหลว แทนที่จะย้อนกลับไปใช้
การตรวจหาอัตโนมัติโดยไม่แจ้ง หากผู้ให้บริการที่กำหนดค่าไว้มีเพียงหลักฐาน Plugin
ที่ล้าสมัย เช่น บล็อก `plugins.entries.<plugin>` ที่เหลืออยู่หลังถอนการติดตั้ง
Plugin ของบุคคลที่สาม OpenClaw จะยังคงเริ่มทำงานได้อย่างทนทานและรายงานคำเตือน
เพื่อให้คุณติดตั้ง Plugin ใหม่หรือเรียกใช้ `openclaw doctor --fix`
เพื่อล้างการกำหนดค่าที่ล้าสมัย

การเลือกผู้ให้บริการสำรองสำหรับ `web_fetch` แยกจากกัน:

- เลือกด้วย `tools.web.fetch.provider`
- หรือละฟิลด์นั้นไว้ แล้วให้ OpenClaw ตรวจหาผู้ให้บริการ web-fetch รายแรก
  ที่พร้อมใช้งานจากข้อมูลประจำตัวที่กำหนดค่าไว้โดยอัตโนมัติ
- `web_fetch` ที่ไม่ทำงานในแซนด์บ็อกซ์สามารถใช้ผู้ให้บริการจาก Plugin
  ที่ติดตั้งไว้ซึ่งประกาศ `contracts.webFetchProviders` ส่วนการดึงข้อมูล
  ในแซนด์บ็อกซ์อนุญาตผู้ให้บริการที่รวมมาให้และการติดตั้ง Plugin อย่างเป็นทางการ
  ที่ผ่านการตรวจสอบ แต่ไม่รวม Plugin ภายนอกจากบุคคลที่สาม
- ปัจจุบัน Plugin Firecrawl อย่างเป็นทางการเป็นผู้สนับสนุน
  `webFetchProviders` เพียงรายเดียวที่รวมมาให้ โดยกำหนดค่าภายใต้
  `plugins.entries.firecrawl.config.webFetch.*`

เมื่อคุณเลือก **Kimi** ระหว่าง `openclaw onboard` หรือ
`openclaw configure --section web` OpenClaw อาจถามข้อมูลต่อไปนี้ด้วย:

- ภูมิภาค Moonshot API (`https://api.moonshot.ai/v1` หรือ `https://api.moonshot.cn/v1`)
- โมเดลค้นหาเว็บ Kimi เริ่มต้น (ค่าเริ่มต้นคือ `kimi-k2.6`)

สำหรับ `x_search` ให้กำหนดค่า `plugins.entries.xai.config.xSearch.*` โดยใช้
โปรไฟล์การยืนยันตัวตน xAI เดียวกับแชต หรือข้อมูลประจำตัว `XAI_API_KEY` /
การค้นหาเว็บของ Plugin ที่ใช้โดยการค้นหาเว็บของ Grok
การกำหนดค่าเดิม `tools.web.x_search.*` จะถูกย้ายโดยอัตโนมัติด้วย
`openclaw doctor --fix`
เมื่อคุณเลือก Grok ระหว่าง `openclaw onboard` หรือ
`openclaw configure --section web` OpenClaw จะเสนอการตั้งค่า `x_search`
แบบไม่บังคับด้วยข้อมูลประจำตัวเดียวกันทันทีหลังการตั้งค่า Grok เสร็จสิ้น
นี่เป็นขั้นตอนต่อเนื่องแยกต่างหากภายในเส้นทาง Grok ไม่ใช่ตัวเลือกผู้ให้บริการ
ค้นหาเว็บระดับบนสุดที่แยกต่างหาก หากคุณเลือกผู้ให้บริการอื่น OpenClaw
จะไม่แสดงข้อความแจ้ง `x_search`

### การจัดเก็บคีย์ API

<Tabs>
  <Tab title="ไฟล์การกำหนดค่า">
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

    สำหรับการติดตั้ง Gateway ให้ใส่ค่าไว้ใน `~/.openclaw/.env`
    โปรดดู [ตัวแปรสภาพแวดล้อม](/th/help/faq#env-vars-and-env-loading)

  </Tab>
</Tabs>

## พารามิเตอร์เครื่องมือ

| พารามิเตอร์          | คำอธิบาย                                                                  |
| --------------------- | ------------------------------------------------------------------------- |
| `query`               | คำค้นหา (จำเป็น)                                                          |
| `count`               | จำนวนผลลัพธ์ที่ส่งคืน (1-10, ค่าเริ่มต้น: 5)                              |
| `country`             | รหัสประเทศ ISO แบบ 2 ตัวอักษร (เช่น "US", "DE")                           |
| `language`            | รหัสภาษา ISO 639-1 (เช่น "en", "de")                                      |
| `search_lang`         | รหัสภาษาสำหรับการค้นหา (เฉพาะ Brave)                                     |
| `freshness`           | ตัวกรองเวลา: `day`, `week`, `month` หรือ `year`                           |
| `date_after`          | ผลลัพธ์หลังวันที่นี้ (YYYY-MM-DD)                                         |
| `date_before`         | ผลลัพธ์ก่อนวันที่นี้ (YYYY-MM-DD)                                         |
| `ui_lang`             | รหัสภาษา UI (เฉพาะ Brave)                                                 |
| `domain_filter`       | อาร์เรย์รายการอนุญาต/ปฏิเสธโดเมน (เฉพาะ Perplexity)                      |
| `max_tokens`          | งบประมาณโทเค็นเนื้อหารวม เฉพาะ Perplexity Search API แบบเนทีฟ             |
| `max_tokens_per_page` | ขีดจำกัดโทเค็นสำหรับการสกัดข้อมูลต่อหน้า เฉพาะ Perplexity Search API แบบเนทีฟ |

<Warning>
  พารามิเตอร์บางรายการไม่ทำงานกับผู้ให้บริการทุกราย โหมด `llm-context`
  ของ Brave ปฏิเสธ `ui_lang` และ `date_before` ยังต้องใช้ร่วมกับ `date_after`
  เนื่องจากช่วงความสดใหม่แบบกำหนดเองของ Brave ต้องระบุทั้งวันที่เริ่มต้นและสิ้นสุด
  Gemini, Grok และ Kimi จะส่งคืนคำตอบสังเคราะห์หนึ่งรายการพร้อมการอ้างอิง
  ผู้ให้บริการเหล่านี้ยอมรับ `count` เพื่อให้เข้ากันได้กับเครื่องมือร่วม
  แต่ค่านี้ไม่เปลี่ยนรูปแบบของคำตอบที่อิงแหล่งข้อมูล Gemini ถือว่าความสดใหม่
  แบบ `day` เป็นคำแนะนำด้านความใหม่ ส่วนค่าความสดใหม่ที่กว้างกว่าและวันที่
  ที่ระบุชัดเจนจะกำหนดช่วงเวลาสำหรับการอิงข้อมูลจาก Google Search
  Perplexity ทำงานในลักษณะเดียวกันเมื่อคุณใช้เส้นทางความเข้ากันได้
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` หรือ `OPENROUTER_API_KEY`) และเส้นทางนั้นยังไม่รองรับ `max_tokens`
  กับ `max_tokens_per_page`
  SearXNG ยอมรับ `http://` เฉพาะสำหรับโฮสต์เครือข่ายส่วนตัวหรือ loopback
  ที่เชื่อถือได้ ส่วนปลายทาง SearXNG สาธารณะต้องใช้ `https://`
  Firecrawl และ Tavily รองรับเฉพาะ `query` และ `count` ผ่าน `web_search`
  เท่านั้น โปรดใช้เครื่องมือเฉพาะของแต่ละบริการสำหรับตัวเลือกขั้นสูง
</Warning>

## x_search

`x_search` ค้นหาโพสต์บน X (เดิมคือ Twitter) โดยใช้ xAI และส่งคืนคำตอบ
ที่ AI สังเคราะห์พร้อมการอ้างอิง เครื่องมือนี้ยอมรับคำค้นหาภาษาธรรมชาติและ
ตัวกรองแบบมีโครงสร้างที่ไม่บังคับ OpenClaw จะสร้างเครื่องมือ `x_search`
ในตัวของ xAI แยกตามแต่ละคำขอ แทนการลงทะเบียนไว้อย่างถาวร ดังนั้นเครื่องมือนี้
จึงทำงานเฉพาะในรอบที่เรียกใช้จริงเท่านั้น

<Warning>
  `x_search` ทำงานบนเซิร์ฟเวอร์ของ xAI โดย xAI คิดค่าบริการ $5 ต่อการเรียก
  เครื่องมือ 1,000 ครั้ง บวกโทเค็นอินพุตและเอาต์พุตของโมเดล
</Warning>

<Note>
  เอกสารของ xAI ระบุว่า `x_search` รองรับการค้นหาด้วยคำสำคัญ การค้นหา
  เชิงความหมาย การค้นหาผู้ใช้ และการดึงเธรด สำหรับสถิติการมีส่วนร่วม
  รายโพสต์ เช่น การรีโพสต์ การตอบกลับ บุ๊กมาร์ก หรือยอดดู ควรใช้การค้นหา
  แบบเจาะจงด้วย URL ของโพสต์หรือรหัสสถานะที่แน่นอน การค้นหาด้วยคำสำคัญ
  แบบกว้างอาจพบโพสต์ที่ถูกต้อง แต่ส่งคืนเมทาดาทารายโพสต์ได้ไม่ครบถ้วน
  รูปแบบที่เหมาะสมคือ ค้นหาโพสต์ก่อน แล้วจึงเรียกคำค้นหา `x_search`
  ครั้งที่สองโดยมุ่งเน้นโพสต์นั้นโดยเฉพาะ
</Note>

### การกำหนดค่า x_search

เมื่อไม่ได้ระบุ `enabled` ระบบจะแสดง `x_search` เฉพาะเมื่อผู้ให้บริการของโมเดลที่ใช้งานอยู่เป็น `xai` และสามารถตรวจพบข้อมูลประจำตัว xAI ได้เท่านั้น สำหรับโมเดลที่ใช้งานอยู่ซึ่งทราบว่าใช้ผู้ให้บริการที่ไม่ใช่ xAI ให้ตั้งค่า `plugins.entries.xai.config.xSearch.enabled` เป็น `true` เพื่อเลือกใช้ข้ามผู้ให้บริการ หากไม่มีหรือไม่สามารถระบุผู้ให้บริการของโมเดลที่ใช้งานอยู่ได้ เครื่องมือจะยังคงถูกซ่อน ตั้งค่า `enabled` เป็น `false` เพื่อปิดใช้งานสำหรับผู้ให้บริการทั้งหมด จำเป็นต้องมีข้อมูลประจำตัว xAI เสมอ

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // required for a known non-xAI model provider
            model: "grok-4.3",
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

`x_search` จะส่งคำขอไปยัง `<baseUrl>/responses` เมื่อตั้งค่า `plugins.entries.xai.config.xSearch.baseUrl` หากไม่ได้ระบุฟิลด์ดังกล่าว ระบบจะใช้ `plugins.entries.xai.config.webSearch.baseUrl` เป็นค่าทดแทน ตามด้วย `tools.web.search.grok.baseUrl` แบบเดิม และท้ายที่สุดคือปลายทางสาธารณะของ xAI (`https://api.x.ai/v1`)

### พารามิเตอร์ของ x_search

| พารามิเตอร์                 | คำอธิบาย                                                     |
| ---------------------------- | ------------------------------------------------------------ |
| `query`                      | คำค้นหา (จำเป็น)                                             |
| `allowed_x_handles`          | จำกัดผลลัพธ์ไว้เฉพาะแฮนเดิล X ไม่เกิน 20 รายการ             |
| `excluded_x_handles`         | ยกเว้นแฮนเดิล X ไม่เกิน 20 รายการ                            |
| `from_date`                  | รวมเฉพาะโพสต์ในหรือหลังวันที่นี้ (YYYY-MM-DD)                |
| `to_date`                    | รวมเฉพาะโพสต์ในหรือก่อนวันที่นี้ (YYYY-MM-DD)                |
| `enable_image_understanding` | อนุญาตให้ xAI ตรวจสอบรูปภาพที่แนบมากับโพสต์ที่ตรงกัน         |
| `enable_video_understanding` | อนุญาตให้ xAI ตรวจสอบวิดีโอที่แนบมากับโพสต์ที่ตรงกัน         |

ไม่สามารถใช้ `allowed_x_handles` และ `excluded_x_handles` พร้อมกันได้

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

หากคุณใช้โปรไฟล์เครื่องมือหรือรายการอนุญาต ให้เพิ่ม `web_search`, `x_search` หรือ `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## เนื้อหาที่เกี่ยวข้อง

- [การดึงข้อมูลเว็บ](/th/tools/web-fetch) -- ดึง URL และแยกเนื้อหาที่อ่านได้
- [เว็บเบราว์เซอร์](/th/tools/browser) -- ระบบอัตโนมัติของเบราว์เซอร์แบบเต็มรูปแบบสำหรับเว็บไซต์ที่ใช้ JS อย่างมาก
- [การค้นหาด้วย Grok](/th/tools/grok-search) -- ใช้ Grok เป็นผู้ให้บริการ `web_search`
- [การค้นหาเว็บด้วย Ollama](/th/tools/ollama-search) -- ค้นหาเว็บโดยไม่ต้องใช้คีย์ผ่านโฮสต์ Ollama ของคุณ
