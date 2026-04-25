---
read_when:
    - คุณกำลังอนุมัติคำขอจับคู่อุปกรณ์
    - คุณต้องหมุนเวียนหรือเพิกถอนโทเค็นอุปกรณ์
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw devices` (การจับคู่อุปกรณ์ + การหมุนเวียน/เพิกถอนโทเค็น)
title: อุปกรณ์
x-i18n:
    generated_at: "2026-04-25T13:44:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 168afa3c784565c09ebdac854acc33cb7c0cacf4eba6a1a038c88c96af3c1430
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

จัดการคำขอจับคู่อุปกรณ์และโทเค็นที่ผูกขอบเขตกับอุปกรณ์

## คำสั่ง

### `openclaw devices list`

แสดงรายการคำขอจับคู่ที่รอดำเนินการและอุปกรณ์ที่จับคู่แล้ว

```
openclaw devices list
openclaw devices list --json
```

ผลลัพธ์ของคำขอที่รอดำเนินการจะแสดงสิทธิ์การเข้าถึงที่ร้องขอไว้ถัดจากสิทธิ์การเข้าถึงที่ได้รับอนุมัติอยู่แล้วของอุปกรณ์นั้น เมื่ออุปกรณ์ถูกจับคู่อยู่แล้ว วิธีนี้ทำให้การอัปเกรด scope/role ชัดเจนขึ้น แทนที่จะดูเหมือนว่าการจับคู่หายไป

### `openclaw devices remove <deviceId>`

ลบรายการอุปกรณ์ที่จับคู่แล้วหนึ่งรายการ

เมื่อคุณยืนยันตัวตนด้วยโทเค็นของอุปกรณ์ที่จับคู่แล้ว ผู้เรียกที่ไม่ใช่แอดมินจะลบได้เฉพาะรายการอุปกรณ์ของ **ตนเอง** เท่านั้น การลบอุปกรณ์อื่นต้องใช้ `operator.admin`

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

ล้างอุปกรณ์ที่จับคู่แล้วแบบเป็นกลุ่ม

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

อนุมัติคำขอจับคู่อุปกรณ์ที่รอดำเนินการโดยใช้ `requestId` ที่ตรงกันทุกประการ หากละ `requestId` ไว้หรือส่ง `--latest` OpenClaw จะพิมพ์เฉพาะคำขอที่รอดำเนินการซึ่งถูกเลือกและออกจากโปรแกรม; ให้รันคำสั่งอนุมัติอีกครั้งพร้อม `requestId` ที่ตรงกันทุกประการหลังจากตรวจสอบรายละเอียดแล้ว

หมายเหตุ: หากอุปกรณ์ลองจับคู่อีกครั้งด้วยรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (role/scopes/public key) OpenClaw จะยกเลิกรายการที่รอดำเนินการก่อนหน้าและออก `requestId` ใหม่ รัน `openclaw devices list` ก่อนการอนุมัติทันทีเพื่อใช้ ID ปัจจุบัน

หากอุปกรณ์ถูกจับคู่อยู่แล้วและขอ scope หรือ role ที่กว้างขึ้น OpenClaw จะคงการอนุมัติเดิมไว้และสร้างคำขออัปเกรดใหม่ที่รอดำเนินการ ให้ตรวจสอบคอลัมน์ `Requested` เทียบกับ `Approved` ใน `openclaw devices list` หรือใช้ `openclaw devices approve --latest` เพื่อดูตัวอย่างการอัปเกรดที่แน่นอนก่อนอนุมัติ

หาก Gateway ถูกกำหนดค่าอย่างชัดเจนด้วย `gateway.nodes.pairing.autoApproveCidrs` คำขอ `role: node` ครั้งแรกจาก IP ไคลเอนต์ที่ตรงกันอาจได้รับการอนุมัติก่อนที่จะปรากฏในรายการนี้ นโยบายนี้ถูกปิดไว้เป็นค่าเริ่มต้น และจะไม่มีผลกับไคลเอนต์ operator/browser หรือคำขออัปเกรด

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

ปฏิเสธคำขอจับคู่อุปกรณ์ที่รอดำเนินการ

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

หมุนเวียนโทเค็นอุปกรณ์สำหรับ role ที่ระบุ (พร้อมอัปเดต scope ได้แบบไม่บังคับ)
role เป้าหมายต้องมีอยู่แล้วในสัญญาการจับคู่ที่ได้รับอนุมัติของอุปกรณ์นั้น; การหมุนเวียนไม่สามารถสร้าง role ใหม่ที่ยังไม่ได้รับอนุมัติได้
หากคุณไม่ระบุ `--scope` การเชื่อมต่อใหม่ภายหลังด้วยโทเค็นที่หมุนเวียนแล้วที่จัดเก็บไว้จะใช้ scope ที่ได้รับอนุมัติแบบแคชของโทเค็นนั้นซ้ำ หากคุณระบุค่า `--scope` อย่างชัดเจน ค่าเหล่านั้นจะกลายเป็นชุด scope ที่จัดเก็บไว้สำหรับการเชื่อมต่อใหม่ด้วยโทเค็นแคชในอนาคต
ผู้เรียกจากอุปกรณ์ที่จับคู่แล้วซึ่งไม่ใช่แอดมินสามารถหมุนเวียนได้เฉพาะโทเค็นอุปกรณ์ของ **ตนเอง** เท่านั้น
นอกจากนี้ ค่า `--scope` ที่ระบุอย่างชัดเจนทั้งหมดต้องอยู่ภายใน scope operator ของเซสชันผู้เรียกเอง; การหมุนเวียนไม่สามารถสร้างโทเค็น operator ที่กว้างกว่าสิทธิ์ที่ผู้เรียกมีอยู่แล้วได้

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

ส่งคืน payload โทเค็นใหม่ในรูปแบบ JSON

### `openclaw devices revoke --device <id> --role <role>`

เพิกถอนโทเค็นอุปกรณ์สำหรับ role ที่ระบุ

ผู้เรียกจากอุปกรณ์ที่จับคู่แล้วซึ่งไม่ใช่แอดมินสามารถเพิกถอนได้เฉพาะโทเค็นอุปกรณ์ของ **ตนเอง** เท่านั้น
การเพิกถอนโทเค็นของอุปกรณ์อื่นต้องใช้ `operator.admin`

```
openclaw devices revoke --device <deviceId> --role node
```

ส่งคืนผลลัพธ์การเพิกถอนในรูปแบบ JSON

## ตัวเลือกทั่วไป

- `--url <url>`: URL WebSocket ของ Gateway (ค่าเริ่มต้นคือ `gateway.remote.url` เมื่อมีการกำหนดค่า)
- `--token <token>`: โทเค็นของ Gateway (หากจำเป็น)
- `--password <password>`: รหัสผ่านของ Gateway (การยืนยันตัวตนด้วยรหัสผ่าน)
- `--timeout <ms>`: หมดเวลา RPC
- `--json`: เอาต์พุต JSON (แนะนำสำหรับการทำสคริปต์)

หมายเหตุ: เมื่อคุณตั้งค่า `--url` CLI จะไม่ fallback ไปใช้ข้อมูลรับรองจากคอนฟิกหรือ environment
ให้ส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลรับรองที่ระบุอย่างชัดเจนถือเป็นข้อผิดพลาด

## หมายเหตุ

- การหมุนเวียนโทเค็นจะส่งคืนโทเค็นใหม่ (ข้อมูลละเอียดอ่อน) ให้จัดการเหมือนเป็นความลับ
- คำสั่งเหล่านี้ต้องใช้ scope `operator.pairing` (หรือ `operator.admin`)
- `gateway.nodes.pairing.autoApproveCidrs` เป็นนโยบาย Gateway แบบ opt-in สำหรับการจับคู่อุปกรณ์ node ใหม่เท่านั้น; ไม่ได้เปลี่ยนอำนาจการอนุมัติของ CLI
- การหมุนเวียนโทเค็นจะอยู่ภายในชุด role ที่ได้รับอนุมัติในการจับคู่และ baseline ของ scope ที่ได้รับอนุมัติสำหรับอุปกรณ์นั้น รายการโทเค็นแคชที่หลงเหลืออยู่จะไม่ให้สิทธิ์เป้าหมายการหมุนเวียนใหม่
- สำหรับเซสชันโทเค็นของอุปกรณ์ที่จับคู่แล้ว การจัดการข้ามอุปกรณ์เป็นสิทธิ์ของแอดมินเท่านั้น:
  `remove`, `rotate` และ `revoke` ทำได้เฉพาะของตนเอง เว้นแต่ผู้เรียกจะมี
  `operator.admin`
- `devices clear` ถูกป้องกันไว้โดยเจตนาด้วย `--yes`
- หาก scope การจับคู่ไม่พร้อมใช้งานบน local loopback (และไม่มีการส่ง `--url` อย่างชัดเจน) คำสั่ง list/approve สามารถใช้ fallback การจับคู่แบบ local ได้
- `devices approve` ต้องใช้ request ID ที่ระบุอย่างชัดเจนก่อนจึงจะสร้างโทเค็นได้; การละ `requestId` หรือส่ง `--latest` จะเป็นเพียงการดูตัวอย่างคำขอที่รอดำเนินการล่าสุดเท่านั้น

## รายการตรวจสอบการกู้คืน token drift

ใช้ส่วนนี้เมื่อ Control UI หรือไคลเอนต์อื่นยังคงล้มเหลวด้วย `AUTH_TOKEN_MISMATCH` หรือ `AUTH_DEVICE_TOKEN_MISMATCH`

1. ยืนยันแหล่งที่มาของโทเค็น Gateway ปัจจุบัน:

```bash
openclaw config get gateway.auth.token
```

2. แสดงรายการอุปกรณ์ที่จับคู่แล้วและระบุ device id ที่ได้รับผลกระทบ:

```bash
openclaw devices list
```

3. หมุนเวียนโทเค็น operator สำหรับอุปกรณ์ที่ได้รับผลกระทบ:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. หากการหมุนเวียนยังไม่เพียงพอ ให้ลบการจับคู่เก่าที่ค้างอยู่และอนุมัติใหม่:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. ลองเชื่อมต่อไคลเอนต์ใหม่อีกครั้งด้วยโทเค็น/รหัสผ่านที่ใช้ร่วมกันปัจจุบัน

หมายเหตุ:

- ลำดับความสำคัญของการยืนยันตัวตนในการเชื่อมต่อใหม่ตามปกติคือ shared token/password ที่ระบุอย่างชัดเจนก่อน จากนั้นจึงเป็น `deviceToken` ที่ระบุอย่างชัดเจน แล้วจึงเป็นโทเค็นอุปกรณ์ที่จัดเก็บไว้ และสุดท้ายคือ bootstrap token
- การกู้คืน `AUTH_TOKEN_MISMATCH` แบบเชื่อถือได้ สามารถส่งทั้ง shared token และโทเค็นอุปกรณ์ที่จัดเก็บไว้พร้อมกันได้ชั่วคราวสำหรับการลองใหม่แบบมีขอบเขตเพียงครั้งเดียว

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหาการยืนยันตัวตนของแดชบอร์ด](/th/web/dashboard#if-you-see-unauthorized-1008)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#dashboard-control-ui-connectivity)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Node](/th/nodes)
