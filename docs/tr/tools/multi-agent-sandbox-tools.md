---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Ajan başına sandbox + araç kısıtlamaları, öncelik sırası ve örnekler
title: Çok ajanlı korumalı alan ve araçlar
x-i18n:
    generated_at: "2026-07-12T12:53:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Çok aracılı bir kurulumdaki her aracı, genel sandbox ve araç politikasını geçersiz kılabilir. Bu sayfa aracı başına yapılandırmayı, öncelik kurallarını ve örnekleri kapsar.

<CardGroup cols={3}>
  <Card title="Sandbox kullanımı" href="/tr/gateway/sandboxing">
    Arka uçlar ve modlar — eksiksiz sandbox başvurusu.
  </Card>
  <Card title="Sandbox, araç politikası ve yükseltilmiş mod karşılaştırması" href="/tr/gateway/sandbox-vs-tool-policy-vs-elevated">
    "Bu neden engelleniyor?" sorununu ayıklayın.
  </Card>
  <Card title="Yükseltilmiş mod" href="/tr/tools/elevated">
    Güvenilir göndericiler için yükseltilmiş komut yürütme.
  </Card>
</CardGroup>

<Warning>
Kimlik doğrulama aracı kapsamında tutulur: her aracının `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` içinde kendi `agentDir` kimlik doğrulama deposu vardır. `agentDir` dizinini hiçbir zaman aracılar arasında yeniden kullanmayın. Aracılar yerel bir profile sahip olmadıklarında varsayılan/ana aracının kimlik doğrulama profillerini okuyabilir, ancak OAuth yenileme belirteçleri ikincil aracı depolarına kopyalanmaz. Kimlik bilgilerini elle kopyalarsanız yalnızca taşınabilir statik `api_key` veya `token` profillerini kopyalayın.
</Warning>

---

## Yapılandırma örnekleri

