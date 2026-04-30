---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Ajan başına sandbox + araç kısıtlamaları, öncelik sırası ve örnekler
title: Çok ajanlı korumalı alan ve araçlar
x-i18n:
    generated_at: "2026-04-30T09:49:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedb36301f670bcd8956dbeb81788acfc96627e39401e34434c2348fcb10f155
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Her agent, çok agentli bir kurulumda global sandbox ve araç ilkesini geçersiz kılabilir. Bu sayfa agent başına yapılandırmayı, öncelik kurallarını ve örnekleri kapsar.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/tr/gateway/sandboxing">
    Arka uçlar ve modlar — tam sandbox başvurusu.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/tr/gateway/sandbox-vs-tool-policy-vs-elevated">
    "bu neden engellendi?" sorununu ayıklayın
  </Card>
  <Card title="Elevated mode" href="/tr/tools/elevated">
    Güvenilen gönderenler için yükseltilmiş exec.
  </Card>
</CardGroup>

<Warning>
Kimlik doğrulama agent kapsamındadır: her agentın `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` konumunda kendi `agentDir` kimlik doğrulama deposu vardır. `agentDir` değerini agentlar arasında asla yeniden kullanmayın. Agentlar yerel profilleri olmadığında varsayılan/ana agentın kimlik doğrulama profillerini okuyabilir, ancak OAuth yenileme tokenları ikincil agent depolarına klonlanmaz. Kimlik bilgilerini elle kopyalarsanız yalnızca taşınabilir statik `api_key` veya `token` profillerini kopyalayın.
</Warning>

---

## Yapılandırma örnekleri

<AccordionGroup>
  <Accordion title="Example 1: Personal + restricted family agent">
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

    - `main` agentı: ana makinede çalışır, tam araç erişimi vardır.
    - `family` agentı: Docker içinde çalışır (agent başına bir container), yalnızca `read` aracı.

  </Accordion>
  <Accordion title="Example 2: Work agent with shared sandbox">
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
  <Accordion title="Example 2b: Global coding profile + messaging-only agent">
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

    - varsayılan agentlar kodlama araçlarını alır.
    - `support` agentı yalnızca mesajlaşma içindir (+ Slack aracı).

  </Accordion>
  <Accordion title="Example 3: Different sandbox modes per agent">
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

Hem global (`agents.defaults.*`) hem de agenta özgü (`agents.list[].*`) yapılandırmalar mevcut olduğunda:

### Sandbox yapılandırması

Agenta özgü ayarlar global ayarları geçersiz kılar:

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

### Araç kısıtlamaları

Filtreleme sırası şöyledir:

<Steps>
  <Step title="Tool profile">
    `tools.profile` veya `agents.list[].tools.profile`.
  </Step>
  <Step title="Provider tool profile">
    `tools.byProvider[provider].profile` veya `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Global tool policy">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Provider tool policy">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Agent-specific tool policy">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Agent provider policy">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Sandbox tool policy">
    `tools.sandbox.tools` veya `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Subagent tool policy">
    Uygunsa `tools.subagents.tools`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Precedence rules">
    - Her düzey araçları daha da kısıtlayabilir, ancak önceki düzeylerde reddedilen araçları geri veremez.
    - `agents.list[].tools.sandbox.tools` ayarlanmışsa, o agent için `tools.sandbox.tools` değerinin yerini alır.
    - `agents.list[].tools.profile` ayarlanmışsa, o agent için `tools.profile` değerini geçersiz kılar.
    - Sağlayıcı aracı anahtarları `provider` (örn. `google-antigravity`) veya `provider/model` (örn. `openai/gpt-5.4`) kabul eder.

  </Accordion>
  <Accordion title="Empty allowlist behavior">
    Bu zincirdeki herhangi bir açık izin listesi çalıştırmayı çağrılabilir araç kalmayacak şekilde bırakırsa, OpenClaw promptu modele göndermeden önce durur. Bu kasıtlıdır: `agents.list[].tools.allow: ["query_db"]` gibi eksik bir araçla yapılandırılmış bir agent, `query_db` kaydeden Plugin etkinleştirilene kadar belirgin biçimde başarısız olmalıdır; yalnızca metin agentı olarak devam etmemelidir.
  </Accordion>
