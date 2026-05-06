---
read_when:
    - Anda sedang membangun atau merefaktor Plugin kanal perpesanan
    - Anda memerlukan pengiriman balasan akhir yang persisten, tanda terima, finalisasi pratinjau langsung, atau kebijakan pengakuan penerimaan
    - Anda sedang bermigrasi dari pipeline balasan lama atau helper pengiriman balasan masuk
summary: API siklus hidup pesan untuk Plugin kanal, termasuk pengiriman persisten, tanda terima, pratinjau langsung, kebijakan pengakuan penerimaan, dan migrasi lama
title: API pesan saluran
x-i18n:
    generated_at: "2026-05-06T09:21:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Plugin channel harus mengekspos satu adapter `message` dari
`openclaw/plugin-sdk/channel-message`. Adapter tersebut menjelaskan siklus hidup
pesan natif yang didukung platform:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Inti memiliki antrean, durabilitas, kebijakan coba ulang generik, hook, receipt, dan
alat `message` bersama. Plugin memiliki panggilan send/edit/delete natif,
normalisasi target, threading platform, kutipan terpilih, flag notifikasi, status
akun, dan efek samping khusus platform.

Gunakan halaman ini bersama dengan [Membangun Plugin channel](/id/plugins/sdk-channel-plugins).

Subpath `channel-message` sengaja dibuat cukup ringan untuk file bootstrap Plugin
yang sering dijalankan seperti `channel.ts`: subpath ini mengekspos kontrak adapter,
bukti kapabilitas, receipt, dan fasad kompatibilitas tanpa memuat pengiriman
keluar. Helper pengiriman runtime tersedia dari
`openclaw/plugin-sdk/channel-message-runtime` untuk jalur kode monitor/send yang
sudah melakukan I/O pesan asinkron.

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

Deklarasikan hanya kapabilitas yang benar-benar dipertahankan adapter. Setiap
kapabilitas yang dideklarasikan harus memiliki uji kontrak.

## Jembatan outbound

Jika channel sudah memiliki adapter `outbound` yang kompatibel, utamakan menurunkan
adapter pesan daripada menduplikasi kode pengiriman:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Jembatan ini mengonversi hasil pengiriman outbound lama menjadi nilai
`MessageReceipt`. Kode baru harus meneruskan receipt dari ujung ke ujung dan hanya
menurunkan id lama di batas kompatibilitas dengan `listMessageReceiptPlatformIds(...)`
atau `resolveMessageReceiptPrimaryId(...)`.
Jika tidak ada kebijakan penerimaan yang disediakan,
`createChannelMessageAdapterFromOutbound(...)` menggunakan kebijakan acknowledgement
penerimaan `manual`. Ini membuat acknowledgement platform milik Plugin menjadi
eksplisit tanpa mengubah channel yang meng-acknowledge webhook, soket, atau offset
polling di luar konteks penerimaan generik.

## Pengiriman alat pesan

Jalur `message(action="send")` bersama harus menggunakan siklus hidup pengiriman
inti yang sama seperti balasan final. Jika sebuah channel membutuhkan pembentukan
khusus provider untuk pengiriman alat, implementasikan `actions.prepareSendPayload(...)`
alih-alih mengirim dari `actions.handleAction(...)`.

`prepareSendPayload(...)` menerima `ReplyPayload` inti yang sudah dinormalisasi
ditambah konteks aksi penuh. Kembalikan payload dengan data khusus channel di
`payload.channelData.<channel>` dan biarkan inti memanggil `sendMessage(...)`,
`deliverOutboundPayloads(...)`, antrean write-ahead, hook pengiriman pesan, coba
ulang, pemulihan, dan pembersihan ack.

Kembalikan `null` hanya ketika pengiriman tidak dapat direpresentasikan sebagai
payload durabel, misalnya karena berisi factory komponen yang tidak dapat
diserialisasi. Inti akan mempertahankan fallback aksi Plugin lama untuk
kompatibilitas, tetapi fitur pengiriman channel baru harus dapat dinyatakan
sebagai data payload durabel.

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
Ini menjaga rendering khusus platform tetap berada di Plugin sementara inti tetap
memiliki persistensi, coba ulang, pemulihan, hook, dan ack.

