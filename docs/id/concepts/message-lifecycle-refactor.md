---
read_when:
    - Memfaktorkan ulang perilaku kirim atau terima channel
    - Mengubah alur masuk kanal, pengiriman balasan, antrean keluar, streaming pratinjau, atau API pesan SDK Plugin
    - Merancang plugin saluran baru yang memerlukan pengiriman tahan lama, tanda terima, pratinjau, pengeditan, atau percobaan ulang
summary: Rencana desain untuk siklus hidup terpadu penerimaan, pengiriman, pratinjau, pengeditan, dan streaming pesan tahan lama
title: Refaktor siklus hidup pesan
x-i18n:
    generated_at: "2026-06-27T17:24:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Halaman ini adalah desain target untuk mengganti helper inbound channel, dispatch balasan,
streaming pratinjau, dan pengiriman outbound yang tersebar dengan satu lifecycle
pesan yang durable.

Versi singkatnya:

- Primitive inti seharusnya **terima** dan **kirim**, bukan **balas**.
- Balasan hanyalah relasi pada pesan outbound.
- Turn adalah kemudahan pemrosesan inbound, bukan pemilik pengiriman.
- Pengiriman harus berbasis konteks: `begin`, render, pratinjau atau stream, kirim final,
  commit, gagal.
- Penerimaan juga harus berbasis konteks: normalisasi, dedupe, route, catat,
  dispatch, ack platform, gagal.
- SDK Plugin publik harus diringkas menjadi satu surface channel-outbound kecil.

## Masalah

Stack channel saat ini tumbuh dari beberapa kebutuhan lokal yang valid:

