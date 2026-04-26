---
read_when:
    - Mevcut bir Matrix kurulumunu yükseltme
    - Şifrelenmiş Matrix geçmişini ve cihaz durumunu taşıma
summary: OpenClaw'ın önceki Matrix Plugin'ini yerinde nasıl yükselttiği; şifrelenmiş durum kurtarma sınırları ve manuel kurtarma adımları dahil.
title: Matrix taşıması
x-i18n:
    generated_at: "2026-04-26T11:34:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd046436126e6b76b398fb3798b068547ff80769bc9e0e8486908ba22b5f11
    source_path: install/migrating-matrix.md
    workflow: 15
---

Bu sayfa, önceki genel `matrix` Plugin'inden mevcut uygulamaya yükseltmeleri kapsar.

Çoğu kullanıcı için yükseltme yerinde yapılır:

- Plugin `@openclaw/matrix` olarak kalır
- kanal `matrix` olarak kalır
- yapılandırmanız `channels.matrix` altında kalır
- önbelleğe alınmış kimlik bilgileri `~/.openclaw/credentials/matrix/` altında kalır
- çalışma zamanı durumu `~/.openclaw/matrix/` altında kalır

Yapılandırma anahtarlarını yeniden adlandırmanız veya Plugin'i yeni bir ad altında yeniden kurmanız gerekmez.

## Taşımanın otomatik olarak yaptığı işlemler

Gateway başladığında ve [`openclaw doctor --fix`](/tr/gateway/doctor) çalıştırdığınızda, OpenClaw eski Matrix durumunu otomatik olarak onarmaya çalışır.
Herhangi bir uygulanabilir Matrix taşıma adımı disk üzerindeki durumu değiştirmeden önce OpenClaw odaklı bir kurtarma anlık görüntüsü oluşturur veya yeniden kullanır.

`openclaw update` kullandığınızda, tam tetikleyici OpenClaw'ın nasıl kurulduğuna bağlıdır:

- kaynak kurulumları, güncelleme akışı sırasında `openclaw doctor --fix` çalıştırır, ardından varsayılan olarak gateway'i yeniden başlatır
- paket yöneticisi kurulumları paketi günceller, etkileşimsiz bir doctor geçişi çalıştırır, ardından Matrix taşımasının tamamlanabilmesi için varsayılan gateway yeniden başlatmasına güvenir
- `openclaw update --no-restart` kullanırsanız, başlangıç destekli Matrix taşıması siz daha sonra `openclaw doctor --fix` çalıştırıp gateway'i yeniden başlatana kadar ertelenir

Otomatik taşıma şunları kapsar:

- `~/Backups/openclaw-migrations/` altında taşıma öncesi bir anlık görüntü oluşturmak veya yeniden kullanmak
- önbelleğe alınmış Matrix kimlik bilgilerinizi yeniden kullanmak
- aynı hesap seçimini ve `channels.matrix` yapılandırmasını korumak
- en eski düz Matrix senkronizasyon deposunu geçerli hesap kapsamlı konuma taşımak
- hedef hesap güvenli şekilde çözümlenebildiğinde en eski düz Matrix kripto deposunu geçerli hesap kapsamlı konuma taşımak
- bu anahtar yerel olarak mevcutsa, eski rust kripto deposundan daha önce kaydedilmiş bir Matrix oda anahtarı yedek çözme anahtarını çıkarmak
- erişim belirteci daha sonra değiştiğinde aynı Matrix hesabı, homeserver ve kullanıcı için en eksiksiz mevcut token-hash depolama kökünü yeniden kullanmak
- Matrix erişim belirteci değiştiğinde ancak hesap/cihaz kimliği aynı kaldığında bekleyen şifreli durum geri yükleme meta verileri için kardeş token-hash depolama köklerini taramak
- bir sonraki Matrix başlangıcında yedeklenmiş oda anahtarlarını yeni kripto deposuna geri yüklemek

Anlık görüntü ayrıntıları:

- OpenClaw, başarılı bir anlık görüntüden sonra daha sonraki başlangıç ve onarım geçişlerinin aynı arşivi yeniden kullanabilmesi için `~/.openclaw/matrix/migration-snapshot.json` konumuna bir işaretleyici dosya yazar.
- Bu otomatik Matrix taşıma anlık görüntüleri yalnızca yapılandırma + durumu yedekler (`includeWorkspace: false`).
- Matrix yalnızca uyarı düzeyinde taşıma durumuna sahipse, örneğin `userId` veya `accessToken` hâlâ eksik olduğu için, henüz hiçbir Matrix değişikliği uygulanabilir olmadığından OpenClaw anlık görüntü oluşturmaz.
- Anlık görüntü adımı başarısız olursa OpenClaw, kurtarma noktası olmadan durumu değiştirmek yerine o çalıştırmada Matrix taşımasını atlar.

