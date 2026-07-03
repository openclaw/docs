---
read_when:
    - การตั้งค่าหรือดีบักการควบคุม Mac ระยะไกล
summary: โฟลว์แอป macOS สำหรับควบคุม OpenClaw Gateway ระยะไกล
title: การควบคุมระยะไกล
x-i18n:
    generated_at: "2026-07-03T23:45:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

โฟลว์นี้ทำให้แอป macOS ทำหน้าที่เป็นรีโมตคอนโทรลเต็มรูปแบบสำหรับ OpenClaw Gateway ที่ทำงานอยู่บนโฮสต์อื่น (เดสก์ท็อป/เซิร์ฟเวอร์) ได้ แอปสามารถเชื่อมต่อโดยตรงกับ URL ของ Gateway ใน LAN/Tailnet ที่เชื่อถือได้ หรือจัดการ SSH tunnel เมื่อ Gateway ระยะไกลเป็นแบบ loopback-only การตรวจสอบสถานะ, การส่งต่อ Voice Wake และ Web Chat ใช้การกำหนดค่าระยะไกลเดียวกันจาก _Settings → General_

## โหมด

- **Local (this Mac)**: ทุกอย่างทำงานบนแล็ปท็อป ไม่มี SSH เกี่ยวข้อง
- **Remote over SSH (default)**: คำสั่ง OpenClaw จะถูกเรียกใช้บนโฮสต์ระยะไกล แอป Mac เปิดการเชื่อมต่อ SSH ด้วย `-o BatchMode` พร้อม identity/key ที่คุณเลือกและ local port-forward
- **Remote direct (ws/wss)**: ไม่มี SSH tunnel แอป Mac เชื่อมต่อกับ URL ของ Gateway โดยตรง (เช่น ผ่าน LAN, Tailscale, Tailscale Serve หรือ reverse proxy HTTPS สาธารณะ)

## ทรานสปอร์ตระยะไกล

โหมดระยะไกลรองรับทรานสปอร์ตสองแบบ:

- **SSH tunnel** (ค่าเริ่มต้น): ใช้ `ssh -N -L ...` เพื่อส่งต่อพอร์ต Gateway ไปยัง localhost Gateway จะเห็น IP ของ Node เป็น `127.0.0.1` เพราะ tunnel เป็น loopback
- **Direct (ws/wss)**: เชื่อมต่อไปยัง URL ของ Gateway โดยตรง Gateway จะเห็น IP ของไคลเอนต์จริง

แอปปิดใช้งาน SSH connection multiplexing และการทำงานเบื้องหลังหลังการยืนยันตัวตนสำหรับโปรเซส SSH ที่แอปเป็นเจ้าของ เพื่อให้สามารถเฝ้าติดตามและรีสตาร์ตโปรเซสที่แน่นอนได้ แม้ alias ที่เลือกจะเปิดใช้ `ControlMaster` หรือ `ForkAfterAuthentication`

การตรวจสอบ SSH host-key เข้มงวดเป็นค่าเริ่มต้น เพราะข้อมูลรับรอง Gateway เดินทางผ่าน tunnel นี้ สำหรับ SSH alias ที่มีการจัดการซึ่งคุณตั้งใจจะใช้พฤติกรรมความเชื่อถือนั้นอย่างชัดเจน ให้เลือกใช้ด้วย `openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh` หรือตั้งค่า `gateway.remote.sshHostKeyPolicy` เป็น `"openssh"` การเลือกใช้นี้จะใช้นโยบาย OpenSSH host-key ที่มีผลจริง โปรดตรวจสอบ alias และการกำหนดค่า `Host *` หรือการกำหนดค่าระบบที่ตรงกันก่อน การเปลี่ยนเป้าหมาย SSH ในแอปหรือด้วย `configure-remote` จะรีเซ็ตนโยบายเป็น `strict` เว้นแต่คุณจะเลือกใช้อีกครั้งอย่างชัดเจน

ในโหมด SSH tunnel ชื่อโฮสต์ LAN/tailnet ที่ค้นพบจะถูกบันทึกเป็น
`gateway.remote.sshTarget` แอปจะคง `gateway.remote.url` ไว้ที่ endpoint ของ tunnel
ในเครื่อง เช่น `ws://127.0.0.1:18789` เพื่อให้ CLI, Web Chat และ
บริการ local node-host ใช้ทรานสปอร์ต loopback ที่ปลอดภัยเดียวกันทั้งหมด
เมื่อการค้นพบคืนค่าทั้ง IP Tailnet แบบดิบและชื่อโฮสต์ที่เสถียร แอปจะ
ให้ความสำคัญกับชื่อ Tailscale MagicDNS หรือ LAN เพื่อให้การเชื่อมต่อระยะไกลทนต่อ
การเปลี่ยนแปลงที่อยู่ได้ดีขึ้น
หากพอร์ต tunnel ในเครื่องต่างจากพอร์ต Gateway ระยะไกล ให้ตั้งค่า
`gateway.remote.remotePort` เป็นพอร์ตบนโฮสต์ระยะไกล

