---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Ajan başına korumalı alan ve araç kısıtlamaları, öncelik sırası ve örnekler
title: Çok ajanlı korumalı alan ve araçlar
x-i18n:
    generated_at: "2026-05-10T19:58:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: c988613438f2d179b859902d3f7a39a1e29b60a0e2ae6ed598bb5f5881cf0b9f
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Çok aracılı bir kurulumda her aracı, genel sandbox ve araç ilkesini geçersiz kılabilir. Bu sayfa aracı başına yapılandırmayı, öncelik kurallarını ve örnekleri kapsar.

<CardGroup cols={3}>
  <Card title="Sandboxlama" href="/tr/gateway/sandboxing">
    Arka uçlar ve modlar — tam sandbox başvurusu.
  </Card>
  <Card title="Sandbox ile araç ilkesi ile yükseltilmiş karşılaştırması" href="/tr/gateway/sandbox-vs-tool-policy-vs-elevated">
    "Bu neden engellendi?" sorusunda hata ayıklayın
  </Card>
  <Card title="Yükseltilmiş mod" href="/tr/tools/elevated">
    Güvenilen gönderenler için yükseltilmiş exec.
  </Card>
</CardGroup>

<Warning>
Kimlik doğrulama aracı kapsamındadır: her aracının `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` konumunda kendi `agentDir` kimlik doğrulama deposu vardır. `agentDir` değerini aracılar arasında asla yeniden kullanmayın. Aracılar yerel profilleri olmadığında varsayılan/ana aracının kimlik doğrulama profillerini okuyabilir, ancak OAuth yenileme token'ları ikincil aracı depolarına klonlanmaz. Kimlik bilgilerini elle kopyalarsanız yalnızca taşınabilir statik `api_key` veya `token` profillerini kopyalayın.
</Warning>

---

## Yapılandırma örnekleri

<AccordionGroup>
  <Accordion title="Örnek 1: Kişisel + kısıtlı aile aracısı">
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

    - `main` aracısı: ana makinede çalışır, tam araç erişimi vardır.
    - `family` aracısı: Docker içinde çalışır (aracı başına bir konteyner), yalnızca `read` aracı.

  </Accordion>
  <Accordion title="Örnek 2: Paylaşılan sandbox ile iş aracısı">
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

    - varsayılan aracılar kodlama araçlarını alır.
    - `support` aracısı yalnızca mesajlaşma içindir (+ Slack aracı).

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

Hem genel (`agents.defaults.*`) hem de aracıya özgü (`agents.list[].*`) yapılandırmalar varsa:

### Sandbox yapılandırması

