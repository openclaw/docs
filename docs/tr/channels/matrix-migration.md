---
read_when:
    - Mevcut bir Matrix kurulumunu yükseltme
    - Şifrelenmiş Matrix geçmişini ve cihaz durumunu taşıma
summary: OpenClaw'ın önceki Matrix Plugin'ini, şifreli durum kurtarma sınırları ve manuel kurtarma adımları dahil olmak üzere, yerinde nasıl yükselttiği.
title: Matrix geçişi
x-i18n:
    generated_at: "2026-05-02T22:16:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bc9b875fef0ae08978061a9fc7cbb076617009d79487ca8329e03076103b32c
    source_path: channels/matrix-migration.md
    workflow: 16
---

Önceki herkese açık `matrix` Plugin uygulamasından mevcut uygulamaya yükseltin.

Çoğu kullanıcı için yükseltme yerinde yapılır:

- Plugin `@openclaw/matrix` olarak kalır
- kanal `matrix` olarak kalır
- yapılandırmanız `channels.matrix` altında kalır
- önbelleğe alınmış kimlik bilgileri `~/.openclaw/credentials/matrix/` altında kalır
- çalışma zamanı durumu `~/.openclaw/matrix/` altında kalır

Yapılandırma anahtarlarını yeniden adlandırmanız veya Plugin'i yeni bir ad altında yeniden yüklemeniz gerekmez.

## Geçişin otomatik olarak yaptıkları

Gateway başladığında ve [`openclaw doctor --fix`](/tr/gateway/doctor) komutunu çalıştırdığınızda, OpenClaw eski Matrix durumunu otomatik olarak onarmaya çalışır.
Eyleme geçirilebilir herhangi bir Matrix geçiş adımı disk üzerindeki durumu değiştirmeden önce, OpenClaw odaklı bir kurtarma anlık görüntüsü oluşturur veya mevcut olanı yeniden kullanır.

`openclaw update` kullandığınızda, kesin tetikleyici OpenClaw'ın nasıl yüklendiğine bağlıdır:

- kaynak kurulumları, güncelleme akışı sırasında `openclaw doctor --fix` çalıştırır ve ardından varsayılan olarak Gateway'i yeniden başlatır
- paket yöneticisi kurulumları paketi günceller, etkileşimsiz bir doctor geçişi çalıştırır ve ardından başlatmanın Matrix geçişini tamamlayabilmesi için varsayılan Gateway yeniden başlatmasına güvenir
- `openclaw update --no-restart` kullanırsanız, başlatma destekli Matrix geçişi daha sonra `openclaw doctor --fix` çalıştırıp Gateway'i yeniden başlatana kadar ertelenir

Otomatik geçiş şunları kapsar:

- `~/Backups/openclaw-migrations/` altında geçiş öncesi bir anlık görüntü oluşturma veya yeniden kullanma
- önbelleğe alınmış Matrix kimlik bilgilerinizi yeniden kullanma
- aynı hesap seçimini ve `channels.matrix` yapılandırmasını koruma
- en eski düz Matrix eşitleme deposunu mevcut hesap kapsamlı konuma taşıma
- hedef hesap güvenli şekilde çözümlenebildiğinde en eski düz Matrix kripto deposunu mevcut hesap kapsamlı konuma taşıma
- daha önce kaydedilmiş bir Matrix oda anahtarı yedeği şifre çözme anahtarını, bu anahtar yerelde mevcut olduğunda eski rust kripto deposundan çıkarma
- erişim belirteci daha sonra değiştiğinde aynı Matrix hesabı, homeserver ve kullanıcı için en eksiksiz mevcut belirteç karması depolama kökünü yeniden kullanma
- Matrix erişim belirteci değiştiğinde ancak hesap/cihaz kimliği aynı kaldığında, bekleyen şifreli durum geri yükleme meta verileri için kardeş belirteç karması depolama köklerini tarama
- bir sonraki Matrix başlatmasında yedeklenmiş oda anahtarlarını yeni kripto deposuna geri yükleme

