---
read_when:
    - คุณต้องการเพิ่ม/ลบบัญชีช่องทาง (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - คุณต้องการตรวจสอบสถานะช่องทางหรือดูบันทึกช่องทางแบบต่อเนื่อง
summary: คู่มืออ้างอิง CLI สำหรับ `openclaw channels` (บัญชี, สถานะ, เข้าสู่ระบบ/ออกจากระบบ, บันทึก)
title: ช่องทาง
x-i18n:
    generated_at: "2026-04-30T09:41:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc3c5983114c17e0e7284450aa161b658312c05864db65e09d6d764e357cd1f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

จัดการบัญชีช่องทางแชตและสถานะรันไทม์บน Gateway

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
`probeAccount` รายบัญชี และการตรวจสอบ `auditAccount` เพิ่มเติมถ้ามี ดังนั้นเอาต์พุตอาจมีสถานะ
การขนส่งพร้อมผลการตรวจ เช่น `works`, `probe failed`, `audit ok` หรือ `audit failed`
ถ้าเข้าถึง Gateway ไม่ได้ `channels status` จะถอยกลับไปใช้สรุปจากการกำหนดค่าเท่านั้น
แทนเอาต์พุตการตรวจแบบสด

## เพิ่ม / ลบบัญชี

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` แสดงแฟล็กรายช่องทาง (โทเค็น, คีย์ส่วนตัว, โทเค็นแอป, พาธ signal-cli และอื่นๆ)
</Tip>

พื้นผิวการเพิ่มแบบไม่โต้ตอบที่ใช้ทั่วไป ได้แก่:

- ช่องทาง bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- ฟิลด์การขนส่ง Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- ฟิลด์ Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- ฟิลด์ Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- ฟิลด์ Nostr: `--private-key`, `--relay-urls`
- ฟิลด์ Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` สำหรับการยืนยันตัวตนของบัญชีเริ่มต้นที่รองรับโดย env เมื่อรองรับ

ถ้าจำเป็นต้องติดตั้ง Plugin ช่องทางระหว่างคำสั่งเพิ่มที่ขับเคลื่อนด้วยแฟล็ก OpenClaw จะใช้แหล่งติดตั้งเริ่มต้นของช่องทางโดยไม่เปิดพรอมป์ติดตั้ง Plugin แบบโต้ตอบ

เมื่อคุณรัน `openclaw channels add` โดยไม่มีแฟล็ก วิซาร์ดแบบโต้ตอบอาจถาม:

- id บัญชีต่อช่องทางที่เลือก
- ชื่อที่แสดงแบบไม่บังคับสำหรับบัญชีเหล่านั้น
- `Bind configured channel accounts to agents now?`

ถ้าคุณยืนยันให้ผูกตอนนี้ วิซาร์ดจะถามว่า agent ใดควรเป็นเจ้าของบัญชีช่องทางแต่ละบัญชีที่กำหนดค่าไว้ และจะเขียนการผูกการกำหนดเส้นทางแบบจำกัดขอบเขตตามบัญชี

คุณยังสามารถจัดการกฎการกำหนดเส้นทางเดียวกันภายหลังด้วย `openclaw agents bindings`, `openclaw agents bind` และ `openclaw agents unbind` (ดู [agents](/th/cli/agents))

เมื่อคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นไปยังช่องทางที่ยังใช้การตั้งค่าระดับบนสุดแบบบัญชีเดียว OpenClaw จะเลื่อนค่าระดับบนสุดแบบจำกัดขอบเขตตามบัญชีเข้าไปในแมปบัญชีของช่องทางก่อนเขียนบัญชีใหม่ ช่องทางส่วนใหญ่จะวางค่าเหล่านั้นใน `channels.<channel>.accounts.default` แต่ช่องทางที่บันเดิลมาสามารถคงบัญชีที่เลื่อนขั้นและตรงกันที่มีอยู่แทนได้ Matrix คือตัวอย่างปัจจุบัน: ถ้ามีบัญชีที่ตั้งชื่อไว้แล้วหนึ่งบัญชี หรือ `defaultAccount` ชี้ไปยังบัญชีที่ตั้งชื่อไว้และมีอยู่ การเลื่อนขั้นจะคงบัญชีนั้นไว้แทนการสร้าง `accounts.default` ใหม่

พฤติกรรมการกำหนดเส้นทางยังคงสอดคล้อง:

- การผูกที่มีอยู่แบบระบุเฉพาะช่องทางเท่านั้น (ไม่มี `accountId`) ยังคงจับคู่กับบัญชีเริ่มต้น
- `channels add` จะไม่สร้างหรือเขียนการผูกใหม่โดยอัตโนมัติในโหมดไม่โต้ตอบ
- การตั้งค่าแบบโต้ตอบสามารถเพิ่มการผูกแบบจำกัดขอบเขตตามบัญชีได้ถ้าเลือก

ถ้าการกำหนดค่าของคุณอยู่ในสถานะผสมอยู่แล้ว (มีบัญชีที่ตั้งชื่อไว้ และยังตั้งค่าระดับบนสุดแบบบัญชีเดียวอยู่) ให้รัน `openclaw doctor --fix` เพื่อย้ายค่าแบบจำกัดขอบเขตตามบัญชีเข้าไปยังบัญชีที่เลื่อนขั้นซึ่งเลือกไว้สำหรับช่องทางนั้น ช่องทางส่วนใหญ่จะเลื่อนขั้นเข้าไปใน `accounts.default`; Matrix สามารถคงเป้าหมายที่ตั้งชื่อไว้/ค่าเริ่มต้นที่มีอยู่แทนได้

## เข้าสู่ระบบและออกจากระบบ (แบบโต้ตอบ)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` รองรับ `--verbose`
- `channels login` และ `logout` สามารถอนุมานช่องทางได้เมื่อมีเป้าหมายการเข้าสู่ระบบที่รองรับที่กำหนดค่าไว้เพียงรายการเดียว
- รัน `channels login` จากเทอร์มินัลบนโฮสต์ Gateway Agent `exec` จะบล็อกโฟลว์เข้าสู่ระบบแบบโต้ตอบนี้; ควรใช้เครื่องมือเข้าสู่ระบบแบบเนทีฟของช่องทางสำหรับ agent เช่น `whatsapp_login` จากแชตเมื่อพร้อมใช้งาน

## การแก้ไขปัญหา

- รัน `openclaw status --deep` เพื่อการตรวจแบบกว้าง
- ใช้ `openclaw doctor` เพื่อแก้ไขตามคำแนะนำ
- `openclaw channels list` พิมพ์ `Claude: HTTP 403 ... user:profile` → สแนปช็อตการใช้งานต้องมีขอบเขต `user:profile` ใช้ `--no-usage` หรือระบุคีย์เซสชัน claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) หรือยืนยันตัวตนใหม่ผ่าน Claude CLI
- `openclaw channels status` ถอยกลับไปใช้สรุปจากการกำหนดค่าเท่านั้นเมื่อเข้าถึง Gateway ไม่ได้ ถ้าข้อมูลประจำตัวของช่องทางที่รองรับถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้งานในพาธคำสั่งปัจจุบัน ระบบจะรายงานบัญชีนั้นว่ากำหนดค่าแล้วพร้อมหมายเหตุแบบลดระดับ แทนการแสดงว่ายังไม่ได้กำหนดค่า

