---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox par agent + restrictions d’outils, priorité et exemples
title: Sandbox multi-agent et outils
x-i18n:
    generated_at: "2026-04-26T11:40:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b8d24252b03dbcd00a5eefcc8e58bd51577a99ae057008f19a0acc4016413ea
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

Chaque agent dans une configuration multi-agent peut remplacer la politique globale de sandbox et d’outils. Cette page couvre la configuration par agent, les règles de priorité et des exemples.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/fr/gateway/sandboxing">
    Backends et modes — référence complète du sandbox.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/fr/gateway/sandbox-vs-tool-policy-vs-elevated">
    Déboguer « pourquoi est-ce bloqué ? »
  </Card>
  <Card title="Elevated mode" href="/fr/tools/elevated">
    Exécution elevated pour les expéditeurs de confiance.
  </Card>
</CardGroup>

<Warning>
L’authentification est propre à chaque agent : chaque agent lit depuis son propre magasin d’authentification `agentDir` dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Les identifiants ne sont **pas** partagés entre les agents. Ne réutilisez jamais `agentDir` entre plusieurs agents. Si vous voulez partager des identifiants, copiez `auth-profiles.json` dans le `agentDir` de l’autre agent.
</Warning>

---

## Exemples de configuration

<AccordionGroup>
  <Accordion title="Exemple 1 : agent personnel + agent famille restreint">
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

    **Résultat :**

    - agent `main` : s’exécute sur l’hôte, avec un accès complet aux outils.
    - agent `family` : s’exécute dans Docker (un conteneur par agent), avec seulement l’outil `read`.

  </Accordion>
  <Accordion title="Exemple 2 : agent de travail avec sandbox partagé">
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
  <Accordion title="Exemple 2b : profil global de développement + agent réservé à la messagerie">
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

    **Résultat :**

    - les agents par défaut obtiennent les outils de développement.
    - l’agent `support` est réservé à la messagerie (+ outil Slack).

  </Accordion>
  <Accordion title="Exemple 3 : modes de sandbox différents par agent">
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

## Priorité de configuration

Lorsque des configurations globales (`agents.defaults.*`) et spécifiques à un agent (`agents.list[].*`) existent :

### Configuration du sandbox

Les paramètres spécifiques à l’agent remplacent les paramètres globaux :

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
`agents.list[].sandbox.{docker,browser,prune}.*` remplace `agents.defaults.sandbox.{docker,browser,prune}.*` pour cet agent (ignoré lorsque la portée du sandbox se résout à `"shared"`).
</Note>

### Restrictions d’outils

L’ordre de filtrage est le suivant :

<Steps>
  <Step title="Profil d’outils">
    `tools.profile` ou `agents.list[].tools.profile`.
  </Step>
  <Step title="Profil d’outils du fournisseur">
    `tools.byProvider[provider].profile` ou `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Politique globale des outils">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Politique des outils du fournisseur">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Politique d’outils spécifique à l’agent">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Politique du fournisseur pour l’agent">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Politique d’outils du sandbox">
    `tools.sandbox.tools` ou `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Politique d’outils du sous-agent">
    `tools.subagents.tools`, si applicable.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Règles de priorité">
    - Chaque niveau peut restreindre davantage les outils, mais ne peut pas réautoriser des outils refusés par des niveaux précédents.
    - Si `agents.list[].tools.sandbox.tools` est défini, il remplace `tools.sandbox.tools` pour cet agent.
    - Si `agents.list[].tools.profile` est défini, il remplace `tools.profile` pour cet agent.
    - Les clés d’outils du fournisseur acceptent soit `provider` (par ex. `google-antigravity`), soit `provider/model` (par ex. `openai/gpt-5.4`).
  </Accordion>
  <Accordion title="Comportement d’une allowlist vide">
    Si une allowlist explicite de cette chaîne aboutit à une exécution sans aucun outil appelable, OpenClaw s’arrête avant de soumettre le prompt au modèle. C’est intentionnel : un agent configuré avec un outil manquant tel que `agents.list[].tools.allow: ["query_db"]` doit échouer de façon visible jusqu’à ce que le plugin qui enregistre `query_db` soit activé, et non continuer comme un agent texte uniquement.
  </Accordion>
