---
read_when:
    - การสร้างหรือย้าย Plugin ช่องทางการรับส่งข้อความ
    - การเปลี่ยนรายการอนุญาตของ DM หรือกลุ่ม เกตเส้นทาง การยืนยันสิทธิ์คำสั่ง การยืนยันสิทธิ์เหตุการณ์ หรือการเปิดใช้งานด้วยการกล่าวถึง
    - การตรวจสอบการปกปิดข้อมูลขาเข้าของช่องทางหรือขอบเขตความเข้ากันได้ของ SDK
sidebarTitle: Channel Ingress
summary: API ขาเข้าของช่องทางแบบทดลองสำหรับการอนุญาตข้อความขาเข้า
title: API ขาเข้าของช่องทาง
x-i18n:
    generated_at: "2026-07-16T19:35:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3339af82a5dc3572d581f13960286f8b9ac933e7f491e8c4e0daba093caccc73
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

ขาเข้าของช่องทางเป็นขอบเขตการควบคุมการเข้าถึงเชิงทดลองสำหรับเหตุการณ์ขาเข้า
ของช่องทาง Plugin เป็นเจ้าของข้อเท็จจริงของแพลตฟอร์มและผลข้างเคียง ส่วนแกนหลักเป็นเจ้าของ
นโยบายทั่วไป ได้แก่ รายการอนุญาตของ DM/กลุ่ม, รายการ DM ในที่เก็บการจับคู่, เกตเส้นทาง,
เกตคำสั่ง, การอนุญาตเหตุการณ์, การเปิดใช้งานด้วยการกล่าวถึง, การวินิจฉัยที่ปกปิดข้อมูล และ
การรับเข้า

ใช้ `openclaw/plugin-sdk/channel-ingress-runtime` สำหรับเส้นทางการรับ

## ตัวแก้ไขขณะรันไทม์

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
ตัวแก้ไขจะหาอนุพันธ์ข้อมูลเหล่านี้จากรายการอนุญาตดิบ, คอลแบ็กของที่เก็บ, ตัวอธิบาย
เส้นทาง, กลุ่มการเข้าถึง, นโยบาย และชนิดการสนทนา

## ผลลัพธ์

Plugin ที่รวมมาในชุดควรใช้โปรเจกชันสมัยใหม่โดยตรง:

| ฟิลด์              | ความหมาย                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | การตัดสินใจของเกตตามลำดับและการรับเข้า                                |
| `senderAccess`     | เฉพาะการอนุญาตผู้ส่ง/การสนทนา                             |
| `routeAccess`      | โปรเจกชันเส้นทางและผู้ส่งของเส้นทาง                                  |
| `commandAccess`    | การอนุญาตคำสั่ง; `requested: false` เมื่อไม่มีการเรียกใช้เกตคำสั่ง |
| `activationAccess` | ผลลัพธ์การกล่าวถึง/การเปิดใช้งาน                                          |

การอนุญาตเหตุการณ์ยังคงอยู่ใน `ingress.graph` ตามลำดับและ
`ingress.reasonCode` ที่ใช้ตัดสิน โดยไม่มีการส่งออกโปรเจกชันเหตุการณ์แยกต่างหาก

ตัวช่วย SDK ของบุคคลที่สามที่เลิกใช้แล้วอาจสร้างโครงสร้างแบบเก่าขึ้นใหม่ภายใน ตัวรับ
ที่รวมมาในชุดใหม่ไม่ควรแปลงผลลัพธ์สมัยใหม่กลับเป็น DTO ภายในเครื่อง

## กลุ่มการเข้าถึง

รายการ `accessGroup:<name>` ยังคงถูกปกปิดข้อมูล แกนหลักจะแก้ไขกลุ่ม
`message.senders` แบบคงที่ด้วยตัวเอง และเรียก `resolveAccessGroupMembership` เฉพาะ
สำหรับกลุ่มแบบไดนามิกที่ต้องค้นหาจากแพลตฟอร์ม กลุ่มที่ไม่มี ไม่รองรับ หรือล้มเหลว
จะปฏิเสธโดยค่าเริ่มต้น

## โหมดเหตุการณ์

| `authMode`       | ความหมาย                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | เกตผู้ส่งขาเข้าปกติ                      |
| `command`        | เกตคำสั่งสำหรับคอลแบ็กหรือปุ่มที่จำกัดขอบเขต    |
| `origin-subject` | ผู้ดำเนินการต้องตรงกับหัวเรื่องของข้อความต้นฉบับ    |
| `route-only`     | เฉพาะเกตเส้นทางสำหรับเหตุการณ์ที่เชื่อถือได้และจำกัดขอบเขตตามเส้นทาง |
| `none`           | เหตุการณ์ภายในที่ Plugin เป็นเจ้าของจะข้ามการอนุญาตร่วม  |

ใช้ `mayPair: false` สำหรับรีแอ็กชัน, ปุ่ม, คอลแบ็ก และคำสั่งเนทีฟ

## เส้นทางและการเปิดใช้งาน

ใช้ตัวอธิบายเส้นทางสำหรับนโยบายห้อง, หัวข้อ, กิลด์, เธรด หรือเส้นทางแบบซ้อน:

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

ใช้ `channelIngressRoutes(...)` เมื่อ Plugin มีตัวอธิบายเส้นทางที่เลือกใช้ได้หลายรายการ
โดยจะกรองแขนงที่ปิดใช้งานออก ขณะยังคงให้ข้อเท็จจริงของเส้นทางเป็นแบบทั่วไป
และเรียงตาม `precedence` ของแต่ละตัวอธิบาย

การคัดกรองการกล่าวถึงเป็นเกตการเปิดใช้งาน การไม่พบการกล่าวถึงจะส่งคืน
`admission: "skip"` เพื่อไม่ให้เคอร์เนลของเทิร์นประมวลผลเทิร์นแบบสังเกตการณ์เท่านั้น
ช่องทางส่วนใหญ่ควรวางการเปิดใช้งานไว้หลังเกตผู้ส่งและเกตคำสั่ง พื้นที่แชทสาธารณะ
ที่ต้องลดการรับส่งข้อมูลซึ่งไม่มีการกล่าวถึงก่อนเกิดสัญญาณรบกวนจากรายการอนุญาตผู้ส่ง
สามารถเลือกใช้ `activation.order: "before-sender"` เมื่อปิดใช้งานการข้ามด้วยคำสั่งข้อความ
ช่องทางที่มีการเปิดใช้งานโดยปริยาย เช่น การตอบกลับในเธรดของบอต
สามารถส่ง `activation.allowedImplicitMentionKinds`; จากนั้น `activationAccess.shouldBypassMention`
ที่ฉายออกมาจะรายงานเมื่อคำสั่งหรือการเปิดใช้งานโดยปริยายข้ามข้อกำหนดการกล่าวถึงอย่างชัดแจ้ง

## การปกปิดข้อมูล

ค่าผู้ส่งดิบและรายการอนุญาตดิบเป็นเพียงอินพุตของตัวแก้ไขเท่านั้น ค่าเหล่านี้
ต้องไม่ปรากฏในสถานะที่แก้ไขแล้ว, การตัดสินใจ, การวินิจฉัย, สแนปช็อต หรือ
ข้อเท็จจริงด้านความเข้ากันได้ ใช้รหัสหัวเรื่องแบบทึบ, รหัสรายการ, รหัสเส้นทาง และ
รหัสการวินิจฉัย

## การตรวจสอบ

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
