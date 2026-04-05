---
read_when:
    - Yerel Docker yerine bulut tarafından yönetilen sandbox'lar istiyorsunuz
    - OpenShell eklentisini ayarlıyorsunuz
    - Mirror ve remote çalışma alanı modları arasında seçim yapmanız gerekiyor
summary: OpenClaw aracıları için yönetilen sandbox arka ucu olarak OpenShell kullanın
title: OpenShell
x-i18n:
    generated_at: "2026-04-05T13:53:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: aaf9027d0632a70fb86455f8bc46dc908ff766db0eb0cdf2f7df39c715241ead
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell, OpenClaw için yönetilen bir sandbox arka ucudur. Docker
container'larını yerelde çalıştırmak yerine OpenClaw, sandbox yaşam döngüsünü `openshell` CLI'a devreder;
bu CLI, SSH tabanlı komut yürütme ile uzak ortamlar sağlar.

OpenShell eklentisi, genel [SSH backend](/gateway/sandboxing#ssh-backend) ile aynı çekirdek SSH taşımasını ve uzak dosya sistemi
köprüsünü yeniden kullanır. Buna
OpenShell'e özgü yaşam döngüsünü (`sandbox create/get/delete`, `sandbox ssh-config`)
ve isteğe bağlı bir `mirror` çalışma alanı modunu ekler.

## Önkoşullar

- `openshell` CLI kurulu olmalı ve `PATH` üzerinde bulunmalı (veya
  `plugins.entries.openshell.config.command` üzerinden özel bir yol ayarlayın)
- Sandbox erişimi olan bir OpenShell hesabı
- Ana bilgisayarda çalışan OpenClaw Gateway

## Hızlı başlangıç

1. Eklentiyi etkinleştirin ve sandbox arka ucunu ayarlayın:

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

2. Gateway'i yeniden başlatın. Bir sonraki aracı dönüşünde OpenClaw bir OpenShell
   sandbox'ı oluşturur ve araç yürütmeyi bunun üzerinden yönlendirir.

3. Doğrulayın:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Çalışma alanı modları

OpenShell kullanırken en önemli karar budur.

### `mirror`

**Yerel
çalışma alanının canonical olarak kalmasını** istiyorsanız `plugins.entries.openshell.config.mode: "mirror"` kullanın.

Davranış:

- `exec` öncesinde OpenClaw yerel çalışma alanını OpenShell sandbox'ına eşitler.
- `exec` sonrasında OpenClaw uzak çalışma alanını yeniden yerel çalışma alanına eşitler.
- Dosya araçları yine sandbox köprüsü üzerinden çalışır, ancak yerel çalışma alanı
  dönüşler arasında doğruluk kaynağı olarak kalır.

Şunlar için en uygunudur:

- Dosyaları OpenClaw dışında yerelde düzenliyorsunuz ve bu değişikliklerin
  sandbox içinde otomatik olarak görünmesini istiyorsunuz.
- OpenShell sandbox'ının Docker arka ucu gibi olabildiğince
  davranmasını istiyorsunuz.
- Her `exec` dönüşünden sonra ana bilgisayar çalışma alanının sandbox yazımlarını yansıtmasını istiyorsunuz.

Bedel: her `exec` öncesi ve sonrası ek eşitleme maliyeti.

### `remote`

**OpenShell çalışma alanının canonical hale gelmesini**
istiyorsanız `plugins.entries.openshell.config.mode: "remote"` kullanın.

Davranış:

- Sandbox ilk oluşturulduğunda OpenClaw uzak çalışma alanını
  yerel çalışma alanından bir kez tohumlar.
- Bundan sonra `exec`, `read`, `write`, `edit` ve `apply_patch`
  doğrudan uzak OpenShell çalışma alanına karşı çalışır.
- OpenClaw uzak değişiklikleri **yerel çalışma alanına geri eşitlemez**.
- Dosya ve medya araçları sandbox köprüsü üzerinden okuduğu için prompt zamanı medya okumaları yine çalışır.

Şunlar için en uygunudur:

- Sandbox'ın esas olarak uzak tarafta yaşaması gerekiyorsa.
- Dönüş başına daha düşük eşitleme yükü istiyorsanız.
- Ana bilgisayardaki yerel düzenlemelerin uzak sandbox durumunun üzerine sessizce yazmasını istemiyorsanız.

Önemli: İlk tohumlamadan sonra dosyaları OpenClaw dışında ana bilgisayarda düzenlerseniz,
uzak sandbox bu değişiklikleri **görmez**. Yeniden tohumlamak için
`openclaw sandbox recreate` kullanın.

### Mod seçimi

|                          | `mirror`                    | `remote`                 |
| ------------------------ | --------------------------- | ------------------------ |
| **Canonical çalışma alanı** | Yerel ana bilgisayar        | Uzak OpenShell           |
| **Eşitleme yönü**        | Çift yönlü (her exec)       | Tek seferlik tohumlama   |
| **Dönüş başına yük**     | Daha yüksek (yükleme + indirme) | Daha düşük (doğrudan uzak işlemler) |
| **Yerel düzenlemeler görünür mü?** | Evet, sonraki exec'te      | Hayır, recreate'e kadar  |
| **En uygun olduğu yer**  | Geliştirme iş akışları      | Uzun süre çalışan aracılar, CI |

## Yapılandırma başvurusu

Tüm OpenShell yapılandırması `plugins.entries.openshell.config` altında bulunur:

| Anahtar                   | Tür                      | Varsayılan    | Açıklama                                             |
| ------------------------- | ------------------------ | ------------- | ---------------------------------------------------- |
| `mode`                    | `"mirror"` veya `"remote"` | `"mirror"`    | Çalışma alanı eşitleme modu                          |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI'ın yolu veya adı                     |
| `from`                    | `string`                 | `"openclaw"`  | İlk oluşturma için sandbox kaynağı                   |
| `gateway`                 | `string`                 | —             | OpenShell gateway adı (`--gateway`)                  |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell gateway uç nokta URL'si (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | Sandbox oluşturma için OpenShell policy ID'si        |
| `providers`               | `string[]`               | `[]`          | Sandbox oluşturulduğunda eklenecek sağlayıcı adları  |
| `gpu`                     | `boolean`                | `false`       | GPU kaynakları iste                                  |
| `autoProviders`           | `boolean`                | `true`        | Sandbox oluşturma sırasında `--auto-providers` geç   |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Sandbox içindeki birincil yazılabilir çalışma alanı  |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Aracı çalışma alanı bağlama yolu (salt okunur erişim için) |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI işlemleri için zaman aşımı           |

Sandbox düzeyindeki ayarlar (`mode`, `scope`, `workspaceAccess`), diğer tüm arka uçlarda olduğu gibi
`agents.defaults.sandbox` altında yapılandırılır. Tam matris için bkz.
[Sandboxing](/gateway/sandboxing).

## Örnekler

### Minimal remote kurulumu

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

OpenShell sandbox'ları normal sandbox CLI üzerinden yönetilir:

```bash
# Tüm sandbox çalışma zamanlarını listele (Docker + OpenShell)
openclaw sandbox list

# Etkin policy'yi incele
openclaw sandbox explain

# Yeniden oluştur (uzak çalışma alanını siler, sonraki kullanımda yeniden tohumlar)
openclaw sandbox recreate --all
```

`remote` modu için **recreate özellikle önemlidir**: bu işlem o kapsam için canonical
uzak çalışma alanını siler. Sonraki kullanım, yerel çalışma alanından
yeni bir uzak çalışma alanı tohumlar.

`mirror` modu için recreate esas olarak uzak yürütme ortamını sıfırlar; çünkü
yerel çalışma alanı canonical kalır.

### Ne zaman recreate yapılmalı

Şunlardan herhangi birini değiştirdikten sonra recreate yapın:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Geçerli sınırlamalar

- Sandbox tarayıcısı OpenShell arka ucunda desteklenmez.
- `sandbox.docker.binds`, OpenShell için geçerli değildir.
- `sandbox.docker.*` altındaki Docker'a özgü çalışma zamanı düğmeleri yalnızca Docker
  arka ucuna uygulanır.

## Nasıl çalışır

1. OpenClaw, yapılandırıldığı gibi `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` bayraklarıyla `openshell sandbox create` çağırır.
2. OpenClaw, sandbox için SSH bağlantı
   ayrıntılarını almak üzere `openshell sandbox ssh-config <name>` çağırır.
3. Çekirdek, SSH yapılandırmasını geçici bir dosyaya yazar ve genel SSH arka ucuyla aynı uzak dosya sistemi köprüsünü kullanarak bir SSH oturumu açar.
4. `mirror` modunda: `exec` öncesi yerelden uzağa eşitle, çalıştır, `exec` sonrası geri eşitle.
5. `remote` modunda: oluşturma sırasında bir kez tohumla, sonra doğrudan uzak
   çalışma alanında çalış.

## Ayrıca bkz.

- [Sandboxing](/gateway/sandboxing) -- modlar, kapsamlar ve arka uç karşılaştırması
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- engellenen araçlarda hata ayıklama
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- aracı başına geçersiz kılmalar
- [Sandbox CLI](/cli/sandbox) -- `openclaw sandbox` komutları
