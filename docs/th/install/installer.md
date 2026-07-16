---
read_when:
    - คุณต้องการทำความเข้าใจ `openclaw.ai/install.sh`
    - คุณต้องการทำให้การติดตั้งเป็นแบบอัตโนมัติ (CI / แบบไม่มีส่วนติดต่อผู้ใช้)
    - คุณต้องการติดตั้งจากสำเนาที่เช็กเอาต์จาก GitHub
summary: การทำงานของสคริปต์ตัวติดตั้ง (install.sh, install-cli.sh, install.ps1), แฟล็ก และระบบอัตโนมัติ
title: กลไกภายในของโปรแกรมติดตั้ง
x-i18n:
    generated_at: "2026-07-16T19:17:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7878f10903893b4e1902bbc79991f43edaa436bd802d5fecde41421e3e05bc2b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw มาพร้อมสคริปต์ติดตั้ง 3 รายการ ซึ่งให้บริการจาก `openclaw.ai`

| สคริปต์                             | แพลตฟอร์ม             | การทำงาน                                                                                   |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw ผ่าน npm (ค่าเริ่มต้น) หรือ git และสามารถเรียกใช้การเริ่มต้นใช้งานได้       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | ติดตั้ง Node + OpenClaw ลงในคำนำหน้าภายในเครื่อง (`~/.openclaw`) ผ่าน npm หรือ git โดยไม่ต้องใช้สิทธิ์ root |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw ผ่าน npm (ค่าเริ่มต้น) หรือ git และสามารถเรียกใช้การเริ่มต้นใช้งานได้       |

ทั้งสามรายการรองรับ Node **22.22.3+, 24.15+, หรือ 25.9+** โดย Node 24 เป็นเป้าหมายเริ่มต้นสำหรับการติดตั้งใหม่

