---
read_when:
    - Güvenli binleri veya özel güvenli-bin profillerini yapılandırma
    - Onayları Slack/Discord/Telegram veya diğer sohbet kanallarına yönlendirme
    - Bir kanal için yerel onay istemcisi uygulama
summary: 'Gelişmiş exec onayları: güvenli ikili dosyalar, yorumlayıcı bağlama, onay iletme, yerel teslim'
title: Yürütme onayları — gelişmiş
x-i18n:
    generated_at: "2026-05-06T09:33:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ffef41ccb6018c5d38e153d015e979d43a6fafbe37a4377c3fcb7c6f212186c
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Gelişmiş exec onayı konuları: `safeBins` hızlı yolu, yorumlayıcı/çalışma zamanı
bağlama ve sohbet kanallarına onay yönlendirme (yerel teslim dahil).
Temel ilke ve onay akışı için bkz. [Exec onayları](/tr/tools/exec-approvals).

## Güvenli ikili dosyalar (yalnızca stdin)

`tools.exec.safeBins`, açık izin listesi girdileri **olmadan** izin listesi
modunda çalışabilen küçük bir **yalnızca stdin** ikili dosya listesi (örneğin
`cut`) tanımlar. Güvenli ikili dosyalar konumsal dosya argümanlarını ve yol
benzeri tokenları reddeder; bu nedenle yalnızca gelen akış üzerinde işlem
yapabilirler. Bunu genel bir güven listesi değil, akış filtreleri için dar bir
hızlı yol olarak ele alın.

