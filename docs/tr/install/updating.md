---
read_when:
    - OpenClaw'ı Güncelleme
    - Güncellemeden sonra bir şey bozuluyor
summary: OpenClaw'ı güvenli şekilde güncelleme (global kurulum veya kaynak), ayrıca geri alma stratejisi
title: Güncelleme
x-i18n:
    generated_at: "2026-04-30T09:30:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
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

`--channel beta` beta sürümü tercih eder, ancak beta etiketi eksikse veya en son kararlı sürümden daha eskiyse çalışma zamanı stable/latest sürümüne geri döner. Tek seferlik paket güncellemesi için ham npm beta dist-tag değerini istiyorsanız `--tag beta` kullanın.

Kanal semantiği için [Geliştirme kanalları](/tr/install/development-channels) bölümüne bakın.

## npm ve git kurulumları arasında geçiş yapma

Kurulum türünü değiştirmek istediğinizde kanalları kullanın. Güncelleyici `~/.openclaw` içindeki durumunuzu, yapılandırmanızı, kimlik bilgilerinizi ve çalışma alanınızı korur; yalnızca CLI ve Gateway'in hangi OpenClaw kod kurulumunu kullandığını değiştirir.

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

`dev` kanalı bir git checkout olmasını sağlar, onu derler ve global CLI'ı bu checkout'tan kurar. `stable` ve `beta` kanalları paket kurulumlarını kullanır. Gateway zaten kuruluysa, `openclaw update` servis meta verilerini yeniler ve `--no-restart` geçmediğiniz sürece yeniden başlatır.

## Alternatif: yükleyiciyi yeniden çalıştırma

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

İlk kurulumu atlamak için `--no-onboard` ekleyin. Yükleyici üzerinden belirli bir kurulum türünü zorlamak için `--install-method git --no-onboard` veya `--install-method npm --no-onboard` geçin.

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

`openclaw update` global bir npm kurulumunu yönettiğinde, hedefi önce geçici bir npm prefix içine kurar, paketlenmiş `dist` envanterini doğrular, ardından temiz paket ağacını gerçek global prefix içine taşır. Bu, npm'in yeni paketi eski paketten kalan bayat dosyaların üzerine bindirmesini önler. Kurulum komutu başarısız olursa, OpenClaw `--omit=optional` ile bir kez daha dener. Bu yeniden deneme, yerel optional bağımlılıkların derlenemediği host'larda yardımcı olurken, geri dönüş de başarısız olursa özgün hatayı görünür tutar.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Gelişmiş npm kurulum konuları

