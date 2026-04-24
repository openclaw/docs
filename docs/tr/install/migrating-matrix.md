---
read_when:
    - Mevcut bir Matrix kurulumunu yükseltme
    - Şifrelenmiş Matrix geçmişini ve cihaz durumunu taşıma
summary: OpenClaw'ın önceki Matrix Plugin'ini yerinde nasıl yükselttiği; şifrelenmiş durum kurtarma sınırları ve manuel kurtarma adımları dahil.
title: Matrix taşıması
x-i18n:
    generated_at: "2026-04-24T09:16:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8210f5fbe476148736417eec29dfb5e27c132c6a0bb80753ce254129c14da4f
    source_path: install/migrating-matrix.md
    workflow: 15
---

Bu sayfa, önceki herkese açık `matrix` Plugin'inden mevcut uygulamaya yapılan yükseltmeleri kapsar.

Çoğu kullanıcı için yükseltme yerindedir:

- Plugin `@openclaw/matrix` olarak kalır
- kanal `matrix` olarak kalır
- yapılandırmanız `channels.matrix` altında kalır
- önbelleğe alınmış kimlik bilgileri `~/.openclaw/credentials/matrix/` altında kalır
- çalışma zamanı durumu `~/.openclaw/matrix/` altında kalır

Yapılandırma anahtarlarını yeniden adlandırmanız veya Plugin'i yeni bir adla yeniden kurmanız gerekmez.

## Taşımanın otomatik yaptığı şeyler

Gateway başlatıldığında ve [`openclaw doctor --fix`](/tr/gateway/doctor) çalıştırdığınızda OpenClaw eski Matrix durumunu otomatik olarak onarmaya çalışır.
Eyleme dönüştürülebilir herhangi bir Matrix taşıma adımı disk üzerindeki durumu değiştirmeden önce OpenClaw odaklı bir kurtarma anlık görüntüsü oluşturur veya mevcut olanı yeniden kullanır.

`openclaw update` kullandığınızda, tam tetikleyici OpenClaw'ın nasıl kurulduğuna bağlıdır:

- kaynak kurulumları güncelleme akışı sırasında `openclaw doctor --fix` çalıştırır, ardından varsayılan olarak gateway'i yeniden başlatır
- paket yöneticisi kurulumları paketi günceller, etkileşimsiz bir doctor geçişi çalıştırır, ardından Matrix taşımasının tamamlanabilmesi için varsayılan gateway yeniden başlatmasına güvenir
- `openclaw update --no-restart` kullanırsanız, başlangıç destekli Matrix taşıması daha sonra `openclaw doctor --fix` çalıştırıp gateway'i yeniden başlatana kadar ertelenir

Otomatik taşıma şunları kapsar:

- `~/Backups/openclaw-migrations/` altında taşıma öncesi anlık görüntü oluşturma veya mevcut olanı yeniden kullanma
- önbelleğe alınmış Matrix kimlik bilgilerinizi yeniden kullanma
- aynı hesap seçimini ve `channels.matrix` yapılandırmasını koruma
- en eski düz Matrix senkronizasyon deposunu geçerli hesap kapsamlı konuma taşıma
- hedef hesap güvenle çözümlenebildiğinde en eski düz Matrix şifreleme deposunu geçerli hesap kapsamlı konuma taşıma
- bu anahtar yerel olarak varsa, eski rust crypto deposundan önceden kaydedilmiş bir Matrix oda anahtarı yedek çözme anahtarını çıkarma
- erişim belirteci daha sonra değiştiğinde aynı Matrix hesabı, homeserver ve kullanıcı için en eksiksiz mevcut belirteç hash depolama kökünü yeniden kullanma
- Matrix erişim belirteci değişmiş ancak hesap/cihaz kimliği aynı kalmışsa, bekleyen şifreli durum geri yükleme üst verileri için kardeş belirteç hash depolama köklerini tarama
- bir sonraki Matrix başlangıcında yedeklenmiş oda anahtarlarını yeni crypto deposuna geri yükleme

Anlık görüntü ayrıntıları:

