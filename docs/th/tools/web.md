---
read_when:
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า web_search
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า x_search
    - คุณต้องเลือกผู้ให้บริการค้นหา
    - คุณต้องการทำความเข้าใจการตรวจจับอัตโนมัติและการย้อนกลับไปใช้ผู้ให้บริการสำรอง
sidebarTitle: Web Search
summary: web_search, x_search และ web_fetch -- ค้นหาเว็บ ค้นหาโพสต์ X หรือดึงเนื้อหาหน้าเว็บ
title: การค้นหาเว็บ
x-i18n:
    generated_at: "2026-05-03T21:39:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84de67b51f02e3b901bfa55017ae8e88de49295dfe6ed1103a45f034e073c087
    source_path: tools/web.md
    workflow: 16
---

เครื่องมือ `web_search` ค้นหาเว็บโดยใช้ provider ที่คุณกำหนดค่าไว้และ
ส่งคืนผลลัพธ์ ผลลัพธ์จะถูกแคชตามคำค้นหาเป็นเวลา 15 นาที (กำหนดค่าได้)

OpenClaw ยังมี `x_search` สำหรับโพสต์ X (เดิมคือ Twitter) และ
`web_fetch` สำหรับการดึง URL แบบเบา ในเฟสนี้ `web_fetch` จะยังคงทำงานในเครื่อง
ขณะที่ `web_search` และ `x_search` สามารถใช้ xAI Responses อยู่เบื้องหลังได้

<Info>
  `web_search` เป็นเครื่องมือ HTTP แบบเบา ไม่ใช่การทำงานอัตโนมัติของเบราว์เซอร์ สำหรับ
  ไซต์ที่ใช้ JS มากหรือการเข้าสู่ระบบ ให้ใช้ [เว็บเบราว์เซอร์](/th/tools/browser) สำหรับ
  การดึง URL เฉพาะ ให้ใช้ [Web Fetch](/th/tools/web-fetch)
</Info>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เลือก provider">
    เลือก provider และตั้งค่าที่จำเป็นให้เสร็จสมบูรณ์ บาง provider
    ไม่ต้องใช้คีย์ ขณะที่บางตัวใช้คีย์ API ดูหน้าของ provider ด้านล่างสำหรับ
    รายละเอียด
  </Step>
  <Step title="กำหนดค่า">
    ```bash
    openclaw configure --section web
    ```
    คำสั่งนี้จะบันทึก provider และข้อมูลรับรองที่จำเป็น คุณยังสามารถตั้งค่า env
    var (เช่น `BRAVE_API_KEY`) แล้วข้ามขั้นตอนนี้สำหรับ provider
    ที่ใช้ API ได้
  </Step>
  <Step title="ใช้งาน">
    ตอนนี้ agent สามารถเรียก `web_search` ได้แล้ว:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    สำหรับโพสต์ X ให้ใช้:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## การเลือก provider

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/th/tools/brave-search">
    ผลลัพธ์แบบมีโครงสร้างพร้อม snippet รองรับโหมด `llm-context` และตัวกรองประเทศ/ภาษา มีระดับใช้งานฟรี
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/th/tools/duckduckgo-search">
    ตัวสำรองที่ไม่ต้องใช้คีย์ ไม่ต้องใช้คีย์ API การเชื่อมต่อแบบไม่เป็นทางการที่อิง HTML
  </Card>
  <Card title="Exa" icon="brain" href="/th/tools/exa-search">
    การค้นหาแบบนิวรัล + คีย์เวิร์ดพร้อมการดึงเนื้อหา (ไฮไลต์ ข้อความ สรุป)
  </Card>
  <Card title="Firecrawl" icon="flame" href="/th/tools/firecrawl">
    ผลลัพธ์แบบมีโครงสร้าง เหมาะที่สุดเมื่อใช้คู่กับ `firecrawl_search` และ `firecrawl_scrape` สำหรับการดึงข้อมูลเชิงลึก
  </Card>
  <Card title="Gemini" icon="sparkles" href="/th/tools/gemini-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่านการ grounding ด้วย Google Search
  </Card>
  <Card title="Grok" icon="zap" href="/th/tools/grok-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่านการ grounding เว็บของ xAI
  </Card>
  <Card title="Kimi" icon="moon" href="/th/tools/kimi-search">
    คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิงผ่านการค้นหาเว็บของ Moonshot; fallback ของแชตที่ไม่ grounded จะล้มเหลวอย่างชัดเจน
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/th/tools/minimax-search">
    ผลลัพธ์แบบมีโครงสร้างผ่าน MiniMax Token Plan search API
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/th/tools/ollama-search">
    ค้นหาผ่านโฮสต์ Ollama ในเครื่องที่ลงชื่อเข้าใช้แล้ว หรือ hosted Ollama API
  </Card>
  <Card title="Perplexity" icon="search" href="/th/tools/perplexity-search">
    ผลลัพธ์แบบมีโครงสร้างพร้อมการควบคุมการดึงเนื้อหาและการกรองโดเมน
  </Card>
  <Card title="SearXNG" icon="server" href="/th/tools/searxng-search">
    meta-search แบบโฮสต์เอง ไม่ต้องใช้คีย์ API รวมผลจาก Google, Bing, DuckDuckGo และอื่นๆ
  </Card>
  <Card title="Tavily" icon="globe" href="/th/tools/tavily">
    ผลลัพธ์แบบมีโครงสร้างพร้อมความลึกของการค้นหา การกรองหัวข้อ และ `tavily_extract` สำหรับการดึง URL
  </Card>
