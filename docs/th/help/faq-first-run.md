---
read_when:
    - ติดตั้งใหม่ การเริ่มต้นใช้งานค้าง หรือข้อผิดพลาดในการเรียกใช้ครั้งแรก
    - การเลือกการยืนยันตัวตนและการสมัครสมาชิกผู้ให้บริการ
    - ไม่สามารถเข้าถึง docs.openclaw.ai เปิดแดชบอร์ดไม่ได้ การติดตั้งค้าง
sidebarTitle: First-run FAQ
summary: 'คำถามที่พบบ่อย: การตั้งค่าเริ่มต้นอย่างรวดเร็วและการเรียกใช้ครั้งแรก — การติดตั้ง การเริ่มใช้งาน การยืนยันตัวตน การสมัครสมาชิก และข้อผิดพลาดเริ่มต้น'
title: 'คำถามที่พบบ่อย: การตั้งค่าครั้งแรก'
x-i18n:
    generated_at: "2026-07-16T19:18:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 787d003d18e01ddc28cee74224f9a82cf80f48b8de7c56ba9f9f7a3d187a026a
    source_path: help/faq-first-run.md
    workflow: 16
---

คำถามและคำตอบสำหรับการเริ่มต้นอย่างรวดเร็วและการเรียกใช้ครั้งแรก สำหรับการใช้งานทั่วไป โมเดล การยืนยันตัวตน เซสชัน
และการแก้ไขปัญหา โปรดดู [คำถามที่พบบ่อย](/th/help/faq) หลัก

## การเริ่มต้นอย่างรวดเร็วและการตั้งค่าสำหรับการเรียกใช้ครั้งแรก

