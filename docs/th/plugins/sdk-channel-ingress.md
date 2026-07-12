---
read_when:
    - การสร้างหรือย้าย Plugin ช่องทางรับส่งข้อความ
    - การเปลี่ยนรายการอนุญาตของ DM หรือกลุ่ม เกตการกำหนดเส้นทาง การยืนยันสิทธิ์คำสั่ง การยืนยันสิทธิ์เหตุการณ์ หรือการเปิดใช้งานด้วยการกล่าวถึง
    - การตรวจสอบการปกปิดข้อมูลที่ทางเข้าของช่องทางหรือขอบเขตความเข้ากันได้ของ SDK
sidebarTitle: Channel Ingress
summary: API การรับเข้าของช่องทางแบบทดลองสำหรับการอนุญาตข้อความขาเข้า
title: API ขาเข้าของช่องทาง
x-i18n:
    generated_at: "2026-07-12T16:29:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Channel ingress คือขอบเขตการควบคุมการเข้าถึงเชิงทดลองสำหรับเหตุการณ์ขาเข้า
ของช่องทาง Plugin เป็นเจ้าของข้อเท็จจริงของแพลตฟอร์มและผลข้างเคียง ส่วนแกนหลักเป็นเจ้าของ
นโยบายทั่วไป ได้แก่ รายการอนุญาตของ DM/กลุ่ม รายการ DM ในที่เก็บการจับคู่ เกตเส้นทาง
เกตคำสั่ง การยืนยันสิทธิ์เหตุการณ์ การเปิดใช้งานด้วยการกล่าวถึง การวินิจฉัยแบบปกปิดข้อมูล และ
การรับเข้า

ใช้ `openclaw/plugin-sdk/channel-ingress-runtime` สำหรับเส้นทางรับใหม่ พาธย่อย
`openclaw/plugin-sdk/channel-ingress` รุ่นเก่ายังคงส่งออกเป็นส่วนหน้าเพื่อความเข้ากันได้
ที่เลิกแนะนำแล้วสำหรับ Plugin ของบุคคลที่สาม

## ตัวแก้ค่าในรันไทม์

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

อย่าคำนวณรายการอนุญาตที่มีผล เจ้าของคำสั่ง หรือกลุ่มคำสั่งไว้ล่วงหน้า
ตัวแก้ค่าจะอนุมานสิ่งเหล่านี้จากรายการอนุญาตดิบ คอลแบ็กของที่เก็บ ตัวอธิบาย
เส้นทาง กลุ่มการเข้าถึง นโยบาย และประเภทการสนทนา

## ผลลัพธ์

Plugin ที่รวมมาในชุดควรใช้การฉายผลสมัยใหม่โดยตรง:

| ฟิลด์              | ความหมาย                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | การตัดสินใจของเกตตามลำดับและการรับเข้า                                |
| `senderAccess`     | การอนุญาตผู้ส่ง/การสนทนาเท่านั้น                             |
| `routeAccess`      | การฉายผลเส้นทางและผู้ส่งของเส้นทาง                                  |
| `commandAccess`    | การอนุญาตคำสั่ง; `requested: false` เมื่อไม่มีการเรียกใช้เกตคำสั่ง |
| `activationAccess` | ผลลัพธ์การกล่าวถึง/การเปิดใช้งาน                                          |

การอนุญาตเหตุการณ์ยังคงมีให้ใช้งานใน `ingress.graph` ที่เรียงลำดับแล้วและ
`ingress.reasonCode` ที่ใช้ตัดสิน โดยไม่มีการส่งออกการฉายผลเหตุการณ์แยกต่างหาก

ตัวช่วย SDK ของบุคคลที่สามที่เลิกแนะนำแล้วอาจสร้างโครงสร้างรุ่นเก่าขึ้นใหม่ภายใน เส้นทาง
รับที่รวมมาในชุดใหม่ไม่ควรแปลงผลลัพธ์สมัยใหม่กลับเป็น DTO ภายในเครื่อง

