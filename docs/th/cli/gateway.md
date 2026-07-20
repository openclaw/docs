---
read_when:
    - การเรียกใช้ Gateway จาก CLI (สำหรับการพัฒนาหรือเซิร์ฟเวอร์)
    - การดีบักการยืนยันตัวตนของ Gateway โหมดการผูก และการเชื่อมต่อ
    - การค้นหา Gateway ผ่าน Bonjour (ภายในเครือข่าย + DNS-SD แบบพื้นที่กว้าง)
    - การผสานรวมตัวควบคุมกระบวนการ Gateway ภายนอก
sidebarTitle: Gateway
summary: CLI ของ OpenClaw Gateway (`openclaw gateway`) — เรียกใช้ สอบถาม และค้นหา Gateway
title: Gateway
x-i18n:
    generated_at: "2026-07-20T06:32:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4de443c749806ccb7fe3e7919a319ff125130192e8814708a79b2b3a93162e7d
    source_path: cli/gateway.md
    workflow: 16
---

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (ช่องทาง, Node, เซสชัน, ฮุก) คำสั่งย่อยทั้งหมดด้านล่างอยู่ภายใต้ `openclaw gateway ...`

<CardGroup cols={3}>
  <Card title="การค้นหาด้วย Bonjour" href="/th/gateway/bonjour">
    การตั้งค่า mDNS ภายในเครือข่าย + DNS-SD แบบบริเวณกว้าง
  </Card>
  <Card title="ภาพรวมการค้นหา" href="/th/gateway/discovery">
    วิธีที่ OpenClaw ประกาศและค้นหา Gateway
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration">
    คีย์การกำหนดค่า Gateway ระดับบนสุด
  </Card>
</CardGroup>

## เรียกใช้ Gateway

```bash
openclaw gateway
openclaw gateway run   # รูปแบบที่เทียบเท่าและระบุอย่างชัดเจน
```

<AccordionGroup>
  <Accordion title="พฤติกรรมเมื่อเริ่มต้น">
    - ปฏิเสธการเริ่มต้น เว้นแต่จะตั้งค่า `gateway.mode=local` ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการเรียกใช้เฉพาะกิจ/การพัฒนา ซึ่งจะข้ามการตรวจสอบโดยไม่เขียนหรือซ่อมแซมการกำหนดค่า
    - เมื่อพบการกำหนดค่าที่ไม่ถูกต้องแต่ซ่อมแซมได้ระหว่างเริ่มต้น เทอร์มินัลแบบโต้ตอบจะเสนอให้เรียกใช้ `openclaw doctor --fix` และลองเริ่มต้นอีกครั้งหนึ่งครั้งหลังได้รับความยินยอม การเรียกใช้แบบไม่โต้ตอบจะไม่ซ่อมแซมโดยอัตโนมัติ แต่จะแสดงคำสั่งแทน หากการกำหนดค่าหลังซ่อมแซมยังไม่ถูกต้อง การเริ่มต้นจะยังคงหยุดอยู่
    - `openclaw onboard --mode local` และ `openclaw setup` เขียน `gateway.mode=local` หากมีไฟล์การกำหนดค่าอยู่แต่ไม่มี `gateway.mode` ระบบจะถือว่าการกำหนดค่าเสียหาย/ถูกเขียนทับ และ Gateway จะปฏิเสธการคาดเดา `local` ให้ — ให้ดำเนินการเริ่มต้นใช้งานอีกครั้ง ตั้งค่าคีย์ด้วยตนเอง หรือส่ง `--allow-unconfigured`
    - ระบบจะบล็อกการผูกกับที่อยู่นอกเหนือจาก loopback หากไม่มีการยืนยันตัวตน
    - ค่า `--bind` ได้แก่ `lan`, `tailnet` และ `custom` ปัจจุบันทำงานผ่านเส้นทาง IPv4 เท่านั้น การตั้งค่าโฮสต์ที่ผู้ใช้นำมาเองซึ่งรองรับเฉพาะ IPv6 จำเป็นต้องมีไซด์คาร์ IPv4 หรือพร็อกซีอยู่ด้านหน้า Gateway
    - `SIGUSR1` เรียกให้เกิดการเริ่มต้นใหม่ภายในโพรเซสเมื่อได้รับอนุญาต `commands.restart` (ค่าเริ่มต้น: เปิดใช้งาน) ควบคุม `SIGUSR1` ที่ส่งมาจากภายนอก ตั้งค่าเป็น `false` เพื่อบล็อกการเริ่มต้นใหม่ด้วยสัญญาณ OS แบบกำหนดเอง เครื่องมือ `gateway` สำหรับเอเจนต์เป็นแบบอ่านอย่างเดียว เอเจนต์จะขอเริ่มต้นใหม่ผ่านเครื่องมือมอบหมาย `openclaw` ที่มนุษย์อนุมัติ
    - `SIGINT`/`SIGTERM` จะหยุดโพรเซสแต่ไม่คืนค่าสถานะเทอร์มินัลที่กำหนดเอง หากห่อหุ้ม CLI ไว้ใน TUI หรืออินพุตโหมด raw ให้คืนค่าเทอร์มินัลด้วยตนเองก่อนออก

  </Accordion>
</AccordionGroup>

### ตัวเลือก

<ParamField path="--port <port>" type="number">
  พอร์ต WebSocket (ค่าเริ่มต้นจากการกำหนดค่า/สภาพแวดล้อม โดยทั่วไปคือ `18789`)
</ParamField>
<ParamField path="--bind <mode>" type="string">
  โหมดการผูก: `loopback` (ค่าเริ่มต้น), `lan`, `tailnet`, `auto`, `custom`
</ParamField>
<ParamField path="--token <token>" type="string">
  โทเค็นที่ใช้ร่วมกันสำหรับ `connect.params.auth.token` ค่าเริ่มต้นคือ `OPENCLAW_GATEWAY_TOKEN` เมื่อตั้งค่าไว้
</ParamField>
<ParamField path="--auth <mode>" type="string">
  โหมดการยืนยันตัวตน: `none`, `token`, `password`, `trusted-proxy`
</ParamField>
<ParamField path="--password <password>" type="string">
  รหัสผ่านสำหรับ `--auth password`
</ParamField>
<ParamField path="--password-file <path>" type="string">
  อ่านรหัสผ่าน Gateway จากไฟล์
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  การเปิดให้เข้าถึงผ่าน Tailscale: `off`, `serve`, `funnel`
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  รีเซ็ตการกำหนดค่า serve/funnel ของ Tailscale เมื่อปิดระบบ
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  เริ่มต้นโดยไม่บังคับใช้ `gateway.mode=local` ใช้สำหรับการบูตสแตรปเฉพาะกิจ/การพัฒนาเท่านั้น และจะไม่บันทึกหรือซ่อมแซมการกำหนดค่า
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้างการกำหนดค่าและพื้นที่ทำงานสำหรับการพัฒนาหากยังไม่มี (ข้าม `BOOTSTRAP.md`)
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ตการกำหนดค่าสำหรับการพัฒนา ข้อมูลประจำตัว เซสชัน และพื้นที่ทำงาน ต้องใช้ `--dev`
</ParamField>
<ParamField path="--force" type="boolean">
  ปิดตัวรับฟังที่มีอยู่บนพอร์ตเป้าหมายก่อนเริ่มต้น ในเชลล์แบบไม่โต้ตอบ ตัวเลือกนี้จะปฏิเสธการปิดตัวรับฟัง Gateway ที่ตรวจสอบแล้ว ให้ใช้ `--dev` หรือ `--profile` ที่แยกออกมาต่างหากพร้อมพอร์ตว่างแทน
