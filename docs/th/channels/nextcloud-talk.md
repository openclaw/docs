---
read_when:
    - การทำงานกับฟีเจอร์ของช่องทาง Nextcloud Talk
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของ Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-30T09:37:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcbe8a65adfddc95d2b4944af88f9982e23a1676752efec2bbf40cfc4dd846d2
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

สถานะ: Plugin ที่รวมมาให้ (บอต Webhook) รองรับข้อความส่วนตัว ห้อง การแสดงความรู้สึก และข้อความ markdown

## Plugin ที่รวมมาให้

Nextcloud Talk มาพร้อมเป็น Plugin ที่รวมมาให้ใน OpenClaw รุ่นปัจจุบัน ดังนั้น
บิลด์แบบแพ็กเกจปกติจึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Nextcloud Talk
ให้ติดตั้งแพ็กเกจ npm ปัจจุบันเมื่อมีการเผยแพร่:

ติดตั้งผ่าน CLI (npm registry เมื่อมีแพ็กเกจปัจจุบัน):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

หาก npm รายงานว่าแพ็กเกจที่ OpenClaw เป็นเจ้าของเลิกใช้งานแล้ว ให้ใช้บิลด์
OpenClaw แบบแพ็กเกจปัจจุบัน หรือใช้พาธเช็กเอาต์ในเครื่องจนกว่าจะมีการเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า

เช็กเอาต์ในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว (ผู้เริ่มต้น)

1. ตรวจสอบให้แน่ใจว่า Plugin Nextcloud Talk พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวม Plugin นี้ไว้แล้ว
   - การติดตั้งเก่าหรือแบบกำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งด้านบน
2. บนเซิร์ฟเวอร์ Nextcloud ของคุณ ให้สร้างบอต:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. เปิดใช้งานบอตในการตั้งค่าห้องเป้าหมาย
4. กำหนดค่า OpenClaw:
   - การกำหนดค่า: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - หรือ env: `NEXTCLOUD_TALK_BOT_SECRET` (เฉพาะบัญชีเริ่มต้น)

   การตั้งค่าด้วย CLI:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   ฟิลด์แบบระบุชัดเจนที่เทียบเท่า:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   ความลับที่อ้างอิงจากไฟล์:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. รีสตาร์ท Gateway (หรือทำการตั้งค่าให้เสร็จ)

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

- บอตไม่สามารถเริ่ม DM ได้ ผู้ใช้ต้องส่งข้อความหาบอตก่อน
- URL ของ Webhook ต้องเข้าถึงได้โดย Gateway; ตั้งค่า `webhookPublicUrl` หากอยู่หลังพร็อกซี
- API ของบอตไม่รองรับการอัปโหลดสื่อ; สื่อจะถูกส่งเป็น URL
- payload ของ Webhook ไม่แยกความแตกต่างระหว่าง DM กับห้อง; ตั้งค่า `apiUser` + `apiPassword` เพื่อเปิดใช้การค้นหาประเภทห้อง (มิฉะนั้น DM จะถูกถือว่าเป็นห้อง)

## การควบคุมการเข้าถึง (DM)

- ค่าเริ่มต้น: `channels.nextcloud-talk.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่
- อนุมัติผ่าน:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DM สาธารณะ: `channels.nextcloud-talk.dmPolicy="open"` รวมกับ `channels.nextcloud-talk.allowFrom=["*"]`
- `allowFrom` จับคู่เฉพาะ ID ผู้ใช้ Nextcloud เท่านั้น; ชื่อที่แสดงจะถูกละเว้น

## ห้อง (กลุ่ม)

- ค่าเริ่มต้น: `channels.nextcloud-talk.groupPolicy = "allowlist"` (ถูกควบคุมด้วยการกล่าวถึง)
- อนุญาตห้องด้วย allowlist ผ่าน `channels.nextcloud-talk.rooms`:

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

- หากไม่ต้องการอนุญาตห้องใด ให้ปล่อย allowlist ว่างไว้หรือตั้งค่า `channels.nextcloud-talk.groupPolicy="disabled"`

## ความสามารถ

| ฟีเจอร์         | สถานะ        |
| --------------- | ------------- |
| ข้อความส่วนตัว | รองรับ     |
| ห้อง           | รองรับ     |
| เธรด         | ไม่รองรับ |
| สื่อ           | เฉพาะ URL      |
| การแสดงความรู้สึก       | รองรับ     |
| คำสั่งเนทีฟ | ไม่รองรับ |

## อ้างอิงการกำหนดค่า (Nextcloud Talk)

การกำหนดค่าแบบเต็ม: [การกำหนดค่า](/th/gateway/configuration)

ตัวเลือกผู้ให้บริการ:

- `channels.nextcloud-talk.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.nextcloud-talk.baseUrl`: URL อินสแตนซ์ Nextcloud
- `channels.nextcloud-talk.botSecret`: ความลับร่วมของบอต
- `channels.nextcloud-talk.botSecretFile`: พาธความลับแบบไฟล์ปกติ symlink จะถูกปฏิเสธ
- `channels.nextcloud-talk.apiUser`: ผู้ใช้ API สำหรับการค้นหาห้อง (การตรวจจับ DM)
- `channels.nextcloud-talk.apiPassword`: รหัสผ่าน API/แอปสำหรับการค้นหาห้อง
- `channels.nextcloud-talk.apiPasswordFile`: พาธไฟล์รหัสผ่าน API
- `channels.nextcloud-talk.webhookPort`: พอร์ตตัวรับ Webhook (ค่าเริ่มต้น: 8788)
- `channels.nextcloud-talk.webhookHost`: โฮสต์ Webhook (ค่าเริ่มต้น: 0.0.0.0)
- `channels.nextcloud-talk.webhookPath`: พาธ Webhook (ค่าเริ่มต้น: /nextcloud-talk-webhook)
- `channels.nextcloud-talk.webhookPublicUrl`: URL ของ Webhook ที่เข้าถึงได้จากภายนอก
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.nextcloud-talk.allowFrom`: allowlist ของ DM (ID ผู้ใช้) `open` ต้องใช้ `"*"`
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`
- `channels.nextcloud-talk.groupAllowFrom`: allowlist ของกลุ่ม (ID ผู้ใช้)
- `channels.nextcloud-talk.rooms`: การตั้งค่าต่อห้องและ allowlist
- `channels.nextcloud-talk.historyLimit`: ขีดจำกัดประวัติกลุ่ม (0 ปิดใช้งาน)
- `channels.nextcloud-talk.dmHistoryLimit`: ขีดจำกัดประวัติ DM (0 ปิดใช้งาน)
- `channels.nextcloud-talk.dms`: การแทนที่ต่อ DM (historyLimit)
- `channels.nextcloud-talk.textChunkLimit`: ขนาดชิ้นข้อความขาออก (อักขระ)
- `channels.nextcloud-talk.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแบ่งที่บรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- `channels.nextcloud-talk.blockStreaming`: ปิดใช้งาน block streaming สำหรับช่องทางนี้
- `channels.nextcloud-talk.blockStreamingCoalesce`: การปรับแต่งการรวม block streaming
- `channels.nextcloud-talk.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า (MB)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนและโฟลว์การจับคู่ของ DM
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชทกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