## กลุ่มการเข้าถึง

รายการ `accessGroup:<name>` ยังคงถูกปกปิด แกนหลักจะแก้ค่ากลุ่ม
`message.senders` แบบคงที่ด้วยตนเอง และเรียก `resolveAccessGroupMembership` เฉพาะ
สำหรับกลุ่มแบบไดนามิกที่ต้องค้นหาจากแพลตฟอร์ม กลุ่มที่ไม่มี ไม่รองรับ หรือ
ล้มเหลวจะปฏิเสธโดยปริยาย

## โหมดเหตุการณ์

| `authMode`       | ความหมาย                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | เกตผู้ส่งขาเข้าตามปกติ                      |
| `command`        | เกตคำสั่งสำหรับคอลแบ็กหรือปุ่มที่จำกัดขอบเขต    |
| `origin-subject` | ผู้กระทำต้องตรงกับเจ้าของข้อความต้นฉบับ    |
| `route-only`     | เฉพาะเกตเส้นทางสำหรับเหตุการณ์ที่เชื่อถือได้ซึ่งจำกัดขอบเขตตามเส้นทาง |
| `none`           | เหตุการณ์ภายในที่ Plugin เป็นเจ้าของจะข้ามการยืนยันสิทธิ์ร่วม  |

ใช้ `mayPair: false` สำหรับรีแอ็กชัน ปุ่ม คอลแบ็ก และคำสั่งเนทีฟ

## เส้นทางและการเปิดใช้งาน

ใช้ตัวอธิบายเส้นทางสำหรับนโยบายห้อง หัวข้อ กิลด์ เธรด หรือเส้นทางซ้อน:

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

ใช้ `channelIngressRoutes(...)` เมื่อ Plugin มีตัวอธิบายเส้นทางที่เลือกใช้ได้
หลายรายการ โดยจะกรองแขนงที่ปิดใช้งานออก ขณะที่รักษาข้อเท็จจริงของเส้นทางให้เป็นแบบทั่วไป
และเรียงลำดับตาม `precedence` ของตัวอธิบายแต่ละรายการ

เกตการกล่าวถึงเป็นเกตการเปิดใช้งาน หากไม่พบการกล่าวถึง จะคืนค่า
`admission: "skip"` เพื่อให้เคอร์เนลของรอบไม่ประมวลผลรอบที่มีไว้สังเกตการณ์เท่านั้น
ช่องทางส่วนใหญ่ควรวางการเปิดใช้งานไว้หลังเกตผู้ส่งและเกตคำสั่ง พื้นที่แชต
สาธารณะที่ต้องระงับทราฟฟิกที่ไม่ได้กล่าวถึงก่อนเกิดสัญญาณรบกวนจากรายการอนุญาตผู้ส่ง
สามารถเลือกใช้ `activation.order: "before-sender"` เมื่อปิดใช้งานการข้ามด้วย
คำสั่งข้อความ ช่องทางที่มีการเปิดใช้งานโดยนัย เช่น การตอบกลับในเธรดของบอต
สามารถส่ง `activation.allowedImplicitMentionKinds` ได้ จากนั้น
`activationAccess.shouldBypassMention` ที่ฉายผลจะแจ้งเมื่อคำสั่งหรือการเปิดใช้งาน
โดยนัยข้ามการกล่าวถึงอย่างชัดแจ้ง

## การปกปิดข้อมูล

ค่าผู้ส่งดิบและรายการอนุญาตดิบเป็นเพียงข้อมูลป้อนเข้าของตัวแก้ค่าเท่านั้น ค่าเหล่านี้
ต้องไม่ปรากฏในสถานะที่แก้ค่าแล้ว การตัดสินใจ การวินิจฉัย สแนปช็อต หรือ
ข้อเท็จจริงด้านความเข้ากันได้ ใช้รหัสเจ้าของแบบทึบ รหัสรายการ รหัสเส้นทาง และ
รหัสการวินิจฉัย

## การตรวจสอบ

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
