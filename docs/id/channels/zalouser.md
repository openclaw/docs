---
read_when:
    - Menyiapkan Zalo Personal untuk OpenClaw
    - Men-debug alur login atau pesan Zalo Personal
summary: Dukungan akun pribadi Zalo melalui zca-js asli (masuk dengan QR), kemampuan, dan konfigurasi
title: Zalo pribadi
x-i18n:
    generated_at: "2026-04-30T09:37:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 581a427f7fa37b0fa204f6b813c767eaa7af1f577baf2ac6ea3a31bf23ca6a49
    source_path: channels/zalouser.md
    workflow: 16
---

Status: eksperimental. Integrasi ini mengotomatiskan **akun Zalo pribadi** melalui `zca-js` native di dalam OpenClaw.

<Warning>
Ini adalah integrasi tidak resmi dan dapat menyebabkan penangguhan atau pemblokiran akun. Gunakan dengan risiko Anda sendiri.
</Warning>

## Plugin bawaan

Zalo Personal dikirim sebagai Plugin bawaan dalam rilis OpenClaw saat ini, jadi build
paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang mengecualikan Zalo Personal,
instal paket npm saat ini ketika sudah diterbitkan:

- Instal melalui CLI: `openclaw plugins install @openclaw/zalouser`
- Atau dari checkout sumber: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detail: [Plugin](/id/tools/plugin)

Jika npm melaporkan paket milik OpenClaw sebagai usang, gunakan build OpenClaw
paket saat ini atau jalur checkout lokal sampai paket npm yang lebih baru
diterbitkan.

Tidak diperlukan biner CLI eksternal `zca`/`openzca`.

## Penyiapan cepat (pemula)

1. Pastikan Plugin Zalo Personal tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Login (QR, pada mesin Gateway):
   - `openclaw channels login --channel zalouser`
   - Pindai kode QR dengan aplikasi seluler Zalo.
3. Aktifkan kanal:

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

## Apa itu

- Berjalan sepenuhnya dalam proses melalui `zca-js`.
- Menggunakan event listener native untuk menerima pesan masuk.
- Mengirim balasan langsung melalui JS API (teks/media/tautan).
- Dirancang untuk kasus penggunaan “akun pribadi” ketika Zalo Bot API tidak tersedia.

## Penamaan

ID kanal adalah `zalouser` untuk menegaskan bahwa ini mengotomatiskan **akun pengguna Zalo pribadi** (tidak resmi). Kami menjaga `zalo` tetap dicadangkan untuk kemungkinan integrasi API Zalo resmi di masa mendatang.

## Menemukan ID (direktori)

Gunakan CLI direktori untuk menemukan peer/grup dan ID-nya:

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

`channels.zalouser.allowFrom` menerima ID pengguna atau nama. Selama penyiapan, nama diselesaikan menjadi ID menggunakan lookup kontak dalam proses milik Plugin.

Setujui melalui:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Akses grup (opsional)

- Default: `channels.zalouser.groupPolicy = "open"` (grup diizinkan). Gunakan `channels.defaults.groupPolicy` untuk menimpa default ketika belum diatur.
- Batasi ke allowlist dengan:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (kunci sebaiknya berupa ID grup yang stabil; nama diselesaikan menjadi ID saat startup jika memungkinkan)
  - `channels.zalouser.groupAllowFrom` (mengontrol pengirim mana dalam grup yang diizinkan yang dapat memicu bot)
- Blokir semua grup: `channels.zalouser.groupPolicy = "disabled"`.
- Wizard konfigurasi dapat meminta allowlist grup.
- Saat startup, OpenClaw menyelesaikan nama grup/pengguna dalam allowlist menjadi ID dan mencatat pemetaannya di log.
- Pencocokan allowlist grup secara default hanya berdasarkan ID. Nama yang tidak terselesaikan diabaikan untuk auth kecuali `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan.
- `channels.zalouser.dangerouslyAllowNameMatching: true` adalah mode kompatibilitas break-glass yang mengaktifkan kembali pencocokan nama grup yang dapat berubah.
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

### Gating mention grup

- `channels.zalouser.groups.<group>.requireMention` mengontrol apakah balasan grup memerlukan mention.
- Urutan resolusi: ID/nama grup persis -> slug grup ternormalisasi -> `*` -> default (`true`).
- Ini berlaku baik untuk grup dalam allowlist maupun mode grup terbuka.
- Mengutip pesan bot dihitung sebagai mention implisit untuk aktivasi grup.
- Perintah kontrol yang terotorisasi (misalnya `/new`) dapat melewati gating mention.
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

## Pengetikan, reaksi, dan konfirmasi pengiriman

- OpenClaw mengirim event pengetikan sebelum mengirim balasan (upaya terbaik).
- Aksi reaksi pesan `react` didukung untuk `zalouser` dalam aksi kanal.
  - Gunakan `remove: true` untuk menghapus emoji reaksi tertentu dari sebuah pesan.
  - Semantik reaksi: [Reaksi](/id/tools/reactions)
- Untuk pesan masuk yang menyertakan metadata event, OpenClaw mengirim konfirmasi delivered + seen (upaya terbaik).

## Pemecahan masalah

**Login tidak tersimpan:**

- `openclaw channels status --probe`
- Login ulang: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Nama allowlist/grup tidak terselesaikan:**

- Gunakan ID numerik di `allowFrom`/`groupAllowFrom`/`groups`, atau nama teman/grup yang persis.

**Ditingkatkan dari penyiapan lama berbasis CLI:**

- Hapus asumsi proses eksternal `zca` lama.
- Kanal sekarang berjalan sepenuhnya di OpenClaw tanpa biner CLI eksternal.

## Terkait

- [Ikhtisar Kanal](/id/channels) — semua kanal yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan gating mention
- [Perutean Kanal](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan pengerasan
