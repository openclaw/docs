---
read_when:
    - การติดตั้งใหม่ การเริ่มต้นใช้งานค้าง หรือข้อผิดพลาดในการรันครั้งแรก
    - การเลือกวิธีการยืนยันตัวตนและการสมัครใช้งานผู้ให้บริการ
    - เข้าถึง docs.openclaw.ai ไม่ได้ เปิดแดชบอร์ดไม่ได้ การติดตั้งค้าง
sidebarTitle: First-run FAQ
summary: 'คำถามที่พบบ่อย: การเริ่มต้นใช้งานด่วนและการตั้งค่าการใช้งานครั้งแรก — ติดตั้ง, เริ่มต้นใช้งาน, ยืนยันตัวตน, การสมัครใช้งาน, ความล้มเหลวเริ่มต้น'
title: 'คำถามที่พบบ่อย: การตั้งค่าเมื่อเรียกใช้ครั้งแรก'
x-i18n:
    generated_at: "2026-05-10T19:41:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: f19f755d41dc09c17e20845487037d1edc338d0edff5fc0190973f3d72a7f0ab
    source_path: help/faq-first-run.md
    workflow: 16
---

  ถาม-ตอบสำหรับการเริ่มต้นอย่างรวดเร็วและการรันครั้งแรก สำหรับการใช้งานประจำวัน โมเดล การตรวจสอบสิทธิ์ เซสชัน
  และการแก้ไขปัญหา โปรดดู [คำถามที่พบบ่อย](/th/help/faq) หลัก

  ## การเริ่มต้นอย่างรวดเร็วและการตั้งค่าการรันครั้งแรก

  <AccordionGroup>
  <Accordion title="ฉันติดอยู่ วิธีที่เร็วที่สุดในการแก้ให้ไปต่อได้">
    ใช้เอเจนต์ AI ในเครื่องที่สามารถ **เห็นเครื่องของคุณ** ได้ วิธีนี้มีประสิทธิภาพมากกว่าการถาม
    ใน Discord มาก เพราะกรณี "ฉันติดอยู่" ส่วนใหญ่เป็น **ปัญหาการกำหนดค่าหรือสภาพแวดล้อมในเครื่อง** ที่
    ผู้ช่วยระยะไกลตรวจสอบไม่ได้

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    เครื่องมือเหล่านี้อ่าน repo, รันคำสั่ง, ตรวจสอบล็อก และช่วยแก้การตั้งค่าระดับเครื่องของคุณ
    (PATH, บริการ, สิทธิ์, ไฟล์การตรวจสอบสิทธิ์) ได้ ให้เครื่องมือเหล่านี้เข้าถึง **ซอร์ส checkout แบบเต็ม** ผ่าน
    การติดตั้งแบบปรับแก้ได้ (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    วิธีนี้ติดตั้ง OpenClaw **จาก git checkout** เพื่อให้เอเจนต์อ่านโค้ด + เอกสาร และ
    วิเคราะห์เวอร์ชันจริงที่คุณกำลังรันอยู่ได้ คุณสามารถสลับกลับไปใช้เวอร์ชันเสถียรในภายหลังได้เสมอ
    โดยรันตัวติดตั้งอีกครั้งโดยไม่ใส่ `--install-method git`

    เคล็ดลับ: ขอให้เอเจนต์ **วางแผนและควบคุม** การแก้ไข (ทีละขั้นตอน) แล้วจึงรันเฉพาะ
    คำสั่งที่จำเป็น วิธีนี้ทำให้การเปลี่ยนแปลงเล็กและตรวจสอบย้อนหลังได้ง่ายขึ้น

    หากคุณพบข้อบกพร่องจริงหรือมีวิธีแก้ โปรดเปิด issue บน GitHub หรือส่ง PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    เริ่มด้วยคำสั่งเหล่านี้ (ส่งผลลัพธ์มาด้วยเมื่อขอความช่วยเหลือ):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    คำสั่งเหล่านี้ทำอะไร:

    - `openclaw status`: ภาพรวมแบบเร็วของสุขภาพ Gateway/เอเจนต์ + การกำหนดค่าพื้นฐาน
    - `openclaw models status`: ตรวจสอบการตรวจสอบสิทธิ์ของผู้ให้บริการ + ความพร้อมใช้งานของโมเดล
    - `openclaw doctor`: ตรวจสอบความถูกต้องและซ่อมปัญหาการกำหนดค่า/สถานะที่พบบ่อย

    การตรวจสอบ CLI อื่นที่มีประโยชน์: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`

    ลูปดีบักด่วน: [60 วินาทีแรกเมื่อมีบางอย่างเสีย](/th/help/faq#first-60-seconds-if-something-is-broken).
    เอกสารการติดตั้ง: [ติดตั้ง](/th/install), [แฟล็กตัวติดตั้ง](/th/install/installer), [การอัปเดต](/th/install/updating).

  </Accordion>

  <Accordion title="Heartbeat ข้ามอยู่เรื่อย ๆ เหตุผลการข้ามหมายความว่าอย่างไร?">
    เหตุผลทั่วไปที่ Heartbeat ถูกข้าม:

    - `quiet-hours`: อยู่นอกหน้าต่างเวลา active-hours ที่กำหนดไว้
    - `empty-heartbeat-file`: มี `HEARTBEAT.md` อยู่ แต่มีเพียงโครงเปล่า/เฉพาะหัวข้อเท่านั้น
    - `no-tasks-due`: โหมดงานของ `HEARTBEAT.md` เปิดอยู่ แต่ยังไม่มีช่วงเวลาของงานใดถึงกำหนด
    - `alerts-disabled`: การแสดงผล Heartbeat ทั้งหมดถูกปิด (`showOk`, `showAlerts`, และ `useIndicator` ปิดทั้งหมด)

    ในโหมดงาน timestamp ครบกำหนดจะถูกเลื่อนไปข้างหน้าเฉพาะหลังจากการรัน Heartbeat จริง
    เสร็จสมบูรณ์เท่านั้น การรันที่ถูกข้ามจะไม่ทำเครื่องหมายว่างานเสร็จแล้ว

    เอกสาร: [Heartbeat](/th/gateway/heartbeat), [ระบบอัตโนมัติและงาน](/th/automation).

  </Accordion>

  <Accordion title="วิธีที่แนะนำในการติดตั้งและตั้งค่า OpenClaw">
    repo แนะนำให้รันจากซอร์สและใช้การเริ่มต้นใช้งาน:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    วิซาร์ดยังสามารถ build แอสเซ็ต UI ให้อัตโนมัติได้ด้วย หลังเริ่มต้นใช้งาน โดยทั่วไปคุณจะรัน Gateway บนพอร์ต **18789**

    จากซอร์ส (ผู้มีส่วนร่วม/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    หากคุณยังไม่มีการติดตั้งแบบ global ให้รันผ่าน `pnpm openclaw onboard`

  </Accordion>

  <Accordion title="ฉันจะเปิดแดชบอร์ดหลังเริ่มต้นใช้งานได้อย่างไร?">
    วิซาร์ดจะเปิดเบราว์เซอร์ของคุณด้วย URL แดชบอร์ดแบบสะอาด (ไม่มีโทเค็นใน URL) ทันทีหลังเริ่มต้นใช้งาน และยังพิมพ์ลิงก์ในสรุปด้วย เปิดแท็บนั้นค้างไว้ หากไม่ได้เปิดขึ้นมา ให้คัดลอก/วาง URL ที่พิมพ์ไว้บนเครื่องเดียวกัน
  </Accordion>

  <Accordion title="ฉันจะยืนยันตัวตนแดชบอร์ดบน localhost กับระยะไกลได้อย่างไร?">
    **Localhost (เครื่องเดียวกัน):**

    - เปิด `http://127.0.0.1:18789/`
    - หากระบบขอการตรวจสอบสิทธิ์ด้วยข้อมูลลับร่วม ให้วางโทเค็นหรือรหัสผ่านที่กำหนดไว้ในตั้งค่า Control UI
    - แหล่งที่มาของโทเค็น: `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
    - แหล่งที่มาของรหัสผ่าน: `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
    - หากยังไม่ได้กำหนดข้อมูลลับร่วม ให้สร้างโทเค็นด้วย `openclaw doctor --generate-gateway-token`

    **ไม่ใช่บน localhost:**

    - **Tailscale Serve** (แนะนำ): คงการ bind เป็น loopback, รัน `openclaw gateway --tailscale serve`, เปิด `https://<magicdns>/` หาก `gateway.auth.allowTailscale` เป็น `true` เฮดเดอร์ตัวตนจะผ่านการตรวจสอบสิทธิ์ Control UI/WebSocket ได้ (ไม่ต้องวางข้อมูลลับร่วม ถือว่าโฮสต์ Gateway เชื่อถือได้); HTTP APIs ยังต้องใช้การตรวจสอบสิทธิ์ด้วยข้อมูลลับร่วม เว้นแต่คุณตั้งใจใช้ private-ingress แบบ `none` หรือการตรวจสอบสิทธิ์ HTTP แบบ trusted-proxy
      การพยายามตรวจสอบสิทธิ์ Serve พร้อมกันแต่ล้มเหลวจากไคลเอนต์เดียวกันจะถูกจัดลำดับก่อนที่ตัวจำกัดการตรวจสอบสิทธิ์ล้มเหลวจะบันทึกไว้ ดังนั้นการลองใหม่ผิดครั้งที่สองอาจแสดง `retry later` ได้แล้ว
    - **การ bind กับ tailnet**: รัน `openclaw gateway --bind tailnet --token "<token>"` (หรือกำหนดค่าการตรวจสอบสิทธิ์ด้วยรหัสผ่าน), เปิด `http://<tailscale-ip>:18789/`, แล้ววางข้อมูลลับร่วมที่ตรงกันในการตั้งค่าแดชบอร์ด
    - **รีเวิร์สพร็อกซีที่รับรู้ตัวตน**: วาง Gateway ไว้หลังพร็อกซีที่เชื่อถือได้, กำหนด `gateway.auth.mode: "trusted-proxy"`, แล้วเปิด URL ของพร็อกซี พร็อกซี loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/` การตรวจสอบสิทธิ์ด้วยข้อมูลลับร่วมยังมีผลผ่าน tunnel; วางโทเค็นหรือรหัสผ่านที่กำหนดไว้หากระบบถาม

    ดู [แดชบอร์ด](/th/web/dashboard) และ [พื้นผิวเว็บ](/th/web) สำหรับโหมด bind และรายละเอียดการตรวจสอบสิทธิ์

  </Accordion>

  <Accordion title="ทำไมจึงมีการกำหนดค่า exec approval สองรายการสำหรับการอนุมัติผ่านแชต?">
    ทั้งสองรายการควบคุมคนละชั้น:

    - `approvals.exec`: ส่งต่อพรอมป์การอนุมัติไปยังปลายทางแชต
    - `channels.<channel>.execApprovals`: ทำให้ช่องทางนั้นทำหน้าที่เป็นไคลเอนต์อนุมัติแบบ native สำหรับ exec approval

    นโยบาย exec ของโฮสต์ยังเป็นด่านอนุมัติจริง การกำหนดค่าแชตควบคุมเพียงว่า
    พรอมป์การอนุมัติจะแสดงที่ใด และผู้คนจะตอบได้อย่างไร

    ในการตั้งค่าส่วนใหญ่ คุณ **ไม่** จำเป็นต้องใช้ทั้งสองอย่าง:

    - หากแชตรองรับคำสั่งและการตอบกลับอยู่แล้ว คำสั่ง `/approve` ในแชตเดียวกันจะทำงานผ่านเส้นทางที่ใช้ร่วมกัน
    - หากช่องทาง native ที่รองรับสามารถอนุมานผู้อนุมัติได้อย่างปลอดภัย OpenClaw จะเปิดการอนุมัติแบบ native ที่เริ่มจาก DM ให้อัตโนมัติเมื่อ `channels.<channel>.execApprovals.enabled` ไม่ได้ตั้งค่าไว้หรือเป็น `"auto"`
    - เมื่อมีการ์ด/ปุ่มอนุมัติแบบ native พร้อมใช้งาน UI แบบ native นั้นคือเส้นทางหลัก; เอเจนต์ควรใส่คำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือบอกว่าการอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบ manual เป็นเส้นทางเดียว
    - ใช้ `approvals.exec` เฉพาะเมื่อพรอมป์ต้องถูกส่งต่อไปยังแชตอื่นหรือห้องปฏิบัติการที่ระบุชัดเจนด้วย
    - ใช้ `channels.<channel>.execApprovals.target: "channel"` หรือ `"both"` เฉพาะเมื่อคุณต้องการให้พรอมป์การอนุมัติถูกโพสต์กลับไปยังห้อง/หัวข้อเดิมอย่างชัดเจน
    - การอนุมัติ Plugin แยกออกไปอีกชั้น: โดยค่าเริ่มต้นใช้ `/approve` ในแชตเดียวกัน, มีการส่งต่อ `approvals.plugin` แบบเลือกได้, และมีเฉพาะบางช่องทาง native ที่ยังคงการจัดการ plugin-approval-native ไว้ด้านบน

    สรุปสั้น ๆ: การส่งต่อมีไว้สำหรับการกำหนดเส้นทาง ส่วนการกำหนดค่าไคลเอนต์ native มีไว้สำหรับ UX เฉพาะช่องทางที่สมบูรณ์กว่า
    ดู [การอนุมัติ Exec](/th/tools/exec-approvals).

  </Accordion>

  <Accordion title="ฉันต้องใช้รันไทม์อะไร?">
    ต้องใช้ Node **>= 22** แนะนำให้ใช้ `pnpm` ไม่แนะนำให้ใช้ Bun สำหรับ Gateway
  </Accordion>

  <Accordion title="รันบน Raspberry Pi ได้ไหม?">
    ได้ Gateway ใช้ทรัพยากรน้อย - เอกสารระบุว่า **RAM 512MB-1GB**, **1 คอร์**, และดิสก์ประมาณ **500MB**
    เพียงพอสำหรับการใช้งานส่วนตัว และระบุว่า **Raspberry Pi 4 สามารถรันได้**

    หากคุณต้องการพื้นที่เผื่อเพิ่มเติม (ล็อก, สื่อ, บริการอื่น ๆ), **แนะนำ 2GB** แต่
    ไม่ใช่ขั้นต่ำตายตัว

    เคล็ดลับ: Pi/VPS ขนาดเล็กสามารถโฮสต์ Gateway ได้ และคุณสามารถจับคู่ **โหนด** บนแล็ปท็อป/โทรศัพท์สำหรับ
    หน้าจอ/กล้อง/แคนวาสในเครื่อง หรือการรันคำสั่ง ดู [โหนด](/th/nodes).

  </Accordion>

  <Accordion title="มีคำแนะนำสำหรับการติดตั้งบน Raspberry Pi ไหม?">
    สรุปสั้น ๆ: ใช้งานได้ แต่คาดว่าจะมีจุดที่ยังไม่เรียบร้อยอยู่บ้าง

    - ใช้ OS แบบ **64-bit** และคง Node >= 22
    - เลือกใช้ **การติดตั้งแบบปรับแก้ได้ (git)** เพื่อให้คุณดูล็อกและอัปเดตได้เร็ว
    - เริ่มโดยยังไม่เปิดช่องทาง/Skills แล้วค่อยเพิ่มทีละรายการ
    - หากเจอปัญหาไบนารีแปลก ๆ โดยปกติคือปัญหา **ความเข้ากันได้กับ ARM**

    เอกสาร: [Linux](/th/platforms/linux), [ติดตั้ง](/th/install).

  </Accordion>

  <Accordion title="ค้างที่ปลุกเพื่อนของฉัน / การเริ่มต้นใช้งานไม่ยอมฟักตัว ต้องทำอย่างไร?">
    หน้าจอนั้นขึ้นอยู่กับว่า Gateway เข้าถึงได้และตรวจสอบสิทธิ์แล้ว TUI ยังส่ง
    "ตื่นได้แล้ว เพื่อนของฉัน!" โดยอัตโนมัติในการฟักตัวครั้งแรกด้วย หากคุณเห็นบรรทัดนั้นพร้อม **ไม่มีการตอบกลับ**
    และโทเค็นยังอยู่ที่ 0 แปลว่าเอเจนต์ไม่เคยรัน

    1. รีสตาร์ต Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. ตรวจสอบสถานะ + การตรวจสอบสิทธิ์:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. หากยังค้างอยู่ ให้รัน:

    ```bash
    openclaw doctor
    ```

    หาก Gateway อยู่ระยะไกล ตรวจสอบให้แน่ใจว่า tunnel/การเชื่อมต่อ Tailscale ทำงานอยู่ และ UI
    ชี้ไปยัง Gateway ที่ถูกต้อง ดู [การเข้าถึงระยะไกล](/th/gateway/remote).

  </Accordion>

  <Accordion title="ฉันย้ายการตั้งค่าไปยังเครื่องใหม่ (Mac mini) โดยไม่ต้องเริ่มต้นใช้งานใหม่ได้ไหม?">
    ได้ คัดลอก **ไดเรกทอรีสถานะ** และ **เวิร์กสเปซ** แล้วรัน Doctor หนึ่งครั้ง วิธีนี้
    ทำให้บอตของคุณ "เหมือนเดิมทุกอย่าง" (หน่วยความจำ, ประวัติเซสชัน, การตรวจสอบสิทธิ์, และสถานะช่องทาง)
    ตราบใดที่คุณคัดลอก **ทั้งสอง** ตำแหน่ง:

    1. ติดตั้ง OpenClaw บนเครื่องใหม่
    2. คัดลอก `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`) จากเครื่องเก่า
    3. คัดลอกเวิร์กสเปซของคุณ (ค่าเริ่มต้น: `~/.openclaw/workspace`)
    4. รัน `openclaw doctor` และรีสตาร์ตบริการ Gateway

    วิธีนี้จะคงการกำหนดค่า, โปรไฟล์การตรวจสอบสิทธิ์, ข้อมูลประจำตัว WhatsApp, เซสชัน, และหน่วยความจำไว้ หากคุณอยู่ใน
    โหมดระยะไกล โปรดจำว่าโฮสต์ Gateway เป็นเจ้าของที่เก็บเซสชันและเวิร์กสเปซ

    **สำคัญ:** หากคุณเพียง commit/push เวิร์กสเปซของคุณไปที่ GitHub คุณกำลังสำรอง
    **หน่วยความจำ + ไฟล์ bootstrap** แต่ **ไม่ใช่** ประวัติเซสชันหรือการตรวจสอบสิทธิ์ สิ่งเหล่านั้นอยู่
    ใต้ `~/.openclaw/` (เช่น `~/.openclaw/agents/<agentId>/sessions/`)

    ที่เกี่ยวข้อง: [การย้ายระบบ](/th/install/migrating), [สิ่งต่าง ๆ อยู่ที่ไหนบนดิสก์](/th/help/faq#where-things-live-on-disk),
    [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace), [Doctor](/th/gateway/doctor),
    [โหมดระยะไกล](/th/gateway/remote).

  </Accordion>

  <Accordion title="ฉันจะดูว่ามีอะไรใหม่ในเวอร์ชันล่าสุดได้ที่ไหน?">
    ดู changelog บน GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    รายการใหม่ล่าสุดอยู่ด้านบน หากส่วนบนสุดถูกทำเครื่องหมายว่า **ยังไม่เผยแพร่** ส่วนถัดไปที่มีวันที่
    คือเวอร์ชันล่าสุดที่เผยแพร่แล้ว รายการถูกจัดกลุ่มตาม **ไฮไลต์**, **การเปลี่ยนแปลง**, และ
    **การแก้ไข** (รวมถึงส่วนเอกสาร/อื่น ๆ เมื่อจำเป็น)

  </Accordion>

  <Accordion title="เข้าถึง docs.openclaw.ai ไม่ได้ (ข้อผิดพลาด SSL)">
    การเชื่อมต่อ Comcast/Xfinity บางรายการบล็อก `docs.openclaw.ai` อย่างไม่ถูกต้องผ่าน Xfinity
    Advanced Security ให้ปิดฟีเจอร์นั้นหรือเพิ่ม `docs.openclaw.ai` ในรายการอนุญาต แล้วลองใหม่
    โปรดช่วยเราแก้การบล็อกนี้โดยรายงานที่นี่: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    หากคุณยังเข้าถึงเว็บไซต์ไม่ได้ เอกสารจะถูก mirror ไว้บน GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="ความแตกต่างระหว่าง stable และ beta">
    **Stable** และ **beta** คือ **npm dist-tags** ไม่ใช่สายโค้ดที่แยกกัน:

    - `latest` = stable
    - `beta` = build ระยะแรกสำหรับการทดสอบ

    โดยปกติ release แบบ stable จะลงที่ **beta** ก่อน จากนั้นขั้นตอน
    promotion แบบชัดเจนจะย้ายเวอร์ชันเดียวกันนั้นไปที่ `latest` ผู้ดูแลยังสามารถ
    publish ตรงไปที่ `latest` ได้เมื่อจำเป็น นี่คือเหตุผลที่ beta และ stable อาจ
    ชี้ไปที่ **เวอร์ชันเดียวกัน** หลังจาก promotion

    ดูสิ่งที่เปลี่ยนแปลง:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    สำหรับคำสั่งติดตั้งแบบ one-liner และความแตกต่างระหว่าง beta กับ dev โปรดดู accordion ด้านล่าง

  </Accordion>

  <Accordion title="ฉันจะติดตั้งเวอร์ชัน beta ได้อย่างไร และ beta แตกต่างจาก dev อย่างไร?">
    **Beta** คือ npm dist-tag `beta` (อาจตรงกับ `latest` หลังจาก promotion)
    **Dev** คือหัวที่เคลื่อนที่ของ `main` (git); เมื่อ publish จะใช้ npm dist-tag `dev`

    One-liner (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    ตัวติดตั้ง Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    รายละเอียดเพิ่มเติม: [ช่องทางการพัฒนา](/th/install/development-channels) และ [แฟล็กของตัวติดตั้ง](/th/install/installer).

  </Accordion>

  <Accordion title="ฉันจะลอง bits ล่าสุดได้อย่างไร?">
    มีสองตัวเลือก:

    1. **ช่องทาง Dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    คำสั่งนี้จะสลับไปยัง branch `main` และอัปเดตจาก source

    2. **การติดตั้งแบบแก้ไขได้ (จากเว็บไซต์ตัวติดตั้ง):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    วิธีนี้ให้ repo ในเครื่องที่คุณแก้ไขได้ แล้วจึงอัปเดตผ่าน git

    หากคุณต้องการ clone ใหม่แบบสะอาดด้วยตนเอง ให้ใช้:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [ช่องทางการพัฒนา](/th/install/development-channels),
    [ติดตั้ง](/th/install).

  </Accordion>

  <Accordion title="การติดตั้งและ onboarding โดยปกติใช้เวลานานแค่ไหน?">
    คำแนะนำคร่าว ๆ:

    - **ติดตั้ง:** 2-5 นาที
    - **Onboarding:** 5-15 นาที ขึ้นอยู่กับจำนวนช่องทาง/โมเดลที่คุณกำหนดค่า

    หากค้าง ให้ใช้ [ตัวติดตั้งค้าง](#quick-start-and-first-run-setup)
    และวงจร debug อย่างรวดเร็วใน [ฉันติดขัด](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="ตัวติดตั้งค้าง? ฉันจะรับ feedback เพิ่มเติมได้อย่างไร?">
    รันตัวติดตั้งอีกครั้งด้วย **output แบบละเอียด**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    ติดตั้ง Beta พร้อม output แบบละเอียด:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    สำหรับการติดตั้งแบบแก้ไขได้ (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    คำสั่งเทียบเท่าบน Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    ตัวเลือกเพิ่มเติม: [แฟล็กของตัวติดตั้ง](/th/install/installer).

  </Accordion>

  <Accordion title="การติดตั้งบน Windows บอกว่าไม่พบ git หรือไม่รู้จัก openclaw">
    ปัญหา Windows ที่พบบ่อยมีสองอย่าง:

    **1) npm error spawn git / ไม่พบ git**

    - ติดตั้ง **Git for Windows** และตรวจสอบให้แน่ใจว่า `git` อยู่ใน PATH ของคุณ
    - ปิดและเปิด PowerShell ใหม่ แล้วรันตัวติดตั้งอีกครั้ง

    **2) ไม่รู้จัก openclaw หลังติดตั้ง**

    - โฟลเดอร์ npm global bin ของคุณไม่ได้อยู่ใน PATH
    - ตรวจสอบ path:

      ```powershell
      npm config get prefix
      ```

    - เพิ่ม directory นั้นใน user PATH ของคุณ (บน Windows ไม่ต้องมี suffix `\bin`; บนระบบส่วนใหญ่จะเป็น `%AppData%\npm`)
    - ปิดและเปิด PowerShell ใหม่หลังจากอัปเดต PATH

    หากคุณต้องการการตั้งค่า Windows ที่ราบรื่นที่สุด ให้ใช้ **WSL2** แทน Windows แบบ native
    เอกสาร: [Windows](/th/platforms/windows).

  </Accordion>

  <Accordion title="output ของ exec บน Windows แสดงข้อความภาษาจีนเพี้ยน - ควรทำอย่างไร?">
    โดยปกติปัญหานี้เกิดจาก console code page ไม่ตรงกันบน shell ของ Windows แบบ native

    อาการ:

    - output ของ `system.run`/`exec` แสดงภาษาจีนเป็น mojibake
    - คำสั่งเดียวกันดูถูกต้องใน terminal profile อื่น

    วิธีแก้ชั่วคราวอย่างรวดเร็วใน PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    จากนั้น restart Gateway แล้วลองคำสั่งของคุณอีกครั้ง:

    ```powershell
    openclaw gateway restart
    ```

    หากคุณยัง reproduce ปัญหานี้บน OpenClaw ล่าสุดได้ ให้ติดตาม/รายงานใน:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="เอกสารไม่ได้ตอบคำถามของฉัน - ฉันจะได้คำตอบที่ดีกว่าได้อย่างไร?">
    ใช้ **การติดตั้งแบบแก้ไขได้ (git)** เพื่อให้คุณมี source และเอกสารทั้งหมดในเครื่อง จากนั้นถาม
    bot ของคุณ (หรือ Claude/Codex) _จากโฟลเดอร์นั้น_ เพื่อให้สามารถอ่าน repo และตอบได้อย่างแม่นยำ

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    รายละเอียดเพิ่มเติม: [ติดตั้ง](/th/install) และ [แฟล็กของตัวติดตั้ง](/th/install/installer).

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน Linux ได้อย่างไร?">
    คำตอบสั้น ๆ: ทำตามคู่มือ Linux แล้วรัน onboarding

    - เส้นทางด่วนบน Linux + การติดตั้ง service: [Linux](/th/platforms/linux).
    - walkthrough แบบเต็ม: [เริ่มต้นใช้งาน](/th/start/getting-started).
    - ตัวติดตั้ง + การอัปเดต: [ติดตั้งและอัปเดต](/th/install/updating).

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน VPS ได้อย่างไร?">
    VPS ที่เป็น Linux ใด ๆ ก็ใช้ได้ ติดตั้งบน server แล้วใช้ SSH/Tailscale เพื่อเข้าถึง Gateway

    คู่มือ: [exe.dev](/th/install/exe-dev), [Hetzner](/th/install/hetzner), [Fly.io](/th/install/fly).
    การเข้าถึงจากระยะไกล: [Gateway ระยะไกล](/th/gateway/remote).

  </Accordion>

  <Accordion title="คู่มือการติดตั้งบน cloud/VPS อยู่ที่ไหน?">
    เรามี **hosting hub** ที่รวม provider ทั่วไปไว้ เลือกหนึ่งรายการแล้วทำตามคู่มือ:

    - [VPS hosting](/th/vps) (provider ทั้งหมดในที่เดียว)
    - [Fly.io](/th/install/fly)
    - [Hetzner](/th/install/hetzner)
    - [exe.dev](/th/install/exe-dev)

    วิธีทำงานบน cloud: **Gateway รันบน server** และคุณเข้าถึงได้
    จาก laptop/phone ผ่าน Control UI (หรือ Tailscale/SSH) state + workspace ของคุณ
    อยู่บน server ดังนั้นให้ถือว่า host เป็น source of truth และสำรองข้อมูลไว้

    คุณสามารถจับคู่ **Node** (Mac/iOS/Android/headless) กับ Gateway บน cloud นั้นเพื่อเข้าถึง
    screen/camera/canvas ในเครื่อง หรือรันคำสั่งบน laptop ของคุณ ขณะที่ยังคงให้
    Gateway อยู่บน cloud

    Hub: [แพลตฟอร์ม](/th/platforms). การเข้าถึงจากระยะไกล: [Gateway ระยะไกล](/th/gateway/remote).
    Node: [Node](/th/nodes), [Node CLI](/th/cli/nodes).

  </Accordion>

  <Accordion title="ฉันขอให้ OpenClaw อัปเดตตัวเองได้ไหม?">
    คำตอบสั้น ๆ: **ทำได้ แต่ไม่แนะนำ** flow การอัปเดตอาจ restart
    Gateway (ซึ่งจะตัด session ที่ใช้งานอยู่), อาจต้องใช้ git checkout ที่สะอาด และ
    อาจ prompt ให้ยืนยัน ปลอดภัยกว่า: รันการอัปเดตจาก shell ในฐานะ operator

    ใช้ CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    หากคุณจำเป็นต้อง automate จาก agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [การอัปเดต](/th/install/updating).

  </Accordion>

  <Accordion title="onboarding ทำอะไรจริง ๆ?">
    `openclaw onboard` คือเส้นทางการตั้งค่าที่แนะนำ ใน **local mode** จะพาคุณผ่าน:

    - **การตั้งค่าโมเดล/auth** (provider OAuth, API keys, Anthropic setup-token รวมถึงตัวเลือกโมเดลในเครื่อง เช่น LM Studio)
    - ตำแหน่ง **Workspace** + bootstrap files
    - **การตั้งค่า Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage รวมถึง Plugin ช่องทางที่ bundled มา เช่น QQ Bot)
    - **การติดตั้ง Daemon** (LaunchAgent บน macOS; systemd user unit บน Linux/WSL2)
    - **Health checks** และการเลือก **skills**

    นอกจากนี้ยังเตือนหากโมเดลที่คุณกำหนดค่าไว้ไม่เป็นที่รู้จักหรือไม่มี auth

  </Accordion>

  <Accordion title="ฉันต้องมี subscription ของ Claude หรือ OpenAI เพื่อรันสิ่งนี้ไหม?">
    ไม่จำเป็น คุณสามารถรัน OpenClaw ด้วย **API keys** (Anthropic/OpenAI/อื่น ๆ) หรือด้วย
    **โมเดลแบบ local-only** เพื่อให้ข้อมูลของคุณอยู่บนอุปกรณ์ของคุณ subscription (Claude
    Pro/Max หรือ OpenAI Codex) เป็นวิธี optional ในการ authenticate provider เหล่านั้น

    สำหรับ Anthropic ใน OpenClaw การแบ่งในทางปฏิบัติคือ:

    - **Anthropic API key**: การคิดเงิน Anthropic API ปกติ
    - **Claude CLI / Claude subscription auth ใน OpenClaw**: staff ของ Anthropic
      แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง และ OpenClaw ถือว่าการใช้งาน `claude -p`
      ได้รับอนุมัติสำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่ policy ใหม่

    สำหรับ host Gateway ที่ใช้งานระยะยาว Anthropic API keys ยังคงเป็นการตั้งค่าที่
    คาดการณ์ได้มากกว่า OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือภายนอก
    เช่น OpenClaw

    OpenClaw ยังรองรับตัวเลือก hosted แบบ subscription-style อื่น ๆ รวมถึง
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** และ
    **Z.AI / GLM Coding Plan**.

    เอกสาร: [Anthropic](/th/providers/anthropic), [OpenAI](/th/providers/openai),
    [Qwen Cloud](/th/providers/qwen),
    [MiniMax](/th/providers/minimax), [GLM Models](/th/providers/glm),
    [โมเดลในเครื่อง](/th/gateway/local-models), [โมเดล](/th/concepts/models).

  </Accordion>

  <Accordion title="ฉันใช้ Claude Max subscription โดยไม่มี API key ได้ไหม?">
    ได้

    staff ของ Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw-style ได้รับอนุญาตอีกครั้ง ดังนั้น
    OpenClaw จึงถือว่า Claude subscription auth และการใช้งาน `claude -p` ได้รับอนุมัติ
    สำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่ policy ใหม่ หากคุณต้องการ
    การตั้งค่า server-side ที่คาดการณ์ได้มากที่สุด ให้ใช้ Anthropic API key แทน

  </Accordion>

  <Accordion title="คุณรองรับ Claude subscription auth (Claude Pro หรือ Max) หรือไม่?">
    รองรับ

    staff ของ Anthropic แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
    การ reuse Claude CLI และการใช้งาน `claude -p` ได้รับอนุมัติสำหรับ integration นี้
    เว้นแต่ Anthropic จะเผยแพร่ policy ใหม่

    Anthropic setup-token ยังคงพร้อมใช้งานในฐานะเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw ชอบ reuse Claude CLI และ `claude -p` มากกว่าเมื่อพร้อมใช้งาน
    สำหรับ workload แบบ production หรือ multi-user การ auth ด้วย Anthropic API key ยังคงเป็น
    ตัวเลือกที่ปลอดภัยกว่าและคาดการณ์ได้มากกว่า หากคุณต้องการตัวเลือก hosted
    แบบ subscription-style อื่นใน OpenClaw โปรดดู [OpenAI](/th/providers/openai), [Qwen / Model
    Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax), และ [GLM
    Models](/th/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="ทำไมฉันจึงเห็น HTTP 429 rate_limit_error จาก Anthropic?">
    นั่นหมายความว่า **quota/rate limit ของ Anthropic** ของคุณหมดสำหรับช่วงเวลาปัจจุบัน หากคุณ
    ใช้ **Claude CLI** ให้รอให้ช่วงเวลานั้น reset หรือ upgrade plan ของคุณ หากคุณ
    ใช้ **Anthropic API key** ให้ตรวจสอบ Anthropic Console
    สำหรับการใช้งาน/การเรียกเก็บเงิน และเพิ่ม limit ตามที่จำเป็น

    หากข้อความระบุเฉพาะว่า:
    `Extra usage is required for long context requests` แสดงว่าคำขอกำลังพยายามใช้
    Anthropic 1M context beta (`context1m: true`) ซึ่งจะทำงานได้ก็ต่อเมื่อ
    ข้อมูลรับรองของคุณมีสิทธิ์สำหรับการคิดค่าบริบทขนาดยาว (การเรียกเก็บเงินด้วย API key หรือ
    เส้นทาง OpenClaw Claude-login ที่เปิดใช้ Extra Usage)

    เคล็ดลับ: ตั้งค่า **โมเดลสำรอง** เพื่อให้ OpenClaw ยังตอบกลับได้เมื่อผู้ให้บริการถูกจำกัดอัตราการใช้งาน
    ดู [โมเดล](/th/cli/models), [OAuth](/th/concepts/oauth) และ
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/th/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)

  </Accordion>

  <Accordion title="รองรับ AWS Bedrock หรือไม่?">
    ใช่ OpenClaw มีผู้ให้บริการ **Amazon Bedrock (Converse)** ที่มาพร้อมในชุด เมื่อมีเครื่องหมาย env ของ AWS อยู่ OpenClaw จะค้นพบแค็ตตาล็อก Bedrock แบบสตรีม/ข้อความโดยอัตโนมัติ และผสานเป็นผู้ให้บริการ `amazon-bedrock` โดยนัยได้ มิฉะนั้นคุณสามารถเปิดใช้ `plugins.entries.amazon-bedrock.config.discovery.enabled` อย่างชัดเจน หรือเพิ่มรายการผู้ให้บริการด้วยตนเอง ดู [Amazon Bedrock](/th/providers/bedrock) และ [ผู้ให้บริการโมเดล](/th/providers/models) หากคุณต้องการโฟลว์คีย์แบบมีการจัดการ พร็อกซีที่เข้ากันได้กับ OpenAI หน้า Bedrock ก็ยังเป็นตัวเลือกที่ใช้ได้
  </Accordion>

  <Accordion title="การยืนยันตัวตนของ Codex ทำงานอย่างไร?">
    OpenClaw รองรับ **OpenAI Code (Codex)** ผ่าน OAuth (การลงชื่อเข้าใช้ ChatGPT) ใช้
    `openai/gpt-5.5` สำหรับการตั้งค่าทั่วไป: การยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex พร้อม
    การเรียกใช้งานเซิร์ฟเวอร์แอป Codex แบบเนทีฟ refs โมเดล `openai-codex/gpt-*` เป็น
    การตั้งค่าเก่าที่ซ่อมแซมโดย `openclaw doctor --fix` การเข้าถึงด้วย OpenAI API-key
    โดยตรงยังคงใช้ได้สำหรับพื้นผิว OpenAI API ที่ไม่ใช่ agent และสำหรับโมเดล agent
    ผ่านโปรไฟล์ API-key `openai-codex` ที่จัดลำดับไว้
    ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers) และ [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
  </Accordion>

  <Accordion title="ทำไม OpenClaw ยังกล่าวถึง openai-codex?">
    `openai-codex` คือรหัสผู้ให้บริการและโปรไฟล์การยืนยันตัวตนสำหรับ ChatGPT/Codex OAuth
    การตั้งค่าเก่ายังเคยใช้เป็นคำนำหน้าโมเดลด้วย:

    - `openai/gpt-5.5` = การยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟสำหรับรอบของ agent
    - `openai-codex/gpt-5.5` = เส้นทางโมเดลเก่าที่ซ่อมแซมโดย `openclaw doctor --fix`
    - `openai/gpt-5.5` บวกกับโปรไฟล์ API-key `openai-codex` ที่จัดลำดับไว้ = การยืนยันตัวตนด้วย API-key สำหรับโมเดล agent ของ OpenAI
    - `openai-codex:...` = รหัสโปรไฟล์การยืนยันตัวตน ไม่ใช่ model ref

    หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform โดยตรง ให้ตั้งค่า
    `OPENAI_API_KEY` หากคุณต้องการการยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex ให้ลงชื่อเข้าใช้ด้วย
    `openclaw models auth login --provider openai-codex` ให้คง model ref เป็น
    `openai/gpt-5.5`; model refs `openai-codex/*` เป็นการตั้งค่าเก่าที่
    `openclaw doctor --fix` จะเขียนใหม่

  </Accordion>

  <Accordion title="ทำไมขีดจำกัด Codex OAuth จึงต่างจาก ChatGPT web ได้?">
    Codex OAuth ใช้หน้าต่างโควตาที่ OpenAI จัดการและขึ้นกับแผน ในทางปฏิบัติ
    ขีดจำกัดเหล่านั้นอาจต่างจากประสบการณ์บนเว็บไซต์/แอป ChatGPT แม้ว่า
    ทั้งสองจะผูกกับบัญชีเดียวกันก็ตาม

    OpenClaw สามารถแสดงหน้าต่างการใช้งาน/โควตาของผู้ให้บริการที่มองเห็นได้ในปัจจุบันใน
    `openclaw models status` แต่จะไม่สร้างหรือปรับสิทธิ์ ChatGPT-web
    ให้เป็นการเข้าถึง API โดยตรง หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform
    โดยตรง ให้ใช้ `openai/*` พร้อม API key

  </Accordion>

  <Accordion title="รองรับการยืนยันตัวตนด้วยการสมัครสมาชิก OpenAI (Codex OAuth) หรือไม่?">
    ใช่ OpenClaw รองรับ **OpenAI Code (Codex) subscription OAuth** อย่างเต็มรูปแบบ
    OpenAI อนุญาตการใช้งาน subscription OAuth ในเครื่องมือ/เวิร์กโฟลว์ภายนอก
    เช่น OpenClaw อย่างชัดเจน การเริ่มต้นใช้งานสามารถรันโฟลว์ OAuth ให้คุณได้

    ดู [OAuth](/th/concepts/oauth), [ผู้ให้บริการโมเดล](/th/concepts/model-providers) และ [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)

  </Accordion>

  <Accordion title="ฉันจะตั้งค่า Gemini CLI OAuth ได้อย่างไร?">
    Gemini CLI ใช้ **โฟลว์การยืนยันตัวตนของ Plugin** ไม่ใช่ client id หรือ secret ใน `openclaw.json`

    ขั้นตอน:

    1. ติดตั้ง Gemini CLI ในเครื่องเพื่อให้ `gemini` อยู่ใน `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. เปิดใช้ Plugin: `openclaw plugins enable google`
    3. เข้าสู่ระบบ: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. โมเดลเริ่มต้นหลังเข้าสู่ระบบ: `google-gemini-cli/gemini-3-flash-preview`
    5. หากคำขอล้มเหลว ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway

    การดำเนินการนี้จะเก็บโทเค็น OAuth ในโปรไฟล์การยืนยันตัวตนบนโฮสต์ Gateway รายละเอียด: [ผู้ให้บริการโมเดล](/th/concepts/model-providers)

  </Accordion>

  <Accordion title="โมเดล local เหมาะสำหรับแชตทั่วไปหรือไม่?">
    โดยทั่วไปไม่เหมาะ OpenClaw ต้องการบริบทขนาดใหญ่และความปลอดภัยที่แข็งแกร่ง การ์ดขนาดเล็กจะตัดทอนและรั่วไหล หากจำเป็น ให้รันบิลด์โมเดลที่ **ใหญ่ที่สุด** ที่คุณรันในเครื่องได้ (LM Studio) และดู [/gateway/local-models](/th/gateway/local-models) โมเดลที่เล็กกว่า/ถูก quantized เพิ่มความเสี่ยง prompt-injection - ดู [ความปลอดภัย](/th/gateway/security)
  </Accordion>

  <Accordion title="ฉันจะคงทราฟฟิกโมเดลที่โฮสต์ไว้ให้อยู่ในภูมิภาคเฉพาะได้อย่างไร?">
    เลือกปลายทางที่ตรึงภูมิภาค OpenRouter มีตัวเลือกที่โฮสต์ในสหรัฐฯ สำหรับ MiniMax, Kimi และ GLM; เลือกตัวแปรที่โฮสต์ในสหรัฐฯ เพื่อคงข้อมูลไว้ในภูมิภาค คุณยังสามารถแสดง Anthropic/OpenAI ควบคู่กับสิ่งเหล่านี้ได้โดยใช้ `models.mode: "merge"` เพื่อให้ fallback ยังพร้อมใช้งานในขณะที่เคารพผู้ให้บริการตามภูมิภาคที่คุณเลือก
  </Accordion>

  <Accordion title="ฉันต้องซื้อ Mac Mini เพื่อติดตั้งสิ่งนี้หรือไม่?">
    ไม่ต้อง OpenClaw ทำงานบน macOS หรือ Linux (Windows ผ่าน WSL2) Mac mini เป็นตัวเลือก - บางคน
    ซื้อไว้เป็นโฮสต์ที่เปิดตลอดเวลา แต่ VPS ขนาดเล็ก เซิร์ฟเวอร์ที่บ้าน หรือเครื่องระดับ Raspberry Pi ก็ใช้ได้เช่นกัน

    คุณต้องใช้ Mac เฉพาะ **เครื่องมือที่ใช้ได้เฉพาะ macOS** สำหรับ iMessage ให้ใช้ [iMessage](/th/channels/imessage) พร้อม `imsg` บน Mac ใดก็ได้ที่ลงชื่อเข้าใช้ Messages หาก Gateway ทำงานบน Linux หรือที่อื่น ให้ตั้งค่า `channels.imessage.cliPath` เป็น SSH wrapper ที่รัน `imsg` บน Mac เครื่องนั้น หากคุณต้องการเครื่องมืออื่นที่ใช้ได้เฉพาะ macOS ให้รัน Gateway บน Mac หรือจับคู่ node macOS

    เอกสาร: [iMessage](/th/channels/imessage), [Nodes](/th/nodes), [โหมดรีโมต Mac](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันต้องใช้ Mac mini เพื่อรองรับ iMessage หรือไม่?">
    คุณต้องมี **อุปกรณ์ macOS บางเครื่อง** ที่ลงชื่อเข้าใช้ Messages อยู่ ไม่จำเป็นต้องเป็น Mac mini -
    Mac เครื่องใดก็ได้ใช้ได้ **ใช้ [iMessage](/th/channels/imessage)** พร้อม `imsg`; Gateway สามารถรันบน Mac เครื่องนั้น หรือรันที่อื่นด้วย SSH wrapper `cliPath`

    การตั้งค่าทั่วไป:

    - รัน Gateway บน Linux/VPS และตั้งค่า `channels.imessage.cliPath` เป็น SSH wrapper ที่รัน `imsg` บน Mac ที่ลงชื่อเข้าใช้ Messages
    - รันทุกอย่างบน Mac หากคุณต้องการการตั้งค่าเครื่องเดียวที่ง่ายที่สุด

    เอกสาร: [iMessage](/th/channels/imessage), [Nodes](/th/nodes),
    [โหมดรีโมต Mac](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="หากฉันซื้อ Mac mini เพื่อรัน OpenClaw ฉันเชื่อมต่อกับ MacBook Pro ของฉันได้ไหม?">
    ได้ **Mac mini สามารถรัน Gateway** และ MacBook Pro ของคุณสามารถเชื่อมต่อเป็น
    **node** (อุปกรณ์คู่ขนาน) Nodes ไม่ได้รัน Gateway - แต่ให้ความสามารถเพิ่มเติม
    เช่น หน้าจอ/กล้อง/canvas และ `system.run` บนอุปกรณ์นั้น

    รูปแบบทั่วไป:

    - Gateway บน Mac mini (เปิดตลอดเวลา)
    - MacBook Pro รันแอป macOS หรือโฮสต์ node แล้วจับคู่กับ Gateway
    - ใช้ `openclaw nodes status` / `openclaw nodes list` เพื่อดู

    เอกสาร: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันใช้ Bun ได้ไหม?">
    Bun **ไม่แนะนำ** เราพบข้อบกพร่องของรันไทม์ โดยเฉพาะกับ WhatsApp และ Telegram
    ใช้ **Node** สำหรับ Gateway ที่เสถียร

    หากคุณยังต้องการทดลองกับ Bun ให้ทำบน Gateway ที่ไม่ใช่ระบบผลิต
    และไม่มี WhatsApp/Telegram

  </Accordion>

  <Accordion title="Telegram: ต้องใส่อะไรใน allowFrom?">
    `channels.telegram.allowFrom` คือ **รหัสผู้ใช้ Telegram ของผู้ส่งที่เป็นมนุษย์** (ตัวเลข) ไม่ใช่ชื่อผู้ใช้ของบอต

    การตั้งค่าจะถามเฉพาะรหัสผู้ใช้แบบตัวเลขเท่านั้น หากคุณมีรายการ `@username` เก่าใน config อยู่แล้ว `openclaw doctor --fix` สามารถพยายาม resolve ให้ได้

    ปลอดภัยกว่า (ไม่มีบอตบุคคลที่สาม):

    - DM บอตของคุณ แล้วรัน `openclaw logs --follow` และอ่าน `from.id`

    Bot API อย่างเป็นทางการ:

    - DM บอตของคุณ แล้วเรียก `https://api.telegram.org/bot<bot_token>/getUpdates` และอ่าน `message.from.id`

    บุคคลที่สาม (เป็นส่วนตัวน้อยกว่า):

    - DM `@userinfobot` หรือ `@getidsbot`

    ดู [/channels/telegram](/th/channels/telegram#access-control-and-activation)

  </Accordion>

  <Accordion title="หลายคนใช้หมายเลข WhatsApp เดียวกับอินสแตนซ์ OpenClaw ต่างกันได้ไหม?">
    ได้ ผ่าน **multi-agent routing** ผูก **DM** WhatsApp ของผู้ส่งแต่ละคน (peer `kind: "direct"`, ผู้ส่งรูปแบบ E.164 เช่น `+15551234567`) กับ `agentId` ที่ต่างกัน เพื่อให้แต่ละคนได้ workspace และ session store ของตัวเอง การตอบกลับยังคงมาจาก **บัญชี WhatsApp เดียวกัน** และการควบคุมการเข้าถึง DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) เป็นแบบ global ต่อบัญชี WhatsApp ดู [Multi-Agent Routing](/th/concepts/multi-agent) และ [WhatsApp](/th/channels/whatsapp)
  </Accordion>

  <Accordion title='ฉันรัน agent แบบ "แชตเร็ว" และ agent แบบ "Opus สำหรับเขียนโค้ด" ได้ไหม?'>
    ได้ ใช้ multi-agent routing: ให้แต่ละ agent มีโมเดลเริ่มต้นของตัวเอง แล้วผูกเส้นทางขาเข้า (บัญชีผู้ให้บริการหรือ peer เฉพาะ) กับแต่ละ agent ตัวอย่าง config อยู่ใน [Multi-Agent Routing](/th/concepts/multi-agent) ดูเพิ่มเติม [โมเดล](/th/concepts/models) และ [การกำหนดค่า](/th/gateway/configuration)
  </Accordion>

  <Accordion title="Homebrew ทำงานบน Linux ได้ไหม?">
    ได้ Homebrew รองรับ Linux (Linuxbrew) การตั้งค่าอย่างรวดเร็ว:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    หากคุณรัน OpenClaw ผ่าน systemd ตรวจสอบให้แน่ใจว่า PATH ของ service มี `/home/linuxbrew/.linuxbrew/bin` (หรือ prefix ของ brew ของคุณ) เพื่อให้เครื่องมือที่ติดตั้งด้วย `brew` resolve ได้ใน shell แบบ non-login
    บิลด์ล่าสุดยัง prepend ไดเรกทอรี bin ของผู้ใช้ทั่วไปบน service systemd ของ Linux ด้วย (เช่น `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) และเคารพ `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` และ `FNM_DIR` เมื่อตั้งค่าไว้

  </Accordion>

  <Accordion title="ความแตกต่างระหว่างการติดตั้ง git แบบแก้ไขได้กับการติดตั้ง npm">
    - **การติดตั้งแบบแก้ไขได้ (git):** checkout ซอร์สเต็มรูปแบบ แก้ไขได้ เหมาะที่สุดสำหรับผู้ร่วมพัฒนา
      คุณรันบิลด์ในเครื่องและ patch โค้ด/เอกสารได้
    - **การติดตั้ง npm:** ติดตั้ง CLI แบบ global ไม่มี repo เหมาะที่สุดสำหรับ "แค่รันใช้งาน"
      การอัปเดตมาจาก npm dist-tags

    เอกสาร: [เริ่มต้นใช้งาน](/th/start/getting-started), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันสลับระหว่างการติดตั้ง npm และ git ภายหลังได้ไหม?">
    ได้ ใช้ `openclaw update --channel ...` เมื่อ OpenClaw ติดตั้งอยู่แล้ว
    สิ่งนี้ **จะไม่ลบข้อมูลของคุณ** - เปลี่ยนเฉพาะการติดตั้งโค้ด OpenClaw เท่านั้น
    สถานะของคุณ (`~/.openclaw`) และ workspace (`~/.openclaw/workspace`) จะไม่ถูกแตะต้อง

    จาก npm ไป git:

    ```bash
    openclaw update --channel dev
    ```

    จาก git ไป npm:

    ```bash
    openclaw update --channel stable
    ```

    เพิ่ม `--dry-run` เพื่อดูตัวอย่างการสลับโหมดที่วางแผนไว้ก่อน ตัวอัปเดตจะรัน
    การติดตามผลของ Doctor, รีเฟรชซอร์ส Plugin สำหรับช่องทางเป้าหมาย และ
    รีสตาร์ท Gateway เว้นแต่คุณส่ง `--no-restart`

    ตัวติดตั้งสามารถบังคับโหมดใดโหมดหนึ่งได้เช่นกัน:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    เคล็ดลับการสำรองข้อมูล: ดู [กลยุทธ์การสำรองข้อมูล](/th/help/faq#where-things-live-on-disk)

  </Accordion>

  <Accordion title="ฉันควรรัน Gateway บนแล็ปท็อปหรือ VPS?">
    คำตอบสั้นๆ: **ถ้าคุณต้องการความเสถียรแบบ 24/7 ให้ใช้ VPS** หากคุณต้องการ
    ความยุ่งยากน้อยที่สุดและยอมรับการพักเครื่อง/รีสตาร์ตได้ ให้รันแบบ local

    **แล็ปท็อป (Gateway แบบ local)**

    - **ข้อดี:** ไม่มีค่าเซิร์ฟเวอร์, เข้าถึงไฟล์ local ได้โดยตรง, หน้าต่างเบราว์เซอร์สด
    - **ข้อเสีย:** การพักเครื่อง/เครือข่ายหลุด = การเชื่อมต่อขาด, การอัปเดต/รีบูต OS ทำให้หยุดชะงัก, ต้องเปิดเครื่องไว้เสมอ

    **VPS / คลาวด์**

    - **ข้อดี:** เปิดตลอดเวลา, เครือข่ายเสถียร, ไม่มีปัญหาแล็ปท็อปพักเครื่อง, ทำให้รันต่อเนื่องได้ง่ายกว่า
    - **ข้อเสีย:** มักรันแบบไม่มีหน้าจอ (ใช้ภาพหน้าจอ), เข้าถึงไฟล์ได้เฉพาะจากระยะไกล, คุณต้อง SSH เพื่ออัปเดต

    **หมายเหตุเฉพาะของ OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord ใช้งานจาก VPS ได้ดีทั้งหมด ข้อแลกเปลี่ยนจริงเพียงอย่างเดียวคือ **เบราว์เซอร์แบบ headless** เทียบกับหน้าต่างที่มองเห็นได้ ดู [เบราว์เซอร์](/th/tools/browser)

    **ค่าเริ่มต้นที่แนะนำ:** ใช้ VPS หากคุณเคยมีปัญหา Gateway หลุดมาก่อน แบบ local เหมาะมากเมื่อคุณใช้ Mac อยู่จริงและต้องการเข้าถึงไฟล์ local หรือทำ UI automation ด้วยเบราว์เซอร์ที่มองเห็นได้

  </Accordion>

  <Accordion title="การรัน OpenClaw บนเครื่องเฉพาะสำคัญแค่ไหน?">
    ไม่จำเป็น แต่**แนะนำเพื่อความเสถียรและการแยกสภาพแวดล้อม**

    - **โฮสต์เฉพาะ (VPS/Mac mini/Pi):** เปิดตลอดเวลา, มีการหยุดชะงักจากการพักเครื่อง/รีบูตน้อยกว่า, สิทธิ์สะอาดกว่า, ทำให้รันต่อเนื่องได้ง่ายกว่า
    - **แล็ปท็อป/เดสก์ท็อปที่ใช้ร่วมกัน:** ใช้ทดสอบและใช้งานจริงระหว่างทำงานได้ไม่มีปัญหา แต่ควรคาดว่าจะมีการหยุดชั่วคราวเมื่อเครื่องพักหรืออัปเดต

    หากคุณต้องการข้อดีของทั้งสองแบบ ให้คง Gateway ไว้บนโฮสต์เฉพาะและจับคู่แล็ปท็อปของคุณเป็น **Node** สำหรับเครื่องมือหน้าจอ/กล้อง/exec แบบ local ดู [Node](/th/nodes)
    สำหรับคำแนะนำด้านความปลอดภัย อ่าน [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อกำหนด VPS ขั้นต่ำและ OS ที่แนะนำคืออะไร?">
    OpenClaw ใช้ทรัพยากรน้อย สำหรับ Gateway พื้นฐาน + ช่องแชตหนึ่งช่อง:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB, ดิสก์ประมาณ 500MB
    - **แนะนำ:** 1-2 vCPU, RAM 2GB หรือมากกว่าเพื่อเผื่อทรัพยากร (ล็อก, สื่อ, หลายช่องทาง) เครื่องมือ Node และ browser automation อาจใช้ทรัพยากรค่อนข้างมาก

    OS: ใช้ **Ubuntu LTS** (หรือ Debian/Ubuntu รุ่นใหม่ใดๆ) เส้นทางติดตั้ง Linux ได้รับการทดสอบดีที่สุดที่นั่น

    เอกสาร: [Linux](/th/platforms/linux), [โฮสติ้ง VPS](/th/vps)

  </Accordion>

  <Accordion title="ฉันรัน OpenClaw ใน VM ได้ไหม และมีข้อกำหนดอะไรบ้าง?">
    ได้ ให้มอง VM เหมือน VPS: ต้องเปิดตลอดเวลา, เข้าถึงได้, และมี
    RAM เพียงพอสำหรับ Gateway และช่องทางใดๆ ที่คุณเปิดใช้

    แนวทางพื้นฐาน:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB
    - **แนะนำ:** RAM 2GB หรือมากกว่าหากคุณรันหลายช่องทาง, browser automation, หรือเครื่องมือสื่อ
    - **OS:** Ubuntu LTS หรือ Debian/Ubuntu รุ่นใหม่อื่นๆ

    หากคุณใช้ Windows, **WSL2 เป็นการตั้งค่าสไตล์ VM ที่ง่ายที่สุด** และมีความเข้ากันได้กับเครื่องมือดีที่สุด
    ดู [Windows](/th/platforms/windows), [โฮสติ้ง VPS](/th/vps)
    หากคุณรัน macOS ใน VM ดู [macOS VM](/th/install/macos-vm)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [คำถามที่พบบ่อย](/th/help/faq) — คำถามที่พบบ่อยหลัก (โมเดล, เซสชัน, gateway, ความปลอดภัย, และอื่นๆ)
- [ภาพรวมการติดตั้ง](/th/install)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [การแก้ไขปัญหา](/th/help/troubleshooting)
