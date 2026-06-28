---
read_when:
    - Mesajlaşma kanalı Plugin oluşturma veya taşıma
    - DM veya grup izin listelerini, yönlendirme kapılarını, komut yetkilendirmesini, olay yetkilendirmesini veya bahsetmeyle etkinleştirmeyi değiştirme
    - Kanal girişindeki gizlemeyi veya SDK uyumluluk sınırlarını gözden geçirme
sidebarTitle: Channel Ingress
summary: Gelen mesaj yetkilendirmesi için deneysel kanal giriş API'si
title: Kanal giriş API'si
x-i18n:
    generated_at: "2026-05-10T19:47:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f32b9b2e91a2d8cf5a8f2706d071e8daebb3954de4913646aaaaeae4c7141d
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Kanal giriş API'si

Kanal girişi, gelen kanal olayları için deneysel erişim denetimi sınırıdır. Alma yolları için `openclaw/plugin-sdk/channel-ingress-runtime` kullanın. Eski `openclaw/plugin-sdk/channel-ingress` alt yolu, üçüncü taraf pluginler için kullanımdan kaldırılmış bir uyumluluk cephesi olarak dışa aktarılmaya devam eder.

Pluginler platform bilgilerine ve yan etkilere sahiptir. Çekirdek genel politikaya sahiptir: DM/grup izin listeleri, eşleştirme deposu DM girdileri, rota geçitleri, komut geçitleri, olay kimlik doğrulaması, bahsetmeyle etkinleştirme, redakte edilmiş tanılamalar ve kabul.

## Çalışma Zamanı Çözümleyicisi

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

Etkili izin listelerini, komut sahiplerini veya komut gruplarını önceden hesaplamayın. Çözümleyici bunları ham izin listelerinden, depo geri çağrılarından, rota tanımlayıcılarından, erişim gruplarından, politikadan ve konuşma türünden türetir.

## Sonuç

Paketlenmiş pluginler modern projeksiyonları doğrudan tüketmelidir:

- `ingress`: sıralı geçit kararı ve kabul
- `senderAccess`: yalnızca gönderen/konuşma yetkilendirmesi
- `routeAccess`: rota ve rota göndereni projeksiyonu
- `commandAccess`: komut yetkilendirmesi; hiçbir komut geçidi çalışmadığında false
- `activationAccess`: bahsetme/etkinleştirme sonucu

Olay yetkilendirmesi, sıralı `ingress.graph` ve belirleyici `ingress.reasonCode` üzerinde kullanılabilir kalır; ayrı bir olay projeksiyonu yayımlanmaz.

Kullanımdan kaldırılmış üçüncü taraf SDK yardımcıları eski şekilleri dahili olarak yeniden oluşturabilir. Yeni paketlenmiş alma yolları modern sonuçları yerel DTO'lara geri çevirmemelidir.

## Erişim Grupları

`accessGroup:<name>` girdileri redakte edilmiş kalır. Çekirdek statik `message.senders` gruplarını kendisi çözer ve `resolveAccessGroupMembership` çağrısını yalnızca platform araması gerektiren dinamik gruplar için yapar. Eksik, desteklenmeyen ve başarısız gruplar kapalı şekilde başarısız olur.

## Olay Modları

| `authMode`       | Anlamı                                           |
| ---------------- | ------------------------------------------------ |
| `inbound`        | normal gelen gönderen geçitleri                  |
| `command`        | geri çağrılar veya kapsamlı düğmeler için komut geçitleri |
| `origin-subject` | aktör özgün mesaj öznesiyle eşleşmelidir         |
| `route-only`     | rota kapsamlı güvenilen olaylar için yalnızca rota geçitleri |
| `none`           | plugin sahibi dahili olaylar paylaşılan kimlik doğrulamasını atlar |

Tepkiler, düğmeler, geri çağrılar ve yerel komutlar için `mayPair: false` kullanın.

## Rotalar Ve Etkinleştirme

Oda, konu, guild, iş parçacığı veya iç içe rota politikası için rota tanımlayıcıları kullanın:

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

Bir pluginin birden çok isteğe bağlı rota tanımlayıcısı olduğunda `channelIngressRoutes(...)` kullanın; rota bilgilerini genel tutarken devre dışı dalları filtreler ve her tanımlayıcının `precedence` değerine göre sıralar.

Bahsetme geçidi bir etkinleştirme geçididir. Bahsetme kaçırılırsa `admission: "skip"` döner, böylece dönüş çekirdeği yalnızca gözlem amaçlı bir dönüşü işlemez. Çoğu kanal, etkinleştirmeyi gönderen ve komut geçitlerinden sonra bırakmalıdır. Gönderen izin listesi gürültüsünden önce bahsedilmeyen trafiği susturması gereken genel sohbet yüzeyleri, metin komutu atlaması devre dışı olduğunda `activation.order: "before-sender"` seçeneğini kullanabilir. Bot iş parçacıklarındaki yanıtlar gibi örtük etkinleştirmeye sahip kanallar `activation.allowedImplicitMentionKinds` geçebilir; yansıtılan `activationAccess.shouldBypassMention` daha sonra komut veya örtük etkinleştirmenin açık bir bahsetmeyi ne zaman atladığını bildirir.

## Redaksiyon

Ham gönderen değerleri ve ham izin listesi girdileri yalnızca çözümleyici girdisidir. Çözümlenmiş durumda, kararlarda, tanılamalarda, anlık görüntülerde veya uyumluluk bilgilerinde görünmemelidir. Opak özne kimlikleri, girdi kimlikleri, rota kimlikleri ve tanılama kimlikleri kullanın.

## Doğrulama

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
