---
read_when:
    - คุณต้องการการติดตั้งที่ทำซ้ำได้และย้อนกลับได้
    - คุณใช้งาน Nix/NixOS/Home Manager อยู่แล้ว
    - คุณต้องการตรึงทุกอย่างไว้และจัดการแบบประกาศ
summary: ติดตั้ง OpenClaw ในรูปแบบเชิงประกาศด้วย Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T17:58:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ติดตั้ง OpenClaw แบบประกาศด้วย **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - โมดูล Home Manager อย่างเป็นทางการที่มาพร้อมทุกอย่างครบถ้วน

<Info>
รีโป [nix-openclaw](https://github.com/openclaw/nix-openclaw) คือแหล่งข้อมูลหลักสำหรับการติดตั้ง Nix หน้านี้เป็นภาพรวมแบบย่อ
</Info>

## สิ่งที่คุณจะได้

- Gateway + แอป macOS + เครื่องมือ (whisper, spotify, cameras) -- ทั้งหมดถูกตรึงเวอร์ชันไว้
- บริการ launchd ที่ยังทำงานต่อหลังรีบูต
- ระบบ Plugin พร้อมการกำหนดค่าแบบประกาศ
- ย้อนกลับได้ทันที: `home-manager switch --rollback`

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง Determinate Nix">
    หากยังไม่ได้ติดตั้ง Nix ให้ทำตามคำแนะนำของ [ตัวติดตั้ง Determinate Nix](https://github.com/DeterminateSystems/nix-installer)
  </Step>
  <Step title="สร้าง flake ภายในเครื่อง">
    ใช้เทมเพลตแบบ agent-first จากรีโป nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="กำหนดค่าความลับ">
    ตั้งค่าโทเค็นบอทรับส่งข้อความและคีย์ API ของผู้ให้บริการโมเดล ไฟล์ข้อความธรรมดาที่ `~/.secrets/` ใช้งานได้ดี
  </Step>
  <Step title="กรอก placeholder ในเทมเพลตและสลับใช้งาน">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="ตรวจสอบ">
    ยืนยันว่าบริการ launchd กำลังทำงานและบอทของคุณตอบกลับข้อความ
  </Step>
</Steps>

ดู [README ของ nix-openclaw](https://github.com/openclaw/nix-openclaw) สำหรับตัวเลือกโมดูลและตัวอย่างทั้งหมด

## พฤติกรรม runtime ของโหมด Nix

เมื่อมีการตั้งค่า `OPENCLAW_NIX_MODE=1` (อัตโนมัติเมื่อใช้ nix-openclaw) OpenClaw จะเข้าสู่โหมดกำหนดแน่นอนสำหรับการติดตั้งที่จัดการด้วย Nix แพ็กเกจ Nix อื่นสามารถตั้งค่าโหมดเดียวกันได้เช่นกัน; nix-openclaw คือข้อมูลอ้างอิงอย่างเป็นทางการ

คุณยังสามารถตั้งค่าด้วยตนเองได้:

```bash
export OPENCLAW_NIX_MODE=1
```

บน macOS แอป GUI จะไม่รับตัวแปรสภาพแวดล้อมของเชลล์โดยอัตโนมัติ ให้เปิดใช้โหมด Nix ผ่าน defaults แทน:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### สิ่งที่เปลี่ยนในโหมด Nix

- โฟลว์ติดตั้งอัตโนมัติและแก้ไขตัวเองถูกปิดใช้งาน
- `openclaw.json` จะถูกถือว่าเปลี่ยนแปลงไม่ได้ ค่าเริ่มต้นที่ได้จากการเริ่มทำงานจะคงอยู่เฉพาะใน runtime และตัวเขียนค่ากำหนด เช่น setup, onboarding, `openclaw update` ที่แก้ไขค่า, การติดตั้ง/อัปเดต/ถอนการติดตั้ง/เปิดใช้ Plugin, `doctor --fix`, `doctor --generate-gateway-token` และ `openclaw config set` จะปฏิเสธการแก้ไขไฟล์
- Agent ควรแก้ไขซอร์ส Nix แทน สำหรับ nix-openclaw ให้ใช้ [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first และตั้งค่าคอนฟิกใต้ `programs.openclaw.config` หรือ `instances.<name>.config`
- dependency ที่ขาดหายจะแสดงข้อความแก้ไขเฉพาะ Nix
- UI แสดงแบนเนอร์โหมด Nix แบบอ่านอย่างเดียว

### พาธของคอนฟิกและสถานะ

OpenClaw อ่านคอนฟิก JSON5 จาก `OPENCLAW_CONFIG_PATH` และเก็บข้อมูลที่เปลี่ยนแปลงได้ใน `OPENCLAW_STATE_DIR` เมื่อทำงานภายใต้ Nix ให้ตั้งค่าเหล่านี้อย่างชัดเจนไปยังตำแหน่งที่จัดการด้วย Nix เพื่อให้สถานะ runtime และคอนฟิกไม่อยู่ใน store ที่เปลี่ยนแปลงไม่ได้

| ตัวแปร                 | ค่าเริ่มต้น                              |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### การค้นหา PATH ของบริการ

บริการ Gateway ของ launchd/systemd จะค้นหาไบนารีใน Nix profile โดยอัตโนมัติ เพื่อให้
plugins และเครื่องมือที่เรียกใช้งาน executable ที่ติดตั้งผ่าน `nix` ด้วยเชลล์ทำงานได้โดยไม่ต้อง
ตั้งค่า PATH ด้วยตนเอง:

- เมื่อมีการตั้งค่า `NIX_PROFILES` ทุก entry จะถูกเพิ่มลงใน PATH ของบริการตาม
  ลำดับความสำคัญจากขวาไปซ้าย (ตรงกับลำดับความสำคัญของ Nix shell - ขวาสุดชนะ)
- เมื่อไม่ได้ตั้งค่า `NIX_PROFILES` จะเพิ่ม `~/.nix-profile/bin` เป็น fallback

สิ่งนี้ใช้กับสภาพแวดล้อมบริการทั้ง macOS launchd และ Linux systemd

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    โมดูล Home Manager ที่เป็นแหล่งข้อมูลหลักและคู่มือการตั้งค่าเต็มรูปแบบ
  </Card>
  <Card title="ตัวช่วยตั้งค่า" href="/th/start/wizard" icon="wand-magic-sparkles">
    คำแนะนำการตั้งค่า CLI แบบไม่ใช้ Nix
  </Card>
  <Card title="Docker" href="/th/install/docker" icon="docker">
    การตั้งค่าแบบคอนเทนเนอร์เป็นทางเลือกที่ไม่ใช้ Nix
  </Card>
  <Card title="การอัปเดต" href="/th/install/updating" icon="arrow-up-right-from-square">
    การอัปเดตการติดตั้งที่จัดการด้วย Home Manager ควบคู่กับแพ็กเกจ
  </Card>
</CardGroup>
