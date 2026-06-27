---
read_when:
    - Anda sedang membangun plugin yang memerlukan before_tool_call, before_agent_reply, hook pesan, atau hook siklus hidup
    - Anda perlu memblokir, menulis ulang, atau mewajibkan persetujuan untuk panggilan alat dari sebuah Plugin
    - Anda sedang memilih antara hook internal dan hook Plugin
summary: 'Hook Plugin: mencegat peristiwa siklus hidup agen, alat, pesan, sesi, dan Gateway'
title: Hook Plugin
x-i18n:
    generated_at: "2026-06-27T17:47:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

Hook Plugin adalah titik ekstensi dalam proses untuk Plugin OpenClaw. Gunakan
ketika sebuah Plugin perlu memeriksa atau mengubah run agen, panggilan alat, alur pesan,
siklus hidup sesi, perutean subagen, instalasi, atau startup Gateway.

Gunakan [hook internal](/id/automation/hooks) sebagai gantinya ketika Anda menginginkan skrip
`HOOK.md` kecil yang dipasang operator untuk peristiwa perintah dan Gateway seperti
`/new`, `/reset`, `/stop`, `agent:bootstrap`, atau `gateway:startup`.

## Mulai cepat

Daftarkan hook Plugin bertipe dengan `api.on(...)` dari entri Plugin Anda:

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
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Handler hook berjalan berurutan dalam `priority` menurun. Hook dengan prioritas yang sama
mempertahankan urutan pendaftaran.

`api.on(name, handler, opts?)` menerima:

- `priority` - pengurutan handler (nilai lebih tinggi berjalan lebih dulu).
- `timeoutMs` - anggaran opsional per hook. Jika diatur, runner hook membatalkan
  handler tersebut setelah anggaran berlalu dan melanjutkan ke handler berikutnya, alih-alih
  membiarkan setup yang lambat atau pekerjaan recall menghabiskan timeout model yang
  dikonfigurasi pemanggil. Hilangkan untuk menggunakan timeout observasi/keputusan default yang
  diterapkan runner hook secara umum.

Operator juga dapat mengatur anggaran hook tanpa mem-patch kode Plugin:

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

`hooks.timeouts.<hookName>` menimpa `hooks.timeoutMs`, yang menimpa nilai
`api.on(..., { timeoutMs })` yang ditulis Plugin. Setiap nilai yang dikonfigurasi harus
berupa bilangan bulat positif tidak lebih dari 600000 milidetik. Utamakan override per hook
untuk hook yang diketahui lambat agar satu Plugin tidak mendapat anggaran yang lebih panjang
di semua tempat.

Setiap hook menerima `event.context.pluginConfig`, yaitu konfigurasi yang diselesaikan untuk
Plugin yang mendaftarkan handler tersebut. Gunakan untuk keputusan hook yang membutuhkan
opsi Plugin saat ini; OpenClaw menyuntikkannya per handler tanpa memutasi objek peristiwa
bersama yang dilihat Plugin lain.

## Katalog hook

Hook dikelompokkan berdasarkan permukaan yang diperluasnya. Nama dalam **tebal** menerima
hasil keputusan (blokir, batalkan, override, atau wajibkan persetujuan); semua lainnya hanya
untuk observasi.

**Giliran agen**

- `before_model_resolve` - override penyedia atau model sebelum pesan sesi dimuat
- `agent_turn_prepare` - konsumsi injeksi giliran Plugin yang mengantre dan tambahkan konteks giliran yang sama sebelum hook prompt
- `before_prompt_build` - tambahkan konteks dinamis atau teks prompt sistem sebelum panggilan model
- `before_agent_start` - fase gabungan khusus kompatibilitas; utamakan dua hook di atas
- **`before_agent_run`** - periksa prompt final dan pesan sesi sebelum pengiriman model dan secara opsional blokir run
- **`before_agent_reply`** - pintas giliran model dengan balasan sintetis atau diam
- **`before_agent_finalize`** - periksa jawaban final alami dan minta satu pass model lagi
- `agent_end` - observasi pesan final, status sukses, dan durasi run
- `heartbeat_prompt_contribution` - tambahkan konteks khusus Heartbeat untuk Plugin pemantau latar belakang dan siklus hidup

