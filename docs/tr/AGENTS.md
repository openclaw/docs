---
x-i18n:
    generated_at: "2026-05-10T19:20:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb1075777cead58155336aa27359c8c149748bec8a854ff1de1f75a992b8c8f
    source_path: AGENTS.md
    workflow: 16
---

# Belgeler Kılavuzu

Bu dizin, belge yazımından, Mintlify bağlantı kurallarından ve belge i18n politikasından sorumludur.

## Mintlify Kuralları

- Belgeler Mintlify üzerinde barındırılır (`https://docs.openclaw.ai`).
- `docs/**/*.md` içindeki dahili belge bağlantıları, `.md` veya `.mdx` soneki olmadan köke göreli kalmalıdır (örnek: `[Config](/gateway/configuration)`).
- Bölüm çapraz başvuruları köke göreli yollarda anchor kullanmalıdır (örnek: `[Hooks](/gateway/configuration-reference#hooks)`).
- Belge başlıkları em dash ve kesme işaretlerinden kaçınmalıdır, çünkü Mintlify anchor üretimi bunlarda kırılgandır.
- README ve GitHub tarafından işlenen diğer belgeler, bağlantıların Mintlify dışında da çalışması için mutlak belge URL'lerini korumalıdır.
- Belge içeriği genel kalmalıdır: kişisel cihaz adları, host adları veya yerel yollar olmamalıdır; `user@gateway-host` gibi yer tutucular kullanın.

## Belge İçeriği Kuralları

- Belgelerde, UI metinlerinde ve seçici listelerinde, bölüm açıkça çalışma zamanı sırasını veya otomatik algılama sırasını açıklamıyorsa hizmetleri/sağlayıcıları alfabetik olarak sıralayın.
- Birlikte gelen Plugin adlandırmasını, kök `AGENTS.md` içindeki depo genelindeki Plugin terminoloji kurallarıyla tutarlı tutun.

## Dahili Belgeler

- Uzun ömürlü özel operatör belgeleri `~/Projects/manager/docs/` içinde yer alır.
- Depoya yerel dahili taslak/yansıtma belgeleri yok sayılan `docs/internal/` altında bulunabilir.
- `docs/internal/**` sayfalarını asla `docs/docs.json` gezinmesine eklemeyin veya herkese açık belgelerden bu sayfalara bağlantı vermeyin.
- `scripts/docs-sync-publish.mjs`, bir sayfa daha sonra zorla eklenirse herkese açık `openclaw/docs` yayın deposundan `docs/internal/**` dosyalarını hariç tutar ve temizler.
- Dahili belgeler depo yollarından, özel uygulama adlarından, 1Password öğe adlarından ve runbook'lardan bahsedebilir, ancak asla gizli değerler içeremez.

## Belgeler i18n

- Yabancı dil belgeleri bu depoda sürdürülmez. Üretilen yayın çıktısı ayrı `openclaw/docs` deposunda bulunur (genellikle yerelde `../openclaw-docs` olarak klonlanır).
- Burada `docs/<locale>/**` altında yerelleştirilmiş belgeler eklemeyin veya düzenlemeyin.
- Bu depodaki İngilizce belgeleri ve sözlük dosyalarını doğruluk kaynağı olarak kabul edin.
- İş hattı: İngilizce belgeleri burada güncelleyin, gerektiğinde `docs/.i18n/glossary.<locale>.json` dosyasını güncelleyin, ardından yayın deposu senkronizasyonunun ve `scripts/docs-i18n` işleminin `openclaw/docs` içinde çalışmasına izin verin.
- `scripts/docs-i18n` işlemini yeniden çalıştırmadan önce, İngilizce kalması veya sabit bir çeviri kullanması gereken yeni teknik terimler, sayfa başlıkları veya kısa gezinme etiketleri için sözlük girdileri ekleyin.
- `pnpm docs:check-i18n-glossary`, değişen İngilizce belge başlıkları ve kısa dahili belge etiketleri için korumadır.
- Çeviri belleği, yayın deposundaki üretilmiş `docs/.i18n/*.tm.jsonl` dosyalarında bulunur.
- `docs/.i18n/README.md` dosyasına bakın.
