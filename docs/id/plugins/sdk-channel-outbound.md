---
read_when:
    - Anda sedang membangun atau merefaktor jalur pengiriman Plugin kanal pesan
    - Anda memerlukan pengiriman balasan akhir yang tahan lama, tanda terima, finalisasi pratinjau langsung, atau kebijakan pengakuan penerimaan
    - Anda sedang bermigrasi dari channel-message, channel-message-runtime, atau fungsi pembantu pengiriman balasan lama
summary: 'API siklus hidup pesan keluar untuk plugin kanal: adaptor, tanda terima, pengiriman tahan lama, pratinjau langsung, dan pembantu alur balasan'
title: API outbound saluran
x-i18n:
    generated_at: "2026-06-27T17:58:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9d2681c06ac808d7fe0218d1a48e6ba06ea5e80270816535d957782193e488f
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Plugin channel harus mengekspos perilaku pesan keluar dari
`openclaw/plugin-sdk/channel-outbound`. Gunakan
`openclaw/plugin-sdk/channel-inbound` untuk orkestrasi penerimaan/konteks/dispatch.

Core memiliki antrean, durabilitas, kebijakan retry generik, hook, receipt, dan
tool `message` bersama. Plugin memiliki panggilan kirim/edit/hapus native,
normalisasi target, threading platform, kutipan terpilih, flag notifikasi, status
akun, dan efek samping khusus platform.

## Adapter

Sebagian besar Plugin mendefinisikan satu adapter `message`:

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

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

Deklarasikan hanya capability yang benar-benar dipertahankan oleh transport native. Lindungi setiap
capability kirim, receipt, live-preview, dan receive-ack yang dideklarasikan dengan
helper kontrak yang diekspor dari subpath ini.

## Adapter Outbound yang Ada

Jika channel sudah memiliki adapter `outbound` yang kompatibel, turunkan adapter pesan
alih-alih menduplikasi kode kirim:

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## Pengiriman Durable

Helper kirim runtime juga berada di `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- helper streaming/progres draf seperti `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` mengembalikan satu outcome eksplisit:

- `sent`: setidaknya satu pesan platform yang terlihat telah dikirim.
- `suppressed`: tidak ada pesan platform yang harus diperlakukan sebagai hilang.
- `partial_failed`: setidaknya satu pesan platform telah dikirim sebelum payload
  atau efek samping berikutnya gagal.
- `failed`: tidak ada receipt platform yang dihasilkan.

Gunakan `payloadOutcomes` saat sebuah batch mencampur payload yang terkirim, ditekan, dan gagal.
Jangan simpulkan pembatalan hook dari hasil direct-delivery legacy yang kosong.

## Dispatch Kompatibilitas

Dispatch balasan masuk harus dirakit melalui
`dispatchChannelInboundReply(...)` dari `channel-inbound`. Pertahankan pengiriman platform
di adapter pengiriman; gunakan `channel-outbound` untuk adapter pesan,
pengiriman durable, receipt, live preview, dan opsi pipeline balasan.
