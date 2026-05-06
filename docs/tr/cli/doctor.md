---
read_when:
    - Bağlantı/kimlik doğrulama sorunları yaşıyor ve rehberli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve genel bir kontrol istiyorsunuz
summary: '`openclaw doctor` için CLI referansı (sağlık kontrolleri + rehberli onarımlar)'
title: Doktor
x-i18n:
    generated_at: "2026-05-06T17:53:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: eed73ecbec848ae3071448f2444735e2564680fee94cf1e22a73d1e7beaede80
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
- `--repair`: sormadan önerilen hizmet dışı onarımları uygula; Gateway hizmeti kurulumları ve yeniden yazmaları hâlâ etkileşimli onay veya açık Gateway komutları gerektirir
- `--fix`: `--repair` için takma ad
- `--force`: gerektiğinde özel hizmet yapılandırmasının üzerine yazmak da dahil olmak üzere agresif onarımlar uygula
- `--non-interactive`: istemler olmadan çalıştır; yalnızca güvenli migrasyonlar ve hizmet dışı onarımlar
- `--generate-gateway-token`: bir Gateway belirteci oluştur ve yapılandır
- `--deep`: ek Gateway kurulumları için sistem hizmetlerini tara ve son Gateway supervisor yeniden başlatma devirlerini bildir

Notlar:

