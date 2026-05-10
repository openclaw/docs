---
read_when:
    - Anda sedang membangun Plugin saluran dan menginginkan siklus hidup giliran masuk bersama
    - Anda sedang memigrasikan pemantau saluran agar tidak lagi menggunakan kode perekat perekaman/pengiriman buatan sendiri
    - Anda perlu memahami tahap penerimaan, penyerapan, klasifikasi, prapemeriksaan, penyelesaian, pencatatan, pengiriman, dan finalisasi
sidebarTitle: Channel turn
summary: runtime.channel.turn -- kernel giliran masuk bersama yang digunakan Plugin saluran bawaan dan pihak ketiga untuk merekam, mengirimkan, dan menyelesaikan giliran agen
title: Kernel giliran kanal
x-i18n:
    generated_at: "2026-05-10T19:46:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb474bf2bf6f30270deb8a8ac0237ce4fc9b923521c5ac0cf7cb0714db13966
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Kernel giliran kanal adalah mesin status masuk bersama yang mengubah peristiwa platform yang telah dinormalisasi menjadi giliran agen. Plugin kanal menyediakan fakta platform dan callback pengiriman. Inti menangani orkestrasi: menerima, mengklasifikasikan, prapemeriksaan, menyelesaikan, mengotorisasi, menyusun, mencatat, mengirim, dan menyelesaikan.

Gunakan ini ketika Plugin Anda berada di jalur panas pesan masuk. Untuk peristiwa non-pesan (perintah garis miring, modal, interaksi tombol, peristiwa siklus hidup, reaksi, status suara), pertahankan secara lokal di Plugin. Kernel hanya menangani peristiwa yang dapat menjadi giliran teks agen.

<Info>
  Kernel dicapai melalui runtime Plugin yang diinjeksi sebagai `runtime.channel.turn.*`. Tipe runtime Plugin diekspor dari `openclaw/plugin-sdk/core`, sehingga Plugin native pihak ketiga dapat menggunakan titik masuk ini dengan cara yang sama seperti Plugin kanal bawaan.
</Info>

## Mengapa kernel bersama

Plugin kanal mengulangi alur masuk yang sama: normalisasi, perutean, gating, membangun konteks, mencatat metadata sesi, mengirim giliran agen, menyelesaikan status pengiriman. Tanpa kernel bersama, perubahan pada gating mention, balasan terlihat khusus alat, metadata sesi, riwayat tertunda, atau finalisasi pengiriman harus diterapkan per kanal.

Kernel sengaja memisahkan empat konsep:

- `ConversationFacts`: dari mana pesan berasal
- `RouteFacts`: agen dan sesi mana yang harus memprosesnya
- `ReplyPlanFacts`: ke mana balasan terlihat harus dikirim
- `MessageFacts`: body dan konteks tambahan apa yang harus dilihat agen

DM Slack, topik Telegram, thread Matrix, dan sesi topik Feishu semuanya membedakan ini dalam praktik. Memperlakukannya sebagai satu pengenal menyebabkan penyimpangan seiring waktu.

## Siklus hidup tahap

Kernel menjalankan pipeline tetap yang sama terlepas dari kanal:

1. `ingest` -- adapter mengonversi peristiwa platform mentah menjadi `NormalizedTurnInput`
2. `classify` -- adapter menyatakan apakah peristiwa ini dapat memulai giliran agen
3. `preflight` -- adapter melakukan dedupe, self-echo, hidrasi, debounce, dekripsi, pengisian awal fakta parsial
4. `resolve` -- adapter mengembalikan giliran yang telah tersusun penuh (rute, rencana balasan, pesan, pengiriman)
5. `authorize` -- kebijakan DM, grup, mention, dan perintah diterapkan ke fakta yang telah disusun
6. `assemble` -- `FinalizedMsgContext` dibangun dari fakta melalui `buildContext`
7. `record` -- metadata sesi masuk dan rute terakhir dipersistenkan
8. `dispatch` -- giliran agen dieksekusi melalui dispatcher blok buffer
9. `finalize` -- adapter `onFinalize` berjalan bahkan saat terjadi kesalahan pengiriman

