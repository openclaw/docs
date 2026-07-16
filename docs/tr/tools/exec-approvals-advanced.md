---
read_when:
    - Güvenli ikili dosyaları veya özel güvenli ikili dosya profillerini yapılandırma
    - Onayları Slack/Discord/Telegram veya diğer sohbet kanallarına yönlendirme
    - Bir kanal için yerel bir onay istemcisi uygulama
summary: 'Gelişmiş exec onayları: güvenli ikili dosyalar, yorumlayıcı bağlama, onay yönlendirme, yerel teslimat'
title: Exec onayları — gelişmiş
x-i18n:
    generated_at: "2026-07-16T17:50:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99f123c7663378cc30ff9b6498c5cbc18ce9f20e9ac769755bab23af69ef1c7d
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Gelişmiş exec onayı konuları: `safeBins` hızlı yolu, yorumlayıcı/çalışma zamanı
bağlama ve onayların sohbet kanallarına iletilmesi (yerel teslimat dâhil).
Temel politika ve onay akışı için [Exec onayları](/tr/tools/exec-approvals) bölümüne bakın.

## Güvenli ikili dosyalar (yalnızca stdin)

`tools.exec.safeBins`, izin verilenler listesi modunda açık izin verilenler listesi girdileri
**olmadan** çalışan **yalnızca stdin** ikili dosyalarını (örneğin `cut`) belirtir.
Güvenli ikili dosyalar konumsal dosya argümanlarını ve yol benzeri belirteçleri reddeder;
böylece yalnızca gelen akış üzerinde çalışabilirler. Bunu genel bir güven listesi olarak değil,
akış filtrelerine yönelik dar kapsamlı bir hızlı yol olarak değerlendirin.