ระบบอัตโนมัติของเบราว์เซอร์ในโหมดระยะไกลเป็นของ CLI node host ไม่ใช่ของ
Node ในแอป macOS แบบเนทีฟ แอปจะเริ่มบริการ node host ที่ติดตั้งไว้เมื่อ
ทำได้ หากคุณต้องการควบคุมเบราว์เซอร์จาก Mac เครื่องนั้น ให้ติดตั้ง/เริ่มด้วย
`openclaw node install ...` และ `openclaw node start` (หรือเรียกใช้
`openclaw node run ...` ใน foreground) แล้วกำหนดเป้าหมายไปยัง Node ที่รองรับ
เบราว์เซอร์นั้น

## ข้อกำหนดเบื้องต้นบนโฮสต์ระยะไกล

1. ติดตั้ง Node + pnpm และ build/install OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`)
2. ตรวจสอบให้แน่ใจว่า `openclaw` อยู่ใน PATH สำหรับ shell แบบไม่โต้ตอบ (symlink ไปยัง `/usr/local/bin` หรือ `/opt/homebrew/bin` หากจำเป็น)
3. สำหรับ SSH transport เท่านั้น: เปิด SSH ด้วย key auth เราแนะนำ IP ของ **Tailscale** เพื่อให้เข้าถึงจากนอก LAN ได้อย่างเสถียร

## การตั้งค่าแอป macOS

หากต้องการกำหนดค่าแอปล่วงหน้าโดยไม่ใช้ welcome flow:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

สำหรับ Gateway ที่เข้าถึงได้แล้วบน LAN หรือ Tailnet ที่เชื่อถือได้ ให้ข้าม SSH ทั้งหมด:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

คำสั่งนี้จะเขียนการกำหนดค่าระยะไกล ทำเครื่องหมายว่า onboarding เสร็จสมบูรณ์ และให้แอปเป็นเจ้าของ
ทรานสปอร์ตที่เลือกเมื่อเริ่มทำงาน

1. เปิด _Settings → General_
2. ใต้ **OpenClaw runs** ให้เลือก **Remote** และตั้งค่า:
   - **Transport**: **SSH tunnel** หรือ **Direct (ws/wss)**
   - **SSH target**: `user@host` (ระบุ `:port` ได้)
     - หาก Gateway อยู่ใน LAN เดียวกันและประกาศ Bonjour ให้เลือกจากรายการที่ค้นพบเพื่อเติมช่องนี้อัตโนมัติ
   - **Gateway URL** (Direct เท่านั้น): `wss://gateway.example.ts.net` (หรือ `ws://...` สำหรับ local/LAN)
   - **Identity file** (ขั้นสูง): พาธไปยัง key ของคุณ
   - **Project root** (ขั้นสูง): พาธ checkout ระยะไกลที่ใช้สำหรับคำสั่ง
   - **CLI path** (ขั้นสูง): พาธเสริมไปยัง entrypoint/binary `openclaw` ที่เรียกใช้งานได้ (เติมอัตโนมัติเมื่อมีการประกาศ)
3. กด **Test remote** หากสำเร็จแสดงว่า `openclaw status --json` ระยะไกลทำงานถูกต้อง ความล้มเหลวมักหมายถึงปัญหา PATH/CLI; exit 127 หมายถึงไม่พบ CLI บนระยะไกล
4. การตรวจสอบสถานะและ Web Chat จะทำงานผ่านทรานสปอร์ตที่เลือกโดยอัตโนมัติ

## Web Chat

- **SSH tunnel**: Web Chat เชื่อมต่อกับ Gateway ผ่านพอร์ตควบคุม WebSocket ที่ถูกส่งต่อ (ค่าเริ่มต้น 18789)
- **Direct (ws/wss)**: Web Chat เชื่อมต่อไปยัง URL ของ Gateway ที่กำหนดค่าไว้โดยตรง
- ไม่มี WebChat HTTP server แยกต่างหากอีกต่อไป

## สิทธิ์

- โฮสต์ระยะไกลต้องได้รับการอนุมัติ TCC แบบเดียวกับในเครื่อง (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications) เรียกใช้ onboarding บนเครื่องนั้นเพื่อให้สิทธิ์หนึ่งครั้ง
- Node ประกาศสถานะสิทธิ์ของตนผ่าน `node.list` / `node.describe` เพื่อให้ Agent ทราบว่ามีอะไรพร้อมใช้งาน

