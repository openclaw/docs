---
read_when:
    - Bir mesajlaşma kanalı plugin'i oluşturma veya taşıma
    - DM veya grup izin listelerini, yönlendirme geçitlerini, komut yetkilendirmesini, olay yetkilendirmesini ya da bahsetmeyle etkinleştirmeyi değiştirme
    - Kanal girişindeki redaksiyon veya SDK uyumluluk sınırlarını inceleme
sidebarTitle: Channel Ingress
summary: Gelen mesaj yetkilendirmesi için deneysel kanal giriş API'si
title: Kanal giriş API'si
x-i18n:
    generated_at: "2026-07-12T12:04:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Kanal girişi, gelen kanal olayları için deneysel erişim denetimi sınırıdır.
Plugin'ler platform bilgilerine ve yan etkilere; çekirdek ise genel politikaya
sahiptir: DM/grup izin listeleri, eşleştirme deposundaki DM girdileri, rota
geçitleri, komut geçitleri, olay yetkilendirmesi, bahsetmeyle etkinleştirme,
gizlenmiş tanılama bilgileri ve kabul.

Yeni alma yolları için `openclaw/plugin-sdk/channel-ingress-runtime` kullanın.
Eski `openclaw/plugin-sdk/channel-ingress` alt yolu, üçüncü taraf Plugin'ler
için kullanımdan kaldırılmış bir uyumluluk cephesi olarak dışa aktarılmaya devam
eder.

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

Geçerli izin listelerini, komut sahiplerini veya komut gruplarını önceden
hesaplamayın. Çözümleyici bunları ham izin listelerinden, depo geri
çağırımlarından, rota tanımlayıcılarından, erişim gruplarından, politikadan ve
konuşma türünden türetir.

## Sonuç

Paketle birlikte gelen Plugin'ler modern izdüşümleri doğrudan kullanmalıdır:

| Alan               | Anlamı                                                               |
| ------------------ | -------------------------------------------------------------------- |
| `ingress`          | sıralı geçit kararı ve kabul                                          |
| `senderAccess`     | yalnızca gönderen/konuşma yetkilendirmesi                             |
| `routeAccess`      | rota ve rota göndereni izdüşümü                                      |
| `commandAccess`    | komut yetkilendirmesi; komut geçidi çalışmadığında `requested: false` |
| `activationAccess` | bahsetme/etkinleştirme sonucu                                        |

Olay yetkilendirmesine sıralı `ingress.graph` ve belirleyici
`ingress.reasonCode` üzerinden erişilmeye devam eder; ayrı bir olay izdüşümü
üretilmez.

Kullanımdan kaldırılmış üçüncü taraf SDK yardımcıları eski biçimleri dahili
olarak yeniden oluşturabilir. Paketle birlikte gelen yeni alma yolları, modern
sonuçları yeniden yerel DTO'lara dönüştürmemelidir.

## Erişim grupları

`accessGroup:<name>` girdileri gizlenmiş olarak kalır. Çekirdek, statik
`message.senders` gruplarını kendisi çözümler ve yalnızca platformda arama
gerektiren dinamik gruplar için `resolveAccessGroupMembership` çağrısı yapar.
Eksik, desteklenmeyen ve başarısız gruplar erişimi kapalı tutar.

## Olay kipleri

| `authMode`       | Anlamı                                                         |
| ---------------- | -------------------------------------------------------------- |
| `inbound`        | normal gelen gönderen geçitleri                                |
| `command`        | geri çağırımlar veya kapsamlı düğmeler için komut geçitleri    |
| `origin-subject` | aktör, özgün mesajın öznesiyle eşleşmelidir                    |
| `route-only`     | rota kapsamındaki güvenilir olaylar için yalnızca rota geçitleri |
| `none`           | Plugin'e ait dahili olaylar paylaşılan yetkilendirmeyi atlar   |

Tepkiler, düğmeler, geri çağırımlar ve yerel komutlar için `mayPair: false`
kullanın.

## Rotalar ve etkinleştirme

Oda, konu, sunucu, ileti dizisi veya iç içe rota politikası için rota
tanımlayıcılarını kullanın:

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

Bir Plugin'in birden fazla isteğe bağlı rota tanımlayıcısı olduğunda
`channelIngressRoutes(...)` kullanın; bu işlev rota bilgilerini genel tutup her
tanımlayıcının `precedence` değerine göre sıralarken devre dışı bırakılmış
dalları filtreler.

Bahsetme geçidi bir etkinleştirme geçididir. Bahsetme eşleşmezse
`admission: "skip"` döndürülür; böylece tur çekirdeği yalnızca gözlem amaçlı
bir turu işlemez. Çoğu kanal, etkinleştirmeyi gönderen ve komut geçitlerinden
sonra bırakmalıdır. Gönderen izin listesi gürültüsünden önce bahsedilmemiş
trafiği susturması gereken herkese açık sohbet yüzeyleri, metin komutu atlaması
devre dışı olduğunda `activation.order: "before-sender"` seçeneğini
etkinleştirebilir. Bot ileti dizilerindeki yanıtlar gibi örtük etkinleştirmeye
sahip kanallar `activation.allowedImplicitMentionKinds` iletebilir; bu durumda
izdüşümü oluşturulan `activationAccess.shouldBypassMention`, komut veya örtük
etkinleştirme açık bir bahsetmeyi atladığında bunu bildirir.

## Gizleme

Ham gönderen değerleri ve ham izin listesi girdileri yalnızca çözümleyici
girdisidir. Bunlar çözümlenmiş durumda, kararlarda, tanılama bilgilerinde, anlık
görüntülerde veya uyumluluk bilgilerinde görünmemelidir. Belirsizleştirilmiş
özne kimlikleri, girdi kimlikleri, rota kimlikleri ve tanılama kimlikleri
kullanın.

## Doğrulama

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
