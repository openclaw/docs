---
read_when:
    - คุณต้องการการติดตั้งที่ทำซ้ำได้และสามารถย้อนกลับได้
    - คุณกำลังใช้ Nix/NixOS/Home Manager อยู่แล้ว
    - คุณต้องการตรึงทุกอย่างไว้และจัดการแบบประกาศ
summary: ติดตั้ง OpenClaw ด้วย Nix ในรูปแบบเชิงประกาศ
title: Nix
x-i18n:
    generated_at: "2026-05-06T09:20:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

ติดตั้ง OpenClaw แบบ declarative ด้วย **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - โมดูล Home Manager แบบครบเครื่อง

<Info>
Repo [nix-openclaw](https://github.com/openclaw/nix-openclaw) คือแหล่งข้อมูลหลักสำหรับการติดตั้ง Nix หน้านี้เป็นภาพรวมแบบย่อ
</Info>

## สิ่งที่คุณจะได้รับ

- Gateway + แอป macOS + เครื่องมือ (whisper, spotify, cameras) -- ทั้งหมดถูกตรึงเวอร์ชัน
- บริการ launchd ที่ยังทำงานต่อหลังรีบูต
- ระบบ Plugin พร้อมการกำหนดค่าแบบ declarative
- ย้อนกลับได้ทันที: `home-manager switch --rollback`

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง Determinate Nix">
    หากยังไม่ได้ติดตั้ง Nix ให้ทำตามคำแนะนำของ [ตัวติดตั้ง Determinate Nix](https://github.com/DeterminateSystems/nix-installer)
  </Step>
  <Step title="สร้าง flake ภายในเครื่อง">
    ใช้เทมเพลตแบบ agent-first จาก repo nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="กำหนดค่า secrets">
    ตั้งค่าโทเค็นบอตรับส่งข้อความและคีย์ API ของผู้ให้บริการโมเดล ไฟล์ธรรมดาที่ `~/.secrets/` ใช้งานได้ดี
  </Step>
  <Step title="เติม placeholders ในเทมเพลตและสลับไปใช้">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="ตรวจสอบ">
    ยืนยันว่าบริการ launchd กำลังทำงานอยู่และบอตของคุณตอบกลับข้อความ
  </Step>
</Steps>

ดู [README ของ nix-openclaw](https://github.com/openclaw/nix-openclaw) สำหรับตัวเลือกโมดูลและตัวอย่างทั้งหมด

## พฤติกรรมรันไทม์ในโหมด Nix

เมื่อมีการตั้งค่า `OPENCLAW_NIX_MODE=1` (อัตโนมัติเมื่อใช้ nix-openclaw) OpenClaw จะเข้าสู่โหมด deterministic ที่ปิดใช้งานโฟลว์การติดตั้งอัตโนมัติ

คุณยังสามารถตั้งค่าด้วยตนเองได้เช่นกัน:

```bash
export OPENCLAW_NIX_MODE=1
```

บน macOS แอป GUI จะไม่สืบทอดตัวแปรสภาพแวดล้อมของ shell โดยอัตโนมัติ ให้เปิดใช้งานโหมด Nix ผ่าน defaults แทน:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### สิ่งที่เปลี่ยนแปลงในโหมด Nix

- โฟลว์การติดตั้งอัตโนมัติและการแก้ไขตัวเองถูกปิดใช้งาน
- dependency ที่ขาดหายจะแสดงข้อความแก้ไขปัญหาเฉพาะสำหรับ Nix
- UI แสดงแบนเนอร์โหมด Nix แบบอ่านอย่างเดียว

### พาธ config และ state

OpenClaw อ่าน config JSON5 จาก `OPENCLAW_CONFIG_PATH` และเก็บข้อมูลที่เปลี่ยนแปลงได้ใน `OPENCLAW_STATE_DIR` เมื่อรันภายใต้ Nix ให้ตั้งค่าเหล่านี้อย่างชัดเจนไปยังตำแหน่งที่ Nix จัดการ เพื่อให้ state และ config ของรันไทม์อยู่นอก store ที่เปลี่ยนแปลงไม่ได้

| ตัวแปร                 | ค่าเริ่มต้น                              |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### การค้นพบ PATH ของบริการ

บริการ Gateway แบบ launchd/systemd จะค้นหาไบนารีใน Nix-profile โดยอัตโนมัติ เพื่อให้
plugins และเครื่องมือที่ shell out ไปยัง executable ที่ติดตั้งด้วย `nix` ทำงานได้โดยไม่ต้อง
ตั้งค่า PATH ด้วยตนเอง:

- เมื่อตั้งค่า `NIX_PROFILES` แล้ว แต่ละรายการจะถูกเพิ่มเข้าไปใน PATH ของบริการโดยมีลำดับความสำคัญ
  จากขวาไปซ้าย (ตรงกับลำดับความสำคัญของ Nix shell - ค่าขวาสุดชนะ)
- เมื่อไม่ได้ตั้งค่า `NIX_PROFILES` ระบบจะเพิ่ม `~/.nix-profile/bin` เป็น fallback

สิ่งนี้ใช้กับสภาพแวดล้อมบริการทั้ง macOS launchd และ Linux systemd

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    โมดูล Home Manager ที่เป็นแหล่งข้อมูลหลักและคู่มือตั้งค่าฉบับเต็ม
  </Card>
  <Card title="วิซาร์ดตั้งค่า" href="/th/start/wizard" icon="wand-magic-sparkles">
    คำแนะนำทีละขั้นตอนสำหรับการตั้งค่า CLI แบบไม่ใช้ Nix
  </Card>
  <Card title="Docker" href="/th/install/docker" icon="docker">
    การตั้งค่าแบบ containerized เป็นทางเลือกที่ไม่ใช้ Nix
  </Card>
  <Card title="การอัปเดต" href="/th/install/updating" icon="arrow-up-right-from-square">
    การอัปเดตการติดตั้งที่ Home Manager จัดการควบคู่ไปกับ package
  </Card>
</CardGroup>
