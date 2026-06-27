---
read_when:
    - คุณกำลังติดตั้ง กำหนดค่า หรือตรวจสอบ Plugin diffs-language-pack
summary: เพิ่มการเน้นไวยากรณ์สำหรับภาษาที่อยู่นอกชุดตัวแสดง diff เริ่มต้น
title: Plugin ชุดภาษา Diffs
x-i18n:
    generated_at: "2026-06-27T18:01:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin ชุดภาษา Diffs

เพิ่มการไฮไลต์ไวยากรณ์สำหรับภาษาที่อยู่นอกชุดเริ่มต้นของตัวแสดง diffs

## การจัดจำหน่าย

- Package: `@openclaw/diffs-language-pack`
- เส้นทางการติดตั้ง: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## พื้นผิว

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## ภาษาที่เพิ่ม

Plugin พื้นฐาน `diffs` ไฮไลต์ภาษาทั่วไปที่ระบุไว้ใน [Diffs](/th/tools/diffs) อยู่แล้ว ติดตั้งชุดภาษานี้เมื่อคุณต้องการการไฮไลต์ไวยากรณ์สำหรับภาษาที่ Shiki รองรับในขอบเขตที่กว้างขึ้น หากไม่ได้ติดตั้งชุดนี้ ไฟล์เหล่านั้นยังคงแสดงผลเป็นข้อความธรรมดาที่อ่านได้

ตัวอย่างได้แก่ Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI และไฟล์ diff

ดู [ภาษา Shiki](https://shiki.style/languages) สำหรับแค็ตตาล็อกภาษาและ alias ต้นทางของ Shiki

<!-- openclaw-plugin-reference:manual-end -->