<AccordionGroup>
  <Accordion title="ติดขัดอยู่ วิธีที่เร็วที่สุดในการแก้ปัญหา">
    ใช้เอเจนต์ AI ภายในเครื่องที่สามารถ **มองเห็นเครื่องของคุณ** ได้ กรณี "ติดขัด"
    ส่วนใหญ่เป็น **ปัญหาการกำหนดค่าหรือสภาพแวดล้อมภายในเครื่อง** ซึ่งผู้ช่วยระยะไกลตรวจสอบไม่ได้ ดังนั้นวิธีนี้จึงดีกว่า
    การถามใน Discord

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    ให้เอเจนต์เข้าถึงซอร์สทั้งหมดผ่านการติดตั้งแบบแก้ไขได้ (git) เพื่อให้เอเจนต์อ่าน
    โค้ดและเอกสาร รวมถึงวิเคราะห์ OpenClaw เวอร์ชันที่คุณใช้งานได้อย่างแม่นยำ:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    ขอให้เอเจนต์วางแผนและกำกับการแก้ไขทีละขั้นตอน จากนั้นเรียกใช้เฉพาะ
    คำสั่งที่จำเป็น เพราะ diff ขนาดเล็กตรวจสอบได้ง่ายกว่า

    แชร์ผลลัพธ์เหล่านี้เมื่อขอความช่วยเหลือ (ใน Discord หรือปัญหาบน GitHub):

    | คำสั่ง | แสดงข้อมูล |
    | --- | --- |
    | `openclaw status` | สถานะของ Gateway/เอเจนต์และภาพรวมการกำหนดค่าพื้นฐาน |
    | `openclaw status --all` | การวินิจฉัยแบบอ่านอย่างเดียวทั้งหมด ซึ่งสามารถคัดลอกไปวางได้ |
    | `openclaw models status` | การยืนยันตัวตนของผู้ให้บริการและความพร้อมใช้งานของโมเดล |
    | `openclaw doctor` | ตรวจสอบความถูกต้องและซ่อมแซมปัญหาการกำหนดค่า/สถานะที่พบบ่อย |
    | `openclaw logs --follow` | ติดตามบันทึกแบบสด |
    | `openclaw gateway status --deep` | ตรวจสอบสถานะ Gateway/การกำหนดค่า/Plugin เชิงลึก |
    | `openclaw health --verbose` | รายงานสถานะโดยละเอียด |

    พบข้อบกพร่องจริงหรือวิธีแก้ไขแล้วใช่ไหม เปิดปัญหาหรือส่ง PR:
    [ปัญหา](https://github.com/openclaw/openclaw/issues) /
    [คำขอพูล](https://github.com/openclaw/openclaw/pulls)

    วงจรการดีบักอย่างรวดเร็ว: [60 วินาทีแรกเมื่อมีบางอย่างเสียหาย](/th/help/faq#first-60-seconds-if-something-is-broken)
    เอกสารการติดตั้ง: [การติดตั้ง](/th/install), [แฟล็กตัวติดตั้ง](/th/install/installer), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="Heartbeat ข้ามการทำงานอยู่เรื่อยๆ เหตุผลที่ข้ามหมายความว่าอย่างไร">
    | เหตุผลที่ข้าม | ความหมาย |
    | --- | --- |
    | `quiet-hours` | อยู่นอกช่วงเวลาทำงานที่กำหนดค่าไว้ |
    | `empty-heartbeat-file` | มี `HEARTBEAT.md` อยู่ แต่มีเพียงโครงเปล่า ความคิดเห็น ส่วนหัว รั้วโค้ด หรือรายการตรวจสอบว่าง |
    | `no-tasks-due` | โหมดงานเปิดใช้งานอยู่ แต่ยังไม่ถึงรอบเวลาของงานใด |
    | `alerts-disabled` | ปิดการแสดงผล Heartbeat ทั้งหมด (`showOk`, `showAlerts` และ `useIndicator` ถูกปิดทั้งหมด) |

    ในโหมดงาน การประทับเวลาครบกำหนดจะเลื่อนไปข้างหน้าหลังจากการเรียกใช้ Heartbeat จริงเสร็จสิ้นเท่านั้น
    การเรียกใช้ที่ถูกข้ามจะไม่ทำเครื่องหมายว่างานเสร็จสมบูรณ์

    เอกสาร: [Heartbeat](/th/gateway/heartbeat), [ระบบอัตโนมัติ](/th/automation)

  </Accordion>

  <Accordion title="วิธีที่แนะนำในการติดตั้งและตั้งค่า OpenClaw">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    จากซอร์ส (ผู้มีส่วนร่วม/นักพัฒนา):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    ยังไม่ได้ติดตั้งแบบส่วนกลางใช่ไหม ให้เรียกใช้ `pnpm openclaw onboard` แทน หากไม่มีแอสเซ็ต Control UI
    กระบวนการเริ่มต้นใช้งานจะพยายามสร้างขึ้นเอง และใช้ `pnpm ui:build` เป็นทางเลือกสำรอง

  </Accordion>

  <Accordion title="ฉันจะเปิดแดชบอร์ดหลังจากเริ่มต้นใช้งานได้อย่างไร">
    กระบวนการเริ่มต้นใช้งานจะเปิดเบราว์เซอร์ไปยัง URL แดชบอร์ดแบบสะอาด (ไม่มีโทเค็น)
    ทันทีหลังจากตั้งค่า และแสดงลิงก์ในข้อมูลสรุป เปิดแท็บนั้นค้างไว้ หากเบราว์เซอร์ไม่เปิดขึ้น
    ให้คัดลอกและวาง URL ที่แสดงบนเครื่องเดียวกัน
  </Accordion>

  <Accordion title="ฉันจะยืนยันตัวตนกับแดชบอร์ดบน localhost และระยะไกลได้อย่างไร">
    **Localhost (เครื่องเดียวกัน):**

    - เปิด `http://127.0.0.1:18789/`
    - หากระบบขอการยืนยันตัวตนด้วยข้อมูลลับที่ใช้ร่วมกัน ให้วางโทเค็นหรือรหัสผ่านที่กำหนดค่าไว้ในการตั้งค่า Control UI
    - แหล่งที่มาของโทเค็น: `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
    - แหล่งที่มาของรหัสผ่าน: `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
    - ยังไม่ได้กำหนดค่าข้อมูลลับที่ใช้ร่วมกันใช่ไหม เรียกใช้ `openclaw doctor --generate-gateway-token` (หรือ `openclaw doctor --fix --generate-gateway-token`)

    **ไม่ได้อยู่บน localhost:**

    - **Tailscale Serve** (แนะนำ): คงการผูกไว้ที่ลูปแบ็ก เรียกใช้ `openclaw gateway --tailscale serve` แล้วเปิด `https://<magicdns>/` เมื่อใช้ `gateway.auth.allowTailscale: true` ส่วนหัวข้อมูลประจำตัวจะเป็นไปตามข้อกำหนดการยืนยันตัวตนของ Control UI/WebSocket (ไม่ต้องวางข้อมูลลับที่ใช้ร่วมกัน โดยถือว่าโฮสต์ Gateway เชื่อถือได้) ส่วน HTTP API ยังคงต้องใช้การยืนยันตัวตนด้วยข้อมูลลับที่ใช้ร่วมกัน เว้นแต่คุณตั้งใจใช้ `none` สำหรับขาเข้าส่วนตัวหรือการยืนยันตัวตน HTTP ผ่านพร็อกซีที่เชื่อถือได้
      ความพยายามยืนยันตัวตน Serve ที่ไม่ถูกต้องพร้อมกันจากไคลเอนต์เดียวกันจะถูกจัดลำดับก่อนที่ตัวจำกัดการยืนยันตัวตนล้มเหลวจะบันทึก ดังนั้นการลองผิดครั้งที่สองอาจแสดง `retry later` แล้ว
    - **การผูก Tailnet**: เรียกใช้ `openclaw gateway --bind tailnet --token "<token>"` (หรือกำหนดค่าการยืนยันตัวตนด้วยรหัสผ่าน) เปิด `http://<tailscale-ip>:18789/` แล้ววางข้อมูลลับที่ใช้ร่วมกันซึ่งตรงกันในการตั้งค่าแดชบอร์ด
    - **รีเวิร์สพร็อกซีที่รับรู้ข้อมูลประจำตัว**: ให้ Gateway อยู่หลังพร็อกซีที่เชื่อถือได้ ตั้งค่า `gateway.auth.mode: "trusted-proxy"` แล้วเปิด URL ของพร็อกซี พร็อกซีลูปแบ็กบนโฮสต์เดียวกันต้องกำหนด `gateway.auth.trustedProxy.allowLoopback: true` อย่างชัดเจน
    - **อุโมงค์ SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host` จากนั้นเปิด `http://127.0.0.1:18789/` การยืนยันตัวตนด้วยข้อมูลลับที่ใช้ร่วมกันยังคงมีผลผ่านอุโมงค์ ให้วางโทเค็นหรือรหัสผ่านที่กำหนดค่าไว้หากระบบร้องขอ

    ดูรายละเอียดโหมดการผูกและการยืนยันตัวตนที่ [แดชบอร์ด](/th/web/dashboard) และ [พื้นผิวเว็บ](/th/web)

  </Accordion>

  <Accordion title="เหตุใดจึงมีการกำหนดค่าการอนุมัติ exec สองรายการสำหรับการอนุมัติผ่านแชต">
    ทั้งสองรายการควบคุมคนละชั้น:

    - `approvals.exec` - ส่งต่อข้อความขออนุมัติไปยังปลายทางแชต
    - `channels.<channel>.execApprovals` - ทำให้ช่องทางนั้นเป็นไคลเอนต์การอนุมัติแบบเนทีฟสำหรับการอนุมัติ exec

    นโยบาย exec ของโฮสต์ยังคงเป็นด่านอนุมัติที่แท้จริง การกำหนดค่าแชตควบคุมเพียงตำแหน่งที่
    ข้อความขออนุมัติปรากฏและวิธีที่ผู้ใช้ตอบกลับ

    โดยทั่วไปแทบไม่จำเป็นต้องใช้ทั้งสองอย่าง:

    - หากแชตรองรับคำสั่งและการตอบกลับอยู่แล้ว `/approve` ในแชตเดียวกันจะทำงานผ่านเส้นทางที่ใช้ร่วมกัน
    - เมื่อช่องทางแบบเนทีฟที่รองรับสามารถระบุผู้อนุมัติได้อย่างปลอดภัย OpenClaw จะเปิดใช้การอนุมัติแบบเนทีฟที่ให้ DM มาก่อนโดยอัตโนมัติ หากไม่ได้ตั้งค่า `channels.<channel>.execApprovals.enabled` หรือเป็น `"auto"`
    - เมื่อมีการ์ด/ปุ่มอนุมัติแบบเนทีฟ UI นั้นจะเป็นช่องทางหลัก ให้กล่าวถึงคำสั่ง `/approve` แบบดำเนินการเองเฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่าไม่สามารถอนุมัติผ่านแชตได้
    - ใช้ `approvals.exec` เฉพาะเมื่อข้อความขออนุมัติต้องส่งไปยังแชตอื่นหรือห้องปฏิบัติการที่กำหนดไว้อย่างชัดเจนด้วย
    - ใช้ `channels.<channel>.execApprovals.target: "channel"` หรือ `"both"` เฉพาะเมื่อต้องการโพสต์ข้อความขออนุมัติกลับไปยังห้อง/หัวข้อที่เป็นต้นทาง
    - การอนุมัติ Plugin แยกต่างหาก: ใช้ `/approve` ในแชตเดียวกันเป็นค่าเริ่มต้น เลือกส่งต่อด้วย `approvals.plugin` ได้ และมีเพียงบางช่องทางแบบเนทีฟเท่านั้นที่ยังคงจัดการแบบเนทีฟสำหรับการอนุมัติเหล่านั้นด้วย

    สรุปสั้นๆ: การส่งต่อใช้สำหรับกำหนดเส้นทาง ส่วนการกำหนดค่าไคลเอนต์แบบเนทีฟใช้สำหรับประสบการณ์ผู้ใช้เฉพาะช่องทางที่สมบูรณ์ยิ่งขึ้น
    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>

  <Accordion title="ฉันต้องใช้รันไทม์ใด">
    ต้องใช้ Node **22.22.3+**, **24.15+** หรือ **25.9+** (แนะนำ Node 24) โดย `pnpm` เป็นตัวจัดการแพ็กเกจของรีโพ
    Bun สามารถติดตั้งการขึ้นต่อกันและเรียกใช้สคริปต์แพ็กเกจได้ แต่ไม่สามารถเรียกใช้ CLI หรือ Gateway ของ OpenClaw เนื่องจากไม่มี `node:sqlite`
  </Accordion>

  <Accordion title="ทำงานบน Raspberry Pi ได้หรือไม่">
    ได้ แต่ให้ตรวจสอบ RAM ก่อน: Pi 5 และ Pi 4 (2 GB+) เหมาะสมที่สุด ส่วน Pi 3B+ (1 GB) ใช้งานได้แต่ช้า และไม่แนะนำ Pi Zero 2 W (512 MB)

    | รุ่น | RAM | ความเหมาะสม |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | ดีที่สุด |
    | Pi 4 | 4 GB | ดี |
    | Pi 4 | 2 GB | ใช้ได้ แต่ควรเพิ่ม swap |
    | Pi 4 | 1 GB | ค่อนข้างจำกัด |
    | Pi 3B+ | 1 GB | ช้า |
    | Pi Zero 2 W | 512 MB | ไม่แนะนำ |

    ข้อกำหนดขั้นต่ำที่สุด: RAM 1 GB, 1 คอร์, พื้นที่ดิสก์ว่าง 500 MB และระบบปฏิบัติการ 64 บิต เนื่องจาก Pi เรียกใช้เพียง
    Gateway (โมเดลเรียกใช้ API บนคลาวด์) แม้แต่ Pi รุ่นพื้นฐานก็รองรับภาระงานได้

    Pi/VPS ขนาดเล็กยังสามารถโฮสต์เฉพาะ Gateway ขณะที่จับคู่ **Node** บน
    แล็ปท็อป/โทรศัพท์เพื่อใช้หน้าจอ/กล้อง/แคนวาสภายในเครื่องหรือเรียกใช้คำสั่งได้ ดู [Node](/th/nodes)

    คำแนะนำการตั้งค่าทั้งหมด: [Raspberry Pi](/th/install/raspberry-pi)

  </Accordion>

  <Accordion title="มีคำแนะนำสำหรับการติดตั้งบน Raspberry Pi หรือไม่">
    - ใช้ระบบปฏิบัติการ **64 บิต** ห้ามใช้ Raspberry Pi OS แบบ 32 บิต
    - เพิ่ม swap บนบอร์ดที่มีหน่วยความจำ 2 GB หรือน้อยกว่า
    - เลือกใช้ **USB SSD** แทนการ์ด SD เพื่อประสิทธิภาพและอายุการใช้งานที่ดีกว่า
    - เลือกใช้การติดตั้งแบบแก้ไขได้ (git) เพื่อให้ดูบันทึกและอัปเดตได้รวดเร็ว
    - เริ่มต้นโดยไม่ใช้ช่องทาง/Skills แล้วเพิ่มทีละรายการ
    - ความล้มเหลวของไบนารีที่ผิดปกติ ("exec format error") มักเกิดจากไม่มีบิลด์ ARM64 สำหรับเครื่องมือ Skills ที่เป็นตัวเลือก

    คู่มือฉบับเต็ม: [Raspberry Pi](/th/install/raspberry-pi) และดูเพิ่มเติมที่ [Linux](/th/platforms/linux)

  </Accordion>

  <Accordion title="ค้างอยู่ที่ปลุกเพื่อนของฉัน / กระบวนการเริ่มต้นใช้งานไม่ฟักตัว ต้องทำอย่างไร">
    หน้าจอนั้นต้องสามารถเข้าถึง Gateway และยืนยันตัวตนได้ TUI ยังส่ง
    "ตื่นได้แล้ว เพื่อนของฉัน!" โดยอัตโนมัติเมื่อฟักตัวครั้งแรกและมีการกำหนดค่าผู้ให้บริการโมเดล หาก
    ข้ามการตั้งค่าโมเดล/การยืนยันตัวตน กระบวนการเริ่มต้นใช้งานจะแสดงหมายเหตุ "ไม่มีการยืนยันตัวตนของโมเดล" และเปิด
    TUI โดยไม่ส่งข้อมูลใดๆ — เพิ่มผู้ให้บริการด้วย `openclaw configure --section model`
    หากเห็นข้อความปลุกโดย **ไม่มีการตอบกลับ** และจำนวนโทเค็นยังคงเป็น 0 แสดงว่าเอเจนต์ไม่เคยทำงาน

    1. เริ่ม Gateway ใหม่:

    ```bash
    openclaw gateway restart
    ```

    2. ตรวจสอบสถานะและการยืนยันตัวตน:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. ยังคงค้างอยู่ใช่ไหม เรียกใช้:

    ```bash
    openclaw doctor
    ```

    หาก Gateway อยู่ระยะไกล ให้ยืนยันว่าอุโมงค์/การเชื่อมต่อ Tailscale ทำงานอยู่และ UI
    ชี้ไปยัง Gateway ที่ถูกต้อง ดู [การเข้าถึงระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันสามารถย้ายการตั้งค่าไปยังเครื่องใหม่โดยไม่ทำกระบวนการเริ่มต้นใช้งานซ้ำได้หรือไม่">
    ได้ คัดลอก **ไดเรกทอรีสถานะ** และ **พื้นที่ทำงาน** จากนั้นเรียกใช้ Doctor หนึ่งครั้ง:

    1. ติดตั้ง OpenClaw บนเครื่องใหม่
    2. คัดลอก `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`) จากเครื่องเก่า
    3. คัดลอกพื้นที่ทำงานของคุณ (ค่าเริ่มต้น: `~/.openclaw/workspace`)
    4. เรียกใช้ `openclaw doctor` และเริ่มบริการ Gateway ใหม่

    วิธีนี้จะเก็บรักษาการกำหนดค่า โปรไฟล์การยืนยันตัวตน ข้อมูลประจำตัว WhatsApp เซสชัน และหน่วยความจำไว้ ทำให้
    บอตของคุณเหมือนเดิมทุกประการ ตราบใดที่คัดลอก **ทั้งสอง** ตำแหน่ง ในโหมดระยะไกล
    โฮสต์ Gateway เป็นเจ้าของที่เก็บเซสชันและพื้นที่ทำงาน

    **สำคัญ:** หากคอมมิต/พุชเฉพาะพื้นที่ทำงานไปยัง GitHub คุณจะสำรอง
    **หน่วยความจำและไฟล์บูตสแตรป** แต่จะไม่สำรองประวัติเซสชันหรือการยืนยันตัวตน ข้อมูลเหล่านั้นอยู่ภายใต้
    `~/.openclaw/` (ตัวอย่างเช่น `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`)

    ที่เกี่ยวข้อง: [การย้ายระบบ](/th/install/migrating), [ตำแหน่งจัดเก็บข้อมูลบนดิสก์](/th/help/faq#where-things-live-on-disk),
    [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace), [Doctor](/th/gateway/doctor),
    [โหมดระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันจะดูสิ่งใหม่ในเวอร์ชันล่าสุดได้จากที่ใด">
    ตรวจสอบบันทึกการเปลี่ยนแปลงบน GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    รายการใหม่ล่าสุดอยู่ด้านบน หากส่วนบนสุดเป็น **ยังไม่เผยแพร่** ส่วนที่มีวันที่ถัดลงมา
    คือเวอร์ชันล่าสุดที่เผยแพร่แล้ว รายการจะจัดกลุ่มภายใต้ **ไฮไลต์**, **การเปลี่ยนแปลง**
    และ **การแก้ไข** (รวมถึงส่วนเอกสาร/ส่วนอื่นๆ เมื่อจำเป็น)

  </Accordion>

  <Accordion title="ไม่สามารถเข้าถึง docs.openclaw.ai (ข้อผิดพลาด SSL)">
    การเชื่อมต่อ Comcast/Xfinity บางรายการบล็อก `docs.openclaw.ai` ผ่าน Xfinity
    Advanced Security โดยไม่ถูกต้อง ให้ปิดใช้งานหรือเพิ่ม `docs.openclaw.ai` ลงในรายการอนุญาต แล้วลองอีกครั้ง โปรดช่วยเรา
    ปลดการบล็อก: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)

    ยังติดขัดอยู่ใช่ไหม? เอกสารมีสำเนาบน GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="ความแตกต่างระหว่าง stable และ beta">
    **Stable** และ **beta** คือ **npm dist-tags** ไม่ใช่สายโค้ดที่แยกจากกัน:

    - `latest` = stable
    - `beta` = บิลด์ระยะแรกสำหรับการทดสอบ (ย้อนกลับไปใช้ `latest` เมื่อไม่มี beta หรือ beta เก่ากว่ารุ่น stable ปัจจุบัน)

    โดยปกติรุ่น stable จะเผยแพร่ไปยัง **beta** ก่อน จากนั้นขั้นตอนการเลื่อนระดับอย่างชัดเจน
    จะย้ายเวอร์ชันเดียวกันนั้นไปยัง `latest` โดยไม่เปลี่ยนหมายเลขเวอร์ชัน ผู้ดูแล
    ยังสามารถเผยแพร่ไปยัง `latest` ได้โดยตรงอีกด้วย ด้วยเหตุนี้ beta และ stable จึงอาจชี้ไปยัง
    **เวอร์ชันเดียวกัน** หลังการเลื่อนระดับ

    ดูสิ่งที่เปลี่ยนแปลง: [CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    สำหรับคำสั่งติดตั้งบรรทัดเดียวและความแตกต่างระหว่าง beta กับ dev โปรดดูแอคคอร์เดียนถัดไป

  </Accordion>

  <Accordion title="ฉันจะติดตั้งเวอร์ชัน beta ได้อย่างไร และ beta แตกต่างจาก dev อย่างไร?">
    **Beta** คือ npm dist-tag `beta` (อาจตรงกับ `latest` หลังการเลื่อนระดับ)
    **Dev** คือส่วนหัวที่เปลี่ยนแปลงตลอดเวลาของ `main` (git) และเมื่อเผยแพร่ไปยัง npm จะใช้ dist-tag `dev`

    คำสั่งบรรทัดเดียว (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    ตัวติดตั้ง Windows (PowerShell): `iwr -useb https://openclaw.ai/install.ps1 | iex`

    รายละเอียดเพิ่มเติม: [ช่องทางการพัฒนา](/th/install/development-channels) และ [แฟล็กตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="ฉันจะทดลองส่วนล่าสุดได้อย่างไร?">
    มีสองตัวเลือก:

    1. **ช่องทาง Dev (การติดตั้งที่มีอยู่):**

    ```bash
    openclaw update --channel dev
    ```

    คำสั่งนี้จะสลับไปยัง git checkout ของ `main`, rebase บน upstream, บิลด์ และติดตั้ง
    CLI จาก checkout นั้น

    2. **การติดตั้งแบบแก้ไขได้ (git) (เครื่องใหม่):**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    แนะนำให้ clone ด้วยตนเอง:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [ช่องทางการพัฒนา](/th/install/development-channels), [ติดตั้ง](/th/install)

  </Accordion>

  <Accordion title="โดยปกติการติดตั้งและการเริ่มต้นใช้งานใช้เวลานานเท่าใด?">
    แนวทางคร่าว ๆ:

    - **ติดตั้ง:** 2-5 นาที
    - **การเริ่มต้นใช้งาน QuickStart:** ไม่กี่นาที (Gateway แบบ loopback, โทเค็นอัตโนมัติ, เวิร์กสเปซเริ่มต้น)
    - **การเริ่มต้นใช้งานขั้นสูง/เต็มรูปแบบ:** ใช้เวลานานขึ้นเมื่อการลงชื่อเข้าใช้ผู้ให้บริการ การจับคู่ช่องทาง การติดตั้งดีมอน การดาวน์โหลดผ่านเครือข่าย หรือ Skills ต้องตั้งค่าเพิ่มเติม

    วิซาร์ดจะแสดงกรอบเวลานี้ล่วงหน้า ข้ามขั้นตอนที่ไม่บังคับแล้วกลับมาภายหลังด้วย
    `openclaw configure`

    ค้างอยู่ใช่ไหม? ดู [ฉันติดอยู่](#quick-start-and-first-run-setup) ด้านบน

  </Accordion>

  <Accordion title="ตัวติดตั้งค้างอยู่ใช่ไหม? ฉันจะรับข้อมูลเพิ่มเติมได้อย่างไร?">
    เรียกใช้อีกครั้งด้วย `--verbose`:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1` ไม่มีสวิตช์ verbose โดยเฉพาะ ให้ครอบด้วย `Set-PSDebug -Trace 1` /
    `-Trace 0` แทน ข้อมูลอ้างอิงแฟล็กทั้งหมด: [แฟล็กตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="การติดตั้งบน Windows แจ้งว่าไม่พบ git หรือไม่รู้จัก openclaw">
    ปัญหาที่พบบ่อยบน Windows มีสองอย่าง:

    **1) ข้อผิดพลาด npm spawn git / ไม่พบ git**

    - ติดตั้ง **Git for Windows** และตรวจสอบว่า `git` อยู่ใน PATH
    - ปิดแล้วเปิด PowerShell ใหม่ จากนั้นเรียกใช้ตัวติดตั้งอีกครั้ง

    **2) ไม่รู้จัก openclaw หลังการติดตั้ง**

    - โฟลเดอร์ npm global bin ไม่ได้อยู่ใน PATH
    - ตรวจสอบด้วย: `npm config get prefix`
    - เพิ่มไดเรกทอรีนั้นลงใน PATH ของผู้ใช้ (ไม่ต้องมีส่วนต่อท้าย `\bin`; ในระบบส่วนใหญ่คือ `%AppData%\npm`)
    - ปิดแล้วเปิด PowerShell ใหม่

    ต้องการแอปเดสก์ท็อปใช่ไหม? ใช้ **Windows Hub** สำหรับการตั้งค่าผ่านเทอร์มินัลเท่านั้น รองรับทั้งตัวติดตั้ง PowerShell
    และเส้นทาง WSL2 Gateway เอกสาร: [Windows](/th/platforms/windows)

  </Accordion>

  <Accordion title="เอาต์พุต exec บน Windows แสดงข้อความภาษาจีนผิดเพี้ยน ควรทำอย่างไร?">
    โดยทั่วไปเกิดจาก code page ของคอนโซลไม่ตรงกันบนเชลล์ Windows แบบเนทีฟ

    อาการ: เอาต์พุต `system.run`/`exec` แสดงภาษาจีนเป็นอักขระผิดเพี้ยน แต่คำสั่งเดียวกัน
    แสดงผลถูกต้องในโปรไฟล์เทอร์มินัลอื่น

    วิธีแก้ชั่วคราวใน PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    จากนั้นรีสตาร์ท Gateway และลองอีกครั้ง:

    ```powershell
    openclaw gateway restart
    ```

    ยังเกิดซ้ำบน OpenClaw รุ่นล่าสุดใช่ไหม? ติดตาม/รายงานได้ที่: [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="เอกสารไม่ได้ตอบคำถามของฉัน ฉันจะได้รับคำตอบที่ดีกว่าได้อย่างไร?">
    ใช้การติดตั้งแบบแก้ไขได้ (git) เพื่อให้มีซอร์สและเอกสารทั้งหมดในเครื่อง จากนั้นถาม
    บอตของคุณ (หรือ Claude/Codex) **จากโฟลเดอร์นั้น** เพื่อให้สามารถอ่าน repo และตอบได้อย่างแม่นยำ

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    รายละเอียดเพิ่มเติม: [ติดตั้ง](/th/install) และ [แฟล็กตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน Linux ได้อย่างไร?">
    - เส้นทางด่วนสำหรับ Linux + การติดตั้งบริการ: [Linux](/th/platforms/linux)
    - คำแนะนำแบบครบถ้วน: [เริ่มต้นใช้งาน](/th/start/getting-started)
    - ตัวติดตั้ง + การอัปเดต: [การติดตั้งและการอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน VPS ได้อย่างไร?">
    ใช้ Linux VPS ใดก็ได้ ติดตั้งบนเซิร์ฟเวอร์ จากนั้นเข้าถึง Gateway ผ่าน SSH/Tailscale

    คู่มือ: [exe.dev](/th/install/exe-dev), [Hetzner](/th/install/hetzner), [Fly.io](/th/install/fly)
    การเข้าถึงระยะไกล: [Gateway ระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title="คู่มือการติดตั้งบนคลาวด์/VPS อยู่ที่ไหน?">
    ศูนย์รวมโฮสติ้งพร้อมผู้ให้บริการที่ใช้กันทั่วไป:

    - [โฮสติ้ง VPS](/th/vps) (รวมผู้ให้บริการทั้งหมดไว้ในที่เดียว)
    - [Fly.io](/th/install/fly)
    - [Hetzner](/th/install/hetzner)
    - [exe.dev](/th/install/exe-dev)

    บนคลาวด์ **Gateway จะทำงานบนเซิร์ฟเวอร์** และเข้าถึงได้จากแล็ปท็อป/โทรศัพท์
    ผ่าน Control UI (หรือ Tailscale/SSH) สถานะ + เวิร์กสเปซจะอยู่บนเซิร์ฟเวอร์ ดังนั้น
    ให้ถือว่าโฮสต์เป็นแหล่งข้อมูลจริงและสำรองข้อมูลไว้

    จับคู่ **Node** (Mac/iOS/Android/headless) กับ Gateway บนคลาวด์นั้นสำหรับ
    หน้าจอ/กล้อง/canvas ภายในเครื่อง หรือการเรียกใช้คำสั่งบนแล็ปท็อป ขณะที่ Gateway ยังคงอยู่
    บนคลาวด์

    ศูนย์รวม: [แพลตฟอร์ม](/th/platforms) การเข้าถึงระยะไกล: [Gateway ระยะไกล](/th/gateway/remote)
    Node: [Node](/th/nodes), [CLI สำหรับ Node](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันสั่งให้ OpenClaw อัปเดตตัวเองได้ไหม?">
    ทำได้ แต่ไม่แนะนำ กระบวนการอัปเดตอาจรีสตาร์ท Gateway (ทำให้
    เซสชันที่ใช้งานอยู่หลุด) อาจต้องใช้ git checkout ที่สะอาด และอาจแจ้งให้ยืนยัน
    การเรียกใช้อัปเดตจากเชลล์ในฐานะผู้ดำเนินการปลอดภัยกว่า

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    การทำงานอัตโนมัติจากเอเจนต์:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="การเริ่มต้นใช้งานทำอะไรบ้าง?">
    `openclaw onboard` คือเส้นทางการตั้งค่าที่แนะนำ ใน **โหมดภายในเครื่อง** ระบบจะแนะนำขั้นตอนต่อไปนี้:

    1. **โมเดล/การยืนยันตัวตน** - OAuth ของผู้ให้บริการ, คีย์ API หรือการยืนยันตัวตนด้วยตนเอง (รวมถึงตัวเลือกภายในเครื่อง เช่น LM Studio) และเลือกโมเดลเริ่มต้น
    2. **เวิร์กสเปซ** - ตำแหน่ง + ไฟล์ bootstrap
    3. **Gateway** - พอร์ต, ที่อยู่ bind, โหมดการยืนยันตัวตน, การเปิดให้เข้าถึงผ่าน Tailscale
    4. **ช่องทาง** - ช่องทางแชตในตัวและ Plugin อย่างเป็นทางการ: iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp และอื่น ๆ
    5. **ดีมอน** - LaunchAgent (macOS), ยูนิตผู้ใช้ systemd (Linux/WSL2) หรือ Windows Scheduled Task แบบเนทีฟ
    6. **การตรวจสอบสถานะ** - เริ่ม Gateway และตรวจสอบว่ากำลังทำงานอยู่
    7. **Skills** - ติดตั้งสกิลที่แนะนำและการขึ้นต่อกันที่ไม่บังคับ

    ระบบจะแจ้งระยะเวลาที่คาดไว้ล่วงหน้าและเตือนหากไม่รู้จักโมเดลที่กำหนดค่าไว้
    หรือไม่มีข้อมูลยืนยันตัวตน รายละเอียดทั้งหมด: [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)

  </Accordion>

  <Accordion title="ฉันต้องสมัครสมาชิก Claude หรือ OpenAI เพื่อใช้งานสิ่งนี้หรือไม่?">
    ไม่จำเป็น เรียกใช้ OpenClaw ด้วย **คีย์ API** (Anthropic/OpenAI/อื่น ๆ) หรือ **โมเดลเฉพาะภายในเครื่อง**
    เพื่อให้ข้อมูลอยู่บนอุปกรณ์ การสมัครสมาชิก (Claude Pro/Max, ChatGPT/Codex) เป็น
    วิธีเสริมสำหรับยืนยันตัวตนกับผู้ให้บริการเหล่านั้น

    สำหรับ Anthropic: **คีย์ API** ใช้การเรียกเก็บเงินแบบจ่ายตามการใช้งานมาตรฐาน ส่วน **Claude CLI**
    จะใช้การเข้าสู่ระบบ Claude Code ที่มีอยู่บนโฮสต์เดียวกันซ้ำ ปัจจุบัน Anthropic ถือว่า
    เส้นทาง `claude -p` แบบไม่โต้ตอบของ Claude CLI เป็นการใช้งาน Agent SDK/แบบโปรแกรม ซึ่ง
    ยังคงหักจากขีดจำกัดแพ็กเกจของการสมัครสมาชิก โปรดตรวจสอบเอกสารการเรียกเก็บเงินปัจจุบันของ Anthropic
    ก่อนพึ่งพาพฤติกรรมของการสมัครสมาชิก สำหรับโฮสต์ Gateway ที่ทำงานระยะยาวและระบบอัตโนมัติ
    ที่ใช้ร่วมกัน คีย์ API ของ Anthropic เป็นตัวเลือกที่คาดการณ์ได้มากกว่า

    รองรับ OpenAI Codex OAuth (การสมัครสมาชิก ChatGPT/Codex) อย่างเต็มรูปแบบสำหรับโมเดลเอเจนต์
    OpenClaw ยังรองรับตัวเลือกแบบสมัครสมาชิกที่โฮสต์ให้ รวมถึง **Qwen Cloud
    Coding Plan**, **MiniMax Coding Plan** และ **Z.AI / GLM Coding Plan**

    เอกสาร: [Anthropic](/th/providers/anthropic), [OpenAI](/th/providers/openai),
    [Qwen Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax), [Z.AI (GLM)](/th/providers/zai),
    [โมเดลภายในเครื่อง](/th/gateway/local-models), [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันใช้การสมัครสมาชิก Claude Max โดยไม่มีคีย์ API ได้ไหม?">
    ได้ OpenClaw รองรับการใช้ Claude CLI ซ้ำสำหรับแพ็กเกจ Pro/Max/Team/Enterprise ปัจจุบัน Anthropic
    ถือว่าเส้นทาง `claude -p` ที่ OpenClaw ใช้เป็นการใช้งานตามแพ็กเกจการสมัครสมาชิก ซึ่งอยู่ภายใต้
    ขีดจำกัดของแพ็กเกจ ไม่ใช่โควตาฟรีแยกต่างหาก โปรดดู
    [Anthropic](/th/providers/anthropic) สำหรับรายละเอียดการเรียกเก็บเงินปัจจุบันและลิงก์ไปยัง
    บทความสนับสนุนของ Anthropic สำหรับการตั้งค่าฝั่งเซิร์ฟเวอร์ที่คาดการณ์ได้มากที่สุด ให้ใช้
    คีย์ API ของ Anthropic แทน
  </Accordion>

  <Accordion title="รองรับการยืนยันตัวตนด้วยการสมัครสมาชิก Claude (Claude Pro หรือ Max) หรือไม่?">
    รองรับ ผ่านการใช้ Claude CLI ซ้ำ แนวทางการเรียกเก็บเงินของ Anthropic สำหรับการใช้งาน `claude -p`/Agent SDK
    เปลี่ยนแปลงมาตลอด โปรดดู [Anthropic](/th/providers/anthropic) สำหรับสถานะปัจจุบันและ
    ลิงก์พร้อมวันที่ไปยังบทความสนับสนุนของ Anthropic ก่อนพึ่งพาพฤติกรรมการเรียกเก็บเงิน
    ที่เฉพาะเจาะจง

    Anthropic setup-token auth ยังคงเป็นเส้นทางโทเค็นที่รองรับเช่นกัน แต่ OpenClaw แนะนำให้
    นำการยืนยันตัวตนของ Claude CLI กลับมาใช้ซ้ำและใช้ `claude -p` เมื่อพร้อมใช้งาน สำหรับเวิร์กโหลดระดับโปรดักชันหรือแบบหลายผู้ใช้
    คีย์ Anthropic API ยังคงเป็นตัวเลือกที่ปลอดภัยกว่าและคาดการณ์ได้มากกว่า ตัวเลือกแบบสมัครสมาชิกอื่น ๆ
    ที่โฮสต์ให้: [OpenAI](/th/providers/openai), [Qwen Cloud](/th/providers/qwen),
    [MiniMax](/th/providers/minimax), [Z.AI (GLM)](/th/providers/zai)

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="เหตุใดฉันจึงพบ HTTP 429 rate_limit_error จาก Anthropic">
    **โควตา/ขีดจำกัดอัตราของ Anthropic** สำหรับช่วงเวลาปัจจุบันหมดแล้ว หากใช้ **Claude
    CLI** ให้รอจนกว่าช่วงเวลาดังกล่าวจะรีเซ็ตหรืออัปเกรดแผน หากใช้ **คีย์ Anthropic API**
    ให้ตรวจสอบการใช้งาน/การเรียกเก็บเงินใน Anthropic Console และเพิ่มขีดจำกัดตามความจำเป็น

    หากข้อความระบุเป็น `Extra usage is required for long context requests` โดยเฉพาะ
    คำขอกำลังพยายามใช้หน้าต่างบริบท 1M ของ Anthropic (โมเดล Claude 4.x ขนาด 1M
    ที่รองรับสถานะ GA หรือการกำหนดค่า `params.context1m: true` แบบเดิม) และข้อมูลประจำตัวปัจจุบันของคุณ
    ไม่มีสิทธิ์ใช้การเรียกเก็บเงินสำหรับบริบทขนาดยาว

    ตั้งค่า **โมเดลสำรอง** เพื่อให้ OpenClaw ตอบกลับต่อไปได้ขณะที่ผู้ให้บริการถูกจำกัดอัตรา
    ดู [โมเดล](/th/cli/models), [OAuth](/th/concepts/oauth) และ
    [Anthropic 429 ต้องเปิดใช้การใช้งานเพิ่มเติมสำหรับบริบทยาว](/th/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)

  </Accordion>

  <Accordion title="รองรับ AWS Bedrock หรือไม่">
    รองรับ OpenClaw มีผู้ให้บริการ **Amazon Bedrock (Converse)** ที่รวมมาให้ เมื่อมีตัวบ่งชี้ env ของ AWS
    (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, `AWS_BEARER_TOKEN_BEDROCK`)
    OpenClaw จะเปิดใช้ผู้ให้บริการ Bedrock โดยนัยโดยอัตโนมัติเพื่อค้นหาโมเดล มิฉะนั้น
    ให้ตั้งค่า `plugins.entries.amazon-bedrock.config.discovery.enabled: true` หรือเพิ่มรายการ
    ผู้ให้บริการด้วยตนเอง ดู [Amazon Bedrock](/th/providers/bedrock) และ [ผู้ให้บริการโมเดล](/th/providers/models)
    พร็อกซีที่เข้ากันได้กับ OpenAI ซึ่งอยู่หน้า Bedrock ยังคงเป็นตัวเลือกที่ใช้ได้ หากต้องการโฟลว์คีย์ที่มีการจัดการ
  </Accordion>

  <Accordion title="การยืนยันตัวตนของ Codex ทำงานอย่างไร">
    OpenClaw รองรับ **OpenAI Codex** ผ่าน OAuth (การลงชื่อเข้าใช้ ChatGPT) การตั้งค่าใหม่
    ที่ไม่มีโมเดลหลักจะใช้ `openai/gpt-5.6-sol` ตามที่ระบุทุกประการสำหรับ
    การยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex พร้อมการทำงานผ่าน Codex app-server แบบเนทีฟ
    การยืนยันตัวตนใหม่จะคงโมเดลที่กำหนดไว้อย่างชัดเจนเดิมไว้ รวมถึง
    `openai/gpt-5.5` หากพื้นที่ทำงาน Codex ไม่แสดง GPT-5.6 ให้เลือก
    `openai/gpt-5.5` อย่างชัดเจน OpenClaw จะไม่ปรับลดรุ่นโดยไม่แจ้ง โมเดลอ้างอิง
    ที่ขึ้นต้นด้วย Codex แบบเดิมเป็นการกำหนดค่าแบบเดิมที่ `openclaw doctor
    --fix` ซ่อมแซม การเข้าถึงด้วยคีย์ OpenAI API โดยตรงยังคงใช้ได้สำหรับพื้นผิว OpenAI
    API ที่ไม่ใช่เอเจนต์ และยังใช้กับโมเดลเอเจนต์ได้ผ่านโปรไฟล์คีย์ API
    `openai` ที่จัดลำดับไว้ ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers) และ
    [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
  </Accordion>

  <Accordion title="เหตุใด OpenClaw จึงยังกล่าวถึงคำนำหน้า OpenAI Codex แบบเดิม">
    `openai` คือรหัสผู้ให้บริการและโปรไฟล์การยืนยันตัวตนปัจจุบันสำหรับทั้งคีย์ OpenAI API และ
    ChatGPT/Codex OAuth โดย OpenAI Codex ถูกรวมไว้ในรหัสนี้แล้ว คุณอาจยังเห็นคำนำหน้า
    `openai-codex` แบบเดิมในการกำหนดค่ารุ่นเก่าและคำเตือนการย้ายข้อมูล:

    - `openai/gpt-5.6-sol` = การตั้งค่าการสมัครสมาชิก ChatGPT/Codex ใหม่พร้อมรันไทม์ Codex แบบเนทีฟสำหรับรอบการทำงานของเอเจนต์
    - `openai/gpt-5.5` = ตัวเลือกที่รองรับซึ่งกำหนดไว้อย่างชัดเจนสำหรับการกำหนดค่าที่มีอยู่หรือบัญชีที่ไม่มีสิทธิ์เข้าถึง GPT-5.6
    - โมเดลอ้างอิง `openai-codex/*` แบบเดิม = เส้นทางแบบเดิมที่ `openclaw doctor --fix` ซ่อมแซม
    - `openai/gpt-5.5` ร่วมกับโปรไฟล์คีย์ API `openai` ที่จัดลำดับไว้ = การยืนยันตัวตนด้วยคีย์ API สำหรับโมเดลเอเจนต์ OpenAI
    - รหัสโปรไฟล์การยืนยันตัวตน `openai-codex` แบบเดิม = รหัสแบบเดิมที่ `openclaw doctor --fix` ย้ายข้อมูล

    ต้องการใช้การเรียกเก็บเงินจาก OpenAI Platform โดยตรงหรือไม่ ให้ตั้งค่า `OPENAI_API_KEY` ต้องการใช้การยืนยันตัวตน
    ด้วยการสมัครสมาชิก ChatGPT/Codex หรือไม่ ให้เรียกใช้ `openclaw models auth login --provider openai` เก็บ
    โมเดลอ้างอิงไว้ภายใต้ผู้ให้บริการหลัก `openai/*` การตั้งค่าการสมัครสมาชิกใหม่
    ใช้ `openai/gpt-5.6-sol` ตามที่ระบุทุกประการ doctor จะซ่อมแซมโมเดลอ้างอิงที่ขึ้นต้นด้วย Codex แบบเดิม
    โดยไม่อัปเกรดตัวเลือก `openai/gpt-5.5` ที่กำหนดไว้อย่างชัดเจน

  </Accordion>

  <Accordion title="เหตุใดขีดจำกัด Codex OAuth จึงแตกต่างจากเว็บ ChatGPT ได้">
    Codex OAuth ใช้ช่วงเวลาโควตาที่ OpenAI จัดการและขึ้นอยู่กับแผน ซึ่งอาจแตกต่างจาก
    ประสบการณ์บนเว็บไซต์/แอป ChatGPT แม้จะใช้บัญชีเดียวกัน

    `openclaw models status` แสดงช่วงเวลาการใช้งาน/โควตาของผู้ให้บริการที่มองเห็นได้ในขณะนี้ แต่
    จะไม่สร้างหรือปรับสิทธิ์จากเว็บ ChatGPT ให้เป็นการเข้าถึง API โดยตรง สำหรับเส้นทาง
    การเรียกเก็บเงิน/ขีดจำกัดจาก OpenAI Platform โดยตรง ให้ใช้ `openai/*` พร้อมคีย์ API

  </Accordion>

  <Accordion title="รองรับการยืนยันตัวตนด้วยการสมัครสมาชิก OpenAI (Codex OAuth) หรือไม่">
    รองรับอย่างเต็มรูปแบบ OpenAI อนุญาตอย่างชัดเจนให้ใช้ OAuth จากการสมัครสมาชิกใน
    เครื่องมือ/เวิร์กโฟลว์ภายนอก เช่น OpenClaw การเริ่มต้นใช้งานสามารถเรียกใช้โฟลว์ OAuth ให้คุณได้

    ดู [OAuth](/th/concepts/oauth), [ผู้ให้บริการโมเดล](/th/concepts/model-providers) และ [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)

  </Accordion>

  <Accordion title="ฉันจะตั้งค่า Gemini CLI OAuth ได้อย่างไร">
    Gemini CLI ใช้ **โฟลว์การยืนยันตัวตนของ Plugin** ไม่ใช่รหัสไคลเอนต์หรือข้อมูลลับใน `openclaw.json`

    1. ติดตั้ง Gemini CLI ภายในเครื่องเพื่อให้ `gemini` อยู่ใน `PATH`:
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. เปิดใช้ Plugin: `openclaw plugins enable google`
    3. เข้าสู่ระบบ: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. โมเดลเริ่มต้นหลังเข้าสู่ระบบ: `google/gemini-3.1-pro-preview` (รันไทม์ `google-gemini-cli`)
    5. คำขอล้มเหลวหลังเข้าสู่ระบบหรือไม่ ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway แล้วลองอีกครั้ง

    โทเค็น OAuth จะจัดเก็บในโปรไฟล์การยืนยันตัวตนบนโฮสต์ Gateway รายละเอียด: [Google](/th/providers/google), [ผู้ให้บริการโมเดล](/th/concepts/model-providers)

  </Accordion>

  <Accordion title="โมเดลภายในเครื่องเหมาะสำหรับการสนทนาทั่วไปหรือไม่">
    โดยทั่วไปไม่เหมาะ OpenClaw ต้องใช้บริบทขนาดใหญ่และความปลอดภัยที่แข็งแกร่ง การ์ดขนาดเล็กจะตัดทอนบริบท
    และข้ามตัวกรองความปลอดภัยฝั่งผู้ให้บริการ หากจำเป็น ให้เรียกใช้บิลด์โมเดลที่ **ใหญ่ที่สุด**
    เท่าที่เรียกใช้ภายในเครื่องได้ (LM Studio) ดู [โมเดลภายในเครื่อง](/th/gateway/local-models) โมเดลที่เล็กกว่า/ผ่านการควอนไทซ์
    เพิ่มความเสี่ยงจากการแทรกคำสั่งในพรอมต์ ดู [ความปลอดภัย](/th/gateway/security)
  </Accordion>

  <Accordion title="ฉันจะจำกัดการรับส่งข้อมูลของโมเดลที่โฮสต์ให้อยู่ในภูมิภาคเฉพาะได้อย่างไร">
    เลือกเอนด์พอยต์ที่ตรึงกับภูมิภาค OpenRouter มีตัวเลือกที่โฮสต์ในสหรัฐฯ สำหรับ MiniMax, Kimi
    และ GLM ให้เลือกรุ่นที่โฮสต์ในสหรัฐฯ เพื่อเก็บข้อมูลไว้ในภูมิภาคนั้น คุณยังคงระบุ
    Anthropic/OpenAI ควบคู่กันได้ด้วย `models.mode: "merge"` เพื่อให้โมเดลสำรอง
    พร้อมใช้งาน ขณะยังคงเคารพผู้ให้บริการแบบกำหนดภูมิภาคที่เลือก
  </Accordion>

  <Accordion title="ฉันต้องซื้อ Mac Mini เพื่อติดตั้งหรือไม่">
    ไม่ต้อง OpenClaw ทำงานบน macOS หรือ Linux (Windows ผ่าน WSL2) Mac mini เป็นตัวเลือกโฮสต์
    ที่เปิดตลอดเวลาซึ่งได้รับความนิยม แต่ VPS ขนาดเล็ก เซิร์ฟเวอร์ในบ้าน หรือเครื่องระดับ Raspberry Pi ก็ใช้ได้เช่นกัน

    ต้องใช้ Mac เฉพาะ **สำหรับเครื่องมือที่ใช้ได้บน macOS เท่านั้น** สำหรับ iMessage ให้ใช้ [iMessage](/th/channels/imessage)
    พร้อม `imsg` บน Mac เครื่องใดก็ได้ที่ลงชื่อเข้าใช้ Messages หาก Gateway ทำงานบน Linux หรือที่อื่น
    ให้ตั้งค่า `channels.imessage.cliPath` เป็นตัวห่อหุ้ม SSH ที่เรียกใช้ `imsg` บน Mac เครื่องนั้น สำหรับเครื่องมืออื่น
    ที่ใช้ได้บน macOS เท่านั้น ให้เรียกใช้ Gateway บน Mac หรือจับคู่ Node macOS

    เอกสาร: [iMessage](/th/channels/imessage), [Node](/th/nodes), [โหมดระยะไกลของ Mac](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันต้องใช้ Mac mini เพื่อรองรับ iMessage หรือไม่">
    ต้องมี **อุปกรณ์ macOS สักเครื่อง** ที่ลงชื่อเข้าใช้ Messages ไม่จำเป็นต้องเป็น Mac mini เพราะ
    Mac รุ่นใดก็ใช้ได้ ใช้ [iMessage](/th/channels/imessage) พร้อม `imsg` โดย Gateway สามารถทำงานบน
    Mac เครื่องนั้น หรือที่อื่นผ่านตัวห่อหุ้ม SSH `cliPath`

    รูปแบบการตั้งค่าทั่วไป:

    - Gateway บน Linux/VPS โดยตั้งค่า `channels.imessage.cliPath` เป็นตัวห่อหุ้ม SSH ที่เรียกใช้ `imsg` บน Mac ที่ลงชื่อเข้าใช้ Messages
    - ทุกอย่างอยู่บน Mac เครื่องเดียวเพื่อให้การตั้งค่าแบบเครื่องเดียวเรียบง่ายที่สุด

    เอกสาร: [iMessage](/th/channels/imessage), [Node](/th/nodes), [โหมดระยะไกลของ Mac](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="หากฉันซื้อ Mac mini เพื่อเรียกใช้ OpenClaw จะเชื่อมต่อกับ MacBook Pro ได้หรือไม่">
    ได้ **Mac mini สามารถเรียกใช้ Gateway** และ MacBook Pro จะเชื่อมต่อเป็น **Node**
    (อุปกรณ์คู่หู) Node ไม่ได้เรียกใช้ Gateway แต่เพิ่มความสามารถ เช่น
    หน้าจอ/กล้อง/แคนวาส และ `system.run` บนอุปกรณ์นั้น

    รูปแบบทั่วไป: Gateway อยู่บน Mac mini ที่เปิดตลอดเวลา ส่วน MacBook Pro เรียกใช้แอป macOS หรือ
    โฮสต์ Node และจับคู่กับ Gateway ตรวจสอบด้วย `openclaw nodes status` / `openclaw nodes list`

    เอกสาร: [Node](/th/nodes), [CLI สำหรับ Node](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันใช้ Bun ได้หรือไม่">
    สามารถใช้ Bun เพื่อติดตั้งการขึ้นต่อกันหรือเรียกใช้สคริปต์แพ็กเกจได้ แต่ OpenClaw CLI และ
    Gateway ต้องใช้ **Node** เนื่องจากที่เก็บสถานะหลักใช้ `node:sqlite` ซึ่ง Bun
    ไม่มี API ดังกล่าว
  </Accordion>

  <Accordion title="Telegram: ต้องใส่อะไรใน allowFrom">
    `channels.telegram.allowFrom` คือ **รหัสผู้ใช้ Telegram ของผู้ส่งที่เป็นมนุษย์** (ตัวเลข)
    ไม่ใช่ชื่อผู้ใช้ของบอต การตั้งค่าจะขอเฉพาะรหัสผู้ใช้แบบตัวเลขเท่านั้น ส่วน `openclaw doctor --fix`
    สามารถลองแปลงรายการ `@username` แบบเดิมได้

    ปลอดภัยกว่า (ไม่ใช้บอตของบุคคลที่สาม): ส่ง DM ถึงบอตของคุณ เรียกใช้ `openclaw logs --follow` แล้วอ่าน `from.id`

    Bot API อย่างเป็นทางการ: ส่ง DM ถึงบอตของคุณ เรียก `https://api.telegram.org/bot<bot_token>/getUpdates` แล้วอ่าน `message.from.id`

    บุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): ส่ง DM ถึง `@userinfobot` หรือ `@getidsbot`

    ดู [การควบคุมการเข้าถึง Telegram](/th/channels/telegram#access-control-and-activation)

  </Accordion>

  <Accordion title="หลายคนสามารถใช้หมายเลข WhatsApp เดียวกันกับอินสแตนซ์ OpenClaw ที่ต่างกันได้หรือไม่">
    ได้ ผ่าน **การกำหนดเส้นทางแบบหลายเอเจนต์** ผูก DM ของผู้ส่ง WhatsApp แต่ละราย (`peer: { kind: "direct", id: "+15551234567" }`) กับ `agentId` ที่ต่างกัน เพื่อให้แต่ละคนมีพื้นที่ทำงานและที่เก็บเซสชันของตนเอง การตอบกลับยังคงมาจาก **บัญชี WhatsApp เดียวกัน** ส่วนการควบคุมการเข้าถึง DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) เป็นแบบส่วนกลางต่อบัญชี ดู [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent) และ [WhatsApp](/th/channels/whatsapp)
  </Accordion>

  <Accordion title='ฉันเรียกใช้เอเจนต์ "แชตเร็ว" และเอเจนต์ "Opus สำหรับเขียนโค้ด" ได้หรือไม่'>
    ได้ ใช้การกำหนดเส้นทางแบบหลายเอเจนต์ โดยกำหนดโมเดลเริ่มต้นของแต่ละเอเจนต์แยกกัน แล้วผูกเส้นทาง
    ขาเข้า (บัญชีผู้ให้บริการหรือคู่สนทนาที่ระบุ) เข้ากับแต่ละเอเจนต์ ตัวอย่างการกำหนดค่า:
    [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent) ดูเพิ่มเติมที่ [โมเดล](/th/concepts/models) และ
    [การกำหนดค่า](/th/gateway/configuration)
  </Accordion>

  <Accordion title="Homebrew ใช้งานบน Linux ได้หรือไม่">
    ได้ ผ่าน Linuxbrew:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    เมื่อเรียกใช้ OpenClaw ผ่าน systemd ให้ตรวจสอบว่า PATH ของบริการมี
    `/home/linuxbrew/.linuxbrew/bin` (หรือคำนำหน้า brew ของคุณ) เพื่อให้เครื่องมือที่ติดตั้งด้วย `brew`
    สามารถแก้ไขพาธได้ในเชลล์ที่ไม่ใช่การเข้าสู่ระบบ บิลด์ล่าสุดยังเพิ่มไดเรกทอรี bin ทั่วไปของผู้ใช้ไว้ข้างหน้าในบริการ
    systemd บน Linux (เช่น `~/.local/bin`, `~/.npm-global/bin`,
    `~/.local/share/pnpm`, `~/.bun/bin`) และใช้ค่า `PNPM_HOME`, `NPM_CONFIG_PREFIX`,
    `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` และ `FNM_DIR` เมื่อตั้งค่าไว้

  </Accordion>

  <Accordion title="ความแตกต่างระหว่างการติดตั้งจาก git ที่แก้ไขได้กับการติดตั้งจาก npm">
    - **การติดตั้งแบบแก้ไขได้ (git):** เช็กเอาต์ซอร์สทั้งหมด แก้ไขได้ เหมาะที่สุดสำหรับผู้มีส่วนร่วม คุณบิลด์ภายในเครื่องและแก้ไขโค้ด/เอกสารได้
    - **การติดตั้งจาก npm:** ติดตั้ง CLI แบบส่วนกลาง ไม่มีรีโพ เหมาะที่สุดสำหรับการ "ติดตั้งแล้วใช้งานได้เลย" การอัปเดตมาจาก dist-tags ของ npm

    เอกสาร: [เริ่มต้นใช้งาน](/th/start/getting-started), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ภายหลังสามารถสลับระหว่างการติดตั้งด้วย npm และ git ได้หรือไม่">
    ได้ โดยใช้ `openclaw update --channel ...` กับการติดตั้งที่มีอยู่ การดำเนินการนี้ **ไม่
    ลบข้อมูลของคุณ** โดยจะเปลี่ยนเฉพาะการติดตั้งโค้ด OpenClaw เท่านั้น สถานะ (`~/.openclaw`) และ
    เวิร์กสเปซ (`~/.openclaw/workspace`) จะไม่ถูกแก้ไข

    จาก npm เป็น git:

    ```bash
    openclaw update --channel dev
    ```

    จาก git เป็น npm:

    ```bash
    openclaw update --channel stable
    ```

    เพิ่ม `--dry-run` เพื่อดูตัวอย่างการสลับโหมดที่วางแผนไว้ก่อน ตัวอัปเดตจะดำเนินการ
    ติดตามผลด้วย Doctor รีเฟรชแหล่งที่มาของ Plugin สำหรับช่องทางเป้าหมาย และรีสตาร์ต Gateway
    เว้นแต่คุณจะส่ง `--no-restart`

    ตัวติดตั้งสามารถบังคับใช้โหมดใดโหมดหนึ่งได้เช่นกัน:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    เคล็ดลับการสำรองข้อมูล: [ตำแหน่งที่จัดเก็บสิ่งต่างๆ บนดิสก์](/th/help/faq#where-things-live-on-disk)

  </Accordion>

  <Accordion title="ควรเรียกใช้ Gateway บนแล็ปท็อปหรือ VPS">
    ต้องการความเสถียรตลอด 24/7 หรือไม่ ใช้ **VPS** ต้องการความยุ่งยากน้อยที่สุดและยอมรับ
    การพักเครื่องหรือรีสตาร์ตได้หรือไม่ เรียกใช้ภายในเครื่อง

    **แล็ปท็อป (Gateway ภายในเครื่อง)**

    - **ข้อดี:** ไม่มีค่าใช้จ่ายเซิร์ฟเวอร์ เข้าถึงไฟล์ภายในเครื่องได้โดยตรง มีหน้าต่างเบราว์เซอร์ที่แสดงผลอยู่
    - **ข้อเสีย:** การพักเครื่องหรือเครือข่ายหลุดจะตัดการเชื่อมต่อ การอัปเดตหรือรีบูตระบบปฏิบัติการจะทำให้การทำงานหยุดชะงัก และต้องเปิดเครื่องไว้เสมอ

    **VPS / คลาวด์**

    - **ข้อดี:** เปิดทำงานตลอดเวลา เครือข่ายเสถียร ไม่มีปัญหาแล็ปท็อปพักเครื่อง และดูแลให้ทำงานต่อเนื่องได้ง่ายกว่า
    - **ข้อเสีย:** มักไม่มีหน้าจอ (ใช้ภาพหน้าจอ) เข้าถึงไฟล์ได้จากระยะไกลเท่านั้น และต้องใช้ SSH สำหรับการอัปเดต

    WhatsApp/Telegram/Slack/Mattermost/Discord ล้วนทำงานจาก VPS ได้ดี ประเด็นที่ต้อง
    พิจารณาจริงๆ คือเบราว์เซอร์แบบไม่มีหน้าจอกับหน้าต่างที่มองเห็นได้ ดู [เบราว์เซอร์](/th/tools/browser)

    คำแนะนำเริ่มต้น: ใช้ VPS หากเคยประสบปัญหา Gateway ตัดการเชื่อมต่อ ส่วนการใช้งานภายในเครื่องเหมาะอย่างยิ่ง
    เมื่อกำลังใช้งาน Mac อยู่และต้องการเข้าถึงไฟล์ภายในเครื่อง หรือทำระบบอัตโนมัติผ่าน UI
    ของเบราว์เซอร์ที่มองเห็นได้

  </Accordion>

  <Accordion title="การเรียกใช้ OpenClaw บนเครื่องเฉพาะมีความสำคัญเพียงใด">
    ไม่จำเป็น แต่แนะนำเพื่อความเสถียรและการแยกสภาพแวดล้อม

    - **โฮสต์เฉพาะ (VPS/Mac mini/Raspberry Pi):** เปิดทำงานตลอดเวลา มีการหยุดชะงักจากการพักเครื่องหรือรีบูตน้อยกว่า สิทธิ์สะอาดเป็นระเบียบกว่า และดูแลให้ทำงานต่อเนื่องได้ง่ายกว่า
    - **แล็ปท็อป/เดสก์ท็อปที่ใช้งานร่วมกัน:** เหมาะสำหรับการทดสอบและการใช้งานขณะเปิดเครื่อง แต่จะมีการหยุดชั่วคราวเมื่อเครื่องพักหรืออัปเดต

    วิธีที่ได้ข้อดีของทั้งสองแบบคือ ให้ Gateway อยู่บนโฮสต์เฉพาะและจับคู่แล็ปท็อปเป็น
    **Node** สำหรับเครื่องมือหน้าจอ/กล้อง/การดำเนินคำสั่งภายในเครื่อง ดู [Node](/th/nodes) และ [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อกำหนดขั้นต่ำของ VPS และระบบปฏิบัติการที่แนะนำคืออะไร">
    - **ขั้นต่ำอย่างแท้จริง:** 1 vCPU, RAM 1 GB, ดิสก์ประมาณ 500 MB
    - **แนะนำ:** 1-2 vCPU, RAM 2 GB ขึ้นไปเพื่อให้มีทรัพยากรสำรอง (บันทึก สื่อ หลายช่องทาง) เครื่องมือ Node และระบบอัตโนมัติของเบราว์เซอร์อาจใช้ทรัพยากรมาก

    ระบบปฏิบัติการ: **Ubuntu LTS** (หรือ Debian/Ubuntu รุ่นใหม่ใดๆ) ซึ่งเป็นเส้นทางการติดตั้ง Linux ที่ผ่านการทดสอบมากที่สุด

    เอกสาร: [Linux](/th/platforms/linux), [การโฮสต์บน VPS](/th/vps)

  </Accordion>

  <Accordion title="สามารถเรียกใช้ OpenClaw ใน VM ได้หรือไม่ และมีข้อกำหนดอะไรบ้าง">
    ได้ ให้ถือว่า VM เหมือน VPS โดยต้องเปิดอยู่ตลอดเวลา เข้าถึงได้ และมี RAM เพียงพอ
    สำหรับ Gateway และช่องทางใดๆ ที่เปิดใช้งาน

    - **ขั้นต่ำอย่างแท้จริง:** 1 vCPU, RAM 1 GB
    - **แนะนำ:** RAM 2 GB ขึ้นไปสำหรับหลายช่องทาง ระบบอัตโนมัติของเบราว์เซอร์ หรือเครื่องมือสื่อ
    - **ระบบปฏิบัติการ:** Ubuntu LTS หรือ Debian/Ubuntu รุ่นใหม่อื่นๆ

    บน Windows ให้ใช้ **Windows Hub** สำหรับการตั้งค่าเดสก์ท็อป หรือใช้ WSL2 สำหรับ VM ของ Gateway แบบ Linux
    ที่เข้ากันได้กับเครื่องมือหลากหลาย ดู [Windows](/th/platforms/windows), [การโฮสต์บน VPS](/th/vps)
    การเรียกใช้ macOS ใน VM: ดู [VM ของ macOS](/th/install/macos-vm)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [คำถามที่พบบ่อย](/th/help/faq) - คำถามที่พบบ่อยหลัก (โมเดล เซสชัน Gateway ความปลอดภัย และอื่นๆ)
- [ภาพรวมการติดตั้ง](/th/install)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [การแก้ไขปัญหา](/th/help/troubleshooting)
