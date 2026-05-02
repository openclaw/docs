---
read_when:
    - Bir kaynak çalışma kopyasını güvenli şekilde güncellemek istiyorsunuz
    - '`--update` kısaltma davranışını anlamanız gerekir'
summary: '`openclaw update` için CLI referansı (nispeten güvenli kaynak güncellemesi + Gateway otomatik yeniden başlatması)'
title: Güncelle
x-i18n:
    generated_at: "2026-05-02T08:51:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc88dc7963f1ae7d847a573924e9af7ede207f2f20028a18808116de4912d24e
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw'ı güvenle güncelleyin ve stable/beta/dev kanalları arasında geçiş yapın.

**npm/pnpm/bun** ile kurduysanız (global kurulum, git metadata yok),
güncellemeler [Güncelleme](/tr/install/updating) bölümündeki paket yöneticisi akışıyla yapılır.

## Kullanım

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Seçenekler

- `--no-restart`: başarılı bir güncellemeden sonra Gateway hizmetini yeniden başlatmayı atla. Gateway'i yeniden başlatan paket yöneticisi güncellemeleri, komut başarılı olmadan önce yeniden başlatılan hizmetin beklenen güncellenmiş sürümü raporladığını doğrular.
- `--channel <stable|beta|dev>`: güncelleme kanalını ayarla (git + npm; yapılandırmada kalıcı hale getirilir).
- `--tag <dist-tag|version|spec>`: paket hedefini yalnızca bu güncelleme için geçersiz kıl. Paket kurulumlarında `main`, `github:openclaw/openclaw#main` ile eşleşir.
- `--dry-run`: yapılandırma yazmadan, kurulum yapmadan, pluginleri eşitlemeden veya yeniden başlatmadan planlanan güncelleme eylemlerini (kanal/tag/hedef/yeniden başlatma akışı) önizle.
- `--json`: npm Plugin artifact sapması güncelleme sonrası plugin eşitlemesi sırasında
  algılandığında `postUpdate.plugins.integrityDrifts` dahil olmak üzere
  makine tarafından okunabilir `UpdateRunResult` JSON çıktısı yazdır.
- `--timeout <seconds>`: adım başına zaman aşımı (varsayılan 1800 sn).
- `--yes`: onay istemlerini atla (örneğin sürüm düşürme onayı).

<Warning>
Sürüm düşürmeler onay gerektirir çünkü eski sürümler yapılandırmayı bozabilir.
</Warning>

## `update status`

