---
read_when:
    - stable/beta/dev arasında geçiş yapmak istiyorsunuz
    - Belirli bir sürümü, etiketi veya SHA'yı sabitlemek istiyorsunuz
    - Ön sürümleri etiketliyor veya yayımlıyorsunuz
sidebarTitle: Release Channels
summary: 'Kararlı, beta ve geliştirme kanalları: anlamları, geçiş yapma, sabitleme ve etiketleme'
title: Sürüm kanalları
x-i18n:
    generated_at: "2026-05-07T13:21:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw üç güncelleme kanalıyla gelir:

- **stable**: npm dist-tag `latest`. Çoğu kullanıcı için önerilir.
- **beta**: güncel olduğunda npm dist-tag `beta`; beta yoksa veya en son
  stable sürümden daha eskiyse, güncelleme akışı `latest` değerine geri döner.
- **dev**: `main` dalının hareketli başı (git). npm dist-tag: `dev` (yayımlandığında).
  `main` dalı denemeler ve aktif geliştirme içindir. Eksik özellikler veya
  uyumsuz değişiklikler içerebilir. Üretim Gateway'leri için kullanmayın.

Genellikle stable derlemeleri önce **beta** kanalına yayımlar, orada test eder, ardından
onaylanmış derlemeyi sürüm numarasını değiştirmeden `latest` değerine taşıyan
açık bir yükseltme adımı çalıştırırız. Bakımcılar gerektiğinde stable sürümü
doğrudan `latest` değerine de yayımlayabilir. Dist-tag'ler npm kurulumları için
doğruluk kaynağıdır.

## Kanalları değiştirme

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel`, seçiminizi yapılandırmada (`update.channel`) kalıcı hale getirir ve
kurulum yöntemini hizalar:

- **`stable`** (paket kurulumları): npm dist-tag `latest` üzerinden günceller.
- **`beta`** (paket kurulumları): npm dist-tag `beta` değerini tercih eder, ancak
  `beta` yoksa veya mevcut stable etiketten eskiyse `latest` değerine geri döner.
- **`stable`** (git kurulumları): en son stable git etiketini checkout eder.
- **`beta`** (git kurulumları): en son beta git etiketini tercih eder, ancak beta
  yoksa veya daha eskiyse en son stable git etiketine geri döner.
- **`dev`**: bir git checkout'u sağlar (varsayılan `~/openclaw`, `OPENCLAW_GIT_DIR` ile
  geçersiz kılınabilir), `main` dalına geçer, upstream üzerinde rebase yapar, derler ve
  global CLI'yi o checkout'tan kurar.

<Tip>
Stable ve dev'i paralel kullanmak istiyorsanız iki clone tutun ve gateway'inizi stable olana yönlendirin.
</Tip>

## Tek seferlik sürüm veya etiket hedefleme

Kalıcı kanalınızı değiştirmeden tek bir güncelleme için belirli bir dist-tag, sürüm veya paket spec hedeflemek üzere `--tag` kullanın:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

Notlar:

- `--tag` yalnızca **paket (npm) kurulumları** için geçerlidir. Git kurulumları bunu yok sayar.
- Etiket kalıcı hale getirilmez. Sonraki `openclaw update` komutunuz her zamanki gibi yapılandırılmış
  kanalınızı kullanır.
- Sürüm düşürme koruması: hedef sürüm mevcut sürümünüzden eskiyse,
  OpenClaw onay ister (`--yes` ile atlayın).
- `--channel beta`, `--tag beta` ile aynı değildir: kanal akışı beta yoksa veya daha eskiyse
  stable/latest değerine geri dönebilir; `--tag beta` ise bu tek çalıştırma için
  ham `beta` dist-tag'ini hedefler.

## Deneme çalıştırması

Değişiklik yapmadan `openclaw update` komutunun ne yapacağını önizleyin:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Deneme çalıştırması etkin kanalı, hedef sürümü, planlanan eylemleri ve
sürüm düşürme onayının gerekip gerekmediğini gösterir.

## Plugin'ler ve kanallar

`openclaw update` ile kanal değiştirdiğinizde OpenClaw Plugin kaynaklarını da eşitler:

- `dev`, git checkout içindeki paketlenmiş Plugin'leri tercih eder.
- `stable` ve `beta`, npm ile kurulmuş Plugin paketlerini geri yükler.
- npm ile kurulmuş Plugin'ler, çekirdek güncelleme tamamlandıktan sonra güncellenir.

## Geçerli durumu kontrol etme

```bash
openclaw update status
```

Etkin kanalı, kurulum türünü (git veya paket), mevcut sürümü ve
kaynağı (yapılandırma, git etiketi, git dalı veya varsayılan) gösterir.

## Etiketleme için en iyi uygulamalar

- Git checkout'larının ulaşmasını istediğiniz sürümleri etiketleyin (stable için `vYYYY.M.D`,
  beta için `vYYYY.M.D-beta.N`).
- `vYYYY.M.D.beta.N` uyumluluk için de tanınır, ancak `-beta.N` tercih edin.
- Eski `vYYYY.M.D-<patch>` etiketleri hâlâ stable (beta olmayan) olarak tanınır.
- Etiketleri değişmez tutun: bir etiketi asla taşımayın veya yeniden kullanmayın.
- npm dist-tag'leri npm kurulumları için doğruluk kaynağı olmaya devam eder:
  - `latest` -> stable
  - `beta` -> aday derleme veya önce beta'ya alınan stable derleme
  - `dev` -> main anlık görüntüsü (isteğe bağlı)

## macOS uygulama kullanılabilirliği

Beta ve dev derlemeleri bir macOS uygulama sürümü içermeyebilir. Bu sorun değildir:

- Git etiketi ve npm dist-tag yine de yayımlanabilir.
- Sürüm notlarında veya changelog'da "bu beta için macOS derlemesi yok" belirtin.

## İlgili

- [Güncelleme](/tr/install/updating)
- [Kurucu iç yapıları](/tr/install/installer)