Setiap tahap memancarkan peristiwa log terstruktur ketika callback `log` disediakan. Lihat [Observabilitas](#observability).

## Jenis admisi

Kernel tidak melempar ketika sebuah giliran digating. Kernel mengembalikan `ChannelTurnAdmission`:

| Jenis         | Kapan                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Giliran diterima. Giliran agen berjalan dan jalur balasan terlihat dijalankan.                                                               |
| `observeOnly` | Giliran berjalan dari awal hingga akhir tetapi adapter pengiriman tidak mengirim apa pun yang terlihat. Digunakan untuk agen pengamat siaran dan alur multi-agen pasif lainnya. |
| `handled`     | Peristiwa platform dikonsumsi secara lokal (siklus hidup, reaksi, tombol, modal). Kernel melewati pengiriman.                                |
| `drop`        | Jalur lewati. Secara opsional `recordHistory: true` mempertahankan pesan dalam riwayat grup tertunda agar mention mendatang memiliki konteks. |

Admisi dapat berasal dari `classify` (kelas peristiwa menyatakan tidak dapat memulai giliran), dari `preflight` (dedupe, self-echo, mention hilang dengan pencatatan riwayat), atau dari `resolveTurn` itu sendiri.

## Titik masuk

Runtime mengekspos tiga titik masuk yang disarankan agar adapter dapat ikut serta pada level yang sesuai dengan kanal.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Dua helper runtime lama tetap tersedia untuk kompatibilitas SDK Plugin:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
```

### run

Gunakan ketika kanal Anda dapat mengekspresikan alur masuknya sebagai `ChannelTurnAdapter<TRaw>`. Adapter memiliki callback untuk `ingest`, `classify` opsional, `preflight` opsional, `resolveTurn` wajib, dan `onFinalize` opsional.

```typescript
await runtime.channel.turn.run({
  channel: "tlon",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest(raw) {
      return {
        id: raw.messageId,
        timestamp: raw.timestamp,
        rawText: raw.body,
        textForAgent: raw.body,
      };
    },
    classify(input) {
      return { kind: "message", canStartAgentTurn: input.rawText.length > 0 };
    },
    async preflight(input, eventClass) {
      if (await isDuplicate(input.id)) {
        return { admission: { kind: "drop", reason: "dedupe" } };
      }
      return {};
    },
    resolveTurn(input) {
      return buildAssembledTurn(input);
    },
    onFinalize(result) {
      clearPendingGroupHistory(result);
    },
  },
});
```

`run` adalah bentuk yang tepat ketika kanal memiliki logika adapter kecil dan mendapat manfaat dari memiliki siklus hidup melalui hook.

### runAssembled

Gunakan ketika kanal sudah menyelesaikan perutean, membangun `FinalizedMsgContext`,
dan hanya memerlukan urutan catat, pipeline balasan, pengiriman, dan finalisasi
bersama. Ini adalah bentuk yang disarankan untuk jalur masuk bawaan sederhana yang
jika tidak akan mengulangi boilerplate `createChannelMessageReplyPipeline(...)` dan
`runPrepared(...)`.

```typescript
await runtime.channel.turn.runAssembled({
  cfg,
  channel: "irc",
  accountId,
  agentId: route.agentId,
  routeSessionKey: route.sessionKey,
  storePath,
  ctxPayload,
  recordInboundSession: runtime.channel.session.recordInboundSession,
  dispatchReplyWithBufferedBlockDispatcher:
    runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher,
  delivery: {
    deliver: async (payload) => {
      await sendPlatformReply(payload);
    },
    onError: (err, info) => {
      runtime.error?.(`reply ${info.kind} failed: ${String(err)}`);
    },
  },
});
```

Pilih `runAssembled` dibandingkan `runPrepared` ketika satu-satunya perilaku pengiriman
yang dimiliki kanal adalah pengiriman payload akhir plus pengetikan opsional, opsi
balasan, pengiriman tahan lama, atau pencatatan kesalahan.

### runPrepared

Gunakan ketika kanal memiliki dispatcher lokal kompleks dengan pratinjau, percobaan ulang, edit, atau bootstrap thread yang harus tetap dimiliki kanal. Kernel tetap mencatat sesi masuk sebelum pengiriman dan menampilkan `DispatchedChannelTurnResult` yang seragam.

```typescript
const { dispatchResult } = await runtime.channel.turn.runPrepared({
  channel: "matrix",
  accountId,
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  record: {
    onRecordError,
    updateLastRoute,
  },
  onPreDispatchFailure: async (err) => {
    await stopStatusReactions();
  },
  runDispatch: async () => {
    return await runMatrixOwnedDispatcher();
  },
});
```

Kanal kaya (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) menggunakan `runPrepared` karena dispatcher mereka mengorkestrasi perilaku spesifik platform yang tidak boleh perlu dipelajari kernel.

### buildContext

Fungsi murni yang memetakan bundel fakta menjadi `FinalizedMsgContext`. Gunakan ketika kanal Anda merakit sendiri sebagian pipeline tetapi menginginkan bentuk konteks yang konsisten.

```typescript
const ctxPayload = runtime.channel.turn.buildContext({
  channel: "googlechat",
  accountId,
  messageId,
  timestamp,
  from,
  sender,
  conversation,
  route,
  reply,
  message,
  access,
  media,
  supplemental,
});
```

`buildContext` juga berguna di dalam callback `resolveTurn` ketika menyusun giliran untuk `run`.

<Note>
  Helper SDK yang tidak digunakan lagi seperti `dispatchInboundReplyWithBase` masih menjembatani melalui helper giliran tersusun. Kode Plugin baru sebaiknya menggunakan `run` atau `runPrepared`.
</Note>

## Tipe fakta

Fakta yang dikonsumsi kernel dari adapter Anda bersifat agnostik terhadap platform. Terjemahkan objek platform ke bentuk ini sebelum menyerahkannya ke kernel.

### NormalizedTurnInput

| Bidang            | Tujuan                                                                       |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | ID pesan stabil yang digunakan untuk dedupe dan log                           |
| `timestamp`       | epoch ms opsional                                                            |
| `rawText`         | Body sebagaimana diterima dari platform                                      |
| `textForAgent`    | Body bersih opsional untuk agen (penghapusan mention, pemangkasan pengetikan) |
| `textForCommands` | Body opsional yang digunakan untuk parsing `/command`                         |
| `raw`             | Referensi pass-through opsional untuk callback adapter yang membutuhkan aslinya |

### ChannelEventClass

| Bidang                 | Tujuan                                                                  |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Jika false, kernel mengembalikan `{ kind: "handled" }`                  |
| `requiresImmediateAck` | Petunjuk untuk adapter yang perlu melakukan ACK sebelum pengiriman      |

### SenderFacts

| Bidang         | Tujuan                                                               |
| -------------- | -------------------------------------------------------------------- |
| `id`           | ID pengirim platform yang stabil                                     |
| `name`         | Nama tampilan                                                        |
| `username`     | Handle jika berbeda dari `name`                                      |
| `tag`          | Diskriminator gaya Discord atau tag platform                         |
| `roles`        | ID peran, digunakan untuk pencocokan allowlist peran anggota         |
| `isBot`        | True ketika pengirim adalah bot yang dikenal (kernel menggunakan ini untuk drop) |
| `isSelf`       | True ketika pengirim adalah agen yang dikonfigurasi itu sendiri      |
| `displayLabel` | Label yang telah dirender untuk teks envelope                         |

### ConversationFacts

| Bidang            | Tujuan                                                                    |
| ----------------- | ------------------------------------------------------------------------- |
| `kind`            | `direct`, `group`, atau `channel`                                         |
| `id`              | ID percakapan yang digunakan untuk perutean                               |
| `label`           | Label manusia untuk envelope                                              |
| `spaceId`         | Pengenal ruang luar opsional (workspace Slack, homeserver Matrix)         |
| `parentId`        | ID percakapan luar ketika ini adalah thread                               |
| `threadId`        | ID thread ketika pesan ini berada di dalam thread                         |
| `nativeChannelId` | ID kanal native platform ketika berbeda dari ID perutean                  |
| `routePeer`       | Peer yang digunakan untuk lookup `resolveAgentRoute`                      |

### RouteFacts

| Bidang                  | Tujuan                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| `agentId`               | Agen yang harus menangani giliran ini                            |
| `accountId`             | Pengganti opsional (saluran multi-akun)                          |
| `routeSessionKey`       | Kunci sesi yang digunakan untuk perutean                         |
| `dispatchSessionKey`    | Kunci sesi yang digunakan saat dispatch jika berbeda dari kunci rute |
| `persistedSessionKey`   | Kunci sesi yang ditulis ke metadata sesi persisten                |
| `parentSessionKey`      | Induk untuk sesi bercabang/berutas                               |
| `modelParentSessionKey` | Induk sisi model untuk sesi bercabang                            |
| `mainSessionKey`        | Pin pemilik DM utama untuk percakapan langsung                   |
| `createIfMissing`       | Izinkan langkah pencatatan membuat baris sesi yang hilang        |

### ReplyPlanFacts

| Bidang                    | Tujuan                                                        |
| ------------------------- | ------------------------------------------------------------- |
| `to`                      | Target balasan logis yang ditulis ke konteks `To`             |
| `originatingTo`           | Target konteks asal (`OriginatingTo`)                         |
| `nativeChannelId`         | Id saluran native platform untuk pengiriman                   |
| `replyTarget`             | Tujuan balasan terlihat final jika berbeda dari `to`          |
| `deliveryTarget`          | Pengganti pengiriman tingkat rendah                           |
| `replyToId`               | Id pesan yang dikutip/ditambatkan                             |
| `replyToIdFull`           | Id kutipan bentuk lengkap saat platform memiliki keduanya     |
| `messageThreadId`         | Id thread pada waktu pengiriman                               |
| `threadParentId`          | Id pesan induk dari thread                                    |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct`, atau `none`           |

