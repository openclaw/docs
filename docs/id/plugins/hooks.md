---
read_when:
    - Anda sedang membangun Plugin yang memerlukan before_tool_call, before_agent_reply, hook pesan, atau hook siklus hidup
    - Anda perlu memblokir, menulis ulang, atau mewajibkan persetujuan untuk panggilan alat dari Plugin
    - Anda sedang memilih antara hook internal dan hook Plugin
summary: 'Kait Plugin: mencegat peristiwa siklus hidup agen, alat, pesan, sesi, dan Gateway'
title: Hook Plugin
x-i18n:
    generated_at: "2026-04-30T10:01:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: f600df47c67eb07d85b7b063f1189baf78a49efad727d8cadbd37f66745c4401
    source_path: plugins/hooks.md
    workflow: 16
---

Hook Plugin adalah titik ekstensi dalam proses untuk Plugin OpenClaw. Gunakan ini
ketika sebuah Plugin perlu memeriksa atau mengubah eksekusi agen, pemanggilan alat, alur pesan,
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

Handler hook berjalan berurutan dalam `priority` menurun. Hook dengan prioritas yang sama
mempertahankan urutan pendaftaran.

`api.on(name, handler, opts?)` menerima:

- `priority` — pengurutan handler (lebih tinggi berjalan lebih dulu).
- `timeoutMs` — anggaran opsional per hook. Jika disetel, runner hook membatalkan
  handler tersebut setelah anggaran berlalu dan melanjutkan ke yang berikutnya, alih-alih
  membiarkan setup lambat atau pekerjaan pemanggilan ulang menghabiskan timeout model
  yang dikonfigurasi pemanggil. Hilangkan untuk menggunakan timeout observasi/keputusan default yang
  diterapkan runner hook secara generik.

Setiap hook menerima `event.context.pluginConfig`, konfigurasi terselesaikan untuk
Plugin yang mendaftarkan handler tersebut. Gunakan ini untuk keputusan hook yang membutuhkan
opsi Plugin saat ini; OpenClaw menyuntikkannya per handler tanpa memutasi
objek peristiwa bersama yang dilihat Plugin lain.

## Katalog hook

Hook dikelompokkan berdasarkan permukaan yang diperluasnya. Nama dalam **tebal** menerima
hasil keputusan (blokir, batalkan, timpa, atau wajibkan persetujuan); semua lainnya
hanya observasi.

**Giliran agen**

- `before_model_resolve` — timpa penyedia atau model sebelum pesan sesi dimuat
- `agent_turn_prepare` — konsumsi injeksi giliran Plugin yang diantrekan dan tambahkan konteks giliran yang sama sebelum hook prompt
- `before_prompt_build` — tambahkan konteks dinamis atau teks prompt sistem sebelum pemanggilan model
- `before_agent_start` — fase gabungan hanya untuk kompatibilitas; utamakan dua hook di atas
- **`before_agent_reply`** — potong singkat giliran model dengan balasan sintetis atau diam
- **`before_agent_finalize`** — periksa jawaban akhir alami dan minta satu lintasan model lagi
- `agent_end` — amati pesan akhir, status sukses, dan durasi eksekusi
- `heartbeat_prompt_contribution` — tambahkan konteks khusus heartbeat untuk pemantau latar belakang dan Plugin siklus hidup

**Observasi percakapan**

- `model_call_started` / `model_call_ended` — amati metadata pemanggilan penyedia/model yang sudah disanitasi, waktu, hasil, dan hash id permintaan terbatas tanpa konten prompt atau respons
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
- `before_reset` — amati peristiwa reset sesi (`/reset`, reset terprogram)

**Subagen**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — koordinasikan perutean subagen dan pengiriman penyelesaian

**Siklus hidup**

- `gateway_start` / `gateway_stop` — mulai atau hentikan layanan milik Plugin bersama Gateway
- `cron_changed` — amati perubahan siklus hidup cron milik Gateway (ditambahkan, diperbarui, dihapus, dimulai, selesai, dijadwalkan)
- **`before_install`** — periksa pemindaian instalasi skill atau Plugin dan opsional blokir