**Observasi percakapan**

- `model_call_started` / `model_call_ended` - observasi metadata panggilan penyedia/model yang disanitasi, waktu, hasil, dan hash id permintaan yang dibatasi tanpa konten prompt atau respons
- `llm_input` - observasi input penyedia (prompt sistem, prompt, riwayat)
- `llm_output` - observasi output penyedia, penggunaan, dan `contextTokenBudget` yang diselesaikan jika tersedia

**Alat**

- **`before_tool_call`** - tulis ulang parameter alat, blokir eksekusi, atau wajibkan persetujuan
- `after_tool_call` - observasi hasil alat, error, dan durasi
- `resolve_exec_env` - kontribusikan variabel lingkungan milik Plugin ke `exec`
- **`tool_result_persist`** - tulis ulang pesan asisten yang dihasilkan dari hasil alat
- **`before_message_write`** - periksa atau blokir penulisan pesan yang sedang berlangsung (jarang)

**Pesan dan pengiriman**

- **`inbound_claim`** - klaim pesan masuk sebelum perutean agen (balasan sintetis)
- `message_received` — observasi konten masuk, pengirim, thread, dan metadata
- **`message_sending`** — tulis ulang konten keluar atau batalkan pengiriman
- **`reply_payload_sending`** — mutasi atau batalkan payload balasan yang dinormalisasi sebelum pengiriman
- `message_sent` — observasi keberhasilan atau kegagalan pengiriman keluar
- **`before_dispatch`** - periksa atau tulis ulang dispatch keluar sebelum handoff kanal
- **`reply_dispatch`** - ikut serta dalam pipeline dispatch balasan final

**Sesi dan Compaction**

- `session_start` / `session_end` - lacak batas siklus hidup sesi. `reason` peristiwa adalah salah satu dari `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart`, atau `unknown`. Nilai `shutdown` dan `restart` dipicu dari finalizer shutdown Gateway ketika proses dihentikan atau dimulai ulang saat sesi masih aktif, sehingga Plugin hilir (seperti penyimpanan memori atau transkrip) dapat memfinalisasi baris ghost yang jika tidak akan tertinggal dalam keadaan terbuka lintas restart. Finalizer dibatasi sehingga Plugin yang lambat tidak dapat memblokir SIGTERM/SIGINT.
- `before_compaction` / `after_compaction` - observasi atau anotasi siklus Compaction
- `before_reset` - observasi peristiwa reset sesi (`/reset`, reset terprogram)

**Subagen**

