---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve rehberli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve temel bir doğrulama istiyorsunuz
summary: '`openclaw doctor` için CLI referansı (sağlık kontrolleri + rehberli onarımlar)'
title: Doktor
x-i18n:
    generated_at: "2026-04-30T09:12:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9985c84d23861dd9468a4659ee00519573fe6d540c436548da0a68067dbabc4c
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
- `--repair`: önerilen onarımları sormadan uygula
- `--fix`: `--repair` için diğer ad
- `--force`: gerektiğinde özel servis yapılandırmasının üzerine yazmak dahil agresif onarımları uygula
- `--non-interactive`: istemler olmadan çalıştır; yalnızca güvenli geçişler
- `--generate-gateway-token`: Gateway belirteci oluştur ve yapılandır
- `--deep`: ek Gateway kurulumları için sistem servislerini tara

Notlar:

- Etkileşimli istemler (anahtarlık/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` ayarlanmadığında çalışır. Başsız çalıştırmalar (cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimsiz `doctor` çalıştırmaları, başsız sağlık denetimleri hızlı kalsın diye istekli Plugin yüklemesini atlar. Etkileşimli oturumlar, bir denetim katkılarını gerektirdiğinde Plugin'leri yine tamamen yükler.
- `--fix` (`--repair` için diğer ad) `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını kaldırıp her kaldırmayı listeler.
- Durum bütünlüğü denetimleri artık oturumlar dizinindeki sahipsiz konuşma dökümü dosyalarını algılar. Bunları `.deleted.<timestamp>` olarak arşivlemek etkileşimli onay gerektirir; `--fix`, `--yes` ve başsız çalıştırmalar bunları yerinde bırakır.
- Doctor ayrıca eski cron işi biçimleri için `~/.openclaw/cron/jobs.json` (veya `cron.store`) dosyasını tarar ve zamanlayıcının çalışma zamanında bunları otomatik normalleştirmesi gerekmeden önce yerinde yeniden yazabilir.
- Doctor, paketlenmiş global kurulumlara yazmadan eksik paketli Plugin çalışma zamanı bağımlılıklarını onarır. Root sahipli npm kurulumları veya sıkılaştırılmış systemd birimleri için `OPENCLAW_PLUGIN_STAGE_DIR` değerini `/var/lib/openclaw/plugin-runtime-deps` gibi yazılabilir bir dizine ayarlayın; bu değer `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps` gibi bir yol listesi de olabilir; önceki kökler salt okunur arama katmanlarıdır ve son kök onarım hedefidir.
- Doctor, eksik Plugin kimliklerini `plugins.allow`/`plugins.entries` içinden, ayrıca eşleşen kopuk kanal yapılandırmasını, Heartbeat hedeflerini ve kanal model geçersiz kılmalarını, Plugin keşfi sağlıklıyken kaldırarak bayat Plugin yapılandırmasını onarır.
- Doctor, etkilenen `plugins.entries.<id>` girdisini devre dışı bırakıp geçersiz `config` yükünü kaldırarak geçersiz Plugin yapılandırmasını karantinaya alır. Gateway başlatma zaten yalnızca o bozuk Plugin'i atlar, böylece diğer Plugin'ler ve kanallar çalışmaya devam edebilir.
- Gateway yaşam döngüsü başka bir denetleyici tarafından yönetildiğinde `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor yine Gateway/servis sağlığını raporlar ve servis dışı onarımları uygular, ancak servis kurma/başlatma/yeniden başlatma/önyükleme ve eski servis temizliğini atlar.
- Linux'ta doctor etkin olmayan ek Gateway benzeri systemd birimlerini yok sayar ve onarım sırasında çalışan bir systemd Gateway servisi için komut/giriş noktası meta verilerini yeniden yazmaz. Etkin başlatıcıyı bilinçli olarak değiştirmek istediğinizde önce servisi durdurun veya `openclaw gateway install --force` kullanın.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` biçimine geçirir.
- Tek fark nesne anahtarı sırası olduğunda tekrarlanan `doctor --fix` çalıştırmaları artık Talk normalleştirmesini raporlamaz/uygulamaz.
- Doctor bir bellek araması hazır olma denetimi içerir ve gömme kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Doctor, hiçbir komut sahibi yapılandırılmadığında uyarır. Komut sahibi, yalnızca sahibin çalıştırabileceği komutları çalıştırmasına ve tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır. DM eşleştirme yalnızca birinin botla konuşmasına izin verir; ilk sahip önyüklemesi var olmadan önce bir göndericiyi onayladıysanız `commands.ownerAllowFrom` değerini açıkça ayarlayın.
- Korumalı alan modu etkinse ancak Docker kullanılamıyorsa doctor, çözümle birlikte yüksek sinyalli bir uyarı bildirir (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`).
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyorsa ve geçerli komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı bildirir ve düz metin yedek kimlik bilgileri yazmaz.
- Bir düzeltme yolunda kanal SecretRef incelemesi başarısız olursa doctor devam eder ve erken çıkmak yerine bir uyarı bildirir.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), geçerli komut yolunda çözümlenebilir bir Telegram belirteci gerektirir. Belirteç incelemesi kullanılamıyorsa doctor bir uyarı bildirir ve o geçiş için otomatik çözümlemeyi atlar.

## macOS: `launchctl` env geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız, bu değer yapılandırma dosyanızın önüne geçer ve kalıcı “yetkisiz” hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## İlgili

- [CLI referansı](/tr/cli)
- [Gateway doctor](/tr/gateway/doctor)
