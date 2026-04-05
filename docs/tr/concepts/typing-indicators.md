---
read_when:
    - Yazıyor göstergesi davranışını veya varsayılanlarını değiştiriyorsunuz
summary: OpenClaw'ın yazıyor göstergelerini ne zaman gösterdiği ve bunların nasıl ayarlanacağı
title: Yazıyor Göstergeleri
x-i18n:
    generated_at: "2026-04-05T13:51:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28c8c395a135fc0745181aab66a93582177e6acd0b3496debcbb98159a4f11dc
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# Yazıyor göstergeleri

Bir çalıştırma etkin durumdayken sohbet kanalına yazıyor göstergeleri gönderilir. Yazmanın **ne zaman** başlayacağını denetlemek için `agents.defaults.typingMode`, **ne sıklıkla** yenileneceğini denetlemek için `typingIntervalSeconds` kullanın.

## Varsayılanlar

`agents.defaults.typingMode` **ayarlı değilse**, OpenClaw legacy davranışı korur:

- **Doğrudan sohbetler**: model döngüsü başlar başlamaz yazıyor durumu başlar.
- **Bahsetme içeren grup sohbetleri**: yazıyor durumu hemen başlar.
- **Bahsetme içermeyen grup sohbetleri**: yazıyor durumu yalnızca mesaj metni akış halinde gelmeye başladığında başlar.
- **Heartbeat çalıştırmaları**: yazıyor durumu devre dışıdır.

## Modlar

`agents.defaults.typingMode` değerini şunlardan biri olarak ayarlayın:

- `never` — hiçbir zaman yazıyor göstergesi yok.
- `instant` — çalıştırma daha sonra yalnızca sessiz yanıt token'ını döndürse bile, yazıyor durumunu **model döngüsü başlar başlamaz** başlatır.
- `thinking` — yazıyor durumunu **ilk muhakeme delta'sında** başlatır (`reasoningLevel: "stream"` çalıştırma için gereklidir).
- `message` — yazıyor durumunu **ilk sessiz olmayan metin delta'sında** başlatır (`NO_REPLY` sessiz token'ını yok sayar).

“Tetiklenme ne kadar erken olur” sırası:
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

Modu veya sıklığı oturum başına geçersiz kılabilirsiniz:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Notlar

- `message` modu, tüm payload tam olarak sessiz token olduğunda sessiz yanıtlar için yazıyor durumu göstermez (örneğin `NO_REPLY` / `no_reply`, büyük/küçük harf duyarsız eşleşir).
- `thinking` yalnızca çalıştırma muhakemeyi akış halinde gönderirse tetiklenir (`reasoningLevel: "stream"`).
  Model muhakeme delta'ları yaymazsa yazıyor durumu başlamaz.
- Mod ne olursa olsun heartbeat'ler hiçbir zaman yazıyor durumu göstermez.
- `typingIntervalSeconds`, başlangıç zamanını değil **yenileme sıklığını** denetler.
  Varsayılan değer 6 saniyedir.
