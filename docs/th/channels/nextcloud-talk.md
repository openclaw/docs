---
read_when:
    - กำลังทำงานกับฟีเจอร์ของช่องทาง Nextcloud Talk
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของ Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-10T19:23:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4b3b2d074cc8d3c19223dbb0c306c6861717d0f35e638e3aab04b03647fd248
    source_path: channels/nextcloud-talk.md
    workflow: 16
    postprocess_version: locale-links-v1
---

สถานะ: Plugin ที่รวมมาให้ (บอต Webhook) รองรับข้อความโดยตรง ห้อง ปฏิกิริยา และข้อความ Markdown

## Plugin ที่รวมมาให้

Nextcloud Talk จัดส่งมาเป็น Plugin ที่รวมมาให้ใน OpenClaw รุ่นปัจจุบัน ดังนั้น
บิลด์ที่แพ็กเกจตามปกติจึงไม่จำเป็นต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Nextcloud Talk
ให้ติดตั้งแพ็กเกจ npm โดยตรง:

ติดตั้งผ่าน CLI (รีจิสทรี npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

ใช้แพ็กเกจเปล่าเพื่อติดตามแท็กรุ่นทางการปัจจุบัน ปักหมุดเวอร์ชันที่แน่นอน
เฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้เท่านั้น

เช็กเอาต์ในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว (ผู้เริ่มต้น)

1. ตรวจสอบให้แน่ใจว่า Plugin Nextcloud Talk พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมไว้แล้ว
   - การติดตั้งรุ่นเก่า/แบบกำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งด้านบน
2. บนเซิร์ฟเวอร์ Nextcloud ของคุณ ให้สร้างบอต:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

3. เปิดใช้บอตในการตั้งค่าห้องเป้าหมาย
4. กำหนดค่า OpenClaw:
   - การกำหนดค่า: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - หรือ env: `NEXTCLOUD_TALK_BOT_SECRET` (เฉพาะบัญชีค่าเริ่มต้น)

   การตั้งค่าผ่าน CLI:

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

   ความลับที่อิงจากไฟล์:

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
- การอัปโหลดสื่อไม่รองรับโดย API ของบอต; สื่อจะถูกส่งเป็น URL
- เพย์โหลด Webhook ไม่แยกความแตกต่างระหว่าง DM กับห้อง; ตั้งค่า `apiUser` + `apiPassword` เพื่อเปิดใช้การค้นหาประเภทห้อง (ไม่เช่นนั้น DM จะถูกปฏิบัติเหมือนห้อง)

## การควบคุมการเข้าถึง (DM)

- ค่าเริ่มต้น: `channels.nextcloud-talk.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะได้รับรหัสการจับคู่
- อนุมัติผ่าน:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DM สาธารณะ: `channels.nextcloud-talk.dmPolicy="open"` รวมกับ `channels.nextcloud-talk.allowFrom=["*"]`
- `allowFrom` จับคู่เฉพาะ ID ผู้ใช้ Nextcloud เท่านั้น; ชื่อที่แสดงจะถูกละเว้น

## ห้อง (กลุ่ม)

- ค่าเริ่มต้น: `channels.nextcloud-talk.groupPolicy = "allowlist"` (ควบคุมด้วยการกล่าวถึง)
- อนุญาตห้องด้วย `channels.nextcloud-talk.rooms`:

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

- หากไม่ต้องการอนุญาตห้องใด ให้ปล่อยรายการอนุญาตว่างไว้หรือตั้งค่า `channels.nextcloud-talk.groupPolicy="disabled"`

## ความสามารถ

| ฟีเจอร์          | สถานะ             |
| --------------- | ------------- |
| ข้อความโดยตรง | รองรับ     |
| ห้อง           | รองรับ     |
| เธรด         | ไม่รองรับ |
| สื่อ           | เฉพาะ URL      |
| ปฏิกิริยา       | รองรับ     |
| คำสั่งแบบเนทีฟ | ไม่รองรับ |

## อ้างอิงการกำหนดค่า (Nextcloud Talk)

การกำหนดค่าแบบเต็ม: [การกำหนดค่า](/th/gateway/configuration)

ตัวเลือกผู้ให้บริการ:

- `channels.nextcloud-talk.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.nextcloud-talk.baseUrl`: URL ของอินสแตนซ์ Nextcloud
- `channels.nextcloud-talk.botSecret`: ความลับร่วมของบอต
- `channels.nextcloud-talk.botSecretFile`: พาธความลับแบบไฟล์ปกติ Symlink จะถูกปฏิเสธ
- `channels.nextcloud-talk.apiUser`: ผู้ใช้ API สำหรับค้นหาห้อง (การตรวจจับ DM)
- `channels.nextcloud-talk.apiPassword`: รหัสผ่าน API/แอปสำหรับค้นหาห้อง
- `channels.nextcloud-talk.apiPasswordFile`: พาธไฟล์รหัสผ่าน API
- `channels.nextcloud-talk.webhookPort`: พอร์ตตัวรับฟัง Webhook (ค่าเริ่มต้น: 8788)
- `channels.nextcloud-talk.webhookHost`: โฮสต์ Webhook (ค่าเริ่มต้น: 0.0.0.0)
- `channels.nextcloud-talk.webhookPath`: พาธ Webhook (ค่าเริ่มต้น: /nextcloud-talk-webhook)
- `channels.nextcloud-talk.webhookPublicUrl`: URL ของ Webhook ที่เข้าถึงได้จากภายนอก
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.nextcloud-talk.allowFrom`: รายการอนุญาต DM (ID ผู้ใช้) `open` ต้องใช้ `"*"`
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`
- `channels.nextcloud-talk.groupAllowFrom`: รายการอนุญาตกลุ่ม (ID ผู้ใช้)
- `channels.nextcloud-talk.rooms`: การตั้งค่าและรายการอนุญาตต่อห้อง
- กลุ่มการเข้าถึงผู้ส่งแบบคงที่สามารถอ้างอิงจาก `allowFrom` และ `groupAllowFrom` ด้วย `accessGroup:<name>`
- `channels.nextcloud-talk.historyLimit`: ขีดจำกัดประวัติกลุ่ม (0 ปิดใช้งาน)
- `channels.nextcloud-talk.dmHistoryLimit`: ขีดจำกัดประวัติ DM (0 ปิดใช้งาน)
- `channels.nextcloud-talk.dms`: การแทนที่ต่อ DM (historyLimit)
- `channels.nextcloud-talk.textChunkLimit`: ขนาดชังก์ข้อความขาออก (อักขระ)
- `channels.nextcloud-talk.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแยกตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งชังก์ตามความยาว
- `channels.nextcloud-talk.blockStreaming`: ปิดใช้งานการสตรีมบล็อกสำหรับช่องทางนี้
- `channels.nextcloud-talk.blockStreamingCoalesce`: การปรับแต่งการรวมการสตรีมบล็อก
- `channels.nextcloud-talk.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า (MB)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
