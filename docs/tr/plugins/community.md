---
doc-schema-version: 1
read_when:
    - Üçüncü taraf OpenClaw Plugin'lerini bulmak istiyorsunuz
    - Kendi Plugin’inizi ClawHub’da yayımlamak veya listelemek istiyorsunuz
summary: Topluluk tarafından bakımı yapılan OpenClaw Plugin'lerini bulun ve yayımlayın
title: Topluluk Plugin’leri
x-i18n:
    generated_at: "2026-06-28T00:52:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

Topluluk Plugin'leri, OpenClaw'ı kanallar, araçlar, sağlayıcılar, hook'lar veya diğer yeteneklerle genişleten üçüncü taraf paketlerdir. Herkese açık topluluk Plugin'leri için birincil keşif yüzeyi olarak [ClawHub](/tr/clawhub) kullanın.

## Plugin bulma

CLI'dan ClawHub'da arama yapın:

```bash
openclaw plugins search "calendar"
```

Açık bir kaynak önekiyle ClawHub Plugin'i kurun:

```bash
openclaw plugins install clawhub:<package-name>
```

npm, geçiş lansmanı sırasında desteklenen bir doğrudan kurulum yolu olmaya devam eder:

```bash
openclaw plugins install npm:<package-name>
```

Yaygın kurulum, güncelleme, inceleme ve kaldırma örnekleri için [Plugin'leri yönet](/tr/plugins/manage-plugins) sayfasını kullanın. Tam komut başvurusu ve kaynak seçimi kuralları için [`openclaw plugins`](/tr/cli/plugins) sayfasını kullanın.

## Plugin yayımlama

OpenClaw kullanıcılarının keşfedip kurmasını istediğiniz herkese açık topluluk Plugin'lerini ClawHub'da yayımlayın. Canlı paket listesinin, sürüm geçmişinin, tarama durumunun ve kurulum ipuçlarının sahibi ClawHub'dır; belgeler statik bir üçüncü taraf Plugin kataloğu tutmaz.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Yayımlamadan önce Plugin'in paket meta verilerine, Plugin manifest'ine, kurulum belgelerine ve açık bir bakım sahibine sahip olduğundan emin olun. ClawHub, bir sürüm oluşturmadan önce sahip kapsamını, paket adını, sürümü, dosya sınırlarını ve kaynak meta verilerini doğrular; ardından inceleme ve doğrulama bitene kadar yeni sürümleri normal kurulum ve indirme yüzeylerinden gizli tutar.

Yayımlamadan önce bu kontrol listesini kullanın:

| Gereksinim             | Neden                                                       |
| ---------------------- | ----------------------------------------------------------- |
| ClawHub'da yayımlanmış | Kullanıcıların `openclaw plugins install` ipuçlarının çalışmasına ihtiyacı vardır |
| Herkese açık GitHub deposu | Kaynak incelemesi, sorun takibi, şeffaflık             |
| Kurulum ve kullanım belgeleri | Kullanıcıların nasıl yapılandıracaklarını bilmesi gerekir |
| Aktif bakım            | Yakın tarihli güncellemeler veya duyarlı sorun yönetimi     |

Tam yayımlama sözleşmesi için bu sayfaları kullanın:

- [ClawHub yayımlama](/tr/clawhub/publishing), sahipleri, kapsamları, sürümleri, incelemeyi, paket doğrulamayı ve paket aktarımını açıklar.
- [Plugin oluşturma](/tr/plugins/building-plugins), Plugin paket şeklini ve ilk yayımlama iş akışını gösterir.
- [Plugin manifest'i](/tr/plugins/manifest), yerel Plugin manifest alanlarını tanımlar.

## İlgili

- [Plugin'ler](/tr/tools/plugin) - kurma, yapılandırma, yeniden başlatma ve sorun giderme
- [Plugin'leri yönet](/tr/plugins/manage-plugins) - komut örnekleri
- [ClawHub yayımlama](/tr/clawhub/publishing) - yayımlama ve sürüm kuralları
