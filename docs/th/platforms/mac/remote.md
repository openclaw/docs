---
read_when:
    - การตั้งค่าหรือแก้ไขข้อบกพร่องการควบคุม mac ระยะไกล
summary: โฟลว์ของแอป macOS สำหรับควบคุม OpenClaw Gateway ระยะไกล
title: การควบคุมระยะไกล
x-i18n:
    generated_at: "2026-06-27T17:49:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3634785f797af55f7dc6d217e0116313e8ef7d314c503275fbc66b54eb29a69
    source_path: platforms/mac/remote.md
    workflow: 16
---

โฟลว์นี้ทำให้แอป macOS ทำหน้าที่เป็นรีโมตคอนโทรลเต็มรูปแบบสำหรับ OpenClaw Gateway ที่รันอยู่บนโฮสต์อื่น (เดสก์ท็อป/เซิร์ฟเวอร์) ได้ แอปสามารถเชื่อมต่อโดยตรงกับ URL ของ Gateway บน LAN/Tailnet ที่เชื่อถือได้ หรือจัดการ SSH tunnel เมื่อ Gateway ระยะไกลเป็นแบบ loopback-only การตรวจสุขภาพ การส่งต่อ Voice Wake และ Web Chat ใช้การกำหนดค่าระยะไกลเดียวกันจาก _การตั้งค่า → ทั่วไป_

## โหมด

- **ภายในเครื่อง (Mac เครื่องนี้)**: ทุกอย่างรันบนแล็ปท็อป ไม่มี SSH เกี่ยวข้อง
- **ระยะไกลผ่าน SSH (ค่าเริ่มต้น)**: คำสั่ง OpenClaw จะถูกรันบนโฮสต์ระยะไกล แอป Mac เปิดการเชื่อมต่อ SSH ด้วย `-o BatchMode` พร้อม identity/key ที่คุณเลือกและ local port-forward
- **ระยะไกลโดยตรง (ws/wss)**: ไม่มี SSH tunnel แอป Mac เชื่อมต่อกับ URL ของ Gateway โดยตรง (เช่น ผ่าน LAN, Tailscale, Tailscale Serve หรือพร็อกซีย้อนกลับ HTTPS สาธารณะ)

## การขนส่งระยะไกล

โหมดระยะไกลรองรับการขนส่งสองแบบ:

- **SSH tunnel** (ค่าเริ่มต้น): ใช้ `ssh -N -L ...` เพื่อส่งต่อพอร์ต Gateway ไปยัง localhost Gateway จะเห็น IP ของ Node เป็น `127.0.0.1` เพราะ tunnel เป็นแบบ loopback
- **โดยตรง (ws/wss)**: เชื่อมต่อไปยัง URL ของ Gateway โดยตรง Gateway จะเห็น IP จริงของไคลเอนต์

ในโหมด SSH tunnel ชื่อโฮสต์ LAN/tailnet ที่ค้นพบจะถูกบันทึกเป็น
`gateway.remote.sshTarget` แอปจะเก็บ `gateway.remote.url` ไว้ที่ปลายทาง tunnel
ภายในเครื่อง เช่น `ws://127.0.0.1:18789` เพื่อให้ CLI, Web Chat และ
บริการ Node-host ภายในเครื่องทั้งหมดใช้การขนส่ง loopback ที่ปลอดภัยเดียวกัน
หากพอร์ต tunnel ภายในเครื่องต่างจากพอร์ต Gateway ระยะไกล ให้ตั้งค่า
`gateway.remote.remotePort` เป็นพอร์ตบนโฮสต์ระยะไกล

การทำงานอัตโนมัติของเบราว์เซอร์ในโหมดระยะไกลเป็นหน้าที่ของ CLI Node host ไม่ใช่
Node ของแอป macOS แบบเนทีฟ แอปจะเริ่มบริการ Node host ที่ติดตั้งไว้เมื่อ
ทำได้ หากคุณต้องการควบคุมเบราว์เซอร์จาก Mac เครื่องนั้น ให้ติดตั้ง/เริ่มด้วย
`openclaw node install ...` และ `openclaw node start` (หรือรัน
`openclaw node run ...` ใน foreground) จากนั้นกำหนดเป้าหมายไปยัง
Node ที่รองรับเบราว์เซอร์นั้น

