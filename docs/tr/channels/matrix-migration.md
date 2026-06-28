---
read_when:
    - Mevcut bir Matrix kurulumunu yükseltme
    - Şifrelenmiş Matrix geçmişini ve cihaz durumunu taşıma
summary: OpenClaw'ın önceki Matrix Plugin'ini yerinde nasıl yükselttiği, şifrelenmiş durum kurtarma sınırları ve manuel kurtarma adımları dahil.
title: Matrix geçişi
x-i18n:
    generated_at: "2026-06-28T00:13:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 796d27aa3f08388b78e005d5e93ee4a04bc9ae9bb1f214b83c3ba19165042755
    source_path: channels/matrix-migration.md
    workflow: 16
---

Önceki herkese açık `matrix` plugin'inden mevcut uygulamaya yükseltin.

Çoğu kullanıcı için yükseltme yerinde yapılır:

- plugin `@openclaw/matrix` olarak kalır
- kanal `matrix` olarak kalır
- yapılandırmanız `channels.matrix` altında kalır
- önbelleğe alınmış kimlik bilgileri `~/.openclaw/credentials/matrix/` altında kalır
- çalışma zamanı durumu `~/.openclaw/matrix/` altında kalır

Yapılandırma anahtarlarını yeniden adlandırmanız veya plugin'i yeni bir adla yeniden yüklemeniz gerekmez.
Kök `openclaw` paketi artık Matrix çalışma zamanı kodunu veya Matrix SDK
bağımlılıklarını paketlemez. Bir güncellemeden sonra `openclaw channels status` Matrix'in yapılandırıldığını ama
plugin'in eksik olduğunu gösterirse `openclaw doctor --fix` veya
`openclaw plugins install @openclaw/matrix` komutunu çalıştırın; Matrix SDK paketlerini
kök OpenClaw paketine yüklemeyin.

## Geçişin otomatik olarak yaptıkları

Gateway başladığında ve [`openclaw doctor --fix`](/tr/gateway/doctor) komutunu çalıştırdığınızda OpenClaw eski Matrix durumunu otomatik olarak onarmaya çalışır.
İşlem yapılabilir herhangi bir Matrix geçiş adımı disk üzerindeki durumu değiştirmeden önce OpenClaw odaklı bir kurtarma anlık görüntüsü oluşturur veya yeniden kullanır.

`openclaw update` kullandığınızda kesin tetikleyici, OpenClaw'ın nasıl kurulduğuna bağlıdır:

- kaynak kurulumları güncelleme akışı sırasında `openclaw doctor --fix` çalıştırır, ardından varsayılan olarak gateway'i yeniden başlatır
- paket yöneticisi kurulumları paketi günceller, etkileşimsiz bir doctor geçişi çalıştırır, ardından başlangıcın Matrix geçişini tamamlayabilmesi için varsayılan gateway yeniden başlatmasına güvenir
- `openclaw update --no-restart` kullanırsanız başlangıç destekli Matrix geçişi, daha sonra `openclaw doctor --fix` çalıştırıp gateway'i yeniden başlatana kadar ertelenir

Otomatik geçiş şunları kapsar:

- `~/Backups/openclaw-migrations/` altında geçiş öncesi anlık görüntü oluşturma veya yeniden kullanma
- önbelleğe alınmış Matrix kimlik bilgilerinizi yeniden kullanma
- aynı hesap seçimini ve `channels.matrix` yapılandırmasını koruma
- en eski düz Matrix eşitleme deposunu mevcut hesap kapsamlı konuma taşıma
- hedef hesap güvenle çözümlenebildiğinde en eski düz Matrix kripto deposunu mevcut hesap kapsamlı konuma taşıma
- daha önce kaydedilmiş bir Matrix oda anahtarı yedeği şifre çözme anahtarını, bu anahtar yerel olarak mevcut olduğunda eski rust kripto deposundan çıkarma
- erişim belirteci daha sonra değiştiğinde aynı Matrix hesabı, homeserver ve kullanıcı için en eksiksiz mevcut belirteç karması depolama kökünü yeniden kullanma
- Matrix erişim belirteci değişmiş ama hesap/cihaz kimliği aynı kalmışsa bekleyen şifrelenmiş durum geri yükleme meta verileri için kardeş belirteç karması depolama köklerini tarama
- sonraki Matrix başlangıcında yedeklenmiş oda anahtarlarını yeni kripto deposuna geri yükleme

