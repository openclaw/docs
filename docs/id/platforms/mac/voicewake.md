---
read_when:
    - Bekerja pada jalur bangun suara atau PTT
summary: Mode bangun suara dan push-to-talk serta detail perutean di aplikasi Mac
title: Pengaktifan suara (macOS)
x-i18n:
    generated_at: "2026-06-27T17:43:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33c6132d03efb837ae06f4810ff87eb981ad742d793657bc607f4ec214bc2afa
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Aktivasi Suara & Tekan-untuk-Bicara

## Persyaratan

Aktivasi Suara dan tekan-untuk-bicara memerlukan macOS 26 atau yang lebih baru. Pada versi macOS yang lebih lama,
kontrol disembunyikan dari halaman pengaturan Suara, yang menampilkan persyaratan macOS 26.

## Mode

- **Mode kata pemicu** (default): pengenal ucapan yang selalu aktif menunggu token pemicu (`swabbleTriggerWords`). Saat cocok, ia memulai perekaman, menampilkan overlay dengan teks parsial, dan mengirim otomatis setelah hening.
- **Tekan-untuk-bicara (tahan Option Kanan)**: tahan tombol Option kanan untuk langsung merekam—tanpa pemicu. Overlay muncul saat ditahan; melepas tombol akan menyelesaikan dan meneruskan setelah jeda singkat agar Anda dapat menyesuaikan teks.

## Perilaku runtime (kata pemicu)

- Pengenal ucapan berada di `VoiceWakeRuntime`.
- Pemicu hanya aktif ketika ada **jeda bermakna** antara kata pemicu dan kata berikutnya (jarak ~0,55 dtk). Overlay/lonceng dapat dimulai saat jeda bahkan sebelum perintah dimulai.
- Jendela hening: 2,0 dtk saat ucapan sedang mengalir, 5,0 dtk jika hanya pemicu yang terdengar.
- Penghentian paksa: 120 dtk untuk mencegah sesi berjalan tak terkendali.
- Debounce antar sesi: 350 md.
- Overlay dikendalikan melalui `VoiceWakeOverlayController` dengan pewarnaan committed/volatile.
- Setelah dikirim, pengenal dimulai ulang dengan bersih untuk mendengarkan pemicu berikutnya.

## Invarian siklus hidup

- Jika Aktivasi Suara diaktifkan dan izin diberikan, pengenal kata pemicu seharusnya sedang mendengarkan (kecuali selama perekaman tekan-untuk-bicara eksplisit).
- Visibilitas overlay (termasuk penutupan manual melalui tombol X) tidak boleh pernah mencegah pengenal untuk melanjutkan.

## Mode kegagalan overlay lengket (sebelumnya)

Sebelumnya, jika overlay macet tetap terlihat dan Anda menutupnya secara manual, Aktivasi Suara dapat terlihat "mati" karena upaya mulai ulang runtime dapat diblokir oleh visibilitas overlay dan tidak ada mulai ulang berikutnya yang dijadwalkan.

Pengerasan:

- Mulai ulang runtime aktivasi tidak lagi diblokir oleh visibilitas overlay.
- Penyelesaian penutupan overlay memicu `VoiceWakeRuntime.refresh(...)` melalui `VoiceSessionCoordinator`, sehingga penutupan manual dengan X selalu melanjutkan pendengaran.

## Detail tekan-untuk-bicara

- Deteksi hotkey menggunakan monitor `.flagsChanged` global untuk **Option kanan** (`keyCode 61` + `.option`). Kami hanya mengamati peristiwa (tidak menelan).
- Pipeline perekaman berada di `VoicePushToTalk`: memulai Speech segera, mengalirkan parsial ke overlay, dan memanggil `VoiceWakeForwarder` saat dilepas.
- Saat tekan-untuk-bicara dimulai, kami menjeda runtime kata pemicu untuk menghindari audio tap yang saling bersaing; runtime dimulai ulang otomatis setelah dilepas.
- Izin: memerlukan Mikrofon + Speech; melihat peristiwa memerlukan persetujuan Aksesibilitas/Pemantauan Input.
- Keyboard eksternal: beberapa mungkin tidak mengekspos Option kanan seperti yang diharapkan—tawarkan pintasan fallback jika pengguna melaporkan ada yang terlewat.

## Pengaturan yang terlihat pengguna

- Toggle **Aktivasi Suara**: mengaktifkan runtime kata pemicu.
- **Tahan Option Kanan untuk bicara**: mengaktifkan monitor tekan-untuk-bicara.
- Pemilih bahasa & mikrofon, pengukur level langsung, tabel kata pemicu, penguji (hanya lokal; tidak meneruskan).
- Pemilih mikrofon mempertahankan pilihan terakhir jika perangkat terputus, menampilkan petunjuk terputus, dan sementara kembali ke default sistem hingga perangkat kembali.
- **Suara**: lonceng saat pemicu terdeteksi dan saat mengirim; default ke suara sistem macOS "Glass". Anda dapat memilih file apa pun yang dapat dimuat `NSSound` (mis. MP3/WAV/AIFF) untuk setiap peristiwa atau memilih **Tanpa Suara**.

## Perilaku penerusan

- Saat Aktivasi Suara diaktifkan, transkrip diteruskan ke Gateway/agen aktif (mode lokal vs jarak jauh yang sama dengan yang digunakan bagian lain aplikasi Mac).
- Balasan dikirim ke **penyedia utama terakhir digunakan** (WhatsApp/Telegram/Discord/WebChat). Jika pengiriman gagal, kesalahan dicatat dan run tetap terlihat melalui WebChat/log sesi.

## Payload penerusan

- `VoiceWakeForwarder.prefixedTranscript(_:)` menambahkan petunjuk mesin di awal sebelum mengirim. Digunakan bersama oleh jalur kata pemicu dan tekan-untuk-bicara.

## Verifikasi cepat

- Aktifkan tekan-untuk-bicara, tahan Option Kanan, bicara, lepaskan: overlay seharusnya menampilkan parsial lalu mengirim.
- Saat menahan, telinga di bilah menu seharusnya tetap membesar (menggunakan `triggerVoiceEars(ttl:nil)`); telinga mengecil setelah dilepas.

## Terkait

- [Aktivasi suara](/id/nodes/voicewake)
- [Overlay suara](/id/platforms/mac/voice-overlay)
- [Aplikasi macOS](/id/platforms/macos)
