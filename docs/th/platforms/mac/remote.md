---
read_when:
    - การตั้งค่าหรือการดีบักการควบคุม mac ระยะไกล
summary: โฟลว์แอป macOS สำหรับควบคุม OpenClaw gateway ระยะไกลผ่าน SSH
title: การควบคุมระยะไกล
x-i18n:
    generated_at: "2026-04-26T11:35:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4de4980fe378fc9b685cf7732d21a80c640088191308b8ef1d3df9f468cb5be2
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw ระยะไกล (macOS ⇄ โฮสต์ระยะไกล)

โฟลว์นี้ช่วยให้แอป macOS ทำหน้าที่เป็นรีโมตคอนโทรลเต็มรูปแบบสำหรับ OpenClaw gateway ที่ทำงานอยู่บนโฮสต์อื่น (เดสก์ท็อป/เซิร์ฟเวอร์) โดยเป็นฟีเจอร์ **Remote over SSH** (การรันระยะไกล) ของแอป ฟีเจอร์ทั้งหมด—การตรวจสอบสุขภาพระบบ การส่งต่อ Voice Wake และ Web Chat—จะใช้การตั้งค่า SSH ระยะไกลชุดเดียวกันจาก _Settings → General_

## โหมด

- **Local (Mac เครื่องนี้)**: ทุกอย่างทำงานบนแล็ปท็อป ไม่มี SSH เข้ามาเกี่ยวข้อง
- **Remote over SSH (ค่าเริ่มต้น)**: คำสั่ง OpenClaw จะถูกรันบนโฮสต์ระยะไกล แอป mac จะเปิดการเชื่อมต่อ SSH ด้วย `-o BatchMode` พร้อม identity/key ที่คุณเลือกและ local port-forward
- **Remote direct (ws/wss)**: ไม่มี SSH tunnel แอป mac จะเชื่อมต่อกับ URL ของ gateway โดยตรง (เช่น ผ่าน Tailscale Serve หรือ public HTTPS reverse proxy)

## การขนส่งระยะไกล

โหมดระยะไกลรองรับการขนส่งสองแบบ:

- **SSH tunnel** (ค่าเริ่มต้น): ใช้ `ssh -N -L ...` เพื่อ forward พอร์ตของ gateway มายัง localhost Gateway จะเห็น IP ของ node เป็น `127.0.0.1` เพราะ tunnel เป็นแบบ loopback
- **Direct (ws/wss)**: เชื่อมต่อไปยัง URL ของ gateway โดยตรง Gateway จะเห็น IP จริงของไคลเอนต์

ในโหมด SSH tunnel ชื่อโฮสต์ LAN/tailnet ที่ค้นพบจะถูกบันทึกเป็น
`gateway.remote.sshTarget` แอปจะเก็บ `gateway.remote.url` ไว้ที่
ปลายทาง tunnel ในเครื่อง เช่น `ws://127.0.0.1:18789` เพื่อให้ CLI, Web Chat และ
บริการ node-host ในเครื่องใช้การขนส่ง loopback ที่ปลอดภัยแบบเดียวกัน

งานอัตโนมัติของเบราว์เซอร์ในโหมดระยะไกลเป็นของ CLI node host ไม่ใช่ node ของแอป macOS แบบ native แอปจะเริ่มบริการ node host ที่ติดตั้งไว้เมื่อทำได้; หากคุณต้องการควบคุมเบราว์เซอร์จาก Mac เครื่องนั้น ให้ติดตั้ง/เริ่มด้วย `openclaw node install ...` และ `openclaw node start` (หรือรัน
`openclaw node run ...` แบบ foreground) แล้วกำหนดเป้าหมายไปยัง node ที่รองรับเบราว์เซอร์นั้น

## ข้อกำหนดเบื้องต้นบนโฮสต์ระยะไกล

1. ติดตั้ง Node + pnpm และ build/install OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`)
2. ตรวจสอบให้แน่ใจว่า `openclaw` อยู่บน PATH สำหรับเชลล์แบบ non-interactive (ทำ symlink ไปที่ `/usr/local/bin` หรือ `/opt/homebrew/bin` หากจำเป็น)
3. เปิดใช้ SSH พร้อม key auth เราแนะนำให้ใช้ IP ของ **Tailscale** เพื่อให้เข้าถึงได้เสถียรเมื่อนอก LAN

## การตั้งค่าแอป macOS

1. เปิด _Settings → General_
2. ภายใต้ **OpenClaw runs** ให้เลือก **Remote over SSH** และตั้งค่า:
   - **Transport**: **SSH tunnel** หรือ **Direct (ws/wss)**
   - **SSH target**: `user@host` (เลือก `:port` ได้)
     - หาก gateway อยู่บน LAN เดียวกันและประกาศผ่าน Bonjour ให้เลือกจากรายการที่ค้นพบเพื่อกรอกฟิลด์นี้อัตโนมัติ
   - **Gateway URL** (เฉพาะ Direct): `wss://gateway.example.ts.net` (หรือ `ws://...` สำหรับ local/LAN)
   - **Identity file** (ขั้นสูง): path ไปยัง key ของคุณ
   - **Project root** (ขั้นสูง): path ของ checkout บนเครื่องระยะไกลที่ใช้สำหรับคำสั่ง
   - **CLI path** (ขั้นสูง): path แบบเลือกได้ไปยัง entrypoint/binary `openclaw` ที่รันได้ (กรอกอัตโนมัติเมื่อมีการประกาศไว้)
