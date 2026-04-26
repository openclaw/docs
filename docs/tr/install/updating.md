---
read_when:
    - OpenClaw'ı güncelleme
    - Bir güncellemeden sonra bir şey bozuluyor.
summary: OpenClaw'ı güvenli şekilde güncelleme (genel kurulum veya kaynak), ayrıca geri alma stratejisi
title: Güncelleme
x-i18n:
    generated_at: "2026-04-26T11:34:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e40ff4d2db5f0b75107894d2b4959f34f3077acb55045230fb104b95795d9149
    source_path: install/updating.md
    workflow: 15
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
openclaw update --dry-run   # uygulamadan önizle
```

`--channel beta`, beta'yı tercih eder, ancak çalışma zamanı beta etiketi eksikse veya
en son stable sürümden daha eskiyse stable/latest sürüme geri döner. Tek seferlik bir paket güncellemesi için ham npm beta dist-tag değerini istiyorsanız `--tag beta`
kullanın.

Kanal anlamları için bkz. [Geliştirme kanalları](/tr/install/development-channels).

## npm ve git kurulumları arasında geçiş

Kurulum türünü değiştirmek istediğinizde kanalları kullanın. Güncelleyici
durumunuzu, yapılandırmanızı, kimlik bilgilerinizi ve çalışma alanınızı `~/.openclaw` içinde korur; yalnızca CLI ve gateway'in kullandığı OpenClaw kod kurulumunu değiştirir.

```bash
# npm paket kurulumu -> düzenlenebilir git checkout
openclaw update --channel dev

# git checkout -> npm paket kurulumu
openclaw update --channel stable
```

Tam kurulum modu geçişini önizlemek için önce `--dry-run` ile çalıştırın:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` kanalı bir git checkout bulunduğundan emin olur, bunu derler ve genel CLI'yi
o checkout'tan kurar. `stable` ve `beta` kanalları paket kurulumlarını kullanır. Gateway
zaten kuruluysa `openclaw update`, hizmet meta verisini yeniler ve `--no-restart` vermediğiniz sürece yeniden başlatır.

## Alternatif: yükleyiciyi yeniden çalıştırın

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

İlk kurulumu atlamak için `--no-onboard` ekleyin. Yükleyici üzerinden belirli bir kurulum türünü zorlamak için
`--install-method git --no-onboard` veya
`--install-method npm --no-onboard` verin.

## Alternatif: elle npm, pnpm veya bun

```bash
npm i -g openclaw@latest
```

`openclaw update` bir genel npm kurulumunu yönettiğinde önce normal
genel kurulum komutunu çalıştırır. Bu komut başarısız olursa OpenClaw bir kez
`--omit=optional` ile yeniden dener. Bu yeniden deneme, yerel isteğe bağlı bağımlılıkların
derlenemediği hostlarda yardımcı olurken, geri dönüş de başarısız olursa
özgün hatayı görünür tutar.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Genel npm kurulumları ve çalışma zamanı bağımlılıkları

OpenClaw, paketlenmiş genel kurulumları çalışma zamanında salt okunur kabul eder; genel
paket dizini geçerli kullanıcı tarafından yazılabilir olsa bile. Paketlenmiş Plugin çalışma zamanı
bağımlılıkları, paket ağacını değiştirmek yerine yazılabilir bir çalışma zamanı dizinine aşamalanır. Bu, `openclaw update` komutunun çalışan bir gateway veya
aynı kurulum sırasında Plugin bağımlılıklarını onaran yerel ajan ile çakışmasını önler.

Bazı Linux npm kurulumları genel paketleri
`/usr/lib/node_modules/openclaw` gibi root sahipli dizinlere kurar. OpenClaw bu düzeni
aynı harici aşamalama yolu üzerinden destekler.

Sağlamlaştırılmış systemd birimleri için, `ReadWritePaths` içinde yer alan yazılabilir bir stage dizini ayarlayın:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

