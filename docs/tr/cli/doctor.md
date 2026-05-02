---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve rehberli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve bir sağlamlık kontrolü istiyorsunuz
summary: '`openclaw doctor` için CLI başvurusu (sağlık kontrolleri + yönlendirmeli onarımlar)'
title: Doktor
x-i18n:
    generated_at: "2026-05-02T20:41:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64cefee8f36b38657b72912271e3734411870376d2bd5a374d23a77a080035d
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
- `--repair`: sormadan önerilen hizmet dışı onarımları uygula; Gateway hizmeti kurulumları ve yeniden yazmaları yine de etkileşimli onay veya açık Gateway komutları gerektirir
- `--fix`: `--repair` için takma ad
- `--force`: gerektiğinde özel hizmet yapılandırmasının üzerine yazmak dahil agresif onarımları uygula
- `--non-interactive`: istemler olmadan çalıştır; yalnızca güvenli geçişler ve hizmet dışı onarımlar
- `--generate-gateway-token`: bir Gateway token'ı oluştur ve yapılandır
- `--deep`: ek Gateway kurulumları için sistem hizmetlerini tara

Notlar:

- Etkileşimli istemler (anahtar zinciri/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlı olmadığında** çalışır. Başsız çalıştırmalar (cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimli olmayan `doctor` çalıştırmaları, başsız sağlık denetimlerinin hızlı kalması için hevesli Plugin yüklemeyi atlar. Etkileşimli oturumlar, bir denetim katkılarına ihtiyaç duyduğunda Plugin'leri yine de tamamen yükler.
- `--fix` (`--repair` için takma ad), `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını kaldırarak her kaldırmayı listeler.
- `doctor --fix --non-interactive`, eksik veya eski Gateway hizmet tanımlarını bildirir ancak güncelleme onarım modu dışında bunları kurmaz veya yeniden yazmaz. Eksik bir hizmet için `openclaw gateway install` çalıştırın veya başlatıcıyı bilerek değiştirmek istediğinizde `openclaw gateway install --force` kullanın.
- Durum bütünlüğü denetimleri artık oturumlar dizinindeki sahipsiz transcript dosyalarını algılar. Bunları `.deleted.<timestamp>` olarak arşivlemek etkileşimli onay gerektirir; `--fix`, `--yes` ve başsız çalıştırmalar bunları yerinde bırakır.
- Doctor ayrıca eski cron iş şekilleri için `~/.openclaw/cron/jobs.json` (veya `cron.store`) dosyasını tarar ve zamanlayıcının çalışma zamanında bunları otomatik normalleştirmesi gerekmeden önce yerinde yeniden yazabilir.
- Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` dosyasını çalıştırdığında uyarır; bu script artık bakımı yapılan bir script değildir ve cron systemd kullanıcı veri yolu ortamından yoksun olduğunda yanlış WhatsApp Gateway kesintileri kaydedebilir.
- Doctor, eski OpenClaw sürümlerinin oluşturduğu eski Plugin bağımlılığı hazırlama durumunu temizler. Ayrıca kayıt defteri bunları çözümleyebildiğinde eksik yapılandırılmış indirilebilir Plugin'leri onarır ve 2026.5.2 doctor geçişi, eski bir yapılandırmanın zaten kullandığı indirilebilir Plugin'leri, yapılandırmayı o sürüm için dokunulmuş olarak işaretlemeden önce otomatik olarak kurar.
- Doctor, Plugin keşfi sağlıklı olduğunda eksik Plugin kimliklerini `plugins.allow`/`plugins.entries` içinden, eşleşen sarkık kanal yapılandırması, heartbeat hedefleri ve kanal model geçersiz kılmalarıyla birlikte kaldırarak eski Plugin yapılandırmasını onarır.
- Doctor, etkilenen `plugins.entries.<id>` girdisini devre dışı bırakarak ve geçersiz `config` yükünü kaldırarak geçersiz Plugin yapılandırmasını karantinaya alır. Gateway başlangıcı zaten yalnızca o hatalı Plugin'i atlar; böylece diğer Plugin'ler ve kanallar çalışmaya devam edebilir.
- Gateway yaşam döngüsünü başka bir denetleyici sahipleniyorsa `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor, Gateway/hizmet sağlığını bildirmeye ve hizmet dışı onarımları uygulamaya devam eder ancak hizmet kurma/başlatma/yeniden başlatma/bootstrap ve eski hizmet temizliğini atlar.
- Linux'ta doctor, etkin olmayan ek Gateway benzeri systemd unit'lerini yok sayar ve onarım sırasında çalışan bir systemd Gateway hizmeti için komut/giriş noktası metadata'sını yeniden yazmaz. Etkin başlatıcıyı bilerek değiştirmek istediğinizde önce hizmeti durdurun veya `openclaw gateway install --force` kullanın.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` biçimine geçirir.
- Tek fark nesne anahtarı sırası olduğunda, tekrarlanan `doctor --fix` çalıştırmaları artık Talk normalleştirmesini bildirmez/uygulamaz.
- Doctor bir bellek arama hazırlık denetimi içerir ve embedding kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Doctor, komut sahibi yapılandırılmadığında uyarır. Komut sahibi, yalnızca sahibe açık komutları çalıştırmasına ve tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır. DM eşleştirme yalnızca birinin bot ile konuşmasına izin verir; ilk sahip bootstrap'ı var olmadan önce bir göndericiyi onayladıysanız `commands.ownerAllowFrom` değerini açıkça ayarlayın.
- Doctor, Codex modu agent'lar yapılandırıldığında ve operatörün Codex home'unda kişisel Codex CLI varlıkları bulunduğunda uyarır. Yerel Codex app-server başlatmaları agent başına yalıtılmış home'lar kullanır; bu nedenle kasıtlı olarak yükseltilmesi gereken varlıkların envanterini çıkarmak için `openclaw migrate codex --dry-run` kullanın.
- Doctor, varsayılan agent için izin verilen Skills mevcut çalışma zamanı ortamında bin'ler, env vars, yapılandırma veya işletim sistemi gereksinimleri eksik olduğu için kullanılamadığında uyarır. `doctor --fix`, bu kullanılamayan Skills'i `skills.entries.<skill>.enabled=false` ile devre dışı bırakabilir; beceriyi etkin tutmak istediğinizde bunun yerine eksik gereksinimi kurun/yapılandırın.
- Sandbox modu etkinse ancak Docker kullanılamıyorsa doctor, düzeltme önerisiyle (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`) yüksek sinyalli bir uyarı bildirir.
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyorsa ve mevcut komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı bildirir ve düz metin yedek kimlik bilgileri yazmaz.
- Bir düzeltme yolunda kanal SecretRef incelemesi başarısız olursa doctor devam eder ve erken çıkmak yerine bir uyarı bildirir.
- Durum dizini geçişlerinden sonra doctor, etkinleştirilmiş varsayılan Telegram veya Discord hesapları env fallback'e bağlı olduğunda ve `TELEGRAM_BOT_TOKEN` veya `DISCORD_BOT_TOKEN` doctor süreci için kullanılamadığında uyarır.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), mevcut komut yolunda çözümlenebilir bir Telegram token'ı gerektirir. Token incelemesi kullanılamıyorsa doctor bir uyarı bildirir ve o geçiş için otomatik çözümlemeyi atlar.

## macOS: `launchctl` env geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız, bu değer yapılandırma dosyanızı geçersiz kılar ve kalıcı “unauthorized” hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## İlgili

- [CLI referansı](/tr/cli)
- [Gateway doctor](/tr/gateway/doctor)
