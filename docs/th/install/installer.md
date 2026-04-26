---
read_when:
    - คุณต้องการทำความเข้าใจ `openclaw.ai/install.sh`
    - คุณต้องการทำให้การติดตั้งเป็นอัตโนมัติ (CI / headless)
    - คุณต้องการติดตั้งจาก GitHub checkout
summary: วิธีการทำงานของสคริปต์ติดตั้ง (`install.sh`, `install-cli.sh`, `install.ps1`), flags และระบบอัตโนมัติ
title: รายละเอียดภายในของตัวติดตั้ง
x-i18n:
    generated_at: "2026-04-26T11:34:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f932fb3713e8ecfa75215b05d7071b3b75e6d1135d7c326313739f294023e2
    source_path: install/installer.md
    workflow: 15
---

OpenClaw มาพร้อมสคริปต์ติดตั้งสามตัว ซึ่งให้บริการจาก `openclaw.ai`

| สคริปต์                             | แพลตฟอร์ม            | สิ่งที่ทำ                                                                                                      |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw ผ่าน npm (ค่าเริ่มต้น) หรือ git และสามารถรัน onboarding ได้           |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | ติดตั้ง Node + OpenClaw ลงใน local prefix (`~/.openclaw`) ด้วยโหมด npm หรือ git checkout โดยไม่ต้องใช้ root |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw ผ่าน npm (ค่าเริ่มต้น) หรือ git และสามารถรัน onboarding ได้           |

