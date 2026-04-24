---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'OpenClaw sandboxing nasıl çalışır: modlar, kapsamlar, çalışma alanı erişimi ve imajlar'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-24T09:11:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07be63b71a458a17020f33a24d60e6d8d7007d4eaea686a21acabf4815c3f653
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw, etki alanını azaltmak için **araçları sandbox arka uçları içinde** çalıştırabilir.
Bu **isteğe bağlıdır** ve yapılandırma ile kontrol edilir (`agents.defaults.sandbox` veya
`agents.list[].sandbox`). Sandboxing kapalıysa, araçlar ana makinede çalışır.
Gateway ana makinede kalır; etkinleştirildiğinde araç yürütmesi
yalıtılmış bir sandbox içinde çalışır.

Bu kusursuz bir güvenlik sınırı değildir, ancak model aptalca bir şey yaptığında
dosya sistemi ve süreç erişimini anlamlı ölçüde sınırlar.

## Neler sandbox içine alınır

- Araç yürütmesi (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, vb.).
- İsteğe bağlı sandbox browser (`agents.defaults.sandbox.browser`).
  - Varsayılan olarak sandbox browser, browser aracının ihtiyaç duyduğunda CDP'ye erişilebildiğinden emin olmak için otomatik başlar.
    `agents.defaults.sandbox.browser.autoStart` ve `agents.defaults.sandbox.browser.autoStartTimeoutMs` ile yapılandırın.
  - Varsayılan olarak sandbox browser konteynerleri, genel `bridge` ağı yerine ayrılmış bir Docker ağı (`openclaw-sandbox-browser`) kullanır.
    `agents.defaults.sandbox.browser.network` ile yapılandırın.
  - İsteğe bağlı `agents.defaults.sandbox.browser.cdpSourceRange`, konteyner kenarı CDP girişini bir CIDR izin listesiyle sınırlar (örneğin `172.21.0.1/32`).
  - noVNC gözlemci erişimi varsayılan olarak parola korumalıdır; OpenClaw, yerel bir bootstrap sayfası sunan ve noVNC'yi URL parçasında parolayla açan kısa ömürlü bir token URL'si üretir (sorgu/üst bilgi günlüklerinde değil).
  - `agents.defaults.sandbox.browser.allowHostControl`, sandbox'lı oturumların açıkça ana makine browser'ını hedeflemesine izin verir.
  - İsteğe bağlı izin listeleri `target: "custom"` için geçit görevi görür: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Sandbox içine alınmayanlar:

- Gateway sürecinin kendisi.
- Sandbox dışında çalışmasına açıkça izin verilen herhangi bir araç (ör. `tools.elevated`).
  - **Yükseltilmiş exec, sandboxing'i atlar ve yapılandırılmış kaçış yolunu kullanır (varsayılan olarak `gateway`, `exec` hedefi `node` olduğunda `node`).**
  - Sandboxing kapalıysa `tools.elevated` yürütmeyi değiştirmez (zaten ana makinededir). Bkz. [Yükseltilmiş Mod](/tr/tools/elevated).

## Modlar

`agents.defaults.sandbox.mode`, sandboxing'in **ne zaman** kullanılacağını kontrol eder:

- `"off"`: sandboxing yok.
- `"non-main"`: yalnızca **main olmayan** oturumları sandbox içine alır (normal sohbetleri ana makinede istiyorsanız varsayılan).
- `"all"`: her oturum bir sandbox içinde çalışır.
  Not: `"non-main"`, ajan kimliğine değil `session.mainKey` değerine (varsayılan `"main"`) dayanır.
  Grup/kanal oturumları kendi anahtarlarını kullanır, bu yüzden main olmayan sayılırlar ve sandbox içine alınırlar.

## Kapsam

`agents.defaults.sandbox.scope`, **kaç konteyner** oluşturulacağını kontrol eder:

- `"agent"` (varsayılan): ajan başına bir konteyner.
- `"session"`: oturum başına bir konteyner.
- `"shared"`: tüm sandbox'lı oturumlar tarafından paylaşılan tek konteyner.

## Arka uç

`agents.defaults.sandbox.backend`, sandbox'ı hangi çalışma zamanının sağlayacağını kontrol eder:

- `"docker"` (sandboxing etkin olduğunda varsayılan): yerel Docker destekli sandbox çalışma zamanı.
- `"ssh"`: genel SSH destekli uzak sandbox çalışma zamanı.
- `"openshell"`: OpenShell destekli sandbox çalışma zamanı.

