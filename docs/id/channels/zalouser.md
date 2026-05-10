---
read_when:
    - Menyiapkan Zalo Personal untuk OpenClaw
    - Mendiagnosis alur masuk atau pesan Zalo Personal
summary: Dukungan akun pribadi Zalo melalui zca-js native (login QR), kapabilitas, dan konfigurasi
title: Zalo pribadi
x-i18n:
    generated_at: "2026-05-10T19:24:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b55f980b92a17f6a8de39df0ce49fc5705b5cb2bf4d69589c07d84a854e863a
    source_path: channels/zalouser.md
    workflow: 16
---

Status: eksperimental. Integrasi ini mengotomatiskan **akun Zalo pribadi** melalui `zca-js` native di dalam OpenClaw.

<Warning>
Ini adalah integrasi tidak resmi dan dapat mengakibatkan akun ditangguhkan atau diblokir. Gunakan dengan risiko Anda sendiri.
</Warning>

## Plugin bawaan

Zalo Personal disertakan sebagai Plugin bawaan dalam rilis OpenClaw saat ini, sehingga build
terpaket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi khusus yang mengecualikan Zalo Personal,
instal paket npm secara langsung:

- Instal melalui CLI: `openclaw plugins install @openclaw/zalouser`
- Versi yang dipatok: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Atau dari checkout sumber: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detail: [Plugins](/id/tools/plugin)

Tidak diperlukan binary CLI eksternal `zca`/`openzca`.

## Penyiapan cepat (pemula)

1. Pastikan Plugin Zalo Personal tersedia.
   - Rilis OpenClaw terpaket saat ini sudah menyertakannya.
   - Instalasi lama/khusus dapat menambahkannya secara manual dengan perintah di atas.
2. Masuk (QR, di mesin Gateway):
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
5. Akses DM secara default menggunakan pemasangan; setujui kode pemasangan pada kontak pertama.

## Apa ini

- Berjalan sepenuhnya dalam proses melalui `zca-js`.
- Menggunakan listener peristiwa native untuk menerima pesan masuk.
- Mengirim balasan langsung melalui API JS (teks/media/tautan).
- Dirancang untuk kasus penggunaan "akun pribadi" ketika Zalo Bot API tidak tersedia.

## Penamaan

ID channel adalah `zalouser` untuk memperjelas bahwa ini mengotomatiskan **akun pengguna Zalo pribadi** (tidak resmi). Kami mencadangkan `zalo` untuk kemungkinan integrasi Zalo API resmi di masa mendatang.

## Menemukan ID (direktori)

Gunakan CLI direktori untuk menemukan rekan/grup dan ID mereka:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Batasan

- Teks keluar dipecah menjadi potongan sekitar 2000 karakter (batas klien Zalo).
- Streaming diblokir secara default.

## Kontrol akses (DM)

`channels.zalouser.dmPolicy` mendukung: `pairing | allowlist | open | disabled` (default: `pairing`).

`channels.zalouser.allowFrom` harus menggunakan ID pengguna Zalo yang stabil. Ini juga dapat mereferensikan grup akses pengirim statis (`accessGroup:<name>`). Selama penyiapan interaktif, nama yang dimasukkan dapat diselesaikan menjadi ID menggunakan pencarian kontak dalam proses milik Plugin.

Jika nama mentah tetap ada di konfigurasi, startup hanya menyelesaikannya ketika `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan. Tanpa opt-in tersebut, pemeriksaan pengirim saat runtime hanya berbasis ID dan nama mentah diabaikan untuk otorisasi.

Setujui melalui:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Akses grup (opsional)

- Default: `channels.zalouser.groupPolicy = "open"` (grup diizinkan). Gunakan `channels.defaults.groupPolicy` untuk menimpa default ketika belum ditetapkan.
- Batasi ke allowlist dengan:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (kunci harus berupa ID grup yang stabil; nama diselesaikan menjadi ID saat startup hanya ketika `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan)
  - `channels.zalouser.groupAllowFrom` (mengontrol pengirim mana di grup yang diizinkan yang dapat memicu bot; grup akses pengirim statis dapat direferensikan dengan `accessGroup:<name>`)
- Blokir semua grup: `channels.zalouser.groupPolicy = "disabled"`.
- Wizard konfigurasi dapat meminta allowlist grup.
- Saat startup, OpenClaw menyelesaikan nama grup/pengguna dalam allowlist menjadi ID dan mencatat pemetaan hanya ketika `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan.
- Pencocokan allowlist grup secara default hanya berbasis ID. Nama yang tidak terselesaikan diabaikan untuk autentikasi kecuali `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan.
- `channels.zalouser.dangerouslyAllowNameMatching: true` adalah mode kompatibilitas darurat yang mengaktifkan kembali penyelesaian nama startup yang dapat berubah dan pencocokan nama grup saat runtime.
- Jika `groupAllowFrom` belum ditetapkan, runtime kembali menggunakan `allowFrom` untuk pemeriksaan pengirim grup.
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

### Pembatasan mention grup

- `channels.zalouser.groups.<group>.requireMention` mengontrol apakah balasan grup memerlukan mention.
- Urutan resolusi: ID/nama grup persis -> slug grup yang dinormalisasi -> `*` -> default (`true`).
- Ini berlaku baik untuk grup dalam allowlist maupun mode grup terbuka.
- Mengutip pesan bot dihitung sebagai mention implisit untuk aktivasi grup.
- Perintah kontrol yang terotorisasi (misalnya `/new`) dapat melewati pembatasan mention.
- Ketika pesan grup dilewati karena mention diperlukan, OpenClaw menyimpannya sebagai riwayat grup tertunda dan menyertakannya pada pesan grup berikutnya yang diproses.
- Batas riwayat grup default ke `messages.groupChat.historyLimit` (fallback `50`). Anda dapat menimpanya per akun dengan `channels.zalouser.historyLimit`.

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

Akun dipetakan ke profil `zalouser` dalam status OpenClaw. Contoh:

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

## Pengetikan, reaksi, dan pengakuan pengiriman

- OpenClaw mengirim peristiwa pengetikan sebelum mengirim balasan (upaya terbaik).
- Aksi reaksi pesan `react` didukung untuk `zalouser` dalam aksi channel.
  - Gunakan `remove: true` untuk menghapus emoji reaksi tertentu dari pesan.
  - Semantik reaksi: [Reaksi](/id/tools/reactions)
- Untuk pesan masuk yang menyertakan metadata peristiwa, OpenClaw mengirim pengakuan terkirim + terlihat (upaya terbaik).

## Pemecahan masalah

**Login tidak tersimpan:**

- `openclaw channels status --probe`
- Login ulang: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Nama allowlist/grup tidak terselesaikan:**

- Gunakan ID numerik di `allowFrom`/`groupAllowFrom` dan ID grup yang stabil di `groups`. Jika Anda memang memerlukan nama teman/grup yang persis, aktifkan `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Dimutakhirkan dari penyiapan lama berbasis CLI:**

- Hapus asumsi proses `zca` eksternal lama.
- Channel sekarang berjalan sepenuhnya di OpenClaw tanpa binary CLI eksternal.

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pemasangan](/id/channels/pairing) — autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan mention
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan pengerasan
