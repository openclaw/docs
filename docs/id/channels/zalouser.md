---
read_when:
    - Menyiapkan Zalo Personal untuk OpenClaw
    - Men-debug login Zalo Personal atau alur pesan
summary: Dukungan akun pribadi Zalo melalui zca-js native (login QR), kemampuan, dan konfigurasi
title: Zalo pribadi
x-i18n:
    generated_at: "2026-05-04T18:23:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6d27f0ca502e6426abe21d609efd0a168a0b6b0fafe8d52d59f1a717da1ed5
    source_path: channels/zalouser.md
    workflow: 16
---

Status: eksperimental. Integrasi ini mengotomatiskan **akun Zalo pribadi** melalui `zca-js` native di dalam OpenClaw.

<Warning>
Ini adalah integrasi tidak resmi dan dapat mengakibatkan akun ditangguhkan atau diblokir. Gunakan dengan risiko Anda sendiri.
</Warning>

## Plugin bawaan

Zalo Personal dikirim sebagai Plugin bawaan dalam rilis OpenClaw saat ini, sehingga build
paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang mengecualikan Zalo Personal,
instal paket npm secara langsung:

- Instal melalui CLI: `openclaw plugins install @openclaw/zalouser`
- Versi yang dipatok: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Atau dari checkout sumber: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detail: [Plugin](/id/tools/plugin)

Binary CLI eksternal `zca`/`openzca` tidak diperlukan.

## Penyiapan cepat (pemula)

1. Pastikan Plugin Zalo Personal tersedia.
   - Rilis OpenClaw paket saat ini sudah membundelnya.
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
5. Akses DM default menggunakan pairing; setujui kode pairing pada kontak pertama.

## Apa ini

- Berjalan sepenuhnya dalam proses melalui `zca-js`.
- Menggunakan listener event native untuk menerima pesan masuk.
- Mengirim balasan langsung melalui JS API (teks/media/link).
- Dirancang untuk kasus penggunaan “akun pribadi” ketika Zalo Bot API tidak tersedia.

## Penamaan

ID channel adalah `zalouser` untuk memperjelas bahwa ini mengotomatiskan **akun pengguna Zalo pribadi** (tidak resmi). Kami menjaga `zalo` tetap dicadangkan untuk kemungkinan integrasi Zalo API resmi di masa mendatang.

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

`channels.zalouser.allowFrom` sebaiknya menggunakan ID pengguna Zalo yang stabil. Selama penyiapan interaktif, nama yang dimasukkan dapat di-resolve ke ID menggunakan pencarian kontak dalam proses milik Plugin.

Jika nama mentah tetap ada di config, startup hanya me-resolve-nya ketika `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan. Tanpa opt-in itu, pemeriksaan pengirim runtime hanya berbasis ID dan nama mentah diabaikan untuk otorisasi.

Setujui melalui:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Akses grup (opsional)

- Default: `channels.zalouser.groupPolicy = "open"` (grup diizinkan). Gunakan `channels.defaults.groupPolicy` untuk mengganti default ketika belum diatur.
- Batasi ke allowlist dengan:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (key sebaiknya berupa ID grup yang stabil; nama di-resolve ke ID saat startup hanya ketika `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan)
  - `channels.zalouser.groupAllowFrom` (mengontrol pengirim mana dalam grup yang diizinkan yang dapat memicu bot)
- Blokir semua grup: `channels.zalouser.groupPolicy = "disabled"`.
- Wizard konfigurasi dapat meminta allowlist grup.
- Saat startup, OpenClaw me-resolve nama grup/pengguna dalam allowlist ke ID dan mencatat mapping hanya ketika `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan.
- Pencocokan allowlist grup hanya berbasis ID secara default. Nama yang tidak ter-resolve diabaikan untuk auth kecuali `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan.
- `channels.zalouser.dangerouslyAllowNameMatching: true` adalah mode kompatibilitas break-glass yang mengaktifkan kembali resolusi nama startup yang dapat berubah dan pencocokan nama grup runtime.
- Jika `groupAllowFrom` belum diatur, runtime fallback ke `allowFrom` untuk pemeriksaan pengirim grup.
- Pemeriksaan pengirim berlaku untuk pesan grup normal dan perintah kontrol (misalnya `/new`, `/reset`).

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
- Urutan resolusi: ID/nama grup persis -> slug grup ternormalisasi -> `*` -> default (`true`).
- Ini berlaku baik untuk grup dalam allowlist maupun mode grup terbuka.
- Mengutip pesan bot dihitung sebagai mention implisit untuk aktivasi grup.
- Perintah kontrol terotorisasi (misalnya `/new`) dapat melewati gerbang mention.
- Ketika pesan grup dilewati karena mention diperlukan, OpenClaw menyimpannya sebagai riwayat grup pending dan menyertakannya pada pesan grup berikutnya yang diproses.
- Batas riwayat grup default ke `messages.groupChat.historyLimit` (fallback `50`). Anda dapat mengganti per akun dengan `channels.zalouser.historyLimit`.

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

## Pengetikan, reaksi, dan acknowledgement pengiriman

- OpenClaw mengirim event pengetikan sebelum mengirimkan balasan (best-effort).
- Aksi reaksi pesan `react` didukung untuk `zalouser` dalam aksi channel.
  - Gunakan `remove: true` untuk menghapus emoji reaksi tertentu dari pesan.
  - Semantik reaksi: [Reaksi](/id/tools/reactions)
- Untuk pesan masuk yang menyertakan metadata event, OpenClaw mengirim acknowledgement terkirim + terlihat (best-effort).

## Pemecahan masalah

**Login tidak bertahan:**

- `openclaw channels status --probe`
- Login ulang: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Nama allowlist/grup tidak ter-resolve:**

- Gunakan ID numerik di `allowFrom`/`groupAllowFrom` dan ID grup yang stabil di `groups`. Jika Anda memang membutuhkan nama teman/grup yang persis, aktifkan `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Ditingkatkan dari penyiapan lama berbasis CLI:**

- Hapus asumsi proses eksternal `zca` lama.
- Channel sekarang berjalan sepenuhnya di OpenClaw tanpa binary CLI eksternal.

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan gerbang mention
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
