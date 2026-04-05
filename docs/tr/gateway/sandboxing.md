---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'OpenClaw sandboxing nasıl çalışır: modlar, kapsamlar, çalışma alanı erişimi ve imajlar'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-05T13:55:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 756ebd5b9806c23ba720a311df7e3b4ffef6ce41ba4315ee4b36b5ea87b26e60
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Sandboxing

OpenClaw, etki alanını azaltmak için **araçları sandbox arka uçları içinde** çalıştırabilir.
Bu **isteğe bağlıdır** ve yapılandırma ile denetlenir (`agents.defaults.sandbox` veya
`agents.list[].sandbox`). Sandboxing kapalıysa araçlar ana makinede çalışır.
Gateway ana makinede kalır; etkinleştirildiğinde araç yürütmesi yalıtılmış bir sandbox
içinde çalışır.

Bu kusursuz bir güvenlik sınırı değildir, ancak model aptalca bir şey yaptığında
dosya sistemi ve süreç erişimini anlamlı ölçüde sınırlar.

## Neler sandbox içine alınır

- Araç yürütmesi (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` vb.).
- İsteğe bağlı sandbox browser (`agents.defaults.sandbox.browser`).
  - Varsayılan olarak sandbox browser otomatik başlar (CDP'nin erişilebilir olmasını sağlar) ve browser aracı buna ihtiyaç duyduğunda devreye girer.
    `agents.defaults.sandbox.browser.autoStart` ve `agents.defaults.sandbox.browser.autoStartTimeoutMs` ile yapılandırın.
  - Varsayılan olarak sandbox browser kapsayıcıları genel `bridge` ağı yerine özel bir Docker ağı (`openclaw-sandbox-browser`) kullanır.
    `agents.defaults.sandbox.browser.network` ile yapılandırın.
  - İsteğe bağlı `agents.defaults.sandbox.browser.cdpSourceRange`, kapsayıcı kenarındaki CDP girişini bir CIDR izin listesiyle sınırlar (örneğin `172.21.0.1/32`).
  - noVNC gözlemci erişimi varsayılan olarak parola korumalıdır; OpenClaw kısa ömürlü bir token URL üretir, bu URL yerel bir bootstrap sayfası sunar ve noVNC'yi parolayla URL fragment'ında açar (query/header günlüklerinde değil).
  - `agents.defaults.sandbox.browser.allowHostControl`, sandbox içindeki oturumların açıkça ana makine browser'ını hedeflemesine izin verir.
  - İsteğe bağlı izin listeleri `target: "custom"` için geçit görevi görür: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Sandbox içine alınmayanlar:

- Gateway sürecinin kendisi.
- Açıkça sandbox dışında çalışmasına izin verilen herhangi bir araç (ör. `tools.elevated`).
  - **Elevated exec sandboxing'i atlar ve yapılandırılmış kaçış yolunu kullanır (varsayılan olarak `gateway`, `exec` hedefi `node` olduğunda `node`).**
  - Sandboxing kapalıysa `tools.elevated` yürütmeyi değiştirmez (zaten ana makinededir). Bkz. [Elevated Mode](/tools/elevated).

## Modlar

`agents.defaults.sandbox.mode`, sandboxing'in **ne zaman** kullanılacağını denetler:

- `"off"`: sandboxing yok.
- `"non-main"`: yalnızca **main olmayan** oturumları sandbox içine alır (normal sohbetlerin ana makinede olmasını istiyorsanız varsayılan).
- `"all"`: her oturum bir sandbox içinde çalışır.
  Not: `"non-main"`, ajan kimliğine değil `session.mainKey` değerine (varsayılan `"main"`) dayanır.
  Grup/kanal oturumları kendi anahtarlarını kullanır, bu nedenle main olmayan sayılır ve sandbox içine alınır.

## Kapsam

`agents.defaults.sandbox.scope`, **kaç kapsayıcı** oluşturulacağını denetler:

- `"agent"` (varsayılan): ajan başına bir kapsayıcı.
- `"session"`: oturum başına bir kapsayıcı.
- `"shared"`: tüm sandbox içindeki oturumlar tarafından paylaşılan bir kapsayıcı.

## Arka uç

`agents.defaults.sandbox.backend`, sandbox'ı **hangi çalışma zamanının** sağlayacağını denetler:

- `"docker"` (varsayılan): yerel Docker destekli sandbox çalışma zamanı.
- `"ssh"`: genel SSH destekli uzak sandbox çalışma zamanı.
- `"openshell"`: OpenShell destekli sandbox çalışma zamanı.

SSH'ye özgü yapılandırma `agents.defaults.sandbox.ssh` altında bulunur.
OpenShell'e özgü yapılandırma `plugins.entries.openshell.config` altında bulunur.

### Bir arka uç seçme

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Nerede çalışır**  | Yerel kapsayıcı                  | SSH ile erişilebilen herhangi bir ana makine | OpenShell tarafından yönetilen sandbox              |
| **Kurulum**         | `scripts/sandbox-setup.sh`       | SSH anahtarı + hedef ana makine | OpenShell eklentisi etkin                           |
| **Çalışma alanı modeli** | Bind-mount veya kopya        | Uzak-kanonik (bir kez tohumlanır) | `mirror` veya `remote`                           |
| **Ağ denetimi**     | `docker.network` (varsayılan: yok) | Uzak ana makineye bağlı       | OpenShell'e bağlı                                   |
| **Browser sandbox** | Desteklenir                      | Desteklenmez                   | Henüz desteklenmiyor                                |
| **Bind mount'lar**  | `docker.binds`                   | Yok                            | Yok                                                 |
| **En uygun olduğu durumlar** | Yerel geliştirme, tam yalıtım | Yükü uzak bir makineye aktarma | İsteğe bağlı çift yönlü senkronizasyonla yönetilen uzak sandbox'lar |

### SSH arka ucu

OpenClaw'ın `exec`, dosya araçları ve medya okumalarını
rastgele bir SSH ile erişilebilen makinede sandbox içine almasını istiyorsanız `backend: "ssh"` kullanın.

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
          // Ya da yerel dosyalar yerine SecretRef / satır içi içerik kullanın:
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
- Oluşturma veya yeniden oluşturmadan sonraki ilk kullanımda OpenClaw bu uzak çalışma alanını yerel çalışma alanından bir kez tohumlar.
- Bundan sonra `exec`, `read`, `write`, `edit`, `apply_patch`, istem medya okumaları ve gelen medya hazırlığı doğrudan uzak çalışma alanında SSH üzerinden çalışır.
- OpenClaw, uzaktaki değişiklikleri yerel çalışma alanına otomatik olarak geri senkronize etmez.

Kimlik doğrulama materyali:

- `identityFile`, `certificateFile`, `knownHostsFile`: mevcut yerel dosyaları kullanır ve bunları OpenSSH yapılandırmasından geçirir.
- `identityData`, `certificateData`, `knownHostsData`: satır içi dizeler veya SecretRef kullanır. OpenClaw bunları normal secrets çalışma zamanı anlık görüntüsü üzerinden çözer, `0600` izinleriyle geçici dosyalara yazar ve SSH oturumu bittiğinde siler.
- Aynı öğe için hem `*File` hem `*Data` ayarlanmışsa, o SSH oturumu için `*Data` kazanır.

Bu bir **uzak-kanonik** modeldir. İlk tohumlamadan sonra uzak SSH çalışma alanı gerçek sandbox durumu olur.

Önemli sonuçlar:

- Tohumlama adımından sonra OpenClaw dışında yapılan ana makine yerel düzenlemeleri, sandbox'ı yeniden oluşturana kadar uzakta görünmez.
- `openclaw sandbox recreate`, kapsam başına uzak kökü siler ve sonraki kullanımda yerelden yeniden tohumlar.
- Browser sandboxing, SSH arka ucunda desteklenmez.
- `sandbox.docker.*` ayarları SSH arka ucunda geçerli değildir.

### OpenShell arka ucu

OpenClaw'ın araçları OpenShell tarafından yönetilen uzak bir ortamda
sandbox içine almasını istiyorsanız `backend: "openshell"` kullanın. Tam kurulum kılavuzu, yapılandırma
başvurusu ve çalışma alanı modu karşılaştırması için ayrılmış
[OpenShell sayfasına](/gateway/openshell) bakın.

OpenShell, genel SSH arka ucuyla aynı çekirdek SSH taşımasını ve uzak dosya sistemi köprüsünü yeniden kullanır ve buna OpenShell'e özgü yaşam döngüsünü
(`sandbox create/get/delete`, `sandbox ssh-config`) ve isteğe bağlı `mirror`
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

- `mirror` (varsayılan): yerel çalışma alanı kanonik kalır. OpenClaw, `exec` öncesinde yerel dosyaları OpenShell'e senkronize eder ve `exec` sonrasında uzak çalışma alanını geri senkronize eder.
- `remote`: sandbox oluşturulduktan sonra OpenShell çalışma alanı kanonik olur. OpenClaw, uzak çalışma alanını bir kez yerel çalışma alanından tohumlar; sonra dosya araçları ve `exec`, değişiklikleri geri senkronize etmeden doğrudan uzak sandbox üzerinde çalışır.

Uzak taşıma ayrıntıları:

- OpenClaw, OpenShell'den `openshell sandbox ssh-config <name>` ile sandbox'a özgü SSH yapılandırmasını ister.
- Çekirdek bu SSH yapılandırmasını geçici bir dosyaya yazar, SSH oturumunu açar ve `backend: "ssh"` tarafından kullanılan aynı uzak dosya sistemi köprüsünü yeniden kullanır.
- Yaşam döngüsü yalnızca `mirror` modunda farklıdır: `exec` öncesinde yerelden uzağa senkronizasyon, sonrasında geri senkronizasyon.

Mevcut OpenShell sınırlamaları:

- sandbox browser henüz desteklenmiyor
- `sandbox.docker.binds`, OpenShell arka ucunda desteklenmiyor
- `sandbox.docker.*` altındaki Docker'a özgü çalışma zamanı ayarları yalnızca Docker arka ucunda geçerlidir

#### Çalışma alanı modları

OpenShell'in iki çalışma alanı modeli vardır. Uygulamada en önemli kısım budur.

##### `mirror`

**Yerel çalışma alanının kanonik kalmasını** istiyorsanız `plugins.entries.openshell.config.mode: "mirror"` kullanın.

Davranış:

- `exec` öncesinde OpenClaw yerel çalışma alanını OpenShell sandbox'ına senkronize eder.
- `exec` sonrasında OpenClaw uzak çalışma alanını yerel çalışma alanına geri senkronize eder.
- Dosya araçları yine sandbox köprüsü üzerinden çalışır, ancak turlar arasında doğruluk kaynağı yerel çalışma alanı olarak kalır.

Bunu şu durumlarda kullanın:

- OpenClaw dışında dosyaları yerel olarak düzenliyor ve bu değişikliklerin sandbox'ta otomatik görünmesini istiyorsanız
- OpenShell sandbox'ının olabildiğince Docker arka ucuna benzer davranmasını istiyorsanız
- Her `exec` turundan sonra ana makine çalışma alanının sandbox yazılarını yansıtmasını istiyorsanız

Ödünleşim:

- `exec` öncesi ve sonrası ek senkronizasyon maliyeti

##### `remote`

**OpenShell çalışma alanının kanonik olmasını** istiyorsanız `plugins.entries.openshell.config.mode: "remote"` kullanın.

Davranış:

- Sandbox ilk kez oluşturulduğunda OpenClaw uzak çalışma alanını bir kez yerel çalışma alanından tohumlar.
- Bundan sonra `exec`, `read`, `write`, `edit` ve `apply_patch` doğrudan uzak OpenShell çalışma alanında çalışır.
- OpenClaw, uzaktaki değişiklikleri `exec` sonrasında yerel çalışma alanına **geri senkronize etmez**.
- İstem zamanındaki medya okumaları yine çalışır çünkü dosya ve medya araçları yerel ana makine yolunu varsaymak yerine sandbox köprüsünden okur.
- Taşıma, `openshell sandbox ssh-config` tarafından döndürülen OpenShell sandbox'ına SSH ile yapılır.

Önemli sonuçlar:

- Tohumlama adımından sonra OpenClaw dışında ana makinede dosya düzenlerseniz, uzak sandbox bu değişiklikleri otomatik olarak **görmez**.
- Sandbox yeniden oluşturulursa, uzak çalışma alanı tekrar yerel çalışma alanından tohumlanır.
- `scope: "agent"` veya `scope: "shared"` ile bu uzak çalışma alanı aynı kapsamta paylaşılır.

Bunu şu durumlarda kullanın:

- sandbox esas olarak uzak OpenShell tarafında yaşamalıysa
- tur başına daha düşük senkronizasyon ek yükü istiyorsanız
- ana makine yerel düzenlemelerinin sessizce uzaktaki sandbox durumunun üzerine yazmasını istemiyorsanız

Sandbox'ı geçici bir yürütme ortamı olarak düşünüyorsanız `mirror` seçin.
Sandbox'ı gerçek çalışma alanı olarak düşünüyorsanız `remote` seçin.

#### OpenShell yaşam döngüsü

OpenShell sandbox'ları yine normal sandbox yaşam döngüsü üzerinden yönetilir:

- `openclaw sandbox list`, OpenShell çalışma zamanlarını Docker çalışma zamanlarıyla birlikte gösterir
- `openclaw sandbox recreate`, mevcut çalışma zamanını siler ve OpenClaw'ın sonraki kullanımda yeniden oluşturmasına izin verir
- budama mantığı da arka uç farkındadır

`remote` modunda yeniden oluşturma özellikle önemlidir:

- recreate, o kapsam için kanonik uzak çalışma alanını siler
- sonraki kullanım, yerel çalışma alanından yeni bir uzak çalışma alanı tohumlar

`mirror` modunda recreate esas olarak uzak yürütme ortamını sıfırlar;
çünkü zaten kanonik olan yerel çalışma alanıdır.

## Çalışma alanı erişimi

`agents.defaults.sandbox.workspaceAccess`, sandbox'ın **neleri görebileceğini** denetler:

- `"none"` (varsayılan): araçlar `~/.openclaw/sandboxes` altında bir sandbox çalışma alanı görür.
- `"ro"`: ajan çalışma alanını `/agent` altında salt okunur bağlar (`write`/`edit`/`apply_patch` devre dışı kalır).
- `"rw"`: ajan çalışma alanını `/workspace` altında okuma/yazma olarak bağlar.

OpenShell arka ucuyla:

- `mirror` modu, `exec` turları arasında yine yerel çalışma alanını kanonik kaynak olarak kullanır
- `remote` modu, ilk tohumlamadan sonra uzak OpenShell çalışma alanını kanonik kaynak olarak kullanır
- `workspaceAccess: "ro"` ve `"none"` yine aynı şekilde yazma davranışını sınırlar

Gelen medya etkin sandbox çalışma alanına kopyalanır (`media/inbound/*`).
Skills notu: `read` aracı sandbox köküne bağlıdır. `workspaceAccess: "none"` ile
OpenClaw uygun Skills öğelerini sandbox çalışma alanına (`.../skills`) yansıtır
ki okunabilsinler. `"rw"` ile çalışma alanı skills dosyaları
`/workspace/skills` altında okunabilir.

## Özel bind mount'lar

`agents.defaults.sandbox.docker.binds`, ek ana makine dizinlerini kapsayıcıya bağlar.
Biçim: `host:container:mode` (ör. `"/home/user/source:/source:rw"`).

Genel ve ajan başına bind'lar **birleştirilir** (değiştirilmez). `scope: "shared"` altında ajan başına bind'lar yok sayılır.

`agents.defaults.sandbox.browser.binds`, ek ana makine dizinlerini yalnızca **sandbox browser** kapsayıcısına bağlar.

- Ayarlandığında (`[]` dahil), browser kapsayıcısı için `agents.defaults.sandbox.docker.binds` değerinin yerini alır.
- Atlandığında browser kapsayıcısı geriye dönük uyumluluk için `agents.defaults.sandbox.docker.binds` değerine geri döner.

Örnek (salt okunur kaynak + ek bir veri dizini):

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

- Bind'lar sandbox dosya sistemini atlar: ayarladığınız kipte (`:ro` veya `:rw`) ana makine yollarını açığa çıkarırlar.
- OpenClaw tehlikeli bind kaynaklarını engeller (örneğin `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` ve bunları açığa çıkaracak üst bağlamalar).
- OpenClaw ayrıca `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` ve `~/.ssh` gibi yaygın ana dizin kimlik bilgisi köklerini de engeller.
- Bind doğrulaması yalnızca dize eşleştirmesi değildir. OpenClaw kaynak yolu normalize eder, sonra engellenen yolları ve izin verilen kökleri yeniden kontrol etmeden önce bunu en derin mevcut üst öğe üzerinden tekrar çözer.
- Bu, son yaprak henüz mevcut olmasa bile symlink üst öğe kaçışlarının yine kapalı başarısız olacağı anlamına gelir. Örnek: `/workspace/run-link/new-file`, `run-link` oraya işaret ediyorsa yine `/var/run/...` olarak çözülür.
- İzin verilen kaynak kökleri de aynı şekilde kanonikleştirilir; bu nedenle yalnızca symlink çözümlemesinden önce izin listesi içinde gibi görünen bir yol yine `outside allowed roots` olarak reddedilir.
- Hassas bağlamalar (gizli değerler, SSH anahtarları, hizmet kimlik bilgileri) kesinlikle gerekmedikçe `:ro` olmalıdır.
- Çalışma alanına yalnızca okuma erişimi gerekiyorsa `workspaceAccess: "ro"` ile birleştirin; bind kipleri bağımsız kalır.
- Bind'ların araç ilkesi ve elevated exec ile nasıl etkileştiği için bkz. [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated).

## İmajlar + kurulum

Varsayılan Docker imajı: `openclaw-sandbox:bookworm-slim`

Bir kez oluşturun:

```bash
scripts/sandbox-setup.sh
```

Not: varsayılan imaj Node içermez. Bir skill Node'a (veya
başka çalışma zamanlarına) ihtiyaç duyuyorsa ya özel bir imaj hazırlayın ya da
`sandbox.docker.setupCommand` ile yükleyin (ağ çıkışı + yazılabilir kök +
root kullanıcı gerektirir).

Daha işlevsel ve yaygın araçlara sahip bir sandbox imajı istiyorsanız (örneğin
`curl`, `jq`, `nodejs`, `python3`, `git`) şunu oluşturun:

```bash
scripts/sandbox-common-setup.sh
```

Ardından `agents.defaults.sandbox.docker.image` değerini
`openclaw-sandbox-common:bookworm-slim` olarak ayarlayın.

Sandbox browser imajı:

```bash
scripts/sandbox-browser-setup.sh
```

Varsayılan olarak Docker sandbox kapsayıcıları **ağ olmadan** çalışır.
`agents.defaults.sandbox.docker.network` ile geçersiz kılın.

Paketlenmiş sandbox browser imajı ayrıca kapsayıcılı iş yükleri için
ihtiyatlı Chromium başlangıç varsayılanları uygular. Mevcut kapsayıcı varsayılanları şunları içerir:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
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
- Üç grafik sertleştirme bayrağı (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) isteğe bağlıdır ve kapsayıcılarda GPU desteği olmadığında kullanışlıdır. İş yükünüz WebGL veya başka 3D/browser özellikleri gerektiriyorsa `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  olarak ayarlayın.
- `--disable-extensions` varsayılan olarak etkindir ve eklentiye bağımlı akışlar için
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ile kapatılabilir.
- `--renderer-process-limit=2`,
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile denetlenir; `0`, Chromium'un varsayılanını korur.

Farklı bir çalışma zamanı profiline ihtiyacınız varsa özel bir browser imajı kullanın ve
kendi entrypoint'inizi sağlayın. Yerel (kapsayıcı dışı) Chromium profilleri için
ek başlangıç bayrakları eklemek üzere `browser.extraArgs` kullanın.

Güvenlik varsayılanları:

- `network: "host"` engellenir.
- `network: "container:<id>"` varsayılan olarak engellenir (namespace join atlatma riski).
- Break-glass geçersiz kılma: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Docker kurulumları ve kapsayıcılı gateway burada bulunur:
[Docker](/install/docker)

Docker gateway dağıtımları için `scripts/docker/setup.sh`, sandbox yapılandırmasını başlatabilir.
Bu yolu etkinleştirmek için `OPENCLAW_SANDBOX=1` (veya `true`/`yes`/`on`) ayarlayın. Soket konumunu
`OPENCLAW_DOCKER_SOCKET` ile geçersiz kılabilirsiniz. Tam kurulum ve env
başvurusu: [Docker](/install/docker#agent-sandbox).

## setupCommand (bir kerelik kapsayıcı kurulumu)

`setupCommand`, sandbox kapsayıcısı oluşturulduktan sonra **bir kez** çalışır (her çalıştırmada değil).
Kapsayıcı içinde `sh -lc` ile yürütülür.

Yollar:

- Genel: `agents.defaults.sandbox.docker.setupCommand`
- Ajan başına: `agents.list[].sandbox.docker.setupCommand`

Yaygın tuzaklar:

- Varsayılan `docker.network` değeri `"none"`'dır (çıkış yok), bu yüzden paket kurulumları başarısız olur.
- `docker.network: "container:<id>"`, `dangerouslyAllowContainerNamespaceJoin: true` gerektirir ve yalnızca break-glass içindir.
- `readOnlyRoot: true` yazmaları engeller; `readOnlyRoot: false` ayarlayın veya özel bir imaj hazırlayın.
- Paket kurulumları için `user` root olmalıdır (`user` alanını atlayın veya `user: "0:0"` ayarlayın).
- Sandbox `exec`, ana makine `process.env` değerini devralmaz. Skill API anahtarları için
  `agents.defaults.sandbox.docker.env` (veya özel bir imaj) kullanın.

## Araç ilkesi + kaçış yolları

Araç izin/verme reddetme ilkeleri sandbox kurallarından önce yine uygulanır. Bir araç
genel olarak veya ajan başına reddedilmişse sandboxing onu geri getirmez.

`tools.elevated`, `exec` komutunu sandbox dışında çalıştıran açık bir kaçış yoludur (`gateway` varsayılan, `exec` hedefi `node` olduğunda `node`).
`/exec` yönergeleri yalnızca yetkili gönderenler için geçerlidir ve oturum başına kalıcıdır; `exec` işlevini kesin olarak kapatmak için
araç ilkesi reddini kullanın (bkz. [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)).

Hata ayıklama:

- Etkin sandbox modunu, araç ilkesini ve düzeltme yapılandırma anahtarlarını incelemek için `openclaw sandbox explain` kullanın.
- “Bu neden engellendi?” zihinsel modeli için bkz. [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated).
  Sıkı tutun.

## Çoklu ajan geçersiz kılmaları

Her ajan sandbox + araçları geçersiz kılabilir:
`agents.list[].sandbox` ve `agents.list[].tools` (ayrıca sandbox araç ilkesi için `agents.list[].tools.sandbox.tools`).
Öncelik için bkz. [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools).

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

- [OpenShell](/gateway/openshell) -- yönetilen sandbox arka uç kurulumu, çalışma alanı modları ve yapılandırma başvurusu
- [Sandbox Configuration](/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- “bu neden engellendi?” hata ayıklaması
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- ajan başına geçersiz kılmalar ve öncelik
- [Security](/gateway/security)
