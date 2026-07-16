---
read_when:
    - Membangun atau memigrasikan plugin saluran perpesanan
    - Mengubah daftar izin DM atau grup, gerbang perutean, autentikasi perintah, autentikasi peristiwa, atau aktivasi penyebutan
    - Meninjau penyuntingan data sensitif pada ingress kanal atau batas kompatibilitas SDK
sidebarTitle: Channel Ingress
summary: API ingress channel eksperimental untuk otorisasi pesan masuk
title: API masuk kanal
x-i18n:
    generated_at: "2026-07-16T18:34:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3339af82a5dc3572d581f13960286f8b9ac933e7f491e8c4e0daba093caccc73
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Ingress channel adalah batas kontrol akses eksperimental untuk peristiwa
channel masuk. Plugin memiliki fakta platform dan efek samping; core memiliki
kebijakan generik: daftar yang diizinkan untuk DM/grup, entri DM penyimpanan pemasangan, gerbang rute,
gerbang perintah, otorisasi peristiwa, aktivasi penyebutan, diagnostik yang disamarkan, dan
penerimaan.

Gunakan `openclaw/plugin-sdk/channel-ingress-runtime` untuk jalur penerimaan.

## Resolver runtime

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

Jangan melakukan prapenghitungan terhadap daftar efektif yang diizinkan, pemilik perintah, atau grup perintah.
Resolver menurunkannya dari daftar mentah yang diizinkan, callback penyimpanan, deskriptor
rute, grup akses, kebijakan, dan jenis percakapan.

## Hasil

Plugin bawaan harus menggunakan proyeksi modern secara langsung:

| Bidang              | Arti                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | keputusan gerbang berurutan dan penerimaan                          |
| `senderAccess`     | hanya otorisasi pengirim/percakapan                                 |
| `routeAccess`      | proyeksi rute dan pengirim rute                                     |
| `commandAccess`    | otorisasi perintah; `requested: false` ketika tidak ada gerbang perintah yang dijalankan |
| `activationAccess` | hasil penyebutan/aktivasi                                           |

Otorisasi peristiwa tetap tersedia pada `ingress.graph` yang berurutan dan
`ingress.reasonCode` yang menentukan; tidak ada proyeksi peristiwa terpisah yang dihasilkan.

Helper SDK pihak ketiga yang tidak digunakan lagi dapat membangun ulang bentuk lama secara internal. Jalur
penerimaan bawaan baru tidak boleh menerjemahkan kembali hasil modern menjadi
DTO lokal.

## Grup akses

Entri `accessGroup:<name>` tetap disamarkan. Core menyelesaikan sendiri grup
`message.senders` statis dan memanggil `resolveAccessGroupMembership` hanya
untuk grup dinamis yang memerlukan pencarian platform. Grup yang hilang, tidak didukung, dan
gagal akan ditolak secara tertutup.

## Mode peristiwa

| `authMode`       | Arti                                             |
| ---------------- | ------------------------------------------------ |
| `inbound`        | gerbang pengirim masuk normal                    |
| `command`        | gerbang perintah untuk callback atau tombol bercakupan |
| `origin-subject` | aktor harus cocok dengan subjek pesan asli       |
| `route-only`     | gerbang rute hanya untuk peristiwa tepercaya bercakupan rute |
| `none`           | peristiwa internal milik Plugin melewati otorisasi bersama |

Gunakan `mayPair: false` untuk reaksi, tombol, callback, dan perintah native.

## Rute dan aktivasi

Gunakan deskriptor rute untuk kebijakan ruang, topik, guild, utas, atau rute bertingkat:

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

Gunakan `channelIngressRoutes(...)` ketika Plugin memiliki beberapa deskriptor rute
opsional; fungsi ini memfilter cabang yang dinonaktifkan sembari mempertahankan fakta rute tetap generik
dan diurutkan berdasarkan `precedence` setiap deskriptor.

Gerbang penyebutan adalah gerbang aktivasi. Penyebutan yang tidak cocok mengembalikan
`admission: "skip"` agar kernel giliran tidak memproses giliran yang hanya untuk observasi.
Sebagian besar channel sebaiknya menempatkan aktivasi setelah gerbang pengirim dan perintah. Permukaan
obrolan publik yang harus meredam lalu lintas tanpa penyebutan sebelum gangguan daftar pengirim yang diizinkan
dapat memilih `activation.order: "before-sender"` ketika bypass perintah teks
dinonaktifkan. Channel dengan aktivasi implisit, seperti balasan dalam utas
bot, dapat meneruskan `activation.allowedImplicitMentionKinds`; hasil proyeksi
`activationAccess.shouldBypassMention` kemudian melaporkan saat perintah atau aktivasi
implisit melewati penyebutan eksplisit.

## Penyuntingan

Nilai mentah pengirim dan entri mentah daftar yang diizinkan hanya menjadi masukan resolver. Keduanya
tidak boleh muncul dalam status yang diselesaikan, keputusan, diagnostik, snapshot, atau
fakta kompatibilitas. Gunakan ID subjek buram, ID entri, ID rute, dan
ID diagnostik.

## Verifikasi

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
