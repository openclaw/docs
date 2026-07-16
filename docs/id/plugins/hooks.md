---
read_when:
    - Anda sedang membuat plugin yang memerlukan before_tool_call, before_agent_reply, hook pesan, atau hook siklus hidup
    - Anda perlu memblokir, menulis ulang, atau mewajibkan persetujuan untuk pemanggilan alat dari Plugin
    - Anda sedang memilih antara hook internal dan hook plugin
    - Anda memproyeksikan pemicuan Cron OpenClaw ke penjadwal host eksternal
summary: 'Hook Plugin: cegat peristiwa siklus hidup agen, alat, pesan, sesi, dan Gateway'
title: Hook Plugin
x-i18n:
    generated_at: "2026-07-16T18:26:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4e94220bca59b710b7b46c87bb889942c88b0d44f723e7133f271d34d9c929
    source_path: plugins/hooks.md
    workflow: 16
---

Titik kait Plugin adalah titik ekstensi dalam proses untuk plugin OpenClaw: memeriksa atau
mengubah proses agen, pemanggilan alat, alur pesan, siklus hidup sesi, perutean subagen,
instalasi, atau startup Gateway.

Sebagai gantinya, gunakan [titik kait internal](/id/automation/hooks) untuk skrip kecil `HOOK.md`
yang diinstal operator dan bereaksi terhadap peristiwa perintah serta Gateway seperti `/new`,
`/reset`, `/stop`, `agent:bootstrap`, atau `gateway:startup`.

## Mulai cepat

Daftarkan titik kait bertipe dengan `api.on(...)` dari entri plugin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Penangan yang dapat mengembalikan keputusan atau perubahan dijalankan secara berurutan dalam
urutan menurun `priority`; penangan dengan prioritas sama mempertahankan urutan pendaftaran.
Penangan yang hanya melakukan pengamatan dijalankan secara paralel, dan pengiriman pengamatan
tanpa menunggu hasil dapat bertumpang tindih dengan peristiwa berikutnya. Jangan gunakan prioritas untuk mengurutkan
efek samping pengamatan.

`api.on(name, handler, opts?)` menerima:

| Opsi      | Efek                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | Pengurutan; nilai lebih tinggi dijalankan lebih dahulu.                                                                                                                                                                      |
| `timeoutMs` | Batas waktu tunggu per titik kait. Ketika batas ini berakhir, OpenClaw berhenti menunggu penangan tersebut dan melanjutkan. Ini tidak membatalkan penangan atau efek sampingnya. Hilangkan untuk menggunakan batas waktu default per titik kait milik pelaksana. |

Operator dapat menetapkan batas waktu titik kait tanpa menambal kode plugin:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` menggantikan `hooks.timeoutMs`, yang menggantikan nilai
`api.on(..., { timeoutMs })` yang ditentukan oleh pembuat plugin. Setiap nilai harus berupa
bilangan bulat positif hingga 600000 ms. Utamakan penggantian per titik kait untuk titik kait
yang diketahui lambat agar satu plugin tidak memperoleh batas waktu lebih panjang di semua tempat.

Promise penangan yang kehabisan waktu terus berjalan karena callback titik kait tidak
menerima sinyal pembatalan. Pengiriman titik kait dapat melepaskan izin masuk Gateway
sementara pekerjaan plugin tersebut masih berlangsung. Plugin yang memiliki
pekerjaan berjalan lama harus menyediakan siklus hidup pembatalan dan penghentiannya sendiri.

Titik kait pengubah keluar `message_sending` dan `reply_payload_sending` menggunakan
default 15 detik per penangan. Jika salah satunya kehabisan waktu, OpenClaw mencatat kesalahan plugin
dan melanjutkan dengan payload terbaru agar jalur pengiriman berseri dapat
diselesaikan. Tetapkan batas waktu per titik kait yang lebih besar untuk plugin yang memang melakukan pekerjaan lebih lambat
sebelum pengiriman.

Plugin saluran yang menggunakan `createReplyDispatcher` juga dapat mendeklarasikan batas waktu positif
per tahap yang lebih besar dengan `beforeDeliverOptions: { timeoutMs }`, atau saat
menambahkan pekerjaan dengan `dispatcher.appendBeforeDeliver(handler, { timeoutMs })`.
Tanpa batas waktu yang dideklarasikan pemilik, callback tersebut menggunakan default 15 detik yang sama
agar callback yang macet tidak dapat menahan jalur pengiriman berseri.

Setiap titik kait menerima `event.context.pluginConfig`, yaitu konfigurasi yang telah diurai untuk
plugin yang mendaftarkan penangan tersebut. OpenClaw menyuntikkannya per penangan tanpa
mengubah objek peristiwa bersama yang dilihat plugin lain.

## Katalog titik kait

Titik kait dikelompokkan berdasarkan permukaan yang diperluasnya. Nama yang **dicetak tebal** menerima hasil keputusan
(blokir, batalkan, ganti, atau wajibkan persetujuan); sisanya
hanya melakukan pengamatan.

**Giliran agen**

| Titik kait                            | Tujuan                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | Mengganti penyedia atau model sebelum pesan sesi dimuat                                  |
| `agent_turn_prepare`            | Menggunakan injeksi giliran plugin yang diantrekan dan menambahkan konteks pada giliran yang sama sebelum titik kait prompt      |
| `before_prompt_build`           | Menambahkan konteks dinamis atau teks prompt sistem sebelum pemanggilan model                          |
| `before_agent_start`            | Fase gabungan khusus kompatibilitas; utamakan dua titik kait di atas                            |
| **`before_agent_run`**          | Memeriksa prompt akhir dan pesan sesi sebelum dikirimkan ke model; dapat memblokir proses |
| **`before_agent_reply`**        | Melewati giliran model dengan balasan sintetis atau tanpa respons                           |
| **`before_agent_finalize`**     | Memeriksa jawaban akhir alami dan meminta satu proses model tambahan                         |
| `agent_end`                     | Mengamati pesan akhir, status keberhasilan, dan durasi proses                                  |
| `heartbeat_prompt_contribution` | Menambahkan konteks khusus Heartbeat untuk plugin pemantau latar belakang dan siklus hidup                  |

**Pengamatan percakapan**

| Titik kait                                      | Tujuan                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | Metadata pemanggilan penyedia/model yang telah disanitasi: waktu, hasil, dan hash ID permintaan terbatas. Tanpa konten prompt atau respons. |
| `llm_input`                               | Masukan penyedia: prompt sistem, prompt, riwayat                                                                     |
| `llm_output`                              | Keluaran penyedia, penggunaan, dan `contextTokenBudget` yang telah diurai jika tersedia                                       |

**Alat**

| Titik kait                       | Tujuan                                                   |
| -------------------------- | --------------------------------------------------------- |
| **`before_tool_call`**     | Menulis ulang parameter alat, memblokir eksekusi, atau mewajibkan persetujuan |
| `after_tool_call`          | Mengamati hasil alat, kesalahan, dan durasi                |
| `resolve_exec_env`         | Menyumbangkan variabel lingkungan milik plugin ke `exec`   |
| **`tool_result_persist`**  | Menulis ulang pesan asisten yang dihasilkan dari hasil alat |
| **`before_message_write`** | Memeriksa atau memblokir penulisan pesan yang sedang berlangsung (jarang)      |

**Pesan dan pengiriman**

| Titik kait                            | Tujuan                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`**             | Mengambil alih pesan masuk sebelum perutean agen (balasan sintetis) |
| **`channel_pairing_requested`** | Mengamati permintaan pemasangan DM yang baru dibuat                         |
| `message_received`              | Mengamati konten masuk, pengirim, utas, dan metadata             |
| **`message_sending`**           | Menulis ulang konten keluar atau membatalkan pengiriman                       |
| **`reply_payload_sending`**     | Mengubah atau membatalkan payload balasan yang dinormalisasi sebelum pengiriman        |
| `message_sent`                  | Mengamati keberhasilan atau kegagalan pengiriman keluar                      |
| **`before_dispatch`**           | Memeriksa atau menulis ulang pengiriman keluar sebelum diserahkan ke saluran    |
| **`reply_dispatch`**            | Berpartisipasi dalam pipeline pengiriman balasan akhir                  |