## คำสั่งด่วน

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
หากติดตั้งสำเร็จแต่ไม่พบ `openclaw` ในเทอร์มินัลใหม่ โปรดดู[การแก้ไขปัญหา Node.js](/th/install/node#troubleshooting)
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
แนะนำสำหรับการติดตั้งแบบโต้ตอบส่วนใหญ่บน macOS/Linux/WSL
</Tip>

### ขั้นตอนการทำงาน (install.sh)

<Steps>
  <Step title="ตรวจหาระบบปฏิบัติการ">
    รองรับ macOS และ Linux (รวมถึง WSL)
  </Step>
  <Step title="ตรวจสอบให้มี Node.js 24 เป็นค่าเริ่มต้น">
    ตรวจสอบเวอร์ชัน Node และติดตั้ง Node 24 หากจำเป็น (ใช้ Homebrew บน macOS และสคริปต์ตั้งค่า NodeSource บน Linux ที่ใช้ apt/dnf/yum) บน macOS ระบบจะติดตั้ง Homebrew เฉพาะเมื่อตัวติดตั้งต้องใช้สำหรับ Node หรือ Git รองรับ Node 22.22.3+, Node 24.15+ และ Node 25.9+ แต่ไม่รองรับ Node 23
    บน Alpine/musl Linux ตัวติดตั้งจะใช้แพ็กเกจ apk แทน NodeSource และตรวจสอบเวอร์ชัน SQLite ที่ลิงก์จริง สตรีมแพ็กเกจ Alpine เวอร์ชันเสถียรในปัจจุบันอาจมี Node ที่ใหม่เพียงพอ แต่ใช้ SQLite ของระบบที่มีช่องโหว่ เมื่อเกิดกรณีนี้ ให้ใช้คอนเทนเนอร์ `node:24-alpine` อย่างเป็นทางการหรือโฮสต์ที่ใช้ glibc แทน
  </Step>
  <Step title="ตรวจสอบให้มี Git">
    ติดตั้ง Git หากยังไม่มีโดยใช้ตัวจัดการแพ็กเกจที่ตรวจพบ รวมถึง Homebrew บน macOS และ apk บน Alpine
  </Step>
  <Step title="ติดตั้ง OpenClaw">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้ง npm แบบส่วนกลาง
    - วิธี `git`: โคลน/อัปเดตที่เก็บ ติดตั้งการขึ้นต่อกันด้วย pnpm สร้างบิลด์ แล้วติดตั้งตัวห่อที่ `~/.local/bin/openclaw`

  </Step>
  <Step title="งานหลังการติดตั้ง">
    - ระบุไบนารี `openclaw` ที่เพิ่งติดตั้งเพื่อใช้กับคำสั่งต่อเนื่อง
    - สำหรับการติดตั้งที่ยังไม่ได้กำหนดค่า จะเริ่มการเริ่มต้นใช้งานก่อนการตรวจสอบของ doctor หรือ Gateway เมื่อใช้ `--no-onboard` หรือไม่มี TTY ระบบจะแสดงคำสั่งสำหรับตั้งค่าให้เสร็จในภายหลัง
    - สำหรับการติดตั้งที่กำหนดค่าแล้ว จะรีเฟรชและรีสตาร์ตบริการ Gateway ที่โหลดอยู่แบบพยายามให้ดีที่สุด และเรียกใช้ doctor การอัปเกรดจะอัปเดต Plugin เมื่อทำได้ หรือแสดงคำสั่งสำหรับดำเนินการด้วยตนเองในการทำงานแบบไม่มีส่วนติดต่อที่เปิดใช้พรอมต์
    - เมื่อเรียกใช้ `--verify` ระบบจะตรวจสอบเวอร์ชันที่ติดตั้ง และตรวจสอบสถานะ Gateway เฉพาะหลังจากมีการกำหนดค่าแล้ว

  </Step>
</Steps>

### การตรวจหาการเช็กเอาต์ซอร์ส

หากเรียกใช้ภายในเช็กเอาต์ OpenClaw (`package.json` + `pnpm-workspace.yaml`) สคริปต์จะเสนอตัวเลือกดังนี้:

- ใช้เช็กเอาต์ (`git`) หรือ
- ใช้การติดตั้งแบบส่วนกลาง (`npm`)

หากไม่มี TTY และไม่ได้ตั้งค่าวิธีติดตั้ง ระบบจะใช้ `npm` เป็นค่าเริ่มต้นพร้อมแสดงคำเตือน

สคริปต์จะออกด้วยรหัส `2` เมื่อเลือกวิธีไม่ถูกต้องหรือค่า `--install-method` ไม่ถูกต้อง

### ตัวอย่าง (install.sh)

<Tabs>
  <Tab title="ค่าเริ่มต้น">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="ข้ามการเริ่มต้นใช้งาน">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="ติดตั้งด้วย Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="เช็กเอาต์ main จาก GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="ทดลองทำงาน">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="ตรวจสอบหลังติดตั้ง">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="ข้อมูลอ้างอิงแฟล็ก">

| แฟล็ก                                    | คำอธิบาย                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | เลือกวิธีติดตั้ง (ค่าเริ่มต้น: `npm`)                                  |
| `--npm`                                 | ทางลัดสำหรับวิธี npm                                                 |
| `--git \| --github`                     | ทางลัดสำหรับวิธี git                                                 |
| `--version <version\|dist-tag\|spec>`   | เวอร์ชัน npm, dist-tag หรือข้อกำหนดแพ็กเกจ (ค่าเริ่มต้น: `latest`)              |
| `--beta`                                | ใช้ dist-tag รุ่นเบต้าหากมี มิฉะนั้นให้ย้อนกลับไปใช้ `latest`              |
| `--git-dir \| --dir <path>`             | ไดเรกทอรีเช็กเอาต์ (ค่าเริ่มต้น: `~/openclaw`)                              |
| `--no-git-update`                       | ข้าม `git pull` สำหรับเช็กเอาต์ที่มีอยู่                                   |
| `--no-prompt`                           | ปิดใช้งานพรอมต์                                                         |
| `--no-onboard`                          | ข้ามการเริ่มต้นใช้งาน                                                         |
| `--onboard`                             | เปิดใช้การเริ่มต้นใช้งาน                                                       |
| `--verify`                              | เรียกใช้การตรวจสอบเบื้องต้นหลังติดตั้ง (`--version`, สถานะ Gateway หากโหลดอยู่) |
| `--dry-run`                             | แสดงการดำเนินการโดยไม่ใช้การเปลี่ยนแปลง                                  |
| `--verbose`                             | เปิดใช้เอาต์พุตดีบัก (`set -x`, บันทึก npm ระดับ notice)                   |
| `--help \| -h`                          | แสดงวิธีใช้                                                              |

  </Accordion>

  <Accordion title="ข้อมูลอ้างอิงตัวแปรสภาพแวดล้อม">

| ตัวแปร                                          | คำอธิบาย                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | วิธีติดตั้ง                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | เวอร์ชัน npm, dist-tag หรือข้อกำหนดแพ็กเกจ                             |
| `OPENCLAW_BETA=0\|1`                              | ใช้รุ่นเบต้าหากมี                                              |
| `OPENCLAW_HOME=<path>`                            | ไดเรกทอรีฐานสำหรับสถานะ OpenClaw และพาธเริ่มต้นของ git/การเริ่มต้นใช้งาน |
| `OPENCLAW_GIT_DIR=<path>`                         | ไดเรกทอรีเช็กเอาต์                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | สลับการอัปเดต git                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | ปิดใช้งานพรอมต์                                                    |
| `OPENCLAW_VERIFY_INSTALL=1`                       | เรียกใช้การตรวจสอบเบื้องต้นหลังติดตั้ง                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | ข้ามการเริ่มต้นใช้งาน                                                    |
| `OPENCLAW_DRY_RUN=1`                              | โหมดทดลองทำงาน                                                       |
| `OPENCLAW_VERBOSE=1`                              | โหมดดีบัก                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | ระดับบันทึก npm (ค่าเริ่มต้น: `error`, ซ่อนข้อความรบกวนเกี่ยวกับการเลิกใช้งานของ npm)      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
ออกแบบมาสำหรับสภาพแวดล้อมที่ต้องการให้ทุกอย่างอยู่ภายใต้คำนำหน้าภายในเครื่อง
(ค่าเริ่มต้น `~/.openclaw`) และไม่ต้องพึ่งพา Node ของระบบ รองรับการติดตั้งด้วย npm
เป็นค่าเริ่มต้น รวมถึงการติดตั้งจากเช็กเอาต์ git ภายใต้ขั้นตอนคำนำหน้าเดียวกัน
</Info>

### ขั้นตอนการทำงาน (install-cli.sh)

<Steps>
  <Step title="ติดตั้งรันไทม์ Node ภายในเครื่อง">
    ดาวน์โหลดไฟล์ tarball ของ Node LTS เวอร์ชันที่รองรับและตรึงไว้ (เวอร์ชันฝังอยู่ในสคริปต์และอัปเดตแยกต่างหาก ค่าเริ่มต้น `24.15.0`) ไปยัง `<prefix>/tools/node-v<version>` และตรวจสอบ SHA-256
    Linux ARMv7 ใช้ Node `22.22.3` เนื่องจากไม่มีไบนารี ARMv7 อย่างเป็นทางการสำหรับ Node 24+
    บน Alpine/musl Linux ซึ่ง Node ไม่ได้เผยแพร่ไฟล์ tarball ที่เข้ากันได้สำหรับรันไทม์ที่ตรึงไว้ ระบบจะติดตั้ง `nodejs` และ `npm` ด้วย `apk` จากนั้นตรวจสอบทั้ง Node และไลบรารี SQLite ที่ลิงก์จริง สตรีมแพ็กเกจ Alpine เวอร์ชันเสถียรในปัจจุบันอาจยังคงลิงก์กับ SQLite ที่มีช่องโหว่แม้ Node จะใหม่เพียงพอ ให้ใช้คอนเทนเนอร์ `node:24-alpine` อย่างเป็นทางการหรือโฮสต์ที่ใช้ glibc เมื่อการตรวจสอบความปลอดภัยปฏิเสธแพ็กเกจ
  </Step>
  <Step title="ตรวจสอบให้มี Git">
    หากไม่มี Git ระบบจะพยายามติดตั้งผ่าน apt/dnf/yum/apk บน Linux หรือ Homebrew บน macOS
  </Step>
  <Step title="ติดตั้ง OpenClaw ภายใต้คำนำหน้า">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้งภายใต้คำนำหน้าด้วย npm จากนั้นเขียนตัวห่อไปยัง `<prefix>/bin/openclaw`
    - วิธี `git`: โคลน/อัปเดตเช็กเอาต์ (ค่าเริ่มต้น `~/openclaw`) และยังคงเขียนตัวห่อไปยัง `<prefix>/bin/openclaw`

  </Step>
  <Step title="รีเฟรชบริการ Gateway ที่โหลดอยู่">
    หากมีบริการ Gateway ที่โหลดจากคำนำหน้าเดียวกันอยู่แล้ว สคริปต์จะเรียกใช้
    `openclaw gateway install --force` ซึ่งเปิดใช้งานบริการทดแทน
    จากนั้นตรวจสอบสถานะ Gateway แบบพยายามให้ดีที่สุด
  </Step>
</Steps>

### ตัวอย่าง (install-cli.sh)

<Tabs>
  <Tab title="ค่าเริ่มต้น">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="คำนำหน้าและเวอร์ชันแบบกำหนดเอง">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="ติดตั้งด้วย Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="เอาต์พุต JSON สำหรับระบบอัตโนมัติ">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="เรียกใช้การเริ่มต้นใช้งาน">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="ข้อมูลอ้างอิงแฟล็ก">

| แฟล็ก                                    | คำอธิบาย                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | คำนำหน้าการติดตั้ง (ค่าเริ่มต้น: `~/.openclaw`)                                         |
| `--install-method \| --method npm\|git` | เลือกวิธีติดตั้ง (ค่าเริ่มต้น: `npm`)                                          |
| `--npm`                                 | ทางลัดสำหรับวิธี npm                                                         |
| `--git \| --github`                     | ทางลัดสำหรับวิธี git                                                         |
| `--git-dir \| --dir <path>`             | ไดเรกทอรีเช็กเอาต์ Git (ค่าเริ่มต้น: `~/openclaw`)                                  |
| `--version <ver>`                       | เวอร์ชันหรือ dist-tag ของ OpenClaw (ค่าเริ่มต้น: `latest`)                                |
| `--node-version <ver>`                  | เวอร์ชัน Node (ค่าเริ่มต้น: `24.15.0`; `22.22.3` บน Linux ARMv7)                     |
| `--json`                                | ส่งออกเหตุการณ์ NDJSON                                                              |
| `--onboard`                             | เรียกใช้ `openclaw onboard` หลังการติดตั้ง                                            |
| `--no-onboard`                          | ข้ามการเริ่มต้นใช้งาน (ค่าเริ่มต้น)                                                       |
| `--set-npm-prefix`                      | บน Linux บังคับให้คำนำหน้า npm เป็น `~/.npm-global` หากคำนำหน้าปัจจุบันเขียนไม่ได้ |
| `--help \| -h`                          | แสดงวิธีใช้                                                                      |

  </Accordion>

  <Accordion title="ข้อมูลอ้างอิงตัวแปรสภาพแวดล้อม">

| ตัวแปร                                    | คำอธิบาย                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | คำนำหน้าการติดตั้ง                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | วิธีติดตั้ง                                                     |
| `OPENCLAW_VERSION=<ver>`                    | เวอร์ชันหรือ dist-tag ของ OpenClaw                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | เวอร์ชัน Node                                                       |
| `OPENCLAW_HOME=<path>`                      | ไดเรกทอรีฐานสำหรับสถานะ OpenClaw และพาธ git/การเริ่มต้นใช้งานเริ่มต้น |
| `OPENCLAW_GIT_DIR=<path>`                   | ไดเรกทอรีเช็กเอาต์ Git สำหรับการติดตั้งด้วย git                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | เปิดหรือปิดการอัปเดต git สำหรับเช็กเอาต์ที่มีอยู่                          |
| `OPENCLAW_NO_ONBOARD=1`                     | ข้ามการเริ่มต้นใช้งาน                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | ระดับบันทึกของ npm (ค่าเริ่มต้น: `error`)                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` และข้อกำหนดซอร์ส GitHub อื่นๆ ไม่ใช่เป้าหมาย `--version` ที่ถูกต้องสำหรับการติดตั้งด้วย npm ให้ใช้ `--install-method git --version main` แทน
</Note>

---

<a id="installps1"></a>

## install.ps1

### ลำดับการทำงาน (install.ps1)

<Steps>
  <Step title="ตรวจสอบสภาพแวดล้อม PowerShell + Windows">
    ต้องใช้ PowerShell 5 ขึ้นไป
  </Step>
  <Step title="ตรวจสอบให้ใช้ Node.js 24 โดยค่าเริ่มต้น">
    หากไม่มี จะพยายามติดตั้งผ่าน winget จากนั้น Chocolatey แล้วจึง Scoop หากไม่มีตัวจัดการแพ็กเกจ สคริปต์จะดาวน์โหลดไฟล์ zip อย่างเป็นทางการของ Node.js 24 สำหรับ Windows ไปยัง `%LOCALAPPDATA%\OpenClaw\deps\portable-node` และเพิ่มลงใน PATH ของกระบวนการปัจจุบันและผู้ใช้ รองรับ Node 22.22.3+, Node 24.15+ และ Node 25.9+ แต่ไม่รองรับ Node 23
  </Step>
  <Step title="ติดตั้ง OpenClaw">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้ง npm แบบส่วนกลางโดยใช้ `-Tag` ที่เลือก เรียกจากไดเรกทอรีชั่วคราวของตัวติดตั้งที่เขียนได้ เพื่อให้เชลล์ที่เปิดในโฟลเดอร์ที่มีการป้องกัน เช่น `C:\` ยังคงทำงานได้
    - วิธี `git`: โคลน/อัปเดต repo ติดตั้ง/บิลด์ด้วย pnpm และติดตั้งตัวห่อที่ `%USERPROFILE%\.local\bin\openclaw.cmd` หากไม่มี Git สคริปต์จะบูตสแตรป MinGit สำหรับผู้ใช้ภายใต้ `%LOCALAPPDATA%\OpenClaw\deps\portable-git` และเพิ่มลงใน PATH ของกระบวนการปัจจุบันและผู้ใช้

  </Step>
  <Step title="งานหลังการติดตั้ง">
    - เพิ่มไดเรกทอรี bin ที่จำเป็นลงใน PATH ของผู้ใช้เมื่อทำได้
    - รีเฟรชบริการ Gateway ที่โหลดอยู่แบบพยายามให้ดีที่สุด (`openclaw gateway install --force` แล้วรีสตาร์ต)
    - เรียกใช้ `openclaw doctor --non-interactive` เมื่ออัปเกรดและติดตั้งด้วย git (พยายามให้ดีที่สุด)

  </Step>
  <Step title="จัดการความล้มเหลว">
    การติดตั้งผ่าน `iwr ... | iex` และ scriptblock จะรายงานข้อผิดพลาดที่ยุติการทำงานโดยไม่ปิดเซสชัน PowerShell ปัจจุบัน ส่วนการติดตั้งโดยตรงผ่าน `powershell -File` / `pwsh -File` ยังคงออกด้วยรหัสที่ไม่ใช่ศูนย์สำหรับระบบอัตโนมัติ
  </Step>
</Steps>

### ตัวอย่าง (install.ps1)

<Tabs>
  <Tab title="ค่าเริ่มต้น">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="ติดตั้งด้วย Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="เช็กเอาต์ main จาก GitHub">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="ไดเรกทอรี git แบบกำหนดเอง">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="ทดลองทำงาน">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="ข้อมูลอ้างอิงแฟล็ก">

| แฟล็ก                        | คำอธิบาย                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | วิธีติดตั้ง (ค่าเริ่มต้น: `npm`)                            |
| `-Tag <tag\|version\|spec>` | dist-tag, เวอร์ชัน หรือข้อกำหนดแพ็กเกจของ npm (ค่าเริ่มต้น: `latest`) |
| `-GitDir <path>`            | ไดเรกทอรีเช็กเอาต์ (ค่าเริ่มต้น: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | ข้ามการเริ่มต้นใช้งาน                                            |
| `-NoGitUpdate`              | ข้าม `git pull`                                            |
| `-DryRun`                   | พิมพ์เฉพาะการดำเนินการ                                         |

  </Accordion>

  <Accordion title="ข้อมูลอ้างอิงตัวแปรสภาพแวดล้อม">

| ตัวแปร                           | คำอธิบาย        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | วิธีติดตั้ง     |
| `OPENCLAW_GIT_DIR=<path>`          | ไดเรกทอรีเช็กเอาต์ |
| `OPENCLAW_NO_ONBOARD=1`            | ข้ามการเริ่มต้นใช้งาน    |
| `OPENCLAW_GIT_UPDATE=0`            | ปิดใช้งาน git pull   |
| `OPENCLAW_DRY_RUN=1`               | โหมดทดลองทำงาน       |

  </Accordion>
</AccordionGroup>

<Note>
หากใช้ `-InstallMethod git` และไม่มี Git สคริปต์จะพยายามบูตสแตรป MinGit สำหรับผู้ใช้ก่อนแสดงลิงก์ Git for Windows
</Note>

---

## CI และระบบอัตโนมัติ

ใช้แฟล็ก/ตัวแปรสภาพแวดล้อมแบบไม่โต้ตอบเพื่อให้การทำงานคาดการณ์ได้

<Tabs>
  <Tab title="install.sh (npm แบบไม่โต้ตอบ)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git แบบไม่โต้ตอบ)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (ข้ามการเริ่มต้นใช้งาน)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="เหตุใดจึงต้องใช้ Git?">
    ต้องใช้ Git สำหรับวิธีติดตั้ง `git` สำหรับการติดตั้งแบบ `npm` ระบบยังคงตรวจสอบ/ติดตั้ง Git เพื่อหลีกเลี่ยงความล้มเหลวของ `spawn git ENOENT` เมื่อการขึ้นต่อกันใช้ URL แบบ git
  </Accordion>

  <Accordion title="เหตุใด npm จึงพบ EACCES บน Linux?">
    การตั้งค่า Linux บางแบบชี้คำนำหน้าส่วนกลางของ npm ไปยังพาธที่ root เป็นเจ้าของ `install.sh` สามารถเปลี่ยนคำนำหน้าเป็น `~/.npm-global` และเพิ่มคำสั่ง export PATH ต่อท้ายไฟล์ rc ของเชลล์ (เมื่อมีไฟล์เหล่านั้น)
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    เรียกใช้ตัวติดตั้งอีกครั้งเพื่อให้บูตสแตรป MinGit สำหรับผู้ใช้ หรือติดตั้ง Git for Windows แล้วเปิด PowerShell ใหม่
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    เรียกใช้ `npm config get prefix` และเพิ่มไดเรกทอรีนั้นลงใน PATH ของผู้ใช้ (บน Windows ไม่ต้องมีส่วนต่อท้าย `\bin`) แล้วเปิด PowerShell ใหม่
  </Accordion>

  <Accordion title="Windows: วิธีรับเอาต์พุตโดยละเอียดจากตัวติดตั้ง">
    `install.ps1` ไม่มีสวิตช์ `-Verbose`
    ใช้การติดตาม PowerShell สำหรับการวินิจฉัยระดับสคริปต์:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="ไม่พบ openclaw หลังการติดตั้ง">
    โดยทั่วไปเป็นปัญหาเกี่ยวกับ PATH ดู[การแก้ไขปัญหา Node.js](/th/install/node#troubleshooting)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [การอัปเดต](/th/install/updating)
- [การถอนการติดตั้ง](/th/install/uninstall)