<AccordionGroup>
  <Accordion title="Örnek 1: Kişisel aracı + kısıtlı aile aracısı">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "name": "Personal Assistant",
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "family",
            "name": "Family Bot",
            "workspace": "~/.openclaw/workspace-family",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read", "message"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"],
              "message": {
                "crossContext": {
                  "allowWithinProvider": false,
                  "allowAcrossProviders": false
                }
              }
            }
          }
        ]
      },
      "bindings": [
        {
          "agentId": "family",
          "match": {
            "provider": "whatsapp",
            "accountId": "*",
            "peer": {
              "kind": "group",
              "id": "120363424282127706@g.us"
            }
          }
        }
      ]
    }
    ```

    **Sonuç:**

    - `main` aracısı: ana sistemde çalışır ve tüm araçlara erişebilir.
    - `family` aracısı: Docker'da çalışır (aracı başına bir kapsayıcı) ve yalnızca `read` aracını ve mevcut konuşmaya mesaj göndermeyi kullanabilir.

  </Accordion>
  <Accordion title="Örnek 2: Paylaşılan sandbox kullanan iş aracısı">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "personal",
            "workspace": "~/.openclaw/workspace-personal",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "work",
            "workspace": "~/.openclaw/workspace-work",
            "sandbox": {
              "mode": "all",
              "scope": "shared",
              "workspaceRoot": "/tmp/work-sandboxes"
            },
            "tools": {
              "allow": ["read", "write", "apply_patch", "exec"],
              "deny": ["browser", "gateway", "discord"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="Örnek 2b: Genel kodlama profili + yalnızca mesajlaşma aracısı">
    ```json
    {
      "tools": { "profile": "coding" },
      "agents": {
        "list": [
          {
            "id": "support",
            "tools": { "profile": "messaging", "allow": ["slack"] }
          }
        ]
      }
    }
    ```

    **Sonuç:**

    - Varsayılan aracılar kodlama araçlarını kullanır.
    - `support` aracısı yalnızca mesajlaşma araçlarını (+ Slack aracı) kullanır.

  </Accordion>
  <Accordion title="Örnek 3: Aracı başına farklı sandbox modları">
    ```json
    {
      "agents": {
        "defaults": {
          "sandbox": {
            "mode": "non-main",
            "scope": "session"
          }
        },
        "list": [
          {
            "id": "main",
            "workspace": "~/.openclaw/workspace",
            "sandbox": {
              "mode": "off"
            }
          },
          {
            "id": "public",
            "workspace": "~/.openclaw/workspace-public",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

---

## Yapılandırma önceliği

Hem genel (`agents.defaults.*`) hem de aracıya özgü (`agents.list[].*`) yapılandırmalar mevcut olduğunda:

### Sandbox yapılandırması

Aracıya özgü ayarlar genel ayarları geçersiz kılar:

```text
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*`, ilgili aracı için `agents.defaults.sandbox.{docker,browser,prune}.*` ayarlarını geçersiz kılar (sandbox kapsamı `"shared"` olarak çözümlendiğinde yok sayılır).
</Note>

### Araç kısıtlamaları

Filtreleme sırası şöyledir:

<Steps>
  <Step title="Araç profili">
    `tools.profile` veya `agents.list[].tools.profile`.
  </Step>
  <Step title="Sağlayıcı araç profili">
    `tools.byProvider[provider].profile` veya `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Genel araç politikası">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Sağlayıcı araç politikası">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Aracıya özgü araç politikası">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Aracı sağlayıcı politikası">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Sandbox araç politikası">
    `tools.sandbox.tools` veya `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Alt aracı araç politikası">
    Uygunsa `tools.subagents.tools`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Öncelik kuralları">
    - Her düzey araçları daha fazla kısıtlayabilir, ancak önceki düzeylerde reddedilen araçlara yeniden izin veremez.
    - `agents.list[].tools.sandbox.tools` ayarlanırsa ilgili aracı için `tools.sandbox.tools` ayarının yerini alır.
    - `agents.list[].tools.profile` ayarlanırsa ilgili aracı için `tools.profile` ayarını geçersiz kılar.
    - Sağlayıcı araç anahtarları `provider` (ör. `google-antigravity`) veya `provider/model` (ör. `openai/gpt-5.4`) biçimini kabul eder.

  </Accordion>
  <Accordion title="Boş izin listesi davranışı">
    Bu zincirdeki herhangi bir açık izin listesi, çalıştırma için çağrılabilir hiçbir araç bırakmazsa OpenClaw istemi modele göndermeden önce durur. Bu kasıtlıdır: `agents.list[].tools.allow: ["query_db"]` gibi eksik bir araçla yapılandırılmış bir aracı, `query_db` aracını kaydeden Plugin etkinleştirilene kadar açıkça başarısız olmalı; yalnızca metin kullanan bir aracı olarak devam etmemelidir.
  </Accordion>
</AccordionGroup>

Araç politikaları, birden çok araca genişletilen `group:*` kısaltmalarını destekler. Tam liste için [Araç grupları](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) bölümüne bakın.

Aracı başına yükseltilmiş mod geçersiz kılmaları (`agents.list[].tools.elevated`), belirli aracılar için yükseltilmiş komut yürütmeyi daha da kısıtlayabilir. Ayrıntılar için [Yükseltilmiş mod](/tr/tools/elevated) bölümüne bakın.

---

## Tek aracılı yapıdan geçiş

<Tabs>
  <Tab title="Önce (tek aracı)">
    ```json
    {
      "agents": {
        "defaults": {
          "workspace": "~/.openclaw/workspace",
          "sandbox": {
            "mode": "non-main"
          }
        }
      },
      "tools": {
        "sandbox": {
          "tools": {
            "allow": ["read", "write", "apply_patch", "exec"],
            "deny": []
          }
        }
      }
    }
    ```
  </Tab>
  <Tab title="Sonra (çok aracılı)">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          }
        ]
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
Eski `agents.defaults.*`/`agents.list[].*` yapılandırma anahtarları (`sandbox.perSession`, `agentRuntime`, `embeddedPi` gibi) `openclaw doctor` tarafından taşınır; bundan sonra `agents.defaults` + `agents.list` kullanımını tercih edin.
</Note>

---

## Araç kısıtlama örnekleri

<Tabs>
  <Tab title="Salt okunur aracı">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Dosya sistemi araçları devre dışıyken kabuk komutu yürütme">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Bu politika OpenClaw dosya sistemi araçlarını devre dışı bırakır, ancak `exec` hâlâ bir kabuktur ve seçilen ana sistemin veya sandbox dosya sisteminin izin verdiği her yere dosya yazabilir. Salt okunur bir aracı için `exec` ve `process` araçlarını reddedin veya kabuk erişimini `agents.defaults.sandbox.workspaceAccess: "ro"` ya da `"none"` gibi sandbox dosya sistemi denetimleriyle birleştirin.
    </Warning>

  </Tab>
  <Tab title="Yalnızca iletişim">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    Bu profildeki `sessions_history`, ham bir döküm yerine yine de sınırlı ve temizlenmiş bir hatırlama görünümü döndürür. Asistan hatırlaması; düşünme etiketlerini, `<relevant-memories>` iskeletini, düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dâhil), düzeyi düşürülmüş araç çağrısı iskeletini, sızmış ASCII/tam genişlikli model denetim belirteçlerini ve hatalı biçimlendirilmiş MiniMax araç çağrısı XML'ini karartma/kısaltma işleminden önce kaldırır.

  </Tab>
</Tabs>

---

## Yaygın tuzak: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"`, oturum anahtarını aracı kimliğiyle değil ana oturum anahtarıyla (her zaman `"main"`; `session.mainKey` kullanıcı tarafından yapılandırılamaz ve OpenClaw diğer tüm değerler için uyarı verip bunları yok sayar) karşılaştırır. Grup/kanal oturumları her zaman kendi anahtarlarını alır; bu nedenle ana olmayan oturumlar olarak değerlendirilir ve sandbox içinde çalıştırılır. Bir aracının hiçbir zaman sandbox içinde çalıştırılmamasını istiyorsanız `agents.list[].sandbox.mode: "off"` ayarını kullanın.
</Warning>

---

## Test etme

Çok aracılı sandbox ve araçları yapılandırdıktan sonra:

<Steps>
  <Step title="Aracı çözümlemesini kontrol edin">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Sandbox kapsayıcılarını doğrulayın">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Araç kısıtlamalarını test edin">
    - Kısıtlanmış araçlar gerektiren bir mesaj gönderin.
    - Aracının reddedilen araçları kullanamadığını doğrulayın.

  </Step>
  <Step title="Günlükleri izleyin">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Sorun giderme

<AccordionGroup>
  <Accordion title="`mode: 'all'` olmasına rağmen aracı sandbox içinde çalışmıyor">
    - Bunu geçersiz kılan genel bir `agents.defaults.sandbox.mode` ayarı olup olmadığını kontrol edin.
    - Aracıya özgü yapılandırma öncelikli olduğundan `agents.list[].sandbox.mode: "all"` ayarını kullanın.

  </Accordion>
  <Accordion title="Reddetme listesine rağmen araçlar hâlâ kullanılabiliyor">
    - [Tam filtreleme sırasını](#tool-restrictions) kontrol edin: profil → sağlayıcı profili → genel politika → sağlayıcı politikası → ajan politikası → ajan sağlayıcı politikası → korumalı alan → alt ajan.
    - Her düzey yalnızca daha fazla kısıtlama uygulayabilir; erişimi yeniden veremez.
    - Adım adım hata ayıklama için [Korumalı alan, araç politikası ve yükseltilmiş mod karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) sayfasına bakın.

  </Accordion>
  <Accordion title="Kapsayıcı ajan başına yalıtılmıyor">
    - Varsayılan `scope` değeri `"agent"` şeklindedir (her ajan kimliği için bir kapsayıcı).
    - Oturum başına bir kapsayıcı için `scope: "session"` değerini ayarlayın veya ajanlar arasında tek bir kapsayıcıyı yeniden kullanmak için `scope: "shared"` değerini ayarlayın.

  </Accordion>
</AccordionGroup>

---

## İlgili konular

- [Yükseltilmiş mod](/tr/tools/elevated)
- [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)
- [Korumalı alan yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- [Korumalı alan, araç politikası ve yükseltilmiş mod karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) — “bu neden engellendi?” sorusunu hata ayıklama
- [Korumalı alan kullanımı](/tr/gateway/sandboxing) — tam korumalı alan başvurusu (modlar, kapsamlar, arka uçlar, kalıp görüntüleri)
- [Oturum yönetimi](/tr/concepts/session)
