---
read_when:
    - Memfaktorkan ulang perilaku pengiriman atau penerimaan pada saluran
    - Mengubah giliran saluran, pengiriman balasan, antrean keluar, streaming pratinjau, atau API pesan SDK Plugin
    - Merancang Plugin saluran baru yang membutuhkan pengiriman persisten, tanda terima, pratinjau, pengeditan, atau percobaan ulang
summary: Rencana desain untuk siklus hidup terpadu penerimaan, pengiriman, pratinjau, penyuntingan, dan pengaliran pesan persisten
title: Refaktor siklus hidup pesan
x-i18n:
    generated_at: "2026-05-06T09:07:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Halaman ini adalah desain target untuk menggantikan helper turn channel, dispatch balasan, streaming pratinjau, dan pengiriman outbound yang tersebar dengan satu lifecycle pesan yang tahan lama.

Versi singkatnya:

- Primitif inti seharusnya **terima** dan **kirim**, bukan **balas**.
- Balasan hanyalah relasi pada pesan outbound.
- Turn adalah kemudahan pemrosesan inbound, bukan pemilik pengiriman.
- Pengiriman harus berbasis konteks: `begin`, render, pratinjau atau stream, kirim final, commit, gagal.
- Penerimaan juga harus berbasis konteks: normalisasi, dedupe, route, catat, dispatch, ack platform, gagal.
- SDK Plugin publik seharusnya diringkas menjadi satu permukaan channel-message kecil.

## Masalah

Stack channel saat ini tumbuh dari beberapa kebutuhan lokal yang valid:

- Adapter inbound sederhana menggunakan `runtime.channel.turn.run`.
- Adapter kaya menggunakan `runtime.channel.turn.runPrepared`.
- Helper lama menggunakan `dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`, helper payload balasan, chunking balasan, referensi balasan, dan helper runtime outbound.
- Streaming pratinjau berada di dispatcher khusus channel.
- Ketahanan pengiriman final sedang ditambahkan di sekitar path payload balasan yang ada.

Bentuk itu memperbaiki bug lokal, tetapi membuat OpenClaw memiliki terlalu banyak konsep publik dan terlalu banyak tempat tempat semantik pengiriman bisa menyimpang.

Masalah reliabilitas yang mengekspos ini adalah:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Invariant target lebih luas daripada Telegram: begitu core memutuskan pesan outbound yang terlihat harus ada, intent harus durable sebelum pengiriman platform dicoba, dan receipt platform harus di-commit setelah sukses. Itu memberi OpenClaw pemulihan at-least-once. Perilaku exactly-once hanya ada untuk adapter yang dapat membuktikan idempotensi native atau merekonsiliasi upaya unknown-after-send terhadap state platform sebelum replay.

Itu adalah keadaan akhir untuk refactor ini, bukan deskripsi setiap path saat ini. Selama migrasi, helper outbound yang ada masih dapat jatuh ke pengiriman langsung ketika penulisan antrean best-effort gagal. Refactor selesai hanya ketika pengiriman final durable gagal tertutup atau secara eksplisit opt out dengan kebijakan non-durable yang terdokumentasi.

## Tujuan

- Satu lifecycle inti untuk semua path terima dan kirim pesan channel.
- Pengiriman final durable secara default di lifecycle pesan baru setelah adapter menyatakan perilaku replay-safe.
- Semantik pratinjau, edit, stream, finalisasi, retry, pemulihan, dan receipt bersama.
- Permukaan SDK Plugin kecil yang dapat dipelajari dan dipelihara Plugin pihak ketiga.
- Kompatibilitas untuk pemanggil `channel.turn` yang ada selama migrasi.
- Titik ekstensi yang jelas untuk kemampuan channel baru.
- Tidak ada cabang khusus platform di core.
- Tidak ada pesan channel token-delta. Streaming channel tetap berupa pratinjau pesan, edit, append, atau pengiriman blok selesai.
- Metadata asal OpenClaw yang terstruktur untuk output operasional/sistem agar kegagalan gateway yang terlihat tidak masuk kembali ke room bersama yang mengaktifkan bot sebagai prompt baru.

## Bukan tujuan

- Jangan hapus `runtime.channel.turn.*` pada fase pertama.
- Jangan paksa setiap channel ke perilaku transport native yang sama.
- Jangan ajari core topik Telegram, stream native Slack, redaksi Matrix, kartu Feishu, suara QQ, atau aktivitas Teams.
- Jangan publikasikan semua helper migrasi internal sebagai API SDK stabil.
- Jangan buat retry memutar ulang operasi platform non-idempotent yang sudah selesai.

## Model referensi

Vercel Chat memiliki model mental publik yang baik:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- metode adapter seperti `postMessage`, `editMessage`, `deleteMessage`, `stream`, `startTyping`, dan pengambilan riwayat
- adapter state untuk dedupe, lock, antrean, dan persistensi

OpenClaw sebaiknya meminjam kosakatanya, bukan menyalin permukaannya.

Yang dibutuhkan OpenClaw di luar model itu:

- Intent pengiriman outbound durable sebelum panggilan transport langsung.
- Konteks pengiriman eksplisit dengan begin, commit, dan fail.
- Konteks penerimaan yang mengetahui kebijakan ack platform.
- Receipt yang bertahan dari restart dan dapat menggerakkan edit, hapus, pemulihan, dan penekanan duplikat.
- SDK publik yang lebih kecil. Plugin bawaan dapat menggunakan helper runtime internal, tetapi Plugin pihak ketiga seharusnya melihat satu API pesan yang koheren.
- Perilaku khusus agen: sesi, transkrip, streaming blok, progres tool, persetujuan, arahan media, balasan senyap, dan riwayat mention grup.

Promise bergaya `thread.post()` tidak cukup untuk OpenClaw. Promise itu menyembunyikan batas transaksi yang menentukan apakah pengiriman dapat dipulihkan.

## Model inti

Domain baru seharusnya berada di bawah namespace core internal seperti `src/channels/message/*`.

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

`state` memiliki penyimpanan intent durable, receipt, idempotensi, pemulihan, lock, dan dedupe.

## Istilah pesan

### Pesan

Pesan ternormalisasi bersifat netral platform:

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

Target menjelaskan di mana pesan berada:

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

Ini memungkinkan path pengiriman yang sama menangani balasan normal, notifikasi cron, prompt persetujuan, penyelesaian tugas, pengiriman message-tool, pengiriman CLI atau Control UI, hasil subagent, dan pengiriman otomasi.

### Asal

Origin menjelaskan siapa yang menghasilkan pesan dan bagaimana OpenClaw seharusnya memperlakukan echo pesan itu. Ini terpisah dari relasi: sebuah pesan dapat berupa balasan kepada pengguna dan tetap merupakan output operasional yang berasal dari OpenClaw.

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

Core memiliki makna output yang berasal dari OpenClaw. Channel memiliki cara origin itu dienkode ke transport mereka.

Penggunaan wajib pertama adalah output kegagalan Gateway. Manusia tetap harus melihat pesan seperti "Agen gagal sebelum membalas" atau "Kunci API hilang", tetapi output operasional OpenClaw yang ditag tidak boleh diterima sebagai input yang ditulis bot di room bersama ketika `allowBots` diaktifkan.

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

Receipt adalah jembatan dari intent durable ke edit, hapus, finalisasi pratinjau, penekanan duplikat, dan pemulihan di masa depan.

Receipt dapat menjelaskan satu pesan platform atau pengiriman multi-bagian. Teks yang dipecah menjadi chunk, media plus teks, suara plus teks, dan fallback kartu harus mempertahankan semua id platform sekaligus tetap mengekspos id utama untuk threading dan edit berikutnya.

## Konteks penerimaan

Penerimaan seharusnya bukan panggilan helper kosong. Core membutuhkan konteks yang mengetahui dedupe, routing, pencatatan sesi, dan kebijakan ack platform.

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

Flow penerimaan:

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

Ack bukan satu hal. Kontrak penerimaan harus memisahkan sinyal ini:

- **Ack transport:** memberi tahu webhook atau socket platform bahwa OpenClaw menerima envelope event. Beberapa platform mewajibkan ini sebelum dispatch.
- **Ack offset polling:** memajukan cursor agar event yang sama tidak diambil lagi. Ini tidak boleh maju melewati pekerjaan yang tidak dapat dipulihkan.
- **Ack catatan inbound:** mengonfirmasi OpenClaw telah mempersistensikan metadata inbound yang cukup untuk dedupe dan route redelivery.
- **Receipt terlihat pengguna:** perilaku baca/status/typing opsional; tidak pernah menjadi batas durability.

`ReceiveAckPolicy` hanya mengontrol acknowledgment transport atau polling. Ini tidak boleh digunakan kembali untuk read receipt atau reaksi status.

Sebelum otorisasi bot, penerimaan harus menerapkan kebijakan echo OpenClaw bersama ketika channel dapat mendekode metadata origin pesan:

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

Drop ini berbasis tag, bukan berbasis teks. Pesan room yang ditulis bot dengan teks kegagalan gateway terlihat yang sama tetapi tanpa metadata origin OpenClaw tetap melalui otorisasi `allowBots` normal.

Kebijakan ack eksplisit:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Polling Telegram sekarang menggunakan kebijakan ack receive-context untuk watermark restart yang dipersistensikan. Tracker masih mengamati pembaruan grammY saat masuk ke chain middleware, tetapi OpenClaw hanya mempersistensikan id pembaruan selesai yang aman setelah dispatch sukses, sehingga pembaruan yang gagal atau pending lebih rendah tetap dapat di-replay setelah restart. Offset fetch `getUpdates` upstream Telegram masih dikontrol oleh library polling, jadi langkah lebih dalam yang tersisa adalah sumber polling sepenuhnya durable jika kita membutuhkan redelivery tingkat platform di luar watermark restart OpenClaw. Platform webhook mungkin membutuhkan ack HTTP segera, tetapi tetap membutuhkan dedupe inbound dan intent pengiriman outbound durable karena webhook dapat melakukan redelivery.

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

Intent harus ada sebelum I/O transport. Restart setelah begin tetapi sebelum
commit dapat dipulihkan.

