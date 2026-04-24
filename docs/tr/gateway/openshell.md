---
read_when:
    - Yerel Docker yerine bulut tarafından yönetilen sandbox'lar istiyorsunuz
    - OpenShell Plugin'ini kuruyorsunuz
    - Mirror ve remote workspace modları arasında seçim yapmanız gerekiyor
summary: OpenClaw ajanları için yönetilen sandbox arka ucu olarak OpenShell kullanın
title: OpenShell
x-i18n:
    generated_at: "2026-04-24T09:10:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47954cd27b4c7ef9d4268597c2846960b39b99fd03ece5dddb5055e9282366a0
    source_path: gateway/openshell.md
    workflow: 15
---

OpenShell, OpenClaw için yönetilen bir sandbox arka ucudur. Docker
konteynerlerini yerelde çalıştırmak yerine OpenClaw, sandbox yaşam döngüsünü `openshell` CLI'ye devreder;
bu da SSH tabanlı komut yürütmeyle uzak ortamlar sağlar.

OpenShell Plugin'i, genel [SSH arka ucu](/tr/gateway/sandboxing#ssh-backend) ile aynı çekirdek SSH taşımasını ve uzak dosya sistemi
köprüsünü yeniden kullanır. Buna OpenShell'e özgü yaşam döngüsünü (`sandbox create/get/delete`, `sandbox ssh-config`)
ve isteğe bağlı `mirror` çalışma alanı modunu ekler.

## Ön koşullar

- `openshell` CLI'nin kurulu olması ve `PATH` içinde bulunması (veya
  `plugins.entries.openshell.config.command` ile özel yol ayarlamanız)
- Sandbox erişimine sahip bir OpenShell hesabı
- Ana makinede çalışan OpenClaw Gateway

## Hızlı başlangıç

1. Plugin'i etkinleştirin ve sandbox arka ucunu ayarlayın:

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
          mode: "remote",
        },
      },
    },
  },
}
```

2. Gateway'i yeniden başlatın. Sonraki ajan dönüşünde OpenClaw bir OpenShell
   sandbox'ı oluşturur ve araç yürütmesini bunun üzerinden yönlendirir.

3. Doğrulayın:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Çalışma alanı modları

OpenShell kullanırken verilmesi gereken en önemli karar budur.

### `mirror`

**Yerel çalışma alanının kanonik kalmasını** istiyorsanız `plugins.entries.openshell.config.mode: "mirror"` kullanın.

Davranış:

- `exec` öncesinde OpenClaw yerel çalışma alanını OpenShell sandbox'ına eşzamanlar.
- `exec` sonrasında OpenClaw uzak çalışma alanını yerel çalışma alanına geri eşzamanlar.
- Dosya araçları yine sandbox köprüsü üzerinden çalışır, ancak yerel çalışma alanı
  dönüşler arasında doğruluk kaynağı olarak kalır.

Şunlar için en uygunudur:

- OpenClaw dışında yerelde dosya düzenliyorsunuz ve bu değişikliklerin
  sandbox içinde otomatik olarak görünmesini istiyorsunuz.
- OpenShell sandbox'ının Docker arka ucuna mümkün olduğunca
  benzer davranmasını istiyorsunuz.
- Her `exec` dönüşünden sonra ana makine çalışma alanının sandbox yazılarını yansıtmasını istiyorsunuz.

Takas: her `exec` öncesi ve sonrası ek eşzamanlama maliyeti.

### `remote`

**OpenShell çalışma alanının kanonik hâle gelmesini** istiyorsanız `plugins.entries.openshell.config.mode: "remote"` kullanın.

Davranış:

- Sandbox ilk oluşturulduğunda OpenClaw uzak çalışma alanını
  yerel çalışma alanından bir kez besler.
- Bundan sonra `exec`, `read`, `write`, `edit` ve `apply_patch`
  doğrudan uzak OpenShell çalışma alanına karşı çalışır.
- OpenClaw uzak değişiklikleri yerel çalışma alanına **geri eşzamanlamaz**.
- İstem zamanı medya okumaları yine çalışır; çünkü dosya ve medya araçları sandbox köprüsü üzerinden okur.

Şunlar için en uygunudur:

- Sandbox esas olarak uzak tarafta yaşamalıdır.
- Dönüş başına daha düşük eşzamanlama yükü istiyorsunuz.
- Ana makine üzerindeki yerel düzenlemelerin sessizce uzak sandbox durumunun üzerine yazmasını istemiyorsunuz.

Önemli: ilk beslemeden sonra OpenClaw dışında ana makinede dosya düzenlerseniz,
uzak sandbox bu değişiklikleri **görmez**. Yeniden beslemek için
`openclaw sandbox recreate` kullanın.

### Mod seçimi

|                          | `mirror`                    | `remote`                  |
| ------------------------ | --------------------------- | ------------------------- |
| **Kanonik çalışma alanı**| Yerel ana makine            | Uzak OpenShell            |
| **Eşzamanlama yönü**     | Çift yönlü (her `exec`)     | Tek seferlik besleme      |
| **Dönüş başına yük**     | Daha yüksek (yükle + indir) | Daha düşük (doğrudan uzak işlemler) |
| **Yerel düzenlemeler görünür mü?** | Evet, sonraki `exec`te | Hayır, yeniden oluşturulana kadar |
| **En uygun kullanım**    | Geliştirme iş akışları      | Uzun ömürlü ajanlar, CI   |

## Yapılandırma başvurusu

Tüm OpenShell yapılandırması `plugins.entries.openshell.config` altında bulunur:

| Anahtar                   | Tür                      | Varsayılan    | Açıklama                                             |
| ------------------------- | ------------------------ | ------------- | ---------------------------------------------------- |
| `mode`                    | `"mirror"` veya `"remote"` | `"mirror"`  | Çalışma alanı eşzamanlama modu                       |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI'nin yolu veya adı                    |
| `from`                    | `string`                 | `"openclaw"`  | İlk oluşturma için sandbox kaynağı                   |
| `gateway`                 | `string`                 | —             | OpenShell Gateway adı (`--gateway`)                  |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell Gateway uç nokta URL'si (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | Sandbox oluşturma için OpenShell politika kimliği    |
| `providers`               | `string[]`               | `[]`          | Sandbox oluşturulduğunda eklenecek sağlayıcı adları  |
| `gpu`                     | `boolean`                | `false`       | GPU kaynağı iste                                     |
| `autoProviders`           | `boolean`                | `true`        | Sandbox oluştururken `--auto-providers` geçir        |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Sandbox içindeki birincil yazılabilir çalışma alanı  |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Ajan çalışma alanı bağlama yolu (salt okunur erişim için) |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI işlemleri için zaman aşımı           |

Sandbox düzeyi ayarlar (`mode`, `scope`, `workspaceAccess`) diğer tüm arka uçlarda olduğu gibi
`agents.defaults.sandbox` altında yapılandırılır. Tam matris için
[Sandboxing](/tr/gateway/sandboxing) bölümüne bakın.

## Örnekler

### Asgari remote kurulumu

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### GPU ile mirror modu

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
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
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### Özel Gateway ile ajan başına OpenShell

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Yaşam döngüsü yönetimi

OpenShell sandbox'ları normal sandbox CLI ile yönetilir:

```bash
# Tüm sandbox çalışma zamanlarını listele (Docker + OpenShell)
openclaw sandbox list

