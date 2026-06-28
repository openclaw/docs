---
read_when:
    - Kapsamlı bir OpenClaw uygulama modernizasyon çalışmasını planlama
    - Uygulama veya Control UI çalışmaları için ön uç uygulama standartlarını güncelleme
    - Geniş kapsamlı bir ürün kalitesi incelemesini aşamalı mühendislik çalışmasına dönüştürme
summary: Ön uç teslim becerisi güncellemeleriyle kapsamlı uygulama modernizasyon planı
title: Uygulama modernizasyon planı
x-i18n:
    generated_at: "2026-05-06T09:29:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c97bd9c76492b9e7beb0a2623f583a54b5461bebb848fa3ac7e4495322f6456
    source_path: reference/application-modernization-plan.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Hedef

Mevcut iş akışlarını bozmadan veya geniş refactor’larda riski gizlemeden uygulamayı daha temiz, daha hızlı ve daha sürdürülebilir bir ürüne doğru taşıyın. Çalışma, dokunulan her yüzey için kanıt içeren küçük, incelenebilir parçalar halinde inmelidir.

## İlkeler

- Bir sınırın churn’e, performans maliyetine veya kullanıcıya görünen hatalara neden olduğu açıkça kanıtlanmadıkça mevcut mimariyi koruyun.
- Her sorun için en küçük doğru yamayı tercih edin, ardından tekrarlayın.
- Zorunlu düzeltmeleri isteğe bağlı ciladan ayırın; böylece bakımcılar öznel kararları beklemeden yüksek değerli işi indirebilir.
- Plugin’e yönelik davranışı belgelenmiş ve geriye dönük uyumlu tutun.
- Bir gerilemenin düzeltildiğini iddia etmeden önce gönderilmiş davranışı, bağımlılık sözleşmelerini ve testleri doğrulayın.
- Önce ana kullanıcı yolunu iyileştirin: ilk kurulum, kimlik doğrulama, sohbet, sağlayıcı kurulumu, Plugin yönetimi ve tanılama.

## Aşama 1: Temel denetim

Uygulamayı değiştirmeden önce mevcut durumu envantere alın.

- En önemli kullanıcı iş akışlarını ve bunların sahibi olan kod yüzeylerini belirleyin.
- Ölü affordance’ları, yinelenen ayarları, belirsiz hata durumlarını ve pahalı render yollarını listeleyin.
- Her yüzey için mevcut doğrulama komutlarını yakalayın.
- Sorunları zorunlu, önerilen veya isteğe bağlı olarak işaretleyin.
- Özellikle API, güvenlik, sürüm ve Plugin sözleşmesi değişiklikleri olmak üzere sahip incelemesi gerektiren bilinen engelleyicileri belgeleyin.

Tamamlanma tanımı:

- Repo kökü dosya referansları içeren tek bir sorun listesi.
- Her sorunun önem derecesi, sahip yüzeyi, beklenen kullanıcı etkisi ve önerilen doğrulama yolu vardır.
- Spekülatif temizlik öğeleri zorunlu düzeltmelerle karıştırılmaz.

## Aşama 2: Ürün ve UX temizliği

Görünür iş akışlarına öncelik verin ve kafa karışıklığını kaldırın.

- Model kimlik doğrulaması, Gateway durumu ve Plugin kurulumu etrafındaki ilk kurulum metnini ve boş durumları sıkılaştırın.
- Hiçbir eylemin mümkün olmadığı yerlerde ölü affordance’ları kaldırın veya devre dışı bırakın.
- Önemli eylemleri kırılgan yerleşim varsayımlarının arkasına gizlemek yerine duyarlı genişlikler boyunca görünür tutun.
- Hataların tek bir doğruluk kaynağı olması için yinelenen durum dilini birleştirin.
- Temel kurulumu hızlı tutarken gelişmiş ayarlar için kademeli açıklama ekleyin.

Önerilen doğrulama:

- İlk çalıştırma kurulumu ve mevcut kullanıcı başlangıcı için manuel mutlu yol.
- Yönlendirme, yapılandırma kalıcılığı veya durum türetme mantığı için odaklı testler.
- Değişen duyarlı yüzeyler için tarayıcı ekran görüntüleri.

## Aşama 3: Frontend mimarisini sıkılaştırma

Geniş bir yeniden yazma yapmadan sürdürülebilirliği iyileştirin.

- Yinelenen UI durum dönüşümlerini dar kapsamlı tipli helper’lara taşıyın.
- Veri getirme, kalıcılık ve sunum sorumluluklarını ayrı tutun.
- Yeni soyutlamalar yerine mevcut hook’ları, store’ları ve bileşen kalıplarını tercih edin.
- Büyük bileşenleri yalnızca bağımlılığı azalttığında veya testleri netleştirdiğinde bölün.
- Yerel panel etkileşimleri için geniş kapsamlı global state eklemekten kaçının.

Zorunlu korkuluklar:

- Dosya bölmenin yan etkisi olarak public davranışı değiştirmeyin.
- Menüler, dialog’lar, sekmeler ve klavye gezintisi için erişilebilirlik davranışını sağlam tutun.
- Yükleme, boş, hata ve iyimser durumların hâlâ render edildiğini doğrulayın.

## Aşama 4: Performans ve güvenilirlik

Geniş teorik optimizasyon yerine ölçülmüş ağrı noktalarını hedefleyin.