</ParamField>
<ParamField path="--verbose" type="boolean">
  บันทึกล็อกโดยละเอียดไปยัง stdout/stderr
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะล็อกแบ็กเอนด์ CLI ในคอนโซล (และเปิดใช้งาน stdout/stderr ด้วย)
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  รูปแบบล็อก WebSocket: `auto`, `full`, `compact`
</ParamField>
<ParamField path="--compact" type="boolean">
  นามแฝงสำหรับ `--ws-log compact`
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  บันทึกเหตุการณ์สตรีมดิบของโมเดลเป็น JSONL
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  พาธ JSONL ของสตรีมดิบ
</ParamField>

`--claude-cli-logs` เป็นนามแฝงที่เลิกใช้แล้วของ `--cli-backend-logs`

สำหรับ `--bind custom` ให้ตั้งค่า `gateway.customBindHost` เป็นที่อยู่ IPv4 ที่อยู่อื่นนอกเหนือจาก `127.0.0.1` หรือ `0.0.0.0` ยังกำหนดให้ต้องมี `127.0.0.1` บนพอร์ตเดียวกันสำหรับไคลเอนต์บนโฮสต์เดียวกัน การเริ่มต้นจะล้มเหลวหากตัวรับฟังตัวใดตัวหนึ่งไม่สามารถผูกได้ ไวลด์การ์ด `0.0.0.0` จะไม่เพิ่มนามแฝงที่จำเป็นแยกต่างหาก การตั้งค่าโฮสต์ที่ผู้ใช้นำมาเองซึ่งรองรับเฉพาะ IPv6 จำเป็นต้องมีไซด์คาร์ IPv4 หรือพร็อกซีอยู่ด้านหน้า Gateway

