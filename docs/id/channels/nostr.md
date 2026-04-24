---
read_when:
    - Anda ingin OpenClaw menerima DM melalui Nostr
    - Anda sedang menyiapkan perpesanan terdesentralisasi
summary: Saluran DM Nostr melalui pesan terenkripsi NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-24T08:58:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f722bb4e1c5f2b3a9c1d58f5597aad2826a809cba3d165af7bf2faf72b68a0f
    source_path: channels/nostr.md
    workflow: 15
---

**Status:** Plugin bawaan opsional (dinonaktifkan secara default sampai dikonfigurasi).

Nostr adalah protokol terdesentralisasi untuk jejaring sosial. Saluran ini memungkinkan OpenClaw menerima dan merespons pesan langsung terenkripsi (DM) melalui NIP-04.

## Plugin bawaan

Rilis OpenClaw saat ini menyertakan Nostr sebagai plugin bawaan, sehingga build paket normal tidak memerlukan instalasi terpisah.

### Instalasi lama/kustom

- Onboarding (`openclaw onboard`) dan `openclaw channels add` tetap menampilkan
  Nostr dari katalog saluran bersama.
- Jika build Anda tidak menyertakan Nostr bawaan, instal secara manual.

```bash
openclaw plugins install @openclaw/nostr
```

Gunakan checkout lokal (alur kerja dev):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Mulai ulang Gateway setelah menginstal atau mengaktifkan plugin.

### Penyiapan non-interaktif

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Gunakan `--use-env` untuk menyimpan `NOSTR_PRIVATE_KEY` di environment alih-alih menyimpan kunci di config.

## Penyiapan cepat

1. Buat keypair Nostr (jika perlu):

```bash
# Menggunakan nak
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

| Kunci        | Tipe     | Default                                     | Deskripsi                           |
| ------------ | -------- | ------------------------------------------- | ----------------------------------- |
| `privateKey` | string   | wajib                                       | Kunci privat dalam format `nsec` atau hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL relay (WebSocket)               |
| `dmPolicy`   | string   | `pairing`                                   | Kebijakan akses DM                  |
| `allowFrom`  | string[] | `[]`                                        | Pubkey pengirim yang diizinkan      |
| `enabled`    | boolean  | `true`                                      | Aktifkan/nonaktifkan saluran        |
| `name`       | string   | -                                           | Nama tampilan                       |
| `profile`    | object   | -                                           | Metadata profil NIP-01              |

## Metadata profil

Data profil dipublikasikan sebagai peristiwa NIP-01 `kind:0`. Anda dapat mengelolanya dari UI Control (Channels -> Nostr -> Profile) atau mengaturnya langsung di config.

Contoh:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Bot DM asisten pribadi",
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

- **pairing** (default): pengirim yang tidak dikenal akan mendapatkan kode pairing.
- **allowlist**: hanya pubkey dalam `allowFrom` yang dapat mengirim DM.
- **open**: DM masuk publik (memerlukan `allowFrom: ["*"]`).
- **disabled**: abaikan DM masuk.

Catatan penegakan:

- Tanda tangan peristiwa masuk diverifikasi sebelum kebijakan pengirim dan dekripsi NIP-04, sehingga peristiwa palsu ditolak lebih awal.
- Balasan pairing dikirim tanpa memproses isi DM asli.
- DM masuk dibatasi lajunya dan payload yang terlalu besar dibuang sebelum dekripsi.

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

| NIP    | Status    | Deskripsi                           |
| ------ | --------- | ----------------------------------- |
| NIP-01 | Didukung  | Format peristiwa dasar + metadata profil |
| NIP-04 | Didukung  | DM terenkripsi (`kind:4`)           |
| NIP-17 | Direncanakan | DM gift-wrapped                  |
| NIP-44 | Direncanakan | Enkripsi berversi                |

## Pengujian

### Relay lokal

```bash
# Mulai strfry
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

### Uji manual

1. Catat pubkey bot (npub) dari log.
2. Buka klien Nostr (Damus, Amethyst, dll.).
3. Kirim DM ke pubkey bot.
4. Verifikasi responsnya.

## Pemecahan masalah

### Tidak menerima pesan

- Verifikasi bahwa kunci privat valid.
- Pastikan URL relay dapat dijangkau dan menggunakan `wss://` (atau `ws://` untuk lokal).
- Konfirmasikan `enabled` bukan `false`.
- Periksa log Gateway untuk error koneksi relay.

### Tidak mengirim respons

- Periksa apakah relay menerima penulisan.
- Verifikasi konektivitas keluar.
- Perhatikan rate limit relay.

### Respons duplikat

- Ini normal saat menggunakan beberapa relay.
- Pesan dideduplikasi berdasarkan ID peristiwa; hanya pengiriman pertama yang memicu respons.

## Keamanan

- Jangan pernah commit kunci privat.
- Gunakan variabel environment untuk kunci.
- Pertimbangkan `allowlist` untuk bot produksi.
- Tanda tangan diverifikasi sebelum kebijakan pengirim, dan kebijakan pengirim diterapkan sebelum dekripsi, sehingga peristiwa palsu ditolak lebih awal dan pengirim yang tidak dikenal tidak dapat memaksa pekerjaan kriptografi penuh.

## Keterbatasan (MVP)

- Hanya pesan langsung (tanpa chat grup).
- Tidak ada lampiran media.
- Hanya NIP-04 (gift-wrap NIP-17 direncanakan).

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku chat grup dan pembatasan mention
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