Çoklu hesap yükseltmeleri hakkında:

- en eski düz Matrix deposu (`~/.openclaw/matrix/bot-storage.json` ve `~/.openclaw/matrix/crypto/`) tek depo düzeninden gelmiştir, bu yüzden OpenClaw bunu yalnızca çözümlenmiş tek bir Matrix hesap hedefine taşıyabilir
- zaten hesap kapsamlı eski Matrix depoları, yapılandırılmış Matrix hesap başına algılanır ve hazırlanır

## Taşımanın otomatik olarak yapamayacağı işlemler

Önceki genel Matrix Plugin'i Matrix oda anahtarı yedeklerini otomatik olarak **oluşturmazdı**. Yerel kripto durumunu kalıcılaştırır ve cihaz doğrulaması isterdi, ancak oda anahtarlarınızın homeserver'a yedeklendiğini garanti etmezdi.

Bu, bazı şifreli kurulumların yalnızca kısmen taşınabileceği anlamına gelir.

OpenClaw şunları otomatik olarak kurtaramaz:

- hiç yedeklenmemiş yalnızca yerel oda anahtarları
- `homeserver`, `userId` veya `accessToken` henüz mevcut olmadığı için hedef Matrix hesabı henüz çözümlenemediğinde şifrelenmiş durum
- birden çok Matrix hesabı yapılandırılmış ancak `channels.matrix.defaultAccount` ayarlı değilken tek paylaşılan düz Matrix deposunun otomatik taşınması
- standart Matrix paketi yerine depo yoluna sabitlenmiş özel Plugin yolu kurulumları
- eski depoda yedeklenmiş anahtarlar olduğu hâlde çözme anahtarı yerelde tutulmadığında eksik kurtarma anahtarı

Geçerli uyarı kapsamı:

- özel Matrix Plugin yolu kurulumları hem gateway başlangıcında hem de `openclaw doctor` tarafından gösterilir

Eski kurulumunuzda hiç yedeklenmemiş yalnızca yerel şifreli geçmiş varsa, bazı eski şifreli iletiler yükseltmeden sonra okunamaz kalabilir.

## Önerilen yükseltme akışı

1. OpenClaw'ı ve Matrix Plugin'ini normal şekilde güncelleyin.
   Başlangıcın Matrix taşımasını hemen tamamlayabilmesi için `--no-restart` olmadan düz `openclaw update` tercih edin.
2. Şunu çalıştırın:

   ```bash
   openclaw doctor --fix
   ```

   Matrix'in uygulanabilir taşıma işi varsa, doctor önce taşıma öncesi anlık görüntüyü oluşturur veya yeniden kullanır ve arşiv yolunu yazdırır.

3. Gateway'i başlatın veya yeniden başlatın.
4. Geçerli doğrulama ve yedek durumunu kontrol edin:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Onardığınız Matrix hesabı için kurtarma anahtarını hesap özelinde bir ortam değişkenine koyun. Tek bir varsayılan hesap için `MATRIX_RECOVERY_KEY` yeterlidir. Birden çok hesap için, hesap başına bir değişken kullanın; örneğin `MATRIX_RECOVERY_KEY_ASSISTANT`, ve komuta `--account assistant` ekleyin.

6. OpenClaw size kurtarma anahtarının gerekli olduğunu söylerse, eşleşen hesap için komutu çalıştırın:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Bu cihaz hâlâ doğrulanmamışsa, eşleşen hesap için komutu çalıştırın:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Kurtarma anahtarı kabul edilirse ve yedek kullanılabilirse ancak `Cross-signing verified`
   hâlâ `no` ise, başka bir Matrix istemcisinden öz doğrulamayı tamamlayın:

   ```bash
   openclaw matrix verify self
   ```

   İsteği başka bir Matrix istemcisinde kabul edin, emoji veya ondalık sayıları karşılaştırın
   ve yalnızca eşleşiyorlarsa `yes` yazın. Komut yalnızca
   `Cross-signing verified` değeri `yes` olduğunda başarıyla çıkar.

8. Kurtarılamayan eski geçmişi kasıtlı olarak geride bırakıyor ve gelecekteki iletiler için yeni bir yedek temel çizgisi istiyorsanız şunu çalıştırın:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Henüz sunucu tarafı anahtar yedeği yoksa, gelecekteki kurtarmalar için bir tane oluşturun:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Şifreli taşıma nasıl çalışır