SSH'ye özgü yapılandırma `agents.defaults.sandbox.ssh` altında bulunur.
OpenShell'e özgü yapılandırma `plugins.entries.openshell.config` altında bulunur.

### Arka uç seçimi

|                     | Docker                           | SSH                           | OpenShell                                              |
| ------------------- | -------------------------------- | ----------------------------- | ------------------------------------------------------ |
| **Nerede çalışır**  | Yerel konteyner                  | SSH ile erişilebilen herhangi bir ana makine | OpenShell yönetilen sandbox              |
| **Kurulum**         | `scripts/sandbox-setup.sh`       | SSH anahtarı + hedef ana makine | OpenShell Plugin etkin                               |
| **Çalışma alanı modeli** | Bind mount veya kopya       | Uzak-kanonik (bir kez besleme) | `mirror` veya `remote`                               |
| **Ağ denetimi**     | `docker.network` (varsayılan: none) | Uzak ana makineye bağlı     | OpenShell'e bağlı                                     |
| **Browser sandbox** | Desteklenir                      | Desteklenmez                  | Henüz desteklenmiyor                                  |
| **Bind mount'lar**  | `docker.binds`                   | Yok                           | Yok                                                    |
| **En uygun kullanım** | Yerel geliştirme, tam yalıtım  | Uzak bir makineye yük aktarma | İsteğe bağlı çift yönlü eşzamanlamalı yönetilen uzak sandbox'lar |

### Docker arka ucu

Sandboxing varsayılan olarak kapalıdır. Sandboxing'i etkinleştirir ve bir
arka uç seçmezseniz OpenClaw Docker arka ucunu kullanır. Araçları ve sandbox browser'larını
yerelde Docker daemon soketi (`/var/run/docker.sock`) üzerinden çalıştırır. Sandbox konteyner
yalıtımı Docker namespace'leri tarafından belirlenir.

**Docker-out-of-Docker (DooD) Kısıtları**:
OpenClaw Gateway'in kendisini bir Docker konteyneri olarak dağıtırsanız, ana makinenin Docker soketini kullanarak kardeş sandbox konteynerlerini düzenler (DooD). Bu, belirli bir yol eşleme kısıtı getirir:

- **Yapılandırma Ana Makine Yolları Gerektirir**: `openclaw.json` içindeki `workspace` yapılandırması, dahili Gateway konteyner yolu değil **Ana Makinenin mutlak yolunu** içermelidir (ör. `/home/user/.openclaw/workspaces`). OpenClaw, Docker daemon'ından bir sandbox başlatmasını istediğinde daemon yolları Gateway namespace'ine göre değil Ana Makine OS namespace'ine göre değerlendirir.
- **FS Köprü Eşliği (Aynı Volume Eşlemesi)**: OpenClaw Gateway yerel süreci de heartbeat ve köprü dosyalarını `workspace` dizinine yazar. Gateway, aynı dizgeyi (ana makine yolu) kendi konteynerleştirilmiş ortamı içinden değerlendirdiğinden, Gateway dağıtımı ana makine namespace'ini yerel olarak bağlayan aynı volume eşlemesini içermelidir (`-v /home/user/.openclaw:/home/user/.openclaw`).

Yolları mutlak ana makine eşliği olmadan içeride eşlerseniz, tam nitelikli yol dizgesi yerel olarak mevcut olmadığından OpenClaw konteyner ortamı içinde heartbeat yazmaya çalışırken doğal olarak `EACCES` izin hatası fırlatır.

### SSH arka ucu

OpenClaw'ın `exec`, dosya araçları ve medya okumalarını
SSH ile erişilebilen herhangi bir makinede sandbox içine almasını istiyorsanız `backend: "ssh"` kullanın.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Veya yerel dosyalar yerine SecretRef'ler / satır içi içerik kullanın:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Nasıl çalışır:

- OpenClaw, `sandbox.ssh.workspaceRoot` altında kapsam başına bir uzak kök oluşturur.
- Oluşturma veya yeniden oluşturmadan sonraki ilk kullanımda OpenClaw, o uzak çalışma alanını yerel çalışma alanından bir kez besler.
- Bundan sonra `exec`, `read`, `write`, `edit`, `apply_patch`, istem medya okumaları ve gelen medya hazırlama doğrudan uzak çalışma alanına SSH üzerinden karşı çalışır.
- OpenClaw, uzak değişiklikleri yerel çalışma alanına otomatik olarak geri eşzamanlamaz.

Kimlik doğrulama materyali:

