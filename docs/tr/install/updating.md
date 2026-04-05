---
read_when:
    - OpenClaw'ı güncelleme
    - Bir güncellemeden sonra bir şey bozuldu
summary: OpenClaw'ı güvenli şekilde güncelleme (global kurulum veya kaynak), ayrıca geri alma stratejisi
title: Güncelleme
x-i18n:
    generated_at: "2026-04-05T13:58:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: b40429d38ca851be4fdf8063ed425faf4610a4b5772703e0481c5f1fb588ba58
    source_path: install/updating.md
    workflow: 15
---

# Güncelleme

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

`--channel beta`, beta sürümünü tercih eder, ancak çalışma zamanı beta etiketi eksikse veya en son kararlı sürümden eskiyse stable/latest sürüme geri döner. Tek seferlik bir paket güncellemesi için ham npm beta dist-tag değerini istiyorsanız `--tag beta` kullanın.

Kanal anlamları için bkz. [Development channels](/install/development-channels).

## Alternatif: yükleyiciyi yeniden çalıştırın

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Onboarding'i atlamak için `--no-onboard` ekleyin. Kaynak kurulumlarında `--install-method git --no-onboard` geçin.

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

| Kanal    | Davranış                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` kadar bekler, sonra `stableJitterHours` boyunca deterministik jitter ile uygular (aşamalı yayılım). |
| `beta`   | Her `betaCheckIntervalHours` süresinde bir denetler (varsayılan: saatlik) ve hemen uygular.                    |
| `dev`    | Otomatik uygulama yok. `openclaw update` komutunu elle kullanın.                                                |

Gateway ayrıca başlangıçta bir güncelleme ipucu da günlüğe kaydeder (`update.checkOnStart: false` ile devre dışı bırakın).

## Güncellemeden sonra

<Steps>

### Doctor çalıştırın

```bash
openclaw doctor
```

Config'i geçirir, DM ilkelerini denetler ve gateway sağlığını denetler. Ayrıntılar: [Doctor](/gateway/doctor)

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

En yeni sürüme dönmek için: `git checkout main && git pull`.

## Takılırsanız

- `openclaw doctor` komutunu yeniden çalıştırın ve çıktıyı dikkatle okuyun.
- Şunu kontrol edin: [Troubleshooting](/gateway/troubleshooting)
- Discord'da sorun: [https://discord.gg/clawd](https://discord.gg/clawd)

## İlgili

- [Install Overview](/install) — tüm kurulum yöntemleri
- [Doctor](/gateway/doctor) — güncellemelerden sonra sağlık denetimleri
- [Migrating](/install/migrating) — büyük sürüm geçiş kılavuzları
