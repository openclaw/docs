---
read_when:
    - Anda ingin menghubungkan bot Feishu/Lark
    - Anda sedang mengonfigurasi saluran Feishu
summary: Ikhtisar, fitur, dan konfigurasi bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-07-19T04:55:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 907f99245ec1d5d038362636def039b16225f90ab9d8ec9d61d08f16495a1710
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw terhubung ke Feishu/Lark (platform kolaborasi lengkap) melalui plugin resmi `@openclaw/feishu`: DM bot, obrolan grup, balasan kartu streaming, serta alat dokumen/wiki/drive/Bitable Feishu.

**Status:** siap produksi untuk DM bot + obrolan grup. WebSocket adalah transport peristiwa default (tidak memerlukan URL publik); mode webhook bersifat opsional.

## Mulai cepat

<Note>
Memerlukan OpenClaw 2026.5.29 atau lebih baru. Jalankan `openclaw --version` untuk memeriksa. Tingkatkan versi dengan `openclaw update`.
</Note>

<Steps>
  <Step title="Jalankan wizard penyiapan kanal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Perintah ini memasang plugin `@openclaw/feishu` jika belum tersedia, lalu memandu proses penyiapan:

- **Penyiapan manual**: tempelkan App ID dan App Secret dari Feishu Open Platform (`https://open.feishu.cn`) atau Lark Developer (`https://open.larksuite.com`).
- **Penyiapan QR**: pindai kode QR di aplikasi Feishu untuk membuat bot secara otomatis. Alur ini membatasi DM hanya untuk akun Anda sendiri (`dmPolicy: "allowlist"` dengan `open_id` Anda).

Wizard juga meminta domain API (Feishu atau Lark) dan kebijakan grup. Jika aplikasi seluler Feishu domestik tidak merespons kode QR, jalankan kembali penyiapan dan pilih penyiapan manual.
</Step>

  <Step title="Setelah penyiapan selesai, mulai ulang Gateway untuk menerapkan perubahan">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## Ketahanan pesan masuk

OpenClaw memasukkan envelope `im.message.receive_v1` dan `drive.notice.comment_add_v1` yang telah diautentikasi ke antrean secara tahan lama sebelum pengiriman ke agen. Peristiwa yang tertunda atau dapat dicoba ulang tetap bertahan setelah Gateway dimulai ulang, tetap diserialkan per obrolan atau dokumen, dan menggunakan ID peristiwa Feishu untuk mencegah entri antrean duplikat selama catatan penyelesaian aktif atau yang dipertahankan masih ada.

Jika peristiwa WebSocket tidak dapat dipersistenkan setelah sejumlah percobaan ulang yang dibatasi, OpenClaw menutup soket tersebut dan memaksa koneksi baru yang diautentikasi, alih-alih melanjutkan setelah giliran yang belum di-commit. Jenis peristiwa Feishu lainnya, termasuk reaksi dan undangan rapat VC, menggunakan jalur peristiwa normal dan tidak mendapatkan jaminan antrean tahan lama ini.

## Kontrol akses

### Pesan langsung

Konfigurasikan `channels.feishu.dmPolicy` (default: `pairing`) untuk mengontrol siapa yang dapat mengirim DM kepada bot:

| Nilai         | Perilaku                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | Pengguna yang tidak dikenal menerima kode pemasangan; setujui melalui CLI                                                         |
| `"allowlist"` | Hanya pengguna yang tercantum dalam `allowFrom` yang dapat mengobrol                                                                     |
| `"open"`      | DM publik; validasi konfigurasi mengharuskan `allowFrom` menyertakan `"*"`. Entri non-wildcard tetap mempersempit akses |

**Setujui permintaan pemasangan:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Obrolan grup

**Kebijakan grup** (`channels.feishu.groupPolicy`, default: `allowlist`):