Anlık görüntü ayrıntıları:

- OpenClaw başarılı bir anlık görüntüden sonra `~/.openclaw/matrix/migration-snapshot.json` konumuna bir işaretçi dosyası yazar; böylece sonraki başlangıç ve onarım geçişleri aynı arşivi yeniden kullanabilir.
- Bu otomatik Matrix geçiş anlık görüntüleri yalnızca yapılandırmayı + durumu yedekler (`includeWorkspace: false`).
- Matrix yalnızca uyarı niteliğinde geçiş durumuna sahipse, örneğin `userId` veya `accessToken` hâlâ eksik olduğu için, OpenClaw henüz anlık görüntüyü oluşturmaz çünkü işlem yapılabilir bir Matrix mutasyonu yoktur.
- Anlık görüntü adımı başarısız olursa OpenClaw, kurtarma noktası olmadan durumu değiştirmek yerine o çalıştırma için Matrix geçişini atlar.

Çok hesaplı yükseltmeler hakkında:

- en eski düz Matrix deposu (`~/.openclaw/matrix/bot-storage.json` ve `~/.openclaw/matrix/crypto/`) tek depolu bir düzenden gelmiştir, bu yüzden OpenClaw onu yalnızca çözümlenmiş tek bir Matrix hesap hedefine geçirebilir
- zaten hesap kapsamlı olan eski Matrix depoları, yapılandırılmış her Matrix hesabı için algılanır ve hazırlanır

## Geçişin otomatik olarak yapamadıkları

Önceki herkese açık Matrix plugin'i Matrix oda anahtarı yedeklerini **otomatik olarak** oluşturmazdı. Yerel kripto durumunu kalıcı hale getirir ve cihaz doğrulaması isterdi, ancak oda anahtarlarınızın homeserver'a yedeklendiğini garanti etmezdi.

Bu, bazı şifrelenmiş kurulumların yalnızca kısmen geçirilebileceği anlamına gelir.

OpenClaw şunları otomatik olarak kurtaramaz:

- hiç yedeklenmemiş, yalnızca yerel oda anahtarları
- hedef Matrix hesabı `homeserver`, `userId` veya `accessToken` hâlâ kullanılamadığı için henüz çözümlenemediğinde şifrelenmiş durum
- birden fazla Matrix hesabı yapılandırılmış ama `channels.matrix.defaultAccount` ayarlanmamışsa tek bir paylaşılan düz Matrix deposunun otomatik geçişi
- standart Matrix paketi yerine bir repo yoluna sabitlenmiş özel plugin yolu kurulumları
- eski depoda yedeklenmiş anahtarlar olduğu halde şifre çözme anahtarı yerel olarak tutulmamışsa eksik kurtarma anahtarı

Mevcut uyarı kapsamı:

- özel Matrix plugin yolu kurulumları hem gateway başlangıcı hem de `openclaw doctor` tarafından gösterilir

Eski kurulumunuzda hiç yedeklenmemiş, yalnızca yerel şifrelenmiş geçmiş varsa bazı eski şifrelenmiş mesajlar yükseltmeden sonra okunamaz kalabilir.

## Önerilen yükseltme akışı

1. OpenClaw'ı ve Matrix plugin'ini normal şekilde güncelleyin.
   Başlangıcın Matrix geçişini hemen tamamlayabilmesi için `--no-restart` olmadan düz `openclaw update` komutunu tercih edin.