## Kebijakan pemanggilan alat

`before_tool_call` menerima:

- `event.toolName`
- `event.params`
- opsional `event.runId`
- opsional `event.toolCallId`
- bidang konteks seperti `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (disetel pada eksekusi yang digerakkan cron), dan diagnostik `ctx.trace`

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
- `requireApproval` menjeda eksekusi agen dan meminta pengguna melalui persetujuan Plugin.
  Perintah `/approve` dapat menyetujui persetujuan exec dan Plugin.
- `block: true` berprioritas lebih rendah tetap dapat memblokir setelah hook berprioritas lebih tinggi
  meminta persetujuan.
- `onResolution` menerima keputusan persetujuan terselesaikan — `allow-once`,
  `allow-always`, `deny`, `timeout`, atau `cancelled`.

Plugin bawaan yang membutuhkan kebijakan tingkat host dapat mendaftarkan kebijakan alat tepercaya
dengan `api.registerTrustedToolPolicy(...)`. Ini berjalan sebelum hook
`before_tool_call` biasa dan sebelum keputusan Plugin eksternal. Gunakan hanya
untuk gerbang yang dipercaya host seperti kebijakan ruang kerja, penegakan anggaran, atau
keamanan alur kerja cadangan. Plugin eksternal sebaiknya menggunakan hook `before_tool_call`
normal.

### Persistensi hasil alat

Hasil alat dapat menyertakan `details` terstruktur untuk rendering UI, diagnostik,
perutean media, atau metadata milik Plugin. Perlakukan `details` sebagai metadata runtime,
bukan konten prompt:

- OpenClaw menghapus `toolResult.details` sebelum replay penyedia dan input Compaction
  sehingga metadata tidak menjadi konteks model.
- Entri sesi yang dipersistensikan hanya menyimpan `details` terbatas. Detail yang terlalu besar
  diganti dengan ringkasan ringkas dan `persistedDetailsTruncated: true`.
- `tool_result_persist` dan `before_message_write` berjalan sebelum batas persistensi akhir.
  Hook tetap harus menjaga `details` yang dikembalikan tetap kecil dan menghindari
  penempatan teks yang relevan untuk prompt hanya di `details`; letakkan output alat yang terlihat model
  di `content`.

## Hook prompt dan model

Gunakan hook khusus fase untuk Plugin baru:

- `before_model_resolve`: hanya menerima metadata prompt dan lampiran saat ini.
  Kembalikan `providerOverride` atau `modelOverride`.
- `agent_turn_prepare`: menerima prompt saat ini, pesan sesi yang disiapkan,
  dan injeksi antrean tepat-sekali yang dikuras untuk sesi ini. Kembalikan
  `prependContext` atau `appendContext`.
- `before_prompt_build`: menerima prompt saat ini dan pesan sesi.
  Kembalikan `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, atau `appendSystemContext`.
- `heartbeat_prompt_contribution`: berjalan hanya untuk giliran heartbeat dan mengembalikan
  `prependContext` atau `appendContext`. Ini ditujukan untuk pemantau latar belakang
  yang perlu merangkum status saat ini tanpa mengubah giliran yang diprakarsai pengguna.

`before_agent_start` tetap ada untuk kompatibilitas. Utamakan hook eksplisit di atas
agar Plugin Anda tidak bergantung pada fase gabungan lama.

`before_agent_start` dan `agent_end` menyertakan `event.runId` ketika OpenClaw dapat
mengidentifikasi eksekusi aktif. Nilai yang sama juga tersedia di `ctx.runId`.
Eksekusi yang digerakkan Cron juga mengekspos `ctx.jobId` (id tugas cron asal) sehingga
hook Plugin dapat membatasi cakupan metrik, efek samping, atau status ke tugas terjadwal
tertentu.

