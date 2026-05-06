---
read_when:
    - Yazıyor göstergesinin davranışını veya varsayılanlarını değiştirme
summary: OpenClaw'un yazma göstergelerini ne zaman gösterdiği ve bunların nasıl ayarlanacağı
title: Yazma göstergeleri
x-i18n:
    generated_at: "2026-05-06T09:10:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59ee89a2f382b185e520fea178cf1860cbc4cfb8257c3b0ae7552fa4b1c79ef3
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Yazıyor göstergeleri, bir çalışma etkin olduğu sürece sohbet kanalına gönderilir. Yazmanın **ne zaman** başlayacağını denetlemek için
`agents.defaults.typingMode`, **ne sıklıkla** yenileneceğini denetlemek için ise `typingIntervalSeconds`
kullanın.

## Varsayılanlar

`agents.defaults.typingMode` **ayarlanmamış** olduğunda OpenClaw eski davranışı korur:

- **Doğrudan sohbetler**: model döngüsü başlar başlamaz yazıyor göstergesi başlar.
- **Bahsetme içeren grup sohbetleri**: yazıyor göstergesi hemen başlar.
- **Bahsetme içermeyen grup sohbetleri**: yazıyor göstergesi yalnızca mesaj metni akışa başladığında başlar.
- **Heartbeat çalışmaları**: çözümlenen Heartbeat hedefi yazıyor göstergesini destekleyen bir sohbetse ve yazıyor göstergesi devre dışı bırakılmamışsa, Heartbeat çalışması başladığında yazıyor göstergesi başlar.

## Modlar

`agents.defaults.typingMode` değerini şunlardan birine ayarlayın:

- `never` - hiçbir zaman yazıyor göstergesi yoktur.
- `instant` - çalışma daha sonra yalnızca sessiz yanıt token’ını döndürse bile, **model döngüsü başlar başlamaz** yazıyor göstergesini başlatır.
- `thinking` - **ilk akıl yürütme deltasıyla** yazıyor göstergesini başlatır (çalışma için
  `reasoningLevel: "stream"` gerektirir).
- `message` - **ilk sessiz olmayan metin deltasıyla** yazıyor göstergesini başlatır (`NO_REPLY` sessiz token’ını yok sayar).

"Ne kadar erken tetiklenir" sırası:
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

Modu veya ritmi oturum başına geçersiz kılabilirsiniz:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Notlar

- `message` modu, yükün tamamı tam olarak sessiz token olduğunda (örneğin `NO_REPLY` / `no_reply`, büyük/küçük harfe duyarsız eşleştirilir) yalnızca sessiz yanıtlarda yazıyor göstergesi göstermez.
- `thinking` yalnızca çalışma akıl yürütmeyi akış olarak gönderirse tetiklenir (`reasoningLevel: "stream"`).
  Model akıl yürütme deltaları yaymazsa yazıyor göstergesi başlamaz.
- Heartbeat yazıyor göstergesi, çözümlenen teslim hedefi için bir canlılık sinyalidir. `message` veya `thinking` akış zamanlamasını izlemek yerine Heartbeat çalışması başladığında başlar. Devre dışı bırakmak için `typingMode: "never"` ayarlayın.
- Heartbeat’ler `target: "none"` olduğunda, hedef çözümlenemediğinde, Heartbeat için sohbet teslimi devre dışı bırakıldığında veya kanal yazıyor göstergesini desteklemediğinde yazıyor göstergesi göstermez.
- `typingIntervalSeconds` başlangıç zamanını değil, **yenileme ritmini** denetler.
  Varsayılan değer 6 saniyedir.

## İlgili

<CardGroup cols={2}>
  <Card title="Presence" href="/tr/concepts/presence" icon="signal">
    Gateway’in bağlı istemcileri nasıl izlediği ve bunları macOS Instances sekmesinde nasıl gösterdiği.
  </Card>
  <Card title="Streaming and chunking" href="/tr/concepts/streaming" icon="bars-staggered">
    Giden akış davranışı, parça sınırları ve kanala özgü teslim.
  </Card>
</CardGroup>
