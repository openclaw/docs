---
read_when:
    - Mevcut bir Matrix kurulumunu yükseltirken
    - Şifreli Matrix geçmişini ve cihaz durumunu geçirirken
summary: OpenClaw'ın önceki Matrix eklentisini yerinde nasıl yükselttiği; şifreli durum kurtarma sınırları ve el ile kurtarma adımları dahil.
title: Matrix geçişi
x-i18n:
    generated_at: "2026-04-05T13:58:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b1ade057d90a524e09756bd981921988c980ea6259f5c4316a796a831e9f83b
    source_path: install/migrating-matrix.md
    workflow: 15
---

# Matrix geçişi

Bu sayfa, önceki herkese açık `matrix` eklentisinden mevcut uygulamaya yükseltmeleri kapsar.

Çoğu kullanıcı için yükseltme yerindedir:

- eklenti `@openclaw/matrix` olarak kalır
- kanal `matrix` olarak kalır
- config'iniz `channels.matrix` altında kalır
- önbelleğe alınmış kimlik bilgileri `~/.openclaw/credentials/matrix/` altında kalır
- çalışma zamanı durumu `~/.openclaw/matrix/` altında kalır

Config anahtarlarını yeniden adlandırmanız veya eklentiyi yeni bir ad altında yeniden kurmanız gerekmez.

## Geçişin otomatik olarak yaptığı şeyler

Gateway başladığında ve [`openclaw doctor --fix`](/gateway/doctor) çalıştırdığınızda, OpenClaw eski Matrix durumunu otomatik olarak onarmaya çalışır.
Eyleme dönüştürülebilir herhangi bir Matrix geçiş adımı disk üzerindeki durumu değiştirmeden önce, OpenClaw odaklı bir kurtarma anlık görüntüsü oluşturur veya yeniden kullanır.

`openclaw update` kullandığınızda tam tetikleyici OpenClaw'ın nasıl kurulduğuna bağlıdır:

- kaynak kurulumları güncelleme akışı sırasında `openclaw doctor --fix` çalıştırır, ardından varsayılan olarak gateway'i yeniden başlatır
- paket yöneticisi kurulumları paketi günceller, etkileşimsiz bir doctor geçişi çalıştırır, ardından Matrix geçişinin başlangıçta tamamlanabilmesi için varsayılan gateway yeniden başlatmasına güvenir
- `openclaw update --no-restart` kullanırsanız, başlangıç destekli Matrix geçişi daha sonra `openclaw doctor --fix` çalıştırıp gateway'i yeniden başlatana kadar ertelenir

Otomatik geçiş şunları kapsar:

- `~/Backups/openclaw-migrations/` altında geçiş öncesi bir anlık görüntü oluşturma veya yeniden kullanma
- önbelleğe alınmış Matrix kimlik bilgilerinizi yeniden kullanma
- aynı hesap seçimini ve `channels.matrix` config'ini koruma
- en eski düz Matrix senkronizasyon deposunu mevcut hesap kapsamlı konuma taşıma
- hedef hesap güvenli şekilde çözümlenebildiğinde en eski düz Matrix şifreleme deposunu mevcut hesap kapsamlı konuma taşıma
- bu anahtar yerelde mevcutsa, eski rust şifreleme deposundan daha önce kaydedilmiş bir Matrix oda anahtarı yedek şifre çözme anahtarını çıkarma
- erişim token'ı daha sonra değiştiğinde, aynı Matrix hesabı, homeserver ve kullanıcı için en eksiksiz mevcut token-hash depolama kökünü yeniden kullanma
- Matrix erişim token'ı değişse ancak hesap/cihaz kimliği aynı kalsa bile, bekleyen şifreli durum geri yükleme meta verileri için kardeş token-hash depolama köklerini tarama
- yedeklenmiş oda anahtarlarını bir sonraki Matrix başlangıcında yeni şifreleme deposuna geri yükleme

Anlık görüntü ayrıntıları:

- OpenClaw başarılı bir anlık görüntüden sonra `~/.openclaw/matrix/migration-snapshot.json` yoluna bir işaretçi dosyası yazar; böylece sonraki başlangıç ve onarım geçişleri aynı arşivi yeniden kullanabilir.
- Bu otomatik Matrix geçiş anlık görüntüleri yalnızca config + durumu yedekler (`includeWorkspace: false`).
- Matrix'te yalnızca uyarı düzeyinde geçiş durumu varsa, örneğin `userId` veya `accessToken` hâlâ eksikse, OpenClaw henüz anlık görüntü oluşturmaz çünkü hiçbir Matrix değişikliği eyleme dönüştürülebilir değildir.
- Anlık görüntü adımı başarısız olursa OpenClaw, kurtarma noktası olmadan durumu değiştirmek yerine bu çalıştırmada Matrix geçişini atlar.

Çok hesaplı yükseltmeler hakkında:

- en eski düz Matrix deposu (`~/.openclaw/matrix/bot-storage.json` ve `~/.openclaw/matrix/crypto/`) tek depo düzeninden geldiği için OpenClaw bunu yalnızca çözümlenmiş tek bir Matrix hesap hedefine geçirebilir
- zaten hesap kapsamlı eski Matrix depoları, yapılandırılmış her Matrix hesabı için algılanır ve hazırlanır

## Geçişin otomatik olarak yapamayacağı şeyler

Önceki herkese açık Matrix eklentisi Matrix oda anahtarı yedeklerini otomatik olarak oluşturmuyordu. Yerel şifreleme durumunu kalıcı hale getiriyor ve cihaz doğrulaması istiyordu, ancak oda anahtarlarınızın homeserver'a yedeklendiğini garanti etmiyordu.

Bu, bazı şifreli kurulumların yalnızca kısmen geçirilebileceği anlamına gelir.

OpenClaw şunları otomatik olarak kurtaramaz:

- hiç yedeklenmemiş yalnızca yerel oda anahtarları
- hedef Matrix hesabı `homeserver`, `userId` veya `accessToken` henüz mevcut olmadığından çözümlenemediğinde şifreli durum
- birden fazla Matrix hesabı yapılandırılmış ama `channels.matrix.defaultAccount` ayarlanmamışken tek bir paylaşılan düz Matrix deposunun otomatik geçişi
- standart Matrix paketi yerine bir repo yoluna sabitlenmiş özel eklenti yolu kurulumları
- eski depo yedeklenmiş anahtarlara sahip olsa ama şifre çözme anahtarını yerelde tutmasa eksik kurtarma anahtarı

Geçerli uyarı kapsamı:

- özel Matrix eklenti yolu kurulumları hem gateway başlangıcı hem de `openclaw doctor` tarafından gösterilir

Eski kurulumunuzda hiç yedeklenmemiş yalnızca yerel şifreli geçmiş varsa, yükseltmeden sonra bazı eski şifreli mesajlar okunamaz kalabilir.

## Önerilen yükseltme akışı

1. OpenClaw'ı ve Matrix eklentisini normal şekilde güncelleyin.
   Matrix geçişinin başlangıçta hemen tamamlanabilmesi için `--no-restart` olmadan düz `openclaw update` tercih edin.
2. Şunu çalıştırın:

   ```bash
   openclaw doctor --fix
   ```

   Matrix'te eyleme dönüştürülebilir geçiş işi varsa doctor önce geçiş öncesi anlık görüntüyü oluşturur veya yeniden kullanır ve arşiv yolunu yazdırır.

3. Gateway'i başlatın veya yeniden başlatın.
4. Geçerli doğrulama ve yedek durumunu denetleyin:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. OpenClaw size bir kurtarma anahtarı gerektiğini söylerse şunu çalıştırın:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Bu cihaz hâlâ doğrulanmamışsa şunu çalıştırın:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. Kurtarılamayan eski geçmişi bilerek bırakıyor ve gelecekteki mesajlar için yeni bir yedek temel çizgisi istiyorsanız şunu çalıştırın:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Henüz sunucu tarafı anahtar yedeği yoksa gelecekteki kurtarmalar için bir tane oluşturun:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Şifreli geçiş nasıl çalışır

Şifreli geçiş iki aşamalı bir süreçtir:

