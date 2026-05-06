---
read_when:
    - Bir kaynak çalışma kopyasını güvenli şekilde güncellemek istiyorsunuz
    - '`openclaw update` çıktısı veya seçeneklerinde hata ayıklıyorsunuz'
    - '`--update` kısaltma davranışını anlamanız gerekir'
summary: '`openclaw update` için CLI referansı (görece güvenli kaynak güncellemesi + Gateway otomatik yeniden başlatma)'
title: Güncelle
x-i18n:
    generated_at: "2026-05-06T09:06:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eff9aeaecd4bf4eaa98fa511a3b9ebaedaf5872ff9407398665f2a8c2ab7d9
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw'ı güvenle güncelleyin ve stable/beta/dev kanalları arasında geçiş yapın.

**npm/pnpm/bun** üzerinden kurduysanız (global kurulum, git meta verisi yok),
güncellemeler [Updating](/tr/install/updating) bölümündeki paket yöneticisi akışı üzerinden gerçekleşir.

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
- `--channel <stable|beta|dev>`: güncelleme kanalını ayarlar (git + npm; yapılandırmada kalıcı hale getirilir).
- `--tag <dist-tag|version|spec>`: yalnızca bu güncelleme için paket hedefini geçersiz kılar. Paket kurulumlarında `main`, `github:openclaw/openclaw#main` ile eşleşir.
- `--dry-run`: yapılandırma yazmadan, kurulum yapmadan, Plugin'leri eşitlemeden veya yeniden başlatmadan planlanan güncelleme eylemlerinin (kanal/etiket/hedef/yeniden başlatma akışı) ön izlemesini gösterir.
- `--json`: bozuk veya yüklenemeyen yönetilen Plugin'lerin çekirdek güncellemesi başarılı olduktan sonra onarım gerektirdiği durumlarda `postUpdate.plugins.warnings` dahil olmak üzere makine tarafından okunabilir `UpdateRunResult` JSON'unu, ayrıca güncelleme sonrası Plugin eşitlemesi sırasında npm Plugin artefakt sapması algılandığında `postUpdate.plugins.integrityDrifts` değerini yazdırır.
- `--timeout <seconds>`: adım başına zaman aşımı (varsayılan 1800s).
- `--yes`: onay istemlerini atlar (örneğin sürüm düşürme onayı).

`openclaw update` komutunda `--verbose` bayrağı yoktur. Planlanan
kanal/etiket/kurulum/yeniden başlatma eylemlerini ön izlemek için `--dry-run`,
makine tarafından okunabilir sonuçlar için `--json`, yalnızca kanal ve
kullanılabilirlik ayrıntılarına ihtiyacınız olduğunda `openclaw update status --json`
kullanın. Bir güncelleme sırasında Gateway günlüklerinde hata ayıklıyorsanız,
konsol ayrıntı düzeyi ile dosya günlük düzeyi ayrıdır: Gateway `--verbose`
terminal/WebSocket çıktısını etkilerken, dosya günlükleri yapılandırmada
`logging.level: "debug"` veya `"trace"` gerektirir. Bkz. [Gateway logging](/tr/gateway/logging).

<Warning>
Sürüm düşürmeler onay gerektirir çünkü daha eski sürümler yapılandırmayı bozabilir.
</Warning>

## `update status`

Etkin güncelleme kanalını + git etiketini/dalını/SHA'sını (kaynak checkout'ları için) ve güncelleme kullanılabilirliğini gösterir.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Seçenekler:

- `--json`: makine tarafından okunabilir durum JSON'unu yazdırır.
- `--timeout <seconds>`: denetimler için zaman aşımı (varsayılan 3s).

## `update wizard`

Bir güncelleme kanalı seçmek ve güncellemeden sonra Gateway'in yeniden başlatılıp
başlatılmayacağını onaylamak için etkileşimli akış (varsayılan yeniden başlatmaktır).
Git checkout olmadan `dev` seçerseniz, bir tane oluşturmayı önerir.

Seçenekler:

- `--timeout <seconds>`: her güncelleme adımı için zaman aşımı (varsayılan `1800`)

## Ne yapar

Kanalları açıkça değiştirdiğinizde (`--channel ...`), OpenClaw kurulum yöntemini
de uyumlu tutar:

