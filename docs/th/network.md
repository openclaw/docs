---
read_when:
    - คุณต้องใช้ภาพรวมสถาปัตยกรรมเครือข่าย + ความปลอดภัย
    - คุณกำลังดีบักการเข้าถึงแบบภายในเครื่องเทียบกับผ่าน tailnet หรือการจับคู่
    - คุณต้องการรายการเอกสารด้านเครือข่ายที่เป็นแหล่งอ้างอิงหลัก
summary: 'ศูนย์กลางเครือข่าย: จุดติดต่อของ Gateway, การจับคู่, การค้นหา และความปลอดภัย'
title: เครือข่าย
x-i18n:
    generated_at: "2026-05-06T09:21:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0ff6c4ee46005aeac1612ea40f1ce3d5824aa507d0842788dbf4bffbaccfcc
    source_path: network.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ฮับนี้เชื่อมโยงเอกสารหลักเกี่ยวกับวิธีที่ OpenClaw เชื่อมต่อ จับคู่ และรักษาความปลอดภัย
ให้อุปกรณ์บน localhost, LAN และ tailnet

## โมเดลหลัก

การทำงานส่วนใหญ่ไหลผ่าน Gateway (`openclaw gateway`) ซึ่งเป็นกระบวนการระยะยาวกระบวนการเดียวที่เป็นเจ้าของการเชื่อมต่อช่องทางและ control plane ของ WebSocket

- **Loopback ก่อน**: Gateway WS มีค่าเริ่มต้นเป็น `ws://127.0.0.1:18789`
  การ bind ที่ไม่ใช่ loopback ต้องมีเส้นทางการยืนยันตัวตน Gateway ที่ถูกต้อง: การยืนยันตัวตนด้วย
  โทเค็น/รหัสผ่านแบบ shared-secret หรือการติดตั้งใช้งาน
  `trusted-proxy` ที่ไม่ใช่ loopback และกำหนดค่าไว้อย่างถูกต้อง
- แนะนำให้ใช้ **Gateway หนึ่งตัวต่อโฮสต์หนึ่งเครื่อง** สำหรับการแยกส่วน ให้รัน Gateway หลายตัวพร้อมโปรไฟล์และพอร์ตที่แยกกัน ([Gateway หลายตัว](/th/gateway/multiple-gateways))
- **โฮสต์ Canvas** ให้บริการบนพอร์ตเดียวกับ Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`) และได้รับการปกป้องด้วยการยืนยันตัวตน Gateway เมื่อ bind เกินกว่า loopback
- **การเข้าถึงระยะไกล** โดยทั่วไปคือ SSH tunnel หรือ Tailscale VPN ([การเข้าถึงระยะไกล](/th/gateway/remote))

เอกสารอ้างอิงหลัก:

- [สถาปัตยกรรม Gateway](/th/concepts/architecture)
- [โปรโตคอล Gateway](/th/gateway/protocol)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [พื้นผิวเว็บ + โหมด bind](/th/web)

## การจับคู่ + ตัวตน

- [ภาพรวมการจับคู่ (DM + nodes)](/th/channels/pairing)
- [การจับคู่ node ที่ Gateway เป็นเจ้าของ](/th/gateway/pairing)
- [CLI สำหรับอุปกรณ์ (การจับคู่ + การหมุนเวียนโทเค็น)](/th/cli/devices)
- [CLI สำหรับการจับคู่ (การอนุมัติ DM)](/th/cli/pairing)

ความเชื่อถือภายในเครื่อง:

- การเชื่อมต่อ local loopback โดยตรงสามารถได้รับการอนุมัติอัตโนมัติสำหรับการจับคู่เพื่อให้
  UX บนโฮสต์เดียวกันราบรื่น
- OpenClaw ยังมีเส้นทาง self-connect แบบ backend/container-local ที่จำกัดสำหรับ
  โฟลว์ตัวช่วย shared-secret ที่เชื่อถือได้
- ไคลเอนต์ tailnet และ LAN รวมถึงการ bind tailnet บนโฮสต์เดียวกัน ยังคงต้องมี
  การอนุมัติการจับคู่อย่างชัดเจน

## การค้นหา + การขนส่ง

- [การค้นหาและการขนส่ง](/th/gateway/discovery)
- [Bonjour / mDNS](/th/gateway/bonjour)
- [การเข้าถึงระยะไกล (SSH)](/th/gateway/remote)
- [Tailscale](/th/gateway/tailscale)

## Nodes + การขนส่ง

- [ภาพรวม Nodes](/th/nodes)
- [โปรโตคอล Bridge (nodes เดิม, เชิงประวัติ)](/th/gateway/bridge-protocol)
- [คู่มือปฏิบัติการ Node: iOS](/th/platforms/ios)
- [คู่มือปฏิบัติการ Node: Android](/th/platforms/android)

## ความปลอดภัย

- [ภาพรวมความปลอดภัย](/th/gateway/security)
- [เอกสารอ้างอิงการกำหนดค่า Gateway](/th/gateway/configuration)
- [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- [Doctor](/th/gateway/doctor)

## ที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
