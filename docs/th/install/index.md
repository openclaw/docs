---
read_when:
    - คุณต้องใช้วิธีติดตั้งอื่นนอกเหนือจากคู่มือเริ่มต้นใช้งานแบบรวดเร็ว
    - คุณต้องการปรับใช้กับแพลตฟอร์มคลาวด์
    - คุณต้องอัปเดต ย้ายข้อมูล หรือถอนการติดตั้ง
summary: ติดตั้ง OpenClaw - สคริปต์ตัวติดตั้ง, npm/pnpm/bun, จากซอร์ส, Docker และอื่นๆ
title: ติดตั้ง
x-i18n:
    generated_at: "2026-06-27T17:44:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## ข้อกำหนดของระบบ

- **Node 24** (แนะนำ) หรือ Node 22.19+ - สคริปต์ติดตั้งจัดการส่วนนี้ให้อัตโนมัติ
- **macOS, Linux หรือ Windows** - ผู้ใช้ Windows สามารถเริ่มด้วยแอป Windows Hub แบบเนทีฟ, ตัวติดตั้ง CLI ผ่าน PowerShell หรือ WSL2 Gateway ดู [Windows](/th/platforms/windows)
- ต้องใช้ `pnpm` เฉพาะเมื่อคุณ build จากซอร์สเท่านั้น

## แนะนำ: สคริปต์ติดตั้ง

วิธีติดตั้งที่เร็วที่สุด ระบบจะตรวจจับ OS ของคุณ ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw และเริ่ม onboarding

