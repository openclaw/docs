---
read_when:
    - Mengerjakan jalur voice wake atau PTT
summary: Mode voice wake dan push-to-talk beserta detail routing di aplikasi Mac
title: Voice Wake (macOS)
x-i18n:
    generated_at: "2026-04-05T14:00:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: fed6524a2e1fad5373d34821c920b955a2b5a3fcd9c51cdb97cf4050536602a7
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Voice Wake & Push-to-Talk

## Mode

- **Mode wake-word** (default): pengenal Speech yang selalu aktif menunggu token pemicu (`swabbleTriggerWords`). Saat cocok, mode ini memulai capture, menampilkan overlay dengan teks parsial, dan mengirim otomatis setelah hening.
- **Push-to-talk (tahan Option kanan)**: tahan tombol Option kanan untuk langsung menangkap—tanpa perlu pemicu. Overlay muncul selama tombol ditahan; saat dilepas, hasil difinalisasi dan diteruskan setelah jeda singkat agar Anda dapat menyesuaikan teks.

## Perilaku runtime (wake-word)

- Pengenal Speech berada di `VoiceWakeRuntime`.
- Pemicu hanya aktif saat ada **jeda yang bermakna** antara wake word dan kata berikutnya (jarak ~0,55 dtk). Overlay/chime dapat mulai saat jeda bahkan sebelum perintah dimulai.
- Jendela hening: 2,0 dtk saat ucapan terus mengalir, 5,0 dtk jika hanya pemicu yang terdengar.
- Penghentian paksa: 120 dtk untuk mencegah sesi yang tak terkendali.
- Debounce antar sesi: 350 md.
- Overlay dikendalikan melalui `VoiceWakeOverlayController` dengan pewarnaan committed/volatile.
- Setelah pengiriman, pengenal dimulai ulang dengan bersih untuk mendengarkan pemicu berikutnya.

## Invarian siklus hidup

- Jika Voice Wake diaktifkan dan izin telah diberikan, pengenal wake-word harus tetap mendengarkan (kecuali selama capture push-to-talk yang eksplisit).
- Visibilitas overlay (termasuk penutupan manual melalui tombol X) tidak boleh pernah mencegah pengenal melanjutkan.

## Mode kegagalan overlay lengket (sebelumnya)

Sebelumnya, jika overlay macet dalam keadaan terlihat dan Anda menutupnya secara manual, Voice Wake dapat tampak “mati” karena upaya restart runtime dapat terblokir oleh visibilitas overlay dan tidak ada restart berikutnya yang dijadwalkan.

Penguatan:

- Restart runtime wake tidak lagi diblokir oleh visibilitas overlay.
- Penyelesaian penutupan overlay memicu `VoiceWakeRuntime.refresh(...)` melalui `VoiceSessionCoordinator`, sehingga penutupan manual dengan X selalu melanjutkan pendengaran.

## Rincian push-to-talk

- Deteksi hotkey menggunakan monitor global `.flagsChanged` untuk **Option kanan** (`keyCode 61` + `.option`). Kami hanya mengamati event (tanpa mencegatnya).
- Pipeline capture berada di `VoicePushToTalk`: segera memulai Speech, mengalirkan hasil parsial ke overlay, lalu memanggil `VoiceWakeForwarder` saat tombol dilepas.
- Saat push-to-talk dimulai, kami menjeda runtime wake-word untuk menghindari audio tap yang saling bertabrakan; runtime akan dimulai ulang secara otomatis setelah dilepas.
- Izin: memerlukan Microphone + Speech; untuk melihat event memerlukan persetujuan Accessibility/Input Monitoring.
- Keyboard eksternal: beberapa mungkin tidak mengekspos Option kanan seperti yang diharapkan—sediakan pintasan fallback jika pengguna melaporkan ada yang terlewat.

## Pengaturan yang terlihat oleh pengguna

- Toggle **Voice Wake**: mengaktifkan runtime wake-word.
- **Hold Cmd+Fn to talk**: mengaktifkan monitor push-to-talk. Dinonaktifkan pada macOS < 26.
- Pemilih bahasa & mic, meter level live, tabel trigger-word, tester (hanya lokal; tidak meneruskan).
- Pemilih mic mempertahankan pilihan terakhir jika perangkat terputus, menampilkan petunjuk bahwa perangkat terputus, dan sementara fallback ke default sistem hingga perangkat kembali.
- **Sounds**: chime saat pemicu terdeteksi dan saat pengiriman; default-nya adalah suara sistem macOS “Glass”. Anda dapat memilih file apa pun yang dapat dimuat `NSSound` (mis. MP3/WAV/AIFF) untuk setiap event atau memilih **No Sound**.

## Perilaku penerusan

- Saat Voice Wake diaktifkan, transkrip diteruskan ke gateway/agent aktif (mode lokal vs jarak jauh yang sama seperti yang digunakan oleh bagian lain aplikasi Mac).
- Balasan dikirim ke **penyedia utama yang terakhir digunakan** (WhatsApp/Telegram/Discord/WebChat). Jika pengiriman gagal, kesalahan akan dicatat dalam log dan run tetap terlihat melalui WebChat/log sesi.

## Payload penerusan

- `VoiceWakeForwarder.prefixedTranscript(_:)` menambahkan petunjuk mesin di depan sebelum pengiriman. Digunakan bersama oleh jalur wake-word dan push-to-talk.

## Verifikasi cepat

- Aktifkan push-to-talk, tahan Cmd+Fn, bicara, lalu lepaskan: overlay harus menampilkan hasil parsial lalu mengirim.
- Saat ditahan, ears di menu bar harus tetap membesar (menggunakan `triggerVoiceEars(ttl:nil)`); ukurannya kembali turun setelah dilepas.
