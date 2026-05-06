---
read_when:
    - Saat dilimi yönetimi için hızlı bir zihinsel model istiyorsunuz
    - Bir saat dilimini nerede ayarlayacağınıza veya geçersiz kılacağınıza karar veriyorsunuz
summary: OpenClaw’da saat dilimlerinin göründüğü yerler — zarflar, araç yükleri, sistem istemi
title: Saat dilimleri
x-i18n:
    generated_at: "2026-05-06T09:10:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 041b207a0fa2758a20e8f3c4eca852d3dd416560d045459cb4d86709b45449e3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw, zaman damgalarını standartlaştırır; böylece model, sağlayıcıya yerel saatlerin karışımı yerine **tek bir referans zamanı** görür. Saat dilimlerinin göründüğü üç yüzey vardır ve her birinin kendi amacı bulunur:

## Üç saat dilimi yüzeyi

| Yüzey             | Ne gösterir                                                                                             | Varsayılan                            | Şununla yapılandırılır                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| Mesaj zarfları    | Gelen kanal mesajlarını sarmalar: `[Signal +1555 2026-01-18 00:19 PST] merhaba`                         | Ana makineye yerel                    | `agents.defaults.envelopeTimezone`                      |
| Araç yükleri      | Kanalın `readMessages` tarzı araçları ham sağlayıcı zamanını + normalleştirilmiş `timestampMs` / `timestampUtc` döndürür | UTC alanları her zaman bulunur        | Yapılandırılamaz — sağlayıcıya özgü zaman damgalarını korur |
| Sistem istemi     | **Yalnızca saat dilimini** içeren küçük bir `Current Date & Time` bloğu (önbellek kararlılığı için saat değeri yok) | `userTimezone` ayarlanmamışsa ana makine saat dilimi | `agents.defaults.userTimezone`                          |

Sistem istemi, istem önbelleğe almayı dönüşler arasında kararlı tutmak için canlı saati özellikle çıkarır. Aracının geçerli zamana ihtiyacı olduğunda `session_status` çağırır.

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

`userTimezone` ayarlanmamışsa OpenClaw, çalışma zamanında ana makine saat dilimini çözer (yapılandırma yazımı yok). `agents.defaults.timeFormat` (`auto` | `12` | `24`), sistem istemi bölümünde değil, zarflarda ve aşağı akış yüzeylerde 12s/24s gösterimini denetler.

## Ne zaman geçersiz kılmalı

- Farklı bölgelerdeki ana makineler arasında kararlı zaman damgaları istediğinizde veya UTC ile hizalı günlüklerin tanılama çıktısıyla eşleşmesini istediğinizde **UTC zarfları kullanın** (`envelopeTimezone: "utc"`).
- Gateway ana makinesi bir saat dilimindeyken kullanıcı başka bir saat dilimindeyse ve ana makine geçişinden bağımsız olarak zarfların kullanıcının saat diliminde okunmasını istiyorsanız **sabit bir IANA bölgesi kullanın** (ör. `"Europe/Vienna"`).
- Zaman damgası bağlamı konuşma için yararlı değilse düşük token'lı zarflar için **`envelopeTimestamp: "off"` ayarlayın**.

Tam davranış başvurusu, sağlayıcı başına örnekler ve geçen süre biçimlendirmesi için bkz. [Tarih ve Saat](/tr/date-time).

## İlgili

- [Tarih ve Saat](/tr/date-time) — tam zarf/araç/istem davranışı ve örnekler.
- [Heartbeat](/tr/gateway/heartbeat) — etkin saatler zamanlama için saat dilimini kullanır.
- [Cron İşleri](/tr/automation/cron-jobs) — cron ifadeleri zamanlama için saat dilimini kullanır.
