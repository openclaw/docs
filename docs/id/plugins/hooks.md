---
read_when:
    - Anda sedang membangun Plugin yang memerlukan before_tool_call, before_agent_reply, hook pesan, atau hook siklus hidup
    - Anda perlu memblokir, menulis ulang, atau mewajibkan persetujuan untuk pemanggilan alat dari Plugin.
    - Anda sedang memilih antara kait internal dan kait Plugin
summary: 'Kait Plugin: mencegat peristiwa siklus hidup agen, alat, pesan, sesi, dan Gateway'
title: Kait Plugin
x-i18n:
    generated_at: "2026-05-06T09:21:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a149e1b343ea2d3f55855c2d02f4a9519337f0450c8a1428d52cd77ab4046a
    source_path: plugins/hooks.md
    workflow: 16
---

Hook Plugin adalah titik ekstensi dalam proses untuk plugin OpenClaw. Gunakan hook ini
saat plugin perlu memeriksa atau mengubah proses agent, pemanggilan alat, alur pesan,
siklus hidup sesi, perutean subagent, instalasi, atau startup Gateway.

Gunakan [hook internal](/id/automation/hooks) sebagai gantinya saat Anda menginginkan skrip
`HOOK.md` kecil yang dipasang operator untuk peristiwa perintah dan Gateway seperti
`/new`, `/reset`, `/stop`, `agent:bootstrap`, atau `gateway:startup`.

## Mulai cepat

Daftarkan hook plugin bertipe dengan `api.on(...)` dari entri plugin Anda:

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

Handler hook berjalan berurutan dalam `priority` menurun. Hook dengan prioritas
yang sama mempertahankan urutan pendaftaran.

`api.on(name, handler, opts?)` menerima:

- `priority` - urutan handler (nilai lebih tinggi berjalan lebih dulu).
- `timeoutMs` - anggaran opsional per hook. Saat diatur, runner hook membatalkan
  handler tersebut setelah anggaran berlalu dan melanjutkan ke hook berikutnya,
  alih-alih membiarkan setup lambat atau pekerjaan recall menghabiskan timeout
  model yang dikonfigurasi pemanggil. Hilangkan ini untuk menggunakan timeout
  observasi/keputusan default yang diterapkan runner hook secara generik.

Operator juga dapat mengatur anggaran hook tanpa menambal kode plugin:

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
`api.on(..., { timeoutMs })` yang ditulis plugin. Setiap nilai yang dikonfigurasi
harus berupa bilangan bulat positif tidak lebih dari 600000 milidetik. Utamakan
override per hook untuk hook yang diketahui lambat agar satu plugin tidak mendapat
anggaran lebih panjang di semua tempat.

Setiap hook menerima `event.context.pluginConfig`, konfigurasi terselesaikan untuk
plugin yang mendaftarkan handler tersebut. Gunakan ini untuk keputusan hook yang
memerlukan opsi plugin saat ini; OpenClaw menyuntikkannya per handler tanpa
memutasi objek peristiwa bersama yang dilihat plugin lain.

## Katalog hook

Hook dikelompokkan berdasarkan permukaan yang diperluasnya. Nama dalam **tebal**
menerima hasil keputusan (blokir, batalkan, override, atau wajibkan persetujuan);
semua yang lain hanya observasi.

**Giliran agent**

- `before_model_resolve` - override provider atau model sebelum pesan sesi dimuat
- `agent_turn_prepare` - konsumsi injeksi giliran plugin yang diantrekan dan tambahkan konteks giliran yang sama sebelum hook prompt
- `before_prompt_build` - tambahkan konteks dinamis atau teks system-prompt sebelum pemanggilan model
- `before_agent_start` - fase gabungan hanya kompatibilitas; utamakan dua hook di atas
- **`before_agent_reply`** - potong giliran model dengan balasan sintetis atau diam
- **`before_agent_finalize`** - periksa jawaban akhir alami dan minta satu lintasan model lagi
- `agent_end` - amati pesan akhir, status sukses, dan durasi proses
- `heartbeat_prompt_contribution` - tambahkan konteks khusus heartbeat untuk monitor latar belakang dan plugin siklus hidup

**Observasi percakapan**

- `model_call_started` / `model_call_ended` - amati metadata pemanggilan provider/model yang telah disanitasi, waktu, hasil, dan hash request-id terbatas tanpa konten prompt atau respons
- `llm_input` - amati input provider (system prompt, prompt, riwayat)
- `llm_output` - amati output provider

**Alat**

- **`before_tool_call`** - tulis ulang parameter alat, blokir eksekusi, atau wajibkan persetujuan
- `after_tool_call` - amati hasil alat, error, dan durasi
- **`tool_result_persist`** - tulis ulang pesan asisten yang dihasilkan dari hasil alat
- **`before_message_write`** - periksa atau blokir penulisan pesan yang sedang berlangsung (jarang)

