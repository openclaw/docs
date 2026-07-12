---
read_when:
    - Mengerjakan fitur saluran Nextcloud Talk
summary: Status dukungan, kemampuan, dan konfigurasi Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-12T13:56:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk adalah Plugin kanal yang dapat diunduh (`@openclaw/nextcloud-talk`) yang menghubungkan OpenClaw ke instans Nextcloud yang dihosting sendiri melalui bot Webhook Talk. Pesan langsung, ruang, reaksi, dan pesan markdown didukung; media dikirim sebagai URL.

## Instalasi

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Gunakan spesifikasi paket tanpa versi untuk mengikuti tag rilis resmi saat ini. Sematkan versi yang tepat hanya jika Anda memerlukan instalasi yang dapat direproduksi.

Dari checkout lokal (alur kerja pengembangan):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Mulai ulang Gateway setelah menginstal. Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat (pemula)

1. Instal Plugin (di atas).
2. Di server Nextcloud Anda, buat bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Pertahankan `--feature response`: tanpanya, balasan keluar gagal dengan 401. Perbaiki bot yang sudah ada dengan `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Aktifkan bot di pengaturan ruang target.
4. Konfigurasikan OpenClaw:
   - Konfigurasi: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Atau variabel lingkungan: `NEXTCLOUD_TALK_BOT_SECRET` (hanya akun default)

   Penyiapan CLI (`--url`/`--token` adalah alias untuk bidang eksplisit; `nc-talk` dan `nc` berfungsi sebagai alias kanal):

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Bidang eksplisit yang setara:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Rahasia berbasis berkas:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Mulai ulang Gateway (atau selesaikan penyiapan).

Konfigurasi minimal:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Catatan

- Bot tidak dapat memulai pesan langsung. Pengguna harus mengirim pesan kepada bot terlebih dahulu.
- URL Webhook harus dapat dijangkau dari server Nextcloud; atur `webhookPublicUrl` ketika Gateway berada di belakang proksi. Permintaan Webhook ditandatangani dengan HMAC-SHA256 menggunakan rahasia bot; tanda tangan yang tidak valid ditolak dan dibatasi lajunya.
- Unggahan media tidak didukung oleh API bot; media keluar ditambahkan sebagai baris `Attachment: <url>`.
- Muatan Webhook tidak membedakan pesan langsung dari ruang; atur `apiUser` + `apiPassword` untuk mengaktifkan pencarian jenis ruang (disimpan dalam cache sekitar 5 menit). Tanpanya, setiap percakapan diperlakukan sebagai ruang.
- Permintaan keluar melewati pelindung SSRF. Untuk host Nextcloud pada jaringan privat/internal tepercaya, aktifkan dengan `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- Jika `apiUser`/`apiPassword` dan `webhookPublicUrl` diatur, `openclaw channels status` memeriksa bot dan memperingatkan ketika fitur `response` tidak tersedia.

## Kontrol akses (pesan langsung)

- Default: `channels.nextcloud-talk.dmPolicy = "pairing"`. Pengirim yang tidak dikenal mendapatkan kode pemasangan.
- Setujui melalui:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Pesan langsung publik: `channels.nextcloud-talk.dmPolicy="open"` ditambah `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` hanya mencocokkan ID pengguna Nextcloud (huruf kecil); nama tampilan diabaikan.

## Ruang (grup)

- Default: `channels.nextcloud-talk.groupPolicy = "allowlist"` (dibatasi berdasarkan penyebutan).
- Masukkan ruang ke daftar yang diizinkan dengan `channels.nextcloud-talk.rooms`, menggunakan token ruang sebagai kunci; `"*"` menetapkan default karakter pengganti:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Kunci per ruang: `requireMention` (default true), `enabled` (false menonaktifkan ruang), `allowFrom` (daftar pengirim yang diizinkan per ruang), `tools` (penggantian izin/tolak alat), `skills` (membatasi Skills yang dimuat), `systemPrompt`.
- Untuk tidak mengizinkan ruang apa pun, biarkan daftar yang diizinkan kosong atau atur `channels.nextcloud-talk.groupPolicy="disabled"`.

## Kemampuan

| Fitur           | Status              |
| --------------- | ------------------- |
| Pesan langsung  | Didukung            |
| Ruang           | Didukung            |
| Utas            | Tidak didukung      |
| Media           | Hanya URL           |
| Reaksi          | Didukung            |
| Perintah native | Tidak didukung      |

## Referensi konfigurasi (Nextcloud Talk)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

Opsi penyedia:

- `channels.nextcloud-talk.enabled`: mengaktifkan/menonaktifkan pengaktifan kanal.
- `channels.nextcloud-talk.baseUrl`: URL instans Nextcloud.
- `channels.nextcloud-talk.botSecret`: rahasia bersama bot (string atau referensi rahasia).
- `channels.nextcloud-talk.botSecretFile`: jalur rahasia berupa berkas biasa. Tautan simbolis ditolak.
- `channels.nextcloud-talk.apiUser`: pengguna API untuk pencarian ruang (deteksi pesan langsung) dan pemeriksaan status.
- `channels.nextcloud-talk.apiPassword`: kata sandi API/aplikasi untuk pencarian ruang.
- `channels.nextcloud-talk.apiPasswordFile`: jalur berkas kata sandi API.
- `channels.nextcloud-talk.webhookPort`: porta pendengar Webhook (default: 8788).
- `channels.nextcloud-talk.webhookHost`: host Webhook (default: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: jalur Webhook (default: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL Webhook yang dapat dijangkau secara eksternal.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing). `open` memerlukan `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: daftar pesan langsung yang diizinkan (ID pengguna).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (default: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: daftar pengirim ruang yang diizinkan (ID pengguna); kembali menggunakan `allowFrom` jika tidak diatur.
- `channels.nextcloud-talk.rooms`: pengaturan dan daftar yang diizinkan per ruang (lihat di atas).
- Grup akses pengirim statis dapat dirujuk dari `allowFrom` dan `groupAllowFrom` dengan `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: batas riwayat grup (0 menonaktifkan).
- `channels.nextcloud-talk.dmHistoryLimit`: batas riwayat pesan langsung (0 menonaktifkan).
- `channels.nextcloud-talk.dms`: penggantian per pesan langsung dengan ID pengguna sebagai kunci (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: ukuran potongan teks keluar dalam karakter (default: 4000).
- `channels.nextcloud-talk.chunkMode`: `length` (default) atau `newline` untuk memisahkan pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.
- `channels.nextcloud-talk.blockStreaming`: menonaktifkan streaming blok untuk kanal ini.
- `channels.nextcloud-talk.blockStreamingCoalesce`: penyesuaian penggabungan streaming blok.
- `channels.nextcloud-talk.responsePrefix`: prefiks balasan keluar.
- `channels.nextcloud-talk.markdown.tables`: mode perenderan tabel markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: batas media masuk (MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: mengizinkan host Nextcloud privat/internal melewati pelindung SSRF.
- `channels.nextcloud-talk.accounts.<id>`: penggantian per akun (kunci yang sama); `defaultAccount` memilih akun default. Variabel lingkungan `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` hanya berlaku untuk akun default.

## Terkait

- [Ikhtisar Kanal](/id/channels) — semua kanal yang didukung
- [Pemasangan](/id/channels/pairing) — autentikasi pesan langsung dan alur pemasangan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan berdasarkan penyebutan
- [Perutean Kanal](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
