---
read_when:
    - Bir kaynak checkout'unu güvenli şekilde güncellemek istiyorsunuz
    - '`openclaw update` çıktısını veya seçeneklerini hata ayıklıyorsunuz'
    - '`--update` kısaltma davranışını anlamanız gerekir'
summary: '`openclaw update` için CLI referansı (görece güvenli kaynak güncellemesi + Gateway otomatik yeniden başlatma)'
title: Güncelle
x-i18n:
    generated_at: "2026-06-28T00:25:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw'ı güvenle güncelleyin ve stable/beta/dev kanalları arasında geçiş yapın.

**npm/pnpm/bun** ile kurduysanız (genel kurulum, git meta verisi yok),
güncellemeler [Güncelleme](/tr/install/updating) bölümündeki paket yöneticisi akışıyla gerçekleşir.

## Kullanım

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

## Seçenekler

- `--no-restart`: başarılı bir güncellemeden sonra Gateway hizmetini yeniden başlatmayı atlar.
- `--channel <stable|beta|dev>`: güncelleme kanalını ayarlar (git + npm; yapılandırmada kalıcılaştırılır).
- `--tag <dist-tag|version|spec>`: yalnızca bu güncelleme için paket hedefini geçersiz kılar.
- `--dry-run`: yapılandırma yazmadan, kurulum yapmadan, Plugin eşitlemeden veya yeniden başlatmadan planlanan güncelleme işlemlerini önizler.
- `--json`: makine tarafından okunabilir `UpdateRunResult` JSON çıktısı yazdırır.
- `--timeout <seconds>`: adım başına zaman aşımı (varsayılan 1800 sn).
- `--yes`: onay istemlerini atlar.
- `--acknowledge-clawhub-risk`: topluluk ClawHub güven uyarılarını inceledikten sonra, güncelleme sonrası Plugin eşitlemesinin etkileşimli istem olmadan devam etmesine izin verir.

`openclaw update` komutunun `--verbose` bayrağı yoktur. Planlanan kanal/etiket/kurulum/yeniden başlatma işlemlerini önizlemek için `--dry-run`, makine tarafından okunabilir sonuçlar için `--json`, yalnızca kanal ve kullanılabilirlik ayrıntılarına ihtiyacınız olduğunda `openclaw update status --json` kullanın.

<Note>
Nix modunda (`OPENCLAW_NIX_MODE=1`), durumu değiştiren `openclaw update` çalıştırmaları devre dışıdır. Bunun yerine bu kurulum için Nix kaynağını veya flake girdisini güncelleyin; nix-openclaw için agent öncelikli [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) bölümünü kullanın. `openclaw update status` ve `openclaw update --dry-run` salt okunur kalır.
</Note>

<Warning>
Daha eski sürümler yapılandırmayı bozabileceğinden sürüm düşürmeler onay gerektirir.
</Warning>

## `update status`

