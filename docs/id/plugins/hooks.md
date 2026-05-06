---
read_when:
    - Anda sedang membuat Plugin yang membutuhkan before_tool_call, before_agent_reply, hook pesan, atau hook siklus hidup
    - Anda perlu memblokir, menulis ulang, atau mewajibkan persetujuan untuk panggilan alat dari Plugin
    - Anda sedang memilih antara hook internal dan hook Plugin
summary: 'Kait Plugin: mencegat peristiwa siklus hidup agen, alat, pesan, sesi, dan Gateway'
title: Kait Plugin
x-i18n:
    generated_at: "2026-05-06T17:58:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3741b95bcccdff4e24b4c1f05de54649b48a6c0a2ca1dc4376475eb1823ae185
    source_path: plugins/hooks.md
    workflow: 16
---

Hook Plugin adalah titik ekstensi dalam proses untuk Plugin OpenClaw. Gunakan ini
ketika sebuah Plugin perlu memeriksa atau mengubah proses agen, pemanggilan alat, alur pesan,
siklus hidup sesi, perutean subagent, instalasi, atau startup Gateway.

Gunakan [hook internal](/id/automation/hooks) sebagai gantinya ketika Anda menginginkan skrip
`HOOK.md` kecil yang dipasang operator untuk perintah dan peristiwa Gateway seperti
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

Handler hook berjalan berurutan menurut `priority` dari tertinggi ke terendah. Hook dengan prioritas sama
mempertahankan urutan pendaftaran.

`api.on(name, handler, opts?)` menerima:

- `priority` - urutan handler (yang lebih tinggi berjalan lebih dulu).
- `timeoutMs` - anggaran opsional per hook. Jika diatur, runner hook membatalkan
  handler tersebut setelah anggaran berlalu dan melanjutkan ke handler berikutnya, alih-alih
  membiarkan penyiapan lambat atau pekerjaan recall menghabiskan timeout model yang
  dikonfigurasi pemanggil. Abaikan untuk menggunakan timeout observasi/keputusan default yang
  diterapkan runner hook secara umum.

Operator juga dapat mengatur anggaran hook tanpa menambal kode Plugin:

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
`api.on(..., { timeoutMs })` yang ditulis Plugin. Setiap nilai yang dikonfigurasi harus
berupa bilangan bulat positif tidak lebih dari 600000 milidetik. Utamakan penggantian per hook
untuk hook yang diketahui lambat agar satu Plugin tidak mendapat anggaran lebih panjang
di semua tempat.

Setiap hook menerima `event.context.pluginConfig`, yaitu konfigurasi terselesaikan untuk
Plugin yang mendaftarkan handler tersebut. Gunakan ini untuk keputusan hook yang memerlukan
opsi Plugin saat ini; OpenClaw menyuntikkannya per handler tanpa memutasi
objek peristiwa bersama yang dilihat Plugin lain.

## Katalog hook

Hook dikelompokkan menurut surface yang diperluasnya. Nama dalam **tebal** menerima
hasil keputusan (blokir, batalkan, ganti, atau wajibkan persetujuan); semua lainnya
hanya observasi.

**Giliran agen**

- `before_model_resolve` - mengganti penyedia atau model sebelum pesan sesi dimuat
- `agent_turn_prepare` - memakai injeksi giliran Plugin yang diantrekan dan menambahkan konteks giliran yang sama sebelum hook prompt
- `before_prompt_build` - menambahkan konteks dinamis atau teks prompt sistem sebelum pemanggilan model
- `before_agent_start` - fase gabungan khusus kompatibilitas; utamakan dua hook di atas
- **`before_agent_run`** - memeriksa prompt akhir dan pesan sesi sebelum pengiriman model dan secara opsional memblokir proses
- **`before_agent_reply`** - memotong giliran model dengan balasan sintetis atau diam
- **`before_agent_finalize`** - memeriksa jawaban akhir alami dan meminta satu lintasan model lagi
- `agent_end` - mengamati pesan akhir, status sukses, dan durasi proses
- `heartbeat_prompt_contribution` - menambahkan konteks khusus Heartbeat untuk monitor latar belakang dan Plugin siklus hidup

