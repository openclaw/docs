---
read_when:
    - OpenClaw'ı Güncelleme
    - Bir güncellemeden sonra bir şey bozuluyor
summary: OpenClaw'ı güvenli şekilde güncelleme (genel kurulum veya kaynak), ayrıca geri alma stratejisi
title: Güncelleme
x-i18n:
    generated_at: "2026-04-22T04:23:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ab2b515457c64d24c830e2e1678d9fefdcf893e0489f0d99b039db3b877b3c4
    source_path: install/updating.md
    workflow: 15
---

# Güncelleme

OpenClaw'ı güncel tutun.

## Önerilen: `openclaw update`

Güncellemenin en hızlı yolu. Kurulum türünüzü (npm veya git) algılar, en son sürümü getirir, `openclaw doctor` komutunu çalıştırır ve Gateway'yi yeniden başlatır.

```bash
openclaw update
```

Kanal değiştirmek veya belirli bir sürümü hedeflemek için:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # uygulamadan önizle
```

`--channel beta`, beta sürümünü tercih eder, ancak çalışma zamanı
beta etiketi eksikse veya en son kararlı sürümden daha eskiyse kararlı/en son sürüme geri döner. Tek seferlik bir paket güncellemesi için ham npm beta dist-tag'ini istiyorsanız `--tag beta` kullanın.

Kanal anlambilimi için bkz. [Geliştirme kanalları](/tr/install/development-channels).

## Alternatif: yükleyiciyi yeniden çalıştırın

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Onboarding'i atlamak için `--no-onboard` ekleyin. Kaynak kurulumları için `--install-method git --no-onboard` geçin.

## Alternatif: elle npm, pnpm veya bun

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Root sahipli genel npm kurulumları

Bazı Linux npm kurulumları genel paketleri
`/usr/lib/node_modules/openclaw` gibi root sahipli dizinler altına kurar. OpenClaw bu düzeni destekler: kurulu
paket çalışma zamanında salt okunur kabul edilir ve paket ağacını değiştirmek yerine
paketlenmiş plugin çalışma zamanı bağımlılıkları yazılabilir bir çalışma zamanı dizinine hazırlanır.

Sıkılaştırılmış systemd birimleri için, `ReadWritePaths` içine dâhil edilen
yazılabilir bir hazırlama dizini ayarlayın:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

`OPENCLAW_PLUGIN_STAGE_DIR` ayarlanmamışsa OpenClaw, systemd bunu sağladığında `$STATE_DIRECTORY` değerini kullanır,
ardından `~/.openclaw/plugin-runtime-deps` konumuna geri döner.

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

| Kanal    | Davranış                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` kadar bekler, sonra `stableJitterHours` boyunca deterministik jitter ile uygular (yayılmış dağıtım). |
| `beta`   | Her `betaCheckIntervalHours` süresinde bir kontrol eder (varsayılan: saatlik) ve hemen uygular.             |
| `dev`    | Otomatik uygulama yoktur. `openclaw update` komutunu elle kullanın.                                          |

Gateway ayrıca başlangıçta bir güncelleme ipucu da günlüğe yazar (`update.checkOnStart: false` ile devre dışı bırakın).

## Güncellemeden sonra

<Steps>

### Doctor'ı çalıştırın

```bash
openclaw doctor
```

Yapılandırmayı geçirir, DM ilkelerini denetler ve Gateway sağlığını kontrol eder. Ayrıntılar: [Doctor](/tr/gateway/doctor)

### Gateway'yi yeniden başlatın

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

## Takılırsanız

- `openclaw doctor` komutunu yeniden çalıştırın ve çıktıyı dikkatlice okuyun.
- Kaynak checkout'larında `openclaw update --channel dev` için güncelleyici, gerektiğinde `pnpm` önyüklemesini otomatik yapar. Bir pnpm/corepack önyükleme hatası görürseniz `pnpm`'i elle kurun (veya `corepack`'i yeniden etkinleştirin) ve güncellemeyi tekrar çalıştırın.
- Kontrol edin: [Sorun giderme](/tr/gateway/troubleshooting)
- Discord'da sorun: [https://discord.gg/clawd](https://discord.gg/clawd)

## İlgili

- [Kurulum Genel Bakışı](/tr/install) — tüm kurulum yöntemleri
- [Doctor](/tr/gateway/doctor) — güncellemelerden sonra sağlık kontrolleri
- [Geçiş yapma](/tr/install/migrating) — ana sürüm geçiş kılavuzları