## ข้อกำหนดเบื้องต้นบนโฮสต์ระยะไกล

1. ติดตั้ง Node + pnpm และบิลด์/ติดตั้ง OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`)
2. ตรวจสอบให้แน่ใจว่า `openclaw` อยู่บน PATH สำหรับ shell แบบ non-interactive (สร้าง symlink ไปที่ `/usr/local/bin` หรือ `/opt/homebrew/bin` หากจำเป็น)
3. สำหรับการขนส่ง SSH เท่านั้น: เปิด SSH พร้อม key auth เราแนะนำ IP ของ **Tailscale** เพื่อให้เข้าถึงได้นิ่งนอก LAN

## การตั้งค่าแอป macOS

หากต้องการกำหนดค่าแอปล่วงหน้าโดยไม่ผ่านโฟลว์ต้อนรับ:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

สำหรับ Gateway ที่เข้าถึงได้อยู่แล้วบน LAN หรือ Tailnet ที่เชื่อถือได้ ให้ข้าม SSH ทั้งหมด:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

คำสั่งนี้จะเขียนการกำหนดค่าระยะไกล ทำเครื่องหมายว่า onboarding เสร็จแล้ว และให้แอปเป็นผู้ควบคุม
การขนส่งที่เลือกเมื่อเริ่มต้น

1. เปิด _การตั้งค่า → ทั่วไป_
2. ใต้ **OpenClaw runs** เลือก **Remote** และตั้งค่า:
   - **Transport**: **SSH tunnel** หรือ **Direct (ws/wss)**
   - **SSH target**: `user@host` (ใส่ `:port` ได้)
     - หาก Gateway อยู่บน LAN เดียวกันและประกาศ Bonjour ให้เลือกจากรายการที่ค้นพบเพื่อเติมฟิลด์นี้อัตโนมัติ
   - **Gateway URL** (เฉพาะ Direct): `wss://gateway.example.ts.net` (หรือ `ws://...` สำหรับภายในเครื่อง/LAN)
   - **Identity file** (ขั้นสูง): พาธไปยัง key ของคุณ
   - **Project root** (ขั้นสูง): พาธ checkout ระยะไกลที่ใช้สำหรับคำสั่ง
   - **CLI path** (ขั้นสูง): พาธเสริมไปยัง entrypoint/binary `openclaw` ที่รันได้ (เติมอัตโนมัติเมื่อมีการประกาศ)
3. กด **Test remote** ความสำเร็จหมายความว่า `openclaw status --json` ระยะไกลรันได้ถูกต้อง ความล้มเหลวมักหมายถึงปัญหา PATH/CLI; exit 127 หมายความว่าไม่พบ CLI บนเครื่องระยะไกล
4. การตรวจสุขภาพและ Web Chat จะรันผ่านการขนส่งที่เลือกโดยอัตโนมัติ

## Web Chat

- **SSH tunnel**: Web Chat เชื่อมต่อกับ Gateway ผ่านพอร์ตควบคุม WebSocket ที่ถูกส่งต่อ (ค่าเริ่มต้น 18789)
- **Direct (ws/wss)**: Web Chat เชื่อมต่อไปยัง URL ของ Gateway ที่กำหนดค่าไว้โดยตรง
- ไม่มีเซิร์ฟเวอร์ HTTP แยกสำหรับ WebChat อีกต่อไป

## สิทธิ์

- โฮสต์ระยะไกลต้องมีการอนุมัติ TCC เหมือนกับเครื่องภายใน (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications) รัน onboarding บนเครื่องนั้นเพื่ออนุญาตเพียงครั้งเดียว
- Node ประกาศสถานะสิทธิ์ของตัวเองผ่าน `node.list` / `node.describe` เพื่อให้ agent รู้ว่ามีอะไรพร้อมใช้งาน

## หมายเหตุด้านความปลอดภัย

