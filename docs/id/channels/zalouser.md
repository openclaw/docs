---
read_when:
    - Menyiapkan Zalo Personal untuk OpenClaw
    - Men-debug login atau alur pesan Zalo Personal
summary: Dukungan akun pribadi Zalo melalui `zca-js` native (login QR), kemampuan, dan konfigurasi
title: Zalo personal
x-i18n:
    generated_at: "2026-04-24T09:00:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18a7edbe3e7a65861628f004ecf6cf2b924b531ba7271d14fa37a6834cdd2545
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal (tidak resmi)

Status: eksperimental. Integrasi ini mengotomatisasi **akun Zalo pribadi** melalui `zca-js` native di dalam OpenClaw.

> **Peringatan:** Ini adalah integrasi tidak resmi dan dapat menyebabkan akun ditangguhkan/diblokir. Gunakan dengan risiko Anda sendiri.

## Plugin bawaan

Zalo Personal dikirim sebagai Plugin bawaan dalam rilis OpenClaw saat ini, sehingga build
paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Zalo Personal,
instal secara manual:

- Instal melalui CLI: `openclaw plugins install @openclaw/zalouser`
- Atau dari checkout source: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detail: [Plugins](/id/tools/plugin)

Tidak diperlukan binary CLI eksternal `zca`/`openzca`.

## Penyiapan cepat (pemula)

1. Pastikan Plugin Zalo Personal tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Login (QR, di mesin Gateway):
   - `openclaw channels login --channel zalouser`
   - Pindai kode QR dengan aplikasi seluler Zalo.
3. Aktifkan channel:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Mulai ulang Gateway (atau selesaikan penyiapan).
5. Akses DM secara default menggunakan pairing; setujui kode pairing pada kontak pertama.

## Apa itu

- Berjalan sepenuhnya in-process melalui `zca-js`.
- Menggunakan listener peristiwa native untuk menerima pesan masuk.
- Mengirim balasan langsung melalui API JS (teks/media/tautan).
- Dirancang untuk kasus penggunaan “akun pribadi” saat API Bot Zalo tidak tersedia.

## Penamaan

Id channel adalah `zalouser` untuk memperjelas bahwa ini mengotomatisasi **akun pengguna Zalo pribadi** (tidak resmi). Kami mempertahankan `zalo` untuk kemungkinan integrasi API Zalo resmi di masa depan.

## Menemukan ID (direktori)

Gunakan CLI direktori untuk menemukan peer/grup dan ID-nya:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Batasan

- Teks keluar dipecah menjadi sekitar 2000 karakter (batas klien Zalo).
- Streaming diblokir secara default.

## Kontrol akses (DM)

`channels.zalouser.dmPolicy` mendukung: `pairing | allowlist | open | disabled` (default: `pairing`).

`channels.zalouser.allowFrom` menerima ID pengguna atau nama. Selama penyiapan, nama di-resolve ke ID menggunakan pencarian kontak in-process milik Plugin.

Setujui melalui:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Akses grup (opsional)

- Default: `channels.zalouser.groupPolicy = "open"` (grup diizinkan). Gunakan `channels.defaults.groupPolicy` untuk menimpa default saat tidak diatur.
- Batasi ke allowlist dengan:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (kunci sebaiknya berupa ID grup yang stabil; nama di-resolve ke ID saat startup jika memungkinkan)
  - `channels.zalouser.groupAllowFrom` (mengontrol pengirim mana dalam grup yang diizinkan dapat memicu bot)
- Blokir semua grup: `channels.zalouser.groupPolicy = "disabled"`.
- Wizard konfigurasi dapat meminta allowlist grup.
- Saat startup, OpenClaw me-resolve nama grup/pengguna dalam allowlist ke ID dan mencatat pemetaannya.
- Pencocokan allowlist grup secara default hanya berdasarkan ID. Nama yang tidak ter-resolve diabaikan untuk auth kecuali `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan.
- `channels.zalouser.dangerouslyAllowNameMatching: true` adalah mode kompatibilitas darurat yang mengaktifkan kembali pencocokan nama grup yang dapat berubah.
- Jika `groupAllowFrom` tidak diatur, runtime kembali menggunakan `allowFrom` untuk pemeriksaan pengirim grup.
- Pemeriksaan pengirim berlaku untuk pesan grup normal maupun command kontrol (misalnya `/new`, `/reset`).

Contoh:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Gerbang mention grup

- `channels.zalouser.groups.<group>.requireMention` mengontrol apakah balasan grup memerlukan mention.
- Urutan resolusi: id/nama grup yang persis cocok -> slug grup yang dinormalisasi -> `*` -> default (`true`).
- Ini berlaku baik untuk grup yang di-allowlist maupun mode grup terbuka.
- Mengutip pesan bot dihitung sebagai mention implisit untuk aktivasi grup.
- Command kontrol yang diotorisasi (misalnya `/new`) dapat melewati gerbang mention.
- Saat pesan grup dilewati karena mention diperlukan, OpenClaw menyimpannya sebagai riwayat grup tertunda dan menyertakannya pada pesan grup berikutnya yang diproses.
- Batas riwayat grup default mengikuti `messages.groupChat.historyLimit` (fallback `50`). Anda dapat menimpanya per akun dengan `channels.zalouser.historyLimit`.

Contoh:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Multi-akun

Akun dipetakan ke profil `zalouser` dalam state OpenClaw. Contoh:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Mengetik, reaksi, dan acknowledgements pengiriman

- OpenClaw mengirim peristiwa mengetik sebelum mengirim balasan (best-effort).
- Aksi reaksi pesan `react` didukung untuk `zalouser` dalam aksi channel.
  - Gunakan `remove: true` untuk menghapus emoji reaksi tertentu dari sebuah pesan.
  - Semantik reaksi: [Reactions](/id/tools/reactions)
- Untuk pesan masuk yang menyertakan metadata peristiwa, OpenClaw mengirim acknowledgement delivered + seen (best-effort).

## Pemecahan masalah

**Login tidak bertahan:**

- `openclaw channels status --probe`
- Login ulang: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist/nama grup tidak ter-resolve:**

- Gunakan ID numerik di `allowFrom`/`groupAllowFrom`/`groups`, atau nama teman/grup yang persis sama.

**Upgrade dari penyiapan lama berbasis CLI:**

- Hapus asumsi proses `zca` eksternal lama.
- Channel sekarang berjalan sepenuhnya di dalam OpenClaw tanpa binary CLI eksternal.

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan gerbang mention
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan keamanan
