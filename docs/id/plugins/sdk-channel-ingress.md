---
read_when:
    - Membangun atau memigrasikan plugin kanal perpesanan
    - Mengubah daftar izin DM atau grup, gerbang rute, autentikasi perintah, autentikasi peristiwa, atau aktivasi penyebutan
    - Meninjau redaksi ingress kanal atau batas kompatibilitas SDK
sidebarTitle: Channel Ingress
summary: API ingress kanal eksperimental untuk otorisasi pesan masuk
title: API masuk kanal
x-i18n:
    generated_at: "2026-07-19T05:04:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 60feecb7bcf203cf37d2543a7855e89b5bfb2eb9d8263d804219e140facb8fc6
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Ingress channel adalah batas kontrol akses eksperimental untuk event channel
masuk. Plugin memiliki fakta platform dan efek samping; core memiliki
kebijakan generik: daftar izin DM/grup, entri DM penyimpanan pairing, gate rute,
gate perintah, autentikasi event, aktivasi sebutan, diagnostik yang disunting, dan
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

Jangan melakukan prakomputasi daftar izin efektif, pemilik perintah, atau grup perintah.
Resolver menurunkannya dari daftar izin mentah, callback penyimpanan, deskriptor
rute, grup akses, kebijakan, dan jenis percakapan.

## Hasil

Plugin bawaan harus menggunakan proyeksi modern secara langsung:

| Bidang              | Arti                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | keputusan gate berurutan dan penerimaan                            |
| `senderAccess`     | hanya otorisasi pengirim/percakapan                                |
| `routeAccess`      | proyeksi rute dan pengirim rute                                    |
| `commandAccess`    | otorisasi perintah; `requested: false` jika tidak ada gate perintah yang dijalankan |
| `activationAccess` | hasil sebutan/aktivasi                                              |

Otorisasi event tetap tersedia pada `ingress.graph` yang berurutan dan
`ingress.reasonCode` yang menentukan; tidak ada proyeksi event terpisah yang dihasilkan.

Helper SDK pihak ketiga yang tidak digunakan lagi dapat membangun ulang bentuk lama secara internal. Jalur
penerimaan bawaan baru tidak boleh menerjemahkan hasil modern kembali menjadi
DTO lokal.

## Grup akses

Entri `accessGroup:<name>` tetap disunting. Core menyelesaikan sendiri grup
`message.senders` statis dan memanggil `resolveAccessGroupMembership` hanya
untuk grup dinamis yang memerlukan pencarian platform. Grup yang tidak ada, tidak didukung, dan
gagal akan ditolak secara tertutup.

## Mode event

| `authMode`       | Arti                                             |
| ---------------- | ------------------------------------------------ |
| `inbound`        | gate pengirim masuk normal                       |
| `command`        | gate perintah untuk callback atau tombol bercakupan |
| `origin-subject` | aktor harus cocok dengan subjek pesan asli       |
| `route-only`     | hanya gate rute untuk event tepercaya bercakupan rute |
| `none`           | event internal milik plugin melewati autentikasi bersama |

Gunakan `mayPair: false` untuk reaksi, tombol, callback, dan perintah native.

## Rute dan aktivasi

Gunakan deskriptor rute untuk kebijakan ruangan, topik, guild, utas, atau rute bertingkat:

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
opsional; ini memfilter cabang yang dinonaktifkan sambil mempertahankan fakta rute tetap generik
dan diurutkan berdasarkan `precedence` setiap deskriptor.

Gate sebutan adalah gate aktivasi. Sebutan yang tidak cocok mengembalikan
`admission: "skip"` agar kernel giliran tidak memproses giliran hanya-observasi.
Sebagian besar channel harus menempatkan aktivasi setelah gate pengirim dan perintah. Permukaan
obrolan publik yang harus meredam lalu lintas tanpa sebutan sebelum kebisingan daftar izin
pengirim dapat memilih `activation.order: "before-sender"` saat bypass
perintah teks dinonaktifkan. Channel dengan aktivasi implisit, seperti balasan dalam
utas bot, menyelesaikan `channels.defaults.implicitMentions` beserta override channel dan akun
dengan `resolveChannelImplicitMentions(...)`, lalu meneruskan hasilnya sebagai
`activation.implicitMentions`. `activationAccess.shouldBypassMention` yang diproyeksikan
melaporkan saat perintah atau aktivasi implisit melewati
sebutan eksplisit.

## Penyuntingan

Nilai mentah pengirim dan entri mentah daftar izin hanya merupakan input resolver. Nilai tersebut
tidak boleh muncul dalam status terselesaikan, keputusan, diagnostik, snapshot, atau
fakta kompatibilitas. Gunakan ID subjek, ID entri, ID rute, dan
ID diagnostik yang opak.

## Verifikasi

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
