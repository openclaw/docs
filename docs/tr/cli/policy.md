---
read_when:
    - Yazılmış bir policy.jsonc dosyasına göre OpenClaw ayarlarını denetlemek istiyorsunuz
    - Doctor lint denetiminde politika bulguları istiyorsunuz
    - Denetim kanıtı için bir politika tasdik karmasına ihtiyacınız var
summary: '`openclaw policy` uygunluk denetimleri için CLI başvurusu'
title: Politika
x-i18n:
    generated_at: "2026-07-12T11:35:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy`, paketle birlikte sunulan Policy Plugin tarafından sağlanır. Mevcut OpenClaw ayarlarının üzerinde çalışan kurumsal bir uygunluk katmanıdır; ikinci bir yapılandırma sistemi değildir. Gereksinimleri `policy.jsonc` içinde tanımlarsınız; OpenClaw etkin çalışma alanını kanıt olarak gözlemler; policy, sapmaları `doctor --lint` aracılığıyla bildirir. Policy, araç çağrılarını zorunlu kılmaz veya istek sırasında çalışma zamanı davranışını yeniden yazmaz ve `auth-profiles.json` gibi ajan başına kimlik bilgisi depolarını tasdik etmez.

Policy; yapılandırılmış kanalları, MCP sunucularını, model sağlayıcılarını, ağ SSRF duruşunu, giriş/kanal erişimini, Gateway erişilebilirliğini ve node komut duruşunu, ajan çalışma alanı erişimini, sandbox duruşunu, veri işleme duruşunu, gizli bilgi sağlayıcısı/kimlik doğrulama profili duruşunu ve yönetilen araç meta verilerini (`TOOLS.md`) denetler. Bir çalışma alanının "Telegram etkinleştirilmemelidir" veya "yönetilen araçlar risk ve sahip meta verilerini belirtmelidir" gibi kalıcı ve denetlenebilir bir beyana ihtiyaç duyduğu durumlarda kullanın. Tasdik veya sapma algılama olmadan yalnızca yerel davranışa ihtiyacınız varsa normal yapılandırma yeterlidir.

## Hızlı başlangıç

```bash
openclaw plugins enable policy
```

Plugin, `policy.jsonc` bulunmadığında da etkin kalır; böylece doctor, denetimleri sessizce atlamak yerine eksik yapıtı bildirebilir.

