---
read_when:
    - Bir mesajlaşma kanalı plugini oluşturma veya taşıma
    - DM veya grup izin listelerini, yönlendirme geçitlerini, komut kimlik doğrulamasını, olay kimlik doğrulamasını ya da bahsetmeyle etkinleştirmeyi değiştirme
    - Kanal girişindeki redaksiyon veya SDK uyumluluk sınırlarını inceleme
sidebarTitle: Channel Ingress
summary: Gelen ileti yetkilendirmesi için deneysel kanal giriş API'si
title: Kanal giriş API'si
x-i18n:
    generated_at: "2026-07-16T17:28:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3339af82a5dc3572d581f13960286f8b9ac933e7f491e8c4e0daba093caccc73
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Kanal girişi, gelen kanal olayları için deneysel erişim denetimi sınırıdır.
Plugin'ler platform olgularının ve yan etkilerin sahibidir; çekirdek ise genel
politikaya sahiptir: DM/grup izin listeleri, eşleştirme deposundaki DM girdileri, rota kapıları,
komut kapıları, olay yetkilendirmesi, bahsetmeyle etkinleştirme, hassas verileri ayıklanmış tanılama ve
kabul.

Alım yolları için `openclaw/plugin-sdk/channel-ingress-runtime` kullanın.

## Çalışma zamanı çözümleyicisi

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

Etkin izin listelerini, komut sahiplerini veya komut gruplarını önceden hesaplamayın.
Çözümleyici bunları ham izin listelerinden, depo geri çağırımlarından, rota
tanımlayıcılarından, erişim gruplarından, politikadan ve konuşma türünden türetir.

## Sonuç

Birlikte gelen Plugin'ler modern izdüşümleri doğrudan tüketmelidir:

| Alan               | Anlamı                                                             |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | sıralı kapı kararı ve kabul                                        |
| `senderAccess`     | yalnızca gönderen/konuşma yetkilendirmesi                           |
| `routeAccess`      | rota ve rota göndereni izdüşümü                                    |
| `commandAccess`    | komut yetkilendirmesi; komut kapısı çalışmadığında `requested: false` |
| `activationAccess` | bahsetme/etkinleştirme sonucu                                      |

Olay yetkilendirmesi, sıralı `ingress.graph` ve belirleyici
`ingress.reasonCode` üzerinde kullanılabilir kalır; ayrı bir olay izdüşümü üretilmez.

Kullanımdan kaldırılmış üçüncü taraf SDK yardımcıları eski biçimleri dahili olarak yeniden oluşturabilir. Birlikte
gelen yeni alım yolları, modern sonuçları yeniden yerel
DTO'lara dönüştürmemelidir.

## Erişim grupları

`accessGroup:<name>` girdilerindeki hassas veriler ayıklanmış olarak kalır. Çekirdek, statik
`message.senders` gruplarını kendisi çözümler ve `resolveAccessGroupMembership` öğesini yalnızca
platform araması gerektiren dinamik gruplar için çağırır. Eksik, desteklenmeyen ve
başarısız gruplar erişimi kapalı tutar.

## Olay modları

| `authMode`       | Anlamı                                           |
| ---------------- | ------------------------------------------------ |
| `inbound`        | normal gelen gönderen kapıları                   |
| `command`        | geri çağırmalar veya kapsamlı düğmeler için komut kapıları |
| `origin-subject` | aktör, özgün ileti öznesiyle eşleşmelidir         |
| `route-only`     | yalnızca rota kapsamlı güvenilir olaylar için rota kapıları |
| `none`           | Plugin'e ait dahili olaylar paylaşılan yetkilendirmeyi atlar |

Tepkiler, düğmeler, geri çağırmalar ve yerel komutlar için `mayPair: false` kullanın.

## Rotalar ve etkinleştirme

Oda, konu, sunucu, ileti dizisi veya iç içe rota politikası için rota tanımlayıcılarını kullanın:

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

Bir Plugin'de isteğe bağlı birden fazla rota tanımlayıcısı olduğunda `channelIngressRoutes(...)` kullanın;
bu, rota olgularını genel tutarken devre dışı dalları filtreler
ve her tanımlayıcının `precedence` değerine göre sıralar.

Bahsetme kapısı bir etkinleştirme kapısıdır. Bahsetme eşleşmezse
`admission: "skip"` döndürülür; böylece tur çekirdeği yalnızca gözlem amaçlı bir turu işlemez.
Çoğu kanal, etkinleştirmeyi gönderen ve komut kapılarından sonra bırakmalıdır. Gönderen izin listesi
gürültüsünden önce bahsedilmemiş trafiği susturması gereken herkese açık
sohbet yüzeyleri, metin komutu atlaması devre dışıyken
`activation.order: "before-sender"` seçeneğini etkinleştirebilir. Bot
ileti dizilerindeki yanıtlar gibi örtük etkinleştirmeye sahip kanallar `activation.allowedImplicitMentionKinds` iletebilir;
izdüşürülen `activationAccess.shouldBypassMention` daha sonra komutun veya örtük
etkinleştirmenin açık bir bahsetmeyi ne zaman atladığını bildirir.

## Hassas verilerin ayıklanması

Ham gönderen değerleri ve ham izin listesi girdileri yalnızca çözümleyici girdisidir. Bunlar
çözümlenmiş durumda, kararlarda, tanılamada, anlık görüntülerde veya
uyumluluk olgularında görünmemelidir. Opak özne kimliklerini, girdi kimliklerini, rota kimliklerini ve
tanılama kimliklerini kullanın.

## Doğrulama

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
