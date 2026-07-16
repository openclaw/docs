---
read_when:
    - OpenClaw'u Güncelleme
    - Güncellemeden sonra bir şeyler bozuluyor
summary: OpenClaw'u güvenle güncelleme (global kurulum veya kaynak koddan kurulum) ve geri alma stratejisi
title: Güncelleniyor
x-i18n:
    generated_at: "2026-07-16T17:15:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baf849d27fd1132833832734ff5b1648b7401d53925a624176832bca614d1160
    source_path: install/updating.md
    workflow: 16
---

OpenClaw'u güncel tutun.

Docker, Podman ve Kubernetes imaj değişimleri için
[Konteyner imajlarını yükseltme](/tr/install/docker#upgrading-container-images) bölümüne bakın. Gateway,
hazır duruma geçmeden önce başlangıç açısından güvenli yükseltme işlemlerini çalıştırır ve bağlanan
durumun elle onarılması gerekiyorsa kapanır.

## Önerilen: `openclaw update`

Kurulum türünü (npm, pnpm, Bun veya git) algılar, en son sürümü getirir, `openclaw doctor` çalıştırır ve Gateway'i yeniden başlatır.

```bash
openclaw update
```

Kanallar arasında geçiş yapın veya belirli bir sürümü hedefleyin:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # uygulamadan önizle
```

`openclaw update` bir `--verbose` bayrağına sahip değildir (yükleyicide vardır). Tanılama için
planlanan eylemleri önizlemek üzere `--dry-run`, yapılandırılmış sonuçlar için `--json` veya
kanal ve kullanılabilirlik durumunu incelemek için `openclaw update status --json` kullanın.

`--channel beta`, beta npm dist-tag'ini tercih eder ancak beta etiketi eksikse veya
sürümü en son kararlı sürümden eskiyse stable/latest'e geri döner.
Ham npm beta dist-tag'ine sabitlenmiş tek seferlik bir paket güncellemesi için bunun yerine
`--tag beta` kullanın.

`--channel extended-stable` yalnızca paket içindir ve kurulum
yalnızca ön planda yapılmaya devam eder. OpenClaw, genel npm `extended-stable` seçicisini okur,
seçilen tam paketi doğrular ve tam olarak bu sürümü kurar. Eksik
veya tutarsız kayıt verileri güvenli biçimde başarısız olur; asla `latest` seçeneğine geri dönmez.
Seçilen sürüm kurulu sürümden eskiyse normal
sürüm düşürme onayı yine geçerlidir. CLI, başarılı bir
çekirdek güncellemesinden sonra kanalı kalıcı hâle getirir; doğrudan yapılan bir `npm install -g openclaw@extended-stable`
işlemi `update.channel` değerini güncellemez.
Çekirdek değişiminden sonra, yalın/varsayılan veya
`latest` niyetine sahip uygun resmî npm Plugin'leri tam olarak bu çekirdek sürümüne yakınsar. Tam sabitlemeler ve açıkça belirtilmiş
`latest` olmayan etiketler, üçüncü taraf Plugin'leri ve npm dışı kaynaklar değişmeden kalır.
Güncel OpenClaw sürümleri tarafından oluşturulan katalog kurulumları bu varsayılan
niyeti korur. Yalnızca tam bir sürüm içeren eski kayıtlar sabitlenmiş olarak kalır; çünkü
OpenClaw eski bir otomatik sabitlemeyi kullanıcı sabitlemesinden güvenli biçimde ayırt edemez. İlgili Plugin'i yeniden tam çekirdek sürümü takibine almak için
extended-stable kanalında bir kez
`openclaw plugins update @openclaw/name` çalıştırın.

`--channel dev`, sürekli ilerleyen kalıcı bir GitHub `main` çalışma kopyası sağlar. Tek seferlik bir
paket güncellemesi için `--tag main`, `github:openclaw/openclaw#main` paket
belirtimine eşlenir ve hedef paket yöneticisi (npm/pnpm/bun) aracılığıyla doğrudan kurulur.

Yönetilen Plugin'lerde eksik bir beta sürümü hata değil, uyarıdır:
bir Plugin kayıtlı varsayılan/latest sürümüne geri dönerken çekirdek güncellemesi yine de başarılı olabilir.

Kanal semantiği için [Sürüm kanalları](/tr/install/development-channels) bölümüne bakın.

## npm ve git kurulumları arasında geçiş yapma

Kurulum türünü değiştirmek için kanalları kullanın. Güncelleyici; durumunuzu, yapılandırmanızı,
kimlik bilgilerinizi ve çalışma alanınızı `~/.openclaw` içinde tutar; yalnızca CLI ve Gateway'in hangi OpenClaw
kod kurulumunu kullandığını değiştirir.

```bash
# npm paketi kurulumu -> düzenlenebilir git çalışma kopyası
openclaw update --channel dev

# git çalışma kopyası -> npm paketi kurulumu
openclaw update --channel stable
```

Önce kurulum modu geçişini önizleyin:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` bir git çalışma kopyasının varlığını güvenceye alır, bunu derler ve genel CLI'ı bu
çalışma kopyasından kurar. `stable`, `extended-stable` ve `beta` kanalları paket
kurulumlarını kullanır. Extended-stable, bir git çalışma kopyasında değişiklik veya
dönüştürme yapılmadan reddedilir. Gateway zaten kuruluysa `openclaw update`,
`--no-restart` geçmediğiniz sürece hizmet meta verilerini yeniler ve Gateway'i yeniden başlatır.

Yönetilen bir Gateway hizmetine sahip paket kurulumlarında `openclaw update`,
bu hizmetin kullandığı paket kökünü hedefler. Kabuktaki `openclaw` komutu
farklı bir kurulumdan geliyorsa güncelleyici iki kökü ve yönetilen
hizmetin Node yolunu yazdırır; paketi değiştirmeden önce bu Node sürümünü hedef sürümün
`engines.node` gereksinimine göre denetler.

## Alternatif: yükleyiciyi yeniden çalıştırma

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

İlk kurulumu atlamak için `--no-onboard` ekleyin. Belirli bir kurulum türünü zorunlu kılmak için
`--install-method git --no-onboard` veya `--install-method npm --no-onboard` geçin.

npm paketi kurulum aşamasından sonra `openclaw update` başarısız olursa
bunun yerine yükleyiciyi yeniden çalıştırın. Yükleyici güncelleyiciyi çağırmaz; genel paket
kurulumunu doğrudan çalıştırır ve kısmen güncellenmiş bir npm kurulumunu kurtarabilir.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Kurtarmayı belirli bir sürüme veya dist-tag'e sabitlemek için `--version` kullanın:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatif: elle npm, pnpm veya bun

```bash
npm i -g openclaw@latest
```

Denetimli kurulumlarda `openclaw update` tercih edin: paket
değişimini çalışan Gateway hizmetiyle koordine edebilir. Denetimli bir
kurulumu elle güncelliyorsanız önce yönetilen Gateway'i durdurun. Paket yöneticileri dosyaları
yerinde değiştirir ve çalışan bir Gateway aksi takdirde değişim sırasında çekirdek veya Plugin dosyalarını
yüklemeye çalışabilir. Yeni kurulumu kullanması için paket yöneticisi tamamlandıktan sonra
Gateway'i yeniden başlatın.

Kök kullanıcıya ait, Linux sistem genelindeki bir kurulumda `openclaw update`,
`EACCES` ile başarısız olursa elle değiştirme sırasında Gateway'i durdurulmuş hâlde tutarak
sistem npm'iyle kurtarın. İlgili Gateway için normalde kullandığınız profil
bayraklarını/ortamı kullanın. `/usr/bin/npm` yerine ana makinenizde
kök kullanıcıya ait genel ön ekin sahibi olan sistem npm'ini yazın:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Ardından doğrulayın:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

`openclaw update` genel bir npm kurulumunu yönettiğinde hedefi önce
geçici bir npm ön ekine kurar. Aday paket, `preinstall` sırasında ana makinenin
Node sürümünü doğrular; ancak bundan sonra OpenClaw paketlenmiş `dist` envanterini
doğrular ve temiz paket ağacını gerçek genel ön ekle değiştirir.
Paketlenmiş bir tamamlama koruması beklenen envanterin dışında tutulur ve yalnızca
`preinstall` başarılı olduktan sonra kaldırılır; böylece atlanan yaşam döngüsü betikleri de
değişimden önce başarısız olur. npm 12 ve daha yeni sürümlerde güncelleyici yalnızca aday
OpenClaw yaşam döngüsünü onaylar; geçişli bağımlılık betikleri engellenmiş kalır. Bu,
npm'in yeni bir paketi eskisinden kalan dosyaların üzerine bindirmesini önler. Kurulum
komutu başarısız olursa OpenClaw, yerel isteğe bağlı bağımlılıkların derlenemediği
ana makinelerde yardımcı olan `--omit=optional` ile bir kez yeniden dener.

OpenClaw tarafından yönetilen npm güncelleme ve Plugin güncelleme komutları, alt npm işlemi için
npm'in `min-release-age` tedarik zinciri karantinasını (veya eski `before` yapılandırma anahtarını)
da temizler. Bu politika genel koruma amacıyla vardır ancak açık bir
OpenClaw güncellemesi, "seçilen sürümü şimdi kur" anlamına gelir.

```bash
pnpm add -g openclaw@latest
```

pnpm 11, OpenClaw 2026.7.1'i kurduysa bu elle çalıştırılan komutu bir kez çalıştırın. Bu
sürüm pnpm 11'in yalıtılmış genel paket düzeninden önce çıktığı için güncelleyicisi,
başka bir npm kurulumunu çalışan CLI sanabilir. Sonraki sürümler
pnpm sahipliğini korur ve güncellemeler sırasında değiştirilecek paket kökünü takip eder. Ayrıca
sahip paket yöneticisinin bildirdiği genel ikili dizinini kullanır ve
kullanılabilir pnpm komutu başka bir genel kök veya ana sürüm bildirdiğinde
ya da çağıran paket sahipsiz olduğunda veya oradaki tek etkin OpenClaw
kurulumu olmadığında değişiklikten önce durur.

OpenClaw bir pnpm 11 genel kurulum grubunu başka bir paketle paylaşıyorsa
otomatik güncelleyici grubu değiştirmeden önce durur. Kardeş paketlerin ve derleme
politikasının bozulmaması için özgün virgülle ayrılmış grubu elle güncelleyin.

```bash
bun add -g openclaw@latest
```

### İleri düzey npm kurulum konuları

<AccordionGroup>
  <Accordion title="Salt okunur paket ağacı">
    OpenClaw, genel paket dizini mevcut kullanıcı tarafından yazılabilir olsa bile paketlenmiş genel kurulumları çalışma zamanında salt okunur olarak değerlendirir. Plugin paket kurulumları, kullanıcı yapılandırma dizini altındaki OpenClaw'a ait npm/git köklerinde bulunur ve Gateway başlangıcı OpenClaw paket ağacını değiştirmez.

    Bazı Linux npm kurulumları genel paketleri `/usr/lib/node_modules/openclaw` gibi kök kullanıcıya ait dizinlerin altına kurar. Plugin kurma/güncelleme komutları bu genel paket dizininin dışına yazdığı için OpenClaw bu düzeni destekler.

  </Accordion>
  <Accordion title="Güçlendirilmiş systemd birimleri">
    Açık Plugin kurulumlarının, Plugin güncellemelerinin ve doctor temizliğinin değişikliklerini kalıcı hâle getirebilmesi için OpenClaw'a yapılandırma/durum köklerine yazma erişimi verin:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk alanı ön kontrolü">
    OpenClaw, paket güncellemelerinden ve açık Plugin kurulumlarından önce hedef birim için elinden geldiğince bir disk alanı denetimi yapmaya çalışır. Düşük alan, denetlenen yolu içeren bir uyarı oluşturur ancak dosya sistemi kotaları, anlık görüntüler ve ağ birimleri denetimden sonra değişebileceği için güncellemeyi engellemez. Gerçek paket yöneticisi kurulumu ve kurulum sonrası doğrulama belirleyici olmaya devam eder.
  </Accordion>
</AccordionGroup>

## Otomatik güncelleyici

Varsayılan olarak kapalıdır. `~/.openclaw/openclaw.json` içinde etkinleştirin:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Kanal           | Davranış                                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | `stableDelayHours` (varsayılan: 6) bekler, ardından dağıtımı zamana yaymak için `stableJitterHours` (varsayılan: 12) boyunca belirlenimci zaman sapmasıyla uygular. |
| `extended-stable` | `checkOnStart` etkin olduğunda başlangıçta ve her 24 saatte bir salt okunur güncelleme ipucunu denetler. Asla otomatik olarak uygulamaz.                |
| `beta`            | Her `betaCheckIntervalHours` (varsayılan: 1) aralığında denetler ve hemen uygular.                                                                  |
| `dev`             | Otomatik uygulama yoktur. `openclaw update` komutunu elle kullanın.                                                                                          |

Gateway ayrıca başlangıçta bir güncelleme ipucu günlüğe kaydeder (
`update.checkOnStart: false` ile devre dışı bırakın). Saklanan extended-stable seçimleri bu
salt okunur ipucu yolunu ve mevcut 24 saatlik ipucu aralığını kullanır ancak
otomatik kurulum, devir, yeniden başlatma, kararlı kanal gecikmesi/zaman sapması veya beta yoklamasını asla
başlatmaz. Sürüm düşürme veya olay kurtarma amacıyla, `update.auto.enabled` yapılandırılmış olsa bile otomatik uygulamaları engellemek için Gateway ortamında `OPENCLAW_NO_AUTO_UPDATE=1` ayarlayın. `update.checkOnStart` da devre dışı bırakılmadığı sürece başlangıç güncelleme ipuçları çalışmaya devam edebilir.

Canlı Gateway denetim düzlemi üzerinden istenen paket yöneticisi güncellemeleri
(`update.run`), çalışan Gateway işleminin içindeki paket ağacını değiştirmez.
Yönetilen hizmet kurulumlarında Gateway ayrık bir devri başlatır,
kapanır ve normal `openclaw update --yes --json` CLI yolunun
hizmeti durdurmasına, paketi değiştirmesine, hizmet meta verilerini yenilemesine, yeniden başlatmasına, Gateway
sürümünü ve erişilebilirliğini doğrulamasına ve mümkün olduğunda kurulmuş ancak yüklenmemiş bir macOS
LaunchAgent'ını kurtarmasına izin verir. Gateway bu devri güvenli biçimde yapamazsa
`update.run`, paket yöneticisini işlem içinde çalıştırmak yerine güvenli bir kabuk komutu bildirir.

Control UI kenar çubuğu güncelleme kartı, bu `update.run` akışını
doğrudan başlatacağı zaman **Gateway'i Güncelle** seçeneğini gösterir. Bu; tarayıcıda
barındırılan Control UI'ı, uzak Gateway'leri ve elle yönetilen yerel Gateway'leri kapsar.

İmzalı macOS uygulamasında, uygulamanın sahip olduğu yerel bir Gateway bu kartı
**Mac uygulamasını + Gateway'i Güncelle** olarak değiştirir. Sparkle önce uygulamayı günceller;
uygulama yeniden başlatıldıktan sonra `openclaw update --tag <app-version> --json` çalıştırır, Gateway'ini
yeniden başlatır ve kurulum tarzı bir ilerleme penceresinde sistem durumunu doğrular. Pencere
yalnızca yönetilen Gateway'in güncellenmesi, onarılması veya kurulması gerektiğinde görünür;
yalnızca uygulamayı etkileyen güncellemeler doğrudan uygulamada yeniden başlatılır. Hata ayrıntıları
Yeniden Dene, [Güncelleme kılavuzu](/tr/install/updating) ve [Discord](https://discord.gg/clawd) eylemleriyle görünür
kalır. Uygulama bu eşgüdümlü yolu uzak veya harici olarak yönetilen bir Gateway için asla
kullanmaz, daha yeni bir Gateway'in sürümünü asla düşürmez ve bir `extended-stable`
kanal sabitlemesini asla geçersiz kılmaz.

Güncelleme başarılı olduğunda uygulama, gerçek bir kullanıcı/kanal etkileşimi içeren en son
üst düzey doğrudan oturum için tek seferlik bir karşılama olayı kuyruğa alır. Cron çalıştırmaları,
Heartbeat'ler ve yalnızca arka planda gerçekleşen oturum güncellemeleri bu seçimi değiştirmez. Uzak
modda uygulama yalnızca yerel Mac Node çalışma zamanını günceller ve olayı yalnızca bağlı uzak
Gateway en az uygulama kadar yeniyse gönderir.

## Güncellemeden sonra

<Steps>

### Doctor'ı çalıştırın

```bash
openclaw doctor
```

Yapılandırmayı taşır, DM politikalarını denetler ve Gateway sistem durumunu kontrol eder. Ayrıntılar: [Doctor](/tr/gateway/doctor)

### Gateway'i yeniden başlatın

```bash
openclaw gateway restart
```

### Doğrulayın

```bash
openclaw health
```

</Steps>

## Geri alma

Geri alma iki katmandan oluşur:

1. Mevcut durumu koruyarak eski OpenClaw kodunu yeniden kurun.
2. Yalnızca eski kod taşınmış bir yapılandırmayı veya veritabanını kullanamıyorsa
   güncelleme öncesi durumu geri yükleyin.

Önce yalnızca kodu geri almayı deneyin. Durumu geri yüklemek, yedeklemeden sonra
yapılan değişiklikleri siler.

### Güncellemeden önce: doğrulanmış bir yedek oluşturun

`openclaw update` otomatik bir güncelleme öncesi yapılandırma kopyasını korur ancak
tam bir durum kurtarma noktası oluşturmaz. Önemli bir güncellemeden önce açıkça
bir tane oluşturun:

```bash
mkdir -p ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
```

Arşiv bildirimi, OpenClaw sürümünü ve yedeklemeye dahil edilen kaynak yolları
kaydeder. Arşiv kimlik bilgileri, kimlik doğrulama profilleri ve kanal durumu
içerebilir; bu nedenle arşivi yalnızca sahibin erişebileceği izinlerle ve canlı
durum diziniyle aynı koruma düzeyinde saklayın. Dahil edilen ve kasıtlı olarak
hariç tutulan dosyalar için [Yedekleme](/tr/cli/backup) bölümüne bakın.

Taşınabilir arşivden hariç tutulan geçici yapıları da içeren, bayt bayt aynı
bir kurtarma noktası için Gateway'i durdurun ve platformunuzun sağladığı bir
dosya sistemi, birim veya VM anlık görüntüsünü kullanın.

### Paket kurulumunu geri alma

Yayımlanmış sürümleri listeleyin, ardından sorunsuz çalıştığı bilinen sürümü önizleyip kurun:

```bash
npm view openclaw versions --json
openclaw update --tag <known-good-version> --dry-run
openclaw update --tag <known-good-version>
```

Doğrudan paket yöneticisiyle kurulum yerine `openclaw update --tag` tercih edilir. Bu,
sürüm düşürmeyi algılar, onay ister, yönetilen Plugin yakınsamasını ve kurulu
hedefe yönelik uyumluluk kontrollerini çalıştırır, hizmet meta verilerini yeniler,
Gateway'i yeniden başlatır ve çalışan sürümü doğrular. Saklanan kanal
`extended-stable` ise `--channel stable --tag <known-good-version>` kullanın; çünkü tek seferlik tam etiketler
`extended-stable` seçicisiyle birleştirilemez.

Paket güncellemeleri, etkinleştirmeden önce adayı hazırlar ve doğrular. Dosya
sistemi değişimi veya komut shim'i değiştirme işlemi başarısız olursa OpenClaw
eski paketi otomatik olarak geri yükler. Başarılı bir değişimden sonra Gateway
sistem durumu kontrolü başarısız olursa paket yeniden otomatik olarak değiştirilmez;
bunun yerine önceki sürüm ve elle geri alma talimatları bildirilir.

CLI güncelleme yolu kullanılamıyorsa mevcut Gateway'in sahibi olan paket yöneticisini
ve kurulum kapsamını kullanın:

```bash
openclaw gateway stop
npm i -g openclaw@<known-good-version>
openclaw gateway install --force
openclaw gateway restart
```

Kurulumun sahibi ilgili yönetici olduğunda `npm` yerine `pnpm`
veya `bun` kullanın. Olay kurtarma sırasında etkin bir otomatik güncelleyicinin
daha yeni bir sürümü hemen uygulamasını önlemek için Gateway ortamında
`OPENCLAW_NO_AUTO_UPDATE=1` ayarlayın.

### Kaynak kod çalışma kopyasını geri alma

Temiz bir çalışma kopyası kullanın ve sorunsuz çalıştığı bilinen bir etiketi veya commit'i seçin:

```bash
git fetch --all --tags
git checkout --detach <known-good-tag-or-commit>
pnpm install && pnpm build
openclaw gateway restart
```

En son sürüme dönmek için: `git checkout main && git pull`.

Güncelleyici, bir git güncellemesi başladıktan sonra bağımlılık kurulumu, derleme,
UI derlemesi veya doctor başarısız olursa git çalışma kopyasını otomatik olarak
önceki dalına ve SHA'sına döndürür. Kasıtlı olarak daha eski bir commit seçtiğinizde
elle checkout işlemi yine de gereklidir.

### Oturum SQLite taşıması üzerinden sürüm düşürme

Dosya tabanlı eski bir OpenClaw sürümünü başlatmadan önce arşivlenmiş eski transkript
yapılarını geri yüklemek için mevcut CLI'ı kullanın:

```bash
openclaw gateway stop
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Bu işlem SQLite verilerini silmez. SQLite taşımasından sonra oluşturulan oturumlar
yalnızca SQLite'ta bulunur ve eski çalışma zamanında görünmez. Bkz.
[Oturum SQLite taşımasından sonra sürüm düşürme](/tr/cli/doctor#downgrading-after-session-sqlite-migration).

### Durumu yalnızca gerektiğinde geri yükleyin

Eski kod daha yeni bir yapılandırmayı veya veritabanı şemasını okuyamıyorsa
Gateway'i durdurun ve doğrulanmış güncelleme öncesi dosya sistemi, birim veya VM
anlık görüntüsünü geri yükleyin. Bu işlem anlık görüntüden sonra yapılan değişiklikleri
sileceğinden, geri yüklemeden önce mevcut durumu ayrı olarak koruyun.

Geniş kapsamlı `openclaw backup create` arşivleri oluşturma ve doğrulamayı destekler ancak
arşivin tamamını yerinde etkinleştirmeyi desteklemez. Geniş kapsamlı bir arşivi
hazırlama dizinine çıkarın ve çevrimdışı geri yükleme için arşivin
`manifest.json` kaynaktan arşive eşlemesini kullanın. Benzer şekilde
`openclaw backup sqlite restore` yeni bir hedefe doğrulanmış bir veritabanı yazar; bu hedefin
etkinleştirilmesi açıkça gerçekleştirilmesi gereken çevrimdışı bir operatör adımıdır.

### Geri alma işlemini doğrulayın

```bash
openclaw --version
openclaw health
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

## Takılırsanız

- `openclaw doctor` komutunu yeniden çalıştırın ve çıktıyı dikkatlice okuyun.
- Kaynak kod çalışma kopyalarındaki `openclaw update --channel dev` için güncelleyici, gerektiğinde `pnpm` bileşenini otomatik olarak önyükler. Bir pnpm/corepack önyükleme hatası görürseniz `pnpm` bileşenini elle kurun (veya `corepack` bileşenini yeniden etkinleştirin) ve güncellemeyi tekrar çalıştırın.
- Şurayı kontrol edin: [Sorun giderme](/tr/gateway/troubleshooting)
- Discord'da sorun: [https://discord.gg/clawd](https://discord.gg/clawd)

## İlgili

- [Kuruluma genel bakış](/tr/install): tüm kurulum yöntemleri.
- [Doctor](/tr/gateway/doctor): güncellemelerden sonraki sistem durumu kontrolleri.
- [Taşıma](/tr/install/migrating): ana sürüm taşıma kılavuzları.
