---
read_when:
    - Memahami apa yang terjadi saat agen dijalankan pertama kali
    - Menjelaskan lokasi file bootstrap
    - Memecahkan masalah penyiapan identitas saat orientasi awal
sidebarTitle: Bootstrapping
summary: Ritual inisialisasi agen yang menyiapkan ruang kerja dan file identitas
title: Inisialisasi agen
x-i18n:
    generated_at: "2026-04-30T10:12:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: de829f82016ae1e4dcd7714502ca8d11755556fed18b985a7e2bada4149a2d46
    source_path: start/bootstrapping.md
    workflow: 16
---

Inisialisasi awal adalah ritual **pertama kali dijalankan** yang menyiapkan ruang kerja agen dan
mengumpulkan detail identitas. Ini terjadi setelah orientasi awal, saat agen dimulai
untuk pertama kalinya.

## Yang dilakukan inisialisasi awal

Pada proses pertama agen dijalankan, OpenClaw menginisialisasi ruang kerja (default
`~/.openclaw/workspace`):

- Mengisi awal `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Menjalankan ritual tanya jawab singkat (satu pertanyaan setiap kali).
- Menulis identitas + preferensi ke `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Menghapus `BOOTSTRAP.md` setelah selesai agar hanya berjalan sekali.

Untuk proses model tersemat/lokal, OpenClaw menjaga `BOOTSTRAP.md` tetap di luar
konteks sistem istimewa. Pada proses pertama kali dijalankan secara interaktif yang utama, OpenClaw tetap meneruskan
isi file di prompt pengguna agar model yang tidak andal memanggil alat
`read` dapat menyelesaikan ritual. Jika proses saat ini tidak dapat mengakses
ruang kerja dengan aman, agen menerima catatan inisialisasi awal terbatas, bukan salam generik.

## Melewati inisialisasi awal

Untuk melewati ini pada ruang kerja yang telah diisi sebelumnya, jalankan `openclaw onboard --skip-bootstrap`.

## Tempat proses ini berjalan

Inisialisasi awal selalu berjalan di **host Gateway**. Jika aplikasi macOS terhubung ke
Gateway jarak jauh, ruang kerja dan file inisialisasi awal berada di mesin jarak jauh
tersebut.

<Note>
Saat Gateway berjalan di mesin lain, edit file ruang kerja di host Gateway
(misalnya, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Dokumentasi terkait

- Orientasi awal aplikasi macOS: [Orientasi awal](/id/start/onboarding)
- Tata letak ruang kerja: [Ruang kerja agen](/id/concepts/agent-workspace)