**Sesi dan Compaction**

| Titik kait                                     | Tujuan                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | Melacak batas siklus hidup sesi. `reason` adalah salah satu dari `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart`, atau `unknown`. `shutdown`/`restart` dipicu dari finalisator penghentian Gateway ketika proses berhenti atau dimulai ulang dengan sesi aktif, sehingga plugin (memori, penyimpanan transkrip) dapat menyelesaikan baris hantu alih-alih membiarkannya tetap terbuka setelah dimulai ulang. Finalisator dibatasi agar plugin yang lambat tidak dapat memblokir SIGTERM/SIGINT. |
| `before_compaction` / `after_compaction` | Mengamati atau memberi anotasi pada siklus Compaction                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `before_reset`                           | Mengamati peristiwa pengaturan ulang sesi (`/reset`, pengaturan ulang terprogram)                                                                                                                                                                                                                                                                                                                                                                                                     |

**Subagen**

- `subagent_spawned` / `subagent_ended` - amati peluncuran dan penyelesaian subagen.
- `subagent_delivery_target` - hook kompatibilitas untuk pengiriman penyelesaian ketika tidak ada pengikatan sesi inti yang dapat memproyeksikan rute.
- `subagent_spawning` - hook kompatibilitas yang tidak digunakan lagi. Inti kini menyiapkan pengikatan subagen `thread: true` melalui adaptor pengikatan sesi kanal sebelum `subagent_spawned` dipicu.
- `subagent_spawned` menyertakan `resolvedModel` dan `resolvedProvider` ketika OpenClaw telah menentukan model asli sesi anak sebelum peluncuran.
- `subagent_ended` membawa `targetSessionKey` (identitas - cocok dengan `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` atau `"acp"`), `reason`, `outcome` opsional (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"`, atau `"deleted"`), `error` opsional, `runId`, `endedAt`, `accountId`, dan `sendFarewell`. Ini **tidak** menyertakan `agentId` atau `childSessionKey`; gunakan `targetSessionKey` untuk mengorelasikannya dengan peristiwa `subagent_spawned` yang sesuai.

**Siklus hidup**

| Hook                             | Tujuan                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Memulai atau menghentikan layanan milik plugin bersama Gateway                                                 |
| `deactivate`                     | Alias kompatibilitas yang tidak digunakan lagi untuk `gateway_stop`; gunakan `gateway_stop` dalam plugin baru                 |
| `cron_reconciled`                | Menyelaraskan dengan status Cron Gateway lengkap setelah dimulai atau dimuat ulang                            |
| `cron_changed`                   | Mengamati perubahan siklus hidup Cron milik Gateway (ditambahkan, diperbarui, dihapus, dimulai, selesai, dijadwalkan) |
| **`before_install`**             | Memeriksa materi instalasi Skills atau plugin yang telah disiapkan dari runtime plugin yang dimuat                         |

### Permintaan pemasangan kanal

Gunakan `channel_pairing_requested` ketika plugin perlu memberi tahu operator atau
menulis catatan audit setelah pengirim DM yang belum dipasangkan membuat permintaan
pemasangan tertunda. Hook dikirim saat permintaan dibuat; pengiriman balasan
pemasangan melalui kanal tidak ditunda oleh pengendali hook yang lambat atau gagal.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `Permintaan pemasangan ${event.channel} baru dari ${event.senderId}: ${event.code}`,
  });
});
```

Hook ini hanya untuk pengamatan. Hook tidak menyetujui, menolak, menekan, atau menulis ulang
balasan pemasangan. Payload menyertakan kanal, `accountId` opsional,
`senderId` dengan cakupan kanal, `code` pemasangan, dan metadata kanal. Perlakukan
kode pemasangan sebagai kredensial persetujuan sekali pakai yang aktif dan kirimkan hanya ke
tujuan operator tepercaya. Perlakukan `metadata` sebagai teks identitas yang tidak tepercaya
dan diberikan oleh pengirim. Hook tidak menyertakan isi atau media pesan masuk.

## Hook runtime debug

Gunakan `before_model_resolve` untuk mengganti penyedia atau model bagi giliran agen - hook ini
berjalan sebelum penentuan model. `llm_output` hanya berjalan setelah upaya model
menghasilkan keluaran asisten.

Untuk membuktikan model sesi efektif, periksa pendaftaran runtime, lalu
gunakan `openclaw sessions` atau permukaan sesi/status Gateway. Untuk men-debug
payload penyedia, mulai Gateway dengan `--raw-stream` dan
`--raw-stream-path <path>` untuk menulis peristiwa aliran model mentah ke file jsonl.

## Kebijakan pemanggilan alat

`before_tool_call` menerima:

- `event.toolName`
- `event.params`
- `event.toolKind` dan `event.toolInputKind` opsional, pembeda otoritatif dari host
  untuk alat yang sengaja memiliki nama yang sama; misalnya, pemanggilan `exec`
  mode kode luar menggunakan `toolKind: "code_mode_exec"` dan menyertakan
  `toolInputKind: "javascript" | "typescript"` ketika bahasa masukan
  diketahui
- `event.derivedPaths` opsional, petunjuk jalur target yang diturunkan host berdasarkan upaya terbaik
  untuk amplop alat yang dikenal seperti `apply_patch`; jalur ini mungkin
  tidak lengkap atau terlalu memperkirakan apa yang sebenarnya akan disentuh alat (misalnya,
  dengan masukan yang tidak valid atau parsial)
- `event.runId` opsional
- `event.toolCallId` opsional
- bidang konteks seperti `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.toolKind`, `ctx.toolInputKind`, dan `ctx.trace` diagnostik

Hook dapat mengembalikan:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    /** @deprecated Persetujuan yang tidak diselesaikan selalu ditolak. */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Perilaku pengaman untuk hook siklus hidup bertipe:

- `block: true` bersifat terminal dan melewati pengendali berprioritas lebih rendah.
- `block: false` diperlakukan sebagai tanpa keputusan.
- `params` menulis ulang parameter alat untuk eksekusi.
- `requireApproval` menjeda proses agen dan meminta pengguna melalui persetujuan
  plugin. `/approve` dapat menyetujui persetujuan exec maupun plugin. Dalam relai
  `PreToolUse` asli mode laporan app-server Codex, ini diteruskan ke
  permintaan persetujuan app-server yang sesuai; lihat
  [runtime harness Codex](/id/plugins/codex-harness-runtime#hook-boundaries).
- `block: true` berprioritas lebih rendah masih dapat memblokir setelah hook berprioritas lebih tinggi
  meminta persetujuan.
- `onResolution` menerima keputusan yang telah ditetapkan: `allow-once`, `allow-always`,
  `deny`, `timeout`, atau `cancelled`.

Lihat [Permintaan izin plugin](/id/plugins/plugin-permission-requests) untuk
perutean persetujuan, perilaku keputusan, dan kapan harus menggunakan `requireApproval`
alih-alih alat opsional atau persetujuan exec.

Plugin yang memerlukan kebijakan tingkat host dapat mendaftarkan kebijakan alat tepercaya dengan
`api.registerTrustedToolPolicy(...)`. Kebijakan ini berjalan sebelum hook
`before_tool_call` biasa dan sebelum keputusan hook normal. Kebijakan tepercaya
bawaan berjalan lebih dahulu; kebijakan tepercaya plugin yang diinstal berjalan berikutnya sesuai urutan
pemuatan plugin; hook `before_tool_call` biasa berjalan setelahnya. Plugin bawaan mempertahankan
jalur kebijakan tepercaya yang ada. Plugin yang diinstal harus diaktifkan secara eksplisit
dan mendeklarasikan setiap id kebijakan dalam `contracts.trustedToolPolicies`; id yang tidak dideklarasikan
ditolak sebelum pendaftaran. Id kebijakan dibatasi cakupannya pada plugin yang mendaftarkannya,
sehingga plugin yang berbeda dapat menggunakan kembali id lokal yang sama. Gunakan tingkat ini hanya
untuk gerbang tepercaya host seperti kebijakan ruang kerja, penegakan anggaran, atau
keamanan alur kerja yang dicadangkan.

### Hook lingkungan exec

`resolve_exec_env` memungkinkan plugin menyumbangkan variabel lingkungan ke pemanggilan alat
`exec` sebelum perintah dijalankan. Hook ini menerima:

- `event.sessionKey`
- `event.toolName`, saat ini selalu `"exec"`
- `event.host`, salah satu dari `"gateway"`, `"sandbox"`, atau `"node"`
- bidang konteks seperti `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider`, dan `ctx.channelId`

Kembalikan `Record<string, string>` untuk digabungkan ke lingkungan exec. Pengendali
berjalan berdasarkan urutan prioritas; hasil berikutnya menimpa hasil sebelumnya untuk kunci yang
sama.

Keluaran hook difilter melalui kebijakan kunci lingkungan exec host sebelum
digabungkan. `PATH` selalu dibuang (penentuan perintah dan pemeriksaan biner aman
bergantung padanya). Kunci yang tidak valid dan kunci penimpaan host berbahaya seperti `LD_*`,
`DYLD_*`, `NODE_OPTIONS`, variabel proksi (`HTTP_PROXY`, `HTTPS_PROXY`,
`ALL_PROXY`, `NO_PROXY`), serta variabel penimpaan TLS (`NODE_TLS_REJECT_UNAUTHORIZED`,
`SSL_CERT_FILE`, dan sejenisnya) dibuang. Lingkungan plugin yang telah difilter disertakan
dalam metadata persetujuan/audit Gateway dan diteruskan ke permintaan eksekusi
host node.

### Persistensi hasil alat

Hasil alat dapat menyertakan `details` terstruktur untuk perenderan UI, diagnostik,
perutean media, atau metadata milik plugin. Perlakukan `details` sebagai metadata runtime,
bukan konten prompt:

- OpenClaw menghapus `toolResult.details` sebelum pemutaran ulang penyedia dan masukan
  Compaction agar metadata tidak menjadi konteks model.
- Entri sesi yang dipersistenkan hanya menyimpan `details` yang dibatasi. Detail berukuran terlalu besar
  diganti dengan ringkasan ringkas dan `persistedDetailsTruncated: true`.
- `tool_result_persist` dan `before_message_write` berjalan sebelum
  batas persistensi akhir. Pertahankan `details` yang dikembalikan tetap kecil dan hindari menempatkan
  teks yang relevan dengan prompt hanya dalam `details`; letakkan keluaran alat yang terlihat oleh model dalam
  `content`.

## Hook prompt dan model

Gunakan hook khusus fase untuk plugin baru:

- `before_model_resolve`: hanya menerima prompt saat ini dan metadata
  lampiran. Kembalikan `providerOverride` atau `modelOverride`.
- `agent_turn_prepare`: menerima prompt saat ini, pesan sesi yang telah
  disiapkan, dan setiap injeksi antrean tepat-sekali yang dikuras untuk sesi ini.
  Kembalikan `prependContext` atau `appendContext`.
- `before_prompt_build`: menerima prompt saat ini dan pesan sesi.
  Kembalikan `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, atau `appendSystemContext`.
