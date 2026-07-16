---
read_when:
    - Mevcut bir Matrix kurulumunu yükseltme
    - Şifrelenmiş Matrix geçmişini ve cihaz durumunu taşıma
summary: OpenClaw'un önceki Matrix pluginini yerinde nasıl yükselttiği; şifrelenmiş durum kurtarma sınırları ve manuel kurtarma adımları dâhil.
title: Matrix geçişi
x-i18n:
    generated_at: "2026-07-16T16:49:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33d5ac134338c8032ca1507ceee6eade2d37b3c86f0045fb883304ad208cd5e5
    source_path: channels/matrix-migration.md
    workflow: 16
---

Önceki herkese açık `matrix` Plugin'inden mevcut uygulamaya yükseltin.

Çoğu kullanıcı için yükseltme doğrudan uygulanır:

- Plugin `@openclaw/matrix` olarak kalır
- kanal `matrix` olarak kalır
- yapılandırmanız `channels.matrix` altında kalır
- önbelleğe alınmış kimlik bilgileri `~/.openclaw/credentials/matrix/` altında kalır
- çalışma zamanı durumu `~/.openclaw/matrix/` altında kalır

Yapılandırma anahtarlarını yeniden adlandırmanız veya Plugin'i yeni bir adla yeniden yüklemeniz gerekmez.
Kök `openclaw` paketi artık Matrix çalışma zamanı kodunu veya Matrix SDK
bağımlılıklarını içermez. `openclaw channels status` Matrix'in yapılandırıldığını ancak
Plugin'in yüklü olmadığını gösteriyorsa `openclaw doctor --fix` veya
`openclaw plugins install @openclaw/matrix` komutunu çalıştırın; Matrix SDK paketlerini
kök OpenClaw paketine yüklemeyin.

## Geçişin otomatik olarak yaptıkları

Matrix geçişi [`openclaw doctor --fix`](/tr/gateway/doctor) çalıştırıldığında ve Matrix istemcisi başlatılırken SQLite deposunun yanında hâlâ dosya tabanlı yardımcı durum bulması hâlinde yedek seçenek olarak çalışır.

Otomatik geçiş şunları kapsar:

- önbelleğe alınmış Matrix kimlik bilgilerinizi yeniden kullanma
- aynı hesap seçimini ve `channels.matrix` yapılandırmasını koruma
- dosya tabanlı yardımcı durumu (`bot-storage.json` eşitleme önbelleği, `recovery-key.json`, `legacy-crypto-migration.json`, IndexedDB anlık görüntüleri) Matrix SQLite durumuna aktarma; taşınan dosyalar `.migrated` son ekiyle arşivlenir
- erişim belirteci daha sonra değiştiğinde aynı Matrix hesabı, ana sunucu, kullanıcı ve cihaz için mevcut en eksiksiz belirteç karması depolama kökünü yeniden kullanma

## 2026.4'ten eski OpenClaw sürümlerinden yükseltme

2026.6 serisine kadar olan sürümler ayrıca özgün düz, tek depolu
Matrix düzenini (`~/.openclaw/matrix/bot-storage.json` ile
`~/.openclaw/matrix/crypto/`) taşıyor ve eski rust şifreleme deposundan
şifrelenmiş durum kurtarmayı hazırlıyordu. Mevcut sürümler artık bu geçişi içermez.

Hâlâ düz düzeni kullanan bir kurulumu yükseltiyorsanız önce
bir 2026.6 sürümüne yükseltin, `openclaw doctor --fix` komutunu çalıştırın ve düz
deponun ve kurtarılabilir oda anahtarlarının taşınması için Gateway'i bir kez
başlatın. Ardından en son sürüme güncelleyin.

Önceki herkese açık Matrix Plugin'i Matrix oda anahtarı yedeklerini otomatik olarak **oluşturmuyordu**. Eski kurulumunuzda hiç yedeklenmemiş, yalnızca yerel şifrelenmiş geçmiş varsa geçiş yolundan bağımsız olarak bazı eski şifrelenmiş mesajlar yükseltmeden sonra okunamaz durumda kalabilir.

## Önerilen yükseltme akışı

1. OpenClaw ve Matrix Plugin'ini normal şekilde güncelleyin.
2. Şunu çalıştırın:

   ```bash
   openclaw doctor --fix
   ```