</AccordionGroup>

Les politiques d’outils prennent en charge les raccourcis `group:*`, qui se développent en plusieurs outils. Voir [Tool groups](/fr/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) pour la liste complète.

Les remplacements elevated par agent (`agents.list[].tools.elevated`) peuvent restreindre davantage l’exécution elevated pour des agents spécifiques. Voir [Elevated mode](/fr/tools/elevated) pour plus de détails.

---

## Migration depuis un agent unique

<Tabs>
  <Tab title="Avant (agent unique)">
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
  <Tab title="Après (multi-agent)">
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
Les anciennes configurations `agent.*` sont migrées par `openclaw doctor` ; préférez désormais `agents.defaults` + `agents.list`.
</Note>

---

## Exemples de restrictions d’outils

<Tabs>
  <Tab title="Agent en lecture seule">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Exécution sûre (aucune modification de fichier)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
  </Tab>
  <Tab title="Communication uniquement">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    Dans ce profil, `sessions_history` renvoie toujours une vue de rappel bornée et nettoyée plutôt qu’un export brut de transcription. Le rappel de l’assistant supprime les balises de réflexion, l’échafaudage `<relevant-memories>`, les charges XML d’appel d’outil en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, ainsi que les blocs d’appel d’outil tronqués), l’échafaudage d’appel d’outil dégradé, les jetons de contrôle du modèle en ASCII/pleine largeur divulgués, et le XML d’appel d’outil MiniMax malformé avant la rédaction/troncature.

  </Tab>
</Tabs>

---

## Piège courant : "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` repose sur `session.mainKey` (par défaut `"main"`), et non sur l’id de l’agent. Les sessions de groupe/canal obtiennent toujours leurs propres clés ; elles sont donc traitées comme non principales et seront placées en sandbox. Si vous voulez qu’un agent ne soit jamais placé en sandbox, définissez `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Tests

Après avoir configuré le sandbox et les outils multi-agent :

<Steps>
  <Step title="Vérifier la résolution d’agent">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Vérifier les conteneurs de sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Tester les restrictions d’outils">
    - Envoyez un message nécessitant des outils restreints.
    - Vérifiez que l’agent ne peut pas utiliser les outils refusés.
  </Step>
  <Step title="Surveiller les journaux">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Dépannage

<AccordionGroup>
  <Accordion title="L’agent n’est pas placé en sandbox malgré `mode: 'all'`">
    - Vérifiez s’il existe un `agents.defaults.sandbox.mode` global qui le remplace.
    - La configuration spécifique à l’agent a priorité ; définissez donc `agents.list[].sandbox.mode: "all"`.
  </Accordion>
  <Accordion title="Des outils restent disponibles malgré la liste deny">
    - Vérifiez l’ordre de filtrage des outils : global → agent → sandbox → sous-agent.
    - Chaque niveau peut seulement restreindre davantage, pas réautoriser.
    - Vérifiez avec les journaux : `[tools] filtering tools for agent:${agentId}`.
  </Accordion>
  <Accordion title="Le conteneur n’est pas isolé par agent">
    - Définissez `scope: "agent"` dans la configuration de sandbox spécifique à l’agent.
    - La valeur par défaut est `"session"`, ce qui crée un conteneur par session.
  </Accordion>
</AccordionGroup>

---

## Liens associés

- [Elevated mode](/fr/tools/elevated)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Configuration du sandbox](/fr/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs tool policy vs elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) — déboguer « pourquoi est-ce bloqué ? »
- [Sandboxing](/fr/gateway/sandboxing) — référence complète du sandbox (modes, portées, backends, images)
- [Gestion des sessions](/fr/concepts/session)
