---
read_when:
    - OpenClaw'u Güncelleme
    - Bir güncellemeden sonra bir şey bozuluyor
summary: OpenClaw'u güvenli bir şekilde güncelleme (global kurulum veya kaynak koddan kurulum) ve geri alma stratejisi
title: Güncelleme
x-i18n:
    generated_at: "2026-07-12T12:25:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

OpenClaw'u güncel tutun.

Docker, Podman ve Kubernetes imaj değişimleri için
[Konteyner imajlarını yükseltme](/tr/install/docker#upgrading-container-images) bölümüne bakın. Gateway,
hazır duruma geçmeden önce başlangıç açısından güvenli yükseltme işlemlerini çalıştırır ve bağlanan
durumun elle onarılması gerekiyorsa çıkar.

## Önerilen: `openclaw update`

Kurulum türünüzü (npm veya git) algılar, en son sürümü getirir, `openclaw doctor` komutunu çalıştırır ve Gateway'i yeniden başlatır.

```bash
openclaw update
```

Kanalları değiştirin veya belirli bir sürümü hedefleyin:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # uygulamadan önizle
```

`openclaw update` komutunda `--verbose` bayrağı yoktur (yükleyicide vardır). Tanılama için
planlanan işlemleri önizlemek üzere `--dry-run`, yapılandırılmış sonuçlar için `--json` veya
kanal ve kullanılabilirlik durumunu incelemek üzere `openclaw update status --json` kullanın.

`--channel beta`, beta npm dist-tag'ini tercih eder; ancak beta etiketi yoksa veya sürümü
en son kararlı sürümden eskiyse stable/latest sürümüne geri döner.
Bunun yerine ham npm beta dist-tag'ine sabitlenmiş tek seferlik paket güncellemesi için `--tag beta` kullanın.

`--channel extended-stable` yalnızca paket kurulumları içindir ve kurulum yalnızca
ön planda gerçekleşmeye devam eder. OpenClaw, herkese açık npm `extended-stable` seçicisini okur,
seçilen tam paketi doğrular ve tam olarak bu sürümü kurar. Eksik veya
tutarsız kayıt defteri verileri güvenli biçimde başarısız olur; hiçbir zaman `latest` sürümüne geri dönmez.
Seçilen sürüm kurulu sürümden eskiyse normal
sürüm düşürme onayı yine geçerlidir. CLI, başarılı bir çekirdek
güncellemesinden sonra kanalı kalıcılaştırır; doğrudan `npm install -g openclaw@extended-stable`
çalıştırılması `update.channel` değerini güncellemez.
Çekirdek değişiminden sonra, yalın/varsayılan veya
`latest` amacı taşıyan uygun resmî npm Plugin'leri tam olarak bu çekirdek sürümüne yakınsar. Tam sürüme sabitlemeler ve açıkça belirtilen
`latest` dışı etiketler, üçüncü taraf Plugin'leri ve npm dışı kaynaklar değişmeden kalır.
Güncel OpenClaw sürümleriyle oluşturulan katalog kurulumları bu varsayılan
amacı korur. Yalnızca tam bir sürüm içeren eski kayıtlar sabitlenmiş olarak kalır; çünkü
OpenClaw eski bir otomatik sabitlemeyi kullanıcı sabitlemesinden güvenle ayırt edemez. İlgili Plugin'i yeniden tam çekirdek sürümü izlemeye dahil etmek için
extended-stable kanalında bir kez `openclaw plugins update @openclaw/name` komutunu çalıştırın.

`--channel dev`, kalıcı ve hareketli bir GitHub `main` çalışma kopyası sağlar. Tek seferlik
paket güncellemesinde `--tag main`, `github:openclaw/openclaw#main` paket
belirtimine eşlenir ve hedef paket yöneticisi (npm/pnpm/bun) üzerinden doğrudan kurulur.

Yönetilen Plugin'lerde eksik bir beta sürümü hata değil, uyarıdır:
bir Plugin kayıtlı varsayılan/latest sürümüne geri dönerken çekirdek güncellemesi yine de başarılı olabilir.

Kanal semantiği için [Sürüm kanalları](/tr/install/development-channels) bölümüne bakın.

## npm ve git kurulumları arasında geçiş yapma

Kurulum türünü değiştirmek için kanalları kullanın. Güncelleyici; durumunuzu, yapılandırmanızı,
kimlik bilgilerinizi ve çalışma alanınızı `~/.openclaw` içinde korur; yalnızca CLI ve Gateway'in
hangi OpenClaw kod kurulumunu kullandığını değiştirir.

```bash
# npm paket kurulumu -> düzenlenebilir git çalışma kopyası
openclaw update --channel dev

# git çalışma kopyası -> npm paket kurulumu
openclaw update --channel stable
```

Önce kurulum modu geçişini önizleyin:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev`, bir git çalışma kopyasının bulunmasını sağlar, bunu derler ve global CLI'ı bu
çalışma kopyasından kurar. `stable`, `extended-stable` ve `beta` kanalları paket
kurulumlarını kullanır. Extended-stable, bir git çalışma kopyasında herhangi bir değişiklik veya
dönüştürme yapılmadan reddedilir. Gateway zaten kuruluysa `openclaw update`,
`--no-restart` iletmediğiniz sürece hizmet meta verilerini yeniler ve hizmeti yeniden başlatır.

Yönetilen bir Gateway hizmetine sahip paket kurulumlarında `openclaw update`,
bu hizmetin kullandığı paket kökünü hedefler. Kabuktaki `openclaw` komutu
farklı bir kurulumdan geliyorsa güncelleyici her iki kökü ve yönetilen
hizmetin Node yolunu yazdırır; paketi değiştirmeden önce bu Node sürümünü
hedef sürümün `engines.node` gereksinimine göre denetler.

## Alternatif: yükleyiciyi yeniden çalıştırma

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

İlk katılımı atlamak için `--no-onboard` ekleyin. Belirli bir kurulum türünü zorlamak için
`--install-method git --no-onboard` veya `--install-method npm --no-onboard` iletin.

npm paket kurulumu aşamasından sonra `openclaw update` başarısız olursa bunun yerine
yükleyiciyi yeniden çalıştırın. Yükleyici güncelleyiciyi çağırmaz; global paket
kurulumunu doğrudan çalıştırır ve kısmen güncellenmiş bir npm kurulumunu kurtarabilir.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Kurtarma işlemini `--version` ile belirli bir sürüme veya dist-tag'e sabitleyin:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatif: elle npm, pnpm veya bun kullanma

```bash
npm i -g openclaw@latest
```

Denetimli kurulumlarda `openclaw update` komutunu tercih edin: Paket
değişimini çalışan Gateway hizmetiyle koordine edebilir. Denetimli bir
kurulumu elle güncelliyorsanız önce yönetilen Gateway'i durdurun. Paket yöneticileri dosyaları
yerinde değiştirir; aksi hâlde çalışan bir Gateway, değişim sırasında çekirdek veya Plugin dosyalarını
yüklemeyi deneyebilir. Paket yöneticisi tamamlandıktan sonra yeni
kurulumu kullanması için Gateway'i yeniden başlatın.

Kök kullanıcıya ait, Linux sistem genelindeki bir kurulumda `openclaw update`
`EACCES` hatasıyla başarısız olursa elle değiştirme sırasında Gateway'i durdurulmuş durumda tutarak
sistem npm'iyle kurtarma yapın. İlgili Gateway için normalde kullandığınız profil bayraklarını/ortamını kullanın.
`/usr/bin/npm` yolunu, ana makinenizde kök kullanıcıya ait
global ön ekin sahibi olan sistem npm'iyle değiştirin:

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

`openclaw update` global bir npm kurulumunu yönettiğinde önce hedefi
geçici bir npm ön ekine kurar, paketlenmiş `dist` envanterini doğrular, ardından
temiz paket ağacını gerçek global ön eke geçirir; böylece npm'in
yeni paketi eskisinden kalan bayat dosyaların üzerine bindirmesini önler. Kurulum
komutu başarısız olursa OpenClaw `--omit=optional` ile bir kez daha dener; bu, yerel isteğe bağlı
bağımlılıkların derlenemediği ana makinelerde yardımcı olur.

OpenClaw tarafından yönetilen npm güncelleme ve Plugin güncelleme komutları, alt npm
işlemi için npm'in `min-release-age` tedarik zinciri karantinasını (veya eski `before` yapılandırma anahtarını)
da temizler. Bu politika genel koruma için vardır; ancak açık bir
OpenClaw güncellemesi, "seçilen sürümü şimdi kur" anlamına gelir.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### İleri düzey npm kurulum konuları

<AccordionGroup>
  <Accordion title="Salt okunur paket ağacı">
    OpenClaw, global paket dizini mevcut kullanıcı tarafından yazılabilir olsa bile paketlenmiş global kurulumları çalışma zamanında salt okunur kabul eder. Plugin paket kurulumları, kullanıcı yapılandırma dizini altındaki OpenClaw'a ait npm/git köklerinde bulunur ve Gateway başlangıcı OpenClaw paket ağacını değiştirmez.

    Bazı Linux npm kurulumları global paketleri `/usr/lib/node_modules/openclaw` gibi kök kullanıcıya ait dizinler altına kurar. Plugin kurulum/güncelleme komutları bu global paket dizininin dışına yazdığı için OpenClaw bu düzeni destekler.

  </Accordion>
  <Accordion title="Güçlendirilmiş systemd birimleri">
    Açık Plugin kurulumlarının, Plugin güncellemelerinin ve doctor temizliğinin değişikliklerini kalıcılaştırabilmesi için OpenClaw'a yapılandırma/durum köklerine yazma erişimi verin:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk alanı ön denetimi">
    Paket güncellemelerinden ve açık Plugin kurulumlarından önce OpenClaw, hedef birim için elinden geldiğince disk alanı denetimi yapmaya çalışır. Düşük alan, denetlenen yolu içeren bir uyarı oluşturur; ancak dosya sistemi kotaları, anlık görüntüler ve ağ birimleri denetimden sonra değişebileceği için güncellemeyi engellemez. Gerçek paket yöneticisi kurulumu ve kurulum sonrası doğrulama belirleyici olmaya devam eder.
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

| Kanal             | Davranış                                                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | `stableDelayHours` (varsayılan: 6) kadar bekler, ardından dağıtılmış bir kullanıma sunma için `stableJitterHours` (varsayılan: 12) genelinde belirlenimci sapmayla uygular. |
| `extended-stable` | `checkOnStart` etkinleştirildiğinde başlangıçta ve her 24 saatte bir salt okunur güncelleme ipucunu denetler. Hiçbir zaman otomatik olarak uygulamaz.        |
| `beta`            | Her `betaCheckIntervalHours` (varsayılan: 1) saatte bir denetler ve hemen uygular.                                                                          |
| `dev`             | Otomatik uygulama yoktur. `openclaw update` komutunu elle kullanın.                                                                                        |

Gateway ayrıca başlangıçta bir güncelleme ipucu günlüğe kaydeder
(`update.checkOnStart: false` ile devre dışı bırakın). Saklanan extended-stable seçimleri bu
salt okunur ipucu yolunu ve mevcut 24 saatlik ipucu aralığını kullanır; ancak otomatik
kurulumu, devri, yeniden başlatmayı, kararlı sürüm gecikmesini/sapmasını veya beta yoklamasını hiçbir zaman başlatmaz.
Sürüm düşürme veya olay kurtarma için `update.auto.enabled` yapılandırılmış olsa bile otomatik uygulamaları engellemek üzere Gateway ortamında `OPENCLAW_NO_AUTO_UPDATE=1` ayarlayın. `update.checkOnStart` da devre dışı bırakılmadığı sürece başlangıç güncelleme ipuçları yine çalışabilir.

Canlı Gateway denetim düzlemi (`update.run`) üzerinden istenen paket yöneticisi
güncellemeleri, çalışan Gateway işlemi içindeki paket ağacını değiştirmez.
Yönetilen hizmet kurulumlarında Gateway ayrık bir devir başlatır,
çıkar ve normal `openclaw update --yes --json` CLI yolunun hizmeti durdurmasına,
paketi değiştirmesine, hizmet meta verilerini yenilemesine, yeniden başlatmasına, Gateway
sürümünü ve erişilebilirliğini doğrulamasına ve mümkün olduğunda kurulu ancak yüklenmemiş bir macOS
LaunchAgent'ı kurtarmasına izin verir. Gateway bu devri güvenle yapamazsa
`update.run`, paket yöneticisini işlem içinde çalıştırmak yerine güvenli bir kabuk komutu bildirir.

Control UI kenar çubuğundaki güncelleme kartı aynı `update.run` akışını başlatır. İmzalı
macOS uygulamasında kart önce Sparkle aracılığıyla uygulamayı günceller; uygulama yeniden başlatıldıktan sonra
yönetilen yerel Gateway'i eşleşen sürüme getirir.

## Güncellemeden sonra

<Steps>

### Doctor'ı çalıştırma

```bash
openclaw doctor
```

Yapılandırmayı taşır, DM politikalarını denetler ve Gateway sağlığını kontrol eder. Ayrıntılar: [Doctor](/tr/gateway/doctor)

### Gateway'i yeniden başlatma

```bash
openclaw gateway restart
```

### Doğrulama

```bash
openclaw health
```

</Steps>

## Geri alma

### Bir sürüme sabitleme (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version`, yayımlanmış güncel sürümü gösterir.
</Tip>

### Bir commit'e sabitleme (kaynak)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

En son sürüme dönmek için: `git checkout main && git pull`.

## Takılırsanız

- `openclaw doctor` komutunu yeniden çalıştırın ve çıktıyı dikkatle okuyun.
- Kaynak çalışma kopyalarında `openclaw update --channel dev` kullanıldığında güncelleyici, gerektiğinde `pnpm` için önyüklemeyi otomatik olarak yapar. Bir pnpm/corepack önyükleme hatası görürseniz `pnpm`'i elle kurun (veya `corepack`'i yeniden etkinleştirin) ve güncellemeyi yeniden çalıştırın.
- Şuraya bakın: [Sorun giderme](/tr/gateway/troubleshooting)
- Discord'da sorun: [https://discord.gg/clawd](https://discord.gg/clawd)

## İlgili

- [Kuruluma genel bakış](/tr/install): tüm kurulum yöntemleri.
- [Doctor](/tr/gateway/doctor): güncellemelerden sonraki sistem durumu kontrolleri.
- [Geçiş](/tr/install/migrating): ana sürümler için geçiş kılavuzları.
