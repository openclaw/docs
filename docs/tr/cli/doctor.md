---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve yönlendirmeli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve bir sağlamlık denetimi istiyorsunuz
summary: '`openclaw doctor` için CLI başvurusu (sağlık denetimleri + yönlendirmeli onarımlar)'
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:26:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e2c21765f8c287c8d2aa066004ac516566c76a455337c377cf282551619e92a
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Gateway ve kanallar için sağlık denetimleri + hızlı düzeltmeler.

İlgili:

- Sorun giderme: [Sorun giderme](/tr/gateway/troubleshooting)
- Güvenlik denetimi: [Güvenlik](/tr/gateway/security)

## Örnekler

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Seçenekler

- `--no-workspace-suggestions`: çalışma alanı bellek/arama önerilerini devre dışı bırak
- `--yes`: sormadan varsayılanları kabul et
- `--repair`: önerilen onarımları sormadan uygula
- `--fix`: `--repair` için diğer ad
- `--force`: gerektiğinde özel servis yapılandırmasının üzerine yazmak dahil agresif onarımlar uygula
- `--non-interactive`: istemler olmadan çalıştır; yalnızca güvenli geçişler
- `--generate-gateway-token`: bir Gateway token'ı üret ve yapılandır
- `--deep`: ek Gateway kurulumları için sistem servislerini tara

Notlar:

- Etkileşimli istemler (anahtar zinciri/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlanmamışsa** çalışır. Headless çalıştırmalar (Cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimli olmayan `doctor` çalıştırmaları, headless sağlık denetimlerinin hızlı kalması için erken Plugin yüklemeyi atlar. Etkileşimli oturumlar ise bir denetim katkılarını gerektirdiğinde Plugin'leri tamamen yükler.
- `--fix` (`--repair` için diğer ad), `~/.openclaw/openclaw.json.bak` dosyasına bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını kaldırır; her kaldırmayı listeler.
- Durum bütünlüğü denetimleri artık oturumlar dizinindeki sahipsiz transkript dosyalarını algılar ve alanı güvenli şekilde geri kazanmak için bunları `.deleted.<timestamp>` olarak arşivleyebilir.
- Doctor ayrıca eski Cron iş şekilleri için `~/.openclaw/cron/jobs.json` dosyasını (veya `cron.store`) tarar ve zamanlayıcının çalışma zamanında otomatik normalleştirme yapmasına gerek kalmadan önce bunları yerinde yeniden yazabilir.
- Doctor, paketlenmiş genel kurulumların içine yazmadan paketle birlikte gelen Plugin çalışma zamanı bağımlılıklarını onarır. Root sahipli npm kurulumları veya sertleştirilmiş systemd birimleri için `OPENCLAW_PLUGIN_STAGE_DIR` değerini `/var/lib/openclaw/plugin-runtime-deps` gibi yazılabilir bir dizine ayarlayın.
- Başka bir denetleyici Gateway yaşam döngüsünün sahibi olduğunda `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor yine de Gateway/servis sağlığını bildirir ve servis dışı onarımları uygular, ancak servis kurma/başlatma/yeniden başlatma/bootstrap ve eski servis temizliğini atlar.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` yapısına geçirir.
- Yinelenen `doctor --fix` çalıştırmaları, tek fark nesne anahtarı sırası olduğunda artık Talk normalleştirmesini bildirmez/uygulamaz.
- Doctor, bellek araması hazır olma denetimi içerir ve gömme kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Sandbox modu etkin ama Docker kullanılamıyorsa doctor, düzeltme adımıyla birlikte yüksek sinyalli bir uyarı bildirir (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`).
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyorsa ve mevcut komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı bildirir ve düz metin geri dönüş kimlik bilgileri yazmaz.
- Kanal SecretRef incelemesi bir düzeltme yolunda başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı bildirir.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), mevcut komut yolunda çözümlenebilir bir Telegram token'ı gerektirir. Token incelemesi kullanılamıyorsa doctor bir uyarı bildirir ve bu geçiş için otomatik çözümlemeyi atlar.

## macOS: `launchctl` ortam geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız bu değer yapılandırma dosyanızı geçersiz kılar ve kalıcı “unauthorized” hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway doctor](/tr/gateway/doctor)
