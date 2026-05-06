---
read_when:
    - Zaman damgalarının modele veya kullanıcılara nasıl gösterildiğini değiştiriyorsunuz
    - Mesajlarda veya sistem istemi çıktısında zaman biçimlendirmesinde hata ayıklıyorsunuz
summary: Zarflar, istemler, araçlar ve bağlayıcılar genelinde tarih ve saat işleme
title: Tarih ve saat
x-i18n:
    generated_at: "2026-05-06T09:11:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f695a5009c949cc24689bfb8950d96cf72f0b2a1472efe88923182527b56b74
    source_path: date-time.md
    workflow: 16
---

OpenClaw, **aktarım zaman damgaları için varsayılan olarak ana makine yerel saatini** ve **yalnızca sistem isteminde kullanıcı saat dilimini** kullanır.
Araçların kendi yerel anlamlarını koruması için sağlayıcı zaman damgaları korunur (geçerli zaman `session_status` üzerinden kullanılabilir).

## İleti zarfları (varsayılan olarak yerel)

Gelen iletiler bir zaman damgasıyla sarılır (dakika hassasiyeti):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Bu zarf zaman damgası, sağlayıcı saat diliminden bağımsız olarak **varsayılan olarak ana makine yereldir**.

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
- `envelopeTimezone: "user"` `agents.defaults.userTimezone` kullanır (ana makine saat dilimine geri döner).
- Sabit bir bölge için açık bir IANA saat dilimi kullanın (ör. `"America/Chicago"`).
- `envelopeTimestamp: "off"` zarf başlıklarından mutlak zaman damgalarını kaldırır.
- `envelopeElapsed: "off"` geçen süre soneklerini kaldırır (`+2m` biçimi).

### Örnekler

**Yerel (varsayılan):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Kullanıcı saat dilimi:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Geçen süre etkin:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## Sistem istemi: geçerli tarih ve saat

Kullanıcı saat dilimi biliniyorsa sistem istemi, istem önbelleğe almayı kararlı tutmak için
**yalnızca saat dilimi** içeren (saat/zaman biçimi olmayan) özel bir
**Geçerli Tarih ve Saat** bölümü içerir:

```
Time zone: America/Chicago
```

Ajanın geçerli zamana ihtiyacı olduğunda `session_status` aracını kullanın; durum
kartı bir zaman damgası satırı içerir.

## Sistem olayı satırları (varsayılan olarak yerel)

Ajan bağlamına eklenen kuyruğa alınmış sistem olayları, ileti zarflarıyla aynı
saat dilimi seçimini kullanan bir zaman damgasıyla öneklenir (varsayılan: ana makine yerel).

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
- `timeFormat`, istemdeki **12 saat/24 saat gösterimini** denetler. `auto`, işletim sistemi tercihlerini izler.

## Zaman biçimi algılama (auto)

`timeFormat: "auto"` olduğunda OpenClaw, işletim sistemi tercihini (macOS/Windows)
inceler ve yerel ayar biçimlendirmesine geri döner. Algılanan değer, yinelenen sistem
çağrılarını önlemek için **işlem başına önbelleğe alınır**.

## Araç yükleri ve bağlayıcılar (ham sağlayıcı zamanı + normalleştirilmiş alanlar)

Kanal araçları **sağlayıcıya özgü zaman damgalarını** döndürür ve tutarlılık için normalleştirilmiş alanlar ekler:

- `timestampMs`: epoch milisaniyesi (UTC)
- `timestampUtc`: ISO 8601 UTC dizesi

Hiçbir şeyin kaybolmaması için ham sağlayıcı alanları korunur.

- Slack: API'den epoch benzeri dizeler
- Discord: UTC ISO zaman damgaları
- Telegram/WhatsApp: sağlayıcıya özgü sayısal/ISO zaman damgaları

Yerel saate ihtiyacınız varsa bilinen saat dilimini kullanarak aşağı akışta dönüştürün.

## İlgili belgeler

- [Sistem İstemi](/tr/concepts/system-prompt)
- [Saat Dilimleri](/tr/concepts/timezone)
- [İletiler](/tr/concepts/messages)
