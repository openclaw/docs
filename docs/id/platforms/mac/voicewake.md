---
read_when:
    - Mengerjakan jalur voice wake atau PTT
summary: Mode voice wake dan push-to-talk beserta detail peruteannya di aplikasi Mac
title: Voice wake (macOS)
x-i18n:
    generated_at: "2026-04-24T09:17:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0273c24764f0baf440a19f31435d6ee62ab040c1ec5a97d7733d3ec8b81b0641
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Voice Wake & Push-to-Talk

## Mode

- **Mode wake-word** (default): recognizer Speech yang selalu aktif menunggu token pemicu (`swabbleTriggerWords`). Saat cocok, ia memulai capture, menampilkan overlay dengan teks parsial, dan mengirim otomatis setelah hening.
- **Push-to-talk (tahan Right Option)**: tahan tombol Option kanan untuk langsung merekam—tanpa pemicu. Overlay muncul selama ditahan; saat dilepas, hasil difinalkan dan diteruskan setelah jeda singkat agar Anda bisa menyesuaikan teks.

## Perilaku runtime (wake-word)

- Recognizer Speech hidup di `VoiceWakeRuntime`.
- Pemicu hanya aktif ketika ada **jeda yang bermakna** antara wake word dan kata berikutnya (~0,55 dtk). Overlay/chime dapat dimulai pada jeda tersebut bahkan sebelum perintah dimulai.
- Jendela hening: 2,0 dtk saat ucapan sedang mengalir, 5,0 dtk jika hanya pemicu yang terdengar.
- Batas keras: 120 dtk untuk mencegah sesi yang tak terkendali.
- Debounce antar sesi: 350 md.
- Overlay dikendalikan melalui `VoiceWakeOverlayController` dengan pewarnaan committed/volatile.
- Setelah pengiriman, recognizer dimulai ulang dengan bersih untuk mendengarkan pemicu berikutnya.

## Invarian siklus hidup

- Jika Voice Wake diaktifkan dan izin telah diberikan, recognizer wake-word seharusnya sedang mendengarkan (kecuali selama capture push-to-talk yang eksplisit).
- Visibilitas overlay (termasuk penutupan manual melalui tombol X) tidak boleh mencegah recognizer melanjutkan.

## Mode kegagalan overlay lengket (sebelumnya)

Sebelumnya, jika overlay tersangkut tetap terlihat dan Anda menutupnya secara manual, Voice Wake bisa tampak “mati” karena upaya restart runtime dapat terblokir oleh visibilitas overlay dan tidak ada restart berikutnya yang dijadwalkan.

Penguatan:

- Restart runtime wake tidak lagi diblokir oleh visibilitas overlay.
- Penyelesaian dismiss overlay memicu `VoiceWakeRuntime.refresh(...)` melalui `VoiceSessionCoordinator`, sehingga dismiss manual dengan X selalu melanjutkan mode mendengarkan.

## Kekhususan push-to-talk

- Deteksi hotkey menggunakan monitor global `.flagsChanged` untuk **Right Option** (`keyCode 61` + `.option`). Kami hanya mengamati event (tidak menelannya).
- Pipeline capture berada di `VoicePushToTalk`: langsung memulai Speech, mengalirkan parsial ke overlay, dan memanggil `VoiceWakeForwarder` saat dilepas.
- Saat push-to-talk dimulai, kami menjeda runtime wake-word untuk menghindari audio tap yang saling berebut; runtime akan dimulai ulang otomatis setelah dilepas.
- Izin: memerlukan Microphone + Speech; untuk melihat event dibutuhkan persetujuan Accessibility/Input Monitoring.
- Keyboard eksternal: beberapa mungkin tidak mengekspos Right Option seperti yang diharapkan—sediakan shortcut fallback jika pengguna melaporkan ada yang terlewat.

## Pengaturan yang terlihat oleh pengguna

- Toggle **Voice Wake**: mengaktifkan runtime wake-word.
- **Hold Cmd+Fn to talk**: mengaktifkan monitor push-to-talk. Dinonaktifkan di macOS < 26.
- Pemilih bahasa & mic, meter level live, tabel trigger-word, tester (hanya lokal; tidak meneruskan).
- Pemilih mic mempertahankan pilihan terakhir jika perangkat terputus, menampilkan petunjuk terputus, dan sementara fallback ke default sistem sampai perangkat kembali.
- **Sounds**: chime saat pemicu terdeteksi dan saat pengiriman; default ke suara sistem macOS “Glass”. Anda dapat memilih file apa pun yang dapat dimuat `NSSound` (mis. MP3/WAV/AIFF) untuk tiap event atau memilih **No Sound**.

## Perilaku penerusan

- Saat Voice Wake diaktifkan, transkrip diteruskan ke gateway/agen aktif (mode lokal vs remote yang sama dengan yang digunakan oleh aplikasi Mac lainnya).
- Balasan dikirim ke **provider utama yang terakhir digunakan** (WhatsApp/Telegram/Discord/WebChat). Jika pengiriman gagal, galat dicatat ke log dan run tetap terlihat melalui log WebChat/sesi.

## Payload penerusan

- `VoiceWakeForwarder.prefixedTranscript(_:)` menambahkan petunjuk mesin di depan sebelum mengirim. Digunakan bersama antara jalur wake-word dan push-to-talk.

## Verifikasi cepat

- Aktifkan push-to-talk, tahan Cmd+Fn, bicara, lalu lepaskan: overlay seharusnya menampilkan parsial lalu mengirim.
- Saat menahan, telinga di menu bar seharusnya tetap membesar (menggunakan `triggerVoiceEars(ttl:nil)`); ukurannya turun setelah dilepas.

## Terkait

- [Voice wake](/id/nodes/voicewake)
- [Voice overlay](/id/platforms/mac/voice-overlay)
- [macOS app](/id/platforms/macos)
