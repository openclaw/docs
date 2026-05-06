---
read_when:
    - Bir kaynak çalışma kopyasını güvenli şekilde güncellemek istiyorsunuz
    - '`openclaw update` çıktısında veya seçeneklerinde hata ayıklıyorsunuz'
    - '`--update` kısaltma davranışını anlamanız gerekir'
summary: '`openclaw update` için CLI referansı (görece güvenli kaynak güncellemesi + Gateway otomatik yeniden başlatma)'
title: Güncelle
x-i18n:
    generated_at: "2026-05-06T17:54:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw'ı güvenli şekilde güncelleyin ve stable/beta/dev kanalları arasında geçiş yapın.

**npm/pnpm/bun** ile yüklediyseniz (global yükleme, git metadata yok),
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

- `--no-restart`: başarılı bir güncellemeden sonra Gateway hizmetini yeniden başlatmayı atla. Gateway'i yeniden başlatan paket yöneticisi güncellemeleri, komut başarılı olmadan önce yeniden başlatılan hizmetin beklenen güncellenmiş sürümü bildirdiğini doğrular.
- `--channel <stable|beta|dev>`: güncelleme kanalını ayarla (git + npm; config içinde kalıcıdır).
- `--tag <dist-tag|version|spec>`: yalnızca bu güncelleme için paket hedefini geçersiz kıl. Paket yüklemelerinde `main`, `github:openclaw/openclaw#main` değerine eşlenir.
- `--dry-run`: config yazmadan, yükleme yapmadan, plugins eşitlemeden veya yeniden başlatmadan planlanan güncelleme eylemlerini (kanal/tag/hedef/yeniden başlatma akışı) önizle.
- `--json`: core güncellemesi başarılı olduktan sonra bozuk veya yüklenemeyen yönetilen plugins onarım gerektirdiğinde `postUpdate.plugins.warnings` dahil, güncelleme sonrası Plugin eşitlemesi sırasında npm Plugin artifact sapması algılandığında `postUpdate.plugins.integrityDrifts` dahil makine tarafından okunabilir `UpdateRunResult` JSON yazdır.
- `--timeout <seconds>`: adım başına zaman aşımı (varsayılan 1800 sn).
- `--yes`: onay istemlerini atla (örneğin sürüm düşürme onayı).

`openclaw update` için `--verbose` flag'i yoktur. Planlanan kanal/tag/yükleme/yeniden başlatma eylemlerini önizlemek için `--dry-run`, makine tarafından okunabilir sonuçlar için `--json`, yalnızca kanal ve kullanılabilirlik ayrıntıları gerektiğinde `openclaw update status --json` kullanın. Bir güncelleme sırasında Gateway günlüklerinde hata ayıklıyorsanız, konsol ayrıntı düzeyi ve dosya günlük seviyesi ayrıdır: Gateway `--verbose` terminal/WebSocket çıktısını etkilerken, dosya günlükleri config içinde `logging.level: "debug"` veya `"trace"` gerektirir. Bkz. [Gateway günlükleri](/tr/gateway/logging).