2. Şunu çalıştırın:

   ```bash
   openclaw doctor --fix
   ```

   Matrix için işlem yapılabilir geçiş işi varsa doctor önce geçiş öncesi anlık görüntüyü oluşturur veya yeniden kullanır ve arşiv yolunu yazdırır.

3. Gateway'i başlatın veya yeniden başlatın.
4. Mevcut doğrulama ve yedekleme durumunu kontrol edin:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Onardığınız Matrix hesabının kurtarma anahtarını hesaba özgü bir ortam değişkenine koyun. Tek bir varsayılan hesap için `MATRIX_RECOVERY_KEY` uygundur. Birden fazla hesap için hesap başına bir değişken kullanın, örneğin `MATRIX_RECOVERY_KEY_ASSISTANT`, ve komuta `--account assistant` ekleyin.

6. OpenClaw size kurtarma anahtarı gerektiğini söylerse eşleşen hesap için komutu çalıştırın:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Bu cihaz hâlâ doğrulanmamışsa eşleşen hesap için komutu çalıştırın:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Kurtarma anahtarı kabul edilirse ve yedek kullanılabiliyorsa, ancak `Cross-signing verified`
   hâlâ `no` ise başka bir Matrix istemcisinden kendi kendine doğrulamayı tamamlayın:

   ```bash
   openclaw matrix verify self
   ```

   İsteği başka bir Matrix istemcisinde kabul edin, emojileri veya ondalıkları karşılaştırın
   ve yalnızca eşleştiklerinde `yes` yazın. Komut yalnızca
   `Cross-signing verified` `yes` olduğunda başarıyla çıkar.

8. Kurtarılamayan eski geçmişi bilerek terk ediyorsanız ve gelecekteki mesajlar için yeni bir yedek temeli istiyorsanız şunu çalıştırın:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Henüz sunucu tarafı anahtar yedeği yoksa gelecekteki kurtarmalar için bir tane oluşturun:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Şifrelenmiş geçiş nasıl çalışır

Şifrelenmiş geçiş iki aşamalı bir süreçtir:

1. Başlangıç veya `openclaw doctor --fix`, şifrelenmiş geçiş işlem yapılabilir durumdaysa geçiş öncesi anlık görüntüyü oluşturur veya yeniden kullanır.
2. Başlangıç veya `openclaw doctor --fix`, eski Matrix kripto deposunu etkin Matrix plugin kurulumu üzerinden inceler.
3. Bir yedek şifre çözme anahtarı bulunursa OpenClaw bunu yeni kurtarma anahtarı akışına yazar ve oda anahtarı geri yüklemeyi beklemede olarak işaretler.
4. Sonraki Matrix başlangıcında OpenClaw yedeklenmiş oda anahtarlarını otomatik olarak yeni kripto deposuna geri yükler.

Eski depo hiç yedeklenmemiş oda anahtarları bildirirse OpenClaw, kurtarma başarılı olmuş gibi davranmak yerine uyarır.

## Yaygın iletiler ve anlamları

### Yükseltme ve algılama iletileri

`Matrix plugin upgraded in place.`