- `heartbeat_prompt_contribution`: hanya berjalan untuk giliran Heartbeat dan mengembalikan
  `prependContext` atau `appendContext`. Ditujukan bagi pemantau latar belakang yang
  perlu merangkum status saat ini tanpa mengubah giliran yang dimulai pengguna.

`before_agent_start` tetap tersedia untuk kompatibilitas. Utamakan hook eksplisit
di atas agar plugin tidak bergantung pada fase gabungan lama.

`before_agent_run` berjalan setelah pembuatan prompt dan sebelum masukan model apa pun,
termasuk pemuatan gambar lokal prompt dan pengamatan `llm_input`. Hook ini menerima
masukan pengguna saat ini sebagai `prompt`, beserta riwayat sesi yang dimuat dalam `messages`
dan prompt sistem aktif. Kembalikan `{ outcome: "block", reason, message? }`
untuk menghentikan proses sebelum model membaca prompt. `reason` bersifat internal;
`message` adalah pengganti yang terlihat oleh pengguna. Hanya hasil `pass` dan `block`
yang didukung; bentuk keputusan yang tidak didukung akan gagal secara tertutup.

Ketika proses diblokir, OpenClaw hanya menyimpan teks pengganti dalam
`message.content` beserta metadata blok yang tidak sensitif seperti id plugin
pemblokir dan stempel waktu. Teks asli pengguna tidak disimpan dalam transkrip
atau konteks mendatang. Alasan blok internal diperlakukan sebagai sensitif dan
dikecualikan dari payload transkrip, riwayat, siaran, log, dan diagnostik.
Observabilitas harus menggunakan bidang yang telah disanitasi seperti id pemblokir, hasil,
stempel waktu, atau kategori aman.