</CardGroup>

### การเปรียบเทียบ provider

| Provider                                  | รูปแบบผลลัพธ์                                                   | ตัวกรอง                                          | คีย์ API                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/th/tools/brave-search)              | snippet แบบมีโครงสร้าง                                            | ประเทศ ภาษา เวลา โหมด `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/th/tools/duckduckgo-search)    | snippet แบบมีโครงสร้าง                                            | --                                               | ไม่มี (ไม่ต้องใช้คีย์)                                                                         |
| [Exa](/th/tools/exa-search)                  | มีโครงสร้าง + ดึงเนื้อหาแล้ว                                         | โหมดนิวรัล/คีย์เวิร์ด วันที่ การดึงเนื้อหา    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/th/tools/firecrawl)             | snippet แบบมีโครงสร้าง                                            | ผ่านเครื่องมือ `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/th/tools/gemini-search)            | AI สังเคราะห์ + การอ้างอิง                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/th/tools/grok-search)                | AI สังเคราะห์ + การอ้างอิง                                     | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/th/tools/kimi-search)                | AI สังเคราะห์ + การอ้างอิง; ล้มเหลวเมื่อใช้ fallback ของแชตที่ไม่ grounded | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/th/tools/minimax-search)   | snippet แบบมีโครงสร้าง                                            | ภูมิภาค (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/th/tools/ollama-search) | snippet แบบมีโครงสร้าง                                            | --                                               | ไม่มีสำหรับโฮสต์ในเครื่องที่ลงชื่อเข้าใช้แล้ว; `OLLAMA_API_KEY` สำหรับการค้นหาโดยตรงที่ `https://ollama.com` |
| [Perplexity](/th/tools/perplexity-search)    | snippet แบบมีโครงสร้าง                                            | ประเทศ ภาษา เวลา โดเมน ขีดจำกัดเนื้อหา | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/th/tools/searxng-search)          | snippet แบบมีโครงสร้าง                                            | หมวดหมู่ ภาษา                             | ไม่มี (โฮสต์เอง)                                                                      |
| [Tavily](/th/tools/tavily)                   | snippet แบบมีโครงสร้าง                                            | ผ่านเครื่องมือ `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## การตรวจจับอัตโนมัติ

## การค้นหาเว็บ OpenAI แบบ native

โมเดล OpenAI Responses โดยตรงจะใช้เครื่องมือ `web_search` ที่โฮสต์โดย OpenAI โดยอัตโนมัติเมื่อเปิดใช้งานการค้นหาเว็บของ OpenClaw และไม่ได้ตรึง managed provider ไว้ นี่เป็นพฤติกรรมที่ provider เป็นเจ้าของใน OpenAI Plugin ที่บันเดิลมา และมีผลเฉพาะกับทราฟฟิก OpenAI API แบบ native เท่านั้น ไม่รวม base URL พร็อกซีที่เข้ากันได้กับ OpenAI หรือเส้นทาง Azure ตั้งค่า `tools.web.search.provider` เป็น provider อื่น เช่น `brave` เพื่อคงเครื่องมือ `web_search` แบบ managed สำหรับโมเดล OpenAI หรือกำหนด `tools.web.search.enabled: false` เพื่อปิดทั้งการค้นหาแบบ managed และการค้นหา OpenAI แบบ native

## การค้นหาเว็บ Codex แบบ native

โมเดลที่รองรับ Codex สามารถเลือกใช้เครื่องมือ `web_search` ของ Responses แบบ provider-native แทนฟังก์ชัน `web_search` แบบ managed ของ OpenClaw ได้

- กำหนดค่าไว้ใต้ `tools.web.search.openaiCodex`
- จะเปิดใช้เฉพาะกับโมเดลที่รองรับ Codex (`openai-codex/*` หรือ provider ที่ใช้ `api: "openai-codex-responses"`)
- `web_search` แบบ managed ยังคงใช้กับโมเดลที่ไม่ใช่ Codex
- `mode: "cached"` เป็นค่าเริ่มต้นและการตั้งค่าที่แนะนำ
- `tools.web.search.enabled: false` จะปิดทั้งการค้นหาแบบ managed และ native

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

หากเปิดใช้การค้นหา Codex แบบ native แต่โมเดลปัจจุบันไม่รองรับ Codex, OpenClaw จะคงพฤติกรรม `web_search` แบบ managed ตามปกติไว้

## ความปลอดภัยของเครือข่าย

การเรียก provider ของ `web_search` แบบ managed จะใช้เส้นทาง fetch ที่มีการป้องกันของ OpenClaw สำหรับ
โฮสต์ API ของ provider ที่เชื่อถือได้ OpenClaw อนุญาตคำตอบ DNS แบบ fake-IP ของ Surge, Clash และ sing-box
ใน `198.18.0.0/15` และ `fc00::/7` เฉพาะสำหรับชื่อโฮสต์ของ provider นั้นเท่านั้น
ปลายทาง private, loopback, link-local และ metadata อื่นๆ ยังคงถูกบล็อก

การอนุญาตอัตโนมัตินี้ไม่มีผลกับ URL `web_fetch` ใดๆ ก็ตาม สำหรับ
`web_fetch` ให้เปิดใช้ `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` และ
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` อย่างชัดเจนเฉพาะเมื่อ
พร็อกซีที่เชื่อถือได้ของคุณเป็นเจ้าของช่วงสังเคราะห์เหล่านั้น

## การตั้งค่าการค้นหาเว็บ

รายการ provider ในเอกสารและโฟลว์การตั้งค่าจะเรียงตามตัวอักษร การตรวจจับอัตโนมัติจะเก็บ
ลำดับความสำคัญแยกต่างหาก

หากไม่ได้ตั้งค่า `provider` ไว้ OpenClaw จะตรวจสอบ provider ตามลำดับนี้และใช้
ตัวแรกที่พร้อมใช้งาน:

provider ที่ใช้ API ก่อน:

1. **Brave** -- `BRAVE_API_KEY` หรือ `plugins.entries.brave.config.webSearch.apiKey` (ลำดับ 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` หรือ `plugins.entries.minimax.config.webSearch.apiKey` (ลำดับ 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY`, หรือ `models.providers.google.apiKey` (ลำดับ 20)
4. **Grok** -- `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey` (ลำดับ 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` หรือ `plugins.entries.moonshot.config.webSearch.apiKey` (ลำดับ 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` หรือ `plugins.entries.perplexity.config.webSearch.apiKey` (ลำดับ 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webSearch.apiKey` (ลำดับ 60)
8. **Exa** -- `EXA_API_KEY` หรือ `plugins.entries.exa.config.webSearch.apiKey`; `plugins.entries.exa.config.webSearch.baseUrl` ที่เป็นตัวเลือกเสริมจะแทนที่ endpoint ของ Exa (ลำดับ 65)
9. **Tavily** -- `TAVILY_API_KEY` หรือ `plugins.entries.tavily.config.webSearch.apiKey` (ลำดับ 70)

fallback ที่ไม่ต้องใช้คีย์หลังจากนั้น:

10. **DuckDuckGo** -- fallback แบบ HTML ที่ไม่ต้องใช้คีย์ โดยไม่ต้องมีบัญชีหรือคีย์ API (ลำดับ 100)
11. **Ollama Web Search** -- fallback ที่ไม่ต้องใช้คีย์ผ่านโฮสต์ Ollama ในเครื่องที่คุณกำหนดค่าไว้เมื่อเข้าถึงได้และลงชื่อเข้าใช้ด้วย `ollama signin`; สามารถใช้ bearer auth ของ Ollama provider ซ้ำได้เมื่อโฮสต์ต้องการ และสามารถเรียกการค้นหาโดยตรงที่ `https://ollama.com` ได้เมื่อกำหนดค่าด้วย `OLLAMA_API_KEY` (ลำดับ 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl` (ลำดับ 200)

หากตรวจไม่พบ provider ระบบจะ fallback เป็น Brave (คุณจะได้รับข้อผิดพลาด
เรื่องคีย์ที่ขาดหายซึ่งแจ้งให้คุณกำหนดค่า)

<Note>
  ฟิลด์คีย์ของ provider ทั้งหมดรองรับอ็อบเจ็กต์ SecretRef SecretRefs ที่มีขอบเขตแบบ Plugin
  ภายใต้ `plugins.entries.<plugin>.config.webSearch.apiKey` จะถูก resolve สำหรับ
  provider ค้นหาเว็บที่ใช้ API ซึ่งบันเดิลมา รวมถึง Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity และ Tavily
  ไม่ว่า provider จะถูกเลือกอย่างชัดเจนผ่าน `tools.web.search.provider` หรือ
  ถูกเลือกผ่านการตรวจจับอัตโนมัติ ในโหมดตรวจจับอัตโนมัติ OpenClaw จะ resolve เฉพาะ
  คีย์ของ provider ที่เลือกเท่านั้น -- SecretRefs ที่ไม่ได้ถูกเลือกจะยังไม่ทำงาน คุณจึงสามารถ
  กำหนดค่า provider หลายตัวไว้ได้โดยไม่เสียต้นทุนการ resolve สำหรับ
  ตัวที่คุณไม่ได้ใช้
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
`plugins.entries.<plugin>.config.webSearch.*` นอกจากนี้ Gemini ยังสามารถใช้
`models.providers.google.apiKey` และ `models.providers.google.baseUrl` ซ้ำเป็น
fallback ลำดับความสำคัญต่ำกว่า หลังจากการกำหนดค่าเว็บค้นหาเฉพาะของตัวเองและ
`GEMINI_API_KEY` โปรดดูตัวอย่างในหน้าผู้ให้บริการ

`tools.web.search.provider` จะถูกตรวจสอบกับรหัสผู้ให้บริการเว็บค้นหาที่ประกาศไว้
โดย manifest ของ Plugin ที่บันเดิลมาและที่ติดตั้งไว้ การพิมพ์ผิด เช่น `"brvae"`
จะทำให้การตรวจสอบการกำหนดค่าล้มเหลว แทนที่จะ fallback ไปใช้การตรวจจับอัตโนมัติอย่างเงียบ ๆ หาก
ผู้ให้บริการที่กำหนดค่าไว้มีเพียงหลักฐาน Plugin ที่ค้างเก่า เช่น บล็อก
`plugins.entries.<plugin>` ที่เหลือหลังจากถอนการติดตั้ง Plugin บุคคลที่สาม
OpenClaw จะยังเริ่มต้นได้อย่างทนทานและรายงานคำเตือน เพื่อให้คุณติดตั้ง
Plugin ใหม่ หรือเรียกใช้ `openclaw doctor --fix` เพื่อล้างค่ากำหนดที่ค้างเก่า

การเลือกผู้ให้บริการ fallback ของ `web_fetch` แยกต่างหาก:

- เลือกด้วย `tools.web.fetch.provider`
- หรือละเว้นฟิลด์นั้นและให้ OpenClaw ตรวจจับผู้ให้บริการ web-fetch รายแรกที่พร้อมโดยอัตโนมัติ
  จากข้อมูลรับรองที่มี
- `web_fetch` ที่ไม่อยู่ในแซนด์บ็อกซ์สามารถใช้ผู้ให้บริการ Plugin ที่ติดตั้งไว้ซึ่งประกาศ
  `contracts.webFetchProviders`; fetch ที่อยู่ในแซนด์บ็อกซ์จะใช้เฉพาะที่บันเดิลมาเท่านั้น
- ปัจจุบันผู้ให้บริการ web-fetch ที่บันเดิลมาคือ Firecrawl ซึ่งกำหนดค่าไว้ภายใต้
  `plugins.entries.firecrawl.config.webFetch.*`

เมื่อคุณเลือก **Kimi** ระหว่าง `openclaw onboard` หรือ
`openclaw configure --section web` OpenClaw อาจถามเพิ่มเติมสำหรับ:

- ภูมิภาค API ของ Moonshot (`https://api.moonshot.ai/v1` หรือ `https://api.moonshot.cn/v1`)
- โมเดลเว็บค้นหา Kimi เริ่มต้น (ค่าเริ่มต้นคือ `kimi-k2.6`)

สำหรับ `x_search` ให้กำหนดค่า `plugins.entries.xai.config.xSearch.*` โดยใช้
fallback `XAI_API_KEY` เดียวกับเว็บค้นหา Grok
ค่ากำหนดแบบเดิม `tools.web.x_search.*` จะถูกย้ายโดยอัตโนมัติด้วย `openclaw doctor --fix`
เมื่อคุณเลือก Grok ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web`
OpenClaw ยังสามารถเสนอการตั้งค่า `x_search` แบบไม่บังคับด้วยคีย์เดียวกัน
ขั้นตอนนี้เป็นขั้นตอนติดตามผลแยกต่างหากภายในเส้นทางของ Grok ไม่ใช่ตัวเลือก
ผู้ให้บริการเว็บค้นหาระดับบนสุดแยกต่างหาก หากคุณเลือกผู้ให้บริการอื่น OpenClaw จะไม่
แสดงพรอมป์ `x_search`

### การจัดเก็บคีย์ API

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

| พารามิเตอร์           | คำอธิบาย                                              |
| --------------------- | ----------------------------------------------------- |
| `query`               | คำค้นหา (จำเป็น)                                      |
| `count`               | จำนวนผลลัพธ์ที่จะส่งคืน (1-10, ค่าเริ่มต้น: 5)        |
| `country`             | รหัสประเทศ ISO 2 ตัวอักษร (เช่น "US", "DE")          |
| `language`            | รหัสภาษา ISO 639-1 (เช่น "en", "de")                 |
| `search_lang`         | รหัสภาษาสำหรับการค้นหา (เฉพาะ Brave)                 |
| `freshness`           | ตัวกรองเวลา: `day`, `week`, `month` หรือ `year`       |
| `date_after`          | ผลลัพธ์หลังวันที่นี้ (YYYY-MM-DD)                     |
| `date_before`         | ผลลัพธ์ก่อนวันที่นี้ (YYYY-MM-DD)                     |
| `ui_lang`             | รหัสภาษา UI (เฉพาะ Brave)                            |
| `domain_filter`       | อาร์เรย์ allowlist/denylist ของโดเมน (เฉพาะ Perplexity) |
| `max_tokens`          | งบเนื้อหารวม ค่าเริ่มต้น 25000 (เฉพาะ Perplexity)     |
| `max_tokens_per_page` | ขีดจำกัดโทเค็นต่อหน้า ค่าเริ่มต้น 2048 (เฉพาะ Perplexity) |

<Warning>
  ไม่ใช่ทุกพารามิเตอร์จะทำงานได้กับผู้ให้บริการทุกเจ้า โหมด `llm-context` ของ Brave
  ปฏิเสธ `ui_lang`; `date_before` ยังต้องใช้ `date_after` ด้วย เพราะช่วง
  freshness แบบกำหนดเองของ Brave ต้องมีทั้งวันที่เริ่มต้นและวันที่สิ้นสุด
  Gemini, Grok และ Kimi ส่งคืนคำตอบสังเคราะห์หนึ่งรายการพร้อมการอ้างอิง โดย
  ยอมรับ `count` เพื่อความเข้ากันได้กับเครื่องมือที่ใช้ร่วมกัน แต่ค่านี้ไม่เปลี่ยนรูปแบบ
  คำตอบที่มีแหล่งรองรับ Gemini รองรับ `freshness`, `date_after` และ
  `date_before` โดยแปลงเป็นช่วงเวลาของ Google Search grounding
  Perplexity ทำงานแบบเดียวกันเมื่อคุณใช้เส้นทางความเข้ากันได้ Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` หรือ `OPENROUTER_API_KEY`)
  SearXNG ยอมรับ `http://` เฉพาะสำหรับโฮสต์ private-network หรือ local loopback ที่เชื่อถือได้;
  endpoint SearXNG สาธารณะต้องใช้ `https://`
  Firecrawl และ Tavily รองรับเฉพาะ `query` และ `count` ผ่าน `web_search`
  -- ใช้เครื่องมือเฉพาะของแต่ละตัวสำหรับตัวเลือกขั้นสูง
</Warning>

## x_search

`x_search` ค้นหาโพสต์ X (เดิมคือ Twitter) โดยใช้ xAI และส่งคืน
คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิง โดยรับคำค้นหาภาษาธรรมชาติและ
ตัวกรองแบบมีโครงสร้างที่ไม่บังคับ OpenClaw เปิดใช้งานเครื่องมือ `x_search`
ของ xAI ในตัวเฉพาะบนคำขอที่ให้บริการการเรียกเครื่องมือนี้เท่านั้น

<Note>
  xAI ระบุไว้ในเอกสารว่า `x_search` รองรับการค้นหาด้วยคีย์เวิร์ด การค้นหาเชิงความหมาย การค้นหาผู้ใช้
  และการดึงเธรด สำหรับสถิติการมีส่วนร่วมต่อโพสต์ เช่น การ repost,
  การตอบกลับ, bookmarks หรือยอดดู ควรใช้การค้นหาเป้าหมายสำหรับ URL โพสต์ที่ตรงกัน
  หรือ ID สถานะ การค้นหาด้วยคีย์เวิร์ดแบบกว้างอาจพบโพสต์ที่ถูกต้องแต่ส่งคืน
  เมทาดาทาต่อโพสต์ไม่ครบถ้วนเท่า รูปแบบที่ดีคือ: หาโพสต์ให้พบก่อน จากนั้น
  เรียกใช้คำค้นหา `x_search` ครั้งที่สองโดยมุ่งไปที่โพสต์นั้นโดยตรง
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

`x_search` จะโพสต์ไปที่ `<baseUrl>/responses` เมื่อ
ตั้งค่า `plugins.entries.xai.config.xSearch.baseUrl` หากละเว้นฟิลด์นั้น
จะ fallback ไปที่ `plugins.entries.xai.config.webSearch.baseUrl` จากนั้นเป็น
`tools.web.search.grok.baseUrl` แบบเดิม และสุดท้ายเป็น endpoint xAI สาธารณะ

### พารามิเตอร์ x_search

| พารามิเตอร์                 | คำอธิบาย                                             |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | คำค้นหา (จำเป็น)                                      |
| `allowed_x_handles`          | จำกัดผลลัพธ์ไว้ที่ X handles เฉพาะ                    |
| `excluded_x_handles`         | ยกเว้น X handles เฉพาะ                                |
| `from_date`                  | รวมเฉพาะโพสต์ในหรือหลังวันที่นี้ (YYYY-MM-DD)         |
| `to_date`                    | รวมเฉพาะโพสต์ในหรือก่อนวันที่นี้ (YYYY-MM-DD)         |
| `enable_image_understanding` | ให้ xAI ตรวจสอบรูปภาพที่แนบกับโพสต์ที่ตรงกัน          |
| `enable_video_understanding` | ให้ xAI ตรวจสอบวิดีโอที่แนบกับโพสต์ที่ตรงกัน          |

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

หากคุณใช้โปรไฟล์เครื่องมือหรือ allowlist ให้เพิ่ม `web_search`, `x_search` หรือ `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## ที่เกี่ยวข้อง

- [การดึงข้อมูลเว็บ](/th/tools/web-fetch) -- ดึง URL และแยกเนื้อหาที่อ่านได้
- [เบราว์เซอร์เว็บ](/th/tools/browser) -- การทำงานอัตโนมัติเต็มรูปแบบของเบราว์เซอร์สำหรับไซต์ที่ใช้ JS หนัก
- [การค้นหา Grok](/th/tools/grok-search) -- Grok ในฐานะผู้ให้บริการ `web_search`
- [การค้นหาเว็บ Ollama](/th/tools/ollama-search) -- การค้นหาเว็บแบบไม่ต้องใช้คีย์ผ่านโฮสต์ Ollama ของคุณ
