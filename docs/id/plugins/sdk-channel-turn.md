---
read_when:
    - Anda sedang membangun Plugin saluran dan menginginkan siklus hidup giliran masuk bersama
    - Anda sedang memigrasikan pemantau saluran agar tidak lagi memakai lapisan perekat perekaman/pengiriman buatan sendiri
    - Anda perlu memahami tahap penerimaan, penyerapan, klasifikasi, prapemeriksaan, penyelesaian, pencatatan, pengiriman, dan finalisasi.
sidebarTitle: Channel turn
summary: runtime.channel.turn -- kernel giliran masuk bersama yang digunakan Plugin saluran bawaan dan pihak ketiga untuk merekam, mengirim, dan menyelesaikan giliran agen
title: Kernel giliran kanal
x-i18n:
    generated_at: "2026-04-30T10:03:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc918da4c43f955f509aed18a93129db26efe21686c30f9328a5639f3e700984
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Kernel giliran kanal adalah mesin status masuk bersama yang mengubah peristiwa platform yang dinormalisasi menjadi giliran agen. Plugin kanal menyediakan fakta platform dan callback pengiriman. Inti memiliki orkestrasi: serap, klasifikasikan, preflight, selesaikan, otorisasi, susun, rekam, dispatch, dan finalisasi.

Gunakan ini saat Plugin Anda berada pada jalur panas pesan masuk. Untuk peristiwa non-pesan (perintah slash, modal, interaksi tombol, peristiwa siklus hidup, reaksi, status suara), pertahankan tetap lokal di Plugin. Kernel hanya memiliki peristiwa yang mungkin menjadi giliran teks agen.

<Info>
  Kernel dijangkau melalui runtime Plugin yang diinjeksi sebagai `runtime.channel.turn.*`. Tipe runtime Plugin diekspor dari `openclaw/plugin-sdk/core`, sehingga Plugin native pihak ketiga dapat menggunakan titik masuk ini dengan cara yang sama seperti Plugin kanal bawaan.
</Info>

## Mengapa kernel bersama

Plugin kanal mengulang alur masuk yang sama: normalisasi, rutekan, batasi, bangun konteks, rekam metadata sesi, dispatch giliran agen, finalisasi status pengiriman. Tanpa kernel bersama, perubahan pada gating mention, balasan terlihat yang hanya berisi alat, metadata sesi, riwayat tertunda, atau finalisasi dispatch harus diterapkan per kanal.

Kernel sengaja menjaga empat konsep tetap terpisah:

- `ConversationFacts`: dari mana pesan berasal
- `RouteFacts`: agen dan sesi mana yang harus memprosesnya
- `ReplyPlanFacts`: ke mana balasan terlihat harus dikirim
- `MessageFacts`: body dan konteks tambahan apa yang harus dilihat agen

DM Slack, topik Telegram, thread Matrix, dan sesi topik Feishu semuanya membedakan ini dalam praktik. Memperlakukannya sebagai satu pengenal menyebabkan drift seiring waktu.

## Siklus hidup tahap

Kernel menjalankan pipeline tetap yang sama apa pun kanalnya:

1. `ingest` -- adapter mengubah peristiwa platform mentah menjadi `NormalizedTurnInput`
2. `classify` -- adapter menyatakan apakah peristiwa ini dapat memulai giliran agen
3. `preflight` -- adapter melakukan dedupe, self-echo, hidrasi, debounce, dekripsi, pengisian awal fakta parsial
4. `resolve` -- adapter mengembalikan giliran yang sudah tersusun penuh (rute, rencana balasan, pesan, pengiriman)
5. `authorize` -- kebijakan DM, grup, mention, dan perintah diterapkan pada fakta yang tersusun
6. `assemble` -- `FinalizedMsgContext` dibangun dari fakta melalui `buildContext`
7. `record` -- metadata sesi masuk dan rute terakhir dipersistenkan
8. `dispatch` -- giliran agen dieksekusi melalui dispatcher blok berbuffer
9. `finalize` -- `onFinalize` adapter berjalan bahkan saat terjadi error dispatch