Batas berbahayanya ada setelah keberhasilan platform dan sebelum commit receipt. Jika sebuah
proses mati di sana, OpenClaw tidak dapat mengetahui apakah pesan platform sudah ada
kecuali adapter menyediakan idempotensi native atau jalur rekonsiliasi receipt.
Upaya tersebut harus dilanjutkan dalam `unknown_after_send`, bukan diputar ulang secara membabi buta. Channel
tanpa rekonsiliasi boleh memilih pemutaran ulang at-least-once hanya jika pesan
terlihat duplikat merupakan tradeoff yang dapat diterima dan terdokumentasi untuk channel dan relasi tersebut.
Bridge rekonsiliasi SDK saat ini mengharuskan adapter mendeklarasikan
`reconcileUnknownSend`, lalu meminta `durableFinal.reconcileUnknownSend` untuk
mengklasifikasikan entri yang tidak diketahui sebagai `sent`, `not_sent`, atau `unresolved`; hanya `not_sent`
yang mengizinkan pemutaran ulang, dan entri yang belum terselesaikan tetap terminal atau hanya mencoba ulang
pemeriksaan rekonsiliasi.

Kebijakan durabilitas harus eksplisit:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` berarti core harus fail closed ketika tidak dapat menulis intent durable.
`best_effort` dapat diteruskan ketika persistensi tidak tersedia. `disabled` mempertahankan
perilaku direct send lama. Selama migrasi, wrapper lama dan helper kompatibilitas publik
default ke `disabled`; keduanya tidak boleh menyimpulkan `required` dari
fakta bahwa sebuah channel memiliki adapter outbound generik.

Konteks pengiriman juga memiliki efek pascapengiriman lokal channel. Migrasi tidak aman
jika pengiriman durable melewati perilaku lokal yang sebelumnya melekat pada
jalur direct send channel. Contohnya mencakup cache penekanan self-echo,
penanda partisipasi thread, jangkar edit native, rendering tanda tangan model,
dan penjaga duplikat khusus platform. Efek tersebut harus dipindahkan ke
adapter send, adapter render, atau hook send-context bernama sebelum
channel tersebut dapat mengaktifkan pengiriman final generik durable.

Helper pengiriman harus mengembalikan receipt sepenuhnya ke pemanggilnya. Wrapper
durable tidak dapat menelan id pesan atau mengganti hasil pengiriman channel dengan
`undefined`; dispatcher buffered menggunakan id tersebut untuk jangkar thread, edit berikutnya,
finalisasi pratinjau, dan penekanan duplikat.

Pengiriman fallback beroperasi pada batch, bukan payload tunggal. Penulisan ulang silent-reply,
fallback media, fallback kartu, dan proyeksi chunk semuanya dapat menghasilkan lebih dari
satu pesan yang dapat dikirim, sehingga konteks pengiriman harus mengirim seluruh
batch yang diproyeksikan atau mendokumentasikan secara eksplisit mengapa hanya satu payload yang valid.

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

Ketika fallback seperti itu durable, seluruh batch yang diproyeksikan harus direpresentasikan oleh
satu intent pengiriman durable atau rencana batch atomik lainnya. Merekam setiap payload
satu per satu tidak cukup: crash di antara payload dapat meninggalkan fallback
terlihat parsial tanpa catatan durable untuk payload yang tersisa. Pemulihan harus mengetahui
unit mana yang sudah memiliki receipt dan memutar ulang hanya unit yang hilang atau menandai
batch sebagai `unknown_after_send` sampai adapter merekonsiliasinya.

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

Ini seharusnya mencakup perilaku saat ini:

- Telegram mengirim plus mengedit pratinjau, dengan final baru setelah usia pratinjau kedaluwarsa.
- Discord mengirim plus mengedit pratinjau, membatalkan pada media/error/balasan eksplisit.
- Stream native Slack atau pratinjau draf bergantung pada bentuk thread.
- Finalisasi post draf Mattermost.
- Finalisasi event draf Matrix atau redaksi saat tidak cocok.
- Stream progres native Teams.
- Stream QQ Bot atau fallback terakumulasi.

## Permukaan adapter

Target SDK publik sebaiknya satu subpath:

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

Adapter send:

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

Adapter receive:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Sebelum otorisasi preflight, core harus menjalankan predikat echo OpenClaw bersama
setiap kali `origin.decode` mengembalikan metadata asal OpenClaw. Adapter receive
menyediakan fakta platform seperti penulis bot dan bentuk room; core memiliki keputusan
drop dan pengurutan sehingga channel tidak mengimplementasikan ulang filter teks.

Adapter origin:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core menetapkan `MessageOrigin`. Channel hanya menerjemahkannya ke dan dari metadata
transport native. Slack memetakannya ke `chat.postMessage({ metadata })` dan
`message.metadata` inbound; Matrix dapat memetakannya ke konten event tambahan; channel
tanpa metadata native dapat menggunakan registry receipt/outbound ketika itu merupakan
perkiraan terbaik yang tersedia.

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

Permukaan publik baru sebaiknya menyerap atau menghentikan secara bertahap area konseptual ini:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- sebagian besar penggunaan publik `outbound-runtime`
- helper siklus hidup stream draf ad hoc

Subpath kompatibilitas dapat tetap ada sebagai wrapper, tetapi plugin pihak ketiga baru
seharusnya tidak membutuhkannya.

Plugin bawaan dapat mempertahankan impor helper internal melalui subpath runtime
cadangan selama migrasi. Dokumentasi publik sebaiknya mengarahkan penulis plugin ke
`plugin-sdk/channel-message` setelah tersedia.

## Hubungan dengan channel turn

`runtime.channel.turn.*` harus tetap ada selama migrasi.

Itu sebaiknya menjadi adapter kompatibilitas:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` juga harus tetap ada pada awalnya:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Setelah semua plugin bawaan dan jalur kompatibilitas pihak ketiga yang diketahui dijembatani,
`channel.turn` dapat dihentikan secara bertahap. Itu tidak boleh dihapus sampai ada
jalur migrasi SDK yang dipublikasikan dan pengujian kontrak yang membuktikan plugin lama masih berfungsi
atau gagal dengan error versi yang jelas.

