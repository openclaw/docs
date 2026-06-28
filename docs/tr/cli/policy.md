---
read_when:
    - OpenClaw ayarlarını hazırlanmış bir policy.jsonc ile karşılaştırmak istiyorsunuz
    - doctor lint içinde politika bulguları istiyorsunuz
    - Denetim kanıtı için bir politika tasdik karmasına ihtiyacınız var
summary: '`openclaw policy` uygunluk kontrolleri için CLI başvurusu'
title: Politika
x-i18n:
    generated_at: "2026-06-28T00:24:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy`, paketle gelen Policy Plugin tarafından sağlanır. Policy, mevcut OpenClaw ayarlarının üzerinde bir kurumsal uyum katmanıdır. İkinci bir yapılandırma sistemi eklemez. `policy.jsonc` yazılmış gereksinimleri tanımlar, OpenClaw etkin çalışma alanını kanıt olarak gözlemler ve Policy sağlık kontrolleri sapmayı `doctor --lint` üzerinden raporlar. Nihai uyum sinyali temiz bir `doctor --lint` çalıştırmasıdır; Policy, ayrı bir sağlık geçidi oluşturmak yerine bulguları bu paylaşılan lint yüzeyine katkı olarak ekler.

Policy şu anda yapılandırılmış kanalları, MCP sunucularını, model sağlayıcılarını, ağ SSRF duruşunu, giriş/kanal erişim duruşunu, Gateway açığa çıkma duruşunu, ajan çalışma alanı duruşunu, veri işleme duruşunu, OpenClaw yapılandırma gizli bilgi sağlayıcısı/kimlik doğrulama profili duruşunu ve yönetilen araç bildirimlerini yönetir. Örneğin BT veya bir çalışma alanı operatörü, Telegram'ın onaylı bir kanal sağlayıcısı olmadığını kaydedebilir, MCP sunucularını ve model başvurularını onaylı girdilerle sınırlayabilir, özel ağ fetch/tarayıcı erişiminin devre dışı kalmasını şart koşabilir, doğrudan mesaj oturumu yalıtımının ve kanal giriş duruşunun incelenmiş sınırlar içinde kalmasını şart koşabilir, Gateway bağlama/kimlik doğrulama/HTTP açığa çıkma duruşunun incelenmiş sınırlar içinde kalmasını şart koşabilir, ajan çalışma alanı erişiminin ve araç retlerinin incelenmiş bir duruşta kalmasını şart koşabilir, OpenClaw yapılandırma SecretRef'lerinin yönetilen sağlayıcıları kullanmasını şart koşabilir, yapılandırma kimlik doğrulama profillerinin sağlayıcı/mod meta verisi taşımasını şart koşabilir, yönetilen araçların risk ve hassasiyet meta verisi taşımasını şart koşabilir, hassas günlük kaydı redaksiyonunu şart koşabilir, telemetri içerik yakalamayı reddedebilir, oturum saklama bakımını şart koşabilir, oturum transkript belleği indekslemeyi reddedebilir ve ardından paylaşılan uyum geçidi olarak `doctor --lint` kullanabilir.

Bir çalışma alanı "bu kanallar etkinleştirilmemelidir" veya "yönetilen araçlar onay meta verisi bildirmelidir" gibi kalıcı bir ifadeye ve OpenClaw'ın bu ifadeye hâlâ uyduğunu kanıtlamanın tekrarlanabilir bir yoluna ihtiyaç duyduğunda Policy kullanın. Yalnızca yerel davranışa ihtiyaç duyduğunuzda ve Policy bulgularına veya tasdik çıktısına ihtiyaç duymadığınızda yalnızca normal yapılandırmayı ve çalışma alanı belgelerini kullanın.

## Hızlı başlangıç

İlk kullanımdan önce paketle gelen Policy Plugin'i etkinleştirin:

```bash
openclaw plugins enable policy
```

Policy etkinleştirildiğinde doctor, rastgele Plugin'leri etkinleştirmeden Policy sağlık kontrollerini yükleyebilir. `policy.jsonc` eksikse Plugin etkin kalır, böylece doctor eksik yapıtı raporlayabilir.

Policy, kullanıcının geçerli ayarlarından üretilmez; yazılır. Kanallar, MCP sunucuları, model sağlayıcıları, ağ duruşu, giriş/kanal erişimi, Gateway açığa çıkma, ajan çalışma alanı duruşu, yapılandırılmış sandbox çalışma zamanı duruşu, OpenClaw veri işleme duruşu, yapılandırma gizli bilgi sağlayıcısı/kimlik doğrulama profili duruşu, exec onay dosyası duruşu ve araç meta verisi için en küçük Policy şuna benzer:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

