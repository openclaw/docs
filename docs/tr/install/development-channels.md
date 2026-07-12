---
read_when:
    - Kararlı/uzatılmış kararlı/beta/geliştirme sürümleri arasında geçiş yapmak istiyorsunuz
    - Belirli bir sürümü, etiketi veya SHA'yı sabitlemek istiyorsunuz
    - Ön sürümleri etiketliyor veya yayımlıyorsunuz
sidebarTitle: Release Channels
summary: 'Kararlı, genişletilmiş kararlı, beta ve geliştirme kanalları: anlamları, geçiş, sürüm sabitleme ve etiketleme'
title: Sürüm kanalları
x-i18n:
    generated_at: "2026-07-12T11:53:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw dört güncelleme kanalı sunar:

- **kararlı**: npm dist-tag'i `latest`. Çoğu kullanıcı için önerilir.
- **uzatılmış kararlı**: npm dist-tag'i `extended-stable`. Baştan oluşturulmuş, geriden gelen
  desteklenen aylar için bir paket kanalıdır. Yalnızca paket olarak sunulur ve kurulum
  yalnızca ön planda yapılır. Saklanan bir seçim, `update.checkOnStart`
  etkinleştirildiğinde salt okunur güncelleme ipuçları alır ancak güncellemeleri hiçbir zaman otomatik olarak uygulamaz.
- **beta**: npm dist-tag'i `beta`. `beta` yoksa veya mevcut kararlı sürümden
  eskiyse `latest` etiketine geri döner.
- **geliştirme**: `main` dalının hareketli ucu (git). Yayımlandığında npm dist-tag'i `dev`. `main`,
  denemeler ve etkin geliştirme içindir; tamamlanmamış özellikler veya geriye dönük
  uyumsuz değişiklikler içerebilir. Üretim Gateway'leri için kullanmayın.

Kararlı derlemeler genellikle önce **beta** kanalında yayımlanır, burada doğrulanır ve ardından
sürüm numarası artırılmadan **latest** etiketine yükseltilir. Bakımcılar doğrudan
`latest` etiketinde de yayımlayabilir. npm kurulumları için doğruluk kaynağı dist-tag'lerdir.

## Kanal değiştirme

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel`, seçimi yapılandırmadaki `update.channel` alanına kalıcı olarak kaydeder ve her iki
kurulum yolunu da yönetir:

| Kanal             | npm/paket kurulumları                                                                                                                                                                                   | git kurulumları                                                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | dist-tag `latest`                                                                                                                                                                                       | en son kararlı git etiketi (`-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` ve diğer adlandırılmış ön sürüm son eklerini hariç tutar)                                                   |
| `extended-stable` | herkese açık npm `extended-stable` seçicisini çözümler, seçilen paketi tam olarak doğrular ve o tam sürümü kurar. `latest`, `beta` veya `dev` için geri dönüş olmadan güvenli biçimde başarısız olur.       | desteklenmez: OpenClaw çalışma kopyasını değiştirmeden bırakır ve paket kurulumu kullanmanızı ister                                                                                                                                    |
| `beta`            | dist-tag `beta`; `beta` yoksa veya daha eskiyse `latest` etiketine geri döner                                                                                                                           | en son beta git etiketi; beta yoksa veya daha eskiyse en son kararlı git etiketine geri döner                                                                                                                                         |
| `dev`             | dist-tag `dev` (nadiren kullanılır; geliştirme kullanıcılarının çoğu git kurulumlarını çalıştırır)                                                                                                      | değişiklikleri getirir, çalışma kopyasını üst kaynak `main` dalı üzerinde yeniden temellendirir, derler ve genel CLI'yi yeniden kurar                                                                                                  |

`dev` git kurulumları için varsayılan çalışma kopyası `~/openclaw` dizinidir
(`OPENCLAW_HOME` ayarlanmışsa `$OPENCLAW_HOME/openclaw`); bunu `OPENCLAW_GIT_DIR`
ile geçersiz kılabilirsiniz.

<Tip>
Kararlı ve geliştirme sürümlerini paralel tutmak için iki ayrı çalışma kopyası kullanın ve her Gateway'i kendi çalışma kopyasına yönlendirin.
</Tip>

## Tek seferlik sürüm veya etiket hedefleme

Kalıcı kanalı değiştirmeden tek bir güncelleme için belirli bir dist-tag'i,
sürümü veya paket belirtimini hedeflemek üzere `--tag` kullanın:

```bash
# Belirli bir sürümü kur
openclaw update --tag 2026.4.1-beta.1

# Beta dist-tag'inden kur (tek seferliktir, kalıcı olmaz)
openclaw update --tag beta

# Hareketli GitHub main çalışma kopyasına geç (kalıcıdır)
openclaw update --channel dev

# Belirli bir npm paket belirtimini kur
openclaw update --tag openclaw@2026.4.1-beta.1