### AccessFacts

`AccessFacts` membawa boolean yang dibutuhkan tahap otorisasi. Pencocokan identitas tetap berada di saluran: kernel hanya memakai hasilnya.

| Bidang     | Tujuan                                                                   |
| ---------- | ------------------------------------------------------------------------ |
| `dm`       | Keputusan izinkan/pasangkan/tolak DM dan daftar `allowFrom`              |
| `group`    | Kebijakan grup, izin rute, izin pengirim, allowlist, persyaratan mention |
| `commands` | Otorisasi perintah di seluruh pengotorisasi yang dikonfigurasi           |
| `mentions` | Apakah deteksi mention memungkinkan dan apakah agen disebut              |

### MessageFacts

| Bidang           | Tujuan                                                          |
| ---------------- | --------------------------------------------------------------- |
| `body`           | Isi envelope final (terformat)                                  |
| `rawBody`        | Isi inbound mentah                                              |
| `bodyForAgent`   | Isi yang dilihat agen                                           |
| `commandBody`    | Isi yang digunakan untuk parsing perintah                       |
| `envelopeFrom`   | Label pengirim yang sudah dirender untuk envelope               |
| `senderLabel`    | Pengganti opsional untuk pengirim yang dirender                 |
| `preview`        | Pratinjau singkat yang disunting untuk log                      |
| `inboundHistory` | Entri riwayat inbound terbaru saat saluran menyimpan buffer     |