<AccordionGroup>
  <Accordion title="Salt okunur paket ağacı">
    OpenClaw, global paket dizini geçerli kullanıcı tarafından yazılabilir olsa bile, paketlenmiş global kurulumları çalışma zamanında salt okunur kabul eder. Paketle birlikte gelen Plugin çalışma zamanı bağımlılıkları, paket ağacını değiştirmek yerine yazılabilir bir çalışma zamanı dizinine hazırlanır. Bu, `openclaw update` işleminin aynı kurulum sırasında Plugin bağımlılıklarını onaran çalışan bir Gateway veya yerel agent ile yarışmasını önler.

    Bazı Linux npm kurulumları global paketleri `/usr/lib/node_modules/openclaw` gibi root sahipli dizinlerin altına kurar. OpenClaw bu düzeni aynı dış hazırlama yolu üzerinden destekler.

  </Accordion>
  <Accordion title="Güçlendirilmiş systemd birimleri">
    `ReadWritePaths` içine dahil edilen yazılabilir bir hazırlama dizini ayarlayın:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` bir yol listesini de kabul eder. OpenClaw, paketle gelen Plugin çalışma zamanı bağımlılıklarını listelenen kökler boyunca soldan sağa çözer, önceki kökleri salt okunur önceden kurulmuş katmanlar olarak kabul eder ve yalnızca son yazılabilir köke kurar veya onarır:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` ayarlanmamışsa, OpenClaw systemd sağladığında `$STATE_DIRECTORY` kullanır, ardından `~/.openclaw/plugin-runtime-deps` konumuna geri döner. Onarım adımı bu hazırlama alanını OpenClaw'a ait yerel paket kökü olarak kabul eder ve kullanıcı npm prefix ile global ayarlarını yok sayar; böylece global kurulum npm yapılandırması, paketle gelen Plugin bağımlılıklarını `~/node_modules` içine veya global paket ağacına yönlendirmez.

  </Accordion>
  <Accordion title="Disk alanı ön denetimi">
    Paket güncellemelerinden ve paketle gelen çalışma zamanı bağımlılığı onarımlarından önce OpenClaw, hedef birim için en iyi çabayla disk alanı denetimi yapmayı dener. Düşük alan, denetlenen yolu içeren bir uyarı üretir ancak güncellemeyi engellemez; çünkü dosya sistemi kotaları, snapshot'lar ve ağ birimleri denetimden sonra değişebilir. Gerçek npm kurulumu, kopyalama ve kurulum sonrası doğrulama yetkili kaynak olmaya devam eder.
  </Accordion>
  <Accordion title="Paketle gelen Plugin çalışma zamanı bağımlılıkları">
    Paketlenmiş kurulumlar, paketle gelen Plugin çalışma zamanı bağımlılıklarını salt okunur paket ağacının dışında tutar. Başlatma sırasında ve `openclaw doctor --fix` çalışırken OpenClaw, çalışma zamanı bağımlılıklarını yalnızca yapılandırmada aktif olan, eski kanal yapılandırması üzerinden aktif olan veya paketle gelen manifest varsayılanı tarafından etkinleştirilen paketli Plugin'ler için onarır. Kalıcı kanal kimlik doğrulama durumu tek başına Gateway başlatma çalışma zamanı bağımlılığı onarımını tetiklemez.

    Açık devre dışı bırakma önceliklidir. Devre dışı bırakılmış bir Plugin veya kanal, yalnızca pakette bulunduğu için çalışma zamanı bağımlılıklarını onartmaz. Harici Plugin'ler ve özel yükleme yolları yine `openclaw plugins install` veya `openclaw plugins update` kullanır.

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
| `beta`   | Her `betaCheckIntervalHours` aralığında denetler (varsayılan: saatlik) ve hemen uygular.                              |
| `dev`    | Otomatik uygulama yoktur. `openclaw update` komutunu manuel kullanın.                                                           |

Gateway ayrıca başlangıçta bir güncelleme ipucu günlüğe yazar (`update.checkOnStart: false` ile devre dışı bırakın).
Sürüm düşürme veya olay kurtarma için, `update.auto.enabled` yapılandırılmış olsa bile otomatik uygulamaları engellemek üzere Gateway ortamında `OPENCLAW_NO_AUTO_UPDATE=1` ayarlayın. `update.checkOnStart` da devre dışı bırakılmadıkça başlangıç güncelleme ipuçları yine çalışabilir.

## Güncellemeden sonra

<Steps>

### Doctor çalıştırın

```bash
openclaw doctor
```

Yapılandırmayı taşır, DM politikalarını denetler ve Gateway sağlığını kontrol eder. Ayrıntılar: [Doctor](/tr/gateway/doctor)

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

### Bir sürümü sabitleme (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` geçerli yayımlanmış sürümü gösterir.
</Tip>

### Bir commit'i sabitleme (kaynak)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

En son sürüme dönmek için: `git checkout main && git pull`.

## Takılırsanız

- `openclaw doctor` komutunu yeniden çalıştırın ve çıktıyı dikkatle okuyun.
- Kaynak checkout'larda `openclaw update --channel dev` için güncelleyici gerektiğinde `pnpm` için otomatik bootstrap yapar. Bir pnpm/corepack bootstrap hatası görürseniz, `pnpm`'i manuel kurun (veya `corepack`'i yeniden etkinleştirin) ve güncellemeyi tekrar çalıştırın.
- Kontrol edin: [Sorun giderme](/tr/gateway/troubleshooting)
- Discord'da sorun: [https://discord.gg/clawd](https://discord.gg/clawd)

## İlgili

- [Kurulum özeti](/tr/install): tüm kurulum yöntemleri.
- [Doctor](/tr/gateway/doctor): güncellemelerden sonra sağlık denetimleri.
- [Geçiş](/tr/install/migrating): ana sürüm geçiş kılavuzları.