Kurallar yetkili kaynaktır. Bir kategori bloğu yalnızca bir ad alanıdır; kontroller somut bir kural bulunduğunda çalışır. OpenClaw, mevcut `channels.*` ayarlarını, `mcp.servers.*`, `models.providers.*`, seçili ajan model başvurularını, ağ SSRF ayarlarını, doğrudan mesaj oturum kapsamını, kanal DM ilkesini, kanal grup ilkesini, kanal/grup mention geçitlerini, Gateway bağlama/kimlik doğrulama/Control UI/Tailscale/uzak/HTTP duruşunu, OpenClaw yapılandırma ajan sandbox çalışma alanı erişimini ve araç ret duruşunu, veri işleme yapılandırma duruşunu, yapılandırma gizli bilgi sağlayıcısını ve SecretRef kaynağını, yapılandırma kimlik doğrulama profili meta verisini, yapılandırılmış global/ajan başına araç duruşunu ve `TOOLS.md` bildirimlerini kanıt olarak okur, ardından uymayan gözlemlenen durumu raporlar. Bir Policy local loopback olmayan Gateway bağlamalarını reddediyorsa, `gateway.bind` değerini yalnızca çalışma zamanı varsayılanını incelemeye istekli olduğunuzda atlayın; sıkı yapılandırma uyumu için `gateway.bind=loopback` ayarlayın. Salt okunur ajan duruşu için geçerli varsayılanlarda veya ajanda sandbox modunu yapılandırın ve `workspaceAccess` değerini `none` veya `ro` olarak ayarlayın; atlanmış ya da `off` sandbox modu salt okunur/yazmasız Policy'yi karşılamaz. `agents.workspace.denyTools`, `exec`, `process`, `write`, `edit` ve `apply_patch` destekler; OpenClaw yapılandırması `group:fs` dosya mutasyon araçlarını, `group:runtime` ise shell/süreç araçlarını kapsar. Araç duruşu Policy'si `tools.profile`, `tools.allow`, `tools.alsoAllow`, `tools.deny`, `tools.fs.workspaceOnly`, `tools.exec.security`, `tools.exec.ask`, `tools.exec.host`, `tools.elevated.enabled` ve aynı ajan başına `agents.list[].tools.*` geçersiz kılmalarını gözlemler. Exec onay Policy'si, adlandırılmış `exec-approvals.json` ürün yapıtını yalnızca bir `execApprovals` kuralı mevcut olduğunda okur; kanıt, socket token'ları veya son kullanılan komut metni olmadan varsayılanları, ajan başına duruşu ve allowlist desenlerini kaydeder. Policy araç çağrılarını çalışma zamanında zorlamaz. Gizli bilgi kanıtı sağlayıcı/kaynak duruşunu ve SecretRef meta verisini kaydeder, ham gizli değerleri asla kaydetmez. Policy, `auth-profiles.json` gibi ajan başına kimlik bilgisi depolarını okumaz veya tasdik etmez; bu depolar mevcut kimlik doğrulama ve kimlik bilgisi akışlarına ait kalır. Veri işleme kanıtı yalnızca yapılandırma düzeyi duruştur: yapılandırılmış redaksiyon modunu, telemetri içerik yakalama geçişlerini, oturum bakım modunu ve oturum transkript belleği indeksleme ayarlarını kontrol eder. Ham günlükleri, telemetri dışa aktarımlarını, transkript içeriklerini, bellek dosyalarını incelemez veya hiçbir kişisel veri ya da gizli bilginin bulunmadığını kanıtlamaz.

### Policy kural başvurusu

Aşağıdaki her Policy alanı isteğe bağlıdır. Bir kontrol yalnızca eşleşen kural `policy.jsonc` içinde mevcut olduğunda çalışır. Gözlemlenen durum mevcut OpenClaw yapılandırması veya çalışma alanı meta verisidir; Policy sapmayı raporlar ancak bir onarım yolu açıkça mevcut ve etkin değilse çalışma zamanı davranışını yeniden yazmaz.
Policy dosyaları katıdır: desteklenmeyen bölümler veya kural anahtarları yok sayılmak yerine `policy/policy-jsonc-invalid` olarak raporlanır.

Policy katmanları geniş üst düzey kuralları global tutar, ardından adlandırılmış kapsam bloklarının açık seçiciler için daha sıkı normal Policy bölümleri eklemesine izin verir. Kapsam adı yalnızca açıklayıcı bir kovadır; eşleştirme kapsam içindeki seçici değerlerini kullanır. Katman eklemelidir: global iddialar çalışmaya devam eder ve kapsamlı bir iddia aynı gözlemlenen yapılandırmaya karşı kendi bulgusunu üretebilir.

#### Kapsamlı katmanlar

Bir ajan veya kanal kümesinin üst düzey temel çizgiden daha sıkı Policy'ye ihtiyacı olduğunda `scopes.<scopeName>` kullanın. Ajan kapsamlı bölümler `agentIds` kullanır; bu `tools.*`, `agents.workspace.*`, `sandbox.*`, `dataHandling.memory.*` ve `execApprovals.*` destekler. Kanal kapsamlı giriş `channelIds` kullanır; bu `ingress.channels.*` destekler. Desteklenmeyen bölümler yok sayılmak yerine reddedilir. Bir `agentIds` girdisi `agents.list[]` içinde mevcut değilse OpenClaw, kapsamlı kuralı o çalışma zamanı ajan kimliği için devralınan global/varsayılan duruşa göre değerlendirir.

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

Aynı ajan, her kapsam farklı alanları yönettiğinde yukarıda gösterildiği gibi birden çok kapsamda görünebilir. Aynı ajan için tekrarlanan kapsamlı alan, Policy meta verilerine göre eşit derecede veya daha kısıtlayıcı olmalıdır; daha zayıf yinelenen iddialar reddedilir. Sıkılık meta verisi izin listelerini alt kümeler, ret listelerini üst kümeler ve zorunlu boole değerlerini sabit gereksinimler olarak ele alır.

