---
read_when:
    - Anda sedang membangun Plugin yang memerlukan before_tool_call, before_agent_reply, kait pesan, atau kait siklus hidup
    - Anda perlu memblokir, menulis ulang, atau mewajibkan persetujuan untuk pemanggilan alat dari Plugin
    - Anda sedang memilih antara hook internal dan hook Plugin
summary: 'Hook Plugin: mengintersepsi peristiwa siklus hidup agen, alat, pesan, sesi, dan Gateway'
title: Kait Plugin
x-i18n:
    generated_at: "2026-05-11T20:33:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b363b8ed7452f0d8bdb267d3eaa38f579d6d7cfb7ace2085ac35baf9b253b575
    source_path: plugins/hooks.md
    workflow: 16
---

Hook Plugin adalah titik ekstensi dalam proses untuk Plugin OpenClaw. Gunakan hook
ketika Plugin perlu memeriksa atau mengubah eksekusi agen, pemanggilan alat, alur pesan,
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

Penangan hook berjalan berurutan dalam `priority` menurun. Hook dengan prioritas
yang sama mempertahankan urutan pendaftaran.

`api.on(name, handler, opts?)` menerima:

- `priority` - pengurutan penangan (nilai lebih tinggi berjalan lebih dulu).
- `timeoutMs` - anggaran opsional per hook. Jika ditetapkan, runner hook membatalkan
  penangan tersebut setelah anggaran berlalu dan melanjutkan ke penangan berikutnya,
  alih-alih membiarkan penyiapan lambat atau pekerjaan recall menghabiskan timeout
  model yang dikonfigurasi pemanggil. Hilangkan untuk menggunakan timeout observasi/keputusan
  default yang diterapkan runner hook secara generik.

Operator juga dapat menetapkan anggaran hook tanpa menambal kode Plugin:

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
berupa bilangan bulat positif tidak lebih dari 600000 milidetik. Utamakan override
per hook untuk hook yang diketahui lambat agar satu Plugin tidak mendapat anggaran lebih panjang
di semua tempat.

Setiap hook menerima `event.context.pluginConfig`, konfigurasi terselesaikan untuk
Plugin yang mendaftarkan penangan tersebut. Gunakan untuk keputusan hook yang membutuhkan
opsi Plugin saat ini; OpenClaw menyuntikkannya per penangan tanpa memutasi objek
peristiwa bersama yang dilihat Plugin lain.

## Katalog hook

Hook dikelompokkan berdasarkan permukaan yang diperluasnya. Nama dalam **tebal** menerima
hasil keputusan (blokir, batalkan, override, atau minta persetujuan); semua lainnya
hanya observasi.

**Giliran agen**

- `before_model_resolve` - override penyedia atau model sebelum pesan sesi dimuat
- `agent_turn_prepare` - konsumsi injeksi giliran Plugin yang diantrekan dan tambahkan konteks giliran yang sama sebelum hook prompt
- `before_prompt_build` - tambahkan konteks dinamis atau teks prompt sistem sebelum pemanggilan model
- `before_agent_start` - fase gabungan hanya untuk kompatibilitas; utamakan dua hook di atas
- **`before_agent_run`** - periksa prompt final dan pesan sesi sebelum pengiriman model dan opsional blokir eksekusi
- **`before_agent_reply`** - pintas giliran model dengan balasan sintetis atau senyap
- **`before_agent_finalize`** - periksa jawaban akhir natural dan minta satu lintasan model lagi
- `agent_end` - amati pesan final, status sukses, dan durasi eksekusi
- `heartbeat_prompt_contribution` - tambahkan konteks khusus Heartbeat untuk Plugin pemantau latar belakang dan siklus hidup

**Observasi percakapan**

- `model_call_started` / `model_call_ended` - amati metadata pemanggilan penyedia/model yang disanitasi, timing, hasil, dan hash id permintaan berbatas tanpa konten prompt atau respons
- `llm_input` - amati input penyedia (prompt sistem, prompt, riwayat)
- `llm_output` - amati output penyedia

**Alat**

