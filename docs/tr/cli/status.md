---
read_when:
    - Kanal sağlığı + son oturum alıcıları için hızlı bir tanılama istiyorsunuz
    - Hata ayıklama için yapıştırılabilir bir "tümü" durumu istiyorsunuz
summary: '`openclaw status` için CLI başvurusu (tanılamalar, problar, kullanım anlık görüntüleri)'
title: openclaw status
x-i18n:
    generated_at: "2026-05-06T09:06:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1929db64f09e9494736f09d0d9c1ae1fb72d7308a7124e616e8247ff32aa3185
    source_path: cli/status.md
    workflow: 16
---

Kanallar + oturumlar için tanılamalar.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Notlar:

- `--deep` canlı yoklamalar çalıştırır (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Düz `openclaw status` hızlı salt okunur yolda kalır ve bellek incelemesini atladığında belleği kullanılamaz olarak değil `not checked` olarak işaretler. Ağır güvenlik denetimi, Plugin uyumluluğu ve bellek-vektör yoklamaları `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` ve `openclaw memory status --deep` komutlarına bırakılır.
- `status --json --all`, `plugins.slots.memory` tarafından seçilen etkin bellek Plugin çalışma zamanından bellek ayrıntılarını bildirir. Özel bellek Pluginleri, yerleşik `agents.defaults.memorySearch.enabled` seçeneğini devre dışı bırakıp yine de kendi dosyalarını, parçalarını, vektörünü ve FTS durumunu bildirebilir.
- `--usage`, normalleştirilmiş sağlayıcı kullanım pencerelerini `X% left` olarak yazdırır.
- Oturum durumu çıktısı `Execution:` ile `Runtime:` alanlarını ayırır. `Execution` sandbox yoludur (`direct`, `docker/*`), `Runtime` ise oturumun `OpenClaw Pi Default`, `OpenAI Codex`, bir CLI arka ucu veya `codex (acp/acpx)` gibi bir ACP arka ucu kullanıp kullanmadığını söyler. Sağlayıcı/model/çalışma zamanı ayrımı için [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) bölümüne bakın.
- MiniMax'in ham `usage_percent` / `usagePercent` alanları kalan kotadır, bu yüzden OpenClaw bunları göstermeden önce tersine çevirir; sayı tabanlı alanlar varsa önceliklidir. `model_remains` yanıtları sohbet-modeli girdisini tercih eder, gerektiğinde pencere etiketini zaman damgalarından türetir ve model adını plan etiketine dahil eder.
- Geçerli oturum anlık görüntüsü seyrek olduğunda, `/status` belirteç ve önbellek sayaçlarını en son transkript kullanım günlüğünden tamamlayabilir. Mevcut sıfır olmayan canlı değerler, transkript yedek değerlerine yine de üstün gelir.
- `/status`, kompakt Gateway süreç çalışma süresini ve ana makine sistem çalışma süresini içerir.
- Transkript yedeği, canlı oturum girdisinde eksik olduğunda etkin çalışma zamanı model etiketini de kurtarabilir. Bu transkript modeli seçili modelden farklıysa durum, bağlam penceresini seçili model yerine kurtarılan çalışma zamanı modeline göre çözümler.
- İstem boyutu muhasebesi için, oturum meta verileri eksik veya daha küçük olduğunda transkript yedeği istem odaklı daha büyük toplamı tercih eder; böylece özel sağlayıcı oturumları `0` belirteç gösterimlerine düşmez.
- Birden fazla ajan yapılandırıldığında çıktı, ajan başına oturum depolarını içerir.
- Genel bakış, varsa Gateway + node ana makine hizmeti kurulum/çalışma zamanı durumunu içerir.
- Genel bakış, güncelleme kanalını + git SHA değerini (kaynak checkout'ları için) içerir.
- Güncelleme bilgisi Genel Bakış'ta görünür; bir güncelleme varsa durum, `openclaw update` çalıştırmak için bir ipucu yazdırır (bkz. [Güncelleme](/tr/install/updating)).
- Salt okunur durum yüzeyleri (`status`, `status --json`, `status --all`) mümkün olduğunda hedeflenen yapılandırma yolları için desteklenen SecretRef'leri çözümler.
- Desteklenen bir kanal SecretRef'i yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa durum salt okunur kalır ve çökmek yerine düşürülmüş çıktı bildirir. İnsan çıktısı "configured token unavailable in this command path" gibi uyarılar gösterir ve JSON çıktısı `secretDiagnostics` içerir.
- Komuta yerel SecretRef çözümleme başarılı olduğunda durum, çözümlenen anlık görüntüyü tercih eder ve geçici "secret unavailable" kanal işaretçilerini nihai çıktıdan temizler.
- `status --all`, rapor oluşturmayı durdurmadan gizli bilgi tanılamalarını (okunabilirlik için kısaltılmış) özetleyen bir Gizli Bilgiler genel bakış satırı ve bir tanılama bölümü içerir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Doctor](/tr/gateway/doctor)
