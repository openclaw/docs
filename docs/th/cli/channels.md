---
read_when:
    - คุณต้องการเพิ่ม/ลบบัญชีช่องทาง (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - คุณต้องการตรวจสอบสถานะช่องทางหรือติดตามบันทึกของช่องทางแบบเรียลไทม์
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw channels` (accounts, status, login/logout, logs)
title: ช่องทาง
x-i18n:
    generated_at: "2026-05-10T19:28:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: e860f2863e148a46b9beb7f855eb9f30addc1b012f1430bf33c544c5e321821d
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
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` แสดงเฉพาะช่องทางแชต: โดยค่าเริ่มต้นจะแสดงบัญชีที่กำหนดค่าไว้ พร้อมแท็กสถานะ `installed`, `configured`, และ `enabled` ต่อบัญชี ส่ง `--all` เพื่อแสดงช่องทางที่บันเดิลมาด้วยซึ่งยังไม่มีบัญชีที่กำหนดค่าไว้ และช่องทางในแคตตาล็อกที่ติดตั้งได้ซึ่งยังไม่ได้อยู่บนดิสก์ด้วย Auth providers (OAuth + API keys) และสแนปช็อตการใช้งาน/โควตาของ model-provider จะไม่ถูกพิมพ์ที่นี่อีกต่อไป; ใช้ `openclaw models auth list` สำหรับโปรไฟล์ auth ของ provider และใช้ `openclaw status` หรือ `openclaw models list` สำหรับการใช้งาน

## สถานะ / ความสามารถ / แก้ชื่อ / บันทึก

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (ใช้ได้เฉพาะกับ `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` คือเส้นทางแบบสด: บน Gateway ที่เข้าถึงได้ จะรันการตรวจสอบ
`probeAccount` ต่อบัญชี และการตรวจสอบ `auditAccount` ที่เป็นทางเลือก ดังนั้นเอาต์พุตอาจรวมสถานะ
ของทรานสปอร์ตพร้อมผลการ probe เช่น `works`, `probe failed`, `audit ok`, หรือ `audit failed`
หาก Gateway เข้าถึงไม่ได้ `channels status` จะถอยกลับไปใช้สรุปจาก config เท่านั้น
แทนเอาต์พุต probe แบบสด

อย่าใช้ `openclaw sessions`, Gateway `sessions.list`, หรือเครื่องมือ
`sessions_list` ของ agent เป็นสัญญาณสุขภาพของซ็อกเก็ตช่องทาง พื้นผิวเหล่านั้นรายงาน
แถวบทสนทนาที่จัดเก็บไว้ ไม่ใช่สถานะรันไทม์ของ provider หลังจากรีสตาร์ต provider ของ Discord
บัญชีที่เชื่อมต่ออยู่แต่เงียบอาจยังปกติดี แม้จะไม่มีแถว session ของ Discord
ปรากฏจนกว่าจะมีเหตุการณ์บทสนทนาขาเข้าหรือขาออกถัดไป

## เพิ่ม / ลบบัญชี

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` แสดงแฟล็กต่อช่องทาง (token, private key, app token, signal-cli paths, เป็นต้น)
</Tip>

`channels remove` ทำงานกับ Plugin ช่องทางที่ติดตั้ง/กำหนดค่าไว้เท่านั้น ใช้ `channels add` ก่อนสำหรับช่องทางแคตตาล็อกที่ติดตั้งได้
สำหรับ Plugin ช่องทางที่มีรันไทม์รองรับ `channels remove` จะขอให้ Gateway ที่กำลังรันหยุดบัญชีที่เลือกก่อนอัปเดต config ด้วย ดังนั้นการปิดใช้งานหรือลบบัญชีจะไม่ปล่อยให้ listener เก่ายังคงทำงานอยู่จนกว่าจะรีสตาร์ต

พื้นผิวการเพิ่มแบบไม่โต้ตอบที่พบบ่อย ได้แก่:

- ช่องทางแบบ bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- ฟิลด์ทรานสปอร์ตของ Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- ฟิลด์ Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- ฟิลด์ Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- ฟิลด์ Nostr: `--private-key`, `--relay-urls`
- ฟิลด์ Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` สำหรับ auth ที่อิง env ของบัญชีเริ่มต้นเมื่อรองรับ

หากจำเป็นต้องติดตั้ง Plugin ช่องทางระหว่างคำสั่ง add ที่ขับด้วยแฟล็ก OpenClaw จะใช้แหล่งติดตั้งเริ่มต้นของช่องทางโดยไม่เปิดพรอมป์ติดตั้ง Plugin แบบโต้ตอบ

เมื่อคุณรัน `openclaw channels add` โดยไม่มีแฟล็ก วิซาร์ดแบบโต้ตอบสามารถถาม:

- id ของบัญชีต่อช่องทางที่เลือก
- ชื่อที่แสดงซึ่งเป็นทางเลือกสำหรับบัญชีเหล่านั้น
- `Route these channel accounts to agents now?`

หากคุณยืนยันให้ผูกตอนนี้ วิซาร์ดจะถามว่า agent ใดควรเป็นเจ้าของบัญชีช่องทางที่กำหนดค่าไว้แต่ละบัญชี และเขียนการผูก routing ที่มีขอบเขตตามบัญชี

คุณยังสามารถจัดการกฎ routing เดียวกันภายหลังได้ด้วย `openclaw agents bindings`, `openclaw agents bind`, และ `openclaw agents unbind` (ดู [agents](/th/cli/agents))

เมื่อคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นลงในช่องทางที่ยังใช้การตั้งค่าระดับบนแบบบัญชีเดียว OpenClaw จะเลื่อนค่าระดับบนที่มีขอบเขตตามบัญชีเข้าไปในแผนที่บัญชีของช่องทางก่อนเขียนบัญชีใหม่ ช่องทางส่วนใหญ่จะวางค่าเหล่านั้นไว้ใน `channels.<channel>.accounts.default` แต่ช่องทางที่บันเดิลมาแล้วสามารถรักษาบัญชีที่เลื่อนขึ้นมาซึ่งตรงกันและมีอยู่เดิมแทนได้ Matrix คือตัวอย่างปัจจุบัน: หากมีบัญชีที่ตั้งชื่อไว้หนึ่งบัญชีอยู่แล้ว หรือ `defaultAccount` ชี้ไปที่บัญชีที่ตั้งชื่อไว้ซึ่งมีอยู่ การเลื่อนขั้นจะรักษาบัญชีนั้นไว้แทนการสร้าง `accounts.default` ใหม่

พฤติกรรม routing ยังคงสอดคล้อง:

- การผูกที่มีอยู่ซึ่งระบุเฉพาะช่องทาง (ไม่มี `accountId`) จะยังคงจับคู่กับบัญชีเริ่มต้น
- `channels add` จะไม่สร้างหรือเขียนการผูกใหม่โดยอัตโนมัติในโหมดไม่โต้ตอบ
- การตั้งค่าแบบโต้ตอบสามารถเพิ่มการผูกที่มีขอบเขตตามบัญชีได้ตามต้องการ

หาก config ของคุณอยู่ในสถานะผสมอยู่แล้ว (มีบัญชีที่ตั้งชื่อไว้ และยังตั้งค่าระดับบนแบบบัญชีเดียวอยู่) ให้รัน `openclaw doctor --fix` เพื่อย้ายค่าที่มีขอบเขตตามบัญชีเข้าไปในบัญชีที่เลื่อนขั้นซึ่งเลือกไว้สำหรับช่องทางนั้น ช่องทางส่วนใหญ่จะเลื่อนเข้า `accounts.default`; Matrix สามารถรักษาเป้าหมายที่ตั้งชื่อไว้/ค่าเริ่มต้นซึ่งมีอยู่แทนได้

## เข้าสู่ระบบและออกจากระบบ (โต้ตอบ)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` รองรับ `--verbose`
- `channels login` และ `logout` สามารถอนุมานช่องทางได้เมื่อมีเป้าหมาย login ที่รองรับซึ่งกำหนดค่าไว้เพียงหนึ่งรายการ
- `channels logout` ชอบใช้เส้นทาง Gateway แบบสดเมื่อเข้าถึงได้ ดังนั้น logout จะหยุด listener ที่ทำงานอยู่ก่อนล้างสถานะ auth ของช่องทาง หาก Gateway ภายในเครื่องเข้าถึงไม่ได้ จะถอยกลับไปล้าง auth ภายในเครื่อง
- รัน `channels login` จากเทอร์มินัลบนโฮสต์ gateway Agent `exec` จะบล็อกโฟลว์ login แบบโต้ตอบนี้; ควรใช้เครื่องมือ login ดั้งเดิมของช่องทางสำหรับ agent เช่น `whatsapp_login` จากแชตเมื่อมีให้ใช้

## การแก้ไขปัญหา

- รัน `openclaw status --deep` เพื่อ probe แบบกว้าง
- ใช้ `openclaw doctor` สำหรับการแก้ไขแบบมีคำแนะนำ
- `openclaw channels list` จะไม่พิมพ์สแนปช็อตการใช้งาน/โควตาของ model provider อีกต่อไป สำหรับข้อมูลเหล่านั้น ให้ใช้ `openclaw status` (ภาพรวม) หรือ `openclaw models list` (ต่อ provider)
- `openclaw channels status` จะถอยกลับไปใช้สรุปจาก config เท่านั้นเมื่อ gateway เข้าถึงไม่ได้ หาก credential ของช่องทางที่รองรับถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน จะรายงานบัญชีนั้นว่ากำหนดค่าแล้วพร้อมหมายเหตุแบบลดระดับ แทนการแสดงว่ายังไม่ได้กำหนดค่า

## Probe ความสามารถ

ดึงคำใบ้ความสามารถของ provider (intents/scopes เมื่อมี) พร้อมการรองรับฟีเจอร์แบบสแตติก:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

หมายเหตุ:

- `--channel` เป็นทางเลือก; ละไว้เพื่อแสดงทุกช่องทาง (รวมถึง extensions)
- `--account` ใช้ได้เฉพาะกับ `--channel`
- `--target` รับ `channel:<id>` หรือ id ช่องทางแบบตัวเลขดิบ และใช้กับ Discord เท่านั้น สำหรับช่องเสียงของ Discord การตรวจสอบสิทธิ์จะตั้งแฟล็กเมื่อขาด `ViewChannel`, `Connect`, `Speak`, `SendMessages`, และ `ReadMessageHistory`
- Probe เป็นแบบเฉพาะ provider: intents ของ Discord + สิทธิ์ช่องทางที่เป็นทางเลือก; scopes ของบอต + ผู้ใช้ใน Slack; แฟล็กบอต + Webhook ของ Telegram; เวอร์ชัน daemon ของ Signal; app token + Graph roles/scopes ของ Microsoft Teams (มีคำอธิบายประกอบเมื่อทราบ) ช่องทางที่ไม่มี probe จะรายงาน `Probe: unavailable`

## แก้ชื่อเป็น ID

แก้ชื่อช่องทาง/ผู้ใช้เป็น ID โดยใช้ไดเรกทอรีของ provider:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

หมายเหตุ:

- ใช้ `--kind user|group|auto` เพื่อบังคับชนิดเป้าหมาย
- การ resolve จะชอบรายการที่ active เมื่อมีหลายรายการใช้ชื่อเดียวกัน
- `channels resolve` เป็นแบบอ่านอย่างเดียว หากบัญชีที่เลือกถูกกำหนดค่าผ่าน SecretRef แต่ credential นั้นไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน คำสั่งจะคืนผลลัพธ์ unresolved แบบลดระดับพร้อมหมายเหตุ แทนการยกเลิกการรันทั้งหมด
- `channels resolve` ไม่ติดตั้ง Plugin ช่องทาง ใช้ `channels add --channel <name>` ก่อน resolve ชื่อสำหรับช่องทางแคตตาล็อกที่ติดตั้งได้

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [ภาพรวมช่องทาง](/th/channels)