Konteyner duruşu Policy'si yalnızca OpenClaw'ın eşleşen ajan için gözlemleyebildiği kanıta göre değerlendirilir. Etkin bir `sandbox.containers.*` kuralı, sandbox arka ucu o alanı açığa çıkaramayan bir ajana uygulanırsa Policy iddiayı geçmiş saymak yerine `policy/sandbox-container-posture-unobservable` raporlar. Farklı sandbox arka uçları kullanan ajan grupları için ayrı `agentIds` kapsamları kullanın ve bu alanların gözlemlenemediği gruplarda desteklenmeyen konteyner kurallarını ayarsız veya false bırakın.

Üst düzey `ingress.session.requireDmScope` global kalır çünkü `session.dmScope` kanal atfedilebilir kanıt değildir.

| Seçici      | Desteklenen bölümler                                                               | Ne zaman kullanılır                                   |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, and `execApprovals` | Bir veya daha fazla çalışma zamanı ajanının daha sıkı kurallara ihtiyacı olduğunda. |
| `channelIds` | `ingress.channels`                                                                 | Bir veya daha fazla kanalın daha sıkı giriş kurallarına ihtiyacı olduğunda. |

`policy.jsonc` içinde bulunan her kapsam geçerli ve uygulanabilir olmalıdır.

#### Kanallar

| İlke alanı                          | Gözlemlenen durum                      | Ne zaman kullanılır                                      |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` sağlayıcısı ve etkin durum | `telegram` gibi bir sağlayıcıdan yapılandırılmış kanalları reddetmek için. |
| `channels.denyRules[].reason`        | Bulgu iletisi ve onarım ipucu bağlamı  | Sağlayıcının neden reddedildiğini açıklamak için. |

#### MCP sunucuları

| İlke alanı         | Gözlemlenen durum   | Ne zaman kullanılır                                      |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` kimlikleri | Yapılandırılmış her MCP sunucusunun bir izin listesinde olmasını gerektirmek için. |
| `mcp.servers.deny`  | `mcp.servers.*` kimlikleri | Belirli yapılandırılmış MCP sunucusu kimliklerini reddetmek için. |

#### Model sağlayıcıları

| İlke alanı              | Gözlemlenen durum                                 | Ne zaman kullanılır                                                                    |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` kimlikleri ve seçili model referansları | Yapılandırılmış sağlayıcıların ve seçili model referanslarının onaylı sağlayıcıları kullanmasını gerektirmek için. |
| `models.providers.deny`  | `models.providers.*` kimlikleri ve seçili model referansları | Yapılandırılmış sağlayıcıları ve seçili model referanslarını sağlayıcı kimliğine göre reddetmek için. |

#### Ağ

| İlke alanı                    | Gözlemlenen durum                   | Ne zaman kullanılır                                             |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | Özel ağ SSRF kaçış yolları | Özel ağ erişiminin devre dışı kalmasını gerektirmek için `false` olarak ayarlayın. |

#### Giriş ve kanal erişimi

| İlke alanı                               | Gözlemlenen durum                                              | Ne zaman kullanılır                                             |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | İncelenmiş bir doğrudan mesaj yalıtım kapsamı gerektirmek için. |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` ve eski kanal DM ilke alanları | Yalnızca incelenmiş doğrudan mesaj kanal ilkelerine izin vermek için. |
| `ingress.channels.denyOpenGroups`         | Kanal, hesap ve grup giriş ilkesi | Yapılandırılmış kanallar ve hesaplar için açık grup girişini reddetmek için. |
| `ingress.channels.requireMentionInGroups` | Kanal, hesap, grup, guild ve iç içe mention gate yapılandırması | Grup girişi açık veya mention-gated olduğunda mention gate gerektirmek için. |

#### Gateway

| İlke alanı                             | Gözlemlenen durum                              | Ne zaman kullanılır                                       |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | local loopback Gateway bağlaması gerektirmek için `false` olarak ayarlayın. |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel Gateway duruşu | Tailscale Funnel açılımını reddetmek için `false` olarak ayarlayın. |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | Devre dışı Gateway kimlik doğrulamasını reddetmek için `true` olarak ayarlayın. |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | Açık kimlik doğrulama hız sınırı yapılandırması gerektirmek için `true` olarak ayarlayın. |
| `gateway.controlUi.allowInsecure`       | Control UI güvensiz kimlik doğrulama/cihaz/origin anahtarları | Güvensiz Control UI açılım anahtarlarını reddetmek için `false` olarak ayarlayın. |
| `gateway.remote.allow`                  | Uzak Gateway modu/yapılandırması | Uzak Gateway modunu reddetmek için `false` olarak ayarlayın. |
| `gateway.http.denyEndpoints`            | Gateway HTTP API uç noktaları | `chatCompletions` veya `responses` gibi uç nokta kimliklerini reddetmek için. |
| `gateway.http.requireUrlAllowlists`     | Gateway HTTP URL getirme girdileri | URL getirme girdilerinde URL izin listeleri gerektirmek için `true` olarak ayarlayın. |

#### Ajan çalışma alanı

