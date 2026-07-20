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
    generated_at: "2026-07-20T06:09:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 997e51064b0cd08d0f30987aa038e2f4a98da22f1094974b45f59c18491bd979
    source_path: tools/web.md
    workflow: 16
---

`web_search` ค้นหาเว็บด้วยผู้ให้บริการที่กำหนดค่าไว้และส่งคืน
ผลลัพธ์ที่ปรับให้อยู่ในรูปแบบมาตรฐาน โดยแคชตามคำค้นหาเป็นเวลา 15 นาที (กำหนดค่าได้) OpenClaw
ยังรวม `x_search` สำหรับโพสต์บน X (เดิมคือ Twitter) และ `web_fetch` สำหรับ
การดึงข้อมูล URL แบบเบาไว้ด้วย `web_fetch` ทำงานภายในเครื่องเสมอ ส่วน `web_search` จะส่งคำขอ
ผ่าน xAI Responses เมื่อใช้ Grok เป็นผู้ให้บริการ และ `x_search` ใช้
xAI Responses เสมอ

<Info>
  `web_search` เป็นเครื่องมือ HTTP แบบเบา ไม่ใช่ระบบควบคุมเบราว์เซอร์อัตโนมัติ สำหรับ
  เว็บไซต์ที่ใช้ JS มากหรือจำเป็นต้องเข้าสู่ระบบ ให้ใช้ [เว็บเบราว์เซอร์](/th/tools/browser) สำหรับ
  การดึงข้อมูลจาก URL ที่ระบุ ให้ใช้ [การดึงข้อมูลเว็บ](/th/tools/web-fetch)
