---
x-i18n:
    generated_at: "2026-04-05T13:42:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: f07671afbba2efa77f5fb43ebed242d0fdca835f7810fdd60998e537b73d1efc
    source_path: .i18n/README.md
    workflow: 15
---

# OpenClaw belge i18n varlıkları

Bu klasör, kaynak belge deposu için çeviri yapılandırmasını depolar.

Oluşturulan yerel ayar ağaçları ve canlı çeviri belleği artık yayın deposunda bulunuyor:

- depo: `openclaw/docs`
- yerel kopya: `~/Projects/openclaw-docs`

## Doğruluk kaynağı

- İngilizce belgeler `openclaw/openclaw` içinde yazılır.
- Kaynak belge ağacı `docs/` altında bulunur.
- Kaynak depo artık `docs/zh-CN/**`, `docs/ja-JP/**`, `docs/es/**`, `docs/pt-BR/**`, `docs/ko/**`, `docs/de/**`, `docs/fr/**`, `docs/ar/**`, `docs/it/**`, `docs/tr/**`, `docs/id/**` veya `docs/pl/**` gibi işlenmiş yerel ayar ağaçlarını commit edilmiş halde tutmaz.

## Uçtan uca akış

1. İngilizce belgeleri `openclaw/openclaw` içinde düzenleyin.
2. `main` dalına gönderin.
3. `openclaw/openclaw/.github/workflows/docs-sync-publish.yml`, belge ağacını `openclaw/docs` içine yansıtır.
4. Senkronizasyon betiği, kaynak depoda artık commit edilmemiş olsalar bile, oluşturulan yerel ayar seçici bloklarının orada bulunması için yayın `docs/docs.json` dosyasını yeniden yazar.
5. `openclaw/docs/.github/workflows/translate-zh-cn.yml`, `docs/zh-CN/**` içeriğini günde bir kez, isteğe bağlı olarak ve kaynak depo yayın dağıtımlarından sonra yeniler.
6. `openclaw/docs/.github/workflows/translate-ja-jp.yml`, `docs/ja-JP/**` için aynısını yapar.
7. `openclaw/docs/.github/workflows/translate-es.yml`, `translate-pt-br.yml`, `translate-ko.yml`, `translate-de.yml`, `translate-fr.yml`, `translate-ar.yml`, `translate-it.yml`, `translate-tr.yml`, `translate-id.yml` ve `translate-pl.yml` de `docs/es/**`, `docs/pt-BR/**`, `docs/ko/**`, `docs/de/**`, `docs/fr/**`, `docs/ar/**`, `docs/it/**`, `docs/tr/**`, `docs/id/**` ve `docs/pl/**` için aynısını yapar.

## Bu ayrım neden var

- Oluşturulan yerel ayar çıktısını ana ürün deposunun dışında tutmak.
- Mintlify'ı tek bir yayımlanmış belge ağacında tutmak.
- Yayın deposunun oluşturulan yerel ayar ağaçlarının sahibi olmasına izin vererek yerleşik dil değiştiriciyi korumak.

## Bu klasördeki dosyalar

- `glossary.<lang>.json` — istem yönlendirmesi olarak kullanılan tercih edilen terim eşlemeleri.
- `ar-navigation.json`, `de-navigation.json`, `es-navigation.json`, `fr-navigation.json`, `id-navigation.json`, `it-navigation.json`, `ja-navigation.json`, `ko-navigation.json`, `pl-navigation.json`, `pt-BR-navigation.json`, `tr-navigation.json`, `zh-Hans-navigation.json` — senkronizasyon sırasında yayın deposuna yeniden eklenen Mintlify yerel ayar seçici blokları.
- `<lang>.tm.jsonl` — iş akışı + model + metin karmasına göre anahtarlanan çeviri belleği.

Bu depoda, `docs/.i18n/zh-CN.tm.jsonl`, `docs/.i18n/ja-JP.tm.jsonl`, `docs/.i18n/es.tm.jsonl`, `docs/.i18n/pt-BR.tm.jsonl`, `docs/.i18n/ko.tm.jsonl`, `docs/.i18n/de.tm.jsonl`, `docs/.i18n/fr.tm.jsonl`, `docs/.i18n/ar.tm.jsonl`, `docs/.i18n/it.tm.jsonl`, `docs/.i18n/tr.tm.jsonl`, `docs/.i18n/id.tm.jsonl` ve `docs/.i18n/pl.tm.jsonl` gibi oluşturulan yerel ayar TM dosyaları kasıtlı olarak artık commit edilmez.

## Sözlük biçimi

`glossary.<lang>.json`, girdilerden oluşan bir dizidir:

```json
{
  "source": "troubleshooting",
  "target": "故障排除"
}
```

Alanlar:

- `source`: tercih edilecek İngilizce (veya kaynak) ifade.
- `target`: tercih edilen çeviri çıktısı.

## Çeviri mekanikleri

- `scripts/docs-i18n` hâlâ çeviri üretiminin sahibidir.
- Belge modu, her çevrilmiş sayfaya `x-i18n.source_hash` yazar.
- Her yayın iş akışı, geçerli İngilizce kaynak karmasını depolanmış yerel ayar `x-i18n.source_hash` değeriyle karşılaştırarak bekleyen dosya listesini önceden hesaplar.
- Bekleyen sayı `0` ise, pahalı çeviri adımı tamamen atlanır.
- Bekleyen dosyalar varsa, iş akışı yalnızca bu dosyaları çevirir.
- Yayın iş akışı geçici model-biçim hatalarını yeniden dener, ancak aynı karma denetimi her yeniden denemede çalıştığı için değişmemiş dosyalar atlanmış olarak kalır.
- Kaynak depo ayrıca yayımlanmış GitHub sürümlerinden sonra zh-CN, ja-JP, es, pt-BR, ko, de, fr, ar, it, tr, id ve pl yenilemelerini tetikler; böylece sürüm belgeleri günlük cron'u beklemeden güncellenebilir.

## Operasyon notları

- Senkronizasyon meta verileri yayın deposunda `.openclaw-sync/source.json` dosyasına yazılır.
- Kaynak depo sırrı: `OPENCLAW_DOCS_SYNC_TOKEN`
- Yayın depo sırrı: `OPENCLAW_DOCS_I18N_OPENAI_API_KEY`
- Yerel ayar çıktısı güncel görünmüyorsa, önce `openclaw/docs` içindeki eşleşen `Translate <locale>` iş akışını kontrol edin.
