---
read_when:
    - OpenClaw'ı Güncelleme
    - Bir güncellemeden sonra bir şey bozuluyor
summary: OpenClaw’ı güvenli şekilde güncelleme (global kurulum veya kaynak) ve geri alma stratejisi
title: Güncelleme
x-i18n:
    generated_at: "2026-05-07T13:21:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
    source_path: install/updating.md
    workflow: 16
---

OpenClaw'ı güncel tutun.

## Önerilen: `openclaw update`

Güncellemenin en hızlı yolu. Kurulum türünüzü (npm veya git) algılar, en son sürümü getirir, `openclaw doctor` çalıştırır ve gateway'i yeniden başlatır.

```bash
openclaw update
```

Kanalları değiştirmek veya belirli bir sürümü hedeflemek için:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update`, `--verbose` kabul etmez. Güncelleme tanılaması için planlanan eylemleri önizlemek üzere
`--dry-run`, yapılandırılmış sonuçlar için `--json` veya kanal ve kullanılabilirlik durumunu incelemek için
`openclaw update status --json` kullanın. Yükleyicinin kendi `--verbose` bayrağı vardır, ancak bu bayrak
`openclaw update` parçası değildir.

`--channel beta` beta'yı tercih eder, ancak beta etiketi eksikse veya en son kararlı sürümden eskiyse
çalışma zamanı kararlı/en son sürüme geri döner. Tek seferlik paket güncellemesi için ham npm beta dist-tag'ini istiyorsanız `--tag beta`
kullanın.

Kanal semantiği için [Geliştirme kanalları](/tr/install/development-channels) bölümüne bakın.

## npm ve git kurulumları arasında geçiş yapın

Kurulum türünü değiştirmek istediğinizde kanalları kullanın. Güncelleyici
durumunuzu, yapılandırmanızı, kimlik bilgilerinizi ve çalışma alanınızı `~/.openclaw` içinde tutar; yalnızca
CLI ve gateway'in hangi OpenClaw kod kurulumunu kullandığını değiştirir.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Kesin kurulum modu geçişini önizlemek için önce `--dry-run` ile çalıştırın:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` kanalı bir git checkout'u sağlar, onu derler ve global CLI'yi
bu checkout'tan kurar. `stable` ve `beta` kanalları paket kurulumlarını kullanır. Gateway
zaten kuruluysa, `openclaw update` servis meta verilerini yeniler
ve `--no-restart` geçmediğiniz sürece yeniden başlatır.

## Alternatif: yükleyiciyi yeniden çalıştırın

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

İlk kurulumu atlamak için `--no-onboard` ekleyin. Yükleyici üzerinden belirli bir kurulum türünü zorlamak için
`--install-method git --no-onboard` veya
`--install-method npm --no-onboard` geçin.

`openclaw update`, npm paket kurulum aşamasından sonra başarısız olursa
yükleyiciyi yeniden çalıştırın. Yükleyici eski güncelleyiciyi çağırmaz; global
paket kurulumunu doğrudan çalıştırır ve kısmen güncellenmiş bir npm kurulumunu kurtarabilir.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Kurtarmayı belirli bir sürüme veya dist-tag'e sabitlemek için `--version` ekleyin:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatif: manuel npm, pnpm veya bun

```bash
npm i -g openclaw@latest
```

Denetimli kurulumlar için `openclaw update` tercih edin, çünkü paket değişimini
çalışan Gateway servisiyle koordine edebilir. Yönetilen bir Gateway çalışırken
manuel güncelleme yaparsanız, paket yöneticisi tamamlandıktan hemen sonra Gateway'i yeniden başlatın;
böylece eski süreç, değiştirilmiş paket dosyalarından sunmaya devam etmez.

`openclaw update` global bir npm kurulumunu yönettiğinde, hedefi önce
geçici bir npm prefix'ine kurar, paketlenmiş `dist` envanterini doğrular, sonra temiz
paket ağacını gerçek global prefix'e taşır. Bu, npm'in yeni paketi eski paketten kalan bayat dosyaların üzerine
bindirmesini önler. Kurulum komutu başarısız olursa,
OpenClaw `--omit=optional` ile bir kez daha dener. Bu yeniden deneme, yerel
isteğe bağlı bağımlılıkların derlenemediği makinelerde yardımcı olurken, yedek de başarısız olursa
asıl hatayı görünür tutar.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Gelişmiş npm kurulum konuları

