---
read_when:
    - คุณต้องติดตั้ง Node.js ก่อนติดตั้ง OpenClaw
    - คุณติดตั้ง OpenClaw แล้ว แต่ระบบแจ้งว่าไม่พบคำสั่ง `openclaw`
    - '`npm install -g` ล้มเหลวเนื่องจากปัญหาสิทธิ์หรือ `PATH`'
summary: ติดตั้งและกำหนดค่า Node.js สำหรับ OpenClaw — ข้อกำหนดด้านเวอร์ชัน ตัวเลือกการติดตั้ง และการแก้ไขปัญหา PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-12T16:16:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410686b714fe2830a0c6d77a52850eab5720a97747b9579bd730808db23a9dda
    source_path: install/node.md
    workflow: 16
---

OpenClaw ต้องใช้ **Node 22.19+, Node 23.11+ หรือ Node 24+** โดย **Node 24 เป็นรันไทม์เริ่มต้นที่แนะนำ** สำหรับการติดตั้ง, CI และเวิร์กโฟลว์การเผยแพร่ ส่วน Node 22 ยังคงรองรับผ่านสาย LTS ที่ใช้งานอยู่ [สคริปต์ติดตั้ง](/th/install#alternative-install-methods) จะตรวจหาและติดตั้ง Node โดยอัตโนมัติ — ใช้หน้านี้เมื่อต้องการตั้งค่า Node ด้วยตนเอง (เวอร์ชัน, PATH, การติดตั้งแบบส่วนกลาง)

## ตรวจสอบเวอร์ชันของคุณ

```bash
node -v
```

ค่าเริ่มต้นที่แนะนำคือ `v24.x.x` หรือสูงกว่า ส่วนเส้นทาง Node 22 LTS ที่รองรับคือ `v22.19.x` หรือสูงกว่า (อัปเกรดเป็น Node 24 เมื่อสะดวก) ไม่รองรับบิลด์ Node 23 ก่อน `v23.11.0` หากไม่มี Node หรือเวอร์ชันอยู่นอกช่วงที่รองรับ ให้เลือกวิธีติดตั้งด้านล่าง

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
  ตัวจัดการเวอร์ชันช่วยให้คุณสลับระหว่างเวอร์ชันต่าง ๆ ของ Node ได้อย่างง่ายดาย ตัวเลือกยอดนิยม ได้แก่:

- [**fnm**](https://github.com/Schniz/fnm) - รวดเร็วและรองรับหลายแพลตฟอร์ม
- [**nvm**](https://github.com/nvm-sh/nvm) - ใช้กันอย่างแพร่หลายบน macOS/Linux
- [**mise**](https://mise.jdx.dev/) - รองรับหลายภาษา (Node, Python, Ruby เป็นต้น)

ตัวอย่างการใช้ fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  เริ่มต้นตัวจัดการเวอร์ชันในไฟล์เริ่มต้นของเชลล์ (`~/.zshrc` หรือ `~/.bashrc`) หากข้ามขั้นตอนนี้ ระบบอาจไม่พบ `openclaw` ในเซสชันเทอร์มินัลใหม่ เนื่องจาก PATH จะไม่มีไดเรกทอรี bin ของ Node
  </Warning>
</Accordion>

## การแก้ไขปัญหา

### `openclaw: command not found`

กรณีนี้เกือบทุกครั้งหมายความว่าไดเรกทอรี bin ส่วนกลางของ npm ไม่ได้อยู่ใน PATH

<Steps>
  <Step title="ค้นหาคำนำหน้าส่วนกลางของ npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="ตรวจสอบว่าอยู่ใน PATH หรือไม่">
    ```bash
    echo "$PATH"
    ```

    มองหา `<npm-prefix>/bin` (macOS/Linux) หรือ `<npm-prefix>` (Windows) ในผลลัพธ์

  </Step>
  <Step title="เพิ่มลงในไฟล์เริ่มต้นของเชลล์">
    <Tabs>
      <Tab title="macOS / Linux">
        เพิ่มลงใน `~/.zshrc` หรือ `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        จากนั้นเปิดเทอร์มินัลใหม่ (หรือเรียกใช้ `rehash` ใน zsh / `hash -r` ใน bash)
      </Tab>
      <Tab title="Windows">
        เพิ่มผลลัพธ์จาก `npm prefix -g` ลงใน PATH ของระบบผ่าน Settings → System → Environment Variables
      </Tab>
    </Tabs>

  </Step>
</Steps>

### ข้อผิดพลาดเกี่ยวกับสิทธิ์เมื่อใช้ `npm install -g` (Linux)

หากพบข้อผิดพลาด `EACCES` ให้เปลี่ยนคำนำหน้าส่วนกลางของ npm ไปยังไดเรกทอรีที่ผู้ใช้มีสิทธิ์เขียน:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

เพิ่มบรรทัด `export PATH=...` ลงใน `~/.bashrc` หรือ `~/.zshrc` เพื่อให้การตั้งค่านี้มีผลถาวร

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install) - วิธีติดตั้งทั้งหมด
- [การอัปเดต](/th/install/updating) - การทำให้ OpenClaw เป็นเวอร์ชันล่าสุดอยู่เสมอ
- [เริ่มต้นใช้งาน](/th/start/getting-started) - ขั้นตอนแรกหลังการติดตั้ง
