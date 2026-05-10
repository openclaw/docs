---
read_when:
    - Anda sedang membangun atau merefaktor Plugin saluran perpesanan
    - Anda memerlukan pengiriman balasan akhir yang persisten, tanda terima, finalisasi pratinjau langsung, atau kebijakan pengakuan penerimaan
    - Anda sedang bermigrasi dari alur pemrosesan balasan lama atau fungsi bantu pengiriman balasan masuk
summary: API siklus hidup pesan untuk plugin saluran, termasuk pengiriman persisten, tanda terima, pratinjau langsung, kebijakan pengakuan penerimaan, dan migrasi sistem lama
title: API pesan kanal
x-i18n:
    generated_at: "2026-05-10T19:46:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Plugin channel harus mengekspos satu adapter `message` dari
`openclaw/plugin-sdk/channel-message`. Adapter tersebut menjelaskan siklus hidup pesan native
yang didukung platform:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Core memiliki antrean, durabilitas, kebijakan percobaan ulang generik, hook, tanda terima, dan
tool `message` bersama. Plugin memiliki panggilan native kirim/edit/hapus, normalisasi target,
threading platform, kutipan terpilih, flag notifikasi, status akun, dan efek samping khusus platform.

Gunakan halaman ini bersama [Membangun Plugin channel](/id/plugins/sdk-channel-plugins).

Subpath `channel-message` sengaja dibuat cukup ringan untuk file bootstrap Plugin yang panas
seperti `channel.ts`: ia mengekspos kontrak adapter, bukti kapabilitas, tanda terima, dan facade
kompatibilitas tanpa memuat pengiriman outbound. Helper pengiriman runtime tersedia dari
`openclaw/plugin-sdk/channel-message-runtime` untuk jalur kode monitor/kirim yang
sudah melakukan I/O pesan asinkron.

Kode kirim channel dan Plugin baru harus menggunakan helper siklus hidup pesan dari
`openclaw/plugin-sdk/channel-message-runtime`: `sendDurableMessageBatch`,
`withDurableMessageSendContext`, atau `deliverInboundReplyWithMessageSendContext`.
Helper lama
`deliverOutboundPayloads(...)` di `openclaw/plugin-sdk/outbound-runtime`
sudah tidak disarankan dan merupakan substrat kompatibilitas/runtime untuk internal outbound, pemulihan,
dan adapter legacy. Jangan gunakan itu untuk jalur kirim channel atau Plugin baru.

`sendDurableMessageBatch(...)` mengembalikan hasil siklus hidup eksplisit:

- `sent` - setidaknya satu pesan platform yang terlihat telah dikirim.
- `suppressed` - tidak ada pesan platform yang harus dianggap hilang. Alasan stabil
  mencakup `cancelled_by_message_sending_hook`,
  `empty_after_message_sending_hook`, `no_visible_payload`,
  `adapter_returned_no_identity`, dan legacy `no_visible_result`.
- `partial_failed` - setidaknya satu pesan platform telah dikirim sebelum payload
  atau efek samping berikutnya gagal. Hasilnya mencakup prefiks tanda terima yang sudah dikirim
  plus kegagalan.
- `failed` - tidak ada tanda terima platform yang dihasilkan.

Gunakan `payloadOutcomes` saat batch mencampur payload terkirim, ditekan, dan gagal.
Jangan menyimpulkan pembatalan hook dengan memeriksa apakah array pengiriman langsung lama
kosong.

Dispatcher kompatibilitas yang masih membutuhkan dispatcher balasan buffered harus
membangun opsi prefiks balasan dengan `createChannelMessageReplyPipeline(...)` dari
`openclaw/plugin-sdk/channel-message`, lalu memanggil
`channel.turn.runPrepared(...)` milik runtime. Itu menjaga perekaman sesi dan urutan dispatch
pada siklus hidup turn bersama tanpa menambahkan pembungkus turn publik lain.

## Adapter minimal

Sebagian besar Plugin channel baru dapat dimulai dengan adapter kecil:

```typescript
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-message";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

Lalu lampirkan ke Plugin channel:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Hanya deklarasikan kapabilitas yang benar-benar dipertahankan oleh adapter. Setiap kapabilitas yang dideklarasikan
harus memiliki uji kontrak.

## Bridge outbound

Jika channel sudah memiliki adapter `outbound` yang kompatibel, lebih baik turunkan
adapter pesan daripada menduplikasi kode kirim:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Bridge mengonversi hasil kirim outbound lama menjadi nilai `MessageReceipt`. Kode baru
harus meneruskan tanda terima dari ujung ke ujung dan hanya menurunkan id legacy pada edge
kompatibilitas dengan `listMessageReceiptPlatformIds(...)` atau
`resolveMessageReceiptPrimaryId(...)`.
Jika tidak ada kebijakan terima yang diberikan, `createChannelMessageAdapterFromOutbound(...)`
menggunakan kebijakan acknowledgement terima `manual`. Itu membuat acknowledgement platform
milik Plugin menjadi eksplisit tanpa mengubah channel yang mengakui Webhook,
socket, atau offset polling di luar konteks terima generik.

## Pengiriman tool pesan

Jalur `message(action="send")` bersama harus menggunakan siklus hidup pengiriman core
yang sama seperti balasan final. Jika sebuah channel membutuhkan pembentukan khusus penyedia untuk
pengiriman tool, implementasikan `actions.prepareSendPayload(...)` alih-alih mengirim dari
`actions.handleAction(...)`.

`prepareSendPayload(...)` menerima `ReplyPayload` core yang sudah dinormalisasi plus konteks action
lengkap. Kembalikan payload dengan data khusus channel di
`payload.channelData.<channel>` dan biarkan core memanggil `sendMessage(...)`,
runtime siklus hidup pesan, antrean write-ahead, hook pengiriman pesan,
percobaan ulang, pemulihan, dan pembersihan ack. Runtime siklus hidup mungkin memanggil
`deliverOutboundPayloads(...)` secara internal sebagai substrat kompatibilitas, tetapi Plugin
channel tidak boleh memanggilnya langsung untuk perilaku kirim baru.

Kembalikan `null` hanya saat pengiriman tidak dapat direpresentasikan sebagai payload durable, misalnya
karena berisi factory komponen yang tidak dapat diserialisasi. Core akan mempertahankan
fallback action Plugin legacy untuk kompatibilitas, tetapi fitur kirim channel baru
harus dapat diekspresikan sebagai data payload durable.

```typescript
export const demoActions: ChannelMessageActionAdapter = {
  describeMessageTool: () => ({ actions: ["send"], capabilities: ["presentation"] }),
  prepareSendPayload: ({ ctx, payload }) => {
    if (ctx.action !== "send") {
      return null;
    }
    return {
      ...payload,
      channelData: {
        ...payload.channelData,
        demo: {
          ...(payload.channelData?.demo as object | undefined),
          nativeCard: ctx.params.card,
        },
      },
    };
  },
};
```

Adapter outbound kemudian membaca `payload.channelData.demo` di dalam `sendPayload`.
Ini menjaga rendering khusus platform tetap berada di Plugin sementara core tetap memiliki
persistensi, percobaan ulang, pemulihan, hook, dan ack.

Payload `message(action="send")` yang sudah disiapkan dan pengiriman balasan final generik menggunakan
pengiriman core dengan antrean best-effort secara default. Antrean durable wajib
hanya valid setelah core memverifikasi bahwa channel dapat merekonsiliasi pengiriman yang hasilnya
tidak diketahui setelah crash. Jika adapter tidak dapat mengimplementasikan `reconcileUnknownSend`,
pertahankan jalur kirim yang disiapkan sebagai best-effort; core tetap akan mencoba antrean write-ahead,
tetapi persistensi antrean atau pemulihan crash yang tidak pasti bukan bagian dari
kontrak pengiriman wajib.

## Kapabilitas final durable

Pengiriman final durable bersifat opt-in per efek samping. Core hanya akan menggunakan pengiriman durable
generik saat adapter mendeklarasikan setiap kapabilitas yang dibutuhkan oleh
payload dan opsi pengiriman.

| Kapabilitas            | Deklarasikan saat                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | Adapter dapat mengirim teks dan mengembalikan tanda terima.                         |
| `media`                | Pengiriman media mengembalikan tanda terima untuk setiap pesan platform yang terlihat. |
| `payload`              | Adapter mempertahankan semantik payload balasan kaya, bukan hanya teks dan satu URL media. |
| `replyTo`              | Target balasan native mencapai platform.                                             |
| `thread`               | Target thread, topik, atau thread channel native mencapai platform.                  |
| `silent`               | Penekanan notifikasi mencapai platform.                                              |
| `nativeQuote`          | Metadata kutipan terpilih mencapai platform.                                         |
| `messageSendingHooks`  | Hook pengiriman pesan core dapat membatalkan atau menulis ulang konten sebelum I/O platform. |
| `batch`                | Batch multi-bagian yang dirender dapat diputar ulang sebagai satu rencana durable.   |
| `reconcileUnknownSend` | Adapter dapat menyelesaikan pemulihan `unknown_after_send` tanpa replay buta.        |
| `afterSendSuccess`     | Efek samping setelah-kirim lokal channel berjalan satu kali.                         |
| `afterCommit`          | Efek samping setelah-commit lokal channel berjalan satu kali.                        |

Pengiriman final best-effort tidak memerlukan `reconcileUnknownSend`; ia menggunakan
siklus hidup bersama saat adapter mempertahankan semantik terlihat payload, dan
fallback ke I/O platform langsung jika persistensi antrean tidak tersedia. Pengiriman final
durable wajib harus secara eksplisit mensyaratkan `reconcileUnknownSend`. Jika
adapter tidak dapat menentukan apakah pengiriman yang dimulai/tidak diketahui mencapai platform,
jangan deklarasikan kapabilitas itu; core akan menolak pengiriman durable wajib
sebelum mengantrekan.

Saat pemanggil membutuhkan pengiriman durable, turunkan persyaratan alih-alih membangun
map secara manual:

```typescript
import { deriveDurableFinalDeliveryRequirements } from "openclaw/plugin-sdk/channel-message";

