---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClaw korumalı alanının çalışma şekli: modlar, kapsamlar, çalışma alanı erişimi ve kalıplar'
title: Korumalı alan oluşturma
x-i18n:
    generated_at: "2026-07-12T12:19:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw, etki alanını azaltmak için araç yürütmeyi bir korumalı alan arka ucu içinde çalıştırabilir. Korumalı alan varsayılan olarak kapalıdır ve `agents.defaults.sandbox` (genel) veya `agents.list[].sandbox` (ajan başına) tarafından denetlenir. Gateway işlemi her zaman ana makinede kalır; etkinleştirildiğinde yalnızca araç yürütme korumalı alana taşınır.

<Note>
Bu kusursuz bir güvenlik sınırı değildir, ancak model mantıksız bir şey yaptığında dosya sistemi ve işlem erişimini önemli ölçüde sınırlar.
</Note>

## Korumalı alanda çalıştırılanlar

- Araç yürütme: `exec`, `read`, `write`, `edit`, `apply_patch`, `process` vb.
- İsteğe bağlı korumalı alan tarayıcısı (`agents.defaults.sandbox.browser`).

Korumalı alanda çalıştırılmayanlar:

- Gateway işleminin kendisi.
- `tools.elevated` aracılığıyla korumalı alan dışında çalışmasına açıkça izin verilen tüm araçlar. Yükseltilmiş `exec`, korumalı alanı atlar ve yapılandırılmış çıkış yolunda çalışır (varsayılan olarak `gateway`; `exec` hedefi `node` olduğunda `node`). Korumalı alan kapalıysa `exec` zaten ana makinede çalıştığından `tools.elevated` hiçbir şeyi değiştirmez. Bkz. [Yükseltilmiş Mod](/tr/tools/elevated).

## Modlar, kapsam ve arka uç

Korumalı alan davranışını üç bağımsız ayar denetler:

