---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve rehberli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve hızlı bir doğrulama istiyorsunuz
summary: '`openclaw doctor` için CLI referansı (sağlık kontrolleri + rehberli onarımlar)'
title: Doktor
x-i18n:
    generated_at: "2026-05-06T09:05:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20eff2f94b41315dbe1d393ebbbf6dce352a7f9e589db3b8fb51f423dd6fed28
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
- `--repair`: sormadan önerilen servis dışı onarımları uygula; Gateway servisi kurulumları ve yeniden yazmaları yine de etkileşimli onay veya açık Gateway komutları gerektirir
- `--fix`: `--repair` için diğer ad
- `--force`: gerektiğinde özel servis yapılandırmasının üzerine yazma dahil agresif onarımlar uygula
- `--non-interactive`: istemler olmadan çalıştır; yalnızca güvenli geçişler ve servis dışı onarımlar
- `--generate-gateway-token`: bir Gateway belirteci oluştur ve yapılandır
- `--deep`: sistemi ek Gateway kurulumları için tara ve son Gateway gözetmen yeniden başlatma devirlerini raporla

Notlar:

- Etkileşimli istemler (anahtar zinciri/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlanmadığında** çalışır. Başsız çalıştırmalar (Cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimsiz `doctor` çalıştırmaları, başsız sağlık denetimleri hızlı kalsın diye istekli Plugin yüklemeyi atlar. Etkileşimli oturumlar, bir denetim katkılarına ihtiyaç duyduğunda Plugin’leri yine de tamamen yükler.
- `--fix` (`--repair` için diğer ad), `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını kaldırarak her kaldırmayı listeler.
- `doctor --fix --non-interactive` eksik veya eski Gateway servis tanımlarını raporlar, ancak güncelleme onarım modu dışında bunları kurmaz veya yeniden yazmaz. Eksik bir servis için `openclaw gateway install` komutunu, başlatıcıyı bilerek değiştirmek istediğinizde ise `openclaw gateway install --force` komutunu çalıştırın.
- Durum bütünlüğü denetimleri artık oturumlar dizinindeki sahipsiz transcript dosyalarını algılar. Bunları `.deleted.<timestamp>` olarak arşivlemek etkileşimli onay gerektirir; `--fix`, `--yes` ve başsız çalıştırmalar bunları yerinde bırakır.
- Doctor ayrıca eski Cron işi biçimleri için `~/.openclaw/cron/jobs.json` (veya `cron.store`) dosyasını tarar ve zamanlayıcının çalışma zamanında otomatik normalleştirmesi gerekmeden önce bunları yerinde yeniden yazabilir.
- Linux’ta doctor, kullanıcının crontab’ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` dosyasını çalıştırdığında uyarır; bu betik artık bakımı yapılmıyor ve Cron systemd kullanıcı veriyolu ortamından yoksun olduğunda yanlış WhatsApp Gateway kesinti günlükleri yazabilir.
- WhatsApp etkinleştirildiğinde doctor, yerel `openclaw-tui` istemcileri hâlâ çalışırken bozulmuş bir Gateway olay döngüsünü denetler. `doctor --fix`, WhatsApp yanıtlarının eski TUI yenileme döngülerinin arkasında kuyruğa alınmaması için yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
- Doctor, birincil modeller, yedekler, heartbeat/subagent/compaction geçersiz kılmaları, hook’lar, kanal modeli geçersiz kılmaları ve eski oturum rota sabitlemeleri genelinde eski `openai-codex/*` model referanslarını standart `openai/*` referanslarına yeniden yazar. `--fix`, yalnızca Codex Plugin’i kurulu, etkin, `codex` harness’ına katkıda bulunuyor ve kullanılabilir OAuth’a sahipse `agentRuntime.id: "codex"` seçer; aksi takdirde rota varsayılan OpenClaw çalıştırıcısında kalsın diye `agentRuntime.id: "pi"` seçer.
- Doctor, eski OpenClaw sürümlerinin oluşturduğu eski Plugin bağımlılığı hazırlama durumunu temizler. Ayrıca `plugins.entries`, yapılandırılmış kanallar, yapılandırılmış sağlayıcı/arama ayarları veya yapılandırılmış ajan çalışma zamanları gibi yapılandırma tarafından referans verilen eksik indirilebilir Plugin’leri onarır. Paket güncellemeleri sırasında doctor, paket değişimi tamamlanana kadar paket yöneticisi Plugin onarımını atlar; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa sonrasında `openclaw doctor --fix` komutunu yeniden çalıştırın. İndirme başarısız olursa doctor kurulum hatasını raporlar ve yapılandırılmış Plugin girdisini bir sonraki onarım denemesi için korur.
- Doctor, Plugin keşfi sağlıklıyken eksik Plugin kimliklerini `plugins.allow`/`plugins.entries` içinden, ayrıca eşleşen sarkan kanal yapılandırmasını, Heartbeat hedeflerini ve kanal modeli geçersiz kılmalarını kaldırarak eski Plugin yapılandırmasını onarır.
- Doctor, etkilenen `plugins.entries.<id>` girdisini devre dışı bırakarak ve geçersiz `config` yükünü kaldırarak geçersiz Plugin yapılandırmasını karantinaya alır. Gateway başlatması zaten yalnızca o hatalı Plugin’i atlar; böylece diğer Plugin’ler ve kanallar çalışmaya devam edebilir.
- Gateway yaşam döngüsünün sahibi başka bir gözetmen olduğunda `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor yine Gateway/servis sağlığını raporlar ve servis dışı onarımları uygular, ancak servis kurulumunu/başlatmayı/yeniden başlatmayı/bootstrap’u ve eski servis temizliğini atlar.
- Linux’ta doctor etkin olmayan ek Gateway benzeri systemd birimlerini yok sayar ve onarım sırasında çalışan bir systemd Gateway servisi için komut/giriş noktası meta verilerini yeniden yazmaz. Aktif başlatıcıyı bilerek değiştirmek istediğinizde önce servisi durdurun veya `openclaw gateway install --force` kullanın.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) `talk.provider` + `talk.providers.<provider>` biçimine otomatik geçirir.
- Tek fark nesne anahtar sırası olduğunda tekrarlanan `doctor --fix` çalıştırmaları artık Talk normalleştirmesini raporlamaz/uygulamaz.
- Doctor bir bellek arama hazırlık denetimi içerir ve gömme kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Doctor, hiçbir komut sahibi yapılandırılmadığında uyarır. Komut sahibi, yalnızca sahip komutlarını çalıştırmasına ve tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır. DM eşleştirmesi yalnızca birinin botla konuşmasına izin verir; ilk sahip bootstrap’i var olmadan önce bir göndericiyi onayladıysanız `commands.ownerAllowFrom` değerini açıkça ayarlayın.
- Doctor, Codex modu ajanlar yapılandırıldığında ve operatörün Codex ana dizininde kişisel Codex CLI varlıkları bulunduğunda uyarır. Yerel Codex uygulama sunucusu başlatmaları, ajan başına yalıtılmış ana dizinler kullanır; bu nedenle bilinçli şekilde yükseltilmesi gereken varlıkların envanteri için `openclaw migrate codex --dry-run` kullanın.
- Doctor, varsayılan ajan için izin verilen Skills’in, bin’ler, ortam değişkenleri, yapılandırma veya OS gereksinimleri eksik olduğu için geçerli çalışma zamanı ortamında kullanılamadığında uyarır. `doctor --fix`, bu kullanılamayan Skills’i `skills.entries.<skill>.enabled=false` ile devre dışı bırakabilir; beceriyi etkin tutmak istediğinizde bunun yerine eksik gereksinimi kurun/yapılandırın.
- Sandbox modu etkinse ancak Docker kullanılamıyorsa doctor, düzeltme adımlarıyla (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`) yüksek sinyalli bir uyarı raporlar.
- Eski sandbox kayıt dosyaları (`~/.openclaw/sandbox/containers.json` veya `~/.openclaw/sandbox/browsers.json`) mevcutsa doctor bunları raporlar; `openclaw doctor --fix` geçerli girdileri parçalı kayıt dizinlerine geçirir ve geçersiz eski dosyaları karantinaya alır.
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyorsa ve geçerli komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı raporlar ve düz metin yedek kimlik bilgileri yazmaz.
- Bir düzeltme yolunda kanal SecretRef incelemesi başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı raporlar.
- Durum dizini geçişlerinden sonra doctor, etkinleştirilmiş varsayılan Telegram veya Discord hesapları ortam yedeğine bağlıysa ve `TELEGRAM_BOT_TOKEN` veya `DISCORD_BOT_TOKEN` doctor süreci tarafından kullanılamıyorsa uyarır.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), geçerli komut yolunda çözümlenebilir bir Telegram belirteci gerektirir. Belirteç incelemesi kullanılamıyorsa doctor bir uyarı raporlar ve o geçiş için otomatik çözümlemeyi atlar.

## macOS: `launchctl` ortam geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız, bu değer yapılandırma dosyanızın üzerine çıkar ve kalıcı “yetkisiz” hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway doctor](/tr/gateway/doctor)
