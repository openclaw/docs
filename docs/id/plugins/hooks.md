---
read_when:
    - Anda sedang membangun Plugin yang memerlukan before_tool_call, before_agent_reply, hook pesan, atau hook siklus hidup
    - Anda perlu memblokir, menulis ulang, atau mewajibkan persetujuan untuk panggilan alat dari Plugin
    - Anda sedang memilih antara hook internal dan hook Plugin
summary: 'Hook Plugin: mencegat peristiwa siklus hidup agen, alat, pesan, sesi, dan Gateway'
title: Kait Plugin
x-i18n:
    generated_at: "2026-05-03T21:35:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c4ed060f1b89917e1f2f46d2da9448cd562edbcd6ce03bc9b1a83da3ed9a591
    source_path: plugins/hooks.md
    workflow: 16
---

Hook Plugin adalah titik ekstensi dalam proses untuk Plugin OpenClaw. Gunakan saat Plugin perlu memeriksa atau mengubah eksekusi agen, pemanggilan alat, alur pesan, siklus hidup sesi, perutean subagen, instalasi, atau startup Gateway.

Gunakan [hook internal](/id/automation/hooks) sebagai gantinya saat Anda menginginkan skrip `HOOK.md` kecil yang dipasang operator untuk perintah dan peristiwa Gateway seperti `/new`, `/reset`, `/stop`, `agent:bootstrap`, atau `gateway:startup`.

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

Handler hook berjalan berurutan berdasarkan `priority` menurun. Hook dengan prioritas yang sama mempertahankan urutan pendaftaran.

`api.on(name, handler, opts?)` menerima:

- `priority` — pengurutan handler (nilai lebih tinggi berjalan lebih dulu).
- `timeoutMs` — anggaran opsional per hook. Saat diatur, runner hook membatalkan handler tersebut setelah anggaran habis dan melanjutkan ke handler berikutnya, alih-alih membiarkan penyiapan lambat atau pekerjaan pengingatan memakai timeout model yang dikonfigurasi pemanggil. Hilangkan ini untuk menggunakan timeout observasi/keputusan default yang diterapkan runner hook secara umum.

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

`hooks.timeouts.<hookName>` menimpa `hooks.timeoutMs`, yang menimpa nilai `api.on(..., { timeoutMs })` yang ditulis Plugin. Setiap nilai yang dikonfigurasi harus berupa bilangan bulat positif tidak lebih dari 600000 milidetik. Pilih override per hook untuk hook yang diketahui lambat agar satu Plugin tidak mendapat anggaran lebih panjang di semua tempat.

Setiap hook menerima `event.context.pluginConfig`, konfigurasi terselesaikan untuk Plugin yang mendaftarkan handler tersebut. Gunakan ini untuk keputusan hook yang memerlukan opsi Plugin saat ini; OpenClaw menyuntikkannya per handler tanpa mengubah objek peristiwa bersama yang dilihat Plugin lain.

## Katalog hook

Hook dikelompokkan berdasarkan permukaan yang diperluas. Nama dalam **tebal** menerima hasil keputusan (blokir, batalkan, override, atau wajibkan persetujuan); yang lain hanya observasi.

**Giliran agen**

- `before_model_resolve` — override penyedia atau model sebelum pesan sesi dimuat
- `agent_turn_prepare` — gunakan injeksi giliran Plugin yang mengantre dan tambahkan konteks giliran yang sama sebelum hook prompt
- `before_prompt_build` — tambahkan konteks dinamis atau teks prompt sistem sebelum pemanggilan model
- `before_agent_start` — fase gabungan hanya untuk kompatibilitas; pilih dua hook di atas
- **`before_agent_reply`** — pintaskan giliran model dengan balasan sintetis atau diam
- **`before_agent_finalize`** — periksa jawaban akhir alami dan minta satu lintasan model lagi
- `agent_end` — amati pesan akhir, status keberhasilan, dan durasi eksekusi
- `heartbeat_prompt_contribution` — tambahkan konteks khusus Heartbeat untuk monitor latar belakang dan Plugin siklus hidup

**Observasi percakapan**

- `model_call_started` / `model_call_ended` — amati metadata pemanggilan penyedia/model yang telah disanitasi, waktu, hasil, dan hash id permintaan terbatas tanpa konten prompt atau respons
- `llm_input` — amati input penyedia (prompt sistem, prompt, riwayat)
- `llm_output` — amati output penyedia

**Alat**

