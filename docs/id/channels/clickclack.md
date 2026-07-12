---
read_when:
    - Menghubungkan OpenClaw ke ruang kerja ClickClack
    - Menguji identitas bot ClickClack
summary: Penyiapan kanal token bot ClickClack dan sintaks target
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T13:55:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack menghubungkan OpenClaw ke ruang kerja ClickClack yang dihosting sendiri melalui token bot ClickClack kelas utama.

Gunakan ini ketika Anda ingin agen OpenClaw tampil sebagai pengguna bot ClickClack. ClickClack mendukung bot layanan independen dan bot milik pengguna; bot milik pengguna mempertahankan `owner_user_id` dan hanya menerima cakupan token yang Anda berikan.

## Penyiapan cepat

Buat token bot di server ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Untuk bot milik pengguna, tambahkan `--owner <user_id>`.

Konfigurasikan OpenClaw:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

Kemudian jalankan:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Sebuah akun dianggap terkonfigurasi hanya jika `baseUrl`, `token`, dan `workspace` semuanya telah ditetapkan. `workspace` menerima id ruang kerja (`wsp_...`), slug, atau nama; Gateway mengubahnya menjadi id saat dimulai.

### Kunci konfigurasi akun

| Kunci                   | Nilai bawaan         | Catatan                                                                                          |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| `baseUrl`               | tidak ada (wajib)    | URL server ClickClack.                                                                           |
| `token`                 | tidak ada (wajib)    | String biasa atau referensi rahasia (`source: "env" \| "file" \| "exec"`).                        |
| `workspace`             | tidak ada (wajib)    | Id, slug, atau nama ruang kerja.                                                                 |
| `replyMode`             | `"agent"`            | `"agent"` menjalankan seluruh alur agen; `"model"` mengirim penyelesaian model langsung singkat. |
| `defaultTo`             | `"channel:general"`  | Target yang digunakan ketika jalur keluar tidak memberikan target.                               |
| `allowFrom`             | `["*"]`              | Daftar izin id pengguna untuk DM dan pesan kanal masuk.                                          |
| `botUserId`             | terdeteksi otomatis | Ditentukan dari identitas token bot saat dimulai.                                                 |
| `agentId`               | bawaan rute          | Tetapkan pesan masuk akun ini ke satu agen.                                                      |
| `toolsAllow`            | tidak ada            | Daftar izin alat untuk balasan agen dari akun ini.                                               |
| `model`, `systemPrompt` | tidak ada            | Digunakan oleh penyelesaian `replyMode: "model"`.                                                 |
| `reconnectMs`           | `1500`               | Penundaan penyambungan ulang waktu nyata (100 hingga 60000).                                      |

Jika `plugins.allow` adalah daftar pembatas yang tidak kosong, memilih ClickClack
secara eksplisit dalam penyiapan kanal atau menjalankan `openclaw plugins enable clickclack`
akan menambahkan `clickclack` ke daftar tersebut. Instalasi saat orientasi awal menggunakan
perilaku pemilihan eksplisit yang sama. Jalur-jalur ini tidak mengganti `plugins.deny` atau
pengaturan global `plugins.enabled: false`. Menjalankan
`openclaw plugins install @openclaw/clickclack` secara langsung mengikuti kebijakan
instalasi plugin biasa dan juga mencatat ClickClack dalam daftar izin yang sudah ada.

## Beberapa bot

Setiap akun membuka koneksi waktu nyata ClickClack sendiri dan menggunakan token botnya sendiri.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## Mode balasan

- `replyMode: "agent"` (bawaan) meneruskan pesan masuk melalui alur agen normal, termasuk perekaman sesi dan kebijakan alat.
- `replyMode: "model"` melewati alur agen dan menggunakan `llm.complete` dari runtime plugin untuk balasan bot langsung yang singkat (secara opsional dibentuk oleh `model` dan `systemPrompt`).

Mode model menjalankan penyelesaian terhadap id agen bot yang telah ditentukan, yang memerlukan
bit kepercayaan eksplisit `plugins.entries.clickclack.llm.allowAgentIdOverride: true`:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

Biarkan bit kepercayaan tetap nonaktif jika Anda hanya menggunakan mode balasan `agent`
bawaan; bit tersebut tidak diperlukan dalam mode itu.

Gunakan mode `agent` untuk bukti korelasi lintas layanan. Untuk id pesan ClickClack otoritatif
dalam bentuk kanonis `msg_<ulid>`, kanal memperoleh id proses OpenClaw deterministik
`clickclack:<message-id>`. Setiap panggilan model kemudian terlihat dalam diagnostik sebagai
`clickclack:<message-id>:model:<n>`; ketika giliran tersebut menggunakan ClawRouter, id
panggilan model yang sama dikirim sebagai `X-Request-ID`. Mode `model` melewati diagnostik
proses/sesi agen normal sehingga tidak cocok untuk jalur bukti ini.

