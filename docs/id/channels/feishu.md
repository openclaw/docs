---
read_when:
    - Anda ingin menghubungkan bot Feishu/Lark
    - Anda sedang mengonfigurasi kanal Feishu
summary: Ikhtisar, fitur, dan konfigurasi bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-06-30T14:25:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 262dda9739de284e32b7e87edc336bdb5d16651dbf37148bad7593f3a6a6b951
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark adalah platform kolaborasi all-in-one tempat tim mengobrol, berbagi dokumen, mengelola kalender, dan menyelesaikan pekerjaan bersama.

**Status:** siap produksi untuk DM bot + obrolan grup. WebSocket adalah mode default; mode webhook bersifat opsional.

---

## Mulai cepat

<Note>
Memerlukan OpenClaw 2026.5.29 atau lebih baru. Jalankan `openclaw --version` untuk memeriksa. Tingkatkan dengan `openclaw update`.
</Note>

<Steps>
  <Step title="Jalankan wizard penyiapan channel">
  ```bash
  openclaw channels login --channel feishu
  ```
  Pilih penyiapan manual untuk menempelkan App ID dan App Secret dari Feishu Open Platform, atau pilih penyiapan QR untuk membuat bot secara otomatis. Jika aplikasi seluler Feishu domestik tidak bereaksi terhadap kode QR, jalankan ulang penyiapan dan pilih penyiapan manual.
  </Step>
  
  <Step title="Setelah penyiapan selesai, mulai ulang gateway untuk menerapkan perubahan">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Kontrol akses

### Pesan langsung

Konfigurasikan `dmPolicy` untuk mengontrol siapa yang dapat mengirim DM ke bot:

- `"pairing"` - pengguna tidak dikenal menerima kode pairing; setujui melalui CLI
- `"allowlist"` - hanya pengguna yang tercantum di `allowFrom` yang dapat mengobrol
- `"open"` - izinkan DM publik hanya ketika `allowFrom` menyertakan `"*"`; dengan entri yang membatasi, hanya pengguna yang cocok yang dapat mengobrol

**Setujui permintaan pairing:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Obrolan grup

**Kebijakan grup** (`channels.feishu.groupPolicy`):

| Nilai         | Perilaku                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Merespons semua pesan di grup                                                                |
| `"allowlist"` | Hanya merespons grup di `groupAllowFrom` atau yang dikonfigurasi secara eksplisit di bawah `groups.<chat_id>` |
| `"disabled"`  | Menonaktifkan semua pesan grup; entri eksplisit `groups.<chat_id>` tidak menimpa ini         |

Default: `allowlist`

**Persyaratan mention** (`channels.feishu.requireMention`):

