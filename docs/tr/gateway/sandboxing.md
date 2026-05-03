---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClaw korumalı alanı nasıl çalışır: modlar, kapsamlar, çalışma alanı erişimi ve görüntüler'
title: Korumalı alana alma
x-i18n:
    generated_at: "2026-05-03T21:33:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: e887d07ed84d582bb605c75f841499b6bed42cfc94d60690aba33c2f351b272b
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw, patlama yarıçapını azaltmak için **araçları sandbox arka uçlarının içinde** çalıştırabilir. Bu **isteğe bağlıdır** ve yapılandırma (`agents.defaults.sandbox` veya `agents.list[].sandbox`) ile denetlenir. Sandbox kapalıysa araçlar ana makinede çalışır. Gateway ana makinede kalır; etkinleştirildiğinde araç yürütme yalıtılmış bir sandbox içinde çalışır.

<Note>
Bu kusursuz bir güvenlik sınırı değildir, ancak model yanlış bir şey yaptığında dosya sistemi ve süreç erişimini önemli ölçüde sınırlar.
</Note>

## Sandbox içine alınanlar

- Araç yürütme (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` vb.).
- İsteğe bağlı sandbox tarayıcısı (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandbox tarayıcı ayrıntıları">
    - Varsayılan olarak, tarayıcı aracı ihtiyaç duyduğunda sandbox tarayıcısı otomatik başlar (CDP'nin erişilebilir olmasını sağlar). `agents.defaults.sandbox.browser.autoStart` ve `agents.defaults.sandbox.browser.autoStartTimeoutMs` ile yapılandırın.
    - Varsayılan olarak, sandbox tarayıcı container'ları genel `bridge` ağı yerine ayrılmış bir Docker ağı (`openclaw-sandbox-browser`) kullanır. `agents.defaults.sandbox.browser.network` ile yapılandırın.
    - İsteğe bağlı `agents.defaults.sandbox.browser.cdpSourceRange`, container kenarındaki CDP girişini bir CIDR izin listesiyle sınırlar (örneğin `172.21.0.1/32`).
    - noVNC gözlemci erişimi varsayılan olarak parola korumalıdır; OpenClaw, yerel bir bootstrap sayfası sunan ve parolayı URL fragment içinde (sorgu/header günlüklerinde değil) kullanarak noVNC'yi açan kısa ömürlü bir token URL'si yayar.
    - `agents.defaults.sandbox.browser.allowHostControl`, sandbox içindeki oturumların ana makine tarayıcısını açıkça hedeflemesine izin verir.
    - İsteğe bağlı izin listeleri `target: "custom"` için geçit görevi görür: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Sandbox içine alınmayanlar:

- Gateway sürecinin kendisi.
- Sandbox dışında çalışmasına açıkça izin verilen herhangi bir araç (örn. `tools.elevated`).
  - **Yükseltilmiş exec, sandbox kullanımını atlar ve yapılandırılmış kaçış yolunu kullanır (varsayılan olarak `gateway` veya exec hedefi `node` olduğunda `node`).**
  - Sandbox kapalıysa `tools.elevated` yürütmeyi değiştirmez (zaten ana makinededir). Bkz. [Yükseltilmiş Mod](/tr/tools/elevated).

## Modlar

`agents.defaults.sandbox.mode`, sandbox kullanımının **ne zaman** uygulanacağını denetler:

<Tabs>
  <Tab title="kapalı">
    Sandbox yok.
  </Tab>
  <Tab title="ana olmayan">
    Yalnızca **ana olmayan** oturumları sandbox içine alır (normal sohbetleri ana makinede istiyorsanız varsayılan).

    `"non-main"`, ajan kimliğine değil `session.mainKey` değerine (varsayılan `"main"`) dayanır. Grup/kanal oturumları kendi anahtarlarını kullanır, bu nedenle ana olmayan sayılır ve sandbox içine alınır.

  </Tab>
  <Tab title="tümü">
    Her oturum bir sandbox içinde çalışır.
  </Tab>
</Tabs>

## Kapsam

`agents.defaults.sandbox.scope`, **kaç container** oluşturulacağını denetler:

- `"agent"` (varsayılan): ajan başına bir container.
- `"session"`: oturum başına bir container.
- `"shared"`: sandbox içindeki tüm oturumlar tarafından paylaşılan bir container.

## Arka uç

`agents.defaults.sandbox.backend`, sandbox'ı **hangi runtime'ın** sağlayacağını denetler:

- `"docker"` (sandbox etkinleştirildiğinde varsayılan): yerel Docker destekli sandbox runtime'ı.
- `"ssh"`: genel SSH destekli uzak sandbox runtime'ı.
- `"openshell"`: OpenShell destekli sandbox runtime'ı.

SSH'ye özgü yapılandırma `agents.defaults.sandbox.ssh` altında bulunur. OpenShell'e özgü yapılandırma `plugins.entries.openshell.config` altında bulunur.

### Arka uç seçme

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Çalıştığı yer**   | Yerel container                  | SSH ile erişilebilen herhangi bir ana makine | OpenShell tarafından yönetilen sandbox              |
| **Kurulum**         | `scripts/sandbox-setup.sh`       | SSH anahtarı + hedef ana makine | OpenShell Plugin etkinleştirilmiş                  |
| **Çalışma alanı modeli** | Bind mount veya kopyalama       | Uzak-kanonik (bir kez seed edilir) | `mirror` veya `remote`                              |
| **Ağ denetimi**     | `docker.network` (varsayılan: yok) | Uzak ana makineye bağlıdır     | OpenShell'e bağlıdır                                |
| **Tarayıcı sandbox'ı** | Desteklenir                    | Desteklenmez                   | Henüz desteklenmiyor                                |
| **Bind mount'lar**  | `docker.binds`                   | N/A                            | N/A                                                 |
| **En uygun kullanım** | Yerel geliştirme, tam yalıtım  | Uzak bir makineye aktarma      | İsteğe bağlı iki yönlü senkronizasyonla yönetilen uzak sandbox'lar |

### Docker arka ucu

Sandbox varsayılan olarak kapalıdır. Sandbox'ı etkinleştirir ve bir arka uç seçmezseniz OpenClaw Docker arka ucunu kullanır. Araçları ve sandbox tarayıcılarını Docker daemon soketi (`/var/run/docker.sock`) üzerinden yerel olarak yürütür. Sandbox container yalıtımı Docker namespace'leri tarafından belirlenir.

Ana makine GPU'larını Docker sandbox'larına açmak için `agents.defaults.sandbox.docker.gpus` değerini veya ajan başına `agents.list[].sandbox.docker.gpus` geçersiz kılmasını ayarlayın. Değer Docker'ın `--gpus` bayrağına ayrı bir argüman olarak aktarılır; örneğin `"all"` veya `"device=GPU-uuid"` ve NVIDIA Container Toolkit gibi uyumlu bir ana makine runtime'ı gerektirir.

<Warning>
**Docker-dışından-Docker (DooD) kısıtları**

OpenClaw Gateway'in kendisini bir Docker container olarak dağıtırsanız, ana makinenin Docker soketini (DooD) kullanarak kardeş sandbox container'larını orkestre eder. Bu, belirli bir yol eşleme kısıtı getirir:

- **Yapılandırma ana makine yolları gerektirir**: `openclaw.json` `workspace` yapılandırması, dahili Gateway container yolunu değil **ana makinenin mutlak yolunu** (örn. `/home/user/.openclaw/workspaces`) İÇERMELİDİR. OpenClaw Docker daemon'dan bir sandbox başlatmasını istediğinde daemon yolları Gateway namespace'ine göre değil, ana makine işletim sistemi namespace'ine göre değerlendirir.
- **FS köprüsü denkliği (aynı volume haritası)**: OpenClaw Gateway yerel süreci de heartbeat ve köprü dosyalarını `workspace` dizinine yazar. Gateway, kendi container'laştırılmış ortamının içinden tam olarak aynı string'i (ana makine yolunu) değerlendirdiği için Gateway dağıtımı, ana makine namespace'ini yerel olarak bağlayan aynı volume haritasını İÇERMELİDİR (`-v /home/user/.openclaw:/home/user/.openclaw`).

Yolları mutlak ana makine denkliği olmadan dahili olarak eşlerseniz, OpenClaw container ortamında heartbeat yazmaya çalışırken yerel olarak bir `EACCES` izin hatası fırlatır; çünkü tam nitelikli yol string'i yerel olarak mevcut değildir.
</Warning>

### SSH arka ucu

OpenClaw'ın `exec`, dosya araçları ve medya okumalarını SSH ile erişilebilen herhangi bir makinede sandbox içine almasını istediğinizde `backend: "ssh"` kullanın.

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
    - OpenClaw, `sandbox.ssh.workspaceRoot` altında kapsama özel bir uzak kök oluşturur.
    - Oluşturma veya yeniden oluşturma sonrasında ilk kullanımda OpenClaw bu uzak çalışma alanını yerel çalışma alanından bir kez seed eder.
    - Bundan sonra `exec`, `read`, `write`, `edit`, `apply_patch`, istem medya okumaları ve gelen medya hazırlama doğrudan SSH üzerinden uzak çalışma alanına karşı çalışır.
    - OpenClaw uzak değişiklikleri otomatik olarak yerel çalışma alanına geri senkronize etmez.

  </Accordion>
  <Accordion title="Kimlik doğrulama materyali">
    - `identityFile`, `certificateFile`, `knownHostsFile`: mevcut yerel dosyaları kullanır ve bunları OpenSSH yapılandırması üzerinden geçirir.
    - `identityData`, `certificateData`, `knownHostsData`: satır içi string'ler veya SecretRefs kullanır. OpenClaw bunları normal secrets runtime anlık görüntüsü üzerinden çözer, `0600` ile geçici dosyalara yazar ve SSH oturumu bittiğinde siler.
    - Aynı öğe için hem `*File` hem de `*Data` ayarlanmışsa, o SSH oturumu için `*Data` kazanır.

  </Accordion>
  <Accordion title="Uzak-kanonik sonuçlar">
    Bu bir **uzak-kanonik** modeldir. İlk seed sonrasında uzak SSH çalışma alanı gerçek sandbox durumu haline gelir.

    - Seed adımından sonra OpenClaw dışında yapılan ana makine yerelindeki düzenlemeler, sandbox'ı yeniden oluşturana kadar uzakta görünmez.
    - `openclaw sandbox recreate`, kapsama özel uzak kökü siler ve sonraki kullanımda yeniden yerelden seed eder.
    - SSH arka ucunda tarayıcı sandbox'ı desteklenmez.
    - `sandbox.docker.*` ayarları SSH arka ucu için geçerli değildir.

  </Accordion>
</AccordionGroup>

### OpenShell arka ucu

OpenClaw'ın araçları OpenShell tarafından yönetilen uzak bir ortamda sandbox içine almasını istediğinizde `backend: "openshell"` kullanın. Tam kurulum kılavuzu, yapılandırma başvurusu ve çalışma alanı modu karşılaştırması için özel [OpenShell sayfasına](/tr/gateway/openshell) bakın.

OpenShell, genel SSH arka ucuyla aynı çekirdek SSH taşımasını ve uzak dosya sistemi köprüsünü yeniden kullanır; ayrıca OpenShell'e özgü yaşam döngüsünü (`sandbox create/get/delete`, `sandbox ssh-config`) ve isteğe bağlı `mirror` çalışma alanı modunu ekler.

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

- `mirror` (varsayılan): yerel çalışma alanı kanonik kalır. OpenClaw, exec öncesinde yerel dosyaları OpenShell'e senkronize eder ve exec sonrasında uzak çalışma alanını geri senkronize eder.
- `remote`: sandbox oluşturulduktan sonra OpenShell çalışma alanı kanoniktir. OpenClaw uzak çalışma alanını yerel çalışma alanından bir kez seed eder, ardından dosya araçları ve exec değişiklikleri geri senkronize etmeden doğrudan uzak sandbox'a karşı çalışır.

<AccordionGroup>
  <Accordion title="Uzak taşıma ayrıntıları">
    - OpenClaw, `openshell sandbox ssh-config <name>` üzerinden OpenShell'den sandbox'a özgü SSH yapılandırması ister.
    - Core bu SSH yapılandırmasını geçici bir dosyaya yazar, SSH oturumunu açar ve `backend: "ssh"` tarafından kullanılan aynı uzak dosya sistemi köprüsünü yeniden kullanır.
    - `mirror` modunda yalnızca yaşam döngüsü farklıdır: exec öncesinde yereli uzağa senkronize eder, ardından exec sonrasında geri senkronize eder.

  </Accordion>
  <Accordion title="Mevcut OpenShell sınırlamaları">
    - sandbox tarayıcısı henüz desteklenmiyor
    - `sandbox.docker.binds`, OpenShell arka ucunda desteklenmez
    - `sandbox.docker.*` altındaki Docker'a özgü runtime ayarları hâlâ yalnızca Docker arka ucu için geçerlidir

  </Accordion>
</AccordionGroup>

#### Çalışma alanı modları

OpenShell'in iki çalışma alanı modeli vardır. Pratikte en önemli kısım budur.

<Tabs>
  <Tab title="mirror (yerel kanonik)">
    **Yerel çalışma alanının kanonik kalmasını** istediğinizde `plugins.entries.openshell.config.mode: "mirror"` kullanın.

    Davranış:

    - `exec` öncesinde OpenClaw, yerel çalışma alanını OpenShell sandbox'ına senkronize eder.
    - `exec` sonrasında OpenClaw, uzak çalışma alanını yerel çalışma alanına geri senkronize eder.
    - Dosya araçları yine sandbox köprüsü üzerinden çalışır, ancak yerel çalışma alanı dönüşler arasında doğruluk kaynağı olarak kalır.

    Bunu şu durumda kullanın:

    - dosyaları OpenClaw dışında yerel olarak düzenliyor ve bu değişikliklerin sandbox içinde otomatik olarak görünmesini istiyorsanız
    - OpenShell sandbox ortamının mümkün olduğunca Docker backend gibi davranmasını istiyorsanız
    - host çalışma alanının her exec turundan sonra sandbox yazmalarını yansıtmasını istiyorsanız

    Takas: exec öncesinde ve sonrasında ek eşitleme maliyeti.

  </Tab>
  <Tab title="remote (OpenShell kanonik)">
    **OpenShell çalışma alanının kanonik olmasını** istediğinizde `plugins.entries.openshell.config.mode: "remote"` kullanın.

    Davranış:

    - Sandbox ilk kez oluşturulduğunda, OpenClaw uzak çalışma alanını yerel çalışma alanından bir kez besler.
    - Bundan sonra `exec`, `read`, `write`, `edit` ve `apply_patch` doğrudan uzak OpenShell çalışma alanı üzerinde çalışır.
    - OpenClaw, exec sonrasında uzak değişiklikleri yerel çalışma alanına geri eşitlemez.
    - Prompt zamanındaki medya okumaları hâlâ çalışır, çünkü dosya ve medya araçları yerel bir host yolunu varsaymak yerine sandbox köprüsü üzerinden okur.
    - Taşıma, `openshell sandbox ssh-config` tarafından döndürülen OpenShell sandbox içine SSH ile yapılır.

    Önemli sonuçlar:

    - Besleme adımından sonra host üzerinde OpenClaw dışında dosyaları düzenlerseniz, uzak sandbox bu değişiklikleri otomatik olarak **görmez**.
    - Sandbox yeniden oluşturulursa, uzak çalışma alanı yeniden yerel çalışma alanından beslenir.
    - `scope: "agent"` veya `scope: "shared"` ile bu uzak çalışma alanı aynı kapsamda paylaşılır.

    Bunu şu durumlarda kullanın:

    - sandbox esas olarak uzak OpenShell tarafında yaşamalıysa
    - tur başına eşitleme yükünü düşürmek istiyorsanız
    - host-yerel düzenlemelerin uzak sandbox durumunun üzerine sessizce yazmasını istemiyorsanız

  </Tab>
</Tabs>

Sandbox'ı geçici bir yürütme ortamı olarak düşünüyorsanız `mirror` seçin. Sandbox'ı gerçek çalışma alanı olarak düşünüyorsanız `remote` seçin.

#### OpenShell yaşam döngüsü

OpenShell sandbox ortamları hâlâ normal sandbox yaşam döngüsü üzerinden yönetilir:

- `openclaw sandbox list`, Docker runtime'larının yanı sıra OpenShell runtime'larını da gösterir
- `openclaw sandbox recreate`, geçerli runtime'ı siler ve bir sonraki kullanımda OpenClaw'ın onu yeniden oluşturmasına izin verir
- temizleme mantığı da backend farkındadır

`remote` modu için recreate özellikle önemlidir:

- recreate, o kapsam için kanonik uzak çalışma alanını siler
- sonraki kullanım, yerel çalışma alanından yeni bir uzak çalışma alanı besler

`mirror` modu için recreate, yerel çalışma alanı zaten kanonik kaldığından çoğunlukla uzak yürütme ortamını sıfırlar.

## Çalışma alanı erişimi

`agents.defaults.sandbox.workspaceAccess`, **sandbox'ın neyi görebileceğini** denetler:

<Tabs>
  <Tab title="none (varsayılan)">
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

- `mirror` modu, exec turları arasında yerel çalışma alanını hâlâ kanonik kaynak olarak kullanır
- `remote` modu, ilk beslemeden sonra uzak OpenShell çalışma alanını kanonik kaynak olarak kullanır
- `workspaceAccess: "ro"` ve `"none"` yazma davranışını aynı şekilde kısıtlamaya devam eder

Gelen medya etkin sandbox çalışma alanına kopyalanır (`media/inbound/*`).

<Note>
**Skills notu:** `read` aracı sandbox köklüdür. `workspaceAccess: "none"` ile OpenClaw, okunabilmeleri için uygun skills'leri sandbox çalışma alanına (`.../skills`) yansıtır. `"rw"` ile çalışma alanı skills'leri `/workspace/skills` üzerinden okunabilir.
</Note>

## Özel bind mount'lar

`agents.defaults.sandbox.docker.binds`, ek host dizinlerini container içine bağlar. Biçim: `host:container:mode` (ör. `"/home/user/source:/source:rw"`).

Global ve ajan başına bind'lar **birleştirilir** (değiştirilmez). `scope: "shared"` altında ajan başına bind'lar yok sayılır.

`agents.defaults.sandbox.browser.binds`, ek host dizinlerini yalnızca **sandbox tarayıcısı** container'ına bağlar.

- Ayarlandığında (`[]` dahil), tarayıcı container'ı için `agents.defaults.sandbox.docker.binds` değerinin yerini alır.
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

- Bind'lar sandbox dosya sistemini bypass eder: host yollarını ayarladığınız modla (`:ro` veya `:rw`) açığa çıkarır.
- OpenClaw tehlikeli bind kaynaklarını engeller (örneğin: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` ve bunları açığa çıkaracak üst mount'lar).
- OpenClaw ayrıca `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` ve `~/.ssh` gibi yaygın ev dizini kimlik bilgisi köklerini de engeller.
- Bind doğrulama yalnızca string eşleştirmesi değildir. OpenClaw kaynak yolunu normalleştirir, ardından engellenen yolları ve izin verilen kökleri yeniden denetlemeden önce onu mevcut en derin üst dizin üzerinden tekrar çözümler.
- Bu, son yaprak henüz var olmasa bile symlink üst dizin kaçışlarının kapalı biçimde başarısız olacağı anlamına gelir. Örnek: `run-link` orayı işaret ediyorsa `/workspace/run-link/new-file` hâlâ `/var/run/...` olarak çözümlenir.
- İzin verilen kaynak kökler de aynı şekilde kanonikleştirilir; bu nedenle symlink çözümlemesinden önce yalnızca izin listesinde gibi görünen bir yol yine de `outside allowed roots` olarak reddedilir.
- Hassas mount'lar (gizli değerler, SSH anahtarları, servis kimlik bilgileri) kesinlikle gerekmedikçe `:ro` olmalıdır.
- Çalışma alanına yalnızca okuma erişimine ihtiyacınız varsa `workspaceAccess: "ro"` ile birleştirin; bind modları bağımsız kalır.
- Bind'ların araç ilkesi ve yükseltilmiş exec ile nasıl etkileştiği için [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) bölümüne bakın.

</Warning>

## İmajlar ve kurulum

Varsayılan Docker imajı: `openclaw-sandbox:bookworm-slim`

<Note>
**Kaynak checkout vs npm install**

`scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` ve `scripts/sandbox-browser-setup.sh` yardımcı betikleri yalnızca bir [kaynak checkout](https://github.com/openclaw/openclaw) üzerinden çalıştırırken kullanılabilir. npm paketine dahil değildir.

OpenClaw'ı `npm install -g openclaw` ile kurduysanız, bunun yerine aşağıda gösterilen satır içi `docker build` komutlarını kullanın.
</Note>

<Steps>
  <Step title="Varsayılan imajı derleyin">
    Bir kaynak checkout'tan:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Bir npm kurulumundan (kaynak checkout gerekmez):

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

    Varsayılan imaj Node içermez. Bir skill Node'a (veya başka runtime'lara) ihtiyaç duyuyorsa, özel bir imaj oluşturun ya da `sandbox.docker.setupCommand` üzerinden kurun (ağ çıkışı + yazılabilir root + root kullanıcı gerektirir).

    OpenClaw, `openclaw-sandbox:bookworm-slim` eksik olduğunda sessizce düz `debian:bookworm-slim` kullanmaz. Varsayılan imajı hedefleyen sandbox çalıştırmaları, onu derleyene kadar bir derleme talimatıyla hızlıca başarısız olur; çünkü paketlenen imaj sandbox yazma/düzenleme yardımcıları için `python3` taşır.

  </Step>
  <Step title="İsteğe bağlı: ortak imajı derleyin">
    Yaygın araçlarla (örneğin `curl`, `jq`, `nodejs`, `python3`, `git`) daha işlevsel bir sandbox imajı için:

    Bir kaynak checkout'tan:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Bir npm kurulumundan, önce varsayılan imajı derleyin (yukarıya bakın), ardından depodaki [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) kullanarak ortak imajı bunun üzerine derleyin.

    Ardından `agents.defaults.sandbox.docker.image` değerini `openclaw-sandbox-common:bookworm-slim` olarak ayarlayın.

  </Step>
  <Step title="İsteğe bağlı: sandbox tarayıcı imajını derleyin">
    Bir kaynak checkout'tan:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Bir npm kurulumundan, depodaki [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) kullanarak derleyin.

  </Step>
</Steps>

Varsayılan olarak Docker sandbox container'ları **ağ olmadan** çalışır. `agents.defaults.sandbox.docker.network` ile geçersiz kılın.

<AccordionGroup>
  <Accordion title="Sandbox tarayıcısı Chromium varsayılanları">
    Paketlenen sandbox tarayıcı imajı, container'lı iş yükleri için muhafazakâr Chromium başlangıç varsayılanlarını da uygular. Geçerli container varsayılanları şunları içerir:

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
    - `noSandbox` etkin olduğunda `--no-sandbox`.
    - Üç grafik sıkılaştırma bayrağı (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) isteğe bağlıdır ve container'larda GPU desteği olmadığında kullanışlıdır. İş yükünüz WebGL veya başka 3D/tarayıcı özellikleri gerektiriyorsa `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` ayarlayın.
    - `--disable-extensions` varsayılan olarak etkindir ve uzantıya bağımlı akışlar için `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ile devre dışı bırakılabilir.
    - `--renderer-process-limit=2`, `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile denetlenir; burada `0`, Chromium'un varsayılanını korur.

    Farklı bir runtime profiline ihtiyacınız varsa özel bir tarayıcı imajı kullanın ve kendi entrypoint'inizi sağlayın. Yerel (container olmayan) Chromium profilleri için ek başlangıç bayrakları eklemek üzere `browser.extraArgs` kullanın.

  </Accordion>
  <Accordion title="Ağ güvenliği varsayılanları">
    - `network: "host"` engellenir.
    - `network: "container:<id>"` varsayılan olarak engellenir (namespace'e katılma bypass riski).
    - Acil durum geçersiz kılması: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker kurulumları ve container'lı Gateway burada yer alır: [Docker](/tr/install/docker)

Docker Gateway dağıtımları için `scripts/docker/setup.sh`, sandbox yapılandırmasını başlatabilir. Bu yolu etkinleştirmek için `OPENCLAW_SANDBOX=1` (veya `true`/`yes`/`on`) ayarlayın. Soket konumunu `OPENCLAW_DOCKER_SOCKET` ile geçersiz kılabilirsiniz. Tam kurulum ve env referansı: [Docker](/tr/install/docker#agent-sandbox).

## setupCommand (tek seferlik container kurulumu)

`setupCommand`, sandbox container'ı oluşturulduktan sonra **bir kez** çalışır (her çalıştırmada değil). Container içinde `sh -lc` üzerinden yürütülür.

Yollar:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Ajan başına: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Yaygın tuzaklar">
    - Varsayılan `docker.network` `"none"` değeridir (çıkış yoktur), bu yüzden paket kurulumları başarısız olur.
    - `docker.network: "container:<id>"`, `dangerouslyAllowContainerNamespaceJoin: true` gerektirir ve yalnızca son çare olarak kullanılmalıdır.
    - `readOnlyRoot: true` yazmaları engeller; `readOnlyRoot: false` ayarlayın veya özel bir imaj hazırlayın.
    - Paket kurulumları için `user` root olmalıdır (`user` değerini atlayın veya `user: "0:0"` ayarlayın).
    - Sandbox exec, ana makine `process.env` değerini **devralmaz**. Skill API anahtarları için `agents.defaults.sandbox.docker.env` kullanın (veya özel bir imaj kullanın).

  </Accordion>
</AccordionGroup>

## Araç politikası ve çıkış yolları

Araç izin verme/reddetme politikaları sandbox kurallarından önce uygulanmaya devam eder. Bir araç genel olarak veya ajan bazında reddedilmişse, sandbox onu geri getirmez.

`tools.elevated`, `exec` komutunu sandbox dışında çalıştıran açık bir çıkış yoludur (varsayılan olarak `gateway`, exec hedefi `node` olduğunda ise `node`). `/exec` yönergeleri yalnızca yetkili gönderenler için geçerlidir ve oturum başına kalıcıdır; `exec` özelliğini kesin olarak devre dışı bırakmak için araç politikası reddini kullanın (bkz. [Sandbox ve Araç Politikası ve Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Hata ayıklama:

- Geçerli sandbox modunu, araç politikasını ve düzeltme yapılandırma anahtarlarını incelemek için `openclaw sandbox explain` kullanın.
- "Bu neden engellendi?" zihinsel modeli için bkz. [Sandbox ve Araç Politikası ve Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated).

Kilitli tutun.

## Çok ajanlı geçersiz kılmalar

Her ajan sandbox + araçları geçersiz kılabilir: `agents.list[].sandbox` ve `agents.list[].tools` (sandbox araç politikası için ayrıca `agents.list[].tools.sandbox.tools`). Öncelik sırası için bkz. [Çok Ajanlı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools).

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

- [Çok Ajanlı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) — ajan bazında geçersiz kılmalar ve öncelik sırası
- [OpenShell](/tr/gateway/openshell) — yönetilen sandbox arka uç kurulumu, çalışma alanı modları ve yapılandırma referansı
- [Sandbox yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox ve Araç Politikası ve Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) — "Bu neden engellendi?" hata ayıklaması
- [Güvenlik](/tr/gateway/security)
