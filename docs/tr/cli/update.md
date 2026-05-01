---
read_when:
    - Kaynak kod çalışma kopyasını güvenli bir şekilde güncellemek istiyorsunuz
    - '`--update` kısaltma davranışını anlamanız gerekir'
summary: '`openclaw update` için CLI referansı (güvenli sayılabilecek kaynak güncellemesi + Gateway otomatik yeniden başlatma)'
title: Güncelle
x-i18n:
    generated_at: "2026-05-01T09:00:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc71740dac6b1af8f695ab60d0ffc1b44a10dd40363538c2a8a37ad518790ce9
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw’ı güvenle güncelleyin ve stable/beta/dev kanalları arasında geçiş yapın.

**npm/pnpm/bun** ile kurduysanız (global kurulum, git meta verisi yok),
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

- `--no-restart`: başarılı bir güncellemeden sonra Gateway hizmetini yeniden başlatmayı atla. Gateway’i yeniden başlatan paket yöneticisi güncellemeleri, komut başarılı olmadan önce yeniden başlatılan hizmetin beklenen güncellenmiş sürümü bildirdiğini doğrular.
- `--channel <stable|beta|dev>`: güncelleme kanalını ayarla (git + npm; yapılandırmada kalıcı olur).
- `--tag <dist-tag|version|spec>`: yalnızca bu güncelleme için paket hedefini geçersiz kıl. Paket kurulumlarında `main`, `github:openclaw/openclaw#main` ile eşleşir.
- `--dry-run`: yapılandırma yazmadan, kurulum yapmadan, Plugin’leri eşitlemeden veya yeniden başlatmadan planlanan güncelleme eylemlerini (kanal/etiket/hedef/yeniden başlatma akışı) önizle.
- `--json`: npm Plugin yapıtı sapması güncelleme sonrası Plugin eşitlemesi sırasında algılandığında
  `postUpdate.plugins.integrityDrifts` dahil olmak üzere makine tarafından okunabilir
  `UpdateRunResult` JSON çıktısı yazdır.
- `--timeout <seconds>`: adım başına zaman aşımı (varsayılan 1800s).
- `--yes`: onay istemlerini atla (örneğin sürüm düşürme onayı).

<Warning>
Sürüm düşürmeler onay gerektirir çünkü eski sürümler yapılandırmayı bozabilir.
</Warning>

## `update status`

Etkin güncelleme kanalını + git etiketi/dalı/SHA’sını (kaynak checkout’ları için) ve güncelleme kullanılabilirliğini göster.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Seçenekler:

- `--json`: makine tarafından okunabilir durum JSON’u yazdır.
- `--timeout <seconds>`: denetimler için zaman aşımı (varsayılan 3s).

## `update wizard`

Güncelleme kanalını seçmek ve güncellemeden sonra Gateway’in yeniden başlatılıp başlatılmayacağını
onaylamak için etkileşimli akış (varsayılan yeniden başlatmaktır). Git checkout’ı olmadan `dev` seçerseniz,
bir tane oluşturmayı teklif eder.

Seçenekler:

- `--timeout <seconds>`: her güncelleme adımı için zaman aşımı (varsayılan `1800`)

## Ne yapar

Kanalları açıkça değiştirdiğinizde (`--channel ...`), OpenClaw kurulum yöntemini de
uyumlu tutar:

- `dev` → bir git checkout’ı olduğundan emin olur (varsayılan: `~/openclaw`, `OPENCLAW_GIT_DIR` ile geçersiz kılınabilir),
  onu günceller ve global CLI’yi bu checkout’tan kurar.
- `stable` → `latest` kullanarak npm’den kurar.
- `beta` → npm dist-tag `beta` tercih edilir, ancak beta yoksa veya mevcut stable sürümden
  eskiyse `latest` değerine geri döner.

Gateway çekirdek otomatik güncelleyicisi (yapılandırma üzerinden etkinleştirildiğinde), CLI güncelleme yolunu
canlı Gateway istek işleyicisinin dışında başlatır. Denetim düzlemi `update.run` paket yöneticisi
güncellemeleri, paket değişiminden sonra ertelenmeyen bir güncelleme yeniden başlatmasını zorunlu kılar; çünkü eski
Gateway sürecinde yeni paket tarafından kaldırılmış dosyalara işaret eden bellek içi parçalar hâlâ olabilir.

Paket yöneticisi kurulumlarında `openclaw update`, paket yöneticisini çağırmadan önce hedef paket
sürümünü çözer. npm global kurulumları aşamalı kurulum kullanır: OpenClaw yeni paketi geçici bir npm prefix’ine kurar,
oradaki paketlenmiş `dist` envanterini doğrular, ardından bu temiz paket ağacını gerçek global prefix’e taşır.
Doğrulama başarısız olursa güncelleme sonrası doctor, Plugin eşitlemesi ve yeniden başlatma işleri
şüpheli ağaçtan çalıştırılmaz. Kurulu sürüm hedefle zaten eşleşse bile komut global paket kurulumunu yeniler,
ardından Plugin eşitlemesi, çekirdek komut tamamlama yenilemesi ve yeniden başlatma işlerini çalıştırır. Bu,
paketlenmiş yardımcı süreçleri ve kanalın sahip olduğu Plugin kayıtlarını kurulu OpenClaw derlemesiyle uyumlu tutarken
tam Plugin komutu tamamlama yeniden derlemelerini açık `openclaw completion --write-state` çalıştırmalarına bırakır.