`before_agent_start` dan `agent_end` menyertakan `event.runId` ketika OpenClaw dapat
mengidentifikasi proses aktif; nilai yang sama juga terdapat pada `ctx.runId`. Proses yang digerakkan
Cron juga mengekspos `ctx.jobId` (id tugas Cron asal) pada konteks giliran agen
agar hook dapat membatasi metrik, efek samping, atau status ke tugas
terjadwal tertentu. `ctx.jobId` bukan bagian dari konteks alat `before_tool_call`.

Untuk proses yang berasal dari channel, `ctx.channel` dan `ctx.messageProvider` mengidentifikasi
permukaan penyedia seperti `discord` atau `telegram`, sedangkan `ctx.channelId` adalah
pengidentifikasi target percakapan ketika OpenClaw dapat memperolehnya dari
kunci sesi atau metadata pengiriman.

Ketika identitas pengirim tersedia, konteks hook agen juga mencakup:

- `ctx.senderId` - ID pengirim dalam cakupan channel (misalnya `open_id` Feishu, ID
  pengguna Discord). Diisi ketika proses berasal dari pesan pengguna dengan
  metadata pengirim yang diketahui.
- `ctx.chatId` - pengidentifikasi percakapan bawaan transportasi (misalnya
  `chat_id` Feishu, `chat_id` Telegram). Diisi ketika channel asal
  menyediakan ID percakapan bawaan.