<Note>
Nix modunda (`OPENCLAW_NIX_MODE=1`), değişiklik yapan `openclaw update` çalıştırmaları devre dışıdır. Bunun yerine bu yükleme için Nix kaynağını veya flake girdisini güncelleyin; nix-openclaw için agent-first [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kullanın. `openclaw update status` ve `openclaw update --dry-run` salt okunur kalır.
</Note>

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

- `--json`: makine tarafından okunabilir durum JSON'u yazdır.
- `--timeout <seconds>`: kontroller için zaman aşımı (varsayılan 3 sn).

## `update wizard`

Güncelleme kanalı seçmek ve güncellemeden sonra Gateway'in yeniden başlatılıp başlatılmayacağını onaylamak için etkileşimli akış (varsayılan yeniden başlatmaktır). Git checkout olmadan `dev` seçerseniz bir tane oluşturmayı önerir.

Seçenekler:

- `--timeout <seconds>`: her güncelleme adımı için zaman aşımı (varsayılan `1800`)

## Ne yapar

Kanalları açıkça değiştirdiğinizde (`--channel ...`), OpenClaw yükleme yöntemini de hizalı tutar:

- `dev` → git checkout bulunduğundan emin olur (varsayılan: `~/openclaw`, `OPENCLAW_GIT_DIR` ile geçersiz kılınabilir), onu günceller ve global CLI'ı bu checkout'tan yükler.
- `stable` → npm'den `latest` kullanarak yükler.
- `beta` → npm dist-tag `beta` tercih eder, ancak beta eksikse veya mevcut stable sürümden eskiyse `latest` değerine geri döner.

Gateway core otomatik güncelleyicisi (config ile etkinleştirildiğinde), CLI güncelleme yolunu canlı Gateway istek işleyicisinin dışında başlatır. Control-plane `update.run` paket yöneticisi güncellemeleri, paket değişiminden sonra ertelenmeyen ve bekleme süresi olmayan bir güncelleme yeniden başlatmasını zorlar; çünkü eski Gateway süreci hâlâ yeni paket tarafından kaldırılmış dosyalara işaret eden bellek içi parçalara sahip olabilir.

Paket yöneticisi yüklemelerinde `openclaw update`, paket yöneticisini çağırmadan önce hedef paket sürümünü çözümler. npm global yüklemeleri aşamalı yükleme kullanır: OpenClaw yeni paketi geçici bir npm prefix içine yükler, oradaki paketlenmiş `dist` envanterini doğrular, ardından bu temiz paket ağacını gerçek global prefix'e taşır. Doğrulama başarısız olursa güncelleme sonrası doctor, Plugin eşitlemesi ve yeniden başlatma işleri şüpheli ağaçtan çalıştırılmaz. Yüklü sürüm hedefle zaten eşleşse bile komut global paket yüklemesini yeniler, ardından Plugin eşitlemesi, core komut tamamlama yenilemesi ve yeniden başlatma işlerini çalıştırır. Bu, paketlenmiş sidecar'ları ve kanalın sahip olduğu Plugin kayıtlarını yüklü OpenClaw yapısıyla hizalı tutarken tam Plugin komut tamamlama yeniden oluşturmalarını açık `openclaw completion --write-state` çalıştırmalarına bırakır.

Yerel yönetilen Gateway hizmeti yüklüyse ve yeniden başlatma etkinse, paket yöneticisi güncellemeleri paket ağacını değiştirmeden önce çalışan hizmeti durdurur, ardından güncellenmiş yüklemeden hizmet metadata'sını yeniler, hizmeti yeniden başlatır ve başarı bildirmeden önce yeniden başlatılan Gateway'in beklenen sürümü bildirdiğini doğrular. macOS'te güncelleme sonrası kontrol, etkin profil için LaunchAgent'ın yüklü/çalışıyor olduğunu ve yapılandırılan loopback portunun sağlıklı olduğunu da doğrular. plist yüklüyse ancak launchd onu denetlemiyorsa OpenClaw LaunchAgent'ı otomatik olarak yeniden bootstrap eder, ardından sağlık/sürüm/kanal hazırlık kontrollerini yeniden çalıştırır. Yeni bir bootstrap RunAtLoad işini doğrudan yükler, bu nedenle güncelleme kurtarma yeni başlatılmış Gateway için hemen `kickstart -k` çalıştırmaz. Gateway yine de sağlıklı hale gelmezse komut sıfır olmayan kodla çıkar ve yeniden başlatma günlük yolunu, ayrıca açık yeniden başlatma, yeniden yükleme ve paket rollback talimatlarını yazdırır. `--no-restart` ile paket değiştirme yine çalışır ancak yönetilen hizmet durdurulmaz veya yeniden başlatılmaz; bu nedenle çalışan Gateway, siz manuel olarak yeniden başlatana kadar eski kodu tutabilir.

## Git checkout akışı

### Kanal seçimi

- `stable`: en son beta olmayan tag'i checkout et, ardından build ve doctor çalıştır.
- `beta`: en son `-beta` tag'ini tercih et, ancak beta eksikse veya eskiyse en son stable tag'e geri dön.
- `dev`: `main` checkout et, ardından fetch ve rebase yap.

### Güncelleme adımları

<Steps>
  <Step title="Temiz worktree doğrula">
    Commit edilmemiş değişiklik olmamasını gerektirir.
  </Step>
  <Step title="Kanal değiştir">
    Seçilen kanala (tag veya branch) geçer.
  </Step>
  <Step title="Upstream getir">
    Yalnızca dev.
  </Step>
  <Step title="Ön build kontrolü (yalnızca dev)">
    TypeScript build'i geçici bir worktree içinde çalıştırır. Uç commit başarısız olursa, build edilebilen en yeni commit'i bulmak için en fazla 10 commit geriye gider. Bu ön kontrolde lint de çalıştırmak için `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` ayarlayın; kullanıcı güncelleme host'ları genellikle CI runner'larından daha küçük olduğu için lint kısıtlı seri modda çalışır.
  </Step>
  <Step title="Rebase">
    Seçilen commit üzerine rebase yapar (yalnızca dev).
  </Step>
  <Step title="Bağımlılıkları yükle">
    Repo paket yöneticisini kullanır. pnpm checkout'ları için güncelleyici, bir pnpm workspace içinde `npm run build` çalıştırmak yerine `pnpm`'i gerektiğinde bootstrap eder (önce `corepack` üzerinden, ardından geçici `npm install pnpm@10` fallback'iyle).
  </Step>
  <Step title="Control UI build et">
    Gateway'i ve Control UI'ı build eder.
  </Step>
  <Step title="Doctor çalıştır">
    Son güvenli güncelleme kontrolü olarak `openclaw doctor` çalışır.
  </Step>
  <Step title="Plugins eşitle">
    Plugins'i etkin kanala eşitler. Dev paketli plugins kullanır; stable ve beta npm kullanır. İzlenen Plugin yüklemelerini günceller.
  </Step>
</Steps>

Beta güncelleme kanalında, default/latest çizgisini izleyen izlenen npm ve ClawHub Plugin yüklemeleri önce bir Plugin `@beta` sürümünü dener. Plugin'in beta sürümü yoksa OpenClaw kayıtlı default/latest spec'e geri döner. npm plugins için OpenClaw beta paketi mevcut olsa ancak yükleme doğrulamasında başarısız olsa da geri döner. Kesin sürümler ve açık tag'ler yeniden yazılmaz.

<Warning>
Kesin sabitlenmiş bir npm Plugin güncellemesi, bütünlüğü depolanan yükleme kaydından farklı olan bir artifact'e çözümlenirse `openclaw update` bu Plugin artifact güncellemesini yüklemek yerine iptal eder. Yeni artifact'e güvendiğinizi doğruladıktan sonra Plugin'i açıkça yeniden yükleyin veya güncelleyin.
</Warning>

<Note>
Yönetilen bir Plugin kapsamındaki güncelleme sonrası Plugin eşitleme hataları, core güncellemesi başarılı olduktan sonra uyarı olarak bildirilir. JSON sonucu üst düzey güncelleme `status: "ok"` değerini korur ve `openclaw doctor --fix` ile `openclaw plugins inspect <id> --runtime --json` yönlendirmeleriyle `postUpdate.plugins.status: "warning"` bildirir. Beklenmeyen güncelleyici veya eşitleme istisnaları yine güncelleme sonucunu başarısız yapar. Plugin yükleme veya güncelleme hatasını düzeltin, ardından `openclaw doctor --fix` veya `openclaw update` yeniden çalıştırın.

Güncellenmiş Gateway başladığında Plugin yükleme yalnızca doğrulamadır: başlangıç paket yöneticileri çalıştırmaz veya bağımlılık ağaçlarını değiştirmez. Paket yöneticisi `update.run` yeniden başlatmaları, paket ağacı değiştirildikten sonra normal boşta ertelemeyi ve yeniden başlatma bekleme süresini atlar; böylece eski süreç kaldırılmış parçaları lazy-load etmeye devam edemez.

pnpm bootstrap yine başarısız olursa güncelleyici, checkout içinde `npm run build` denemek yerine paket yöneticisine özgü bir hatayla erken durur.
</Note>

## `--update` kısayolu

`openclaw --update`, `openclaw update` olarak yeniden yazılır (shell'ler ve launcher script'leri için kullanışlıdır).

## İlgili

- `openclaw doctor` (git checkout'larında önce update çalıştırmayı önerir)
- [Geliştirme kanalları](/tr/install/development-channels)
- [Güncelleme](/tr/install/updating)
- [CLI referansı](/tr/cli)
