---
read_when:
    - Menginstal aplikasi macOS
    - Memilih antara mode Gateway lokal dan jarak jauh di macOS
    - Mencari unduhan rilis aplikasi macOS
summary: Instal dan gunakan aplikasi bilah menu macOS OpenClaw
title: aplikasi macOS
x-i18n:
    generated_at: "2026-06-28T00:13:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

Aplikasi macOS adalah **pendamping bilah menu** OpenClaw. Gunakan saat Anda menginginkan
UI baki native, prompt izin macOS, notifikasi, WebChat, input suara,
Canvas, atau alat node yang dihosting Mac seperti `system.run`.

Jika Anda hanya membutuhkan CLI dan Gateway, mulai dengan [Memulai](/id/start/getting-started).

## Unduh

Unduh build aplikasi macOS dari
[rilis GitHub OpenClaw](https://github.com/openclaw/openclaw/releases).
Saat sebuah rilis menyertakan aset aplikasi macOS, cari:

- `OpenClaw-<version>.dmg` (disarankan)
- `OpenClaw-<version>.zip`

Beberapa rilis hanya menyertakan aset CLI, bukti, atau Windows. Jika rilis terbaru
tidak memiliki aset aplikasi macOS, gunakan rilis terbaru yang memilikinya, atau build
aplikasi dari sumber dengan [penyiapan dev macOS](/id/platforms/mac/dev-setup).

## Jalankan pertama kali

1. Instal dan jalankan **OpenClaw.app**.
2. Selesaikan daftar periksa izin macOS.
3. Pilih mode **Lokal** atau **Remote**.
4. Instal CLI `openclaw` jika aplikasi memintanya.
5. Buka WebChat dari bilah menu dan kirim pesan uji.

Untuk jalur penyiapan CLI/Gateway, gunakan [Memulai](/id/start/getting-started).
Untuk pemulihan izin, gunakan [izin macOS](/id/platforms/mac/permissions).

## Pilih mode Gateway

| Mode   | Gunakan saat                                                                            | Halaman detail                                      |
| ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Lokal  | Mac ini harus menjalankan Gateway dan menjaganya tetap aktif dengan launchd.            | [Gateway di macOS](/id/platforms/mac/bundled-gateway) |
| Remote | Host lain menjalankan Gateway dan Mac ini harus mengontrolnya melalui SSH, LAN, atau Tailnet. | [Kontrol remote](/id/platforms/mac/remote)            |

Mode Lokal memerlukan CLI `openclaw` yang sudah terinstal. Aplikasi dapat menginstalnya, atau Anda
dapat mengikuti [Gateway di macOS](/id/platforms/mac/bundled-gateway).

## Yang dimiliki aplikasi

- Status bilah menu, notifikasi, kesehatan, dan WebChat.
- Prompt izin macOS untuk layar, mikrofon, ucapan, automasi, dan aksesibilitas.
- Alat node lokal seperti Canvas, pengambilan kamera/layar, notifikasi, dan `system.run`.
- Prompt persetujuan exec untuk perintah yang dihosting Mac.
- Tunnel SSH mode remote atau koneksi Gateway langsung.

Aplikasi ini **tidak** menggantikan Gateway OpenClaw atau dokumentasi CLI umum. Konfigurasi inti
Gateway, penyedia, plugin, kanal, alat, dan keamanan tersedia di
dokumentasi masing-masing.

## Halaman detail macOS

| Tugas                                    | Baca                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Menginstal atau men-debug layanan CLI/Gateway | [Gateway di macOS](/id/platforms/mac/bundled-gateway)                                          |
| Menjauhkan status dari folder yang disinkronkan cloud | [Gateway di macOS](/id/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| Men-debug penemuan aplikasi dan konektivitas | [Gateway di macOS](/id/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| Memahami perilaku launchd                | [Siklus hidup Gateway](/id/platforms/mac/child-process)                                        |
| Memperbaiki izin atau masalah penandatanganan/TCC | [izin macOS](/id/platforms/mac/permissions)                                                     |
| Terhubung ke Gateway remote              | [Kontrol remote](/id/platforms/mac/remote)                                                     |
| Membaca status bilah menu dan pemeriksaan kesehatan | [Bilah menu](/id/platforms/mac/menu-bar), [Pemeriksaan kesehatan](/id/platforms/mac/health)       |
| Menggunakan UI chat tertanam             | [WebChat](/id/platforms/mac/webchat)                                                           |
| Menggunakan voice wake atau push-to-talk | [Voice wake](/id/platforms/mac/voicewake)                                                      |
| Menggunakan Canvas dan deep link Canvas  | [Canvas](/id/platforms/mac/canvas)                                                             |
| Menghosting PeekabooBridge untuk automasi UI | [Bridge Peekaboo](/id/platforms/mac/peekaboo)                                                  |
| Mengonfigurasi persetujuan perintah      | [Persetujuan exec](/id/tools/exec-approvals), [detail lanjutan](/id/tools/exec-approvals-advanced) |
| Memeriksa perintah node Mac dan IPC aplikasi | [IPC macOS](/id/platforms/mac/xpc)                                                             |
| Mengambil log                            | [Logging macOS](/id/platforms/mac/logging)                                                     |
| Build dari sumber                        | [Penyiapan dev macOS](/id/platforms/mac/dev-setup)                                             |

## Terkait

- [Platform](/id/platforms)
- [Memulai](/id/start/getting-started)
- [Gateway](/id/gateway)
- [Persetujuan exec](/id/tools/exec-approvals)
