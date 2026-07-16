---
doc-schema-version: 1
read_when:
    - OpenClaw'u birden fazla kullanıcı veya kuruluş için barındırıyorsunuz
    - Kiracı iş yükleri için bir yalıtım sınırı seçmeniz gerekir
summary: Birden çok kiracı güven etki alanını, kiracı başına bir yalıtılmış OpenClaw Gateway hücresi olarak barındırın
title: Çok kiracılı barındırma
x-i18n:
    generated_at: "2026-07-16T17:07:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 383d32331b45d40db6fb4ff8242dd9a3cf8898a3ccab19f0372cd06bbd83fc05
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# Çok kiracılı barındırma

OpenClaw'ın varsayılan güvenlik modeli, tek bir paylaşılan Gateway içinde düşmanca çok kiracılı yalıtım değil, Gateway başına tek bir güvenilir operatör sınırıdır. Bu nedenle, aynı güven sınırını paylaşmayan kullanıcıları veya kuruluşları barındırmak, her kiracı için ayrı ve eksiksiz bir OpenClaw örneği çalıştırmak anlamına gelir.

`openclaw fleet` her yalıtılmış örneği bir **hücre** olarak adlandırır. Hücre; kendi durumu, kimlik bilgileri, çalışma alanı, kanal hesapları, token'ı ve yalnızca geri döngüye açık ana makine portu bulunan, güçlendirilmiş bir kapsayıcı içindeki eksiksiz bir Gateway'dir.

Fleet **deneyseldir**: komutları, bayrakları ve kapsayıcı profili, kullanımdan kaldırma süresi olmadan sürümler arasında değişebilir.

Fleet, Linux ve macOS ana makinelerinde test edilmiştir. Windows ana makineleri şu anda test edilmemiştir.

## Her kiracının neden bir hücreye ihtiyacı vardır

Bir Gateway içindeki kimliği doğrulanmış operatör, güvenilir bir kontrol düzlemi rolüne sahiptir. Oturum kimlikleri yönlendirmeyi seçer; bir kiracıyı diğerine karşı yetkilendirmez. Agent korumalı alanı, güvenilmeyen içeriğin ve araç yürütmenin etkisini azaltabilir, ancak tek bir paylaşılan Gateway'i kiracı yetkilendirme sınırına dönüştürmez.

Her güven alanının ayrı bir Gateway süreci, kapsayıcısı, kalıcı durum ağacı ve Gateway kimlik bilgisi olması için kiracı başına bir hücre kullanın. Bu, [Gateway güvenlik modelini](/tr/gateway/security) izler: karşılıklı olarak birbirine güvenmeyen kullanıcıları tek bir OpenClaw sürecinde veya tek bir işletim sistemi kullanıcısı altında birlikte barındırmayın.

## Mimari

Fleet CLI, ana makine tarafında çalışan bir yaşam döngüsü denetleyicisidir. Hücreleri OpenClaw durum veritabanına kaydeder ve yerel bir Docker veya Podman çalışma zamanından kapsayıcılarını oluşturmasını, incelemesini, başlatmasını, durdurmasını, değiştirmesini ve kaldırmasını ister. Fleet'in bağlama yolları ve geri döngü URL'leri yerel ana makineye ait olduğundan uzak çalışma zamanı uç noktaları desteklenmez. Fleet, kiracı mesajlarına proxy uygulamaz ve hücreler arasına paylaşılan bir uygulama düzeyi veri yolu eklemez.

Her hücre, kendi kullanıcı tanımlı köprü ağında resmi `ghcr.io/openclaw/openclaw` imajını çalıştırır. Ayrı köprüler, sağlayıcılar ve kanallar için dışa giden NAT erişimini korurken hücreler arasında doğrudan kapsayıcı IP trafiğini önler. Dışa giden trafik varsayılan olarak kısıtlanmaz. Podman hücreleri, yayımlanan geri döngü Gateway portunu korurken dışa giden trafiği engellemek için `--network internal` kullanabilir. Docker'ın dahili ağları bu yayımlanan portu bozduğundan Fleet bu birleşimi reddeder; bunun yerine Docker dışa giden trafik politikasını `DOCKER-USER` zinciri gibi ana makine güvenlik duvarı kurallarıyla uygulayın. Hücre Gateway'i kapsayıcı içinde `18789` portunu dinlerken çalışma zamanı bunu ana makinede yalnızca `127.0.0.1:<allocated-port>` adresine yayımlar. Uzak erişim gerektiğinde bir operatör, bu geri döngü uç noktasının önüne onaylanmış bir ters proxy, SSH tüneli veya tailnet yerleştirebilir.