# Etkin politikayı incele
openclaw sandbox explain

# Yeniden oluştur (uzak çalışma alanını siler, sonraki kullanımda yeniden besler)
openclaw sandbox recreate --all
```

`remote` modu için **recreate özellikle önemlidir**: o kapsam için kanonik
uzak çalışma alanını siler. Sonraki kullanımda yerel çalışma alanından
yeni bir uzak çalışma alanı beslenir.

`mirror` modunda recreate, esas olarak uzak yürütme ortamını sıfırlar; çünkü
yerel çalışma alanı kanonik kalır.

### Ne zaman recreate yapılmalı

Şunlardan herhangi birini değiştirdikten sonra recreate yapın:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Güvenlik sıkılaştırması

OpenShell, çalışma alanı kök fd'sini pinler ve her
okumadan önce sandbox kimliğini yeniden denetler; böylece sembolik bağlantı değişimleri veya yeniden bağlanmış çalışma alanı
okumaları amaçlanan uzak çalışma alanının dışına yönlendiremez.

## Geçerli sınırlamalar

- Sandbox browser, OpenShell arka ucunda desteklenmez.
- `sandbox.docker.binds`, OpenShell için geçerli değildir.
- `sandbox.docker.*` altındaki Docker'a özgü çalışma zamanı ayarları yalnızca Docker
  arka ucuna uygulanır.

## Nasıl çalışır

1. OpenClaw, yapılandırıldığı şekilde `openshell sandbox create` çağırır (`--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` bayraklarıyla).
2. OpenClaw, sandbox için SSH bağlantı
   ayrıntılarını almak üzere `openshell sandbox ssh-config <name>` çağırır.
3. Çekirdek, SSH yapılandırmasını geçici bir dosyaya yazar ve
   genel SSH arka ucuyla aynı uzak dosya sistemi köprüsünü kullanarak bir SSH oturumu açar.
4. `mirror` modunda: `exec` öncesi yerelden uzağa eşzamanla, çalıştır, `exec` sonrası geri eşzamanla.
5. `remote` modunda: oluşturulurken bir kez besle, ardından doğrudan uzak
   çalışma alanında çalış.

## İlgili

- [Sandboxing](/tr/gateway/sandboxing) -- modlar, kapsamlar ve arka uç karşılaştırması
- [Sandbox ve Araç Politikası ve Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) -- engellenen araçlarda hata ayıklama
- [Çok Ajanlı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) -- ajan başına geçersiz kılmalar
- [Sandbox CLI](/tr/cli/sandbox) -- `openclaw sandbox` komutları
