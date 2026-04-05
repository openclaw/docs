---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: “Ajan başına sandbox + araç kısıtlamaları, öncelik sırası ve örnekler”
title: Çok Ajanlı Sandbox ve Araçlar
x-i18n:
    generated_at: "2026-04-05T14:13:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07985f7c8fae860a7b9bf685904903a4a8f90249e95e4179cf0775a1208c0597
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Çok Ajanlı Sandbox ve Araç Yapılandırması

Çok ajanlı bir kurulumdaki her ajan, genel sandbox ve araç
ilkesini geçersiz kılabilir. Bu sayfa, ajan başına yapılandırmayı, öncelik kurallarını ve
örnekleri kapsar.

- **Sandbox arka uçları ve modları**: bkz. [Sandboxing](/tr/gateway/sandboxing).
- **Engellenen araçlarda hata ayıklama**: bkz. [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) ve `openclaw sandbox explain`.
- **Yükseltilmiş exec**: bkz. [Elevated Mode](/tr/tools/elevated).

Kimlik doğrulama ajan başınadır: her ajan, kendi `agentDir` kimlik doğrulama deposundan okur:
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Kimlik bilgileri ajanlar arasında **paylaşılmaz**. `agentDir` dizinini ajanlar arasında asla yeniden kullanmayın.
Kimlik bilgilerini paylaşmak istiyorsanız, `auth-profiles.json` dosyasını diğer ajanın `agentDir` dizinine kopyalayın.

---

## Yapılandırma Örnekleri

### Örnek 1: Kişisel + Kısıtlanmış Aile Ajanı

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

- `main` ajanı: Ana makinede çalışır, tam araç erişimi vardır
- `family` ajanı: Docker içinde çalışır (ajan başına bir kapsayıcı), yalnızca `read` aracı vardır

---

### Örnek 2: Paylaşılan Sandbox ile İş Ajanı

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

---

### Örnek 2b: Genel kodlama profili + yalnızca mesajlaşma ajanı

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

- varsayılan ajanlar kodlama araçlarını alır
- `support` ajanı yalnızca mesajlaşma içindir (+ Slack aracı)

---

### Örnek 3: Ajan Başına Farklı Sandbox Modları

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Genel varsayılan
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Geçersiz kılma: main asla sandbox içine alınmaz
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Geçersiz kılma: public her zaman sandbox içine alınır
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

---

## Yapılandırma Önceliği

Hem genel (`agents.defaults.*`) hem de ajana özgü (`agents.list[].*`) yapılandırmalar mevcut olduğunda:

### Sandbox Yapılandırması

Ajana özgü ayarlar genelin önüne geçer:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Notlar:**

- `agents.list[].sandbox.{docker,browser,prune}.*`, o ajan için `agents.defaults.sandbox.{docker,browser,prune}.*` değerlerini geçersiz kılar (sandbox kapsamı `"shared"` olarak çözülürse yok sayılır).

### Araç Kısıtlamaları

Filtreleme sırası şöyledir:

1. **Araç profili** (`tools.profile` veya `agents.list[].tools.profile`)
2. **Sağlayıcı araç profili** (`tools.byProvider[provider].profile` veya `agents.list[].tools.byProvider[provider].profile`)
3. **Genel araç ilkesi** (`tools.allow` / `tools.deny`)
4. **Sağlayıcı araç ilkesi** (`tools.byProvider[provider].allow/deny`)
5. **Ajana özgü araç ilkesi** (`agents.list[].tools.allow/deny`)
6. **Ajan sağlayıcı ilkesi** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Sandbox araç ilkesi** (`tools.sandbox.tools` veya `agents.list[].tools.sandbox.tools`)
8. **Alt ajan araç ilkesi** (`tools.subagents.tools`, uygunsa)

Her düzey araçları daha da kısıtlayabilir, ancak daha önceki düzeylerde reddedilen araçları geri veremez.
`agents.list[].tools.sandbox.tools` ayarlanmışsa, o ajan için `tools.sandbox.tools` değerinin yerini alır.
`agents.list[].tools.profile` ayarlanmışsa, o ajan için `tools.profile` değerini geçersiz kılar.
Sağlayıcı araç anahtarları `provider` (ör. `google-antigravity`) veya `provider/model` (ör. `openai/gpt-5.4`) biçimlerinden birini kabul eder.

