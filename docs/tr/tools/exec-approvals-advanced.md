---
read_when:
    - Güvenli bölmeleri veya özel güvenli bölme profillerini yapılandırma
    - Onayları Slack/Discord/Telegram veya diğer sohbet kanallarına yönlendirme
    - Bir kanal için yerel onay istemcisi uygulama
summary: 'Gelişmiş exec onayları: güvenli ikili dosyalar, yorumlayıcı bağlama, onay iletme, yerel teslim'
title: Yürütme onayları — gelişmiş
x-i18n:
    generated_at: "2026-04-30T09:48:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8a72ca1d23e55dc198ae3c5ad55a57660c2111feebfb89f08d8fa9584e4337
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Gelişmiş exec onayı konuları: `safeBins` hızlı yolu, yorumlayıcı/çalışma zamanı bağlama ve sohbet kanallarına onay iletme (yerel teslim dahil). Temel politika ve onay akışı için bkz. [Exec onayları](/tr/tools/exec-approvals).

## Güvenli ikililer (yalnızca stdin)

`tools.exec.safeBins`, açık izin listesi girdileri **olmadan** izin listesi modunda çalışabilen küçük bir **yalnızca stdin** ikili dosya listesi (örneğin `cut`) tanımlar. Güvenli ikililer konumsal dosya bağımsız değişkenlerini ve yol benzeri belirteçleri reddeder, bu nedenle yalnızca gelen akış üzerinde çalışabilirler. Bunu genel bir güven listesi değil, akış filtreleri için dar bir hızlı yol olarak değerlendirin.

