---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Aracı başına sandbox + araç kısıtlamaları, öncelik sırası ve örnekler
title: Çok ajanlı korumalı alan ve araçlar
x-i18n:
    generated_at: "2026-05-11T20:38:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Çok ajanlı bir kurulumda her ajan, genel korumalı alan ve araç ilkesini geçersiz kılabilir. Bu sayfa ajan başına yapılandırmayı, öncelik kurallarını ve örnekleri kapsar.

<CardGroup cols={3}>
  <Card title="Korumalı alan kullanımı" href="/tr/gateway/sandboxing">
    Arka uçlar ve modlar — tam korumalı alan başvurusu.
  </Card>
  <Card title="Korumalı alan ile araç ilkesi ile yükseltilmiş" href="/tr/gateway/sandbox-vs-tool-policy-vs-elevated">
    "Bu neden engellendi?" hata ayıklaması
  </Card>
  <Card title="Yükseltilmiş mod" href="/tr/tools/elevated">
    Güvenilen göndericiler için yükseltilmiş exec.
  </Card>
</CardGroup>

<Warning>
Kimlik doğrulama ajan kapsamındadır: her ajanın `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` konumunda kendi `agentDir` kimlik doğrulama deposu vardır. `agentDir` değerini ajanlar arasında asla yeniden kullanmayın. Ajanlar yerel profilleri olmadığında varsayılan/ana ajanın kimlik doğrulama profillerini okuyabilir, ancak OAuth yenileme token'ları ikincil ajan depolarına kopyalanmaz. Kimlik bilgilerini elle kopyalıyorsanız, yalnızca taşınabilir statik `api_key` veya `token` profillerini kopyalayın.
</Warning>

---

## Yapılandırma örnekleri

<AccordionGroup>
  <Accordion title="Örnek 1: Kişisel + kısıtlı aile ajanı">
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

    - `main` ajanı: ana makinede çalışır, tam araç erişimine sahiptir.
    - `family` ajanı: Docker içinde çalışır (ajan başına bir kapsayıcı), yalnızca `read` ve geçerli konuşmaya ileti gönderimleri.

  </Accordion>
  <Accordion title="Örnek 2: Paylaşılan korumalı alana sahip iş ajanı">
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
  <Accordion title="Örnek 2b: Genel kodlama profili + yalnızca mesajlaşma ajanı">
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

    - varsayılan ajanlar kodlama araçlarını alır.
    - `support` ajanı yalnızca mesajlaşma içindir (+ Slack aracı).

  </Accordion>
  <Accordion title="Örnek 3: Ajan başına farklı korumalı alan modları">
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

Hem genel (`agents.defaults.*`) hem de ajana özgü (`agents.list[].*`) yapılandırmalar mevcut olduğunda:

### Korumalı alan yapılandırması

Ajana özgü ayarlar geneli geçersiz kılar:

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
`agents.list[].sandbox.{docker,browser,prune}.*`, o ajan için `agents.defaults.sandbox.{docker,browser,prune}.*` değerini geçersiz kılar (korumalı alan kapsamı `"shared"` olarak çözümlendiğinde yok sayılır).
</Note>

### Araç kısıtlamaları

