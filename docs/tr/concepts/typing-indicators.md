---
read_when:
    - Yazıyor göstergesi davranışını veya varsayılanlarını değiştirme
summary: OpenClaw yazıyor göstergelerini ne zaman gösterir ve bunları nasıl ayarlarsınız
title: Yazıyor göstergeleri
x-i18n:
    generated_at: "2026-06-28T00:31:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa76889d0f6262f1092abefee02aee8fe944651dc89d3a697ccc86e16558ed60
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Yazma göstergeleri, bir çalıştırma etkinken sohbet kanalına gönderilir. Yazmanın **ne zaman** başlayacağını denetlemek için
`agents.defaults.typingMode`, **ne sıklıkta** yenileneceğini denetlemek için
`typingIntervalSeconds` kullanın.

## Varsayılanlar

`agents.defaults.typingMode` **ayarlanmamışsa**, OpenClaw eski davranışı korur:

- **Doğrudan sohbetler**: model döngüsü başlar başlamaz yazma başlar.
- **Bahsetme içeren grup sohbetleri**: yazma hemen başlar.
- **Bahsetme içermeyen grup sohbetleri**: kabul edilen çalıştırmada harness yürütme etkinliği veya ileti metni gibi
  kullanıcıya görünür etkinlik olduğunda yazma başlar.
- **Heartbeat çalıştırmaları**: çözümlenen Heartbeat hedefi yazmayı destekleyen bir sohbetse ve yazma devre dışı değilse,
  Heartbeat çalıştırması başladığında yazma başlar.

## Modlar

`agents.defaults.typingMode` değerini şunlardan birine ayarlayın:

- `never` - hiçbir zaman yazma göstergesi gösterilmez.
- `instant` - çalıştırma daha sonra yalnızca sessiz yanıt belirtecini döndürse bile,
  **model döngüsü başlar başlamaz** yazmaya başla.
- `thinking` - tur kabul edildikten sonra **ilk akıl yürütme deltasıyla** veya etkin
  harness yürütmesiyle yazmaya başla.
- `message` - etkin harness yürütmesi veya sessiz olmayan metin deltası gibi
  **ilk kullanıcıya görünür yanıt etkinliğiyle** yazmaya başla. `NO_REPLY` gibi
  sessiz yanıt belirteçleri metin etkinliği sayılmaz.

"Ne kadar erken tetiklendiği" sırası:
`never` → `message`/`thinking` → `instant`

## Yapılandırma

Ajan düzeyi varsayılanı ayarlayın:

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

Modu veya tempoyu oturum başına geçersiz kılın:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Notlar

- `message` modu sessiz yanıt belirteçlerinden başlamaz, ancak etkin yürütme
  herhangi bir asistan metni kullanılabilir olmadan önce yine de yazmayı gösterebilir.
- `thinking`, akışlı akıl yürütmeye (`reasoningLevel: "stream"`) hâlâ tepki verir
  ve akıl yürütme deltaları gelmeden önce etkin yürütmeden de başlayabilir.
- Heartbeat yazması, çözümlenen teslim hedefi için bir canlılık sinyalidir.
  `message` veya `thinking` akış zamanlamasını izlemek yerine Heartbeat çalıştırması başlangıcında
  başlar. Devre dışı bırakmak için `typingMode: "never"` ayarlayın.
- Heartbeat'ler `target: "none"` olduğunda, hedef çözümlenemediğinde,
  Heartbeat için sohbet teslimi devre dışı olduğunda veya kanal yazmayı desteklemediğinde
  yazma göstermez.
- `typingIntervalSeconds`, başlangıç zamanını değil **yenileme temposunu** denetler.
  Varsayılan 6 saniyedir.

## İlgili

<CardGroup cols={2}>
  <Card title="Presence" href="/tr/concepts/presence" icon="signal">
    Gateway'in bağlı istemcileri nasıl izlediği ve bunları macOS Örnekler sekmesinde nasıl gösterdiği.
  </Card>
  <Card title="Streaming and chunking" href="/tr/concepts/streaming" icon="bars-staggered">
    Giden akış davranışı, parça sınırları ve kanala özgü teslim.
  </Card>
</CardGroup>
