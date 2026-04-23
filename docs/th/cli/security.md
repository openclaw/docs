---
read_when:
    - คุณต้องการเรียกใช้การตรวจสอบความปลอดภัยอย่างรวดเร็วกับ config/state
    - คุณต้องการใช้คำแนะนำ “fix” ที่ปลอดภัย (สิทธิ์การเข้าถึง, ทำให้ค่าเริ่มต้นเข้มงวดขึ้น)
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw security` (ตรวจสอบและแก้ไขช่องโหว่ด้านความปลอดภัยที่พบบ่อย)
title: security
x-i18n:
    generated_at: "2026-04-23T10:16:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92b80468403b7d329391c40add9ae9c0e2423f5c6ff162291fa13ab91ace985d
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

เครื่องมือด้านความปลอดภัย (audit + fix แบบไม่บังคับ)

ที่เกี่ยวข้อง:

- คู่มือด้านความปลอดภัย: [Security](/th/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

การ audit จะเตือนเมื่อผู้ส่ง DM หลายรายใช้เซสชันหลักร่วมกัน และแนะนำให้ใช้ **โหมด DM ที่ปลอดภัย**: `session.dmScope="per-channel-peer"` (หรือ `per-account-channel-peer` สำหรับช่องทางแบบหลายบัญชี) สำหรับกล่องข้อความขาเข้าที่ใช้ร่วมกัน
สิ่งนี้มีไว้เพื่อเสริมความปลอดภัยของกล่องข้อความขาเข้าที่ใช้งานร่วมกัน/แบบร่วมมือกัน การใช้ Gateway เดียวร่วมกันระหว่างผู้ปฏิบัติงานที่ไม่ไว้วางใจกันหรือมีลักษณะเป็นปฏิปักษ์กันไม่ใช่รูปแบบการตั้งค่าที่แนะนำ; ควรแยกขอบเขตความไว้วางใจด้วย gateway แยกกัน (หรือแยกผู้ใช้ OS/โฮสต์)
นอกจากนี้ยังปล่อย `security.trust_model.multi_user_heuristic` เมื่อ config บ่งชี้ว่ามี ingress แบบผู้ใช้ร่วมกันที่น่าจะเกิดขึ้น (เช่น นโยบาย DM/กลุ่มแบบเปิด, เป้าหมายกลุ่มที่กำหนดค่าไว้ หรือกฎผู้ส่งแบบ wildcard) และเตือนว่าโดยค่าเริ่มต้น OpenClaw ใช้โมเดลความไว้วางใจแบบผู้ช่วยส่วนตัว
สำหรับระบบที่ตั้งใจให้มีผู้ใช้หลายคนร่วมกัน แนวทางจากการ audit คือให้ sandbox ทุกเซสชัน จำกัดการเข้าถึงไฟล์ระบบให้อยู่ในขอบเขต workspace และเก็บตัวตนหรือข้อมูลรับรองส่วนตัว/เป็นความลับออกจากรันไทม์นั้น
นอกจากนี้ยังเตือนเมื่อมีการใช้โมเดลขนาดเล็ก (`<=300B`) โดยไม่มี sandbox และเปิดใช้เครื่องมือ web/browser
สำหรับ ingress ผ่าน Webhook จะมีการเตือนเมื่อ `hooks.token` ใช้ซ้ำกับโทเค็นของ Gateway, เมื่อ `hooks.token` สั้นเกินไป, เมื่อ `hooks.path="/"`, เมื่อไม่ได้ตั้งค่า `hooks.defaultSessionKey`, เมื่อ `hooks.allowedAgentIds` ไม่ถูกจำกัด, เมื่อเปิดใช้การ override `sessionKey` ของคำขอ และเมื่อเปิดใช้ override โดยไม่มี `hooks.allowedSessionKeyPrefixes`
นอกจากนี้ยังเตือนเมื่อมีการกำหนดค่าการตั้งค่า Docker ของ sandbox ทั้งที่โหมด sandbox ปิดอยู่, เมื่อ `gateway.nodes.denyCommands` ใช้รายการแบบคล้ายแพตเทิร์น/ไม่รู้จักที่ไม่มีผลจริง (จับคู่กับชื่อคำสั่งของ node แบบตรงตัวเท่านั้น ไม่ใช่การกรองข้อความ shell), เมื่อ `gateway.nodes.allowCommands` เปิดใช้คำสั่ง node ที่อันตรายอย่างชัดเจน, เมื่อ `tools.profile="minimal"` แบบ global ถูก override โดยโปรไฟล์เครื่องมือของ agent, เมื่อกลุ่มแบบเปิดเปิดเผยเครื่องมือ runtime/filesystem โดยไม่มี sandbox/workspace guard และเมื่อเครื่องมือจาก Plugin ที่ติดตั้งไว้อาจเข้าถึงได้ภายใต้นโยบายเครื่องมือที่ผ่อนปรน
นอกจากนี้ยังแจ้งเตือน `gateway.allowRealIpFallback=true` (มีความเสี่ยงต่อการปลอมแปลง header หาก proxy กำหนดค่าผิด) และ `discovery.mdns.mode="full"` (ข้อมูลเมตาอาจรั่วไหลผ่านระเบียน mDNS TXT)
นอกจากนี้ยังเตือนเมื่อ browser ของ sandbox ใช้เครือข่าย Docker แบบ `bridge` โดยไม่มี `sandbox.browser.cdpSourceRange`
นอกจากนี้ยังแจ้งเตือนโหมดเครือข่าย Docker ของ sandbox ที่อันตราย (รวมถึง `host` และการเข้าร่วม namespace แบบ `container:*`)
นอกจากนี้ยังเตือนเมื่อ container Docker browser ของ sandbox ที่มีอยู่มี label hash ที่หายไป/ล้าสมัย (เช่น container ก่อนการ migration ที่ไม่มี `openclaw.browserConfigEpoch`) และแนะนำให้ใช้ `openclaw sandbox recreate --browser --all`
นอกจากนี้ยังเตือนเมื่อบันทึกการติดตั้ง Plugin/hook แบบอิง npm ไม่ได้ pin เวอร์ชันไว้ ไม่มีข้อมูล integrity metadata หรือมีความคลาดเคลื่อนจากเวอร์ชันแพ็กเกจที่ติดตั้งอยู่ปัจจุบัน
จะมีการเตือนเมื่อ allowlist ของช่องทางอาศัยชื่อ/อีเมล/แท็กที่เปลี่ยนแปลงได้ แทนที่จะใช้ ID แบบคงที่ (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ขอบเขต IRC ตามที่รองรับ)
จะมีการเตือนเมื่อ `gateway.auth.mode="none"` ทำให้ API HTTP ของ Gateway เข้าถึงได้โดยไม่มี shared secret (`/tools/invoke` รวมถึงปลายทาง `/v1/*` ที่เปิดใช้งานอยู่)
การตั้งค่าที่ขึ้นต้นด้วย `dangerous`/`dangerously` เป็นการ override แบบ break-glass ที่ผู้ปฏิบัติงานตั้งใจเปิดใช้โดยชัดแจ้ง; การเปิดใช้การตั้งค่าเหล่านี้เพียงอย่างเดียวไม่ถือเป็นรายงานช่องโหว่ด้านความปลอดภัย
สำหรับรายการพารามิเตอร์อันตรายทั้งหมด ดูส่วน "Insecure or dangerous flags summary" ใน [Security](/th/gateway/security)

พฤติกรรมของ SecretRef:

- `security audit` จะ resolve SecretRef ที่รองรับในโหมดอ่านอย่างเดียวสำหรับพาธเป้าหมายของมัน
- หาก SecretRef ใช้งานไม่ได้ในเส้นทางคำสั่งปัจจุบัน การ audit จะดำเนินต่อไปและรายงาน `secretDiagnostics` (แทนที่จะ crash)
- `--token` และ `--password` จะ override เฉพาะการยืนยันตัวตนสำหรับ deep-probe ของการเรียกคำสั่งครั้งนั้น; จะไม่เขียนทับ config หรือการแมป SecretRef

## เอาต์พุต JSON

ใช้ `--json` สำหรับการตรวจสอบ CI/นโยบาย:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

หากใช้ `--fix` ร่วมกับ `--json` เอาต์พุตจะมีทั้งการดำเนินการ fix และรายงานสุดท้าย:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## สิ่งที่ `--fix` เปลี่ยนแปลง

`--fix` จะใช้การแก้ไขที่ปลอดภัยและกำหนดผลลัพธ์ได้แน่นอน:

- เปลี่ยน `groupPolicy="open"` ที่พบบ่อยเป็น `groupPolicy="allowlist"` (รวมถึงตัวแปรระดับบัญชีในช่องทางที่รองรับ)
- เมื่อมีการเปลี่ยนนโยบายกลุ่มของ WhatsApp เป็น `allowlist` ระบบจะ seed ค่า `groupAllowFrom` จากไฟล์ `allowFrom` ที่เก็บไว้
  เมื่อมีรายการนั้นอยู่และ config ยังไม่ได้กำหนด
  `allowFrom`
- ตั้งค่า `logging.redactSensitive` จาก `"off"` เป็น `"tools"`
- ทำให้สิทธิ์การเข้าถึงของ state/config และไฟล์สำคัญทั่วไปเข้มงวดยิ่งขึ้น
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- รวมถึงทำให้ไฟล์ include ของ config ที่อ้างอิงจาก `openclaw.json` เข้มงวดยิ่งขึ้น
- ใช้ `chmod` บนโฮสต์แบบ POSIX และรีเซ็ตด้วย `icacls` บน Windows

สิ่งที่ `--fix` **ไม่** ทำ:

- หมุนเวียนโทเค็น/รหัสผ่าน/API key
- ปิดใช้งานเครื่องมือ (`gateway`, `cron`, `exec` เป็นต้น)
- เปลี่ยนตัวเลือกการ bind/auth/การเปิดเผยเครือข่ายของ gateway
- ลบหรือเขียนทับ Plugins/Skills