const requiredCapabilities = deriveDurableFinalDeliveryRequirements({
  payload,
  replyToId,
  threadId,
  silent,
  payloadTransport: true,
  extraCapabilities: {
    nativeQuote: hasSelectedQuote(payload),
  },
});
```

`messageSendingHooks` diwajibkan secara default. Tetapkan `messageSendingHooks: false`
hanya untuk jalur yang secara sengaja tidak dapat menjalankan hook pengiriman pesan global.

## Kontrak pengiriman durable

Pengiriman final durable memiliki semantik yang lebih ketat daripada pengiriman legacy milik channel:

- Buat intent durable sebelum I/O platform.
- Jika pengiriman durable mengembalikan hasil yang sudah ditangani, jangan fallback ke kirim legacy.
- Perlakukan pembatalan hook dan hasil tanpa-kirim sebagai terminal.
- Perlakukan `unsupported` sebagai hasil pra-intent saja.
- Untuk durabilitas wajib, gagal sebelum I/O platform jika antrean tidak dapat mencatat
  bahwa pengiriman platform telah dimulai.
- Untuk pengiriman final wajib dan pengiriman tool pesan yang disiapkan dan wajib,
  lakukan preflight `reconcileUnknownSend`; pemulihan harus dapat meng-ack pesan
  yang sudah terkirim atau hanya replay setelah adapter membuktikan pengiriman asli
  tidak terjadi.
- Untuk `best_effort`, kegagalan tulis antrean dapat fallback ke I/O platform langsung.
- Teruskan sinyal abort ke pemuatan media dan pengiriman platform.
- Jalankan hook setelah-commit setelah ack antrean; fallback best-effort langsung menjalankannya
  setelah I/O platform berhasil karena tidak ada commit antrean durable.
- Kembalikan tanda terima untuk setiap id pesan platform yang terlihat.
- Gunakan `reconcileUnknownSend` saat platform dapat memeriksa apakah pengiriman yang tidak pasti
  sudah mencapai pengguna.

Kontrak ini menghindari pengiriman duplikat setelah crash dan menghindari pemintasan
hook pembatalan pengiriman pesan.

## Tanda terima

`MessageReceipt` adalah catatan internal baru tentang apa yang diterima platform:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  sentAt: number;
  raw?: readonly MessageReceiptSourceResult[];
};
```

