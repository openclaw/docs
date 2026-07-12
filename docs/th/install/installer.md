---
read_when:
    - คุณต้องการทำความเข้าใจ `openclaw.ai/install.sh`
    - คุณต้องการทำให้การติดตั้งเป็นอัตโนมัติ (CI / แบบไม่มีส่วนติดต่อผู้ใช้)
    - คุณต้องการติดตั้งจากสำเนาเช็กเอาต์ของ GitHub
summary: วิธีการทำงานของสคริปต์ติดตั้ง (install.sh, install-cli.sh, install.ps1), แฟล็ก และระบบอัตโนมัติ
title: กลไกภายในของตัวติดตั้ง
x-i18n:
    generated_at: "2026-07-12T16:18:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw มาพร้อมสคริปต์ติดตั้งสามรายการ ซึ่งให้บริการจาก `openclaw.ai`

| สคริปต์                           | แพลตฟอร์ม            | การทำงาน                                                                                                      |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw ผ่าน npm (ค่าเริ่มต้น) หรือ git และสามารถเริ่มกระบวนการตั้งค่าได้       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | ติดตั้ง Node + OpenClaw ลงในคำนำหน้าภายในเครื่อง (`~/.openclaw`) ผ่าน npm หรือ git โดยไม่ต้องใช้สิทธิ์ root |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw ผ่าน npm (ค่าเริ่มต้น) หรือ git และสามารถเริ่มกระบวนการตั้งค่าได้       |

ทั้งสามรายการรองรับ Node **22.19+, 23.11+ หรือ 24+** โดย Node 24 เป็นเป้าหมายเริ่มต้นสำหรับการติดตั้งใหม่

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

### ลำดับการทำงาน (install.sh)

<Steps>
  <Step title="ตรวจหาระบบปฏิบัติการ">
    รองรับ macOS และ Linux (รวมถึง WSL)
  </Step>
  <Step title="ตรวจสอบให้มี Node.js 24 เป็นค่าเริ่มต้น">
    ตรวจสอบเวอร์ชัน Node และติดตั้ง Node 24 หากจำเป็น (ใช้ Homebrew บน macOS และสคริปต์ตั้งค่า NodeSource บน Linux ที่ใช้ apt/dnf/yum) บน macOS จะติดตั้ง Homebrew เฉพาะเมื่อตัวติดตั้งจำเป็นต้องใช้สำหรับ Node หรือ Git เท่านั้น Node 22.19+ และ 23.11+ ยังคงรองรับเพื่อความเข้ากันได้
    บน Alpine/musl Linux ตัวติดตั้งจะใช้แพ็กเกจ apk แทน NodeSource โดยคลังแพ็กเกจ Alpine ที่กำหนดค่าไว้ต้องมี Node เวอร์ชันที่รองรับ (Alpine 3.21 หรือใหม่กว่า ณ เวลาที่เขียน)
  </Step>
  <Step title="ตรวจสอบให้มี Git">
    ติดตั้ง Git หากยังไม่มีโดยใช้ตัวจัดการแพ็กเกจที่ตรวจพบ รวมถึง Homebrew บน macOS และ apk บน Alpine
  </Step>
  <Step title="ติดตั้ง OpenClaw">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้ง npm แบบส่วนกลาง
    - วิธี `git`: โคลน/อัปเดตที่เก็บ ติดตั้งการขึ้นต่อกันด้วย pnpm สร้างโปรแกรม แล้วติดตั้งตัวห่อคำสั่งที่ `~/.local/bin/openclaw`

  </Step>
  <Step title="งานหลังการติดตั้ง">
    - ระบุตำแหน่งไบนารี `openclaw` ที่เพิ่งติดตั้งเพื่อใช้กับคำสั่งถัดไป
    - สำหรับการติดตั้งที่ยังไม่ได้กำหนดค่า จะเริ่มกระบวนการตั้งค่าก่อนตรวจสอบด้วย doctor หรือทดสอบ Gateway เมื่อใช้ `--no-onboard` หรือไม่มี TTY ระบบจะแสดงคำสั่งสำหรับตั้งค่าให้เสร็จในภายหลัง
    - สำหรับการติดตั้งที่กำหนดค่าแล้ว จะรีเฟรชและเริ่มบริการ Gateway ที่โหลดอยู่ใหม่แบบพยายามให้ดีที่สุด แล้วเรียกใช้ doctor การอัปเกรดจะอัปเดต Plugin เมื่อทำได้ หรือแสดงคำสั่งสำหรับดำเนินการด้วยตนเองในการทำงานแบบไม่มีส่วนติดต่อที่เปิดใช้พรอมต์
    - เมื่อเรียกใช้ `--verify` ระบบจะตรวจสอบเวอร์ชันที่ติดตั้ง และตรวจสอบสถานะ Gateway เฉพาะเมื่อมีการกำหนดค่าแล้วเท่านั้น

  </Step>
