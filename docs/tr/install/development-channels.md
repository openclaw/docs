---
read_when:
    - stable/beta/dev arasında geçiş yapmak istiyorsunuz
    - Belirli bir sürümü, etiketi veya SHA'yı sabitlemek istiyorsunuz
    - Ön sürümleri etiketliyor veya yayımlıyorsunuz
sidebarTitle: Release Channels
summary: 'Stable, beta ve dev kanalları: anlamları, geçiş, sabitleme ve etiketleme'
title: Sürüm kanalları
x-i18n:
    generated_at: "2026-04-24T09:14:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: d892f3b801cb480652e6e7e757c91c000e842689070564f18782c25108dafa3e
    source_path: install/development-channels.md
    workflow: 15
---

# Geliştirme kanalları

OpenClaw üç güncelleme kanalıyla sunulur:

- **stable**: npm dist-tag `latest`. Çoğu kullanıcı için önerilir.
- **beta**: güncelse npm dist-tag `beta`; beta eksikse veya
  en son stable sürümden daha eskiyse güncelleme akışı `latest` etiketine geri döner.
- **dev**: `main` dalının hareketli ucu (git). npm dist-tag: `dev` (yayımlandığında).
  `main` dalı deneyler ve aktif geliştirme içindir. Tamamlanmamış özellikler
  veya kırıcı değişiklikler içerebilir. Üretim Gateway'lerinde kullanmayın.

Genellikle stable derlemeleri önce **beta** kanalına gönderir, orada test eder,
ardından incelenmiş derlemeyi sürüm numarasını değiştirmeden `latest` etiketine
taşıyan açık bir yükseltme adımı çalıştırırız. Gerektiğinde bakımcılar stable bir sürümü
doğrudan `latest` etiketine de yayımlayabilir. npm kurulumları için doğruluk kaynağı dist-tag'lerdir.

## Kanallar arasında geçiş

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel`, seçiminizi yapılandırmada (`update.channel`) kalıcı hâle getirir ve
kurulum yöntemini uyumlu duruma getirir:

- **`stable`** (paket kurulumları): npm dist-tag `latest` üzerinden günceller.
- **`beta`** (paket kurulumları): npm dist-tag `beta` etiketini tercih eder, ancak
  `beta` eksikse veya mevcut stable etiketten daha eskiyse `latest` etiketine geri döner.
- **`stable`** (git kurulumları): en son stable git etiketini checkout yapar.
- **`beta`** (git kurulumları): en son beta git etiketini tercih eder, ancak
  beta eksikse veya daha eskiyse en son stable git etiketine geri döner.
- **`dev`**: git checkout bulunduğundan emin olur (varsayılan `~/openclaw`, bunun yerine
  `OPENCLAW_GIT_DIR` kullanılabilir), `main` dalına geçer, upstream üzerinde rebase yapar, derler ve
  bu checkout'tan global CLI'yi kurar.

İpucu: stable + dev'i paralel kullanmak istiyorsanız iki clone tutun ve
Gateway'inizi stable olana yönlendirin.

## Tek seferlik sürüm veya etiket hedefleme

Kalıcı kanalınızı değiştirmeden, tek bir
güncelleme için belirli bir dist-tag, sürüm veya paket belirtimini hedeflemek amacıyla `--tag` kullanın:

```bash
# Belirli bir sürümü kur
openclaw update --tag 2026.4.1-beta.1

# Beta dist-tag üzerinden kur (tek seferliktir, kalıcı olmaz)
openclaw update --tag beta

# GitHub main dalından kur (npm tarball)
openclaw update --tag main

# Belirli bir npm paket belirtimini kur
openclaw update --tag openclaw@2026.4.1-beta.1
```

Notlar:

- `--tag` yalnızca **paket (npm) kurulumları** için geçerlidir. Git kurulumları bunu yok sayar.
- Etiket kalıcı değildir. Bir sonraki `openclaw update`, her zamanki gibi
  yapılandırılmış kanalınızı kullanır.
- Düşürme koruması: hedef sürüm mevcut sürümünüzden daha eskiyse,
  OpenClaw onay ister (`--yes` ile atlayın).
- `--channel beta`, `--tag beta` ile aynı değildir: kanal akışı,
  beta eksikse veya daha eskiyse stable/latest etiketine geri dönebilir; buna karşılık `--tag beta`,
  yalnızca o çalıştırma için ham `beta` dist-tag etiketini hedefler.

## Dry run

Değişiklik yapmadan `openclaw update` komutunun ne yapacağını önizleyin:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Dry run; etkin kanalı, hedef sürümü, planlanan eylemleri ve
bir düşürme onayının gerekip gerekmeyeceğini gösterir.

## Plugin'ler ve kanallar

`openclaw update` ile kanal değiştirdiğinizde OpenClaw, Plugin
kaynaklarını da eşitler:

- `dev`, git checkout içindeki paketlenmiş Plugin'leri tercih eder.
- `stable` ve `beta`, npm ile kurulmuş Plugin paketlerini geri yükler.
- npm ile kurulmuş Plugin'ler, çekirdek güncelleme tamamlandıktan sonra güncellenir.

## Geçerli durumu denetleme

```bash
openclaw update status
```

Etkin kanalı, kurulum türünü (git veya paket), geçerli sürümü ve
kaynağı (yapılandırma, git etiketi, git dalı veya varsayılan) gösterir.

## Etiketleme için en iyi uygulamalar

- Git checkout'ların gelmesini istediğiniz sürümler için etiket ekleyin (`vYYYY.M.D` stable için,
  `vYYYY.M.D-beta.N` beta için).
- Uyumluluk için `vYYYY.M.D.beta.N` de tanınır, ancak `-beta.N` tercih edilmelidir.
- Eski `vYYYY.M.D-<patch>` etiketleri de hâlâ stable (beta olmayan) olarak tanınır.
- Etiketleri değişmez tutun: bir etiketi asla taşımayın veya yeniden kullanmayın.
- npm kurulumları için doğruluk kaynağı olmaya devam edenler npm dist-tag'leridir:
  - `latest` -> stable
  - `beta` -> aday derleme veya önce beta'ya çıkan stable derleme
  - `dev` -> `main` anlık görüntüsü (isteğe bağlı)

## macOS uygulama kullanılabilirliği

Beta ve dev derlemeleri **bir macOS uygulama sürümü** içermeyebilir. Bu normaldir:

- Git etiketi ve npm dist-tag yine de yayımlanabilir.
- Sürüm notlarında veya changelog'da "bu beta için macOS derlemesi yok" bilgisini belirtin.

## İlgili

- [Güncelleme](/tr/install/updating)
- [Kurucu iç yapısı](/tr/install/installer)
