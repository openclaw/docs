---
read_when:
    - Bir kaynak kod çalışma kopyasını güvenli bir şekilde güncellemek istiyorsunuz
    - '`openclaw update` çıktısında veya seçeneklerinde hata ayıklıyorsunuz'
    - '`--update` kısaltma davranışını anlamanız gerekir'
summary: '`openclaw update` için CLI başvurusu (nispeten güvenli kaynak güncellemesi + gateway''in otomatik olarak yeniden başlatılması)'
title: Güncelleme
x-i18n:
    generated_at: "2026-07-16T16:51:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b46696f6b9cba5c318f870bcb6c5ea8e0652940968da2ad85e86709fe4c11146
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw'ı güncelleyin ve stable/extended-stable/beta/dev kanalları arasında geçiş yapın.

**npm/pnpm/bun** aracılığıyla yüklediyseniz (genel yükleme, git meta verisi yok),
güncellemeler [Güncelleme](/tr/install/updating) bölümünde açıklanan
paket yöneticisi akışı üzerinden gerçekleştirilir.

## Kullanım

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel extended-stable
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

`openclaw --update`, `openclaw update` olarak yeniden yazılır (kabuklar ve
başlatıcı betikleri için kullanışlıdır).

## Seçenekler

| Bayrak                                             | Açıklama                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | Başarılı bir güncellemeden sonra Gateway hizmetini yeniden başlatmayı atlayın. Yeniden başlatma yapan paket yöneticisi güncellemeleri, komut başarıyla tamamlanmadan önce yeniden başlatılan hizmetin beklenen sürümü bildirdiğini doğrular.                                                                                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | Güncelleme kanalını ayarlayın ve çekirdek güncellemesi başarıyla tamamlandıktan sonra kalıcı hâle getirin. Extended-stable yalnızca paketler içindir.                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | Yalnızca bu güncelleme için paket hedefini geçersiz kılın. Doğrulanmış kesin hedefi zorunlu olan etkin bir `extended-stable` kanalıyla birlikte kullanılamaz. Diğer paket yüklemelerinde `main`, `github:openclaw/openclaw#main` ile eşlenir; GitHub/git kaynak belirtimleri, aşamalı genel npm yüklemesinden önce geçici bir tarball olarak paketlenir. |
| `--dry-run`                                      | Yapılandırmaya yazmadan, yükleme yapmadan, plugin'leri eşitlemeden veya yeniden başlatmadan planlanan eylemleri (kanal/etiket/hedef/yeniden başlatma akışı) önizleyin.                                                                                                                                                                                                                |
| `--json`                                         | Makine tarafından okunabilir `UpdateRunResult` JSON verisini yazdırın. Yönetilen bir plugin'in onarılması gerektiğinde `postUpdate.plugins.warnings`, beta kanalı plugin geri dönüş ayrıntıları ve güncelleme sonrası eşitleme sırasında npm plugin yapıtı sapması algılandığında `postUpdate.plugins.integrityDrifts` dâhil edilir.                                                                 |
| `--timeout <seconds>`                            | Adım başına zaman aşımı. Varsayılan değer `1800`.                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | Onay istemlerini atlayın (örneğin sürüm düşürme onayı).                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | Güncelleme sonrası plugin eşitlemesinin, etkileşimli bir istem olmadan topluluk ClawHub güven uyarılarını aşarak devam etmesine izin verin. Bu seçenek olmadan, OpenClaw istem gösteremediğinde riskli topluluk sürümleri atlanır ve değiştirilmeden bırakılır. Resmî ClawHub paketleri ve paketle birlikte gelen plugin kaynakları bu istemi atlar.                                                     |

`--verbose` bayrağı yoktur. Planlanan eylemleri önizlemek için `--dry-run`,
makine tarafından okunabilir sonuçlar için `--json` ve yalnızca
kanal/kullanılabilirlik bilgisi için `openclaw update status --json` kullanın. Gateway konsol ayrıntı düzeyi (`--verbose`) ile
dosya günlük düzeyi (`logging.level: "debug"`/`"trace"`) birbirinden bağımsız ayarlardır;
[Gateway günlük kaydı](/tr/gateway/logging) bölümüne bakın.

