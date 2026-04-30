---
read_when:
    - Mevcut bir Matrix kurulumunu yükseltme
    - Şifrelenmiş Matrix geçmişini ve cihaz durumunu taşıma
summary: OpenClaw'ın önceki Matrix Plugin'i yerinde nasıl yükselttiği; şifrelenmiş durum kurtarma sınırları ve manuel kurtarma adımları dahil.
title: Matrix geçişi
x-i18n:
    generated_at: "2026-04-30T09:06:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: fff409eef1b7da7be4b63d8459a62b8365a04adf989f271a2f2c4aef46e90716
    source_path: channels/matrix-migration.md
    workflow: 16
---

Önceki herkese açık `matrix` Plugin'inden geçerli uygulamaya yükseltin.

Çoğu kullanıcı için yükseltme yerinde yapılır:

- Plugin `@openclaw/matrix` olarak kalır
- kanal `matrix` olarak kalır
- yapılandırmanız `channels.matrix` altında kalır
- önbelleğe alınmış kimlik bilgileri `~/.openclaw/credentials/matrix/` altında kalır
- çalışma zamanı durumu `~/.openclaw/matrix/` altında kalır

Yapılandırma anahtarlarını yeniden adlandırmanız veya Plugin'i yeni bir ad altında yeniden yüklemeniz gerekmez.

## Geçişin otomatik olarak yaptığı işlemler

Gateway başladığında ve [`openclaw doctor --fix`](/tr/gateway/doctor) çalıştırdığınızda OpenClaw eski Matrix durumunu otomatik olarak onarmaya çalışır.
Eyleme dönüştürülebilir herhangi bir Matrix geçiş adımı disk üzerindeki durumu değiştirmeden önce OpenClaw odaklanmış bir kurtarma anlık görüntüsü oluşturur veya mevcut olanı yeniden kullanır.

`openclaw update` kullandığınızda, tam tetikleyici OpenClaw'ın nasıl kurulduğuna bağlıdır:

- kaynak kurulumları güncelleme akışı sırasında `openclaw doctor --fix` çalıştırır, ardından varsayılan olarak Gateway'i yeniden başlatır
- paket yöneticisi kurulumları paketi günceller, etkileşimsiz bir doctor geçişi çalıştırır, ardından başlangıcın Matrix geçişini tamamlayabilmesi için varsayılan Gateway yeniden başlatmasına güvenir
- `openclaw update --no-restart` kullanırsanız, başlangıç destekli Matrix geçişi daha sonra `openclaw doctor --fix` çalıştırıp Gateway'i yeniden başlatana kadar ertelenir

Otomatik geçiş şunları kapsar:

- `~/Backups/openclaw-migrations/` altında geçiş öncesi bir anlık görüntü oluşturma veya mevcut olanı yeniden kullanma
- önbelleğe alınmış Matrix kimlik bilgilerinizi yeniden kullanma
- aynı hesap seçimini ve `channels.matrix` yapılandırmasını koruma
- en eski düz Matrix eşitleme deposunu geçerli hesap kapsamlı konuma taşıma
- hedef hesap güvenli şekilde çözümlenebildiğinde en eski düz Matrix kripto deposunu geçerli hesap kapsamlı konuma taşıma
- daha önce kaydedilmiş bir Matrix oda anahtarı yedeği şifre çözme anahtarını, bu anahtar yerel olarak mevcutsa eski rust kripto deposundan çıkarma
- erişim belirteci daha sonra değiştiğinde aynı Matrix hesabı, homeserver ve kullanıcı için mevcut en eksiksiz belirteç karması depolama kökünü yeniden kullanma
- Matrix erişim belirteci değiştiği ancak hesap/cihaz kimliği aynı kaldığı zaman bekleyen şifrelenmiş durum geri yükleme meta verileri için kardeş belirteç karması depolama köklerini tarama
- bir sonraki Matrix başlangıcında yedeklenmiş oda anahtarlarını yeni kripto deposuna geri yükleme

Anlık görüntü ayrıntıları:

- OpenClaw başarılı bir anlık görüntüden sonra `~/.openclaw/matrix/migration-snapshot.json` konumuna bir işaretleyici dosya yazar; böylece sonraki başlangıç ve onarım geçişleri aynı arşivi yeniden kullanabilir.
- Bu otomatik Matrix geçiş anlık görüntüleri yalnızca yapılandırma + durum yedeği alır (`includeWorkspace: false`).
- Matrix yalnızca uyarı niteliğinde geçiş durumuna sahipse, örneğin `userId` veya `accessToken` hâlâ eksik olduğu için, OpenClaw henüz anlık görüntü oluşturmaz çünkü eyleme dönüştürülebilir bir Matrix değişikliği yoktur.
- Anlık görüntü adımı başarısız olursa OpenClaw, kurtarma noktası olmadan durumu değiştirmek yerine o çalıştırma için Matrix geçişini atlar.

Çok hesaplı yükseltmeler hakkında:

- en eski düz Matrix deposu (`~/.openclaw/matrix/bot-storage.json` ve `~/.openclaw/matrix/crypto/`) tek depolu bir düzenden geldiği için OpenClaw bunu yalnızca çözümlenmiş tek bir Matrix hesabı hedefine geçirebilir
- zaten hesap kapsamlı olan eski Matrix depoları, yapılandırılmış her Matrix hesabı için algılanır ve hazırlanır

## Geçişin otomatik olarak yapamayacağı işlemler

Önceki herkese açık Matrix Plugin'i Matrix oda anahtarı yedeklerini **otomatik olarak** oluşturmuyordu. Yerel kripto durumunu kalıcı hale getiriyor ve cihaz doğrulaması istiyordu, ancak oda anahtarlarınızın homeserver'a yedeklendiğini garanti etmiyordu.

Bu, bazı şifrelenmiş kurulumların yalnızca kısmen geçirilebileceği anlamına gelir.

OpenClaw şunları otomatik olarak kurtaramaz:

- hiç yedeklenmemiş yalnızca yerel oda anahtarları
- hedef Matrix hesabı `homeserver`, `userId` veya `accessToken` hâlâ mevcut olmadığı için henüz çözümlenemediğinde şifrelenmiş durum
- birden çok Matrix hesabı yapılandırılmış ancak `channels.matrix.defaultAccount` ayarlanmamış olduğunda tek bir paylaşılan düz Matrix deposunun otomatik geçişi
- standart Matrix paketi yerine bir repo yoluna sabitlenmiş özel Plugin yolu kurulumları
- eski depoda yedeklenmiş anahtarlar olduğu ancak şifre çözme anahtarını yerel olarak tutmadığı durumda eksik bir kurtarma anahtarı

Geçerli uyarı kapsamı:

- özel Matrix Plugin yolu kurulumları hem Gateway başlangıcı hem de `openclaw doctor` tarafından gösterilir

Eski kurulumunuzda hiç yedeklenmemiş yalnızca yerel şifrelenmiş geçmiş varsa, bazı eski şifrelenmiş iletiler yükseltmeden sonra okunamaz kalabilir.

## Önerilen yükseltme akışı

1. OpenClaw'ı ve Matrix Plugin'i normal şekilde güncelleyin.
   Başlangıcın Matrix geçişini hemen tamamlayabilmesi için `--no-restart` olmadan düz `openclaw update` tercih edin.
2. Şunu çalıştırın:

   ```bash
   openclaw doctor --fix
   ```

   Matrix için eyleme dönüştürülebilir geçiş işi varsa doctor önce geçiş öncesi anlık görüntüyü oluşturur veya mevcut olanı yeniden kullanır ve arşiv yolunu yazdırır.

3. Gateway'i başlatın veya yeniden başlatın.
4. Geçerli doğrulama ve yedekleme durumunu kontrol edin:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Onardığınız Matrix hesabının kurtarma anahtarını hesaba özel bir ortam değişkenine koyun. Tek bir varsayılan hesap için `MATRIX_RECOVERY_KEY` yeterlidir. Birden çok hesap için hesap başına bir değişken kullanın, örneğin `MATRIX_RECOVERY_KEY_ASSISTANT`, ve komuta `--account assistant` ekleyin.