</Info>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เลือกผู้ให้บริการ">
    เลือกผู้ให้บริการและดำเนินการตั้งค่าที่จำเป็นให้เสร็จสมบูรณ์ ผู้ให้บริการบางราย
    ไม่ต้องใช้คีย์ ส่วนรายอื่นต้องใช้คีย์ API ดูรายละเอียดได้จากหน้า
    ผู้ให้บริการด้านล่าง
  </Step>
  <Step title="กำหนดค่า">
    ```bash
    openclaw configure --section web
    ```
    คำสั่งนี้จะจัดเก็บผู้ให้บริการและข้อมูลประจำตัวที่จำเป็น สำหรับผู้ให้บริการที่ใช้
    API สามารถตั้งค่าตัวแปรสภาพแวดล้อมของผู้ให้บริการแทนได้ (ตัวอย่างเช่น
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
    ผลลัพธ์แบบมีโครงสร้างพร้อมข้อความตัดตอน รองรับโหมด `llm-context` และตัวกรองประเทศ/ภาษา มีแพ็กเกจฟรีให้ใช้
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/th/plugins/codex-harness">
    คำตอบที่ AI สังเคราะห์โดยอิงแหล่งข้อมูล ผ่านบัญชี Codex app-server
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/th/tools/duckduckgo-search">
    ผู้ให้บริการที่ไม่ต้องใช้คีย์ ไม่จำเป็นต้องมีคีย์ API เป็นการผสานการทำงานผ่าน HTML อย่างไม่เป็นทางการ
  </Card>
  <Card title="Exa" icon="brain" href="/th/tools/exa-search">
    การค้นหาแบบโครงข่ายประสาท + คีย์เวิร์ด พร้อมการแยกเนื้อหา (ไฮไลต์ ข้อความ และบทสรุป)
  </Card>
  <Card title="Firecrawl" icon="flame" href="/th/tools/firecrawl">
    ผลลัพธ์แบบมีโครงสร้าง เหมาะที่สุดเมื่อใช้ร่วมกับ `firecrawl_search` และ `firecrawl_scrape` เพื่อแยกข้อมูลเชิงลึก
  </Card>
  <Card title="Gemini" icon="sparkles" href="/th/tools/gemini-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิง โดยอิงแหล่งข้อมูลจาก Google Search
  </Card>
  <Card title="Grok" icon="zap" href="/th/tools/grok-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิง โดยอิงแหล่งข้อมูลเว็บจาก xAI
  </Card>
  <Card title="Kimi" icon="moon" href="/th/tools/kimi-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่านการค้นหาเว็บของ Moonshot โดยจะล้มเหลวอย่างชัดเจนเมื่อสำรองไปใช้แชตที่ไม่ได้อิงแหล่งข้อมูล
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/th/tools/minimax-search">
    ผลลัพธ์แบบมีโครงสร้างผ่าน API การค้นหาของ MiniMax Token Plan
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/th/tools/ollama-search">
    ค้นหาผ่านโฮสต์ Ollama ภายในเครื่องที่เข้าสู่ระบบแล้ว หรือ Ollama API แบบโฮสต์
  </Card>
  <Card title="Parallel" icon="layer-group" href="/th/tools/parallel-search">
    Parallel Search API แบบชำระเงิน (`PARALLEL_API_KEY`) ซึ่งมีขีดจำกัดอัตราการใช้งานสูงกว่าและปรับแต่งตามวัตถุประสงค์ได้
  </Card>
  <Card title="Parallel Search (ฟรี)" icon="layer-group" href="/th/tools/parallel-search">
    เลือกใช้ได้โดยไม่ต้องใช้คีย์ Search MCP ฟรีของ Parallel พร้อมข้อความตัดตอนแบบหนาแน่นที่ปรับให้เหมาะกับ LLM และไม่ต้องใช้คีย์ API
  </Card>
  <Card title="Perplexity" icon="search" href="/th/tools/perplexity-search">
    ผลลัพธ์แบบมีโครงสร้าง พร้อมการควบคุมการแยกเนื้อหาและการกรองโดเมน
  </Card>
  <Card title="SearXNG" icon="server" href="/th/tools/searxng-search">
    ระบบค้นหาแบบเมตาที่โฮสต์เอง ไม่ต้องใช้คีย์ API รวมผลลัพธ์จาก Google, Bing, DuckDuckGo และแหล่งอื่น ๆ
  </Card>
  <Card title="Tavily" icon="globe" href="/th/tools/tavily">
    ผลลัพธ์แบบมีโครงสร้าง พร้อมระดับความลึกของการค้นหา การกรองหัวข้อ และ `tavily_extract` สำหรับแยกข้อมูลจาก URL
  </Card>
</CardGroup>

### การเปรียบเทียบผู้ให้บริการ

| ผู้ให้บริการ                                         | รูปแบบผลลัพธ์                                                   | ตัวกรอง                                          | คีย์ API                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/th/tools/brave-search)                     | ข้อความตัดตอนแบบมีโครงสร้าง                                            | ประเทศ ภาษา เวลา โหมด `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/th/plugins/codex-harness)    | AI สังเคราะห์ + URL แหล่งข้อมูล                                   | โดเมน ขนาดบริบท ตำแหน่งที่ตั้งของผู้ใช้             | ไม่มี ใช้การเข้าสู่ระบบ Codex/OpenAI                                                         |
| [DuckDuckGo](/th/tools/duckduckgo-search)           | ข้อความตัดตอนแบบมีโครงสร้าง                                            | --                                               | ไม่มี (ไม่ต้องใช้คีย์)                                                                         |
| [Exa](/th/tools/exa-search)                         | แบบมีโครงสร้าง + เนื้อหาที่แยกแล้ว                                         | โหมดโครงข่ายประสาท/คีย์เวิร์ด วันที่ การแยกเนื้อหา    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/th/tools/firecrawl)                    | ข้อความตัดตอนแบบมีโครงสร้าง                                            | ผ่านเครื่องมือ `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/th/tools/gemini-search)                   | AI สังเคราะห์ + การอ้างอิง                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/th/tools/grok-search)                       | AI สังเคราะห์ + การอ้างอิง                                     | --                                               | xAI OAuth, `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/th/tools/kimi-search)                       | AI สังเคราะห์ + การอ้างอิง; ล้มเหลวเมื่อสำรองไปใช้แชตที่ไม่ได้อิงแหล่งข้อมูล | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/th/tools/minimax-search)          | ข้อความตัดตอนแบบมีโครงสร้าง                                            | ภูมิภาค (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/th/tools/ollama-search)        | ข้อความตัดตอนแบบมีโครงสร้าง                                            | --                                               | ไม่มีสำหรับโฮสต์ภายในเครื่องที่เข้าสู่ระบบแล้ว; `OLLAMA_API_KEY` สำหรับการค้นหา `https://ollama.com` โดยตรง |
| [Parallel](/th/tools/parallel-search)               | ข้อความตัดตอนแบบหนาแน่นที่จัดอันดับสำหรับบริบท LLM                          | --                                               | `PARALLEL_API_KEY` (ชำระเงิน)                                                               |
| [Parallel Search (ฟรี)](/th/tools/parallel-search) | ข้อความตัดตอนแบบหนาแน่นที่จัดอันดับสำหรับบริบท LLM                          | --                                               | ไม่มี (Search MCP ฟรี)                                                                  |
| [Perplexity](/th/tools/perplexity-search)           | ข้อความตัดตอนแบบมีโครงสร้าง                                            | ประเทศ ภาษา เวลา โดเมน ขีดจำกัดเนื้อหา | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/th/tools/searxng-search)                 | ข้อความตัดตอนแบบมีโครงสร้าง                                            | หมวดหมู่ ภาษา                             | ไม่มี (โฮสต์เอง)                                                                      |
| [Tavily](/th/tools/tavily)                          | ข้อความตัดตอนแบบมีโครงสร้าง                                            | ผ่านเครื่องมือ `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## รูปแบบผลลัพธ์

`web_search` ปรับผู้ให้บริการ Plugin ทั้งแบบที่รวมมาให้และแบบภายนอกทุกรายให้อยู่ในรูปแบบมาตรฐานที่ขอบเขต
เครื่องมือหลัก ผู้เรียกจะได้รับรูปแบบปิดเพียงหนึ่งรูปแบบต่อไปนี้เท่านั้น:

```typescript
type WebSearchOutput =
  | {
      kind: "error";
      provider: string;
      error: "provider_error";
      message: string;
      docs?: string;
    }
  | {
      kind: "results";
      provider: string;
      query: string;
      count: number;
      tookMs?: number;
      results: Array<{
        title: string;
        url: string;
        snippet?: string;
        published?: string;
        siteName?: string;
      }>;
      externalContent: {
        untrusted: true;
        source: "web_search";
        wrapped: true;
        provider: string;
      };
      cached?: true;
    }
  | {
      kind: "answer";
      provider: string;
      query: string;
      tookMs?: number;
      content: string;
      citations?: Array<{ url: string; title?: string }>;
      externalContent: {
        untrusted: true;
        source: "web_search";
        wrapped: true;
        provider: string;
      };
      cached?: true;
    }
  | {
      kind: "raw";
      provider: string;
      data: unknown;
    };
