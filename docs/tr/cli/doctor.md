---
read_when:
    - Bağlantı/kimlik doğrulama sorunları yaşıyorsunuz ve rehberli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve hızlı bir doğrulama istiyorsunuz
summary: '`openclaw doctor` için CLI başvurusu (sağlık denetimleri + rehberli onarımlar)'
title: Tanılama
x-i18n:
    generated_at: "2026-05-12T08:45:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90050276597a50abcc3638e7b7b50f29ef0682f5da30d33d5dca3ad6117173e0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway ve kanallar için durum kontrolleri + hızlı düzeltmeler.

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

Hedeflenmiş Discord yetenekleri yoklaması, botun etkili kanal izinlerini bildirir; durum yoklaması yapılandırılmış Discord kanallarını ve sesli otomatik katılma hedeflerini denetler.

## Seçenekler

- `--no-workspace-suggestions`: çalışma alanı bellek/arama önerilerini devre dışı bırak
- `--yes`: sormadan varsayılanları kabul et
- `--repair`: önerilen hizmet dışı onarımları sormadan uygula; Gateway hizmet kurulumları ve yeniden yazımları yine de etkileşimli onay veya açık Gateway komutları gerektirir
- `--fix`: `--repair` için takma ad
- `--force`: gerektiğinde özel hizmet yapılandırmasının üzerine yazmak dahil agresif onarımları uygula
- `--non-interactive`: istemler olmadan çalıştır; yalnızca güvenli geçişler ve hizmet dışı onarımlar
- `--generate-gateway-token`: bir Gateway belirteci üret ve yapılandır
- `--deep`: ek Gateway kurulumları için sistem hizmetlerini tara ve son Gateway supervisor yeniden başlatma devirlerini bildir

Notlar:

- Nix modunda (`OPENCLAW_NIX_MODE=1`), salt okunur doctor kontrolleri yine çalışır, ancak `openclaw.json` değişmez olduğu için `doctor --fix`, `doctor --repair`, `doctor --yes` ve `doctor --generate-gateway-token` devre dışıdır. Bunun yerine bu kurulum için Nix kaynağını düzenleyin; nix-openclaw için agent-öncelikli [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kullanın.
- Etkileşimli istemler (keychain/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlanmamışsa** çalışır. Headless çalıştırmalar (cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimsiz `doctor` çalıştırmaları, headless durum kontrollerinin hızlı kalması için istekli Plugin yüklemeyi atlar. Etkileşimli oturumlar, bir kontrol katkılarına ihtiyaç duyduğunda Pluginleri yine tam olarak yükler.
- `--fix` (`--repair` için takma ad), `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını kaldırarak her kaldırmayı listeler.
- `doctor --fix --non-interactive`, eksik veya eski Gateway hizmet tanımlarını bildirir ancak güncelleme onarım modu dışında bunları kurmaz veya yeniden yazmaz. Eksik bir hizmet için `openclaw gateway install` çalıştırın veya başlatıcıyı bilerek değiştirmek istediğinizde `openclaw gateway install --force` kullanın.
- Durum bütünlüğü kontrolleri artık oturumlar dizinindeki sahipsiz transcript dosyalarını algılar. Bunları `.deleted.<timestamp>` olarak arşivlemek etkileşimli onay gerektirir; `--fix`, `--yes` ve headless çalıştırmalar onları yerinde bırakır.
- Doctor ayrıca eski cron job biçimleri için `~/.openclaw/cron/jobs.json` (veya `cron.store`) dosyasını tarar ve zamanlayıcı bunları çalışma zamanında otomatik normalleştirmek zorunda kalmadan önce yerinde yeniden yazabilir.
- Linux üzerinde doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` komutunu çalıştırdığında uyarır; bu script artık bakımı yapılan bir script değildir ve cron systemd user-bus ortamına sahip olmadığında yanlış WhatsApp Gateway kesinti kayıtları yazabilir.
- WhatsApp etkinleştirildiğinde doctor, yerel `openclaw-tui` istemcileri hâlâ çalışırken bozulmuş bir Gateway olay döngüsü olup olmadığını kontrol eder. `doctor --fix`, WhatsApp yanıtlarının eski TUI yenileme döngülerinin arkasında kuyruğa alınmaması için yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
- Doctor, eski `openai-codex/*` model referanslarını birincil modeller, fallback'ler, heartbeat/subagent/compaction geçersiz kılmaları, hook'lar, kanal model geçersiz kılmaları ve eski oturum rota sabitlemeleri genelinde kanonik `openai/*` referanslarına yeniden yazar. `--fix`, Codex niyetini sağlayıcı/model kapsamlı `agentRuntime.id: "codex"` girdilerine taşır, `openai-codex:...` gibi oturum auth-profile sabitlemelerini korur, eski tüm-agent/oturum runtime sabitlemelerini kaldırır ve onarılmış OpenAI agent referanslarını doğrudan OpenAI API-key auth yerine Codex auth yönlendirmesinde tutar.
- Doctor, eski OpenClaw sürümleri tarafından oluşturulan eski Plugin bağımlılığı hazırlama durumunu temizler ve peer bağımlılığı olarak bildiren yönetilen npm Pluginleri için ana makine `openclaw` paketini yeniden bağlar. Ayrıca `plugins.entries`, yapılandırılmış kanallar, yapılandırılmış sağlayıcı/arama ayarları veya yapılandırılmış agent runtime'ları gibi yapılandırma tarafından referans verilen eksik indirilebilir Pluginleri onarır. Paket güncellemeleri sırasında doctor, paket değişimi tamamlanana kadar paket yöneticisi Plugin onarımını atlar; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa sonrasında `openclaw doctor --fix` komutunu yeniden çalıştırın. İndirme başarısız olursa doctor kurulum hatasını bildirir ve bir sonraki onarım denemesi için yapılandırılmış Plugin girdisini korur.
- Doctor, Plugin keşfi sağlıklıyken eksik Plugin kimliklerini `plugins.allow`/`plugins.deny`/`plugins.entries` üzerinden kaldırarak, ayrıca eşleşen kopuk kanal yapılandırmasını, Heartbeat hedeflerini ve kanal model geçersiz kılmalarını kaldırarak eski Plugin yapılandırmasını onarır.
- Doctor, etkilenen `plugins.entries.<id>` girdisini devre dışı bırakarak ve geçersiz `config` payload'unu kaldırarak geçersiz Plugin yapılandırmasını karantinaya alır. Gateway başlatma zaten yalnızca bu bozuk Plugini atlar, böylece diğer Pluginler ve kanallar çalışmaya devam edebilir.
- Gateway yaşam döngüsünün sahibi başka bir supervisor olduğunda `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor Gateway/hizmet durumunu yine bildirir ve hizmet dışı onarımları uygular, ancak hizmet kurulumunu/başlatmasını/yeniden başlatmasını/bootstrap işlemini ve eski hizmet temizliğini atlar.
- Linux üzerinde doctor, etkin olmayan ek Gateway-benzeri systemd birimlerini yok sayar ve onarım sırasında çalışan bir systemd Gateway hizmeti için komut/entrypoint meta verilerini yeniden yazmaz. Etkin başlatıcıyı bilerek değiştirmek istediğinizde önce hizmeti durdurun veya `openclaw gateway install --force` kullanın.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` yapısına geçirir.
- Tek fark nesne anahtarı sırası olduğunda tekrarlanan `doctor --fix` çalıştırmaları artık Talk normalleştirmesini bildirmez/uygulamaz.
- Doctor bir bellek arama hazırlık kontrolü içerir ve embedding kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Doctor, hiçbir komut sahibi yapılandırılmadığında uyarır. Komut sahibi, yalnızca sahibe açık komutları çalıştırmasına ve tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır. DM eşleştirme yalnızca birinin botla konuşmasına izin verir; ilk-owner bootstrap var olmadan önce bir göndericiyi onayladıysanız `commands.ownerAllowFrom` değerini açıkça ayarlayın.
- Doctor, Codex modu agent'lar yapılandırıldığında ve operatörün Codex home içinde kişisel Codex CLI varlıkları bulunduğunda uyarır. Yerel Codex app-server başlatmaları izole agent başına home'lar kullanır, bu nedenle bilinçli olarak yükseltilmesi gereken varlıkları envanterlemek için `openclaw migrate codex --dry-run` kullanın.
- Doctor, kullanımdan kaldırılmış `plugins.entries.codex.config.codexDynamicToolsProfile` öğesini kaldırır; Codex app-server, Codex'e özgü çalışma alanı araçlarını her zaman native tutar.
- Doctor, varsayılan agent için izin verilen skills öğeleri mevcut runtime ortamında bin'ler, env vars, config veya OS gereksinimleri eksik olduğu için kullanılamaz olduğunda uyarır. `doctor --fix`, bu kullanılamayan skills öğelerini `skills.entries.<skill>.enabled=false` ile devre dışı bırakabilir; skill'i etkin tutmak istediğinizde bunun yerine eksik gereksinimi kurun/yapılandırın.
- Sandbox modu etkinse ancak Docker kullanılamıyorsa doctor, çözümle birlikte (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`) yüksek sinyalli bir uyarı bildirir.
- Eski sandbox kayıt dosyaları (`~/.openclaw/sandbox/containers.json` veya `~/.openclaw/sandbox/browsers.json`) mevcutsa doctor bunları bildirir; `openclaw doctor --fix`, geçerli girdileri parçalanmış kayıt dizinlerine geçirir ve geçersiz eski dosyaları karantinaya alır.
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyorsa ve mevcut komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı bildirir ve düz metin fallback kimlik bilgileri yazmaz.
- Kanal SecretRef incelemesi bir düzeltme yolunda başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı bildirir.
- Durum dizini geçişlerinden sonra doctor, etkin varsayılan Telegram veya Discord hesapları env fallback'e bağlı olduğunda ve `TELEGRAM_BOT_TOKEN` veya `DISCORD_BOT_TOKEN` doctor işleminde kullanılamadığında uyarır.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), mevcut komut yolunda çözümlenebilir bir Telegram belirteci gerektirir. Belirteç incelemesi kullanılamıyorsa doctor bir uyarı bildirir ve bu geçiş için otomatik çözümlemeyi atlar.

## macOS: `launchctl` env geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız, bu değer yapılandırma dosyanızı geçersiz kılar ve kalıcı "unauthorized" hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## İlgili

- [CLI referansı](/tr/cli)
- [Gateway doctor](/tr/gateway/doctor)
