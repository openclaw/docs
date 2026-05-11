---
read_when:
    - OpenClaw'ı Güncelleme
    - Güncellemeden sonra bir şey bozuluyor
summary: OpenClaw’ı güvenle güncelleme (global kurulum veya kaynak) ve geri alma stratejisi
title: Güncelleniyor
x-i18n:
    generated_at: "2026-05-11T20:32:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb1506ed87b1cf2e4928987c9dbfaff17d47b87f6c18239d694e0f55deb609f7
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

`openclaw update`, `--verbose` kabul etmez. Güncelleme tanılamaları için planlanan eylemleri önizlemek üzere `--dry-run`, yapılandırılmış sonuçlar için `--json` veya kanal ve kullanılabilirlik durumunu incelemek için `openclaw update status --json` kullanın. Kurucunun kendi `--verbose` bayrağı vardır, ancak bu bayrak `openclaw update` kapsamına dahil değildir.

`--channel beta` betayı tercih eder, ancak beta etiketi eksikse veya en son kararlı sürümden daha eskiyse çalışma zamanı kararlı/en son sürüme geri döner. Tek seferlik bir paket güncellemesi için ham npm beta dist-tag değerini istiyorsanız `--tag beta` kullanın.

Yönetilen plugin'ler için beta kanalı geri dönüşü bir uyarıdır: plugin betası mevcut olmadığı için bir plugin kayıtlı varsayılan/en son sürümünü kullanırken çekirdek güncellemesi yine de başarılı olabilir.

Kanal anlamları için [Geliştirme kanalları](/tr/install/development-channels) bölümüne bakın.

## npm ve git kurulumları arasında geçiş yapın

Kurulum türünü değiştirmek istediğinizde kanalları kullanın. Güncelleyici durumunuzu, yapılandırmanızı, kimlik bilgilerinizi ve çalışma alanınızı `~/.openclaw` içinde tutar; yalnızca CLI ve Gateway'in hangi OpenClaw kod kurulumunu kullandığını değiştirir.

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

`dev` kanalı bir git checkout sağlar, onu derler ve global CLI'yi bu checkout'tan yükler. `stable` ve `beta` kanalları paket kurulumlarını kullanır. Gateway zaten kuruluysa, `openclaw update` servis metaverilerini yeniler ve `--no-restart` geçmediğiniz sürece yeniden başlatır.

## Alternatif: kurucuyu yeniden çalıştırın

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

İlk kurulumu atlamak için `--no-onboard` ekleyin. Kurucu üzerinden belirli bir kurulum türünü zorlamak için `--install-method git --no-onboard` veya `--install-method npm --no-onboard` geçin.

`openclaw update`, npm paket kurulum aşamasından sonra başarısız olursa kurucuyu yeniden çalıştırın. Kurucu eski güncelleyiciyi çağırmaz; global paket kurulumunu doğrudan çalıştırır ve kısmen güncellenmiş bir npm kurulumunu kurtarabilir.

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

Denetimli kurulumlar için `openclaw update` tercih edin, çünkü paket değişimini çalışan Gateway servisiyle koordine edebilir. Yönetilen bir Gateway çalışırken manuel güncelleme yaparsanız, paket yöneticisi tamamlanır tamamlanmaz Gateway'i yeniden başlatın; böylece eski süreç, değiştirilmiş paket dosyalarından hizmet vermeyi sürdürmez.

