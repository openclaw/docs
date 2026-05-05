---
read_when:
    - Kanal sağlığı + son oturum alıcıları için hızlı bir tanı istiyorsunuz
    - Hata ayıklama için yapıştırılabilir bir “tüm” durumu istiyorsunuz
summary: '`openclaw status` için CLI referansı (tanılamalar, yoklamalar, kullanım anlık görüntüleri)'
title: Durum
x-i18n:
    generated_at: "2026-05-05T06:16:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5025ed99d351a43adc60b6896349366b225fd7ecb8ab422dba376f2d157f0033
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

Kanallar + oturumlar için tanılamalar.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Notlar:

- `--deep` canlı yoklamalar çalıştırır (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Düz `openclaw status`, hızlı salt okunur yolda kalır ve bellek incelemesini atladığında belleği kullanılamaz yerine `not checked` olarak işaretler. Ağır güvenlik denetimi, Plugin uyumluluğu ve bellek vektörü yoklamaları `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` ve `openclaw memory status --deep` komutlarına bırakılır.
- `status --json --all`, `plugins.slots.memory` tarafından seçilen etkin bellek Plugin çalışma zamanından bellek ayrıntılarını bildirir. Özel bellek Plugin'leri yerleşik `agents.defaults.memorySearch.enabled` ayarını devre dışı bırakıp yine de kendi dosyalarını, parçalarını, vektörünü ve FTS durumunu bildirebilir.
- `--usage`, normalize edilmiş sağlayıcı kullanım pencerelerini `X% left` olarak yazdırır.
- Oturum durumu çıktısı `Execution:` ile `Runtime:` bölümlerini ayırır. `Execution` korumalı alan yoludur (`direct`, `docker/*`), `Runtime` ise oturumun `OpenClaw Pi Default`, `OpenAI Codex`, bir CLI arka ucu veya `codex (acp/acpx)` gibi bir ACP arka ucu kullanıp kullanmadığını söyler. Sağlayıcı/model/çalışma zamanı ayrımı için [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) bölümüne bakın.
- MiniMax'in ham `usage_percent` / `usagePercent` alanları kalan kotadır, bu yüzden OpenClaw bunları göstermeden önce tersine çevirir; mevcut olduğunda sayı tabanlı alanlar önceliklidir. `model_remains` yanıtları sohbet modeli girdisini tercih eder, gerektiğinde zaman damgalarından pencere etiketini türetir ve plan etiketine model adını ekler.
- Geçerli oturum anlık görüntüsü seyrek olduğunda, `/status` belirteç ve önbellek sayaçlarını en son transkript kullanım günlüğünden tamamlayabilir. Mevcut sıfır olmayan canlı değerler transkript yedek değerlerine göre hâlâ önceliklidir.
- `/status`, kompakt Gateway işlem çalışma süresini ve ana makine sistem çalışma süresini içerir.
- Transkript yedeği, canlı oturum girdisinde eksik olduğunda etkin çalışma zamanı model etiketini de kurtarabilir. Bu transkript modeli seçilen modelden farklıysa durum, bağlam penceresini seçilen model yerine kurtarılan çalışma zamanı modeline göre çözümler.
- İstem boyutu muhasebesi için transkript yedeği, oturum meta verileri eksik veya daha küçük olduğunda daha büyük istem odaklı toplamı tercih eder; böylece özel sağlayıcı oturumları `0` belirteç gösterimlerine düşmez.
- Çıktı, birden çok ajan yapılandırıldığında ajan başına oturum depolarını içerir.
- Genel bakış, kullanılabilir olduğunda Gateway + Node ana makine hizmeti kurulum/çalışma zamanı durumunu içerir.
- Genel bakış, güncelleme kanalını + git SHA'yı (kaynak denetimleri için) içerir.
- Güncelleme bilgisi Genel Bakış'ta gösterilir; bir güncelleme varsa durum, `openclaw update` komutunu çalıştırmak için bir ipucu yazdırır ([Güncelleme](/tr/install/updating) bölümüne bakın).
- Salt okunur durum yüzeyleri (`status`, `status --json`, `status --all`), mümkün olduğunda hedeflenen yapılandırma yolları için desteklenen SecretRef'leri çözümler.
- Desteklenen bir kanal SecretRef'i yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa, durum salt okunur kalır ve çökme yerine düşürülmüş çıktı bildirir. İnsan çıktısı “yapılandırılmış belirteç bu komut yolunda kullanılamıyor” gibi uyarılar gösterir ve JSON çıktısı `secretDiagnostics` içerir.
- Komuta yerel SecretRef çözümlemesi başarılı olduğunda, durum çözümlenen anlık görüntüyü tercih eder ve son çıktıdan geçici “giz kullanılamıyor” kanal işaretlerini temizler.
- `status --all`, rapor oluşturmayı durdurmadan giz tanılamalarını özetleyen (okunabilirlik için kısaltılmış) bir Gizler genel bakış satırı ve bir tanılama bölümü içerir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Doctor](/tr/gateway/doctor)
