---
read_when:
    - คุณต้องการการติดตั้งที่ทำซ้ำได้และย้อนกลับได้
    - คุณใช้งาน Nix/NixOS/Home Manager อยู่แล้ว
    - คุณต้องการตรึงเวอร์ชันทุกอย่างและจัดการแบบประกาศเชิงนโยบาย
summary: ติดตั้ง OpenClaw แบบประกาศด้วย Nix
title: Nix
x-i18n:
    generated_at: "2026-07-12T16:19:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

ติดตั้ง OpenClaw แบบประกาศด้วย **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** ซึ่งเป็นโมดูล Home Manager อย่างเป็นทางการที่มาพร้อมทุกสิ่งที่จำเป็น

<Info>
รีโพซิทอรี [nix-openclaw](https://github.com/openclaw/nix-openclaw) เป็นแหล่งข้อมูลหลักสำหรับการติดตั้งด้วย Nix หน้านี้เป็นภาพรวมโดยย่อ
</Info>

## สิ่งที่คุณจะได้รับ

- Gateway + แอป macOS + เครื่องมือ (whisper, spotify, กล้อง) โดยตรึงเวอร์ชันทั้งหมด
- บริการ launchd ที่ยังคงทำงานหลังรีบูต
- ระบบ Plugin พร้อมการกำหนดค่าแบบประกาศ
- ย้อนกลับได้ทันที: `home-manager switch --rollback`

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง Determinate Nix">
    หากยังไม่ได้ติดตั้ง Nix ให้ทำตามคำแนะนำของ [โปรแกรมติดตั้ง Determinate Nix](https://github.com/DeterminateSystems/nix-installer)
  </Step>
  <Step title="สร้าง flake ภายในเครื่อง">
    ใช้เทมเพลตที่ออกแบบโดยให้เอเจนต์เป็นหลักจากรีโพซิทอรี nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # คัดลอก templates/agent-first/flake.nix จากรีโพซิทอรี nix-openclaw
    ```
  </Step>
  <Step title="กำหนดค่าข้อมูลลับ">
    ตั้งค่าโทเค็นบอตรับส่งข้อความและคีย์ API ของผู้ให้บริการโมเดล ไฟล์ข้อความธรรมดาที่ `~/.secrets/` ใช้งานได้ดี
  </Step>
  <Step title="กรอกตัวยึดตำแหน่งในเทมเพลตและสลับการกำหนดค่า">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="ตรวจสอบ">
    ยืนยันว่าบริการ launchd กำลังทำงานและบอตของคุณตอบกลับข้อความ
  </Step>
</Steps>

ดูตัวเลือกทั้งหมดของโมดูลและตัวอย่างได้ใน [README ของ nix-openclaw](https://github.com/openclaw/nix-openclaw)

## ลักษณะการทำงานขณะรันในโหมด Nix

เมื่อตั้งค่า `OPENCLAW_NIX_MODE=1` (ตั้งค่าอัตโนมัติเมื่อใช้ nix-openclaw) OpenClaw จะเข้าสู่โหมดที่ให้ผลลัพธ์แน่นอนสำหรับการติดตั้งที่จัดการด้วย Nix แพ็กเกจ Nix อื่นสามารถตั้งค่าโหมดเดียวกันได้ โดย nix-openclaw เป็นการใช้งานอ้างอิงอย่างเป็นทางการ

คุณสามารถตั้งค่าด้วยตนเองได้เช่นกัน:

```bash
export OPENCLAW_NIX_MODE=1
```

บน macOS แอป GUI จะไม่สืบทอดตัวแปรสภาพแวดล้อมของเชลล์ ให้เปิดใช้โหมด Nix ผ่าน `defaults` แทน:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### สิ่งที่เปลี่ยนแปลงในโหมด Nix

- ปิดใช้กระบวนการติดตั้งอัตโนมัติและการแก้ไขตัวเอง
- `openclaw.json` จะถือว่าแก้ไขไม่ได้ ค่าเริ่มต้นที่ได้มาระหว่างการเริ่มต้นระบบจะมีผลเฉพาะขณะรัน และตัวเขียนการกำหนดค่า (การตั้งค่า การเริ่มต้นใช้งาน `openclaw update` ที่มีการแก้ไข การติดตั้ง/อัปเดต/ถอนการติดตั้ง/เปิดใช้ Plugin, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set`) จะปฏิเสธการแก้ไขไฟล์
- ให้แก้ไขแหล่งที่มา Nix แทน สำหรับ nix-openclaw ให้ใช้ [การเริ่มต้นอย่างรวดเร็ว](https://github.com/openclaw/nix-openclaw#quick-start) ที่ออกแบบโดยให้เอเจนต์เป็นหลัก และตั้งค่าการกำหนดค่าภายใต้ `programs.openclaw.config` หรือ `instances.<name>.config`
- การขาดการขึ้นต่อกันจะแสดงข้อความวิธีแก้ไขเฉพาะสำหรับ Nix
- UI จะแสดงแบนเนอร์โหมด Nix แบบอ่านอย่างเดียว

### พาธการกำหนดค่าและสถานะ

OpenClaw อ่านการกำหนดค่า JSON5 จาก `OPENCLAW_CONFIG_PATH` และจัดเก็บข้อมูลที่แก้ไขได้ใน `OPENCLAW_STATE_DIR` เมื่อใช้ Nix ให้ตั้งค่าตัวแปรเหล่านี้อย่างชัดเจนไปยังตำแหน่งที่จัดการโดย Nix เพื่อให้สถานะขณะรันและการกำหนดค่าอยู่นอกพื้นที่จัดเก็บที่แก้ไขไม่ได้

| ตัวแปร                 | ค่าเริ่มต้น                              |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### การค้นหา PATH ของบริการ

บริการ Gateway ของ launchd/systemd จะค้นหาไบนารีในโปรไฟล์ Nix โดยอัตโนมัติ เพื่อให้ Plugin และเครื่องมือที่เรียกใช้ไฟล์ปฏิบัติการที่ติดตั้งด้วย `nix` ผ่านเชลล์ทำงานได้โดยไม่ต้องตั้งค่า PATH ด้วยตนเอง:

- เมื่อตั้งค่า `NIX_PROFILES` ระบบจะเพิ่มทุกรายการไปยัง PATH ของบริการโดยให้รายการจากขวาไปซ้ายมีลำดับความสำคัญสูงขึ้น (ตรงกับลำดับความสำคัญของเชลล์ Nix: รายการขวาสุดมีผลเหนือกว่า)
- เมื่อไม่ได้ตั้งค่า `NIX_PROFILES` ระบบจะเพิ่ม `~/.nix-profile/bin` เป็นทางเลือกสำรอง

ลักษณะการทำงานนี้ใช้กับทั้งสภาพแวดล้อมบริการ launchd บน macOS และ systemd บน Linux

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    โมดูล Home Manager ที่เป็นแหล่งข้อมูลหลักและคู่มือการตั้งค่าฉบับสมบูรณ์
  </Card>
  <Card title="ตัวช่วยสร้างการตั้งค่า" href="/th/start/wizard" icon="wand-magic-sparkles">
    คำแนะนำทีละขั้นตอนสำหรับการตั้งค่าผ่าน CLI โดยไม่ใช้ Nix
  </Card>
  <Card title="Docker" href="/th/install/docker" icon="docker">
    การตั้งค่าแบบคอนเทนเนอร์เพื่อเป็นทางเลือกที่ไม่ใช้ Nix
  </Card>
  <Card title="การอัปเดต" href="/th/install/updating" icon="arrow-up-right-from-square">
    การอัปเดตการติดตั้งที่จัดการด้วย Home Manager ควบคู่ไปกับแพ็กเกจ
  </Card>
</CardGroup>
