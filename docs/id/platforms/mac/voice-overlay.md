---
read_when:
    - Menyesuaikan perilaku overlay suara
summary: Siklus hidup overlay suara saat wake-word dan push-to-talk saling tumpang tindih
title: Overlay suara
x-i18n:
    generated_at: "2026-04-24T09:17:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Siklus Hidup Overlay Suara (macOS)

Audiens: kontributor aplikasi macOS. Tujuan: menjaga overlay suara tetap dapat diprediksi saat wake-word dan push-to-talk saling tumpang tindih.

## Niat saat ini

- Jika overlay sudah terlihat karena wake-word dan pengguna menekan hotkey, sesi hotkey akan _mengadopsi_ teks yang ada alih-alih meresetnya. Overlay tetap tampil selama hotkey ditekan. Saat pengguna melepas: kirim jika ada teks yang sudah di-trim, jika tidak maka tutup.
- Wake-word saja tetap mengirim otomatis saat hening; push-to-talk mengirim segera saat dilepas.

## Sudah diimplementasikan (9 Des 2025)

- Sesi overlay sekarang membawa token per capture (wake-word atau push-to-talk). Pembaruan partial/final/send/dismiss/level dibuang saat token tidak cocok, sehingga callback basi dapat dihindari.
- Push-to-talk mengadopsi teks overlay yang terlihat sebagai prefiks (jadi menekan hotkey saat overlay wake sedang tampil akan mempertahankan teks dan menambahkan ucapan baru). Sistem menunggu hingga 1,5 dtk untuk transkrip final sebelum fallback ke teks saat ini.
- Logging chime/overlay dikeluarkan pada level `info` dalam kategori `voicewake.overlay`, `voicewake.ptt`, dan `voicewake.chime` (mulai sesi, partial, final, kirim, tutup, alasan chime).

## Langkah selanjutnya

1. **VoiceSessionCoordinator (actor)**
   - Memiliki tepat satu `VoiceSession` pada satu waktu.
   - API (berbasis token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Membuang callback yang membawa token basi (mencegah recognizer lama membuka ulang overlay).
2. **VoiceSession (model)**
   - Field: `token`, `source` (`wakeWord|pushToTalk`), teks committed/volatile, flag chime, timer (auto-send, idle), `overlayMode` (`display|editing|sending`), cooldown deadline.
3. **Binding overlay**
   - `VoiceSessionPublisher` (`ObservableObject`) mencerminkan sesi aktif ke SwiftUI.
   - `VoiceWakeOverlayView` hanya merender melalui publisher; view ini tidak pernah memutasi singleton global secara langsung.
   - Aksi pengguna overlay (`sendNow`, `dismiss`, `edit`) memanggil kembali ke coordinator dengan token sesi.
4. **Jalur kirim terpadu**
   - Pada `endCapture`: jika teks yang sudah di-trim kosong → tutup; jika tidak → `performSend(session:)` (memutar send chime sekali, meneruskan, menutup).
   - Push-to-talk: tanpa penundaan; wake-word: penundaan opsional untuk auto-send.
   - Terapkan cooldown singkat ke runtime wake setelah push-to-talk selesai agar wake-word tidak langsung terpicu lagi.
5. **Logging**
   - Coordinator mengeluarkan log `.info` di subsystem `ai.openclaw`, kategori `voicewake.overlay` dan `voicewake.chime`.
   - Peristiwa utama: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Checklist debugging

- Streaming log saat mereproduksi overlay yang macet:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verifikasi hanya ada satu token sesi aktif; callback basi seharusnya dibuang oleh coordinator.
- Pastikan pelepasan push-to-talk selalu memanggil `endCapture` dengan token aktif; jika teks kosong, harapkan `dismiss` tanpa chime atau pengiriman.

## Langkah migrasi (disarankan)

1. Tambahkan `VoiceSessionCoordinator`, `VoiceSession`, dan `VoiceSessionPublisher`.
2. Refaktor `VoiceWakeRuntime` agar membuat/memperbarui/mengakhiri sesi alih-alih menyentuh `VoiceWakeOverlayController` secara langsung.
3. Refaktor `VoicePushToTalk` agar mengadopsi sesi yang ada dan memanggil `endCapture` saat dilepas; terapkan cooldown runtime.
4. Hubungkan `VoiceWakeOverlayController` ke publisher; hapus pemanggilan langsung dari runtime/PTT.
5. Tambahkan integration test untuk adopsi sesi, cooldown, dan penutupan saat teks kosong.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Voice wake (macOS)](/id/platforms/mac/voicewake)
- [Mode Talk](/id/nodes/talk)
