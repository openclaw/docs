---
read_when:
    - Memahami apa yang terjadi saat agen pertama kali dijalankan
    - Menjelaskan lokasi file bootstrapping berada
    - Men-debug penyiapan identitas orientasi awal
sidebarTitle: Bootstrapping
summary: Ritual inisialisasi agen yang menyiapkan ruang kerja dan file identitas
title: Inisialisasi agen
x-i18n:
    generated_at: "2026-05-06T09:28:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: e25f05ca47184068b87f0bf8b7dea1c427f4ed48edde170a74888d586b8a606d
    source_path: start/bootstrapping.md
    workflow: 16
---

Inisialisasi awal adalah ritual **eksekusi pertama** yang menyiapkan ruang kerja agen dan
mengumpulkan detail identitas. Ini terjadi setelah orientasi awal, saat agen dimulai
untuk pertama kalinya.

## Apa yang dilakukan inisialisasi awal

Pada eksekusi agen pertama, OpenClaw menginisialisasi ruang kerja (default
`~/.openclaw/workspace`):

- Mengisi `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Menjalankan ritual tanya jawab singkat (satu pertanyaan setiap kali).
- Menulis identitas + preferensi ke `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Menghapus `BOOTSTRAP.md` setelah selesai sehingga hanya berjalan sekali.

Untuk eksekusi model tersemat/lokal, OpenClaw menjaga `BOOTSTRAP.md` tetap di luar
konteks sistem yang diberi hak istimewa. Pada eksekusi pertama interaktif utama, OpenClaw tetap meneruskan
isi file dalam prompt pengguna agar model yang tidak selalu memanggil alat
`read` dapat menyelesaikan ritual. Jika eksekusi saat ini tidak dapat mengakses
ruang kerja dengan aman, agen menerima catatan inisialisasi awal terbatas alih-alih sapaan generik.

## Melewati inisialisasi awal

Untuk melewati ini bagi ruang kerja yang sudah diisi sebelumnya, jalankan `openclaw onboard --skip-bootstrap`.

## Tempat ini dijalankan

Inisialisasi awal selalu berjalan di **host gateway**. Jika aplikasi macOS terhubung ke
Gateway jarak jauh, ruang kerja dan file inisialisasi awal berada di mesin jarak jauh tersebut.

<Note>
Saat Gateway berjalan di mesin lain, edit file ruang kerja di host gateway
(misalnya, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Dokumen terkait

- Orientasi awal aplikasi macOS: [Orientasi awal](/id/start/onboarding)
- Tata letak ruang kerja: [Ruang kerja agen](/id/concepts/agent-workspace)
