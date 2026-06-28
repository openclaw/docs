---
read_when:
    - Anda ingin OpenClaw menerima pesan langsung melalui Nostr
    - Anda sedang menyiapkan perpesanan terdesentralisasi
summary: Saluran DM Nostr melalui pesan terenkripsi NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-05-02T22:16:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6158c22c0ffc5aea56d0ac2b68955f30c3a785013dba5410cbd70f9b689dc3c
    source_path: channels/nostr.md
    workflow: 16
    postprocess_version: locale-links-v1
---

**Status:** Plugin bawaan opsional (dinonaktifkan secara default hingga dikonfigurasi).

Nostr adalah protokol terdesentralisasi untuk jejaring sosial. Channel ini memungkinkan OpenClaw menerima dan merespons pesan langsung (DM) terenkripsi melalui NIP-04.

## Plugin bawaan

Rilis OpenClaw saat ini menyertakan Nostr sebagai Plugin bawaan, sehingga build paket normal tidak memerlukan instalasi terpisah.

### Instalasi lama/kustom

- Onboarding (`openclaw onboard`) dan `openclaw channels add` tetap menampilkan Nostr dari katalog channel bersama.
- Jika build Anda mengecualikan Nostr bawaan, instal paket npm secara langsung.

```bash
openclaw plugins install @openclaw/nostr
```

Gunakan paket polos untuk mengikuti tag rilis resmi saat ini. Sematkan versi persis hanya saat Anda memerlukan instalasi yang dapat direproduksi.

Gunakan checkout lokal (alur kerja dev):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Mulai ulang Gateway setelah menginstal atau mengaktifkan plugin.

### Penyiapan noninteraktif

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Gunakan `--use-env` untuk menyimpan `NOSTR_PRIVATE_KEY` di environment alih-alih menyimpan kunci dalam config.

## Penyiapan cepat

1. Buat keypair Nostr (jika diperlukan):

```bash
# Using nak
nak key generate
```

2. Tambahkan ke config:

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

| Kunci        | Tipe     | Default                                     | Deskripsi                                  |
| ------------ | -------- | ------------------------------------------- | ------------------------------------------ |
| `privateKey` | string   | wajib                                       | Kunci privat dalam format `nsec` atau hex  |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL relay (WebSocket)                      |
| `dmPolicy`   | string   | `pairing`                                   | Kebijakan akses DM                         |
| `allowFrom`  | string[] | `[]`                                        | Pubkey pengirim yang diizinkan             |
| `enabled`    | boolean  | `true`                                      | Aktifkan/nonaktifkan channel               |
| `name`       | string   | -                                           | Nama tampilan                              |
| `profile`    | object   | -                                           | Metadata profil NIP-01                     |

## Metadata profil

Data profil diterbitkan sebagai event NIP-01 `kind:0`. Anda dapat mengelolanya dari Control UI (Channels -> Nostr -> Profile) atau mengaturnya langsung di config.

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
- Mengimpor dari relay menggabungkan field dan mempertahankan override lokal.

## Kontrol akses

### Kebijakan DM

- **pairing** (default): pengirim tidak dikenal menerima kode pairing.
- **allowlist**: hanya pubkey di `allowFrom` yang dapat mengirim DM.
- **open**: DM masuk publik (memerlukan `allowFrom: ["*"]`).
- **disabled**: abaikan DM masuk.

Catatan penegakan:

- Tanda tangan event masuk diverifikasi sebelum kebijakan pengirim dan dekripsi NIP-04, sehingga event palsu ditolak sejak awal.
- Balasan pairing dikirim tanpa memproses isi DM asli.
- DM masuk dibatasi lajunya dan payload terlalu besar dibuang sebelum dekripsi.

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

## Relay

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

- Gunakan 2-3 relay untuk redundansi.
- Hindari terlalu banyak relay (latensi, duplikasi).
- Relay berbayar dapat meningkatkan keandalan.
- Relay lokal cocok untuk pengujian (`ws://localhost:7777`).

## Dukungan protokol

| NIP    | Status       | Deskripsi                              |
| ------ | ------------ | -------------------------------------- |
| NIP-01 | Didukung     | Format event dasar + metadata profil   |
| NIP-04 | Didukung     | DM terenkripsi (`kind:4`)              |
| NIP-17 | Direncanakan | DM berbungkus hadiah                   |
| NIP-44 | Direncanakan | Enkripsi berversi                      |

## Pengujian

### Relay lokal

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

- Verifikasi kunci privat valid.
- Pastikan URL relay dapat dijangkau dan menggunakan `wss://` (atau `ws://` untuk lokal).
- Pastikan `enabled` bukan `false`.
- Periksa log Gateway untuk error koneksi relay.

### Tidak mengirim respons

- Periksa apakah relay menerima penulisan.
- Verifikasi konektivitas keluar.
- Perhatikan batas laju relay.

### Respons duplikat

- Wajar saat menggunakan beberapa relay.
- Pesan dideduplikasi berdasarkan ID event; hanya pengiriman pertama yang memicu respons.

## Keamanan

- Jangan pernah commit kunci privat.
- Gunakan variabel environment untuk kunci.
- Pertimbangkan `allowlist` untuk bot produksi.
- Tanda tangan diverifikasi sebelum kebijakan pengirim, dan kebijakan pengirim ditegakkan sebelum dekripsi, sehingga event palsu ditolak sejak awal dan pengirim tidak dikenal tidak dapat memaksa kerja kripto penuh.

## Keterbatasan (MVP)

- Hanya pesan langsung (tanpa obrolan grup).
- Tidak ada lampiran media.
- Hanya NIP-04 (gift-wrap NIP-17 direncanakan).

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gating mention
- [Routing Channel](/id/channels/channel-routing) — routing sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
