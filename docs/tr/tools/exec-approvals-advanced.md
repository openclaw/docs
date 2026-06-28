---
read_when:
    - Güvenli binleri veya özel güvenli bin profillerini yapılandırma
    - Onayları Slack/Discord/Telegram veya diğer sohbet kanallarına yönlendirme
    - Bir kanal için yerel onay istemcisi uygulama
summary: 'Gelişmiş exec onayları: güvenli ikililer, yorumlayıcı bağlama, onay yönlendirme, yerel teslim'
title: Yürütme onayları — gelişmiş
x-i18n:
    generated_at: "2026-06-28T01:21:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d936e1a1567d204981eec7c3262cf11f2af8fc1ed6213182954c2324718a270
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Gelişmiş exec onayı konuları: `safeBins` hızlı yolu, yorumlayıcı/çalışma zamanı
bağlama ve sohbet kanallarına onay iletme (yerel iletim dahil).
Temel politika ve onay akışı için bkz. [Exec onayları](/tr/tools/exec-approvals).

## Güvenli ikililer (yalnızca stdin)

`tools.exec.safeBins`, açık izin listesi girdileri **olmadan** izin listesi
modunda çalışabilen küçük bir **yalnızca stdin** ikili listesini (örneğin `cut`)
tanımlar. Güvenli ikililer konumsal dosya argümanlarını ve yol benzeri tokenları
reddeder, bu yüzden yalnızca gelen akış üzerinde çalışabilirler. Bunu genel bir
güven listesi olarak değil, akış filtreleri için dar bir hızlı yol olarak ele
alın.

<Warning>
Yorumlayıcı veya çalışma zamanı ikililerini (örneğin `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) `safeBins` içine **eklemeyin**. Bir komut kod
değerlendirebiliyor, alt komut çalıştırabiliyor veya tasarımı gereği dosya
okuyabiliyorsa, açık izin listesi girdilerini tercih edin ve onay istemlerini
etkin tutun. Özel güvenli ikililer `tools.exec.safeBinProfiles.<bin>` içinde
açık bir profil tanımlamalıdır.
</Warning>

Varsayılan güvenli ikililer:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` ve `sort` varsayılan listede yoktur. Dahil etmeyi seçerseniz, stdin dışı
iş akışları için açık izin listesi girdilerini koruyun. Güvenli ikili modunda
`grep` için deseni `-e`/`--regexp` ile sağlayın; dosya operandlarının belirsiz
konumsallar olarak gizlice sokulamaması için konumsal desen biçimi reddedilir.

### Argv doğrulaması ve reddedilen bayraklar

Doğrulama yalnızca argv biçiminden deterministiktir (ana makine dosya sistemi
varlık denetimi yoktur); bu, izin/verme farklarından dosya varlığı oracle
davranışını engeller. Varsayılan güvenli ikililer için dosya odaklı seçenekler
reddedilir; uzun seçenekler kapalı başarısız olacak şekilde doğrulanır
(bilinmeyen bayraklar ve belirsiz kısaltmalar reddedilir).

Güvenli ikili profiline göre reddedilen bayraklar:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Güvenli ikililer ayrıca, stdin’e özel segmentler için argv tokenlarının yürütme
zamanında **değişmez metin** olarak ele alınmasını zorunlu kılar (globbing yok
ve `$VARS` genişletmesi yok); böylece `*` veya `$HOME/...` gibi desenler dosya
okumalarını gizlice sokmak için kullanılamaz.

### Güvenilen ikili dizinleri

Güvenli ikililer güvenilen ikili dizinlerinden çözümlenmelidir (sistem
varsayılanları artı isteğe bağlı `tools.exec.safeBinTrustedDirs`). `PATH`
girdilerine hiçbir zaman otomatik olarak güvenilmez. Varsayılan güvenilen
dizinler kasıtlı olarak minimaldir: `/bin`, `/usr/bin`. Güvenli ikili
yürütülebiliriniz paket yöneticisi/kullanıcı yollarında bulunuyorsa (örneğin
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), bunları
açıkça `tools.exec.safeBinTrustedDirs` içine ekleyin.

### Kabuk zincirleme, sarmalayıcılar ve çoklayıcılar

Kabuk zincirleme (`&&`, `||`, `;`), her üst düzey segment izin listesini
karşıladığında (güvenli ikililer veya skill otomatik izni dahil) izinlidir.
Yönlendirmeler izin listesi modunda desteklenmemeye devam eder. Komut ikamesi
(`$()` / ters tırnaklar), çift tırnakların içinde olsa bile izin listesi
ayrıştırması sırasında reddedilir; değişmez `$()` metnine ihtiyacınız varsa tek
tırnak kullanın.

macOS yardımcı uygulama onaylarında, kabuk denetimi veya genişletme söz dizimi
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) içeren ham kabuk metni,
kabuk ikilisinin kendisi izin listesine alınmadıkça izin listesi eşleşmesi
yokmuş gibi ele alınır.

