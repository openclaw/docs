---
read_when:
    - Anda ingin OpenClaw menerima pesan langsung melalui Nostr
    - Anda sedang menyiapkan perpesanan terdesentralisasi
summary: Saluran DM Nostr melalui pesan terenkripsi NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-07-12T14:00:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr adalah plugin saluran yang dapat diunduh (`@openclaw/nostr`) yang memungkinkan OpenClaw menerima dan menjawab pesan langsung terenkripsi NIP-04 melalui relai Nostr. Satu akun per Gateway; hanya pesan langsung.

## Instalasi

```bash
openclaw plugins install @openclaw/nostr
```

Gunakan spesifikasi paket tanpa versi untuk mengikuti tag rilis resmi saat ini. Sematkan versi persis hanya jika Anda memerlukan instalasi yang dapat direproduksi.

Dari checkout lokal (alur kerja pengembangan):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Mulai ulang Gateway setelah memasang atau mengaktifkan plugin. Orientasi awal (`openclaw onboard`) dan `openclaw channels add` menampilkan Nostr dari katalog saluran bersama setelah plugin dipasang.

### Penyiapan noninteraktif

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Gunakan `--use-env` agar `NOSTR_PRIVATE_KEY` tetap berada di lingkungan alih-alih menyimpan kunci dalam konfigurasi (hanya akun bawaan).

## Penyiapan cepat

1. Buat pasangan kunci Nostr (jika diperlukan):

```bash
# Menggunakan nak
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

| Kunci        | Jenis    | Bawaan                                      | Deskripsi                                                       |
| ------------ | -------- | ------------------------------------------- | --------------------------------------------------------------- |
| `privateKey` | string   | wajib                                       | Kunci privat dalam format `nsec` atau hex; referensi rahasia diizinkan |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL relai (WebSocket)                                           |
| `dmPolicy`   | string   | `pairing`                                   | Kebijakan akses pesan langsung                                  |
| `allowFrom`  | string[] | `[]`                                        | Kunci publik pengirim yang diizinkan                            |
| `enabled`    | boolean  | `true`                                      | Aktifkan/nonaktifkan saluran                                    |
| `name`       | string   | -                                           | Nama tampilan                                                   |
| `profile`    | object   | -                                           | Metadata profil NIP-01                                          |

## Metadata profil

Data profil dipublikasikan sebagai peristiwa NIP-01 `kind:0`. Anda dapat mengelolanya dari UI Kontrol (Channels -> Nostr -> Profile) atau mengaturnya langsung dalam konfigurasi.

Contoh:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Bot pesan langsung asisten pribadi",
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
- Pengimporan dari relai menggabungkan bidang dan mempertahankan penggantian lokal.

## Kontrol akses

### Kebijakan pesan langsung

- **pairing** (bawaan): pengirim yang tidak dikenal mendapatkan kode pemasangan.
- **allowlist**: hanya kunci publik dalam `allowFrom` yang dapat mengirim pesan langsung.
- **open**: pesan langsung masuk terbuka untuk publik (memerlukan `allowFrom: ["*"]`).
- **disabled**: abaikan pesan langsung masuk.

Catatan penegakan:

- Tanda tangan peristiwa masuk diverifikasi sebelum kebijakan pengirim dan dekripsi NIP-04, sehingga peristiwa palsu ditolak sejak awal.
- Balasan pemasangan dikirim tanpa mendekripsi atau memproses isi pesan langsung asli.
- Pesan langsung masuk dibatasi lajunya (secara global dan per pengirim), dan muatan yang terlalu besar dibuang sebelum dekripsi.

### Contoh daftar izin

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
- **Kunci publik (`allowFrom`):** `npub...` atau hex

## Relai

Bawaan: `relay.damus.io` dan `nos.lol`.

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

Kiat:

- Gunakan 2–3 relai untuk redundansi.
- Hindari terlalu banyak relai (latensi, duplikasi).
- Relai berbayar dapat meningkatkan keandalan.
- Relai lokal cocok untuk pengujian (`ws://localhost:7777`).

## Dukungan protokol

| NIP    | Status       | Deskripsi                                |
| ------ | ------------ | ---------------------------------------- |
| NIP-01 | Didukung     | Format peristiwa dasar + metadata profil |
| NIP-04 | Didukung     | Pesan langsung terenkripsi (`kind:4`)    |
| NIP-17 | Direncanakan | Pesan langsung berbungkus hadiah         |
| NIP-44 | Direncanakan | Enkripsi berversi                        |

## Pengujian

### Relai lokal

```bash
# Jalankan strfry
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

1. Catat kunci publik bot dari log Gateway atau `openclaw channels status` (hex; konversikan ke npub di klien Anda jika diperlukan).
2. Buka klien Nostr (Amethyst, Damus, dan sebagainya).
3. Kirim pesan langsung ke kunci publik bot.
4. Verifikasi responsnya.

## Pemecahan masalah

### Tidak menerima pesan

- Verifikasi bahwa kunci privat valid.
- Pastikan URL relai dapat dijangkau dan menggunakan `wss://` (atau `ws://` untuk lokal).
- Pastikan `enabled` bukan `false`.
- Periksa log Gateway untuk menemukan kesalahan koneksi relai.

### Tidak mengirim respons

- Periksa apakah relai menerima penulisan.
- Verifikasi konektivitas keluar.
- Waspadai batas laju relai.

### Respons duplikat

- Hal ini wajar saat menggunakan beberapa relai.
- Pesan dideduplikasi berdasarkan ID peristiwa; hanya pengiriman pertama yang memicu respons.

## Keamanan

- Jangan pernah memasukkan kunci privat ke dalam commit.
- Gunakan variabel lingkungan untuk kunci.
- Pertimbangkan `allowlist` untuk bot produksi.
- Tanda tangan diverifikasi sebelum kebijakan pengirim, dan kebijakan pengirim diberlakukan sebelum dekripsi, sehingga peristiwa palsu ditolak sejak awal dan pengirim yang tidak dikenal tidak dapat memaksa pemrosesan kriptografi penuh.

## Keterbatasan (MVP)

- Hanya pesan langsung (tanpa obrolan grup).
- Tidak ada lampiran media.
- Hanya NIP-04 (pembungkusan hadiah NIP-17 direncanakan).

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Pemasangan](/id/channels/pairing) — autentikasi pesan langsung dan alur pemasangan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan berdasarkan sebutan
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
