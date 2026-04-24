---
read_when:
    - Zaman damgalarının model için nasıl normalleştirildiğini anlamanız gerekiyor
    - Sistem istemleri için kullanıcı saat dilimini yapılandırma
summary: Aracılar, zarflar ve istemler için saat dilimi işleme
title: Saat dilimleri
x-i18n:
    generated_at: "2026-04-24T09:07:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8318acb0269f446fb3d3198f47811d40490a9ee9593fed82f31353aef2bacb81
    source_path: concepts/timezone.md
    workflow: 15
---

OpenClaw, modelin **tek bir başvuru zamanı** görmesi için zaman damgalarını standartlaştırır.

## Mesaj zarfları (varsayılan olarak yerel)

Gelen mesajlar şu şekilde bir zarf içine alınır:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Zarftaki zaman damgası varsayılan olarak **ana makinenin yerel saatidir**, dakika hassasiyetindedir.

Bunu şu şekilde geçersiz kılabilirsiniz:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA saat dilimi
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` UTC kullanır.
- `envelopeTimezone: "user"`, `agents.defaults.userTimezone` değerini kullanır (ana makine saat dilimine geri düşer).
- Sabit ofset için açık bir IANA saat dilimi kullanın (ör. `"Europe/Vienna"`).
- `envelopeTimestamp: "off"`, zarf üst bilgilerinden mutlak zaman damgalarını kaldırır.
- `envelopeElapsed: "off"`, geçen süre son eklerini (`+2m` biçimi) kaldırır.

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

## Tool yükleri (ham sağlayıcı verisi + normalleştirilmiş alanlar)

Tool çağrıları (`channels.discord.readMessages`, `channels.slack.readMessages` vb.) **ham sağlayıcı zaman damgalarını** döndürür.
Tutarlılık için ayrıca normalleştirilmiş alanlar da ekleriz:

- `timestampMs` (UTC epoch milisaniyeleri)
- `timestampUtc` (ISO 8601 UTC dizgesi)

Ham sağlayıcı alanları korunur.

## Sistem istemi için kullanıcı saat dilimi

Modele kullanıcının yerel saat dilimini bildirmek için `agents.defaults.userTimezone` ayarlayın. Bu ayarlanmamışsa OpenClaw, **ana makine saat dilimini çalışma zamanında** çözümler (yapılandırma yazımı yok).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

Sistem istemi şunları içerir:

- yerel saat ve saat dilimi ile `Current Date & Time` bölümü
- `Time format: 12-hour` veya `24-hour`

İstem biçimini `agents.defaults.timeFormat` ile denetleyebilirsiniz (`auto` | `12` | `24`).

Tam davranış ve örnekler için [Tarih ve Saat](/tr/date-time) sayfasına bakın.

## İlgili

- [Heartbeat](/tr/gateway/heartbeat) — etkin saatler zamanlama için saat dilimini kullanır
- [Cron İşleri](/tr/automation/cron-jobs) — Cron ifadeleri zamanlama için saat dilimini kullanır
- [Tarih ve Saat](/tr/date-time) — tam tarih/saat davranışı ve örnekler