<AccordionGroup>
  <Accordion title="Salt okunur paket ağacı">
    OpenClaw, global paket dizini mevcut kullanıcı tarafından yazılabilir olsa bile paketlenmiş global kurulumları çalışma zamanında salt okunur kabul eder. Plugin paket kurulumları, kullanıcı yapılandırma dizini altındaki OpenClaw sahipli npm/git köklerinde bulunur ve Gateway başlangıcı OpenClaw paket ağacını değiştirmez.

    Bazı Linux npm kurulumları global paketleri `/usr/lib/node_modules/openclaw` gibi root sahipli dizinler altına kurar. OpenClaw bu düzeni destekler, çünkü Plugin kurulum/güncelleme komutları bu global paket dizininin dışına yazar.

  </Accordion>
  <Accordion title="Güçlendirilmiş systemd birimleri">
    OpenClaw'a yapılandırma/durum köklerine yazma erişimi verin; böylece açık Plugin kurulumları, Plugin güncellemeleri ve doctor temizliği değişikliklerini kalıcı hale getirebilir:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk alanı ön kontrolü">
    Paket güncellemeleri ve açık Plugin kurulumlarından önce OpenClaw, hedef birim için en iyi çaba düzeyinde bir disk alanı kontrolü dener. Düşük alan, kontrol edilen yolla birlikte bir uyarı üretir, ancak dosya sistemi kotaları, anlık görüntüler ve ağ birimleri kontrolden sonra değişebileceği için güncellemeyi engellemez. Asıl paket yöneticisi kurulumu ve kurulum sonrası doğrulama belirleyici olmaya devam eder.
  </Accordion>
</AccordionGroup>

## Otomatik güncelleyici

Otomatik güncelleyici varsayılan olarak kapalıdır. `~/.openclaw/openclaw.json` içinde etkinleştirin:

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

| Kanal    | Davranış                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` kadar bekler, sonra `stableJitterHours` boyunca deterministik jitter ile uygular (yayılmış dağıtım). |
| `beta`   | Her `betaCheckIntervalHours` aralığında kontrol eder (varsayılan: saatlik) ve hemen uygular.                  |
| `dev`    | Otomatik uygulama yoktur. `openclaw update` komutunu manuel kullanın.                                         |

Gateway ayrıca başlangıçta bir güncelleme ipucu günlüğe yazar (`update.checkOnStart: false` ile devre dışı bırakın).
Sürüm düşürme veya olay kurtarma için, `update.auto.enabled` yapılandırılmış olsa bile otomatik uygulamaları engellemek üzere gateway ortamında `OPENCLAW_NO_AUTO_UPDATE=1` ayarlayın. Başlangıç güncelleme ipuçları, `update.checkOnStart` da devre dışı bırakılmadıkça çalışmaya devam edebilir.

Canlı Gateway kontrol düzlemi işleyicisi üzerinden istenen paket yöneticisi güncellemeleri,
paket değişiminden sonra ertelenmeyen, soğuma süresi olmayan bir güncelleme yeniden başlatmasını zorlar. Bu,
eski bellek içi sürecin, zaten değiştirilmiş bir paket ağacından parçaları tembel yükleyecek kadar uzun süre
ortada kalmasını önler. Shell `openclaw update`, servisi güncelleme etrafında durdurup
yeniden başlatabildiği için denetimli kurulumlarda tercih edilen yol olmaya devam eder.

## Güncellemeden sonra

<Steps>

### Doctor çalıştırın

```bash
openclaw doctor
```

Yapılandırmayı taşır, DM ilkelerini denetler ve gateway sağlığını kontrol eder. Ayrıntılar: [Doctor](/tr/gateway/doctor)

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

### Bir sürüme sabitleyin (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` mevcut yayımlanmış sürümü gösterir.
</Tip>

### Bir commit'e sabitleyin (kaynak)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

En son sürüme dönmek için: `git checkout main && git pull`.

## Takılırsanız

- `openclaw doctor` komutunu yeniden çalıştırın ve çıktıyı dikkatle okuyun.
- Kaynak checkout'larında `openclaw update --channel dev` için güncelleyici gerektiğinde `pnpm`'i otomatik olarak önyükler. Bir pnpm/corepack önyükleme hatası görürseniz, `pnpm`'i manuel kurun (veya `corepack`'i yeniden etkinleştirin) ve güncellemeyi tekrar çalıştırın.
- Kontrol edin: [Sorun giderme](/tr/gateway/troubleshooting)
- Discord'da sorun: [https://discord.gg/clawd](https://discord.gg/clawd)

## İlgili

- [Kurulum özeti](/tr/install): tüm kurulum yöntemleri.
- [Doctor](/tr/gateway/doctor): güncellemelerden sonra sağlık kontrolleri.
- [Geçiş](/tr/install/migrating): büyük sürüm geçiş kılavuzları.