3. กด **Test remote** หากสำเร็จแสดงว่า `openclaw status --json` บนเครื่องระยะไกลรันได้ถูกต้อง ความล้มเหลวมักเกิดจากปัญหา PATH/CLI; exit 127 หมายถึงไม่พบ CLI บนเครื่องระยะไกล
4. การตรวจสอบสุขภาพระบบและ Web Chat จะรันผ่าน SSH tunnel นี้โดยอัตโนมัติ

## Web Chat

- **SSH tunnel**: Web Chat จะเชื่อมต่อกับ gateway ผ่านพอร์ตควบคุม WebSocket ที่ถูก forward มา (ค่าเริ่มต้น 18789)
- **Direct (ws/wss)**: Web Chat จะเชื่อมต่อไปยัง URL ของ gateway ที่กำหนดไว้โดยตรง
- ไม่มี WebChat HTTP server แยกต่างหากอีกต่อไป

## สิทธิ์การใช้งาน

- โฮสต์ระยะไกลต้องมีการอนุมัติ TCC แบบเดียวกับเครื่อง local (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications) ให้รัน onboarding บนเครื่องนั้นเพื่ออนุมัติครั้งเดียว
- Nodes จะประกาศสถานะสิทธิ์ของตนผ่าน `node.list` / `node.describe` เพื่อให้เอเจนต์รู้ว่ามีอะไรใช้งานได้บ้าง

## หมายเหตุด้านความปลอดภัย

- ควรใช้ bind แบบ loopback บนโฮสต์ระยะไกลและเชื่อมต่อผ่าน SSH หรือ Tailscale
- การทำ SSH tunneling ใช้ strict host-key checking; ให้เชื่อถือ host key ก่อนเพื่อให้มีอยู่ใน `~/.ssh/known_hosts`
- หากคุณ bind Gateway เข้ากับอินเทอร์เฟซที่ไม่ใช่ loopback ให้บังคับใช้ Gateway auth ที่ถูกต้อง: token, password หรือ identity-aware reverse proxy พร้อม `gateway.auth.mode: "trusted-proxy"`
- ดู [ความปลอดภัย](/th/gateway/security) และ [Tailscale](/th/gateway/tailscale)

## โฟลว์การเข้าสู่ระบบ WhatsApp (ระยะไกล)

- รัน `openclaw channels login --verbose` **บนโฮสต์ระยะไกล** สแกน QR ด้วย WhatsApp บนโทรศัพท์ของคุณ
- รัน login ใหม่บนโฮสต์นั้นหาก auth หมดอายุ การตรวจสอบสุขภาพระบบจะแสดงปัญหาการเชื่อมโยง

## การแก้ปัญหา

- **exit 127 / not found**: `openclaw` ไม่ได้อยู่บน PATH สำหรับเชลล์แบบ non-login ให้เพิ่มลงใน `/etc/paths`, shell rc ของคุณ หรือทำ symlink ไปยัง `/usr/local/bin`/`/opt/homebrew/bin`
- **Health probe failed**: ตรวจสอบการเข้าถึง SSH, PATH และยืนยันว่า Baileys เข้าสู่ระบบแล้ว (`openclaw status --json`)
- **Web Chat ค้าง**: ยืนยันว่า gateway กำลังทำงานบนโฮสต์ระยะไกล และพอร์ตที่ forward มาตรงกับพอร์ต WS ของ gateway; UI ต้องการการเชื่อมต่อ WS ที่สมบูรณ์
- **Node IP แสดงเป็น 127.0.0.1**: เป็นพฤติกรรมปกติเมื่อใช้ SSH tunnel เปลี่ยน **Transport** เป็น **Direct (ws/wss)** หากคุณต้องการให้ gateway เห็น IP จริงของไคลเอนต์
- **Voice Wake**: วลีทริกเกอร์จะถูกส่งต่อโดยอัตโนมัติในโหมดระยะไกล; ไม่ต้องมี forwarder แยกต่างหาก

## เสียงแจ้งเตือน

เลือกเสียงต่อการแจ้งเตือนหนึ่งรายการจากสคริปต์ด้วย `openclaw` และ `node.invoke` เช่น:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

ไม่มีตัวสลับ “default sound” แบบส่วนกลางในแอปอีกต่อไป; ผู้เรียกจะเลือกเสียง (หรือไม่เลือกเลย) ต่อคำขอหนึ่งรายการ

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
