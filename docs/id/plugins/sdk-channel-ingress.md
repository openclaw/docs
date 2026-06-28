---
read_when:
    - Membangun atau memigrasikan Plugin kanal perpesanan
    - Mengubah daftar izin DM atau grup, gerbang rute, otorisasi perintah, otorisasi peristiwa, atau aktivasi penyebutan
    - Meninjau penyensoran ingress saluran atau batas kompatibilitas SDK
sidebarTitle: Channel Ingress
summary: API ingress kanal eksperimental untuk otorisasi pesan masuk
title: API ingress saluran
x-i18n:
    generated_at: "2026-05-10T19:46:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f32b9b2e91a2d8cf5a8f2706d071e8daebb3954de4913646aaaaeae4c7141d
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# API ingress kanal

Ingress kanal adalah batas kontrol akses eksperimental untuk event kanal masuk. Gunakan `openclaw/plugin-sdk/channel-ingress-runtime` untuk jalur penerimaan.
Subpath lama `openclaw/plugin-sdk/channel-ingress` tetap diekspor sebagai facade kompatibilitas yang tidak digunakan lagi untuk plugin pihak ketiga.

Plugin memiliki fakta platform dan efek samping. Core memiliki kebijakan generik: allowlist DM/grup, entri DM pairing-store, gate rute, gate perintah, autentikasi event, aktivasi mention, diagnostik yang disunting, dan admisi.

## Resolver Runtime

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

Jangan menghitung allowlist efektif, pemilik perintah, atau grup perintah terlebih dahulu. Resolver menurunkannya dari allowlist mentah, callback store, deskriptor rute, grup akses, kebijakan, dan jenis percakapan.

## Hasil

Plugin bawaan sebaiknya memakai proyeksi modern secara langsung:

- `ingress`: keputusan gate dan admisi yang terurut
- `senderAccess`: hanya otorisasi pengirim/percakapan
- `routeAccess`: proyeksi rute dan pengirim rute
- `commandAccess`: otorisasi perintah; false saat tidak ada gate perintah yang berjalan
- `activationAccess`: hasil mention/aktivasi

Otorisasi event tetap tersedia pada `ingress.graph` yang terurut dan `ingress.reasonCode` yang menentukan; tidak ada proyeksi event terpisah yang dipancarkan.

Helper SDK pihak ketiga yang tidak digunakan lagi dapat membangun ulang bentuk lama secara internal. Jalur penerimaan bawaan baru sebaiknya tidak menerjemahkan hasil modern kembali menjadi DTO lokal.

## Grup Akses

Entri `accessGroup:<name>` tetap disunting. Core menyelesaikan grup statis `message.senders` sendiri dan memanggil `resolveAccessGroupMembership` hanya untuk grup dinamis yang memerlukan lookup platform. Grup yang hilang, tidak didukung, dan gagal akan gagal tertutup.

## Mode Event

| `authMode`       | Makna                                            |
| ---------------- | ------------------------------------------------ |
| `inbound`        | gate pengirim masuk normal                       |
| `command`        | gate perintah untuk callback atau tombol berscope |
| `origin-subject` | aktor harus cocok dengan subjek pesan asli       |
| `route-only`     | hanya gate rute untuk event tepercaya berscope rute |
| `none`           | event internal milik plugin melewati auth bersama |

Gunakan `mayPair: false` untuk reaksi, tombol, callback, dan perintah native.

## Rute Dan Aktivasi

Gunakan deskriptor rute untuk kebijakan room, topik, guild, thread, atau rute bersarang:

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

Gunakan `channelIngressRoutes(...)` saat plugin memiliki beberapa deskriptor rute opsional; ini memfilter cabang yang dinonaktifkan sambil menjaga fakta rute tetap generik dan diurutkan berdasarkan `precedence` tiap deskriptor.

Gate mention adalah gate aktivasi. Mention yang luput mengembalikan `admission: "skip"` sehingga kernel giliran tidak memproses giliran hanya-observasi. Sebagian besar kanal sebaiknya membiarkan aktivasi setelah gate pengirim dan perintah. Permukaan chat publik yang harus membisukan traffic yang tidak di-mention sebelum derau allowlist pengirim dapat memilih `activation.order: "before-sender"` saat bypass perintah teks dinonaktifkan. Kanal dengan aktivasi implisit, seperti balasan di thread bot, dapat meneruskan `activation.allowedImplicitMentionKinds`; `activationAccess.shouldBypassMention` yang diproyeksikan kemudian melaporkan saat aktivasi perintah atau implisit melewati mention eksplisit.

## Penyuntingan

Nilai pengirim mentah dan entri allowlist mentah hanya merupakan input resolver. Nilai tersebut tidak boleh muncul dalam state terselesaikan, keputusan, diagnostik, snapshot, atau fakta kompatibilitas. Gunakan id subjek, id entri, id rute, dan id diagnostik yang opak.

## Verifikasi

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
