---
doc-schema-version: 1
read_when:
    - Üçüncü taraf OpenClaw pluginlerini bulmak istiyorsunuz
    - ClawHub'da kendi Plugin'inizi yayımlamak veya listelemek istiyorsunuz
summary: Topluluk tarafından sürdürülen OpenClaw pluginlerini bulma ve yayımlama
title: Topluluk eklentileri
x-i18n:
    generated_at: "2026-07-12T11:58:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

Topluluk pluginleri; OpenClaw'ı kanallar, araçlar, sağlayıcılar, kancalar veya diğer yeteneklerle genişleten üçüncü taraf paketlerdir. Herkese açık topluluk pluginlerini keşfetmek için birincil kaynak olarak [ClawHub](/clawhub) kullanın.

## Pluginleri bulma

CLI üzerinden ClawHub'da arama yapın:

```bash
openclaw plugins search "calendar"
```

Açık bir kaynak önekiyle ClawHub plugini yükleyin:

```bash
openclaw plugins install clawhub:<package-name>
```

Lansman geçişi sırasında npm, desteklenen doğrudan yükleme yöntemi olmaya devam eder:

```bash
openclaw plugins install npm:<package-name>
```

Yaygın yükleme, güncelleme, inceleme ve kaldırma örnekleri için [Pluginleri yönetme](/tr/plugins/manage-plugins) sayfasını kullanın. Tam komut başvurusu ve kaynak seçme kuralları için [`openclaw plugins`](/tr/cli/plugins) sayfasını kullanın.

## Pluginleri yayımlama

Herkese açık topluluk pluginlerini ClawHub'da yayımlayarak OpenClaw kullanıcılarının bunları keşfedip yükleyebilmesini sağlayın. Canlı paket listesi, sürüm geçmişi, tarama durumu ve yükleme ipuçları ClawHub tarafından yönetilir; belgelerde statik bir üçüncü taraf plugin kataloğu tutulmaz.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Yayımlamadan önce pluginin paket meta verilerine, plugin manifestine, kurulum belgelerine ve açıkça belirtilmiş bir bakım sorumlusuna sahip olduğundan emin olun. ClawHub, bir sürüm oluşturmadan önce sahip kapsamını, paket adını, sürümü, dosya sınırlarını ve kaynak meta verilerini doğrular; ardından inceleme ve doğrulama tamamlanana kadar yeni sürümleri normal yükleme ve indirme alanlarında gizli tutar.

Yayımlamadan önce kontrol listesi:

| Gereksinim              | Nedeni                                                       |
| ----------------------- | ------------------------------------------------------------ |
| ClawHub'da yayımlanmış  | `openclaw plugins install` ipuçlarının çalışması gerekir     |
| Herkese açık GitHub deposu | Kaynak incelemesi, sorun takibi ve şeffaflık               |
| Kurulum ve kullanım belgeleri | Kullanıcıların yapılandırmayı nasıl yapacağını bilmesi gerekir |
| Etkin bakım             | Yakın tarihli güncellemeler veya sorunlara hızlı yanıt verilmesi |

Tam yayımlama sözleşmesi:

- [ClawHub'da yayımlama](/tr/clawhub/publishing) - sahipler, kapsamlar, sürümler, inceleme, paket doğrulaması ve paket aktarımı
- [Plugin oluşturma](/tr/plugins/building-plugins) - plugin paketinin yapısı ve ilk yayımlama iş akışı
- [Plugin manifesti](/tr/plugins/manifest) - yerel plugin manifesti alanları

## İlgili

- [Pluginler](/tr/tools/plugin) - yükleme, yapılandırma, yeniden başlatma ve sorun giderme
- [Pluginleri yönetme](/tr/plugins/manage-plugins) - komut örnekleri
- [ClawHub'da yayımlama](/tr/clawhub/publishing) - yayımlama ve sürüm kuralları