- `dev` → bir git checkout olduğundan emin olur (varsayılan: `~/openclaw`, `OPENCLAW_GIT_DIR` ile geçersiz kılınır),
  onu günceller ve global CLI'yi bu checkout'tan kurar.
- `stable` → npm'den `latest` kullanarak kurar.
- `beta` → npm dist-tag `beta` tercih eder, ancak beta eksikse veya mevcut kararlı sürümden eskiyse `latest` değerine geri döner.

Gateway çekirdek otomatik güncelleyicisi (yapılandırma üzerinden etkinleştirildiğinde),
CLI güncelleme yolunu canlı Gateway istek işleyicisinin dışında başlatır.
Control-plane `update.run` paket yöneticisi güncellemeleri, paket değişiminden sonra
ertelenmeyen ve bekleme süresi olmayan bir güncelleme yeniden başlatmasını zorunlu kılar;
çünkü eski Gateway işlemi, bellekte hâlâ yeni paket tarafından kaldırılmış dosyalara
işaret eden parçalar tutuyor olabilir.

Paket yöneticisi kurulumlarında `openclaw update`, paket yöneticisini çağırmadan
önce hedef paket sürümünü çözümler. npm global kurulumları aşamalı kurulum kullanır:
OpenClaw yeni paketi geçici bir npm önekine kurar, oradaki paketlenmiş `dist`
envanterini doğrular, ardından bu temiz paket ağacını gerçek global önekle değiştirir.
Doğrulama başarısız olursa, güncelleme sonrası doctor, Plugin eşitlemesi ve
yeniden başlatma işi şüpheli ağaçtan çalıştırılmaz. Kurulu sürüm hedefle zaten
eşleşse bile komut global paket kurulumunu yeniler, ardından Plugin eşitlemesi,
çekirdek komut tamamlama yenilemesi ve yeniden başlatma işini çalıştırır. Bu,
paketlenmiş yardımcı süreçleri ve kanalın sahip olduğu Plugin kayıtlarını kurulu
OpenClaw derlemesiyle uyumlu tutarken tam Plugin komutu tamamlama yeniden
derlemelerini açık `openclaw completion --write-state` çalıştırmalarına bırakır.

Yerel yönetilen Gateway hizmeti kuruluysa ve yeniden başlatma etkinse, paket yöneticisi
güncellemeleri paket ağacını değiştirmeden önce çalışan hizmeti durdurur, ardından
hizmet meta verilerini güncellenmiş kurulumdan yeniler, hizmeti yeniden başlatır ve
başarı bildirmeden önce yeniden başlatılan Gateway'in beklenen sürümü bildirdiğini
doğrular. macOS'te güncelleme sonrası denetim, LaunchAgent'ın etkin profil için
yüklenmiş/çalışıyor olduğunu ve yapılandırılmış loopback bağlantı noktasının sağlıklı
olduğunu da doğrular. plist kuruluysa ancak launchd onu denetlemiyorsa, OpenClaw
LaunchAgent'ı otomatik olarak yeniden bootstraps eder ve ardından sağlık/sürüm/kanal
hazırlık denetimlerini yeniden çalıştırır. Yeni bir bootstrap, RunAtLoad işini
doğrudan yükler; bu yüzden güncelleme kurtarma işlemi yeni oluşturulmuş Gateway'i
hemen `kickstart -k` yapmaz. Gateway hâlâ sağlıklı hale gelmezse komut sıfır olmayan
kodla çıkar ve yeniden başlatma günlük yolunu, ayrıca açık yeniden başlatma, yeniden
kurulum ve paket geri alma yönergelerini yazdırır. `--no-restart` ile paket değişimi
yine çalışır ancak yönetilen hizmet durdurulmaz veya yeniden başlatılmaz; bu nedenle
çalışan Gateway, siz manuel olarak yeniden başlatana kadar eski kodu tutabilir.

## Git checkout akışı

### Kanal seçimi

