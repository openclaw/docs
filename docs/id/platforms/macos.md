---
read_when:
    - Menginstal aplikasi macOS
    - Memilih antara mode Gateway lokal dan jarak jauh di macOS
    - Mencari unduhan rilis aplikasi macOS
summary: Instal dan gunakan aplikasi bilah menu macOS OpenClaw
title: aplikasi macOS
x-i18n:
    generated_at: "2026-07-04T06:51:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

Aplikasi macOS adalah **pendamping bilah menu** OpenClaw. Gunakan saat Anda menginginkan UI tray native, prompt izin macOS, notifikasi, WebChat, input suara, Canvas, atau alat node yang dihosting Mac seperti `system.run`.

Jika Anda hanya membutuhkan CLI dan Gateway, mulai dengan [Memulai](/id/start/getting-started).

## Unduh

Unduh build aplikasi macOS dari
[rilis GitHub OpenClaw](https://github.com/openclaw/openclaw/releases).
Saat sebuah rilis menyertakan aset aplikasi macOS, cari:

- `OpenClaw-<version>.dmg` (disarankan)
- `OpenClaw-<version>.zip`

Beberapa rilis hanya menyertakan aset CLI, bukti, atau Windows. Jika rilis terbaru
tidak memiliki aset aplikasi macOS, gunakan rilis terbaru yang memilikinya, atau build
aplikasi dari sumber dengan [penyiapan pengembangan macOS](/id/platforms/mac/dev-setup).

## Jalankan pertama kali

1. Instal dan jalankan **OpenClaw.app**.
2. Pilih **This Mac** untuk Gateway lokal, atau sambungkan ke Gateway jarak jauh.
3. Untuk mode lokal, tunggu saat aplikasi menginstal runtime ruang-pengguna dan Gateway.
4. Selesaikan penyiapan provider dan daftar periksa izin macOS.
5. Kirim pesan uji onboarding.

Untuk jalur penyiapan CLI/Gateway, gunakan [Memulai](/id/start/getting-started).
Untuk pemulihan izin, gunakan [izin macOS](/id/platforms/mac/permissions).

## Pilih mode Gateway

| Mode        | Gunakan saat                                                                                  | Halaman detail                                     |
| ----------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Lokal       | Mac ini harus menjalankan Gateway dan menjaganya tetap aktif dengan launchd.                   | [Gateway di macOS](/id/platforms/mac/bundled-gateway) |
| Jarak jauh  | Host lain menjalankan Gateway dan Mac ini harus mengendalikannya melalui SSH, LAN, atau Tailnet. | [Kontrol jarak jauh](/id/platforms/mac/remote)        |

Mode lokal memerlukan CLI `openclaw` yang sudah terinstal. Di Mac baru, aplikasi menginstal
CLI dan runtime yang sesuai secara otomatis sebelum memulai wizard Gateway.
Lihat [Gateway di macOS](/id/platforms/mac/bundled-gateway) untuk pemulihan manual.

## Yang dimiliki aplikasi

- Status bilah menu, notifikasi, kesehatan, dan WebChat.
- Prompt izin macOS untuk layar, mikrofon, ucapan, automasi, dan aksesibilitas.
- Alat node lokal seperti Canvas, tangkapan kamera/layar, notifikasi, dan `system.run`.
- Prompt persetujuan exec untuk perintah yang dihosting Mac.
- Tunnel SSH mode jarak jauh atau koneksi Gateway langsung.

Aplikasi ini **tidak** menggantikan Gateway OpenClaw atau dokumentasi CLI umum. Konfigurasi
Gateway inti, provider, plugin, channel, alat, dan keamanan berada di
dokumentasinya masing-masing.

## Halaman detail macOS

| Tugas                                      | Baca                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| Menginstal atau men-debug layanan CLI/Gateway | [Gateway di macOS](/id/platforms/mac/bundled-gateway)                                          |
| Menjaga state di luar folder yang disinkronkan cloud | [Gateway di macOS](/id/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| Men-debug penemuan dan konektivitas aplikasi | [Gateway di macOS](/id/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| Memahami perilaku launchd                 | [Siklus hidup Gateway](/id/platforms/mac/child-process)                                        |
| Memperbaiki masalah izin atau signing/TCC | [Izin macOS](/id/platforms/mac/permissions)                                                    |
| Terhubung ke Gateway jarak jauh           | [Kontrol jarak jauh](/id/platforms/mac/remote)                                                 |
| Membaca status bilah menu dan pemeriksaan kesehatan | [Bilah menu](/id/platforms/mac/menu-bar), [Pemeriksaan kesehatan](/id/platforms/mac/health)        |
| Menggunakan UI chat tertanam              | [WebChat](/id/platforms/mac/webchat)                                                           |
| Menggunakan voice wake atau push-to-talk  | [Voice wake](/id/platforms/mac/voicewake)                                                      |
| Menggunakan Canvas dan deep link Canvas   | [Canvas](/id/platforms/mac/canvas)                                                             |
| Menghosting PeekabooBridge untuk automasi UI | [Bridge Peekaboo](/id/platforms/mac/peekaboo)                                                  |
| Mengonfigurasi persetujuan perintah       | [Persetujuan exec](/id/tools/exec-approvals), [detail lanjutan](/id/tools/exec-approvals-advanced) |
| Memeriksa perintah node Mac dan IPC aplikasi | [IPC macOS](/id/platforms/mac/xpc)                                                             |
| Mengambil log                              | [Logging macOS](/id/platforms/mac/logging)                                                     |
| Build dari sumber                         | [Penyiapan pengembangan macOS](/id/platforms/mac/dev-setup)                                    |

## Terkait

- [Platform](/id/platforms)
- [Memulai](/id/start/getting-started)
- [Gateway](/id/gateway)
- [Persetujuan exec](/id/tools/exec-approvals)