## Guardrail kompatibilitas

Selama migrasi, pengiriman generik durable bersifat opt-in untuk channel mana pun yang
callback pengiriman yang ada memiliki efek samping selain "send this payload".

Titik masuk lama secara default tidak durable:

- `channel.turn.run` dan `dispatchAssembledChannelTurn` menggunakan callback
  pengiriman channel kecuali channel tersebut secara eksplisit menyediakan objek kebijakan/opsi durable
  yang telah diaudit.
- `channel.turn.runPrepared` tetap dimiliki channel sampai dispatcher prepared
  secara eksplisit memanggil konteks pengiriman.
- Helper kompatibilitas publik seperti `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase`, dan helper direct-DM tidak pernah menyuntikkan pengiriman
  generik durable sebelum callback `deliver` atau `reply` yang disediakan pemanggil.

Untuk tipe bridge migrasi, `durable: undefined` berarti "tidak durable". Jalur
durable diaktifkan hanya oleh nilai kebijakan/opsi eksplisit. `durable:
false` dapat tetap ada sebagai ejaan kompatibilitas, tetapi implementasi tidak boleh
mengharuskan setiap channel yang belum dimigrasikan menambahkannya.

Kode bridge saat ini harus menjaga keputusan durabilitas tetap eksplisit:

- Pengiriman final persisten mengembalikan status terdiskriminasi. `handled_visible` dan
  `handled_no_send` bersifat terminal; `unsupported` dan `not_applicable` dapat
  fallback ke pengiriman yang dimiliki saluran; `failed` meneruskan kegagalan pengiriman.
- Pengiriman final persisten generik digerbangi oleh kapabilitas adaptor seperti
  pengiriman senyap, pelestarian target balasan, pelestarian kutipan native, dan
  hook pengiriman pesan. Paritas yang hilang harus memilih pengiriman yang dimiliki saluran,
  bukan pengiriman generik yang mengubah perilaku yang terlihat pengguna.
- Pengiriman persisten yang didukung antrean mengekspos referensi intensi pengiriman. Field sesi
  `pendingFinalDelivery*` yang ada dapat membawa id intensi selama
  transisi; keadaan akhirnya adalah penyimpanan `MessageSendIntent`, bukan teks
  balasan beku ditambah field konteks ad hoc.

Jangan aktifkan jalur persisten generik untuk sebuah saluran sampai semua hal ini
benar:

- Adaptor pengiriman generik menjalankan perilaku rendering dan transport yang sama dengan
  jalur langsung lama.
- Efek samping lokal setelah pengiriman dipertahankan melalui konteks pengiriman.
- Adaptor mengembalikan tanda terima atau hasil pengiriman dengan semua id pesan
  platform.
- Jalur dispatcher yang disiapkan memanggil konteks pengiriman baru atau tetap terdokumentasi
  sebagai berada di luar jaminan persisten.
- Pengiriman fallback menangani setiap payload terproyeksi, bukan hanya yang pertama.
- Pengiriman fallback persisten merekam seluruh array payload terproyeksi sebagai satu
  intensi atau rencana batch yang dapat diputar ulang.

Bahaya migrasi konkret yang harus dipertahankan:

- Pengiriman monitor iMessage merekam pesan terkirim dalam cache gema setelah
  pengiriman berhasil. Pengiriman final persisten tetap harus mengisi cache itu, jika tidak
  OpenClaw dapat menelan ulang balasan finalnya sendiri sebagai pesan pengguna masuk.
- Tlon menambahkan tanda tangan model opsional dan merekam thread yang diikuti
  setelah balasan grup. Pengiriman persisten generik tidak boleh melewati efek tersebut;
  pindahkan efek itu ke adaptor render/kirim/finalisasi Tlon atau pertahankan Tlon pada
  jalur yang dimiliki saluran.
- Discord dan dispatcher lain yang disiapkan sudah memiliki perilaku pengiriman langsung dan pratinjau
  sendiri. Mereka tidak tercakup oleh jaminan persisten giliran-terakit sampai
  dispatcher yang disiapkan secara eksplisit merutekan final melalui konteks pengiriman.
- Pengiriman fallback senyap Telegram harus mengirimkan seluruh array payload
  terproyeksi. Pintasan satu-payload dapat membuang payload fallback tambahan setelah
  proyeksi.
- LINE, BlueBubbles, Zalo, Nostr, dan jalur terakit/helper lain yang ada mungkin
  memiliki penanganan token balasan, proxy media, cache pesan terkirim, pembersihan
  pemuatan/status, atau target hanya-callback. Jalur-jalur itu tetap pada pengiriman yang dimiliki saluran sampai
  semantik tersebut direpresentasikan oleh adaptor pengiriman dan diverifikasi oleh pengujian.
- Helper DM langsung dapat memiliki callback balasan yang merupakan satu-satunya target transport
  yang benar. Outbound generik tidak boleh menebak dari `OriginatingTo` atau `To` dan melewati
  callback tersebut.
