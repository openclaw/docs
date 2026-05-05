---
read_when:
    - Bir kaynak çalışma kopyasını güvenli şekilde güncellemek istiyorsunuz
    - '`openclaw update` çıktısı veya seçenekleriyle ilgili hata ayıklıyorsunuz'
    - '`--update` kısa yazım davranışını anlamanız gerekir'
summary: '`openclaw update` için CLI referansı (nispeten güvenli kaynak güncellemesi + Gateway otomatik yeniden başlatma)'
title: Güncelleme
x-i18n:
    generated_at: "2026-05-05T01:45:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b1837ae80a3688fb7805d78d5a354f07dccdaba175cfa429e18145e543a1f
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw’ı güvenle güncelleyin ve stable/beta/dev kanalları arasında geçiş yapın.

**npm/pnpm/bun** ile kurduysanız (genel kurulum, git meta verisi yok),
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

- `--no-restart`: başarılı bir güncellemeden sonra Gateway hizmetini yeniden başlatmayı atla. Gateway’i yeniden başlatan paket yöneticisi güncellemeleri, komut başarılı olmadan önce yeniden başlatılan hizmetin beklenen güncel sürümü bildirdiğini doğrular.
- `--channel <stable|beta|dev>`: güncelleme kanalını ayarla (git + npm; yapılandırmada kalıcı olur).
- `--tag <dist-tag|version|spec>`: paket hedefini yalnızca bu güncelleme için geçersiz kıl. Paket kurulumlarında `main`, `github:openclaw/openclaw#main` ile eşleşir.
- `--dry-run`: yapılandırma yazmadan, kurulum yapmadan, Plugin’leri eşitlemeden veya yeniden başlatmadan planlanan güncelleme eylemlerini (kanal/etiket/hedef/yeniden başlatma akışı) önizle.
- `--json`: güncelleme sonrası Plugin eşitlemesi sırasında npm Plugin yapıt sapması algılandığında
  `postUpdate.plugins.integrityDrifts` dahil olmak üzere makine tarafından okunabilir
  `UpdateRunResult` JSON çıktısı yazdır.
- `--timeout <seconds>`: adım başına zaman aşımı (varsayılan 1800 sn).
- `--yes`: onay istemlerini atla (örneğin sürüm düşürme onayı).

`openclaw update` komutunda `--verbose` bayrağı yoktur. Planlanan kanal/etiket/kurulum/yeniden başlatma eylemlerini önizlemek için `--dry-run`, makine tarafından okunabilir sonuçlar için `--json` ve yalnızca kanal ile kullanılabilirlik ayrıntılarına ihtiyacınız olduğunda `openclaw update status --json` kullanın. Bir güncelleme sırasında Gateway günlüklerinde hata ayıklıyorsanız, konsol ayrıntı düzeyi ile dosya günlük düzeyi ayrıdır: Gateway `--verbose` terminal/WebSocket çıktısını etkilerken, dosya günlükleri yapılandırmada `logging.level: "debug"` veya `"trace"` gerektirir. Bkz. [Gateway günlük kaydı](/tr/gateway/logging).

<Warning>
Sürüm düşürmeler onay gerektirir çünkü eski sürümler yapılandırmayı bozabilir.
</Warning>

## `update status`

Etkin güncelleme kanalını + git etiketi/dalı/SHA değerini (kaynak checkout’ları için) ve güncelleme kullanılabilirliğini göster.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Seçenekler:

- `--json`: makine tarafından okunabilir durum JSON çıktısı yazdır.
- `--timeout <seconds>`: kontroller için zaman aşımı (varsayılan 3 sn).

## `update wizard`

Bir güncelleme kanalı seçmek ve güncellemeden sonra Gateway’in yeniden başlatılıp başlatılmayacağını
onaylamak için etkileşimli akış (varsayılan yeniden başlatmaktır). Git checkout olmadan `dev`
seçerseniz, bir tane oluşturmayı teklif eder.

Seçenekler:

- `--timeout <seconds>`: her güncelleme adımı için zaman aşımı (varsayılan `1800`)

## Ne yapar