- OpenClaw başarılı bir anlık görüntüden sonra `~/.openclaw/matrix/migration-snapshot.json` konumuna bir işaretleyici dosya yazar; böylece sonraki başlangıç ve onarım geçişleri aynı arşivi yeniden kullanabilir.
- Bu otomatik Matrix taşıma anlık görüntüleri yalnızca yapılandırma + durumu yedekler (`includeWorkspace: false`).
- Matrix yalnızca uyarı düzeyinde taşıma durumuna sahipse, örneğin `userId` veya `accessToken` hâlâ eksikse, OpenClaw henüz anlık görüntü oluşturmaz çünkü uygulanabilir bir Matrix değişikliği yoktur.
- Anlık görüntü adımı başarısız olursa, OpenClaw kurtarma noktası olmadan durumu değiştirmek yerine bu çalıştırma için Matrix taşımasını atlar.

Çoklu hesap yükseltmeleri hakkında:

- en eski düz Matrix deposu (`~/.openclaw/matrix/bot-storage.json` ve `~/.openclaw/matrix/crypto/`) tek depo düzeninden gelmiştir; bu nedenle OpenClaw bunu yalnızca çözümlenmiş bir Matrix hesap hedefine taşıyabilir
- hesap kapsamlı eski Matrix depoları, yapılandırılmış her Matrix hesabı için algılanır ve hazırlanır

## Taşımanın otomatik yapamayacağı şeyler

Önceki herkese açık Matrix Plugin'i **otomatik olarak** Matrix oda anahtarı yedekleri oluşturmuyordu. Yerel crypto durumunu kalıcı hale getiriyor ve cihaz doğrulaması istiyordu, ancak oda anahtarlarınızın homeserver'a yedeklendiğini garanti etmiyordu.

Bu, bazı şifrelenmiş kurulumların yalnızca kısmen taşınabileceği anlamına gelir.

OpenClaw otomatik olarak şunları kurtaramaz:

- hiç yedeklenmemiş yalnızca yerel oda anahtarları
- `homeserver`, `userId` veya `accessToken` hâlâ kullanılamadığı için hedef Matrix hesabı henüz çözümlenemediğinde şifrelenmiş durum
- birden fazla Matrix hesabı yapılandırılmış ama `channels.matrix.defaultAccount` ayarlı değilken tek paylaşılan düz Matrix deposunun otomatik taşınması
- standart Matrix paketi yerine depo yoluna sabitlenmiş özel Plugin yolu kurulumları
- eski depoda yedeklenmiş anahtarlar olduğu halde çözme anahtarını yerelde tutmayan eksik kurtarma anahtarı

Geçerli uyarı kapsamı:

- özel Matrix Plugin yolu kurulumları hem gateway başlangıcında hem de `openclaw doctor` tarafından gösterilir

Eski kurulumunuzda hiç yedeklenmemiş yalnızca yerel şifrelenmiş geçmiş varsa, yükseltmeden sonra bazı eski şifrelenmiş mesajlar okunamaz kalabilir.

## Önerilen yükseltme akışı

1. OpenClaw'ı ve Matrix Plugin'ini normal şekilde güncelleyin.
   Başlangıcın Matrix taşımasını hemen tamamlayabilmesi için `--no-restart` olmadan düz `openclaw update` tercih edin.
2. Şunu çalıştırın:

   ```bash
   openclaw doctor --fix
   ```

   Matrix'te uygulanabilir taşıma işi varsa, doctor önce taşıma öncesi anlık görüntüyü oluşturur veya yeniden kullanır ve arşiv yolunu yazdırır.

3. Gateway'i başlatın veya yeniden başlatın.
4. Geçerli doğrulama ve yedek durumunu kontrol edin:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. OpenClaw size kurtarma anahtarı gerektiğini söylerse şunu çalıştırın:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Bu cihaz hâlâ doğrulanmamışsa şunu çalıştırın:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. Kurtarılamayan eski geçmişi bilinçli olarak terk ediyor ve gelecekteki mesajlar için yeni bir yedek tabanı istiyorsanız şunu çalıştırın:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Henüz sunucu tarafı anahtar yedeği yoksa, gelecekteki kurtarmalar için bir tane oluşturun:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Şifrelenmiş taşıma nasıl çalışır

Şifrelenmiş taşıma iki aşamalı bir süreçtir:

1. Başlangıç veya `openclaw doctor --fix`, şifrelenmiş taşıma uygulanabilirse taşıma öncesi anlık görüntüyü oluşturur veya yeniden kullanır.
2. Başlangıç veya `openclaw doctor --fix`, eski Matrix crypto deposunu etkin Matrix Plugin kurulumu üzerinden inceler.
3. Yedek çözme anahtarı bulunursa, OpenClaw bunu yeni kurtarma anahtarı akışına yazar ve oda anahtarı geri yüklemeyi beklemede olarak işaretler.
4. Bir sonraki Matrix başlangıcında OpenClaw, yedeklenmiş oda anahtarlarını yeni crypto deposuna otomatik olarak geri yükler.

Eski depo hiç yedeklenmemiş oda anahtarları bildirirse, OpenClaw kurtarmanın başarılı olduğunu iddia etmek yerine uyarı verir.

## Yaygın iletiler ve anlamları

### Yükseltme ve algılama iletileri

`Matrix plugin upgraded in place.`

- Anlamı: eski disk üstü Matrix durumu algılandı ve geçerli düzene taşındı.
- Ne yapmalı: aynı çıktı uyarılar içermiyorsa hiçbir şey.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Anlamı: OpenClaw Matrix durumunu değiştirmeden önce bir kurtarma arşivi oluşturdu.
- Ne yapmalı: taşımanın başarılı olduğunu doğrulayıncaya kadar yazdırılan arşiv yolunu saklayın.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Anlamı: OpenClaw mevcut bir Matrix taşıma anlık görüntüsü işaretleyicisi buldu ve yinelenen bir yedek oluşturmak yerine bu arşivi yeniden kullandı.
- Ne yapmalı: taşımanın başarılı olduğunu doğrulayıncaya kadar yazdırılan arşiv yolunu saklayın.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Anlamı: eski Matrix durumu var, ancak OpenClaw bunu geçerli bir Matrix hesabına eşleyemiyor çünkü Matrix yapılandırılmamış.
- Ne yapmalı: `channels.matrix` yapılandırın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Anlamı: OpenClaw eski durumu buldu, ancak hâlâ tam geçerli hesap/cihaz kökünü belirleyemiyor.
- Ne yapmalı: çalışan bir Matrix oturum açmasıyla gateway'i bir kez başlatın veya önbelleğe alınmış kimlik bilgileri oluştuktan sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Anlamı: OpenClaw bir paylaşılan düz Matrix deposu buldu, ancak bunu hangi adlandırılmış Matrix hesabının alması gerektiğini tahmin etmeyi reddediyor.
- Ne yapmalı: amaçlanan hesaba `channels.matrix.defaultAccount` ayarlayın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Anlamı: yeni hesap kapsamlı konumda zaten bir sync veya crypto deposu var, bu yüzden OpenClaw bunu otomatik olarak üzerine yazmadı.
- Ne yapmalı: çakışan hedefi elle kaldırmadan veya taşımadan önce geçerli hesabın doğru hesap olduğunu doğrulayın.

`Failed migrating Matrix legacy sync store (...)` veya `Failed migrating Matrix legacy crypto store (...)`

