---
read_when:
    - Menyesuaikan perilaku overlay suara
summary: Siklus hidup overlay suara saat wake-word dan push-to-talk saling tumpang tindih
title: Overlay Suara
x-i18n:
    generated_at: "2026-04-05T14:00:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1efcc26ec05d2f421cb2cf462077d002381995b338d00db77d5fdba9b8d938b6
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Siklus Hidup Overlay Suara (macOS)

Audiens: kontributor app macOS. Tujuan: menjaga overlay suara tetap dapat diprediksi saat wake-word dan push-to-talk saling tumpang tindih.

## Tujuan saat ini

- Jika overlay sudah terlihat karena wake-word dan pengguna menekan hotkey, sesi hotkey _mengadopsi_ teks yang ada alih-alih meresetnya. Overlay tetap tampil selama hotkey ditekan. Saat pengguna melepaskannya: kirim jika ada teks yang sudah di-trim, jika tidak tutup.
- Wake-word saja tetap mengirim otomatis saat senyap; push-to-talk langsung mengirim saat dilepas.

## Sudah diimplementasikan (9 Des 2025)

- Sesi overlay sekarang membawa token per capture (wake-word atau push-to-talk). Update partial/final/send/dismiss/level dibuang saat token tidak cocok, untuk menghindari callback lama.
- Push-to-talk mengadopsi teks overlay yang terlihat sebagai prefix (jadi menekan hotkey saat overlay wake aktif akan mempertahankan teks dan menambahkan ucapan baru). Ini menunggu hingga 1,5 detik untuk transkrip final sebelum fallback ke teks saat ini.
- Logging chime/overlay dikirim pada level `info` dalam kategori `voicewake.overlay`, `voicewake.ptt`, dan `voicewake.chime` (awal sesi, partial, final, send, dismiss, alasan chime).

## Langkah selanjutnya

1. **VoiceSessionCoordinator (actor)**
   - Memiliki tepat satu `VoiceSession` pada satu waktu.
   - API (berbasis token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Membuang callback yang membawa token lama (mencegah recognizer lama membuka kembali overlay).
2. **VoiceSession (model)**
   - Field: `token`, `source` (wakeWord|pushToTalk), teks committed/volatile, flag chime, timer (auto-send, idle), `overlayMode` (display|editing|sending), tenggat cooldown.
3. **Binding overlay**
   - `VoiceSessionPublisher` (`ObservableObject`) mencerminkan sesi aktif ke SwiftUI.
   - `VoiceWakeOverlayView` hanya merender melalui publisher; ini tidak pernah memutasi singleton global secara langsung.
   - Tindakan pengguna overlay (`sendNow`, `dismiss`, `edit`) melakukan callback ke koordinator dengan token sesi.
4. **Jalur kirim terpadu**
   - Pada `endCapture`: jika teks yang sudah di-trim kosong → tutup; jika tidak `performSend(session:)` (memutar chime kirim sekali, meneruskan, menutup).
   - Push-to-talk: tanpa penundaan; wake-word: penundaan opsional untuk auto-send.
   - Terapkan cooldown singkat pada runtime wake setelah push-to-talk selesai agar wake-word tidak langsung terpicu lagi.
5. **Logging**
   - Koordinator mengirim log `.info` dalam subsystem `ai.openclaw`, kategori `voicewake.overlay` dan `voicewake.chime`.
   - Event kunci: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Checklist debugging

- Streaming log saat mereproduksi overlay yang macet:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verifikasi hanya ada satu token sesi aktif; callback lama harus dibuang oleh koordinator.
- Pastikan pelepasan push-to-talk selalu memanggil `endCapture` dengan token aktif; jika teks kosong, harapkan `dismiss` tanpa chime atau pengiriman.

## Langkah migrasi (disarankan)

1. Tambahkan `VoiceSessionCoordinator`, `VoiceSession`, dan `VoiceSessionPublisher`.
2. Refactor `VoiceWakeRuntime` agar membuat/memperbarui/mengakhiri sesi alih-alih menyentuh `VoiceWakeOverlayController` secara langsung.
3. Refactor `VoicePushToTalk` agar mengadopsi sesi yang ada dan memanggil `endCapture` saat dilepas; terapkan cooldown runtime.
4. Hubungkan `VoiceWakeOverlayController` ke publisher; hapus panggilan langsung dari runtime/PTT.
5. Tambahkan integration test untuk adopsi sesi, cooldown, dan penutupan saat teks kosong.
