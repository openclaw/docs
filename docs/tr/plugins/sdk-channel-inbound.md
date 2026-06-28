---
read_when:
    - Bir mesajlaşma kanalı Plugin alım yolunu oluşturuyor veya yeniden düzenliyorsunuz
    - Paylaşılan gelen bağlam oluşturma, oturum kaydı veya hazırlanmış yanıt gönderimi gerekir
    - Eski kanal tur yardımcılarını gelen/message API'lerine geçiriyorsunuz
summary: 'Kanal Pluginleri için gelen olay yardımcıları: bağlam oluşturma, paylaşılan runner orkestrasyonu, oturum kaydı ve hazırlanmış yanıt gönderimi'
title: Kanal gelen API'si
x-i18n:
    generated_at: "2026-06-28T01:04:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Kanal Plugin'leri, alma yollarını gelen ve ileti adlarıyla modellemelidir:

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

Gelen olay normalleştirme, biçimlendirme, kökler ve orkestrasyon için
`openclaw/plugin-sdk/channel-inbound` kullanın. Yerel gönderim, alındı bilgisi,
kalıcı teslim ve canlı önizleme davranışı için
`openclaw/plugin-sdk/channel-outbound` kullanın.

## Çekirdek Yardımcılar

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: normalleştirilmiş kanal bilgilerini
  istem/oturum bağlamına yansıtın. Kanalın sahip olduğu gönderen/sohbet
  meta verilerini Plugin kancası `ctx.channelContext` içine geçirmek için
  `channelContext` kullanın; kanala özgü alanlar için bu alt yoldaki
  `PluginHookChannelSenderContext` veya `PluginHookChannelChatContext` türünü
  genişletin.
- `runChannelInboundEvent(...)`: tek bir gelen platform olayı için alma,
  sınıflandırma, ön denetim, çözümleme, kaydetme, gönderme ve sonlandırma
  işlemlerini çalıştırın.
- `dispatchChannelInboundReply(...)`: zaten derlenmiş bir gelen yanıtı bir teslim
  bağdaştırıcısıyla kaydedip gönderin.

Enjekte edilen Plugin çalışma zamanı, çalışma zamanı nesnesini zaten alan
paketlenmiş/yerel kanallar için aynı üst düzey yardımcıları
`runtime.channel.inbound.*` altında sunar.

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

Uyumluluk göndericileri `dispatchChannelInboundReply(...)` girdilerini
derlemeli ve platform teslimini teslim bağdaştırıcısında tutmalıdır. Yeni
gönderim yolları ileti bağdaştırıcılarını ve kalıcı ileti yardımcılarını tercih
etmelidir.

## Geçiş

Eski `runtime.channel.turn.*` çalışma zamanı takma adları kaldırıldı. Şunları
kullanın:

- Ham gelen olaylar için `runtime.channel.inbound.run(...)`.
- Derlenmiş yanıt bağlamları için `runtime.channel.inbound.dispatchReply(...)`.
- Gelen bağlam yükleri için `runtime.channel.inbound.buildContext(...)`.
- Yalnızca kendi gönderim kapanışını zaten derleyen, kanalın sahip olduğu
  hazırlanmış gönderim yolları için `runtime.channel.inbound.runPreparedReply(...)`.

Yeni Plugin kodu `turn` adlı kanal API'leri eklememelidir. Model veya agent
turn söz dağarcığını agent/sağlayıcı kodu içinde tutun; kanal Plugin'leri gelen,
ileti, teslim ve yanıt terimlerini kullanır.
