---
read_when:
    - stable/beta/dev arasında geçiş yapmak istediğinizde
    - Belirli bir sürümü, etiketi veya SHA'yı sabitlemek istediğinizde
    - Ön sürümleri etiketlerken veya yayımlarken
sidebarTitle: Release Channels
summary: 'Stable, beta ve dev kanalları: anlamları, geçiş, sabitleme ve etiketleme'
title: Sürüm Kanalları
x-i18n:
    generated_at: "2026-04-05T13:56:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f33a77bf356f989cd4de5f8bb57f330c276e7571b955bea6994a4527e40258d
    source_path: install/development-channels.md
    workflow: 15
---

# Geliştirme kanalları

OpenClaw üç güncelleme kanalıyla gelir:

- **stable**: npm dist-tag `latest`. Çoğu kullanıcı için önerilir.
- **beta**: güncelse npm dist-tag `beta`; beta eksikse veya
  en son stable sürümünden daha eskiyse güncelleme akışı `latest` değerine geri döner.
- **dev**: `main` dalının hareketli ucu (git). npm dist-tag: `dev` (yayımlandığında).
  `main` dalı deneyler ve etkin geliştirme içindir. Tamamlanmamış özellikler
  veya uyumsuz değişiklikler içerebilir. Bunu üretim gateway'leri için kullanmayın.

Genellikle stable derlemeleri önce **beta** kanalına gönderir, orada test eder, ardından
denetlenmiş derlemeyi sürüm numarasını
değiştirmeden `latest` kanalına taşıyan açık bir terfi adımı çalıştırırız. Maintainer'lar gerektiğinde
bir stable sürümü doğrudan `latest` kanalına da yayımlayabilir. npm
kurulumları için doğruluk kaynağı dist-tag'lerdir.

## Kanallar arasında geçiş

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel`, seçiminizi config içinde (`update.channel`) kalıcı hale getirir ve
kurulum yöntemini hizalar:

- **`stable`** (paket kurulumları): npm dist-tag `latest` üzerinden güncellenir.
- **`beta`** (paket kurulumları): npm dist-tag `beta` değerini tercih eder, ancak
  `beta` eksikse veya mevcut stable etiketinden daha eskiyse `latest`
  değerine geri döner.
- **`stable`** (git kurulumları): en son stable git etiketini checkout eder.
- **`beta`** (git kurulumları): en son beta git etiketini tercih eder, ancak
  beta eksikse veya daha eskiyse en son stable git etiketine geri döner.
- **`dev`**: bir git checkout bulunduğundan emin olur (varsayılan `~/openclaw`, bunun yerine
  `OPENCLAW_GIT_DIR` kullanılabilir), `main` dalına geçer, upstream üzerine rebase yapar, derler ve
  global CLI'yi bu checkout üzerinden kurar.

İpucu: stable + dev'i paralel kullanmak istiyorsanız iki clone tutun ve
gateway'inizi stable olana yönlendirin.

## Tek seferlik sürüm veya etiket hedefleme

Kalıcı kanalınızı değiştirmeden tek bir
güncelleme için belirli bir dist-tag, sürüm veya paket spec hedeflemek üzere `--tag` kullanın:

```bash
# Belirli bir sürümü kur
openclaw update --tag 2026.4.1-beta.1

# Beta dist-tag üzerinden kur (tek seferliktir, kalıcı olmaz)
openclaw update --tag beta

# GitHub main dalından kur (npm tarball)
openclaw update --tag main

# Belirli bir npm package spec kur
openclaw update --tag openclaw@2026.4.1-beta.1
```

Notlar:

- `--tag` yalnızca **paket (npm) kurulumları** için geçerlidir. Git kurulumları bunu yok sayar.
- Etiket kalıcı hale getirilmez. Bir sonraki `openclaw update`, her zamanki gibi yapılandırılmış
  kanalınızı kullanır.
- Düşürme koruması: hedef sürüm mevcut sürümünüzden daha eskiyse
  OpenClaw onay ister (`--yes` ile atlayın).
- `--channel beta`, `--tag beta` ile aynı değildir: kanal akışı
  beta eksikse veya daha eskiyse stable/latest değerine geri dönebilirken, `--tag beta`
  yalnızca bu tek çalıştırmada ham `beta` dist-tag değerini hedefler.

## Dry run

Değişiklik yapmadan `openclaw update` komutunun ne yapacağını önizleyin:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Dry run, etkin kanalı, hedef sürümü, planlanan eylemleri ve
sürüm düşürme onayı gerekip gerekmediğini gösterir.

## Eklentiler ve kanallar

`openclaw update` ile kanal değiştirdiğinizde OpenClaw eklenti
kaynaklarını da eşzamanlar:

- `dev`, git checkout içindeki paketlenmiş eklentileri tercih eder.
- `stable` ve `beta`, npm ile kurulan eklenti paketlerini geri yükler.
- npm ile kurulan eklentiler, çekirdek güncellemesi tamamlandıktan sonra güncellenir.

## Geçerli durumu denetleme

```bash
openclaw update status
```

Etkin kanalı, kurulum türünü (git veya paket), mevcut sürümü ve
kaynağı (config, git etiketi, git dalı veya varsayılan) gösterir.

## Etiketleme için en iyi uygulamalar

- Git checkout'ların ulaşmasını istediğiniz sürümler için etiketler oluşturun (`vYYYY.M.D` stable için,
  `vYYYY.M.D-beta.N` beta için).
- `vYYYY.M.D.beta.N` da uyumluluk için tanınır, ancak `-beta.N` tercih edilmelidir.
- Eski `vYYYY.M.D-<patch>` etiketleri hâlâ stable (beta olmayan) olarak tanınır.
- Etiketleri değişmez tutun: bir etiketi asla taşımayın veya yeniden kullanmayın.
- npm kurulumları için doğruluk kaynağı npm dist-tag'ler olmaya devam eder:
  - `latest` -> stable
  - `beta` -> aday derleme veya önce beta'ya çıkan stable derleme
  - `dev` -> `main` anlık görüntüsü (isteğe bağlı)

## macOS uygulaması kullanılabilirliği

Beta ve dev derlemeleri bir macOS uygulama sürümü **içermeyebilir**. Bu normaldir:

- Git etiketi ve npm dist-tag yine de yayımlanabilir.
- Sürüm notlarında veya changelog'da “bu beta için macOS derlemesi yok” bilgisini açıkça belirtin.
