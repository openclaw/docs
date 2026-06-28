---
read_when:
    - ติดตั้งใหม่ การเริ่มต้นใช้งานค้าง หรือข้อผิดพลาดในการรันครั้งแรก
    - การเลือกการยืนยันตัวตนและการสมัครใช้งานผู้ให้บริการ
    - ไม่สามารถเข้าถึง docs.openclaw.ai, ไม่สามารถเปิดแดชบอร์ดได้, การติดตั้งค้าง
sidebarTitle: First-run FAQ
summary: 'คำถามที่พบบ่อย: การตั้งค่าเริ่มต้นแบบด่วนและการรันครั้งแรก — ติดตั้ง, onboard, auth, การสมัครสมาชิก, ข้อผิดพลาดเริ่มต้น'
title: 'คำถามที่พบบ่อย: การตั้งค่าครั้งแรก'
x-i18n:
    generated_at: "2026-06-28T20:43:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef4122bc0c3068806591ccdc1bf7f3eb5a81cc7efd2066d07f948fe953284be
    source_path: help/faq-first-run.md
    workflow: 16
---

  ถามตอบสำหรับการเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก สำหรับการใช้งานประจำวัน โมเดล การยืนยันตัวตน เซสชัน
  และการแก้ปัญหา โปรดดู [FAQ](/th/help/faq) หลัก

  ## การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก

  <AccordionGroup>
  <Accordion title="ฉันติดปัญหา วิธีที่เร็วที่สุดในการไปต่อ">
    ใช้เอเจนต์ AI ในเครื่องที่สามารถ **มองเห็นเครื่องของคุณ** ได้ วิธีนี้มีประสิทธิภาพกว่าการถาม
    ใน Discord มาก เพราะกรณี "ฉันติดปัญหา" ส่วนใหญ่เป็น **ปัญหาคอนฟิกหรือสภาพแวดล้อมในเครื่อง** ที่
    ผู้ช่วยระยะไกลตรวจสอบไม่ได้

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    เครื่องมือเหล่านี้สามารถอ่านรีโป รันคำสั่ง ตรวจสอบล็อก และช่วยแก้การตั้งค่าระดับเครื่อง
    (PATH, services, permissions, auth files) ของคุณได้ ให้เครื่องมือเหล่านี้เข้าถึง **ซอร์สเช็กเอาต์เต็มชุด** ผ่าน
    การติดตั้งแบบแก้ไขได้ (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    วิธีนี้จะติดตั้ง OpenClaw **จาก git checkout** เพื่อให้เอเจนต์อ่านโค้ด + เอกสาร และ
    วิเคราะห์เวอร์ชันตรงกับที่คุณกำลังรันได้ คุณสามารถสลับกลับไปใช้เวอร์ชัน stable ภายหลังได้เสมอ
    โดยรันตัวติดตั้งอีกครั้งโดยไม่ใส่ `--install-method git`

    เคล็ดลับ: ขอให้เอเจนต์ **วางแผนและกำกับ** การแก้ไข (ทีละขั้นตอน) แล้วจึงสั่งให้รันเฉพาะ
    คำสั่งที่จำเป็น วิธีนี้ช่วยให้การเปลี่ยนแปลงเล็กลงและตรวจสอบได้ง่ายขึ้น

    หากคุณพบข้อบกพร่องจริงหรือมีวิธีแก้ โปรดเปิด GitHub issue หรือส่ง PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    เริ่มด้วยคำสั่งเหล่านี้ (แชร์เอาต์พุตเมื่อขอความช่วยเหลือ):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    คำสั่งเหล่านี้ทำอะไร:

    - `openclaw status`: ภาพรวมอย่างรวดเร็วของสุขภาพ gateway/agent + คอนฟิกพื้นฐาน
    - `openclaw models status`: ตรวจสอบการยืนยันตัวตนของ provider + ความพร้อมใช้งานของโมเดล
    - `openclaw doctor`: ตรวจสอบและซ่อมปัญหาคอนฟิก/สถานะที่พบบ่อย

    การตรวจสอบ CLI อื่นที่มีประโยชน์: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`

    วงจรดีบักด่วน: [60 วินาทีแรกหากมีบางอย่างเสีย](/th/help/faq#first-60-seconds-if-something-is-broken)
    เอกสารติดตั้ง: [ติดตั้ง](/th/install), [แฟล็กตัวติดตั้ง](/th/install/installer), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="Heartbeat ข้ามการรันอยู่เรื่อย ๆ เหตุผลการข้ามหมายความว่าอย่างไร?">
    เหตุผลทั่วไปที่ heartbeat ถูกข้าม:

    - `quiet-hours`: อยู่นอกช่วงเวลา active-hours ที่ตั้งค่าไว้
    - `empty-heartbeat-file`: มี `HEARTBEAT.md` อยู่ แต่มีเฉพาะโครงเปล่า เช่น บรรทัดว่าง คอมเมนต์ หัวข้อ fence หรือเช็กลิสต์ว่าง
    - `no-tasks-due`: โหมดงานของ `HEARTBEAT.md` เปิดใช้งานอยู่ แต่ยังไม่มีช่วงเวลางานใดถึงกำหนด
    - `alerts-disabled`: การมองเห็น heartbeat ทั้งหมดถูกปิด (`showOk`, `showAlerts`, และ `useIndicator` ปิดทั้งหมด)

    ในโหมดงาน timestamp ที่ถึงกำหนดจะถูกเลื่อนไปข้างหน้าเฉพาะหลังจากการรัน heartbeat จริง
    เสร็จสมบูรณ์เท่านั้น การรันที่ถูกข้ามจะไม่ทำเครื่องหมายว่างานเสร็จแล้ว

    เอกสาร: [Heartbeat](/th/gateway/heartbeat), [ระบบอัตโนมัติ](/th/automation)

  </Accordion>

  <Accordion title="วิธีที่แนะนำในการติดตั้งและตั้งค่า OpenClaw">
    รีโปแนะนำให้รันจากซอร์สและใช้ออนบอร์ดดิ้ง:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    วิซาร์ดยังสามารถ build UI assets ให้อัตโนมัติได้ด้วย หลังออนบอร์ดดิ้ง โดยทั่วไปคุณจะรัน Gateway บนพอร์ต **18789**

    จากซอร์ส (ผู้ร่วมพัฒนา/dev):

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

  <Accordion title="ฉันจะเปิดแดชบอร์ดหลังออนบอร์ดดิ้งได้อย่างไร?">
    วิซาร์ดจะเปิดเบราว์เซอร์ของคุณด้วย URL แดชบอร์ดแบบสะอาด (ไม่มีโทเค็น) ทันทีหลังออนบอร์ดดิ้ง และพิมพ์ลิงก์ไว้ในสรุปด้วย เปิดแท็บนั้นค้างไว้ หากไม่เปิดขึ้นมา ให้คัดลอก/วาง URL ที่พิมพ์ไว้บนเครื่องเดียวกัน
  </Accordion>

  <Accordion title="ฉันจะยืนยันตัวตนแดชบอร์ดบน localhost เทียบกับ remote ได้อย่างไร?">
    **Localhost (เครื่องเดียวกัน):**

    - เปิด `http://127.0.0.1:18789/`
    - หากระบบขอการยืนยันตัวตนแบบ shared-secret ให้วางโทเค็นหรือรหัสผ่านที่ตั้งค่าไว้ใน Control UI settings
    - แหล่งที่มาของโทเค็น: `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
    - แหล่งที่มาของรหัสผ่าน: `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
    - หากยังไม่ได้ตั้งค่า shared secret ให้สร้างโทเค็นด้วย `openclaw doctor --generate-gateway-token`

    **ไม่ได้อยู่บน localhost:**

    - **Tailscale Serve** (แนะนำ): คงการ bind loopback ไว้ รัน `openclaw gateway --tailscale serve` เปิด `https://<magicdns>/` หาก `gateway.auth.allowTailscale` เป็น `true` identity headers จะผ่านการยืนยันตัวตนของ Control UI/WebSocket (ไม่ต้องวาง shared secret โดยถือว่า gateway host เชื่อถือได้); HTTP APIs ยังต้องใช้การยืนยันตัวตนแบบ shared-secret เว้นแต่คุณตั้งใจใช้ private-ingress `none` หรือ trusted-proxy HTTP auth
      ความพยายาม Serve auth ที่ผิดพร้อมกันจากไคลเอนต์เดียวกันจะถูกจัดลำดับก่อนที่ failed-auth limiter จะบันทึก ดังนั้นการลองผิดครั้งที่สองอาจแสดง `retry later` แล้ว
    - **การ bind Tailnet**: รัน `openclaw gateway --bind tailnet --token "<token>"` (หรือตั้งค่า password auth), เปิด `http://<tailscale-ip>:18789/` แล้ววาง shared secret ที่ตรงกันใน dashboard settings
    - **reverse proxy ที่รับรู้ identity**: วาง Gateway ไว้หลัง trusted proxy ตั้งค่า `gateway.auth.mode: "trusted-proxy"` แล้วเปิด URL ของ proxy พร็อกซี loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/` การยืนยันตัวตนแบบ shared-secret ยังมีผลผ่าน tunnel; หากถูกถาม ให้วางโทเค็นหรือรหัสผ่านที่ตั้งค่าไว้

    ดู [แดชบอร์ด](/th/web/dashboard) และ [พื้นผิวเว็บ](/th/web) สำหรับ bind modes และรายละเอียดการยืนยันตัวตน

  </Accordion>

  <Accordion title="ทำไมมีคอนฟิกการอนุมัติ exec สองชุดสำหรับการอนุมัติผ่านแชต?">
    ทั้งสองควบคุมคนละชั้น:

    - `approvals.exec`: ส่งต่อ approval prompts ไปยังปลายทางแชต
    - `channels.<channel>.execApprovals`: ทำให้ช่องนั้นทำหน้าที่เป็น native approval client สำหรับ exec approvals

    นโยบาย exec ของโฮสต์ยังคงเป็นด่านอนุมัติจริง คอนฟิกแชตควบคุมเฉพาะว่า approval
    prompts จะปรากฏที่ใดและผู้ใช้ตอบได้อย่างไร

    ในการตั้งค่าส่วนใหญ่ คุณ **ไม่** จำเป็นต้องใช้ทั้งสองอย่าง:

    - หากแชตรองรับคำสั่งและการตอบกลับอยู่แล้ว `/approve` ในแชตเดียวกันจะทำงานผ่านเส้นทางร่วม
    - หากช่อง native ที่รองรับสามารถอนุมานผู้อนุมัติได้อย่างปลอดภัย ตอนนี้ OpenClaw จะเปิดใช้ DM-first native approvals อัตโนมัติเมื่อ `channels.<channel>.execApprovals.enabled` ไม่ได้ตั้งค่าไว้หรือเป็น `"auto"`
    - เมื่อมี native approval cards/buttons ให้ใช้ UI native นั้นเป็นเส้นทางหลัก เอเจนต์ควรใส่คำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือบอกว่า chat approvals ไม่พร้อมใช้งาน หรือการอนุมัติแบบ manual เป็นเส้นทางเดียว
    - ใช้ `approvals.exec` เฉพาะเมื่อ prompts ต้องถูกส่งต่อไปยังแชตอื่นหรือห้อง ops ที่ระบุไว้ด้วย
    - ใช้ `channels.<channel>.execApprovals.target: "channel"` หรือ `"both"` เฉพาะเมื่อคุณต้องการโพสต์ approval prompts กลับเข้าไปในห้อง/หัวข้อเดิมอย่างชัดเจน
    - Plugin approvals แยกออกไปอีก: โดยค่าเริ่มต้นจะใช้ `/approve` ในแชตเดียวกัน, มี `approvals.plugin` forwarding เป็นตัวเลือก, และมีเพียงบาง native channels ที่คง plugin-approval-native handling เพิ่มเติมไว้

    สรุปสั้น ๆ: forwarding มีไว้สำหรับการกำหนดเส้นทาง ส่วน native client config มีไว้สำหรับ UX เฉพาะช่องที่สมบูรณ์ขึ้น
    ดู [Exec Approvals](/th/tools/exec-approvals)

  </Accordion>

  <Accordion title="ฉันต้องใช้ runtime อะไร?">
    ต้องใช้ Node **>= 22** แนะนำให้ใช้ `pnpm` ไม่แนะนำให้ใช้ Bun สำหรับ Gateway
  </Accordion>

  <Accordion title="รันบน Raspberry Pi ได้ไหม?">
    ได้ Gateway มีน้ำหนักเบา - เอกสารระบุว่า **RAM 512MB-1GB**, **1 core**, และพื้นที่ดิสก์ประมาณ **500MB**
    เพียงพอสำหรับการใช้งานส่วนตัว และระบุว่า **Raspberry Pi 4 สามารถรันได้**

    หากคุณต้องการเผื่อทรัพยากรเพิ่มเติม (ล็อก สื่อ บริการอื่น ๆ) แนะนำให้ใช้ **2GB** แต่
    ไม่ใช่ขั้นต่ำบังคับ

    เคล็ดลับ: Raspberry Pi/VPS ขนาดเล็กสามารถโฮสต์ Gateway ได้ และคุณสามารถจับคู่ **nodes** บนแล็ปท็อป/โทรศัพท์ของคุณเพื่อ
    ใช้หน้าจอ/กล้อง/canvas หรือการรันคำสั่งในเครื่อง ดู [Nodes](/th/nodes)

  </Accordion>

  <Accordion title="มีเคล็ดลับสำหรับการติดตั้งบน Raspberry Pi ไหม?">
    สรุปสั้น ๆ: ใช้งานได้ แต่คาดว่าจะมีจุดสะดุดบ้าง

    - ใช้ OS แบบ **64-bit** และคง Node >= 22
    - แนะนำให้ใช้ **การติดตั้งแบบแก้ไขได้ (git)** เพื่อให้ดูล็อกและอัปเดตได้เร็ว
    - เริ่มโดยยังไม่เพิ่ม channels/skills แล้วค่อยเพิ่มทีละอย่าง
    - หากเจอปัญหาไบนารีแปลก ๆ โดยปกติคือปัญหา **ความเข้ากันได้กับ ARM**

    เอกสาร: [Linux](/th/platforms/linux), [ติดตั้ง](/th/install)

  </Accordion>

  <Accordion title="ค้างอยู่ที่ wake up my friend / onboarding will not hatch ต้องทำอย่างไร?">
    หน้าจอนั้นขึ้นกับการที่ Gateway ติดต่อได้และยืนยันตัวตนแล้ว TUI ยังส่ง
    "Wake up, my friend!" อัตโนมัติในการ hatch ครั้งแรกด้วย หากคุณเห็นบรรทัดนั้นโดย **ไม่มีการตอบกลับ**
    และ tokens ค้างที่ 0 แปลว่าเอเจนต์ไม่เคยรัน

    1. รีสตาร์ต Gateway:

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

    หาก Gateway อยู่ระยะไกล ตรวจสอบว่า tunnel/Tailscale connection ทำงานอยู่ และ UI
    ชี้ไปยัง Gateway ที่ถูกต้อง ดู [การเข้าถึงระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันย้ายการตั้งค่าไปเครื่องใหม่ (Mac mini) โดยไม่ต้องทำ onboarding ใหม่ได้ไหม?">
    ได้ คัดลอก **state directory** และ **workspace** แล้วรัน Doctor หนึ่งครั้ง วิธีนี้
    จะคงบอตของคุณให้ "เหมือนเดิมทุกประการ" (memory, session history, auth, และ channel
    state) ตราบใดที่คุณคัดลอก **ทั้งสอง** ตำแหน่ง:

    1. ติดตั้ง OpenClaw บนเครื่องใหม่
    2. คัดลอก `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`) จากเครื่องเก่า
    3. คัดลอก workspace ของคุณ (ค่าเริ่มต้น: `~/.openclaw/workspace`)
    4. รัน `openclaw doctor` และรีสตาร์ตบริการ Gateway

    วิธีนี้จะรักษา config, auth profiles, WhatsApp creds, sessions, และ memory ไว้ หากคุณอยู่ใน
    remote mode โปรดจำว่า gateway host เป็นเจ้าของ session store และ workspace

    **สำคัญ:** หากคุณเพียง commit/push workspace ของคุณไปที่ GitHub คุณกำลังสำรอง
    **memory + bootstrap files** แต่ **ไม่ได้** สำรอง session history หรือ auth สิ่งเหล่านั้นอยู่
    ใต้ `~/.openclaw/` (เช่น `~/.openclaw/agents/<agentId>/sessions/`)

    ที่เกี่ยวข้อง: [การย้ายระบบ](/th/install/migrating), [สิ่งต่าง ๆ อยู่ที่ไหนบนดิสก์](/th/help/faq#where-things-live-on-disk),
    [Agent workspace](/th/concepts/agent-workspace), [Doctor](/th/gateway/doctor),
    [Remote mode](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันจะดูว่ามีอะไรใหม่ในเวอร์ชันล่าสุดได้ที่ไหน?">
    ตรวจสอบ changelog บน GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    รายการใหม่ล่าสุดอยู่ด้านบน หากส่วนบนสุดระบุว่า **Unreleased** ส่วนถัดไปที่มีวันที่
    คือเวอร์ชันล่าสุดที่เผยแพร่แล้ว รายการจะถูกจัดกลุ่มตาม **ไฮไลต์**, **การเปลี่ยนแปลง**, และ
    **การแก้ไข** (รวมถึงส่วนเอกสาร/อื่น ๆ เมื่อจำเป็น)

  </Accordion>

  <Accordion title="เข้าถึง docs.openclaw.ai ไม่ได้ (ข้อผิดพลาด SSL)">
    การเชื่อมต่อ Comcast/Xfinity บางส่วนบล็อก `docs.openclaw.ai` ผิดพลาดผ่าน Xfinity
    Advanced Security ให้ปิดใช้งานหรือเพิ่ม `docs.openclaw.ai` ใน allowlist แล้วลองใหม่
    โปรดช่วยเราแก้การบล็อกโดยรายงานที่นี่: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)

    หากคุณยังเข้าเว็บไซต์ไม่ได้ เอกสารจะถูกมิเรอร์ไว้บน GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="ความแตกต่างระหว่าง stable และ beta">
    **Stable** และ **beta** คือ **npm dist-tags** ไม่ใช่สายโค้ดแยกกัน:

    - `latest` = stable
    - `beta` = build ระยะแรกสำหรับการทดสอบ

    โดยปกติ release แบบ stable จะเข้าสู่ **beta** ก่อน จากนั้นขั้นตอน
    promotion ที่ชัดเจนจะย้ายเวอร์ชันเดียวกันนั้นไปที่ `latest` Maintainer ยังสามารถ
    publish ไปที่ `latest` โดยตรงได้เมื่อจำเป็น นี่คือเหตุผลที่ beta และ stable อาจ
    ชี้ไปที่ **เวอร์ชันเดียวกัน** หลัง promotion

    ดูสิ่งที่เปลี่ยนแปลง:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    สำหรับคำสั่งติดตั้งแบบบรรทัดเดียวและความแตกต่างระหว่าง beta กับ dev โปรดดู accordion ด้านล่าง

  </Accordion>

  <Accordion title="ฉันจะติดตั้งเวอร์ชัน beta ได้อย่างไร และ beta ต่างจาก dev อย่างไร?">
    **Beta** คือ npm dist-tag `beta` (อาจตรงกับ `latest` หลัง promotion)
    **Dev** คือ head ที่เปลี่ยนไปเรื่อย ๆ ของ `main` (git); เมื่อ publish แล้วจะใช้ npm dist-tag `dev`

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

  <Accordion title="ฉันจะลองบิตล่าสุดได้อย่างไร?">
    มีสองตัวเลือก:

    1. **ช่องทาง Dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    คำสั่งนี้จะสลับไปที่ branch `main` และอัปเดตจากซอร์ส

    2. **การติดตั้งที่แก้ไขได้ (จากไซต์ตัวติดตั้ง):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    วิธีนี้จะให้ repo ในเครื่องที่คุณแก้ไขได้ แล้วอัปเดตผ่าน git

    หากคุณต้องการ clone แบบสะอาดด้วยตนเอง ให้ใช้:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [ช่องทางการพัฒนา](/th/install/development-channels),
    [ติดตั้ง](/th/install)

  </Accordion>

  <Accordion title="การติดตั้งและ onboarding มักใช้เวลานานเท่าไร?">
    แนวทางคร่าว ๆ:

    - **ติดตั้ง:** 2-5 นาที
    - **onboarding QuickStart:** โดยปกติไม่กี่นาที
    - **onboarding เต็มรูปแบบ:** นานขึ้นเมื่อ provider sign-in, การจับคู่ช่องทาง, การติดตั้ง daemon,
      การดาวน์โหลดเครือข่าย, skills หรือ plugins เสริมต้องตั้งค่าเพิ่มเติม

    วิซาร์ด CLI จะแสดง timeline นี้ตั้งแต่ต้น คุณสามารถข้ามขั้นตอนเสริมและกลับมา
    ภายหลังด้วย `openclaw configure`

    หากค้าง ให้ใช้ [ตัวติดตั้งค้าง](#quick-start-and-first-run-setup)
    และลูป debug อย่างรวดเร็วใน [ฉันติดอยู่](#quick-start-and-first-run-setup)

  </Accordion>

  <Accordion title="ตัวติดตั้งค้าง? ฉันจะรับ feedback เพิ่มได้อย่างไร?">
    รันตัวติดตั้งอีกครั้งพร้อม **เอาต์พุตแบบละเอียด**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    ติดตั้ง beta พร้อมรายละเอียดแบบ verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    สำหรับการติดตั้งแบบแก้ไขได้ (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    เทียบเท่าบน Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    ตัวเลือกเพิ่มเติม: [แฟล็กตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="การติดตั้ง Windows แจ้งว่าไม่พบ git หรือไม่รู้จัก openclaw">
    ปัญหา Windows ที่พบบ่อยสองอย่าง:

    **1) npm error spawn git / ไม่พบ git**

    - ติดตั้ง **Git for Windows** และตรวจสอบว่า `git` อยู่ใน PATH ของคุณ
    - ปิดแล้วเปิด PowerShell ใหม่ จากนั้นรันตัวติดตั้งอีกครั้ง

    **2) ไม่รู้จัก openclaw หลังติดตั้ง**

    - โฟลเดอร์ npm global bin ของคุณไม่อยู่ใน PATH
    - ตรวจสอบ path:

      ```powershell
      npm config get prefix
      ```

    - เพิ่ม directory นั้นไปยัง PATH ของผู้ใช้ (บน Windows ไม่ต้องมี suffix `\bin`; ในระบบส่วนใหญ่คือ `%AppData%\npm`)
    - ปิดแล้วเปิด PowerShell ใหม่หลังอัปเดต PATH

    สำหรับการตั้งค่าเดสก์ท็อป ให้ใช้แอป **Windows Hub** แบบ native สำหรับการตั้งค่า
    แบบ terminal-only รองรับทั้งเส้นทางตัวติดตั้ง PowerShell และ WSL2 Gateway
    เอกสาร: [Windows](/th/platforms/windows)

  </Accordion>

  <Accordion title="เอาต์พุต exec ของ Windows แสดงข้อความภาษาจีนเพี้ยน - ควรทำอย่างไร?">
    โดยปกติเป็นความไม่ตรงกันของ console code page บน shell Windows แบบ native

    อาการ:

    - เอาต์พุต `system.run`/`exec` แสดงภาษาจีนเป็น mojibake
    - คำสั่งเดียวกันดูปกติในโปรไฟล์ terminal อื่น

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

    หากคุณยัง reproduce ปัญหานี้บน OpenClaw เวอร์ชันล่าสุด ให้ติดตาม/รายงานที่:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="เอกสารไม่ได้ตอบคำถามของฉัน - ฉันจะได้คำตอบที่ดีขึ้นอย่างไร?">
    ใช้ **การติดตั้งแบบแก้ไขได้ (git)** เพื่อให้คุณมีซอร์สและเอกสารทั้งหมดในเครื่อง จากนั้นถาม
    bot ของคุณ (หรือ Claude/Codex) _จากโฟลเดอร์นั้น_ เพื่อให้มันอ่าน repo และตอบได้อย่างแม่นยำ

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    รายละเอียดเพิ่มเติม: [ติดตั้ง](/th/install) และ [แฟล็กตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน Linux ได้อย่างไร?">
    คำตอบสั้น ๆ: ทำตามคู่มือ Linux แล้วรัน onboarding

    - เส้นทางด่วน Linux + การติดตั้ง service: [Linux](/th/platforms/linux)
    - walkthrough เต็มรูปแบบ: [เริ่มต้นใช้งาน](/th/start/getting-started)
    - ตัวติดตั้ง + อัปเดต: [การติดตั้งและอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน VPS ได้อย่างไร?">
    Linux VPS ใดก็ได้ใช้งานได้ ติดตั้งบน server แล้วใช้ SSH/Tailscale เพื่อเข้าถึง Gateway

    คู่มือ: [exe.dev](/th/install/exe-dev), [Hetzner](/th/install/hetzner), [Fly.io](/th/install/fly)
    การเข้าถึงระยะไกล: [Gateway ระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title="คู่มือติดตั้งบน cloud/VPS อยู่ที่ไหน?">
    เรามี **ศูนย์รวม hosting** พร้อม provider ทั่วไป เลือกหนึ่งรายการแล้วทำตามคู่มือ:

    - [โฮสติ้ง VPS](/th/vps) (ผู้ให้บริการทั้งหมดในที่เดียว)
    - [Fly.io](/th/install/fly)
    - [Hetzner](/th/install/hetzner)
    - [exe.dev](/th/install/exe-dev)

    การทำงานบน cloud: **Gateway ทำงานบน server** และคุณเข้าถึงได้
    จาก laptop/phone ผ่าน Control UI (หรือ Tailscale/SSH) state + workspace ของคุณ
    อยู่บน server ดังนั้นให้ถือ host เป็นแหล่งข้อมูลหลักและสำรองข้อมูลไว้

    คุณสามารถจับคู่ **node** (Mac/iOS/Android/headless) กับ Gateway บน cloud นั้นเพื่อเข้าถึง
    หน้าจอ/camera/canvas ในเครื่อง หรือรันคำสั่งบน laptop ของคุณ ขณะที่ยังคงให้
    Gateway อยู่บน cloud

    Hub: [แพลตฟอร์ม](/th/platforms) การเข้าถึงระยะไกล: [Gateway ระยะไกล](/th/gateway/remote)
    Nodes: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันขอให้ OpenClaw อัปเดตตัวเองได้ไหม?">
    คำตอบสั้น ๆ: **ทำได้ แต่ไม่แนะนำ** flow การอัปเดตอาจ restart
    Gateway (ซึ่งจะตัด session ที่ใช้งานอยู่), อาจต้องใช้ git checkout ที่สะอาด และ
    อาจ prompt ขอการยืนยัน ปลอดภัยกว่า: รันอัปเดตจาก shell ในฐานะ operator

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

    เอกสาร: [อัปเดต](/th/cli/update), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="onboarding ทำอะไรจริง ๆ?">
    `openclaw onboard` คือเส้นทางการตั้งค่าที่แนะนำ ใน **โหมด local** จะพาคุณผ่าน:

    - **การตั้งค่าโมเดล/auth** (provider OAuth, API keys, Anthropic setup-token รวมถึงตัวเลือกโมเดล local เช่น LM Studio)
    - ตำแหน่ง **workspace** + ไฟล์ bootstrap
    - **การตั้งค่า Gateway** (bind/port/auth/tailscale)
    - **ช่องทาง** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage รวมถึง channel plugins ที่ bundled มา เช่น QQ Bot)
    - **การติดตั้ง daemon** (LaunchAgent บน macOS; systemd user unit บน Linux/WSL2)
    - การเลือก **health checks** และ **skills**

    นอกจากนี้ยังตั้งความคาดหวังเรื่องระยะเวลาก่อน prompt หลักเริ่ม และเตือนหาก
    โมเดลที่กำหนดค่าไว้ไม่รู้จักหรือขาด auth

  </Accordion>

  <Accordion title="ฉันต้องมี subscription Claude หรือ OpenAI เพื่อรันสิ่งนี้ไหม?">
    ไม่ คุณสามารถรัน OpenClaw ด้วย **API keys** (Anthropic/OpenAI/อื่น ๆ) หรือด้วย
    **โมเดลแบบ local-only** เพื่อให้ข้อมูลของคุณอยู่บนอุปกรณ์ของคุณ Subscription (Claude
    Pro/Max หรือ OpenAI Codex) เป็นวิธี optional สำหรับ authenticate provider เหล่านั้น

    สำหรับ Anthropic ใน OpenClaw การแบ่งตามปฏิบัติคือ:

    - **Anthropic API key**: การเรียกเก็บเงิน Anthropic API ปกติ
    - **Claude CLI / Claude subscription auth ใน OpenClaw**: ทีม Anthropic
      แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง และ OpenClaw ถือว่าการใช้งาน `claude -p`
      ได้รับอนุมัติสำหรับ integration นี้ เว้นแต่ Anthropic จะประกาศ policy ใหม่

    สำหรับ host Gateway ที่ใช้งานระยะยาว Anthropic API keys ยังเป็นการตั้งค่าที่
    คาดการณ์ได้มากกว่า OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือภายนอก
    เช่น OpenClaw

    OpenClaw ยังรองรับตัวเลือก hosted แบบ subscription-style อื่น ๆ รวมถึง
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** และ
    **Z.AI / GLM Coding Plan**

    เอกสาร: [Anthropic](/th/providers/anthropic), [OpenAI](/th/providers/openai),
    [Qwen Cloud](/th/providers/qwen),
    [MiniMax](/th/providers/minimax), [Z.AI (GLM)](/th/providers/zai),
    [โมเดล local](/th/gateway/local-models), [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันใช้ subscription Claude Max โดยไม่มี API key ได้ไหม?">
    ได้

    ทีม Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น
    OpenClaw จึงถือว่า Claude subscription auth และการใช้งาน `claude -p` ได้รับอนุมัติ
    สำหรับ integration นี้ เว้นแต่ Anthropic จะประกาศ policy ใหม่ หากคุณต้องการ
    การตั้งค่าฝั่ง server ที่คาดการณ์ได้มากที่สุด ให้ใช้ Anthropic API key แทน

  </Accordion>

  <Accordion title="คุณรองรับ Claude subscription auth (Claude Pro หรือ Max) ไหม?">
    รองรับ

    ทีม Anthropic แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
    การนำ Claude CLI กลับมาใช้ซ้ำและการใช้งาน `claude -p` ได้รับอนุมัติสำหรับ integration นี้
    เว้นแต่ Anthropic จะประกาศ policy ใหม่

    Anthropic setup-token ยังคงพร้อมใช้งานเป็นเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw แนะนำการนำ Claude CLI กลับมาใช้ซ้ำและ `claude -p` เมื่อพร้อมใช้งาน
    สำหรับ workload แบบ production หรือหลายผู้ใช้ auth ด้วย Anthropic API key ยังเป็น
    ตัวเลือกที่ปลอดภัยและคาดการณ์ได้มากกว่า หากคุณต้องการตัวเลือก hosted
    แบบ subscription-style อื่นใน OpenClaw โปรดดู [OpenAI](/th/providers/openai), [Qwen / Model
    Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax), และ [GLM
    Models](/th/providers/zai)

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

  <AccordionGroup>
  <Accordion title="ทำไมฉันจึงเห็น HTTP 429 rate_limit_error จาก Anthropic?">
    หมายความว่า **โควตา/ขีดจำกัดอัตราการใช้งานของ Anthropic** ของคุณหมดแล้วสำหรับช่วงเวลาปัจจุบัน หากคุณ
    ใช้ **Claude CLI** ให้รอจนกว่าช่วงเวลาจะรีเซ็ตหรืออัปเกรดแผนของคุณ หากคุณ
    ใช้ **คีย์ Anthropic API** ให้ตรวจสอบ Anthropic Console
    สำหรับการใช้งาน/การเรียกเก็บเงิน และเพิ่มขีดจำกัดตามจำเป็น

    หากข้อความระบุเฉพาะว่า:
    `Extra usage is required for long context requests` คำขอกำลังพยายามใช้
    หน้าต่างบริบท 1M ของ Anthropic (โมเดล Claude 4.x ที่รองรับ GA-capable 1M หรือ config เดิม
    `context1m: true`) ซึ่งใช้งานได้เฉพาะเมื่อข้อมูลประจำตัวของคุณมีสิทธิ์
    สำหรับการเรียกเก็บเงินแบบบริบทยาว (การเรียกเก็บเงินด้วยคีย์ API หรือเส้นทางเข้าสู่ระบบ OpenClaw Claude
    ที่เปิดใช้ Extra Usage)

    เคล็ดลับ: ตั้งค่า **โมเดลสำรอง** เพื่อให้ OpenClaw ตอบกลับต่อได้ขณะที่ผู้ให้บริการถูกจำกัดอัตราการใช้งาน
    ดู [โมเดล](/th/cli/models), [OAuth](/th/concepts/oauth), และ
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/th/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)

  </Accordion>

  <Accordion title="รองรับ AWS Bedrock หรือไม่?">
    รองรับ OpenClaw มีผู้ให้บริการ **Amazon Bedrock (Converse)** ที่รวมมาให้ เมื่อมีตัวบ่งชี้ env ของ AWS อยู่ OpenClaw สามารถค้นหาแค็ตตาล็อก Bedrock แบบสตรีมมิง/ข้อความโดยอัตโนมัติ และรวมเป็นผู้ให้บริการ `amazon-bedrock` โดยนัยได้ มิฉะนั้นคุณสามารถเปิดใช้ `plugins.entries.amazon-bedrock.config.discovery.enabled` อย่างชัดเจน หรือเพิ่มรายการผู้ให้บริการด้วยตนเอง ดู [Amazon Bedrock](/th/providers/bedrock) และ [ผู้ให้บริการโมเดล](/th/providers/models) หากคุณต้องการโฟลว์คีย์แบบมีการจัดการ พร็อกซีที่เข้ากันได้กับ OpenAI หน้า Bedrock ก็ยังเป็นตัวเลือกที่ใช้ได้
  </Accordion>

  <Accordion title="การยืนยันตัวตนของ Codex ทำงานอย่างไร?">
    OpenClaw รองรับ **OpenAI Code (Codex)** ผ่าน OAuth (การลงชื่อเข้าใช้ ChatGPT) ใช้
    `openai/gpt-5.5` สำหรับการตั้งค่าทั่วไป: การยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex พร้อม
    การรัน app-server ของ Codex แบบเนทีฟ ref GPT ของ Codex เดิมคือ
    config เดิมที่ซ่อมแซมโดย `openclaw doctor --fix` การเข้าถึงด้วยคีย์ OpenAI API โดยตรง
    ยังคงมีให้ใช้สำหรับพื้นผิว OpenAI API ที่ไม่ใช่เอเจนต์ และสำหรับโมเดล
    เอเจนต์ผ่านโปรไฟล์คีย์ API `openai` แบบมีลำดับ
    ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers) และ [การเริ่มใช้งาน (CLI)](/th/start/wizard)
  </Accordion>

  <Accordion title="ทำไม OpenClaw ยังกล่าวถึงคำนำหน้า OpenAI Codex เดิม?">
    `openai` คือรหัสผู้ให้บริการและโปรไฟล์การยืนยันตัวตนสำหรับทั้งคีย์ OpenAI API และ
    ChatGPT/Codex OAuth คุณอาจยังเห็นคำนำหน้า OpenAI Codex เดิมใน config เดิมและ
    คำเตือนการย้ายข้อมูล
    config รุ่นเก่ายังใช้สิ่งนี้เป็นคำนำหน้าโมเดลด้วย:

    - `openai/gpt-5.5` = การยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟสำหรับเทิร์นของเอเจนต์
    - ref GPT-5.5 ของ Codex เดิม = เส้นทางโมเดลเดิมที่ซ่อมแซมโดย `openclaw doctor --fix`
    - `openai/gpt-5.5` พร้อมโปรไฟล์คีย์ API `openai` แบบมีลำดับ = การยืนยันตัวตนด้วยคีย์ API สำหรับโมเดลเอเจนต์ OpenAI
    - รหัสโปรไฟล์การยืนยันตัวตน Codex เดิม = รหัสโปรไฟล์การยืนยันตัวตนเดิมที่ย้ายข้อมูลโดย `openclaw doctor --fix`

    หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform โดยตรง ให้ตั้งค่า
    `OPENAI_API_KEY` หากคุณต้องการการยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex ให้ลงชื่อเข้าใช้ด้วย
    `openclaw models auth login --provider openai` คง ref โมเดลเป็น
    `openai/gpt-5.5`; ref โมเดล Codex เดิมเป็น config เดิมที่
    `openclaw doctor --fix` เขียนใหม่

  </Accordion>

  <Accordion title="ทำไมขีดจำกัด Codex OAuth จึงแตกต่างจาก ChatGPT บนเว็บได้?">
    Codex OAuth ใช้หน้าต่างโควตาที่ OpenAI จัดการและขึ้นอยู่กับแผน ในทางปฏิบัติ
    ขีดจำกัดเหล่านั้นอาจแตกต่างจากประสบการณ์บนเว็บไซต์/แอป ChatGPT แม้ว่า
    ทั้งสองจะผูกกับบัญชีเดียวกันก็ตาม

    OpenClaw สามารถแสดงหน้าต่างการใช้งาน/โควตาของผู้ให้บริการที่มองเห็นได้ในปัจจุบันใน
    `openclaw models status` แต่จะไม่สร้างหรือปรับสิทธิ์ ChatGPT-web
    ให้เป็นการเข้าถึง API โดยตรง หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform
    โดยตรง ให้ใช้ `openai/*` พร้อมคีย์ API

  </Accordion>

  <Accordion title="รองรับการยืนยันตัวตนด้วยการสมัครสมาชิก OpenAI (Codex OAuth) หรือไม่?">
    รองรับ OpenClaw รองรับ **OpenAI Code (Codex) subscription OAuth** อย่างเต็มรูปแบบ
    OpenAI อนุญาตอย่างชัดเจนให้ใช้ subscription OAuth ในเครื่องมือ/เวิร์กโฟลว์ภายนอก
    อย่าง OpenClaw การเริ่มใช้งานสามารถรันโฟลว์ OAuth ให้คุณได้

    ดู [OAuth](/th/concepts/oauth), [ผู้ให้บริการโมเดล](/th/concepts/model-providers), และ [การเริ่มใช้งาน (CLI)](/th/start/wizard)

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

    สิ่งนี้จะจัดเก็บโทเค็น OAuth ในโปรไฟล์การยืนยันตัวตนบนโฮสต์ Gateway รายละเอียด: [ผู้ให้บริการโมเดล](/th/concepts/model-providers)

  </Accordion>

  <Accordion title="โมเดลในเครื่องเหมาะสำหรับแชตทั่วไปหรือไม่?">
    โดยทั่วไปไม่เหมาะ OpenClaw ต้องการบริบทขนาดใหญ่และความปลอดภัยที่แข็งแกร่ง; การ์ดขนาดเล็กจะตัดทอนและรั่วไหล หากจำเป็นต้องใช้ ให้รันบิลด์โมเดลที่ **ใหญ่ที่สุด** ที่คุณรันในเครื่องได้ (LM Studio) และดู [/gateway/local-models](/th/gateway/local-models) โมเดลที่เล็กกว่า/quantized เพิ่มความเสี่ยงจาก prompt-injection - ดู [ความปลอดภัย](/th/gateway/security)
  </Accordion>

  <Accordion title="ฉันจะเก็บทราฟฟิกโมเดลที่โฮสต์ไว้ในภูมิภาคเฉพาะได้อย่างไร?">
    เลือกเอนด์พอยต์ที่ตรึงภูมิภาค OpenRouter มีตัวเลือกที่โฮสต์ในสหรัฐฯ สำหรับ MiniMax, Kimi และ GLM; เลือกตัวแปรที่โฮสต์ในสหรัฐฯ เพื่อเก็บข้อมูลไว้ในภูมิภาค คุณยังสามารถแสดง Anthropic/OpenAI ควบคู่ไปด้วยได้โดยใช้ `models.mode: "merge"` เพื่อให้โมเดลสำรองยังพร้อมใช้งานขณะเคารพผู้ให้บริการแบบภูมิภาคที่คุณเลือก
  </Accordion>

  <Accordion title="ฉันต้องซื้อ Mac Mini เพื่อติดตั้งสิ่งนี้หรือไม่?">
    ไม่ต้อง OpenClaw รันบน macOS หรือ Linux (Windows ผ่าน WSL2) ได้ Mac mini เป็นทางเลือก - บางคน
    ซื้อไว้เป็นโฮสต์ที่เปิดตลอดเวลา แต่ VPS ขนาดเล็ก โฮมเซิร์ฟเวอร์ หรือเครื่องระดับ Raspberry Pi ก็ใช้ได้เช่นกัน

    คุณต้องมี Mac เฉพาะสำหรับ **เครื่องมือที่ใช้ได้บน macOS เท่านั้น** สำหรับ iMessage ให้ใช้ [iMessage](/th/channels/imessage) กับ `imsg` บน Mac ใดก็ได้ที่ลงชื่อเข้าใช้ Messages หาก Gateway รันบน Linux หรือที่อื่น ให้ตั้งค่า `channels.imessage.cliPath` เป็น SSH wrapper ที่รัน `imsg` บน Mac เครื่องนั้น หากคุณต้องการเครื่องมืออื่นที่ใช้ได้บน macOS เท่านั้น ให้รัน Gateway บน Mac หรือจับคู่กับ macOS node

    เอกสาร: [iMessage](/th/channels/imessage), [Node](/th/nodes), [โหมดรีโมต Mac](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันต้องมี Mac mini เพื่อรองรับ iMessage หรือไม่?">
    คุณต้องมี **อุปกรณ์ macOS สักเครื่อง** ที่ลงชื่อเข้าใช้ Messages ไม่จำเป็นต้องเป็น Mac mini -
    Mac เครื่องใดก็ได้ใช้ได้ **ใช้ [iMessage](/th/channels/imessage)** กับ `imsg`; Gateway สามารถรันบน Mac เครื่องนั้น หรือรันที่อื่นพร้อม SSH wrapper `cliPath` ได้

    การตั้งค่าทั่วไป:

    - รัน Gateway บน Linux/VPS และตั้งค่า `channels.imessage.cliPath` เป็น SSH wrapper ที่รัน `imsg` บน Mac ที่ลงชื่อเข้าใช้ Messages
    - รันทุกอย่างบน Mac หากคุณต้องการการตั้งค่าเครื่องเดียวที่ง่ายที่สุด

    เอกสาร: [iMessage](/th/channels/imessage), [Node](/th/nodes),
    [โหมดรีโมต Mac](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="หากฉันซื้อ Mac mini เพื่อรัน OpenClaw ฉันจะเชื่อมต่อกับ MacBook Pro ของฉันได้หรือไม่?">
    ได้ **Mac mini สามารถรัน Gateway** และ MacBook Pro ของคุณสามารถเชื่อมต่อเป็น
    **node** (อุปกรณ์คู่กัน) Node ไม่ได้รัน Gateway - แต่ให้ความสามารถเพิ่มเติม
    เช่น หน้าจอ/กล้อง/canvas และ `system.run` บนอุปกรณ์นั้น

    รูปแบบทั่วไป:

    - Gateway บน Mac mini (เปิดตลอดเวลา)
    - MacBook Pro รันแอป macOS หรือโฮสต์ node และจับคู่กับ Gateway
    - ใช้ `openclaw nodes status` / `openclaw nodes list` เพื่อดู

    เอกสาร: [Node](/th/nodes), [Node CLI](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันใช้ Bun ได้หรือไม่?">
    **ไม่แนะนำ** ให้ใช้ Bun เราพบบั๊กรันไทม์ โดยเฉพาะกับ WhatsApp และ Telegram
    ใช้ **Node** สำหรับ Gateway ที่เสถียร

    หากคุณยังต้องการทดลองกับ Bun ให้ทำบน Gateway ที่ไม่ใช่โปรดักชัน
    โดยไม่มี WhatsApp/Telegram

  </Accordion>

  <Accordion title="Telegram: ต้องใส่อะไรใน allowFrom?">
    `channels.telegram.allowFrom` คือ **ID ผู้ใช้ Telegram ของผู้ส่งที่เป็นมนุษย์** (ตัวเลข) ไม่ใช่ชื่อผู้ใช้ของบอต

    การตั้งค่าจะถามเฉพาะ ID ผู้ใช้แบบตัวเลขเท่านั้น หากคุณมีรายการ `@username` เดิมใน config อยู่แล้ว `openclaw doctor --fix` สามารถพยายามแก้ข้อมูลเหล่านั้นได้

    ปลอดภัยกว่า (ไม่มีบอตบุคคลที่สาม):

    - DM บอตของคุณ จากนั้นรัน `openclaw logs --follow` และอ่าน `from.id`

    Bot API อย่างเป็นทางการ:

    - DM บอตของคุณ จากนั้นเรียก `https://api.telegram.org/bot<bot_token>/getUpdates` และอ่าน `message.from.id`

    บุคคลที่สาม (เป็นส่วนตัวน้อยกว่า):

    - DM `@userinfobot` หรือ `@getidsbot`

    ดู [/channels/telegram](/th/channels/telegram#access-control-and-activation)

  </Accordion>

  <Accordion title="หลายคนสามารถใช้หมายเลข WhatsApp เดียวกับอินสแตนซ์ OpenClaw ต่างกันได้หรือไม่?">
    ได้ ผ่าน **การกำหนดเส้นทางแบบหลายเอเจนต์** ผูก **DM** ของ WhatsApp ของผู้ส่งแต่ละคน (peer `kind: "direct"`, ผู้ส่ง E.164 เช่น `+15551234567`) กับ `agentId` ที่แตกต่างกัน เพื่อให้แต่ละคนมีพื้นที่ทำงานและที่เก็บเซสชันของตัวเอง การตอบกลับยังมาจาก **บัญชี WhatsApp เดียวกัน** และการควบคุมการเข้าถึง DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) เป็นแบบส่วนกลางต่อบัญชี WhatsApp ดู [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent) และ [WhatsApp](/th/channels/whatsapp)
  </Accordion>

  <Accordion title='ฉันรันเอเจนต์ "แชตเร็ว" และเอเจนต์ "Opus สำหรับเขียนโค้ด" ได้หรือไม่?'>
    ได้ ใช้การกำหนดเส้นทางแบบหลายเอเจนต์: ให้แต่ละเอเจนต์มีโมเดลเริ่มต้นของตัวเอง จากนั้นผูกเส้นทางขาเข้า (บัญชีผู้ให้บริการหรือ peer เฉพาะ) กับเอเจนต์แต่ละตัว config ตัวอย่างอยู่ใน [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent) ดูเพิ่มเติม [โมเดล](/th/concepts/models) และ [การกำหนดค่า](/th/gateway/configuration)
  </Accordion>

  <Accordion title="Homebrew ใช้งานบน Linux ได้หรือไม่?">
    ได้ Homebrew รองรับ Linux (Linuxbrew) การตั้งค่าอย่างรวดเร็ว:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    หากคุณรัน OpenClaw ผ่าน systemd ให้ตรวจสอบว่า PATH ของ service มี `/home/linuxbrew/.linuxbrew/bin` (หรือ prefix ของ brew ของคุณ) เพื่อให้เครื่องมือที่ติดตั้งด้วย `brew` ถูก resolve ได้ในเชลล์ที่ไม่ใช่ login shell
    บิลด์ล่าสุดยังเพิ่มไดเรกทอรี bin ผู้ใช้ที่พบบ่อยบนบริการ Linux systemd ไว้ด้านหน้า (เช่น `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) และเคารพ `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, และ `FNM_DIR` เมื่อตั้งค่าไว้

  </Accordion>

  <Accordion title="ความแตกต่างระหว่างการติดตั้ง git แบบแก้ไขได้กับการติดตั้ง npm">
    - **การติดตั้งแบบแก้ไขได้ (git):** checkout ซอร์สทั้งหมด แก้ไขได้ เหมาะที่สุดสำหรับผู้มีส่วนร่วม
      คุณรันบิลด์ในเครื่องและ patch โค้ด/เอกสารได้
    - **การติดตั้ง npm:** ติดตั้ง CLI แบบ global ไม่มี repo เหมาะที่สุดสำหรับ "แค่รันใช้งาน"
      การอัปเดตมาจาก npm dist-tags

    เอกสาร: [เริ่มต้นใช้งาน](/th/start/getting-started), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันสามารถสลับระหว่างการติดตั้ง npm และ git ภายหลังได้หรือไม่?">
    ได้ ใช้ `openclaw update --channel ...` เมื่อ OpenClaw ติดตั้งอยู่แล้ว
    สิ่งนี้ **จะไม่ลบข้อมูลของคุณ** - เพียงเปลี่ยนการติดตั้งโค้ดของ OpenClaw เท่านั้น
    state (`~/.openclaw`) และ workspace (`~/.openclaw/workspace`) ของคุณจะยังไม่ถูกแตะต้อง

    จาก npm ไป git:

    ```bash
    openclaw update --channel dev
    ```

    จาก git ไป npm:

    ```bash
    openclaw update --channel stable
    ```

    เพิ่ม `--dry-run` เพื่อดูตัวอย่างการสลับโหมดที่วางแผนไว้ก่อน ตัวอัปเดตจะเรียกใช้
    งานติดตามผลของ Doctor, รีเฟรชแหล่งที่มาของ plugin สำหรับแชนเนลเป้าหมาย และ
    รีสตาร์ท Gateway เว้นแต่คุณจะส่ง `--no-restart`

    ตัวติดตั้งสามารถบังคับใช้โหมดใดโหมดหนึ่งได้เช่นกัน:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    เคล็ดลับการสำรองข้อมูล: ดู [กลยุทธ์การสำรองข้อมูล](/th/help/faq#where-things-live-on-disk)

  </Accordion>

  <Accordion title="ฉันควรรัน Gateway บนแล็ปท็อปหรือ VPS?">
    คำตอบสั้น ๆ: **ถ้าคุณต้องการความน่าเชื่อถือแบบ 24/7 ให้ใช้ VPS** ถ้าคุณต้องการ
    ความยุ่งยากน้อยที่สุดและยอมรับการพักเครื่อง/รีสตาร์ทได้ ให้รันในเครื่อง

    **แล็ปท็อป (Gateway ในเครื่อง)**

    - **ข้อดี:** ไม่มีค่าเซิร์ฟเวอร์, เข้าถึงไฟล์ในเครื่องได้โดยตรง, หน้าต่างเบราว์เซอร์แบบสด
    - **ข้อเสีย:** การพักเครื่อง/เครือข่ายหลุด = การเชื่อมต่อขาด, การอัปเดต/รีบูต OS ทำให้หยุดชะงัก, ต้องเปิดเครื่องไว้เสมอ

    **VPS / cloud**

    - **ข้อดี:** เปิดตลอดเวลา, เครือข่ายเสถียร, ไม่มีปัญหาแล็ปท็อปพักเครื่อง, ดูแลให้รันต่อเนื่องได้ง่ายกว่า
    - **ข้อเสีย:** มักรันแบบไม่มีหน้าจอ (ใช้ภาพหน้าจอ), เข้าถึงไฟล์ระยะไกลเท่านั้น, คุณต้องใช้ SSH สำหรับการอัปเดต

    **หมายเหตุเฉพาะ OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord ใช้งานจาก VPS ได้ดีทั้งหมด ข้อแลกเปลี่ยนจริงเพียงอย่างเดียวคือ **เบราว์เซอร์แบบไม่มีหน้าจอ** เทียบกับหน้าต่างที่มองเห็นได้ ดู [เบราว์เซอร์](/th/tools/browser)

    **ค่าเริ่มต้นที่แนะนำ:** ใช้ VPS ถ้าคุณเคยเจอ Gateway หลุดการเชื่อมต่อมาก่อน การรันในเครื่องเหมาะมากเมื่อคุณกำลังใช้ Mac อยู่และต้องการเข้าถึงไฟล์ในเครื่องหรือทำ UI automation ด้วยเบราว์เซอร์ที่มองเห็นได้

  </Accordion>

  <Accordion title="การรัน OpenClaw บนเครื่องเฉพาะสำคัญแค่ไหน?">
    ไม่จำเป็น แต่ **แนะนำเพื่อความน่าเชื่อถือและการแยกสภาพแวดล้อม**

    - **โฮสต์เฉพาะ (VPS/Mac mini/Raspberry Pi):** เปิดตลอดเวลา, การหยุดชะงักจากการพักเครื่อง/รีบูตน้อยกว่า, สิทธิ์สะอาดกว่า, ดูแลให้รันต่อเนื่องได้ง่ายกว่า
    - **แล็ปท็อป/เดสก์ท็อปที่ใช้ร่วมกัน:** ใช้ทดสอบและใช้งานจริงได้ไม่มีปัญหา แต่ควรคาดว่าจะมีการหยุดพักเมื่อเครื่องพักหรืออัปเดต

    ถ้าคุณต้องการข้อดีของทั้งสองแบบ ให้เก็บ Gateway ไว้บนโฮสต์เฉพาะและจับคู่แล็ปท็อปของคุณเป็น **Node** สำหรับเครื่องมือหน้าจอ/กล้อง/exec ในเครื่อง ดู [Node](/th/nodes)
    สำหรับคำแนะนำด้านความปลอดภัย อ่าน [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อกำหนด VPS ขั้นต่ำและ OS ที่แนะนำคืออะไร?">
    OpenClaw ใช้ทรัพยากรน้อย สำหรับ Gateway พื้นฐาน + แชนเนลแชตหนึ่งรายการ:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB, ดิสก์ประมาณ 500MB
    - **แนะนำ:** 1-2 vCPU, RAM 2GB ขึ้นไปเพื่อเผื่อทรัพยากร (ล็อก, สื่อ, หลายแชนเนล) เครื่องมือ Node และ browser automation อาจใช้ทรัพยากรมาก

    OS: ใช้ **Ubuntu LTS** (หรือ Debian/Ubuntu รุ่นใหม่ใดก็ได้) เส้นทางการติดตั้งบน Linux ได้รับการทดสอบดีที่สุดที่นั่น

    เอกสาร: [Linux](/th/platforms/linux), [โฮสติ้ง VPS](/th/vps)

  </Accordion>

  <Accordion title="ฉันรัน OpenClaw ใน VM ได้ไหม และมีข้อกำหนดอะไรบ้าง?">
    ได้ ให้ถือว่า VM เหมือน VPS: ต้องเปิดตลอดเวลา, เข้าถึงได้, และมี
    RAM เพียงพอสำหรับ Gateway และแชนเนลใด ๆ ที่คุณเปิดใช้

    แนวทางพื้นฐาน:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB
    - **แนะนำ:** RAM 2GB ขึ้นไป ถ้าคุณรันหลายแชนเนล, browser automation, หรือเครื่องมือสื่อ
    - **OS:** Ubuntu LTS หรือ Debian/Ubuntu รุ่นใหม่อื่น

    ถ้าคุณใช้ Windows ให้ใช้ **Windows Hub** สำหรับการตั้งค่าเดสก์ท็อป หรือใช้ WSL2 เมื่อ
    คุณต้องการ VM ของ Gateway สไตล์ Linux โดยเฉพาะ พร้อมความเข้ากันได้กับเครื่องมือ
    ที่กว้างขึ้น ดู [Windows](/th/platforms/windows), [โฮสติ้ง VPS](/th/vps)
    ถ้าคุณกำลังรัน macOS ใน VM ดู [macOS VM](/th/install/macos-vm)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก (โมเดล, เซสชัน, gateway, ความปลอดภัย และอื่น ๆ)
- [ภาพรวมการติดตั้ง](/th/install)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [การแก้ไขปัญหา](/th/help/troubleshooting)
