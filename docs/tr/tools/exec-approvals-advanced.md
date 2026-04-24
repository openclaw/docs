---
read_when:
    - Güvenli ikili dosyaları veya özel güvenli ikili dosya profillerini yapılandırma
    - Onayları Slack/Discord/Telegram veya diğer sohbet kanallarına iletme
    - Bir kanal için yerel onay istemcisi uygulama
summary: 'Gelişmiş exec onayları: güvenli ikili dosyalar, yorumlayıcı bağlama, onay iletimi, yerel teslim'
title: Exec onayları — gelişmiş
x-i18n:
    generated_at: "2026-04-24T09:34:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7834a8ebfb623b38e4c2676f0e24285d5b44e2dce45c55a33db842d1bbf81be
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

Gelişmiş exec-onay konuları: `safeBins` hızlı yolu, yorumlayıcı/çalışma zamanı
bağlama ve onayların sohbet kanallarına iletilmesi (yerel teslim dâhil).
Çekirdek ilke ve onay akışı için bkz. [Exec onayları](/tr/tools/exec-approvals).

## Güvenli ikili dosyalar (`safeBins`) (yalnızca stdin)

`tools.exec.safeBins`, açık allowlist
girdileri olmadan allowlist modunda çalışabilen küçük bir **yalnızca stdin** ikili dosya listesi tanımlar (örneğin `cut`).
Güvenli ikili dosyalar konumsal dosya argümanlarını ve yol benzeri token'ları reddeder; bu nedenle
yalnızca gelen akış üzerinde çalışabilirler. Bunu genel bir güven listesi değil,
akış filtreleri için dar bir hızlı yol olarak değerlendirin.

<Warning>
`python3`, `node`,
`ruby`, `bash`, `sh`, `zsh` gibi yorumlayıcı veya çalışma zamanı ikili dosyalarını `safeBins` içine **EKLEMEYİN**.
Bir komut tasarım gereği kod değerlendirebiliyor,
alt komut çalıştırabiliyor veya dosya okuyabiliyorsa açık allowlist girdilerini tercih edin
ve onay istemlerini etkin tutun. Özel güvenli ikili dosyalar `tools.exec.safeBinProfiles.<bin>` içinde açık bir profil tanımlamalıdır.
</Warning>