### SupplementalContextFacts

Konteks tambahan mencakup konteks kutipan, penerusan, dan bootstrap thread. Kernel menerapkan kebijakan `contextVisibility` yang dikonfigurasi. Adapter saluran hanya menyediakan fakta dan flag `senderAllowed` agar kebijakan lintas saluran tetap konsisten.

### InboundMediaFacts

Media berbentuk fakta. Unduhan platform, autentikasi, kebijakan SSRF, aturan CDN, dan dekripsi tetap lokal saluran. Kernel memetakan fakta ke `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes`, dan `MediaTranscribedIndexes`.

## Kontrak adapter

Untuk `run` penuh, bentuk adapternya adalah:

```typescript
type ChannelTurnAdapter<TRaw> = {
  ingest(raw: TRaw): Promise<NormalizedTurnInput | null> | NormalizedTurnInput | null;
  classify?(input: NormalizedTurnInput): Promise<ChannelEventClass> | ChannelEventClass;
  preflight?(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
  ): Promise<PreflightFacts | ChannelTurnAdmission | null | undefined>;
  resolveTurn(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
    preflight: PreflightFacts,
  ): Promise<ChannelTurnResolved> | ChannelTurnResolved;
  onFinalize?(result: ChannelTurnResult): Promise<void> | void;
};
```

`resolveTurn` mengembalikan `ChannelTurnResolved`, yaitu `AssembledChannelTurn` dengan jenis admission opsional. Mengembalikan `{ admission: { kind: "observeOnly" } }` menjalankan giliran tanpa menghasilkan output yang terlihat. Adapter tetap memiliki callback pengiriman; callback itu hanya menjadi no-op untuk giliran tersebut.

`onFinalize` berjalan pada setiap hasil, termasuk error dispatch. Gunakan ini untuk membersihkan riwayat grup yang tertunda, menghapus reaksi ack, menghentikan indikator status, dan melakukan flush state lokal.

## Adapter pengiriman