Setiap tahap memancarkan peristiwa log terstruktur saat callback `log` disediakan. Lihat [Observabilitas](#observability).

## Jenis admisi

Kernel tidak melempar error saat suatu giliran dibatasi. Ia mengembalikan `ChannelTurnAdmission`:

| Jenis         | Kapan                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Giliran diterima. Giliran agen berjalan dan jalur balasan terlihat dijalankan.                                                               |
| `observeOnly` | Giliran berjalan end-to-end tetapi adapter pengiriman tidak mengirim apa pun yang terlihat. Digunakan untuk agen pengamat siaran dan alur multi-agen pasif lainnya. |
| `handled`     | Peristiwa platform dikonsumsi secara lokal (siklus hidup, reaksi, tombol, modal). Kernel melewati dispatch.                                 |
| `drop`        | Jalur lewati. Secara opsional `recordHistory: true` mempertahankan pesan dalam riwayat grup tertunda sehingga mention mendatang memiliki konteks. |

Admisi dapat berasal dari `classify` (kelas peristiwa menyatakan tidak dapat memulai giliran), dari `preflight` (dedupe, self-echo, mention hilang dengan rekaman riwayat), atau dari `resolveTurn` sendiri.

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

Gunakan saat kanal Anda dapat mengekspresikan alur masuknya sebagai `ChannelTurnAdapter<TRaw>`. Adapter memiliki callback untuk `ingest`, `classify` opsional, `preflight` opsional, `resolveTurn` wajib, dan `onFinalize` opsional.

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

Gunakan saat kanal memiliki dispatcher lokal kompleks dengan pratinjau, percobaan ulang, edit, atau bootstrap thread yang harus tetap dimiliki kanal. Kernel tetap merekam sesi masuk sebelum dispatch dan memunculkan `DispatchedChannelTurnResult` yang seragam.

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

Kanal kaya (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) menggunakan `runPrepared` karena dispatcher mereka mengorkestrasi perilaku spesifik platform yang tidak boleh dipelajari kernel.

### buildContext

Fungsi murni yang memetakan bundel fakta menjadi `FinalizedMsgContext`. Gunakan saat kanal Anda merangkai sebagian pipeline secara manual tetapi menginginkan bentuk konteks yang konsisten.

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
  Helper SDK usang seperti `dispatchInboundReplyWithBase` masih menjembatani melalui helper giliran tersusun. Kode Plugin baru sebaiknya menggunakan `run` atau `runPrepared`.
</Note>

## Tipe fakta

Fakta yang dikonsumsi kernel dari adapter Anda bersifat agnostik platform. Terjemahkan objek platform ke bentuk ini sebelum menyerahkannya ke kernel.

### NormalizedTurnInput

| Bidang            | Tujuan                                                                       |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | Id pesan stabil yang digunakan untuk dedupe dan log                          |
| `timestamp`       | Epoch ms opsional                                                            |
| `rawText`         | Body sebagaimana diterima dari platform                                      |
| `textForAgent`    | Body bersih opsional untuk agen (penghapusan mention, pemangkasan pengetikan) |
| `textForCommands` | Body opsional yang digunakan untuk parsing `/command`                        |
| `raw`             | Referensi pass-through opsional untuk callback adapter yang membutuhkan aslinya |

### ChannelEventClass

| Bidang                 | Tujuan                                                                  |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Jika false, kernel mengembalikan `{ kind: "handled" }`                  |
| `requiresImmediateAck` | Petunjuk untuk adapter yang perlu melakukan ACK sebelum dispatch        |

### SenderFacts

| Bidang         | Tujuan                                                              |
| -------------- | ------------------------------------------------------------------- |
| `id`           | Id pengirim platform stabil                                         |
| `name`         | Nama tampilan                                                       |
| `username`     | Handle jika berbeda dari `name`                                     |
| `tag`          | Diskriminator bergaya Discord atau tag platform                     |
| `roles`        | Id peran, digunakan untuk pencocokan allowlist peran anggota        |
| `isBot`        | True saat pengirim adalah bot yang dikenal (digunakan kernel untuk menjatuhkan) |
| `isSelf`       | True saat pengirim adalah agen yang dikonfigurasi itu sendiri       |
| `displayLabel` | Label pra-render untuk teks amplop                                  |

### ConversationFacts

| Bidang            | Tujuan                                                                |
| ----------------- | --------------------------------------------------------------------- |
| `kind`            | `direct`, `group`, atau `channel`                                     |
| `id`              | Id percakapan yang digunakan untuk routing                            |
| `label`           | Label manusia untuk amplop                                            |
| `spaceId`         | Pengenal ruang luar opsional (workspace Slack, homeserver Matrix)     |
| `parentId`        | Id percakapan luar saat ini adalah thread                             |
| `threadId`        | Id thread saat pesan ini berada di dalam thread                       |
| `nativeChannelId` | Id kanal native platform saat berbeda dari id routing                 |
| `routePeer`       | Peer yang digunakan untuk lookup `resolveAgentRoute`                  |

### RouteFacts

| Bidang                  | Tujuan                                                             |
| ----------------------- | ------------------------------------------------------------------ |
| `agentId`               | Agen yang harus menangani giliran ini                              |
| `accountId`             | Override opsional (kanal multi-akun)                               |
| `routeSessionKey`       | Kunci sesi yang digunakan untuk routing                            |
| `dispatchSessionKey`    | Kunci sesi yang digunakan saat dispatch ketika berbeda dari kunci rute |
| `persistedSessionKey`   | Kunci sesi yang ditulis ke metadata sesi yang dipersistenkan        |
| `parentSessionKey`      | Induk untuk sesi bercabang/ber-thread                              |
| `modelParentSessionKey` | Induk sisi model untuk sesi bercabang                              |
| `mainSessionKey`        | Pin pemilik DM utama untuk percakapan langsung                     |
| `createIfMissing`       | Izinkan langkah rekam membuat baris sesi yang hilang                |

### ReplyPlanFacts

| Bidang                   | Tujuan                                                  |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | Target balasan logis yang ditulis ke konteks `To`       |
| `originatingTo`           | Target konteks asal (`OriginatingTo`)                   |
| `nativeChannelId`         | Id saluran native platform untuk pengiriman             |
| `replyTarget`             | Tujuan balasan terlihat akhir jika berbeda dari `to`    |
| `deliveryTarget`          | Override pengiriman tingkat lebih rendah                |
| `replyToId`               | Id pesan yang dikutip/ditambatkan                       |
| `replyToIdFull`           | Id kutipan bentuk lengkap ketika platform memiliki keduanya |
| `messageThreadId`         | Id utas pada waktu pengiriman                           |
| `threadParentId`          | Id pesan induk dari utas                                |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct`, atau `none`     |

### AccessFacts

`AccessFacts` membawa boolean yang dibutuhkan tahap otorisasi. Pencocokan identitas tetap berada di saluran: kernel hanya memakai hasilnya.

| Bidang     | Tujuan                                                                    |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | Keputusan izin/pairing/tolak DM dan daftar `allowFrom`                    |
| `group`    | Kebijakan grup, izin rute, izin pengirim, allowlist, persyaratan mention  |
| `commands` | Otorisasi perintah di seluruh otorisator yang dikonfigurasi               |
| `mentions` | Apakah deteksi mention memungkinkan dan apakah agen disebut               |

### MessageFacts

| Bidang           | Tujuan                                                        |
| ---------------- | ------------------------------------------------------------- |
| `body`           | Isi envelope akhir (terformat)                                |
| `rawBody`        | Isi inbound mentah                                            |
| `bodyForAgent`   | Isi yang dilihat agen                                         |
| `commandBody`    | Isi yang digunakan untuk parsing perintah                     |
| `envelopeFrom`   | Label pengirim yang sudah dirender untuk envelope             |
| `senderLabel`    | Override opsional untuk pengirim yang dirender                |
| `preview`        | Pratinjau singkat yang disunting untuk log                    |
| `inboundHistory` | Entri riwayat inbound terbaru saat saluran menyimpan buffer   |

### SupplementalContextFacts

Konteks tambahan mencakup konteks kutipan, teruskan, dan bootstrap utas. Kernel menerapkan kebijakan `contextVisibility` yang dikonfigurasi. Adapter saluran hanya menyediakan fakta dan flag `senderAllowed` agar kebijakan lintas saluran tetap konsisten.

### InboundMediaFacts

Media berbentuk fakta. Download platform, auth, kebijakan SSRF, aturan CDN, dan dekripsi tetap lokal saluran. Kernel memetakan fakta ke `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes`, dan `MediaTranscribedIndexes`.

## Kontrak adapter

Untuk `run` lengkap, bentuk adapternya adalah:

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

`resolveTurn` mengembalikan `ChannelTurnResolved`, yaitu `AssembledChannelTurn` dengan jenis admission opsional. Mengembalikan `{ admission: { kind: "observeOnly" } }` menjalankan turn tanpa menghasilkan output terlihat. Adapter tetap memiliki callback pengiriman; callback itu hanya menjadi no-op untuk turn tersebut.

`onFinalize` berjalan pada setiap hasil, termasuk error dispatch. Gunakan ini untuk membersihkan riwayat grup yang tertunda, menghapus reaksi ack, menghentikan indikator status, dan flush status lokal.

## Adapter pengiriman

Kernel tidak memanggil platform secara langsung. Saluran memberikan `ChannelTurnDeliveryAdapter` kepada kernel:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` dipanggil sekali per chunk balasan yang dibuffer. Kembalikan id pesan platform saat saluran memilikinya agar dispatcher dapat mempertahankan tambatan utas dan mengedit chunk berikutnya nanti. Untuk turn observe-only, kembalikan `{ visibleReplySent: false }` atau gunakan `createNoopChannelTurnDeliveryAdapter()`.

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

Dispatcher menunggu tahap pencatatan. Jika pencatatan melempar error, kernel menjalankan `onPreDispatchFailure` (saat disediakan ke `runPrepared`) dan melempar ulang.

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

- Transport platform (gateway, REST, websocket, polling, webhook)
- Resolusi identitas dan pencocokan nama tampilan
- Perintah native, slash command, autocomplete, modal, tombol, status suara
- Rendering kartu, modal, dan adaptive-card
- Auth media, aturan CDN, media terenkripsi, transkripsi
- API edit, reaksi, redaksi, dan presence
- Backfill dan pengambilan riwayat sisi platform
- Alur pairing yang memerlukan verifikasi khusus platform

Jika dua saluran mulai membutuhkan helper yang sama untuk salah satu hal ini, ekstrak helper SDK bersama alih-alih mendorongnya ke kernel.

## Stabilitas

`runtime.channel.turn.*` adalah bagian dari surface runtime Plugin publik. Tipe fakta (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) dan bentuk admission (`ChannelTurnAdmission`, `ChannelEventClass`) dapat dijangkau melalui `PluginRuntime` dari `openclaw/plugin-sdk/core`.

Aturan kompatibilitas mundur berlaku: bidang fakta baru bersifat aditif, jenis admission tidak diganti namanya, dan nama entry point tetap stabil. Kebutuhan saluran baru yang memerlukan perubahan non-aditif harus melalui proses migrasi SDK Plugin.

## Terkait

- [Membangun plugin saluran](/id/plugins/sdk-channel-plugins) untuk kontrak plugin saluran yang lebih luas
- [Helper runtime Plugin](/id/plugins/sdk-runtime) untuk surface `runtime.*` lainnya
- [Internal Plugin](/id/plugins/architecture-internals) untuk pipeline pemuatan dan mekanika registry
