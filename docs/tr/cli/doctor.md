---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve yönlendirmeli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve bir mantık denetimi istiyorsunuz
summary: '`openclaw doctor` için CLI başvurusu (sağlık kontrolleri + yönlendirmeli onarımlar)'
title: Doctor
x-i18n:
    generated_at: "2026-04-24T09:02:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ea3f4992effe3d417f20427b3bdb9e47712816106b03bc27a415571cf88a7c
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Gateway ve kanallar için sağlık kontrolleri + hızlı düzeltmeler.

İlgili:

- Sorun giderme: [Sorun Giderme](/tr/gateway/troubleshooting)
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

- `--no-workspace-suggestions`: çalışma alanı bellek/arama önerilerini devre dışı bırakır
- `--yes`: sormadan varsayılanları kabul eder
- `--repair`: önerilen düzeltmeleri sormadan uygular
- `--fix`: `--repair` için takma ad
- `--force`: gerektiğinde özel service yapılandırmasının üzerine yazmak da dahil olmak üzere agresif onarımlar uygular
- `--non-interactive`: istemler olmadan çalışır; yalnızca güvenli geçişler
- `--generate-gateway-token`: bir gateway token'ı oluşturur ve yapılandırır
- `--deep`: ek gateway kurulumları için sistem servislerini tarar

Notlar:

- Etkileşimli istemler (keychain/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlı olmadığında** çalışır. Başsız çalıştırmalar (Cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimli olmayan `doctor` çalıştırmaları, başsız sağlık kontrollerinin hızlı kalması için hevesli Plugin yüklemesini atlar. Etkileşimli oturumlar ise bir kontrol bunların katkısını gerektirdiğinde yine de Plugin'leri tam olarak yükler.
- `--fix` (`--repair` takma adı), `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını kaldırır; her kaldırmayı listeler.
- Durum bütünlüğü kontrolleri artık oturumlar dizinindeki sahipsiz transcript dosyalarını algılar ve alanı güvenli şekilde geri kazanmak için bunları `.deleted.<timestamp>` olarak arşivleyebilir.
- Doctor ayrıca eski Cron iş şekilleri için `~/.openclaw/cron/jobs.json` (veya `cron.store`) dosyasını tarar ve zamanlayıcının çalışma zamanında otomatik normalize etmesine gerek kalmadan önce bunları yerinde yeniden yazabilir.
- Doctor, kurulu OpenClaw paketine yazma erişimi gerektirmeden eksik paketlenmiş Plugin çalışma zamanı bağımlılıklarını onarır. Root sahibi npm kurulumları veya sertleştirilmiş systemd birimleri için `OPENCLAW_PLUGIN_STAGE_DIR` değerini `/var/lib/openclaw/plugin-runtime-deps` gibi yazılabilir bir dizine ayarlayın.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` yapısına geçirir.
- Tek fark nesne anahtarı sırası olduğunda yinelenen `doctor --fix` çalıştırmaları artık Talk normalizasyonunu raporlamaz/uygulamaz.
- Doctor, bellek arama hazırlık denetimi içerir ve gömme kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Sandbox modu etkin ama Docker kullanılamıyorsa doctor, düzeltme önerisiyle (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`) birlikte yüksek sinyalli bir uyarı bildirir.
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyorsa ve mevcut komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı bildirir ve düz metin geri dönüş kimlik bilgileri yazmaz.
- Bir düzeltme yolunda kanal SecretRef incelemesi başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı bildirir.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), mevcut komut yolunda çözümlenebilir bir Telegram token'ı gerektirir. Token incelemesi kullanılamıyorsa doctor bir uyarı bildirir ve bu geçişte otomatik çözümlemeyi atlar.

## macOS: `launchctl` env geçersiz kılmaları

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
