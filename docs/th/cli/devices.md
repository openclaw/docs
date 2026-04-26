---
read_when:
    - คุณกำลังอนุมัติคำขอจับคู่อุปกรณ์
    - คุณต้องหมุนเวียนหรือเพิกถอนโทเค็นของอุปกรณ์
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw devices` (การจับคู่อุปกรณ์ + การหมุนเวียน/การเพิกถอนโทเค็น)
title: อุปกรณ์
x-i18n:
    generated_at: "2026-04-26T11:26:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5746de715f9c1a46b5d0845918c1512723cfed22b711711b8c6dc6e98880f480
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

จัดการคำขอจับคู่อุปกรณ์และโทเค็นที่มีขอบเขตระดับอุปกรณ์

## คำสั่ง

### `openclaw devices list`

แสดงรายการคำขอจับคู่ที่รอดำเนินการและอุปกรณ์ที่จับคู่แล้ว

```
openclaw devices list
openclaw devices list --json
```

ผลลัพธ์ของคำขอที่รอดำเนินการจะแสดงสิทธิ์เข้าถึงที่ร้องขอไว้ถัดจากสิทธิ์เข้าถึงที่อนุมัติอยู่ในปัจจุบันของอุปกรณ์นั้น เมื่ออุปกรณ์ดังกล่าวถูกจับคู่อยู่แล้ว วิธีนี้ทำให้การอัปเกรด scope/role ชัดเจน แทนที่จะดูเหมือนว่าการจับคู่หายไป

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

อนุมัติคำขอจับคู่อุปกรณ์ที่รอดำเนินการด้วย `requestId` ที่ตรงกันทุกตัวอักษร หากละ `requestId` ไว้หรือส่ง `--latest` OpenClaw จะพิมพ์เฉพาะคำขอที่รอดำเนินการที่เลือกแล้วออกจากโปรแกรมเท่านั้น; ให้รันการอนุมัติอีกครั้งด้วย request ID ที่ตรงกันทุกตัวหลังจากตรวจสอบรายละเอียดแล้ว

หมายเหตุ: หากอุปกรณ์ลองจับคู่อีกครั้งโดยมีรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (role/scopes/public key) OpenClaw จะแทนที่รายการที่รอดำเนินการเดิมและออก `requestId` ใหม่ รัน `openclaw devices list` ทันทีก่อนอนุมัติเพื่อใช้ ID ปัจจุบัน

หากอุปกรณ์ถูกจับคู่อยู่แล้วและร้องขอ scope หรือ role ที่กว้างกว่า OpenClaw จะคงการอนุมัติเดิมไว้และสร้างคำขออัปเกรดใหม่ที่รอดำเนินการ ให้ตรวจสอบคอลัมน์ `Requested` เทียบกับ `Approved` ใน `openclaw devices list` หรือใช้ `openclaw devices approve --latest` เพื่อดูตัวอย่างการอัปเกรดที่แน่นอนก่อนอนุมัติ

หากมีการกำหนดค่า Gateway อย่างชัดเจนด้วย `gateway.nodes.pairing.autoApproveCidrs` คำขอ `role: node` ครั้งแรกจาก IP ของไคลเอนต์ที่ตรงกันอาจได้รับการอนุมัติก่อนที่จะปรากฏในรายการนี้ นโยบายนี้ปิดไว้เป็นค่าเริ่มต้น และจะไม่มีผลกับไคลเอนต์ operator/browser หรือคำขออัปเกรด

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

หมุนเวียนโทเค็นอุปกรณ์สำหรับ role ที่ระบุ (และอาจอัปเดต scopes ได้)
role เป้าหมายต้องมีอยู่แล้วในสัญญาการจับคู่ที่ได้รับอนุมัติของอุปกรณ์นั้น; การหมุนเวียนไม่สามารถสร้าง role ใหม่ที่ยังไม่ได้รับอนุมัติได้
หากคุณไม่ระบุ `--scope` การเชื่อมต่อใหม่ในภายหลังด้วยโทเค็นที่หมุนเวียนและเก็บไว้จะใช้ scopes ที่ได้รับอนุมัติซึ่งแคชไว้ของโทเค็นนั้นซ้ำ
หากคุณส่งค่า `--scope` แบบชัดเจน ค่าเหล่านั้นจะกลายเป็นชุด scope ที่ถูกเก็บไว้สำหรับการเชื่อมต่อใหม่ด้วยโทเค็นที่แคชไว้ในอนาคต
ผู้เรียกจากอุปกรณ์ที่จับคู่แล้วซึ่งไม่ใช่แอดมินจะหมุนเวียนได้เฉพาะโทเค็นอุปกรณ์ของ **ตนเอง** เท่านั้น
ชุด scope ของโทเค็นเป้าหมายต้องยังคงอยู่ภายใน operator scopes ของเซสชันผู้เรียกเอง; การหมุนเวียนไม่สามารถสร้างหรือคงโทเค็น operator ที่กว้างกว่าสิทธิ์ที่ผู้เรียกมีอยู่แล้วได้

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

ส่งคืน payload ของโทเค็นใหม่เป็น JSON

### `openclaw devices revoke --device <id> --role <role>`

เพิกถอนโทเค็นอุปกรณ์สำหรับ role ที่ระบุ

ผู้เรียกจากอุปกรณ์ที่จับคู่แล้วซึ่งไม่ใช่แอดมินจะเพิกถอนได้เฉพาะโทเค็นอุปกรณ์ของ **ตนเอง** เท่านั้น
การเพิกถอนโทเค็นของอุปกรณ์อื่นต้องใช้ `operator.admin`
ชุด scope ของโทเค็นเป้าหมายต้องสอดคล้องอยู่ภายใน operator scopes ของเซสชันผู้เรียกเองด้วย; ผู้เรียกที่มีเพียง pairing เท่านั้นไม่สามารถเพิกถอนโทเค็น operator แบบ admin/write ได้

```
openclaw devices revoke --device <deviceId> --role node
```

ส่งคืนผลการเพิกถอนเป็น JSON

## ตัวเลือกที่ใช้บ่อย

- `--url <url>`: URL WebSocket ของ Gateway (จะใช้ค่าเริ่มต้นจาก `gateway.remote.url` เมื่อมีการกำหนดค่า)
- `--token <token>`: โทเค็น Gateway (หากจำเป็น)
- `--password <password>`: รหัสผ่าน Gateway (การยืนยันตัวตนด้วยรหัสผ่าน)
- `--timeout <ms>`: หมดเวลา RPC
- `--json`: เอาต์พุต JSON (แนะนำสำหรับการเขียนสคริปต์)

หมายเหตุ: เมื่อคุณตั้งค่า `--url` CLI จะไม่ fallback ไปใช้ข้อมูลรับรองจาก config หรือ environment
ให้ส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลรับรองแบบชัดเจนถือเป็นข้อผิดพลาด

## หมายเหตุ

- การหมุนเวียนโทเค็นจะส่งคืนโทเค็นใหม่ (เป็นข้อมูลอ่อนไหว) ให้จัดการเหมือนความลับ
- คำสั่งเหล่านี้ต้องใช้ scope `operator.pairing` (หรือ `operator.admin`)
- `gateway.nodes.pairing.autoApproveCidrs` เป็นนโยบาย Gateway แบบ opt-in สำหรับการจับคู่อุปกรณ์ node ใหม่เท่านั้น; ไม่ได้เปลี่ยนอำนาจการอนุมัติของ CLI
- การหมุนเวียนและการเพิกถอนโทเค็นจะอยู่ภายในชุด role ของการจับคู่ที่ได้รับอนุมัติและ baseline ของ scope ที่ได้รับอนุมัติสำหรับอุปกรณ์นั้น รายการโทเค็นที่แคชไว้โดยพลการจะไม่ให้สิทธิ์เป็นเป้าหมายสำหรับการจัดการโทเค็น
- สำหรับเซสชันโทเค็นของอุปกรณ์ที่จับคู่แล้ว การจัดการข้ามอุปกรณ์เป็นแบบแอดมินเท่านั้น: `remove`, `rotate` และ `revoke` จะทำได้เฉพาะกับตนเอง เว้นแต่ผู้เรียกมี `operator.admin`
- การเปลี่ยนแปลงโทเค็นยังถูกจำกัดตาม scope ของผู้เรียกด้วย: เซสชัน pairing-only ไม่สามารถหมุนเวียนหรือเพิกถอนโทเค็นที่ปัจจุบันมี `operator.admin` หรือ `operator.write`
- `devices clear` ถูกป้องกันไว้โดยเจตนาด้วย `--yes`
- หาก pairing scope ใช้งานไม่ได้บน local loopback (และไม่มีการส่ง `--url` แบบชัดเจน) `list`/`approve` สามารถใช้ local pairing fallback ได้
- `devices approve` ต้องใช้ request ID แบบชัดเจนก่อนจึงจะสร้างโทเค็นได้; การละ `requestId` หรือส่ง `--latest` จะเป็นเพียงการดูตัวอย่างคำขอที่รอดำเนินการล่าสุดเท่านั้น

## รายการตรวจสอบการกู้คืน token drift

ใช้รายการนี้เมื่อ Control UI หรือไคลเอนต์อื่นยังคงล้มเหลวด้วย `AUTH_TOKEN_MISMATCH` หรือ `AUTH_DEVICE_TOKEN_MISMATCH`

1. ยืนยันแหล่งที่มาของโทเค็น gateway ปัจจุบัน:

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

4. หากการหมุนเวียนยังไม่เพียงพอ ให้ลบการจับคู่ที่ค้างและอนุมัติใหม่:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. ลองเชื่อมต่อไคลเอนต์อีกครั้งด้วย shared token/password ปัจจุบัน

หมายเหตุ:

- ลำดับความสำคัญในการยืนยันตัวตนสำหรับการเชื่อมต่อใหม่ตามปกติคือ shared token/password แบบชัดเจนก่อน จากนั้น `deviceToken` แบบชัดเจน จากนั้นโทเค็นอุปกรณ์ที่เก็บไว้ แล้วสุดท้าย bootstrap token
- การกู้คืน `AUTH_TOKEN_MISMATCH` ที่เชื่อถือได้อาจส่งทั้ง shared token และโทเค็นอุปกรณ์ที่เก็บไว้พร้อมกันชั่วคราวสำหรับการลองใหม่แบบจำกัดครั้งเดียว

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหาการยืนยันตัวตนของแดชบอร์ด](/th/web/dashboard#if-you-see-unauthorized-1008)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#dashboard-control-ui-connectivity)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Node](/th/nodes)