<Warning>
Yorumlayıcı veya çalışma zamanı ikililerini (örneğin `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) `safeBins` içine eklemeyin. Bir komut tasarımı gereği kod değerlendirebiliyor, alt komutlar çalıştırabiliyor veya dosyaları okuyabiliyorsa, açık izin listesi girdilerini tercih edin ve onay istemlerini etkin tutun. Özel güvenli ikililer `tools.exec.safeBinProfiles.<bin>` içinde açık bir profil tanımlamalıdır.
</Warning>

Varsayılan güvenli ikililer:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` ve `sort` varsayılan listede değildir. Bunları etkinleştirirseniz, stdin dışı iş akışları için açık izin listesi girdilerini koruyun. Güvenli ikili modunda `grep` için deseni `-e`/`--regexp` ile sağlayın; konumsal desen biçimi reddedilir, böylece dosya işlenenleri belirsiz konumsallar olarak gizlenemez.

### Argv doğrulaması ve reddedilen bayraklar

Doğrulama yalnızca argv şekline göre deterministiktir (ana makine dosya sistemi varlığı denetimleri yoktur); bu, izin ver/reddet farklarından dosya varlığı oracle davranışını önler. Varsayılan güvenli ikililer için dosya odaklı seçenekler reddedilir; uzun seçenekler kapalı başarısız olacak şekilde doğrulanır (bilinmeyen bayraklar ve belirsiz kısaltmalar reddedilir).

Güvenli ikili profiline göre reddedilen bayraklar:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Güvenli ikililer ayrıca stdin'e özel segmentler için argv belirteçlerinin yürütme zamanında **düz metin** olarak ele alınmasını zorunlu kılar (globlama yok ve `$VARS` genişletmesi yok), böylece `*` veya `$HOME/...` gibi desenler dosya okumalarını gizlemek için kullanılamaz.

### Güvenilir ikili dizinleri

Güvenli ikililer güvenilir ikili dizinlerinden çözümlenmelidir (sistem varsayılanları ve isteğe bağlı `tools.exec.safeBinTrustedDirs`). `PATH` girdileri asla otomatik olarak güvenilir sayılmaz. Varsayılan güvenilir dizinler kasıtlı olarak asgaridir: `/bin`, `/usr/bin`. Güvenli ikili yürütülebilir dosyanız paket yöneticisi/kullanıcı yollarında bulunuyorsa (örneğin `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), bunları açıkça `tools.exec.safeBinTrustedDirs` içine ekleyin.

### Kabuk zincirleme, sarmalayıcılar ve çoklayıcılar

Her üst düzey segment izin listesini karşıladığında (güvenli ikililer veya Skills otomatik izin dahil) kabuk zincirlemeye (`&&`, `||`, `;`) izin verilir. Yönlendirmeler izin listesi modunda desteklenmez. Komut ikamesi (`$()` / ters tırnaklar), çift tırnakların içinde bile izin listesi ayrıştırması sırasında reddedilir; düz `$()` metnine ihtiyacınız varsa tek tırnak kullanın.

macOS eşlikçi uygulama onaylarında, kabuk denetimi veya genişletme sözdizimi (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) içeren ham kabuk metni, kabuk ikilisinin kendisi izin listesine alınmadıkça izin listesi eşleşmemesi olarak değerlendirilir.

Kabuk sarmalayıcıları (`bash|sh|zsh ... -c/-lc`) için istek kapsamlı env geçersiz kılmaları küçük bir açık izin listesine indirgenir (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

İzin listesi modundaki `allow-always` kararlarında, bilinen dispatch sarmalayıcıları (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolu yerine iç yürütülebilir dosya yolunu kalıcılaştırır. Kabuk çoklayıcıları (`busybox`, `toybox`) kabuk applet'leri (`sh`, `ash` vb.) için aynı şekilde açılır. Bir sarmalayıcı veya çoklayıcı güvenli şekilde açılamazsa, hiçbir izin listesi girdisi otomatik olarak kalıcılaştırılmaz.

`python3` veya `node` gibi yorumlayıcıları izin listesine alırsanız, satır içi eval için yine açık onay gereksin diye `tools.exec.strictInlineEval=true` tercih edin. Katı modda, `allow-always` zararsız yorumlayıcı/betik çağrılarını yine kalıcılaştırabilir, ancak satır içi eval taşıyıcıları otomatik olarak kalıcılaştırılmaz.

### Güvenli ikililer ve izin listesi

| Konu | `tools.exec.safeBins` | İzin listesi (`exec-approvals.json`) |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Amaç | Dar stdin filtrelerini otomatik olarak izinli saymak | Belirli yürütülebilir dosyalara açıkça güvenmek |
| Eşleşme türü | Yürütülebilir dosya adı + güvenli ikili argv politikası | Çözümlenmiş yürütülebilir dosya yolu glob'u veya PATH ile çağrılan komutlar için çıplak komut adı glob'u |
| Bağımsız değişken kapsamı | Güvenli ikili profili ve düz belirteç kurallarıyla kısıtlanır | Yalnızca yol eşleşmesi; bağımsız değişkenler aksi durumda sizin sorumluluğunuzdadır |
| Tipik örnekler | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, özel CLI'lar |
| En iyi kullanım | Hatlarda düşük riskli metin dönüşümleri | Daha geniş davranışı veya yan etkileri olan herhangi bir araç |

Yapılandırma konumu:

- `safeBins` yapılandırmadan gelir (`tools.exec.safeBins` veya aracı başına `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` yapılandırmadan gelir (`tools.exec.safeBinTrustedDirs` veya aracı başına `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` yapılandırmadan gelir (`tools.exec.safeBinProfiles` veya aracı başına `agents.list[].tools.exec.safeBinProfiles`). Aracı başına profil anahtarları global anahtarları geçersiz kılar.
- İzin listesi girdileri, ana makineye yerel `~/.openclaw/exec-approvals.json` içinde `agents.<id>.allowlist` altında bulunur (veya Control UI / `openclaw approvals allowlist ...` üzerinden).
- `openclaw security audit`, yorumlayıcı/çalışma zamanı ikilileri açık profiller olmadan `safeBins` içinde göründüğünde `tools.exec.safe_bins_interpreter_unprofiled` ile uyarır.
- `openclaw doctor --fix`, eksik özel `safeBinProfiles.<bin>` girdilerini `{}` olarak iskeletleyebilir (sonrasında gözden geçirip sıkılaştırın). Yorumlayıcı/çalışma zamanı ikilileri otomatik olarak iskeletlenmez.

Özel profil örneği:
__OC_I18N_900000__
`jq` öğesini açıkça `safeBins` içine alırsanız, OpenClaw güvenli ikili modunda `env` yerleşiğini yine reddeder; böylece `jq -n env`, açık bir izin listesi yolu veya onay istemi olmadan ana makine süreç ortamını dökümleyemez.

## Yorumlayıcı/çalışma zamanı komutları

Onay destekli yorumlayıcı/çalışma zamanı çalıştırmaları kasıtlı olarak tutucudur:

- Kesin argv/cwd/env bağlamı her zaman bağlanır.
- Doğrudan kabuk betiği ve doğrudan çalışma zamanı dosyası biçimleri, en iyi çabayla tek bir somut yerel dosya anlık görüntüsüne bağlanır.
- Hâlâ tek bir doğrudan yerel dosyaya çözümlenen yaygın paket yöneticisi sarmalayıcı biçimleri (örneğin `pnpm exec`, `pnpm node`, `npm exec`, `npx`) bağlamadan önce açılır.
- OpenClaw bir yorumlayıcı/çalışma zamanı komutu için tam olarak bir somut yerel dosya belirleyemezse (örneğin paket betikleri, eval biçimleri, çalışma zamanına özgü yükleyici zincirleri veya belirsiz çok dosyalı biçimler), onay destekli yürütme, sahip olmadığı anlamsal kapsamı iddia etmek yerine reddedilir.
- Bu iş akışları için sandboxing, ayrı bir ana makine sınırı veya operatörün daha geniş çalışma zamanı semantiğini kabul ettiği açık bir güvenilir izin listesi/tam iş akışı tercih edin.

Onaylar gerektiğinde, exec aracı bir onay kimliğiyle hemen döner. Sonraki sistem olaylarını (`Exec finished` / `Exec denied`) ilişkilendirmek için bu kimliği kullanın. Zaman aşımından önce karar gelmezse, istek onay zaman aşımı olarak değerlendirilir ve reddetme nedeni olarak gösterilir.

### Takip teslimi davranışı

Onaylanmış bir async exec tamamlandıktan sonra OpenClaw aynı oturuma bir takip `agent` turu gönderir.

- Geçerli bir harici teslim hedefi varsa (teslim edilebilir kanal artı hedef `to`), takip teslimi o kanalı kullanır.
- Harici hedefi olmayan yalnızca webchat veya iç oturum akışlarında takip teslimi yalnızca oturumda kalır (`deliver: false`).
- Bir çağıran çözümlenebilir harici kanal olmadan açıkça katı harici teslim isterse, istek `INVALID_REQUEST` ile başarısız olur.
- `bestEffortDeliver` etkinse ve hiçbir harici kanal çözümlenemiyorsa, teslim başarısız olmak yerine yalnızca oturuma düşürülür.

## Sohbet kanallarına onay iletme

Exec onay istemlerini herhangi bir sohbet kanalına (Plugin kanalları dahil) iletebilir ve bunları `/approve` ile onaylayabilirsiniz. Bu, normal giden teslim hattını kullanır.

Yapılandırma:
__OC_I18N_900001__
Sohbette yanıtlayın:
__OC_I18N_900002__
`/approve` komutu hem exec onaylarını hem de Plugin onaylarını işler. Kimlik bekleyen bir exec onayıyla eşleşmezse, otomatik olarak bunun yerine Plugin onaylarını denetler.

### Plugin onayı iletme

Plugin onayı iletme, exec onaylarıyla aynı teslim hattını kullanır ancak `approvals.plugin` altında kendi bağımsız yapılandırmasına sahiptir. Birini etkinleştirmek veya devre dışı bırakmak diğerini etkilemez.
__OC_I18N_900003__
Yapılandırma şekli `approvals.exec` ile aynıdır: `enabled`, `mode`, `agentFilter`, `sessionFilter` ve `targets` aynı şekilde çalışır.

Paylaşılan etkileşimli yanıtları destekleyen kanallar, hem exec hem de Plugin onayları için aynı onay düğmelerini işler. Paylaşılan etkileşimli kullanıcı arayüzü olmayan kanallar, `/approve` talimatları içeren düz metne geri döner.

### Herhangi bir kanalda aynı sohbet onayları

Bir exec veya Plugin onay isteği teslim edilebilir bir sohbet yüzeyinden kaynaklandığında, aynı sohbet artık varsayılan olarak bunu `/approve` ile onaylayabilir. Bu, mevcut Web UI ve terminal UI akışlarına ek olarak Slack, Matrix ve Microsoft Teams gibi kanallar için de geçerlidir.

Bu paylaşılan metin komutu yolu, o konuşma için normal kanal auth modelini kullanır. Kaynak sohbet zaten komut gönderebiliyor ve yanıt alabiliyorsa, onay isteklerinin beklemede kalmak için artık ayrı bir yerel teslim adaptörüne ihtiyacı yoktur.

Discord ve Telegram da aynı sohbette `/approve` destekler, ancak bu kanallar yerel onay teslimi devre dışı bırakılmış olsa bile yetkilendirme için çözümlenmiş onaylayıcı listesini kullanmaya devam eder.

Telegram ve Gateway'i doğrudan çağıran diğer yerel onay istemcileri için bu geri dönüş kasıtlı olarak "onay bulunamadı" hatalarıyla sınırlıdır. Gerçek bir exec onayı reddi/hatası sessizce Plugin onayı olarak yeniden denenmez.

### Yerel onay teslimi

Bazı kanallar yerel onay istemcileri olarak da davranabilir. Yerel istemciler, paylaşılan aynı sohbet `/approve` akışının üzerine onaylayıcı DM'leri, kaynak sohbet fanout'u ve kanala özgü etkileşimli onay kullanıcı deneyimi ekler.

Yerel onay kartları/düğmeleri kullanılabildiğinde, bu yerel UI ajanla yüzleşen birincil
yoldur. Araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın kalan
tek yol olduğunu söylemedikçe, ajan ayrıca yinelenen bir düz sohbet
`/approve` komutunu yankılamamalıdır.

Bir yerel onay istemcisi yapılandırılmışsa ancak başlatan kanal için etkin bir
yerel runtime yoksa, OpenClaw yerel deterministik `/approve` istemini görünür tutar.
Yerel runtime etkinse ve iletimi dener ancak hiçbir hedef kartı almazsa, OpenClaw
isteğin yine de çözülebilmesi için tam `/approve <id> <decision>` komutunu içeren
aynı sohbette bir yedek bildirim gönderir.

Genel model:

- host exec politikası, exec onayının gerekip gerekmediğine karar vermeye devam eder
- `approvals.exec`, onay istemlerinin diğer sohbet hedeflerine iletilmesini denetler
- `channels.<channel>.execApprovals`, o kanalın yerel onay istemcisi olarak davranıp davranmayacağını denetler

Yerel onay istemcileri, aşağıdakilerin tümü doğru olduğunda önce DM iletimi otomatik olarak etkinleştirir:

- kanal yerel onay iletimini destekler
- onaylayanlar açık `execApprovals.approvers` üzerinden veya
  `commands.ownerAllowFrom` gibi sahip kimliğinden çözümlenebilir
- `channels.<channel>.execApprovals.enabled` ayarlanmamış ya da `"auto"` değerindedir

Bir yerel onay istemcisini açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Onaylayanlar çözümlendiğinde
zorla etkinleştirmek için `enabled: true` ayarlayın. Herkese açık kaynak sohbet iletimi
`channels.<channel>.execApprovals.target` üzerinden açık kalır.

SSS: [Sohbet onayları için neden iki exec onay yapılandırması var?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Bu yerel onay istemcileri, paylaşılan aynı sohbet `/approve` akışının ve paylaşılan onay düğmelerinin
üstüne DM yönlendirmesi ve isteğe bağlı kanal fanout ekler.

Paylaşılan davranış:

- Slack, Matrix, Microsoft Teams ve benzeri iletilebilir sohbetler, aynı sohbet `/approve` için normal kanal kimlik doğrulama modelini kullanır
- bir yerel onay istemcisi otomatik etkinleştiğinde, varsayılan yerel iletim hedefi onaylayan DM'leridir
- Discord ve Telegram için yalnızca çözümlenmiş onaylayanlar onaylayabilir veya reddedebilir
- Discord onaylayanları açık (`execApprovals.approvers`) olabilir veya `commands.ownerAllowFrom` üzerinden çıkarılabilir
- Telegram onaylayanları açık (`execApprovals.approvers`) olabilir veya `commands.ownerAllowFrom` üzerinden çıkarılabilir
- Slack onaylayanları açık (`execApprovals.approvers`) olabilir veya `commands.ownerAllowFrom` üzerinden çıkarılabilir
- Slack yerel düğmeleri onay id türünü korur, böylece `plugin:` id'leri ikinci bir Slack yerel yedek katmanı olmadan Plugin onaylarını çözümleyebilir
- Matrix yerel DM/kanal yönlendirmesi ve tepki kısayolları hem exec hem de Plugin onaylarını işler;
  Plugin yetkilendirmesi yine `channels.matrix.dm.allowFrom` üzerinden gelir
- Matrix yerel istemleri ilk istem event'i üzerinde `com.openclaw.approval` özel event içeriğini içerir;
  böylece OpenClaw-aware Matrix istemcileri yapılandırılmış onay durumunu okuyabilirken standart istemciler
  düz metin `/approve` yedeğini korur
- istekte bulunan kişinin onaylayan olması gerekmez
- başlatan sohbet, komutları ve yanıtları zaten destekliyorsa `/approve` ile doğrudan onaylayabilir
- yerel Discord onay düğmeleri onay id türüne göre yönlendirir: `plugin:` id'leri
  doğrudan Plugin onaylarına gider, diğer her şey exec onaylarına gider
- yerel Telegram onay düğmeleri, `/approve` ile aynı sınırlı exec-to-plugin yedeğini izler
- yerel `target` kaynak sohbet iletimini etkinleştirdiğinde, onay istemleri komut metnini içerir
- bekleyen exec onayları varsayılan olarak 30 dakika sonra sona erer
- hiçbir operatör UI'si veya yapılandırılmış onay istemcisi isteği kabul edemiyorsa, istem `askFallback` değerine geri döner

`/diagnostics` ve `/export-trajectory` gibi hassas, yalnızca sahip grup komutları, onay istemleri ve nihai sonuçlar için özel
sahip yönlendirmesi kullanır. OpenClaw önce sahibin komutu çalıştırdığı aynı yüzeyde özel bir rota dener.
Bu yüzeyde özel sahip rotası yoksa, `commands.ownerAllowFrom` içindeki ilk kullanılabilir sahip rotasına
geri döner; böylece Telegram yapılandırılmış birincil özel arayüz olduğunda bir Discord grup komutu
onayı ve sonucu yine de sahibin Telegram DM'sine gönderebilir. Grup sohbeti yalnızca kısa bir onay alır.

Telegram varsayılan olarak onaylayan DM'lerini kullanır (`target: "dm"`). Onay istemlerinin başlatan Telegram sohbetinde/konusunda da
görünmesini istediğinizde `channel` veya `both` seçeneğine geçebilirsiniz. Telegram forum
konuları için OpenClaw, onay istemi ve onay sonrası takip için konuyu korur.

Bkz:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC akışı
__OC_I18N_900004__
Güvenlik notları:

- Unix socket modu `0600`, token `exec-approvals.json` içinde saklanır.
- Aynı UID eş denetimi.
- Challenge/response (nonce + HMAC token + request hash) + kısa TTL.

## İlgili

- [Exec onayları](/tr/tools/exec-approvals) — çekirdek politika ve onay akışı
- [Exec aracı](/tr/tools/exec)
- [Yükseltilmiş mod](/tr/tools/elevated)
- [Skills](/tr/tools/skills) — skill-backed otomatik izin davranışı
