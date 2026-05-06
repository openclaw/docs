---
read_when:
    - การดีบักแท็บอินสแตนซ์
    - การตรวจสอบแถวอินสแตนซ์ที่ซ้ำหรือค้างเก่า
    - การเปลี่ยนการเชื่อมต่อ WS ของ Gateway หรือบีคอนเหตุการณ์ระบบ
summary: วิธีที่รายการสถานะการแสดงตนของ OpenClaw ถูกสร้าง ผสาน และแสดงผล
title: การแสดงสถานะ
x-i18n:
    generated_at: "2026-05-06T09:09:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab76e81fc1842c747b0a33da8cf9874e3537c5ab023450ee1a6a314453e7263
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw "presence" เป็นมุมมองแบบเบาและพยายามให้ดีที่สุดของ:

- ตัว **Gateway** เอง และ
- **ไคลเอนต์ที่เชื่อมต่อกับ Gateway** (แอป mac, WebChat, CLI ฯลฯ)

Presence ใช้เป็นหลักเพื่อแสดงแท็บ **Instances** ของแอป macOS และเพื่อ
ให้ผู้ปฏิบัติงานมองเห็นสถานะได้อย่างรวดเร็ว

## ฟิลด์ Presence (สิ่งที่แสดงขึ้นมา)

รายการ Presence เป็นอ็อบเจ็กต์ที่มีโครงสร้างพร้อมฟิลด์ เช่น:

- `instanceId` (ไม่บังคับแต่แนะนำอย่างยิ่ง): ตัวตนไคลเอนต์ที่เสถียร (โดยปกติคือ `connect.client.instanceId`)
- `host`: ชื่อโฮสต์ที่มนุษย์อ่านเข้าใจง่าย
- `ip`: ที่อยู่ IP แบบพยายามให้ดีที่สุด
- `version`: สตริงเวอร์ชันของไคลเอนต์
- `deviceFamily` / `modelIdentifier`: คำใบ้เกี่ยวกับฮาร์ดแวร์
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: "จำนวนวินาทีตั้งแต่มีอินพุตจากผู้ใช้ครั้งล่าสุด" (ถ้าทราบ)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: เวลาประทับการอัปเดตล่าสุด (มิลลิวินาทีนับตั้งแต่ epoch)

## ผู้ผลิตข้อมูล (presence มาจากที่ใด)

รายการ Presence ถูกสร้างจากหลายแหล่งและถูก **รวม** เข้าด้วยกัน

### 1) รายการ self ของ Gateway

Gateway จะตั้งค่าเริ่มต้นรายการ "self" ตอนเริ่มทำงานเสมอ เพื่อให้ UI แสดงโฮสต์ของ Gateway
แม้ก่อนที่ไคลเอนต์ใด ๆ จะเชื่อมต่อ

### 2) การเชื่อมต่อ WebSocket

ไคลเอนต์ WS ทุกตัวเริ่มด้วยคำขอ `connect` เมื่อ handshake สำเร็จ
Gateway จะ upsert รายการ Presence สำหรับการเชื่อมต่อนั้น

#### เหตุผลที่คำสั่ง CLI แบบครั้งเดียวไม่แสดงขึ้นมา

CLI มักเชื่อมต่อสำหรับคำสั่งสั้น ๆ แบบครั้งเดียว เพื่อหลีกเลี่ยงการทำให้รายการ
Instances เต็มไปด้วยรายการไม่จำเป็น `client.mode === "cli"` จึง **ไม่** ถูกเปลี่ยนเป็นรายการ Presence

### 3) beacon `system-event`

ไคลเอนต์สามารถส่ง beacon ตามรอบที่มีข้อมูลสมบูรณ์ขึ้นผ่านเมธอด `system-event` แอป mac
ใช้สิ่งนี้เพื่อรายงานชื่อโฮสต์, IP และ `lastInputSeconds`

### 4) การเชื่อมต่อของ Node (role: node)

