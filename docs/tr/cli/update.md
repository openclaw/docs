---
read_when:
    - Bir kaynak checkout’unu güvenli bir şekilde güncellemek istiyorsunuz
    - '`openclaw update` çıktısında veya seçeneklerinde hata ayıklıyorsunuz'
    - '`--update` kısaltma davranışını anlamanız gerekir'
summary: '`openclaw update` için CLI referansı (nispeten güvenli kaynak güncellemesi + Gateway otomatik yeniden başlatma)'
title: Güncelle
x-i18n:
    generated_at: "2026-05-07T13:15:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw'u güvenle güncelleyin ve stable/beta/dev kanalları arasında geçiş yapın.

**npm/pnpm/bun** ile kurduysanız (global kurulum, git meta verisi yok),
güncellemeler [Updating](/tr/install/updating) içindeki paket yöneticisi akışıyla yapılır.

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
- `--channel <stable|beta|dev>`: güncelleme kanalını ayarla (git + npm; config içinde kalıcı tutulur).
- `--tag <dist-tag|version|spec>`: paket hedefini yalnızca bu güncelleme için geçersiz kıl. Paket kurulumlarında `main`, `github:openclaw/openclaw#main` ile eşleşir.
- `--dry-run`: config yazmadan, kurulum yapmadan, Plugin'leri eşitlemeden veya yeniden başlatmadan planlanan güncelleme eylemlerini (kanal/tag/hedef/yeniden başlatma akışı) önizle.
- `--json`: çekirdek güncelleme başarılı olduktan sonra bozuk veya yüklenemeyen yönetilen Plugin'lerin onarım gerektirdiği durumlarda `postUpdate.plugins.warnings` ve güncelleme sonrası Plugin eşitlemesi sırasında npm Plugin yapıtı sapması algılandığında `postUpdate.plugins.integrityDrifts` dahil olmak üzere makine tarafından okunabilir `UpdateRunResult` JSON'unu yazdır.
- `--timeout <seconds>`: adım başına zaman aşımı (varsayılan 1800s).
- `--yes`: onay istemlerini atla (örneğin sürüm düşürme onayı).

`openclaw update` komutunun `--verbose` bayrağı yoktur. Planlanan kanal/tag/kurulum/yeniden başlatma eylemlerini önizlemek için `--dry-run`, makine tarafından okunabilir sonuçlar için `--json` ve yalnızca kanal ile kullanılabilirlik ayrıntılarına ihtiyacınız olduğunda `openclaw update status --json` kullanın. Bir güncelleme etrafında Gateway günlüklerinde hata ayıklıyorsanız, konsol ayrıntı düzeyi ile dosya günlük düzeyi ayrıdır: Gateway `--verbose`, terminal/WebSocket çıktısını etkilerken dosya günlükleri config içinde `logging.level: "debug"` veya `"trace"` gerektirir. Bkz. [Gateway logging](/tr/gateway/logging).

<Note>
Nix modunda (`OPENCLAW_NIX_MODE=1`), değişiklik yapan `openclaw update` çalıştırmaları devre dışıdır. Bunun yerine bu kurulum için Nix kaynağını veya flake girdisini güncelleyin; nix-openclaw için agent-first [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) kullanın. `openclaw update status` ve `openclaw update --dry-run` salt okunur kalır.
</Note>

<Warning>
Eski sürümler yapılandırmayı bozabileceğinden sürüm düşürmeler onay gerektirir.
</Warning>

## `update status`

