---
read_when:
    - Memahami apa yang terjadi pada eksekusi pertama agen
    - Menjelaskan lokasi file bootstrap
    - Men-debug penyiapan identitas onboarding
sidebarTitle: Bootstrapping
summary: Ritual bootstrap agen yang menyiapkan file workspace dan identitas
title: Bootstrap Agen
x-i18n:
    generated_at: "2026-04-05T14:06:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a08b5102f25c6c4bcdbbdd44384252a9e537b245a7b070c4961a72b4c6c6601
    source_path: start/bootstrapping.md
    workflow: 15
---

# Bootstrap Agen

Bootstrap adalah ritual **eksekusi pertama** yang menyiapkan workspace agen dan
mengumpulkan detail identitas. Ini terjadi setelah onboarding, ketika agen mulai
berjalan untuk pertama kalinya.

## Apa yang dilakukan bootstrap

Pada eksekusi pertama agen, OpenClaw melakukan bootstrap pada workspace (default
`~/.openclaw/workspace`):

- Menyiapkan `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Menjalankan ritual tanya jawab singkat (satu pertanyaan pada satu waktu).
- Menulis identitas + preferensi ke `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Menghapus `BOOTSTRAP.md` saat selesai sehingga hanya berjalan sekali.

## Tempat ini berjalan

Bootstrap selalu berjalan di **host gateway**. Jika aplikasi macOS terhubung ke
Gateway jarak jauh, workspace dan file bootstrap berada di mesin jarak jauh
tersebut.

<Note>
Saat Gateway berjalan di mesin lain, edit file workspace di host gateway
(misalnya, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Dokumen terkait

- Onboarding aplikasi macOS: [Onboarding](/start/onboarding)
- Tata letak workspace: [Workspace agen](/id/concepts/agent-workspace)