- Output kegagalan Gateway OpenClaw harus tetap terlihat oleh manusia, tetapi gema ruang
  yang ditandai sebagai dibuat oleh bot harus dibuang sebelum otorisasi `allowBots`.
  Saluran tidak boleh mengimplementasikan ini dengan filter prefiks teks terlihat kecuali sebagai
  penghenti darurat singkat; kontrak persisten adalah metadata asal terstruktur.

## Penyimpanan internal

Antrean persisten harus menyimpan intensi pengiriman pesan, bukan payload balasan.

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
- Jangan coba ulang `invalid_payload` kecuali fallback render tersedia.
- Jangan coba ulang `auth` atau `permission` sampai konfigurasi berubah.
- Untuk `not_found`, biarkan finalisasi live fallback dari edit ke pengiriman baru ketika
  saluran menyatakan bahwa itu aman.
- Untuk `conflict`, gunakan aturan tanda terima/idempotensi untuk memutuskan apakah pesan
  sudah ada.
- Setiap error setelah adaptor mungkin telah menyelesaikan I/O platform tetapi sebelum commit
  tanda terima menjadi `unknown_after_send` kecuali adaptor dapat membuktikan bahwa operasi
  platform tidak terjadi.

## Pemetaan saluran

| Saluran                  | Target migrasi                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | Menerima kebijakan ack plus pengiriman final yang persisten. Adapter waktu nyata menangani pengiriman plus pratinjau edit, pengiriman final pratinjau kedaluwarsa, topik, lewati pratinjau balasan-kutipan, fallback media, dan penanganan retry-after.                                                                                                      |
| Discord                  | Adapter pengiriman membungkus pengiriman payload persisten yang ada. Adapter waktu nyata menangani edit draf, draf progres, pembatalan pratinjau media/galat, pelestarian target balasan, dan tanda terima id pesan. Audit gema kegagalan Gateway buatan bot di ruang bersama; gunakan registri keluar atau padanan native lain jika Discord tidak dapat membawa metadata asal pada pesan normal. |
| Slack                    | Adapter pengiriman menangani posting chat normal. Adapter waktu nyata memilih stream native saat bentuk thread mendukungnya, jika tidak menggunakan pratinjau draf. Tanda terima mempertahankan timestamp thread. Adapter asal memetakan kegagalan Gateway OpenClaw ke `chat.postMessage.metadata` Slack dan membuang gema ruang-bot bertanda sebelum otorisasi `allowBots`.                                  |
| WhatsApp                 | Adapter pengiriman menangani pengiriman teks/media dengan intensi final persisten. Adapter penerimaan menangani mention grup dan identitas pengirim. Waktu nyata dapat tetap tidak ada sampai WhatsApp memiliki transport yang dapat diedit.                                                                                                                                                                        |
| Matrix                   | Adapter waktu nyata menangani edit event draf, finalisasi, redaksi, batasan media terenkripsi, dan fallback ketidakcocokan target balasan. Adapter penerimaan menangani hidrasi event terenkripsi dan deduplikasi. Adapter asal harus mengodekan asal kegagalan Gateway OpenClaw ke dalam konten event Matrix dan membuang gema ruang bot terkonfigurasi sebelum penanganan `allowBots`.              |
| Mattermost               | Adapter waktu nyata menangani satu posting draf, pelipatan progres/tool, finalisasi di tempat, dan fallback pengiriman baru.                                                                                                                                                                                                                                                       |
| Microsoft Teams          | Adapter waktu nyata menangani progres native dan perilaku stream blok. Adapter pengiriman menangani aktivitas serta tanda terima lampiran/kartu.                                                                                                                                                                                                                                        |
| Feishu                   | Adapter render menangani rendering teks/kartu/raw. Adapter waktu nyata menangani kartu streaming dan penekanan final duplikat. Adapter pengiriman menangani komentar, sesi topik, media, dan penekanan suara.                                                                                                                                                                      |
| QQ Bot                   | Adapter waktu nyata menangani streaming C2C, timeout akumulator, dan pengiriman final fallback. Adapter render menangani tag media dan teks-sebagai-suara.                                                                                                                                                                                                                               |
| Signal                   | Adapter penerimaan plus pengiriman sederhana. Tidak ada adapter waktu nyata kecuali signal-cli menambahkan dukungan edit yang andal.                                                                                                                                                                                                                                                                |
| iMessage dan BlueBubbles | Adapter penerimaan plus pengiriman sederhana. Pengiriman iMessage harus mempertahankan pengisian cache-gema monitor sebelum final persisten dapat melewati pengiriman monitor. Pengetikan, reaksi, dan lampiran khusus BlueBubbles tetap menjadi kapabilitas adapter.                                                                                                                            |
| Google Chat              | Adapter penerimaan plus pengiriman sederhana dengan relasi thread yang dipetakan ke space dan id thread. Audit perilaku ruang `allowBots=true` untuk gema kegagalan Gateway OpenClaw bertanda.                                                                                                                                                                                        |
| LINE                     | Adapter penerimaan plus pengiriman sederhana dengan batasan reply-token dimodelkan sebagai kapabilitas target/relasi.                                                                                                                                                                                                                                                           |
| Nextcloud Talk           | Bridge penerimaan SDK plus adapter pengiriman.                                                                                                                                                                                                                                                                                                                          |
| IRC                      | Adapter penerimaan plus pengiriman sederhana, tanpa tanda terima edit persisten.                                                                                                                                                                                                                                                                                                    |
| Nostr                    | Adapter penerimaan plus pengiriman untuk DM terenkripsi; tanda terima berupa id event.                                                                                                                                                                                                                                                                                           |
| QA Channel               | Adapter pengujian kontrak untuk perilaku penerimaan, pengiriman, waktu nyata, retry, dan pemulihan.                                                                                                                                                                                                                                                                                   |
| Synology Chat            | Adapter penerimaan plus pengiriman sederhana.                                                                                                                                                                                                                                                                                                                              |
| Tlon                     | Adapter pengiriman harus mempertahankan rendering tanda tangan model dan pelacakan thread yang diikuti sebelum pengiriman final persisten generik diaktifkan.                                                                                                                                                                                                                        |
| Twitch                   | Adapter penerimaan plus pengiriman sederhana dengan klasifikasi batas laju.                                                                                                                                                                                                                                                                                               |
| Zalo                     | Adapter penerimaan plus pengiriman sederhana.                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal            | Adapter penerimaan plus pengiriman sederhana.                                                                                                                                                                                                                                                                                                                              |

