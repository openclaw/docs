---
read_when:
    - Bağlantı/kimlik doğrulama sorunları yaşıyorsunuz ve rehberli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve bir sağlama kontrolü istiyorsunuz
summary: '`openclaw doctor` için CLI referansı (sağlık kontrolleri + rehberli onarımlar)'
title: Doktor
x-i18n:
    generated_at: "2026-05-05T08:25:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6101008d1cb7e08f9902a8a29785710f325966524b003b87b5c628fe906ab78
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
- `--repair`: önerilen servis dışı onarımları sormadan uygula; Gateway servisi kurulumları ve yeniden yazımları yine de etkileşimli onay veya açık Gateway komutları gerektirir
- `--fix`: `--repair` için takma ad
- `--force`: gerektiğinde özel servis yapılandırmasının üzerine yazma dahil agresif onarımları uygula
- `--non-interactive`: istemler olmadan çalıştır; yalnızca güvenli migrasyonlar ve servis dışı onarımlar
- `--generate-gateway-token`: bir Gateway belirteci oluştur ve yapılandır
- `--deep`: ek Gateway kurulumları için sistem servislerini tara ve son Gateway denetleyicisi yeniden başlatma devretmelerini raporla

Notlar:

- Etkileşimli istemler (anahtarlık/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlanmamış** olduğunda çalışır. Başsız çalıştırmalar (cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimsiz `doctor` çalıştırmaları, başsız sağlık kontrollerinin hızlı kalması için istekli Plugin yüklemeyi atlar. Etkileşimli oturumlar, bir kontrol katkılarına ihtiyaç duyduğunda Plugin'leri yine de tam olarak yükler.
- `--fix` (`--repair` için takma ad), `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını kaldırıp her kaldırmayı listeler.
- `doctor --fix --non-interactive`, eksik veya eski Gateway servisi tanımlarını bildirir ancak güncelleme onarımı modu dışında bunları kurmaz ya da yeniden yazmaz. Eksik bir servis için `openclaw gateway install` komutunu, başlatıcıyı bilerek değiştirmek istediğinizde ise `openclaw gateway install --force` komutunu çalıştırın.
- Durum bütünlüğü kontrolleri artık oturumlar dizinindeki yetim transkript dosyalarını algılar. Bunları `.deleted.<timestamp>` olarak arşivlemek etkileşimli onay gerektirir; `--fix`, `--yes` ve başsız çalıştırmalar bunları yerinde bırakır.
- Doctor ayrıca `~/.openclaw/cron/jobs.json` (veya `cron.store`) içinde eski Cron iş biçimlerini tarar ve zamanlayıcının bunları çalışma zamanında otomatik normalleştirmesi gerekmeden önce yerinde yeniden yazabilir.
- Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` dosyasını çalıştırdığında uyarır; bu betik artık sürdürülmez ve cron systemd kullanıcı veri yolu ortamına sahip olmadığında hatalı WhatsApp Gateway kesintileri günlüğe yazabilir.
- WhatsApp etkinleştirildiğinde doctor, yerel `openclaw-tui` istemcileri hâlâ çalışırken bozulmuş bir Gateway olay döngüsü olup olmadığını kontrol eder. `doctor --fix`, WhatsApp yanıtlarının eski TUI yenileme döngülerinin arkasında kuyruğa alınmaması için yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
- Doctor, eski OpenClaw sürümleri tarafından oluşturulan eski Plugin bağımlılığı hazırlama durumunu temizler. Ayrıca `plugins.entries`, yapılandırılmış kanallar, yapılandırılmış sağlayıcı/arama ayarları veya yapılandırılmış aracı çalışma zamanları gibi yapılandırma tarafından başvurulan eksik indirilebilir Plugin'leri onarır. Paket güncellemeleri sırasında doctor, paket değişimi tamamlanana kadar paket yöneticisi Plugin onarımını atlar; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa sonrasında `openclaw doctor --fix` komutunu yeniden çalıştırın. İndirme başarısız olursa doctor kurulum hatasını raporlar ve sonraki onarım denemesi için yapılandırılmış Plugin girdisini korur.
- Doctor, Plugin keşfi sağlıklı olduğunda eksik Plugin kimliklerini `plugins.allow`/`plugins.entries` içinden, ayrıca eşleşen askıda kanal yapılandırmasını, Heartbeat hedeflerini ve kanal model geçersiz kılmalarını kaldırarak eski Plugin yapılandırmasını onarır.
- Doctor, etkilenen `plugins.entries.<id>` girdisini devre dışı bırakarak ve geçersiz `config` yükünü kaldırarak geçersiz Plugin yapılandırmasını karantinaya alır. Gateway başlangıcı zaten yalnızca bu bozuk Plugin'i atlar; böylece diğer Plugin'ler ve kanallar çalışmaya devam edebilir.
- Gateway yaşam döngüsüne başka bir denetleyici sahipse `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor Gateway/servis sağlığını raporlamaya ve servis dışı onarımları uygulamaya devam eder, ancak servis kurulumunu/başlatmayı/yeniden başlatmayı/bootstrap işlemini ve eski servis temizliğini atlar.
- Linux'ta doctor, etkin olmayan ek Gateway benzeri systemd birimlerini yok sayar ve onarım sırasında çalışan bir systemd Gateway servisi için komut/giriş noktası meta verilerini yeniden yazmaz. Etkin başlatıcıyı bilerek değiştirmek istediğinizde önce servisi durdurun veya `openclaw gateway install --force` kullanın.
- Doctor eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` içine taşır.
- Tek fark nesne anahtarı sırası olduğunda tekrarlanan `doctor --fix` çalıştırmaları artık Talk normalleştirmesini raporlamaz/uygulamaz.
- Doctor bir bellek arama hazırlık kontrolü içerir ve gömme kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Doctor hiçbir komut sahibi yapılandırılmadığında uyarır. Komut sahibi, yalnızca sahibe açık komutları çalıştırmasına ve tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır. DM eşleştirme yalnızca birinin bot ile konuşmasına izin verir; ilk sahip bootstrap'i var olmadan önce bir göndericiyi onayladıysanız `commands.ownerAllowFrom` değerini açıkça ayarlayın.
- Doctor, Codex modundaki aracılar yapılandırıldığında ve operatörün Codex ana dizininde kişisel Codex CLI varlıkları bulunduğunda uyarır. Yerel Codex uygulama sunucusu başlatmaları aracı başına yalıtılmış ana dizinler kullanır; bu nedenle bilinçli olarak yükseltilmesi gereken varlıkları envanterlemek için `openclaw migrate codex --dry-run` kullanın.
- Doctor, varsayılan aracı için izin verilen Skills geçerli çalışma zamanı ortamında kullanılamadığında uyarır; çünkü binler, ortam değişkenleri, yapılandırma veya işletim sistemi gereksinimleri eksiktir. `doctor --fix`, bu kullanılamayan Skills öğelerini `skills.entries.<skill>.enabled=false` ile devre dışı bırakabilir; skill'i etkin tutmak istediğinizde bunun yerine eksik gereksinimi kurun/yapılandırın.
- Sandbox modu etkinse ancak Docker kullanılamıyorsa doctor, düzeltme önerisiyle (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`) yüksek sinyalli bir uyarı raporlar.
- Eski sandbox kayıt dosyaları (`~/.openclaw/sandbox/containers.json` veya `~/.openclaw/sandbox/browsers.json`) varsa doctor bunları raporlar; `openclaw doctor --fix` geçerli girdileri parçalanmış kayıt dizinlerine taşır ve geçersiz eski dosyaları karantinaya alır.
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyor ve geçerli komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı raporlar ve düz metin yedek kimlik bilgileri yazmaz.
- Bir düzeltme yolunda kanal SecretRef incelemesi başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı raporlar.
- Durum dizini migrasyonlarından sonra doctor, etkin varsayılan Telegram veya Discord hesapları ortam yedeğine bağlıyken `TELEGRAM_BOT_TOKEN` veya `DISCORD_BOT_TOKEN` doctor süreci tarafından kullanılamadığında uyarır.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), geçerli komut yolunda çözümlenebilir bir Telegram belirteci gerektirir. Belirteç incelemesi kullanılamıyorsa doctor bir uyarı raporlar ve bu geçiş için otomatik çözümlemeyi atlar.

## macOS: `launchctl` ortam geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız, bu değer yapılandırma dosyanızın üzerine çıkar ve kalıcı "yetkisiz" hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway doctor](/tr/gateway/doctor)
