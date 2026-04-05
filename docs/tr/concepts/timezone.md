---
read_when:
    - Model için zaman damgalarının nasıl normalize edildiğini anlamanız gerekiyor
    - Sistem prompt'ları için kullanıcı saat dilimini yapılandırıyorsunuz
summary: Ajanlar, zarflar ve prompt'lar için saat dilimi işleme
title: Saat Dilimleri
x-i18n:
    generated_at: "2026-04-05T13:51:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31a195fa43e3fc17b788d8e70d74ef55da998fc7997c4f0538d4331b1260baac
    source_path: concepts/timezone.md
    workflow: 15
---

# Saat Dilimleri

OpenClaw, modelin **tek bir referans zamanı** görmesi için zaman damgalarını standartlaştırır.

## Mesaj zarfları (varsayılan olarak yerel)

Gelen mesajlar şu türde bir zarf içinde sarılır:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Zarftaki zaman damgası, dakika hassasiyetiyle **varsayılan olarak ana bilgisayarın yerel saatidir**.

Bunu şununla geçersiz kılabilirsiniz:

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
- `envelopeTimezone: "user"`, `agents.defaults.userTimezone` değerini kullanır (ana bilgisayar saat dilimine geri düşer).
- Sabit bir ofset için açık bir IANA saat dilimi kullanın (ör. `"Europe/Vienna"`).
- `envelopeTimestamp: "off"`, zarf başlıklarından mutlak zaman damgalarını kaldırır.
- `envelopeElapsed: "off"`, geçen süre soneklerini (`+2m` biçimi) kaldırır.

### Örnekler

**Yerel (varsayılan):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**Sabit saat dilimi:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**Geçen süre:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## Araç payload'ları (ham sağlayıcı verileri + normalize edilmiş alanlar)

Araç çağrıları (`channels.discord.readMessages`, `channels.slack.readMessages` vb.) **ham sağlayıcı zaman damgalarını** döndürür.
Tutarlılık için ayrıca normalize edilmiş alanlar da eklenir:

- `timestampMs` (UTC epoch milisaniye)
- `timestampUtc` (ISO 8601 UTC dizesi)

Ham sağlayıcı alanları korunur.

## Sistem prompt'u için kullanıcı saat dilimi

Modele kullanıcının yerel saat dilimini bildirmek için `agents.defaults.userTimezone` ayarlayın. Bu değer
ayarlanmamışsa OpenClaw **çalışma zamanında ana bilgisayar saat dilimini** çözümler (yapılandırmaya yazmaz).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

Sistem prompt'u şunları içerir:

- Yerel saat ve saat dilimi ile `Current Date & Time` bölümü
- `Time format: 12-hour` veya `24-hour`

Prompt biçimini `agents.defaults.timeFormat` ile kontrol edebilirsiniz (`auto` | `12` | `24`).

Tam davranış ve örnekler için [Date & Time](/date-time) bölümüne bakın.

## İlgili

- [Heartbeat](/gateway/heartbeat) — etkin saatler zamanlama için saat dilimini kullanır
- [Cron Jobs](/tr/automation/cron-jobs) — cron ifadeleri zamanlama için saat dilimini kullanır
- [Date & Time](/date-time) — tam tarih/saat davranışı ve örnekler