- **`before_tool_call`** — tulis ulang parameter alat, blokir eksekusi, atau wajibkan persetujuan
- `after_tool_call` — amati hasil alat, kesalahan, dan durasi
- **`tool_result_persist`** — tulis ulang pesan asisten yang dihasilkan dari hasil alat
- **`before_message_write`** — periksa atau blokir penulisan pesan yang sedang berlangsung (jarang)

**Pesan dan pengiriman**

- **`inbound_claim`** — klaim pesan masuk sebelum perutean agen (balasan sintetis)
- `message_received` — amati konten masuk, pengirim, utas, dan metadata
- **`message_sending`** — tulis ulang konten keluar atau batalkan pengiriman
- `message_sent` — amati keberhasilan atau kegagalan pengiriman keluar
- **`before_dispatch`** — periksa atau tulis ulang dispatch keluar sebelum serah terima kanal
- **`reply_dispatch`** — berpartisipasi dalam pipeline dispatch balasan akhir

**Sesi dan Compaction**

- `session_start` / `session_end` — lacak batas siklus hidup sesi
- `before_compaction` / `after_compaction` — amati atau anotasi siklus Compaction
- `before_reset` — amati peristiwa reset sesi (`/reset`, reset programatik)

**Subagen**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — koordinasikan perutean subagen dan pengiriman penyelesaian

**Siklus hidup**

- `gateway_start` / `gateway_stop` — mulai atau hentikan layanan milik Plugin bersama Gateway
- `cron_changed` — amati perubahan siklus hidup Cron milik Gateway (ditambahkan, diperbarui, dihapus, dimulai, selesai, dijadwalkan)
- **`before_install`** — periksa pemindaian pemasangan skill atau Plugin dan blokir secara opsional

## Kebijakan pemanggilan alat

`before_tool_call` menerima:

