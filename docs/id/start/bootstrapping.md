---
read_when:
    - Memahami apa yang terjadi pada eksekusi agen pertama
    - Menjelaskan lokasi file bootstrap berada
    - Men-debug penyiapan identitas saat orientasi awal
sidebarTitle: Bootstrapping
summary: Ritual bootstrap agen yang menginisialisasi ruang kerja dan berkas identitas
title: Bootstrap agen
x-i18n:
    generated_at: "2026-07-12T14:39:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

Bootstrapping adalah proses awal saat pertama kali dijalankan yang menyiapkan ruang kerja agen baru dan
memandu agen dalam memilih identitas. Proses ini berjalan satu kali, tepat setelah
orientasi, pada giliran nyata pertama agen.

## Apa yang terjadi

Pada eksekusi pertama terhadap ruang kerja yang benar-benar baru (bawaan `~/.openclaw/workspace`),
OpenClaw:

- Menyiapkan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, dan `BOOTSTRAP.md`.
- Meminta agen mengikuti `BOOTSTRAP.md`: percakapan bebas (bukan formulir tanya jawab tetap) untuk menentukan nama, kepribadian, dan nuansa.
- Menuliskan hal yang dipelajarinya ke `IDENTITY.md`, `USER.md`, dan `SOUL.md`.
- Menghapus `BOOTSTRAP.md` setelah ruang kerja tampak terkonfigurasi, sehingga proses ini hanya berjalan satu kali.

Ruang kerja dianggap terkonfigurasi setelah `SOUL.md`, `IDENTITY.md`, atau `USER.md`
berbeda dari templat awalnya, atau jika folder `memory/` sudah ada.

<Note>
`BOOTSTRAP.md` mencakup seluruh percakapan identitas. Lihat isinya di
[templat BOOTSTRAP.md](/id/reference/templates/BOOTSTRAP).
</Note>

## Eksekusi model tertanam dan lokal

Untuk eksekusi model tertanam atau lokal, OpenClaw tidak menyertakan `BOOTSTRAP.md` dalam
konteks sistem berhak istimewa. Pada eksekusi interaktif utama yang pertama, OpenClaw tetap
meneruskan isi berkas tersebut melalui prompt pengguna, sehingga model yang tidak
memanggil alat `read` secara andal tetap dapat menyelesaikan proses ini. Jika eksekusi saat ini
tidak dapat mengakses ruang kerja dengan aman, agen akan menerima catatan bootstrap terbatas
yang singkat, bukan sapaan umum.

## Melewati bootstrapping

Untuk melewati proses ini pada ruang kerja yang telah disiapkan sebelumnya, jalankan:

```bash
openclaw onboard --skip-bootstrap
```

## Tempat proses berjalan

Bootstrapping selalu berjalan pada host Gateway. Jika aplikasi macOS terhubung ke
Gateway jarak jauh, ruang kerja dan berkas bootstrap-nya berada di mesin jarak jauh
tersebut, bukan di Mac.

<Note>
Saat Gateway berjalan di mesin lain, edit berkas ruang kerja pada host gateway
(misalnya, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Dokumentasi terkait

- Orientasi aplikasi macOS: [Orientasi](/id/start/onboarding)
- Tata letak ruang kerja: [Ruang kerja agen](/id/concepts/agent-workspace)
- Isi templat: [Templat BOOTSTRAP.md](/id/reference/templates/BOOTSTRAP)
