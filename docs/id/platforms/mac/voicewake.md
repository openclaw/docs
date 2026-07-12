---
read_when:
    - Mengerjakan jalur aktivasi suara atau PTT
summary: Mode aktivasi suara dan tekan-untuk-bicara serta detail perutean di aplikasi Mac
title: Pemicu suara (macOS)
x-i18n:
    generated_at: "2026-07-12T14:22:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Aktivasi Suara & Tekan-untuk-Bicara

## Persyaratan

Aktivasi Suara dan tekan-untuk-bicara memerlukan macOS 26 atau yang lebih baru. Pada macOS versi lama, kontrol disembunyikan dari halaman pengaturan Suara, yang sebagai gantinya menampilkan persyaratan macOS 26.

## Mode

- **Mode kata aktivasi** (bawaan): pengenal Ucapan yang selalu aktif menunggu token pemicu (`swabbleTriggerWords`). Saat cocok, pengenal mulai merekam, menampilkan overlay dengan teks sementara, dan mengirim secara otomatis setelah hening.
- **Tekan-untuk-bicara (tahan Option Kanan)**: tahan tombol Option kanan untuk langsung merekam tanpa memerlukan pemicu. Overlay muncul selama tombol ditahan; melepasnya menyelesaikan dan meneruskan rekaman setelah jeda singkat agar Anda dapat mengedit teks.

## Perilaku runtime (kata aktivasi)

- Pengenal berada di `VoiceWakeRuntime`.
- Pemicu hanya aktif jika terdapat jeda yang bermakna antara kata aktivasi dan kata berikutnya (`triggerPauseWindow` = 0.55s). Overlay/nada dapat dimulai saat jeda, bahkan sebelum perintah dimulai.
- Rentang keheningan: 2.0 detik (`silenceWindow`) saat ucapan mengalir, 5.0 detik (`triggerOnlySilenceWindow`) jika hanya pemicu yang terdengar.
- Penghentian paksa: 120 detik (`captureHardStop`) untuk mencegah sesi berjalan tanpa terkendali.
- Debounce antarsesi: 350 milidetik (`debounceAfterSend`) setelah pengiriman.
- Overlay dikendalikan melalui `VoiceWakeOverlayController`, dengan pewarnaan teks tetap/sementara.
- Setelah pengiriman, pengenal dimulai ulang dengan bersih untuk mendengarkan pemicu berikutnya.

## Invarian siklus hidup

- Jika Aktivasi Suara diaktifkan dan izin diberikan, pengenal kata aktivasi tetap mendengarkan, kecuali selama perekaman tekan-untuk-bicara aktif.
- Penutupan overlay, termasuk penutupan manual melalui tombol X, selalu melanjutkan pengenal: `VoiceSessionCoordinator.overlayDidDismiss` memanggil `VoiceWakeRuntime.refresh(state:)` pada setiap jalur penutupan. Lihat [Overlay suara](/id/platforms/mac/voice-overlay) untuk model sesi/token.

## Detail tekan-untuk-bicara

- Deteksi tombol pintas menggunakan pemantau global `.flagsChanged` untuk Option kanan (`keyCode 61` + `.option`). Pemantau hanya mengamati peristiwa dan tidak pernah memblokirnya.
- Perekaman berada di `VoicePushToTalk`: langsung memulai Ucapan, mengalirkan hasil sementara ke overlay, dan memanggil `VoiceWakeForwarder` saat tombol dilepas.
- Memulai tekan-untuk-bicara menjeda runtime kata aktivasi untuk menghindari perebutan akses audio; runtime dimulai ulang secara otomatis setelah tombol dilepas.
- Izin: memerlukan Mikrofon + Ucapan; menerima peristiwa tombol memerlukan persetujuan Accessibility/Input Monitoring.
- Papan ketik eksternal: beberapa tidak mengekspos Option kanan sebagaimana mestinya. Tawarkan pintasan alternatif jika pengguna melaporkan kegagalan deteksi.

## Pengaturan yang terlihat oleh pengguna

- Tombol alih **Aktivasi Suara**: mengaktifkan runtime kata aktivasi.
- **Tahan Option Kanan untuk berbicara**: mengaktifkan pemantau tekan-untuk-bicara.
- Pemilih bahasa dan mikrofon, pengukur tingkat langsung, tabel kata pemicu, dan alat penguji (hanya lokal, tidak pernah meneruskan).
- Pemilih mikrofon mempertahankan pilihan terakhir jika perangkat terputus, menampilkan petunjuk terputus, dan untuk sementara beralih ke perangkat bawaan sistem hingga perangkat tersebut kembali.
- **Suara**: nada saat pemicu terdeteksi dan saat pengiriman, dengan suara sistem macOS "Glass" sebagai bawaan. Pilih berkas apa pun yang dapat dimuat oleh `NSSound` (misalnya MP3/WAV/AIFF) untuk setiap peristiwa, atau pilih **Tanpa Suara**.

## Perilaku penerusan

- Saat meneruskan, `VoiceWakeForwarder.selectedSessionOptions` memilih kunci sesi WebChat aktif jika telah ditetapkan; jika tidak, kunci sesi utama Gateway.
- Fungsi ini mencari sesi tersebut melalui `sessions.list` dan memperoleh saluran serta target pengiriman dari konteks pengiriman sesi (dengan cadangan ke saluran/target terakhirnya, lalu ke kunci sesi yang diurai), dengan WebChat sebagai bawaan jika tidak ada yang dapat ditentukan.
- Jika pengiriman gagal, galat dicatat (kategori `voicewake.forward`) dan proses tetap terlihat melalui log WebChat/sesi.

## Muatan penerusan

- `VoiceWakeForwarder.prefixedTranscript(_:)` menambahkan baris petunjuk mesin (nama host yang ditentukan, dengan cadangan ke "Mac ini") sebelum transkrip, yang digunakan bersama oleh jalur kata aktivasi dan tekan-untuk-bicara.

## Verifikasi cepat

- Aktifkan tekan-untuk-bicara, tahan Option Kanan, berbicara, lalu lepaskan: overlay seharusnya menampilkan hasil sementara, kemudian mengirimkannya.
- Selama tombol ditahan, ikon telinga di bilah menu seharusnya tetap membesar (`triggerVoiceEars(ttl: nil)`); ikon mengecil setelah tombol dilepas.

## Terkait

- [Aktivasi suara](/id/nodes/voicewake)
- [Overlay suara](/id/platforms/mac/voice-overlay)
- [Aplikasi macOS](/id/platforms/macos)