- `ctx.channelContext.sender.id` - ID pengirim yang sama dengan `ctx.senderId`, di bawah
  objek milik channel yang dapat diperluas plugin dengan bidang khusus channel.
- `ctx.channelContext.chat.id` - ID percakapan yang sama dengan `ctx.chatId`,
  di bawah objek milik channel yang dapat diperluas plugin dengan bidang
  khusus channel.

Core hanya mendefinisikan bidang `id` bertingkat. Plugin channel yang meneruskan
metadata pengirim atau obrolan yang lebih lengkap melalui pembantu masuk dapat memperluas
`PluginHookChannelSenderContext` atau `PluginHookChannelChatContext` dari
`openclaw/plugin-sdk/channel-inbound`:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Plugin channel meneruskan bidang tersebut melalui pembantu SDK masuk:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Bidang-bidang ini opsional dan tidak ada untuk proses yang berasal dari sistem (heartbeat,
cron, exec-event).

`ctx.senderExternalId` tetap tersedia sebagai bidang kompatibilitas sumber yang tidak digunakan lagi untuk
plugin lama. Core tidak mengisinya; identitas pengirim khusus channel yang baru
harus berada di bawah `ctx.channelContext.sender` melalui perluasan
modul.

`agent_end` adalah hook observasi. Jalur Gateway dan harness persisten menjalankannya
secara fire-and-forget setelah giliran selesai, sedangkan jalur CLI sekali jalan yang berumur pendek menunggu
promise hook sebelum pembersihan proses agar plugin tepercaya dapat menyelesaikan
observabilitas terminal atau merekam status. Pelaksana hook menerapkan batas waktu 30 detik
agar plugin atau endpoint penyematan yang macet tidak membiarkan promise hook
tertunda selamanya. Batas waktu dicatat dan OpenClaw berlanjut; hal tersebut tidak
membatalkan pekerjaan jaringan milik plugin kecuali plugin juga menggunakan sinyal
pembatalannya sendiri.

Gunakan `model_call_started` dan `model_call_ended` untuk telemetri panggilan penyedia
yang tidak boleh menerima prompt mentah, riwayat, respons, header, isi
permintaan, atau ID permintaan penyedia. Hook ini mencakup metadata stabil seperti
`runId`, `callId`, `provider`, `model`, `api`/`transport` opsional, `durationMs`/`outcome` terminal, dan `upstreamRequestIdHash` ketika OpenClaw dapat memperoleh
hash ID permintaan penyedia yang dibatasi. Ketika runtime telah menentukan
metadata jendela konteks, peristiwa dan konteks hook juga mencakup
`contextTokenBudget`, anggaran token efektif setelah batas model/konfigurasi/agen,
serta `contextWindowSource` dan `contextWindowReferenceTokens` ketika
batas yang lebih rendah diterapkan.

`before_agent_finalize` hanya berjalan ketika harness akan menerima jawaban akhir
asisten yang alami. Ini bukan jalur pembatalan `/stop` dan tidak
berjalan ketika pengguna membatalkan giliran. Kembalikan `{ action: "revise", reason }` untuk meminta
harness melakukan satu lintasan model lagi sebelum finalisasi, `{ action:
"finalize", reason? }` untuk memaksa finalisasi, atau hilangkan hasil untuk melanjutkan.
Handler memiliki anggaran default 15 detik; saat batas waktu tercapai, OpenClaw mencatat kegagalan dan
melanjutkan dengan jawaban akhir asli.
Hook bawaan Codex `Stop` diteruskan ke hook ini sebagai keputusan
`before_agent_finalize` OpenClaw.