## เริ่มต้น Gateway ใหม่

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` ขอให้ Gateway ที่กำลังทำงานตรวจสอบงานที่ใช้งานอยู่ล่วงหน้า และกำหนดเวลาเริ่มต้นใหม่แบบรวมครั้งเดียวหลังงานเหล่านั้นระบายเสร็จ การรอจำกัดไว้ที่ 5 นาที เมื่อหมดเวลาที่กำหนด ระบบจะบังคับเริ่มต้นใหม่ `--safe` ไม่สามารถใช้ร่วมกับ `--force` หรือ `--wait`

`--skip-deferral` ข้ามด่านการเลื่อนเวลาเนื่องจากงานที่ใช้งานอยู่ในการเริ่มต้นใหม่แบบปลอดภัย ดังนั้น Gateway จะเริ่มต้นใหม่ทันทีแม้มีรายงานตัวขัดขวาง ต้องใช้ร่วมกับ `--safe` ให้ใช้เมื่อติดค้างในการเลื่อนเวลาเพราะงานที่ทำงานไม่หยุด

`--wait <duration>` เขียนทับเวลาที่กำหนดสำหรับการระบายในการเริ่มต้นใหม่แบบปกติ (ไม่ใช่แบบปลอดภัย) รองรับค่ามิลลิวินาทีเปล่าหรือส่วนต่อท้ายหน่วย `ms`, `s`, `m`, `h`, `d` (เช่น `30s`, `5m`, `1h30m`) ส่วน `--wait 0` จะรอโดยไม่มีกำหนด ไม่สามารถใช้ร่วมกับ `--force` หรือ `--safe`

`--force` ข้ามการระบายงานที่ใช้งานอยู่และเริ่มต้นใหม่ทันที `restart` แบบปกติ (ไม่มีแฟล็ก) จะคงพฤติกรรมการเริ่มต้นใหม่ของตัวจัดการบริการที่มีอยู่

<Warning>
`--password` แบบอินไลน์อาจปรากฏในรายการโพรเซสภายในเครื่อง ควรใช้ `--password-file`, สภาพแวดล้อม หรือ `gateway.auth.password` ที่มี SecretRef รองรับ
</Warning>

### ซูเปอร์ไวเซอร์ภายนอก

ตั้งค่า `OPENCLAW_SUPERVISOR_MODE=external` เฉพาะเมื่อมีตัวจัดการโพรเซสอื่นเป็นเจ้าของวงจรชีวิตของ Gateway ในโหมดนี้:

- `openclaw gateway restart` จะคงพฤติกรรมแบบปลอดภัย แบบบังคับ และแบบรออย่างมีขอบเขตที่มีอยู่ ขณะกำหนดเป้าหมายไปยัง Gateway ที่กำลังทำงานและผ่านการตรวจสอบแล้ว แทนที่จะเป็น launchd, systemd หรือ Task Scheduler
- ระบบจะปฏิเสธการติดตั้ง เริ่ม หยุด และถอนการติดตั้งบริการแบบเนทีฟ พร้อมคำแนะนำให้ใช้ซูเปอร์ไวเซอร์ภายนอก
- ระบบจะปฏิเสธการอัปเดตตัวเองของ OpenClaw เพื่อให้ซูเปอร์ไวเซอร์สามารถหยุด Gateway แทนที่และจัดเตรียมรันไทม์ให้เสร็จสมบูรณ์ แล้วเริ่มต้นใหม่อย่างปลอดภัย
- การเริ่มต้นใหม่ด้วยโพรเซสใหม่จะเขียนข้อมูลส่งมอบ SQLite แบบมีขอบเขตก่อนออกอย่างเรียบร้อย หากบันทึกข้อมูลไม่สำเร็จ Gateway จะย้อนกลับไปเริ่มต้นใหม่ภายในโพรเซสแทนการออกโดยไม่มีข้อมูลส่งมอบที่ใช้งานได้

`OPENCLAW_SERVICE_REPAIR_POLICY=external` ยังคงเป็นนโยบายการซ่อมแซมของ Doctor ที่แยกต่างหาก โดยไม่ได้ประกาศความเป็นเจ้าของรันไทม์ ซูเปอร์ไวเซอร์ที่ต้องการพฤติกรรมทั้งสองควรตั้งค่าตัวแปรทั้งสอง

ซูเปอร์ไวเซอร์ภายนอกสามารถเจรจาและใช้ข้อมูลส่งมอบการเริ่มต้นใหม่ผ่านสัญญาสำหรับเครื่องที่ซ่อนอยู่:

```bash
openclaw gateway restart-handoff capabilities --json
openclaw gateway restart-handoff consume --expected-pid <pid> --json
```

โปรโตคอลเวอร์ชัน `1` รองรับการดำเนินการ `consume` การใช้ข้อมูลจะตรวจสอบ PID ที่คาดไว้และฟิลด์ข้อมูลส่งมอบที่มีขอบเขตภายในธุรกรรม SQLite แบบทันทีหนึ่งรายการ ข้อมูลส่งมอบที่ยอมรับแล้วจะถูกลบก่อนส่งคืนผลสำเร็จ ดังนั้นผู้ใช้ข้อมูลพร้อมกันหรือผู้ใช้ข้อมูลซ้ำจึงไม่สามารถยอมรับข้อมูลเดียวกันได้ทั้งคู่ ระบบจะเก็บข้อมูลที่ PID ไม่ตรงกันไว้ให้เจ้าของที่ตรงกัน ส่วนแถวที่ไม่มี หมดอายุ หรือไม่ถูกต้องจะไม่อนุญาตให้เริ่มต้นใหม่

คำขอสำหรับเครื่องที่ถูกต้องจะส่งคืน JSON พร้อมรหัสออก `0` รวมถึงผลลัพธ์ที่ไม่ใช่การเริ่มต้นใหม่ อาร์กิวเมนต์ที่ไม่ถูกต้องจะส่งคืน `reason: "invalid-expected-pid"` พร้อมรหัสออก `2` ส่วนความล้มเหลวของที่เก็บสถานะจะส่งคืน `reason: "store-unavailable"` พร้อมรหัสออก `1` ซูเปอร์ไวเซอร์ควรตรวจสอบ `capabilities` บนรันไทม์หรือตัวเรียกใช้ที่แน่นอนซึ่งจะใช้งาน แทนการอนุมานการรองรับจากสตริงเวอร์ชัน OpenClaw หรืออ่านสคีมา SQLite ส่วนตัวโดยตรง

### การทำโปรไฟล์ Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` บันทึกระยะเวลาของแต่ละเฟสระหว่างเริ่มต้น รวมถึงความหน่วง `eventLoopMax` ต่อเฟสและระยะเวลาตารางค้นหา Plugin (ดัชนีที่ติดตั้ง รีจิสทรีไฟล์กำกับ การวางแผนเริ่มต้น และงานแผนที่เจ้าของ)
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` บันทึกบรรทัด `restart trace:` ที่จำกัดขอบเขตเฉพาะการเริ่มต้นใหม่ ได้แก่ การจัดการสัญญาณ การระบายงานที่ใช้งานอยู่ เฟสการปิดระบบ การเริ่มต้นครั้งถัดไป ระยะเวลาจนพร้อม และเมตริกหน่วยความจำ
- `OPENCLAW_DIAGNOSTICS=timeline` ร่วมกับ `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` เขียนไทม์ไลน์การวินิจฉัยการเริ่มต้นแบบ JSONL ตามความพยายามที่ดีที่สุดสำหรับชุดทดสอบ QA ภายนอก (เทียบเท่ากับการกำหนดค่า `diagnostics.flags: ["timeline"]` โดยพาธยังคงตั้งค่าได้ผ่านสภาพแวดล้อมเท่านั้น) เพิ่ม `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` เพื่อรวมตัวอย่างลูปเหตุการณ์
- `pnpm build` แล้วตามด้วย `pnpm test:startup:gateway -- --runs 5 --warmup 1` ใช้วัดประสิทธิภาพการเริ่มต้น Gateway เทียบกับจุดเข้าของ CLI ที่สร้างแล้ว ได้แก่ เอาต์พุตแรกของโพรเซส, `/healthz`, `/readyz`, ระยะเวลาเทรซการเริ่มต้น, ความหน่วงของลูปเหตุการณ์ และระยะเวลาตารางค้นหา Plugin
- `pnpm build` แล้วตามด้วย `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` ใช้วัดประสิทธิภาพการเริ่มต้นใหม่ภายในโพรเซสบน macOS หรือ Linux (ไม่รองรับบน Windows และการเริ่มต้นใหม่ต้องใช้ `SIGUSR1`) โดยใช้ `SIGUSR1` เปิดใช้งานเทรซทั้งสองในโพรเซสลูก และบันทึก `/healthz` ครั้งถัดไป, `/readyz` ครั้งถัดไป, เวลาหยุดทำงาน, ระยะเวลาจนพร้อม, CPU, RSS และเมตริกเทรซการเริ่มต้นใหม่
- `/healthz` คือสถานะการทำงาน ส่วน `/readyz` คือความพร้อมใช้งาน ให้ถือว่าบรรทัดเทรซและเอาต์พุตการวัดประสิทธิภาพเป็นสัญญาณสำหรับระบุเจ้าของ ไม่ใช่ข้อสรุปด้านประสิทธิภาพที่สมบูรณ์จากช่วงเวลาหรือตัวอย่างเพียงหนึ่งรายการ

## สอบถาม Gateway ที่กำลังทำงาน

คำสั่งสอบถามทั้งหมดใช้ WebSocket RPC

<Tabs>
  <Tab title="โหมดเอาต์พุต">
    - ค่าเริ่มต้น: อ่านได้โดยมนุษย์ (มีสีใน TTY)
    - `--json`: JSON ที่เครื่องอ่านได้ (ไม่มีการจัดรูปแบบ/ตัวแสดงความคืบหน้า)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิดใช้งาน ANSI โดยยังคงเค้าโครงสำหรับมนุษย์

  </Tab>
  <Tab title="ตัวเลือกที่ใช้ร่วมกัน">
    - `--url <url>`: URL WebSocket ของ Gateway
    - `--token <token>`: โทเค็น Gateway
    - `--password <password>`: รหัสผ่าน Gateway
    - `--timeout <ms>`: การหมดเวลา/เวลาที่กำหนด (ค่าเริ่มต้นแตกต่างกันไปตามคำสั่ง โปรดดูแต่ละคำสั่งด้านล่าง)
    - `--expect-final`: รอการตอบกลับ "สุดท้าย" (การเรียกโดยเอเจนต์)

  </Tab>
</Tabs>

<Note>
เมื่อตั้งค่า `--url` แล้ว CLI จะไม่ย้อนกลับไปใช้ข้อมูลประจำตัวจากการกำหนดค่าหรือสภาพแวดล้อม ให้ส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่ระบุข้อมูลประจำตัวอย่างชัดเจนถือเป็นข้อผิดพลาด
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` คือโพรบตรวจสอบความพร้อมใช้งาน: โดยจะส่งผลลัพธ์กลับทันทีที่เซิร์ฟเวอร์สามารถตอบ HTTP ได้ `/readyz` เข้มงวดกว่าและยังคงแสดงสถานะสีแดงขณะที่ sidecar ของ Plugin ช่องทาง หรือ hook ที่กำหนดค่าซึ่งทำงานระหว่างการเริ่มต้นระบบยังอยู่ระหว่างการเตรียมพร้อม การตอบกลับ `/readyz` แบบละเอียดที่มาจากภายในเครื่องหรือผ่านการยืนยันตัวตนจะมีบล็อกการวินิจฉัย `eventLoop` (ความล่าช้า การใช้งาน อัตราส่วนคอร์ CPU และแฟล็ก `degraded`)