| İlke alanı                      | Gözlemlenen durum                                                                      | Ne zaman kullanılır                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` ve `agents.list[].sandbox.workspaceAccess` | Yalnızca `none` veya `ro` gibi sandbox çalışma alanı erişim değerlerine izin vermek için. |
| `agents.workspace.denyTools`     | Genel ve ajan başına araç reddetme yapılandırması | `exec`, `process`, `write`, `edit` veya `apply_patch` gibi çalışma alanı/çalışma zamanı mutasyon araçlarının reddedilmesini gerektirmek için. |

#### Sandbox duruşu

| İlke alanı                                           | Gözlemlenen durum                                       | Ne zaman kullanılır                                      |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` ve ajan başına mod | Yalnızca `all` veya `non-main` gibi incelenmiş sandbox modlarına izin vermek için. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` ve ajan başına backend | Yalnızca `docker` gibi incelenmiş sandbox backend’lerine izin vermek için. |
| `sandbox.containers.denyHostNetwork`                  | Konteyner destekli sandbox/tarayıcı ağ modu | Ana makine ağ modunu reddetmek için. |
| `sandbox.containers.denyContainerNamespaceJoin`       | Konteyner destekli sandbox/tarayıcı ağ modu | Başka bir konteyner ağ namespace’ine katılmayı reddetmek için. |
| `sandbox.containers.requireReadOnlyMounts`            | Konteyner destekli sandbox/tarayıcı bağlama modu | Bağlamaların salt okunur olmasını gerektirmek için. |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Konteyner destekli sandbox/tarayıcı bağlama hedefleri | Konteyner çalışma zamanı soketi bağlamalarını reddetmek için. |
| `sandbox.containers.denyUnconfinedProfiles`           | Konteyner güvenlik profili duruşu | Sınırsız konteyner güvenlik profillerini reddetmek için. |
| `sandbox.browser.requireCdpSourceRange`               | Sandbox tarayıcı CDP kaynak aralığı | Tarayıcı CDP açılımının bir kaynak aralığı bildirmesini gerektirmek için. |

İlke, eksik `sandbox.mode` değerini örtük varsayılan `off` olarak ele alır; bu nedenle
`sandbox.requireMode`, yeni veya yapılandırılmamış bir sandbox’ı `["all"]` gibi bir
izin listesinin dışında olarak raporlar.

#### Veri İşleme

| İlke alanı                                         | Gözlemlenen durum                                                                    | Ne zaman kullanılır                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | `logging.redactSensitive: "off"` değerini reddetmek için `true` olarak ayarlayın. |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | Telemetri içerik yakalamayı reddetmek için `true` olarak ayarlayın. |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | Etkili oturum bakım modu `enforce` gerektirmek için `true` olarak ayarlayın. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` ve `agents.*.memorySearch.experimental.sessionMemory` | Oturum transkripti belleğe indekslemeyi reddetmek için `true` olarak ayarlayın. |

#### Gizli Değerler

| İlke alanı                       | Gözlemlenen durum                                       | Ne zaman kullanılır                                                   |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | Yapılandırma SecretRef’leri ve `secrets.providers.*` bildirimleri | SecretRef’lerin bildirilen sağlayıcılara işaret etmesini gerektirmek için `true` olarak ayarlayın. |
| `secrets.denySources`             | Gizli değer sağlayıcısı kaynakları ve SecretRef kaynakları | `exec`, `file` veya yapılandırılmış başka bir kaynak adı gibi kaynakları reddetmek için. |
| `secrets.allowInsecureProviders`  | Güvensiz gizli değer sağlayıcısı duruş bayrakları | Güvensiz duruşu kabul eden sağlayıcıları reddetmek için `false` olarak ayarlayın. |

#### Exec onayları

Exec onayları ilkesi, etkin çalışma zamanı `exec-approvals.json`
eserini gözlemler. Varsayılan olarak bu `~/.openclaw/exec-approvals.json` olur; 
`OPENCLAW_STATE_DIR` ayarlandığında, İlke
`$OPENCLAW_STATE_DIR/exec-approvals.json` dosyasını okur. 
`execApprovals.defaults.*` veya `execApprovals.agents.*` gibi gerçek duruş kuralları okunabilir eser
kanıtı gerektirir; eksik veya geçersiz bir eser, sentetik çalışma zamanı varsayılanlarına karşı
en iyi çaba geçişi olmak yerine gözlemlenemeyen kanıt olarak raporlanır. Eser
okunabilir olduğunda, atlanan onay alanları çalışma zamanı varsayılanlarını devralır: eksik
`defaults.security` değeri `full` olur ve eksik ajan güvenliği bu
varsayılanı devralır. Kanıt; `defaults`, `agents.*` ve
`agents.*.allowlist[].pattern` ile isteğe bağlı `argPattern`, etkin
`autoAllowSkills` duruşu ve giriş kaynağını içerir. Soket
yolunu/token’ını, `commandText`, `lastUsedCommand`, çözümlenen yolları veya zaman damgalarını içermez.

