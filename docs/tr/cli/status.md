---
read_when:
    - Kanal sağlığı ve son oturum alıcılarının hızlı tanısını istiyorsunuz
    - Hata ayıklama için yapıştırılabilir bir “all” durum çıktısı istiyorsunuz
summary: '`openclaw status` için CLI başvurusu (tanılama, yoklamalar, kullanım anlık görüntüleri)'
title: Durum
x-i18n:
    generated_at: "2026-04-24T09:03:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 369de48e283766ec23ef87f79df39893957101954c4a351e46ef24104d78ec1d
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

- `--deep`, canlı yoklamalar çalıştırır (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage`, normalize edilmiş sağlayıcı kullanım pencerelerini `X% left` olarak yazdırır.
- Oturum durum çıktısı artık `Runtime:` ile `Runner:` alanlarını ayırır. `Runtime`, yürütme yolunu ve sandbox durumunu (`direct`, `docker/*`) gösterirken `Runner`, oturumun gömülü Pi, CLI destekli bir sağlayıcı veya `codex (acp/acpx)` gibi bir ACP koşum arka ucu kullanıp kullanmadığını gösterir.
- MiniMax'in ham `usage_percent` / `usagePercent` alanları kalan kotayı ifade eder; bu yüzden OpenClaw görüntülemeden önce bunları tersine çevirir. Sayı tabanlı alanlar mevcut olduğunda önceliklidir. `model_remains` yanıtları sohbet modeli girdisini tercih eder, gerektiğinde pencere etiketini zaman damgalarından türetir ve model adını plan etiketine ekler.
- Geçerli oturum anlık görüntüsü seyrek olduğunda `/status`, token ve önbellek sayaçlarını en son transcript kullanım günlüğünden geri doldurabilir. Mevcut sıfır olmayan canlı değerler, transcript geri dönüş değerlerine göre yine önceliklidir.
- Transcript geri dönüşü, canlı oturum girdisi bunu içermediğinde etkin çalışma zamanı model etiketini de kurtarabilir. Bu transcript modeli seçili modelden farklıysa durum, bağlam penceresini seçili model yerine kurtarılan çalışma zamanı modeline göre çözümler.
- İstem boyutu muhasebesi için transcript geri dönüşü, oturum metadata'sı eksik olduğunda veya daha küçük olduğunda daha büyük istem odaklı toplamı tercih eder; böylece özel sağlayıcı oturumları `0` token görüntülerine düşmez.
- Çıktı, birden fazla aracı yapılandırıldığında aracı başına oturum depolarını içerir.
- Genel bakış, mevcut olduğunda Gateway + Node host hizmeti kurulum/çalışma durumu içerir.
- Genel bakış, güncelleme kanalı + git SHA'yı içerir (kaynak checkout'lar için).
- Güncelleme bilgisi Genel Bakış'ta gösterilir; bir güncelleme varsa durum, `openclaw update` çalıştırmanız için bir ipucu yazdırır (bkz. [Güncelleme](/tr/install/updating)).
- Salt okunur durum yüzeyleri (`status`, `status --json`, `status --all`), mümkün olduğunda hedeflenen yapılandırma yolları için desteklenen SecretRef'leri çözümler.
- Desteklenen bir kanal SecretRef'i yapılandırılmış ancak mevcut komut yolunda kullanılamıyorsa durum salt okunur kalır ve çökmek yerine bozulmuş çıktı bildirir. İnsan tarafından okunabilir çıktı “configured token unavailable in this command path” gibi uyarılar gösterir ve JSON çıktısı `secretDiagnostics` içerir.
- Komut yerel SecretRef çözümlemesi başarılı olduğunda durum, çözülmüş anlık görüntüyü tercih eder ve son çıktıdaki geçici “secret unavailable” kanal işaretlerini temizler.
- `status --all`, bir Secrets genel bakış satırı ve rapor oluşturmayı durdurmadan gizli bilgi tanılamalarını (okunabilirlik için kısaltılmış) özetleyen bir tanı bölümü içerir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Doctor](/tr/gateway/doctor)
