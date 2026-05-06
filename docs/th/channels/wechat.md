---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ WeChat หรือ Weixin
    - คุณกำลังติดตั้งหรือแก้ไขปัญหา Plugin ช่องทาง openclaw-weixin
    - คุณต้องเข้าใจว่า Plugin ช่องทางภายนอกทำงานควบคู่กับ Gateway อย่างไร
summary: การตั้งค่าช่องทาง WeChat ผ่าน Plugin ภายนอก openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-05-06T09:04:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 803557a4fc92056c63053a3388100a451b2d85d4e892877707b3c2e3a677c0b0
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw เชื่อมต่อกับ WeChat ผ่าน Plugin ช่องทางภายนอก `@tencent-weixin/openclaw-weixin` ของ Tencent

สถานะ: Plugin ภายนอก รองรับแชทโดยตรงและสื่อ เมทาดาทาความสามารถของ Plugin ปัจจุบันไม่ได้ประกาศรองรับแชทกลุ่ม

## การตั้งชื่อ

- **WeChat** คือชื่อที่แสดงต่อผู้ใช้ในเอกสารเหล่านี้
- **Weixin** คือชื่อที่ใช้โดยแพ็กเกจของ Tencent และโดยรหัส Plugin
- `openclaw-weixin` คือรหัสช่องทางของ OpenClaw
- `@tencent-weixin/openclaw-weixin` คือแพ็กเกจ npm

ใช้ `openclaw-weixin` ในคำสั่ง CLI และพาธ config

## วิธีการทำงาน

โค้ดของ WeChat ไม่ได้อยู่ใน repo หลักของ OpenClaw OpenClaw มีสัญญา Plugin ช่องทางแบบทั่วไป และ Plugin ภายนอกมี runtime เฉพาะของ WeChat:

1. `openclaw plugins install` ติดตั้ง `@tencent-weixin/openclaw-weixin`
2. Gateway ค้นพบ manifest ของ Plugin และโหลด entrypoint ของ Plugin
3. Plugin ลงทะเบียนรหัสช่องทาง `openclaw-weixin`
4. `openclaw channels login --channel openclaw-weixin` เริ่มการเข้าสู่ระบบด้วย QR
5. Plugin จัดเก็บข้อมูลรับรองบัญชีไว้ใต้ไดเรกทอรีสถานะของ OpenClaw
6. เมื่อ Gateway เริ่มทำงาน Plugin จะเริ่มตัวตรวจสอบ Weixin สำหรับแต่ละบัญชีที่กำหนดค่าไว้
7. ข้อความ WeChat ขาเข้าจะถูกปรับให้อยู่ในรูปแบบมาตรฐานผ่านสัญญาช่องทาง ถูกส่งต่อไปยัง agent ของ OpenClaw ที่เลือก และส่งกลับผ่านพาธขาออกของ Plugin

การแยกส่วนนี้สำคัญ: core ของ OpenClaw ควรไม่ผูกกับช่องทางใดช่องทางหนึ่ง การเข้าสู่ระบบ WeChat, การเรียก Tencent iLink API, การอัปโหลด/ดาวน์โหลดสื่อ, โทเค็นบริบท และการตรวจสอบบัญชีเป็นความรับผิดชอบของ Plugin ภายนอก

## การติดตั้ง

ติดตั้งแบบเร็ว:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

ติดตั้งด้วยตนเอง:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

รีสตาร์ท Gateway หลังติดตั้ง:

```bash
openclaw gateway restart
```

## การเข้าสู่ระบบ

รันการเข้าสู่ระบบด้วย QR บนเครื่องเดียวกับที่รัน Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

สแกน QR code ด้วย WeChat บนโทรศัพท์ของคุณและยืนยันการเข้าสู่ระบบ Plugin จะบันทึกโทเค็นบัญชีไว้ในเครื่องหลังจากสแกนสำเร็จ