Etkin güncelleme kanalını + git tag/branch/SHA bilgisini (kaynak checkout'ları için) ve güncelleme kullanılabilirliğini göster.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Seçenekler:

- `--json`: makine tarafından okunabilir durum JSON çıktısı yazdır.
- `--timeout <seconds>`: kontroller için zaman aşımı (varsayılan 3 sn).

## `update wizard`

Güncelleme kanalını seçmek ve güncellemeden sonra Gateway'in yeniden başlatılıp başlatılmayacağını
onaylamak için etkileşimli akış (varsayılan yeniden başlatmaktır). Git checkout olmadan `dev` seçerseniz
bir tane oluşturmayı teklif eder.

Seçenekler:

- `--timeout <seconds>`: her güncelleme adımı için zaman aşımı (varsayılan `1800`)

## Ne yapar

Kanalları açıkça değiştirdiğinizde (`--channel ...`), OpenClaw kurulum yöntemini de
uyumlu tutar:

- `dev` → bir git checkout olduğundan emin olur (varsayılan: `~/openclaw`, `OPENCLAW_GIT_DIR` ile geçersiz kılınabilir),
  onu günceller ve global CLI'ı bu checkout'tan kurar.
- `stable` → `latest` kullanarak npm'den kurar.
- `beta` → npm dist-tag `beta` tercih edilir, ancak beta yoksa veya mevcut stable sürümden
  eskiyse `latest` değerine geri döner.

Gateway çekirdek otomatik güncelleyicisi (yapılandırma ile etkinleştirildiğinde) CLI güncelleme yolunu
canlı Gateway istek işleyicisinin dışında başlatır. Control-plane `update.run` paket yöneticisi
güncellemeleri, paket değişiminden sonra ertelenmeyen ve bekleme süresi olmayan bir güncelleme yeniden başlatmasını zorunlu kılar,
çünkü eski Gateway işleminin belleğinde hâlâ yeni paket tarafından kaldırılmış
dosyalara işaret eden parçalar olabilir.

Paket yöneticisi kurulumlarında `openclaw update`, paket yöneticisini çağırmadan önce
hedef paket sürümünü çözümler. npm global kurulumları aşamalı bir kurulum kullanır:
OpenClaw yeni paketi geçici bir npm prefix içine kurar, oradaki paketlenmiş `dist`
envanterini doğrular, ardından bu temiz paket ağacını gerçek global prefix içine
değiştirir. Doğrulama başarısız olursa güncelleme sonrası doctor, plugin eşitlemesi ve
yeniden başlatma işleri şüpheli ağaçtan çalışmaz. Kurulu sürüm hedefle zaten
eşleşse bile komut global paket kurulumunu yeniler, ardından plugin eşitlemesi,
çekirdek komut tamamlama yenilemesi ve yeniden başlatma işi çalıştırır. Bu,
paketlenmiş yan süreçleri ve kanal tarafından sahip olunan plugin kayıtlarını
kurulu OpenClaw yapısıyla uyumlu tutarken tam plugin komutu tamamlama yeniden oluşturmalarını
açık `openclaw completion --write-state` çalıştırmalarına bırakır.

Yerel yönetilen bir Gateway hizmeti kurulu olduğunda ve yeniden başlatma etkinleştirildiğinde,
paket yöneticisi güncellemeleri paket ağacını değiştirmeden önce çalışan hizmeti durdurur,
ardından güncellenmiş kurulumdan hizmet metadatasını yeniler, hizmeti yeniden başlatır
ve yeniden başlatılan Gateway'in beklenen sürümü raporladığını doğrular. `--no-restart` ile
paket değiştirme yine çalışır ancak yönetilen hizmet durdurulmaz veya yeniden başlatılmaz;
bu nedenle çalışan Gateway, siz elle yeniden başlatana kadar eski kodu tutabilir.

## Git checkout akışı

### Kanal seçimi

- `stable`: en son beta olmayan tag'i checkout et, ardından build ve doctor çalıştır.
- `beta`: en son `-beta` tag'ini tercih et, ancak beta yoksa veya eskiyse en son stable tag'e geri dön.
- `dev`: `main` checkout et, ardından fetch ve rebase yap.

### Güncelleme adımları

<Steps>
  <Step title="Temiz worktree doğrula">
    Commit edilmemiş değişiklik olmamasını gerektirir.
  </Step>
  <Step title="Kanal değiştir">
    Seçilen kanala (tag veya branch) geçer.
  </Step>
  <Step title="Upstream fetch et">
    Yalnızca dev.
  </Step>
  <Step title="Preflight build (yalnızca dev)">
    Geçici bir worktree içinde lint ve TypeScript build çalıştırır. Uç başarısız olursa, en yeni temiz build'i bulmak için 10 commit'e kadar geriye gider.
  </Step>
  <Step title="Rebase">
    Seçilen commit üzerine rebase yapar (yalnızca dev).
  </Step>
  <Step title="Bağımlılıkları kur">
    Repo paket yöneticisini kullanır. pnpm checkout'larında güncelleyici, pnpm workspace içinde `npm run build` çalıştırmak yerine `pnpm`'i isteğe bağlı olarak bootstrap eder (önce `corepack` üzerinden, ardından geçici `npm install pnpm@10` fallback ile).
  </Step>
  <Step title="Control UI build et">
    Gateway'i ve Control UI'ı build eder.
  </Step>
  <Step title="Doctor çalıştır">
    Son güvenli güncelleme kontrolü olarak `openclaw doctor` çalışır.
  </Step>
  <Step title="Plugin'leri eşitle">
    Plugin'leri etkin kanala eşitler. Dev paketlenmiş Plugin'leri kullanır; stable ve beta npm kullanır. npm ile kurulmuş Plugin'leri günceller.
  </Step>
</Steps>

<Warning>
Tam olarak sabitlenmiş bir npm Plugin güncellemesi, bütünlüğü saklanan kurulum kaydından farklı olan bir artifact'e çözümlenirse `openclaw update`, onu kurmak yerine o Plugin artifact güncellemesini iptal eder. Yeni artifact'e güvendiğinizi doğruladıktan sonra Plugin'i açıkça yeniden kurun veya güncelleyin.
</Warning>

<Note>
Güncelleme sonrası Plugin eşitleme hataları güncelleme sonucunu başarısız yapar ve yeniden başlatma takip işini durdurur. Plugin kurulum veya güncelleme hatasını düzeltin, ardından `openclaw update` komutunu yeniden çalıştırın.

Güncellenmiş Gateway başladığında Plugin yükleme yalnızca doğrulama amaçlıdır: başlangıç paket yöneticileri çalıştırmaz veya bağımlılık ağaçlarını değiştirmez. Paket yöneticisi `update.run` yeniden başlatmaları, paket ağacı değiştirildikten sonra normal boşta ertelemeyi ve yeniden başlatma bekleme süresini atlar; böylece eski işlem kaldırılmış parçaları tembel yüklemeye devam edemez.

pnpm bootstrap yine de başarısız olursa güncelleyici, checkout içinde `npm run build` denemek yerine paket yöneticisine özgü bir hatayla erken durur.
</Note>

## `--update` kısaltması

`openclaw --update`, `openclaw update` olarak yeniden yazılır (shell'ler ve başlatıcı betikleri için kullanışlıdır).

## İlgili

- `openclaw doctor` (git checkout'larında önce update çalıştırmayı teklif eder)
- [Geliştirme kanalları](/tr/install/development-channels)
- [Güncelleme](/tr/install/updating)
- [CLI referansı](/tr/cli)