## Rencana migrasi

### Fase 1: Domain Pesan Internal

- Tambahkan tipe `src/channels/message/*` untuk pesan, target, relasi,
  asal, tanda terima, kapabilitas, intensi persisten, konteks penerimaan, konteks pengiriman,
  konteks waktu nyata, dan kelas kegagalan.
- Tambahkan `origin?: MessageOrigin` ke tipe payload bridge migrasi yang digunakan oleh
  pengiriman balasan saat ini, lalu pindahkan field tersebut ke `ChannelMessage` dan tipe pesan
  yang dirender saat refactor menggantikan payload balasan.
- Pertahankan ini tetap internal sampai adapter dan pengujian membuktikan bentuknya.
- Tambahkan pengujian unit murni untuk transisi status dan serialisasi.

### Fase 2: Core Pengiriman Persisten

- Pindahkan antrean keluar yang ada dari persistensi payload balasan ke intensi
  pengiriman pesan persisten.
- Biarkan intensi pengiriman persisten membawa array payload terproyeksi atau rencana batch, bukan
  hanya satu payload balasan.
- Pertahankan perilaku pemulihan antrean saat ini melalui konversi kompatibilitas.
- Buat `deliverOutboundPayloads` memanggil `messages.send`.
- Jadikan persistensi pengiriman final sebagai default dan gagal tertutup saat intensi persisten
  tidak dapat ditulis dalam siklus hidup pesan baru, setelah adapter menyatakan
  keamanan replay. Jalur kompatibilitas channel-turn dan SDK yang ada tetap
  menggunakan pengiriman langsung secara default selama fase ini.
- Catat tanda terima secara konsisten.
- Kembalikan tanda terima dan hasil pengiriman ke pemanggil dispatcher asli, bukan
  memperlakukan pengiriman persisten sebagai efek samping terminal.
- Persistensikan asal pesan melalui intensi pengiriman persisten sehingga pemulihan, replay, dan
  pengiriman berpotongan mempertahankan provenance operasional OpenClaw.

### Fase 3: Bridge Giliran Saluran

- Implementasikan ulang `channel.turn.run` dan `dispatchAssembledChannelTurn` di atas
  `messages.receive` dan `messages.send`.
- Pertahankan tipe fact saat ini tetap stabil.
- Pertahankan perilaku legacy secara default. Saluran assembled-turn menjadi persisten
  hanya ketika adapternya secara eksplisit ikut serta dengan kebijakan persistensi yang aman untuk replay.
- Pertahankan `durable: false` sebagai hatch escape kompatibilitas untuk jalur yang memfinalisasi
  edit native dan belum dapat di-replay dengan aman, tetapi jangan mengandalkan penanda `false`
  untuk melindungi saluran yang belum dimigrasikan.
- Default-kan persistensi assembled-turn hanya dalam siklus hidup pesan baru, setelah
  pemetaan saluran membuktikan jalur pengiriman generik mempertahankan semantik pengiriman saluran lama.

### Fase 4: Bridge Dispatcher yang Disiapkan

- Ganti `deliverDurableInboundReplyPayload` dengan jembatan konteks pengiriman.
- Pertahankan helper lama sebagai wrapper.
- Porting Telegram, WhatsApp, Slack, Signal, iMessage, dan Discord terlebih dahulu karena
  semuanya sudah memiliki pekerjaan durable-final atau jalur pengiriman yang lebih sederhana.
- Perlakukan setiap dispatcher yang disiapkan sebagai belum tercakup sampai secara eksplisit ikut serta dalam
  konteks pengiriman. Dokumentasi dan entri changelog harus mengatakan "assembled
  channel turns" atau menyebut jalur channel yang dimigrasikan, bukan mengklaim semua
  balasan final otomatis.
- Pertahankan perilaku `recordInboundSessionAndDispatchReply`, helper direct-DM, dan helper kompatibilitas
  publik serupa. Semuanya boleh mengekspos opt-in konteks pengiriman eksplisit nanti, tetapi tidak boleh
  otomatis mencoba pengiriman durable generik sebelum callback pengiriman yang dimiliki pemanggil.

### Fase 5: Siklus Hidup Live Terpadu