Ketika peristiwa waktu nyata berisi `payload.correlation_id` yang telah divalidasi, kanal
meneruskannya sebagai `X-Correlation-ID` pada pengambilan pesan otoritatif dan permintaan
balasan ClickClack yang dihasilkan. Nilai menggunakan kumpulan karakter aman 128 karakter
milik ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:`, dan `-`); nilai yang tidak valid
dihilangkan. Penggabungan ini hanya berisi pengidentifikasi, tidak pernah berisi isi pesan,
prompt, penyelesaian, kredensial, atau keluaran alat.

## Baris aktivitas agen

Secara bawaan, kanal ClickClack tidak menampilkan apa pun saat giliran agen berjalan; hanya balasan akhir yang dikirim. Tetapkan `agentActivity: true` pada akun untuk menerbitkan baris pesan `agent_commentary` dan `agent_tool` yang persisten selama giliran berlangsung:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

Persyaratan dan perilaku:

- **Nonaktif secara bawaan.** Penyiapan standar dan server ClickClack lama tidak terpengaruh.
- **Memerlukan cakupan token `agent_activity:write`.** Cakupan ini terpisah dari `bot:write` dan tidak diwarisi darinya; buat token bot dengan `--scopes bot:write,agent_activity:write` (atau berikan cakupan tersebut kepada token yang sudah ada) sebelum mengaktifkan opsi ini.
- **Degradasi upaya terbaik.** Jika token tidak memiliki `agent_activity:write` atau server menolak penulisan aktivitas, kegagalan dicatat dan balasan akhir tetap dikirim seperti biasa; baris aktivitas tidak muncul.
- Baris dikelompokkan per giliran (`turn_id`), digabungkan sehingga satu langkah logis menjadi satu baris, dan baris alat menggunakan pemformatan progres yang sama seperti Discord/Slack/Telegram (nama alat beserta detail perintah).
- **Metadata atribusi.** Kiriman yang dibuat agen (baris aktivitas dan balasan akhir) membawa kolom `author_model` dan `author_thinking` yang ditentukan dari model aktual yang digunakan untuk giliran tersebut (termasuk setelah pengalihan). Server yang tidak mendefinisikan kolom ini mengabaikan kolom JSON yang tidak dikenal; server yang menyimpannya dapat menjawab "model mana yang mengatakan baris ini, pada tingkat pemikiran mana" untuk setiap pesan.

## Target

- `channel:<name-or-id>` mengirim ke kanal ruang kerja. Target tanpa awalan secara bawaan menggunakan `channel:`.
- `dm:<user_id>` membuat atau menggunakan kembali percakapan langsung dengan pengguna tersebut.
- `thread:<message_id>` membalas di utas yang berakar pada pesan tersebut.

Target keluar eksplisit juga dapat membawa prefiks penyedia `clickclack:` atau `cc:`.

Contoh:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Izin

Cakupan token ClickClack diberlakukan oleh API ClickClack.

- `bot:read`: membaca data ruang kerja/kanal/pesan/utas/DM/waktu nyata/profil.
- `bot:write`: `bot:read` ditambah pesan kanal, balasan utas, DM, dan unggahan.
- `bot:admin`: `bot:write` ditambah pembuatan kanal.
- `agent_activity:write`: baris aktivitas agen yang persisten (`agent_commentary` / `agent_tool`). Tidak diwarisi oleh `bot:write` atau `bot:admin`; hanya diperlukan ketika `agentActivity: true` ditetapkan.

OpenClaw hanya memerlukan `bot:write` untuk percakapan agen normal. Tambahkan `agent_activity:write` ketika mengaktifkan [baris aktivitas agen](#agent-activity-rows).

## Pemecahan masalah

- `ClickClack is not configured for account "<id>"`: tetapkan `baseUrl`, `token` (misalnya melalui `CLICKCLACK_BOT_TOKEN`), dan `workspace` untuk akun tersebut.
- `ClickClack workspace not found: <value>`: tetapkan `workspace` ke id, slug, atau nama ruang kerja yang dikembalikan oleh ClickClack.
- Tidak ada balasan masuk: pastikan token memiliki akses baca waktu nyata dan perhatikan bahwa bot mengabaikan pesannya sendiri serta pesan dari bot lain.
- Pengiriman ke kanal gagal: pastikan bot adalah anggota ruang kerja dan memiliki `bot:write`.
