---
read_when:
    - คุณกำลังติดตั้ง กำหนดค่า หรือตรวจสอบ Plugin diffs-language-pack
summary: เพิ่มการเน้นไวยากรณ์สำหรับภาษาที่อยู่นอกเหนือชุดภาษาที่โปรแกรมดู diff รองรับโดยค่าเริ่มต้น
title: Plugin ชุดภาษา Diffs
x-i18n:
    generated_at: "2026-07-12T16:29:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin ชุดภาษาสำหรับ Diffs

เพิ่มการเน้นไวยากรณ์สำหรับภาษาที่อยู่นอกเหนือชุดภาษาเริ่มต้นของตัวแสดง diff

## การเผยแพร่

- แพ็กเกจ: `@openclaw/diffs-language-pack`
- ช่องทางการติดตั้ง: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## พื้นผิว

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## ภาษาที่เพิ่มเข้ามา

Plugin `diffs` พื้นฐานรองรับการเน้นไวยากรณ์สำหรับภาษาที่ใช้กันทั่วไปตามที่ระบุไว้ใน [Diffs](/th/tools/diffs) อยู่แล้ว ติดตั้งชุดภาษานี้เมื่อต้องการการเน้นไวยากรณ์สำหรับภาษาที่ Shiki รองรับในขอบเขตที่กว้างขึ้น หากไม่ได้ติดตั้งชุดภาษานี้ ไฟล์เหล่านั้นจะยังคงแสดงผลเป็นข้อความธรรมดาที่อ่านได้

ตัวอย่างได้แก่ Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI และไฟล์ diff

ดูแค็ตตาล็อกภาษาและนามแฝงต้นทางของ Shiki ได้ที่ [ภาษาของ Shiki](https://shiki.style/languages)

<!-- openclaw-plugin-reference:manual-end -->
