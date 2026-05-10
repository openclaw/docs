---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve rehberli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve hızlı bir kontrol istiyorsunuz
summary: '`openclaw doctor` için CLI başvurusu (sağlık kontrolleri + rehberli onarımlar)'
title: Tanılama
x-i18n:
    generated_at: "2026-05-10T19:29:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c336915c94b6bf703ebece5be429cc0a86be9a2122dd9a912e956579ecb2b096
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

Hedefli Discord yetenek yoklaması, botun geçerli kanal izinlerini bildirir; durum yoklaması yapılandırılmış Discord kanallarını ve sesli otomatik katılma hedeflerini denetler.

## Seçenekler

- `--no-workspace-suggestions`: çalışma alanı bellek/arama önerilerini devre dışı bırak
- `--yes`: sormadan varsayılanları kabul et
- `--repair`: önerilen servis dışı onarımları sormadan uygula; Gateway servisi kurulumları ve yeniden yazmaları yine de etkileşimli onay veya açık Gateway komutları gerektirir
- `--fix`: `--repair` için takma ad
- `--force`: gerektiğinde özel servis yapılandırmasının üzerine yazma dahil agresif onarımları uygula
- `--non-interactive`: istem göstermeden çalıştır; yalnızca güvenli geçişler ve servis dışı onarımlar
- `--generate-gateway-token`: bir Gateway belirteci oluştur ve yapılandır
- `--deep`: ek Gateway kurulumları için sistem servislerini tara ve son Gateway supervisor yeniden başlatma devirlerini bildir

Notlar:

