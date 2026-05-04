---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve rehberli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve temel bir kontrol istiyorsunuz
summary: 'CLI referansı: `openclaw doctor` (sağlık kontrolleri + rehberli onarımlar)'
title: Doktor
x-i18n:
    generated_at: "2026-05-04T02:22:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd7fb09d373c313e4be45ad9e3b19ceb187a5787ef3e70fcd2b1f1f01b50c905
    source_path: cli/doctor.md
    workflow: 16
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

- `--no-workspace-suggestions`: çalışma alanı belleği/arama önerilerini devre dışı bırak
- `--yes`: sormadan varsayılanları kabul et
- `--repair`: sormadan önerilen hizmet dışı onarımları uygula; Gateway hizmeti kurulumları ve yeniden yazmaları hâlâ etkileşimli onay veya açık Gateway komutları gerektirir
- `--fix`: `--repair` için takma ad
- `--force`: gerektiğinde özel hizmet yapılandırmasının üzerine yazma dahil, agresif onarımları uygula
- `--non-interactive`: istemler olmadan çalıştır; yalnızca güvenli geçişler ve hizmet dışı onarımlar
- `--generate-gateway-token`: bir Gateway belirteci oluştur ve yapılandır
- `--deep`: ek Gateway kurulumları için sistem hizmetlerini tara

Notlar:

- Etkileşimli istemler (anahtar zinciri/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlanmamışsa** çalışır. Başsız çalıştırmalar (Cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimsiz `doctor` çalıştırmaları, başsız sağlık kontrollerinin hızlı kalması için hevesli Plugin yüklemeyi atlar. Etkileşimli oturumlar, bir kontrol katkılarına ihtiyaç duyduğunda Plugin'leri yine tamamen yükler.
- `--fix` (`--repair` için takma ad), `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını kaldırarak her kaldırmayı listeler.
- `doctor --fix --non-interactive`, eksik veya eski Gateway hizmet tanımlarını bildirir ancak güncelleme onarım modu dışında bunları kurmaz veya yeniden yazmaz. Eksik bir hizmet için `openclaw gateway install` çalıştırın veya başlatıcıyı bilinçli olarak değiştirmek istediğinizde `openclaw gateway install --force` kullanın.
- Durum bütünlüğü kontrolleri artık oturumlar dizinindeki sahipsiz transkript dosyalarını algılar. Bunları `.deleted.<timestamp>` olarak arşivlemek etkileşimli onay gerektirir; `--fix`, `--yes` ve başsız çalıştırmalar bunları yerinde bırakır.
- Doctor ayrıca eski Cron işi biçimleri için `~/.openclaw/cron/jobs.json` (veya `cron.store`) dosyasını tarar ve zamanlayıcının çalışma zamanında bunları otomatik normalleştirmesi gerekmeden önce yerinde yeniden yazabilir.
- Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` betiğini çalıştırdığında uyarır; bu betiğin bakımı artık yapılmıyor ve Cron systemd kullanıcı veri yolu ortamından yoksun olduğunda hatalı WhatsApp Gateway kesinti kayıtları oluşturabilir.
- Doctor, eski OpenClaw sürümleri tarafından oluşturulan eski Plugin bağımlılığı hazırlama durumunu temizler. Ayrıca kayıt defteri bunları çözümleyebildiğinde eksik yapılandırılmış indirilebilir Plugin'leri onarır ve 2026.5.2 doctor geçişi, yapılandırmayı bu sürüm için dokunulmuş olarak işaretlemeden önce eski bir yapılandırmanın zaten kullandığı indirilebilir Plugin'leri otomatik olarak kurar. İndirme başarısız olursa doctor kurulum hatasını bildirir ve yapılandırılmış Plugin girdisini bir sonraki onarım denemesi için korur.
- Doctor, Plugin keşfi sağlıklı olduğunda eksik Plugin kimliklerini `plugins.allow`/`plugins.entries` içinden, ayrıca eşleşen sarkan kanal yapılandırmasını, Heartbeat hedeflerini ve kanal modeli geçersiz kılmalarını kaldırarak eski Plugin yapılandırmasını onarır.
- Doctor, etkilenen `plugins.entries.<id>` girdisini devre dışı bırakarak ve geçersiz `config` yükünü kaldırarak geçersiz Plugin yapılandırmasını karantinaya alır. Gateway başlatması zaten yalnızca o bozuk Plugin'i atlar, böylece diğer Plugin'ler ve kanallar çalışmaya devam edebilir.
- Gateway yaşam döngüsüne başka bir gözetmen sahip olduğunda `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor yine Gateway/hizmet sağlığını bildirir ve hizmet dışı onarımları uygular, ancak hizmet kurulumunu/başlatmayı/yeniden başlatmayı/bootstrap'u ve eski hizmet temizliğini atlar.
- Linux'ta doctor, etkin olmayan ek Gateway benzeri systemd birimlerini yok sayar ve onarım sırasında çalışan bir systemd Gateway hizmeti için komut/giriş noktası meta verilerini yeniden yazmaz. Etkin başlatıcıyı bilinçli olarak değiştirmek istediğinizde önce hizmeti durdurun veya `openclaw gateway install --force` kullanın.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` içine geçirir.
- Yinelenen `doctor --fix` çalıştırmaları, tek fark nesne anahtarı sırası olduğunda artık Talk normalleştirmesini bildirmez/uygulamaz.
- Doctor bir bellek araması hazırlık kontrolü içerir ve gömme kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Doctor, hiçbir komut sahibi yapılandırılmadığında uyarır. Komut sahibi, yalnızca sahibin çalıştırabildiği komutları çalıştırmasına ve tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır. DM eşleştirmesi yalnızca birinin botla konuşmasına izin verir; ilk sahip bootstrap'i var olmadan önce bir göndericiyi onayladıysanız `commands.ownerAllowFrom` değerini açıkça ayarlayın.
- Doctor, Codex modu aracıları yapılandırıldığında ve operatörün Codex ana dizininde kişisel Codex CLI varlıkları bulunduğunda uyarır. Yerel Codex uygulama sunucusu başlatmaları izole edilmiş aracı başına ana dizinler kullanır; bu nedenle bilinçli olarak yükseltilmesi gereken varlıkların envanterini çıkarmak için `openclaw migrate codex --dry-run` kullanın.
- Doctor, varsayılan aracı için izin verilen Skills mevcut çalışma zamanı ortamında kullanılamadığında uyarır; bunun nedeni bin'lerin, ortam değişkenlerinin, yapılandırmanın veya işletim sistemi gereksinimlerinin eksik olmasıdır. `doctor --fix`, kullanılamayan bu Skills'i `skills.entries.<skill>.enabled=false` ile devre dışı bırakabilir; beceriyi etkin tutmak istediğinizde bunun yerine eksik gereksinimi kurun/yapılandırın.
- Korumalı alan modu etkinse ancak Docker kullanılamıyorsa doctor, çözümle birlikte yüksek sinyalli bir uyarı bildirir (`Docker'ı kurun` veya `openclaw config set agents.defaults.sandbox.mode off`).
- Eski korumalı alan kayıt defteri dosyaları (`~/.openclaw/sandbox/containers.json` veya `~/.openclaw/sandbox/browsers.json`) varsa doctor bunları bildirir; `openclaw doctor --fix` geçerli girdileri parçalı kayıt defteri dizinlerine geçirir ve geçersiz eski dosyaları karantinaya alır.
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyorsa ve mevcut komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı bildirir ve düz metin yedek kimlik bilgileri yazmaz.
- Kanal SecretRef denetimi bir düzeltme yolunda başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı bildirir.
- Durum dizini geçişlerinden sonra doctor, etkin varsayılan Telegram veya Discord hesapları ortam yedeğine bağlıysa ve `TELEGRAM_BOT_TOKEN` veya `DISCORD_BOT_TOKEN` doctor süreci tarafından kullanılamıyorsa uyarır.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), mevcut komut yolunda çözümlenebilir bir Telegram belirteci gerektirir. Belirteç denetimi kullanılamıyorsa doctor bir uyarı bildirir ve o geçiş için otomatik çözümlemeyi atlar.

## macOS: `launchctl` ortam geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız, bu değer yapılandırma dosyanızı geçersiz kılar ve kalıcı “yetkisiz” hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway doctor](/tr/gateway/doctor)
