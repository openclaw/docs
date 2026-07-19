---
read_when:
    - Anda ingin agen OpenClaw bergabung ke rapat video
    - Anda sedang memilih antara Plugin rapat Google Meet, Microsoft Teams, dan Zoom
    - Anda memerlukan penyiapan Chrome bersama, BlackHole, SoX, atau mode rapat
summary: Pilih dan konfigurasikan partisipasi rapat Google Meet, Microsoft Teams, atau Zoom
title: Plugin rapat
x-i18n:
    generated_at: "2026-07-19T05:27:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ac4357a2ff938f519d4b1112279fe7a7e45d9ae6d679c9eb6d7948fca976b8b
    source_path: plugins/meeting-plugins.md
    workflow: 16
---

OpenClaw memiliki Plugin terpisah untuk Google Meet, rapat Microsoft Teams, dan Zoom. Ketiganya dapat bergabung melalui Chrome, menggunakan mode partisipasi yang sama, dan menjalankan Chrome baik di host Gateway maupun di Node yang dipasangkan. URL platform, model instalasi, dan kemampuan tambahannya berbeda.

Plugin ini berpartisipasi dalam rapat. Plugin ini terpisah dari kanal perpesanan seperti [kanal Microsoft Teams](/id/channels/msteams) dan dari [Plugin panggilan suara](/id/plugins/voice-call).

## Pilih Plugin

| Platform        | Plugin                                      | Tautan rapat yang diterima                                                                                      | Instalasi                                      | Jalur partisipasi                                         | Kemampuan khusus platform                                                                                                            |
| --------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Google Meet     | [`google-meet`](/id/plugins/google-meet)       | `meet.google.com/...`                                                                                       | Instal dari npm atau ClawHub, lalu aktifkan     | Chrome lokal, Chrome di Node yang dipasangkan, atau dial-in Twilio | Dapat membuat rapat melalui Meet API atau peramban yang sudah login; dapat membaca artefak Meet yang didukung dengan OAuth |
| Microsoft Teams | [`teams-meetings`](/plugins/teams-meetings) | Tautan kerja di bawah `teams.microsoft.com/l/meetup-join/...` dan tautan konsumen di bawah `teams.live.com/meet/...` | Disertakan; aktifkan                           | Chrome lokal atau Chrome di Node yang dipasangkan         | Bergabung sebagai tamu untuk rapat kerja dan konsumen                                                                                 |
| Zoom            | [`zoom-meetings`](/plugins/zoom-meetings)   | `zoom.us/j/...` dan subdomain akun seperti `example.zoom.us/j/...`                                      | Disertakan; aktifkan                           | Chrome lokal atau Chrome di Node yang dipasangkan         | Bergabung sebagai tamu melalui Zoom Web App                                                                                           |

Pilih Google Meet saat Anda memerlukan pembuatan rapat, artefak Google API, atau jalur telepon Twilio. Pilih Teams atau Zoom untuk partisipasi tamu secara langsung melalui peramban di platform tersebut. Plugin Teams dan Zoom tidak membuat rapat, melakukan dial-in, memanggil API vendor, atau merekam rapat.

## Pilih mode

Ketiga Plugin menggunakan mode yang sama:

| Mode         | Perilaku                                                                                                                  | Persyaratan audio                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `agent`      | Transkripsi waktu nyata diteruskan ke agen OpenClaw yang dikonfigurasi; TTS OpenClaw biasa mengucapkan balasannya.          | Respons suara Chrome memerlukan jembatan BlackHole dan SoX. |
| `bidi`       | Model suara waktu nyata mendengarkan dan membalas secara langsung.                                                         | Respons suara Chrome memerlukan jembatan BlackHole dan SoX. |
| `transcribe` | Bergabung hanya untuk mengamati dan menyediakan transkrip teks langsung terbatas saat platform menyediakan teks tersebut. | Tanpa jembatan respons suara BlackHole atau SoX.             |

Gunakan `transcribe` saat agen hanya memerlukan teks rapat. Gunakan `agent` untuk penalaran dan alat OpenClaw biasa. Gunakan `bidi` saat suara langsung berlatensi rendah lebih penting daripada merutekan setiap giliran melalui agen biasa.

Transkrip teks bersifat sebagai data runtime dalam cakupan sesi, bukan rekaman rapat yang persisten. Ketersediaan teks tetap bergantung pada platform rapat, akun, bahasa, dan kebijakan host. Lihat panduan platform untuk batas transkrip dan bidang statusnya.

## Siapkan Chrome dan audio

Chrome dapat berjalan di host Gateway atau di Node yang dipasangkan. Node Chrome jarak jauh harus mengizinkan `browser.proxy` beserta perintah platform:

