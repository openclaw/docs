---
read_when:
    - Sedang mengerjakan fitur channel Nextcloud Talk
summary: Status dukungan, kapabilitas, dan konfigurasi Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-05T13:43:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 900402afe67cf3ce96103d55158eb28cffb29c9845b77248e70d7653b12ae810
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

# Nextcloud Talk

Status: plugin bawaan (bot webhook). Direct message, room, reactions, dan pesan markdown didukung.

## Plugin bawaan

Nextcloud Talk dikirim sebagai plugin bawaan dalam rilis OpenClaw saat ini, jadi
build terpaket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Nextcloud Talk,
instal secara manual:

Instal melalui CLI (registry npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Checkout lokal (saat berjalan dari repo git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Detail: [Plugins](/tools/plugin)

## Penyiapan cepat (pemula)

1. Pastikan plugin Nextcloud Talk tersedia.
   - Rilis OpenClaw terpaket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Di server Nextcloud Anda, buat bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Aktifkan bot di pengaturan room target.
4. Konfigurasikan OpenClaw:
   - Config: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Atau env: `NEXTCLOUD_TALK_BOT_SECRET` (hanya akun default)
5. Mulai ulang gateway (atau selesaikan penyiapan).

Config minimal:

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
- URL webhook harus dapat dijangkau oleh Gateway; atur `webhookPublicUrl` jika berada di balik proxy.
- Unggahan media tidak didukung oleh API bot; media dikirim sebagai URL.
- Payload webhook tidak membedakan DM vs room; atur `apiUser` + `apiPassword` untuk mengaktifkan lookup tipe room (jika tidak, DM diperlakukan sebagai room).

## Kontrol akses (DM)

- Default: `channels.nextcloud-talk.dmPolicy = "pairing"`. Pengirim yang tidak dikenal mendapatkan kode pairing.
- Setujui melalui:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DM publik: `channels.nextcloud-talk.dmPolicy="open"` ditambah `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` hanya cocok dengan ID pengguna Nextcloud; nama tampilan diabaikan.

## Room (grup)

- Default: `channels.nextcloud-talk.groupPolicy = "allowlist"` (dibatasi mention).
- Masukkan room ke allowlist dengan `channels.nextcloud-talk.rooms`:

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

- Untuk tidak mengizinkan room apa pun, biarkan allowlist kosong atau atur `channels.nextcloud-talk.groupPolicy="disabled"`.

## Kapabilitas

| Fitur           | Status            |
| --------------- | ----------------- |
| Direct message  | Didukung          |
| Room            | Didukung          |
| Thread          | Tidak didukung    |
| Media           | Hanya URL         |
| Reactions       | Didukung          |
| Perintah native | Tidak didukung    |

## Referensi konfigurasi (Nextcloud Talk)

Konfigurasi lengkap: [Configuration](/gateway/configuration)

Opsi provider:

- `channels.nextcloud-talk.enabled`: aktifkan/nonaktifkan startup channel.
- `channels.nextcloud-talk.baseUrl`: URL instance Nextcloud.
- `channels.nextcloud-talk.botSecret`: rahasia bersama bot.
- `channels.nextcloud-talk.botSecretFile`: path rahasia file reguler. Symlink ditolak.
- `channels.nextcloud-talk.apiUser`: pengguna API untuk lookup room (deteksi DM).
- `channels.nextcloud-talk.apiPassword`: kata sandi API/aplikasi untuk lookup room.
- `channels.nextcloud-talk.apiPasswordFile`: path file kata sandi API.
- `channels.nextcloud-talk.webhookPort`: port listener webhook (default: 8788).
- `channels.nextcloud-talk.webhookHost`: host webhook (default: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: path webhook (default: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL webhook yang dapat dijangkau secara eksternal.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: allowlist DM (ID pengguna). `open` memerlukan `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: allowlist grup (ID pengguna).
- `channels.nextcloud-talk.rooms`: pengaturan per-room dan allowlist.
- `channels.nextcloud-talk.historyLimit`: batas riwayat grup (0 menonaktifkan).
- `channels.nextcloud-talk.dmHistoryLimit`: batas riwayat DM (0 menonaktifkan).
- `channels.nextcloud-talk.dms`: override per-DM (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: ukuran potongan teks keluar (karakter).
- `channels.nextcloud-talk.chunkMode`: `length` (default) atau `newline` untuk membagi pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.
- `channels.nextcloud-talk.blockStreaming`: nonaktifkan block streaming untuk channel ini.
- `channels.nextcloud-talk.blockStreamingCoalesce`: tuning penggabungan block streaming.
- `channels.nextcloud-talk.mediaMaxMb`: batas media masuk (MB).

## Terkait

- [Ikhtisar Channels](/channels) — semua channel yang didukung
- [Pairing](/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/channels/groups) — perilaku obrolan grup dan pembatasan mention
- [Channel Routing](/channels/channel-routing) — perutean sesi untuk pesan
- [Security](/gateway/security) — model akses dan penguatan