Anlık görüntü ayrıntıları:

- OpenClaw, başarılı bir anlık görüntüden sonra `~/.openclaw/matrix/migration-snapshot.json` konumuna bir işaretçi dosyası yazar; böylece sonraki başlatma ve onarım geçişleri aynı arşivi yeniden kullanabilir.
- Bu otomatik Matrix geçiş anlık görüntüleri yalnızca yapılandırma + durum yedeği alır (`includeWorkspace: false`).
- Matrix yalnızca uyarı niteliğinde bir geçiş durumuna sahipse, örneğin `userId` veya `accessToken` hâlâ eksik olduğu için, OpenClaw henüz anlık görüntü oluşturmaz çünkü eyleme geçirilebilir bir Matrix mutasyonu yoktur.
- Anlık görüntü adımı başarısız olursa, OpenClaw kurtarma noktası olmadan durumu değiştirmek yerine o çalıştırma için Matrix geçişini atlar.

Çok hesaplı yükseltmeler hakkında:

- en eski düz Matrix deposu (`~/.openclaw/matrix/bot-storage.json` ve `~/.openclaw/matrix/crypto/`) tek depolu bir düzenden gelmiştir; bu nedenle OpenClaw bunu yalnızca çözümlenmiş bir Matrix hesap hedefine geçirebilir
- zaten hesap kapsamlı olan eski Matrix depoları, yapılandırılmış her Matrix hesabı için algılanır ve hazırlanır

## Geçişin otomatik olarak yapamayacakları

Önceki herkese açık Matrix Plugin'i, Matrix oda anahtarı yedeklerini **otomatik** olarak oluşturmuyordu. Yerel kripto durumunu kalıcılaştırıyor ve cihaz doğrulaması istiyordu, ancak oda anahtarlarınızın homeserver'a yedeklendiğini garanti etmiyordu.

Bu, bazı şifreli kurulumların yalnızca kısmen geçirilebileceği anlamına gelir.

OpenClaw şunları otomatik olarak kurtaramaz:

- hiç yedeklenmemiş, yalnızca yerel oda anahtarları
- hedef Matrix hesabı `homeserver`, `userId` veya `accessToken` hâlâ kullanılamadığı için henüz çözümlenemediğinde şifreli durum
- birden fazla Matrix hesabı yapılandırılmış ancak `channels.matrix.defaultAccount` ayarlanmamış olduğunda tek bir paylaşılan düz Matrix deposunun otomatik geçişi
- standart Matrix paketi yerine bir repo yoluna sabitlenmiş özel Plugin yolu kurulumları
- eski depoda yedeklenmiş anahtarlar bulunduğu ancak şifre çözme anahtarı yerelde tutulmadığı durumlarda eksik kurtarma anahtarı

Mevcut uyarı kapsamı:

- özel Matrix Plugin yolu kurulumları hem Gateway başlatması hem de `openclaw doctor` tarafından gösterilir

Eski kurulumunuzda hiç yedeklenmemiş, yalnızca yerel şifreli geçmiş varsa, yükseltmeden sonra bazı eski şifreli mesajlar okunamaz kalabilir.

## Önerilen yükseltme akışı

1. OpenClaw'ı ve Matrix Plugin'ini normal şekilde güncelleyin.
   Başlatmanın Matrix geçişini hemen tamamlayabilmesi için `--no-restart` olmadan düz `openclaw update` tercih edin.
2. Çalıştırın:

   ```bash
   openclaw doctor --fix
   ```

   Matrix'in eyleme geçirilebilir geçiş işi varsa, doctor önce geçiş öncesi anlık görüntüyü oluşturur veya yeniden kullanır ve arşiv yolunu yazdırır.

