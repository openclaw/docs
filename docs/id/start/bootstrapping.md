---
read_when:
    - Memahami apa yang terjadi pada run agen pertama
    - Explaining where bootstrapping files live
    - Men-debug penyiapan identitas onboarding
sidebarTitle: Bootstrapping
summary: Ritual bootstrap agen yang melakukan seed workspace dan file identitas
title: Bootstrap agen
x-i18n:
    generated_at: "2026-04-24T09:28:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c23a204a7afbf2ca0c0d19a227286cf0ae396181073403055db41dafa764d2a
    source_path: start/bootstrapping.md
    workflow: 15
---

Bootstrapping adalah ritual **run pertama** yang menyiapkan workspace agen dan
mengumpulkan detail identitas. Ini terjadi setelah onboarding, ketika agen mulai
untuk pertama kalinya.

## Apa yang dilakukan bootstrapping

Pada run agen pertama, OpenClaw melakukan bootstrap pada workspace (default
`~/.openclaw/workspace`):

- Melakukan seed `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Menjalankan ritual tanya-jawab singkat (satu pertanyaan setiap kali).
- Menulis identitas + preferensi ke `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Menghapus `BOOTSTRAP.md` saat selesai sehingga hanya berjalan sekali.

## Di mana ini berjalan

Bootstrapping selalu berjalan di **host gateway**. Jika aplikasi macOS terhubung ke
Gateway remote, workspace dan file bootstrap berada di mesin
remote tersebut.

<Note>
Saat Gateway berjalan di mesin lain, edit file workspace di host gateway
(misalnya, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Dokumentasi terkait

- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Tata letak workspace: [Agent workspace](/id/concepts/agent-workspace)
