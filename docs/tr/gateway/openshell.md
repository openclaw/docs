---
read_when:
    - Yerel Docker yerine bulut tarafından yönetilen korumalı alanlar istiyorsunuz
    - OpenShell Plugin'ini ayarlıyorsunuz
    - Yansıtma ve uzak çalışma alanı modları arasında seçim yapmanız gerekir
summary: OpenClaw ajanları için yönetilen korumalı alan arka ucu olarak OpenShell’i kullanın
title: OpenShell
x-i18n:
    generated_at: "2026-04-30T09:23:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 694a0a145802f4b624af01b58cbb5886bab7426fb9a90f216480141082089144
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell, OpenClaw için yönetilen bir sandbox arka ucudur. Docker
container'larını yerelde çalıştırmak yerine OpenClaw, sandbox yaşam döngüsünü
SSH tabanlı komut yürütme ile uzak ortamlar sağlayan `openshell` CLI'ına devreder.

OpenShell Plugin'i, genel [SSH arka ucu](/tr/gateway/sandboxing#ssh-backend) ile
aynı çekirdek SSH taşımasını ve uzak dosya sistemi köprüsünü yeniden kullanır. Buna
OpenShell'e özgü yaşam döngüsü (`sandbox create/get/delete`, `sandbox ssh-config`)
ve isteğe bağlı bir `mirror` çalışma alanı modu ekler.

## Ön koşullar

- `openshell` CLI'ının kurulu ve `PATH` üzerinde olması (veya
  `plugins.entries.openshell.config.command` ile özel bir yol ayarlayın)
- Sandbox erişimi olan bir OpenShell hesabı
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

2. Gateway'i yeniden başlatın. Bir sonraki agent turunda OpenClaw bir OpenShell
   sandbox'ı oluşturur ve araç yürütmesini bunun üzerinden yönlendirir.

3. Doğrulayın:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Çalışma alanı modları

OpenShell kullanırken en önemli karar budur.

### `mirror`

**Yerel çalışma alanının kanonik kalmasını** istediğinizde `plugins.entries.openshell.config.mode: "mirror"` kullanın.

Davranış:

- `exec` öncesinde OpenClaw, yerel çalışma alanını OpenShell sandbox'ına eşitler.
- `exec` sonrasında OpenClaw, uzak çalışma alanını yerel çalışma alanına geri eşitler.
- Dosya araçları yine sandbox köprüsü üzerinden çalışır, ancak yerel çalışma alanı
  turlar arasında doğruluk kaynağı olarak kalır.

En uygun olduğu durumlar:

- Dosyaları OpenClaw dışında yerelde düzenliyorsunuz ve bu değişikliklerin
  sandbox içinde otomatik olarak görünmesini istiyorsunuz.
- OpenShell sandbox'ının mümkün olduğunca Docker arka ucu gibi davranmasını istiyorsunuz.
- Ana makine çalışma alanının her exec turundan sonra sandbox yazmalarını yansıtmasını istiyorsunuz.

Ödün: Her exec öncesinde ve sonrasında ek eşitleme maliyeti.

### `remote`

**OpenShell çalışma alanının kanonik olmasını** istediğinizde
`plugins.entries.openshell.config.mode: "remote"` kullanın.

Davranış:

- Sandbox ilk oluşturulduğunda OpenClaw, uzak çalışma alanını yerel çalışma alanından
  bir kez başlangıç verisiyle doldurur.
- Bundan sonra `exec`, `read`, `write`, `edit` ve `apply_patch` doğrudan uzak
  OpenShell çalışma alanına karşı çalışır.
- OpenClaw, uzak değişiklikleri yerel çalışma alanına geri eşitlemez.
- Prompt sırasında medya okumaları çalışmaya devam eder, çünkü dosya ve medya araçları
  sandbox köprüsü üzerinden okur.

En uygun olduğu durumlar:

- Sandbox esas olarak uzak tarafta yaşamalıdır.
- Tur başına eşitleme yükünün daha düşük olmasını istiyorsunuz.
- Ana makinedeki yerel düzenlemelerin uzak sandbox durumunun sessizce üzerine yazmasını istemiyorsunuz.

<Warning>
İlk başlangıç verisinden sonra OpenClaw dışında ana makinede dosya düzenlerseniz, uzak sandbox bu değişiklikleri **görmez**. Yeniden başlangıç verisi vermek için `openclaw sandbox recreate` kullanın.
</Warning>

### Mod seçimi

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Kanonik çalışma alanı** | Yerel ana makine           | Uzak OpenShell            |
| **Eşitleme yönü**        | Çift yönlü (her exec)      | Tek seferlik başlangıç verisi |
| **Tur başına yük**       | Daha yüksek (yükleme + indirme) | Daha düşük (doğrudan uzak işlemler) |
| **Yerel düzenlemeler görünür mü?** | Evet, sonraki exec'te | Hayır, yeniden oluşturmaya kadar |
| **En uygun olduğu durum** | Geliştirme iş akışları     | Uzun süre çalışan agent'lar, CI |

