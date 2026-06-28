---
read_when:
    - Kanal durumu ve son oturum alıcıları için hızlı bir tanılama istiyorsunuz
    - Hata ayıklama için yapıştırılabilir bir "all" durumu istiyorsunuz
summary: '`openclaw status` için CLI başvurusu (tanılama, yoklamalar, kullanım anlık görüntüleri)'
title: openclaw status
x-i18n:
    generated_at: "2026-06-28T00:25:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9e99b2aa9eb12fe97c8ee018ac6a5227cad990d151c3579d16009c5b9258a
    source_path: cli/status.md
    workflow: 16
---

Kanallar ve oturumlar için tanılama.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Notlar:

- `--deep` canlı yoklamalar çalıştırır (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Düz `openclaw status` hızlı salt okunur yolda kalır ve bellek incelemesini atladığında belleği kullanılamaz yerine `not checked` olarak işaretler. Ağır güvenlik denetimi, Plugin uyumluluğu ve bellek vektörü yoklamaları `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` ve `openclaw memory status --deep` için bırakılır.
- `status --json --all`, `plugins.slots.memory` tarafından seçilen etkin bellek Plugin çalışma zamanından bellek ayrıntılarını raporlar. Özel bellek Plugin'leri yerleşik `agents.defaults.memorySearch.enabled` ayarını devre dışı bırakabilir ve yine de kendi dosya, parça, vektör ve FTS durumlarını raporlayabilir.
- `--usage`, normalleştirilmiş sağlayıcı kullanım pencerelerini `X% left` olarak yazdırır.
- Oturum durumu çıktısı `Execution:` ile `Runtime:` değerlerini ayırır. `Execution` sandbox yoludur (`direct`, `docker/*`), `Runtime` ise oturumun `OpenClaw Default`, `OpenAI Codex`, bir CLI arka ucu veya `codex (acp/acpx)` gibi bir ACP arka ucu kullanıp kullanmadığını bildirir. Sağlayıcı/model/çalışma zamanı ayrımı için [Aracı çalışma zamanları](/tr/concepts/agent-runtimes) sayfasına bakın.
- MiniMax'in ham `usage_percent` / `usagePercent` alanları kalan kotadır, bu nedenle OpenClaw bunları görüntülemeden önce tersine çevirir; mevcut olduğunda sayım tabanlı alanlar önceliklidir. `model_remains` yanıtları sohbet modeli girdisini tercih eder, gerektiğinde pencere etiketini zaman damgalarından türetir ve plan etiketine model adını dahil eder.
- Geçerli oturum anlık görüntüsü seyrek olduğunda, `/status` token ve önbellek sayaçlarını en son transkript kullanım günlüğünden tamamlayabilir. Mevcut sıfır olmayan canlı değerler transkript yedek değerlerine göre yine önceliklidir.
- `/status`, kompakt Gateway süreç çalışma süresini ve ana makine sistem çalışma süresini içerir.
- Transkript yedeği, canlı oturum girdisinde eksik olduğunda etkin çalışma zamanı model etiketini de kurtarabilir. Bu transkript modeli seçilen modelden farklıysa durum, bağlam penceresini seçilen model yerine kurtarılan çalışma zamanı modeline göre çözer.
- Bir oturum yapılandırılmış birincilden farklı bir modele sabitlendiğinde, durum her iki değeri, nedeni (`session override`) ve açık ipucunu (`/model default`) yazdırır. Yapılandırılmış birincil yeni veya sabitlenmemiş oturumlara uygulanır; mevcut sabitlenmiş oturumlar temizlenene kadar oturum seçimlerini korur.
- İstem boyutu hesaplaması için, oturum meta verisi eksik veya daha küçük olduğunda transkript yedeği daha büyük istem odaklı toplamı tercih eder; böylece özel sağlayıcı oturumları `0` token görüntülerine düşmez.
- Birden fazla aracı yapılandırıldığında çıktı aracı başına oturum depolarını içerir.
- Genel bakış, mevcut olduğunda Gateway + düğüm ana makine hizmeti kurulum/çalışma zamanı durumunu içerir.
- Genel bakış, güncelleme kanalı + git SHA değerini içerir (kaynak checkout'ları için).
- Güncelleme bilgisi Genel Bakış'ta görünür; bir güncelleme varsa durum, `openclaw update` çalıştırmak için bir ipucu yazdırır ([Güncelleme](/tr/install/updating) bölümüne bakın).
- Model fiyatlandırma yenileme hataları isteğe bağlı fiyatlandırma uyarıları olarak gösterilir. Bunlar
  Gateway veya kanalların sağlıksız olduğu anlamına gelmez.
- Salt okunur durum yüzeyleri (`status`, `status --json`, `status --all`), mümkün olduğunda hedeflenen yapılandırma yolları için desteklenen SecretRef'leri çözer.
- Desteklenen bir kanal SecretRef'i yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa durum salt okunur kalır ve çökmek yerine bozulmuş çıktı raporlar. İnsan çıktısı "configured token unavailable in this command path" gibi uyarılar gösterir ve JSON çıktısı `secretDiagnostics` içerir.
- Komuta yerel SecretRef çözümlemesi başarılı olduğunda, durum çözümlenen anlık görüntüyü tercih eder ve nihai çıktıdan geçici "secret unavailable" kanal işaretlerini temizler.
- `status --all`, bir Secrets genel bakış satırı ve rapor oluşturmayı durdurmadan gizli tanılamaları özetleyen (okunabilirlik için kısaltılmış) bir tanı bölümü içerir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Doctor](/tr/gateway/doctor)
