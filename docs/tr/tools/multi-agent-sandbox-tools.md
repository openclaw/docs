---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Agent başına sandbox + tool kısıtlamaları, öncelik sırası ve örnekler
title: Çoklu agent sandbox ve araçlar
x-i18n:
    generated_at: "2026-04-26T11:42:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b8d24252b03dbcd00a5eefcc8e58bd51577a99ae057008f19a0acc4016413ea
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

Çoklu agent kurulumunda her agent, genel sandbox ve tool politikasını geçersiz kılabilir. Bu sayfa, agent başına yapılandırmayı, öncelik kurallarını ve örnekleri kapsar.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/tr/gateway/sandboxing">
    Arka uçlar ve modlar — tam sandbox referansı.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/tr/gateway/sandbox-vs-tool-policy-vs-elevated">
    "Bu neden engellendi?" sorusunu hata ayıklayın.
  </Card>
  <Card title="Elevated mode" href="/tr/tools/elevated">
    Güvenilen göndericiler için elevated exec.
  </Card>
</CardGroup>

<Warning>
Kimlik doğrulama agent başınadır: her agent, kendi `agentDir` kimlik doğrulama deposunu `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` konumundan okur. Kimlik bilgileri agent'lar arasında **paylaşılmaz**. `agentDir` değerini agent'lar arasında asla yeniden kullanmayın. Kimlik bilgilerini paylaşmak istiyorsanız, `auth-profiles.json` dosyasını diğer agent'ın `agentDir` konumuna kopyalayın.
</Warning>

---

## Yapılandırma örnekleri

<AccordionGroup>
  <Accordion title="Örnek 1: Kişisel + kısıtlı aile agent'ı">
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
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
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

    - `main` agent'ı: ana makinede çalışır, tüm tool erişimine sahiptir.
    - `family` agent'ı: Docker içinde çalışır (agent başına bir container), yalnızca `read` tool'u vardır.

  </Accordion>
  <Accordion title="Örnek 2: Paylaşılan sandbox ile iş agent'ı">
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
  <Accordion title="Örnek 2b: Genel kodlama profili + yalnızca mesajlaşma agent'ı">
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

    - varsayılan agent'lar kodlama araçlarını alır.
    - `support` agent'ı yalnızca mesajlaşma içindir (+ Slack tool'u).

  </Accordion>
  <Accordion title="Örnek 3: Agent başına farklı sandbox modları">
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

Hem genel (`agents.defaults.*`) hem de agent'a özgü (`agents.list[].*`) yapılandırmalar mevcut olduğunda:

### Sandbox yapılandırması

Agent'a özgü ayarlar geneli geçersiz kılar:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*`, o agent için `agents.defaults.sandbox.{docker,browser,prune}.*` değerlerini geçersiz kılar (sandbox kapsamı `"shared"` olarak çözümlendiğinde yok sayılır).
</Note>

### Tool kısıtlamaları

Filtreleme sırası şöyledir:

<Steps>
  <Step title="Tool profili">
    `tools.profile` veya `agents.list[].tools.profile`.
  </Step>
  <Step title="Sağlayıcı tool profili">
    `tools.byProvider[provider].profile` veya `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Genel tool politikası">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Sağlayıcı tool politikası">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Agent'a özgü tool politikası">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Agent sağlayıcı politikası">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Sandbox tool politikası">
    `tools.sandbox.tools` veya `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Alt agent tool politikası">
    Uygulanabiliyorsa `tools.subagents.tools`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Öncelik kuralları">
    - Her seviye tool'ları daha da kısıtlayabilir, ancak önceki seviyelerde reddedilmiş tool'ları geri veremez.
    - `agents.list[].tools.sandbox.tools` ayarlanmışsa, o agent için `tools.sandbox.tools` değerinin yerini alır.
    - `agents.list[].tools.profile` ayarlanmışsa, o agent için `tools.profile` değerini geçersiz kılar.
    - Sağlayıcı tool anahtarları `provider` (ör. `google-antigravity`) veya `provider/model` (ör. `openai/gpt-5.4`) biçimlerini kabul eder.

  </Accordion>
  <Accordion title="Boş izin listesi davranışı">
    Bu zincirdeki herhangi bir açık izin listesi, çalıştırmayı çağrılabilir tool olmadan bırakırsa, OpenClaw prompt'u modele göndermeden önce durur. Bu kasıtlıdır: `agents.list[].tools.allow: ["query_db"]` gibi eksik bir tool ile yapılandırılmış bir agent, `query_db` kaydeden Plugin etkinleştirilene kadar sessizce yalnızca metin tabanlı bir agent olarak devam etmemeli, belirgin şekilde başarısız olmalıdır.
  </Accordion>