Yerel yönetilen Gateway hizmeti kurulu olduğunda ve yeniden başlatma etkinleştirildiğinde,
paket yöneticisi güncellemeleri paket ağacını değiştirmeden önce çalışan hizmeti durdurur,
ardından güncellenmiş kurulumdan hizmet meta verilerini yeniler, hizmeti yeniden başlatır
ve yeniden başlatılan Gateway’in beklenen sürümü bildirdiğini doğrular. `--no-restart` ile
paket değişimi yine çalışır ancak yönetilen hizmet durdurulmaz veya yeniden başlatılmaz; bu nedenle çalışan Gateway,
siz elle yeniden başlatana kadar eski kodu tutabilir.

## Git checkout akışı

### Kanal seçimi

- `stable`: en son beta olmayan etiketi checkout yap, ardından derle ve doctor çalıştır.
- `beta`: en son `-beta` etiketini tercih et, ancak beta yoksa veya daha eskiyse en son stable etikete geri dön.
- `dev`: `main` checkout yap, ardından fetch ve rebase yap.

### Güncelleme adımları

<Steps>
  <Step title="Verify clean worktree">
    Commit edilmemiş değişiklik olmamasını gerektirir.
  </Step>
  <Step title="Switch channel">
    Seçilen kanala (etiket veya dal) geçer.
  </Step>
  <Step title="Fetch upstream">
    Yalnızca dev.
  </Step>
  <Step title="Preflight build (dev only)">
    Geçici bir worktree’de lint ve TypeScript derlemesi çalıştırır. Uç commit başarısız olursa en yeni temiz derlemeyi bulmak için 10 commit’e kadar geri gider.
  </Step>
  <Step title="Rebase">
    Seçilen commit’in üzerine rebase yapar (yalnızca dev).
  </Step>
  <Step title="Install dependencies">
    Repo paket yöneticisini kullanır. pnpm checkout’larında güncelleyici, pnpm workspace içinde `npm run build` çalıştırmak yerine `pnpm`’i gerektiğinde önyükler (önce `corepack`, ardından geçici `npm install pnpm@10` fallback’i üzerinden).
  </Step>
  <Step title="Build Control UI">
    Gateway’i ve Control UI’yi derler.
  </Step>
  <Step title="Run doctor">
    Son güvenli güncelleme denetimi olarak `openclaw doctor` çalışır.
  </Step>
  <Step title="Sync plugins">
    Plugin’leri etkin kanala eşitler. Dev paketlenmiş Plugin’leri kullanır; stable ve beta npm kullanır. npm ile kurulmuş Plugin’leri günceller.
  </Step>
</Steps>

<Warning>
Tam sabitlenmiş bir npm Plugin güncellemesi, bütünlüğü saklanan kurulum kaydından farklı olan bir yapıta çözümlenirse `openclaw update`, bu Plugin yapıtı güncellemesini kurmak yerine iptal eder. Yeni yapıta güvendiğinizi doğruladıktan sonra Plugin’i açıkça yeniden kurun veya güncelleyin.
</Warning>

<Note>
Güncelleme sonrası Plugin eşitleme hataları güncelleme sonucunu başarısız yapar ve yeniden başlatma takip işini durdurur. Plugin kurulum veya güncelleme hatasını düzeltin, ardından `openclaw update` komutunu yeniden çalıştırın.

Güncellenmiş Gateway başladığında, etkin paketlenmiş Plugin çalışma zamanı bağımlılıkları Plugin etkinleştirmeden önce aşamalandırılır. Paket yöneticisi `update.run` yeniden başlatmaları, paket ağacı değiştirildikten sonra normal boşta ertelemeyi atlar; böylece eski süreç kaldırılmış parçaları tembel biçimde yüklemeye devam edemez. Hizmet yöneticisi yeniden başlatmaları Gateway’i kapatmadan önce çalışma zamanı bağımlılığı aşamalandırmasını yine de boşaltır.

pnpm önyüklemesi hâlâ başarısız olursa güncelleyici, checkout içinde `npm run build` denemek yerine paket yöneticisine özgü bir hatayla erken durur.
</Note>

## `--update` kısaltması

`openclaw --update`, `openclaw update` olarak yeniden yazılır (shell’ler ve başlatıcı betikleri için kullanışlıdır).

## İlgili

- `openclaw doctor` (git checkout’larında önce update çalıştırmayı teklif eder)
- [Geliştirme kanalları](/tr/install/development-channels)
- [Güncelleme](/tr/install/updating)
- [CLI başvurusu](/tr/cli)
