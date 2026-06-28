---
read_when:
    - คุณต้องการเพิ่ม/ลบบัญชีช่องทาง (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - คุณต้องการตรวจสอบสถานะช่องทางหรือดูบันทึกช่องทางแบบต่อเนื่อง
summary: คู่มืออ้างอิง CLI สำหรับ `openclaw channels` (บัญชี, สถานะ, เข้าสู่ระบบ/ออกจากระบบ, บันทึก)
title: ช่องทาง
x-i18n:
    generated_at: "2026-05-11T20:26:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a964b4db9526defab6ee47b7a99c11086e345d42c8d20f5262fc134337947f
    source_path: cli/channels.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw channels`

จัดการบัญชีช่องทางแชตและสถานะรันไทม์บน Gateway

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

`channels list` แสดงเฉพาะช่องทางแชต: ค่าเริ่มต้นคือบัญชีที่กำหนดค่าไว้ พร้อมแท็กสถานะ `installed`, `configured` และ `enabled` ต่อบัญชี ส่ง `--all` เพื่อแสดงช่องทางที่มาพร้อมชุดติดตั้งซึ่งยังไม่มีบัญชีที่กำหนดค่าไว้ และช่องทางในแค็ตตาล็อกที่ติดตั้งได้แต่ยังไม่อยู่บนดิสก์ด้วย ผู้ให้บริการการยืนยันตัวตน (OAuth + คีย์ API) และสแนปช็อตการใช้งาน/โควตาของผู้ให้บริการโมเดลจะไม่พิมพ์ที่นี่อีกต่อไป ใช้ `openclaw models auth list` สำหรับโปรไฟล์การยืนยันตัวตนของผู้ให้บริการ และ `openclaw status` หรือ `openclaw models list` สำหรับการใช้งาน

## สถานะ / ความสามารถ / แก้ไขชื่อ / บันทึก

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (ใช้ได้เฉพาะกับ `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` คือเส้นทางแบบไลฟ์: เมื่อเชื่อมต่อ Gateway ได้ คำสั่งจะรันการตรวจสอบ
`probeAccount` และ `auditAccount` แบบไม่บังคับแยกตามบัญชี ดังนั้นเอาต์พุตอาจรวมสถานะการรับส่ง
พร้อมผลการตรวจสอบ เช่น `works`, `probe failed`, `audit ok` หรือ `audit failed`
หากเข้าถึง Gateway ไม่ได้ `channels status` จะย้อนกลับไปใช้สรุปจากการกำหนดค่าเท่านั้น
แทนเอาต์พุตการตรวจสอบแบบไลฟ์

อย่าใช้ `openclaw sessions`, Gateway `sessions.list` หรือเครื่องมือ
`sessions_list` ของเอเจนต์เป็นสัญญาณสุขภาพของซ็อกเก็ตช่องทาง พื้นผิวเหล่านั้นรายงาน
แถวบทสนทนาที่จัดเก็บไว้ ไม่ใช่สถานะรันไทม์ของผู้ให้บริการ หลังจากรีสตาร์ตผู้ให้บริการ Discord
บัญชีที่เชื่อมต่ออยู่แต่ไม่มีความเคลื่อนไหวอาจยังทำงานปกติ แม้จะไม่มีแถวเซสชัน Discord
ปรากฏจนกว่าจะมีเหตุการณ์บทสนทนาขาเข้าหรือขาออกครั้งถัดไป

## เพิ่ม / ลบบัญชี

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` แสดงแฟล็กเฉพาะแต่ละช่องทาง (โทเคน, คีย์ส่วนตัว, โทเคนแอป, พาธ signal-cli และอื่นๆ)
</Tip>

`channels remove` ทำงานเฉพาะกับ Plugin ช่องทางที่ติดตั้ง/กำหนดค่าแล้ว ใช้ `channels add` ก่อนสำหรับช่องทางในแค็ตตาล็อกที่ติดตั้งได้
สำหรับ Plugin ช่องทางที่มีแบ็กเอนด์รันไทม์ `channels remove` จะขอให้ Gateway ที่กำลังทำงานหยุดบัญชีที่เลือกก่อนอัปเดตการกำหนดค่า ดังนั้นการปิดใช้งานหรือลบบัญชีจะไม่ปล่อยให้ตัวฟังเดิมยังทำงานอยู่จนกว่าจะรีสตาร์ต

พื้นผิวการเพิ่มแบบไม่โต้ตอบที่พบบ่อย ได้แก่:

- ช่องทาง bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- ฟิลด์การรับส่ง Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- ฟิลด์ Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- ฟิลด์ Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- ฟิลด์ Nostr: `--private-key`, `--relay-urls`
- ฟิลด์ Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` สำหรับการยืนยันตัวตนของบัญชีเริ่มต้นที่อิง env เมื่อรองรับ

หากต้องติดตั้ง Plugin ช่องทางระหว่างคำสั่งเพิ่มที่ขับเคลื่อนด้วยแฟล็ก OpenClaw จะใช้แหล่งติดตั้งเริ่มต้นของช่องทางโดยไม่เปิดพรอมป์ติดตั้ง Plugin แบบโต้ตอบ

เมื่อคุณรัน `openclaw channels add` โดยไม่มีแฟล็ก วิซาร์ดแบบโต้ตอบอาจถาม:

- รหัสบัญชีต่อช่องทางที่เลือก
- ชื่อที่แสดงแบบไม่บังคับสำหรับบัญชีเหล่านั้น
- `Route these channel accounts to agents now?`

หากคุณยืนยันให้ผูกตอนนี้ วิซาร์ดจะถามว่าเอเจนต์ใดควรเป็นเจ้าของบัญชีช่องทางที่กำหนดค่าแต่ละบัญชี และเขียนการผูกเส้นทางแบบเจาะจงบัญชี

คุณยังสามารถจัดการกฎการกำหนดเส้นทางเดียวกันในภายหลังได้ด้วย `openclaw agents bindings`, `openclaw agents bind` และ `openclaw agents unbind` (ดู [agents](/th/cli/agents))

เมื่อคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นลงในช่องทางที่ยังใช้การตั้งค่าระดับบนสุดแบบบัญชีเดียว OpenClaw จะเลื่อนค่าระดับบนสุดแบบเจาะจงบัญชีเข้าไปในแผนที่บัญชีของช่องทางก่อนเขียนบัญชีใหม่ ช่องทางส่วนใหญ่จะวางค่าเหล่านั้นไว้ใน `channels.<channel>.accounts.default` แต่ช่องทางที่มาพร้อมชุดติดตั้งสามารถเก็บบัญชีที่เลื่อนขึ้นมาและตรงกันอยู่แล้วแทนได้ Matrix เป็นตัวอย่างปัจจุบัน: หากมีบัญชีที่ตั้งชื่อไว้หนึ่งบัญชีอยู่แล้ว หรือ `defaultAccount` ชี้ไปยังบัญชีที่ตั้งชื่อไว้ซึ่งมีอยู่แล้ว การเลื่อนค่าจะเก็บบัญชีนั้นไว้แทนการสร้าง `accounts.default` ใหม่

พฤติกรรมการกำหนดเส้นทางยังคงสอดคล้องกัน:

- การผูกแบบระบุเฉพาะช่องทางที่มีอยู่แล้ว (ไม่มี `accountId`) จะยังคงจับคู่กับบัญชีเริ่มต้น
- `channels add` จะไม่สร้างหรือเขียนการผูกใหม่โดยอัตโนมัติในโหมดไม่โต้ตอบ
- การตั้งค่าแบบโต้ตอบสามารถเพิ่มการผูกแบบเจาะจงบัญชีได้ตามต้องการ

หากการกำหนดค่าของคุณอยู่ในสถานะผสมอยู่แล้ว (มีบัญชีที่ตั้งชื่อไว้ และยังตั้งค่าระดับบนสุดแบบบัญชีเดียวไว้) ให้รัน `openclaw doctor --fix` เพื่อย้ายค่าแบบเจาะจงบัญชีเข้าไปในบัญชีที่เลื่อนขึ้นมาซึ่งเลือกไว้สำหรับช่องทางนั้น ช่องทางส่วนใหญ่เลื่อนค่าเข้าไปใน `accounts.default`; Matrix สามารถเก็บเป้าหมายที่ตั้งชื่อไว้/ค่าเริ่มต้นที่มีอยู่แล้วแทนได้

## เข้าสู่ระบบและออกจากระบบ (แบบโต้ตอบ)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` รองรับ `--verbose`
- `channels login` และ `logout` สามารถอนุมานช่องทางได้เมื่อมีเป้าหมายเข้าสู่ระบบที่รองรับซึ่งกำหนดค่าไว้เพียงรายการเดียว
- `channels logout` จะเลือกเส้นทาง Gateway แบบไลฟ์เมื่อเข้าถึงได้ ดังนั้นการออกจากระบบจะหยุดตัวฟังที่ทำงานอยู่ก่อนล้างสถานะการยืนยันตัวตนของช่องทาง หากเข้าถึง Gateway ภายในเครื่องไม่ได้ จะย้อนกลับไปล้างการยืนยันตัวตนภายในเครื่อง
- รัน `channels login` จากเทอร์มินัลบนโฮสต์ Gateway `exec` ของเอเจนต์จะบล็อกโฟลว์เข้าสู่ระบบแบบโต้ตอบนี้ ควรใช้เครื่องมือเข้าสู่ระบบของเอเจนต์ที่เป็นของช่องทางโดยตรง เช่น `whatsapp_login` จากแชตเมื่อมีให้ใช้

## การแก้ไขปัญหา

- รัน `openclaw status --deep` สำหรับการตรวจสอบแบบกว้าง
- ใช้ `openclaw doctor` สำหรับการแก้ไขแบบมีคำแนะนำ
- `openclaw channels list` จะไม่พิมพ์สแนปช็อตการใช้งาน/โควตาของผู้ให้บริการโมเดลอีกต่อไป สำหรับข้อมูลเหล่านั้น ให้ใช้ `openclaw status` (ภาพรวม) หรือ `openclaw models list` (รายผู้ให้บริการ)
- `openclaw channels status` จะย้อนกลับไปใช้สรุปจากการกำหนดค่าเท่านั้นเมื่อเข้าถึง Gateway ไม่ได้ หากข้อมูลลับของช่องทางที่รองรับถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน คำสั่งจะรายงานบัญชีนั้นว่าได้รับการกำหนดค่าแล้วพร้อมหมายเหตุสถานะลดระดับ แทนที่จะแสดงว่ายังไม่ได้กำหนดค่า

## การตรวจสอบความสามารถ

ดึงคำใบ้ความสามารถของผู้ให้บริการ (intents/scopes เมื่อมี) พร้อมการรองรับฟีเจอร์แบบคงที่:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

หมายเหตุ:

- `--channel` เป็นตัวเลือกเสริม; ละไว้เพื่อแสดงทุกช่องทาง (รวม extensions)
- `--account` ใช้ได้เฉพาะกับ `--channel`
- `--target` รับ `channel:<id>` หรือรหัสช่องทางตัวเลขดิบ และใช้กับ Discord เท่านั้น สำหรับช่องทางเสียง Discord การตรวจสอบสิทธิ์จะทำเครื่องหมายเมื่อขาด `ViewChannel`, `Connect`, `Speak`, `SendMessages` และ `ReadMessageHistory`
- การตรวจสอบเป็นแบบเฉพาะผู้ให้บริการ: Discord intents + สิทธิ์ช่องทางแบบไม่บังคับ; ขอบเขตบอต + ผู้ใช้ของ Slack; แฟล็กบอต Telegram + Webhook; เวอร์ชันดีมอน Signal; โทเคนแอป Microsoft Teams + บทบาท/ขอบเขต Graph (ระบุคำอธิบายเมื่อทราบ) ช่องทางที่ไม่มีการตรวจสอบจะรายงาน `Probe: unavailable`

## แก้ไขชื่อเป็นรหัส

แก้ไขชื่อช่องทาง/ผู้ใช้เป็นรหัสโดยใช้ไดเรกทอรีของผู้ให้บริการ:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

หมายเหตุ:

- ใช้ `--kind user|group|auto` เพื่อบังคับประเภทเป้าหมาย
- การแก้ไขชื่อจะเลือกการจับคู่ที่ใช้งานอยู่ก่อนเมื่อมีหลายรายการใช้ชื่อเดียวกัน
- `channels resolve` เป็นแบบอ่านอย่างเดียว หากบัญชีที่เลือกถูกกำหนดค่าผ่าน SecretRef แต่ข้อมูลลับนั้นไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน คำสั่งจะส่งคืนผลลัพธ์ที่แก้ไขไม่ได้พร้อมสถานะลดระดับและหมายเหตุ แทนที่จะยกเลิกการรันทั้งหมด
- `channels resolve` จะไม่ติดตั้ง Plugin ช่องทาง ใช้ `channels add --channel <name>` ก่อนแก้ไขชื่อสำหรับช่องทางในแค็ตตาล็อกที่ติดตั้งได้

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [ภาพรวมช่องทาง](/th/channels)