3. Gateway'i başlatın veya yeniden başlatın.
4. Mevcut doğrulama ve yedekleme durumunu denetleyin:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Onardığınız Matrix hesabının kurtarma anahtarını hesaba özgü bir ortam değişkenine yerleştirin. Tek bir varsayılan hesap için `MATRIX_RECOVERY_KEY` uygundur. Birden fazla hesap için hesap başına bir değişken kullanın; örneğin `MATRIX_RECOVERY_KEY_ASSISTANT` ve komuta `--account assistant` ekleyin.

6. OpenClaw bir kurtarma anahtarının gerektiğini bildirirse eşleşen hesap için komutu çalıştırın:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Bu cihaz hâlâ doğrulanmamışsa eşleşen hesap için komutu çalıştırın:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Kurtarma anahtarı kabul edilir ve yedek kullanılabilir durumdaysa ancak `Cross-signing verified`
   hâlâ `no` ise öz doğrulamayı başka bir Matrix istemcisinden tamamlayın:

   ```bash
   openclaw matrix verify self
   ```

   İsteği başka bir Matrix istemcisinde kabul edin, emojileri veya ondalık sayıları karşılaştırın
   ve yalnızca eşleşiyorlarsa `yes` yazın. Komut, başarı bildirmeden önce tam Matrix
   kimlik güveninin oluşmasını bekler.

8. Kurtarılamayan eski geçmişten bilerek vazgeçiyor ve gelecekteki mesajlar için yeni bir yedekleme temeli istiyorsanız şunu çalıştırın:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   Yalnızca eski kurtarma anahtarının yeni yedeğin kilidini artık açmaması gerekiyorsa `--rotate-recovery-key` ekleyin.

9. Henüz sunucu tarafında bir anahtar yedeği yoksa gelecekteki kurtarmalar için bir tane oluşturun:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Yaygın mesajlar ve anlamları

`Failed migrating legacy Matrix client storage: ...`

- Anlamı: Matrix istemci tarafı yedek seçeneği dosya tabanlı yardımcı durum buldu ancak SQLite'a aktarma başarısız oldu. OpenClaw, sessizce yeni bir depoyla başlamak yerine tamamlanan taşımaları geri alır ve bu yedek seçeneği durdurur.
- Yapılması gereken: dosya sistemi izinlerini veya çakışmaları inceleyin, eski durumu sağlam tutun ve hatayı düzelttikten sonra yeniden deneyin.

`Matrix is installed from a custom path: ...`

- Anlamı: Matrix bir yol kurulumuna sabitlenmiştir; bu nedenle ana sürüm güncellemeleri onu varsayılan Matrix paketiyle otomatik olarak değiştirmez.
- Yapılması gereken: varsayılan Matrix Plugin'ine dönmek istediğinizde `openclaw plugins install @openclaw/matrix` ile yeniden yükleyin.

`Matrix is installed from a custom path that no longer exists: ...`

- Anlamı: Plugin kurulum kaydınız artık mevcut olmayan yerel bir yolu gösteriyor.
- Yapılması gereken: `openclaw plugins install @openclaw/matrix` ile veya bir depo çalışma kopyasından çalıştırıyorsanız `openclaw plugins install ./path/to/local/matrix-plugin` ile yeniden yükleyin. `openclaw doctor --fix` eski Matrix Plugin başvurularını da sizin için kaldırabilir.

### Manuel kurtarma mesajları

`openclaw matrix verify status` ve `openclaw matrix verify backup status`, oda anahtarı yedeği bu cihazda sağlıklı olmadığında bir `Backup issue:` satırıyla birlikte `Next steps:` yönlendirmesi yazdırır:

| Yedekleme sorunu                                                      | Anlamı                                             | Düzeltme                                                                                                                                  |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | geri yüklenecek bir şey yok                        | oda anahtarı yedeği oluşturmak için `openclaw matrix verify bootstrap`                                                                     |
| `backup decryption key is not loaded on this device`                  | anahtar mevcut ancak burada etkin değil            | `openclaw matrix verify backup restore`; anahtar hâlâ yüklenemiyorsa kurtarma anahtarını `--recovery-key-stdin` üzerinden aktarın                 |
| `backup decryption key could not be loaded from secret storage (...)` | gizli depolama yüklenemedi veya desteklenmiyor     | kurtarma anahtarını aktarın: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`                                |
| `backup key mismatch (...)`                                           | depolanan anahtar etkin sunucu yedeğiyle eşleşmiyor | etkin sunucu yedekleme anahtarıyla `verify backup restore --recovery-key-stdin` komutunu yeniden çalıştırın veya yeni bir temel için `verify backup reset --yes` kullanın |
| `backup signature chain is not trusted by this device`                | cihaz henüz çapraz imzalama zincirine güvenmiyor   | `verify device --recovery-key-stdin`, ardından güven hâlâ eksikse başka bir doğrulanmış istemciden `verify self`                        |
| `backup exists but is not active on this device`                      | sunucu yedeği mevcut, yerel oturum etkin değil     | önce cihazı doğrulayın, ardından `openclaw matrix verify backup status` ile yeniden denetleyin                                                   |
| `backup trust state could not be fully determined`                    | tanılama sonuçsuz kaldı                            | `openclaw matrix verify status --verbose`                                                                                                 |

Diğer kurtarma hataları:

`Matrix recovery key is required`

- Anlamı: kurtarma anahtarının gerekli olduğu bir kurtarma adımını anahtar sağlamadan çalıştırmayı denediniz.
- Yapılması gereken: komutu `--recovery-key-stdin` ile yeniden çalıştırın; örneğin `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Anlamı: sağlanan anahtar ayrıştırılamadı veya beklenen biçimle eşleşmedi.
- Yapılması gereken: Matrix istemcinizdeki veya kurtarma anahtarı dışa aktarımındaki kurtarma anahtarının aynısıyla yeniden deneyin.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Anlamı: kurtarma anahtarı kullanılabilir yedekleme materyalinin kilidini açtı ancak Matrix bu cihaz için tam çapraz imzalama kimlik güvenini oluşturmadı. Komut çıktısında `Recovery key accepted`, `Backup usable`, `Cross-signing verified` ve `Device verified by owner` değerlerini denetleyin.
- Yapılması gereken: `openclaw matrix verify self` komutunu çalıştırın, isteği başka bir Matrix istemcisinde kabul edin, SAS'ı karşılaştırın ve yalnızca eşleştiğinde `yes` yazın. `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` seçeneğini yalnızca mevcut çapraz imzalama kimliğini bilerek değiştirmek istediğinizde kullanın.

Kurtarılamayan eski şifrelenmiş geçmişi kaybetmeyi kabul ediyorsanız bunun yerine
mevcut yedekleme temelini `openclaw matrix verify backup reset --yes` ile sıfırlayabilirsiniz. Depolanan
yedekleme gizli anahtarı bozuksa bu sıfırlama, yeni yedekleme anahtarının yeniden
başlatma sonrasında doğru şekilde yüklenebilmesi için gizli depolamayı da onarır.

## Şifrelenmiş geçmiş yine de geri gelmezse

Bu denetimleri sırayla çalıştırın:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Yedek başarıyla geri yüklenir ancak bazı eski odalarda geçmiş hâlâ eksikse bu eksik anahtarlar muhtemelen önceki Plugin tarafından hiç yedeklenmemiştir.

## Gelecekteki mesajlar için yeni bir başlangıç yapmak istiyorsanız

Kurtarılamayan eski şifrelenmiş geçmişi kaybetmeyi kabul ediyor ve bundan sonrası için yalnızca temiz bir yedekleme temeli istiyorsanız şu komutları sırayla çalıştırın:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Cihaz bundan sonra hâlâ doğrulanmamışsa Matrix istemcinizdeki SAS emoji veya ondalık kodlarını karşılaştırıp eşleştiklerini onaylayarak doğrulamayı tamamlayın.

## İlgili

- [Matrix](/tr/channels/matrix): kanal kurulumu ve yapılandırması.
- [Matrix anlık bildirim kuralları](/tr/channels/matrix-push-rules): bildirim yönlendirmesi.
- [Doctor](/tr/gateway/doctor): sistem durumu denetimi ve otomatik geçiş tetikleyicisi.
- [Geçiş kılavuzu](/tr/install/migrating): tüm geçiş yolları (makine taşımaları, sistemler arası aktarımlar).
- [Plugin'ler](/tr/tools/plugin): Plugin yükleme ve kaydetme.
