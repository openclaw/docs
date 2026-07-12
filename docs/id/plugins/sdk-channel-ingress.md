---
read_when:
    - Membuat atau memigrasikan plugin kanal perpesanan
    - Mengubah daftar izin DM atau grup, gerbang perutean, autentikasi perintah, autentikasi peristiwa, atau aktivasi penyebutan
    - Meninjau redaksi ingress kanal atau batas kompatibilitas SDK
sidebarTitle: Channel Ingress
summary: API ingress kanal eksperimental untuk otorisasi pesan masuk
title: API masukan saluran
x-i18n:
    generated_at: "2026-07-12T14:28:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Ingress kanal adalah batas kontrol akses eksperimental untuk peristiwa kanal
masuk. Plugin memiliki fakta platform dan efek samping; inti memiliki
kebijakan generik: daftar izin DM/grup, entri DM penyimpanan pemasangan, gerbang rute,
gerbang perintah, autentikasi peristiwa, aktivasi sebutan, diagnostik tersunting, dan
penerimaan.

Gunakan `openclaw/plugin-sdk/channel-ingress-runtime` untuk jalur penerimaan baru. Subjalur
`openclaw/plugin-sdk/channel-ingress` yang lebih lama tetap diekspor sebagai
fasad kompatibilitas usang untuk plugin pihak ketiga.

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

Jangan melakukan prakomputasi daftar izin efektif, pemilik perintah, atau grup perintah.
Resolver menurunkannya dari daftar izin mentah, callback penyimpanan, deskriptor
rute, grup akses, kebijakan, dan jenis percakapan.

## Hasil

Plugin bawaan harus menggunakan proyeksi modern secara langsung:

| Bidang             | Makna                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| `ingress`          | keputusan gerbang dan penerimaan yang berurutan                         |
| `senderAccess`     | hanya otorisasi pengirim/percakapan                                     |
| `routeAccess`      | proyeksi rute dan pengirim rute                                         |
| `commandAccess`    | otorisasi perintah; `requested: false` saat tidak ada gerbang perintah yang dijalankan |
| `activationAccess` | hasil sebutan/aktivasi                                                   |

Otorisasi peristiwa tetap tersedia pada `ingress.graph` yang berurutan dan
`ingress.reasonCode` yang menentukan; tidak ada proyeksi peristiwa terpisah yang dihasilkan.

Pembantu SDK pihak ketiga yang usang dapat membangun ulang bentuk lama secara internal. Jalur
penerimaan bawaan baru tidak boleh menerjemahkan hasil modern kembali menjadi DTO
lokal.

## Grup akses

Entri `accessGroup:<name>` tetap disunting. Inti menyelesaikan grup statis
`message.senders` sendiri dan memanggil `resolveAccessGroupMembership` hanya
untuk grup dinamis yang memerlukan pencarian platform. Grup yang tidak ada, tidak didukung, dan
gagal akan ditolak secara tertutup.

## Mode peristiwa

| `authMode`       | Makna                                                      |
| ---------------- | ---------------------------------------------------------- |
| `inbound`        | gerbang pengirim masuk normal                              |
| `command`        | gerbang perintah untuk callback atau tombol bercakupan     |
| `origin-subject` | aktor harus cocok dengan subjek pesan asli                 |
| `route-only`     | gerbang rute saja untuk peristiwa tepercaya bercakupan rute |
| `none`           | peristiwa internal milik plugin melewati autentikasi bersama |

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

Gunakan `channelIngressRoutes(...)` saat plugin memiliki beberapa deskriptor rute
opsional; fungsi ini memfilter cabang yang dinonaktifkan sekaligus menjaga fakta rute tetap generik
dan diurutkan berdasarkan `precedence` setiap deskriptor.

Gerbang sebutan adalah gerbang aktivasi. Sebutan yang tidak cocok menghasilkan
`admission: "skip"` agar kernel giliran tidak memproses giliran khusus pengamatan.
Sebagian besar kanal harus menempatkan aktivasi setelah gerbang pengirim dan perintah. Permukaan
obrolan publik yang harus meredam lalu lintas tanpa sebutan sebelum derau daftar izin
pengirim dapat memilih `activation.order: "before-sender"` saat bypass
perintah teks dinonaktifkan. Kanal dengan aktivasi implisit, seperti balasan dalam utas
bot, dapat meneruskan `activation.allowedImplicitMentionKinds`; proyeksi
`activationAccess.shouldBypassMention` kemudian melaporkan ketika aktivasi perintah atau implisit
melewati sebutan eksplisit.

## Penyuntingan

Nilai pengirim mentah dan entri daftar izin mentah hanya merupakan input resolver. Keduanya
tidak boleh muncul dalam status terselesaikan, keputusan, diagnostik, snapshot, atau
fakta kompatibilitas. Gunakan ID subjek buram, ID entri, ID rute, dan
ID diagnostik.

## Verifikasi

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
