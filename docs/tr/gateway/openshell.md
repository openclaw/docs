---
read_when:
    - Yerel Docker yerine bulut tarafından yönetilen sandbox'lar istiyorsunuz
    - OpenShell Plugin’ini kuruyorsunuz
    - Ayna ve uzak çalışma alanı modları arasında seçim yapmanız gerekir
summary: OpenShell'i OpenClaw ajanları için yönetilen bir sandbox arka ucu olarak kullanın
title: OpenShell
x-i18n:
    generated_at: "2026-06-28T00:37:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278f7550a3178c30a1b42f80495c55bb9827f7785ce9c4d1ee4a57adb3a5e4b
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell, OpenClaw için yönetilen bir sandbox arka ucudur. OpenClaw, Docker
kapsayıcılarını yerelde çalıştırmak yerine sandbox yaşam döngüsünü SSH tabanlı
komut yürütme ile uzak ortamlar sağlayan `openshell` CLI'ına devreder.

OpenShell Plugin'i, genel [SSH arka ucu](/tr/gateway/sandboxing#ssh-backend) ile aynı
çekirdek SSH aktarımını ve uzak dosya sistemi köprüsünü yeniden kullanır.
OpenShell'e özgü yaşam döngüsü (`sandbox create/get/delete`, `sandbox ssh-config`)
ve isteğe bağlı bir `mirror` çalışma alanı modu ekler.

## Önkoşullar

- OpenShell Plugin'i kurulu (`openclaw plugins install @openclaw/openshell-sandbox`)
- `openshell` CLI'ı kurulu ve `PATH` üzerinde (veya
  `plugins.entries.openshell.config.command` ile özel bir yol ayarlayın)
- Sandbox erişimi olan bir OpenShell hesabı
- Ana makinede çalışan OpenClaw Gateway

## Hızlı başlangıç

1. Plugin'i kurup etkinleştirin, ardından sandbox arka ucunu ayarlayın:

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

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

2. Gateway'i yeniden başlatın. Sonraki ajan turunda OpenClaw bir OpenShell
   sandbox'ı oluşturur ve araç yürütmeyi bunun üzerinden yönlendirir.

3. Doğrulayın:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Çalışma alanı modları

OpenShell kullanırken en önemli karar budur.

### `mirror`

**Yerel çalışma alanının esas kaynak olarak kalmasını** istediğinizde
`plugins.entries.openshell.config.mode: "mirror"` kullanın.

Davranış:

- `exec` öncesinde OpenClaw yerel çalışma alanını OpenShell sandbox'ına eşitler.
- `exec` sonrasında OpenClaw uzak çalışma alanını yerel çalışma alanına geri eşitler.
- Dosya araçları yine sandbox köprüsü üzerinden çalışır, ancak yerel çalışma alanı
  turlar arasında doğruluk kaynağı olarak kalır.

En uygun olduğu durumlar:

- Dosyaları OpenClaw dışında yerelde düzenliyorsunuz ve bu değişikliklerin
  sandbox'ta otomatik olarak görünmesini istiyorsunuz.
- OpenShell sandbox'ının mümkün olduğunca Docker arka ucu gibi davranmasını istiyorsunuz.
- Ana makine çalışma alanının her exec turundan sonra sandbox yazmalarını yansıtmasını istiyorsunuz.

Ödün: her exec öncesinde ve sonrasında ek eşitleme maliyeti.

### `remote`

**OpenShell çalışma alanının esas kaynak olmasını** istediğinizde
`plugins.entries.openshell.config.mode: "remote"` kullanın.

Davranış:

- Sandbox ilk kez oluşturulduğunda OpenClaw uzak çalışma alanını yerel çalışma
  alanından bir kez başlatır.
- Bundan sonra `exec`, `read`, `write`, `edit` ve `apply_patch` doğrudan uzak
  OpenShell çalışma alanına karşı çalışır.
- OpenClaw uzak değişiklikleri yerel çalışma alanına geri eşitlemez.
- Komut istemi zamanındaki medya okumaları yine çalışır, çünkü dosya ve medya
  araçları sandbox köprüsü üzerinden okur.

En uygun olduğu durumlar:

- Sandbox öncelikle uzak tarafta yaşamalıdır.
- Tur başına eşitleme ek yükünün daha düşük olmasını istiyorsunuz.
- Ana makine yerelindeki düzenlemelerin uzak sandbox durumunu sessizce ezmesini istemiyorsunuz.

<Warning>
İlk başlatmadan sonra ana makinede OpenClaw dışında dosyaları düzenlerseniz, uzak sandbox bu değişiklikleri **görmez**. Yeniden başlatmak için `openclaw sandbox recreate` kullanın.
</Warning>

### Mod seçimi

|                          | `mirror`                         | `remote`                      |
| ------------------------ | -------------------------------- | ----------------------------- |
| **Esas çalışma alanı**   | Yerel ana makine                 | Uzak OpenShell                |
| **Eşitleme yönü**        | Çift yönlü (her exec)            | Bir kerelik başlatma          |
| **Tur başına ek yük**    | Daha yüksek (yükleme + indirme)  | Daha düşük (doğrudan uzak işlemler) |
| **Yerel düzenlemeler görünür mü?** | Evet, sonraki exec'te   | Hayır, yeniden oluşturulana kadar |
| **En uygun olduğu durum** | Geliştirme iş akışları          | Uzun süre çalışan ajanlar, CI |