```

ผู้ให้บริการแบบมีโครงสร้างใช้ `kind: "results"` ส่วนผู้ให้บริการแบบสังเคราะห์ใช้
`kind: "answer"` ผู้ให้บริการ Plugin ภายนอกที่เพย์โหลดไม่ตรงกับทั้งสองรูปแบบ
จะถูกส่งผ่านตามเดิมเป็น `kind: "raw"` เพื่อความเข้ากันได้ ฟิลด์เฉพาะของผู้ให้บริการ
เช่น คะแนนดิบ ข้อความตัดตอน การค้นหาที่เกี่ยวข้อง ตำแหน่งออฟเซ็ตของการอ้างอิงในข้อความ
รหัสโมเดล หรือข้อมูลเมตาของเซสชัน จะไม่ถูกส่งผ่านในสาขาที่ปรับรูปแบบมาตรฐานแล้ว
ให้ใช้เครื่องมือเฉพาะของผู้ให้บริการเมื่อการตอบกลับที่มีรายละเอียดมากกว่านั้นเป็นส่วนหนึ่งของ
ขั้นตอนการทำงาน

`externalContent.wrapped: true` เป็นเครื่องหมายความน่าเชื่อถือที่ขอบเขตทำให้
เป็นจริงด้วยตัวเอง กล่าวคือ ข้อความจากผู้ให้บริการ (`title`, `snippet`, `siteName`, `content`, ชื่อเรื่องของการอ้างอิง
และ `message` ของข้อผิดพลาด) จะถูกนำบรรทัดกรอบห่อหุ้มที่มีอยู่ก่อนออก แล้ว
ห่อใหม่เพียงครั้งเดียวที่ขอบเขตหลัก ดังนั้นข้อมูลเมตาของผู้ให้บริการจึงปลอมแปลง
เครื่องหมายนี้ไม่ได้ `query` เป็นคำค้นหาที่ร้องขอเสมอ URL ของการอ้างอิงและผลลัพธ์
ต้องแยกวิเคราะห์เป็น http(s) ได้ `published` ต้องมีรูปแบบวันที่ ISO, URL จะถูกส่งออกในรูปแบบมาตรฐาน และ
เพย์โหลดที่มีคีย์ `error` จะถูกรายงานเป็น `kind: "error"` เสมอ โดยเก็บ
รหัสผู้ให้บริการดิบไว้ภายในข้อความที่ห่อแล้ว เพย์โหลดที่ส่งผ่านแบบดิบ
จะคงเครื่องหมายใด ๆ ที่ผู้ให้บริการตั้งไว้

## การตรวจหาอัตโนมัติ

รายชื่อผู้ให้บริการในเอกสารและขั้นตอนการตั้งค่าจะเรียงตามตัวอักษร การตรวจหาอัตโนมัติใช้
ลำดับความสำคัญคงที่แยกต่างหาก และจะเลือกผู้ให้บริการที่ต้องใช้
ข้อมูลประจำตัว (`requiresCredential !== false`) เฉพาะเมื่อตรวจพบว่ามีการกำหนดค่าไว้แล้ว หาก
ไม่ได้ตั้งค่า `provider` OpenClaw จะตรวจสอบผู้ให้บริการตามลำดับต่อไปนี้และใช้
รายแรกที่พร้อมใช้งาน:

ผู้ให้บริการที่ใช้ API ก่อน:

1. **Brave** -- `BRAVE_API_KEY` หรือ `plugins.entries.brave.config.webSearch.apiKey` (ลำดับ 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` หรือ `plugins.entries.minimax.config.webSearch.apiKey` (ลำดับ 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` หรือ `models.providers.google.apiKey` (ลำดับ 20)
4. **Grok** -- OAuth ของ xAI, `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey` (ลำดับ 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` หรือ `plugins.entries.moonshot.config.webSearch.apiKey` (ลำดับ 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` หรือ `plugins.entries.perplexity.config.webSearch.apiKey` (ลำดับ 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webSearch.apiKey` (ลำดับ 60)
8. **Exa** -- `EXA_API_KEY` หรือ `plugins.entries.exa.config.webSearch.apiKey`; `plugins.entries.exa.config.webSearch.baseUrl` ซึ่งไม่บังคับจะแทนที่ปลายทาง Exa (ลำดับ 65)
9. **Tavily** -- `TAVILY_API_KEY` หรือ `plugins.entries.tavily.config.webSearch.apiKey` (ลำดับ 70)
10. **Parallel** -- Parallel Search API แบบชำระเงินผ่าน `PARALLEL_API_KEY` หรือ `plugins.entries.parallel.config.webSearch.apiKey`; `plugins.entries.parallel.config.webSearch.baseUrl` ซึ่งไม่บังคับจะแทนที่ปลายทาง (ลำดับ 75)

จากนั้นเป็นผู้ให้บริการปลายทางที่กำหนดค่าไว้:

11. **SearXNG** -- `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl` (ลำดับ 200)

ผู้ให้บริการที่ไม่ต้องใช้คีย์ เช่น **Parallel Search (ฟรี)**, **DuckDuckGo**,
**Ollama Web Search** และ **Codex Hosted Search** จะไม่ถูกเลือกโดยการตรวจหาอัตโนมัติ
แม้ว่าจะมีค่าลำดับภายในก็ตาม ผู้ให้บริการเหล่านี้จะถูกใช้เฉพาะเมื่อ
เลือกอย่างชัดเจนด้วย `tools.web.search.provider` หรือผ่าน
`openclaw configure --section web` เท่านั้น OpenClaw จะไม่ส่งคำค้น
`web_search` ที่มีการจัดการไปยังผู้ให้บริการที่ไม่ต้องใช้คีย์เพียงเพราะไม่ได้กำหนดค่า
ผู้ให้บริการที่ใช้ API

โมเดล OpenAI Responses เป็นข้อยกเว้น: ขณะที่ยังไม่ได้ตั้งค่า `tools.web.search.provider`
โมเดลเหล่านี้จะใช้การค้นหาเว็บแบบเนทีฟของ OpenAI แทนผู้ให้บริการที่มีการจัดการ
ข้างต้น (ดูด้านล่าง) ตั้งค่า `tools.web.search.provider` เป็น
`parallel-free` (หรือผู้ให้บริการรายอื่น) เพื่อกำหนดเส้นทางผ่านเส้นทางที่มีการจัดการ
แทน

<Note>
  ฟิลด์คีย์ของผู้ให้บริการทั้งหมดรองรับออบเจ็กต์ SecretRef โดย SecretRef ที่มีขอบเขตระดับ Plugin
  ภายใต้ `plugins.entries.<plugin>.config.webSearch.apiKey` จะได้รับการแก้ค่าสำหรับ
  ผู้ให้บริการค้นหาเว็บที่ใช้ API ซึ่งติดตั้งไว้ รวมถึง Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity และ Tavily
  ไม่ว่าจะเลือกผู้ให้บริการอย่างชัดเจนผ่าน `tools.web.search.provider` หรือ
  เลือกผ่านการตรวจหาอัตโนมัติ ในโหมดตรวจหาอัตโนมัติ OpenClaw จะแก้ค่าเฉพาะ
  คีย์ของผู้ให้บริการที่เลือกเท่านั้น โดย SecretRef ที่ไม่ได้เลือกจะยังคงไม่ทำงาน จึงสามารถ
  กำหนดค่าผู้ให้บริการหลายรายไว้ได้โดยไม่ต้องเสียค่าใช้จ่ายในการแก้ค่าสำหรับ
  รายที่ไม่ได้ใช้งาน
</Note>

## การค้นหาเว็บแบบเนทีฟของ OpenAI

โมเดล OpenAI Responses โดยตรง (`api: "openai-responses"`, ผู้ให้บริการ `openai`,
ไม่มี URL ฐานหรือใช้ URL ฐานอย่างเป็นทางการของ OpenAI API) จะใช้เครื่องมือ
`web_search` ที่โฮสต์โดย OpenAI โดยอัตโนมัติเมื่อเปิดใช้การค้นหาเว็บของ OpenClaw และไม่ได้
ตรึงผู้ให้บริการที่มีการจัดการไว้ ลักษณะการทำงานนี้เป็นของผู้ให้บริการใน Plugin
OpenAI ที่รวมมาให้ และไม่ใช้กับ URL ฐานของพร็อกซีที่เข้ากันได้กับ OpenAI หรือเส้นทาง
Azure ตั้งค่า `tools.web.search.provider` เป็นผู้ให้บริการอื่น เช่น `brave` เพื่อ
ใช้เครื่องมือ `web_search` ที่มีการจัดการต่อไปสำหรับโมเดล OpenAI หรือตั้งค่า
`tools.web.search.enabled: false` เพื่อปิดใช้งานทั้งการค้นหาที่มีการจัดการและการค้นหาแบบเนทีฟ
ของ OpenAI

## การค้นหาเว็บแบบเนทีฟของ Codex

รันไทม์แอปเซิร์ฟเวอร์ของ Codex จะใช้เครื่องมือ `web_search` ที่โฮสต์โดย Codex โดยอัตโนมัติ
เมื่อเปิดใช้การค้นหาเว็บและไม่ได้เลือกผู้ให้บริการที่มีการจัดการ การค้นหาแบบโฮสต์เนทีฟ
และเครื่องมือแบบไดนามิก `web_search` ที่มีการจัดการของ OpenClaw ใช้งานร่วมกันไม่ได้
ดังนั้นการค้นหาที่มีการจัดการจึงไม่สามารถข้ามข้อจำกัดโดเมนแบบเนทีฟได้ OpenClaw จะใช้
เครื่องมือที่มีการจัดการเมื่อการค้นหาแบบโฮสต์ไม่พร้อมใช้งาน ถูกปิดใช้งานอย่างชัดเจน หรือ
ถูกแทนที่ด้วยผู้ให้บริการที่มีการจัดการซึ่งเลือกไว้ OpenClaw ปิดใช้ส่วนขยาย
`web.run` แบบสแตนด์อโลนของ Codex ไว้ (`features.standalone_web_search: false`)
เนื่องจากทราฟฟิกแอปเซิร์ฟเวอร์ในระบบใช้งานจริงปฏิเสธเนมสเปซ `web`
ที่ผู้ใช้กำหนด

- กำหนดค่าการค้นหาแบบเนทีฟภายใต้ `tools.web.search.openaiCodex`
- ตั้งค่า `tools.web.search.provider: "codex"` เพื่อจัดเตรียม Codex Hosted Search เป็น
  ผู้ให้บริการ `web_search` ที่มีการจัดการสำหรับโมเดลแม่ใดก็ได้ การเรียกแต่ละครั้งจะเรียกใช้
  เทิร์นแอปเซิร์ฟเวอร์ Codex ชั่วคราวที่มีขอบเขตจำกัด และจะล้มเหลวหาก Codex ไม่ปล่อย
  รายการ `webSearch` ที่โฮสต์
- `mode: "cached"` เป็นค่ากำหนดเริ่มต้น แต่ Codex จะแก้ค่าเป็นการเข้าถึง
  ภายนอกแบบใช้งานจริงสำหรับเทิร์นแอปเซิร์ฟเวอร์ที่ไม่จำกัด; ตั้งค่า `"live"` เพื่อร้องขอ
  การเข้าถึงแบบใช้งานจริงอย่างชัดเจน
- ตั้งค่า `tools.web.search.provider` เป็นผู้ให้บริการที่มีการจัดการ เช่น `brave` เพื่อใช้
  `web_search` ที่มีการจัดการของ OpenClaw แทน
- ตั้งค่า `tools.web.search.openaiCodex.enabled: false` เพื่อเลือกไม่ใช้การค้นหา
  ที่โฮสต์โดย Codex; ผู้ให้บริการที่มีการจัดการรายอื่นยังคงพร้อมใช้งาน
- การจำกัดพื้นผิวเครื่องมือแบบเนทีฟของ Codex จะยังคงทำให้ `web_search` ที่มีการจัดการ
  พร้อมใช้งานด้วย
- เมื่อตั้งค่า `allowedDomains` การสำรองอัตโนมัติแบบมีการจัดการจะล้มเหลวแบบปิด
  หากการค้นหาแบบโฮสต์ไม่พร้อมใช้งาน เพื่อไม่ให้สามารถข้ามรายการอนุญาตแบบเนทีฟได้
- การทำงานแบบ LLM เท่านั้นที่ปิดใช้งานเครื่องมือ จะปิดทั้งการค้นหาแบบเนทีฟและแบบมีการจัดการ
- `tools.web.search.enabled: false` ปิดใช้งานทั้งการค้นหาแบบมีการจัดการและแบบเนทีฟ

การเปลี่ยนแปลงนโยบายการค้นหา Codex ที่มีผลและคงอยู่จะเริ่มเธรดที่ผูกไว้ใหม่ เพื่อให้
เธรดแอปเซิร์ฟเวอร์ที่โหลดอยู่แล้วไม่สามารถคงสิทธิ์เข้าถึงการค้นหาแบบโฮสต์ที่ล้าสมัยไว้ได้
ข้อจำกัดชั่วคราวต่อเทิร์นจะใช้เธรดจำกัดชั่วคราว และรักษา
การผูกเดิมไว้สำหรับการดำเนินการต่อในภายหลัง

ทราฟฟิก OpenAI ChatGPT Responses โดยตรงยังสามารถใช้เครื่องมือ
`web_search` ที่โฮสต์โดย OpenAI ได้ด้วย เส้นทางที่แยกต่างหากนี้ยังคงต้องเลือกใช้ผ่าน
`tools.web.search.openaiCodex.enabled: true` และใช้ได้เฉพาะกับ
โมเดล `openai/*` ที่มีคุณสมบัติเหมาะสมซึ่งใช้ `api: "openai-chatgpt-responses"`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // ไม่บังคับ: ใช้ Codex Hosted Search จากโมเดลแม่ที่ไม่ใช่ Codex ได้ด้วย
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
ใช้ทางเลือกสำรอง `web_search` ที่มีการจัดการผ่านเนมสเปซเครื่องมือแบบไดนามิกของ OpenClaw
ใช้ผู้ให้บริการที่มีการจัดการอย่างชัดเจนเมื่อต้องการการควบคุมเครือข่ายเฉพาะ
ของผู้ให้บริการจาก OpenClaw แทนการค้นหาที่โฮสต์โดย Codex

การเลือก `provider: "codex"` จะเปิดใช้ Plugin `codex` ที่รวมมาให้ และใช้
ข้อจำกัด `tools.web.search.openaiCodex` เดียวกับที่แสดงข้างต้น ยืนยันตัวตนกับ
แอปเซิร์ฟเวอร์ Codex ก่อนด้วย `openclaw models auth login --provider openai`
เอเจนต์แม่สามารถใช้โมเดลหรือรันไทม์ใดก็ได้; มีเพียงเวิร์กเกอร์ค้นหาที่มีขอบเขตจำกัด
เท่านั้นที่ทำงานผ่าน Codex

## ความปลอดภัยของเครือข่าย

การเรียกผู้ให้บริการ `web_search` ผ่าน HTTP แบบมีการจัดการจะใช้เส้นทางดึงข้อมูลที่มีการป้องกันของ OpenClaw
โดยจำกัดขอบเขตไว้ที่ชื่อโฮสต์ของผู้ให้บริการปัจจุบันเท่านั้น สำหรับชื่อโฮสต์นั้นเพียงชื่อเดียว
OpenClaw อนุญาตคำตอบ DNS แบบ fake-IP ของ Surge, Clash และ sing-box ใน
`198.18.0.0/15` และ `fc00::/7` ส่วนปลายทางแบบส่วนตัว, ลูปแบ็ก, ลิงก์โลคัล และ
เมทาดาทาอื่น ๆ ยังคงถูกบล็อก Codex Hosted Search เป็นข้อยกเว้น:
เวิร์กเกอร์ที่มีขอบเขตจำกัดจะมอบหมายการเข้าถึงเครือข่ายให้กับเครื่องมือ
`web_search` ที่โฮสต์โดยแอปเซิร์ฟเวอร์ Codex

การอนุญาตอัตโนมัตินี้ไม่ใช้กับ URL `web_fetch` ใด ๆ โดยพลการ สำหรับ
`web_fetch` ให้เปิดใช้ `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` และ
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` อย่างชัดเจนเฉพาะเมื่อ
พร็อกซีที่เชื่อถือได้ของคุณเป็นเจ้าของช่วงสังเคราะห์เหล่านั้น

## การกำหนดค่า

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // ค่าเริ่มต้น: true
        provider: "brave", // หรือละไว้เพื่อใช้การตรวจหาอัตโนมัติ
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

การกำหนดค่าเฉพาะผู้ให้บริการ (คีย์ API, URL ฐาน, โหมด) อยู่ภายใต้
`plugins.entries.<plugin>.config.webSearch.*` Gemini ยังสามารถใช้
`models.providers.google.apiKey` และ `models.providers.google.baseUrl` ซ้ำเป็นทางเลือกสำรอง
ที่มีลำดับความสำคัญต่ำกว่า หลังจากการกำหนดค่าการค้นหาเว็บเฉพาะของตนและ `GEMINI_API_KEY` ดู
ตัวอย่างได้จากหน้าของผู้ให้บริการ
Grok ยังสามารถใช้โปรไฟล์การยืนยันตัวตน OAuth ของ xAI จาก `openclaw models auth login
--provider xai --method oauth` ซ้ำได้; การกำหนดค่าคีย์ API ยังคงเป็นทางเลือกสำรอง

`tools.web.search.provider` จะได้รับการตรวจสอบกับ ID ผู้ให้บริการค้นหาเว็บ
ที่ประกาศโดยไฟล์ manifest ของ Plugin ที่รวมมาให้และติดตั้งไว้ การพิมพ์ผิด เช่น `"brvae"`
จะทำให้การตรวจสอบการกำหนดค่าล้มเหลว แทนที่จะย้อนกลับไปใช้การตรวจหาอัตโนมัติโดยไม่แจ้ง หาก
ผู้ให้บริการที่กำหนดค่ามีเพียงหลักฐาน Plugin ที่ล้าสมัย เช่น บล็อก
`plugins.entries.<plugin>` ที่เหลืออยู่หลังถอนการติดตั้ง Plugin ของบุคคลที่สาม
OpenClaw จะยังคงเริ่มต้นระบบได้อย่างยืดหยุ่นและรายงานคำเตือน เพื่อให้สามารถติดตั้ง
Plugin ใหม่หรือเรียกใช้ `openclaw doctor --fix` เพื่อล้างการกำหนดค่าที่ล้าสมัย

การเลือกผู้ให้บริการสำรอง `web_fetch` แยกต่างหาก:

- เลือกด้วย `tools.web.fetch.provider`
- หรือละฟิลด์นั้นไว้ แล้วให้ OpenClaw ตรวจหาผู้ให้บริการดึงข้อมูลเว็บรายแรก
  ที่พร้อมใช้งานจากข้อมูลประจำตัวที่กำหนดค่าไว้โดยอัตโนมัติ
- `web_fetch` ที่ไม่ได้ทำงานในแซนด์บ็อกซ์สามารถใช้ผู้ให้บริการ Plugin ที่ติดตั้งไว้ซึ่งประกาศ
  `contracts.webFetchProviders`; การดึงข้อมูลในแซนด์บ็อกซ์อนุญาตผู้ให้บริการที่รวมมาให้และ
  การติดตั้ง Plugin อย่างเป็นทางการที่ผ่านการตรวจสอบ แต่ไม่รวม Plugin ภายนอกของบุคคลที่สาม
- ปัจจุบัน Plugin Firecrawl อย่างเป็นทางการเป็นผู้สนับสนุน `webFetchProviders`
  รายเดียวที่รวมมาให้ โดยกำหนดค่าภายใต้
  `plugins.entries.firecrawl.config.webFetch.*`

เมื่อเลือก **Kimi** ระหว่าง `openclaw onboard` หรือ
`openclaw configure --section web` OpenClaw ยังสามารถสอบถามข้อมูลต่อไปนี้ได้:

- ภูมิภาค Moonshot API (`https://api.moonshot.ai/v1` หรือ `https://api.moonshot.cn/v1`)
- โมเดลค้นหาเว็บ Kimi เริ่มต้น (ค่าเริ่มต้นคือ `kimi-k2.6`)

สำหรับ `x_search` ให้กำหนดค่า `plugins.entries.xai.config.xSearch.*` ซึ่งใช้
โปรไฟล์การยืนยันตัวตน xAI เดียวกับแชต หรือข้อมูลประจำตัว `XAI_API_KEY` / การค้นหาเว็บของ Plugin
ที่การค้นหาเว็บ Grok ใช้
การกำหนดค่า `tools.web.x_search.*` แบบเดิมจะถูกย้ายโดยอัตโนมัติด้วย `openclaw doctor --fix`
เมื่อเลือก Grok ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web`
OpenClaw ยังเสนอการตั้งค่า `x_search` ซึ่งไม่บังคับโดยใช้ข้อมูลประจำตัวเดียวกัน
ทันทีหลังจากการตั้งค่า Grok เสร็จสมบูรณ์ ขั้นตอนนี้เป็นขั้นตอนติดตามผลที่แยกต่างหากภายในเส้นทาง Grok
ไม่ใช่ตัวเลือกผู้ให้บริการค้นหาเว็บระดับบนสุดที่แยกต่างหาก หากเลือกผู้ให้บริการรายอื่น
OpenClaw จะไม่แสดงพรอมต์ `x_search`

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
    ตั้งค่าตัวแปรสภาพแวดล้อมของผู้ให้บริการในสภาพแวดล้อมกระบวนการ Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    สำหรับการติดตั้ง Gateway ให้วางไว้ใน `~/.openclaw/.env`
    ดู [ตัวแปรสภาพแวดล้อม](/th/help/faq#env-vars-and-env-loading)

  </Tab>
</Tabs>

## พารามิเตอร์เครื่องมือ

| พารามิเตอร์             | คำอธิบาย                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | คำค้นหา (จำเป็น)                                            |
| `count`               | จำนวนผลลัพธ์ที่ส่งคืน (1-10, ค่าเริ่มต้น: 5)                               |
| `country`             | รหัสประเทศ ISO แบบ 2 ตัวอักษร (เช่น "US", "DE")                        |
| `language`            | รหัสภาษา ISO 639-1 (เช่น "en", "de")                          |
| `search_lang`         | รหัสภาษาสำหรับการค้นหา (เฉพาะ Brave)                                  |
| `freshness`           | ตัวกรองเวลา: `day`, `week`, `month` หรือ `year`                     |
| `date_after`          | ผลลัพธ์หลังวันที่นี้ (YYYY-MM-DD)                               |
| `date_before`         | ผลลัพธ์ก่อนวันที่นี้ (YYYY-MM-DD)                              |
| `ui_lang`             | รหัสภาษาของ UI (เฉพาะ Brave)                                      |
| `domain_filter`       | อาร์เรย์รายการโดเมนที่อนุญาต/ปฏิเสธ (เฉพาะ Perplexity)                  |
| `max_tokens`          | งบประมาณโทเค็นเนื้อหาทั้งหมด เฉพาะ Perplexity Search API แบบเนทีฟ      |
| `max_tokens_per_page` | ขีดจำกัดโทเค็นสำหรับการแยกเนื้อหาต่อหน้า เฉพาะ Perplexity Search API แบบเนทีฟ |

<Warning>
  พารามิเตอร์บางรายการใช้ไม่ได้กับผู้ให้บริการทุกเจ้า โหมด `llm-context` ของ Brave
  ไม่ยอมรับ `ui_lang`; `date_before` ยังต้องใช้ `date_after` ด้วย เนื่องจากช่วงเวลา
  ความใหม่ที่กำหนดเองของ Brave ต้องมีทั้งวันที่เริ่มต้นและวันที่สิ้นสุด
  Gemini, Grok และ Kimi ส่งคืนคำตอบสังเคราะห์หนึ่งรายการพร้อมการอ้างอิง โดยรองรับ
  `count` เพื่อให้เข้ากันได้กับเครื่องมือที่ใช้ร่วมกัน แต่ค่านี้ไม่เปลี่ยน
  รูปแบบคำตอบที่อิงแหล่งข้อมูล Gemini ถือว่าความใหม่แบบ `day` เป็นคำใบ้ด้านความล่าสุด ส่วนค่า
  ความใหม่ที่กว้างกว่าและวันที่ที่ระบุชัดเจนจะกำหนดช่วงเวลาการอิงแหล่งข้อมูลของ Google Search
  Perplexity ทำงานในลักษณะเดียวกันเมื่อใช้เส้นทางความเข้ากันได้ของ Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` หรือ `OPENROUTER_API_KEY`); เส้นทางนี้ยังไม่รองรับ `max_tokens` และ
  `max_tokens_per_page` ด้วย
  SearXNG ยอมรับ `http://` เฉพาะสำหรับโฮสต์เครือข่ายส่วนตัวที่เชื่อถือได้หรือโฮสต์ลูปแบ็ก
  ส่วนปลายทาง SearXNG สาธารณะต้องใช้ `https://`
  Firecrawl และ Tavily รองรับเฉพาะ `query` และ `count` ผ่าน `web_search`
  เท่านั้น -- ใช้เครื่องมือเฉพาะของบริการเหล่านี้สำหรับตัวเลือกขั้นสูง
</Warning>

## x_search

`x_search` ค้นหาโพสต์บน X (เดิมคือ Twitter) โดยใช้ xAI และส่งคืน
คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิง โดยรองรับคำค้นหาภาษาธรรมชาติและ
ตัวกรองแบบมีโครงสร้างที่เลือกใช้ได้ OpenClaw สร้างเครื่องมือ `x_search` ในตัวของ xAI
แยกตามแต่ละคำขอ แทนที่จะลงทะเบียนไว้อย่างถาวร ดังนั้นเครื่องมือนี้จึงทำงาน
เฉพาะในรอบที่เรียกใช้จริงเท่านั้น

<Warning>
  `x_search` ทำงานบนเซิร์ฟเวอร์ของ xAI โดย xAI คิดค่าบริการ $5 ต่อการเรียกเครื่องมือ 1,000 ครั้ง รวมถึง
  โทเค็นอินพุตและเอาต์พุตของโมเดล
</Warning>

<Note>
  เอกสารของ xAI ระบุว่า `x_search` รองรับการค้นหาด้วยคีย์เวิร์ด การค้นหาเชิงความหมาย การค้นหา
  ผู้ใช้ และการดึงเธรด สำหรับสถิติการมีส่วนร่วมของแต่ละโพสต์ เช่น การรีโพสต์
  การตอบกลับ บุ๊กมาร์ก หรือยอดดู ควรใช้การค้นหาแบบเจาะจงด้วย URL หรือ
  status ID ของโพสต์นั้นโดยตรง การค้นหาด้วยคีย์เวิร์ดแบบกว้างอาจพบโพสต์ที่ต้องการ แต่ส่งคืน
  ข้อมูลเมตาของแต่ละโพสต์ได้ไม่ครบถ้วน รูปแบบที่แนะนำคือ: ค้นหาโพสต์ก่อน จากนั้น
  เรียกคำค้นหา `x_search` ครั้งที่สองโดยเน้นที่โพสต์นั้นโดยตรง
</Note>

### การกำหนดค่า x_search

เมื่อละ `enabled` ไว้ ระบบจะแสดง `x_search` เฉพาะเมื่อผู้ให้บริการของ
โมเดลที่ใช้งานอยู่คือ `xai` และสามารถระบุข้อมูลประจำตัวของ xAI ได้ สำหรับโมเดลที่ใช้งานอยู่ซึ่งมี
ผู้ให้บริการที่ทราบแน่ชัดว่าไม่ใช่ xAI ให้ตั้ง `plugins.entries.xai.config.xSearch.enabled` เป็น `true` เพื่อ
เลือกใช้ข้ามผู้ให้บริการ หากไม่มีหรือไม่สามารถระบุผู้ให้บริการของโมเดลที่ใช้งานอยู่
เครื่องมือจะยังคงถูกซ่อน ตั้ง `enabled` เป็น `false` เพื่อปิดใช้งานสำหรับ
ผู้ให้บริการทุกราย ต้องใช้ข้อมูลประจำตัวของ xAI เสมอ

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // จำเป็นสำหรับผู้ให้บริการโมเดลที่ทราบแน่ชัดว่าไม่ใช่ xAI
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // เลือกใช้ได้ เขียนทับ webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // เลือกใช้ได้หากตั้งค่าโปรไฟล์การยืนยันตัวตนของ xAI หรือ XAI_API_KEY แล้ว
            baseUrl: "https://api.x.ai/v1", // URL ฐานของ xAI Responses ที่ใช้ร่วมกันซึ่งเลือกใช้ได้
          },
        },
      },
    },
  },
}
```

`x_search` ส่งคำขอ POST ไปยัง `<baseUrl>/responses` เมื่อ
ตั้งค่า `plugins.entries.xai.config.xSearch.baseUrl` ไว้ หากละฟิลด์นั้น
ระบบจะย้อนกลับไปใช้ `plugins.entries.xai.config.webSearch.baseUrl` แล้วจึงใช้
ปลายทางสาธารณะของ xAI (`https://api.x.ai/v1`)