## คำสั่งแบบรวดเร็ว

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
หากติดตั้งสำเร็จแต่ไม่พบ `openclaw` ในเทอร์มินัลใหม่ ดู [การแก้ปัญหา Node.js](/th/install/node#troubleshooting)
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
แนะนำสำหรับการติดตั้งแบบโต้ตอบส่วนใหญ่บน macOS/Linux/WSL
</Tip>

### โฟลว์ (install.sh)

<Steps>
  <Step title="ตรวจจับระบบปฏิบัติการ">
    รองรับ macOS และ Linux (รวม WSL) หากตรวจพบว่าเป็น macOS จะติดตั้ง Homebrew หากยังไม่มี
  </Step>
  <Step title="ตรวจให้มี Node.js 24 เป็นค่าเริ่มต้น">
    ตรวจสอบเวอร์ชัน Node และติดตั้ง Node 24 หากจำเป็น (ใช้ Homebrew บน macOS และใช้สคริปต์ตั้งค่า NodeSource บน Linux apt/dnf/yum) OpenClaw ยังรองรับ Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` เพื่อความเข้ากันได้
  </Step>
  <Step title="ตรวจให้มี Git">
    ติดตั้ง Git หากยังไม่มี
  </Step>
  <Step title="ติดตั้ง OpenClaw">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้ง npm แบบ global
    - วิธี `git`: clone/update repo, ติดตั้ง dependencies ด้วย pnpm, build แล้วติดตั้ง wrapper ที่ `~/.local/bin/openclaw`
  </Step>
  <Step title="งานหลังการติดตั้ง">
    - รีเฟรช gateway service ที่โหลดอยู่แบบ best-effort (`openclaw gateway install --force` แล้วจึง restart)
    - รัน `openclaw doctor --non-interactive` ในกรณีอัปเกรดและติดตั้งแบบ git (best effort)
    - พยายามรัน onboarding เมื่อเหมาะสม (มี TTY, ไม่ได้ปิด onboarding และผ่านการตรวจ bootstrap/config)
    - ตั้งค่าเริ่มต้น `SHARP_IGNORE_GLOBAL_LIBVIPS=1`
  </Step>
</Steps>

### การตรวจจับ source checkout

หากรันภายใน checkout ของ OpenClaw (`package.json` + `pnpm-workspace.yaml`) สคริปต์จะเสนอให้:

- ใช้ checkout (`git`) หรือ
- ใช้การติดตั้งแบบ global (`npm`)

หากไม่มี TTY และไม่ได้ตั้งวิธีติดตั้งไว้ มันจะใช้ `npm` เป็นค่าเริ่มต้นและแสดงคำเตือน

สคริปต์จะออกด้วยรหัส `2` หากเลือกวิธีไม่ถูกต้องหรือระบุค่า `--install-method` ไม่ถูกต้อง

### ตัวอย่าง (install.sh)

<Tabs>
  <Tab title="ค่าเริ่มต้น">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="ข้าม onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="ติดตั้งแบบ Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main ผ่าน npm">
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
  <Accordion title="ข้อมูลอ้างอิง flags">

| Flag                                  | คำอธิบาย                                                   |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | เลือกวิธีติดตั้ง (ค่าเริ่มต้น: `npm`) Alias: `--method`     |
| `--npm`                               | ทางลัดสำหรับวิธี npm                                        |
| `--git`                               | ทางลัดสำหรับวิธี git Alias: `--github`                      |
| `--version <version\|dist-tag\|spec>` | เวอร์ชัน npm, dist-tag หรือ package spec (ค่าเริ่มต้น: `latest`) |
| `--beta`                              | ใช้ beta dist-tag หากมี ไม่เช่นนั้น fallback ไป `latest`    |
| `--git-dir <path>`                    | ไดเรกทอรี checkout (ค่าเริ่มต้น: `~/openclaw`) Alias: `--dir` |
| `--no-git-update`                     | ข้าม `git pull` สำหรับ checkout ที่มีอยู่แล้ว              |
| `--no-prompt`                         | ปิด prompts                                                |
| `--no-onboard`                        | ข้าม onboarding                                            |
| `--onboard`                           | เปิด onboarding                                            |
| `--dry-run`                           | แสดงการกระทำโดยไม่เปลี่ยนแปลงจริง                         |
| `--verbose`                           | เปิดเอาต์พุต debug (`set -x`, npm logs ระดับ notice)        |
| `--help`                              | แสดงวิธีใช้ (`-h`)                                         |

  </Accordion>

  <Accordion title="ข้อมูลอ้างอิงตัวแปรสภาพแวดล้อม">

| Variable                                                | คำอธิบาย                                      |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | วิธีติดตั้ง                                    |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | เวอร์ชัน npm, dist-tag หรือ package spec       |
| `OPENCLAW_BETA=0\|1`                                    | ใช้ beta หากมี                                |
| `OPENCLAW_GIT_DIR=<path>`                               | ไดเรกทอรี checkout                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | เปิด/ปิดการอัปเดต git                         |
| `OPENCLAW_NO_PROMPT=1`                                  | ปิด prompts                                   |
| `OPENCLAW_NO_ONBOARD=1`                                 | ข้าม onboarding                               |
| `OPENCLAW_DRY_RUN=1`                                    | โหมด dry run                                  |
| `OPENCLAW_VERBOSE=1`                                    | โหมด debug                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | ระดับ log ของ npm                             |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | ควบคุมพฤติกรรมของ sharp/libvips (ค่าเริ่มต้น: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
ออกแบบมาสำหรับสภาพแวดล้อมที่คุณต้องการให้ทุกอย่างอยู่ภายใต้ local prefix
(ค่าเริ่มต้น `~/.openclaw`) และไม่ต้องพึ่งพา Node ของระบบ รองรับการติดตั้งแบบ npm
เป็นค่าเริ่มต้น รวมถึงการติดตั้งแบบ git-checkout ภายใต้โฟลว์ prefix เดียวกัน
</Info>

### โฟลว์ (install-cli.sh)

<Steps>
  <Step title="ติดตั้ง Node runtime แบบ local">
    ดาวน์โหลด Node LTS เวอร์ชันที่ปักหมุดและรองรับ (เวอร์ชันถูกฝังไว้ในสคริปต์และอัปเดตแยกอิสระ) ไปที่ `<prefix>/tools/node-v<version>` และตรวจสอบ SHA-256
  </Step>
  <Step title="ตรวจให้มี Git">
    หากไม่มี Git จะพยายามติดตั้งผ่าน apt/dnf/yum บน Linux หรือ Homebrew บน macOS
  </Step>
  <Step title="ติดตั้ง OpenClaw ภายใต้ prefix">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้งภายใต้ prefix ด้วย npm แล้วเขียน wrapper ไปที่ `<prefix>/bin/openclaw`
    - วิธี `git`: clone/update checkout (ค่าเริ่มต้น `~/openclaw`) และยังคงเขียน wrapper ไปที่ `<prefix>/bin/openclaw`
  </Step>
  <Step title="รีเฟรช loaded gateway service">
    หากมี gateway service ที่โหลดอยู่แล้วจาก prefix เดียวกัน สคริปต์จะรัน
    `openclaw gateway install --force` จากนั้น `openclaw gateway restart` และ
    probe สุขภาพของ gateway แบบ best-effort
  </Step>
</Steps>

### ตัวอย่าง (install-cli.sh)

<Tabs>
  <Tab title="ค่าเริ่มต้น">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="กำหนด prefix + version เอง">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="ติดตั้งแบบ Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="ผลลัพธ์ JSON สำหรับระบบอัตโนมัติ">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="รัน onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="ข้อมูลอ้างอิง flags">

| Flag                        | คำอธิบาย                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | install prefix (ค่าเริ่มต้น: `~/.openclaw`)                                     |
| `--install-method npm\|git` | เลือกวิธีติดตั้ง (ค่าเริ่มต้น: `npm`) Alias: `--method`                         |
| `--npm`                     | ทางลัดสำหรับวิธี npm                                                           |
| `--git`, `--github`         | ทางลัดสำหรับวิธี git                                                           |
| `--git-dir <path>`          | ไดเรกทอรี git checkout (ค่าเริ่มต้น: `~/openclaw`) Alias: `--dir`              |
| `--version <ver>`           | เวอร์ชัน OpenClaw หรือ dist-tag (ค่าเริ่มต้น: `latest`)                        |
| `--node-version <ver>`      | เวอร์ชัน Node (ค่าเริ่มต้น: `22.22.0`)                                         |
| `--json`                    | ส่งออกเหตุการณ์แบบ NDJSON                                                     |
| `--onboard`                 | รัน `openclaw onboard` หลังการติดตั้ง                                          |
| `--no-onboard`              | ข้าม onboarding (ค่าเริ่มต้น)                                                  |
| `--set-npm-prefix`          | บน Linux บังคับตั้ง npm prefix เป็น `~/.npm-global` หาก prefix ปัจจุบันเขียนไม่ได้ |
| `--help`                    | แสดงวิธีใช้ (`-h`)                                                             |

  </Accordion>

  <Accordion title="ข้อมูลอ้างอิงตัวแปรสภาพแวดล้อม">

| Variable                                    | คำอธิบาย                                    |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | install prefix                                |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | วิธีติดตั้ง                                    |
| `OPENCLAW_VERSION=<ver>`                    | เวอร์ชัน OpenClaw หรือ dist-tag               |
| `OPENCLAW_NODE_VERSION=<ver>`               | เวอร์ชัน Node                                  |
| `OPENCLAW_GIT_DIR=<path>`                   | ไดเรกทอรี git checkout สำหรับการติดตั้งแบบ git |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | เปิด/ปิดการอัปเดต git สำหรับ checkouts ที่มีอยู่ |
| `OPENCLAW_NO_ONBOARD=1`                     | ข้าม onboarding                               |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | ระดับ log ของ npm                             |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | ควบคุมพฤติกรรมของ sharp/libvips (ค่าเริ่มต้น: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### โฟลว์ (install.ps1)

<Steps>
  <Step title="ตรวจให้มี PowerShell + สภาพแวดล้อม Windows">
    ต้องใช้ PowerShell 5 ขึ้นไป
  </Step>
  <Step title="ตรวจให้มี Node.js 24 เป็นค่าเริ่มต้น">
    หากยังไม่มี จะพยายามติดตั้งผ่าน winget จากนั้น Chocolatey และ Scoop ตามลำดับ Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` ยังคงรองรับเพื่อความเข้ากันได้
  </Step>
  <Step title="ติดตั้ง OpenClaw">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้ง npm แบบ global โดยใช้ `-Tag` ที่เลือก
    - วิธี `git`: clone/update repo, ติดตั้ง/build ด้วย pnpm และติดตั้ง wrapper ที่ `%USERPROFILE%\.local\bin\openclaw.cmd`
  </Step>
  <Step title="งานหลังการติดตั้ง">
    - เพิ่มไดเรกทอรี bin ที่จำเป็นลงใน PATH ของผู้ใช้เมื่อทำได้
    - รีเฟรช gateway service ที่โหลดอยู่แบบ best-effort (`openclaw gateway install --force` แล้วจึง restart)
    - รัน `openclaw doctor --non-interactive` ในกรณีอัปเกรดและติดตั้งแบบ git (best effort)
  </Step>
  <Step title="จัดการความล้มเหลว">
    การติดตั้งแบบ `iwr ... | iex` และแบบ scriptblock จะรายงาน terminating error โดยไม่ปิด PowerShell session ปัจจุบัน ส่วนการติดตั้งแบบ `powershell -File` / `pwsh -File` โดยตรงจะยังออกด้วยรหัส non-zero สำหรับระบบอัตโนมัติ
  </Step>
</Steps>

### ตัวอย่าง (install.ps1)

<Tabs>
  <Tab title="ค่าเริ่มต้น">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="ติดตั้งแบบ Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main ผ่าน npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="กำหนดไดเรกทอรี git เอง">
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
    # install.ps1 ยังไม่มีแฟลก -Verbose โดยเฉพาะในตอนนี้
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="ข้อมูลอ้างอิง flags">

| Flag                        | คำอธิบาย                                                   |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | วิธีติดตั้ง (ค่าเริ่มต้น: `npm`)                           |
| `-Tag <tag\|version\|spec>` | npm dist-tag, เวอร์ชัน หรือ package spec (ค่าเริ่มต้น: `latest`) |
| `-GitDir <path>`            | ไดเรกทอรี checkout (ค่าเริ่มต้น: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | ข้าม onboarding                                            |
| `-NoGitUpdate`              | ข้าม `git pull`                                            |
| `-DryRun`                   | แสดงการกระทำเท่านั้น                                       |

  </Accordion>

  <Accordion title="ข้อมูลอ้างอิงตัวแปรสภาพแวดล้อม">

| Variable                           | คำอธิบาย        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | วิธีติดตั้ง     |
| `OPENCLAW_GIT_DIR=<path>`          | ไดเรกทอรี checkout |
| `OPENCLAW_NO_ONBOARD=1`            | ข้าม onboarding    |
| `OPENCLAW_GIT_UPDATE=0`            | ปิด `git pull`   |
| `OPENCLAW_DRY_RUN=1`               | โหมด dry run       |

  </Accordion>
</AccordionGroup>

<Note>
หากใช้ `-InstallMethod git` และไม่มี Git สคริปต์จะออกและพิมพ์ลิงก์ Git for Windows
</Note>

---

## CI และระบบอัตโนมัติ

ใช้ flags/env vars แบบไม่โต้ตอบเพื่อให้การรันคาดเดาได้

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
  <Tab title="install.ps1 (ข้าม onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="ทำไมจึงต้องใช้ Git?">
    Git จำเป็นสำหรับวิธีติดตั้ง `git` ส่วนการติดตั้งแบบ `npm` ก็ยังมีการตรวจ/ติดตั้ง Git เพื่อหลีกเลี่ยงข้อผิดพลาด `spawn git ENOENT` เมื่อ dependencies ใช้ git URLs
  </Accordion>

  <Accordion title="ทำไม npm ถึงเจอ EACCES บน Linux?">
    บางระบบ Linux ชี้ npm global prefix ไปยัง paths ที่ root เป็นเจ้าของ `install.sh` สามารถสลับ prefix ไปเป็น `~/.npm-global` และเพิ่ม PATH exports ลงในไฟล์ rc ของ shell ได้ (เมื่อไฟล์เหล่านั้นมีอยู่)
  </Accordion>

  <Accordion title="ปัญหา sharp/libvips">
    สคริปต์จะตั้ง `SHARP_IGNORE_GLOBAL_LIBVIPS=1` เป็นค่าเริ่มต้นเพื่อหลีกเลี่ยงไม่ให้ sharp build กับ system libvips หากต้องการ override:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    ติดตั้ง Git for Windows, เปิด PowerShell ใหม่ แล้วรันตัวติดตั้งอีกครั้ง
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    รัน `npm config get prefix` แล้วเพิ่มไดเรกทอรีนั้นลงใน PATH ของผู้ใช้ (บน Windows ไม่ต้องมี suffix `\bin`) จากนั้นเปิด PowerShell ใหม่
  </Accordion>

  <Accordion title="Windows: จะดูเอาต์พุตตัวติดตั้งแบบ verbose ได้อย่างไร">
    ตอนนี้ `install.ps1` ยังไม่มีสวิตช์ `-Verbose`
    ใช้ PowerShell tracing สำหรับการวินิจฉัยระดับสคริปต์:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="ไม่พบ openclaw หลังติดตั้ง">
    โดยปกติเป็นปัญหา PATH ดู [การแก้ปัญหา Node.js](/th/install/node#troubleshooting)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [การอัปเดต](/th/install/updating)
- [ถอนการติดตั้ง](/th/install/uninstall)