- Bangun `messages.live` dengan dua adaptor pembuktian:
  - Telegram untuk pengiriman plus edit plus pengiriman final basi.
  - Matrix untuk finalisasi draf plus fallback redaksi.
- Lalu migrasikan Discord, Slack, Mattermost, Teams, QQ Bot, dan Feishu.
- Hapus kode finalisasi pratinjau yang terduplikasi hanya setelah setiap channel memiliki
  pengujian paritas.

### Fase 6: SDK Publik

- Tambahkan `openclaw/plugin-sdk/channel-message`.
- Dokumentasikan sebagai API Plugin channel yang direkomendasikan.
- Perbarui ekspor paket, inventaris entrypoint, baseline API yang dihasilkan, dan
  dokumentasi SDK Plugin.
- Sertakan `MessageOrigin`, hook encode/decode asal, dan predikat bersama
  `shouldDropOpenClawEcho` di permukaan SDK channel-message.
- Pertahankan wrapper kompatibilitas untuk subpath lama.
- Tandai helper SDK bernama reply sebagai usang dalam dokumentasi setelah Plugin bawaan
  dimigrasikan.

### Fase 7: Semua Pengirim

Pindahkan semua produsen outbound non-reply ke `messages.send`:

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

### Fase 8: Usangkan Turn

- Pertahankan `channel.turn` sebagai wrapper untuk setidaknya satu jendela kompatibilitas.
- Publikasikan catatan migrasi.
- Jalankan pengujian kompatibilitas SDK Plugin terhadap impor lama.
- Hapus atau sembunyikan helper internal lama hanya setelah tidak ada Plugin bawaan yang membutuhkannya
  dan kontrak pihak ketiga memiliki pengganti yang stabil.

## Rencana pengujian

Pengujian unit:

- Serialisasi dan pemulihan intent pengiriman durable.
- Penggunaan ulang kunci idempotensi dan penekanan duplikat.
- Commit receipt dan lewati replay.
- Pemulihan `unknown_after_send` yang melakukan rekonsiliasi sebelum replay saat adaptor
  mendukung rekonsiliasi.
- Kebijakan klasifikasi kegagalan.
- Pengurutan kebijakan ack penerimaan.
- Pemetaan relasi untuk pengiriman reply, followup, system, dan broadcast.
- Factory asal kegagalan Gateway dan predikat `shouldDropOpenClawEcho`.
- Pelestarian asal melalui normalisasi payload, chunking, serialisasi antrean durable,
  dan pemulihan.

Pengujian integrasi:

- Adaptor sederhana `channel.turn.run` tetap mencatat dan mengirim.
- Pengiriman assembled-turn lama tidak menjadi durable kecuali channel
  secara eksplisit ikut serta.
- Jembatan `channel.turn.runPrepared` tetap mencatat dan memfinalisasi.
- Helper kompatibilitas publik memanggil callback pengiriman yang dimiliki pemanggil secara default
  dan tidak melakukan generic-send sebelum callback tersebut.
- Pengiriman fallback durable memutar ulang seluruh array payload yang diproyeksikan setelah
  restart dan tidak dapat membiarkan payload berikutnya tidak tercatat setelah crash awal.
- Pengiriman assembled-turn durable mengembalikan id pesan platform ke dispatcher
  yang dibuffer.
- Hook pengiriman kustom tetap mengembalikan id pesan platform saat pengiriman durable
  dinonaktifkan atau tidak tersedia.
- Balasan final bertahan dari restart antara penyelesaian asisten dan pengiriman platform.
- Draf pratinjau difinalisasi di tempat saat diizinkan.
- Draf pratinjau dibatalkan atau direduksi saat ketidakcocokan media/error/target-reply
  membutuhkan pengiriman normal.
- Streaming blok dan streaming pratinjau tidak sama-sama mengirim teks yang sama.
- Media yang di-stream lebih awal tidak diduplikasi dalam pengiriman final.

Pengujian channel:

- Balasan topik Telegram dengan ack polling ditunda sampai watermark selesai aman milik konteks penerimaan.
- Pemulihan polling Telegram untuk pembaruan yang diterima-tetapi-belum-terkirim dicakup oleh
  model offset safe-completed yang dipersistenkan.
- Pratinjau basi Telegram mengirim final baru dan membersihkan pratinjau.
- Fallback senyap Telegram mengirim setiap payload fallback yang diproyeksikan.
- Durabilitas fallback senyap Telegram mencatat seluruh array fallback yang diproyeksikan
  secara atomik, bukan satu intent durable payload tunggal per iterasi loop.
- Pembatalan pratinjau Discord pada media/error/reply eksplisit.
- Final dispatcher Discord yang disiapkan dirutekan melalui konteks pengiriman sebelum dokumentasi
  atau changelog mengklaim durabilitas final-reply Discord.
- Pengiriman final durable iMessage mengisi cache echo pesan-terkirim monitor.
- Jalur pengiriman lama LINE, BlueBubbles, Zalo, dan Nostr tidak dilewati oleh
  pengiriman durable generik sampai pengujian paritas adaptornya ada.
- Pengiriman callback Direct-DM/Nostr tetap otoritatif kecuali secara eksplisit
  dimigrasikan ke target pesan lengkap dan adaptor pengiriman replay-safe.
