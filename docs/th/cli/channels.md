---
read_when:
    - คุณต้องการเพิ่ม/ลบบัญชีช่องทาง (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - คุณต้องการตรวจสอบสถานะของช่องทางหรือติดตามบันทึกของช่องทางแบบเรียลไทม์
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw channels` (บัญชี, สถานะ, เข้าสู่ระบบ/ออกจากระบบ, บันทึก)
title: ช่องทาง
x-i18n:
    generated_at: "2026-05-02T10:09:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3aff374e81e0845805b9baf09d6b63dfe8270cb48606f74f3f1f2dcd56b552c4
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

จัดการบัญชีช่องทางแชตและสถานะรันไทม์ของบัญชีเหล่านั้นบน Gateway

เอกสารที่เกี่ยวข้อง:

- คู่มือช่องทาง: [ช่องทาง](/th/channels)
- การกำหนดค่า Gateway: [การกำหนดค่า](/th/gateway/configuration)

## คำสั่งทั่วไป

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## สถานะ / ความสามารถ / แปลงชื่อ / บันทึก

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (ใช้ได้เฉพาะกับ `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` คือเส้นทางแบบสด: บน Gateway ที่เข้าถึงได้ คำสั่งนี้จะรันการตรวจสอบ
`probeAccount` และ `auditAccount` ที่เลือกใช้ได้ต่อบัญชี ดังนั้นเอาต์พุตอาจรวมสถานะการขนส่ง
พร้อมผลการตรวจสอบ เช่น `works`, `probe failed`, `audit ok` หรือ `audit failed`
หากเข้าถึง Gateway ไม่ได้ `channels status` จะถอยกลับไปใช้สรุปจากการกำหนดค่าเท่านั้น
แทนเอาต์พุตการตรวจสอบแบบสด

อย่าใช้ `openclaw sessions`, Gateway `sessions.list` หรือเครื่องมือ
`sessions_list` ของเอเจนต์เป็นสัญญาณสุขภาพของซ็อกเก็ตช่องทาง พื้นผิวเหล่านั้นรายงาน
แถวบทสนทนาที่จัดเก็บไว้ ไม่ใช่สถานะรันไทม์ของผู้ให้บริการ หลังจากรีสตาร์ตผู้ให้บริการ Discord
บัญชีที่เชื่อมต่ออยู่แต่ไม่มีความเคลื่อนไหวอาจยังสมบูรณ์ดี ขณะที่ไม่มีแถวเซสชัน Discord
ปรากฏจนกว่าจะมีเหตุการณ์บทสนทนาขาเข้าหรือขาออกครั้งถัดไป

## เพิ่ม / ลบบัญชี

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` แสดงแฟล็กเฉพาะช่องทาง (โทเคน, คีย์ส่วนตัว, โทเคนแอป, พาธ signal-cli และอื่นๆ)
</Tip>

`channels remove` ทำงานกับ Plugin ช่องทางที่ติดตั้ง/กำหนดค่าไว้แล้วเท่านั้น ใช้ `channels add` ก่อนสำหรับช่องทางจากแค็ตตาล็อกที่ติดตั้งได้
สำหรับ Plugin ช่องทางที่มีรันไทม์รองรับ `channels remove` จะขอให้ Gateway ที่กำลังทำงานหยุดบัญชีที่เลือกก่อนอัปเดตการกำหนดค่าด้วย ดังนั้นการปิดใช้งานหรือลบบัญชีจะไม่ปล่อยให้ตัวรับฟังเดิมยังทำงานอยู่จนกว่าจะรีสตาร์ต

พื้นผิวการเพิ่มแบบไม่โต้ตอบที่พบบ่อยประกอบด้วย:

- ช่องทาง bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- ฟิลด์การขนส่ง Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- ฟิลด์ Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- ฟิลด์ Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- ฟิลด์ Nostr: `--private-key`, `--relay-urls`
- ฟิลด์ Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` สำหรับการยืนยันตัวตนของบัญชีเริ่มต้นที่อิง env เมื่อรองรับ

หากจำเป็นต้องติดตั้ง Plugin ช่องทางระหว่างคำสั่งเพิ่มที่ขับเคลื่อนด้วยแฟล็ก OpenClaw จะใช้แหล่งติดตั้งเริ่มต้นของช่องทางนั้นโดยไม่เปิดพรอมป์ติดตั้ง Plugin แบบโต้ตอบ

เมื่อคุณรัน `openclaw channels add` โดยไม่มีแฟล็ก ตัวช่วยแบบโต้ตอบอาจถาม:

- id บัญชีต่อช่องทางที่เลือก
- ชื่อแสดงผลที่เลือกใช้ได้สำหรับบัญชีเหล่านั้น
- `Bind configured channel accounts to agents now?`

หากคุณยืนยันว่าจะผูกตอนนี้ ตัวช่วยจะถามว่าเอเจนต์ใดควรเป็นเจ้าของบัญชีช่องทางที่กำหนดค่าไว้แต่ละบัญชี และเขียนการผูกการกำหนดเส้นทางแบบจำกัดขอบเขตตามบัญชี

คุณยังสามารถจัดการกฎการกำหนดเส้นทางเดียวกันในภายหลังได้ด้วย `openclaw agents bindings`, `openclaw agents bind` และ `openclaw agents unbind` (ดู [เอเจนต์](/th/cli/agents))

เมื่อคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นลงในช่องทางที่ยังใช้การตั้งค่าระดับบนสุดแบบบัญชีเดียว OpenClaw จะยกระดับค่าระดับบนสุดแบบจำกัดขอบเขตตามบัญชีเข้าไปในแผนที่บัญชีของช่องทาง ก่อนเขียนบัญชีใหม่ ช่องทางส่วนใหญ่จะนำค่าเหล่านั้นไปไว้ใน `channels.<channel>.accounts.default` แต่ช่องทางที่บันเดิลมาสามารถคงบัญชีที่ยกระดับแล้วซึ่งตรงกันและมีอยู่เดิมไว้แทนได้ Matrix คือตัวอย่างปัจจุบัน: หากมีบัญชีที่ตั้งชื่อไว้หนึ่งบัญชีอยู่แล้ว หรือ `defaultAccount` ชี้ไปยังบัญชีที่ตั้งชื่อไว้และมีอยู่เดิม การยกระดับจะคงบัญชีนั้นไว้แทนการสร้าง `accounts.default` ใหม่

พฤติกรรมการกำหนดเส้นทางยังคงสอดคล้องกัน:

- การผูกแบบช่องทางเท่านั้นที่มีอยู่เดิม (ไม่มี `accountId`) ยังคงจับคู่กับบัญชีเริ่มต้น
- `channels add` จะไม่สร้างหรือเขียนการผูกใหม่โดยอัตโนมัติในโหมดไม่โต้ตอบ
- การตั้งค่าแบบโต้ตอบสามารถเลือกเพิ่มการผูกแบบจำกัดขอบเขตตามบัญชีได้

หากการกำหนดค่าของคุณอยู่ในสถานะผสมอยู่แล้ว (มีบัญชีที่ตั้งชื่อไว้และยังตั้งค่าระดับบนสุดแบบบัญชีเดียวอยู่) ให้รัน `openclaw doctor --fix` เพื่อย้ายค่าแบบจำกัดขอบเขตตามบัญชีเข้าไปในบัญชีที่ยกระดับซึ่งเลือกไว้สำหรับช่องทางนั้น ช่องทางส่วนใหญ่จะยกระดับเข้าไปใน `accounts.default`; Matrix สามารถคงเป้าหมายที่ตั้งชื่อไว้/ค่าเริ่มต้นซึ่งมีอยู่เดิมแทนได้

## เข้าสู่ระบบและออกจากระบบ (แบบโต้ตอบ)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` รองรับ `--verbose`
- `channels login` และ `logout` สามารถอนุมานช่องทางได้เมื่อมีเป้าหมายเข้าสู่ระบบที่รองรับซึ่งกำหนดค่าไว้เพียงรายการเดียว
- `channels logout` จะเลือกเส้นทาง Gateway แบบสดเมื่อเข้าถึงได้ ดังนั้นการออกจากระบบจะหยุดตัวรับฟังที่ทำงานอยู่ก่อนล้างสถานะการยืนยันตัวตนของช่องทาง หากเข้าถึง Gateway ในเครื่องไม่ได้ คำสั่งจะถอยกลับไปล้างการยืนยันตัวตนในเครื่อง
- รัน `channels login` จากเทอร์มินัลบนโฮสต์ Gateway เอเจนต์ `exec` จะบล็อกโฟลว์เข้าสู่ระบบแบบโต้ตอบนี้ ควรใช้เครื่องมือเข้าสู่ระบบเนทีฟของช่องทางจากแชตเมื่อมีให้ใช้ เช่น `whatsapp_login`

## การแก้ไขปัญหา

- รัน `openclaw status --deep` เพื่อทำการตรวจสอบแบบกว้าง
- ใช้ `openclaw doctor` สำหรับการแก้ไขแบบมีคำแนะนำ
- `openclaw channels list` พิมพ์ `Claude: HTTP 403 ... user:profile` → สแนปช็อตการใช้งานต้องมีขอบเขต `user:profile` ใช้ `--no-usage` หรือระบุคีย์เซสชัน claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) หรือยืนยันตัวตนใหม่ผ่าน Claude CLI
- `openclaw channels status` จะถอยกลับไปใช้สรุปจากการกำหนดค่าเท่านั้นเมื่อเข้าถึง Gateway ไม่ได้ หากข้อมูลรับรองของช่องทางที่รองรับถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้งานในพาธคำสั่งปัจจุบัน คำสั่งจะรายงานบัญชีนั้นว่ากำหนดค่าแล้วพร้อมหมายเหตุแบบลดระดับ แทนที่จะแสดงว่ายังไม่ได้กำหนดค่า