<Note>
ผู้ใช้เดสก์ท็อป Windows สามารถติดตั้งแอปคู่หู [Windows Hub](/th/platforms/windows#recommended-windows-hub) แบบเนทีฟได้ด้วย ซึ่งรวมการตั้งค่า สถานะในถาดระบบ แชต โหมด node และโหมด MCP ภายในเครื่อง
</Note>

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

หากต้องการติดตั้งโดยไม่เรียกใช้ onboarding:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

สำหรับ flags ทั้งหมดและตัวเลือก CI/automation ดู [รายละเอียดภายในของตัวติดตั้ง](/th/install/installer)

## วิธีติดตั้งทางเลือก

### ตัวติดตั้งแบบ local prefix (`install-cli.sh`)

ใช้วิธีนี้เมื่อคุณต้องการเก็บ OpenClaw และ Node ไว้ใต้ local prefix เช่น
`~/.openclaw` โดยไม่ต้องพึ่งพาการติดตั้ง Node ระดับทั้งระบบ:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

รองรับการติดตั้งผ่าน npm โดยค่าเริ่มต้น รวมถึงการติดตั้งจาก git checkout ภายใต้ flow
prefix เดียวกัน อ้างอิงฉบับเต็ม: [รายละเอียดภายในของตัวติดตั้ง](/th/install/installer#install-clish)

ติดตั้งไว้แล้วหรือไม่? สลับระหว่างการติดตั้งแบบ package และ git ด้วย
`openclaw update --channel dev` และ `openclaw update --channel stable` ดู
[การอัปเดต](/th/install/updating#switch-between-npm-and-git-installs)

### npm, pnpm หรือ bun

หากคุณจัดการ Node เองอยู่แล้ว:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    ตัวติดตั้งที่โฮสต์ไว้จะล้างตัวกรองความใหม่ของ npm เช่น `min-release-age`
    สำหรับการติดตั้ง package OpenClaw หากคุณติดตั้งด้วย npm เอง นโยบาย
    npm ของคุณยังคงมีผล
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm ต้องการการอนุมัติอย่างชัดเจนสำหรับ package ที่มีสคริปต์ build ให้เรียกใช้ `pnpm approve-builds -g` หลังการติดตั้งครั้งแรก
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    รองรับ Bun สำหรับเส้นทางการติดตั้ง CLI แบบ global สำหรับ runtime ของ Gateway นั้น Node ยังคงเป็น daemon runtime ที่แนะนำ
    </Note>

  </Tab>
</Tabs>

### จากซอร์ส

สำหรับผู้มีส่วนร่วม หรือผู้ที่ต้องการเรียกใช้จาก checkout ภายในเครื่อง:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

หรือข้ามการ link แล้วใช้ `pnpm openclaw ...` จากภายใน repo ดู [การตั้งค่า](/th/start/setup) สำหรับ workflow การพัฒนาแบบเต็ม

### ติดตั้งจาก GitHub main checkout

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Containers และตัวจัดการ package

<CardGroup cols={2}>
  <Card title="Docker" href="/th/install/docker" icon="container">
    การ deploy แบบ containerized หรือ headless
  </Card>
  <Card title="Podman" href="/th/install/podman" icon="container">
    ทางเลือก container แบบ rootless แทน Docker
  </Card>
  <Card title="Nix" href="/th/install/nix" icon="snowflake">
    การติดตั้งแบบ declarative ผ่าน Nix flake
  </Card>
  <Card title="Ansible" href="/th/install/ansible" icon="server">
    การจัดเตรียม fleet แบบอัตโนมัติ
  </Card>
  <Card title="Bun" href="/th/install/bun" icon="zap">
    การใช้งานเฉพาะ CLI ผ่าน Bun runtime
  </Card>
</CardGroup>

## ตรวจสอบการติดตั้ง

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

หากคุณต้องการให้จัดการการเริ่มทำงานหลังติดตั้ง:

- macOS: LaunchAgent ผ่าน `openclaw onboard --install-daemon` หรือ `openclaw gateway install`
- Linux/WSL2: บริการ systemd ระดับ user ผ่านคำสั่งเดียวกัน
- Native Windows: ใช้ Scheduled Task ก่อน พร้อม fallback เป็นรายการ login ในโฟลเดอร์ Startup ต่อผู้ใช้ หากการสร้าง task ถูกปฏิเสธ

## การโฮสต์และการ deploy

Deploy OpenClaw บนเซิร์ฟเวอร์คลาวด์หรือ VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/th/vps">
    Linux VPS ใดก็ได้
  </Card>
  <Card title="Docker VM" href="/th/install/docker-vm-runtime">
    ขั้นตอน Docker ที่ใช้ร่วมกัน
  </Card>
  <Card title="Kubernetes" href="/th/install/kubernetes">
    การ deploy K8s
  </Card>
  <Card title="Fly.io" href="/th/install/fly">
    Deploy บน Fly.io
  </Card>
  <Card title="Hetzner" href="/th/install/hetzner">
    การ deploy Hetzner
  </Card>
  <Card title="GCP" href="/th/install/gcp">
    การ deploy Google Cloud
  </Card>
  <Card title="Azure" href="/th/install/azure">
    การ deploy Azure
  </Card>
  <Card title="Railway" href="/th/install/railway">
    การ deploy Railway
  </Card>
  <Card title="Render" href="/th/install/render">
    การ deploy Render
  </Card>
  <Card title="Northflank" href="/th/install/northflank">
    การ deploy Northflank
  </Card>
</CardGroup>

## อัปเดต ย้ายข้อมูล หรือถอนการติดตั้ง

<CardGroup cols={3}>
  <Card title="Updating" href="/th/install/updating" icon="refresh-cw">
    ทำให้ OpenClaw เป็นเวอร์ชันล่าสุดเสมอ
  </Card>
  <Card title="Migrating" href="/th/install/migrating" icon="arrow-right">
    ย้ายไปยังเครื่องใหม่
  </Card>
  <Card title="Uninstall" href="/th/install/uninstall" icon="trash-2">
    ลบ OpenClaw ออกทั้งหมด
  </Card>
</CardGroup>

## การแก้ไขปัญหา: ไม่พบ `openclaw`

หากการติดตั้งสำเร็จ แต่ไม่พบ `openclaw` ในเทอร์มินัลของคุณ:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

หาก `$(npm prefix -g)/bin` ไม่อยู่ใน `$PATH` ของคุณ ให้เพิ่มลงในไฟล์เริ่มต้นของ shell (`~/.zshrc` หรือ `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

จากนั้นเปิดเทอร์มินัลใหม่ ดู [การตั้งค่า Node](/th/install/node) สำหรับรายละเอียดเพิ่มเติม