- `true` - mewajibkan @mention (default)
- `false` - merespons tanpa @mention
- Override per grup: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` dan `@_all` yang hanya untuk siaran tidak diperlakukan sebagai mention bot. Pesan yang menyebut `@all` dan bot secara langsung tetap dihitung sebagai mention bot.

---

## Contoh konfigurasi grup

### Izinkan semua grup, tidak perlu @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Izinkan semua grup, tetap wajibkan @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Izinkan hanya grup tertentu

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

Dalam mode `allowlist`, Anda juga dapat mengizinkan grup dengan menambahkan entri eksplisit `groups.<chat_id>`. Entri eksplisit tidak menimpa `groupPolicy: "disabled"`. Default wildcard di bawah `groups.*` mengonfigurasi grup yang cocok, tetapi tidak mengizinkan grup dengan sendirinya.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### Batasi pengirim dalam grup

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Dapatkan ID grup/pengguna

### ID grup (`chat_id`, format: `oc_xxx`)

Buka grup di Feishu/Lark, klik ikon menu di sudut kanan atas, lalu buka **Settings**. ID grup (`chat_id`) tercantum di halaman pengaturan.

![Dapatkan ID Grup](/images/feishu-get-group-id.png)

### ID pengguna (`open_id`, format: `ou_xxx`)

Mulai gateway, kirim DM ke bot, lalu periksa log:

```bash
openclaw logs --follow
```

Cari `open_id` dalam keluaran log. Anda juga dapat memeriksa permintaan pairing yang tertunda:

```bash
openclaw pairing list feishu
```

---

## Perintah umum

| Perintah  | Deskripsi                        |
| --------- | -------------------------------- |
| `/status` | Menampilkan status bot           |
| `/reset`  | Mereset sesi saat ini            |
| `/model`  | Menampilkan atau mengganti model AI |

<Note>
Feishu/Lark tidak mendukung menu slash-command native, jadi kirim ini sebagai pesan teks biasa.
</Note>

---

## Pemecahan masalah

### Bot tidak merespons dalam obrolan grup

1. Pastikan bot ditambahkan ke grup
2. Pastikan Anda @mention bot (wajib secara default)
3. Verifikasi `groupPolicy` bukan `"disabled"`
4. Periksa log: `openclaw logs --follow`

### Bot tidak menerima pesan

1. Pastikan bot dipublikasikan dan disetujui di Feishu Open Platform / Lark Developer
2. Pastikan langganan event menyertakan `im.message.receive_v1`
3. Pastikan **persistent connection** (WebSocket) dipilih
4. Pastikan semua cakupan izin yang diperlukan diberikan
5. Pastikan gateway berjalan: `openclaw gateway status`
6. Periksa log: `openclaw logs --follow`

### Penyiapan QR tidak bereaksi di aplikasi seluler Feishu

1. Jalankan ulang penyiapan: `openclaw channels login --channel feishu`
2. Pilih penyiapan manual
3. Di Feishu Open Platform, buat aplikasi self-built dan salin App ID serta App Secret-nya
4. Tempelkan kredensial tersebut ke wizard penyiapan

### App Secret bocor

1. Reset App Secret di Feishu Open Platform / Lark Developer
2. Perbarui nilai dalam config Anda
3. Mulai ulang gateway: `openclaw gateway restart`

---

## Konfigurasi lanjutan

### Beberapa akun

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` mengontrol akun mana yang digunakan ketika API keluar tidak menentukan `accountId`.
`accounts.<id>.tts` menggunakan bentuk yang sama seperti `messages.tts` dan melakukan deep-merge di atas
config TTS global, sehingga penyiapan Feishu multi-bot dapat mempertahankan kredensial
provider bersama secara global sambil hanya menimpa voice, model, persona, atau mode otomatis
per akun.

### Batas pesan

- `textChunkLimit` - ukuran chunk teks keluar (default: `2000` karakter)
- `mediaMaxMb` - batas unggah/unduh media (default: `30` MB)

### Streaming

Feishu/Lark mendukung balasan streaming melalui kartu interaktif. Saat diaktifkan, bot memperbarui kartu secara real time saat menghasilkan teks.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

Tetapkan `streaming: false` untuk mengirim balasan lengkap dalam satu pesan. `blockStreaming` nonaktif secara default; aktifkan hanya ketika Anda ingin blok asisten yang selesai dikirim sebelum balasan final.

### Optimisasi kuota

Kurangi jumlah panggilan API Feishu/Lark dengan dua flag opsional:

- `typingIndicator` (default `true`): tetapkan `false` untuk melewati panggilan reaksi mengetik
- `resolveSenderNames` (default `true`): tetapkan `false` untuk melewati pencarian profil pengirim

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Sesi ACP

Feishu/Lark mendukung ACP untuk DM dan pesan thread grup. ACP Feishu/Lark digerakkan oleh perintah teks - tidak ada menu slash-command native, jadi gunakan pesan `/acp ...` langsung dalam percakapan.

#### Binding ACP persisten

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Spawn ACP dari obrolan

