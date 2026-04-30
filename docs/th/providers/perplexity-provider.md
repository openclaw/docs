---
read_when:
    - คุณต้องการกำหนดค่า Perplexity เป็นผู้ให้บริการค้นหาเว็บ
    - คุณต้องมีคีย์ Perplexity API หรือการตั้งค่าพร็อกซี OpenRouter
summary: การตั้งค่าผู้ให้บริการค้นหาเว็บ Perplexity (คีย์ API, โหมดการค้นหา, การกรอง)
title: Perplexity
x-i18n:
    generated_at: "2026-04-30T10:13:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36475ba0d6ab7d569f83b7f6fdc13c5dbe6b12ca5acab44e8d213da23d04a795
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Plugin Perplexity มอบความสามารถในการค้นหาเว็บผ่าน Perplexity
Search API หรือ Perplexity Sonar ผ่าน OpenRouter

<Note>
หน้านี้เป็นการตั้งค่า **ผู้ให้บริการ** Perplexity สำหรับ **เครื่องมือ** Perplexity (วิธีที่เอเจนต์ใช้งาน) โปรดดู [เครื่องมือ Perplexity](/th/tools/perplexity-search)
</Note>

| คุณสมบัติ      | ค่า                                                                     |
| ----------- | ---------------------------------------------------------------------- |
| ประเภท        | ผู้ให้บริการค้นหาเว็บ (ไม่ใช่ผู้ให้บริการโมเดล)                         |
| การยืนยันตัวตน | `PERPLEXITY_API_KEY` (โดยตรง) หรือ `OPENROUTER_API_KEY` (ผ่าน OpenRouter) |
| พาธการกำหนดค่า | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่าคีย์ API">
    เรียกใช้โฟลว์การกำหนดค่าการค้นหาเว็บแบบโต้ตอบ:

    ```bash
    openclaw configure --section web
    ```

    หรือตั้งค่าคีย์โดยตรง:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="เริ่มค้นหา">
    เอเจนต์จะใช้ Perplexity สำหรับการค้นหาเว็บโดยอัตโนมัติเมื่อกำหนดค่าคีย์แล้ว
    ไม่จำเป็นต้องมีขั้นตอนเพิ่มเติม
  </Step>
</Steps>

## โหมดการค้นหา

Plugin จะเลือกกลไกการรับส่งข้อมูลโดยอัตโนมัติตามคำนำหน้าคีย์ API:

<Tabs>
  <Tab title="Perplexity API แบบเนทีฟ (pplx-)">
    เมื่อคีย์ของคุณขึ้นต้นด้วย `pplx-` OpenClaw จะใช้ Perplexity Search
    API แบบเนทีฟ กลไกการรับส่งข้อมูลนี้ส่งคืนผลลัพธ์แบบมีโครงสร้าง และรองรับตัวกรองโดเมน ภาษา
    และวันที่ (ดูตัวเลือกการกรองด้านล่าง)
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    เมื่อคีย์ของคุณขึ้นต้นด้วย `sk-or-` OpenClaw จะกำหนดเส้นทางผ่าน OpenRouter โดยใช้
    โมเดล Perplexity Sonar กลไกการรับส่งข้อมูลนี้ส่งคืนคำตอบที่ AI สังเคราะห์พร้อม
    การอ้างอิง
  </Tab>
</Tabs>

| คำนำหน้าคีย์ | กลไกการรับส่งข้อมูล        | ความสามารถ                                      |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | Perplexity Search API แบบเนทีฟ | ผลลัพธ์แบบมีโครงสร้าง, ตัวกรองโดเมน/ภาษา/วันที่ |
| `sk-or-`   | OpenRouter (Sonar)           | คำตอบที่ AI สังเคราะห์พร้อมการอ้างอิง            |

## การกรองของ API แบบเนทีฟ

<Note>
ตัวเลือกการกรองมีให้ใช้เฉพาะเมื่อใช้ Perplexity API แบบเนทีฟ
(คีย์ `pplx-`) การค้นหาของ OpenRouter/Sonar ไม่รองรับพารามิเตอร์เหล่านี้
</Note>

เมื่อใช้ Perplexity API แบบเนทีฟ การค้นหารองรับตัวกรองต่อไปนี้:

| ตัวกรอง         | คำอธิบาย                              | ตัวอย่าง                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| ประเทศ        | รหัสประเทศ 2 ตัวอักษร                  | `us`, `de`, `jp`                    |
| ภาษา          | รหัสภาษา ISO 639-1                    | `en`, `fr`, `zh`                    |
| ช่วงวันที่      | กรอบเวลาความใหม่                       | `day`, `week`, `month`, `year`      |
| ตัวกรองโดเมน | รายการอนุญาตหรือรายการปฏิเสธ (สูงสุด 20 โดเมน) | `example.com`                       |
| งบประมาณเนื้อหา | ขีดจำกัดโทเค็นต่อคำตอบ / ต่อหน้า       | `max_tokens`, `max_tokens_per_page` |

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวแปรสภาพแวดล้อมสำหรับกระบวนการเดมอน">
    หาก OpenClaw Gateway ทำงานเป็นเดมอน (launchd/systemd) โปรดตรวจสอบให้แน่ใจว่า
    `PERPLEXITY_API_KEY` พร้อมใช้งานสำหรับกระบวนการนั้น

    <Warning>
    คีย์ที่ตั้งไว้เฉพาะใน `~/.profile` จะไม่ปรากฏต่อเดมอน launchd/systemd
    เว้นแต่ว่าสภาพแวดล้อมนั้นจะถูกนำเข้าอย่างชัดเจน ตั้งค่าคีย์ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่ากระบวนการ Gateway สามารถ
    อ่านคีย์ได้
    </Warning>

  </Accordion>

  <Accordion title="การตั้งค่าพร็อกซี OpenRouter">
    หากคุณต้องการกำหนดเส้นทางการค้นหา Perplexity ผ่าน OpenRouter ให้ตั้งค่า
    `OPENROUTER_API_KEY` (คำนำหน้า `sk-or-`) แทนคีย์ Perplexity แบบเนทีฟ
    OpenClaw จะตรวจจับคำนำหน้าและสลับไปใช้กลไกการรับส่งข้อมูล Sonar
    โดยอัตโนมัติ

    <Tip>
    กลไกการรับส่งข้อมูล OpenRouter มีประโยชน์หากคุณมีบัญชี OpenRouter อยู่แล้ว
    และต้องการรวมการเรียกเก็บเงินสำหรับผู้ให้บริการหลายรายไว้ด้วยกัน
    </Tip>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เครื่องมือค้นหา Perplexity" href="/th/tools/perplexity-search" icon="magnifying-glass">
    วิธีที่เอเจนต์เรียกใช้การค้นหา Perplexity และตีความผลลัพธ์
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าฉบับเต็ม รวมถึงรายการ Plugin
  </Card>
</CardGroup>