- **`before_tool_call`** - tulis ulang parameter alat, blokir eksekusi, atau minta persetujuan
- `after_tool_call` - amati hasil alat, error, dan durasi
- **`tool_result_persist`** - tulis ulang pesan asisten yang dihasilkan dari hasil alat
- **`before_message_write`** - periksa atau blokir penulisan pesan yang sedang berlangsung (jarang)

**Pesan dan pengiriman**

- **`inbound_claim`** - klaim pesan masuk sebelum perutean agen (balasan sintetis)
- `message_received` - amati konten masuk, pengirim, thread, dan metadata
- **`message_sending`** - tulis ulang konten keluar atau batalkan pengiriman
- `message_sent` - amati keberhasilan atau kegagalan pengiriman keluar
- **`before_dispatch`** - periksa atau tulis ulang dispatch keluar sebelum handoff kanal
- **`reply_dispatch`** - berpartisipasi dalam pipeline dispatch balasan final

**Sesi dan Compaction**

- `session_start` / `session_end` - lacak batas siklus hidup sesi. `reason` peristiwa adalah salah satu dari `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart`, atau `unknown`. Nilai `shutdown` dan `restart` dipicu dari finalizer shutdown gateway ketika proses dihentikan atau dimulai ulang saat sesi masih aktif, sehingga Plugin hilir (seperti penyimpanan memori atau transkrip) dapat memfinalisasi baris ghost yang jika tidak akan dibiarkan dalam status terbuka lintas restart. Finalizer dibatasi sehingga Plugin yang lambat tidak dapat memblokir SIGTERM/SIGINT.
- `before_compaction` / `after_compaction` - amati atau anotasi siklus Compaction
- `before_reset` - amati peristiwa reset sesi (`/reset`, reset programatik)

**Subagen**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - koordinasikan perutean subagen dan pengiriman penyelesaian

**Siklus hidup**

- `gateway_start` / `gateway_stop` - mulai atau hentikan layanan milik Plugin bersama Gateway
- `cron_changed` - amati perubahan siklus hidup Cron milik gateway (ditambahkan, diperbarui, dihapus, dimulai, selesai, dijadwalkan)
- **`before_install`** - periksa pemindaian instalasi skill atau Plugin dan opsional blokir

## Kebijakan pemanggilan alat

`before_tool_call` menerima:

- `event.toolName`
- `event.params`
- opsional `event.derivedPaths`, berisi petunjuk jalur target turunan host berbasis upaya terbaik
  untuk envelope alat yang dikenal seperti `apply_patch`; jika ada,
  jalur ini mungkin tidak lengkap atau mungkin memperkirakan berlebihan apa yang sebenarnya
  akan disentuh alat (misalnya, dengan input yang cacat atau parsial)
- opsional `event.runId`
- opsional `event.toolCallId`
- field konteks seperti `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ditetapkan pada eksekusi yang digerakkan Cron), dan `ctx.trace` diagnostik

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

- `block: true` bersifat terminal dan melewati penangan berprioritas lebih rendah.
- `block: false` diperlakukan sebagai tanpa keputusan.
- `params` menulis ulang parameter alat untuk eksekusi.
- `requireApproval` menjeda eksekusi agen dan meminta persetujuan pengguna melalui persetujuan Plugin. Perintah `/approve` dapat menyetujui persetujuan exec maupun Plugin.
- `block: true` berprioritas lebih rendah masih dapat memblokir setelah hook berprioritas lebih tinggi meminta persetujuan.
- `onResolution` menerima keputusan persetujuan yang terselesaikan - `allow-once`,
  `allow-always`, `deny`, `timeout`, atau `cancelled`.

Plugin bawaan yang membutuhkan kebijakan tingkat host dapat mendaftarkan kebijakan alat tepercaya
dengan `api.registerTrustedToolPolicy(...)`. Kebijakan ini berjalan sebelum hook
`before_tool_call` biasa dan sebelum keputusan Plugin eksternal. Gunakan hanya
untuk gerbang tepercaya host seperti kebijakan workspace, penegakan anggaran, atau
keamanan alur kerja terpesan. Plugin eksternal harus menggunakan hook `before_tool_call`
normal.

### Persistensi hasil alat

Hasil alat dapat menyertakan `details` terstruktur untuk rendering UI, diagnostik,
perutean media, atau metadata milik Plugin. Perlakukan `details` sebagai metadata runtime,
bukan konten prompt:

- OpenClaw menghapus `toolResult.details` sebelum replay penyedia dan input Compaction
  sehingga metadata tidak menjadi konteks model.
- Entri sesi yang dipersistensikan hanya menyimpan `details` berbatas. Detail yang terlalu besar
  diganti dengan ringkasan ringkas dan `persistedDetailsTruncated: true`.
- `tool_result_persist` dan `before_message_write` berjalan sebelum batas persistensi
  final. Hook tetap harus menjaga `details` yang dikembalikan tetap kecil dan menghindari
  penempatan teks yang relevan dengan prompt hanya di `details`; letakkan output alat yang terlihat model
  di `content`.

## Hook prompt dan model

Gunakan hook khusus fase untuk Plugin baru:

- `before_model_resolve`: hanya menerima prompt saat ini dan metadata lampiran.
  Kembalikan `providerOverride` atau `modelOverride`.
- `agent_turn_prepare`: menerima prompt saat ini, pesan sesi yang disiapkan,
  dan injeksi antrean tepat-sekali apa pun yang dikuras untuk sesi ini. Kembalikan
  `prependContext` atau `appendContext`.
- `before_prompt_build`: menerima prompt saat ini dan pesan sesi.
  Kembalikan `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, atau `appendSystemContext`.