<ParamField path="--port <port>" type="number">
  กำหนดเป้าหมายเป็น Gateway แบบลูปแบ็กภายในเครื่องที่พอร์ตนี้ แทนที่ `OPENCLAW_GATEWAY_URL` และ `OPENCLAW_GATEWAY_PORT` สำหรับการเรียกครั้งนี้
</ParamField>

### `gateway usage-cost`

ดึงข้อมูลสรุปค่าใช้จ่ายการใช้งานจากบันทึกเซสชัน

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  จำนวนวันที่จะรวมไว้
</ParamField>
<ParamField path="--agent <id>" type="string">
  จำกัดขอบเขตข้อมูลสรุปไว้ที่ ID ของเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
</ParamField>
<ParamField path="--all-agents" type="boolean">
  รวมข้อมูลจากเอเจนต์ที่กำหนดค่าไว้ทั้งหมด ไม่สามารถใช้ร่วมกับ `--agent` ได้
</ParamField>

### `gateway stability`

ดึงข้อมูลล่าสุดจากตัวบันทึกความเสถียรสำหรับการวินิจฉัยของ Gateway ที่กำลังทำงาน

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  จำนวนเหตุการณ์ล่าสุดสูงสุดที่จะรวมไว้ (สูงสุด `1000`)
</ParamField>
<ParamField path="--type <type>" type="string">
  กรองตามประเภทเหตุการณ์วินิจฉัย เช่น `payload.large` หรือ `diagnostic.memory.pressure`
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  รวมเฉพาะเหตุการณ์ที่เกิดหลังหมายเลขลำดับการวินิจฉัย
</ParamField>
<ParamField path="--bundle [path]" type="string">
  อ่านชุดข้อมูลความเสถียรที่บันทึกไว้แทนการเรียก Gateway ที่กำลังทำงาน `--bundle latest` (หรือ `--bundle` เพียงอย่างเดียว) จะเลือกชุดข้อมูลใหม่ล่าสุดภายใต้ไดเรกทอรีสถานะ และยังสามารถส่งพาธ JSON ของชุดข้อมูลโดยตรงได้ด้วย
</ParamField>
<ParamField path="--export" type="boolean">
  เขียนไฟล์ zip ข้อมูลวินิจฉัยสำหรับฝ่ายสนับสนุนที่สามารถแชร์ได้ แทนการแสดงรายละเอียดความเสถียร
</ParamField>
<ParamField path="--output <path>" type="string">
  พาธเอาต์พุตสำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="ความเป็นส่วนตัวและลักษณะการทำงานของชุดข้อมูล">
    - ระเบียนจะเก็บข้อมูลเมตาด้านการดำเนินงาน ได้แก่ ชื่อเหตุการณ์ จำนวน ขนาดไบต์ ค่าหน่วยความจำ สถานะคิว/เซสชัน ID การอนุมัติ ชื่อช่องทาง/Plugin และข้อมูลสรุปเซสชันที่ปกปิดแล้ว โดยไม่รวมข้อความแชต เนื้อหา Webhook เอาต์พุตของเครื่องมือ เนื้อหาดิบของคำขอ/การตอบกลับ โทเค็น คุกกี้ ค่าความลับ ชื่อโฮสต์ และ ID เซสชันดิบ ตั้งค่า `diagnostics.enabled: false` เพื่อปิดใช้งานตัวบันทึกทั้งหมด
    - เมื่อ Gateway ปิดตัวลงเนื่องจากข้อผิดพลาดร้ายแรง หมดเวลาระหว่างการปิดระบบ หรือเริ่มต้นใหม่ไม่สำเร็จ ระบบจะเขียนสแนปช็อตการวินิจฉัยเดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` หากตัวบันทึกมีเหตุการณ์ ตรวจสอบชุดข้อมูลใหม่ล่าสุดด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` มีผลกับเอาต์พุตชุดข้อมูลด้วย

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

เขียนไฟล์ zip ข้อมูลวินิจฉัยภายในเครื่องที่ออกแบบมาสำหรับรายงานบั๊ก สำหรับโมเดลความเป็นส่วนตัวและเนื้อหาของชุดข้อมูล โปรดดู [การส่งออกข้อมูลวินิจฉัย](/th/gateway/diagnostics)

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  พาธของไฟล์ zip เอาต์พุต ค่าเริ่มต้นเป็นไฟล์ส่งออกสำหรับฝ่ายสนับสนุนภายใต้ไดเรกทอรีสถานะ
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  จำนวนบรรทัดบันทึกที่ผ่านการปรับให้ปลอดภัยสูงสุดที่จะรวมไว้
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  จำนวนไบต์ของบันทึกสูงสุดที่จะตรวจสอบ
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket ของ Gateway สำหรับสแนปช็อตสถานะการทำงาน
</ParamField>
<ParamField path="--token <token>" type="string">
  โทเค็น Gateway สำหรับสแนปช็อตสถานะการทำงาน
</ParamField>
<ParamField path="--password <password>" type="string">
  รหัสผ่าน Gateway สำหรับสแนปช็อตสถานะการทำงาน
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  ระยะหมดเวลาของสแนปช็อตสถานะ/สถานะการทำงาน
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  ข้ามการค้นหาชุดข้อมูลความเสถียรที่บันทึกไว้
</ParamField>
<ParamField path="--json" type="boolean">
  แสดงพาธที่เขียน ขนาด และไฟล์กำกับในรูปแบบ JSON
</ParamField>