Kernel tidak memanggil platform secara langsung. Saluran menyerahkan `ChannelTurnDeliveryAdapter` ke kernel:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
  durable?: false | DurableInboundReplyDeliveryOptions;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  receipt?: MessageReceipt;
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` dipanggil sekali per potongan balasan yang dibuffer. Selama migrasi siklus hidup pesan, pengiriman channel-turn yang telah dirakit dimiliki saluran secara default: field `durable` yang dihilangkan berarti kernel harus memanggil `deliver` secara langsung dan tidak boleh merutekan melalui pengiriman outbound generik. Tetapkan `durable` hanya setelah saluran diaudit untuk membuktikan bahwa jalur kirim generik mempertahankan perilaku pengiriman lama, termasuk target balasan/thread, penanganan media, cache pesan terkirim/self-echo, pembersihan status, dan id pesan yang dikembalikan. `durable: false` tetap menjadi ejaan kompatibilitas untuk "gunakan callback milik saluran", tetapi saluran yang belum dimigrasikan seharusnya tidak perlu menambahkannya. Kembalikan id pesan platform saat saluran memilikinya agar dispatcher dapat mempertahankan tambatan thread dan mengedit potongan berikutnya; jalur pengiriman yang lebih baru juga harus mengembalikan `receipt` agar pemulihan, finalisasi pratinjau, dan penekanan duplikat dapat berpindah dari `messageIds`. Untuk giliran observe-only, kembalikan `{ visibleReplySent: false }` atau gunakan `createNoopChannelTurnDeliveryAdapter()`.

Saluran yang menggunakan `runPrepared` dengan dispatcher yang sepenuhnya dimiliki saluran tidak memiliki `ChannelTurnDeliveryAdapter`. Dispatcher tersebut tidak durable secara default. Dispatcher harus mempertahankan jalur pengiriman langsungnya sampai secara eksplisit ikut memakai konteks kirim baru dengan target lengkap, adapter aman-replay, kontrak receipt, dan hook efek samping saluran.

Helper kompatibilitas publik seperti `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase`, dan helper direct-DM harus tetap mempertahankan perilaku selama migrasi. Helper tersebut tidak boleh memanggil pengiriman durable generik sebelum callback `deliver` atau `reply` milik pemanggil.

## Opsi pencatatan

Tahap pencatatan membungkus `recordInboundSession`. Sebagian besar saluran dapat menggunakan default. Ganti melalui `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Dispatcher menunggu tahap pencatatan. Jika pencatatan melempar error, kernel menjalankan `onPreDispatchFailure` (saat diberikan ke `runPrepared`) dan melempar ulang.

## Observabilitas

Setiap tahap memancarkan event terstruktur saat callback `log` disediakan:

```typescript
await runtime.channel.turn.run({
  channel: "twitch",
  accountId,
  raw,
  adapter,
  log: (event) => {
    runtime.log?.debug?.(`turn.${event.stage}:${event.event}`, {
      channel: event.channel,
      accountId: event.accountId,
      messageId: event.messageId,
      sessionKey: event.sessionKey,
      admission: event.admission,
      reason: event.reason,
    });
  },
});
```

Tahap yang dicatat: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Hindari mencatat isi mentah; gunakan `MessageFacts.preview` untuk pratinjau singkat yang disunting.

## Yang tetap lokal saluran

Kernel memiliki orkestrasi. Saluran tetap memiliki:

- Transport platform (Gateway, REST, websocket, polling, Webhook)
- Resolusi identitas dan pencocokan nama tampilan
- Perintah native, slash command, autocomplete, modal, tombol, state suara
- Rendering kartu, modal, dan adaptive-card
- Autentikasi media, aturan CDN, media terenkripsi, transkripsi
- API edit, reaksi, penyuntingan, dan presence
- Backfill dan pengambilan riwayat sisi platform
- Alur pairing yang memerlukan verifikasi spesifik platform

Jika dua saluran mulai membutuhkan helper yang sama untuk salah satu hal ini, ekstrak helper SDK bersama alih-alih mendorongnya ke kernel.

## Stabilitas

`runtime.channel.turn.*` adalah bagian dari permukaan runtime plugin publik. Tipe fakta (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) dan bentuk admission (`ChannelTurnAdmission`, `ChannelEventClass`) dapat dijangkau melalui `PluginRuntime` dari `openclaw/plugin-sdk/core`.

Aturan kompatibilitas mundur berlaku: field fakta baru bersifat aditif, jenis admission tidak diganti nama, dan nama entry point tetap stabil. Kebutuhan saluran baru yang memerlukan perubahan non-aditif harus melalui proses migrasi SDK plugin.

## Terkait

- [Refaktor siklus hidup pesan](/id/concepts/message-lifecycle-refactor) untuk siklus hidup kirim/terima/live terencana yang akan membungkus kernel ini
- [Membangun plugin saluran](/id/plugins/sdk-channel-plugins) untuk kontrak plugin saluran yang lebih luas
- [Helper runtime plugin](/id/plugins/sdk-runtime) untuk permukaan `runtime.*` lainnya
- [Internal plugin](/id/plugins/architecture-internals) untuk pipeline pemuatan dan mekanika registry
