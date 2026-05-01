---
read_when:
    - คุณต้องการเพิ่ม/ลบบัญชีช่องทาง (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - คุณต้องการตรวจสอบสถานะช่องทางหรือติดตามบันทึกของช่องทางแบบต่อเนื่อง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw channels` (บัญชี, สถานะ, การเข้าสู่ระบบ/การออกจากระบบ, บันทึก)
title: ช่องทาง
x-i18n:
    generated_at: "2026-05-01T10:13:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f673a626b46cd4c8ba7eb28963d27e7e3f630dd86723332faab9b4c86553da9
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

## สถานะ / ความสามารถ / การแก้ชื่อ / บันทึก

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (ใช้ได้เฉพาะกับ `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` คือเส้นทางแบบสด: บน Gateway ที่เข้าถึงได้ จะเรียกใช้การตรวจสอบ
`probeAccount` ต่อบัญชีและ `auditAccount` แบบเลือกได้ ดังนั้นผลลัพธ์อาจรวมสถานะ
การขนส่งพร้อมผลการตรวจสอบ เช่น `works`, `probe failed`, `audit ok` หรือ `audit failed`
ถ้า Gateway เข้าถึงไม่ได้ `channels status` จะถอยกลับไปใช้สรุปจากการกำหนดค่าเท่านั้น
แทนผลลัพธ์การตรวจสอบแบบสด

## เพิ่ม / ลบบัญชี

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` แสดงแฟล็กรายช่องทาง (token, private key, app token, เส้นทาง signal-cli และอื่นๆ)
</Tip>

`channels remove` ทำงานกับ Plugin ช่องทางที่ติดตั้ง/กำหนดค่าไว้แล้วเท่านั้น ใช้ `channels add` ก่อนสำหรับช่องทางในแค็ตตาล็อกที่ติดตั้งได้

พื้นผิวการเพิ่มแบบไม่โต้ตอบที่พบบ่อย ได้แก่:

- ช่องทาง bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- ฟิลด์การขนส่ง Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- ฟิลด์ Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- ฟิลด์ Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- ฟิลด์ Nostr: `--private-key`, `--relay-urls`
- ฟิลด์ Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` สำหรับการยืนยันตัวตนของบัญชีเริ่มต้นที่อิง env เมื่อรองรับ

ถ้า Plugin ช่องทางต้องติดตั้งระหว่างคำสั่งเพิ่มที่ขับเคลื่อนด้วยแฟล็ก OpenClaw จะใช้แหล่งติดตั้งเริ่มต้นของช่องทางนั้นโดยไม่เปิดพรอมป์ติดตั้ง Plugin แบบโต้ตอบ

เมื่อคุณเรียกใช้ `openclaw channels add` โดยไม่มีแฟล็ก วิซาร์ดแบบโต้ตอบอาจถาม:

- ID บัญชีต่อช่องทางที่เลือก
- ชื่อแสดงผลแบบเลือกได้สำหรับบัญชีเหล่านั้น
- `Bind configured channel accounts to agents now?`

ถ้าคุณยืนยันว่าจะผูกตอนนี้ วิซาร์ดจะถามว่า agent ใดควรเป็นเจ้าของบัญชีช่องทางที่กำหนดค่าแต่ละบัญชี และเขียนการผูกเส้นทางแบบจำกัดขอบเขตบัญชี

คุณยังสามารถจัดการกฎการกำหนดเส้นทางเดียวกันในภายหลังด้วย `openclaw agents bindings`, `openclaw agents bind` และ `openclaw agents unbind` (ดู [agents](/th/cli/agents))

เมื่อคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นลงในช่องทางที่ยังใช้การตั้งค่าระดับบนแบบบัญชีเดียว OpenClaw จะยกระดับค่าระดับบนที่จำกัดขอบเขตบัญชีเข้าไปในแผนที่บัญชีของช่องทางก่อนเขียนบัญชีใหม่ ช่องทางส่วนใหญ่จะวางค่าเหล่านั้นไว้ใน `channels.<channel>.accounts.default` แต่ช่องทางที่มาพร้อมชุดติดตั้งสามารถคงบัญชีที่ยกระดับแล้วซึ่งตรงกันอยู่เดิมไว้แทนได้ Matrix คือตัวอย่างปัจจุบัน: ถ้ามีบัญชีชื่อเดียวอยู่แล้วหนึ่งบัญชี หรือ `defaultAccount` ชี้ไปยังบัญชีชื่อที่มีอยู่ การยกระดับจะคงบัญชีนั้นไว้แทนการสร้าง `accounts.default` ใหม่

พฤติกรรมการกำหนดเส้นทางยังคงสอดคล้อง:

- การผูกแบบช่องทางเท่านั้นที่มีอยู่เดิม (ไม่มี `accountId`) จะยังคงตรงกับบัญชีเริ่มต้น
- `channels add` จะไม่สร้างอัตโนมัติหรือเขียนการผูกใหม่ในโหมดไม่โต้ตอบ
- การตั้งค่าแบบโต้ตอบสามารถเพิ่มการผูกแบบจำกัดขอบเขตบัญชีได้ตามต้องการ

ถ้าการกำหนดค่าของคุณอยู่ในสถานะแบบผสมอยู่แล้ว (มีบัญชีที่ตั้งชื่อไว้ และยังมีค่าบัญชีเดียวระดับบนตั้งอยู่) ให้เรียกใช้ `openclaw doctor --fix` เพื่อย้ายค่าที่จำกัดขอบเขตบัญชีไปยังบัญชีที่ยกระดับซึ่งเลือกไว้สำหรับช่องทางนั้น ช่องทางส่วนใหญ่จะยกระดับเข้าไปใน `accounts.default`; Matrix สามารถคงเป้าหมายที่ตั้งชื่อ/ค่าเริ่มต้นที่มีอยู่ไว้แทนได้

## เข้าสู่ระบบและออกจากระบบ (แบบโต้ตอบ)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` รองรับ `--verbose`
- `channels login` และ `logout` สามารถอนุมานช่องทางได้เมื่อมีเป้าหมายการเข้าสู่ระบบที่รองรับกำหนดค่าไว้เพียงรายการเดียว
- เรียกใช้ `channels login` จากเทอร์มินัลบนโฮสต์ Gateway `exec` ของ agent จะบล็อกโฟลว์เข้าสู่ระบบแบบโต้ตอบนี้ ควรใช้เครื่องมือเข้าสู่ระบบของ agent ที่เป็นของช่องทางโดยตรง เช่น `whatsapp_login` จากแชตเมื่อมีให้ใช้

## การแก้ไขปัญหา

- เรียกใช้ `openclaw status --deep` เพื่อการตรวจสอบแบบกว้าง
- ใช้ `openclaw doctor` สำหรับการแก้ไขแบบมีคำแนะนำ
- `openclaw channels list` พิมพ์ `Claude: HTTP 403 ... user:profile` → สแนปช็อตการใช้งานต้องมีขอบเขต `user:profile` ใช้ `--no-usage` หรือระบุคีย์เซสชัน claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) หรือยืนยันตัวตนใหม่ผ่าน Claude CLI
- `openclaw channels status` จะถอยกลับไปใช้สรุปจากการกำหนดค่าเท่านั้นเมื่อ Gateway เข้าถึงไม่ได้ ถ้าข้อมูลรับรองช่องทางที่รองรับถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้ในเส้นทางคำสั่งปัจจุบัน ระบบจะรายงานบัญชีนั้นว่ากำหนดค่าแล้วพร้อมหมายเหตุสถานะลดระดับ แทนที่จะแสดงว่ายังไม่ได้กำหนดค่า