Kanalları açıkça değiştirdiğinizde (`--channel ...`), OpenClaw kurulum yöntemini de
uyumlu tutar:

- `dev` → bir git checkout bulunduğundan emin olur (varsayılan: `~/openclaw`, `OPENCLAW_GIT_DIR` ile geçersiz kılınabilir),
  onu günceller ve genel CLI’yi bu checkout’tan kurar.
- `stable` → `latest` kullanarak npm’den kurar.
- `beta` → npm dist-tag `beta` değerini tercih eder, ancak beta yoksa veya geçerli stable sürümden
  daha eskiyse `latest` değerine geri döner.

Gateway çekirdek otomatik güncelleyicisi (yapılandırma ile etkinleştirildiğinde), CLI güncelleme yolunu
canlı Gateway istek işleyicisinin dışında başlatır. Control-plane `update.run` paket yöneticisi
güncellemeleri, paket değişiminden sonra ertelenmeyen ve bekleme süresi olmayan bir güncelleme yeniden başlatmasını zorunlu kılar,
çünkü eski Gateway işlemi hâlâ yeni paket tarafından kaldırılan dosyalara işaret eden
bellek içi parçalara sahip olabilir.

Paket yöneticisi kurulumlarında `openclaw update`, paket yöneticisini çağırmadan önce hedef paket
sürümünü çözer. npm genel kurulumları aşamalı kurulum kullanır: OpenClaw yeni paketi geçici bir npm prefix içine kurar, oradaki
paketlenmiş `dist` envanterini doğrular, ardından bu temiz paket ağacını gerçek genel prefix içine taşır.
Doğrulama başarısız olursa, güncelleme sonrası doctor, Plugin eşitlemesi ve yeniden başlatma işi
şüpheli ağaçtan çalıştırılmaz. Kurulu sürüm hedefle zaten eşleşse bile, komut genel paket kurulumunu yeniler,
ardından Plugin eşitlemesi, çekirdek komut tamamlama yenilemesi ve yeniden başlatma işini çalıştırır. Bu,
paketlenmiş sidecar’ları ve kanalın sahip olduğu Plugin kayıtlarını kurulu OpenClaw derlemesiyle uyumlu tutarken,
tam Plugin komutu tamamlama yeniden oluşturma işlemlerini açık `openclaw completion --write-state` çalıştırmalarına bırakır.

Yerel yönetilen bir Gateway hizmeti kurulu olduğunda ve yeniden başlatma etkin olduğunda,
paket yöneticisi güncellemeleri paket ağacını değiştirmeden önce çalışan hizmeti durdurur,
ardından güncellenmiş kurulumdan hizmet meta verilerini yeniler, hizmeti yeniden başlatır ve
başarı bildirmeden önce yeniden başlatılan Gateway’in beklenen sürümü bildirdiğini doğrular.
macOS’te güncelleme sonrası kontrol, etkin profil için LaunchAgent’ın yüklü/çalışır olduğunu ve
yapılandırılmış loopback portunun sağlıklı olduğunu da doğrular. Plist kuruluysa ancak launchd onu denetlemiyorsa,
OpenClaw LaunchAgent’ı otomatik olarak yeniden bootstrap eder, ardından sağlık/sürüm/kanal hazır olma
kontrollerini yeniden çalıştırır. Yeni bir bootstrap, RunAtLoad işini doğrudan yükler; bu nedenle güncelleme kurtarması
yeni başlatılan Gateway’i hemen `kickstart -k` ile çalıştırmaz. Gateway yine de sağlıklı hale gelmezse,
komut sıfır olmayan bir kodla çıkar ve yeniden başlatma günlük yolunu, açık yeniden başlatma, yeniden kurulum ve
paket geri alma talimatlarını yazdırır. `--no-restart` ile paket değiştirme yine çalışır ancak yönetilen hizmet
durdurulmaz veya yeniden başlatılmaz; bu nedenle çalışan Gateway, siz manuel olarak yeniden başlatana kadar
eski kodu kullanmaya devam edebilir.

## Git checkout akışı

### Kanal seçimi