</Steps>

### การตรวจหาสำเนาซอร์สโค้ด

หากเรียกใช้ภายในสำเนาซอร์สโค้ด OpenClaw (`package.json` + `pnpm-workspace.yaml`) สคริปต์จะเสนอตัวเลือกดังนี้:

- ใช้สำเนาซอร์สโค้ด (`git`) หรือ
- ใช้การติดตั้งแบบส่วนกลาง (`npm`)

หากไม่มี TTY และไม่ได้กำหนดวิธีติดตั้ง ระบบจะใช้ `npm` เป็นค่าเริ่มต้นและแสดงคำเตือน

สคริปต์จะจบการทำงานด้วยรหัส `2` เมื่อเลือกวิธีไม่ถูกต้องหรือระบุค่า `--install-method` ไม่ถูกต้อง

### ตัวอย่าง (install.sh)

<Tabs>
  <Tab title="ค่าเริ่มต้น">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="ข้ามกระบวนการตั้งค่า">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="ติดตั้งด้วย Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="สำเนาซอร์สโค้ด main จาก GitHub">
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

| แฟล็ก                                  | คำอธิบาย                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | เลือกวิธีติดตั้ง (ค่าเริ่มต้น: `npm`)                                           |
| `--npm`                                 | ทางลัดสำหรับวิธี npm                                                            |
| `--git \| --github`                     | ทางลัดสำหรับวิธี git                                                            |
| `--version <version\|dist-tag\|spec>`   | เวอร์ชัน npm, dist-tag หรือข้อกำหนดแพ็กเกจ (ค่าเริ่มต้น: `latest`)              |
| `--beta`                                | ใช้ dist-tag รุ่นเบต้าหากมี มิฉะนั้นให้ย้อนกลับไปใช้ `latest`                   |
| `--git-dir \| --dir <path>`             | ไดเรกทอรีสำเนาซอร์สโค้ด (ค่าเริ่มต้น: `~/openclaw`)                            |
| `--no-git-update`                       | ข้าม `git pull` สำหรับสำเนาซอร์สโค้ดที่มีอยู่                                   |
| `--no-prompt`                           | ปิดใช้งานพรอมต์                                                                |
| `--no-onboard`                          | ข้ามกระบวนการตั้งค่า                                                           |
| `--onboard`                             | เปิดใช้กระบวนการตั้งค่า                                                        |
| `--verify`                              | เรียกใช้การตรวจสอบเบื้องต้นหลังติดตั้ง (`--version` และสถานะ Gateway หากโหลดอยู่) |
| `--dry-run`                             | แสดงการดำเนินการโดยไม่ใช้การเปลี่ยนแปลง                                        |
| `--verbose`                             | เปิดใช้ผลลัพธ์การดีบัก (`set -x` และบันทึกระดับ notice ของ npm)                 |
| `--help \| -h`                          | แสดงวิธีใช้                                                                     |

  </Accordion>

  <Accordion title="ข้อมูลอ้างอิงตัวแปรสภาพแวดล้อม">

| ตัวแปร                                            | คำอธิบาย                                                                    |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | วิธีติดตั้ง                                                                  |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | เวอร์ชัน npm, dist-tag หรือข้อกำหนดแพ็กเกจ                                  |
| `OPENCLAW_BETA=0\|1`                              | ใช้รุ่นเบต้าหากมี                                                           |
| `OPENCLAW_HOME=<path>`                            | ไดเรกทอรีฐานสำหรับสถานะ OpenClaw และเส้นทางเริ่มต้นของ git/กระบวนการตั้งค่า |
| `OPENCLAW_GIT_DIR=<path>`                         | ไดเรกทอรีสำเนาซอร์สโค้ด                                                     |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | เปิดหรือปิดการอัปเดต git                                                    |
| `OPENCLAW_NO_PROMPT=1`                            | ปิดใช้งานพรอมต์                                                             |
| `OPENCLAW_VERIFY_INSTALL=1`                       | เรียกใช้การตรวจสอบเบื้องต้นหลังติดตั้ง                                      |
| `OPENCLAW_NO_ONBOARD=1`                           | ข้ามกระบวนการตั้งค่า                                                        |
| `OPENCLAW_DRY_RUN=1`                              | โหมดทดลองทำงาน                                                              |
| `OPENCLAW_VERBOSE=1`                              | โหมดดีบัก                                                                   |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | ระดับบันทึกของ npm (ค่าเริ่มต้น: `error` ซึ่งซ่อนข้อความการเลิกสนับสนุนของ npm) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
ออกแบบมาสำหรับสภาพแวดล้อมที่ต้องการเก็บทุกอย่างไว้ภายใต้คำนำหน้าภายในเครื่อง
(ค่าเริ่มต้น `~/.openclaw`) และไม่ต้องพึ่งพา Node ของระบบ รองรับการติดตั้งด้วย npm
เป็นค่าเริ่มต้น รวมถึงการติดตั้งจากสำเนาซอร์สโค้ด git ภายใต้ลำดับการทำงานของคำนำหน้าเดียวกัน
</Info>

