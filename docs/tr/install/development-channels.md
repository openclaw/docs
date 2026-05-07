---
read_when:
    - stable/beta/dev arasında geçiş yapmak istiyorsunuz
    - Belirli bir sürümü, etiketi veya SHA'yı sabitlemek istiyorsunuz
    - Ön sürümleri etiketliyor veya yayımlıyorsunuz
sidebarTitle: Release Channels
summary: 'Kararlı, beta ve geliştirme kanalları: anlamları, geçiş, sabitleme ve etiketleme'
title: Sürüm kanalları
x-i18n:
    generated_at: "2026-05-07T01:53:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6579110cc5c0e62ef238d7e4200db5fea188f35dc9366a17b3cf92a58c8935cc
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw üç güncelleme kanalıyla gelir:

- **stable**: npm dist-tag `latest`. Çoğu kullanıcı için önerilir.
- **beta**: güncel olduğunda npm dist-tag `beta`; beta eksikse veya en son kararlı sürümden eskiyse
  güncelleme akışı `latest` etiketine geri döner.
- **dev**: `main` dalının hareketli ucu (git). npm dist-tag: `dev` (yayımlandığında).
  `main` dalı deneme ve aktif geliştirme içindir. Eksik özellikler veya
  kırıcı değişiklikler içerebilir. Üretim Gateway’leri için kullanmayın.

Genellikle kararlı yapıları önce **beta** kanalına gönderir, orada test eder, ardından
doğrulanmış yapıyı sürüm numarasını değiştirmeden `latest` etiketine taşıyan açık
bir yükseltme adımı çalıştırırız. Bakımcılar gerektiğinde kararlı bir sürümü
doğrudan `latest` etiketine de yayımlayabilir. Dist-tag’ler npm kurulumları için
doğruluk kaynağıdır.

## Planlanan aylık destek hatları

OpenClaw henüz LTS veya aylık destek kanalı sunmuyor. Kullanıcıların daha sakin
bir hatta kalabilmesi ve `latest` hızla ilerlemeye devam ederken SemVer uyumlu
aylık destek hatlarına doğru çalışıyoruz.

Planlanan sürüm biçimi `YYYY.M.PATCH` şeklindedir:

- `YYYY` yıldır.
- `M` başında sıfır olmayan aylık sürüm hattıdır.
- `PATCH` o aylık hat içinde artar ve gerekirse 100’ü geçebilir.

Gelecekteki etiket örnekleri:

- Haziran hattı için `v2026.6.0`, `v2026.6.1`, `v2026.6.2`.
- hızlı/latest hattındaki bir ön sürüm için `v2026.6.3-beta.1`.
- `stable-2026-6` veya `lts-2026-6` gibi gelecekteki bir destek hattı dist-tag’i
  aylık bir hatta işaret edebilir, ancak bugün böyle bir kanal mevcut değildir.

Bu geçiş gerçekleşene kadar herkese açık güncelleme kanalları `stable`, `beta`
ve `dev` olarak kalır.

## Kanal değiştirme

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel`, seçiminizi yapılandırmada (`update.channel`) kalıcı hale getirir ve
kurulum yöntemini hizalar:

- **`stable`** (paket kurulumları): npm dist-tag `latest` üzerinden güncellenir.
- **`beta`** (paket kurulumları): npm dist-tag `beta` etiketini tercih eder, ancak
  `beta` eksikse veya geçerli kararlı etiketten eskiyse `latest` etiketine geri döner.
- **`stable`** (git kurulumları): en son kararlı git etiketine geçiş yapar.
- **`beta`** (git kurulumları): en son beta git etiketini tercih eder, ancak beta
  eksikse veya eskiyse en son kararlı git etiketine geri döner.
- **`dev`**: bir git checkout’u sağlar (varsayılan `~/openclaw`, `OPENCLAW_GIT_DIR` ile
  geçersiz kılınabilir), `main` dalına geçer, upstream üzerinde rebase yapar, derler ve
  global CLI’ı bu checkout’tan kurar.

<Tip>
Kararlı ve dev’i paralel kullanmak istiyorsanız, iki clone tutun ve gateway’inizi kararlı olana yönlendirin.
</Tip>

## Tek seferlik sürüm veya etiket hedefleme

Kalıcı kanalınızı değiştirmeden tek bir güncelleme için belirli bir dist-tag,
sürüm veya paket belirtimini hedeflemek üzere `--tag` kullanın:

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
- Etiket kalıcı hale getirilmez. Bir sonraki `openclaw update` komutunuz, yapılandırılmış
  kanalınızı her zamanki gibi kullanır.
- Sürüm düşürme koruması: hedef sürüm geçerli sürümünüzden eskiyse,
  OpenClaw onay ister (`--yes` ile atlanabilir).
- `--channel beta`, `--tag beta` değerinden farklıdır: kanal akışı beta eksik veya eski olduğunda
  stable/latest’e geri dönebilirken, `--tag beta` o tek çalıştırma için ham
  `beta` dist-tag’ini hedefler.

## Deneme çalıştırması

Değişiklik yapmadan `openclaw update` komutunun ne yapacağını önizleyin:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Deneme çalıştırması etkili kanalı, hedef sürümü, planlanan eylemleri ve
sürüm düşürme onayının gerekip gerekmeyeceğini gösterir.

## Plugin’ler ve kanallar

`openclaw update` ile kanal değiştirdiğinizde OpenClaw Plugin
kaynaklarını da eşitler:

- `dev`, git checkout’undan gelen paketlenmiş Plugin’leri tercih eder.
- `stable` ve `beta`, npm ile kurulmuş Plugin paketlerini geri yükler.
- npm ile kurulmuş Plugin’ler, çekirdek güncelleme tamamlandıktan sonra güncellenir.

## Geçerli durumu denetleme

```bash
openclaw update status
```

Etkin kanalı, kurulum türünü (git veya paket), geçerli sürümü ve
kaynağı (yapılandırma, git etiketi, git dalı veya varsayılan) gösterir.

## Etiketleme en iyi uygulamaları

- Git checkout’larının ulaşmasını istediğiniz sürümleri etiketleyin (geçerli
  kararlı sürümler için `vYYYY.M.D`, geçerli beta sürümler için `vYYYY.M.D-beta.N`).
- Uyumluluk için `vYYYY.M.D.beta.N` de tanınır, ancak `-beta.N` tercih edin.
- Eski `vYYYY.M.D-<patch>` etiketleri hâlâ kararlı (beta olmayan) olarak tanınır,
  ancak planlanan aylık destek modeli kısa çizgili düzeltme soneki yerine normal patch numaraları
  (`vYYYY.M.PATCH`) kullanacaktır.
- Etiketleri değiştirilemez tutun: bir etiketi asla taşımayın veya yeniden kullanmayın.
- npm dist-tag’leri npm kurulumları için doğruluk kaynağı olmaya devam eder:
  - `latest` -> stable
  - `beta` -> aday yapı veya beta öncelikli kararlı yapı
  - `dev` -> main anlık görüntüsü (isteğe bağlı)

## macOS uygulama kullanılabilirliği

Beta ve dev yapıları bir macOS uygulama sürümü içermeyebilir. Bu normaldir:

- Git etiketi ve npm dist-tag yine de yayımlanabilir.
- Sürüm notlarında veya değişiklik günlüğünde "bu beta için macOS yapısı yok" diye belirtin.

## İlgili

- [Güncelleme](/tr/install/updating)
- [Kurulum aracı iç yapısı](/tr/install/installer)
