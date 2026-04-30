---
read_when:
    - Bağlantı/kimlik doğrulama sorunları yaşıyor ve yönlendirmeli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve bir sağlama kontrolü istiyorsunuz
summary: '`openclaw doctor` için CLI referansı (sağlık kontrolleri + rehberli onarımlar)'
title: Doktor
x-i18n:
    generated_at: "2026-04-30T20:05:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265d82a10da086cf89687886e491be018a720b70021e0b26bd8f39b25a907e14
    source_path: cli/doctor.md
    workflow: 16
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

- `--no-workspace-suggestions`: çalışma alanı belleği/arama önerilerini devre dışı bırak
- `--yes`: sormadan varsayılanları kabul et
- `--repair`: sormadan önerilen onarımları uygula
- `--fix`: `--repair` için takma ad
- `--force`: gerektiğinde özel hizmet yapılandırmasının üzerine yazma dahil agresif onarımları uygula
- `--non-interactive`: istemler olmadan çalıştır; yalnızca güvenli migrasyonlar
- `--generate-gateway-token`: bir Gateway token'ı oluştur ve yapılandır
- `--deep`: ek Gateway kurulumları için sistem hizmetlerini tara

Notlar:

- Etkileşimli istemler (anahtar zinciri/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlanmamışsa** çalışır. Başsız çalıştırmalar (cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimli olmayan `doctor` çalıştırmaları, başsız sağlık denetimlerinin hızlı kalması için hevesli Plugin yüklemeyi atlar. Etkileşimli oturumlar, bir denetimin katkılarına ihtiyaç duyması halinde Plugin'leri yine de tamamen yükler.
- `--fix` (`--repair` için takma ad), `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını kaldırıp her kaldırmayı listeler.
- Durum bütünlüğü denetimleri artık oturumlar dizinindeki yetim transkript dosyalarını algılar. Bunları `.deleted.<timestamp>` olarak arşivlemek etkileşimli bir onay gerektirir; `--fix`, `--yes` ve başsız çalıştırmalar bunları yerinde bırakır.
- Doctor ayrıca eski cron işi biçimleri için `~/.openclaw/cron/jobs.json` (veya `cron.store`) dosyasını tarar ve zamanlayıcının çalışma zamanında bunları otomatik normalleştirmesi gerekmeden önce yerinde yeniden yazabilir.
- Doctor, paketlenmiş global kurulumlara yazmadan eksik paketli Plugin çalışma zamanı bağımlılıklarını onarır. Root sahipli npm kurulumları veya güçlendirilmiş systemd birimleri için `OPENCLAW_PLUGIN_STAGE_DIR` değerini `/var/lib/openclaw/plugin-runtime-deps` gibi yazılabilir bir dizine ayarlayın; ayrıca `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps` gibi bir yol listesi de olabilir; burada önceki kökler salt okunur arama katmanları, son kök ise onarım hedefidir.
- Doctor, Plugin keşfi sağlıklı olduğunda eksik Plugin kimliklerini `plugins.allow`/`plugins.entries` içinden kaldırarak, ayrıca eşleşen sarkan kanal yapılandırmasını, heartbeat hedeflerini ve kanal model geçersiz kılmalarını kaldırarak bayat Plugin yapılandırmasını onarır.
- Doctor, etkilenen `plugins.entries.<id>` girdisini devre dışı bırakarak ve geçersiz `config` yükünü kaldırarak geçersiz Plugin yapılandırmasını karantinaya alır. Gateway başlatması zaten yalnızca bu hatalı Plugin'i atlar, böylece diğer Plugin'ler ve kanallar çalışmaya devam edebilir.
- Gateway yaşam döngüsünü başka bir supervisor yönetiyorsa `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor yine de Gateway/hizmet sağlığını bildirir ve hizmet dışı onarımları uygular, ancak hizmet kurma/başlatma/yeniden başlatma/bootstrap ve eski hizmet temizliğini atlar.
- Linux'ta doctor, etkin olmayan ek Gateway benzeri systemd birimlerini yok sayar ve onarım sırasında çalışan bir systemd Gateway hizmeti için komut/entrypoint meta verilerini yeniden yazmaz. Etkin başlatıcıyı bilinçli olarak değiştirmek istediğinizde önce hizmeti durdurun veya `openclaw gateway install --force` kullanın.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` içine migre eder.
- Yinelenen `doctor --fix` çalıştırmaları, tek fark nesne anahtarı sırası olduğunda artık Talk normalleştirmesini bildirmez/uygulamaz.
- Doctor bir bellek arama hazır olma denetimi içerir ve embedding kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Doctor, hiçbir komut sahibi yapılandırılmadığında uyarır. Komut sahibi, yalnızca sahip komutlarını çalıştırmasına ve tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır. DM eşleştirme yalnızca birinin botla konuşmasına izin verir; ilk sahip bootstrap'i var olmadan önce bir göndericiyi onayladıysanız `commands.ownerAllowFrom` değerini açıkça ayarlayın.
- Doctor, Codex modu ajanlar yapılandırıldığında ve operatörün Codex home'unda kişisel Codex CLI varlıkları bulunduğunda uyarır. Yerel Codex app-server başlatmaları izole ajan başına home'lar kullanır, bu nedenle bilinçli olarak yükseltilmesi gereken varlıkların envanterini çıkarmak için `openclaw migrate codex --dry-run` kullanın.
- Sandbox modu etkinse ancak Docker kullanılamıyorsa doctor, giderimle birlikte yüksek sinyalli bir uyarı bildirir (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`).
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyorsa ve geçerli komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı bildirir ve düz metin yedek kimlik bilgileri yazmaz.
- Bir düzeltme yolunda kanal SecretRef incelemesi başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı bildirir.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), geçerli komut yolunda çözümlenebilir bir Telegram token'ı gerektirir. Token incelemesi kullanılamıyorsa doctor bir uyarı bildirir ve o geçiş için otomatik çözümlemeyi atlar.

## macOS: `launchctl` env geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız, bu değer yapılandırma dosyanızı geçersiz kılar ve kalıcı “yetkisiz” hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## İlgili

- [CLI referansı](/tr/cli)
- [Gateway doctor](/tr/gateway/doctor)