`agent_end` adalah hook observasi dan berjalan fire-and-forget setelah giliran. Runner
hook menerapkan timeout 30 detik sehingga Plugin atau endpoint embedding yang tersangkut
tidak dapat membiarkan promise hook tertunda selamanya. Timeout dicatat dan
OpenClaw melanjutkan; ini tidak membatalkan pekerjaan jaringan milik Plugin kecuali
Plugin juga menggunakan sinyal pembatalannya sendiri.

Gunakan `model_call_started` dan `model_call_ended` untuk telemetri pemanggilan penyedia
yang tidak boleh menerima prompt mentah, riwayat, respons, header, body permintaan,
atau id permintaan penyedia. Hook ini menyertakan metadata stabil seperti
`runId`, `callId`, `provider`, `model`, opsional `api`/`transport`, terminal
`durationMs`/`outcome`, dan `upstreamRequestIdHash` ketika OpenClaw dapat menurunkan
hash id permintaan penyedia terbatas.

`before_agent_finalize` berjalan hanya ketika harness akan menerima jawaban asisten akhir
alami. Ini bukan jalur pembatalan `/stop` dan tidak berjalan ketika pengguna
membatalkan giliran. Kembalikan `{ action: "revise", reason }` untuk meminta
harness melakukan satu lintasan model lagi sebelum finalisasi, `{ action:
"finalize", reason? }` untuk memaksa finalisasi, atau hilangkan hasil untuk melanjutkan.
Hook native `Stop` Codex direlay ke hook ini sebagai keputusan
`before_agent_finalize` OpenClaw.

Plugin non-bawaan yang membutuhkan `llm_input`, `llm_output`,
`before_agent_finalize`, atau `agent_end` harus menyetel:

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

Plugin alur kerja dapat mempersistensikan status sesi kecil yang kompatibel JSON dengan
`api.registerSessionExtension(...)` dan memperbaruinya melalui metode Gateway
`sessions.pluginPatch`. Baris sesi memproyeksikan status ekstensi terdaftar
melalui `pluginExtensions`, sehingga Control UI dan klien lain dapat merender
status milik Plugin tanpa mengetahui internal Plugin.

Gunakan `api.enqueueNextTurnInjection(...)` ketika Plugin membutuhkan konteks tahan lama untuk
mencapai giliran model berikutnya tepat satu kali. OpenClaw menguras injeksi yang diantrekan sebelum
hook prompt, membuang injeksi kedaluwarsa, dan mendeduplikasi berdasarkan `idempotencyKey`
per Plugin. Ini adalah seam yang tepat untuk resume persetujuan, ringkasan kebijakan,
delta pemantau latar belakang, dan kelanjutan perintah yang harus terlihat oleh
model pada giliran berikutnya tetapi tidak boleh menjadi teks prompt sistem permanen.

Semantik pembersihan adalah bagian dari kontrak. Pembersihan ekstensi sesi dan
callback pembersihan siklus hidup runtime menerima `reset`, `delete`, `disable`, atau
`restart`. Host menghapus status ekstensi sesi persisten milik Plugin
dan injeksi giliran berikutnya yang tertunda untuk reset/delete/disable; restart mempertahankan
status sesi tahan lama sementara callback pembersihan memungkinkan Plugin melepaskan tugas scheduler,
konteks eksekusi, dan sumber daya out-of-band lain untuk generasi runtime lama.

## Hook pesan

Gunakan hook pesan untuk perutean tingkat kanal dan kebijakan pengiriman:

- `message_received`: amati konten masuk, pengirim, `threadId`, `messageId`,
  `senderId`, korelasi eksekusi/sesi opsional, dan metadata.
- `message_sending`: tulis ulang `content` atau kembalikan `{ cancel: true }`.
- `message_sent`: amati keberhasilan atau kegagalan akhir.

Untuk balasan TTS khusus audio, `content` dapat berisi transkrip ucapan tersembunyi
meskipun payload saluran tidak memiliki teks/keterangan yang terlihat. Menulis ulang
`content` tersebut hanya memperbarui transkrip yang terlihat oleh hook; itu tidak dirender sebagai
keterangan media.

