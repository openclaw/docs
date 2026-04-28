---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClaw sandbox''ının nasıl çalıştığı: modlar, kapsamlar, çalışma alanı erişimi ve imajlar'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-26T11:31:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83930d5533832f2ece5fd069c15670f8a73c5801c829ca85c249a4582d36ff29
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw, etki alanını azaltmak için **araçları sandbox arka uçları içinde** çalıştırabilir. Bu **isteğe bağlıdır** ve yapılandırma ile denetlenir (`agents.defaults.sandbox` veya `agents.list[].sandbox`). Sandboxing kapalıysa araçlar host üzerinde çalışır. Gateway host üzerinde kalır; etkinleştirildiğinde araç yürütmesi yalıtılmış bir sandbox içinde çalışır.

<Note>
Bu kusursuz bir güvenlik sınırı değildir, ancak model aptalca bir şey yaptığında dosya sistemi ve süreç erişimini anlamlı ölçüde sınırlar.
</Note>

## Neler sandbox içine alınır

- Araç yürütmesi (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` vb.).
- İsteğe bağlı sandbox tarayıcı (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandbox tarayıcı ayrıntıları">
    - Varsayılan olarak sandbox tarayıcı, tarayıcı aracının ihtiyacı olduğunda otomatik başlar (CDP'nin erişilebilir olmasını sağlar). `agents.defaults.sandbox.browser.autoStart` ve `agents.defaults.sandbox.browser.autoStartTimeoutMs` ile yapılandırın.
    - Varsayılan olarak sandbox tarayıcı kapsayıcıları, genel `bridge` ağı yerine adanmış bir Docker ağı (`openclaw-sandbox-browser`) kullanır. `agents.defaults.sandbox.browser.network` ile yapılandırın.
    - İsteğe bağlı `agents.defaults.sandbox.browser.cdpSourceRange`, kapsayıcı kenarı CDP girişini bir CIDR izin listesiyle sınırlar (örneğin `172.21.0.1/32`).
    - noVNC gözlemci erişimi varsayılan olarak parola korumalıdır; OpenClaw kısa ömürlü bir belirteç URL'si üretir, bu URL yerel bir bootstrap sayfası sunar ve noVNC'yi parola URL fragment'ında açar (sorgu/üstbilgi günlüklerinde değil).
    - `agents.defaults.sandbox.browser.allowHostControl`, sandbox içindeki oturumların host tarayıcıyı açıkça hedeflemesine izin verir.
    - İsteğe bağlı izin listeleri `target: "custom"` için geçit görevi görür: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Sandbox içine alınmayanlar:

- Gateway sürecinin kendisi.
- Açıkça sandbox dışında çalışmasına izin verilen herhangi bir araç (örneğin `tools.elevated`).
  - **Elevated exec, sandboxing'i atlar ve yapılandırılmış kaçış yolunu kullanır (varsayılan olarak `gateway`, ya da exec hedefi `node` olduğunda `node`).**
  - Sandboxing kapalıysa `tools.elevated` yürütmeyi değiştirmez (zaten host üzerindedir). Bkz. [Elevated Mode](/tr/tools/elevated).

## Modlar

`agents.defaults.sandbox.mode`, sandboxing'in **ne zaman** kullanılacağını denetler:

<Tabs>
  <Tab title="off">
    Sandboxing yok.
  </Tab>
  <Tab title="non-main">
    Yalnızca **ana olmayan** oturumları sandbox içine alır (normal sohbetleri host üzerinde istiyorsanız varsayılan).

    `"non-main"`, ajan kimliğine değil `session.mainKey` değerine (varsayılan `"main"`) dayanır. Grup/kanal oturumları kendi anahtarlarını kullanır, bu nedenle ana olmayan sayılır ve sandbox içine alınır.

  </Tab>
  <Tab title="all">
    Her oturum bir sandbox içinde çalışır.
  </Tab>
</Tabs>

## Kapsam

`agents.defaults.sandbox.scope`, **kaç kapsayıcı** oluşturulacağını denetler:

- `"agent"` (varsayılan): ajan başına bir kapsayıcı.
- `"session"`: oturum başına bir kapsayıcı.
- `"shared"`: tüm sandbox'lı oturumlar tarafından paylaşılan tek bir kapsayıcı.

## Arka uç

`agents.defaults.sandbox.backend`, sandbox'ı **hangi çalışma zamanının** sağlayacağını denetler:

- `"docker"` (sandboxing etkin olduğunda varsayılan): yerel Docker destekli sandbox çalışma zamanı.
- `"ssh"`: genel SSH destekli uzak sandbox çalışma zamanı.
- `"openshell"`: OpenShell destekli sandbox çalışma zamanı.

SSH'ye özgü yapılandırma `agents.defaults.sandbox.ssh` altında bulunur. OpenShell'e özgü yapılandırma `plugins.entries.openshell.config` altında bulunur.

### Arka uç seçimi

|                     | Docker                           | SSH                             | OpenShell                                                |
| ------------------- | -------------------------------- | ------------------------------- | -------------------------------------------------------- |
| **Nerede çalışır**  | Yerel kapsayıcı                  | SSH ile erişilebilen herhangi bir host | OpenShell tarafından yönetilen sandbox               |
| **Kurulum**         | `scripts/sandbox-setup.sh`       | SSH anahtarı + hedef host       | OpenShell Plugin'i etkin                                 |
| **Çalışma alanı modeli** | Bind-mount veya kopya        | Uzak-kanonik (bir kez tohumlama) | `mirror` veya `remote`                                  |
| **Ağ denetimi**     | `docker.network` (varsayılan: none) | Uzak hosta bağlı             | OpenShell'e bağlı                                        |
| **Tarayıcı sandbox'ı** | Desteklenir                  | Desteklenmez                    | Henüz desteklenmiyor                                     |
| **Bind mount'lar**  | `docker.binds`                   | Yok                             | Yok                                                      |
| **En uygun kullanım** | Yerel geliştirme, tam yalıtım | Uzak makineye yük aktarma       | İsteğe bağlı çift yönlü eşzamanlamalı yönetilen uzak sandbox'lar |

### Docker arka ucu

Sandboxing varsayılan olarak kapalıdır. Sandboxing'i etkinleştirir ve bir arka uç seçmezseniz, OpenClaw Docker arka ucunu kullanır. Araçları ve sandbox tarayıcılarını Docker daemon soketi (`/var/run/docker.sock`) üzerinden yerelde yürütür. Sandbox kapsayıcı yalıtımı Docker namespace'leri tarafından belirlenir.

<Warning>
**Docker-out-of-Docker (DooD) kısıtları**

OpenClaw Gateway'in kendisini bir Docker kapsayıcısı olarak dağıtırsanız, host'un Docker soketini kullanarak kardeş sandbox kapsayıcıları düzenler (DooD). Bu, belirli bir yol eşleme kısıtı getirir:

- **Yapılandırma host yolları gerektirir**: `openclaw.json` içindeki `workspace` yapılandırması, dahili Gateway kapsayıcı yolunu değil, **Host'un mutlak yolunu** içermelidir (ör. `/home/user/.openclaw/workspaces`). OpenClaw Docker daemon'dan bir sandbox başlatmasını istediğinde, daemon yolları Gateway namespace'ine değil Host OS namespace'ine göre değerlendirir.
- **FS bridge eşliği (özdeş volume map)**: OpenClaw Gateway yerel süreci de `workspace` dizinine Heartbeat ve bridge dosyaları yazar. Gateway aynı dizgeyi (host yolu) kendi kapsayıcılı ortamı içinden değerlendirirken, Gateway dağıtımı host namespace'ini yerel olarak bağlayan özdeş bir volume map içermelidir (`-v /home/user/.openclaw:/home/user/.openclaw`).

Mutlak host eşliği olmadan yolları dahili olarak eşlerseniz, OpenClaw kapsayıcı ortamında Heartbeat yazmaya çalışırken bu tam nitelikli yol dizgesi yerel olarak mevcut olmadığından `EACCES` izin hatası fırlatır.
</Warning>

### SSH arka ucu

OpenClaw'ın `exec`, dosya araçları ve medya okumalarını SSH ile erişilebilen herhangi bir makinede sandbox içine almasını istiyorsanız `backend: "ssh"` kullanın.

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
          // Veya yerel dosyalar yerine SecretRef / satır içi içerik kullanın:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Nasıl çalışır">
    - OpenClaw, `sandbox.ssh.workspaceRoot` altında kapsam başına bir uzak kök oluşturur.
    - Oluşturma veya yeniden oluşturmadan sonraki ilk kullanımda, bu uzak çalışma alanını bir kez yerel çalışma alanından tohumlar.
    - Bundan sonra `exec`, `read`, `write`, `edit`, `apply_patch`, istem medya okumaları ve gelen medya aşamalandırma doğrudan SSH üzerinden uzak çalışma alanına karşı çalışır.
    - OpenClaw, uzak değişiklikleri otomatik olarak yerel çalışma alanına geri eşzamanlamaz.

  </Accordion>
  <Accordion title="Kimlik doğrulama materyali">
    - `identityFile`, `certificateFile`, `knownHostsFile`: mevcut yerel dosyaları kullanır ve OpenSSH yapılandırması üzerinden geçirir.
    - `identityData`, `certificateData`, `knownHostsData`: satır içi dizgeler veya SecretRef kullanır. OpenClaw bunları normal secrets çalışma zamanı anlık görüntüsü üzerinden çözümler, `0600` ile geçici dosyalara yazar ve SSH oturumu bittiğinde siler.
    - Aynı öğe için hem `*File` hem `*Data` ayarlanmışsa, o SSH oturumu için `*Data` kazanır.

  </Accordion>
  <Accordion title="Uzak-kanonik sonuçlar">
    Bu bir **uzak-kanonik** modeldir. Uzak SSH çalışma alanı, ilk tohumlamadan sonra gerçek sandbox durumu haline gelir.

    - Tohumlama adımından sonra OpenClaw dışında yapılan host-yerel düzenlemeler, sandbox'ı yeniden oluşturana kadar uzakta görünmez.
    - `openclaw sandbox recreate`, kapsam başına uzak kökü siler ve sonraki kullanımda yeniden yerelden tohumlar.
    - Tarayıcı sandbox'ı SSH arka ucunda desteklenmez.
    - `sandbox.docker.*` ayarları SSH arka ucu için geçerli değildir.

  </Accordion>
</AccordionGroup>

### OpenShell arka ucu

OpenClaw'ın araçları OpenShell tarafından yönetilen uzak bir ortamda sandbox içine almasını istiyorsanız `backend: "openshell"` kullanın. Tam kurulum kılavuzu, yapılandırma başvurusu ve çalışma alanı modu karşılaştırması için özel [OpenShell sayfasına](/tr/gateway/openshell) bakın.

OpenShell, genel SSH arka ucuyla aynı çekirdek SSH taşımasını ve uzak dosya sistemi bridge'ini yeniden kullanır, ayrıca OpenShell'e özgü yaşam döngüsü (`sandbox create/get/delete`, `sandbox ssh-config`) ve isteğe bağlı `mirror` çalışma alanı modunu ekler.

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

- `mirror` (varsayılan): yerel çalışma alanı kanonik kalır. OpenClaw exec öncesi yerel dosyaları OpenShell'e eşzamanlar ve exec sonrası uzak çalışma alanını geri eşzamanlar.
- `remote`: OpenShell çalışma alanı, sandbox oluşturulduktan sonra kanonik olur. OpenClaw uzak çalışma alanını bir kez yerel çalışma alanından tohumlar, sonra dosya araçları ve exec, değişiklikleri geri eşzamanlamadan doğrudan uzak sandbox'a karşı çalışır.

<AccordionGroup>
  <Accordion title="Uzak taşıma ayrıntıları">
    - OpenClaw, OpenShell'den `openshell sandbox ssh-config <name>` aracılığıyla sandbox'a özgü SSH yapılandırması ister.
    - Çekirdek bu SSH yapılandırmasını geçici bir dosyaya yazar, SSH oturumunu açar ve `backend: "ssh"` tarafından kullanılan aynı uzak dosya sistemi bridge'ini yeniden kullanır.
    - Yalnızca `mirror` modunda yaşam döngüsü farklıdır: exec öncesi yerelden uzağa eşzamanla, sonra geri eşzamanla.

  </Accordion>
  <Accordion title="Geçerli OpenShell sınırlamaları">
    - sandbox tarayıcı henüz desteklenmiyor
    - `sandbox.docker.binds`, OpenShell arka ucunda desteklenmiyor
    - `sandbox.docker.*` altındaki Docker'a özgü çalışma zamanı düğmeleri yalnızca Docker arka ucuna uygulanır

  </Accordion>
</AccordionGroup>

#### Çalışma alanı modları

OpenShell'in iki çalışma alanı modeli vardır. Pratikte en önemli kısım budur.

<Tabs>
  <Tab title="mirror (yerel kanonik)">
    **Yerel çalışma alanının kanonik kalmasını** istiyorsanız `plugins.entries.openshell.config.mode: "mirror"` kullanın.

    Davranış:

    - `exec` öncesinde OpenClaw yerel çalışma alanını OpenShell sandbox'ına eşzamanlar.
    - `exec` sonrasında OpenClaw uzak çalışma alanını yerel çalışma alanına geri eşzamanlar.
    - Dosya araçları yine sandbox bridge'i üzerinden çalışır, ancak turlar arasında doğruluk kaynağı yerel çalışma alanı olmaya devam eder.

    Bunu şu durumlarda kullanın:

    - OpenClaw dışında dosyaları yerelde düzenliyor ve bu değişikliklerin sandbox'ta otomatik görünmesini istiyorsanız
    - OpenShell sandbox'ının mümkün olduğunca Docker arka ucuna benzemesini istiyorsanız
    - Her exec turundan sonra host çalışma alanının sandbox yazımlarını yansıtmasını istiyorsanız

    Ödünleşim: exec öncesi ve sonrası ek eşzamanlama maliyeti.

  </Tab>
  <Tab title="remote (OpenShell kanonik)">
    **OpenShell çalışma alanının kanonik hale gelmesini** istiyorsanız `plugins.entries.openshell.config.mode: "remote"` kullanın.

    Davranış:

    - Sandbox ilk oluşturulduğunda OpenClaw uzak çalışma alanını bir kez yerel çalışma alanından tohumlar.
    - Bundan sonra `exec`, `read`, `write`, `edit` ve `apply_patch` doğrudan uzak OpenShell çalışma alanına karşı çalışır.
    - OpenClaw, exec sonrasında uzak değişiklikleri yerel çalışma alanına **geri eşzamanlamaz**.
    - İstem zamanı medya okumaları yine çalışır çünkü dosya ve medya araçları yerel host yolunu varsaymak yerine sandbox bridge'i üzerinden okur.
    - Taşıma, `openshell sandbox ssh-config` tarafından döndürülen OpenShell sandbox'ına SSH ile yapılır.

    Önemli sonuçlar:

    - Tohumlama adımından sonra OpenClaw dışında host üzerinde dosyaları düzenlerseniz, uzak sandbox bu değişiklikleri otomatik olarak **görmez**.
    - Sandbox yeniden oluşturulursa, uzak çalışma alanı tekrar yerel çalışma alanından tohumlanır.
    - `scope: "agent"` veya `scope: "shared"` ile bu uzak çalışma alanı aynı kapsamda paylaşılır.

    Bunu şu durumlarda kullanın:

    - sandbox öncelikle uzak OpenShell tarafında yaşamalıysa
    - tur başına daha düşük eşzamanlama yükü istiyorsanız
    - host-yerel düzenlemelerin uzak sandbox durumunun üzerine sessizce yazmasını istemiyorsanız

  </Tab>
</Tabs>

Sandbox'ı geçici bir yürütme ortamı olarak düşünüyorsanız `mirror` seçin. Sandbox'ı gerçek çalışma alanı olarak düşünüyorsanız `remote` seçin.

#### OpenShell yaşam döngüsü

OpenShell sandbox'ları yine normal sandbox yaşam döngüsü üzerinden yönetilir:

- `openclaw sandbox list`, Docker çalışma zamanlarının yanı sıra OpenShell çalışma zamanlarını da gösterir
- `openclaw sandbox recreate`, geçerli çalışma zamanını siler ve sonraki kullanımda OpenClaw'ın bunu yeniden oluşturmasına izin verir
- prune mantığı da arka uç farkındalıklıdır

`remote` modu için recreate özellikle önemlidir:

- recreate, o kapsam için kanonik uzak çalışma alanını siler
- sonraki kullanım, yerel çalışma alanından yeni bir uzak çalışma alanı tohumlar

`mirror` modu için recreate, esasen uzak yürütme ortamını sıfırlar çünkü yerel çalışma alanı zaten kanonik kalır.

## Çalışma alanı erişimi

`agents.defaults.sandbox.workspaceAccess`, sandbox'ın **neyi görebileceğini** denetler:

<Tabs>
  <Tab title="none (varsayılan)">
    Araçlar, `~/.openclaw/sandboxes` altında bir sandbox çalışma alanı görür.
  </Tab>
  <Tab title="ro">
    Ajan çalışma alanını `/agent` altında salt okunur bağlar (`write`/`edit`/`apply_patch` devre dışı kalır).
  </Tab>
  <Tab title="rw">
    Ajan çalışma alanını `/workspace` altında okuma/yazma olarak bağlar.
  </Tab>
</Tabs>

OpenShell arka ucuyla:

- `mirror` modu, exec turları arasında yine yerel çalışma alanını kanonik kaynak olarak kullanır
- `remote` modu, ilk tohumlamadan sonra uzak OpenShell çalışma alanını kanonik kaynak olarak kullanır
- `workspaceAccess: "ro"` ve `"none"` yine aynı şekilde yazma davranışını sınırlar

Gelen medya, etkin sandbox çalışma alanına kopyalanır (`media/inbound/*`).

<Note>
**Skills notu:** `read` aracı sandbox köküne bağlıdır. `workspaceAccess: "none"` ile OpenClaw, okunabilmeleri için uygun Skills'i sandbox çalışma alanına (`.../skills`) yansıtır. `"rw"` ile çalışma alanı Skills'i `/workspace/skills` üzerinden okunabilir.
</Note>

## Özel bind mount'lar

`agents.defaults.sandbox.docker.binds`, ek host dizinlerini kapsayıcıya bağlar. Biçim: `host:container:mode` (örn. `"/home/user/source:/source:rw"`).

Genel ve ajan başına bind'ler **birleştirilir** (yerine geçmez). `scope: "shared"` altında ajan başına bind'ler yok sayılır.

`agents.defaults.sandbox.browser.binds`, ek host dizinlerini yalnızca **sandbox tarayıcı** kapsayıcısına bağlar.

- Ayarlandığında (`[]` dahil), tarayıcı kapsayıcısı için `agents.defaults.sandbox.docker.binds` değerinin yerine geçer.
- Atlandığında, tarayıcı kapsayıcısı `agents.defaults.sandbox.docker.binds` değerine geri döner (geriye dönük uyumlu).

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

<Warning>
**Bind güvenliği**

- Bind'ler sandbox dosya sistemini atlar: ayarladığınız modla (`:ro` veya `:rw`) host yollarını açığa çıkarır.
- OpenClaw tehlikeli bind kaynaklarını engeller (örneğin: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` ve bunları açığa çıkaracak üst bağlamalar).
- OpenClaw ayrıca `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` ve `~/.ssh` gibi yaygın home dizini kimlik bilgisi köklerini de engeller.
- Bind doğrulaması yalnızca dizge eşleştirme değildir. OpenClaw kaynak yolu normalleştirir, sonra engellenen yolları ve izin verilen kökleri yeniden denetlemeden önce bunu en derin mevcut ata üzerinden tekrar çözümler.
- Bu, son yaprak henüz mevcut olmasa bile symlink üst düğüm kaçışlarının yine kapalı şekilde başarısız olduğu anlamına gelir. Örnek: `/workspace/run-link/new-file`, `run-link` orayı işaret ediyorsa yine `/var/run/...` olarak çözülür.
- İzin verilen kaynak kökleri de aynı şekilde kanonikleştirilir; dolayısıyla symlink çözümlemesinden önce yalnızca izin listesi içinde görünüyormuş gibi duran bir yol yine `outside allowed roots` olarak reddedilir.
- Hassas bağlamalar (gizli bilgiler, SSH anahtarları, hizmet kimlik bilgileri) kesinlikle gerekmedikçe `:ro` olmalıdır.
- Çalışma alanına yalnızca okuma erişimi gerekiyorsa `workspaceAccess: "ro"` ile birleştirin; bind modları bağımsız kalır.
- Bind'lerin araç ilkesi ve elevated exec ile nasıl etkileştiği için bkz. [Sandbox ve Araç İlkesi ve Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated).

</Warning>

## İmajlar ve kurulum

Varsayılan Docker imajı: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Varsayılan imajı derleyin">
    ```bash
    scripts/sandbox-setup.sh
    ```

    Varsayılan imaj **Node** içermez. Bir skill Node'a (veya başka çalışma zamanlarına) ihtiyaç duyuyorsa, ya özel bir imaj hazırlayın ya da `sandbox.docker.setupCommand` ile kurun (ağ çıkışı + yazılabilir kök + root kullanıcı gerekir).

  </Step>
  <Step title="İsteğe bağlı: common imajı derleyin">
    Daha işlevsel, yaygın araçlar içeren bir sandbox imajı için (örneğin `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Sonra `agents.defaults.sandbox.docker.image` değerini `openclaw-sandbox-common:bookworm-slim` olarak ayarlayın.

  </Step>
  <Step title="İsteğe bağlı: sandbox tarayıcı imajını derleyin">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

Varsayılan olarak Docker sandbox kapsayıcıları **ağ olmadan** çalışır. `agents.defaults.sandbox.docker.network` ile geçersiz kılın.

<AccordionGroup>
  <Accordion title="Sandbox tarayıcı Chromium varsayılanları">
    Paketlenmiş sandbox tarayıcı imajı, kapsayıcılı iş yükleri için ihtiyatlı Chromium başlatma varsayılanlarını da uygular. Geçerli kapsayıcı varsayılanları şunları içerir:

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
    - `noSandbox` etkin olduğunda `--no-sandbox`.
    - Üç grafik sağlamlaştırma bayrağı (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) isteğe bağlıdır ve kapsayıcıların GPU desteği olmadığı durumlarda yararlıdır. İş yükünüz WebGL veya diğer 3D/tarayıcı özellikleri gerektiriyorsa `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` ayarlayın.
    - `--disable-extensions` varsayılan olarak etkindir ve extension bağımlı akışlar için `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ile devre dışı bırakılabilir.
    - `--renderer-process-limit=2`, `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile denetlenir; `0`, Chromium varsayılanını korur.

    Farklı bir çalışma zamanı profiline ihtiyacınız varsa özel bir tarayıcı imajı kullanın ve kendi entrypoint'inizi sağlayın. Yerel (kapsayıcı olmayan) Chromium profilleri için ek başlatma bayrakları eklemek üzere `browser.extraArgs` kullanın.

  </Accordion>
  <Accordion title="Ağ güvenliği varsayılanları">
    - `network: "host"` engellenir.
    - `network: "container:<id>"` varsayılan olarak engellenir (namespace join atlatma riski).
    - Acil durum geçersiz kılma: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker kurulumları ve kapsayıcılı gateway burada açıklanır: [Docker](/tr/install/docker)

Docker gateway dağıtımları için `scripts/docker/setup.sh`, sandbox yapılandırmasını önyükleyebilir. Bu yolu etkinleştirmek için `OPENCLAW_SANDBOX=1` (veya `true`/`yes`/`on`) ayarlayın. Soket konumunu `OPENCLAW_DOCKER_SOCKET` ile geçersiz kılabilirsiniz. Tam kurulum ve ortam başvurusu: [Docker](/tr/install/docker#agent-sandbox).

## setupCommand (tek seferlik kapsayıcı kurulumu)

`setupCommand`, sandbox kapsayıcısı oluşturulduktan sonra **bir kez** çalışır (her çalıştırmada değil). Kapsayıcı içinde `sh -lc` aracılığıyla yürütülür.

Yollar:

- Genel: `agents.defaults.sandbox.docker.setupCommand`
- Ajan başına: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Yaygın tuzaklar">
    - Varsayılan `docker.network`, `"none"` şeklindedir (çıkış yok), bu nedenle paket kurulumları başarısız olur.
    - `docker.network: "container:<id>"`, `dangerouslyAllowContainerNamespaceJoin: true` gerektirir ve yalnızca acil durum içindir.
    - `readOnlyRoot: true`, yazmayı engeller; `readOnlyRoot: false` ayarlayın veya özel imaj hazırlayın.
    - Paket kurulumları için `user` root olmalıdır (`user`'ı atlayın veya `user: "0:0"` ayarlayın).
    - Sandbox exec, host `process.env` değerini devralmaz. Skill API anahtarları için `agents.defaults.sandbox.docker.env` (veya özel imaj) kullanın.

  </Accordion>
</AccordionGroup>

## Araç ilkesi ve kaçış kapıları

Araç izin/verme ve reddetme ilkeleri, sandbox kurallarından önce yine uygulanır. Bir araç genel olarak veya ajan başına reddedilmişse, sandboxing bunu geri getirmez.

`tools.elevated`, `exec` işlemini sandbox dışında çalıştıran açık bir kaçış kapısıdır (varsayılan olarak `gateway`, ya da exec hedefi `node` olduğunda `node`). `/exec` yönergeleri yalnızca yetkili gönderenlere uygulanır ve oturum başına kalıcıdır; `exec`'i kesin olarak devre dışı bırakmak için araç ilkesi reddi kullanın (bkz. [Sandbox ve Araç İlkesi ve Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Hata ayıklama:

- Etkin sandbox modunu, araç ilkesini ve düzeltme yapılandırma anahtarlarını incelemek için `openclaw sandbox explain` kullanın.
- "Bu neden engellendi?" zihinsel modeli için bkz. [Sandbox ve Araç İlkesi ve Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated).

Sıkı tutun.

## Çok ajanlı geçersiz kılmalar

Her ajan sandbox + araçları geçersiz kılabilir: `agents.list[].sandbox` ve `agents.list[].tools` (ayrıca sandbox araç ilkesi için `agents.list[].tools.sandbox.tools`). Öncelik için bkz. [Multi-Agent Sandbox & Tools](/tr/tools/multi-agent-sandbox-tools).

## En küçük etkinleştirme örneği

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

## İlgili

- [Multi-Agent Sandbox & Tools](/tr/tools/multi-agent-sandbox-tools) — ajan başına geçersiz kılmalar ve öncelik
- [OpenShell](/tr/gateway/openshell) — yönetilen sandbox arka ucu kurulumu, çalışma alanı modları ve yapılandırma başvurusu
- [Sandbox yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox ve Araç İlkesi ve Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) — "bu neden engellendi?" hata ayıklaması
- [Güvenlik](/tr/gateway/security)
