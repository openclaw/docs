---
read_when:
    - Refaktorisasi perilaku pengiriman atau penerimaan saluran
    - Mengubah giliran saluran, pengiriman balasan, antrean keluar, streaming pratinjau, atau API pesan SDK Plugin
    - Merancang Plugin kanal baru yang membutuhkan pengiriman persisten, tanda terima, pratinjau, pengeditan, atau percobaan ulang
summary: Rencana desain untuk siklus hidup terpadu dan tahan lama bagi penerimaan, pengiriman, pratinjau, penyuntingan, dan pengaliran pesan
title: Refaktor siklus hidup pesan
x-i18n:
    generated_at: "2026-05-10T19:31:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Halaman ini adalah desain target untuk mengganti helper giliran channel, pengiriman
balasan, streaming pratinjau, dan pengiriman keluar yang tersebar dengan satu
siklus hidup pesan yang tahan lama.

Versi singkatnya:

- Primitif inti harus berupa **terima** dan **kirim**, bukan **balas**.
- Balasan hanya merupakan relasi pada pesan keluar.
- Giliran adalah kemudahan pemrosesan masuk, bukan pemilik pengiriman.
- Pengiriman harus berbasis konteks: `begin`, render, pratinjau atau stream, kirim akhir,
  commit, gagal.
- Penerimaan juga harus berbasis konteks: normalisasi, dedupe, route, catat,
  dispatch, ack platform, gagal.
- SDK Plugin publik harus diringkas menjadi satu permukaan kecil untuk pesan channel.

## Masalah

Stack channel saat ini tumbuh dari beberapa kebutuhan lokal yang valid:

- Adapter masuk sederhana menggunakan `runtime.channel.turn.run`.
- Adapter kaya menggunakan `runtime.channel.turn.runPrepared`.
- Helper lama menggunakan `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, helper payload balasan, pemotongan balasan,
  referensi balasan, dan helper runtime keluar.
- Streaming pratinjau berada di dispatcher khusus channel.
- Durabilitas pengiriman akhir sedang ditambahkan di sekitar path payload balasan yang ada.

Bentuk itu memperbaiki bug lokal, tetapi membuat OpenClaw memiliki terlalu banyak
konsep publik dan terlalu banyak tempat tempat semantik pengiriman dapat menyimpang.

Masalah keandalan yang mengungkap hal ini adalah:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Invarian target lebih luas daripada Telegram: setelah core memutuskan bahwa
pesan keluar yang terlihat harus ada, intent-nya harus tahan lama sebelum
pengiriman platform dicoba, dan receipt platform harus di-commit setelah berhasil.
Ini memberi OpenClaw pemulihan at-least-once. Perilaku exactly-once hanya ada
untuk adapter yang dapat membuktikan idempotensi native atau merekonsiliasi
percobaan unknown-after-send terhadap status platform sebelum replay.

Itulah keadaan akhir untuk refactor ini, bukan deskripsi setiap path saat ini.
Selama migrasi, helper keluar yang ada masih dapat jatuh ke pengiriman langsung
ketika penulisan antrean best-effort gagal. Refactor selesai hanya ketika
pengiriman akhir yang tahan lama gagal secara tertutup atau secara eksplisit opt out
dengan kebijakan non-durable yang terdokumentasi.

## Tujuan

- Satu siklus hidup core untuk semua path terima dan kirim pesan channel.
- Pengiriman akhir yang tahan lama secara default dalam siklus hidup pesan baru setelah adapter
  mendeklarasikan perilaku yang aman untuk replay.
- Semantik pratinjau, edit, stream, finalisasi, retry, pemulihan, dan receipt
  bersama.
- Permukaan SDK Plugin kecil yang dapat dipelajari dan dipelihara oleh Plugin pihak ketiga.
- Kompatibilitas untuk pemanggil `channel.turn` yang ada selama migrasi.
- Titik ekstensi yang jelas untuk kapabilitas channel baru.
- Tidak ada cabang khusus platform di core.
- Tidak ada pesan channel token-delta. Streaming channel tetap berupa pratinjau pesan,
  edit, append, atau pengiriman blok selesai.
- Metadata asal OpenClaw terstruktur untuk output operasional/sistem agar kegagalan
  Gateway yang terlihat tidak masuk kembali ke ruang bersama yang mengaktifkan bot sebagai prompt baru.

## Bukan tujuan

- Jangan hapus `runtime.channel.turn.*` pada fase pertama.
- Jangan paksa setiap channel ke perilaku transport native yang sama.
- Jangan ajarkan core topik Telegram, stream native Slack, redaksi Matrix,
  kartu Feishu, suara QQ, atau aktivitas Teams.
- Jangan publikasikan semua helper migrasi internal sebagai API SDK stabil.
- Jangan buat retry me-replay operasi platform non-idempoten yang sudah selesai.

## Model referensi

Vercel Chat memiliki model mental publik yang baik:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- metode adapter seperti `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping`, dan pengambilan riwayat
- adapter status untuk dedupe, lock, antrean, dan persistensi

OpenClaw sebaiknya meminjam kosakatanya, bukan menyalin permukaannya.

Yang dibutuhkan OpenClaw di luar model itu:

- Intent pengiriman keluar yang tahan lama sebelum panggilan transport langsung.
- Konteks pengiriman eksplisit dengan begin, commit, dan fail.
- Konteks penerimaan yang mengetahui kebijakan ack platform.
- Receipt yang bertahan setelah restart dan dapat mendorong edit, hapus, pemulihan, dan
  penekanan duplikat.
- SDK publik yang lebih kecil. Plugin bawaan dapat menggunakan helper runtime internal, tetapi
  Plugin pihak ketiga harus melihat satu API pesan yang koheren.
- Perilaku khusus agen: sesi, transkrip, streaming blok, progres tool,
  approval, direktif media, balasan senyap, dan riwayat mention grup.

Promise gaya `thread.post()` tidak cukup untuk OpenClaw. Promise tersebut menyembunyikan
batas transaksi yang menentukan apakah pengiriman dapat dipulihkan.

## Model core

Domain baru harus berada di bawah namespace core internal seperti
`src/channels/message/*`.

Domain ini memiliki empat konsep:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` memiliki siklus hidup masuk.

`send` memiliki siklus hidup keluar.

`live` memiliki status pratinjau, edit, progres, dan stream.

`state` memiliki penyimpanan intent tahan lama, receipt, idempotensi, pemulihan, lock, dan
dedupe.

## Istilah pesan

### Pesan

Pesan yang dinormalisasi bersifat netral platform:

```typescript
type ChannelMessage = {
  id: string;
  channel: string;
  accountId?: string;
  direction: "inbound" | "outbound";
  target: MessageTarget;
  sender?: MessageActor;
  body?: MessageBody;
  attachments?: MessageAttachment[];
  relation?: MessageRelation;
  origin?: MessageOrigin;
  timestamp?: number;
  raw?: unknown;
};
```

### Target

Target menjelaskan tempat pesan berada:

```typescript
type MessageTarget = {
  kind: "direct" | "group" | "channel" | "thread";
  id: string;
  label?: string;
  spaceId?: string;
  parentId?: string;
  threadId?: string;
  nativeChannelId?: string;
};
```

### Relasi

Balasan adalah relasi, bukan akar API:

```typescript
type MessageRelation =
  | {
      kind: "reply";
      inboundMessageId?: string;
      replyToId?: string;
      threadId?: string;
      quote?: MessageQuote;
    }
  | {
      kind: "followup";
      sessionKey?: string;
      previousMessageId?: string;
    }
  | {
      kind: "broadcast";
      reason?: string;
    }
  | {
      kind: "system";
      reason:
        | "approval"
        | "task"
        | "hook"
        | "cron"
        | "subagent"
        | "message_tool"
        | "cli"
        | "control_ui"
        | "automation"
        | "error";
    };
```

Ini memungkinkan path pengiriman yang sama menangani balasan normal, notifikasi cron, prompt
approval, penyelesaian tugas, pengiriman message-tool, pengiriman CLI atau Control UI, hasil subagent,
dan pengiriman otomasi.

### Asal

Asal menjelaskan siapa yang menghasilkan pesan dan bagaimana OpenClaw harus memperlakukan echo dari
pesan tersebut. Ini terpisah dari relasi: sebuah pesan dapat berupa balasan kepada pengguna
dan tetap merupakan output operasional yang berasal dari OpenClaw.

```typescript
type MessageOrigin =
  | {
      source: "openclaw";
      schemaVersion: 1;
      kind: "gateway_failure";
      code: "agent_failed_before_reply" | "missing_api_key" | "model_login_expired";
      echoPolicy: "drop_bot_room_echo";
    }
  | {
      source: "user" | "external_bot" | "platform" | "unknown";
    };
```

Core memiliki makna output yang berasal dari OpenClaw. Channel memiliki cara asal tersebut
dienkode ke dalam transport mereka.

Penggunaan pertama yang diwajibkan adalah output kegagalan Gateway. Manusia tetap harus melihat
pesan seperti "Agen gagal sebelum membalas" atau "Kunci API hilang", tetapi output operasional
OpenClaw yang diberi tag tidak boleh diterima sebagai input yang ditulis bot di ruang bersama
ketika `allowBots` diaktifkan.

### Receipt

Receipt adalah kelas utama:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  sentAt: number;
  raw?: unknown;
};

type MessageReceiptPart = {
  platformMessageId: string;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  index: number;
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  raw?: unknown;
};
```

Receipt adalah jembatan dari intent tahan lama ke edit, hapus, finalisasi pratinjau,
penekanan duplikat, dan pemulihan di masa depan.

Sebuah receipt dapat menjelaskan satu pesan platform atau pengiriman multi-bagian. Teks yang
dipotong-potong, media plus teks, suara plus teks, dan fallback kartu harus mempertahankan semua
id platform sambil tetap mengekspos id utama untuk threading dan edit berikutnya.

## Konteks penerimaan

Penerimaan sebaiknya bukan pemanggilan helper polos. Core membutuhkan konteks yang mengetahui
dedupe, routing, pencatatan sesi, dan kebijakan ack platform.

```typescript
type MessageReceiveContext = {
  id: string;
  channel: string;
  accountId?: string;
  input: ChannelMessage;
  ack: ReceiveAckController;
  route: MessageRouteController;
  session: MessageSessionController;
  log: MessageLifecycleLogger;

  dedupe(): Promise<ReceiveDedupeResult>;
  resolve(): Promise<ResolvedInboundMessage>;
  record(resolved: ResolvedInboundMessage): Promise<RecordResult>;
  dispatch(recorded: RecordResult): Promise<DispatchResult>;
  commit(result: DispatchResult): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Alur penerimaan:

```text
platform event
  -> begin receive context
  -> normalize
  -> classify
  -> dedupe and self-echo gate
  -> route and authorize
  -> record inbound session metadata
  -> dispatch agent run
  -> durable outbound sends happen through send context
  -> commit receive
  -> ack platform when policy allows
```

Ack bukan satu hal. Kontrak penerimaan harus menjaga sinyal-sinyal ini tetap terpisah:

- **Ack transport:** memberi tahu webhook atau socket platform bahwa OpenClaw menerima
  envelope event. Beberapa platform mewajibkan ini sebelum dispatch.
- **Ack offset polling:** memajukan cursor agar event yang sama tidak diambil
  lagi. Ini tidak boleh melewati pekerjaan yang tidak dapat dipulihkan.
- **Ack record masuk:** mengonfirmasi OpenClaw telah mempersistensikan metadata masuk yang cukup untuk
  dedupe dan route redelivery.
- **Receipt yang terlihat pengguna:** perilaku baca/status/typing opsional; tidak pernah menjadi
  batas durabilitas.

`ReceiveAckPolicy` hanya mengontrol acknowledgement transport atau polling. Ini tidak boleh
digunakan ulang untuk receipt baca atau reaksi status.

Sebelum otorisasi bot, receive harus menerapkan kebijakan echo OpenClaw bersama
ketika channel dapat mendekode metadata asal pesan:

```typescript
function shouldDropOpenClawEcho(params: {
  origin?: MessageOrigin;
  isBotAuthor: boolean;
  isRoomish: boolean;
}): boolean {
  return (
    params.isBotAuthor &&
    params.isRoomish &&
    params.origin?.source === "openclaw" &&
    params.origin.kind === "gateway_failure" &&
    params.origin.echoPolicy === "drop_bot_room_echo"
  );
}
```

Drop ini berbasis tag, bukan berbasis teks. Pesan ruang yang ditulis bot dengan
teks kegagalan Gateway terlihat yang sama tetapi tanpa metadata asal OpenClaw tetap
melewati otorisasi `allowBots` normal.

Kebijakan ack bersifat eksplisit:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Polling Telegram kini menggunakan kebijakan ack konteks penerimaan untuk watermark restart yang dipersistensikan.
Tracker masih mengamati pembaruan grammY saat masuk ke chain middleware, tetapi OpenClaw hanya mempersistensikan id pembaruan selesai yang aman setelah
dispatch berhasil, sehingga pembaruan yang gagal atau tertunda lebih rendah dapat di-replay setelah
restart. Offset pengambilan `getUpdates` upstream Telegram masih dikontrol oleh
library polling, jadi potongan yang lebih dalam yang tersisa adalah sumber polling yang sepenuhnya tahan lama
jika kita membutuhkan redelivery tingkat platform di luar watermark restart
OpenClaw. Platform webhook mungkin membutuhkan ack HTTP langsung, tetapi tetap membutuhkan
dedupe masuk dan intent pengiriman keluar yang tahan lama karena webhook dapat melakukan redelivery.

## Konteks pengiriman

Pengiriman juga berbasis konteks:

```typescript
type MessageSendContext = {
  id: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  intent: DurableSendIntent;
  attempt: number;
  signal: AbortSignal;
  previousReceipt?: MessageReceipt;
  preview?: LiveMessageState;
  log: MessageLifecycleLogger;

  render(): Promise<RenderedMessageBatch>;
  previewUpdate(rendered: RenderedMessageBatch): Promise<LiveMessageState>;
  send(rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit(receipt: MessageReceipt, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  delete(receipt: MessageReceipt): Promise<void>;
  commit(receipt: MessageReceipt): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Orkestrasi yang disarankan:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

Pembantu ini diperluas menjadi:

```text
begin durable intent
  -> render
  -> optional preview/edit/stream work
  -> mark sending
  -> final platform send or final edit
  -> mark committing with raw receipt
  -> commit receipt
  -> ack durable intent
  -> fail durable intent on classified failure
```

Intent harus ada sebelum I/O transport. Restart setelah mulai tetapi sebelum
commit dapat dipulihkan.

Batas berbahaya ada setelah keberhasilan platform dan sebelum commit tanda terima. Jika sebuah
proses mati di sana, OpenClaw tidak dapat mengetahui apakah pesan platform ada
kecuali adaptor menyediakan idempotensi native atau jalur rekonsiliasi tanda terima.
Upaya tersebut harus dilanjutkan di `unknown_after_send`, bukan diputar ulang secara membabi buta. Kanal
tanpa rekonsiliasi boleh memilih pemutaran ulang at-least-once hanya jika pesan
duplikat yang terlihat adalah tradeoff yang dapat diterima dan terdokumentasi untuk kanal dan relasi tersebut.
Jembatan rekonsiliasi SDK saat ini mengharuskan adaptor mendeklarasikan
`reconcileUnknownSend`, lalu meminta `durableFinal.reconcileUnknownSend` untuk
mengklasifikasikan entri tidak dikenal sebagai `sent`, `not_sent`, atau `unresolved`; hanya `not_sent`
yang mengizinkan pemutaran ulang, dan entri yang belum terselesaikan tetap terminal atau hanya mencoba ulang
pemeriksaan rekonsiliasi.

Kebijakan durabilitas harus eksplisit:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` berarti inti harus gagal tertutup ketika tidak dapat menulis intent tahan lama.
`best_effort` dapat melanjutkan ketika persistensi tidak tersedia. `disabled` mempertahankan
perilaku pengiriman langsung lama. Selama migrasi, wrapper lama dan pembantu
kompatibilitas publik default ke `disabled`; keduanya tidak boleh menyimpulkan `required` dari
fakta bahwa sebuah kanal memiliki adaptor keluar generik.

Konteks pengiriman juga memiliki efek pascakirim lokal kanal. Migrasi tidak aman
jika pengiriman tahan lama melewati perilaku lokal yang sebelumnya melekat pada
jalur pengiriman langsung kanal. Contohnya mencakup cache supresi self-echo,
penanda partisipasi thread, anchor edit native, rendering tanda tangan model,
dan guard duplikat khusus platform. Efek tersebut harus dipindahkan ke
adaptor pengiriman, adaptor render, atau hook konteks pengiriman bernama sebelum
kanal tersebut dapat mengaktifkan pengiriman final generik yang tahan lama.

Pembantu pengiriman harus mengembalikan tanda terima sepenuhnya sampai ke pemanggilnya. Wrapper
tahan lama tidak boleh menelan id pesan atau mengganti hasil pengiriman kanal dengan
`undefined`; dispatcher berbuffer menggunakan id tersebut untuk anchor thread, edit berikutnya,
finalisasi pratinjau, dan supresi duplikat.

Pengiriman fallback beroperasi pada batch, bukan payload tunggal. Penulisan ulang silent-reply,
fallback media, fallback kartu, dan proyeksi chunk semuanya dapat menghasilkan lebih dari
satu pesan yang dapat dikirim, sehingga konteks pengiriman harus mengirimkan seluruh
batch terproyeksi atau secara eksplisit mendokumentasikan mengapa hanya satu payload yang valid.

```typescript
type RenderedMessageBatch = {
  units: RenderedMessageUnit[];
  atomicity: "all_or_retry_remaining" | "best_effort_parts";
  idempotencyKey: string;
};

type RenderedMessageUnit = {
  index: number;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  payload: unknown;
  required: boolean;
};
```

Ketika fallback seperti itu tahan lama, seluruh batch terproyeksi harus direpresentasikan oleh
satu intent pengiriman tahan lama atau rencana batch atomik lain. Mencatat setiap payload
satu per satu tidak cukup: crash di antara payload dapat meninggalkan fallback terlihat
sebagian tanpa catatan tahan lama untuk payload yang tersisa. Pemulihan harus mengetahui
unit mana yang sudah memiliki tanda terima dan apakah hanya memutar ulang unit yang hilang atau menandai
batch sebagai `unknown_after_send` sampai adaptor merekonsiliasinya.

## Konteks live

Perilaku pratinjau, edit, progres, dan stream sebaiknya menjadi satu siklus hidup opt-in.

```typescript
type MessageLiveAdapter = {
  begin?(ctx: MessageSendContext): Promise<LiveMessageState>;
  update?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    update: LiveMessageUpdate,
  ): Promise<LiveMessageState>;
  finalize?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    final: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  cancel?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    reason: LiveCancelReason,
  ): Promise<void>;
};
```

Status live cukup tahan lama untuk memulihkan atau menekan duplikat:

```typescript
type LiveMessageState = {
  mode: "partial" | "block" | "progress" | "native";
  receipt?: MessageReceipt;
  visibleSince?: number;
  canFinalizeInPlace: boolean;
  lastRenderedHash?: string;
  staleAfterMs?: number;
};
```

Ini seharusnya mencakup perilaku saat ini:

- Pengiriman Telegram plus pratinjau edit, dengan final baru setelah usia pratinjau basi.
- Pengiriman Discord plus pratinjau edit, batal pada media/error/balasan eksplisit.
- Stream native Slack atau pratinjau draf bergantung pada bentuk thread.
- Finalisasi posting draf Mattermost.
- Finalisasi event draf Matrix atau redaksi saat tidak cocok.
- Stream progres native Teams.
- Stream QQ Bot atau fallback terakumulasi.

## Permukaan adaptor

Target SDK publik sebaiknya berupa satu subjalur:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
```

Bentuk target:

```typescript
type ChannelMessageAdapter = {
  receive?: MessageReceiveAdapter;
  send: MessageSendAdapter;
  live?: MessageLiveAdapter;
  origin?: MessageOriginAdapter;
  render?: MessageRenderAdapter;
  capabilities: MessageCapabilities;
};
```

Adaptor pengiriman:

```typescript
type MessageSendAdapter = {
  send(ctx: MessageSendContext, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit?(
    ctx: MessageSendContext,
    receipt: MessageReceipt,
    rendered: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  delete?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  classifyError?(ctx: MessageSendContext, error: unknown): DeliveryFailureKind;
  reconcileUnknownSend?(ctx: MessageSendContext): Promise<MessageReceipt | null>;
  afterSendSuccess?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  afterCommit?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
};
```

Adaptor penerimaan:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Sebelum otorisasi preflight, inti harus menjalankan predikat echo OpenClaw bersama
setiap kali `origin.decode` mengembalikan metadata asal OpenClaw. Adaptor penerimaan
menyediakan fakta platform seperti penulis bot dan bentuk ruang; inti memiliki keputusan
drop dan pengurutan sehingga kanal tidak mengimplementasikan ulang filter teks.

Adaptor asal:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Inti menetapkan `MessageOrigin`. Kanal hanya menerjemahkannya ke dan dari metadata
transport native. Slack memetakannya ke `chat.postMessage({ metadata })` dan
`message.metadata` masuk; Matrix dapat memetakannya ke konten event tambahan; kanal
tanpa metadata native dapat menggunakan registry tanda terima/keluar ketika itu adalah
pendekatan terbaik yang tersedia.

Kapabilitas:

```typescript
type MessageCapabilities = {
  text: { maxLength?: number; chunking?: boolean };
  attachments?: {
    upload: boolean;
    remoteUrl: boolean;
    voice?: boolean;
  };
  threads?: {
    reply: boolean;
    topic?: boolean;
    nativeThread?: boolean;
  };
  live?: {
    edit: boolean;
    delete: boolean;
    nativeStream?: boolean;
    progress?: boolean;
  };
  delivery?: {
    idempotencyKey?: boolean;
    retryAfter?: boolean;
    receiptRequired?: boolean;
  };
};
```

## Pengurangan SDK publik

Permukaan publik baru sebaiknya menyerap atau menghentikan area konseptual ini:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- sebagian besar penggunaan publik `outbound-runtime`
- pembantu siklus hidup stream draf ad hoc

Subjalur kompatibilitas dapat tetap ada sebagai wrapper, tetapi plugin pihak ketiga baru
seharusnya tidak membutuhkannya.

Plugin bundel dapat mempertahankan impor pembantu internal melalui subjalur runtime
terreservasi saat bermigrasi. Dokumentasi publik sebaiknya mengarahkan penulis plugin ke
`plugin-sdk/channel-message` setelah tersedia.

## Hubungan dengan giliran kanal

`runtime.channel.turn.*` sebaiknya tetap ada selama migrasi.

Itu sebaiknya menjadi adaptor kompatibilitas:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` juga sebaiknya tetap ada pada awalnya:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Setelah semua plugin bundel dan jalur kompatibilitas pihak ketiga yang diketahui dijembatani,
`channel.turn` dapat dihentikan. Itu tidak boleh dihapus sampai ada
jalur migrasi SDK yang dipublikasikan dan pengujian kontrak yang membuktikan plugin lama masih berfungsi
atau gagal dengan error versi yang jelas.

## Guardrail kompatibilitas

Selama migrasi, pengiriman tahan lama generik bersifat opt-in untuk setiap kanal yang
callback pengiriman yang ada memiliki efek samping selain "kirim payload ini".

Titik masuk lama bersifat tidak tahan lama secara default:

- `channel.turn.run` dan `dispatchAssembledChannelTurn` menggunakan callback
  pengiriman kanal kecuali kanal tersebut secara eksplisit menyediakan objek kebijakan/opsi tahan lama
  yang telah diaudit.
- `channel.turn.runPrepared` tetap dimiliki kanal sampai dispatcher yang disiapkan
  secara eksplisit memanggil konteks pengiriman.
- Pembantu kompatibilitas publik seperti `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase`, dan pembantu direct-DM tidak pernah menyuntikkan pengiriman
  tahan lama generik sebelum callback `deliver` atau `reply` yang disediakan pemanggil.

Untuk tipe jembatan migrasi, `durable: undefined` berarti "tidak tahan lama". Jalur
tahan lama diaktifkan hanya oleh nilai kebijakan/opsi eksplisit. `durable:
false` dapat tetap ada sebagai ejaan kompatibilitas, tetapi implementasi tidak boleh
mengharuskan setiap kanal yang belum bermigrasi menambahkannya.

Kode jembatan saat ini harus menjaga keputusan durabilitas tetap eksplisit:

- Pengiriman final persisten mengembalikan status terdiskriminasi. `handled_visible` dan
  `handled_no_send` bersifat terminal; `unsupported` dan `not_applicable` dapat
  fallback ke pengiriman yang dimiliki saluran; `failed` meneruskan kegagalan pengiriman.
- Pengiriman final persisten generik dibatasi oleh kapabilitas adaptor seperti
  pengiriman senyap, pelestarian target balasan, pelestarian kutipan native, dan
  hook pengiriman pesan. Paritas yang hilang harus memilih pengiriman yang dimiliki saluran,
  bukan pengiriman generik yang mengubah perilaku yang terlihat oleh pengguna.
- Pengiriman persisten berbasis antrean mengekspos referensi intent pengiriman. Kolom sesi
  `pendingFinalDelivery*` yang sudah ada dapat membawa id intent selama
  transisi; keadaan akhirnya adalah penyimpanan `MessageSendIntent`, bukan teks
  balasan beku plus kolom konteks ad hoc.

Jangan aktifkan jalur persisten generik untuk suatu saluran sampai semua hal ini
benar:

- Adaptor pengiriman generik menjalankan perilaku rendering dan transport yang sama seperti
  jalur langsung lama.
- Efek samping lokal pasca-pengiriman dipertahankan melalui konteks pengiriman.
- Adaptor mengembalikan tanda terima atau hasil pengiriman dengan semua id pesan platform.
- Jalur dispatcher yang disiapkan memanggil konteks pengiriman baru atau tetap didokumentasikan
  sebagai di luar jaminan persisten.
- Pengiriman fallback menangani setiap payload terproyeksi, bukan hanya yang pertama.
- Pengiriman fallback persisten mencatat seluruh array payload terproyeksi sebagai satu
  intent atau rencana batch yang dapat diputar ulang.

Bahaya migrasi konkret yang harus dipertahankan:

- Pengiriman monitor iMessage mencatat pesan terkirim dalam cache echo setelah
  pengiriman berhasil. Pengiriman final persisten tetap harus mengisi cache itu, jika tidak
  OpenClaw dapat menyerap ulang balasan finalnya sendiri sebagai pesan pengguna masuk.
- Tlon menambahkan tanda tangan model opsional dan mencatat thread yang diikuti
  setelah balasan grup. Pengiriman persisten generik tidak boleh melewati efek tersebut;
  pindahkan efek itu ke adaptor render/send/finalize Tlon atau pertahankan Tlon di
  jalur yang dimiliki saluran.
- Discord dan dispatcher lain yang disiapkan sudah memiliki perilaku pengiriman langsung dan pratinjau.
  Mereka tidak tercakup oleh jaminan persisten untuk giliran yang dirakit sampai
  dispatcher yang disiapkan secara eksplisit merutekan final melalui konteks pengiriman.
- Pengiriman fallback senyap Telegram harus mengirimkan seluruh array payload terproyeksi.
  Pintasan satu payload dapat menjatuhkan payload fallback tambahan setelah
  proyeksi.
- LINE, Zalo, Nostr, dan jalur rakitan/pembantu lain yang sudah ada mungkin
  memiliki penanganan token balasan, proxy media, cache pesan terkirim, pembersihan loading/status,
  atau target khusus callback. Semua itu tetap berada pada pengiriman yang dimiliki saluran sampai
  semantik tersebut direpresentasikan oleh adaptor pengiriman dan diverifikasi oleh pengujian.
- Pembantu DM langsung dapat memiliki callback balasan yang merupakan satu-satunya target transport
  yang benar. Outbound generik tidak boleh menebak dari `OriginatingTo` atau `To` dan melewati
  callback tersebut.
- Keluaran kegagalan Gateway OpenClaw harus tetap terlihat oleh manusia, tetapi echo ruang
  bertag yang dibuat bot harus dibuang sebelum otorisasi `allowBots`.
  Saluran tidak boleh mengimplementasikan ini dengan filter prefiks teks terlihat kecuali sebagai
  penghenti darurat singkat; kontrak persisten adalah metadata asal terstruktur.

## Penyimpanan internal

Antrean persisten harus menyimpan intent pengiriman pesan, bukan payload balasan.

```typescript
type DurableSendIntent = {
  id: string;
  idempotencyKey: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  batch?: RenderedMessageBatch;
  liveState?: LiveMessageState;
  status:
    | "pending"
    | "sending"
    | "committing"
    | "unknown_after_send"
    | "sent"
    | "failed"
    | "cancelled";
  attempt: number;
  nextAttemptAt?: number;
  receipt?: MessageReceipt;
  partialReceipt?: MessageReceipt;
  failure?: DeliveryFailure;
  createdAt: number;
  updatedAt: number;
};
```

Loop pemulihan:

```text
load pending or sending intents
  -> acquire idempotency lock
  -> skip if receipt already committed
  -> reconstruct send context
  -> render if needed
  -> reconcile unknown_after_send if needed
  -> call adapter send/edit/finalize
  -> commit receipt, mark unknown_after_send, or schedule retry
```

Antrean harus menyimpan identitas yang cukup untuk memutar ulang melalui akun,
thread, target, kebijakan pemformatan, dan aturan media yang sama setelah restart.

## Kelas kegagalan

Adaptor saluran mengklasifikasikan kegagalan transport ke dalam kategori tertutup:

```typescript
type DeliveryFailureKind =
  | "transient"
  | "rate_limit"
  | "auth"
  | "permission"
  | "not_found"
  | "invalid_payload"
  | "conflict"
  | "cancelled"
  | "unknown";
```

Kebijakan inti:

- Coba ulang `transient` dan `rate_limit`.
- Jangan coba ulang `invalid_payload` kecuali ada fallback render.
- Jangan coba ulang `auth` atau `permission` sampai konfigurasi berubah.
- Untuk `not_found`, izinkan finalisasi langsung fallback dari edit ke pengiriman baru saat
  saluran menyatakan itu aman.
- Untuk `conflict`, gunakan aturan tanda terima/idempotensi untuk memutuskan apakah pesan
  sudah ada.
- Kesalahan apa pun setelah adaptor mungkin telah menyelesaikan I/O platform tetapi sebelum commit
  tanda terima menjadi `unknown_after_send` kecuali adaptor dapat membuktikan operasi platform
  tidak terjadi.

## Pemetaan saluran

| Channel         | Migrasi target                                                                                                                                                                                                                                                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Kebijakan ack penerimaan serta pengiriman final yang tahan lama. Adapter live memiliki pengiriman serta pratinjau edit, pengiriman final pratinjau kedaluwarsa, topik, lewati pratinjau balasan kutipan, fallback media, dan penanganan retry-after.                                                                                                         |
| Discord         | Adapter pengiriman membungkus pengiriman payload tahan lama yang sudah ada. Adapter live memiliki edit draf, draf progres, pembatalan pratinjau media/error, pemeliharaan target balasan, dan tanda terima id pesan. Audit gema gateway-failure buatan bot di ruang bersama; gunakan registry keluar atau padanan native lainnya jika Discord tidak dapat membawa metadata asal pada pesan normal. |
| Slack           | Adapter pengiriman menangani posting chat normal. Adapter live memilih stream native saat bentuk thread mendukungnya, jika tidak maka pratinjau draf. Tanda terima mempertahankan timestamp thread. Adapter asal memetakan kegagalan Gateway OpenClaw ke `chat.postMessage.metadata` Slack dan membuang gema ruang bot bertag sebelum otorisasi `allowBots`.                                  |
| WhatsApp        | Adapter pengiriman memiliki pengiriman teks/media dengan intent final yang tahan lama. Adapter penerimaan menangani mention grup dan identitas pengirim. Live dapat tetap tidak ada sampai WhatsApp memiliki transport yang dapat diedit.                                                                                                                                                                        |
| Matrix          | Adapter live memiliki edit event draf, finalisasi, redaksi, batasan media terenkripsi, dan fallback ketidakcocokan target balasan. Adapter penerimaan memiliki hidrasi event terenkripsi dan dedupe. Adapter asal harus mengodekan asal gateway-failure OpenClaw ke dalam konten event Matrix dan membuang gema ruang bot yang dikonfigurasi sebelum penanganan `allowBots`.              |
| Mattermost      | Adapter live memiliki satu posting draf, pelipatan progres/tool, finalisasi di tempat, dan fallback pengiriman baru.                                                                                                                                                                                                                                                       |
| Microsoft Teams | Adapter live memiliki progres native dan perilaku stream blok. Adapter pengiriman memiliki aktivitas dan tanda terima lampiran/kartu.                                                                                                                                                                                                                                        |
| Feishu          | Adapter render memiliki rendering teks/kartu/raw. Adapter live memiliki kartu streaming dan penekanan final duplikat. Adapter pengiriman memiliki komentar, sesi topik, media, dan penekanan suara.                                                                                                                                                                      |
| QQ Bot          | Adapter live memiliki streaming C2C, timeout akumulator, dan pengiriman final fallback. Adapter render memiliki tag media dan teks-sebagai-suara.                                                                                                                                                                                                                               |
| Signal          | Adapter penerimaan plus pengiriman sederhana. Tidak ada adapter live kecuali signal-cli menambahkan dukungan edit yang andal.                                                                                                                                                                                                                                                                |
| iMessage        | Adapter penerimaan plus pengiriman sederhana. Pengiriman iMessage harus mempertahankan pengisian cache gema monitor sebelum final yang tahan lama dapat melewati pengiriman monitor.                                                                                                                                                                                                                 |
| Google Chat     | Adapter penerimaan plus pengiriman sederhana dengan relasi thread yang dipetakan ke space dan id thread. Audit perilaku ruang `allowBots=true` untuk gema gateway-failure OpenClaw bertag.                                                                                                                                                                                        |
| LINE            | Adapter penerimaan plus pengiriman sederhana dengan batasan reply-token yang dimodelkan sebagai kapabilitas target/relasi.                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | Bridge penerimaan SDK plus adapter pengiriman.                                                                                                                                                                                                                                                                                                                          |
| IRC             | Adapter penerimaan plus pengiriman sederhana, tanpa tanda terima edit tahan lama.                                                                                                                                                                                                                                                                                                    |
| Nostr           | Adapter penerimaan plus pengiriman untuk DM terenkripsi; tanda terima adalah id event.                                                                                                                                                                                                                                                                                           |
| QA Channel      | Adapter contract-test untuk perilaku penerimaan, pengiriman, live, retry, dan pemulihan.                                                                                                                                                                                                                                                                                   |
| Synology Chat   | Adapter penerimaan plus pengiriman sederhana.                                                                                                                                                                                                                                                                                                                              |
| Tlon            | Adapter pengiriman harus mempertahankan rendering tanda tangan model dan pelacakan thread yang diikuti sebelum pengiriman final tahan lama generik diaktifkan.                                                                                                                                                                                                                        |
| Twitch          | Adapter penerimaan plus pengiriman sederhana dengan klasifikasi rate-limit.                                                                                                                                                                                                                                                                                               |
| Zalo            | Adapter penerimaan plus pengiriman sederhana.                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal   | Adapter penerimaan plus pengiriman sederhana.                                                                                                                                                                                                                                                                                                                              |

## Rencana migrasi

### Fase 1: Domain Pesan Internal

- Tambahkan tipe `src/channels/message/*` untuk pesan, target, relasi,
  asal, tanda terima, kapabilitas, intent tahan lama, konteks penerimaan, konteks pengiriman,
  konteks live, dan kelas kegagalan.
- Tambahkan `origin?: MessageOrigin` ke tipe payload bridge migrasi yang digunakan oleh
  pengiriman balasan saat ini, lalu pindahkan field itu ke `ChannelMessage` dan tipe pesan
  yang dirender saat refactor menggantikan payload balasan.
- Biarkan ini tetap internal sampai adapter dan pengujian membuktikan bentuknya.
- Tambahkan pengujian unit murni untuk transisi state dan serialisasi.

### Fase 2: Core Pengiriman Tahan Lama

- Pindahkan antrean keluar yang ada dari durabilitas reply-payload ke intent
  pengiriman pesan tahan lama.
- Izinkan intent pengiriman tahan lama membawa array payload terproyeksi atau rencana batch, bukan
  hanya satu payload balasan.
- Pertahankan perilaku pemulihan antrean saat ini melalui konversi kompatibilitas.
- Buat `deliverOutboundPayloads` memanggil `messages.send`.
- Jadikan durabilitas pengiriman final sebagai default dan gagal tertutup saat intent tahan lama
  tidak dapat ditulis dalam siklus hidup pesan baru, setelah adapter mendeklarasikan
  keamanan replay. Jalur kompatibilitas channel-turn dan SDK yang sudah ada tetap
  direct-send secara default selama fase ini.
- Catat tanda terima secara konsisten.
- Kembalikan tanda terima dan hasil pengiriman ke pemanggil dispatcher asli, alih-alih
  memperlakukan pengiriman tahan lama sebagai efek samping terminal.
- Persistenkan asal pesan melalui intent pengiriman tahan lama agar pemulihan, replay, dan
  pengiriman terpotong mempertahankan provenance operasional OpenClaw.

### Fase 3: Bridge Channel Turn

- Implementasikan ulang `channel.turn.run` dan `dispatchAssembledChannelTurn` di atas
  `messages.receive` dan `messages.send`.
- Pertahankan tipe fakta saat ini tetap stabil.
- Pertahankan perilaku legacy secara default. Channel assembled-turn menjadi tahan lama
  hanya saat adapternya secara eksplisit ikut serta dengan kebijakan durabilitas yang aman replay.
- Pertahankan `durable: false` sebagai escape hatch kompatibilitas untuk jalur yang memfinalisasi
  edit native dan belum dapat replay dengan aman, tetapi jangan mengandalkan marker `false`
  untuk melindungi channel yang belum dimigrasikan.
- Jadikan durabilitas assembled-turn default hanya dalam siklus hidup pesan baru, setelah
  pemetaan channel membuktikan bahwa jalur pengiriman generik mempertahankan semantik
  pengiriman channel lama.

### Fase 4: Bridge Dispatcher yang Disiapkan

- Ganti `deliverDurableInboundReplyPayload` dengan jembatan konteks pengiriman.
- Pertahankan helper lama sebagai wrapper.
- Porting Telegram, WhatsApp, Slack, Signal, iMessage, dan Discord terlebih dahulu karena
  semuanya sudah memiliki pekerjaan final-tahan-lama atau jalur pengiriman yang lebih sederhana.
- Perlakukan setiap dispatcher yang disiapkan sebagai belum tercakup sampai secara eksplisit ikut serta dalam
  konteks pengiriman. Dokumentasi dan entri changelog harus mengatakan "turn saluran yang dirakit"
  atau menyebut jalur saluran yang dimigrasikan alih-alih mengklaim semua
  balasan final otomatis.
- Pertahankan perilaku `recordInboundSessionAndDispatchReply`, helper direct-DM, dan helper
  kompatibilitas publik serupa. Helper tersebut dapat mengekspos ikut serta konteks pengiriman
  secara eksplisit nanti, tetapi tidak boleh secara otomatis mencoba pengiriman tahan-lama generik
  sebelum callback pengiriman milik pemanggil.

### Fase 5: Siklus Hidup Live Terpadu

- Bangun `messages.live` dengan dua adapter pembuktian:
  - Telegram untuk kirim plus edit plus kirim final basi.
  - Matrix untuk finalisasi draf plus fallback redaksi.
- Lalu migrasikan Discord, Slack, Mattermost, Teams, QQ Bot, dan Feishu.
- Hapus kode finalisasi pratinjau yang terduplikasi hanya setelah setiap saluran memiliki
  pengujian paritas.

### Fase 6: SDK Publik

- Tambahkan `openclaw/plugin-sdk/channel-message`.
- Dokumentasikan sebagai API Plugin saluran yang disukai.
- Perbarui ekspor paket, inventaris entrypoint, baseline API yang dihasilkan, dan
  dokumentasi SDK Plugin.
- Sertakan `MessageOrigin`, hook encode/decode origin, dan predikat bersama
  `shouldDropOpenClawEcho` di permukaan SDK channel-message.
- Pertahankan wrapper kompatibilitas untuk subpath lama.
- Tandai helper SDK bernama reply sebagai usang dalam dokumentasi setelah Plugin bawaan
  dimigrasikan.

### Fase 7: Semua Pengirim

Pindahkan semua produsen outbound non-reply ke `messages.send`:

- notifikasi Cron dan Heartbeat
- penyelesaian tugas
- hasil hook
- prompt persetujuan dan hasil persetujuan
- pengiriman message tool
- pengumuman penyelesaian subagent
- pengiriman CLI atau UI Kontrol eksplisit
- jalur otomatisasi/broadcast

Di sinilah model berhenti menjadi "balasan agen" dan menjadi "OpenClaw mengirim
pesan".

### Fase 8: Depresiasi Turn

- Pertahankan `channel.turn` sebagai wrapper untuk setidaknya satu jendela kompatibilitas.
- Publikasikan catatan migrasi.
- Jalankan pengujian kompatibilitas SDK Plugin terhadap impor lama.
- Hapus atau sembunyikan helper internal lama hanya setelah tidak ada Plugin bawaan yang membutuhkannya
  dan kontrak pihak ketiga memiliki pengganti yang stabil.

## Rencana pengujian

Pengujian unit:

- Serialisasi dan pemulihan intent pengiriman tahan-lama.
- Penggunaan ulang kunci idempotensi dan penekanan duplikat.
- Commit receipt dan lewati replay.
- Pemulihan `unknown_after_send` yang merekonsiliasi sebelum replay saat sebuah adapter
  mendukung rekonsiliasi.
- Kebijakan klasifikasi kegagalan.
- Urutan kebijakan ack terima.
- Pemetaan relasi untuk pengiriman reply, followup, system, dan broadcast.
- Factory origin kegagalan Gateway dan predikat `shouldDropOpenClawEcho`.
- Pelestarian origin melalui normalisasi payload, chunking, serialisasi antrean tahan-lama,
  dan pemulihan.

Pengujian integrasi:

- Adapter sederhana `channel.turn.run` tetap mencatat dan mengirim.
- Pengiriman assembled-turn lama tidak menjadi tahan-lama kecuali saluran
  secara eksplisit ikut serta.
- Jembatan `channel.turn.runPrepared` tetap mencatat dan memfinalisasi.
- Helper kompatibilitas publik memanggil callback pengiriman milik pemanggil secara default
  dan tidak melakukan generic-send sebelum callback tersebut.
- Pengiriman fallback tahan-lama memutar ulang seluruh array payload yang diproyeksikan setelah
  restart dan tidak dapat membuat payload berikutnya tidak tercatat setelah crash awal.
- Pengiriman assembled-turn tahan-lama mengembalikan id pesan platform ke dispatcher
  buffered.
- Hook pengiriman kustom tetap mengembalikan id pesan platform saat pengiriman tahan-lama
  dinonaktifkan atau tidak tersedia.
- Balasan final bertahan dari restart antara penyelesaian asisten dan pengiriman platform.
- Draf pratinjau difinalisasi di tempat saat diizinkan.
- Draf pratinjau dibatalkan atau direduksi saat ketidakcocokan media/error/target-reply
  memerlukan pengiriman normal.
- Streaming blok dan streaming pratinjau tidak sama-sama mengirim teks yang sama.
- Media yang di-stream lebih awal tidak diduplikasi dalam pengiriman final.

Pengujian saluran:

- Reply topik Telegram dengan ack polling ditunda sampai watermark completed aman milik
  konteks penerimaan.
- Pemulihan polling Telegram untuk update yang diterima-tetapi-belum-terkirim tercakup oleh
  model offset safe-completed yang dipersistenkan.
- Pratinjau basi Telegram mengirim final baru dan membersihkan pratinjau.
- Fallback senyap Telegram mengirim setiap payload fallback yang diproyeksikan.
- Durabilitas fallback senyap Telegram mencatat seluruh array fallback yang diproyeksikan
  secara atomik, bukan satu intent tahan-lama payload-tunggal per iterasi loop.
- Pembatalan pratinjau Discord pada media/error/reply eksplisit.
- Final dispatcher siap pakai Discord dirutekan melalui konteks pengiriman sebelum dokumentasi
  atau changelog mengklaim durabilitas final-reply Discord.
- Pengiriman final tahan-lama iMessage mengisi cache echo pesan terkirim monitor.
- Jalur pengiriman lama LINE, Zalo, dan Nostr tidak dilewati oleh
  pengiriman tahan-lama generik sampai pengujian paritas adapternya ada.
- Pengiriman callback Direct-DM/Nostr tetap otoritatif kecuali dimigrasikan secara eksplisit
  ke target pesan lengkap dan adapter pengiriman yang aman untuk replay.
- Pesan kegagalan Gateway OpenClaw bertag Slack tetap terlihat outbound, echo
  ruang bot bertag turun sebelum `allowBots`, dan pesan bot tanpa tag dengan
  teks terlihat yang sama tetap mengikuti otorisasi bot normal.
- Fallback stream native Slack ke pratinjau draf dalam DM tingkat atas.
- Finalisasi pratinjau Matrix dan fallback redaksi.
- Echo ruang kegagalan Gateway OpenClaw bertag Matrix dari akun bot yang dikonfigurasi
  turun sebelum penanganan `allowBots`.
- Audit cascade kegagalan Gateway ruang bersama Discord dan Google Chat mencakup
  mode `allowBots` sebelum mengklaim perlindungan generik di sana.
- Finalisasi draf Mattermost dan fallback kirim-baru.
- Finalisasi progres native Teams.
- Penekanan final duplikat Feishu.
- Fallback timeout akumulator QQ Bot.
- Pengiriman final tahan-lama Tlon mempertahankan rendering tanda tangan model dan pelacakan
  thread yang diikuti.
- Pengiriman final tahan-lama sederhana WhatsApp, Signal, iMessage, Google Chat, LINE, IRC,
  Nostr, Nextcloud Talk, Synology Chat, Tlon, Twitch, Zalo, dan Zalo Personal.

Validasi:

- File Vitest tertarget selama pengembangan.
- `pnpm check:changed` di Testbox untuk seluruh permukaan yang berubah.
- `pnpm check` yang lebih luas di Testbox sebelum mendaratkan refactor lengkap atau setelah
  perubahan SDK/ekspor publik.
- Smoke live atau qa-channel untuk setidaknya satu saluran berkemampuan edit dan satu
  saluran sederhana hanya-kirim sebelum menghapus wrapper kompatibilitas.

## Pertanyaan terbuka

- Apakah Telegram pada akhirnya harus mengganti sumber runner grammY dengan
  sumber polling yang sepenuhnya tahan-lama yang dapat mengendalikan redelivery tingkat platform, bukan
  hanya watermark restart yang dipersistenkan milik OpenClaw.
- Apakah status pratinjau live tahan-lama harus disimpan dalam record antrean yang sama
  dengan intent pengiriman final atau dalam penyimpanan status live saudara.
- Berapa lama wrapper kompatibilitas tetap terdokumentasi setelah
  `plugin-sdk/channel-message` dirilis.
- Apakah Plugin pihak ketiga harus mengimplementasikan adapter receive secara langsung atau hanya
  menyediakan hook normalize/send/live melalui `defineChannelMessageAdapter`.
- Field receipt mana yang aman diekspos di SDK publik versus status runtime internal.
- Apakah efek samping seperti cache self-echo dan penanda participated-thread
  harus dimodelkan sebagai hook konteks pengiriman, langkah finalize milik adapter, atau
  subscriber receipt.
- Saluran mana yang memiliki metadata origin native, mana yang memerlukan registry outbound
  yang dipersistenkan, dan mana yang tidak dapat menawarkan penekanan echo lintas-bot yang andal.

## Kriteria penerimaan

- Setiap saluran pesan bawaan mengirim output final yang terlihat melalui
  `messages.send`.
- Setiap saluran pesan inbound masuk melalui `messages.receive` atau
  wrapper kompatibilitas terdokumentasi.
- Setiap saluran pratinjau/edit/stream menggunakan `messages.live` untuk status draf dan
  finalisasi.
- `channel.turn` hanya sebuah wrapper.
- Helper SDK bernama reply adalah ekspor kompatibilitas, bukan jalur yang direkomendasikan.
- Pemulihan tahan-lama dapat memutar ulang pengiriman final tertunda setelah restart tanpa kehilangan
  respons final atau menduplikasi pengiriman yang sudah di-commit; pengiriman yang
  hasil platformnya tidak diketahui direkonsiliasi sebelum replay atau didokumentasikan sebagai
  at-least-once untuk adapter tersebut.
- Pengiriman final tahan-lama fail closed saat intent tahan-lama tidak dapat ditulis,
  kecuali pemanggil secara eksplisit memilih mode non-tahan-lama yang terdokumentasi.
- Helper kompatibilitas channel-turn dan SDK lama default ke pengiriman langsung
  milik saluran; pengiriman tahan-lama generik hanya ikut serta eksplisit.
- Receipt mempertahankan semua id pesan platform untuk pengiriman multi-bagian dan
  id utama untuk kemudahan threading/edit.
- Wrapper tahan-lama mempertahankan efek samping lokal saluran sebelum mengganti callback
  pengiriman langsung.
- Dispatcher siap pakai tidak dihitung tahan-lama sampai jalur pengiriman finalnya
  secara eksplisit menggunakan konteks pengiriman.
- Pengiriman fallback menangani setiap payload yang diproyeksikan.
- Pengiriman fallback tahan-lama mencatat setiap payload yang diproyeksikan dalam satu
  intent atau rencana batch yang dapat di-replay.
- Output kegagalan Gateway yang berasal dari OpenClaw terlihat oleh manusia tetapi echo
  ruang yang dibuat bot dan bertag dibuang sebelum otorisasi bot pada saluran yang
  menyatakan dukungan untuk kontrak origin.
- Dokumentasi menjelaskan pengiriman, penerimaan, live, status, receipt, relasi, kebijakan
  kegagalan, migrasi, dan cakupan pengujian.

## Terkait

- [Pesan](/id/concepts/messages)
- [Streaming dan chunking](/id/concepts/streaming)
- [Draf progres](/id/concepts/progress-drafts)
- [Kebijakan retry](/id/concepts/retry)
- [Kernel turn saluran](/id/plugins/sdk-channel-turn)
