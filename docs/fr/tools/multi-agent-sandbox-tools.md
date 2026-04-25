---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: « Sandbox par agent + restrictions d’outils, priorité et exemples »
title: Sandbox multi-agent et outils
x-i18n:
    generated_at: "2026-04-25T13:59:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4473b8ea0f10c891b08cb56c9ba5a073f79c55b42f5b348b69ffb3c3d94c8f88
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Configuration de la sandbox et des outils multi-agent

Chaque agent dans une configuration multi-agent peut remplacer la sandbox globale et
la politique d’outils. Cette page couvre la configuration par agent, les règles de
priorité et des exemples.

- **Backends et modes de sandbox** : voir [Sandboxing](/fr/gateway/sandboxing).
- **Débogage des outils bloqués** : voir [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) et `openclaw sandbox explain`.
- **Exec élevé** : voir [Mode Elevated](/fr/tools/elevated).

L’authentification est gérée par agent : chaque agent lit depuis son propre magasin d’authentification `agentDir` dans
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Les identifiants **ne sont pas** partagés entre agents. Ne réutilisez jamais `agentDir` entre plusieurs agents.
Si vous voulez partager des identifiants, copiez `auth-profiles.json` dans le `agentDir` de l’autre agent.

---

## Exemples de configuration

### Exemple 1 : agent personnel + agent familial restreint

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Assistant personnel",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Bot familial",
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

**Résultat :**

- agent `main` : s’exécute sur l’hôte, accès complet aux outils
- agent `family` : s’exécute dans Docker (un conteneur par agent), outil `read` uniquement

---

### Exemple 2 : agent de travail avec sandbox partagée

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

### Exemple 2b : profil global de développement + agent réservé à la messagerie

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

**Résultat :**

- les agents par défaut reçoivent les outils de développement
- l’agent `support` est limité à la messagerie (+ outil Slack)

---

### Exemple 3 : modes de sandbox différents par agent

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // valeur globale par défaut
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // remplacement : main n’est jamais sandboxé
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // remplacement : public est toujours sandboxé
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

## Priorité de configuration

Lorsque des configurations globales (`agents.defaults.*`) et spécifiques à l’agent (`agents.list[].*`) existent toutes deux :

### Configuration de la sandbox

Les paramètres spécifiques à l’agent remplacent les paramètres globaux :

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Remarques :**

- `agents.list[].sandbox.{docker,browser,prune}.*` remplace `agents.defaults.sandbox.{docker,browser,prune}.*` pour cet agent (ignoré lorsque le scope de sandbox se résout en `"shared"`).

### Restrictions d’outils

L’ordre de filtrage est le suivant :

1. **Profil d’outils** (`tools.profile` ou `agents.list[].tools.profile`)
2. **Profil d’outils du fournisseur** (`tools.byProvider[provider].profile` ou `agents.list[].tools.byProvider[provider].profile`)
3. **Politique globale des outils** (`tools.allow` / `tools.deny`)
4. **Politique d’outils du fournisseur** (`tools.byProvider[provider].allow/deny`)
5. **Politique d’outils spécifique à l’agent** (`agents.list[].tools.allow/deny`)
6. **Politique du fournisseur pour l’agent** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Politique d’outils de la sandbox** (`tools.sandbox.tools` ou `agents.list[].tools.sandbox.tools`)
8. **Politique d’outils du sous-agent** (`tools.subagents.tools`, le cas échéant)

Chaque niveau peut restreindre davantage les outils, mais ne peut pas réautoriser des outils refusés par les niveaux précédents.
Si `agents.list[].tools.sandbox.tools` est défini, il remplace `tools.sandbox.tools` pour cet agent.
Si `agents.list[].tools.profile` est défini, il remplace `tools.profile` pour cet agent.
Les clés d’outils fournisseur acceptent soit `provider` (par ex. `google-antigravity`), soit `provider/model` (par ex. `openai/gpt-5.4`).

