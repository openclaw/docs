---
read_when:
    - กำลังพัฒนาฟีเจอร์ช่องทาง Nextcloud Talk
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่า Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-16T18:39:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59f4fe51555bcb13d630140866307b1a49ba077059818ec116ee50ef0c877b2b
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk เป็น Plugin ช่องทางที่ดาวน์โหลดได้ (`@openclaw/nextcloud-talk`) ซึ่งเชื่อมต่อ OpenClaw กับอินสแตนซ์ Nextcloud ที่โฮสต์เองผ่านบอต Webhook ของ Talk รองรับข้อความส่วนตัว ห้อง การแสดงความรู้สึก และข้อความ Markdown ส่วนสื่อจะส่งออกเป็น URL

## ติดตั้ง

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

ใช้ข้อกำหนดแพ็กเกจแบบไม่มีเวอร์ชันเพื่อติดตามแท็กรีลีสทางการปัจจุบัน ตรึงเวอร์ชันที่แน่นอนเฉพาะเมื่อต้องการให้การติดตั้งทำซ้ำได้เหมือนเดิม

จากเช็กเอาต์ภายในเครื่อง (เวิร์กโฟลว์การพัฒนา):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

รีสตาร์ต Gateway หลังติดตั้ง รายละเอียด: [Plugin](/th/tools/plugin)

## ตั้งค่าด่วน (สำหรับผู้เริ่มต้น)

1. ติดตั้ง Plugin (ด้านบน)
2. สร้างบอตบนเซิร์ฟเวอร์ Nextcloud:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   คง `--feature response` ไว้ หากไม่มีค่านี้ การตอบกลับขาออกจะล้มเหลวด้วย 401 ซ่อมแซมบอตที่มีอยู่ด้วย `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`

3. เปิดใช้งานบอตในการตั้งค่าห้องเป้าหมาย
4. กำหนดค่า OpenClaw:
   - การกำหนดค่า: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - หรือสภาพแวดล้อม: `NEXTCLOUD_TALK_BOT_SECRET` (เฉพาะบัญชีเริ่มต้น)

   การตั้งค่าด้วย CLI (`--url`/`--token` เป็นนามแฝงของฟิลด์แบบระบุชัดเจน ส่วน `nc-talk` และ `nc` ใช้เป็นนามแฝงของช่องทางได้):

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   ฟิลด์แบบระบุชัดเจนที่เทียบเท่ากัน:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   ข้อมูลลับที่จัดเก็บในไฟล์:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. รีสตาร์ต Gateway (หรือดำเนินการตั้งค่าให้เสร็จสิ้น)

การกำหนดค่าขั้นต่ำ:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## หมายเหตุ

- บอตไม่สามารถเริ่มข้อความส่วนตัวได้ ผู้ใช้ต้องส่งข้อความถึงบอตก่อน
- เซิร์ฟเวอร์ Nextcloud ต้องเข้าถึง URL ของ Webhook ได้ ให้ตั้งค่า `webhookPublicUrl` เมื่อ Gateway อยู่หลังพร็อกซี คำขอ Webhook จะลงนามด้วย HMAC-SHA256 โดยใช้ข้อมูลลับของบอต ลายเซ็นที่ไม่ถูกต้องจะถูกปฏิเสธและจำกัดอัตรา
- API ของบอตไม่รองรับการอัปโหลดสื่อ สื่อขาออกจะถูกต่อท้ายเป็นบรรทัด `Attachment: <url>`
- เพย์โหลดของ Webhook ไม่แยกข้อความส่วนตัวออกจากห้อง ให้ตั้งค่า `apiUser` + `apiPassword` เพื่อเปิดใช้งานการค้นหาประเภทห้อง (แคชประมาณ 5 นาที) หากไม่มีค่าเหล่านี้ ทุกการสนทนาจะถือเป็นห้อง
- คำขอขาออกจะผ่านการป้องกัน SSRF สำหรับโฮสต์ Nextcloud บนเครือข่ายส่วนตัว/ภายในที่เชื่อถือได้ ให้เลือกอนุญาตด้วย `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`
- เมื่อตั้งค่า `apiUser`/`apiPassword` และ `webhookPublicUrl` แล้ว `openclaw channels status` จะตรวจสอบบอตและเตือนเมื่อไม่มีคุณลักษณะ `response`

## การควบคุมการเข้าถึง (ข้อความส่วนตัว)

