---
read_when:
    - คุณต้องการใช้ LongCat-2.0 กับ OpenClaw
    - คุณต้องมีคีย์ API ของ LongCat หรือขีดจำกัดของโมเดล
summary: การตั้งค่า LongCat API สำหรับ LongCat-2.0
title: LongCat
x-i18n:
    generated_at: "2026-07-12T16:38:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) ให้บริการ API แบบโฮสต์สำหรับ LongCat-2.0 ซึ่งเป็นโมเดลการให้เหตุผลที่สร้างขึ้นสำหรับงานเขียนโค้ดและเวิร์กโหลดแบบเอเจนต์ OpenClaw มี Plugin `longcat` อย่างเป็นทางการสำหรับเอนด์พอยต์ที่เข้ากันได้กับ OpenAI ของ LongCat

| คุณสมบัติ     | ค่า                                      |
| ------------- | ---------------------------------------- |
| ผู้ให้บริการ  | `longcat`                                |
| การยืนยันตัวตน | `LONGCAT_API_KEY`                       |
| API           | Chat Completions ที่เข้ากันได้กับ OpenAI |
| URL ฐาน       | `https://api.longcat.chat/openai`        |
| โมเดล         | `longcat/LongCat-2.0`                    |
| บริบท         | 1,048,576 โทเค็น                         |
| เอาต์พุตสูงสุด | 131,072 โทเค็น                          |
| อินพุต        | ข้อความ                                  |

## ติดตั้ง Plugin

ติดตั้งแพ็กเกจอย่างเป็นทางการ แล้วรีสตาร์ต Gateway:

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้างคีย์ API">
    ลงชื่อเข้าใช้ [แพลตฟอร์ม LongCat API](https://longcat.chat/platform/) และ
    สร้างคีย์ในหน้า [API Keys](https://longcat.chat/platform/api_keys)
  </Step>
  <Step title="เรียกใช้การเริ่มต้นระบบ">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="ตรวจสอบโมเดล">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

การเริ่มต้นระบบจะเพิ่มแค็ตตาล็อกแบบโฮสต์และเลือก `longcat/LongCat-2.0` เมื่อยัง
ไม่ได้กำหนดค่าโมเดลหลักไว้

### การตั้งค่าแบบไม่โต้ตอบ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## ลักษณะการทำงานของการให้เหตุผล

LongCat มีการควบคุมการคิดแบบเปิดหรือปิด OpenClaw จะแมประดับการคิดที่เปิดใช้งาน
ไปยัง `thinking: { type: "enabled" }` และแมป `/think off` ไปยัง
`thinking: { type: "disabled" }` ปัจจุบัน LongCat ยังไม่มีเอกสารเกี่ยวกับ
`reasoning_effort` ดังนั้น OpenClaw จึงไม่ส่งค่านี้

LongCat ส่งคืนการให้เหตุผลใน `reasoning_content` OpenClaw จะคงฟิลด์ดังกล่าวไว้
เมื่อเล่นซ้ำเทิร์นการเรียกใช้เครื่องมือของผู้ช่วย เพื่อให้เซสชันเอเจนต์แบบหลายเทิร์น
ยังคงมีรูปแบบข้อความตามที่ผู้ให้บริการคาดไว้

## ราคา

แค็ตตาล็อกในตัวใช้ราคาตามการใช้งานจริงของ LongCat ในหน่วยดอลลาร์สหรัฐต่อหนึ่งล้าน
โทเค็น ได้แก่ อินพุตที่ไม่ใช้แคช $0.75 อินพุตที่ใช้แคช $0.015 และเอาต์พุต $2.95
LongCat อาจเสนอส่วนลดชั่วคราว โดย[หน้าราคา](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
และบันทึกการเรียกเก็บเงินของคุณถือเป็นข้อมูลอ้างอิงที่เชื่อถือได้

## LongCat-2.0 ที่โฮสต์ด้วยตนเอง

ผู้ให้บริการ `longcat` มีเป้าหมายสำหรับ API แบบโฮสต์ของ LongCat สำหรับน้ำหนักโมเดลแบบเปิดบน
[Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0) ให้บริการ
โมเดลผ่านรันไทม์ที่เข้ากันได้กับ OpenAI และใช้ผู้ให้บริการ
[vLLM](/th/providers/vllm) หรือ [SGLang](/th/providers/sglang) ที่มีอยู่แล้วของ OpenClaw แทน

เก็บตัวระบุโมเดลที่ตรงกับรันไทม์ไว้ในแค็ตตาล็อกของผู้ให้บริการที่โฮสต์ด้วยตนเอง
อย่ากำหนดเส้นทางการติดตั้งใช้งานภายในเครื่องผ่าน `longcat/LongCat-2.0`

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="คีย์ใช้งานได้ในเชลล์ แต่ใช้ไม่ได้ใน Gateway">
    กระบวนการ Gateway ที่จัดการโดยดีมอนจะไม่ได้รับตัวแปรทุกตัวจากเชลล์แบบโต้ตอบ
    ใส่ `LONGCAT_API_KEY` ใน `~/.openclaw/.env` กำหนดค่าผ่าน
    การเริ่มต้นระบบ หรือใช้ข้อมูลอ้างอิงข้อมูลลับที่ได้รับอนุมัติ
  </Accordion>

  <Accordion title="คำขอล้มเหลวด้วยรหัส 402 หรือ 429">
    `402` หมายถึงบัญชีมีโควตาโทเค็นไม่เพียงพอ `429` หมายถึงคีย์ API
    ใช้งานถึงขีดจำกัดอัตราแล้ว ตรวจสอบ[การใช้งาน LongCat](https://longcat.chat/platform/usage)
    และลองส่งคำขอที่ถูกจำกัดอัตราอีกครั้งหลังพ้นช่วงหน่วงเวลาของผู้ให้บริการ
  </Accordion>

  <Accordion title="โมเดลไม่ปรากฏ">
    เรียกใช้ `openclaw plugins list` และยืนยันว่า Plugin `longcat`
    เปิดใช้งานอยู่ จากนั้นเรียกใช้ `openclaw models list --provider longcat`
  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    การกำหนดค่าผู้ให้บริการ ข้อมูลอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="เอกสาร LongCat API" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    เอนด์พอยต์ API แบบโฮสต์ การยืนยันตัวตน ขีดจำกัด และตัวอย่าง
  </Card>
  <Card title="การ์ดโมเดล LongCat-2.0" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    สถาปัตยกรรม แนวทางการติดตั้งใช้งาน และรายละเอียดของโมเดล
  </Card>
  <Card title="ข้อมูลลับ" href="/th/gateway/secrets" icon="key">
    จัดเก็บข้อมูลรับรองของผู้ให้บริการโดยไม่ฝังข้อความธรรมดาไว้ในการกำหนดค่า
  </Card>
</CardGroup>