- Pesan kegagalan Gateway OpenClaw bertag Slack tetap terlihat outbound, echo bot-room bertag
  turun sebelum `allowBots`, dan pesan bot tanpa tag dengan
  teks terlihat yang sama tetap mengikuti otorisasi bot normal.
- Fallback stream native Slack ke pratinjau draf di DM tingkat atas.
- Finalisasi pratinjau Matrix dan fallback redaksi.
- Echo ruang kegagalan Gateway OpenClaw bertag Matrix dari akun bot yang dikonfigurasi
  turun sebelum penanganan `allowBots`.
- Audit cascade kegagalan Gateway ruang bersama Discord dan Google Chat mencakup
  mode `allowBots` sebelum mengklaim perlindungan generik di sana.
- Finalisasi draf Mattermost dan fallback fresh-send.
- Finalisasi progres native Teams.
- Penekanan final duplikat Feishu.
- Fallback timeout akumulator QQ Bot.
- Pengiriman final durable Tlon mempertahankan rendering model-signature dan pelacakan thread
  yang diikuti.
- Pengiriman final durable sederhana WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo, dan Zalo Personal.

Validasi:

- File Vitest tertarget selama pengembangan.
- `pnpm check:changed` di Testbox untuk seluruh permukaan perubahan.
- `pnpm check` yang lebih luas di Testbox sebelum mendaratkan refactor lengkap atau setelah
  perubahan SDK/ekspor publik.
- Smoke live atau qa-channel untuk setidaknya satu channel yang mendukung edit dan satu
  channel pengiriman-saja sederhana sebelum menghapus wrapper kompatibilitas.

## Pertanyaan terbuka

- Apakah Telegram pada akhirnya harus mengganti sumber runner grammY dengan
  sumber polling yang sepenuhnya durable dan dapat mengontrol redelivery tingkat platform, bukan
  hanya watermark restart yang dipersistenkan OpenClaw.
- Apakah status pratinjau live durable harus disimpan dalam record antrean yang sama
  dengan intent pengiriman final atau dalam store live-state saudara.
- Berapa lama wrapper kompatibilitas tetap didokumentasikan setelah
  `plugin-sdk/channel-message` dirilis.
- Apakah Plugin pihak ketiga harus mengimplementasikan adaptor penerimaan secara langsung atau hanya
  menyediakan hook normalize/send/live melalui `defineChannelMessageAdapter`.
- Field receipt mana yang aman diekspos di SDK publik dibandingkan status runtime
  internal.
- Apakah efek samping seperti cache self-echo dan marker thread yang diikuti
  harus dimodelkan sebagai hook konteks pengiriman, langkah finalize milik adaptor, atau
  subscriber receipt.
- Channel mana yang memiliki metadata asal native, mana yang membutuhkan registry outbound
  persisten, dan mana yang tidak dapat menawarkan penekanan echo lintas-bot yang andal.

## Kriteria penerimaan

- Setiap channel pesan bawaan mengirim output terlihat final melalui
  `messages.send`.
- Setiap channel pesan inbound masuk melalui `messages.receive` atau
  wrapper kompatibilitas terdokumentasi.
- Setiap channel pratinjau/edit/stream menggunakan `messages.live` untuk status draf dan
  finalisasi.
- `channel.turn` hanya wrapper.
- Helper SDK bernama reply adalah ekspor kompatibilitas, bukan jalur yang direkomendasikan.
- Pemulihan durable dapat memutar ulang pengiriman final tertunda setelah restart tanpa kehilangan
  respons final atau menduplikasi pengiriman yang sudah di-commit; pengiriman yang
  hasil platformnya tidak diketahui direkonsiliasi sebelum replay atau didokumentasikan sebagai
  at-least-once untuk adaptor tersebut.
- Pengiriman final durable gagal tertutup saat intent durable tidak dapat ditulis,
  kecuali pemanggil secara eksplisit memilih mode non-durable terdokumentasi.
- Helper kompatibilitas channel-turn dan SDK lama default ke pengiriman langsung
  milik channel; pengiriman durable generik hanya opt-in eksplisit.
- Receipt mempertahankan semua id pesan platform untuk pengiriman multi-bagian dan
  id primer untuk kemudahan threading/edit.
- Wrapper durable mempertahankan efek samping lokal channel sebelum mengganti callback
  pengiriman langsung.
- Dispatcher yang disiapkan tidak dihitung sebagai durable sampai jalur pengiriman finalnya
  secara eksplisit menggunakan konteks pengiriman.
- Pengiriman fallback menangani setiap payload yang diproyeksikan.
- Pengiriman fallback durable mencatat setiap payload yang diproyeksikan dalam satu intent
  atau rencana batch yang dapat di-replay.
- Output kegagalan Gateway yang berasal dari OpenClaw terlihat oleh manusia tetapi echo ruang
  buatan bot yang bertag dijatuhkan sebelum otorisasi bot pada channel yang
  mendeklarasikan dukungan untuk kontrak asal.
- Dokumentasi menjelaskan pengiriman, penerimaan, live, status, receipt, relasi, kebijakan
  kegagalan, migrasi, dan cakupan pengujian.

## Terkait

- [Pesan](/id/concepts/messages)
- [Streaming dan chunking](/id/concepts/streaming)
- [Draf progres](/id/concepts/progress-drafts)
- [Kebijakan retry](/id/concepts/retry)
- [Kernel turn channel](/id/plugins/sdk-channel-turn)