## Yapılandırma başvurusu

Tüm OpenShell yapılandırması `plugins.entries.openshell.config` altında bulunur:

| Anahtar                  | Tür                      | Varsayılan    | Açıklama                                             |
| ------------------------ | ------------------------ | ------------- | ---------------------------------------------------- |
| `mode`                   | `"mirror"` veya `"remote"` | `"mirror"`  | Çalışma alanı eşitleme modu                          |
| `command`                | `string`                 | `"openshell"` | `openshell` CLI'ının yolu veya adı                   |
| `from`                   | `string`                 | `"openclaw"`  | İlk oluşturma için sandbox kaynağı                   |
| `gateway`                | `string`                 | —             | OpenShell gateway adı (`--gateway`)                  |
| `gatewayEndpoint`        | `string`                 | —             | OpenShell gateway uç nokta URL'si (`--gateway-endpoint`) |
| `policy`                 | `string`                 | —             | Sandbox oluşturma için OpenShell politika kimliği    |
| `providers`              | `string[]`               | `[]`          | Sandbox oluşturulduğunda eklenecek sağlayıcı adları  |
| `gpu`                    | `boolean`                | `false`       | GPU kaynakları iste                                  |
| `autoProviders`          | `boolean`                | `true`        | Sandbox oluşturma sırasında `--auto-providers` geçir |
| `remoteWorkspaceDir`     | `string`                 | `"/sandbox"`  | Sandbox içindeki birincil yazılabilir çalışma alanı  |
| `remoteAgentWorkspaceDir` | `string`                | `"/agent"`    | Ajan çalışma alanı bağlama yolu (salt okunur erişim için) |
| `timeoutSeconds`         | `number`                 | `120`         | `openshell` CLI işlemleri için zaman aşımı           |

Sandbox düzeyi ayarlar (`mode`, `scope`, `workspaceAccess`) diğer arka uçlarda
olduğu gibi `agents.defaults.sandbox` altında yapılandırılır. Tam matris için
[Sandboxlama](/tr/gateway/sandboxing) bölümüne bakın.

## Örnekler

### Minimal uzak kurulum

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

### Özel gateway ile ajan başına OpenShell

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

OpenShell sandbox'ları normal sandbox CLI'ı üzerinden yönetilir:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

`remote` modu için **yeniden oluşturma özellikle önemlidir**: bu kapsamın esas
uzak çalışma alanını siler. Sonraki kullanım, yerel çalışma alanından yeni bir
uzak çalışma alanı başlatır.

`mirror` modu için yeniden oluşturma çoğunlukla uzak yürütme ortamını sıfırlar,
çünkü yerel çalışma alanı esas kaynak olarak kalır.

### Ne zaman yeniden oluşturmalı

Bunlardan herhangi birini değiştirdikten sonra yeniden oluşturun:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Güvenlik sertleştirme

OpenShell çalışma alanı kök fd'sini sabitler ve her okumadan önce sandbox
kimliğini yeniden denetler; böylece sembolik bağlantı değişimleri veya yeniden
bağlanmış bir çalışma alanı okumaları hedeflenen uzak çalışma alanının dışına
yönlendiremez.

## Mevcut sınırlamalar

- Sandbox tarayıcısı OpenShell arka ucunda desteklenmez.
- `sandbox.docker.binds` OpenShell için geçerli değildir.
- `sandbox.docker.*` altındaki Docker'a özgü çalışma zamanı ayarları yalnızca
  Docker arka ucu için geçerlidir.

## Nasıl çalışır

1. OpenClaw `openshell sandbox create` çağırır (yapılandırıldığı şekilde `--from`,
   `--gateway`, `--policy`, `--providers`, `--gpu` bayraklarıyla).
2. OpenClaw sandbox için SSH bağlantı ayrıntılarını almak üzere
   `openshell sandbox ssh-config <name>` çağırır.
3. Çekirdek, SSH yapılandırmasını geçici bir dosyaya yazar ve genel SSH arka
   ucuyla aynı uzak dosya sistemi köprüsünü kullanarak bir SSH oturumu açar.
4. `mirror` modunda: exec öncesi yerelden uzağa eşitle, çalıştır, exec sonrası geri eşitle.
5. `remote` modunda: oluşturma sırasında bir kez başlat, ardından doğrudan uzak
   çalışma alanı üzerinde çalış.

## İlgili

- [Sandboxlama](/tr/gateway/sandboxing) -- modlar, kapsamlar ve arka uç karşılaştırması
- [Sandbox ile Araç Politikası ile Elevated Karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) -- engellenen araçlarda hata ayıklama
- [Çok Ajanlı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) -- ajan başına geçersiz kılmalar
- [Sandbox CLI](/tr/cli/sandbox) -- `openclaw sandbox` komutları