- Nix modunda (`OPENCLAW_NIX_MODE=1`), salt okunur doctor denetimleri çalışmaya devam eder, ancak `openclaw.json` değişmez olduğu için `doctor --fix`, `doctor --repair`, `doctor --yes` ve `doctor --generate-gateway-token` devre dışıdır. Bunun yerine bu kurulumun Nix kaynağını düzenleyin; nix-openclaw için ajan öncelikli [Hızlı başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kullanın.
- Etkileşimli istemler (anahtar zinciri/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlanmamışsa** çalışır. Başsız çalıştırmalar (cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimsiz `doctor` çalıştırmaları, başsız sağlık denetimlerinin hızlı kalması için istekli Plugin yüklemeyi atlar. Etkileşimli oturumlar, bir denetim katkılarına ihtiyaç duyduğunda Plugin'leri hâlâ tamamen yükler.
- `--fix` (`--repair` için takma ad), `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını kaldırarak her kaldırmayı listeler.
- `doctor --fix --non-interactive`, eksik veya eski Gateway servis tanımlarını bildirir ancak güncelleme onarım modu dışında bunları kurmaz veya yeniden yazmaz. Eksik bir servis için `openclaw gateway install` çalıştırın; başlatıcıyı bilerek değiştirmek istediğinizde `openclaw gateway install --force` kullanın.
- Durum bütünlüğü denetimleri artık oturumlar dizinindeki sahipsiz konuşma dökümü dosyalarını algılar. Bunları `.deleted.<timestamp>` olarak arşivlemek etkileşimli onay gerektirir; `--fix`, `--yes` ve başsız çalıştırmalar bunları yerinde bırakır.
- Doctor ayrıca `~/.openclaw/cron/jobs.json` dosyasını (veya `cron.store`) eski Cron işi biçimleri için tarar ve zamanlayıcının çalışma zamanında bunları otomatik normalleştirmesi gerekmeden önce yerinde yeniden yazabilir.
- Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` çalıştırdığında uyarır; bu betik artık bakımı yapılmıyor ve Cron systemd kullanıcı veri yolu ortamından yoksun olduğunda yanlış WhatsApp Gateway kesintileri günlüğe kaydedebilir.
- WhatsApp etkinleştirildiğinde doctor, yerel `openclaw-tui` istemcileri hâlâ çalışırken bozulmuş bir Gateway olay döngüsünü denetler. `doctor --fix`, WhatsApp yanıtlarının eski TUI yenileme döngülerinin arkasında kuyruğa girmemesi için yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
- Doctor, birincil modeller, yedekler, heartbeat/alt ajan/compaction geçersiz kılmaları, hook'lar, kanal model geçersiz kılmaları ve eski oturum rota sabitlemeleri genelinde eski `openai-codex/*` model referanslarını standart `openai/*` referanslarına yeniden yazar. `--fix`, Codex amacını provider/model kapsamlı `agentRuntime.id: "codex"` girişlerine taşır, `openai-codex:...` gibi oturum auth-profile sabitlemelerini korur, eski tüm ajan/oturum runtime sabitlemelerini kaldırır ve onarılmış OpenAI ajan referanslarını doğrudan OpenAI API anahtarı kimlik doğrulaması yerine Codex kimlik doğrulama yönlendirmesinde tutar.
- Doctor, eski OpenClaw sürümleri tarafından oluşturulan eski Plugin bağımlılık hazırlama durumunu temizler. Ayrıca yapılandırmada başvurulan eksik indirilebilir Plugin'leri onarır; örneğin `plugins.entries`, yapılandırılmış kanallar, yapılandırılmış sağlayıcı/arama ayarları veya yapılandırılmış ajan runtime'ları. Paket güncellemeleri sırasında doctor, paket değişimi tamamlanana kadar paket yöneticisi Plugin onarımını atlar; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa sonrasında `openclaw doctor --fix` yeniden çalıştırın. İndirme başarısız olursa doctor kurulum hatasını bildirir ve bir sonraki onarım denemesi için yapılandırılmış Plugin girişini korur.
- Doctor, Plugin keşfi sağlıklı olduğunda `plugins.allow`/`plugins.entries` içindeki eksik Plugin kimliklerini ve eşleşen kopuk kanal yapılandırmasını, Heartbeat hedeflerini ve kanal model geçersiz kılmalarını kaldırarak eski Plugin yapılandırmasını onarır.
- Doctor, etkilenen `plugins.entries.<id>` girişini devre dışı bırakarak ve geçersiz `config` yükünü kaldırarak geçersiz Plugin yapılandırmasını karantinaya alır. Gateway başlatması zaten yalnızca bu bozuk Plugin'i atlar, böylece diğer Plugin'ler ve kanallar çalışmaya devam edebilir.
- Gateway yaşam döngüsü başka bir supervisor tarafından yönetildiğinde `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor, Gateway/servis sağlığını bildirmeye ve servis dışı onarımları uygulamaya devam eder, ancak servis kurulumunu/başlatmayı/yeniden başlatmayı/bootstrap işlemini ve eski servis temizliğini atlar.
- Linux'ta doctor etkin olmayan ek Gateway benzeri systemd birimlerini yok sayar ve onarım sırasında çalışan bir systemd Gateway servisi için komut/giriş noktası meta verilerini yeniden yazmaz. Etkin başlatıcıyı bilerek değiştirmek istediğinizde önce servisi durdurun veya `openclaw gateway install --force` kullanın.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` biçimine geçirir.
- Tek fark nesne anahtarı sırası olduğunda tekrarlanan `doctor --fix` çalıştırmaları artık Talk normalleştirmesini bildirmez/uygulamaz.
- Doctor bir bellek arama hazırlık denetimi içerir ve yerleştirme kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Doctor, hiçbir komut sahibi yapılandırılmadığında uyarır. Komut sahibi, yalnızca sahip komutlarını çalıştırmasına ve tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır. DM eşleştirme yalnızca birinin botla konuşmasına izin verir; ilk sahip bootstrap'i var olmadan önce bir göndericiyi onayladıysanız `commands.ownerAllowFrom` değerini açıkça ayarlayın.
- Doctor, Codex modu ajanlar yapılandırıldığında ve operatörün Codex home dizininde kişisel Codex CLI varlıkları bulunduğunda uyarır. Yerel Codex app-server başlatmaları, ajan başına izole home dizinleri kullanır; bu yüzden bilinçli olarak yükseltilmesi gereken varlıkları envanterlemek için `openclaw migrate codex --dry-run` kullanın.
- Doctor, kullanımdan kaldırılmış `plugins.entries.codex.config.codexDynamicToolsProfile` değerini kaldırır; Codex app-server, Codex'e özgü çalışma alanı araçlarını her zaman yerel tutar.
- Doctor, varsayılan ajan için izin verilen Skills'in bin dosyaları, env var'ları, yapılandırma veya OS gereksinimleri eksik olduğu için mevcut runtime ortamında kullanılamadığında uyarır. `doctor --fix`, bu kullanılamayan Skills'i `skills.entries.<skill>.enabled=false` ile devre dışı bırakabilir; Skill'i etkin tutmak istediğinizde bunun yerine eksik gereksinimi kurun/yapılandırın.
- Sandbox modu etkin ancak Docker kullanılamıyorsa doctor, düzeltme önerisiyle (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`) yüksek sinyalli bir uyarı bildirir.
- Eski sandbox kayıt dosyaları (`~/.openclaw/sandbox/containers.json` veya `~/.openclaw/sandbox/browsers.json`) varsa doctor bunları bildirir; `openclaw doctor --fix` geçerli girişleri parçalı kayıt dizinlerine geçirir ve geçersiz eski dosyaları karantinaya alır.
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyor ve mevcut komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı bildirir ve düz metin yedek kimlik bilgileri yazmaz.
- Bir düzeltme yolunda kanal SecretRef incelemesi başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı bildirir.
- Durum dizini geçişlerinden sonra doctor, etkin varsayılan Telegram veya Discord hesapları env yedeğine bağlı olduğunda ve `TELEGRAM_BOT_TOKEN` veya `DISCORD_BOT_TOKEN` doctor sürecine kullanılamadığında uyarır.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), mevcut komut yolunda çözümlenebilir bir Telegram belirteci gerektirir. Belirteç incelemesi kullanılamıyorsa doctor bir uyarı bildirir ve o geçiş için otomatik çözümlemeyi atlar.

## macOS: `launchctl` env geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız, bu değer yapılandırma dosyanızın üzerine çıkar ve kalıcı "unauthorized" hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway doctor](/tr/gateway/doctor)