ไฟล์ส่งออกจะรวม: `manifest.json` (รายการไฟล์), `summary.md` (ข้อมูลสรุป Markdown), `diagnostics.json` (ข้อมูลสรุประดับบนสุดของการกำหนดค่า/บันทึก/การค้นพบ/ความเสถียร/สถานะ/สถานะการทำงาน), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` และ `stability/latest.json` เมื่อมีชุดข้อมูล

ไฟล์นี้ได้รับการออกแบบมาให้แชร์ได้ โดยเก็บรายละเอียดด้านการดำเนินงานที่เป็นประโยชน์ต่อการแก้ไขข้อบกพร่อง ได้แก่ ฟิลด์บันทึกที่ปลอดภัย ชื่อระบบย่อย รหัสสถานะ ระยะเวลา โหมดที่กำหนดค่า พอร์ต ID ของ Plugin/ผู้ให้บริการ การตั้งค่าฟีเจอร์ที่ไม่เป็นความลับ และข้อความบันทึกด้านการดำเนินงานที่ปกปิดแล้ว พร้อมทั้งละเว้นหรือปกปิดข้อความแชต เนื้อหา Webhook เอาต์พุตของเครื่องมือ ข้อมูลประจำตัว คุกกี้ ตัวระบุบัญชี/ข้อความ ข้อความพรอมต์/คำสั่ง ชื่อโฮสต์ และค่าความลับ เมื่อข้อความบันทึกมีลักษณะคล้ายข้อความเพย์โหลดจากผู้ใช้/แชต/เครื่องมือ (เช่น "ผู้ใช้กล่าวว่า", "ข้อความแชต", "เอาต์พุตของเครื่องมือ", "เนื้อหา Webhook") ไฟล์ส่งออกจะเก็บไว้เพียงข้อมูลว่าข้อความถูกละเว้นพร้อมจำนวนไบต์ของข้อความนั้น

### `gateway status`

แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อมโพรบการเชื่อมต่อ/การยืนยันตัวตนซึ่งเลือกใช้ได้

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่มเป้าหมายโพรบที่ระบุอย่างชัดเจน โดยระบบยังคงโพรบรีโมตที่กำหนดค่าไว้และ localhost
</ParamField>
<ParamField path="--token <token>" type="string">
  การยืนยันตัวตนด้วยโทเค็นสำหรับโพรบ
</ParamField>
<ParamField path="--password <password>" type="string">
  การยืนยันตัวตนด้วยรหัสผ่านสำหรับโพรบ
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  ระยะหมดเวลาของโพรบ
</ParamField>
<ParamField path="--no-probe" type="boolean">
  ข้ามโพรบการเชื่อมต่อ (มุมมองเฉพาะบริการ)
</ParamField>
<ParamField path="--deep" type="boolean">
  สแกนบริการระดับระบบด้วย
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ยกระดับโพรบการเชื่อมต่อเป็นโพรบการอ่าน และออกด้วยรหัสที่ไม่ใช่ศูนย์หากล้มเหลว ไม่สามารถใช้ร่วมกับ `--no-probe` ได้
</ParamField>

<AccordionGroup>
  <Accordion title="ความหมายของสถานะ">
    - ยังคงพร้อมใช้งานสำหรับการวินิจฉัยแม้ว่าการกำหนดค่า CLI ภายในเครื่องจะขาดหายหรือไม่ถูกต้อง
    - เอาต์พุตเริ่มต้นยืนยันสถานะบริการ การเชื่อมต่อ WebSocket และความสามารถในการยืนยันตัวตนที่มองเห็นได้ขณะจับมือเชื่อมต่อ แต่ไม่ได้ยืนยันการดำเนินการอ่าน/เขียน/ผู้ดูแลระบบ
    - โพรบจะไม่เปลี่ยนแปลงสถานะสำหรับการยืนยันตัวตนอุปกรณ์ครั้งแรก โดยจะใช้โทเค็นอุปกรณ์ที่แคชไว้เดิมเมื่อมีอยู่ แต่จะไม่สร้างข้อมูลประจำตัวอุปกรณ์ CLI ใหม่หรือระเบียนการจับคู่แบบอ่านอย่างเดียวเพียงเพื่อตรวจสอบสถานะ
    - แก้ไข SecretRef สำหรับการยืนยันตัวตนที่กำหนดค่าไว้เพื่อใช้ยืนยันตัวตนของโพรบเมื่อทำได้ หาก SecretRef ที่จำเป็นไม่สามารถแก้ไขได้ `--json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/การยืนยันตัวตนของโพรบล้มเหลว ให้ส่ง `--token`/`--password` อย่างชัดเจนหรือแก้ไขแหล่งข้อมูลความลับ คำเตือนการยืนยันตัวตนที่แก้ไขไม่ได้จะถูกระงับเมื่อโพรบสำเร็จ
    - เอาต์พุต JSON จะมี `gateway.version` เมื่อ Gateway ที่กำลังทำงานรายงานค่านี้ โดย `--require-rpc` สามารถถอยกลับไปใช้เพย์โหลด RPC ของ `status.runtimeVersion` หากโพรบการจับมือเชื่อมต่อไม่สามารถให้ข้อมูลเมตาเวอร์ชันได้
    - ใช้ `--require-rpc` ในสคริปต์/ระบบอัตโนมัติเมื่อบริการที่กำลังรับฟังเพียงอย่างเดียวยังไม่เพียงพอ และต้องการให้ RPC ขอบเขตการอ่านมีสถานะพร้อมใช้งานด้วย
    - `--deep` จะสแกนหาการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบบริการที่มีลักษณะคล้าย Gateway หลายรายการ เอาต์พุตสำหรับมนุษย์จะแสดงคำแนะนำในการล้างข้อมูล (โดยทั่วไปให้เรียกใช้ Gateway หนึ่งรายการต่อเครื่อง) และรายงานการส่งต่องานจากการเริ่มระบบใหม่โดยตัวควบคุมล่าสุดเมื่อเกี่ยวข้อง
    - `--deep` ยังเรียกใช้การตรวจสอบความถูกต้องของการกำหนดค่าในโหมดที่รับรู้ Plugin (`pluginValidation: "full"`) และแสดงคำเตือนจากไฟล์กำกับ Plugin (เช่น ข้อมูลเมตาการกำหนดค่าช่องทางขาดหาย) `gateway status` เริ่มต้นจะใช้เส้นทางอ่านอย่างเดียวที่รวดเร็วซึ่งข้ามการตรวจสอบ Plugin
    - เอาต์พุตสำหรับมนุษย์จะแสดงพาธไฟล์บันทึกที่แก้ไขแล้ว พร้อมพาธ/ความถูกต้องของการกำหนดค่า CLI เทียบกับบริการ เพื่อช่วยวินิจฉัยความคลาดเคลื่อนของโปรไฟล์หรือไดเรกทอรีสถานะ
    - เอาต์พุตสำหรับมนุษย์จะแสดง `Gateway heap:` พร้อมขีดจำกัดที่ใช้และที่มาของการคำนวณแบบปรับตัว เอาต์พุต JSON จะแสดงรายงานเดียวกันในรูปแบบ `service.gatewayHeap`

  </Accordion>
  <Accordion title="การตรวจสอบความคลาดเคลื่อนของการยืนยันตัวตนใน Linux systemd">
    - การตรวจสอบความคลาดเคลื่อนของการยืนยันตัวตนของบริการจะอ่านทั้ง `Environment=` และ `EnvironmentFile=` จาก unit (รวมถึง `%h` พาธที่ใส่เครื่องหมายอัญประกาศ หลายไฟล์ และไฟล์ `-` ที่เลือกใช้ได้)
    - แก้ไข SecretRef ของ `gateway.auth.token` โดยใช้สภาพแวดล้อมรันไทม์ที่ผสานแล้ว (สภาพแวดล้อมคำสั่งของบริการก่อน แล้วจึงใช้สภาพแวดล้อมของโพรเซสเป็นทางเลือกสำรอง)
    - การตรวจสอบความคลาดเคลื่อนของโทเค็นจะข้ามการแก้ไขโทเค็นจากการกำหนดค่าเมื่อการยืนยันตัวตนด้วยโทเค็นไม่ได้ทำงานจริง (`gateway.auth.mode` ถูกกำหนดเป็น `password`/`none`/`trusted-proxy` อย่างชัดเจน หรือไม่ได้กำหนดโหมดในกรณีที่รหัสผ่านสามารถมีลำดับความสำคัญเหนือกว่าและไม่มีโทเค็นที่อาจมีลำดับความสำคัญเหนือกว่าได้)

  </Accordion>
