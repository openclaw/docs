---
read_when:
    - Zaman damgalarının modele veya kullanıcılara nasıl gösterildiğini değiştiriyorsunuz
    - Mesajlardaki veya sistem istemi çıktısındaki zaman biçimlendirmesinde hata ayıklıyorsunuz
summary: Zarf, istem, araç ve bağlayıcılarda tarih ve saat işleme
title: Tarih ve saat
x-i18n:
    generated_at: "2026-07-12T11:41:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6f923022c021c1cf18ba306cd7b9a4873f5df947bb9a8fae9c737a89f64cbf2
    source_path: date-time.md
    workflow: 16
---

OpenClaw, **aktarım zaman damgaları için ana makinenin yerel saatini** kullanır ve sistem istemine **yalnızca saat dilimini** ekler.
Sağlayıcı zaman damgaları korunur; böylece araçlar kendi doğal anlamlarını korur. Temsilcinin geçerli
saate ihtiyacı olduğunda `session_status` aracını çalıştırır.

## İleti zarfları (varsayılan olarak yerel)

Gelen iletiler, haftanın günü ve saniye hassasiyetinde bir zaman damgasıyla sarmalanır:

```
[WhatsApp +1555 Pzt 2026-01-05 16:26:34 PST] ileti metni
```

Zarf zaman damgası, sağlayıcının saat diliminden bağımsız olarak **varsayılan biçimde ana makinenin yerel saatindedir**.
`agents.defaults` altında geçersiz kılın:

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

| Anahtar             | Değerler                                             | Davranış                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `envelopeTimezone`  | `local` (varsayılan), `utc`, `user`, açık IANA adı   | `user`, `agents.defaults.userTimezone` değerini kullanır (ayarlanmamışsa ana makinenin saat dilimi). Açık bir IANA adı (ör. `"America/Chicago"`) sabit bir bölge belirler; tanınmayan adlar UTC'ye geri döner. |
| `envelopeTimestamp` | `on` (varsayılan), `off`                             | `off`, zarf başlıklarından, doğrudan temsilci istemi öneklerinden ve gömülü model girdisi öneklerinden mutlak zaman damgalarını kaldırır.                                                                  |
| `envelopeElapsed`   | `on` (varsayılan), `off`                             | `off`, oturumdaki önceki iletiden bu yana gösterilen geçen süre son ekini (`+30s` / `+2m` biçimi) kaldırır.                                                                                                |

### Örnekler

**Yerel (varsayılan):**

```
[WhatsApp +1555 Paz 2026-01-18 00:19:42 PST] merhaba
```

**Kullanıcı saat dilimi:**

```
[WhatsApp +1555 Paz 2026-01-18 00:19:42 CST] merhaba
```

**`envelopeTimezone: "utc"` ile geçen süre:**

```
[WhatsApp +1555 +30s Paz 2026-01-18T05:19:00Z] devam iletisi
```

## Sistem istemi: geçerli tarih ve saat

Sistem istemi, istem önbelleğe alımının kararlı kalması için **yalnızca saat dilimini**
(saat veya saat biçimi olmadan) içeren bir **Geçerli Tarih ve Saat** bölümü içerir:

```
Saat dilimi: America/Chicago
```

Bölge, yapılandırılmışsa `agents.defaults.userTimezone`; aksi durumda ana makinenin saat dilimidir.
İstem ayrıca temsilciye geçerli tarih, saat veya haftanın gününe ihtiyaç duyduğunda
`session_status` aracını çalıştırmasını söyler.

## Sistem olayı satırları (varsayılan olarak yerel)

Temsilci bağlamına eklenen kuyruktaki sistem olaylarının başına, ileti zarflarıyla aynı
`envelopeTimezone` seçimini kullanan bir zaman damgası eklenir (varsayılan: ana makinenin yerel saati).

```
Sistem: [2026-01-12 12:19:17 PST] Model değiştirildi.
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

- `userTimezone`, istem bağlamı (ve `envelopeTimezone: "user"`) için **kullanıcının yerel saat dilimini** ayarlar.
- `timeFormat`, istemde gösterilen saatlerin **12/24 saatlik gösterimini** denetler. `auto`, işletim sistemi tercihlerini izler.

## Saat biçimi algılama (otomatik)

`timeFormat: "auto"` olduğunda OpenClaw, işletim sistemi tercihini (macOS ve Windows)
inceler ve bulunamazsa yerel ayar biçimlendirmesine geri döner. Algılanan değer, yinelenen sistem
çağrılarını önlemek için **işlem başına önbelleğe alınır**.

## Araç yükleri ve bağlayıcılar (ham sağlayıcı saati ve normalleştirilmiş alanlar)

Kanal araçları, **sağlayıcının doğal zaman damgalarını** döndürür ve tutarlılık için normalleştirilmiş alanlar ekler:

- `timestampMs`: dönem başlangıcından itibaren milisaniye (UTC)
- `timestampUtc`: ISO 8601 UTC dizesi

Hiçbir şeyin kaybolmaması için ham sağlayıcı alanları korunur.

- Discord: UTC ISO zaman damgaları
- Slack: API'den gelen dönem başlangıcı benzeri dizeler
- Telegram/WhatsApp: sağlayıcıya özgü sayısal/ISO zaman damgaları

Yerel saate ihtiyacınız varsa bilinen saat dilimini kullanarak sonraki aşamada dönüştürün.

## İlgili belgeler

- [Sistem İstemi](/tr/concepts/system-prompt)
- [Saat Dilimleri](/tr/concepts/timezone)
- [İletiler](/tr/concepts/messages)
