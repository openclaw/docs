---
read_when:
    - OpenClaw'ı Güncelleme
    - Güncellemeden sonra bir şey bozuluyor
summary: OpenClaw'u güvenli şekilde güncelleme (global kurulum veya kaynak), ayrıca geri alma stratejisi
title: Güncelleme
x-i18n:
    generated_at: "2026-05-07T01:53:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520f30980c56b9bcfc78bb2e916df812b2770a88c663140eeee3e9697bf58ee6
    source_path: install/updating.md
    workflow: 16
---

OpenClaw'u güncel tutun.

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
openclaw update --dry-run   # uygulamadan önce önizle
```

`openclaw update`, `--verbose` kabul etmez. Güncelleme tanılaması için, planlanan eylemleri önizlemek üzere
`--dry-run`, yapılandırılmış sonuçlar için `--json` veya kanal ve kullanılabilirlik durumunu incelemek için
`openclaw update status --json` kullanın. Yükleyicinin kendi `--verbose` bayrağı vardır, ancak bu bayrak
`openclaw update` parçası değildir.

`--channel beta` beta'yı tercih eder, ancak beta etiketi eksikse veya en son kararlı sürümden daha eskiyse çalışma zamanı stable/latest'e geri döner. Tek seferlik bir paket güncellemesi için ham npm beta dist-tag istiyorsanız `--tag beta` kullanın.

OpenClaw henüz bir LTS veya aylık destek güncelleme kanalı sunmuyor. SemVer uyumlu aylık destek hatlarına doğru çalışıyoruz, ancak bugün desteklenen kanallar hâlâ `stable`, `beta` ve `dev`.

Kanal semantiği için [Geliştirme kanalları](/tr/install/development-channels) bölümüne bakın.

## npm ve git kurulumları arasında geçiş yapın

Kurulum türünü değiştirmek istediğinizde kanalları kullanın. Güncelleyici
`~/.openclaw` içindeki durumunuzu, yapılandırmanızı, kimlik bilgilerinizi ve çalışma alanınızı korur; yalnızca CLI ve gateway'in hangi OpenClaw kod kurulumunu kullandığını değiştirir.

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

`dev` kanalı bir git checkout olmasını sağlar, onu derler ve global CLI'yi bu checkout'tan yükler. `stable` ve `beta` kanalları paket kurulumlarını kullanır. Gateway zaten kuruluysa, `openclaw update` servis metadatasını yeniler ve `--no-restart` vermediğiniz sürece onu yeniden başlatır.

## Alternatif: yükleyiciyi yeniden çalıştırın

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Onboarding'i atlamak için `--no-onboard` ekleyin. Yükleyici üzerinden belirli bir kurulum türünü zorlamak için
`--install-method git --no-onboard` veya
`--install-method npm --no-onboard` geçin.

`openclaw update`, npm paket kurulum aşamasından sonra başarısız olursa yükleyiciyi yeniden çalıştırın. Yükleyici eski güncelleyiciyi çağırmaz; global paket kurulumunu doğrudan çalıştırır ve kısmen güncellenmiş bir npm kurulumunu kurtarabilir.

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

Denetimli kurulumlar için `openclaw update` tercih edin, çünkü paket değişimini çalışan Gateway servisiyle koordine edebilir. Yönetilen bir Gateway çalışırken manuel güncelleme yaparsanız, paket yöneticisi tamamlanır tamamlanmaz Gateway'i yeniden başlatın; böylece eski işlem, değiştirilmiş paket dosyalarından hizmet vermeye devam etmez.

`openclaw update` global bir npm kurulumunu yönettiğinde, hedefi önce geçici bir npm prefix'ine yükler, paketlenmiş `dist` envanterini doğrular, ardından temiz paket ağacını gerçek global prefix'e geçirir. Bu, npm'in yeni paketi eski paketten kalan bayat dosyaların üzerine bindirmesini önler. Kurulum komutu başarısız olursa OpenClaw `--omit=optional` ile bir kez yeniden dener. Bu yeniden deneme, yerel isteğe bağlı bağımlılıkların derlenemediği ana makinelerde yardımcı olurken, yedek yol da başarısız olursa özgün hatanın görünür kalmasını sağlar.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Gelişmiş npm kurulum konuları

<AccordionGroup>
  <Accordion title="Salt okunur paket ağacı">
    OpenClaw, global paket dizini geçerli kullanıcı tarafından yazılabilir olsa bile, paketlenmiş global kurulumları çalışma zamanında salt okunur kabul eder. Plugin paket kurulumları, kullanıcı yapılandırma dizini altındaki OpenClaw'a ait npm/git köklerinde bulunur ve Gateway başlangıcı OpenClaw paket ağacını değiştirmez.

    Bazı Linux npm kurulumları global paketleri `/usr/lib/node_modules/openclaw` gibi root'a ait dizinlerin altına yükler. OpenClaw bu düzeni destekler, çünkü plugin install/update komutları bu global paket dizininin dışına yazar.

  </Accordion>
  <Accordion title="Sıkılaştırılmış systemd birimleri">
    Açık plugin kurulumlarının, plugin güncellemelerinin ve doctor temizliğinin değişikliklerini kalıcı kılabilmesi için OpenClaw'a yapılandırma/durum köklerine yazma erişimi verin:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk alanı ön denetimi">
    Paket güncellemelerinden ve açık plugin kurulumlarından önce OpenClaw, hedef birim için en iyi çabayla bir disk alanı denetimi yapmaya çalışır. Düşük alan, denetlenen yolla birlikte bir uyarı üretir, ancak güncellemeyi engellemez; çünkü dosya sistemi kotaları, anlık görüntüler ve ağ birimleri denetimden sonra değişebilir. Asıl paket yöneticisi kurulumu ve kurulum sonrası doğrulama yetkili olmaya devam eder.
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
| `beta`   | Her `betaCheckIntervalHours` süresinde denetler (varsayılan: saatlik) ve hemen uygular.                              |
| `dev`    | Otomatik uygulama yoktur. `openclaw update` komutunu manuel kullanın.                                                           |

Gateway başlangıçta ayrıca bir güncelleme ipucu günlüğe yazar (`update.checkOnStart: false` ile devre dışı bırakın).
Sürüm düşürme veya olay kurtarması için, `update.auto.enabled` yapılandırılmış olsa bile otomatik uygulamaları engellemek üzere gateway ortamında `OPENCLAW_NO_AUTO_UPDATE=1` ayarlayın. `update.checkOnStart` da devre dışı bırakılmadıkça başlangıç güncelleme ipuçları yine de çalışabilir.

Canlı Gateway kontrol düzlemi handler'ı üzerinden istenen paket yöneticisi güncellemeleri, paket değişiminden sonra ertelenmeyen, cooldown'sız bir güncelleme yeniden başlatmasını zorlar. Bu, eski bellek içi bir işlemin, zaten değiştirilmiş bir paket ağacından parçaları lazy-load edecek kadar uzun süre ortada kalmasını önler. Kabuk `openclaw update`, servisi güncelleme etrafında durdurup yeniden başlatabildiği için denetimli kurulumlarda tercih edilen yol olmaya devam eder.

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

## Takılı kaldıysanız

- `openclaw doctor` komutunu yeniden çalıştırın ve çıktıyı dikkatle okuyun.
- Kaynak checkout'larında `openclaw update --channel dev` için güncelleyici gerektiğinde `pnpm`'i otomatik bootstraps eder. Bir pnpm/corepack bootstrap hatası görürseniz, `pnpm`'i manuel kurun (veya `corepack`'i yeniden etkinleştirin) ve güncellemeyi yeniden çalıştırın.
- Kontrol edin: [Sorun giderme](/tr/gateway/troubleshooting)
- Discord'da sorun: [https://discord.gg/clawd](https://discord.gg/clawd)

## İlgili

- [Kurulum özeti](/tr/install): tüm kurulum yöntemleri.
- [Doctor](/tr/gateway/doctor): güncellemelerden sonra sağlık kontrolleri.
- [Geçiş](/tr/install/migrating): ana sürüm geçiş kılavuzları.