</AccordionGroup>

### `gateway probe`

คำสั่ง "แก้ไขข้อบกพร่องทุกอย่าง" โดยจะโพรบรายการต่อไปนี้เสมอ:

- Gateway รีโมตที่กำหนดค่าไว้ (หากมี) และ
- localhost (ลูปแบ็ก) **แม้ว่าจะกำหนดค่ารีโมตไว้แล้วก็ตาม**

การส่ง `--url` จะเพิ่มเป้าหมายที่ระบุอย่างชัดเจนนั้นไว้ก่อนทั้งสองรายการ เอาต์พุตสำหรับมนุษย์จะติดป้ายกำกับเป้าหมายเป็น `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` และ `Local loopback`

<Note>
หากเข้าถึงเป้าหมายโพรบได้หลายรายการ ระบบจะแสดงทั้งหมด ทันเนล SSH, URL TLS/พร็อกซี และ URL รีโมตที่กำหนดค่าไว้สามารถชี้ไปยัง Gateway เดียวกันได้แม้ว่าจะใช้พอร์ตการรับส่งข้อมูลต่างกัน โดยสงวน `multiple_gateways` ไว้สำหรับ Gateway ที่เข้าถึงได้ซึ่งแตกต่างกันหรือมีข้อมูลประจำตัวกำกวม ระบบรองรับการเรียกใช้ Gateway หลายรายการสำหรับโปรไฟล์ที่แยกจากกัน (เช่น บอตกู้คืน) แต่การติดตั้งส่วนใหญ่จะเรียกใช้ Gateway เพียงรายการเดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  ใช้พอร์ตนี้สำหรับเป้าหมายโพรบลูปแบ็กภายในเครื่องและพอร์ตรีโมตของทันเนล SSH หากไม่มี `--url` ตัวเลือกนี้จะเลือกเฉพาะเป้าหมายลูปแบ็กภายในเครื่อง แทน URL สภาพแวดล้อม Gateway ที่กำหนดค่าไว้ พอร์ตสภาพแวดล้อม หรือเป้าหมายรีโมต
</ParamField>

<AccordionGroup>
  <Accordion title="การตีความ">
    - `Reachable: yes` หมายความว่ามีอย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่โพรบสามารถยืนยันได้เกี่ยวกับการยืนยันตัวตน โดยแยกจากความสามารถในการเข้าถึง
    - `Read probe: ok` หมายความว่าการเรียก RPC รายละเอียดขอบเขตการอ่าน (`health`/`status`/`system-presence`/`config.get`) สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายความว่าการเชื่อมต่อสำเร็จ แต่ RPC ขอบเขตการอ่านถูกจำกัด โดยรายงานเป็นความสามารถในการเข้าถึงที่ **ลดประสิทธิภาพ** ไม่ใช่ความล้มเหลวทั้งหมด
    - `Read probe: failed` หลัง `Connect: ok` หมายความว่า WebSocket เชื่อมต่อแล้ว แต่การวินิจฉัยการอ่านที่ตามมาหมดเวลาหรือล้มเหลว ซึ่งถือว่า **ลดประสิทธิภาพ** เช่นกัน ไม่ใช่ไม่สามารถเข้าถึงได้
    - เช่นเดียวกับ `gateway status` โพรบจะใช้การยืนยันตัวตนอุปกรณ์ที่แคชไว้เดิม แต่จะไม่สร้างข้อมูลประจำตัวอุปกรณ์หรือสถานะการจับคู่เป็นครั้งแรก
    - รหัสออกจะไม่ใช่ศูนย์เฉพาะเมื่อไม่สามารถเข้าถึงเป้าหมายที่โพรบทั้งหมดได้

  </Accordion>
  <Accordion title="เอาต์พุต JSON">
    ระดับบนสุด:

    - `ok`: มีเป้าหมายอย่างน้อยหนึ่งรายการที่เข้าถึงได้
    - `degraded`: มีเป้าหมายอย่างน้อยหนึ่งรายการที่ยอมรับการเชื่อมต่อ แต่ดำเนินการวินิจฉัย RPC แบบละเอียดทั้งหมดไม่เสร็จสมบูรณ์
    - `capability`: ความสามารถที่ดีที่สุดที่พบในบรรดาเป้าหมายที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
    - `primaryTargetId`: เป้าหมายที่เหมาะสมที่สุดสำหรับใช้เป็นเป้าหมายหลักที่ทำงานอยู่ ตามลำดับดังนี้: URL ที่ระบุอย่างชัดเจน, ทันเนล SSH, รีโมตที่กำหนดค่าไว้, ลูปแบ็กภายในเครื่อง
    - `warnings[]`: ระเบียนคำเตือนแบบพยายามอย่างเต็มที่ พร้อม `code`, `message` และ `targetIds` ซึ่งเป็นตัวเลือก
    - `network`: คำใบ้ URL ของลูปแบ็กภายในเครื่อง/เทลเน็ตที่ได้มาจากการกำหนดค่าปัจจุบันและระบบเครือข่ายของโฮสต์
    - `discovery.timeoutMs` / `discovery.count`: งบประมาณการค้นหา/จำนวนผลลัพธ์จริงที่ใช้สำหรับรอบการตรวจสอบนี้

    ต่อเป้าหมาย (`targets[].connect`): `ok` (ความสามารถในการเข้าถึง + การจำแนกสถานะเสื่อมประสิทธิภาพ), `rpcOk` (RPC แบบละเอียดสำเร็จทั้งหมด), `scopeLimited` (RPC แบบละเอียดล้มเหลวเนื่องจากไม่มีขอบเขตผู้ดำเนินการ)

    ต่อเป้าหมาย (`targets[].auth`): รายงาน `role` และ `scopes` ใน `hello-ok` เมื่อมีข้อมูล พร้อมการจำแนก `capability` ที่แสดงออกมา

  </Accordion>
  <Accordion title="รหัสคำเตือนที่พบบ่อย">
    - `ssh_tunnel_failed`: การตั้งค่าทันเนล SSH ล้มเหลว คำสั่งจึงเปลี่ยนไปใช้การตรวจสอบโดยตรง
    - `multiple_gateways`: สามารถเข้าถึง Gateway ที่มีข้อมูลประจำตัวแตกต่างกัน หรือ OpenClaw ไม่สามารถยืนยันได้ว่าเป้าหมายที่เข้าถึงได้เป็น Gateway เดียวกัน ทันเนล SSH, URL พร็อกซี หรือ URL รีโมตที่กำหนดค่าไว้ซึ่งชี้ไปยัง Gateway เดียวกันจะไม่ทำให้เกิดคำเตือนนี้
    - `auth_secretref_unresolved`: ไม่สามารถแก้ไข SecretRef สำหรับการยืนยันตัวตนที่กำหนดค่าไว้ของเป้าหมายที่ล้มเหลว
    - `probe_scope_limited`: เชื่อมต่อ WebSocket สำเร็จ แต่การตรวจสอบการอ่านถูกจำกัดเนื่องจากไม่มี `operator.read`
    - `local_tls_runtime_unavailable`: เปิดใช้ TLS ของ Gateway ภายในเครื่อง แต่ OpenClaw ไม่สามารถโหลดลายนิ้วมือใบรับรองภายในเครื่องได้

  </Accordion>