<Note>
Nix modunda (`OPENCLAW_NIX_MODE=1`), değişiklik yapan `openclaw update` çalıştırmaları devre dışıdır. Bunun yerine bu yüklemenin Nix kaynağını veya flake girdisini güncelleyin; nix-openclaw için önce agent yaklaşımını kullanan [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) bölümünü kullanın. `openclaw update status` ve `openclaw update --dry-run` salt okunur olarak kalır.
</Note>

<Warning>
Eski sürümler yapılandırmayı bozabileceğinden sürüm düşürme işlemleri onay gerektirir.
Yükleme, oturumları zaten SQLite'a taşıdıysa daha eski bir dosya tabanlı sürümü
başlatmadan önce arşivlenmiş eski transkript yapıtlarını geri yükleyin.
[Doctor: Oturum SQLite geçişinden sonra sürüm düşürme](/tr/cli/doctor#downgrading-after-session-sqlite-migration) bölümüne bakın.
</Warning>

## `update status`

Etkin güncelleme kanalını, git etiketini/dalını/SHA'sını (yalnızca kaynak çalışma kopyaları)
ve güncelleme kullanılabilirliğini gösterin.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| Bayrak                  | Varsayılan | Açıklama                         |
| --------------------- | ------- | ----------------------------------- |
| `--json`              | `false` | Makine tarafından okunabilir durum JSON verisini yazdırın. |
| `--timeout <seconds>` | `3`     | Denetimler için zaman aşımı.                 |

Extended-stable paket yüklemelerinde durum, ön plandaki güncellemeyle aynı genel seçiciyi
ve kesin paket doğrulamasını gerçekleştirir. Yüklü sürüm daha yeniyse
`ahead of extended-stable` bildirebilir. JSON hataları
`registry.reason` (`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` veya `unsupported_git_channel`) içerir.

## `update repair`

Çekirdek paket zaten değiştirildiği hâlde sonraki onarım çalışmaları düzgün şekilde
tamamlanmadıysa güncelleme sonlandırmasını yeniden çalıştırın. `openclaw update`
yeni çekirdek paketi yüklediği hâlde çekirdek sonrası plugin eşitlemesi,
yönetilen npm plugin meta verileri, kayıt defteri yenilemesi veya Doctor onarımı
yakınsamadığında desteklenen kurtarma yolu budur.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| Bayrak                                             | Açıklama                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | Onarımdan önce çekirdek güncelleme kanalını kalıcı hâle getirin. Extended-stable için yalın/varsayılan veya `latest` amacını izleyen uygun resmî npm plugin'leri, yüklü kesin çekirdek sürümünü hedefler. Extended-stable onarımı, yapılandırma değiştirilmeden Git çalışma kopyalarında reddedilir. |
| `--json`                                         | Makine tarafından okunabilir sonlandırma JSON verisini yazdırın.                                                                                                                                                                                                                           |
| `--timeout <seconds>`                            | Onarım adımları için zaman aşımı. Varsayılan değer `1800`.                                                                                                                                                                                                                           |
| `--yes`                                          | Onay istemlerini atlayın.                                                                                                                                                                                                                                          |
| `--acknowledge-clawhub-risk`                     | `openclaw update` üzerindekiyle aynı davranış.                                                                                                                                                                                                                              |
| `--no-restart`                                   | Tutarlılık için kabul edilir; onarım Gateway'i hiçbir zaman yeniden başlatmaz.                                                                                                                                                                                                             |

`update repair`, `openclaw doctor --fix` komutunu çalıştırır, onarılan yapılandırmayı ve
yükleme kayıtlarını yeniden yükler, izlenen plugin'leri etkin güncelleme kanalı için eşitler,
yönetilen npm plugin yüklemelerini günceller, eksik yapılandırılmış plugin yüklerini onarır,
plugin kayıt defterini yeniler ve yakınsamış yükleme kaydı meta verilerini yazar.
Yeni bir çekirdek paket yüklemez ve Gateway'i yeniden başlatmaz.

## `update wizard`

Bir güncelleme kanalı seçmek ve ardından Gateway'in yeniden başlatılıp
başlatılmayacağını onaylamak için etkileşimli akış (varsayılan olarak yeniden başlatılır).
Git çalışma kopyası olmadan `dev` seçilmesi, bir tane oluşturmayı önerir.

| Bayrak                  | Varsayılan | Açıklama                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | Her güncelleme adımı için zaman aşımı. |

## İşleyişi

Kanallar arasında açıkça geçiş yapmak (`--channel ...`) yükleme yöntemini de
uyumlu tutar:

- `dev` -> bir git çalışma kopyası bulunmasını sağlar (varsayılan `~/openclaw` veya
  `OPENCLAW_HOME` ayarlandığında `$OPENCLAW_HOME/openclaw`; `OPENCLAW_GIT_DIR` ile
  geçersiz kılın), bunu günceller ve genel CLI'yi bu
  çalışma kopyasından yükler.
- `stable` -> `latest` kullanarak npm'den yükler.
- `extended-stable` -> genel npm `extended-stable` seçicisini çözümler,
  seçilen kesin paketi doğrular ve bu kesin sürümü yükler. Başka bir seçiciye
  geri dönmez ve Git çalışma kopyalarında reddedilir.
- `beta` -> npm dist-tag `beta` değerini tercih eder; beta
  eksikse veya mevcut kararlı sürümden eskiyse `latest` değerine geri döner.

### Yeniden başlatma devri

Gateway çekirdeğinin otomatik güncelleyicisi (yapılandırma aracılığıyla etkinleştirildiğinde),
CLI güncelleme yolunu canlı Gateway istek işleyicisinin dışında başlatır. Denetim düzlemi
`update.run` paket yöneticisi güncellemeleri ve denetimli git çalışma kopyası güncellemeleri,
paket ağacını değiştirmek veya canlı Gateway süreci içinde
`dist/` yeniden oluşturmak yerine aynı yönetilen hizmet devrini kullanır:
Gateway ayrılmış bir yardımcı başlatıp çıkar ve bu yardımcı `openclaw update --yes --json`
komutunu Gateway süreç ağacının dışından çalıştırır. Devir kullanılamıyorsa
`update.run`, elle çalıştırılacak güvenli kabuk komutunu içeren yapılandırılmış bir yanıt döndürür.

Saklanan extended-stable seçimleri, `update.checkOnStart` etkinleştirildiğinde salt okunur başlangıç ve 24 saatlik güncelleme
ipuçları alır. Bu kontroller hiçbir zaman güncelleme uygulamaz,
devir başlatmaz, Gateway'i yeniden başlatmaz, kararlı gecikme/değişken gecikme kullanmaz veya beta
yoklama sıklığını kullanmaz. Açık ön plan güncellemeleri, saklanan
`update.channel: "extended-stable"` ile yalın ön plan güncellemeleri, isteğe bağlı durum ve bunların yönetilen
Gateway devri desteklenmeye devam eder.

Yerel bir yönetilen Gateway hizmeti kuruluysa ve yeniden başlatma etkinse,
paket yöneticisi ve git çalışma kopyası güncellemeleri, paket ağacını
değiştirmeden veya çalışma kopyası/derleme çıktısını değiştirmeden önce çalışan hizmeti durdurur. Güncelleyici
ardından hizmet meta verilerini yeniler, hizmeti yeniden başlatır ve
`Gateway: restarted and verified.` bildiriminde bulunmadan önce yeniden başlatılan Gateway'i doğrular.
Paket yöneticisi güncellemeleri ayrıca yeniden başlatılan Gateway'in beklenen
paket sürümünü bildirdiğini doğrular; git çalışma kopyası güncellemeleri ise yeniden derlemeden sonra Gateway durumunu ve
hizmet hazır olma durumunu doğrular.

Paket yöneticisi güncellemeleri normalde yönetilen hizmette kayıtlı Node ikilisini
kullanmaya devam eder. Bu Node hedef sürümü çalıştıramıyorsa ancak mevcut
CLI Node'u çalıştırabiliyorsa ve hizmetin güncellenen pakete ait olduğu
kanıtlanmışsa, yeniden başlatmanın etkin olduğu bir güncelleme sonlandırma için mevcut Node'u kullanır ve
hizmet meta verilerini bu çalışma zamanına göre yeniden yazar. `--no-restart` hizmet
meta verilerini onaramaz; bu nedenle aynı çalışma zamanı uyumsuzluğu paket değiştirilmeden önce işlemi durdurur.

macOS'te güncelleme sonrası kontrol ayrıca LaunchAgent'ın etkin profil için
yüklendiğini/çalıştığını ve yapılandırılmış geri döngü bağlantı noktasının
sağlıklı olduğunu doğrular. Plist kuruluysa ancak launchd bunu denetlemiyorsa OpenClaw
LaunchAgent'ı otomatik olarak yeniden önyükler ve durum/sürüm/
kanal hazır olma kontrollerini yeniden çalıştırır (yeni bir önyükleme `RunAtLoad` işini doğrudan yükler,
bu nedenle kurtarma yeni başlatılan Gateway'i hemen `kickstart -k` etmez). Gateway
yine de sağlıklı duruma gelmezse komut sıfır olmayan bir kodla çıkar ve
yeniden başlatma günlüğü yolunun yanı sıra yeniden başlatma, yeniden kurma ve paket geri alma
talimatlarını yazdırır.

Yeniden başlatma çalıştırılamazsa komut, elle `openclaw gateway restart` ipucuyla
`Gateway: restart skipped (...)` veya `Gateway: restart failed: ...` yazdırır.
`--no-restart` ile paket değiştirme veya git yeniden derleme yine çalışır ancak
yönetilen hizmet durdurulmaz veya yeniden başlatılmaz; bu nedenle çalışan Gateway siz elle
yeniden başlatana kadar eski kodu kullanmaya devam eder.

### Kontrol düzlemi yanıt biçimi

`update.run`, bir paket yöneticisi kurulumunda veya denetlenen git çalışma kopyasında Gateway kontrol düzlemi
üzerinden çalıştığında işleyici, devir başlatmayı Gateway çıktıktan sonra
devam eden CLI güncellemesinden ayrı olarak bildirir:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` ve
  `handoff.status: "started"`: Gateway, yönetilen hizmet devrini oluşturdu
  ve ayrılmış yardımcının canlı hizmet işleminin dışında
  `openclaw update --yes --json` çalıştırabilmesi için kendi yeniden başlatmasını zamanladı.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` ve
  `handoff.status: "unavailable"`: OpenClaw güvenli bir devir için denetleyici
  hizmet sınırı ve kalıcı hizmet kimliği bulamadı (örneğin,
  systemd devri yalnızca ortamdaki systemd işlem işaretçilerini değil,
  `OPENCLAW_SYSTEMD_UNIT` birim kimliğini gerektirir). Yanıt,
  Gateway'in dışından çalıştırılacak kabuk komutu olan
  `handoff.command` değerini içerir.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`: Gateway
  devri oluşturmayı denedi ancak ayrılmış yardımcıyı başlatamadı.

`sentinel` yükü Gateway çıkmadan önce yazılır ve CLI
devri, yönetilen hizmetin yeniden başlatma durum kontrolleri tamamlandıktan sonra aynı yeniden başlatma işaretçisini
günceller. Devir sırasında işaretçi, başarı devamı olmadan
`stats.reason: "restart-health-pending"` taşıyabilir; yeniden başlatılan Gateway bunu yoklar ve devamı yalnızca CLI
hizmet durumunu doğruladıktan ve işaretçiyi nihai `ok` sonucuyla
yeniden yazdıktan sonra tetikler.
`openclaw status` ve `openclaw status --all`, bu işaretçi beklemedeyken veya başarısız olduğunda bir `Update restart` satırı
gösterir; `update.status` ise yenileyerek
en son işaretçiyi döndürür.

## Git çalışma kopyası akışı

### Kanal seçimi

- `stable`: en son beta olmayan etiketi çalışma kopyasına alır, ardından derleme ve doctor işlemlerini çalıştırır.
- `beta`: en son `-beta` etiketini tercih eder; beta yoksa veya daha eskiyse
  en son kararlı etikete geri döner.
- `dev`: `main` öğesini çalışma kopyasına alır, ardından getirip yeniden temellendirir.
- `extended-stable`: Git çalışma kopyaları için desteklenmez; çalışma kopyasında
  değişiklik yapılmaz.

### Güncelleme adımları

<Steps>
  <Step title="Temiz çalışma ağacını doğrula">
    Kaydedilmemiş değişiklik bulunmamasını gerektirir.
  </Step>
  <Step title="Kanalı değiştir">
    Seçilen kanala (etiket veya dal) geçer.
  </Step>
  <Step title="Üst kaynaktan getir">
    Yalnızca geliştirme.
  </Step>
  <Step title="Ön kontrol derlemesi (yalnızca geliştirme)">
    TypeScript derlemesini geçici bir çalışma ağacında çalıştırır. Uç başarısız olursa derlenebilen en yeni işlemi bulmak için en fazla 10 işlem geriye gider. Bu ön kontrol sırasında lint'i de çalıştırmak için `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` ayarlayın; kullanıcı güncelleme makineleri genellikle CI çalıştırıcılarından daha küçük olduğundan lint, kaynakları kısıtlanmış seri modda çalışır.
  </Step>
  <Step title="Yeniden temellendir">
    Seçilen işlemin üzerine yeniden temellendirir (yalnızca geliştirme).
  </Step>
  <Step title="Bağımlılıkları kur">
    Deponun paket yöneticisini kullanır. pnpm çalışma kopyalarında güncelleyici, pnpm çalışma alanı içinde `npm run build` çalıştırmak yerine gerektiğinde `pnpm` önyüklemesini yapar (önce `corepack`, ardından geçici bir `npm install pnpm@11` geri dönüşü aracılığıyla). pnpm önyüklemesi yine de başarısız olursa güncelleyici, çalışma kopyasında `npm run build` denemek yerine paket yöneticisine özgü bir hatayla erkenden durur.
  </Step>
  <Step title="Control UI'ı derle">
    Gateway'i ve Control UI'ı derler.
  </Step>
  <Step title="Doctor'ı çalıştır">
    `openclaw doctor`, son güvenli güncelleme kontrolü olarak çalışır.
  </Step>
  <Step title="Pluginleri eşitle">
    Pluginleri etkin kanalla eşitler. Geliştirme, paketle gelen pluginleri; kararlı ve beta ise npm'i kullanır. İzlenen plugin kurulumlarını günceller.
  </Step>
</Steps>

### Plugin eşitleme ayrıntıları

Beta kanalında, varsayılan/en son çizgiyi izleyen kayıtlı npm ve ClawHub plugin
kurulumları önce bir plugin `@beta` sürümünü dener. Pluginin beta
sürümü yoksa OpenClaw kayıtlı varsayılan/en son belirtime geri döner ve
bir uyarı bildirir. OpenClaw, npm pluginleri için beta
paketi mevcut olduğu hâlde kurulum doğrulamasında başarısız olduğunda da geri döner. Bu geri dönüş uyarıları
çekirdek güncellemesini başarısız kılmaz. Kesin sürümler ve açık etiketler hiçbir zaman yeniden yazılmaz.

<Warning>
Kesin bir sürüme sabitlenmiş npm plugin güncellemesi, bütünlüğü saklanan kurulum kaydından farklı bir yapıta çözümlenirse `openclaw update`, söz konusu plugin yapıtını kurmak yerine güncellemesini iptal eder. Yeni yapıta güvendiğinizi doğruladıktan sonra plugini açıkça yeniden kurun veya güncelleyin.
</Warning>

<Note>
Yönetilen bir pluginle sınırlı olan ve eşitleme yolunun çevresinden dolaşabildiği güncelleme sonrası plugin eşitleme hataları (örneğin, temel olmayan bir plugin için erişilemeyen npm kayıt defteri), çekirdek güncellemesi başarıyla tamamlandıktan sonra uyarı olarak bildirilir. JSON sonucu üst düzey güncelleme `status: "ok"` değerini korur ve `openclaw update repair` ile `openclaw plugins inspect <id> --runtime --json` yönlendirmesini içeren `postUpdate.plugins.status: "warning"` değerini bildirir. Beklenmeyen güncelleyici veya eşitleme istisnaları güncelleme sonucunu yine de başarısız kılar. Plugin kurulum veya güncelleme hatasını düzeltin, ardından `openclaw update repair` komutunu yeniden çalıştırın. Başarısız bir güncelleme yönetilen bir plugini kullanılamaz durumda bırakırsa OpenClaw, operatör tarafından yazılan `plugins.allow` veya `plugins.deny` politikasını değiştirmeden çalışma zamanı girişini devre dışı bırakır ve etkin yuvaları sıfırlar.

Plugin başına eşitleme adımından sonra `openclaw update`, Gateway yeniden başlatılmadan önce zorunlu bir **çekirdek sonrası yakınsama** geçişi çalıştırır: eksik yapılandırılmış plugin yüklerini onarır, diskteki her _etkin_ izlenen kurulum kaydını doğrular ve `package.json` öğesinin ayrıştırılabilir olduğunu (ve açıkça bildirilen tüm `main` öğelerinin mevcut olduğunu) statik olarak doğrular. Bu geçişteki hatalar ve geçersiz bir yapılandırma anlık görüntüsü `postUpdate.plugins.status: "error"` döndürür ve üst düzey güncelleme `status` değerini `"error"` olarak değiştirir; böylece `openclaw update` sıfır olmayan bir kodla çıkar ve Gateway doğrulanmamış bir plugin kümesiyle yeniden başlatılmaz. Hata, `openclaw update repair` ve `openclaw plugins inspect <id> --runtime --json` öğelerini işaret eden yapılandırılmış `postUpdate.plugins.warnings[].guidance` satırlarını içerir. Devre dışı plugin girişleri ve güvenilir kaynağa bağlı resmî eşitleme hedefleri olmayan kayıtlar burada atlanır (eksik yük kontrolünün kullandığı `skipDisabledPlugins` politikasıyla aynı şekilde); böylece eski bir devre dışı plugin kaydı, bunun dışında geçerli olan bir güncellemeyi engelleyemez.

Güncellenen Gateway başladığında plugin yükleme yalnızca doğrulama yapar: başlangıç, paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını değiştirmez. Paket yöneticisi `update.run` yeniden başlatmaları CLI'ın yönetilen hizmet yoluna devredilir; böylece paket değişimi eski Gateway işleminin dışında gerçekleşir ve güncellemenin tamamlanmış olarak bildirilip bildirilemeyeceğine hizmet durum kontrolleri karar verir.
</Note>

Bir extended-stable çekirdek güncellemesi başarıyla tamamlandıktan sonra çekirdek sonrası plugin bütünlüğü ve
yakınsama, uygun resmî npm pluginlerini tam olarak kurulu çekirdek
sürümünde hedefler. Varsayılan/`latest` amacı için OpenClaw, plugin
`@extended-stable` değerini sorgulamaz veya npm `latest` değerine geri dönmez; paket sürümünü
kurulu çekirdekten türetir. Açık sürüm sabitlemeleri, açık `latest` olmayan etiketler,
üçüncü taraf paketler ve npm dışı kaynaklar mevcut amaçlarını korur.

Paket yöneticisi kurulumlarında `openclaw update`, paket yöneticisini
çağırmadan önce hedef paket sürümünü çözümler. npm genel kurulumları aşamalı
kurulum kullanır: OpenClaw yeni paketi geçici bir npm önekine kurar,
aday paketin `preinstall` sırasında ana makinenin Node sürümünü doğrulamasına izin verir
ve paketlenmiş `dist` envanterini burada doğrular. Paketlenmiş bir tamamlama koruması,
`preinstall` başarılı olana kadar bu envanterin dışında kalır; böylece yaşam döngüsü betiklerini
atlayan paket yöneticileri de etkinleştirmeden önce durur. npm 12 ve daha yeni sürümlerde
güncelleyici yalnızca aday OpenClaw yaşam döngüsünü onaylar; geçişli
bağımlılık betikleri engellenmiş olarak kalır. OpenClaw ardından temiz paket ağacını
gerçek genel öneke geçirir. Doğrulama başarısız olursa güncelleme sonrası doctor, plugin
eşitleme ve yeniden başlatma işlemleri şüpheli ağaçtan çalıştırılmaz. Kurulu
sürüm hedefle zaten eşleşse bile komut genel paket kurulumunu
yeniler, ardından plugin eşitlemesini, çekirdek komut tamamlama
yenilemesini ve yeniden başlatma işlemlerini çalıştırır. Bu, paketlenmiş yardımcı bileşenleri ve kanalın sahip olduğu
plugin kayıtlarını kurulu OpenClaw derlemesiyle uyumlu tutarken tam
plugin komutu tamamlama yeniden derlemelerini açık
`openclaw completion --write-state` çalıştırmalarına bırakır.

## İlgili

- `openclaw doctor` (git çalışma kopyalarında önce güncellemeyi çalıştırmayı önerir)
- [Geliştirme kanalları](/tr/install/development-channels)
- [Güncelleme](/tr/install/updating)
- [CLI başvurusu](/tr/cli)