Aracıya özgü ayarlar genel ayarları geçersiz kılar:

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
`agents.list[].sandbox.{docker,browser,prune}.*`, o aracı için `agents.defaults.sandbox.{docker,browser,prune}.*` değerini geçersiz kılar (sandbox kapsamı `"shared"` olarak çözümlendiğinde yok sayılır).
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
  <Step title="Genel araç ilkesi">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Sağlayıcı araç ilkesi">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Aracıya özgü araç ilkesi">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Aracı sağlayıcı ilkesi">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Sandbox araç ilkesi">
    `tools.sandbox.tools` veya `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Alt aracı araç ilkesi">
    Varsa `tools.subagents.tools`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Öncelik kuralları">
    - Her seviye araçları daha da kısıtlayabilir, ancak önceki seviyelerde reddedilen araçları geri veremez.
    - `agents.list[].tools.sandbox.tools` ayarlanmışsa, o aracı için `tools.sandbox.tools` değerinin yerini alır.
    - `agents.list[].tools.profile` ayarlanmışsa, o aracı için `tools.profile` değerini geçersiz kılar.
    - Sağlayıcı araç anahtarları `provider` (örn. `google-antigravity`) veya `provider/model` (örn. `openai/gpt-5.4`) kabul eder.

  </Accordion>
  <Accordion title="Boş izin listesi davranışı">
    Bu zincirdeki herhangi bir açık izin listesi çalıştırmayı çağrılabilir araçsız bırakırsa, OpenClaw istemi modele göndermeden önce durur. Bu bilinçlidir: `agents.list[].tools.allow: ["query_db"]` gibi eksik bir araçla yapılandırılmış bir aracı, `query_db` kaydeden Plugin etkinleştirilene kadar açıkça başarısız olmalı, yalnızca metin aracısı olarak devam etmemelidir.
  </Accordion>
</AccordionGroup>

Araç ilkeleri, birden fazla araca genişleyen `group:*` kısayollarını destekler. Tam liste için [Araç grupları](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) bölümüne bakın.

Aracı başına yükseltilmiş geçersiz kılmalar (`agents.list[].tools.elevated`), belirli aracılar için yükseltilmiş exec kullanımını daha da kısıtlayabilir. Ayrıntılar için [Yükseltilmiş mod](/tr/tools/elevated) bölümüne bakın.

---

## Tek aracıdan geçiş

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
Eski `agent.*` yapılandırmaları `openclaw doctor` tarafından taşınır; ileride `agents.defaults` + `agents.list` tercih edin.
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
  <Tab title="Dosya sistemi araçları devre dışıyken shell yürütme">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Bu ilke OpenClaw dosya sistemi araçlarını devre dışı bırakır, ancak `exec` hâlâ bir shell'dir ve seçili ana makine ya da sandbox dosya sisteminin izin verdiği her yere dosya yazabilir. Salt okunur bir aracı için `exec` ve `process` değerlerini reddedin veya shell erişimini `agents.defaults.sandbox.workspaceAccess: "ro"` ya da `"none"` gibi sandbox dosya sistemi denetimleriyle birleştirin.
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

    Bu profildeki `sessions_history`, ham transcript dökümü yerine yine de sınırlı, arındırılmış bir hatırlama görünümü döndürür. Asistan hatırlaması; düşünme etiketlerini, `<relevant-memories>` iskeletini, düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil), derecesi düşürülmüş araç çağrısı iskeletini, sızmış ASCII/tam genişlikli model denetim token'larını ve hatalı biçimlendirilmiş MiniMax araç çağrısı XML'ini redaksiyon/kısaltma öncesinde kaldırır.

  </Tab>
</Tabs>

---

## Yaygın tuzak: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` aracı kimliğine değil, `session.mainKey` değerine (varsayılan `"main"`) dayanır. Grup/kanal oturumları her zaman kendi anahtarlarını alır, bu nedenle ana olmayan olarak değerlendirilir ve sandbox'a alınır. Bir aracının asla sandbox'a alınmamasını istiyorsanız `agents.list[].sandbox.mode: "off"` ayarlayın.
</Warning>

---

## Test etme

Çok aracılı sandbox ve araçları yapılandırdıktan sonra:

<Steps>
  <Step title="Aracı çözümlemesini denetleyin">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Sandbox konteynerlerini doğrulayın">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Araç kısıtlamalarını test edin">
    - Kısıtlı araçlar gerektiren bir mesaj gönderin.
    - Aracının reddedilen araçları kullanamadığını doğrulayın.

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
  <Accordion title="`mode: 'all'` olmasına rağmen aracı sandbox'a alınmadı">
    - Bunu geçersiz kılan genel bir `agents.defaults.sandbox.mode` olup olmadığını denetleyin.
    - Aracıya özgü yapılandırma önceliklidir; bu yüzden `agents.list[].sandbox.mode: "all"` ayarlayın.

  </Accordion>
  <Accordion title="Reddetme listesine rağmen araçlar hâlâ kullanılabilir">
    - Araç filtreleme sırasını denetleyin: genel → aracı → sandbox → alt aracı.
    - Her seviye yalnızca daha da kısıtlayabilir, geri izin veremez.
    - Günlüklerle doğrulayın: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Konteyner aracı başına yalıtılmış değil">
    - Aracıya özgü sandbox yapılandırmasında `scope: "agent"` ayarlayın.
    - Varsayılan değer, oturum başına bir konteyner oluşturan `"session"` değeridir.

  </Accordion>
</AccordionGroup>

---

## İlgili

- [Yükseltilmiş mod](/tr/tools/elevated)
- [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)
- [Korumalı alan yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- [Korumalı alan, araç ilkesi ve yükseltilmiş mod](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) — "bu neden engellendi?" hata ayıklaması
- [Korumalı alan kullanımı](/tr/gateway/sandboxing) — tam korumalı alan referansı (modlar, kapsamlar, arka uçlar, imajlar)
- [Oturum yönetimi](/tr/concepts/session)
