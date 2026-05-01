---
read_when:
    - OpenClaw'ı Güncelleme
    - Bir güncellemeden sonra bir şey bozuluyor
summary: OpenClaw'u güvenli şekilde güncelleme (sistem geneli kurulum veya kaynak koddan) ve geri alma stratejisi
title: Güncelleme
x-i18n:
    generated_at: "2026-05-01T09:01:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98631ce432a28af244ec22ce0cf4a23ded356dd93e9c154f502347683eef52d1
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
openclaw update --dry-run   # uygulamadan önizle
```

`--channel beta` beta sürümü tercih eder, ancak beta etiketi eksikse veya en son kararlı sürümden eskiyse çalışma zamanı stable/latest sürümüne geri döner. Tek seferlik bir paket güncellemesi için ham npm beta dist-tag değerini istiyorsanız `--tag beta` kullanın.

Kanal semantiği için [Geliştirme kanalları](/tr/install/development-channels) bölümüne bakın.

## npm ve git kurulumları arasında geçiş yapın

Kurulum türünü değiştirmek istediğinizde kanalları kullanın. Güncelleyici `~/.openclaw` içindeki durumunuzu, yapılandırmanızı, kimlik bilgilerinizi ve çalışma alanınızı korur; yalnızca CLI ve Gateway'in hangi OpenClaw kod kurulumunu kullanacağını değiştirir.

```bash
# npm paket kurulumu -> düzenlenebilir git checkout
openclaw update --channel dev

# git checkout -> npm paket kurulumu
openclaw update --channel stable
```

Kesin kurulum modu geçişini önizlemek için önce `--dry-run` ile çalıştırın:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` kanalı bir git checkout olmasını sağlar, bunu derler ve global CLI'ı bu checkout'tan kurar. `stable` ve `beta` kanalları paket kurulumlarını kullanır. Gateway zaten kuruluysa, `openclaw update` servis meta verilerini yeniler ve `--no-restart` iletmediğiniz sürece yeniden başlatır.

## Alternatif: yükleyiciyi yeniden çalıştırın

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Onboarding'i atlamak için `--no-onboard` ekleyin. Yükleyici aracılığıyla belirli bir kurulum türünü zorlamak için `--install-method git --no-onboard` veya `--install-method npm --no-onboard` iletin.

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

`openclaw update` global bir npm kurulumunu yönettiğinde, hedefi önce geçici bir npm prefix içine kurar, paketlenmiş `dist` envanterini doğrular, ardından temiz paket ağacını gerçek global prefix içine değiştirir. Bu, npm'in yeni bir paketi eski paketten kalan bayat dosyaların üzerine bindirmesini önler. Kurulum komutu başarısız olursa OpenClaw `--omit=optional` ile bir kez yeniden dener. Bu yeniden deneme, yerel optional bağımlılıkların derlenemediği ana makinelerde yardımcı olurken, geri dönüş de başarısız olursa özgün hatayı görünür tutar.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Gelişmiş npm kurulum konuları

