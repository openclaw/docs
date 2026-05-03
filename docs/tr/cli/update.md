---
read_when:
    - Bir kaynak çalışma kopyasını güvenli bir şekilde güncellemek istiyorsunuz
    - '`openclaw update` çıktısında veya seçeneklerinde hata ayıklıyorsunuz'
    - '`--update` kısa gösterim davranışını anlamanız gerekir'
summary: '`openclaw update` için CLI başvurusu (güvenli sayılabilecek kaynak güncellemesi + Gateway otomatik yeniden başlatma)'
title: Güncelle
x-i18n:
    generated_at: "2026-05-03T21:29:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ec06b8db5e2aba4000922f92a36834e8782986a77f6b5889bb19031a59f1b8
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw'u güvenle güncelleyin ve stable/beta/dev kanalları arasında geçiş yapın.

**npm/pnpm/bun** üzerinden yüklediyseniz (global yükleme, git meta verisi yok),
güncellemeler [Güncelleme](/tr/install/updating) içindeki paket yöneticisi akışıyla yapılır.

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

- `--no-restart`: başarılı bir güncellemeden sonra Gateway hizmetini yeniden başlatmayı atlar. Gateway'i yeniden başlatan paket yöneticisi güncellemeleri, komut başarılı olmadan önce yeniden başlatılan hizmetin beklenen güncellenmiş sürümü bildirdiğini doğrular.
- `--channel <stable|beta|dev>`: güncelleme kanalını ayarlar (git + npm; config içinde kalıcı olur).
- `--tag <dist-tag|version|spec>`: paket hedefini yalnızca bu güncelleme için geçersiz kılar. Paket yüklemelerinde `main`, `github:openclaw/openclaw#main` ile eşleşir.
- `--dry-run`: config yazmadan, yükleme yapmadan, pluginleri eşitlemeden veya yeniden başlatmadan planlanan güncelleme işlemlerini (kanal/tag/hedef/yeniden başlatma akışı) önizler.
- `--json`: güncelleme sonrası plugin eşitlemesi sırasında npm plugin yapıtı sapması
  algılandığında `postUpdate.plugins.integrityDrifts` dahil olmak üzere
  makine tarafından okunabilir `UpdateRunResult` JSON çıktısı verir.
- `--timeout <seconds>`: adım başına zaman aşımı (varsayılan 1800 sn).
- `--yes`: onay istemlerini atlar (örneğin sürüm düşürme onayı).

`openclaw update` için `--verbose` bayrağı yoktur. Planlanan kanal/tag/yükleme/yeniden başlatma işlemlerini önizlemek için `--dry-run`, makine tarafından okunabilir sonuçlar için `--json` ve yalnızca kanal ile kullanılabilirlik ayrıntılarına ihtiyaç duyduğunuzda `openclaw update status --json` kullanın. Bir güncelleme sırasında Gateway günlüklerinde hata ayıklıyorsanız, konsol ayrıntı düzeyi ile dosya günlük düzeyi ayrıdır: Gateway `--verbose`, terminal/WebSocket çıktısını etkiler; dosya günlükleri ise config içinde `logging.level: "debug"` veya `"trace"` gerektirir. Bkz. [Gateway günlükleme](/tr/gateway/logging).

<Warning>
Sürüm düşürmeler onay gerektirir çünkü eski sürümler yapılandırmayı bozabilir.
</Warning>

## `update status`

