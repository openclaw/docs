---
read_when:
    - Tek bir makinede birden fazla kiracı güven etki alanı barındırıyorsunuz
    - Filo hücreleri oluşturmanız, incelemeniz, yükseltmeniz veya kaldırmanız gerekiyor
summary: Kiracı başına yalıtılmış OpenClaw hücrelerini hazırlama ve yönetmeye yönelik CLI başvurusu
title: Filo
x-i18n:
    generated_at: "2026-07-16T17:15:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: be589500e4715541f175caf0d5135a96baee4874e64c60c8b6f188ff1f70bc9f
    source_path: cli/fleet.md
    workflow: 16
---

# `openclaw fleet`

`openclaw fleet`, **hücreler** olarak adlandırılan eksiksiz OpenClaw örneklerini yönetir. Her hücrenin kendi Gateway'i, durumu, kimlik bilgileri, kanal hesapları, konteyneri ve yalnızca geri döngüye açık ana makine bağlantı noktası vardır. Her kiracı güven sınırı için bir hücre kullanın; düşmanca birden çok kiracılı ortam sınırı olarak tek bir paylaşılan Gateway kullanmayın.

Fleet **deneyseldir**. Komut adları, bayraklar, çıktı biçimleri ve konteyner profili, kullanımdan kaldırma süresi olmadan sürümler arasında değişebilir.

Fleet, Docker ve Podman'ı destekler. Varsayılan imaj `ghcr.io/openclaw/openclaw:latest`'dir.

Fleet, Linux ve macOS ana makinelerinde test edilmiştir. Windows ana makineleri şu anda test edilmemiştir.

## Hızlı başlangıç

```bash
openclaw fleet create acme
openclaw fleet status acme
openclaw fleet list
```

`fleet create`, oluşturulan Gateway tokenını hücre URL'siyle birlikte bir kez yazdırır. Tokenı hemen saklayın, ardından her kiracının kanal hesaplarını o kiracının hücresinde yapılandırın.

## Kiracı kimlikleri

Kiracı kimlikleri şununla eşleşmelidir:

```text
^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$
```

Bu, 1 ile 40 arasında küçük harfe, rakama ve iç tirelere izin verir. Bir kimlik harf veya rakamla başlamalı ve bitmelidir. Büyük harfler, alt çizgiler, eğik çizgiler, noktalar, boşluklar ve `../acme` gibi dizin geçişi dizeleri reddedilir.

Kimlik, konteyner adının bir parçası olur: `openclaw-cell-<tenant>`.

## `fleet create`

Bir hücre oluşturup başlatın:

```bash
openclaw fleet create acme
```

Sabit bir bağlantı noktasında başlatmadan bir Podman hücresi oluşturun:

```bash
openclaw fleet create acme \
  --runtime podman \
  --port 19125 \
  --no-start
```

`--env` öğesini yineleyerek kiracıya özgü ortam değişkenlerini geçirin:

```bash
openclaw fleet create acme \
  --env TZ=America/Los_Angeles \
  --env OPENCLAW_DISABLE_BONJOUR=1
```