`OPENCLAW_PLUGIN_STAGE_DIR` ayarlanmamışsa OpenClaw, systemd sağlıyorsa önce `$STATE_DIRECTORY` kullanır,
ardından `~/.openclaw/plugin-runtime-deps` yoluna geri döner.
Onarım adımı bu stage'i OpenClaw sahipli yerel bir paket kökü olarak değerlendirir ve
kullanıcı npm prefix/genel ayarlarını yok sayar; böylece genel kurulum npm yapılandırması
paketlenmiş Plugin bağımlılıklarını `~/node_modules` veya genel paket ağacına
yeniden yönlendirmez.

Paket güncellemeleri ve paketlenmiş çalışma zamanı bağımlılığı onarımlarından önce OpenClaw,
hedef birim için en iyi çaba düzeyinde bir disk alanı denetimi yapmaya çalışır. Düşük alan,
denetlenen yol ile birlikte bir uyarı üretir, ancak dosya sistemi kotaları,
anlık görüntüler ve ağ birimleri denetimden sonra değişebileceği için güncellemeyi engellemez. Asıl npm
kurulumu, kopyalama ve kurulum sonrası doğrulama belirleyici olmaya devam eder.

### Paketlenmiş Plugin çalışma zamanı bağımlılıkları

Paketlenmiş kurulumlar, paketlenmiş Plugin çalışma zamanı bağımlılıklarını salt okunur
paket ağacının dışında tutar. Başlangıçta ve `openclaw doctor --fix` sırasında OpenClaw,
çalışma zamanı bağımlılıklarını yalnızca yapılandırmada etkin olan, eski kanal yapılandırması üzerinden etkin olan
veya paketlenmiş manifest varsayılanıyla etkinleşen paketlenmiş Plugin'ler için onarır.
Kalıcı kanal auth durumu tek başına Gateway başlangıcında
çalışma zamanı bağımlılığı onarımını tetiklemez.

Açık devre dışı bırakma kazanır. Devre dışı bırakılmış bir Plugin veya kanal,
paketin içinde bulunduğu için çalışma zamanı bağımlılıklarını onartmaz.
Harici Plugin'ler ve özel yükleme yolları hâlâ `openclaw plugins install` veya
`openclaw plugins update` kullanır.

## Otomatik güncelleyici

Otomatik güncelleyici varsayılan olarak kapalıdır. Bunu `~/.openclaw/openclaw.json` içinde etkinleştirin:

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

| Kanal    | Davranış                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| `stable` | `stableDelayHours` kadar bekler, sonra `stableJitterHours` boyunca deterministik jitter ile uygular (dağıtılmış yayın). |
| `beta`   | Her `betaCheckIntervalHours` aralığında denetler (varsayılan: saatlik) ve hemen uygular.                    |
| `dev`    | Otomatik uygulama yok. `openclaw update` komutunu elle kullanın.                                             |

Gateway ayrıca başlangıçta bir güncelleme ipucu kaydeder (`update.checkOnStart: false` ile devre dışı bırakın).

## Güncellemeden sonra

<Steps>

### Doctor çalıştırın

```bash
openclaw doctor
```

Yapılandırmayı taşır, DM ilkelerini denetler ve gateway sağlığını denetler. Ayrıntılar: [Doctor](/tr/gateway/doctor)

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

İpucu: `npm view openclaw version`, şu anda yayımlanmış sürümü gösterir.

### Bir commit'i sabitleyin (kaynak)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

En son sürüme dönmek için: `git checkout main && git pull`.

## Takılıp kalırsanız

- `openclaw doctor` komutunu tekrar çalıştırın ve çıktıyı dikkatle okuyun.
- Kaynak checkout'larında `openclaw update --channel dev` için güncelleyici gerektiğinde `pnpm`'i otomatik başlatır. Bir pnpm/corepack bootstrap hatası görürseniz, `pnpm`'i elle kurun (veya `corepack`'i yeniden etkinleştirin) ve güncellemeyi yeniden çalıştırın.
- Şuraya bakın: [Sorun giderme](/tr/gateway/troubleshooting)
- Discord'da sorun: [https://discord.gg/clawd](https://discord.gg/clawd)

## İlgili

- [Kuruluma genel bakış](/tr/install) — tüm kurulum yöntemleri
- [Doctor](/tr/gateway/doctor) — güncellemeler sonrası sağlık denetimleri
- [Taşıma](/tr/install/migrating) — büyük sürüm geçiş kılavuzları
