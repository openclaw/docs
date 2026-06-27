---
read_when:
    - คุณต้องการรันการตรวจสอบความปลอดภัยอย่างรวดเร็วสำหรับ config/state
    - คุณต้องการใช้คำแนะนำ "แก้ไข" ที่ปลอดภัย (สิทธิ์, ปรับค่าเริ่มต้นให้เข้มงวดยิ่งขึ้น)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw security` (ตรวจสอบและแก้ไขจุดพลาดด้านความปลอดภัยที่พบบ่อย)
title: ความปลอดภัย
x-i18n:
    generated_at: "2026-06-27T17:23:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

เครื่องมือด้านความปลอดภัย (การตรวจสอบ + การแก้ไขเพิ่มเติมตามตัวเลือก)

ที่เกี่ยวข้อง:

- คู่มือความปลอดภัย: [ความปลอดภัย](/th/gateway/security)

## การตรวจสอบ

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

`security audit` แบบปกติจะอยู่บนเส้นทางการตั้งค่า/ระบบไฟล์/อ่านอย่างเดียวแบบเย็น โดยค่าเริ่มต้นจะไม่ค้นหาตัวรวบรวมความปลอดภัยรันไทม์ของ Plugin ดังนั้นการตรวจสอบตามปกติจะไม่โหลดรันไทม์ของ Plugin ที่ติดตั้งไว้ทุกตัว ใช้ `--deep` เพื่อรวมการ probe Gateway แบบสดโดยพยายามให้ดีที่สุดและตัวรวบรวมการตรวจสอบความปลอดภัยที่ Plugin เป็นเจ้าของ; ตัวเรียกภายในที่ชัดเจนอาจเลือกใช้ตัวรวบรวมที่ Plugin เป็นเจ้าของเหล่านั้นได้เช่นกันเมื่อมีขอบเขตรันไทม์ที่เหมาะสมอยู่แล้ว

การตรวจสอบจะเตือนเมื่อผู้ส่ง DM หลายรายใช้เซสชันหลักร่วมกัน และแนะนำ **โหมด DM ที่ปลอดภัย**: `session.dmScope="per-channel-peer"` (หรือ `per-account-channel-peer` สำหรับช่องทางหลายบัญชี) สำหรับกล่องขาเข้าที่ใช้ร่วมกัน
สิ่งนี้มีไว้เพื่อเสริมความแข็งแกร่งให้กล่องขาเข้าที่ร่วมมือกัน/ใช้ร่วมกัน Gateway เดียวที่ใช้ร่วมกันโดยผู้ปฏิบัติงานที่ไม่ไว้วางใจกันหรือเป็นฝ่ายตรงข้ามกันไม่ใช่การตั้งค่าที่แนะนำ; ให้แยกขอบเขตความไว้วางใจด้วย Gateway แยกกัน (หรือผู้ใช้/โฮสต์ OS แยกกัน)
นอกจากนี้ยังส่งออก `security.trust_model.multi_user_heuristic` เมื่อการตั้งค่าบ่งชี้ว่าน่าจะมีทางเข้าจากผู้ใช้ร่วมกัน (เช่น นโยบาย DM/กลุ่มแบบเปิด, เป้าหมายกลุ่มที่ตั้งค่าไว้, หรือกฎผู้ส่งแบบไวลด์การ์ด) และเตือนว่า OpenClaw เป็นโมเดลความไว้วางใจแบบผู้ช่วยส่วนตัวโดยค่าเริ่มต้น
สำหรับการตั้งค่าผู้ใช้ร่วมกันโดยตั้งใจ คำแนะนำจากการตรวจสอบคือให้ sandbox ทุกเซสชัน จำกัดการเข้าถึงระบบไฟล์ไว้เฉพาะเวิร์กสเปซ และเก็บตัวตนหรือข้อมูลรับรองส่วนตัว/ส่วนบุคคลออกจากรันไทม์นั้น
นอกจากนี้ยังเตือนเมื่อมีการใช้โมเดลขนาดเล็ก (`<=300B`) โดยไม่มี sandboxing และเปิดใช้เครื่องมือเว็บ/เบราว์เซอร์
สำหรับทางเข้า Webhook เมื่อเริ่มต้นระบบจะบันทึกคำเตือนความปลอดภัยแบบไม่ถึงขั้นล้มเหลว และการตรวจสอบจะทำเครื่องหมายการใช้ `hooks.token` ซ้ำกับค่าการตรวจสอบสิทธิ์ shared-secret ของ Gateway ที่ยังใช้งานอยู่ รวมถึง `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` และ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` นอกจากนี้ยังเตือนเมื่อ:

- `hooks.token` สั้น
- `hooks.path="/"`
- ไม่ได้ตั้งค่า `hooks.defaultSessionKey`
- `hooks.allowedAgentIds` ไม่ถูกจำกัด
- เปิดใช้การ override `sessionKey` ของคำขอ
- เปิดใช้การ override โดยไม่มี `hooks.allowedSessionKeyPrefixes`

หากส่งการตรวจสอบสิทธิ์ด้วยรหัสผ่านของ Gateway เฉพาะตอนเริ่มต้น ให้ส่งค่าเดียวกันไปยัง `openclaw security audit --auth password --password <password>` เพื่อให้การตรวจสอบสามารถตรวจเทียบกับ `hooks.token` ได้
รัน `openclaw doctor --fix` เพื่อหมุน `hooks.token` ที่ถูกคงไว้และนำกลับมาใช้ซ้ำ จากนั้นอัปเดตผู้ส่ง hook ภายนอกให้ใช้โทเค็น hook ใหม่

นอกจากนี้ยังเตือนเมื่อมีการตั้งค่า Docker ของ sandbox ขณะที่โหมด sandbox ปิดอยู่, เมื่อ `gateway.nodes.denyCommands` ใช้รายการที่คล้ายแพตเทิร์น/ไม่รู้จักซึ่งไม่มีผล (จับคู่เฉพาะชื่อคำสั่ง node แบบตรงตัวเท่านั้น ไม่ใช่การกรองข้อความ shell), เมื่อ `gateway.nodes.allowCommands` เปิดใช้คำสั่ง node ที่อันตรายอย่างชัดเจน, เมื่อ `tools.profile="minimal"` ส่วนกลางถูก override โดยโปรไฟล์เครื่องมือของ agent, เมื่อเครื่องมือเขียน/แก้ไขถูกปิดใช้งานแต่ `exec` ยังพร้อมใช้งานโดยไม่มีขอบเขตระบบไฟล์ sandbox ที่จำกัด, เมื่อ DM หรือกลุ่มแบบเปิดเปิดเผยเครื่องมือรันไทม์/ระบบไฟล์โดยไม่มีตัวป้องกัน sandbox/เวิร์กสเปซ, และเมื่อเครื่องมือของ Plugin ที่ติดตั้งไว้อาจเข้าถึงได้ภายใต้นโยบายเครื่องมือแบบผ่อนปรน
นอกจากนี้ยังทำเครื่องหมาย `gateway.allowRealIpFallback=true` (ความเสี่ยงการปลอมแปลง header หากตั้งค่า proxy ผิด) และ `discovery.mdns.mode="full"` (การรั่วไหลของเมทาดาทาผ่านระเบียน mDNS TXT)
นอกจากนี้ยังเตือนเมื่อเบราว์เซอร์ sandbox ใช้เครือข่าย Docker `bridge` โดยไม่มี `sandbox.browser.cdpSourceRange`
นอกจากนี้ยังทำเครื่องหมายโหมดเครือข่าย Docker ของ sandbox ที่อันตราย (รวมถึง `host` และการ join namespace แบบ `container:*`)
นอกจากนี้ยังเตือนเมื่อคอนเทนเนอร์ Docker ของเบราว์เซอร์ sandbox ที่มีอยู่ขาด label hash หรือมี label hash เก่า (เช่น คอนเทนเนอร์ก่อนการ migration ที่ไม่มี `openclaw.browserConfigEpoch`) และแนะนำ `openclaw sandbox recreate --browser --all`
นอกจากนี้ยังเตือนเมื่อระเบียนการติดตั้ง Plugin/hook แบบ npm ไม่ได้ pin, ขาดเมทาดาทา integrity, หรือเบี่ยงเบนจากเวอร์ชันแพ็กเกจที่ติดตั้งอยู่ในปัจจุบัน
จะเตือนเมื่อ allowlist ของช่องทางพึ่งพาชื่อ/อีเมล/แท็กที่เปลี่ยนแปลงได้แทน ID ที่เสถียร (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ขอบเขต IRC เมื่อใช้ได้)
จะเตือนเมื่อ `gateway.auth.mode="none"` ทำให้ HTTP API ของ Gateway เข้าถึงได้โดยไม่มี shared secret (`/tools/invoke` รวมถึง endpoint `/v1/*` ใด ๆ ที่เปิดใช้)
การตั้งค่าที่ขึ้นต้นด้วย `dangerous`/`dangerously` คือ override ของผู้ปฏิบัติงานแบบ break-glass ที่ชัดเจน; การเปิดใช้งานรายการใดรายการหนึ่งไม่ใช่รายงานช่องโหว่ด้านความปลอดภัยโดยตัวมันเอง
สำหรับรายการพารามิเตอร์อันตรายทั้งหมด โปรดดูส่วน "สรุปแฟล็กที่ไม่ปลอดภัยหรืออันตราย" ใน [ความปลอดภัย](/th/gateway/security)