- Anlamı: eski disk üzerindeki Matrix durumu algılandı ve mevcut düzene geçirildi.
- Ne yapılmalı: aynı çıktı uyarılar da içermiyorsa hiçbir şey.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Anlamı: OpenClaw, Matrix durumunu değiştirmeden önce bir kurtarma arşivi oluşturdu.
- Ne yapılmalı: geçişin başarılı olduğunu doğrulayana kadar yazdırılan arşiv yolunu saklayın.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Anlamı: OpenClaw mevcut bir Matrix geçiş anlık görüntüsü işaretçisi buldu ve yinelenen yedek oluşturmak yerine bu arşivi yeniden kullandı.
- Ne yapılmalı: geçişin başarılı olduğunu doğrulayana kadar yazdırılan arşiv yolunu saklayın.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Anlamı: eski Matrix durumu var, ancak Matrix yapılandırılmadığı için OpenClaw bunu mevcut bir Matrix hesabına eşleyemiyor.
- Ne yapılmalı: `channels.matrix` yapılandırın, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Anlamı: OpenClaw eski durumu buldu, ancak hâlâ kesin mevcut hesap/cihaz kökünü belirleyemiyor.
- Ne yapılmalı: çalışan bir Matrix oturum açmasıyla gateway'i bir kez başlatın veya önbelleğe alınmış kimlik bilgileri mevcut olduktan sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Anlamı: OpenClaw tek bir paylaşılan düz Matrix deposu buldu, ancak hangi adlandırılmış Matrix hesabının onu alacağını tahmin etmeyi reddediyor.
- Ne yapılmalı: `channels.matrix.defaultAccount` değerini hedeflenen hesaba ayarlayın, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Anlamı: yeni hesap kapsamlı konumda zaten bir eşitleme veya kripto deposu var, bu yüzden OpenClaw otomatik olarak üzerine yazmadı.
- Ne yapılmalı: çakışan hedefi elle kaldırmadan veya taşımadan önce mevcut hesabın doğru hesap olduğunu doğrulayın.

`Failed migrating Matrix legacy sync store (...)` veya `Failed migrating Matrix legacy crypto store (...)`

- Anlamı: OpenClaw eski Matrix durumunu taşımayı denedi ama dosya sistemi işlemi başarısız oldu.
- Ne yapılmalı: dosya sistemi izinlerini ve disk durumunu inceleyin, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Anlamı: OpenClaw eski bir şifrelenmiş Matrix deposu buldu, ancak bunu iliştirecek mevcut Matrix yapılandırması yok.
- Ne yapılmalı: `channels.matrix` yapılandırın, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Anlamı: şifrelenmiş depo var, ancak OpenClaw bunun hangi mevcut hesap/cihaza ait olduğuna güvenle karar veremiyor.
- Ne yapılmalı: çalışan bir Matrix oturum açmasıyla gateway'i bir kez başlatın veya önbelleğe alınmış kimlik bilgileri mevcut olduktan sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Anlamı: OpenClaw tek bir paylaşılan düz eski kripto deposu buldu, ancak hangi adlandırılmış Matrix hesabının onu alacağını tahmin etmeyi reddediyor.
- Ne yapılmalı: `channels.matrix.defaultAccount` değerini hedeflenen hesaba ayarlayın, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Anlamı: OpenClaw eski Matrix durumunu algıladı, ancak geçiş hâlâ eksik kimlik veya kimlik bilgisi verileri nedeniyle engelleniyor.
- Ne yapılmalı: Matrix oturum açmayı veya yapılandırma kurulumunu tamamlayın, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Anlamı: OpenClaw eski şifreli Matrix durumunu buldu, ancak normalde bu depoyu inceleyen Matrix Plugin'deki yardımcı giriş noktasını yükleyemedi.
- Ne yapılmalı: Matrix Plugin'i yeniden yükleyin veya onarın (`openclaw plugins install @openclaw/matrix` ya da bir repo checkout'u için `openclaw plugins install ./path/to/local/matrix-plugin`), ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Anlamı: OpenClaw, Plugin kökünün dışına çıkan veya Plugin sınırı denetimlerinden geçemeyen bir yardımcı dosya yolu buldu, bu yüzden içe aktarmayı reddetti.
- Ne yapılmalı: Matrix Plugin'i güvenilir bir yoldan yeniden yükleyin, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Anlamı: OpenClaw, önce kurtarma anlık görüntüsünü oluşturamadığı için Matrix durumunu değiştirmeyi reddetti.
- Ne yapılmalı: yedekleme hatasını giderin, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Failed migrating legacy Matrix client storage: ...`

- Anlamı: Matrix istemci tarafı geri dönüşü eski düz depolamayı buldu, ancak taşıma başarısız oldu. OpenClaw artık sessizce yeni bir depo ile başlamak yerine bu geri dönüşü durdurur.
- Ne yapılmalı: dosya sistemi izinlerini veya çakışmaları inceleyin, eski durumu olduğu gibi koruyun ve hatayı düzelttikten sonra yeniden deneyin.

`Matrix is installed from a custom path: ...`

- Anlamı: Matrix bir yol kurulumuna sabitlenmiş, bu yüzden ana hat güncellemeleri onu otomatik olarak reponun standart Matrix paketiyle değiştirmez.
- Ne yapılmalı: varsayılan Matrix Plugin'e dönmek istediğinizde `openclaw plugins install @openclaw/matrix` ile yeniden yükleyin.

### Şifreli durum kurtarma iletileri

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Anlamı: yedeklenmiş oda anahtarları yeni kripto deposuna başarıyla geri yüklendi.
- Ne yapılmalı: genellikle hiçbir şey.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Anlamı: bazı eski oda anahtarları yalnızca eski yerel depoda vardı ve Matrix yedeğine hiç yüklenmemişti.
- Ne yapılmalı: bu anahtarları başka bir doğrulanmış istemciden elle kurtaramazsanız bazı eski şifreli geçmişin kullanılamaz kalmasını bekleyin.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Anlamı: yedek mevcut, ancak OpenClaw kurtarma anahtarını otomatik olarak kurtaramadı.
- Ne yapılmalı: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` komutunu çalıştırın.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Anlamı: OpenClaw eski şifreli depoyu buldu, ancak kurtarmaya hazırlanmak için yeterince güvenli biçimde inceleyemedi.
- Ne yapılmalı: `openclaw doctor --fix` komutunu yeniden çalıştırın. Tekrarlanırsa eski durum dizinini olduğu gibi koruyun ve başka bir doğrulanmış Matrix istemcisi ile `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` kullanarak kurtarın.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Anlamı: OpenClaw bir yedek anahtar çakışması algıladı ve geçerli recovery-key dosyasının otomatik olarak üzerine yazmayı reddetti.
- Ne yapılmalı: herhangi bir geri yükleme komutunu yeniden denemeden önce hangi kurtarma anahtarının doğru olduğunu doğrulayın.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Anlamı: bu, eski depolama biçiminin kesin sınırıdır.
- Ne yapılmalı: yedeklenmiş anahtarlar yine de geri yüklenebilir, ancak yalnızca yerel olan şifreli geçmiş kullanılamaz kalabilir.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Anlamı: yeni Plugin geri yüklemeyi denedi, ancak Matrix bir hata döndürdü.
- Ne yapılmalı: `openclaw matrix verify backup status` komutunu çalıştırın, ardından gerekirse `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` ile yeniden deneyin.