หากต้องการเพิ่มบัญชี WeChat อีกบัญชี ให้รันคำสั่งเข้าสู่ระบบเดิมอีกครั้ง สำหรับหลายบัญชี ให้แยกเซสชันข้อความโดยตรงตามบัญชี ช่องทาง และผู้ส่ง:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## การควบคุมการเข้าถึง

ข้อความโดยตรงใช้โมเดลการจับคู่และ allowlist ปกติของ OpenClaw สำหรับ Plugin ช่องทาง

อนุมัติผู้ส่งใหม่:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

สำหรับโมเดลการควบคุมการเข้าถึงฉบับเต็ม ดู [การจับคู่](/th/channels/pairing)

## ความเข้ากันได้

Plugin ตรวจสอบเวอร์ชัน OpenClaw ของโฮสต์เมื่อเริ่มทำงาน

| สาย Plugin | เวอร์ชัน OpenClaw       | แท็ก npm  |
| ----------- | ----------------------- | -------- |
| `2.x`       | `>=2026.3.22`           | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22` | `legacy` |

หาก Plugin รายงานว่าเวอร์ชัน OpenClaw ของคุณเก่าเกินไป ให้อัปเดต OpenClaw หรือติดตั้งสาย Plugin legacy:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## โปรเซส sidecar

Plugin WeChat สามารถรันงานตัวช่วยข้าง Gateway ขณะตรวจสอบ Tencent iLink API ได้ ใน issue #68451 พาธตัวช่วยนั้นเปิดเผยบั๊กในการล้างข้อมูล Gateway ที่ค้างแบบทั่วไปของ OpenClaw: โปรเซสลูกอาจพยายามล้างโปรเซส Gateway แม่ ทำให้เกิดลูปการรีสตาร์ทภายใต้ตัวจัดการโปรเซส เช่น systemd

การล้างข้อมูลเมื่อเริ่มต้นของ OpenClaw ปัจจุบันไม่รวมโปรเซสปัจจุบันและบรรพบุรุษของโปรเซสนั้น ดังนั้นตัวช่วยของช่องทางต้องไม่ฆ่า Gateway ที่เริ่มมันขึ้นมา การแก้ไขนี้เป็นแบบทั่วไป ไม่ใช่พาธเฉพาะของ WeChat ใน core

## การแก้ไขปัญหา

ตรวจสอบการติดตั้งและสถานะ:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

หากช่องทางแสดงว่าติดตั้งแล้วแต่ไม่เชื่อมต่อ ให้ยืนยันว่าเปิดใช้ Plugin แล้วและรีสตาร์ท:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

หาก Gateway รีสตาร์ทซ้ำหลังเปิดใช้ WeChat ให้อัปเดตทั้ง OpenClaw และ Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

หากการเริ่มต้นรายงานว่าแพ็กเกจ Plugin ที่ติดตั้ง `requires compiled runtime
output for TypeScript entry` แพ็กเกจ npm ถูกเผยแพร่โดยไม่มีไฟล์ runtime JavaScript ที่คอมไพล์แล้วซึ่ง OpenClaw ต้องใช้ ให้อัปเดต/ติดตั้งใหม่หลังจากผู้เผยแพร่ Plugin ออกแพ็กเกจที่แก้ไขแล้ว หรือปิดใช้/ถอนการติดตั้ง Plugin ชั่วคราว

ปิดใช้ชั่วคราว:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## เอกสารที่เกี่ยวข้อง

- ภาพรวมช่องทาง: [ช่องทางแชท](/th/channels)
- การจับคู่: [การจับคู่](/th/channels/pairing)
- การกำหนดเส้นทางช่องทาง: [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- สถาปัตยกรรม Plugin: [สถาปัตยกรรม Plugin](/th/plugins/architecture)
- SDK สำหรับ Plugin ช่องทาง: [SDK สำหรับ Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
- แพ็กเกจภายนอก: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