</AccordionGroup>

#### รีโมตผ่าน SSH (ทำงานเทียบเท่าแอป Mac)

โหมด "Remote over SSH" ของแอป macOS ใช้การส่งต่อพอร์ตภายในเครื่อง เพื่อให้สามารถเข้าถึง Gateway รีโมตที่รับการเชื่อมต่อเฉพาะลูปแบ็กได้ที่ `ws://127.0.0.1:<port>`

คำสั่ง CLI ที่เทียบเท่า:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` หรือ `user@host:port` (พอร์ตมีค่าเริ่มต้นเป็น `22`)
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ไฟล์ข้อมูลประจำตัว
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  เลือกโฮสต์ Gateway แรกที่ค้นพบเป็นเป้าหมาย SSH จากปลายทางการค้นหาที่แก้ไขแล้ว (`local.` รวมถึงโดเมนเครือข่ายบริเวณกว้างที่กำหนดค่าไว้ หากมี) ระบบจะละเว้นคำใบ้ที่มาจาก TXT เท่านั้น
</ParamField>

ค่าเริ่มต้นในการกำหนดค่า (ไม่บังคับ): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`

### `gateway call <method>`

ตัวช่วย RPC ระดับต่ำ

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  สตริงออบเจ็กต์ JSON สำหรับพารามิเตอร์
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket ของ Gateway
</ParamField>
<ParamField path="--token <token>" type="string">
  โทเค็นของ Gateway
</ParamField>
<ParamField path="--password <password>" type="string">
  รหัสผ่านของ Gateway
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  งบประมาณระยะหมดเวลา
</ParamField>
<ParamField path="--expect-final" type="boolean">
  ใช้เป็นหลักสำหรับ RPC แบบเอเจนต์ที่สตรีมเหตุการณ์ระหว่างทางก่อนเพย์โหลดสุดท้าย
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุต JSON ที่เครื่องอ่านได้
</ParamField>

<Note>
`--params` ต้องเป็น JSON ที่ถูกต้อง และแต่ละเมธอดจะตรวจสอบรูปแบบพารามิเตอร์ของตนเอง (ฟิลด์ที่เกินมาหรือตั้งชื่อผิดจะถูกปฏิเสธ)
</Note>

## จัดการบริการ Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### ติดตั้งโดยใช้ตัวห่อหุ้ม

ใช้ `--wrapper` เมื่อบริการที่มีการจัดการต้องเริ่มต้นผ่านไฟล์ปฏิบัติการอื่น เช่น ชิมของตัวจัดการข้อมูลลับหรือตัวช่วยเรียกใช้ในนามผู้ใช้อื่น ตัวห่อหุ้มจะได้รับอาร์กิวเมนต์ Gateway ตามปกติ และมีหน้าที่เรียกใช้ `openclaw` หรือ Node พร้อมอาร์กิวเมนต์เหล่านั้นในท้ายที่สุด

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

สามารถกำหนดตัวห่อหุ้มผ่านสภาพแวดล้อมได้เช่นกัน `gateway install` จะตรวจสอบว่าพาธเป็นไฟล์ที่ปฏิบัติการได้ เขียนตัวห่อหุ้มลงใน `ProgramArguments` ของบริการ และคงค่า `OPENCLAW_WRAPPER` ไว้ในสภาพแวดล้อมของบริการสำหรับการบังคับติดตั้งใหม่ การอัปเดต และการซ่อมแซมด้วย doctor ในภายหลัง

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

