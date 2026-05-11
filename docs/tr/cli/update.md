---
read_when:
    - Kaynak çalışma kopyasını güvenli bir şekilde güncellemek istiyorsunuz
    - '`openclaw update` çıktısında veya seçeneklerinde hata ayıklıyorsunuz'
    - '`--update` kısaltma davranışını anlamanız gerekir'
summary: '`openclaw update` için CLI referansı (görece güvenli kaynak güncellemesi + Gateway otomatik yeniden başlatması)'
title: Güncelle
x-i18n:
    generated_at: "2026-05-11T20:27:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: cefe31181412d398f205a51429f6f5c20e86dfa96bd3d78333cefeb8ab6873b0
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw'ı güvenle güncelleyin ve stable/beta/dev kanalları arasında geçiş yapın.

**npm/pnpm/bun** ile yüklediyseniz (global yükleme, git meta verisi yok),
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

- `--no-restart`: başarılı bir güncellemeden sonra Gateway hizmetini yeniden başlatmayı atlar. Gateway'i yeniden başlatan paket yöneticisi güncellemeleri, komut başarılı olmadan önce yeniden başlatılan hizmetin beklenen güncellenmiş sürümü bildirdiğini doğrular.
- `--channel <stable|beta|dev>`: güncelleme kanalını ayarlar (git + npm; yapılandırmada kalıcı hale getirilir).
- `--tag <dist-tag|version|spec>`: yalnızca bu güncelleme için paket hedefini geçersiz kılar. Paket yüklemelerinde `main`, `github:openclaw/openclaw#main` ile eşlenir.
- `--dry-run`: yapılandırma yazmadan, yükleme yapmadan, Plugin'leri eşitlemeden veya yeniden başlatmadan planlanan güncelleme eylemlerini (kanal/etiket/hedef/yeniden başlatma akışı) önizler.
- `--json`: bozuk veya yüklenemeyen yönetilen Plugin'lerin çekirdek güncellemesi başarılı olduktan sonra onarım gerektirdiği durumlarda
  `postUpdate.plugins.warnings`, bir Plugin'in beta sürümü olmadığında beta kanalı Plugin geri dönüş ayrıntıları
  ve güncelleme sonrası Plugin eşitlemesi sırasında npm Plugin artefakt sapması algılandığında `postUpdate.plugins.integrityDrifts`
  dahil olmak üzere makine tarafından okunabilir `UpdateRunResult` JSON çıktısı verir.
- `--timeout <seconds>`: adım başına zaman aşımı (varsayılan 1800 sn).
- `--yes`: onay istemlerini atlar (örneğin sürüm düşürme onayı).

`openclaw update` komutunun `--verbose` bayrağı yoktur. Planlanan kanal/etiket/yükleme/yeniden başlatma eylemlerini önizlemek için `--dry-run`,
makine tarafından okunabilir sonuçlar için `--json` ve yalnızca kanal ile kullanılabilirlik ayrıntılarına ihtiyacınız olduğunda
`openclaw update status --json` kullanın. Bir güncelleme sırasında Gateway günlüklerinde hata ayıklıyorsanız,
konsol ayrıntı düzeyi ile dosya günlük düzeyi ayrıdır: Gateway `--verbose`,
terminal/WebSocket çıktısını etkilerken dosya günlükleri için yapılandırmada `logging.level: "debug"` veya
`"trace"` gerekir. Bkz. [Gateway günlükleri](/tr/gateway/logging).