Ketika mengembalikan `action: "revise"`, plugin dapat menyertakan metadata `retry` agar
lintasan model tambahan dibatasi dan aman untuk diputar ulang:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` ditambahkan ke alasan revisi yang dikirim ke harness.
`idempotencyKey` memungkinkan host menghitung percobaan ulang untuk permintaan plugin yang sama
di seluruh keputusan finalisasi yang setara, dan `maxAttempts` membatasi jumlah lintasan
tambahan yang diizinkan host sebelum melanjutkan dengan jawaban akhir alami.

Plugin yang tidak dibundel dan memerlukan hook percakapan mentah (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end`, atau `before_agent_run`) harus menetapkan:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Hook yang mengubah prompt dan injeksi giliran berikutnya yang persisten dapat dinonaktifkan per
plugin dengan `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Ekstensi sesi dan injeksi giliran berikutnya

Plugin alur kerja dapat menyimpan status sesi kecil yang kompatibel dengan JSON menggunakan
`api.session.state.registerSessionExtension(...)` dan memperbaruinya melalui metode Gateway
`sessions.pluginPatch`. Baris sesi memproyeksikan status ekstensi yang terdaftar
melalui `pluginExtensions`, sehingga Control UI dan klien lain dapat
merender status milik plugin tanpa mengetahui detail internal plugin.
`api.registerSessionExtension(...)` masih berfungsi tetapi tidak digunakan lagi dan digantikan oleh
namespace `api.session.state`.

Gunakan `api.session.workflow.enqueueNextTurnInjection(...)` ketika plugin memerlukan
konteks persisten untuk mencapai giliran model berikutnya tepat satu kali (`api.enqueueNextTurnInjection(...)` tingkat atas adalah alias yang tidak digunakan lagi dengan perilaku
yang sama). OpenClaw menguras injeksi yang mengantre sebelum hook prompt, membuang
injeksi yang kedaluwarsa, dan menghapus duplikasi berdasarkan `idempotencyKey` per plugin. Ini adalah
titik integrasi yang tepat untuk melanjutkan persetujuan, ringkasan kebijakan, delta pemantau
latar belakang, dan kelanjutan perintah yang harus terlihat oleh model pada
giliran berikutnya tetapi tidak boleh menjadi teks prompt sistem permanen.

Semantik pembersihan merupakan bagian dari kontrak. Callback pembersihan ekstensi sesi dan
siklus hidup runtime menerima `reset`, `delete`, `disable`, atau
`restart`. Host menghapus status ekstensi sesi persisten
milik plugin dan injeksi giliran berikutnya yang tertunda untuk pengaturan ulang/penghapusan/penonaktifan; mulai ulang
mempertahankan status sesi persisten sementara callback pembersihan memungkinkan plugin melepaskan
pekerjaan penjadwal, konteks proses, dan sumber daya di luar jalur lainnya untuk generasi
runtime lama.

## Hook pesan

Gunakan hook pesan untuk perutean dan kebijakan pengiriman tingkat channel:

- `message_received`: mengamati konten masuk, pengirim, `threadId`,
  `messageId`, `senderId`, korelasi proses/sesi opsional, dan metadata.
- `message_sending`: menulis ulang `content` atau mengembalikan `{ cancel: true }`.
- `reply_payload_sending`: menulis ulang objek `ReplyPayload` yang dinormalisasi
  (termasuk `presentation`, `delivery`, referensi media, dan teks) atau mengembalikan
  `{ cancel: true }`.
- `message_sent`: mengamati keberhasilan atau kegagalan akhir.

Untuk balasan TTS khusus audio, `content` dapat memuat transkrip lisan
tersembunyi meskipun payload channel tidak memiliki teks/keterangan yang terlihat.
Menulis ulang `content` tersebut hanya memperbarui transkrip yang terlihat oleh hook; transkrip itu tidak
dirender sebagai keterangan media.

Peristiwa `reply_payload_sending` dapat mencakup `usageState`, snapshot model/penggunaan/konteks
langsung per giliran yang bersifat upaya terbaik. Pengiriman persisten, pemutaran ulang yang dipulihkan, dan
balasan tanpa korelasi proses yang tepat tidak menyertakannya.

Konteks hook pesan mengekspos bidang korelasi stabil jika tersedia:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, dan `ctx.callDepth`. Konteks masuk
dan `before_dispatch` juga mengekspos metadata balasan ketika channel
memiliki data pesan kutipan yang telah difilter berdasarkan visibilitas: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender`, dan `replyToIsQuote`. Utamakan
bidang kelas utama ini sebelum membaca metadata lama.

Utamakan bidang bertipe `threadId` dan `replyToId` sebelum menggunakan metadata
khusus channel.

Aturan keputusan:

- `message_sending` dengan `cancel: true` bersifat terminal.
- `message_sending` dengan `cancel: false` diperlakukan sebagai tanpa keputusan.
- `content` yang ditulis ulang dilanjutkan ke hook berprioritas lebih rendah kecuali hook berikutnya
  membatalkan pengiriman.
- `reply_payload_sending` berjalan setelah normalisasi payload dan sebelum pengiriman
  channel, termasuk balasan yang dirutekan kembali ke channel asal.
  Handler berjalan secara berurutan dan setiap handler melihat payload terbaru yang dihasilkan
  oleh handler berprioritas lebih tinggi.
- Payload `reply_payload_sending` tidak mengekspos penanda kepercayaan runtime seperti
  `trustedLocalMedia`; plugin dapat mengedit bentuk payload tetapi tidak dapat memberikan kepercayaan
  media lokal.
- `message_sending` dapat mengembalikan `cancelReason` dan `metadata` terbatas beserta
  pembatalan. API siklus hidup pesan baru mengeksposnya sebagai hasil
  pengiriman yang ditekan dengan alasan `cancelled_by_message_sending_hook`; pengiriman
  langsung lama tetap mengembalikan larik hasil kosong demi kompatibilitas.
- `message_sent` hanya untuk observasi. Kegagalan handler dicatat dan tidak
  mengubah hasil pengiriman.

## Hook instalasi

Gunakan `security.installPolicy` untuk keputusan izinkan/blokir milik operator. Kebijakan
tersebut berjalan dari konfigurasi OpenClaw, mencakup jalur instalasi dan pembaruan CLI, serta
gagal secara tertutup ketika diaktifkan tetapi tidak tersedia.

`before_install` adalah hook siklus hidup runtime plugin. Hook ini berjalan setelah
`security.installPolicy` hanya dalam proses OpenClaw tempat hook plugin telah
dimuat, seperti alur instalasi yang didukung Gateway. Hook ini berguna untuk
observasi, peringatan, dan pemeriksaan kompatibilitas milik plugin, tetapi bukan
batas keamanan utama perusahaan atau host untuk instalasi. Bidang
`builtinScan` tetap ada dalam payload peristiwa demi kompatibilitas, tetapi
OpenClaw tidak lagi menjalankan pemblokiran kode berbahaya bawaan saat instalasi, sehingga
bidang tersebut merupakan hasil `ok` kosong. Kembalikan temuan tambahan atau
`{ block: true, blockReason }` untuk menghentikan instalasi dalam proses tersebut.

`block: true` bersifat terminal. `block: false` diperlakukan sebagai tanpa keputusan. Kegagalan
handler memblokir instalasi secara tertutup.

## Siklus hidup Gateway

Gunakan `gateway_start` untuk memulai layanan plugin umum dan `gateway_stop` untuk
membersihkan sumber daya yang berjalan lama. Penjadwal cron mungkin masih sedang dimuat ketika
`gateway_start` berjalan, jadi jangan gunakan hook tersebut sebagai sinyal dasar untuk proyeksi
cron eksternal.

