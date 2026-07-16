---
read_when:
    - Herkese açık sürüm kanalı tanımları aranıyor
    - Sürüm doğrulaması veya paket kabulü çalıştırma
    - Sürüm adlandırmasını ve yayın sıklığını arama
summary: Sürüm kanalları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırma ve yayın sıklığı
title: Sürüm politikası
x-i18n:
    generated_at: "2026-07-16T17:35:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c88c7c61be963ed832b1716e811e09d5f270cb296bb08625e6fd53d5359e45b8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw şu anda kullanıcıya yönelik üç güncelleme kanalı sunar:

- stable: ayrı CLI/kanal dönüm noktası tamamlanana kadar npm `latest` üzerinden çözümlenmeye devam eden mevcut yükseltilmiş sürüm kanalı
- beta: npm `beta` üzerinde yayımlanan ön sürüm etiketleri
- dev: `main` dalının hareketli en güncel ucu

Bundan ayrı olarak sürüm operatörleri, tamamlanan son ayın çekirdek
paketini `33` yamasından başlayarak npm `extended-stable` üzerinde yayımlayabilir. İçinde bulunulan ayın
normal nihai serisi npm `latest` üzerinde devam eder; operatör tarafındaki bu yayın
ayrımı tek başına CLI güncelleme kanalı çözümlemesini değiştirmez.

