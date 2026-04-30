---
read_when:
    - การติดตั้งใหม่ การเริ่มต้นใช้งานค้าง หรือข้อผิดพลาดในการรันครั้งแรก
    - การเลือกการรับรองความถูกต้องและการสมัครรับข้อมูลของผู้ให้บริการ
    - เข้าถึง docs.openclaw.ai ไม่ได้ เปิดแดชบอร์ดไม่ได้ การติดตั้งค้าง
sidebarTitle: First-run FAQ
summary: 'คำถามที่พบบ่อย: การเริ่มต้นอย่างรวดเร็วและการตั้งค่าสำหรับการใช้งานครั้งแรก — การติดตั้ง การเริ่มต้นใช้งาน การยืนยันตัวตน การสมัครใช้งาน ข้อผิดพลาดเบื้องต้น'
title: 'คำถามที่พบบ่อย: การตั้งค่าเมื่อรันครั้งแรก'
x-i18n:
    generated_at: "2026-04-30T09:57:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 959e5c8a94cce6369af84d3d1e252dbfb22acb5891ac1d8b64722c4c40679e65
    source_path: help/faq-first-run.md
    workflow: 16
---

  คำถามและคำตอบสำหรับการเริ่มต้นอย่างรวดเร็วและการรันครั้งแรก สำหรับการใช้งานประจำวัน โมเดล การยืนยันตัวตน เซสชัน
  และการแก้ปัญหา ดู [FAQ](/th/help/faq) หลัก

  ## การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก

  <AccordionGroup>
  <Accordion title="ฉันติดปัญหา วิธีที่เร็วที่สุดในการไปต่อ">
    ใช้เอเจนต์ AI ในเครื่องที่สามารถ **มองเห็นเครื่องของคุณ** ได้ วิธีนี้มีประสิทธิภาพกว่าการถาม
    ใน Discord มาก เพราะกรณีส่วนใหญ่ของ "ฉันติดปัญหา" คือ **ปัญหาการตั้งค่าหรือสภาพแวดล้อมในเครื่อง** ที่
    ผู้ช่วยระยะไกลไม่สามารถตรวจสอบได้

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    เครื่องมือเหล่านี้สามารถอ่านรีโป รันคำสั่ง ตรวจสอบล็อก และช่วยแก้การตั้งค่าระดับเครื่องของคุณ
    (PATH, services, permissions, auth files) ได้ ให้พวกเขาเข้าถึง **ซอร์สเช็กเอาต์ทั้งหมด** ผ่าน
    การติดตั้งแบบแก้ไขได้ (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    คำสั่งนี้ติดตั้ง OpenClaw **จาก git checkout** เพื่อให้เอเจนต์อ่านโค้ด + เอกสาร และ
    วิเคราะห์เวอร์ชันจริงที่คุณกำลังรันได้ คุณสามารถสลับกลับไปใช้ stable ภายหลังได้เสมอ
    โดยรันตัวติดตั้งอีกครั้งโดยไม่ใส่ `--install-method git`

    เคล็ดลับ: ขอให้เอเจนต์ **วางแผนและกำกับดูแล** การแก้ไข (ทีละขั้นตอน) จากนั้นรันเฉพาะ
    คำสั่งที่จำเป็น วิธีนี้ทำให้การเปลี่ยนแปลงเล็กลงและตรวจสอบได้ง่ายขึ้น

    หากคุณพบข้อบกพร่องจริงหรือวิธีแก้ โปรดเปิด GitHub issue หรือส่ง PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    เริ่มด้วยคำสั่งเหล่านี้ (แชร์เอาต์พุตเมื่อขอความช่วยเหลือ):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    สิ่งที่คำสั่งเหล่านี้ทำ:

    - `openclaw status`: ภาพรวมอย่างรวดเร็วของสุขภาพ gateway/agent + การตั้งค่าพื้นฐาน
    - `openclaw models status`: ตรวจสอบการยืนยันตัวตนของ provider + ความพร้อมใช้งานของโมเดล
    - `openclaw doctor`: ตรวจสอบความถูกต้องและซ่อมแซมปัญหา config/state ที่พบบ่อย

    การตรวจสอบ CLI อื่น ๆ ที่มีประโยชน์: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`

    ลูปดีบักอย่างรวดเร็ว: [60 วินาทีแรกหากมีบางอย่างเสีย](#first-60-seconds-if-something-is-broken)
    เอกสารการติดตั้ง: [ติดตั้ง](/th/install), [แฟล็กตัวติดตั้ง](/th/install/installer), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="Heartbeat ข้ามอยู่เรื่อย ๆ เหตุผลที่ข้ามหมายความว่าอะไร?">
    เหตุผลการข้าม heartbeat ที่พบบ่อย:

    - `quiet-hours`: อยู่นอกช่วงเวลาทำงานที่กำหนดค่าไว้
    - `empty-heartbeat-file`: มี `HEARTBEAT.md` อยู่ แต่มีเพียงโครงว่างว่าง/มีเฉพาะหัวข้อเท่านั้น
    - `no-tasks-due`: โหมดงานของ `HEARTBEAT.md` เปิดอยู่ แต่ยังไม่มีช่วงเวลาของงานใดถึงกำหนด
    - `alerts-disabled`: การแสดงผล heartbeat ทั้งหมดถูกปิด (`showOk`, `showAlerts`, และ `useIndicator` ปิดทั้งหมด)

    ในโหมดงาน timestamp ที่ถึงกำหนดจะถูกเลื่อนต่อเมื่อการรัน heartbeat จริง
    เสร็จสมบูรณ์เท่านั้น การรันที่ถูกข้ามจะไม่ทำเครื่องหมายงานว่าเสร็จแล้ว

    เอกสาร: [Heartbeat](/th/gateway/heartbeat), [Automation & Tasks](/th/automation)

  </Accordion>

  <Accordion title="วิธีที่แนะนำในการติดตั้งและตั้งค่า OpenClaw">
    รีโปแนะนำให้รันจากซอร์สและใช้ onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    วิซาร์ดสามารถ build UI assets ให้อัตโนมัติได้ด้วย หลัง onboarding โดยทั่วไปคุณจะรัน Gateway บนพอร์ต **18789**

    จากซอร์ส (ผู้ร่วมพัฒนา/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    หากคุณยังไม่มีการติดตั้ง global ให้รันผ่าน `pnpm openclaw onboard`

  </Accordion>

  <Accordion title="ฉันจะเปิดแดชบอร์ดหลัง onboarding ได้อย่างไร?">
    วิซาร์ดจะเปิดเบราว์เซอร์ของคุณด้วย URL แดชบอร์ดแบบสะอาด (ไม่มีโทเค็น) ทันทีหลัง onboarding และพิมพ์ลิงก์ไว้ในสรุปด้วย เปิดแท็บนั้นค้างไว้ หากไม่ได้เปิดขึ้นมา ให้คัดลอก/วาง URL ที่พิมพ์ออกมาบนเครื่องเดียวกัน
  </Accordion>

  <Accordion title="ฉันจะยืนยันตัวตนแดชบอร์ดบน localhost เทียบกับ remote ได้อย่างไร?">
    **Localhost (เครื่องเดียวกัน):**

    - เปิด `http://127.0.0.1:18789/`
    - หากระบบขอการยืนยันตัวตนแบบ shared-secret ให้วางโทเค็นหรือรหัสผ่านที่กำหนดค่าไว้ใน Control UI settings
    - แหล่งโทเค็น: `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
    - แหล่งรหัสผ่าน: `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
    - หากยังไม่ได้กำหนดค่า shared secret ให้สร้างโทเค็นด้วย `openclaw doctor --generate-gateway-token`

    **ไม่ใช่บน localhost:**

    - **Tailscale Serve** (แนะนำ): คง bind loopback ไว้ รัน `openclaw gateway --tailscale serve` เปิด `https://<magicdns>/` หาก `gateway.auth.allowTailscale` เป็น `true` identity headers จะตอบสนองการยืนยันตัวตนของ Control UI/WebSocket (ไม่ต้องวาง shared secret, ถือว่า gateway host เชื่อถือได้); HTTP APIs ยังต้องใช้การยืนยันตัวตนแบบ shared-secret เว้นแต่คุณจงใจใช้ private-ingress `none` หรือการยืนยันตัวตน HTTP แบบ trusted-proxy
      ความพยายามยืนยันตัวตน Serve ที่ผิดพลาดพร้อมกันจากไคลเอนต์เดียวกันจะถูกจัดลำดับก่อนที่ตัวจำกัด failed-auth จะบันทึกไว้ ดังนั้นการลองซ้ำผิดครั้งที่สองอาจแสดง `retry later` ได้แล้ว
    - **Tailnet bind**: รัน `openclaw gateway --bind tailnet --token "<token>"` (หรือกำหนดค่าการยืนยันตัวตนด้วยรหัสผ่าน), เปิด `http://<tailscale-ip>:18789/` จากนั้นวาง shared secret ที่ตรงกันในการตั้งค่าแดชบอร์ด
    - **รีเวิร์สพร็อกซีที่รับรู้ตัวตน**: วาง Gateway ไว้หลังพร็อกซีที่เชื่อถือได้ กำหนดค่า `gateway.auth.mode: "trusted-proxy"` แล้วเปิด URL ของพร็อกซี พร็อกซี loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/` การยืนยันตัวตนแบบ shared-secret ยังคงมีผลผ่าน tunnel; วางโทเค็นหรือรหัสผ่านที่กำหนดค่าไว้หากถูกถาม

    ดู [แดชบอร์ด](/th/web/dashboard) และ [พื้นผิวเว็บ](/th/web) สำหรับโหมด bind และรายละเอียดการยืนยันตัวตน

  </Accordion>

  <Accordion title="ทำไมจึงมี exec approval config สองชุดสำหรับการอนุมัติผ่านแชต?">
    ทั้งสองควบคุมคนละชั้น:

    - `approvals.exec`: ส่งต่อ prompt การอนุมัติไปยังปลายทางแชต
    - `channels.<channel>.execApprovals`: ทำให้ช่องนั้นทำหน้าที่เป็นไคลเอนต์การอนุมัติ native สำหรับ exec approvals

    นโยบาย host exec ยังคงเป็นด่านอนุมัติจริง การตั้งค่าแชตควบคุมเพียงว่า prompt
    การอนุมัติจะปรากฏที่ใดและผู้คนจะตอบอย่างไร

    ในการตั้งค่าส่วนใหญ่คุณ **ไม่** จำเป็นต้องใช้ทั้งสองอย่าง:

    - หากแชตรองรับคำสั่งและการตอบกลับอยู่แล้ว `/approve` ในแชตเดียวกันจะทำงานผ่าน path ร่วม
    - หากช่อง native ที่รองรับสามารถอนุมานผู้อนุมัติได้อย่างปลอดภัย OpenClaw จะเปิดการอนุมัติ native แบบ DM-first โดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `channels.<channel>.execApprovals.enabled` หรือเป็น `"auto"`
    - เมื่อมีการ์ด/ปุ่มอนุมัติ native ให้ UI native นั้นเป็น path หลัก; agent ควรใส่คำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของเครื่องมือบอกว่าการอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็น path เดียวเท่านั้น
    - ใช้ `approvals.exec` เฉพาะเมื่อ prompt ต้องถูกส่งต่อไปยังแชตอื่นหรือห้องปฏิบัติการที่ระบุด้วย
    - ใช้ `channels.<channel>.execApprovals.target: "channel"` หรือ `"both"` เฉพาะเมื่อคุณต้องการให้ prompt การอนุมัติถูกโพสต์กลับไปยังห้อง/หัวข้อเดิมอย่างชัดเจน
    - การอนุมัติ Plugin แยกต่างหากอีกชั้น: โดยค่าเริ่มต้นใช้ `/approve` ในแชตเดียวกัน, มีการส่งต่อ `approvals.plugin` เป็นตัวเลือก, และมีเพียงบางช่อง native เท่านั้นที่คงการจัดการ plugin-approval-native เพิ่มเติมไว้

    สรุปสั้น ๆ: forwarding ใช้สำหรับ routing ส่วน native client config ใช้สำหรับ UX เฉพาะช่องที่สมบูรณ์กว่า
    ดู [Exec Approvals](/th/tools/exec-approvals)

  </Accordion>

  <Accordion title="ฉันต้องใช้ runtime อะไร?">
    ต้องใช้ Node **>= 22** แนะนำให้ใช้ `pnpm` ไม่แนะนำให้ใช้ Bun สำหรับ Gateway
  </Accordion>

  <Accordion title="รันบน Raspberry Pi ได้ไหม?">
    ได้ Gateway มีน้ำหนักเบา - เอกสารระบุว่า **RAM 512MB-1GB**, **1 core**, และพื้นที่ดิสก์ประมาณ **500MB**
    เพียงพอสำหรับการใช้งานส่วนตัว และระบุว่า **Raspberry Pi 4 สามารถรันได้**

    หากคุณต้องการพื้นที่เผื่อเพิ่มเติม (ล็อก สื่อ บริการอื่น ๆ), **แนะนำ 2GB** แต่ไม่ใช่
    ขั้นต่ำที่บังคับ

    เคล็ดลับ: Pi/VPS ขนาดเล็กสามารถโฮสต์ Gateway ได้ และคุณสามารถจับคู่ **nodes** บนแล็ปท็อป/โทรศัพท์ของคุณสำหรับ
    หน้าจอ/กล้อง/canvas ในเครื่อง หรือการรันคำสั่งได้ ดู [Nodes](/th/nodes)

  </Accordion>

  <Accordion title="มีเคล็ดลับสำหรับการติดตั้งบน Raspberry Pi ไหม?">
    สรุปสั้น ๆ: ใช้งานได้ แต่คาดว่าจะมีจุดที่ยังไม่เรียบร้อยบ้าง

    - ใช้ระบบปฏิบัติการ **64-bit** และคง Node >= 22
    - แนะนำการติดตั้งแบบ **แก้ไขได้ (git)** เพื่อให้คุณดูล็อกและอัปเดตได้รวดเร็ว
    - เริ่มโดยไม่เปิด channels/skills แล้วค่อยเพิ่มทีละรายการ
    - หากเจอปัญหา binary แปลก ๆ โดยมากมักเป็นปัญหา **ความเข้ากันได้กับ ARM**

    เอกสาร: [Linux](/th/platforms/linux), [ติดตั้ง](/th/install)

  </Accordion>

  <Accordion title="ค้างอยู่ที่ wake up my friend / onboarding จะไม่ hatch ตอนนี้ทำอย่างไร?">
    หน้าจอนั้นขึ้นกับการที่ Gateway เข้าถึงได้และยืนยันตัวตนแล้ว TUI ยังส่ง
    "Wake up, my friend!" โดยอัตโนมัติเมื่อ hatch ครั้งแรกด้วย หากคุณเห็นบรรทัดนั้นโดย **ไม่มีการตอบกลับ**
    และโทเค็นยังอยู่ที่ 0 แปลว่า agent ไม่เคยรัน

    1. รีสตาร์ท Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. ตรวจสอบสถานะ + การยืนยันตัวตน:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. หากยังค้างอยู่ ให้รัน:

    ```bash
    openclaw doctor
    ```

    หาก Gateway อยู่ระยะไกล ตรวจสอบให้แน่ใจว่า tunnel/การเชื่อมต่อ Tailscale พร้อมใช้งาน และ UI
    ชี้ไปที่ Gateway ที่ถูกต้อง ดู [การเข้าถึงระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันสามารถย้ายการตั้งค่าไปยังเครื่องใหม่ (Mac mini) โดยไม่ต้องทำ onboarding ใหม่ได้ไหม?">
    ได้ คัดลอก **state directory** และ **workspace** แล้วรัน Doctor หนึ่งครั้ง วิธีนี้
    ทำให้ bot ของคุณ "เหมือนเดิมทุกอย่าง" (หน่วยความจำ ประวัติ session การยืนยันตัวตน และสถานะ channel)
    ตราบใดที่คุณคัดลอก **ทั้งสอง** ตำแหน่ง:

    1. ติดตั้ง OpenClaw บนเครื่องใหม่
    2. คัดลอก `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`) จากเครื่องเก่า
    3. คัดลอก workspace ของคุณ (ค่าเริ่มต้น: `~/.openclaw/workspace`)
    4. รัน `openclaw doctor` และรีสตาร์ทบริการ Gateway

    การทำเช่นนี้จะรักษา config, auth profiles, WhatsApp creds, sessions, และ memory ไว้ หากคุณอยู่ใน
    remote mode โปรดจำไว้ว่า gateway host เป็นเจ้าของ session store และ workspace

    **สำคัญ:** หากคุณเพียง commit/push workspace ไปยัง GitHub คุณกำลังสำรอง
    **memory + bootstrap files** แต่ **ไม่ได้** สำรองประวัติ session หรือ auth สิ่งเหล่านั้นอยู่
    ใต้ `~/.openclaw/` (ตัวอย่างเช่น `~/.openclaw/agents/<agentId>/sessions/`)

    ที่เกี่ยวข้อง: [การย้าย](/th/install/migrating), [สิ่งต่าง ๆ อยู่ที่ไหนบนดิสก์](#where-things-live-on-disk),
    [Agent workspace](/th/concepts/agent-workspace), [Doctor](/th/gateway/doctor),
    [Remote mode](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันจะดูสิ่งใหม่ในเวอร์ชันล่าสุดได้ที่ไหน?">
    ดู changelog บน GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    รายการใหม่ที่สุดอยู่ด้านบน หากส่วนบนสุดถูกทำเครื่องหมายว่า **Unreleased** ส่วนถัดไปที่มีวันที่
    คือเวอร์ชันล่าสุดที่ปล่อยแล้ว รายการถูกจัดกลุ่มตาม **Highlights**, **Changes**, และ
    **Fixes** (รวมถึงส่วน docs/other เมื่อจำเป็น)

  </Accordion>

  <Accordion title="ไม่สามารถเข้าถึง docs.openclaw.ai (ข้อผิดพลาด SSL)">
    การเชื่อมต่อ Comcast/Xfinity บางรายการบล็อก `docs.openclaw.ai` ผิดพลาดผ่าน Xfinity
    Advanced Security ให้ปิดใช้งานหรือเพิ่ม `docs.openclaw.ai` ใน allowlist แล้วลองอีกครั้ง
    โปรดช่วยให้เราปลดบล็อกได้โดยรายงานที่นี่: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    หากคุณยังเข้าถึงไซต์ไม่ได้ เอกสารมี mirror บน GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="ความแตกต่างระหว่างรุ่นเสถียรและเบต้า">
    **รุ่นเสถียร** และ **เบต้า** คือ **npm dist-tags** ไม่ใช่สายโค้ดคนละชุด:

    - `latest` = รุ่นเสถียร
    - `beta` = บิลด์รุ่นแรกสำหรับการทดสอบ

    โดยปกติ รุ่นเสถียรจะลงที่ **เบต้า** ก่อน จากนั้นขั้นตอนโปรโมตแบบชัดเจน
    จะย้ายเวอร์ชันเดียวกันนั้นไปที่ `latest` ผู้ดูแลยังสามารถ
    เผยแพร่ตรงไปยัง `latest` ได้เมื่อจำเป็น นี่คือเหตุผลที่เบต้าและรุ่นเสถียรสามารถ
    ชี้ไปที่ **เวอร์ชันเดียวกัน** หลังการโปรโมตได้

    ดูสิ่งที่เปลี่ยนแปลง:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    สำหรับคำสั่งติดตั้งบรรทัดเดียวและความแตกต่างระหว่างเบต้าและ dev ให้ดูแอคคอร์เดียนด้านล่าง

  </Accordion>

  <Accordion title="ฉันจะติดตั้งเวอร์ชันเบต้าได้อย่างไร และเบต้าแตกต่างจาก dev อย่างไร">
    **เบต้า** คือ npm dist-tag `beta` (อาจตรงกับ `latest` หลังการโปรโมต)
    **Dev** คือหัวที่เปลี่ยนตลอดของ `main` (git); เมื่อเผยแพร่ จะใช้ npm dist-tag `dev`

    คำสั่งบรรทัดเดียว (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    ตัวติดตั้ง Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    รายละเอียดเพิ่มเติม: [ช่องทางการพัฒนา](/th/install/development-channels) และ [แฟล็กตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="ฉันจะลองบิตล่าสุดได้อย่างไร">
    มีสองตัวเลือก:

    1. **ช่องทาง Dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    คำสั่งนี้สลับไปยังแบรนช์ `main` และอัปเดตจากซอร์ส

    2. **การติดตั้งที่แฮ็กได้ (จากไซต์ตัวติดตั้ง):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    วิธีนี้จะให้รีโปในเครื่องที่คุณแก้ไขได้ แล้วอัปเดตผ่าน git

    หากคุณต้องการโคลนใหม่สะอาดด้วยตนเอง ให้ใช้:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [ช่องทางการพัฒนา](/th/install/development-channels),
    [ติดตั้ง](/th/install)

  </Accordion>

  <Accordion title="โดยปกติการติดตั้งและการเริ่มต้นใช้งานใช้เวลานานเท่าใด">
    แนวทางคร่าว ๆ:

    - **ติดตั้ง:** 2-5 นาที
    - **การเริ่มต้นใช้งาน:** 5-15 นาที ขึ้นอยู่กับจำนวนช่องทาง/โมเดลที่คุณกำหนดค่า

    หากค้าง ให้ใช้ [ตัวติดตั้งค้าง](#quick-start-and-first-run-setup)
    และลูปดีบักแบบเร็วใน [ฉันติดขัด](#quick-start-and-first-run-setup)

  </Accordion>

  <Accordion title="ตัวติดตั้งค้างหรือไม่ ฉันจะรับข้อเสนอแนะเพิ่มเติมได้อย่างไร">
    เรียกใช้ตัวติดตั้งอีกครั้งพร้อม **เอาต์พุตแบบละเอียด**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    การติดตั้งเบต้าพร้อมรายละเอียด:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    สำหรับการติดตั้งแบบแฮ็กได้ (git):

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

    ตัวเลือกเพิ่มเติม: [แฟล็กตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="การติดตั้งบน Windows แจ้งว่าไม่พบ git หรือไม่รู้จัก openclaw">
    ปัญหาทั่วไปสองอย่างบน Windows:

    **1) ข้อผิดพลาด npm spawn git / ไม่พบ git**

    - ติดตั้ง **Git for Windows** และตรวจสอบให้แน่ใจว่า `git` อยู่ใน PATH ของคุณ
    - ปิดและเปิด PowerShell ใหม่ แล้วเรียกใช้ตัวติดตั้งอีกครั้ง

    **2) ไม่รู้จัก openclaw หลังติดตั้ง**

    - โฟลเดอร์ npm global bin ของคุณไม่ได้อยู่ใน PATH
    - ตรวจสอบพาธ:

      ```powershell
      npm config get prefix
      ```

    - เพิ่มไดเรกทอรีนั้นลงใน PATH ของผู้ใช้ของคุณ (บน Windows ไม่ต้องมีส่วนต่อท้าย `\bin`; บนระบบส่วนใหญ่คือ `%AppData%\npm`)
    - ปิดและเปิด PowerShell ใหม่หลังอัปเดต PATH

    หากคุณต้องการการตั้งค่า Windows ที่ราบรื่นที่สุด ให้ใช้ **WSL2** แทน Windows แบบเนทีฟ
    เอกสาร: [Windows](/th/platforms/windows)

  </Accordion>

  <Accordion title="เอาต์พุต exec บน Windows แสดงข้อความภาษาจีนเพี้ยน - ฉันควรทำอย่างไร">
    โดยปกตินี่คือความไม่ตรงกันของ code page คอนโซลบนเชลล์ Windows แบบเนทีฟ

    อาการ:

    - เอาต์พุต `system.run`/`exec` แสดงภาษาจีนเป็น mojibake
    - คำสั่งเดียวกันดูปกติในโปรไฟล์เทอร์มินัลอื่น

    วิธีแก้ชั่วคราวอย่างรวดเร็วใน PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    จากนั้นรีสตาร์ท Gateway และลองคำสั่งอีกครั้ง:

    ```powershell
    openclaw gateway restart
    ```

    หากคุณยังทำให้เกิดปัญหานี้ซ้ำได้บน OpenClaw ล่าสุด ให้ติดตาม/รายงานได้ที่:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="เอกสารไม่ได้ตอบคำถามของฉัน - ฉันจะได้คำตอบที่ดีกว่าได้อย่างไร">
    ใช้ **การติดตั้งแบบแฮ็กได้ (git)** เพื่อให้คุณมีซอร์สและเอกสารทั้งหมดในเครื่อง จากนั้นถาม
    บอตของคุณ (หรือ Claude/Codex) _จากโฟลเดอร์นั้น_ เพื่อให้มันอ่านรีโปและตอบได้อย่างแม่นยำ

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    รายละเอียดเพิ่มเติม: [ติดตั้ง](/th/install) และ [แฟล็กตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน Linux ได้อย่างไร">
    คำตอบสั้น ๆ: ทำตามคู่มือ Linux แล้วเรียกใช้การเริ่มต้นใช้งาน

    - เส้นทางด่วน Linux + การติดตั้งบริการ: [Linux](/th/platforms/linux)
    - คำแนะนำแบบครบถ้วน: [เริ่มต้นใช้งาน](/th/start/getting-started)
    - ตัวติดตั้ง + การอัปเดต: [ติดตั้งและอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน VPS ได้อย่างไร">
    VPS Linux ใดก็ใช้ได้ ติดตั้งบนเซิร์ฟเวอร์ แล้วใช้ SSH/Tailscale เพื่อเข้าถึง Gateway

    คู่มือ: [exe.dev](/th/install/exe-dev), [Hetzner](/th/install/hetzner), [Fly.io](/th/install/fly)
    การเข้าถึงระยะไกล: [Gateway ระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title="คู่มือการติดตั้งบนคลาวด์/VPS อยู่ที่ไหน">
    เรามี **ฮับโฮสติ้ง** พร้อมผู้ให้บริการทั่วไป เลือกรายการหนึ่งแล้วทำตามคู่มือ:

    - [โฮสติ้ง VPS](/th/vps) (ผู้ให้บริการทั้งหมดในที่เดียว)
    - [Fly.io](/th/install/fly)
    - [Hetzner](/th/install/hetzner)
    - [exe.dev](/th/install/exe-dev)

    วิธีทำงานบนคลาวด์: **Gateway ทำงานบนเซิร์ฟเวอร์** และคุณเข้าถึงได้
    จากแล็ปท็อป/โทรศัพท์ผ่าน Control UI (หรือ Tailscale/SSH) สถานะ + workspace ของคุณ
    อยู่บนเซิร์ฟเวอร์ ดังนั้นให้ถือว่าโฮสต์เป็นแหล่งข้อมูลจริงและสำรองข้อมูลไว้

    คุณสามารถจับคู่ **โหนด** (Mac/iOS/Android/headless) กับ Gateway บนคลาวด์นั้นเพื่อเข้าถึง
    หน้าจอ/กล้อง/canvas ในเครื่อง หรือเรียกใช้คำสั่งบนแล็ปท็อปของคุณในขณะที่คง
    Gateway ไว้บนคลาวด์

    ฮับ: [แพลตฟอร์ม](/th/platforms) การเข้าถึงระยะไกล: [Gateway ระยะไกล](/th/gateway/remote)
    โหนด: [โหนด](/th/nodes), [CLI โหนด](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันขอให้ OpenClaw อัปเดตตัวเองได้ไหม">
    คำตอบสั้น ๆ: **ทำได้ แต่ไม่แนะนำ** โฟลว์การอัปเดตอาจรีสตาร์ท
    Gateway (ซึ่งทำให้เซสชันที่ใช้งานอยู่หลุด) อาจต้องมี git checkout ที่สะอาด และ
    อาจขอการยืนยัน ปลอดภัยกว่า: เรียกใช้อัปเดตจากเชลล์ในฐานะผู้ปฏิบัติการ

    ใช้ CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    หากคุณจำเป็นต้องทำอัตโนมัติจากเอเจนต์:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="จริง ๆ แล้วการเริ่มต้นใช้งานทำอะไรบ้าง">
    `openclaw onboard` คือเส้นทางการตั้งค่าที่แนะนำ ใน **โหมด local** คำสั่งนี้จะพาคุณผ่าน:

    - **การตั้งค่าโมเดล/การยืนยันตัวตน** (OAuth ของผู้ให้บริการ, API key, setup-token ของ Anthropic รวมถึงตัวเลือกโมเดลในเครื่อง เช่น LM Studio)
    - ตำแหน่ง **Workspace** + ไฟล์ bootstrap
    - **การตั้งค่า Gateway** (bind/port/auth/tailscale)
    - **ช่องทาง** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage รวมถึง bundled channel plugins เช่น QQ Bot)
    - **การติดตั้ง daemon** (LaunchAgent บน macOS; systemd user unit บน Linux/WSL2)
    - **การตรวจสุขภาพ** และการเลือก **skills**

    นอกจากนี้ยังเตือนหากโมเดลที่คุณกำหนดค่าไม่รู้จักหรือไม่มีการยืนยันตัวตน

  </Accordion>

  <Accordion title="ฉันต้องมีการสมัครสมาชิก Claude หรือ OpenAI เพื่อรันสิ่งนี้หรือไม่">
    ไม่ คุณสามารถรัน OpenClaw ด้วย **API key** (Anthropic/OpenAI/อื่น ๆ) หรือด้วย
    **โมเดลเฉพาะในเครื่อง** เพื่อให้ข้อมูลของคุณอยู่บนอุปกรณ์ของคุณ การสมัครสมาชิก (Claude
    Pro/Max หรือ OpenAI Codex) เป็นวิธียืนยันตัวตนกับผู้ให้บริการเหล่านั้นแบบไม่บังคับ

    สำหรับ Anthropic ใน OpenClaw การแบ่งในทางปฏิบัติคือ:

    - **Anthropic API key**: การเรียกเก็บเงิน Anthropic API ปกติ
    - **Claude CLI / การยืนยันตัวตนการสมัครสมาชิก Claude ใน OpenClaw**: เจ้าหน้าที่ Anthropic
      แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง และ OpenClaw ถือว่าการใช้งาน `claude -p`
      ได้รับอนุมัติสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่

    สำหรับโฮสต์ gateway ที่ใช้งานระยะยาว Anthropic API key ยังคงเป็นการตั้งค่าที่
    คาดการณ์ได้มากกว่า OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือภายนอก
    เช่น OpenClaw

    OpenClaw ยังรองรับตัวเลือกแบบสมัครสมาชิกที่โฮสต์อื่น ๆ รวมถึง
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** และ
    **Z.AI / GLM Coding Plan**

    เอกสาร: [Anthropic](/th/providers/anthropic), [OpenAI](/th/providers/openai),
    [Qwen Cloud](/th/providers/qwen),
    [MiniMax](/th/providers/minimax), [GLM Models](/th/providers/glm),
    [โมเดลในเครื่อง](/th/gateway/local-models), [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันใช้การสมัครสมาชิก Claude Max โดยไม่มี API key ได้ไหม">
    ได้

    เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น
    OpenClaw จึงถือว่าการยืนยันตัวตนการสมัครสมาชิก Claude และการใช้งาน `claude -p` ได้รับอนุมัติ
    สำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ หากคุณต้องการ
    การตั้งค่าฝั่งเซิร์ฟเวอร์ที่คาดการณ์ได้มากที่สุด ให้ใช้ Anthropic API key แทน

  </Accordion>

  <Accordion title="คุณรองรับการยืนยันตัวตนการสมัครสมาชิก Claude (Claude Pro หรือ Max) หรือไม่">
    รองรับ

    เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
    การใช้ Claude CLI ซ้ำและการใช้งาน `claude -p` ได้รับอนุมัติสำหรับการผสานรวมนี้
    เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่

    Anthropic setup-token ยังคงพร้อมใช้งานเป็นเส้นทางโทเค็น OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw ชอบการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อพร้อมใช้งาน
    สำหรับงาน production หรือ workload แบบหลายผู้ใช้ การยืนยันตัวตนด้วย Anthropic API key ยังคงเป็น
    ตัวเลือกที่ปลอดภัยกว่าและคาดการณ์ได้มากกว่า หากคุณต้องการตัวเลือกโฮสต์แบบสมัครสมาชิกอื่น ๆ
    ใน OpenClaw ให้ดู [OpenAI](/th/providers/openai), [Qwen / Model
    Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax), และ [GLM
    Models](/th/providers/glm)

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="ทำไมฉันจึงเห็น HTTP 429 rate_limit_error จาก Anthropic">
    นั่นหมายความว่า **โควตา/ขีดจำกัดอัตราของ Anthropic** ของคุณหมดสำหรับช่วงเวลาปัจจุบัน หากคุณ
    ใช้ **Claude CLI** ให้รอให้ช่วงเวลารีเซ็ตหรืออัปเกรดแผนของคุณ หากคุณ
    ใช้ **Anthropic API key** ให้ตรวจสอบ Anthropic Console
    สำหรับการใช้งาน/การเรียกเก็บเงิน และเพิ่มขีดจำกัดตามต้องการ

    หากข้อความเป็นโดยเฉพาะ:
    `Extra usage is required for long context requests` แสดงว่าคำขอกำลังพยายามใช้
    เบต้าบริบท 1M ของ Anthropic (`context1m: true`) ซึ่งทำงานได้เฉพาะเมื่อ
    ข้อมูลรับรองของคุณมีสิทธิ์สำหรับการเรียกเก็บเงินแบบบริบทยาว (การเรียกเก็บเงินผ่าน API key หรือ
    เส้นทาง OpenClaw Claude-login ที่เปิดใช้ Extra Usage)

    เคล็ดลับ: ตั้งค่า **โมเดลสำรอง** เพื่อให้ OpenClaw ตอบต่อได้ขณะที่ผู้ให้บริการถูกจำกัดอัตรา
    ดู [โมเดล](/th/cli/models), [OAuth](/th/concepts/oauth) และ
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/th/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)

  </Accordion>

  <Accordion title="รองรับ AWS Bedrock หรือไม่?">
    รองรับ OpenClaw มีผู้ให้บริการ **Amazon Bedrock (Converse)** ที่มาพร้อมในชุด เมื่อมีเครื่องหมาย env ของ AWS อยู่ OpenClaw สามารถค้นพบแคตตาล็อก Bedrock แบบสตรีมมิง/ข้อความโดยอัตโนมัติ และรวมเข้าเป็นผู้ให้บริการ `amazon-bedrock` แบบแฝงได้ มิฉะนั้นคุณสามารถเปิดใช้ `plugins.entries.amazon-bedrock.config.discovery.enabled` อย่างชัดเจน หรือเพิ่มรายการผู้ให้บริการด้วยตนเอง ดู [Amazon Bedrock](/th/providers/bedrock) และ [ผู้ให้บริการโมเดล](/th/providers/models) หากคุณต้องการโฟลว์คีย์แบบมีการจัดการ พร็อกซีที่เข้ากันได้กับ OpenAI หน้า Bedrock ก็ยังเป็นตัวเลือกที่ใช้ได้
  </Accordion>

  <Accordion title="การยืนยันตัวตนของ Codex ทำงานอย่างไร?">
    OpenClaw รองรับ **OpenAI Code (Codex)** ผ่าน OAuth (การลงชื่อเข้าใช้ ChatGPT) ใช้
    `openai-codex/gpt-5.5` สำหรับ Codex OAuth ผ่านตัวรัน PI เริ่มต้น ใช้
    `openai/gpt-5.5` สำหรับการเข้าถึงด้วยคีย์ API ของ OpenAI โดยตรง GPT-5.5 ยังสามารถใช้
    การสมัครสมาชิก/OAuth ผ่าน `openai-codex/gpt-5.5` หรือการรันแอปเซิร์ฟเวอร์ Codex แบบเนทีฟ
    ด้วย `openai/gpt-5.5` และ `agentRuntime.id: "codex"` ได้ด้วย
    ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers) และ [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
  </Accordion>

  <Accordion title="ทำไม OpenClaw ยังกล่าวถึง openai-codex?">
    `openai-codex` คือรหัสผู้ให้บริการและโปรไฟล์การยืนยันตัวตนสำหรับ ChatGPT/Codex OAuth
    และยังเป็นคำนำหน้าโมเดล PI อย่างชัดเจนสำหรับ Codex OAuth ด้วย:

    - `openai/gpt-5.5` = เส้นทางคีย์ API ของ OpenAI โดยตรงปัจจุบันใน PI
    - `openai-codex/gpt-5.5` = เส้นทาง Codex OAuth ใน PI
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = เส้นทางแอปเซิร์ฟเวอร์ Codex แบบเนทีฟ
    - `openai-codex:...` = รหัสโปรไฟล์การยืนยันตัวตน ไม่ใช่การอ้างอิงโมเดล

    หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform โดยตรง ให้ตั้งค่า
    `OPENAI_API_KEY` หากคุณต้องการการยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex ให้ลงชื่อเข้าใช้ด้วย
    `openclaw models auth login --provider openai-codex` และใช้
    การอ้างอิงโมเดล `openai-codex/*` สำหรับการรัน PI

  </Accordion>

  <Accordion title="ทำไมขีดจำกัด Codex OAuth จึงต่างจาก ChatGPT เว็บได้?">
    Codex OAuth ใช้หน้าต่างโควตาที่ OpenAI จัดการและขึ้นอยู่กับแผน ในทางปฏิบัติ
    ขีดจำกัดเหล่านั้นอาจต่างจากประสบการณ์บนเว็บไซต์/แอป ChatGPT แม้ว่า
    ทั้งคู่จะผูกกับบัญชีเดียวกันก็ตาม

    OpenClaw สามารถแสดงหน้าต่างการใช้งาน/โควตาของผู้ให้บริการที่มองเห็นได้ในปัจจุบันใน
    `openclaw models status` แต่จะไม่สร้างหรือปรับสิทธิ์ ChatGPT เว็บให้เป็น
    การเข้าถึง API โดยตรง หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform
    โดยตรง ให้ใช้ `openai/*` พร้อมคีย์ API

  </Accordion>

  <Accordion title="รองรับการยืนยันตัวตนแบบสมัครสมาชิกของ OpenAI (Codex OAuth) หรือไม่?">
    รองรับ OpenClaw รองรับ **OAuth สำหรับการสมัครสมาชิก OpenAI Code (Codex)** อย่างเต็มรูปแบบ
    OpenAI อนุญาตการใช้งาน OAuth แบบสมัครสมาชิกในเครื่องมือ/เวิร์กโฟลว์ภายนอก
    เช่น OpenClaw อย่างชัดเจน การเริ่มต้นใช้งานสามารถรันโฟลว์ OAuth ให้คุณได้

    ดู [OAuth](/th/concepts/oauth), [ผู้ให้บริการโมเดล](/th/concepts/model-providers) และ [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)

  </Accordion>

  <Accordion title="ฉันจะตั้งค่า Gemini CLI OAuth ได้อย่างไร?">
    Gemini CLI ใช้ **โฟลว์การยืนยันตัวตนของ Plugin** ไม่ใช่ client id หรือ secret ใน `openclaw.json`

    ขั้นตอน:

    1. ติดตั้ง Gemini CLI ในเครื่องเพื่อให้ `gemini` อยู่บน `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. เปิดใช้ Plugin: `openclaw plugins enable google`
    3. เข้าสู่ระบบ: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. โมเดลเริ่มต้นหลังเข้าสู่ระบบ: `google-gemini-cli/gemini-3-flash-preview`
    5. หากคำขอล้มเหลว ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway

    สิ่งนี้จะเก็บโทเค็น OAuth ไว้ในโปรไฟล์การยืนยันตัวตนบนโฮสต์ Gateway รายละเอียด: [ผู้ให้บริการโมเดล](/th/concepts/model-providers)

  </Accordion>

  <Accordion title="โมเดลภายในเครื่องเหมาะสำหรับแชตทั่วไปหรือไม่?">
    โดยปกติไม่เหมาะ OpenClaw ต้องใช้บริบทขนาดใหญ่และความปลอดภัยที่แข็งแกร่ง การ์ดขนาดเล็กจะตัดทอนและรั่วไหล หากจำเป็นต้องใช้ ให้รันบิลด์โมเดลที่ **ใหญ่ที่สุด** ที่คุณรันได้ในเครื่อง (LM Studio) และดู [/gateway/local-models](/th/gateway/local-models) โมเดลที่เล็กกว่า/ถูกควอนไทซ์เพิ่มความเสี่ยง prompt-injection - ดู [ความปลอดภัย](/th/gateway/security)
  </Accordion>

  <Accordion title="ฉันจะเก็บทราฟฟิกโมเดลโฮสต์ให้อยู่ในภูมิภาคเฉพาะได้อย่างไร?">
    เลือกเอ็นด์พอยต์ที่ตรึงภูมิภาค OpenRouter มีตัวเลือกที่โฮสต์ในสหรัฐฯ สำหรับ MiniMax, Kimi และ GLM เลือกเวอร์ชันที่โฮสต์ในสหรัฐฯ เพื่อเก็บข้อมูลไว้ในภูมิภาค คุณยังสามารถแสดง Anthropic/OpenAI ร่วมกับตัวเลือกเหล่านี้ได้โดยใช้ `models.mode: "merge"` เพื่อให้ตัวสำรองยังพร้อมใช้งาน ขณะยังเคารพผู้ให้บริการตามภูมิภาคที่คุณเลือก
  </Accordion>

  <Accordion title="ฉันต้องซื้อ Mac Mini เพื่อติดตั้งสิ่งนี้หรือไม่?">
    ไม่ต้อง OpenClaw รันบน macOS หรือ Linux ได้ (Windows ผ่าน WSL2) Mac mini เป็นตัวเลือกเสริม - บางคน
    ซื้อเพื่อใช้เป็นโฮสต์ที่เปิดตลอดเวลา แต่ VPS ขนาดเล็ก เซิร์ฟเวอร์ที่บ้าน หรือเครื่องระดับ Raspberry Pi ก็ใช้ได้เช่นกัน

    คุณต้องใช้ Mac เฉพาะ **เครื่องมือที่ใช้ได้เฉพาะบน macOS** สำหรับ iMessage ให้ใช้ [BlueBubbles](/th/channels/bluebubbles) (แนะนำ) - เซิร์ฟเวอร์ BlueBubbles รันบน Mac ใดก็ได้ และ Gateway สามารถรันบน Linux หรือที่อื่นได้ หากคุณต้องการเครื่องมืออื่นที่ใช้ได้เฉพาะบน macOS ให้รัน Gateway บน Mac หรือจับคู่โหนด macOS

    เอกสาร: [BlueBubbles](/th/channels/bluebubbles), [โหนด](/th/nodes), [โหมดรีโมตของ Mac](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันต้องใช้ Mac mini เพื่อรองรับ iMessage หรือไม่?">
    คุณต้องมี **อุปกรณ์ macOS บางเครื่อง** ที่ลงชื่อเข้าใช้ Messages ไม่จำเป็นต้องเป็น Mac mini -
    Mac ใดก็ได้ใช้ได้ **ใช้ [BlueBubbles](/th/channels/bluebubbles)** (แนะนำ) สำหรับ iMessage - เซิร์ฟเวอร์ BlueBubbles รันบน macOS ขณะที่ Gateway สามารถรันบน Linux หรือที่อื่นได้

    การตั้งค่าทั่วไป:

    - รัน Gateway บน Linux/VPS และรันเซิร์ฟเวอร์ BlueBubbles บน Mac ใดก็ได้ที่ลงชื่อเข้าใช้ Messages
    - รันทุกอย่างบน Mac หากคุณต้องการการตั้งค่าเครื่องเดียวที่ง่ายที่สุด

    เอกสาร: [BlueBubbles](/th/channels/bluebubbles), [โหนด](/th/nodes),
    [โหมดรีโมตของ Mac](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ถ้าฉันซื้อ Mac mini เพื่อรัน OpenClaw ฉันเชื่อมต่อมันกับ MacBook Pro ได้ไหม?">
    ได้ **Mac mini สามารถรัน Gateway** และ MacBook Pro ของคุณสามารถเชื่อมต่อเป็น
    **โหนด** (อุปกรณ์ร่วม) โหนดไม่ได้รัน Gateway - แต่ให้ความสามารถเพิ่มเติม
    เช่น หน้าจอ/กล้อง/canvas และ `system.run` บนอุปกรณ์นั้น

    รูปแบบทั่วไป:

    - Gateway บน Mac mini (เปิดตลอดเวลา)
    - MacBook Pro รันแอป macOS หรือโฮสต์โหนด แล้วจับคู่กับ Gateway
    - ใช้ `openclaw nodes status` / `openclaw nodes list` เพื่อดู

    เอกสาร: [โหนด](/th/nodes), [CLI โหนด](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันใช้ Bun ได้ไหม?">
    **ไม่แนะนำ** Bun เราพบบั๊กรันไทม์ โดยเฉพาะกับ WhatsApp และ Telegram
    ใช้ **Node** สำหรับ Gateway ที่เสถียร

    หากคุณยังต้องการทดลองกับ Bun ให้ทำบน Gateway ที่ไม่ใช่โปรดักชัน
    โดยไม่มี WhatsApp/Telegram

  </Accordion>

  <Accordion title="Telegram: ต้องใส่อะไรใน allowFrom?">
    `channels.telegram.allowFrom` คือ **ID ผู้ใช้ Telegram ของผู้ส่งที่เป็นคนจริง** (ตัวเลข) ไม่ใช่ชื่อผู้ใช้บอต

    การตั้งค่าจะขอเฉพาะ ID ผู้ใช้แบบตัวเลขเท่านั้น หากคุณมีรายการ `@username` แบบเดิมในคอนฟิกอยู่แล้ว `openclaw doctor --fix` สามารถพยายามแปลงให้ได้

    ปลอดภัยกว่า (ไม่ใช้บอตบุคคลที่สาม):

    - ส่ง DM ไปหาบอตของคุณ จากนั้นรัน `openclaw logs --follow` และอ่าน `from.id`

    Bot API อย่างเป็นทางการ:

    - ส่ง DM ไปหาบอตของคุณ จากนั้นเรียก `https://api.telegram.org/bot<bot_token>/getUpdates` และอ่าน `message.from.id`

    บุคคลที่สาม (เป็นส่วนตัวน้อยกว่า):

    - ส่ง DM ไปที่ `@userinfobot` หรือ `@getidsbot`

    ดู [/channels/telegram](/th/channels/telegram#access-control-and-activation)

  </Accordion>

  <Accordion title="หลายคนใช้หมายเลข WhatsApp เดียวกับอินสแตนซ์ OpenClaw ต่างกันได้ไหม?">
    ได้ ผ่าน **การกำหนดเส้นทางแบบหลายเอเจนต์** ผูก **DM** WhatsApp ของผู้ส่งแต่ละคน (เพียร์ `kind: "direct"`, ผู้ส่ง E.164 เช่น `+15551234567`) กับ `agentId` ที่ต่างกัน เพื่อให้แต่ละคนได้พื้นที่ทำงานและที่เก็บเซสชันของตนเอง การตอบกลับยังคงมาจาก **บัญชี WhatsApp เดียวกัน** และการควบคุมการเข้าถึง DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) เป็นแบบรวมต่อบัญชี WhatsApp ดู [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent) และ [WhatsApp](/th/channels/whatsapp)
  </Accordion>

  <Accordion title='ฉันรันเอเจนต์ "แชตเร็ว" และเอเจนต์ "Opus สำหรับเขียนโค้ด" ได้ไหม?'>
    ได้ ใช้การกำหนดเส้นทางแบบหลายเอเจนต์: กำหนดโมเดลเริ่มต้นของแต่ละเอเจนต์เอง จากนั้นผูกเส้นทางขาเข้า (บัญชีผู้ให้บริการหรือเพียร์เฉพาะ) กับแต่ละเอเจนต์ คอนฟิกตัวอย่างอยู่ใน [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent) ดูเพิ่มเติม [โมเดล](/th/concepts/models) และ [การกำหนดค่า](/th/gateway/configuration)
  </Accordion>

  <Accordion title="Homebrew ใช้บน Linux ได้ไหม?">
    ได้ Homebrew รองรับ Linux (Linuxbrew) การตั้งค่าอย่างรวดเร็ว:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    หากคุณรัน OpenClaw ผ่าน systemd ตรวจให้แน่ใจว่า PATH ของบริการมี `/home/linuxbrew/.linuxbrew/bin` (หรือ prefix ของ brew ของคุณ) เพื่อให้เครื่องมือที่ติดตั้งด้วย `brew` ถูก resolve ในเชลล์ที่ไม่ใช่แบบล็อกอิน
    บิลด์ล่าสุดยังเติมไดเรกทอรี bin ของผู้ใช้ที่พบบ่อยบนบริการ Linux systemd ไว้ด้านหน้า (เช่น `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) และเคารพ `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` และ `FNM_DIR` เมื่อมีการตั้งค่าไว้

  </Accordion>

  <Accordion title="ความแตกต่างระหว่างการติดตั้งจาก git แบบแก้ไขได้กับการติดตั้ง npm">
    - **การติดตั้งแบบแก้ไขได้ (git):** checkout ซอร์สเต็ม แก้ไขได้ เหมาะที่สุดสำหรับผู้ร่วมพัฒนา
      คุณรันบิลด์ในเครื่องและแพตช์โค้ด/เอกสารได้
    - **การติดตั้ง npm:** ติดตั้ง CLI แบบ global ไม่มี repo เหมาะที่สุดสำหรับ "แค่รัน"
      อัปเดตมาจาก dist-tags ของ npm

    เอกสาร: [เริ่มต้นใช้งาน](/th/start/getting-started), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันสลับระหว่างการติดตั้ง npm และ git ภายหลังได้ไหม?">
    ได้ ใช้ `openclaw update --channel ...` เมื่อ OpenClaw ติดตั้งอยู่แล้ว
    สิ่งนี้ **ไม่ลบข้อมูลของคุณ** - เปลี่ยนเฉพาะการติดตั้งโค้ด OpenClaw เท่านั้น
    สถานะ (`~/.openclaw`) และพื้นที่ทำงาน (`~/.openclaw/workspace`) ของคุณยังคงอยู่เหมือนเดิม

    จาก npm ไป git:

    ```bash
    openclaw update --channel dev
    ```

    จาก git ไป npm:

    ```bash
    openclaw update --channel stable
    ```

    เพิ่ม `--dry-run` เพื่อดูตัวอย่างการสลับโหมดที่วางแผนไว้ก่อน ตัวอัปเดตรัน
    การติดตามผลของ Doctor รีเฟรชแหล่ง Plugin สำหรับช่องทางเป้าหมาย และ
    รีสตาร์ต Gateway เว้นแต่คุณส่ง `--no-restart`

    ตัวติดตั้งยังสามารถบังคับโหมดใดโหมดหนึ่งได้ด้วย:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    เคล็ดลับการสำรองข้อมูล: ดู [กลยุทธ์การสำรองข้อมูล](#where-things-live-on-disk)

  </Accordion>

  <Accordion title="ฉันควรรัน Gateway บนแล็ปท็อปหรือ VPS?">
    คำตอบสั้น ๆ: **หากคุณต้องการความเสถียรตลอด 24/7 ให้ใช้ VPS** หากคุณต้องการ
    ความยุ่งยากต่ำที่สุดและรับได้กับโหมด sleep/การรีสตาร์ต ให้รันในเครื่อง

    **แล็ปท็อป (Gateway ภายในเครื่อง)**

    - **ข้อดี:** ไม่มีค่าเซิร์ฟเวอร์ เข้าถึงไฟล์ภายในเครื่องได้โดยตรง มีหน้าต่างเบราว์เซอร์แบบสด
    - **ข้อเสีย:** sleep/เครือข่ายหลุด = การเชื่อมต่อถูกตัด การอัปเดต OS/การรีบูตขัดจังหวะ ต้องเปิดเครื่องไว้

    **VPS / คลาวด์**

    - **ข้อดี:** เปิดตลอดเวลา เครือข่ายเสถียร ไม่มีปัญหา sleep ของแล็ปท็อป ดูแลให้รันต่อได้ง่ายกว่า
    - **ข้อเสีย:** มักรันแบบ headless (ใช้ภาพหน้าจอ) เข้าถึงไฟล์ระยะไกลเท่านั้น ต้อง SSH เพื่ออัปเดต

    **หมายเหตุเฉพาะของ OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord ทั้งหมดทำงานจาก VPS ได้ดี ข้อแลกเปลี่ยนจริงเพียงอย่างเดียวคือ **เบราว์เซอร์ headless** เทียบกับหน้าต่างที่มองเห็นได้ ดู [เบราว์เซอร์](/th/tools/browser)

    **ค่าเริ่มต้นที่แนะนำ:** VPS หากคุณเคยพบปัญหา Gateway หลุดการเชื่อมต่อมาก่อน การใช้งานในเครื่องเหมาะมากเมื่อคุณกำลังใช้งาน Mac อยู่และต้องการเข้าถึงไฟล์ในเครื่องหรือทำ UI อัตโนมัติด้วยเบราว์เซอร์ที่มองเห็นได้

  </Accordion>

  <Accordion title="การรัน OpenClaw บนเครื่องเฉพาะสำคัญแค่ไหน?">
    ไม่จำเป็น แต่**แนะนำเพื่อความน่าเชื่อถือและการแยกสภาพแวดล้อม**

    - **โฮสต์เฉพาะ (VPS/Mac mini/Pi):** เปิดใช้งานตลอดเวลา มีการรบกวนจากโหมดพัก/รีบูตน้อยกว่า สิทธิ์สะอาดกว่า และดูแลให้รันต่อเนื่องได้ง่ายกว่า
    - **แล็ปท็อป/เดสก์ท็อปที่ใช้งานร่วมกัน:** ใช้ทดสอบและใช้งานจริงระหว่างที่ใช้งานอยู่ได้ปกติ แต่ควรคาดว่าจะมีการหยุดชั่วคราวเมื่อเครื่องเข้าสู่โหมดพักหรืออัปเดต

    หากคุณต้องการข้อดีของทั้งสองแบบ ให้เก็บ Gateway ไว้บนโฮสต์เฉพาะ แล้วจับคู่แล็ปท็อปของคุณเป็น **node** สำหรับเครื่องมือหน้าจอ/กล้อง/การสั่งรันในเครื่อง ดู [Nodes](/th/nodes)
    สำหรับแนวทางด้านความปลอดภัย โปรดอ่าน [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อกำหนดขั้นต่ำของ VPS และ OS ที่แนะนำคืออะไร?">
    OpenClaw ใช้ทรัพยากรน้อย สำหรับ Gateway พื้นฐาน + ช่องแชตหนึ่งช่อง:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB, ดิสก์ประมาณ 500MB
    - **แนะนำ:** 1-2 vCPU, RAM 2GB ขึ้นไปเพื่อเผื่อทรัพยากร (ล็อก สื่อ หลายช่อง) เครื่องมือ Node และการทำเบราว์เซอร์อัตโนมัติอาจใช้ทรัพยากรมาก

    OS: ใช้ **Ubuntu LTS** (หรือ Debian/Ubuntu รุ่นใหม่ใดก็ได้) เส้นทางติดตั้งบน Linux ได้รับการทดสอบดีที่สุดบนระบบนั้น

    เอกสาร: [Linux](/th/platforms/linux), [การโฮสต์ VPS](/th/vps)

  </Accordion>

  <Accordion title="ฉันรัน OpenClaw ใน VM ได้ไหม และมีข้อกำหนดอะไรบ้าง?">
    ได้ ให้ปฏิบัติกับ VM เหมือน VPS: ต้องเปิดใช้งานตลอดเวลา เข้าถึงได้ และมี
    RAM เพียงพอสำหรับ Gateway และช่องต่าง ๆ ที่คุณเปิดใช้งาน

    แนวทางพื้นฐาน:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB
    - **แนะนำ:** RAM 2GB ขึ้นไป หากคุณรันหลายช่อง การทำเบราว์เซอร์อัตโนมัติ หรือเครื่องมือสื่อ
    - **OS:** Ubuntu LTS หรือ Debian/Ubuntu รุ่นใหม่อื่น

    หากคุณใช้ Windows, **WSL2 เป็นการตั้งค่าแบบ VM ที่ง่ายที่สุด** และมีความเข้ากันได้กับเครื่องมือ
    ดีที่สุด ดู [Windows](/th/platforms/windows), [การโฮสต์ VPS](/th/vps)
    หากคุณรัน macOS ใน VM โปรดดู [macOS VM](/th/install/macos-vm)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [คำถามที่พบบ่อย](/th/help/faq) — คำถามที่พบบ่อยหลัก (โมเดล เซสชัน Gateway ความปลอดภัย และอื่น ๆ)
- [ภาพรวมการติดตั้ง](/th/install)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [การแก้ไขปัญหา](/th/help/troubleshooting)
