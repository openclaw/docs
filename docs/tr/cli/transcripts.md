---
read_when:
    - Terminalden saklanan transkript özetlerini okumak istiyorsunuz
    - Bir transkriptler markdown özetinin yoluna ihtiyacınız var
    - Temel transkript depolama düzeninde hata ayıklıyorsunuz
summary: '`openclaw transcripts` için CLI başvurusu (saklanan transkriptleri listeleme, gösterme ve bulma)'
title: Transcripts CLI
x-i18n:
    generated_at: "2026-06-28T00:25:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae6010cfb4e051182f1c48d0d728b30d054542e1e7983ff15a2432840193f9c0
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

OpenClaw'ın çekirdek `transcripts` aracı tarafından yazılan transkriptleri inceleyin. Bu CLI
salt okunurdur; yakalama, içe aktarma ve özetleme agent aracı ile
yapılandırılmış otomatik başlatma kaynaklarına aittir.

Dünkü notları bulmak, Markdown dosyasını bir düzenleyicide açmak, bir transkripti
başka bir araca vermek veya bir oturumun diskte nereye kaydedildiğini ayıklamak
istediğinizde CLI'yi kullanın. Yakalamayı başlatmaz veya durdurmaz.

Yapıtlar OpenClaw durum dizini altında bulunur:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

Varsayılan durum dizini `~/.openclaw` dizinidir; farklı bir dizin kullanmak için
`OPENCLAW_STATE_DIR` ayarlayın. Tarih dizini oturum başlangıç zamanından gelir ve
oturum dizini, oturum kimliğinden türetilmiş güvenli bir dosya sistemi segmentidir.

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

- `list`: saklanan oturumları, tarih nitelemeli seçiciyi, başlangıç zamanını, başlığı ve `summary.md` yolunu listeler.
- `show <session>`: saklanan `summary.md` içeriğini yazdırır.
- `path <session>`: `summary.md` yolunu yazdırır.
- `path <session> --dir`: oturum dizinini yazdırır.
- `path <session> --metadata`: `metadata.json` dosyasını yazdırır.
- `path <session> --transcript`: `transcript.jsonl` dosyasını yazdırır.
- `--json`: makine tarafından okunabilir çıktı yazdırır.

İnsan tarafından verilen bir oturum kimliği günler arasında tekrarlandığında,
`list` çıktısındaki tarih nitelemeli seçiciyi kullanın; örneğin
`openclaw transcripts show 2026-05-22/standup`. Varsayılan oturum kimlikleri bir
zaman damgası ve rastgele sonek içerir; sabit oturum kimliklerini yalnızca gün
içinde benzersiz olduklarında yapılandırın.

## Çıktı

`list`, her satıra bir oturum yazdırır:

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/alex/.openclaw/transcripts/2026-05-22/standup/summary.md
```

Çıktı sekmeyle ayrılır. Sütunlar seçici, başlangıç zamanı, başlık ve özet yoludur.
Seçici, `show` veya `path` komutuna geri vermek için en güvenli değerdir.

`list --json`, şu alanlara sahip nesneler yazdırır:

- `sessionId`
- `selector`
- `date`
- `title`
- `startedAt`
- `stoppedAt`
- `source`
- `path`
- `summaryPath`
- `hasSummary`

`show --json`, saklanan oturum meta verilerini, seçiciyi, oturum dizinini, özet
yolunu ve özet Markdown metnini döndürür. `path --json`, seçilen yolu ve o
dosyanın var olup olmadığını döndürür.

## Günde çok sayıda toplantı

Transkriptler oturumları önce tarihe, sonra oturum kimliğine göre gruplar. Bir
gündeki on toplantı, on kardeş klasöre dönüşür:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Çoğu otomasyon için varsayılan oluşturulan kimlikleri kullanın. `standup` gibi
sabit bir kimliği yalnızca aynı kimlik aynı tarihte iki kez kullanılmayacaksa
kullanın.

## Eksik özetler

Canlı oturumlar, oturum durduğunda `summary.md` yazar. İçe aktarılan transkriptler
içe aktarmadan hemen sonra `summary.md` yazar. Yakalama etkinken, durdurma sırasında
bir sağlayıcı başarısız olduğunda veya herhangi bir ifade gelmeden önce meta
veriler yazıldığında bir oturum yine de `list` içinde özet olmadan görünebilir.

Salt eklemeli transkripti incelemek için `path <session> --transcript` kullanın ve
Markdown özetini yeniden oluşturmak için `transcripts` araç eylemi `summarize`
kullanın.

## Yapılandırma

Transkript yakalama isteğe bağlıdır, çünkü canlı kaynaklar toplantı sesine
katılabilir ve onu kaydedebilir. Aracı üst düzey `transcripts.enabled` ile
etkinleştirin:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

Otomatik başlatma kaynaklarını `openclaw.json` içinde `transcripts.autoStart` ile
yapılandırın. Her giriş mevcut olduğunda etkinleştirilir; bir kaynağı devre dışı
bırakmak için ilgili girişi atlayın.

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      },
      {
        "providerId": "slack-huddle",
        "accountId": "workspace",
        "channelId": "C123"
      }
    ]
  }
}
```