**Pesan dan pengiriman**

- **`inbound_claim`** - klaim pesan masuk sebelum perutean agent (balasan sintetis)
- `message_received` - amati konten masuk, pengirim, thread, dan metadata
- **`message_sending`** - tulis ulang konten keluar atau batalkan pengiriman
- `message_sent` - amati keberhasilan atau kegagalan pengiriman keluar
- **`before_dispatch`** - periksa atau tulis ulang dispatch keluar sebelum handoff channel
- **`reply_dispatch`** - ikut serta dalam pipeline dispatch balasan akhir

**Sesi dan Compaction**

- `session_start` / `session_end` - lacak batas siklus hidup sesi
- `before_compaction` / `after_compaction` - amati atau anotasi siklus compaction
- `before_reset` - amati peristiwa reset sesi (`/reset`, reset terprogram)

**Subagent**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - koordinasikan perutean subagent dan pengiriman penyelesaian

**Siklus hidup**

- `gateway_start` / `gateway_stop` - mulai atau hentikan layanan milik plugin bersama Gateway
- `cron_changed` - amati perubahan siklus hidup cron milik gateway (ditambahkan, diperbarui, dihapus, dimulai, selesai, dijadwalkan)
- **`before_install`** - periksa pemindaian instalasi skill atau plugin dan opsional blokir

## Kebijakan pemanggilan alat

`before_tool_call` menerima:

- `event.toolName`
- `event.params`
- `event.runId` opsional
- `event.toolCallId` opsional
- field konteks seperti `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (diatur pada proses yang digerakkan cron), dan `ctx.trace` diagnostik

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
- `requireApproval` menjeda proses agent dan meminta pengguna melalui persetujuan
  plugin. Perintah `/approve` dapat menyetujui persetujuan exec dan plugin.
- `block: true` berprioritas lebih rendah masih dapat memblokir setelah hook
  berprioritas lebih tinggi meminta persetujuan.
- `onResolution` menerima keputusan persetujuan terselesaikan - `allow-once`,
  `allow-always`, `deny`, `timeout`, atau `cancelled`.

Plugin bawaan yang memerlukan kebijakan tingkat host dapat mendaftarkan kebijakan
alat tepercaya dengan `api.registerTrustedToolPolicy(...)`. Ini berjalan sebelum
hook `before_tool_call` biasa dan sebelum keputusan plugin eksternal. Gunakan hanya
untuk gate tepercaya host seperti kebijakan workspace, penegakan anggaran, atau
keamanan workflow yang dicadangkan. Plugin eksternal sebaiknya menggunakan hook
`before_tool_call` normal.

### Persistensi hasil alat

Hasil alat dapat menyertakan `details` terstruktur untuk rendering UI, diagnostik,
perutean media, atau metadata milik plugin. Perlakukan `details` sebagai metadata
runtime, bukan konten prompt:

- OpenClaw menghapus `toolResult.details` sebelum replay provider dan input
  compaction sehingga metadata tidak menjadi konteks model.
- Entri sesi yang dipersistensikan hanya menyimpan `details` terbatas. Detail yang
  terlalu besar diganti dengan ringkasan ringkas dan `persistedDetailsTruncated: true`.
- `tool_result_persist` dan `before_message_write` berjalan sebelum batas
  persistensi akhir. Hook tetap harus menjaga `details` yang dikembalikan tetap
  kecil dan menghindari menempatkan teks relevan prompt hanya di `details`; letakkan
  output alat yang terlihat model di `content`.

## Hook prompt dan model

Gunakan hook khusus fase untuk plugin baru:

- `before_model_resolve`: hanya menerima prompt saat ini dan metadata lampiran.
  Kembalikan `providerOverride` atau `modelOverride`.
- `agent_turn_prepare`: menerima prompt saat ini, pesan sesi yang disiapkan,
  dan injeksi antrean tepat-sekali apa pun yang dikuras untuk sesi ini. Kembalikan
  `prependContext` atau `appendContext`.
- `before_prompt_build`: menerima prompt saat ini dan pesan sesi.
  Kembalikan `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, atau `appendSystemContext`.
- `heartbeat_prompt_contribution`: berjalan hanya untuk giliran heartbeat dan
  mengembalikan `prependContext` atau `appendContext`. Ini ditujukan untuk monitor
  latar belakang yang perlu meringkas status saat ini tanpa mengubah giliran yang
  dimulai pengguna.

`before_agent_start` tetap ada untuk kompatibilitas. Utamakan hook eksplisit di atas
agar plugin Anda tidak bergantung pada fase gabungan lama.