| Nilai         | Perilaku                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Merespons semua pesan dalam grup                                                            |
| `"allowlist"` | Hanya merespons grup dalam `groupAllowFrom` atau yang dikonfigurasi secara eksplisit di bawah `groups.<chat_id>` |
| `"disabled"`  | Menonaktifkan semua pesan grup; entri `groups.<chat_id>` eksplisit tidak menggantikan pengaturan ini         |

**Persyaratan penyebutan** (`channels.feishu.requireMention`):

- Default: @mention diperlukan, kecuali jika kebijakan grup efektif adalah `"open"`; dalam kondisi tersebut, nilai default-nya adalah `false` agar pesan yang tidak dapat menyertakan penyebutan (misalnya gambar) tetap sampai ke agen.
- Tetapkan `true` atau `false` secara eksplisit untuk menggantinya; penggantian per grup: `channels.feishu.groups.<chat_id>.requireMention`.
- `@all` dan `@_all` yang hanya untuk siaran tidak dianggap sebagai penyebutan bot. Pesan yang menyebut `@all` sekaligus bot secara langsung tetap dihitung sebagai penyebutan bot.

## Contoh konfigurasi grup

### Izinkan semua grup tanpa memerlukan @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // requireMention secara default bernilai false pada "open"
    },
  },
}
```

### Izinkan semua grup, tetapi tetap wajibkan @mention

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

### Hanya izinkan grup tertentu

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // ID grup terlihat seperti: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

Dalam mode `allowlist`, Anda juga dapat mengizinkan grup dengan menambahkan entri `groups.<chat_id>` eksplisit. Entri eksplisit tidak menggantikan `groupPolicy: "disabled"`. Default wildcard di bawah `groups.*` mengonfigurasi grup yang cocok, tetapi tidak mengizinkan grup dengan sendirinya.

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
          // open_id pengguna terlihat seperti: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom` menetapkan daftar izin pengirim yang sama untuk semua grup; `allowFrom` per grup memiliki prioritas.

### Pesan yang dibuat oleh bot

Secara default, Feishu mengabaikan pesan yang dibuat oleh bot lain. Untuk mengizinkan percakapan grup antarbot, berikan cakupan `im:message.group_at_msg.include_bot:readonly` dan `im:message:readonly` kepada aplikasi, lalu tetapkan `allowBots`:

```json5
{
  channels: {
    feishu: {
      allowBots: true,
    },
  },
}
```

Feishu hanya mengirimkan peristiwa grup yang dibuat oleh bot ketika bot lain menyebut bot ini. Kebijakan grup, daftar izin pengirim, dan persyaratan penyebutan yang ada tetap berlaku. OpenClaw membuang pesan yang dibuatnya sendiri, menyebut bot rekan pada setiap balasan teks atau kartu, dan menerapkan perlindungan bersama [`channels.defaults.botLoopProtection`](/id/channels/bot-loop-protection).

<a id="get-groupuser-ids"></a>

## Mendapatkan ID grup/pengguna

### ID grup (`chat_id`, format: `oc_xxx`)

Buka grup di Feishu/Lark, klik ikon menu di sudut kanan atas, lalu buka **Settings**. ID grup (`chat_id`) tercantum di halaman pengaturan.

![Dapatkan ID Grup](/images/feishu-get-group-id.png)

### ID pengguna (`open_id`, format: `ou_xxx`)

Mulai Gateway, kirim DM kepada bot, lalu periksa log:

```bash
openclaw logs --follow
```

Cari `open_id` dalam keluaran log. Anda juga dapat memeriksa permintaan pemasangan yang tertunda:

```bash
openclaw pairing list feishu
```

## Perintah umum

| Perintah   | Deskripsi                 |
| --------- | --------------------------- |
| `/status` | Menampilkan status bot             |
| `/reset`  | Mengatur ulang sesi saat ini   |
| `/model`  | Menampilkan atau mengganti model AI |

