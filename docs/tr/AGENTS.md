---
x-i18n:
    generated_at: "2026-07-12T12:01:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# Dokümantasyon Kılavuzu

Bu dizin; dokümantasyon yazımını, Mintlify bağlantı kurallarını ve dokümantasyon i18n politikasını yönetir.

## Mintlify Kuralları

- Dokümantasyon Mintlify üzerinde barındırılır (`https://docs.openclaw.ai`).
- `docs/**/*.md` içindeki dahili dokümantasyon bağlantıları, `.md` veya `.mdx` uzantısı olmadan köke göreli kalmalıdır (örnek: `[Yapılandırma](/gateway/configuration)`).
- Bölümler arası başvurularda köke göreli yollardaki bağlantı işaretleri kullanılmalıdır (örnek: `[Kancalar](/gateway/configuration-reference#hooks)`).
- Mintlify bağlantı işareti oluşturma işlemi bu karakterlerde kırılgan olduğundan, dokümantasyon başlıklarında uzun tire ve kesme işaretinden kaçınılmalıdır.
- README ve GitHub tarafından işlenen diğer dokümanlar, bağlantıların Mintlify dışında da çalışması için mutlak dokümantasyon URL'lerini korumalıdır.
- Dokümantasyon içeriği genel kalmalıdır: kişisel cihaz adları, ana makine adları veya yerel yollar kullanılmamalı; `user@gateway-host` gibi yer tutucular kullanılmalıdır.

## Dokümantasyon İçeriği Kuralları

- Dokümantasyonda, kullanıcı arayüzü metinlerinde ve seçici listelerinde hizmetleri/sağlayıcıları alfabetik olarak sıralayın; bölüm açıkça çalışma zamanı sırasını veya otomatik algılama sırasını açıklıyorsa bu kural geçerli değildir.
- Birlikte gelen Plugin adlandırmasını, kök `AGENTS.md` dosyasındaki depo genelindeki Plugin terminolojisi kurallarıyla tutarlı tutun.
- Oluşturulan dokümanları asla elle düzenlemeyin: `docs/plugins/reference/**`, `docs/plugins/reference.md` ve `docs/plugins/plugin-inventory.md`, `pnpm plugins:inventory:gen` komutundan; `docs/docs_map.md`, `pnpm docs:map:gen` komutundan; `docs/maturity/**` ise `pnpm maturity:render` komutundan oluşturulur.

## Dahili Dokümantasyon

- Uzun ömürlü özel operatör dokümanları `~/Projects/manager/docs/` altında bulunmalıdır.
- Depoya özgü dahili taslak/yansıtma dokümanları, yok sayılan `docs/internal/` altında bulunabilir.
- `docs/internal/**` sayfalarını asla `docs/docs.json` gezinmesine eklemeyin veya genel dokümantasyondan bunlara bağlantı vermeyin.
- Bir sayfa daha sonra zorla eklenirse `scripts/docs-sync-publish.mjs`, `docs/internal/**` içeriğini genel `openclaw/docs` yayımlama deposundan hariç tutar ve temizler.
- Dahili dokümanlarda depo yolları, özel uygulama adları, 1Password öğe adları ve işletim kılavuzları belirtilebilir; ancak gizli değerler asla dahil edilmemelidir.

## Olgunluk Puan Kartını Düzenleme

`taxonomy.yaml` ve `qa/maturity-scores.yaml` kaynak girdileridir; `docs/maturity/` altındaki oluşturulan olgunluk dokümanları izdüşümlerdir ve puan, LTS, sınıflandırma, kalite güvencesi profili veya kanıt tabloları için elle düzenlenmemelidir.
Oluşturma işlemini `scripts/qa/render-maturity-docs.ts` yönetir; kaydedilmiş dokümanları yenilemek için `pnpm maturity:render`, doğrulamak için `pnpm maturity:check` kullanın.
`.github/workflows/maturity-scorecard.yml`, yapıt önizlemelerini oluşturur ve oluşturulan dokümanlar için PR'lar açabilir; `.github/workflows/openclaw-release-checks.yml`, sürüm kalite güvencesi için bunu çalıştırır.
Bir bakım sorumlusu açıkça arındırılmış ve depoya kaydedilmiş bir izdüşüm istemedikçe belirlenimci `qa-evidence.json.scorecard` verilerini GitHub Actions yapıtlarında tutun.
İnsan müdahaleleri, kaynak durumunu bir PR içinde değiştirmeli ve gerekçeyi genel veya sansürlenmiş kanıtlarla açıklamalıdır.

## Dokümantasyon i18n

- Yabancı dildeki dokümanlar bu depoda yönetilmez. Oluşturulan yayımlama çıktısı ayrı `openclaw/docs` deposunda bulunur (genellikle yerel olarak `../openclaw-docs` konumuna klonlanır).
- Burada `docs/<locale>/**` altına yerelleştirilmiş doküman eklemeyin veya mevcut olanları düzenlemeyin.
- Bu depodaki İngilizce dokümanları ve sözlük dosyalarını doğruluğun kaynağı olarak kabul edin.
- İşlem hattı: Buradaki İngilizce dokümanları güncelleyin, gerektiğinde `docs/.i18n/glossary.<locale>.json` dosyasını güncelleyin, ardından yayımlama deposu eşitlemesinin ve `openclaw/docs` içindeki `scripts/docs-i18n` işleminin çalışmasına izin verin.
- `scripts/docs-i18n` işlemini yeniden çalıştırmadan önce İngilizce kalması veya sabit bir çeviri kullanması gereken tüm yeni teknik terimler, sayfa başlıkları veya kısa gezinme etiketleri için sözlük girdileri ekleyin.
- `pnpm docs:check-i18n-glossary`, değiştirilen İngilizce doküman başlıkları ve kısa dahili doküman etiketleri için koruma denetimidir.
- Çeviri belleği, yayımlama deposunda oluşturulan `docs/.i18n/*.tm.jsonl` dosyalarında bulunur.
- `docs/.i18n/README.md` dosyasına bakın.
