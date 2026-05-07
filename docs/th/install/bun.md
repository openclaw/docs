---
read_when:
    - คุณต้องการลูปการพัฒนาในเครื่องที่เร็วที่สุด (bun + watch)
    - คุณพบปัญหาเกี่ยวกับสคริปต์การติดตั้ง/แพตช์/วงจรชีวิตของ Bun
summary: 'เวิร์กโฟลว์ Bun (ทดลอง): การติดตั้งและข้อควรระวังเทียบกับ pnpm'
title: Bun (ทดลอง)
x-i18n:
    generated_at: "2026-05-07T13:21:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1637cb81310422b718934f9c2d1f506dec46f1624dd9ac850bed04321b863041
    source_path: install/bun.md
    workflow: 16
---

<Warning>
**ไม่แนะนำให้ใช้ Bun สำหรับรันไทม์ Gateway** (มีปัญหาที่ทราบกับ WhatsApp และ Telegram) ใช้ Node สำหรับการใช้งานจริง
</Warning>

Bun เป็นรันไทม์ภายในเครื่องแบบไม่บังคับสำหรับรัน TypeScript โดยตรง (`bun run ...`, `bun --watch ...`) ตัวจัดการแพ็กเกจเริ่มต้นยังคงเป็น `pnpm` ซึ่งรองรับอย่างเต็มรูปแบบและใช้โดยเครื่องมือเอกสาร Bun ไม่สามารถใช้ `pnpm-lock.yaml` และจะเพิกเฉยต่อไฟล์นี้

## ติดตั้ง

<Steps>
  <Step title="ติดตั้ง dependency">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` ถูกละเว้นโดย Git จึงไม่มีความเปลี่ยนแปลงรบกวนใน repo หากต้องการข้ามการเขียน lockfile ทั้งหมด:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="build และทดสอบ">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## สคริปต์วงจรชีวิต

Bun จะบล็อกสคริปต์วงจรชีวิตของ dependency เว้นแต่จะเชื่อถืออย่างชัดเจน สำหรับ repo นี้ สคริปต์ที่มักถูกบล็อกไม่จำเป็นต้องใช้:

- `@whiskeysockets/baileys` `preinstall` -- ตรวจสอบ Node major >= 20 (OpenClaw ใช้ค่าเริ่มต้นเป็น Node 24 และยังรองรับ Node 22 LTS ซึ่งปัจจุบันคือ `22.16+`)
- `protobufjs` `postinstall` -- แสดงคำเตือนเกี่ยวกับรูปแบบเวอร์ชันที่เข้ากันไม่ได้ (ไม่มี build artifacts)

หากพบปัญหารันไทม์ที่ต้องใช้สคริปต์เหล่านี้ ให้เชื่อถืออย่างชัดเจน:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## ข้อควรทราบ

สคริปต์บางรายการยังคง hardcode pnpm อยู่ (เช่น `docs:build`, `ui:*`, `protocol:check`) ให้รันสคริปต์เหล่านั้นผ่าน pnpm ไปก่อนในตอนนี้

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Node.js](/th/install/node)
- [การอัปเดต](/th/install/updating)