- `event.toolName`
- `event.params`
- `event.runId` opsional
- `event.toolCallId` opsional
- bidang konteks seperti `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, `ctx.runId`, `ctx.jobId` (diatur pada eksekusi yang digerakkan Cron), dan diagnostik `ctx.trace`

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
- `requireApproval` menjeda eksekusi agen dan meminta pengguna melalui persetujuan Plugin. Perintah `/approve` dapat menyetujui persetujuan exec dan Plugin.
- `block: true` berprioritas lebih rendah masih dapat memblokir setelah hook berprioritas lebih tinggi meminta persetujuan.
- `onResolution` menerima keputusan persetujuan yang terselesaikan — `allow-once`, `allow-always`, `deny`, `timeout`, atau `cancelled`.

Plugin bawaan yang memerlukan kebijakan tingkat host dapat mendaftarkan kebijakan alat tepercaya dengan `api.registerTrustedToolPolicy(...)`. Ini berjalan sebelum hook `before_tool_call` biasa dan sebelum keputusan Plugin eksternal. Gunakan hanya untuk gerbang yang dipercaya host seperti kebijakan workspace, penegakan anggaran, atau keselamatan alur kerja cadangan. Plugin eksternal sebaiknya menggunakan hook `before_tool_call` normal.

### Persistensi hasil alat

Hasil alat dapat menyertakan `details` terstruktur untuk rendering UI, diagnostik, perutean media, atau metadata milik Plugin. Perlakukan `details` sebagai metadata runtime, bukan konten prompt:

- OpenClaw menghapus `toolResult.details` sebelum replay penyedia dan input Compaction agar metadata tidak menjadi konteks model.
- Entri sesi yang dipersistensikan hanya menyimpan `details` terbatas. Detail yang terlalu besar diganti dengan ringkasan ringkas dan `persistedDetailsTruncated: true`.
- `tool_result_persist` dan `before_message_write` berjalan sebelum batas persistensi akhir. Hook tetap harus menjaga `details` yang dikembalikan tetap kecil dan menghindari penempatan teks yang relevan dengan prompt hanya di `details`; letakkan output alat yang terlihat oleh model di `content`.

## Hook prompt dan model

Gunakan hook khusus fase untuk Plugin baru:

- `before_model_resolve`: hanya menerima prompt saat ini dan metadata lampiran. Kembalikan `providerOverride` atau `modelOverride`.
- `agent_turn_prepare`: menerima prompt saat ini, pesan sesi yang disiapkan, dan injeksi antrean tepat-sekali apa pun yang dikuras untuk sesi ini. Kembalikan `prependContext` atau `appendContext`.
- `before_prompt_build`: menerima prompt saat ini dan pesan sesi. Kembalikan `prependContext`, `appendContext`, `systemPrompt`, `prependSystemContext`, atau `appendSystemContext`.
- `heartbeat_prompt_contribution`: berjalan hanya untuk giliran Heartbeat dan mengembalikan `prependContext` atau `appendContext`. Ini ditujukan untuk monitor latar belakang yang perlu merangkum status saat ini tanpa mengubah giliran yang diinisiasi pengguna.

`before_agent_start` tetap ada untuk kompatibilitas. Pilih hook eksplisit di atas agar Plugin Anda tidak bergantung pada fase gabungan lama.

`before_agent_start` dan `agent_end` menyertakan `event.runId` saat OpenClaw dapat mengidentifikasi eksekusi aktif. Nilai yang sama juga tersedia pada `ctx.runId`. Eksekusi yang digerakkan Cron juga mengekspos `ctx.jobId` (id job Cron asal) agar hook Plugin dapat membatasi metrik, efek samping, atau status ke job terjadwal tertentu.

Untuk eksekusi yang berasal dari kanal, `ctx.messageProvider` adalah permukaan penyedia seperti `discord` atau `telegram`, sedangkan `ctx.channelId` adalah pengenal target percakapan saat OpenClaw dapat menurunkannya dari kunci sesi atau metadata pengiriman.

`agent_end` adalah hook observasi dan berjalan fire-and-forget setelah giliran. Runner hook menerapkan timeout 30 detik agar Plugin atau endpoint embedding yang macet tidak membuat promise hook tertunda selamanya. Timeout dicatat dan OpenClaw melanjutkan; ini tidak membatalkan pekerjaan jaringan milik Plugin kecuali Plugin juga menggunakan sinyal abort-nya sendiri.

Gunakan `model_call_started` dan `model_call_ended` untuk telemetri pemanggilan penyedia yang tidak boleh menerima prompt mentah, riwayat, respons, header, body permintaan, atau ID permintaan penyedia. Hook ini menyertakan metadata stabil seperti `runId`, `callId`, `provider`, `model`, `api`/`transport` opsional, `durationMs`/`outcome` terminal, dan `upstreamRequestIdHash` saat OpenClaw dapat menurunkan hash id permintaan penyedia terbatas.

`before_agent_finalize` berjalan hanya saat harness akan menerima jawaban akhir asisten alami. Ini bukan jalur pembatalan `/stop` dan tidak berjalan saat pengguna membatalkan giliran. Kembalikan `{ action: "revise", reason }` untuk meminta harness melakukan satu lintasan model lagi sebelum finalisasi, `{ action: "finalize", reason? }` untuk memaksa finalisasi, atau hilangkan hasil untuk melanjutkan. Hook `Stop` native Codex diteruskan ke hook ini sebagai keputusan `before_agent_finalize` OpenClaw.

Plugin non-bawaan yang memerlukan `llm_input`, `llm_output`, `before_agent_finalize`, atau `agent_end` harus mengatur:

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

Hook yang mengubah prompt dan injeksi giliran berikutnya yang tahan lama dapat dinonaktifkan per Plugin dengan `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Ekstensi sesi dan injeksi giliran berikutnya

Plugin alur kerja dapat mempertahankan status sesi kecil yang kompatibel dengan JSON menggunakan `api.registerSessionExtension(...)` dan memperbaruinya melalui metode `sessions.pluginPatch` Gateway. Baris sesi memproyeksikan status ekstensi terdaftar melalui `pluginExtensions`, sehingga Control UI dan klien lain dapat merender status milik Plugin tanpa mempelajari internal Plugin.

Gunakan `api.enqueueNextTurnInjection(...)` saat plugin memerlukan konteks tahan lama untuk
mencapai giliran model berikutnya tepat satu kali. OpenClaw mengosongkan injeksi yang antre sebelum
hook prompt, membuang injeksi yang kedaluwarsa, dan melakukan deduplikasi berdasarkan `idempotencyKey`
per plugin. Ini adalah seam yang tepat untuk melanjutkan persetujuan, ringkasan kebijakan,
delta monitor latar belakang, dan kelanjutan perintah yang harus terlihat oleh
model pada giliran berikutnya tetapi tidak boleh menjadi teks prompt sistem permanen.

Semantik pembersihan adalah bagian dari kontrak. Pembersihan ekstensi sesi dan
callback pembersihan siklus hidup runtime menerima `reset`, `delete`, `disable`, atau
`restart`. Host menghapus state ekstensi sesi persisten milik plugin
dan injeksi giliran berikutnya yang tertunda untuk reset/delete/disable; restart mempertahankan
state sesi tahan lama sementara callback pembersihan memungkinkan plugin melepas job penjadwal,
konteks run, dan resource out-of-band lain untuk generasi runtime lama.