### พารามิเตอร์ x_search

| พารามิเตอร์                    | คำอธิบาย                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | คำค้นหา (จำเป็น)                                |
| `allowed_x_handles`          | จำกัดผลลัพธ์ให้มาจากแฮนเดิล X ไม่เกิน 20 รายการ               |
| `excluded_x_handles`         | ยกเว้นแฮนเดิล X ไม่เกิน 20 รายการ                           |
| `from_date`                  | รวมเฉพาะโพสต์ในหรือหลังวันที่นี้ (YYYY-MM-DD)  |
| `to_date`                    | รวมเฉพาะโพสต์ในหรือก่อนวันที่นี้ (YYYY-MM-DD) |
| `enable_image_understanding` | อนุญาตให้ xAI ตรวจสอบรูปภาพที่แนบมากับโพสต์ที่ตรงกัน      |
| `enable_video_understanding` | อนุญาตให้ xAI ตรวจสอบวิดีโอที่แนบมากับโพสต์ที่ตรงกัน      |

`allowed_x_handles` และ `excluded_x_handles` ไม่สามารถใช้พร้อมกันได้

### ตัวอย่าง x_search

```javascript
await x_search({
  query: "สูตรอาหารมื้อเย็น",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// สถิติรายโพสต์: ใช้ URL สถานะหรือ status ID ที่แน่นอนเมื่อทำได้
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## ตัวอย่าง

```javascript
// การค้นหาพื้นฐาน
await web_search({ query: "OpenClaw plugin SDK" });