<AccordionGroup>
  <Accordion title="Salt okunur paket ağacı">
    OpenClaw, paketlenmiş global kurulumları, global paket dizini geçerli kullanıcı tarafından yazılabilir olsa bile çalışma zamanında salt okunur olarak ele alır. Paketle birlikte gelen Plugin çalışma zamanı bağımlılıkları, paket ağacını değiştirmek yerine yazılabilir bir çalışma zamanı dizinine hazırlanır. Bu, `openclaw update` komutunun aynı kurulum sırasında Plugin bağımlılıklarını onaran çalışan bir Gateway veya yerel ajanla yarışmasını önler.

    Bazı Linux npm kurulumları global paketleri `/usr/lib/node_modules/openclaw` gibi root'a ait dizinlerin altına kurar. OpenClaw bu düzeni aynı harici hazırlama yolu üzerinden destekler.

  </Accordion>
  <Accordion title="Güçlendirilmiş systemd birimleri">
    `ReadWritePaths` içine dahil edilen yazılabilir bir hazırlama dizini ayarlayın:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` bir yol listesini de kabul eder. OpenClaw, paketle gelen Plugin çalışma zamanı bağımlılıklarını listelenen kökler boyunca soldan sağa çözer, önceki kökleri salt okunur önceden kurulmuş katmanlar olarak ele alır ve yalnızca son yazılabilir köke kurar veya orada onarır:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` ayarlanmadıysa, OpenClaw systemd sağladığında `$STATE_DIRECTORY` kullanır, ardından `~/.openclaw/plugin-runtime-deps` konumuna geri döner. Onarım adımı bu hazırlama alanını OpenClaw'a ait yerel bir paket kökü olarak ele alır ve kullanıcı npm prefix ve global ayarlarını yok sayar; böylece global kurulum npm yapılandırması, paketle gelen Plugin bağımlılıklarını `~/node_modules` veya global paket ağacına yönlendirmez.

  </Accordion>
  <Accordion title="Disk alanı ön kontrolü">
    Paket güncellemelerinden ve paketle gelen çalışma zamanı bağımlılığı onarımlarından önce OpenClaw, hedef birim için en iyi çabayla bir disk alanı denetimi yapmayı dener. Düşük alan, denetlenen yolu içeren bir uyarı üretir, ancak dosya sistemi kotaları, anlık görüntüler ve ağ birimleri denetimden sonra değişebileceği için güncellemeyi engellemez. Asıl npm kurulumu, kopyalama ve kurulum sonrası doğrulama yetkili kaynak olmaya devam eder.
  </Accordion>
  <Accordion title="Paketle gelen Plugin çalışma zamanı bağımlılıkları">
    Paketlenmiş kurulumlar, paketle gelen Plugin çalışma zamanı bağımlılıklarını salt okunur paket ağacının dışında tutar. Başlangıçta ve `openclaw doctor --fix` sırasında OpenClaw, çalışma zamanı bağımlılıklarını yalnızca yapılandırmada etkin olan, eski kanal yapılandırması üzerinden etkin olan veya paketle gelen manifest varsayılanı tarafından etkinleştirilen paketle gelen Plugin'ler için onarır. Kalıcı kanal kimlik doğrulama durumu tek başına Gateway başlangıç çalışma zamanı bağımlılığı onarımını tetiklemez.

    Açık devre dışı bırakma önceliklidir. Devre dışı bırakılmış bir Plugin veya kanal, yalnızca pakette bulunduğu için çalışma zamanı bağımlılıklarının onarılmasını sağlamaz. Harici Plugin'ler ve özel yükleme yolları hâlâ `openclaw plugins install` veya `openclaw plugins update` kullanır.

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
| `stable` | `stableDelayHours` kadar bekler, ardından `stableJitterHours` boyunca belirleyici jitter ile uygular (yayılmış dağıtım). |
| `beta`   | Her `betaCheckIntervalHours` değerinde denetler (varsayılan: saatlik) ve hemen uygular.                       |
| `dev`    | Otomatik uygulama yoktur. `openclaw update` komutunu elle kullanın.                                           |

Gateway ayrıca başlangıçta bir güncelleme ipucu günlüğe yazar (`update.checkOnStart: false` ile devre dışı bırakın).
Sürüm düşürme veya olay kurtarma için, `update.auto.enabled` yapılandırılmış olsa bile otomatik uygulamaları engellemek üzere Gateway ortamında `OPENCLAW_NO_AUTO_UPDATE=1` ayarlayın. Başlangıç güncelleme ipuçları, `update.checkOnStart` de devre dışı bırakılmadıkça çalışmaya devam edebilir.

Canlı Gateway kontrol düzlemi işleyicisi aracılığıyla istenen paket yöneticisi güncellemeleri, paket değişiminden sonra ertelenmemiş bir güncelleme yeniden başlatmasını zorunlu kılar. Bu, eski bir bellek içi sürecin zaten değiştirilmiş bir paket ağacından chunk'ları lazy-load edecek kadar uzun süre ortada kalmasını önler. Shell `openclaw update`, servisi güncelleme etrafında durdurup yeniden başlatabildiği için denetimli kurulumlar için tercih edilen yol olmaya devam eder.

## Güncellemeden sonra

<Steps>

### Doctor çalıştırın

```bash
openclaw doctor
```

Yapılandırmayı migrate eder, DM ilkelerini denetler ve Gateway sağlığını kontrol eder. Ayrıntılar: [Doctor](/tr/gateway/doctor)

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

### Bir sürümü sabitleyin (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` geçerli yayımlanmış sürümü gösterir.
</Tip>

### Bir commit'i sabitleyin (kaynak)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

En son sürüme dönmek için: `git checkout main && git pull`.

## Takılırsanız

- `openclaw doctor` komutunu yeniden çalıştırın ve çıktıyı dikkatlice okuyun.
- Kaynak checkout'larında `openclaw update --channel dev` için güncelleyici gerektiğinde `pnpm` önyüklemesini otomatik yapar. Bir pnpm/corepack önyükleme hatası görürseniz `pnpm` öğesini elle kurun (veya `corepack` öğesini yeniden etkinleştirin) ve güncellemeyi yeniden çalıştırın.
- Kontrol edin: [Sorun giderme](/tr/gateway/troubleshooting)
- Discord'da sorun: [https://discord.gg/clawd](https://discord.gg/clawd)

## İlgili

- [Kurulum genel bakışı](/tr/install): tüm kurulum yöntemleri.
- [Doctor](/tr/gateway/doctor): güncellemelerden sonra sağlık kontrolleri.
- [Migrating](/tr/install/migrating): büyük sürüm migration kılavuzları.