### Elle kurtarma iletileri

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Anlamı: OpenClaw bir yedek anahtarınız olması gerektiğini biliyor, ancak bu cihazda etkin değil.
- Ne yapılmalı: `openclaw matrix verify backup restore` komutunu çalıştırın veya gerekirse `MATRIX_RECOVERY_KEY` ayarlayıp `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` komutunu çalıştırın.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Anlamı: bu cihazda şu anda kurtarma anahtarı depolanmıyor.
- Ne yapılmalı: `MATRIX_RECOVERY_KEY` ayarlayın, `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` komutunu çalıştırın, ardından yedeği geri yükleyin.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Anlamı: depolanan anahtar etkin Matrix yedeğiyle eşleşmiyor.
- Ne yapılmalı: `MATRIX_RECOVERY_KEY` değerini doğru anahtara ayarlayın ve `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` komutunu çalıştırın.

Kurtarılamayan eski şifreli geçmişi kaybetmeyi kabul ediyorsanız bunun yerine
geçerli yedek temel çizgisini `openclaw matrix verify backup reset --yes` ile sıfırlayabilirsiniz. Depolanan
yedek sırrı bozuk olduğunda, bu sıfırlama gizli depolamayı da yeniden oluşturabilir; böylece
yeni yedek anahtarı yeniden başlatmadan sonra doğru şekilde yüklenebilir.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Anlamı: yedek mevcut, ancak bu cihaz çapraz imzalama zincirine henüz yeterince güçlü biçimde güvenmiyor.
- Ne yapılmalı: `MATRIX_RECOVERY_KEY` ayarlayın ve `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` komutunu çalıştırın.