| Politika alanı                              | Gözlemlenen durum                                                                     | Ne zaman kullanılır                                                                      |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | Etkin çalışma zamanı `exec-approvals.json` yolu                                        | Onay artefaktının var olmasını ve ayrıştırılmasını zorunlu kılmak için `true` olarak ayarlayın. |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`, varsayılan olarak `full`                                          | Yalnızca onaylanmış varsayılan onay güvenliği modlarına izin verin.                      |
| `execApprovals.agents.allowSecurity`        | Varsayılanları devralan `agents.*.security`                                            | Yalnızca onaylanmış aracı başına etkin onay güvenliği modlarına izin verin.              |
| `execApprovals.agents.allowAutoAllowSkills` | Çalışma zamanı varsayılanlarını devralan `defaults.autoAllowSkills` ve `agents.*.autoAllowSkills` | Örtük skill CLI onayı olmadan katı manuel izin listelerini zorunlu kılmak için `false` olarak ayarlayın. |
| `execApprovals.agents.allowlist.expected`   | Toplu `agents.*.allowlist[]` deseni ve isteğe bağlı argPattern girdileri               | Onay izin listesinin incelenmiş desen kümesiyle eşleşmesini zorunlu kılın.               |

Örneğin, onay artefaktını zorunlu kılın, izin verici varsayılanları reddedin ve
seçili aracılar için yalnızca incelenmiş exec onay duruşuna izin verin:

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### Auth profilleri

| Politika alanı                 | Gözlemlenen durum                         | Ne zaman kullanılır                                                                      |
| ------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | `auth.profiles.*` sağlayıcı ve mod meta verileri | Yapılandırma auth profillerinde `provider` ve `mode` gibi meta veri anahtarlarını zorunlu kılın. |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                    | `api_key`, `aws-sdk`, `oauth` veya `token` gibi yalnızca desteklenen auth profil modlarına izin verin. |

#### Araç meta verileri

| Politika alanı          | Gözlemlenen durum              | Ne zaman kullanılır                                                                      |
| ----------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| `tools.requireMetadata` | Yönetilen `TOOLS.md` bildirimleri | Yönetilen araçların `risk`, `sensitivity` veya `owner` gibi meta veri anahtarlarını bildirmesini zorunlu kılın. |

#### Araç duruşu

| Politika alanı                    | Gözlemlenen durum                                          | Ne zaman kullanılır                                                                                   |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` ve `agents.list[].tools.profile`            | `minimal`, `messaging` veya `coding` gibi yalnızca araç profili kimliklerine izin verin.                |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` ve aracı başına `tools.fs` geçersiz kılmaları | Yalnızca çalışma alanı dosya sistemi aracı duruşunu zorunlu kılmak için `true` olarak ayarlayın.        |
| `tools.exec.allowSecurity`      | `tools.exec.security` ve aracı başına exec güvenliği        | `deny` veya `allowlist` gibi yalnızca exec güvenliği modlarına izin verin.                              |
| `tools.exec.requireAsk`         | `tools.exec.ask` ve aracı başına exec sorma modu            | `always` gibi onay duruşunu zorunlu kılın.                                                              |
| `tools.exec.allowHosts`         | `tools.exec.host` ve aracı başına exec host yönlendirmesi   | `sandbox` gibi yalnızca exec host yönlendirme modlarına izin verin.                                     |
| `tools.elevated.allow`          | `tools.elevated.enabled` ve aracı başına elevated duruşu    | Elevated araç modunun devre dışı kalmasını zorunlu kılmak için `false` olarak ayarlayın.                |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` ve aracı başına `tools.alsoAllow`         | Tam `alsoAllow` girdilerini zorunlu kılın ve eksik veya beklenmeyen ek araç izinlerini raporlayın.      |
| `tools.denyTools`               | `tools.deny` ve `agents.list[].tools.deny`                  | Yapılandırılmış araç engelleme listelerinin `group:runtime` ve `group:fs` gibi araç kimliklerini veya grupları içermesini zorunlu kılın. |

Yazım sırasında yalnızca politika kontrollerini çalıştırın:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` yalnızca politika kontrol kümesini çalıştırır ve kanıt, bulgular ve
tasdik karmaları üretir. Policy plugin etkinleştirildiğinde aynı bulgular
`openclaw doctor --lint` içinde de görünür.

Bir operatör politika dosyasını yazılmış bir temel politika dosyasıyla karşılaştırın:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare`, politika dosyası söz dizimini politika dosyası söz dizimiyle karşılaştırır. OpenClaw çalışma zamanı durumunu, kanıtları, kimlik bilgilerini veya sırları
incelemez. Komut, kapsamlı bindirmeleri yöneten aynı politika kuralı meta verilerini
kullanır: izin listeleri eşit veya daha dar kalmalı, engelleme listeleri eşit veya daha geniş kalmalı, zorunlu boolean değerler zorunlu değerlerini korumalı, sıralı dizeler yapılandırılmış sıranın yalnızca daha kısıtlayıcı ucuna doğru hareket etmeli ve tam listeler eşleşmelidir.

Temel dosya kuruluş tarafından yazılmış bir politika olabilir. Kontrol edilen politika
daha katı değerler kullanabilir veya ek politika kuralları ekleyebilir. Üst düzeyde
kontrol edilen bir kural, eşit veya daha kısıtlayıcı olduğunda kapsamlı bir temel kuralı da
karşılayabilir çünkü üst düzey politika geniş biçimde uygulanır. Kapsam adlarının
eşleşmesi gerekmez; kapsamlı karşılaştırma, `agentIds` veya `channelIds` gibi seçici değerine
ve kontrol edilen politika alanına göre anahtarlanır.

Örnek temiz karşılaştırma JSON çıktısı yalnızca politika dosyası karşılaştırma durumunu bildirir:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Örnek temiz `policy check --json` çıktısı, bir operatör veya gözetmen tarafından
kaydedilebilen kararlı karmaları içerir:

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## Politikayı yapılandırma