6. OpenClaw size bir kurtarma anahtarı gerektiğini söylerse, eşleşen hesap için komutu çalıştırın:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Bu cihaz hâlâ doğrulanmamışsa, eşleşen hesap için komutu çalıştırın:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Kurtarma anahtarı kabul edilirse ve yedekleme kullanılabiliyorsa, ancak `Cross-signing verified`
   hâlâ `no` ise, başka bir Matrix istemcisinden kendi kendine doğrulamayı tamamlayın:

   ```bash
   openclaw matrix verify self
   ```

   İsteği başka bir Matrix istemcisinde kabul edin, emoji veya ondalık değerleri karşılaştırın
   ve yalnızca eşleştiklerinde `yes` yazın. Komut yalnızca
   `Cross-signing verified` `yes` olduktan sonra başarıyla çıkar.

8. Kurtarılamaz eski geçmişi bilinçli olarak terk ediyorsanız ve gelecekteki iletiler için yeni bir yedekleme temeli istiyorsanız şunu çalıştırın:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Henüz sunucu tarafı anahtar yedeği yoksa, gelecekteki kurtarmalar için bir tane oluşturun:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Şifrelenmiş geçiş nasıl çalışır

Şifrelenmiş geçiş iki aşamalı bir süreçtir:

1. Başlangıç veya `openclaw doctor --fix`, şifrelenmiş geçiş eyleme dönüştürülebilirse geçiş öncesi anlık görüntüyü oluşturur veya mevcut olanı yeniden kullanır.
2. Başlangıç veya `openclaw doctor --fix`, etkin Matrix Plugin kurulumu üzerinden eski Matrix kripto deposunu inceler.
3. Bir yedek şifre çözme anahtarı bulunursa OpenClaw bunu yeni kurtarma anahtarı akışına yazar ve oda anahtarı geri yüklemesini beklemede olarak işaretler.
4. Bir sonraki Matrix başlangıcında OpenClaw yedeklenmiş oda anahtarlarını yeni kripto deposuna otomatik olarak geri yükler.

Eski depo hiç yedeklenmemiş oda anahtarları bildirirse OpenClaw, kurtarmanın başarılı olduğunu varsaymak yerine uyarır.

## Yaygın iletiler ve anlamları

### Yükseltme ve algılama iletileri

`Matrix plugin upgraded in place.`

- Anlamı: disk üzerindeki eski Matrix durumu algılandı ve geçerli düzene geçirildi.
- Yapılacak işlem: aynı çıktı uyarılar da içermiyorsa hiçbir şey.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Anlamı: OpenClaw, Matrix durumunu değiştirmeden önce bir kurtarma arşivi oluşturdu.
- Yapılacak işlem: geçişin başarılı olduğunu doğrulayana kadar yazdırılan arşiv yolunu saklayın.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Anlamı: OpenClaw mevcut bir Matrix geçiş anlık görüntüsü işaretleyicisi buldu ve yinelenen bir yedek oluşturmak yerine bu arşivi yeniden kullandı.
- Yapılacak işlem: geçişin başarılı olduğunu doğrulayana kadar yazdırılan arşiv yolunu saklayın.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Anlamı: eski Matrix durumu var, ancak OpenClaw bunu geçerli bir Matrix hesabına eşleyemiyor çünkü Matrix yapılandırılmamış.
- Yapılacak işlem: `channels.matrix` yapılandırın, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya Gateway'i yeniden başlatın.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Anlamı: OpenClaw eski durumu buldu, ancak tam geçerli hesap/cihaz kökünü hâlâ belirleyemiyor.
- Yapılacak işlem: Gateway'i çalışan bir Matrix oturumuyla bir kez başlatın veya önbelleğe alınmış kimlik bilgileri mevcut olduktan sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Anlamı: OpenClaw bir paylaşılan düz Matrix deposu buldu, ancak hangi adlandırılmış Matrix hesabının bunu alacağını tahmin etmeyi reddediyor.
- Yapılacak işlem: `channels.matrix.defaultAccount` değerini hedeflenen hesaba ayarlayın, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya Gateway'i yeniden başlatın.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Anlamı: yeni hesap kapsamlı konumda zaten bir eşitleme veya kripto deposu var, bu nedenle OpenClaw bunu otomatik olarak üzerine yazmadı.
- Yapılacak işlem: çakışan hedefi elle kaldırmadan veya taşımadan önce geçerli hesabın doğru hesap olduğunu doğrulayın.

