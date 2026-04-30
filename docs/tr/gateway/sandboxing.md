---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClaw korumalı alanı nasıl çalışır: modlar, kapsamlar, çalışma alanı erişimi ve görüntüler'
title: Korumalı Alana Alma
x-i18n:
    generated_at: "2026-04-30T09:24:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw, etki alanını azaltmak için **araçları korumalı alan arka uçları içinde** çalıştırabilir. Bu **isteğe bağlıdır** ve yapılandırma (`agents.defaults.sandbox` veya `agents.list[].sandbox`) ile denetlenir. Korumalı alan kapalıysa araçlar ana makinede çalışır. Gateway ana makinede kalır; araç yürütme etkinleştirildiğinde yalıtılmış bir korumalı alanda çalışır.

<Note>
Bu kusursuz bir güvenlik sınırı değildir, ancak model mantıksız bir şey yaptığında dosya sistemi ve süreç erişimini önemli ölçüde sınırlar.
</Note>

## Korumalı alana alınanlar

- Araç yürütme (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` vb.).
- İsteğe bağlı korumalı alan tarayıcısı (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Korumalı alan tarayıcısı ayrıntıları">
    - Varsayılan olarak, tarayıcı aracı gerektiğinde korumalı alan tarayıcısı otomatik başlar (CDP'nin erişilebilir olmasını sağlar). `agents.defaults.sandbox.browser.autoStart` ve `agents.defaults.sandbox.browser.autoStartTimeoutMs` ile yapılandırın.
    - Varsayılan olarak, korumalı alan tarayıcı konteynerleri genel `bridge` ağı yerine ayrılmış bir Docker ağı (`openclaw-sandbox-browser`) kullanır. `agents.defaults.sandbox.browser.network` ile yapılandırın.
    - İsteğe bağlı `agents.defaults.sandbox.browser.cdpSourceRange`, konteyner kenarındaki CDP girişini bir CIDR izin listesiyle sınırlar (örneğin `172.21.0.1/32`).
    - noVNC gözlemci erişimi varsayılan olarak parola korumalıdır; OpenClaw, yerel bir önyükleme sayfası sunan ve noVNC'yi URL parçasında parola ile açan kısa ömürlü bir belirteç URL'si üretir (sorgu/başlık günlüklerinde değil).
    - `agents.defaults.sandbox.browser.allowHostControl`, korumalı alan oturumlarının ana makine tarayıcısını açıkça hedeflemesine izin verir.
    - İsteğe bağlı izin listeleri `target: "custom"` için kapı görevi görür: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Korumalı alana alınmayanlar:

- Gateway sürecinin kendisi.
- Korumalı alan dışında çalışmasına açıkça izin verilen herhangi bir araç (ör. `tools.elevated`).
  - **Yükseltilmiş exec, korumalı alanı atlar ve yapılandırılmış çıkış yolunu kullanır (varsayılan olarak `gateway`, exec hedefi `node` olduğunda ise `node`).**
  - Korumalı alan kapalıysa `tools.elevated` yürütmeyi değiştirmez (zaten ana makinededir). Bkz. [Yükseltilmiş Mod](/tr/tools/elevated).

## Modlar

`agents.defaults.sandbox.mode`, korumalı alanın **ne zaman** kullanılacağını denetler:

<Tabs>
  <Tab title="off">
    Korumalı alan yok.
  </Tab>
  <Tab title="non-main">
    Yalnızca **ana olmayan** oturumları korumalı alana alır (normal sohbetlerin ana makinede kalmasını istiyorsanız varsayılan).

    `"non-main"`, agent kimliğine değil `session.mainKey` değerine (varsayılan `"main"`) dayanır. Grup/kanal oturumları kendi anahtarlarını kullanır, bu yüzden ana olmayan sayılır ve korumalı alana alınır.

  </Tab>
  <Tab title="all">
    Her oturum bir korumalı alanda çalışır.
  </Tab>
</Tabs>

## Kapsam

`agents.defaults.sandbox.scope`, **kaç konteyner** oluşturulacağını denetler:

- `"agent"` (varsayılan): agent başına bir konteyner.
- `"session"`: oturum başına bir konteyner.
- `"shared"`: tüm korumalı alan oturumları tarafından paylaşılan bir konteyner.

## Arka uç

`agents.defaults.sandbox.backend`, korumalı alanı **hangi çalışma zamanının** sağlayacağını denetler:

- `"docker"` (korumalı alan etkinleştirildiğinde varsayılan): yerel Docker destekli korumalı alan çalışma zamanı.
- `"ssh"`: genel SSH destekli uzak korumalı alan çalışma zamanı.
- `"openshell"`: OpenShell destekli korumalı alan çalışma zamanı.

SSH'ye özgü yapılandırma `agents.defaults.sandbox.ssh` altında bulunur. OpenShell'e özgü yapılandırma `plugins.entries.openshell.config` altında bulunur.

### Arka uç seçme

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Nerede çalışır**  | Yerel konteyner                  | SSH ile erişilebilir herhangi bir ana makine | OpenShell tarafından yönetilen korumalı alan         |
| **Kurulum**         | `scripts/sandbox-setup.sh`       | SSH anahtarı + hedef ana makine | OpenShell Plugin etkin                            |
| **Çalışma alanı modeli** | Bağlama noktası veya kopya      | Uzak-kanonik (bir kez tohumlanır) | `mirror` veya `remote`                              |
| **Ağ denetimi**     | `docker.network` (varsayılan: yok) | Uzak ana makineye bağlı       | OpenShell'e bağlı                                  |
| **Tarayıcı korumalı alanı** | Desteklenir              | Desteklenmez                  | Henüz desteklenmez                                  |
| **Bağlama noktaları** | `docker.binds`                 | N/A                            | N/A                                                 |
| **En uygun kullanım** | Yerel geliştirme, tam yalıtım  | Uzak bir makineye yük aktarma | İsteğe bağlı iki yönlü eşitlemeli yönetilen uzak korumalı alanlar |

### Docker arka ucu

Korumalı alan varsayılan olarak kapalıdır. Korumalı alanı etkinleştirir ve bir arka uç seçmezseniz OpenClaw Docker arka ucunu kullanır. Araçları ve korumalı alan tarayıcılarını Docker daemon soketi (`/var/run/docker.sock`) üzerinden yerel olarak yürütür. Korumalı alan konteyner yalıtımı Docker ad alanları tarafından belirlenir.

Ana makine GPU'larını Docker korumalı alanlarına açmak için `agents.defaults.sandbox.docker.gpus` değerini veya agent başına `agents.list[].sandbox.docker.gpus` geçersiz kılmasını ayarlayın. Değer, Docker'ın `--gpus` bayrağına ayrı bir argüman olarak geçirilir; örneğin `"all"` veya `"device=GPU-uuid"` ve NVIDIA Container Toolkit gibi uyumlu bir ana makine çalışma zamanı gerektirir.

<Warning>
**Docker-out-of-Docker (DooD) kısıtları**

OpenClaw Gateway'in kendisini bir Docker konteyneri olarak dağıtırsanız, ana makinenin Docker soketini (DooD) kullanarak kardeş korumalı alan konteynerlerini yönetir. Bu, belirli bir yol eşleme kısıtı getirir:

- **Yapılandırma ana makine yollarını gerektirir**: `openclaw.json` `workspace` yapılandırması, dahili Gateway konteyner yolu değil, **ana makinenin mutlak yolunu** (ör. `/home/user/.openclaw/workspaces`) içermelidir. OpenClaw Docker daemon'dan bir korumalı alan başlatmasını istediğinde daemon yolları Gateway ad alanına göre değil, ana makine işletim sistemi ad alanına göre değerlendirir.
- **FS köprüsü eşliği (aynı volume haritası)**: OpenClaw Gateway yerel süreci ayrıca `workspace` dizinine Heartbeat ve köprü dosyaları yazar. Gateway kendi konteynerleştirilmiş ortamının içinden tam olarak aynı dizeyi (ana makine yolunu) değerlendirdiği için Gateway dağıtımı, ana makine ad alanını yerel olarak bağlayan aynı volume haritasını içermelidir (`-v /home/user/.openclaw:/home/user/.openclaw`).

Yolları mutlak ana makine eşliği olmadan dahili olarak eşlerseniz OpenClaw, tam nitelikli yol dizesi yerel olarak mevcut olmadığı için konteyner ortamında Heartbeat dosyasını yazmaya çalışırken yerel olarak bir `EACCES` izin hatası fırlatır.
</Warning>

### SSH arka ucu

OpenClaw'ın `exec`, dosya araçlarını ve medya okumalarını SSH ile erişilebilir rastgele bir makinede korumalı alana almasını istediğinizde `backend: "ssh"` kullanın.

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
    - Oluşturma veya yeniden oluşturma sonrasında ilk kullanımda OpenClaw, bu uzak çalışma alanını yerel çalışma alanından bir kez tohumlar.
    - Bundan sonra `exec`, `read`, `write`, `edit`, `apply_patch`, istem medya okumaları ve gelen medya hazırlama doğrudan SSH üzerinden uzak çalışma alanına karşı çalışır.
    - OpenClaw, uzak değişiklikleri yerel çalışma alanına otomatik olarak geri eşitlemez.

  </Accordion>
  <Accordion title="Kimlik doğrulama materyali">
    - `identityFile`, `certificateFile`, `knownHostsFile`: mevcut yerel dosyaları kullanır ve OpenSSH yapılandırması üzerinden geçirir.
    - `identityData`, `certificateData`, `knownHostsData`: satır içi dizeleri veya SecretRefs kullanır. OpenClaw bunları normal gizli bilgiler çalışma zamanı snapshot'ı üzerinden çözer, `0600` ile geçici dosyalara yazar ve SSH oturumu sona erdiğinde siler.
    - Aynı öğe için hem `*File` hem de `*Data` ayarlanmışsa, o SSH oturumu için `*Data` kazanır.

  </Accordion>
  <Accordion title="Uzak-kanonik sonuçlar">
    Bu bir **uzak-kanonik** modeldir. Uzak SSH çalışma alanı, ilk tohumlamadan sonra gerçek korumalı alan durumu olur.

    - Tohumlama adımından sonra OpenClaw dışında yapılan ana makine-yerel düzenlemeler, korumalı alanı yeniden oluşturana kadar uzakta görünmez.
    - `openclaw sandbox recreate`, kapsam başına uzak kökü siler ve sonraki kullanımda yerelden yeniden tohumlar.
    - SSH arka ucunda tarayıcı korumalı alanı desteklenmez.
    - `sandbox.docker.*` ayarları SSH arka ucuna uygulanmaz.

  </Accordion>
</AccordionGroup>

### OpenShell arka ucu

OpenClaw'ın araçları OpenShell tarafından yönetilen uzak bir ortamda korumalı alana almasını istediğinizde `backend: "openshell"` kullanın. Tam kurulum kılavuzu, yapılandırma başvurusu ve çalışma alanı modu karşılaştırması için ayrılmış [OpenShell sayfasına](/tr/gateway/openshell) bakın.

OpenShell, genel SSH arka ucuyla aynı çekirdek SSH aktarımını ve uzak dosya sistemi köprüsünü yeniden kullanır ve OpenShell'e özgü yaşam döngüsünü (`sandbox create/get/delete`, `sandbox ssh-config`) ve isteğe bağlı `mirror` çalışma alanı modunu ekler.

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

- `mirror` (varsayılan): yerel çalışma alanı kanonik kalır. OpenClaw, exec öncesinde yerel dosyaları OpenShell içine eşitler ve exec sonrasında uzak çalışma alanını geri eşitler.
- `remote`: korumalı alan oluşturulduktan sonra OpenShell çalışma alanı kanoniktir. OpenClaw, uzak çalışma alanını yerel çalışma alanından bir kez tohumlar; ardından dosya araçları ve exec, değişiklikleri geri eşitlemeden doğrudan uzak korumalı alana karşı çalışır.

<AccordionGroup>
  <Accordion title="Uzak aktarım ayrıntıları">
    - OpenClaw, `openshell sandbox ssh-config <name>` üzerinden OpenShell'den korumalı alana özgü SSH yapılandırması ister.
    - Core, bu SSH yapılandırmasını geçici bir dosyaya yazar, SSH oturumunu açar ve `backend: "ssh"` tarafından kullanılan aynı uzak dosya sistemi köprüsünü yeniden kullanır.
    - `mirror` modunda yalnızca yaşam döngüsü farklıdır: exec öncesinde yerelden uzağa eşitle, ardından exec sonrasında geri eşitle.

  </Accordion>
  <Accordion title="Mevcut OpenShell sınırlamaları">
    - korumalı alan tarayıcısı henüz desteklenmez
    - `sandbox.docker.binds`, OpenShell arka ucunda desteklenmez
    - `sandbox.docker.*` altındaki Docker'a özgü çalışma zamanı ayarları hâlâ yalnızca Docker arka ucuna uygulanır

  </Accordion>
</AccordionGroup>

#### Çalışma alanı modları

OpenShell'in iki çalışma alanı modeli vardır. Pratikte en önemli bölüm budur.

<Tabs>
  <Tab title="mirror (yerel kanonik)">
    **Yerel çalışma alanının kanonik kalmasını** istediğinizde `plugins.entries.openshell.config.mode: "mirror"` kullanın.

    Davranış:

    - `exec` öncesinde OpenClaw, yerel çalışma alanını OpenShell korumalı alanına eşitler.
    - `exec` sonrasında OpenClaw, uzak çalışma alanını yerel çalışma alanına geri eşitler.
    - Dosya araçları hâlâ korumalı alan köprüsü üzerinden çalışır, ancak yerel çalışma alanı dönüşler arasında doğruluk kaynağı olarak kalır.

    Şu durumda kullanın:

    - dosyaları OpenClaw dışında yerel olarak düzenliyorsunuz ve bu değişikliklerin korumalı alanda otomatik olarak görünmesini istiyorsunuz
    - OpenShell korumalı alanının olabildiğince Docker arka ucu gibi davranmasını istiyorsunuz
    - ana makine çalışma alanının her exec turundan sonra korumalı alan yazmalarını yansıtmasını istiyorsunuz

    Ödün: exec öncesinde ve sonrasında ek eşitleme maliyeti.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    **OpenShell çalışma alanının kanonik olmasını** istediğinizde `plugins.entries.openshell.config.mode: "remote"` kullanın.

    Davranış:

    - Korumalı alan ilk oluşturulduğunda, OpenClaw uzak çalışma alanını yerel çalışma alanından bir kez hazırlar.
    - Bundan sonra `exec`, `read`, `write`, `edit` ve `apply_patch` doğrudan uzak OpenShell çalışma alanı üzerinde çalışır.
    - OpenClaw, exec sonrasında uzak değişiklikleri yerel çalışma alanına geri eşitlemez.
    - İstem zamanındaki medya okumaları yine çalışır, çünkü dosya ve medya araçları yerel ana makine yolunu varsaymak yerine korumalı alan köprüsü üzerinden okur.
    - Taşıma, `openshell sandbox ssh-config` tarafından döndürülen OpenShell korumalı alanına SSH ile yapılır.

    Önemli sonuçlar:

    - Hazırlama adımından sonra OpenClaw dışında ana makinede dosya düzenlerseniz, uzak korumalı alan bu değişiklikleri otomatik olarak **görmez**.
    - Korumalı alan yeniden oluşturulursa, uzak çalışma alanı yeniden yerel çalışma alanından hazırlanır.
    - `scope: "agent"` veya `scope: "shared"` ile bu uzak çalışma alanı aynı kapsamda paylaşılır.

    Bunu şu durumlarda kullanın:

    - korumalı alan esas olarak uzak OpenShell tarafında yaşamalıysa
    - tur başına daha düşük eşitleme yükü istiyorsanız
    - ana makinedeki yerel düzenlemelerin uzak korumalı alan durumunun üzerine sessizce yazmasını istemiyorsanız

  </Tab>
</Tabs>

Korumalı alanı geçici bir yürütme ortamı olarak düşünüyorsanız `mirror` seçin. Korumalı alanı gerçek çalışma alanı olarak düşünüyorsanız `remote` seçin.

#### OpenShell yaşam döngüsü

OpenShell korumalı alanları hâlâ normal korumalı alan yaşam döngüsüyle yönetilir:

- `openclaw sandbox list`, Docker çalışma zamanlarının yanı sıra OpenShell çalışma zamanlarını da gösterir
- `openclaw sandbox recreate`, geçerli çalışma zamanını siler ve OpenClaw'ın bir sonraki kullanımda onu yeniden oluşturmasına izin verir
- budama mantığı da arka uçtan haberdardır

`remote` modu için yeniden oluşturma özellikle önemlidir:

- yeniden oluşturma, o kapsamın kanonik uzak çalışma alanını siler
- sonraki kullanım, yerel çalışma alanından yeni bir uzak çalışma alanı hazırlar

`mirror` modu için yeniden oluşturma esas olarak uzak yürütme ortamını sıfırlar, çünkü yerel çalışma alanı zaten kanonik kalır.

## Çalışma alanı erişimi

`agents.defaults.sandbox.workspaceAccess`, **korumalı alanın neyi görebileceğini** denetler:

<Tabs>
  <Tab title="none (default)">
    Araçlar `~/.openclaw/sandboxes` altında bir korumalı alan çalışma alanı görür.
  </Tab>
  <Tab title="ro">
    Aracı çalışma alanını `/agent` konumuna salt okunur olarak bağlar (`write`/`edit`/`apply_patch` devre dışı bırakılır).
  </Tab>
  <Tab title="rw">
    Aracı çalışma alanını `/workspace` konumuna okuma/yazma olarak bağlar.
  </Tab>
</Tabs>

OpenShell arka ucuyla:

- `mirror` modu, exec turları arasında yerel çalışma alanını kanonik kaynak olarak kullanmaya devam eder
- `remote` modu, ilk hazırlamadan sonra uzak OpenShell çalışma alanını kanonik kaynak olarak kullanır
- `workspaceAccess: "ro"` ve `"none"` yazma davranışını aynı şekilde kısıtlamaya devam eder

Gelen medya etkin korumalı alan çalışma alanına kopyalanır (`media/inbound/*`).

<Note>
**Skills notu:** `read` aracı korumalı alan köklüdür. `workspaceAccess: "none"` ile OpenClaw, okunabilmeleri için uygun becerileri korumalı alan çalışma alanına (`.../skills`) yansıtır. `"rw"` ile çalışma alanı becerileri `/workspace/skills` konumundan okunabilir.
</Note>

## Özel bağlama noktaları

`agents.defaults.sandbox.docker.binds`, ek ana makine dizinlerini kapsayıcıya bağlar. Biçim: `host:container:mode` (ör. `"/home/user/source:/source:rw"`).

Genel ve aracı başına bağlamalar **birleştirilir** (değiştirilmez). `scope: "shared"` altında aracı başına bağlamalar yok sayılır.

`agents.defaults.sandbox.browser.binds`, ek ana makine dizinlerini yalnızca **korumalı alan tarayıcısı** kapsayıcısına bağlar.

- Ayarlandığında (`[]` dahil), tarayıcı kapsayıcısı için `agents.defaults.sandbox.docker.binds` değerinin yerini alır.
- Atlandığında, tarayıcı kapsayıcısı `agents.defaults.sandbox.docker.binds` değerine geri döner (geriye dönük uyumlu).

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

<Warning>
**Bağlama güvenliği**

- Bağlamalar korumalı alan dosya sistemini atlar: ana makine yollarını ayarladığınız modla (`:ro` veya `:rw`) açığa çıkarır.
- OpenClaw tehlikeli bağlama kaynaklarını engeller (örneğin: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` ve bunları açığa çıkaracak üst bağlamalar).
- OpenClaw ayrıca `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` ve `~/.ssh` gibi yaygın ev dizini kimlik bilgisi köklerini engeller.
- Bağlama doğrulaması yalnızca dize eşleştirme değildir. OpenClaw kaynak yolunu normalleştirir, ardından engellenen yolları ve izin verilen kökleri yeniden denetlemeden önce en derindeki mevcut ata üzerinden tekrar çözer.
- Bu, son yaprak henüz mevcut olmasa bile sembolik bağlantı üst öğesi kaçışlarının kapalı başarısız olacağı anlamına gelir. Örnek: `run-link` orayı gösteriyorsa `/workspace/run-link/new-file` yine `/var/run/...` olarak çözülür.
- İzin verilen kaynak kökleri aynı şekilde kanonikleştirilir, bu nedenle yalnızca sembolik bağlantı çözümlemesinden önce izin listesinin içinde gibi görünen bir yol yine de `outside allowed roots` olarak reddedilir.
- Hassas bağlamalar (gizli bilgiler, SSH anahtarları, servis kimlik bilgileri) kesinlikle gerekmedikçe `:ro` olmalıdır.
- Çalışma alanına yalnızca okuma erişimine ihtiyacınız varsa `workspaceAccess: "ro"` ile birleştirin; bağlama modları bağımsız kalır.
- Bağlamaların araç ilkesi ve yükseltilmiş exec ile nasıl etkileştiği için [Korumalı Alan ve Araç İlkesi ve Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) sayfasına bakın.

</Warning>

## İmajlar ve kurulum

Varsayılan Docker imajı: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Varsayılan imajı oluştur">
    ```bash
    scripts/sandbox-setup.sh
    ```

    Varsayılan imaj Node içermez. Bir beceri Node'a (veya başka çalışma zamanlarına) ihtiyaç duyuyorsa ya özel bir imaj hazırlayın ya da `sandbox.docker.setupCommand` üzerinden kurun (ağ çıkışı + yazılabilir kök + root kullanıcısı gerektirir).

    OpenClaw, `openclaw-sandbox:bookworm-slim` eksik olduğunda sessizce düz `debian:bookworm-slim` kullanmaz. Varsayılan imajı hedefleyen korumalı alan çalışmaları, siz `scripts/sandbox-setup.sh` çalıştırana kadar bir derleme talimatıyla hızlı başarısız olur, çünkü paketli imaj korumalı alan yazma/düzenleme yardımcıları için `python3` taşır.

  </Step>
  <Step title="İsteğe bağlı: ortak imajı oluştur">
    Yaygın araçlarla daha işlevsel bir korumalı alan imajı için (örneğin `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Ardından `agents.defaults.sandbox.docker.image` değerini `openclaw-sandbox-common:bookworm-slim` olarak ayarlayın.

  </Step>
  <Step title="İsteğe bağlı: korumalı alan tarayıcısı imajını oluştur">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

Varsayılan olarak Docker korumalı alan kapsayıcıları **ağsız** çalışır. `agents.defaults.sandbox.docker.network` ile geçersiz kılın.

<AccordionGroup>
  <Accordion title="Korumalı alan tarayıcısı Chromium varsayılanları">
    Paketli korumalı alan tarayıcısı imajı, kapsayıcılaştırılmış iş yükleri için temkinli Chromium başlangıç varsayılanları da uygular. Geçerli kapsayıcı varsayılanları şunları içerir:

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
    - Üç grafik güçlendirme bayrağı (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) isteğe bağlıdır ve kapsayıcılar GPU desteğinden yoksun olduğunda kullanışlıdır. İş yükünüz WebGL veya diğer 3D/tarayıcı özellikleri gerektiriyorsa `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` ayarlayın.
    - `--disable-extensions` varsayılan olarak etkindir ve uzantıya bağımlı akışlar için `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ile devre dışı bırakılabilir.
    - `--renderer-process-limit=2`, `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` tarafından denetlenir; burada `0`, Chromium varsayılanını korur.

    Farklı bir çalışma zamanı profiline ihtiyacınız varsa özel bir tarayıcı imajı kullanın ve kendi giriş noktanızı sağlayın. Yerel (kapsayıcı olmayan) Chromium profilleri için ek başlangıç bayrakları eklemek üzere `browser.extraArgs` kullanın.

  </Accordion>
  <Accordion title="Ağ güvenliği varsayılanları">
    - `network: "host"` engellenir.
    - `network: "container:<id>"` varsayılan olarak engellenir (ad alanına katılma baypas riski).
    - Acil durum geçersiz kılması: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker kurulumları ve kapsayıcılaştırılmış Gateway burada bulunur: [Docker](/tr/install/docker)

Docker Gateway dağıtımları için `scripts/docker/setup.sh`, korumalı alan yapılandırmasını önyükleyebilir. Bu yolu etkinleştirmek için `OPENCLAW_SANDBOX=1` (veya `true`/`yes`/`on`) ayarlayın. Soket konumunu `OPENCLAW_DOCKER_SOCKET` ile geçersiz kılabilirsiniz. Tam kurulum ve ortam başvurusu: [Docker](/tr/install/docker#agent-sandbox).

## setupCommand (tek seferlik kapsayıcı kurulumu)

`setupCommand`, korumalı alan kapsayıcısı oluşturulduktan sonra **bir kez** çalışır (her çalıştırmada değil). Kapsayıcı içinde `sh -lc` aracılığıyla yürütülür.

Yollar:

- Genel: `agents.defaults.sandbox.docker.setupCommand`
- Aracı başına: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Yaygın tuzaklar">
    - Varsayılan `docker.network` `"none"` değeridir (çıkış yoktur), bu nedenle paket kurulumları başarısız olur.
    - `docker.network: "container:<id>"`, `dangerouslyAllowContainerNamespaceJoin: true` gerektirir ve yalnızca acil durum içindir.
    - `readOnlyRoot: true` yazmaları engeller; `readOnlyRoot: false` ayarlayın veya özel bir imaj hazırlayın.
    - Paket kurulumları için `user` root olmalıdır (`user` değerini atlayın veya `user: "0:0"` ayarlayın).
    - Korumalı alan exec, ana makine `process.env` değerini devralmaz. Beceri API anahtarları için `agents.defaults.sandbox.docker.env` (veya özel bir imaj) kullanın.

  </Accordion>
</AccordionGroup>

## Araç ilkesi ve kaçış yolları

Araç izin/ret ilkeleri, korumalı alan kurallarından önce uygulanmaya devam eder. Bir araç genel olarak veya aracı başına reddedilmişse, korumalı alan onu geri getirmez.

`tools.elevated`, `exec` komutunu korumalı alan dışında çalıştıran açık bir kaçış yoludur (varsayılan olarak `gateway` veya exec hedefi `node` olduğunda `node`). `/exec` yönergeleri yalnızca yetkili gönderenler için geçerlidir ve oturum başına kalıcıdır; `exec` özelliğini sert şekilde devre dışı bırakmak için araç ilkesi reddini kullanın (bkz. [Korumalı Alan ve Araç İlkesi ve Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Hata ayıklama:

- Etkili korumalı alan modunu, araç ilkesini ve düzeltme yapılandırma anahtarlarını incelemek için `openclaw sandbox explain` kullanın.
- "Bu neden engellendi?" zihinsel modeli için [Korumalı Alan ve Araç İlkesi ve Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) sayfasına bakın.

Kilitli tutun.

## Çoklu aracı geçersiz kılmaları

Her aracı korumalı alan + araçları geçersiz kılabilir: `agents.list[].sandbox` ve `agents.list[].tools` (ayrıca korumalı alan araç ilkesi için `agents.list[].tools.sandbox.tools`). Öncelik için [Çoklu Aracı Korumalı Alanı ve Araçlar](/tr/tools/multi-agent-sandbox-tools) sayfasına bakın.

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

- [Çoklu Ajan Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) — ajan başına geçersiz kılmalar ve öncelik sırası
- [OpenShell](/tr/gateway/openshell) — yönetilen sandbox arka ucu kurulumu, çalışma alanı modları ve yapılandırma başvurusu
- [Sandbox yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox ile Araç İlkesi ile Yükseltilmiş Arasındaki Fark](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) — "bu neden engelleniyor?" hata ayıklaması
- [Güvenlik](/tr/gateway/security)
