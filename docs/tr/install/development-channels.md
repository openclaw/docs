---
read_when:
    - Kararlı/beta/dev arasında geçiş yapmak istiyorsunuz
    - Belirli bir sürümü, etiketi veya SHA'yı sabitlemek istiyorsunuz
    - Ön sürümleri etiketliyor veya yayımlıyorsunuz
sidebarTitle: Release Channels
summary: 'Kararlı, beta ve dev kanalları: anlamları, geçiş yapma, sabitleme ve etiketleme'
title: Sürüm kanalları
x-i18n:
    generated_at: "2026-04-30T09:28:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 741d8ed2a1599264e1b41a99e81fac4b06d14cb026aa945a8757b15e5733f682
    source_path: install/development-channels.md
    workflow: 16
---

# Geliştirme kanalları

OpenClaw üç güncelleme kanalı sunar:

- **stable**: npm dist-tag `latest`. Çoğu kullanıcı için önerilir.
- **beta**: güncel olduğunda npm dist-tag `beta`; beta eksikse veya
  en son stable sürümden eskiyse, güncelleme akışı `latest` etiketine geri döner.
- **dev**: `main` dalının hareketli başı (git). npm dist-tag: `dev` (yayımlandığında).
  `main` dalı deneme ve etkin geliştirme içindir. Eksik özellikler veya kırıcı
  değişiklikler içerebilir. Üretim Gateway'leri için kullanmayın.

Stable derlemeleri genellikle önce **beta** kanalına yayımlar, orada test eder,
sonra sürüm numarasını değiştirmeden doğrulanmış derlemeyi `latest` etiketine
taşıyan açık bir yükseltme adımı çalıştırırız. Bakımcılar gerektiğinde bir stable
sürümü doğrudan `latest` etiketine de yayımlayabilir. npm kurulumları için gerçek
kaynak dist-tag'lerdir.

## Kanalları değiştirme

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel`, seçiminizi config içinde (`update.channel`) kalıcı yapar ve
kurulum yöntemini hizalar:

- **`stable`** (paket kurulumları): npm dist-tag `latest` üzerinden günceller.
- **`beta`** (paket kurulumları): npm dist-tag `beta` etiketini tercih eder, ancak
  `beta` eksikse veya mevcut stable etiketinden eskiyse `latest` etiketine geri döner.
- **`stable`** (git kurulumları): en son stable git etiketine geçer.
- **`beta`** (git kurulumları): en son beta git etiketini tercih eder, ancak beta
  eksikse veya eskiyse en son stable git etiketine geri döner.
- **`dev`**: bir git checkout bulunduğundan emin olur (varsayılan `~/openclaw`,
  `OPENCLAW_GIT_DIR` ile geçersiz kılınabilir), `main` dalına geçer, upstream
  üzerine rebase yapar, derler ve global CLI'yı o checkout'tan kurar.

<Tip>
Stable ve dev'i paralel kullanmak istiyorsanız iki clone tutun ve Gateway'inizi stable olana yönlendirin.
</Tip>

## Tek seferlik sürüm veya etiket hedefleme

Kalıcı kanalınızı değiştirmeden tek bir güncelleme için belirli bir dist-tag,
sürüm veya paket belirtimi hedeflemek üzere `--tag` kullanın:

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
- Etiket kalıcı yapılmaz. Sonraki `openclaw update` komutunuz her zamanki gibi
  yapılandırılmış kanalınızı kullanır.
- Sürüm düşürme koruması: hedef sürüm mevcut sürümünüzden eskiyse,
  OpenClaw onay ister (`--yes` ile atlayabilirsiniz).
- `--channel beta`, `--tag beta` ile aynı değildir: kanal akışı beta eksikse
  veya eskiyse stable/latest'e geri dönebilir; `--tag beta` ise bu tek çalıştırma
  için ham `beta` dist-tag'ini hedefler.

## Kuru çalıştırma

`openclaw update` komutunun değişiklik yapmadan ne yapacağını önizleyin:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Kuru çalıştırma etkin kanalı, hedef sürümü, planlanan eylemleri ve
sürüm düşürme onayının gerekip gerekmeyeceğini gösterir.

## Plugin'ler ve kanallar

`openclaw update` ile kanal değiştirdiğinizde OpenClaw, Plugin
kaynaklarını da eşitler:

- `dev`, git checkout'tan gelen paketlenmiş Plugin'leri tercih eder.
- `stable` ve `beta`, npm ile kurulmuş Plugin paketlerini geri yükler.
- npm ile kurulmuş Plugin'ler, çekirdek güncelleme tamamlandıktan sonra güncellenir.

## Mevcut durumu denetleme

```bash
openclaw update status
```

Etkin kanalı, kurulum türünü (git veya paket), mevcut sürümü ve kaynağı
(config, git etiketi, git dalı veya varsayılan) gösterir.

## Etiketleme en iyi uygulamaları

- Git checkout'ların ulaşmasını istediğiniz sürümleri etiketleyin (stable için
  `vYYYY.M.D`, beta için `vYYYY.M.D-beta.N`).
- Uyumluluk için `vYYYY.M.D.beta.N` de tanınır, ancak `-beta.N` kullanmayı tercih edin.
- Eski `vYYYY.M.D-<patch>` etiketleri hâlâ stable (beta olmayan) olarak tanınır.
- Etiketleri değişmez tutun: bir etiketi asla taşımayın veya yeniden kullanmayın.
- npm dist-tag'leri, npm kurulumları için gerçek kaynak olmaya devam eder:
  - `latest` -> stable
  - `beta` -> aday derleme veya önce beta'ya yayımlanan stable derleme
  - `dev` -> main anlık görüntüsü (isteğe bağlı)

## macOS uygulama kullanılabilirliği

Beta ve dev derlemeleri bir macOS uygulama sürümü **içermeyebilir**. Bu sorun değildir:

- Git etiketi ve npm dist-tag yine de yayımlanabilir.
- Sürüm notlarında veya changelog'da "bu beta için macOS derlemesi yok" diye belirtin.

## İlgili

- [Güncelleme](/tr/install/updating)
- [Kurucu iç yapısı](/tr/install/installer)
