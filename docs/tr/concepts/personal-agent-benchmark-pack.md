---
read_when:
    - Yerel kişisel aracı güvenilirlik kontrollerini çalıştırma
    - Repo destekli QA senaryo kataloğunu genişletme
    - Hatırlatma, yanıt, bellek, redaksiyon, güvenli araç takibi, görev durumu, paylaşımı güvenli tanılama, kanıt destekli tamamlama iddiaları ve hata kurtarmayı doğrulama
summary: Gizliliği koruyan kişisel asistan iş akışı kontrolleri için yerel qa-channel senaryoları.
title: Kişisel ajan kıyaslama paketi
x-i18n:
    generated_at: "2026-06-28T00:29:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5a6b653abbba0718a6287d4e471435f15ef5823aa62abd238a14d955fdc1e5a
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Kişisel Ajan Benchmark Paketi, yerel kişisel asistan iş akışları için küçük, repo destekli bir QA senaryo paketidir. Genel amaçlı bir model benchmark’ı değildir ve yeni bir çalıştırıcı gerektirmez. Paket, [QA genel bakışı](/tr/concepts/qa-e2e-automation) içinde açıklanan özel QA yığınını, sentetik [QA kanalı](/tr/channels/qa-channel) ve mevcut `qa/scenarios` YAML kataloğunu yeniden kullanır.

İlk paket bilinçli olarak dar kapsamlıdır:

- yerel cron teslimi üzerinden sahte kişisel hatırlatıcılar
- `qa-channel` üzerinden sahte DM ve ileti dizisi yanıt yönlendirmesi
- geçici QA çalışma alanı bellek dosyalarından sahte tercih hatırlama
- sahte gizli bilgi yankılamama kontrolleri
- kısa bir onay tarzı turdan sonra güvenli okuma destekli araç takibi
- hassas bir yerel okuma isteği için onay reddinde durma davranışı
- bekleyen, engellenen ve tamamlanan durumları ayrı tutan kanıt destekli görev durumu raporlaması
- ham kişisel içeriği atlayıp yararlı durumu koruyan paylaşımı güvenli tanılama yapıtları
- yerel kanıt oluşmadan sahte ilerlemeden kaçınan kanıt destekli tamamlama iddiaları
- kısmi durumu bildiren ve yeniden deneme sınırlarını net tutan hata kurtarma

## Senaryolar

Makine tarafından okunabilir paket meta verileri
`extensions/qa-lab/src/scenario-packs.ts` içinde bulunur. Paketi
`--pack personal-agent` ile çalıştırın:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack`, tekrarlanan `--scenario` bayraklarıyla birlikte eklemelidir. Açık senaryolar önce çalışır, ardından paket senaryoları yinelenenler kaldırılarak `QA_PERSONAL_AGENT_SCENARIO_IDS` sırasına göre çalışır.

Paket, `mock-openai` veya başka bir yerel QA sağlayıcı hattıyla `qa-channel` için tasarlanmıştır. Canlı sohbet hizmetlerine veya gerçek kişisel hesaplara yönlendirilmemelidir.

## Gizlilik Modeli

Senaryolar yalnızca sahte kullanıcılar, sahte tercihler, sahte gizli bilgiler ve suite tarafından oluşturulan geçici QA Gateway çalışma alanını kullanır. Gerçek OpenClaw kullanıcı belleğini, oturumlarını, kimlik bilgilerini, başlatma ajanlarını, genel yapılandırmaları veya canlı Gateway durumunu okumamalı ya da yazmamalıdır.

Yapıtlar mevcut QA suite yapıt dizininin altında kalır ve test çıktısı gibi ele alınmalıdır. Redaksiyon kontrolleri sahte işaretleyiciler kullanır, böylece hatalar güvenli şekilde incelenebilir ve sorunlara eklenebilir.

## Paketi Genişletme

`qa/scenarios/personal/` altına yeni `.yaml` vakaları ekleyin, ardından senaryo kimliğini `QA_PERSONAL_AGENT_SCENARIO_IDS` içine ekleyin. Her vakayı küçük, yerel, `mock-openai` içinde deterministik ve tek bir kişisel asistan davranışına odaklı tutun.

İyi takip adayları:

- redakte edilmiş izlek dışa aktarma kontrolleri
- yalnızca yerel Plugin iş akışı kontrolleri

Senaryo kataloğunda bu yüzeyi haklı çıkaracak kadar kararlı vaka oluşana kadar yeni bir çalıştırıcı, Plugin, bağımlılık, canlı taşıma veya model hakemi eklemekten kaçının.
