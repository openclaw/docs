---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 'Oturumları tek kullanımlık bulut makinelerine yönlendirme: kaynak sağlama, worker çalışma zamanı, proxy üzerinden çıkarım ve sonuçların akışı'
title: Bulut Çalışanları
x-i18n:
    generated_at: "2026-07-16T17:23:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c20b3b4f1408ed3ef0beb155a207f99476323cf67eba7b44931eec32c79e52be
    source_path: gateway/cloud-workers.md
    workflow: 16
---

Bulut çalışanları, oturumla ilgili her şey her zaman bulunduğu yerde kalırken bir oturumun ajan döngüsünü tek kullanımlık bir bulut makinesinde çalıştırmasına olanak tanır: kenar çubuğunda görünür, canlı olarak akışa devam eder ve transkript Gateway'e ait olur. Gateway bir makine kiralar, üzerine sabitlenmiş bir OpenClaw kopyası kurar, oturumun çalışma alanını makineye eşitler ve tur döngüsünü kısıtlı bir `openclaw worker` sürecine devreder. Model çağrıları Gateway üzerinden geri vekillenir; böylece sağlayıcı kimlik bilgileri makinenizden hiç ayrılmaz ve sağlayıcı kesintisiz tek bir akış gördüğü için istem önbelleğe alma çalışmaya devam eder.

İş tamamlandığında (veya makine çöktüğünde) makine atılır. Kalıcı durum — transkript, çalışma alanı commit'leri, yerleşim kayıtları — Gateway ile birlikte tutulur.

<Note>
Bulut çalışanları isteğe bağlıdır ve bir profil yapılandırılana kadar görünmez. Yapılandırılmamış kurulumlarda yeni RPC'ler, yapılandırmalar veya kullanıcı arayüzü öğeleri görünmez.
</Note>

## Nerede ne çalışır?

| Konu                                                    | Konum                                                                            |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Ajan döngüsü + araçlar (`exec`, `read`, `write`, `edit`, …) | Bulut çalışanı makinesi                                                          |
| Model çıkarımı ve sağlayıcı kimlik bilgileri            | Gateway (`{provider, model}` referansı tarafından vekillenir)                    |
| Transkript (kalıcı, oturum deposu)                      | Gateway                                                                          |
| Kenar çubuğuna canlı akış                               | Çalışanın yeniden oynatılabilir olay akışıyla beslenen Gateway yayını            |
| Çalışma alanı git geçmişi                               | Makinede kimlik bilgileri olmadan oluşturulur; Gateway commit'leri devralır ve gönderme/PR işlemlerinin sahibidir |

Makine, `sshd` dışında gelen bağlantılar için hiçbir porta ihtiyaç duymaz: Gateway sabitlenmiş SSH üzerinden dışarıya bağlanır ve ters tünel, çalışanın WebSocket bağlantısını geri taşır. Paketle gelen Crabbox sağlayıcısı genel SSH yolunu zorunlu kılar ve yönetilen Tailscale kaydını devre dışı bırakır. Giden internet erişimi sağlayıcı politikasına bağlıdır; varsayılan AWS profili, ağı veya güvenlik grubu kısıtlanmadığı sürece internete erişebilir.

## Gereksinimler