**Observasi percakapan**

- `model_call_started` / `model_call_ended` - mengamati metadata pemanggilan penyedia/model yang disanitasi, waktu, hasil, dan hash id permintaan terbatas tanpa konten prompt atau respons
- `llm_input` - mengamati input penyedia (prompt sistem, prompt, riwayat)
- `llm_output` - mengamati output penyedia

**Alat**

- **`before_tool_call`** - menulis ulang parameter alat, memblokir eksekusi, atau mewajibkan persetujuan
- `after_tool_call` - mengamati hasil alat, error, dan durasi
- **`tool_result_persist`** - menulis ulang pesan asisten yang dihasilkan dari hasil alat
- **`before_message_write`** - memeriksa atau memblokir penulisan pesan yang sedang berlangsung (jarang)

**Pesan dan pengiriman**

- **`inbound_claim`** - mengklaim pesan masuk sebelum perutean agen (balasan sintetis)
- `message_received` - mengamati konten masuk, pengirim, thread, dan metadata
- **`message_sending`** - menulis ulang konten keluar atau membatalkan pengiriman
- `message_sent` - mengamati keberhasilan atau kegagalan pengiriman keluar
- **`before_dispatch`** - memeriksa atau menulis ulang dispatch keluar sebelum handoff channel
- **`reply_dispatch`** - berpartisipasi dalam pipeline dispatch balasan akhir

**Sesi dan Compaction**

- `session_start` / `session_end` - melacak batas siklus hidup sesi
- `before_compaction` / `after_compaction` - mengamati atau memberi anotasi siklus Compaction
- `before_reset` - mengamati peristiwa reset sesi (`/reset`, reset terprogram)

**Subagent**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - mengoordinasikan perutean subagent dan pengiriman penyelesaian

**Siklus hidup**

- `gateway_start` / `gateway_stop` - memulai atau menghentikan layanan milik Plugin bersama Gateway
- `cron_changed` - mengamati perubahan siklus hidup Cron milik Gateway (ditambahkan, diperbarui, dihapus, dimulai, selesai, dijadwalkan)
- **`before_install`** - memeriksa pemindaian instalasi skill atau Plugin dan secara opsional memblokir

## Kebijakan pemanggilan alat

`before_tool_call` menerima:

- `event.toolName`
- `event.params`
- `event.runId` opsional
- `event.toolCallId` opsional
- field konteks seperti `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (diatur pada proses yang digerakkan Cron), dan diagnostik `ctx.trace`

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
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Aturan:

- `block: true` bersifat terminal dan melewati handler berprioritas lebih rendah.
- `block: false` diperlakukan sebagai tanpa keputusan.
- `params` menulis ulang parameter alat untuk eksekusi.
- `requireApproval` menjeda proses agen dan meminta pengguna melalui persetujuan Plugin.
  Perintah `/approve` dapat menyetujui persetujuan exec dan Plugin.
- `block: true` berprioritas lebih rendah masih dapat memblokir setelah hook berprioritas lebih tinggi
  meminta persetujuan.
- `onResolution` menerima keputusan persetujuan terselesaikan - `allow-once`,
  `allow-always`, `deny`, `timeout`, atau `cancelled`.

Plugin bawaan yang memerlukan kebijakan tingkat host dapat mendaftarkan kebijakan alat tepercaya
dengan `api.registerTrustedToolPolicy(...)`. Ini berjalan sebelum hook
`before_tool_call` biasa dan sebelum keputusan Plugin eksternal. Gunakan hanya
untuk gate tepercaya host seperti kebijakan workspace, penegakan anggaran, atau
keselamatan alur kerja yang dicadangkan. Plugin eksternal harus menggunakan hook
`before_tool_call` normal.

### Persistensi hasil alat

Hasil alat dapat menyertakan `details` terstruktur untuk rendering UI, diagnostik,
perutean media, atau metadata milik Plugin. Perlakukan `details` sebagai metadata runtime,
bukan konten prompt:

- OpenClaw menghapus `toolResult.details` sebelum replay penyedia dan input Compaction
  agar metadata tidak menjadi konteks model.
- Entri sesi yang dipersistensikan hanya menyimpan `details` terbatas. Detail yang terlalu besar
  diganti dengan ringkasan ringkas dan `persistedDetailsTruncated: true`.
- `tool_result_persist` dan `before_message_write` berjalan sebelum batas persistensi akhir.
  Hook tetap harus menjaga `details` yang dikembalikan tetap kecil dan menghindari
  menaruh teks yang relevan untuk prompt hanya di `details`; letakkan output alat yang terlihat model
  di `content`.

## Hook prompt dan model

Gunakan hook khusus fase untuk Plugin baru:

- `before_model_resolve`: hanya menerima prompt saat ini dan metadata lampiran.
  Kembalikan `providerOverride` atau `modelOverride`.
- `agent_turn_prepare`: menerima prompt saat ini, pesan sesi yang disiapkan,
  dan setiap injeksi antrean exactly-once yang dikuras untuk sesi ini. Kembalikan
  `prependContext` atau `appendContext`.
- `before_prompt_build`: menerima prompt saat ini dan pesan sesi.
  Kembalikan `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, atau `appendSystemContext`.
