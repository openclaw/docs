---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve rehberli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve sağlamlık kontrolü istiyorsunuz
summary: '`openclaw doctor` için CLI referansı (sağlık kontrolleri + rehberli onarımlar)'
title: Tanılama
x-i18n:
    generated_at: "2026-05-07T13:14:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7683a974eb9406e5ca071612c96c7db05247a69e253ef4293c57e7707aa5fd4
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

Kanala özgü izinler için `doctor` yerine kanal yoklamalarını kullanın:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Hedeflenmiş Discord yetenekleri yoklaması botun etkin kanal izinlerini bildirir; durum yoklaması yapılandırılmış Discord kanallarını ve sesli otomatik katılım hedeflerini denetler.

## Seçenekler

- `--no-workspace-suggestions`: çalışma alanı bellek/arama önerilerini devre dışı bırak
- `--yes`: sormadan varsayılanları kabul et
- `--repair`: sormadan önerilen hizmet dışı onarımları uygula; Gateway hizmeti kurulumları ve yeniden yazımları yine etkileşimli onay veya açık Gateway komutları gerektirir
- `--fix`: `--repair` için takma ad
- `--force`: gerektiğinde özel hizmet yapılandırmasının üzerine yazmak dahil agresif onarımları uygula
- `--non-interactive`: istemler olmadan çalıştır; yalnızca güvenli geçişler ve hizmet dışı onarımlar
- `--generate-gateway-token`: Gateway belirteci oluştur ve yapılandır
- `--deep`: ek Gateway kurulumları için sistem hizmetlerini tara ve son Gateway gözetmen yeniden başlatma devirlerini bildir

Notlar:

