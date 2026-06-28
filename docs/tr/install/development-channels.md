---
read_when:
    - Kararlı/beta/dev arasında geçiş yapmak istiyorsunuz
    - Belirli bir sürümü, etiketi veya SHA’yı sabitlemek istiyorsunuz
    - Ön sürümleri etiketliyor veya yayımlıyorsunuz
sidebarTitle: Release Channels
summary: 'Stable, beta ve dev kanalları: anlamları, geçiş yapma, sabitleme ve etiketleme'
title: Sürüm kanalları
x-i18n:
    generated_at: "2026-06-28T00:43:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw üç güncelleme kanalıyla gelir:

- **stable**: npm dist-tag `latest`. Çoğu kullanıcı için önerilir.
- **beta**: Güncel olduğunda npm dist-tag `beta`; beta yoksa veya en son kararlı sürümden eskiyse
  güncelleme akışı `latest` değerine geri döner.
- **dev**: `main` (git) dalının hareketli başı. npm dist-tag: `dev` (yayımlandığında).
  `main` dalı deneme ve etkin geliştirme içindir. Eksik özellikler veya kırıcı
  değişiklikler içerebilir. Üretim Gateway’lerinde kullanmayın.

Kararlı derlemeleri genellikle önce **beta** kanalına gönderir, orada test eder, ardından
incelenmiş derlemeyi sürüm numarasını değiştirmeden `latest` değerine taşıyan açık
bir yükseltme adımı çalıştırırız. Bakımcılar gerektiğinde kararlı bir sürümü
doğrudan `latest` olarak da yayımlayabilir. npm kurulumları için doğruluk kaynağı dist-tag’lerdir.

## Kanalları değiştirme

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel`, seçiminizi config içinde (`update.channel`) kalıcılaştırır ve
kurulum yöntemini hizalar:

- **`stable`** (paket kurulumları): npm dist-tag `latest` üzerinden güncellenir.
- **`beta`** (paket kurulumları): npm dist-tag `beta` tercih edilir, ancak `beta`
  yoksa veya mevcut kararlı etiketten eskiyse `latest` değerine geri döner.
- **`stable`** (git kurulumları): `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`,
  `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` gibi semver ön sürüm etiketleri
  ve diğer ön sürüm sonekleri hariç, en son kararlı git etiketini checkout eder.
- **`beta`** (git kurulumları): en son beta git etiketini tercih eder, ancak beta
  yoksa veya eskiyse en son kararlı git etiketine geri döner.
- **`dev`**: Bir git checkout olmasını sağlar (varsayılan `~/openclaw`, veya
  `OPENCLAW_HOME` ayarlandığında `$OPENCLAW_HOME/openclaw`; `OPENCLAW_GIT_DIR`
  ile geçersiz kılın), `main` dalına geçer, upstream üzerine rebase eder, derler ve
  global CLI’yi bu checkout’tan kurar.

<Tip>
Kararlı ve dev’i paralel kullanmak istiyorsanız iki clone tutun ve gateway’inizi kararlı olana yönlendirin.
</Tip>

## Tek seferlik sürüm veya etiket hedefleme

Kalıcı kanalınızı değiştirmeden tek bir güncelleme için belirli bir dist-tag,
sürüm veya paket spec hedeflemek üzere `--tag` kullanın:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

Notlar:

- `--tag` yalnızca **paket (npm) kurulumları** için geçerlidir. Git kurulumları bunu yok sayar.
- Etiket kalıcılaştırılmaz. Bir sonraki `openclaw update`, yapılandırılmış
  kanalınızı her zamanki gibi kullanır.
- Paket kurulumlarında OpenClaw, aşamalı npm kurulumundan önce GitHub/git kaynak
  spec’lerini geçici bir tarball olarak önceden paketler. Hareketli `main`
  checkout’unu kalıcı kurulumunuz olarak istediğinizde `--channel dev` veya
  `--install-method git --version main` kullanın.
- Sürüm düşürme koruması: hedef sürüm mevcut sürümünüzden eskiyse OpenClaw
  onay ister (`--yes` ile atlayın).
- `--channel beta`, `--tag beta` ile farklıdır: kanal akışı beta yoksa veya eskiyse
  stable/latest değerine geri dönebilirken, `--tag beta` o tek çalışma için ham
  `beta` dist-tag’ini hedefler.

## Dry run

Değişiklik yapmadan `openclaw update` komutunun ne yapacağını önizleyin:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Dry run, etkili kanalı, hedef sürümü, planlanan eylemleri ve sürüm düşürme
onayı gerekip gerekmeyeceğini gösterir.

## Plugin’ler ve kanallar

`openclaw update` ile kanal değiştirdiğinizde OpenClaw Plugin kaynaklarını da
eşitler:

- `dev`, git checkout’taki paketlenmiş Plugin’leri tercih eder.
- `stable` ve `beta`, npm ile kurulmuş Plugin paketlerini geri yükler.
- npm ile kurulmuş Plugin’ler çekirdek güncelleme tamamlandıktan sonra güncellenir.

## Mevcut durumu kontrol etme

```bash
openclaw update status
```

Etkin kanalı, kurulum türünü (git veya paket), mevcut sürümü ve kaynağı
(config, git etiketi, git dalı veya varsayılan) gösterir.

## Etiketleme için en iyi uygulamalar

- Git checkout’larının varmasını istediğiniz sürümleri etiketleyin (kararlı için
  `vYYYY.M.PATCH`, beta için `vYYYY.M.PATCH-beta.N`; `-alpha.N`, `-rc.N` ve
  `-next.N` gibi adlandırılmış semver ön sürüm sonekleri kararlı hedefler değildir).
- `vYYYY.M.PATCH-1` ve `v1.0.1-1` gibi eski sayısal kararlı etiketler uyumluluk
  için hâlâ kararlı git etiketleri olarak tanınır.
- `vYYYY.M.PATCH.beta.N` de uyumluluk için tanınır, ancak `-beta.N` tercih edin.
- Etiketleri değişmez tutun: bir etiketi asla taşımayın veya yeniden kullanmayın.
- npm dist-tag’leri, npm kurulumları için doğruluk kaynağı olmaya devam eder:
  - `latest` -> stable
  - `beta` -> aday derleme veya beta-öncelikli kararlı derleme
  - `dev` -> main snapshot (isteğe bağlı)

## macOS uygulama kullanılabilirliği

Beta ve dev derlemeleri bir macOS uygulama sürümü içermeyebilir. Bu sorun değildir:

- Git etiketi ve npm dist-tag yine de yayımlanabilir.
- Sürüm notlarında veya changelog’da "bu beta için macOS derlemesi yok" ifadesini belirtin.

## İlgili

- [Güncelleme](/tr/install/updating)
- [Installer iç işleyişi](/tr/install/installer)
