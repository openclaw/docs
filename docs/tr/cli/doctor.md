---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve yönlendirmeli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve bir sağlamlık kontrolü istiyorsunuz
summary: '`openclaw doctor` için CLI referansı (sağlık denetimleri + rehberli onarımlar)'
title: Tanılama
x-i18n:
    generated_at: "2026-05-05T01:44:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 079d7674ae2a259a0430e30e7577ac532135ad5461c57c4b3a6514a007bc9ea5
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway ve kanallar için sağlık kontrolleri + hızlı düzeltmeler.

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
- `--repair`: sormadan önerilen servis dışı onarımları uygula; Gateway servisi kurulumları ve yeniden yazmaları yine de etkileşimli onay veya açık Gateway komutları gerektirir
- `--fix`: `--repair` için takma ad
- `--force`: gerektiğinde özel servis yapılandırmasının üzerine yazmak dahil, agresif onarımları uygula
- `--non-interactive`: istemler olmadan çalıştır; yalnızca güvenli migrasyonlar ve servis dışı onarımlar
- `--generate-gateway-token`: bir Gateway token'ı oluştur ve yapılandır
- `--deep`: ek Gateway kurulumları için sistem servislerini tara

Notlar:

- Etkileşimli istemler (anahtar zinciri/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlanmadığında** çalışır. Başsız çalıştırmalar (cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimsiz `doctor` çalıştırmaları, başsız sağlık kontrollerinin hızlı kalması için istekli Plugin yüklemeyi atlar. Etkileşimli oturumlar, bir kontrol onların katkısına ihtiyaç duyduğunda Plugin'leri yine de tamamen yükler.
- `--fix` (`--repair` için takma ad), `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını kaldırarak her kaldırmayı listeler.
- `doctor --fix --non-interactive`, eksik veya eski Gateway servis tanımlarını bildirir ancak güncelleme onarım modu dışında bunları kurmaz veya yeniden yazmaz. Eksik bir servis için `openclaw gateway install` çalıştırın veya başlatıcıyı bilinçli olarak değiştirmek istediğinizde `openclaw gateway install --force` kullanın.
- Durum bütünlüğü kontrolleri artık sessions dizinindeki sahipsiz transcript dosyalarını algılar. Bunları `.deleted.<timestamp>` olarak arşivlemek etkileşimli onay gerektirir; `--fix`, `--yes` ve başsız çalıştırmalar bunları yerinde bırakır.
- Doctor ayrıca eski cron işi şekilleri için `~/.openclaw/cron/jobs.json` dosyasını (veya `cron.store`) tarar ve zamanlayıcının çalışma zamanında otomatik normalleştirme yapması gerekmeden önce bunları yerinde yeniden yazabilir.
- Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` betiğini çalıştırdığında uyarır; bu betik artık bakım almıyor ve cron systemd kullanıcı veri yolu ortamından yoksun olduğunda hatalı WhatsApp Gateway kesintileri günlüğe yazabilir.
- Doctor, eski OpenClaw sürümlerinin oluşturduğu eski Plugin bağımlılık hazırlama durumunu temizler. Ayrıca `plugins.entries`, yapılandırılmış kanallar, yapılandırılmış sağlayıcı/arama ayarları veya yapılandırılmış agent runtime'ları gibi yapılandırma tarafından başvurulan eksik indirilebilir Plugin'leri onarır. Paket güncellemeleri sırasında doctor, paket değişimi tamamlanana kadar paket yöneticisi Plugin onarımını atlar; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa daha sonra `openclaw doctor --fix` komutunu yeniden çalıştırın. İndirme başarısız olursa doctor kurulum hatasını bildirir ve bir sonraki onarım denemesi için yapılandırılmış Plugin girdisini korur.
- Doctor, Plugin keşfi sağlıklıyken eksik Plugin kimliklerini `plugins.allow`/`plugins.entries` içinden ve eşleşen askıda kalmış kanal yapılandırmasını, Heartbeat hedeflerini ve kanal model geçersiz kılmalarını kaldırarak eski Plugin yapılandırmasını onarır.
- Doctor, etkilenen `plugins.entries.<id>` girdisini devre dışı bırakarak ve geçersiz `config` yükünü kaldırarak geçersiz Plugin yapılandırmasını karantinaya alır. Gateway başlangıcı zaten yalnızca o hatalı Plugin'i atlar, böylece diğer Plugin'ler ve kanallar çalışmaya devam edebilir.
- Gateway yaşam döngüsünü başka bir supervisor yönetiyorsa `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor yine Gateway/servis sağlığını bildirir ve servis dışı onarımları uygular, ancak servis kurma/başlatma/yeniden başlatma/bootstrap ve eski servis temizliğini atlar.
- Linux'ta doctor, etkin olmayan ek Gateway benzeri systemd birimlerini yok sayar ve onarım sırasında çalışan bir systemd Gateway servisi için komut/giriş noktası metadata'sını yeniden yazmaz. Etkin başlatıcıyı bilinçli olarak değiştirmek istediğinizde önce servisi durdurun veya `openclaw gateway install --force` kullanın.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` içine taşır.
- Tek fark nesne anahtarı sırası olduğunda, yinelenen `doctor --fix` çalıştırmaları artık Talk normalleştirmesini bildirmez/uygulamaz.
- Doctor, bellek arama hazırlığı kontrolü içerir ve embedding kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Doctor, komut sahibi yapılandırılmadığında uyarır. Komut sahibi, yalnızca sahibi ilgilendiren komutları çalıştırmasına ve tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır. DM eşleştirmesi yalnızca birinin botla konuşmasına izin verir; ilk sahip bootstrap'i var olmadan önce bir göndericiyi onayladıysanız, `commands.ownerAllowFrom` değerini açıkça ayarlayın.
- Doctor, Codex modlu agent'lar yapılandırıldığında ve operatörün Codex ana dizininde kişisel Codex CLI varlıkları bulunduğunda uyarır. Yerel Codex uygulama sunucusu başlatmaları izole agent başına ana dizinler kullanır; bu nedenle bilinçli olarak yükseltilmesi gereken varlıkları envantere almak için `openclaw migrate codex --dry-run` kullanın.
- Doctor, varsayılan agent için izin verilen skills geçerli runtime ortamında kullanılamadığında uyarır; bunun nedeni bin'lerin, ortam değişkenlerinin, yapılandırmanın veya işletim sistemi gereksinimlerinin eksik olması olabilir. `doctor --fix`, bu kullanılamayan skills'i `skills.entries.<skill>.enabled=false` ile devre dışı bırakabilir; skill'i etkin tutmak istediğinizde bunun yerine eksik gereksinimi kurun/yapılandırın.
- Sandbox modu etkinse ancak Docker kullanılamıyorsa, doctor düzeltme önerisiyle (`Docker'ı kur` veya `openclaw config set agents.defaults.sandbox.mode off`) yüksek sinyal değerine sahip bir uyarı bildirir.
- Eski sandbox registry dosyaları (`~/.openclaw/sandbox/containers.json` veya `~/.openclaw/sandbox/browsers.json`) varsa doctor bunları bildirir; `openclaw doctor --fix` geçerli girdileri parçalı registry dizinlerine taşır ve geçersiz eski dosyaları karantinaya alır.
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyorsa ve geçerli komut yolunda kullanılamıyorsa, doctor salt okunur bir uyarı bildirir ve düz metin yedek kimlik bilgileri yazmaz.
- Bir düzeltme yolunda kanal SecretRef incelemesi başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı bildirir.
- Durum dizini migrasyonlarından sonra doctor, etkin varsayılan Telegram veya Discord hesapları ortam yedeğine bağlı olduğunda ve `TELEGRAM_BOT_TOKEN` ya da `DISCORD_BOT_TOKEN` doctor süreci tarafından kullanılamadığında uyarır.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), geçerli komut yolunda çözümlenebilir bir Telegram token'ı gerektirir. Token incelemesi kullanılamıyorsa doctor bir uyarı bildirir ve o geçiş için otomatik çözümlemeyi atlar.

## macOS: `launchctl` ortam geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız, bu değer yapılandırma dosyanızı geçersiz kılar ve kalıcı “yetkisiz” hatalara neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway doctor](/tr/gateway/doctor)
