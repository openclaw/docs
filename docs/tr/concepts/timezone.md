---
read_when:
    - Saat dilimi işlemenin hızlı bir zihinsel modelini istiyorsunuz
    - Saat dilimini nerede ayarlayacağınıza veya geçersiz kılacağınıza karar veriyorsunuz
summary: OpenClaw’da zaman dilimlerinin göründüğü yerler — zarflar, araç yükleri, sistem istemi
title: Saat dilimleri
x-i18n:
    generated_at: "2026-06-28T00:31:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc5bfe595c81b9c6ffaceac4c86b6f82b82917a506cdd7227e3e8cb1c0eb99a3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw, modelin sağlayıcıya özgü yerel saatlerin bir karışımı yerine **tek bir referans zamanı** görmesi için zaman damgalarını standartlaştırır. Saat dilimlerinin göründüğü üç yüzey vardır ve her birinin kendi amacı bulunur:

## Üç saat dilimi yüzeyi

| Yüzey             | Ne gösterir                                                                                            | Varsayılan                            | Şununla yapılandırılır                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------- |
| İleti zarfları    | Gelen kanal iletilerini sarar: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                      | Ana makine yereli                     | `agents.defaults.envelopeTimezone`                      |
| Araç yükleri      | Kanal `readMessages` tarzı araçları ham sağlayıcı zamanı + normalleştirilmiş `timestampMs` / `timestampUtc` döndürür | UTC alanları her zaman bulunur        | Yapılandırılamaz — sağlayıcıya özgü yerel zaman damgalarını korur |
| Sistem istemi     | **Yalnızca saat dilimi** içeren küçük bir `Geçerli Tarih ve Saat` bloğu (önbellek kararlılığı için saat değeri yok) | `userTimezone` ayarlanmamışsa ana makine saat dilimi | `agents.defaults.userTimezone`                          |

Sistem istemi, istem önbelleğinin dönüşler arasında kararlı kalması için canlı saati bilerek dışarıda bırakır. Aracının geçerli saate ihtiyacı olduğunda `session_status` çağırır.

## Kullanıcı saat dilimini ayarlama

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

`userTimezone` ayarlanmamışsa OpenClaw, çalışma zamanında ana makine saat dilimini çözümler (yapılandırma yazımı yoktur). `agents.defaults.timeFormat` (`auto` | `12` | `24`), sistem istemi bölümünde değil, zarflarda ve aşağı akış yüzeylerinde 12 saat/24 saat gösterimini denetler.

## Ne zaman geçersiz kılmalı

- Farklı bölgelerdeki ana makineler arasında kararlı zaman damgaları istediğinizde veya UTC ile hizalı günlüklerin tanılama çıktısıyla eşleşmesini istediğinizde **UTC zarfları kullanın** (`envelopeTimezone: "utc"`).
- Gateway ana makinesi bir saat dilimindeyken kullanıcı başka bir saat dilimindeyse ve ana makine taşınmasından bağımsız olarak zarfların kullanıcının saat diliminde okunmasını istiyorsanız **sabit bir IANA bölgesi kullanın** (ör. `"Europe/Vienna"`).
- Zaman damgası bağlamı konuşma için yararlı değilse **`envelopeTimestamp: "off"` ayarlayın**. Bu, zarflardan, doğrudan aracı istemi öneklerinden ve gömülü model girdi öneklerinden mutlak zaman damgalarını kaldırır.

Tam davranış başvurusu, sağlayıcı başına örnekler ve geçen süre biçimlendirmesi için [Tarih ve Saat](/tr/date-time) bölümüne bakın.

## İlgili

- [Tarih ve Saat](/tr/date-time) — tam zarf/araç/istem davranışı ve örnekleri.
- [Heartbeat](/tr/gateway/heartbeat) — etkin saatler zamanlama için saat dilimini kullanır.
- [Cron İşleri](/tr/automation/cron-jobs) — cron ifadeleri zamanlama için saat dilimini kullanır.
