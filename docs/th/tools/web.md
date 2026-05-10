---
read_when:
    - คุณต้องการเปิดใช้หรือกำหนดค่า web_search
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า x_search
    - คุณต้องเลือกผู้ให้บริการค้นหา
    - คุณต้องการทำความเข้าใจการตรวจหาอัตโนมัติและการสลับไปใช้ผู้ให้บริการสำรอง
sidebarTitle: Web Search
summary: web_search, x_search, และ web_fetch -- ค้นหาเว็บ, ค้นหาโพสต์บน X หรือดึงเนื้อหาของหน้า
title: ค้นหาเว็บ
x-i18n:
    generated_at: "2026-05-10T20:02:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c2806730f8c9cb33a3c142d5283de0f1231502e052c6da796c31125834a94e6
    source_path: tools/web.md
    workflow: 16
---

เครื่องมือ `web_search` ค้นหาเว็บโดยใช้ผู้ให้บริการที่คุณกำหนดค่าไว้และ
ส่งคืนผลลัพธ์ ผลลัพธ์จะถูกแคชตามคำค้นหาเป็นเวลา 15 นาที (กำหนดค่าได้)

OpenClaw ยังมี `x_search` สำหรับโพสต์บน X (เดิมคือ Twitter) และ
`web_fetch` สำหรับการดึง URL แบบเบา ในเฟสนี้ `web_fetch` ยังคงทำงานแบบ
โลคัล ขณะที่ `web_search` และ `x_search` สามารถใช้ xAI Responses เบื้องหลังได้

<Info>
  `web_search` เป็นเครื่องมือ HTTP แบบเบา ไม่ใช่การทำ browser automation สำหรับ
  ไซต์ที่ใช้ JS หนักหรือมีการเข้าสู่ระบบ ให้ใช้ [เว็บเบราว์เซอร์](/th/tools/browser) สำหรับ
  การดึง URL เฉพาะ ให้ใช้ [Web Fetch](/th/tools/web-fetch)
</Info>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Choose a provider">
    เลือกผู้ให้บริการและตั้งค่าที่จำเป็นให้ครบ ผู้ให้บริการบางรายไม่ต้องใช้คีย์
    ขณะที่บางรายใช้ API keys ดูรายละเอียดได้ที่หน้าผู้ให้บริการด้านล่าง
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    คำสั่งนี้จะบันทึกผู้ให้บริการและข้อมูลรับรองที่จำเป็น คุณยังสามารถตั้งค่า env
    var (เช่น `BRAVE_API_KEY`) และข้ามขั้นตอนนี้สำหรับผู้ให้บริการที่รองรับด้วย
    API ได้
  </Step>
  <Step title="Use it">
    ตอนนี้ Agent สามารถเรียก `web_search` ได้แล้ว:

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
    ผลลัพธ์แบบมีโครงสร้างพร้อม snippets รองรับโหมด `llm-context` และตัวกรองประเทศ/ภาษา มี Free tier ให้ใช้
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/th/tools/duckduckgo-search">
    ตัวสำรองที่ไม่ต้องใช้คีย์ ไม่จำเป็นต้องมี API key การผสานรวมแบบไม่เป็นทางการที่อิง HTML
  </Card>
  <Card title="Exa" icon="brain" href="/th/tools/exa-search">
    การค้นหาแบบ neural + keyword พร้อมการดึงเนื้อหา (ไฮไลต์ ข้อความ สรุป)
  </Card>
  <Card title="Firecrawl" icon="flame" href="/th/tools/firecrawl">
    ผลลัพธ์แบบมีโครงสร้าง เหมาะที่สุดเมื่อใช้คู่กับ `firecrawl_search` และ `firecrawl_scrape` สำหรับการดึงข้อมูลเชิงลึก
  </Card>
  <Card title="Gemini" icon="sparkles" href="/th/tools/gemini-search">
    คำตอบที่สังเคราะห์โดย AI พร้อมการอ้างอิงผ่าน Google Search grounding
  </Card>
  <Card title="Grok" icon="zap" href="/th/tools/grok-search">
    คำตอบที่สังเคราะห์โดย AI พร้อมการอ้างอิงผ่าน xAI web grounding
  </Card>
  <Card title="Kimi" icon="moon" href="/th/tools/kimi-search">
    คำตอบที่สังเคราะห์โดย AI พร้อมการอ้างอิงผ่าน Moonshot web search; fallback ของแชตที่ไม่มี grounding จะล้มเหลวอย่างชัดเจน
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/th/tools/minimax-search">
    ผลลัพธ์แบบมีโครงสร้างผ่าน MiniMax Token Plan search API
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/th/tools/ollama-search">
    ค้นหาผ่านโฮสต์ Ollama โลคัลที่เข้าสู่ระบบอยู่ หรือ hosted Ollama API
  </Card>
  <Card title="Perplexity" icon="search" href="/th/tools/perplexity-search">
    ผลลัพธ์แบบมีโครงสร้างพร้อมการควบคุมการดึงเนื้อหาและการกรองโดเมน
  </Card>
  <Card title="SearXNG" icon="server" href="/th/tools/searxng-search">
    Meta-search แบบ self-hosted ไม่จำเป็นต้องมี API key รวบรวม Google, Bing, DuckDuckGo และอื่น ๆ
  </Card>
  <Card title="Tavily" icon="globe" href="/th/tools/tavily">
    ผลลัพธ์แบบมีโครงสร้างพร้อมระดับความลึกในการค้นหา การกรองหัวข้อ และ `tavily_extract` สำหรับการดึง URL
  </Card>
