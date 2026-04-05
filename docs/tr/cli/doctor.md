---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve yönlendirmeli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve bir sağlamlık kontrolü istiyorsunuz
summary: '`openclaw doctor` için CLI başvurusu (sağlık denetimleri + yönlendirmeli onarımlar)'
title: doctor
x-i18n:
    generated_at: "2026-04-05T13:48:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: d257a9e2797b4b0b50c1020165c8a1cd6a2342381bf9c351645ca37494c881e1
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Gateway ve kanallar için sağlık denetimleri + hızlı düzeltmeler.

İlgili:

- Sorun giderme: [Sorun giderme](/gateway/troubleshooting)
- Güvenlik denetimi: [Güvenlik](/gateway/security)

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
- `--yes`: istem olmadan varsayılanları kabul et
- `--repair`: önerilen onarımları istem olmadan uygula
- `--fix`: `--repair` için takma ad
- `--force`: gerektiğinde özel hizmet yapılandırmasının üzerine yazma dahil agresif onarımları uygula
- `--non-interactive`: istemler olmadan çalıştır; yalnızca güvenli geçişler
- `--generate-gateway-token`: bir gateway token'ı üret ve yapılandır
- `--deep`: ek gateway kurulumları için sistem hizmetlerini tara

Notlar:

- Etkileşimli istemler (keychain/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlı olmadığında** çalışır. Başsız çalıştırmalar (cron, Telegram, terminal yok) istemleri atlar.
- `--fix` (`--repair` takma adı) `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını kaldırır; her kaldırmayı listeler.
- Durum bütünlüğü denetimleri artık sessions dizinindeki sahipsiz transcript dosyalarını algılar ve alanı güvenli şekilde geri kazanmak için bunları `.deleted.<timestamp>` olarak arşivleyebilir.
- Doctor ayrıca eski cron iş şekilleri için `~/.openclaw/cron/jobs.json` (veya `cron.store`) dosyasını tarar ve zamanlayıcının çalışma zamanında otomatik normalleştirme yapması gerekmeden önce bunları yerinde yeniden yazabilir.
- Doctor eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` yapısına geçirir.
- Yinelenen `doctor --fix` çalıştırmaları, tek fark nesne anahtarı sırası olduğunda artık Talk normalleştirmesini bildirmez/uygulamaz.
- Doctor bir bellek arama hazır olma denetimi içerir ve embedding kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Sandbox modu etkinse ancak Docker kullanılamıyorsa doctor, düzeltme önerisiyle yüksek sinyalli bir uyarı bildirir (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`).
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyorsa ve mevcut komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı bildirir ve düz metin yedek kimlik bilgileri yazmaz.
- Kanal SecretRef incelemesi bir düzeltme yolunda başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı bildirir.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), mevcut komut yolunda çözümlenebilir bir Telegram token'ı gerektirir. Token incelemesi kullanılamıyorsa doctor bir uyarı bildirir ve o geçiş için otomatik çözümlemeyi atlar.

## macOS: `launchctl` ortam değişkeni geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız bu değer yapılandırma dosyanızın önüne geçer ve kalıcı “unauthorized” hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