</AccordionGroup>

Araç ilkeleri, birden çok araca genişleyen `group:*` kısaltmalarını destekler. Tam liste için [Araç grupları](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) bölümüne bakın.

Agent başına yükseltilmiş geçersiz kılmalar (`agents.list[].tools.elevated`), belirli agentlar için yükseltilmiş exec'i daha da kısıtlayabilir. Ayrıntılar için [Yükseltilmiş mod](/tr/tools/elevated) bölümüne bakın.

---

## Tek agenttan geçiş

<Tabs>
  <Tab title="Before (single agent)">
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
  <Tab title="After (multi-agent)">
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
Eski `agent.*` yapılandırmaları `openclaw doctor` tarafından taşınır; bundan sonra `agents.defaults` + `agents.list` tercih edin.
</Note>

---

## Araç kısıtlama örnekleri

<Tabs>
  <Tab title="Read-only agent">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Safe execution (no file modifications)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
  </Tab>
  <Tab title="Communication-only">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    Bu profildeki `sessions_history`, ham bir transkript dökümü yerine hâlâ sınırlı, temizlenmiş bir hatırlama görünümü döndürür. Assistant hatırlaması düşünme etiketlerini, `<relevant-memories>` iskeletini, düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil), seviyesi düşürülmüş araç çağrısı iskeletini, sızmış ASCII/tam genişlikli model kontrol tokenlarını ve hatalı biçimlendirilmiş MiniMax araç çağrısı XML'ini redaksiyon/kısaltma öncesinde kaldırır.

  </Tab>
</Tabs>

---

## Yaygın tuzak: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"`, agent kimliğine değil `session.mainKey` değerine (varsayılan `"main"`) dayanır. Grup/kanal oturumları her zaman kendi anahtarlarını alır, bu nedenle non-main olarak ele alınır ve sandbox içine alınır. Bir agentın asla sandbox içine alınmamasını istiyorsanız `agents.list[].sandbox.mode: "off"` ayarlayın.
</Warning>

---

## Test Etme

Çok agentli sandbox ve araçları yapılandırdıktan sonra:

<Steps>
  <Step title="Check agent resolution">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Verify sandbox containers">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Test tool restrictions">
    - Kısıtlanmış araçlar gerektiren bir mesaj gönderin.
    - Agentın reddedilen araçları kullanamadığını doğrulayın.

  </Step>
  <Step title="Monitor logs">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Sorun Giderme

<AccordionGroup>
  <Accordion title="Agent not sandboxed despite `mode: 'all'`">
    - Bunu geçersiz kılan global bir `agents.defaults.sandbox.mode` olup olmadığını denetleyin.
    - Agenta özgü yapılandırma önceliklidir, bu nedenle `agents.list[].sandbox.mode: "all"` ayarlayın.

  </Accordion>
  <Accordion title="Tools still available despite deny list">
    - Araç filtreleme sırasını denetleyin: global → agent → sandbox → alt agent.
    - Her düzey yalnızca daha fazla kısıtlayabilir, geri izin veremez.
    - Günlüklerle doğrulayın: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Container not isolated per agent">
    - Agenta özgü sandbox yapılandırmasında `scope: "agent"` ayarlayın.
    - Varsayılan değer `"session"` olup oturum başına bir container oluşturur.

  </Accordion>
</AccordionGroup>

---

## İlgili

- [Yükseltilmiş mod](/tr/tools/elevated)
- [Çok agentli yönlendirme](/tr/concepts/multi-agent)
- [Sandbox yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs araç ilkesi vs yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) — "bu neden engellendi?" sorununu ayıklama
- [Sandboxing](/tr/gateway/sandboxing) — tam sandbox başvurusu (modlar, kapsamlar, arka uçlar, imajlar)
- [Oturum yönetimi](/tr/concepts/session)
