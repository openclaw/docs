---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve rehberli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve bir sağlamlık kontrolü istiyorsunuz
summary: '`openclaw doctor` için CLI referansı (sağlık kontrolleri + rehberli onarımlar)'
title: Doktor
x-i18n:
    generated_at: "2026-05-11T20:26:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f2dd99f339e4fcdeeae840b75098f3c251b3aa133b7ea11b040b3c7f32c200
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

Kanala özgü izinler için `doctor` yerine kanal yoklamalarını kullanın:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Hedeflenmiş Discord yetenekleri yoklaması botun etkin kanal izinlerini bildirir; durum yoklaması yapılandırılmış Discord kanallarını ve sesli otomatik katılma hedeflerini denetler.

## Seçenekler

- `--no-workspace-suggestions`: çalışma alanı belleği/arama önerilerini devre dışı bırak
- `--yes`: sormadan varsayılanları kabul et
- `--repair`: önerilen hizmet dışı onarımları sormadan uygula; Gateway hizmeti kurulumları ve yeniden yazımları hâlâ etkileşimli onay veya açık Gateway komutları gerektirir
- `--fix`: `--repair` için takma ad
- `--force`: gerektiğinde özel hizmet yapılandırmasının üzerine yazma dahil agresif onarımları uygula
- `--non-interactive`: istemler olmadan çalıştır; yalnızca güvenli migrasyonlar ve hizmet dışı onarımlar
- `--generate-gateway-token`: bir Gateway token'ı oluştur ve yapılandır
- `--deep`: ek Gateway kurulumları için sistem hizmetlerini tara ve son Gateway supervisor yeniden başlatma devirlerini bildir

Notlar:

- Nix modunda (`OPENCLAW_NIX_MODE=1`), salt okunur doctor denetimleri çalışmaya devam eder, ancak `openclaw.json` değiştirilemez olduğu için `doctor --fix`, `doctor --repair`, `doctor --yes` ve `doctor --generate-gateway-token` devre dışıdır. Bunun yerine bu kurulum için Nix kaynağını düzenleyin; nix-openclaw için agent öncelikli [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kullanın.
- Etkileşimli istemler (anahtar zinciri/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlanmamış** olduğunda çalışır. Headless çalıştırmalar (cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimsiz `doctor` çalıştırmaları, headless sağlık denetimlerinin hızlı kalması için istekli Plugin yüklemeyi atlar. Etkileşimli oturumlar, bir denetim katkılarına ihtiyaç duyduğunda Plugin'leri yine de tamamen yükler.
- `--fix` (`--repair` için takma ad) `~/.openclaw/openclaw.json.bak` dosyasına bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını düşürerek her kaldırmayı listeler.
- `doctor --fix --non-interactive`, eksik veya eski Gateway hizmet tanımlarını bildirir ancak güncelleme onarım modu dışında bunları kurmaz veya yeniden yazmaz. Eksik bir hizmet için `openclaw gateway install` çalıştırın ya da başlatıcıyı bilerek değiştirmek istediğinizde `openclaw gateway install --force` kullanın.
- Durum bütünlüğü denetimleri artık oturumlar dizinindeki sahipsiz transkript dosyalarını algılar. Bunları `.deleted.<timestamp>` olarak arşivlemek etkileşimli onay gerektirir; `--fix`, `--yes` ve headless çalıştırmalar bunları yerinde bırakır.
- Doctor ayrıca zamanlayıcının çalışma zamanında otomatik normalleştirmek zorunda kalmasından önce eski cron işi şekilleri için `~/.openclaw/cron/jobs.json` (veya `cron.store`) dosyasını tarar ve bunları yerinde yeniden yazabilir.
- Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` çalıştırdığında uyarır; bu betik artık bakımı yapılmıyor ve cron systemd kullanıcı veri yolu ortamına sahip olmadığında yanlış WhatsApp Gateway kesintileri kaydedebilir.
- WhatsApp etkinleştirildiğinde doctor, yerel `openclaw-tui` istemcileri hâlâ çalışırken bozulmuş bir Gateway olay döngüsünü denetler. `doctor --fix`, WhatsApp yanıtlarının eski TUI yenileme döngülerinin arkasında sıraya alınmaması için yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
- Doctor eski `openai-codex/*` model referanslarını birincil modeller, yedekler, heartbeat/subagent/compaction geçersiz kılmaları, kancalar, kanal model geçersiz kılmaları ve eski oturum rota sabitlemeleri genelinde kanonik `openai/*` referanslarına yeniden yazar. `--fix`, Codex niyetini sağlayıcı/model kapsamlı `agentRuntime.id: "codex"` girdilerine taşır, `openai-codex:...` gibi oturum auth-profile sabitlemelerini korur, eski tüm-agent/oturum runtime sabitlemelerini kaldırır ve onarılmış OpenAI agent referanslarını doğrudan OpenAI API anahtarı kimlik doğrulaması yerine Codex auth yönlendirmesinde tutar.
- Doctor, eski OpenClaw sürümleri tarafından oluşturulmuş eski Plugin bağımlılığı hazırlama durumunu temizler. Ayrıca `plugins.entries`, yapılandırılmış kanallar, yapılandırılmış sağlayıcı/arama ayarları veya yapılandırılmış agent runtime'ları gibi yapılandırma tarafından başvurulan eksik indirilebilir Plugin'leri onarır. Paket güncellemeleri sırasında doctor, paket değişimi tamamlanana kadar paket yöneticisi Plugin onarımını atlar; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa ardından `openclaw doctor --fix` yeniden çalıştırın. İndirme başarısız olursa doctor kurulum hatasını bildirir ve sonraki onarım denemesi için yapılandırılmış Plugin girdisini korur.
- Doctor, Plugin keşfi sağlıklıyken eksik Plugin kimliklerini `plugins.allow`/`plugins.deny`/`plugins.entries` içinden ve buna ek olarak eşleşen sarkan kanal yapılandırmasını, heartbeat hedeflerini ve kanal model geçersiz kılmalarını kaldırarak eski Plugin yapılandırmasını onarır.
- Doctor, etkilenen `plugins.entries.<id>` girdisini devre dışı bırakarak ve geçersiz `config` yükünü kaldırarak geçersiz Plugin yapılandırmasını karantinaya alır. Gateway başlatması zaten yalnızca o hatalı Plugin'i atlar, böylece diğer Plugin'ler ve kanallar çalışmaya devam edebilir.
- Gateway yaşam döngüsüne başka bir supervisor sahipse `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor Gateway/hizmet sağlığını bildirmeye ve hizmet dışı onarımları uygulamaya devam eder, ancak hizmet kurulumunu/başlatmasını/yeniden başlatmasını/bootstrap işlemini ve eski hizmet temizliğini atlar.
- Linux'ta doctor etkin olmayan ek Gateway benzeri systemd birimlerini yok sayar ve onarım sırasında çalışan bir systemd Gateway hizmeti için komut/giriş noktası meta verilerini yeniden yazmaz. Aktif başlatıcıyı bilerek değiştirmek istediğinizde önce hizmeti durdurun veya `openclaw gateway install --force` kullanın.
- Doctor eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) `talk.provider` + `talk.providers.<provider>` içine otomatik geçirir.
- Tek fark nesne anahtarı sırası olduğunda tekrarlanan `doctor --fix` çalıştırmaları artık Talk normalleştirmesini bildirmez/uygulamaz.
- Doctor bir bellek araması hazırlık denetimi içerir ve embedding kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Doctor hiçbir komut sahibi yapılandırılmadığında uyarır. Komut sahibi, yalnızca sahibin çalıştırabileceği komutları çalıştırmasına ve tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır. DM eşleştirmesi yalnızca birinin botla konuşmasına izin verir; ilk sahip bootstrap'ı mevcut olmadan önce bir göndericiyi onayladıysanız `commands.ownerAllowFrom` değerini açıkça ayarlayın.
- Doctor, Codex modu agent'ları yapılandırıldığında ve operatörün Codex evinde kişisel Codex CLI varlıkları bulunduğunda uyarır. Yerel Codex uygulama sunucusu başlatmaları izole agent başına evler kullanır, bu nedenle bilinçli olarak yükseltilmesi gereken varlıkların envanterini çıkarmak için `openclaw migrate codex --dry-run` kullanın.
- Doctor emekli edilmiş `plugins.entries.codex.config.codexDynamicToolsProfile` değerini kaldırır; Codex uygulama sunucusu Codex'e özgü çalışma alanı araçlarını her zaman doğal biçimde tutar.
- Doctor, varsayılan agent için izin verilen Skills'ler mevcut çalışma zamanı ortamında bin'ler, ortam değişkenleri, yapılandırma veya işletim sistemi gereksinimleri eksik olduğu için kullanılamadığında uyarır. `doctor --fix`, bu kullanılamayan Skills'leri `skills.entries.<skill>.enabled=false` ile devre dışı bırakabilir; beceriyi etkin tutmak istediğinizde bunun yerine eksik gereksinimi kurun/yapılandırın.
- Sandbox modu etkinse ancak Docker kullanılamıyorsa doctor, düzeltmeyle birlikte yüksek sinyal uyarısı bildirir (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`).
- Eski sandbox kayıt defteri dosyaları (`~/.openclaw/sandbox/containers.json` veya `~/.openclaw/sandbox/browsers.json`) mevcutsa doctor bunları bildirir; `openclaw doctor --fix` geçerli girdileri parçalanmış kayıt defteri dizinlerine geçirir ve geçersiz eski dosyaları karantinaya alır.
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyorsa ve mevcut komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı bildirir ve düz metin yedek kimlik bilgileri yazmaz.
- Kanal SecretRef incelemesi bir düzeltme yolunda başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı bildirir.
- Durum dizini migrasyonlarından sonra doctor, etkinleştirilmiş varsayılan Telegram veya Discord hesapları env fallback'e bağlı olduğunda ve `TELEGRAM_BOT_TOKEN` veya `DISCORD_BOT_TOKEN` doctor işlemine kullanılamadığında uyarır.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), mevcut komut yolunda çözümlenebilir bir Telegram token'ı gerektirir. Token incelemesi kullanılamıyorsa doctor bir uyarı bildirir ve o geçiş için otomatik çözümlemeyi atlar.

## macOS: `launchctl` env geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız, bu değer yapılandırma dosyanızı geçersiz kılar ve kalıcı "yetkisiz" hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## İlgili

- [CLI referansı](/tr/cli)
- [Gateway doctor](/tr/gateway/doctor)