Kabuk sarmalayıcıları (`bash|sh|zsh ... -c/-lc`) için istek kapsamlı ortam
geçersiz kılmaları küçük ve açık bir izin listesine indirgenir (`TERM`, `LANG`,
`LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

İzin listesi modundaki `allow-always` kararları için bilinen dağıtım
sarmalayıcıları (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`),
sarmalayıcı yolu yerine içteki yürütülebilir yolu kalıcılaştırır. Kabuk
çoklayıcıları (`busybox`, `toybox`) kabuk applet’leri (`sh`, `ash` vb.) için
aynı şekilde açılır. Bir sarmalayıcı veya çoklayıcı güvenle açılamazsa, otomatik
olarak hiçbir izin listesi girdisi kalıcılaştırılmaz.

`python3` veya `node` gibi yorumlayıcıları izin listesine alırsanız, satır içi
eval’in yine de açık onay gerektirmesi için `tools.exec.strictInlineEval=true`
tercih edin. Katı modda `allow-always`, zararsız yorumlayıcı/betik çağrılarını
yine de kalıcılaştırabilir, ancak satır içi eval taşıyıcıları otomatik olarak
kalıcılaştırılmaz.

### Güvenli ikililer ve izin listesi

| Konu             | `tools.exec.safeBins`                                  | İzin listesi (`exec-approvals.json`)                                               |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Amaç             | Dar stdin filtrelerine otomatik izin ver               | Belirli yürütülebilirlere açıkça güven                                             |
| Eşleşme türü     | Yürütülebilir adı + güvenli ikili argv politikası      | Çözümlenmiş yürütülebilir yol glob’u veya PATH ile çağrılan komutlar için yalın komut adı glob’u |
| Argüman kapsamı  | Güvenli ikili profili ve değişmez-token kurallarıyla sınırlı | Varsayılan olarak yol eşleşmesi; isteğe bağlı `argPattern` ayrıştırılmış argv’yi sınırlayabilir |
| Tipik örnekler   | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, özel CLI’ler                                    |
| En iyi kullanım  | İş hatlarında düşük riskli metin dönüşümleri           | Daha geniş davranışı veya yan etkileri olan herhangi bir araç                      |

Yapılandırma konumu:

- `safeBins` yapılandırmadan gelir (`tools.exec.safeBins` veya ajan başına `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` yapılandırmadan gelir (`tools.exec.safeBinTrustedDirs` veya ajan başına `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` yapılandırmadan gelir (`tools.exec.safeBinProfiles` veya ajan başına `agents.list[].tools.exec.safeBinProfiles`). Ajan başına profil anahtarları global anahtarları geçersiz kılar.
- izin listesi girdileri ana makineye yerel onay dosyasında `agents.<id>.allowlist` altında (veya Control UI / `openclaw approvals allowlist ...` üzerinden) bulunur.
- `openclaw security audit`, yorumlayıcı/çalışma zamanı ikilileri açık profiller olmadan `safeBins` içinde göründüğünde `tools.exec.safe_bins_interpreter_unprofiled` ile uyarır.
- `openclaw doctor --fix`, eksik özel `safeBinProfiles.<bin>` girdilerini `{}` olarak iskeleleyebilir (sonrasında gözden geçirip sıkılaştırın). Yorumlayıcı/çalışma zamanı ikilileri otomatik olarak iskelelenmez.

Özel profil örneği:
__OC_I18N_900000__
`jq`’yu açıkça `safeBins` içine dahil ederseniz, OpenClaw güvenli ikili modunda `env`
builtin’ini yine de reddeder; böylece `jq -n env`, açık bir izin listesi yolu veya onay
istemi olmadan ana makine süreç ortamını dökemez.

## Yorumlayıcı/çalışma zamanı komutları

Onay destekli yorumlayıcı/çalışma zamanı çalıştırmaları kasıtlı olarak muhafazakardır:

- Tam argv/cwd/env bağlamı her zaman bağlanır.
- Doğrudan kabuk betiği ve doğrudan çalışma zamanı dosyası biçimleri en iyi çabayla tek bir somut yerel
  dosya anlık görüntüsüne bağlanır.
- Yine de tek bir doğrudan yerel dosyaya çözümlenen yaygın paket yöneticisi sarmalayıcı biçimleri (örneğin
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) bağlamadan önce açılır.
- OpenClaw bir yorumlayıcı/çalışma zamanı komutu için tam olarak bir somut yerel dosya belirleyemezse
  (örneğin paket betikleri, eval biçimleri, çalışma zamanına özgü yükleyici zincirleri veya belirsiz çoklu dosya
  biçimleri), onay destekli yürütme kapsamadığı anlamsal kapsamı iddia etmek yerine reddedilir.
- Bu iş akışları için sandboxing, ayrı bir ana makine sınırı veya operatörün daha geniş çalışma zamanı semantiğini
  kabul ettiği açıkça güvenilen bir izin listesi/tam iş akışı tercih edin.

Onay gerektiğinde exec aracı hemen bir onay id’siyle döner. Daha sonra onaylanan çalıştırma sistem
olaylarını (`Exec finished` ve yapılandırıldığında `Exec running`) ilişkilendirmek için bu id’yi kullanın.
Zaman aşımından önce karar gelmezse istek onay zaman aşımı olarak ele alınır ve terminal ana makine komutu
reddi olarak gösterilir. Kaynak oturumu olan ana ajan async onayları için OpenClaw, komutun çalışmadığını
ajanın gözlemlemesi ve daha sonra eksik sonucu onarmaya çalışmaması için o oturumu dahili bir takip ile de sürdürür.

### Takip iletimi davranışı

Onaylanan async exec bittikten sonra OpenClaw aynı oturuma bir takip `agent` turu gönderir.
Reddedilen async onayları ret durumu için aynı ana oturum takip yolunu kullanır, ancak yükseltilmiş
çalışma zamanı devirleri kaydetmez ve komutu çalıştırmaz. Sürdürülebilir ana oturumu olmayan retler
ya bastırılır ya da mevcut olduğunda güvenli bir doğrudan rota üzerinden raporlanır.

- Geçerli bir harici iletim hedefi varsa (iletilebilir kanal artı hedef `to`), takip iletimi o kanalı kullanır.
- Yalnızca webchat veya harici hedefi olmayan dahili oturum akışlarında takip iletimi yalnızca oturumda kalır (`deliver: false`).
- Bir çağıran çözümlenebilir harici kanal olmadan açıkça katı harici iletim isterse istek `INVALID_REQUEST` ile başarısız olur.
- `bestEffortDeliver` etkinse ve harici kanal çözümlenemiyorsa, iletim başarısız olmak yerine yalnızca oturuma düşürülür.

## Onayları sohbet kanallarına iletme

Exec onay istemlerini herhangi bir sohbet kanalına (Plugin kanalları dahil) iletebilir ve
bunları `/approve` ile onaylayabilirsiniz. Bu, normal giden iletim işlem hattını kullanır.

Yapılandırma:
__OC_I18N_900001__
Sohbette yanıtlayın:
__OC_I18N_900002__
`/approve` komutu hem exec onaylarını hem de Plugin onaylarını işler. ID bekleyen bir exec onayıyla eşleşmezse, otomatik olarak Plugin onaylarını denetler.

### Plugin onayı iletme

Plugin onayı iletme, exec onaylarıyla aynı iletim işlem hattını kullanır ancak `approvals.plugin`
altında kendi bağımsız yapılandırmasına sahiptir. Birini etkinleştirmek veya devre dışı bırakmak
diğerini etkilemez. Plugin yazma davranışı, istek alanları ve karar semantiği için bkz.
[Plugin izin istekleri](/plugins/plugin-permission-requests).
__OC_I18N_900003__
Yapılandırma şekli `approvals.exec` ile aynıdır: `enabled`, `mode`, `agentFilter`,
`sessionFilter` ve `targets` aynı şekilde çalışır.

Paylaşılan etkileşimli yanıtları destekleyen kanallar hem exec hem de Plugin onayları için aynı
onay düğmelerini işler. Paylaşılan etkileşimli UI olmayan kanallar, `/approve` yönergeleriyle
düz metne geri döner.
Plugin onay istekleri kullanılabilir kararları sınırlayabilir. Onay yüzeyleri isteğin beyan ettiği
karar kümesini kullanır ve Gateway sunulmamış bir kararı gönderme girişimlerini reddeder.

### Herhangi bir kanalda aynı sohbet onayları

Bir exec veya Plugin onay isteği iletilebilir bir sohbet yüzeyinden kaynaklandığında, aynı sohbet
artık varsayılan olarak `/approve` ile bunu onaylayabilir. Bu, mevcut Web UI ve terminal UI akışlarına
ek olarak Slack, Matrix ve Microsoft Teams gibi kanallar için geçerlidir.

Bu paylaşılan metin-komut yolu, ilgili konuşma için normal kanal kimlik doğrulama modelini kullanır. Kaynak sohbet zaten komut gönderebiliyor ve yanıt alabiliyorsa, onay isteklerinin beklemede kalmak için artık ayrı bir yerel teslim adaptörüne ihtiyacı yoktur.

Discord ve Telegram aynı sohbet içinde `/approve` komutunu da destekler, ancak bu kanallar yerel onay teslimi devre dışı olduğunda bile yetkilendirme için çözümlenmiş onaylayan listesini kullanmaya devam eder.

Gateway’i doğrudan çağıran Telegram ve diğer yerel onay istemcileri için bu geri dönüş, kasıtlı olarak "onay bulunamadı" hatalarıyla sınırlandırılmıştır. Gerçek bir exec onay reddi/hatası sessizce Plugin onayı olarak yeniden denenmez.

### Yerel onay teslimi

Bazı kanallar yerel onay istemcileri olarak da davranabilir. Yerel istemciler, paylaşılan aynı sohbet `/approve` akışının üzerine onaylayan DM’leri, kaynak sohbet yayılımını ve kanala özgü etkileşimli onay kullanıcı deneyimini ekler.

Yerel onay kartları/düğmeleri kullanılabilir olduğunda, bu yerel kullanıcı arayüzü birincil agent’a dönük yoldur. Araç sonucu sohbet onaylarının kullanılamadığını veya el ile onayın kalan tek yol olduğunu söylemedikçe agent ayrıca yinelenen bir düz sohbet `/approve` komutunu da yankılamamalıdır.

Yerel bir onay istemcisi yapılandırılmış ancak kaynak kanal için etkin bir yerel çalışma zamanı yoksa, OpenClaw yerel deterministik `/approve` istemini görünür tutar. Yerel çalışma zamanı etkinse ve teslimi dener ancak hiçbir hedef kartı almazsa, OpenClaw isteğin yine de çözülebilmesi için tam `/approve <id> <decision>` komutuyla aynı sohbet geri dönüş bildirimi gönderir.

Genel model:

- host exec ilkesi, exec onayının gerekip gerekmediğine hâlâ karar verir
- `approvals.exec`, onay istemlerinin diğer sohbet hedeflerine iletilmesini denetler
- `channels.<channel>.execApprovals`, Discord, Slack, Telegram ve benzeri kanala özgü yerel istemcilerin etkin olup olmadığını denetler
- Slack Plugin onayları, istek Slack’ten geldiğinde ve Slack Plugin onaylayanları çözümlendiğinde Slack’in yerel onay istemcisini kullanabilir; `approvals.plugin`, Slack exec onayları devre dışı olsa bile Plugin onaylarını Slack oturumlarına veya hedeflerine yönlendirebilir
- Google Chat yerel onay kartları, kararlı `users/<id>` onaylayanları `dm.allowFrom` veya `defaultTo` üzerinden çözümlendiğinde Google Chat alanlarından ya da iş parçacıklarından kaynaklanan exec ve Plugin onaylarını işler; kararlar için tepki olaylarını kullanmazlar
- WhatsApp ve Signal tepki onayı teslimi `approvals.exec` ve `approvals.plugin` ile sınırlanır; `channels.<channel>.execApprovals` blokları yoktur

Yerel onay istemcileri, aşağıdakilerin tümü doğru olduğunda DM öncelikli teslimi otomatik etkinleştirir:

- kanal yerel onay teslimini destekler
- onaylayanlar açık `execApprovals.approvers` veya `commands.ownerAllowFrom` gibi sahip kimliği üzerinden çözümlenebilir
- `channels.<channel>.execApprovals.enabled` ayarlanmamıştır veya `"auto"` değerindedir

Bir yerel onay istemcisini açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Onaylayanlar çözümlendiğinde zorla açmak için `enabled: true` ayarlayın. Genel kaynak sohbet teslimi `channels.<channel>.execApprovals.target` üzerinden açık kalır.

SSS: [Sohbet onayları için neden iki exec onay yapılandırması var?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- Google Chat: kararlı onaylayanları `channels.googlechat.dm.allowFrom` veya `channels.googlechat.defaultTo` ile yapılandırın; `execApprovals` bloğu gerekmez
- WhatsApp: onay istemlerini WhatsApp’a yönlendirmek için `approvals.exec` ve `approvals.plugin` kullanın
- Signal: onay istemlerini Signal’e yönlendirmek için `approvals.exec` ve `approvals.plugin` kullanın

Bu yerel onay istemcileri, paylaşılan aynı sohbet `/approve` akışı ve paylaşılan onay düğmelerinin üzerine DM yönlendirme ve isteğe bağlı kanal yayılımı ekler.

Paylaşılan davranış:

- Slack, Matrix, Microsoft Teams ve benzeri teslim edilebilir sohbetler, aynı sohbet `/approve` için normal kanal kimlik doğrulama modelini kullanır
- bir yerel onay istemcisi otomatik etkinleştiğinde, varsayılan yerel teslim hedefi onaylayan DM’leridir
- Discord ve Telegram için yalnızca çözümlenmiş onaylayanlar onaylayabilir veya reddedebilir
- Discord onaylayanları açık (`execApprovals.approvers`) olabilir veya `commands.ownerAllowFrom` üzerinden çıkarılabilir
- Telegram onaylayanları açık (`execApprovals.approvers`) olabilir veya `commands.ownerAllowFrom` üzerinden çıkarılabilir
- Slack onaylayanları açık (`execApprovals.approvers`) olabilir veya `commands.ownerAllowFrom` üzerinden çıkarılabilir
- Slack Plugin onay DM’leri, Slack exec onaylayanlarını değil, `allowFrom` ve hesap varsayılan yönlendirmesinden gelen Slack Plugin onaylayanlarını kullanır
- Slack yerel düğmeleri onay kimliği türünü korur, böylece `plugin:` kimlikleri ikinci bir Slack’e yerel geri dönüş katmanı olmadan Plugin onaylarını çözebilir
- Google Chat yerel kartları, ileti metninde el ile `/approve` geri dönüşünü korur ancak kart düğmesi geri çağırmaları yalnızca opak eylem belirteçleri taşır; onay kimliği ve karar sunucu tarafındaki bekleyen durumdan kurtarılır
- WhatsApp emoji onayları, hem exec hem de Plugin istemlerini yalnızca eşleşen üst düzey iletme ailesi etkinleştirildiğinde ve WhatsApp’a yönlendirdiğinde işler; yalnızca hedefe yönelik WhatsApp iletimi, aynı yerel kaynak hedefle eşleşmediği sürece paylaşılan iletme yolunda kalır
- Signal tepki onayları, hem exec hem de Plugin istemlerini yalnızca eşleşen üst düzey iletme ailesi etkinleştirildiğinde ve Signal’e yönlendirdiğinde işler. Doğrudan aynı sohbet Signal exec onayları, açık onaylayanlar olmadan yerel `/approve` geri dönüşünü bastırabilir; Signal tepki çözümlemesi yine de `channels.signal.allowFrom` veya `defaultTo` içinden açık Signal onaylayanları gerektirir.
- Matrix yerel DM/kanal yönlendirmesi ve tepki kısayolları hem exec hem de Plugin onaylarını işler; Plugin yetkilendirmesi yine de `channels.matrix.dm.allowFrom` içinden gelir
- Matrix yerel istemleri, OpenClaw uyumlu Matrix istemcilerinin yapılandırılmış onay durumunu okuyabilmesi ve standart istemcilerin düz metin `/approve` geri dönüşünü koruması için ilk istem olayında `com.openclaw.approval` özel olay içeriğini içerir
- isteği yapan kişinin onaylayan olması gerekmez
- kaynak sohbet, o sohbet zaten komutları ve yanıtları destekliyorsa doğrudan `/approve` ile onaylayabilir
- yerel Discord onay düğmeleri onay kimliği türüne göre yönlendirir: `plugin:` kimlikleri doğrudan Plugin onaylarına gider, diğer her şey exec onaylarına gider
- yerel Telegram onay düğmeleri `/approve` ile aynı sınırlandırılmış exec’ten Plugin’e geri dönüşü izler
- yerel `target` kaynak sohbet teslimini etkinleştirdiğinde, onay istemleri komut metnini içerir
- bekleyen exec onayları varsayılan olarak 30 dakika sonra sona erer
- hiçbir operatör kullanıcı arayüzü veya yapılandırılmış onay istemcisi isteği kabul edemiyorsa, istem `askFallback` değerine geri döner

`/diagnostics` ve `/export-trajectory` gibi hassas, yalnızca sahip komutları, onay istemleri ve nihai sonuçlar için özel sahip yönlendirmesi kullanır. OpenClaw önce sahibin komutu çalıştırdığı aynı yüzeyde özel bir rota dener. Bu yüzeyde özel sahip rotası yoksa, `commands.ownerAllowFrom` içinden ilk kullanılabilir sahip rotasına geri döner; böylece bir Discord grup komutu, Telegram yapılandırılmış birincil özel arayüz olduğunda onayı ve sonucu yine de sahibin Telegram DM’ine gönderebilir. Grup sohbeti yalnızca kısa bir alındı bildirimi alır.

Telegram varsayılan olarak onaylayan DM’lerini (`target: "dm"`) kullanır. Onay istemlerinin kaynak Telegram sohbetinde/konusunda da görünmesini istediğinizde `channel` veya `both` değerine geçebilirsiniz. Telegram forum konuları için OpenClaw, onay istemi ve onay sonrası takip iletisi için konuyu korur.

Bkz.:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC akışı
__OC_I18N_900004__
Güvenlik notları:

- Unix soket modu `0600`, belirteç `exec-approvals.json` içinde saklanır.
- Aynı UID eş denetimi.
- Sınama/yanıt (nonce + HMAC token + istek karması) + kısa TTL.

## SSS

### Bir onay hedefinde `accountId` ve `threadId` ne zaman kullanılır?

Kanalda birden fazla yapılandırılmış kimlik olduğunda ve onay isteminin belirli bir hesap üzerinden çıkması gerektiğinde `accountId` kullanın. Hedef konuları veya iş parçacıklarını desteklediğinde ve istemin üst düzey sohbet yerine o iş parçacığının içinde kalması gerektiğinde `threadId` kullanın.

Somut bir Telegram örneği, forum konuları ve iki Telegram bot hesabı olan bir operasyon süper grubudur. `to` değeri süper grubu adlandırır, `accountId` bot hesabını seçer ve `threadId` forum konusunu seçer:
__OC_I18N_900005__
Bu kurulumla, iletilen exec onayları `ops-bot` Telegram hesabı tarafından `-1001234567890` sohbetinin `77` konusuna gönderilir. `accountId` olmayan bir hedef kanalın varsayılan hesabını kullanır ve `threadId` olmayan bir hedef üst düzey hedefe gönderir.

### Onaylar bir oturuma gönderildiğinde, o oturumdaki herkes onları onaylayabilir mi?

Hayır. Oturum teslimi yalnızca istemin nerede görüneceğini denetler. Tek başına o sohbetteki her katılımcıya onaylama yetkisi vermez.

Genel aynı sohbet `/approve` için gönderenin o kanal oturumunda komutlar için zaten yetkili olması gerekir. Kanal açık onay onaylayanları sunuyorsa, bu onaylayanlar o oturumda aksi halde komut yetkisine sahip olmasalar bile `/approve` eylemini yetkilendirebilir.

Bazı kanallar daha katıdır. Discord, Telegram, Matrix, Slack yerel onay DM’leri ve benzeri yerel onay istemcileri, onay yetkilendirmesi için çözümlenmiş onaylayan listelerini kullanır. Örneğin, bir Telegram forum konusu onay istemi konudaki herkes tarafından görülebilir, ancak yalnızca `channels.telegram.execApprovals.approvers` veya `commands.ownerAllowFrom` üzerinden çözümlenen sayısal Telegram kullanıcı kimlikleri onu onaylayabilir ya da reddedebilir.

## İlgili

- [Exec onayları](/tr/tools/exec-approvals) — temel ilke ve onay akışı
- [Exec aracı](/tr/tools/exec)
- [Yükseltilmiş mod](/tr/tools/elevated)
- [Skills](/tr/tools/skills) — skill destekli otomatik izin verme davranışı