Payload `message(action="send")` yang disiapkan dan pengiriman balasan final
generik menggunakan pengiriman inti dengan antrean best-effort secara default.
Antrean durabel wajib hanya valid setelah inti memverifikasi bahwa channel dapat
merekonsiliasi pengiriman yang hasilnya tidak diketahui setelah crash. Jika adapter
tidak dapat mengimplementasikan `reconcileUnknownSend`, pertahankan jalur pengiriman
yang disiapkan sebagai best-effort; inti tetap akan mencoba antrean write-ahead,
tetapi persistensi antrean atau pemulihan crash yang tidak pasti bukan bagian dari
kontrak pengiriman wajib.

## Kapabilitas final durabel

Pengiriman final durabel bersifat opt-in per efek samping. Inti hanya akan
menggunakan pengiriman durabel generik ketika adapter mendeklarasikan setiap
kapabilitas yang dibutuhkan oleh payload dan opsi pengiriman.

| Kapabilitas            | Deklarasikan ketika                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | Adapter dapat mengirim teks dan mengembalikan receipt.                               |
| `media`                | Pengiriman media mengembalikan receipt untuk setiap pesan platform yang terlihat.    |
| `payload`              | Adapter mempertahankan semantik payload balasan kaya, bukan hanya teks dan satu URL media. |
| `replyTo`              | Target balasan natif mencapai platform.                                              |
| `thread`               | Target thread, topik, atau thread channel natif mencapai platform.                   |
| `silent`               | Penekanan notifikasi mencapai platform.                                              |
| `nativeQuote`          | Metadata kutipan terpilih mencapai platform.                                         |
| `messageSendingHooks`  | Hook pengiriman pesan inti dapat membatalkan atau menulis ulang konten sebelum I/O platform. |
| `batch`                | Batch multi-bagian yang dirender dapat diputar ulang sebagai satu rencana durabel.   |
| `reconcileUnknownSend` | Adapter dapat menyelesaikan pemulihan `unknown_after_send` tanpa replay buta.        |
| `afterSendSuccess`     | Efek samping after-send lokal channel berjalan sekali.                               |
| `afterCommit`          | Efek samping after-commit lokal channel berjalan sekali.                             |

Pengiriman final best-effort tidak memerlukan `reconcileUnknownSend`; ia menggunakan
siklus hidup bersama ketika adapter mempertahankan semantik terlihat dari payload,
dan fallback ke I/O platform langsung jika persistensi antrean tidak tersedia.
Pengiriman final durabel wajib harus secara eksplisit mewajibkan
`reconcileUnknownSend`. Jika adapter tidak dapat menentukan apakah pengiriman yang
sudah dimulai/tidak diketahui mencapai platform, jangan deklarasikan kapabilitas
tersebut; inti akan menolak pengiriman durabel wajib sebelum mengantrekan.

Ketika pemanggil membutuhkan pengiriman durabel, turunkan requirement alih-alih
membangun map secara manual:

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
hanya untuk jalur yang memang sengaja tidak dapat menjalankan hook pengiriman pesan
global.

## Kontrak pengiriman durabel

Pengiriman final durabel memiliki semantik yang lebih ketat daripada pengiriman
lama milik channel:

- Buat intent durabel sebelum I/O platform.
- Jika pengiriman durabel mengembalikan hasil yang tertangani, jangan fallback ke pengiriman lama.
- Perlakukan pembatalan hook dan hasil no-send sebagai terminal.
- Perlakukan `unsupported` sebagai hasil pra-intent saja.
- Untuk durabilitas wajib, gagal sebelum I/O platform jika antrean tidak dapat mencatat
  bahwa pengiriman platform sudah dimulai.
- Untuk pengiriman final wajib dan pengiriman alat pesan yang disiapkan secara wajib,
  lakukan preflight `reconcileUnknownSend`; pemulihan harus dapat meng-ack pesan
  yang sudah terkirim atau replay hanya setelah adapter membuktikan bahwa pengiriman
  asli tidak terjadi.
- Untuk `best_effort`, kegagalan penulisan antrean dapat fallback ke I/O platform langsung.
- Teruskan sinyal abort ke pemuatan media dan pengiriman platform.
- Jalankan hook after-commit setelah ack antrean; fallback best-effort langsung menjalankannya
  setelah I/O platform berhasil karena tidak ada commit antrean durabel.
- Kembalikan receipt untuk setiap id pesan platform yang terlihat.
- Gunakan `reconcileUnknownSend` ketika platform dapat memeriksa apakah pengiriman
  yang tidak pasti sudah mencapai pengguna.