| Plugin          | Perintah Node           |
| --------------- | ----------------------- |
| Google Meet     | `googlemeet.chrome`    |
| Microsoft Teams | `teamsmeetings.chrome` |
| Zoom            | `zoommeetings.chrome`  |

Untuk mode `agent` atau `bidi` melalui Chrome, jalankan Chrome di macOS dan instal dependensi audio bersama di host yang sama:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Host Gateway tetap memiliki agen OpenClaw dan kredensial model saat Chrome berjalan di Node yang dipasangkan. Konfigurasikan penyedia transkripsi waktu nyata dan TTS OpenClaw untuk mode `agent`, atau penyedia suara waktu nyata untuk mode `bidi`. Panduan platform memuat opsi penyedia dan perintah audio.

## Aktifkan Plugin

Instal Google Meet sebelum mengaktifkannya. Rapat Teams dan Zoom disertakan bersama OpenClaw dan hanya perlu diaktifkan:

```bash
# Hanya Google Meet
openclaw plugins install npm:@openclaw/google-meet

# Aktifkan hanya Plugin rapat yang Anda gunakan
openclaw plugins enable google-meet
openclaw plugins enable teams-meetings
openclaw plugins enable zoom-meetings
```

Mulai ulang Gateway jika jalur pengelolaan Plugin Anda tidak memulai ulang Gateway secara otomatis. Kemudian jalankan pemeriksaan penyiapan platform sebelum bergabung.

## Verifikasi dan bergabung

| Platform        | Pemeriksaan penyiapan          | Perintah bergabung                                                             |
| --------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| Google Meet     | `openclaw googlemeet setup`    | `openclaw googlemeet join 'https://meet.google.com/abc-defg-hij'`             |
| Microsoft Teams | `openclaw teamsmeetings setup` | `openclaw teamsmeetings join 'https://teams.microsoft.com/l/meetup-join/...'` |
| Zoom            | `openclaw zoommeetings setup`  | `openclaw zoommeetings join 'https://zoom.us/j/1234567890'`                   |

Perlakukan setiap pemeriksaan penyiapan yang gagal sebagai penghambat bagi transportasi dan mode tersebut. Untuk pengujian awal hanya-mengamati, pilih mode `transcribe` dan pastikan status melaporkan sesi dalam panggilan sebelum mengharapkan teks.

## Tangani perintah kebijakan platform

Otomatisasi peramban menangani kontrol normal untuk nama tamu, kamera dan mikrofon prabergabung, bergabung, dalam panggilan, dan keluar. Otomatisasi ini tidak melewati kebijakan platform atau penyelenggara.

- Google Meet mungkin memerlukan login Google, persetujuan host, atau keputusan izin peramban.
- Microsoft Teams mungkin memerlukan login tenant, verifikasi email, atau persetujuan penyelenggara.
- Zoom mungkin memerlukan autentikasi, verifikasi email, kode sandi, penyelesaian CAPTCHA, atau persetujuan host; akun juga dapat menonaktifkan bergabung melalui peramban.

Saat hasil bergabung atau status melaporkan `manualActionRequired`, selesaikan langkah yang dilaporkan dalam profil Chrome OpenClaw yang sama sebelum mencoba kembali. Membuka tab baru berulang kali tidak menyelesaikan hambatan akun, tenant, lobi, atau CAPTCHA.

Hanya bergabunglah ke rapat jika operator berwenang menambahkan agen. Beri tahu peserta saat kebijakan setempat atau aturan persetujuan mewajibkan pengungkapan partisipasi otomatis, transkripsi, atau ucapan sintetis.

## Obrolan suara Discord

[Kanal suara Discord](/id/channels/discord#voice-channels) menyediakan percakapan waktu nyata khusus audio secara native tanpa otomatisasi rapat peramban. OpenClaw dapat bergabung ke kanal suara, mendengarkan, merutekan giliran melalui agen OpenClaw atau model suara waktu nyata, dan mengucapkan balasan. OpenClaw tidak mengirim atau menerima video kamera maupun berbagi layar, bahkan saat orang menggunakan video di kanal Discord yang sama, sehingga suara Discord merupakan permukaan percakapan langsung terkait, bukan Plugin rapat peramban keempat.

## Panduan platform

- [Plugin Google Meet](/id/plugins/google-meet)
- [Plugin rapat Microsoft Teams](/plugins/teams-meetings)
- [Plugin rapat Zoom](/plugins/zoom-meetings)
- [Kelola Plugin](/id/plugins/manage-plugins)
- [Kontrol peramban](/id/tools/browser)