`before_agent_start` dan `agent_end` menyertakan `event.runId` saat OpenClaw dapat
mengidentifikasi proses aktif. Nilai yang sama juga tersedia di `ctx.runId`.
Proses yang digerakkan cron juga mengekspos `ctx.jobId` (id cron job asal) sehingga
hook plugin dapat membatasi metrik, efek samping, atau status ke job terjadwal tertentu.

Untuk proses yang berasal dari channel, `ctx.messageProvider` adalah permukaan
provider seperti `discord` atau `telegram`, sementara `ctx.channelId` adalah
pengidentifikasi target percakapan saat OpenClaw dapat menurunkannya dari kunci sesi
atau metadata pengiriman.

`agent_end` adalah hook observasi dan berjalan fire-and-forget setelah giliran.
Runner hook menerapkan timeout 30 detik sehingga plugin atau endpoint embedding yang
macet tidak dapat membiarkan promise hook tertunda selamanya. Timeout dicatat dan
OpenClaw melanjutkan; ini tidak membatalkan pekerjaan jaringan milik plugin kecuali
plugin juga menggunakan sinyal abort-nya sendiri.

Gunakan `model_call_started` dan `model_call_ended` untuk telemetri pemanggilan
provider yang tidak boleh menerima prompt mentah, riwayat, respons, header, body
request, atau ID request provider. Hook ini menyertakan metadata stabil seperti
`runId`, `callId`, `provider`, `model`, `api`/`transport` opsional,
`durationMs`/`outcome` terminal, dan `upstreamRequestIdHash` saat OpenClaw dapat
menurunkan hash request-id provider yang terbatas.

`before_agent_finalize` berjalan hanya saat harness akan menerima jawaban asisten
akhir yang alami. Ini bukan jalur pembatalan `/stop` dan tidak berjalan saat pengguna
membatalkan giliran. Kembalikan `{ action: "revise", reason }` untuk meminta harness
melakukan satu lintasan model lagi sebelum finalisasi, `{ action:
"finalize", reason? }` untuk memaksa finalisasi, atau hilangkan hasil untuk
melanjutkan. Hook native Codex `Stop` diteruskan ke hook ini sebagai keputusan
`before_agent_finalize` OpenClaw.

Saat mengembalikan `action: "revise"`, plugin dapat menyertakan metadata `retry`
untuk membuat lintasan model tambahan terbatas dan aman untuk replay:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` ditambahkan ke alasan revisi yang dikirim ke harness.
`idempotencyKey` memungkinkan host menghitung retry untuk permintaan plugin yang
sama di seluruh keputusan finalisasi yang ekuivalen, dan `maxAttempts` membatasi
berapa banyak lintasan tambahan yang akan diizinkan host sebelum melanjutkan dengan
jawaban akhir alami.

Plugin non-bawaan yang memerlukan `llm_input`, `llm_output`,
`before_agent_finalize`, atau `agent_end` harus menetapkan:

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

Hook yang memutasi prompt dan injeksi giliran berikutnya yang tahan lama dapat
dinonaktifkan per plugin dengan `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Ekstensi sesi dan injeksi giliran berikutnya

Plugin alur kerja dapat menyimpan status sesi kecil yang kompatibel dengan JSON menggunakan
`api.registerSessionExtension(...)` dan memperbaruinya melalui metode Gateway
`sessions.pluginPatch`. Baris sesi memproyeksikan status ekstensi terdaftar
melalui `pluginExtensions`, sehingga Control UI dan klien lain dapat merender
status milik Plugin tanpa perlu mengetahui internal Plugin.

Gunakan `api.enqueueNextTurnInjection(...)` ketika sebuah Plugin memerlukan konteks tahan lama untuk
mencapai giliran model berikutnya tepat satu kali. OpenClaw mengosongkan injeksi yang diantrekan sebelum
hook prompt, membuang injeksi yang kedaluwarsa, dan melakukan deduplikasi berdasarkan `idempotencyKey`
per Plugin. Ini adalah seam yang tepat untuk kelanjutan persetujuan, ringkasan kebijakan,
delta pemantau latar belakang, dan kelanjutan perintah yang harus terlihat oleh
model pada giliran berikutnya tetapi tidak boleh menjadi teks prompt sistem permanen.

Semantik pembersihan adalah bagian dari kontrak. Pembersihan ekstensi sesi dan
callback pembersihan siklus hidup runtime menerima `reset`, `delete`, `disable`, atau
`restart`. Host menghapus status ekstensi sesi persisten milik Plugin pemilik
dan injeksi giliran berikutnya yang tertunda untuk reset/delete/disable; restart mempertahankan
status sesi tahan lama sementara callback pembersihan memungkinkan Plugin melepas job penjadwal,
konteks run, dan sumber daya luar-band lainnya untuk generasi runtime lama.