3. Gateway'i başlatın veya yeniden başlatın.
4. Mevcut doğrulama ve yedek durumunu kontrol edin:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Onardığınız Matrix hesabı için kurtarma anahtarını hesaba özel bir ortam değişkenine koyun. Tek bir varsayılan hesap için `MATRIX_RECOVERY_KEY` uygundur. Birden fazla hesap için, örneğin `MATRIX_RECOVERY_KEY_ASSISTANT` gibi her hesap için ayrı bir değişken kullanın ve komuta `--account assistant` ekleyin.

6. OpenClaw size bir kurtarma anahtarının gerekli olduğunu söylerse, eşleşen hesap için komutu çalıştırın:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Bu cihaz hâlâ doğrulanmamışsa, eşleşen hesap için komutu çalıştırın:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Kurtarma anahtarı kabul edilirse ve yedek kullanılabilir durumdaysa, ancak `Cross-signing verified`
   hâlâ `no` ise, başka bir Matrix istemcisinden kendini doğrulamayı tamamlayın:

   ```bash
   openclaw matrix verify self
   ```

   İsteği başka bir Matrix istemcisinde kabul edin, emojileri veya ondalıkları karşılaştırın
   ve yalnızca eşleştiklerinde `yes` yazın. Komut yalnızca
   `Cross-signing verified` `yes` olduğunda başarıyla çıkar.

8. Kurtarılamaz eski geçmişi bilerek terk ediyorsanız ve gelecekteki mesajlar için yeni bir yedek taban çizgisi istiyorsanız, şunu çalıştırın:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Henüz sunucu tarafı anahtar yedeği yoksa, gelecekteki kurtarmalar için bir tane oluşturun:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Şifreli geçiş nasıl çalışır

Şifreli geçiş iki aşamalı bir süreçtir:

1. Başlatma veya `openclaw doctor --fix`, şifreli geçiş eyleme geçirilebilir durumdaysa geçiş öncesi anlık görüntüyü oluşturur veya yeniden kullanır.
2. Başlatma veya `openclaw doctor --fix`, etkin Matrix Plugin kurulumu üzerinden eski Matrix kripto deposunu inceler.
3. Bir yedek şifre çözme anahtarı bulunursa, OpenClaw bunu yeni kurtarma anahtarı akışına yazar ve oda anahtarı geri yüklemeyi beklemede olarak işaretler.
4. Bir sonraki Matrix başlatmasında, OpenClaw yedeklenmiş oda anahtarlarını yeni kripto deposuna otomatik olarak geri yükler.

Eski depo hiç yedeklenmemiş oda anahtarları bildirirse, OpenClaw kurtarmanın başarılı olduğunu varsaymak yerine uyarır.

## Yaygın iletiler ve anlamları

### Yükseltme ve algılama iletileri

`Matrix plugin upgraded in place.`

- Anlamı: eski disk üzerindeki Matrix durumu algılandı ve mevcut düzene geçirildi.
- Yapılacaklar: aynı çıktı uyarılar da içermiyorsa hiçbir şey yapmanız gerekmez.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Anlamı: OpenClaw, Matrix durumunu değiştirmeden önce bir kurtarma arşivi oluşturdu.
- Yapılacaklar: geçişin başarılı olduğunu doğrulayana kadar yazdırılan arşiv yolunu saklayın.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Anlamı: OpenClaw mevcut bir Matrix geçiş anlık görüntüsü işaretçisi buldu ve yinelenen bir yedek oluşturmak yerine bu arşivi yeniden kullandı.
- Yapılacaklar: geçişin başarılı olduğunu doğrulayana kadar yazdırılan arşiv yolunu saklayın.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Anlamı: eski Matrix durumu mevcut, ancak OpenClaw bunu geçerli bir Matrix hesabına eşleyemiyor çünkü Matrix yapılandırılmamış.
- Yapılacaklar: `channels.matrix` yapılandırın, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya Gateway'i yeniden başlatın.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Anlamı: OpenClaw eski durumu buldu, ancak kesin mevcut hesap/cihaz kökünü hâlâ belirleyemiyor.
- Yapılacaklar: çalışan bir Matrix oturum açma ile Gateway'i bir kez başlatın veya önbelleğe alınmış kimlik bilgileri oluştuktan sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Anlamı: OpenClaw tek bir paylaşılan düz Matrix deposu buldu, ancak hangi adlandırılmış Matrix hesabının bunu alması gerektiğini tahmin etmeyi reddediyor.
- Yapılacaklar: `channels.matrix.defaultAccount` değerini amaçlanan hesaba ayarlayın, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya Gateway'i yeniden başlatın.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Anlamı: yeni hesap kapsamlı konumda zaten bir eşitleme veya kripto deposu var; bu yüzden OpenClaw bunu otomatik olarak üzerine yazmadı.
- Yapılacaklar: çakışan hedefi elle kaldırmadan veya taşımadan önce mevcut hesabın doğru hesap olduğunu doğrulayın.