<Warning>
Yorumlayıcı veya çalışma zamanı ikili dosyalarını (örneğin `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) `safeBins` içine **eklemeyin**. Bir komut tasarımı
gereği kod değerlendirebiliyor, alt komutlar çalıştırabiliyor veya dosya
okuyabiliyorsa açık izin listesi girdilerini tercih edin ve onay istemlerini
etkin tutun. Özel güvenli ikili dosyalar `tools.exec.safeBinProfiles.<bin>`
içinde açık bir profil tanımlamalıdır.
</Warning>

Varsayılan güvenli ikili dosyalar:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` ve `sort` varsayılan listede değildir. Bunları dahil ederseniz stdin
dışı iş akışları için açık izin listesi girdilerini koruyun. Güvenli ikili dosya
modunda `grep` için kalıbı `-e`/`--regexp` ile sağlayın; konumsal kalıp biçimi,
dosya operandlarının belirsiz konumsal değerler olarak gizlenmesini önlemek için
reddedilir.

### Argv doğrulaması ve reddedilen bayraklar

Doğrulama yalnızca argv biçiminden deterministiktir (ana makine dosya sistemi
varlık kontrolleri yapılmaz); bu, izin/verme reddetme farklarından dosya varlığı
oracle davranışını önler. Varsayılan güvenli ikili dosyalar için dosya odaklı
seçenekler reddedilir; uzun seçenekler kapalı hataya göre doğrulanır (bilinmeyen
bayraklar ve belirsiz kısaltmalar reddedilir).

Güvenli ikili dosya profiline göre reddedilen bayraklar:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Güvenli ikili dosyalar ayrıca argv tokenlarının yalnızca stdin segmentleri için
çalıştırma zamanında **literal metin** olarak ele alınmasını zorunlu kılar
(globbing yoktur ve `$VARS` genişletmesi yapılmaz); böylece `*` veya
`$HOME/...` gibi kalıplar dosya okumalarını gizlemek için kullanılamaz.

### Güvenilir ikili dosya dizinleri

Güvenli ikili dosyalar güvenilir ikili dosya dizinlerinden çözümlenmelidir
(sistem varsayılanları artı isteğe bağlı `tools.exec.safeBinTrustedDirs`).
`PATH` girdileri hiçbir zaman otomatik olarak güvenilir sayılmaz. Varsayılan
güvenilir dizinler kasıtlı olarak en az düzeydedir: `/bin`, `/usr/bin`. Güvenli
ikili dosya yürütülebiliriniz paket yöneticisi/kullanıcı yollarında (örneğin
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`) bulunuyorsa
bunları açıkça `tools.exec.safeBinTrustedDirs` içine ekleyin.

### Kabuk zincirleme, sarmalayıcılar ve çoklayıcılar

Kabuk zincirleme (`&&`, `||`, `;`), her üst düzey segment izin listesini
karşıladığında (güvenli ikili dosyalar veya skill otomatik izni dahil) izinlidir.
Yönlendirmeler izin listesi modunda desteklenmez. Komut ikamesi (`$()` / ters
tırnaklar), çift tırnakların içinde dahil olmak üzere izin listesi ayrıştırması
sırasında reddedilir; literal `$()` metnine ihtiyacınız varsa tek tırnak kullanın.

macOS eşlikçi uygulama onaylarında, kabuk kontrolü veya genişletme sözdizimi
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) içeren ham kabuk metni,
kabuk ikili dosyasının kendisi izin listesinde değilse izin listesi eşleşmemesi
olarak ele alınır.

Kabuk sarmalayıcıları (`bash|sh|zsh ... -c/-lc`) için istek kapsamlı env
geçersiz kılmaları küçük ve açık bir izin listesine indirgenir (`TERM`, `LANG`,
`LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

İzin listesi modundaki `allow-always` kararları için bilinen gönderim
sarmalayıcıları (`env`, `nice`, `nohup`, `stdbuf`, `timeout`), sarmalayıcı yolu
yerine iç yürütülebilir yolunu kalıcı hale getirir. Kabuk çoklayıcıları
(`busybox`, `toybox`) kabuk uygulamacıkları (`sh`, `ash` vb.) için aynı şekilde
sarmaldan çıkarılır. Bir sarmalayıcı veya çoklayıcı güvenli biçimde sarmaldan
çıkarılamazsa hiçbir izin listesi girdisi otomatik olarak kalıcı hale getirilmez.

`python3` veya `node` gibi yorumlayıcıları izin listesine alırsanız satır içi
eval işleminin yine de açık onay gerektirmesi için tercihen
`tools.exec.strictInlineEval=true` kullanın. Katı modda `allow-always`, zararsız
yorumlayıcı/betik çağrılarını yine de kalıcı hale getirebilir; ancak satır içi
eval taşıyıcıları otomatik olarak kalıcı hale getirilmez.

### Güvenli ikili dosyalar ve izin listesi

| Konu             | `tools.exec.safeBins`                                  | İzin listesi (`exec-approvals.json`)                                                |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Amaç             | Dar stdin filtrelerine otomatik izin ver               | Belirli yürütülebilir dosyalara açıkça güven                                        |
| Eşleşme türü     | Yürütülebilir adı + güvenli ikili dosya argv ilkesi    | Çözümlenmiş yürütülebilir yol globu veya PATH ile çağrılan komutlar için yalın komut adı globu |
| Argüman kapsamı  | Güvenli ikili dosya profili ve literal-token kurallarıyla kısıtlı | Varsayılan olarak yol eşleşmesi; isteğe bağlı `argPattern` ayrıştırılmış argv değerini kısıtlayabilir |
| Tipik örnekler   | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, özel CLI'lar                                     |
| En iyi kullanım  | İş hatlarında düşük riskli metin dönüşümleri           | Daha geniş davranışa veya yan etkilere sahip herhangi bir araç                      |

Yapılandırma konumu:

- `safeBins`, yapılandırmadan gelir (`tools.exec.safeBins` veya ajan başına `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs`, yapılandırmadan gelir (`tools.exec.safeBinTrustedDirs` veya ajan başına `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles`, yapılandırmadan gelir (`tools.exec.safeBinProfiles` veya ajan başına `agents.list[].tools.exec.safeBinProfiles`). Ajan başına profil anahtarları genel anahtarları geçersiz kılar.
- izin listesi girdileri, ana makineye yerel `~/.openclaw/exec-approvals.json` içinde `agents.<id>.allowlist` altında bulunur (veya Control UI / `openclaw approvals allowlist ...` aracılığıyla).
- `openclaw security audit`, yorumlayıcı/çalışma zamanı ikili dosyaları açık profiller olmadan `safeBins` içinde göründüğünde `tools.exec.safe_bins_interpreter_unprofiled` ile uyarır.
- `openclaw doctor --fix`, eksik özel `safeBinProfiles.<bin>` girdilerini `{}` olarak iskeletleyebilir (sonrasında gözden geçirip sıkılaştırın). Yorumlayıcı/çalışma zamanı ikili dosyaları otomatik olarak iskeletlenmez.

Özel profil örneği:
__OC_I18N_900000__
`jq` değerini açıkça `safeBins` içine alırsanız OpenClaw, güvenli ikili dosya
modunda `env` yerleşiğini yine de reddeder; böylece `jq -n env`, açık bir izin
listesi yolu veya onay istemi olmadan ana makine süreç ortamını dökemez.

## Yorumlayıcı/çalışma zamanı komutları

Onay destekli yorumlayıcı/çalışma zamanı çalıştırmaları kasıtlı olarak
muhafazakardır:

- Tam argv/cwd/env bağlamı her zaman bağlanır.
- Doğrudan kabuk betiği ve doğrudan çalışma zamanı dosyası biçimleri, tek bir somut yerel dosya anlık görüntüsüne en iyi çabayla bağlanır.
- Yine de tek bir doğrudan yerel dosyaya çözümlenen yaygın paket yöneticisi sarmalayıcı biçimleri (örneğin `pnpm exec`, `pnpm node`, `npm exec`, `npx`) bağlama öncesinde sarmaldan çıkarılır.
- OpenClaw, bir yorumlayıcı/çalışma zamanı komutu için tam olarak bir somut yerel dosya tanımlayamazsa (örneğin paket betikleri, eval biçimleri, çalışma zamanına özgü yükleyici zincirleri veya belirsiz çok dosyalı biçimler), kapsamadığı anlamsal kapsamı varmış gibi göstermek yerine onay destekli yürütme reddedilir.
- Bu iş akışları için sandboxing, ayrı bir ana makine sınırı veya operatörün daha geniş çalışma zamanı semantiğini kabul ettiği açık güvenilir izin listesi/tam iş akışı tercih edin.

Onaylar gerekli olduğunda exec aracı bir onay kimliğiyle hemen döner. Bu kimliği
daha sonraki sistem olaylarını (`Exec finished` / `Exec denied`) ilişkilendirmek
için kullanın. Zaman aşımından önce karar gelmezse istek onay zaman aşımı olarak
ele alınır ve bir ret nedeni olarak gösterilir.

### Takip teslim davranışı

Onaylanmış bir async exec tamamlandıktan sonra OpenClaw aynı oturuma bir takip
`agent` turu gönderir.

- Geçerli bir dış teslim hedefi varsa (teslim edilebilir kanal artı hedef `to`), takip teslimi o kanalı kullanır.
- Dış hedefi olmayan yalnızca web sohbeti veya dahili oturum akışlarında takip teslimi yalnızca oturumda kalır (`deliver: false`).
- Bir çağıran çözümlenebilir dış kanal olmadan katı dış teslimi açıkça isterse istek `INVALID_REQUEST` ile başarısız olur.
- `bestEffortDeliver` etkinse ve hiçbir dış kanal çözümlenemiyorsa teslim başarısız olmak yerine yalnızca oturuma düşürülür.

## Sohbet kanallarına onay yönlendirme

Exec onay istemlerini herhangi bir sohbet kanalına (Plugin kanalları dahil)
yönlendirebilir ve `/approve` ile onaylayabilirsiniz. Bu, normal giden teslim
iş hattını kullanır.

Yapılandırma:
__OC_I18N_900001__
Sohbette yanıtlayın:
__OC_I18N_900002__
`/approve` komutu hem exec onaylarını hem de Plugin onaylarını işler. Kimlik,
bekleyen bir exec onayıyla eşleşmezse bunun yerine otomatik olarak Plugin
onaylarını kontrol eder.

### Plugin onayı yönlendirme

Plugin onayı yönlendirme, exec onaylarıyla aynı teslim iş hattını kullanır ancak
`approvals.plugin` altında kendi bağımsız yapılandırmasına sahiptir. Birini
etkinleştirmek veya devre dışı bırakmak diğerini etkilemez.
__OC_I18N_900003__
Yapılandırma biçimi `approvals.exec` ile aynıdır: `enabled`, `mode`,
`agentFilter`, `sessionFilter` ve `targets` aynı şekilde çalışır.

Paylaşılan etkileşimli yanıtları destekleyen kanallar, hem exec hem de Plugin
onayları için aynı onay düğmelerini işler. Paylaşılan etkileşimli UI olmayan
kanallar, `/approve` yönergeleriyle düz metne geri döner.

### Herhangi bir kanalda aynı sohbet onayları

Bir exec veya Plugin onay isteği teslim edilebilir bir sohbet yüzeyinden
kaynaklandığında, aynı sohbet artık varsayılan olarak `/approve` ile bunu
onaylayabilir. Bu, mevcut Web UI ve terminal UI akışlarına ek olarak Slack,
Matrix ve Microsoft Teams gibi kanallar için geçerlidir.

Bu paylaşılan metin komutu yolu, ilgili konuşma için normal kanal kimlik
doğrulama modelini kullanır. Kaynak sohbet zaten komut gönderebiliyor ve yanıt
alabiliyorsa onay isteklerinin beklemede kalmak için artık ayrı bir yerel teslim
adaptörüne ihtiyacı yoktur.

Discord ve Telegram da aynı sohbet `/approve` desteği sunar; ancak bu kanallar,
yerel onay teslimi devre dışı olduğunda bile yetkilendirme için çözümlenmiş
onaylayıcı listesini kullanmaya devam eder.

Telegram ve Gateway'i doğrudan çağıran diğer yerel onay istemcileri için bu geri
dönüş kasıtlı olarak "onay bulunamadı" başarısızlıklarıyla sınırlıdır. Gerçek
bir exec onayı reddi/hatası sessizce Plugin onayı olarak yeniden denenmez.

### Yerel onay teslimi

Bazı kanallar ayrıca yerel onay istemcileri olarak da davranabilir. Yerel
istemciler, paylaşılan aynı sohbet `/approve` akışının üzerine onaylayıcı DM'leri,
kaynak sohbet fanout'u ve kanala özgü etkileşimli onay UX'i ekler.

Yerel onay kartları/düğmeleri mevcut olduğunda, bu yerel UI ajanlara yönelik birincil yoldur. Ajan, araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın kalan tek yol olduğunu söylemedikçe yinelenen düz sohbet `/approve` komutunu ayrıca tekrar etmemelidir.

Yerel bir onay istemcisi yapılandırılmışsa ancak kaynak kanal için etkin bir yerel çalışma zamanı yoksa, OpenClaw yerel belirleyici `/approve` istemini görünür tutar. Yerel çalışma zamanı etkinse ve teslimatı dener ancak hiçbir hedef kartı almazsa, OpenClaw isteğin yine de çözülebilmesi için tam `/approve <id> <decision>` komutunu içeren aynı sohbet yedek bildirimi gönderir.

Genel model:

- ana makine exec ilkesi, exec onayının gerekli olup olmadığına hâlâ karar verir
- `approvals.exec`, onay istemlerinin diğer sohbet hedeflerine iletilmesini denetler
- `channels.<channel>.execApprovals`, o kanalın yerel onay istemcisi gibi davranıp davranmayacağını denetler

Yerel onay istemcileri, bunların tümü doğru olduğunda önce DM teslimatını otomatik etkinleştirir:

- kanal yerel onay teslimatını destekler
- onaylayanlar açık `execApprovals.approvers` değerlerinden veya `commands.ownerAllowFrom` gibi sahip kimliğinden çözümlenebilir
- `channels.<channel>.execApprovals.enabled` ayarlanmamıştır veya `"auto"` değerindedir

Yerel onay istemcisini açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Onaylayanlar çözümlendiğinde zorla açmak için `enabled: true` ayarlayın. Herkese açık kaynak sohbet teslimatı, `channels.<channel>.execApprovals.target` üzerinden açık kalır.

SSS: [Sohbet onayları için neden iki exec onay yapılandırması var?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Bu yerel onay istemcileri, paylaşılan aynı sohbet `/approve` akışının ve paylaşılan onay düğmelerinin üzerine DM yönlendirmesi ve isteğe bağlı kanal dağıtımı ekler.

Paylaşılan davranış:

- Slack, Matrix, Microsoft Teams ve benzeri teslim edilebilir sohbetler, aynı sohbet `/approve` için normal kanal kimlik doğrulama modelini kullanır
- yerel onay istemcisi otomatik etkinleştiğinde varsayılan yerel teslimat hedefi onaylayan DM’leridir
- Discord ve Telegram için yalnızca çözümlenen onaylayanlar onaylayabilir veya reddedebilir
- Discord onaylayanları açık olabilir (`execApprovals.approvers`) veya `commands.ownerAllowFrom` üzerinden çıkarılabilir
- Telegram onaylayanları açık olabilir (`execApprovals.approvers`) veya `commands.ownerAllowFrom` üzerinden çıkarılabilir
- Slack onaylayanları açık olabilir (`execApprovals.approvers`) veya `commands.ownerAllowFrom` üzerinden çıkarılabilir
- Slack yerel düğmeleri onay kimliği türünü korur, böylece `plugin:` kimlikleri ikinci bir Slack-yerel yedek katmanı olmadan plugin onaylarını çözümleyebilir
- Matrix yerel DM/kanal yönlendirmesi ve tepki kısayolları hem exec hem de plugin onaylarını işler; plugin yetkilendirmesi hâlâ `channels.matrix.dm.allowFrom` değerinden gelir
- Matrix yerel istemleri, ilk istem olayında `com.openclaw.approval` özel olay içeriğini içerir; böylece OpenClaw uyumlu Matrix istemcileri yapılandırılmış onay durumunu okuyabilirken standart istemciler düz metin `/approve` yedeğini korur
- istekte bulunan kişinin onaylayan olması gerekmez
- kaynak sohbet komutları ve yanıtları zaten destekliyorsa `/approve` ile doğrudan onaylayabilir
- yerel Discord onay düğmeleri onay kimliği türüne göre yönlendirir: `plugin:` kimlikleri doğrudan plugin onaylarına gider, diğer her şey exec onaylarına gider
- yerel Telegram onay düğmeleri `/approve` ile aynı sınırlı exec’ten plugin’e yedek akışı izler
- yerel `target`, kaynak sohbet teslimatını etkinleştirdiğinde onay istemleri komut metnini içerir
- bekleyen exec onayları varsayılan olarak 30 dakika sonra sona erer
- isteği hiçbir operatör UI’sı veya yapılandırılmış onay istemcisi kabul edemiyorsa, istem `askFallback` değerine geri döner

`/diagnostics` ve `/export-trajectory` gibi hassas, yalnızca sahip grubu komutları, onay istemleri ve nihai sonuçlar için özel sahip yönlendirmesi kullanır. OpenClaw önce sahibin komutu çalıştırdığı aynı yüzeyde özel bir rota dener. Bu yüzeyde özel sahip rotası yoksa, `commands.ownerAllowFrom` içinden kullanılabilir ilk sahip rotasına geri döner; böylece Discord grup komutu, Telegram yapılandırılmış birincil özel arayüz olduğunda onayı ve sonucu yine de sahibin Telegram DM’sine gönderebilir. Grup sohbeti yalnızca kısa bir onay bildirimi alır.

Telegram varsayılan olarak onaylayan DM’lerini kullanır (`target: "dm"`). Onay istemlerinin kaynak Telegram sohbetinde/konusunda da görünmesini istediğinizde `channel` veya `both` değerine geçebilirsiniz. Telegram forum konuları için OpenClaw, onay istemi ve onay sonrası takip için konuyu korur.

Bkz.:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC akışı
__OC_I18N_900004__
Güvenlik notları:

- Unix soket modu `0600`, token `exec-approvals.json` içinde saklanır.
- Aynı UID eş denetimi.
- Sınama/yanıt (nonce + HMAC token + request hash) + kısa TTL.

## İlgili

- [Exec onayları](/tr/tools/exec-approvals) — çekirdek ilke ve onay akışı
- [Exec aracı](/tr/tools/exec)
- [Yükseltilmiş mod](/tr/tools/elevated)
- [Skills](/tr/tools/skills) — Skills destekli otomatik izin verme davranışı
