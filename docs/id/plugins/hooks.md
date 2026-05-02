---
read_when:
    - Anda sedang membangun Plugin yang membutuhkan before_tool_call, before_agent_reply, hook pesan, atau hook siklus hidup
    - Anda perlu memblokir, menulis ulang, atau mewajibkan persetujuan untuk panggilan alat dari Plugin
    - Anda sedang memilih antara hook internal dan hook Plugin
summary: 'Hook Plugin: mencegat peristiwa siklus hidup agen, alat, pesan, sesi, dan Gateway'
title: Kait Plugin
x-i18n:
    generated_at: "2026-05-02T09:27:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4efb07c6211debb5a7915d63678b1695946a91600c54d31faa0edf7025fbabf0
    source_path: plugins/hooks.md
    workflow: 16
---

Hook Plugin adalah titik ekstensi dalam proses untuk Plugin OpenClaw. Gunakan hook ini
ketika sebuah Plugin perlu memeriksa atau mengubah run agen, panggilan tool, alur pesan,
siklus hidup sesi, perutean subagen, instalasi, atau startup Gateway.

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

Handler hook berjalan berurutan dalam urutan `priority` menurun. Hook dengan prioritas
yang sama mempertahankan urutan pendaftaran.

`api.on(name, handler, opts?)` menerima:

- `priority` — urutan handler (nilai lebih tinggi berjalan lebih dulu).
- `timeoutMs` — batas waktu opsional per hook. Jika diatur, runner hook membatalkan
  handler tersebut setelah batas waktu terlampaui dan melanjutkan ke handler berikutnya, alih-alih
  membiarkan setup lambat atau pekerjaan recall menghabiskan timeout model yang dikonfigurasi
  oleh pemanggil. Abaikan untuk menggunakan timeout observasi/keputusan default yang diterapkan
  runner hook secara umum.

Setiap hook menerima `event.context.pluginConfig`, konfigurasi yang sudah di-resolve untuk
Plugin yang mendaftarkan handler tersebut. Gunakan ini untuk keputusan hook yang memerlukan
opsi Plugin saat ini; OpenClaw menyuntikkannya per handler tanpa memutasi objek event
bersama yang dilihat oleh Plugin lain.

## Katalog hook

Hook dikelompokkan berdasarkan permukaan yang diperluas. Nama dalam **tebal** menerima
hasil keputusan (blokir, batalkan, timpa, atau minta persetujuan); yang lainnya hanya
observasi.

**Giliran agen**

- `before_model_resolve` — timpa penyedia atau model sebelum pesan sesi dimuat
- `agent_turn_prepare` — konsumsi injeksi giliran Plugin yang diantrekan dan tambahkan konteks giliran yang sama sebelum hook prompt
- `before_prompt_build` — tambahkan konteks dinamis atau teks prompt sistem sebelum panggilan model
- `before_agent_start` — fase gabungan khusus kompatibilitas; utamakan dua hook di atas
- **`before_agent_reply`** — pintas giliran model dengan balasan sintetis atau diam
- **`before_agent_finalize`** — periksa jawaban akhir alami dan minta satu pass model lagi
- `agent_end` — amati pesan akhir, status berhasil, dan durasi run
- `heartbeat_prompt_contribution` — tambahkan konteks khusus Heartbeat untuk pemantau latar belakang dan Plugin siklus hidup

**Observasi percakapan**

- `model_call_started` / `model_call_ended` — amati metadata panggilan penyedia/model yang disanitasi, timing, hasil, dan hash ID permintaan terbatas tanpa konten prompt atau respons
- `llm_input` — amati input penyedia (prompt sistem, prompt, riwayat)
- `llm_output` — amati output penyedia

**Tool**

- **`before_tool_call`** — tulis ulang parameter tool, blokir eksekusi, atau minta persetujuan
- `after_tool_call` — amati hasil tool, error, dan durasi
- **`tool_result_persist`** — tulis ulang pesan asisten yang dihasilkan dari hasil tool
- **`before_message_write`** — periksa atau blokir penulisan pesan yang sedang berlangsung (jarang)

**Pesan dan pengiriman**

- **`inbound_claim`** — klaim pesan masuk sebelum perutean agen (balasan sintetis)
- `message_received` — amati konten masuk, pengirim, thread, dan metadata
- **`message_sending`** — tulis ulang konten keluar atau batalkan pengiriman
- `message_sent` — amati keberhasilan atau kegagalan pengiriman keluar
- **`before_dispatch`** — periksa atau tulis ulang dispatch keluar sebelum handoff channel
- **`reply_dispatch`** — berpartisipasi dalam pipeline dispatch balasan akhir