`Failed migrating Matrix legacy sync store (...)` veya `Failed migrating Matrix legacy crypto store (...)`

- Anlamı: OpenClaw eski Matrix durumunu taşımayı denedi ancak dosya sistemi işlemi başarısız oldu.
- Yapılacaklar: dosya sistemi izinlerini ve disk durumunu inceleyin, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Anlamı: OpenClaw eski bir şifreli Matrix deposu buldu, ancak bunu bağlayacak mevcut bir Matrix yapılandırması yok.
- Yapılacaklar: `channels.matrix` yapılandırın, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya Gateway'i yeniden başlatın.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Anlamı: şifreli depo mevcut, ancak OpenClaw bunun hangi mevcut hesap/cihaza ait olduğuna güvenli şekilde karar veremiyor.
- Yapılacaklar: çalışan bir Matrix oturum açma ile Gateway'i bir kez başlatın veya önbelleğe alınmış kimlik bilgileri kullanılabilir olduktan sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Anlamı: OpenClaw tek bir paylaşılan düz eski kripto deposu buldu, ancak hangi adlandırılmış Matrix hesabının bunu alması gerektiğini tahmin etmeyi reddediyor.
- Yapılacaklar: `channels.matrix.defaultAccount` değerini amaçlanan hesaba ayarlayın, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya Gateway'i yeniden başlatın.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Anlamı: OpenClaw eski Matrix durumunu algıladı, ancak geçiş hâlâ eksik kimlik veya kimlik bilgisi verileri nedeniyle engellenmiş durumda.
- Yapılacaklar: Matrix oturum açmayı veya yapılandırma kurulumunu tamamlayın, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya Gateway'i yeniden başlatın.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Anlamı: OpenClaw eski şifreli Matrix durumunu buldu, ancak normalde bu depoyu inceleyen Matrix Plugin'inden yardımcı giriş noktasını yükleyemedi.
- Yapılacaklar: Matrix Plugin'ini yeniden yükleyin veya onarın (`openclaw plugins install @openclaw/matrix` ya da repo checkout için `openclaw plugins install ./path/to/local/matrix-plugin`), ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya Gateway'i yeniden başlatın.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Anlamı: OpenClaw, Plugin kökünün dışına çıkan veya Plugin sınırı denetimlerinde başarısız olan bir yardımcı dosya yolu buldu, bu yüzden onu içe aktarmayı reddetti.
- Yapılacaklar: Matrix Plugin’ini güvenilir bir yoldan yeniden kurun, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya Gateway’i yeniden başlatın.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Anlamı: OpenClaw, önce kurtarma anlık görüntüsünü oluşturamadığı için Matrix durumunu değiştirmeyi reddetti.
- Yapılacaklar: yedekleme hatasını çözün, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya Gateway’i yeniden başlatın.

`Failed migrating legacy Matrix client storage: ...`

- Anlamı: Matrix istemci tarafı geri dönüş yolu eski düz depolamayı buldu, ancak taşıma başarısız oldu. OpenClaw artık temiz bir depoyla sessizce başlamak yerine bu geri dönüş yolunu iptal eder.
- Yapılacaklar: dosya sistemi izinlerini veya çakışmaları inceleyin, eski durumu sağlam tutun ve hatayı düzelttikten sonra yeniden deneyin.

