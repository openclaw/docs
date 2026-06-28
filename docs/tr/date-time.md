---
read_when:
    - Modele veya kullanıcılara zaman damgalarının nasıl gösterildiğini değiştiriyorsunuz
    - Mesajlarda veya sistem istemi çıktısında zaman biçimlendirmesinde hata ayıklıyorsunuz
summary: Zarfılar, istemler, araçlar ve bağlayıcılar genelinde tarih ve saat işleme
title: Tarih ve saat
x-i18n:
    generated_at: "2026-06-28T00:32:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d40e8626269d26a14506a178080b353529080b6ee5ce523c3281521f1a34bf90
    source_path: date-time.md
    workflow: 16
---

OpenClaw, varsayılan olarak **aktarım zaman damgaları için ana makine yerel saatini** ve **yalnızca sistem isteminde kullanıcı saat dilimini** kullanır.
Sağlayıcı zaman damgaları korunur; böylece araçlar yerel anlamlarını korur (geçerli saat `session_status` üzerinden kullanılabilir).

## Mesaj zarfları (varsayılan olarak yerel)

Gelen mesajlar bir zaman damgasıyla (saniye hassasiyetinde) sarmalanır:

```
[Provider ... Mon 2026-01-05 16:26:34 PST] message text
```

Bu zarf zaman damgası, sağlayıcı saat diliminden bağımsız olarak **varsayılan olarak ana makine yerel saatindedir**.

Bu davranışı geçersiz kılabilirsiniz:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` UTC kullanır.
- `envelopeTimezone: "local"` ana makine saat dilimini kullanır.
- `envelopeTimezone: "user"` `agents.defaults.userTimezone` değerini kullanır (ana makine saat dilimine geri döner).
- Sabit bir bölge için açık bir IANA saat dilimi (ör. `"America/Chicago"`) kullanın.
- `envelopeTimestamp: "off"` zarf başlıklarından, doğrudan ajan istemi öneklerinden ve gömülü model girdisi öneklerinden mutlak zaman damgalarını kaldırır.
- `envelopeElapsed: "off"` geçen süre soneklerini (`+2m` biçimi) kaldırır.

### Örnekler

**Yerel (varsayılan):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**Kullanıcı saat dilimi:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**Geçen süre etkin:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## Sistem istemi: geçerli tarih ve saat

Kullanıcı saat dilimi biliniyorsa sistem istemi, istem önbelleğe almayı kararlı tutmak için
**yalnızca saat dilimini** içeren (saat/zaman biçimi yok) özel bir
**Geçerli Tarih ve Saat** bölümü içerir:

```
Time zone: America/Chicago
```

Ajan geçerli saate ihtiyaç duyduğunda `session_status` aracını kullanın; durum
kartı bir zaman damgası satırı içerir.

## Sistem olayı satırları (varsayılan olarak yerel)

Ajan bağlamına eklenen kuyruğa alınmış sistem olaylarının başına, mesaj zarflarıyla
aynı saat dilimi seçimi kullanılarak bir zaman damgası eklenir (varsayılan: ana makine yerel).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Kullanıcı saat dilimini ve biçimini yapılandırma

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone`, istem bağlamı için **kullanıcı yerel saat dilimini** ayarlar.
- `timeFormat`, istemde **12 saat/24 saat gösterimini** denetler. `auto`, işletim sistemi tercihlerini izler.

## Saat biçimi algılama (auto)

`timeFormat: "auto"` olduğunda OpenClaw işletim sistemi tercihini (macOS/Windows)
inceler ve yerel ayar biçimlendirmesine geri döner. Algılanan değer, yinelenen sistem çağrılarını
önlemek için **işlem başına önbelleğe alınır**.

## Araç yükleri + bağlayıcılar (ham sağlayıcı zamanı + normalleştirilmiş alanlar)

Kanal araçları **sağlayıcıya özgü zaman damgaları** döndürür ve tutarlılık için normalleştirilmiş alanlar ekler:

- `timestampMs`: epoch milisaniyeleri (UTC)
- `timestampUtc`: ISO 8601 UTC dizesi

Ham sağlayıcı alanları korunur; böylece hiçbir şey kaybolmaz.

- Slack: API’den gelen epoch benzeri dizeler
- Discord: UTC ISO zaman damgaları
- Telegram/WhatsApp: sağlayıcıya özgü sayısal/ISO zaman damgaları

Yerel saate ihtiyacınız varsa bilinen saat dilimini kullanarak bunu aşağı akışta dönüştürün.

## İlgili dokümanlar

- [Sistem İstemi](/tr/concepts/system-prompt)
- [Saat Dilimleri](/tr/concepts/timezone)
- [Mesajlar](/tr/concepts/messages)
