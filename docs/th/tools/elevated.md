---
read_when:
    - การปรับค่าเริ่มต้นของโหมดสิทธิ์ยกระดับ รายการอนุญาต หรือพฤติกรรมของคำสั่งสแลช
    - ทำความเข้าใจวิธีที่เอเจนต์ในแซนด์บ็อกซ์สามารถเข้าถึงโฮสต์
summary: 'โหมดการรันคำสั่งแบบยกระดับสิทธิ์: รันคำสั่งนอกแซนด์บ็อกซ์จากเอเจนต์ที่อยู่ในแซนด์บ็อกซ์'
title: โหมดยกระดับสิทธิ์
x-i18n:
    generated_at: "2026-05-06T09:33:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91aab7c105643d8e5d07d89cd5ab176f0a40cd3d23e2b20b3986cbf76f575d64
    source_path: tools/elevated.md
    workflow: 16
    postprocess_version: locale-links-v1
---

เมื่อ agent ทำงานภายใน sandbox คำสั่ง `exec` ของมันจะถูกจำกัดให้อยู่ใน
สภาพแวดล้อม sandbox **โหมด elevated** ช่วยให้ agent ออกจากข้อจำกัดนั้นและเรียกใช้คำสั่ง
ภายนอก sandbox แทน พร้อมเกตการอนุมัติที่กำหนดค่าได้

<Info>
  โหมด elevated จะเปลี่ยนพฤติกรรมก็ต่อเมื่อ agent อยู่ใน **sandbox** เท่านั้น สำหรับ
  agent ที่ไม่ได้อยู่ใน sandbox นั้น exec ทำงานบน host อยู่แล้ว
</Info>

## คำสั่งกำกับ

ควบคุมโหมด elevated ต่อเซสชันด้วยคำสั่ง slash:

| คำสั่งกำกับ       | สิ่งที่ทำ                                                           |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | ทำงานภายนอก sandbox บนเส้นทาง host ที่กำหนดค่าไว้ โดยยังคงการอนุมัติไว้    |
| `/elevated ask`  | เหมือนกับ `on` (alias)                                                   |
| `/elevated full` | ทำงานภายนอก sandbox บนเส้นทาง host ที่กำหนดค่าไว้และข้ามการอนุมัติ |
| `/elevated off`  | กลับไปใช้การดำเนินการที่ถูกจำกัดอยู่ใน sandbox                                   |

ยังใช้งานได้ในรูปแบบ `/elev on|off|ask|full` ด้วย

ส่ง `/elevated` โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับปัจจุบัน

## วิธีการทำงาน

<Steps>
  <Step title="ตรวจสอบความพร้อมใช้งาน">
    ต้องเปิดใช้งาน Elevated ใน config และผู้ส่งต้องอยู่ใน allowlist:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="ตั้งค่าระดับ">
    ส่งข้อความที่มีเฉพาะคำสั่งกำกับเพื่อตั้งค่าเริ่มต้นของเซสชัน:

    ```
    /elevated full
    ```

    หรือใช้แบบ inline (มีผลกับข้อความนั้นเท่านั้น):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="คำสั่งทำงานภายนอก sandbox">
    เมื่อ elevated เปิดใช้งานอยู่ การเรียก `exec` จะออกจาก sandbox โดย host ที่มีผลจริงคือ
    `gateway` ตามค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec ที่กำหนดค่าไว้/ของเซสชันคือ
    `node` ในโหมด `full` การอนุมัติ exec จะถูกข้าม ในโหมด `on`/`ask`
    กฎการอนุมัติที่กำหนดค่าไว้ยังคงมีผล
  </Step>
</Steps>

## ลำดับการพิจารณา

1. **คำสั่งกำกับแบบ inline** ในข้อความ (มีผลกับข้อความนั้นเท่านั้น)
2. **การ override ของเซสชัน** (ตั้งค่าโดยส่งข้อความที่มีเฉพาะคำสั่งกำกับ)
3. **ค่าเริ่มต้นส่วนกลาง** (`agents.defaults.elevatedDefault` ใน config)

## ความพร้อมใช้งานและ allowlist

- **เกตส่วนกลาง**: `tools.elevated.enabled` (ต้องเป็น `true`)
- **allowlist ของผู้ส่ง**: `tools.elevated.allowFrom` พร้อมรายการแยกตามช่องทาง
- **เกตต่อ agent**: `agents.list[].tools.elevated.enabled` (ทำได้เพียงจำกัดเพิ่มเติม)
- **allowlist ต่อ agent**: `agents.list[].tools.elevated.allowFrom` (ผู้ส่งต้องตรงกับทั้งส่วนกลาง + ต่อ agent)
- **fallback ของ Discord**: หากละ `tools.elevated.allowFrom.discord` ไว้ จะใช้ `channels.discord.allowFrom` เป็น fallback
- **ทุกเกตต้องผ่าน** มิฉะนั้น elevated จะถือว่าไม่พร้อมใช้งาน

รูปแบบรายการ allowlist:

| คำนำหน้า                 | ตรงกับ                         |
| ----------------------- | ------------------------------- |
| (ไม่มี)                  | ID ผู้ส่ง, E.164 หรือฟิลด์ From |
| `name:`                 | ชื่อที่แสดงของผู้ส่ง             |
| `username:`             | username ของผู้ส่ง                 |
| `tag:`                  | tag ของผู้ส่ง                      |
| `id:`, `from:`, `e164:` | การระบุตัวตนเป้าหมายอย่างชัดเจน     |

## สิ่งที่ elevated ไม่ได้ควบคุม

- **นโยบายเครื่องมือ**: หาก `exec` ถูกปฏิเสธโดยนโยบายเครื่องมือ elevated จะ override ไม่ได้
- **นโยบายการเลือก host**: elevated ไม่ได้เปลี่ยน `auto` ให้เป็นการ override ข้าม host ได้อย่างอิสระ แต่จะใช้กฎเป้าหมาย exec ที่กำหนดค่าไว้/ของเซสชัน โดยเลือก `node` เฉพาะเมื่อเป้าหมายเป็น `node` อยู่แล้ว
- **แยกจาก `/exec`**: คำสั่งกำกับ `/exec` ปรับค่าเริ่มต้น exec ต่อเซสชันสำหรับผู้ส่งที่ได้รับอนุญาต และไม่จำเป็นต้องใช้โหมด elevated

<Note>
  คำสั่งแชต bash (คำนำหน้า `!`; alias `/bash`) เป็นเกตแยกต่างหากที่ต้องเปิดใช้งาน `tools.elevated` นอกเหนือจากแฟล็ก `tools.bash.enabled` ของตัวเอง การปิดใช้งาน elevated จะล็อกคำสั่ง shell แบบ `!` ออกไปด้วย
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เครื่องมือ Exec" href="/th/tools/exec" icon="terminal">
    การเรียกใช้คำสั่ง shell จาก agent
  </Card>
  <Card title="การอนุมัติ Exec" href="/th/tools/exec-approvals" icon="shield">
    ระบบการอนุมัติและ allowlist สำหรับ `exec`
  </Card>
  <Card title="Sandboxing" href="/th/gateway/sandboxing" icon="box">
    การกำหนดค่า sandbox ระดับ Gateway
  </Card>
  <Card title="Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated" href="/th/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    วิธีที่เกตทั้งสามประกอบกันระหว่างการเรียกเครื่องมือ
  </Card>
</CardGroup>