Si une allowlist explicite dans cette chaîne laisse l’exécution sans aucun outil appelable,
OpenClaw s’arrête avant d’envoyer le prompt au modèle. C’est intentionnel :
un agent configuré avec un outil manquant tel que
`agents.list[].tools.allow: ["query_db"]` doit échouer bruyamment jusqu’à ce que le Plugin
qui enregistre `query_db` soit activé, et non continuer comme agent texte uniquement.

Les politiques d’outils prennent en charge les raccourcis `group:*` qui se développent en plusieurs outils. Voir [Groupes d’outils](/fr/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) pour la liste complète.

Les remplacements Elevated par agent (`agents.list[].tools.elevated`) peuvent restreindre davantage exec élevé pour des agents spécifiques. Voir [Mode Elevated](/fr/tools/elevated) pour plus de détails.

---

## Migration depuis un agent unique

**Avant (agent unique) :**

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

**Après (multi-agent avec profils différents) :**

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

Les anciennes configurations `agent.*` sont migrées par `openclaw doctor` ; privilégiez désormais `agents.defaults` + `agents.list`.

---

## Exemples de restrictions d’outils

### Agent en lecture seule

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agent d’exécution sûre (sans modification de fichiers)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Agent dédié à la communication

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

`sessions_history` dans ce profil renvoie toujours une vue de rappel bornée et nettoyée
plutôt qu’un dump brut de transcription. Le rappel de l’assistant supprime les balises de réflexion,
l’échafaudage `<relevant-memories>`, les charges utiles XML d’appel d’outils en texte brut
(y compris `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, ainsi que les blocs d’appel d’outils tronqués),
l’échafaudage d’appel d’outils dégradé, les jetons de contrôle de modèle ASCII/pleine largeur divulgués
et le XML d’appel d’outils MiniMax malformé avant la rédaction/la troncature.

---

## Piège courant : `non-main`

`agents.defaults.sandbox.mode: "non-main"` est basé sur `session.mainKey` (par défaut `"main"`),
et non sur l’identifiant de l’agent. Les sessions de groupe/canal reçoivent toujours leurs propres clés, elles
sont donc traitées comme non principales et seront sandboxées. Si vous voulez qu’un agent ne soit jamais
sandboxé, définissez `agents.list[].sandbox.mode: "off"`.

---

## Test

Après avoir configuré la sandbox multi-agent et les outils :

1. **Vérifiez la résolution de l’agent :**

   ```exec
   openclaw agents list --bindings
   ```

2. **Vérifiez les conteneurs de sandbox :**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Testez les restrictions d’outils :**
   - Envoyez un message nécessitant des outils restreints
   - Vérifiez que l’agent ne peut pas utiliser les outils refusés

4. **Surveillez les journaux :**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Dépannage

### L’agent n’est pas sandboxé malgré `mode: "all"`

- Vérifiez s’il existe un `agents.defaults.sandbox.mode` global qui le remplace
- La configuration spécifique à l’agent a priorité ; définissez donc `agents.list[].sandbox.mode: "all"`

### Des outils restent disponibles malgré la liste de refus

- Vérifiez l’ordre de filtrage des outils : global → agent → sandbox → sous-agent
- Chaque niveau ne peut que restreindre davantage, pas réautoriser
- Vérifiez avec les journaux : `[tools] filtering tools for agent:${agentId}`

### Le conteneur n’est pas isolé par agent

- Définissez `scope: "agent"` dans la configuration de sandbox spécifique à l’agent
- La valeur par défaut est `"session"`, ce qui crée un conteneur par session

---

## Lié

- [Sandboxing](/fr/gateway/sandboxing) -- référence complète sur la sandbox (modes, scopes, backends, images)
- [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) -- déboguer « pourquoi ceci est-il bloqué ? »
- [Mode Elevated](/fr/tools/elevated)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Configuration de la sandbox](/fr/gateway/config-agents#agentsdefaultssandbox)
- [Gestion des sessions](/fr/concepts/session)
