---
read_when:
    - คุณต้องการวงจรการพัฒนาภายในเครื่องที่เร็วที่สุด (bun + watch)
    - คุณพบปัญหาเกี่ยวกับการติดตั้ง/แพตช์/สคริปต์วงจรชีวิตของ Bun
summary: 'เวิร์กโฟลว์ Bun (ทดลอง): การติดตั้งและข้อควรระวังเมื่อเทียบกับ pnpm'
title: Bun (เชิงทดลอง)
x-i18n:
    generated_at: "2026-05-10T19:42:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97a7da26520d66e6033065c50d6490c869ace3d5f0b25aafcd196074cf7df7c
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **ไม่แนะนำสำหรับรันไทม์ของ Gateway** (มีปัญหาที่ทราบแล้วกับ WhatsApp และ Telegram) ใช้ Node สำหรับการใช้งานจริง
</Warning>

Bun เป็นรันไทม์ภายในเครื่องแบบไม่บังคับสำหรับรัน TypeScript โดยตรง (`bun run ...`, `bun --watch ...`) ตัวจัดการแพ็กเกจเริ่มต้นยังคงเป็น `pnpm` ซึ่งรองรับอย่างสมบูรณ์และใช้โดยเครื่องมือเอกสาร Bun ไม่สามารถใช้ `pnpm-lock.yaml` และจะเพิกเฉยต่อไฟล์นี้

## ติดตั้ง

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` ถูก gitignore ไว้ ดังนั้นจึงไม่มีความเปลี่ยนแปลงรบกวนใน repo หากต้องการข้ามการเขียน lockfile ทั้งหมด:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build and test">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## สคริปต์วงจรชีวิต

Bun บล็อกสคริปต์วงจรชีวิตของ dependency เว้นแต่จะถูกเชื่อถืออย่างชัดเจน สำหรับ repo นี้ สคริปต์ที่มักถูกบล็อกไม่จำเป็นต้องใช้:

- `baileys` `preinstall` -- ตรวจสอบ Node major >= 20 (OpenClaw ใช้ค่าเริ่มต้นเป็น Node 24 และยังรองรับ Node 22 LTS ซึ่งปัจจุบันคือ `22.16+`)
- `protobufjs` `postinstall` -- แสดงคำเตือนเกี่ยวกับรูปแบบเวอร์ชันที่เข้ากันไม่ได้ (ไม่มีอาร์ติแฟกต์จากการ build)

หากคุณพบปัญหารันไทม์ที่ต้องใช้สคริปต์เหล่านี้ ให้เชื่อถือสคริปต์เหล่านั้นอย่างชัดเจน:

```sh
bun pm trust baileys protobufjs
```

## ข้อควรระวัง

สคริปต์บางรายการยังคง hardcode pnpm อยู่ (เช่น `docs:build`, `ui:*`, `protocol:check`) ให้รันรายการเหล่านั้นผ่าน pnpm ไปก่อนในตอนนี้

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Node.js](/th/install/node)
- [การอัปเดต](/th/install/updating)
