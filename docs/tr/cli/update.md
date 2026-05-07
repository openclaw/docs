---
read_when:
    - Bir kaynak çalışma kopyasını güvenli şekilde güncellemek istiyorsunuz
    - '`openclaw update` çıktısında veya seçeneklerinde hata ayıklıyorsunuz'
    - '`--update` kısaltma davranışını anlamanız gerekir'
summary: '`openclaw update` için CLI başvurusu (nispeten güvenli kaynak güncellemesi + Gateway otomatik yeniden başlatma)'
title: Güncelle
x-i18n:
    generated_at: "2026-05-07T01:52:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33c1474c6525257b79e947dfa4ce750cadd4e2e440775f5fa3058dcea1a17809
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw'ı güvenle güncelleyin ve stable/beta/dev kanalları arasında geçiş yapın.

**npm/pnpm/bun** üzerinden yüklediyseniz (global kurulum, git meta verisi yok),
güncellemeler [Güncelleme](/tr/install/updating) içindeki paket yöneticisi akışıyla gerçekleşir.

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
- `--channel <stable|beta|dev>`: güncelleme kanalını ayarla (git + npm; config içinde kalıcı olur).
- `--tag <dist-tag|version|spec>`: paket hedefini yalnızca bu güncelleme için geçersiz kıl. Paket kurulumlarında `main`, `github:openclaw/openclaw#main` ile eşlenir.
- `--dry-run`: config yazmadan, yükleme yapmadan, Plugin’leri eşitlemeden veya yeniden başlatmadan planlanan güncelleme eylemlerini (kanal/tag/hedef/yeniden başlatma akışı) önizle.
- `--json`: çekirdek güncellemesi başarılı olduktan sonra bozuk veya yüklenemeyen yönetilen Plugin’lerin onarım gerektirdiği durumlarda `postUpdate.plugins.warnings`, güncelleme sonrası Plugin eşitlemesi sırasında npm Plugin yapıtı sapması algılandığında ise `postUpdate.plugins.integrityDrifts` dahil olmak üzere makine tarafından okunabilir `UpdateRunResult` JSON’unu yazdır.
- `--timeout <seconds>`: adım başına zaman aşımı (varsayılan 1800s).
- `--yes`: onay istemlerini atla (örneğin sürüm düşürme onayı).

`openclaw update` için `--verbose` bayrağı yoktur. Planlanan kanal/tag/yükleme/yeniden başlatma eylemlerini önizlemek için `--dry-run`, makine tarafından okunabilir sonuçlar için `--json` ve yalnızca kanal ile kullanılabilirlik ayrıntılarına ihtiyacınız olduğunda `openclaw update status --json` kullanın. Bir güncelleme sırasında Gateway günlüklerinde hata ayıklıyorsanız, konsol ayrıntı düzeyi ve dosya günlük düzeyi ayrıdır: Gateway `--verbose` terminal/WebSocket çıktısını etkilerken, dosya günlükleri config içinde `logging.level: "debug"` veya `"trace"` gerektirir. Bkz. [Gateway günlükleri](/tr/gateway/logging).