// การค้นหาสำหรับภาษาเยอรมันโดยเฉพาะ
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// ผลลัพธ์ล่าสุด (สัปดาห์ที่ผ่านมา)
await web_search({ query: "พัฒนาการด้าน AI", freshness: "week" });

// ช่วงวันที่
await web_search({
  query: "งานวิจัยด้านสภาพภูมิอากาศ",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// การกรองโดเมน (เฉพาะ Perplexity)
await web_search({
  query: "รีวิวผลิตภัณฑ์",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## โปรไฟล์เครื่องมือ

หากใช้โปรไฟล์เครื่องมือหรือรายการที่อนุญาต ให้เพิ่ม `web_search`, `x_search` หรือ `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // หรือ: allow: ["group:web"]  (รวม web_search, x_search และ web_fetch)
  },
}
```

## ที่เกี่ยวข้อง

- [การดึงข้อมูลจากเว็บ](/th/tools/web-fetch) -- ดึง URL และแยกเนื้อหาที่อ่านได้
- [เว็บเบราว์เซอร์](/th/tools/browser) -- ระบบอัตโนมัติของเบราว์เซอร์เต็มรูปแบบสำหรับเว็บไซต์ที่ใช้ JS อย่างมาก
- [การค้นหาด้วย Grok](/th/tools/grok-search) -- Grok ในฐานะผู้ให้บริการ `web_search`
- [การค้นหาเว็บด้วย Ollama](/th/tools/ollama-search) -- การค้นหาเว็บโดยไม่ต้องใช้คีย์ผ่านโฮสต์ Ollama ของคุณ
