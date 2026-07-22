---
read_when:
    - Mengerjakan jalur aktivasi suara atau PTT
summary: Mode aktivasi suara dan tekan-untuk-bicara serta detail perutean di aplikasi Mac
title: Bangunkan dengan suara (macOS)
x-i18n:
    generated_at: "2026-07-22T01:41:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d3b2a01ee997b4158bf88b9ef54b1e523503722620f943d594323516619e7502
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Pengaktifan Suara & Tekan untuk Bicara

## Persyaratan

Pengaktifan Suara dan tekan untuk bicara memerlukan macOS 26 atau yang lebih baru. Pada macOS versi lama, kontrol disembunyikan dari halaman pengaturan Suara, yang sebagai gantinya menampilkan persyaratan macOS 26.

Pengaktifan Suara memerlukan dukungan Apple Speech untuk pengenalan pada perangkat bagi bahasa yang dipilih. Aplikasi menolak memulai pendengaran kata pemicu pasif ketika kontrak khusus lokal tersebut tidak tersedia; aplikasi tidak pernah beralih ke pengenalan jaringan sebagai cadangan. Tekan untuk bicara, Mode Bicara, dan dikte Obrolan Cepat merupakan tindakan pengguna yang eksplisit dan dapat menggunakan layanan jaringan Apple Speech untuk cakupan bahasa yang lebih luas.

## Mode

- **Mode kata pemicu** (default): pengenal Speech pada perangkat yang selalu aktif menunggu token pemicu (`swabbleTriggerWords`). Jika cocok, pengenal memulai perekaman, menampilkan overlay dengan teks sementara, dan mengirim secara otomatis setelah hening.
- **Tekan untuk bicara (tahan Right Option)**: tahan tombol Option kanan untuk langsung merekam, tanpa memerlukan pemicu. Overlay muncul selama tombol ditahan; melepaskannya akan menyelesaikan dan meneruskan setelah jeda singkat agar Anda dapat mengedit teks.

## Perilaku runtime (kata pemicu)

- Pengenal berada di `VoiceWakeRuntime`.
- Pemicu hanya aktif ketika terdapat jeda yang bermakna antara kata pemicu dan kata berikutnya (`triggerPauseWindow` = 0.55s). Overlay/nada dapat dimulai saat jeda, bahkan sebelum perintah dimulai.
- Jendela keheningan: 2.0s (`silenceWindow`) ketika ucapan sedang berlangsung, 5.0s (`triggerOnlySilenceWindow`) jika hanya pemicu yang terdengar.
- Penghentian paksa: 120s (`captureHardStop`) untuk mencegah sesi berjalan tanpa kendali.
- Debounce antarsesi: 350ms (`debounceAfterSend`) setelah pengiriman.
- Overlay dikendalikan melalui `VoiceWakeOverlayController`, dengan pewarnaan teks tetap/sementara.
- Setelah pengiriman, pengenal dimulai ulang dengan bersih untuk mendengarkan pemicu berikutnya.

## Invarian siklus hidup

- Jika Pengaktifan Suara diaktifkan dan izin diberikan, pengenal kata pemicu tetap mendengarkan, kecuali selama perekaman tekan untuk bicara aktif.
- Penutupan overlay, termasuk penutupan manual melalui tombol X, selalu melanjutkan pengenal: `VoiceSessionCoordinator.overlayDidDismiss` memanggil `VoiceWakeRuntime.refresh(state:)` pada setiap jalur penutupan. Lihat [Overlay suara](/id/platforms/mac/voice-overlay) untuk model sesi/token.

## Detail tekan untuk bicara

- Deteksi tombol pintas menggunakan monitor `.flagsChanged` global untuk Option kanan (`keyCode 61` + `.option`). Monitor hanya mengamati peristiwa dan tidak pernah menahannya.
- Perekaman berada di `VoicePushToTalk`: langsung memulai Speech, mengalirkan hasil sementara ke overlay, dan memanggil `VoiceWakeForwarder` saat tombol dilepas.
- Memulai tekan untuk bicara menjeda runtime kata pemicu untuk menghindari perebutan akses audio; runtime dimulai ulang secara otomatis setelah tombol dilepas.
- Izin: memerlukan Mikrofon + Speech; penerimaan peristiwa tombol memerlukan persetujuan Accessibility/Input Monitoring.
- Keyboard eksternal: beberapa keyboard tidak mengekspos Option kanan sebagaimana mestinya. Tawarkan pintasan cadangan jika pengguna melaporkan kegagalan deteksi.

## Pengaturan yang terlihat oleh pengguna

- Tombol alih **Pengaktifan Suara**: mengaktifkan runtime kata pemicu.
- **Tahan Right Option untuk bicara**: mengaktifkan monitor tekan untuk bicara.
- Jika bahasa yang dipilih tidak mendukung pengenalan pada perangkat di Mac ini, Pengaktifan Suara tetap dinonaktifkan sementara tekan untuk bicara dan Mode Bicara tetap tersedia.
- Pemilih bahasa dan mikrofon, pengukur level langsung, tabel kata pemicu, serta penguji (khusus lokal, tidak pernah meneruskan).
- Pemilih mikrofon mempertahankan pilihan terakhir jika perangkat terputus, menampilkan petunjuk terputus, dan untuk sementara beralih ke default sistem hingga perangkat tersambung kembali.
- **Suara**: nada saat pemicu terdeteksi dan saat pengiriman, dengan suara sistem "Glass" macOS sebagai default. Pilih berkas apa pun yang dapat dimuat oleh `NSSound` (misalnya MP3/WAV/AIFF) untuk setiap peristiwa, atau pilih **Tanpa Suara**.

## Perilaku penerusan

- Saat meneruskan, `VoiceWakeForwarder.selectedSessionOptions` memilih kunci sesi WebChat aktif jika telah ditetapkan; jika tidak, kunci sesi utama Gateway.
- Fungsi tersebut mencari sesi melalui `sessions.list` serta memperoleh saluran dan target pengiriman dari konteks pengiriman sesi (dengan beralih ke saluran/target terakhirnya sebagai cadangan, lalu ke kunci sesi yang diurai), menggunakan WebChat sebagai default jika tidak ada yang berhasil ditentukan.
- Jika pengiriman gagal, kesalahan dicatat (kategori `voicewake.forward`) dan proses tetap terlihat melalui WebChat/log sesi.

## Muatan penerusan

- `VoiceWakeForwarder.prefixedTranscript(_:)` menambahkan baris petunjuk mesin (nama host yang ditentukan, dengan "Mac ini" sebagai cadangan) sebelum transkrip, yang digunakan bersama oleh jalur kata pemicu dan tekan untuk bicara.

## Verifikasi cepat

- Aktifkan tekan untuk bicara, tahan Right Option, bicara, lalu lepaskan: overlay seharusnya menampilkan hasil sementara, kemudian mengirimkannya.
- Selama tombol ditahan, ikon telinga di bilah menu harus tetap membesar (`triggerVoiceEars(ttl: nil)`); ukurannya kembali normal setelah tombol dilepas.

## Terkait

- [Pengaktifan suara](/id/nodes/voicewake)
- [Overlay suara](/id/platforms/mac/voice-overlay)
- [Aplikasi macOS](/id/platforms/macos)
