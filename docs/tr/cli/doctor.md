---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve yönlendirmeli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve bir sağlama kontrolü istiyorsunuz
summary: '`openclaw doctor` için CLI referansı (sağlık kontrolleri + rehberli onarımlar)'
title: Doktor
x-i18n:
    generated_at: "2026-05-03T21:28:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4baab5b0cd4d046d12ae5bd14ccf05224115856d45e630a57e77a2be15e5db0
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
- `--repair`: önerilen servis dışı onarımları sormadan uygula; gateway servisi kurulumları ve yeniden yazmaları yine etkileşimli onay veya açık gateway komutları gerektirir
- `--fix`: `--repair` için takma ad
- `--force`: gerektiğinde özel servis yapılandırmasının üzerine yazmak dahil, agresif onarımları uygula
- `--non-interactive`: istemler olmadan çalıştır; yalnızca güvenli geçişler ve servis dışı onarımlar
- `--generate-gateway-token`: bir gateway token'ı oluştur ve yapılandır
- `--deep`: ek gateway kurulumları için sistem servislerini tara

Notlar:

- Etkileşimli istemler (keychain/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlı olmadığında** çalışır. Başsız çalıştırmalar (cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimsiz `doctor` çalıştırmaları, başsız sağlık denetimlerinin hızlı kalması için istekli Plugin yüklemeyi atlar. Etkileşimli oturumlar, bir denetim katkılarına ihtiyaç duyduğunda Plugin'leri hâlâ tamamen yükler.
- `--fix` (`--repair` için takma ad), `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını bırakarak her kaldırmayı listeler.
- `doctor --fix --non-interactive`, eksik veya eski gateway servisi tanımlarını raporlar ancak güncelleme onarım modu dışında bunları kurmaz veya yeniden yazmaz. Eksik bir servis için `openclaw gateway install` komutunu ya da başlatıcıyı bilinçli olarak değiştirmek istediğinizde `openclaw gateway install --force` komutunu çalıştırın.
- Durum bütünlüğü denetimleri artık oturumlar dizinindeki sahipsiz transcript dosyalarını algılar. Bunları `.deleted.<timestamp>` olarak arşivlemek etkileşimli onay gerektirir; `--fix`, `--yes` ve başsız çalıştırmalar bunları yerinde bırakır.
- Doctor ayrıca eski cron işi şekilleri için `~/.openclaw/cron/jobs.json` (veya `cron.store`) dosyasını tarar ve zamanlayıcının çalışma zamanında otomatik normalleştirme yapmak zorunda kalmasından önce bunları yerinde yeniden yazabilir.
- Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` komutunu çalıştırıyorsa uyarır; bu betik artık bakımı yapılmıyor ve cron systemd kullanıcı veri yolu ortamından yoksun olduğunda yanlış WhatsApp gateway kesintileri günlüğe kaydedebilir.
- Doctor, eski OpenClaw sürümleri tarafından oluşturulan eski Plugin bağımlılık hazırlama durumunu temizler. Ayrıca kayıt defteri bunları çözebildiğinde eksik yapılandırılmış indirilebilir Plugin'leri onarır ve 2026.5.2 doctor geçişi, yapılandırmayı o sürüm için dokunulmuş olarak işaretlemeden önce eski bir yapılandırmanın zaten kullandığı indirilebilir Plugin'leri otomatik olarak kurar.
- Doctor, Plugin keşfi sağlıklı olduğunda eksik Plugin kimliklerini `plugins.allow`/`plugins.entries` içinden, ayrıca eşleşen sarkan kanal yapılandırmasını, heartbeat hedeflerini ve kanal model geçersiz kılmalarını kaldırarak eski Plugin yapılandırmasını onarır.
- Doctor, etkilenen `plugins.entries.<id>` girdisini devre dışı bırakarak ve geçersiz `config` yükünü kaldırarak geçersiz Plugin yapılandırmasını karantinaya alır. Gateway başlangıcı zaten yalnızca bu bozuk Plugin'i atlar, böylece diğer Plugin'ler ve kanallar çalışmaya devam edebilir.
- Başka bir gözetmen gateway yaşam döngüsüne sahipse `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor yine gateway/servis sağlığını raporlar ve servis dışı onarımları uygular, ancak servis kurma/başlatma/yeniden başlatma/bootstrap ve eski servis temizliğini atlar.
- Linux'ta doctor etkin olmayan ek gateway benzeri systemd birimlerini yok sayar ve onarım sırasında çalışan bir systemd gateway servisi için komut/giriş noktası meta verilerini yeniden yazmaz. Etkin başlatıcıyı bilinçli olarak değiştirmek istediğinizde önce servisi durdurun veya `openclaw gateway install --force` kullanın.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` yapısına geçirir.
- Tek fark nesne anahtarı sırası olduğunda, tekrarlanan `doctor --fix` çalıştırmaları artık Talk normalleştirmesini raporlamaz/uygulamaz.
- Doctor, bir bellek arama hazır olma denetimi içerir ve embedding kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Doctor, hiçbir komut sahibi yapılandırılmadığında uyarır. Komut sahibi, yalnızca sahibin çalıştırabileceği komutları çalıştırmasına ve tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır. DM eşleştirme yalnızca birinin botla konuşmasına izin verir; ilk sahip bootstrap'ı var olmadan önce bir göndericiyi onayladıysanız `commands.ownerAllowFrom` değerini açıkça ayarlayın.
- Doctor, Codex modu ajanlar yapılandırıldığında ve operatörün Codex ana dizininde kişisel Codex CLI varlıkları bulunduğunda uyarır. Yerel Codex uygulama sunucusu başlatmaları, ajan başına yalıtılmış ana dizinler kullanır; bu nedenle bilinçli olarak yükseltilmesi gereken varlıkları envanterlemek için `openclaw migrate codex --dry-run` kullanın.
- Doctor, varsayılan ajan için izin verilen Skills'lerin geçerli çalışma zamanı ortamında bin'ler, env var'lar, yapılandırma veya OS gereksinimleri eksik olduğu için kullanılamadığında uyarır. `doctor --fix`, bu kullanılamayan Skills'leri `skills.entries.<skill>.enabled=false` ile devre dışı bırakabilir; skill'i etkin tutmak istediğinizde bunun yerine eksik gereksinimi kurun/yapılandırın.
- Sandbox modu etkinse ancak Docker kullanılamıyorsa doctor, düzeltme önerisiyle (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`) yüksek sinyalli bir uyarı bildirir.
- Eski sandbox kayıt defteri dosyaları (`~/.openclaw/sandbox/containers.json` veya `~/.openclaw/sandbox/browsers.json`) mevcutsa doctor bunları raporlar; `openclaw doctor --fix`, geçerli girdileri parçalanmış kayıt defteri dizinlerine geçirir ve geçersiz eski dosyaları karantinaya alır.
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyorsa ve geçerli komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı raporlar ve düz metin yedek kimlik bilgileri yazmaz.
- Bir düzeltme yolunda kanal SecretRef denetimi başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı raporlar.
- Durum dizini geçişlerinden sonra doctor, etkin varsayılan Telegram veya Discord hesapları env yedeğine bağlıysa ve `TELEGRAM_BOT_TOKEN` veya `DISCORD_BOT_TOKEN` doctor işlemine açık değilse uyarır.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), geçerli komut yolunda çözümlenebilir bir Telegram token'ı gerektirir. Token denetimi kullanılamıyorsa doctor bir uyarı raporlar ve o geçiş için otomatik çözümlemeyi atlar.

## macOS: `launchctl` env geçersiz kılmaları

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
