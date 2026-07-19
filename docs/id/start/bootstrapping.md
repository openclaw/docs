---
read_when:
    - Memahami apa yang terjadi pada proses pertama agen
    - Menjelaskan lokasi file bootstrap berada
    - Men-debug penyiapan identitas onboarding
sidebarTitle: Bootstrapping
summary: Ritual bootstrap agen yang menginisialisasi ruang kerja dan berkas identitas
title: Bootstrap agen
x-i18n:
    generated_at: "2026-07-19T05:10:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4c065534b5abe539cccfe8badc44296d890289d8ce3daa9f03a12e82adf8c091
    source_path: start/bootstrapping.md
    workflow: 16
---

Bootstrapping adalah ritual saat pertama kali dijalankan yang menyiapkan ruang kerja agen baru dan
memandu agen dalam memilih identitas. Ritual ini dijalankan satu kali, tepat setelah
onboarding, pada giliran nyata pertama agen.

## Yang terjadi

Pada eksekusi pertama terhadap ruang kerja yang benar-benar baru (default `~/.openclaw/workspace`),
OpenClaw:

- Menyiapkan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, dan `BOOTSTRAP.md`.
- Meminta agen mengikuti urutan kelahiran tiga tahap yang dibatasi: agen mengusulkan
  namanya sendiri, membagikan satu baris singkat tentang jiwa/nuansanya, dan menanyakan apakah Anda menginginkan kumpulan
  Plugin minimal yang direkomendasikan atau kemudahan maksimal.
- Menyimpan identitas yang disepakati dua kali: ke dalam `IDENTITY.md` dan `SOUL.md` (yang
  dibaca agen tentang dirinya sendiri) dan melalui `openclaw agents set-identity` (yang ditampilkan oleh saluran
  dan UI).
- Membaca rekomendasi aplikasi yang telah disimpan selama onboarding tanpa memindai ulang.
  Plugin resmi menggunakan `openclaw plugins install <id>`; skills ClawHub pihak ketiga
  tetap memerlukan persetujuan eksplisit. Setelah pilihan ditangani, agen
  mengonfirmasi penawaran yang tersimpan agar tidak pernah menanyakannya lagi.
- Menghapus `BOOTSTRAP.md` setelah ruang kerja tampak telah dikonfigurasi, sehingga ritual hanya dijalankan satu kali.

Ruang kerja dianggap telah dikonfigurasi setelah `SOUL.md`, `IDENTITY.md`, atau `USER.md`
berbeda dari templat awalnya, atau terdapat folder `memory/`.

<Note>
`BOOTSTRAP.md` mencakup percakapan identitas secara lengkap. Lihat isinya di
[templat BOOTSTRAP.md](/id/reference/templates/BOOTSTRAP).
</Note>

## Eksekusi model tertanam dan lokal

Untuk eksekusi model tertanam atau lokal, OpenClaw tidak menyertakan `BOOTSTRAP.md` dalam
konteks sistem berhak istimewa. Pada eksekusi pertama interaktif utama, OpenClaw tetap
meneruskan isi berkas melalui prompt pengguna, sehingga model yang tidak
menggunakan alat `read` secara andal tetap dapat menyelesaikan ritual. Jika eksekusi saat ini
tidak dapat mengakses ruang kerja dengan aman, agen akan menerima catatan bootstrapping terbatas
yang singkat sebagai pengganti sapaan umum.

## Melewati bootstrapping

Untuk melewati proses ini pada ruang kerja yang telah disiapkan sebelumnya, jalankan:

```bash
openclaw onboard --skip-bootstrap
```

## Tempat proses dijalankan

Bootstrapping selalu dijalankan pada host Gateway. Jika aplikasi macOS terhubung ke
Gateway jarak jauh, ruang kerja dan berkas bootstrap-nya berada di mesin jarak jauh
tersebut, bukan di Mac.

<Note>
Ketika Gateway dijalankan di mesin lain, edit berkas ruang kerja pada host Gateway
(misalnya, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Dokumentasi terkait

- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Tata letak ruang kerja: [Ruang kerja agen](/id/concepts/agent-workspace)
- Isi templat: [templat BOOTSTRAP.md](/id/reference/templates/BOOTSTRAP)