`openclaw update` global bir npm kurulumunu yönettiğinde, hedefi önce geçici bir npm önekine yükler, paketlenmiş `dist` envanterini doğrular ve ardından temiz paket ağacını gerçek global öneke taşır. Bu, npm'in yeni bir paketi eski paketten kalan bayat dosyaların üzerine yerleştirmesini önler. Kurulum komutu başarısız olursa OpenClaw `--omit=optional` ile bir kez yeniden dener. Bu yeniden deneme, yerel isteğe bağlı bağımlılıkların derlenemediği host'larda yardımcı olurken, geri dönüş de başarısız olursa özgün hatayı görünür tutar.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Gelişmiş npm kurulum konuları

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw, global paket dizini geçerli kullanıcı tarafından yazılabilir olsa bile, paketlenmiş global kurulumları çalışma zamanında salt okunur olarak ele alır. Plugin paket kurulumları, kullanıcı yapılandırma dizini altındaki OpenClaw'a ait npm/git köklerinde bulunur ve Gateway başlangıcı OpenClaw paket ağacını değiştirmez.

    Bazı Linux npm kurulumları, global paketleri `/usr/lib/node_modules/openclaw` gibi root'a ait dizinlerin altına yükler. OpenClaw bu düzeni destekler, çünkü plugin kurulum/güncelleme komutları bu global paket dizininin dışına yazar.

  </Accordion>
  <Accordion title="Hardened systemd units">
    Açık plugin kurulumları, plugin güncellemeleri ve doctor temizliği değişikliklerini kalıcı hale getirebilsin diye OpenClaw'a yapılandırma/durum köklerine yazma erişimi verin:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    Paket güncellemelerinden ve açık plugin kurulumlarından önce OpenClaw, hedef birim için elinden gelen en iyi disk alanı denetimini dener. Düşük alan, denetlenen yolla birlikte bir uyarı üretir, ancak güncellemeyi engellemez; çünkü dosya sistemi kotaları, snapshot'lar ve ağ birimleri denetimden sonra değişebilir. Asıl paket yöneticisi kurulumu ve kurulum sonrası doğrulama yetkili olmaya devam eder.
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
| `stable` | `stableDelayHours` kadar bekler, ardından `stableJitterHours` boyunca deterministik jitter ile uygular (yayılmış dağıtım). |
| `beta`   | Her `betaCheckIntervalHours` aralığında denetler (varsayılan: saatlik) ve hemen uygular.                      |
| `dev`    | Otomatik uygulama yoktur. `openclaw update` komutunu manuel kullanın.                                         |

Gateway ayrıca başlangıçta bir güncelleme ipucu günlüğe yazar (`update.checkOnStart: false` ile devre dışı bırakın).
Sürüm düşürme veya olay kurtarma için, `update.auto.enabled` yapılandırılmış olsa bile otomatik uygulamaları engellemek üzere Gateway ortamında `OPENCLAW_NO_AUTO_UPDATE=1` ayarlayın. `update.checkOnStart` da devre dışı bırakılmadığı sürece başlangıç güncelleme ipuçları çalışmaya devam edebilir.

Canlı Gateway denetim düzlemi işleyicisi üzerinden istenen paket yöneticisi güncellemeleri, paket değişiminden sonra ertelenmeyen ve bekleme süresi olmayan bir güncelleme yeniden başlatmasını zorlar. Bu, eski bellek içi sürecin, zaten değiştirilmiş bir paket ağacından parçaları lazy-load edecek kadar uzun süre ortada kalmasını önler. Shell `openclaw update`, servisi güncelleme etrafında durdurup yeniden başlatabildiği için denetimli kurulumlarda tercih edilen yol olmaya devam eder.

## Güncellemeden sonra

<Steps>

### Doctor'ı çalıştırın

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

## Takılırsanız

- `openclaw doctor` komutunu yeniden çalıştırın ve çıktıyı dikkatle okuyun.
- Kaynak checkout'larında `openclaw update --channel dev` için güncelleyici gerektiğinde `pnpm`'i otomatik olarak bootstraps eder. Bir pnpm/corepack bootstrap hatası görürseniz `pnpm`'i manuel yükleyin (veya `corepack`'i yeniden etkinleştirin) ve güncellemeyi yeniden çalıştırın.
- Denetleyin: [Sorun giderme](/tr/gateway/troubleshooting)
- Discord'da sorun: [https://discord.gg/clawd](https://discord.gg/clawd)

## İlgili

- [Kurulum genel bakışı](/tr/install): tüm kurulum yöntemleri.
- [Doctor](/tr/gateway/doctor): güncellemelerden sonra sağlık denetimleri.
- [Geçiş](/tr/install/migrating): ana sürüm geçiş kılavuzları.
