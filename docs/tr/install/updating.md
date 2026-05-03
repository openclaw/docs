---
read_when:
    - OpenClaw'ı Güncelleme
    - Güncellemeden sonra bir şey bozuluyor
summary: OpenClaw'ı güvenli bir şekilde güncelleme (global kurulum veya kaynak), ayrıca geri alma stratejisi
title: Güncelleme
x-i18n:
    generated_at: "2026-05-03T21:35:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9e26ea71748dfd1573cdca01126bf29ebc56be56eac604e2b6a009b463820d1
    source_path: install/updating.md
    workflow: 16
---

OpenClaw'ı güncel tutun.

## Önerilen: `openclaw update`

Güncellemenin en hızlı yolu. Kurulum türünüzü (npm veya git) algılar, en son sürümü getirir, `openclaw doctor` çalıştırır ve Gateway'i yeniden başlatır.

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

`openclaw update`, `--verbose` kabul etmez. Güncelleme tanılaması için planlanan eylemleri önizlemek üzere `--dry-run`, yapılandırılmış sonuçlar için `--json` veya kanal ve kullanılabilirlik durumunu incelemek için `openclaw update status --json` kullanın. Yükleyicinin kendi `--verbose` bayrağı vardır, ancak bu bayrak `openclaw update` parçası değildir.

`--channel beta` beta'yı tercih eder, ancak beta etiketi eksikse veya en son kararlı sürümden daha eskiyse çalışma zamanı kararlı/en son sürüme geri döner. Tek seferlik paket güncellemesi için ham npm beta dist-tag değerini istiyorsanız `--tag beta` kullanın.

Kanal semantiği için [Geliştirme kanalları](/tr/install/development-channels) bölümüne bakın.

## npm ve git kurulumları arasında geçiş yapın

Kurulum türünü değiştirmek istediğinizde kanalları kullanın. Güncelleyici durumunuzu, yapılandırmanızı, kimlik bilgilerinizi ve çalışma alanınızı `~/.openclaw` içinde korur; yalnızca CLI ve Gateway'in kullandığı OpenClaw kod kurulumunu değiştirir.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Tam kurulum modu geçişini önizlemek için önce `--dry-run` ile çalıştırın:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` kanalı bir git checkout sağlar, onu derler ve global CLI'yi o checkout'tan kurar. `stable` ve `beta` kanalları paket kurulumlarını kullanır. Gateway zaten kuruluysa, `openclaw update` servis meta verilerini yeniler ve `--no-restart` geçmediğiniz sürece onu yeniden başlatır.

## Alternatif: yükleyiciyi yeniden çalıştırın

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

İlk katılımı atlamak için `--no-onboard` ekleyin. Yükleyici üzerinden belirli bir kurulum türünü zorlamak için `--install-method git --no-onboard` veya `--install-method npm --no-onboard` geçin.

`openclaw update`, npm paket kurulum aşamasından sonra başarısız olursa yükleyiciyi yeniden çalıştırın. Yükleyici eski güncelleyiciyi çağırmaz; global paket kurulumunu doğrudan çalıştırır ve kısmen güncellenmiş bir npm kurulumunu kurtarabilir.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Kurtarmayı belirli bir sürüme veya dist-tag değerine sabitlemek için `--version` ekleyin:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatif: manuel npm, pnpm veya bun

```bash
npm i -g openclaw@latest
```

`openclaw update` global npm kurulumunu yönettiğinde, hedefi önce geçici bir npm prefix'ine kurar, paketlenmiş `dist` envanterini doğrular ve ardından temiz paket ağacını gerçek global prefix'e taşır. Bu, npm'in yeni bir paketi eski paketten kalmış bayat dosyaların üzerine bindirmesini önler. Kurulum komutu başarısız olursa OpenClaw, `--omit=optional` ile bir kez daha dener. Bu yeniden deneme, yerel isteğe bağlı bağımlılıkların derlenemediği ana makinelere yardımcı olurken, geri dönüş de başarısız olursa özgün hatayı görünür tutar.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Gelişmiş npm kurulum konuları