Gunakan `createMessageReceiptFromOutboundResults(...)` saat mengadaptasi hasil
pengiriman yang sudah ada. Gunakan `createPreviewMessageReceipt(...)` saat pesan
pratinjau langsung menjadi receipt akhir. Hindari menambahkan field `messageIds`
lokal milik owner yang baru. `ChannelDeliveryResult.messageIds` lama masih
diproduksi di batas kompatibilitas.

## Pratinjau langsung

Channel yang melakukan stream pratinjau draf atau pembaruan progres harus
mendeklarasikan kapabilitas langsung:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  live: {
    capabilities: {
      draftPreview: true,
      previewFinalization: true,
      progressUpdates: true,
      quietFinalization: true,
    },
    finalizer: {
      capabilities: {
        finalEdit: true,
        normalFallback: true,
        discardPending: true,
        previewReceipt: true,
        retainOnAmbiguousFailure: true,
      },
    },
  },
});
```

Gunakan `defineFinalizableLivePreviewAdapter(...)` dan
`deliverWithFinalizableLivePreviewAdapter(...)` untuk finalisasi runtime.
Finalizer memutuskan apakah balasan akhir mengedit pratinjau di tempat,
mengirim fallback normal, membuang status pratinjau yang tertunda,
mempertahankan edit gagal yang ambigu tanpa menduplikasi pesan, dan
mengembalikan receipt akhir.

## Kebijakan ack penerimaan

Receiver inbound yang mengontrol timing acknowledgment platform harus
mendeklarasikan kebijakan penerimaan:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Adapter yang tidak mendeklarasikan kebijakan penerimaan menggunakan default:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Gunakan default saat platform tidak memiliki acknowledgment untuk ditunda, sudah
melakukan acknowledgment sebelum pemrosesan asinkron, atau membutuhkan semantik
respons khusus protokol. Deklarasikan salah satu kebijakan bertahap hanya saat
receiver benar-benar menggunakan konteks penerimaan untuk memindahkan
acknowledgment platform ke tahap yang lebih lambat.

Kebijakan:

| Kebijakan              | Gunakan saat                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `after_receive_record` | Platform dapat di-acknowledge setelah event inbound diurai dan dicatat.                |
| `after_agent_dispatch` | Platform harus menunggu hingga dispatch agen diterima.                                 |
| `after_durable_send`   | Platform harus menunggu hingga pengiriman akhir memiliki keputusan yang durable.        |
| `manual`               | Plugin memiliki acknowledgment karena semantik platform tidak cocok dengan tahap umum. |

Gunakan `createMessageReceiveContext(...)` di receiver yang menunda status ack,
dan `shouldAckMessageAfterStage(...)` saat receiver perlu menguji apakah suatu
tahap sudah memenuhi kebijakan yang dikonfigurasi.

## Pengujian kontrak

Deklarasi kapabilitas adalah bagian dari kontrak Plugin. Dukung dengan pengujian:

```typescript
import {
  verifyChannelMessageAdapterCapabilityProofs,
  verifyChannelMessageLiveCapabilityAdapterProofs,
  verifyChannelMessageLiveFinalizerProofs,
  verifyChannelMessageReceiveAckPolicyAdapterProofs,
} from "openclaw/plugin-sdk/channel-message";