Şifreli taşıma iki aşamalı bir süreçtir:

1. Başlangıç veya `openclaw doctor --fix`, şifreli taşıma uygulanabilirse taşıma öncesi anlık görüntüyü oluşturur veya yeniden kullanır.
2. Başlangıç veya `openclaw doctor --fix`, etkin Matrix Plugin kurulumu üzerinden eski Matrix kripto deposunu inceler.
3. Bir yedek çözme anahtarı bulunursa, OpenClaw bunu yeni kurtarma anahtarı akışına yazar ve oda anahtarı geri yüklemesini beklemede olarak işaretler.
4. Bir sonraki Matrix başlangıcında OpenClaw, yedeklenmiş oda anahtarlarını yeni kripto deposuna otomatik olarak geri yükler.

Eski depo hiç yedeklenmemiş oda anahtarları bildirdiğinde OpenClaw, kurtarmanın başarılı olduğunu varsaymak yerine uyarı verir.

## Yaygın iletiler ve anlamları

### Yükseltme ve algılama iletileri

`Matrix plugin upgraded in place.`

- Anlamı: disk üzerindeki eski Matrix durumu algılandı ve geçerli düzene taşındı.
- Yapılacaklar: aynı çıktı uyarılar da içermiyorsa hiçbir şey.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Anlamı: OpenClaw, Matrix durumunu değiştirmeden önce bir kurtarma arşivi oluşturdu.
- Yapılacaklar: taşımanın başarılı olduğunu doğrulayana kadar yazdırılan arşiv yolunu saklayın.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Anlamı: OpenClaw mevcut bir Matrix taşıma anlık görüntüsü işaretleyicisi buldu ve yinelenen bir yedek oluşturmak yerine o arşivi yeniden kullandı.
- Yapılacaklar: taşımanın başarılı olduğunu doğrulayana kadar yazdırılan arşiv yolunu saklayın.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Anlamı: eski Matrix durumu mevcut, ancak Matrix yapılandırılmadığı için OpenClaw bunu geçerli bir Matrix hesabına eşleyemiyor.
- Yapılacaklar: `channels.matrix` yapılandırın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Anlamı: OpenClaw eski durum buldu, ancak hâlâ tam geçerli hesap/cihaz kökünü belirleyemiyor.
- Yapılacaklar: çalışan bir Matrix oturum açmasıyla gateway'i bir kez başlatın veya önbelleğe alınmış kimlik bilgileri mevcut olduktan sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Anlamı: OpenClaw tek bir paylaşılan düz Matrix deposu buldu, ancak bunun hangi adlandırılmış Matrix hesabına gitmesi gerektiğini tahmin etmeyi reddediyor.
- Yapılacaklar: `channels.matrix.defaultAccount` değerini amaçlanan hesaba ayarlayın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Anlamı: yeni hesap kapsamlı konumda zaten bir senkronizasyon veya kripto deposu var, bu yüzden OpenClaw bunun üzerine otomatik olarak yazmadı.
- Yapılacaklar: çakışan hedefi elle kaldırmadan veya taşımadan önce geçerli hesabın doğru hesap olduğunu doğrulayın.

`Failed migrating Matrix legacy sync store (...)` veya `Failed migrating Matrix legacy crypto store (...)`