- `heartbeat_prompt_contribution`: berjalan hanya untuk giliran Heartbeat dan mengembalikan
  `prependContext` atau `appendContext`. Ini ditujukan untuk pemantau latar belakang
  yang perlu merangkum status saat ini tanpa mengubah giliran yang diprakarsai pengguna.

`before_agent_start` tetap ada untuk kompatibilitas. Utamakan hook eksplisit di atas
agar Plugin Anda tidak bergantung pada fase gabungan lama.

`before_agent_run` berjalan setelah konstruksi prompt dan sebelum input model apa pun,
termasuk pemuatan gambar lokal prompt dan observasi `llm_input`. Ini menerima
input pengguna saat ini sebagai `prompt`, ditambah riwayat sesi yang dimuat di `messages`
dan prompt sistem aktif. Kembalikan `{ outcome: "block", reason, message? }`
untuk menghentikan eksekusi sebelum model dapat membaca prompt. `reason` bersifat internal;
`message` adalah pengganti yang ditampilkan kepada pengguna. Satu-satunya hasil yang didukung adalah
`pass` dan `block`; bentuk keputusan yang tidak didukung gagal tertutup.

Ketika eksekusi diblokir, OpenClaw hanya menyimpan teks pengganti di
`message.content` ditambah metadata blokir non-sensitif seperti id Plugin pemblokir
dan timestamp. Teks pengguna asli tidak disimpan dalam transkrip atau konteks mendatang.
Alasan blokir internal diperlakukan sebagai sensitif dan dikecualikan dari
payload transkrip, riwayat, broadcast, log, dan diagnostik. Observabilitas
harus menggunakan field yang disanitasi seperti id pemblokir, hasil, timestamp, atau kategori aman.

`before_agent_start` dan `agent_end` menyertakan `event.runId` ketika OpenClaw dapat
mengidentifikasi eksekusi aktif. Nilai yang sama juga tersedia pada `ctx.runId`.
Eksekusi yang digerakkan Cron juga mengekspos `ctx.jobId` (id job Cron asal) sehingga
hook Plugin dapat membatasi metrik, efek samping, atau status ke job terjadwal tertentu.

Untuk eksekusi yang berasal dari kanal, `ctx.messageProvider` adalah permukaan penyedia seperti
`discord` atau `telegram`, sedangkan `ctx.channelId` adalah pengidentifikasi target percakapan
ketika OpenClaw dapat menurunkannya dari kunci sesi atau metadata pengiriman.

`agent_end` adalah hook observasi dan berjalan fire-and-forget setelah giliran. Runner
hook menerapkan timeout 30 detik sehingga Plugin yang macet atau endpoint embedding
tidak dapat membiarkan promise hook tertunda selamanya. Timeout dicatat dan
OpenClaw berlanjut; ini tidak membatalkan pekerjaan jaringan milik Plugin kecuali
Plugin juga menggunakan sinyal abort-nya sendiri.

