---
read_when:
    - Yazıyor göstergesi davranışını veya varsayılanlarını değiştirme
summary: OpenClaw'ın yazıyor göstergelerini ne zaman gösterdiği ve bunların nasıl ayarlanacağı
title: Yazıyor göstergeleri
x-i18n:
    generated_at: "2026-04-24T09:07:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f5c3bb79cf87f79db5336978b877f4a01025f59c9e822ab66198f00907123f
    source_path: concepts/typing-indicators.md
    workflow: 15
---

Yazıyor göstergeleri, bir çalıştırma etkin durumdayken sohbet kanalına gönderilir. Yazmanın **ne zaman** başlayacağını denetlemek için `agents.defaults.typingMode`, **ne sıklıkla** yenileneceğini denetlemek için `typingIntervalSeconds` kullanın.

## Varsayılanlar

`agents.defaults.typingMode` **ayarlı değilse**, OpenClaw eski davranışı korur:

- **Doğrudan sohbetler**: model döngüsü başlar başlamaz yazıyor durumu hemen başlar.
- **Mention içeren grup sohbetleri**: yazıyor durumu hemen başlar.
- **Mention içermeyen grup sohbetleri**: yazıyor durumu yalnızca mesaj metni akmaya başladığında başlar.
- **Heartbeat çalıştırmaları**: çözümlenen Heartbeat hedefi yazma destekleyen bir sohbetse ve yazma devre dışı değilse, Heartbeat çalıştırması başladığında yazıyor durumu başlar.

## Modlar

`agents.defaults.typingMode` değerini şunlardan biri olarak ayarlayın:

- `never` — hiçbir zaman yazıyor göstergesi yok.
- `instant` — çalıştırma daha sonra yalnızca sessiz yanıt belirtecini döndürse bile, yazıyor durumu **model döngüsü başlar başlamaz** başlar.
- `thinking` — yazıyor durumu **ilk akıl yürütme delta'sında** başlar (`reasoningLevel: "stream"` gerektirir).
- `message` — yazıyor durumu **sessiz olmayan ilk metin delta'sında** başlar (`NO_REPLY` sessiz belirtecini yok sayar).

“Tetiklenme erkenciliği” sırası:
`never` → `message` → `thinking` → `instant`

## Yapılandırma

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Modu veya yenileme sıklığını oturum başına geçersiz kılabilirsiniz:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Notlar

- `message` modu, tüm payload tam sessiz belirteç olduğunda (örneğin `NO_REPLY` / `no_reply`, büyük/küçük harf duyarsız eşleşir) yalnızca sessiz yanıtlarda yazıyor göstergesi göstermez.
- `thinking`, yalnızca çalıştırma akıl yürütmeyi akıttığında tetiklenir (`reasoningLevel: "stream"`).
  Model akıl yürütme delta'ları yaymazsa yazıyor durumu başlamaz.
- Heartbeat yazıyor durumu, çözümlenen teslim hedefi için bir canlılık sinyalidir. `message` veya `thinking` akış zamanlamasını izlemek yerine Heartbeat çalıştırmasının başlangıcında başlar. Devre dışı bırakmak için `typingMode: "never"` ayarlayın.
- Heartbeat'ler, `target: "none"` olduğunda, hedef çözümlenemediğinde, Heartbeat için sohbet teslimi devre dışı bırakıldığında veya kanal yazıyor göstergesini desteklemediğinde yazıyor durumu göstermez.
- `typingIntervalSeconds`, başlangıç zamanını değil **yenileme sıklığını** denetler.
  Varsayılan 6 saniyedir.

## İlgili

- [Presence](/tr/concepts/presence)
- [Akış ve parçalama](/tr/concepts/streaming)