- Anlamı: OpenClaw eski Matrix durumunu taşımaya çalıştı, ancak dosya sistemi işlemi başarısız oldu.
- Yapılacaklar: dosya sistemi izinlerini ve disk durumunu inceleyin, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Anlamı: OpenClaw eski bir şifreli Matrix deposu buldu, ancak buna bağlanacak geçerli Matrix yapılandırması yok.
- Yapılacaklar: `channels.matrix` yapılandırın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Anlamı: şifreli depo mevcut, ancak OpenClaw bunun hangi geçerli hesap/cihaza ait olduğuna güvenli şekilde karar veremiyor.
- Yapılacaklar: çalışan bir Matrix oturum açmasıyla gateway'i bir kez başlatın veya önbelleğe alınmış kimlik bilgileri mevcut olduktan sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Anlamı: OpenClaw tek bir paylaşılan düz eski kripto deposu buldu, ancak bunun hangi adlandırılmış Matrix hesabına gitmesi gerektiğini tahmin etmeyi reddediyor.
- Yapılacaklar: `channels.matrix.defaultAccount` değerini amaçlanan hesaba ayarlayın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Anlamı: OpenClaw eski Matrix durumu algıladı, ancak taşıma hâlâ eksik kimlik veya kimlik bilgisi verileri nedeniyle engelleniyor.
- Yapılacaklar: Matrix oturum açma veya yapılandırma kurulumunu tamamlayın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Anlamı: OpenClaw eski şifreli Matrix durumunu buldu, ancak normalde bu depoyu inceleyen Matrix Plugin'indeki yardımcı giriş noktasını yükleyemedi.
- Yapılacaklar: Matrix Plugin'ini yeniden kurun veya onarın (`openclaw plugins install @openclaw/matrix` ya da depo checkout'u için `openclaw plugins install ./path/to/local/matrix-plugin`), ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Anlamı: OpenClaw, Plugin kökünden kaçan veya Plugin sınır denetimlerini geçemeyen bir yardımcı dosya yolu buldu, bu yüzden bunu içe aktarmayı reddetti.
- Yapılacaklar: Matrix Plugin'ini güvenilir bir yoldan yeniden kurun, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Anlamı: OpenClaw, önce kurtarma anlık görüntüsünü oluşturamadığı için Matrix durumunu değiştirmeyi reddetti.
- Yapılacaklar: yedekleme hatasını çözün, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Failed migrating legacy Matrix client storage: ...`

- Anlamı: Matrix istemci tarafı geri dönüşü eski düz depolamayı buldu, ancak taşıma başarısız oldu. OpenClaw artık yeni bir depoyla sessizce başlamak yerine bu geri dönüşü iptal ediyor.
- Yapılacaklar: dosya sistemi izinlerini veya çakışmaları inceleyin, eski durumu bozulmadan tutun ve hatayı düzelttikten sonra yeniden deneyin.

`Matrix is installed from a custom path: ...`

- Anlamı: Matrix bir yol kurulumuna sabitlenmiş, bu nedenle ana sürüm güncellemeleri onu otomatik olarak deponun standart Matrix paketiyle değiştirmez.
- Yapılacaklar: varsayılan Matrix Plugin'ine dönmek istediğinizde `openclaw plugins install @openclaw/matrix` ile yeniden kurun.

### Şifreli durum kurtarma iletileri

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Anlamı: yedeklenmiş oda anahtarları yeni kripto deposuna başarıyla geri yüklendi.
- Yapılacaklar: genellikle hiçbir şey.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Anlamı: bazı eski oda anahtarları yalnızca eski yerel depoda bulunuyordu ve hiçbir zaman Matrix yedeğine yüklenmemişti.
- Yapılacaklar: bu anahtarları başka bir doğrulanmış istemciden elle kurtaramıyorsanız bazı eski şifreli geçmişlerin erişilemez kalmasını bekleyin.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Anlamı: yedek mevcut, ancak OpenClaw kurtarma anahtarını otomatik olarak kurtaramadı.
- Yapılacaklar: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` çalıştırın.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Anlamı: OpenClaw eski şifreli depoyu buldu, ancak kurtarmayı hazırlayacak kadar güvenli biçimde inceleyemedi.
- Yapılacaklar: `openclaw doctor --fix` komutunu yeniden çalıştırın. Tekrarlanırsa eski durum dizinini bozulmadan tutun ve başka bir doğrulanmış Matrix istemcisi artı `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` kullanarak kurtarın.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Anlamı: OpenClaw bir yedek anahtar çakışması algıladı ve geçerli recovery-key dosyasının üzerine otomatik olarak yazmayı reddetti.
- Yapılacaklar: herhangi bir geri yükleme komutunu yeniden denemeden önce hangi kurtarma anahtarının doğru olduğunu doğrulayın.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Anlamı: bu, eski depolama biçiminin katı sınırıdır.
- Yapılacaklar: yedeklenmiş anahtarlar yine de geri yüklenebilir, ancak yalnızca yerel şifreli geçmiş erişilemez kalabilir.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Anlamı: yeni Plugin geri yüklemeyi denedi ancak Matrix hata döndürdü.
- Yapılacaklar: `openclaw matrix verify backup status` çalıştırın, sonra gerekirse `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` ile yeniden deneyin.