- Adapter inbound sederhana menggunakan `runtime.channel.inbound.run`.
- Adapter kaya menggunakan `runtime.channel.inbound.runPreparedReply`.
- Helper legacy menggunakan `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, helper payload balasan, chunking balasan,
  referensi balasan, dan helper runtime outbound.
- Streaming pratinjau berada di dispatcher khusus channel.
- Durability pengiriman final sedang ditambahkan di sekitar path payload balasan yang ada.

Bentuk itu memperbaiki bug lokal, tetapi meninggalkan OpenClaw dengan terlalu banyak
konsep publik dan terlalu banyak tempat tempat semantik pengiriman dapat menyimpang.

Masalah keandalan yang memperlihatkan ini adalah:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Invariant targetnya lebih luas daripada Telegram: setelah inti memutuskan bahwa pesan
outbound yang terlihat harus ada, intent harus durable sebelum pengiriman platform
dicoba, dan receipt platform harus di-commit setelah berhasil. Itu memberi OpenClaw
pemulihan at-least-once. Perilaku exactly-once hanya ada untuk adapter yang dapat
membuktikan idempotensi native atau merekonsiliasi percobaan unknown-after-send
terhadap state platform sebelum replay.

Itu adalah keadaan akhir untuk refactor ini, bukan deskripsi setiap path saat ini.
Selama migrasi, helper outbound yang ada masih dapat jatuh ke pengiriman langsung
ketika penulisan antrean best-effort gagal. Refactor selesai hanya ketika pengiriman
final yang durable fail closed atau secara eksplisit opt out dengan kebijakan
non-durable yang terdokumentasi.

## Sasaran

- Satu lifecycle inti untuk semua path terima dan kirim pesan channel.
- Pengiriman final yang durable secara default dalam lifecycle pesan baru setelah adapter
  mendeklarasikan perilaku replay-safe.
- Semantik pratinjau, edit, stream, finalisasi, retry, pemulihan, dan receipt bersama.
- Surface SDK Plugin kecil yang dapat dipelajari dan dipelihara Plugin pihak ketiga.
- Kompatibilitas untuk pemanggil kompatibilitas balasan inbound yang ada selama migrasi.
- Titik ekstensi yang jelas untuk kapabilitas channel baru.
- Tidak ada cabang khusus platform di inti.
- Tidak ada pesan channel token-delta. Streaming channel tetap berupa pratinjau pesan,
  edit, append, atau pengiriman blok yang selesai.
- Metadata asal OpenClaw terstruktur untuk output operasional/sistem agar kegagalan
  Gateway yang terlihat tidak masuk kembali ke ruang bersama yang mengaktifkan bot
  sebagai prompt baru.

## Bukan sasaran

- Jangan paksa setiap channel yang ada ke pengiriman pesan durable pada fase pertama.
- Jangan paksa setiap channel ke perilaku transport native yang sama.
- Jangan ajarkan inti tentang topik Telegram, stream native Slack, redaksi Matrix,
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
- adapter state untuk dedupe, lock, antrean, dan persistensi

OpenClaw sebaiknya meminjam kosakatanya, bukan menyalin surfacenya.

Yang dibutuhkan OpenClaw di luar model itu:

- Intent pengiriman outbound yang durable sebelum panggilan transport langsung.
- Konteks pengiriman eksplisit dengan begin, commit, dan fail.
- Konteks penerimaan yang mengetahui kebijakan ack platform.
- Receipt yang bertahan melewati restart dan dapat menggerakkan edit, hapus, pemulihan, dan
  penekanan duplikat.
- SDK publik yang lebih kecil. Plugin bundled dapat menggunakan helper runtime internal, tetapi
  Plugin pihak ketiga sebaiknya melihat satu API pesan yang koheren.
- Perilaku khusus agen: sesi, transkrip, streaming blok, progres tool,
  approval, direktif media, balasan senyap, dan riwayat mention grup.

Promise bergaya `thread.post()` tidak cukup untuk OpenClaw. Promise itu menyembunyikan
batas transaksi yang memutuskan apakah pengiriman dapat dipulihkan.

## Model inti

Domain baru sebaiknya berada di bawah namespace inti internal seperti
`src/channels/message/*`.

Domain ini memiliki empat konsep:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` memiliki lifecycle inbound.

`send` memiliki lifecycle outbound.

`live` memiliki state pratinjau, edit, progres, dan stream.

`state` memiliki penyimpanan intent durable, receipt, idempotensi, pemulihan, lock, dan
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

Balasan adalah relasi, bukan root API:

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

Ini memungkinkan path pengiriman yang sama menangani balasan normal, notifikasi cron, prompt approval,
penyelesaian tugas, pengiriman alat pesan, pengiriman CLI atau Control UI, hasil subagen,
dan pengiriman automasi.

### Asal

Asal menjelaskan siapa yang menghasilkan pesan dan bagaimana OpenClaw harus memperlakukan echo dari
pesan itu. Ini terpisah dari relasi: sebuah pesan dapat berupa balasan kepada pengguna
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

Inti memiliki makna output yang berasal dari OpenClaw. Channel memiliki cara asal itu
dienkode ke transport mereka.

Penggunaan wajib pertama adalah output kegagalan Gateway. Manusia masih harus melihat
pesan seperti "Agen gagal sebelum membalas" atau "Kunci API hilang", tetapi output
operasional OpenClaw yang diberi tag tidak boleh diterima sebagai input yang ditulis bot di ruang bersama
ketika `allowBots` diaktifkan.

### Receipt

Receipt adalah first-class:

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

Receipt adalah jembatan dari intent durable ke edit, hapus, finalisasi pratinjau,
penekanan duplikat, dan pemulihan di masa depan.

Receipt dapat menjelaskan satu pesan platform atau pengiriman multi-bagian. Teks yang di-chunk,
media plus teks, suara plus teks, dan fallback kartu harus mempertahankan semua
id platform sambil tetap mengekspos id primer untuk threading dan edit berikutnya.

## Konteks penerimaan

Penerimaan sebaiknya bukan panggilan helper telanjang. Inti membutuhkan konteks yang mengetahui
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

- **Ack transport:** memberi tahu Webhook atau socket platform bahwa OpenClaw menerima
  envelope event. Beberapa platform memerlukan ini sebelum dispatch.
- **Ack offset polling:** memajukan cursor agar event yang sama tidak diambil
  lagi. Ini tidak boleh maju melewati pekerjaan yang tidak dapat dipulihkan.
- **Ack record inbound:** mengonfirmasi OpenClaw mempersistensikan metadata inbound yang cukup untuk
  dedupe dan me-route redelivery.
- **Receipt yang terlihat pengguna:** perilaku baca/status/typing opsional; tidak pernah menjadi
  batas durability.

`ReceiveAckPolicy` hanya mengontrol acknowledgment transport atau polling. Ini tidak boleh
digunakan kembali untuk read receipt atau reaksi status.

Sebelum otorisasi bot, penerimaan harus menerapkan kebijakan echo OpenClaw bersama
ketika channel dapat mendecode metadata asal pesan:

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

Polling Telegram kini menggunakan kebijakan ack receive-context untuk watermark restart yang dipersistensikan.
Tracker masih mengamati update grammY saat masuk ke chain middleware,
tetapi OpenClaw hanya mempersistensikan id update selesai yang aman setelah
dispatch berhasil, sehingga update yang gagal atau pending lebih rendah tetap dapat direplay setelah
restart. Offset pengambilan `getUpdates` upstream Telegram masih dikontrol oleh
library polling, jadi langkah lebih dalam yang tersisa adalah sumber polling yang sepenuhnya durable
jika kita membutuhkan redelivery tingkat platform di luar watermark restart
OpenClaw. Platform Webhook mungkin membutuhkan ack HTTP langsung, tetapi tetap membutuhkan
dedupe inbound dan intent pengiriman outbound yang durable karena Webhook dapat redeliver.

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

Helper diperluas menjadi:

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

Intent harus ada sebelum I/O transport. Mulai ulang setelah begin tetapi sebelum
commit dapat dipulihkan.

Batas berbahaya ada setelah platform berhasil dan sebelum commit tanda terima. Jika
proses mati di sana, OpenClaw tidak dapat mengetahui apakah pesan platform ada
kecuali adapter menyediakan idempotensi native atau jalur rekonsiliasi tanda terima.
Percobaan tersebut harus dilanjutkan dalam `unknown_after_send`, bukan diputar ulang
secara membuta. Channel tanpa rekonsiliasi boleh memilih pemutaran ulang at-least-once
hanya jika pesan terlihat duplikat adalah tradeoff yang dapat diterima dan
terdokumentasi untuk channel dan relasi tersebut. Bridge rekonsiliasi SDK saat ini
mengharuskan adapter mendeklarasikan `reconcileUnknownSend`, lalu meminta
`durableFinal.reconcileUnknownSend` untuk mengklasifikasikan entri tak dikenal sebagai
`sent`, `not_sent`, atau `unresolved`; hanya `not_sent` yang mengizinkan pemutaran ulang,
dan entri yang belum terselesaikan tetap terminal atau hanya mencoba ulang pemeriksaan
rekonsiliasi.

Kebijakan durabilitas harus eksplisit:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` berarti core harus gagal tertutup ketika tidak dapat menulis intent durable.
`best_effort` dapat meneruskan ketika persistensi tidak tersedia. `disabled` mempertahankan
perilaku kirim langsung lama. Selama migrasi, wrapper lama dan helper kompatibilitas
publik default ke `disabled`; semuanya tidak boleh menyimpulkan `required` dari fakta
bahwa sebuah channel memiliki adapter outbound generik.

Konteks kirim juga memiliki efek pascakirim lokal channel. Migrasi tidak aman
jika pengiriman durable melewati perilaku lokal yang sebelumnya terpasang pada
jalur kirim langsung channel. Contohnya mencakup cache penekanan self-echo,
penanda partisipasi thread, anchor edit native, rendering tanda tangan model,
dan penjaga duplikat khusus platform. Efek tersebut harus dipindahkan ke
adapter kirim, adapter render, atau hook konteks-kirim bernama sebelum channel
tersebut dapat mengaktifkan pengiriman final generik durable.

Helper kirim harus mengembalikan tanda terima sepenuhnya ke pemanggilnya. Wrapper
durable tidak dapat menelan id pesan atau mengganti hasil pengiriman channel dengan
`undefined`; dispatcher buffered menggunakan id tersebut untuk anchor thread, edit
berikutnya, finalisasi pratinjau, dan penekanan duplikat.

Pengiriman fallback beroperasi pada batch, bukan payload tunggal. Penulisan ulang
silent-reply, fallback media, fallback kartu, dan proyeksi chunk semuanya dapat
menghasilkan lebih dari satu pesan yang dapat dikirim, jadi konteks kirim harus
mengirim seluruh batch yang diproyeksikan atau mendokumentasikan secara eksplisit
mengapa hanya satu payload yang valid.

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

Ketika fallback seperti itu durable, seluruh batch yang diproyeksikan harus diwakili oleh
satu intent kirim durable atau rencana batch atomik lain. Mencatat tiap payload
satu per satu tidak cukup: crash di antara payload dapat meninggalkan fallback
terlihat parsial tanpa catatan durable untuk payload yang tersisa. Pemulihan harus
mengetahui unit mana yang sudah memiliki tanda terima dan memutar ulang hanya unit
yang hilang atau menandai batch sebagai `unknown_after_send` sampai adapter
merekonsiliasinya.

## Konteks live

Perilaku pratinjau, edit, progres, dan stream harus menjadi satu lifecycle opt-in.

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

Status live cukup durable untuk memulihkan atau menekan duplikat:

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

Ini harus mencakup perilaku saat ini:

- Telegram mengirim plus mengedit pratinjau, dengan final segar setelah usia pratinjau usang.
- Discord mengirim plus mengedit pratinjau, membatalkan pada media/error/balasan eksplisit.
- Slack stream native atau pratinjau draf bergantung pada bentuk thread.
- Finalisasi posting draf Mattermost.
- Finalisasi event draf Matrix atau redaksi saat tidak cocok.
- Stream progres native Teams.
- Stream QQ Bot atau fallback terakumulasi.

## Permukaan adapter

Target SDK publik harus berupa satu subpath:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
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

Adapter kirim:

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

Adapter terima:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Sebelum otorisasi preflight, core harus menjalankan predikat echo OpenClaw bersama
setiap kali `origin.decode` mengembalikan metadata asal OpenClaw. Adapter terima
memasok fakta platform seperti penulis bot dan bentuk room; core memiliki keputusan
drop dan pengurutan sehingga channel tidak mengimplementasikan ulang filter teks.

Adapter asal:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core menetapkan `MessageOrigin`. Channel hanya menerjemahkannya ke dan dari metadata
transport native. Slack memetakannya ke `chat.postMessage({ metadata })` dan
`message.metadata` inbound; Matrix dapat memetakannya ke konten event tambahan; channel
tanpa metadata native dapat menggunakan registri tanda terima/outbound ketika itu
merupakan pendekatan terbaik yang tersedia.

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

Permukaan publik baru harus menyerap atau menghentikan area konseptual ini:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- sebagian besar penggunaan publik `outbound-runtime`
- helper lifecycle stream draf ad hoc

Subpath kompatibilitas dapat tetap sebagai wrapper, tetapi Plugin pihak ketiga
baru seharusnya tidak membutuhkannya.

Plugin bawaan dapat mempertahankan impor helper internal melalui subpath runtime
yang dicadangkan selama migrasi. Dokumentasi publik harus mengarahkan penulis Plugin ke
`plugin-sdk/channel-outbound` setelah tersedia.

## Hubungan dengan inbound channel

`runtime.channel.inbound.*` adalah bridge runtime selama migrasi.

Itu harus menjadi adapter kompatibilitas:

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply` juga harus tetap ada pada awalnya:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Permukaan runtime `channel.turn` lama telah dihapus. Pemanggil runtime menggunakan
`channel.inbound.*`; dokumentasi channel dan subpath SDK menggunakan nomina inbound/message.

## Guardrail kompatibilitas

Selama migrasi, pengiriman durable generik bersifat opt-in untuk channel apa pun yang
callback pengiriman yang ada memiliki efek samping selain "kirim payload ini".

Entry point lama non-durable secara default:

- `channel.inbound.run` dan `dispatchChannelInboundReply` menggunakan callback
  pengiriman channel kecuali channel tersebut secara eksplisit memasok objek
  kebijakan/opsi durable yang telah diaudit.
- `channel.inbound.runPreparedReply` tetap dimiliki channel sampai dispatcher yang disiapkan
  secara eksplisit memanggil konteks kirim.
- Helper kompatibilitas publik seperti `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase`, dan helper direct-DM tidak pernah menyuntikkan
  pengiriman durable generik sebelum callback `deliver` atau `reply` yang disediakan pemanggil.

Untuk tipe bridge migrasi, `durable: undefined` berarti "tidak durable". Jalur
durable diaktifkan hanya oleh nilai kebijakan/opsi yang eksplisit. `durable:
false` dapat tetap sebagai ejaan kompatibilitas, tetapi implementasi seharusnya tidak
mengharuskan setiap channel yang belum dimigrasikan menambahkannya.

Kode bridge saat ini harus menjaga keputusan durabilitas tetap eksplisit:

- Pengiriman final durabel mengembalikan status terdiskriminasi. `handled_visible` dan
  `handled_no_send` bersifat terminal; `unsupported` dan `not_applicable` dapat
  kembali ke pengiriman milik kanal; `failed` meneruskan kegagalan pengiriman.
- Pengiriman final durabel generik dibatasi oleh kapabilitas adapter seperti
  pengiriman senyap, pelestarian target balasan, pelestarian kutipan native, dan
  hook pengiriman pesan. Paritas yang hilang harus memilih pengiriman milik
  kanal, bukan pengiriman generik yang mengubah perilaku yang terlihat pengguna.
- Pengiriman durabel berbasis antrean mengekspos referensi niat pengiriman.
  Field sesi `pendingFinalDelivery*` yang ada dapat membawa id niat selama
  transisi; keadaan akhir adalah penyimpanan `MessageSendIntent`, bukan teks
  balasan beku ditambah field konteks ad hoc.

Jangan aktifkan jalur durabel generik untuk sebuah kanal sampai semua hal ini
benar:

- Adapter pengiriman generik menjalankan perilaku rendering dan transport yang
  sama dengan jalur langsung lama.
- Efek samping lokal setelah pengiriman dipertahankan melalui konteks pengiriman.
- Adapter mengembalikan tanda terima atau hasil pengiriman dengan semua id pesan
  platform.
- Jalur dispatcher yang disiapkan memanggil konteks pengiriman baru atau tetap
  didokumentasikan sebagai di luar jaminan durabel.
- Pengiriman fallback menangani setiap payload yang diproyeksikan, bukan hanya
  yang pertama.
- Pengiriman fallback durabel mencatat seluruh array payload yang diproyeksikan
  sebagai satu niat atau rencana batch yang dapat diputar ulang.

Bahaya migrasi konkret yang harus dipertahankan:

- Pengiriman monitor iMessage mencatat pesan terkirim dalam cache gema setelah
  pengiriman berhasil. Pengiriman final durabel tetap harus mengisi cache itu;
  jika tidak, OpenClaw dapat menelan ulang balasan finalnya sendiri sebagai pesan
  pengguna masuk.
- Tlon menambahkan tanda tangan model opsional dan mencatat thread yang diikuti
  setelah balasan grup. Pengiriman durabel generik tidak boleh melewati efek
  tersebut; pindahkan efek itu ke adapter render/kirim/finalisasi Tlon atau
  pertahankan Tlon pada jalur milik kanal.
- Discord dan dispatcher lain yang disiapkan sudah memiliki perilaku pengiriman
  langsung dan pratinjau. Mereka tidak tercakup oleh jaminan durabel giliran yang
  dirakit sampai dispatcher yang disiapkan secara eksplisit merutekan final
  melalui konteks pengiriman.
- Pengiriman fallback senyap Telegram harus mengirimkan seluruh array payload
  yang diproyeksikan. Pintasan satu payload dapat menjatuhkan payload fallback
  tambahan setelah proyeksi.
- LINE, Zalo, Nostr, dan jalur rakitan/helper lain yang ada mungkin memiliki
  penanganan token balasan, proxy media, cache pesan terkirim, pembersihan
  loading/status, atau target khusus callback. Mereka tetap berada pada
  pengiriman milik kanal sampai semantik tersebut direpresentasikan oleh adapter
  pengiriman dan diverifikasi oleh pengujian.
- Helper DM langsung dapat memiliki callback balasan yang merupakan satu-satunya
  target transport yang benar. Outbound generik tidak boleh menebak dari
  `OriginatingTo` atau `To` dan melewati callback tersebut.
- Output kegagalan Gateway OpenClaw harus tetap terlihat oleh manusia, tetapi
  gema ruang yang ditandai sebagai dibuat bot harus dibuang sebelum otorisasi
  `allowBots`. Kanal tidak boleh mengimplementasikan ini dengan filter prefiks
  teks terlihat kecuali sebagai langkah darurat singkat; kontrak durabelnya
  adalah metadata asal terstruktur.

## Penyimpanan internal

Antrean durabel harus menyimpan niat pengiriman pesan, bukan payload balasan.

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
thread, target, kebijakan pemformatan, dan aturan media yang sama setelah mulai
ulang.

## Kelas kegagalan

Adapter kanal mengklasifikasikan kegagalan transport ke dalam kategori tertutup:

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
- Untuk `not_found`, biarkan finalisasi live kembali dari edit ke pengiriman baru
  ketika kanal menyatakan itu aman.
- Untuk `conflict`, gunakan aturan tanda terima/idempotensi untuk memutuskan
  apakah pesan sudah ada.
- Error apa pun setelah adapter mungkin telah menyelesaikan I/O platform tetapi
  sebelum commit tanda terima menjadi `unknown_after_send` kecuali adapter dapat
  membuktikan operasi platform tidak terjadi.

## Pemetaan kanal

| Channel         | Migrasi target                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Menerima kebijakan ack ditambah pengiriman akhir yang persisten. Adaptor langsung memiliki pengiriman ditambah pratinjau edit, pengiriman akhir pratinjau basi, topik, pelewatan pratinjau balasan-kutipan, fallback media, dan penanganan retry-after.                                                                                                         |
| Discord         | Adaptor kirim membungkus pengiriman muatan persisten yang ada. Adaptor langsung memiliki edit draf, draf progres, pembatalan pratinjau media/kesalahan, pelestarian target balasan, dan tanda terima id pesan. Audit gema kegagalan gateway yang ditulis bot di ruang bersama; gunakan registri keluar atau padanan native lain jika Discord tidak dapat membawa metadata asal pada pesan normal. |
| Slack           | Adaptor kirim menangani posting chat normal. Adaptor langsung memilih stream native saat bentuk thread mendukungnya, jika tidak memakai pratinjau draf. Tanda terima mempertahankan timestamp thread. Adaptor asal memetakan kegagalan gateway OpenClaw ke Slack `chat.postMessage.metadata` dan membuang gema ruang-bot bertag sebelum otorisasi `allowBots`.                                  |
| WhatsApp        | Adaptor kirim memiliki pengiriman teks/media dengan intent akhir persisten. Adaptor terima menangani mention grup dan identitas pengirim. Langsung dapat tetap tidak ada sampai WhatsApp memiliki transport yang dapat diedit.                                                                                                                                     |
| Matrix          | Adaptor langsung memiliki edit event draf, finalisasi, redaksi, batasan media terenkripsi, dan fallback ketidakcocokan target balasan. Adaptor terima memiliki hidrasi event terenkripsi dan deduplikasi. Adaptor asal sebaiknya mengenkode asal kegagalan gateway OpenClaw ke konten event Matrix dan membuang gema ruang bot terkonfigurasi sebelum penanganan `allowBots`.              |
| Mattermost      | Adaptor langsung memiliki satu posting draf, pelipatan progres/tool, finalisasi di tempat, dan fallback pengiriman baru.                                                                                                                                                                                                                                         |
| Microsoft Teams | Adaptor langsung memiliki progres native dan perilaku stream blok. Adaptor kirim memiliki aktivitas dan tanda terima lampiran/kartu.                                                                                                                                                                                                                              |
| Feishu          | Adaptor render memiliki rendering teks/kartu/raw. Adaptor langsung memiliki kartu streaming dan penekanan final duplikat. Adaptor kirim memiliki komentar, sesi topik, media, dan penekanan suara.                                                                                                                                                               |
| QQ Bot          | Adaptor langsung memiliki streaming C2C, timeout akumulator, dan fallback pengiriman akhir. Adaptor render memiliki tag media dan teks-sebagai-suara.                                                                                                                                                                                                            |
| Signal          | Adaptor terima sederhana ditambah adaptor kirim. Tidak ada adaptor langsung kecuali signal-cli menambahkan dukungan edit yang andal.                                                                                                                                                                                                                              |
| iMessage        | Adaptor terima sederhana ditambah adaptor kirim. Pengiriman iMessage harus mempertahankan pengisian cache gema monitor sebelum final persisten dapat melewati pengiriman monitor.                                                                                                                                                                                |
| Google Chat     | Adaptor terima sederhana ditambah adaptor kirim dengan relasi thread dipetakan ke space dan id thread. Audit perilaku ruang `allowBots=true` untuk gema kegagalan gateway OpenClaw bertag.                                                                                                                                                                      |
| LINE            | Adaptor terima sederhana ditambah adaptor kirim dengan batasan token balasan dimodelkan sebagai kapabilitas target/relasi.                                                                                                                                                                                                                                       |
| Nextcloud Talk  | Bridge terima SDK ditambah adaptor kirim.                                                                                                                                                                                                                                                                                                                       |
| IRC             | Adaptor terima sederhana ditambah adaptor kirim, tanpa tanda terima edit persisten.                                                                                                                                                                                                                                                                              |
| Nostr           | Adaptor terima ditambah adaptor kirim untuk DM terenkripsi; tanda terima adalah id event.                                                                                                                                                                                                                                                                        |
| QA Channel      | Adaptor uji-kontrak untuk perilaku terima, kirim, langsung, coba ulang, dan pemulihan.                                                                                                                                                                                                                                                                           |
| Synology Chat   | Adaptor terima sederhana ditambah adaptor kirim.                                                                                                                                                                                                                                                                                                                |
| Tlon            | Adaptor kirim harus mempertahankan rendering tanda tangan model dan pelacakan thread yang diikuti sebelum pengiriman akhir persisten generik diaktifkan.                                                                                                                                                                                                         |
| Twitch          | Adaptor terima sederhana ditambah adaptor kirim dengan klasifikasi batas laju.                                                                                                                                                                                                                                                                                   |
| Zalo            | Adaptor terima sederhana ditambah adaptor kirim.                                                                                                                                                                                                                                                                                                                |
| Zalo Personal   | Adaptor terima sederhana ditambah adaptor kirim.                                                                                                                                                                                                                                                                                                                |

## Rencana migrasi

### Fase 1: Domain Pesan Internal

- Tambahkan tipe `src/channels/message/*` untuk pesan, target, relasi,
  asal, tanda terima, kapabilitas, intent persisten, konteks terima, konteks kirim,
  konteks langsung, dan kelas kegagalan.
- Tambahkan `origin?: MessageOrigin` ke tipe muatan bridge migrasi yang digunakan oleh
  pengiriman balasan saat ini, lalu pindahkan field tersebut ke `ChannelMessage` dan tipe
  pesan yang dirender saat refactor menggantikan muatan balasan.
- Pertahankan ini tetap internal sampai adaptor dan pengujian membuktikan bentuknya.
- Tambahkan pengujian unit murni untuk transisi status dan serialisasi.

### Fase 2: Core Kirim Persisten

- Pindahkan antrean keluar yang ada dari persistensi muatan-balasan ke intent
  pengiriman pesan persisten.
- Izinkan intent kirim persisten membawa array muatan terproyeksi atau rencana batch, bukan
  hanya satu muatan balasan.
- Pertahankan perilaku pemulihan antrean saat ini melalui konversi kompatibilitas.
- Buat `deliverOutboundPayloads` memanggil `messages.send`.
- Jadikan persistensi pengiriman akhir sebagai default dan gagal tertutup saat intent persisten
  tidak dapat ditulis dalam siklus hidup pesan baru, setelah adaptor mendeklarasikan
  keamanan pemutaran ulang. Jalur kompatibilitas runner masuk dan SDK yang ada tetap
  menggunakan kirim langsung secara default selama fase ini.
- Catat tanda terima secara konsisten.
- Kembalikan tanda terima dan hasil pengiriman ke pemanggil dispatcher asli, alih-alih
  memperlakukan kirim persisten sebagai efek samping terminal.
- Persistenkan asal pesan melalui intent kirim persisten sehingga pemulihan, pemutaran ulang, dan
  pengiriman terpotong mempertahankan provenance operasional OpenClaw.

### Fase 3: Bridge Masuk Channel

- Implementasikan ulang `channel.inbound.run` dan `dispatchChannelInboundReply` di atas
  `messages.receive` dan `messages.send`.
- Pertahankan tipe fakta saat ini tetap stabil.
- Pertahankan perilaku legacy secara default. Channel giliran-terakit menjadi persisten
  hanya saat adaptornya secara eksplisit ikut serta dengan kebijakan persistensi yang aman untuk pemutaran ulang.
- Pertahankan `durable: false` sebagai escape hatch kompatibilitas untuk jalur yang memfinalisasi
  edit native dan belum dapat diputar ulang dengan aman, tetapi jangan bergantung pada marker `false`
  untuk melindungi channel yang belum dimigrasikan.
- Defaultkan persistensi giliran-terakit hanya dalam siklus hidup pesan baru, setelah
  pemetaan channel membuktikan jalur kirim generik mempertahankan semantik pengiriman
  channel lama.

### Fase 4: Bridge Dispatcher Siap

- Ganti `deliverDurableInboundReplyPayload` dengan jembatan konteks kirim.
- Pertahankan helper lama sebagai wrapper.
- Port Telegram, WhatsApp, Slack, Signal, iMessage, dan Discord lebih dulu karena
  semuanya sudah memiliki pekerjaan final tahan lama atau jalur kirim yang lebih sederhana.
- Perlakukan setiap dispatcher yang disiapkan sebagai belum tercakup sampai secara eksplisit ikut serta dalam
  konteks kirim. Dokumentasi dan entri changelog harus menyebut "giliran channel yang dirakit"
  atau menamai jalur channel yang dimigrasikan, bukan mengklaim semua
  balasan final otomatis.
- Pertahankan perilaku `recordInboundSessionAndDispatchReply`, helper direct-DM, dan helper
  kompatibilitas publik serupa. Semuanya dapat mengekspos ikut-serta konteks kirim eksplisit
  nanti, tetapi tidak boleh otomatis mencoba pengiriman tahan lama generik
  sebelum callback pengiriman milik pemanggil.

### Fase 5: Siklus Hidup Live Terpadu

- Bangun `messages.live` dengan dua adapter pembuktian:
  - Telegram untuk kirim plus edit plus pengiriman final kedaluwarsa.
  - Matrix untuk finalisasi draf plus fallback redaksi.
- Lalu migrasikan Discord, Slack, Mattermost, Teams, QQ Bot, dan Feishu.
- Hapus kode finalisasi pratinjau yang terduplikasi hanya setelah setiap channel memiliki
  uji paritas.

### Fase 6: SDK Publik

- Tambahkan `openclaw/plugin-sdk/channel-outbound`.
- Dokumentasikan sebagai API Plugin channel yang disarankan.
- Perbarui ekspor paket, inventaris entrypoint, baseline API yang dihasilkan, dan
  dokumentasi SDK Plugin.
- Sertakan `MessageOrigin`, hook enkode/dekode origin, dan predikat bersama
  `shouldDropOpenClawEcho` di permukaan SDK channel-outbound.
- Pertahankan wrapper kompatibilitas untuk subpath lama.
- Tandai helper SDK bernama reply sebagai usang dalam dokumentasi setelah Plugin bundel
  dimigrasikan.

### Fase 7: Semua Pengirim

Pindahkan semua produser outbound non-reply ke `messages.send`:

- notifikasi cron dan heartbeat
- penyelesaian tugas
- hasil hook
- prompt persetujuan dan hasil persetujuan
- pengiriman alat pesan
- pengumuman penyelesaian subagent
- pengiriman CLI atau Control UI eksplisit
- jalur otomatisasi/broadcast

Di sinilah model berhenti menjadi "balasan agen" dan menjadi "OpenClaw mengirim
pesan".

### Fase 8: Hapus Kompatibilitas Bernama Turn

- Pertahankan wrapper bernama inbound/message sebagai jendela kompatibilitas.
- Terbitkan catatan migrasi.
- Jalankan uji kompatibilitas SDK Plugin terhadap impor lama.
- Hapus atau sembunyikan helper internal lama hanya setelah tidak ada Plugin bundel yang membutuhkannya
  dan kontrak pihak ketiga memiliki pengganti yang stabil.

## Rencana uji

Uji unit:

- Serialisasi dan pemulihan intent kirim tahan lama.
- Penggunaan ulang kunci idempotensi dan penekanan duplikat.
- Commit tanda terima dan lewati replay.
- Pemulihan `unknown_after_send` yang melakukan rekonsiliasi sebelum replay saat adapter
  mendukung rekonsiliasi.
- Kebijakan klasifikasi kegagalan.
- Pengurutan kebijakan ack terima.
- Pemetaan relasi untuk pengiriman reply, followup, system, dan broadcast.
- Factory origin kegagalan Gateway dan predikat `shouldDropOpenClawEcho`.
- Preservasi origin melalui normalisasi payload, chunking, serialisasi antrean tahan lama,
  dan pemulihan.

Uji integrasi:

- Adapter sederhana `channel.inbound.run` tetap mencatat dan mengirim.
- Pengiriman assembled-event lama tidak menjadi tahan lama kecuali channel
  secara eksplisit ikut serta.
- Jembatan `channel.inbound.runPreparedReply` tetap mencatat dan memfinalisasi.
- Helper kompatibilitas publik memanggil callback pengiriman milik pemanggil secara default
  dan tidak melakukan generic-send sebelum callback tersebut.
- Pengiriman fallback tahan lama me-replay seluruh array payload terproyeksi setelah
  restart dan tidak dapat membiarkan payload berikutnya tidak tercatat setelah crash awal.
- Pengiriman assembled-event tahan lama mengembalikan ID pesan platform ke dispatcher
  yang di-buffer.
- Hook pengiriman kustom tetap mengembalikan ID pesan platform saat pengiriman tahan lama
  dinonaktifkan atau tidak tersedia.
- Balasan final bertahan dari restart antara penyelesaian assistant dan pengiriman platform.
- Draf pratinjau difinalisasi di tempat saat diizinkan.
- Draf pratinjau dibatalkan atau direduksi saat ketidakcocokan media/error/reply-target
  memerlukan pengiriman normal.
- Streaming blok dan streaming pratinjau tidak sama-sama mengirim teks yang sama.
- Media yang di-stream lebih awal tidak diduplikasi dalam pengiriman final.

Uji channel:

- Balasan topik Telegram dengan ack polling ditunda sampai watermark selesai aman milik konteks terima.
- Pemulihan polling Telegram untuk pembaruan yang diterima-tetapi-belum-terkirim dicakup oleh
  model offset selesai-aman yang dipersistenkan.
- Pratinjau Telegram yang kedaluwarsa mengirim final baru dan membersihkan pratinjau.
- Fallback senyap Telegram mengirim setiap payload fallback terproyeksi.
- Daya tahan fallback senyap Telegram mencatat seluruh array fallback terproyeksi
  secara atomik, bukan satu intent tahan lama payload tunggal per iterasi loop.
- Pembatalan pratinjau Discord pada media/error/reply eksplisit.
- Final dispatcher yang disiapkan Discord dirutekan melalui konteks kirim sebelum dokumentasi
  atau changelog mengklaim daya tahan final-reply Discord.
- Pengiriman final tahan lama iMessage mengisi cache echo pesan-terkirim monitor.
- Jalur pengiriman lama LINE, Zalo, dan Nostr tidak dilewati oleh
  kirim tahan lama generik sampai uji paritas adapternya ada.
- Pengiriman callback Direct-DM/Nostr tetap otoritatif kecuali secara eksplisit
  dimigrasikan ke target pesan lengkap dan adapter kirim yang aman replay.
- Pesan kegagalan Gateway OpenClaw bertag Slack tetap terlihat outbound, echo
  bot-room bertag dibuang sebelum `allowBots`, dan pesan bot tanpa tag dengan
  teks terlihat yang sama tetap mengikuti otorisasi bot normal.
- Fallback stream native Slack ke pratinjau draf di DM tingkat atas.
- Finalisasi pratinjau Matrix dan fallback redaksi.
- Echo room kegagalan Gateway OpenClaw bertag Matrix dari akun bot yang dikonfigurasi
  dibuang sebelum penanganan `allowBots`.
- Audit kaskade kegagalan Gateway ruang bersama Discord dan Google Chat mencakup
  mode `allowBots` sebelum mengklaim perlindungan generik di sana.
- Finalisasi draf Mattermost dan fallback kirim-baru.
- Finalisasi progres native Teams.
- Penekanan final duplikat Feishu.
- Fallback timeout akumulator QQ Bot.
- Pengiriman final tahan lama Tlon mempertahankan rendering tanda tangan model dan pelacakan
  thread yang diikuti.
- Pengiriman final tahan lama sederhana WhatsApp, Signal, iMessage, Google Chat, LINE, IRC,
  Nostr, Nextcloud Talk, Synology Chat, Tlon, Twitch, Zalo, dan Zalo Personal.

Validasi:

- File Vitest tertarget selama pengembangan.
- `pnpm check:changed` di Testbox untuk seluruh permukaan yang berubah.
- `pnpm check` yang lebih luas di Testbox sebelum mendaratkan refactor lengkap atau setelah
  perubahan SDK/ekspor publik.
- Smoke live atau qa-channel untuk setidaknya satu channel berkemampuan edit dan satu
  channel sederhana hanya-kirim sebelum menghapus wrapper kompatibilitas.

## Pertanyaan terbuka

- Apakah Telegram pada akhirnya harus mengganti sumber runner grammY dengan
  sumber polling yang sepenuhnya tahan lama yang dapat mengontrol pengiriman ulang tingkat platform, bukan
  hanya watermark restart yang dipersistenkan OpenClaw.
- Apakah status pratinjau live tahan lama harus disimpan dalam record antrean yang sama
  dengan intent kirim final atau dalam penyimpanan status live saudara.
- Berapa lama wrapper kompatibilitas tetap didokumentasikan setelah
  `plugin-sdk/channel-outbound` dikirim.
- Apakah Plugin pihak ketiga harus mengimplementasikan adapter terima secara langsung atau hanya
  menyediakan hook normalize/send/live melalui `defineChannelMessageAdapter`.
- Field tanda terima mana yang aman diekspos di SDK publik versus status runtime internal.
- Apakah efek samping seperti cache self-echo dan penanda thread-yang-diikuti
  harus dimodelkan sebagai hook konteks kirim, langkah finalize milik adapter, atau
  subscriber tanda terima.
- Channel mana yang memiliki metadata origin native, mana yang membutuhkan registry outbound
  yang dipersistenkan, dan mana yang tidak dapat menawarkan penekanan echo lintas-bot yang andal.

## Kriteria penerimaan

- Setiap channel pesan bundel mengirim output final yang terlihat melalui
  `messages.send`.
- Setiap channel pesan inbound masuk melalui `messages.receive` atau
  wrapper kompatibilitas terdokumentasi.
- Setiap channel pratinjau/edit/stream menggunakan `messages.live` untuk status draf dan
  finalisasi.
- `channel.inbound` hanya wrapper.
- Helper SDK bernama reply adalah ekspor kompatibilitas, bukan jalur yang disarankan.
- Pemulihan tahan lama dapat me-replay pengiriman final yang tertunda setelah restart tanpa kehilangan
  respons final atau menduplikasi pengiriman yang sudah di-commit; pengiriman dengan
  hasil platform yang tidak diketahui direkonsiliasi sebelum replay atau didokumentasikan sebagai
  setidaknya-sekali untuk adapter tersebut.
- Pengiriman final tahan lama gagal tertutup saat intent tahan lama tidak dapat ditulis,
  kecuali pemanggil secara eksplisit memilih mode non-tahan-lama yang terdokumentasi.
- Helper kompatibilitas SDK lama default ke pengiriman langsung
  milik channel; kirim tahan lama generik hanya ikut-serta eksplisit.
- Tanda terima mempertahankan semua ID pesan platform untuk pengiriman multi-bagian dan
  ID primer untuk kemudahan threading/edit.
- Wrapper tahan lama mempertahankan efek samping lokal channel sebelum mengganti callback
  pengiriman langsung.
- Dispatcher yang disiapkan tidak dihitung sebagai tahan lama sampai jalur pengiriman
  finalnya secara eksplisit menggunakan konteks kirim.
- Pengiriman fallback menangani setiap payload terproyeksi.
- Pengiriman fallback tahan lama mencatat setiap payload terproyeksi dalam satu intent
  atau rencana batch yang dapat di-replay.
- Output kegagalan Gateway yang berasal dari OpenClaw terlihat oleh manusia tetapi echo
  room bertag yang ditulis bot dibuang sebelum otorisasi bot pada channel yang
  menyatakan dukungan untuk kontrak origin.
- Dokumentasi menjelaskan kirim, terima, live, status, tanda terima, relasi, kebijakan
  kegagalan, migrasi, dan cakupan uji.

## Terkait

- [Pesan](/id/concepts/messages)
- [Streaming dan chunking](/id/concepts/streaming)
- [Draf progres](/id/concepts/progress-drafts)
- [Kebijakan retry](/id/concepts/retry)
- [API inbound channel](/id/plugins/sdk-channel-inbound)
