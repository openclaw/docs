---
read_when:
    - คุณต้องการกำหนดค่า Perplexity เป็นผู้ให้บริการค้นหาเว็บ
    - คุณต้องมีคีย์ API ของ Perplexity หรือตั้งค่าพร็อกซี OpenRouter
summary: การตั้งค่าผู้ให้บริการค้นหาเว็บ Perplexity (คีย์ API, โหมดการค้นหา, การกรอง)
title: Perplexity
x-i18n:
    generated_at: "2026-07-12T16:40:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Plugin Perplexity ลงทะเบียนผู้ให้บริการ `web_search` พร้อมวิธีรับส่งข้อมูลสองแบบ ได้แก่ Perplexity Search API แบบเนทีฟ (ผลลัพธ์แบบมีโครงสร้างพร้อมตัวกรอง) และการเติมข้อความสนทนา Perplexity Sonar ทั้งแบบเชื่อมต่อโดยตรงหรือผ่าน OpenRouter (คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิง)

<Note>
หน้านี้ครอบคลุมการตั้งค่า **ผู้ให้บริการ** Perplexity สำหรับ **เครื่องมือ** Perplexity (วิธีที่เอเจนต์ใช้งาน) โปรดดู [การค้นหาด้วย Perplexity](/th/tools/perplexity-search)
</Note>

| คุณสมบัติ    | ค่า                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| ประเภท        | ผู้ให้บริการค้นหาเว็บ (ไม่ใช่ผู้ให้บริการโมเดล)                             |
| การยืนยันตัวตน        | `PERPLEXITY_API_KEY` (แบบเนทีฟ) หรือ `OPENROUTER_API_KEY` (ผ่าน OpenRouter) |
| พาธการกำหนดค่า | `plugins.entries.perplexity.config.webSearch.apiKey`                   |
| การเขียนทับ   | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`       |
| รับคีย์   | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)   |

## ติดตั้ง Plugin

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่าคีย์ API">
    ```bash
    openclaw configure --section web
    ```

    หรือตั้งค่าคีย์โดยตรง:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    สามารถใช้คีย์ที่ส่งออกเป็น `PERPLEXITY_API_KEY` หรือ `OPENROUTER_API_KEY` ในสภาพแวดล้อมของ Gateway ได้เช่นกัน

  </Step>
  <Step title="เริ่มค้นหา">
    `web_search` จะตรวจหา Perplexity โดยอัตโนมัติเมื่อคีย์ของ Perplexity เป็นข้อมูลประจำตัวสำหรับการค้นหาที่พร้อมใช้งาน โดยไม่ต้องตั้งค่าเพิ่มเติม หากต้องการกำหนดผู้ให้บริการอย่างชัดเจน:

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## โหมดการค้นหา

Plugin จะกำหนดวิธีรับส่งข้อมูลตามลำดับต่อไปนี้:

1. มีการตั้งค่า `webSearch.baseUrl` หรือ `webSearch.model`: กำหนดเส้นทางผ่านการเติมข้อความสนทนา Sonar ไปยังปลายทางนั้นเสมอ โดยไม่คำนึงถึงประเภทคีย์
2. มิฉะนั้น แหล่งที่มาของคีย์จะเป็นตัวกำหนดปลายทาง: คำนำหน้าของคีย์ที่กำหนดค่าไว้จะเลือกวิธีรับส่งข้อมูล (ค่ากำหนดมีลำดับความสำคัญเหนือกว่าตัวแปรสภาพแวดล้อม) ส่วนคีย์จากสภาพแวดล้อมจะใช้ปลายทางที่ตรงกันโดยตรง

| คำนำหน้าคีย์ | วิธีรับส่งข้อมูล                                                  | ความสามารถ                                         |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `pplx-`    | Perplexity Search API แบบเนทีฟ (`https://api.perplexity.ai`) | ผลลัพธ์แบบมีโครงสร้าง ตัวกรองโดเมน/ภาษา/วันที่ |
| `sk-or-`   | OpenRouter (`https://openrouter.ai/api/v1`), โมเดล Sonar   | คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิง            |