`policy.jsonc` dosyasını elle oluşturun; mevcut ayarlardan üretilmez. Her üst düzey bölüm bir kural ad alanıdır: denetim yalnızca altında somut bir kural bulunduğunda çalışır (desteklenmeyen bölümler veya anahtarlar sessizce yok sayılmak yerine `policy/policy-jsonc-invalid` hatasıyla başarısız olur). Desteklenen tüm bölümleri kapsayan en küçük örnek:

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
    "nodes": {
      "denyCommands": ["system.run"],
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

Aşağıdaki kural tablolarından açıkça anlaşılmayan, birden fazla alanı ilgilendiren notlar:

- Geri döngü dışı bağlamaları reddederken `gateway.bind` öğesini atlamak, çalışma zamanı varsayılanını kabul ettiğiniz anlamına gelir; katı uygunluk için `gateway.bind: "loopback"` ayarını yapın.
- Salt okunur bir ajan için ilgili varsayılanlarda/ajanda sandbox `mode` değerini `all` veya `non-main`, `workspaceAccess` değerini ise `none` veya `ro` olarak ayarlayın. Eksik veya `off` sandbox modu, salt okunur policy gereksinimini karşılamaz.
- `agents.workspace.denyTools`; `exec`, `process`, `write`, `edit`, `apply_patch` değerlerini kabul eder. Yapılandırmadaki araç reddetme grupları `group:fs` (dosya değiştirme) ve `group:runtime` (kabuk/işlem), eşdeğer duruşu karşılar.
- Çalıştırma onayı denetimleri, yalnızca bir `execApprovals` kuralı mevcut olduğunda canlı `exec-approvals.json` yapıtını okur; eksik veya geçersiz bir yapıt, yapay bir başarılı sonuç değil, gözlemlenemeyen kanıttır.
- Gizli bilgi ve kimlik doğrulama profili kanıt kayıtları yalnızca sağlayıcı/kaynak duruşunu ve SecretRef meta verilerini kaydeder; ham değerleri hiçbir zaman kaydetmez. Policy, `auth-profiles.json` gibi ajan başına kimlik bilgisi depolarını okumaz veya tasdik etmez.
- Veri işleme kanıtı yalnızca yapılandırma düzeyindeki duruştur (maskeleme modu, telemetri yakalama anahtarı, oturum bakım modu, döküm indeksleme ayarı). Günlükleri, telemetri dışa aktarımlarını, dökümleri veya bellek dosyalarını incelemez ve temiz bir sonuç bunlarda kişisel veri veya gizli bilgi bulunmadığını kanıtlamaz.

### Policy kural başvurusu

Aşağıdaki her kural isteğe bağlıdır; denetim yalnızca kural mevcut olduğunda çalışır. Gözlemlenen durum, mevcut OpenClaw yapılandırması veya çalışma alanı meta verileridir.

#### Kapsamlı katmanlar

Belirli ajanlar veya kanallar üst düzey taban çizgisinden daha katı bir policy gerektirdiğinde `scopes.<scopeName>` kullanın. Kapsam adı yalnızca bir etikettir; eşleştirme, kapsam içindeki seçiciyi kullanır. Katmanlar eklemelidir: genel kural çalışmaya devam eder ve kapsamlı kural aynı kanıta karşı kendi bulgusunu ekleyebilir.

| Seçici       | Desteklenen bölümler                                                            | Kullanım durumu                                      |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Bir veya daha fazla çalışma zamanı ajanı daha katı kurallara ihtiyaç duyduğunda. |
| `channelIds` | `ingress.channels`                                                             | Bir veya daha fazla kanal daha katı giriş kurallarına ihtiyaç duyduğunda. |

Bir `agentIds` girdisi `agents.list[]` içinde yoksa OpenClaw kapsamlı kuralı atlamak yerine o çalışma zamanı ajan kimliği için devralınan genel/varsayılan duruşa göre değerlendirir.

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

Yukarıdaki gibi, her kapsam farklı bir alanı yönetiyorsa aynı ajan birden fazla kapsamda yer alabilir. Aynı ajan için yinelenen kapsamlı bir alan eşit derecede veya daha kısıtlayıcı olmalıdır; daha zayıf bir yinelenen beyan reddedilir (izin listeleri alt kümeler, ret listeleri üst kümeler olmalı; zorunlu Boolean değerleri sabittir).

Kapsayıcı duruş kuralları (`sandbox.containers.*`) yalnızca eşleşen ajanın sandbox arka ucunun sunabildiği kanıtlara göre denetlenir. Bir arka uç, kendisi için etkinleştirdiğiniz bir kuralı gözlemleyemiyorsa policy başarılı saymak yerine `policy/sandbox-container-posture-unobservable` bildirir; kapsayıcı kurallarını, bunları sunabilen bir arka uç kullanan ajan gruplarıyla kapsamlandırın.

Üst düzey `ingress.session.requireDmScope` genel kalır; `session.dmScope` kanala atfedilebilir bir kanıt olmadığından `channelIds` ile kapsamlandırılamaz.

`policy.jsonc` içinde bulunan her kapsam geçerli ve uygulanabilir olmalıdır.

#### Kanallar

| Policy alanı                         | Gözlemlenen durum                       | Kullanım durumu                                               |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` sağlayıcısı ve etkinlik durumu | `telegram` gibi bir sağlayıcının yapılandırılmış kanallarını reddetmek için. |
| `channels.denyRules[].reason`        | Bulgu iletisi ve düzeltme ipucu bağlamı | Sağlayıcının neden reddedildiğini açıklamak için.             |

#### MCP sunucuları

| Policy alanı         | Gözlemlenen durum  | Kullanım durumu                                             |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` kimlikleri | Yapılandırılmış her MCP sunucusunun bir izin listesinde bulunmasını zorunlu kılmak için. |
| `mcp.servers.deny`  | `mcp.servers.*` kimlikleri | Yapılandırılmış belirli MCP sunucu kimliklerini reddetmek için. |

#### Model sağlayıcıları

| Policy alanı              | Gözlemlenen durum                               | Kullanım durumu                                                                  |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` kimlikleri ve seçili model başvuruları | Yapılandırılmış sağlayıcıların ve seçili model başvurularının onaylı sağlayıcıları kullanmasını zorunlu kılmak için. |
| `models.providers.deny`  | `models.providers.*` kimlikleri ve seçili model başvuruları | Yapılandırılmış sağlayıcıları ve seçili model başvurularını sağlayıcı kimliğine göre reddetmek için. |

#### Ağ

| Policy alanı                    | Gözlemlenen durum                  | Kullanım durumu                                                     |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | Özel ağ SSRF kaçış yolları | Özel ağ erişiminin devre dışı kalmasını zorunlu kılmak için `false` olarak ayarlayın. |

#### Giriş ve kanal erişimi

| İlke alanı                                | Gözlemlenen durum                                               | Kullanım amacı                                                         |
| ----------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | İncelenmiş bir doğrudan mesaj yalıtım kapsamını zorunlu kılın.          |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` ve eski kanal DM ilkesi alanları          | Yalnızca incelenmiş doğrudan mesaj kanal ilkelerine izin verin.         |
| `ingress.channels.denyOpenGroups`         | Kanal, hesap ve grup giriş ilkesi                               | Yapılandırılmış kanallar ve hesaplar için açık grup girişini reddedin.  |
| `ingress.channels.requireMentionInGroups` | Kanal, hesap, grup, sunucu ve iç içe anma geçidi yapılandırması | Grup girişi açık veya anma geçitli olduğunda anma geçitlerini zorunlu kılın. |

#### Gateway

| İlke alanı                              | Gözlemlenen durum                                      | Kullanım amacı                                                                                  |
| --------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                        | Gateway'in local loopback adresine bağlanmasını zorunlu kılmak için `false` olarak ayarlayın.   |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale sunma/tünelleme Gateway duruşu               | Tailscale Funnel erişimini reddetmek için `false` olarak ayarlayın.                             |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                                   | Devre dışı bırakılmış Gateway kimlik doğrulamasını reddetmek için `true` olarak ayarlayın.      |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                              | Açık kimlik doğrulama hız sınırı yapılandırmasını zorunlu kılmak için `true` olarak ayarlayın.  |
| `gateway.controlUi.allowInsecure`       | Control UI güvensiz kimlik doğrulama/cihaz/kaynak geçişleri | Güvensiz Control UI erişim geçişlerini reddetmek için `false` olarak ayarlayın.             |
| `gateway.remote.allow`                  | Uzak Gateway modu/yapılandırması                      | Uzak Gateway modunu reddetmek için `false` olarak ayarlayın.                                   |
| `gateway.http.denyEndpoints`            | Gateway HTTP API uç noktaları                         | `chatCompletions` veya `responses` gibi uç nokta kimliklerini reddedin.                         |
| `gateway.http.requireUrlAllowlists`     | Gateway HTTP URL getirme girdileri                    | URL getirme girdilerinde URL izin listelerini zorunlu kılmak için `true` olarak ayarlayın.      |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                          | `system.run` gibi tam Node komut kimliklerinin OpenClaw yapılandırmasında reddedilmesini zorunlu kılın. |

`gateway.nodes.denyCommands`, tam eşleşmeye ve büyük/küçük harfe duyarlı bir
reddetme üst kümesi kuralıdır. İlkenin, ayrıcalıklı Node komutlarının OpenClaw
yapılandırması tarafından açıkça reddedildiğini kanıtlaması gerektiğinde bunu
kullanın. Ayrıcalıklı bir Node komutuna kasıtlı olarak izin veren bir dağıtım,
yalnızca `gateway.nodes.allowCommands` seçeneğine güvenmek yerine inceleme
sonrasında `policy.jsonc` dosyasını güncellemelidir.

#### Aracı çalışma alanı

| İlke alanı                       | Gözlemlenen durum                                                                    | Kullanım amacı                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` ve `agents.list[].sandbox.workspaceAccess` | Yalnızca `none` veya `ro` gibi sandbox çalışma alanı erişim değerlerine izin verin.         |
| `agents.workspace.denyTools`     | Genel ve aracı başına araç reddetme yapılandırması                                   | Değişiklik araçlarının (`exec`, `process`, `write`, `edit`, `apply_patch`) reddedilmesini zorunlu kılın. |

#### Sandbox duruşu

| İlke alanı                                           | Gözlemlenen durum                                      | Kullanım amacı                                                    |
| ---------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| `sandbox.requireMode`                                | `agents.defaults.sandbox.mode` ve aracı başına mod    | Yalnızca `all` veya `non-main` gibi incelenmiş sandbox modlarına izin verin. |
| `sandbox.allowBackends`                              | `agents.defaults.sandbox.backend` ve aracı başına arka uç | Yalnızca `docker` gibi incelenmiş sandbox arka uçlarına izin verin. |
| `sandbox.containers.denyHostNetwork`                 | Kapsayıcı destekli sandbox/tarayıcı ağ modu           | Ana makine ağ modunu reddedin.                                   |
| `sandbox.containers.denyContainerNamespaceJoin`      | Kapsayıcı destekli sandbox/tarayıcı ağ modu           | Başka bir kapsayıcının ağ ad alanına katılmayı reddedin.          |
| `sandbox.containers.requireReadOnlyMounts`           | Kapsayıcı destekli sandbox/tarayıcı bağlama modu      | Bağlamaların salt okunur olmasını zorunlu kılın.                  |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Kapsayıcı destekli sandbox/tarayıcı bağlama hedefleri | Kapsayıcı çalışma zamanı soketi bağlamalarını reddedin.           |
| `sandbox.containers.denyUnconfinedProfiles`          | Kapsayıcı güvenlik profili duruşu                     | Sınırlandırılmamış kapsayıcı güvenlik profillerini reddedin.      |
| `sandbox.browser.requireCdpSourceRange`              | Sandbox tarayıcı CDP kaynak aralığı                   | Tarayıcı CDP erişiminin bir kaynak aralığı bildirmesini zorunlu kılın. |

İlke, eksik `sandbox.mode` değerini örtük varsayılanı olan `off` şeklinde ele
alır; bu nedenle `sandbox.requireMode`, yeni veya yapılandırılmamış bir sandbox'ı
`["all"]` gibi bir izin listesinin dışında olarak bildirir.

#### Veri İşleme

| İlke alanı                                         | Gözlemlenen durum                                                                    | Kullanım amacı                                                               |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`   | `logging.redactSensitive`                                                           | `logging.redactSensitive: "off"` değerini reddetmek için `true` olarak ayarlayın. |
| `dataHandling.telemetry.denyContentCapture`        | `diagnostics.otel.captureContent`                                                   | Telemetri içerik yakalamayı reddetmek için `true` olarak ayarlayın.          |
| `dataHandling.retention.requireSessionMaintenance` | `session.maintenance.mode`                                                          | Etkin oturum bakım modu `enforce` değerini zorunlu kılmak için `true` olarak ayarlayın. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` ve `agents.*.memorySearch.experimental.sessionMemory` | Oturum dökümlerinin bellekte dizinlenmesini reddetmek için `true` olarak ayarlayın. |

#### Gizli değerler

| İlke alanı                       | Gözlemlenen durum                                         | Kullanım amacı                                                                  |
| -------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | Yapılandırma SecretRef'leri ve `secrets.providers.*` bildirimleri | SecretRef'lerin bildirilmiş sağlayıcılara işaret etmesini zorunlu kılmak için `true` olarak ayarlayın. |
| `secrets.denySources`            | Gizli değer sağlayıcısı kaynakları ve SecretRef kaynakları | `exec`, `file` veya yapılandırılmış başka bir kaynak adı gibi kaynakları reddedin. |
| `secrets.allowInsecureProviders` | Güvensiz gizli değer sağlayıcısı duruş bayrakları         | Güvensiz duruşu etkinleştiren sağlayıcıları reddetmek için `false` olarak ayarlayın. |

#### Exec onayları

Exec onayı denetimleri, çalışma zamanı `exec-approvals.json` yapıtını okur:
varsayılan olarak `~/.openclaw/exec-approvals.json` veya `OPENCLAW_STATE_DIR`
ayarlandığında `$OPENCLAW_STATE_DIR/exec-approvals.json`.
`execApprovals.defaults.*` veya `execApprovals.agents.*` altındaki duruş
kuralları, okunabilir yapıt kanıtı gerektirir; eksik veya geçersiz bir yapıt,
en iyi çabaya dayalı bir başarı yerine gözlemlenemeyen kanıt olarak bildirilir.
Yapıt okunabilir olduğunda, atlanmış alanlar çalışma zamanı varsayılanlarını
devralır: eksik `defaults.security` değeri `full` olur ve eksik aracı güvenliği
bu varsayılanı devralır. Kanıt; `defaults`, `agents.*`,
`agents.*.allowlist[].pattern`, isteğe bağlı `argPattern`, etkin
`autoAllowSkills` duruşu ve giriş kaynağını içerir; soket yolu/belirteci,
`commandText`, `lastUsedCommand`, çözümlenmiş yollar veya zaman damgalarını
asla içermez.

| İlke alanı                                  | Gözlemlenen durum                                                                     | Kullanım amacı                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | Etkin çalışma zamanı `exec-approvals.json` yolu                                      | Onay yapıtının mevcut olmasını ve ayrıştırılabilmesini zorunlu kılmak için `true` olarak ayarlayın. |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`; varsayılanı `full`                                              | Yalnızca onaylanmış varsayılan onay güvenliği modlarına izin verin.                            |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`; varsayılanları devralır                                         | Yalnızca aracı başına onaylanmış etkin onay güvenliği modlarına izin verin.                    |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` ve `agents.*.autoAllowSkills`; çalışma zamanı varsayılanlarını devralır | Örtük Skills CLI onayı olmadan katı manuel izin listelerini zorunlu kılmak için `false` olarak ayarlayın. |
| `execApprovals.agents.allowlist.expected`   | Toplu `agents.*.allowlist[]` kalıbı ve isteğe bağlı argPattern girdileri             | Onay izin listesinin incelenmiş kalıp kümesiyle eşleşmesini zorunlu kılın.                     |

Örnek: onay yapıtını zorunlu kılın, izin verici varsayılanları reddedin ve
yalnızca seçilen aracılar için incelenmiş Exec onayı duruşuna izin verin.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Güvenlik modları: "deny", "allowlist" veya "full".
      // Bu varsayılan yalnızca sıkı biçimde kısıtlanmış deny duruşuna izin verir.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Seçilen aracılar, gözden geçirilmiş allowlist duruşunu kullanabilir ancak "full" kullanamaz.
          "allowSecurity": ["allowlist"],
          // false, Skills CLI'larının autoAllowSkills tarafından örtük olarak onaylanmak yerine
          // gözden geçirilmiş allowlist içinde bulunması gerektiği anlamına gelir.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Basit girdi: argPattern içermeyen, gözden geçirilmiş tam çalıştırılabilir dosya kalıbı.
              "travel-hub",
              // Kısıtlı girdi: kalıp ile gözden geçirilmiş bağımsız değişken düzenli ifadesi.
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

#### Kimlik doğrulama profilleri

| İlke alanı                      | Gözlemlenen durum                            | Kullanım amacı                                                                             |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` sağlayıcı ve mod meta verileri | Yapılandırmadaki kimlik doğrulama profillerinde `provider` ve `mode` gibi meta veri anahtarlarını zorunlu kılın. |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | Yalnızca `api_key`, `aws-sdk`, `oauth` veya `token` gibi desteklenen kimlik doğrulama profili modlarına izin verin. |

#### Araç meta verileri

| İlke alanı              | Gözlemlenen durum              | Kullanım amacı                                                                             |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Yönetilen `TOOLS.md` bildirimleri | Yönetilen araçların `risk`, `sensitivity` veya `owner` gibi meta veri anahtarlarını bildirmesini zorunlu kılın. |

#### Araç duruşu

| İlke alanı                      | Gözlemlenen durum                                          | Kullanım amacı                                                                                              |
| ------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` ve `agents.list[].tools.profile`           | Yalnızca `minimal`, `messaging` veya `coding` gibi araç profili kimliklerine izin verin.                     |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` ve aracı başına `tools.fs` geçersiz kılmaları | Yalnızca çalışma alanıyla sınırlı dosya sistemi aracı duruşunu zorunlu kılmak için `true` olarak ayarlayın. |
| `tools.exec.allowSecurity`      | `tools.exec.security` ve aracı başına exec güvenliği       | Yalnızca `deny` veya `allowlist` gibi exec güvenlik modlarına izin verin.                                   |
| `tools.exec.requireAsk`         | `tools.exec.ask` ve aracı başına exec isteme modu          | `always` gibi bir onay duruşunu zorunlu kılın.                                                              |
| `tools.exec.allowHosts`         | `tools.exec.host` ve aracı başına exec ana makine yönlendirmesi | Yalnızca `sandbox` gibi exec ana makine yönlendirme modlarına izin verin.                                |
| `tools.elevated.allow`          | `tools.elevated.enabled` ve aracı başına yükseltilmiş duruş | Yükseltilmiş araç modunun devre dışı kalmasını zorunlu kılmak için `false` olarak ayarlayın.                |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` ve aracı başına `tools.alsoAllow`        | Tam `alsoAllow` girdilerini zorunlu kılın ve eksik ya da beklenmeyen ek araç izinlerini bildirin.           |
| `tools.denyTools`               | `tools.deny` ve `agents.list[].tools.deny`                 | Yapılandırılmış araç engelleme listelerinin `group:runtime` ve `group:fs` gibi araç kimliklerini veya gruplarını içermesini zorunlu kılın. |

## Denetimleri çalıştırma

Yazım sırasında yalnızca ilke denetimlerini çalıştırın:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` yalnızca ilke denetimi kümesini çalıştırır ve kanıtları, bulguları
ve doğrulama karmalarını üretir. Aynı bulgular, Policy Plugin
etkinleştirildiğinde `openclaw doctor --lint` içinde de görünür.

Bir operatör ilke dosyasını yazılmış bir temel değerle karşılaştırın:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare`, ilke dosyası sözdizimini ilke dosyası sözdizimiyle karşılaştırır;
çalışma zamanı durumunu, kanıtları, kimlik bilgilerini veya gizli bilgileri incelemez.
Kapsamlı katmanları yöneten aynı kural meta verilerini kullanır: izin listeleri aynı
kalmalı veya daralmalı, engelleme listeleri aynı kalmalı veya genişlemeli, zorunlu
Boole değerleri kendi değerlerini korumalı, sıralı dizeler yalnızca yapılandırılmış
sıranın daha katı ucuna doğru ilerleyebilmeli ve tam listeler eşleşmelidir. Temel değer,
kuruluş tarafından yazılmış bir ilke olabilir; denetlenen ilke daha katı değerler veya
ek kurallar ekleyebilir. Üst düzey bir denetlenen kural, eşit veya daha kısıtlayıcıysa
kapsamlı bir temel değer kuralını karşılayabilir. Kapsam adlarının dosyalar arasında
eşleşmesi gerekmez; karşılaştırma, seçiciye (`agentIds`/`channelIds`) ve alana göre
anahtarlanır.

Temiz karşılaştırma (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Temiz `policy check --json` çıktısı, bir operatörün veya
denetleyicinin kaydedebileceği kararlı karmaları içerir:

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

## İlkeyi yapılandırma

İlke yapılandırması `plugins.entries.policy.config` altında bulunur.

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

| Ayar                      | Amaç                                                                    |
| ------------------------- | ----------------------------------------------------------------------- |
| `enabled`                 | `policy.jsonc` henüz mevcut olmasa bile ilke denetimlerini etkinleştirin. |
| `workspaceRepairs`        | `doctor --fix` komutunun ilke tarafından yönetilen çalışma alanı ayarlarını düzenlemesine izin verin. |
| `expectedHash`            | Onaylanan ilke yapıtı için isteğe bağlı karma kilidi.                    |
| `expectedAttestationHash` | Son kabul edilen temiz ilke denetimi için isteğe bağlı karma kilidi.     |
| `path`                    | İlke yapıtının çalışma alanına göreli konumu.                            |

Plugin kurulu kalırken bir çalışma alanındaki ilke
denetimlerini devre dışı bırakmak için `plugins.entries.policy.config.enabled`
değerini `false` olarak ayarlayın.

## İlke durumunu kabul etme

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
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
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

`attestation.policy.hash`, yazılmış kural yapıtını tanımlar. `evidence`,
denetimler tarafından kullanılan gözlemlenmiş OpenClaw durumunu kaydeder ve
`workspace.hash` bu kanıt yükünü tanımlar. `findingsHash`, tam bulgu
kümesini tanımlar. `checkedAt`, denetimin ne zaman çalıştığını kaydeder.
`attestationHash`, kararlı iddiayı (ilke karması, kanıt karması,
bulgular karması ve temiz/kirli durum) tanımlar ve `checkedAt` değerini
bilerek hariç tutar; böylece aynı ilke durumu her zaman aynı doğrulama
karmasını üretir. Bu dört değer birlikte tek bir ilke denetiminin denetim
demetini oluşturur.

Bir Gateway veya denetleyici, çalışma zamanı eylemini engellemek, onaylamak
veya açıklama eklemek için ilke kullanıyorsa son temiz denetimin doğrulama
karmasını kaydetmelidir. `checkedAt`, denetim günlükleri için JSON çıktısında
kalır ancak kararlı karmanın parçası değildir.

İlke durumunu kabul etme yaşam döngüsü:

1. `policy.jsonc` dosyasını yazın veya gözden geçirin.
2. `openclaw policy check --json` komutunu çalıştırın.
3. Temizse `attestation.policy.hash` değerini `expectedHash` olarak kaydedin.
4. `attestation.attestationHash` değerini `expectedAttestationHash` olarak kaydedin.
5. CI veya sürüm kapılarında `openclaw doctor --lint` komutunu yeniden çalıştırın.

Politika kuralları kasıtlı olarak değişirse temiz bir denetimden elde edilen
kabul edilmiş iki hash'i de güncelleyin. Yalnızca çalışma alanı ayarları değişirse
(politika aynı kalırsa), genellikle yalnızca `expectedAttestationHash` değişir.

`agents.workspace` kurallarını etkinleştirmek veya yükseltmek, çalışma alanı
hash'ine ve tasdik hash'ine `agentWorkspace` kanıtı ekler; etkinleştirdikten sonra
yeni kanıtı inceleyin ve kabul edilmiş tasdik hash'lerini yenileyin. Araç duruşu
kurallarını etkinleştirmek veya yükseltmek de aynı şekilde `toolPosture` kanıtı ekler.

`openclaw policy watch`, denetimi yeniden çalıştırır ve mevcut kanıt artık
`expectedAttestationHash` ile eşleşmediğinde bunu bildirir:

```bash
openclaw policy watch --json
```

Tek bir sapma değerlendirmesi gerektiren CI veya betiklerde `--once` kullanın.
`--once` olmadan varsayılan olarak iki saniyede bir yoklama yapar; aralığı
değiştirmek için `--interval-ms` kullanın.

## Bulgular

| Denetim kimliği                                          | Bulgu                                                                             |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | Politika etkin ancak `policy.jsonc` eksik.                                        |
| `policy/policy-jsonc-invalid`                            | Politika ayrıştırılamıyor veya hatalı biçimlendirilmiş kural girdileri içeriyor.  |
| `policy/policy-hash-mismatch`                            | Politika, yapılandırılmış `expectedHash` ile eşleşmiyor.                           |
| `policy/attestation-hash-mismatch`                       | Mevcut politika kanıtı artık kabul edilmiş tasdikle eşleşmiyor.                    |
| `policy/policy-conformance-invalid`                      | Bir temel veya denetlenen politika dosyası geçersiz karşılaştırma söz dizimine sahip. |
| `policy/policy-conformance-missing`                      | Denetlenen politika dosyasında temel politika dosyasının gerektirdiği bir kural eksik. |
| `policy/policy-conformance-weaker`                       | Denetlenen politika dosyasındaki bir değer temel politika dosyasındakinden daha zayıf. |
| `policy/channels-denied-provider`                        | Etkin bir kanal, kanal reddetme kuralıyla eşleşiyor.                               |
| `policy/mcp-denied-server`                               | Yapılandırılmış bir MCP sunucusu politika tarafından reddediliyor.                 |
| `policy/mcp-unapproved-server`                           | Yapılandırılmış bir MCP sunucusu izin listesinin dışında.                          |
| `policy/models-denied-provider`                          | Yapılandırılmış bir model sağlayıcısı veya model başvurusu, reddedilen bir sağlayıcı kullanıyor. |
| `policy/models-unapproved-provider`                      | Yapılandırılmış bir model sağlayıcısı veya model başvurusu izin listesinin dışında. |
| `policy/network-private-access-enabled`                  | Politika reddettiği hâlde özel ağ SSRF kaçış mekanizması etkin.                    |
| `policy/ingress-dm-policy-unapproved`                    | Bir kanal DM politikası, politika izin listesinin dışında.                         |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope`, politikanın gerektirdiği DM yalıtım kapsamıyla eşleşmiyor.      |
| `policy/ingress-open-groups-denied`                      | Politika açık grup girişini reddettiği hâlde bir kanal grup politikası `open`.     |
| `policy/ingress-group-mention-required`                  | Politika gerektirdiği hâlde bir kanal veya grup girdisi bahsetme geçitlerini devre dışı bırakıyor. |
| `policy/gateway-non-loopback-bind`                       | Politika reddettiği hâlde Gateway bağlama duruşu, döngüsel olmayan arabirimlere açılmaya izin veriyor. |
| `policy/gateway-auth-disabled`                           | Politika kimlik doğrulamayı gerektirdiği hâlde Gateway kimlik doğrulaması devre dışı. |
| `policy/gateway-rate-limit-missing`                      | Politika gerektirdiği hâlde Gateway kimlik doğrulama hız sınırı duruşu açıkça belirtilmemiş. |
| `policy/gateway-control-ui-insecure`                     | Gateway Denetim Arayüzü'nün güvenli olmayan erişim anahtarları etkin.              |
| `policy/gateway-tailscale-funnel`                        | Politika reddettiği hâlde Gateway Tailscale Funnel erişimi etkin.                  |
| `policy/gateway-remote-enabled`                          | Politika reddettiği hâlde Gateway uzak modu etkin.                                 |
| `policy/gateway-http-endpoint-enabled`                   | Politika tarafından reddedildiği hâlde bir Gateway HTTP API uç noktası etkin.      |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway HTTP URL getirme girdisinde gerekli URL izin listesi yok.                  |
| `policy/gateway-node-command-denied`                     | Politika tarafından reddedilen bir Node komutu, OpenClaw yapılandırması tarafından reddedilmiyor. |
| `policy/agents-workspace-access-denied`                  | Ajan korumalı alan modu veya çalışma alanı erişimi, politika izin listesinin dışında. |
| `policy/agents-tool-not-denied`                          | Bir ajan veya varsayılan yapılandırma, politikanın reddedilmesini gerektirdiği bir aracı reddetmiyor. |
| `policy/tools-profile-unapproved`                        | Yapılandırılmış genel veya ajan başına araç profili izin listesinin dışında.       |
| `policy/tools-fs-workspace-only-required`                | Dosya sistemi araçları yalnızca çalışma alanı yolu duruşuyla yapılandırılmamış.    |
| `policy/tools-exec-security-unapproved`                  | Yürütme güvenlik modu, politika izin listesinin dışında.                           |
| `policy/tools-exec-ask-unapproved`                       | Yürütme sorma modu, politika izin listesinin dışında.                              |
| `policy/tools-exec-host-unapproved`                      | Yürütme ana makine yönlendirmesi, politika izin listesinin dışında.                |
| `policy/tools-elevated-enabled`                          | Politika reddettiği hâlde yükseltilmiş araç modu etkin.                            |
| `policy/tools-also-allow-missing`                        | Yapılandırılmış bir `alsoAllow` listesinde politikanın gerektirdiği bir girdi eksik. |
| `policy/tools-also-allow-unexpected`                     | Yapılandırılmış bir `alsoAllow` listesi, politikanın beklemediği bir girdi içeriyor. |
| `policy/tools-required-deny-missing`                     | Genel veya ajan başına araç reddetme listesi, reddedilmesi gereken bir aracı içermiyor. |
| `policy/sandbox-mode-unapproved`                         | Korumalı alan modu, politika izin listesinin dışında.                              |
| `policy/sandbox-backend-unapproved`                      | Korumalı alan arka ucu, politika izin listesinin dışında.                          |
| `policy/sandbox-container-posture-unobservable`          | Bir kapsayıcı duruşu kuralı, bunu gözlemleyemeyen bir arka uç için etkin.           |
| `policy/sandbox-container-host-network-denied`           | Kapsayıcı tabanlı bir korumalı alan veya tarayıcı, ana makine ağ modunu kullanıyor. |
| `policy/sandbox-container-namespace-join-denied`         | Kapsayıcı tabanlı bir korumalı alan veya tarayıcı başka bir kapsayıcının ad alanına katılıyor. |
| `policy/sandbox-container-mount-mode-required`           | Kapsayıcı tabanlı bir korumalı alan veya tarayıcı bağlama noktası salt okunur değil. |
| `policy/sandbox-container-runtime-socket-mount`          | Kapsayıcı tabanlı bir korumalı alan veya tarayıcı bağlama noktası, kapsayıcı çalışma zamanı yuvasını açığa çıkarıyor. |
| `policy/sandbox-container-unconfined-profile`            | Politika reddettiği hâlde kapsayıcı korumalı alan profili sınırsız.                |
| `policy/sandbox-browser-cdp-source-range-missing`        | Politika gerektirdiği hâlde korumalı alan tarayıcısının CDP kaynak aralığı eksik.  |
| `policy/data-handling-redaction-disabled`                | Politika gerektirdiği hâlde hassas günlük kaydı maskelemesi devre dışı.            |
| `policy/data-handling-telemetry-content-capture`         | Politika reddettiği hâlde telemetri içerik yakalama etkin.                         |
| `policy/data-handling-session-retention-not-enforced`    | Politika gerektirdiği hâlde oturum saklama bakımı uygulanmıyor.                    |
| `policy/data-handling-session-transcript-memory-enabled` | Politika reddettiği hâlde oturum dökümü bellek dizinleme etkin.                     |
| `policy/secrets-unmanaged-provider`                      | Bir yapılandırma SecretRef'i, `secrets.providers` altında bildirilmemiş bir sağlayıcıya başvuruyor. |
| `policy/secrets-denied-provider-source`                  | Bir yapılandırma gizli bilgi sağlayıcısı veya SecretRef, politika tarafından reddedilen bir kaynak kullanıyor. |
| `policy/secrets-insecure-provider`                       | Politika reddettiği hâlde bir gizli bilgi sağlayıcısı güvenli olmayan duruşu seçiyor. |
| `policy/auth-profile-invalid-metadata`                   | Bir yapılandırma kimlik doğrulama profilinde geçerli sağlayıcı veya mod meta verisi eksik. |
| `policy/auth-profile-unapproved-mode`                    | Bir yapılandırma kimlik doğrulama profili modu, politika izin listesinin dışında.  |
| `policy/exec-approvals-missing`                          | Politika `exec-approvals.json` gerektiriyor ancak yapıt eksik.                     |
| `policy/exec-approvals-invalid`                          | Yapılandırılmış yürütme onayları yapıtı ayrıştırılamıyor.                          |
| `policy/exec-approvals-default-security-unapproved`      | Yürütme onayı varsayılanları, politika izin listesinin dışındaki bir güvenlik modunu kullanıyor. |
| `policy/exec-approvals-agent-security-unapproved`        | Ajan başına geçerli yürütme onayı güvenlik modu, izin listesinin dışında.           |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Politika reddettiği hâlde bir yürütme onayı ajanı, Skills CLI'larına örtük olarak otomatik izin veriyor. |
| `policy/exec-approvals-allowlist-missing`                | Onaylar izin listesinde politikanın gerektirdiği bir desen eksik.                  |
| `policy/exec-approvals-allowlist-unexpected`             | Onaylar izin listesi, politikanın beklemediği bir desen içeriyor.                  |
| `policy/tools-missing-risk-level`                        | Yönetilen bir araç bildiriminde risk meta verisi eksik.                            |
| `policy/tools-unknown-risk-level`                        | Yönetilen bir araç bildirimi bilinmeyen bir risk değeri kullanıyor.                |
| `policy/tools-missing-sensitivity-token`                 | Yönetilen bir araç bildiriminde hassasiyet meta verisi eksik.                      |
| `policy/tools-missing-owner`                             | Yönetilen bir araç bildiriminde sahip meta verisi eksik.                           |
| `policy/tools-unknown-sensitivity-token`                 | Yönetilen bir araç bildirimi bilinmeyen bir hassasiyet değeri kullanıyor.          |

Bir bulgu hem `target` (uyumsuzluk gösteren gözlemlenmiş çalışma alanı öğesi)
hem de `requirement` (bunun bulgu sayılmasına neden olan yazılmış kural)
içerebilir. Günümüzde ikisi de `oc://` adres dizeleridir ancak alan adları,
adres biçiminden ziyade politika rolünü tanımlar.

Örnek bulgular:

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

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Gateway node command 'system.run' is denied by policy but not denied by OpenClaw config.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Add 'system.run' to gateway.nodes.denyCommands or update policy after review."
}
```

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

`doctor --fix`, yalnızca `workspaceRepairs` açıkça etkinleştirildiğinde politika tarafından yönetilen çalışma alanı ayarlarını düzenler; aksi takdirde denetimler neleri onaracaklarını bildirir ve ayarları değiştirmeden bırakır.

Bu sürümde onarım, `channels.denyRules` tarafından reddedilen kanalları devre dışı bırakabilir ve aşağıda listelenen otomatik daraltma onarımlarını uygulayabilir. Geçerli bir kural çalışma alanı yapılandırmasını değiştirebileceğinden, `workspaceRepairs` seçeneğini yalnızca politika dosyası incelendikten sonra etkinleştirin:

- genel bir politika yükseltilmiş araçları yasakladığında `tools.elevated.enabled=false` olarak ayarla
- politika bu araçların reddedilmesini gerektirdiğinde eksik zorunlu ret aracı kimliklerini `tools.deny` veya `agents.list[].tools.deny` öğesine ekle
- güvenli olmayan `gateway.controlUi.*` anahtarlarını `false` olarak ayarla
- politika uzak Gateway modunu reddettiğinde `gateway.mode=local` olarak ayarla
- politika Gateway HTTP API uç noktalarını reddettiğinde bildirilen `gateway.http.endpoints.*.enabled` yollarını `false` olarak ayarla
- politika açık grup girişini reddettiğinde bildirilen kanal girişi `groupPolicy` yollarını `allowlist` olarak ayarla
- politika grup bahsetmelerini gerektirdiğinde bildirilen kanal girişi `requireMention` yollarını `true` olarak ayarla
- politika hassas günlük kaydı verilerinin gizlenmesini gerektirdiğinde `logging.redactSensitive=tools` olarak ayarla
- politika telemetri içeriği yakalamayı reddettiğinde `diagnostics.otel.captureContent=false` veya nesne biçimindeki telemetri yakalama ayarları için `diagnostics.otel.captureContent.enabled=false` olarak ayarla

Kapsamlı yükseltilmiş araç onarımları yalnızca algılama amaçlıdır. Bulgu paylaşılan günlük kaydı veya telemetri yapılandırmasını bildirdiğinde kapsamlı veri işleme onarımları da atlanır; çünkü paylaşılan ayarın değiştirilmesi, kapsamlı politika hedefinden daha fazlasını etkiler.

Bulgu devralınan kök `tools.deny` öğesini bildirdiğinde kapsamlı zorunlu ret onarımları atlanır; çünkü gerekli aracın kök yapılandırmasına eklenmesi, kapsamlı politika hedefinden daha fazlasını etkiler. Aracıya özgü zorunlu ret onarımları, bildirilen `agents.list[].tools.deny` yolunu güncelleyebilir.

Bulgu devralınan `channels.defaults.*` öğesini bildirdiğinde kapsamlı kanal girişi onarımları atlanır; çünkü paylaşılan kanal varsayılanının değiştirilmesi, kapsamlı politika hedefinden daha fazlasını etkiler. Gateway HTTP URL getirme izin listesi bulguları manuel olarak kalır; çünkü otomatik onarım doğru uç nokta URL izin listesi değerlerini seçemez.

Gateway bağlama ve Node komutu bulguları inceleme gerektirmeye devam eder. `policy/gateway-non-loopback-bind` veya `policy/gateway-node-command-denied` bir yapılandırma yoluyla eşleştirilebildiğinde, `doctor --fix` önerilen `gateway.bind` veya `gateway.nodes.denyCommands` değişikliğini atlanmış önizleme rehberliği olarak bildirir. Değişikliği uygulamaz ve bir operatör yapılandırmayı veya politikayı inceleyip güncelleyene kadar bulgu onarılmış sayılmaz.

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

| Komut            | `0`                                                          | `1`                                                                     | `2`                          |
| ---------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | Eşikte herhangi bir bulgu yok.                               | Bir veya daha fazla bulgu eşiğe ulaştı.                                 | Bağımsız değişken veya çalışma zamanı hatası. |
| `policy compare` | Politika dosyası en az temel ölçüt kadar katıdır.             | Politika dosyası geçersiz, eksik veya temel ölçüt kurallarından zayıftır. | Bağımsız değişken veya çalışma zamanı hatası. |
| `policy watch`   | Bulgu yok ve kabul edilen karma değer güncel.                 | Bulgular mevcut veya kabul edilen doğrulama güncel değil.                | Bağımsız değişken veya çalışma zamanı hatası. |

## İlgili

- [Doctor lint modu](/tr/cli/doctor#lint-mode)
- [Yol CLI'si](/tr/cli/path)
