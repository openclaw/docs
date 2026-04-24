---
read_when:
    - OpenClaw'ı güncelleme
    - Bir güncellemeden sonra bir şey bozuluyor
summary: OpenClaw'ı güvenli şekilde güncelleme (global kurulum veya kaynak), ayrıca geri alma stratejisi
title: Güncelleme
x-i18n:
    generated_at: "2026-04-24T09:17:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ed583916ce64c9f60639c8145a46ce5b27ebf5a6dfd09924312d7acfefe1ab
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
openclaw update --tag main
openclaw update --dry-run   # uygulamadan önizle
```

`--channel beta`, beta'yı tercih eder; ancak çalışma zamanı, beta etiketi eksikse veya
en son stable sürümden eskiyse stable/latest'e fallback yapar. Tek seferlik bir paket güncellemesi için ham npm beta dist-tag istiyorsanız `--tag beta`
kullanın.

Kanal semantiği için bkz. [Development channels](/tr/install/development-channels).

## Alternatif: yükleyiciyi yeniden çalıştırın

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Onboarding'i atlamak için `--no-onboard` ekleyin. Kaynak kurulumlar için `--install-method git --no-onboard` geçin.

## Alternatif: manuel npm, pnpm veya bun

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Root sahipli global npm kurulumları

Bazı Linux npm kurulumları global paketleri
`/usr/lib/node_modules/openclaw` gibi root sahipli dizinlere kurar. OpenClaw bu düzeni destekler:
kurulu paket çalışma zamanında salt okunur kabul edilir ve paket ağacını değiştirmek yerine
paketlenmiş Plugin çalışma zamanı bağımlılıkları yazılabilir bir çalışma zamanı dizinine sahnelenir.

Sertleştirilmiş systemd birimleri için, `ReadWritePaths` içinde yer alan
yazılabilir bir stage dizini ayarlayın:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

`OPENCLAW_PLUGIN_STAGE_DIR` ayarlanmamışsa OpenClaw,
systemd bunu sağladığında `$STATE_DIRECTORY` kullanır, sonra `~/.openclaw/plugin-runtime-deps` yoluna fallback yapar.

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
| `stable` | `stableDelayHours` kadar bekler, sonra `stableJitterHours` boyunca deterministik jitter ile uygular (yayılmış dağıtım). |
| `beta`   | Her `betaCheckIntervalHours` süresinde kontrol eder (varsayılan: saatlik) ve hemen uygular.               |
| `dev`    | Otomatik uygulama yok. `openclaw update` komutunu manuel kullanın.                                          |

Gateway ayrıca başlangıçta bir güncelleme ipucu da günlüğe yazar (`update.checkOnStart: false` ile devre dışı bırakın).

## Güncellemeden sonra

<Steps>

### Doctor çalıştırın

```bash
openclaw doctor
```

Config'i taşır, DM ilkelerini denetler ve gateway sağlığını kontrol eder. Ayrıntılar: [Doctor](/tr/gateway/doctor)

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

## Takılırsanız

- `openclaw doctor` komutunu tekrar çalıştırın ve çıktıyı dikkatlice okuyun.
- Kaynak checkout'larında `openclaw update --channel dev` için güncelleyici, gerektiğinde `pnpm`'i otomatik önyükler. Bir pnpm/corepack önyükleme hatası görürseniz, `pnpm`'i manuel kurun (veya `corepack`'i yeniden etkinleştirin) ve güncellemeyi yeniden çalıştırın.
- Şuna bakın: [Troubleshooting](/tr/gateway/troubleshooting)
- Discord'da sorun: [https://discord.gg/clawd](https://discord.gg/clawd)