- `identityFile`, `certificateFile`, `knownHostsFile`: mevcut yerel dosyaları kullanır ve bunları OpenSSH yapılandırması üzerinden geçirir.
- `identityData`, `certificateData`, `knownHostsData`: satır içi dizgeler veya SecretRef'ler kullanır. OpenClaw bunları normal gizli anahtar çalışma zamanı anlık görüntüsü üzerinden çözümler, `0600` ile geçici dosyalara yazar ve SSH oturumu bittiğinde siler.
- Aynı öğe için hem `*File` hem `*Data` ayarlanmışsa, o SSH oturumu için `*Data` önceliklidir.

Bu **uzak-kanonik** bir modeldir. İlk beslemeden sonra gerçek sandbox durumu uzak SSH çalışma alanı olur.

Önemli sonuçlar:

- Besleme adımından sonra OpenClaw dışında ana makinede yapılan yerel düzenlemeler, sandbox yeniden oluşturulana kadar uzakta görünmez.
- `openclaw sandbox recreate`, kapsam başına uzak kökü siler ve sonraki kullanımda yerelden tekrar besler.
- Browser sandboxing, SSH arka ucunda desteklenmez.
- `sandbox.docker.*` ayarları SSH arka ucuna uygulanmaz.

### OpenShell arka ucu

OpenClaw'ın araçları
OpenShell tarafından yönetilen uzak bir ortamda sandbox içine almasını istiyorsanız `backend: "openshell"` kullanın. Tam kurulum kılavuzu, yapılandırma
başvurusu ve çalışma alanı modu karşılaştırması için ayrılmış
[OpenShell sayfasına](/tr/gateway/openshell) bakın.

OpenShell, genel SSH arka ucuyla aynı çekirdek SSH taşımasını ve uzak dosya sistemi köprüsünü yeniden kullanır ve buna OpenShell'e özgü yaşam döngüsü
(`sandbox create/get/delete`, `sandbox ssh-config`) artı isteğe bağlı `mirror`
çalışma alanı modunu ekler.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

OpenShell modları:

- `mirror` (varsayılan): yerel çalışma alanı kanonik kalır. OpenClaw, `exec` öncesi yerel dosyaları OpenShell'e eşzamanlar ve `exec` sonrası uzak çalışma alanını geri eşzamanlar.
- `remote`: sandbox oluşturulduktan sonra OpenShell çalışma alanı kanonik olur. OpenClaw uzak çalışma alanını yerel çalışma alanından bir kez besler, sonra dosya araçları ve `exec`, değişiklikleri geri eşzamanlamadan doğrudan uzak sandbox'a karşı çalışır.

Uzak taşıma ayrıntıları:

- OpenClaw, `openshell sandbox ssh-config <name>` aracılığıyla OpenShell'den sandbox'a özgü SSH yapılandırması ister.
- Çekirdek bu SSH yapılandırmasını geçici bir dosyaya yazar, SSH oturumunu açar ve `backend: "ssh"` tarafından kullanılan aynı uzak dosya sistemi köprüsünü yeniden kullanır.
- Yalnızca `mirror` modunda yaşam döngüsü farklıdır: `exec` öncesi yerelden uzağa eşzamanla, sonra `exec` sonrası geri eşzamanla.

OpenShell'in geçerli sınırlamaları:

- sandbox browser henüz desteklenmiyor
- `sandbox.docker.binds`, OpenShell arka ucunda desteklenmiyor
- `sandbox.docker.*` altındaki Docker'a özgü çalışma zamanı ayarları yalnızca Docker arka ucuna uygulanmaya devam eder

#### Çalışma alanı modları

OpenShell'in iki çalışma alanı modeli vardır. Pratikte en önemli kısım budur.

##### `mirror`

**Yerel çalışma alanının kanonik kalmasını** istiyorsanız `plugins.entries.openshell.config.mode: "mirror"` kullanın.

Davranış:

- `exec` öncesi OpenClaw yerel çalışma alanını OpenShell sandbox'ına eşzamanlar.
- `exec` sonrası OpenClaw uzak çalışma alanını yerel çalışma alanına geri eşzamanlar.
- Dosya araçları yine sandbox köprüsü üzerinden çalışır, ancak yerel çalışma alanı dönüşler arasında doğruluk kaynağı olarak kalır.

Bunu şu durumlarda kullanın:

- OpenClaw dışında yerelde dosya düzenliyorsunuz ve bu değişikliklerin sandbox içinde otomatik görünmesini istiyorsunuz
- OpenShell sandbox'ının mümkün olduğunca Docker arka ucu gibi davranmasını istiyorsunuz
- Her `exec` dönüşünden sonra ana makine çalışma alanının sandbox yazılarını yansıtmasını istiyorsunuz

Takas:

- `exec` öncesi ve sonrası ek eşzamanlama maliyeti

##### `remote`

**OpenShell çalışma alanının kanonik olmasını** istiyorsanız `plugins.entries.openshell.config.mode: "remote"` kullanın.

Davranış:

- Sandbox ilk oluşturulduğunda OpenClaw uzak çalışma alanını yerel çalışma alanından bir kez besler.
- Bundan sonra `exec`, `read`, `write`, `edit` ve `apply_patch` doğrudan uzak OpenShell çalışma alanına karşı çalışır.
- OpenClaw, `exec` sonrasında uzak değişiklikleri yerel çalışma alanına **geri eşzamanlamaz**.
- İstem zamanı medya okumaları yine çalışır; çünkü dosya ve medya araçları yerel ana makine yolu varsaymak yerine sandbox köprüsü üzerinden okur.
- Taşıma, `openshell sandbox ssh-config` tarafından döndürülen OpenShell sandbox'ına SSH ile bağlanmadır.

Önemli sonuçlar:

- Besleme adımından sonra OpenClaw dışında ana makinede dosya düzenlerseniz, uzak sandbox bu değişiklikleri otomatik olarak **görmez**.
- Sandbox yeniden oluşturulursa, uzak çalışma alanı yine yerel çalışma alanından beslenir.
- `scope: "agent"` veya `scope: "shared"` kullanıldığında, bu uzak çalışma alanı aynı kapsamta paylaşılır.

Bunu şu durumlarda kullanın:

- sandbox esas olarak uzak OpenShell tarafında yaşamalıdır
- dönüş başına daha düşük eşzamanlama yükü istiyorsunuz
- ana makinedeki yerel düzenlemelerin sessizce uzak sandbox durumunun üzerine yazmasını istemiyorsunuz

Sandbox'ı geçici bir yürütme ortamı olarak düşünüyorsanız `mirror` seçin.
Sandbox'ı gerçek çalışma alanı olarak düşünüyorsanız `remote` seçin.

#### OpenShell yaşam döngüsü

OpenShell sandbox'ları yine normal sandbox yaşam döngüsü üzerinden yönetilir:

- `openclaw sandbox list`, Docker çalışma zamanlarının yanı sıra OpenShell çalışma zamanlarını da gösterir
- `openclaw sandbox recreate`, geçerli çalışma zamanını siler ve OpenClaw'ın onu sonraki kullanımda yeniden oluşturmasına izin verir
- budama mantığı da arka uç farkındalıklıdır

`remote` modu için recreate özellikle önemlidir:

- recreate, o kapsam için kanonik uzak çalışma alanını siler
- sonraki kullanım, yerel çalışma alanından yeni bir uzak çalışma alanı besler

`mirror` modu için recreate esas olarak uzak yürütme ortamını sıfırlar;
çünkü yerel çalışma alanı zaten kanonik kalır.

## Çalışma alanı erişimi

`agents.defaults.sandbox.workspaceAccess`, sandbox'ın **neyi görebileceğini** kontrol eder:

- `"none"` (varsayılan): araçlar `~/.openclaw/sandboxes` altında bir sandbox çalışma alanı görür.
- `"ro"`: ajan çalışma alanını `/agent` altında salt okunur bağlar (`write`/`edit`/`apply_patch` devre dışı kalır).
- `"rw"`: ajan çalışma alanını `/workspace` altında okuma/yazma olarak bağlar.

OpenShell arka ucunda:

- `mirror` modu, `exec` dönüşleri arasında yine yerel çalışma alanını kanonik kaynak olarak kullanır
- `remote` modu, ilk beslemeden sonra uzak OpenShell çalışma alanını kanonik kaynak olarak kullanır
- `workspaceAccess: "ro"` ve `"none"` yine yazma davranışını aynı şekilde kısıtlar

Gelen medya, etkin sandbox çalışma alanına kopyalanır (`media/inbound/*`).
Skills notu: `read` aracı sandbox köküne bağlıdır. `workspaceAccess: "none"` ile
OpenClaw uygun Skills'i sandbox çalışma alanına (`.../skills`) yansıtır; böylece
okunabilirler. `"rw"` ile çalışma alanı Skills'leri
`/workspace/skills` altından okunabilir.

