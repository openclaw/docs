---
read_when:
    - Bir mesajlaşma kanalı Plugin'inin alma yolunu oluşturuyor veya yeniden düzenliyorsunuz
    - Paylaşılan gelen bağlam oluşturma, oturum kaydı veya hazırlanmış yanıt gönderimi gerekir
    - Eski kanal ileti yardımcılarını gelen/mesaj API'lerine geçiriyorsunuz
summary: 'Kanal Pluginleri için gelen olay yardımcıları: bağlam oluşturma, paylaşılan çalıştırıcı orkestrasyonu, oturum kaydı ve hazırlanmış yanıt gönderimi'
title: Kanal gelen API'si
x-i18n:
    generated_at: "2026-07-12T12:35:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Kanal alma yolları tek bir akışı izler:

```text
platform olayı -> gelen olgu/bağlam -> aracı yanıtı -> ileti teslimi
```

Gelen olay normalleştirme, biçimlendirme, kökler ve orkestrasyon için `openclaw/plugin-sdk/channel-inbound` kullanın.
Yerel gönderim, alındı bilgisi, kalıcı teslimat ve canlı önizleme davranışı için
`openclaw/plugin-sdk/channel-outbound` kullanın.

## Temel yardımcılar

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: normalleştirilmiş kanal olgularını
  istem/oturum bağlamına yansıtır. Kanalın sahip olduğu gönderici/sohbet meta verilerini,
  Plugin kancalarının `ctx.channelContext` olarak gördüğü `channelContext`
  üzerinden iletin. Kanala özgü alanlar için bu alt yoldaki
  `PluginHookChannelSenderContext` veya `PluginHookChannelChatContext` türünü genişletin.
- `runChannelInboundEvent(...)`: tek bir gelen platform olayı için içe alma,
  sınıflandırma, ön kontrol, çözümleme, kaydetme, dağıtma ve sonlandırma işlemlerini yürütür.
- `dispatchChannelInboundReply(...)`: önceden oluşturulmuş bir gelen yanıtı
  teslimat bağdaştırıcısıyla kaydeder ve dağıtır.

Eklenen Plugin çalışma zamanı nesnesini zaten alan paketlenmiş/yerel kanallar,
bu alt yolu doğrudan içe aktarmak yerine aynı yardımcıları
`runtime.channel.inbound.*` altında çağırabilir:

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

Platform teslimatını teslimat bağdaştırıcısında tutan uyumluluk dağıtıcıları için
`dispatchChannelInboundReply(...)` girdilerini oluşturun. Yeni gönderim yolları
bunun yerine `channel-outbound` içindeki ileti bağdaştırıcılarını ve kalıcı ileti
yardımcılarını kullanmalıdır.

## Geçiş

`runtime.channel.turn.*` çalışma zamanı diğer adları kaldırıldı. Şunları kullanın:

- Ham gelen olaylar için `runtime.channel.inbound.run(...)`.
- Oluşturulmuş yanıt bağlamları için `runtime.channel.inbound.dispatchReply(...)`.
- Gelen bağlam yükleri için `runtime.channel.inbound.buildContext(...)`.
- Yalnızca kendi dağıtım kapanışını zaten oluşturan, kanala ait hazırlanmış
  dağıtım yolları için kullanımdan kaldırılmış `runtime.channel.inbound.runPreparedReply(...)`.

Yeni Plugin kodu, `turn` adlı kanal API'leri sunmamalıdır. Model veya
aracı turu terminolojisini aracı/sağlayıcı kodunda tutun; kanal Pluginleri gelen,
ileti, teslimat ve yanıt terimlerini kullanır.