- Nix modunda (`OPENCLAW_NIX_MODE=1`), salt okunur doctor kontrolleri çalışmaya devam eder, ancak `openclaw.json` değiştirilemez olduğundan `doctor --fix`, `doctor --repair`, `doctor --yes` ve `doctor --generate-gateway-token` devre dışıdır. Bunun yerine bu kurulumun Nix kaynağını düzenleyin; nix-openclaw için agent-first [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) sayfasını kullanın.
- Etkileşimli istemler (anahtar zinciri/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlanmamışsa** çalışır. Başsız çalıştırmalar (cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimsiz `doctor` çalıştırmaları, başsız sağlık kontrolleri hızlı kalsın diye istekli Plugin yüklemeyi atlar. Etkileşimli oturumlar, bir kontrol katkılarına ihtiyaç duyduğunda Plugin'leri yine tam olarak yükler.
- `--fix` (`--repair` için takma ad), `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını düşürerek her kaldırmayı listeler.
- `doctor --fix --non-interactive`, eksik veya bayat Gateway hizmet tanımlarını bildirir ancak güncelleme onarım modu dışında bunları kurmaz veya yeniden yazmaz. Eksik hizmet için `openclaw gateway install` çalıştırın veya başlatıcıyı bilinçli olarak değiştirmek istediğinizde `openclaw gateway install --force` kullanın.
- Durum bütünlüğü kontrolleri artık oturumlar dizinindeki sahipsiz transkript dosyalarını algılar. Bunları `.deleted.<timestamp>` olarak arşivlemek etkileşimli onay gerektirir; `--fix`, `--yes` ve başsız çalıştırmalar onları yerinde bırakır.
- Doctor ayrıca eski cron işi şekilleri için `~/.openclaw/cron/jobs.json` (veya `cron.store`) dosyasını tarar ve zamanlayıcının çalışma zamanında otomatik normalleştirmesi gerekmeden önce bunları yerinde yeniden yazabilir.
- Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` dosyasını çalıştırdığında uyarır; bu betik artık bakımı yapılmıyor ve cron systemd kullanıcı veri yolu ortamından yoksun olduğunda yanlış WhatsApp Gateway kesintileri günlüğe yazabilir.
- WhatsApp etkinleştirildiğinde doctor, yerel `openclaw-tui` istemcileri hâlâ çalışırken bozulmuş bir Gateway olay döngüsü olup olmadığını kontrol eder. `doctor --fix`, WhatsApp yanıtları bayat TUI yenileme döngülerinin arkasında kuyruğa alınmasın diye yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
- Doctor, birincil modeller, yedekler, heartbeat/subagent/compaction geçersiz kılmaları, hook'lar, kanal model geçersiz kılmaları ve bayat oturum rota sabitlemeleri genelinde eski `openai-codex/*` model referanslarını kanonik `openai/*` referanslarına yeniden yazar. `--fix`, yalnızca Codex Plugin kurulu, etkin, `codex` harness katkısı sağlıyor ve kullanılabilir OAuth'a sahipse `agentRuntime.id: "codex"` seçer; aksi takdirde rota varsayılan OpenClaw çalıştırıcısında kalsın diye `agentRuntime.id: "pi"` seçer.
- Doctor, eski OpenClaw sürümlerinin oluşturduğu eski Plugin bağımlılığı hazırlama durumunu temizler. Ayrıca `plugins.entries`, yapılandırılmış kanallar, yapılandırılmış sağlayıcı/arama ayarları veya yapılandırılmış aracı çalışma zamanları gibi yapılandırma tarafından referans verilen eksik indirilebilir Plugin'leri onarır. Paket güncellemeleri sırasında doctor, paket değişimi tamamlanana kadar paket yöneticisi Plugin onarımını atlar; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa daha sonra `openclaw doctor --fix` komutunu yeniden çalıştırın. İndirme başarısız olursa doctor kurulum hatasını bildirir ve yapılandırılmış Plugin girdisini bir sonraki onarım denemesi için korur.
- Doctor, Plugin keşfi sağlıklı olduğunda `plugins.allow`/`plugins.entries` içinden eksik Plugin kimliklerini ve eşleşen sarkan kanal yapılandırmasını, Heartbeat hedeflerini ve kanal model geçersiz kılmalarını kaldırarak bayat Plugin yapılandırmasını onarır.
- Doctor, etkilenen `plugins.entries.<id>` girdisini devre dışı bırakıp geçersiz `config` yükünü kaldırarak geçersiz Plugin yapılandırmasını karantinaya alır. Gateway başlatması zaten yalnızca o bozuk Plugin'i atlar, böylece diğer Plugin'ler ve kanallar çalışmaya devam edebilir.
- Gateway yaşam döngüsünü başka bir gözetmen sahipleniyorsa `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor yine Gateway/hizmet sağlığını bildirir ve hizmet dışı onarımları uygular, ancak hizmet kurulumunu/başlatmayı/yeniden başlatmayı/bootstrap işlemini ve eski hizmet temizliğini atlar.
- Linux'ta doctor etkin olmayan ek Gateway benzeri systemd birimlerini yok sayar ve onarım sırasında çalışan bir systemd Gateway hizmeti için komut/giriş noktası meta verilerini yeniden yazmaz. Etkin başlatıcıyı bilinçli olarak değiştirmek istediğinizde önce hizmeti durdurun veya `openclaw gateway install --force` kullanın.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` içine geçirir.
- Yalnızca nesne anahtarı sırası farklıysa, tekrarlanan `doctor --fix` çalıştırmaları artık Talk normalleştirmesini bildirmez/uygulamaz.
- Doctor bir bellek araması hazır olma kontrolü içerir ve gömme kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Doctor, hiçbir komut sahibi yapılandırılmadığında uyarır. Komut sahibi, yalnızca sahip komutlarını çalıştırmasına ve tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır. DM eşleştirme yalnızca birinin botla konuşmasını sağlar; ilk sahip bootstrap'i mevcut olmadan önce bir göndericiyi onayladıysanız `commands.ownerAllowFrom` değerini açıkça ayarlayın.
- Doctor, Codex modu aracıları yapılandırıldığında ve operatörün Codex ana dizininde kişisel Codex CLI varlıkları bulunduğunda uyarır. Yerel Codex uygulama sunucusu başlatmaları yalıtılmış aracı başına ana dizinler kullanır, bu nedenle bilinçli olarak yükseltilmesi gereken varlıkları envanterlemek için `openclaw migrate codex --dry-run` kullanın.
- Doctor, varsayılan aracı için izin verilen skills mevcut çalışma zamanı ortamında bin'ler, ortam değişkenleri, yapılandırma veya OS gereksinimleri eksik olduğu için kullanılamadığında uyarır. `doctor --fix`, bu kullanılamayan skills'i `skills.entries.<skill>.enabled=false` ile devre dışı bırakabilir; skill'i etkin tutmak istediğinizde bunun yerine eksik gereksinimi kurun/yapılandırın.
- Sandbox modu etkinse ancak Docker kullanılamıyorsa doctor düzeltme önerisiyle birlikte yüksek sinyalli bir uyarı bildirir (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`).
- Eski sandbox kayıt defteri dosyaları (`~/.openclaw/sandbox/containers.json` veya `~/.openclaw/sandbox/browsers.json`) varsa doctor bunları bildirir; `openclaw doctor --fix` geçerli girdileri parçalanmış kayıt defteri dizinlerine geçirir ve geçersiz eski dosyaları karantinaya alır.
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyor ve mevcut komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı bildirir ve düz metin yedek kimlik bilgileri yazmaz.
- Bir düzeltme yolunda kanal SecretRef incelemesi başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı bildirir.
- Durum dizini geçişlerinden sonra doctor, etkin varsayılan Telegram veya Discord hesapları ortam yedeğine bağlıysa ve `TELEGRAM_BOT_TOKEN` veya `DISCORD_BOT_TOKEN` doctor süreci tarafından kullanılamıyorsa uyarır.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), mevcut komut yolunda çözümlenebilir bir Telegram belirteci gerektirir. Belirteç incelemesi kullanılamıyorsa doctor bir uyarı bildirir ve o geçiş için otomatik çözümlemeyi atlar.

## macOS: `launchctl` ortam geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız, bu değer yapılandırma dosyanızı geçersiz kılar ve kalıcı "unauthorized" hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway doctor](/tr/gateway/doctor)
