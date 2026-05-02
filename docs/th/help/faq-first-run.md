---
read_when:
    - การติดตั้งใหม่ การเริ่มใช้งานค้าง หรือข้อผิดพลาดในการเรียกใช้ครั้งแรก
    - การเลือกการยืนยันตัวตนและการสมัครใช้งานผู้ให้บริการ
    - เข้าถึง docs.openclaw.ai ไม่ได้ เปิดแดชบอร์ดไม่ได้ การติดตั้งค้าง
sidebarTitle: First-run FAQ
summary: 'คำถามที่พบบ่อย: การเริ่มต้นใช้งานอย่างรวดเร็วและการตั้งค่าเมื่อรันครั้งแรก — การติดตั้ง, การเริ่มต้นใช้งาน, การตรวจสอบสิทธิ์, การสมัครใช้งาน, ความล้มเหลวเบื้องต้น'
title: 'คำถามที่พบบ่อย: การตั้งค่าครั้งแรก'
x-i18n:
    generated_at: "2026-05-02T10:18:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 469fbd24fea69d91c5b0408dff9c7d7b2382f9c59430a1d5331cb5dcabdce295
    source_path: help/faq-first-run.md
    workflow: 16
---

  คำถามและคำตอบสำหรับเริ่มต้นอย่างรวดเร็วและการใช้งานครั้งแรก สำหรับการใช้งานประจำวัน โมเดล การยืนยันตัวตน เซสชัน และการแก้ไขปัญหา โปรดดู [FAQ](/th/help/faq) หลัก

  ## การเริ่มต้นอย่างรวดเร็วและการตั้งค่าการใช้งานครั้งแรก

  <AccordionGroup>
  <Accordion title="I am stuck, fastest way to get unstuck">
    ใช้ AI agent ภายในเครื่องที่สามารถ **เห็นเครื่องของคุณ** ได้ วิธีนี้มีประสิทธิภาพกว่าการถามใน Discord มาก เพราะกรณี "ฉันติดปัญหา" ส่วนใหญ่เป็น **ปัญหาการตั้งค่าหรือสภาพแวดล้อมในเครื่อง** ที่ผู้ช่วยระยะไกลตรวจสอบไม่ได้

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    เครื่องมือเหล่านี้อ่าน repo, รันคำสั่ง, ตรวจสอบล็อก และช่วยแก้การตั้งค่าระดับเครื่องของคุณได้ (PATH, services, permissions, auth files) ให้เครื่องมือเหล่านี้เข้าถึง **ซอร์สโค้ดที่ checkout ไว้ทั้งหมด** ผ่านการติดตั้งแบบ hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    การทำแบบนี้จะติดตั้ง OpenClaw **จาก git checkout** เพื่อให้ agent อ่านโค้ด + เอกสาร และวิเคราะห์เวอร์ชันจริงที่คุณกำลังรันอยู่ได้ คุณสามารถสลับกลับไปใช้ stable ภายหลังได้เสมอโดยรันตัวติดตั้งอีกครั้งโดยไม่ใส่ `--install-method git`

    เคล็ดลับ: ขอให้ agent **วางแผนและกำกับดูแล** การแก้ไข (ทีละขั้นตอน) แล้วค่อยดำเนินการเฉพาะคำสั่งที่จำเป็น วิธีนี้ช่วยให้การเปลี่ยนแปลงเล็กลงและตรวจสอบได้ง่ายขึ้น

    หากคุณพบข้อบกพร่องจริงหรือวิธีแก้ไข โปรดเปิด issue บน GitHub หรือส่ง PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    เริ่มด้วยคำสั่งเหล่านี้ (แชร์ผลลัพธ์เมื่อขอความช่วยเหลือ):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    สิ่งที่คำสั่งเหล่านี้ทำ:

    - `openclaw status`: ภาพรวมสั้น ๆ ของสถานะ Gateway/agent + การตั้งค่าพื้นฐาน
    - `openclaw models status`: ตรวจสอบการยืนยันตัวตนของผู้ให้บริการ + ความพร้อมใช้งานของโมเดล
    - `openclaw doctor`: ตรวจสอบความถูกต้องและซ่อมแซมปัญหาการตั้งค่า/สถานะที่พบบ่อย

    การตรวจสอบด้วย CLI อื่น ๆ ที่มีประโยชน์: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`

    วงจรดีบักอย่างรวดเร็ว: [60 วินาทีแรกเมื่อมีบางอย่างเสีย](#first-60-seconds-if-something-is-broken).
    เอกสารการติดตั้ง: [ติดตั้ง](/th/install), [แฟล็กตัวติดตั้ง](/th/install/installer), [การอัปเดต](/th/install/updating).

  </Accordion>

  <Accordion title="Heartbeat keeps skipping. What do the skip reasons mean?">
    เหตุผลทั่วไปที่ Heartbeat ถูกข้าม:

    - `quiet-hours`: อยู่นอกช่วง active-hours ที่กำหนดค่าไว้
    - `empty-heartbeat-file`: มี `HEARTBEAT.md` อยู่ แต่มีเพียงโครง blank/header-only
    - `no-tasks-due`: โหมดงานของ `HEARTBEAT.md` ทำงานอยู่ แต่ยังไม่มีช่วงเวลาของงานใดถึงกำหนด
    - `alerts-disabled`: ปิดการมองเห็น Heartbeat ทั้งหมดไว้ (`showOk`, `showAlerts`, และ `useIndicator` ปิดอยู่ทั้งหมด)

    ในโหมดงาน timestamp ที่ถึงกำหนดจะถูกเลื่อนไปข้างหน้าเฉพาะหลังจาก Heartbeat จริงรันเสร็จเท่านั้น การรันที่ถูกข้ามจะไม่ทำเครื่องหมายว่างานเสร็จแล้ว

    เอกสาร: [Heartbeat](/th/gateway/heartbeat), [ระบบอัตโนมัติและงาน](/th/automation).

  </Accordion>

  <Accordion title="Recommended way to install and set up OpenClaw">
    repo แนะนำให้รันจากซอร์สและใช้ onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    wizard ยังสามารถสร้าง UI assets โดยอัตโนมัติได้ด้วย หลัง onboarding โดยทั่วไปคุณจะรัน Gateway บนพอร์ต **18789**

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

  <Accordion title="How do I open the dashboard after onboarding?">
    wizard จะเปิดเบราว์เซอร์ของคุณด้วย URL dashboard แบบสะอาด (ไม่มี token) ทันทีหลัง onboarding และพิมพ์ลิงก์ไว้ในสรุปด้วย เปิดแท็บนั้นค้างไว้ หากไม่ได้เปิดขึ้นมา ให้คัดลอก/วาง URL ที่พิมพ์ออกมาบนเครื่องเดียวกัน
  </Accordion>

  <Accordion title="How do I authenticate the dashboard on localhost vs remote?">
    **Localhost (เครื่องเดียวกัน):**

    - เปิด `http://127.0.0.1:18789/`
    - หากระบบขอ shared-secret auth ให้วาง token หรือ password ที่กำหนดค่าไว้ใน Control UI settings
    - แหล่งที่มาของ token: `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
    - แหล่งที่มาของ password: `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
    - หากยังไม่ได้กำหนดค่า shared secret ให้สร้าง token ด้วย `openclaw doctor --generate-gateway-token`

    **ไม่ได้อยู่บน localhost:**

    - **Tailscale Serve** (แนะนำ): ให้ bind เป็น loopback ต่อไป รัน `openclaw gateway --tailscale serve` แล้วเปิด `https://<magicdns>/` หาก `gateway.auth.allowTailscale` เป็น `true` identity headers จะผ่านการยืนยันตัวตนของ Control UI/WebSocket (ไม่ต้องวาง shared secret โดยถือว่า gateway host เชื่อถือได้); HTTP APIs ยังต้องใช้ shared-secret auth เว้นแต่คุณตั้งใจใช้ private-ingress `none` หรือ trusted-proxy HTTP auth
      ความพยายาม Serve auth ที่ผิดพลาดพร้อมกันจาก client เดียวกันจะถูกจัดลำดับก่อนที่ตัวจำกัด failed-auth จะบันทึกไว้ ดังนั้นการลองผิดครั้งที่สองอาจแสดง `retry later` ได้แล้ว
    - **Tailnet bind**: รัน `openclaw gateway --bind tailnet --token "<token>"` (หรือกำหนดค่า password auth), เปิด `http://<tailscale-ip>:18789/` แล้ววาง shared secret ที่ตรงกันในการตั้งค่า dashboard
    - **Reverse proxy ที่รู้จักตัวตน**: วาง Gateway ไว้หลัง trusted proxy, กำหนดค่า `gateway.auth.mode: "trusted-proxy"` แล้วเปิด URL ของ proxy proxy แบบ loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/` shared-secret auth ยังมีผลผ่าน tunnel; หากมี prompt ให้ใส่ token หรือ password ที่กำหนดค่าไว้

    ดู [Dashboard](/th/web/dashboard) และ [พื้นผิวเว็บ](/th/web) สำหรับ bind modes และรายละเอียด auth

  </Accordion>

  <Accordion title="Why are there two exec approval configs for chat approvals?">
    ทั้งสองอย่างควบคุมคนละชั้น:

    - `approvals.exec`: ส่งต่อ approval prompts ไปยังปลายทางแชต
    - `channels.<channel>.execApprovals`: ทำให้ channel นั้นทำหน้าที่เป็น native approval client สำหรับ exec approvals

    host exec policy ยังคงเป็น approval gate ตัวจริง การตั้งค่าแชตควบคุมเฉพาะตำแหน่งที่ approval prompts ปรากฏและวิธีที่ผู้คนตอบกลับได้

    ในการตั้งค่าส่วนใหญ่ คุณ **ไม่** จำเป็นต้องใช้ทั้งสองอย่าง:

    - หากแชตรองรับคำสั่งและการตอบกลับอยู่แล้ว `/approve` ในแชตเดียวกันจะทำงานผ่านเส้นทางร่วม
    - หาก native channel ที่รองรับสามารถอนุมาน approvers ได้อย่างปลอดภัย ตอนนี้ OpenClaw จะเปิดใช้งาน DM-first native approvals อัตโนมัติเมื่อ `channels.<channel>.execApprovals.enabled` ไม่ได้ตั้งค่าไว้หรือเป็น `"auto"`
    - เมื่อมี native approval cards/buttons ให้ใช้ UI แบบ native นั้นเป็นเส้นทางหลัก agent ควรรวมคำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือบอกว่า chat approvals ไม่พร้อมใช้งาน หรือ manual approval เป็นเส้นทางเดียวเท่านั้น
    - ใช้ `approvals.exec` เฉพาะเมื่อ prompts ต้องถูกส่งต่อไปยังแชตอื่นหรือห้อง ops ที่ระบุอย่างชัดเจนด้วย
    - ใช้ `channels.<channel>.execApprovals.target: "channel"` หรือ `"both"` เฉพาะเมื่อคุณต้องการให้ approval prompts ถูกโพสต์กลับไปยังห้อง/topic ต้นทางอย่างชัดเจน
    - Plugin approvals แยกต่างหากอีกชั้น: โดยค่าเริ่มต้นจะใช้ `/approve` ในแชตเดียวกัน, มีการส่งต่อ `approvals.plugin` แบบ optional, และมีเพียงบาง native channels ที่ยังคงซ้อนการจัดการ plugin-approval-native ไว้ด้านบน

    สรุปสั้น ๆ: forwarding ใช้สำหรับ routing ส่วน native client config ใช้สำหรับ UX เฉพาะ channel ที่สมบูรณ์ขึ้น
    ดู [Exec Approvals](/th/tools/exec-approvals).

  </Accordion>

  <Accordion title="What runtime do I need?">
    ต้องใช้ Node **>= 22** แนะนำให้ใช้ `pnpm` Bun **ไม่แนะนำ** สำหรับ Gateway
  </Accordion>

  <Accordion title="Does it run on Raspberry Pi?">
    ได้ Gateway มีน้ำหนักเบา - เอกสารระบุว่า **512MB-1GB RAM**, **1 core**, และพื้นที่ดิสก์ประมาณ **500MB**
    ก็เพียงพอสำหรับการใช้งานส่วนตัว และระบุว่า **Raspberry Pi 4 สามารถรันได้**

    หากคุณต้องการพื้นที่เผื่อเพิ่ม (logs, media, services อื่น ๆ) แนะนำให้ใช้ **2GB** แต่ไม่ใช่ขั้นต่ำบังคับ

    เคล็ดลับ: Pi/VPS ขนาดเล็กสามารถโฮสต์ Gateway ได้ และคุณสามารถจับคู่ **nodes** บนแล็ปท็อป/โทรศัพท์ของคุณสำหรับหน้าจอ/camera/canvas ภายในเครื่อง หรือการรันคำสั่งได้ ดู [Nodes](/th/nodes).

  </Accordion>

  <Accordion title="Any tips for Raspberry Pi installs?">
    สรุปสั้น ๆ: ใช้งานได้ แต่คาดว่าจะมีจุดที่ยังไม่เรียบอยู่บ้าง

    - ใช้ OS แบบ **64-bit** และคง Node >= 22 ไว้
    - แนะนำให้ใช้ **การติดตั้งแบบ hackable (git)** เพื่อให้คุณดู logs และอัปเดตได้เร็ว
    - เริ่มโดยไม่ใช้ channels/skills แล้วค่อยเพิ่มทีละรายการ
    - หากเจอปัญหา binary แปลก ๆ โดยปกติมักเป็นปัญหา **ARM compatibility**

    เอกสาร: [Linux](/th/platforms/linux), [ติดตั้ง](/th/install).

  </Accordion>

  <Accordion title="It is stuck on wake up my friend / onboarding will not hatch. What now?">
    หน้าจอนั้นขึ้นอยู่กับ Gateway ที่ต้องเข้าถึงได้และยืนยันตัวตนแล้ว TUI ยังส่ง
    "Wake up, my friend!" โดยอัตโนมัติใน hatch ครั้งแรกด้วย หากคุณเห็นบรรทัดนั้นพร้อม **ไม่มีการตอบกลับ**
    และ tokens อยู่ที่ 0 แปลว่า agent ไม่เคยรัน

    1. รีสตาร์ต Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. ตรวจสอบสถานะ + auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. หากยังค้างอยู่ ให้รัน:

    ```bash
    openclaw doctor
    ```

    หาก Gateway อยู่ระยะไกล ให้ตรวจสอบว่า tunnel/Tailscale connection ทำงานอยู่ และ UI ชี้ไปยัง Gateway ที่ถูกต้อง ดู [Remote access](/th/gateway/remote).

  </Accordion>

  <Accordion title="Can I migrate my setup to a new machine (Mac mini) without redoing onboarding?">
    ได้ คัดลอก **state directory** และ **workspace** แล้วรัน Doctor หนึ่งครั้ง วิธีนี้จะทำให้บอทของคุณ "เหมือนเดิมทุกประการ" (memory, session history, auth, และ channel state) ตราบใดที่คุณคัดลอก **ทั้งสอง** ตำแหน่ง:

    1. ติดตั้ง OpenClaw บนเครื่องใหม่
    2. คัดลอก `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`) จากเครื่องเก่า
    3. คัดลอก workspace ของคุณ (ค่าเริ่มต้น: `~/.openclaw/workspace`)
    4. รัน `openclaw doctor` และรีสตาร์ต Gateway service

    วิธีนี้จะเก็บ config, auth profiles, WhatsApp creds, sessions, และ memory ไว้ หากคุณอยู่ใน remote mode โปรดจำไว้ว่า gateway host เป็นเจ้าของ session store และ workspace

    **สำคัญ:** หากคุณเพียง commit/push workspace ของคุณไปยัง GitHub เท่ากับคุณสำรอง
    **memory + bootstrap files** แต่ **ไม่ได้** สำรอง session history หรือ auth สิ่งเหล่านั้นอยู่
    ใต้ `~/.openclaw/` (เช่น `~/.openclaw/agents/<agentId>/sessions/`)

    ที่เกี่ยวข้อง: [การย้าย](/th/install/migrating), [ตำแหน่งที่สิ่งต่าง ๆ อยู่บนดิสก์](#where-things-live-on-disk),
    [Agent workspace](/th/concepts/agent-workspace), [Doctor](/th/gateway/doctor),
    [Remote mode](/th/gateway/remote).

  </Accordion>

  <Accordion title="Where do I see what is new in the latest version?">
    ดู changelog บน GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    รายการล่าสุดอยู่ด้านบน หาก section ด้านบนสุดถูกทำเครื่องหมายเป็น **Unreleased** section ถัดไปที่มีวันที่คือเวอร์ชันล่าสุดที่เผยแพร่แล้ว รายการถูกจัดกลุ่มตาม **Highlights**, **Changes**, และ
    **Fixes** (รวมถึงส่วน docs/other เมื่อจำเป็น)

  </Accordion>

  <Accordion title="Cannot access docs.openclaw.ai (SSL error)">
    การเชื่อมต่อ Comcast/Xfinity บางรายการบล็อก `docs.openclaw.ai` อย่างไม่ถูกต้องผ่าน Xfinity
    Advanced Security ให้ปิดใช้งานหรือ allowlist `docs.openclaw.ai` แล้วลองอีกครั้ง
    โปรดช่วยเราแก้การบล็อกนี้โดยรายงานที่นี่: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    หากคุณยังเข้าเว็บไซต์ไม่ได้ เอกสารถูก mirror ไว้บน GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="ความแตกต่างระหว่าง stable และ beta">
    **Stable** และ **beta** คือ **npm dist-tags** ไม่ใช่สายโค้ดที่แยกกัน:

    - `latest` = stable
    - `beta` = บิลด์รุ่นแรกสำหรับการทดสอบ

    โดยปกติแล้ว รีลีส stable จะเข้าสู่ **beta** ก่อน จากนั้นขั้นตอนโปรโมตโดยชัดเจน
    จะย้ายเวอร์ชันเดียวกันนั้นไปที่ `latest` ผู้ดูแลยังสามารถ
    เผยแพร่ตรงไปที่ `latest` ได้เมื่อจำเป็น นี่คือเหตุผลที่ beta และ stable อาจ
    ชี้ไปที่ **เวอร์ชันเดียวกัน** หลังจากโปรโมตแล้ว

    ดูสิ่งที่เปลี่ยนแปลง:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    สำหรับคำสั่งติดตั้งแบบบรรทัดเดียวและความแตกต่างระหว่าง beta กับ dev โปรดดู accordion ด้านล่าง

  </Accordion>

  <Accordion title="ฉันจะติดตั้งเวอร์ชัน beta ได้อย่างไร และ beta ต่างจาก dev อย่างไร?">
    **Beta** คือ npm dist-tag `beta` (อาจตรงกับ `latest` หลังจากโปรโมตแล้ว)
    **Dev** คือหัวล่าสุดที่เลื่อนไปเรื่อย ๆ ของ `main` (git); เมื่อเผยแพร่ จะใช้ npm dist-tag `dev`

    คำสั่งบรรทัดเดียว (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    ตัวติดตั้ง Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    รายละเอียดเพิ่มเติม: [ช่องทางการพัฒนา](/th/install/development-channels) และ [แฟล็กตัวติดตั้ง](/th/install/installer).

  </Accordion>

  <Accordion title="ฉันจะลองบิตล่าสุดได้อย่างไร?">
    มีสองตัวเลือก:

    1. **ช่องทาง Dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    คำสั่งนี้จะสลับไปยังสาขา `main` และอัปเดตจากซอร์ส

    2. **การติดตั้งที่แก้ไขได้ (จากไซต์ตัวติดตั้ง):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    วิธีนี้ให้ repo ภายในเครื่องที่คุณแก้ไขได้ จากนั้นอัปเดตผ่าน git

    หากคุณต้องการ clone เองแบบสะอาด ให้ใช้:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [ช่องทางการพัฒนา](/th/install/development-channels),
    [ติดตั้ง](/th/install).

  </Accordion>

  <Accordion title="โดยปกติการติดตั้งและ onboarding ใช้เวลานานแค่ไหน?">
    แนวทางโดยประมาณ:

    - **ติดตั้ง:** 2-5 นาที
    - **Onboarding:** 5-15 นาที ขึ้นอยู่กับจำนวน channel/model ที่คุณกำหนดค่า

    หากค้าง ให้ใช้ [ตัวติดตั้งค้าง](#quick-start-and-first-run-setup)
    และลูปดีบักแบบเร็วใน [ฉันติดอยู่](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="ตัวติดตั้งค้าง? ฉันจะรับ feedback เพิ่มเติมได้อย่างไร?">
    เรียกใช้ตัวติดตั้งอีกครั้งพร้อม **เอาต์พุตแบบ verbose**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    ติดตั้ง beta พร้อม verbose:

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

    ตัวเลือกเพิ่มเติม: [แฟล็กตัวติดตั้ง](/th/install/installer).

  </Accordion>

  <Accordion title="การติดตั้งบน Windows แจ้งว่าไม่พบ git หรือไม่รู้จัก openclaw">
    ปัญหาที่พบบ่อยสองอย่างบน Windows:

    **1) ข้อผิดพลาด npm spawn git / ไม่พบ git**

    - ติดตั้ง **Git for Windows** และตรวจสอบให้แน่ใจว่า `git` อยู่ใน PATH ของคุณ
    - ปิดและเปิด PowerShell ใหม่ จากนั้นเรียกใช้ตัวติดตั้งอีกครั้ง

    **2) ไม่รู้จัก openclaw หลังติดตั้ง**

    - โฟลเดอร์ npm global bin ของคุณไม่ได้อยู่ใน PATH
    - ตรวจสอบเส้นทาง:

      ```powershell
      npm config get prefix
      ```

    - เพิ่มไดเรกทอรีนั้นไปยัง PATH ของผู้ใช้ของคุณ (บน Windows ไม่ต้องมี suffix `\bin`; ในระบบส่วนใหญ่จะเป็น `%AppData%\npm`)
    - ปิดและเปิด PowerShell ใหม่หลังจากอัปเดต PATH

    หากคุณต้องการการตั้งค่า Windows ที่ลื่นไหลที่สุด ให้ใช้ **WSL2** แทน Windows แบบ native
    เอกสาร: [Windows](/th/platforms/windows).

  </Accordion>

  <Accordion title="เอาต์พุต exec บน Windows แสดงข้อความภาษาจีนเพี้ยน - ฉันควรทำอย่างไร?">
    โดยปกติแล้วนี่เป็นปัญหา console code page ไม่ตรงกันใน shell แบบ native ของ Windows

    อาการ:

    - เอาต์พุต `system.run`/`exec` แสดงภาษาจีนเป็น mojibake
    - คำสั่งเดียวกันดูปกติใน terminal profile อื่น

    วิธีแก้ชั่วคราวแบบเร็วใน PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    จากนั้น restart Gateway และลองคำสั่งอีกครั้ง:

    ```powershell
    openclaw gateway restart
    ```

    หากคุณยังจำลองปัญหานี้ได้บน OpenClaw เวอร์ชันล่าสุด ให้ติดตาม/รายงานได้ที่:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="เอกสารไม่ได้ตอบคำถามของฉัน - ฉันจะได้คำตอบที่ดีกว่านี้ได้อย่างไร?">
    ใช้ **การติดตั้งแบบแก้ไขได้ (git)** เพื่อให้คุณมีซอร์สและเอกสารทั้งหมดภายในเครื่อง จากนั้นถาม
    bot ของคุณ (หรือ Claude/Codex) _จากโฟลเดอร์นั้น_ เพื่อให้มันอ่าน repo และตอบได้อย่างแม่นยำ

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    รายละเอียดเพิ่มเติม: [ติดตั้ง](/th/install) และ [แฟล็กตัวติดตั้ง](/th/install/installer).

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน Linux ได้อย่างไร?">
    คำตอบสั้น ๆ: ทำตามคู่มือ Linux จากนั้นเรียกใช้ onboarding

    - เส้นทางด่วนสำหรับ Linux + การติดตั้ง service: [Linux](/th/platforms/linux).
    - คู่มือแบบเต็ม: [เริ่มต้นใช้งาน](/th/start/getting-started).
    - ตัวติดตั้ง + การอัปเดต: [ติดตั้งและอัปเดต](/th/install/updating).

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน VPS ได้อย่างไร?">
    VPS Linux ใด ๆ ก็ใช้ได้ ติดตั้งบน server จากนั้นใช้ SSH/Tailscale เพื่อเข้าถึง Gateway

    คู่มือ: [exe.dev](/th/install/exe-dev), [Hetzner](/th/install/hetzner), [Fly.io](/th/install/fly).
    การเข้าถึงระยะไกล: [Gateway ระยะไกล](/th/gateway/remote).

  </Accordion>

  <Accordion title="คู่มือติดตั้งบน cloud/VPS อยู่ที่ไหน?">
    เรามี **hub สำหรับโฮสติ้ง** ที่รวม provider ทั่วไป เลือกหนึ่งรายการแล้วทำตามคู่มือ:

    - [โฮสติ้ง VPS](/th/vps) (provider ทั้งหมดในที่เดียว)
    - [Fly.io](/th/install/fly)
    - [Hetzner](/th/install/hetzner)
    - [exe.dev](/th/install/exe-dev)

    การทำงานใน cloud เป็นแบบนี้: **Gateway ทำงานบน server** และคุณเข้าถึงได้
    จาก laptop/phone ผ่าน Control UI (หรือ Tailscale/SSH) state + workspace ของคุณ
    อยู่บน server ดังนั้นให้ถือว่า host เป็นแหล่งข้อมูลจริงและสำรองข้อมูลไว้

    คุณสามารถจับคู่ **Node** (Mac/iOS/Android/headless) กับ Gateway บน cloud นั้นเพื่อเข้าถึง
    screen/camera/canvas ภายในเครื่อง หรือเรียกใช้คำสั่งบน laptop ของคุณในขณะที่ยังเก็บ
    Gateway ไว้บน cloud

    Hub: [แพลตฟอร์ม](/th/platforms). การเข้าถึงระยะไกล: [Gateway ระยะไกล](/th/gateway/remote).
    Nodes: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes).

  </Accordion>

  <Accordion title="ฉันขอให้ OpenClaw อัปเดตตัวเองได้ไหม?">
    คำตอบสั้น ๆ: **ทำได้ แต่ไม่แนะนำ** flow การอัปเดตอาจ restart
    Gateway (ซึ่งจะทำให้ session ที่ใช้งานอยู่หลุด), อาจต้องใช้ git checkout ที่สะอาด และ
    อาจแสดง prompt ให้ยืนยัน วิธีที่ปลอดภัยกว่า: เรียกใช้การอัปเดตจาก shell ในฐานะ operator

    ใช้ CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    หากคุณจำเป็นต้องทำให้เป็นอัตโนมัติจาก agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [การอัปเดต](/th/install/updating).

  </Accordion>

  <Accordion title="onboarding ทำอะไรจริง ๆ?">
    `openclaw onboard` คือเส้นทางการตั้งค่าที่แนะนำ ใน **โหมด local** คำสั่งนี้จะแนะนำคุณผ่าน:

    - **การตั้งค่า model/auth** (provider OAuth, API keys, Anthropic setup-token รวมถึงตัวเลือก model ภายในเครื่อง เช่น LM Studio)
    - ตำแหน่ง **Workspace** + ไฟล์ bootstrap
    - **การตั้งค่า Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage รวมถึง channel plugins ที่ bundling มา เช่น QQ Bot)
    - **การติดตั้ง daemon** (LaunchAgent บน macOS; systemd user unit บน Linux/WSL2)
    - **Health checks** และการเลือก **skills**

    นอกจากนี้ยังเตือนหาก model ที่คุณกำหนดค่าไว้ไม่รู้จักหรือไม่มี auth

  </Accordion>

  <Accordion title="ฉันต้องมี subscription ของ Claude หรือ OpenAI เพื่อใช้งานสิ่งนี้ไหม?">
    ไม่ต้อง คุณสามารถเรียกใช้ OpenClaw ด้วย **API keys** (Anthropic/OpenAI/อื่น ๆ) หรือด้วย
    **model แบบ local-only** เพื่อให้ข้อมูลของคุณอยู่บนอุปกรณ์ของคุณ Subscription (Claude
    Pro/Max หรือ OpenAI Codex) เป็นเพียงวิธีเสริมในการยืนยันตัวตนกับ provider เหล่านั้น

    สำหรับ Anthropic ใน OpenClaw การแบ่งที่ใช้งานจริงคือ:

    - **Anthropic API key**: การคิดค่าบริการ Anthropic API ตามปกติ
    - **Claude CLI / auth ของ subscription Claude ใน OpenClaw**: เจ้าหน้าที่ Anthropic
      แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง และ OpenClaw จะถือว่าการใช้งาน `claude -p`
      ได้รับการอนุมัติสำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่

    สำหรับ host Gateway ที่ใช้งานระยะยาว Anthropic API keys ยังเป็นการตั้งค่าที่
    คาดเดาได้มากกว่า OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับ
    เครื่องมือภายนอกอย่าง OpenClaw

    OpenClaw ยังรองรับตัวเลือก hosted แบบ subscription-style อื่น ๆ รวมถึง
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** และ
    **Z.AI / GLM Coding Plan**

    เอกสาร: [Anthropic](/th/providers/anthropic), [OpenAI](/th/providers/openai),
    [Qwen Cloud](/th/providers/qwen),
    [MiniMax](/th/providers/minimax), [GLM Models](/th/providers/glm),
    [model ภายในเครื่อง](/th/gateway/local-models), [Models](/th/concepts/models).

  </Accordion>

  <Accordion title="ฉันใช้ subscription Claude Max โดยไม่มี API key ได้ไหม?">
    ได้

    เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น
    OpenClaw จึงถือว่า auth ของ subscription Claude และการใช้งาน `claude -p` ได้รับการอนุมัติ
    สำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ หากคุณต้องการ
    การตั้งค่าฝั่ง server ที่คาดเดาได้มากที่สุด ให้ใช้ Anthropic API key แทน

  </Accordion>

  <Accordion title="คุณรองรับ auth ของ subscription Claude (Claude Pro หรือ Max) หรือไม่?">
    รองรับ

    เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
    การ reuse Claude CLI และการใช้งาน `claude -p` ได้รับการอนุมัติสำหรับ integration นี้
    เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่

    Anthropic setup-token ยังพร้อมใช้งานในฐานะเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw เลือกใช้การ reuse Claude CLI และ `claude -p` ก่อนเมื่อพร้อมใช้งาน
    สำหรับ workload แบบ production หรือ multi-user การ auth ด้วย Anthropic API key ยังเป็นตัวเลือกที่
    ปลอดภัยกว่าและคาดเดาได้มากกว่า หากคุณต้องการตัวเลือก hosted แบบ subscription-style อื่น ๆ
    ใน OpenClaw โปรดดู [OpenAI](/th/providers/openai), [Qwen / Model
    Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax), และ [GLM
    Models](/th/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="ทำไมฉันจึงเห็น HTTP 429 rate_limit_error จาก Anthropic?">
    หมายความว่า **quota/rate limit ของ Anthropic** ของคุณหมดแล้วสำหรับช่วงเวลาปัจจุบัน หากคุณ
    ใช้ **Claude CLI** ให้รอให้ช่วงเวลานั้น reset หรือ upgrade plan ของคุณ หากคุณ
    ใช้ **Anthropic API key** ให้ตรวจสอบ Anthropic Console
    สำหรับการใช้งาน/การเรียกเก็บเงิน และเพิ่ม limit ตามต้องการ

    หากข้อความระบุโดยเฉพาะว่า:
    `Extra usage is required for long context requests`, request นั้นกำลังพยายามใช้
    1M context beta ของ Anthropic (`context1m: true`) ซึ่งใช้งานได้เฉพาะเมื่อ
    credential ของคุณมีสิทธิ์สำหรับการคิดค่าบริการ long-context (การคิดค่าบริการผ่าน API key หรือ
    เส้นทาง OpenClaw Claude-login ที่เปิดใช้ Extra Usage)

    เคล็ดลับ: ตั้งค่า **โมเดลสำรอง** เพื่อให้ OpenClaw ตอบกลับต่อได้ในขณะที่ผู้ให้บริการถูกจำกัดอัตราการใช้งาน
    ดู [โมเดล](/th/cli/models), [OAuth](/th/concepts/oauth), และ
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/th/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)

  </Accordion>

  <Accordion title="รองรับ AWS Bedrock หรือไม่">
    รองรับ OpenClaw มีผู้ให้บริการ **Amazon Bedrock (Converse)** ที่มาพร้อมในตัว เมื่อมีตัวบ่งชี้ env ของ AWS อยู่ OpenClaw จะค้นพบแค็ตตาล็อก Bedrock แบบสตรีมมิง/ข้อความโดยอัตโนมัติ และผสานเข้าเป็นผู้ให้บริการ `amazon-bedrock` โดยนัยได้ มิฉะนั้นคุณสามารถเปิดใช้ `plugins.entries.amazon-bedrock.config.discovery.enabled` อย่างชัดเจน หรือเพิ่มรายการผู้ให้บริการด้วยตนเอง ดู [Amazon Bedrock](/th/providers/bedrock) และ [ผู้ให้บริการโมเดล](/th/providers/models) หากคุณต้องการโฟลว์คีย์แบบมีการจัดการ พร็อกซีที่เข้ากันได้กับ OpenAI หน้า Bedrock ก็ยังเป็นตัวเลือกที่ใช้ได้
  </Accordion>

  <Accordion title="การยืนยันตัวตนของ Codex ทำงานอย่างไร">
    OpenClaw รองรับ **OpenAI Code (Codex)** ผ่าน OAuth (การลงชื่อเข้าใช้ ChatGPT) ใช้
    `openai/gpt-5.5` พร้อม `agentRuntime.id: "codex"` สำหรับการตั้งค่าทั่วไป:
    การยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex พร้อมการดำเนินการบนเซิร์ฟเวอร์แอป Codex แบบเนทีฟ ใช้
    `openai-codex/gpt-5.5` เฉพาะเมื่อคุณต้องการ Codex OAuth ผ่านตัวรัน
    PI เริ่มต้น ใช้ `openai/gpt-5.5` โดยไม่มีการ override runtime ของ Codex สำหรับ
    การเข้าถึงด้วยคีย์ API ของ OpenAI โดยตรง
    ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers) และ [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
  </Accordion>

  <Accordion title="ทำไม OpenClaw ยังกล่าวถึง openai-codex">
    `openai-codex` คือ id ของผู้ให้บริการและโปรไฟล์การยืนยันตัวตนสำหรับ ChatGPT/Codex OAuth
    และยังเป็นคำนำหน้าโมเดล PI แบบชัดเจนสำหรับ Codex OAuth ด้วย:

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = การยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex พร้อม runtime Codex แบบเนทีฟ
    - `openai-codex/gpt-5.5` = เส้นทาง Codex OAuth ใน PI
    - `openai/gpt-5.5` โดยไม่มีการ override runtime ของ Codex = เส้นทางคีย์ API ของ OpenAI โดยตรงใน PI
    - `openai-codex:...` = id โปรไฟล์การยืนยันตัวตน ไม่ใช่การอ้างอิงโมเดล

    หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform โดยตรง ให้ตั้งค่า
    `OPENAI_API_KEY` หากคุณต้องการการยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex ให้ลงชื่อเข้าใช้ด้วย
    `openclaw models auth login --provider openai-codex` สำหรับ runtime Codex
    แบบเนทีฟ ให้คงการอ้างอิงโมเดลเป็น `openai/gpt-5.5` และตั้งค่า
    `agentRuntime.id: "codex"` ใช้การอ้างอิงโมเดล `openai-codex/*` เฉพาะสำหรับการรัน PI
    เท่านั้น

  </Accordion>

  <Accordion title="ทำไมขีดจำกัดของ Codex OAuth จึงต่างจาก ChatGPT บนเว็บได้">
    Codex OAuth ใช้กรอบโควตาที่ OpenAI จัดการและขึ้นกับแผน ในทางปฏิบัติ
    ขีดจำกัดเหล่านั้นอาจต่างจากประสบการณ์บนเว็บไซต์/แอป ChatGPT แม้ว่า
    ทั้งสองจะผูกกับบัญชีเดียวกันก็ตาม

    OpenClaw สามารถแสดงกรอบการใช้งาน/โควตาของผู้ให้บริการที่มองเห็นได้ในปัจจุบันใน
    `openclaw models status` แต่จะไม่สร้างหรือปรับสิทธิ์ของ ChatGPT บนเว็บให้เป็น
    การเข้าถึง API โดยตรง หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform
    โดยตรง ให้ใช้ `openai/*` พร้อมคีย์ API

  </Accordion>

  <Accordion title="รองรับการยืนยันตัวตนด้วยการสมัครสมาชิก OpenAI (Codex OAuth) หรือไม่">
    รองรับ OpenClaw รองรับ **OAuth การสมัครสมาชิก OpenAI Code (Codex)** อย่างเต็มรูปแบบ
    OpenAI อนุญาตการใช้งาน OAuth การสมัครสมาชิกในเครื่องมือ/เวิร์กโฟลว์ภายนอก
    เช่น OpenClaw อย่างชัดเจน การเริ่มต้นใช้งานสามารถรันโฟลว์ OAuth ให้คุณได้

    ดู [OAuth](/th/concepts/oauth), [ผู้ให้บริการโมเดล](/th/concepts/model-providers), และ [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)

  </Accordion>

  <Accordion title="ฉันจะตั้งค่า Gemini CLI OAuth ได้อย่างไร">
    Gemini CLI ใช้ **โฟลว์การยืนยันตัวตนของ plugin** ไม่ใช่ client id หรือ secret ใน `openclaw.json`

    ขั้นตอน:

    1. ติดตั้ง Gemini CLI ในเครื่องเพื่อให้ `gemini` อยู่ใน `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. เปิดใช้ plugin: `openclaw plugins enable google`
    3. เข้าสู่ระบบ: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. โมเดลเริ่มต้นหลังเข้าสู่ระบบ: `google-gemini-cli/gemini-3-flash-preview`
    5. หากคำขอล้มเหลว ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway

    สิ่งนี้จะจัดเก็บโทเค็น OAuth ในโปรไฟล์การยืนยันตัวตนบนโฮสต์ Gateway รายละเอียด: [ผู้ให้บริการโมเดล](/th/concepts/model-providers)

  </Accordion>

  <Accordion title="โมเดลในเครื่องเหมาะสำหรับแชตทั่วไปหรือไม่">
    โดยปกติไม่เหมาะ OpenClaw ต้องใช้บริบทขนาดใหญ่ + ความปลอดภัยที่แข็งแรง การ์ดขนาดเล็กจะตัดทอนและรั่วไหล หากจำเป็น ให้รันบิลด์โมเดลที่ **ใหญ่ที่สุด** ที่คุณรันในเครื่องได้ (LM Studio) และดู [/gateway/local-models](/th/gateway/local-models) โมเดลที่เล็กลง/quantized เพิ่มความเสี่ยง prompt-injection - ดู [ความปลอดภัย](/th/gateway/security)
  </Accordion>

  <Accordion title="ฉันจะจำกัดทราฟฟิกโมเดลที่โฮสต์ให้อยู่ในภูมิภาคเฉพาะได้อย่างไร">
    เลือก endpoint ที่ตรึงภูมิภาค OpenRouter มีตัวเลือกที่โฮสต์ในสหรัฐฯ สำหรับ MiniMax, Kimi, และ GLM ให้เลือกเวอร์ชันที่โฮสต์ในสหรัฐฯ เพื่อให้ข้อมูลอยู่ในภูมิภาค คุณยังสามารถแสดงรายการ Anthropic/OpenAI ควบคู่กับสิ่งเหล่านี้ได้โดยใช้ `models.mode: "merge"` เพื่อให้ fallback ยังพร้อมใช้งานขณะเคารพผู้ให้บริการตามภูมิภาคที่คุณเลือก
  </Accordion>

  <Accordion title="ฉันต้องซื้อ Mac Mini เพื่อติดตั้งสิ่งนี้หรือไม่">
    ไม่ต้อง OpenClaw รันบน macOS หรือ Linux (Windows ผ่าน WSL2) ได้ Mac mini เป็นตัวเลือกเสริม - บางคน
    ซื้อมาใช้เป็นโฮสต์ที่เปิดตลอดเวลา แต่ VPS ขนาดเล็ก เซิร์ฟเวอร์ที่บ้าน หรือกล่องระดับ Raspberry Pi ก็ใช้ได้เช่นกัน

    คุณต้องใช้ Mac เฉพาะ **เครื่องมือที่ใช้ได้บน macOS เท่านั้น** สำหรับ iMessage ให้ใช้ [BlueBubbles](/th/channels/bluebubbles) (แนะนำ) - เซิร์ฟเวอร์ BlueBubbles รันบน Mac ใดก็ได้ และ Gateway สามารถรันบน Linux หรือที่อื่นได้ หากคุณต้องการเครื่องมืออื่นที่ใช้ได้บน macOS เท่านั้น ให้รัน Gateway บน Mac หรือจับคู่โหนด macOS

    เอกสาร: [BlueBubbles](/th/channels/bluebubbles), [โหนด](/th/nodes), [โหมดรีโมตของ Mac](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันต้องใช้ Mac mini เพื่อรองรับ iMessage หรือไม่">
    คุณต้องมี **อุปกรณ์ macOS สักเครื่อง** ที่ลงชื่อเข้าใช้ Messages อยู่ ไม่จำเป็นต้องเป็น Mac mini -
    Mac เครื่องใดก็ได้ใช้ได้ **ใช้ [BlueBubbles](/th/channels/bluebubbles)** (แนะนำ) สำหรับ iMessage - เซิร์ฟเวอร์ BlueBubbles รันบน macOS ส่วน Gateway สามารถรันบน Linux หรือที่อื่นได้

    การตั้งค่าทั่วไป:

    - รัน Gateway บน Linux/VPS และรันเซิร์ฟเวอร์ BlueBubbles บน Mac ใดก็ได้ที่ลงชื่อเข้าใช้ Messages
    - รันทุกอย่างบน Mac หากคุณต้องการการตั้งค่าเครื่องเดียวที่ง่ายที่สุด

    เอกสาร: [BlueBubbles](/th/channels/bluebubbles), [โหนด](/th/nodes),
    [โหมดรีโมตของ Mac](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ถ้าฉันซื้อ Mac mini เพื่อรัน OpenClaw ฉันเชื่อมต่อกับ MacBook Pro ของฉันได้หรือไม่">
    ได้ **Mac mini สามารถรัน Gateway** และ MacBook Pro ของคุณสามารถเชื่อมต่อเป็น
    **โหนด** (อุปกรณ์คู่ขนาน) โหนดไม่ได้รัน Gateway - โหนดให้ความสามารถเพิ่มเติม
    เช่น หน้าจอ/กล้อง/canvas และ `system.run` บนอุปกรณ์นั้น

    รูปแบบทั่วไป:

    - Gateway บน Mac mini (เปิดตลอดเวลา)
    - MacBook Pro รันแอป macOS หรือโฮสต์โหนด แล้วจับคู่กับ Gateway
    - ใช้ `openclaw nodes status` / `openclaw nodes list` เพื่อดูสถานะ

    เอกสาร: [โหนด](/th/nodes), [CLI ของโหนด](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันใช้ Bun ได้หรือไม่">
    **ไม่แนะนำ** Bun เราพบข้อบกพร่อง runtime โดยเฉพาะกับ WhatsApp และ Telegram
    ใช้ **Node** สำหรับ Gateway ที่เสถียร

    หากคุณยังต้องการทดลองกับ Bun ให้ทำบน Gateway ที่ไม่ใช่ production
    โดยไม่มี WhatsApp/Telegram

  </Accordion>

  <Accordion title="Telegram: ต้องใส่อะไรใน allowFrom">
    `channels.telegram.allowFrom` คือ **Telegram user ID ของผู้ส่งที่เป็นมนุษย์** (ตัวเลข) ไม่ใช่ชื่อผู้ใช้ของบอต

    การตั้งค่าจะขอเฉพาะ user ID แบบตัวเลขเท่านั้น หากคุณมีรายการ `@username` แบบเก่าใน config อยู่แล้ว `openclaw doctor --fix` สามารถพยายาม resolve ให้ได้

    ปลอดภัยกว่า (ไม่ใช้บอตบุคคลที่สาม):

    - DM บอตของคุณ จากนั้นรัน `openclaw logs --follow` และอ่าน `from.id`

    Bot API อย่างเป็นทางการ:

    - DM บอตของคุณ จากนั้นเรียก `https://api.telegram.org/bot<bot_token>/getUpdates` และอ่าน `message.from.id`

    บุคคลที่สาม (เป็นส่วนตัวน้อยกว่า):

    - DM `@userinfobot` หรือ `@getidsbot`

    ดู [/channels/telegram](/th/channels/telegram#access-control-and-activation)

  </Accordion>

  <Accordion title="หลายคนสามารถใช้หมายเลข WhatsApp เดียวกับอินสแตนซ์ OpenClaw ต่างกันได้หรือไม่">
    ได้ ผ่าน **การกำหนดเส้นทางแบบหลายเอเจนต์** ผูก **DM** ของ WhatsApp ของผู้ส่งแต่ละคน (peer `kind: "direct"`, ผู้ส่ง E.164 เช่น `+15551234567`) กับ `agentId` ที่ต่างกัน เพื่อให้แต่ละคนมี workspace และ session store ของตนเอง การตอบกลับยังคงมาจาก **บัญชี WhatsApp เดียวกัน** และการควบคุมการเข้าถึง DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) เป็นแบบส่วนกลางต่อบัญชี WhatsApp ดู [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent) และ [WhatsApp](/th/channels/whatsapp)
  </Accordion>

  <Accordion title='ฉันรันเอเจนต์ "แชตเร็ว" และเอเจนต์ "Opus สำหรับเขียนโค้ด" ได้หรือไม่'>
    ได้ ใช้การกำหนดเส้นทางแบบหลายเอเจนต์: กำหนดโมเดลเริ่มต้นของแต่ละเอเจนต์เอง จากนั้นผูกเส้นทางขาเข้า (บัญชีผู้ให้บริการหรือ peer เฉพาะ) กับแต่ละเอเจนต์ ตัวอย่าง config อยู่ใน [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent) ดูเพิ่มเติม [โมเดล](/th/concepts/models) และ [การกำหนดค่า](/th/gateway/configuration)
  </Accordion>

  <Accordion title="Homebrew ใช้บน Linux ได้หรือไม่">
    ได้ Homebrew รองรับ Linux (Linuxbrew) การตั้งค่าอย่างรวดเร็ว:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    หากคุณรัน OpenClaw ผ่าน systemd ตรวจสอบให้แน่ใจว่า PATH ของบริการมี `/home/linuxbrew/.linuxbrew/bin` (หรือ prefix ของ brew ของคุณ) เพื่อให้เครื่องมือที่ติดตั้งด้วย `brew` resolve ได้ใน shell ที่ไม่ใช่ login
    บิลด์ล่าสุดยังเติม common user bin dirs ไว้ด้านหน้าบนบริการ Linux systemd (เช่น `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) และเคารพ `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, และ `FNM_DIR` เมื่อมีการตั้งค่าไว้

  </Accordion>

  <Accordion title="ความแตกต่างระหว่างการติดตั้งแบบ git ที่แก้ไขได้กับการติดตั้งผ่าน npm">
    - **การติดตั้งแบบแก้ไขได้ (git):** checkout ซอร์สเต็มรูปแบบ แก้ไขได้ เหมาะที่สุดสำหรับผู้ร่วมพัฒนา
      คุณรันบิลด์ในเครื่องและสามารถ patch โค้ด/เอกสารได้
    - **การติดตั้งผ่าน npm:** ติดตั้ง CLI แบบ global ไม่มี repo เหมาะที่สุดสำหรับ “แค่รันใช้งาน”
      อัปเดตมาจาก dist-tags ของ npm

    เอกสาร: [เริ่มต้นใช้งาน](/th/start/getting-started), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันสลับระหว่างการติดตั้งผ่าน npm และ git ภายหลังได้หรือไม่">
    ได้ ใช้ `openclaw update --channel ...` เมื่อ OpenClaw ติดตั้งอยู่แล้ว
    สิ่งนี้ **ไม่ลบข้อมูลของคุณ** - จะเปลี่ยนเฉพาะการติดตั้งโค้ด OpenClaw เท่านั้น
    state (`~/.openclaw`) และ workspace (`~/.openclaw/workspace`) ของคุณยังคงไม่ถูกแตะต้อง

    จาก npm เป็น git:

    ```bash
    openclaw update --channel dev
    ```

    จาก git เป็น npm:

    ```bash
    openclaw update --channel stable
    ```

    เพิ่ม `--dry-run` เพื่อดูตัวอย่างการสลับโหมดที่วางแผนไว้ก่อน ตัวอัปเดตจะรัน
    งานติดตามผลของ Doctor รีเฟรชแหล่งที่มาของ plugin สำหรับ channel เป้าหมาย และ
    รีสตาร์ท Gateway เว้นแต่คุณจะส่ง `--no-restart`

    ตัวติดตั้งสามารถบังคับโหมดใดโหมดหนึ่งได้เช่นกัน:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    เคล็ดลับการสำรองข้อมูล: ดู [กลยุทธ์การสำรองข้อมูล](#where-things-live-on-disk)

  </Accordion>

  <Accordion title="ฉันควรรัน Gateway บนแล็ปท็อปหรือ VPS">
    คำตอบสั้น: **ถ้าคุณต้องการความน่าเชื่อถือ 24/7 ให้ใช้ VPS** หากคุณต้องการ
    ความฝืดต่ำที่สุดและคุณยอมรับการ sleep/restart ได้ ให้รันในเครื่อง

    **แล็ปท็อป (Gateway ในเครื่อง)**

    - **ข้อดี:** ไม่มีค่าเซิร์ฟเวอร์ เข้าถึงไฟล์ในเครื่องได้โดยตรง หน้าต่างเบราว์เซอร์สด
    - **ข้อเสีย:** sleep/เครือข่ายหลุด = การเชื่อมต่อถูกตัด, การอัปเดต/รีบูต OS รบกวน, ต้องเปิดเครื่องไว้ตลอด

    **VPS / คลาวด์**

    - **ข้อดี:** เปิดทำงานได้ตลอดเวลา เครือข่ายเสถียร ไม่มีปัญหาแล็ปท็อปเข้าสู่โหมดพัก และดูแลให้ทำงานต่อเนื่องได้ง่ายกว่า
    - **ข้อเสีย:** มักทำงานแบบไม่มีหน้าจอ (ใช้ภาพหน้าจอแทน) เข้าถึงไฟล์ได้เฉพาะระยะไกล และคุณต้องใช้ SSH สำหรับการอัปเดต

    **หมายเหตุเฉพาะสำหรับ OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord ทำงานจาก VPS ได้ดีทั้งหมด สิ่งที่ต้องแลกจริง ๆ มีเพียง **เบราว์เซอร์แบบไม่มีหน้าจอ** เทียบกับหน้าต่างที่มองเห็นได้ ดู [เบราว์เซอร์](/th/tools/browser)

    **ค่าเริ่มต้นที่แนะนำ:** ใช้ VPS หากคุณเคยเจอ Gateway หลุดการเชื่อมต่อมาก่อน การใช้งานแบบ local เหมาะมากเมื่อคุณกำลังใช้ Mac อยู่และต้องการเข้าถึงไฟล์ในเครื่องหรือทำ UI อัตโนมัติด้วยเบราว์เซอร์ที่มองเห็นได้

  </Accordion>

  <Accordion title="การรัน OpenClaw บนเครื่องเฉพาะมีความสำคัญแค่ไหน?">
    ไม่จำเป็น แต่ **แนะนำเพื่อความน่าเชื่อถือและการแยกสภาพแวดล้อม**

    - **โฮสต์เฉพาะ (VPS/Mac mini/Pi):** เปิดทำงานได้ตลอดเวลา มีการขัดจังหวะจากโหมดพัก/รีบูตน้อยกว่า สิทธิ์การใช้งานสะอาดกว่า และดูแลให้ทำงานต่อเนื่องได้ง่ายกว่า
    - **แล็ปท็อป/เดสก์ท็อปที่ใช้ร่วมกัน:** ใช้ทดสอบและใช้งานขณะกำลังใช้งานจริงได้ไม่มีปัญหา แต่ควรคาดว่าจะมีการหยุดชั่วคราวเมื่อเครื่องเข้าสู่โหมดพักหรืออัปเดต

    หากคุณต้องการข้อดีของทั้งสองแบบ ให้เก็บ Gateway ไว้บนโฮสต์เฉพาะและจับคู่แล็ปท็อปของคุณเป็น **node** สำหรับเครื่องมือหน้าจอ/กล้อง/exec ในเครื่อง ดู [Nodes](/th/nodes)
    สำหรับคำแนะนำด้านความปลอดภัย อ่าน [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อกำหนด VPS ขั้นต่ำและ OS ที่แนะนำคืออะไร?">
    OpenClaw มีน้ำหนักเบา สำหรับ Gateway พื้นฐาน + ช่องแชทหนึ่งช่อง:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB, ดิสก์ประมาณ 500MB
    - **แนะนำ:** 1-2 vCPU, RAM 2GB ขึ้นไปเพื่อมีพื้นที่เผื่อ (บันทึก สื่อ หลายช่อง) เครื่องมือ Node และเบราว์เซอร์อัตโนมัติอาจใช้ทรัพยากรมาก

    OS: ใช้ **Ubuntu LTS** (หรือ Debian/Ubuntu รุ่นใหม่ใดก็ได้) เส้นทางการติดตั้งบน Linux ได้รับการทดสอบดีที่สุดบนระบบนั้น

    เอกสาร: [Linux](/th/platforms/linux), [การโฮสต์ VPS](/th/vps)

  </Accordion>

  <Accordion title="ฉันสามารถรัน OpenClaw ใน VM ได้ไหม และต้องมีข้อกำหนดอะไรบ้าง?">
    ได้ ปฏิบัติกับ VM เหมือน VPS: ต้องเปิดทำงานตลอดเวลา เข้าถึงได้ และมี RAM เพียงพอ
    สำหรับ Gateway และช่องใด ๆ ที่คุณเปิดใช้งาน

    แนวทางพื้นฐาน:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB
    - **แนะนำ:** RAM 2GB ขึ้นไป หากคุณรันหลายช่อง เบราว์เซอร์อัตโนมัติ หรือเครื่องมือสื่อ
    - **OS:** Ubuntu LTS หรือ Debian/Ubuntu รุ่นใหม่อื่น ๆ

    หากคุณใช้ Windows, **WSL2 เป็นรูปแบบการตั้งค่าแบบ VM ที่ง่ายที่สุด** และมีความเข้ากันได้กับเครื่องมือดีที่สุด ดู [Windows](/th/platforms/windows), [การโฮสต์ VPS](/th/vps)
    หากคุณกำลังรัน macOS ใน VM ดู [macOS VM](/th/install/macos-vm)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [คำถามที่พบบ่อย](/th/help/faq) — คำถามที่พบบ่อยหลัก (โมเดล เซสชัน gateway ความปลอดภัย และอื่น ๆ)
- [ภาพรวมการติดตั้ง](/th/install)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [การแก้ไขปัญหา](/th/help/troubleshooting)