`Failed migrating Matrix legacy sync store (...)` veya `Failed migrating Matrix legacy crypto store (...)`

- Anlamı: OpenClaw eski Matrix durumunu taşımayı denedi ancak dosya sistemi işlemi başarısız oldu.
- Yapılacak işlem: dosya sistemi izinlerini ve disk durumunu inceleyin, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Anlamı: OpenClaw eski bir şifrelenmiş Matrix deposu buldu, ancak bunu bağlayacak geçerli Matrix yapılandırması yok.
- Yapılacak işlem: `channels.matrix` yapılandırın, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya Gateway'i yeniden başlatın.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Anlamı: şifrelenmiş depo var, ancak OpenClaw bunun hangi geçerli hesap/cihaza ait olduğuna güvenli şekilde karar veremiyor.
- Yapılacak işlem: Gateway'i çalışan bir Matrix oturumuyla bir kez başlatın veya önbelleğe alınmış kimlik bilgileri mevcut olduktan sonra `openclaw doctor --fix` komutunu yeniden çalıştırın.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Anlamı: OpenClaw bir paylaşılan düz eski kripto deposu buldu, ancak hangi adlandırılmış Matrix hesabının bunu alacağını tahmin etmeyi reddediyor.
- Yapılacak işlem: `channels.matrix.defaultAccount` değerini hedeflenen hesaba ayarlayın, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya Gateway'i yeniden başlatın.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Anlamı: OpenClaw eski Matrix durumunu algıladı, ancak geçiş hâlâ eksik kimlik veya kimlik bilgisi verileri nedeniyle engelleniyor.
- Yapılacak işlem: Matrix oturum açma veya yapılandırma kurulumunu tamamlayın, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya Gateway'i yeniden başlatın.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Anlamı: OpenClaw eski şifreli Matrix durumunu buldu, ancak normalde bu depoyu inceleyen Matrix plugin yardımcı giriş noktasını yükleyemedi.
- Yapılacaklar: Matrix plugin'i yeniden kurun veya onarın (`openclaw plugins install @openclaw/matrix`, ya da bir repo checkout'ı için `openclaw plugins install ./path/to/local/matrix-plugin`), ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.
- npm, OpenClaw sahipli Matrix paketini deprecated olarak bildirirse, daha yeni bir npm paketi yayımlanana kadar güncel paketlenmiş bir OpenClaw derlemesindeki
  gömülü plugin'i veya yerel checkout yolunu kullanın.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Anlamı: OpenClaw, plugin kökünün dışına çıkan veya plugin sınır denetimlerinden geçemeyen bir yardımcı dosya yolu buldu, bu nedenle onu içe aktarmayı reddetti.
- Yapılacaklar: Matrix plugin'i güvenilir bir yoldan yeniden kurun, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Anlamı: OpenClaw, önce kurtarma anlık görüntüsünü oluşturamadığı için Matrix durumunu değiştirmeyi reddetti.
- Yapılacaklar: yedekleme hatasını çözün, ardından `openclaw doctor --fix` komutunu yeniden çalıştırın veya gateway'i yeniden başlatın.

`Failed migrating legacy Matrix client storage: ...`

- Anlamı: Matrix istemci tarafı yedeği eski düz depolamayı buldu, ancak taşıma başarısız oldu. OpenClaw artık sessizce yeni bir depoyla başlamak yerine bu yedeği durdurur.
- Yapılacaklar: dosya sistemi izinlerini veya çakışmaları inceleyin, eski durumu sağlam tutun ve hatayı düzelttikten sonra yeniden deneyin.