Tideclaw alfa derlemeleri ayrı bir dahili ön sürüm hattıdır (npm dist-tag `alpha`); [NPM iş akışı girdileri](#npm-workflow-inputs) ve [Sürüm test kutuları](#release-test-boxes) bölümlerinde ele alınır.

## Sürüm adlandırması

- Aylık npm uzun süreli kararlı sürüm versiyonu: `YYYY.M.PATCH`; `PATCH >= 33` ile, git etiketi `vYYYY.M.PATCH`
- Günlük/normal nihai sürüm versiyonu: `YYYY.M.PATCH`; `PATCH < 33` ile, git etiketi `vYYYY.M.PATCH`
- Normal geri dönüş düzeltme sürümü versiyonu: `YYYY.M.PATCH-N`, git etiketi `vYYYY.M.PATCH-N`
- Beta ön sürüm versiyonu: `YYYY.M.PATCH-beta.N`, git etiketi `vYYYY.M.PATCH-beta.N`
- Alfa ön sürüm versiyonu: `YYYY.M.PATCH-alpha.N`, git etiketi `vYYYY.M.PATCH-alpha.N`
- Ay veya yama numarasını hiçbir zaman başına sıfır ekleyerek yazmayın
- `PATCH` bir takvim günü değil, sıralı aylık sürüm hattı numarasıdır. Normal nihai ve beta sürümleri mevcut hattı ilerletir; yalnızca alfa etiketleri beta/normal yama numarasını hiçbir zaman kullanmaz veya ilerletmez. Bu nedenle beta ya da normal hat seçerken daha yüksek yama numaralarına sahip eski yalnızca alfa etiketlerini yok sayın.
- Alfa/gecelik derlemeler bir sonraki yayımlanmamış yama hattını kullanır ve tekrarlanan derlemelerde yalnızca `alpha.N` değerini artırır. Bu yamanın bir betası yayımlandıktan sonra yeni alfa derlemeleri sonraki yamaya geçer.
- npm versiyonları değiştirilemez: yayımlanmış bir etiketi hiçbir zaman silmeyin, yeniden yayımlamayın veya tekrar kullanmayın. Bunun yerine sonraki ön sürüm numarasını ya da sonraki aylık yamayı oluşturun.
- `latest` mevcut normal/günlük npm serisini izlemeye devam eder; `beta` mevcut beta kurulum hedefidir
- `extended-stable`, `33` yamasından başlayan, desteklenen son aya ait npm paketi anlamına gelir; `34` ve sonraki yamalar bu aylık serinin bakım sürümleridir
- Normal nihai ve normal düzeltme sürümleri varsayılan olarak npm `beta` üzerinde yayımlanır; sürüm operatörleri açıkça `latest` hedefini seçebilir veya incelenmiş bir beta derlemesini daha sonra yükseltebilir
- Özel aylık uzun süreli kararlı sürüm yolu, çekirdek npm paketini ve npm üzerinde yayımlanabilen tüm resmî plugin'leri tam olarak aynı versiyonla yayımlar. Plugin'leri ClawHub'da veya macOS ya da Windows yapıtlarını, bir GitHub Sürümünü, özel depo dist-tag'lerini, Docker imajlarını, mobil yapıtları ya da web sitesi indirmelerini yayımlamaz.
- Her normal nihai sürüm; npm paketini, macOS uygulamasını, imzalı bağımsız Android APK'sını ve imzalı Windows Hub yükleyicilerini birlikte sunar. Beta sürümleri normalde önce npm/paket yolunu doğrular ve yayımlar; yerel uygulama derleme/imzalama/noter onayı/yükseltme işlemleri, açıkça istenmedikçe normal nihai sürüme ayrılır.

## Sürüm sıklığı

- Sürümler önce beta olarak ilerler; stable yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar, sürüm doğrulaması ve düzeltmelerinin `main` üzerindeki yeni geliştirmeleri engellememesi için normalde mevcut `main` üzerinden oluşturulan bir `release/YYYY.M.PATCH` dalından sürüm çıkarır
- Bir beta etiketi gönderilmiş veya yayımlanmışsa ve düzeltilmesi gerekiyorsa bakımcılar eski etiketi silmek ya da yeniden oluşturmak yerine sonraki `-beta.N` etiketini oluşturur
- Ayrıntılı sürüm prosedürü, onaylar, kimlik bilgileri ve kurtarma notları yalnızca bakımcılara yöneliktir

## Yalnızca npm için aylık uzun süreli kararlı yayın

Bu, aşağıdaki normal sürüm prosedürüne özel bir istisnadır. Tamamlanmış bir
`YYYY.M` ayı için `extended-stable/YYYY.M.33` oluşturun; `vYYYY.M.33`
ve sonraki bakım yamalarını aynı daldan yayımlayın. Sürüm etiketi, dal ucu,
çalışma kopyası, paket versiyonu, npm ön kontrolü ve Tam Sürüm Doğrulama
çalıştırmasının tümü aynı commit'i tanımlamalıdır. Korunan `main`,
`33` yamasının altında, kesinlikle daha sonraki bir takvim ayının nihai versiyonunu
zaten içermelidir; `main` bir aydan fazla ilerledikten sonra da bakım yamaları
uygun kalır.

Tam uzun süreli kararlı sürüm dalında kök paketi `YYYY.M.P` versiyonuna yükseltin,
`pnpm release:prep` komutunu çalıştırın ve yayımlanabilir her uzantı paketinin
aynı versiyona sahip olduğunu doğrulayın. Oluşturulan tüm değişiklikleri commit edip gönderin,
bu commit üzerinde değiştirilemez `vYYYY.M.P` etiketini oluşturup gönderin ve ortaya çıkan
tam SHA'yı kaydedin. İş akışları bu hazırlanmış ağacı kullanır; versiyonları
sizin için yükseltmez veya eşitlemez.

npm ön kontrolünü ve Tam Sürüm Doğrulamasını tam olarak bu hazırlanmış
dal ucundan çalıştırın, ardından her iki çalıştırma kimliğini ve başarılı Tam Sürüm Doğrulama
çalıştırma denemesini kaydedin:

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

`release_profile=stable` mevcut doğrulama derinliği profilidir; npm
`extended-stable` dist-tag'inden ayrıdır ve kasıtlı olarak
değiştirilmemiştir.

Her iki çalıştırma da başarılı olduktan sonra npm üzerinde yayımlanabilen tüm resmî plugin'leri
tam olarak aynı dal ucundan yayımlayın. `P` yaması `33` veya daha büyük olmalıdır.
Tam sürüm SHA'sını `ref` olarak iletin, matrisin tamamlanmasını ve kayıt defteri geri okumasını
bekleyin, ardından başarılı Plugin NPM Release çalıştırma kimliğini kaydedin:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

İş akışı, kaynağı değişmemiş paketler de dâhil olmak üzere normal hazırlanmış
`all-publishable` paket envanterini kullanır. Başarılı olmadan önce her tam paketi
ve her plugin `extended-stable` etiketini doğrular. Kısmi bir çalıştırma
başarısız olursa aynı komutu yeniden çalıştırın: önceden yayımlanmış paketler yeniden kullanılır,
eksik veya eski plugin etiketleri npm sürüm ortamında uzlaştırılır ve
son geri okuma yine tüm paket kümesini kapsar.

Plugin iş akışı başarılı olduktan ve npm sürüm ortamı hazırlandıktan sonra
ön kontrolden geçen tam çekirdek tarball'ını yayımlayın. Çekirdek yayını,
başvurulan plugin çalıştırmasının aynı kanonik dal ve tam kaynak SHA üzerinde
`completed/success` olduğunu doğrular:

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

Aylık `.33` veya korunan `main` ay politikasını kasıtlı olarak
karşılayamayan bir fork ya da üretim dışı prova için hem npm ön kontrolü hem de yayın
tetiklemelerine `-f bypass_extended_stable_guard=true` ekleyin. Varsayılan değer `false` şeklindedir.
Atlama yalnızca `npm_dist_tag=extended-stable` ile kabul edilir ve iş akışı özetine
kaydedilir. Kanonik `extended-stable/YYYY.M.33` iş akışı ref'ini,
dal ucu/etiket/çalışma kopyası eşitliğini, nihai etiket söz dizimini, paket/etiket versiyonu
eşitliğini, başvurulan çalıştırma ve bildirim kimliğini, tarball kaynağını,
ortam onayını, kayıt defteri geri okumasını veya seçici onarım kanıtını atlamaz.

Yayın iş akışı, başvurulan ön kontrol, doğrulama ve plugin
çalıştırma kimliklerini, hazırlanmış tarball özetini ve çekirdek kayıt defteri seçicilerini doğrular.
İş akışı başarılı olduktan sonra sonucu bağımsız olarak doğrulayın:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Her iki komut da `YYYY.M.P` döndürmelidir. Yayın başarılı olur ancak seçici
geri okuması başarısız olursa değiştirilemez paket versiyonunu yeniden yayımlamayın. Başarısız iş akışının
her zaman çalışan özetinde yazdırılan tek `npm dist-tag add openclaw@YYYY.M.P extended-stable` onarım komutunu
kullanın, ardından her iki bağımsız geri okumayı tekrarlayın. Önceki seçiciye geri alma,
geri okuma onarım yolundan ayrı bir operatör kararıdır.

Genel destek belgeleri başlangıçta Slack, Discord ve Codex'i
kapsanan uzun süreli kararlı plugin yüzeyleri olarak belirtir. Bu liste bir destek beyanıdır,
sürüm kodu izin listesi değildir: npm üzerinde yayımlanabilen her resmî plugin
tam olarak aynı versiyonla yayın yolunu izler.

Aşağıdaki normal kontrol listesi beta, `latest`, GitHub Sürümü,
plugin'ler, macOS, Windows ve diğer platform yayınlarının sorumluluğunu taşımaya devam eder.
Yalnızca npm için olan bu uzun süreli kararlı sürüm yolunda bu adımları çalıştırmayın.

## Normal sürüm operatörü kontrol listesi

Bu kontrol listesi sürüm akışının genel kullanıma açık biçimidir. Özel kimlik bilgileri, imzalama, noter onayı, dist-tag kurtarma ve acil geri alma ayrıntıları yalnızca bakımcılara yönelik sürüm çalışma kitabında tutulur.

1. Mevcut `main` üzerinden başlayın: en son değişiklikleri çekin, hedef commit'in gönderildiğini ve `main` CI durumunun dal oluşturmak için yeterince başarılı olduğunu doğrulayın.
2. Bu commit'ten `release/YYYY.M.PATCH` oluşturun. Geri taşımalar isteğe bağlıdır; yalnızca operatörün seçtiği kümeyi uygulayın. Gerekli tüm versiyon konumlarını yükseltin, `pnpm release:prep` komutunu çalıştırın, sürüm düzeltmelerini ve gerekli ileri taşımaları tamamlayın ve `src/plugins/compat/registry.ts` ile `src/commands/doctor/shared/deprecation-compat.ts` dosyalarını inceleyin.
3. Ürün açısından tamamlanmış, değişiklik günlüğü öncesi commit'i **Kod SHA'sı** olarak sabitleyin. Belirlenimci kaynak ön kontrolünü çalıştırın, ardından `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH` kullanın. Böylece tam Vitest, Docker, QA, paket ve performans matrisi tam Kod SHA'sını hedeflerken güvenilir iş akışı araçları sabitlenir.
4. Düzenleme yapmadan önce hataları sınıflandırın. Bir ürün/kod hatası yeni bir Kod SHA'sı oluşturur ve bu SHA için başarılı tam doğrulama gerektirir. İş akışı, test düzeneği, kimlik bilgisi, onay veya altyapı hatası kendi sorumlu yüzeyinde düzeltilir ve aynı Kod SHA'sına karşı yeniden çalıştırılır.
5. Yalnızca Kod SHA'sı başarılı olduktan sonra, erişilebilen son yayımlanmış etiketten bu yana birleştirilen PR'lerden ve doğrudan commit'lerden en üstteki `CHANGELOG.md` bölümünü oluşturun. Girdileri kullanıcıya yönelik ve yinelenmeyen biçimde tutun. Ayrışmış bir yayımlanmış etiket veya sonraki bir ileri taşıma, daha önce yayımlanmış PR'leri yeniden ilişkilendirdiğinde bunu açıkça `--shipped-ref` olarak iletin.
6. Yalnızca `CHANGELOG.md` dosyasını commit edin. Bu commit **Sürüm SHA'sıdır**. Kod SHA'sından Sürüm SHA'sına kadar olan diff'in tamamı tam olarak `CHANGELOG.md` olmalıdır; değişen başka herhangi bir yol sürümü 2. adıma döndürür.
7. Kanıt yeniden kullanımı etkin olarak Sürüm SHA'sı için SHA'ya sabitlenmiş Tam Sürüm Doğrulamasını çalıştırın. Hafif üst çalıştırma `changelog-only-release-v1` kaydetmeli, başarılı Kod SHA'sını göstermeli ve hiçbir ürün alt hattını tetiklememelidir. Bu işlem ürün kanıtını yeniden kullanır; paket baytlarını yeniden kullanmaz.
8. Sürüm SHA'sına/etiketine karşı `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın. Başarılı `preflight_run_id` değerini kaydedin. Bu işlem, nihai değişiklik günlüğünü içeren tam paket baytlarını derler ve denetler.
9. Sürüm SHA'sını etiketleyin, ardından ikisini de yeniden tetiklemek yerine başarılı Sürüm SHA'sı doğrulama üst çalıştırması ve npm ön kontrolüyle aday yardımcısını çalıştırın:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Kararlı sürüm için ayrıca `--windows-node-tag vX.Y.Z` iletin. Yardımcı, sürüm notlarının kaynağını, npm ön kontrol baytlarını, Parallels yükleme/güncelleme kanıtını, Telegram paket kanıtını ve Plugin yayımlama planlarını doğrular, ardından yayımlama komutunu yazdırır.

   `OpenClaw Release Publish`, seçilen veya yayımlanabilir tüm Plugin paketlerini npm'ye ve aynı kümeyi paralel olarak ClawHub'a gönderir; ardından Plugin npm yayımlaması başarılı olduğunda hazırlanmış OpenClaw npm ön kontrol yapıtını eşleşen dist-tag ile yükseltir. Sürüm çalışma kopyası ürün/veri kökü olarak kalırken planlama ve son doğrulama, eski bir sürüm işlemesinin güncelliğini yitirmiş sürüm araçlarını sessizce kullanamaması için tam olarak güvenilen iş akışı kaynağı çalışma kopyasından yürütülür. Herhangi bir alt yayımlama işlemi başlamadan önce tam GitHub sürüm gövdesini oluşturup önbelleğe alır. Eksiksiz eşleşen `CHANGELOG.md` bölümü GitHub'ın 125.000 karakterlik sınırına ve oluşturucunun eşleşen 125.000 baytlık güvenlik tavanına sığdığında sayfa, başlığıyla birlikte tam olarak bu `## YYYY.M.PATCH` bölümünü içerir. Kaynak bölüm sığmadığında sayfa, gruplandırılmış editoryal notları aynen korur ve aşırı büyük katkı kaydını, etikete sabitlenmiş `CHANGELOG.md` içindeki tam kayda yönlendiren kararlı bir bağlantıyla değiştirir; kısmi kayıtlar ve kesilmiş madde işaretleri hiçbir zaman yayımlanmaz. İş akışı, `### Release verification` eklenmeden önce tam veya kompakt gövdeyi seçer; kanıt son eki sınırı aşacaksa standart gövdeyi korur ve bunun yerine değiştirilemez ekli kanıta dayanır. npm `latest` üzerinde yayımlanan kararlı sürümler GitHub'ın en son sürümü olurken npm `beta` üzerinde tutulan kararlı bakım sürümleri GitHub `latest=false` ile oluşturulur. İş akışı ayrıca sürüm sonrası olay müdahalesi için ön kontrol bağımlılık kanıtını, tam doğrulama manifestini ve yayımlama sonrası kayıt defteri doğrulama kanıtını GitHub sürümüne yükler. Alt çalıştırma kimliklerini hemen yazdırır, iş akışı belirtecinin onaylamasına izin verilen sürüm ortamı kapılarını otomatik olarak onaylar, başarısız alt işleri günlük sonlarıyla özetler, taslak GitHub sürüm sayfasını önceden oluşturur ve Windows ile Android varlıklarını OpenClaw npm yayımlamasıyla eş zamanlı olarak yükseltir, bu aşamalar başarılı olduğunda sürüm sayfasını ve bağımlılık kanıtını tamamlar, OpenClaw npm yayımlanırken ClawHub'ı bekler, ardından güvenilen ana dal beta doğrulayıcısını çalıştırır ve GitHub sürümü, npm paketi, seçilen Plugin npm paketleri, seçilen ClawHub paketleri, alt iş akışı çalıştırma kimlikleri ve isteğe bağlı NPM Telegram çalıştırma kimliği için yayımlama sonrası kanıtı yükler. ClawHub önyükleme doğrulayıcısı tam güvenilen ana dal iş akışı yolunu ve SHA'yı, üretici ve sonlandırıcı çalıştırma denemelerini, sürüm SHA'sını, istenen paket kümesini, değiştirilemez paket yapıtı demetini ve son kayıt defteri geri okuma yapıtını gerektirir; başarılı eski bir sürüm referansı çalıştırması kabul edilmez.

   Ardından yayımlanan `openclaw@YYYY.M.PATCH-beta.N` veya `openclaw@beta` paketine karşı yayımlama sonrası paket kabulünü çalıştırın. Gönderilmiş veya yayımlanmış bir ön sürümün düzeltilmesi gerekiyorsa eşleşen bir sonraki ön sürüm numarasını oluşturun; eskisini hiçbir zaman silmeyin veya yeniden yazmayın.

10. Başarısız bir yayımlama denemesinde, hata bir ürün veya değişiklik günlüğü kusurunu kanıtlamadığı sürece Sürüm SHA'sını değiştirmeyin. Başarılı değiştirilemez alt işlemleri ve yapıtları sürdürün; daha önce başarıyla tamamlanmış bir paket sürümünü hiçbir zaman yeniden oluşturmayın veya yeniden yayımlamayın.
11. Kararlı sürüm için yalnızca incelenmiş beta veya sürüm adayı gerekli doğrulama kanıtına sahip olduktan sonra devam edin. Kararlı npm yayımlaması da başarılı ön kontrol yapıtını `preflight_run_id` aracılığıyla yeniden kullanarak `OpenClaw Release Publish` üzerinden geçer. Kararlı macOS sürüm hazırlığı ayrıca paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve `main` üzerindeki güncellenmiş `appcast.xml` öğesini gerektirir; macOS yayımlama iş akışı, sürüm varlıkları doğrulandıktan sonra imzalı uygulama yayın akışını otomatik olarak herkese açık `main` öğesine yayımlar veya dal koruması doğrudan gönderimi engellerse bir uygulama yayın akışı PR'ı açar/günceller. Kararlı Windows Hub hazırlığı, OpenClaw GitHub sürümündeki imzalı `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` ve `OpenClawCompanion-SHA256SUMS.txt` varlıklarını gerektirir. Tam imzalı `openclaw/openclaw-windows-node` sürüm etiketini `windows_node_tag` olarak ve aday tarafından onaylanmış yükleyici özet eşlemesini `windows_node_installer_digests` olarak iletin; `OpenClaw Release Publish` sürüm taslağını korur, `Windows Node Release` gönderir ve yayımlamadan önce üç varlığın tümünü doğrular.
12. Yayımlamadan sonra npm yayımlama sonrası doğrulayıcısını, yayımlama sonrası kanal kanıtına ihtiyaç duyduğunuzda isteğe bağlı bağımsız yayımlanmış-npm Telegram E2E'yi ve gerektiğinde dist-tag yükseltmesini çalıştırın; oluşturulan GitHub sürüm sayfasını doğrulayın, sürüm duyurusu adımlarını çalıştırın, ardından kararlı sürümü tamamlanmış saymadan önce [Kararlı ana dal kapanışı](#stable-main-closeout) işlemini tamamlayın.

## Kararlı ana dal kapanışı

`main` gerçek yayımlanmış sürüm durumunu taşımadan kararlı yayımlama tamamlanmış değildir.

1. Yeni alınmış en son `main` ile başlayın. `release/YYYY.M.PATCH` öğesini buna göre denetleyin ve `main` içinde bulunmayan gerçek düzeltmeleri ileri taşıyın. Yalnızca sürüme özgü uyumluluk, test veya doğrulama bağdaştırıcılarını daha yeni `main` içine körü körüne birleştirmeyin.
2. Normal yol için `main` öğesini yayımlanmış kararlı sürüme ayarlayın. Geç yapılan bir kapanış, daha sonraki bir kararlı OpenClaw CalVer sürümüne ilerledikten sonra `main` kullanabilir; yalnızca önceki sürümü kapatmak için başlamış bir sürüm dizisini geriye düşürmeyin. Doğrulayıcı yine de tam yayımlanmış değişiklik günlüğü bölümünü ve uygulama yayın akışı girdisini gerektirir ve gerçek `main` sürümünü ve SHA'sını kaydeder. Herhangi bir kök sürüm değişikliğinden sonra `pnpm release:prep`, ardından `pnpm deps:shrinkwrap:generate` çalıştırın.
3. `CHANGELOG.md` dosyasının `main` üzerindeki `## YYYY.M.PATCH` bölümünün etiketlenmiş sürüm dalıyla tam olarak eşleşmesini sağlayın. Mac sürümü yayımladıysa kararlı `appcast.xml` güncellemesini ekleyin.
4. Operatör ilgili sürüm dizisini açıkça başlatana kadar `main` öğesine `YYYY.M.PATCH+1`, bir beta sürümü veya boş bir gelecek değişiklik günlüğü bölümü eklemeyin.
5. `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` ve `OPENCLAW_TESTBOX=1 pnpm check:changed` çalıştırın. Gönderin, ardından kararlı sürümü tamamlanmış saymadan önce `origin/main` öğesinin yayımlanmış sürümü ve değişiklik günlüğünü içerdiğini doğrulayın.
6. Her özel geri alma tatbikatından sonra `RELEASE_ROLLBACK_DRILL_ID` ve `RELEASE_ROLLBACK_DRILL_DATE` depo değişkenlerini güncel tutun.

`OpenClaw Stable Main Closeout`, kararlı yayımlamadan sonra yayımlanmış sürümü, değişiklik günlüğünü ve uygulama yayın akışını taşıyan `main` gönderiminden başlar. Yayımlanmış etiketi Tam Sürüm Doğrulaması ve Yayımlama çalıştırmalarına bağlamak için değiştirilemez yayımlama sonrası kanıtı okur; ardından kararlı ana dal durumunu, sürümü, zorunlu kararlı bekleme süresini ve engelleyici performans kanıtını doğrular. GitHub sürümüne değiştirilemez bir kapanış manifesti ve sağlama toplamı ekler. Otomatik gönderim tetikleyicisi, değiştirilemez yayımlama sonrası kanıttan önceki eski sürümleri atlar ve bu atlamayı hiçbir zaman tamamlanmış bir kapanış olarak değerlendirmez.

Eksiksiz bir kapanış hem varlıkları hem de eşleşen sağlama toplamını gerektirir. Kısmi bir manifest, aynı baytları yeniden oluşturmak için kaydedilmiş `main` SHA'sını ve geri alma tatbikatını yeniden oynatır, ardından eksik sağlama toplamını ekler; geçersiz bir çift veya manifestsiz bir sağlama toplamı engelleyici olmaya devam eder. Geri alma tatbikatı depo değişkenleri bulunmayan gönderimle tetiklenmiş bir çalıştırma, kapanışı tamamlamadan atlanır; eksik veya 90 günden eski bir tatbikat kaydı, kanıta dayalı manuel kapanışı yine de engeller. Özel kurtarma komutları yalnızca bakımcıların erişebildiği çalıştırma kitabında kalır. Manuel göndermeyi yalnızca kanıta dayalı kararlı kapanışı onarmak veya yeniden oynatmak için kullanın.

Sürüm Yayımlama üst işlemi yalnızca değiştirilemez npm/Plugin kanıtı eklendikten sonra başarısız olduysa önce tüm kararlı platform varlıklarını onarıp yayımlayın. Ardından bir bakımcı, kapanışı `allow_failed_publish_recovery=true` ile manuel olarak gönderebilir; bu mod yalnızca tamamlanmış ancak başarısız olmuş bir üst işlemi kabul eder ve normal macOS/uygulama yayın akışı denetimlerine ek olarak tam Android ve Windows varlık sözleşmelerini, GitHub SHA-256 özetlerini, sağlama toplamı doğrulamasını, Android kaynağını ve Authenticode denetimleri ile aday tarafından onaylanmış özetleri yayımlanan yükleyicilerle eşleşen, üst işlem tarafından gönderilmiş başarılı bir Windows yükseltmesini gerektirir. Otomatik gönderim kapanışı bu kurtarma modunu hiçbir zaman etkinleştirmez.

Eski bir yedek düzeltme etiketi, yalnızca düzeltme etiketi temel kararlı etiketle aynı kaynak işlemesine çözümlendiğinde temel paket kanıtını yeniden kullanabilir. Android sürümü, temel etiketin doğrulanmış APK'sını yeniden kullanır ve düzeltme etiketi için kaynak kanıtı ekler. Farklı kaynağa sahip bir düzeltme kendi paket kanıtını yayımlayıp doğrulamalı ve daha yüksek bir Android `versionCode` kullanmalıdır.

## Sürüm ön kontrolü

- Test TypeScript'inin daha hızlı yerel `pnpm check` kapısının dışında kapsanmaya devam etmesi için sürüm ön kontrolünden önce `pnpm check:test-types` çalıştırın.
- Daha geniş içe aktarma döngüsü ve mimari sınır denetimlerinin daha hızlı yerel kapının dışında başarılı olması için sürüm ön kontrolünden önce `pnpm check:architecture` çalıştırın.
- Paket doğrulama adımı için beklenen `dist/*` sürüm yapıtlarının ve Control UI paketinin var olması amacıyla `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın.
- Kök sürüm artışından sonra ve etiketlemeden önce `pnpm release:prep` çalıştırın. Bir sürüm/yapılandırma/API değişikliğinden sonra yaygın olarak sapma gösteren tüm belirlenimci sürüm oluşturucularını çalıştırır: Plugin sürümleri, npm shrinkwrap dosyaları, Plugin envanteri, temel yapılandırma şeması, paketlenmiş kanal yapılandırma meta verileri, yapılandırma belgeleri referans değeri, Plugin SDK dışa aktarımları ve Plugin SDK API referans değeri. `pnpm release:check`, paket sürümü denetimlerini çalıştırmadan önce bu korumaları denetim modunda yeniden çalıştırır (ayrıca bir Plugin SDK yüzey bütçesi denetimi) ve oluşturulmuş tüm sapma hatalarını tek geçişte bildirir.
- Plugin sürüm eşitlemesi, varsayılan olarak yayımlanabilir `@openclaw/ai` çalışma zamanı paketini, resmî Plugin paketi sürümlerini ve mevcut `openclaw.compat.pluginApi` alt sınırlarını OpenClaw sürümüne günceller. Bu alanı yalnızca paket sürümünün bir kopyası olarak değil, Plugin SDK/çalışma zamanı API alt sınırı olarak değerlendirin: eski OpenClaw ana makineleriyle bilinçli olarak uyumlu kalan yalnızca Plugin sürümlerinde alt sınırı desteklenen en eski ana makine API'sinde tutun ve bu seçimi Plugin sürüm kanıtında belgeleyin.
- Tüm sürüm öncesi test kutularını tek bir giriş noktasından başlatmak için sürüm onayından önce manuel `Full Release Validation` iş akışını çalıştırın. Bir dal, etiket veya tam işleme SHA'sını kabul eder, manuel `CI` gönderir ve yükleme duman testi, paket kabulü, işletim sistemleri arası paket denetimleri, QA Lab eşliği, Matrix ve Telegram hatları için `OpenClaw Release Checks` gönderir. Kararlı ve tam çalıştırmalar her zaman kapsamlı canlı/E2E ve Docker sürüm yolu bekleme testini içerir; `run_release_soak=true` açık bir beta bekleme testi için korunur. Paket Kabulü, aday doğrulaması sırasında standart paket Telegram E2E'yi sağlayarak ikinci bir eş zamanlı canlı yoklayıcıyı önler.

  Sürüm tarball'ını yeniden oluşturmadan yayımlanmış npm paketini sürüm denetimleri, Paket Kabulü ve paket Telegram E2E genelinde yeniden kullanmak için beta yayımladıktan sonra `release_package_spec` sağlayın. Yalnızca Telegram'ın sürüm doğrulamasının geri kalanından farklı bir yayımlanmış paket kullanması gerektiğinde `npm_telegram_package_spec` sağlayın. Paket Kabulünün sürüm paketi belirtiminden farklı bir yayımlanmış paket kullanması gerektiğinde `package_acceptance_package_spec` sağlayın. Sürüm kanıtı raporunun Telegram E2E'yi zorunlu kılmadan doğrulamanın yayımlanmış bir npm paketiyle eşleştiğini kanıtlaması gerektiğinde `evidence_package_spec` sağlayın.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Sürüm çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde manuel `Package Acceptance` iş akışını çalıştırın. `openclaw@beta`, `openclaw@latest` veya tam bir sürüm sürümü için `source=npm`; mevcut `workflow_ref` test düzeneğiyle güvenilir bir `package_ref` dalını/etiketini/SHA'sını paketlemek için `source=ref`; gerekli SHA-256 ve katı genel URL politikasıyla genel bir HTTPS tar arşivi için `source=url`; gerekli `trusted_source_id` ve SHA-256'yı kullanan adlandırılmış bir güvenilir kaynak politikası için `source=trusted-url`; ya da başka bir GitHub Actions çalıştırması tarafından yüklenen bir tar arşivi için `source=artifact` kullanın.

  İş akışı, adayı `package-under-test` olarak çözümler, Docker E2E sürüm zamanlayıcısını bu tar arşivine karşı yeniden kullanır ve `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile aynı tar arşivine karşı Telegram QA çalıştırabilir. Seçilen Docker şeritleri `published-upgrade-survivor` içerdiğinde paket yapısı adaydır ve `published_upgrade_survivor_baseline` yayımlanmış temel sürümü seçer. `update-restart-auth`, aday paketi hem kurulu CLI hem de test edilen paket olarak kullanır; böylece aday güncelleme komutunun yönetilen yeniden başlatma yolunu sınar.

  Örnek:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Yaygın profiller:
  - `smoke`: kurulum/kanal/ajan, Gateway ağı ve yapılandırma yeniden yükleme şeritleri
  - `package`: OpenWebUI veya canlı ClawHub olmadan, yapıya özgü paket/güncelleme/yeniden başlatma/plugin şeritleri
  - `product`: paket profiline ek olarak MCP kanalları, cron/alt ajan temizliği, OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI içeren Docker sürüm yolu parçaları
  - `custom`: odaklanmış bir yeniden çalıştırma için tam `docker_lanes` seçimi

- Yalnızca sürüm adayı için belirlenimci normal CI kapsamına ihtiyacınız olduğunda manuel `CI` iş akışını doğrudan çalıştırın. Manuel CI tetiklemeleri, değişiklik kapsamlandırmasını atlar ve Linux Node parçalarını, paketlenmiş plugin parçalarını, plugin ve kanal sözleşmesi parçalarını, Node 22 uyumluluğunu, `check-*`, `check-additional-*`, derlenmiş yapı duman kontrollerini, dokümantasyon kontrollerini, Python Skills, Windows, macOS ve Control UI i18n şeritlerini zorunlu kılar. Bağımsız manuel CI çalıştırmaları Android'i yalnızca `include_android=true` ile tetiklendiğinde çalıştırır; `Full Release Validation` bu girdiyi kendi CI alt iş akışına aktarır.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Sürüm telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. QA-lab'i yerel bir OTLP/HTTP alıcısı üzerinden çalıştırır ve Opik, Langfuse veya başka bir harici toplayıcı gerektirmeden iz, metrik ve günlük dışa aktarımını; ayrıca sınırlı iz özniteliklerini ve içerik/tanımlayıcı maskelemesini doğrular.
- Toplayıcı uyumluluğunu doğrularken `pnpm qa:otel:collector-smoke` çalıştırın. Yerel alıcı doğrulamalarından önce aynı QA-lab OTLP dışa aktarımını gerçek bir OpenTelemetry Collector Docker konteyneri üzerinden yönlendirir.
- Korumalı Prometheus kazımasını doğrularken `pnpm qa:prometheus:smoke` çalıştırın. QA-lab'i çalıştırır, kimliği doğrulanmamış kazımaları reddeder ve sürüm açısından kritik metrik ailelerinin istem içeriği, ham tanımlayıcılar, kimlik doğrulama belirteçleri ve yerel yollar içermediğini doğrular.
- Kaynak kullanıma alma OpenTelemetry ve Prometheus duman şeritlerini art arda çalıştırmak için `pnpm qa:observability:smoke` çalıştırın.
- Her etiketli sürümden önce `pnpm release:check` çalıştırın.
- `OpenClaw NPM Release` ön kontrolü, npm tar arşivini paketlemeden önce bağımlılık sürüm kanıtı oluşturur. npm danışma bildirimi güvenlik açığı geçidi sürümü engelleyicidir. Geçişli bildirim riski, bağımlılık sahipliği/kurulum yüzeyi ve bağımlılık değişikliği raporları yalnızca sürüm kanıtıdır. Bağımlılık değişikliği raporu, sürüm adayını önceki erişilebilir sürüm etiketiyle karşılaştırır. Ön kontrol, bağımlılık kanıtını `openclaw-release-dependency-evidence-<tag>` olarak yükler ve ayrıca hazırlanmış npm ön kontrol yapısının içinde `dependency-evidence/` altına gömer. Gerçek yayımlama yolu bu ön kontrol yapısını yeniden kullanır ve ardından aynı kanıtı GitHub sürümüne `openclaw-<version>-dependency-evidence.zip` olarak ekler.
- Etiket oluşturulduktan sonraki değişiklik yapan yayımlama dizisi için `OpenClaw Release Publish` çalıştırın. Normal beta ve kararlı yayımları güvenilir `main` üzerinden tetikleyin; sürüm etiketi yine tam hedef kaydı seçer ve `release/YYYY.M.PATCH` içine işaret edebilir. Tideclaw alfa yayımları eşleşen alfa dallarında kalır. Başarılı OpenClaw npm `preflight_run_id`, başarılı `full_release_validation_run_id` ve tam `full_release_validation_run_attempt` değerlerini iletin; kasıtlı olarak odaklanmış bir onarım çalıştırmıyorsanız varsayılan plugin yayımlama kapsamı olan `all-publishable` değerini koruyun. İş akışı, çekirdek paketin haricîleştirilmiş plugin'lerinden önce yayımlanmaması için plugin npm yayımlamasını, plugin ClawHub yayımlamasını ve OpenClaw npm yayımlamasını sıralı olarak yürütür; Windows ve Android yükseltmesi, taslak sürüm sayfasına karşı çekirdek npm yayımlamasıyla eşzamanlı çalışır. Yayımlama yeniden çalıştırmaları kaldığı yerden sürdürülebilir: daha önce yayımlanmış bir çekirdek npm sürümünde, iş akışı kayıt defteri tar arşivinin etiketin ön kontrol yapısıyla eşleştiğini kanıtladıktan sonra çekirdek tetiklemesi atlanır; sürüm doğrulanmış yapı sözleşmesini zaten içeriyorsa Windows/Android yükseltmesi de atlanır. Böylece yeniden deneme yalnızca başarısız aşamaları tekrarlar. Odaklanmış, yalnızca plugin onarımları için `plugin_publish_scope=selected` ve boş olmayan bir plugin listesi gerekir. Yalnızca plugin `all-publishable` çalıştırmaları, eksiksiz ve değişmez ön kontrol ile Tam Sürüm Doğrulama kanıtı gerektirir; kısmi kanıt reddedilir.
- Kararlı `OpenClaw Release Publish`, eşleşen ön sürüm olmayan `openclaw/openclaw-windows-node` sürümü oluşturulduktan sonra tam bir `windows_node_tag` ve aday için onaylanmış `windows_node_installer_digests` eşlemesi gerektirir. Herhangi bir yayımlama alt iş akışını tetiklemeden önce kaynak sürümün yayımlanmış ve ön sürüm olmadığını, gerekli x64/ARM64 yükleyicilerini içerdiğini ve hâlâ bu onaylanmış eşlemeyle uyuştuğunu doğrular. Ardından OpenClaw sürümü hâlâ taslak durumdayken `Windows Node Release` iş akışını tetikler ve sabitlenmiş yükleyici özet eşlemesini değiştirmeden aktarır. Alt iş akışı, imzalı Windows Hub yükleyicilerini bu tam etiketten indirir, sabitlenmiş özetlerle eşleştirir, Authenticode imzalarının bir Windows çalıştırıcısında beklenen OpenClaw Foundation imzalayanını kullandığını doğrular, bir SHA-256 bildirimi yazar ve yükleyicilerle bildirimi standart OpenClaw GitHub sürümüne yükler; ardından yükseltilen yapıları yeniden indirerek bildirim üyeliğini ve karmaları doğrular. Üst iş akışı yayımlamadan önce mevcut x64, ARM64 ve sağlama toplamı yapı sözleşmesini doğrular. Doğrudan kurtarma, beklenen sözleşme yapılarını sabitlenmiş kaynak baytlarıyla değiştirmeden önce beklenmeyen `OpenClawCompanion-*` yapı adlarını reddeder.

  `Windows Node Release` iş akışını yalnızca kurtarma için manuel olarak tetikleyin ve her zaman tam bir etiket ile onaylanmış kaynak sürümdeki açık `expected_installer_digests` JSON eşlemesini iletin; asla `latest` iletmeyin. Web sitesi indirme bağlantıları, mevcut kararlı sürümün tam OpenClaw sürüm yapısı URL'lerini veya yalnızca GitHub'ın en son yönlendirmesinin aynı sürüme işaret ettiği doğrulandıktan sonra `releases/latest/download/...` hedefini kullanmalıdır; yalnızca eşlik eden depo sürüm sayfasına bağlantı vermeyin.

- Sürüm kontrolleri artık ayrı bir manuel iş akışında çalışır: `OpenClaw Release Checks`. Ayrıca sürüm onayından önce QA Lab sahte eşlik şeridini, Matrix sürüm profilini ve Telegram QA şeridini çalıştırır. Canlı şeritler `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralamalarını kullanır. Bakımı yapılan tüm Matrix senaryolarını istediğinizde manuel `QA-Lab - All Lanes` iş akışını `matrix_profile=all` ile çalıştırın; iş akışı, tam kanıtı iş başına zaman aşımı sınırları içinde tutmak için bu seçimi taşıma, medya ve E2EE profillerine dağıtır.
- İşletim sistemleri arası kurulum ve yükseltme çalışma zamanı doğrulaması, yeniden kullanılabilir `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` iş akışını doğrudan çağıran herkese açık `OpenClaw Release Checks` ve `Full Release Validation` kapsamındadır. Bu ayrım kasıtlıdır: gerçek npm sürüm yolunu kısa, belirlenimci ve yapıt odaklı tutarken daha yavaş canlı kontroller kendi şeritlerinde kalır; böylece yayımlamayı geciktirmez veya engellemezler.
- Gizli bilgi içeren sürüm kontrolleri `Full Release Validation` üzerinden veya `main`/release iş akışı referansından tetiklenmelidir; böylece iş akışı mantığı ve gizli bilgiler denetim altında kalır.
- `OpenClaw Release Checks`, çözümlenen kayıt bir OpenClaw dalından veya sürüm etiketinden erişilebilir olduğu sürece dal, etiket veya tam kayıt SHA'sı kabul eder.
- `OpenClaw NPM Release` yalnızca doğrulama amaçlı ön kontrolü, gönderilmiş bir etiket gerektirmeden mevcut tam 40 karakterli iş akışı dalı kayıt SHA'sını da kabul eder. Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir yayıma yükseltilemez. SHA modunda iş akışı, yalnızca paket meta verisi kontrolü için `v<package.json version>` oluşturur; gerçek yayım hâlâ gerçek bir sürüm etiketi gerektirir.
- Her iki iş akışı da gerçek yayım ve yükseltme yolunu GitHub tarafından barındırılan çalıştırıcılarda tutarken, değişiklik yapmayan doğrulama yolu daha büyük Blacksmith Linux çalıştırıcılarını kullanabilir.
- Bu iş akışı, hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı gizli bilgilerini kullanarak `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` çalıştırır.
- npm sürümü ön kontrolü artık ayrı sürüm kontrolleri şeridini beklemez.
- Yerel olarak bir sürüm adayı etiketlemeden önce `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` çalıştırın. Yardımcı, GitHub yayım iş akışı başlamadan önce onayı sıkça engelleyen hataları yakalayacak sırayla hızlı sürüm korumalarını, plugin npm/ClawHub sürüm kontrollerini, derlemeyi, kullanıcı arayüzü derlemesini ve `release:openclaw:npm:check` çalıştırır.
- Onaydan önce `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (veya eşleşen ön sürüm/düzeltme etiketi) çalıştırın.
- npm yayımından sonra, yayımlanmış kayıt defteri kurulum yolunu yeni bir geçici ön ekte doğrulamak için `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (veya eşleşen beta/düzeltme sürümü) çalıştırın.
- Bir beta yayımından sonra, paylaşılan kiralık Telegram kimlik bilgisi havuzunu kullanarak yayımlanmış npm paketine karşı kurulu paket ilk kullanım akışını, Telegram kurulumunu ve gerçek Telegram E2E'yi doğrulamak için `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` çalıştırın. Yerel bakımcıya özel tek seferlik çalıştırmalar Convex değişkenlerini atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` ortam kimlik bilgisini doğrudan iletebilir.
- Yayım sonrası tam beta duman testini bir bakımcı makinesinden çalıştırmak için `pnpm release:beta-smoke -- --beta betaN` kullanın. Yardımcı, Parallels npm güncelleme/yeni hedef doğrulamasını çalıştırır, `NPM Telegram Beta E2E` tetikler, tam iş akışı çalıştırmasını yoklar, yapıtı indirir ve Telegram raporunu yazdırır.
- Bakımcılar aynı yayım sonrası kontrolü manuel `NPM Telegram Beta E2E` iş akışı aracılığıyla GitHub Actions üzerinden çalıştırabilir. Bu iş akışı kasıtlı olarak yalnızca manueldir ve her birleştirmede çalışmaz.
- Bakımcı sürüm otomasyonu önce ön kontrol, ardından yükseltme yöntemini kullanır:
  - Gerçek npm yayımı, başarılı bir npm `preflight_run_id` kontrolünden geçmelidir.
  - Düzenli beta ve kararlı yayım düzenlemesi ile ön kontrol, tam hedef etikete karşı güvenilir `main` kullanır. Tideclaw alfa yayımı ve ön kontrolü eşleşen alfa dalını kullanır.
  - Kararlı npm sürümleri varsayılan olarak `beta` kullanır; kararlı npm yayımı, iş akışı girdisi aracılığıyla açıkça `latest` hedefleyebilir.
  - Belirteç tabanlı npm dağıtım etiketi değişikliği `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` içinde bulunur; çünkü kaynak depo yalnızca OIDC yayımını korurken `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirir.
  - Herkese açık `macOS Release` yalnızca doğrulama amaçlıdır; bir etiket yalnızca bir sürüm dalında bulunuyor ancak iş akışı `main` üzerinden tetikleniyorsa `public_release_branch=release/YYYY.M.PATCH` ayarlayın.
  - Gerçek macOS yayımı, başarılı macOS `preflight_run_id` ve `validate_run_id` kontrollerinden geçmelidir.
  - Gerçek yayım yolları, hazırlanmış yapıtları yeniden derlemek yerine yükseltir.
- `YYYY.M.PATCH-N` gibi kararlı düzeltme sürümlerinde yayım sonrası doğrulayıcı, sürüm düzeltmelerinin eski genel kurulumları sessizce temel kararlı yükte bırakmaması için `YYYY.M.PATCH` sürümünden `YYYY.M.PATCH-N` sürümüne aynı geçici ön ek yükseltme yolunu da kontrol eder.
- npm sürümü ön kontrolü, tarball hem `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` yükü içermediği sürece kapalı biçimde başarısız olur; böylece boş bir tarayıcı panosunu yeniden dağıtmayız.
- Yayım sonrası doğrulama, yayımlanmış plugin giriş noktalarının ve paket meta verilerinin kurulu kayıt defteri düzeninde bulunduğunu da kontrol eder. Eksik plugin çalışma zamanı yükleriyle dağıtılan bir sürüm yayım sonrası doğrulayıcıda başarısız olur ve `latest` sürümüne yükseltilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball'ında npm pack `unpackedSize` bütçesini de uygular; böylece yükleyici e2e, sürüm yayım yolundan önce kazara oluşan paket şişmesini yakalar.
- Sürüm çalışması CI planlamasına, uzantı zamanlama bildirimlerine veya uzantı test matrislerine dokunduysa, sürüm notlarının eski bir CI düzenini açıklamaması için onaydan önce planlayıcıya ait `plugin-prerelease-extension-shard` matris çıktılarını `.github/workflows/plugin-prerelease.yml` üzerinden yeniden oluşturup inceleyin.
- Kararlı macOS sürüm hazırlığı güncelleyici yüzeylerini de kapsar: GitHub sürümü paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır; `main` üzerindeki `appcast.xml`, yayım sonrasında yeni kararlı zip dosyasını göstermelidir (macOS yayım iş akışı bunu otomatik olarak kaydeder veya doğrudan gönderim engellenirse bir appcast PR'ı açar); paketlenmiş uygulama hata ayıklama olmayan bir paket kimliğini, boş olmayan bir Sparkle besleme URL'sini ve söz konusu sürüm için standart Sparkle derleme tabanına eşit veya bundan yüksek bir `CFBundleVersion` değerini korumalıdır.

## Sürüm test kutuları

`Full Release Validation`, operatörlerin tam ürün matrisini tek bir giriş noktasından başlatma yöntemidir. Her alt iş akışının tek bir güvenilir `main` iş akışı SHA'sına sabitlenmiş geçici bir daldan çalışmasını ve istenen kaydın test edilen aday olarak kalmasını sağlamak için yardımcıyı kullanın:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

Yardımcı mevcut `origin/main` verisini getirir, bu güvenilir iş akışı kaydında `release-ci/<workflow-sha>-...` gönderir, alfa/beta paket sürümlerinden `beta`, diğer durumlarda `stable` çıkarır, geçici daldan `ref=<target-sha>` ile `Full Release Validation` tetikler, her alt iş akışı `headSha` değerinin sabitlenmiş üst iş akışı SHA'sıyla eşleştiğini doğrular ve ardından geçici dalı siler. Yeni bir çalıştırmayı zorlamak için `-f reuse_evidence=false`, geniş danışma taraması için `-f release_profile=full` veya mevcut `origin/main` üzerinden hâlâ erişilebilir olan eski bir kaydı sabitlemek için `--workflow-sha <trusted-main-sha>` iletin. İş akışının kendisi depo referanslarını hiçbir zaman yazmaz. Bu yaklaşım, adaya araç kaydı eklemeden yalnızca main üzerindeki sürüm araçlarını kullanılabilir tutar ve yanlışlıkla daha yeni bir `main` alt çalıştırmasını kanıtlamayı önler.

Kod SHA'sı başarılı olduktan sonra yalnızca `CHANGELOG.md` kaydedin ve aynı yardımcıyı Sürüm SHA'sıyla çalıştırın:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

İkinci üst iş akışı, yalnızca GitHub Sürüm SHA'sının Kod SHA'sından türediğini ve değişen yolların tamamının tam olarak `CHANGELOG.md` olduğunu kanıtlarsa ürün kanıtlarını yeniden kullanır. `changelog-only-release-v1` kaydeder ve hiçbir ürün alt iş akışını tetiklemez. Tarball baytları değiştiği için npm ön kontrolü ve paket/kurulum kabulü yine de Sürüm SHA'sında çalışır.

Yeni bir Kod SHA'sı için iş akışı hedefi çözümler, manuel `CI` tetikler ve ardından `OpenClaw Release Checks` tetikler. `OpenClaw Release Checks`; kurulum duman testini, işletim sistemleri arası sürüm kontrollerini, bekletme etkinleştirildiğinde canlı/E2E Docker sürüm yolu kapsamını, standart Telegram paket E2E'siyle Paket Kabulünü, QA Lab eşliğini, canlı Matrix'i ve canlı Telegram'ı dağıtır. Tam/tümü çalıştırması yalnızca `Full Release Validation` özeti `normal_ci`, `plugin_prerelease` ve `release_checks` değerlerini başarılı olarak gösterdiğinde kabul edilebilir; bunun tek istisnası, odaklı bir yeniden çalıştırmanın ayrı `Plugin Prerelease` alt iş akışını kasıtlı olarak atlamasıdır. Bağımsız `npm-telegram` alt iş akışını yalnızca `release_package_spec` veya `npm_telegram_package_spec` ile yayımlanmış pakete odaklanan yeniden çalıştırmalar için kullanın. Son doğrulayıcı özeti, her alt çalıştırma için en yavaş iş tablolarını içerir; böylece sürüm yöneticisi günlükleri indirmeden mevcut kritik yolu görebilir.

Ürün performansı alt iş akışı bu sürüm yolunda yalnızca yapıt içindir. Üst iş akışı
onu `publish_reports=false` ile tetikler ve yalnızca yapıta yönelik koruması Clawgrit rapor
yayımcısının atlanmış kaldığını kanıtlamadıkça doğrulama reddedilir.

Tam aşama matrisi, tam iş akışı işi adları, kararlı ve tam profil farklılıkları, yapıtlar ve odaklı yeniden çalıştırma tanıtıcıları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.

Alt iş akışları, `Full Release Validation` çalıştıran SHA'ya sabitlenmiş güvenilir referanstan tetiklenir. Her alt çalıştırma tam üst iş akışı SHA'sını kullanmalıdır. Sürüm kanıtı için ham `--ref main -f ref=<sha>` tetiklemelerini kullanmayın; `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH` kullanın.

Canlı/sağlayıcı kapsamını seçmek için `release_profile` kullanın:

- `beta`: en hızlı, sürüm açısından kritik OpenAI/çekirdek canlı ve Docker yolu
- `stable`: sürüm onayı için beta ile kararlı sağlayıcı/arka uç kapsamı
- `full`: kararlı ile geniş danışma sağlayıcısı/medya kapsamı

Kararlı ve tam doğrulama, yükseltmeden önce her zaman kapsamlı canlı/E2E, Docker sürüm yolu ve sınırlandırılmış yayımlanmış yükseltme sağkalım taramasını çalıştırır. Aynı taramayı beta için istemek üzere `run_release_soak=true` kullanın. Bu tarama, en son dört kararlı paketin yanı sıra sabitlenmiş `2026.4.23` ve `2026.5.2` tabanlarını ve daha eski `2026.4.15` kapsamını içerir; yinelenen tabanlar kaldırılır ve her taban kendi Docker çalıştırıcı işine bölünür.

`OpenClaw Release Checks`, hedef referansı bir kez `release-package-under-test` olarak çözümlemek için güvenilir iş akışı referansını kullanır ve bekletme çalışırken bu yapıtı işletim sistemleri arası, Paket Kabulü ve sürüm yolu Docker kontrollerinde yeniden kullanır. Bu, paketle ilgili tüm kutuların aynı baytları kullanmasını sağlar ve yinelenen paket derlemelerini önler. Bir beta npm'de zaten bulunuyorsa, sürüm kontrollerinin dağıtılmış paketi bir kez indirmesi, derleme kaynak SHA'sını `dist/build-info.json` içinden çıkarması ve bu yapıtı işletim sistemleri arası, Paket Kabulü, sürüm yolu Docker ve paket Telegram şeritlerinde yeniden kullanması için `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` ayarlayın.

İşletim sistemleri arası OpenAI kurulum duman testi, depo/kuruluş değişkeni ayarlanmışsa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, aksi takdirde `openai/gpt-5.6-luna` kullanır; çünkü bu şerit en yetenekli modeli kıyaslamak yerine paket kurulumunu, ilk kullanım akışını, Gateway başlatmayı ve tek bir canlı agent çalışmasını kanıtlar. Daha geniş canlı sağlayıcı matrisi, modele özgü kapsamın yeri olmaya devam eder.

Sürüm aşamasına bağlı olarak şu çeşitleri kullanın:

```bash
# Ürünün tamamlanmış Code SHA'sını doğrulayın.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Yalnızca değişiklik günlüğünü içeren Release SHA'sını, Code SHA ürün kanıtını yeniden kullanarak doğrulayın.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# Bir beta yayımladıktan sonra, yayımlanmış paket Telegram E2E'yi ekleyin.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Odaklı bir düzeltmeden sonraki ilk yeniden çalıştırmada tam kapsayıcıyı kullanmayın. Bir kutu başarısız olursa sonraki kanıt için başarısız olan alt iş akışını, işi, Docker hattını, paket profilini, model sağlayıcısını veya QA hattını kullanın. Tam kapsayıcıyı yalnızca düzeltme ortak sürüm orkestrasyonunu değiştirdiğinde veya önceki tüm kutuların kanıtını geçersiz kıldığında yeniden çalıştırın. Kapsayıcının son doğrulayıcısı kaydedilen alt iş akışı çalıştırma kimliklerini yeniden kontrol eder; bu nedenle bir alt iş akışı başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız `Verify full validation` üst işini yeniden çalıştırın.

`rerun_group=all`, sürüm profili, etkin soak ayarı ve doğrulama girdileri eşleştiğinde ve hedef SHA aynı olduğunda ya da yeni hedef, değiştirilmiş yollarının eksiksiz kümesi tam olarak `CHANGELOG.md` olan bir alt öğe olduğunda, önceki başarılı bir kapsayıcı çalıştırmasını yeniden kullanabilir. Tam hedefin yeniden kullanılması `exact-target-full-validation-v1` kaydeder; doğrulama sonrası Release SHA ise `changelog-only-release-v1` kaydeder. İkincisi yalnızca ürün doğrulamasını yeniden kullanır. Npm ön kontrolü, paket baytları, sürüm notu kaynağı ve kurulum/güncelleme kabulü yine de Release SHA üzerinde çalıştırılmalıdır. Sürüme, kaynağa, oluşturulan içeriğe, bağımlılığa, pakete veya iş akışının sahip olduğu hedefe ilişkin herhangi bir değişiklik, yeni bir Code SHA ve yeni bir tam doğrulama gerektirir. Aynı `release/*` ref'i ve yeniden çalıştırma grubu için daha yeni kapsayıcı çalıştırmaları, devam edenlerin otomatik olarak yerini alır. Yeni bir tam çalıştırmayı zorlamak için `reuse_evidence=false` iletin.

Sınırlandırılmış kurtarma için kapsayıcıya `rerun_group` iletin. `all` gerçek sürüm adayı çalıştırmasıdır, `ci` yalnızca normal CI alt öğesini çalıştırır, `plugin-prerelease` yalnızca sürüme özel Plugin alt öğesini çalıştırır, `release-checks` her sürüm kutusunu çalıştırır ve daha dar sürüm grupları `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram`'tür. Odaklı `npm-telegram` yeniden çalıştırmaları `release_package_spec` veya `npm_telegram_package_spec` gerektirir; tam/tüm çalıştırmalar, Package Acceptance içindeki standart paket Telegram E2E'sini kullanır. Odaklı işletim sistemleri arası yeniden çalıştırmalar `cross_os_suite_filter=windows/packaged-upgrade` veya başka bir işletim sistemi/paket filtresi ekleyebilir. QA sürüm denetimi hataları, standart katmandaki gerekli OpenClaw dinamik araç sapması da dâhil olmak üzere normal sürüm doğrulamasını engeller. Tideclaw alfa çalıştırmaları, paket güvenliği dışındaki sürüm denetimi hatlarını yine de bilgilendirici olarak değerlendirebilir. `release_profile=beta` ile `Run repo/live E2E validation` canlı sağlayıcı paketleri bilgilendiricidir (engelleyici değil, uyarı niteliğindedir); kararlı ve tam profiller bunları engelleyici tutar. `live_suite_filter`, Discord, WhatsApp veya Slack gibi geçitli bir QA canlı hattını açıkça istediğinde eşleşen `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` depo değişkeni etkinleştirilmelidir; aksi takdirde hat sessizce atlanmak yerine girdi yakalama başarısız olur.

### Vitest

Vitest kutusu, manuel `CI` alt iş akışıdır. Manuel CI, değişiklik kapsamını kasıtlı olarak atlar ve sürüm adayı için normal test grafiğini zorlar: Linux Node parçaları, paketlenmiş Plugin parçaları, Plugin ve kanal sözleşmesi parçaları, Node 22 uyumluluğu, `check-*`, `check-additional-*`, oluşturulmuş yapıt smoke denetimleri, dokümantasyon denetimleri, Python Skills, Windows, macOS ve Control UI i18n. Kapsayıcı `Full Release Validation` kutusunu çalıştırdığında Android dâhil edilir; çünkü kapsayıcı `include_android=true` iletir. Bağımsız manuel CI, Android kapsamı için `include_android=true` gerektirir.

Bu kutuyu, "kaynak ağacı tam normal test paketini geçti mi?" sorusunu yanıtlamak için kullanın. Sürüm yolu ürün doğrulamasıyla aynı değildir. Saklanacak kanıtlar:

- `Full Release Validation` özeti, gönderilen `CI` çalıştırma URL'sini gösterir
- `CI` çalıştırması tam hedef SHA üzerinde başarılıdır
- regresyonlar araştırılırken CI işlerindeki başarısız veya yavaş parça adları
- bir çalıştırma performans analizi gerektirdiğinde `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama yapıtları

Manuel CI'ı doğrudan yalnızca sürümün belirleyici normal CI'a ihtiyaç duyduğu ancak Docker, QA Lab, canlı, işletim sistemleri arası veya paket kutularına ihtiyaç duymadığı durumlarda çalıştırın. Android içermeyen doğrudan CI için ilk komutu kullanın. Doğrudan sürüm adayı CI'ın Android'i kapsaması gerektiğinde `include_android=true` ekleyin:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker kutusu `OpenClaw Release Checks` ile `openclaw-live-and-e2e-checks-reusable.yml` içinde ve ayrıca sürüm modundaki `install-smoke` iş akışında bulunur. Sürüm adayını yalnızca kaynak düzeyindeki testlerle değil, paketlenmiş Docker ortamları aracılığıyla doğrular.

Sürüm Docker kapsamına şunlar dâhildir:

- yavaş Bun genel kurulum smoke denetimi etkinleştirilmiş tam kurulum smoke denetimi
- hedef SHA'ya göre kök Dockerfile smoke görüntüsü hazırlama/yeniden kullanma; QR, kök/Gateway ve yükleyici/Bun smoke işleri ayrı kurulum-smoke parçaları olarak çalışır
- depo E2E hatları
- sürüm yolu Docker parçaları: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` ile `plugins-runtime-install-h` arası ve `openwebui`
- istendiğinde özel büyük diskli bir çalıştırıcıda OpenWebUI kapsamı
- `bundled-plugin-install-uninstall-0` ile `bundled-plugin-install-uninstall-23` arasındaki bölünmüş paketlenmiş Plugin kurulum/kaldırma hatları
- sürüm denetimleri canlı paketleri içerdiğinde canlı/E2E sağlayıcı paketleri ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker yapıtlarını kullanın. Sürüm yolu zamanlayıcısı; hat günlükleri, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı planı JSON'u ve yeniden çalıştırma komutlarıyla birlikte `.artifacts/docker-tests/` yükler. Odaklı kurtarma için tüm sürüm parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir canlı/E2E iş akışında `docker_lanes=<lane[,lane]>` kullanın. Oluşturulan yeniden çalıştırma komutları, mevcut olduğunda önceki `package_artifact_run_id` ve hazırlanmış Docker görüntüsü girdilerini içerir; böylece başarısız bir hat aynı tarball ve GHCR görüntülerini yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks`'ün parçasıdır. Vitest ve Docker paket mekaniklerinden ayrı olan, aracı davranış ve kanal düzeyindeki sürüm geçididir.

Sürüm QA Lab kapsamına şunlar dâhildir:

- aracı eşlik paketini kullanarak OpenAI aday hattını `anthropic/claude-opus-4-8` temel çizgisiyle karşılaştıran sahte eşlik hattı
- `qa-live-shared` ortamını kullanan Matrix canlı bağdaştırıcı sürüm profili
- Convex CI kimlik bilgisi kiralamalarını kullanan canlı Telegram QA hattı
- sürüm telemetrisi açık yerel kanıt gerektirdiğinde `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` veya `pnpm qa:observability:smoke`

Bu kutuyu, "sürüm QA senaryolarında ve canlı kanal akışlarında doğru davranıyor mu?" sorusunu yanıtlamak için kullanın. Sürümü onaylarken eşlik, Matrix ve Telegram hatlarının yapıt URL'lerini saklayın. Tam Matrix kapsamı, varsayılan sürüm açısından kritik hat yerine manuel, parçalanmış bir QA-Lab çalıştırması olarak kullanılabilir olmaya devam eder.

### Paket

Paket kutusu, kurulabilir ürün geçididir. `Package Acceptance` ve `scripts/resolve-openclaw-package-candidate.mjs` çözümleyicisi tarafından desteklenir. Çözümleyici, bir adayı Docker E2E tarafından tüketilen `package-under-test` tarball'ına normalleştirir, paket envanterini doğrular, paket sürümünü ve SHA-256'yı kaydeder ve iş akışı donanımı ref'ini paket kaynağı ref'inden ayrı tutar.

Desteklenen aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya tam bir OpenClaw sürümü
- `source=ref`: seçilen `workflow_ref` donanımıyla güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketler
- `source=url`: gerekli `package_sha256` ile herkese açık bir HTTPS `.tgz` indirir; URL kimlik bilgileri, varsayılan olmayan HTTPS portları, özel/dâhilî/özel kullanımlı ana bilgisayar adları veya çözümlenen adresler ve güvenli olmayan yönlendirmeler reddedilir
- `source=trusted-url`: `.github/package-trusted-sources.json` içindeki adlandırılmış bir politikadan gerekli `package_sha256` ve `trusted_source_id` ile bir HTTPS `.tgz` indirir; `source=url` için girdi düzeyinde özel ağ atlaması eklemek yerine bakımcıların sahip olduğu kurumsal yansılar veya özel paket depoları için bunu kullanın
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen `.tgz` öğesini yeniden kullanır

`OpenClaw Release Checks`, `source=artifact`, hazırlanmış sürüm paketi yapıtı, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai` ile Package Acceptance'ı çalıştırır. Package Acceptance; geçiş, güncelleme, kök tarafından yönetilen VPS yükseltmesi, yapılandırılmış kimlik doğrulama güncellemesinden sonra yeniden başlatma, canlı ClawHub Skill kurulumu, eski Plugin bağımlılığı temizliği, çevrimdışı Plugin fikstürleri, Plugin güncellemesi, Plugin komut bağlama kaçış sertleştirmesi ve Telegram paket QA'sını aynı çözümlenmiş tarball üzerinde tutar. Engelleyici sürüm denetimleri varsayılan olarak yayımlanmış en son paket temel çizgisini kullanır; `run_release_soak=true`, `release_profile=stable` veya `release_profile=full` içeren beta profili, yayımlanmış yükseltmeden sağ çıkma taramasını `reported-issues` senaryolarıyla `last-stable-4` ile sabitlenmiş `2026.4.23`, `2026.5.2` ve `2026.4.15` temel çizgilerine genişletir. Zaten yayımlanmış bir aday için `source=npm`, yayımlamadan önce SHA destekli yerel npm tarball'ı için `source=ref`, bakımcıların sahip olduğu kurumsal/özel yansı için `source=trusted-url` veya başka bir GitHub Actions çalıştırması tarafından yüklenmiş hazırlanmış tarball için `source=artifact` ile Package Acceptance'ı kullanın.

Bu, önceden Parallels gerektiren paket/güncelleme kapsamının çoğunun GitHub'a özgü karşılığıdır. İşletim sistemine özgü ilk katılım, yükleyici ve platform davranışı için işletim sistemleri arası sürüm denetimleri hâlâ önemlidir; ancak paket/güncelleme ürün doğrulaması Package Acceptance'ı tercih etmelidir.

Güncelleme ve Plugin doğrulaması için standart kontrol listesi [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) sayfasındadır. Hangi yerel, Docker, Package Acceptance veya sürüm denetimi hattının bir Plugin kurulumunu/güncellemesini, doctor temizliğini veya yayımlanmış paket geçişi değişikliğini kanıtladığına karar verirken bunu kullanın. Her kararlı `2026.4.23+` paketinden kapsamlı yayımlanmış güncelleme geçişi, Full Release CI'ın parçası değil, ayrı bir manuel `Update Migration` iş akışıdır.

Eski paket kabul esnekliği kasıtlı olarak zamanla sınırlandırılmıştır. `2026.4.25` sürümüne kadarki paketler, npm'de zaten yayımlanmış meta veri eksiklikleri için uyumluluk yolunu kullanabilir: tarball'da eksik olan özel QA envanter girişleri, eksik `gateway install --wrapper`, tarball'dan türetilmiş git fikstüründe eksik yama dosyaları, eksik kalıcı `update.channel`, eski Plugin kurulum kaydı konumları, eksik pazar yeri kurulum kaydı kalıcılığı ve `plugins update` sırasında yapılandırma meta verisi geçişi. Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel derleme meta verisi damga dosyaları için uyarı verebilir. Daha sonraki paketler modern paket sözleşmelerini karşılamalıdır; aynı eksiklikler sürüm doğrulamasının başarısız olmasına neden olur.

Sürüm sorusu gerçekten kurulabilir bir paketle ilgili olduğunda daha geniş Package Acceptance profilleri kullanın:

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

- `smoke`: hızlı paket yükleme/kanal/ajan, Gateway ağı ve yapılandırmayı yeniden yükleme hatları
- `package`: yükleme/güncelleme/yeniden başlatma/Plugin paketi sözleşmelerinin yanı sıra canlı ClawHub Skills yükleme kanıtı; bu, sürüm denetiminin varsayılanıdır
- `product`: `package` ile birlikte MCP kanalları, Cron/alt ajan temizliği, OpenAI web araması ve OpenWebUI
- `full`: OpenWebUI içeren Docker sürüm yolu parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket adayı Telegram kanıtı için Package Acceptance üzerinde `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` seçeneğini etkinleştirin. İş akışı, çözümlenen `package-under-test` tarball dosyasını Telegram hattına aktarır; bağımsız Telegram iş akışı, yayımlama sonrası denetimler için yayımlanmış bir npm belirtimini kabul etmeye devam eder.

## Düzenli sürüm yayımlama otomasyonu

Beta, `latest`, Plugin, GitHub Release ve platform yayımlaması için
`OpenClaw Release Publish` normal değişiklik yapan giriş noktasıdır. Aylık
`.33+` yalnızca npm extended-stable yolu bu orkestratörü kullanmaz.
Düzenli iş akışı, güvenilir yayımlayıcı iş akışlarını sürümün gerektirdiği
sırada yönetir:

1. Sürüm etiketini kullanıma alın ve commit SHA'sını çözümleyin.
2. Etikete `main` veya `release/*` üzerinden (ya da alfa ön sürümleri için bir Tideclaw alfa dalından) erişilebildiğini doğrulayın.
3. `pnpm plugins:sync:check` çalıştırın.
4. `Plugin NPM Release` iş akışını `publish_scope=all-publishable` ve `ref=<release-sha>` ile tetikleyin.
5. `Plugin ClawHub Release` iş akışını aynı kapsam ve SHA ile tetikleyin.
6. Kaydedilen `full_release_validation_run_id` ve tam çalıştırma denemesi doğrulandıktan sonra `OpenClaw NPM Release` iş akışını sürüm etiketi, npm dist-tag ve kaydedilmiş `preflight_run_id` ile tetikleyin.
7. Kararlı sürümlerde GitHub sürümünü taslak olarak oluşturun veya güncelleyin; `Windows Node Release` iş akışını açıkça belirtilen `windows_node_tag` ve aday tarafından onaylanmış `windows_node_installer_digests` ile tetikleyip standart Windows yükleyici/sağlama toplamı varlıklarını doğrulayın. Ayrıca tam etikete ait imzalı APK'yı, sağlama toplamını ve köken bilgisini oluşturmak için `Android Release` iş akışını tetikleyin. Taslağı yayımlamadan önce her iki yerel varlık sözleşmesini de doğrulayın.

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

Varsayılan beta dist-tag'ine kararlı yayımlama:

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

Doğrudan `latest` hedefine kararlı yükseltme açıkça belirtilmelidir:

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

Alt düzey `Plugin NPM Release` ve `Plugin ClawHub Release` iş akışlarını yalnızca odaklı onarım veya yeniden yayımlama çalışmaları için kullanın. `OpenClaw Release Publish`, `publish_openclaw_npm=true` olduğunda `plugin_publish_scope=selected` seçeneğini reddeder; böylece çekirdek paket, `@openclaw/diffs-language-pack` dâhil yayımlanabilir tüm resmî Plugin'ler olmadan gönderilemez. Seçili bir Plugin onarımı için `publish_openclaw_npm=false` değerini `plugin_publish_scope=selected` ve `plugins=@openclaw/name` ile ayarlayın veya alt iş akışını doğrudan tetikleyin.

İlk yayımlama ClawHub önyüklemesi istisnadır: `Plugin ClawHub New` iş akışını
güvenilir `main` üzerinden tetikleyin ve hedef sürümün tam SHA'sını `ref` aracılığıyla aktarın.
Önyükleme iş akışının kendisini asla sürüm etiketinden veya dalından çalıştırmayın:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

Etiket öncesi doğrulama `dry_run=true` gerektirir, sürüm etiketi ve üst çalıştırma
girdilerini reddeder ve yalnızca `main` veya `release/*` üzerinden erişilebilen tam bir hedefi kabul eder.
ClawHub kimlik bilgilerini yüklemez, paket baytlarını yayımlamaz veya güvenilir
yayımlayıcı yapılandırmasını değiştirmez. İş akışı yine de canlı kayıt defteri planını çözümler,
hedefi yalnızca gizli bilgi içermeyen bir işte kullanıma alıp paketler, kilitli
ClawHub araç zincirini hazırlar ve sürüm etiketi mevcut olmadan önce değişmez yapıyı ve paket
kısa adını/kimliğini doğrular. `clawhub-plugin-bootstrap` ortamını yalnızca
gizli bilgi içermeyen paketleme işleri tamamlandıktan sonra onaylayın; korunan bu doğrulama işinde
kimlik bilgileri veya değişiklik komutları yoktur.

Onaylanmış bir deneme çalıştırması veya etiketleme sonrasındaki gerçek önyükleme; tam
sürüm etiketinin yanı sıra üst `OpenClaw Release Publish` çalıştırma kimliğini, denemesini ve
dalını içermelidir. Üst iş akışı kendi iş akışı SHA'sını ve `Plugin ClawHub New` için ayrı, tam ve güvenilir bir
`main` SHA'sını doğrular; alt çalıştırma ve korunan her
ortam onayı, onaylanan bu alt SHA ile eşleşmelidir. Sürüm etiketi,
her yayımlama denemesinden ve güvenilir yayımlayıcı değişikliğinden önce yeniden denetlenir.

Paketleme işi;
adı, Actions yapı kimliği/özeti, üretici çalıştırması/denemesi, hedef SHA'sı ve paket başına tarball SHA-256/boyutu
doğrulama ve korunan işlere aktarılan değişmez tek bir yapı yükler.
Korunan iş yalnızca güvenilir `main` araçlarını kullanıma alır,
GitHub API aracılığıyla yapı demetini doğrular, tam yapı kimliğine göre indirir,
her tarball dosyasının özetini yeniden hesaplar ve sabitlenmiş CLI'ın USTAR standartlaştırma kurallarıyla yerel TAR yollarını ve
paket kimliğini doğrular. Ardından her aday, sabitlenmiş CLI yayımlama deneme çalıştırmasından geçer; bu işlem,
kayıt defteri aramasından veya kimlik doğrulamadan önce döner. Kimlik bilgisi işinin ön filtresi sıkıştırılmış ClawPack'leri
120 MiB, toplam dosya yükünü 50 MiB, genişletilmiş TAR verisini 64 MiB ve
TAR girdi sayısını 10.000 ile sınırlar. Mevcut paketlerin güvenilir yayımlayıcı onarımı
yalnızca yapılandırma olarak kalır, ancak güvenilir yayımlayıcı
yapılandırmasını değiştirmeden önce yine de hedefi paketler ve istenen etiketin yanı sıra kayıt defteri baytlarının ve meta verilerinin tam eşitliğini gerektirir.
Yayımlama sonrası doğrulama, ClawHub yapısını indirir ve
aynı SHA-256 değerini ve boyutu gerektirir. Başarısız işleri yeniden çalıştırarak kurtarma, önceki
bir denemenin paket yapısını yalnızca tam üretici işi başarıyla
tamamlandığında yeniden kullanabilir. Nihai kanıt ayrıca kilitli ClawHub sürümünü, kilit
SHA-256 değerini ve npm bütünlüğünü bağlar. Bir uyumsuzluk yeni bir paket sürümü gerektirir.

## NPM iş akışı girdileri

`OpenClaw NPM Release`, operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` veya `v2026.4.2-alpha.1` gibi gerekli sürüm etiketi; `preflight_only=true` olduğunda, yalnızca doğrulama amaçlı ön kontrol için geçerli tam 40 karakterli iş akışı dalı commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paketleme için `true`, gerçek yayımlama yolu için `false`
- `preflight_run_id`: mevcut başarılı ön kontrol çalıştırma kimliği; gerçek yayımlama yolunda gereklidir, böylece iş akışı tarball dosyasını yeniden oluşturmak yerine hazırlanmış olanı yeniden kullanır
- `full_release_validation_run_id`: bu etiket/SHA için başarılı `Full Release Validation` çalıştırma kimliği; gerçek yayımlama için gereklidir. Beta yayımlamaları yalnızca ön kontrol ile bir uyarı eşliğinde ilerleyebilir, ancak kararlı/`latest` yükseltmesi için bu yine de gereklidir.
- `full_release_validation_run_attempt`: `full_release_validation_run_id` ile eşleştirilmiş tam pozitif çalıştırma denemesi; yayımlama sırasında yeniden çalıştırmaların yetkilendirme kanıtını değiştirememesi için çalıştırma kimliği sağlandığında her zaman gereklidir.
- `release_publish_run_id`: onaylanmış `OpenClaw Release Publish` çalıştırma kimliği; bu iş akışı söz konusu üst iş akışı tarafından tetiklendiğinde gereklidir (bot aktörü gerçek yayımlama çağrıları)
- `plugin_npm_run_id`: başarılı, tam HEAD `Plugin NPM Release` çalıştırma kimliği; gerçek bir `extended-stable` çekirdek yayımlaması için gereklidir
- `npm_dist_tag`: yayımlama yolunun npm hedef etiketi; `alpha`, `beta`, `latest` veya `extended-stable` değerlerini kabul eder ve varsayılanı `beta` değeridir. Son yama `33` ve sonrakiler `extended-stable` kullanmalıdır; varsayılan olarak `extended-stable` önceki yamaları reddeder ve son olmayan etiketleri her zaman reddeder.
- `bypass_extended_stable_guard`: yalnızca test için kullanılan boole değeri, varsayılanı `false`; `npm_dist_tag=extended-stable` ile sürüm kimliği, yapı, onay ve geri okuma denetimleri korunurken aylık extended-stable uygunluğu atlanır.

`Plugin NPM Release`, mevcut sürüm
davranışı için `npm_dist_tag=default` veya korumalı aylık yol için `npm_dist_tag=extended-stable` kabul eder.
extended-stable seçeneği; `publish_scope=all-publishable`, boş bir
`plugins` girdisi, `33` veya üzeri bir son yama ve tam ucundaki standart
`extended-stable/YYYY.M.33` dalını gerektirir. Plugin
`latest` veya `beta` etiketlerini hiçbir zaman taşımaz. Yeni paket sürümleri, OIDC güvenilir yayımlama (`npm publish --tag extended-stable`) aracılığıyla atomik olarak
`extended-stable` alır; bu
kaynak iş akışı, token ile kimliği doğrulanan `npm dist-tag add` kullanmaz. Yeniden denemeler,
npm'de zaten bulunan tam sürümleri atlar ve ardından tam geri okuma her tam paketin ve `extended-stable` etiketinin yakınsadığını doğrulamadıkça
kapalı biçimde başarısız olur.

`OpenClaw Release Publish`, operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: gerekli sürüm etiketi; zaten mevcut olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` ön kontrol çalıştırma kimliği; `publish_openclaw_npm=true` veya `plugin_publish_scope=all-publishable` olduğunda gereklidir
- `full_release_validation_run_id`: başarılı `Full Release Validation` çalıştırma kimliği; `publish_openclaw_npm=true` veya `plugin_publish_scope=all-publishable` olduğunda gereklidir
- `full_release_validation_run_attempt`: `full_release_validation_run_id` ile eşleştirilmiş tam pozitif deneme; çalıştırma kimliği sağlandığında her zaman gereklidir
- `windows_node_tag`: tam, ön sürüm olmayan `openclaw/openclaw-windows-node` sürüm etiketi; kararlı OpenClaw yayımlaması için gereklidir
- `windows_node_installer_digests`: mevcut Windows yükleyici adlarını sabitlenmiş `sha256:` özetleriyle eşleyen, aday tarafından onaylanmış kompakt JSON eşlemesi; kararlı OpenClaw yayımlaması için gereklidir
- `npm_telegram_run_id`: nihai sürüm kanıtına dâhil edilecek isteğe bağlı, başarılı `NPM Telegram Beta E2E` çalıştırma kimliği
- `npm_dist_tag`: OpenClaw paketinin npm hedef etiketi; `alpha`, `beta` veya `latest` değerlerinden biri
- `plugin_publish_scope`: varsayılanı `all-publishable`; `selected` değerini yalnızca `publish_openclaw_npm=false` ile odaklı, yalnızca Plugin onarım çalışmaları için kullanın
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılanı `true`; yalnızca iş akışını Plugin'e özel bir onarım orkestratörü olarak kullanırken `false` olarak ayarlayın
- `release_profile`: sürüm kanıtı özetlerinde kullanılan sürüm kapsam profili; varsayılanı, bunu doğrulama manifestinden okuyan `from-validation` değeridir veya `beta`, `stable` ya da `full` ile geçersiz kılın
- `wait_for_clawhub`: npm kullanılabilirliğinin ClawHub yan aracı tarafından engellenmemesi için varsayılanı `false`; yalnızca iş akışının tamamlanması ClawHub'ın tamamlanmasını da içermeliyse `true` olarak ayarlayın

`OpenClaw Release Checks`, operatör tarafından denetlenen şu girdileri kabul eder:

- `ref`: doğrulanacak dal, etiket veya tam commit SHA'sı. Gizli bilgi içeren kontroller, çözümlenen commit'in bir OpenClaw dalından veya sürüm etiketinden erişilebilir olmasını gerektirir.
- `run_release_soak`: beta sürüm kontrolleri için kapsamlı canlı/E2E, Docker sürüm yolu ve tüm sürümlerden yükseltme sonrası çalışmayı sürdürenler için dayanıklılık testini etkinleştirir. `release_profile=stable` ve `release_profile=full` tarafından zorunlu olarak etkinleştirilir.

Kurallar:

- `33` yama sürümünün altındaki normal nihai ve düzeltme sürümleri, `beta` veya `latest` seçeneklerinden birine yayımlanabilir. `33` veya üzeri yama sürümündeki nihai sürümler `extended-stable` hedefine yayımlanmalıdır ve bu sınırdaki düzeltme son ekli sürümler reddedilir.
- Beta ön sürüm etiketleri yalnızca `beta` hedefine; alpha ön sürüm etiketleri yalnızca `alpha` hedefine yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca doğrulama içindir
- Gerçek yayımlama yolu, ön kontrolde kullanılan `npm_dist_tag` ile aynı değeri kullanmalıdır; iş akışı, yayımlama devam etmeden önce bu meta verileri doğrular

## Normal beta/latest kararlı sürüm sırası

Bu eski sıra; Plugin'ler, GitHub Release, Windows ve diğer platform çalışmalarını da yöneten normal orkestrasyonlu sürüm içindir. Bu sayfanın üst kısmında belgelenen aylık, yalnızca npm'e yönelik `.33+` genişletilmiş kararlı sürüm yolu değildir.

Normal orkestrasyonlu bir kararlı sürüm hazırlanırken:

1. `OpenClaw NPM Release` komutunu `preflight_only=true` ile çalıştırın. Henüz bir etiket yoksa ön kontrol iş akışının yalnızca doğrulamaya yönelik deneme çalışması için geçerli tam iş akışı dalı commit SHA'sını kullanabilirsiniz.
2. Normal, önce beta akışı için `npm_dist_tag=beta`; yalnızca doğrudan kararlı yayımlamayı bilinçli olarak istediğinizde `latest` seçeneğini belirleyin.
3. Normal CI'ın yanı sıra canlı istem önbelleği, Docker, QA Lab, Matrix ve Telegram kapsamını tek bir manuel iş akışından istediğinizde sürüm dalı, sürüm etiketi veya tam commit SHA'sı üzerinde `Full Release Validation` çalıştırın. Bilinçli olarak yalnızca deterministik normal test grafiğine ihtiyacınız varsa bunun yerine sürüm referansında manuel `CI` iş akışını çalıştırın.
4. İmzalı x64 ve ARM64 yükleyicileri yayımlanacak olan, ön sürüm niteliğinde olmayan kesin `openclaw/openclaw-windows-node` sürüm etiketini seçin. Bunu `windows_node_tag` olarak, doğrulanmış özet eşlemelerini ise `windows_node_installer_digests` olarak kaydedin. Sürüm adayı yardımcısı her ikisini de kaydeder ve oluşturduğu yayımlama komutuna ekler.
5. Başarılı `preflight_run_id`, `full_release_validation_run_id` ve kesin `full_release_validation_run_attempt` değerlerini kaydedin.
6. `OpenClaw Release Publish` komutunu güvenilir `main` üzerinden aynı `tag`, aynı `npm_dist_tag`, seçilen `windows_node_tag`, bunun kaydedilmiş `windows_node_installer_digests` değeri, kaydedilmiş `preflight_run_id`, `full_release_validation_run_id` ve `full_release_validation_run_attempt` ile çalıştırın. OpenClaw npm paketini yükseltmeden önce dışsallaştırılmış Plugin'leri npm ve ClawHub'a yayımlar.
7. Sürüm `beta` üzerinde yayımlandıysa bu kararlı sürümü `beta` konumundan `latest` konumuna yükseltmek için `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` iş akışını kullanın.
8. Sürüm bilinçli olarak doğrudan `latest` hedefine yayımlandıysa ve `beta` aynı kararlı derlemeyi hemen izlemeliyse her iki dist-tag'i de kararlı sürüme yönlendirmek için aynı sürüm iş akışını kullanın veya zamanlanmış kendi kendini onaran eşitlemenin `beta` değerini daha sonra taşımasına izin verin.

Dist-tag değişikliği, hâlâ `NPM_TOKEN` gerektirdiği için sürüm kayıt deposunda bulunur; kaynak deposu ise yalnızca OIDC ile yayımlamayı sürdürür. Böylece hem doğrudan yayımlama yolu hem de önce beta yükseltme yolu belgelenmiş ve operatörlerce görülebilir kalır.

Bir bakım sorumlusunun yerel npm kimlik doğrulamasına geri dönmesi gerekiyorsa tüm 1Password CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumunda çalıştırın. `op` komutunu doğrudan ana ajan kabuğundan çağırmayın; tmux içinde tutmak istemlerin, uyarıların ve OTP işlemlerinin gözlemlenebilmesini sağlar ve yinelenen ana makine uyarılarını önler.

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

Bakım sorumluları gerçek çalıştırma kılavuzu için [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) içindeki özel sürüm belgelerini kullanır.

## İlgili

- [Sürüm kanalları](/tr/install/development-channels)
