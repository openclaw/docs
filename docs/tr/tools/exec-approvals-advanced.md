---
read_when:
    - Güvenli kutuları veya özel güvenli kutu profillerini yapılandırma
    - Onayları Slack/Discord/Telegram veya diğer sohbet kanallarına yönlendirme
    - Bir kanal için yerel onay istemcisi uygulama
summary: 'Gelişmiş yürütme onayları: güvenli ikililer, yorumlayıcı bağlama, onay iletme, yerel teslimat'
title: Yürütme onayları — gelişmiş
x-i18n:
    generated_at: "2026-05-07T01:54:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: d876efbfa34ef951b47cbfec9cc6a6a69a69f5b84365165d423d251163373040
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Gelişmiş exec onayı konuları: `safeBins` hızlı yolu, yorumlayıcı/runtime
bağlama ve sohbet kanallarına onay yönlendirme (yerel teslim dahil).
Temel ilke ve onay akışı için bkz. [Exec onayları](/tr/tools/exec-approvals).

## Güvenli ikililer (yalnızca stdin)

`tools.exec.safeBins`, açık izin listesi
girdileri olmadan izin listesi modunda çalışabilen küçük bir **yalnızca stdin**
ikili listesi (örneğin `cut`) tanımlar. Güvenli ikililer konumsal dosya argümanlarını
ve yol benzeri belirteçleri reddeder, bu yüzden yalnızca gelen akış üzerinde
çalışabilirler. Bunu genel bir güven listesi olarak değil, akış filtreleri için
dar kapsamlı bir hızlı yol olarak değerlendirin.

