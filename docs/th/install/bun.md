---
read_when:
    - คุณต้องการลูปการพัฒนาในเครื่องที่เร็วที่สุด (`bun` + watch)
    - คุณพบปัญหาสคริปต์ install/patch/lifecycle ของ Bun
summary: 'เวิร์กโฟลว์ Bun (ทดลอง): การติดตั้งและข้อควรระวังเมื่อเทียบกับ pnpm'
title: Bun (ทดลอง)
x-i18n:
    generated_at: "2026-06-27T17:43:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **ไม่แนะนำให้ใช้สำหรับรันไทม์ Gateway** (มีปัญหาที่ทราบกับ WhatsApp และ Telegram) ใช้ Node สำหรับการใช้งานจริง
</Warning>

Bun เป็นรันไทม์ภายในเครื่องแบบไม่บังคับสำหรับรัน TypeScript โดยตรง (`bun run ...`, `bun --watch ...`) ตัวจัดการแพ็กเกจเริ่มต้นยังคงเป็น `pnpm` ซึ่งรองรับอย่างสมบูรณ์และใช้โดยเครื่องมือเอกสาร Bun ไม่สามารถใช้ `pnpm-lock.yaml` และจะไม่สนใจไฟล์นี้

## ติดตั้ง

<Steps>
  <Step title="ติดตั้ง dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` ถูก gitignore ไว้ จึงไม่มีความเปลี่ยนแปลงรบกวนใน repo หากต้องการข้ามการเขียน lockfile ทั้งหมด:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="บิลด์และทดสอบ">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## สคริปต์วงจรชีวิต

Bun บล็อกสคริปต์วงจรชีวิตของ dependency เว้นแต่จะเชื่อถืออย่างชัดเจน สำหรับ repo นี้ สคริปต์ที่มักถูกบล็อกไม่จำเป็นต้องใช้:

- `baileys` `preinstall` -- ตรวจสอบว่า Node major >= 20 (OpenClaw ตั้งค่าเริ่มต้นเป็น Node 24 และยังรองรับ Node 22 LTS ซึ่งปัจจุบันคือ `22.19+`)
- `protobufjs` `postinstall` -- แสดงคำเตือนเกี่ยวกับรูปแบบเวอร์ชันที่ไม่เข้ากัน (ไม่มีอาร์ติแฟกต์จากการบิลด์)

หากพบปัญหารันไทม์ที่ต้องใช้สคริปต์เหล่านี้ ให้เชื่อถือสคริปต์เหล่านี้อย่างชัดเจน:

```sh
bun pm trust baileys protobufjs
```

## ข้อควรระวัง

สคริปต์บางรายการยังคง hardcode pnpm (เช่น `check:docs`, `ui:*`, `protocol:check`) ให้รันสคริปต์เหล่านั้นผ่าน pnpm ไปก่อนในตอนนี้

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Node.js](/th/install/node)
- [การอัปเดต](/th/install/updating)