`Matrix is installed from a custom path: ...`

- Anlamı: Matrix bir yol kurulumuna sabitlenmiş, bu nedenle ana hat güncellemeleri onu repo'nun standart Matrix paketiyle otomatik olarak değiştirmez.
- Yapılacaklar: varsayılan Matrix plugin'e dönmek istediğinizde `openclaw plugins install @openclaw/matrix` ile yeniden kurun.
- npm, OpenClaw sahipli Matrix paketini deprecated olarak bildirirse, daha yeni bir npm paketi
  yayımlanana kadar güncel paketlenmiş bir OpenClaw derlemesindeki gömülü
  plugin'i kullanın.

### Şifreli durum kurtarma iletileri

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Anlamı: yedeklenmiş oda anahtarları yeni kripto depoya başarıyla geri yüklendi.
- Yapılacaklar: genellikle hiçbir şey.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Anlamı: bazı eski oda anahtarları yalnızca eski yerel depoda vardı ve Matrix yedeğine hiç yüklenmemişti.
- Yapılacaklar: bu anahtarları başka bir doğrulanmış istemciden elle kurtaramadığınız sürece bazı eski şifreli geçmişin kullanılamaz kalmasını bekleyin.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Anlamı: yedek var, ancak OpenClaw kurtarma anahtarını otomatik olarak kurtaramadı.
- Yapılacaklar: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` komutunu çalıştırın.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Anlamı: OpenClaw eski şifreli depoyu buldu, ancak kurtarmayı hazırlayacak kadar güvenli biçimde inceleyemedi.
- Yapılacaklar: `openclaw doctor --fix` komutunu yeniden çalıştırın. Tekrarlanırsa eski durum dizinini sağlam tutun ve başka bir doğrulanmış Matrix istemcisiyle birlikte `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` kullanarak kurtarın.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Anlamı: OpenClaw bir yedek anahtarı çakışması algıladı ve geçerli recovery-key dosyasının üzerine otomatik olarak yazmayı reddetti.
- Yapılacaklar: herhangi bir geri yükleme komutunu yeniden denemeden önce hangi kurtarma anahtarının doğru olduğunu doğrulayın.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Anlamı: bu, eski depolama biçiminin katı sınırıdır.
- Yapılacaklar: yedeklenmiş anahtarlar yine de geri yüklenebilir, ancak yalnızca yerel olan şifreli geçmiş kullanılamaz kalabilir.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Anlamı: yeni plugin geri yüklemeyi denedi, ancak Matrix bir hata döndürdü.
- Yapılacaklar: `openclaw matrix verify backup status` komutunu çalıştırın, ardından gerekirse `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` ile yeniden deneyin.

### Elle kurtarma iletileri

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Anlamı: OpenClaw bir yedek anahtarınız olması gerektiğini biliyor, ancak bu cihazda etkin değil.
- Yapılacaklar: `openclaw matrix verify backup restore` komutunu çalıştırın ya da gerekirse `MATRIX_RECOVERY_KEY` ayarlayıp `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` çalıştırın.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Anlamı: bu cihazda şu anda kurtarma anahtarı depolanmış değil.
- Yapılacaklar: `MATRIX_RECOVERY_KEY` ayarlayın, `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` çalıştırın, ardından yedeği geri yükleyin.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Anlamı: depolanmış anahtar etkin Matrix yedeğiyle eşleşmiyor.
- Yapılacaklar: `MATRIX_RECOVERY_KEY` değerini doğru anahtara ayarlayın ve `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` komutunu çalıştırın.

Kurtarılamayan eski şifreli geçmişi kaybetmeyi kabul ediyorsanız, bunun yerine geçerli
yedek temelini `openclaw matrix verify backup reset --yes` ile sıfırlayabilirsiniz. Depolanan
yedek gizlisi bozuk olduğunda, bu sıfırlama gizli depolamayı da yeniden oluşturabilir; böylece
yeni yedek anahtarı yeniden başlatmadan sonra doğru şekilde yüklenebilir.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Anlamı: yedek var, ancak bu cihaz çapraz imzalama zincirine henüz yeterince güçlü biçimde güvenmiyor.
- Yapılacaklar: `MATRIX_RECOVERY_KEY` ayarlayın ve `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` komutunu çalıştırın.

`Matrix recovery key is required`

- Anlamı: bir kurtarma anahtarı gerekli olduğu halde sağlamadan bir kurtarma adımını denediniz.
- Yapılacaklar: komutu `--recovery-key-stdin` ile yeniden çalıştırın; örneğin `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Anlamı: sağlanan anahtar ayrıştırılamadı veya beklenen biçimle eşleşmedi.
- Yapılacaklar: Matrix istemcinizdeki veya recovery-key dosyanızdaki tam kurtarma anahtarıyla yeniden deneyin.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Anlamı: OpenClaw kurtarma anahtarını uygulayabildi, ancak Matrix bu cihaz için hâlâ
  tam çapraz imzalama kimlik güvenini kurmadı. Komut çıktısında `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` ve `Device verified by owner` değerlerini denetleyin.