1. Başlangıç veya `openclaw doctor --fix`, şifreli geçiş eyleme dönüştürülebilir durumdaysa geçiş öncesi anlık görüntüyü oluşturur veya yeniden kullanır.
2. Başlangıç veya `openclaw doctor --fix`, eski Matrix şifreleme deposunu etkin Matrix eklenti kurulumu üzerinden inceler.
3. Bir yedek şifre çözme anahtarı bulunursa OpenClaw bunu yeni kurtarma anahtarı akışına yazar ve oda anahtarı geri yüklemesini beklemede olarak işaretler.
4. Bir sonraki Matrix başlangıcında OpenClaw yedeklenmiş oda anahtarlarını otomatik olarak yeni şifreleme deposuna geri yükler.

Eski depo hiç yedeklenmemiş oda anahtarları bildirirse OpenClaw kurtarmanın başarılı olduğunu varsaymak yerine uyarı verir.

## Yaygın mesajlar ve anlamları

### Yükseltme ve algılama mesajları

`Matrix plugin upgraded in place.`

- Anlamı: eski disk üzerindeki Matrix durumu algılandı ve mevcut düzene geçirildi.
- Ne yapmalı: aynı çıktı uyarılar da içermiyorsa hiçbir şey.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Anlamı: OpenClaw, Matrix durumunu değiştirmeden önce bir kurtarma arşivi oluşturdu.
- Ne yapmalı: geçişin başarılı olduğunu doğrulayana kadar yazdırılan arşiv yolunu saklayın.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Anlamı: OpenClaw mevcut bir Matrix geçiş anlık görüntüsü işaretçisi buldu ve yinelenen bir yedek oluşturmak yerine o arşivi yeniden kullandı.
- Ne yapmalı: geçişin başarılı olduğunu doğrulayana kadar yazdırılan arşiv yolunu saklayın.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Anlamı: eski Matrix durumu var, ancak OpenClaw bunu mevcut bir Matrix hesabına eşleyemiyor çünkü Matrix yapılandırılmamış.
- Ne yapmalı: `channels.matrix` yapılandırın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Anlamı: OpenClaw eski durum buldu, ancak hâlâ tam mevcut hesap/cihaz kökünü belirleyemiyor.
- Ne yapmalı: çalışan bir Matrix oturum açmasıyla gateway'i bir kez başlatın veya önbelleğe alınmış kimlik bilgileri mevcut olduktan sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Anlamı: OpenClaw tek bir paylaşılan düz Matrix deposu buldu, ancak bunu hangi adlı Matrix hesabının alması gerektiğini tahmin etmeyi reddediyor.
- Ne yapmalı: `channels.matrix.defaultAccount` değerini amaçlanan hesaba ayarlayın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Anlamı: yeni hesap kapsamlı konumda zaten bir senkronizasyon veya şifreleme deposu var, bu yüzden OpenClaw bunun üzerine otomatik yazmadı.
- Ne yapmalı: çakışan hedefi el ile kaldırmadan veya taşımadan önce mevcut hesabın doğru hesap olduğunu doğrulayın.

`Failed migrating Matrix legacy sync store (...)` veya `Failed migrating Matrix legacy crypto store (...)`

