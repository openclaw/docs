---
read_when:
    - Zaman damgalarının modele veya kullanıcılara nasıl gösterildiğini değiştiriyorsanız
    - Mesajlarda veya sistem istemi çıktısında zaman biçimlendirmesinde hata ayıklıyorsanız
summary: Zarflar, istemler, araçlar ve bağlayıcılar genelinde tarih ve saat işleme
title: Tarih ve Saat
x-i18n:
    generated_at: "2026-04-05T13:51:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753af5946a006215d6af2467fa478f3abb42b1dff027cf85d5dc4c7ba4b58d39
    source_path: date-time.md
    workflow: 15
---

# Tarih ve Saat

OpenClaw varsayılan olarak **taşıma zaman damgaları için ana makinenin yerel saatini** ve **yalnızca sistem isteminde kullanıcı saat dilimini** kullanır.
Sağlayıcı zaman damgaları korunduğu için araçlar kendi yerel anlamlarını korur (geçerli saat `session_status` aracılığıyla kullanılabilir).

## Mesaj zarfları (varsayılan olarak yerel)

Gelen mesajlar bir zaman damgasıyla sarılır (dakika hassasiyeti):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Bu zarf zaman damgası, sağlayıcı saat diliminden bağımsız olarak **varsayılan olarak ana makinenin yerel saatidir**.

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
- `envelopeTimezone: "user"`, `agents.defaults.userTimezone` kullanır (yedek olarak ana makinenin saat dilimine döner).
- Sabit bir bölge için açık bir IANA saat dilimi kullanın (örneğin `"America/Chicago"`).
- `envelopeTimestamp: "off"`, zarf başlıklarından mutlak zaman damgalarını kaldırır.
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

Kullanıcı saat dilimi biliniyorsa, sistem istemi önbelleğe almayı kararlı tutmak için
yalnızca **saat dilimini** içeren özel bir **Geçerli Tarih ve Saat** bölümü içerir
(saat/zaman biçimi yoktur):

```
Time zone: America/Chicago
```

Aracının geçerli saate ihtiyacı olduğunda `session_status` aracını kullanın; durum
kartı bir zaman damgası satırı içerir.

## Sistem olay satırları (varsayılan olarak yerel)

Aracı bağlamına eklenen kuyruktaki sistem olayları, mesaj zarflarıyla
aynı saat dilimi seçimini kullanarak bir zaman damgası öneki alır (varsayılan: ana makinenin yerel saati).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Kullanıcı saat dilimini + biçimini yapılandırma

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

- `userTimezone`, istem bağlamı için **kullanıcının yerel saat dilimini** ayarlar.
- `timeFormat`, istemdeki **12 saat/24 saat gösterimini** denetler. `auto`, OS tercihlerini izler.

## Zaman biçimi algılama (auto)

`timeFormat: "auto"` olduğunda OpenClaw OS tercihini (macOS/Windows) inceler
ve yedek olarak yerel biçimlendirmeyi kullanır. Algılanan değer, yinelenen sistem çağrılarını önlemek için
**süreç başına önbelleğe alınır**.

## Araç payload'ları + bağlayıcılar (ham sağlayıcı zamanı + normalize alanlar)

Kanal araçları **sağlayıcının yerel zaman damgalarını** döndürür ve tutarlılık için normalize alanlar ekler:

- `timestampMs`: epoch milisaniyesi (UTC)
- `timestampUtc`: ISO 8601 UTC dizesi

Hiçbir bilgi kaybolmaması için ham sağlayıcı alanları korunur.

- Slack: API'den epoch benzeri dizeler
- Discord: UTC ISO zaman damgaları
- Telegram/WhatsApp: sağlayıcıya özgü sayısal/ISO zaman damgaları

Yerel saate ihtiyacınız varsa, bunu bilinen saat dilimini kullanarak alt akışta dönüştürün.

## İlgili dokümanlar

- [Sistem İstemi](/concepts/system-prompt)
- [Saat Dilimleri](/concepts/timezone)
- [Mesajlar](/concepts/messages)
