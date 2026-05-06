---
read_when:
    - คุณต้องติดตั้ง Node.js ก่อนติดตั้ง OpenClaw
    - คุณติดตั้ง OpenClaw แล้ว แต่ไม่พบคำสั่ง `openclaw`
    - npm install -g ล้มเหลวเนื่องจากปัญหาสิทธิ์หรือ PATH
summary: ติดตั้งและกำหนดค่า Node.js สำหรับ OpenClaw - ข้อกำหนดด้านเวอร์ชัน ตัวเลือกการติดตั้ง และการแก้ไขปัญหา PATH
title: Node.js
x-i18n:
    generated_at: "2026-05-06T09:20:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa445f3b9e6472af755c2fc4c3f08b6134e308f290ab750549411f12d8d247db
    source_path: install/node.md
    workflow: 16
---

OpenClaw ต้องใช้ **Node 22.14 หรือใหม่กว่า** **Node 24 เป็นรันไทม์เริ่มต้นและที่แนะนำ** สำหรับการติดตั้ง, CI และเวิร์กโฟลว์การเผยแพร่ Node 22 ยังคงรองรับผ่านสาย LTS ที่ยังใช้งานอยู่ [สคริปต์ติดตั้ง](/th/install#alternative-install-methods) จะตรวจจับและติดตั้ง Node โดยอัตโนมัติ - หน้านี้มีไว้สำหรับเมื่อคุณต้องการตั้งค่า Node ด้วยตนเองและตรวจสอบให้แน่ใจว่าทุกอย่างเชื่อมต่อถูกต้อง (เวอร์ชัน, PATH, การติดตั้งแบบ global)

## ตรวจสอบเวอร์ชันของคุณ

```bash
node -v
```

หากคำสั่งนี้แสดง `v24.x.x` หรือสูงกว่า แสดงว่าคุณกำลังใช้ค่าเริ่มต้นที่แนะนำ หากแสดง `v22.14.x` หรือสูงกว่า แสดงว่าคุณอยู่บนเส้นทาง Node 22 LTS ที่รองรับ แต่เรายังแนะนำให้อัปเกรดเป็น Node 24 เมื่อสะดวก หากยังไม่ได้ติดตั้ง Node หรือเวอร์ชันเก่าเกินไป ให้เลือกวิธีติดตั้งด้านล่าง

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

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
  ตัวจัดการเวอร์ชันช่วยให้คุณสลับระหว่างเวอร์ชันของ Node ได้ง่าย ตัวเลือกยอดนิยม:

- [**fnm**](https://github.com/Schniz/fnm) - รวดเร็ว ใช้งานได้ข้ามแพลตฟอร์ม
- [**nvm**](https://github.com/nvm-sh/nvm) - ใช้กันอย่างแพร่หลายบน macOS/Linux
- [**mise**](https://mise.jdx.dev/) - รองรับหลายภาษา (Node, Python, Ruby ฯลฯ)

ตัวอย่างด้วย fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  ตรวจสอบให้แน่ใจว่าตัวจัดการเวอร์ชันของคุณถูกเริ่มต้นในไฟล์เริ่มต้นของเชลล์ (`~/.zshrc` หรือ `~/.bashrc`) หากไม่ได้ทำไว้ อาจไม่พบ `openclaw` ในเซสชันเทอร์มินัลใหม่ เพราะ PATH จะไม่มีไดเรกทอรี bin ของ Node
  </Warning>
</Accordion>

## การแก้ไขปัญหา

### `openclaw: command not found`

กรณีนี้แทบจะหมายความเสมอว่าไดเรกทอรี global bin ของ npm ไม่ได้อยู่ใน PATH ของคุณ

<Steps>
  <Step title="Find your global npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Check if it's on your PATH">
    ```bash
    echo "$PATH"
    ```

    มองหา `<npm-prefix>/bin` (macOS/Linux) หรือ `<npm-prefix>` (Windows) ในผลลัพธ์

  </Step>
  <Step title="Add it to your shell startup file">
    <Tabs>
      <Tab title="macOS / Linux">
        เพิ่มลงใน `~/.zshrc` หรือ `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        จากนั้นเปิดเทอร์มินัลใหม่ (หรือเรียกใช้ `rehash` ใน zsh / `hash -r` ใน bash)
      </Tab>
      <Tab title="Windows">
        เพิ่มผลลัพธ์ของ `npm prefix -g` ลงใน PATH ของระบบผ่าน Settings → System → Environment Variables
      </Tab>
    </Tabs>

  </Step>
</Steps>

### ข้อผิดพลาดสิทธิ์ใน `npm install -g` (Linux)

หากคุณเห็นข้อผิดพลาด `EACCES` ให้เปลี่ยน global prefix ของ npm ไปยังไดเรกทอรีที่ผู้ใช้เขียนได้:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

เพิ่มบรรทัด `export PATH=...` ลงใน `~/.bashrc` หรือ `~/.zshrc` เพื่อให้มีผลถาวร

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install) - วิธีติดตั้งทั้งหมด
- [การอัปเดต](/th/install/updating) - การทำให้ OpenClaw เป็นเวอร์ชันล่าสุด
- [เริ่มต้นใช้งาน](/th/start/getting-started) - ขั้นตอนแรกหลังติดตั้ง
