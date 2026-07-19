---
read_when:
    - Anda ingin agen OpenClaw bergabung dalam rapat Microsoft Teams
    - Anda sedang mengonfigurasi Chrome, BlackHole, atau SoX untuk bicara balik dalam rapat Teams
summary: 'Plugin rapat Microsoft Teams: bergabung ke rapat kerja atau konsumen sebagai tamu melalui browser Chrome'
title: Plugin rapat Microsoft Teams
x-i18n:
    generated_at: "2026-07-19T05:16:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff20854cca39dcf66d2916eff19c00e08136bf944dfb0274cf8f7cb3c8e77730
    source_path: plugins/teams-meetings.md
    workflow: 16
---

Plugin `teams-meetings` bergabung ke tautan Microsoft Teams sebagai tamu di profil Chrome OpenClaw. Plugin ini menerima tautan kerja di bawah `teams.microsoft.com/l/meetup-join/...` dan tautan konsumen di bawah `teams.live.com/meet/...`. Plugin ini tidak membuat rapat, bergabung melalui panggilan telepon, memanggil Microsoft Graph, atau merekam rapat.

## Penyiapan

Fitur balasan suara menggunakan prasyarat audio lokal yang sama dengan [Plugin Google Meet](/id/plugins/google-meet): macOS, perangkat audio virtual `BlackHole 2ch`, dan SoX.

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Aktifkan Plugin, lalu periksa penyiapan:

```json5
{
  plugins: {
    entries: {
      "teams-meetings": {
        enabled: true,
        config: {
          defaultMode: "agent",
          chrome: { guestName: "OpenClaw Agent" },
        },
      },
    },
  },
}
```

```bash
openclaw teamsmeetings setup
openclaw teamsmeetings join 'https://teams.microsoft.com/l/meetup-join/...'
```

Gunakan `chromeNode.node` untuk menjalankan Chrome, BlackHole, dan SoX pada node macOS yang dipasangkan. Node tersebut harus mengizinkan `teamsmeetings.chrome` dan `browser.proxy`.

## Mode

| Mode         | Perilaku                                                                    |
| ------------ | --------------------------------------------------------------------------- |
| `agent`      | Transkripsi waktu nyata berkonsultasi dengan agen OpenClaw yang dikonfigurasi; TTS membalas. |
| `bidi`       | Model suara waktu nyata mendengarkan dan membalas secara langsung.                        |
| `transcribe` | Bergabung hanya untuk mengamati dengan cuplikan transkrip teks langsung.                   |

Mode transkripsi mengaktifkan teks langsung Teams setelah diizinkan masuk dan menangkap baris teks yang mencantumkan pembicara. Tindakan `transcript` mengembalikan buffer teks terbatas untuk sesi rapat OpenClaw yang aktif.

## Batas bergabung sebagai tamu

Adaptor peramban menutup halaman perantara aplikasi, mengisi nama tamu, mematikan kamera, mengonfigurasi mikrofon untuk mode yang dipilih, dan mengeklik tombol bergabung. Status dalam panggilan menggunakan kontrol untuk mengakhiri panggilan; status lobi, masuk ke penyewa, dan izin perangkat mengembalikan alasan eksplisit yang memerlukan tindakan manual. Pengalihan peluncur rapat konsumen dan label `BlackHole 2ch (Virtual)` yang ditampilkan oleh Chrome didukung.

Kebijakan penyewa Teams dapat mewajibkan proses masuk, verifikasi email, atau izin masuk dari penyelenggara. Selesaikan langkah tersebut di profil Chrome OpenClaw, lalu coba lagi pemeriksaan status atau fungsi bicara. Plugin ini tidak melewati kebijakan penyewa.

Klien web Teams konsumen telah divalidasi secara langsung untuk halaman perantara aplikasi, pengisian nama tamu, tombol mikrofon/kamera sebelum bergabung, proses bergabung, izin masuk dari lobi, izin media, deteksi dalam panggilan, teks langsung, perutean masukan/keluaran BlackHole, keluar, dan deteksi setelah panggilan. Penyewa kerja dapat memberlakukan kebijakan yang berbeda untuk proses masuk, verifikasi email, izin masuk, dan konfirmasi keluar; selesaikan setiap tindakan manual yang dilaporkan di profil Chrome OpenClaw.

## Permukaan alat dan Gateway

Alat agen `teams_meetings` mendukung `join`, `leave`, `status`, `transcript`, dan `speak`. Metode Gateway menggunakan prefiks `teamsmeetings.*`. Perintah node adalah `teamsmeetings.chrome`.

## Terkait

- [Ikhtisar Plugin rapat](/plugins/meeting-plugins)
- [Saluran Microsoft Teams](/id/channels/msteams)