- แนะนำให้ bind แบบ loopback บนโฮสต์ระยะไกล และเชื่อมต่อผ่าน SSH, Tailscale Serve หรือ URL โดยตรงของ Tailnet/LAN ที่เชื่อถือได้
- SSH tunneling ใช้การตรวจสอบ host-key แบบเข้มงวด ให้เชื่อถือ host key ก่อนเพื่อให้มีอยู่ใน `~/.ssh/known_hosts`
- หากคุณ bind Gateway กับอินเทอร์เฟซที่ไม่ใช่ loopback ต้องกำหนดให้ใช้ Gateway auth ที่ถูกต้อง: token, password หรือพร็อกซีย้อนกลับที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"`
- ดู [ความปลอดภัย](/th/gateway/security) และ [Tailscale](/th/gateway/tailscale)

## โฟลว์การเข้าสู่ระบบ WhatsApp (ระยะไกล)

- รัน `openclaw channels login --verbose` **บนโฮสต์ระยะไกล** สแกน QR ด้วย WhatsApp บนโทรศัพท์ของคุณ
- รัน login ซ้ำบนโฮสต์นั้นหาก auth หมดอายุ การตรวจสุขภาพจะแสดงปัญหาการเชื่อมโยง

## การแก้ไขปัญหา

- **exit 127 / not found**: `openclaw` ไม่อยู่บน PATH สำหรับ shell แบบ non-login เพิ่มลงใน `/etc/paths`, shell rc ของคุณ หรือสร้าง symlink ไปที่ `/usr/local/bin`/`/opt/homebrew/bin`
- **Health probe failed**: ตรวจสอบการเข้าถึง SSH, PATH และว่า Baileys เข้าสู่ระบบแล้ว (`openclaw status --json`)
- **Web Chat stuck**: ยืนยันว่า Gateway กำลังรันบนโฮสต์ระยะไกล และพอร์ตที่ส่งต่อตรงกับพอร์ต WS ของ Gateway; UI ต้องมีการเชื่อมต่อ WS ที่สมบูรณ์
- **Node IP shows 127.0.0.1**: เป็นไปตามคาดเมื่อใช้ SSH tunnel เปลี่ยน **Transport** เป็น **Direct (ws/wss)** หากคุณต้องการให้ Gateway เห็น IP จริงของไคลเอนต์
- **Dashboard works but Mac capabilities are offline**: หมายความว่าการเชื่อมต่อ operator/control ของแอปสมบูรณ์ แต่การเชื่อมต่อ companion Node ไม่ได้เชื่อมต่อหรือไม่มี command surface เปิดส่วนอุปกรณ์ในแถบเมนูและตรวจสอบว่า Mac เป็น `paired · disconnected` หรือไม่ สำหรับ endpoint ของ Tailscale Serve แบบ `wss://*.ts.net` แอปจะตรวจพบ TLS leaf pin แบบ legacy ที่ค้างหลังการหมุนเวียนใบรับรอง ล้าง pin ที่ค้างเมื่อ macOS เชื่อถือใบรับรองใหม่ และลองใหม่โดยอัตโนมัติ หากใบรับรองไม่ได้รับความเชื่อถือจากระบบหรือโฮสต์ไม่ใช่ชื่อ Tailscale Serve ให้ตั้งค่า `gateway.remote.tlsFingerprint` เป็น fingerprint ของใบรับรองที่คาดไว้ ตรวจสอบใบรับรอง หรือเปลี่ยนเป็น **Remote over SSH**
- **Voice Wake**: trigger phrase จะถูกส่งต่อโดยอัตโนมัติในโหมดระยะไกล ไม่ต้องมี forwarder แยกต่างหาก

## เสียงการแจ้งเตือน

เลือกเสียงต่อการแจ้งเตือนจากสคริปต์ด้วย `openclaw` และ `node.invoke` เช่น:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

ไม่มี toggle "default sound" แบบทั่วทั้งแอปอีกต่อไป ผู้เรียกเลือกเสียง (หรือไม่เลือกเสียง) ต่อคำขอ

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
