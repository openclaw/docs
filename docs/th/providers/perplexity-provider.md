---
read_when:
    - คุณต้องการกำหนดค่า Perplexity เป็นผู้ให้บริการค้นหาเว็บ
    - คุณต้องมีคีย์ API ของ Perplexity หรือการตั้งค่าพร็อกซี OpenRouter
summary: การตั้งค่าผู้ให้บริการค้นหาเว็บ Perplexity (API key, โหมดการค้นหา, การกรอง)
title: Perplexity
x-i18n:
    generated_at: "2026-06-27T18:16:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Plugin Perplexity มอบความสามารถในการค้นหาเว็บผ่าน Perplexity
Search API หรือ Perplexity Sonar ผ่าน OpenRouter

<Note>
หน้านี้คือการตั้งค่า **provider** ของ Perplexity สำหรับ **tool** ของ Perplexity (วิธีที่เอเจนต์ใช้) โปรดดู [tool ของ Perplexity](/th/tools/perplexity-search)
</Note>

| คุณสมบัติ    | ค่า                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| ประเภท        | ผู้ให้บริการค้นหาเว็บ (ไม่ใช่ผู้ให้บริการโมเดล)                             |
| การยืนยันตัวตน        | `PERPLEXITY_API_KEY` (โดยตรง) หรือ `OPENROUTER_API_KEY` (ผ่าน OpenRouter) |
| พาธการกำหนดค่า | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วรีสตาร์ต Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key">
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
    เอเจนต์จะใช้ Perplexity สำหรับการค้นหาเว็บโดยอัตโนมัติเมื่อกำหนดค่า
    คีย์แล้ว ไม่ต้องดำเนินการขั้นตอนเพิ่มเติม
  </Step>
</Steps>

## โหมดการค้นหา

Plugin จะเลือกทรานสปอร์ตโดยอัตโนมัติตามคำนำหน้า API key:

<Tabs>
  <Tab title="Perplexity API แบบเนทีฟ (pplx-)">
    เมื่อคีย์ของคุณขึ้นต้นด้วย `pplx-` OpenClaw จะใช้ Perplexity Search
    API แบบเนทีฟ ทรานสปอร์ตนี้ส่งคืนผลลัพธ์แบบมีโครงสร้าง และรองรับตัวกรองโดเมน ภาษา
    และวันที่ (ดูตัวเลือกการกรองด้านล่าง)
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    เมื่อคีย์ของคุณขึ้นต้นด้วย `sk-or-` OpenClaw จะกำหนดเส้นทางผ่าน OpenRouter โดยใช้
    โมเดล Perplexity Sonar ทรานสปอร์ตนี้ส่งคืนคำตอบที่ AI สังเคราะห์ขึ้นพร้อม
    การอ้างอิง
  </Tab>
</Tabs>

| คำนำหน้าคีย์ | ทรานสปอร์ต                    | ความสามารถ                                         |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | Perplexity Search API แบบเนทีฟ | ผลลัพธ์แบบมีโครงสร้าง, ตัวกรองโดเมน/ภาษา/วันที่ |
| `sk-or-`   | OpenRouter (Sonar)           | คำตอบที่ AI สังเคราะห์ขึ้นพร้อมการอ้างอิง            |

## การกรอง API แบบเนทีฟ

<Note>
ตัวเลือกการกรองมีให้ใช้เฉพาะเมื่อใช้ Perplexity API แบบเนทีฟ
(คีย์ `pplx-`) การค้นหา OpenRouter/Sonar ไม่รองรับพารามิเตอร์เหล่านี้
</Note>

เมื่อใช้ Perplexity API แบบเนทีฟ การค้นหารองรับตัวกรองต่อไปนี้:

| ตัวกรอง         | คำอธิบาย                            | ตัวอย่าง                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| ประเทศ        | รหัสประเทศ 2 ตัวอักษร                  | `us`, `de`, `jp`                    |
| ภาษา       | รหัสภาษา ISO 639-1                | `en`, `fr`, `zh`                    |
| ช่วงวันที่     | หน้าต่างความใหม่ของข้อมูล                         | `day`, `week`, `month`, `year`      |
| ตัวกรองโดเมน | รายการอนุญาตหรือรายการปฏิเสธ (สูงสุด 20 โดเมน) | `example.com`                       |
| งบประมาณเนื้อหา | ขีดจำกัดโทเค็นต่อการตอบกลับ / ต่อหน้า   | `max_tokens`, `max_tokens_per_page` |

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวแปรสภาพแวดล้อมสำหรับโปรเซส daemon">
    หาก OpenClaw Gateway ทำงานเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า
    `PERPLEXITY_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น

    <Warning>
    คีย์ที่ export ไว้เฉพาะในเชลล์แบบโต้ตอบจะไม่ปรากฏต่อ
    daemon ของ launchd/systemd เว้นแต่จะนำเข้าสภาพแวดล้อมนั้นอย่างชัดเจน ให้ตั้งค่า
    คีย์ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่าโปรเซส gateway
    สามารถอ่านได้
    </Warning>

  </Accordion>

  <Accordion title="การตั้งค่าพร็อกซี OpenRouter">
    หากคุณต้องการกำหนดเส้นทางการค้นหา Perplexity ผ่าน OpenRouter ให้ตั้งค่า
    `OPENROUTER_API_KEY` (คำนำหน้า `sk-or-`) แทนคีย์ Perplexity แบบเนทีฟ
    OpenClaw จะตรวจจับคำนำหน้าและสลับไปใช้ทรานสปอร์ต Sonar
    โดยอัตโนมัติ

    <Tip>
    ทรานสปอร์ต OpenRouter มีประโยชน์หากคุณมีบัญชี OpenRouter อยู่แล้ว
    และต้องการรวมการเรียกเก็บเงินจากผู้ให้บริการหลายรายไว้ด้วยกัน
    </Tip>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เครื่องมือค้นหา Perplexity" href="/th/tools/perplexity-search" icon="magnifying-glass">
    วิธีที่เอเจนต์เรียกใช้การค้นหา Perplexity และตีความผลลัพธ์
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าแบบครบถ้วน รวมถึงรายการ Plugin
  </Card>
</CardGroup>