</CardGroup>

### การเปรียบเทียบผู้ให้บริการ

| ผู้ให้บริการ                                  | รูปแบบผลลัพธ์                                                   | ตัวกรอง                                          | API key                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/th/tools/brave-search)              | Snippets แบบมีโครงสร้าง                                            | ประเทศ ภาษา เวลา โหมด `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/th/tools/duckduckgo-search)    | Snippets แบบมีโครงสร้าง                                            | --                                               | ไม่มี (ไม่ต้องใช้คีย์)                                                                         |
| [Exa](/th/tools/exa-search)                  | แบบมีโครงสร้าง + ดึงข้อมูลแล้ว                                         | โหมด neural/keyword วันที่ การดึงเนื้อหา    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/th/tools/firecrawl)             | Snippets แบบมีโครงสร้าง                                            | ผ่านเครื่องมือ `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/th/tools/gemini-search)            | สังเคราะห์โดย AI + การอ้างอิง                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/th/tools/grok-search)                | สังเคราะห์โดย AI + การอ้างอิง                                     | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/th/tools/kimi-search)                | สังเคราะห์โดย AI + การอ้างอิง; ล้มเหลวเมื่อใช้ fallback ของแชตที่ไม่มี grounding | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/th/tools/minimax-search)   | Snippets แบบมีโครงสร้าง                                            | ภูมิภาค (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/th/tools/ollama-search) | Snippets แบบมีโครงสร้าง                                            | --                                               | ไม่มีสำหรับโฮสต์โลคัลที่เข้าสู่ระบบแล้ว; `OLLAMA_API_KEY` สำหรับการค้นหาโดยตรงที่ `https://ollama.com` |
| [Perplexity](/th/tools/perplexity-search)    | Snippets แบบมีโครงสร้าง                                            | ประเทศ ภาษา เวลา โดเมน ขีดจำกัดเนื้อหา | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/th/tools/searxng-search)          | Snippets แบบมีโครงสร้าง                                            | หมวดหมู่ ภาษา                             | ไม่มี (self-hosted)                                                                      |
| [Tavily](/th/tools/tavily)                   | Snippets แบบมีโครงสร้าง                                            | ผ่านเครื่องมือ `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## การตรวจจับอัตโนมัติ

## การค้นหาเว็บแบบเนทีฟของ OpenAI

โมเดล OpenAI Responses โดยตรงจะใช้เครื่องมือ hosted `web_search` ของ OpenAI โดยอัตโนมัติเมื่อเปิดใช้การค้นหาเว็บของ OpenClaw และไม่ได้ตรึงผู้ให้บริการที่จัดการไว้ นี่เป็นพฤติกรรมที่ผู้ให้บริการเป็นเจ้าของใน OpenAI Plugin ที่ bundled มา และใช้เฉพาะกับทราฟฟิก OpenAI API แบบเนทีฟเท่านั้น ไม่รวม URL ฐานของพร็อกซีที่เข้ากันได้กับ OpenAI หรือเส้นทาง Azure ตั้งค่า `tools.web.search.provider` เป็นผู้ให้บริการอื่น เช่น `brave` เพื่อคงเครื่องมือ `web_search` ที่จัดการไว้สำหรับโมเดล OpenAI หรือกำหนด `tools.web.search.enabled: false` เพื่อปิดทั้งการค้นหาที่จัดการไว้และการค้นหา OpenAI แบบเนทีฟ

## การค้นหาเว็บแบบเนทีฟของ Codex

โมเดลที่รองรับ Codex สามารถเลือกใช้เครื่องมือ Responses `web_search` แบบเนทีฟของผู้ให้บริการแทนฟังก์ชัน `web_search` ที่ OpenClaw จัดการไว้ได้

- กำหนดค่าไว้ใต้ `tools.web.search.openaiCodex`
- จะเปิดใช้งานเฉพาะกับโมเดลที่รองรับ Codex (`openai-codex/*` หรือผู้ให้บริการที่ใช้ `api: "openai-codex-responses"`)
- `web_search` ที่จัดการไว้ยังคงใช้กับโมเดลที่ไม่ใช่ Codex
- `mode: "cached"` เป็นค่าเริ่มต้นและเป็นค่าที่แนะนำ
- `tools.web.search.enabled: false` ปิดทั้งการค้นหาที่จัดการไว้และการค้นหาแบบเนทีฟ

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

## ความปลอดภัยของเครือข่าย

การเรียกผู้ให้บริการ `web_search` ที่จัดการไว้ใช้เส้นทาง fetch ที่มีการป้องกันของ OpenClaw สำหรับ
โฮสต์ API ของผู้ให้บริการที่เชื่อถือได้ OpenClaw อนุญาตคำตอบ DNS แบบ fake-IP ของ
Surge, Clash และ sing-box ใน `198.18.0.0/15` และ `fc00::/7` เฉพาะสำหรับ hostname ของผู้ให้บริการนั้นเท่านั้น
ปลายทาง private, loopback, link-local และ metadata อื่น ๆ ยังคงถูกบล็อก

การอนุญาตอัตโนมัตินี้ไม่ใช้กับ URL `web_fetch` ใด ๆ โดยพลการ สำหรับ
`web_fetch` ให้เปิดใช้ `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` และ
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` อย่างชัดเจน เฉพาะเมื่อพร็อกซีที่เชื่อถือได้ของคุณเป็นเจ้าของช่วงสังเคราะห์เหล่านั้น

## การตั้งค่าการค้นหาเว็บ

รายชื่อผู้ให้บริการในเอกสารและโฟลว์การตั้งค่าเรียงตามตัวอักษร การตรวจจับอัตโนมัติจะคง
ลำดับความสำคัญแยกต่างหาก

หากไม่ได้ตั้งค่า `provider` ไว้ OpenClaw จะตรวจสอบผู้ให้บริการตามลำดับนี้และใช้
รายแรกที่พร้อม:

ผู้ให้บริการที่รองรับด้วย API ก่อน:

1. **Brave** -- `BRAVE_API_KEY` หรือ `plugins.entries.brave.config.webSearch.apiKey` (ลำดับ 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` หรือ `plugins.entries.minimax.config.webSearch.apiKey` (ลำดับ 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY`, หรือ `models.providers.google.apiKey` (ลำดับ 20)
4. **Grok** -- `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey` (ลำดับ 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` หรือ `plugins.entries.moonshot.config.webSearch.apiKey` (ลำดับ 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` หรือ `plugins.entries.perplexity.config.webSearch.apiKey` (ลำดับ 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webSearch.apiKey` (ลำดับ 60)
8. **Exa** -- `EXA_API_KEY` หรือ `plugins.entries.exa.config.webSearch.apiKey`; `plugins.entries.exa.config.webSearch.baseUrl` แบบไม่บังคับจะ override endpoint ของ Exa (ลำดับ 65)
9. **Tavily** -- `TAVILY_API_KEY` หรือ `plugins.entries.tavily.config.webSearch.apiKey` (ลำดับ 70)

ตัวสำรองที่ไม่ต้องใช้คีย์หลังจากนั้น:

10. **DuckDuckGo** -- fallback แบบ HTML ที่ไม่ต้องใช้คีย์ ไม่ต้องมีบัญชีหรือ API key (ลำดับ 100)
11. **Ollama Web Search** -- fallback ที่ไม่ต้องใช้คีย์ผ่านโฮสต์ Ollama โลคัลที่คุณกำหนดค่าไว้เมื่อเข้าถึงได้และเข้าสู่ระบบด้วย `ollama signin`; สามารถใช้ bearer auth ของผู้ให้บริการ Ollama ซ้ำได้เมื่อโฮสต์ต้องการ และสามารถเรียกการค้นหาโดยตรงที่ `https://ollama.com` เมื่อกำหนดค่าด้วย `OLLAMA_API_KEY` (ลำดับ 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl` (ลำดับ 200)

หากตรวจไม่พบผู้ให้บริการ ระบบจะ fallback ไปที่ Brave (คุณจะได้รับข้อผิดพลาด missing-key
ที่แจ้งให้คุณกำหนดค่า)

<Note>
  ฟิลด์คีย์ของผู้ให้บริการทั้งหมดรองรับอ็อบเจ็กต์ SecretRef โดย SecretRefs ที่มี scope ตาม Plugin
  ใต้ `plugins.entries.<plugin>.config.webSearch.apiKey` จะถูก resolve สำหรับ
  ผู้ให้บริการค้นหาเว็บที่ bundled มาและรองรับด้วย API รวมถึง Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity และ Tavily
  ไม่ว่าผู้ให้บริการจะถูกเลือกอย่างชัดเจนผ่าน `tools.web.search.provider` หรือ
  ถูกเลือกผ่านการตรวจจับอัตโนมัติ ในโหมดตรวจจับอัตโนมัติ OpenClaw จะ resolve เฉพาะ
  คีย์ของผู้ให้บริการที่เลือกเท่านั้น -- SecretRefs ที่ไม่ได้เลือกจะยังไม่ทำงาน คุณจึงสามารถ
  กำหนดค่าผู้ให้บริการหลายรายไว้ได้โดยไม่ต้องเสียค่าใช้จ่ายในการ resolve สำหรับ
  รายที่คุณไม่ได้ใช้
</Note>

## Config

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
`models.providers.google.apiKey` และ `models.providers.google.baseUrl` มาใช้ซ้ำเป็นค่า
สำรองที่มีลำดับความสำคัญต่ำกว่า หลังจากการกำหนดค่า web-search เฉพาะของตัวเองและ `GEMINI_API_KEY` ดูตัวอย่างได้ใน
หน้าผู้ให้บริการ

`tools.web.search.provider` จะถูกตรวจสอบกับรหัสผู้ให้บริการ web-search
ที่ประกาศโดย manifest ของ Plugin ที่มาพร้อมชุดและที่ติดตั้งไว้ การพิมพ์ผิด เช่น `"brvae"`
จะทำให้การตรวจสอบการกำหนดค่าล้มเหลว แทนที่จะถอยกลับไปใช้การตรวจจับอัตโนมัติแบบเงียบ ๆ หาก
ผู้ให้บริการที่กำหนดค่าไว้มีเพียงหลักฐาน Plugin ที่ล้าสมัย เช่น บล็อก
`plugins.entries.<plugin>` ที่เหลืออยู่หลังจากถอนการติดตั้ง Plugin ภายนอก
OpenClaw จะยังคงเริ่มต้นได้อย่างยืดหยุ่นและรายงานคำเตือน เพื่อให้คุณติดตั้ง
Plugin ใหม่ หรือเรียกใช้ `openclaw doctor --fix` เพื่อล้างการกำหนดค่าที่ล้าสมัย

การเลือกผู้ให้บริการสำรองของ `web_fetch` จะแยกต่างหาก:

- เลือกด้วย `tools.web.fetch.provider`
- หรือละฟิลด์นั้นไว้ แล้วให้ OpenClaw ตรวจจับผู้ให้บริการ web-fetch
  รายแรกที่พร้อมใช้งานจากข้อมูลรับรองที่มี
- `web_fetch` แบบไม่อยู่ใน sandbox สามารถใช้ผู้ให้บริการจาก Plugin ที่ติดตั้งไว้ซึ่งประกาศ
  `contracts.webFetchProviders`; การ fetch แบบอยู่ใน sandbox จะใช้ได้เฉพาะที่มาพร้อมชุดเท่านั้น
- ปัจจุบันผู้ให้บริการ web-fetch ที่มาพร้อมชุดคือ Firecrawl ซึ่งกำหนดค่าใต้
  `plugins.entries.firecrawl.config.webFetch.*`

เมื่อคุณเลือก **Kimi** ระหว่าง `openclaw onboard` หรือ
`openclaw configure --section web` OpenClaw ยังสามารถถามหา:

- ภูมิภาค API ของ Moonshot (`https://api.moonshot.ai/v1` หรือ `https://api.moonshot.cn/v1`)
- โมเดล web-search เริ่มต้นของ Kimi (ค่าเริ่มต้นคือ `kimi-k2.6`)

สำหรับ `x_search` ให้กำหนดค่า `plugins.entries.xai.config.xSearch.*` โดยใช้
โปรไฟล์การยืนยันตัวตน xAI เดียวกับแชต หรือข้อมูลรับรอง `XAI_API_KEY` / web-search ของ Plugin
ที่ใช้โดยการค้นหาเว็บของ Grok
การกำหนดค่าเดิม `tools.web.x_search.*` จะถูกย้ายโดยอัตโนมัติด้วย `openclaw doctor --fix`
เมื่อคุณเลือก Grok ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web`
OpenClaw ยังสามารถเสนอการตั้งค่า `x_search` แบบไม่บังคับด้วยคีย์เดียวกันได้
นี่เป็นขั้นตอนติดตามผลแยกต่างหากภายในเส้นทางของ Grok ไม่ใช่ตัวเลือกผู้ให้บริการ web-search
ระดับบนสุดที่แยกออกมา หากคุณเลือกผู้ให้บริการอื่น OpenClaw จะไม่
แสดงพรอมป์ `x_search`

### การจัดเก็บคีย์ API

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
| `country`             | รหัสประเทศ ISO แบบ 2 ตัวอักษร (เช่น "US", "DE")           |
| `language`            | รหัสภาษา ISO 639-1 (เช่น "en", "de")             |
| `search_lang`         | รหัสภาษาสำหรับการค้นหา (เฉพาะ Brave)                     |
| `freshness`           | ตัวกรองเวลา: `day`, `week`, `month` หรือ `year`        |
| `date_after`          | ผลลัพธ์หลังวันที่นี้ (YYYY-MM-DD)                  |
| `date_before`         | ผลลัพธ์ก่อนวันที่นี้ (YYYY-MM-DD)                 |
| `ui_lang`             | รหัสภาษา UI (เฉพาะ Brave)                         |
| `domain_filter`       | อาร์เรย์รายการอนุญาต/ปฏิเสธโดเมน (เฉพาะ Perplexity)     |
| `max_tokens`          | งบประมาณเนื้อหารวม ค่าเริ่มต้น 25000 (เฉพาะ Perplexity) |
| `max_tokens_per_page` | ขีดจำกัดโทเค็นต่อหน้า ค่าเริ่มต้น 2048 (เฉพาะ Perplexity)  |

<Warning>
  พารามิเตอร์บางรายการไม่ได้ทำงานกับผู้ให้บริการทุกตัว โหมด `llm-context` ของ Brave
  ปฏิเสธ `ui_lang`; `date_before` ยังต้องมี `date_after` ด้วย เพราะช่วง
  freshness แบบกำหนดเองของ Brave ต้องมีทั้งวันที่เริ่มต้นและวันที่สิ้นสุด
  Gemini, Grok และ Kimi จะส่งคืนคำตอบสังเคราะห์หนึ่งรายการพร้อมการอ้างอิง พวกเขา
  ยอมรับ `count` เพื่อความเข้ากันได้กับเครื่องมือร่วม แต่ไม่ได้เปลี่ยนรูปแบบ
  คำตอบที่มีการอ้างอิงหลักฐาน Gemini รองรับ `freshness`, `date_after` และ
  `date_before` โดยแปลงเป็นช่วงเวลาของ Google Search grounding
  Perplexity ทำงานแบบเดียวกันเมื่อคุณใช้เส้นทางความเข้ากันได้ Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` หรือ `OPENROUTER_API_KEY`)
  SearXNG ยอมรับ `http://` เฉพาะสำหรับโฮสต์เครือข่ายส่วนตัวหรือ loopback ที่เชื่อถือได้เท่านั้น;
  ปลายทาง SearXNG สาธารณะต้องใช้ `https://`
  Firecrawl และ Tavily รองรับเฉพาะ `query` และ `count` ผ่าน `web_search`
  -- ใช้เครื่องมือเฉพาะของพวกเขาสำหรับตัวเลือกขั้นสูง
</Warning>

## x_search

`x_search` ค้นหาโพสต์ X (เดิมคือ Twitter) โดยใช้ xAI และส่งคืน
คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิง รองรับคำค้นหาภาษาธรรมชาติและ
ตัวกรองแบบมีโครงสร้างที่ไม่บังคับ OpenClaw จะเปิดใช้เครื่องมือ `x_search`
ของ xAI ที่มีในตัวเฉพาะคำขอที่ให้บริการการเรียกเครื่องมือนี้

<Note>
  เอกสารของ xAI ระบุว่า `x_search` รองรับการค้นหาด้วยคำสำคัญ การค้นหาเชิงความหมาย การค้นหา
  ผู้ใช้ และการดึงเธรด สำหรับสถิติการมีส่วนร่วมต่อโพสต์ เช่น การ repost,
  replies, bookmarks หรือ views ให้เลือกใช้การค้นหาแบบเจาะจงสำหรับ URL โพสต์
  หรือรหัสสถานะที่แน่นอน การค้นหาคำสำคัญแบบกว้างอาจพบโพสต์ที่ถูกต้อง แต่ส่งคืน
  เมตาดาต้าต่อโพสต์ที่ไม่ครบถ้วนเท่า รูปแบบที่ดีคือ: หาโพสต์ก่อน จากนั้น
  เรียกใช้คำค้นหา `x_search` ครั้งที่สองที่เน้นโพสต์นั้นโดยตรง
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

`x_search` จะโพสต์ไปที่ `<baseUrl>/responses` เมื่อมีการตั้งค่า
`plugins.entries.xai.config.xSearch.baseUrl` หากละฟิลด์นั้นไว้
จะถอยกลับไปใช้ `plugins.entries.xai.config.webSearch.baseUrl` จากนั้นใช้
`tools.web.search.grok.baseUrl` แบบเดิม และท้ายที่สุดใช้ปลายทาง xAI สาธารณะ

### พารามิเตอร์ x_search

| พารามิเตอร์                    | คำอธิบาย                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | คำค้นหา (จำเป็น)                                |
| `allowed_x_handles`          | จำกัดผลลัพธ์ไว้เฉพาะ X handles ที่ระบุ                 |
| `excluded_x_handles`         | ตัด X handles ที่ระบุออก                             |
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

หากคุณใช้โปรไฟล์เครื่องมือหรือรายการอนุญาต ให้เพิ่ม `web_search`, `x_search` หรือ `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## ที่เกี่ยวข้อง

- [Web Fetch](/th/tools/web-fetch) -- fetch URL และแยกเนื้อหาที่อ่านได้
- [Web Browser](/th/tools/browser) -- ระบบอัตโนมัติของเบราว์เซอร์เต็มรูปแบบสำหรับไซต์ที่ใช้ JS หนัก
- [Grok Search](/th/tools/grok-search) -- Grok ในฐานะผู้ให้บริการ `web_search`
- [Ollama Web Search](/th/tools/ollama-search) -- การค้นหาเว็บแบบไม่ต้องใช้คีย์ผ่านโฮสต์ Ollama ของคุณ
