---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClaw sandboxing nasıl çalışır: modlar, kapsamlar, çalışma alanı erişimi ve görüntüler'
title: Korumalı alan
x-i18n:
    generated_at: "2026-06-28T00:38:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw, etki alanını azaltmak için **araçları sandbox arka uçları içinde** çalıştırabilir. Bu **isteğe bağlıdır** ve yapılandırma (`agents.defaults.sandbox` veya `agents.list[].sandbox`) ile denetlenir. Sandbox kapalıysa araçlar ana makinede çalışır. Gateway ana makinede kalır; etkinleştirildiğinde araç yürütme yalıtılmış bir sandbox içinde çalışır.

<Note>
Bu kusursuz bir güvenlik sınırı değildir, ancak model hatalı bir şey yaptığında dosya sistemi ve süreç erişimini önemli ölçüde sınırlar.
</Note>

## Neler sandbox'a alınır

- Araç yürütme (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` vb.).
- İsteğe bağlı sandbox'a alınmış tarayıcı (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandbox'a alınmış tarayıcı ayrıntıları">
    - Varsayılan olarak, tarayıcı aracı ihtiyaç duyduğunda sandbox tarayıcısı otomatik başlar (CDP'nin erişilebilir olmasını sağlar). `agents.defaults.sandbox.browser.autoStart` ve `agents.defaults.sandbox.browser.autoStartTimeoutMs` ile yapılandırın.
    - Varsayılan olarak, sandbox tarayıcı kapsayıcıları genel `bridge` ağı yerine ayrılmış bir Docker ağı (`openclaw-sandbox-browser`) kullanır. `agents.defaults.sandbox.browser.network` ile yapılandırın.
    - İsteğe bağlı `agents.defaults.sandbox.browser.cdpSourceRange`, kapsayıcı kenarı CDP girişini bir CIDR izin listesiyle sınırlar (örneğin `172.21.0.1/32`).
    - noVNC gözlemci erişimi varsayılan olarak parolayla korunur; OpenClaw, yerel bir başlatma sayfası sunan ve noVNC'yi URL parçasında parola ile açan kısa ömürlü bir belirteç URL'si üretir (sorgu/başlık günlüklerinde değil).
    - `agents.defaults.sandbox.browser.allowHostControl`, sandbox'a alınmış oturumların ana makine tarayıcısını açıkça hedeflemesine izin verir.
    - İsteğe bağlı izin listeleri `target: "custom"` için kapı görevi görür: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Sandbox'a alınmayanlar:

- Gateway sürecinin kendisi.
- Sandbox dışında çalışmasına açıkça izin verilen herhangi bir araç (ör. `tools.elevated`).
  - **Yükseltilmiş exec sandbox'ı atlar ve yapılandırılmış kaçış yolunu kullanır (varsayılan olarak `gateway`, exec hedefi `node` olduğunda ise `node`).**
  - Sandbox kapalıysa `tools.elevated` yürütmeyi değiştirmez (zaten ana makinededir). Bkz. [Yükseltilmiş Mod](/tr/tools/elevated).

## Modlar

`agents.defaults.sandbox.mode`, sandbox'ın **ne zaman** kullanılacağını denetler:

<Tabs>
  <Tab title="off">
    Sandbox yok.
  </Tab>
  <Tab title="non-main">
    Yalnızca **ana olmayan** oturumları sandbox'a alır (normal sohbetlerin ana makinede kalmasını istiyorsanız varsayılan).

    `"non-main"`, aracı kimliğine değil `session.mainKey` değerine (varsayılan `"main"`) dayanır. Grup/kanal oturumları kendi anahtarlarını kullanır, bu yüzden ana olmayan sayılır ve sandbox'a alınır.

  </Tab>
  <Tab title="all">
    Her oturum bir sandbox içinde çalışır.
  </Tab>
</Tabs>

## Kapsam

`agents.defaults.sandbox.scope`, **kaç kapsayıcı** oluşturulacağını denetler:

- `"agent"` (varsayılan): aracı başına bir kapsayıcı.
- `"session"`: oturum başına bir kapsayıcı.
- `"shared"`: sandbox'a alınmış tüm oturumlar tarafından paylaşılan bir kapsayıcı.

## Arka uç

`agents.defaults.sandbox.backend`, sandbox'ı **hangi çalışma zamanının** sağlayacağını denetler:

- `"docker"` (sandbox etkinleştirildiğinde varsayılan): yerel Docker destekli sandbox çalışma zamanı.
- `"ssh"`: genel SSH destekli uzak sandbox çalışma zamanı.
- `"openshell"`: OpenShell destekli sandbox çalışma zamanı.

SSH'ye özgü yapılandırma `agents.defaults.sandbox.ssh` altında bulunur. OpenShell'e özgü yapılandırma `plugins.entries.openshell.config` altında bulunur.

### Arka uç seçme

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Nerede çalışır**  | Yerel kapsayıcı                  | SSH ile erişilebilen herhangi bir ana makine | OpenShell tarafından yönetilen sandbox              |
| **Kurulum**         | `scripts/sandbox-setup.sh`       | SSH anahtarı + hedef ana makine | OpenShell Plugin etkin                            |
| **Çalışma alanı modeli** | Bağlama veya kopyalama      | Uzak-kanonik (bir kez tohumla) | `mirror` veya `remote`                              |
| **Ağ denetimi**     | `docker.network` (varsayılan: yok) | Uzak ana makineye bağlıdır    | OpenShell'e bağlıdır                                |
| **Tarayıcı sandbox'ı** | Desteklenir                  | Desteklenmez                   | Henüz desteklenmez                                  |
| **Bağlamalar**      | `docker.binds`                   | Yok                            | Yok                                                 |
| **En uygun kullanım** | Yerel geliştirme, tam yalıtım | Uzak bir makineye yük aktarma  | İsteğe bağlı iki yönlü eşitlemeli yönetilen uzak sandbox'lar |

### Docker arka ucu

Sandbox varsayılan olarak kapalıdır. Sandbox'ı etkinleştirir ve bir arka uç seçmezseniz OpenClaw Docker arka ucunu kullanır. Araçları ve sandbox tarayıcılarını Docker daemon soketi (`/var/run/docker.sock`) üzerinden yerel olarak yürütür. Sandbox kapsayıcı yalıtımı Docker ad alanları tarafından belirlenir.

Ana makine GPU'larını Docker sandbox'larına açmak için `agents.defaults.sandbox.docker.gpus` değerini veya aracı başına `agents.list[].sandbox.docker.gpus` geçersiz kılmasını ayarlayın. Değer, Docker'ın `--gpus` bayrağına ayrı bir argüman olarak aktarılır; örneğin `"all"` veya `"device=GPU-uuid"` ve NVIDIA Container Toolkit gibi uyumlu bir ana makine çalışma zamanı gerektirir.

<Warning>
**Docker-dışından-Docker (DooD) kısıtları**

OpenClaw Gateway'in kendisini bir Docker kapsayıcısı olarak dağıtırsanız, ana makinenin Docker soketini (DooD) kullanarak kardeş sandbox kapsayıcılarını düzenler. Bu, belirli bir yol eşleme kısıtı getirir:

- **Yapılandırma ana makine yolları gerektirir**: `openclaw.json` `workspace` yapılandırması, dahili Gateway kapsayıcı yolunu değil **ana makinenin mutlak yolunu** (ör. `/home/user/.openclaw/workspaces`) İÇERMELİDİR. OpenClaw, Docker daemon'dan bir sandbox başlatmasını istediğinde daemon yolları Gateway ad alanına göre değil, Ana Makine İşletim Sistemi ad alanına göre değerlendirir.
- **FS köprüsü eşliği (özdeş birim haritası)**: OpenClaw Gateway yerel süreci de `workspace` dizinine Heartbeat ve köprü dosyaları yazar. Gateway kendi kapsayıcılı ortamı içinden tamamen aynı dizeyi (ana makine yolunu) değerlendirdiğinden, Gateway dağıtımı ana makine ad alanını yerel olarak bağlayan özdeş bir birim haritası İÇERMELİDİR (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **Codex kod modu**: Bir OpenClaw sandbox'ı etkinken OpenClaw, o tur için Codex uygulama sunucusu yerel Kod Modu'nu, kullanıcı MCP sunucularını ve uygulama destekli Plugin yürütmeyi devre dışı bırakır; çünkü bu yerel yüzeyler OpenClaw sandbox arka ucu yerine Gateway ana makine uygulama sunucusu sürecinden çalışır. Normal exec/process araçları kullanılabilir olduğunda kabuk erişimi `sandbox_exec` ve `sandbox_process` gibi OpenClaw sandbox destekli araçlar üzerinden sunulur. Ana makine Docker soketini aracı sandbox kapsayıcılarına veya özel Codex sandbox'larına bağlamayın.

Ubuntu/AppArmor ana makinelerinde, etkin OpenClaw sandbox'ı olmadan bilinçli olarak yerel Codex `workspace-write` çalıştırdığınızda ve hizmet kullanıcısının ayrıcalıksız kullanıcı ad alanları oluşturmasına izin verilmediğinde Codex `workspace-write`, kabuk başlatılmadan önce başarısız olabilir. Docker sandbox çıkışı devre dışı bırakıldığında (`network: "none"`, varsayılan), Codex'in ayrıca ayrıcalıksız bir ağ ad alanına ihtiyacı vardır. Yaygın belirtiler `bwrap: setting up uid map: Permission denied` ve `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` şeklindedir. `openclaw doctor` çalıştırın; bir Codex bwrap ad alanı yoklama hatası bildirirse, gerekli ad alanlarını OpenClaw hizmet sürecine veren bir AppArmor profilini tercih edin. `kernel.apparmor_restrict_unprivileged_userns=0`, güvenlik ödünleşimleri olan ana makine genelinde bir geri dönüş seçeneğidir; yalnızca o ana makine duruşu kabul edilebilir olduğunda kullanın.

Yolları mutlak ana makine eşliği olmadan dahili olarak eşlerseniz OpenClaw, tam nitelikli yol dizesi yerel olarak var olmadığı için kapsayıcı ortamı içinde Heartbeat yazmaya çalışırken yerel olarak bir `EACCES` izin hatası fırlatır.
</Warning>

### SSH arka ucu

OpenClaw'ın `exec`, dosya araçları ve medya okumalarını SSH ile erişilebilen rastgele bir makinede sandbox'a almasını istediğinizde `backend: "ssh"` kullanın.

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
    - OpenClaw, uzak değişiklikleri otomatik olarak yerel çalışma alanına geri eşitlemez.

  </Accordion>
  <Accordion title="Kimlik doğrulama malzemesi">
    - `identityFile`, `certificateFile`, `knownHostsFile`: mevcut yerel dosyaları kullanır ve bunları OpenSSH yapılandırması üzerinden geçirir.
    - `identityData`, `certificateData`, `knownHostsData`: satır içi dizeleri veya SecretRefs kullanır. OpenClaw bunları normal gizli bilgi çalışma zamanı anlık görüntüsü üzerinden çözer, `0600` ile geçici dosyalara yazar ve SSH oturumu bittiğinde siler.
    - Aynı öğe için hem `*File` hem de `*Data` ayarlanmışsa, o SSH oturumu için `*Data` kazanır.

  </Accordion>
  <Accordion title="Uzak-kanonik sonuçlar">
    Bu bir **uzak-kanonik** modeldir. Uzak SSH çalışma alanı, ilk tohumlamadan sonra gerçek sandbox durumu haline gelir.

    - Tohumlama adımından sonra OpenClaw dışında yapılan ana makine-yerel düzenlemeler, sandbox'ı yeniden oluşturana kadar uzakta görünmez.
    - `openclaw sandbox recreate`, kapsam başına uzak kökü siler ve sonraki kullanımda yerelden tekrar tohumlar.
    - SSH arka ucunda tarayıcı sandbox'ı desteklenmez.
    - `sandbox.docker.*` ayarları SSH arka ucuna uygulanmaz.

  </Accordion>
</AccordionGroup>

### OpenShell arka ucu

OpenClaw'ın araçları OpenShell tarafından yönetilen uzak bir ortamda sandbox'a almasını istediğinizde `backend: "openshell"` kullanın. Tam kurulum kılavuzu, yapılandırma başvurusu ve çalışma alanı modu karşılaştırması için ayrılmış [OpenShell sayfasına](/tr/gateway/openshell) bakın.

OpenShell, genel SSH arka ucuyla aynı temel SSH taşımasını ve uzak dosya sistemi köprüsünü yeniden kullanır; buna OpenShell'e özgü yaşam döngüsü (`sandbox create/get/delete`, `sandbox ssh-config`) ve isteğe bağlı `mirror` çalışma alanı modu ekler.

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
- `remote`: sandbox oluşturulduktan sonra OpenShell çalışma alanı kanonik olur. OpenClaw, uzak çalışma alanını yerel çalışma alanından bir kez tohumlar; ardından dosya araçları ve exec, değişiklikleri geri eşitlemeden doğrudan uzak sandbox'a karşı çalışır.

<AccordionGroup>
  <Accordion title="Uzak aktarım ayrıntıları">
    - OpenClaw, sandbox'a özel SSH yapılandırmasını OpenShell'den `openshell sandbox ssh-config <name>` aracılığıyla ister.
    - Core, bu SSH yapılandırmasını geçici bir dosyaya yazar, SSH oturumunu açar ve `backend: "ssh"` tarafından kullanılan aynı uzak dosya sistemi köprüsünü yeniden kullanır.
    - `mirror` modunda yalnızca yaşam döngüsü farklıdır: exec öncesinde yerelden uzağa eşitle, ardından exec sonrasında geri eşitle.

  </Accordion>
  <Accordion title="Geçerli OpenShell sınırlamaları">
    - sandbox tarayıcısı henüz desteklenmiyor
    - `sandbox.docker.binds`, OpenShell arka ucunda desteklenmez
    - `sandbox.docker.*` altındaki Docker'a özel çalışma zamanı ayarları hâlâ yalnızca Docker arka ucu için geçerlidir

  </Accordion>
</AccordionGroup>

#### Çalışma alanı modları

OpenShell'in iki çalışma alanı modeli vardır. Pratikte en önemli kısım budur.

<Tabs>
  <Tab title="mirror (yerel kanonik)">
    **Yerel çalışma alanının kanonik kalmasını** istediğinizde `plugins.entries.openshell.config.mode: "mirror"` kullanın.

    Davranış:

    - `exec` öncesinde OpenClaw yerel çalışma alanını OpenShell sandbox'ına eşitler.
    - `exec` sonrasında OpenClaw uzak çalışma alanını yerel çalışma alanına geri eşitler.
    - Dosya araçları hâlâ sandbox köprüsü üzerinden çalışır, ancak yerel çalışma alanı turlar arasında doğruluk kaynağı olarak kalır.

    Bunu şu durumlarda kullanın:

    - dosyaları OpenClaw dışında yerel olarak düzenliyorsanız ve bu değişikliklerin sandbox'ta otomatik görünmesini istiyorsanız
    - OpenShell sandbox'ının mümkün olduğunca Docker arka ucu gibi davranmasını istiyorsanız
    - ana makine çalışma alanının her exec turundan sonra sandbox yazmalarını yansıtmasını istiyorsanız

    Ödün: exec öncesinde ve sonrasında ek eşitleme maliyeti.

  </Tab>
  <Tab title="remote (OpenShell kanonik)">
    **OpenShell çalışma alanının kanonik olmasını** istediğinizde `plugins.entries.openshell.config.mode: "remote"` kullanın.

    Davranış:

    - Sandbox ilk oluşturulduğunda, OpenClaw uzak çalışma alanını yerel çalışma alanından bir kez tohumlar.
    - Bundan sonra `exec`, `read`, `write`, `edit` ve `apply_patch` doğrudan uzak OpenShell çalışma alanına karşı çalışır.
    - OpenClaw, exec sonrasında uzak değişiklikleri yerel çalışma alanına geri eşitlemez.
    - İstem zamanındaki medya okumaları hâlâ çalışır çünkü dosya ve medya araçları, yerel bir ana makine yolunu varsaymak yerine sandbox köprüsü üzerinden okur.
    - Aktarım, `openshell sandbox ssh-config` tarafından döndürülen OpenShell sandbox'ına SSH ile yapılır.

    Önemli sonuçlar:

    - Tohumlama adımından sonra ana makinede OpenClaw dışında dosyaları düzenlerseniz, uzak sandbox bu değişiklikleri otomatik olarak **görmez**.
    - Sandbox yeniden oluşturulursa, uzak çalışma alanı yerel çalışma alanından tekrar tohumlanır.
    - `scope: "agent"` veya `scope: "shared"` ile bu uzak çalışma alanı aynı kapsamda paylaşılır.

    Bunu şu durumlarda kullanın:

    - sandbox öncelikle uzak OpenShell tarafında yaşamalıysa
    - tur başına eşitleme ek yükünü azaltmak istiyorsanız
    - ana makineye yerel düzenlemelerin uzak sandbox durumunu sessizce üzerine yazmasını istemiyorsanız

  </Tab>
</Tabs>

Sandbox'ı geçici bir yürütme ortamı olarak düşünüyorsanız `mirror` seçin. Sandbox'ı gerçek çalışma alanı olarak düşünüyorsanız `remote` seçin.

#### OpenShell yaşam döngüsü

OpenShell sandbox'ları hâlâ normal sandbox yaşam döngüsü üzerinden yönetilir:

- `openclaw sandbox list`, Docker çalışma zamanlarının yanı sıra OpenShell çalışma zamanlarını da gösterir
- `openclaw sandbox recreate`, geçerli çalışma zamanını siler ve OpenClaw'ın bir sonraki kullanımda yeniden oluşturmasına izin verir
- temizleme mantığı da arka uçtan haberdardır

`remote` modu için yeniden oluşturma özellikle önemlidir:

- yeniden oluşturma, o kapsam için kanonik uzak çalışma alanını siler
- sonraki kullanım, yerel çalışma alanından yeni bir uzak çalışma alanı tohumlar

`mirror` modu için yeniden oluşturma, yerel çalışma alanı zaten kanonik kaldığından esas olarak uzak yürütme ortamını sıfırlar.

## Çalışma alanı erişimi

`agents.defaults.sandbox.workspaceAccess`, **sandbox'ın neyi görebileceğini** kontrol eder:

<Tabs>
  <Tab title="none (varsayılan)">
    Araçlar `~/.openclaw/sandboxes` altında bir sandbox çalışma alanı görür.
  </Tab>
  <Tab title="ro">
    Ajan çalışma alanını `/agent` konumuna salt okunur bağlar (`write`/`edit`/`apply_patch` devre dışı bırakılır).
  </Tab>
  <Tab title="rw">
    Ajan çalışma alanını `/workspace` konumuna okuma/yazma olarak bağlar.
  </Tab>
</Tabs>

OpenShell arka ucuyla:

- `mirror` modu, exec turları arasında kanonik kaynak olarak hâlâ yerel çalışma alanını kullanır
- `remote` modu, ilk tohumlamadan sonra kanonik kaynak olarak uzak OpenShell çalışma alanını kullanır
- `workspaceAccess: "ro"` ve `"none"` yazma davranışını aynı şekilde kısıtlamaya devam eder

Gelen medya etkin sandbox çalışma alanına (`media/inbound/*`) kopyalanır.

<Note>
**Skills notu:** `read` aracı sandbox köklüdür. `workspaceAccess: "none"` ile OpenClaw, okunabilmeleri için uygun skills'leri sandbox çalışma alanına (`.../skills`) yansıtır. `"rw"` ile çalışma alanı skills'leri `/workspace/skills` üzerinden okunabilir ve uygun yönetilen, paketli veya plugin skills'leri oluşturulan salt okunur yol `/workspace/.openclaw/sandbox-skills/skills` içine materyalize edilir.
</Note>

## Özel bind bağlamaları

`agents.defaults.sandbox.docker.binds`, ek ana makine dizinlerini container içine bağlar. Biçim: `host:container:mode` (ör. `"/home/user/source:/source:rw"`).

Genel ve ajan başına bind'ler **birleştirilir** (değiştirilmez). `scope: "shared"` altında ajan başına bind'ler yok sayılır.

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

- Bind'ler sandbox dosya sistemini atlar: ayarladığınız modla (`:ro` veya `:rw`) ana makine yollarını açığa çıkarır.
- OpenClaw tehlikeli bind kaynaklarını engeller (örneğin: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` ve bunları açığa çıkaracak üst bağlamalar).
- OpenClaw ayrıca `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` ve `~/.ssh` gibi yaygın ev dizini kimlik bilgisi köklerini de engeller.
- Bind doğrulaması yalnızca dize eşleştirme değildir. OpenClaw kaynak yolunu normalleştirir, ardından engellenen yolları ve izin verilen kökleri yeniden denetlemeden önce en derindeki mevcut üst dizin üzerinden tekrar çözer.
- Bu, son yaprak henüz mevcut olmasa bile symlink üst kaçışlarının kapalı kalarak başarısız olacağı anlamına gelir. Örnek: `run-link` orayı gösteriyorsa `/workspace/run-link/new-file` hâlâ `/var/run/...` olarak çözümlenir.
- İzin verilen kaynak kökleri de aynı şekilde kanonikleştirilir; bu nedenle symlink çözümlemesinden önce yalnızca izin listesi içinde görünüyor olan bir yol yine de `outside allowed roots` olarak reddedilir.
- Hassas bağlamalar (gizli bilgiler, SSH anahtarları, servis kimlik bilgileri) kesinlikle gerekli olmadıkça `:ro` olmalıdır.
- Çalışma alanına yalnızca okuma erişimine ihtiyacınız varsa `workspaceAccess: "ro"` ile birleştirin; bind modları bağımsız kalır.
- Bind'lerin araç politikası ve yükseltilmiş exec ile nasıl etkileştiği için [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) bölümüne bakın.

</Warning>

## İmajlar ve kurulum

Varsayılan Docker imajı: `openclaw-sandbox:bookworm-slim`

<Note>
**Kaynak checkout ile npm install karşılaştırması**

`scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` ve `scripts/sandbox-browser-setup.sh` yardımcı betikleri yalnızca bir [kaynak checkout](https://github.com/openclaw/openclaw) üzerinden çalıştırırken kullanılabilir. Bunlar npm paketine dahil değildir.

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

    Varsayılan imaj **Node** içermez. Bir skill Node'a (veya başka çalışma zamanlarına) ihtiyaç duyuyorsa, özel bir imaj hazırlayın ya da `sandbox.docker.setupCommand` üzerinden kurun (ağ çıkışı + yazılabilir root + root kullanıcısı gerekir).

    `openclaw-sandbox:bookworm-slim` eksik olduğunda OpenClaw sessizce düz `debian:bookworm-slim` ile değiştirme yapmaz. Varsayılan imajı hedefleyen sandbox çalıştırmaları, siz imajı derleyene kadar bir derleme talimatıyla hızlı başarısız olur; çünkü paketli imaj, sandbox yazma/düzenleme yardımcıları için `python3` taşır.

  </Step>
  <Step title="İsteğe bağlı: ortak imajı derleyin">
    Yaygın araçlarla daha işlevsel bir sandbox imajı için (örneğin `curl`, `jq`, Node 24, pnpm, `python3` ve `git`):

    Bir kaynak checkout'tan:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Bir npm kurulumundan, önce varsayılan imajı derleyin (yukarıya bakın), ardından depodaki [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) dosyasını kullanarak ortak imajı bunun üzerine derleyin.

    Ardından `agents.defaults.sandbox.docker.image` değerini `openclaw-sandbox-common:bookworm-slim` olarak ayarlayın.

  </Step>
  <Step title="İsteğe bağlı: sandbox tarayıcı imajını derleyin">
    Bir kaynak checkout'tan:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Bir npm kurulumundan, depodaki [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) dosyasını kullanarak derleyin.

  </Step>
</Steps>

Varsayılan olarak Docker sandbox container'ları **ağ olmadan** çalışır. `agents.defaults.sandbox.docker.network` ile geçersiz kılın.

<AccordionGroup>
  <Accordion title="Sandbox tarayıcısı Chromium varsayılanları">
    Paketli sandbox tarayıcı imajı, container'laştırılmış iş yükleri için ihtiyatlı Chromium başlangıç varsayılanlarını da uygular. Geçerli container varsayılanları şunları içerir:

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
    - Üç grafik sağlamlaştırma bayrağı (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) isteğe bağlıdır ve container'larda GPU desteği olmadığında kullanışlıdır. İş yükünüz WebGL veya diğer 3D/tarayıcı özellikleri gerektiriyorsa `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` ayarlayın.
    - `--disable-extensions` varsayılan olarak etkindir ve uzantılara bağımlı akışlar için `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ile devre dışı bırakılabilir.
    - `--renderer-process-limit=2`, `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile kontrol edilir; burada `0`, Chromium'un varsayılanını korur.

    Farklı bir çalışma zamanı profiline ihtiyacınız varsa özel bir tarayıcı imajı kullanın ve kendi entrypoint'inizi sağlayın. Yerel (container dışı) Chromium profilleri için ek başlangıç bayrakları eklemek üzere `browser.extraArgs` kullanın.

  </Accordion>
  <Accordion title="Ağ güvenliği varsayılanları">
    - `network: "host"` engellenir.
    - `network: "container:<id>"` varsayılan olarak engellenir (ad alanına katılma atlatma riski).
    - Acil durum geçersiz kılması: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker kurulumları ve konteynerleştirilmiş Gateway burada bulunur: [Docker](/tr/install/docker)

Docker Gateway dağıtımları için `scripts/docker/setup.sh` korumalı alan yapılandırmasını başlatabilir. Bu yolu etkinleştirmek için `OPENCLAW_SANDBOX=1` (veya `true`/`yes`/`on`) ayarlayın. Soket konumunu `OPENCLAW_DOCKER_SOCKET` ile geçersiz kılabilirsiniz. Tam kurulum ve ortam referansı: [Docker](/tr/install/docker#agent-sandbox).

## setupCommand (tek seferlik konteyner kurulumu)

`setupCommand`, korumalı alan konteyneri oluşturulduktan sonra **bir kez** çalışır (her çalıştırmada değil). Konteyner içinde `sh -lc` aracılığıyla yürütülür.

Yollar:

- Genel: `agents.defaults.sandbox.docker.setupCommand`
- Aracı başına: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Yaygın tuzaklar">
    - Varsayılan `docker.network` `"none"` değeridir (çıkış yok), bu nedenle paket kurulumları başarısız olur.
    - `docker.network: "container:<id>"`, `dangerouslyAllowContainerNamespaceJoin: true` gerektirir ve yalnızca acil durum içindir.
    - `readOnlyRoot: true` yazmaları engeller; `readOnlyRoot: false` ayarlayın veya özel bir imaj hazırlayın.
    - Paket kurulumları için `user` root olmalıdır (`user` değerini atlayın veya `user: "0:0"` ayarlayın).
    - Korumalı alan exec işlemi, ana makine `process.env` değerlerini **devralmaz**. Skills API anahtarları için `agents.defaults.sandbox.docker.env` (veya özel bir imaj) kullanın.
    - `agents.defaults.sandbox.docker.env` içindeki değerler, açık Docker konteyner ortam değişkenleri olarak geçirilir. Docker daemon erişimi olan herkes bunları `docker inspect` gibi Docker meta veri komutlarıyla inceleyebilir. Bu meta veri görünürlüğü kabul edilebilir değilse özel bir imaj, bağlanmış bir gizli dosya veya başka bir gizli bilgi iletim yolu kullanın.

  </Accordion>
</AccordionGroup>

## Araç ilkesi ve kaçış mekanizmaları

Araç izin/verme ve reddetme ilkeleri, korumalı alan kurallarından önce hâlâ uygulanır. Bir araç genel olarak veya aracı başına reddedilmişse, korumalı alan onu geri getirmez.

`tools.elevated`, `exec` işlemini korumalı alan dışında çalıştıran açık bir kaçış mekanizmasıdır (varsayılan olarak `gateway` veya exec hedefi `node` olduğunda `node`). `/exec` yönergeleri yalnızca yetkili gönderenler için geçerlidir ve oturum başına kalıcıdır; `exec` işlemini kesin olarak devre dışı bırakmak için araç ilkesi reddini kullanın (bkz. [Korumalı Alan ile Araç İlkesi ile Elevated Karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Hata ayıklama:

- Etkili korumalı alan modunu, araç ilkesini ve düzeltme yapılandırma anahtarlarını incelemek için `openclaw sandbox explain` kullanın.
- "Bu neden engellendi?" düşünce modeli için [Korumalı Alan ile Araç İlkesi ile Elevated Karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) bölümüne bakın.

Sıkı şekilde kilitli tutun.

## Çok aracılı geçersiz kılmalar

Her aracı korumalı alanı ve araçları geçersiz kılabilir: `agents.list[].sandbox` ve `agents.list[].tools` (ayrıca korumalı alan araç ilkesi için `agents.list[].tools.sandbox.tools`). Öncelik sırası için [Çok Aracılı Korumalı Alan ve Araçlar](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

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

- [Çok Aracılı Korumalı Alan ve Araçlar](/tr/tools/multi-agent-sandbox-tools) — aracı başına geçersiz kılmalar ve öncelik sırası
- [OpenShell](/tr/gateway/openshell) — yönetilen korumalı alan arka uç kurulumu, çalışma alanı modları ve yapılandırma referansı
- [Korumalı alan yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- [Korumalı Alan ile Araç İlkesi ile Elevated Karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) — "Bu neden engellendi?" hata ayıklaması
- [Güvenlik](/tr/gateway/security)
