---
read_when:
    - Kanal durumu ve son oturum alıcıları hakkında hızlı bir tanılama istiyorsunuz
    - Hata ayıklama için yapıştırılabilir bir "tümü" durumu istiyorsunuz
summary: '`openclaw status` için CLI başvurusu (tanılama, yoklamalar, kullanım anlık görüntüleri)'
title: openclaw status
x-i18n:
    generated_at: "2026-07-12T12:11:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
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

| Bayrak                  | Açıklama                                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--all`                 | Tam tanılama (salt okunur, yapıştırılabilir). Güvenlik denetimi, Plugin uyumluluğu ve bellek vektörü yoklamalarını içerir. |
| `--deep`                | Canlı yoklamalar çalıştırır (WhatsApp Web + Telegram + Discord + Slack + Signal). Güvenlik denetimini de etkinleştirir.    |
| `--usage`               | Normalleştirilmiş sağlayıcı kullanım aralıklarını `X% kaldı` biçiminde yazdırır.                                           |
| `--json`                | Makine tarafından okunabilir çıktı.                                                                                        |
| `--verbose` / `--debug` | Rapordan önce ham Gateway hedef çözümlemesini de yazdırır.                                                                 |

Düz `openclaw status`, hızlı salt okunur yolda kalır ve bellek incelemesini
atladığında belleği kullanılamaz olarak değil, `kontrol edilmedi` olarak
işaretler. Yoğun güvenlik denetimi, Plugin uyumluluğu ve bellek vektörü
yoklamaları `openclaw status --all`, `openclaw status --deep`,
`openclaw security audit` ve `openclaw memory status --deep` komutlarına
bırakılır.

## Oturum ve model çözümlemesi

- Oturum durumu çıktısı `Yürütme:` ile `Çalışma zamanı:` bilgilerini ayırır.
  `Yürütme`, korumalı alan yoludur (`direct`, `docker/*`); `Çalışma zamanı`
  ise oturumun `OpenClaw Varsayılanı`, `OpenAI Codex`, bir CLI arka ucu veya
  `codex (acp/acpx)` gibi bir ACP arka ucu kullanıp kullanmadığını belirtir.
  Sağlayıcı/model/çalışma zamanı ayrımı için
  [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) bölümüne bakın.
- Geçerli oturum anlık görüntüsü yetersiz olduğunda `/status`, en son
  transkript kullanım günlüğünden token ve önbellek sayaçlarını tamamlayabilir.
  Sıfırdan farklı mevcut canlı değerler, transkript yedek değerlerine göre
  öncelikli olmaya devam eder.
- Transkript yedeği, canlı oturum girdisinde bulunmadığında etkin çalışma
  zamanı model etiketini de kurtarabilir. Bu transkript modeli seçili modelden
  farklıysa durum, bağlam penceresini seçili modele göre değil, kurtarılan
  çalışma zamanı modeline göre çözümler.
- İstem boyutu hesaplamasında transkript yedeği, oturum meta verileri eksik
  veya daha küçük olduğunda istem odaklı daha büyük toplamı tercih eder;
  böylece özel sağlayıcı oturumları `0` token gösterimine düşmez.
- Bir oturum, yapılandırılmış birincil modelden farklı bir modele
  sabitlendiğinde durum her iki değeri, nedeni (`oturum geçersiz kılması`) ve
  `/model default` ipucunu yazdırır. Yapılandırılmış birincil model yeni veya
  sabitlenmemiş oturumlara uygulanır; mevcut sabitlenmiş oturumlar
  temizlenene kadar oturum seçimlerini korur.
- Birden fazla ajan yapılandırıldığında çıktı, ajan başına oturum depolarını
  içerir.

## Kullanım ve kota

- `--usage`, normalleştirilmiş sağlayıcı kullanım aralıklarını `X% kaldı`
  biçiminde yazdırır.
- MiniMax'ın ham `usage_percent` / `usagePercent` alanları kalan kotayı
  gösterir; bu nedenle OpenClaw, görüntülemeden önce bunları tersine çevirir.
  Mevcut olduğunda sayı tabanlı alanlar önceliklidir. `model_remains`
  yanıtları sohbet modeli girdisini tercih eder, gerektiğinde zaman
  damgalarından aralık etiketini türetir ve plan etiketine model adını ekler.
- Model fiyatlandırmasını yenileme hataları, isteğe bağlı fiyatlandırma
  uyarıları olarak gösterilir. Bunlar Gateway'in veya kanalların sağlıksız
  olduğu anlamına gelmez.

## Genel bakış ve güncelleme durumu

- Genel bakış, kullanılabildiğinde Gateway ve Node ana makine hizmetinin
  kurulum/çalışma zamanı durumunun yanı sıra kısa Gateway işlem çalışma
  süresini ve ana makine sistem çalışma süresini içerir.
- Genel bakış, güncelleme kanalını ve git SHA'sını (kaynak kod çıkışları için)
  içerir.
- Güncelleme bilgileri Genel Bakış'ta gösterilir; bir güncelleme varsa durum,
  `openclaw update` komutunu çalıştırma ipucu verir
  (bkz. [Güncelleme](/tr/install/updating)).

## Gizli bilgiler

- Salt okunur durum yüzeyleri (`status`, `status --json`, `status --all`),
  mümkün olduğunda hedeflenen yapılandırma yolları için desteklenen
  SecretRef'leri çözümler.
- Desteklenen bir kanal SecretRef'i yapılandırılmış ancak geçerli komut
  yolunda kullanılamıyorsa durum salt okunur kalır ve çökmek yerine
  kısıtlanmış çıktı bildirir. İnsanlar için hazırlanan çıktı, "yapılandırılmış
  token bu komut yolunda kullanılamıyor" gibi uyarılar gösterir; JSON çıktısı
  ise `secretDiagnostics` alanını içerir.
- Komuta özel SecretRef çözümlemesi başarılı olduğunda durum, çözümlenmiş
  anlık görüntüyü tercih eder ve nihai çıktıdan geçici "gizli bilgi
  kullanılamıyor" kanal işaretlerini temizler.
- `status --all`, rapor oluşturmayı durdurmadan gizli bilgi tanılamalarını
  özetleyen (okunabilirlik için kısaltılmış) bir Gizli Bilgilere Genel Bakış
  satırı ve tanılama bölümü içerir.

## Bellek

`status --json --all`, `plugins.slots.memory` tarafından seçilen etkin bellek
Plugin'i çalışma zamanından bellek ayrıntılarını bildirir. Özel bellek
Plugin'leri, yerleşik `agents.defaults.memorySearch.enabled` ayarını devre
dışı bırakabilir ve yine de kendi dosya, parça, vektör ve FTS durumlarını
bildirebilir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Doctor](/tr/gateway/doctor)