### ลำดับการทำงาน (install-cli.sh)

<Steps>
  <Step title="ติดตั้งสภาพแวดล้อมรันไทม์ Node ภายในเครื่อง">
    ดาวน์โหลดไฟล์ tarball ของ Node LTS เวอร์ชันที่รองรับและตรึงไว้ (เวอร์ชันฝังอยู่ในสคริปต์และอัปเดตแยกกัน โดยค่าเริ่มต้นคือ `22.22.2`) ไปยัง `<prefix>/tools/node-v<version>` และตรวจสอบ SHA-256
    บน Alpine/musl Linux ซึ่ง Node ไม่มีไฟล์ tarball ที่เข้ากันได้สำหรับรันไทม์ที่ตรึงไว้ ระบบจะติดตั้ง `nodejs` และ `npm` ด้วย `apk` และเชื่อมโยงรันไทม์นั้นเข้ากับเส้นทางตัวห่อคำสั่งของคำนำหน้า คลังแพ็กเกจ Alpine ต้องมี Node เวอร์ชันที่รองรับ (22.19+, 23.11+ หรือ 24+) ให้ใช้ Alpine 3.21 หรือใหม่กว่าหากคลังแพ็กเกจรุ่นเก่ามีเพียง Node 20 หรือ 21
  </Step>
  <Step title="ตรวจสอบให้มี Git">
    หากไม่มี Git ระบบจะพยายามติดตั้งผ่าน apt/dnf/yum/apk บน Linux หรือ Homebrew บน macOS
  </Step>
  <Step title="ติดตั้ง OpenClaw ภายใต้คำนำหน้า">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้งภายใต้คำนำหน้าด้วย npm แล้วเขียนตัวห่อคำสั่งไปยัง `<prefix>/bin/openclaw`
    - วิธี `git`: โคลน/อัปเดตสำเนาซอร์สโค้ด (ค่าเริ่มต้น `~/openclaw`) และยังคงเขียนตัวห่อคำสั่งไปยัง `<prefix>/bin/openclaw`

  </Step>
  <Step title="รีเฟรชบริการ Gateway ที่โหลดอยู่">
    หากมีบริการ Gateway ที่โหลดจากคำนำหน้าเดียวกันอยู่แล้ว สคริปต์จะเรียกใช้
    `openclaw gateway install --force` จากนั้นเรียกใช้ `openclaw gateway restart` และ
    ทดสอบสถานะ Gateway แบบพยายามให้ดีที่สุด
  </Step>
</Steps>

### ตัวอย่าง (install-cli.sh)

<Tabs>
  <Tab title="ค่าเริ่มต้น">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="คำนำหน้ากำหนดเอง + เวอร์ชัน">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="ติดตั้งด้วย Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="ผลลัพธ์ JSON สำหรับระบบอัตโนมัติ">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="เรียกใช้กระบวนการตั้งค่า">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="ข้อมูลอ้างอิงแฟล็ก">

| แฟล็ก                                   | คำอธิบาย                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| `--prefix <path>`                       | คำนำหน้าพาธการติดตั้ง (ค่าเริ่มต้น: `~/.openclaw`)                                      |
| `--install-method \| --method npm\|git` | เลือกวิธีติดตั้ง (ค่าเริ่มต้น: `npm`)                                                    |
| `--npm`                                 | ทางลัดสำหรับวิธี npm                                                                     |
| `--git \| --github`                     | ทางลัดสำหรับวิธี git                                                                     |
| `--git-dir \| --dir <path>`             | ไดเรกทอรีเช็กเอาต์ Git (ค่าเริ่มต้น: `~/openclaw`)                                      |
| `--version <ver>`                       | เวอร์ชันหรือ dist-tag ของ OpenClaw (ค่าเริ่มต้น: `latest`)                              |
| `--node-version <ver>`                  | เวอร์ชัน Node (ค่าเริ่มต้น: `22.22.2`)                                                   |
| `--json`                                | ส่งออกเหตุการณ์ NDJSON                                                                   |
| `--onboard`                             | เรียกใช้ `openclaw onboard` หลังการติดตั้ง                                               |
| `--no-onboard`                          | ข้ามการเริ่มต้นใช้งาน (ค่าเริ่มต้น)                                                     |
| `--set-npm-prefix`                      | บน Linux บังคับคำนำหน้า npm เป็น `~/.npm-global` หากคำนำหน้าปัจจุบันเขียนไม่ได้         |
| `--help \| -h`                          | แสดงวิธีใช้                                                                               |

  </Accordion>

  <Accordion title="ข้อมูลอ้างอิงตัวแปรสภาพแวดล้อม">