<Note>
Feishu/Lark tidak mendukung menu perintah garis miring native, jadi kirimkan perintah ini sebagai pesan teks biasa.
</Note>

## Pemecahan masalah

### Bot tidak merespons dalam obrolan grup

1. Pastikan bot telah ditambahkan ke grup
2. Pastikan Anda @mention bot (diwajibkan secara default)
3. Verifikasikan bahwa `groupPolicy` bukan `"disabled"`
4. Periksa log: `openclaw logs --follow`

### Bot tidak menerima pesan

1. Pastikan bot telah dipublikasikan dan disetujui di Feishu Open Platform / Lark Developer
2. Pastikan langganan peristiwa menyertakan `im.message.receive_v1`
3. Untuk bergabung otomatis dengan undangan rapat, langgani juga `vc.bot.meeting_invited_v1`
4. Pastikan **persistent connection** (WebSocket) dipilih
5. Pastikan semua cakupan izin yang diperlukan telah diberikan
6. Pastikan Gateway sedang berjalan: `openclaw gateway status`
7. Periksa log: `openclaw logs --follow`

Berlangganan `vc.bot.meeting_invited_v1` hanya mengirimkan peristiwa. Bergabung otomatis
dinonaktifkan secara default. Untuk mengaktifkannya secara global:

```json5
{
  channels: {
    feishu: {
      vcAutoJoin: true,
    },
  },
}
```

Untuk mengaktifkannya hanya bagi satu akun, hilangkan sakelar tingkat teratas dan tetapkan penggantian akun:

```json5
{
  channels: {
    feishu: {
      accounts: {
        meetings: { vcAutoJoin: true },
      },
    },
  },
}
```

