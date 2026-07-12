---
read_when:
    - Anda sedang membangun atau memfaktorkan ulang jalur penerimaan Plugin saluran perpesanan
    - Anda memerlukan konstruksi konteks masuk bersama, perekaman sesi, atau pengiriman balasan yang telah disiapkan
    - Anda sedang memigrasikan helper giliran kanal lama ke API pesan masuk/pesan
summary: 'Pembantu peristiwa masuk untuk plugin kanal: pembuatan konteks, orkestrasi runner bersama, catatan sesi, dan pengiriman balasan yang telah disiapkan'
title: API masuk kanal
x-i18n:
    generated_at: "2026-07-12T14:31:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Jalur penerimaan channel mengikuti satu alur:

```text
peristiwa platform -> fakta/konteks masuk -> balasan agen -> pengiriman pesan
```

Gunakan `openclaw/plugin-sdk/channel-inbound` untuk normalisasi peristiwa masuk,
pemformatan, root, dan orkestrasi. Gunakan
`openclaw/plugin-sdk/channel-outbound` untuk pengiriman native, tanda terima, pengiriman
persisten, dan perilaku pratinjau langsung.

## Helper inti

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: memproyeksikan fakta channel yang dinormalisasi
  ke dalam konteks prompt/sesi. Teruskan metadata pengirim/obrolan milik channel
  melalui `channelContext`, yang dilihat oleh hook plugin sebagai `ctx.channelContext`.
  Perluas `PluginHookChannelSenderContext` atau `PluginHookChannelChatContext`
  dari subjalur ini untuk bidang khusus channel.
- `runChannelInboundEvent(...)`: menjalankan penyerapan, klasifikasi, pemeriksaan awal, resolusi,
  pencatatan, pengiriman, dan finalisasi untuk satu peristiwa platform masuk.
- `dispatchChannelInboundReply(...)`: mencatat dan mengirimkan balasan masuk yang sudah
  dirakit menggunakan adaptor pengiriman.

Channel bawaan/native yang sudah menerima objek runtime plugin yang diinjeksikan
dapat memanggil helper yang sama melalui `runtime.channel.inbound.*` alih-alih
mengimpor subjalur ini secara langsung:

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

Rakit input `dispatchChannelInboundReply(...)` untuk dispatcher kompatibilitas
yang mempertahankan pengiriman platform di dalam adaptor pengiriman. Jalur pengiriman
baru sebaiknya menggunakan adaptor pesan dan helper pesan persisten dari
`channel-outbound`.

## Migrasi

Alias runtime `runtime.channel.turn.*` telah dihapus. Gunakan:

- `runtime.channel.inbound.run(...)` untuk peristiwa masuk mentah.
- `runtime.channel.inbound.dispatchReply(...)` untuk konteks balasan yang telah dirakit.
- `runtime.channel.inbound.buildContext(...)` untuk payload konteks masuk.
- `runtime.channel.inbound.runPreparedReply(...)`, tidak digunakan lagi, hanya untuk
  jalur pengiriman siap pakai milik channel yang sudah merakit closure
  pengirimannya sendiri.

Kode plugin baru tidak boleh memperkenalkan API channel bernama `turn`. Pertahankan
kosakata giliran model atau agen di dalam kode agen/penyedia; plugin channel menggunakan istilah
masuk, pesan, pengiriman, dan balasan.