| ตัวแปร                                      | คำอธิบาย                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | คำนำหน้าพาธการติดตั้ง                                                          |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | วิธีติดตั้ง                                                                     |
| `OPENCLAW_VERSION=<ver>`                    | เวอร์ชันหรือ dist-tag ของ OpenClaw                                             |
| `OPENCLAW_NODE_VERSION=<ver>`               | เวอร์ชัน Node                                                                  |
| `OPENCLAW_HOME=<path>`                      | ไดเรกทอรีฐานสำหรับสถานะ OpenClaw และพาธ git/การเริ่มต้นใช้งานเริ่มต้น        |
| `OPENCLAW_GIT_DIR=<path>`                   | ไดเรกทอรีเช็กเอาต์ Git สำหรับการติดตั้งด้วย git                               |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | เปิดหรือปิดการอัปเดต git สำหรับเช็กเอาต์ที่มีอยู่                             |
| `OPENCLAW_NO_ONBOARD=1`                     | ข้ามการเริ่มต้นใช้งาน                                                          |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | ระดับบันทึกของ npm (ค่าเริ่มต้น: `error`)                                     |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` และข้อกำหนดซอร์ส GitHub อื่น ๆ ไม่ใช่เป้าหมาย `--version` ที่ใช้ได้สำหรับการติดตั้งด้วย npm ให้ใช้ `--install-method git --version main` แทน
</Note>

---

<a id="installps1"></a>

## install.ps1

### ลำดับการทำงาน (install.ps1)

<Steps>
  <Step title="ตรวจสอบสภาพแวดล้อม PowerShell + Windows">
    ต้องใช้ PowerShell 5 ขึ้นไป
  </Step>
  <Step title="ตรวจสอบให้มี Node.js 24 โดยค่าเริ่มต้น">
    หากไม่มี สคริปต์จะพยายามติดตั้งผ่าน winget จากนั้น Chocolatey แล้วจึง Scoop หากไม่มีตัวจัดการแพ็กเกจ สคริปต์จะดาวน์โหลดไฟล์ zip ทางการของ Node.js 24 สำหรับ Windows ไปยัง `%LOCALAPPDATA%\OpenClaw\deps\portable-node` และเพิ่มลงใน PATH ของกระบวนการปัจจุบันและผู้ใช้ Node 22.19 ขึ้นไปและ 23.11 ขึ้นไปยังคงรองรับเพื่อความเข้ากันได้
  </Step>
  <Step title="ติดตั้ง OpenClaw">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้ง npm แบบส่วนกลางโดยใช้ `-Tag` ที่เลือก เรียกใช้จากไดเรกทอรีชั่วคราวของตัวติดตั้งที่เขียนได้ เพื่อให้เชลล์ที่เปิดในโฟลเดอร์ที่ได้รับการป้องกัน เช่น `C:\` ยังคงทำงานได้
    - วิธี `git`: โคลน/อัปเดตที่เก็บ ติดตั้ง/บิลด์ด้วย pnpm และติดตั้งตัวห่อคำสั่งที่ `%USERPROFILE%\.local\bin\openclaw.cmd` หากไม่มี Git สคริปต์จะบูตสแตรป MinGit เฉพาะผู้ใช้ภายใต้ `%LOCALAPPDATA%\OpenClaw\deps\portable-git` และเพิ่มลงใน PATH ของกระบวนการปัจจุบันและผู้ใช้

  </Step>
  <Step title="งานหลังการติดตั้ง">
    - เพิ่มไดเรกทอรี bin ที่จำเป็นลงใน PATH ของผู้ใช้เมื่อทำได้
    - รีเฟรชบริการ Gateway ที่โหลดอยู่แบบพยายามให้ดีที่สุด (`openclaw gateway install --force` แล้วรีสตาร์ต)
    - เรียกใช้ `openclaw doctor --non-interactive` เมื่ออัปเกรดและติดตั้งด้วย git (พยายามให้ดีที่สุด)

  </Step>
  <Step title="จัดการความล้มเหลว">
    การติดตั้งด้วย `iwr ... | iex` และ scriptblock จะรายงานข้อผิดพลาดที่ยุติการทำงานโดยไม่ปิดเซสชัน PowerShell ปัจจุบัน ส่วนการติดตั้งโดยตรงด้วย `powershell -File` / `pwsh -File` จะยังคงออกด้วยรหัสที่ไม่ใช่ศูนย์สำหรับระบบอัตโนมัติ
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
  <Tab title="ไดเรกทอรี git กำหนดเอง">
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

| แฟล็ก                       | คำอธิบาย                                                         |
| --------------------------- | ---------------------------------------------------------------- |
| `-InstallMethod npm\|git`   | วิธีติดตั้ง (ค่าเริ่มต้น: `npm`)                                |
| `-Tag <tag\|version\|spec>` | dist-tag, เวอร์ชัน หรือข้อกำหนดแพ็กเกจของ npm (ค่าเริ่มต้น: `latest`) |
| `-GitDir <path>`            | ไดเรกทอรีเช็กเอาต์ (ค่าเริ่มต้น: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | ข้ามการเริ่มต้นใช้งาน                                           |
| `-NoGitUpdate`              | ข้าม `git pull`                                                  |
| `-DryRun`                   | แสดงเฉพาะการดำเนินการ                                           |

  </Accordion>

  <Accordion title="ข้อมูลอ้างอิงตัวแปรสภาพแวดล้อม">

| ตัวแปร                             | คำอธิบาย                 |
| ---------------------------------- | ------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | วิธีติดตั้ง               |
| `OPENCLAW_GIT_DIR=<path>`          | ไดเรกทอรีเช็กเอาต์       |
| `OPENCLAW_NO_ONBOARD=1`            | ข้ามการเริ่มต้นใช้งาน    |
| `OPENCLAW_GIT_UPDATE=0`            | ปิดใช้งาน git pull       |
| `OPENCLAW_DRY_RUN=1`               | โหมดทดลองทำงาน           |

  </Accordion>
</AccordionGroup>

<Note>
หากใช้ `-InstallMethod git` และไม่มี Git สคริปต์จะพยายามบูตสแตรป MinGit เฉพาะผู้ใช้ก่อนแสดงลิงก์ Git for Windows
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
  <Accordion title="เหตุใดจึงต้องใช้ Git">
    วิธีติดตั้งแบบ `git` จำเป็นต้องใช้ Git สำหรับการติดตั้งแบบ `npm` ระบบยังคงตรวจสอบ/ติดตั้ง Git เพื่อหลีกเลี่ยงความล้มเหลว `spawn git ENOENT` เมื่อการขึ้นต่อกันใช้ URL ของ git
  </Accordion>

  <Accordion title="เหตุใด npm จึงพบ EACCES บน Linux">
    การตั้งค่า Linux บางแบบชี้คำนำหน้าส่วนกลางของ npm ไปยังพาธที่ root เป็นเจ้าของ `install.sh` สามารถเปลี่ยนคำนำหน้าเป็น `~/.npm-global` และเพิ่มคำสั่งส่งออก PATH ลงในไฟล์ rc ของเชลล์ (เมื่อมีไฟล์เหล่านั้น)
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    เรียกใช้ตัวติดตั้งอีกครั้งเพื่อให้สามารถบูตสแตรป MinGit เฉพาะผู้ใช้ หรือติดตั้ง Git for Windows แล้วเปิด PowerShell ใหม่
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    เรียกใช้ `npm config get prefix` และเพิ่มไดเรกทอรีนั้นลงใน PATH ของผู้ใช้ (ไม่ต้องมีส่วนต่อท้าย `\bin` บน Windows) แล้วเปิด PowerShell ใหม่
  </Accordion>

  <Accordion title="Windows: วิธีดูผลลัพธ์โดยละเอียดจากตัวติดตั้ง">
    `install.ps1` ไม่มีสวิตช์ `-Verbose`
    ใช้การติดตามของ PowerShell สำหรับการวินิจฉัยระดับสคริปต์:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="ไม่พบ openclaw หลังการติดตั้ง">
    โดยทั่วไปเป็นปัญหาเกี่ยวกับ PATH โปรดดู[การแก้ไขปัญหา Node.js](/th/install/node#troubleshooting)
  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [การอัปเดต](/th/install/updating)
- [การถอนการติดตั้ง](/th/install/uninstall)
