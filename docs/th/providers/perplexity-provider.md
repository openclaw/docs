---
read_when:
    - คุณต้องการกำหนดค่า Perplexity เป็น provider สำหรับการค้นหาเว็บ
    - คุณต้องการการตั้งค่า API key ของ Perplexity หรือพร็อกซี OpenRouter
summary: การตั้งค่า provider การค้นหาเว็บของ Perplexity (API key, โหมดการค้นหา, การกรอง)
title: Perplexity
x-i18n:
    generated_at: "2026-04-25T13:57:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: d913d71c1b3a5cfbd755efff9235adfd5dd460ef606a6d229d2cceb5134174d3
    source_path: providers/perplexity-provider.md
    workflow: 15
---

Plugin ของ Perplexity ให้ความสามารถในการค้นหาเว็บผ่าน Perplexity
Search API หรือ Perplexity Sonar ผ่าน OpenRouter

<Note>
หน้านี้ครอบคลุมการตั้งค่า **provider** ของ Perplexity สำหรับ
**tool** ของ Perplexity (วิธีที่เอเจนต์ใช้งานมัน) ดู [Perplexity tool](/th/tools/perplexity-search)
</Note>

| คุณสมบัติ    | ค่า                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| ประเภท        | provider สำหรับการค้นหาเว็บ (ไม่ใช่ model provider)                             |
| Auth        | `PERPLEXITY_API_KEY` (โดยตรง) หรือ `OPENROUTER_API_KEY` (ผ่าน OpenRouter) |
| พาธ config | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key">
    รันโฟลว์การกำหนดค่า web-search แบบอินเทอร์แอคทีฟ:

    ```bash
    openclaw configure --section web
    ```

    หรือกำหนดคีย์โดยตรง:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="เริ่มค้นหา">
    เอเจนต์จะใช้ Perplexity สำหรับการค้นหาเว็บโดยอัตโนมัติเมื่อมี
    การกำหนดค่าคีย์แล้ว ไม่ต้องทำขั้นตอนเพิ่มเติม
  </Step>
</Steps>

## โหมดการค้นหา

Plugin จะเลือก transport โดยอัตโนมัติตาม prefix ของ API key:

<Tabs>
  <Tab title="Native Perplexity API (pplx-)">
    เมื่อคีย์ของคุณขึ้นต้นด้วย `pplx-`, OpenClaw จะใช้ Perplexity Search
    API แบบเนทีฟ transport นี้จะคืนผลลัพธ์แบบมีโครงสร้าง และรองรับตัวกรองตามโดเมน ภาษา
    และวันที่ (ดูตัวเลือกการกรองด้านล่าง)
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    เมื่อคีย์ของคุณขึ้นต้นด้วย `sk-or-`, OpenClaw จะกำหนดเส้นทางผ่าน OpenRouter โดยใช้
    โมเดล Perplexity Sonar transport นี้จะคืนคำตอบที่สังเคราะห์โดย AI พร้อม
    citations
  </Tab>
</Tabs>

| prefix ของคีย์ | Transport                    | ความสามารถ                                         |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | Native Perplexity Search API | ผลลัพธ์แบบมีโครงสร้าง, ตัวกรองโดเมน/ภาษา/วันที่ |
| `sk-or-`   | OpenRouter (Sonar)           | คำตอบที่สังเคราะห์โดย AI พร้อม citations            |

## การกรองใน Native API

<Note>
ตัวเลือกการกรองมีให้ใช้เฉพาะเมื่อใช้ native Perplexity API
(คีย์ `pplx-`) เท่านั้น การค้นหาผ่าน OpenRouter/Sonar ไม่รองรับพารามิเตอร์เหล่านี้
</Note>

เมื่อใช้ native Perplexity API การค้นหารองรับตัวกรองต่อไปนี้:

| ตัวกรอง         | คำอธิบาย                            | ตัวอย่าง                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| ประเทศ        | รหัสประเทศ 2 ตัวอักษร                  | `us`, `de`, `jp`                    |
| ภาษา       | รหัสภาษา ISO 639-1                | `en`, `fr`, `zh`                    |
| ช่วงวันที่     | หน้าต่างของความใหม่ล่าสุด                         | `day`, `week`, `month`, `year`      |
| ตัวกรองโดเมน | allowlist หรือ denylist (สูงสุด 20 โดเมน) | `example.com`                       |
| งบประมาณเนื้อหา | ขีดจำกัดโทเค็นต่อการตอบกลับ / ต่อหน้า   | `max_tokens`, `max_tokens_per_page` |

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวแปรสภาพแวดล้อมสำหรับโปรเซส daemon">
    หาก OpenClaw Gateway ทำงานเป็น daemon (launchd/systemd) ให้แน่ใจว่า
    `PERPLEXITY_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น

    <Warning>
    คีย์ที่ตั้งไว้เฉพาะใน `~/.profile` จะไม่มองเห็นได้จาก daemon ของ launchd/systemd
    เว้นแต่จะมีการนำเข้าสภาพแวดล้อมนั้นอย่างชัดเจน ให้ตั้งค่าคีย์ไว้ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่าโปรเซส gateway
    สามารถอ่านได้
    </Warning>

  </Accordion>

  <Accordion title="การตั้งค่า OpenRouter proxy">
    หากคุณต้องการกำหนดเส้นทางการค้นหาของ Perplexity ผ่าน OpenRouter ให้ตั้งค่า
    `OPENROUTER_API_KEY` (prefix `sk-or-`) แทนคีย์ Perplexity แบบเนทีฟ
    OpenClaw จะตรวจจับ prefix และสลับไปใช้ Sonar transport
    โดยอัตโนมัติ

    <Tip>
    OpenRouter transport มีประโยชน์หากคุณมีบัญชี OpenRouter อยู่แล้ว
    และต้องการรวมการคิดค่าบริการข้ามหลาย providers ไว้ด้วยกัน
    </Tip>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เครื่องมือค้นหาของ Perplexity" href="/th/tools/perplexity-search" icon="magnifying-glass">
    วิธีที่เอเจนต์เรียกใช้การค้นหาของ Perplexity และตีความผลลัพธ์
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าแบบเต็ม รวมถึง plugin entries
  </Card>
</CardGroup>