- Başlangıç, rota geçişi, büyük liste ve sohbet transkripti maliyetlerini ölçün.
- Profil çıkarmanın değer kanıtladığı yerlerde yinelenen pahalı türetilmiş verileri memoize edilmiş selector’lar veya cache’lenmiş helper’larla değiştirin.
- Sıcak yollarda kaçınılabilir ağ veya dosya sistemi taramalarını azaltın.
- Model payload oluşturma öncesinde prompt, registry, dosya, Plugin ve ağ girdileri için deterministik sıralamayı koruyun.
- Sıcak helper’lar ve sözleşme sınırları için hafif gerileme testleri ekleyin.

Tamamlanma tanımı:

- Her performans değişikliği başlangıç değerini, beklenen etkiyi, gerçek etkiyi ve kalan açığı kaydeder.
- Ucuz ölçüm mevcutken hiçbir performans yaması yalnızca sezgiye dayanarak inmez.

## Aşama 5: Tip, sözleşme ve test sağlamlaştırma

Kullanıcıların ve Plugin yazarlarının bağlı olduğu sınır noktalarında doğruluğu artırın.

- Gevşek runtime string’lerini diskrimine edilmiş union’larla veya kapalı kod listeleriyle değiştirin.
- Harici girdileri mevcut schema helper’ları veya zod ile doğrulayın.
- Plugin manifest’leri, sağlayıcı katalogları, Gateway protokol mesajları ve yapılandırma migration davranışı etrafına sözleşme testleri ekleyin.
- Uyumluluk yollarını başlangıç zamanı gizli migration’ları yerine doctor veya repair akışlarında tutun.
- Plugin içlerine yalnızca test amaçlı bağlanmaktan kaçının; SDK facade’larını ve belgelenmiş barrel’ları kullanın.

Önerilen doğrulama:

- `pnpm check:changed`
- Değişen her sınır için hedefli testler.
- Lazy sınırlar, paketleme veya yayımlanmış yüzeyler değiştiğinde `pnpm build`.

## Aşama 6: Dokümantasyon ve sürüme hazırlık

Kullanıcıya dönük dokümantasyonu davranışla hizalı tutun.

- Davranış, API, yapılandırma, ilk kurulum veya Plugin değişiklikleriyle birlikte dokümanları güncelleyin.
- Changelog girişlerini yalnızca kullanıcıya görünen değişiklikler için ekleyin.
- Plugin terminolojisini kullanıcıya dönük tutun; internal paket adlarını yalnızca katkıda bulunanlar için gerektiğinde kullanın.
- Sürüm ve kurulum talimatlarının hâlâ mevcut komut yüzeyiyle eşleştiğini doğrulayın.

Tamamlanma tanımı:

- İlgili dokümanlar, davranış değişiklikleriyle aynı branch’te güncellenir.
- Dokunulduğunda generated docs veya API drift kontrolleri geçer.
- Handoff, atlanan doğrulamaları ve neden atlandıklarını belirtir.

## Önerilen ilk parça

Kapsamı belirlenmiş bir Control UI ve ilk kurulum geçişiyle başlayın:

- İlk çalıştırma kurulumu, sağlayıcı kimlik doğrulama hazırlığı, Gateway durumu ve Plugin kurulum yüzeylerini denetleyin.
- Ölü eylemleri kaldırın ve hata durumlarını netleştirin.
- Durum türetme ve yapılandırma kalıcılığı için odaklı testler ekleyin veya güncelleyin.
- `pnpm check:changed` çalıştırın.

Bu, sınırlı mimari riskle yüksek kullanıcı değeri sağlar.

## Frontend skill güncellemesi

Bu bölümü modernizasyon göreviyle sağlanan frontend odaklı `SKILL.md` dosyasını güncellemek için kullanın. Bu rehberliği repo yerelinde bir OpenClaw skill’i olarak benimsiyorsanız önce `.agents/skills/openclaw-frontend/SKILL.md` oluşturun, hedef skill’e ait frontmatter’ı koruyun, ardından gövde rehberliğini aşağıdaki içerikle ekleyin veya değiştirin.

```markdown
# Frontend Delivery Standards

Use this skill when implementing or reviewing user-facing React, Next.js,
desktop webview, or app UI work.

## Operating rules

- Start from the existing product workflow and code conventions.
- Prefer the smallest correct patch that improves the current user path.
- Separate required fixes from optional polish in the handoff.
- Do not build marketing pages when the request is for an application surface.
- Keep actions visible and usable across supported viewport sizes.
- Remove dead affordances instead of leaving controls that cannot act.
- Preserve loading, empty, error, success, and permission states.
- Use existing design-system components, hooks, stores, and icons before adding
  new primitives.

## Implementation checklist

1. Identify the primary user task and the component or route that owns it.
2. Read the local component patterns before editing.
3. Patch the narrowest surface that solves the issue.
4. Add responsive constraints for fixed-format controls, toolbars, grids, and
   counters so text and hover states cannot resize the layout unexpectedly.
5. Keep data loading, state derivation, and rendering responsibilities clear.
6. Add tests when logic, persistence, routing, permissions, or shared helpers
   change.
7. Verify the main happy path and the most relevant edge case.

## Visual quality gates

- Text must fit inside its container on mobile and desktop.
- Toolbars may wrap, but controls must remain reachable.
- Buttons should use familiar icons when the icon is clearer than text.
- Cards should be used for repeated items, modals, and framed tools, not for
  every page section.
- Avoid one-note color palettes and decorative backgrounds that compete with
  operational content.
- Dense product surfaces should optimize for scanning, comparison, and repeated
  use.

## Handoff format

Report:

- What changed.
- What user behavior changed.
- Required validation that passed.
- Any validation skipped and the concrete reason.
- Optional follow-up work, clearly separated from required fixes.
```
