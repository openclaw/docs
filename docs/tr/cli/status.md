---
read_when:
    - Kanal sağlığı + son oturum alıcıları için hızlı bir tanı istiyorsunuz
    - Hata ayıklama için yapıştırılabilir bir “all” durumu istiyorsunuz
summary: '`openclaw status` için CLI başvurusu (tanılama, yoklamalar, kullanım anlık görüntüleri)'
title: status
x-i18n:
    generated_at: "2026-04-05T13:49:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbe9d94fbe9938cd946ee6f293b5bd3b464b75e1ade2eacdd851788c3bffe94e
    source_path: cli/status.md
    workflow: 15
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

- `--deep` canlı yoklamalar çalıştırır (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage`, normalize edilmiş sağlayıcı kullanım pencerelerini `X% left` olarak yazdırır.
- MiniMax'ın ham `usage_percent` / `usagePercent` alanları kalan kotadır, bu nedenle OpenClaw bunları görüntülemeden önce tersine çevirir; mevcut olduğunda sayı tabanlı alanlar önceliklidir. `model_remains` yanıtları sohbet modeli girdisini tercih eder, gerektiğinde zaman penceresi etiketini zaman damgalarından türetir ve plan etiketine model adını dahil eder.
- Geçerli oturum anlık görüntüsü seyrek olduğunda `/status`, token ve önbellek sayaçlarını en son transcript kullanım günlüğünden geri doldurabilir. Mevcut sıfır olmayan canlı değerler yine transcript yedek değerlerine üstün gelir.
- Transcript yedeği, canlı oturum girdisinde eksik olduğunda etkin çalışma zamanı modeli etiketini de kurtarabilir. Bu transcript modeli seçilen modelden farklıysa status, bağlam penceresini seçilen model yerine kurtarılan çalışma zamanı modeline göre çözümler.
- Prompt boyutu muhasebesi için transcript yedeği, oturum meta verileri eksik veya daha küçük olduğunda daha büyük prompt odaklı toplamı tercih eder; böylece özel sağlayıcı oturumları `0` token görüntülerine düşmez.
- Çıktı, birden çok ajan yapılandırıldığında ajan başına oturum depolarını içerir.
- Genel bakış, mevcut olduğunda Gateway + düğüm ana makine hizmet kurulum/çalışma durumu bilgilerini içerir.
- Genel bakış, güncelleme kanalı + git SHA bilgisini içerir (kaynak checkout'lar için).
- Güncelleme bilgisi Genel Bakış'ta gösterilir; bir güncelleme varsa status, `openclaw update` çalıştırmak için bir ipucu yazdırır (bkz. [Güncelleme](/install/updating)).
- Salt okunur status yüzeyleri (`status`, `status --json`, `status --all`), mümkün olduğunda hedeflenen yapılandırma yolları için desteklenen SecretRef'leri çözümler.
- Desteklenen bir kanal SecretRef'i yapılandırılmış ancak mevcut komut yolunda kullanılamıyorsa status salt okunur kalır ve çökmek yerine bozulmuş çıktı bildirir. İnsan tarafından okunabilir çıktı “configured token unavailable in this command path” gibi uyarılar gösterir ve JSON çıktısı `secretDiagnostics` içerir.
- Komut yerel SecretRef çözümlemesi başarılı olduğunda status çözümlenmiş anlık görüntüyü tercih eder ve son çıktıdan geçici “secret unavailable” kanal işaretlerini temizler.
- `status --all`, bir Secrets genel bakış satırı ve rapor üretimini durdurmadan gizli tanılamalarını özetleyen (okunabilirlik için kısaltılmış) bir tanı bölümü içerir.