Konteks hook pesan mengekspos bidang korelasi stabil saat tersedia:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, dan `ctx.callDepth`. Utamakan
bidang kelas satu ini sebelum membaca metadata lama.

Utamakan bidang `threadId` dan `replyToId` bertipe sebelum menggunakan
metadata khusus saluran.

Aturan keputusan:

- `message_sending` dengan `cancel: true` bersifat terminal.
- `message_sending` dengan `cancel: false` diperlakukan sebagai tanpa keputusan.
- `content` yang ditulis ulang terus diteruskan ke hook berprioritas lebih rendah kecuali hook berikutnya
  membatalkan pengiriman.

## Instal hook

`before_install` berjalan setelah pemindaian bawaan untuk pemasangan skill dan plugin.
Kembalikan temuan tambahan atau `{ block: true, blockReason }` untuk menghentikan
pemasangan.

`block: true` bersifat terminal. `block: false` diperlakukan sebagai tanpa keputusan.

## Siklus hidup Gateway

Gunakan `gateway_start` untuk layanan plugin yang membutuhkan status milik Gateway. 
Konteks mengekspos `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk
inspeksi dan pembaruan cron. Gunakan `gateway_stop` untuk membersihkan sumber daya
yang berjalan lama.

Jangan bergantung pada hook internal `gateway:startup` untuk layanan runtime
milik plugin.

`cron_changed` dipicu untuk peristiwa siklus hidup cron milik gateway dengan payload
peristiwa bertipe yang mencakup alasan `added`, `updated`, `removed`, `started`, `finished`,
dan `scheduled`. Peristiwa membawa snapshot `PluginHookGatewayCronJob`
(termasuk `state.nextRunAtMs`, `state.lastRunStatus`, dan
`state.lastError` saat ada) ditambah `PluginHookGatewayCronDeliveryStatus`
bernilai `not-requested` | `delivered` | `not-delivered` | `unknown`. Peristiwa
yang dihapus tetap membawa snapshot tugas yang dihapus sehingga penjadwal eksternal dapat
merekonsiliasi status. Gunakan `ctx.getCron?.()` dan `ctx.config` dari konteks
runtime saat menyinkronkan penjadwal bangun eksternal, dan pertahankan OpenClaw sebagai
sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

## Penghentian mendatang

Beberapa permukaan yang berdekatan dengan hook sudah dihentikan tetapi masih didukung. Migrasikan
sebelum rilis mayor berikutnya:

- **Amplop saluran teks polos** dalam handler `inbound_claim` dan `message_received`.
  Baca `BodyForAgent` dan blok konteks pengguna terstruktur
  alih-alih mengurai teks amplop datar. Lihat
  [Amplop saluran teks polos → BodyForAgent](/id/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** tetap ada untuk kompatibilitas. Plugin baru sebaiknya menggunakan
  `before_model_resolve` dan `before_prompt_build` alih-alih fase gabungan.
- **`onResolution` dalam `before_tool_call`** kini menggunakan union bertipe
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) alih-alih `string` bebas.

Untuk daftar lengkap — pendaftaran kapabilitas memori, profil berpikir penyedia,
penyedia autentikasi eksternal, tipe penemuan penyedia, pengakses runtime tugas,
dan penggantian nama `command-auth` → `command-status` — lihat
[Migrasi Plugin SDK → Penghentian aktif](/id/plugins/sdk-migration#active-deprecations).

## Terkait

- [Migrasi Plugin SDK](/id/plugins/sdk-migration) — penghentian aktif dan linimasa penghapusan
- [Membangun plugin](/id/plugins/building-plugins)
- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
- [Titik masuk Plugin](/id/plugins/sdk-entrypoints)
- [Hook internal](/id/automation/hooks)
- [Internal arsitektur Plugin](/id/plugins/architecture-internals)