| Ayar     | Anahtar                           | Değerler                     | Varsayılan |
| -------- | --------------------------------- | ---------------------------- | ---------- |
| Mod      | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`      |
| Kapsam   | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`    |
| Arka uç  | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker`   |

**Mod**, korumalı alanın ne zaman uygulanacağını denetler:

- `off`: korumalı alan kullanılmaz.
- `non-main`: ajanın ana oturumu dışındaki her oturumu korumalı alanda çalıştırır. Ana oturum anahtarı her zaman `agent:<agentId>:main` değeridir (`session.scope` `"global"` olduğunda `global`); yapılandırılamaz. Grup/kanal oturumları kendi anahtarlarını kullandığından her zaman ana olmayan oturum sayılır ve korumalı alanda çalıştırılır.
- `all`: her oturum bir korumalı alanda çalışır.

**Kapsam**, kaç kapsayıcı/ortam oluşturulacağını denetler:

- `agent`: ajan başına bir kapsayıcı.
- `session`: oturum başına bir kapsayıcı.
- `shared`: korumalı alandaki tüm oturumlar tarafından paylaşılan bir kapsayıcı (bu kapsamda ajan başına `docker`/`ssh`/`browser` geçersiz kılmaları yok sayılır).

**Arka uç**, korumalı alan araçlarını hangi çalışma zamanının yürüteceğini denetler. SSH'ye özgü yapılandırma `agents.defaults.sandbox.ssh` altında; OpenShell'e özgü yapılandırma ise `plugins.entries.openshell.config` altında bulunur.

|                       | Docker                            | SSH                                    | OpenShell                                                |
| --------------------- | --------------------------------- | -------------------------------------- | -------------------------------------------------------- |
| **Çalıştığı yer**     | Yerel kapsayıcı                   | SSH ile erişilebilen herhangi bir ana makine | OpenShell tarafından yönetilen korumalı alan        |
| **Kurulum**           | `scripts/sandbox-setup.sh`        | SSH anahtarı + hedef ana makine         | OpenShell Plugin'i etkin                                 |
| **Çalışma alanı modeli** | Bağlama veya kopyalama         | Uzak ortam esaslı (bir kez başlangıç verisi aktarılır) | `mirror` veya `remote`                     |
| **Ağ denetimi**       | `docker.network` (varsayılan: yok) | Uzak ana makineye bağlı                | OpenShell'e bağlı                                        |
| **Tarayıcı korumalı alanı** | Desteklenir                 | Desteklenmez                            | Henüz desteklenmiyor                                     |
| **Bağlamalar**        | `docker.binds`                    | Yok                                    | Yok                                                      |
| **En uygun kullanım** | Yerel geliştirme, tam yalıtım     | İş yükünü uzak bir makineye aktarma     | İsteğe bağlı çift yönlü eşitlemeyle yönetilen uzak korumalı alanlar |

## Docker arka ucu

Korumalı alan etkinleştirildiğinde Docker varsayılan arka uçtur. Araçları ve korumalı alan tarayıcılarını Docker daemon soketi (`/var/run/docker.sock`) üzerinden yerel olarak çalıştırır; yalıtım Docker ad alanlarından gelir.

Varsayılanlar: `network: "none"` (dışarıya erişim yok), `readOnlyRoot: true`, `capDrop: ["ALL"]`, imaj `openclaw-sandbox:bookworm-slim`.

Ana makine GPU'larını kullanıma açmak için `agents.defaults.sandbox.docker.gpus` değerini (veya ajan başına geçersiz kılmayı) `"all"` ya da `"device=GPU-uuid"` gibi bir değere ayarlayın. Bu değer Docker'ın `--gpus` bayrağına aktarılır ve NVIDIA Container Toolkit gibi uyumlu bir ana makine çalışma zamanı gerektirir.

<Warning>
**Docker dışından Docker (DooD) kısıtlamaları**

OpenClaw Gateway'in kendisini bir Docker kapsayıcısı olarak dağıtırsanız, ana makinenin Docker soketini kullanarak eş düzey korumalı alan kapsayıcılarını yönetir (DooD). Bu durum bir yol eşleme kısıtlaması getirir:

- **Yapılandırma ana makine yollarını gerektirir**: `openclaw.json` içindeki `workspace`, dahili Gateway kapsayıcı yolunu değil, **ana makinenin mutlak yolunu** (ör. `/home/user/.openclaw/workspaces`) içermelidir. Docker daemon, yolları Gateway'in kendi ad alanına göre değil, ana makine işletim sistemi ad alanına göre değerlendirir.
- **Eşleşen birim eşlemesi gerekir**: Gateway işlemi de Heartbeat ve köprü dosyalarını bu `workspace` yoluna yazar. Aynı ana makine yolunun Gateway kapsayıcısının içinden de doğru çözümlenmesi için Gateway kapsayıcısına aynı birim eşlemesini (`-v /home/user/.openclaw:/home/user/.openclaw`) verin. Eşleşmeyen eşlemeler, Gateway Heartbeat'ini yazmaya çalıştığında `EACCES` olarak ortaya çıkar.
- **Codex kod modu**: Bir OpenClaw korumalı alanı etkinken OpenClaw, korumalı alan araç ilkesi gerekli araçları kullanıma açmadığı ve deneysel korumalı alan `exec-server` yolunu seçmediğiniz sürece, ilgili tur için Codex uygulama sunucusunun yerel Kod Modu'nu, kullanıcı MCP sunucularını ve uygulama destekli Plugin yürütmesini devre dışı bırakır (bunlar OpenClaw korumalı alan arka ucundan değil, Gateway ana makinesindeki uygulama sunucusu işleminden çalışır). Kabuk erişimi daha sonra `sandbox_exec` ve `sandbox_process` gibi OpenClaw korumalı alan destekli araçlar üzerinden yönlendirilir. Ana makinenin Docker soketini ajan korumalı alan kapsayıcılarına veya özel Codex korumalı alanlarına bağlamayın. Davranışın tamamı için [Codex Çalıştırma Altyapısı](/tr/plugins/codex-harness) bölümüne bakın.

Docker korumalı alan modu etkinleştirilmiş Ubuntu/AppArmor ana makinelerinde Codex uygulama sunucusunun `workspace-write` kabuk yürütmesi, korumalı alan kapsayıcısı içinde ayrıcalıksız kullanıcı ad alanları gerektirir ve hizmet kullanıcısı bunları oluşturamadığında kabuk başlatılmadan önce başarısız olabilir. Docker korumalı alanından dışarıya erişim devre dışıysa (`network: "none"`, varsayılan) ayrıcalıksız bir ağ ad alanı da gerekir. Yaygın belirtiler: `bwrap: setting up uid map: Permission denied` ve `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. `openclaw doctor` komutunu çalıştırın; bir Codex bwrap ad alanı yoklaması hatası bildirirse OpenClaw hizmet işlemine gerekli ad alanlarını sağlayan bir AppArmor profilini tercih edin. `kernel.apparmor_restrict_unprivileged_userns=0`, güvenlik açısından ödünler içeren, ana makine genelinde geçerli bir geri dönüş seçeneğidir; yalnızca ilgili ana makinenin güvenlik duruşu bunu kabul ediyorsa kullanın.
</Warning>

