---
read_when:
    - Menyiapkan Zalo Personal untuk OpenClaw
    - Men-debug login atau alur pesan Zalo Personal
summary: Dukungan akun pribadi Zalo melalui zca-js native (login QR), capability, dan konfigurasi
title: Zalo Personal
x-i18n:
    generated_at: "2026-04-05T13:45:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 331b95041463185472d242cb0a944972f0a8e99df8120bda6350eca86ad5963f
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal (tidak resmi)

Status: eksperimental. Integrasi ini mengotomatisasi **akun pribadi Zalo** melalui `zca-js` native di dalam OpenClaw.

> **Peringatan:** Ini adalah integrasi tidak resmi dan dapat mengakibatkan akun ditangguhkan/diblokir. Gunakan dengan risiko Anda sendiri.

## Plugin bawaan

Zalo Personal dikirim sebagai plugin bawaan dalam rilis OpenClaw saat ini, jadi build
paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Zalo Personal,
instal secara manual:

- Instal melalui CLI: `openclaw plugins install @openclaw/zalouser`
- Atau dari source checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detail: [Plugins](/tools/plugin)

Tidak diperlukan binary CLI `zca`/`openzca` eksternal.

## Penyiapan cepat (pemula)

1. Pastikan plugin Zalo Personal tersedia.
   - Rilis OpenClaw terpaket saat ini sudah menyertakannya.
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

4. Restart Gateway (atau selesaikan penyiapan).
5. Akses DM secara default menggunakan pairing; setujui kode pairing saat kontak pertama.

## Apa itu

- Berjalan sepenuhnya in-process melalui `zca-js`.
- Menggunakan event listener native untuk menerima pesan masuk.
- Mengirim balasan langsung melalui JS API (teks/media/tautan).
- Dirancang untuk kasus penggunaan “akun pribadi” saat Zalo Bot API tidak tersedia.

## Penamaan

ID channel adalah `zalouser` untuk menegaskan bahwa ini mengotomatisasi **akun pengguna pribadi Zalo** (tidak resmi). Kami mempertahankan `zalo` untuk potensi integrasi resmi Zalo API di masa depan.

## Menemukan ID (direktori)

Gunakan CLI direktori untuk menemukan peer/grup dan ID-nya:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Batasan

- Teks keluar dipecah menjadi ~2000 karakter (batas klien Zalo).
- Streaming diblokir secara default.

## Kontrol akses (DM)

`channels.zalouser.dmPolicy` mendukung: `pairing | allowlist | open | disabled` (default: `pairing`).

`channels.zalouser.allowFrom` menerima ID pengguna atau nama. Saat penyiapan, nama di-resolve menjadi ID menggunakan lookup kontak in-process milik plugin.

Setujui melalui:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Akses grup (opsional)

- Default: `channels.zalouser.groupPolicy = "open"` (grup diizinkan). Gunakan `channels.defaults.groupPolicy` untuk menimpa default saat tidak disetel.
- Batasi ke allowlist dengan:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (kunci sebaiknya berupa ID grup stabil; nama di-resolve menjadi ID saat startup jika memungkinkan)
  - `channels.zalouser.groupAllowFrom` (mengontrol pengirim mana di grup yang diizinkan yang dapat memicu bot)
- Blokir semua grup: `channels.zalouser.groupPolicy = "disabled"`.
- Wizard konfigurasi dapat meminta allowlist grup.
- Saat startup, OpenClaw me-resolve nama grup/pengguna dalam allowlist menjadi ID dan mencatat pemetaannya.
- Pencocokan allowlist grup secara default hanya berdasarkan ID. Nama yang tidak ter-resolve diabaikan untuk autentikasi kecuali `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan.
- `channels.zalouser.dangerouslyAllowNameMatching: true` adalah mode kompatibilitas break-glass yang mengaktifkan kembali pencocokan nama grup yang dapat berubah.
- Jika `groupAllowFrom` tidak disetel, runtime akan fallback ke `allowFrom` untuk pemeriksaan pengirim grup.
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

### Pembatasan mention grup

- `channels.zalouser.groups.<group>.requireMention` mengontrol apakah balasan grup memerlukan mention.
- Urutan resolusi: ID/nama grup persis -> slug grup ternormalisasi -> `*` -> default (`true`).
- Ini berlaku baik untuk grup yang di-allowlist maupun mode grup terbuka.
- Perintah kontrol yang diotorisasi (misalnya `/new`) dapat mem-bypass pembatasan mention.
- Saat pesan grup dilewati karena mention diperlukan, OpenClaw menyimpannya sebagai riwayat grup tertunda dan menyertakannya pada pesan grup berikutnya yang diproses.
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

## Typing, reaksi, dan pengakuan pengiriman

- OpenClaw mengirim event typing sebelum mengirim balasan (best-effort).
- Tindakan reaksi pesan `react` didukung untuk `zalouser` dalam tindakan channel.
  - Gunakan `remove: true` untuk menghapus emoji reaksi tertentu dari pesan.
  - Semantik reaksi: [Reactions](/tools/reactions)
- Untuk pesan masuk yang menyertakan metadata event, OpenClaw mengirim pengakuan delivered + seen (best-effort).

## Pemecahan masalah

**Login tidak tersimpan:**

- `openclaw channels status --probe`
- Login ulang: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist/nama grup tidak ter-resolve:**

- Gunakan ID numerik di `allowFrom`/`groupAllowFrom`/`groups`, atau nama teman/grup yang persis.

**Upgrade dari penyiapan lama berbasis CLI:**

- Hapus asumsi proses `zca` eksternal lama.
- Channel sekarang berjalan sepenuhnya di OpenClaw tanpa binary CLI eksternal.

## Terkait

- [Ikhtisar Channels](/channels) — semua channel yang didukung
- [Pairing](/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/channels/groups) — perilaku obrolan grup dan pembatasan mention
- [Channel Routing](/channels/channel-routing) — routing sesi untuk pesan
- [Security](/gateway/security) — model akses dan hardening