- `heartbeat_prompt_contribution`: berjalan hanya untuk giliran Heartbeat dan mengembalikan
  `prependContext` atau `appendContext`. Ini ditujukan untuk monitor latar belakang
  yang perlu merangkum status saat ini tanpa mengubah giliran yang diprakarsai pengguna.

`before_agent_start` tetap ada untuk kompatibilitas. Utamakan hook eksplisit di atas
agar Plugin Anda tidak bergantung pada fase gabungan lama.

`before_agent_run` berjalan setelah konstruksi prompt dan sebelum input model apa pun,
termasuk pemuatan gambar lokal prompt dan observasi `llm_input`. Ini menerima
input pengguna saat ini sebagai `prompt`, ditambah riwayat sesi yang dimuat di `messages`
dan prompt sistem aktif. Kembalikan `{ outcome: "block", reason, message? }`
untuk menghentikan proses sebelum model dapat membaca prompt. `reason` bersifat internal;
`message` adalah pengganti yang ditampilkan kepada pengguna. Satu-satunya hasil yang didukung adalah
`pass` dan `block`; bentuk keputusan yang tidak didukung gagal tertutup.

Ketika suatu proses diblokir, OpenClaw hanya menyimpan teks pengganti di
`message.content` ditambah metadata blokir non-sensitif seperti id Plugin pemblokir
dan timestamp. Teks pengguna asli tidak disimpan dalam transkrip atau konteks masa depan.
Alasan blokir internal diperlakukan sebagai sensitif dan dikecualikan dari payload
transkrip, riwayat, siaran, log, dan diagnostik. Observabilitas
sebaiknya menggunakan field tersanitasi seperti id pemblokir, hasil, timestamp, atau kategori aman.

`before_agent_start` dan `agent_end` menyertakan `event.runId` ketika OpenClaw dapat
mengidentifikasi proses aktif. Nilai yang sama juga tersedia di `ctx.runId`.
Proses yang digerakkan Cron juga mengekspos `ctx.jobId` (id job Cron asal) sehingga
hook Plugin dapat membatasi metrik, efek samping, atau status ke job terjadwal tertentu.

Untuk proses yang berasal dari channel, `ctx.messageProvider` adalah surface penyedia seperti
`discord` atau `telegram`, sedangkan `ctx.channelId` adalah pengidentifikasi target percakapan
ketika OpenClaw dapat menurunkannya dari kunci sesi atau metadata pengiriman.

`agent_end` adalah hook observasi dan berjalan fire-and-forget setelah giliran. Runner
hook menerapkan timeout 30 detik agar Plugin atau endpoint embedding yang macet
tidak dapat membuat promise hook tertunda selamanya. Timeout dicatat dan
OpenClaw melanjutkan; ini tidak membatalkan pekerjaan jaringan milik Plugin kecuali
Plugin juga menggunakan sinyal abort miliknya sendiri.