**Sesi dan Compaction**

- `session_start` / `session_end` — lacak batas siklus hidup sesi
- `before_compaction` / `after_compaction` — amati atau anotasi siklus Compaction
- `before_reset` — amati peristiwa reset sesi (`/reset`, reset programatik)

**Subagen**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — koordinasikan perutean subagen dan pengiriman penyelesaian

**Siklus hidup**

- `gateway_start` / `gateway_stop` — mulai atau hentikan layanan milik Plugin bersama Gateway
- `cron_changed` — amati perubahan siklus hidup Cron milik gateway (ditambahkan, diperbarui, dihapus, dimulai, selesai, dijadwalkan)
- **`before_install`** — periksa pemindaian instalasi skill atau Plugin dan secara opsional blokir

## Kebijakan panggilan tool

`before_tool_call` menerima:

- `event.toolName`
- `event.params`
- `event.runId` opsional
- `event.toolCallId` opsional
- kolom konteks seperti `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (diatur pada run yang digerakkan Cron), dan diagnostik `ctx.trace`

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

- `block: true` bersifat terminal dan melewati handler dengan prioritas lebih rendah.
- `block: false` diperlakukan sebagai tanpa keputusan.
- `params` menulis ulang parameter tool untuk eksekusi.
- `requireApproval` menjeda run agen dan meminta pengguna melalui persetujuan Plugin.
  Perintah `/approve` dapat menyetujui persetujuan exec dan Plugin.
- `block: true` dengan prioritas lebih rendah masih dapat memblokir setelah hook dengan prioritas lebih tinggi
  meminta persetujuan.
- `onResolution` menerima keputusan persetujuan yang telah di-resolve — `allow-once`,
  `allow-always`, `deny`, `timeout`, atau `cancelled`.

Plugin bawaan yang memerlukan kebijakan tingkat host dapat mendaftarkan kebijakan tool tepercaya
dengan `api.registerTrustedToolPolicy(...)`. Kebijakan ini berjalan sebelum hook
`before_tool_call` biasa dan sebelum keputusan Plugin eksternal. Gunakan hanya
untuk gate yang dipercaya host seperti kebijakan workspace, penegakan anggaran, atau
keamanan workflow yang dicadangkan. Plugin eksternal harus menggunakan hook `before_tool_call`
normal.

### Persistensi hasil tool

Hasil tool dapat menyertakan `details` terstruktur untuk rendering UI, diagnostik,
perutean media, atau metadata milik Plugin. Perlakukan `details` sebagai metadata runtime,
bukan konten prompt:

- OpenClaw menghapus `toolResult.details` sebelum replay penyedia dan input Compaction
  sehingga metadata tidak menjadi konteks model.
- Entri sesi yang dipersisten hanya menyimpan `details` terbatas. Detail yang terlalu besar
  diganti dengan ringkasan ringkas dan `persistedDetailsTruncated: true`.
- `tool_result_persist` dan `before_message_write` berjalan sebelum batas persistensi
  akhir. Hook tetap harus menjaga `details` yang dikembalikan tetap kecil dan menghindari
  menempatkan teks yang relevan dengan prompt hanya di `details`; letakkan output tool yang terlihat
  oleh model di `content`.

## Hook prompt dan model

Gunakan hook khusus fase untuk Plugin baru:

- `before_model_resolve`: hanya menerima prompt saat ini dan metadata lampiran.
  Kembalikan `providerOverride` atau `modelOverride`.
- `agent_turn_prepare`: menerima prompt saat ini, pesan sesi yang disiapkan,
  dan injeksi antrean sekali saja yang dikuras untuk sesi ini. Kembalikan
  `prependContext` atau `appendContext`.
- `before_prompt_build`: menerima prompt saat ini dan pesan sesi.
  Kembalikan `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, atau `appendSystemContext`.
- `heartbeat_prompt_contribution`: berjalan hanya untuk giliran Heartbeat dan mengembalikan
  `prependContext` atau `appendContext`. Ini ditujukan untuk pemantau latar belakang
  yang perlu merangkum status saat ini tanpa mengubah giliran yang dimulai pengguna.

`before_agent_start` tetap ada untuk kompatibilitas. Utamakan hook eksplisit di atas
agar Plugin Anda tidak bergantung pada fase gabungan legacy.

