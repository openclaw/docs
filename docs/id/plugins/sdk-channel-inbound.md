---
read_when:
    - Anda sedang membangun atau memfaktorkan ulang jalur penerimaan Plugin saluran perpesanan
    - Anda memerlukan konstruksi konteks masuk bersama, pencatatan sesi, atau pengiriman balasan yang telah disiapkan
    - Anda sedang memigrasikan pembantu giliran kanal lama ke API inbound/message
summary: 'Pembantu event masuk untuk plugin saluran: pembuatan konteks, orkestrasi runner bersama, catatan sesi, dan pengiriman balasan yang telah disiapkan'
title: API masuk saluran
x-i18n:
    generated_at: "2026-07-20T03:56:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f702019b0ee35055edd6fdbccc190eee66f35419d918c50076a005072d3f8ec
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
  melalui `channelContext`, yang dilihat hook plugin sebagai `ctx.channelContext`.
  Perluas `PluginHookChannelSenderContext` atau `PluginHookChannelChatContext`
  dari subjalur ini untuk bidang khusus channel.
- `runChannelInboundEvent(...)`: menjalankan penyerapan, klasifikasi, prapemeriksaan, resolusi,
  pencatatan, dispatch, dan finalisasi untuk satu peristiwa platform masuk.
- `dispatchChannelInboundReply(...)`: mencatat dan melakukan dispatch terhadap balasan masuk
  yang telah dirakit dengan adaptor pengiriman.

Untuk peristiwa masuk khusus media, biarkan isi pesan dan teks perintah kosong dan
teruskan satu fakta `ChannelInboundMediaInput` per lampiran native. Saat baris
riwayat sekitar atau pembawa khusus teks lainnya harus menjelaskan fakta tersebut, gunakan
`formatMediaPlaceholderText(media)`. Ini mengklasifikasikan setiap fakta dari `kind`, tipe
MIME, lalu ekstensi jalur atau URL; lampiran native yang belum diunduh tetap harus
menyumbangkan masing-masing satu fakta khusus tipe. Jangan gunakan pemformat untuk menyintesis
isi utama pesan masuk.

Channel bawaan/native yang sudah menerima objek runtime plugin yang diinjeksi
dapat memanggil helper yang sama di bawah `runtime.channel.inbound.*`, alih-alih
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
yang mempertahankan pengiriman platform di adaptor pengiriman. Jalur pengiriman
baru harus menggunakan adaptor pesan dan helper pesan persisten dari
`channel-outbound` sebagai gantinya.

## Migrasi

Alias runtime `runtime.channel.turn.*` telah dihapus. Gunakan:

- `runtime.channel.inbound.run(...)` untuk peristiwa masuk mentah.
- `runtime.channel.inbound.dispatchReply(...)` untuk konteks balasan yang telah dirakit.
- `runtime.channel.inbound.buildContext(...)` untuk payload konteks masuk.
- `runtime.channel.inbound.runPreparedReply(...)`, tidak digunakan lagi, hanya untuk
  jalur dispatch siap pakai milik channel yang sudah merakit closure
  dispatch-nya sendiri.

Kode plugin baru tidak boleh memperkenalkan API channel bernama `turn`. Pertahankan kosakata giliran
model atau agen di dalam kode agen/penyedia; plugin channel menggunakan istilah masuk,
pesan, pengiriman, dan balasan.
