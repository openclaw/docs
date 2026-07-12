---
read_when:
    - Menyiapkan Zalo Personal untuk OpenClaw
    - Men-debug alur login atau pesan Zalo Personal
summary: Dukungan akun pribadi Zalo melalui zca-js native (masuk dengan kode QR), kemampuan, dan konfigurasi
title: Zalo pribadi
x-i18n:
    generated_at: "2026-07-12T14:02:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

Status: eksperimental. Integrasi ini mengotomatiskan **akun Zalo pribadi** melalui `zca-js` native, di dalam proses, tanpa biner CLI eksternal.

<Warning>
Ini adalah integrasi tidak resmi dan dapat mengakibatkan akun ditangguhkan atau diblokir. Gunakan dengan risiko Anda sendiri.
</Warning>

## Instalasi

Zalo Personal adalah plugin eksternal resmi yang tidak disertakan dalam inti. Instal sebelum digunakan:

```bash
openclaw plugins install @openclaw/zalouser
```

- Sematkan versi: `openclaw plugins install @openclaw/zalouser@<version>`
- Dari checkout sumber: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat

1. Instal plugin (di atas).
2. Masuk (QR, pada mesin Gateway):
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
5. Akses DM secara default menggunakan pemasangan; setujui kode pemasangan pada kontak pertama.

## Apa itu

- Berjalan sepenuhnya di dalam proses melalui pustaka `zca-js` (tanpa biner eksternal `zca`/`openzca`).
- Menggunakan pemantau peristiwa native (`message`, `error`) untuk menerima pesan masuk.
- Mengirim balasan secara langsung melalui API JS (teks/media/tautan).
- Dirancang untuk kasus penggunaan "akun pribadi" ketika API Bot Zalo tidak tersedia.

## Penamaan

ID kanal adalah `zalouser` untuk memperjelas bahwa integrasi ini mengotomatiskan **akun pengguna Zalo pribadi** (tidak resmi). `zalo` dicadangkan untuk kemungkinan integrasi API Zalo resmi pada masa mendatang.

## Menemukan ID (direktori)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Batasan

- Teks keluar dipecah menjadi bagian-bagian sepanjang 2.000 karakter (batas klien Zalo).
- Streaming tidak didukung.

## Kontrol akses (DM)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (default: `pairing`).

`channels.zalouser.allowFrom` harus menggunakan ID pengguna Zalo yang stabil. Nilai ini juga dapat merujuk ke grup akses pengirim statis (`accessGroup:<name>`). Selama penyiapan interaktif, nama yang dimasukkan dapat ditetapkan ke ID menggunakan pencarian kontak di dalam proses milik plugin.

Jika nama mentah tetap ada dalam konfigurasi, proses awal hanya menetapkannya ketika `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan. Tanpa keikutsertaan eksplisit tersebut, pemeriksaan pengirim saat runtime hanya berdasarkan ID dan nama mentah diabaikan untuk otorisasi.

Setujui melalui:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Akses grup (opsional)

- Default: `channels.zalouser.groupPolicy = "allowlist"` (grup memerlukan entri daftar izin eksplisit).
- Buka semua grup: `channels.zalouser.groupPolicy = "open"`.
- Blokir semua grup: `channels.zalouser.groupPolicy = "disabled"`.
- Dengan `groupPolicy = "allowlist"`:
  - Kunci `channels.zalouser.groups` harus berupa ID grup yang stabil; nama hanya ditetapkan ke ID saat proses awal ketika `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan.
  - `channels.zalouser.groupAllowFrom` mengontrol pengirim mana dalam grup yang diizinkan yang dapat memicu bot; grup akses pengirim statis dapat dirujuk dengan `accessGroup:<name>`.
