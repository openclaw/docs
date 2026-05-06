---
read_when:
    - Anda sedang membuat Plugin channel dan menginginkan siklus hidup giliran masuk bersama
    - Anda sedang memigrasikan monitor saluran agar tidak lagi menggunakan kode perekat pencatatan/pengiriman buatan sendiri
    - Anda perlu memahami tahapan penerimaan, ingesti, klasifikasi, prapemeriksaan, penyelesaian, pencatatan, pengiriman, dan finalisasi
sidebarTitle: Channel turn
summary: runtime.channel.turn -- kernel giliran masuk bersama yang digunakan Plugin kanal bawaan dan pihak ketiga untuk mencatat, mengirimkan, dan menyelesaikan giliran agen
title: Kernel giliran kanal
x-i18n:
    generated_at: "2026-05-06T09:22:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2af51bcbf179d68221e800b4c7ec6fa7db5d02a0812dc303eb1438d111c2ea4
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Kernel giliran kanal adalah mesin status inbound bersama yang mengubah peristiwa platform yang telah dinormalisasi menjadi giliran agen. Plugin kanal menyediakan fakta platform dan callback pengiriman. Core memiliki orkestrasi: menelan, mengklasifikasikan, preflight, menyelesaikan, mengotorisasi, menyusun, merekam, mengirim, dan menyelesaikan.

Gunakan ini saat plugin Anda berada di jalur panas pesan inbound. Untuk peristiwa non-pesan (perintah slash, modal, interaksi tombol, peristiwa siklus hidup, reaksi, status suara), pertahankan tetap lokal di plugin. Kernel hanya memiliki peristiwa yang dapat menjadi giliran teks agen.

<Info>
  Kernel dicapai melalui runtime plugin yang diinjeksi sebagai `runtime.channel.turn.*`. Tipe runtime plugin diekspor dari `openclaw/plugin-sdk/core`, sehingga plugin native pihak ketiga dapat menggunakan titik masuk ini dengan cara yang sama seperti plugin kanal bawaan.
</Info>

## Mengapa kernel bersama

Plugin kanal mengulangi alur inbound yang sama: menormalisasi, merutekan, membatasi, membangun konteks, merekam metadata sesi, mengirim giliran agen, menyelesaikan status pengiriman. Tanpa kernel bersama, perubahan pada pembatasan mention, balasan terlihat khusus alat, metadata sesi, riwayat tertunda, atau finalisasi pengiriman harus diterapkan per kanal.

Kernel sengaja menjaga empat konsep tetap terpisah:

- `ConversationFacts`: dari mana pesan berasal
- `RouteFacts`: agen dan sesi mana yang harus memprosesnya
- `ReplyPlanFacts`: ke mana balasan terlihat harus dikirim
- `MessageFacts`: isi dan konteks tambahan apa yang harus dilihat agen

DM Slack, topik Telegram, thread Matrix, dan sesi topik Feishu semuanya membedakan hal-hal ini dalam praktik. Memperlakukannya sebagai satu pengidentifikasi menyebabkan penyimpangan seiring waktu.

## Siklus hidup tahap

Kernel menjalankan pipeline tetap yang sama terlepas dari kanal:

1. `ingest` -- adapter mengubah peristiwa platform mentah menjadi `NormalizedTurnInput`
2. `classify` -- adapter mendeklarasikan apakah peristiwa ini dapat memulai giliran agen
3. `preflight` -- adapter melakukan dedupe, self-echo, hidrasi, debounce, dekripsi, pengisian awal fakta parsial
4. `resolve` -- adapter mengembalikan giliran yang tersusun penuh (rute, rencana balasan, pesan, pengiriman)
5. `authorize` -- kebijakan DM, grup, mention, dan perintah diterapkan pada fakta yang tersusun
6. `assemble` -- `FinalizedMsgContext` dibangun dari fakta melalui `buildContext`
7. `record` -- metadata sesi inbound dan rute terakhir dipersistenkan
8. `dispatch` -- giliran agen dijalankan melalui dispatcher blok berbuffer
9. `finalize` -- adapter `onFinalize` berjalan bahkan saat terjadi kesalahan pengiriman

