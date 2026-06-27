---
read_when:
    - Anda sedang membangun atau merombak jalur penerimaan plugin kanal perpesanan
    - Anda memerlukan konstruksi konteks masuk bersama, perekaman sesi, atau pengiriman balasan yang telah disiapkan
    - Anda sedang memigrasikan helper giliran channel lama ke API inbound/pesan
summary: 'Helper peristiwa masuk untuk Plugin kanal: pembuatan konteks, orkestrasi runner bersama, catatan sesi, dan pengiriman balasan yang telah disiapkan'
title: API masuk saluran
x-i18n:
    generated_at: "2026-06-27T17:58:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Plugin kanal harus memodelkan jalur penerimaan dengan nomina masuk dan pesan:

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

Gunakan `openclaw/plugin-sdk/channel-inbound` untuk normalisasi event masuk,
pemformatan, root, dan orkestrasi. Gunakan
`openclaw/plugin-sdk/channel-outbound` untuk perilaku
pengiriman native, tanda terima, pengiriman persisten, dan pratinjau langsung.

## Helper Inti

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: proyeksikan fakta kanal yang telah dinormalisasi ke dalam
  konteks prompt/sesi. Gunakan `channelContext` untuk meneruskan metadata
  pengirim/percakapan milik kanal ke hook Plugin `ctx.channelContext`; perluas
  `PluginHookChannelSenderContext` atau `PluginHookChannelChatContext` dari
  subjalur ini untuk field khusus kanal.
- `runChannelInboundEvent(...)`: jalankan ingest, klasifikasi, preflight, resolve,
  perekaman, dispatch, dan finalisasi untuk satu event platform masuk.
- `dispatchChannelInboundReply(...)`: rekam dan dispatch balasan masuk yang sudah dirakit
  dengan adapter pengiriman.

Runtime Plugin yang diinjeksi mengekspos helper tingkat tinggi yang sama di bawah
`runtime.channel.inbound.*` untuk kanal bawaan/native yang sudah menerima objek
runtime.

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

Dispatcher kompatibilitas harus merakit input `dispatchChannelInboundReply(...)`
dan mempertahankan pengiriman platform di dalam adapter pengiriman. Jalur pengiriman baru harus
mengutamakan adapter pesan dan helper pesan persisten.

## Migrasi

Alias runtime lama `runtime.channel.turn.*` telah dihapus. Gunakan:

- `runtime.channel.inbound.run(...)` untuk event masuk mentah.
- `runtime.channel.inbound.dispatchReply(...)` untuk konteks balasan yang sudah dirakit.
- `runtime.channel.inbound.buildContext(...)` untuk payload konteks masuk.
- `runtime.channel.inbound.runPreparedReply(...)` hanya untuk jalur dispatch siap pakai
  milik kanal yang sudah merakit closure dispatch mereka sendiri.

Kode Plugin baru tidak boleh memperkenalkan API kanal bernama `turn`. Pertahankan kosakata giliran model atau
agen di dalam kode agen/provider; Plugin kanal menggunakan istilah masuk,
pesan, pengiriman, dan balasan.
