---
read_when:
    - Yerel Docker yerine bulut tarafından yönetilen korumalı alanlar istiyorsunuz
    - OpenShell Pluginini kuruyorsunuz
    - Yansıtma ve uzak çalışma alanı modları arasında seçim yapmanız gerekir
summary: OpenClaw ajanları için yönetilen korumalı alan arka ucu olarak OpenShell kullanın
title: OpenShell
x-i18n:
    generated_at: "2026-07-12T12:20:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell, yönetilen bir korumalı alan arka ucudur: OpenClaw, Docker kapsayıcılarını
yerel olarak çalıştırmak yerine korumalı alan yaşam döngüsünü uzak ortamlar
hazırlayan ve komutları SSH üzerinden çalıştıran `openshell` CLI'ye devreder.

Plugin, genel [SSH arka ucuyla](/tr/gateway/sandboxing#ssh-backend) aynı SSH aktarımını
ve uzak dosya sistemi köprüsünü yeniden kullanır; ayrıca OpenShell yaşam döngüsünü
(`sandbox create/get/delete/ssh-config`) ve isteğe bağlı `mirror` çalışma alanı
eşitleme modunu ekler.

## Ön koşullar

- OpenShell Plugin'inin yüklü olması (`openclaw plugins install @openclaw/openshell-sandbox`)
- `PATH` üzerinde `openshell` CLI (veya
  `plugins.entries.openshell.config.command` aracılığıyla özel bir yol)
- Korumalı alan erişimi olan bir OpenShell hesabı
- Ana makinede çalışan OpenClaw Gateway

## Hızlı başlangıç

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

Gateway'i yeniden başlatın. Bir sonraki aracı turunda OpenClaw bir OpenShell
korumalı alanı oluşturur ve araç yürütmeyi bunun üzerinden yönlendirir. Şunlarla
doğrulayın:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Çalışma alanı modları

Bu, OpenShell için en önemli karardır.

### mirror (varsayılan)

`plugins.entries.openshell.config.mode: "mirror"`, **yerel çalışma alanını
kanonik** tutar:

- OpenClaw, `exec` öncesinde yerel çalışma alanını korumalı alanla eşitler.
- OpenClaw, `exec` sonrasında uzak çalışma alanını yeniden yerel ortama eşitler.
- Dosya araçları korumalı alan köprüsünden geçer ancak turlar arasında doğruluk
  kaynağı yerel ortam olmaya devam eder.

Geliştirme iş akışları için en uygunudur: OpenClaw dışında yapılan yerel
düzenlemeler bir sonraki yürütmede görünür ve korumalı alan Docker arka ucuna
benzer şekilde davranır.

Ödünleşim: Her yürütme turunda yükleme ve indirme maliyeti oluşur.

### remote

`mode: "remote"`, **OpenShell çalışma alanını kanonik** hâle getirir:

- İlk korumalı alan oluşturulduğunda OpenClaw, uzak çalışma alanını yerel
  ortamdan bir kez başlangıç verileriyle doldurur.
- Bundan sonra `exec`, `read`, `write`, `edit` ve `apply_patch` doğrudan uzak
  çalışma alanında işlem yapar. OpenClaw, uzak değişiklikleri yerel ortama
  **eşitlemez**.
- İstem sırasında medya okumaları çalışmaya devam eder (dosya/medya araçları
  korumalı alan köprüsü üzerinden okur).

Uzun süre çalışan aracılar ve CI için en uygunudur: Tur başına ek yük daha
düşüktür ve ana makinedeki yerel düzenlemeler uzak durumun sessizce üzerine
yazamaz.

<Warning>
İlk başlangıç verileri aktarıldıktan sonra ana makinede OpenClaw dışında düzenlenen dosyalar uzak korumalı alanda görünmez. Başlangıç verilerini yeniden aktarmak için `openclaw sandbox recreate` komutunu çalıştırın.
</Warning>

### Mod seçimi

|                            | `mirror`                         | `remote`                         |
| -------------------------- | -------------------------------- | -------------------------------- |
| **Kanonik çalışma alanı**  | Yerel ana makine                 | Uzak OpenShell                   |
| **Eşitleme yönü**          | Çift yönlü (her yürütmede)       | Tek seferlik başlangıç aktarımı  |
| **Tur başına ek yük**      | Daha yüksek (yükleme + indirme)  | Daha düşük (doğrudan uzak işlem) |
| **Yerel düzenlemeler görünür mü?** | Evet, sonraki yürütmede | Hayır, yeniden oluşturulana kadar |
| **En uygun kullanım**      | Geliştirme iş akışları           | Uzun süre çalışan aracılar, CI   |

## Yapılandırma başvurusu

Tüm OpenShell yapılandırması `plugins.entries.openshell.config` altında bulunur:

| Anahtar                   | Tür                      | Varsayılan    | Açıklama                                                                                          |
| ------------------------- | ------------------------ | ------------- | ------------------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` veya `"remote"` | `"mirror"`  | Çalışma alanı eşitleme modu                                                                       |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI'nin yolu veya adı                                                                 |
| `from`                    | `string`                 | `"openclaw"`  | İlk oluşturma için korumalı alan kaynağı                                                          |
| `gateway`                 | `string`                 | ayarlanmamış  | OpenShell Gateway adı (üst düzey `--gateway`)                                                     |
| `gatewayEndpoint`         | `string`                 | ayarlanmamış  | OpenShell Gateway uç noktası (üst düzey `--gateway-endpoint`)                                     |
| `policy`                  | `string`                 | ayarlanmamış  | Korumalı alan oluşturma için OpenShell politika kimliği                                           |
| `providers`               | `string[]`               | `[]`          | Korumalı alan oluşturulurken bağlanan sağlayıcı adları (yinelenenler kaldırılır, girdi başına bir `--provider` bayrağı) |
| `gpu`                     | `boolean`                | `false`       | GPU kaynakları iste (`--gpu`)                                                                     |
| `autoProviders`           | `boolean`                | `true`        | Oluşturma sırasında `--auto-providers` (veya false olduğunda `--no-auto-providers`) geçir          |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Korumalı alan içindeki birincil yazılabilir çalışma alanı                                         |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Aracı çalışma alanının bağlama yolu (çalışma alanı erişimi `rw` değilse salt okunur)               |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI işlemleri için zaman aşımı                                                        |

`remoteWorkspaceDir` ve `remoteAgentWorkspaceDir` mutlak yollar olmalı ve
yönetilen `/sandbox` veya `/agent` kökleri altında kalmalıdır; diğer mutlak
yollar reddedilir.

Korumalı alan düzeyindeki ayarlar (`mode`, `scope`, `workspaceAccess`), diğer
arka uçlarda olduğu gibi `agents.defaults.sandbox` altında bulunur. Tam matris
için [Korumalı Alan Kullanımı](/tr/gateway/sandboxing) sayfasına bakın.

## Örnekler

### Asgari uzak kurulum

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

### Özel Gateway ile aracı başına OpenShell

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

```bash
# Tüm korumalı alan çalışma ortamlarını listele (Docker + OpenShell)
openclaw sandbox list

# Etkin politikayı incele
openclaw sandbox explain

# Yeniden oluştur (uzak çalışma alanını siler, sonraki kullanımda başlangıç verilerini yeniden aktarır)
openclaw sandbox recreate --all
```

`remote` modu için yeniden oluşturma özellikle önemlidir: İlgili kapsamın
kanonik uzak çalışma alanını siler ve sonraki kullanımda yerel ortamdan yeni
bir çalışma alanına başlangıç verileri aktarılır. `mirror` modunda yerel ortam
kanonik kaldığından yeniden oluşturma esas olarak uzak yürütme ortamını sıfırlar.

Şunlardan herhangi birini değiştirdikten sonra yeniden oluşturun:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## Güvenlik sağlamlaştırması

Mirror modu dosya sistemi köprüsü, yerel çalışma alanı kökünü sabitler ve her
okuma, yazma, dizin oluşturma, kaldırma ve yeniden adlandırma işleminden önce
kanonik yolları (realpath aracılığıyla) yeniden denetleyerek yolun ortasındaki
sembolik bağlantıları reddeder. Sembolik bağlantı değişimi veya yeniden bağlanan
bir çalışma alanı, dosya erişimini yansıtılan ağacın dışına yönlendiremez.

## Mevcut sınırlamalar

- Korumalı alan tarayıcısı OpenShell arka ucunda desteklenmez.
- `sandbox.docker.binds`, OpenShell için geçerli değildir; bağlamalar
  yapılandırılmışsa korumalı alan oluşturma başarısız olur.
- `sandbox.docker.*` altındaki Docker'a özgü çalışma zamanı ayarları (`env`
  hariç) yalnızca Docker arka ucu için geçerlidir.

## Nasıl çalışır?

1. OpenClaw, korumalı alan adı için `sandbox get` komutunu çalıştırır
   (yapılandırılmış `--gateway`/`--gateway-endpoint` değerleriyle); bu başarısız
   olursa `sandbox create` ile bir tane oluşturur ve ayarlandığında `--name`,
   `--from`, `--policy`, etkinleştirildiğinde `--gpu`,
   `--auto-providers`/`--no-auto-providers` ve yapılandırılmış her sağlayıcı
   için bir `--provider` bayrağı geçirir.
2. OpenClaw, SSH bağlantı ayrıntılarını almak için korumalı alan adıyla
   `sandbox ssh-config` komutunu çalıştırır.
3. Çekirdek, SSH yapılandırmasını geçici bir dosyaya yazar ve genel SSH arka
   ucuyla aynı uzak dosya sistemi köprüsü üzerinden bir SSH oturumu açar.
4. `mirror` modunda: yürütmeden önce yerelden uzağa eşitler, çalıştırır ve
   sonrasında yeniden yerel ortama eşitler.
5. `remote` modunda: oluşturma sırasında başlangıç verilerini bir kez aktarır,
   ardından doğrudan uzak çalışma alanında işlem yapar.

## İlgili konular

- [Korumalı Alan Kullanımı](/tr/gateway/sandboxing) - modlar, kapsamlar ve arka uç karşılaştırması
- [Korumalı Alan, Araç Politikası ve Yükseltilmiş Yetki Karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) - engellenen araçlarda hata ayıklama
- [Çok Aracılı Korumalı Alan ve Araçlar](/tr/tools/multi-agent-sandbox-tools) - aracı başına geçersiz kılmalar
- [Korumalı Alan CLI](/tr/cli/sandbox) - `openclaw sandbox` komutları
