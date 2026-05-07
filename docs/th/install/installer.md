---
read_when:
    - คุณต้องการทำความเข้าใจ `openclaw.ai/install.sh`
    - คุณต้องการทำให้การติดตั้งเป็นอัตโนมัติ (CI / แบบไม่มีส่วนติดต่อผู้ใช้)
    - คุณต้องการติดตั้งจาก checkout ของ GitHub
summary: วิธีการทำงานของสคริปต์ติดตั้ง (install.sh, install-cli.sh, install.ps1), แฟล็ก และการทำงานอัตโนมัติ
title: กลไกภายในของตัวติดตั้ง
x-i18n:
    generated_at: "2026-05-07T13:21:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a62720526e2a5ffc94555f77e7e806d63768b849a9491b60f6fdc9cf070eed2f
    source_path: install/installer.md
    workflow: 16
---

OpenClaw มีสคริปต์ติดตั้งให้มาสามรายการ โดยให้บริการจาก `openclaw.ai`

| สคริปต์                           | แพลตฟอร์ม            | หน้าที่                                                                                                      |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw ผ่าน npm (ค่าเริ่มต้น) หรือ git และสามารถเรียกใช้ onboarding ได้      |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | ติดตั้ง Node + OpenClaw ลงใน prefix ภายในเครื่อง (`~/.openclaw`) ด้วยโหมด npm หรือ git checkout ไม่ต้องใช้ root |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw ผ่าน npm (ค่าเริ่มต้น) หรือ git และสามารถเรียกใช้ onboarding ได้      |

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
หากติดตั้งสำเร็จแต่ไม่พบ `openclaw` ใน terminal ใหม่ ให้ดู [การแก้ปัญหา Node.js](/th/install/node#troubleshooting)
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
แนะนำสำหรับการติดตั้งแบบโต้ตอบส่วนใหญ่บน macOS/Linux/WSL
</Tip>

### ลำดับการทำงาน (install.sh)

<Steps>
  <Step title="Detect OS">
    รองรับ macOS และ Linux (รวมถึง WSL) หากตรวจพบ macOS จะติดตั้ง Homebrew หากยังไม่มี
  </Step>
  <Step title="Ensure Node.js 24 by default">
    ตรวจสอบเวอร์ชัน Node และติดตั้ง Node 24 หากจำเป็น (Homebrew บน macOS, สคริปต์ตั้งค่า NodeSource บน Linux apt/dnf/yum) OpenClaw ยังรองรับ Node 22 LTS ซึ่งปัจจุบันคือ `22.16+` เพื่อความเข้ากันได้
  </Step>
  <Step title="Ensure Git">
    ติดตั้ง Git หากยังไม่มี
  </Step>
  <Step title="Install OpenClaw">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้ง npm แบบ global
    - วิธี `git`: clone/update repo, ติดตั้ง deps ด้วย pnpm, build จากนั้นติดตั้ง wrapper ที่ `~/.local/bin/openclaw`

  </Step>
  <Step title="Post-install tasks">
    - refresh บริการ gateway ที่โหลดอยู่แบบ best-effort (`openclaw gateway install --force` แล้ว restart)
    - เรียกใช้ `openclaw doctor --non-interactive` เมื่อ upgrade และติดตั้งด้วย git (best effort)
    - พยายามเริ่ม onboarding เมื่อเหมาะสม (มี TTY, ไม่ได้ปิด onboarding และการตรวจสอบ bootstrap/config ผ่าน)
    - ตั้งค่าเริ่มต้น `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### การตรวจหา source checkout

หากเรียกใช้ภายใน checkout ของ OpenClaw (`package.json` + `pnpm-workspace.yaml`) สคริปต์จะเสนอ:

- ใช้ checkout (`git`) หรือ
- ใช้การติดตั้งแบบ global (`npm`)

หากไม่มี TTY และไม่ได้ตั้งค่าวิธีติดตั้งไว้ ระบบจะใช้ค่าเริ่มต้นเป็น `npm` และแสดงคำเตือน

สคริปต์จะ exit ด้วย code `2` เมื่อเลือกวิธีไม่ถูกต้องหรือค่า `--install-method` ไม่ถูกต้อง

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
  <Tab title="GitHub main via npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
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

| Flag                                  | คำอธิบาย                                                  |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | เลือกวิธีติดตั้ง (ค่าเริ่มต้น: `npm`) Alias: `--method`   |
| `--npm`                               | ทางลัดสำหรับวิธี npm                                      |
| `--git`                               | ทางลัดสำหรับวิธี git Alias: `--github`                    |
| `--version <version\|dist-tag\|spec>` | เวอร์ชัน npm, dist-tag หรือ package spec (ค่าเริ่มต้น: `latest`) |
| `--beta`                              | ใช้ beta dist-tag หากมี มิฉะนั้น fallback ไปที่ `latest`  |
| `--git-dir <path>`                    | ไดเรกทอรี checkout (ค่าเริ่มต้น: `~/openclaw`) Alias: `--dir` |
| `--no-git-update`                     | ข้าม `git pull` สำหรับ checkout ที่มีอยู่แล้ว             |
| `--no-prompt`                         | ปิด prompts                                               |
| `--no-onboard`                        | ข้าม onboarding                                           |
| `--onboard`                           | เปิดใช้ onboarding                                        |
| `--dry-run`                           | พิมพ์การดำเนินการโดยไม่ใช้การเปลี่ยนแปลงจริง             |
| `--verbose`                           | เปิดใช้ output สำหรับ debug (`set -x`, log ระดับ notice ของ npm) |
| `--help`                              | แสดงวิธีใช้ (`-h`)                                        |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variable                                                | คำอธิบาย                                   |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | วิธีติดตั้ง                                  |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | เวอร์ชัน npm, dist-tag หรือ package spec     |
| `OPENCLAW_BETA=0\|1`                                    | ใช้ beta หากมี                               |
| `OPENCLAW_GIT_DIR=<path>`                               | ไดเรกทอรี checkout                           |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | เปิด/ปิดการ update git                       |
| `OPENCLAW_NO_PROMPT=1`                                  | ปิด prompts                                  |
| `OPENCLAW_NO_ONBOARD=1`                                 | ข้าม onboarding                              |
| `OPENCLAW_DRY_RUN=1`                                    | โหมด dry run                                 |
| `OPENCLAW_VERBOSE=1`                                    | โหมด debug                                   |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | ระดับ log ของ npm                            |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | ควบคุมพฤติกรรม sharp/libvips (ค่าเริ่มต้น: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
ออกแบบมาสำหรับสภาพแวดล้อมที่คุณต้องการให้ทุกอย่างอยู่ภายใต้ prefix ภายในเครื่อง
(ค่าเริ่มต้น `~/.openclaw`) และไม่มี dependency ของ Node ระดับระบบ รองรับการติดตั้งด้วย npm
เป็นค่าเริ่มต้น พร้อมทั้งการติดตั้งแบบ git-checkout ภายใต้ลำดับ prefix เดียวกัน
</Info>

### ลำดับการทำงาน (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    ดาวน์โหลด tarball ของ Node LTS ที่รองรับและปักหมุดไว้ (เวอร์ชันฝังอยู่ในสคริปต์และอัปเดตแยกต่างหาก) ไปยัง `<prefix>/tools/node-v<version>` และตรวจสอบ SHA-256
  </Step>
  <Step title="Ensure Git">
    หากไม่มี Git จะพยายามติดตั้งผ่าน apt/dnf/yum บน Linux หรือ Homebrew บน macOS
  </Step>
  <Step title="Install OpenClaw under prefix">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้งภายใต้ prefix ด้วย npm จากนั้นเขียน wrapper ไปที่ `<prefix>/bin/openclaw`
    - วิธี `git`: clone/update checkout (ค่าเริ่มต้น `~/openclaw`) และยังเขียน wrapper ไปที่ `<prefix>/bin/openclaw`

  </Step>
  <Step title="Refresh loaded gateway service">
    หากบริการ gateway โหลดจาก prefix เดียวกันอยู่แล้ว สคริปต์จะเรียกใช้
    `openclaw gateway install --force` จากนั้น `openclaw gateway restart` และ
    probe สถานะ gateway health แบบ best-effort
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

| Flag                        | คำอธิบาย                                                                        |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | prefix สำหรับติดตั้ง (ค่าเริ่มต้น: `~/.openclaw`)                              |
| `--install-method npm\|git` | เลือกวิธีติดตั้ง (ค่าเริ่มต้น: `npm`) Alias: `--method`                        |
| `--npm`                     | ทางลัดสำหรับวิธี npm                                                            |
| `--git`, `--github`         | ทางลัดสำหรับวิธี git                                                            |
| `--git-dir <path>`          | ไดเรกทอรี Git checkout (ค่าเริ่มต้น: `~/openclaw`) Alias: `--dir`              |
| `--version <ver>`           | เวอร์ชัน OpenClaw หรือ dist-tag (ค่าเริ่มต้น: `latest`)                        |
| `--node-version <ver>`      | เวอร์ชัน Node (ค่าเริ่มต้น: `22.22.0`)                                          |
| `--json`                    | ส่งออก event แบบ NDJSON                                                         |
| `--onboard`                 | เรียกใช้ `openclaw onboard` หลังติดตั้ง                                         |
| `--no-onboard`              | ข้าม onboarding (ค่าเริ่มต้น)                                                   |
| `--set-npm-prefix`          | บน Linux บังคับ prefix ของ npm เป็น `~/.npm-global` หาก prefix ปัจจุบันเขียนไม่ได้ |
| `--help`                    | แสดงวิธีใช้ (`-h`)                                                              |

  </Accordion>

  <Accordion title="Environment variables reference">

| ตัวแปร                                      | คำอธิบาย                                      |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | คำนำหน้าการติดตั้ง                            |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | วิธีการติดตั้ง                                |
| `OPENCLAW_VERSION=<ver>`                    | เวอร์ชัน OpenClaw หรือ dist-tag               |
| `OPENCLAW_NODE_VERSION=<ver>`               | เวอร์ชัน Node                                 |
| `OPENCLAW_GIT_DIR=<path>`                   | ไดเรกทอรี Git checkout สำหรับการติดตั้งด้วย git |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | เปิด/ปิดการอัปเดต git สำหรับ checkout ที่มีอยู่ |
| `OPENCLAW_NO_ONBOARD=1`                     | ข้ามการเริ่มต้นใช้งาน                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | ระดับบันทึกของ npm                            |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | ควบคุมพฤติกรรม sharp/libvips (ค่าเริ่มต้น: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### โฟลว์ (install.ps1)

<Steps>
  <Step title="ตรวจสอบให้แน่ใจว่ามีสภาพแวดล้อม PowerShell + Windows">
    ต้องใช้ PowerShell 5+.
  </Step>
  <Step title="ตรวจสอบให้แน่ใจว่ามี Node.js 24 เป็นค่าเริ่มต้น">
    หากไม่มี จะพยายามติดตั้งผ่าน winget จากนั้น Chocolatey แล้วจึง Scoop ส่วน Node 22 LTS ซึ่งปัจจุบันคือ `22.16+` ยังรองรับอยู่เพื่อความเข้ากันได้
  </Step>
  <Step title="ติดตั้ง OpenClaw">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้ง npm แบบ global โดยใช้ `-Tag` ที่เลือก เรียกจากไดเรกทอรี temp ของตัวติดตั้งที่เขียนได้ เพื่อให้ shell ที่เปิดในโฟลเดอร์ที่มีการป้องกัน เช่น `C:\` ยังทำงานได้
    - วิธี `git`: clone/update repo, install/build ด้วย pnpm และติดตั้ง wrapper ที่ `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="งานหลังการติดตั้ง">
    - เพิ่มไดเรกทอรี bin ที่จำเป็นลงใน PATH ของผู้ใช้เมื่อทำได้
    - รีเฟรชบริการ Gateway ที่โหลดอยู่แบบ best-effort (`openclaw gateway install --force` จากนั้น restart)
    - รัน `openclaw doctor --non-interactive` เมื่ออัปเกรดและเมื่อติดตั้งด้วย git (best effort)

  </Step>
  <Step title="จัดการความล้มเหลว">
    การติดตั้งด้วย `iwr ... | iex` และ scriptblock จะรายงานข้อผิดพลาดแบบ terminating error โดยไม่ปิดเซสชัน PowerShell ปัจจุบัน การติดตั้งโดยตรงด้วย `powershell -File` / `pwsh -File` ยังคงออกด้วยสถานะ non-zero สำหรับ automation
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
  <Tab title="GitHub main ผ่าน npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="ไดเรกทอรี git แบบกำหนดเอง">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Dry run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debug trace">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="อ้างอิง flags">

| Flag                        | คำอธิบาย                                                  |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | วิธีการติดตั้ง (ค่าเริ่มต้น: `npm`)                        |
| `-Tag <tag\|version\|spec>` | npm dist-tag, เวอร์ชัน หรือ package spec (ค่าเริ่มต้น: `latest`) |
| `-GitDir <path>`            | ไดเรกทอรี checkout (ค่าเริ่มต้น: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | ข้ามการเริ่มต้นใช้งาน                                     |
| `-NoGitUpdate`              | ข้าม `git pull`                                           |
| `-DryRun`                   | พิมพ์เฉพาะการดำเนินการ                                    |

  </Accordion>

  <Accordion title="อ้างอิงตัวแปรสภาพแวดล้อม">

| ตัวแปร                             | คำอธิบาย              |
| ---------------------------------- | --------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | วิธีการติดตั้ง        |
| `OPENCLAW_GIT_DIR=<path>`          | ไดเรกทอรี checkout   |
| `OPENCLAW_NO_ONBOARD=1`            | ข้ามการเริ่มต้นใช้งาน |
| `OPENCLAW_GIT_UPDATE=0`            | ปิดใช้งาน git pull    |
| `OPENCLAW_DRY_RUN=1`               | โหมด dry run          |

  </Accordion>
</AccordionGroup>

<Note>
หากใช้ `-InstallMethod git` และไม่มี Git สคริปต์จะออกและพิมพ์ลิงก์ Git for Windows
</Note>

---

## CI และ automation

ใช้ flags/env vars แบบ non-interactive เพื่อให้การรันคาดเดาได้

<Tabs>
  <Tab title="install.sh (npm แบบ non-interactive)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git แบบ non-interactive)">
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
    ต้องใช้ Git สำหรับวิธีติดตั้งแบบ `git` สำหรับการติดตั้งแบบ `npm` ยังคงตรวจสอบ/ติดตั้ง Git เพื่อหลีกเลี่ยงความล้มเหลว `spawn git ENOENT` เมื่อ dependency ใช้ URL แบบ git
  </Accordion>

  <Accordion title="ทำไม npm จึงเจอ EACCES บน Linux?">
    การตั้งค่า Linux บางแบบชี้ npm global prefix ไปยัง path ที่ root เป็นเจ้าของ `install.sh` สามารถเปลี่ยน prefix เป็น `~/.npm-global` และเพิ่ม PATH exports ต่อท้ายไฟล์ shell rc ได้ (เมื่อไฟล์เหล่านั้นมีอยู่)
  </Accordion>

  <Accordion title="ปัญหา sharp/libvips">
    สคริปต์ตั้งค่าเริ่มต้น `SHARP_IGNORE_GLOBAL_LIBVIPS=1` เพื่อหลีกเลี่ยงไม่ให้ sharp build โดยอิงกับ system libvips หากต้องการ override:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    ติดตั้ง Git for Windows เปิด PowerShell ใหม่ แล้วรันตัวติดตั้งอีกครั้ง
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    รัน `npm config get prefix` และเพิ่มไดเรกทอรีนั้นลงใน PATH ของผู้ใช้ของคุณ (บน Windows ไม่จำเป็นต้องมี suffix `\bin`) จากนั้นเปิด PowerShell ใหม่
  </Accordion>

  <Accordion title="Windows: วิธีดูเอาต์พุตตัวติดตั้งแบบ verbose">
    ปัจจุบัน `install.ps1` ยังไม่มีสวิตช์ `-Verbose`
    ใช้ PowerShell tracing สำหรับการวินิจฉัยระดับสคริปต์:

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