Kalıcı Gateway durumu `<state-dir>/fleet/cells/<tenant>/` konumundan gelir ve `/home/node/.openclaw` konumuna bağlanır. Kimlik doğrulama profili şifreleme anahtarları ayrı `<state-dir>/fleet/auth-profile-secrets/<tenant>/` ana makine yolundan gelir ve resmi [Docker kalıcılık düzeniyle](/tr/install/docker#storage-and-persistence) eşleşecek şekilde `/home/node/.config/openclaw` konumuna bağlanır. Anahtar, sıradan durum bağlamasının altında iç içe değildir. Kiracı başına kanal hesapları, bunlara sahip olan hücrenin içinde sonlandırılır; Fleet, paylaşılan bir kanal hesabı veya gelen mesaj yönlendiricisi sağlamaz.

Resmi imaj, varsayılan olarak UID 1000 değerine sahip root olmayan `node` kullanıcısını kullanır. Fleet, özel bağlama noktalarının yazılabilir kalması için ana makineyle uyumlu kullanıcı eşlemeleri kullanır: Podman `keep-id` kullanır, root olarak çalışan Docker komutu çağıran root olmayan kimliği kullanır ve rootless Docker kapsayıcı root kullanıcısını ayrıcalıksız daemon kullanıcısına eşler. Ana makinede SELinux etkinken Docker ve Podman özel bir `:Z` yeniden etiketlemesi uygular. Kapsayıcı profili ayrıcalıklı ana makine özelliklerinden kaçınır ve rootless kullanıma uygundur; ancak rootless çalışma, Fleet'in otomatik olarak etkinleştirdiği bir özellik değil, ana makine çalışma zamanı seçimi ve ön koşuludur.

## Güven sınırı

Çok kiracılık, kiracıları birbirlerinden korur. Fleet operatörüne ve ana makineye her kiracı güvenir. Ele geçirilmiş bir ana makineye karşı dayanıklılık hedeflenmez.

Bu, bir ana makine yöneticisinin kapsayıcı yapılandırmasını ve ortamını inceleyebileceği, bağlanmış hücre verilerini okuyabileceği, imajları değiştirebileceği veya kapsayıcılara girebileceği anlamına gelir. Gateway token'ları ve `--env` ile geçirilen değerler, Docker veya Podman incelemesi aracılığıyla bir yönetici tarafından görülebilir. Ana makine denetimlerini, yönetimsel erişim politikasını, izlemeyi, yedeklemeleri ve onaylanmış bir sır yöneticisini buna göre kullanın.

Temel profil, yanlışlıkla joker karakterli ağ erişimine açılmayı önler ve yaygın kapsayıcı ayrıcalık yükseltme mekanizmalarını kaldırır, ancak güvenilmeyen bir ana makineyi güvenli hâle getirmez.

## Yalıtım basamakları

Barındırdığınız kiracılara uygun sınırı seçin:

1. **Güçlendirilmiş kapsayıcı temel profili.** Fleet tüm Linux yeteneklerini kaldırır, `no-new-privileges` özelliğini etkinleştirir, PID, bellek, CPU ve isteğe bağlı yazılabilir katman disk sınırları uygular, ayrı kalıcı bağlama noktaları ve hücre başına ağlar kullanır ve yalnızca ana makine geri döngüsüne yayımlar. Köprü ağı, dışa giden trafiği kısıtlamaz; bir hücrenin dışa bağlantı başlatmaması gerektiğinde Podman `--network internal` veya Docker ana makine güvenlik duvarı politikasını kullanın. Aynı operatöre ve ana makineye güvenen kiracılar için varsayılan profil budur.
2. **Daha güçlü kapsayıcı veya VM yalıtımı.** Daha yüksek riskli iş yükleri için Docker veya Podman'ı gVisor ya da Kata Containers gibi daha güçlü bir OCI yalıtım çalışma zamanı kullanacak şekilde yapılandırın veya hücreleri mikro VM'lere yerleştirin. Bu, çalışma zamanı veya altyapı yapılandırmasıdır; Fleet'in `--runtime docker|podman` seçeneği OCI yalıtım arka ucunu değil, kapsayıcı CLI'sını seçer. Docker'ın [alternatif kapsayıcı çalışma zamanlarına](https://docs.docker.com/engine/daemon/alternative-runtimes/) ve [Docker VM çalışma zamanı kılavuzuna](/tr/install/docker-vm-runtime) bakın.
3. **Düşmanca kiracılar için ayrı makineler.** Düşmanca kiracıları tek bir OpenClaw sürecinde veya işletim sistemi kullanıcısı altında birlikte barındırmayın. Kiracılar aynı ana makine operatörüne güvenmiyorsa veya daha güçlü bir yönetimsel sınıra ihtiyaç duyuyorsa ayrı çalışma zamanı yönetimine sahip ayrı VM'ler veya fiziksel ana makineler kullanın.

Bu basamakların hiçbiri OpenClaw uygulama güven modelini değiştirmez: tek bir Gateway, tek bir güvenilir operatör alanı olmaya devam eder.

## Hızlı başlangıç

Bir hücre oluşturun. Komut, oluşturulan Gateway token'ını bir kez yazdırır; bu nedenle hemen saklayın:

```bash
openclaw fleet create acme
```

Bildirilen `http://127.0.0.1:<port>` URL'sini Fleet ana makinesinde açın, ilgili kiracının token'ıyla kimlik doğrulaması yapın ve hücre içinde sağlayıcı kimlik bilgilerini ve kanal hesaplarını yapılandırın.

Kapsayıcı durumunu ve Gateway'in çalışır durumda olup olmadığını kontrol edin:

```bash
openclaw fleet status acme
```

Ana makine portunu, bağlanmış verileri, kaynak profilini, kullanıcı tarafından sağlanan ortamı ve Gateway token'ını koruyarak yükseltin:

```bash
openclaw fleet upgrade acme
```

Kiracı verilerini koruyarak kapsayıcıyı ve kayıt defteri satırını kaldırın:

```bash
openclaw fleet rm acme --force
```

Kalıcı kiracı verilerini de silmek için `--purge-data` ekleyin. Temizleme işlemi `--force` gerektirir, geri alınamaz ve herhangi bir şeyi silmeden önce çözümlenmiş yolun sınırlar içinde kalıp kalmadığını denetler:

```bash
openclaw fleet rm acme --purge-data --force
```

Tüm komutlar ve seçenekler için [`openclaw fleet` CLI referansına](/cli/fleet) bakın.

## Mevcut kapsam

Fleet şu yüzeyleri sağlamaz:

- Paylaşılan kanal hesapları veya paylaşılan bir giriş yönlendiricisi
- Eksiksiz OpenClaw örnekleri yerine küçültülmüş kiracı başına ana makine süreçleri
- Tek bir denetleyici tarafından yönetilen uzak hücre ana makineleri
- Kiracı self servis portalı, faturalandırma düzlemi veya yetki devredilmiş yönetim kullanıcı arayüzü

Bu yetenekler açık kimlik, yönlendirme, yetkilendirme ve hata alanı sözleşmeleri gerektirir. Tek bir Gateway'i veya kimlik bilgilerini kiracılar arasında paylaşarak bunları yaklaşık olarak gerçekleştirmeye çalışmayın. Fleet, tek ana makineli bir yaşam döngüsü denetleyicisidir; birden fazla makineye yayılan ve kimlikle yönetilen filolar ayrı bir kontrol düzlemi katmanı gerektirir.

## İlgili

- [`openclaw fleet`](/cli/fleet)
- [Gateway güvenliği](/tr/gateway/security)
- [Birden fazla Gateway](/tr/gateway/multiple-gateways)
- [Docker](/tr/install/docker)
- [Podman](/tr/install/podman)