คีย์ที่กำหนดค่าไว้ซึ่งมีคำนำหน้าอื่นจะใช้ Search API แบบเนทีฟเช่นกัน พาธการเติมข้อความสนทนาจะใช้โมเดล `perplexity/sonar-pro` เป็นค่าเริ่มต้น โดยเขียนทับได้ด้วย `plugins.entries.perplexity.config.webSearch.model`

## การกรองของ API แบบเนทีฟ

| ตัวกรอง                               | คำอธิบาย                                                     | วิธีรับส่งข้อมูล   |
| ------------------------------------ | --------------------------------------------------------------- | ----------- |
| `count`                              | จำนวนผลลัพธ์ต่อการค้นหา 1-10 (ค่าเริ่มต้น 5)                            | แบบเนทีฟเท่านั้น |
| `freshness`                          | ช่วงเวลาความใหม่: `day`, `week`, `month`, `year`                  | ทั้งสองแบบ        |
| `country`                            | รหัสประเทศ 2 ตัวอักษร (`us`, `de`, `jp`)                        | แบบเนทีฟเท่านั้น |
| `language`                           | รหัสภาษา ISO 639-1 (`en`, `fr`, `zh`)                      | แบบเนทีฟเท่านั้น |
| `date_after` / `date_before`         | ช่วงวันที่เผยแพร่ในรูปแบบ `YYYY-MM-DD`                            | แบบเนทีฟเท่านั้น |
| `domain_filter`                      | สูงสุด 20 โดเมน โดยเป็นรายการที่อนุญาตหรือรายการที่ไม่อนุญาตซึ่งนำหน้าด้วย `-` และห้ามใช้ทั้งสองแบบร่วมกัน | แบบเนทีฟเท่านั้น |
| `max_tokens` / `max_tokens_per_page` | งบประมาณเนื้อหาสำหรับผลลัพธ์ทั้งหมด / ต่อหน้า                    | แบบเนทีฟเท่านั้น |

ตัวกรองที่รองรับเฉพาะแบบเนทีฟจะแสดงข้อผิดพลาดพร้อมคำอธิบายเมื่อใช้พาธการเติมข้อความสนทนา
ไม่สามารถใช้ `freshness` ร่วมกับ `date_after`/`date_before` ได้

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวแปรสภาพแวดล้อมสำหรับกระบวนการดีมอน">
    <Warning>
    คีย์ที่ส่งออกเฉพาะในเชลล์แบบโต้ตอบจะไม่ปรากฏต่อดีมอน Gateway ของ launchd/systemd เว้นแต่จะนำเข้าสภาพแวดล้อมนั้นอย่างชัดเจน ตั้งค่าคีย์ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้กระบวนการ Gateway อ่านได้ โปรดดู [ตัวแปรสภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญทั้งหมด
    </Warning>
  </Accordion>

  <Accordion title="การตั้งค่าพร็อกซี OpenRouter">
    หากต้องการกำหนดเส้นทางการค้นหาด้วย Perplexity ผ่าน OpenRouter ให้ตั้งค่า `OPENROUTER_API_KEY` (คำนำหน้า `sk-or-`) แทนคีย์ Perplexity แบบเนทีฟ OpenClaw จะตรวจหาคีย์และเปลี่ยนไปใช้วิธีรับส่งข้อมูล Sonar โดยอัตโนมัติ ซึ่งมีประโยชน์หากคุณตั้งค่าการเรียกเก็บเงินของ OpenRouter ไว้แล้วและต้องการรวมผู้ให้บริการไว้ที่นั่น
  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เครื่องมือค้นหา Perplexity" href="/th/tools/perplexity-search" icon="magnifying-glass">
    วิธีที่เอเจนต์เรียกใช้การค้นหาด้วย Perplexity และตีความผลลัพธ์
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าฉบับเต็ม รวมถึงรายการ Plugin
  </Card>
</CardGroup>
