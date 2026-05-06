---
read_when:
    - kararlı/beta/dev arasında geçiş yapmak istiyorsunuz
    - Belirli bir sürümü, etiketi veya SHA'yı sabitlemek istiyorsunuz
    - Ön sürümleri etiketliyor veya yayımlıyorsunuz
sidebarTitle: Release Channels
summary: 'Kararlı, beta ve dev kanalları: anlamları, geçiş yapma, sabitleme ve etiketleme'
title: Sürüm kanalları
x-i18n:
    generated_at: "2026-05-06T09:18:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw üç güncelleme kanalı sunar:

- **stable**: npm dist-tag `latest`. Çoğu kullanıcı için önerilir.
- **beta**: güncel olduğunda npm dist-tag `beta`; beta yoksa veya en son stable sürümden eskiyse
  güncelleme akışı `latest` değerine geri döner.
- **dev**: `main` dalının hareketli ucu (git). npm dist-tag: `dev` (yayımlandığında).
  `main` dalı deneme ve aktif geliştirme içindir. Eksik özellikler veya kırıcı değişiklikler
  içerebilir. Üretim gateway'leri için kullanmayın.

Stable derlemeleri genellikle önce **beta** kanalına gönderir, orada test eder, ardından
doğrulanmış derlemeyi sürüm numarasını değiştirmeden `latest` değerine taşıyan
açık bir yükseltme adımı çalıştırırız. Bakımcılar gerektiğinde stable bir sürümü
doğrudan `latest` değerine de yayımlayabilir. npm kurulumları için doğruluk kaynağı dist-tag'lerdir.

## Kanal değiştirme

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel`, seçiminizi yapılandırmada (`update.channel`) kalıcı hale getirir ve
kurulum yöntemini hizalar:

- **`stable`** (paket kurulumları): npm dist-tag `latest` üzerinden günceller.
- **`beta`** (paket kurulumları): npm dist-tag `beta` tercih edilir, ancak `beta`
  yoksa veya geçerli stable etiketten eskiyse `latest` değerine geri döner.
- **`stable`** (git kurulumları): en son stable git etiketini checkout yapar.
- **`beta`** (git kurulumları): en son beta git etiketini tercih eder, ancak beta
  yoksa veya eskiyse en son stable git etiketine geri döner.
- **`dev`**: bir git checkout'ı sağlar (varsayılan `~/openclaw`, `OPENCLAW_GIT_DIR`
  ile geçersiz kılınabilir), `main` dalına geçer, upstream üzerine rebase eder, derler ve
  global CLI'yi bu checkout'tan kurar.

<Tip>
Stable ve dev'i paralel kullanmak istiyorsanız iki klon tutun ve gateway'inizi stable olana yönlendirin.
</Tip>

## Tek seferlik sürüm veya etiket hedefleme

Kalıcı kanalınızı değiştirmeden tek bir güncelleme için belirli bir dist-tag,
sürüm veya paket belirtimini hedeflemek üzere `--tag` kullanın:

```bash
# Belirli bir sürüm kur
openclaw update --tag 2026.4.1-beta.1

# Beta dist-tag üzerinden kur (tek seferlik, kalıcı olmaz)
openclaw update --tag beta

# GitHub main dalından kur (npm tarball)
openclaw update --tag main

# Belirli bir npm paket belirtimi kur
openclaw update --tag openclaw@2026.4.1-beta.1
```

Notlar:

- `--tag` yalnızca **paket (npm) kurulumları** için geçerlidir. Git kurulumları bunu yok sayar.
- Etiket kalıcı hale getirilmez. Sonraki `openclaw update` işleminiz her zamanki gibi
  yapılandırılmış kanalınızı kullanır.
- Sürüm düşürme koruması: hedef sürüm geçerli sürümünüzden eskiyse
  OpenClaw onay ister (`--yes` ile atlanabilir).
- `--channel beta`, `--tag beta` değerinden farklıdır: kanal akışı beta yoksa veya eskiyse
  stable/latest değerine geri dönebilir; `--tag beta` ise yalnızca o çalıştırma için
  ham `beta` dist-tag değerini hedefler.

## Dry run

Değişiklik yapmadan `openclaw update` işleminin ne yapacağını önizleyin:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Dry run, etkin kanalı, hedef sürümü, planlanan eylemleri ve
sürüm düşürme onayının gerekip gerekmeyeceğini gösterir.

## Plugin'ler ve kanallar

`openclaw update` ile kanal değiştirdiğinizde OpenClaw, Plugin
kaynaklarını da eşitler:

- `dev`, git checkout'taki paketli Plugin'leri tercih eder.
- `stable` ve `beta`, npm ile kurulmuş Plugin paketlerini geri yükler.
- npm ile kurulmuş Plugin'ler çekirdek güncelleme tamamlandıktan sonra güncellenir.

## Geçerli durumu denetleme

```bash
openclaw update status
```

Etkin kanalı, kurulum türünü (git veya paket), geçerli sürümü ve
kaynağı (yapılandırma, git etiketi, git dalı veya varsayılan) gösterir.

## Etiketleme en iyi uygulamaları

- Git checkout'ların ulaşmasını istediğiniz sürümleri etiketleyin (stable için `vYYYY.M.D`,
  beta için `vYYYY.M.D-beta.N`).
- `vYYYY.M.D.beta.N` uyumluluk için de tanınır, ancak `-beta.N` tercih edin.
- Eski `vYYYY.M.D-<patch>` etiketleri hâlâ stable (beta olmayan) olarak tanınır.
- Etiketleri değişmez tutun: bir etiketi asla taşımayın veya yeniden kullanmayın.
- npm kurulumları için doğruluk kaynağı npm dist-tag'leri olmaya devam eder:
  - `latest` -> stable
  - `beta` -> aday derleme veya önce beta'ya gönderilen stable derleme
  - `dev` -> main anlık görüntüsü (isteğe bağlı)

## macOS uygulama kullanılabilirliği

Beta ve dev derlemeleri bir macOS uygulama sürümü içermeyebilir. Bu kabul edilebilir:

- Git etiketi ve npm dist-tag yine de yayımlanabilir.
- Sürüm notlarında veya changelog'da "bu beta için macOS derlemesi yok" ifadesini belirtin.

## İlgili

- [Güncelleme](/tr/install/updating)
- [Kurulum aracının iç işleyişi](/tr/install/installer)
