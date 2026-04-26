---
read_when:
    - Anda sedang membangun Plugin yang memerlukan `before_tool_call`, `before_agent_reply`, hook pesan, atau hook siklus hidup
    - Anda perlu memblokir, menulis ulang, atau mewajibkan approval untuk panggilan tool dari Plugin
    - Anda sedang memutuskan antara hook internal dan hook Plugin
summary: 'Hook Plugin: mencegat peristiwa siklus hidup agen, tool, pesan, sesi, dan Gateway'
title: Hook Plugin
x-i18n:
    generated_at: "2026-04-26T11:34:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62d8c21db885abcb70c7aa940e3ce937df09d077587b153015c4c6c5169f4f1d
    source_path: plugins/hooks.md
    workflow: 15
---

Hook Plugin adalah extension point in-process untuk plugin OpenClaw. Gunakan hook ini
saat plugin perlu memeriksa atau mengubah eksekusi agen, panggilan tool, alur pesan,
siklus hidup sesi, perutean subagen, instalasi, atau startup Gateway.

Gunakan [hook internal](/id/automation/hooks) sebagai gantinya saat Anda menginginkan
skrip `HOOK.md` kecil yang dipasang operator untuk perintah dan peristiwa Gateway seperti
`/new`, `/reset`, `/stop`, `agent:bootstrap`, atau `gateway:startup`.

## Mulai cepat

Daftarkan hook plugin bertipe dengan `api.on(...)` dari entry plugin Anda:

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

Handler hook berjalan secara berurutan dalam `priority` menurun. Hook dengan
prioritas yang sama mempertahankan urutan pendaftaran.

## Katalog hook

Hook dikelompokkan berdasarkan permukaan yang diperluas. Nama dalam **tebal** menerima
hasil keputusan (block, cancel, override, atau require approval); yang lainnya hanya untuk observasi.

**Giliran agen**

- `before_model_resolve` — override provider atau model sebelum pesan sesi dimuat
- `before_prompt_build` — tambahkan konteks dinamis atau teks system prompt sebelum pemanggilan model
- `before_agent_start` — fase gabungan hanya untuk kompatibilitas; utamakan dua hook di atas
- **`before_agent_reply`** — short-circuit giliran model dengan balasan sintetis atau kesunyian
- **`before_agent_finalize`** — periksa jawaban final alami dan minta satu pass model lagi
- `agent_end` — amati pesan final, status keberhasilan, dan durasi eksekusi

**Observasi percakapan**

- `model_call_started` / `model_call_ended` — amati metadata panggilan provider/model yang sudah disanitasi, waktu, hasil, dan hash request-id terbatas tanpa konten prompt atau respons
- `llm_input` — amati input provider (system prompt, prompt, riwayat)
- `llm_output` — amati output provider

**Tool**

- **`before_tool_call`** — tulis ulang params tool, blokir eksekusi, atau minta approval
- `after_tool_call` — amati hasil tool, error, dan durasi
- **`tool_result_persist`** — tulis ulang pesan asisten yang dihasilkan dari hasil tool
- **`before_message_write`** — periksa atau blokir penulisan pesan yang sedang berlangsung (jarang)

**Pesan dan pengiriman**

- **`inbound_claim`** — klaim pesan masuk sebelum perutean agen (balasan sintetis)
- `message_received` — amati konten masuk, pengirim, thread, dan metadata
- **`message_sending`** — tulis ulang konten keluar atau batalkan pengiriman
- `message_sent` — amati keberhasilan atau kegagalan pengiriman keluar
- **`before_dispatch`** — periksa atau tulis ulang dispatch keluar sebelum handoff channel
- **`reply_dispatch`** — berpartisipasi dalam pipeline dispatch balasan final

**Sesi dan Compaction**

- `session_start` / `session_end` — lacak batas siklus hidup sesi
- `before_compaction` / `after_compaction` — amati atau beri anotasi siklus Compaction
- `before_reset` — amati peristiwa reset sesi (`/reset`, reset terprogram)