Politika yapılandırması `plugins.entries.policy.config` altında bulunur.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| Ayar                     | Amaç                                                           |
| ------------------------ | -------------------------------------------------------------- |
| `enabled`                | `policy.jsonc` var olmadan önce bile politika kontrollerini etkinleştirin. |
| `workspaceRepairs`       | `doctor --fix` komutunun politika tarafından yönetilen çalışma alanı ayarlarını düzenlemesine izin verin. |
| `expectedHash`           | Onaylanmış politika artefaktı için isteğe bağlı karma kilidi.  |
| `expectedAttestationHash` | Son kabul edilmiş temiz politika kontrolü için isteğe bağlı karma kilidi. |
| `path`                   | Politika artefaktının çalışma alanına göre konumu.             |

Bir çalışma alanı için politika kontrollerini devre dışı bırakırken plugin'in kurulu kalmasını sağlamak üzere `plugins.entries.policy.config.enabled` değerini `false` olarak ayarlayın.

Araç meta veri gereksinimleri `policy.jsonc` içinde
`tools.requireMetadata` ile yazılır, örneğin `["risk", "sensitivity", "owner"]`.

## Politika durumunu kabul et

Örnek JSON çıktısı:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

İlke karması, yazılmış kural artefaktını tanımlar. Kanıt bloğu,
ilke denetimleri tarafından kullanılan gözlemlenmiş OpenClaw durumunu kaydeder.
`workspace.hash` değeri, denetlenen kapsam için bu kanıt yükünü tanımlar.
Bulgular karması, denetim tarafından döndürülen tam bulgu kümesini tanımlar.
`checkedAt`, değerlendirmenin ne zaman çalıştığını kaydeder. Onay karması,
kararlı beyanı tanımlar: ilke karması, kanıt karması, bulgular karması ve
sonucun temiz olup olmadığı. Bilerek `checkedAt` değerini içermez; böylece aynı
ilke durumu, tekrarlanan denetimlerde aynı onayı üretir. Bunlar birlikte, bu
ilke denetimi için denetim demetini oluşturur.

Daha sonra bir Gateway veya gözetmen, çalışma zamanı eylemini engellemek,
onaylamak ya da açıklama eklemek için ilke kullanırsa, son temiz ilke
denetiminden gelen onay karmasını kaydetmelidir. `checkedAt`, denetim günlükleri
için JSON çıktısında kalır, ancak kararlı onay karmasının parçası değildir.

İlke durumunu kabul ederken bu yaşam döngüsünü kullanın:

1. `policy.jsonc` dosyasını yazın veya gözden geçirin.
2. `openclaw policy check --json` komutunu çalıştırın.
3. Sonuç temizse, `attestation.policy.hash` değerini `expectedHash` olarak kaydedin.
4. `attestation.attestationHash` değerini `expectedAttestationHash` olarak kaydedin.
5. CI veya yayın kapılarında `openclaw doctor --lint` komutunu yeniden çalıştırın.

İlke kuralları bilinçli olarak değişirse, temiz bir denetimden kabul edilen iki
karmayı da güncelleyin. Çalışma alanı ayarları bilinçli olarak değişir ancak
ilke aynı kalırsa, genellikle yalnızca `expectedAttestationHash` değişir.

`agents.workspace` kurallarını etkinleştirmek veya yükseltmek, çalışma alanı
karmasına ve onay karmasına `agentWorkspace` kanıtı ekler. Operatörler, bu
kuralları etkinleştirdikten sonra yeni kanıtı gözden geçirmeli ve kabul edilen
onay karmalarını yenilemelidir. Araç duruşu kurallarını etkinleştirmek veya
yükseltmek de aynı şekilde `toolPosture` kanıtı ekler.

`openclaw policy watch`, aynı denetimi tekrar tekrar çalıştırır ve geçerli
kanıt artık `expectedAttestationHash` ile eşleşmediğinde bunu bildirir:

```bash
openclaw policy watch --json
```

Yalnızca tek bir sapma değerlendirmesine ihtiyaç duyan CI veya betiklerde
`--once` kullanın. `--once` olmadan komut varsayılan olarak her iki saniyede bir
sorgular; farklı bir aralık seçmek için `--interval-ms` kullanın.

## Bulgular

İlke şu anda şunları doğrular:

| Denetim kimliği                                         | Bulgu                                                                             |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | Politika etkin, ancak `policy.jsonc` eksik.                                       |
| `policy/policy-jsonc-invalid`                            | Politika ayrıştırılamıyor veya hatalı biçimlendirilmiş kural girdileri içeriyor.  |
| `policy/policy-hash-mismatch`                            | Politika yapılandırılmış `expectedHash` ile eşleşmiyor.                           |
| `policy/attestation-hash-mismatch`                       | Geçerli politika kanıtı artık kabul edilen doğrulama beyanıyla eşleşmiyor.        |
| `policy/policy-conformance-invalid`                      | Bir temel veya denetlenen politika dosyasında geçersiz karşılaştırma söz dizimi var. |
| `policy/policy-conformance-missing`                      | Denetlenen bir politika dosyasında temel politika dosyasının gerektirdiği bir kural eksik. |
| `policy/policy-conformance-weaker`                       | Denetlenen bir politika dosyasında temel politika dosyasından daha zayıf bir değer var. |
| `policy/channels-denied-provider`                        | Etkin bir kanal, kanal reddetme kuralıyla eşleşiyor.                              |
| `policy/mcp-denied-server`                               | Yapılandırılmış bir MCP sunucusu politika tarafından reddediliyor.                |
| `policy/mcp-unapproved-server`                           | Yapılandırılmış bir MCP sunucusu izin listesinin dışında.                         |
| `policy/models-denied-provider`                          | Yapılandırılmış bir model sağlayıcısı veya model referansı reddedilen bir sağlayıcı kullanıyor. |
| `policy/models-unapproved-provider`                      | Yapılandırılmış bir model sağlayıcısı veya model referansı izin listesinin dışında. |
| `policy/network-private-access-enabled`                  | Politika reddettiği halde özel ağ SSRF kaçış yolu etkin.                          |
| `policy/ingress-dm-policy-unapproved`                    | Bir kanal DM politikası, politika izin listesinin dışında.                        |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope`, politikanın gerektirdiği DM yalıtım kapsamıyla eşleşmiyor.     |
| `policy/ingress-open-groups-denied`                      | Politika açık grup girişini reddederken bir kanal grubu politikası `open`.        |
| `policy/ingress-group-mention-required`                  | Politika bunları gerektirirken bir kanal veya grup girdisi mention kapılarını devre dışı bırakıyor. |
| `policy/gateway-non-loopback-bind`                       | Gateway bağlama duruşu, politika reddettiği halde local loopback dışı maruz kalmaya izin veriyor. |
| `policy/gateway-auth-disabled`                           | Politika kimlik doğrulaması gerektirirken Gateway kimlik doğrulaması devre dışı.  |
| `policy/gateway-rate-limit-missing`                      | Politika gerektirirken Gateway kimlik doğrulaması hız sınırlama duruşu açıkça belirtilmemiş. |
| `policy/gateway-control-ui-insecure`                     | Gateway Control UI güvensiz maruz kalma anahtarları etkin.                        |
| `policy/gateway-tailscale-funnel`                        | Politika reddettiği halde Gateway Tailscale Funnel maruziyeti etkin.              |
| `policy/gateway-remote-enabled`                          | Politika reddettiği halde Gateway uzak modu etkin.                                |
| `policy/gateway-http-endpoint-enabled`                   | Politika tarafından reddedilmişken bir Gateway HTTP API uç noktası etkin.         |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway HTTP URL getirme girdisinde gereken URL izin listesi yok.                 |
| `policy/agents-workspace-access-denied`                  | Ajan korumalı alan modu veya çalışma alanı erişimi, politika izin listesinin dışında. |
| `policy/agents-tool-not-denied`                          | Bir ajan veya varsayılan yapılandırma, politikanın gerektirdiği bir aracı reddetmiyor. |
| `policy/tools-profile-unapproved`                        | Yapılandırılmış bir genel veya ajan başına araç profili izin listesinin dışında.  |
| `policy/tools-fs-workspace-only-required`                | Dosya sistemi araçları yalnızca çalışma alanı yolu duruşuyla yapılandırılmamış.   |
| `policy/tools-exec-security-unapproved`                  | Exec güvenlik modu politika izin listesinin dışında.                              |
| `policy/tools-exec-ask-unapproved`                       | Exec sorma modu politika izin listesinin dışında.                                 |
| `policy/tools-exec-host-unapproved`                      | Exec ana makine yönlendirmesi politika izin listesinin dışında.                   |
| `policy/tools-elevated-enabled`                          | Politika reddettiği halde yükseltilmiş araç modu etkin.                           |
| `policy/tools-also-allow-missing`                        | Yapılandırılmış bir `alsoAllow` listesinde politikanın gerektirdiği bir girdi eksik. |
| `policy/tools-also-allow-unexpected`                     | Yapılandırılmış bir `alsoAllow` listesi politikanın beklemediği bir girdi içeriyor. |
| `policy/tools-required-deny-missing`                     | Genel veya ajan başına araç reddetme listesi, gerekli reddedilmiş aracı içermiyor. |
| `policy/sandbox-mode-unapproved`                         | Korumalı alan modu politika izin listesinin dışında.                              |
| `policy/sandbox-backend-unapproved`                      | Korumalı alan arka ucu politika izin listesinin dışında.                          |
| `policy/sandbox-container-posture-unobservable`          | Gözlemleyemeyen bir arka uç için bir kapsayıcı duruş kuralı etkin.                |
| `policy/sandbox-container-host-network-denied`           | Kapsayıcı destekli bir korumalı alan veya tarayıcı ana makine ağ modunu kullanıyor. |
| `policy/sandbox-container-namespace-join-denied`         | Kapsayıcı destekli bir korumalı alan veya tarayıcı başka bir kapsayıcı ad alanına katılıyor. |
| `policy/sandbox-container-mount-mode-required`           | Kapsayıcı destekli bir korumalı alan veya tarayıcı bağlaması salt okunur değil.   |
| `policy/sandbox-container-runtime-socket-mount`          | Kapsayıcı destekli bir korumalı alan veya tarayıcı bağlaması kapsayıcı çalışma zamanı soketini açığa çıkarıyor. |
| `policy/sandbox-container-unconfined-profile`            | Politika reddettiği halde kapsayıcı korumalı alan profili sınırsız.               |
| `policy/sandbox-browser-cdp-source-range-missing`        | Politika gerektirirken korumalı alan tarayıcı CDP kaynak aralığı eksik.           |
| `policy/data-handling-redaction-disabled`                | Politika gerektirirken hassas günlük kaydı redaksiyonu devre dışı.                |
| `policy/data-handling-telemetry-content-capture`         | Politika reddettiği halde telemetri içerik yakalama etkin.                        |
| `policy/data-handling-session-retention-not-enforced`    | Politika gerektirirken oturum saklama bakımı uygulanmıyor.                        |
| `policy/data-handling-session-transcript-memory-enabled` | Politika reddettiği halde oturum transkripti bellek indeksleme etkin.             |
| `policy/secrets-unmanaged-provider`                      | Bir yapılandırma SecretRef'i `secrets.providers` altında bildirilmeyen bir sağlayıcıya başvuruyor. |
| `policy/secrets-denied-provider-source`                  | Bir yapılandırma gizli bilgi sağlayıcısı veya SecretRef, politika tarafından reddedilen bir kaynak kullanıyor. |
| `policy/secrets-insecure-provider`                       | Bir gizli bilgi sağlayıcısı, politika reddettiği halde güvensiz duruşu seçiyor.   |
| `policy/auth-profile-invalid-metadata`                   | Bir yapılandırma kimlik doğrulama profilinde geçerli sağlayıcı veya mod meta verisi eksik. |
| `policy/auth-profile-unapproved-mode`                    | Bir yapılandırma kimlik doğrulama profili modu politika izin listesinin dışında.  |
| `policy/exec-approvals-missing`                          | Politika `exec-approvals.json` gerektiriyor, ancak yapıt eksik.                   |
| `policy/exec-approvals-invalid`                          | Yapılandırılmış exec onayları yapıtı ayrıştırılamıyor.                            |
| `policy/exec-approvals-default-security-unapproved`      | Exec onayı varsayılanları, politika izin listesinin dışında bir güvenlik modu kullanıyor. |
| `policy/exec-approvals-agent-security-unapproved`        | Ajan başına geçerli exec onayı güvenlik modu izin listesinin dışında.             |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Bir exec onay ajanı, politika reddettiği halde skill CLI'larına örtük olarak otomatik izin veriyor. |
| `policy/exec-approvals-allowlist-missing`                | Onay izin listesinde politikanın gerektirdiği bir kalıp eksik.                    |
| `policy/exec-approvals-allowlist-unexpected`             | Onay izin listesi politikanın beklemediği bir kalıp içeriyor.                     |
| `policy/tools-missing-risk-level`                        | Yönetilen bir araç bildiriminde risk meta verisi eksik.                           |
| `policy/tools-unknown-risk-level`                        | Yönetilen bir araç bildirimi bilinmeyen bir risk değeri kullanıyor.               |
| `policy/tools-missing-sensitivity-token`                 | Yönetilen bir araç bildiriminde hassasiyet meta verisi eksik.                     |
| `policy/tools-missing-owner`                             | Yönetilen bir araç bildiriminde sahip meta verisi eksik.                          |
| `policy/tools-unknown-sensitivity-token`                 | Yönetilen bir araç bildirimi bilinmeyen bir hassasiyet değeri kullanıyor.         |

Politika bulguları hem `target` hem de `requirement` içerebilir. `target`, uyumlu olmayan
gözlemlenen çalışma alanı öğesidir. `requirement`, bunu bulgu haline getiren yazılmış
politika kuralıdır. İki değer de bugün adrestir, genellikle
`oc://` yollarıdır, ancak alan adları adres biçiminden çok politika rollerini açıklar.