`before_agent_start` dan `agent_end` menyertakan `event.runId` ketika OpenClaw dapat
mengidentifikasi run aktif. Nilai yang sama juga tersedia pada `ctx.runId`.
Run yang digerakkan Cron juga mengekspos `ctx.jobId` (ID job Cron asal) sehingga
hook Plugin dapat membatasi cakupan metrik, efek samping, atau status ke job terjadwal
tertentu.

Untuk run yang berasal dari channel, `ctx.messageProvider` adalah permukaan penyedia seperti
`discord` atau `telegram`, sementara `ctx.channelId` adalah pengidentifikasi target percakapan
ketika OpenClaw dapat menurunkannya dari kunci sesi atau metadata pengiriman.

`agent_end` adalah hook observasi dan berjalan fire-and-forget setelah giliran. Runner
hook menerapkan timeout 30 detik sehingga Plugin atau endpoint embedding yang macet
tidak dapat membuat promise hook tetap pending selamanya. Timeout dicatat di log dan
OpenClaw melanjutkan; ini tidak membatalkan pekerjaan jaringan milik Plugin kecuali
Plugin juga menggunakan sinyal abort miliknya sendiri.

Gunakan `model_call_started` dan `model_call_ended` untuk telemetri panggilan penyedia
yang tidak boleh menerima prompt mentah, riwayat, respons, header, body permintaan,
atau ID permintaan penyedia. Hook ini menyertakan metadata stabil seperti
`runId`, `callId`, `provider`, `model`, `api`/`transport` opsional, terminal
`durationMs`/`outcome`, dan `upstreamRequestIdHash` ketika OpenClaw dapat menurunkan
hash ID permintaan penyedia yang terbatas.

`before_agent_finalize` berjalan hanya ketika harness akan menerima jawaban akhir asisten
alami. Ini bukan jalur pembatalan `/stop` dan tidak berjalan ketika pengguna membatalkan
giliran. Kembalikan `{ action: "revise", reason }` untuk meminta harness melakukan
satu pass model lagi sebelum finalisasi, `{ action:
"finalize", reason? }` untuk memaksa finalisasi, atau abaikan hasil untuk melanjutkan.
Hook `Stop` native Codex direlay ke hook ini sebagai keputusan OpenClaw
`before_agent_finalize`.

Plugin non-bawaan yang memerlukan `llm_input`, `llm_output`,
`before_agent_finalize`, atau `agent_end` harus mengatur:

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

Hook yang memutasi prompt dan injeksi giliran berikutnya yang tahan lama dapat dinonaktifkan per Plugin
dengan `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Ekstensi sesi dan injeksi giliran berikutnya

Plugin workflow dapat mempersisten status sesi kecil yang kompatibel dengan JSON dengan
`api.registerSessionExtension(...)` dan memperbaruinya melalui metode Gateway
`sessions.pluginPatch`. Baris sesi memproyeksikan status ekstensi terdaftar melalui
`pluginExtensions`, sehingga Control UI dan klien lain dapat merender
status milik Plugin tanpa mempelajari internal Plugin.

Gunakan `api.enqueueNextTurnInjection(...)` ketika sebuah Plugin memerlukan konteks tahan lama agar
mencapai giliran model berikutnya tepat satu kali. OpenClaw menguras injeksi yang diantrekan sebelum
hook prompt, membuang injeksi kedaluwarsa, dan melakukan deduplikasi berdasarkan `idempotencyKey`
per Plugin. Ini adalah seam yang tepat untuk resume persetujuan, ringkasan kebijakan,
delta pemantau latar belakang, dan kelanjutan perintah yang harus terlihat oleh
model pada giliran berikutnya tetapi tidak boleh menjadi teks prompt sistem permanen.

Semantik pembersihan adalah bagian dari kontrak. Pembersihan ekstensi sesi dan
callback pembersihan siklus hidup runtime menerima `reset`, `delete`, `disable`, atau
`restart`. Host menghapus status ekstensi sesi persisten milik Plugin pemilik
dan injeksi giliran berikutnya yang tertunda untuk reset/delete/disable; restart mempertahankan
status sesi tahan lama sementara callback pembersihan memungkinkan Plugin melepas job scheduler,
konteks run, dan sumber daya out-of-band lainnya untuk generasi runtime lama.

## Hook pesan

Gunakan hook pesan untuk perutean tingkat channel dan kebijakan pengiriman:

- `message_received`: amati konten masuk, pengirim, `threadId`, `messageId`,
  `senderId`, korelasi run/sesi opsional, dan metadata.
- `message_sending`: tulis ulang `content` atau kembalikan `{ cancel: true }`.
- `message_sent`: amati keberhasilan atau kegagalan akhir.

Untuk balasan TTS khusus audio, `content` dapat berisi transkrip ucapan tersembunyi
meskipun payload kanal tidak memiliki teks/caption yang terlihat. Menulis ulang
`content` tersebut hanya memperbarui transkrip yang terlihat oleh hook; ini tidak dirender sebagai
caption media.

Konteks hook pesan mengekspos kolom korelasi stabil saat tersedia:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, dan `ctx.callDepth`. Prioritaskan
kolom kelas satu ini sebelum membaca metadata lama.

Prioritaskan kolom `threadId` dan `replyToId` bertipe sebelum menggunakan metadata
khusus kanal.

Aturan keputusan:

- `message_sending` dengan `cancel: true` bersifat terminal.
- `message_sending` dengan `cancel: false` diperlakukan sebagai tanpa keputusan.
- `content` yang ditulis ulang berlanjut ke hook berprioritas lebih rendah kecuali hook berikutnya
  membatalkan pengiriman.

## Hook instalasi

`before_install` berjalan setelah pemindaian bawaan untuk instalasi skill dan Plugin.
Kembalikan temuan tambahan atau `{ block: true, blockReason }` untuk menghentikan
instalasi.

`block: true` bersifat terminal. `block: false` diperlakukan sebagai tanpa keputusan.

## Siklus hidup Gateway

Gunakan `gateway_start` untuk layanan Plugin yang memerlukan status milik Gateway. Konteks
mengekspos `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk
inspeksi dan pembaruan Cron. Gunakan `gateway_stop` untuk membersihkan resource
yang berjalan lama.

