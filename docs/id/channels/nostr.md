---
read_when:
    - Anda ingin OpenClaw menerima pesan langsung melalui Nostr
    - Anda sedang menyiapkan perpesanan terdesentralisasi
summary: Saluran pesan langsung Nostr melalui pesan terenkripsi NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-30T09:34:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 545d68077c9fe81d5fa5a17262d37e3688185a1fb12d67b8b1053b27b96c3c7f
    source_path: channels/nostr.md
    workflow: 16
---

**Status:** Plugin bawaan opsional (dinonaktifkan secara default sampai dikonfigurasi).

Nostr adalah protokol terdesentralisasi untuk jejaring sosial. Channel ini memungkinkan OpenClaw menerima dan merespons pesan langsung (DM) terenkripsi melalui NIP-04.

## Plugin bawaan

Rilis OpenClaw saat ini mengirimkan Nostr sebagai Plugin bawaan, sehingga build paket normal tidak memerlukan instalasi terpisah.

### Instalasi lama/kustom

- Onboarding (`openclaw onboard`) dan `openclaw channels add` masih menampilkan Nostr dari katalog channel bersama.
- Jika build Anda mengecualikan Nostr bawaan, instal paket npm terbaru saat tersedia.

```bash
openclaw plugins install @openclaw/nostr
```

Jika npm melaporkan paket milik OpenClaw sebagai deprecated, gunakan build OpenClaw paket terbaru atau checkout lokal sampai paket npm yang lebih baru diterbitkan.

Gunakan checkout lokal (alur kerja dev):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Mulai ulang Gateway setelah menginstal atau mengaktifkan Plugin.

### Penyiapan non-interaktif

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Gunakan `--use-env` untuk menyimpan `NOSTR_PRIVATE_KEY` di environment alih-alih menyimpan kunci di konfigurasi.

## Penyiapan cepat

1. Buat keypair Nostr (jika diperlukan):

```bash
# Using nak
nak key generate
```

2. Tambahkan ke konfigurasi:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Ekspor kunci:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Mulai ulang Gateway.

## Referensi konfigurasi

| Kunci        | Tipe     | Default                                     | Deskripsi                              |
| ------------ | -------- | ------------------------------------------- | -------------------------------------- |
| `privateKey` | string   | wajib                                       | Kunci privat dalam format `nsec` atau hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL relai (WebSocket)                  |
| `dmPolicy`   | string   | `pairing`                                   | Kebijakan akses DM                     |
| `allowFrom`  | string[] | `[]`                                        | Pubkey pengirim yang diizinkan         |
| `enabled`    | boolean  | `true`                                      | Aktifkan/nonaktifkan channel           |
| `name`       | string   | -                                           | Nama tampilan                          |
| `profile`    | object   | -                                           | Metadata profil NIP-01                 |

## Metadata profil

Data profil diterbitkan sebagai event NIP-01 `kind:0`. Anda dapat mengelolanya dari Control UI (Channels -> Nostr -> Profile) atau mengaturnya langsung di konfigurasi.

Contoh:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

Catatan:

- URL profil harus menggunakan `https://`.
- Impor dari relai menggabungkan field dan mempertahankan override lokal.

## Kontrol akses

### Kebijakan DM

- **pairing** (default): pengirim tidak dikenal mendapatkan kode pairing.
- **allowlist**: hanya pubkey dalam `allowFrom` yang dapat mengirim DM.
- **open**: DM masuk publik (memerlukan `allowFrom: ["*"]`).
- **disabled**: abaikan DM masuk.

Catatan penegakan:

- Signature event masuk diverifikasi sebelum kebijakan pengirim dan dekripsi NIP-04, sehingga event palsu ditolak sejak awal.
- Balasan pairing dikirim tanpa memproses isi DM asli.
- DM masuk dikenai pembatasan laju dan payload yang terlalu besar dibuang sebelum dekripsi.

### Contoh allowlist

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## Format kunci

Format yang diterima:

- **Kunci privat:** `nsec...` atau hex 64 karakter
- **Pubkey (`allowFrom`):** `npub...` atau hex

## Relai

Default: `relay.damus.io` dan `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

Tips:

- Gunakan 2-3 relai untuk redundansi.
- Hindari terlalu banyak relai (latensi, duplikasi).
- Relai berbayar dapat meningkatkan keandalan.
- Relai lokal cocok untuk pengujian (`ws://localhost:7777`).

## Dukungan protokol

| NIP    | Status    | Deskripsi                              |
| ------ | --------- | -------------------------------------- |
| NIP-01 | Didukung  | Format event dasar + metadata profil   |
| NIP-04 | Didukung  | DM terenkripsi (`kind:4`)              |
| NIP-17 | Direncanakan | DM gift-wrapped                     |
| NIP-44 | Direncanakan | Enkripsi berversi                  |

## Pengujian

### Relai lokal

```bash
# Start strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### Pengujian manual

1. Catat pubkey bot (npub) dari log.
2. Buka klien Nostr (Damus, Amethyst, dll.).
3. Kirim DM ke pubkey bot.
4. Verifikasi responsnya.

## Pemecahan masalah

### Tidak menerima pesan

- Verifikasi bahwa kunci privat valid.
- Pastikan URL relai dapat dijangkau dan menggunakan `wss://` (atau `ws://` untuk lokal).
- Konfirmasi `enabled` bukan `false`.
- Periksa log Gateway untuk error koneksi relai.

### Tidak mengirim respons

- Periksa apakah relai menerima penulisan.
- Verifikasi konektivitas keluar.
- Perhatikan batas laju relai.

### Respons duplikat

- Diharapkan saat menggunakan beberapa relai.
- Pesan dideduplikasi berdasarkan ID event; hanya pengiriman pertama yang memicu respons.

## Keamanan

- Jangan pernah commit kunci privat.
- Gunakan environment variable untuk kunci.
- Pertimbangkan `allowlist` untuk bot produksi.
- Signature diverifikasi sebelum kebijakan pengirim, dan kebijakan pengirim ditegakkan sebelum dekripsi, sehingga event palsu ditolak sejak awal dan pengirim tidak dikenal tidak dapat memaksa kerja kripto penuh.

## Batasan (MVP)

- Hanya pesan langsung (tanpa obrolan grup).
- Tidak ada lampiran media.
- Hanya NIP-04 (gift-wrap NIP-17 direncanakan).

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gerbang mention
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
