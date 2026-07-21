---
read_when:
    - Memahami apa yang terjadi pada eksekusi agen pertama
    - Menjelaskan lokasi file bootstrap berada
    - Men-debug penyiapan identitas orientasi pengguna
sidebarTitle: Bootstrapping
summary: Ritual bootstrap agen yang menginisialisasi ruang kerja dan file identitas
title: Bootstrap agen
x-i18n:
    generated_at: "2026-07-21T12:46:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: efb47e1a6a86d68aef1aa1662fe9c5def9a4e5b45649b84aeb9060bfcba21a5d
    source_path: start/bootstrapping.md
    workflow: 16
---

Bootstrapping adalah ritual pertama kali dijalankan yang menyiapkan ruang kerja agen baru dan
memandu agen dalam memilih identitas. Proses ini berjalan sekali, tepat setelah
onboarding, pada giliran nyata pertama agen.

## Yang terjadi

Pada proses pertama terhadap ruang kerja yang benar-benar baru (default `~/.openclaw/workspace`),
OpenClaw:

- Menyiapkan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, dan `BOOTSTRAP.md`.
- Meminta agen mengikuti rangkaian kelahiran tiga tahap yang dibatasi: agen menanyakan nama yang ingin
  Anda berikan kepadanya, membagikan satu kalimat singkat tentang jiwa/nuansanya, dan menanyakan apakah Anda menginginkan
  set plugin minimal yang direkomendasikan atau kemudahan maksimal.
- Menyimpan identitas yang disepakati dua kali: ke dalam `IDENTITY.md` dan `SOUL.md` (yang
  dibaca agen tentang dirinya sendiri) serta melalui `openclaw agents set-identity` (yang ditampilkan oleh channel
  dan UI).
- Membaca rekomendasi aplikasi yang telah disimpan selama onboarding tanpa memindai ulang.
  Plugin resmi menggunakan `openclaw plugins install <id>`; skills ClawHub pihak ketiga
  tetap memerlukan persetujuan eksplisit. Setelah pilihan ditangani, agen
  mengonfirmasi penawaran yang tersimpan agar tidak pernah menanyakannya lagi.
- Menghapus `BOOTSTRAP.md` setelah ruang kerja tampak terkonfigurasi, sehingga ritual hanya berjalan sekali.

Ruang kerja dianggap terkonfigurasi setelah `SOUL.md`, `IDENTITY.md`, atau `USER.md`
berbeda dari templat awalnya, atau terdapat folder `memory/`.

<Note>
`BOOTSTRAP.md` mencakup seluruh percakapan identitas. Lihat isinya di
[templat BOOTSTRAP.md](/id/reference/templates/BOOTSTRAP).
</Note>

## Proses model tertanam dan lokal

Untuk proses model tertanam atau lokal, OpenClaw menjaga `BOOTSTRAP.md` agar tidak masuk ke
konteks sistem dengan hak istimewa. Pada proses interaktif utama yang pertama, OpenClaw tetap
meneruskan isi file melalui prompt pengguna, sehingga model yang tidak
memanggil alat `read` secara andal tetap dapat menyelesaikan ritual. Jika proses saat ini
tidak dapat mengakses ruang kerja dengan aman, agen menerima catatan bootstrap terbatas
yang singkat sebagai pengganti sapaan umum.

## Melewati bootstrapping

Untuk melewati proses ini pada ruang kerja yang telah disiapkan sebelumnya, jalankan:

```bash
openclaw onboard --skip-bootstrap
```

## Tempat proses berjalan

Bootstrapping selalu berjalan pada host gateway. Jika aplikasi macOS terhubung ke
Gateway jarak jauh, ruang kerja dan file bootstrap-nya berada di mesin jarak jauh
tersebut, bukan di Mac.

<Note>
Saat Gateway berjalan pada mesin lain, edit file ruang kerja pada host gateway
(misalnya, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Dokumentasi terkait

- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Tata letak ruang kerja: [Ruang kerja agen](/id/concepts/agent-workspace)
- Isi templat: [templat BOOTSTRAP.md](/id/reference/templates/BOOTSTRAP)