Gunakan `model_call_started` dan `model_call_ended` untuk telemetri panggilan provider
yang tidak boleh menerima prompt mentah, riwayat, respons, header, isi permintaan,
atau ID permintaan provider. Hook ini mencakup metadata stabil seperti
`runId`, `callId`, `provider`, `model`, `api`/`transport` opsional,
`durationMs`/`outcome` terminal, dan `upstreamRequestIdHash` ketika OpenClaw dapat
menurunkan hash ID permintaan provider yang terbatas.

`before_agent_finalize` berjalan hanya ketika harness akan menerima jawaban asisten
final yang alami. Ini bukan jalur pembatalan `/stop` dan tidak berjalan ketika
pengguna membatalkan sebuah giliran. Kembalikan `{ action: "revise", reason }` untuk meminta
harness melakukan satu lintasan model lagi sebelum finalisasi, `{ action:
"finalize", reason? }` untuk memaksa finalisasi, atau hilangkan hasil untuk melanjutkan.
Hook `Stop` native Codex diteruskan ke hook ini sebagai keputusan OpenClaw
`before_agent_finalize`.

Saat mengembalikan `action: "revise"`, plugins dapat menyertakan metadata `retry` untuk membuat
lintasan model tambahan terbatas dan aman diputar ulang:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` ditambahkan ke alasan revisi yang dikirim ke harness.
`idempotencyKey` memungkinkan host menghitung percobaan ulang untuk permintaan plugin yang sama di seluruh
keputusan finalisasi yang ekuivalen, dan `maxAttempts` membatasi berapa banyak lintasan tambahan yang
akan diizinkan host sebelum melanjutkan dengan jawaban final alami.

Plugin yang tidak dibundel dan membutuhkan hook percakapan mentah (`before_model_resolve`,
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

Plugin alur kerja dapat mempertahankan status sesi kecil yang kompatibel dengan JSON menggunakan
`api.registerSessionExtension(...)` dan memperbaruinya melalui metode Gateway
`sessions.pluginPatch`. Baris sesi memproyeksikan status ekstensi terdaftar
melalui `pluginExtensions`, sehingga Control UI dan klien lain dapat merender
status milik plugin tanpa mempelajari internal plugin.

Gunakan `api.enqueueNextTurnInjection(...)` ketika sebuah plugin membutuhkan konteks tahan lama agar
mencapai giliran model berikutnya tepat satu kali. OpenClaw menguras injeksi yang mengantre sebelum
hook prompt, membuang injeksi yang kedaluwarsa, dan melakukan deduplikasi berdasarkan `idempotencyKey`
per plugin. Ini adalah seam yang tepat untuk melanjutkan persetujuan, ringkasan kebijakan,
delta monitor latar belakang, dan kelanjutan perintah yang harus terlihat oleh
model pada giliran berikutnya tetapi tidak boleh menjadi teks prompt sistem permanen.

Semantik pembersihan adalah bagian dari kontrak. Pembersihan ekstensi sesi dan
callback pembersihan siklus hidup runtime menerima `reset`, `delete`, `disable`, atau
`restart`. Host menghapus status ekstensi sesi persisten milik plugin
dan injeksi giliran berikutnya tertunda untuk reset/delete/disable; restart mempertahankan
status sesi tahan lama sementara callback pembersihan memungkinkan plugins melepaskan pekerjaan scheduler,
konteks berjalan, dan sumber daya out-of-band lain untuk generasi runtime lama.

## Hook pesan

Gunakan hook pesan untuk kebijakan perutean dan pengiriman tingkat channel:

- `message_received`: amati konten masuk, pengirim, `threadId`, `messageId`,
  `senderId`, korelasi run/sesi opsional, dan metadata.
- `message_sending`: tulis ulang `content` atau kembalikan `{ cancel: true }`.
- `message_sent`: amati keberhasilan atau kegagalan final.

Untuk balasan TTS hanya audio, `content` dapat berisi transkrip ucapan tersembunyi
bahkan ketika payload channel tidak memiliki teks/caption yang terlihat. Menulis ulang
`content` tersebut hanya memperbarui transkrip yang terlihat oleh hook; itu tidak dirender sebagai
caption media.

Konteks hook pesan mengekspos kolom korelasi stabil saat tersedia:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, dan `ctx.callDepth`. Utamakan
kolom first-class ini sebelum membaca metadata legacy.

Utamakan kolom `threadId` dan `replyToId` bertipe sebelum menggunakan metadata khusus channel.

Aturan keputusan:

- `message_sending` dengan `cancel: true` bersifat terminal.
- `message_sending` dengan `cancel: false` diperlakukan sebagai tanpa keputusan.
- `content` yang ditulis ulang berlanjut ke hook prioritas lebih rendah kecuali hook berikutnya
  membatalkan pengiriman.
- `message_sending` dapat mengembalikan `cancelReason` dan `metadata` terbatas bersama
  pembatalan. API siklus hidup pesan baru mengekspos ini sebagai hasil pengiriman yang ditekan
  dengan alasan `cancelled_by_message_sending_hook`; pengiriman langsung legacy
  tetap mengembalikan array hasil kosong untuk kompatibilitas.
- `message_sent` hanya untuk observasi. Kegagalan handler dicatat dan tidak
  mengubah hasil pengiriman.

## Hook instalasi

`before_install` berjalan setelah pemindaian bawaan untuk instalasi skill dan plugin.
Kembalikan temuan tambahan atau `{ block: true, blockReason }` untuk menghentikan
instalasi.

`block: true` bersifat terminal. `block: false` diperlakukan sebagai tanpa keputusan.

## Siklus hidup Gateway

Gunakan `gateway_start` untuk layanan plugin yang membutuhkan status milik Gateway. Konteks
mengekspos `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk
inspeksi dan pembaruan cron. Gunakan `gateway_stop` untuk membersihkan sumber daya
yang berjalan lama.