## Hook pesan

Gunakan hook pesan untuk perutean tingkat kanal dan kebijakan pengiriman:

- `message_received`: mengamati konten masuk, pengirim, `threadId`, `messageId`,
  `senderId`, korelasi run/sesi opsional, dan metadata.
- `message_sending`: menulis ulang `content` atau mengembalikan `{ cancel: true }`.
- `message_sent`: mengamati keberhasilan atau kegagalan akhir.

Untuk balasan TTS audio-saja, `content` dapat berisi transkrip lisan tersembunyi
meskipun payload kanal tidak memiliki teks/caption yang terlihat. Menulis ulang
`content` hanya memperbarui transkrip yang terlihat oleh hook; itu tidak dirender sebagai
caption media.

Konteks hook pesan mengekspos bidang korelasi stabil bila tersedia:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, dan `ctx.callDepth`. Utamakan
bidang kelas satu ini sebelum membaca metadata lama.

Utamakan bidang `threadId` dan `replyToId` bertipe sebelum menggunakan metadata
khusus kanal.

Aturan keputusan:

- `message_sending` dengan `cancel: true` bersifat terminal.
- `message_sending` dengan `cancel: false` diperlakukan sebagai tanpa keputusan.
- `content` yang ditulis ulang berlanjut ke hook berprioritas lebih rendah kecuali hook berikutnya
  membatalkan pengiriman.

## Hook instalasi

`before_install` berjalan setelah pemindaian bawaan untuk instalasi Skills dan Plugin.
Kembalikan temuan tambahan atau `{ block: true, blockReason }` untuk menghentikan
instalasi.

`block: true` bersifat terminal. `block: false` diperlakukan sebagai tanpa keputusan.

## Siklus hidup Gateway

Gunakan `gateway_start` untuk layanan Plugin yang memerlukan status milik Gateway. Konteks
mengekspos `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk
inspeksi dan pembaruan cron. Gunakan `gateway_stop` untuk membersihkan sumber daya
yang berjalan lama.

Jangan mengandalkan hook internal `gateway:startup` untuk layanan runtime
milik Plugin.

`cron_changed` dipicu untuk peristiwa siklus hidup cron milik Gateway dengan payload
peristiwa bertipe yang mencakup alasan `added`, `updated`, `removed`, `started`, `finished`,
dan `scheduled`. Peristiwa membawa snapshot `PluginHookGatewayCronJob`
(termasuk `state.nextRunAtMs`, `state.lastRunStatus`, dan
`state.lastError` bila ada) plus `PluginHookGatewayCronDeliveryStatus`
bernilai `not-requested` | `delivered` | `not-delivered` | `unknown`. Peristiwa yang dihapus
tetap membawa snapshot job yang dihapus sehingga penjadwal eksternal dapat
merekonsiliasi status. Gunakan `ctx.getCron?.()` dan `ctx.config` dari konteks
runtime saat menyinkronkan penjadwal bangun eksternal, dan pertahankan OpenClaw sebagai
sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

## Penghentian mendatang

Beberapa permukaan yang berdekatan dengan hook sudah tidak dianjurkan tetapi masih didukung. Migrasikan
sebelum rilis mayor berikutnya:

- **Amplop kanal teks biasa** di handler `inbound_claim` dan `message_received`.
  Baca `BodyForAgent` dan blok konteks pengguna terstruktur
  alih-alih mengurai teks amplop datar. Lihat
  [Amplop kanal teks biasa → BodyForAgent](/id/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** tetap tersedia untuk kompatibilitas. Plugin baru harus menggunakan
  `before_model_resolve` dan `before_prompt_build` alih-alih fase gabungan.
- **`onResolution` di `before_tool_call`** kini menggunakan union bertipe
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) alih-alih `string` bentuk bebas.

Untuk daftar lengkap - pendaftaran kapabilitas memori, profil berpikir provider,
provider auth eksternal, tipe penemuan provider, accessor runtime tugas,
dan penggantian nama `command-auth` → `command-status` - lihat
[Migrasi Plugin SDK → Penghentian aktif](/id/plugins/sdk-migration#active-deprecations).

## Terkait

- [Migrasi Plugin SDK](/id/plugins/sdk-migration) - penghentian aktif dan linimasa penghapusan
- [Membangun Plugin](/id/plugins/building-plugins)
- [Ringkasan Plugin SDK](/id/plugins/sdk-overview)
- [Titik masuk Plugin](/id/plugins/sdk-entrypoints)
- [Hook internal](/id/automation/hooks)
- [Internal arsitektur Plugin](/id/plugins/architecture-internals)