- Wisaya konfigurasi dapat meminta daftar izin grup.
- Pencocokan daftar izin grup secara default hanya berdasarkan ID. Nama yang tidak dapat ditetapkan diabaikan untuk autentikasi kecuali `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan.
- `channels.zalouser.dangerouslyAllowNameMatching: true` adalah mode kompatibilitas darurat yang mengaktifkan kembali penetapan nama yang dapat berubah saat proses awal dan pencocokan nama grup saat runtime.
- `groupAllowFrom` **tidak** beralih menggunakan `allowFrom` untuk pesan grup biasa: membiarkannya kosong pada grup dalam daftar izin akan membuka grup tersebut bagi semua pengirim. Perintah kontrol yang diotorisasi (misalnya `/new`) merupakan pengecualian; pemeriksaan pengirim perintah akan beralih menggunakan `allowFrom` ketika `groupAllowFrom` kosong.

Contoh:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow` adalah nama bidang lama; konfigurasi saat ini menggunakan `enabled`. `openclaw doctor --fix` memigrasikan `allow` ke `enabled` secara otomatis.
</Note>

### Pembatasan berdasarkan penyebutan dalam grup

- `channels.zalouser.groups.<group>.requireMention` mengontrol apakah balasan grup memerlukan penyebutan.
- Urutan penetapan: ID grup -> alias `group:<id>` -> nama/slug grup (kandidat berbasis nama hanya berlaku ketika `dangerouslyAllowNameMatching: true`) -> `*` -> default (`true`).
- Berlaku untuk grup dalam daftar izin maupun mode grup terbuka.
- Mengutip pesan bot dihitung sebagai penyebutan implisit untuk aktivasi grup.
- Perintah kontrol yang diotorisasi (misalnya `/new`) dapat melewati pembatasan berdasarkan penyebutan.
- Ketika pesan grup dilewati karena penyebutan diwajibkan, OpenClaw menyimpannya sebagai riwayat grup tertunda dan menyertakannya pada pesan grup berikutnya yang diproses.
- Batas riwayat grup: `channels.zalouser.historyLimit`, kemudian `messages.groupChat.historyLimit`, lalu nilai cadangan `50`.

Contoh:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
      },
    },
  },
}
```

## Multiakun

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

## Variabel lingkungan

Pemilihan profil juga dapat berasal dari variabel lingkungan:

| Variabel           | Tujuan                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------ |
| `ZALOUSER_PROFILE` | Nama profil yang digunakan ketika `profile` tidak ditetapkan dalam konfigurasi kanal atau akun. |
| `ZCA_PROFILE`      | Nilai cadangan lama yang hanya digunakan ketika `ZALOUSER_PROFILE` tidak ditetapkan.       |

Nama profil memilih kredensial masuk Zalo yang disimpan dalam status OpenClaw. Urutan penetapan:

1. `profile` eksplisit dalam konfigurasi.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. ID akun untuk akun nondefault, atau `default` untuk akun default.

Untuk penyiapan multiakun, sebaiknya tetapkan `profile` pada setiap akun dalam konfigurasi agar satu variabel lingkungan tidak membuat beberapa akun berbagi sesi masuk yang sama.

## Pengetikan, reaksi, dan konfirmasi pengiriman

- OpenClaw mengirim peristiwa pengetikan sebelum mengirimkan balasan (upaya terbaik).
- Tindakan reaksi pesan `react` didukung untuk `zalouser` dalam tindakan kanal.
  - Gunakan `remove: true` untuk menghapus emoji reaksi tertentu dari pesan.
  - Semantik reaksi: [Reaksi](/id/tools/reactions)
- Untuk pesan masuk yang menyertakan metadata peristiwa, OpenClaw mengirim konfirmasi telah dikirim + telah dilihat (upaya terbaik).

## Pemecahan masalah

**Sesi masuk tidak bertahan:**

- `openclaw channels status --probe`
- Masuk kembali: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Nama daftar izin/grup tidak dapat ditetapkan:**

- Gunakan ID numerik dalam `allowFrom`/`groupAllowFrom` dan ID grup yang stabil dalam `groups`. Jika Anda sengaja perlu menggunakan nama teman/grup yang persis, aktifkan `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Ditingkatkan dari penyiapan lama berbasis `zca`/CLI eksternal:**

- Hapus semua asumsi tentang proses `zca` eksternal; kanal kini berjalan sepenuhnya di dalam proses melalui `zca-js`, tanpa biner CLI eksternal.

## Terkait

- [Ikhtisar Kanal](/id/channels) - semua kanal yang didukung
- [Pemasangan](/id/channels/pairing) - autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) - perilaku percakapan grup dan pembatasan berdasarkan penyebutan
- [Perutean Kanal](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan penguatan