## Özel bind mount'lar

`agents.defaults.sandbox.docker.binds`, ek ana makine dizinlerini konteyner içine bağlar.
Biçim: `host:container:mode` (ör. `"/home/user/source:/source:rw"`).

Genel ve ajan başına bind'ler **birleştirilir** (değiştirilmez). `scope: "shared"` altında ajan başına bind'ler yok sayılır.

`agents.defaults.sandbox.browser.binds`, ek ana makine dizinlerini yalnızca **sandbox browser** konteynerine bağlar.

- Ayarlanmışsa (`[]` dahil), browser konteyneri için `agents.defaults.sandbox.docker.binds` değerini değiştirir.
- Atlanırsa, browser konteyneri `agents.defaults.sandbox.docker.binds` değerine geri döner (geriye dönük uyumlu).

Örnek (salt okunur kaynak + ek veri dizini):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

Güvenlik notları:

- Bind'ler sandbox dosya sistemini atlar: ayarladığınız modla (`:ro` veya `:rw`) ana makine yollarını açığa çıkarırlar.
- OpenClaw tehlikeli bind kaynaklarını engeller (örneğin: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` ve bunları açığa çıkaracak üst bağlamalar).
- OpenClaw ayrıca `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` ve `~/.ssh` gibi yaygın ana dizin kimlik bilgisi köklerini de engeller.
- Bind doğrulaması yalnızca dizge eşleştirmesi değildir. OpenClaw kaynak yolu normalize eder, sonra engellenen yolları ve izin verilen kökleri tekrar denetlemeden önce onu en derin mevcut üst dizin üzerinden yeniden çözümler.
- Bu, son yaprak henüz mevcut değilse bile sembolik bağlantı üst dizin kaçışlarının yine güvenli kapanışla başarısız olacağı anlamına gelir. Örnek: `run-link` oraya işaret ediyorsa `/workspace/run-link/new-file` yine `/var/run/...` olarak çözülür.
- İzin verilen kaynak kökleri de aynı şekilde kanonikleştirilir; yani yalnızca sembolik bağlantı çözümlemesinden önce izin listesi içinde görünüyor olan bir yol yine `outside allowed roots` olarak reddedilir.
- Hassas bağlamalar (gizli anahtarlar, SSH anahtarları, hizmet kimlik bilgileri) kesinlikle gerekmedikçe `:ro` olmalıdır.
- Çalışma alanına yalnızca okuma erişimi gerekiyorsa `workspaceAccess: "ro"` ile birleştirin; bind modları bağımsız kalır.
- Bind'lerin araç politikası ve yükseltilmiş exec ile nasıl etkileştiği için [Sandbox ve Araç Politikası ve Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) bölümüne bakın.

## İmajlar + kurulum

Varsayılan Docker imajı: `openclaw-sandbox:bookworm-slim`

Bir kez derleyin:

```bash
scripts/sandbox-setup.sh
```

Not: varsayılan imaj **Node** içermez. Bir skill Node'a (veya
başka çalışma zamanlarına) ihtiyaç duyuyorsa, ya özel bir imaj oluşturun ya da
`sandbox.docker.setupCommand` üzerinden kurun (ağ çıkışı + yazılabilir kök +
root kullanıcı gerektirir).

Ortak araçlarla (örneğin
`curl`, `jq`, `nodejs`, `python3`, `git`) daha işlevsel bir sandbox imajı istiyorsanız şunu derleyin:

```bash
scripts/sandbox-common-setup.sh
```

Sonra `agents.defaults.sandbox.docker.image` değerini
`openclaw-sandbox-common:bookworm-slim` olarak ayarlayın.

Sandbox browser imajı:

```bash
scripts/sandbox-browser-setup.sh
```

Varsayılan olarak Docker sandbox konteynerleri **ağ olmadan** çalışır.
`agents.defaults.sandbox.docker.network` ile geçersiz kılın.

Paketlenmiş sandbox browser imajı da konteynerleştirilmiş iş yükleri için
temkinli Chromium başlangıç varsayılanları uygular. Geçerli konteyner varsayılanları şunları içerir:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<OPENCLAW_BROWSER_CDP_PORT değerinden türetilir>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `noSandbox` etkin olduğunda `--no-sandbox` ve `--disable-setuid-sandbox`.
- Üç grafik sıkılaştırma bayrağı (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) isteğe bağlıdır ve konteynerlerde GPU desteği olmadığında yararlıdır.
  İş yükünüz WebGL veya diğer 3D/browser özelliklerini gerektiriyorsa `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  ayarlayın.
- `--disable-extensions` varsayılan olarak etkindir ve uzantıya bağımlı akışlar için
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ile devre dışı bırakılabilir.
- `--renderer-process-limit=2`,
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile kontrol edilir; burada `0`, Chromium'un varsayılanını korur.

Farklı bir çalışma zamanı profiline ihtiyacınız varsa, özel bir browser imajı kullanın ve
kendi giriş noktanızı sağlayın. Yerel (konteyner dışı) Chromium profilleri için
ek başlangıç bayrakları eklemek üzere `browser.extraArgs` kullanın.

Güvenlik varsayılanları:

- `network: "host"` engellenir.
- `network: "container:<id>"` varsayılan olarak engellenir (namespace birleştirme atlama riski).
- Acil durum geçersiz kılması: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Docker kurulumları ve konteynerleştirilmiş Gateway burada bulunur:
[Docker](/tr/install/docker)

Docker Gateway dağıtımları için `scripts/docker/setup.sh`, sandbox yapılandırmasını başlatabilir.
Bu yolu etkinleştirmek için `OPENCLAW_SANDBOX=1` (veya `true`/`yes`/`on`) ayarlayın.
Soket konumunu `OPENCLAW_DOCKER_SOCKET` ile geçersiz kılabilirsiniz. Tam kurulum ve ortam
başvurusu: [Docker](/tr/install/docker#agent-sandbox).

## setupCommand (tek seferlik konteyner kurulumu)

`setupCommand`, sandbox konteyneri oluşturulduktan sonra **bir kez** çalışır (her çalıştırmada değil).
Konteyner içinde `sh -lc` aracılığıyla yürütülür.

Yollar:

- Genel: `agents.defaults.sandbox.docker.setupCommand`
- Ajan başına: `agents.list[].sandbox.docker.setupCommand`

Yaygın tuzaklar:

- Varsayılan `docker.network`, `"none"` değeridir (çıkış yok), bu yüzden paket kurulumları başarısız olur.
- `docker.network: "container:<id>"`, `dangerouslyAllowContainerNamespaceJoin: true` gerektirir ve yalnızca acil durum içindir.
- `readOnlyRoot: true`, yazmayı engeller; `readOnlyRoot: false` ayarlayın veya özel imaj oluşturun.
- Paket kurulumları için `user` root olmalıdır (`user` değerini atlayın veya `user: "0:0"` ayarlayın).
- Sandbox exec, ana makine `process.env` değerini devralmaz. Skill API anahtarları için
  `agents.defaults.sandbox.docker.env` (veya özel bir imaj) kullanın.

## Araç politikası + kaçış kapıları

Araç izin/verme politikaları, sandbox kurallarından önce yine uygulanır. Bir araç
genel olarak veya ajan başına reddedilmişse, sandboxing onu geri getirmez.

`tools.elevated`, `exec` komutunu sandbox dışında çalıştıran açık bir kaçış kapısıdır (`gateway` varsayılan, `exec` hedefi `node` olduğunda `node`).
`/exec` yönergeleri yalnızca yetkili gönderenler için geçerlidir ve oturum başına kalıcı olur; `exec`i kesin olarak devre dışı bırakmak için
araç politikası reddi kullanın (bkz. [Sandbox ve Araç Politikası ve Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Hata ayıklama:

- Etkin sandbox modunu, araç politikasını ve düzeltme yapılandırma anahtarlarını incelemek için `openclaw sandbox explain` kullanın.
- “Bu neden engellendi?” zihinsel modeli için [Sandbox ve Araç Politikası ve Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) bölümüne bakın.
  Sıkı tutun.

## Çok ajanlı geçersiz kılmalar

Her ajan sandbox + araçları geçersiz kılabilir:
`agents.list[].sandbox` ve `agents.list[].tools` (ayrıca sandbox araç politikası için `agents.list[].tools.sandbox.tools`).
Öncelik için [Çok Ajanlı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

## Asgari etkinleştirme örneği

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## İlgili belgeler

- [OpenShell](/tr/gateway/openshell) -- yönetilen sandbox arka ucu kurulumu, çalışma alanı modları ve yapılandırma başvurusu
- [Sandbox Yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox ve Araç Politikası ve Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) -- "bu neden engellendi?" hata ayıklaması
- [Çok Ajanlı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) -- ajan başına geçersiz kılmalar ve öncelik
- [Güvenlik](/tr/gateway/security)
