---
read_when:
    - Yazıyor göstergesinin davranışını veya varsayılanlarını değiştirme
summary: OpenClaw yazıyor göstergelerini ne zaman gösterir ve bunları nasıl ayarlayabilirsiniz
title: Yazıyor göstergeleri
x-i18n:
    generated_at: "2026-05-10T19:34:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e26b4008f165527098ffcbf9c39ee7179149063842cc5c6aacb5b7c606eedc26
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Yazıyor göstergeleri, bir çalıştırma etkin olduğu sürece sohbet kanalına gönderilir. Yazmanın **ne zaman** başlayacağını denetlemek için
`agents.defaults.typingMode`, **ne sıklıkta** yenileneceğini denetlemek için
`typingIntervalSeconds` kullanın.

## Varsayılanlar

`agents.defaults.typingMode` **ayarlanmamışsa**, OpenClaw eski davranışı korur:

- **Doğrudan sohbetler**: model döngüsü başladığında yazma hemen başlar.
- **Bahsetme içeren grup sohbetleri**: yazma hemen başlar.
- **Bahsetme içermeyen grup sohbetleri**: yazma yalnızca mesaj metni akmaya başladığında başlar.
- **Heartbeat çalıştırmaları**: çözümlenen Heartbeat hedefi yazma destekleyen bir sohbetse ve yazma devre dışı değilse,
  Heartbeat çalıştırması başladığında yazma başlar.

## Modlar

`agents.defaults.typingMode` değerini şunlardan birine ayarlayın:

- `never` - hiçbir zaman yazıyor göstergesi gösterilmez.
- `instant` - çalıştırma daha sonra yalnızca sessiz yanıt belirtecini döndürse bile
  **model döngüsü başlar başlamaz** yazmaya başla.
- `thinking` - **ilk akıl yürütme deltası** geldiğinde yazmaya başla (çalıştırma için
  `reasoningLevel: "stream"` gerektirir).
- `message` - **ilk sessiz olmayan metin deltası** geldiğinde yazmaya başla
  (`NO_REPLY` sessiz belirtecini yok sayar).

"Ne kadar erken tetiklenir" sırası:
`never` → `message` → `thinking` → `instant`

## Yapılandırma

Aracı düzeyindeki varsayılanı ayarlayın:

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

Oturum başına modu veya ritmi geçersiz kılın:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Notlar

- Tüm yük tam olarak sessiz belirteç olduğunda (örneğin `NO_REPLY` / `no_reply`,
  büyük/küçük harfe duyarsız olarak eşleştirilir), `message` modu yalnızca sessiz yanıtlarda yazmayı göstermez.
- `thinking` yalnızca çalıştırma akıl yürütmeyi akış olarak yayınlıyorsa tetiklenir (`reasoningLevel: "stream"`).
  Model akıl yürütme deltaları yaymazsa yazma başlamaz.
- Heartbeat yazması, çözümlenen teslim hedefi için bir canlılık sinyalidir. `message` veya `thinking`
  akış zamanlamasını izlemek yerine Heartbeat çalıştırmasının başlangıcında başlar.
  Devre dışı bırakmak için `typingMode: "never"` ayarlayın.
- Heartbeat'ler `target: "none"` olduğunda, hedef çözümlenemediğinde, Heartbeat için sohbet teslimi devre dışı olduğunda
  veya kanal yazmayı desteklemediğinde yazmayı göstermez.
- `typingIntervalSeconds`, başlangıç zamanını değil **yenileme ritmini** denetler.
  Varsayılan 6 saniyedir.

## İlgili

<CardGroup cols={2}>
  <Card title="Varlık" href="/tr/concepts/presence" icon="signal">
    Gateway'in bağlı istemcileri nasıl izlediği ve bunları macOS Örnekler sekmesinde nasıl gösterdiği.
  </Card>
  <Card title="Akış ve parçalama" href="/tr/concepts/streaming" icon="bars-staggered">
    Giden akış davranışı, parça sınırları ve kanala özgü teslim.
  </Card>
</CardGroup>
