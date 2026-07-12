---
read_when:
    - Herkese açık sürüm kanalı tanımları aranıyor
    - Sürüm doğrulamasını veya paket kabulünü çalıştırma
    - Sürüm adlandırması ve yayın sıklığı hakkında bilgi arıyorsanız
summary: Sürüm kanalları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve yayın sıklığı
title: Sürüm politikası
x-i18n:
    generated_at: "2026-07-12T12:45:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw şu anda kullanıcılara yönelik üç güncelleme kanalı sunar:

- stable: ayrı CLI/kanal dönüm noktası tamamlanana kadar npm `latest` üzerinden çözümlenmeye devam eden mevcut yükseltilmiş sürüm kanalı
- beta: npm `beta` etiketiyle yayımlanan ön sürüm etiketleri
- dev: `main` dalının sürekli değişen en güncel ucu

Buna ek olarak sürüm operatörleri, tamamlanan son aya ait çekirdek paketi `33` yamasından başlayarak npm `extended-stable` etiketiyle yayımlayabilir. İçinde bulunulan ayın normal nihai sürüm hattı npm `latest` üzerinde devam eder; operatör tarafındaki bu yayımlama ayrımı tek başına CLI güncelleme kanalı çözümlemesini değiştirmez.

Tideclaw alfa derlemeleri ayrı bir dahili ön sürüm hattıdır (npm dağıtım etiketi `alpha`) ve [NPM iş akışı girdileri](#npm-workflow-inputs) ile [Sürüm test kutuları](#release-test-boxes) bölümlerinde ele alınır.

## Sürüm adlandırması

- Aylık npm extended-stable sürüm sürümü: `YYYY.M.PATCH`; `PATCH >= 33`, git etiketi `vYYYY.M.PATCH`
- Günlük/normal nihai sürüm sürümü: `YYYY.M.PATCH`; `PATCH < 33`, git etiketi `vYYYY.M.PATCH`
- Normal geri dönüş düzeltme sürümü: `YYYY.M.PATCH-N`, git etiketi `vYYYY.M.PATCH-N`
- Beta ön sürüm sürümü: `YYYY.M.PATCH-beta.N`, git etiketi `vYYYY.M.PATCH-beta.N`
- Alfa ön sürüm sürümü: `YYYY.M.PATCH-alpha.N`, git etiketi `vYYYY.M.PATCH-alpha.N`
- Ay veya yama numarasını hiçbir zaman başına sıfır ekleyerek doldurmayın
- `PATCH`, takvim günü değil, aylık sürüm hattının sıralı numarasıdır. Normal nihai ve beta sürümleri mevcut hattı ilerletir; yalnızca alfa etiketleri beta/normal yama numarasını hiçbir zaman tüketmez veya ilerletmez. Bu nedenle beta ya da normal bir hat seçerken daha yüksek yama numaralarına sahip eski yalnızca alfa etiketlerini yok sayın.
- Alfa/gecelik derlemeler bir sonraki yayımlanmamış yama hattını kullanır ve yinelenen derlemelerde yalnızca `alpha.N` değerini artırır. Bu yama için bir beta yayımlandığında yeni alfa derlemeleri sonraki yamaya geçer.
- npm sürümleri değiştirilemez: yayımlanmış bir etiketi hiçbir zaman silmeyin, yeniden yayımlamayın veya tekrar kullanmayın. Bunun yerine sonraki ön sürüm numarasını ya da sonraki aylık yamayı oluşturun.
- `latest`, mevcut normal/günlük npm hattını izlemeye devam eder; `beta`, mevcut beta kurulum hedefidir
- `extended-stable`, `33` yamasından başlayan, desteklenen önceki aya ait npm paketi anlamına gelir; `34` ve sonraki yamalar bu aylık hattın bakım sürümleridir
- Normal nihai ve normal düzeltme sürümleri varsayılan olarak npm `beta` etiketiyle yayımlanır; sürüm operatörleri açıkça `latest` hedefini belirleyebilir veya incelenmiş bir beta derlemesini daha sonra yükseltebilir
- Özel aylık extended-stable yolu, çekirdek npm paketini ve npm üzerinden yayımlanabilen tüm resmî plugin'leri tamamen aynı sürümle yayımlar. Plugin'leri ClawHub'a, macOS veya Windows yapıtlarını, GitHub Release'i, özel depo dağıtım etiketlerini, Docker görüntülerini, mobil yapıtları ya da web sitesi indirmelerini yayımlamaz.
- Her normal nihai sürüm; npm paketini, macOS uygulamasını, imzalı bağımsız Android APK'sını ve imzalı Windows Hub yükleyicilerini birlikte sunar. Beta sürümleri normalde önce npm/paket yolunu doğrular ve yayımlar; yerel uygulama derleme/imzalama/noter onayı/yükseltme işlemleri, açıkça istenmedikçe normal nihai sürüme ayrılır.

## Sürüm sıklığı

- Sürümler önce beta olarak ilerler; stable yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar sürümleri normalde mevcut `main` dalından oluşturulan bir `release/YYYY.M.PATCH` dalından çıkarır; böylece sürüm doğrulaması ve düzeltmeler `main` üzerindeki yeni geliştirmeleri engellemez
- Bir beta etiketi gönderilmiş veya yayımlanmışsa ve düzeltilmesi gerekiyorsa bakımcılar eski etiketi silmek ya da yeniden oluşturmak yerine sonraki `-beta.N` etiketini çıkarır
- Ayrıntılı sürüm prosedürü, onaylar, kimlik bilgileri ve kurtarma notları yalnızca bakımcılara açıktır

## Yalnızca npm için aylık extended-stable yayımlaması

Bu, aşağıdaki normal sürüm prosedürüne özel bir istisnadır. Tamamlanmış bir `YYYY.M` ayı için `extended-stable/YYYY.M.33` dalını oluşturun; `vYYYY.M.33` sürümünü ve sonraki bakım yamalarını aynı daldan yayımlayın. Sürüm etiketi, dal ucu, çalışma kopyası, paket sürümü, npm ön kontrolü ve Tam Sürüm Doğrulama çalıştırması aynı commit'i göstermelidir. Korumalı `main`, hâlihazırda yaması `33` değerinden küçük ve takvim açısından kesinlikle daha sonraki bir aya ait nihai sürümü içermelidir; bakım yamaları `main` bir aydan daha fazla ilerledikten sonra da uygunluğunu korur.

Tam olarak extended-stable dalında kök paket sürümünü `YYYY.M.P` olarak yükseltin, `pnpm release:prep` komutunu çalıştırın ve yayımlanabilir her uzantı paketinin aynı sürüme sahip olduğunu doğrulayın. Oluşturulan tüm değişiklikleri commit edip gönderin, değiştirilemez `vYYYY.M.P` etiketini bu commit'te oluşturup gönderin ve ortaya çıkan tam SHA'yı kaydedin. İş akışları bu hazırlanmış ağacı kullanır; sürümleri sizin yerinize yükseltmez veya eşitlemez.

npm ön kontrolünü ve Tam Sürüm Doğrulamasını tam olarak bu hazırlanmış dal ucundan çalıştırın, ardından her iki çalıştırma kimliğini ve başarılı Tam Sürüm Doğrulama çalıştırma denemesini kaydedin:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable`, mevcut doğrulama derinliği profilidir; npm `extended-stable` dağıtım etiketinden ayrıdır ve kasıtlı olarak değiştirilmemiştir.

Her iki çalıştırma da başarılı olduktan sonra npm üzerinden yayımlanabilen tüm resmî plugin'leri tam olarak aynı dal ucundan yayımlayın. `P` yaması `33` veya daha büyük olmalıdır. Tam sürüm SHA'sını `ref` olarak iletin, tüm matrisin tamamlanmasını ve kayıt defterinden geri okumayı bekleyin, ardından başarılı Plugin NPM Release çalıştırma kimliğini kaydedin:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

İş akışı, kaynakları değişmemiş paketler dâhil olmak üzere normal hazırlanmış `all-publishable` paket envanterini kullanır. Başarılı olmadan önce her tam paketi ve her plugin'in `extended-stable` etiketini doğrular. Kısmi bir çalıştırma başarısız olursa aynı komutu yeniden çalıştırın: daha önce yayımlanmış paketler yeniden kullanılır, eksik veya güncelliğini yitirmiş plugin etiketleri npm sürüm ortamında uzlaştırılır ve son geri okuma yine tüm paket kümesini kapsar.

Plugin iş akışı başarılı olduktan ve npm sürüm ortamı hazır olduğunda tam çekirdek ön kontrol tarball'unu yayımlayın. Çekirdek yayımlaması, başvurulan plugin çalıştırmasının aynı standart dalda ve tam kaynak SHA'sında `completed/success` olduğunu doğrular:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

Aylık `.33` veya korumalı `main` ay politikasını kasıtlı olarak karşılayamayan bir çatallama ya da üretim dışı prova için hem npm ön kontrolü hem de yayımlama tetiklemelerine `-f bypass_extended_stable_guard=true` ekleyin. Varsayılan değer `false` şeklindedir. Atlatma yalnızca `npm_dist_tag=extended-stable` ile kabul edilir ve iş akışı özetine kaydedilir. Standart `extended-stable/YYYY.M.33` iş akışı başvurusunu, dal ucu/etiket/çalışma kopyası eşitliğini, nihai etiket söz dizimini, paket/etiket sürümü eşitliğini, başvurulan çalıştırma ve bildirim kimliğini, tarball kaynağını, ortam onayını, kayıt defteri geri okumasını veya seçici onarımı kanıtını atlatmaz.

Yayımlama iş akışı; başvurulan ön kontrol, doğrulama ve plugin çalıştırma kimliklerini, hazırlanmış tarball özetini ve çekirdek kayıt defteri seçicilerini doğrular. İş akışı başarılı olduktan sonra sonucu bağımsız olarak doğrulayın:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Her iki komut da `YYYY.M.P` döndürmelidir. Yayımlama başarılı olur ancak seçici geri okuması başarısız olursa değiştirilemez paket sürümünü yeniden yayımlamayın. Başarısız iş akışının her zaman çalışan özetinde yazdırılan tek `npm dist-tag add openclaw@YYYY.M.P extended-stable` onarım komutunu kullanın, ardından her iki bağımsız geri okumayı tekrarlayın. Önceki seçiciye geri dönmek ayrı bir operatör kararıdır; geri okuma onarım yolu değildir.

Herkese açık destek belgeleri başlangıçta Slack, Discord ve Codex'i kapsanan extended-stable plugin yüzeyleri olarak belirtir. Bu liste bir destek beyanıdır, sürüm kodu izin listesi değildir: npm üzerinden yayımlanabilen tüm resmî plugin'ler tamamen aynı sürümlü yayımlama yolunu izler.

Aşağıdaki normal kontrol listesi beta, `latest`, GitHub Release, plugin'ler, macOS, Windows ve diğer platform yayımlamalarını yönetmeye devam eder. Yalnızca npm için olan bu extended-stable yolunda bu adımları çalıştırmayın.

## Normal sürüm operatörü kontrol listesi

Bu kontrol listesi sürüm akışının herkese açık biçimidir. Özel kimlik bilgileri, imzalama, noter onayı, dağıtım etiketi kurtarma ve acil geri alma ayrıntıları yalnızca bakımcılara açık sürüm çalışma kitabında tutulur.

1. Güncel `main` dalından başlayın: en son değişiklikleri çekin, hedef commit'in gönderildiğini doğrulayın ve `main` CI durumunun dal oluşturmak için yeterince başarılı olduğunu doğrulayın.
2. En üstteki `CHANGELOG.md` bölümünü, son erişilebilir sürüm etiketinden bu yana birleştirilen PR'lerden ve tüm doğrudan commit'lerden oluşturun. Girdileri kullanıcıya yönelik tutun, birbiriyle örtüşen PR/doğrudan commit girdilerini tekilleştirin, commit edip gönderin ve dal oluşturmadan önce bir kez daha rebase yapın/değişiklikleri çekin. Farklılaşmış yayımlanmış bir etiket veya daha sonraki bir ileri taşıma, zaten yayımlanmış PR'leri yeniden ilişkilendirdiğinde bu etiketi `--shipped-ref` olarak açıkça iletin; doğrulayıcı, etiket anlık görüntüsünün numaralı bölümlerindeki eksiksiz katkı kayıtlarında bulunan açık PR satırlarını kullanır, `Unreleased` bölümünü yok sayar ve hariç tutulan PR'lerin tam envanterini ve sayısını kaydeder.
3. `src/plugins/compat/registry.ts` ve `src/commands/doctor/shared/deprecation-compat.ts` içindeki sürüm uyumluluğu kayıtlarını inceleyin. Süresi dolmuş uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ediyorsa kaldırın veya neden bilinçli olarak korunduğunu kaydedin.
4. Güncel `main` dalından `release/YYYY.M.PATCH` oluşturun. Normal sürüm çalışmalarını doğrudan `main` üzerinde yapmayın.
5. Etiket için gerekli tüm sürüm konumlarını yükseltin, ardından `pnpm release:prep` komutunu çalıştırın. Bu komut sırasıyla Plugin sürümlerini, npm shrinkwrap dosyalarını, Plugin envanterini, temel yapılandırma şemasını, paketlenmiş kanal yapılandırma meta verilerini, yapılandırma belgeleri temelini, Plugin SDK dışa aktarımlarını ve Plugin SDK API temelini yeniler. Etiketlemeden önce oluşturulan tüm sapmaları commit edin, ardından yerel deterministik ön kontrolü çalıştırın: `pnpm check:test-types`, `pnpm check:architecture`, `pnpm build && pnpm ui:build` ve `pnpm release:check`.
6. `OpenClaw NPM Release` iş akışını `preflight_only=true` ile çalıştırın. Henüz bir etiket yokken yalnızca doğrulama amaçlı ön kontrol için 40 karakterlik tam sürüm dalı SHA'sına izin verilir. Ön kontrol, kullanıma alınmış tam bağımlılık grafiği için bağımlılık sürüm kanıtı oluşturur ve bunu npm ön kontrol yapıtında saklar. Başarılı `preflight_run_id` değerini kaydedin.
7. Sürüm öncesi tüm testleri sürüm dalı, etiket veya tam commit SHA'sı için `Full Release Validation` ile başlatın. Bu, dört büyük sürüm test kutusunun tek manuel giriş noktasıdır: Vitest, Docker, QA Lab ve Paket. `full_release_validation_run_id` değerini ve tam `full_release_validation_run_attempt` değerini kaydedin; her ikisi de `OpenClaw NPM Release` ve `OpenClaw Release Publish` için zorunlu girdilerdir.
8. Doğrulama başarısız olursa sürüm dalında düzeltin ve düzeltmeyi kanıtlayan en küçük başarısız dosyayı, hattı, iş akışı görevini, paket profilini, sağlayıcıyı veya model izin listesini yeniden çalıştırın. Tam kapsayıcı iş akışını yalnızca değiştirilen yüzey önceki kanıtları geçersiz kıldığında yeniden çalıştırın.
9. Etiketlenmiş bir beta adayı için eşleşen `release/YYYY.M.PATCH` dalından `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` komutunu çalıştırın. Kararlı sürüm için gerekli Windows kaynak sürümünü de iletin: `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`. Yardımcı, iş akışı kaynağı olarak güvenilir `main` dalını kullanırken her iş akışı tam etiketi hedefler. Değişmez aday/araç kimliğini ve başlatılan çalışma kimliklerini `.artifacts/release-candidate/<tag>/release-candidate-state.json` içinde kontrol noktası olarak kaydeder; aynı komutun yeniden çalıştırılması bu tam çalışmaları sürdürürken aday, araç, profil veya seçeneklerdeki herhangi bir sapma güvenli biçimde başarısız olur. Yardımcı, tam doğrulama matrisini başlatmadan önce tam etiketin GitHub sürüm gövdesini deterministik olarak oluşturur ve eksik sürüm başlığını, kurallı sıkıştırılmış biçimi kullanamayan sınır aşımı bir gövdeyi veya etiketten erişilemeyen katkı kaydı temel/hedef kökenini reddeder. Ayrıca açıkça belirtilen tüm yayımlanmış temel hariç tutma meta verilerini, başvurulan birikimli etiket kayıtlarına göre doğrular. Ardından yerel oluşturulmuş sürüm kontrollerini çalıştırır; tam sürüm doğrulamasını ve npm ön kontrol kanıtını başlatır veya doğrular; tam hazırlanmış tarball üzerinde Parallels temiz kurulum/güncelleme kanıtını ve Telegram paket kanıtını çalıştırır; Plugin npm ve ClawHub planlarını kaydeder ve yalnızca kanıt paketi başarılı olduğunda tam `OpenClaw Release Publish` komutunu yazdırır.

   `OpenClaw Release Publish`, seçilen veya yayımlanabilir tüm Plugin paketlerini npm'e ve aynı kümeyi paralel olarak ClawHub'a gönderir; ardından Plugin npm yayımı başarılı olduğunda hazırlanmış OpenClaw npm ön kontrol yapıtını eşleşen dist-tag ile yükseltir. Sürüm çalışma kopyası ürün/veri kökü olarak kalırken planlama ve son doğrulama, eski bir sürüm commit'inin güncelliğini yitirmiş sürüm araçlarını sessizce kullanamaması için tam güvenilir iş akışı kaynağı çalışma kopyasından yürütülür. Herhangi bir alt yayım başlamadan önce tam GitHub sürüm gövdesini oluşturup önbelleğe alır. Eşleşen eksiksiz `CHANGELOG.md` bölümü GitHub'ın 125.000 karakterlik sınırına ve oluşturucunun eşleşen 125.000 baytlık güvenlik tavanına sığdığında sayfa, başlığı dâhil olmak üzere tam `## YYYY.M.PATCH` bölümünü içerir. Kaynak bölüm sığmadığında sayfa, gruplandırılmış editoryal notları eksiksiz korur ve fazla büyük katkı kaydını etikete sabitlenmiş `CHANGELOG.md` içindeki tam kayda yönlendiren kararlı bir bağlantıyla değiştirir; kısmi kayıtlar ve kesilmiş madde işaretleri hiçbir zaman yayımlanmaz. İş akışı, `### Sürüm doğrulaması` bölümünü eklemeden önce tam veya sıkıştırılmış gövdeyi seçer; kanıt son bölümü sınırı aşacaksa kurallı gövdeyi korur ve bunun yerine değişmez ekli kanıta dayanır. npm `latest` etiketiyle yayımlanan kararlı sürümler GitHub'ın en son sürümü olurken npm `beta` etiketinde tutulan kararlı bakım sürümleri GitHub `latest=false` ile oluşturulur. İş akışı ayrıca sürüm sonrası olay müdahalesi için ön kontrol bağımlılık kanıtını, tam doğrulama bildirimini ve yayım sonrası kayıt defteri doğrulama kanıtını GitHub sürümüne yükler. Alt çalışma kimliklerini hemen yazdırır, iş akışı belirtecinin onaylamasına izin verilen sürüm ortamı geçitlerini otomatik olarak onaylar, başarısız alt görevleri günlük sonlarıyla özetler, taslak GitHub sürüm sayfasını en başta oluşturur ve Windows ile Android yapıtlarını OpenClaw npm yayımıyla eşzamanlı olarak yükseltir, bu aşamalar başarılı olduğunda sürüm sayfasını ve bağımlılık kanıtını tamamlar, OpenClaw npm yayımlanıyorsa ClawHub'ı bekler, ardından güvenilir `main` beta doğrulayıcısını çalıştırır ve GitHub sürümü, npm paketi, seçili Plugin npm paketleri, seçili ClawHub paketleri, alt iş akışı çalışma kimlikleri ve isteğe bağlı NPM Telegram çalışma kimliği için yayım sonrası kanıtı yükler. ClawHub başlangıç doğrulayıcısı; tam güvenilir `main` iş akışı yolunu ve SHA'sını, üretici ve sonlandırıcı çalışma denemelerini, sürüm SHA'sını, istenen paket kümesini, değişmez paket yapıtı demetini ve son kayıt defteri geri okuma yapıtını gerektirir; başarılı bir eski sürüm referansı çalışması kabul edilmez.

   Ardından yayımlanan `openclaw@YYYY.M.PATCH-beta.N` veya `openclaw@beta` paketine karşı yayım sonrası paket kabul testini çalıştırın. Gönderilmiş veya yayımlanmış bir ön sürümün düzeltilmesi gerekiyorsa eşleşen bir sonraki ön sürüm numarasını oluşturun; eskisini hiçbir zaman silmeyin veya yeniden yazmayın.

10. Kararlı sürüm için yalnızca incelenip onaylanmış beta veya sürüm adayı gerekli doğrulama kanıtına sahip olduktan sonra devam edin. Kararlı npm yayımı da başarılı ön kontrol yapıtını `preflight_run_id` aracılığıyla yeniden kullanarak `OpenClaw Release Publish` üzerinden gerçekleştirilir. Kararlı macOS sürüm hazırlığı ayrıca paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve güncellenmiş `appcast.xml` dosyalarının `main` üzerinde bulunmasını gerektirir; macOS yayım iş akışı, sürüm yapıtları doğrulandıktan sonra imzalanmış appcast'i otomatik olarak herkese açık `main` dalında yayımlar veya dal koruması doğrudan göndermeyi engelliyorsa bir appcast PR'si açar/günceller. Kararlı Windows Hub hazırlığı, imzalanmış `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` ve `OpenClawCompanion-SHA256SUMS.txt` yapıtlarının OpenClaw GitHub sürümünde bulunmasını gerektirir. İmzalanmış `openclaw/openclaw-windows-node` sürüm etiketini `windows_node_tag` olarak ve aday onaylı yükleyici özet eşlemesini `windows_node_installer_digests` olarak tam biçimde iletin; `OpenClaw Release Publish` sürümü taslak olarak tutar, `Windows Node Release` iş akışını başlatır ve yayımlamadan önce üç yapıtın tümünü doğrular.
11. Yayımdan sonra npm yayım sonrası doğrulayıcısını, yayım sonrası kanal kanıtına ihtiyacınız olduğunda isteğe bağlı bağımsız yayımlanmış npm Telegram E2E testini ve gerektiğinde dist-tag yükseltmesini çalıştırın; oluşturulan GitHub sürüm sayfasını doğrulayın, sürüm duyurusu adımlarını çalıştırın, ardından kararlı sürümün tamamlandığını belirtmeden önce [Kararlı `main` tamamlama](#stable-main-closeout) işlemini bitirin.

## Kararlı `main` tamamlama

`main` gerçek yayımlanmış sürüm durumunu taşımadan kararlı yayım tamamlanmış sayılmaz.

1. En son değişikliklerle yenilenmiş `main` dalından başlayın. `release/YYYY.M.PATCH` dalını buna göre denetleyin ve `main` dalında bulunmayan gerçek düzeltmeleri ileri taşıyın. Yalnızca sürüme özgü uyumluluk, test veya doğrulama adaptörlerini daha yeni `main` dalına körü körüne birleştirmeyin.
2. `main` dalını varsayımsal bir sonraki sürüm dizisine değil, yayımlanmış kararlı sürüme ayarlayın. Kök sürüm değişikliğinden sonra `pnpm release:prep`, ardından `pnpm deps:shrinkwrap:generate` komutunu çalıştırın.
3. `main` üzerindeki `CHANGELOG.md` dosyasının `## YYYY.M.PATCH` bölümünü etiketlenmiş sürüm dalıyla tam olarak eşleştirin. macOS sürümü bir tane yayımladıysa kararlı `appcast.xml` güncellemesini de ekleyin.
4. Operatör bu sürüm dizisini açıkça başlatana kadar `main` dalına `YYYY.M.PATCH+1`, bir beta sürümü veya boş bir gelecek değişiklik günlüğü bölümü eklemeyin.
5. `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` ve `OPENCLAW_TESTBOX=1 pnpm check:changed` komutlarını çalıştırın. Gönderin, ardından kararlı sürümün tamamlandığını belirtmeden önce `origin/main` dalının yayımlanmış sürümü ve değişiklik günlüğünü içerdiğini doğrulayın.
6. Her özel geri alma tatbikatından sonra `RELEASE_ROLLBACK_DRILL_ID` ve `RELEASE_ROLLBACK_DRILL_DATE` depo değişkenlerini güncel tutun.

`OpenClaw Stable Main Closeout`, kararlı yayımdan sonra yayımlanmış sürümü, değişiklik günlüğünü ve appcast'i taşıyan `main` gönderiminden başlar. Yayımlanan etiketi Full Release Validation ve Publish çalışmalarıyla ilişkilendirmek için değişmez yayım sonrası kanıtı okur; ardından kararlı `main` durumunu, sürümü, zorunlu kararlı bekleme süresini ve engelleyici performans kanıtını doğrular. Değişmez bir tamamlama bildirimini ve sağlama toplamını GitHub sürümüne ekler. Otomatik gönderim tetikleyicisi, değişmez yayım sonrası kanıttan önceki eski sürümleri atlar ve bu atlamayı hiçbir zaman tamamlanmış bir tamamlama işlemi olarak değerlendirmez.

Eksiksiz bir tamamlama hem yapıtları hem de eşleşen bir sağlama toplamını gerektirir. Kısmi bir bildirim, aynı baytları yeniden oluşturmak için kayıtlı `main` SHA'sını ve geri alma tatbikatını yeniden oynatır, ardından eksik sağlama toplamını ekler; geçersiz bir çift veya bildirimi olmayan bir sağlama toplamı engelleyici olmaya devam eder. Geri alma tatbikatı depo değişkenleri olmadan gönderimle tetiklenen bir çalışma, tamamlamayı bitirmeden atlanır; eksik veya 90 günden eski bir tatbikat kaydı da kanıta dayalı manuel tamamlamayı engellemeye devam eder. Özel kurtarma komutları yalnızca bakımcıların erişebildiği operasyon kılavuzunda kalır. Manuel başlatmayı yalnızca kanıta dayalı kararlı bir tamamlamayı onarmak veya yeniden oynatmak için kullanın.

Eski bir yedek düzeltme etiketi, yalnızca düzeltme etiketi temel kararlı etiketle aynı kaynak commit'ine çözümleniyorsa temel paket kanıtını yeniden kullanabilir. Android sürümü, temel etiketin doğrulanmış APK'sını yeniden kullanır ve düzeltme etiketi için köken bilgisi ekler. Farklı kaynağa sahip bir düzeltme kendi paket kanıtını yayımlayıp doğrulamalı ve daha yüksek bir Android `versionCode` kullanmalıdır.

## Sürüm ön kontrolü

- Test TypeScript kapsamının daha hızlı yerel `pnpm check` kapısı dışında da korunması için sürüm ön kontrolünden önce `pnpm check:test-types` komutunu çalıştırın.
- Daha kapsamlı içe aktarma döngüsü ve mimari sınır denetimlerinin daha hızlı yerel kapının dışında da başarılı olması için sürüm ön kontrolünden önce `pnpm check:architecture` komutunu çalıştırın.
- Paket doğrulama adımı için beklenen `dist/*` sürüm yapıtlarının ve Control UI paketinin mevcut olması amacıyla `pnpm release:check` komutundan önce `pnpm build && pnpm ui:build` komutunu çalıştırın.
- Kök sürüm yükseltmesinden sonra ve etiketlemeden önce `pnpm release:prep` komutunu çalıştırın. Bu komut, sürüm/yapılandırma/API değişikliğinden sonra sıkça sapma gösteren tüm deterministik sürüm oluşturucularını çalıştırır: plugin sürümleri, npm shrinkwrap dosyaları, plugin envanteri, temel yapılandırma şeması, paketlenmiş kanal yapılandırma meta verileri, yapılandırma belgeleri temel çizgisi, plugin SDK dışa aktarımları ve plugin SDK API temel çizgisi. `pnpm release:check`, bu korumaları denetim modunda yeniden çalıştırır (ayrıca bir plugin SDK yüzey bütçesi denetimi yapar) ve paket sürüm denetimlerini çalıştırmadan önce oluşturulan tüm sapma hatalarını tek geçişte bildirir.
- Plugin sürüm eşitlemesi, yayımlanabilir `@openclaw/ai` çalışma zamanı paketini, resmî plugin paket sürümlerini ve mevcut `openclaw.compat.pluginApi` alt sınırlarını varsayılan olarak OpenClaw sürümüne günceller. Bu alanı yalnızca paket sürümünün bir kopyası olarak değil, plugin SDK/çalışma zamanı API alt sınırı olarak değerlendirin: eski OpenClaw ana makineleriyle kasıtlı olarak uyumlu kalacak yalnızca plugin sürümlerinde alt sınırı desteklenen en eski ana makine API'sinde tutun ve bu seçimi plugin sürüm kanıtında belgeleyin.
- Tüm sürüm öncesi test kutularını tek bir giriş noktasından başlatmak için sürüm onayından önce manuel `Full Release Validation` iş akışını çalıştırın. Bir dalı, etiketi veya tam commit SHA'sını kabul eder; manuel `CI` iş akışını ve kurulum smoke testi, paket kabulü, işletim sistemleri arası paket denetimleri, QA Lab eşdeğerliği, Matrix ve Telegram hatları için `OpenClaw Release Checks` iş akışını tetikler. Kararlı ve tam çalıştırmalar her zaman kapsamlı canlı/E2E testlerini ve Docker sürüm yolu dayanıklılık testini içerir; `run_release_soak=true`, açıkça talep edilen bir beta dayanıklılık testi için korunur. Package Acceptance, aday doğrulaması sırasında standart paket Telegram E2E testini sağlayarak eşzamanlı ikinci bir canlı yoklayıcıya gerek bırakmaz.

  Bir beta yayımlandıktan sonra, sürüm tarball'ını yeniden oluşturmadan yayımlanmış npm paketini sürüm denetimleri, Package Acceptance ve paket Telegram E2E genelinde yeniden kullanmak için `release_package_spec` sağlayın. Yalnızca Telegram'ın sürüm doğrulamasının geri kalanından farklı bir yayımlanmış paket kullanması gerektiğinde `npm_telegram_package_spec` sağlayın. Package Acceptance'ın sürüm paket belirtiminden farklı bir yayımlanmış paket kullanması gerektiğinde `package_acceptance_package_spec` sağlayın. Sürüm kanıtı raporunun Telegram E2E testini zorunlu kılmadan doğrulamanın yayımlanmış bir npm paketiyle eşleştiğini kanıtlaması gerektiğinde `evidence_package_spec` sağlayın.

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- Sürüm çalışmaları devam ederken bir paket adayı için yan kanal kanıtı istediğinizde manuel `Package Acceptance` iş akışını çalıştırın. `openclaw@beta`, `openclaw@latest` veya tam bir sürüm numarası için `source=npm`; geçerli `workflow_ref` test düzeneğiyle güvenilir bir `package_ref` dalını/etiketini/SHA'sını paketlemek için `source=ref`; zorunlu SHA-256 ve katı genel URL politikası olan herkese açık bir HTTPS tarball'ı için `source=url`; zorunlu `trusted_source_id` ve SHA-256 kullanan adlandırılmış bir güvenilir kaynak politikası için `source=trusted-url`; başka bir GitHub Actions çalıştırmasının yüklediği tarball için ise `source=artifact` kullanın.

  İş akışı adayı `package-under-test` olarak çözümler, Docker E2E sürüm zamanlayıcısını bu tarball ile yeniden kullanır ve `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile aynı tarball üzerinde Telegram QA çalıştırabilir. Seçilen Docker hatları `published-upgrade-survivor` içerdiğinde paket yapıtı adaydır ve `published_upgrade_survivor_baseline` yayımlanmış temel çizgiyi seçer. `update-restart-auth`, aday güncelleme komutunun yönetilen yeniden başlatma yolunu uygulaması için aday paketi hem kurulu CLI hem de test edilecek paket olarak kullanır.

  Örnek:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Yaygın profiller:
  - `smoke`: kurulum/kanal/ajan, Gateway ağı ve yapılandırmayı yeniden yükleme hatları
  - `package`: OpenWebUI veya canlı ClawHub olmadan, yapıta özgü paket/güncelleme/yeniden başlatma/plugin hatları
  - `product`: paket profiline ek olarak MCP kanalları, cron/alt ajan temizliği, OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI içeren Docker sürüm yolu parçaları
  - `custom`: odaklanmış bir yeniden çalıştırma için tam `docker_lanes` seçimi

- Sürüm adayı için yalnızca deterministik normal CI kapsamına ihtiyaç duyduğunuzda manuel `CI` iş akışını doğrudan çalıştırın. Manuel CI tetiklemeleri değişiklik kapsamlandırmasını atlar ve Linux Node parçalarını, paketlenmiş plugin parçalarını, plugin ve kanal sözleşmesi parçalarını, Node 22 uyumluluğunu, `check-*`, `check-additional-*`, oluşturulmuş yapıt smoke denetimlerini, belge denetimlerini, Python Skills testlerini, Windows, macOS ve Control UI i18n hatlarını zorunlu olarak çalıştırır. Bağımsız manuel CI çalıştırmaları Android'i yalnızca `include_android=true` ile tetiklendiğinde çalıştırır; `Full Release Validation`, alt CI iş akışına bu girdiyi iletir.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Sürüm telemetrisini doğrularken `pnpm qa:otel:smoke` komutunu çalıştırın. Bu komut QA-lab'i yerel bir OTLP/HTTP alıcısı üzerinden çalıştırır; Opik, Langfuse veya başka bir haricî toplayıcı gerektirmeden iz, metrik ve günlük dışa aktarımını, sınırlı iz özniteliklerini ve içerik/tanımlayıcı maskelemesini doğrular.
- Toplayıcı uyumluluğunu doğrularken `pnpm qa:otel:collector-smoke` komutunu çalıştırın. Bu komut, yerel alıcı doğrulamalarından önce aynı QA-lab OTLP dışa aktarımını gerçek bir OpenTelemetry Collector Docker konteyneri üzerinden yönlendirir.
- Korumalı Prometheus veri çekimini doğrularken `pnpm qa:prometheus:smoke` komutunu çalıştırın. Bu komut QA-lab'i çalıştırır, kimliği doğrulanmamış veri çekme isteklerini reddeder ve sürüm açısından kritik metrik ailelerinin istem içeriği, ham tanımlayıcılar, kimlik doğrulama token'ları ve yerel yollar içermediğini doğrular.
- Kaynak kod deposundaki OpenTelemetry ve Prometheus smoke hatlarını art arda çalıştırmak için `pnpm qa:observability:smoke` komutunu çalıştırın.
- Etiketlenen her sürümden önce `pnpm release:check` komutunu çalıştırın.
- `OpenClaw NPM Release` ön kontrolü, npm tarball'ını paketlemeden önce bağımlılık sürüm kanıtını oluşturur. npm danışma kaydı güvenlik açığı kapısı sürümü engeller. Geçişli manifest riski, bağımlılık sahipliği/kurulum yüzeyi ve bağımlılık değişiklik raporları yalnızca sürüm kanıtıdır. Bağımlılık değişiklik raporu, sürüm adayını erişilebilen önceki sürüm etiketiyle karşılaştırır. Ön kontrol, bağımlılık kanıtını `openclaw-release-dependency-evidence-<tag>` adıyla yükler ve ayrıca hazırlanmış npm ön kontrol yapıtının içindeki `dependency-evidence/` dizinine gömer. Gerçek yayımlama yolu bu ön kontrol yapıtını yeniden kullanır, ardından aynı kanıtı GitHub sürümüne `openclaw-<version>-dependency-evidence.zip` olarak ekler.
- Etiket oluşturulduktan sonra değişiklik yapan yayımlama sırası için `OpenClaw Release Publish` iş akışını çalıştırın. Normal beta ve kararlı sürümleri güvenilir `main` dalından yayımlayın; sürüm etiketi yine de tam hedef commit'i seçer ve `release/YYYY.M.PATCH` dalını işaret edebilir. Tideclaw alfa yayımları eşleşen alfa dallarında kalır. Başarılı OpenClaw npm `preflight_run_id`, başarılı `full_release_validation_run_id` ve tam `full_release_validation_run_attempt` değerlerini iletin; kasıtlı olarak odaklanmış bir onarım çalıştırmıyorsanız varsayılan plugin yayımlama kapsamını `all-publishable` olarak koruyun. İş akışı plugin npm yayımlamasını, plugin ClawHub yayımlamasını ve OpenClaw npm yayımlamasını sıralı hâle getirir; böylece çekirdek paket, dışsallaştırılmış plugin'lerinden önce yayımlanmaz. Windows ve Android yükseltmeleri ise taslak sürüm sayfasına karşı çekirdek npm yayımlamasıyla eşzamanlı çalışır. Yayımlama yeniden çalıştırmaları kaldığı yerden sürdürülebilir: iş akışı kayıt deposundaki tarball'ın etiketin ön kontrol yapıtıyla eşleştiğini kanıtladıktan sonra daha önce yayımlanmış bir çekirdek npm sürümü çekirdek tetiklemesini atlar; sürüm doğrulanmış yapıt sözleşmesini zaten içeriyorsa Windows/Android yükseltmesi de atlanır. Böylece yeniden deneme yalnızca başarısız aşamaları tekrarlar. Odaklanmış, yalnızca plugin onarımları `plugin_publish_scope=selected` ve boş olmayan bir plugin listesi gerektirir. Yalnızca plugin içeren `all-publishable` çalıştırmaları eksiksiz, değişmez ön kontrol ve Full Release Validation kanıtı gerektirir; kısmi kanıt reddedilir.
- Kararlı `OpenClaw Release Publish`, eşleşen ön sürüm olmayan `openclaw/openclaw-windows-node` sürümü mevcut olduktan sonra tam bir `windows_node_tag` ve aday için onaylanmış `windows_node_installer_digests` eşlemesi gerektirir. Herhangi bir yayımlama alt iş akışını tetiklemeden önce kaynak sürümün yayımlanmış ve ön sürüm olmadığını, gerekli x64/ARM64 kurucularını içerdiğini ve hâlâ onaylanan eşlemeyle uyuştuğunu doğrular. Ardından OpenClaw sürümü hâlâ taslak durumdayken sabitlenmiş kurucu özet eşlemesini değiştirmeden taşıyarak `Windows Node Release` iş akışını tetikler. Alt iş akışı imzalı Windows Hub kurucularını tam olarak bu etiketten indirir, sabitlenmiş özetlerle eşleştirir, Authenticode imzalarının bir Windows çalıştırıcısında beklenen OpenClaw Foundation imzalayıcısını kullandığını doğrular, bir SHA-256 manifesti yazar ve kurucularla manifesti standart OpenClaw GitHub sürümüne yükler; ardından yükseltilen yapıtları yeniden indirerek manifest üyeliğini ve karmaları doğrular. Üst iş akışı, yayımlamadan önce geçerli x64, ARM64 ve sağlama toplamı yapıt sözleşmesini doğrular. Doğrudan kurtarma, beklenen sözleşme yapıtlarını sabitlenmiş kaynak baytlarıyla değiştirmeden önce beklenmeyen `OpenClawCompanion-*` yapıt adlarını reddeder.

  `Windows Node Release` iş akışını yalnızca kurtarma için manuel olarak tetikleyin ve her zaman tam bir etiket ile onaylanmış kaynak sürümden alınan açık `expected_installer_digests` JSON eşlemesini iletin; asla `latest` kullanmayın. Web sitesi indirme bağlantıları, geçerli kararlı sürümün tam OpenClaw sürüm yapıtı URL'lerini hedeflemelidir. `releases/latest/download/...` yalnızca GitHub'ın en son sürüm yönlendirmesinin aynı sürümü işaret ettiği doğrulandıktan sonra kullanılmalıdır; yalnızca companion deposunun sürüm sayfasına bağlantı vermeyin.

- Sürüm kontrolleri artık ayrı bir manuel iş akışında çalışır: `OpenClaw Release Checks`. Ayrıca sürüm onayından önce QA Lab sahte eşlik hattını, hızlı canlı Matrix profilini ve Telegram QA hattını çalıştırır. Canlı hatlar `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralamalarını kullanır. Tam Matrix taşıma, medya ve E2EE envanterini paralel olarak çalıştırmak istediğinizde manuel `QA-Lab - All Lanes` iş akışını `matrix_profile=all` ve `matrix_shards=true` ile çalıştırın.
- İşletim sistemleri arası kurulum ve yükseltme çalışma zamanı doğrulaması, yeniden kullanılabilir `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` iş akışını doğrudan çağıran herkese açık `OpenClaw Release Checks` ve `Full Release Validation` süreçlerinin bir parçasıdır. Bu ayrım bilinçlidir: gerçek npm sürüm yolunu kısa, belirlenebilir ve yapı odaklı tutarken daha yavaş canlı kontroller kendi hatlarında kalır; böylece yayımlamayı geciktirmez veya engellemezler.
- Gizli bilgi içeren sürüm kontrolleri, iş akışı mantığının ve gizli bilgilerin denetim altında kalması için `Full Release Validation` üzerinden veya `main`/sürüm iş akışı referansından başlatılmalıdır.
- `OpenClaw Release Checks`, çözümlenen commit'e bir OpenClaw dalından veya sürüm etiketinden erişilebildiği sürece dal, etiket ya da tam commit SHA'sını kabul eder.
- Yalnızca doğrulama amaçlı `OpenClaw NPM Release` ön kontrolü, gönderilmiş bir etiket gerektirmeden mevcut tam 40 karakterlik iş akışı dalı commit SHA'sını da kabul eder. Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir yayımlamaya yükseltilemez. SHA modunda iş akışı, yalnızca paket meta verisi kontrolü için `v<package.json version>` oluşturur; gerçek yayımlama yine gerçek bir sürüm etiketi gerektirir.
- Her iki iş akışı da gerçek yayımlama ve yükseltme yolunu GitHub tarafından barındırılan çalıştırıcılarda tutarken değişiklik yapmayan doğrulama yolu daha büyük Blacksmith Linux çalıştırıcılarını kullanabilir.
- Bu iş akışı, hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı gizli bilgilerini kullanarak `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` komutunu çalıştırır.
- npm sürüm ön kontrolü artık ayrı sürüm kontrolleri hattını beklemez.
- Yerel olarak bir sürüm adayı etiketlemeden önce `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` komutunu çalıştırın. Yardımcı, GitHub yayımlama iş akışı başlamadan önce yaygın onay engelleyici hataları yakalayacak sırayla hızlı sürüm korumalarını, Plugin npm/ClawHub sürüm kontrollerini, derlemeyi, kullanıcı arayüzü derlemesini ve `release:openclaw:npm:check` komutunu çalıştırır.
- Onaydan önce `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` komutunu (veya eşleşen ön sürüm/düzeltme etiketini) çalıştırın.
- npm yayımlamasından sonra, yayımlanan kayıt defteri kurulum yolunu yeni bir geçici önekte doğrulamak için `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` komutunu (veya eşleşen beta/düzeltme sürümünü) çalıştırın.
- Bir beta yayımlamasından sonra, paylaşılan kiralık Telegram kimlik bilgisi havuzunu kullanarak kurulu paket ilk kurulumunu, Telegram kurulumunu ve yayımlanan npm paketine karşı gerçek Telegram E2E sürecini doğrulamak için `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` komutunu çalıştırın. Yerel bakım sorumlularının tek seferlik çalıştırmaları Convex değişkenlerini atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` ortam kimlik bilgisini doğrudan iletebilir.
- Tam yayımlama sonrası beta hızlı kontrolünü bir bakım sorumlusu makinesinden çalıştırmak için `pnpm release:beta-smoke -- --beta betaN` komutunu kullanın. Yardımcı; Parallels npm güncelleme/yeni hedef doğrulamasını çalıştırır, `NPM Telegram Beta E2E` sürecini başlatır, tam iş akışı çalışmasını sorgular, yapıyı indirir ve Telegram raporunu yazdırır.
- Bakım sorumluları aynı yayımlama sonrası kontrolü manuel `NPM Telegram Beta E2E` iş akışı aracılığıyla GitHub Actions üzerinden çalıştırabilir. Bu iş akışı bilinçli olarak yalnızca manueldir ve her birleştirmede çalışmaz.
- Bakım sorumlusu sürüm otomasyonu, ön kontrol-sonra-yükselt yaklaşımını kullanır:
  - Gerçek npm yayımlaması, başarılı bir npm `preflight_run_id` değerinden geçmelidir.
  - Düzenli beta ve kararlı yayımlama düzenlemesi ile ön kontrol, tam hedef etikete karşı güvenilir `main` dalını kullanır. Tideclaw alfa yayımlaması ve ön kontrolü, eşleşen alfa dalını kullanır.
  - Kararlı npm sürümleri varsayılan olarak `beta` etiketini kullanır; kararlı npm yayımlaması iş akışı girdisi aracılığıyla açıkça `latest` etiketini hedefleyebilir.
  - Belirteç tabanlı npm dağıtım etiketi değişikliği `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` içinde bulunur; çünkü kaynak depo yalnızca OIDC yayımlamasını korurken `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirir.
  - Herkese açık `macOS Release` yalnızca doğrulama içindir; bir etiket yalnızca bir sürüm dalında bulunuyorsa ancak iş akışı `main` üzerinden başlatılıyorsa `public_release_branch=release/YYYY.M.PATCH` değerini ayarlayın.
  - Gerçek macOS yayımlaması başarılı macOS `preflight_run_id` ve `validate_run_id` değerlerinden geçmelidir.
  - Gerçek yayımlama yolları, hazırlanmış yapıları yeniden derlemek yerine yükseltir.
- `YYYY.M.PATCH-N` gibi kararlı düzeltme sürümlerinde yayımlama sonrası doğrulayıcı, aynı geçici önek yükseltme yolunu `YYYY.M.PATCH` sürümünden `YYYY.M.PATCH-N` sürümüne kadar da kontrol eder; böylece sürüm düzeltmeleri eski genel kurulumları sessizce temel kararlı yükte bırakamaz.
- npm sürüm ön kontrolü, tarball hem `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` yükü içermediği sürece güvenli biçimde başarısız olur; böylece boş bir tarayıcı panosunu tekrar yayımlamayız.
- Yayımlama sonrası doğrulama, yayımlanan Plugin giriş noktalarının ve paket meta verilerinin kurulu kayıt defteri düzeninde bulunduğunu da kontrol eder. Eksik Plugin çalışma zamanı yükleri içeren bir sürüm, yayımlama sonrası doğrulayıcıda başarısız olur ve `latest` etiketine yükseltilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball'ında npm paketinin `unpackedSize` bütçesini de zorunlu kılar; böylece kurucu E2E, sürüm yayımlama yolundan önce kazara oluşan paket şişmesini yakalar.
- Sürüm çalışması CI planlamasına, eklenti zamanlama manifestlerine veya eklenti test matrislerine dokunduysa onaydan önce `.github/workflows/plugin-prerelease.yml` dosyasındaki planlayıcının sahip olduğu `plugin-prerelease-extension-shard` matris çıktılarını yeniden oluşturup inceleyin; böylece sürüm notları eski bir CI düzenini açıklamaz.
- Kararlı macOS sürüm hazırlığı, güncelleyici yüzeylerini de içerir: GitHub sürümü paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` dosyalarıyla tamamlanmalıdır; `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni kararlı zip dosyasını göstermelidir (macOS yayımlama iş akışı bunu otomatik olarak commit eder veya doğrudan gönderim engellenmişse bir appcast PR'ı açar); paketlenmiş uygulama hata ayıklama amaçlı olmayan bir paket kimliğini, boş olmayan bir Sparkle besleme URL'sini ve ilgili sürümün standart Sparkle derleme tabanına eşit veya ondan yüksek bir `CFBundleVersion` değerini korumalıdır.

## Sürüm test kutuları

`Full Release Validation`, operatörlerin tüm sürüm öncesi testleri tek bir giriş noktasından başlatma yöntemidir. Hızla ilerleyen bir dalda sabitlenmiş commit kanıtı için yardımcıyı kullanın; böylece istenen commit test edilen aday olarak kalırken her alt iş akışı, tek bir güvenilir `main` iş akışı SHA'sında sabitlenmiş geçici bir daldan çalışır:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı, güncel `origin/main` dalını getirir, güvenilir iş akışı commit'indeki `release-ci/<workflow-sha>-...` dalını gönderir, geçici daldan `ref=<target-sha>` ile `Full Release Validation` sürecini başlatır, varsa kesin tam hedef kanıtını yeniden kullanır, her alt iş akışının `headSha` değerinin sabitlenmiş üst iş akışı SHA'sıyla eşleştiğini doğrular ve ardından geçici dalı siler. Yeni bir çalıştırmayı zorlamak için `-f reuse_evidence=false`, güncel `origin/main` üzerinden hâlâ erişilebilen daha eski bir commit'i sabitlemek içinse `--workflow-sha <trusted-main-sha>` iletin. İş akışının kendisi hiçbir zaman depo referanslarına yazmaz. Bu yaklaşım, adaya araç commit'leri eklemeden yalnızca main üzerinde bulunan sürüm araçlarını kullanılabilir tutar ve yanlışlıkla daha yeni bir `main` alt çalışmasını kanıtlamayı önler.

Sürüm dalı veya etiketi doğrulaması için bunu güvenilir `main` iş akışı referansından çalıştırın ve sürüm dalını ya da etiketini `ref` olarak iletin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

İş akışı hedef referansı çözümler, `target_ref=<release-ref>` ile manuel `CI` sürecini başlatır, ardından `OpenClaw Release Checks` sürecini başlatır. `OpenClaw Release Checks`; kurulum hızlı kontrolünü, işletim sistemleri arası sürüm kontrollerini, bekletme etkinleştirildiğinde canlı/E2E Docker sürüm yolu kapsamını, standart Telegram paket E2E sürecini içeren Paket Kabulünü, QA Lab eşliğini, canlı Matrix'i ve canlı Telegram'ı dağıtarak çalıştırır. Odaklı bir yeniden çalıştırma ayrı `Plugin Prerelease` alt sürecini bilinçli olarak atlamadığı sürece, tam/tümü çalıştırması yalnızca `Full Release Validation` özetinde `normal_ci`, `plugin_prerelease` ve `release_checks` başarılı olarak gösterildiğinde kabul edilebilir. Bağımsız `npm-telegram` alt sürecini yalnızca `release_package_spec` veya `npm_telegram_package_spec` ile yayımlanmış pakete yönelik odaklı bir yeniden çalıştırma için kullanın. Son doğrulayıcı özeti, her alt çalıştırma için en yavaş iş tablolarını içerir; böylece sürüm yöneticisi günlükleri indirmeden güncel kritik yolu görebilir.

Ürün performansı alt süreci bu sürüm yolunda yalnızca yapı üretir. Üst iş akışı
bu süreci `publish_reports=false` ile başlatır ve yalnızca yapı koruması Clawgrit
rapor yayımlayıcısının atlanmış kaldığını kanıtlamadıkça doğrulama reddedilir.

Eksiksiz aşama matrisi, tam iş akışı iş adları, kararlı ve tam profil farklılıkları, yapılar ve odaklı yeniden çalıştırma tanıtıcıları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) sayfasına bakın.

Alt iş akışları, hedef `ref` daha eski bir sürüm dalını veya etiketini gösterse bile normalde `--ref main` olan ve `Full Release Validation` sürecini çalıştıran güvenilir referanstan başlatılır. Her alt çalıştırma tam üst iş akışı SHA'sını kullanmalıdır; bir alt sürecin başlatılması çözümlenmeden önce `main` ilerlerse üst iş akışı güvenli biçimde başarısız olur. Ayrı bir Full Release Validation iş akışı referansı girdisi yoktur; güvenilir test düzeneğini iş akışı çalıştırma referansını seçerek belirleyin. Hareketli `main` üzerinde tam commit kanıtı için `--ref main -f ref=<sha>` kullanmayın; ham commit SHA'ları iş akışı başlatma referansı olamaz. Bunun yerine hedef SHA'yı aday girdisi olarak korurken güvenilir `origin/main` üzerinde geçici bir dal oluşturmak için `pnpm ci:full-release --sha <target-sha>` komutunu kullanın.

Canlı/sağlayıcı kapsamını seçmek için `release_profile` kullanın:

- `minimum`: sürüm açısından kritik en hızlı OpenAI/çekirdek canlı ve Docker yolu
- `stable`: sürüm onayı için minimum kapsamın yanı sıra kararlı sağlayıcı/arka uç kapsamı
- `full`: kararlı kapsamın yanı sıra geniş tavsiye niteliğinde sağlayıcı/medya kapsamı

Kararlı ve tam doğrulama, yükseltmeden önce her zaman kapsamlı canlı/E2E ve Docker sürüm yolu taramasını ve sınırlı yayımlanmış yükseltme dayanıklılığı taramasını çalıştırır. Aynı taramayı bir beta için istemek üzere `run_release_soak=true` kullanın. Bu tarama; en son dört kararlı paketin yanı sıra sabitlenmiş `2026.4.23` ve `2026.5.2` tabanlarını ve daha eski `2026.4.15` kapsamını içerir; yinelenen tabanlar kaldırılır ve her taban kendi Docker çalıştırıcı işine bölünür.

`OpenClaw Release Checks`, hedef referansı bir kez `release-package-under-test` olarak çözümlemek için güvenilir iş akışı referansını kullanır ve bekletme çalıştığında bu yapıyı işletim sistemleri arası kontrollerde, Paket Kabulünde ve sürüm yolu Docker kontrollerinde yeniden kullanır. Bu, paketle ilgili tüm kutuların aynı baytları kullanmasını sağlar ve tekrarlanan paket derlemelerini önler. Bir beta npm üzerinde zaten bulunuyorsa sürüm kontrollerinin gönderilmiş paketi bir kez indirmesi, `dist/build-info.json` dosyasından derleme kaynağı SHA'sını çıkarması ve bu yapıyı işletim sistemleri arası kontroller, Paket Kabulü, sürüm yolu Docker ve paket Telegram hatlarında yeniden kullanması için `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` değerini ayarlayın.

İşletim sistemleri arası OpenAI kurulum hızlı kontrolü, depo/kuruluş değişkeni ayarlanmışsa `OPENCLAW_CROSS_OS_OPENAI_MODEL` değerini, aksi takdirde `openai/gpt-5.6-luna` modelini kullanır; çünkü bu hat en yetenekli modeli karşılaştırmak yerine paket kurulumunu, ilk kurulumu, Gateway başlatmayı ve bir canlı ajan turunu kanıtlar. Daha geniş canlı sağlayıcı matrisi, modele özgü kapsamın yeri olmaya devam eder.

Sürüm aşamasına bağlı olarak şu varyantları kullanın:

```bash
# Yayımlanmamış bir sürüm adayı dalını doğrulayın.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Gönderilmiş belirli bir commit'i doğrulayın.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# Bir beta yayımladıktan sonra, yayımlanmış paket için Telegram E2E'yi ekleyin.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Odaklı bir düzeltmeden sonraki ilk yeniden çalıştırmada tam şemsiye iş akışını kullanmayın. Bir kutu başarısız olursa bir sonraki kanıt için başarısız olan alt iş akışını, işi, Docker hattını, paket profilini, model sağlayıcısını veya QA hattını kullanın. Tam şemsiye iş akışını yalnızca düzeltme paylaşılan sürüm düzenlemesini değiştirdiyse veya önceki tüm kutulara ait kanıtları geçersiz kıldıysa yeniden çalıştırın. Şemsiyenin son doğrulayıcısı kaydedilmiş alt iş akışı çalıştırma kimliklerini yeniden denetler; bu nedenle bir alt iş akışı başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız `Verify full validation` üst işini yeniden çalıştırın.

`rerun_group=all`, önceki başarılı bir şemsiye çalıştırmasını yalnızca tam olarak aynı hedef SHA'yı, sürüm profilini, etkin uzun süreli test ayarını ve doğrulama girdilerini doğruladıysa yeniden kullanabilir. Bu, aynı adayı yeniden çalıştırmaya yönelik sınırlı bir kurtarma mekanizmasıdır; SHA'lar arasında kanıt yeniden kullanımı değildir. Değişiklik günlüğü veya yalnızca sürüm değişikliği içeren bir commit dahil olmak üzere değiştirilmiş bir aday için değişen yolların ya da yapıt karmalarının etkilediği tüm paket, yapıt, kurulum, Docker veya sağlayıcı geçitlerini yeniden çalıştırın. Aynı `release/*` referansı ve yeniden çalıştırma grubu için daha yeni şemsiye çalıştırmaları, sürmekte olanların yerini otomatik olarak alır. Tamamen yeni bir çalıştırmayı zorlamak için `reuse_evidence=false` geçirin.

Sınırlı kurtarma için şemsiyeye `rerun_group` geçirin. `all` gerçek sürüm adayı çalıştırmasıdır; `ci` yalnızca normal CI alt iş akışını, `plugin-prerelease` yalnızca sürüme özel Plugin alt iş akışını, `release-checks` tüm sürüm kutularını çalıştırır; daha dar sürüm grupları ise `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram` şeklindedir. Odaklı `npm-telegram` yeniden çalıştırmaları `release_package_spec` veya `npm_telegram_package_spec` gerektirir; full/all çalıştırmaları Package Acceptance içindeki standart paket Telegram E2E'sini kullanır. Odaklı işletim sistemleri arası yeniden çalıştırmalara `cross_os_suite_filter=windows/packaged-upgrade` veya başka bir işletim sistemi/paket filtresi eklenebilir. QA sürüm denetimi hataları, standart katmandaki zorunlu OpenClaw dinamik araç sapması dahil olmak üzere normal sürüm doğrulamasını engeller. Tideclaw alfa çalıştırmaları, paket güvenliğiyle ilgili olmayan sürüm denetimi hatlarını yine de uyarı niteliğinde değerlendirebilir. `release_profile=beta` ile `Run repo/live E2E validation` canlı sağlayıcı paketleri uyarı niteliğindedir (uyarı verir, engellemez); stable ve full profilleri bunları engelleyici olarak tutar. `live_suite_filter`, Discord, WhatsApp veya Slack gibi geçitli bir QA canlı hattını açıkça talep ettiğinde eşleşen `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` depo değişkeni etkinleştirilmiş olmalıdır; aksi hâlde girdi yakalama, hattı sessizce atlamak yerine başarısız olur.

### Vitest

Vitest kutusu, manuel `CI` alt iş akışıdır. Manuel CI, değişiklik kapsamını kasıtlı olarak atlar ve sürüm adayı için normal test grafiğini zorunlu kılar: Linux Node parçaları, paketlenmiş Plugin parçaları, Plugin ve kanal sözleşmesi parçaları, Node 22 uyumluluğu, `check-*`, `check-additional-*`, derlenmiş yapıt duman denetimleri, dokümantasyon denetimleri, Python Skills, Windows, macOS ve Control UI i18n. `Full Release Validation` kutuyu çalıştırdığında şemsiye `include_android=true` geçirdiği için Android dahil edilir; bağımsız manuel CI, Android kapsamı için `include_android=true` gerektirir.

Bu kutuyu "kaynak ağacı tam normal test paketini geçti mi?" sorusunu yanıtlamak için kullanın. Bu, sürüm yolu ürün doğrulamasıyla aynı şey değildir. Saklanacak kanıtlar:

- Gönderilen `CI` çalıştırmasının URL'sini gösteren `Full Release Validation` özeti
- Tam hedef SHA üzerinde başarılı `CI` çalıştırması
- Regresyonlar araştırılırken CI işlerindeki başarısız veya yavaş parça adları
- Bir çalıştırma performans analizi gerektirdiğinde `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama yapıtları

Manuel CI'yi doğrudan yalnızca sürümün deterministik normal CI gerektirdiği ancak Docker, QA Lab, canlı, işletim sistemleri arası veya paket kutularını gerektirmediği durumlarda çalıştırın. Android içermeyen doğrudan CI için ilk komutu kullanın. Doğrudan sürüm adayı CI'nin Android'i kapsaması gerektiğinde `include_android=true` ekleyin:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker kutusu, `openclaw-live-and-e2e-checks-reusable.yml` aracılığıyla `OpenClaw Release Checks` içinde ve ayrıca sürüm modundaki `install-smoke` iş akışında bulunur. Sürüm adayını yalnızca kaynak düzeyindeki testlerle değil, paketlenmiş Docker ortamları üzerinden doğrular.

Sürüm Docker kapsamına şunlar dahildir:

- yavaş Bun genel kurulum duman denetimi etkinleştirilmiş tam kurulum duman denetimi
- QR, root/gateway ve yükleyici/Bun duman işleri ayrı install-smoke parçaları olarak çalışırken hedef SHA'ya göre kök Dockerfile duman imajının hazırlanması/yeniden kullanılması
- depo E2E hatları
- sürüm yolu Docker parçaları: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` ile `plugins-runtime-install-h` arası ve `openwebui`
- istendiğinde büyük diskli özel bir çalıştırıcıda OpenWebUI kapsamı
- `bundled-plugin-install-uninstall-0` ile `bundled-plugin-install-uninstall-23` arası bölünmüş paketlenmiş Plugin kurma/kaldırma hatları
- sürüm denetimleri canlı paketleri içerdiğinde canlı/E2E sağlayıcı paketleri ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker yapıtlarını kullanın. Sürüm yolu zamanlayıcısı, hat günlükleri, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı planı JSON'u ve yeniden çalıştırma komutlarıyla birlikte `.artifacts/docker-tests/` dizinini yükler. Odaklı kurtarma için tüm sürüm parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir canlı/E2E iş akışında `docker_lanes=<lane[,lane]>` kullanın. Oluşturulan yeniden çalıştırma komutları, kullanılabildiğinde önceki `package_artifact_run_id` değerini ve hazırlanmış Docker imajı girdilerini içerir; böylece başarısız bir hat aynı tarball'ı ve GHCR imajlarını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` kapsamındadır. Vitest ve Docker paket mekaniklerinden ayrı olan, eyleyici davranış ve kanal düzeyindeki sürüm geçididir.

Sürüm QA Lab kapsamına şunlar dahildir:

- eyleyici eşlik paketi kullanılarak OpenAI aday hattını `anthropic/claude-opus-4-8` temel çizgisiyle karşılaştıran sahte eşlik hattı
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI kimlik bilgisi kiralamalarını kullanan canlı Telegram QA hattı
- sürüm telemetrisinin açık yerel kanıta ihtiyaç duyduğu durumlarda `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` veya `pnpm qa:observability:smoke`

Bu kutuyu "sürüm, QA senaryolarında ve canlı kanal akışlarında doğru davranıyor mu?" sorusunu yanıtlamak için kullanın. Sürümü onaylarken eşlik, Matrix ve Telegram hatlarının yapıt URL'lerini saklayın. Tam Matrix kapsamı, varsayılan sürüm açısından kritik hat yerine manuel parçalanmış bir QA-Lab çalıştırması olarak kullanılmaya devam eder.

### Paket

Paket kutusu, kurulabilir ürün geçididir. `Package Acceptance` ve `scripts/resolve-openclaw-package-candidate.mjs` çözümleyicisi tarafından desteklenir. Çözümleyici, bir adayı Docker E2E tarafından tüketilen `package-under-test` tarball'ına normalleştirir, paket envanterini doğrular, paket sürümünü ve SHA-256 değerini kaydeder ve iş akışı test düzeneği referansını paket kaynak referansından ayrı tutar.

Desteklenen aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya tam bir OpenClaw sürümü
- `source=ref`: seçilen `workflow_ref` test düzeneğiyle güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketleyin
- `source=url`: zorunlu `package_sha256` ile herkese açık bir HTTPS `.tgz` indirin; URL kimlik bilgileri, varsayılan olmayan HTTPS portları, özel/dahili/özel kullanımlı ana bilgisayar adları veya çözümlenmiş adresler ve güvenli olmayan yönlendirmeler reddedilir
- `source=trusted-url`: `.github/package-trusted-sources.json` içindeki adlandırılmış bir politikadan zorunlu `package_sha256` ve `trusted_source_id` ile bir HTTPS `.tgz` indirin; `source=url` için girdi düzeyinde özel ağ atlaması eklemek yerine bakımcıların sahip olduğu kurumsal yansılar veya özel paket depoları için bunu kullanın
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen bir `.tgz` dosyasını yeniden kullanın

`OpenClaw Release Checks`, hazırlanmış sürüm paketi yapıtı, `source=artifact`, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai` ile Package Acceptance'ı çalıştırır. Package Acceptance; geçişi, güncellemeyi, root tarafından yönetilen VPS yükseltmesini, yapılandırılmış kimlik doğrulamalı güncelleme yeniden başlatmasını, canlı ClawHub Skills kurulumunu, eski Plugin bağımlılıklarının temizlenmesini, çevrimdışı Plugin fikstürlerini, Plugin güncellemesini, Plugin komut bağlama kaçışını sağlamlaştırmayı ve aynı çözümlenmiş tarball'a karşı Telegram paket QA'sını korur. Engelleyici sürüm denetimleri varsayılan olarak yayımlanmış en son paket temel çizgisini kullanır; `run_release_soak=true`, `release_profile=stable` veya `release_profile=full` değerine sahip beta profili, yayımlanmış yükseltmeden sağ çıkma taramasını `reported-issues` senaryolarıyla birlikte `last-stable-4` ve sabitlenmiş `2026.4.23`, `2026.5.2` ve `2026.4.15` temel çizgilerine genişletir. Package Acceptance'ı yayımlanmış bir aday için `source=npm`, yayımlamadan önce SHA destekli yerel npm tarball'ı için `source=ref`, bakımcının sahip olduğu kurumsal/özel bir yansı için `source=trusted-url` veya başka bir GitHub Actions çalıştırması tarafından yüklenmiş hazırlanmış bir tarball için `source=artifact` ile kullanın.

Bu, daha önce Parallels gerektiren paket/güncelleme kapsamının çoğunun GitHub'a özgü karşılığıdır. İşletim sistemleri arası sürüm denetimleri, işletim sistemine özgü ilk katılım, yükleyici ve platform davranışı için hâlâ önemlidir; ancak paket/güncelleme ürün doğrulaması Package Acceptance'ı tercih etmelidir.

Güncelleme ve Plugin doğrulamasına yönelik standart denetim listesi [Güncellemeleri ve Pluginleri test etme](/tr/help/testing-updates-plugins) sayfasındadır. Bir Plugin kurulumu/güncellemesi, doctor temizliği veya yayımlanmış paket geçişi değişikliğini hangi yerel, Docker, Package Acceptance ya da sürüm denetimi hattının kanıtladığına karar verirken bunu kullanın. Her kararlı `2026.4.23+` paketinden kapsamlı yayımlanmış güncelleme geçişi, Full Release CI'nin parçası değil, ayrı bir manuel `Update Migration` iş akışıdır.

Eski paket kabul esnekliği kasıtlı olarak zamanla sınırlandırılmıştır. `2026.4.25` dahil olmak üzere bu sürüme kadarki paketler, npm'de zaten yayımlanmış meta veri eksikleri için uyumluluk yolunu kullanabilir: tarball'da bulunmayan özel QA envanter girişleri, eksik `gateway install --wrapper`, tarball'dan türetilen git fikstüründeki eksik yama dosyaları, kalıcı hâle getirilmemiş `update.channel`, eski Plugin kurulum kaydı konumları, eksik pazar yeri kurulum kaydı kalıcılığı ve `plugins update` sırasında yapılandırma meta verisi geçişi. Yayımlanmış `2026.4.26` paketi, daha önce yayımlanmış yerel derleme meta verisi damga dosyaları için uyarı verebilir. Sonraki paketler modern paket sözleşmelerini karşılamalıdır; aynı eksikler sürüm doğrulamasını başarısız kılar.

Sürümle ilgili soru gerçek bir kurulabilir paket hakkındaysa daha geniş Package Acceptance profilleri kullanın:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Yaygın paket profilleri:

- `smoke`: hızlı paket kurulumu/kanal/ajan, Gateway ağı ve yapılandırmayı yeniden yükleme hatları
- `package`: kurulum/güncelleme/yeniden başlatma/Plugin paket sözleşmelerinin yanı sıra canlı ClawHub Skills kurulum kanıtı; sürüm denetiminde varsayılan budur
- `product`: `package` kapsamına ek olarak MCP kanalları, cron/alt ajan temizliği, OpenAI web araması ve OpenWebUI
- `full`: OpenWebUI içeren Docker sürüm yolu parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket adayı Telegram kanıtı için Package Acceptance üzerinde `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` seçeneğini etkinleştirin. İş akışı, çözümlenen `package-under-test` tarball dosyasını Telegram hattına geçirir; bağımsız Telegram iş akışı, yayımlama sonrası denetimler için yayımlanmış bir npm belirtimini kabul etmeye devam eder.

## Düzenli sürüm yayımlama otomasyonu

Beta, `latest`, Plugin, GitHub Release ve platform yayımlaması için
`OpenClaw Release Publish`, değişiklik yapan normal giriş noktasıdır. Aylık
yalnızca npm kullanan `.33+` genişletilmiş kararlı sürüm yolu bu orkestratörü kullanmaz. Düzenli
iş akışı, güvenilir yayımcı iş akışlarını sürümün gerektirdiği sırayla
orkestre eder:

1. Sürüm etiketini kullanıma alın ve commit SHA'sını çözümleyin.
2. Etikete `main` veya `release/*` üzerinden (ya da alfa ön sürümleri için bir Tideclaw alfa dalından) erişilebildiğini doğrulayın.
3. `pnpm plugins:sync:check` komutunu çalıştırın.
4. `Plugin NPM Release` iş akışını `publish_scope=all-publishable` ve `ref=<release-sha>` ile tetikleyin.
5. `Plugin ClawHub Release` iş akışını aynı kapsam ve SHA ile tetikleyin.
6. Kaydedilmiş `full_release_validation_run_id` ve tam çalışma denemesi doğrulandıktan sonra `OpenClaw NPM Release` iş akışını sürüm etiketi, npm dist etiketi ve kaydedilmiş `preflight_run_id` ile tetikleyin.
7. Kararlı sürümlerde GitHub sürümünü taslak olarak oluşturun veya güncelleyin, `Windows Node Release` iş akışını açıkça belirtilen `windows_node_tag` ve aday için onaylanmış `windows_node_installer_digests` ile tetikleyin ve standart Windows yükleyici/sağlama toplamı varlıklarını doğrulayın. Ayrıca tam etikete ait imzalı APK'yı, sağlama toplamını ve köken bilgisini derlemek için `Android Release` iş akışını tetikleyin. Taslağı yayımlamadan önce her iki yerel varlık sözleşmesini de doğrulayın.

Beta yayımlama örneği:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Varsayılan beta dist etiketine kararlı sürüm yayımlama:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Kararlı sürümü doğrudan `latest` etiketine yükseltmek açıkça belirtilmelidir:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=latest
```

Alt düzey `Plugin NPM Release` ve `Plugin ClawHub Release` iş akışlarını yalnızca odaklı onarım veya yeniden yayımlama çalışmaları için kullanın. `OpenClaw Release Publish`, `publish_openclaw_npm=true` olduğunda `plugin_publish_scope=selected` değerini reddeder; böylece çekirdek paket, `@openclaw/diffs-language-pack` dâhil yayımlanabilir tüm resmî Plugin paketleri olmadan gönderilemez. Seçili bir Plugin onarımı için `publish_openclaw_npm=false`, `plugin_publish_scope=selected` ve `plugins=@openclaw/name` değerlerini ayarlayın veya alt iş akışını doğrudan tetikleyin.

İlk yayımlama için ClawHub önyüklemesi istisnadır: güvenilir `main` üzerinden `Plugin ClawHub New`
iş akışını tetikleyin ve tam hedef sürüm SHA'sını `ref` aracılığıyla geçirin.
Önyükleme iş akışının kendisini hiçbir zaman sürüm etiketinden veya dalından çalıştırmayın:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

Etiket öncesi doğrulama `dry_run=true` gerektirir, sürüm etiketi ve üst çalışma
girdilerini reddeder ve yalnızca `main` veya `release/*` üzerinden erişilebilen tam bir hedefi
kabul eder. ClawHub kimlik bilgilerini yüklemez, paket baytlarını yayımlamaz veya güvenilir
yayımcı yapılandırmasını değiştirmez. İş akışı yine de canlı kayıt defteri planını çözümler,
hedefi yalnızca gizli bilgi içermeyen bir işte kullanıma alıp paketler, kilitlenmiş ClawHub
araç zincirini oluşturur ve sürüm etiketi var olmadan önce değişmez yapıtı ve paket
kısa adını/kimliğini doğrular. `clawhub-plugin-bootstrap` ortamını yalnızca gizli bilgi içermeyen paketleme işleri
tamamlandıktan sonra onaylayın; bu korumalı doğrulama işinde kimlik bilgisi veya değişiklik komutu bulunmaz.

Onaylanmış bir deneme çalıştırması veya etiketleme sonrasındaki gerçek önyükleme; tam
sürüm etiketinin yanı sıra üst `OpenClaw Release Publish` çalışma kimliğini, denemesini ve
dalını içermelidir. Üst iş akışı kendi iş akışı SHA'sını ve `Plugin ClawHub New` için
ayrı bir tam güvenilir `main` SHA'sını tasdik eder; alt çalışma ve her korumalı
ortam onayı bu onaylanmış alt SHA ile eşleşmelidir. Sürüm etiketi,
her yayımlama denemesi ve güvenilir yayımcı değişikliği öncesinde yeniden denetlenir.

Paketleme işi,
adı, Actions yapıt kimliği/özeti,
üretici çalışma/denemesi, hedef SHA'sı ve paket başına tarball SHA-256/boyutu
doğrulama ve korumalı işlere aktarılan tek bir değişmez yapıt
yükler. Korumalı iş yalnızca güvenilir `main`
araçlarını kullanıma alır, GitHub API aracılığıyla yapıt demetini doğrular, tam yapıt kimliğine
göre indirir, her tarball dosyasını yeniden özetler ve sabitlenmiş CLI'ın USTAR standartlaştırma kurallarıyla yerel TAR yollarını ve
paket kimliğini doğrular. Ardından her
aday, kayıt defteri araması veya kimlik doğrulamadan önce dönen sabitlenmiş CLI yayımlama deneme çalıştırmasından geçer.
Kimlik bilgisi işi ön filtresi, sıkıştırılmış ClawPack boyutunu
120 MiB, toplam dosya yükünü 50 MiB, genişletilmiş TAR verisini 64 MiB ve
TAR girdi sayısını 10.000 ile sınırlar. Mevcut paket için güvenilir yayımcı onarımı
yalnızca yapılandırma amaçlı olmaya devam eder, ancak yine de hedefi paketler ve güvenilir yayımcı
yapılandırmasını değiştirmeden önce istenen etiketin yanı sıra kayıt defteri baytlarının ve meta verilerinin tam olarak eşleşmesini
gerektirir. Yayımlama sonrası doğrulama, ClawHub yapıtını indirir ve
aynı SHA-256 ile boyutu gerektirir. Başarısız işleri yeniden çalıştırma yoluyla kurtarma, önceki
bir denemenin paket yapıtını yalnızca üretici iş tam olarak
başarıyla tamamlandıysa yeniden kullanabilir. Nihai kanıt ayrıca kilitlenmiş ClawHub sürümünü, kilit
SHA-256 değerini ve npm bütünlüğünü bağlar. Bir uyuşmazlık, yeni bir paket sürümü gerektirir.

## NPM iş akışı girdileri

`OpenClaw NPM Release`, operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` veya `v2026.4.2-alpha.1` gibi gerekli sürüm etiketi; `preflight_only=true` olduğunda yalnızca doğrulama amaçlı ön denetim için geçerli tam 40 karakterlik iş akışı dalı commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paketleme için `true`, gerçek yayımlama yolu için `false`
- `preflight_run_id`: mevcut başarılı ön denetim çalışma kimliği; iş akışının yeniden derlemek yerine hazırlanmış tarball dosyasını yeniden kullanması için gerçek yayımlama yolunda gereklidir
- `full_release_validation_run_id`: bu etiket/SHA için başarılı `Full Release Validation` çalışma kimliği; gerçek yayımlama için gereklidir. Beta yayımlamaları bir uyarıyla yalnızca ön denetime dayanarak ilerleyebilir, ancak kararlı/`latest` yükseltmesi yine de bunu gerektirir.
- `full_release_validation_run_attempt`: `full_release_validation_run_id` ile eşleştirilmiş tam pozitif çalışma denemesi; yeniden çalıştırmaların yayımlama sırasında yetkilendirme kanıtını değiştirememesi için çalışma kimliği sağlandığında gereklidir.
- `release_publish_run_id`: onaylanmış `OpenClaw Release Publish` çalışma kimliği; bu iş akışı söz konusu üst iş akışı tarafından tetiklendiğinde gereklidir (bot aktörünün gerçek yayımlama çağrıları)
- `plugin_npm_run_id`: başarılı, tam uç `Plugin NPM Release` çalışma kimliği; gerçek bir `extended-stable` çekirdek yayımlaması için gereklidir
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; `alpha`, `beta`, `latest` veya `extended-stable` kabul eder ve varsayılanı `beta` değeridir. Son yama `33` ve üzeri, `extended-stable` kullanmalıdır; varsayılan olarak `extended-stable` daha önceki yamaları reddeder ve nihai olmayan etiketleri her zaman reddeder.
- `bypass_extended_stable_guard`: yalnızca test amaçlı boole değeri, varsayılan `false`; `npm_dist_tag=extended-stable` ile sürüm kimliği, yapıt, onay ve geri okuma denetimlerini korurken aylık genişletilmiş kararlılık uygunluğunu atlar.

`Plugin NPM Release`, mevcut sürüm
davranışı için `npm_dist_tag=default` veya korumalı aylık yol için `npm_dist_tag=extended-stable` kabul eder.
Genişletilmiş kararlı seçeneği `publish_scope=all-publishable`, boş bir
`plugins` girdisi, `33` veya üzeri nihai bir yama ve tam ucundaki standart
`extended-stable/YYYY.M.33` dalını gerektirir. Plugin
`latest` veya `beta` etiketlerini hiçbir zaman taşımaz. Yeni paket sürümleri, OIDC güvenilir yayımlaması
(`npm publish --tag extended-stable`) aracılığıyla atomik olarak `extended-stable` alır; bu
kaynak iş akışı, belirteç kimlik doğrulamalı `npm dist-tag add` kullanmaz. Yeniden denemeler,
npm'de zaten bulunan tam sürümleri atlar ve ardından eksiksiz
geri okuma işlemi her tam paket ile `extended-stable` etiketinin yakınsadığını doğrulamadıkça güvenli biçimde başarısız olur.

`OpenClaw Release Publish`, operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: gerekli sürüm etiketi; önceden mevcut olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` ön denetim çalışma kimliği; `publish_openclaw_npm=true` veya `plugin_publish_scope=all-publishable` olduğunda gereklidir
- `full_release_validation_run_id`: başarılı `Full Release Validation` çalışma kimliği; `publish_openclaw_npm=true` veya `plugin_publish_scope=all-publishable` olduğunda gereklidir
- `full_release_validation_run_attempt`: `full_release_validation_run_id` ile eşleştirilmiş tam pozitif deneme; çalışma kimliği sağlandığında gereklidir
- `windows_node_tag`: tam ve ön sürüm olmayan `openclaw/openclaw-windows-node` sürüm etiketi; kararlı OpenClaw yayımlaması için gereklidir
- `windows_node_installer_digests`: mevcut Windows yükleyici adlarının sabitlenmiş `sha256:` özetlerine yönelik, aday için onaylanmış kompakt JSON eşlemesi; kararlı OpenClaw yayımlaması için gereklidir
- `npm_telegram_run_id`: nihai sürüm kanıtına dâhil edilecek isteğe bağlı başarılı `NPM Telegram Beta E2E` çalışma kimliği
- `npm_dist_tag`: OpenClaw paketi için `alpha`, `beta` veya `latest` değerlerinden biri olan npm hedef etiketi
- `plugin_publish_scope`: varsayılanı `all-publishable`; `selected` değerini yalnızca `publish_openclaw_npm=false` ile odaklı, yalnızca Plugin onarım çalışmalarında kullanın
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılanı `true`; yalnızca iş akışını yalnızca Plugin onarım orkestratörü olarak kullanırken `false` ayarlayın
- `release_profile`: sürüm kanıtı özetleri için kullanılan sürüm kapsam profili; varsayılanı, doğrulama bildiriminden okuyan `from-validation` değeridir; alternatif olarak `beta`, `stable` veya `full` ile geçersiz kılabilirsiniz
- `wait_for_clawhub`: npm kullanılabilirliğinin ClawHub yardımcı süreci tarafından engellenmemesi için varsayılanı `false`; yalnızca iş akışının tamamlanması ClawHub'ın tamamlanmasını da içermeliyse `true` ayarlayın

`OpenClaw Release Checks`, operatör tarafından denetlenen şu girdileri kabul eder:

- `ref`: doğrulanacak dal, etiket veya tam commit SHA'sı. Gizli bilgi içeren denetimler, çözümlenen commit'e bir OpenClaw dalı veya sürüm etiketi üzerinden erişilebilmesini gerektirir.
- `run_release_soak`: beta sürüm denetimleri için kapsamlı canlı/E2E, Docker sürüm yolu ve tüm sürümlerden yükseltme sonrası çalışmayı sürdürme dayanıklılık testini etkinleştirir. `release_profile=stable` ve `release_profile=full` tarafından zorunlu olarak etkinleştirilir.

Kurallar:

- `33` yamasının altındaki normal final ve düzeltme sürümleri `beta` veya `latest` etiketlerinden herhangi birinde yayımlanabilir. Yaması `33` veya üzeri olan final sürümleri `extended-stable` etiketinde yayımlanmalıdır ve bu sınırdaki düzeltme sonekli sürümler reddedilir.
- Beta ön sürüm etiketleri yalnızca `beta` etiketinde, alfa ön sürüm etiketleri ise yalnızca `alpha` etiketinde yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca doğrulama amaçlıdır
- Gerçek yayımlama yolu, ön kontrolde kullanılan `npm_dist_tag` değerinin aynısını kullanmalıdır; iş akışı, yayımlama devam etmeden önce bu meta verileri doğrular

## Normal beta/latest kararlı sürüm sırası

Bu eski sıra; Plugin'lerin, GitHub Release'in, Windows'un ve diğer platform çalışmalarının da sahibi olan normal düzenlemeli sürüm içindir. Bu, sayfanın üst kısmında belgelenen aylık, yalnızca npm'e yönelik `.33+` extended-stable yolu değildir.

Normal bir düzenlemeli kararlı sürüm hazırlarken:

1. `OpenClaw NPM Release` iş akışını `preflight_only=true` ile çalıştırın. Henüz bir etiket yokken, ön kontrol iş akışının yalnızca doğrulama amaçlı deneme çalıştırması için mevcut tam iş akışı dalı commit SHA'sını kullanabilirsiniz.
2. Normal, önce beta akışı için `npm_dist_tag=beta` değerini; yalnızca bilinçli olarak doğrudan kararlı yayımlama yapmak istediğinizde `latest` değerini seçin.
3. Normal CI'ın yanı sıra canlı istem önbelleği, Docker, QA Lab, Matrix ve Telegram kapsamını tek bir manuel iş akışından istediğinizde sürüm dalında, sürüm etiketinde veya tam commit SHA'sında `Full Release Validation` çalıştırın. Bilinçli olarak yalnızca deterministik normal test grafiğine ihtiyacınız varsa bunun yerine sürüm referansında manuel `CI` iş akışını çalıştırın.
4. İmzalı x64 ve ARM64 yükleyicileri yayımlanacak olan tam ön sürüm olmayan `openclaw/openclaw-windows-node` sürüm etiketini seçin. Bunu `windows_node_tag` olarak, doğrulanmış özet eşlemelerini ise `windows_node_installer_digests` olarak kaydedin. Sürüm adayı yardımcısı her ikisini de kaydeder ve oluşturduğu yayımlama komutuna ekler.
5. Başarılı `preflight_run_id`, `full_release_validation_run_id` ve tam `full_release_validation_run_attempt` değerlerini kaydedin.
6. Güvenilir `main` üzerinden aynı `tag`, aynı `npm_dist_tag`, seçilen `windows_node_tag`, kaydedilmiş `windows_node_installer_digests`, `preflight_run_id`, `full_release_validation_run_id` ve `full_release_validation_run_attempt` değerleriyle `OpenClaw Release Publish` çalıştırın. OpenClaw npm paketini yükseltmeden önce dışsallaştırılmış Plugin'leri npm ve ClawHub'da yayımlar.
7. Sürüm `beta` etiketinde yayımlandıysa bu kararlı sürümü `beta` etiketinden `latest` etiketine yükseltmek için `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` iş akışını kullanın.
8. Sürüm bilinçli olarak doğrudan `latest` etiketinde yayımlandıysa ve `beta` da hemen aynı kararlı derlemeyi izlemeliyse her iki dağıtım etiketini de kararlı sürüme yönlendirmek için aynı sürüm iş akışını kullanın veya zamanlanmış kendi kendini onarma eşitlemesinin `beta` etiketini daha sonra taşımasına izin verin.

Dağıtım etiketi değişikliği sürüm kayıt defteri deposunda bulunur çünkü hâlâ `NPM_TOKEN` gerektirir; kaynak deposu ise yalnızca OIDC ile yayımlamayı sürdürür. Bu, hem doğrudan yayımlama yolunun hem de önce beta yükseltme yolunun belgelenmiş ve operatörlerce görülebilir kalmasını sağlar.

Bir bakım sorumlusunun yerel npm kimlik doğrulamasına geri dönmesi gerekirse tüm 1Password CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde çalıştırın. `op` komutunu ana ajan kabuğundan doğrudan çağırmayın; tmux içinde tutmak istemleri, uyarıları ve tek kullanımlık parola işlemlerini gözlemlenebilir kılar ve tekrarlanan ana makine uyarılarını önler.

## Genel başvurular

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Bakım sorumluları gerçek çalışma kılavuzu için [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) içindeki özel sürüm belgelerini kullanır.

## İlgili

- [Sürüm kanalları](/tr/install/development-channels)
