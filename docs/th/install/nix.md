---
read_when:
    - คุณต้องการการติดตั้งที่ทำซ้ำได้และย้อนกลับได้
    - คุณใช้งาน Nix/NixOS/Home Manager อยู่แล้ว
    - คุณต้องการให้ทุกอย่างถูก pin และจัดการแบบ declarative
summary: ติดตั้ง OpenClaw แบบ declarative ด้วย Nix
title: Nix
x-i18n:
    generated_at: "2026-04-25T13:50:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
    source_path: install/nix.md
    workflow: 15
---

ติดตั้ง OpenClaw แบบ declarative ด้วย **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — โมดูล Home Manager แบบ batteries-included

<Info>
repo [nix-openclaw](https://github.com/openclaw/nix-openclaw) คือแหล่งข้อมูลจริงสำหรับการติดตั้งด้วย Nix หน้านี้เป็นภาพรวมแบบย่อ
</Info>

## สิ่งที่คุณจะได้รับ

- Gateway + แอป macOS + tools (whisper, spotify, cameras) -- ทั้งหมดถูก pin ไว้
- บริการ Launchd ที่ยังคงทำงานหลังรีบูต
- ระบบ Plugin พร้อมคอนฟิกแบบ declarative
- rollback ได้ทันที: `home-manager switch --rollback`

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง Determinate Nix">
    หากยังไม่ได้ติดตั้ง Nix ให้ทำตามคำแนะนำของ [ตัวติดตั้ง Determinate Nix](https://github.com/DeterminateSystems/nix-installer)
  </Step>
  <Step title="สร้าง local flake">
    ใช้เทมเพลตแบบ agent-first จาก repo nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # คัดลอก templates/agent-first/flake.nix จาก repo nix-openclaw
    ```
  </Step>
  <Step title="กำหนดค่า secrets">
    ตั้งค่า token ของ messaging bot และ API key ของ model provider ใช้ไฟล์ธรรมดาที่ `~/.secrets/` ได้เลย
  </Step>
  <Step title="กรอก template placeholders และสลับไปใช้">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="ตรวจสอบ">
    ยืนยันว่าบริการ launchd กำลังทำงานอยู่ และบอตของคุณตอบข้อความได้
  </Step>
</Steps>

ดู [README ของ nix-openclaw](https://github.com/openclaw/nix-openclaw) สำหรับตัวเลือกของโมดูลและตัวอย่างแบบเต็ม

## พฤติกรรมรันไทม์ในโหมด Nix

เมื่อมีการตั้ง `OPENCLAW_NIX_MODE=1` (อัตโนมัติเมื่อใช้ nix-openclaw) OpenClaw จะเข้าสู่โหมด deterministic ที่ปิดโฟลว์การติดตั้งอัตโนมัติ

คุณสามารถตั้งค่าเองได้เช่นกัน:

```bash
export OPENCLAW_NIX_MODE=1
```

บน macOS แอป GUI จะไม่รับช่วงตัวแปรสภาพแวดล้อมของ shell โดยอัตโนมัติ ให้เปิด Nix mode ผ่าน defaults แทน:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### สิ่งที่เปลี่ยนในโหมด Nix

- ปิดโฟลว์การติดตั้งอัตโนมัติและการเปลี่ยนแปลงตัวเอง
- เมื่อขาด dependencies จะแสดงข้อความแนะนำการแก้ไขที่เฉพาะกับ Nix
- UI จะแสดงแบนเนอร์ Nix mode แบบอ่านอย่างเดียว

### พาธของคอนฟิกและสถานะ

OpenClaw อ่านคอนฟิก JSON5 จาก `OPENCLAW_CONFIG_PATH` และเก็บข้อมูลที่เปลี่ยนแปลงได้ไว้ใน `OPENCLAW_STATE_DIR` เมื่อรันภายใต้ Nix ให้ตั้งค่าสิ่งเหล่านี้อย่างชัดเจนเป็นตำแหน่งที่ Nix จัดการ เพื่อให้สถานะและคอนฟิกระหว่างรันไทม์ไม่ไปอยู่ใน immutable store

| ตัวแปร                | ค่าเริ่มต้น                            |
| --------------------- | -------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                          |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`    |

### การค้นหา PATH ของบริการ

บริการ gateway ของ launchd/systemd จะค้นหาไบนารีจาก Nix profile อัตโนมัติ ดังนั้น
plugins และ tools ที่ shell ออกไปเรียก executable ที่ติดตั้งด้วย `nix` จะทำงานได้โดยไม่ต้องตั้งค่า PATH เอง

- เมื่อมีการตั้ง `NIX_PROFILES` ทุก entry จะถูกเพิ่มเข้าไปใน service PATH
  ด้วยลำดับความสำคัญจากขวาไปซ้าย (ตรงกับลำดับความสำคัญของ Nix shell — ตัวขวาสุดชนะ)
- เมื่อไม่มีการตั้ง `NIX_PROFILES` จะเพิ่ม `~/.nix-profile/bin` เป็น fallback

สิ่งนี้ใช้ได้กับทั้งสภาพแวดล้อมบริการของ macOS launchd และ Linux systemd

## ที่เกี่ยวข้อง

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- คู่มือการตั้งค่าแบบเต็ม
- [Wizard](/th/start/wizard) -- การตั้งค่า CLI แบบไม่ใช้ Nix
- [Docker](/th/install/docker) -- การตั้งค่าแบบ containerized