Etkin güncelleme kanalını + git tag/branch/SHA bilgisini (kaynak checkout'lar için) ve güncelleme kullanılabilirliğini gösterir.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Seçenekler:

- `--json`: makine tarafından okunabilir durum JSON çıktısı verir.
- `--timeout <seconds>`: kontroller için zaman aşımı (varsayılan 3 sn).

## `update wizard`

Bir güncelleme kanalı seçmek ve güncellemeden sonra Gateway'in yeniden başlatılıp başlatılmayacağını onaylamak için etkileşimli akış
(varsayılan yeniden başlatmadır). Git checkout olmadan `dev` seçerseniz,
bir tane oluşturmayı önerir.

Seçenekler:

- `--timeout <seconds>`: her güncelleme adımı için zaman aşımı (varsayılan `1800`)

## Ne yapar

Kanalları açıkça değiştirdiğinizde (`--channel ...`), OpenClaw yükleme yöntemini de
uyumlu tutar:

- `dev` → bir git checkout olduğundan emin olur (varsayılan: `~/openclaw`, `OPENCLAW_GIT_DIR` ile geçersiz kılınabilir),
  onu günceller ve global CLI'yi bu checkout'tan yükler.
- `stable` → `latest` kullanarak npm'den yükler.
- `beta` → npm dist-tag `beta` değerini tercih eder, ancak beta yoksa veya mevcut
  kararlı sürümden eskiyse `latest` değerine geri döner.

Gateway çekirdek otomatik güncelleyicisi (config üzerinden etkinleştirildiğinde), CLI güncelleme yolunu
canlı Gateway istek işleyicisinin dışında başlatır. Control-plane `update.run` paket yöneticisi
güncellemeleri, paket değişiminden sonra ertelenmeyen, bekleme süresiz bir güncelleme yeniden başlatmasını zorlar;
çünkü eski Gateway işlemi hâlâ yeni paket tarafından kaldırılmış dosyalara işaret eden
bellek içi parçalara sahip olabilir.

Paket yöneticisi yüklemelerinde `openclaw update`, paket yöneticisini çağırmadan önce hedef paket
sürümünü çözer. npm global yüklemeleri aşamalı bir yükleme kullanır: OpenClaw yeni paketi
geçici bir npm prefix içine yükler, oradaki paketlenmiş `dist` envanterini doğrular,
ardından bu temiz paket ağacını gerçek global prefix içine taşır. Doğrulama başarısız olursa,
güncelleme sonrası doctor, plugin eşitlemesi ve yeniden başlatma işleri şüpheli ağaçtan çalışmaz.
Yüklü sürüm hedefle zaten eşleşse bile komut global paket yüklemesini yeniler,
ardından plugin eşitlemesi, çekirdek komut tamamlama yenilemesi ve yeniden başlatma işlerini çalıştırır. Bu,
paketlenmiş yardımcı süreçleri ve kanalın sahip olduğu plugin kayıtlarını yüklü OpenClaw build'iyle
uyumlu tutarken tam plugin komutu tamamlama yeniden oluşturmalarını açık
`openclaw completion --write-state` çalıştırmalarına bırakır.

Yerel yönetilen Gateway hizmeti yüklüyse ve yeniden başlatma etkinse,
paket yöneticisi güncellemeleri paket ağacını değiştirmeden önce çalışan hizmeti durdurur,
ardından güncellenmiş yüklemeden hizmet meta verilerini yeniler, hizmeti yeniden başlatır
ve başarı bildirmeden önce yeniden başlatılan Gateway'in beklenen sürümü bildirdiğini doğrular.
macOS'te, güncelleme sonrası kontrol ayrıca LaunchAgent'ın etkin profil için yüklü/çalışır durumda olduğunu
ve yapılandırılmış loopback portunun sağlıklı olduğunu doğrular. plist yüklüyse ancak launchd onu denetlemiyorsa,
OpenClaw LaunchAgent'ı otomatik olarak yeniden bootstrap eder, ardından sağlık/sürüm/kanal hazırlık kontrollerini
yeniden çalıştırır. Yeni bir bootstrap, RunAtLoad işini doğrudan yükler; bu nedenle güncelleme kurtarma,
yeni başlatılan Gateway için hemen `kickstart -k` çalıştırmaz. Gateway yine de sağlıklı hale gelmezse,
komut sıfır olmayan kodla çıkar ve yeniden başlatma günlük yolunun yanı sıra açık yeniden başlatma,
yeniden yükleme ve paket geri alma yönergeleri yazdırır. `--no-restart` ile
paket değiştirme yine çalışır ancak yönetilen hizmet durdurulmaz veya yeniden başlatılmaz;
bu nedenle çalışan Gateway, siz elle yeniden başlatana kadar eski kodu kullanmaya devam edebilir.

## Git checkout akışı

### Kanal seçimi

- `stable`: en son beta olmayan tag'i checkout eder, ardından build ve doctor çalıştırır.
- `beta`: en son `-beta` tag'ini tercih eder, ancak beta yoksa veya daha eskiyse en son stable tag'e geri döner.
- `dev`: `main` checkout eder, ardından fetch ve rebase yapar.

### Güncelleme adımları

<Steps>
  <Step title="Temiz worktree doğrula">
    Commit edilmemiş değişiklik olmamasını gerektirir.
  </Step>
  <Step title="Kanal değiştir">
    Seçilen kanala geçer (tag veya branch).
  </Step>
  <Step title="Upstream fetch et">
    Yalnızca dev.
  </Step>
  <Step title="Ön kontrol build'i (yalnızca dev)">
    Geçici bir worktree içinde lint ve TypeScript build çalıştırır. Uç commit başarısız olursa, en yeni temiz build'i bulmak için en fazla 10 commit geriye gider.
  </Step>
  <Step title="Rebase">
    Seçilen commit üzerine rebase eder (yalnızca dev).
  </Step>
  <Step title="Bağımlılıkları yükle">
    Repo paket yöneticisini kullanır. pnpm checkout'larında, güncelleyici pnpm workspace içinde `npm run build` çalıştırmak yerine `pnpm`'i ihtiyaç halinde bootstrap eder (önce `corepack` ile, ardından geçici `npm install pnpm@10` yedeğiyle).
  </Step>
  <Step title="Control UI build et">
    Gateway'i ve Control UI'yi build eder.
  </Step>
  <Step title="Doctor çalıştır">
    Son güvenli güncelleme kontrolü olarak `openclaw doctor` çalışır.
  </Step>
  <Step title="Pluginleri eşitle">
    Pluginleri etkin kanala eşitler. Dev, paketle birlikte gelen pluginleri kullanır; stable ve beta npm kullanır. İzlenen plugin yüklemelerini günceller.
  </Step>
</Steps>

Beta güncelleme kanalında, varsayılan/latest çizgiyi izleyen izlenen npm ve ClawHub plugin yüklemeleri
önce bir plugin `@beta` sürümünü dener. Plugin'in beta sürümü yoksa OpenClaw,
kaydedilmiş varsayılan/latest spec değerine geri döner. Tam sürümler ve açık tag'ler yeniden yazılmaz.

<Warning>
Tam sabitlenmiş bir npm plugin güncellemesi, bütünlüğü saklanan yükleme kaydından farklı olan bir yapıta çözümlenirse, `openclaw update` bu plugin yapıtı güncellemesini yüklemek yerine iptal eder. Yeni yapıta güvendiğinizi doğruladıktan sonra plugini açıkça yeniden yükleyin veya güncelleyin.
</Warning>

<Note>
Güncelleme sonrası plugin eşitleme hataları güncelleme sonucunu başarısız yapar ve yeniden başlatma takip işini durdurur. Plugin yükleme veya güncelleme hatasını düzeltin, ardından `openclaw update` komutunu yeniden çalıştırın.

Güncellenmiş Gateway başladığında, plugin yükleme yalnızca doğrulama amaçlıdır: başlangıç paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını değiştirmez. Paket yöneticisi `update.run` yeniden başlatmaları, paket ağacı değiştirildikten sonra normal boşta ertelemeyi ve yeniden başlatma bekleme süresini atlar; böylece eski işlem kaldırılmış parçaları lazy-loading ile kullanmaya devam edemez.

pnpm bootstrap yine de başarısız olursa, güncelleyici checkout içinde `npm run build` denemek yerine paket yöneticisine özgü bir hatayla erken durur.
</Note>

## `--update` kısaltması

`openclaw --update`, `openclaw update` olarak yeniden yazılır (shell'ler ve başlatıcı scriptler için kullanışlıdır).

## İlgili

- `openclaw doctor` (git checkout'larında önce update çalıştırmayı önerir)
- [Geliştirme kanalları](/tr/install/development-channels)
- [Güncelleme](/tr/install/updating)
- [CLI başvurusu](/tr/cli)