Etkin güncelleme kanalını + git etiketi/dalı/SHA değerini (kaynak checkout'ları için) ve güncelleme kullanılabilirliğini gösterir.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Seçenekler:

- `--json`: makine tarafından okunabilir durum JSON çıktısı yazdırır.
- `--timeout <seconds>`: denetimler için zaman aşımı (varsayılan 3 sn).

## `update repair`

Çekirdek paket zaten değiştikten ancak sonraki onarım işi temiz şekilde tamamlanmadıktan sonra güncelleme sonlandırmasını yeniden çalıştırır.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

Seçenekler:

- `--channel <stable|beta|dev>`: onarımdan önce güncelleme kanalını kalıcılaştırır ve Plugin yakınsamasını bu kanala göre çalıştırır.
- `--json`: makine tarafından okunabilir sonlandırma JSON çıktısı yazdırır.
- `--timeout <seconds>`: onarım adımları için zaman aşımı (varsayılan `1800`).
- `--yes`: onay istemlerini atlar.
- `--acknowledge-clawhub-risk`: topluluk ClawHub güven uyarılarını inceledikten sonra, onarım sırasında Plugin yakınsamasının etkileşimli istem olmadan devam etmesine izin verir.
- `--no-restart`: update komutuyla uyumluluk için kabul edilir; repair Gateway'i hiçbir zaman yeniden başlatmaz.

`openclaw update repair`, `openclaw doctor --fix` çalıştırır, onarılan yapılandırmayı ve kurulum kayıtlarını yeniden yükler, etkin güncelleme kanalı için izlenen Plugin'leri eşitler, yönetilen npm Plugin kurulumlarını günceller, eksik yapılandırılmış Plugin yüklerini onarır, Plugin kayıt defterini yeniler ve yakınsanmış kurulum kaydı meta verilerini yazar.

## `update wizard`

Bir güncelleme kanalı seçmek ve güncellemeden sonra Gateway'in yeniden başlatılıp başlatılmayacağını onaylamak için etkileşimli akış (varsayılan yeniden başlatmadır).

Seçenekler:

- `--timeout <seconds>`: her güncelleme adımı için zaman aşımı (varsayılan `1800`)

## Ne yapar

Kanalları açıkça değiştirdiğinizde (`--channel ...`), OpenClaw kurulum yöntemini de hizalı tutar:

- `dev` → bir git checkout'ı sağlar, günceller ve genel CLI'yi bu checkout'tan kurar.
- `stable` → npm'den `latest` kullanarak kurar.
- `beta` → npm dist-tag `beta` değerini tercih eder, ancak beta eksikse veya mevcut stable sürümden daha eskiyse `latest` değerine geri döner.

Gateway çekirdek otomatik güncelleyicisi (yapılandırma üzerinden etkinleştirildiğinde), CLI güncelleme yolunu canlı Gateway istek işleyicisinin dışında başlatır.

Paket yöneticisi kurulumları için `openclaw update`, paket yöneticisini çağırmadan önce hedef paket sürümünü çözer. npm genel kurulumları aşamalı kurulum kullanır: OpenClaw yeni paketi geçici bir npm önekine kurar, paketlenmiş `dist` envanterini orada doğrular, ardından bu temiz paket ağacını gerçek genel öneke taşır.

Yerel yönetilen Gateway hizmeti kurulu olduğunda ve yeniden başlatma etkin olduğunda, paket yöneticisi ve git-checkout güncellemeleri paket ağacını değiştirmeden veya checkout/derleme çıktısını değiştirmeden önce çalışan hizmeti durdurur. Güncelleyici daha sonra hizmet meta verilerini güncellenmiş kurulumdan yeniler, hizmeti yeniden başlatır ve `Gateway: restarted and verified.` bildirmeden önce yeniden başlatılan Gateway'i doğrular.

### Kontrol düzlemi yanıt şekli

`update.run`, bir paket yöneticisi kurulumu veya denetimli git checkout üzerinde Gateway kontrol düzlemi üzerinden çağrıldığında, işleyici handoff başlatmasını Gateway çıktıktan sonra devam eden CLI güncellemesinden ayrı olarak bildirir:

- `ok: true`, `result.status: "skipped"`, `result.reason: "managed-service-handoff-started"` ve `handoff.status: "started"` Gateway'in yönetilen hizmet handoff'unu oluşturduğu anlamına gelir.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` ve `handoff.status: "unavailable"` OpenClaw'ın güvenli bir handoff için denetleyici hizmet sınırı ve kalıcı hizmet kimliği bulamadığı anlamına gelir.
- `ok: false`, `result.reason: "managed-service-handoff-failed"` Gateway'in handoff'u oluşturmaya çalıştığını ancak ayrılmış yardımcıyı başlatamadığını gösterir.

`sentinel` yükü Gateway çıkmadan önce yine yazılır ve CLI handoff'u, yönetilen hizmet yeniden başlatma sağlık denetimleri tamamlandıktan sonra aynı yeniden başlatma sentinel'ını günceller.

## Git checkout akışı

### Kanal seçimi

- `stable`: en son beta olmayan etiketi checkout eder, ardından derler ve doctor çalıştırır.
- `beta`: en son `-beta` etiketini tercih eder, ancak beta eksikse veya daha eskiyse en son stable etikete geri döner.
- `dev`: `main` dalını checkout eder, ardından fetch ve rebase yapar.

### Güncelleme adımları

<Steps>
  <Step title="Temiz çalışma ağacını doğrula">
    Commit edilmemiş değişiklik olmamasını gerektirir.
  </Step>
  <Step title="Kanalı değiştir">
    Seçili kanala (etiket veya dal) geçer.
  </Step>
  <Step title="Upstream'i getir">
    Yalnızca geliştirme için.
  </Step>
  <Step title="Ön kontrol derlemesi (yalnızca geliştirme)">
    TypeScript derlemesini geçici bir çalışma ağacında çalıştırır. Uç başarısız olursa, derlenebilen en yeni commit'i bulmak için en fazla 10 commit geriye gider. Bu ön kontrol sırasında lint de çalıştırmak için `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` ayarlayın; kullanıcı güncelleme ana makineleri çoğu zaman CI çalıştırıcılarından daha küçük olduğu için lint kısıtlı seri modda çalışır.
  </Step>
  <Step title="Rebase">
    Seçili commit'in üzerine rebase yapar (yalnızca geliştirme için).
  </Step>
  <Step title="Bağımlılıkları yükle">
    Repo paket yöneticisini kullanır. pnpm checkout'ları için güncelleyici, pnpm çalışma alanı içinde `npm run build` çalıştırmak yerine `pnpm`'i gerektiğinde önyükler (önce `corepack` üzerinden, ardından geçici bir `npm install pnpm@11` geri dönüşüyle).
  </Step>
  <Step title="Control UI'ı derle">
    Gateway'i ve Control UI'ı derler.
  </Step>
  <Step title="doctor çalıştır">
    `openclaw doctor` son güvenli güncelleme kontrolü olarak çalışır.
  </Step>
  <Step title="Plugin'leri eşitle">
    Plugin'leri etkin kanala eşitler. Geliştirme, paketlenmiş Plugin'leri kullanır; stable ve beta npm kullanır. İzlenen Plugin kurulumlarını günceller.
  </Step>
</Steps>

Beta güncelleme kanalında, default/latest çizgisini izleyen izlenen npm ve
ClawHub Plugin kurulumları önce bir Plugin `@beta` sürümünü dener. Plugin'in beta
sürümü yoksa OpenClaw kaydedilmiş default/latest tanımına geri döner ve bunu bir
uyarı olarak bildirir. npm Plugin'leri için OpenClaw, beta paket mevcut olsa
ancak kurulum doğrulamasından geçemese de geri döner. Bu Plugin geri dönüş
uyarıları çekirdek güncellemenin başarısız olmasına neden olmaz. Tam sürümler ve
açık etiketler yeniden yazılmaz.

<Warning>
Tam olarak sabitlenmiş bir npm Plugin güncellemesi, bütünlüğü depolanan kurulum kaydından farklı olan bir yapıta çözümlenirse, `openclaw update` bu Plugin yapıt güncellemesini yüklemek yerine durdurur. Yeni yapıta güvendiğinizi doğruladıktan sonra Plugin'i açıkça yeniden yükleyin veya güncelleyin.
</Warning>

<Note>
Yönetilen bir Plugin kapsamındaki ve eşitleme yolunun etrafından dolaşabildiği güncelleme sonrası Plugin eşitleme hataları (ör. zorunlu olmayan bir Plugin için erişilemeyen npm kayıt deposu), çekirdek güncelleme başarılı olduktan sonra uyarı olarak bildirilir. JSON sonucu üst düzey güncelleme `status: "ok"` değerini korur ve `openclaw update repair` ile `openclaw plugins inspect <id> --runtime --json` yönlendirmesiyle birlikte `postUpdate.plugins.status: "warning"` bildirir. Beklenmeyen güncelleyici veya eşitleme istisnaları yine de güncelleme sonucunu başarısız yapar. Plugin kurulumunu veya güncelleme hatasını düzeltin, ardından `openclaw update repair` komutunu yeniden çalıştırın.

Plugin başına eşitleme adımından sonra, `openclaw update` Gateway yeniden başlatılmadan önce zorunlu bir **çekirdek sonrası yakınsama** geçişi çalıştırır: eksik yapılandırılmış Plugin yüklerini onarır, diskteki her _etkin_ izlenen kurulum kaydını doğrular ve `package.json` dosyasının ayrıştırılabilir olduğunu (ve açıkça bildirilmiş herhangi bir `main` varsa mevcut olduğunu) statik olarak doğrular. Bu geçişten kaynaklanan hatalar ve geçersiz bir OpenClaw yapılandırma anlık görüntüsü, `postUpdate.plugins.status: "error"` döndürür ve üst düzey güncelleme `status` değerini `"error"` olarak değiştirir; böylece `openclaw update` sıfır olmayan kodla çıkar ve Gateway doğrulanmamış bir Plugin kümesiyle yeniden başlatılmaz. Hata, takip için `openclaw update repair` ve `openclaw plugins inspect <id> --runtime --json` komutlarını işaret eden yapılandırılmış `postUpdate.plugins.warnings[].guidance` satırları içerir. Devre dışı Plugin girdileri ve güvenilir kaynakla bağlantılı resmi eşitleme hedefleri olmayan kayıtlar burada atlanır; bu, eksik yük denetimi tarafından kullanılan `skipDisabledPlugins` politikasını yansıtır, böylece eski bir devre dışı Plugin kaydı aksi halde geçerli olan bir güncellemeyi engelleyemez.

Güncellenmiş Gateway başlatıldığında, Plugin yükleme yalnızca doğrulama amaçlıdır: başlangıçta paket yöneticileri çalıştırılmaz veya bağımlılık ağaçları değiştirilmez. Paket yöneticisi `update.run` yeniden başlatmaları CLI yönetilen hizmet yoluna devredilir; böylece paket değişimi eski Gateway işleminin dışında gerçekleşir ve güncellemenin tamamlanmış olarak bildirilebilip bildirilemeyeceğine hizmet sağlık kontrolleri karar verir.

pnpm önyüklemesi yine de başarısız olursa, güncelleyici checkout içinde `npm run build` denemek yerine paket yöneticisine özgü bir hatayla erken durur.
</Note>

## `--update` kısaltması

`openclaw --update`, `openclaw update` olarak yeniden yazılır (kabuklar ve başlatıcı betikleri için kullanışlıdır).

## İlgili

- `openclaw doctor` (git checkout'larında önce güncellemeyi çalıştırmayı önerir)
- [Geliştirme kanalları](/tr/install/development-channels)
- [Güncelleme](/tr/install/updating)
- [CLI başvurusu](/tr/cli)