Pengundang tetap melewati kebijakan DM Feishu normal, daftar izin/pemasangan, sesi, dan perutean
balasan sebelum agen menerima giliran untuk bergabung. Bergabung juga memerlukan alat untuk bergabung
ke VC Feishu yang tersedia dan dikonfigurasi bagi identitas aplikasi dengan cakupan
`vc:meeting.bot.join:write`. Sebagai contoh, [skill agen VC `lark-cli` resmi](https://github.com/larksuite/cli/tree/main/skills/lark-vc-agent)
menyediakan `vc +meeting-join`.

<Warning>
Skill agen VC `lark-cli` resmi saat ini menandai tindakan bot rapat sebagai versi beta terbatas. Jika alat mengembalikan `ErrNotInGray` atau kode kesalahan `20017`, aplikasi atau tenant belum diaktifkan untuk versi beta tersebut; gunakan panduan akses awal dalam skill tertaut sebelum memecahkan masalah pemberian cakupan biasa.
</Warning>

### Penyiapan QR tidak merespons di aplikasi seluler Feishu

1. Jalankan kembali penyiapan: `openclaw channels login --channel feishu`
2. Pilih penyiapan manual
3. Di Feishu Open Platform, buat aplikasi mandiri lalu salin App ID dan App Secret-nya
4. Tempelkan kredensial tersebut ke wizard penyiapan

### App Secret bocor

1. Atur ulang App Secret di Feishu Open Platform / Lark Developer
2. Perbarui nilainya dalam konfigurasi Anda
3. Mulai ulang Gateway: `openclaw gateway restart`

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
          name: "Bot utama",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Bot cadangan",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` mengontrol akun yang digunakan ketika API keluar tidak menentukan `accountId`. Entri akun mewarisi pengaturan tingkat teratas; sebagian besar kunci tingkat teratas dapat diganti per akun.
`accounts.<id>.tts` menggunakan bentuk yang sama seperti `messages.tts` dan melakukan deep merge terhadap konfigurasi TTS global, sehingga penyiapan Feishu dengan beberapa bot dapat mempertahankan kredensial penyedia bersama secara global sambil hanya mengganti suara, model, persona, atau mode otomatis per akun.

### Batas pesan

- `textChunkLimit` - ukuran potongan teks keluar (default: `4000` karakter)
- `streaming.chunkMode` - `"length"` (default) membagi pada batas; `"newline"` mengutamakan batas baris baru
- `mediaMaxMb` - batas unggah/unduh media (default: `30` MB)

### Streaming

Feishu/Lark mendukung balasan streaming melalui kartu interaktif (API streaming Card Kit). Ketika diaktifkan, bot memperbarui kartu secara waktu nyata saat menghasilkan teks.

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // keluaran kartu streaming (default: "partial")
        block: { enabled: true }, // mengaktifkan streaming blok yang telah selesai
      },
    },
  },
}
```

Atur `streaming.mode: "off"` untuk mengirim balasan lengkap dalam satu pesan; `renderMode: "raw"` (teks biasa alih-alih kartu) juga menonaktifkan kartu streaming. `streaming.block.enabled` dinonaktifkan secara default; aktifkan hanya jika Anda ingin blok asisten yang telah selesai dikirim sebelum balasan akhir. Boolean lama `streaming` serta kunci datar `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` dimigrasikan ke bentuk bertingkat ini melalui `openclaw doctor --fix`.

### Pengoptimalan kuota

Kurangi jumlah panggilan API Feishu/Lark dengan dua flag opsional:

- `typingIndicator` (default `true`): atur `false` untuk melewati panggilan reaksi mengetik
- `resolveSenderNames` (default `true`): atur `false` untuk melewati pencarian profil pengirim

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

### Cakupan sesi grup dan utas topik

`channels.feishu.groupSessionScope` (tingkat teratas, per akun, atau per grup) mengontrol cara pesan grup dipetakan ke sesi agen:

| Nilai                  | Sesi                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (default)    | Satu sesi per percakapan grup                                       |
| `"group_sender"`       | Satu sesi per (grup + pengirim)                                 |
| `"group_topic"`        | Satu sesi per utas topik; kembali ke sesi grup    |
| `"group_topic_sender"` | Satu sesi per (topik + pengirim); kembali ke (grup + pengirim) |

Untuk cakupan topik, grup topik asli Feishu/Lark menggunakan peristiwa `thread_id` (`omt_*`) sebagai kunci sesi topik kanonis. Jika peristiwa pembuka topik asli tidak menyertakan `thread_id`, OpenClaw mengambilnya dari Feishu sebelum merutekan giliran. Balasan grup biasa yang diubah OpenClaw menjadi utas tetap menggunakan ID pesan akar balasan (`om_*`) agar giliran pertama dan giliran lanjutan tetap berada dalam sesi yang sama.

Atur `replyInThread: "enabled"` (tingkat teratas atau per grup) agar balasan bot membuat atau melanjutkan utas topik Feishu alih-alih membalas sebaris. `topicSessionMode` adalah pendahulu `groupSessionScope` yang sudah tidak digunakan; utamakan `groupSessionScope`.

### Alat ruang kerja Feishu

Plugin ini menyediakan alat agen untuk dokumen, percakapan, basis pengetahuan, penyimpanan cloud, izin, dan Bitable Feishu, serta skill yang sesuai (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`). Kelompok alat dikendalikan oleh `channels.feishu.tools`:

| Kunci             | Alat                                         | Default             |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | Operasi dokumen `feishu_doc`              | `true`              |
| `tools.chat`    | Info percakapan + kueri anggota `feishu_chat`      | `true`              |
| `tools.wiki`    | Basis pengetahuan `feishu_wiki` (memerlukan `doc`) | `true`              |
| `tools.drive`   | Penyimpanan cloud `feishu_drive`                  | `true`              |
| `tools.perm`    | Pengelolaan izin `feishu_perm`           | `false` (sensitif) |
| `tools.scopes`  | Diagnostik cakupan aplikasi `feishu_app_scopes`     | `true`              |
| `tools.bitable` | Operasi Bitable/Base `feishu_bitable_*`    | `true`              |

