---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClaw korumalı alanının nasıl çalıştığı: modlar, kapsamlar, çalışma alanı erişimi ve görüntüler'
title: Korumalı alana alma
x-i18n:
    generated_at: "2026-05-02T08:55:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f313333ec676aaef636b42d4a6f28f35bf213d9e1c5292ffb4868f312cf0eda
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw, etki alanını azaltmak için **araçları korumalı alan arka uçları içinde** çalıştırabilir. Bu **isteğe bağlıdır** ve yapılandırma (`agents.defaults.sandbox` veya `agents.list[].sandbox`) tarafından kontrol edilir. Korumalı alan kapalıysa araçlar ana makinede çalışır. Gateway ana makinede kalır; araç yürütmesi etkinleştirildiğinde yalıtılmış bir korumalı alanda çalışır.

<Note>
Bu mükemmel bir güvenlik sınırı değildir, ancak model yanlış bir şey yaptığında dosya sistemi ve süreç erişimini önemli ölçüde sınırlar.
</Note>

## Korumalı alana alınanlar

- Araç yürütmesi (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` vb.).
- İsteğe bağlı korumalı alan tarayıcısı (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Korumalı alan tarayıcısı ayrıntıları">
    - Varsayılan olarak, korumalı alan tarayıcısı, tarayıcı aracı buna ihtiyaç duyduğunda otomatik başlar (CDP’ye erişilebilir olmasını sağlar). `agents.defaults.sandbox.browser.autoStart` ve `agents.defaults.sandbox.browser.autoStartTimeoutMs` üzerinden yapılandırın.
    - Varsayılan olarak, korumalı alan tarayıcısı konteynerleri genel `bridge` ağı yerine ayrılmış bir Docker ağı (`openclaw-sandbox-browser`) kullanır. `agents.defaults.sandbox.browser.network` ile yapılandırın.
    - İsteğe bağlı `agents.defaults.sandbox.browser.cdpSourceRange`, konteyner kenarındaki CDP girişini bir CIDR izin listesiyle sınırlar (örneğin `172.21.0.1/32`).
    - noVNC gözlemci erişimi varsayılan olarak parola korumalıdır; OpenClaw, yerel bir başlangıç sayfası sunan ve noVNC’yi parolayla URL parçasında açan kısa ömürlü bir token URL’si üretir (sorgu/başlık günlüklerinde değil).
    - `agents.defaults.sandbox.browser.allowHostControl`, korumalı alan oturumlarının ana makine tarayıcısını açıkça hedeflemesine izin verir.
    - İsteğe bağlı izin listeleri `target: "custom"` seçeneğini kapılar: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Korumalı alana alınmayanlar:

- Gateway sürecinin kendisi.
- Korumalı alan dışında çalışmasına açıkça izin verilen herhangi bir araç (ör. `tools.elevated`).
  - **Yükseltilmiş exec, korumalı alanı atlar ve yapılandırılmış kaçış yolunu kullanır (varsayılan olarak `gateway`, exec hedefi `node` olduğunda ise `node`).**
  - Korumalı alan kapalıysa `tools.elevated` yürütmeyi değiştirmez (zaten ana makinededir). Bkz. [Yükseltilmiş Mod](/tr/tools/elevated).

## Modlar

`agents.defaults.sandbox.mode`, korumalı alanın **ne zaman** kullanılacağını kontrol eder:

<Tabs>
  <Tab title="off">
    Korumalı alan yok.
  </Tab>
  <Tab title="non-main">
    Yalnızca **ana olmayan** oturumları korumalı alana alır (normal sohbetleri ana makinede istiyorsanız varsayılan).

    `"non-main"`, aracı kimliğine değil `session.mainKey` değerine (varsayılan `"main"`) dayanır. Grup/kanal oturumları kendi anahtarlarını kullanır, bu yüzden ana olmayan sayılırlar ve korumalı alana alınırlar.

  </Tab>
  <Tab title="all">
    Her oturum bir korumalı alanda çalışır.
  </Tab>
</Tabs>

## Kapsam

`agents.defaults.sandbox.scope`, **kaç konteyner** oluşturulacağını kontrol eder:

- `"agent"` (varsayılan): aracı başına bir konteyner.
- `"session"`: oturum başına bir konteyner.
- `"shared"`: tüm korumalı alan oturumları tarafından paylaşılan bir konteyner.

## Arka uç

`agents.defaults.sandbox.backend`, korumalı alanı **hangi çalışma zamanının** sağlayacağını kontrol eder:

- `"docker"` (korumalı alan etkin olduğunda varsayılan): yerel Docker destekli korumalı alan çalışma zamanı.
- `"ssh"`: genel SSH destekli uzak korumalı alan çalışma zamanı.
- `"openshell"`: OpenShell destekli korumalı alan çalışma zamanı.

SSH’ye özgü yapılandırma `agents.defaults.sandbox.ssh` altında bulunur. OpenShell’e özgü yapılandırma `plugins.entries.openshell.config` altında bulunur.

### Arka uç seçme

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Çalıştığı yer**   | Yerel konteyner                  | SSH ile erişilebilen herhangi bir ana makine | OpenShell tarafından yönetilen korumalı alan         |
| **Kurulum**         | `scripts/sandbox-setup.sh`       | SSH anahtarı + hedef ana makine | OpenShell Plugin etkin                            |
| **Çalışma alanı modeli** | Bağlama montajı veya kopyalama | Uzak-kanonik (bir kez tohumla) | `mirror` veya `remote`                              |
| **Ağ denetimi**     | `docker.network` (varsayılan: yok) | Uzak ana makineye bağlı        | OpenShell’e bağlı                                  |
| **Tarayıcı korumalı alanı** | Desteklenir              | Desteklenmez                  | Henüz desteklenmez                                  |
| **Bağlama montajları** | `docker.binds`                | N/A                            | N/A                                                 |
| **En uygun olduğu durum** | Yerel geliştirme, tam yalıtım | Uzak bir makineye yük aktarma | İsteğe bağlı çift yönlü eşitlemeye sahip yönetilen uzak korumalı alanlar |

### Docker arka ucu

Korumalı alan varsayılan olarak kapalıdır. Korumalı alanı etkinleştirir ve bir arka uç seçmezseniz OpenClaw Docker arka ucunu kullanır. Araçları ve korumalı alan tarayıcılarını Docker daemon soketi (`/var/run/docker.sock`) üzerinden yerel olarak yürütür. Korumalı alan konteyner yalıtımı Docker namespace’leri tarafından belirlenir.

Ana makine GPU’larını Docker korumalı alanlarına açmak için `agents.defaults.sandbox.docker.gpus` veya aracı başına `agents.list[].sandbox.docker.gpus` geçersiz kılmasını ayarlayın. Değer, Docker’ın `--gpus` bayrağına ayrı bir argüman olarak iletilir; örneğin `"all"` veya `"device=GPU-uuid"` ve NVIDIA Container Toolkit gibi uyumlu bir ana makine çalışma zamanı gerektirir.

<Warning>
**Docker-dışından-Docker (DooD) kısıtları**

OpenClaw Gateway’in kendisini bir Docker konteyneri olarak dağıtırsanız, ana makinenin Docker soketini (DooD) kullanarak kardeş korumalı alan konteynerlerini yönetir. Bu belirli bir yol eşleme kısıtı getirir:

- **Yapılandırma ana makine yolları gerektirir**: `openclaw.json` `workspace` yapılandırması, dahili Gateway konteyner yolunu değil **ana makinenin mutlak yolunu** (ör. `/home/user/.openclaw/workspaces`) İÇERMELİDİR. OpenClaw, Docker daemon’dan bir korumalı alan başlatmasını istediğinde daemon yolları Gateway namespace’ine göre değil, ana makine işletim sistemi namespace’ine göre değerlendirir.
- **FS köprüsü eşliği (özdeş volume eşlemesi)**: OpenClaw Gateway yerel süreci de `workspace` dizinine Heartbeat ve köprü dosyaları yazar. Gateway kendi konteynerleştirilmiş ortamının içinden aynı dizeyi (ana makine yolunu) değerlendirdiği için, Gateway dağıtımı ana makine namespace’ini yerel olarak bağlayan özdeş bir volume eşlemesi İÇERMELİDİR (`-v /home/user/.openclaw:/home/user/.openclaw`).

Yolları mutlak ana makine eşliği olmadan dahili olarak eşlerseniz, OpenClaw konteyner ortamı içinde Heartbeat yazmaya çalışırken yerel olarak `EACCES` izin hatası fırlatır, çünkü tam nitelikli yol dizesi yerel olarak mevcut değildir.
</Warning>

### SSH arka ucu

OpenClaw’ın `exec`, dosya araçları ve medya okumalarını SSH ile erişilebilen herhangi bir makinede korumalı alana almasını istediğinizde `backend: "ssh"` kullanın.

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
          // Or use SecretRefs / inline contents instead of local files:
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
    - Oluşturma veya yeniden oluşturma sonrasındaki ilk kullanımda OpenClaw, bu uzak çalışma alanını yerel çalışma alanından bir kez tohumlar.
    - Bundan sonra `exec`, `read`, `write`, `edit`, `apply_patch`, istem medya okumaları ve gelen medya hazırlama doğrudan SSH üzerinden uzak çalışma alanına karşı çalışır.
    - OpenClaw, uzak değişiklikleri otomatik olarak yerel çalışma alanına geri eşitlemez.

  </Accordion>
  <Accordion title="Kimlik doğrulama materyali">
    - `identityFile`, `certificateFile`, `knownHostsFile`: mevcut yerel dosyaları kullanır ve bunları OpenSSH yapılandırması üzerinden geçirir.
    - `identityData`, `certificateData`, `knownHostsData`: satır içi dizeler veya SecretRefs kullanır. OpenClaw bunları normal gizli bilgiler çalışma zamanı anlık görüntüsü üzerinden çözer, `0600` ile geçici dosyalara yazar ve SSH oturumu sona erdiğinde siler.
    - Aynı öğe için hem `*File` hem de `*Data` ayarlanmışsa, o SSH oturumu için `*Data` kazanır.

  </Accordion>
  <Accordion title="Uzak-kanonik sonuçlar">
    Bu bir **uzak-kanonik** modeldir. İlk tohumlamadan sonra uzak SSH çalışma alanı gerçek korumalı alan durumu haline gelir.

    - Tohumlama adımından sonra OpenClaw dışında yapılan ana makine yerel düzenlemeleri, korumalı alanı yeniden oluşturana kadar uzakta görünmez.
    - `openclaw sandbox recreate`, kapsam başına uzak kökü siler ve sonraki kullanımda yerelden yeniden tohumlar.
    - Tarayıcı korumalı alanı SSH arka ucunda desteklenmez.
    - `sandbox.docker.*` ayarları SSH arka ucu için geçerli değildir.

  </Accordion>
</AccordionGroup>

### OpenShell arka ucu

OpenClaw’ın araçları OpenShell tarafından yönetilen uzak bir ortamda korumalı alana almasını istediğinizde `backend: "openshell"` kullanın. Tam kurulum kılavuzu, yapılandırma başvurusu ve çalışma alanı modu karşılaştırması için özel [OpenShell sayfasına](/tr/gateway/openshell) bakın.

OpenShell, genel SSH arka ucuyla aynı çekirdek SSH aktarımını ve uzak dosya sistemi köprüsünü yeniden kullanır; buna OpenShell’e özgü yaşam döngüsü (`sandbox create/get/delete`, `sandbox ssh-config`) ve isteğe bağlı `mirror` çalışma alanı modunu ekler.

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

- `mirror` (varsayılan): yerel çalışma alanı kanonik kalır. OpenClaw, exec öncesinde yerel dosyaları OpenShell’e eşitler ve exec sonrasında uzak çalışma alanını geri eşitler.
- `remote`: korumalı alan oluşturulduktan sonra OpenShell çalışma alanı kanoniktir. OpenClaw, uzak çalışma alanını yerel çalışma alanından bir kez tohumlar; ardından dosya araçları ve exec, değişiklikleri geri eşitlemeden doğrudan uzak korumalı alana karşı çalışır.

<AccordionGroup>
  <Accordion title="Uzak aktarım ayrıntıları">
    - OpenClaw, `openshell sandbox ssh-config <name>` üzerinden OpenShell’den korumalı alana özgü SSH yapılandırması ister.
    - Çekirdek, bu SSH yapılandırmasını geçici bir dosyaya yazar, SSH oturumunu açar ve `backend: "ssh"` tarafından kullanılan aynı uzak dosya sistemi köprüsünü yeniden kullanır.
    - `mirror` modunda yalnızca yaşam döngüsü farklıdır: exec öncesinde yerelden uzağa eşitle, ardından exec sonrasında geri eşitle.

  </Accordion>
  <Accordion title="Geçerli OpenShell sınırlamaları">
    - korumalı alan tarayıcısı henüz desteklenmiyor
    - `sandbox.docker.binds`, OpenShell arka ucunda desteklenmiyor
    - `sandbox.docker.*` altındaki Docker’a özgü çalışma zamanı ayarları hâlâ yalnızca Docker arka ucu için geçerlidir

  </Accordion>
</AccordionGroup>

#### Çalışma alanı modları

OpenShell’in iki çalışma alanı modeli vardır. Pratikte en önemli kısım budur.

<Tabs>
  <Tab title="mirror (yerel kanonik)">
    **yerel çalışma alanının kanonik kalmasını** istediğinizde `plugins.entries.openshell.config.mode: "mirror"` kullanın.

    Davranış:

    - `exec` öncesinde OpenClaw, yerel çalışma alanını OpenShell korumalı alanına eşitler.
    - `exec` sonrasında OpenClaw, uzak çalışma alanını yerel çalışma alanına geri eşitler.
    - Dosya araçları yine de korumalı alan köprüsü üzerinden çalışır, ancak yerel çalışma alanı turlar arasında doğruluk kaynağı olarak kalır.

    Bunu şu durumlarda kullanın:

    - dosyaları OpenClaw dışında yerel olarak düzenliyorsunuz ve bu değişikliklerin sandbox içinde otomatik görünmesini istiyorsunuz
    - OpenShell sandbox ortamının mümkün olduğunca Docker backend gibi davranmasını istiyorsunuz
    - her exec turundan sonra ana makine çalışma alanının sandbox yazmalarını yansıtmasını istiyorsunuz

    Ödün: exec öncesi ve sonrası ek eşitleme maliyeti.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    **OpenShell çalışma alanının kanonik kaynak olmasını** istediğinizde `plugins.entries.openshell.config.mode: "remote"` kullanın.

    Davranış:

    - Sandbox ilk oluşturulduğunda, OpenClaw uzak çalışma alanını yerel çalışma alanından bir kez başlatır.
    - Bundan sonra `exec`, `read`, `write`, `edit` ve `apply_patch` doğrudan uzak OpenShell çalışma alanı üzerinde çalışır.
    - OpenClaw, exec sonrasında uzak değişiklikleri yerel çalışma alanına geri eşitlemez.
    - İstem zamanındaki medya okumaları yine çalışır; çünkü dosya ve medya araçları yerel bir ana makine yolunu varsaymak yerine sandbox köprüsü üzerinden okur.
    - Aktarım, `openshell sandbox ssh-config` tarafından döndürülen OpenShell sandbox ortamına SSH ile yapılır.

    Önemli sonuçlar:

    - Başlatma adımından sonra ana makinede OpenClaw dışında dosya düzenlerseniz, uzak sandbox bu değişiklikleri otomatik olarak **görmez**.
    - Sandbox yeniden oluşturulursa, uzak çalışma alanı yerel çalışma alanından yeniden başlatılır.
    - `scope: "agent"` veya `scope: "shared"` ile bu uzak çalışma alanı aynı kapsamda paylaşılır.

    Bunu şu durumlarda kullanın:

    - sandbox öncelikle uzak OpenShell tarafında yaşamalıysa
    - tur başına eşitleme ek yükünü azaltmak istiyorsanız
    - ana makinedeki yerel düzenlemelerin uzak sandbox durumunu sessizce üzerine yazmasını istemiyorsanız

  </Tab>
</Tabs>

Sandbox ortamını geçici bir yürütme ortamı olarak düşünüyorsanız `mirror` seçin. Sandbox ortamını gerçek çalışma alanı olarak düşünüyorsanız `remote` seçin.

#### OpenShell yaşam döngüsü

OpenShell sandbox ortamları yine normal sandbox yaşam döngüsü üzerinden yönetilir:

- `openclaw sandbox list`, Docker çalışma zamanlarının yanı sıra OpenShell çalışma zamanlarını da gösterir
- `openclaw sandbox recreate`, geçerli çalışma zamanını siler ve OpenClaw'ın bir sonraki kullanımda yeniden oluşturmasına izin verir
- temizleme mantığı da backend farkındadır

`remote` modu için yeniden oluşturma özellikle önemlidir:

- yeniden oluşturma, o kapsam için kanonik uzak çalışma alanını siler
- bir sonraki kullanım, yerel çalışma alanından yeni bir uzak çalışma alanı başlatır

`mirror` modu için yeniden oluşturma, yerel çalışma alanı zaten kanonik kaldığından çoğunlukla uzak yürütme ortamını sıfırlar.

## Çalışma alanı erişimi

`agents.defaults.sandbox.workspaceAccess`, **sandbox ortamının ne görebileceğini** denetler:

<Tabs>
  <Tab title="none (default)">
    Araçlar `~/.openclaw/sandboxes` altında bir sandbox çalışma alanı görür.
  </Tab>
  <Tab title="ro">
    Ajan çalışma alanını `/agent` konumuna salt okunur olarak bağlar (`write`/`edit`/`apply_patch` devre dışı kalır).
  </Tab>
  <Tab title="rw">
    Ajan çalışma alanını `/workspace` konumuna okuma/yazma olarak bağlar.
  </Tab>
</Tabs>

OpenShell backend ile:

- `mirror` modu, exec turları arasında yerel çalışma alanını kanonik kaynak olarak kullanmaya devam eder
- `remote` modu, ilk başlatmadan sonra uzak OpenShell çalışma alanını kanonik kaynak olarak kullanır
- `workspaceAccess: "ro"` ve `"none"` yazma davranışını aynı şekilde kısıtlamaya devam eder

Gelen medya etkin sandbox çalışma alanına kopyalanır (`media/inbound/*`).

<Note>
**Skills notu:** `read` aracı sandbox köklüdür. `workspaceAccess: "none"` ile OpenClaw, okunabilmeleri için uygun Skills öğelerini sandbox çalışma alanına (`.../skills`) yansıtır. `"rw"` ile çalışma alanı Skills öğeleri `/workspace/skills` konumundan okunabilir.
</Note>

## Özel bind bağlamaları

`agents.defaults.sandbox.docker.binds`, ek ana makine dizinlerini container içine bağlar. Biçim: `host:container:mode` (ör. `"/home/user/source:/source:rw"`).

Genel ve ajan başına bind bağlamaları **birleştirilir** (değiştirilmez). `scope: "shared"` altında, ajan başına bind bağlamaları yok sayılır.

`agents.defaults.sandbox.browser.binds`, ek ana makine dizinlerini yalnızca **sandbox tarayıcısı** container'ına bağlar.

- Ayarlandığında (`[]` dahil), tarayıcı container'ı için `agents.defaults.sandbox.docker.binds` değerinin yerine geçer.
- Atlandığında, tarayıcı container'ı `agents.defaults.sandbox.docker.binds` değerine geri döner (geriye dönük uyumlu).

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

- Bind bağlamaları sandbox dosya sistemini atlar: ayarladığınız mod neyse (`:ro` veya `:rw`) ana makine yollarını o modla açığa çıkarır.
- OpenClaw tehlikeli bind kaynaklarını engeller (örneğin: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` ve bunları açığa çıkaracak üst bağlamalar).
- OpenClaw ayrıca `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` ve `~/.ssh` gibi yaygın ev dizini kimlik bilgisi köklerini de engeller.
- Bind doğrulaması yalnızca dize eşleştirme değildir. OpenClaw kaynak yolunu normalleştirir, ardından engellenen yolları ve izin verilen kökleri yeniden denetlemeden önce en derindeki mevcut üst dizin üzerinden tekrar çözümler.
- Bu, son yaprak henüz mevcut olmasa bile sembolik bağlantılı üst dizin kaçışlarının güvenli şekilde başarısız olacağı anlamına gelir. Örnek: `run-link` orayı işaret ediyorsa `/workspace/run-link/new-file` yine `/var/run/...` olarak çözümlenir.
- İzin verilen kaynak kökleri de aynı şekilde kanonikleştirilir; bu nedenle sembolik bağlantı çözümlemesinden önce yalnızca izin listesi içinde görünüyor olan bir yol yine `outside allowed roots` olarak reddedilir.
- Hassas bağlamalar (gizli bilgiler, SSH anahtarları, servis kimlik bilgileri) kesinlikle gerekmedikçe `:ro` olmalıdır.
- Çalışma alanına yalnızca okuma erişimi gerekiyorsa `workspaceAccess: "ro"` ile birleştirin; bind modları bağımsız kalır.
- Bind bağlamalarının araç ilkesi ve yükseltilmiş exec ile nasıl etkileştiği için [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) bölümüne bakın.

</Warning>

## İmajlar ve kurulum

Varsayılan Docker imajı: `openclaw-sandbox:bookworm-slim`

<Note>
**Kaynak checkout ve npm kurulumu**

`scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` ve `scripts/sandbox-browser-setup.sh` yardımcı betikleri yalnızca bir [source checkout](https://github.com/openclaw/openclaw) üzerinden çalıştırırken kullanılabilir. npm paketine dahil değildir.

OpenClaw'ı `npm install -g openclaw` ile kurduysanız, bunun yerine aşağıda gösterilen satır içi `docker build` komutlarını kullanın.
</Note>

<Steps>
  <Step title="Build the default image">
    Bir source checkout üzerinden:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Bir npm kurulumundan (source checkout gerekmez):

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    Varsayılan imaj Node içermez. Bir skill Node'a (veya başka çalışma zamanlarına) ihtiyaç duyuyorsa ya özel bir imaj oluşturun ya da `sandbox.docker.setupCommand` üzerinden kurun (ağ çıkışı + yazılabilir root + root kullanıcısı gerektirir).

    `openclaw-sandbox:bookworm-slim` eksik olduğunda OpenClaw sessizce düz `debian:bookworm-slim` ile değiştirmez. Varsayılan imajı hedefleyen sandbox çalıştırmaları, imajı oluşturana kadar bir derleme talimatıyla hızlıca başarısız olur; çünkü paketlenen imaj sandbox yazma/düzenleme yardımcıları için `python3` taşır.

  </Step>
  <Step title="Optional: build the common image">
    Yaygın araçlara sahip daha işlevsel bir sandbox imajı için (örneğin `curl`, `jq`, `nodejs`, `python3`, `git`):

    Bir source checkout üzerinden:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Bir npm kurulumundan, önce varsayılan imajı oluşturun (yukarıya bakın), ardından depodaki [`Dockerfile.sandbox-common`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-common) dosyasını kullanarak common imajını bunun üzerine oluşturun.

    Ardından `agents.defaults.sandbox.docker.image` değerini `openclaw-sandbox-common:bookworm-slim` olarak ayarlayın.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    Bir source checkout üzerinden:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Bir npm kurulumundan, depodaki [`Dockerfile.sandbox-browser`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-browser) dosyasını kullanarak oluşturun.

  </Step>
</Steps>

Varsayılan olarak Docker sandbox container'ları **ağ olmadan** çalışır. `agents.defaults.sandbox.docker.network` ile geçersiz kılın.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    Paketlenen sandbox tarayıcı imajı, container içinde çalışan iş yükleri için temkinli Chromium başlangıç varsayılanları da uygular. Geçerli container varsayılanları şunları içerir:

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
    - `noSandbox` etkinleştirildiğinde `--no-sandbox`.
    - Üç grafik güçlendirme bayrağı (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) isteğe bağlıdır ve container'larda GPU desteği olmadığında yararlıdır. İş yükünüz WebGL veya başka 3D/tarayıcı özellikleri gerektiriyorsa `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` ayarlayın.
    - `--disable-extensions` varsayılan olarak etkindir ve uzantıya bağımlı akışlar için `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ile devre dışı bırakılabilir.
    - `--renderer-process-limit=2`, `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` tarafından denetlenir; burada `0`, Chromium'un varsayılanını korur.

    Farklı bir çalışma zamanı profiline ihtiyacınız varsa, özel bir tarayıcı imajı kullanın ve kendi entrypoint'inizi sağlayın. Yerel (container dışı) Chromium profilleri için ek başlangıç bayrakları eklemek üzere `browser.extraArgs` kullanın.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` engellenir.
    - `network: "container:<id>"` varsayılan olarak engellenir (namespace join atlama riski).
    - Acil durum geçersiz kılma: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker kurulumları ve container içinde çalışan Gateway burada bulunur: [Docker](/tr/install/docker)

Docker Gateway dağıtımları için `scripts/docker/setup.sh`, sandbox yapılandırmasını başlatabilir. Bu yolu etkinleştirmek için `OPENCLAW_SANDBOX=1` (veya `true`/`yes`/`on`) ayarlayın. Socket konumunu `OPENCLAW_DOCKER_SOCKET` ile geçersiz kılabilirsiniz. Tam kurulum ve ortam referansı: [Docker](/tr/install/docker#agent-sandbox).

## setupCommand (tek seferlik container kurulumu)

`setupCommand`, sandbox container'ı oluşturulduktan sonra **bir kez** çalışır (her çalıştırmada değil). Container içinde `sh -lc` üzerinden yürütülür.

Yollar:

- Genel: `agents.defaults.sandbox.docker.setupCommand`
- Ajan başına: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - Varsayılan `docker.network` `"none"` değeridir (çıkış yoktur), bu nedenle paket kurulumları başarısız olur.
    - `docker.network: "container:<id>"`, `dangerouslyAllowContainerNamespaceJoin: true` gerektirir ve yalnızca acil durum içindir.
    - `readOnlyRoot: true` yazmaları engeller; `readOnlyRoot: false` ayarlayın veya özel bir imaj oluşturun.
    - Paket kurulumları için `user` root olmalıdır (`user` değerini atlayın veya `user: "0:0"` olarak ayarlayın).
    - Sandbox exec, ana makine `process.env` değerini devralmaz. Skill API anahtarları için `agents.defaults.sandbox.docker.env` (veya özel bir imaj) kullanın.

  </Accordion>
</AccordionGroup>

## Araç politikası ve kaçış yolları

Araç izin verme/reddetme politikaları, sandbox kurallarından önce hâlâ uygulanır. Bir araç genel olarak veya aracı başına reddedildiyse, sandbox onu geri getirmez.

`tools.elevated`, `exec` komutunu sandbox dışında çalıştıran açık bir kaçış yoludur (varsayılan olarak `gateway`, exec hedefi `node` olduğunda ise `node`). `/exec` yönergeleri yalnızca yetkili gönderenler için geçerlidir ve oturum başına kalıcıdır; `exec` komutunu tamamen devre dışı bırakmak için araç politikası reddini kullanın (bkz. [Sandbox ile Araç Politikası ve Elevated karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Hata ayıklama:

- Etkili sandbox modunu, araç politikasını ve düzeltme yapılandırma anahtarlarını incelemek için `openclaw sandbox explain` kullanın.
- "Bu neden engellendi?" zihinsel modeli için [Sandbox ile Araç Politikası ve Elevated karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) bölümüne bakın.

Sıkı şekilde kilitli tutun.

## Çoklu aracı geçersiz kılmaları

Her aracı sandbox + araçları geçersiz kılabilir: `agents.list[].sandbox` ve `agents.list[].tools` (ayrıca sandbox araç politikası için `agents.list[].tools.sandbox.tools`). Öncelik sırası için [Çoklu Aracı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

## Minimal etkinleştirme örneği

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

- [Çoklu Aracı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) — aracı başına geçersiz kılmalar ve öncelik sırası
- [OpenShell](/tr/gateway/openshell) — yönetilen sandbox arka uç kurulumu, çalışma alanı modları ve yapılandırma referansı
- [Sandbox yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox ile Araç Politikası ve Elevated karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) — "Bu neden engellendi?" hata ayıklaması
- [Güvenlik](/tr/gateway/security)