- Nix modunda (`OPENCLAW_NIX_MODE=1`), salt okunur doctor kontrolleri çalışmaya devam eder, ancak `openclaw.json` değişmez olduğu için `doctor --fix`, `doctor --repair`, `doctor --yes` ve `doctor --generate-gateway-token` devre dışıdır. Bunun yerine bu kurulum için Nix kaynağını düzenleyin; nix-openclaw için agent-first [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kılavuzunu kullanın.
- Etkileşimli istemler (keychain/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlı olmadığında** çalışır. Başsız çalıştırmalar (cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimsiz `doctor` çalıştırmaları, başsız sağlık kontrollerinin hızlı kalması için hevesli Plugin yüklemeyi atlar. Etkileşimli oturumlar, bir kontrol katkılarına ihtiyaç duyduğunda Pluginleri yine de tamamen yükler.
- `--fix` (`--repair` için takma ad), `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını kaldırıp her kaldırmayı listeler.
- `doctor --fix --non-interactive` eksik veya eski Gateway hizmeti tanımlarını bildirir, ancak güncelleme onarım modu dışında bunları kurmaz veya yeniden yazmaz. Eksik bir hizmet için `openclaw gateway install` komutunu çalıştırın veya başlatıcıyı bilerek değiştirmek istediğinizde `openclaw gateway install --force` kullanın.
- Durum bütünlüğü kontrolleri artık oturumlar dizinindeki sahipsiz transcript dosyalarını algılar. Bunları `.deleted.<timestamp>` olarak arşivlemek etkileşimli onay gerektirir; `--fix`, `--yes` ve başsız çalıştırmalar bunları yerinde bırakır.
- Doctor ayrıca eski cron işi şekilleri için `~/.openclaw/cron/jobs.json` (veya `cron.store`) dosyasını tarar ve zamanlayıcının çalışma zamanında otomatik normalize etmesi gerekmeden önce bunları yerinde yeniden yazabilir.
- Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` komutunu çalıştırdığında uyarır; bu betik artık bakımı yapılan bir betik değildir ve cron systemd kullanıcı veri yolu ortamından yoksun olduğunda yanlış WhatsApp Gateway kesintileri kaydedebilir.
- WhatsApp etkinleştirildiğinde doctor, yerel `openclaw-tui` istemcileri hâlâ çalışırken bozulmuş bir Gateway olay döngüsü olup olmadığını kontrol eder. `doctor --fix`, WhatsApp yanıtlarının eski TUI yenileme döngülerinin arkasında sıraya alınmaması için yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
- Doctor eski `openai-codex/*` model başvurularını birincil modeller, yedekler, heartbeat/subagent/compaction geçersiz kılmaları, kancalar, kanal model geçersiz kılmaları ve eski oturum rota sabitlemeleri genelinde kanonik `openai/*` başvurularına yeniden yazar. `--fix`, yalnızca Codex Plugin kuruluysa, etkinse, `codex` harness katkısı sağlıyorsa ve kullanılabilir OAuth'a sahipse `agentRuntime.id: "codex"` seçer; aksi takdirde rota varsayılan OpenClaw runner üzerinde kalsın diye `agentRuntime.id: "pi"` seçer.
- Doctor, eski OpenClaw sürümlerinin oluşturduğu eski Plugin bağımlılığı hazırlama durumunu temizler. Ayrıca `plugins.entries`, yapılandırılmış kanallar, yapılandırılmış provider/arama ayarları veya yapılandırılmış agent runtime'ları gibi yapılandırma tarafından başvurulan eksik indirilebilir Pluginleri onarır. Paket güncellemeleri sırasında doctor, paket değişimi tamamlanana kadar paket yöneticisi Plugin onarımını atlar; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa sonrasında `openclaw doctor --fix` komutunu yeniden çalıştırın. İndirme başarısız olursa doctor kurulum hatasını bildirir ve bir sonraki onarım denemesi için yapılandırılmış Plugin girdisini korur.
- Doctor, Plugin keşfi sağlıklı olduğunda eksik Plugin kimliklerini `plugins.allow`/`plugins.entries` içinden ve eşleşen sarkan kanal yapılandırmasını, heartbeat hedeflerini ve kanal model geçersiz kılmalarını kaldırarak eski Plugin yapılandırmasını onarır.
- Doctor, etkilenen `plugins.entries.<id>` girdisini devre dışı bırakıp geçersiz `config` yükünü kaldırarak geçersiz Plugin yapılandırmasını karantinaya alır. Gateway başlangıcı zaten yalnızca o hatalı Plugini atlar; böylece diğer Pluginler ve kanallar çalışmaya devam edebilir.
- Gateway yaşam döngüsünü başka bir supervisor yönettiğinde `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor yine de Gateway/hizmet sağlığını bildirir ve hizmet dışı onarımları uygular, ancak hizmet kurulumunu/başlatmasını/yeniden başlatmasını/bootstrap işlemini ve eski hizmet temizliğini atlar.
- Linux'ta doctor, etkin olmayan ek Gateway benzeri systemd birimlerini yok sayar ve onarım sırasında çalışan bir systemd Gateway hizmeti için komut/entrypoint meta verilerini yeniden yazmaz. Etkin başlatıcıyı bilerek değiştirmek istediğinizde önce hizmeti durdurun veya `openclaw gateway install --force` kullanın.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` içine migrate eder.
- Tek fark nesne anahtarı sırası olduğunda tekrarlanan `doctor --fix` çalıştırmaları artık Talk normalizasyonunu bildirmez/uygulamaz.
- Doctor bir bellek arama hazırlığı kontrolü içerir ve embedding kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Doctor hiçbir komut sahibi yapılandırılmadığında uyarır. Komut sahibi, yalnızca sahip komutlarını çalıştırmasına ve tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır. DM eşleştirme yalnızca birinin bot ile konuşmasına izin verir; ilk sahip bootstrap'i var olmadan önce bir göndericiyi onayladıysanız `commands.ownerAllowFrom` değerini açıkça ayarlayın.
- Doctor, Codex modu agent'lar yapılandırıldığında ve operatörün Codex home dizininde kişisel Codex CLI varlıkları bulunduğunda uyarır. Yerel Codex app-server başlatmaları izole agent başına home dizinleri kullanır; bu yüzden bilinçli olarak yükseltilmesi gereken varlıkları envanterlemek için `openclaw migrate codex --dry-run` kullanın.
- Doctor, varsayılan agent için izin verilen skills mevcut çalışma zamanı ortamında kullanılamadığında uyarır; bunun nedeni bin dosyalarının, env var'ların, yapılandırmanın veya OS gereksinimlerinin eksik olması olabilir. `doctor --fix`, bu kullanılamayan skills'i `skills.entries.<skill>.enabled=false` ile devre dışı bırakabilir; skill'i etkin tutmak istediğinizde bunun yerine eksik gereksinimi kurun/yapılandırın.
- Sandbox modu etkinse ancak Docker kullanılamıyorsa doctor, düzeltme önerisiyle birlikte yüksek sinyalli bir uyarı bildirir (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`).
- Eski sandbox registry dosyaları (`~/.openclaw/sandbox/containers.json` veya `~/.openclaw/sandbox/browsers.json`) mevcutsa doctor bunları bildirir; `openclaw doctor --fix` geçerli girdileri parçalanmış registry dizinlerine migrate eder ve geçersiz eski dosyaları karantinaya alır.
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyorsa ve mevcut komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı bildirir ve düz metin yedek kimlik bilgileri yazmaz.
- Bir düzeltme yolunda kanal SecretRef incelemesi başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı bildirir.
- Durum dizini migrasyonlarından sonra doctor, etkin varsayılan Telegram veya Discord hesapları env fallback'e bağlı olduğunda ve `TELEGRAM_BOT_TOKEN` veya `DISCORD_BOT_TOKEN` doctor süreci tarafından kullanılamadığında uyarır.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), mevcut komut yolunda çözümlenebilir bir Telegram belirteci gerektirir. Belirteç incelemesi kullanılamıyorsa doctor bir uyarı bildirir ve o geçiş için otomatik çözümlemeyi atlar.

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