</AccordionGroup>

Tool politikaları, birden çok tool'a genişleyen `group:*` kısaltmalarını destekler. Tam liste için bkz. [Tool groups](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Agent başına elevated geçersiz kılmaları (`agents.list[].tools.elevated`), belirli agent'lar için elevated exec'i daha da kısıtlayabilir. Ayrıntılar için bkz. [Elevated mode](/tr/tools/elevated).

---

## Tek agent'tan geçiş

<Tabs>
  <Tab title="Önce (tek agent)">
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
  <Tab title="Sonra (çoklu agent)">
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
Eski `agent.*` yapılandırmaları `openclaw doctor` tarafından taşınır; bundan sonra `agents.defaults` + `agents.list` tercih edilmelidir.
</Note>

---

## Tool kısıtlama örnekleri

<Tabs>
  <Tab title="Salt okunur agent">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Güvenli yürütme (dosya değişikliği yok)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
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

    Bu profilde `sessions_history`, ham bir transkript dökümü yerine yine sınırlı ve temizlenmiş bir geri çağırma görünümü döndürür. Assistant geri çağırması, akıl yürütme etiketlerini, `<relevant-memories>` iskeletini, düz metin tool-call XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş tool-call blokları dahil), düşürülmüş tool-call iskeletini, sızmış ASCII/tam genişlikte model kontrol token'larını ve bozuk MiniMax tool-call XML'ini sansürleme/kırpmadan önce kaldırır.

  </Tab>
</Tabs>

---

## Yaygın tuzak: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"`, agent kimliğine değil `session.mainKey` değerine (varsayılan `"main"`) dayanır. Grup/kanal oturumları her zaman kendi anahtarlarını alır, bu yüzden non-main olarak değerlendirilir ve sandbox içine alınır. Bir agent'ın asla sandbox kullanmamasını istiyorsanız, `agents.list[].sandbox.mode: "off"` ayarlayın.
</Warning>

---

## Test etme

Çoklu agent sandbox ve tool'ları yapılandırdıktan sonra:

<Steps>
  <Step title="Agent çözümlemesini kontrol edin">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Sandbox container'larını doğrulayın">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Tool kısıtlamalarını test edin">
    - Kısıtlı tool'lar gerektiren bir mesaj gönderin.
    - Agent'ın reddedilmiş tool'ları kullanamadığını doğrulayın.

  </Step>
  <Step title="Günlükleri izleyin">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Sorun giderme

<AccordionGroup>
  <Accordion title="`mode: 'all'` olmasına rağmen agent sandbox içinde değil">
    - Bunu geçersiz kılan genel bir `agents.defaults.sandbox.mode` olup olmadığını kontrol edin.
    - Agent'a özgü yapılandırma önceliklidir, bu yüzden `agents.list[].sandbox.mode: "all"` ayarlayın.

  </Accordion>
  <Accordion title="Reddetme listesine rağmen tool'lar hâlâ kullanılabiliyor">
    - Tool filtreleme sırasını kontrol edin: genel → agent → sandbox → alt agent.
    - Her seviye yalnızca daha da kısıtlayabilir, geri veremez.
    - Günlüklerle doğrulayın: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Container agent başına izole değil">
    - Agent'a özgü sandbox yapılandırmasında `scope: "agent"` ayarlayın.
    - Varsayılan `"session"` değeridir ve oturum başına bir container oluşturur.

  </Accordion>
</AccordionGroup>

---

## İlgili

- [Elevated mode](/tr/tools/elevated)
- [Çoklu agent yönlendirme](/tr/concepts/multi-agent)
- [Sandbox yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs tool policy vs elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) — "bu neden engellendi?" hata ayıklaması
- [Sandboxing](/tr/gateway/sandboxing) — tam sandbox referansı (modlar, kapsamlar, arka uçlar, imajlar)
- [Oturum yönetimi](/tr/concepts/session)