Ortam anahtarları harf, rakam ve alt çizgi kullanır ve rakamla başlayamaz. Fleet bunları korumalı bir çalışma zamanı ortam dosyası üzerinden geçirdiğinden değerler tek satırlı olmalıdır. Fleet, [Depolama ve konteyner düzeni](#storage-and-container-layout) altında listelenen yönetilen konteyner yolu ve Gateway tokenı değişkenlerini geçersiz kılma girişimlerini reddeder.

### Oluşturma seçenekleri

| Seçenek                    | Varsayılan                               | Açıklama                                                                                    |
| ------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `--image <ref>`           | `ghcr.io/openclaw/openclaw:latest`    | Hücre için konteyner imajı.                                                                  |
| `--runtime <runtime>`     | `docker`                              | Konteyner CLI'si: `docker` veya `podman`.                                                           |
| `--port <number>`         | `19100` değerinden otomatik olarak ayrılır  | Geri döngü ana makine bağlantı noktası. Açıkça seçilen bir bağlantı noktası başka bir kayıtlı hücreye ait olmamalıdır.    |
| `--memory <value>`        | `2g`                                  | Docker/Podman söz diziminde konteyner bellek sınırı.                                                |
| `--cpus <value>`          | `2`                                   | Konteyner CPU sınırı.                                                                           |
| `--disk <size>`           | Yok                                  | Depolama arka ucu kotaları desteklediğinde konteynerin yazılabilir katmanını sınırlar.                     |
| `--network <mode>`        | `bridge`                              | Giden ağ modu: `bridge` veya `internal`.                                                 |
| `--pids-limit <number>`   | `512`                                 | Konteynerdeki azami işlem sayısı.                                                  |
| `--env <KEY=VALUE>`       | Yok                                  | Hücreye bir ortam değişkeni geçirir. Birden çok değer için yineleyin.                          |
| `--gateway-token <value>` | Rastgele 32 karakterli onaltılık token | Oluşturmak yerine sağlanan bir Gateway tokenını kullanır. Bkz. [Token işleme](#token-handling). |
| `--no-start`              | Hücre başlatılır                           | Konteyneri başlatmadan oluşturur.                                                      |
| `--json`                  | İnsan tarafından okunabilir çıktı                 | Makine tarafından okunabilir çıktı yazdırır.                                                                 |

Otomatik ayırma, `19100` veya üzerindeki ilk kullanılmayan kayıt defteri bağlantı noktasını seçer. Fleet, yinelenen kiracı kimliklerini ve başka bir hücreye zaten atanmış açık bağlantı noktalarını reddeder.

İmaj başvuruları, tek bir konteyner çalışma zamanı bağımsız değişkeni olarak geçirilir. Bir imajın Docker veya Podman seçeneği olarak yorumlanamaması için boş başvurular ve `-` ile başlayan değerler reddedilir.

Seçilen Docker veya Podman uç noktası yerel olmalıdır. Fleet, bir bağlantı noktası ayırmadan veya yerel durum oluşturmadan önce uzak Docker bağlamlarını, `DOCKER_HOST` uç noktalarını ve uzak Podman hizmetlerini reddeder. Uzak hücre ana makineleri desteklenmez.

Fleet yeni bir hücre başlattığında, oluşturma işlemi Gateway'in `/healthz` isteğine yanıt vermesi için yaklaşık bir dakika bekler. Hücre sağlıklı duruma gelmezse Fleet, `fleet status`, `fleet logs` veya açıkça kaldırma işlemi için konteynerini ve kayıt defteri satırını olduğu gibi bırakır. `--no-start` bu sağlık geçidini atlar. Sağlıksız yeni bir hücrenin oluşturulan Gateway tokenı kaybolmaz; konteyner ortamında (`docker|podman inspect`) kalır ve hücre henüz hiç trafik sunmadığından, `fleet rm --force` işleminin ardından yeniden oluşturmak her zaman güvenli bir alternatiftir.

### Özetle sabitleme

Oluşturma ve yükseltme işlemleri, `--image ghcr.io/openclaw/openclaw@sha256:<digest>` gibi özetle sabitlenmiş imaj başvurularını kabul eder. Fleet, imaj başvurusunu Docker veya Podman'a olduğu gibi geçirir; bu, operatörün bir hücreyi değişken bir etiket yerine değişmez imaj baytlarında tutmasını sağlar.

Oluşturma sonucu kiracı kimliğini, konteyner adını, ana makine bağlantı noktasını, Gateway tokenını ve yerel URL'yi içerir. JSON çıktısında bile token içerdiği için sonucu gizli bilgi taşıyan veri olarak değerlendirin.

### Disk sınırları

`--disk` yalnızca konteynerin yazılabilir katmanını sınırlar. Bağlama yoluyla bağlanan kiracı başına durum ve kimlik doğrulama dizinleri ana makine depolaması olarak kalır; bu dizinlerin de katı bir sınıra ihtiyacı olduğunda ana makine dosya sistemi proje kotalarını kullanın.

| Çalışma zamanı/depolama arka ucu | `--disk` desteği                                                             |
| ----------------------- | ---------------------------------------------------------------------------- |
| XFS üzerinde Docker overlay2  | XFS `pquota` bağlama seçeneğini gerektirir.                                      |
| Docker btrfs veya zfs     | Depolama sürücüsü tarafından desteklenir.                                             |
| Podman overlay          | XFS destek depolaması gerektirir.                                                |
| Diğer arka uçlar          | Konteyner oluşturma, daemon hatası ve Fleet'in arka uç yönlendirmesiyle başarısız olur. |

### Çıkış politikası

| Mod       | Docker                                                                                                | Podman                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `bridge`   | Desteklenir; giden trafik varsayılan olarak kısıtlanmaz.                                                | Desteklenir; giden trafik varsayılan olarak kısıtlanmaz.                              |
| `internal` | Docker, yayımlanan geri döngü Gateway bağlantı noktasını dahili bir ağda korumadığından reddedilir. | Desteklenir; giden trafik engellenirken geri döngü Gateway'i yayımlanmış olarak kalır. |

Docker için köprü modunu koruyun ve giden trafik politikasını `DOCKER-USER` zinciri gibi ana makine güvenlik duvarı kurallarıyla uygulayın.

## `fleet list`

Hücreleri kiracı kimliği sırasıyla listeleyin:

```bash
openclaw fleet list
openclaw fleet ls
openclaw fleet list --json
```

Tablo şunları içerir:

| Sütun    | Anlam                                                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant`  | Kiracı kimliği.                                                                                                                                                                                                                                                                            |
| `state`   | Docker veya Podman incelemesinden alınan canlı konteyner durumu. `unknown`, çalışma zamanının kullanılamadığı veya hücrenin adına sahip bir konteynerin bulunduğu ancak Fleet sahiplik etiketlerinin kayıt defteri kaydıyla eşleşmediği anlamına gelir (çakışma veya müdahale sinyali — işlem yapmadan önce elle inceleyin). |
| `port`    | Hücre Gateway'ine eşlenen geri döngü ana makine bağlantı noktası.                                                                                                                                                                                                                                        |
| `image`   | Kaydedilen konteyner imajı.                                                                                                                                                                                                                                                             |
| `created` | Hücre oluşturma zamanı.                                                                                                                                                                                                                                                                   |

Docker veya Podman kullanılamadığında kayıt defteri satırları görünür kalır; yalnızca canlı durum `unknown` olur.

## `fleet status`

Bir hücreyi inceleyin:

```bash
openclaw fleet status acme
openclaw fleet status acme --json
```

Durum; Fleet kayıt defteri satırını, canlı konteyner incelemesini ve aşağıdaki adrese yapılan kısa, en iyi çaba esaslı bir isteği birleştirir:

```text
http://127.0.0.1:<host-port>/healthz
```

Sağlık sonucu `ok`, `failed` veya `skipped` olur. `/healthz`, her yapılandırılmış kanalın veya Plugin'in tam hazır olduğunu değil, Gateway'in çalışır durumda olduğunu kanıtlar. Kontrol edilecek kullanılabilir bir yerel uç nokta olmadığında yoklama atlanır.

## `fleet logs`

Bir hücrenin konteyner günlüklerini doğrudan terminale aktarın:

```bash
openclaw fleet logs acme
openclaw fleet logs acme --follow
openclaw fleet logs acme --tail 200
openclaw fleet logs acme --since 10m
```

Fleet, herhangi bir günlüğü okumadan önce kayıtlı konteynerin sahiplik etiketlerini doğrular; bu nedenle beklenen hücre adını kullanan yabancı bir konteyneri reddeder. Akış, incelenen konteyner kimliğine sabitlenir; böylece eşzamanlı bir değiştirme işlemi onu daha yeni bir nesle yönlendiremez. Operatörün durdurma işlemini komut hatası olarak değerlendirmeden `--follow` işlemini sonlandırmak için Ctrl-C tuşlarına basın. Günlük çıktısı, terminale herhangi bir şey ulaşmadan önce hücrenin geçerli Gateway tokenını `<redacted>` ile değiştiren bir gizleme filtresinden geçirilir.

Konteyner günlükleri ham bir stdout/stderr akışı olduğundan `fleet logs` için `--json` modu yoktur. Betikler için çıktıyı `--tail` ile sınırlayın ve normal kabuk yönlendirmesi veya ardışık düzenleri kullanın.

## `fleet start`, `fleet stop` ve `fleet restart`

Kayıtlı çalışma zamanı aracılığıyla mevcut bir hücreyi denetleyin:

```bash
openclaw fleet start acme
openclaw fleet stop acme
openclaw fleet restart acme
```

Bu komutlar kayıtlı kapsayıcı adı üzerinde işlem yapar. Kiracı bilinmiyorsa veya kayıtlı çalışma zamanı işlemi gerçekleştiremiyorsa başarısız olurlar.

## `fleet upgrade`

Kayıtlı imajı yeniden çekin ve hücre kapsayıcısını değiştirin:

```bash
openclaw fleet upgrade acme
```

Hücreyi başka bir imaja taşıyın:

```bash
openclaw fleet upgrade acme --image ghcr.io/openclaw/openclaw:<version>
```

Yükseltme; hedef imajı çeker, mevcut kapsayıcıyı ve hücreye özel ağı inceler, kapsayıcıyı durdurup kaldırır, ardından yeniden oluşturup başlatır. Yeni kapsayıcı; aynı ana makine bağlantı noktasını, veri dizinlerini, hücreye özel köprü ağını, çalışma zamanı profilini, kaynak sınırlarını, yeniden başlatma politikasını, Fleet tarafından yönetilen ortamı ve başlangıçta `--env` ile sağlanan değerleri korur. Bağlanan durum, kapsayıcı değişiminden etkilenmez; imajın varsayılan ortamı hedef imajla birlikte değişebilir.

Değişiklik yalnızca Gateway, hücrenin geri döngü bağlantı noktasında `/healthz` isteğine yanıt verdikten sonra kesinleştirilir; bu, resmî compose dosyasının kullandığı sistem durumu sözleşmesiyle aynıdır. Çıkan, çökme döngüsüne giren veya yaklaşık bir dakika içinde sağlıklı duruma gelemeyen yeni kapsayıcı kaldırılır ve önceki kapsayıcı geri yüklenir; böylece bozuk bir imaj çalışan hücreyi devre dışı bırakmaz.

Gateway belirteci kasıtlı olarak fleet kayıt defterinde saklanmaz. Fleet, eski kapsayıcıyı kaldırmadan önce ortamını okur ve `OPENCLAW_GATEWAY_TOKEN` değerini yeni kapsayıcıya aktarır. Belirteç denetiminizdeki başka hiçbir yerde bulunmuyorsa yükseltmeden önce eski kapsayıcıyı elle kaldırmayın.

## `fleet backup` ve `fleet restore`

Durdurulmuş tek bir hücreyi yedekleyin:

```bash
openclaw fleet stop acme
openclaw fleet backup acme --out ./acme.tgz
```

Bu arşivi kayıtlı hücreye geri yükleyin:

```bash
openclaw fleet restore acme --from ./acme.tgz
```

Bunlar, ana makine operatörü ayrıcalıkları gerektiren komutlardır. Arşivler kiracı durumunu ve kimlik doğrulama sırlarını içerir, `0600` kipinde oluşturulur ve kimlik bilgileri gibi saklanmalıdır. SQLite durumunun tutarlı biçimde yakalanabilmesi için yedekleme, çalışan bir hücreyi kabul etmez. Geri yükleme, `--force` sağlanmadığı sürece çalışan bir hücreyi kabul etmez; yalnızca ilgili kiracının durumunu değiştirir, Gateway belirtecini yeniler ve yeni belirteci bir kez yazdırır. Fleet aynı anda tek bir kiracıyı yedekler; tüm kiracıları yedeklemek ayrı bir operatör işlemidir.

Geri yükleme için durdurulmuş mevcut bir kapsayıcı gerekir; çünkü incelenen çalışma zamanı profili, yeni kapsayıcının sınırlarını, kullanıcı eşlemesini, ortam kaynağını ve imajını sağlar. Kayıtlı kapsayıcı harici yollarla kaldırıldıysa önce `fleet rm <tenant> --force` komutunu `--purge-data` olmadan çalıştırın, hücreyi amaçlanan imaj ve `--no-start` ile yeniden oluşturun, ardından geri yüklemeyi tekrar deneyin. İlk kaldırma işlemi her iki kiracı veri dizinini de olduğu gibi tutar.

Her iki komut da arşivlenen veya çıkarılan dosya verilerini sınırlamak için `--max-bytes <bytes>` kabul eder ve yalnızca meta veri içeren arşiv bombalarının ana makine inode'larını tüketememesi ve kabul edilen her yedeğin geri yüklenebilir kalması için arşiv yol kesitlerine aynı sabit bir milyonluk bütçeyi uygular. Yedekleme `--out <path>` kabul eder ve her iki komut da `--json` destekler.

Arşivler yalnızca normal dosyalar ve dizinler içerir. Yedekleme; sembolik bağlantıları, sabit bağlantıları, yuvaları veya aygıt düğümlerini hiçbir zaman izlemez ya da saklamaz; atlananların sayısı sonuçta bildirilir. Geri yükleme, başka herhangi bir girdi türü içeren arşivleri reddeder. Çalışma alanındaki `node_modules` gibi yeniden oluşturulabilir sembolik bağlantı ağaçları, geri yüklemeden sonra hücrenin içinde yeniden kurulmalıdır.

## `fleet doctor`

Çalışma zamanı veya dosya sistemi durumunu değiştirmeden tüm hücreleri ya da tek bir kiracıyı denetleyin:

```bash
openclaw fleet doctor
openclaw fleet doctor acme --json
```

Doctor; çalışma zamanının yerelliğini, sahiplik etiketlerini, sistem durumunu, sıkılaştırmayı, kaynak sınırlarını, geri döngü bağlantı noktası bağlamasını, belirteç varlığını, ağ sahipliğini ve çıkış modunu ve özel durum dizini izinlerini denetler. Uyarılar durdurulmuş hücreleri veya sahiplik farklılıklarını açıklar; başarısız olan herhangi bir bulgu, sıfırdan farklı bir işlem çıkış koduna neden olur.

## `fleet rm`

Kiracı verilerini koruyarak durdurulmuş bir hücreyi çalışma zamanından ve kayıt defterinden kaldırın:

```bash
openclaw fleet rm acme
```

Çalışan bir kapsayıcı için `--force` gerekir:

```bash
openclaw fleet rm acme --force
```

Hücre verilerini de kalıcı olarak kaldırın:

```bash
openclaw fleet rm acme --purge-data --force
```

Fleet, hücreye ayrılmış köprü ağını kaldırmadan önce hücre kapsayıcısını kaldırır. `--purge-data`, `--force` gerektirir. Fleet, özyinelemeli silmeden önce Fleet'e ait iki kökü ve kiracıya özel iki dizini de çözümler. Her hedef, kendi kökünün kesinlikle içinde bulunan, beklenen kiracı yaprağıyla tam olarak eşleşmeli ve sembolik bağlantı olmamalıdır. Bu kapsama denetimleri, bozulmuş bir kayıt defteri yolunun veya kiracılar arası sembolik bağlantının silme işlemini başka bir konuma yönlendirmesini önler.

Beklenen kiracı dizininin zaten bulunmadığı durumlarda temizleme yeniden denenebilir. Bu, kısmi bir dosya sistemi hatasından sonra sonraki bir çağrının, hâlâ var olan dizinlere yönelik yol denetimlerini gevşetmeden temizliği tamamlamasını sağlar.

## Depolama ve kapsayıcı düzeni

Hücre durumu ve kimlik doğrulama profili şifreleme anahtarları, etkin OpenClaw durum dizini altında kiracı başına ayrı ana makine yollarını kullanır:

```text
<state-dir>/fleet/cells/<tenant>/
<state-dir>/fleet/auth-profile-secrets/<tenant>/
```

İlk dizin `/home/node/.openclaw` konumuna bağlanır. İkinci dizin, resmî Docker kurulumunun şifreleme anahtarı bağlamasıyla eşleşecek biçimde `/home/node/.config/openclaw` konumuna bağlanır. Bu nedenle şifreleme anahtarı, sıradan durum bağlaması altında açığa çıkmaz ve yalnızca hücre durumu dizini yedeklendiğinde veya paylaşıldığında yedeğe dâhil edilmez. Her iki dizin de normal kaldırma ve yükseltme işlemlerinden etkilenmez; `fleet rm --purge-data --force`, ayrı kapsama denetimlerinden sonra ikisini de siler.

Fleet, ilk başlatmadan önce hücre yapılandırmasını `gateway.mode=local`, belirteç kimlik doğrulaması, LAN kapsayıcı bağlaması ve tahsis edilen ana makine bağlantı noktası için Control UI kaynaklarıyla başlatır. Belirteç değeri bu yapılandırmaya yazılmaz; kapsayıcı ortamında kalır.

Fleet, resmî imajın kapsayıcı yollarını şu ortam değerleriyle sabitler:

| Değişken                 | Kapsayıcı değeri                      |
| ------------------------ | ------------------------------------ |
| `HOME`                   | `/home/node`                         |
| `OPENCLAW_HOME`          | `/home/node`                         |
| `OPENCLAW_STATE_DIR`     | `/home/node/.openclaw`               |
| `OPENCLAW_CONFIG_PATH`   | `/home/node/.openclaw/openclaw.json` |
| `OPENCLAW_WORKSPACE_DIR` | `/home/node/.openclaw/workspace`     |
| `OPENCLAW_GATEWAY_TOKEN` | Oluşturulan veya sağlanan hücre belirteci     |

Resmî imaj varsayılan olarak UID 1000 değerine sahip, root olmayan `node` kullanıcısını kullanır. Fleet, özel `0700` bağlama bağlantılarını herkes tarafından erişilebilir hâle getirmeden yazılabilir tutar. Root ayrıcalıklı Docker, hücreyi çağrıyı yapan root olmayan UID ve GID ile çalıştırır; root ayrıcalıksız Docker ise kapsayıcı UID 0 değerini kullanır ve bu değer daemon'ın kullanıcı ad alanı içinde çağrıyı yapan ayrıcalıksız ana makine kullanıcısına eşlenir. Podman, çağrıyı yapan UID ve GID ile `keep-id` kullanır. Fleet'in kendisi root ayrıcalıklı bir çalışma zamanına karşı root olarak çalıştığında imaj kullanıcısını korur ve ilk bağlama dosyalarını UID/GID 1000 değerine atar.

SELinux ana makinelerinde Docker ve Podman bağlamaları özel bir `:Z` yeniden etiketlemesi alır. Hücre verilerini geri yükler veya başka bir konuma taşırsanız bağlama bağlantılı yolların etkin kapsayıcı kullanıcısı tarafından yazılabilir kalmasını sağlayın. Profil root ayrıcalıksız kullanıma uygundur ancak Docker veya Podman, ana makinede root ayrıcalıksız çalışma için önceden yapılandırılmış olmalıdır; Fleet, root ayrıcalıklı bir daemon'ı root ayrıcalıksız hâle dönüştürmez.

## Güvenlik profili

Fleet, her hücreye aşağıdaki profili uygular:

| Denetim              | Uygulanan profil                                      | Nedeni                                                                                    |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Linux yetenekleri   | `--cap-drop=ALL`                                     | Gateway bir Node.js işlemidir ve ek Linux yeteneklerine gerek duymaz.                |
| Ayrıcalık yükseltme | `--security-opt no-new-privileges`                   | İşlemlerin setuid veya setgid ikili dosyaları aracılığıyla ayrıcalık kazanmasını önler.          |
| Başlatma işlemi         | `--init`                                             | Alt işlemleri sonlandırır ve kapsayıcı yaşam döngüsü sinyallerini iletir.                   |
| İşlem sınırı        | Varsayılan olarak `--pids-limit 512`                        | Çatallama ve işlem tükenmesini sınırlar.                                                    |
| Bellek sınırı         | Varsayılan olarak `--memory 2g`                             | Hücrenin bellek kullanımını sınırlar.                                                                |
| CPU sınırı            | Varsayılan olarak `--cpus 2`                                | Hücrenin CPU kullanımını sınırlar.                                                                   |
| Yazılabilir katman diski  | İsteğe bağlı `--disk`                                    | Çalışma zamanı depolama arka ucu kotaları desteklediğinde kapsayıcı katmanını sınırlar.           |
| Yeniden başlatma politikası       | `--restart unless-stopped`                           | Kasıtlı bir durdurmayı geçersiz kılmadan başarısız olan hücreyi yeniden başlatır.                         |
| Ana makinede yayımlama      | Yalnızca `127.0.0.1:<host-port>:18789`                   | Gateway'i joker karakterli ana makine arayüzlerinden uzak tutar.                                        |
| Hücre ağı         | Hücre başına bir köprü veya Podman iç ağı       | Kapsayıcı IP trafiğini ayırır ve isteğe bağlı olarak Podman giden trafiğini engeller.           |
| Kapsayıcı kimliği   | Ana makineyle eşleşen kullanıcı eşlemesi                            | Özel bağlama bağlantılarını genel erişim izni vermeden yazılabilir tutar.                      |
| Kalıcı durum     | Hücre başına bağlamalar; paylaşılan durum bağlaması yok               | Kiracı yapılandırmasını, kimlik bilgilerini, oturumları ve çalışma alanlarını ilgili kiracının veri ağacında tutar. |
| Kapsayıcı komutu    | `node dist/index.js gateway --bind lan --port 18789` | Yalnızca geri döngü kullanan ana makine bağlantı noktası eşlemesinin erişebilmesi için kapsayıcı ağında dinler.  |

Fleet hiçbir zaman `/var/run/docker.sock` bağlamaz, `--privileged` veya ana makine ağını kullanmaz ya da yetenek eklemez. Hücreye özel köprü, hücreler arası bir ayırma sınırıdır; giden trafik güvenlik duvarı değildir: hücreler, sağlayıcılar ve kanallar için gereken ağ çıkışını korur. Geri döngü bağlantı noktasını dağıtımınıza uygun bir proxy, SSH tüneli veya tailnet yapılandırmasıyla öne çıkarın. `http://127.0.0.1:<port>` yalnızca Fleet ana makinesinden doğrudan erişilebilir.

Bu profil kiracı kapsayıcılarını birbirinden ayırır ancak kiracıları Fleet operatöründen, kapsayıcı çalışma zamanı yöneticisinden veya güvenliği ihlal edilmiş bir ana makineden korumaz. Eksiksiz güven modeli ve daha güçlü yalıtım seçenekleri için [Çok kiracılı barındırma](/gateway/multi-tenant-hosting) bölümüne bakın.

## Belirteç işleme

Varsayılan olarak `fleet create`, kriptografik olarak rastgele, 32 karakterli onaltılık bir Gateway belirteci oluşturur ve oluşturma sonucunda bir kez yazdırır. Bunu onaylı sır yöneticinizde saklayın ve oluşturma çıktısının günlüklere kaydedilmesini önleyin.

`--gateway-token`, özel bir belirteci yerel işlem bağımsız değişkenlerine yerleştirir; bu belirteç kabuk geçmişinde tutulabilir veya işlem listelerinde görülebilir. Mevcut bir sır yönetimi iş akışı sağlanan bir değer gerektirmiyorsa oluşturulan belirteci tercih edin.

Belirteç ve `--env` ile aktarılan her değer kapsayıcı ortamında bulunur. Fleet bunları kısa ömürlü, `0600` kipindeki bir ortam dosyasına yazar, Docker veya Podman'a yalnızca bu dosyanın yolunu iletir ve çalışma zamanı komutu tamamlandıktan sonra dosyayı kaldırır. `openclaw fleet create --gateway-token ...` veya `--env KEY=VALUE` içine açıkça yazılan değerler, dış `openclaw` işleminin bağımsız değişkenlerinde ve kabuk geçmişinde yine de görülebilir.

Konteyner ortamı değerleri güvenilir ana makine operatöründen gizlenmez: Docker veya Podman yöneticileri bunları konteyner incelemesiyle okuyabilir. Fleet'in "bir kez gösterilir" notu, ana makine yöneticisine karşı korumayı değil, normal CLI çıktısını açıklar.

## İlgili

- [Çok kiracılı barındırma](/gateway/multi-tenant-hosting)
- [Docker](/tr/install/docker)
- [Podman](/tr/install/podman)
- [Gateway güvenliği](/tr/gateway/security)