- Bir çalışan sağlayıcı plugini. Paketle gelen `crabbox` plugini, bulut arka uçları (AWS, Hetzner ve diğerleri) arasında kiralamalara aracılık eden [Crabbox](https://github.com/openclaw/crabbox) CLI'ını çalıştırır. `crabbox` ikili dosyası, sağlayıcı kimlik bilgileri önceden yapılandırılmış olarak `PATH` üzerinde bulunmalıdır (veya `settings.binary` ayarlanmalıdır). AWS kabulü için Crabbox 0.38.1 veya daha yeni bir sürüm gerekir.
- Crabbox AWS çalışanlarında geçerli `aws.instanceProfile` boş olmalıdır. Sağlayıcı, tahsisten önce `crabbox config show --json` değerini denetler; ardından `crabbox inspect --json` komutunun EC2 `DescribeInstances` kaynağından `providerMetadata.instanceProfileAttached: false` bildirmesini zorunlu kılar. Örnek rolü bulunan veya yetkili meta verisi olmayan kiralamalar durdurulur ve reddedilir.
- Kiralanan makinede Node.js. Temel bulut imajlarında genellikle bulunmaz; profilin `setup` komutuyla kurun.
- Oturuma ait yönetilen bir çalışma ağacına sahip oturum (`worktree: true` ile oluşturun). Gönderim bu çalışma ağacının içeriğini taşır; sıradan dizinler bildirim aynası olarak eşitlenir.

## Yapılandırma

`openclaw.json` içindeki `cloudWorkers.profiles` altına bir profil ekleyin:

```json
{
  "cloudWorkers": {
    "profiles": {
      "aws": {
        "provider": "crabbox",
        "install": "bundle",
        "settings": {
          "provider": "aws",
          "class": "standard",
          "ttl": "8h",
          "idleTimeout": "45m",
          "setup": "test -x /usr/bin/node || (curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs)"
        }
      }
    }
  }
}
```

Profil alanları:

| Anahtar    | Anlamı                                                                                                                                                                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | Bir plugin tarafından kaydedilen çalışan sağlayıcı kimliği (paketle gelen plugin için `crabbox`).                                                                                                                                             |
| `install`  | `bundle` (varsayılan), çalışan Gateway'in derlemesini gönderir; `npm`, tam olarak yayımlanmış Gateway sürümünü sabitlenmiş bütünlük değeriyle kurar. `npm`, Gateway'in paketlenmiş bir sürümden çalışmasını gerektirir. |
| `settings` | Sağlayıcıya ait JSON. crabbox için: `provider` (arka uç), `class` (makine sınıfı), `ttl`, `idleTimeout` (Go süreleri), isteğe bağlı `setup` ve mutlak `binary` yolu. OpenClaw, bu kiralamalarda genel SSH'ı zorunlu kılar ve yönetilen Tailscale'i devre dışı bırakır. |
| `lifetime` | İsteğe bağlı saklanan politika (`idleTimeoutMinutes`, `maxLifetimeMinutes`).                                                                                                                                                                  |

### Kurulum komutu

`settings.setup`, kiralanan makine SSH için hazır olduktan sonra ve OpenClaw kurulmadan önce çalışır. **Her** hazırlama girişiminde (kesintiye uğrayan bir gönderimden sonraki yeniden oynatmalar dâhil) çalıştığından eş etkili olmalıdır; örnekteki gibi kurulumları bir `command -v`/`test -x` denetimiyle koruyun. Kurulum başarısız olursa sağlayıcı kiralamayı durdurur ve gönderim güvenli biçimde başarısız olur; yarı yapılandırılmış hiçbir makine çalışır durumda bırakılmaz.

### Kurulum kanalları

- **`bundle`**, çalışan Gateway'in `dist` öğesini, budanmış bir `package.json` öğesini ve derlemenin başvurduğu tüm çalışma alanı paketlerini, tamamı bir içerik karmasıyla kapsanacak şekilde paketler. Makine, değiştirilmemiş paketi bu karmaya göre doğrular ve ardından üretim npm bağımlılıklarını kurar (betikler devre dışıdır). Bir geliştirme derlemesi çalışanda bu şekilde çalıştırılır.
- **`npm`**, sürümün genel kayıt defterinde bulunduğunu kanıtlar, SHA-512 bütünlük değerini sabitler ve Gateway ile tam olarak eşleşen `openclaw@<version>` öğesini kurar.

## Oturum gönderme

Control UI'da **New Session** öğesini açın, yapılandırılmış çalışma zamanı OpenClaw olan bir ajan seçin, **Where** menüsünden yapılandırılmış bir **Cloud · profile** hedefi seçin ve görevi başlatın. Bulut seçimi, gerekli yönetilen çalışma ağacını otomatik olarak etkinleştirir; Gateway oturumu oluşturur, gönderimi tamamlar ve ilk turu ancak bundan sonra gönderir. Oturum kenar çubuğundaki sunucu rozeti, kalıcı yerleşim durumunu gösterir. Bulut hedefleri, harici CLI oturum katalogları için sunulmaz.

Eşdeğer RPC akışı şöyledir:

Yönetilen çalışma ağacına sahip bir oturum oluşturun ve ardından gönderin (RPC, `operator.admin` gerektirir ve yalnızca profiller yapılandırıldığında bulunur):

Bulut çalışanları OpenClaw ajan çalışma zamanını çalıştırır. Bu çalışma zamanına çözümlenen bir `openai/*` veya başka bir model seçin; `claude-cli` gibi harici bir CLI çalışma zamanı için yapılandırılan oturumlar gönderilemez.

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch`, yerel tur kabulünü kapatır, etkin işleri tamamlanana kadar boşaltır, kiralamayı hazırlar, kurulumu çalıştırır, OpenClaw'ı önyükler, çalışma alanını eşitler ve yerleşim `active` çalışan sahipliğine ulaştığında döner. İlk gönderim için birkaç dakika ayırın; sağlayıcı desteklediğinde kiralamalar ve kurulumlar önbelleğe alınır. Ardından oturumla her zamanki gibi konuşun; turlar otomatik olarak çalışana yönlendirilir.

Tamamlanan çalışan turları, tur talebi serbest bırakılmadan önce uygun ve boyutu sınırlandırılmış çalışma alanı dosyalarını oturumun yönetilen çalışma ağacına geri uzlaştırır. Son çalışan olayı, onaylanmadan önce kalıcı bir bekleyen sonuç engeli oluşturur; böylece Gateway yeniden başlatma kurtarması, eski tur temizliğinin sahibini yok etmesinden önce uzak çalışma alanını geri çeker. Uzlaştırma, çalışan bildirimini doğrular ve taraflardan birinin üzerine yazmak yerine yerel ayrışma durumunda durur. Gateway, dosyaları değiştirmeden önce SQLite durum veritabanında boyutu sınırlandırılmış bir geri alma günlüğü saklar; yeniden deneme, kesintiye uğramış bir Gateway sürecinden sonra bu günlüğü kurtarır. Çalışma alanı sonuçları Git dosya semantiğini kullanır: normal dosyalar, çalıştırılabilir bitleri, sembolik bağlantılar, eklemeler, değişiklikler ve silmeler korunurken boş dizinler ve diğer dizin kipleri korunmaz. Uzak commit nesneleri korunmaz; ortaya çıkan dosya değişiklikleri normal inceleme ve commit işlemleri için yönetilen çalışma ağacında kalır.

İş tamamlandığında ve çalışan hiçbir tur yokken oturum menüsünü açıp **Stop cloud worker…** öğesini seçin. Gateway, ortamı yok etmeden önce son bir çalışma alanı uzlaştırması gerçekleştirir. Zaten `draining` veya `reconciling` durumunda olan bir yerleşim, kapatma işlemini tamamlıyordur; oturumu silmeden önce rozetinin `reclaimed` olmasını bekleyin.

Bozuk veya kontrolden çıkmış bağlı bir çalışan için operatör, son çare olarak `{ "force": true }` ile `environments.destroy` çağrısı yapabilir. Zorunlu kapatma, ortamı yok etmeden önce yerleşimi kalıcı olarak başarısız şeklinde işaretler ve uzlaştırılmamış tüm uzak sonuçlardan vazgeçer.

Eşdeğer yönetimsel RPC şöyledir:

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

Yerleşim, kalıcı bir durum makinesinden (`local → requested → provisioning → syncing → starting → active`) geçer; böylece gönderimin ortasında Gateway yeniden başlatıldığında makineler sızdırılmak yerine uzlaştırılır. Başarısız bir model turu, etkin yerleşimi yeniden deneme için kullanılabilir durumda tutar. Gelen çalışma alanı uzlaştırması başarısız olursa çalışan da etkin kalır; böylece operatör yerel çakışmayı çözebilir ve uzak sonucu kaybetmeden yeniden deneyebilir. Yaşam döngüsü hataları ise yerleşimi hata veya geri alınmış durumuna taşır ve tanılama son bölümünü korur.

## Güvenlik modeli

- **Kapalı çalışan girişi.** Çalışanlar, kapalı bir yöntem izin listesine sahip tünellenmiş soket üzerinde özel bir protokolle iletişim kurar; bir çalışan operatör RPC'lerini çağıramaz.
- **Üretilen kimlik bilgileri, bekleme durumunda karma olarak saklanır.** Her gönderim bir çalışan kimlik bilgisi üretir; Gateway yalnızca bunun karmasını saklar. Kimlik bilgisi rotasyonu ve sahip dönemi engellemesi, oturum başına en fazla bir canlı sahip bulunmasını garanti eder; yeniden bağlanan eski bir çalışan birleştirilmez, engellenir.
- **Ana makine anahtarı sabitleme.** Sağlayıcı, hazırlama sırasında makinenin SSH ana makine anahtarını sunmalıdır; önyükleme sıkı sabitlemeyle bağlanır ve anahtar olmadan güvenli biçimde başarısız olur.
- **Makinede kalıcı model, forge veya bulut kimlik bilgileri bulunmaz.** Model kimlik doğrulaması Gateway'de kalır (çıkarım `{provider, model}` referansıyla taşınır), çalışma alanı git commit'leri forge kimlik bilgileri olmadan oluşturulur ve Crabbox AWS kiralama meta verileri, kurulumdan önce örnek rolü açısından yetkili olarak denetlenir. Kurulum komutlarını da kimlik bilgisi içermeyecek şekilde tutun.
- **Sağlayıcıya ait giden trafik.** Ters tünel, OpenClaw'ın doğrudan model erişimi ihtiyacını ortadan kaldırır; ancak OpenClaw sağlayıcı güvenlik duvarlarını yeniden yazmaz. Görev gerektiriyorsa çalışan sağlayıcısındaki giden trafiği kısıtlayın.
- **Kalıcı, tam olarak bir kez yazılan transkriptler.** Çalışan, transkript gruplarını oturumun yaprağına karşı karşılaştır ve değiştir protokolüyle commit eder; eski bir taban, ücretli çıktıyı çoğaltmak veya yeniden temellendirmek yerine çalışmayı hata vererek durdurur.

## Sorun giderme

- **`sessions.dispatch` bilinmeyen bir yöntem** — hiçbir `cloudWorkers.profiles` yapılandırılmamış veya çağıran `operator.admin` yetkisine sahip değil.
- **"Bulut çalışanı turları OpenClaw çalışma zamanını gerektirir"** — yapılandırılmış çalışma zamanı OpenClaw olan bir model seçin. `claude-cli` gibi harici CLI çalışma zamanları çalışan çıkarımını desteklemez.
- **"Çalışan önyüklemesi, kiralanan ana makinede Node.js gerektirir"** — `settings.setup` içine bir Node kurulumu ekleyin (yukarıya bakın).
- **AWS örnek rolü doğrulaması başarısız oluyor** — `aws.instanceProfile` değerini (ve ayarlanmışsa `CRABBOX_AWS_INSTANCE_PROFILE` değerini) temizleyin. Crabbox 0.38.1 veya daha yeni bir sürümünü kurun; eski ikili dosyalar, AWS kabulü için gereken yetkili `providerMetadata.instanceProfileAttached` sözleşmesini sunmaz.
- **Dağıtım bir sağlayıcı hatasıyla başarısız oluyor** — yerleştirme kaydı ve `environments.list`, kurulum/önyükleme stderr çıktısının son kısmı dâhil olmak üzere son hatayı saklar. Kutular başarısızlık durumunda imha edildiğinden, bu son kısım birincil adli inceleme kaynağıdır.
- **Dağıtım sırasında istemci zaman aşımı** — `openclaw gateway call` varsayılan olarak 10s zaman aşımına sahiptir; `--timeout` için yeterince yüksek bir değer iletin (her iki durumda da dağıtım sunucu tarafında çalışmaya devam eder ve sağlama sırasında yapılan yeniden deneme `session cannot dispatch from placement provisioning` ile reddedilir).
- **Kiralama bakımı** — `crabbox list --provider <backend>` etkin kiralamaları gösterir; `crabbox stop --provider <backend> --id <lease>` birini manuel olarak serbest bırakır. Boştaki kiralamaların süresi, profilin `idleTimeout` değerine göre dolar.

## İlgili

- [Korumalı alan](/tr/gateway/sandboxing) — yerel araç yürütmenin etki alanını azaltma
- [Oturumlar CLI'si](/tr/cli/sessions) — saklanan oturumları inceleme
- [Yapılandırma referansı](/tr/gateway/configuration-reference)