Jangan mengandalkan hook internal `gateway:startup` untuk layanan runtime
milik plugin.

`cron_reconciled` dipicu setelah penjadwal cron Gateway dan pemantau saat keluarnya
telah merekonsiliasi status persistennya. Hook ini dipicu baik untuk
startup awal maupun penggantian penjadwal selama pemuatan ulang konfigurasi. Peristiwa melaporkan
`reason` (`startup` atau `reload`) dan status efektif `enabled`. Cron yang dinonaktifkan
tetap memancarkan peristiwa dengan `enabled: false`, sehingga proyeksi eksternal dapat
menghapus pemicu bangun yang usang. Gunakan `ctx.getCron?.()` untuk instans penjadwal yang tepat yang
menyelesaikan rekonsiliasi; pemuatan ulang berikutnya tidak mengalihkan target callback tersebut.
`ctx.abortSignal` memiliki snapshot penjadwal yang sama. Gateway membatalkannya segera
setelah penjadwal yang lebih baru diaktifkan atau penghentian dimulai. Teruskan sinyal tersebut melalui setiap
efek samping persisten dan jangan menerima snapshot setelah sinyal itu dibatalkan.
Ini adalah sinyal siklus hidup penjadwal, bukan sinyal aktivasi plugin:
pemuatan ulang langsung khusus plugin tidak memicunya kembali. Konsumen yang baru diaktifkan menerima
dasar pertamanya pada penggantian penjadwal atau startup Gateway berikutnya.

Seperti hook observasi lainnya, callback `gateway_start` dan `cron_reconciled`
dapat tumpang tindih. Jika kedua handler berbagi inisialisasi plugin, koordinasikan keduanya
dengan promise kesiapan lokal plugin, bukan dengan bergantung pada urutan callback.

`cron_changed` dipicu untuk peristiwa siklus hidup Cron yang dimiliki Gateway dengan payload
peristiwa bertipe yang mencakup alasan `added`, `updated`, `removed`, `started`, `finished`,
dan `scheduled`. Peristiwa tersebut membawa snapshot `PluginHookGatewayCronJob`
(termasuk `state.nextRunAtMs`, `state.lastRunStatus`, dan
`state.lastError` jika ada) beserta `PluginHookGatewayCronDeliveryStatus`
berupa `not-requested` | `delivered` | `not-delivered` | `unknown`. Peristiwa penghapusan
terjadi setelah commit: peristiwa tersebut hanya dipicu setelah penghapusan persisten berhasil dan tetap membawa
snapshot tugas yang dihapus agar penjadwal eksternal dapat merekonsiliasi status.

Peristiwa `scheduled` terjadi setelah commit: peristiwa tersebut hanya dipicu setelah penulisan persisten yang berhasil
mengubah `nextRunAtMs` efektif milik tugas yang sudah ada, di luar peristiwa siklus hidup
`added`, `updated`, atau `removed` eksplisit milik tugas tersebut. `event.nextRunAtMs`
tingkat teratas adalah waktu bangun berikutnya yang telah di-commit; jika tidak ada, tugas tersebut
tidak memiliki waktu bangun berikutnya. Perlakukan peristiwa ini sebagai petunjuk rekonsiliasi, bukan log delta
berurutan. Gunakan peristiwa tersebut sebagai petunjuk yang dapat digabungkan untuk membaca ulang penjadwal yang terakhir ditangkap oleh
`cron_reconciled`; jangan mengadopsi penjadwal dari konteks `cron_changed`.
Pertahankan OpenClaw sebagai sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

### Proyeksi Cron eksternal yang aman

Proyeksikan snapshot waktu bangun lengkap alih-alih meneruskan delta peristiwa Cron. Operasi
`replaceAll` milik adaptor eksternal harus atomik dan idempoten, serta
hanya boleh selesai setelah host menerima snapshot secara persisten. Operasi tersebut juga harus
mematuhi sinyal pembatalan yang diberikan: jika sinyal dibatalkan sebelum penerimaan
persisten, adaptor tidak boleh menerima snapshot tersebut.

Pola ini mempertahankan satu pekerja status terbaru yang sedang berjalan. Hanya `cron_reconciled`
yang mengadopsi instans penjadwal; `cron_changed` hanya meminta pekerja tersebut membaca ulang
instans otoritatif, sehingga petunjuk yang terlambat tidak dapat memulihkan penjadwal yang lebih lama.
Revisi yang lebih baru membatalkan upaya host yang aktif sebelum upaya tersebut dapat menerima snapshot
usang.

