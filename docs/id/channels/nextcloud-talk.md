---
read_when:
    - Mengerjakan fitur saluran Nextcloud Talk
summary: Status dukungan, kemampuan, dan konfigurasi Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-16T17:47:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59f4fe51555bcb13d630140866307b1a49ba077059818ec116ee50ef0c877b2b
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk adalah plugin saluran yang dapat diunduh (`@openclaw/nextcloud-talk`) yang menghubungkan OpenClaw ke instans Nextcloud yang dihosting sendiri melalui bot Webhook Talk. Pesan langsung, ruang, reaksi, dan pesan markdown didukung; media dikirim sebagai URL.

## Instalasi

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Gunakan spesifikasi paket tanpa versi untuk mengikuti tag rilis resmi saat ini. Sematkan versi persis hanya jika Anda memerlukan instalasi yang dapat direproduksi.

Dari checkout lokal (alur kerja pengembangan):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Mulai ulang Gateway setelah menginstal. Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat (pemula)

1. Instal plugin (di atas).
2. Di server Nextcloud Anda, buat bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Pertahankan `--feature response`: tanpanya, balasan keluar gagal dengan 401. Perbaiki bot yang sudah ada dengan `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Aktifkan bot di pengaturan ruang tujuan.
4. Konfigurasikan OpenClaw:
   - Konfigurasi: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Atau variabel lingkungan: `NEXTCLOUD_TALK_BOT_SECRET` (khusus akun default)

   Penyiapan CLI (`--url`/`--token` adalah alias untuk bidang eksplisit; `nc-talk` dan `nc` berfungsi sebagai alias saluran):

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

- Bot tidak dapat memulai DM. Pengguna harus mengirim pesan kepada bot terlebih dahulu.
- URL Webhook harus dapat dijangkau dari server Nextcloud; atur `webhookPublicUrl` saat Gateway berada di belakang proksi. Permintaan Webhook ditandatangani dengan HMAC-SHA256 menggunakan rahasia bot; tanda tangan yang tidak valid ditolak dan dikenai pembatasan laju.
- Unggahan media tidak didukung oleh API bot; media keluar ditambahkan sebagai baris `Attachment: <url>`.
- Payload Webhook tidak membedakan DM dari ruang; atur `apiUser` + `apiPassword` untuk mengaktifkan pencarian jenis ruang (di-cache sekitar 5 menit). Tanpa keduanya, setiap percakapan diperlakukan sebagai ruang.
- Permintaan keluar melewati pengaman SSRF. Untuk host Nextcloud pada jaringan privat/internal tepercaya, ikut sertakan dengan `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- Jika `apiUser`/`apiPassword` dan `webhookPublicUrl` ditetapkan, `openclaw channels status` memeriksa bot dan memperingatkan ketika fitur `response` tidak tersedia.

## Kontrol akses (DM)

- Default: `channels.nextcloud-talk.dmPolicy = "pairing"`. Pengirim yang tidak dikenal menerima kode penyandingan.
- Setujui melalui:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DM publik: `channels.nextcloud-talk.dmPolicy="open"` ditambah `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` hanya mencocokkan ID pengguna Nextcloud (huruf kecil); nama tampilan diabaikan.

## Ruang (grup)

- Default: `channels.nextcloud-talk.groupPolicy = "allowlist"` (memerlukan penyebutan).
- Izinkan ruang dengan `channels.nextcloud-talk.rooms`, yang dikunci berdasarkan token ruang; `"*"` menetapkan default karakter pengganti:

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
- Agar tidak mengizinkan ruang apa pun, biarkan daftar izin kosong atau atur `channels.nextcloud-talk.groupPolicy="disabled"`.

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

- `channels.nextcloud-talk.enabled`: aktifkan/nonaktifkan pengaktifan saluran.
- `channels.nextcloud-talk.baseUrl`: URL instans Nextcloud.
- `channels.nextcloud-talk.botSecret`: rahasia bersama bot (string atau referensi rahasia).
- `channels.nextcloud-talk.botSecretFile`: jalur rahasia berkas reguler. Tautan simbolis ditolak.
- `channels.nextcloud-talk.apiUser`: pengguna API untuk pencarian ruang (deteksi DM) dan pemeriksaan status.
- `channels.nextcloud-talk.apiPassword`: kata sandi API/aplikasi untuk pencarian ruang.
- `channels.nextcloud-talk.apiPasswordFile`: jalur berkas kata sandi API.
- `channels.nextcloud-talk.webhookPort`: port pendengar Webhook (default: 8788).
- `channels.nextcloud-talk.webhookHost`: host Webhook (default: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: jalur Webhook (default: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL Webhook yang dapat dijangkau secara eksternal.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing). `open` memerlukan `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: daftar DM yang diizinkan (ID pengguna).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (default: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: daftar pengirim ruang yang diizinkan (ID pengguna); menggunakan `allowFrom` sebagai cadangan jika tidak ditetapkan.
- `channels.nextcloud-talk.rooms`: pengaturan per ruang dan daftar izin (lihat di atas).
- Grup akses pengirim statis dapat dirujuk dari `allowFrom` dan `groupAllowFrom` dengan `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: batas riwayat grup (0 menonaktifkan).
- `channels.nextcloud-talk.dmHistoryLimit`: batas riwayat DM (0 menonaktifkan).
- `channels.nextcloud-talk.dms`: penggantian per DM yang dikunci berdasarkan ID pengguna (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: ukuran potongan teks keluar dalam karakter (default: 4000).
- `channels.nextcloud-talk.streaming.chunkMode`: `length` (default) atau `newline` untuk memisahkan pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.
- `channels.nextcloud-talk.streaming.block.enabled`: aktifkan atau nonaktifkan streaming blok untuk saluran ini.
- `channels.nextcloud-talk.streaming.block.coalesce`: penyetelan penggabungan streaming blok.
- `channels.nextcloud-talk.responsePrefix`: prefiks balasan keluar.
- `channels.nextcloud-talk.markdown.tables`: mode perenderan tabel markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: batas media masuk (MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: izinkan host Nextcloud privat/internal melewati pengaman SSRF.
- `channels.nextcloud-talk.accounts.<id>`: penggantian per akun (kunci yang sama); `defaultAccount` memilih akun default. Variabel lingkungan `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` hanya berlaku untuk akun default.

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Penyandingan](/id/channels/pairing) — autentikasi DM dan alur penyandingan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan persyaratan penyebutan
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