## Hook pesan

Gunakan hook pesan untuk perutean tingkat kanal dan kebijakan pengiriman:

- `message_received`: mengamati konten masuk, pengirim, `threadId`, `messageId`,
  `senderId`, korelasi run/sesi opsional, dan metadata.
- `message_sending`: menulis ulang `content` atau mengembalikan `{ cancel: true }`.
- `message_sent`: mengamati keberhasilan atau kegagalan akhir.

Untuk balasan TTS khusus audio, `content` dapat berisi transkrip lisan tersembunyi
bahkan saat payload kanal tidak memiliki teks/caption yang terlihat. Menulis ulang
`content` tersebut hanya memperbarui transkrip yang terlihat oleh hook; itu tidak dirender sebagai
caption media.

Konteks hook pesan mengekspos field korelasi stabil saat tersedia:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, dan `ctx.callDepth`. Utamakan
field kelas satu ini sebelum membaca metadata lama.

Utamakan field `threadId` dan `replyToId` bertipe sebelum menggunakan metadata
khusus kanal.

Aturan keputusan:

- `message_sending` dengan `cancel: true` bersifat terminal.
- `message_sending` dengan `cancel: false` diperlakukan sebagai tanpa keputusan.
- `content` yang ditulis ulang berlanjut ke hook berprioritas lebih rendah kecuali hook berikutnya
  membatalkan pengiriman.

## Hook instalasi

`before_install` berjalan setelah pemindaian bawaan untuk instalasi skill dan plugin.
Kembalikan temuan tambahan atau `{ block: true, blockReason }` untuk menghentikan
instalasi.

`block: true` bersifat terminal. `block: false` diperlakukan sebagai tanpa keputusan.

## Siklus hidup Gateway

Gunakan `gateway_start` untuk layanan plugin yang memerlukan state milik Gateway. Konteks
mengekspos `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk
inspeksi dan pembaruan cron. Gunakan `gateway_stop` untuk membersihkan resource
yang berjalan lama.

Jangan bergantung pada hook internal `gateway:startup` untuk layanan runtime
milik plugin.

`cron_changed` dipicu untuk peristiwa siklus hidup cron milik gateway dengan payload
peristiwa bertipe yang mencakup alasan `added`, `updated`, `removed`, `started`, `finished`,
dan `scheduled`. Peristiwa membawa snapshot `PluginHookGatewayCronJob`
(termasuk `state.nextRunAtMs`, `state.lastRunStatus`, dan
`state.lastError` saat ada) plus `PluginHookGatewayCronDeliveryStatus`
bernilai `not-requested` | `delivered` | `not-delivered` | `unknown`. Peristiwa yang dihapus
tetap membawa snapshot job yang dihapus agar penjadwal eksternal dapat
menyelaraskan state. Gunakan `ctx.getCron?.()` dan `ctx.config` dari konteks
runtime saat menyinkronkan penjadwal wake eksternal, dan jadikan OpenClaw sebagai
sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

## Penghentian dukungan mendatang

Beberapa surface yang berdekatan dengan hook sudah deprecated tetapi masih didukung. Migrasikan
sebelum rilis mayor berikutnya:

- **Envelope kanal plaintext** di handler `inbound_claim` dan `message_received`.
  Baca `BodyForAgent` dan blok konteks pengguna terstruktur
  alih-alih mengurai teks envelope datar. Lihat
  [Envelope kanal plaintext → BodyForAgent](/id/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** tetap ada untuk kompatibilitas. Plugin baru sebaiknya menggunakan
  `before_model_resolve` dan `before_prompt_build` alih-alih fase gabungan.
- **`onResolution` dalam `before_tool_call`** kini menggunakan union bertipe
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) alih-alih `string` bentuk bebas.

Untuk daftar lengkapnya — pendaftaran kapabilitas memori, profil berpikir provider,
provider auth eksternal, tipe penemuan provider, accessor runtime tugas, dan penggantian nama
`command-auth` → `command-status` — lihat
[Migrasi Plugin SDK → Penghentian dukungan aktif](/id/plugins/sdk-migration#active-deprecations).

## Terkait

- [Migrasi Plugin SDK](/id/plugins/sdk-migration) — penghentian dukungan aktif dan linimasa penghapusan
- [Membangun plugin](/id/plugins/building-plugins)
- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
- [Titik masuk Plugin](/id/plugins/sdk-entrypoints)
- [Hook internal](/id/automation/hooks)
- [Internal arsitektur Plugin](/id/plugins/architecture-internals)
