---
read_when:
    - คุณต้องการวงจรการพัฒนาในเครื่องที่เร็วที่สุด (bun + watch)
    - คุณพบปัญหาเกี่ยวกับสคริปต์การติดตั้ง/แพตช์/วงจรชีวิตของ Bun
summary: 'เวิร์กโฟลว์ Bun (แบบทดลอง): การติดตั้งและข้อควรระวังเมื่อเทียบกับ pnpm'
title: Bun (ทดลอง)
x-i18n:
    generated_at: "2026-04-30T09:58:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 16
---

<Warning>
ไม่แนะนำให้ใช้ Bun เป็น **รันไทม์สำหรับ Gateway** (มีปัญหาที่ทราบกับ WhatsApp และ Telegram) ใช้ Node สำหรับโปรดักชัน
</Warning>

Bun เป็นรันไทม์เฉพาะเครื่องแบบทางเลือกสำหรับรัน TypeScript โดยตรง (`bun run ...`, `bun --watch ...`) ตัวจัดการแพ็กเกจเริ่มต้นยังคงเป็น `pnpm` ซึ่งรองรับเต็มรูปแบบและใช้โดยเครื่องมือเอกสาร Bun ไม่สามารถใช้ `pnpm-lock.yaml` และจะเพิกเฉยต่อไฟล์นี้

## ติดตั้ง

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` ถูก gitignore ไว้ ดังนั้นจึงไม่มีการเปลี่ยนแปลงไฟล์ใน repo หากต้องการข้ามการเขียน lockfile ทั้งหมด:

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

Bun จะบล็อกสคริปต์วงจรชีวิตของ dependency เว้นแต่จะเชื่อถืออย่างชัดเจน สำหรับ repo นี้ สคริปต์ที่มักถูกบล็อกไม่จำเป็นต้องใช้:

- `@whiskeysockets/baileys` `preinstall` -- ตรวจสอบว่า Node major >= 20 (OpenClaw ตั้งค่าเริ่มต้นเป็น Node 24 และยังรองรับ Node 22 LTS ซึ่งปัจจุบันคือ `22.14+`)
- `protobufjs` `postinstall` -- แสดงคำเตือนเกี่ยวกับรูปแบบเวอร์ชันที่เข้ากันไม่ได้ (ไม่มีอาร์ติแฟกต์สำหรับบิลด์)

หากคุณพบปัญหารันไทม์ที่ต้องใช้สคริปต์เหล่านี้ ให้เชื่อถือสคริปต์เหล่านี้อย่างชัดเจน:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## ข้อควรระวัง

บางสคริปต์ยังคง hardcode pnpm อยู่ (เช่น `docs:build`, `ui:*`, `protocol:check`) ให้รันสคริปต์เหล่านั้นผ่าน pnpm ไปก่อน

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Node.js](/th/install/node)
- [การอัปเดต](/th/install/updating)