Gunakan `model_call_started` dan `model_call_ended` untuk telemetri pemanggilan penyedia
yang tidak boleh menerima prompt mentah, riwayat, respons, header, body permintaan,
atau ID permintaan penyedia. Hook ini menyertakan metadata stabil seperti
`runId`, `callId`, `provider`, `model`, `api`/`transport` opsional,
`durationMs`/`outcome` terminal, dan `upstreamRequestIdHash` ketika OpenClaw dapat menurunkan
hash id permintaan penyedia terbatas.

`before_agent_finalize` berjalan hanya ketika harness akan menerima jawaban akhir asisten
alami. Ini bukan jalur pembatalan `/stop` dan tidak
berjalan ketika pengguna membatalkan giliran. Kembalikan `{ action: "revise", reason }` untuk meminta
harness melakukan satu lintasan model lagi sebelum finalisasi, `{ action:
"finalize", reason? }` untuk memaksa finalisasi, atau abaikan hasil untuk melanjutkan.
Hook `Stop` native Codex diteruskan ke hook ini sebagai keputusan
`before_agent_finalize` OpenClaw.

Saat mengembalikan `action: "revise"`, Plugin dapat menyertakan metadata `retry` untuk membuat
lintasan model tambahan terbatas dan aman untuk replay:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` ditambahkan ke alasan revisi yang dikirim ke harness.
`idempotencyKey` memungkinkan host menghitung percobaan ulang untuk permintaan Plugin yang sama di seluruh keputusan finalisasi yang ekuivalen, dan `maxAttempts` membatasi berapa banyak lintasan tambahan yang akan diizinkan host sebelum melanjutkan dengan jawaban akhir alami.

Plugin non-bundel yang memerlukan hook percakapan mentah (`before_model_resolve`,
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

Hook yang mengubah prompt dan injeksi giliran berikutnya yang tahan lama dapat dinonaktifkan per Plugin
dengan `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Ekstensi sesi dan injeksi giliran berikutnya

Plugin alur kerja dapat mempertahankan state sesi kecil yang kompatibel dengan JSON menggunakan
`api.registerSessionExtension(...)` dan memperbaruinya melalui metode Gateway
`sessions.pluginPatch`. Baris sesi memproyeksikan state ekstensi terdaftar melalui
`pluginExtensions`, sehingga Control UI dan klien lain dapat merender status milik
Plugin tanpa mengetahui internal Plugin.

Gunakan `api.enqueueNextTurnInjection(...)` saat Plugin memerlukan konteks tahan lama untuk
mencapai giliran model berikutnya tepat satu kali. OpenClaw mengosongkan injeksi antrean sebelum
hook prompt, membuang injeksi yang kedaluwarsa, dan menduplikasi berdasarkan `idempotencyKey`
per Plugin. Ini adalah titik sambungan yang tepat untuk kelanjutan persetujuan, ringkasan kebijakan,
delta monitor latar belakang, dan kelanjutan perintah yang harus terlihat oleh
model pada giliran berikutnya tetapi tidak boleh menjadi teks prompt sistem permanen.

Semantik pembersihan adalah bagian dari kontrak. Pembersihan ekstensi sesi dan
callback pembersihan siklus hidup runtime menerima `reset`, `delete`, `disable`, atau
`restart`. Host menghapus state ekstensi sesi persisten milik Plugin
dan injeksi giliran berikutnya yang tertunda untuk reset/delete/disable; restart mempertahankan
state sesi tahan lama sementara callback pembersihan memungkinkan Plugin melepas job penjadwal,
konteks berjalan, dan sumber daya di luar jalur lainnya untuk generasi runtime lama.

## Hook pesan

Gunakan hook pesan untuk perutean tingkat kanal dan kebijakan pengiriman:

- `message_received`: mengamati konten masuk, pengirim, `threadId`, `messageId`,
  `senderId`, korelasi run/sesi opsional, dan metadata.
- `message_sending`: menulis ulang `content` atau mengembalikan `{ cancel: true }`.
- `message_sent`: mengamati keberhasilan atau kegagalan akhir.