Jangan bergantung pada hook internal `gateway:startup` untuk layanan runtime
milik Plugin.

`cron_changed` dipicu untuk peristiwa siklus hidup Cron milik Gateway dengan payload
peristiwa bertipe yang mencakup alasan `added`, `updated`, `removed`, `started`, `finished`,
dan `scheduled`. Peristiwa tersebut membawa snapshot `PluginHookGatewayCronJob`
(termasuk `state.nextRunAtMs`, `state.lastRunStatus`, dan
`state.lastError` saat ada) plus `PluginHookGatewayCronDeliveryStatus`
berupa `not-requested` | `delivered` | `not-delivered` | `unknown`. Peristiwa
yang dihapus tetap membawa snapshot job yang dihapus agar penjadwal eksternal dapat
merekonsiliasi status. Gunakan `ctx.getCron?.()` dan `ctx.config` dari konteks
runtime saat menyinkronkan penjadwal wake eksternal, dan pertahankan OpenClaw sebagai
sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

## Penghentian mendatang

Beberapa permukaan yang berdekatan dengan hook sudah deprecated tetapi masih didukung. Migrasikan
sebelum rilis mayor berikutnya:

- **Envelope kanal plaintext** di handler `inbound_claim` dan `message_received`.
  Baca `BodyForAgent` dan blok konteks pengguna terstruktur
  alih-alih mengurai teks envelope datar. Lihat
  [Envelope kanal plaintext → BodyForAgent](/id/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** tetap ada untuk kompatibilitas. Plugin baru sebaiknya menggunakan
  `before_model_resolve` dan `before_prompt_build` alih-alih fase gabungan.
- **`onResolution` di `before_tool_call`** kini menggunakan union bertipe
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) alih-alih `string` bebas.

Untuk daftar lengkap — pendaftaran kapabilitas memori, profil thinking provider,
provider auth eksternal, tipe discovery provider, accessor runtime task,
dan penggantian nama `command-auth` → `command-status` — lihat
[Migrasi Plugin SDK → Penghentian aktif](/id/plugins/sdk-migration#active-deprecations).

## Terkait

- [Migrasi Plugin SDK](/id/plugins/sdk-migration) — penghentian aktif dan lini masa penghapusan
- [Membangun Plugin](/id/plugins/building-plugins)
- [Ringkasan Plugin SDK](/id/plugins/sdk-overview)
- [Titik masuk Plugin](/id/plugins/sdk-entrypoints)
- [Hook internal](/id/automation/hooks)
- [Internal arsitektur Plugin](/id/plugins/architecture-internals)
