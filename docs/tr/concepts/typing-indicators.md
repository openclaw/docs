---
read_when:
    - Yazıyor göstergesi davranışını veya varsayılanlarını değiştirme
summary: OpenClaw'un yazıyor göstergelerini ne zaman gösterdiği ve bunların nasıl ayarlanacağı
title: Yazıyor göstergeleri
x-i18n:
    generated_at: "2026-07-16T17:23:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 55e5ec38f47e0612b25b5561790e9b8a17ea4e215c4038bb89af83f861089e03
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Bir çalışma etkinken sohbet kanalına yazma göstergeleri gönderilir. Yazmanın **ne zaman** başlayacağını kontrol etmek için `agents.defaults.typingMode`, **ne sıklıkta** yenileneceğini kontrol etmek içinse `typingIntervalSeconds` kullanın (canlı tutma sıklığı, varsayılan 6 saniye).

## Varsayılanlar

`agents.defaults.typingMode` **ayarlanmamışsa**:

- **Doğrudan sohbetler**: Yazma, model döngüsü başladığı anda başlar.
- **Bahsetme içeren grup sohbetleri**: Yazma hemen başlar.
- **Bahsetme içermeyen grup sohbetleri**: Yazma, kabul edilen çalışmada çalıştırma altyapısı yürütme etkinliği veya mesaj metni gibi kullanıcı tarafından görülebilen bir etkinlik olduğunda başlar.
- **Heartbeat çalışmaları**: Çözümlenen Heartbeat hedefi yazma özelliğine sahip bir sohbetse ve yazma devre dışı değilse, yazma Heartbeat çalışması başladığında başlar.

## Modlar

`agents.defaults.typingMode` değerini şunlardan birine ayarlayın:

- `never` - hiçbir zaman yazma göstergesi gösterilmez.
- `instant` - çalışma daha sonra yalnızca sessiz yanıt belirtecini döndürse bile yazmayı **model döngüsü başlar başlamaz** başlatır.
- `thinking` - yazmayı **ilk akıl yürütme deltası** geldiğinde veya tur kabul edildikten sonra etkin çalıştırma altyapısı yürütmesi başladığında başlatır.
- `message` - yazmayı etkin çalıştırma altyapısı yürütmesi veya sessiz olmayan bir metin deltası gibi **kullanıcı tarafından görülebilen ilk yanıt etkinliğinde** başlatır. `NO_REPLY` gibi sessiz yanıt belirteçleri metin etkinliği sayılmaz.

“Ne kadar erken tetiklendiği” sırası: `never` -> `message`/`thinking` -> `instant`.

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

Her oturum için modu veya sıklığı geçersiz kılın:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Notlar

- `message` modu sessiz yanıt belirteçleriyle başlamaz, ancak etkin yürütme, herhangi bir asistan metni kullanılabilir olmadan önce de yazma göstergesini gösterebilir.
- `thinking` akış hâlindeki akıl yürütmeye (`reasoningLevel: "stream"`) tepki vermeye devam eder ve akıl yürütme deltaları gelmeden önce etkin yürütmeyle de başlayabilir.
- Heartbeat yazma göstergesi, çözümlenen teslimat hedefi için bir canlılık sinyalidir. `message` veya `thinking` akış zamanlamasını izlemek yerine Heartbeat çalışması başladığında başlar. Devre dışı bırakmak için `typingMode: "never"` değerini ayarlayın.
- Heartbeat hedefi `"none"` olduğunda, hedef çözümlenemediğinde, Heartbeat için sohbet teslimatı devre dışı bırakıldığında veya kanal yazmayı desteklemediğinde Heartbeat'ler yazma göstergesi göstermez.
- `typingIntervalSeconds`, başlangıç zamanını değil **yenileme sıklığını** kontrol eder. Varsayılan: 6 saniye.

## İlgili

<CardGroup cols={2}>
  <Card title="Bulunma durumu" href="/tr/concepts/presence" icon="signal">
    Gateway'in Control UI Aygıtlar sayfası ve macOS Örnekler sekmesi için bağlı istemcileri nasıl izlediği.
  </Card>
  <Card title="Akış ve parçalara ayırma" href="/tr/concepts/streaming" icon="bars-staggered">
    Giden akış davranışı, parça sınırları ve kanala özgü teslimat.
  </Card>
</CardGroup>
