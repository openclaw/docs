---
read_when:
    - คุณต้องการทำความเข้าใจ `openclaw.ai/install.sh`
    - คุณต้องการทำให้การติดตั้งเป็นอัตโนมัติ (CI / แบบไม่มีหน้าจอ)
    - คุณต้องการติดตั้งจากสำเนาโค้ดที่เช็กเอาต์จาก GitHub
summary: วิธีการทำงานของสคริปต์ติดตั้ง (install.sh, install-cli.sh, install.ps1), แฟล็ก และการทำงานอัตโนมัติ
title: กลไกภายในของตัวติดตั้ง
x-i18n:
    generated_at: "2026-06-27T17:44:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

OpenClaw มาพร้อมกับสคริปต์ติดตั้งสามรายการ ซึ่งให้บริการจาก `openclaw.ai`

| สคริปต์                             | แพลตฟอร์ม             | สิ่งที่ทำ                                                                                                   |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw ผ่าน npm (ค่าเริ่มต้น) หรือ git และสามารถเรียกใช้การเริ่มต้นใช้งานได้                   |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | ติดตั้ง Node + OpenClaw ลงใน prefix ภายในเครื่อง (`~/.openclaw`) ด้วยโหมด npm หรือ git checkout ไม่ต้องใช้สิทธิ์ root |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw ผ่าน npm (ค่าเริ่มต้น) หรือ git และสามารถเรียกใช้การเริ่มต้นใช้งานได้                   |

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
หากติดตั้งสำเร็จแต่ไม่พบ `openclaw` ในเทอร์มินัลใหม่ โปรดดู [การแก้ไขปัญหา Node.js](/th/install/node#troubleshooting)
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
แนะนำสำหรับการติดตั้งแบบโต้ตอบส่วนใหญ่บน macOS/Linux/WSL
</Tip>

### โฟลว์ (install.sh)

<Steps>
  <Step title="Detect OS">
    รองรับ macOS และ Linux (รวมถึง WSL)
  </Step>
  <Step title="Ensure Node.js 24 by default">
    ตรวจสอบเวอร์ชัน Node และติดตั้ง Node 24 หากจำเป็น (Homebrew บน macOS, สคริปต์ตั้งค่า NodeSource บน Linux apt/dnf/yum) บน macOS จะติดตั้ง Homebrew เฉพาะเมื่อ installer ต้องใช้สำหรับ Node หรือ Git เท่านั้น OpenClaw ยังคงรองรับ Node 22 LTS ซึ่งปัจจุบันคือ `22.19+` เพื่อความเข้ากันได้
    บน Alpine/musl Linux installer จะใช้แพ็กเกจ apk แทน NodeSource; repository ของ Alpine ที่กำหนดค่าต้องมี Node `22.19+` (Alpine 3.21 หรือใหม่กว่า ณ เวลาที่เขียน)
  </Step>
  <Step title="Ensure Git">
    ติดตั้ง Git หากยังไม่มี โดยใช้ package manager ที่ตรวจพบ รวมถึง Homebrew บน macOS และ apk บน Alpine
  </Step>
  <Step title="Install OpenClaw">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้ง npm แบบ global
    - วิธี `git`: clone/update repo, ติดตั้ง deps ด้วย pnpm, build จากนั้นติดตั้ง wrapper ที่ `~/.local/bin/openclaw`

  </Step>
  <Step title="Post-install tasks">
    - รีเฟรช gateway service ที่โหลดอยู่แบบพยายามให้ดีที่สุด (`openclaw gateway install --force` จากนั้น restart)
    - เรียกใช้ `openclaw doctor --non-interactive` เมื่ออัปเกรดและติดตั้งด้วย git (พยายามให้ดีที่สุด)
    - พยายามเริ่มต้นใช้งานเมื่อเหมาะสม (มี TTY, ไม่ได้ปิดการเริ่มต้นใช้งาน และ bootstrap/config checks ผ่าน)

  </Step>
</Steps>

### การตรวจพบ source checkout

หากเรียกใช้ภายใน OpenClaw checkout (`package.json` + `pnpm-workspace.yaml`) สคริปต์จะเสนอ:

- ใช้ checkout (`git`) หรือ
- ใช้การติดตั้งแบบ global (`npm`)

หากไม่มี TTY และไม่ได้ตั้งค่าวิธีติดตั้ง จะใช้ค่าเริ่มต้นเป็น `npm` และแสดงคำเตือน

สคริปต์จะออกด้วยโค้ด `2` สำหรับการเลือกวิธีที่ไม่ถูกต้องหรือค่า `--install-method` ที่ไม่ถูกต้อง

### ตัวอย่าง (install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Skip onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main checkout">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| แฟล็ก                                  | คำอธิบาย                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | เลือกวิธีติดตั้ง (ค่าเริ่มต้น: `npm`) Alias: `--method`  |
| `--npm`                               | ทางลัดสำหรับวิธี npm                                    |
| `--git`                               | ทางลัดสำหรับวิธี git Alias: `--github`                 |
| `--version <version\|dist-tag\|spec>` | เวอร์ชัน npm, dist-tag หรือ package spec (ค่าเริ่มต้น: `latest`) |
| `--beta`                              | ใช้ beta dist-tag หากมี มิฉะนั้น fallback เป็น `latest`  |
| `--git-dir <path>`                    | ไดเรกทอรี checkout (ค่าเริ่มต้น: `~/openclaw`) Alias: `--dir` |
| `--no-git-update`                     | ข้าม `git pull` สำหรับ checkout ที่มีอยู่                      |
| `--no-prompt`                         | ปิด prompts                                            |
| `--no-onboard`                        | ข้ามการเริ่มต้นใช้งาน                                            |
| `--onboard`                           | เปิดใช้การเริ่มต้นใช้งาน                                          |
| `--dry-run`                           | พิมพ์ actions โดยไม่ใช้การเปลี่ยนแปลง                     |
| `--verbose`                           | เปิดใช้ debug output (`set -x`, บันทึก notice-level ของ npm)      |
| `--help`                              | แสดง usage (`-h`)                                          |

  </Accordion>

  <Accordion title="Environment variables reference">

| ตัวแปร                                          | คำอธิบาย                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | วิธีติดตั้ง                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | เวอร์ชัน npm, dist-tag หรือ package spec                             |
| `OPENCLAW_BETA=0\|1`                              | ใช้ beta หากมี                                              |
| `OPENCLAW_HOME=<path>`                            | ไดเรกทอรีฐานสำหรับ state ของ OpenClaw และเส้นทาง git/onboarding ค่าเริ่มต้น |
| `OPENCLAW_GIT_DIR=<path>`                         | ไดเรกทอรี checkout                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | สลับการอัปเดต git                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | ปิด prompts                                                    |
| `OPENCLAW_NO_ONBOARD=1`                           | ข้ามการเริ่มต้นใช้งาน                                                    |
| `OPENCLAW_DRY_RUN=1`                              | โหมด dry run                                                       |
| `OPENCLAW_VERBOSE=1`                              | โหมด debug                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | ระดับบันทึกของ npm                                                      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
ออกแบบมาสำหรับสภาพแวดล้อมที่คุณต้องการให้ทุกอย่างอยู่ใต้ prefix ภายในเครื่อง
(ค่าเริ่มต้น `~/.openclaw`) และไม่มีการพึ่งพา Node ของระบบ รองรับการติดตั้ง npm
เป็นค่าเริ่มต้น รวมถึงการติดตั้งแบบ git-checkout ภายใต้โฟลว์ prefix เดียวกัน
</Info>

### โฟลว์ (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    ดาวน์โหลด tarball ของ Node LTS ที่รองรับและตรึงเวอร์ชันไว้ (เวอร์ชันฝังอยู่ในสคริปต์และอัปเดตแยกกัน) ไปยัง `<prefix>/tools/node-v<version>` และตรวจสอบ SHA-256
    บน Alpine/musl Linux ซึ่ง Node ไม่เผยแพร่ tarball ที่เข้ากันได้สำหรับ runtime ที่ตรึงไว้ จะติดตั้ง `nodejs` และ `npm` ด้วย `apk` และลิงก์ runtime นั้นเข้าไปในเส้นทาง wrapper ของ prefix repository ของ Alpine ต้องมี Node `22.19+`; ใช้ Alpine 3.21 หรือใหม่กว่าหาก repository ที่เก่ากว่ามีเพียง Node 20 หรือ 21
  </Step>
  <Step title="Ensure Git">
    หากไม่มี Git จะพยายามติดตั้งผ่าน apt/dnf/yum/apk บน Linux หรือ Homebrew บน macOS
  </Step>
  <Step title="Install OpenClaw under prefix">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้งใต้ prefix ด้วย npm จากนั้นเขียน wrapper ไปที่ `<prefix>/bin/openclaw`
    - วิธี `git`: clones/updates checkout (ค่าเริ่มต้น `~/openclaw`) และยังคงเขียน wrapper ไปที่ `<prefix>/bin/openclaw`

  </Step>
  <Step title="Refresh loaded gateway service">
    หาก gateway service โหลดอยู่แล้วจาก prefix เดียวกันนั้น สคริปต์จะเรียกใช้
    `openclaw gateway install --force` จากนั้น `openclaw gateway restart` และ
    ตรวจสอบสุขภาพของ gateway แบบพยายามให้ดีที่สุด
  </Step>
</Steps>

### ตัวอย่าง (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Custom prefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Automation JSON output">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Run onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| แฟล็ก                        | คำอธิบาย                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | พรีฟิกซ์การติดตั้ง (ค่าเริ่มต้น: `~/.openclaw`)                                         |
| `--install-method npm\|git` | เลือกวิธีติดตั้ง (ค่าเริ่มต้น: `npm`) นามแฝง: `--method`                       |
| `--npm`                     | ทางลัดสำหรับวิธี npm                                                         |
| `--git`, `--github`         | ทางลัดสำหรับวิธี git                                                         |
| `--git-dir <path>`          | ไดเรกทอรีเช็กเอาต์ Git (ค่าเริ่มต้น: `~/openclaw`) นามแฝง: `--dir`                  |
| `--version <ver>`           | เวอร์ชัน OpenClaw หรือ dist-tag (ค่าเริ่มต้น: `latest`)                                |
| `--node-version <ver>`      | เวอร์ชัน Node (ค่าเริ่มต้น: `22.22.0`)                                               |
| `--json`                    | ส่งออกอีเวนต์ NDJSON                                                              |
| `--onboard`                 | รัน `openclaw onboard` หลังติดตั้ง                                            |
| `--no-onboard`              | ข้ามการเริ่มต้นใช้งาน (ค่าเริ่มต้น)                                                       |
| `--set-npm-prefix`          | บน Linux บังคับพรีฟิกซ์ npm เป็น `~/.npm-global` หากพรีฟิกซ์ปัจจุบันเขียนไม่ได้ |
| `--help`                    | แสดงวิธีใช้ (`-h`)                                                               |

  </Accordion>

  <Accordion title="ข้อมูลอ้างอิงตัวแปรสภาพแวดล้อม">

| ตัวแปร                                    | คำอธิบาย                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | พรีฟิกซ์การติดตั้ง                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | วิธีติดตั้ง                                                     |
| `OPENCLAW_VERSION=<ver>`                    | เวอร์ชัน OpenClaw หรือ dist-tag                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | เวอร์ชัน Node                                                       |
| `OPENCLAW_HOME=<path>`                      | ไดเรกทอรีฐานสำหรับสถานะ OpenClaw และพาธ git/การเริ่มต้นใช้งานเริ่มต้น |
| `OPENCLAW_GIT_DIR=<path>`                   | ไดเรกทอรีเช็กเอาต์ Git สำหรับการติดตั้งแบบ git                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | เปิดหรือปิดการอัปเดต git สำหรับเช็กเอาต์ที่มีอยู่                          |
| `OPENCLAW_NO_ONBOARD=1`                     | ข้ามการเริ่มต้นใช้งาน                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | ระดับบันทึกของ npm                                                      |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### โฟลว์ (install.ps1)

<Steps>
  <Step title="ตรวจสอบสภาพแวดล้อม PowerShell + Windows">
    ต้องใช้ PowerShell 5 ขึ้นไป
  </Step>
  <Step title="ตรวจสอบ Node.js 24 เป็นค่าเริ่มต้น">
    หากไม่มี จะพยายามติดตั้งผ่าน winget ตามด้วย Chocolatey แล้วจึง Scoop หากไม่มีตัวจัดการแพ็กเกจ สคริปต์จะดาวน์โหลด zip ทางการของ Node.js สำหรับ Windows ไปยัง `%LOCALAPPDATA%\OpenClaw\deps\portable-node` และเพิ่มลงใน PATH ของกระบวนการปัจจุบันและผู้ใช้ Node 22 LTS ซึ่งปัจจุบันคือ `22.19+` ยังคงรองรับเพื่อความเข้ากันได้
  </Step>
  <Step title="ติดตั้ง OpenClaw">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้ง npm แบบโกลบอลโดยใช้ `-Tag` ที่เลือก เริ่มจากไดเรกทอรีชั่วคราวของตัวติดตั้งที่เขียนได้ เพื่อให้เชลล์ที่เปิดในโฟลเดอร์ที่มีการป้องกัน เช่น `C:\` ยังทำงานได้
    - วิธี `git`: clone/อัปเดต repo, ติดตั้ง/บิลด์ด้วย pnpm และติดตั้ง wrapper ที่ `%USERPROFILE%\.local\bin\openclaw.cmd` หากไม่มี Git สคริปต์จะบูตสแตรป MinGit แบบ user-local ใต้ `%LOCALAPPDATA%\OpenClaw\deps\portable-git` และเพิ่มลงใน PATH ของกระบวนการปัจจุบันและผู้ใช้

  </Step>
  <Step title="งานหลังติดตั้ง">
    - เพิ่มไดเรกทอรี bin ที่จำเป็นลงใน PATH ของผู้ใช้เมื่อทำได้
    - รีเฟรชบริการ Gateway ที่โหลดอยู่แบบ best-effort (`openclaw gateway install --force` แล้วรีสตาร์ต)
    - รัน `openclaw doctor --non-interactive` เมื่ออัปเกรดและติดตั้งแบบ git (best effort)

  </Step>
  <Step title="จัดการความล้มเหลว">
    การติดตั้งแบบ `iwr ... | iex` และ scriptblock จะรายงานข้อผิดพลาดแบบ terminating โดยไม่ปิดเซสชัน PowerShell ปัจจุบัน การติดตั้งแบบ `powershell -File` / `pwsh -File` โดยตรงยังคงออกด้วยรหัสที่ไม่ใช่ศูนย์สำหรับระบบอัตโนมัติ
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
  <Tab title="เช็กเอาต์ GitHub main">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="ไดเรกทอรี git แบบกำหนดเอง">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="การจำลองการรัน">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="การติดตามดีบัก">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="ข้อมูลอ้างอิงแฟล็ก">

| แฟล็ก                        | คำอธิบาย                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | วิธีติดตั้ง (ค่าเริ่มต้น: `npm`)                            |
| `-Tag <tag\|version\|spec>` | dist-tag, เวอร์ชัน หรือ package spec ของ npm (ค่าเริ่มต้น: `latest`) |
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
| `OPENCLAW_DRY_RUN=1`               | โหมดจำลองการรัน       |

  </Accordion>
</AccordionGroup>

<Note>
หากใช้ `-InstallMethod git` และไม่มี Git สคริปต์จะพยายามบูตสแตรป MinGit แบบ user-local ก่อนพิมพ์ลิงก์ Git for Windows
</Note>

---

## CI และระบบอัตโนมัติ

ใช้แฟล็ก/ตัวแปรสภาพแวดล้อมแบบไม่โต้ตอบเพื่อให้การรันคาดการณ์ได้

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
  <Accordion title="ทำไมจึงต้องใช้ Git?">
    ต้องใช้ Git สำหรับวิธีติดตั้งแบบ `git` สำหรับการติดตั้งแบบ `npm` ยังคงมีการตรวจสอบ/ติดตั้ง Git เพื่อหลีกเลี่ยงความล้มเหลว `spawn git ENOENT` เมื่อ dependency ใช้ URL แบบ git
  </Accordion>

  <Accordion title="ทำไม npm จึงเจอ EACCES บน Linux?">
    การตั้งค่า Linux บางแบบชี้พรีฟิกซ์โกลบอลของ npm ไปยังพาธที่ root เป็นเจ้าของ `install.sh` สามารถเปลี่ยนพรีฟิกซ์เป็น `~/.npm-global` และผนวกการส่งออก PATH ไปยังไฟล์ rc ของเชลล์ได้ (เมื่อไฟล์เหล่านั้นมีอยู่)
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    รันตัวติดตั้งอีกครั้งเพื่อให้บูตสแตรป MinGit แบบ user-local ได้ หรือติดตั้ง Git for Windows แล้วเปิด PowerShell ใหม่
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    รัน `npm config get prefix` แล้วเพิ่มไดเรกทอรีนั้นลงใน PATH ของผู้ใช้ (บน Windows ไม่ต้องมี suffix `\bin`) จากนั้นเปิด PowerShell ใหม่
  </Accordion>

  <Accordion title="Windows: วิธีรับเอาต์พุตตัวติดตั้งแบบละเอียด">
    ขณะนี้ `install.ps1` ยังไม่มีสวิตช์ `-Verbose`
    ใช้การติดตามของ PowerShell สำหรับการวินิจฉัยระดับสคริปต์:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="ไม่พบ openclaw หลังติดตั้ง">
    โดยปกติเป็นปัญหา PATH ดู [การแก้ไขปัญหา Node.js](/th/install/node#troubleshooting)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [การอัปเดต](/th/install/updating)
- [ถอนการติดตั้ง](/th/install/uninstall)