<Warning>
Yorumlayıcı veya runtime ikililerini (örneğin `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) `safeBins` içine **eklemeyin**. Bir komut tasarım gereği
kodu değerlendirebiliyor, alt komutlar çalıştırabiliyor veya dosya okuyabiliyorsa,
açık izin listesi girdilerini tercih edin ve onay istemlerini etkin tutun.
Özel güvenli ikililer `tools.exec.safeBinProfiles.<bin>` içinde açık bir profil tanımlamalıdır.
</Warning>

Varsayılan güvenli ikililer:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` ve `sort` varsayılan listede değildir. Dahil etmeyi seçerseniz, stdin dışı
iş akışları için açık izin listesi girdilerini koruyun. Güvenli ikili modunda `grep`
için deseni `-e`/`--regexp` ile sağlayın; konumsal desen biçimi reddedilir,
böylece dosya operandları belirsiz konumsallar olarak gizlenemez.

### Argv doğrulaması ve reddedilen bayraklar

Doğrulama yalnızca argv biçiminden deterministik olarak yapılır (ana makine dosya
sistemi varlık denetimi yoktur); bu, izin/verme farklarından dosya varlığı oracle
davranışını önler. Varsayılan güvenli ikililer için dosya odaklı seçenekler reddedilir;
uzun seçenekler kapalı başarısız olacak şekilde doğrulanır (bilinmeyen bayraklar ve
belirsiz kısaltmalar reddedilir).

Güvenli ikili profiline göre reddedilen bayraklar:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Güvenli ikililer ayrıca yalnızca stdin bölümleri için argv belirteçlerinin
çalıştırma zamanında **düz metin** olarak ele alınmasını zorunlu kılar (globbing yok
ve `$VARS` genişletmesi yok), böylece `*` veya `$HOME/...` gibi desenler dosya
okumalarını gizlemek için kullanılamaz.

### Güvenilir ikili dizinleri

Güvenli ikililer güvenilir ikili dizinlerinden çözülmelidir (sistem varsayılanları
artı isteğe bağlı `tools.exec.safeBinTrustedDirs`). `PATH` girdileri hiçbir zaman
otomatik olarak güvenilir sayılmaz. Varsayılan güvenilir dizinler kasıtlı olarak
asgari düzeydedir: `/bin`, `/usr/bin`. Güvenli ikili yürütülebilir dosyanız paket
yöneticisi/kullanıcı yollarında bulunuyorsa (örneğin `/opt/homebrew/bin`,
`/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), bunları açıkça
`tools.exec.safeBinTrustedDirs` içine ekleyin.

### Shell zincirleme, sarmalayıcılar ve çoklayıcılar

Her üst düzey bölüm izin listesini (güvenli ikililer veya Skills otomatik izni dahil)
karşılıyorsa shell zincirlemeye (`&&`, `||`, `;`) izin verilir. Yönlendirmeler izin
listesi modunda desteklenmemeye devam eder. Komut ikamesi (`$()` / ters tırnaklar),
çift tırnak içinde bile izin listesi ayrıştırması sırasında reddedilir; düz metin
`$()` gerekiyorsa tek tırnak kullanın.

macOS eşlikçi uygulama onaylarında, shell denetimi veya genişletme sözdizimi
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) içeren ham shell metni,
shell ikilisinin kendisi izin listesine alınmadığı sürece izin listesi ıskalaması
olarak ele alınır.

Shell sarmalayıcıları (`bash|sh|zsh ... -c/-lc`) için istek kapsamlı env geçersiz
kılmaları küçük bir açık izin listesine indirgenir (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

İzin listesi modunda `allow-always` kararları için bilinen dispatch sarmalayıcıları
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`), sarmalayıcı yolu yerine iç yürütülebilir
dosya yolunu kalıcı hale getirir. Shell çoklayıcıları (`busybox`, `toybox`) shell
applet'leri (`sh`, `ash` vb.) için aynı şekilde açılır. Bir sarmalayıcı veya çoklayıcı
güvenli şekilde açılamıyorsa, hiçbir izin listesi girdisi otomatik olarak kalıcı hale
getirilmez.

`python3` veya `node` gibi yorumlayıcıları izin listesine alırsanız, satır içi eval'in
yine de açık onay gerektirmesi için `tools.exec.strictInlineEval=true` tercih edin.
Katı modda `allow-always` yine de zararsız yorumlayıcı/betik çağrılarını kalıcı hale
getirebilir, ancak satır içi eval taşıyıcıları otomatik olarak kalıcı hale getirilmez.

### Güvenli ikililer ve izin listesi

| Konu             | `tools.exec.safeBins`                                  | İzin listesi (`exec-approvals.json`)                                               |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Amaç             | Dar kapsamlı stdin filtrelerine otomatik izin vermek   | Belirli yürütülebilir dosyalara açıkça güvenmek                                    |
| Eşleşme türü     | Yürütülebilir adı + güvenli ikili argv ilkesi          | Çözülen yürütülebilir yol glob'u veya PATH ile çağrılan komutlar için çıplak komut adı glob'u |
| Argüman kapsamı  | Güvenli ikili profili ve düz belirteç kurallarıyla sınırlı | Varsayılan olarak yol eşleşmesi; isteğe bağlı `argPattern` ayrıştırılmış argv'yi sınırlayabilir |
| Tipik örnekler   | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, özel CLI'ler                                    |
| En iyi kullanım  | Ardışık düzenlerde düşük riskli metin dönüşümleri      | Daha geniş davranışa veya yan etkilere sahip herhangi bir araç                     |

Yapılandırma konumu:

- `safeBins` yapılandırmadan gelir (`tools.exec.safeBins` veya ajan başına `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` yapılandırmadan gelir (`tools.exec.safeBinTrustedDirs` veya ajan başına `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` yapılandırmadan gelir (`tools.exec.safeBinProfiles` veya ajan başına `agents.list[].tools.exec.safeBinProfiles`). Ajan başına profil anahtarları global anahtarları geçersiz kılar.
- İzin listesi girdileri, `agents.<id>.allowlist` altında ana makineye yerel `~/.openclaw/exec-approvals.json` içinde bulunur (veya Control UI / `openclaw approvals allowlist ...` üzerinden).
- `openclaw security audit`, yorumlayıcı/runtime ikilileri açık profiller olmadan `safeBins` içinde göründüğünde `tools.exec.safe_bins_interpreter_unprofiled` ile uyarır.
- `openclaw doctor --fix`, eksik özel `safeBinProfiles.<bin>` girdilerini `{}` olarak iskeleyebilir (sonrasında gözden geçirip sıkılaştırın). Yorumlayıcı/runtime ikilileri otomatik olarak iskelelenmez.

Özel profil örneği:
__OC_I18N_900000__
`jq`'yu açıkça `safeBins` içine alırsanız, OpenClaw güvenli ikili modunda yine de `env`
builtin'ini reddeder; böylece `jq -n env`, açık bir izin listesi yolu veya onay istemi
olmadan ana makine işlem ortamını dökemez.

## Yorumlayıcı/runtime komutları

Onay destekli yorumlayıcı/runtime çalıştırmaları kasıtlı olarak muhafazakardır:

- Tam argv/cwd/env bağlamı her zaman bağlanır.
- Doğrudan shell betiği ve doğrudan runtime dosyası biçimleri, en iyi çabayla tek bir somut yerel dosya anlık görüntüsüne bağlanır.
- Hala tek bir doğrudan yerel dosyaya çözülen yaygın paket yöneticisi sarmalayıcı biçimleri (örneğin `pnpm exec`, `pnpm node`, `npm exec`, `npx`) bağlamadan önce açılır.
- OpenClaw bir yorumlayıcı/runtime komutu için tam olarak tek bir somut yerel dosya tanımlayamıyorsa (örneğin paket betikleri, eval biçimleri, runtime'a özgü yükleyici zincirleri veya belirsiz çok dosyalı biçimler), onay destekli yürütme kapsamadığı semantik kapsamı iddia etmek yerine reddedilir.
- Bu iş akışları için sandboxing, ayrı bir ana makine sınırı veya operatörün daha geniş runtime semantiğini kabul ettiği açık bir güvenilir izin listesi/tam iş akışı tercih edin.

Onaylar gerektiğinde exec aracı hemen bir onay kimliğiyle döner. Bu kimliği daha sonra gelen sistem olaylarını (`Exec finished` / `Exec denied`) ilişkilendirmek için kullanın. Zaman aşımından önce karar gelmezse, istek onay zaman aşımı olarak ele alınır ve ret nedeni olarak gösterilir.

### Takip teslim davranışı

Onaylanmış bir async exec bittikten sonra OpenClaw aynı oturuma bir takip `agent` dönüşü gönderir.

- Geçerli bir harici teslim hedefi varsa (teslim edilebilir kanal artı hedef `to`), takip teslimi o kanalı kullanır.
- Harici hedefi olmayan yalnızca webchat veya dahili oturum akışlarında, takip teslimi yalnızca oturumda kalır (`deliver: false`).
- Bir çağıran çözülebilir harici kanal olmadan katı harici teslimi açıkça isterse, istek `INVALID_REQUEST` ile başarısız olur.
- `bestEffortDeliver` etkinse ve harici kanal çözülemiyorsa, teslim başarısız olmak yerine yalnızca oturuma düşürülür.

## Sohbet kanallarına onay yönlendirme

Exec onay istemlerini herhangi bir sohbet kanalına (Plugin kanalları dahil) yönlendirebilir ve
bunları `/approve` ile onaylayabilirsiniz. Bu normal giden teslim ardışık düzenini kullanır.

Yapılandırma:
__OC_I18N_900001__
Sohbette yanıtlayın:
__OC_I18N_900002__
`/approve` komutu hem exec onaylarını hem de Plugin onaylarını işler. Kimlik bekleyen bir exec onayıyla eşleşmezse, bunun yerine otomatik olarak Plugin onaylarını denetler.

### Plugin onayı yönlendirme

Plugin onayı yönlendirme, exec onaylarıyla aynı teslim ardışık düzenini kullanır ancak
`approvals.plugin` altında kendi bağımsız yapılandırmasına sahiptir. Birini etkinleştirmek
veya devre dışı bırakmak diğerini etkilemez.
__OC_I18N_900003__
Yapılandırma biçimi `approvals.exec` ile aynıdır: `enabled`, `mode`, `agentFilter`,
`sessionFilter` ve `targets` aynı şekilde çalışır.

Paylaşılan etkileşimli yanıtları destekleyen kanallar, hem exec hem de Plugin onayları için
aynı onay düğmelerini işler. Paylaşılan etkileşimli UI olmayan kanallar, `/approve`
talimatlarıyla düz metne geri döner.
Plugin onay istekleri kullanılabilir kararları sınırlayabilir. Onay yüzeyleri isteğin
bildirilen karar kümesini kullanır ve Gateway sunulmamış bir kararı gönderme girişimlerini reddeder.

### Her kanalda aynı sohbet onayları

Bir exec veya Plugin onay isteği teslim edilebilir bir sohbet yüzeyinden kaynaklandığında, aynı
sohbet artık varsayılan olarak `/approve` ile bunu onaylayabilir. Bu, mevcut Web UI ve terminal UI
akışlarına ek olarak Slack, Matrix ve Microsoft Teams gibi kanallar için geçerlidir.

Bu paylaşılan metin komutu yolu, ilgili konuşma için normal kanal yetkilendirme modelini kullanır.
Kaynak sohbet zaten komut gönderebiliyor ve yanıt alabiliyorsa, onay isteklerinin beklemede kalması
için artık ayrı bir yerel teslim adaptörüne ihtiyacı yoktur.

Discord ve Telegram da aynı sohbette `/approve` destekler, ancak yerel onay teslimi devre dışı
olduğunda bile bu kanallar yetkilendirme için çözümlenen onaylayan listesini kullanmaya devam eder.

Telegram ve Gateway'i doğrudan çağıran diğer yerel onay istemcileri için,
bu geri dönüş kasıtlı olarak "onay bulunamadı" hatalarıyla sınırlıdır. Gerçek bir
exec onayı reddi/hatası sessizce Plugin onayı olarak yeniden denenmez.

### Yerel onay teslimi

Bazı kanallar yerel onay istemcileri olarak da davranabilir. Yerel istemciler, paylaşılan aynı sohbet `/approve` akışının üzerine onaylayıcı DM'leri, kaynak sohbet dağıtımı ve kanala özgü etkileşimli onay UX'i ekler.

Yerel onay kartları/düğmeleri kullanılabildiğinde, bu yerel UI ajana dönük birincil yoldur. Araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın kalan tek yol olduğunu söylemediği sürece ajan ayrıca yinelenen bir düz sohbet `/approve` komutu yansıtmamalıdır.

Yerel bir onay istemcisi yapılandırılmışsa ancak kaynak kanal için etkin bir yerel çalışma zamanı yoksa OpenClaw, yerel deterministik `/approve` istemini görünür tutar. Yerel çalışma zamanı etkinse ve teslim etmeyi dener ancak hiçbir hedef kartı almazsa OpenClaw, isteğin yine de çözülebilmesi için tam `/approve <id> <decision>` komutunu içeren aynı sohbet yedek bildirimini gönderir.

Genel model:

- host exec ilkesi, exec onayının gerekip gerekmediğine hâlâ karar verir
- `approvals.exec`, onay istemlerinin diğer sohbet hedeflerine iletilmesini denetler
- `channels.<channel>.execApprovals`, o kanalın yerel onay istemcisi olarak davranıp davranmayacağını denetler

Yerel onay istemcileri, bunların tümü doğru olduğunda DM öncelikli teslimi otomatik etkinleştirir:

- kanal yerel onay teslimini destekler
- onaylayıcılar açık `execApprovals.approvers` değerlerinden veya `commands.ownerAllowFrom` gibi sahip kimliğinden çözümlenebilir
- `channels.<channel>.execApprovals.enabled` ayarlanmamıştır veya `"auto"` değerindedir

Yerel onay istemcisini açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Onaylayıcılar çözümlendiğinde zorla etkinleştirmek için `enabled: true` ayarlayın. Genel kaynak sohbet teslimi `channels.<channel>.execApprovals.target` üzerinden açık olarak kalır.

SSS: [Sohbet onayları için neden iki exec onay yapılandırması var?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Bu yerel onay istemcileri, paylaşılan aynı sohbet `/approve` akışının ve paylaşılan onay düğmelerinin üzerine DM yönlendirmesi ve isteğe bağlı kanal dağıtımı ekler.

Paylaşılan davranış:

- Slack, Matrix, Microsoft Teams ve benzer teslim edilebilir sohbetler, aynı sohbet `/approve` için normal kanal kimlik doğrulama modelini kullanır
- yerel bir onay istemcisi otomatik etkinleştiğinde varsayılan yerel teslim hedefi onaylayıcı DM'leridir
- Discord ve Telegram için yalnızca çözümlenen onaylayıcılar onaylayabilir veya reddedebilir
- Discord onaylayıcıları açık olabilir (`execApprovals.approvers`) veya `commands.ownerAllowFrom` değerinden çıkarılabilir
- Telegram onaylayıcıları açık olabilir (`execApprovals.approvers`) veya `commands.ownerAllowFrom` değerinden çıkarılabilir
- Slack onaylayıcıları açık olabilir (`execApprovals.approvers`) veya `commands.ownerAllowFrom` değerinden çıkarılabilir
- Slack yerel düğmeleri onay kimliği türünü korur, böylece `plugin:` kimlikleri ikinci bir Slack-yerel yedek katman olmadan Plugin onaylarını çözümleyebilir
- Matrix yerel DM/kanal yönlendirmesi ve tepki kısayolları hem exec hem de Plugin onaylarını işler; Plugin yetkilendirmesi yine `channels.matrix.dm.allowFrom` değerinden gelir
- Matrix yerel istemleri, ilk istem etkinliğinde `com.openclaw.approval` özel etkinlik içeriğini içerir; böylece OpenClaw uyumlu Matrix istemcileri yapılandırılmış onay durumunu okuyabilirken standart istemciler düz metin `/approve` yedeğini korur
- istekte bulunan kişinin onaylayıcı olması gerekmez
- kaynak sohbet, komutları ve yanıtları zaten desteklediğinde doğrudan `/approve` ile onaylayabilir
- yerel Discord onay düğmeleri onay kimliği türüne göre yönlendirir: `plugin:` kimlikleri doğrudan Plugin onaylarına gider, diğer her şey exec onaylarına gider
- yerel Telegram onay düğmeleri `/approve` ile aynı sınırlı exec'ten Plugin'e yedek akışı izler
- yerel `target` kaynak sohbet teslimini etkinleştirdiğinde onay istemleri komut metnini içerir
- bekleyen exec onayları varsayılan olarak 30 dakika sonra sona erer
- hiçbir operatör UI'i veya yapılandırılmış onay istemcisi isteği kabul edemezse istem `askFallback` yedeğine düşer

`/diagnostics` ve `/export-trajectory` gibi hassas yalnızca sahip grup komutları, onay istemleri ve nihai sonuçlar için özel sahip yönlendirmesi kullanır. OpenClaw önce, sahibin komutu çalıştırdığı aynı yüzeyde özel bir rota dener. Bu yüzeyde özel sahip rotası yoksa `commands.ownerAllowFrom` içinden kullanılabilir ilk sahip rotasına geri döner; böylece bir Discord grup komutu, Telegram yapılandırılmış birincil özel arayüz olduğunda onayı ve sonucu yine de sahibin Telegram DM'ine gönderebilir. Grup sohbeti yalnızca kısa bir alındı bildirimi alır.

Telegram varsayılan olarak onaylayıcı DM'lerini kullanır (`target: "dm"`). Onay istemlerinin kaynak Telegram sohbetinde/konusunda da görünmesini istediğinizde `channel` veya `both` değerine geçebilirsiniz. Telegram forum konuları için OpenClaw, onay istemi ve onay sonrası takip iletisi için konuyu korur.

Bakın:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC akışı
__OC_I18N_900004__
Güvenlik notları:

- Unix soket modu `0600`, belirteç `exec-approvals.json` içinde saklanır.
- Aynı UID eş kontrolü.
- Sınama/yanıt (nonce + HMAC belirteci + istek karması) + kısa TTL.

## İlgili

- [Exec onayları](/tr/tools/exec-approvals) — çekirdek ilke ve onay akışı
- [Exec aracı](/tr/tools/exec)
- [Yükseltilmiş mod](/tr/tools/elevated)
- [Skills](/tr/tools/skills) — skill destekli otomatik izin davranışı