Kontrak ini menghindari pengiriman duplikat setelah crash dan menghindari bypass
hook pembatalan pengiriman pesan.

## Receipt

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
pengiriman yang ada. Gunakan `createPreviewMessageReceipt(...)` ketika pesan live
preview menjadi receipt final. Hindari menambahkan field `messageIds` lokal pemilik
yang baru. `ChannelDeliveryResult.messageIds` lama masih diproduksi di batas
kompatibilitas.

## Live preview

Channel yang melakukan streaming draft preview atau pembaruan progres harus
mendeklarasikan kapabilitas live:

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
`deliverWithFinalizableLivePreviewAdapter(...)` untuk finalisasi runtime. Finalizer
memutuskan apakah balasan final mengedit preview di tempat, mengirim fallback
normal, membuang status preview tertunda, mempertahankan edit gagal yang ambigu
tanpa menduplikasi pesan, dan mengembalikan receipt final.

## Kebijakan ack penerimaan

Receiver inbound yang mengontrol timing acknowledgement platform harus
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

Adapter yang tidak mendeklarasikan kebijakan penerimaan default ke:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Gunakan default saat platform tidak memiliki acknowledgement untuk ditunda, sudah
melakukan acknowledgement sebelum pemrosesan asinkron, atau memerlukan semantik
respons khusus protokol. Deklarasikan salah satu kebijakan bertahap hanya saat
receiver benar-benar menggunakan konteks penerimaan untuk memindahkan
acknowledgement platform ke tahap yang lebih lambat.

Kebijakan:

| Kebijakan              | Gunakan saat                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `after_receive_record` | Platform dapat di-acknowledge setelah event masuk diurai dan dicatat.                  |
| `after_agent_dispatch` | Platform harus menunggu hingga dispatch agen diterima.                                 |
| `after_durable_send`   | Platform harus menunggu hingga pengiriman akhir memiliki keputusan durable.            |
| `manual`               | Plugin memiliki acknowledgement karena semantik platform tidak cocok dengan tahap generik. |

Gunakan `createMessageReceiveContext(...)` pada receiver yang menunda status ack, dan
`shouldAckMessageAfterStage(...)` saat receiver perlu menguji apakah sebuah
tahap telah memenuhi kebijakan yang dikonfigurasi.

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

Tambahkan suite bukti live dan penerimaan saat adapter mendeklarasikan fitur tersebut. Bukti yang
hilang harus menggagalkan pengujian, bukan memperluas permukaan durable
secara diam-diam.

## API kompatibilitas yang tidak digunakan lagi

API ini tetap dapat diimpor untuk kompatibilitas pihak ketiga. Jangan gunakan untuk
kode channel baru.

| API yang tidak digunakan lagi                | Pengganti                                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` untuk dispatcher kompatibilitas, atau adapter `message` untuk kode channel baru |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` dari `openclaw/plugin-sdk/channel-message-runtime`                 |
| `dispatchInboundReplyWithBase(...)`          | `dispatchChannelMessageReplyWithBase(...)` hanya untuk dispatcher kompatibilitas                                    |
| `recordInboundSessionAndDispatchReply(...)`  | `recordChannelMessageReplyDispatch(...)` hanya untuk dispatcher kompatibilitas                                      |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` plus `deliverWithFinalizableLivePreviewAdapter(...)`                     |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                        |

Dispatcher kompatibilitas masih dapat menggunakan `createReplyPrefixContext(...)`,
`createReplyPrefixOptions(...)`, dan `createTypingCallbacks(...)` melalui
facade message. Kode lifecycle baru harus menghindari subpath lama
`channel-reply-pipeline`.

## Checklist migrasi

1. Tambahkan `message: defineChannelMessageAdapter(...)` atau
   `message: createChannelMessageAdapterFromOutbound(...)` ke Plugin channel.
2. Kembalikan `MessageReceipt` dari pengiriman teks, media, dan payload.
3. Deklarasikan hanya kapabilitas yang didukung oleh perilaku native dan pengujian.
4. Ganti peta persyaratan durable yang ditulis manual dengan
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Pindahkan finalisasi pratinjau melalui helper live preview saat channel
   mengedit pesan draf di tempat.
6. Deklarasikan kebijakan ack penerimaan hanya saat receiver benar-benar dapat menunda
   acknowledgement platform.
7. Pertahankan helper dispatch balasan lama hanya di batas kompatibilitas.