เมื่อ node เชื่อมต่อผ่าน WebSocket ของ Gateway ด้วย `role: node` Gateway
จะ upsert รายการ Presence สำหรับ node นั้น (เป็น flow เดียวกับไคลเอนต์ WS อื่น ๆ)

## กฎการรวม + การลบรายการซ้ำ (เหตุผลที่ `instanceId` สำคัญ)

รายการ Presence ถูกเก็บไว้ในแผนที่ในหน่วยความจำชุดเดียว:

- รายการถูก key ด้วย **presence key**
- key ที่ดีที่สุดคือ `instanceId` ที่เสถียร (จาก `connect.client.instanceId`) ซึ่งคงอยู่ข้ามการรีสตาร์ต
- key ไม่สนใจตัวพิมพ์เล็กใหญ่

หากไคลเอนต์เชื่อมต่อใหม่โดยไม่มี `instanceId` ที่เสถียร อาจแสดงเป็นแถว
**ซ้ำ**

## TTL และขนาดที่จำกัด

Presence มีลักษณะชั่วคราวโดยตั้งใจ:

- **TTL:** รายการที่เก่ากว่า 5 นาทีจะถูกตัดออก
- **จำนวนรายการสูงสุด:** 200 (รายการเก่าสุดถูกลบทิ้งก่อน)

สิ่งนี้ช่วยให้รายการสดใหม่และหลีกเลี่ยงการเติบโตของหน่วยความจำแบบไม่จำกัด

## ข้อควรระวังเกี่ยวกับรีโมต/ทันเนล (IP แบบ loopback)

เมื่อไคลเอนต์เชื่อมต่อผ่าน SSH tunnel / local port forward Gateway อาจ
เห็นที่อยู่ระยะไกลเป็น `127.0.0.1` เพื่อหลีกเลี่ยงการเขียนทับ IP ที่ไคลเอนต์รายงานมาอย่างถูกต้อง
ที่อยู่ระยะไกลแบบ loopback จะถูกละเว้น

## ผู้บริโภคข้อมูล

### แท็บ Instances ของ macOS

แอป macOS แสดงผลลัพธ์ของ `system-presence` และใช้ตัวบ่งชี้สถานะขนาดเล็ก
(Active/Idle/Stale) ตามอายุของการอัปเดตล่าสุด

## เคล็ดลับการดีบัก

- หากต้องการดูรายการดิบ ให้เรียก `system-presence` กับ Gateway
- หากคุณเห็นรายการซ้ำ:
  - ยืนยันว่าไคลเอนต์ส่ง `client.instanceId` ที่เสถียรใน handshake
  - ยืนยันว่า beacon ตามรอบใช้ `instanceId` เดียวกัน
  - ตรวจสอบว่ารายการที่ได้จากการเชื่อมต่อขาด `instanceId` หรือไม่ (รายการซ้ำเป็นสิ่งที่คาดไว้)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ตัวบ่งชี้การพิมพ์" href="/th/concepts/typing-indicators" icon="ellipsis">
    เมื่อใดที่ตัวบ่งชี้การพิมพ์ถูกส่ง และวิธีปรับแต่ง
  </Card>
  <Card title="การสตรีมและการแบ่งชังก์" href="/th/concepts/streaming" icon="bars-staggered">
    การสตรีมขาออก การแบ่งชังก์ และการจัดรูปแบบแยกตามช่องทาง
  </Card>
  <Card title="สถาปัตยกรรม Gateway" href="/th/concepts/architecture" icon="diagram-project">
    คอมโพเนนต์ของ Gateway และโปรโตคอล WebSocket ที่ขับเคลื่อนการอัปเดต Presence
  </Card>
  <Card title="โปรโตคอล Gateway" href="/th/gateway/protocol" icon="plug">
    โปรโตคอลบนสายสำหรับ `connect`, `system-event` และ `system-presence`
  </Card>
</CardGroup>