## หมายเหตุด้านความปลอดภัย

- ควรใช้ loopback binds บนโฮสต์ระยะไกลและเชื่อมต่อผ่าน SSH, Tailscale Serve หรือ URL โดยตรงของ Tailnet/LAN ที่เชื่อถือได้
- SSH tunneling ต้องใช้ host key ที่เชื่อถือแล้วเป็นค่าเริ่มต้น เชื่อถือ host key ก่อนเพื่อให้มีอยู่ในไฟล์ known-hosts ที่กำหนดค่าไว้ หรือเลือก `gateway.remote.sshHostKeyPolicy: "openssh"` อย่างชัดเจนสำหรับ alias ที่มีการจัดการซึ่งคุณยอมรับนโยบายความเชื่อถือของ OpenSSH
- หากคุณ bind Gateway กับอินเทอร์เฟซที่ไม่ใช่ loopback ให้บังคับใช้ Gateway auth ที่ถูกต้อง: token, password หรือ reverse proxy ที่รู้จัก identity พร้อม `gateway.auth.mode: "trusted-proxy"`
- ดู [ความปลอดภัย](/th/gateway/security) และ [Tailscale](/th/gateway/tailscale)

## โฟลว์เข้าสู่ระบบ WhatsApp (ระยะไกล)

- เรียกใช้ `openclaw channels login --verbose` **บนโฮสต์ระยะไกล** สแกน QR ด้วย WhatsApp บนโทรศัพท์ของคุณ
- เรียกใช้ login อีกครั้งบนโฮสต์นั้นหาก auth หมดอายุ Health check จะแสดงปัญหาการเชื่อมโยง

## การแก้ไขปัญหา

- **exit 127 / not found**: `openclaw` ไม่อยู่ใน PATH สำหรับ non-login shells เพิ่มลงใน `/etc/paths`, shell rc ของคุณ หรือ symlink ไปยัง `/usr/local/bin`/`/opt/homebrew/bin`
- **Health probe failed**: ตรวจสอบการเข้าถึง SSH, PATH และว่า Baileys เข้าสู่ระบบอยู่ (`openclaw status --json`)
- **Web Chat stuck**: ยืนยันว่า Gateway ทำงานบนโฮสต์ระยะไกลและพอร์ตที่ส่งต่อตรงกับพอร์ต Gateway WS; UI ต้องมีการเชื่อมต่อ WS ที่สถานะดี
- **Node IP shows 127.0.0.1**: เป็นสิ่งที่คาดไว้เมื่อใช้ SSH tunnel เปลี่ยน **Transport** เป็น **Direct (ws/wss)** หากคุณต้องการให้ Gateway เห็น IP ของไคลเอนต์จริง
- **Dashboard works but Mac capabilities are offline**: หมายความว่าการเชื่อมต่อ operator/control ของแอปมีสถานะดี แต่การเชื่อมต่อ companion node ไม่ได้เชื่อมต่อหรือไม่มี command surface เปิดส่วนอุปกรณ์ในแถบเมนูและตรวจสอบว่า Mac เป็น `paired · disconnected` หรือไม่ สำหรับ endpoint ของ Tailscale Serve แบบ `wss://*.ts.net` แอปจะตรวจพบ TLS leaf pins แบบ legacy ที่ค้างอยู่หลังการหมุนเวียนใบรับรอง ล้าง pin ที่ค้างเมื่อ macOS เชื่อถือใบรับรองใหม่ และลองใหม่โดยอัตโนมัติ หากใบรับรองไม่ได้รับความเชื่อถือจากระบบหรือโฮสต์ไม่ใช่ชื่อ Tailscale Serve ให้ตั้งค่า `gateway.remote.tlsFingerprint` เป็น fingerprint ของใบรับรองที่คาดไว้ ตรวจสอบใบรับรอง หรือเปลี่ยนเป็น **Remote over SSH**
- **Voice Wake**: trigger phrases จะถูกส่งต่อโดยอัตโนมัติในโหมดระยะไกล ไม่จำเป็นต้องมี forwarder แยกต่างหาก

## เสียงแจ้งเตือน

เลือกเสียงต่อการแจ้งเตือนจากสคริปต์ด้วย `openclaw` และ `node.invoke` เช่น:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

ไม่มี toggle "default sound" แบบ global ในแอปอีกต่อไป ผู้เรียกเลือกเสียง (หรือไม่เลือก) ต่อแต่ละคำขอ

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