- `stable`: en son beta olmayan etiketi checkout yap, ardından derle ve doctor çalıştır.
- `beta`: en son `-beta` etiketini tercih et, ancak beta yoksa veya daha eskiyse en son stable etikete geri dön.
- `dev`: `main` dalını checkout yap, ardından fetch ve rebase yap.

### Güncelleme adımları

<Steps>
  <Step title="Temiz worktree doğrula">
    Commit edilmemiş değişiklik olmamasını gerektirir.
  </Step>
  <Step title="Kanal değiştir">
    Seçili kanala (etiket veya dal) geçer.
  </Step>
  <Step title="Upstream getir">
    Yalnızca dev.
  </Step>
  <Step title="Preflight derlemesi (yalnızca dev)">
    Geçici bir worktree içinde lint ve TypeScript derlemesi çalıştırır. Uç başarısız olursa, en yeni temiz derlemeyi bulmak için en fazla 10 commit geriye gider.
  </Step>
  <Step title="Rebase">
    Seçili commit üzerine rebase yapar (yalnızca dev).
  </Step>
  <Step title="Bağımlılıkları kur">
    Repo paket yöneticisini kullanır. pnpm checkout’ları için güncelleyici, bir pnpm workspace içinde `npm run build` çalıştırmak yerine gerektiğinde `pnpm`’i bootstrap eder (önce `corepack` üzerinden, ardından geçici `npm install pnpm@10` geri dönüşüyle).
  </Step>
  <Step title="Control UI derle">
    Gateway’i ve Control UI’ı derler.
  </Step>
  <Step title="Doctor çalıştır">
    `openclaw doctor`, son güvenli güncelleme kontrolü olarak çalışır.
  </Step>
  <Step title="Plugin’leri eşitle">
    Plugin’leri etkin kanalla eşitler. Dev, paketle gelen Plugin’leri kullanır; stable ve beta npm kullanır. İzlenen Plugin kurulumlarını günceller.
  </Step>
</Steps>

Beta güncelleme kanalında, varsayılan/latest çizgiyi izleyen izlenmiş npm ve ClawHub Plugin kurulumları
önce bir Plugin `@beta` sürümünü dener. Plugin’in beta sürümü yoksa, OpenClaw kaydedilmiş
varsayılan/latest spec değerine geri döner. npm Plugin’leri için, beta paketi var olsa ancak kurulum
doğrulamasında başarısız olsa da OpenClaw geri döner. Kesin sürümler ve açık etiketler yeniden yazılmaz.

<Warning>
Kesin sabitlenmiş bir npm Plugin güncellemesi, bütünlüğü depolanan kurulum kaydından farklı olan bir yapıta çözümlenirse, `openclaw update` o Plugin yapıt güncellemesini kurmak yerine iptal eder. Plugin’i yalnızca yeni yapıta güvendiğinizi doğruladıktan sonra açıkça yeniden kurun veya güncelleyin.
</Warning>

<Note>
Güncelleme sonrası Plugin eşitleme hataları güncelleme sonucunu başarısız yapar ve yeniden başlatma takip işini durdurur. Plugin kurulumunu veya güncelleme hatasını düzeltin, ardından `openclaw update` komutunu yeniden çalıştırın.

Güncellenmiş Gateway başladığında, Plugin yükleme yalnızca doğrulama modundadır: başlangıç, paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını değiştirmez. Paket yöneticisi `update.run` yeniden başlatmaları, paket ağacı değiştirildikten sonra normal boşta ertelemesini ve yeniden başlatma bekleme süresini atlar; böylece eski işlem kaldırılmış parçaları tembel yüklemeye devam edemez.

pnpm bootstrap yine başarısız olursa, güncelleyici checkout içinde `npm run build` denemek yerine paket yöneticisine özel bir hatayla erken durur.
</Note>

## `--update` kısayolu

`openclaw --update`, `openclaw update` olarak yeniden yazılır (kabuklar ve başlatıcı betikler için kullanışlıdır).

## İlgili

- `openclaw doctor` (git checkout’larında önce update çalıştırmayı teklif eder)
- [Geliştirme kanalları](/tr/install/development-channels)
- [Güncelleme](/tr/install/updating)
- [CLI referansı](/tr/cli)