- Anlamı: OpenClaw eski Matrix durumunu taşımayı denedi ancak dosya sistemi işlemi başarısız oldu.
- Ne yapmalı: dosya sistemi izinlerini ve disk durumunu inceleyin, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Anlamı: OpenClaw eski bir şifreli Matrix deposu buldu, ancak buna bağlanacak geçerli bir Matrix config'i yok.
- Ne yapmalı: `channels.matrix` yapılandırın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Anlamı: şifreli depo var, ancak OpenClaw bunun hangi mevcut hesap/cihaza ait olduğuna güvenli şekilde karar veremiyor.
- Ne yapmalı: çalışan bir Matrix oturum açmasıyla gateway'i bir kez başlatın veya önbelleğe alınmış kimlik bilgileri mevcut olduktan sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Anlamı: OpenClaw tek bir paylaşılan düz eski şifreleme deposu buldu, ancak bunu hangi adlı Matrix hesabının alması gerektiğini tahmin etmeyi reddediyor.
- Ne yapmalı: `channels.matrix.defaultAccount` değerini amaçlanan hesaba ayarlayın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Anlamı: OpenClaw eski Matrix durumunu algıladı, ancak geçiş hâlâ eksik kimlik veya kimlik bilgisi verileri nedeniyle engellenmiş durumda.
- Ne yapmalı: Matrix oturum açmasını veya config kurulumunu tamamlayın, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Anlamı: OpenClaw eski şifreli Matrix durumu buldu, ancak bu depoyu normalde inceleyen Matrix eklentisindeki yardımcı giriş noktasını yükleyemedi.
- Ne yapmalı: Matrix eklentisini yeniden kurun veya onarın (`openclaw plugins install @openclaw/matrix` ya da repo checkout'u için `openclaw plugins install ./path/to/local/matrix-plugin`), sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Anlamı: OpenClaw eklenti kökünden kaçan veya eklenti sınır denetimlerini geçemeyen bir yardımcı dosya yolu buldu, bu yüzden içe aktarmayı reddetti.
- Ne yapmalı: Matrix eklentisini güvenilir bir yoldan yeniden kurun, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Anlamı: OpenClaw önce kurtarma anlık görüntüsünü oluşturamadığı için Matrix durumunu değiştirmeyi reddetti.
- Ne yapmalı: yedek hatasını çözün, sonra `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Failed migrating legacy Matrix client storage: ...`

- Anlamı: Matrix istemci tarafı geri dönüşü eski düz depolama buldu, ancak taşıma başarısız oldu. OpenClaw artık sessizce yeni bir depoyla başlamak yerine bu geri dönüşü sonlandırıyor.
- Ne yapmalı: dosya sistemi izinlerini veya çakışmaları inceleyin, eski durumu olduğu gibi koruyun ve hatayı düzelttikten sonra yeniden deneyin.

`Matrix is installed from a custom path: ...`

- Anlamı: Matrix bir yol kurulumu olarak sabitlenmiş, bu nedenle ana akım güncellemeler bunu deponun standart Matrix paketiyle otomatik olarak değiştirmez.
- Ne yapmalı: varsayılan Matrix eklentisine dönmek istediğinizde `openclaw plugins install @openclaw/matrix` ile yeniden kurun.

### Şifreli durum kurtarma mesajları

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Anlamı: yedeklenmiş oda anahtarları yeni şifreleme deposuna başarıyla geri yüklendi.
- Ne yapmalı: genellikle hiçbir şey.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Anlamı: bazı eski oda anahtarları yalnızca eski yerel depoda vardı ve Matrix yedeğine hiç yüklenmemişti.
- Ne yapmalı: bu anahtarları başka doğrulanmış bir istemciden el ile kurtaramıyorsanız bazı eski şifreli geçmişin kullanılamaz kalmasını bekleyin.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Anlamı: yedek var, ancak OpenClaw kurtarma anahtarını otomatik olarak kurtaramadı.
- Ne yapmalı: `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` çalıştırın.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Anlamı: OpenClaw eski şifreli depoyu buldu, ancak kurtarmayı hazırlayacak kadar güvenli şekilde inceleyemedi.
- Ne yapmalı: `openclaw doctor --fix` komutunu yeniden çalıştırın. Tekrarlanırsa eski durum dizinini olduğu gibi koruyun ve başka doğrulanmış bir Matrix istemcisi ile birlikte `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` kullanarak kurtarın.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Anlamı: OpenClaw bir yedek anahtarı çakışması algıladı ve mevcut kurtarma anahtarı dosyasının üzerine otomatik yazmayı reddetti.
- Ne yapmalı: herhangi bir geri yükleme komutunu yeniden denemeden önce hangi kurtarma anahtarının doğru olduğunu doğrulayın.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Anlamı: bu eski depolama biçiminin katı sınırıdır.
- Ne yapmalı: yedeklenmiş anahtarlar yine de geri yüklenebilir, ancak yalnızca yerel şifreli geçmiş kullanılamaz kalabilir.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Anlamı: yeni eklenti geri yüklemeyi denedi ancak Matrix bir hata döndürdü.
- Ne yapmalı: `openclaw matrix verify backup status` çalıştırın, sonra gerekirse `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` ile yeniden deneyin.

### El ile kurtarma mesajları

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Anlamı: OpenClaw bir yedek anahtarınızın olması gerektiğini biliyor, ancak bu cihazda etkin değil.
- Ne yapmalı: `openclaw matrix verify backup restore` çalıştırın veya gerekirse `--recovery-key` geçin.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Anlamı: bu cihazda kurtarma anahtarı şu anda saklı değil.
- Ne yapmalı: önce cihazı kurtarma anahtarınızla doğrulayın, sonra yedeği geri yükleyin.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Anlamı: saklanan anahtar etkin Matrix yedeğiyle eşleşmiyor.
- Ne yapmalı: doğru anahtarla `openclaw matrix verify device "<your-recovery-key>"` komutunu yeniden çalıştırın.

Kurtarılamayan eski şifreli geçmişi kaybetmeyi kabul ediyorsanız bunun yerine
`openclaw matrix verify backup reset --yes` ile geçerli
yedek temel çizgisini sıfırlayabilirsiniz. Saklanan yedek gizli bilgisi bozuksa, bu sıfırlama
yeni yedek anahtarının yeniden başlatmadan sonra doğru yüklenebilmesi için gizli bilgi depolamayı da yeniden oluşturabilir.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Anlamı: yedek var, ancak bu cihaz çapraz imzalama zincirine henüz yeterince güçlü şekilde güvenmiyor.
- Ne yapmalı: `openclaw matrix verify device "<your-recovery-key>"` komutunu yeniden çalıştırın.

`Matrix recovery key is required`

- Anlamı: gerekli olduğu bir durumda kurtarma adımını kurtarma anahtarı vermeden denediniz.
- Ne yapmalı: komutu kurtarma anahtarınızla yeniden çalıştırın.

`Invalid Matrix recovery key: ...`

- Anlamı: verilen anahtar ayrıştırılamadı veya beklenen biçimle eşleşmedi.
- Ne yapmalı: Matrix istemcinizdeki veya kurtarma anahtarı dosyanızdaki tam kurtarma anahtarıyla yeniden deneyin.

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- Anlamı: anahtar uygulandı, ancak cihaz hâlâ doğrulamayı tamamlayamadı.
- Ne yapmalı: doğru anahtarı kullandığınızı ve hesapta çapraz imzalamanın mevcut olduğunu doğrulayın, sonra yeniden deneyin.

`Matrix key backup is not active on this device after loading from secret storage.`

- Anlamı: gizli bilgi depolama bu cihazda etkin bir yedek oturumu üretmedi.
- Ne yapmalı: önce cihazı doğrulayın, sonra `openclaw matrix verify backup status` ile tekrar denetleyin.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Anlamı: bu cihaz, cihaz doğrulaması tamamlanana kadar gizli bilgi depolamadan geri yükleme yapamaz.
- Ne yapmalı: önce `openclaw matrix verify device "<your-recovery-key>"` çalıştırın.

### Özel eklenti kurulum mesajları

`Matrix is installed from a custom path that no longer exists: ...`

- Anlamı: eklenti kurulum kaydınız artık mevcut olmayan yerel bir yolu işaret ediyor.
- Ne yapmalı: `openclaw plugins install @openclaw/matrix` ile yeniden kurun veya repo checkout'undan çalışıyorsanız `openclaw plugins install ./path/to/local/matrix-plugin`.

## Şifreli geçmiş yine de geri gelmezse

Bu denetimleri sırayla çalıştırın:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Yedek başarıyla geri yüklenirse ama bazı eski odalarda geçmiş hâlâ eksikse, bu eksik anahtarlar muhtemelen önceki eklenti tarafından hiç yedeklenmemişti.

## Gelecekteki mesajlar için yeni bir başlangıç yapmak istiyorsanız

Kurtarılamayan eski şifreli geçmişi kaybetmeyi kabul ediyor ve bundan sonra yalnızca temiz bir yedek temel çizgisi istiyorsanız, şu komutları sırayla çalıştırın:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Bundan sonra cihaz hâlâ doğrulanmamışsa, Matrix istemcinizden SAS emoji veya ondalık kodları karşılaştırıp eşleştiğini onaylayarak doğrulamayı tamamlayın.

## İlgili sayfalar

- [Matrix](/tr/channels/matrix)
- [Doctor](/gateway/doctor)
- [Migrating](/install/migrating)
- [Plugins](/tools/plugin)