Jangan bergantung pada hook internal `gateway:startup` untuk layanan runtime
milik plugin.

`cron_changed` dipicu untuk peristiwa siklus hidup cron milik gateway dengan payload
peristiwa bertipe yang mencakup alasan `added`, `updated`, `removed`, `started`, `finished`,
dan `scheduled`. Peristiwa ini membawa snapshot `PluginHookGatewayCronJob`
(termasuk `state.nextRunAtMs`, `state.lastRunStatus`, dan
`state.lastError` saat ada) serta `PluginHookGatewayCronDeliveryStatus`
berupa `not-requested` | `delivered` | `not-delivered` | `unknown`. Peristiwa yang dihapus
tetap membawa snapshot job yang dihapus sehingga scheduler eksternal dapat
merekonsiliasi status. Gunakan `ctx.getCron?.()` dan `ctx.config` dari konteks
runtime saat menyinkronkan scheduler pembangun eksternal, dan pertahankan OpenClaw sebagai
sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

## Penghentian mendatang

Beberapa permukaan yang berdekatan dengan hook sudah dihentikan tetapi masih didukung. Migrasikan
sebelum rilis mayor berikutnya:

- **Envelope channel teks biasa** dalam handler `inbound_claim` dan `message_received`.
  Baca `BodyForAgent` dan blok konteks pengguna terstruktur
  alih-alih mengurai teks envelope datar. Lihat
  [Envelope channel teks biasa → BodyForAgent](/id/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** tetap ada untuk kompatibilitas. Plugin baru sebaiknya menggunakan
  `before_model_resolve` dan `before_prompt_build` alih-alih fase gabungan.
- **`onResolution` dalam `before_tool_call`** kini menggunakan union bertipe
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) alih-alih `string` bentuk bebas.

Untuk daftar lengkap - pendaftaran kapabilitas memori, profil berpikir provider,
provider auth eksternal, tipe discovery provider, accessor runtime tugas,
dan penggantian nama `command-auth` → `command-status` - lihat
[Migrasi Plugin SDK → Penghentian aktif](/id/plugins/sdk-migration#active-deprecations).

## Terkait

- [Migrasi Plugin SDK](/id/plugins/sdk-migration) - penghentian aktif dan jadwal penghapusan
- [Membangun plugins](/id/plugins/building-plugins)
- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
- [Titik masuk Plugin](/id/plugins/sdk-entrypoints)
- [Hook internal](/id/automation/hooks)
- [Internal arsitektur Plugin](/id/plugins/architecture-internals)