## การตรวจสอบความสามารถ

ดึงคำใบ้ความสามารถของผู้ให้บริการ (intents/scopes เมื่อมี) พร้อมการรองรับฟีเจอร์แบบคงที่:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

หมายเหตุ:

- `--channel` เป็นตัวเลือก ไม่ระบุเพื่อแสดงทุกช่องทาง (รวมถึงส่วนขยาย)
- `--account` ใช้ได้เฉพาะกับ `--channel`
- `--target` รับ `channel:<id>` หรือ ID ช่องทางตัวเลขดิบ และใช้กับ Discord เท่านั้น
- การตรวจสอบเป็นแบบเฉพาะผู้ให้บริการ: Discord intents + สิทธิ์ช่องทางแบบเลือกได้; ขอบเขต bot + user ของ Slack; แฟล็ก bot + Webhook ของ Telegram; เวอร์ชัน daemon ของ Signal; app token + บทบาท/ขอบเขต Graph ของ Microsoft Teams (มีคำกำกับเมื่อทราบ) ช่องทางที่ไม่มีการตรวจสอบจะรายงาน `Probe: unavailable`

## แก้ชื่อเป็น ID

แก้ชื่อช่องทาง/ผู้ใช้เป็น ID โดยใช้ไดเรกทอรีของผู้ให้บริการ:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

หมายเหตุ:

- ใช้ `--kind user|group|auto` เพื่อบังคับชนิดเป้าหมาย
- การแก้ชื่อจะให้ความสำคัญกับรายการที่ active เมื่อหลายรายการใช้ชื่อเดียวกัน
- `channels resolve` เป็นแบบอ่านอย่างเดียว ถ้าบัญชีที่เลือกถูกกำหนดค่าผ่าน SecretRef แต่ข้อมูลรับรองนั้นไม่พร้อมใช้ในเส้นทางคำสั่งปัจจุบัน คำสั่งจะส่งคืนผลลัพธ์ที่แก้ไม่ได้แบบสถานะลดระดับพร้อมหมายเหตุ แทนการยกเลิกทั้งการทำงาน
- `channels resolve` จะไม่ติดตั้ง Plugin ช่องทาง ใช้ `channels add --channel <name>` ก่อนแก้ชื่อสำหรับช่องทางในแค็ตตาล็อกที่ติดตั้งได้

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [ภาพรวมช่องทาง](/th/channels)