<Warning>
Yorumlayıcı veya çalışma zamanı ikili dosyalarını (örneğin `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) `safeBins` içine **eklemeyin**. Bir komut tasarımı
gereği kod değerlendirebiliyor, alt komut çalıştırabiliyor veya dosya okuyabiliyorsa açık izin
verilenler listesi girdilerini tercih edin ve onay istemlerini etkin tutun. Özel güvenli ikili
dosyalar `tools.exec.safeBinProfiles.<bin>` içinde açık bir profil tanımlamalıdır.
</Warning>

Varsayılan güvenli ikili dosyalar:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` ve `sort` varsayılan listede değildir. Bunları etkinleştirirseniz stdin dışındaki
iş akışları için açık izin verilenler listesi girdilerini koruyun. Güvenli ikili dosya modunda
`grep` için kalıbı `-e`/`--regexp` ile sağlayın; konumsal kalıp biçimi reddedilir,
böylece dosya işlenenleri belirsiz konumsal argümanlar olarak gizlice aktarılamaz.

### Argv doğrulaması ve reddedilen bayraklar

Doğrulama yalnızca argv biçimine göre belirlenimlidir (ana makine dosya sisteminde varlık
kontrolü yapılmaz); bu, izin verme/reddetme farklarının dosya varlığı sorgulama kanalı
oluşturmasını önler. Varsayılan güvenli ikili dosyalarda dosya odaklı seçenekler reddedilir;
uzun seçenekler kapalı kalma ilkesiyle doğrulanır (bilinmeyen bayraklar ve belirsiz kısaltmalar
reddedilir). Varsayılan ikili dosyaların tanınan salt okunur Boole bayrakları (örneğin
`wc -l`, `tr -d`, `uniq -c`) kabul edilirken tanınmayan kısa bayraklar kapalı kalır
ve manuel onaya yönlendirilir.

Güvenli ikili dosya profiline göre reddedilen bayraklar:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `tail`: `--follow`, `--retry`, `-F`, `-f`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Güvenli ikili dosyalar ayrıca yalnızca stdin kullanan segmentlerde argv belirteçlerinin çalışma
zamanında **değişmez metin** olarak değerlendirilmesini zorunlu kılar (glob eşleştirmesi ve
`$VARS` genişletmesi yapılmaz); böylece `*` veya `$HOME/...` gibi kalıplar dosya okumalarını
gizlice aktarmak için kullanılamaz. Anlamsal davranışları yalnızca stdin ile sınırlı olarak
doğrulanamadığından `awk`, `sed` ve `jq` güvenli ikili dosya olarak her zaman reddedilir:
`jq` ortam verilerini okuyabilir ve modüllerden veya başlangıç dosyalarından jq kodu yükleyebilir.
Bu araçlar için `safeBins` yerine açık bir izin verilenler listesi girdisi veya onay istemi kullanın.

### Güvenilir ikili dosya dizinleri

Güvenli ikili dosyalar güvenilir ikili dosya dizinlerinden (sistem varsayılanları ve isteğe bağlı
`tools.exec.safeBinTrustedDirs`) çözümlenmelidir. `PATH` girdilerine hiçbir zaman otomatik olarak güvenilmez.
Varsayılan güvenilir dizinler kasıtlı olarak asgari düzeydedir: `/bin`, `/usr/bin`.
Güvenli ikili dosya yürütülebiliriniz paket yöneticisi/kullanıcı yollarında bulunuyorsa (örneğin
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), bunları açıkça
`tools.exec.safeBinTrustedDirs` içine ekleyin.

### Kabuk zincirleme, sarmalayıcılar ve çoklayıcılar

Her üst düzey segment izin verilenler listesini karşıladığında (güvenli ikili dosyalar veya
Skills otomatik izni dâhil) kabuk zincirlemeye (`&&`, `||`, `;`) izin verilir.
Yönlendirmeler izin verilenler listesi modunda desteklenmez. Komut ikamesi (`$()` /
ters tırnaklar), çift tırnakların içinde olsa bile izin verilenler listesi ayrıştırması sırasında
reddedilir; değişmez `$()` metnine ihtiyacınız varsa tek tırnak kullanın.

macOS yardımcı uygulama onaylarında kabuk denetimi veya genişletme sözdizimi (`&&`,
`||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) içeren ham kabuk metni,
kabuk ikili dosyasının kendisi izin verilenler listesinde olmadığı sürece izin verilenler listesi
eşleşmemesi olarak değerlendirilir.

Kabuk sarmalayıcılarında (`bash|sh|zsh ... -c/-lc`) istek kapsamındaki ortam geçersiz kılmaları küçük ve
açık bir izin verilenler listesine indirgenir (`TERM`, `LANG`, `LC_*`,
`COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

İzin verilenler listesi modundaki `allow-always` kararlarında şeffaf yönlendirme sarmalayıcıları
(örneğin `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolu yerine içteki
yürütülebilir dosyanın yolunu kalıcılaştırır. Kabuk çoklayıcıları (`busybox`, `toybox`)
da kabuk uygulamacıkları (`sh`, `ash` vb.) için aynı şekilde açılır. Bir sarmalayıcı
veya çoklayıcı güvenli biçimde açılamıyorsa hiçbir izin verilenler listesi girdisi otomatik olarak
kalıcılaştırılmaz.

`python3` veya `node` gibi yorumlayıcıları izin verilenler listesine eklerseniz satır içi
değerlendirmenin yine açık bir onay gerektirmesi için `tools.exec.strictInlineEval=true` seçeneğini tercih edin.
Katı modda `allow-always` zararsız yorumlayıcı/betik çağrılarını yine kalıcılaştırabilir ancak satır
içi değerlendirme taşıyıcıları otomatik olarak kalıcılaştırılmaz.

### Güvenli ikili dosyalar ile izin verilenler listesinin karşılaştırması

| Konu             | `tools.exec.safeBins`                                         | İzin verilenler listesi (`exec-approvals.json`)                                              |
| ---------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Amaç             | Dar kapsamlı stdin filtrelerine otomatik olarak izin verme | Belirli yürütülebilir dosyalara açıkça güvenme                                             |
| Eşleşme türü     | Yürütülebilir dosya adı + güvenli ikili argv politikası    | Çözümlenmiş yürütülebilir dosya yolu globu veya PATH üzerinden çağrılan komutlar için yalın komut adı globu |
| Argüman kapsamı  | Güvenli ikili dosya profili ve değişmez belirteç kurallarıyla sınırlandırılır | Varsayılan olarak yol eşleşmesi; isteğe bağlı `argPattern` ayrıştırılmış argv'yi sınırlandırabilir |
| Tipik örnekler   | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, özel CLI'lar |
| En iyi kullanım  | İşlem hatlarındaki düşük riskli metin dönüşümleri          | Daha geniş davranışa veya yan etkilere sahip tüm araçlar                                   |

Yapılandırma konumu:

- `safeBins` yapılandırmadan gelir (`tools.exec.safeBins` veya aracı başına `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` yapılandırmadan gelir (`tools.exec.safeBinTrustedDirs` veya aracı başına `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` yapılandırmadan gelir (`tools.exec.safeBinProfiles` veya aracı başına `agents.list[].tools.exec.safeBinProfiles`). Aracı başına profil anahtarları genel anahtarları geçersiz kılar.
- izin verilenler listesi girdileri, `agents.<id>.allowlist` altındaki ana makineye yerel onaylar dosyasında (veya Control UI / `openclaw approvals allowlist ...` aracılığıyla) bulunur.
- `openclaw security audit`, yorumlayıcı/çalışma zamanı ikili dosyaları açık profiller olmadan `safeBins` içinde yer aldığında `tools.exec.safe_bins_interpreter_unprofiled` ile uyarır.
- `openclaw doctor --fix`, eksik özel `safeBinProfiles.<bin>` girdilerini `{}` olarak oluşturabilir (ardından gözden geçirip sıkılaştırın). Yorumlayıcı/çalışma zamanı ikili dosyaları otomatik olarak oluşturulmaz.

Özel profil örneği:

```json5
{
  tools: {
    exec: {
      safeBins: ["myfilter"],
      safeBinProfiles: {
        myfilter: {
          minPositional: 0,
          maxPositional: 0,
          allowedValueFlags: ["-n", "--limit"],
          deniedFlags: ["-f", "--file", "-c", "--command"],
        },
      },
    },
  },
}
```

## Yorumlayıcı/çalışma zamanı komutları

Onay destekli yorumlayıcı/çalışma zamanı çalıştırmaları kasıtlı olarak ihtiyatlıdır:

- Kesin argv/cwd/env bağlamı her zaman bağlanır.
- Doğrudan kabuk betiği ve doğrudan çalışma zamanı dosyası biçimleri, mümkün olan en iyi çabayla tek bir somut yerel
  dosya anlık görüntüsüne bağlanır.
- Yine tek bir doğrudan yerel dosyaya çözümlenen yaygın paket yöneticisi sarmalayıcı biçimleri (örneğin
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) bağlamadan önce açılır.
- OpenClaw bir yorumlayıcı/çalışma zamanı komutu için tam olarak bir somut yerel dosya belirleyemezse
  (örneğin paket betikleri, değerlendirme biçimleri, çalışma zamanına özgü yükleyici zincirleri veya belirsiz çok dosyalı
  biçimler), sahip olmadığı anlamsal kapsamı varmış gibi göstermek yerine onay destekli yürütme
  reddedilir.
- Bu iş akışlarında korumalı alan kullanmayı, ayrı bir ana makine sınırını veya operatörün daha geniş çalışma zamanı
  anlamlarını kabul ettiği, açıkça güvenilen izin verilenler listesi/tam iş akışını tercih edin.

Onay gerektiğinde exec aracı bir onay kimliğiyle hemen döner. Daha sonra gerçekleşen onaylı çalıştırma
sistem olaylarını (`Exec finished` ve yapılandırıldığında `Exec running`) ilişkilendirmek için bu kimliği kullanın.
Zaman aşımından önce karar verilmezse istek, onay zaman aşımı olarak değerlendirilir ve nihai bir
ana makine komutu reddi olarak gösterilir. Kaynak oturumu bulunan ana aracı eşzamansız onaylarında
OpenClaw ayrıca bu oturumu dâhilî bir takip ile sürdürür; böylece aracı daha sonra eksik bir sonucu
düzeltmeye çalışmak yerine komutun çalışmadığını gözlemler. Bekleyen exec onaylarının süresi
varsayılan olarak 30 dakika sonra dolar.

### Takip teslimatı davranışı

Onaylanmış eşzamansız bir exec tamamlandıktan sonra OpenClaw aynı oturuma takip niteliğinde bir
`agent` dönüşü gönderir. Reddedilen eşzamansız onaylar, ret durumu için aynı ana oturum takip
yolunu kullanır ancak yükseltilmiş çalışma zamanı devirlerini kaydetmez ve komutu çalıştırmaz.
Sürdürülebilir bir ana oturumu olmayan retler ya bastırılır ya da mevcut olduğunda güvenli bir
doğrudan yol üzerinden bildirilir.

- Geçerli bir harici teslimat hedefi varsa (teslimat yapılabilir kanal ve hedef `to`), takip teslimatı bu kanalı kullanır.
- Harici hedefi olmayan yalnızca web sohbeti veya dâhilî oturum akışlarında takip teslimatı yalnızca oturumda kalır (`deliver: false`).
- Çağıran, çözümlenebilir bir harici kanal olmadan açıkça katı harici teslimat isterse istek `INVALID_REQUEST` ile başarısız olur.
- `bestEffortDeliver` etkinse ve hiçbir harici kanal çözümlenemiyorsa teslimat başarısız olmak yerine yalnızca oturuma indirgenir.

## Onayları sohbet kanallarına iletme

Exec onayı istemlerini herhangi bir sohbet kanalına (Plugin kanalları dâhil) iletebilir ve
`/approve` ile onaylayabilirsiniz. Bu işlem normal giden teslimat işlem hattını kullanır.

Yapılandırma:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // substring or regex
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

Sohbette yanıtlayın:

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

`/approve` komutu hem exec onaylarını hem de plugin onaylarını işler. Kimlik bekleyen bir exec onayıyla eşleşmezse bunun yerine otomatik olarak plugin onaylarını denetler. Bu geri dönüş yalnızca "onay bulunamadı" hatalarıyla sınırlıdır; gerçek bir exec onayı reddi/hatası, plugin onayı olarak sessizce yeniden denenmez.

### Plugin onayı yönlendirme

Plugin onayı yönlendirme, exec onaylarıyla aynı teslimat işlem hattını kullanır ancak
`approvals.plugin` altında kendi bağımsız yapılandırmasına sahiptir. Birini etkinleştirmek veya devre dışı bırakmak diğerini etkilemez.
Plugin geliştirme davranışı, istek alanları ve karar semantiği için
[Plugin izin istekleri](/plugins/plugin-permission-requests) bölümüne bakın.

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

Yapılandırma şekli `approvals.exec` ile aynıdır: `enabled`, `mode`, `agentFilter`,
`sessionFilter` ve `targets` aynı şekilde çalışır.

Paylaşılan etkileşimli yanıtları destekleyen kanallar, hem exec hem de
plugin onayları için aynı onay düğmelerini oluşturur. Paylaşılan etkileşimli kullanıcı arayüzü olmayan kanallar, `/approve`
talimatlarını içeren düz metne geri döner. Plugin onayı istekleri kullanılabilir kararları kısıtlayabilir: onay yüzeyleri
isteğin bildirdiği karar kümesini kullanır ve Gateway sunulmayan bir kararı gönderme girişimlerini
reddeder.

### Herhangi bir kanalda aynı sohbetten onaylar

Bir exec veya plugin onayı isteği teslimat yapılabilen bir sohbet yüzeyinden kaynaklandığında, aynı sohbet
varsayılan olarak `/approve` ile bunu onaylayabilir. Bu, mevcut Web kullanıcı arayüzü ve terminal kullanıcı arayüzü akışlarına ek olarak Slack, Matrix, Microsoft Teams ve
benzer teslimat yapılabilen sohbetler için geçerlidir ve ilgili konuşmanın
normal kanal kimlik doğrulama modelini kullanır. Kaynak sohbet zaten komut gönderebiliyor
ve yanıt alabiliyorsa onay isteklerinin beklemede kalmak için artık ayrı bir yerel teslimat bağdaştırıcısına
ihtiyacı yoktur.

Discord, Telegram ve QQ bot da aynı sohbetten `/approve` özelliğini destekler ancak bu kanallar, yerel onay teslimatı devre dışı bırakılmış olsa bile yetkilendirme için
çözümlenmiş onaylayanlar listesini kullanmaya devam eder.

### Yerel onay teslimatı

Bazı kanallar yerel onay istemcileri olarak da görev yapabilir: Discord, Slack, Telegram, Matrix ve QQ bot.
Yerel istemciler, paylaşılan aynı sohbetten `/approve` akışına ek olarak onaylayanlara DM, kaynak sohbetlere dağıtım ve kanala özgü etkileşimli onay kullanıcı deneyimi
ekler.

Yerel onay kartları/düğmeleri kullanılabilir olduğunda bu yerel kullanıcı arayüzü, agent'a yönelik birincil yoldur.
Araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın kalan tek yol olduğunu belirtmediği sürece agent ayrıca yinelenen bir düz sohbet `/approve` komutunu
yansıtmamalıdır.

Yerel bir onay istemcisi yapılandırılmış ancak kaynak
kanal için etkin bir yerel çalışma zamanı yoksa OpenClaw, yerel belirlenimsel `/approve` istemini görünür tutar. Yerel çalışma zamanı
etkinse ve teslimatı dener ancak kartı hiçbir hedef almazsa OpenClaw, isteğin yine de çözümlenebilmesi için tam `/approve <id> <decision>` komutunu içeren aynı sohbette bir geri dönüş
bildirimi gönderir.

Genel model:

- ana makine exec ilkesi, exec onayının gerekli olup olmadığına karar vermeye devam eder
- `approvals.exec`, onay istemlerinin diğer sohbet hedeflerine yönlendirilmesini denetler
- `channels.<channel>.execApprovals`, Discord, Slack, Telegram, QQ bot ve benzeri
  kanala özgü yerel istemcilerin etkin olup olmadığını denetler
- Slack plugin onayları, istek Slack'ten geldiğinde
  ve Slack plugin onaylayanları çözümlendiğinde Slack'in yerel onay istemcisini kullanabilir; `approvals.plugin`, Slack exec onayları devre dışı bırakılmış olsa bile plugin onaylarını Slack
  oturumlarına veya hedeflerine yönlendirebilir
- Google Chat yerel onay kartları, kararlı `users/<id>` onaylayanları `dm.allowFrom` veya
  `defaultTo` üzerinden çözümlendiğinde Google
  Chat alanlarından veya ileti dizilerinden kaynaklanan exec ve plugin onaylarını işler; kararlar için tepki olaylarını kullanmaz
- WhatsApp ve Signal tepki onayı teslimatı, `approvals.exec` ve
  `approvals.plugin` tarafından denetlenir; bunların `channels.<channel>.execApprovals` blokları yoktur

Yerel onay istemcileri, aşağıdakilerin tümü doğru olduğunda önce DM teslimatını otomatik olarak etkinleştirir:

- kanal yerel onay teslimatını destekler
- onaylayanlar açık `execApprovals.approvers` değerinden veya
  `commands.ownerAllowFrom` gibi sahip kimliğinden çözümlenebilir
- `channels.<channel>.execApprovals.enabled` ayarlanmamıştır veya `"auto"` değerindedir

Yerel bir onay istemcisini açıkça devre dışı bırakmak için `enabled: false` değerini ayarlayın. Onaylayanlar çözümlendiğinde istemciyi zorla
etkinleştirmek için `enabled: true` değerini ayarlayın. Herkese açık kaynak sohbet teslimatı
`channels.<channel>.execApprovals.target` üzerinden açıkça yapılandırılmaya devam eder. Yerel `target` kaynak sohbet teslimatını etkinleştirdiğinde,
onay istemleri komut metnini içerir.

SSS: [Sohbet onayları için neden iki exec onayı yapılandırması var?](/help/faq-first-run)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- QQ bot: `channels.qqbot.execApprovals.*`
- Google Chat: kararlı onaylayanları `channels.googlechat.dm.allowFrom` veya
  `channels.googlechat.defaultTo` ile yapılandırın; `execApprovals` bloğu gerekli değildir
- WhatsApp: onay istemlerini WhatsApp'a yönlendirmek için `approvals.exec` ve `approvals.plugin` kullanın
- Signal: onay istemlerini Signal'e yönlendirmek için `approvals.exec` ve `approvals.plugin` kullanın

Yerel istemciye özgü yönlendirme:

- Telegram varsayılan olarak onaylayan DM'lerini (`target: "dm"`) kullanır. Onay istemlerini
  kaynak Telegram sohbetinde/konusunda da göstermek için `channel` veya `both` değerine geçin. Telegram forum konularında OpenClaw,
  onay istemi ve onay sonrası takip için konuyu korur.
- Discord ve Telegram onaylayanları açıkça belirtilebilir (`execApprovals.approvers`) veya
  `commands.ownerAllowFrom` üzerinden çıkarılabilir; yalnızca çözümlenmiş onaylayanlar onaylayabilir veya reddedebilir.
- Slack onaylayanları açıkça belirtilebilir (`execApprovals.approvers`) veya
  `commands.ownerAllowFrom` üzerinden çıkarılabilir. Slack plugin onayı DM'leri, Slack exec onaylayanlarını değil `allowFrom`
  değerindeki Slack plugin onaylayanlarını ve hesap varsayılan yönlendirmesini kullanır. Slack yerel düğmeleri onay kimliği
  türünü korur; böylece `plugin:` kimlikleri ikinci bir Slack yerel geri dönüş katmanı olmadan plugin onaylarını çözümleyebilir.
- Google Chat yerel kartları, ileti metnindeki manuel `/approve` geri dönüşünü korur ancak kart düğmesi
  geri çağırmaları yalnızca opak eylem belirteçleri taşır; onay kimliği ve karar
  sunucu tarafındaki bekleyen durumdan alınır.
- WhatsApp emoji onayları, eşleşen üst düzey
  yönlendirme ailesi WhatsApp'a yönlendirdiğinde hem exec hem de plugin istemlerini işler. Yerel kaynaklı istemler doğrudan bağlanır; paylaşılan hedef modu
  teslimatı, aynı türü belirlenmiş onay meta verilerini kabul edilen WhatsApp ileti alındısına bağlar.
- Signal tepki onayları, hem exec hem de plugin istemlerini yalnızca eşleşen üst düzey
  yönlendirme ailesi etkinleştirildiğinde ve Signal'e yönlendirdiğinde işler. Doğrudan aynı sohbetten Signal exec onayları,
  açık onaylayanlar olmadan yerel `/approve` geri dönüşünü engelleyebilir; Signal tepki çözümlemesi
  yine de `channels.signal.allowFrom` veya `defaultTo` üzerinden açık Signal onaylayanları gerektirir.
- Matrix yerel DM/kanal yönlendirmesi ve tepki kısayolları hem exec hem de plugin onaylarını işler;
  plugin yetkilendirmesi yine de `channels.matrix.dm.allowFrom` üzerinden gelir. Matrix yerel istemleri,
  OpenClaw uyumlu Matrix istemcilerinin yapılandırılmış onay durumunu okuyabilmesi, standart istemcilerin ise düz metin
  `/approve` geri dönüşünü koruması için ilk istem olayında `com.openclaw.approval` özel olay içeriğini barındırır.
- Yerel Discord ve Telegram onay düğmeleri, taşıma katmanına özel geri çağırma verilerinde açık bir exec veya plugin sahibi türü taşır
  ve yalnızca o sahibi çözümler. Tür içermeyen eski `/approve` denetimleri
  sınırlı bir uyumluluk yolu olarak kalır: yalnızca aktörün onaylayabileceği sahip türlerini dener,
  yalnızca onay bulunamadı sonucundan sonra devam eder ve hiçbir zaman onay kimliğinden sahiplik çıkarımı yapmaz.
- İstekte bulunan kişinin onaylayan olması gerekmez.
- Hiçbir operatör kullanıcı arayüzü veya yapılandırılmış onay istemcisi isteği kabul edemezse istem
  `askFallback` değerine geri döner.

`/diagnostics` ve `/export-trajectory` gibi yalnızca sahibe özel hassas grup komutları, onay istemleri ve nihai sonuçlar için özel
sahip yönlendirmesini kullanır. OpenClaw önce, sahibin komutu çalıştırdığı
aynı yüzeyde özel bir yol dener. Bu yüzeyde özel bir sahip yolu yoksa `commands.ownerAllowFrom` içindeki ilk kullanılabilir sahip yoluna
geri döner; böylece Telegram yapılandırılmış
birincil özel arayüz olduğunda bir Discord grup komutu onayı ve sonucu yine de sahibin Telegram DM'sine gönderebilir. Grup sohbetine yalnızca kısa bir alındı bildirimi gönderilir.

Ayrıca bkz.:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ bot](/channels/qqbot)

### Resmî mobil operatör uygulamaları

Resmî iOS ve Android uygulamaları, `operator.admin` bağlantısı kullanıldığında veya eşleştirilmiş
`operator.approvals` cihazları istek tarafından açıkça hedeflendiğinde Gateway'in sahip olduğu bekleyen exec
onaylarını da inceleyebilir. Bu uygulamalar
Control UI tarafından kullanılan aynı arındırılmış kalıcı kaydı okur, türü dikkate alan bir karar gönderir ve Gateway'in standart
ilk yanıt sonucunu görüntüler. Apple Watch, bu onay istemlerini eşleştirilmiş
iPhone üzerinden bir kez izin ver ve reddet eylemleriyle yansıtır. Doğrudan Watch Gateway modu
onayları incelemez.

Kaybolan bir çözümleme alındısı, gönderilen seçimi yetkili hâle getirmez:
uygulama denetimleri devre dışı bırakır ve kaydı yeniden okur. Başka bir yüzey
kazandıysa uygulama kaydedilmiş kararı gösterir. Bekleyen istemler, onları oluşturan
Gateway'e bağlı kalır; bu nedenle etkin Gateway'i değiştirmek eski bir
onay kimliğini yeniden yönlendiremez.

### macOS IPC akışı

```
Gateway -> Node Hizmeti (WS)
                 |  IPC (UDS + belirteç + HMAC + TTL)
                 v
             Mac Uygulaması (kullanıcı arayüzü + onaylar + system.run)
```

Güvenlik notları:

- Unix soket modu `0600`, belirteç `exec-approvals.json` içinde saklanır.
- Aynı UID eş denetimi.
- Sorgulama/yanıt (tek kullanımlık değer + HMAC belirteci + istek karması) + kısa TTL.

## SSS

### Bir onay hedefinde `accountId` ve `threadId` ne zaman kullanılır?

Kanalda yapılandırılmış birden fazla kimlik varsa ve onay isteminin belirli bir hesaptan
gönderilmesi gerekiyorsa `accountId` kullanın. Hedef konuları veya
ileti dizilerini destekliyorsa ve istemin üst düzey sohbet yerine ilgili ileti dizisinin içinde kalması gerekiyorsa `threadId` kullanın.

Somut bir Telegram örneği, forum konularına ve iki Telegram bot
hesabına sahip bir operasyon süper grubudur. `to` değeri süper grubu adlandırır, `accountId` bot hesabını seçer ve `threadId`
forum konusunu seçer:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "targets",
      targets: [
        {
          channel: "telegram",
          to: "-1001234567890",
          accountId: "ops-bot",
          threadId: "77",
        },
      ],
    },
  },
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Birincil bot",
          botToken: "env:TELEGRAM_PRIMARY_BOT_TOKEN",
        },
        "ops-bot": {
          name: "Operasyon botu",
          botToken: "env:TELEGRAM_OPS_BOT_TOKEN",
        },
      },
    },
  },
}
```

Bu kurulumla yönlendirilen exec onayları, `ops-bot` Telegram hesabı tarafından
`-1001234567890` sohbetinin `77` konusuna gönderilir. `accountId` içermeyen bir hedef kanalın varsayılan hesabını kullanır ve
`threadId` içermeyen bir hedef üst düzey hedefe gönderilir.

### Onaylar bir oturuma gönderildiğinde, o oturumdaki herkes bunları onaylayabilir mi?

Hayır. Oturuma teslim, yalnızca istemin nerede görüneceğini kontrol eder. Tek başına, o
sohbetteki her katılımcıya onaylama yetkisi vermez.

Aynı sohbetteki genel `/approve` için gönderenin, söz konusu kanal oturumunda komutlar için
zaten yetkilendirilmiş olması gerekir. Kanal açık onay yetkilileri sunuyorsa bu yetkililer, söz konusu
oturumda başka şekilde komut yetkisine sahip olmasalar bile `/approve` eylemini yetkilendirebilir.

Bazı kanallar daha katıdır. Discord, Telegram, Matrix, Slack yerel onay doğrudan mesajları ve benzer
yerel onay istemcileri, onay yetkilendirmesi için çözümlenmiş onay yetkilisi listelerini kullanır. Örneğin,
bir Telegram forum konusu onay istemi konudaki herkes tarafından görülebilir, ancak yalnızca
`channels.telegram.execApprovals.approvers` veya `commands.ownerAllowFrom` üzerinden çözümlenen sayısal
Telegram kullanıcı kimlikleri bunu onaylayabilir veya reddedebilir.

## İlgili

- [Çalıştırma onayları](/tr/tools/exec-approvals) — temel politika ve onay akışı
- [Çalıştırma aracı](/tr/tools/exec)
- [Yükseltilmiş mod](/tr/tools/elevated)
- [Skills](/tr/tools/skills) — beceri destekli otomatik izin verme davranışı
