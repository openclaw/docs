---
x-i18n:
    generated_at: "2026-06-28T00:10:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c67d049eb1d0f1d4e675a71e69b2d34d3ce5c733ca9582bf08ac717c233644
    source_path: AGENTS.md
    workflow: 16
---

# Dokümantasyon Kılavuzu

Bu dizin dokümantasyon yazımını, Mintlify bağlantı kurallarını ve dokümantasyon i18n ilkesini yönetir.

## Mintlify Kuralları

- Dokümantasyon Mintlify üzerinde barındırılır (`https://docs.openclaw.ai`).
- `docs/**/*.md` içindeki dahili dokümantasyon bağlantıları, `.md` veya `.mdx` soneki olmadan köke göreli kalmalıdır (örnek: `[Yapılandırma](/gateway/configuration)`).
- Bölüm çapraz başvuruları köke göreli yollarda anchor kullanmalıdır (örnek: `[Kancalar](/gateway/configuration-reference#hooks)`).
- Dokümantasyon başlıkları uzun tirelerden ve kesme işaretlerinden kaçınmalıdır, çünkü Mintlify anchor üretimi bu noktalarda kırılgandır.
- README ve GitHub tarafından işlenen diğer dokümantasyonlar, bağlantıların Mintlify dışında da çalışması için mutlak dokümantasyon URL'lerini korumalıdır.
- Dokümantasyon içeriği genel kalmalıdır: kişisel cihaz adları, host adları veya yerel yollar kullanılmamalıdır; `user@gateway-host` gibi yer tutucular kullanın.

## Dokümantasyon İçerik Kuralları

- Dokümantasyon, UI metinleri ve seçici listeleri için, bölüm açıkça çalışma zamanı sırasını veya otomatik algılama sırasını açıklamıyorsa hizmetleri/sağlayıcıları alfabetik olarak sıralayın.
- Paketlenen Plugin adlandırmasını kök `AGENTS.md` içindeki depo genelindeki plugin terminoloji kurallarıyla tutarlı tutun.

## Dahili Dokümantasyon

- Uzun ömürlü özel operatör dokümantasyonu `~/Projects/manager/docs/` içinde bulunmalıdır.
- Depoya yerel dahili taslak/yansıtma dokümantasyonu, yok sayılan `docs/internal/` altında bulunabilir.
- `docs/internal/**` sayfalarını asla `docs/docs.json` navigasyonuna eklemeyin veya herkese açık dokümantasyondan bu sayfalara bağlantı vermeyin.
- `scripts/docs-sync-publish.mjs`, bir sayfa daha sonra zorla eklenirse `docs/internal/**` öğelerini herkese açık `openclaw/docs` yayın deposundan hariç tutar ve budar.
- Dahili dokümantasyon depo yollarından, özel uygulama adlarından, 1Password öğe adlarından ve çalışma talimatlarından bahsedebilir, ancak gizli değerleri asla içermemelidir.

## Olgunluk Karnesi Düzenleme

`taxonomy.yaml` ve `qa/maturity-scores.yaml` kaynak girdilerdir; `docs/maturity/` altındaki oluşturulmuş olgunluk dokümantasyonu projeksiyonlardır ve puan, LTS, taksonomi, QA profili veya kanıt tabloları için elle düzenlenmemelidir.
`scripts/qa/render-maturity-docs.ts` üretimi yönetir; commit edilmiş dokümantasyonu yenilemek için `pnpm maturity:render`, doğrulamak için `pnpm maturity:check` kullanın.
`.github/workflows/maturity-scorecard.yml` yapıt önizlemelerini işler ve oluşturulmuş dokümantasyon PR'ları açabilir; `.github/workflows/openclaw-release-checks.yml` bunu sürüm QA için tetikler.
Bir maintainer açıkça temizlenmiş ve commit edilmiş bir projeksiyon istemedikçe deterministik `qa-evidence.json.scorecard` verilerini GitHub Actions yapıtlarında tutun.
İnsan geçersiz kılmaları, kaynak durumunu bir PR içinde değiştirmeli ve nedeni, herkese açık veya redakte edilmiş kanıtla birlikte açıklamalıdır.

## Dokümantasyon i18n

- Yabancı dil dokümantasyonları bu depoda tutulmaz. Oluşturulan yayın çıktısı ayrı `openclaw/docs` deposunda bulunur (genellikle yerelde `../openclaw-docs` olarak klonlanır).
- Burada `docs/<locale>/**` altında yerelleştirilmiş dokümantasyon eklemeyin veya düzenlemeyin.
- Bu depodaki İngilizce dokümantasyonu ve glossary dosyalarını doğruluk kaynağı olarak kabul edin.
- Pipeline: İngilizce dokümantasyonu burada güncelleyin, gerektiğinde `docs/.i18n/glossary.<locale>.json` dosyasını güncelleyin, ardından yayın deposu senkronizasyonunun ve `scripts/docs-i18n` betiğinin `openclaw/docs` içinde çalışmasına izin verin.
- `scripts/docs-i18n` yeniden çalıştırılmadan önce, İngilizce kalması veya sabit bir çeviri kullanması gereken yeni teknik terimler, sayfa başlıkları veya kısa nav etiketleri için glossary girdileri ekleyin.
- `pnpm docs:check-i18n-glossary`, değişen İngilizce dokümantasyon başlıkları ve kısa dahili dokümantasyon etiketleri için korumadır.
- Çeviri belleği, yayın deposundaki oluşturulmuş `docs/.i18n/*.tm.jsonl` dosyalarında bulunur.
- Bkz. `docs/.i18n/README.md`.
