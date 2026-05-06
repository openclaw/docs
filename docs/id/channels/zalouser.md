---
read_when:
    - Menyiapkan Zalo Personal untuk OpenClaw
    - Men-debug alur login atau pesan Zalo Personal
summary: Dukungan akun pribadi Zalo melalui zca-js asli (login QR), kemampuan, dan konfigurasi
title: Zalo pribadi
x-i18n:
    generated_at: "2026-05-06T17:52:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d56cbf0a6300709e9fe23421cd134acc68852d0025f305c73413308f412349e8
    source_path: channels/zalouser.md
    workflow: 16
---

Status: eksperimental. Integrasi ini mengotomatiskan **akun Zalo pribadi** melalui `zca-js` native di dalam OpenClaw.

<Warning>
Ini adalah integrasi tidak resmi dan dapat menyebabkan penangguhan atau pemblokiran akun. Gunakan dengan risiko Anda sendiri.
</Warning>

## Plugin bawaan

Zalo Personal disertakan sebagai Plugin bawaan dalam rilis OpenClaw saat ini, jadi build
terpaket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang mengecualikan Zalo Personal,
instal paket npm secara langsung:

- Instal melalui CLI: `openclaw plugins install @openclaw/zalouser`
- Versi tersemat: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Atau dari checkout sumber: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detail: [Plugin](/id/tools/plugin)

Tidak diperlukan binary CLI `zca`/`openzca` eksternal.

## Penyiapan cepat (pemula)

1. Pastikan Plugin Zalo Personal tersedia.
   - Rilis OpenClaw terpaket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Login (QR, di mesin Gateway):
   - `openclaw channels login --channel zalouser`
   - Pindai kode QR dengan aplikasi seluler Zalo.
3. Aktifkan saluran:

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

- Berjalan sepenuhnya di dalam proses melalui `zca-js`.
- Menggunakan event listener native untuk menerima pesan masuk.
- Mengirim balasan langsung melalui API JS (teks/media/tautan).
- Dirancang untuk kasus penggunaan "akun pribadi" saat Zalo Bot API tidak tersedia.

## Penamaan

ID saluran adalah `zalouser` agar jelas bahwa ini mengotomatiskan **akun pengguna Zalo pribadi** (tidak resmi). Kami mempertahankan `zalo` untuk potensi integrasi API Zalo resmi di masa mendatang.

## Menemukan ID (direktori)

Gunakan CLI direktori untuk menemukan peer/grup dan ID-nya:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Batas

- Teks keluar dipecah menjadi potongan ~2000 karakter (batas klien Zalo).
- Streaming diblokir secara default.

## Kontrol akses (DM)

`channels.zalouser.dmPolicy` mendukung: `pairing | allowlist | open | disabled` (default: `pairing`).

`channels.zalouser.allowFrom` harus menggunakan ID pengguna Zalo yang stabil. Selama penyiapan interaktif, nama yang dimasukkan dapat di-resolve menjadi ID menggunakan pencarian kontak dalam proses milik Plugin.

Jika nama mentah tetap ada dalam konfigurasi, startup me-resolve nama tersebut hanya saat `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan. Tanpa opt-in tersebut, pemeriksaan pengirim runtime hanya berbasis ID dan nama mentah diabaikan untuk otorisasi.

Setujui melalui:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Akses grup (opsional)

- Default: `channels.zalouser.groupPolicy = "open"` (grup diizinkan). Gunakan `channels.defaults.groupPolicy` untuk mengganti default saat belum disetel.
- Batasi ke allowlist dengan:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (kunci harus berupa ID grup yang stabil; nama di-resolve menjadi ID saat startup hanya jika `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan)
  - `channels.zalouser.groupAllowFrom` (mengontrol pengirim mana dalam grup yang diizinkan yang dapat memicu bot)
- Blokir semua grup: `channels.zalouser.groupPolicy = "disabled"`.
- Wizard konfigurasi dapat meminta allowlist grup.
- Saat startup, OpenClaw me-resolve nama grup/pengguna dalam allowlist menjadi ID dan mencatat pemetaannya hanya saat `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan.
- Pencocokan allowlist grup secara default hanya berbasis ID. Nama yang tidak ter-resolve diabaikan untuk autentikasi kecuali `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan.
- `channels.zalouser.dangerouslyAllowNameMatching: true` adalah mode kompatibilitas darurat yang mengaktifkan kembali resolusi nama startup yang dapat berubah dan pencocokan nama grup runtime.
- Jika `groupAllowFrom` belum disetel, runtime kembali menggunakan `allowFrom` untuk pemeriksaan pengirim grup.
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

### Gate mention grup

- `channels.zalouser.groups.<group>.requireMention` mengontrol apakah balasan grup memerlukan mention.
- Urutan resolusi: ID/nama grup persis -> slug grup yang dinormalisasi -> `*` -> default (`true`).
- Ini berlaku untuk grup dalam allowlist dan mode grup terbuka.
- Mengutip pesan bot dihitung sebagai mention implisit untuk aktivasi grup.
- Perintah kontrol yang diotorisasi (misalnya `/new`) dapat melewati gate mention.
- Saat pesan grup dilewati karena mention diperlukan, OpenClaw menyimpannya sebagai riwayat grup tertunda dan menyertakannya pada pesan grup berikutnya yang diproses.
- Batas riwayat grup default ke `messages.groupChat.historyLimit` (fallback `50`). Anda dapat menggantinya per akun dengan `channels.zalouser.historyLimit`.

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

## Pengetikan, reaksi, dan pengakuan pengiriman

- OpenClaw mengirim event pengetikan sebelum mengirim balasan (upaya terbaik).
- Aksi reaksi pesan `react` didukung untuk `zalouser` dalam aksi saluran.
  - Gunakan `remove: true` untuk menghapus emoji reaksi tertentu dari sebuah pesan.
  - Semantik reaksi: [Reaksi](/id/tools/reactions)
- Untuk pesan masuk yang menyertakan metadata event, OpenClaw mengirim pengakuan terkirim + terlihat (upaya terbaik).

## Pemecahan masalah

**Login tidak tersimpan:**

- `openclaw channels status --probe`
- Login ulang: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Nama allowlist/grup tidak ter-resolve:**

- Gunakan ID numerik dalam `allowFrom`/`groupAllowFrom` dan ID grup yang stabil dalam `groups`. Jika Anda memang memerlukan nama teman/grup yang persis, aktifkan `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Upgrade dari penyiapan lama berbasis CLI:**

- Hapus asumsi lama tentang proses `zca` eksternal.
- Saluran sekarang berjalan sepenuhnya di OpenClaw tanpa binary CLI eksternal.

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan gate mention
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