it("backs declared message capabilities", async () => {
  await expect(
    verifyChannelMessageAdapterCapabilityProofs({
      adapterName: "demo",
      adapter: demoMessageAdapter,
      proofs: {
        text: async () => {
          const result = await demoMessageAdapter.send!.text!(textCtx);
          expect(result.receipt.platformMessageIds).toContain("msg-1");
        },
        replyTo: async () => {
          await demoMessageAdapter.send!.text!({ ...textCtx, replyToId: "parent-1" });
          expect(sendDemoMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              replyToId: "parent-1",
            }),
          );
        },
        messageSendingHooks: () => {
          expect(demoMessageAdapter.durableFinal!.capabilities!.messageSendingHooks).toBe(true);
        },
      },
    }),
  ).resolves.toContainEqual({ capability: "text", status: "verified" });
});
```

Tambahkan suite bukti langsung dan penerimaan saat adapter mendeklarasikan fitur
tersebut. Bukti yang hilang harus menggagalkan pengujian, bukan memperluas
permukaan durable secara diam-diam.

## API kompatibilitas yang tidak digunakan lagi

API ini tetap dapat diimpor untuk kompatibilitas pihak ketiga. Jangan gunakan
untuk kode channel baru.

| API yang tidak digunakan lagi                 | Pengganti                                                                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline`  | `openclaw/plugin-sdk/channel-message`                                                                                      |
| `createChannelTurnReplyPipeline(...)`         | `createChannelMessageReplyPipeline(...)` untuk dispatcher kompatibilitas, atau adapter `message` untuk kode channel baru   |
| `buildChannelMessageReplyDispatchBase(...)`   | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)`, atau adapter `message` untuk kode channel baru |
| `dispatchChannelMessageReplyWithBase(...)`    | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)`, atau adapter `message` untuk kode channel baru |
| `recordChannelMessageReplyDispatch(...)`      | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)`, atau adapter `message` untuk kode channel baru |
| `deliverOutboundPayloads(...)`                | `sendDurableMessageBatch(...)` atau `deliverInboundReplyWithMessageSendContext(...)` dari `channel-message-runtime`        |
| `deliverDurableInboundReplyPayload(...)`      | `deliverInboundReplyWithMessageSendContext(...)` dari `openclaw/plugin-sdk/channel-message-runtime`                        |
| `dispatchInboundReplyWithBase(...)`           | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)`, atau adapter `message` untuk kode channel baru |
| `recordInboundSessionAndDispatchReply(...)`   | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)`, atau adapter `message` untuk kode channel baru |
| `resolveChannelSourceReplyDeliveryMode(...)`  | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                        |
| `deliverFinalizableDraftPreview(...)`         | `defineFinalizableLivePreviewAdapter(...)` plus `deliverWithFinalizableLivePreviewAdapter(...)`                            |
| `DraftPreviewFinalizerDraft`                  | `LivePreviewFinalizerDraft`                                                                                                |
| `DraftPreviewFinalizerResult`                 | `LivePreviewFinalizerResult`                                                                                               |

Dispatcher kompatibilitas masih dapat menggunakan
`createReplyPrefixContext(...)`, `createReplyPrefixOptions(...)`, dan
`createTypingCallbacks(...)` melalui facade pesan. Kode lifecycle baru harus
menghindari subpath `channel-reply-pipeline` lama.

## Checklist migrasi

1. Tambahkan `message: defineChannelMessageAdapter(...)` atau
   `message: createChannelMessageAdapterFromOutbound(...)` ke Plugin channel.
2. Kembalikan `MessageReceipt` dari pengiriman teks, media, dan payload.
3. Deklarasikan hanya kapabilitas yang didukung oleh perilaku native dan pengujian.
4. Ganti peta persyaratan durable yang ditulis manual dengan
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Pindahkan finalisasi pratinjau melalui helper pratinjau langsung saat channel
   mengedit pesan draf di tempat.
6. Deklarasikan kebijakan ack penerimaan hanya saat receiver benar-benar dapat
   menunda acknowledgment platform.
7. Pertahankan helper dispatch balasan lama hanya di batas kompatibilitas.
