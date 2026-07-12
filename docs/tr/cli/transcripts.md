---
read_when:
    - Terminalden saklanan transkript özetlerini okumak istiyorsunuz.
    - Transkriptlerin Markdown özetinin yoluna ihtiyacınız var
    - Temel transkript depolama düzeninde hata ayıklıyorsunuz
summary: '`openclaw transcripts` için CLI başvurusu (saklanan transkriptleri listeleme, gösterme ve bulma)'
title: Transkriptler CLI
x-i18n:
    generated_at: "2026-07-12T12:11:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

`transcripts` agent aracı tarafından yazılan transkriptler için salt okunur inceleyici.
Yakalama, içe aktarma ve özetleme bu CLI üzerinden değil, söz konusu araç üzerinden çalışır.

Yapıtlar durum dizini altında bulunur:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

Varsayılan durum dizini `~/.openclaw` dizinidir; `OPENCLAW_STATE_DIR` ile geçersiz kılabilirsiniz.
Tarih dizini oturumun başlangıç zamanından gelir; oturum dizini ise oturum kimliğinden türetilmiş, dosya sistemi açısından güvenli bir kısa addır.

## Komutlar

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

| Komut                         | Açıklama                                               |
| ----------------------------- | ------------------------------------------------------ |
| `list`                        | Saklanan oturumları listeler.                          |
| `show <session>`              | Saklanan `summary.md` dosyasını yazdırır.              |
| `path <session>`              | `summary.md` yolunu yazdırır.                          |
| `path <session> --dir`        | Oturum dizinini yazdırır.                              |
| `path <session> --metadata`   | `metadata.json` dosyasını yazdırır.                    |
| `path <session> --transcript` | `transcript.jsonl` dosyasını yazdırır.                 |
| `--json`                      | Makine tarafından okunabilir çıktı yazdırır (tüm alt komutlar). |

`<session>`, yalnızca oturum kimliğini veya tarih içeren bir seçiciyi
(`YYYY-MM-DD/<session>`) kabul eder. Aynı oturum kimliği birden fazla günde
geçiyorsa nitelikli biçimi kullanın; örneğin `openclaw transcripts show
2026-05-22/standup`. Varsayılan oturum kimlikleri bir zaman damgası ve rastgele
bir son ek içerir; bir oturuma yalnızca kimlik aynı gün içinde benzersiz olacaksa
sabit bir kimlik verin.

## Çıktı

`list`, her oturum için sekmeyle ayrılmış tek bir satır yazdırır: seçici, başlangıç zamanı, başlık,
özet yolu.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Haftalık durum toplantısı  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

Seçici, `show` veya `path` komutuna geri iletilecek en güvenli değerdir.

`list --json`; `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary` alanlarını içeren nesneler döndürür.

`show --json`; saklanan oturum meta verilerini, seçiciyi, oturum
dizinini, özet yolunu ve özet Markdown metnini döndürür.

`path --json`, seçilen yolu ve ilgili dosyanın var olup olmadığını döndürür.

## Gün başına birden çok oturum

Oturumlar önce tarihe, ardından oturum kimliğine göre gruplanır. Bir gündeki on
toplantı, on kardeş klasöre dönüşür:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Otomasyon için varsayılan olarak oluşturulan kimlikleri kullanın. `standup` gibi sabit bir kimliği yalnızca
aynı tarihte tekrarlanmayacaksa kullanın.

## Eksik özetler

Canlı oturumlar, oturum durduğunda `summary.md` dosyasını yazar; içe aktarılan transkriptler
ise içe aktarmanın hemen ardından bu dosyayı yazar. Yakalama hâlâ etkinken, durdurma sırasında
bir sağlayıcı başarısız olduğunda veya herhangi bir konuşma ulaşmadan önce meta veriler
yazıldığında bir oturum, özeti olmadan `list` içinde görünebilir.

Salt eklemeli ham transkripti incelemek için `path <session> --transcript`
komutunu kullanın veya Markdown özetini yeniden oluşturmak için `transcripts`
aracının `summarize` eylemini çalıştırın.

## Yapılandırma

Yakalama isteğe bağlıdır (canlı kaynaklar toplantı sesine katılıp kaydedebilir). Şununla
etkinleştirin:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled` (varsayılan `false`): aracı etkinleştirir.
- `maxUtterances` (varsayılan `2000`, 1-10000 aralığıyla sınırlandırılır): oturum başına
  konuşma arabelleği boyutu.

Otomatik başlatma kaynaklarını `transcripts.autoStart` ile yapılandırın. Her girdi
mevcut olduğunda etkinleştirilir; ilgili kaynağı devre dışı bırakmak için girdiyi atlayın. `discord-voice`,
paketle birlikte gelen ve otomatik başlatmayı destekleyen kaynaktır; `guildId` ve
`channelId` gerektirir:

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
