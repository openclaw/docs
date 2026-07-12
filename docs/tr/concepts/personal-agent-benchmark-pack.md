---
read_when:
    - Yerel kişisel ajan güvenilirlik kontrollerini çalıştırma
    - Depo tabanlı kalite güvencesi senaryo kataloğunu genişletme
    - Hatırlatmayı, yanıtı, belleği, gizli bilgilerin çıkarılmasını, araçların güvenli biçimde takip edilmesini, görev durumunu, güvenle paylaşılabilir tanılamaları, kanıta dayalı tamamlanma iddialarını ve hata kurtarmayı doğrulama
summary: Gizliliği koruyan kişisel asistan iş akışı kontrolleri için yerel qa-channel senaryoları.
title: Kişisel ajan karşılaştırma paketi
x-i18n:
    generated_at: "2026-07-12T11:39:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Kişisel Agent Karşılaştırma Paketi, yerel kişisel asistan iş akışlarına yönelik, depo destekli küçük bir QA senaryo paketidir. Genel amaçlı bir model karşılaştırması değildir ve yeni bir çalıştırıcı gerektirmez: özel QA altyapısını ([QA genel bakışı](/tr/concepts/qa-e2e-automation)), sentetik [QA kanalını](/tr/channels/qa-channel) ve mevcut `qa/scenarios` YAML kataloğunu yeniden kullanır.

## Senaryolar

`qa/scenarios/personal/*.yaml` içinde tanımlanmış on senaryo:

| Senaryo kimliği                            | Denetimler                                                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | Yerel cron teslimatı üzerinden sahte kişisel anımsatıcılar                                                     |
| `personal-channel-thread-reply`            | `qa-channel` üzerinden sahte doğrudan mesaj ve ileti dizisi yanıtı yönlendirmesi                               |
| `personal-memory-preference-recall`        | Geçici QA çalışma alanı bellek dosyalarından sahte tercihlerin hatırlanması                                    |
| `personal-redaction-no-secret-leak`        | Sahte gizli bilginin yinelenmediğine yönelik denetimler                                                        |
| `personal-tool-safety-followthrough`       | Kısa bir onay tarzı etkileşimden sonra güvenli, okuma destekli araç işleminin tamamlanması                     |
| `personal-approval-denial-stop`            | Hassas bir yerel okuma isteği için onay reddedildiğinde durma davranışı                                        |
| `personal-task-followthrough-status`       | Bekleyen, engellenen ve tamamlanan durumları ayrı tutan, kanıta dayalı görev durumu raporlaması                |
| `personal-share-safe-diagnostics-artifact` | Ham kişisel içeriği hariç tutarken yararlı durumu koruyan, güvenle paylaşılabilir tanılama yapıtları           |
| `personal-no-fake-progress`                | Yerel kanıt bulunmadan önce sahte ilerleme bildirmekten kaçınan, kanıta dayalı tamamlanma beyanları            |
| `personal-failure-recovery`                | Kısmi durumu bildiren ve yeniden deneme sınırlarını açıkça koruyan hata kurtarma                               |

Makine tarafından okunabilir paket meta verileri (kimlik listesi, başlık ve açıklama), `extensions/qa-lab/src/scenario-packs.ts` içinde `QA_PERSONAL_AGENT_SCENARIO_IDS` olarak bulunur. Paketi `--pack personal-agent` ile çalıştırın:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack`, yinelenen `--scenario` bayraklarıyla birlikte eklemeli olarak çalışır. Önce açıkça belirtilen senaryolar, ardından yinelenenler kaldırılarak `QA_PERSONAL_AGENT_SCENARIO_IDS` sırasındaki paket senaryoları çalıştırılır.

Paket, `mock-openai` veya başka bir yerel QA sağlayıcı hattıyla `qa-channel` kanalını hedefler. Paketi canlı sohbet hizmetlerine veya gerçek kişisel hesaplara yönlendirmeyin.

## Gizlilik Modeli

Senaryolar yalnızca sahte kullanıcıları, sahte tercihleri, sahte gizli bilgileri ve paket tarafından oluşturulan geçici QA Gateway çalışma alanını kullanır. Gerçek OpenClaw kullanıcı belleğini, oturumlarını, kimlik bilgilerini, başlatma agent'larını, genel yapılandırmaları veya canlı Gateway durumunu okumamalı ya da bunlara yazmamalıdır.

Yapıtlar, mevcut QA paketi yapıt dizini altında kalır ve test çıktısı olarak değerlendirilir. Redaksiyon denetimleri sahte işaretleyiciler kullanır; böylece hatalar güvenli bir şekilde incelenebilir ve sorun kaydı olarak oluşturulabilir.

## Paketi genişletme

`qa/scenarios/personal/` altına yeni `.yaml` senaryoları ekleyin, ardından senaryo kimliğini `QA_PERSONAL_AGENT_SCENARIO_IDS` listesine ekleyin. Her senaryoyu küçük, yerel, `mock-openai` içinde deterministik ve tek bir kişisel asistan davranışına odaklı tutun.

İyi takip adayları: redakte edilmiş işlem yörüngesi dışa aktarma denetimleri, yalnızca yerelde çalışan Plugin iş akışı denetimleri.

Senaryo kataloğu bu yüzeyi gerekçelendirecek kadar kararlı senaryo içermeden yeni bir çalıştırıcı, Plugin, bağımlılık, canlı aktarım veya model değerlendiricisi eklemekten kaçının.
