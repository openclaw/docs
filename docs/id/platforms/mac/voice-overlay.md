---
read_when:
    - Menyesuaikan perilaku overlay suara
summary: Siklus hidup lapisan suara saat kata pemicu dan tekan-untuk-bicara tumpang tindih
title: Overlay suara
x-i18n:
    generated_at: "2026-05-06T09:20:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b30f50512e557bd5a50f0e4e8b7955a847b3b554694347d56638581fcda9514
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Siklus Hidup Overlay Suara (macOS)

Audiens: kontributor aplikasi macOS. Tujuan: menjaga overlay suara tetap dapat diprediksi saat kata pemicu dan push-to-talk tumpang tindih.

## Maksud saat ini

- Jika overlay sudah terlihat dari kata pemicu dan pengguna menekan hotkey, sesi hotkey _mengadopsi_ teks yang sudah ada alih-alih mengatur ulangnya. Overlay tetap tampil selama hotkey ditahan. Saat pengguna melepas: kirim jika ada teks yang sudah dipangkas, jika tidak tutup.
- Kata pemicu saja tetap mengirim otomatis saat senyap; push-to-talk mengirim langsung saat dilepas.

## Diimplementasikan (9 Des 2025)

- Sesi overlay kini membawa token per penangkapan (kata pemicu atau push-to-talk). Pembaruan parsial/final/kirim/tutup/level dibuang saat token tidak cocok, sehingga menghindari callback lama.
- Push-to-talk mengadopsi teks overlay apa pun yang terlihat sebagai prefiks (jadi menekan hotkey saat overlay pemicu aktif akan mempertahankan teks dan menambahkan ucapan baru). Ini menunggu hingga 1,5 dtk untuk transkrip final sebelum kembali memakai teks saat ini.
- Pencatatan chime/overlay dipancarkan pada `info` dalam kategori `voicewake.overlay`, `voicewake.ptt`, dan `voicewake.chime` (awal sesi, parsial, final, kirim, tutup, alasan chime).

## Langkah berikutnya

1. **VoiceSessionCoordinator (aktor)**
   - Memiliki tepat satu `VoiceSession` pada satu waktu.
   - API (berbasis token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Membuang callback yang membawa token lama (mencegah recognizer lama membuka ulang overlay).
2. **VoiceSession (model)**
   - Field: `token`, `source` (wakeWord|pushToTalk), teks committed/volatile, flag chime, timer (kirim otomatis, idle), `overlayMode` (display|editing|sending), tenggat cooldown.
3. **Pengikatan overlay**
   - `VoiceSessionPublisher` (`ObservableObject`) mencerminkan sesi aktif ke SwiftUI.
   - `VoiceWakeOverlayView` merender hanya melalui publisher; ini tidak pernah memutasi singleton global secara langsung.
   - Tindakan pengguna overlay (`sendNow`, `dismiss`, `edit`) memanggil kembali coordinator dengan token sesi.
4. **Jalur kirim terpadu**
   - Pada `endCapture`: jika teks yang dipangkas kosong → tutup; jika tidak `performSend(session:)` (memutar chime kirim sekali, meneruskan, menutup).
   - Push-to-talk: tanpa jeda; kata pemicu: jeda opsional untuk kirim otomatis.
   - Terapkan cooldown singkat ke runtime pemicu setelah push-to-talk selesai agar kata pemicu tidak langsung terpicu lagi.
5. **Pencatatan**
   - Coordinator memancarkan log `.info` dalam subsistem `ai.openclaw`, kategori `voicewake.overlay` dan `voicewake.chime`.
   - Peristiwa kunci: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Daftar periksa debug

- Streaming log saat mereproduksi overlay yang macet:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verifikasi hanya ada satu token sesi aktif; callback lama harus dibuang oleh coordinator.
- Pastikan pelepasan push-to-talk selalu memanggil `endCapture` dengan token aktif; jika teks kosong, harapkan `dismiss` tanpa chime atau pengiriman.

## Langkah migrasi (disarankan)

1. Tambahkan `VoiceSessionCoordinator`, `VoiceSession`, dan `VoiceSessionPublisher`.
2. Refactor `VoiceWakeRuntime` untuk membuat/memperbarui/mengakhiri sesi alih-alih menyentuh `VoiceWakeOverlayController` secara langsung.
3. Refactor `VoicePushToTalk` untuk mengadopsi sesi yang ada dan memanggil `endCapture` saat dilepas; terapkan cooldown runtime.
4. Hubungkan `VoiceWakeOverlayController` ke publisher; hapus panggilan langsung dari runtime/PTT.
5. Tambahkan pengujian integrasi untuk adopsi sesi, cooldown, dan penutupan teks kosong.

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [Pemicu suara (macOS)](/id/platforms/mac/voicewake)
- [Mode bicara](/id/nodes/talk)