`tools.base` adalah alias untuk `tools.bitable`; nilai eksplisit `bitable` diprioritaskan jika keduanya ditetapkan. Pengendali per akun berada di bawah `accounts.<id>.tools`.

Berikan `drive:drive.metadata:readonly` untuk pencarian langsung `feishu_drive info` di luar direktori
akar, kecuali aplikasi sudah memiliki cakupan penuh `drive:drive`. Tanpa salah satu cakupan tersebut, `info`
tetap menyediakan pencarian direktori akar lama melalui `drive:drive:readonly`.

### Sesi ACP

Feishu/Lark mendukung ACP untuk DM dan pesan utas grup. ACP Feishu/Lark dikendalikan oleh perintah teks—tidak ada menu perintah garis miring asli, jadi gunakan pesan `/acp ...` secara langsung dalam percakapan.

#### Pengikatan ACP persisten

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

#### Membuat ACP dari percakapan

Dalam DM atau utas Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` berfungsi untuk DM dan pesan utas Feishu/Lark. Pesan lanjutan dalam percakapan yang terikat dirutekan langsung ke sesi ACP tersebut.

### Perutean multiagen

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

Bidang perutean:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) atau `"group"` (percakapan grup)
- `match.peer.id`: Open ID pengguna (`ou_xxx`) atau ID grup (`oc_xxx`)

Lihat [Mendapatkan ID grup/pengguna](#get-groupuser-ids) untuk kiat pencarian.

## Isolasi agen per pengguna (Pembuatan Agen Dinamis)

Aktifkan `dynamicAgentCreation` untuk secara otomatis membuat **instans agen terisolasi** bagi setiap pengguna DM. Setiap pengguna mendapatkan:

- Direktori ruang kerja independen
- `USER.md` / `SOUL.md` / `MEMORY.md` terpisah
- Riwayat percakapan privat
- Skill dan status terisolasi

Ini sangat penting untuk bot publik jika Anda ingin setiap pengguna memiliki pengalaman asisten AI privat mereka sendiri.

<Note>
Pengikatan dinamis menyertakan `accountId` Feishu yang dinormalisasi, sehingga akun default dan akun bernama merutekan setiap pengirim ke agen dinamis yang tepat.

Jika akun bernama membuat agen dinamis tanpa cakupan pada rilis lama, agen lama tersebut tetap diperhitungkan dalam `maxAgents`. Pastikan agen itu tidak digunakan oleh akun default sebelum menghapusnya, atau tingkatkan sementara `maxAgents`; OpenClaw tidak dapat menyimpulkan dengan aman akun mana yang memiliki status lama yang ambigu.
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
    // Penting: menjadikan DM setiap pengguna sebagai "sesi utama" mereka
    // Memuat USER.md / SOUL.md / MEMORY.md secara otomatis
    // Untuk isolasi yang lebih kuat, gunakan "per-channel-peer"
    dmScope: "main",
  },
}
```

### Cara kerjanya

Saat pengguna baru mengirim DM pertama mereka:

1. Saluran menghasilkan `agentId` unik: `feishu-{user_open_id}` untuk akun default, atau ringkasan identitas terbatas yang diawali akun untuk akun bernama
2. Membuat ruang kerja baru pada jalur `workspaceTemplate`
3. Mendaftarkan agen dan membuat pengikatan untuk pengguna ini
4. Pembantu ruang kerja memastikan berkas bootstrap (`AGENTS.md`, `SOUL.md`, `USER.md`, dan sebagainya) tersedia pada akses pertama
5. Merutekan semua pesan mendatang dari pengguna ini ke agen khusus mereka

### Opsi konfigurasi

| Pengaturan                                                  | Deskripsi                                | Default                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Aktifkan pembuatan agen otomatis per pengguna   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Templat jalur untuk ruang kerja agen dinamis | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Templat nama direktori agen              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Jumlah maksimum agen dinamis yang dapat dibuat | tanpa batas                            |