## การตรวจสอบความสามารถ

ดึงคำใบ้ความสามารถของผู้ให้บริการ (intents/scopes เมื่อมี) พร้อมการรองรับฟีเจอร์แบบคงที่:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

หมายเหตุ:

- `--channel` เป็นตัวเลือก ละไว้เพื่อแสดงทุกช่องทาง (รวมถึงส่วนขยาย)
- `--account` ใช้ได้เฉพาะกับ `--channel` เท่านั้น
- `--target` รับ `channel:<id>` หรือ id ช่องทางแบบตัวเลขดิบ และใช้กับ Discord เท่านั้น
- การตรวจสอบเป็นแบบเฉพาะผู้ให้บริการ: intents ของ Discord + สิทธิ์ช่องทางที่เลือกใช้ได้; ขอบเขตบอต + ผู้ใช้ของ Slack; แฟล็กบอต + Webhook ของ Telegram; เวอร์ชันดีมอนของ Signal; โทเคนแอป + บทบาท/ขอบเขต Graph ของ Microsoft Teams (ใส่คำอธิบายประกอบเมื่อทราบ) ช่องทางที่ไม่มีการตรวจสอบจะรายงาน `Probe: unavailable`

## แปลงชื่อเป็น ID

แปลงชื่อช่องทาง/ผู้ใช้เป็น ID โดยใช้ไดเรกทอรีของผู้ให้บริการ:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

หมายเหตุ:

- ใช้ `--kind user|group|auto` เพื่อบังคับชนิดเป้าหมาย
- การแปลงค่าจะเลือกผลลัพธ์ที่ใช้งานอยู่ก่อนเมื่อมีหลายรายการใช้ชื่อเดียวกัน
- `channels resolve` เป็นแบบอ่านอย่างเดียว หากบัญชีที่เลือกถูกกำหนดค่าผ่าน SecretRef แต่ข้อมูลรับรองนั้นไม่พร้อมใช้งานในพาธคำสั่งปัจจุบัน คำสั่งจะส่งคืนผลลัพธ์ที่แปลงค่าไม่ได้แบบลดระดับพร้อมหมายเหตุ แทนที่จะยุติการรันทั้งหมด
- `channels resolve` จะไม่ติดตั้ง Plugin ช่องทาง ใช้ `channels add --channel <name>` ก่อนแปลงชื่อสำหรับช่องทางจากแค็ตตาล็อกที่ติดตั้งได้

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [ภาพรวมช่องทาง](/th/channels)