- `stable`: en yeni beta olmayan etiketi checkout eder, ardından derler ve doctor çalıştırır.
- `beta`: en yeni `-beta` etiketini tercih eder, ancak beta eksikse veya eskiyse en yeni stable etikete geri döner.
- `dev`: `main` checkout eder, ardından fetch ve rebase yapar.

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
    TypeScript derlemesini geçici bir worktree içinde çalıştırır. Uç başarısız olursa, derlenebilen en yeni commit'i bulmak için en fazla 10 commit geriye gider. Bu ön kontrol sırasında lint de çalıştırmak için `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` ayarlayın; kullanıcı güncelleme ana makineleri genellikle CI runner'larından daha küçük olduğu için lint kısıtlı seri modda çalışır.
  </Step>
  <Step title="Rebase">
    Seçilen commit üzerine rebase yapar (yalnızca dev).
  </Step>
  <Step title="Install dependencies">
    Repo paket yöneticisini kullanır. pnpm checkout'ları için güncelleyici, pnpm workspace içinde `npm run build` çalıştırmak yerine `pnpm`'i gerektiğinde bootstrap eder (önce `corepack` üzerinden, ardından geçici `npm install pnpm@10` geri dönüşüyle).
  </Step>
  <Step title="Build Control UI">
    Gateway'i ve Control UI'yi derler.
  </Step>
  <Step title="Run doctor">
    Son güvenli güncelleme denetimi olarak `openclaw doctor` çalışır.
  </Step>
  <Step title="Sync plugins">
    Plugin'leri etkin kanalla eşitler. Dev paketlenmiş Plugin'leri kullanır; stable ve beta npm kullanır. İzlenen Plugin kurulumlarını günceller.
  </Step>
</Steps>

Beta güncelleme kanalında, varsayılan/latest hattını izleyen takip edilen npm ve
ClawHub Plugin kurulumları önce bir Plugin `@beta` sürümü dener. Plugin'in beta
sürümü yoksa OpenClaw kaydedilmiş default/latest spesifikasyonuna geri döner. npm
Plugin'leri için OpenClaw, beta paketi mevcut olsa ancak kurulum doğrulaması başarısız
olsa da geri döner. Kesin sürümler ve açık etiketler yeniden yazılmaz.

<Warning>
Kesin sabitlenmiş bir npm Plugin güncellemesi, bütünlüğü saklanan kurulum kaydından farklı olan bir artefakta çözümlenirse `openclaw update`, onu kurmak yerine bu Plugin artefakt güncellemesini iptal eder. Plugin'i yeniden kurun veya açıkça güncelleyin, ancak bunu yalnızca yeni artefakta güvendiğinizi doğruladıktan sonra yapın.
</Warning>

<Note>
Yönetilen bir Plugin kapsamındaki güncelleme sonrası Plugin eşitleme hataları, çekirdek güncellemesi başarılı olduktan sonra uyarı olarak bildirilir. JSON sonucu üst düzey güncelleme `status: "ok"` değerini korur ve `openclaw doctor --fix` ile `openclaw plugins inspect <id> --runtime --json` yönlendirmesiyle `postUpdate.plugins.status: "warning"` bildirir. Beklenmeyen güncelleyici veya eşitleme istisnaları güncelleme sonucunu yine de başarısız yapar. Plugin kurulumunu veya güncelleme hatasını düzeltin, ardından `openclaw doctor --fix` ya da `openclaw update` komutunu yeniden çalıştırın.

Güncellenmiş Gateway başladığında, Plugin yükleme yalnızca doğrulama amaçlıdır: başlangıç paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını değiştirmez. Paket yöneticisi `update.run` yeniden başlatmaları, paket ağacı değiştirildikten sonra normal boşta ertelemesini ve yeniden başlatma bekleme süresini atlar; böylece eski işlem kaldırılmış parçaları tembel biçimde yüklemeye devam edemez.

pnpm bootstrap yine başarısız olursa, güncelleyici checkout içinde `npm run build` denemek yerine paket yöneticisine özgü bir hatayla erken durur.
</Note>

## `--update` kısayolu

`openclaw --update`, `openclaw update` olarak yeniden yazılır (kabuklar ve başlatıcı betikleri için kullanışlıdır).

## İlgili

- `openclaw doctor` (git checkout'larında önce güncelleme çalıştırmayı önerir)
- [Development channels](/tr/install/development-channels)
- [Updating](/tr/install/updating)
- [CLI reference](/tr/cli)