Örnek JSON bulgusu:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

Örnek araç bulgusu:

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

Örnek MCP bulgusu:

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP server 'remote' is not in the policy allowlist.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

Örnek model sağlayıcısı bulgusu:

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

Örnek ağ bulgusu:

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Network setting 'browser-private-network' allows private-network access.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

Örnek Gateway açığa çıkma bulgusu:

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

Örnek ajan çalışma alanı bulgusu:

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Onarım

`doctor --lint` ve `policy check` salt okunurdur.

`doctor --fix`, yalnızca `workspaceRepairs` açıkça etkinleştirildiğinde ilke tarafından yönetilen çalışma alanı ayarlarını düzenler. Bu katılım olmadan, ilke denetimleri neyi onaracaklarını bildirir ve ayarları değiştirmeden bırakır.

Bu sürümde onarım, OpenClaw yapılandırmasında etkinleştirilmiş ancak `channels.denyRules` tarafından reddedilen kanalları devre dışı bırakabilir. `workspaceRepairs` özelliğini yalnızca ilke dosyası gözden geçirildikten sonra etkinleştirin, çünkü geçerli bir reddetme kuralı yapılandırılmış bir kanalı kapatabilir:

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## Çıkış kodları

| Komut            | `0`                                                    | `1`                                                                 | `2`                                 |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------- |
| `policy check`   | Eşikte bulgu yok.                                      | Bir veya daha fazla bulgu eşiği karşıladı.                          | Bağımsız değişken veya çalışma zamanı hatası. |
| `policy compare` | İlke dosyası en az temel kadar katı.                   | İlke dosyası geçersiz, eksik veya temel kurallardan daha zayıf.     | Bağımsız değişken veya çalışma zamanı hatası. |
| `policy watch`   | Bulgu yok ve kabul edilen hash güncel.                 | Bulgular var veya kabul edilen tasdik güncel değil.                 | Bağımsız değişken veya çalışma zamanı hatası. |

## İlgili

- [Doctor lint modu](/tr/cli/doctor#lint-mode)
- [Path CLI](/tr/cli/path)
