---
read_when:
    - คุณต้องติดตั้ง Node.js ก่อนติดตั้ง OpenClaw
    - คุณติดตั้ง OpenClaw แล้ว แต่ `openclaw` แสดงข้อผิดพลาดว่าไม่พบคำสั่ง
    - npm install -g ล้มเหลวเนื่องจากปัญหาสิทธิ์หรือ PATH
summary: ติดตั้งและกำหนดค่า Node.js สำหรับ OpenClaw - ข้อกำหนดเวอร์ชัน ตัวเลือกการติดตั้ง และการแก้ปัญหา PATH
title: Node.js
x-i18n:
    generated_at: "2026-06-27T17:44:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90a2461458fd9995df264753259a3297b8aa316f9e4efd8290e527cbb46fc4e3
    source_path: install/node.md
    workflow: 16
---

OpenClaw ต้องใช้ **Node 22.19 หรือใหม่กว่า** **Node 24 เป็น runtime เริ่มต้นและที่แนะนำ** สำหรับการติดตั้ง, CI และเวิร์กโฟลว์การเผยแพร่ Node 22 ยังรองรับผ่านสาย LTS ที่ยังใช้งานอยู่ [สคริปต์ติดตั้ง](/th/install#alternative-install-methods) จะตรวจจับและติดตั้ง Node โดยอัตโนมัติ - หน้านี้มีไว้สำหรับกรณีที่คุณต้องการตั้งค่า Node ด้วยตัวเองและตรวจสอบให้แน่ใจว่าทุกอย่างเชื่อมต่อถูกต้อง (เวอร์ชัน, PATH, การติดตั้งแบบ global)

## ตรวจสอบเวอร์ชันของคุณ

```bash
node -v
```

หากคำสั่งนี้พิมพ์ `v24.x.x` หรือสูงกว่า แสดงว่าคุณใช้ค่าเริ่มต้นที่แนะนำแล้ว หากพิมพ์ `v22.19.x` หรือสูงกว่า แสดงว่าคุณอยู่บนเส้นทาง Node 22 LTS ที่รองรับ แต่เรายังแนะนำให้อัปเกรดเป็น Node 24 เมื่อสะดวก หากยังไม่ได้ติดตั้ง Node หรือเวอร์ชันเก่าเกินไป ให้เลือกวิธีติดตั้งด้านล่าง

## ติดตั้ง Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (แนะนำ):

    ```bash
    brew install node
    ```

    หรือดาวน์โหลดตัวติดตั้ง macOS จาก [nodejs.org](https://nodejs.org/)

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    หรือใช้ตัวจัดการเวอร์ชัน (ดูด้านล่าง)

  </Tab>
  <Tab title="Windows">
    **winget** (แนะนำ):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    หรือดาวน์โหลดตัวติดตั้ง Windows จาก [nodejs.org](https://nodejs.org/)

  </Tab>
</Tabs>

<Accordion title="การใช้ตัวจัดการเวอร์ชัน (nvm, fnm, mise, asdf)">
  ตัวจัดการเวอร์ชันช่วยให้คุณสลับระหว่างเวอร์ชัน Node ได้ง่าย ตัวเลือกยอดนิยม:

- [**fnm**](https://github.com/Schniz/fnm) - รวดเร็ว ใช้ได้ข้ามแพลตฟอร์ม
- [**nvm**](https://github.com/nvm-sh/nvm) - ใช้กันอย่างแพร่หลายบน macOS/Linux
- [**mise**](https://mise.jdx.dev/) - หลายภาษา (Node, Python, Ruby ฯลฯ)

ตัวอย่างด้วย fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  ตรวจสอบให้แน่ใจว่าตัวจัดการเวอร์ชันของคุณถูกเริ่มต้นในไฟล์เริ่มต้นของเชลล์ (`~/.zshrc` หรือ `~/.bashrc`) หากไม่เป็นเช่นนั้น อาจไม่พบ `openclaw` ในเซสชันเทอร์มินัลใหม่ เพราะ PATH จะไม่รวมไดเรกทอรี bin ของ Node
  </Warning>
</Accordion>

## การแก้ไขปัญหา

### `openclaw: command not found`

เกือบทุกครั้งหมายความว่าไดเรกทอรี bin แบบ global ของ npm ไม่ได้อยู่ใน PATH ของคุณ

<Steps>
  <Step title="ค้นหา prefix แบบ global ของ npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="ตรวจสอบว่าอยู่ใน PATH ของคุณหรือไม่">
    ```bash
    echo "$PATH"
    ```

    มองหา `<npm-prefix>/bin` (macOS/Linux) หรือ `<npm-prefix>` (Windows) ในผลลัพธ์

  </Step>
  <Step title="เพิ่มลงในไฟล์เริ่มต้นของเชลล์ของคุณ">
    <Tabs>
      <Tab title="macOS / Linux">
        เพิ่มลงใน `~/.zshrc` หรือ `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        จากนั้นเปิดเทอร์มินัลใหม่ (หรือรัน `rehash` ใน zsh / `hash -r` ใน bash)
      </Tab>
      <Tab title="Windows">
        เพิ่มผลลัพธ์ของ `npm prefix -g` ลงใน PATH ของระบบผ่าน Settings → System → Environment Variables
      </Tab>
    </Tabs>

  </Step>
</Steps>

### ข้อผิดพลาดเกี่ยวกับสิทธิ์ใน `npm install -g` (Linux)

หากคุณเห็นข้อผิดพลาด `EACCES` ให้เปลี่ยน prefix แบบ global ของ npm เป็นไดเรกทอรีที่ผู้ใช้เขียนได้:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

เพิ่มบรรทัด `export PATH=...` ลงใน `~/.bashrc` หรือ `~/.zshrc` ของคุณเพื่อให้มีผลถาวร

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install) - วิธีติดตั้งทั้งหมด
- [การอัปเดต](/th/install/updating) - การทำให้ OpenClaw เป็นเวอร์ชันล่าสุดอยู่เสมอ
- [เริ่มต้นใช้งาน](/th/start/getting-started) - ขั้นตอนแรกหลังติดตั้ง
