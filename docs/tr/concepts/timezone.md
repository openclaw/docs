---
read_when:
    - Saat dilimi işleme için hızlı bir zihinsel model istiyorsunuz
    - Bir saat dilimini nerede ayarlayacağınıza veya geçersiz kılacağınıza karar veriyorsunuz
summary: OpenClaw'da saat dilimlerinin göründüğü yerler — zarflar, araç yükleri, sistem istemi
title: Saat Dilimleri
x-i18n:
    generated_at: "2026-07-12T12:15:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw, modelin sağlayıcıya özgü saatlerin bir karışımı yerine **tek bir referans zamanı** görmesi için zaman damgalarını standartlaştırır. Üç yüzey saat dilimlerini gösterir ve her birinin farklı bir amacı vardır:

## Üç saat dilimi yüzeyi

| Yüzey             | Gösterdiği                                                                                                          | Varsayılan                                             | Yapılandırma yolu                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| İleti zarfları    | Gelen kanal iletilerini sarar: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                                   | Ana makinenin yerel saat dilimi                        | `agents.defaults.envelopeTimezone`                     |
| Araç yükleri      | Kanalın `readMessages` tarzı araçları, ham sağlayıcı zamanının yanı sıra normalleştirilmiş `timestampMs` / `timestampUtc` değerlerini döndürür | UTC alanları her zaman bulunur                         | Yapılandırılamaz; sağlayıcıya özgü zaman damgalarını korur |
| Sistem istemi     | **Yalnızca saat dilimini** içeren küçük bir `Geçerli Tarih ve Saat` bloğu (önbellek kararlılığı için saat değeri yoktur) | `userTimezone` ayarlanmamışsa ana makinenin saat dilimi | `agents.defaults.userTimezone`                         |

Sistem istemi, istem önbelleğe alımını turlar arasında kararlı tutmak için güncel saati bilinçli olarak içermez. Temsilci geçerli saate ihtiyaç duyduğunda `session_status` çağrısı yapar.

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

`userTimezone` ayarlanmamışsa OpenClaw, çalışma zamanında ana makinenin saat dilimini `Intl.DateTimeFormat().resolvedOptions().timeZone` aracılığıyla çözümler (yapılandırmaya yazmaz). `agents.defaults.timeFormat` (`auto` | `12` | `24`), sistem istemi bölümünde değil, zarflarda ve sonraki yüzeylerde 12/24 saatlik gösterimi denetler.

## Zarf saat dilimi değerleri

`agents.defaults.envelopeTimezone` şu değerleri kabul eder:

- `"local"` (varsayılan) veya `"host"` - ana makinenin saat dilimi.
- `"utc"` veya `"gmt"` - UTC.
- `"user"` - çözümlenmiş `agents.defaults.userTimezone` değeri (ayarlanmamışsa ana makinenin saat dilimine geri döner).
- Herhangi bir açık IANA bölge dizesi; örneğin `"Europe/Vienna"`.

## Ne zaman geçersiz kılınmalı?

- Farklı bölgelerdeki ana makineler arasında kararlı zaman damgaları sağlamak veya UTC ile uyumlu tanılama/günlük çıktısıyla eşleşmek için **`"utc"` kullanın**.
- Gateway ana makinesinin çalıştığı bölgeden bağımsız olarak zarfları yapılandırılmış kullanıcı saat dilimiyle uyumlu tutmak için **`"user"` kullanın**.
- Gateway ana makinesi bir bölgedeyken zarfın, ana makine taşınsa bile her zaman başka bir bölgenin saatini göstermesi gerektiğinde **sabit bir IANA bölgesi kullanın**.
- Zaman damgası bağlamı konuşma için yararlı olmadığında **`envelopeTimestamp: "off"` ayarlayın**. Bu, mutlak zaman damgalarını zarflardan, doğrudan temsilci istemi öneklerinden ve gömülü model girdisi öneklerinden kaldırır.

Davranışın tam başvurusu, sağlayıcı bazında örnekler ve geçen süre biçimlendirmesi için [Tarih ve Saat](/tr/date-time) bölümüne bakın.

## İlgili

- [Tarih ve Saat](/tr/date-time) - zarf/araç/istem davranışının tamamı ve örnekler.
- [Heartbeat](/tr/gateway/heartbeat) - etkin saatler, zamanlama için saat dilimini kullanır.
- [Cron İşleri](/tr/automation/cron-jobs) - cron ifadeleri, zamanlama için saat dilimini kullanır.