`Matrix is installed from a custom path: ...`

- Anlamı: Matrix bir yol kurulumuna sabitlenmiş, bu yüzden ana hat güncellemeleri onu otomatik olarak deponun standart Matrix paketiyle değiştirmez.
- Yapılacaklar: varsayılan Matrix Plugin’ine dönmek istediğinizde `openclaw plugins install @openclaw/matrix` ile yeniden kurun.

### Şifreli durum kurtarma iletileri

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Anlamı: yedeklenmiş oda anahtarları yeni kripto deposuna başarıyla geri yüklendi.
- Yapılacaklar: genellikle hiçbir şey yapmanız gerekmez.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Anlamı: bazı eski oda anahtarları yalnızca eski yerel depoda vardı ve Matrix yedeğine hiç yüklenmemişti.
- Yapılacaklar: bu anahtarları başka bir doğrulanmış istemciden elle kurtaramazsanız bazı eski şifreli geçmişin kullanılamaz kalmasını bekleyin.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Anlamı: yedek var, ancak OpenClaw kurtarma anahtarını otomatik olarak kurtaramadı.
- Yapılacaklar: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` komutunu çalıştırın.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Anlamı: OpenClaw eski şifreli depoyu buldu, ancak kurtarmaya hazırlamak için onu yeterince güvenli şekilde inceleyemedi.
- Yapılacaklar: `openclaw doctor --fix` komutunu yeniden çalıştırın. Tekrarlanırsa eski durum dizinini sağlam tutun ve başka bir doğrulanmış Matrix istemcisi ile `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` kullanarak kurtarın.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Anlamı: OpenClaw bir yedek anahtar çakışması algıladı ve geçerli recovery-key dosyasının otomatik olarak üzerine yazmayı reddetti.
- Yapılacaklar: herhangi bir geri yükleme komutunu yeniden denemeden önce hangi kurtarma anahtarının doğru olduğunu doğrulayın.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Anlamı: bu, eski depolama biçiminin kesin sınırıdır.
- Yapılacaklar: yedeklenmiş anahtarlar yine de geri yüklenebilir, ancak yalnızca yerelde bulunan şifreli geçmiş kullanılamaz kalabilir.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Anlamı: yeni Plugin geri yüklemeyi denedi, ancak Matrix bir hata döndürdü.
- Yapılacaklar: `openclaw matrix verify backup status` komutunu çalıştırın, ardından gerekirse `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` ile yeniden deneyin.

### Elle kurtarma iletileri

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Anlamı: OpenClaw bir yedek anahtarınız olması gerektiğini biliyor, ancak bu cihazda etkin değil.
- Yapılacaklar: `openclaw matrix verify backup restore` komutunu çalıştırın veya gerekirse `MATRIX_RECOVERY_KEY` ayarlayıp `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` komutunu çalıştırın.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Anlamı: bu cihazda şu anda kurtarma anahtarı depolanmış değil.
- Yapılacaklar: `MATRIX_RECOVERY_KEY` ayarlayın, `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` komutunu çalıştırın, ardından yedeği geri yükleyin.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Anlamı: depolanan anahtar etkin Matrix yedeğiyle eşleşmiyor.
- Yapılacaklar: `MATRIX_RECOVERY_KEY` değerini doğru anahtara ayarlayın ve `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` komutunu çalıştırın.

Kurtarılamayan eski şifreli geçmişi kaybetmeyi kabul ediyorsanız bunun yerine
geçerli yedek temelini `openclaw matrix verify backup reset --yes` ile sıfırlayabilirsiniz. Depolanan
yedek sırrı bozuk olduğunda bu sıfırlama, yeniden başlatmadan sonra
yeni yedek anahtarının doğru şekilde yüklenebilmesi için gizli depolamayı da yeniden oluşturabilir.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Anlamı: yedek var, ancak bu cihaz çapraz imzalama zincirine henüz yeterince güçlü şekilde güvenmiyor.
- Yapılacaklar: `MATRIX_RECOVERY_KEY` ayarlayın ve `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` komutunu çalıştırın.

`Matrix recovery key is required`

- Anlamı: bir kurtarma anahtarı gerekli olduğu halde kurtarma adımını anahtar sağlamadan denediniz.
- Yapılacaklar: komutu `--recovery-key-stdin` ile yeniden çalıştırın, örneğin `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Anlamı: sağlanan anahtar ayrıştırılamadı veya beklenen biçimle eşleşmedi.
- Yapılacaklar: Matrix istemcinizdeki veya recovery-key dosyanızdaki tam kurtarma anahtarıyla yeniden deneyin.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Anlamı: OpenClaw kurtarma anahtarını uygulayabildi, ancak Matrix bu cihaz için hâlâ
  tam çapraz imzalama kimlik güveni oluşturmadı. Komut çıktısında `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` ve `Device verified by owner` öğelerini kontrol edin.