- `subagent_spawned` / `subagent_ended` - observasi peluncuran dan penyelesaian subagen.
- `subagent_delivery_target` - hook kompatibilitas untuk pengiriman penyelesaian ketika tidak ada binding sesi inti yang dapat memproyeksikan rute.
- `subagent_spawning` - hook kompatibilitas yang dideprekasi. Inti sekarang menyiapkan binding subagen `thread: true` melalui adaptor binding sesi kanal sebelum `subagent_spawned` dipicu.
- `subagent_spawned` menyertakan `resolvedModel` dan `resolvedProvider` ketika OpenClaw telah menyelesaikan model native sesi anak sebelum peluncuran.
- `subagent_ended` membawa `targetSessionKey` (identitas — ini cocok dengan `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` atau `"acp"`), `reason`, `outcome` opsional (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"`, atau `"deleted"`), `error` opsional, `runId`, `endedAt`, `accountId`, dan `sendFarewell`. Ini **tidak** menyertakan `agentId` atau `childSessionKey`; gunakan `targetSessionKey` untuk mengorelasikan dengan peristiwa `subagent_spawned` yang sesuai.

**Siklus hidup**

- `gateway_start` / `gateway_stop` - mulai atau hentikan layanan milik Plugin bersama Gateway
- `deactivate` - alias kompatibilitas yang dideprekasi untuk `gateway_stop`; gunakan `gateway_stop` di Plugin baru
- `cron_changed` - observasi perubahan siklus hidup Cron milik Gateway (ditambahkan, diperbarui, dihapus, dimulai, selesai, dijadwalkan)
- **`before_install`** - periksa material instalasi Skills atau Plugin yang distaging dari runtime
  Plugin yang dimuat

## Debug hook runtime

Gunakan `before_model_resolve` ketika sebuah Plugin perlu mengganti penyedia atau model
untuk giliran agen. Ini berjalan sebelum resolusi model; `llm_output` hanya berjalan setelah
percobaan model menghasilkan output asisten.

Untuk bukti model sesi efektif, periksa pendaftaran runtime, lalu
gunakan `openclaw sessions` atau permukaan sesi/status Gateway. Saat men-debug
payload penyedia, mulai Gateway dengan `--raw-stream` dan
`--raw-stream-path <path>`; flag tersebut menulis peristiwa stream model mentah ke file
jsonl.

## Kebijakan panggilan alat

`before_tool_call` menerima:

- `event.toolName`
- `event.params`
- `event.toolKind` dan `event.toolInputKind` opsional, diskriminator otoritatif host
  untuk alat yang sengaja berbagi nama; misalnya, panggilan `exec` mode kode luar
  menggunakan `toolKind: "code_mode_exec"` dan menyertakan
  `toolInputKind: "javascript" | "typescript"` ketika bahasa input diketahui
- `event.derivedPaths` opsional, berisi petunjuk path target turunan host secara upaya terbaik
  untuk envelope alat yang dikenal seperti `apply_patch`; ketika ada,
  path ini mungkin tidak lengkap atau mungkin melebih-lebihkan apa yang sebenarnya akan
  disentuh alat (misalnya, dengan input yang salah bentuk atau parsial)
- `event.runId` opsional
- `event.toolCallId` opsional
- field konteks seperti `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (diatur pada run yang digerakkan Cron), `ctx.toolKind`,
  `ctx.toolInputKind`, dan `ctx.trace` diagnostik

Ini dapat mengembalikan:

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
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Perilaku guard hook untuk hook siklus hidup bertipe:

- `block: true` bersifat terminal dan melewati handler berprioritas lebih rendah.
- `block: false` diperlakukan sebagai tanpa keputusan.
- `params` menulis ulang parameter alat untuk eksekusi.
- `requireApproval` menjeda run agen dan meminta pengguna melalui persetujuan Plugin.
  Perintah `/approve` dapat menyetujui persetujuan exec maupun Plugin.
  Dalam relay `PreToolUse` native mode laporan app-server Codex, ini ditunda
  ke permintaan persetujuan app-server yang cocok; lihat [runtime harness Codex](/id/plugins/codex-harness-runtime#hook-boundaries).
- `block: true` berprioritas lebih rendah masih dapat memblokir setelah hook berprioritas lebih tinggi
  meminta persetujuan.
- `onResolution` menerima keputusan persetujuan yang diselesaikan - `allow-once`,
  `allow-always`, `deny`, `timeout`, atau `cancelled`.

Lihat [Permintaan izin Plugin](/id/plugins/plugin-permission-requests) untuk
perutean persetujuan, perilaku keputusan, dan kapan menggunakan `requireApproval` alih-alih
alat opsional atau persetujuan exec.

Plugin yang membutuhkan kebijakan tingkat host dapat mendaftarkan kebijakan alat tepercaya dengan
`api.registerTrustedToolPolicy(...)`. Kebijakan ini berjalan sebelum hook
`before_tool_call` biasa dan sebelum keputusan hook normal. Kebijakan tepercaya bawaan
berjalan lebih dulu; kebijakan tepercaya Plugin terpasang berjalan berikutnya dalam urutan pemuatan Plugin;
hook `before_tool_call` biasa berjalan setelahnya. Plugin bawaan mempertahankan
path kebijakan tepercaya yang ada. Plugin terpasang harus diaktifkan secara eksplisit
dan mendeklarasikan setiap id kebijakan di `contracts.trustedToolPolicies`; id yang tidak dideklarasikan
ditolak sebelum pendaftaran. Id kebijakan dicakup ke Plugin yang mendaftarkan,
sehingga Plugin berbeda dapat menggunakan ulang id lokal yang sama. Gunakan tingkatan ini hanya
untuk gerbang yang dipercaya host seperti kebijakan workspace, penegakan anggaran, atau
keselamatan alur kerja yang dicadangkan.

### Hook lingkungan exec

`resolve_exec_env` memungkinkan Plugin mengontribusikan variabel lingkungan ke pemanggilan alat
`exec` setelah lingkungan exec dasar dibuat dan sebelum perintah berjalan. Ini menerima:

- `event.sessionKey`
- `event.toolName`, saat ini selalu `"exec"`
- `event.host`, salah satu dari `"gateway"`, `"sandbox"`, atau `"node"`
- field konteks seperti `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider`, dan `ctx.channelId`

Kembalikan `Record<string, string>` untuk digabungkan ke lingkungan exec. Handler
berjalan dalam urutan prioritas, dan hasil hook yang lebih akhir menimpa hasil hook sebelumnya untuk
kunci yang sama.

Output hook difilter melalui kebijakan kunci lingkungan exec host sebelum
digabungkan. Kunci tidak valid, `PATH`, dan kunci override host berbahaya seperti
`LD_*`, `DYLD_*`, `NODE_OPTIONS`, variabel proxy, dan variabel override TLS
dihapus. Env plugin yang sudah difilter disertakan dalam metadata approval/audit
gateway dan diteruskan ke permintaan eksekusi node-host.

### Persistensi hasil tool

Hasil tool dapat menyertakan `details` terstruktur untuk perenderan UI, diagnostik,
routing media, atau metadata milik plugin. Perlakukan `details` sebagai metadata runtime,
bukan konten prompt:

- OpenClaw menghapus `toolResult.details` sebelum replay provider dan input
  compaction agar metadata tidak menjadi konteks model.
- Entri sesi yang dipersistensikan hanya menyimpan `details` yang dibatasi. Detail yang terlalu besar
  diganti dengan ringkasan ringkas dan `persistedDetailsTruncated: true`.
- `tool_result_persist` dan `before_message_write` berjalan sebelum batas
  persistensi final. Hook tetap harus menjaga `details` yang dikembalikan tetap kecil dan menghindari
  penempatan teks yang relevan dengan prompt hanya di `details`; letakkan output tool yang terlihat model
  di `content`.

## Hook prompt dan model

Gunakan hook khusus fase untuk plugin baru:

- `before_model_resolve`: hanya menerima prompt saat ini dan metadata attachment.
  Kembalikan `providerOverride` atau `modelOverride`.
- `agent_turn_prepare`: menerima prompt saat ini, pesan sesi yang sudah disiapkan,
  dan setiap injeksi antrean tepat-sekali yang dikuras untuk sesi ini. Kembalikan
  `prependContext` atau `appendContext`.
- `before_prompt_build`: menerima prompt saat ini dan pesan sesi.
  Kembalikan `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, atau `appendSystemContext`.
- `heartbeat_prompt_contribution`: hanya berjalan untuk giliran heartbeat dan mengembalikan
  `prependContext` atau `appendContext`. Ini ditujukan untuk monitor latar belakang
  yang perlu merangkum status saat ini tanpa mengubah giliran yang diinisiasi pengguna.

`before_agent_start` tetap ada untuk kompatibilitas. Lebih utamakan hook eksplisit di atas
agar plugin Anda tidak bergantung pada fase gabungan legacy.

`before_agent_run` berjalan setelah konstruksi prompt dan sebelum input model apa pun,
termasuk pemuatan gambar lokal prompt dan observasi `llm_input`. Hook ini menerima
input pengguna saat ini sebagai `prompt`, ditambah riwayat sesi yang dimuat di `messages`
dan prompt sistem aktif. Kembalikan `{ outcome: "block", reason, message? }`
untuk menghentikan run sebelum model dapat membaca prompt. `reason` bersifat internal;
`message` adalah pengganti yang terlihat pengguna. Satu-satunya outcome yang didukung adalah
`pass` dan `block`; bentuk keputusan yang tidak didukung gagal secara tertutup.

Ketika run diblokir, OpenClaw hanya menyimpan teks pengganti di
`message.content` plus metadata blok non-sensitif seperti id plugin pemblokir
dan timestamp. Teks asli pengguna tidak dipertahankan dalam transkrip atau konteks mendatang.
Alasan blok internal diperlakukan sebagai sensitif dan dikecualikan dari payload
transkrip, riwayat, broadcast, log, dan diagnostik. Observabilitas
harus menggunakan field tersanitasi seperti id pemblokir, outcome, timestamp, atau kategori
yang aman.

`before_agent_start` dan `agent_end` menyertakan `event.runId` saat OpenClaw dapat
mengidentifikasi run aktif. Nilai yang sama juga tersedia di `ctx.runId`.
Run yang digerakkan Cron juga mengekspos `ctx.jobId` (id tugas cron asal) agar
hook plugin dapat membatasi metrik, efek samping, atau status ke tugas terjadwal
tertentu.

Untuk run yang berasal dari channel, `ctx.channel` dan `ctx.messageProvider` mengidentifikasi
surface provider seperti `discord` atau `telegram`, sedangkan `ctx.channelId` adalah
pengidentifikasi target percakapan saat OpenClaw dapat menurunkannya dari kunci sesi
atau metadata pengiriman.

Saat identitas pengirim tersedia, konteks hook agent juga menyertakan:

- `ctx.senderId` — ID pengirim dalam cakupan channel (mis. Feishu `open_id`, ID pengguna Discord).
  Diisi saat run berasal dari pesan pengguna dengan metadata
  pengirim yang diketahui.
- `ctx.chatId` — pengidentifikasi percakapan native transport (mis. Feishu
  `chat_id`, Telegram `chat_id`). Diisi saat channel asal
  menyediakan ID percakapan native.
- `ctx.channelContext.sender.id` — ID pengirim yang sama dengan `ctx.senderId`, di bawah
  objek milik channel yang dapat diperluas plugin dengan field khusus channel.
- `ctx.channelContext.chat.id` — ID percakapan yang sama dengan `ctx.chatId`, di bawah
  objek milik channel yang dapat diperluas plugin dengan field khusus channel.

Core hanya mendefinisikan field `id` bertingkat. Plugin channel yang meneruskan metadata
pengirim atau chat yang lebih kaya melalui helper inbound dapat menambah
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

Plugin channel meneruskan field tersebut melalui helper SDK inbound:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Field ini opsional dan tidak ada untuk run yang berasal dari sistem (heartbeat,
cron, exec-event).

`ctx.senderExternalId` tetap ada sebagai field kompatibilitas sumber yang deprecated untuk
plugin lama. Core tidak mengisinya; identitas pengirim khusus channel yang baru
harus berada di bawah `ctx.channelContext.sender` melalui augmentasi modul.

`agent_end` adalah hook observasi. Jalur Gateway dan harness persisten menjalankannya
secara fire-and-forget setelah giliran, sedangkan jalur CLI one-shot berumur pendek menunggu
promise hook sebelum pembersihan proses agar plugin tepercaya dapat mem-flush observabilitas
terminal atau menangkap status. Runner hook menerapkan timeout 30 detik sehingga
plugin atau endpoint embedding yang macet tidak dapat membuat promise hook tertunda
selamanya. Timeout dicatat dan OpenClaw melanjutkan; ini tidak membatalkan
pekerjaan jaringan milik plugin kecuali plugin juga menggunakan sinyal abort-nya sendiri.

Gunakan `model_call_started` dan `model_call_ended` untuk telemetri panggilan provider
yang tidak boleh menerima prompt mentah, riwayat, respons, header, body permintaan,
atau ID permintaan provider. Hook ini menyertakan metadata stabil seperti
`runId`, `callId`, `provider`, `model`, `api`/`transport` opsional, terminal
`durationMs`/`outcome`, dan `upstreamRequestIdHash` saat OpenClaw dapat menurunkan
hash request-id provider yang dibatasi. Ketika runtime telah menyelesaikan metadata
context-window, event dan konteks hook juga menyertakan `contextTokenBudget`, yaitu
anggaran token efektif setelah batas model/config/agent, plus
`contextWindowSource` dan `contextWindowReferenceTokens` saat batas yang lebih rendah
diterapkan.

`before_agent_finalize` hanya berjalan ketika harness akan menerima jawaban assistant final
yang natural. Ini bukan jalur pembatalan `/stop` dan tidak
berjalan ketika pengguna membatalkan giliran. Kembalikan `{ action: "revise", reason }` untuk meminta
harness melakukan satu pass model lagi sebelum finalisasi, `{ action:
"finalize", reason? }` untuk memaksa finalisasi, atau hilangkan hasil untuk melanjutkan.
Hook native Codex `Stop` direlay ke hook ini sebagai keputusan OpenClaw
`before_agent_finalize`.

Saat mengembalikan `action: "revise"`, plugin dapat menyertakan metadata `retry` untuk membuat
pass model tambahan dibatasi dan aman untuk replay:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` ditambahkan ke alasan revisi yang dikirim ke harness.
`idempotencyKey` memungkinkan host menghitung retry untuk permintaan plugin yang sama di seluruh
keputusan finalize yang ekuivalen, dan `maxAttempts` membatasi berapa banyak pass tambahan yang
akan diizinkan host sebelum melanjutkan dengan jawaban final natural.

Plugin non-bundled yang membutuhkan hook percakapan mentah (`before_model_resolve`,
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

Hook yang mengubah prompt dan injeksi giliran berikutnya yang tahan lama dapat dinonaktifkan per plugin
dengan `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Ekstensi sesi dan injeksi giliran berikutnya

Plugin workflow dapat mempersistensikan status sesi kecil yang kompatibel JSON dengan
`api.registerSessionExtension(...)` dan memperbaruinya melalui metode Gateway
`sessions.pluginPatch`. Baris sesi memproyeksikan status ekstensi terdaftar
melalui `pluginExtensions`, sehingga Control UI dan klien lain dapat merender
status milik plugin tanpa mempelajari internal plugin.

Gunakan `api.enqueueNextTurnInjection(...)` saat plugin membutuhkan konteks tahan lama untuk
mencapai giliran model berikutnya tepat satu kali. OpenClaw menguras injeksi antrean sebelum
hook prompt, membuang injeksi kedaluwarsa, dan melakukan deduplikasi berdasarkan `idempotencyKey`
per plugin. Ini adalah seam yang tepat untuk resume approval, ringkasan kebijakan,
delta monitor latar belakang, dan kelanjutan perintah yang harus terlihat oleh
model pada giliran berikutnya tetapi tidak boleh menjadi teks prompt sistem permanen.

Semantik pembersihan adalah bagian dari kontrak. Pembersihan ekstensi sesi dan
callback pembersihan siklus hidup runtime menerima `reset`, `delete`, `disable`, atau
`restart`. Host menghapus status ekstensi sesi persisten milik plugin pemilik
dan injeksi giliran berikutnya yang tertunda untuk reset/delete/disable; restart mempertahankan
status sesi tahan lama sementara callback pembersihan memungkinkan plugin melepas tugas scheduler,
konteks run, dan resource out-of-band lain untuk generasi runtime lama.

## Hook pesan

Gunakan hook pesan untuk routing tingkat channel dan kebijakan pengiriman:

- `message_received`: mengamati konten inbound, pengirim, `threadId`, `messageId`,
  `senderId`, korelasi run/sesi opsional, dan metadata.
- `message_sending`: menulis ulang `content` atau mengembalikan `{ cancel: true }`.
- `reply_payload_sending`: menulis ulang objek `ReplyPayload` yang dinormalisasi (termasuk
  `presentation`, `delivery`, referensi media, dan teks) atau mengembalikan `{ cancel: true }`.
- `message_sent`: mengamati keberhasilan atau kegagalan final.

Untuk balasan TTS audio-saja, `content` dapat berisi transkrip lisan tersembunyi
bahkan ketika payload channel tidak memiliki teks/caption yang terlihat. Menulis ulang
`content` tersebut hanya memperbarui transkrip yang terlihat hook; itu tidak dirender sebagai
caption media.

Event `reply_payload_sending` dapat menyertakan `usageState`, snapshot live
model/penggunaan/konteks per giliran secara best-effort. Pengiriman tahan lama, replay yang dipulihkan, dan
balasan tanpa korelasi run yang tepat menghilangkannya.

Konteks hook pesan mengekspos field korelasi stabil saat tersedia:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, dan `ctx.callDepth`. Konteks inbound
dan `before_dispatch` juga mengekspos metadata balasan saat channel memiliki
data pesan kutipan yang difilter visibilitasnya: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender`, dan `replyToIsQuote`. Utamakan field first-class
ini sebelum membaca metadata legacy.

Utamakan field `threadId` dan `replyToId` bertipe sebelum menggunakan metadata
khusus channel.

Aturan keputusan:

- `message_sending` dengan `cancel: true` bersifat terminal.
- `message_sending` dengan `cancel: false` diperlakukan sebagai tanpa keputusan.
- `content` yang ditulis ulang terus diteruskan ke hook berprioritas lebih rendah kecuali hook berikutnya
  membatalkan pengiriman.
- `reply_payload_sending` berjalan setelah normalisasi payload dan sebelum pengiriman channel,
  termasuk balasan yang dirutekan kembali ke channel asal. Handler
  berjalan berurutan dan setiap handler melihat payload terbaru yang dihasilkan oleh
  handler berprioritas lebih tinggi.
- Payload `reply_payload_sending` tidak mengekspos penanda kepercayaan runtime seperti
  `trustedLocalMedia`; plugin dapat mengedit bentuk payload tetapi tidak dapat memberikan kepercayaan
  media lokal.
- `message_sending` dapat mengembalikan `cancelReason` dan `metadata` terbatas dengan
  pembatalan. API siklus hidup pesan baru mengekspos ini sebagai hasil pengiriman yang ditekan
  dengan alasan `cancelled_by_message_sending_hook`; pengiriman langsung legacy
  tetap mengembalikan array hasil kosong demi kompatibilitas.
- `message_sent` hanya untuk observasi. Kegagalan handler dicatat dan tidak
  mengubah hasil pengiriman.

## Hook instalasi

Gunakan `security.installPolicy` untuk keputusan izinkan/blokir yang dimiliki operator. Kebijakan tersebut
berjalan dari konfigurasi OpenClaw, mencakup jalur instalasi dan pembaruan CLI, dan gagal
tertutup saat diaktifkan tetapi tidak tersedia.

`before_install` adalah hook siklus hidup runtime plugin. Hook ini berjalan setelah
`security.installPolicy` hanya dalam proses OpenClaw tempat hook plugin telah
dimuat, seperti alur instalasi yang didukung Gateway. Hook ini berguna untuk
observasi, peringatan, dan pemeriksaan kompatibilitas yang dimiliki plugin, tetapi bukan
batas keamanan enterprise atau host utama untuk instalasi. Kolom `builtinScan`
tetap ada dalam payload peristiwa demi kompatibilitas, tetapi OpenClaw tidak lagi
menjalankan pemblokiran kode berbahaya bawaan pada waktu instalasi, sehingga ini adalah hasil `ok`
kosong. Kembalikan temuan tambahan atau `{ block: true, blockReason }` untuk menghentikan
instalasi dalam proses tersebut.

`block: true` bersifat terminal. `block: false` diperlakukan sebagai tanpa keputusan.
Kegagalan handler memblokir instalasi dengan gagal tertutup.

## Siklus hidup Gateway

Gunakan `gateway_start` untuk layanan plugin yang membutuhkan status milik Gateway. Konteks
mengekspos `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk
inspeksi dan pembaruan cron. Gunakan `gateway_stop` untuk membersihkan sumber daya
yang berjalan lama.

Jangan mengandalkan hook internal `gateway:startup` untuk layanan runtime
yang dimiliki plugin.

`cron_changed` dipicu untuk peristiwa siklus hidup cron milik gateway dengan payload
peristiwa bertipe yang mencakup alasan `added`, `updated`, `removed`, `started`, `finished`,
dan `scheduled`. Peristiwa tersebut membawa snapshot `PluginHookGatewayCronJob`
(termasuk `state.nextRunAtMs`, `state.lastRunStatus`, dan
`state.lastError` saat ada) serta `PluginHookGatewayCronDeliveryStatus`
bernilai `not-requested` | `delivered` | `not-delivered` | `unknown`. Peristiwa
penghapusan tetap membawa snapshot pekerjaan yang dihapus agar penjadwal eksternal dapat
merekonsiliasi status. Gunakan `ctx.getCron?.()` dan `ctx.config` dari konteks runtime
saat menyinkronkan penjadwal bangun eksternal, dan pertahankan OpenClaw sebagai
sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

## Depresiasi mendatang

Beberapa permukaan yang berdekatan dengan hook sudah didepresiasi tetapi masih didukung. Migrasikan
sebelum rilis mayor berikutnya:

- **Envelope channel teks biasa** di handler `inbound_claim` dan `message_received`.
  Baca `BodyForAgent` dan blok konteks pengguna terstruktur
  alih-alih mem-parsing teks envelope datar. Lihat
  [Envelope channel teks biasa → BodyForAgent](/id/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** tetap ada demi kompatibilitas. Plugin baru sebaiknya menggunakan
  `before_model_resolve` dan `before_prompt_build` alih-alih fase gabungan.
- **`subagent_spawning`** tetap ada demi kompatibilitas dengan plugin lama, tetapi
  plugin baru tidak boleh mengembalikan perutean thread darinya. Core menyiapkan
  binding subagent `thread: true` melalui adapter binding sesi channel
  sebelum `subagent_spawned` dipicu.
- **`deactivate`** tetap ada sebagai alias kompatibilitas pembersihan yang didepresiasi hingga
  setelah 2026-08-16. Plugin baru sebaiknya menggunakan `gateway_stop`.
- **`onResolution` dalam `before_tool_call`** kini menggunakan union bertipe
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) alih-alih `string` bentuk bebas.

Untuk daftar lengkapnya - pendaftaran kapabilitas memori, profil pemikiran provider,
provider autentikasi eksternal, tipe penemuan provider, pengakses runtime tugas,
dan penggantian nama `command-auth` → `command-status` - lihat
[Migrasi Plugin SDK → Depresiasi aktif](/id/plugins/sdk-migration#active-deprecations).

## Terkait

- [Migrasi Plugin SDK](/id/plugins/sdk-migration) - depresiasi aktif dan linimasa penghapusan
- [Membangun plugin](/id/plugins/building-plugins)
- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
- [Titik masuk Plugin](/id/plugins/sdk-entrypoints)
- [Hook internal](/id/automation/hooks)
- [Internal arsitektur Plugin](/id/plugins/architecture-internals)