### Manuel kurtarma iletileri

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Anlamı: OpenClaw bir yedek anahtarınız olması gerektiğini biliyor, ancak bu cihazda etkin değil.
- Yapılacaklar: `openclaw matrix verify backup restore` çalıştırın veya gerekirse `MATRIX_RECOVERY_KEY` ayarlayıp `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` çalıştırın.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Anlamı: bu cihaz şu anda kurtarma anahtarını saklamıyor.
- Yapılacaklar: `MATRIX_RECOVERY_KEY` ayarlayın, `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` çalıştırın, ardından yedeği geri yükleyin.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Anlamı: saklanan anahtar etkin Matrix yedeğiyle eşleşmiyor.
- Yapılacaklar: `MATRIX_RECOVERY_KEY` değişkenini doğru anahtara ayarlayın ve `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` çalıştırın.

Kurtarılamayan eski şifreli geçmişi kaybetmeyi kabul ediyorsanız, bunun yerine
`openclaw matrix verify backup reset --yes` ile geçerli yedek temel çizgisini sıfırlayabilirsiniz. Saklanan
yedek gizli bilgisi bozuksa, bu sıfırlama yeniden başlatmadan sonra
yeni yedek anahtarının doğru yüklenebilmesi için gizli bilgi depolamasını da yeniden oluşturabilir.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Anlamı: yedek mevcut, ancak bu cihaz çapraz imzalama zincirine henüz yeterince güçlü biçimde güvenmiyor.
- Yapılacaklar: `MATRIX_RECOVERY_KEY` ayarlayın ve `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` çalıştırın.

`Matrix recovery key is required`

- Anlamı: gerekli olduğunda bir kurtarma anahtarı sağlamadan bir kurtarma adımı denediniz.
- Yapılacaklar: komutu `--recovery-key-stdin` ile yeniden çalıştırın; örneğin `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Anlamı: sağlanan anahtar ayrıştırılamadı veya beklenen biçimle eşleşmedi.
- Yapılacaklar: Matrix istemcinizdeki veya recovery-key dosyanızdaki tam kurtarma anahtarıyla yeniden deneyin.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Anlamı: OpenClaw kurtarma anahtarını uygulayabildi, ancak Matrix hâlâ bu cihaz için
  tam çapraz imzalama kimlik güvenini kurmadı. Komut çıktısında
  `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` ve `Device verified by owner` alanlarını kontrol edin.
- Yapılacaklar: `openclaw matrix verify self` çalıştırın, isteği başka bir
  Matrix istemcisinde kabul edin, SAS'ı karşılaştırın ve yalnızca eşleşiyorsa `yes` yazın. Komut,
  başarı bildirmeden önce tam Matrix kimlik güvenini bekler. Yalnızca
  geçerli çapraz imzalama kimliğini bilinçli olarak değiştirmek istediğinizde
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  kullanın.

`Matrix key backup is not active on this device after loading from secret storage.`

- Anlamı: gizli bilgi depolaması bu cihazda etkin bir yedek oturumu üretmedi.
- Yapılacaklar: önce cihazı doğrulayın, sonra `openclaw matrix verify backup status` ile yeniden denetleyin.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Anlamı: cihaz doğrulaması tamamlanana kadar bu cihaz gizli bilgi depolamasından geri yükleme yapamaz.
- Yapılacaklar: önce `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` çalıştırın.

### Özel Plugin kurulum iletileri

`Matrix is installed from a custom path that no longer exists: ...`

- Anlamı: Plugin kurulum kaydınız artık mevcut olmayan yerel bir yolu işaret ediyor.
- Yapılacaklar: `openclaw plugins install @openclaw/matrix` ile yeniden kurun veya bir depo checkout'u üzerinden çalışıyorsanız `openclaw plugins install ./path/to/local/matrix-plugin`.

## Şifreli geçmiş hâlâ geri gelmiyorsa

Bu denetimleri sırayla çalıştırın:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Yedek başarıyla geri yüklenirse ama bazı eski odalarda geçmiş hâlâ eksikse, bu eksik anahtarlar büyük olasılıkla önceki Plugin tarafından hiç yedeklenmemiştir.

## Gelecekteki iletiler için yeni bir başlangıç yapmak istiyorsanız

Kurtarılamayan eski şifreli geçmişi kaybetmeyi kabul ediyor ve bundan sonra yalnızca temiz bir yedek temel çizgisi istiyorsanız, şu komutları sırayla çalıştırın:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Bundan sonra cihaz hâlâ doğrulanmamışsa, SAS emoji veya ondalık kodlarını karşılaştırıp eşleştiğini doğrulayarak Matrix istemcinizden doğrulamayı tamamlayın.

## İlgili sayfalar

- [Matrix](/tr/channels/matrix)
- [Doctor](/tr/gateway/doctor)
- [Taşıma](/tr/install/migrating)
- [Plugin'ler](/tr/tools/plugin)