Filtreleme sırası şudur:

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
  <Step title="Ajana özgü araç ilkesi">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Ajan sağlayıcı ilkesi">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Korumalı alan araç ilkesi">
    `tools.sandbox.tools` veya `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Alt ajan araç ilkesi">
    Geçerliyse `tools.subagents.tools`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Öncelik kuralları">
    - Her seviye araçları daha da kısıtlayabilir, ancak önceki seviyelerde reddedilen araçları geri veremez.
    - `agents.list[].tools.sandbox.tools` ayarlanmışsa, o ajan için `tools.sandbox.tools` değerinin yerini alır.
    - `agents.list[].tools.profile` ayarlanmışsa, o ajan için `tools.profile` değerini geçersiz kılar.
    - Sağlayıcı araç anahtarları `provider` (ör. `google-antigravity`) veya `provider/model` (ör. `openai/gpt-5.4`) kabul eder.

  </Accordion>
  <Accordion title="Boş izin listesi davranışı">
    Bu zincirdeki açık izin listelerinden herhangi biri çalıştırmada çağrılabilir araç bırakmazsa, OpenClaw istemi modele göndermeden önce durur. Bu kasıtlıdır: `agents.list[].tools.allow: ["query_db"]` gibi eksik bir araçla yapılandırılmış bir ajan, `query_db` kaydını yapan Plugin etkinleştirilene kadar açık şekilde başarısız olmalıdır; yalnızca metin ajanı olarak devam etmemelidir.
  </Accordion>
</AccordionGroup>

Araç ilkeleri, birden çok araca genişleyen `group:*` kısaltmalarını destekler. Tam liste için [Araç grupları](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) bölümüne bakın.

Ajan başına yükseltilmiş geçersiz kılmalar (`agents.list[].tools.elevated`), belirli ajanlar için yükseltilmiş exec'i daha da kısıtlayabilir. Ayrıntılar için [Yükseltilmiş mod](/tr/tools/elevated) bölümüne bakın.

---

## Tek ajandan geçiş

<Tabs>
  <Tab title="Önce (tek ajan)">
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
  <Tab title="Sonra (çok ajanlı)">
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
Eski `agent.*` yapılandırmaları `openclaw doctor` tarafından taşınır; bundan sonrası için `agents.defaults` + `agents.list` tercih edin.
</Note>

---

## Araç kısıtlama örnekleri

<Tabs>
  <Tab title="Salt okunur ajan">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Dosya sistemi araçları devre dışıyken kabuk yürütme">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Bu ilke OpenClaw dosya sistemi araçlarını devre dışı bırakır, ancak `exec` hâlâ bir kabuktur ve seçili ana makinenin veya sandbox dosya sisteminin izin verdiği her yerde dosya yazabilir. Salt okunur bir ajan için `exec` ve `process` değerlerini reddedin veya kabuk erişimini `agents.defaults.sandbox.workspaceAccess: "ro"` ya da `"none"` gibi sandbox dosya sistemi denetimleriyle birleştirin.
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

    Bu profildeki `sessions_history`, ham bir transkript dökümü yerine hâlâ sınırlı ve temizlenmiş bir hatırlama görünümü döndürür. Asistan hatırlaması; düşünme etiketlerini, `<relevant-memories>` iskeletini, düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil), derecesi düşürülmüş araç çağrısı iskeletini, sızmış ASCII/tam genişlikli model denetim belirteçlerini ve hatalı biçimlendirilmiş MiniMax araç çağrısı XML'ini redaksiyon/kısaltma öncesinde ayıklar.

  </Tab>
</Tabs>

---

## Yaygın tuzak: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"`, ajan kimliğine değil `session.mainKey` değerine (varsayılan `"main"`) dayanır. Grup/kanal oturumları her zaman kendi anahtarlarını alır; bu nedenle non-main olarak değerlendirilir ve sandbox içine alınır. Bir ajanın hiçbir zaman sandbox içine alınmamasını istiyorsanız `agents.list[].sandbox.mode: "off"` ayarını yapın.
</Warning>

---

## Test

Çok ajanlı sandbox ve araçları yapılandırdıktan sonra:

<Steps>
  <Step title="Ajan çözümlemesini denetleyin">
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
    - Kısıtlı araçlar gerektiren bir ileti gönderin.
    - Ajanın reddedilen araçları kullanamadığını doğrulayın.

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
  <Accordion title="`mode: 'all'` olmasına rağmen ajan sandbox içinde değil">
    - Bunu geçersiz kılan genel bir `agents.defaults.sandbox.mode` olup olmadığını denetleyin.
    - Ajana özel yapılandırma önceliklidir; bu nedenle `agents.list[].sandbox.mode: "all"` ayarını yapın.

  </Accordion>
  <Accordion title="Reddetme listesine rağmen araçlar hâlâ kullanılabilir">
    - Araç filtreleme sırasını denetleyin: genel → ajan → sandbox → alt ajan.
    - Her düzey yalnızca daha fazla kısıtlayabilir, tekrar izin veremez.
    - Günlüklerle doğrulayın: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Kapsayıcı ajan başına yalıtılmamış">
    - Ajana özel sandbox yapılandırmasında `scope: "agent"` ayarını yapın.
    - Varsayılan değer, oturum başına bir kapsayıcı oluşturan `"session"` değeridir.

  </Accordion>
</AccordionGroup>

---

## İlgili

- [Yükseltilmiş mod](/tr/tools/elevated)
- [Çoklu ajan yönlendirme](/tr/concepts/multi-agent)
- [Sandbox yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox, araç ilkesi ve yükseltilmiş mod karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) — "bu neden engelleniyor?" hatalarını ayıklama
- [Sandboxing](/tr/gateway/sandboxing) — tam sandbox başvurusu (modlar, kapsamlar, arka uçlar, imajlar)
- [Oturum yönetimi](/tr/concepts/session)