`Matrix recovery key is required`

- Anlamı: bir kurtarma anahtarı gerekli olduğu halde sağlamadan bir kurtarma adımı denediniz.
- Ne yapılmalı: komutu `--recovery-key-stdin` ile yeniden çalıştırın; örneğin `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Anlamı: sağlanan anahtar ayrıştırılamadı veya beklenen biçimle eşleşmedi.
- Ne yapılmalı: Matrix istemcinizdeki veya recovery-key dosyanızdaki tam kurtarma anahtarıyla yeniden deneyin.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Anlamı: OpenClaw kurtarma anahtarını uygulayabildi, ancak Matrix bu cihaz için hâlâ
  tam çapraz imzalama kimlik güveni oluşturmadı. Komut çıktısında
  `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` ve `Device verified by owner` değerlerini denetleyin.
- Ne yapılmalı: `openclaw matrix verify self` komutunu çalıştırın, isteği başka bir
  Matrix istemcisinde kabul edin, SAS'i karşılaştırın ve yalnızca eşleştiğinde `yes` yazın.
  Komut, başarı bildirmeden önce tam Matrix kimlik güvenini bekler. Yalnızca
  geçerli çapraz imzalama kimliğini bilinçli olarak değiştirmek istediğinizde
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  komutunu kullanın.

`Matrix key backup is not active on this device after loading from secret storage.`

- Anlamı: gizli depolama bu cihazda etkin bir yedekleme oturumu üretmedi.
- Ne yapılmalı: önce cihazı doğrulayın, ardından `openclaw matrix verify backup status` ile yeniden denetleyin.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Anlamı: cihaz doğrulaması tamamlanana kadar bu cihaz gizli depolamadan geri yükleyemez.
- Ne yapılmalı: önce `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` komutunu çalıştırın.

### Özel Plugin kurulum iletileri

`Matrix is installed from a custom path that no longer exists: ...`

- Anlamı: Plugin kurulum kaydınız artık mevcut olmayan bir yerel yolu işaret ediyor.
- Ne yapılmalı: `openclaw plugins install @openclaw/matrix` ile yeniden yükleyin veya bir repo checkout'undan çalıştırıyorsanız `openclaw plugins install ./path/to/local/matrix-plugin`.

## Şifreli geçmiş hâlâ geri gelmiyorsa

Bu denetimleri sırayla çalıştırın:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Yedek başarıyla geri yükleniyor ancak bazı eski odalarda hâlâ geçmiş eksikse, bu eksik anahtarlar büyük olasılıkla önceki Plugin tarafından hiç yedeklenmemiştir.

## Gelecekteki iletiler için temiz başlamak istiyorsanız

Kurtarılamayan eski şifreli geçmişi kaybetmeyi kabul ediyor ve yalnızca bundan sonrası için temiz bir yedek temel çizgisi istiyorsanız şu komutları sırayla çalıştırın:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Bundan sonra cihaz hâlâ doğrulanmamışsa, Matrix istemcinizden SAS emoji veya ondalık kodları karşılaştırıp eşleştiklerini onaylayarak doğrulamayı tamamlayın.

## İlgili

- [Matrix](/tr/channels/matrix): kanal kurulumu ve yapılandırması.
- [Matrix push rules](/tr/channels/matrix-push-rules): bildirim yönlendirmesi.
- [Doctor](/tr/gateway/doctor): sağlık denetimi ve otomatik migration tetikleyicisi.
- [Migration guide](/tr/install/migrating): tüm migration yolları (makine taşımaları, sistemler arası içe aktarmalar).
- [Plugins](/tr/tools/plugin): Plugin kurulumu ve kaydı.