## การตรวจความสามารถ

ดึงคำใบ้ความสามารถของผู้ให้บริการ (intents/scopes เมื่อพร้อมใช้งาน) พร้อมการรองรับฟีเจอร์แบบคงที่:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

หมายเหตุ:

- `--channel` เป็นตัวเลือก; ละไว้เพื่อแสดงทุกช่องทาง (รวมถึงส่วนขยาย)
- `--account` ใช้ได้เฉพาะกับ `--channel`
- `--target` รับ `channel:<id>` หรือ id ช่องทางแบบตัวเลขดิบ และใช้กับ Discord เท่านั้น
- การตรวจเป็นแบบเฉพาะผู้ให้บริการ: Discord intents + สิทธิ์ช่องทางเพิ่มเติมถ้ามี; ขอบเขตบอท + ผู้ใช้ของ Slack; แฟล็กบอท + Webhook ของ Telegram; เวอร์ชันดีมอน Signal; โทเค็นแอป Microsoft Teams + บทบาท/ขอบเขต Graph (มีคำอธิบายกำกับเมื่อทราบ) ช่องทางที่ไม่มีการตรวจจะรายงาน `Probe: unavailable`

## แปลงชื่อเป็น ID

แปลงชื่อช่องทาง/ผู้ใช้เป็น ID โดยใช้ไดเรกทอรีผู้ให้บริการ:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

หมายเหตุ:

- ใช้ `--kind user|group|auto` เพื่อบังคับประเภทเป้าหมาย
- การแปลงจะให้ความสำคัญกับรายการที่ใช้งานอยู่เมื่อมีหลายรายการใช้ชื่อเดียวกัน
- `channels resolve` เป็นแบบอ่านอย่างเดียว ถ้าบัญชีที่เลือกถูกกำหนดค่าผ่าน SecretRef แต่ข้อมูลประจำตัวนั้นไม่พร้อมใช้งานในพาธคำสั่งปัจจุบัน คำสั่งจะคืนผลลัพธ์ที่ยังแปลงไม่ได้แบบลดระดับพร้อมหมายเหตุ แทนการยกเลิกการรันทั้งหมด

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [ภาพรวมช่องทาง](/th/channels)