```typescript
import { setTimeout as sleep } from "node:timers/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type ExternalWake = { jobId: string; runAtMs: number };

type ExternalWakeHost = {
  replaceAll(wakes: readonly ExternalWake[], options: { signal: AbortSignal }): Promise<void>;
  close(): Promise<void>;
};

type CronReader = {
  list(options: { includeDisabled: true }): Promise<
    Array<{
      id: string;
      enabled?: boolean;
      state?: { nextRunAtMs?: number };
    }>
  >;
};

export function registerCronProjection(api: OpenClawPluginApi, host: ExternalWakeHost) {
  const lifecycle = new AbortController();
  let cron: CronReader | undefined;
  let enabled = false;
  let hasBaseline = false;
  let reconciliationSignal: AbortSignal | undefined;
  let requestedRevision = 0;
  let appliedRevision = 0;
  let worker = Promise.resolve();
  let activeAttempt: AbortController | undefined;

  const projectLatest = async () => {
    let retryMs = 1_000;

    while (!lifecycle.signal.aborted && appliedRevision < requestedRevision) {
      const ownerSignal = reconciliationSignal;
      if (!ownerSignal || ownerSignal.aborted) {
        return;
      }
      const targetRevision = requestedRevision;
      const attempt = new AbortController();
      const signal = AbortSignal.any([lifecycle.signal, ownerSignal, attempt.signal]);
      activeAttempt = attempt;

      try {
        const jobs = enabled && cron ? await cron.list({ includeDisabled: true }) : [];
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        const wakes = jobs
          .flatMap((job): ExternalWake[] => {
            const runAtMs = job.enabled === false ? undefined : job.state?.nextRunAtMs;
            return runAtMs === undefined ? [] : [{ jobId: job.id, runAtMs }];
          })
          .sort((a, b) => a.runAtMs - b.runAtMs || a.jobId.localeCompare(b.jobId));

        await host.replaceAll(wakes, { signal });
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        appliedRevision = targetRevision;
        retryMs = 1_000;
      } catch {
        if (lifecycle.signal.aborted || ownerSignal.aborted) {
          return;
        }
        if (attempt.signal.aborted) {
          continue;
        }
        api.logger.warn(`proyeksi Cron eksternal gagal; mencoba lagi dalam ${retryMs}md`);
        try {
          await sleep(retryMs, undefined, { signal });
        } catch {
          if (lifecycle.signal.aborted) {
            return;
          }
          if (attempt.signal.aborted) {
            continue;
          }
        }
        retryMs = Math.min(retryMs * 2, 30_000);
      } finally {
        if (activeAttempt === attempt) {
          activeAttempt = undefined;
        }
      }
    }
  };

  const requestProjection = () => {
    const targetRevision = ++requestedRevision;
    activeAttempt?.abort();
    worker = worker.then(async () => {
      if (!lifecycle.signal.aborted && appliedRevision < targetRevision) {
        await projectLatest();
      }
    });
    return worker;
  };

  api.on("cron_reconciled", (event, ctx) => {
    const reconciledCron = ctx.getCron?.();
    if (event.enabled && !reconciledCron) {
      api.logger.warn("rekonsiliasi Cron tidak mengekspos penjadwal");
      return;
    }
    cron = reconciledCron;
    enabled = event.enabled;
    hasBaseline = true;
    reconciliationSignal = ctx.abortSignal;
    return requestProjection();
  });

  api.on("cron_changed", () => {
    if (hasBaseline) {
      return requestProjection();
    }
  });

  api.on("gateway_stop", async () => {
    lifecycle.abort();
    await worker;
    await host.close();
  });
}
```

Ketika `cron_reconciled` melaporkan `enabled: false`, jalur yang sama memanggil
`replaceAll([])` dan menghapus waktu bangun eksternal yang usang. Percobaan ulang/backoff dalam contoh ini
bersifat lokal bagi proses dan memperlakukan kegagalan adaptor runtime sebagai sementara; validasi
konfigurasi yang tidak dapat dicoba ulang sebelum pendaftaran. OpenClaw tidak menyediakan
outbox untuk efek hook Plugin. Jika proses berhenti sebelum penerimaan persisten,
awal Gateway berikutnya memancarkan snapshot `cron_reconciled` otoritatif yang baru.
`gateway_stop` membatalkan pekerjaan host yang sedang berlangsung, menunggu pekerja selesai, lalu
menutup adaptor.

## Penghentian dukungan mendatang

Beberapa permukaan yang berdekatan dengan hook telah dihentikan dukungannya tetapi masih didukung. Lakukan migrasi
sebelum rilis mayor berikutnya:

- **Envelope saluran teks biasa** dalam handler `inbound_claim` dan `message_received`.
  Baca `BodyForAgent` dan blok konteks pengguna terstruktur
  alih-alih mengurai teks envelope datar. Lihat
  [Envelope saluran teks biasa → BodyForAgent](/id/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** tetap tersedia untuk kompatibilitas. Plugin baru sebaiknya menggunakan
  `before_model_resolve` dan `before_prompt_build` alih-alih fase
  gabungan tersebut.
- **`subagent_spawning`** tetap tersedia untuk kompatibilitas dengan Plugin lama, tetapi
  Plugin baru sebaiknya tidak mengembalikan perutean utas darinya. Core menyiapkan
  pengikatan subagen `thread: true` melalui adaptor pengikatan sesi saluran
  sebelum `subagent_spawned` dipicu.
- **`deactivate`** tetap tersedia sebagai alias kompatibilitas pembersihan yang telah dihentikan dukungannya hingga
  setelah 2026-08-16. Plugin baru sebaiknya menggunakan `gateway_stop`.
- **`onResolution` dalam `before_tool_call`** kini menggunakan union bertipe
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) alih-alih `string` berbentuk bebas.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** tetap tersedia
  sebagai alias kompatibilitas tingkat teratas. Plugin baru sebaiknya menggunakan
  `api.session.state.registerSessionExtension(...)` dan
  `api.session.workflow.enqueueNextTurnInjection(...)`.

Untuk daftar lengkap—pendaftaran kapabilitas memori, profil penalaran
penyedia, penyedia autentikasi eksternal, tipe penemuan penyedia, pengakses runtime
tugas, dan penggantian nama `command-auth` → `command-status`—lihat
[Migrasi SDK Plugin → Penghentian dukungan aktif](/id/plugins/sdk-migration#active-deprecations).

## Terkait

- [Migrasi SDK Plugin](/id/plugins/sdk-migration) - penghentian dukungan aktif dan linimasa penghapusan
- [Membangun Plugin](/id/plugins/building-plugins)
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Titik masuk Plugin](/id/plugins/sdk-entrypoints)
- [Hook internal](/id/automation/hooks)
- [Internal arsitektur Plugin](/id/plugins/architecture-internals)
