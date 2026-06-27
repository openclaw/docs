---
read_when:
    - Menyiapkan Zalo Personal untuk OpenClaw
    - Men-debug alur login atau pesan Zalo Personal
summary: Dukungan akun pribadi Zalo melalui zca-js native (login QR), kapabilitas, dan konfigurasi
title: Zalo pribadi
x-i18n:
    generated_at: "2026-06-27T17:13:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdd331d118bfc0d9aba90ac5e42c2ba52e010eafba1342bd3523c64642057dc6
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

Tidak diperlukan binary CLI `zca`/`openzca` eksternal.

## Penyiapan cepat (pemula)

1. Pastikan Plugin Zalo Personal tersedia.
   - Rilis OpenClaw berpaket saat ini sudah membundelnya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Login (QR, pada mesin Gateway):
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

## Apa ini

- Berjalan sepenuhnya di dalam proses melalui `zca-js`.
- Menggunakan listener peristiwa native untuk menerima pesan masuk.
- Mengirim balasan langsung melalui API JS (teks/media/tautan).
- Dirancang untuk kasus penggunaan "akun pribadi" ketika Zalo Bot API tidak tersedia.

## Penamaan

ID channel adalah `zalouser` untuk memperjelas bahwa ini mengotomatiskan **akun pengguna Zalo pribadi** (tidak resmi). Kami mencadangkan `zalo` untuk kemungkinan integrasi Zalo API resmi di masa mendatang.

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

`channels.zalouser.allowFrom` harus menggunakan ID pengguna Zalo yang stabil. Ini juga dapat mereferensikan grup akses pengirim statis (`accessGroup:<name>`). Selama penyiapan interaktif, nama yang dimasukkan dapat di-resolve menjadi ID menggunakan pencarian kontak dalam proses milik Plugin.

Jika nama mentah tetap ada di config, startup hanya me-resolve-nya ketika `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan. Tanpa opt-in tersebut, pemeriksaan pengirim runtime hanya berbasis ID dan nama mentah diabaikan untuk otorisasi.

Setujui melalui:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Akses grup (opsional)

- Default: `channels.zalouser.groupPolicy = "open"` (grup diizinkan). Gunakan `channels.defaults.groupPolicy` untuk mengganti default saat belum disetel.
- Batasi ke daftar izin dengan:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (key harus berupa ID grup yang stabil; nama di-resolve menjadi ID saat startup hanya ketika `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan)
  - `channels.zalouser.groupAllowFrom` (mengontrol pengirim mana dalam grup yang diizinkan yang dapat memicu bot; grup akses pengirim statis dapat direferensikan dengan `accessGroup:<name>`)
- Blokir semua grup: `channels.zalouser.groupPolicy = "disabled"`.
- Wizard konfigurasi dapat meminta daftar izin grup.
- Saat startup, OpenClaw me-resolve nama grup/pengguna dalam daftar izin menjadi ID dan mencatat pemetaannya hanya ketika `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan.
- Pencocokan daftar izin grup secara default hanya berbasis ID. Nama yang tidak ter-resolve diabaikan untuk auth kecuali `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan.
- `channels.zalouser.dangerouslyAllowNameMatching: true` adalah mode kompatibilitas darurat yang mengaktifkan kembali resolusi nama startup yang dapat berubah dan pencocokan nama grup runtime.
- Jika `groupAllowFrom` tidak disetel, runtime melakukan fallback ke `allowFrom` untuk pemeriksaan pengirim grup.
- Pemeriksaan pengirim berlaku untuk pesan grup normal maupun perintah kontrol (misalnya `/new`, `/reset`).

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

### Gate mention grup

- `channels.zalouser.groups.<group>.requireMention` mengontrol apakah balasan grup memerlukan mention.
- Urutan resolusi: id/nama grup persis -> slug grup yang dinormalisasi -> `*` -> default (`true`).
- Ini berlaku baik untuk grup dalam daftar izin maupun mode grup terbuka.
- Mengutip pesan bot dihitung sebagai mention implisit untuk aktivasi grup.
- Perintah kontrol yang diotorisasi (misalnya `/new`) dapat melewati gate mention.
- Ketika pesan grup dilewati karena mention diperlukan, OpenClaw menyimpannya sebagai riwayat grup tertunda dan menyertakannya pada pesan grup berikutnya yang diproses.
- Batas riwayat grup secara default adalah `messages.groupChat.historyLimit` (fallback `50`). Anda dapat menimpanya per akun dengan `channels.zalouser.historyLimit`.

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

## Variabel lingkungan

Plugin Zalo Personal juga dapat membaca pemilihan profil dari variabel lingkungan:

- `ZALOUSER_PROFILE`: nama profil yang digunakan ketika tidak ada `profile` yang disetel dalam config channel atau akun.
- `ZCA_PROFILE`: nama profil fallback legacy, digunakan hanya ketika `ZALOUSER_PROFILE` tidak disetel.

Nama profil memilih kredensial login Zalo yang tersimpan dalam state OpenClaw. Urutan resolusinya adalah:

1. `profile` eksplisit dalam config.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. ID akun untuk akun non-default, atau `default` untuk akun default.

Untuk penyiapan multi-akun, sebaiknya setel `profile` pada setiap akun dalam config agar
satu variabel lingkungan tidak membuat beberapa akun berbagi sesi login yang sama.

## Pengetikan, reaksi, dan acknowledgement pengiriman

- OpenClaw mengirim peristiwa mengetik sebelum mengirim balasan (upaya terbaik).
- Aksi reaksi pesan `react` didukung untuk `zalouser` dalam aksi channel.
  - Gunakan `remove: true` untuk menghapus emoji reaksi tertentu dari sebuah pesan.
  - Semantik reaksi: [Reaksi](/id/tools/reactions)
- Untuk pesan masuk yang menyertakan metadata peristiwa, OpenClaw mengirim acknowledgement terkirim + terlihat (upaya terbaik).

## Pemecahan masalah

**Login tidak tersimpan:**

- `openclaw channels status --probe`
- Login ulang: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Nama daftar izin/grup tidak ter-resolve:**

- Gunakan ID numerik dalam `allowFrom`/`groupAllowFrom` dan ID grup yang stabil dalam `groups`. Jika Anda sengaja membutuhkan nama teman/grup yang persis, aktifkan `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Upgrade dari penyiapan lama berbasis CLI:**

- Hapus asumsi proses `zca` eksternal lama apa pun.
- Channel sekarang berjalan sepenuhnya di OpenClaw tanpa binary CLI eksternal.

## Terkait

- [Ringkasan Channel](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan gate mention
- [Routing Channel](/id/channels/channel-routing) — routing sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