## Yapılandırma referansı

Tüm OpenShell yapılandırması `plugins.entries.openshell.config` altında bulunur:

| Anahtar                  | Tür                      | Varsayılan    | Açıklama                                              |
| ------------------------ | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                   | `"mirror"` veya `"remote"` | `"mirror"`  | Çalışma alanı eşitleme modu                           |
| `command`                | `string`                 | `"openshell"` | `openshell` CLI yolu veya adı                         |
| `from`                   | `string`                 | `"openclaw"`  | İlk kez oluşturma için korumalı alan kaynağı          |
| `gateway`                | `string`                 | —             | OpenShell gateway adı (`--gateway`)                   |
| `gatewayEndpoint`        | `string`                 | —             | OpenShell gateway uç noktası URL'si (`--gateway-endpoint`) |
| `policy`                 | `string`                 | —             | Korumalı alan oluşturma için OpenShell ilke kimliği   |
| `providers`              | `string[]`               | `[]`          | Korumalı alan oluşturulduğunda eklenecek sağlayıcı adları |
| `gpu`                    | `boolean`                | `false`       | GPU kaynakları iste                                  |
| `autoProviders`          | `boolean`                | `true`        | Korumalı alan oluşturma sırasında `--auto-providers` ilet |
| `remoteWorkspaceDir`     | `string`                 | `"/sandbox"`  | Korumalı alan içindeki birincil yazılabilir çalışma alanı |
| `remoteAgentWorkspaceDir` | `string`                | `"/agent"`    | Aracı çalışma alanı bağlama yolu (salt okunur erişim için) |
| `timeoutSeconds`         | `number`                 | `120`         | `openshell` CLI işlemleri için zaman aşımı            |

Korumalı alan düzeyindeki ayarlar (`mode`, `scope`, `workspaceAccess`), diğer tüm arka uçlarda olduğu gibi
`agents.defaults.sandbox` altında yapılandırılır. Tam matris için
[Korumalı alan kullanımı](/tr/gateway/sandboxing) bölümüne bakın.

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

### GPU ile yansıtma modu

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

### Özel gateway ile aracı başına OpenShell

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

OpenShell korumalı alanları normal korumalı alan CLI üzerinden yönetilir:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

`remote` modu için **yeniden oluşturma özellikle önemlidir**: ilgili kapsamın kanonik
uzak çalışma alanını siler. Sonraki kullanım, yerel çalışma alanından yeni bir uzak çalışma alanı
tohumlar.

`mirror` modu için yeniden oluşturma, yerel çalışma alanı kanonik kaldığından temel olarak
uzak yürütme ortamını sıfırlar.

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

OpenShell, çalışma alanı kök fd'sini sabitler ve her okumadan önce korumalı alan kimliğini yeniden denetler;
bu nedenle sembolik bağlantı değişimleri veya yeniden bağlanmış bir çalışma alanı, okumaları amaçlanan
uzak çalışma alanının dışına yönlendiremez.

## Geçerli sınırlamalar

- OpenShell arka ucunda korumalı alan tarayıcısı desteklenmez.
- `sandbox.docker.binds`, OpenShell için geçerli değildir.
- `sandbox.docker.*` altındaki Docker'a özgü çalışma zamanı ayarları yalnızca Docker
  arka ucu için geçerlidir.

## Nasıl çalışır

1. OpenClaw, yapılandırıldığı şekilde (`--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` bayraklarıyla) `openshell sandbox create` çağırır.
2. OpenClaw, korumalı alan için SSH bağlantı ayrıntılarını almak üzere `openshell sandbox ssh-config <name>` çağırır.
3. Çekirdek, SSH yapılandırmasını geçici bir dosyaya yazar ve genel SSH arka ucuyla aynı
   uzak dosya sistemi köprüsünü kullanarak bir SSH oturumu açar.
4. `mirror` modunda: yürütmeden önce yerelden uzağa eşitle, çalıştır, yürütmeden sonra geri eşitle.
5. `remote` modunda: oluşturma sırasında bir kez tohumla, ardından doğrudan uzak
   çalışma alanında çalış.

## İlgili

- [Korumalı alan kullanımı](/tr/gateway/sandboxing) -- modlar, kapsamlar ve arka uç karşılaştırması
- [Korumalı Alan ve Araç İlkesi ve Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) -- engellenen araçlarda hata ayıklama
- [Çok Aracılı Korumalı Alan ve Araçlar](/tr/tools/multi-agent-sandbox-tools) -- aracı başına geçersiz kılmalar
- [Korumalı Alan CLI](/tr/cli/sandbox) -- `openclaw sandbox` komutları