# Kanalı kalıcılaştırmadan GitHub main'den bir kez kur
openclaw update --tag main
```

Notlar:

- `--tag` **yalnızca paket (npm) kurulumlarına** uygulanır; git kurulumları bunu yok sayar.
- Etiket kalıcı olarak kaydedilmez; sonraki `openclaw update`, yapılandırılmış
  kanalı kullanır.
- `--tag main`, bu tek çalıştırma için npm uyumlu
  `github:openclaw/openclaw#main` belirtimine eşlenir. Kalıcı ve hareketli bir `main`
  kurulumu için `openclaw update --channel dev` komutunu kullanın (paket kurulumları
  bir git çalışma kopyasına geçer) veya yükleyicinin git yöntemiyle yeniden kurun:
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  npm kurulum yolu, GitHub/git kaynak hedeflerini doğrudan reddeder ve bunun yerine
  sizi git yöntemine yönlendirir.
- Sürüm düşürme koruması: hedef sürüm mevcut sürümden eskiyse OpenClaw
  onay ister (`--yes` ile atlayabilirsiniz).
- Uzatılmış kararlı kanal her zaman doğrulanmış tam paket hedefini kullanır. Bu,
  `--tag extended-stable` için tek seferlik bir takma ad değildir ve `--tag`,
  etkin bir uzatılmış kararlı kanalla birlikte kullanılamaz.
- `--channel beta`, `--tag beta` seçeneğinden farklıdır: kanal akışı, beta
  yoksa veya daha eskiyse kararlı/latest sürüme geri dönebilir; `--tag beta` ise
  bu tek çalıştırma için her zaman ham `beta` dist-tag'ini hedefler.

## Deneme çalıştırması

Değişiklik yapmadan `openclaw update` komutunun ne yapacağını önizleyin:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Deneme çalıştırması; etkin kanalı, hedef sürümü, planlanan işlemleri ve sürüm düşürme
onayının gerekip gerekmediğini bildirir.

## Plugin'ler ve kanallar

`openclaw update` ile kanal değiştirmek, Plugin kaynaklarını da eşitler:

- `dev`, paketle gelen bir karşılığı bulunan kurulu Plugin'leri yeniden
  paketle gelen (git çalışma kopyası) kaynaklarına geçirir.
- `stable` ve `beta`, npm veya ClawHub aracılığıyla kurulan Plugin
  paketlerini geri yükler.
- `extended-stable`, çıplak/varsayılan veya `latest` amacı taşıyan uygun resmî
  npm Plugin'lerini kurulu çekirdeğin tam sürümüne çözümler. Çalışma zamanında
  Plugin `@extended-stable` etiketlerini sorgulamaz.
- npm ile kurulan Plugin'ler, çekirdek güncellemesi tamamlandıktan sonra güncellenir.

## Geçerli durumu denetleme

```bash
openclaw update status
```

Etkin kanalı (bunu belirleyen kaynakla birlikte: yapılandırma, git etiketi,
git dalı, kurulu sürüm veya varsayılan), kurulum türünü (git veya paket),
geçerli sürümü ve güncelleme kullanılabilirliğini gösterir.

## Etiketleme için en iyi uygulamalar

- Git çalışma kopyalarının ulaşmasını istediğiniz sürümleri etiketleyin: kararlı sürüm için
  `vYYYY.M.PATCH`, beta için `vYYYY.M.PATCH-beta.N`. `-alpha.N`,
  `-rc.N` ve `-next.N` gibi adlandırılmış ön sürüm son ekleri kararlı veya beta hedefleri değildir.
- `vYYYY.M.PATCH-1` ve `v1.0.1-1` gibi eski sayısal kararlı etiketler, uyumluluk
  amacıyla hâlâ kararlı git etiketleri olarak tanınır.
- `vYYYY.M.PATCH.beta.N` (noktalarla ayrılmış) da uyumluluk amacıyla tanınır;
  `-beta.N` biçimini tercih edin.
- Etiketleri değişmez tutun: bir etiketi hiçbir zaman taşımayın veya yeniden kullanmayın.
- npm kurulumları için doğruluk kaynağı npm dist-tag'leri olmaya devam eder:
  - `latest` -> kararlı
  - `extended-stable` -> geriden gelen desteklenen ayın paket sürümü
  - `beta` -> aday derleme veya önce beta kanalında yayımlanan kararlı derleme
  - `dev` -> main anlık görüntüsü (isteğe bağlı)

## macOS uygulamasının kullanılabilirliği

Beta ve geliştirme derlemeleri bir macOS uygulama sürümü **içermeyebilir**. Bu sorun değildir:

- Git etiketi ve npm dist-tag'i yine de birbirinden bağımsız olarak yayımlanabilir.
- Sürüm notlarında veya değişiklik günlüğünde "bu beta için macOS derlemesi yok" ifadesini belirtin.

## İlgili

- [Güncelleme](/tr/install/updating)
- [Yükleyicinin iç işleyişi](/tr/install/installer)