### Korumalı alan tarayıcısı

- Korumalı alan tarayıcısı, tarayıcı aracı ihtiyaç duyduğunda otomatik olarak başlatılır (CDP'nin erişilebilir olmasını sağlar). `agents.defaults.sandbox.browser.autoStart` (varsayılan `true`) ve `autoStartTimeoutMs` (varsayılan 12 sn.) üzerinden yapılandırın.
- Korumalı alan tarayıcı kapsayıcıları, genel `bridge` ağı yerine özel bir Docker ağı (`openclaw-sandbox-browser`) kullanır. `agents.defaults.sandbox.browser.network` ile yapılandırın.
- `agents.defaults.sandbox.browser.cdpSourceRange`, kapsayıcı sınırındaki CDP girişini bir CIDR izin listesiyle sınırlar (örneğin `172.21.0.1/32`).
- noVNC gözlemci erişimi varsayılan olarak parola korumalıdır; OpenClaw, yerel bir önyükleme sayfası sunan ve noVNC'yi URL parçasındaki parolayla açan kısa ömürlü bir belirteç URL'si üretir (sorgu dizesinde veya üstbilgi günlüklerinde değil).
- `agents.defaults.sandbox.browser.allowHostControl` (varsayılan `false`), korumalı alandaki oturumların ana makine tarayıcısını açıkça hedeflemesine izin verir.
- İsteğe bağlı izin listeleri `target: "custom"` kullanımını denetler: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## SSH arka ucu

Rastgele bir SSH erişimli makinede `exec`, dosya araçları ve medya okumalarını korumalı alanda çalıştırmak için `backend: "ssh"` kullanın.

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
          // Veya yerel dosyalar yerine SecretRefs / satır içi içerikler kullanın:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Varsayılanlar: `command: "ssh"`, `workspaceRoot: "/tmp/openclaw-sandboxes"`, `strictHostKeyChecking: true`, `updateHostKeys: true`.

- **Yaşam döngüsü**: OpenClaw, `sandbox.ssh.workspaceRoot` altında kapsam başına bir uzak kök oluşturur. Oluşturma veya yeniden oluşturma işleminden sonraki ilk kullanımda yerel çalışma alanını bir kez bu uzak çalışma alanına aktarır. Ardından `exec`, `read`, `write`, `edit`, `apply_patch`, istem medya okumaları ve gelen medya hazırlama işlemleri doğrudan SSH üzerinden uzak çalışma alanında çalışır. OpenClaw, uzak değişiklikleri yerel çalışma alanına otomatik olarak eşitlemez.
- **Kimlik doğrulama malzemesi**: `identityFile`/`certificateFile`/`knownHostsFile`, mevcut yerel dosyalara başvurur. `identityData`/`certificateData`/`knownHostsData`, satır içi dizeleri veya normal gizli bilgiler çalışma zamanı anlık görüntüsü üzerinden çözümlenen SecretRefs değerlerini kabul eder; bunlar `0600` moduyla geçici dosyalara yazılır ve SSH oturumu sona erdiğinde silinir. Aynı öğe için hem bir `*File` hem de bir `*Data` çeşidi ayarlanmışsa ilgili oturumda `*Data` önceliklidir.
- **Uzak ortamın esas olmasının sonuçları**: İlk aktarımın ardından uzak SSH çalışma alanı gerçek korumalı alan durumu hâline gelir. Aktarım adımından sonra OpenClaw dışında ana makinede yapılan yerel düzenlemeler, korumalı alanı yeniden oluşturana kadar uzak ortamda görünmez. `openclaw sandbox recreate`, kapsam başına uzak kökü siler ve bir sonraki kullanımda yerel çalışma alanını yeniden aktarır. Bu arka uçta tarayıcı korumalı alanı desteklenmez ve `sandbox.docker.*` ayarları geçerli değildir.

## OpenShell arka ucu

Araçları OpenShell tarafından yönetilen uzak bir ortamda korumalı alanda çalıştırmak için `backend: "openshell"` kullanın. OpenShell, genel SSH arka ucuyla aynı SSH aktarımını ve uzak dosya sistemi köprüsünü yeniden kullanır; ayrıca OpenShell yaşam döngüsünü (`sandbox create/get/delete/ssh-config`) ve isteğe bağlı bir `mirror` çalışma alanı eşitleme modunu ekler.

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
        },
      },
    },
  },
}
```

`mode: "mirror"` (varsayılan), yerel çalışma alanını esas tutar: OpenClaw, `exec` öncesinde yerel içeriği korumalı alana eşitler ve sonrasında değişiklikleri geri eşitler. `mode: "remote"`, uzak çalışma alanına yerel ortamdan bir kez başlangıç verisi aktarır; ardından `exec`/`read`/`write`/`edit`/`apply_patch` işlemlerini geri eşitleme yapmadan doğrudan uzak çalışma alanında çalıştırır. Aktarımdan sonra yapılan yerel düzenlemeler, `openclaw sandbox recreate` komutunu çalıştırana kadar görünmez. `scope: "agent"` veya `scope: "shared"` altında bu uzak çalışma alanı aynı kapsamda paylaşılır. Mevcut sınırlamalar: korumalı alan tarayıcısı henüz desteklenmez ve `sandbox.docker.binds` bu arka uçta geçerli değildir.

`openclaw sandbox list`/`recreate`/prune komutlarının tümü OpenShell çalışma zamanlarını Docker çalışma zamanlarıyla aynı şekilde ele alır; temizleme mantığı arka ucun farkındadır.

Tüm ön koşullar, yapılandırma başvurusu, çalışma alanı modu karşılaştırması ve yaşam döngüsü ayrıntıları için [OpenShell](/tr/gateway/openshell) bölümüne bakın.

## Çalışma alanı erişimi

`agents.defaults.sandbox.workspaceAccess`, korumalı alanın neleri görebileceğini denetler:

| Değer            | Davranış                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| `none` (varsayılan) | Araçlar, `~/.openclaw/sandboxes` altında yalıtılmış bir sandbox çalışma alanı görür.               |
| `ro`             | Ajan çalışma alanını `/agent` konumuna salt okunur olarak bağlar (`write`/`edit`/`apply_patch` devre dışı bırakılır). |
| `rw`             | Ajan çalışma alanını `/workspace` konumuna okuma/yazma modunda bağlar.                                |

OpenShell arka ucuyla `mirror` modu, çalıştırma turları arasında yerel çalışma alanını hâlâ kurallı kaynak olarak kullanır; `remote` modu ilk başlangıç verileri aktarıldıktan sonra uzak OpenShell çalışma alanını kurallı kaynak olarak kullanır ve `workspaceAccess: "ro"`/`"none"` yazma davranışını aynı şekilde kısıtlamaya devam eder.

Gelen medya, etkin sandbox çalışma alanına (`media/inbound/*`) kopyalanır.

<Note>
**Skills**: `read` aracı sandbox kökünü temel alır. `workspaceAccess: "none"` kullanıldığında OpenClaw, okunabilmeleri için uygun Skills öğelerini sandbox çalışma alanına (`.../skills`) yansıtır. `"rw"` kullanıldığında çalışma alanı Skills öğeleri `/workspace/skills` konumundan okunabilir ve uygun yönetilen, paketle birlikte gelen veya Plugin Skills öğeleri, oluşturulan salt okunur `/workspace/.openclaw/sandbox-skills/skills` yolunda somutlaştırılır.
</Note>

## Özel bağlama noktaları

`agents.defaults.sandbox.docker.binds`, ek ana makine dizinlerini konteynere bağlar. Biçim: `ana_makine:konteyner:mod` (ör. `"/home/user/source:/source:rw"`).

Genel ve ajan başına bağlamalar birleştirilir (birbirinin yerini almaz). `scope: "shared"` altında ajan başına bağlamalar yok sayılır.

`agents.defaults.sandbox.browser.binds`, ek ana makine dizinlerini yalnızca **sandbox tarayıcısı** konteynerine bağlar. Ayarlandığında (`[]` dâhil), tarayıcı konteyneri için `docker.binds` değerinin yerini alır; belirtilmediğinde tarayıcı konteyneri `docker.binds` değerine geri döner.

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

- Bağlamalar sandbox dosya sistemini atlar: ana makine yollarını ayarladığınız modla (`:ro` veya `:rw`) açığa çıkarır.
- OpenClaw, tehlikeli bağlama kaynaklarını varsayılan olarak engeller: sistem yolları (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), Docker soket dizinleri (`/run`, `/var/run` ve bunların `docker.sock` türevleri) ve yaygın giriş dizini kimlik bilgisi kökleri (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- Doğrulama, kaynak yolunu normalleştirir ve ardından engellenen yolları ve izin verilen kökleri yeniden denetlemeden önce mevcut en derin üst dizin üzerinden yolu tekrar çözümler; böylece son yaprak henüz mevcut olmasa bile sembolik bağlantı üst dizini üzerinden kaçışlar güvenli biçimde başarısız olur (ör. `run-link` burayı gösteriyorsa `/workspace/run-link/new-file` yine `/var/run/...` olarak çözümlenir).
- Ayrılmış konteyner bağlama noktalarını (`/workspace`, `/agent`) gölgeleyen bağlama hedefleri de varsayılan olarak engellenir; `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true` ile geçersiz kılın.
- Çalışma alanı/ajan çalışma alanı izin listesindeki köklerin dışında bulunan bağlama kaynakları varsayılan olarak engellenir; `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true` ile geçersiz kılın. İzin verilen kökler de aynı şekilde kurallı hâle getirilir; dolayısıyla sembolik bağlantı çözümlemesinden önce yalnızca izin listesinin içinde görünür olan bir yol, izin verilen köklerin dışında olduğu için yine reddedilir.
- Hassas bağlamalar (gizli bilgiler, SSH anahtarları, hizmet kimlik bilgileri), kesinlikle gerekli olmadıkça `:ro` olmalıdır.
- Yalnızca çalışma alanına okuma erişimi gerekiyorsa `workspaceAccess: "ro"` ile birlikte kullanın; bağlama modları bağımsız kalır.
- Bağlamaların araç ilkesi ve yükseltilmiş çalıştırmayla nasıl etkileşime girdiği için [Sandbox, Araç İlkesi ve Yükseltilmiş Çalıştırma Karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) bölümüne bakın.

</Warning>

## İmajlar ve kurulum

Varsayılan Docker imajı: `openclaw-sandbox:bookworm-slim`

<Note>
**Kaynak kod çıkışı ve npm kurulumu karşılaştırması**

`scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` ve `scripts/sandbox-browser-setup.sh` yardımcı betikleri yalnızca bir [kaynak kod çıkışından](https://github.com/openclaw/openclaw) çalıştırırken kullanılabilir. npm paketine dâhil değildirler.

OpenClaw'ı `npm install -g openclaw` aracılığıyla kurduysanız bunun yerine aşağıda gösterilen satır içi `docker build` komutlarını kullanın.
</Note>

<Steps>
  <Step title="Varsayılan imajı oluşturun">
    Bir kaynak kod çıkışından:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Bir npm kurulumundan (kaynak kod çıkışı gerekmez):

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

    Varsayılan imaj Node içermez. Bir Skill, Node'a (veya başka çalışma zamanlarına) ihtiyaç duyuyorsa özel bir imaj oluşturun ya da `sandbox.docker.setupCommand` aracılığıyla kurun (ağ çıkışı + yazılabilir kök + root kullanıcısı gerektirir).

    `openclaw-sandbox:bookworm-slim` eksik olduğunda OpenClaw bunun yerine sessizce düz `debian:bookworm-slim` kullanmaz. Varsayılan imajı hedefleyen sandbox çalıştırmaları, imajı oluşturana kadar bir oluşturma talimatıyla hızla başarısız olur; çünkü paketle birlikte gelen imaj, sandbox yazma/düzenleme yardımcıları için `python3` içerir.

  </Step>
  <Step title="İsteğe bağlı: ortak imajı oluşturun">
    Yaygın araçları (örneğin `curl`, `jq`, Node 24, pnpm, `python3` ve `git`) içeren, daha işlevsel bir sandbox imajı için:

    Bir kaynak kod çıkışından:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Bir npm kurulumundan varsayılan imajı önce oluşturun (yukarıya bakın), ardından depodaki [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) dosyasını kullanarak ortak imajı bunun üzerine oluşturun.

    Ardından `agents.defaults.sandbox.docker.image` değerini `openclaw-sandbox-common:bookworm-slim` olarak ayarlayın.

  </Step>
  <Step title="İsteğe bağlı: sandbox tarayıcı imajını oluşturun">
    Bir kaynak kod çıkışından:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Bir npm kurulumundan, depodaki [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) dosyasını kullanarak oluşturun.

  </Step>
</Steps>

Docker sandbox konteynerleri varsayılan olarak **ağ olmadan** çalışır. `agents.defaults.sandbox.docker.network` ile geçersiz kılın.

<AccordionGroup>
  <Accordion title="Sandbox tarayıcısı Chromium varsayılanları">
    Paketle birlikte gelen sandbox tarayıcı imajı, konteynerleştirilmiş iş yükleri için ölçülü Chromium başlangıç bayrakları uygular:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - `browser.headless` etkinleştirildiğinde `--headless=new`.
    - `browser.noSandbox` etkinleştirildiğinde `--no-sandbox --disable-setuid-sandbox`.
    - Varsayılan olarak `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer`; bu grafik sağlamlaştırma bayrakları GPU desteği olmayan konteynerlere yardımcı olur. İş yükünüz WebGL veya diğer 3B özelliklere ihtiyaç duyuyorsa `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` olarak ayarlayın.
    - Varsayılan olarak `--disable-extensions`; uzantılara bağlı akışlar için `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` olarak ayarlayın.
    - Varsayılan olarak `--renderer-process-limit=2`; `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` tarafından denetlenir; `0`, Chromium varsayılanını korur.

    Farklı bir çalışma zamanı profiline ihtiyacınız varsa özel bir tarayıcı imajı kullanın ve kendi giriş noktanızı sağlayın. Yerel (konteyner dışı) Chromium profilleri için ek başlangıç bayrakları eklemek üzere `browser.extraArgs` kullanın.

  </Accordion>
  <Accordion title="Ağ güvenliği varsayılanları">
    - `network: "host"` engellenir.
    - `network: "container:<id>"` varsayılan olarak engellenir (ad alanı birleştirme yoluyla atlama riski).
    - Acil durum geçersiz kılması: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker kurulumları ve konteynerleştirilmiş Gateway burada açıklanır: [Docker](/tr/install/docker)

Docker Gateway dağıtımları için `scripts/docker/setup.sh`, sandbox yapılandırmasını önyükleyebilir. Bu yolu etkinleştirmek için `OPENCLAW_SANDBOX=1` (veya `true`/`yes`/`on`) olarak ayarlayın. Soket konumunu `OPENCLAW_DOCKER_SOCKET` ile geçersiz kılın. Tam kurulum ve ortam değişkeni başvurusu: [Docker](/tr/install/docker#agent-sandbox).

## setupCommand (tek seferlik konteyner kurulumu)

`setupCommand`, sandbox konteyneri oluşturulduktan sonra **bir kez** çalışır (her çalıştırmada değil). Konteyner içinde `sh -lc` aracılığıyla yürütülür.

Yollar:

- Genel: `agents.defaults.sandbox.docker.setupCommand`
- Ajan başına: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Yaygın sorunlar">
    - Varsayılan `docker.network` değeri `"none"` şeklindedir (çıkış yoktur), bu nedenle paket kurulumları başarısız olur.
    - `docker.network: "container:<id>"`, `dangerouslyAllowContainerNamespaceJoin: true` gerektirir ve yalnızca acil durumlarda kullanılmalıdır.
    - `readOnlyRoot: true` yazma işlemlerini engeller; `readOnlyRoot: false` olarak ayarlayın veya özel bir imaj oluşturun.
    - Paket kurulumları için `user` root olmalıdır (`user` değerini atlayın veya `user: "0:0"` olarak ayarlayın).
    - Sandbox çalıştırması, ana makinenin `process.env` değerini devralmaz. Skill API anahtarları için `agents.defaults.sandbox.docker.env` (veya özel bir imaj) kullanın.
    - `agents.defaults.sandbox.docker.env` içindeki değerler, açık Docker konteyneri ortam değişkenleri olarak iletilir. Docker daemon erişimi olan herkes bunları `docker inspect` gibi Docker meta veri komutlarıyla inceleyebilir. Bu meta veri açığa çıkması kabul edilebilir değilse özel bir imaj, bağlanmış gizli bilgi dosyası veya başka bir gizli bilgi teslim yolu kullanın.

  </Accordion>
</AccordionGroup>

## Araç ilkesi ve kaçış yolları

Araç izin verme/reddetme ilkeleri sandbox kurallarından önce uygulanmaya devam eder. Bir araç genel olarak veya ajan başına reddedilmişse sandbox kullanımı onu geri getirmez.

`tools.elevated`, `exec` komutunu sandbox dışında çalıştıran açık bir kaçış yoludur (varsayılan olarak `gateway`; çalıştırma hedefi `node` olduğunda `node`). `/exec` yönergeleri yalnızca yetkili göndericiler için geçerlidir ve oturum boyunca kalıcıdır; `exec` komutunu kesin olarak devre dışı bırakmak için araç ilkesi reddini kullanın (bkz. [Sandbox, Araç İlkesi ve Yükseltilmiş Çalıştırma Karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Hata ayıklama:

- `openclaw sandbox list`; sandbox konteynerlerini, durumlarını, imaj eşleşmesini, yaşını, boşta kalma süresini ve ilişkili oturumu/ajanı gösterir.
- `openclaw sandbox explain [--session <key>] [--agent <id>]`; geçerli sandbox modunu, ana makine çalışma alanını, çalışma zamanı çalışma dizinini, Docker bağlamalarını, araç ilkesini ve düzeltme yapılandırması anahtarlarını inceler. `workspaceRoot` alanı yapılandırılmış sandbox kökü olarak kalır; `effectiveHostWorkspaceRoot`, etkin çalışma alanının gerçekte nerede bulunduğunu gösterir.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]`; konteynerleri/ortamları kaldırır, böylece bir sonraki kullanımda mevcut yapılandırmayla yeniden oluşturulurlar.
- "Bu neden engellendi?" düşünce modeli için [Sandbox, Araç İlkesi ve Yükseltilmiş Çalıştırma Karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) bölümüne bakın.

## Çok ajanlı geçersiz kılmalar

Her ajan sandbox + araç ayarlarını geçersiz kılabilir: `agents.list[].sandbox` ve `agents.list[].tools` (sandbox araç ilkesi için ayrıca `agents.list[].tools.sandbox.tools`). Öncelik sırası için [Çok Ajanlı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

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

- [Çoklu Aracı Sandbox'ı ve Araçları](/tr/tools/multi-agent-sandbox-tools) -- aracı başına geçersiz kılmalar ve öncelik sırası
- [OpenShell](/tr/gateway/openshell) -- yönetilen sandbox arka ucu kurulumu, çalışma alanı modları ve yapılandırma başvurusu
- [Sandbox yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox, Araç Politikası ve Yükseltilmiş Yetki Karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) -- "bu neden engelleniyor?" sorununu ayıklama
- [Güvenlik](/tr/gateway/security)