- Yapılacaklar: `openclaw matrix verify self` komutunu çalıştırın, isteği başka bir
  Matrix istemcisinde kabul edin, SAS değerini karşılaştırın ve yalnızca eşleştiğinde `yes` yazın.
  Komut, başarı bildirmeden önce tam Matrix kimlik güvenini bekler. Yalnızca geçerli çapraz imzalama kimliğini bilerek değiştirmek istediğinizde
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  kullanın.

`Matrix key backup is not active on this device after loading from secret storage.`

- Anlamı: gizli depolama bu cihazda etkin bir yedek oturumu üretmedi.
- Yapılacaklar: önce cihazı doğrulayın, ardından `openclaw matrix verify backup status` ile yeniden denetleyin.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Anlamı: bu cihaz, cihaz doğrulaması tamamlanana kadar gizli depolamadan geri yükleme yapamaz.
- Yapılacaklar: önce `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` komutunu çalıştırın.

### Özel plugin kurulum iletileri

`Matrix is installed from a custom path that no longer exists: ...`

- Anlamı: plugin kurulum kaydınız artık mevcut olmayan bir yerel yolu gösteriyor.
- Yapılacaklar: `openclaw plugins install @openclaw/matrix` ile yeniden kurun ya da bir repo checkout'ından çalışıyorsanız `openclaw plugins install ./path/to/local/matrix-plugin` kullanın.
- npm, OpenClaw sahipli Matrix paketini deprecated olarak bildirirse, daha yeni bir npm paketi yayımlanana kadar güncel paketlenmiş bir OpenClaw derlemesindeki
  gömülü plugin'i veya yerel checkout yolunu kullanın.

## Şifreli geçmiş hâlâ geri gelmiyorsa

Bu denetimleri sırayla çalıştırın:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Yedek başarıyla geri yüklenirse ancak bazı eski odalarda hâlâ geçmiş eksikse, bu eksik anahtarlar önceki plugin tarafından muhtemelen hiç yedeklenmemiştir.

## Gelecekteki iletiler için temiz başlamak istiyorsanız

Kurtarılamayan eski şifreli geçmişi kaybetmeyi kabul ediyor ve bundan sonrası için yalnızca temiz bir yedek temeli istiyorsanız, bu komutları sırayla çalıştırın:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Cihaz bundan sonra hâlâ doğrulanmamışsa, SAS emojisini veya ondalık kodları karşılaştırıp eşleştiklerini onaylayarak doğrulamayı Matrix istemcinizden tamamlayın.

## İlgili

- [Matrix](/tr/channels/matrix): kanal kurulumu ve yapılandırma.
- [Matrix push kuralları](/tr/channels/matrix-push-rules): bildirim yönlendirme.
- [Doctor](/tr/gateway/doctor): sağlık denetimi ve otomatik migration tetikleyicisi.
- [Migration kılavuzu](/tr/install/migrating): tüm migration yolları (makine taşıma, sistemler arası içe aktarmalar).
- [Plugins](/tr/tools/plugin): plugin kurulumu ve kaydı.