Araç ilkeleri, birden fazla araca genişleyen `group:*` kısayollarını destekler. Tam liste için [Tool groups](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) bölümüne bakın.

Ajan başına yükseltilmiş geçersiz kılmalar (`agents.list[].tools.elevated`), belirli ajanlar için yükseltilmiş exec'i daha da kısıtlayabilir. Ayrıntılar için [Elevated Mode](/tr/tools/elevated) bölümüne bakın.

---

## Tek Ajanlı Yapılandırmadan Geçiş

**Önce (tek ajan):**

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

**Sonra (farklı profillere sahip çok ajanlı):**

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

Eski `agent.*` yapılandırmaları `openclaw doctor` tarafından taşınır; bundan sonra `agents.defaults` + `agents.list` kullanılması tercih edilir.

---

## Araç Kısıtlama Örnekleri

### Salt Okunur Ajan

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Güvenli Yürütme Ajanı (dosya değişikliği yok)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Yalnızca İletişim Ajanı

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

Bu profilde `sessions_history`, ham bir döküm yerine yine sınırlı ve temizlenmiş bir geri çağırma
görünümü döndürür. Asistan geri çağırması, düşünme etiketlerini,
`<relevant-memories>` iskeletini, düz metin araç çağrısı XML yüklerini
(` <tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil),
düşürülmüş araç çağrısı iskeletini, sızmış ASCII/tam genişlikli model kontrol
belirteçlerini ve bozuk MiniMax araç çağrısı XML'ini sansürleme/kısaltma öncesinde ayıklar.

---

## Yaygın Tuzak: "non-main"

`agents.defaults.sandbox.mode: "non-main"` değeri, ajan kimliğine değil,
`session.mainKey` değerine (varsayılan `"main"`) dayanır. Grup/kanal oturumları her zaman
kendi anahtarlarını alır, bu nedenle main olmayan olarak değerlendirilir ve sandbox içine alınır.
Bir ajanın asla sandbox kullanmamasını istiyorsanız, `agents.list[].sandbox.mode: "off"` ayarlayın.

---

## Test Etme

Çok ajanlı sandbox ve araçları yapılandırdıktan sonra:

1. **Ajan çözümlemesini kontrol edin:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Sandbox kapsayıcılarını doğrulayın:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Araç kısıtlamalarını test edin:**
   - Kısıtlı araçlar gerektiren bir mesaj gönderin
   - Ajanın reddedilen araçları kullanamadığını doğrulayın

4. **Günlükleri izleyin:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Sorun Giderme

### `mode: "all"` olmasına rağmen ajan sandbox içine alınmıyor

- Bunu geçersiz kılan genel bir `agents.defaults.sandbox.mode` olup olmadığını kontrol edin
- Ajana özgü yapılandırma önceliklidir, bu yüzden `agents.list[].sandbox.mode: "all"` ayarlayın

### Reddetme listesine rağmen araçlar hâlâ kullanılabiliyor

- Araç filtreleme sırasını kontrol edin: genel → ajan → sandbox → alt ajan
- Her düzey yalnızca daha fazla kısıtlama getirebilir, geri veremez
- Günlüklerle doğrulayın: `[tools] filtering tools for agent:${agentId}`

### Kapsayıcı ajan başına izole edilmiyor

- Ajana özgü sandbox yapılandırmasında `scope: "agent"` ayarlayın
- Varsayılan `"session"` değeridir ve oturum başına bir kapsayıcı oluşturur

---

## Ayrıca bkz.

- [Sandboxing](/tr/gateway/sandboxing) -- tam sandbox başvurusu (modlar, kapsamlar, arka uçlar, imajlar)
- [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) -- "bu neden engelleniyor?" hata ayıklaması
- [Elevated Mode](/tr/tools/elevated)
- [Multi-Agent Routing](/tr/concepts/multi-agent)
- [Sandbox Configuration](/tr/gateway/configuration-reference#agentsdefaultssandbox)
- [Session Management](/tr/concepts/session)