Variabel templat:

- `{agentId}` - ID agen yang dihasilkan (misalnya, `feishu-ou_xxxxxx` atau `feishu-support-<identity_digest>`)
- `{userId}` - open_id Feishu milik pengirim (misalnya, `ou_xxxxxx`)

### Cakupan sesi

`session.dmScope` mengontrol cara pesan langsung dipetakan ke sesi agen. Ini adalah **pengaturan global** yang memengaruhi semua saluran.

| Nilai                        | Perilaku                                                            | Paling sesuai untuk                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | DM setiap pengguna dipetakan ke sesi utama agennya                   | Bot pengguna tunggal jika Anda ingin `USER.md` / `SOUL.md` dimuat otomatis |
| `"per-peer"`                 | Setiap peer mendapatkan sesi terpisah (apa pun salurannya)           | Isolasi yang dikunci hanya berdasarkan identitas pengirim                            |
| `"per-channel-peer"`         | Setiap kombinasi (saluran + pengguna) mendapatkan sesi terpisah           | Bot publik multi-pengguna yang memerlukan isolasi lebih kuat                  |
| `"per-account-channel-peer"` | Setiap kombinasi (akun + saluran + pengguna) mendapatkan sesi terpisah | Bot multi-akun yang memerlukan isolasi sesi tingkat akun         |

**Kompromi**: Menggunakan `"main"` mengaktifkan pemuatan otomatis berkas bootstrap (`USER.md`, `SOUL.md`, `MEMORY.md`), tetapi berarti semua DM di semua saluran menggunakan pola kunci sesi yang sama. Untuk bot publik multi-pengguna yang lebih mengutamakan isolasi daripada pemuatan otomatis bootstrap, pertimbangkan `"per-channel-peer"` dan kelola berkas bootstrap secara manual.

<Note>
Gunakan `"per-account-channel-peer"` jika akun Feishu bernama harus mempertahankan sesi terpisah untuk pengirim yang sama. Pengikatan dinamis mempertahankan cakupan akun.
</Note>

### Penerapan multi-pengguna umum

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
    // Pilih dmScope berdasarkan kebutuhan isolasi Anda:
    // "main" untuk pemuatan otomatis bootstrap, "per-channel-peer" untuk isolasi yang lebih kuat
    dmScope: "main",
  },
  bindings: [], // Kosong - agen dinamis terikat otomatis
}
```

### Verifikasi

Periksa log Gateway untuk memastikan pembuatan dinamis berfungsi:

```text
feishu: membuat agen dinamis "feishu-ou_xxxxxx" untuk pengguna ou_xxxxxx
  ruang kerja: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  direktori agen: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

Cantumkan semua ruang kerja yang dibuat:

```bash
ls -la ~/.openclaw/workspace-*
```

### Catatan

- **Isolasi ruang kerja**: Setiap pengguna mendapatkan direktori ruang kerja dan instans agen masing-masing. Pengguna tidak dapat melihat riwayat percakapan atau berkas pengguna lain dalam alur perpesanan normal.
- **Batas keamanan**: Ini adalah mekanisme isolasi konteks perpesanan, bukan batas keamanan antarpenyewa yang bermusuhan. Proses agen dan lingkungan host digunakan bersama.
- **Penulisan konfigurasi harus tetap diaktifkan**: Pembuatan agen dinamis menulis agen dan pengikatan ke dalam konfigurasi; proses ini dilewati jika `channels.feishu.configWrites` bernilai `false` (default: diaktifkan).
- **`bindings` harus kosong**: Agen dinamis mendaftarkan pengikatannya sendiri secara otomatis
- **Jalur peningkatan**: Pengikatan manual yang sudah ada tetap berfungsi bersama agen dinamis
- **`session.dmScope` bersifat global**: Ini memengaruhi semua kanal, bukan hanya Feishu

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi Gateway](/id/gateway/configuration)