หากต้องการนำตัวห่อหุ้มที่คงค่าไว้ออก ให้ล้าง `OPENCLAW_WRAPPER` ขณะติดตั้งใหม่:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="ตัวเลือกคำสั่ง">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node>` (ค่าเริ่มต้น: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--force`, `--json`

  </Accordion>
  <Accordion title="ลักษณะการทำงานของวงจรชีวิต">
    - `gateway start` เป็นแบบทำซ้ำได้โดยให้ผลลัพธ์เดิม: เมื่อบริการที่มีการจัดการกำลังทำงานอยู่แล้ว ระบบจะรายงานกระบวนการที่กำลังทำงานและไม่เปลี่ยนแปลงกระบวนการนั้น บริการที่โหลดแล้วแต่หยุดอยู่จะเริ่มต้นเหมือนเดิม
    - ใช้ `gateway restart` เพื่อเริ่มบริการที่มีการจัดการใหม่ อย่าเชื่อมคำสั่ง `gateway stop` และ `gateway start` เข้าด้วยกันเพื่อใช้แทนการเริ่มใหม่
    - ในเชลล์ที่ไม่โต้ตอบ `gateway stop` ต้องใช้ `--force` ส่วนเทอร์มินัลแบบโต้ตอบยังคงทำงานแบบเดิมโดยไม่แสดงพรอมต์ สำหรับระบบอัตโนมัติและการทดสอบ ควรใช้ `gateway run --dev` หรือ `--profile` ที่แยกสภาพแวดล้อมและใช้พอร์ตว่าง
    - บน macOS `gateway stop` ใช้ `launchctl bootout` เป็นค่าเริ่มต้น ซึ่งจะนำ LaunchAgent ออกจากเซสชันการบูตปัจจุบันโดยไม่คงสถานะปิดใช้งานไว้ — การกู้คืนอัตโนมัติของ KeepAlive ยังคงทำงานสำหรับการขัดข้องในอนาคต และ `gateway start` จะเปิดใช้งานอีกครั้งอย่างสมบูรณ์โดยไม่ต้องใช้ `launchctl enable` ด้วยตนเอง ส่ง `--disable` เพื่อระงับ KeepAlive และ RunAtLoad อย่างถาวร เพื่อไม่ให้ Gateway เริ่มกระบวนการใหม่จนกว่าจะเรียก `gateway start` อย่างชัดเจนในครั้งถัดไป ใช้ตัวเลือกนี้เมื่อต้องการให้การหยุดด้วยตนเองยังคงมีผลหลังรีบูต
    - การเปลี่ยนแปลงวงจรชีวิตของ Gateway จะเพิ่มระเบียนการตรวจสอบแบบคีย์-ค่าด้วยความพยายามอย่างเต็มที่ไปยัง `<state-dir>/logs/gateway-restart.log` ซึ่งรวมถึงการเริ่ม หยุด และเริ่มใหม่ผ่าน CLI, คำขอเริ่มใหม่อย่างปลอดภัย, การเริ่มใหม่โดยตัวควบคุม และการส่งมอบแบบแยกออกจากกระบวนการ
    - คำสั่งวงจรชีวิตรองรับ `--json` สำหรับการเขียนสคริปต์

  </Accordion>
  <Accordion title="การกำหนดขนาดฮีปของ Gateway ที่มีการจัดการ">
    - `gateway install` เขียนค่า `NODE_OPTIONS` สำหรับฮีปเท่านั้นให้กับบริการ Gateway ที่มีการจัดการ โดยตั้งเป้าไว้ที่ 50% ของหน่วยความจำที่ถูกจำกัดเมื่อ Node รายงานขีดจำกัดของคอนเทนเนอร์หรือบริการ มิฉะนั้นจะใช้ 50% ของหน่วยความจำจริง
    - ช่วงเป้าหมายตามปกติคือ 2048–8192 MiB โดยมีเพดานพื้นที่สำรองสำหรับหน่วยความจำเนทีฟเพิ่มเติมที่ 75% สำหรับโฮสต์ขนาดเล็ก เพดานพื้นที่สำรองนี้อาจทำให้ขีดจำกัดที่ใช้จริงต่ำกว่าค่าขั้นต่ำตามปกติที่ 2048 MiB
    - ค่า `--max-old-space-size` ที่ระบุไว้อย่างชัดเจนและถูกต้องซึ่งจัดเก็บอยู่แล้วในบริการที่ติดตั้งจะยังคงอยู่ตลอดการบังคับติดตั้งใหม่และการซ่อมแซมด้วย doctor แฟล็ก `NODE_OPTIONS` อื่นจะไม่ถูกนำเข้าไปยังบริการที่มีการจัดการ
    - ค่า `NODE_OPTIONS` จากสภาพแวดล้อมของเชลล์จะไม่แทนที่นโยบายนี้ ใช้ `gateway status` หรือ `doctor` เพื่อตรวจสอบค่าที่ติดตั้ง เรียกใช้ `openclaw gateway install --force` เพื่อสร้างข้อมูลเมตาของบริการรุ่นเก่าที่ไม่มีการตั้งค่าฮีปแบบมีการจัดการขึ้นใหม่
    - นโยบายนี้ใช้กับบริการ Gateway ที่มีการจัดการเท่านั้น `gateway run` ที่ทำงานเบื้องหน้า, บริการ Node และหน่วยตัวควบคุมที่เขียนขึ้นเองจะยังคงใช้การกำหนดค่ารันไทม์ของตนเอง

  </Accordion>
  <Accordion title="การยืนยันตัวตนและ SecretRefs ขณะติดตั้ง">
    - เมื่อการยืนยันตัวตนด้วยโทเค็นจำเป็นต้องใช้โทเค็นและ `gateway.auth.token` มี SecretRef เป็นผู้จัดการ `gateway install` จะตรวจสอบว่าสามารถแก้ไข SecretRef ได้ แต่จะไม่คงโทเค็นที่แก้ไขแล้วไว้ในข้อมูลเมตาสภาพแวดล้อมของบริการ
    - หากการยืนยันตัวตนด้วยโทเค็นจำเป็นต้องใช้โทเค็น แต่ไม่สามารถแก้ไข SecretRef ของโทเค็นที่กำหนดค่าไว้ได้ การติดตั้งจะปิดกั้นอย่างปลอดภัยแทนการคงข้อความธรรมดาสำรองไว้
    - สำหรับการยืนยันตัวตนด้วยรหัสผ่านบน `gateway run` ควรใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่รองรับด้วย SecretRef แทน `--password` แบบอินไลน์
    - ในโหมดการยืนยันตัวตนที่อนุมานโดยอัตโนมัติ `OPENCLAW_GATEWAY_PASSWORD` ที่มีเฉพาะในเชลล์จะไม่ผ่อนปรนข้อกำหนดโทเค็นสำหรับการติดตั้ง โปรดใช้การกำหนดค่าที่คงอยู่ (`gateway.auth.password` หรือการกำหนดค่า `env`) เมื่อติดตั้งบริการที่มีการจัดการ
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` แต่ยังไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งจะถูกปิดกั้นจนกว่าจะกำหนดโหมดอย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ค้นหา Gateway (Bonjour)

`gateway discover` จะสแกนหาบีคอนของ Gateway (`_openclaw-gw._tcp`)

- DNS-SD แบบมัลติคาสต์: `local.`
- DNS-SD แบบยูนิคาสต์ (Bonjour บริเวณกว้าง): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า DNS แบบแยก + เซิร์ฟเวอร์ DNS โปรดดู [Bonjour](/th/gateway/bonjour)

เฉพาะ Gateway ที่เปิดใช้การค้นหาด้วย Bonjour (ค่าเริ่มต้น) เท่านั้นที่จะประกาศบีคอน

คำใบ้ TXT ในทุกบีคอน: `role` (คำใบ้บทบาท Gateway), `transport` (คำใบ้การรับส่งข้อมูล เช่น `gateway`), `gatewayPort` (พอร์ต WebSocket ซึ่งโดยปกติคือ `18789`), `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อมี), `gatewayTls` / `gatewayTlsSha256` (เปิดใช้ TLS + ลายนิ้วมือใบรับรอง) `sshPort` และ `cliPath` จะเผยแพร่เฉพาะในโหมดการค้นหาแบบเต็ม (`discovery.mdns.mode: "full"`; ค่าเริ่มต้นคือ `"minimal"` ซึ่งจะละเว้นค่าเหล่านี้ — จากนั้นไคลเอนต์จะตั้งค่าเริ่มต้นของเป้าหมาย SSH เป็นพอร์ต `22`)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  ระยะหมดเวลาต่อคำสั่ง (เรียกดู/แก้ไข)
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้ (และปิดใช้งานการจัดรูปแบบ/ตัวหมุนด้วย)
</ParamField>

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- สแกน `local.` รวมถึงโดเมนบริเวณกว้างที่กำหนดค่าไว้เมื่อเปิดใช้
- `wsUrl` ในเอาต์พุต JSON ได้มาจากปลายทางบริการที่แก้ไขแล้ว ไม่ใช่จากคำใบ้ที่มาจาก TXT เท่านั้น เช่น `lanHost` หรือ `tailnetDns`
- `discovery.mdns.mode` ควบคุมการเผยแพร่ `sshPort`/`cliPath` ทั้งบน mDNS ของ `local.` และ DNS-SD บริเวณกว้าง (ดูด้านบน)

</Note>

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [คู่มือการปฏิบัติงาน Gateway](/th/gateway)