Etkin güncelleme kanalını + git tag/branch/SHA bilgisini (kaynak checkout'ları için) ve güncelleme kullanılabilirliğini göster.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Seçenekler:

- `--json`: makine tarafından okunabilir durum JSON'unu yazdır.
- `--timeout <seconds>`: kontroller için zaman aşımı (varsayılan 3s).

## `update wizard`

Bir güncelleme kanalı seçmek ve güncellemeden sonra Gateway'in yeniden başlatılıp başlatılmayacağını onaylamak için etkileşimli akış (varsayılan yeniden başlatmaktır). Git checkout olmadan `dev` seçerseniz, bir tane oluşturmayı önerir.

Seçenekler:

- `--timeout <seconds>`: her güncelleme adımı için zaman aşımı (varsayılan `1800`)

## Ne yapar?

Kanalları açıkça değiştirdiğinizde (`--channel ...`), OpenClaw kurulum yöntemini de uyumlu tutar:

- `dev` → bir git checkout olmasını sağlar (varsayılan: `~/openclaw`, `OPENCLAW_GIT_DIR` ile geçersiz kılınır), onu günceller ve global CLI'ı bu checkout'tan kurar.
- `stable` → npm'den `latest` kullanarak kurar.
- `beta` → npm dist-tag `beta` tercih eder, ancak beta yoksa veya geçerli stable sürümden eskiyse `latest` sürümüne geri döner.

Gateway çekirdek otomatik güncelleyicisi (config üzerinden etkinleştirildiğinde), CLI güncelleme yolunu canlı Gateway istek işleyicisinin dışında başlatır. Kontrol düzlemi `update.run` paket yöneticisi güncellemeleri, paket değişiminden sonra ertelenmeyen ve bekleme süresi olmayan bir güncelleme yeniden başlatmasını zorunlu kılar; çünkü eski Gateway işleminin belleğinde hâlâ yeni paket tarafından kaldırılmış dosyalara işaret eden parçalar olabilir.

Paket yöneticisi kurulumlarında `openclaw update`, paket yöneticisini çağırmadan önce hedef paket sürümünü çözer. npm global kurulumları aşamalı bir kurulum kullanır: OpenClaw yeni paketi geçici bir npm prefix içine kurar, oradaki paketlenmiş `dist` envanterini doğrular, sonra bu temiz paket ağacını gerçek global prefix içine değiştirir. Doğrulama başarısız olursa, güncelleme sonrası doctor, Plugin eşitlemesi ve yeniden başlatma işleri şüpheli ağaçtan çalıştırılmaz. Kurulu sürüm hedefle zaten eşleşse bile, komut global paket kurulumunu yeniler, ardından Plugin eşitlemesini, çekirdek komut tamamlama yenilemesini ve yeniden başlatma işlerini çalıştırır. Bu, paketlenmiş yardımcı bileşenleri ve kanalın sahip olduğu Plugin kayıtlarını kurulu OpenClaw derlemesiyle uyumlu tutarken tam Plugin komutu tamamlama yeniden derlemelerini açık `openclaw completion --write-state` çalıştırmalarına bırakır.

Yerel yönetilen bir Gateway hizmeti kuruluysa ve yeniden başlatma etkinse, paket yöneticisi güncellemeleri paket ağacını değiştirmeden önce çalışan hizmeti durdurur, sonra güncellenmiş kurulumdan hizmet meta verilerini yeniler, hizmeti yeniden başlatır ve başarı bildirmeden önce yeniden başlatılan Gateway'in beklenen sürümü bildirdiğini doğrular. macOS'ta güncelleme sonrası kontrol ayrıca LaunchAgent'ın etkin profil için yüklenmiş/çalışıyor olduğunu ve yapılandırılmış loopback portunun sağlıklı olduğunu doğrular. plist kuruluysa ancak launchd onu denetlemiyorsa, OpenClaw LaunchAgent'ı otomatik olarak yeniden bootstrap eder, ardından sağlık/sürüm/kanal hazır olma kontrollerini yeniden çalıştırır. Yeni bir bootstrap, RunAtLoad işini doğrudan yükler; bu yüzden güncelleme kurtarma yeni oluşturulan Gateway için hemen `kickstart -k` çalıştırmaz. Gateway hâlâ sağlıklı hale gelmezse, komut sıfır olmayan kodla çıkar ve yeniden başlatma günlük yolunu, ayrıca açık yeniden başlatma, yeniden kurulum ve paket geri alma talimatlarını yazdırır. `--no-restart` ile paket değişimi yine çalışır, ancak yönetilen hizmet durdurulmaz veya yeniden başlatılmaz; bu yüzden çalışan Gateway siz elle yeniden başlatana kadar eski kodu kullanmaya devam edebilir.

## Git checkout akışı

### Kanal seçimi

- `stable`: en son beta olmayan tag'e checkout yapar, ardından derleme ve doctor çalıştırır.
- `beta`: en son `-beta` tag'ini tercih eder, ancak beta yoksa veya eskiyse en son stable tag'e geri döner.
- `dev`: `main` dalına checkout yapar, ardından fetch ve rebase çalıştırır.

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
    TypeScript derlemesini geçici bir worktree içinde çalıştırır. Uç başarısız olursa, derlenebilir en yeni commit'i bulmak için en fazla 10 commit geriye gider. Bu ön kontrolde lint de çalıştırmak için `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` ayarlayın; kullanıcı güncelleme makineleri çoğu zaman CI runner'larından daha küçük olduğu için lint kısıtlı seri modda çalışır.
  </Step>
  <Step title="Rebase">
    Seçilen commit üzerine rebase yapar (yalnızca dev).
  </Step>
  <Step title="Install dependencies">
    Repo paket yöneticisini kullanır. pnpm checkout'ları için güncelleyici, pnpm workspace içinde `npm run build` çalıştırmak yerine `pnpm`'i ihtiyaç anında bootstrap eder (önce `corepack` üzerinden, sonra geçici bir `npm install pnpm@10` yedeğiyle).
  </Step>
  <Step title="Build Control UI">
    Gateway'i ve Control UI'ı derler.
  </Step>
  <Step title="Run doctor">
    Son güvenli güncelleme kontrolü olarak `openclaw doctor` çalışır.
  </Step>
  <Step title="Sync plugins">
    Plugin'leri etkin kanala eşitler. Dev paketlenmiş Plugin'leri kullanır; stable ve beta npm kullanır. İzlenen Plugin kurulumlarını günceller.
  </Step>
</Steps>

Beta güncelleme kanalında, varsayılan/latest hattını izleyen izlenen npm ve ClawHub Plugin kurulumları önce bir Plugin `@beta` sürümünü dener. Plugin'in beta sürümü yoksa, OpenClaw kayıtlı varsayılan/latest spec değerine geri döner. npm Plugin'leri için OpenClaw, beta paketi mevcut olup kurulum doğrulamasında başarısız olduğunda da geri döner. Kesin sürümler ve açık tag'ler yeniden yazılmaz.

<Warning>
Kesin olarak pinlenmiş bir npm Plugin güncellemesi, bütünlüğü saklanan kurulum kaydından farklı olan bir yapıta çözülürse, `openclaw update` bu Plugin yapıtı güncellemesini kurmak yerine durdurur. Yeni yapıta güvendiğinizi doğruladıktan sonra Plugin'i yalnızca açıkça yeniden kurun veya güncelleyin.
</Warning>

<Note>
Yönetilen bir Plugin kapsamındaki güncelleme sonrası Plugin eşitleme hataları, çekirdek güncelleme başarılı olduktan sonra uyarı olarak bildirilir. JSON sonucu üst düzey güncelleme için `status: "ok"` değerini korur ve `openclaw doctor --fix` ile `openclaw plugins inspect <id> --runtime --json` yönlendirmesiyle `postUpdate.plugins.status: "warning"` bildirir. Beklenmeyen güncelleyici veya eşitleme istisnaları güncelleme sonucunu yine başarısız yapar. Plugin kurulumunu veya güncelleme hatasını düzeltin, ardından `openclaw doctor --fix` ya da `openclaw update` komutunu yeniden çalıştırın.

Güncellenen Gateway başladığında, Plugin yükleme yalnızca doğrulama amaçlıdır: başlangıç paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını değiştirmez. Paket yöneticisi `update.run` yeniden başlatmaları, paket ağacı değiştirildikten sonra normal boşta ertelemeyi ve yeniden başlatma bekleme süresini atlar; böylece eski işlem kaldırılmış parçaları tembel yüklemeyle kullanmaya devam edemez.

pnpm bootstrap yine başarısız olursa, güncelleyici checkout içinde `npm run build` denemek yerine paket yöneticisine özgü bir hatayla erken durur.
</Note>

## `--update` kısayolu

`openclaw --update`, `openclaw update` olarak yeniden yazılır (shell'ler ve başlatıcı script'ler için kullanışlıdır).

## İlgili

- `openclaw doctor` (git checkout'larında önce güncelleme çalıştırmayı önerir)
- [Development channels](/tr/install/development-channels)
- [Updating](/tr/install/updating)
- [CLI reference](/tr/cli)