| Pengaturan                                               | Deskripsi                                                                            | Default                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | Aktifkan/nonaktifkan kanal                                                           | `true`                               |
| `channels.feishu.domain`                                 | Domain API (`feishu`, `lark`, atau URL dasar `https://`)                             | `feishu`                             |
| `channels.feishu.connectionMode`                         | Transpor peristiwa (`websocket` atau `webhook`)                                           | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Akun default untuk perutean keluar                                                   | `default`                            |
| `channels.feishu.verificationToken`                      | Wajib untuk mode Webhook                                                             | -                                    |
| `channels.feishu.encryptKey`                             | Wajib untuk mode Webhook                                                             | -                                    |
| `channels.feishu.webhookPath`                            | Jalur rute Webhook                                                                   | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Host pengikatan Webhook                                                              | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Port pengikatan Webhook                                                              | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | ID aplikasi                                                                          | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | Rahasia aplikasi                                                                     | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Penggantian domain per akun                                                          | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | Penggantian TTS per akun                                                             | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | Kebijakan DM (`pairing`, `allowlist`, `open`)                                           | `pairing`                            |
| `channels.feishu.allowFrom`                              | Daftar izin DM (daftar open_id)                                                      | -                                    |
| `channels.feishu.groupPolicy`                            | Kebijakan grup (`open`, `allowlist`, `disabled`)                                       | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Daftar izin grup                                                                     | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | Daftar izin pengirim yang diterapkan ke semua grup                                   | -                                    |
| `channels.feishu.requireMention`                         | Wajibkan @mention dalam grup                                                         | `true` (`false` ketika kebijakannya `open`)  |
| `channels.feishu.allowBots`                              | Terima bot lain yang menyebut bot ini, dengan perlindungan loop bot                  | `false`                              |
| `channels.feishu.groups.<chat_id>.requireMention`        | Penggantian @mention per grup; ID eksplisit juga mengizinkan grup dalam mode daftar izin | diwarisi                          |
| `channels.feishu.groups.<chat_id>.enabled`               | Aktifkan/nonaktifkan grup tertentu                                                   | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | Daftar izin pengirim per grup (menggantikan `groupSenderAllowFrom`)                  | -                                    |
| `channels.feishu.groupSessionScope`                      | Pemetaan sesi grup (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | Balasan bot membuat/melanjutkan utas topik (`disabled`, `enabled`)                  | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | Peristiwa reaksi masuk (`off`, `own`, `all`)                                        | `own`                                |
| `channels.feishu.vcAutoJoin`                             | Bergabung ke rapat VC setelah otorisasi DM normal                                    | `false`                              |
| `channels.feishu.dynamicAgentCreation.enabled`           | Aktifkan pembuatan agen per pengguna secara otomatis                                 | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Templat jalur untuk ruang kerja agen dinamis                                         | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Templat nama direktori agen                                                          | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Jumlah maksimum agen dinamis yang akan dibuat                                        | tidak terbatas                       |
| `channels.feishu.textChunkLimit`                         | Ukuran potongan pesan                                                                | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | Pemisahan potongan (`length` atau `newline`)                                              | `length`                             |
| `channels.feishu.mediaMaxMb`                             | Batas ukuran media                                                                   | `30`                                 |
| `channels.feishu.renderMode`                             | Perenderan balasan (`auto`, `raw`, `card`)                                              | `auto`                               |
| `channels.feishu.streaming.mode`                         | Keluaran kartu streaming (`partial` atau `off`)                                         | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | Streaming balasan blok yang telah selesai                                           | `false`                              |
| `channels.feishu.typingIndicator`                        | Kirim reaksi sedang mengetik                                                         | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Uraikan nama tampilan pengirim                                                       | `true`                               |
| `channels.feishu.configWrites`                           | Izinkan penulisan konfigurasi yang dimulai kanal (diperlukan agen dinamis)           | `true`                               |
| `channels.feishu.tools.doc`                              | Aktifkan alat dokumen                                                                | `true`                               |
| `channels.feishu.tools.chat`                             | Aktifkan alat informasi obrolan                                                      | `true`                               |
| `channels.feishu.tools.wiki`                             | Aktifkan alat basis pengetahuan (memerlukan `doc`)                                  | `true`                               |
| `channels.feishu.tools.drive`                            | Aktifkan alat penyimpanan cloud                                                      | `true`                               |
| `channels.feishu.tools.perm`                             | Aktifkan alat pengelolaan izin                                                       | `false`                              |
| `channels.feishu.tools.scopes`                           | Aktifkan alat diagnostik cakupan aplikasi                                            | `true`                               |
| `channels.feishu.tools.bitable`                          | Aktifkan alat Bitable/Base                                                           | `true`                               |
| `channels.feishu.tools.base`                             | Alias untuk `channels.feishu.tools.bitable`; `bitable` eksplisit diutamakan jika keduanya ditetapkan | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Gerbang alat Bitable/Base per akun                                                   | diwarisi                             |
| `channels.feishu.accounts.<id>.tools.base`               | Alias per akun untuk `tools.bitable`                                                  | diwarisi                             |

## Jenis pesan yang didukung

### Terima

- ✅ Teks
- ✅ Teks kaya (postingan)
- ✅ Gambar
- ✅ Berkas
- ✅ Audio
- ✅ Video/media
- ✅ Stiker

Pesan audio Feishu/Lark yang masuk dinormalisasi sebagai placeholder media, bukan
sebagai JSON `file_key` mentah. Ketika `tools.media.audio` dikonfigurasi, OpenClaw
mengunduh sumber catatan suara dan menjalankan transkripsi audio bersama sebelum
giliran agen, sehingga agen menerima transkrip ucapan. Jika Feishu menyertakan
teks transkrip secara langsung dalam payload audio, teks tersebut digunakan tanpa
panggilan ASR lain. Tanpa penyedia transkripsi audio, agen tetap menerima
placeholder `<media:audio>` beserta lampiran yang disimpan, bukan payload
sumber daya Feishu mentah.

### Kirim

- ✅ Teks
- ✅ Gambar
- ✅ Berkas
- ✅ Audio
- ✅ Video/media
- ✅ Kartu interaktif (termasuk pembaruan streaming)
- ⚠️ Teks kaya (pemformatan bergaya postingan; tidak mendukung kemampuan penulisan Feishu/Lark secara lengkap)

Bubble audio native Feishu/Lark menggunakan jenis pesan Feishu `audio` dan memerlukan
media unggahan Ogg/Opus (`file_type: "opus"`). Media `.opus` dan `.ogg` yang ada
dikirim langsung sebagai audio native. MP3/WAV/M4A dan format lain yang kemungkinan merupakan audio
ditranskode menjadi Ogg/Opus 48kHz dengan `ffmpeg` hanya ketika balasan meminta pengiriman
suara (`audioAsVoice` / alat pesan `asVoice`, termasuk balasan catatan suara TTS).
Lampiran MP3 biasa tetap menjadi file biasa. Jika `ffmpeg` tidak tersedia atau
konversi gagal, OpenClaw beralih ke lampiran file dan mencatat alasannya dalam log.

### Utas dan balasan

- ✅ Balasan sebaris
- ✅ Balasan utas
- ✅ Balasan media tetap mempertimbangkan utas saat membalas pesan utas

Perutean sesi grup topik dibahas dalam
[Cakupan sesi grup dan utas topik](#group-session-scope-and-topic-threads).

## Terkait

- [Ikhtisar Saluran](/id/channels) - semua saluran yang didukung
- [Pemasangan](/id/channels/pairing) - autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) - perilaku obrolan grup dan pembatasan berdasarkan sebutan
- [Perutean Saluran](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan penguatan
