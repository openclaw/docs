---
read_when:
    - Menyesuaikan perilaku overlay suara
summary: Siklus hidup overlay suara saat kata pemicu dan tekan-untuk-bicara tumpang tindih
title: Hamparan suara
x-i18n:
    generated_at: "2026-07-12T14:23:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Siklus Hidup Overlay Suara (macOS)

Audiens: kontributor aplikasi macOS. Tujuan: menjaga agar overlay suara berperilaku konsisten saat kata pemicu dan tekan-untuk-bicara bertumpang tindih.

## Perilaku

- Jika overlay sudah terlihat karena kata pemicu dan pengguna menekan tombol pintas, sesi tombol pintas menggunakan teks yang sudah ada alih-alih mengatur ulang teks tersebut. Overlay tetap ditampilkan selama tombol pintas ditahan. Saat dilepas: kirim jika terdapat teks yang telah dipangkas, jika tidak, tutup.
- Kata pemicu saja tetap mengirim secara otomatis ketika hening; tekan-untuk-bicara langsung mengirim saat dilepas.

## Implementasi

- `VoiceSessionCoordinator` (`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`) adalah satu-satunya pemilik sesi suara aktif. Ini merupakan singleton `@MainActor @Observable`, bukan actor. API: `startSession`, `updatePartial`, `finalize`, `sendNow`, `dismiss`, `updateLevel`, `snapshot`. Setiap sesi membawa token `UUID`; panggilan dengan token kedaluwarsa atau tidak cocok akan diabaikan.
- `VoiceWakeOverlayController` (`VoiceWakeOverlayController+Session.swift`) merender overlay dan meneruskan tindakan pengguna (`requestSend`, `dismiss`) kembali melalui koordinator menggunakan token sesi. Komponen ini tidak pernah memiliki status sesi itu sendiri.
- Tekan-untuk-bicara (`VoicePushToTalk.begin()`) menggunakan teks overlay yang terlihat sebagai `adoptedPrefix` (melalui `VoiceSessionCoordinator.shared.snapshot()`), sehingga menekan tombol pintas saat overlay pemicu suara ditampilkan akan mempertahankan teks dan menambahkan ucapan baru. Saat dilepas, fitur ini menunggu hingga 1,5 detik untuk transkrip final sebelum menggunakan teks saat ini sebagai alternatif.
- Saat `dismiss`, overlay memanggil `VoiceSessionCoordinator.overlayDidDismiss`, yang memicu `VoiceWakeRuntime.refresh(state:)` sehingga penutupan manual dengan X, penutupan karena teks kosong, dan penutupan setelah pengiriman semuanya melanjutkan pemantauan kata pemicu.
- Jalur pengiriman terpadu: jika teks yang telah dipangkas kosong, tutup; jika tidak, `sendNow` memutar bunyi pengiriman satu kali, meneruskan melalui `VoiceWakeForwarder`, lalu menutup overlay.

## Pencatatan log

Subsistem suara adalah `ai.openclaw`; setiap komponen mencatat log dalam kategorinya sendiri:

| Kategori                | Komponen                                        |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | Tombol pintas dan perekaman tekan-untuk-bicara  |
| `voicewake.runtime`     | Runtime kata pemicu                             |
| `voicewake.chime`       | Pemutaran bunyi                                 |
| `voicewake.sync`        | Sinkronisasi pengaturan global                  |
| `voicewake.forward`     | Penerusan transkrip                             |
| `voicewake.meter`       | Pemantau tingkat mikrofon                       |

## Daftar periksa pengawakutuan

- Alirkan log saat mereproduksi overlay yang tidak tertutup:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Pastikan hanya ada satu token sesi aktif; panggilan balik kedaluwarsa akan diabaikan oleh koordinator.
- Pastikan pelepasan tekan-untuk-bicara selalu memanggil `end()` dengan token aktif; jika teks kosong, overlay seharusnya ditutup tanpa bunyi atau pengiriman.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Pemicu suara (macOS)](/id/platforms/mac/voicewake)
- [Mode bicara](/id/nodes/talk)
