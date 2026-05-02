---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve rehberli düzeltmeler istiyorsunuz
    - Güncelleme yaptınız ve bir doğrulama kontrolü istiyorsunuz
summary: '`openclaw doctor` için CLI referansı (sağlık denetimleri + rehberli onarımlar)'
title: Doktor
x-i18n:
    generated_at: "2026-05-02T08:50:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e861fa105737088eafa55815faa1a37ccd61e154e8dbe811cf4b988bc1c571e5
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

- `--no-workspace-suggestions`: çalışma alanı belleği/arama önerilerini devre dışı bırakır
- `--yes`: sormadan varsayılanları kabul eder
- `--repair`: sormadan önerilen servis dışı onarımları uygular; gateway servis kurulumları ve yeniden yazmaları hâlâ etkileşimli onay veya açık gateway komutları gerektirir
- `--fix`: `--repair` için takma ad
- `--force`: gerektiğinde özel servis yapılandırmasının üzerine yazma dahil agresif onarımları uygular
- `--non-interactive`: istemler olmadan çalıştırır; yalnızca güvenli geçişler ve servis dışı onarımlar
- `--generate-gateway-token`: bir gateway token'ı oluşturur ve yapılandırır
- `--deep`: ek gateway kurulumları için sistem servislerini tarar

Notlar:

- Etkileşimli istemler (keychain/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlanmamışsa** çalışır. Başsız çalıştırmalar (cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimsiz `doctor` çalıştırmaları, başsız sağlık denetimleri hızlı kalsın diye aceleci Plugin yüklemeyi atlar. Etkileşimli oturumlar, bir denetim katkılarına ihtiyaç duyduğunda Plugin'leri hâlâ tamamen yükler.
- `--fix` (`--repair` için takma ad), `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını düşürerek her kaldırmayı listeler.
- `doctor --fix --non-interactive`, eksik veya eski gateway servis tanımlarını bildirir ancak güncelleme onarım modu dışında bunları kurmaz veya yeniden yazmaz. Eksik bir servis için `openclaw gateway install` çalıştırın veya başlatıcıyı bilinçli olarak değiştirmek istediğinizde `openclaw gateway install --force` kullanın.
- Durum bütünlüğü denetimleri artık oturumlar dizinindeki sahipsiz transkript dosyalarını algılar. Bunları `.deleted.<timestamp>` olarak arşivlemek etkileşimli onay gerektirir; `--fix`, `--yes` ve başsız çalıştırmalar onları yerinde bırakır.
- Doctor ayrıca eski cron iş şekilleri için `~/.openclaw/cron/jobs.json` (veya `cron.store`) dosyasını tarar ve zamanlayıcının çalışma zamanında bunları otomatik olarak normalleştirmesi gerekmeden önce yerinde yeniden yazabilir.
- Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` çalıştırdığında uyarır; bu betik artık bakımda değildir ve cron systemd kullanıcı veri yolu ortamından yoksun olduğunda yanlış WhatsApp gateway kesintileri günlüğe yazabilir.
- Doctor, eski OpenClaw sürümleri tarafından oluşturulan eski Plugin bağımlılığı hazırlama durumunu temizler. Ayrıca kayıt defteri bunları çözümleyebildiğinde eksik yapılandırılmış indirilebilir Plugin'leri onarır.
- Doctor, Plugin keşfi sağlıklı olduğunda eksik Plugin kimliklerini `plugins.allow`/`plugins.entries` içinden kaldırarak ve eşleşen sarkan kanal yapılandırmasını, heartbeat hedeflerini ve kanal model geçersiz kılmalarını kaldırarak eski Plugin yapılandırmasını onarır.
- Doctor, etkilenen `plugins.entries.<id>` girdisini devre dışı bırakıp geçersiz `config` yükünü kaldırarak geçersiz Plugin yapılandırmasını karantinaya alır. Gateway başlangıcı zaten yalnızca bu bozuk Plugin'i atlar, böylece diğer Plugin'ler ve kanallar çalışmaya devam edebilir.
- Başka bir denetleyici gateway yaşam döngüsüne sahipse `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor gateway/servis sağlığını bildirmeye ve servis dışı onarımları uygulamaya devam eder, ancak servis kurma/başlatma/yeniden başlatma/bootstrap ve eski servis temizliğini atlar.
- Linux'ta doctor, etkin olmayan ek gateway benzeri systemd birimlerini yok sayar ve onarım sırasında çalışan bir systemd gateway servisi için komut/giriş noktası meta verilerini yeniden yazmaz. Etkin başlatıcıyı bilinçli olarak değiştirmek istediğinizde önce servisi durdurun veya `openclaw gateway install --force` kullanın.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` biçimine taşır.
- Tek fark nesne anahtarı sırası olduğunda tekrarlanan `doctor --fix` çalıştırmaları artık Talk normalleştirmesi bildirmez/uygulamaz.
- Doctor bir bellek arama hazırlık denetimi içerir ve embedding kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Doctor, hiçbir komut sahibi yapılandırılmadığında uyarır. Komut sahibi, yalnızca sahip komutlarını çalıştırmasına ve tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır. DM eşleştirmesi yalnızca birinin bot ile konuşmasına izin verir; ilk sahip bootstrap'i var olmadan önce bir göndereni onayladıysanız `commands.ownerAllowFrom` değerini açıkça ayarlayın.
- Doctor, Codex modu agent'lar yapılandırıldığında ve operatörün Codex home konumunda kişisel Codex CLI varlıkları bulunduğunda uyarır. Yerel Codex app-server başlatmaları yalıtılmış agent başına home'lar kullanır, bu yüzden bilinçli olarak yükseltilmesi gereken varlıkların envanterini çıkarmak için `openclaw migrate codex --dry-run` kullanın.
- Sandbox modu etkinse ancak Docker kullanılamıyorsa doctor, giderimle birlikte yüksek sinyalli bir uyarı bildirir (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`).
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyorsa ve geçerli komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı bildirir ve düz metin yedek kimlik bilgileri yazmaz.
- Kanal SecretRef incelemesi bir düzeltme yolunda başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı bildirir.
- Durum dizini geçişlerinden sonra doctor, etkin varsayılan Telegram veya Discord hesapları env yedeğine bağlı olduğunda ve `TELEGRAM_BOT_TOKEN` veya `DISCORD_BOT_TOKEN` doctor işlemine kullanılamadığında uyarır.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), geçerli komut yolunda çözümlenebilir bir Telegram token'ı gerektirir. Token incelemesi kullanılamıyorsa doctor bir uyarı bildirir ve o geçiş için otomatik çözümlemeyi atlar.

## macOS: `launchctl` env geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız, bu değer yapılandırma dosyanızı geçersiz kılar ve kalıcı “unauthorized” hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway doctor](/tr/gateway/doctor)