Varsayılan güvenli ikili dosyalar:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` ve `sort` varsayılan listede değildir. İsteğe bağlı olarak etkinleştirirseniz,
stdin dışı iş akışları için açık allowlist girdilerini koruyun. `grep` için güvenli ikili dosya modunda,
deseni `-e`/`--regexp` ile verin; konumsal desen biçimi reddedilir,
böylece dosya operandları belirsiz konumsallar olarak gizlenemez.

### Argv doğrulaması ve reddedilen bayraklar

Doğrulama yalnızca argv şekline göre deterministiktir (ana makine dosya sistemi varlık denetimi yoktur),
bu da izin/verme farklarından kaynaklanan dosya varlığı oracle davranışını önler.
Dosya odaklı seçenekler varsayılan güvenli ikili dosyalar için reddedilir; uzun
seçenekler kapalı şekilde doğrulanır (bilinmeyen bayraklar ve belirsiz kısaltmalar
reddedilir).

Güvenli ikili dosya profiline göre reddedilen bayraklar:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Güvenli ikili dosyalar ayrıca yürütme zamanında argv token'larının **düz metin** olarak ele alınmasını zorunlu kılar
(stdin-only segment'ler için globbing ve `$VARS` genişletmesi yoktur); böylece
`*` veya `$HOME/...` gibi desenler dosya okumalarını gizlemek için kullanılamaz.

### Güvenilir ikili dosya dizinleri

Güvenli ikili dosyalar güvenilir ikili dosya dizinlerinden çözülmelidir (sistem varsayılanları ve
isteğe bağlı `tools.exec.safeBinTrustedDirs`). `PATH` girdilerine asla otomatik güven verilmez.
Varsayılan güvenilir dizinler bilerek minimal tutulmuştur: `/bin`, `/usr/bin`. Eğer
güvenli ikili dosya yürütülebiliriniz paket yöneticisi/kullanıcı yollarında yaşıyorsa (örneğin
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), bunları
`tools.exec.safeBinTrustedDirs` içine açıkça ekleyin.

### Shell zincirleme, wrapper'lar ve multiplexer'lar

Her üst düzey segment allowlist'i sağladığı sürece
(shell zincirleme `&&`, `||`, `;`) izin verilir (güvenli ikili dosyalar veya skill auto-allow dâhil).
Allowlist modunda yönlendirmeler desteklenmez. Komut ikamesi (`$()` / backticks)
allowlist ayrıştırması sırasında reddedilir; çift tırnak içinde olsa bile.
`$()` metnini düz olarak istiyorsanız tek tırnak kullanın.

macOS yardımcı uygulama onaylarında shell denetim veya
genişletme söz dizimi (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) içeren ham shell metni,
shell ikili dosyasının kendisi allowlist içinde değilse allowlist kaçırması olarak değerlendirilir.

Shell wrapper'ları için (`bash|sh|zsh ... -c/-lc`), istek kapsamlı env geçersiz kılmaları
küçük ve açık bir allowlist'e indirgenir (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Allowlist modunda `allow-always` kararlarında bilinen dispatch wrapper'ları (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) wrapper yolu yerine içteki yürütülebilir yolu kalıcılaştırır.
Shell multiplexer'ları (`busybox`, `toybox`) shell applet'leri için (`sh`, `ash`, vb.) aynı şekilde açılır.
Bir wrapper veya multiplexer güvenli biçimde açılamıyorsa, otomatik olarak hiçbir allowlist girdisi kalıcılaştırılmaz.

`python3` veya `node` gibi yorumlayıcıları allowlist'e alıyorsanız,
satır içi değerlendirmenin yine açık onay gerektirmesi için `tools.exec.strictInlineEval=true`
tercih edin. Katı modda `allow-always`, zararsız
yorumlayıcı/betik çağrılarını yine de kalıcılaştırabilir; ancak satır içi eval taşıyıcıları otomatik olarak kalıcılaştırılmaz.

### Güvenli ikili dosyalar ve allowlist karşılaştırması

| Konu             | `tools.exec.safeBins`                                 | Allowlist (`exec-approvals.json`)                           |
| ---------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| Amaç             | Dar stdin filtrelerine otomatik izin verme            | Belirli yürütülebilirlere açıkça güvenme                    |
| Eşleşme türü     | Yürütülebilir adı + güvenli ikili dosya argv ilkesi   | Çözümlenmiş yürütülebilir yol glob deseni                   |
| Argüman kapsamı  | Güvenli ikili dosya profili ve düz-token kurallarıyla sınırlandırılır | Yalnızca yol eşleşmesi; argümanlar aksi hâlde sizin sorumluluğunuzdadır |
| Tipik örnekler   | `head`, `tail`, `tr`, `wc`                            | `jq`, `python3`, `node`, `ffmpeg`, özel CLI'ler             |
| En iyi kullanım  | Pipeline'larda düşük riskli metin dönüşümleri         | Daha geniş davranış veya yan etkileri olan her araç         |

Yapılandırma konumu:

- `safeBins`, yapılandırmadan gelir (`tools.exec.safeBins` veya agent başına `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs`, yapılandırmadan gelir (`tools.exec.safeBinTrustedDirs` veya agent başına `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles`, yapılandırmadan gelir (`tools.exec.safeBinProfiles` veya agent başına `agents.list[].tools.exec.safeBinProfiles`). Agent başına profil anahtarları genel anahtarları geçersiz kılar.
- allowlist girdileri, ana makinedeki yerel `~/.openclaw/exec-approvals.json` içinde `agents.<id>.allowlist` altında bulunur (veya Control UI / `openclaw approvals allowlist ...` üzerinden).
- `openclaw security audit`, yorumlayıcı/çalışma zamanı ikili dosyaları açık profiller olmadan `safeBins` içinde göründüğünde `tools.exec.safe_bins_interpreter_unprofiled` uyarısı verir.
- `openclaw doctor --fix`, eksik özel `safeBinProfiles.<bin>` girdilerini `{}` olarak iskeletleyebilir (sonrasında gözden geçirip sıkılaştırın). Yorumlayıcı/çalışma zamanı ikili dosyaları otomatik iskeletlenmez.

Özel profil örneği:
__OC_I18N_900000__
`jq`'yu açıkça `safeBins` içine alsanız bile, OpenClaw güvenli ikili dosya modunda `env` yerleşik komutunu yine reddeder;
böylece `jq -n env`, açık bir allowlist yolu
veya onay istemi olmadan ana makine işlem ortamını dökemez.

## Yorumlayıcı/çalışma zamanı komutları

Onay destekli yorumlayıcı/çalışma zamanı çalıştırmaları bilerek muhafazakârdır:

- Kesin argv/cwd/env bağlamı her zaman bağlanır.
- Doğrudan shell betiği ve doğrudan çalışma zamanı dosya biçimleri, en iyi çabayla tek bir somut yerel
  dosya anlık görüntüsüne bağlanır.
- Hâlâ tek bir doğrudan yerel dosyaya çözümlenen yaygın paket yöneticisi wrapper biçimleri (örneğin
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) bağlamadan önce açılır.
- OpenClaw bir yorumlayıcı/çalışma zamanı komutu için tam olarak bir somut yerel dosya belirleyemezse
  (örneğin paket betikleri, eval biçimleri, çalışma zamanına özgü yükleyici zincirleri veya belirsiz çok dosyalı
  biçimler), onay destekli yürütme semantik kapsama iddia etmek yerine reddedilir.
- Bu iş akışları için sandboxing, ayrı bir ana makine sınırı veya operatörün daha geniş çalışma zamanı semantiklerini kabul ettiği açık güvenilen
  allowlist/full iş akışını tercih edin.

Onay gerektiğinde exec aracı hemen bir onay kimliğiyle döner. Bu kimliği
daha sonraki sistem olaylarıyla (`Exec finished` / `Exec denied`) ilişkilendirmek için kullanın. Zaman aşımından önce karar gelmezse,
istek onay zaman aşımı olarak değerlendirilir ve ret nedeni olarak gösterilir.

### Takip teslim davranışı

Onaylanmış async exec tamamlandıktan sonra OpenClaw aynı oturuma bir takip `agent` turu gönderir.

- Geçerli bir harici teslim hedefi varsa (teslim edilebilir kanal artı hedef `to`), takip teslimi bu kanalı kullanır.
- Webchat-only veya harici hedef olmayan iç oturum akışlarında takip teslimi yalnızca oturum içinde kalır (`deliver: false`).
- Bir çağıran taraf çözümlenebilir harici kanal olmadan açıkça katı harici teslim isterse istek `INVALID_REQUEST` ile başarısız olur.
- `bestEffortDeliver` etkinse ve hiçbir harici kanal çözümlenemiyorsa teslim başarısız olmak yerine yalnızca oturum içi moda düşürülür.

## Onayları sohbet kanallarına iletme

Exec onay istemlerini herhangi bir sohbet kanalına (Plugin kanalları dâhil) iletebilir ve
bunları `/approve` ile onaylayabilirsiniz. Bu, normal giden teslim işlem hattını kullanır.

Yapılandırma:
__OC_I18N_900001__
Sohbette yanıt verin:
__OC_I18N_900002__
`/approve` komutu hem exec onaylarını hem de Plugin onaylarını işler. Kimlik bekleyen bir exec onayıyla eşleşmezse,
otomatik olarak Plugin onaylarını da denetler.

### Plugin onay iletimi

Plugin onay iletimi, exec onaylarıyla aynı teslim işlem hattını kullanır ama
`approvals.plugin` altında kendi bağımsız yapılandırmasına sahiptir. Birini etkinleştirmek veya devre dışı bırakmak diğerini etkilemez.
__OC_I18N_900003__
Yapılandırma şekli `approvals.exec` ile aynıdır: `enabled`, `mode`, `agentFilter`,
`sessionFilter` ve `targets` aynı şekilde çalışır.

Paylaşılan etkileşimli yanıtları destekleyen kanallar, hem exec hem de
Plugin onayları için aynı onay düğmelerini işler. Paylaşılan etkileşimli UI olmayan kanallar,
`/approve` talimatları içeren düz metne geri döner.

### Herhangi bir kanalda aynı sohbetten onaylar

Bir exec veya Plugin onay isteği teslim edilebilir bir sohbet yüzeyinden geldiğinde, aynı sohbet
şimdi varsayılan olarak `/approve` ile onu onaylayabilir. Bu, mevcut Web UI ve TUI akışlarına ek olarak
Slack, Matrix ve Microsoft Teams gibi kanallar için de geçerlidir.

Bu paylaşılan metin-komut yolu, o konuşma için normal kanal kimlik doğrulama modelini kullanır. Kaynak sohbet
zaten komut gönderip yanıt alabiliyorsa, onay isteklerinin beklemede kalması için artık
ayrı bir yerel teslim uyarlayıcısına gerek yoktur.

Discord ve Telegram da aynı sohbetten `/approve` desteği sunar; ancak bu kanallar,
yerel onay teslimi devre dışı olsa bile yetkilendirme için yine çözümlenmiş
onaylayıcı listelerini kullanır.

Gateway'i doğrudan çağıran Telegram ve diğer yerel onay istemcileri için,
bu geri dönüş kasıtlı olarak yalnızca “approval not found” hatalarıyla sınırlıdır. Gerçek bir
exec onay reddi/hatası sessizce Plugin onayı olarak yeniden denenmez.

### Yerel onay teslimi

Bazı kanallar aynı zamanda yerel onay istemcileri gibi de davranabilir. Yerel istemciler, paylaşılan aynı-sohbet `/approve`
akışının üstüne onaylayıcı DM'leri, kaynak sohbet fanout'u ve kanala özgü etkileşimli onay kullanıcı deneyimi ekler.

Yerel onay kartları/düğmeleri kullanılabildiğinde, bu yerel UI agent'a dönük birincil
yoldur. Araç sonucu sohbet onaylarının kullanılamadığını veya
manuel onayın kalan tek yol olduğunu söylemedikçe agent ayrıca yinelenen düz sohbet
`/approve` komutu yankılamamalıdır.

Genel model:

- exec onayı gerekip gerekmediğine hâlâ ana makine exec ilkesi karar verir
- `approvals.exec`, onay istemlerinin diğer sohbet hedeflerine iletilmesini denetler
- `channels.<channel>.execApprovals`, o kanalın yerel onay istemcisi gibi davranıp davranmayacağını denetler

Yerel onay istemcileri şu koşulların tümü doğruysa otomatik olarak önce-DM teslimini etkinleştirir:

- kanal yerel onay teslimini destekliyorsa
- onaylayıcılar açık `execApprovals.approvers` veya o
  kanalın belgelenmiş geri dönüş kaynaklarından çözümlenebiliyorsa
- `channels.<channel>.execApprovals.enabled` ayarlanmamışsa veya `"auto"` ise

Yerel onay istemcisini açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Onaylayıcılar çözümlendiğinde
zorla açmak için `enabled: true` ayarlayın. Genel kaynak-sohbet teslimi
`channels.<channel>.execApprovals.target` üzerinden açık şekilde kalır.

SSS: [Sohbet onayları için neden iki exec onayı yapılandırması var?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Bu yerel onay istemcileri, paylaşılan aynı-sohbet `/approve` akışının ve paylaşılan onay düğmelerinin üstüne
DM yönlendirmesi ve isteğe bağlı kanal fanout'u ekler.

Paylaşılan davranış:

- Slack, Matrix, Microsoft Teams ve benzeri teslim edilebilir sohbetler,
  aynı-sohbet `/approve` için normal kanal kimlik doğrulama modelini kullanır
- bir yerel onay istemcisi otomatik etkinleştiğinde varsayılan yerel teslim hedefi
  onaylayıcı DM'leridir
- Discord ve Telegram için yalnızca çözümlenmiş onaylayıcılar onaylayabilir veya reddedebilir
- Discord onaylayıcıları açık olabilir (`execApprovals.approvers`) veya `commands.ownerAllowFrom` üzerinden çıkarılabilir
- Telegram onaylayıcıları açık olabilir (`execApprovals.approvers`) veya mevcut sahip yapılandırmasından (`allowFrom`, ayrıca desteklendiğinde doğrudan ileti `defaultTo`) çıkarılabilir
- Slack onaylayıcıları açık olabilir (`execApprovals.approvers`) veya `commands.ownerAllowFrom` üzerinden çıkarılabilir
- Slack yerel düğmeleri onay kimliği türünü korur; böylece `plugin:` kimlikleri
  ikinci bir Slack yerel geri dönüş katmanı olmadan Plugin onaylarını çözebilir
- Matrix yerel DM/kanal yönlendirmesi ve reaction kısayolları hem exec hem de Plugin onaylarını işler;
  Plugin yetkilendirmesi yine de `channels.matrix.dm.allowFrom` üzerinden gelir
- istekte bulunan kişinin onaylayıcı olması gerekmez
- kaynak sohbet komutları ve yanıtları zaten destekliyorsa doğrudan `/approve` ile onaylayabilir
- yerel Discord onay düğmeleri onay kimliği türüne göre yönlendirir: `plugin:` kimlikleri
  doğrudan Plugin onaylarına gider, diğer her şey exec onaylarına gider
- yerel Telegram onay düğmeleri `/approve` ile aynı sınırlı exec'ten Plugin'e geri dönüşü izler
- yerel `target` kaynak-sohbet teslimini etkinleştirdiğinde onay istemleri komut metnini içerir
- bekleyen exec onayları varsayılan olarak 30 dakika sonra sona erer
- hiçbir operatör UI'si veya yapılandırılmış onay istemcisi isteği kabul edemiyorsa istem `askFallback`e geri döner

Telegram varsayılan olarak onaylayıcı DM'lerini kullanır (`target: "dm"`). Onay istemlerinin kaynak Telegram sohbetinde/konusunda da görünmesini istiyorsanız bunu
`channel` veya `both` olarak değiştirebilirsiniz. Telegram forum konularında OpenClaw,
onay istemi ve onay sonrası takip için konuyu korur.

Bkz.:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC akışı
__OC_I18N_900004__
Güvenlik notları:

- Unix socket modu `0600`, token `exec-approvals.json` içinde saklanır.
- Aynı UID eş denetimi.
- Challenge/response (`nonce + HMAC token + istek hash'i`) + kısa TTL.

## İlgili

- [Exec onayları](/tr/tools/exec-approvals) — çekirdek ilke ve onay akışı
- [Exec aracı](/tr/tools/exec)
- [Elevated mode](/tr/tools/elevated)
- [Skills](/tr/tools/skills) — skill destekli otomatik izin verme davranışı