**Subagen**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — koordinasikan perutean subagen dan pengiriman penyelesaian

**Siklus hidup**

- `gateway_start` / `gateway_stop` — mulai atau hentikan layanan milik plugin bersama Gateway
- **`before_install`** — periksa pemindaian instalasi skill atau plugin dan opsional memblokir

## Kebijakan panggilan tool

`before_tool_call` menerima:

- `event.toolName`
- `event.params`
- opsional `event.runId`
- opsional `event.toolCallId`
- field konteks seperti `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (diatur pada eksekusi yang dipicu Cron), dan diagnostik `ctx.trace`

Hook ini dapat mengembalikan:

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
- `block: false` diperlakukan sebagai tidak ada keputusan.
- `params` menulis ulang parameter tool untuk eksekusi.
- `requireApproval` menjeda eksekusi agen dan meminta pengguna melalui
  approval plugin. Perintah `/approve` dapat menyetujui approval exec maupun plugin.
- `block: true` dengan prioritas lebih rendah tetap dapat memblokir setelah hook dengan prioritas lebih tinggi
  meminta approval.
- `onResolution` menerima keputusan approval yang telah diselesaikan — `allow-once`,
  `allow-always`, `deny`, `timeout`, atau `cancelled`.

### Persistensi hasil tool

Hasil tool dapat menyertakan `details` terstruktur untuk rendering UI, diagnostik,
perutean media, atau metadata milik plugin. Perlakukan `details` sebagai metadata runtime,
bukan konten prompt:

- OpenClaw menghapus `toolResult.details` sebelum replay provider dan input Compaction
  agar metadata tidak menjadi konteks model.
- Entri sesi yang dipersistenkan hanya menyimpan `details` yang terbatas. Details yang terlalu besar
  diganti dengan ringkasan ringkas dan `persistedDetailsTruncated: true`.
- `tool_result_persist` dan `before_message_write` berjalan sebelum batas
  persistensi final. Hook tetap harus menjaga `details` yang dikembalikan tetap kecil dan menghindari
  menaruh teks yang relevan untuk prompt hanya di `details`; letakkan output tool yang terlihat model
  di `content`.

## Hook prompt dan model

Gunakan hook spesifik fase untuk plugin baru:

- `before_model_resolve`: hanya menerima prompt saat ini dan
  metadata lampiran. Kembalikan `providerOverride` atau `modelOverride`.
- `before_prompt_build`: menerima prompt saat ini dan pesan sesi.
  Kembalikan `prependContext`, `systemPrompt`, `prependSystemContext`, atau
  `appendSystemContext`.

`before_agent_start` tetap ada untuk kompatibilitas. Utamakan hook eksplisit di atas
agar plugin Anda tidak bergantung pada fase gabungan lama.

`before_agent_start` dan `agent_end` menyertakan `event.runId` saat OpenClaw dapat
mengidentifikasi eksekusi aktif. Nilai yang sama juga tersedia pada `ctx.runId`.
Eksekusi yang dipicu Cron juga mengekspos `ctx.jobId` (id pekerjaan Cron asal) agar
hook plugin dapat membatasi metrik, efek samping, atau status ke
pekerjaan terjadwal tertentu.

Gunakan `model_call_started` dan `model_call_ended` untuk telemetri panggilan provider
yang seharusnya tidak menerima prompt mentah, riwayat, respons, header, body permintaan,
atau request ID provider. Hook ini menyertakan metadata stabil seperti
`runId`, `callId`, `provider`, `model`, opsional `api`/`transport`, terminal
`durationMs`/`outcome`, dan `upstreamRequestIdHash` saat OpenClaw dapat menurunkan
hash request-id provider yang terbatas.

`before_agent_finalize` hanya berjalan saat harness akan menerima jawaban asisten final alami. Hook ini bukan jalur pembatalan `/stop` dan tidak
berjalan saat pengguna membatalkan giliran. Kembalikan `{ action: "revise", reason }` untuk meminta
harness melakukan satu pass model lagi sebelum finalisasi, `{ action:
"finalize", reason? }` untuk memaksa finalisasi, atau hilangkan hasil untuk melanjutkan.
Hook native `Stop` Codex diteruskan ke hook ini sebagai keputusan OpenClaw
`before_agent_finalize`.

Plugin non-bundled yang memerlukan `llm_input`, `llm_output`,
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

Hook yang memodifikasi prompt dapat dinonaktifkan per plugin dengan
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Hook pesan

Gunakan hook pesan untuk perutean tingkat channel dan kebijakan pengiriman:

- `message_received`: amati konten masuk, pengirim, `threadId`, `messageId`,
  `senderId`, korelasi eksekusi/sesi opsional, dan metadata.
- `message_sending`: tulis ulang `content` atau kembalikan `{ cancel: true }`.
- `message_sent`: amati keberhasilan atau kegagalan final.

Untuk balasan TTS hanya-audio, `content` dapat berisi transkrip lisan tersembunyi
meskipun payload channel tidak memiliki teks/caption yang terlihat. Menulis ulang
`content` itu hanya memperbarui transkrip yang terlihat oleh hook; teks itu tidak dirender sebagai
caption media.

Konteks hook pesan mengekspos field korelasi stabil saat tersedia:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, dan `ctx.callDepth`. Utamakan
field first-class ini sebelum membaca metadata lama.

Utamakan field bertipe `threadId` dan `replyToId` sebelum menggunakan
metadata khusus channel.

Aturan keputusan:

- `message_sending` dengan `cancel: true` bersifat terminal.
- `message_sending` dengan `cancel: false` diperlakukan sebagai tidak ada keputusan.
- `content` yang ditulis ulang berlanjut ke hook dengan prioritas lebih rendah kecuali hook
  yang lebih akhir membatalkan pengiriman.

## Hook instalasi

`before_install` berjalan setelah pemindaian bawaan untuk instalasi skill dan plugin.
Kembalikan temuan tambahan atau `{ block: true, blockReason }` untuk menghentikan
instalasi.

`block: true` bersifat terminal. `block: false` diperlakukan sebagai tidak ada keputusan.

## Siklus hidup Gateway

Gunakan `gateway_start` untuk layanan plugin yang memerlukan status milik Gateway. Konteks
mengekspos `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk
pemeriksaan dan pembaruan Cron. Gunakan `gateway_stop` untuk membersihkan resource yang berjalan lama.

