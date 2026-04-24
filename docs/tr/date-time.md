---
read_when:
    - Zaman damgalarının modele veya kullanıcılara nasıl gösterildiğini değiştiriyorsunuz
    - Mesajlarda veya sistem istemi çıktısında zaman biçimlendirmede hata ayıklıyorsunuz
summary: Zarf yapıları, istemler, araçlar ve bağlayıcılar genelinde tarih ve saat işleme
title: Tarih ve saat
x-i18n:
    generated_at: "2026-04-24T09:07:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3d54da4077ac985ae1209b4364e049afb83b5746276e164181c1a30f0faa06e
    source_path: date-time.md
    workflow: 15
---

# Tarih ve Saat

OpenClaw varsayılan olarak **taşıma zaman damgaları için ana makinenin yerel saatini** ve **yalnızca sistem isteminde kullanıcı saat dilimini** kullanır.
Araçların kendi yerel anlamlarını koruması için sağlayıcı zaman damgaları korunur (`session_status` üzerinden geçerli saat kullanılabilir).

## Mesaj zarfları (varsayılan olarak yerel)

Gelen mesajlar bir zaman damgasıyla sarılır (dakika hassasiyeti):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Bu zarf zaman damgası, sağlayıcı saat diliminden bağımsız olarak varsayılan olarak **ana makinenin yerel saatidir**.

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
- `envelopeTimezone: "local"` ana makinenin saat dilimini kullanır.
- `envelopeTimezone: "user"`, `agents.defaults.userTimezone` kullanır (ana makinenin saat dilimine geri döner).
- Sabit bir bölge için açık bir IANA saat dilimi kullanın (ör. `"America/Chicago"`).
- `envelopeTimestamp: "off"`, mutlak zaman damgalarını zarf başlıklarından kaldırır.
- `envelopeElapsed: "off"`, geçen süre soneklerini kaldırır (`+2m` biçimi).

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

## Sistem istemi: Geçerli Tarih ve Saat

Kullanıcı saat dilimi biliniyorsa, sistem istemi kararlı istem önbelleklemesini korumak için
yalnızca **saat dilimini** içeren özel bir
**Geçerli Tarih ve Saat** bölümü içerir (**saat/zaman biçimi yok**):

```
Time zone: America/Chicago
```

Aracının geçerli saate ihtiyacı olduğunda `session_status` aracını kullanın; durum
kartı bir zaman damgası satırı içerir.

## Sistem olayı satırları (varsayılan olarak yerel)

Aracı bağlamına eklenen kuyruğa alınmış sistem olayları, mesaj zarflarıyla aynı
saat dilimi seçimini kullanarak bir zaman damgası ile öneklenir (varsayılan: ana makinenin yerel saati).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Kullanıcı saat dilimini + biçimi yapılandırma

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
- `timeFormat`, istemde **12 saat/24 saat gösterimini** kontrol eder. `auto`, OS tercihlerini izler.

## Saat biçimi algılama (auto)

`timeFormat: "auto"` olduğunda OpenClaw, OS tercihini (macOS/Windows) inceler
ve yerel ayar biçimlendirmesine geri döner. Algılanan değer, yinelenen sistem çağrılarını önlemek için
**süreç başına önbelleğe alınır**.

## Araç payload'ları + bağlayıcılar (ham sağlayıcı zamanı + normalize alanlar)

Kanal araçları **sağlayıcıya özgü yerel zaman damgaları** döndürür ve tutarlılık için normalize alanlar ekler:

- `timestampMs`: epoch milisaniyesi (UTC)
- `timestampUtc`: ISO 8601 UTC dizesi

Hiçbir şey kaybolmaması için ham sağlayıcı alanları korunur.

- Slack: API'den gelen epoch benzeri dizeler
- Discord: UTC ISO zaman damgaları
- Telegram/WhatsApp: sağlayıcıya özgü sayısal/ISO zaman damgaları

Yerel saate ihtiyacınız varsa, bilinen saat dilimini kullanarak bunu aşağı akışta dönüştürün.

## İlgili belgeler

- [Sistem İstemi](/tr/concepts/system-prompt)
- [Saat dilimleri](/tr/concepts/timezone)
- [Mesajlar](/tr/concepts/messages)