Setiap tahap memancarkan peristiwa log terstruktur saat callback `log` disediakan. Lihat [Observabilitas](#observability).

## Jenis admission

Kernel tidak melempar saat giliran dibatasi. Kernel mengembalikan `ChannelTurnAdmission`:

| Jenis         | Kapan                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Giliran diterima. Giliran agen berjalan dan jalur balasan terlihat digunakan.                                                                     |
| `observeOnly` | Giliran berjalan dari awal hingga akhir tetapi adapter pengiriman tidak mengirim apa pun yang terlihat. Digunakan untuk agen pengamat broadcast dan alur multi-agen pasif lainnya. |
| `handled`     | Peristiwa platform dikonsumsi secara lokal (siklus hidup, reaksi, tombol, modal). Kernel melewati pengiriman.                                    |
| `drop`        | Jalur lewati. Secara opsional `recordHistory: true` mempertahankan pesan dalam riwayat grup tertunda sehingga mention mendatang memiliki konteks. |

Admission dapat berasal dari `classify` (kelas peristiwa menyatakan tidak dapat memulai giliran), dari `preflight` (dedupe, self-echo, mention hilang dengan perekaman riwayat), atau dari `resolveTurn` itu sendiri.

## Titik masuk

Runtime mengekspos tiga titik masuk pilihan sehingga adapter dapat ikut serta pada level yang sesuai dengan kanal.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Dua helper runtime lama tetap tersedia untuk kompatibilitas Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

Gunakan saat kanal Anda dapat mengekspresikan alur inbound-nya sebagai `ChannelTurnAdapter<TRaw>`. Adapter memiliki callback untuk `ingest`, `classify` opsional, `preflight` opsional, `resolveTurn` wajib, dan `onFinalize` opsional.

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

`run` adalah bentuk yang tepat saat kanal memiliki logika adapter kecil dan mendapat manfaat dari memiliki siklus hidup melalui hook.

### runPrepared

Gunakan saat kanal memiliki dispatcher lokal kompleks dengan preview, retry, edit, atau bootstrap thread yang harus tetap dimiliki kanal. Kernel tetap merekam sesi inbound sebelum pengiriman dan mengekspos `DispatchedChannelTurnResult` yang seragam.

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

Kanal kaya (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) menggunakan `runPrepared` karena dispatcher mereka mengorkestrasikan perilaku khusus platform yang tidak boleh dipelajari kernel.

### buildContext

Fungsi murni yang memetakan bundel fakta ke `FinalizedMsgContext`. Gunakan saat kanal Anda merangkai sebagian pipeline secara manual tetapi menginginkan bentuk konteks yang konsisten.

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

`buildContext` juga berguna di dalam callback `resolveTurn` saat menyusun giliran untuk `run`.

<Note>
  Helper SDK yang sudah tidak digunakan seperti `dispatchInboundReplyWithBase` masih menjembatani melalui helper giliran tersusun. Kode plugin baru sebaiknya menggunakan `run` atau `runPrepared`.
</Note>

## Tipe fakta

Fakta yang dikonsumsi kernel dari adapter Anda bersifat agnostik platform. Terjemahkan objek platform ke bentuk-bentuk ini sebelum menyerahkannya ke kernel.

### NormalizedTurnInput

| Bidang            | Tujuan                                                                       |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | ID pesan stabil yang digunakan untuk dedupe dan log                          |
| `timestamp`       | Epoch ms opsional                                                            |
| `rawText`         | Isi sebagaimana diterima dari platform                                       |
| `textForAgent`    | Isi bersih opsional untuk agen (penghapusan mention, pemangkasan pengetikan) |
| `textForCommands` | Isi opsional yang digunakan untuk parsing `/command`                         |
| `raw`             | Referensi pass-through opsional untuk callback adapter yang membutuhkan yang asli |

### ChannelEventClass

| Bidang                 | Tujuan                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Jika false kernel mengembalikan `{ kind: "handled" }`                  |
| `requiresImmediateAck` | Petunjuk untuk adapter yang perlu melakukan ACK sebelum pengiriman      |

### SenderFacts

| Bidang         | Tujuan                                                       |
| -------------- | ------------------------------------------------------------ |
| `id`           | ID pengirim platform yang stabil                             |
| `name`         | Nama tampilan                                                |
| `username`     | Handle jika berbeda dari `name`                              |
| `tag`          | Diskriminator bergaya Discord atau tag platform              |
| `roles`        | ID peran, digunakan untuk pencocokan allowlist peran anggota |
| `isBot`        | True saat pengirim adalah bot yang dikenal (kernel menggunakannya untuk menjatuhkan) |
| `isSelf`       | True saat pengirim adalah agen yang dikonfigurasi itu sendiri |
| `displayLabel` | Label pra-render untuk teks envelope                         |

### ConversationFacts

| Bidang            | Tujuan                                                               |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group`, atau `channel`                                    |
| `id`              | ID percakapan yang digunakan untuk perutean                          |
| `label`           | Label manusia untuk envelope                                         |
| `spaceId`         | Pengidentifikasi ruang luar opsional (workspace Slack, homeserver Matrix) |
| `parentId`        | ID percakapan luar saat ini adalah thread                            |
| `threadId`        | ID thread saat pesan ini berada di dalam thread                      |
| `nativeChannelId` | ID kanal native platform saat berbeda dari ID perutean               |
| `routePeer`       | Peer yang digunakan untuk pencarian `resolveAgentRoute`              |

### RouteFacts

| Bidang                  | Tujuan                                                         |
| ----------------------- | -------------------------------------------------------------- |
| `agentId`               | Agen yang harus menangani giliran ini                          |
| `accountId`             | Override opsional (kanal multi-akun)                           |
| `routeSessionKey`       | Kunci sesi yang digunakan untuk perutean                       |
| `dispatchSessionKey`    | Kunci sesi yang digunakan saat pengiriman ketika berbeda dari kunci rute |
| `persistedSessionKey`   | Kunci sesi yang ditulis ke metadata sesi yang dipersistenkan   |
| `parentSessionKey`      | Induk untuk sesi bercabang/ber-thread                          |
| `modelParentSessionKey` | Induk sisi model untuk sesi bercabang                          |
| `mainSessionKey`        | Pin pemilik DM utama untuk percakapan langsung                 |
| `createIfMissing`       | Izinkan langkah perekaman membuat baris sesi yang hilang       |

### ReplyPlanFacts

| Bidang                    | Tujuan                                                  |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | Target balasan logis yang ditulis ke konteks `To`       |
| `originatingTo`           | Target konteks asal (`OriginatingTo`)                   |
| `nativeChannelId`         | ID saluran native platform untuk pengiriman             |
| `replyTarget`             | Tujuan balasan terlihat akhir jika berbeda dari `to`    |
| `deliveryTarget`          | Override pengiriman tingkat lebih rendah                |
| `replyToId`               | ID pesan yang dikutip/ditambatkan                       |
| `replyToIdFull`           | ID kutipan bentuk lengkap saat platform memiliki keduanya |
| `messageThreadId`         | ID thread pada waktu pengiriman                         |
| `threadParentId`          | ID pesan induk dari thread                              |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct`, atau `none`     |

### AccessFacts

`AccessFacts` membawa boolean yang dibutuhkan tahap otorisasi. Pencocokan identitas tetap berada di saluran: kernel hanya menggunakan hasilnya.

| Bidang     | Tujuan                                                                    |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | Keputusan izinkan/pasangkan/tolak DM dan daftar `allowFrom`               |
| `group`    | Kebijakan grup, izin rute, izin pengirim, allowlist, persyaratan mention  |
| `commands` | Otorisasi perintah di seluruh pengotorisasi yang dikonfigurasi            |
| `mentions` | Apakah deteksi mention memungkinkan dan apakah agen disebut               |

### MessageFacts

| Bidang           | Tujuan                                                        |
| ---------------- | ------------------------------------------------------------- |
| `body`           | Isi envelope akhir (diformat)                                 |
| `rawBody`        | Isi mentah yang masuk                                         |
| `bodyForAgent`   | Isi yang dilihat agen                                         |
| `commandBody`    | Isi yang digunakan untuk parsing perintah                     |
| `envelopeFrom`   | Label pengirim yang sudah dirender untuk envelope             |
| `senderLabel`    | Override opsional untuk pengirim yang dirender                |
| `preview`        | Pratinjau singkat yang disunting untuk log                    |
| `inboundHistory` | Entri riwayat masuk terbaru saat saluran menyimpan buffer     |

### SupplementalContextFacts

Konteks tambahan mencakup konteks kutipan, pesan yang diteruskan, dan bootstrap thread. Kernel menerapkan kebijakan `contextVisibility` yang dikonfigurasi. Adapter saluran hanya menyediakan fakta dan flag `senderAllowed` agar kebijakan lintas saluran tetap konsisten.

### InboundMediaFacts

Media berbentuk fakta. Unduhan platform, auth, kebijakan SSRF, aturan CDN, dan dekripsi tetap lokal pada saluran. Kernel memetakan fakta ke `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes`, dan `MediaTranscribedIndexes`.

## Kontrak adapter

Untuk `run` penuh, bentuk adapter adalah:

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

`resolveTurn` mengembalikan `ChannelTurnResolved`, yaitu `AssembledChannelTurn` dengan jenis admission opsional. Mengembalikan `{ admission: { kind: "observeOnly" } }` menjalankan giliran tanpa menghasilkan output terlihat. Adapter tetap memiliki callback pengiriman; callback itu hanya menjadi no-op untuk giliran tersebut.

`onFinalize` berjalan pada setiap hasil, termasuk error dispatch. Gunakan ini untuk menghapus riwayat grup tertunda, menghapus reaksi ack, menghentikan indikator status, dan flush state lokal.

## Adapter pengiriman

Kernel tidak memanggil platform secara langsung. Saluran memberikan `ChannelTurnDeliveryAdapter` kepada kernel:

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

`deliver` dipanggil sekali per chunk balasan yang dibuffer. Selama migrasi siklus hidup pesan, pengiriman channel-turn yang dirakit secara default dimiliki saluran: field `durable` yang dihilangkan berarti kernel harus memanggil `deliver` secara langsung dan tidak boleh merutekannya melalui pengiriman outbound generik. Atur `durable` hanya setelah saluran diaudit untuk membuktikan bahwa jalur kirim generik mempertahankan perilaku pengiriman lama, termasuk target balasan/thread, penanganan media, cache pesan terkirim/self-echo, pembersihan status, dan ID pesan yang dikembalikan. `durable: false` tetap menjadi ejaan kompatibilitas untuk "gunakan callback milik saluran", tetapi saluran yang belum dimigrasikan seharusnya tidak perlu menambahkannya. Kembalikan ID pesan platform saat saluran memilikinya agar dispatcher dapat mempertahankan jangkar thread dan mengedit chunk berikutnya; jalur pengiriman yang lebih baru juga harus mengembalikan `receipt` agar pemulihan, finalisasi pratinjau, dan penekanan duplikat dapat berpindah dari `messageIds`. Untuk giliran observe-only, kembalikan `{ visibleReplySent: false }` atau gunakan `createNoopChannelTurnDeliveryAdapter()`.

Saluran yang menggunakan `runPrepared` dengan dispatcher yang sepenuhnya dimiliki saluran tidak memiliki `ChannelTurnDeliveryAdapter`. Dispatcher tersebut secara default tidak durable. Mereka harus mempertahankan jalur pengiriman langsungnya sampai secara eksplisit ikut menggunakan konteks kirim baru dengan target lengkap, adapter replay-safe, kontrak receipt, dan hook efek samping saluran.

Helper kompatibilitas publik seperti `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase`, dan helper direct-DM harus tetap mempertahankan perilaku selama migrasi. Mereka tidak boleh memanggil pengiriman durable generik sebelum callback `deliver` atau `reply` milik pemanggil.

## Opsi pencatatan

Tahap pencatatan membungkus `recordInboundSession`. Sebagian besar saluran dapat menggunakan default. Override melalui `record`:

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

## Yang tetap lokal pada saluran

Kernel memiliki orkestrasi. Saluran tetap memiliki:

- Transport platform (Gateway, REST, websocket, polling, Webhook)
- Resolusi identitas dan pencocokan nama tampilan
- Perintah native, perintah slash, autocomplete, modal, tombol, status suara
- Rendering kartu, modal, dan adaptive-card
- Auth media, aturan CDN, media terenkripsi, transkripsi
- API edit, reaksi, redaksi, dan presence
- Backfill dan pengambilan riwayat sisi platform
- Alur pairing yang memerlukan verifikasi khusus platform

Jika dua saluran mulai membutuhkan helper yang sama untuk salah satu hal ini, ekstrak helper SDK bersama alih-alih memasukkannya ke kernel.

## Stabilitas

`runtime.channel.turn.*` adalah bagian dari permukaan runtime Plugin publik. Tipe fakta (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) dan bentuk admission (`ChannelTurnAdmission`, `ChannelEventClass`) dapat dijangkau melalui `PluginRuntime` dari `openclaw/plugin-sdk/core`.

Aturan kompatibilitas mundur berlaku: field fakta baru bersifat aditif, jenis admission tidak diganti namanya, dan nama entry point tetap stabil. Kebutuhan saluran baru yang memerlukan perubahan non-aditif harus melalui proses migrasi SDK Plugin.

## Terkait

- [Refaktor siklus hidup pesan](/id/concepts/message-lifecycle-refactor) untuk siklus hidup kirim/terima/live yang direncanakan yang akan membungkus kernel ini
- [Membangun plugin saluran](/id/plugins/sdk-channel-plugins) untuk kontrak plugin saluran yang lebih luas
- [Helper runtime Plugin](/id/plugins/sdk-runtime) untuk permukaan `runtime.*` lainnya
- [Internal Plugin](/id/plugins/architecture-internals) untuk pipeline pemuatan dan mekanika registry