<Note>
Nix modunda (`OPENCLAW_NIX_MODE=1`), değişiklik yapan `openclaw update` çalıştırmaları devre dışıdır. Bunun yerine bu yükleme için Nix kaynağını veya flake girdisini güncelleyin; nix-openclaw için agent-first [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kullanın. `openclaw update status` ve `openclaw update --dry-run` salt okunur kalır.
</Note>

<Warning>
Sürüm düşürmeler onay gerektirir çünkü eski sürümler yapılandırmayı bozabilir.
</Warning>

## `update status`

Etkin güncelleme kanalını + git etiketi/dalı/SHA bilgisini (kaynak checkout'ları için) ve güncelleme kullanılabilirliğini gösterir.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Seçenekler:

- `--json`: makine tarafından okunabilir durum JSON çıktısı verir.
- `--timeout <seconds>`: denetimler için zaman aşımı (varsayılan 3 sn).

## `update wizard`

Bir güncelleme kanalı seçmek ve güncellemeden sonra Gateway'in yeniden başlatılıp başlatılmayacağını
onaylamak için etkileşimli akış (varsayılan yeniden başlatmaktır). Git checkout olmadan `dev` seçerseniz,
bir tane oluşturmayı önerir.

Seçenekler:

- `--timeout <seconds>`: her güncelleme adımı için zaman aşımı (varsayılan `1800`)

## Ne yapar?

Kanalları açıkça değiştirdiğinizde (`--channel ...`), OpenClaw yükleme yöntemini de
uyumlu tutar:

- `dev` → bir git checkout olduğundan emin olur (varsayılan: `~/openclaw`, `OPENCLAW_GIT_DIR` ile geçersiz kılınabilir),
  onu günceller ve global CLI'ı bu checkout'tan yükler.
- `stable` → npm üzerinden `latest` kullanarak yükler.
- `beta` → npm dist-tag `beta` değerini tercih eder, ancak beta eksikse veya mevcut stable sürümden
  daha eskiyse `latest` değerine geri döner.

Gateway çekirdek otomatik güncelleyicisi (yapılandırma üzerinden etkinleştirildiğinde), CLI güncelleme yolunu
canlı Gateway istek işleyicisinin dışında başlatır. Denetim düzlemi `update.run` paket yöneticisi
güncellemeleri, paket değişiminden sonra ertelenmeyen ve bekleme süresi olmayan bir güncelleme yeniden başlatmasını zorlar;
çünkü eski Gateway süreci, yeni paket tarafından kaldırılan dosyalara işaret eden bellek içi parçalara hâlâ sahip olabilir.

Paket yöneticisi yüklemelerinde `openclaw update`, paket yöneticisini çağırmadan önce hedef paket
sürümünü çözer. npm global yüklemeleri aşamalı yükleme kullanır: OpenClaw yeni paketi geçici bir npm prefix'ine yükler,
oradaki paketlenmiş `dist` envanterini doğrular, ardından bu temiz paket ağacını gerçek global prefix'e taşır.
Doğrulama başarısız olursa, güncelleme sonrası doctor, Plugin eşitlemesi ve yeniden başlatma işi şüpheli ağaçtan çalıştırılmaz.
Yüklü sürüm hedefle zaten eşleşse bile komut global paket yüklemesini yeniler,
ardından Plugin eşitlemesi, çekirdek komut tamamlama yenilemesi ve yeniden başlatma işi çalıştırır. Bu,
paketlenmiş sidecar'ları ve kanalın sahip olduğu Plugin kayıtlarını yüklü OpenClaw derlemesiyle uyumlu tutarken,
tam Plugin komut tamamlama yeniden derlemelerini açık `openclaw completion --write-state` çalıştırmalarına bırakır.

Yerel yönetilen Gateway hizmeti yüklü olduğunda ve yeniden başlatma etkinse,
paket yöneticisi güncellemeleri paket ağacını değiştirmeden önce çalışan hizmeti durdurur,
ardından hizmet meta verilerini güncellenmiş yüklemeden yeniler, hizmeti yeniden başlatır ve
başarı bildirmeden önce yeniden başlatılan Gateway'in beklenen sürümü bildirdiğini doğrular.
macOS'te, güncelleme sonrası denetim ayrıca LaunchAgent'ın etkin profil için yüklü/çalışıyor olduğunu ve
yapılandırılmış loopback bağlantı noktasının sağlıklı olduğunu doğrular. Plist yüklüyse ancak launchd onu denetlemiyorsa,
OpenClaw LaunchAgent'ı otomatik olarak yeniden bootstrap eder, ardından sağlık/sürüm/kanal hazır olma denetimlerini yeniden çalıştırır.
Yeni bir bootstrap, RunAtLoad işini doğrudan yükler; bu nedenle güncelleme kurtarma, yeni oluşturulan Gateway için hemen
`kickstart -k` çalıştırmaz. Gateway yine de sağlıklı hale gelmezse, komut sıfır olmayan kodla çıkar ve
yeniden başlatma günlük yolunu artı açık yeniden başlatma, yeniden yükleme ve paket geri alma talimatlarını yazdırır.
`--no-restart` ile paket değişimi yine çalışır ancak yönetilen hizmet durdurulmaz veya yeniden başlatılmaz;
bu nedenle çalışan Gateway, siz manuel olarak yeniden başlatana kadar eski kodu kullanmaya devam edebilir.

## Git checkout akışı

### Kanal seçimi

- `stable`: en yeni beta olmayan etiketi checkout eder, ardından derler ve doctor çalıştırır.
- `beta`: en yeni `-beta` etiketini tercih eder, ancak beta eksikse veya daha eskiyse en yeni stable etikete geri döner.
- `dev`: `main` checkout eder, ardından fetch ve rebase yapar.

### Güncelleme adımları

<Steps>
  <Step title="Temiz worktree doğrula">
    Commit edilmemiş değişiklik olmamasını gerektirir.
  </Step>
  <Step title="Kanal değiştir">
    Seçilen kanala (etiket veya dal) geçer.
  </Step>
  <Step title="Upstream fetch et">
    Yalnızca dev.
  </Step>
  <Step title="Ön denetim derlemesi (yalnızca dev)">
    TypeScript derlemesini geçici bir worktree'de çalıştırır. Uç commit başarısız olursa, derlenebilir en yeni commit'i bulmak için en fazla 10 commit geriye gider. Bu ön denetim sırasında lint de çalıştırmak için `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` ayarlayın; kullanıcı güncelleme ana makineleri çoğu zaman CI runner'larından daha küçük olduğu için lint kısıtlı seri modda çalışır.
  </Step>
  <Step title="Rebase">
    Seçilen commit üzerine rebase yapar (yalnızca dev).
  </Step>
  <Step title="Bağımlılıkları yükle">
    Repo paket yöneticisini kullanır. pnpm checkout'ları için güncelleyici, pnpm workspace içinde `npm run build` çalıştırmak yerine `pnpm` aracını gerektiğinde bootstrap eder (önce `corepack` üzerinden, ardından geçici bir `npm install pnpm@11` geri dönüşüyle).
  </Step>
  <Step title="Control UI derle">
    Gateway'i ve Control UI'ı derler.
  </Step>
  <Step title="Doctor çalıştır">
    Son güvenli güncelleme denetimi olarak `openclaw doctor` çalışır.
  </Step>
  <Step title="Plugin'leri eşitle">
    Plugin'leri etkin kanalla eşitler. Dev paketlenmiş Plugin'leri kullanır; stable ve beta npm kullanır. İzlenen Plugin yüklemelerini günceller.
  </Step>
</Steps>

Beta güncelleme kanalında, varsayılan/latest çizgisini izleyen izlenen npm ve ClawHub Plugin yüklemeleri
önce bir Plugin `@beta` sürümünü dener. Plugin'in beta sürümü yoksa,
OpenClaw kaydedilmiş default/latest spec değerine geri döner ve bunu uyarı olarak bildirir.
npm Plugin'leri için OpenClaw, beta paketi var olsa da yükleme doğrulaması başarısız olduğunda da geri döner.
Bu Plugin geri dönüş uyarıları çekirdek güncellemenin başarısız olmasına neden olmaz.
Kesin sürümler ve açık etiketler yeniden yazılmaz.

<Warning>
Kesin sabitlenmiş bir npm Plugin güncellemesi, bütünlüğü depolanan yükleme kaydından farklı olan bir artefakta çözülürse, `openclaw update` onu yüklemek yerine söz konusu Plugin artefakt güncellemesini iptal eder. Yeni artefakta güvendiğinizi doğruladıktan sonra Plugin'i açıkça yeniden yükleyin veya güncelleyin.
</Warning>

<Note>
Yönetilen bir Plugin kapsamındaki güncelleme sonrası Plugin eşitleme hataları, çekirdek güncellemesi başarılı olduktan sonra uyarı olarak bildirilir. JSON sonucu üst düzey güncelleme `status: "ok"` değerini korur ve `openclaw doctor --fix` ile `openclaw plugins inspect <id> --runtime --json` rehberliğiyle birlikte `postUpdate.plugins.status: "warning"` bildirir. Beklenmeyen güncelleyici veya eşitleme istisnaları yine de güncelleme sonucunu başarısız yapar. Plugin yükleme veya güncelleme hatasını düzeltin, ardından `openclaw doctor --fix` veya `openclaw update` yeniden çalıştırın.

Güncellenmiş Gateway başladığında, Plugin yükleme yalnızca doğrulama amaçlıdır: başlangıç, paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını değiştirmez. Paket yöneticisi `update.run` yeniden başlatmaları, paket ağacı değiştirildikten sonra normal boşta ertelemesini ve yeniden başlatma bekleme süresini atlar; böylece eski süreç kaldırılmış parçaları lazy-loading ile kullanmayı sürdüremez.

pnpm bootstrap yine de başarısız olursa, güncelleyici checkout içinde `npm run build` denemek yerine paket yöneticisine özgü bir hatayla erken durur.
</Note>

## `--update` kısayolu

`openclaw --update`, `openclaw update` olarak yeniden yazılır (kabuklar ve başlatıcı betikleri için kullanışlıdır).

## İlgili

- `openclaw doctor` (git checkout'larında önce update çalıştırmayı önerir)
- [Geliştirme kanalları](/tr/install/development-channels)
- [Güncelleme](/tr/install/updating)
- [CLI referansı](/tr/cli)
