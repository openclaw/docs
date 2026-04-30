---
read_when:
    - Kanal sağlığı + son oturum alıcıları için hızlı bir tanılama istiyorsunuz
    - Hata ayıklama için yapıştırılabilir bir “tüm” durumu istiyorsunuz
summary: 'CLI referansı: `openclaw status` (tanılamalar, yoklamalar, kullanım anlık görüntüleri)'
title: Durum
x-i18n:
    generated_at: "2026-04-30T09:14:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: a85613e1830dc24253847e6517d3e155c175bb39ff6b01031ac5cb4291e276fa
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

Kanallar + oturumlar için tanılama.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Notlar:

- `--deep` canlı yoklamaları çalıştırır (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Düz `openclaw status`, hızlı salt okunur yolda kalır ve bellek incelemesini atladığında belleği kullanılamaz yerine `not checked` olarak işaretler. Ağır güvenlik denetimi, Plugin uyumluluğu ve bellek vektörü yoklamaları `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` ve `openclaw memory status --deep` komutlarına bırakılır.
- `status --json --all`, `plugins.slots.memory` tarafından seçilen etkin bellek Plugin çalışma zamanından bellek ayrıntılarını bildirir. Özel bellek Plugin'leri yerleşik `agents.defaults.memorySearch.enabled` ayarını devre dışı bırakıp yine de kendi dosya, parça, vektör ve FTS durumlarını bildirebilir.
- `--usage`, normalleştirilmiş sağlayıcı kullanım pencerelerini `X% left` olarak yazdırır.
- Oturum durumu çıktısı `Execution:` ile `Runtime:` değerlerini ayırır. `Execution` korumalı alan yoludur (`direct`, `docker/*`), `Runtime` ise oturumun `OpenClaw Pi Default`, `OpenAI Codex`, bir CLI arka ucu veya `codex (acp/acpx)` gibi bir ACP arka ucu kullanıp kullanmadığını söyler. Sağlayıcı/model/çalışma zamanı ayrımı için [ajan çalışma zamanları](/tr/concepts/agent-runtimes) bölümüne bakın.
- MiniMax'in ham `usage_percent` / `usagePercent` alanları kalan kotadır, bu yüzden OpenClaw bunları göstermeden önce tersine çevirir; sayıma dayalı alanlar mevcut olduğunda öncelik alır. `model_remains` yanıtları sohbet modeli girdisini tercih eder, gerektiğinde pencere etiketini zaman damgalarından türetir ve plan etiketine model adını ekler.
- Geçerli oturum anlık görüntüsü seyrek olduğunda, `/status` belirteç ve önbellek sayaçlarını en son transkript kullanım günlüğünden tamamlayabilir. Mevcut sıfır olmayan canlı değerler yine de transkript geri dönüş değerlerine göre önceliklidir.
- Transkript geri dönüşü, canlı oturum girdisinde etkin çalışma zamanı model etiketi eksik olduğunda bu etiketi de kurtarabilir. Bu transkript modeli seçili modelden farklıysa status, bağlam penceresini seçili model yerine kurtarılan çalışma zamanı modeline göre çözer.
- İstem boyutu muhasebesi için transkript geri dönüşü, oturum meta verileri eksik veya daha küçük olduğunda daha büyük istem odaklı toplamı tercih eder; böylece özel sağlayıcı oturumları `0` belirteç gösterimine düşmez.
- Birden fazla ajan yapılandırıldığında çıktı, ajan başına oturum depolarını içerir.
- Genel bakış, mevcut olduğunda Gateway + Node ana makine hizmeti kurulum/çalışma zamanı durumunu içerir.
- Genel bakış, güncelleme kanalını + git SHA değerini içerir (kaynak çıkışları için).
- Güncelleme bilgileri Genel Bakış'ta görünür; bir güncelleme varsa status, `openclaw update` çalıştırmak için bir ipucu yazdırır ([Güncelleme](/tr/install/updating) bölümüne bakın).
- Salt okunur durum yüzeyleri (`status`, `status --json`, `status --all`), mümkün olduğunda hedeflenen yapılandırma yolları için desteklenen SecretRef'leri çözer.
- Desteklenen bir kanal SecretRef'i yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa status salt okunur kalır ve çökme yerine çıktıyı kısıtlı olarak bildirir. İnsan tarafından okunabilir çıktı “bu komut yolunda yapılandırılmış belirteç kullanılamıyor” gibi uyarılar gösterir ve JSON çıktısı `secretDiagnostics` içerir.
- Komuta yerel SecretRef çözümlemesi başarılı olduğunda status, çözümlenmiş anlık görüntüyü tercih eder ve nihai çıktıdan geçici “secret kullanılamıyor” kanal işaretleyicilerini temizler.
- `status --all`, bir Sırlar genel bakış satırı ve rapor oluşturmayı durdurmadan secret tanılamalarını özetleyen (okunabilirlik için kısaltılmış) bir tanılama bölümü içerir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Doctor](/tr/gateway/doctor)
