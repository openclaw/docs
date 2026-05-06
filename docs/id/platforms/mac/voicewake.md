---
read_when:
    - Mengerjakan jalur aktivasi suara atau PTT
summary: Mode pengaktifan suara dan tekan untuk bicara serta detail perutean di aplikasi Mac
title: Aktivasi suara (macOS)
x-i18n:
    generated_at: "2026-05-06T09:20:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 312895b5767c447233bd77cbcd48ea81bb6c700080abc31974188b610a1b1ef0
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Aktivasi Suara & Tekan-untuk-Bicara

## Mode

- **Mode kata pemicu** (default): pengenal Speech yang selalu aktif menunggu token pemicu (`swabbleTriggerWords`). Saat cocok, ia mulai menangkap, menampilkan overlay dengan teks parsial, dan mengirim otomatis setelah hening.
- **Tekan-untuk-bicara (tahan Option kanan)**: tahan tombol Option kanan untuk langsung menangkap—tanpa perlu pemicu. Overlay muncul saat ditahan; melepasnya akan memfinalisasi dan meneruskan setelah jeda singkat agar Anda dapat menyesuaikan teks.

## Perilaku runtime (kata pemicu)

- Pengenal Speech berada di `VoiceWakeRuntime`.
- Pemicu hanya aktif saat ada **jeda bermakna** antara kata pemicu dan kata berikutnya (celah ~0,55 dtk). Overlay/chime dapat mulai pada jeda tersebut bahkan sebelum perintah dimulai.
- Jendela hening: 2,0 dtk saat ucapan sedang mengalir, 5,0 dtk jika hanya pemicu yang terdengar.
- Penghentian paksa: 120 dtk untuk mencegah sesi berjalan liar.
- Debounce antar sesi: 350 md.
- Overlay digerakkan melalui `VoiceWakeOverlayController` dengan pewarnaan committed/volatile.
- Setelah pengiriman, pengenal dimulai ulang dengan bersih untuk mendengarkan pemicu berikutnya.

## Invarian siklus hidup

- Jika Voice Wake diaktifkan dan izin diberikan, pengenal kata pemicu harus mendengarkan (kecuali selama penangkapan tekan-untuk-bicara eksplisit).
- Visibilitas overlay (termasuk penutupan manual melalui tombol X) tidak boleh pernah mencegah pengenal untuk melanjutkan.

## Mode kegagalan overlay lengket (sebelumnya)

Sebelumnya, jika overlay macet terlihat dan Anda menutupnya secara manual, Voice Wake dapat tampak "mati" karena upaya mulai ulang runtime dapat diblokir oleh visibilitas overlay dan tidak ada mulai ulang berikutnya yang dijadwalkan.

Pengerasan:

- Mulai ulang runtime wake tidak lagi diblokir oleh visibilitas overlay.
- Penyelesaian penutupan overlay memicu `VoiceWakeRuntime.refresh(...)` melalui `VoiceSessionCoordinator`, sehingga penutupan manual dengan X selalu melanjutkan pendengaran.

## Detail tekan-untuk-bicara

- Deteksi hotkey menggunakan monitor global `.flagsChanged` untuk **Option kanan** (`keyCode 61` + `.option`). Kami hanya mengamati peristiwa (tanpa menelannya).
- Pipeline penangkapan berada di `VoicePushToTalk`: langsung memulai Speech, mengalirkan parsial ke overlay, dan memanggil `VoiceWakeForwarder` saat dilepas.
- Saat tekan-untuk-bicara dimulai, kami menjeda runtime kata pemicu untuk menghindari tap audio yang saling bersaing; runtime dimulai ulang otomatis setelah dilepas.
- Izin: memerlukan Mikrofon + Speech; melihat peristiwa memerlukan persetujuan Accessibility/Input Monitoring.
- Keyboard eksternal: beberapa mungkin tidak mengekspos Option kanan seperti yang diharapkan—tawarkan pintasan cadangan jika pengguna melaporkan terlewat.

## Pengaturan yang terlihat pengguna

- Toggle **Voice Wake**: mengaktifkan runtime kata pemicu.
- **Tahan Cmd+Fn untuk berbicara**: mengaktifkan monitor tekan-untuk-bicara. Dinonaktifkan pada macOS < 26.
- Pemilih bahasa & mikrofon, meter level langsung, tabel kata pemicu, penguji (hanya lokal; tidak meneruskan).
- Pemilih mikrofon mempertahankan pilihan terakhir jika perangkat terputus, menampilkan petunjuk terputus, dan sementara beralih ke default sistem sampai perangkat kembali.
- **Suara**: chime saat pemicu terdeteksi dan saat pengiriman; default ke suara sistem macOS "Glass". Anda dapat memilih file apa pun yang dapat dimuat `NSSound` (mis. MP3/WAV/AIFF) untuk tiap peristiwa atau memilih **Tanpa Suara**.

## Perilaku penerusan

- Saat Voice Wake diaktifkan, transkrip diteruskan ke gateway/agen aktif (mode lokal vs jarak jauh yang sama dengan bagian lain aplikasi Mac).
- Balasan dikirimkan ke **penyedia utama terakhir digunakan** (WhatsApp/Telegram/Discord/WebChat). Jika pengiriman gagal, kesalahan dicatat dan run tetap terlihat melalui WebChat/log sesi.

## Payload penerusan

- `VoiceWakeForwarder.prefixedTranscript(_:)` menambahkan petunjuk mesin di awal sebelum mengirim. Dibagikan antara jalur kata pemicu dan tekan-untuk-bicara.

## Verifikasi cepat

- Aktifkan tekan-untuk-bicara, tahan Cmd+Fn, bicara, lepaskan: overlay seharusnya menampilkan parsial lalu mengirim.
- Saat ditahan, telinga bilah menu harus tetap membesar (menggunakan `triggerVoiceEars(ttl:nil)`); ukurannya turun setelah dilepas.

## Terkait

- [Aktivasi suara](/id/nodes/voicewake)
- [Overlay suara](/id/platforms/mac/voice-overlay)
- [Aplikasi macOS](/id/platforms/macos)