- ค่าเริ่มต้น: `channels.nextcloud-talk.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะได้รับรหัสการจับคู่
- อนุมัติผ่าน:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- ข้อความส่วนตัวแบบสาธารณะ: `channels.nextcloud-talk.dmPolicy="open"` ร่วมกับ `channels.nextcloud-talk.allowFrom=["*"]`
- `allowFrom` จับคู่เฉพาะ ID ผู้ใช้ Nextcloud (แปลงเป็นตัวพิมพ์เล็ก) โดยไม่สนใจชื่อที่แสดง

## ห้อง (กลุ่ม)

- ค่าเริ่มต้น: `channels.nextcloud-talk.groupPolicy = "allowlist"` (ต้องมีการกล่าวถึง)
- อนุญาตห้องด้วย `channels.nextcloud-talk.rooms` โดยใช้โทเค็นห้องเป็นคีย์ ส่วน `"*"` ใช้กำหนดค่าเริ่มต้นแบบไวลด์การ์ด:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- คีย์รายห้อง: `requireMention` (ค่าเริ่มต้นเป็น true), `enabled` (false จะปิดใช้งานห้อง), `allowFrom` (รายการผู้ส่งที่อนุญาตสำหรับแต่ละห้อง), `tools` (การแทนที่การอนุญาต/ปฏิเสธเครื่องมือ), `skills` (จำกัด Skills ที่โหลด), `systemPrompt`
- หากไม่ต้องการอนุญาตห้องใด ให้ปล่อยรายการที่อนุญาตว่างไว้หรือตั้งค่า `channels.nextcloud-talk.groupPolicy="disabled"`

## ความสามารถ

| คุณลักษณะ         | สถานะ        |
| --------------- | ------------- |
| ข้อความส่วนตัว | รองรับ     |
| ห้อง           | รองรับ     |
| เธรด         | ไม่รองรับ |
| สื่อ           | URL เท่านั้น      |
| การแสดงความรู้สึก       | รองรับ     |
| คำสั่งแบบเนทีฟ | ไม่รองรับ |

## ข้อมูลอ้างอิงการกำหนดค่า (Nextcloud Talk)

การกำหนดค่าทั้งหมด: [การกำหนดค่า](/th/gateway/configuration)

ตัวเลือกของผู้ให้บริการ:

- `channels.nextcloud-talk.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.nextcloud-talk.baseUrl`: URL ของอินสแตนซ์ Nextcloud
- `channels.nextcloud-talk.botSecret`: ข้อมูลลับที่ใช้ร่วมกันของบอต (สตริงหรือการอ้างอิงข้อมูลลับ)
- `channels.nextcloud-talk.botSecretFile`: พาธข้อมูลลับของไฟล์ปกติ ระบบจะปฏิเสธลิงก์สัญลักษณ์
- `channels.nextcloud-talk.apiUser`: ผู้ใช้ API สำหรับค้นหาห้อง (ตรวจหาข้อความส่วนตัว) และการตรวจสอบสถานะ
- `channels.nextcloud-talk.apiPassword`: รหัสผ่าน API/แอปสำหรับค้นหาห้อง
- `channels.nextcloud-talk.apiPasswordFile`: พาธไฟล์รหัสผ่าน API
- `channels.nextcloud-talk.webhookPort`: พอร์ตตัวรับ Webhook (ค่าเริ่มต้น: 8788)
- `channels.nextcloud-talk.webhookHost`: โฮสต์ Webhook (ค่าเริ่มต้น: 0.0.0.0)
- `channels.nextcloud-talk.webhookPath`: พาธ Webhook (ค่าเริ่มต้น: /nextcloud-talk-webhook)
- `channels.nextcloud-talk.webhookPublicUrl`: URL ของ Webhook ที่เข้าถึงได้จากภายนอก
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing) `open` ต้องใช้ `allowFrom=["*"]`
- `channels.nextcloud-talk.allowFrom`: รายการข้อความส่วนตัวที่อนุญาต (ID ผู้ใช้)
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (ค่าเริ่มต้น: allowlist)
- `channels.nextcloud-talk.groupAllowFrom`: รายการผู้ส่งในห้องที่อนุญาต (ID ผู้ใช้) หากไม่ได้ตั้งค่า จะย้อนกลับไปใช้ `allowFrom`
- `channels.nextcloud-talk.rooms`: การตั้งค่าและรายการที่อนุญาตสำหรับแต่ละห้อง (ดูด้านบน)
- สามารถอ้างอิงกลุ่มการเข้าถึงแบบคงที่ของผู้ส่งจาก `allowFrom` และ `groupAllowFrom` ด้วย `accessGroup:<name>`
- `channels.nextcloud-talk.historyLimit`: ขีดจำกัดประวัติกลุ่ม (0 ปิดใช้งาน)
- `channels.nextcloud-talk.dmHistoryLimit`: ขีดจำกัดประวัติข้อความส่วนตัว (0 ปิดใช้งาน)
- `channels.nextcloud-talk.dms`: การแทนที่สำหรับแต่ละข้อความส่วนตัวโดยใช้ ID ผู้ใช้เป็นคีย์ (`historyLimit`)
- `channels.nextcloud-talk.textChunkLimit`: ขนาดส่วนข้อความขาออกเป็นจำนวนอักขระ (ค่าเริ่มต้น: 4000)
- `channels.nextcloud-talk.streaming.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- `channels.nextcloud-talk.streaming.block.enabled`: เปิดหรือปิดการสตรีมแบบบล็อกสำหรับช่องทางนี้
- `channels.nextcloud-talk.streaming.block.coalesce`: การปรับแต่งการรวมบล็อกสำหรับการสตรีม
- `channels.nextcloud-talk.responsePrefix`: คำนำหน้าการตอบกลับขาออก
- `channels.nextcloud-talk.markdown.tables`: โหมดการเรนเดอร์ตาราง Markdown (`off | bullets | code | block`)
- `channels.nextcloud-talk.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า (MB)
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: อนุญาตให้โฮสต์ Nextcloud แบบส่วนตัว/ภายในผ่านการป้องกัน SSRF
- `channels.nextcloud-talk.accounts.<id>`: การแทนที่รายบัญชี (ใช้คีย์เดียวกัน) `defaultAccount` เลือกบัญชีเริ่มต้น ตัวแปรสภาพแวดล้อม `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` ใช้กับบัญชีเริ่มต้นเท่านั้น

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนของข้อความส่วนตัวและขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — ลักษณะการทำงานของแชตกลุ่มและการกำหนดให้ต้องกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