Jangan bergantung pada hook internal `gateway:startup` untuk layanan runtime milik plugin.

## Depresiasi yang akan datang

Beberapa permukaan yang berdekatan dengan hook sudah deprecated tetapi masih didukung. Lakukan migrasi
sebelum rilis mayor berikutnya:

- **Envelope channel plaintext** dalam handler `inbound_claim` dan `message_received`.
  Baca `BodyForAgent` dan blok konteks pengguna terstruktur
  alih-alih mengurai teks envelope datar. Lihat
  [Plaintext channel envelopes → BodyForAgent](/id/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** tetap ada untuk kompatibilitas. Plugin baru seharusnya menggunakan
  `before_model_resolve` dan `before_prompt_build` alih-alih
  fase gabungan.
- **`onResolution` di `before_tool_call`** sekarang menggunakan union bertipe
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) alih-alih `string` bentuk bebas.

Untuk daftar lengkap — pendaftaran capability memori, profil
thinking provider, provider auth eksternal, tipe discovery provider, accessor runtime task, dan penggantian nama `command-auth` → `command-status` — lihat
[Plugin SDK migration → Active deprecations](/id/plugins/sdk-migration#active-deprecations).

## Terkait

- [Plugin SDK migration](/id/plugins/sdk-migration) — depresiasi aktif dan timeline penghapusan
- [Membangun plugin](/id/plugins/building-plugins)
- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
- [Plugin entry points](/id/plugins/sdk-entrypoints)
- [Hook internal](/id/automation/hooks)
- [Arsitektur internal Plugin](/id/plugins/architecture-internals)