<AccordionGroup>
  <Accordion title="Salt okunur paket ağacı">
    OpenClaw, global paket dizini geçerli kullanıcı tarafından yazılabilir olsa bile paketlenmiş global kurulumları çalışma zamanında salt okunur kabul eder. Plugin paket kurulumları, kullanıcı yapılandırma dizini altındaki OpenClaw'a ait npm/git köklerinde bulunur ve Gateway başlatması OpenClaw paket ağacını değiştirmez.

    Bazı Linux npm kurulumları global paketleri `/usr/lib/node_modules/openclaw` gibi root'a ait dizinlerin altına kurar. OpenClaw bu düzeni destekler çünkü Plugin kurulum/güncelleme komutları bu global paket dizininin dışına yazar.

  </Accordion>
  <Accordion title="Sıkılaştırılmış systemd birimleri">
    Açık Plugin kurulumlarının, Plugin güncellemelerinin ve doctor temizliğinin değişikliklerini kalıcı hale getirebilmesi için OpenClaw'a yapılandırma/durum köklerine yazma erişimi verin:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk alanı ön kontrolü">
    Paket güncellemelerinden ve açık Plugin kurulumlarından önce OpenClaw, hedef birim için en iyi çabayla bir disk alanı denetimi yapmayı dener. Düşük alan, denetlenen yolu içeren bir uyarı üretir, ancak güncellemeyi engellemez çünkü dosya sistemi kotaları, anlık görüntüler ve ağ birimleri denetimden sonra değişebilir. Asıl paket yöneticisi kurulumu ve kurulum sonrası doğrulama yetkili olmaya devam eder.
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
| `stable` | `stableDelayHours` kadar bekler, ardından `stableJitterHours` genelinde deterministik jitter ile uygular (yayılmış dağıtım). |
| `beta`   | Her `betaCheckIntervalHours` aralığında denetler (varsayılan: saatlik) ve hemen uygular.                              |
| `dev`    | Otomatik uygulama yoktur. `openclaw update` komutunu manuel kullanın.                                                           |

Gateway ayrıca başlatma sırasında bir güncelleme ipucu günlüğe yazar (`update.checkOnStart: false` ile devre dışı bırakın).
Sürüm düşürme veya olay kurtarma için Gateway ortamında `OPENCLAW_NO_AUTO_UPDATE=1` ayarlayarak `update.auto.enabled` yapılandırılmış olsa bile otomatik uygulamaları engelleyin. `update.checkOnStart` da devre dışı bırakılmadığı sürece başlatma güncelleme ipuçları yine çalışabilir.

Canlı Gateway kontrol düzlemi işleyicisi üzerinden istenen paket yöneticisi güncellemeleri, paket değişiminden sonra ertelenmeyen ve bekleme süresi olmayan bir güncelleme yeniden başlatmasını zorlar. Bu, eski bir bellek içi sürecin, zaten değiştirilmiş bir paket ağacından parçaları tembel yükleyecek kadar uzun süre kalmasını önler. Kabuk `openclaw update`, denetimli kurulumlar için tercih edilen yol olmaya devam eder çünkü servisi güncelleme sırasında durdurup yeniden başlatabilir.

## Güncellemeden sonra

<Steps>

### Doctor çalıştırın

```bash
openclaw doctor
```

Yapılandırmayı taşır, DM ilkelerini denetler ve Gateway sağlığını kontrol eder. Ayrıntılar: [Doctor](/tr/gateway/doctor)

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
`npm view openclaw version` geçerli yayımlanmış sürümü gösterir.
</Tip>

### Bir commit'e sabitleyin (kaynak)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

En son sürüme dönmek için: `git checkout main && git pull`.

## Takılı kalırsanız

- `openclaw doctor` komutunu yeniden çalıştırın ve çıktıyı dikkatle okuyun.
- Kaynak checkout'larında `openclaw update --channel dev` için güncelleyici gerektiğinde `pnpm`'i otomatik olarak hazırlar. Bir pnpm/corepack hazırlama hatası görürseniz `pnpm`'i manuel kurun (veya `corepack`'i yeniden etkinleştirin) ve güncellemeyi yeniden çalıştırın.
- Kontrol edin: [Sorun giderme](/tr/gateway/troubleshooting)
- Discord'da sorun: [https://discord.gg/clawd](https://discord.gg/clawd)

## İlgili

- [Kurulum genel bakışı](/tr/install): tüm kurulum yöntemleri.
- [Doctor](/tr/gateway/doctor): güncellemelerden sonra sağlık denetimleri.
- [Geçiş](/tr/install/migrating): ana sürüm geçiş kılavuzları.
