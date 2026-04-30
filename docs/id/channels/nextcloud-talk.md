---
read_when:
    - Mengerjakan fitur saluran Nextcloud Talk
summary: Status dukungan, kemampuan, dan konfigurasi Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-30T09:34:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcbe8a65adfddc95d2b4944af88f9982e23a1676752efec2bbf40cfc4dd846d2
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Status: Plugin bawaan (bot Webhook). Pesan langsung, ruang, reaksi, dan pesan Markdown didukung.

## Plugin bawaan

Nextcloud Talk dikirim sebagai Plugin bawaan dalam rilis OpenClaw saat ini, sehingga
build paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang mengecualikan Nextcloud Talk,
instal paket npm saat ini ketika sudah diterbitkan:

Instal melalui CLI (registri npm, ketika paket saat ini tersedia):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Jika npm melaporkan paket milik OpenClaw sebagai sudah tidak digunakan, gunakan build
OpenClaw berpakej saat ini atau jalur checkout lokal hingga paket npm yang lebih baru
diterbitkan.

Checkout lokal (saat menjalankan dari repo git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat (pemula)

1. Pastikan Plugin Nextcloud Talk tersedia.
   - Rilis OpenClaw berpakej saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Di server Nextcloud Anda, buat bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Aktifkan bot di pengaturan ruang target.
4. Konfigurasikan OpenClaw:
   - Konfigurasi: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Atau env: `NEXTCLOUD_TALK_BOT_SECRET` (hanya akun default)

   Penyiapan CLI:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Field eksplisit yang setara:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Rahasia berbasis file:

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

- Bot tidak dapat memulai DM. Pengguna harus mengirim pesan ke bot terlebih dahulu.
- URL Webhook harus dapat dijangkau oleh Gateway; atur `webhookPublicUrl` jika berada di belakang proxy.
- Unggahan media tidak didukung oleh API bot; media dikirim sebagai URL.
- Payload Webhook tidak membedakan DM dan ruang; atur `apiUser` + `apiPassword` untuk mengaktifkan pencarian jenis ruang (jika tidak, DM diperlakukan sebagai ruang).

## Kontrol akses (DM)

- Default: `channels.nextcloud-talk.dmPolicy = "pairing"`. Pengirim yang tidak dikenal menerima kode pairing.
- Setujui melalui:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DM publik: `channels.nextcloud-talk.dmPolicy="open"` ditambah `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` hanya mencocokkan ID pengguna Nextcloud; nama tampilan diabaikan.

## Ruang (grup)

- Default: `channels.nextcloud-talk.groupPolicy = "allowlist"` (dengan gating mention).
- Izinkan ruang dengan `channels.nextcloud-talk.rooms`:

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

- Untuk tidak mengizinkan ruang apa pun, biarkan allowlist kosong atau atur `channels.nextcloud-talk.groupPolicy="disabled"`.

## Kapabilitas

| Fitur          | Status              |
| -------------- | ------------------- |
| Pesan langsung | Didukung            |
| Ruang          | Didukung            |
| Thread         | Tidak didukung      |
| Media          | Hanya URL           |
| Reaksi         | Didukung            |
| Perintah native | Tidak didukung     |

## Referensi konfigurasi (Nextcloud Talk)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

Opsi penyedia:

- `channels.nextcloud-talk.enabled`: aktifkan/nonaktifkan startup channel.
- `channels.nextcloud-talk.baseUrl`: URL instans Nextcloud.
- `channels.nextcloud-talk.botSecret`: rahasia bersama bot.
- `channels.nextcloud-talk.botSecretFile`: jalur rahasia file reguler. Symlink ditolak.
- `channels.nextcloud-talk.apiUser`: pengguna API untuk pencarian ruang (deteksi DM).
- `channels.nextcloud-talk.apiPassword`: kata sandi API/aplikasi untuk pencarian ruang.
- `channels.nextcloud-talk.apiPasswordFile`: jalur file kata sandi API.
- `channels.nextcloud-talk.webhookPort`: port listener Webhook (default: 8788).
- `channels.nextcloud-talk.webhookHost`: host Webhook (default: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: jalur Webhook (default: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL Webhook yang dapat dijangkau secara eksternal.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: allowlist DM (ID pengguna). `open` memerlukan `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: allowlist grup (ID pengguna).
- `channels.nextcloud-talk.rooms`: pengaturan dan allowlist per ruang.
- `channels.nextcloud-talk.historyLimit`: batas riwayat grup (0 menonaktifkan).
- `channels.nextcloud-talk.dmHistoryLimit`: batas riwayat DM (0 menonaktifkan).
- `channels.nextcloud-talk.dms`: override per DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: ukuran potongan teks keluar (karakter).
- `channels.nextcloud-talk.chunkMode`: `length` (default) atau `newline` untuk membagi pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.
- `channels.nextcloud-talk.blockStreaming`: nonaktifkan streaming blok untuk channel ini.
- `channels.nextcloud-talk.blockStreamingCoalesce`: penyetelan koalesensi streaming blok.
- `channels.nextcloud-talk.mediaMaxMb`: batas media masuk (MB).

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gating mention
- [Routing Channel](/id/channels/channel-routing) — routing sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