<Note>
Nix modunda (`OPENCLAW_NIX_MODE=1`), durumu değiştiren `openclaw update` çalıştırmaları devre dışıdır. Bunun yerine bu kurulum için Nix kaynağını veya flake girdisini güncelleyin; nix-openclaw için agent öncelikli [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kullanın. `openclaw update status` ve `openclaw update --dry-run` salt okunur kalır.
</Note>

<Warning>
Sürüm düşürmeler onay gerektirir, çünkü daha eski sürümler yapılandırmayı bozabilir.
</Warning>

## `update status`

Etkin güncelleme kanalını + git tag/branch/SHA bilgisini (kaynak checkout’ları için) ve güncelleme kullanılabilirliğini gösterir.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Seçenekler:

- `--json`: makine tarafından okunabilir durum JSON’unu yazdır.
- `--timeout <seconds>`: kontroller için zaman aşımı (varsayılan 3s).

## `update wizard`

Bir güncelleme kanalı seçmek ve güncellemeden sonra Gateway’in yeniden başlatılıp başlatılmayacağını onaylamak için etkileşimli akış (varsayılan yeniden başlatmaktır). Git checkout olmadan `dev` seçerseniz, bir tane oluşturmayı önerir.

Seçenekler:

- `--timeout <seconds>`: her güncelleme adımı için zaman aşımı (varsayılan `1800`)

## Ne yapar

Kanalları açıkça değiştirdiğinizde (`--channel ...`), OpenClaw kurulum yöntemini de hizalı tutar:

- `dev` → bir git checkout olduğundan emin olur (varsayılan: `~/openclaw`, `OPENCLAW_GIT_DIR` ile geçersiz kılınabilir), onu günceller ve global CLI’yi bu checkout’tan yükler.
- `stable` → `latest` kullanarak npm’den yükler.
- `beta` → npm dist-tag `beta` tercih eder, ancak beta eksikse veya mevcut stable sürümden daha eskiyse `latest` değerine geri döner.

OpenClaw’da henüz LTS veya aylık destek kanalı yoktur. Aylık destek hatlarına doğru çalışıyoruz, ancak `--channel` şu anda yalnızca `stable`, `beta` ve `dev` kabul eder. Belirli bir paket yapıtına ihtiyacınız olduğunda tek seferlik hedef için `--tag <version-or-dist-tag>` kullanın.

Gateway çekirdek otomatik güncelleyicisi (config üzerinden etkinleştirildiğinde), CLI güncelleme yolunu canlı Gateway istek işleyicisinin dışında başlatır. Control-plane `update.run` paket yöneticisi güncellemeleri, paket değişiminden sonra ertelenmeyen ve bekleme süresi olmayan bir güncelleme yeniden başlatmasını zorlar; çünkü eski Gateway işlemi, yeni paket tarafından kaldırılmış dosyalara işaret eden bellek içi parçalara hâlâ sahip olabilir.

Paket yöneticisi kurulumlarında `openclaw update`, paket yöneticisini çağırmadan önce hedef paket sürümünü çözer. npm global kurulumları aşamalı kurulum kullanır: OpenClaw yeni paketi geçici bir npm önekine yükler, paketlenmiş `dist` envanterini orada doğrular, ardından bu temiz paket ağacını gerçek global önekle değiştirir. Doğrulama başarısız olursa güncelleme sonrası doctor, Plugin eşitlemesi ve yeniden başlatma işleri şüpheli ağaçtan çalıştırılmaz. Yüklü sürüm zaten hedefle eşleşse bile komut global paket kurulumunu yeniler, ardından Plugin eşitlemesi, çekirdek komut tamamlama yenilemesi ve yeniden başlatma işlerini çalıştırır. Bu, paketlenmiş sidecar’ları ve kanalın sahip olduğu Plugin kayıtlarını yüklü OpenClaw derlemesiyle hizalı tutarken tam Plugin komutu tamamlama yeniden derlemelerini açık `openclaw completion --write-state` çalıştırmalarına bırakır.

Yerel yönetilen bir Gateway hizmeti kurulu olduğunda ve yeniden başlatma etkin olduğunda, paket yöneticisi güncellemeleri paket ağacını değiştirmeden önce çalışan hizmeti durdurur, ardından hizmet meta verilerini güncellenmiş kurulumdan yeniler, hizmeti yeniden başlatır ve başarı bildirmeden önce yeniden başlatılan Gateway’in beklenen sürümü bildirdiğini doğrular. macOS’ta güncelleme sonrası kontrol, LaunchAgent’ın etkin profil için yüklü/çalışır olduğunu ve yapılandırılmış loopback portunun sağlıklı olduğunu da doğrular. plist kuruluysa ancak launchd onu denetlemiyorsa OpenClaw LaunchAgent’ı otomatik olarak yeniden bootstrap eder, ardından sağlık/sürüm/kanal hazır olma kontrollerini yeniden çalıştırır. Taze bir bootstrap, RunAtLoad işini doğrudan yükler; bu nedenle güncelleme kurtarma, yeni başlatılan Gateway üzerinde hemen `kickstart -k` çalıştırmaz. Gateway hâlâ sağlıklı hale gelmezse komut sıfır olmayan bir kodla çıkar ve yeniden başlatma günlük yolunun yanı sıra açık yeniden başlatma, yeniden kurulum ve paket geri alma talimatlarını yazdırır. `--no-restart` ile paket değişimi yine çalışır, ancak yönetilen hizmet durdurulmaz veya yeniden başlatılmaz; bu yüzden çalışan Gateway siz elle yeniden başlatana kadar eski kodu kullanmaya devam edebilir.

## Git checkout akışı

### Kanal seçimi

- `stable`: en son beta olmayan tag’i checkout et, ardından derle ve doctor çalıştır.
- `beta`: en son `-beta` tag’ini tercih et, ancak beta eksikse veya daha eskiyse en son stable tag’e geri dön.
- `dev`: `main` checkout et, ardından fetch ve rebase yap.

### Güncelleme adımları

<Steps>
  <Step title="Verify clean worktree">
    Commit edilmemiş değişiklik olmamasını gerektirir.
  </Step>
  <Step title="Switch channel">
    Seçilen kanala (tag veya branch) geçer.
  </Step>
  <Step title="Fetch upstream">
    Yalnızca dev.
  </Step>
  <Step title="Preflight build (dev only)">
    TypeScript derlemesini geçici bir worktree içinde çalıştırır. Uç başarısız olursa, derlenebilen en yeni commit’i bulmak için en fazla 10 commit geri gider. Bu preflight sırasında lint de çalıştırmak için `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` ayarlayın; kullanıcı güncelleme makineleri CI runner’larından genellikle daha küçük olduğu için lint kısıtlı seri modda çalışır.
  </Step>
  <Step title="Rebase">
    Seçilen commit üzerine rebase yapar (yalnızca dev).
  </Step>
  <Step title="Install dependencies">
    Repo paket yöneticisini kullanır. pnpm checkout’larında güncelleyici, pnpm workspace içinde `npm run build` çalıştırmak yerine `pnpm`’i gerektiğinde bootstrap eder (önce `corepack` üzerinden, sonra geçici `npm install pnpm@10` geri dönüşüyle).
  </Step>
  <Step title="Build Control UI">
    Gateway’i ve Control UI’ı derler.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` son güvenli güncelleme kontrolü olarak çalışır.
  </Step>
  <Step title="Sync plugins">
    Plugin’leri etkin kanala eşitler. Dev paketlenmiş Plugin’leri kullanır; stable ve beta npm kullanır. İzlenen Plugin kurulumlarını günceller.
  </Step>
</Steps>

Beta güncelleme kanalında, varsayılan/latest hattını izleyen izlenen npm ve ClawHub Plugin kurulumları önce bir Plugin `@beta` sürümü dener. Plugin’in beta sürümü yoksa OpenClaw kaydedilmiş default/latest spec değerine geri döner. npm Plugin’leri için OpenClaw, beta paketi mevcut olsa ancak yükleme doğrulamasından geçmese de geri döner. Tam sürümler ve açık tag’ler yeniden yazılmaz.

<Warning>
Tam sabitlenmiş bir npm Plugin güncellemesi, bütünlüğü saklanan kurulum kaydından farklı olan bir yapıta çözülürse, `openclaw update` bu Plugin yapıtı güncellemesini yüklemek yerine iptal eder. Yeni yapıta güvendiğinizi doğruladıktan sonra Plugin’i açıkça yeniden yükleyin veya güncelleyin.
</Warning>

<Note>
Yönetilen bir Plugin ile sınırlı güncelleme sonrası Plugin eşitleme hataları, çekirdek güncellemesi başarılı olduktan sonra uyarı olarak raporlanır. JSON sonucu üst düzey güncelleme `status: "ok"` değerini korur ve `openclaw doctor --fix` ile `openclaw plugins inspect <id> --runtime --json` rehberliği eşliğinde `postUpdate.plugins.status: "warning"` bildirir. Beklenmeyen güncelleyici veya eşitleme istisnaları yine güncelleme sonucunu başarısız yapar. Plugin kurulumu veya güncelleme hatasını düzeltin, ardından `openclaw doctor --fix` veya `openclaw update` komutunu yeniden çalıştırın.

Güncellenen Gateway başladığında, Plugin yükleme yalnızca doğrulama amaçlıdır: başlangıç paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını değiştirmez. Paket yöneticisi `update.run` yeniden başlatmaları, paket ağacı değiştirildikten sonra normal boşta ertelemesini ve yeniden başlatma bekleme süresini atlar; böylece eski işlem kaldırılmış parçaları tembel yüklemeye devam edemez.

pnpm bootstrap yine başarısız olursa güncelleyici checkout içinde `npm run build` denemek yerine paket yöneticisine özgü bir hatayla erken durur.
</Note>

## `--update` kısaltması

`openclaw --update`, `openclaw update` olarak yeniden yazılır (shell’ler ve başlatıcı betikleri için kullanışlıdır).

## İlgili

- `openclaw doctor` (git checkout’larında önce güncelleme çalıştırmayı önerir)
- [Geliştirme kanalları](/tr/install/development-channels)
- [Güncelleme](/tr/install/updating)
- [CLI referansı](/tr/cli)