Untuk balasan TTS khusus audio, `content` dapat berisi transkrip ucapan tersembunyi
meskipun payload kanal tidak memiliki teks/caption yang terlihat. Menulis ulang
`content` tersebut hanya memperbarui transkrip yang terlihat oleh hook; itu tidak dirender sebagai
caption media.

Konteks hook pesan mengekspos field korelasi stabil saat tersedia:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, dan `ctx.callDepth`. Prioritaskan
field kelas satu ini sebelum membaca metadata lama.

Prioritaskan field bertipe `threadId` dan `replyToId` sebelum menggunakan metadata
spesifik kanal.

Aturan keputusan:

- `message_sending` dengan `cancel: true` bersifat terminal.
- `message_sending` dengan `cancel: false` diperlakukan sebagai tanpa keputusan.
- `content` yang ditulis ulang berlanjut ke hook dengan prioritas lebih rendah kecuali hook berikutnya
  membatalkan pengiriman.

## Hook instalasi

`before_install` berjalan setelah pemindaian bawaan untuk instalasi skill dan Plugin.
Kembalikan temuan tambahan atau `{ block: true, blockReason }` untuk menghentikan
instalasi.

`block: true` bersifat terminal. `block: false` diperlakukan sebagai tanpa keputusan.

## Siklus hidup Gateway

Gunakan `gateway_start` untuk layanan Plugin yang memerlukan state milik Gateway. Konteks
mengekspos `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk
inspeksi dan pembaruan Cron. Gunakan `gateway_stop` untuk membersihkan sumber daya
yang berjalan lama.

Jangan mengandalkan hook internal `gateway:startup` untuk layanan runtime milik
Plugin.

`cron_changed` dipicu untuk peristiwa siklus hidup Cron milik Gateway dengan payload
peristiwa bertipe yang mencakup alasan `added`, `updated`, `removed`, `started`, `finished`,
dan `scheduled`. Peristiwa tersebut membawa snapshot `PluginHookGatewayCronJob`
(termasuk `state.nextRunAtMs`, `state.lastRunStatus`, dan
`state.lastError` saat ada) ditambah `PluginHookGatewayCronDeliveryStatus`
berupa `not-requested` | `delivered` | `not-delivered` | `unknown`. Peristiwa yang dihapus
tetap membawa snapshot job yang dihapus agar penjadwal eksternal dapat
merekonsiliasi state. Gunakan `ctx.getCron?.()` dan `ctx.config` dari konteks
runtime saat menyinkronkan penjadwal bangun eksternal, dan pertahankan OpenClaw sebagai
sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

## Deprekasi mendatang

Beberapa permukaan yang berdekatan dengan hook sudah dideprekasi tetapi masih didukung. Migrasikan
sebelum rilis mayor berikutnya:

- **Envelope kanal plaintext** di handler `inbound_claim` dan `message_received`.
  Baca `BodyForAgent` dan blok konteks pengguna terstruktur
  alih-alih mengurai teks envelope datar. Lihat
  [Envelope kanal plaintext → BodyForAgent](/id/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** tetap ada untuk kompatibilitas. Plugin baru harus menggunakan
  `before_model_resolve` dan `before_prompt_build` alih-alih fase gabungan.
- **`onResolution` di `before_tool_call`** kini menggunakan union bertipe
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) alih-alih `string` bebas.

Untuk daftar lengkap - pendaftaran kapabilitas memori, profil berpikir penyedia,
penyedia autentikasi eksternal, tipe penemuan penyedia, accessor runtime tugas,
dan penggantian nama `command-auth` → `command-status` - lihat
[Migrasi Plugin SDK → Deprekasi aktif](/id/plugins/sdk-migration#active-deprecations).

## Terkait

- [Migrasi Plugin SDK](/id/plugins/sdk-migration) - deprekasi aktif dan linimasa penghapusan
- [Membangun Plugin](/id/plugins/building-plugins)
- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
- [Titik masuk Plugin](/id/plugins/sdk-entrypoints)
- [Hook internal](/id/automation/hooks)
- [Internal arsitektur Plugin](/id/plugins/architecture-internals)