Dalam DM atau thread Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` berfungsi untuk DM dan pesan thread Feishu/Lark. Pesan lanjutan dalam percakapan yang terikat diarahkan langsung ke sesi ACP tersebut.

### Routing multi-agen

Gunakan `bindings` untuk merutekan DM atau grup Feishu/Lark ke agen yang berbeda.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Kolom routing:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) atau `"group"` (obrolan grup)
- `match.peer.id`: Open ID pengguna (`ou_xxx`) atau ID grup (`oc_xxx`)

Lihat [Dapatkan ID grup/pengguna](#get-groupuser-ids) untuk tips pencarian.

---

## Isolasi agen per pengguna (Pembuatan Agen Dinamis)

Aktifkan `dynamicAgentCreation` untuk membuat **instance agen terisolasi** secara otomatis bagi setiap pengguna DM. Setiap pengguna mendapatkan miliknya sendiri:

- Direktori workspace independen
- `USER.md` / `SOUL.md` / `MEMORY.md` terpisah
- Riwayat percakapan pribadi
- Skills dan state terisolasi

Ini penting untuk bot publik saat Anda ingin setiap pengguna memiliki pengalaman asisten AI pribadi mereka sendiri.

<Note>
Binding dinamis menyertakan `accountId` Feishu yang dinormalisasi, sehingga akun default dan bernama merutekan setiap pengirim ke agen dinamis yang benar.

Jika akun bernama membuat agen dinamis tanpa cakupan pada rilis lama, agen legacy tersebut tetap dihitung dalam `maxAgents`. Pastikan agen itu tidak digunakan oleh akun default sebelum menghapusnya, atau tingkatkan `maxAgents` sementara; OpenClaw tidak dapat menyimpulkan dengan aman akun mana yang memiliki state legacy yang ambigu.
</Note>

### Penyiapan cepat

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### Cara kerjanya

Ketika pengguna baru mengirim DM pertama mereka:

1. Channel menghasilkan `agentId` unik: `feishu-{user_open_id}` untuk akun default, atau digest identitas dengan awalan akun dan berbatas untuk akun bernama
2. Membuat workspace baru di jalur `workspaceTemplate`
3. Mendaftarkan agen dan membuat binding untuk pengguna ini
4. Helper workspace memastikan file bootstrap (`AGENTS.md`, `SOUL.md`, `USER.md`, dll.) pada akses pertama
5. Merutekan semua pesan mendatang dari pengguna ini ke agen khusus mereka

### Opsi konfigurasi

| Pengaturan                                             | Deskripsi                                      | Bawaan                              |
| ------------------------------------------------------ | ---------------------------------------------- | ----------------------------------- |
| `channels.feishu.dynamicAgentCreation.enabled`         | Aktifkan pembuatan agen otomatis per pengguna  | `false`                             |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Templat path untuk workspace agen dinamis    | `~/.openclaw/workspace-{agentId}`   |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate` | Templat nama direktori agen                   | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`       | Jumlah maksimum agen dinamis yang dibuat       | tidak terbatas                      |

Variabel templat:

- `{agentId}` - ID agen yang dibuat (misalnya, `feishu-ou_xxxxxx` atau `feishu-support-<identity_digest>`)
- `{userId}` - open_id Feishu pengirim (misalnya, `ou_xxxxxx`)

### Cakupan sesi

`session.dmScope` mengontrol bagaimana pesan langsung dipetakan ke sesi agen. Ini adalah **pengaturan global** yang memengaruhi semua channel.

| Nilai                        | Perilaku                                                            | Paling cocok untuk                                                 |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | DM setiap pengguna dipetakan ke sesi utama agennya                  | Bot satu pengguna ketika Anda ingin `USER.md` / `SOUL.md` dimuat otomatis |
| `"per-channel-peer"`         | Setiap kombinasi (channel + pengguna) mendapatkan sesi terpisah     | Bot publik multi-pengguna yang membutuhkan isolasi lebih kuat      |
| `"per-account-channel-peer"` | Setiap kombinasi (akun + channel + pengguna) mendapatkan sesi terpisah | Bot multi-akun yang membutuhkan isolasi sesi tingkat akun        |

**Tradeoff**: Menggunakan `"main"` mengaktifkan pemuatan file bootstrap otomatis (`USER.md`, `SOUL.md`, `MEMORY.md`), tetapi berarti semua DM di semua channel berbagi pola kunci sesi yang sama. Untuk bot publik multi-pengguna ketika isolasi lebih penting daripada pemuatan otomatis bootstrap, pertimbangkan `"per-channel-peer"` dan kelola file bootstrap secara manual.

<Note>
Gunakan `"per-account-channel-peer"` ketika akun Feishu bernama harus mempertahankan sesi terpisah untuk pengirim yang sama. Binding dinamis mempertahankan cakupan akun.
</Note>

```json5
{
  session: {
    // For single-user personal bots: enables auto bootstrap loading
    dmScope: "main",

    // For public multi-user bots: stronger isolation
    // dmScope: "per-channel-peer",
  },
}
```

### Deployment multi-pengguna umum

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### Verifikasi

Periksa log gateway untuk memastikan pembuatan dinamis berfungsi:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

Cantumkan semua workspace yang telah dibuat:

```bash
ls -la ~/.openclaw/workspace-*
```

### Catatan

- **Isolasi workspace**: Setiap pengguna mendapatkan direktori workspace dan instans agen sendiri. Pengguna tidak dapat melihat riwayat percakapan atau file pengguna lain dalam alur perpesanan normal.
- **Batas keamanan**: Ini adalah mekanisme isolasi konteks perpesanan, bukan batas keamanan untuk penyewa bersama yang bermusuhan. Proses agen dan lingkungan host digunakan bersama.
- **`bindings` harus kosong**: Agen dinamis mendaftarkan binding mereka sendiri secara otomatis
- **Jalur upgrade**: Binding manual yang ada tetap berfungsi bersama agen dinamis
- **`session.dmScope` bersifat global**: Ini memengaruhi semua channel, bukan hanya Feishu

---

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi Gateway](/id/gateway/configuration)

| Pengaturan                                             | Deskripsi                                                                        | Bawaan                              |
| ------------------------------------------------------ | -------------------------------------------------------------------------------- | ----------------------------------- |
| `channels.feishu.enabled`                              | Aktifkan/nonaktifkan channel                                                     | `true`                              |
| `channels.feishu.domain`                               | Domain API (`feishu` atau `lark`)                                                | `feishu`                            |
| `channels.feishu.connectionMode`                       | Transport event (`websocket` atau `webhook`)                                     | `websocket`                         |
| `channels.feishu.defaultAccount`                       | Akun bawaan untuk routing keluar                                                 | `default`                           |
| `channels.feishu.verificationToken`                    | Diperlukan untuk mode webhook                                                    | -                                   |
| `channels.feishu.encryptKey`                           | Diperlukan untuk mode webhook                                                    | -                                   |
| `channels.feishu.webhookPath`                          | Path rute Webhook                                                                | `/feishu/events`                    |
| `channels.feishu.webhookHost`                          | Host bind Webhook                                                                | `127.0.0.1`                         |
| `channels.feishu.webhookPort`                          | Port bind Webhook                                                                | `3000`                              |
| `channels.feishu.accounts.<id>.appId`                  | ID aplikasi                                                                      | -                                   |
| `channels.feishu.accounts.<id>.appSecret`              | Rahasia aplikasi                                                                 | -                                   |
| `channels.feishu.accounts.<id>.domain`                 | Override domain per akun                                                         | `feishu`                            |
| `channels.feishu.accounts.<id>.tts`                    | Override TTS per akun                                                            | `messages.tts`                      |
| `channels.feishu.dmPolicy`                             | Kebijakan DM                                                                     | `pairing`                           |
| `channels.feishu.allowFrom`                            | Allowlist DM (daftar open_id)                                                    | -                                   |
| `channels.feishu.groupPolicy`                          | Kebijakan grup                                                                   | `allowlist`                         |
| `channels.feishu.groupAllowFrom`                       | Allowlist grup                                                                   | -                                   |
| `channels.feishu.requireMention`                       | Wajibkan @mention di grup                                                        | `true`                              |
| `channels.feishu.groups.<chat_id>.requireMention`      | Override @mention per grup; ID eksplisit juga menerima grup dalam mode allowlist | diwariskan                          |
| `channels.feishu.groups.<chat_id>.enabled`             | Aktifkan/nonaktifkan grup tertentu                                               | `true`                              |
| `channels.feishu.dynamicAgentCreation.enabled`         | Aktifkan pembuatan agen otomatis per pengguna                                    | `false`                             |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Templat path untuk workspace agen dinamis                                      | `~/.openclaw/workspace-{agentId}`   |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate` | Templat nama direktori agen                                                     | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`       | Jumlah maksimum agen dinamis yang dibuat                                         | tidak terbatas                      |
| `channels.feishu.textChunkLimit`                       | Ukuran potongan pesan                                                            | `2000`                              |
| `channels.feishu.mediaMaxMb`                           | Batas ukuran media                                                               | `30`                                |
| `channels.feishu.streaming`                            | Output kartu streaming                                                           | `true`                              |
| `channels.feishu.blockStreaming`                       | Streaming balasan blok selesai                                                   | `false`                             |
| `channels.feishu.typingIndicator`                      | Kirim reaksi mengetik                                                            | `true`                              |
| `channels.feishu.resolveSenderNames`                   | Resolusi nama tampilan pengirim                                                  | `true`                              |
| `channels.feishu.tools.bitable`                        | Aktifkan alat Bitable/Base                                                       | `true`                              |
| `channels.feishu.tools.base`                           | Alias untuk `channels.feishu.tools.bitable`; `bitable` eksplisit menang ketika keduanya diatur | `true`                   |
| `channels.feishu.accounts.<id>.tools.bitable`          | Gerbang alat Bitable/Base per akun                                               | diwariskan                          |
| `channels.feishu.accounts.<id>.tools.base`             | Alias per akun untuk `tools.bitable`                                             | diwariskan                          |

---

## Jenis pesan yang didukung

### Terima

- ✅ Teks
- ✅ Teks kaya (post)
- ✅ Gambar
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Stiker

Pesan audio masuk Feishu/Lark dinormalisasi sebagai placeholder media, bukan
JSON `file_key` mentah. Ketika `tools.media.audio` dikonfigurasi, OpenClaw
mengunduh resource catatan suara dan menjalankan transkripsi audio bersama sebelum
giliran agen, sehingga agen menerima transkrip ucapan. Jika Feishu menyertakan
teks transkrip langsung dalam payload audio, teks tersebut digunakan tanpa
panggilan ASR lain. Tanpa penyedia transkripsi audio, agen tetap menerima
placeholder `<media:audio>` ditambah lampiran yang disimpan, bukan payload
resource Feishu mentah.

### Kirim

- ✅ Teks
- ✅ Gambar
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Kartu interaktif (termasuk pembaruan streaming)
- ⚠️ Teks kaya (pemformatan gaya posting; tidak mendukung kemampuan penulisan Feishu/Lark penuh)

Gelembung audio native Feishu/Lark menggunakan tipe pesan Feishu `audio` dan memerlukan
media unggahan Ogg/Opus (`file_type: "opus"`). Media `.opus` dan `.ogg` yang sudah ada
dikirim langsung sebagai audio native. MP3/WAV/M4A dan format lain yang kemungkinan audio
ditranskode ke Ogg/Opus 48kHz dengan `ffmpeg` hanya ketika balasan meminta pengiriman
suara (`audioAsVoice` / alat pesan `asVoice`, termasuk balasan catatan suara TTS).
Lampiran MP3 biasa tetap menjadi file reguler. Jika `ffmpeg` tidak ada atau
konversi gagal, OpenClaw beralih ke lampiran file dan mencatat alasannya.

### Utas dan balasan

- ✅ Balasan inline
- ✅ Balasan utas
- ✅ Balasan media tetap sadar utas saat membalas pesan utas

Untuk `groupSessionScope: "group_topic"` dan `"group_topic_sender"`, grup topik
native Feishu/Lark menggunakan event `thread_id` (`omt_*`) sebagai kunci sesi
topik kanonis. Jika event pembuka topik native menghilangkan `thread_id`, OpenClaw
menghidrasinya dari Feishu sebelum merutekan giliran. Balasan grup normal yang
diubah OpenClaw menjadi utas tetap menggunakan ID pesan akar balasan (`om_*`) agar
giliran pertama dan giliran lanjutan tetap berada dalam sesi yang sama.

---

## Terkait

- [Ringkasan Channel](/id/channels) - semua channel yang didukung
- [Penyandingan](/id/channels/pairing) - autentikasi DM dan alur penyandingan
- [Grup](/id/channels/groups) - perilaku obrolan grup dan gating penyebutan
- [Perutean Channel](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan pengerasan