- Anlamı: OpenClaw eski Matrix durumunu taşımaya çalıştı ancak dosya sistemi işlemi başarısız oldu.
- Ne yapmalı: dosya sistemi izinlerini ve disk durumunu inceleyin, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Anlamı: OpenClaw eski bir şifrelenmiş Matrix deposu buldu, ancak bunu bağlayacak geçerli bir Matrix yapılandırması yok.
- Ne yapmalı: `channels.matrix` yapılandırın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Anlamı: şifrelenmiş depo var, ancak OpenClaw bunun hangi geçerli hesap/cihaza ait olduğuna güvenli şekilde karar veremiyor.
- Ne yapmalı: çalışan bir Matrix oturum açmasıyla gateway'i bir kez başlatın veya önbelleğe alınmış kimlik bilgileri mevcut olduktan sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Anlamı: OpenClaw tek bir paylaşılan düz eski crypto deposu buldu, ancak bunu hangi adlandırılmış Matrix hesabının alması gerektiğini tahmin etmeyi reddediyor.
- Ne yapmalı: amaçlanan hesaba `channels.matrix.defaultAccount` ayarlayın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Anlamı: OpenClaw eski Matrix durumunu algıladı, ancak taşıma hâlâ eksik kimlik veya kimlik bilgisi verileri nedeniyle engellenmiş durumda.
- Ne yapmalı: Matrix oturum açma veya yapılandırma kurulumunu tamamlayın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Anlamı: OpenClaw eski şifrelenmiş Matrix durumunu buldu, ancak normalde bu depoyu inceleyen Matrix Plugin'inden yardımcı giriş noktasını yükleyemedi.
- Ne yapmalı: Matrix Plugin'ini yeniden kurun veya onarın (`openclaw plugins install @openclaw/matrix` ya da depo checkout'u için `openclaw plugins install ./path/to/local/matrix-plugin`), sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Anlamı: OpenClaw, Plugin kökünden kaçan veya Plugin sınır denetimlerini geçemeyen bir yardımcı dosya yolu buldu, bu yüzden onu içe aktarmayı reddetti.
- Ne yapmalı: Matrix Plugin'ini güvenilir bir yoldan yeniden kurun, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Anlamı: OpenClaw, önce kurtarma anlık görüntüsünü oluşturamadığı için Matrix durumunu değiştirmeyi reddetti.
- Ne yapmalı: yedekleme hatasını çözün, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Failed migrating legacy Matrix client storage: ...`

- Anlamı: Matrix istemci tarafı geri dönüşü eski düz depolamayı buldu, ancak taşıma başarısız oldu. OpenClaw artık taze bir depoyla sessizce başlamak yerine bu geri dönüşü iptal eder.
- Ne yapmalı: dosya sistemi izinlerini veya çakışmaları inceleyin, eski durumu bozulmadan koruyun ve hatayı düzelttikten sonra yeniden deneyin.

`Matrix is installed from a custom path: ...`

- Anlamı: Matrix bir yol kurulumuna sabitlenmiş, bu yüzden ana hat güncellemeleri onu deponun standart Matrix paketiyle otomatik olarak değiştirmez.
- Ne yapmalı: varsayılan Matrix Plugin'ine dönmek istediğinizde `openclaw plugins install @openclaw/matrix` ile yeniden kurun.

### Şifrelenmiş durum kurtarma iletileri

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Anlamı: yedeklenmiş oda anahtarları yeni crypto deposuna başarıyla geri yüklendi.
- Ne yapmalı: genellikle hiçbir şey.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Anlamı: bazı eski oda anahtarları yalnızca eski yerel depoda vardı ve hiçbir zaman Matrix yedeğine yüklenmemişti.
- Ne yapmalı: bu anahtarları başka bir doğrulanmış istemciden elle kurtaramadığınız sürece bazı eski şifrelenmiş geçmişin erişilemez kalmasını bekleyin.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Anlamı: yedek mevcut, ancak OpenClaw kurtarma anahtarını otomatik olarak geri getiremedi.
- Ne yapmalı: `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` komutunu çalıştırın.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Anlamı: OpenClaw eski şifrelenmiş depoyu buldu, ancak kurtarmayı hazırlayacak kadar güvenli biçimde inceleyemedi.
- Ne yapmalı: `openclaw doctor --fix` komutunu yeniden çalıştırın. Tekrarlanırsa eski durum dizinini olduğu gibi koruyun ve başka bir doğrulanmış Matrix istemcisi artı `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` ile kurtarma yapın.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Anlamı: OpenClaw bir yedek anahtar çakışması algıladı ve geçerli recovery-key dosyasının üzerine otomatik yazmayı reddetti.
- Ne yapmalı: herhangi bir geri yükleme komutunu yeniden denemeden önce hangi kurtarma anahtarının doğru olduğunu doğrulayın.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Anlamı: bu, eski depolama biçiminin katı sınırıdır.
- Ne yapmalı: yedeklenmiş anahtarlar yine de geri yüklenebilir, ancak yalnızca yerel şifrelenmiş geçmiş erişilemez kalabilir.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Anlamı: yeni Plugin geri yüklemeyi denedi ancak Matrix hata döndürdü.
- Ne yapmalı: `openclaw matrix verify backup status` çalıştırın, ardından gerekirse `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` ile yeniden deneyin.

### Manuel kurtarma iletileri

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Anlamı: OpenClaw bir yedek anahtarınız olması gerektiğini biliyor, ancak bu cihazda etkin değil.
- Ne yapmalı: `openclaw matrix verify backup restore` çalıştırın veya gerekirse `--recovery-key` geçin.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Anlamı: bu cihazda şu anda kurtarma anahtarı saklı değil.
- Ne yapmalı: önce cihazı kurtarma anahtarınızla doğrulayın, sonra yedeği geri yükleyin.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Anlamı: saklanan anahtar etkin Matrix yedeğiyle eşleşmiyor.
- Ne yapmalı: doğru anahtarla `openclaw matrix verify device "<your-recovery-key>"` komutunu yeniden çalıştırın.

Kurtarılamayan eski şifrelenmiş geçmişi kaybetmeyi kabul ederseniz, bunun yerine
geçerli yedek taban çizgisini `openclaw matrix verify backup reset --yes` ile sıfırlayabilirsiniz. Saklanan
yedek gizlisi bozulmuşsa, bu sıfırlama yeniden başlatmadan sonra yeni yedek anahtarının
doğru yüklenebilmesi için gizli depolamayı da yeniden oluşturabilir.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Anlamı: yedek var, ancak bu cihaz çapraz imzalama zincirine henüz yeterince güçlü güvenmiyor.
- Ne yapmalı: `openclaw matrix verify device "<your-recovery-key>"` komutunu yeniden çalıştırın.

`Matrix recovery key is required`

- Anlamı: gerekli olduğu halde bir kurtarma adımını kurtarma anahtarı vermeden denediniz.
- Ne yapmalı: komutu kurtarma anahtarınızla yeniden çalıştırın.

`Invalid Matrix recovery key: ...`

- Anlamı: verilen anahtar ayrıştırılamadı veya beklenen biçimle eşleşmedi.
- Ne yapmalı: Matrix istemcinizdeki veya recovery-key dosyanızdaki tam kurtarma anahtarıyla yeniden deneyin.

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- Anlamı: anahtar uygulandı, ancak cihaz yine de doğrulamayı tamamlayamadı.
- Ne yapmalı: doğru anahtarı kullandığınızı ve hesapta çapraz imzalamanın mevcut olduğunu doğrulayın, ardından yeniden deneyin.

`Matrix key backup is not active on this device after loading from secret storage.`

- Anlamı: gizli depolama bu cihazda etkin bir yedek oturumu üretmedi.
- Ne yapmalı: önce cihazı doğrulayın, sonra `openclaw matrix verify backup status` ile yeniden kontrol edin.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Anlamı: cihaz doğrulaması tamamlanana kadar bu cihaz gizli depolamadan geri yükleyemez.
- Ne yapmalı: önce `openclaw matrix verify device "<your-recovery-key>"` komutunu çalıştırın.

### Özel Plugin kurulum iletileri

`Matrix is installed from a custom path that no longer exists: ...`

- Anlamı: Plugin kurulum kaydınız artık var olmayan yerel bir yola işaret ediyor.
- Ne yapmalı: `openclaw plugins install @openclaw/matrix` ile yeniden kurun veya bir depo checkout'undan çalışıyorsanız `openclaw plugins install ./path/to/local/matrix-plugin`.

## Şifrelenmiş geçmiş hâlâ geri gelmiyorsa

Bu denetimleri sırayla çalıştırın:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Yedek başarıyla geri yükleniyor ama bazı eski odaların geçmişi hâlâ eksikse, bu eksik anahtarlar büyük olasılıkla önceki Plugin tarafından hiç yedeklenmemiştir.

## Gelecekteki mesajlar için temiz başlamak istiyorsanız

Kurtarılamayan eski şifrelenmiş geçmişi kaybetmeyi kabul ediyor ve ileriye dönük yalnızca temiz bir yedek tabanı istiyorsanız, şu komutları sırayla çalıştırın:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Cihaz bundan sonra da doğrulanmamışsa, Matrix istemcinizden SAS emojilerini veya ondalık kodları karşılaştırıp eşleştiğini doğrulayarak doğrulamayı tamamlayın.

## İlgili sayfalar

- [Matrix](/tr/channels/matrix)
- [Doctor](/tr/gateway/doctor)
- [Taşıma](/tr/install/migrating)
- [Plugin'ler](/tr/tools/plugin)
