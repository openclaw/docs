---
read_when:
    - คุณต้องการเพิ่ม/ลบบัญชีช่องทาง (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - คุณต้องการตรวจสอบสถานะช่องทางหรือติดตามบันทึกของช่องทางแบบเรียลไทม์
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw channels` (บัญชี, สถานะ, การเข้าสู่ระบบ/ออกจากระบบ, บันทึก)
title: ช่องทาง
x-i18n:
    generated_at: "2026-05-07T13:13:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: a78d7a5306c822314052151e0a9aa8bed347481f59d9a19f92240dfa562e4b23
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
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` แสดงเฉพาะช่องทางแชต: โดยค่าเริ่มต้นจะแสดงบัญชีที่กำหนดค่าไว้ พร้อมแท็กสถานะ `installed`, `configured` และ `enabled` ต่อบัญชี ส่ง `--all` เพื่อแสดงช่องทางที่มาพร้อมชุดติดตั้งซึ่งยังไม่มีบัญชีที่กำหนดค่า และช่องทางในแค็ตตาล็อกที่ติดตั้งได้ซึ่งยังไม่ได้อยู่บนดิสก์ด้วย ผู้ให้บริการยืนยันตัวตน (OAuth + คีย์ API) และสแนปช็อตการใช้งาน/โควตาของผู้ให้บริการโมเดลจะไม่ถูกพิมพ์ที่นี่อีกต่อไป; ใช้ `openclaw models auth list` สำหรับโปรไฟล์การยืนยันตัวตนของผู้ให้บริการ และ `openclaw status` หรือ `openclaw models list` สำหรับการใช้งาน

## สถานะ / ความสามารถ / แก้ชื่อ / บันทึก

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (ใช้ได้เฉพาะกับ `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` คือเส้นทางแบบสด: บน Gateway ที่เข้าถึงได้ คำสั่งนี้จะรันการตรวจสอบ
`probeAccount` ต่อบัญชี และการตรวจสอบ `auditAccount` แบบเลือกได้ ดังนั้นผลลัพธ์อาจรวมสถานะ
การขนส่งพร้อมผลการโพรบ เช่น `works`, `probe failed`, `audit ok` หรือ `audit failed`
หากเข้าถึง Gateway ไม่ได้ `channels status` จะถอยกลับไปใช้สรุปจากการกำหนดค่าเท่านั้น
แทนผลลัพธ์การโพรบแบบสด

อย่าใช้ `openclaw sessions`, Gateway `sessions.list` หรือเครื่องมือ
`sessions_list` ของเอเจนต์เป็นสัญญาณสุขภาพของซ็อกเก็ตช่องทาง พื้นผิวเหล่านั้นรายงาน
แถวบทสนทนาที่จัดเก็บไว้ ไม่ใช่สถานะรันไทม์ของผู้ให้บริการ หลังจากรีสตาร์ตผู้ให้บริการ Discord
บัญชีที่เชื่อมต่ออยู่แต่เงียบอาจยังสุขภาพดี แม้จะไม่มีแถวเซสชัน Discord
ปรากฏจนกว่าจะมีเหตุการณ์บทสนทนาขาเข้าหรือขาออกครั้งถัดไป

## เพิ่ม / ลบบัญชี

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` แสดงแฟล็กต่อช่องทาง (โทเค็น, คีย์ส่วนตัว, โทเค็นแอป, พาธ signal-cli และอื่น ๆ)
</Tip>

`channels remove` ทำงานกับ Plugin ช่องทางที่ติดตั้ง/กำหนดค่าแล้วเท่านั้น ใช้ `channels add` ก่อนสำหรับช่องทางในแค็ตตาล็อกที่ติดตั้งได้
สำหรับ Plugin ช่องทางที่มีรันไทม์รองรับ `channels remove` จะขอให้ Gateway ที่กำลังทำงานหยุดบัญชีที่เลือกก่อนอัปเดตการกำหนดค่าด้วย ดังนั้นการปิดใช้งานหรือการลบบัญชีจะไม่ปล่อยให้ตัวรับฟังเก่ายังคงทำงานอยู่จนกว่าจะรีสตาร์ต

พื้นผิวการเพิ่มแบบไม่โต้ตอบที่พบบ่อย ได้แก่:

- ช่องทาง bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- ฟิลด์การขนส่ง Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- ฟิลด์ Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- ฟิลด์ Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- ฟิลด์ Nostr: `--private-key`, `--relay-urls`
- ฟิลด์ Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` สำหรับการยืนยันตัวตนของบัญชีเริ่มต้นที่อิง env เมื่อรองรับ

หากต้องติดตั้ง Plugin ช่องทางระหว่างคำสั่งเพิ่มที่ขับด้วยแฟล็ก OpenClaw จะใช้แหล่งติดตั้งเริ่มต้นของช่องทางนั้นโดยไม่เปิดพรอมป์ติดตั้ง Plugin แบบโต้ตอบ

เมื่อคุณรัน `openclaw channels add` โดยไม่มีแฟล็ก วิซาร์ดแบบโต้ตอบสามารถถาม:

- รหัสบัญชีต่อช่องทางที่เลือก
- ชื่อที่แสดงแบบเลือกได้สำหรับบัญชีเหล่านั้น
- `Bind configured channel accounts to agents now?`

หากคุณยืนยันให้ผูกตอนนี้ วิซาร์ดจะถามว่าเอเจนต์ใดควรเป็นเจ้าของบัญชีช่องทางที่กำหนดค่าแต่ละบัญชี และเขียนการผูกเส้นทางในขอบเขตบัญชี

คุณยังสามารถจัดการกฎการกำหนดเส้นทางเดียวกันภายหลังได้ด้วย `openclaw agents bindings`, `openclaw agents bind` และ `openclaw agents unbind` (ดู [เอเจนต์](/th/cli/agents))

เมื่อคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นลงในช่องทางที่ยังใช้การตั้งค่าระดับบนสุดแบบบัญชีเดียว OpenClaw จะเลื่อนค่าระดับบนสุดในขอบเขตบัญชีเข้าไปในแผนที่บัญชีของช่องทางก่อนเขียนบัญชีใหม่ ช่องทางส่วนใหญ่จะวางค่าเหล่านั้นไว้ใน `channels.<channel>.accounts.default` แต่ช่องทางที่มาพร้อมชุดติดตั้งสามารถคงบัญชีที่เลื่อนขึ้นมาซึ่งตรงกันอยู่แล้วไว้แทนได้ Matrix คือตัวอย่างปัจจุบัน: หากมีบัญชีที่ตั้งชื่อไว้แล้วหนึ่งบัญชี หรือ `defaultAccount` ชี้ไปยังบัญชีที่ตั้งชื่อไว้ซึ่งมีอยู่ การเลื่อนระดับจะคงบัญชีนั้นไว้แทนการสร้าง `accounts.default` ใหม่

พฤติกรรมการกำหนดเส้นทางยังคงสอดคล้อง:

- การผูกระดับช่องทางเดิม (ไม่มี `accountId`) ยังคงจับคู่กับบัญชีเริ่มต้น
- `channels add` จะไม่สร้างหรือเขียนการผูกใหม่โดยอัตโนมัติในโหมดไม่โต้ตอบ
- การตั้งค่าแบบโต้ตอบสามารถเพิ่มการผูกในขอบเขตบัญชีได้ตามต้องการ

หากการกำหนดค่าของคุณอยู่ในสถานะผสมอยู่แล้ว (มีบัญชีที่ตั้งชื่อไว้และยังตั้งค่าบัญชีเดียวระดับบนสุดอยู่) ให้รัน `openclaw doctor --fix` เพื่อย้ายค่าในขอบเขตบัญชีเข้าไปในบัญชีที่เลื่อนระดับซึ่งเลือกไว้สำหรับช่องทางนั้น ช่องทางส่วนใหญ่จะเลื่อนเข้าไปใน `accounts.default`; Matrix สามารถคงเป้าหมายที่ตั้งชื่อไว้/ค่าเริ่มต้นที่มีอยู่แทนได้

## เข้าสู่ระบบและออกจากระบบ (แบบโต้ตอบ)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` รองรับ `--verbose`
- `channels login` และ `logout` สามารถอนุมานช่องทางได้เมื่อมีเป้าหมายเข้าสู่ระบบที่รองรับซึ่งกำหนดค่าไว้เพียงรายการเดียว
- `channels logout` จะเลือกเส้นทาง Gateway แบบสดก่อนเมื่อเข้าถึงได้ ดังนั้นการออกจากระบบจะหยุดตัวรับฟังที่ทำงานอยู่ก่อนล้างสถานะการยืนยันตัวตนของช่องทาง หากเข้าถึง Gateway ภายในเครื่องไม่ได้ จะถอยกลับไปล้างการยืนยันตัวตนภายในเครื่อง
- รัน `channels login` จากเทอร์มินัลบนโฮสต์ Gateway เอเจนต์ `exec` จะบล็อกโฟลว์เข้าสู่ระบบแบบโต้ตอบนี้; ควรใช้เครื่องมือเข้าสู่ระบบแบบเนทีฟของช่องทางจากแชตเมื่อมีให้ใช้งาน เช่น `whatsapp_login`

## การแก้ไขปัญหา

- รัน `openclaw status --deep` สำหรับการโพรบแบบกว้าง
- ใช้ `openclaw doctor` สำหรับการแก้ไขแบบมีคำแนะนำ
- `openclaw channels list` จะไม่พิมพ์สแนปช็อตการใช้งาน/โควตาของผู้ให้บริการโมเดลอีกต่อไป สำหรับข้อมูลเหล่านั้น ให้ใช้ `openclaw status` (ภาพรวม) หรือ `openclaw models list` (ต่อผู้ให้บริการ)
- `openclaw channels status` จะถอยกลับไปใช้สรุปจากการกำหนดค่าเท่านั้นเมื่อเข้าถึง Gateway ไม่ได้ หากข้อมูลรับรองของช่องทางที่รองรับถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน คำสั่งจะรายงานบัญชีนั้นว่ากำหนดค่าแล้วพร้อมบันทึกว่าประสิทธิภาพลดลง แทนการแสดงว่าไม่ได้กำหนดค่า

## โพรบความสามารถ

ดึงคำใบ้ความสามารถของผู้ให้บริการ (intents/scopes เมื่อมีให้ใช้งาน) พร้อมการรองรับฟีเจอร์แบบคงที่:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

หมายเหตุ:

- `--channel` เป็นตัวเลือก; ละไว้เพื่อแสดงทุกช่องทาง (รวมถึง extensions)
- `--account` ใช้ได้เฉพาะกับ `--channel`
- `--target` รับ `channel:<id>` หรือรหัสช่องทางตัวเลขดิบ และใช้กับ Discord เท่านั้น สำหรับช่องเสียง Discord การตรวจสอบสิทธิ์จะระบุแฟล็กที่ขาด `ViewChannel`, `Connect`, `Speak`, `SendMessages` และ `ReadMessageHistory`
- การโพรบเฉพาะตามผู้ให้บริการ: intents ของ Discord + สิทธิ์ช่องทางแบบเลือกได้; scopes ของบอต Slack + ผู้ใช้; แฟล็กบอต Telegram + Webhook; เวอร์ชันดีมอน Signal; โทเค็นแอป Microsoft Teams + บทบาท/scopes ของ Graph (มีคำอธิบายกำกับเมื่อทราบ) ช่องทางที่ไม่มีการโพรบจะรายงาน `Probe: unavailable`

## แก้ชื่อเป็นรหัส

แก้ชื่อช่องทาง/ผู้ใช้เป็นรหัสโดยใช้ไดเรกทอรีของผู้ให้บริการ:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

หมายเหตุ:

- ใช้ `--kind user|group|auto` เพื่อบังคับชนิดเป้าหมาย
- การแก้ชื่อจะเลือกค่าที่ตรงกันและทำงานอยู่ก่อนเมื่อมีหลายรายการใช้ชื่อเดียวกัน
- `channels resolve` เป็นแบบอ่านอย่างเดียว หากบัญชีที่เลือกถูกกำหนดค่าผ่าน SecretRef แต่ข้อมูลรับรองนั้นไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน คำสั่งจะคืนผลลัพธ์ที่แก้ไม่ได้แบบประสิทธิภาพลดลงพร้อมบันทึก แทนการยกเลิกการรันทั้งหมด
- `channels resolve` ไม่ติดตั้ง Plugin ช่องทาง ใช้ `channels add --channel <name>` ก่อนแก้ชื่อสำหรับช่องทางในแค็ตตาล็อกที่ติดตั้งได้

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [ภาพรวมช่องทาง](/th/channels)