- Yapılacaklar: `openclaw matrix verify self` komutunu çalıştırın, isteği başka bir
  Matrix istemcisinde kabul edin, SAS’i karşılaştırın ve yalnızca eşleştiğinde `yes` yazın.
  Komut, başarı bildirmeden önce tam Matrix kimlik güvenini bekler. `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  komutunu yalnızca geçerli çapraz imzalama kimliğini bilerek değiştirmek istediğinizde kullanın.

`Matrix key backup is not active on this device after loading from secret storage.`

- Anlamı: gizli depolama bu cihazda etkin bir yedekleme oturumu üretmedi.
- Yapılacaklar: önce cihazı doğrulayın, ardından `openclaw matrix verify backup status` ile yeniden kontrol edin.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Anlamı: cihaz doğrulaması tamamlanana kadar bu cihaz gizli depolamadan geri yükleme yapamaz.
- Yapılacaklar: önce `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` komutunu çalıştırın.

### Özel Plugin kurulum iletileri

`Matrix is installed from a custom path that no longer exists: ...`

- Anlamı: Plugin kurulum kaydınız artık mevcut olmayan yerel bir yolu gösteriyor.
- Yapılacaklar: `openclaw plugins install @openclaw/matrix` ile yeniden kurun veya bir depo checkout’ından çalıştırıyorsanız `openclaw plugins install ./path/to/local/matrix-plugin` kullanın.

## Şifreli geçmiş hâlâ geri gelmiyorsa

Bu denetimleri sırayla çalıştırın:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Yedek başarıyla geri yüklenir ancak bazı eski odalarda hâlâ geçmiş eksikse, bu eksik anahtarlar muhtemelen önceki Plugin tarafından hiç yedeklenmemiştir.

## Gelecekteki iletiler için temiz başlamak istiyorsanız

Kurtarılamayan eski şifreli geçmişi kaybetmeyi kabul ediyor ve bundan sonrası için yalnızca temiz bir yedek temeli istiyorsanız, şu komutları sırayla çalıştırın:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Bundan sonra cihaz hâlâ doğrulanmamışsa, SAS emoji veya ondalık kodlarını karşılaştırıp eşleştiklerini onaylayarak Matrix istemcinizden doğrulamayı tamamlayın.

## İlgili

- [Matrix](/tr/channels/matrix): kanal kurulumu ve yapılandırma.
- [Matrix anında iletme kuralları](/tr/channels/matrix-push-rules): bildirim yönlendirme.
- [Doctor](/tr/gateway/doctor): sistem durumu denetimi ve otomatik geçiş tetikleyicisi.
- [Geçiş kılavuzu](/tr/install/migrating): tüm geçiş yolları (makine taşımaları, sistemler arası içe aktarmalar).
- [Plugins](/tr/tools/plugin): Plugin kurulumu ve kaydı.