สามารถยอมรับ finding ที่ตั้งใจให้คงอยู่ได้ด้วย `security.audit.suppressions`
การระงับแต่ละรายการจะจับคู่กับ `checkId` แบบตรงตัว และสามารถจำกัดให้แคบลงด้วย
สตริงย่อยแบบไม่สนตัวพิมพ์ใหญ่เล็ก `titleIncludes` และ/หรือ `detailIncludes`:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

finding ที่ถูกระงับจะถูกนำออกจาก `summary` และรายการ `findings` ที่ใช้งานอยู่
เอาต์พุต JSON จะเก็บไว้ภายใต้ `suppressedFindings` เพื่อให้ตรวจสอบย้อนหลังได้
เมื่อมีการตั้งค่าการระงับ เอาต์พุตที่ใช้งานอยู่จะเก็บ finding ระดับข้อมูล
`security.audit.suppressions.active` ที่ไม่สามารถระงับได้ไว้ด้วย เพื่อให้ผู้อ่านรู้ว่าการตรวจสอบ
ถูกกรองแล้ว แฟล็กการตั้งค่าที่อันตรายจะถูกส่งออกหนึ่งแฟล็กต่อหนึ่ง finding ดังนั้น
การยอมรับแฟล็กอันตรายหนึ่งรายการจะไม่ซ่อนแฟล็กอื่นที่เปิดใช้งานและใช้
`config.insecure_or_dangerous_flags` checkId เดียวกัน
เนื่องจากการระงับสามารถซ่อนความเสี่ยงที่คงอยู่ได้ การเพิ่มหรือลบผ่าน
คำสั่ง shell ที่รันโดย agent ต้องได้รับอนุมัติ exec เว้นแต่ว่า exec กำลังรันอยู่แล้ว
ด้วย `security="full"` และ `ask="off"` สำหรับระบบอัตโนมัติภายในเครื่องที่ไว้วางใจได้

พฤติกรรม SecretRef:

- `security audit` จะแก้ค่า SecretRef ที่รองรับในโหมดอ่านอย่างเดียวสำหรับเส้นทางเป้าหมายของมัน
- หาก SecretRef ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน การตรวจสอบจะดำเนินต่อและรายงาน `secretDiagnostics` (แทนที่จะ crash)
- `--token` และ `--password` จะ override การตรวจสอบสิทธิ์ deep-probe เฉพาะสำหรับการเรียกคำสั่งครั้งนั้นเท่านั้น; จะไม่เขียนการตั้งค่าหรือ mapping ของ SecretRef ใหม่

## เอาต์พุต JSON

ใช้ `--json` สำหรับการตรวจสอบ CI/นโยบาย:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

หากใช้ `--fix` และ `--json` ร่วมกัน เอาต์พุตจะรวมทั้งการดำเนินการแก้ไขและรายงานสุดท้าย:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## สิ่งที่ `--fix` เปลี่ยน

`--fix` จะใช้การแก้ไขที่ปลอดภัยและกำหนดผลได้แน่นอน:

- เปลี่ยน `groupPolicy="open"` ที่พบบ่อยเป็น `groupPolicy="allowlist"` (รวมถึงรูปแบบบัญชีในช่องทางที่รองรับ)
- เมื่อ policy ของกลุ่ม WhatsApp เปลี่ยนเป็น `allowlist` จะเติมค่าเริ่มต้นให้ `groupAllowFrom` จาก
  ไฟล์ `allowFrom` ที่จัดเก็บไว้เมื่อรายการนั้นมีอยู่และการตั้งค่ายังไม่ได้
  กำหนด `allowFrom`
- ตั้งค่า `logging.redactSensitive` จาก `"off"` เป็น `"tools"`
- เพิ่มความเข้มงวดของสิทธิ์สำหรับ state/config และไฟล์ที่มักมีข้อมูลละเอียดอ่อน
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- เพิ่มความเข้มงวดของไฟล์ include การตั้งค่าที่อ้างอิงจาก `openclaw.json` ด้วย
- ใช้ `chmod` บนโฮสต์ POSIX และรีเซ็ต `icacls` บน Windows

`--fix` **จะไม่**:

- หมุนโทเค็น/รหัสผ่าน/API key
- ปิดใช้งานเครื่องมือ (`gateway`, `cron`, `exec`, ฯลฯ)
- เปลี่ยนตัวเลือก bind/auth/การเปิดเผยเครือข่ายของ gateway
- ลบหรือเขียน Plugin/Skills ใหม่

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [การตรวจสอบความปลอดภัย](/th/gateway/security)
