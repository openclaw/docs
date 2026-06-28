---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Bac à sable par agent + restrictions d’outils, priorité et exemples
title: Bac à sable et outils multi-agents
x-i18n:
    generated_at: "2026-05-11T20:59:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Chaque agent dans une configuration multi-agent peut remplacer la politique globale de sandbox et d’outils. Cette page couvre la configuration par agent, les règles de précédence et des exemples.

<CardGroup cols={3}>
  <Card title="Isolation en sandbox" href="/fr/gateway/sandboxing">
    Backends et modes — référence complète du sandbox.
  </Card>
  <Card title="Sandbox vs politique d’outils vs mode élevé" href="/fr/gateway/sandbox-vs-tool-policy-vs-elevated">
    Déboguer « pourquoi est-ce bloqué ? »
  </Card>
  <Card title="Mode élevé" href="/fr/tools/elevated">
    Exécution élevée pour les expéditeurs approuvés.
  </Card>
</CardGroup>

<Warning>
L’authentification est limitée à l’agent : chaque agent possède son propre magasin d’authentification `agentDir` à `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Ne réutilisez jamais `agentDir` entre agents. Les agents peuvent consulter les profils d’authentification de l’agent par défaut/principal lorsqu’ils n’ont pas de profil local, mais les jetons d’actualisation OAuth ne sont pas clonés dans les magasins des agents secondaires. Si vous copiez des identifiants manuellement, copiez uniquement les profils statiques portables `api_key` ou `token`.
</Warning>

---

## Exemples de configuration

<AccordionGroup>
  <Accordion title="Exemple 1 : agent personnel + agent familial restreint">
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

    **Résultat :**

    - agent `main` : s’exécute sur l’hôte, accès complet aux outils.
    - agent `family` : s’exécute dans Docker (un conteneur par agent), uniquement `read` et les envois de messages dans la conversation actuelle.

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
  <Accordion title="Exemple 2b : profil de codage global + agent de messagerie uniquement">
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

    - les agents par défaut obtiennent les outils de codage.
    - l’agent `support` est limité à la messagerie (+ outil Slack).

  </Accordion>
  <Accordion title="Exemple 3 : différents modes de sandbox par agent">
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

## Précédence de la configuration

Lorsque des configurations globales (`agents.defaults.*`) et propres à l’agent (`agents.list[].*`) existent toutes deux :

### Configuration du sandbox

Les paramètres propres à l’agent remplacent les paramètres globaux :

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
`agents.list[].sandbox.{docker,browser,prune}.*` remplace `agents.defaults.sandbox.{docker,browser,prune}.*` pour cet agent (ignoré lorsque la portée du sandbox se résout en `"shared"`).
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
  <Step title="Politique globale d’outils">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Politique d’outils du fournisseur">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Politique d’outils propre à l’agent">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Politique de fournisseur de l’agent">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Politique d’outils du sandbox">
    `tools.sandbox.tools` ou `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Politique d’outils des sous-agents">
    `tools.subagents.tools`, le cas échéant.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Règles de précédence">
    - Chaque niveau peut restreindre davantage les outils, mais ne peut pas réautoriser des outils refusés par des niveaux précédents.
    - Si `agents.list[].tools.sandbox.tools` est défini, il remplace `tools.sandbox.tools` pour cet agent.
    - Si `agents.list[].tools.profile` est défini, il remplace `tools.profile` pour cet agent.
    - Les clés d’outils de fournisseur acceptent soit `provider` (par exemple `google-antigravity`), soit `provider/model` (par exemple `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Comportement d’une liste d’autorisation vide">
    Si une liste d’autorisation explicite dans cette chaîne laisse l’exécution sans aucun outil appelable, OpenClaw s’arrête avant de soumettre l’invite au modèle. C’est intentionnel : un agent configuré avec un outil manquant comme `agents.list[].tools.allow: ["query_db"]` doit échouer clairement jusqu’à ce que le Plugin qui enregistre `query_db` soit activé, au lieu de continuer comme agent texte uniquement.
  </Accordion>
</AccordionGroup>

Les politiques d’outils prennent en charge les raccourcis `group:*`, qui s’étendent à plusieurs outils. Consultez [Groupes d’outils](/fr/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) pour la liste complète.

Les remplacements élevés par agent (`agents.list[].tools.elevated`) peuvent restreindre davantage l’exécution élevée pour des agents spécifiques. Consultez [Mode élevé](/fr/tools/elevated) pour plus de détails.

---

## Migration depuis un agent unique

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
Les anciennes configurations `agent.*` sont migrées par `openclaw doctor` ; privilégiez désormais `agents.defaults` + `agents.list`.
</Note>

---

## Exemples de restriction des outils

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
  <Tab title="Shell execution with filesystem tools disabled">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Cette politique désactive les outils de système de fichiers d’OpenClaw, mais `exec` reste un shell et peut écrire des fichiers partout où l’hôte sélectionné ou le système de fichiers du sandbox l’autorise. Pour un agent en lecture seule, refusez `exec` et `process`, ou combinez l’accès shell avec des contrôles de système de fichiers du sandbox comme `agents.defaults.sandbox.workspaceAccess: "ro"` ou `"none"`.
    </Warning>

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

    Dans ce profil, `sessions_history` renvoie toujours une vue de rappel bornée et assainie plutôt qu’un vidage brut de la transcription. Le rappel de l’assistant supprime les balises de raisonnement, l’échafaudage `<relevant-memories>`, les charges utiles XML d’appels d’outils en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués), l’échafaudage d’appels d’outils déclassé, les jetons de contrôle du modèle ASCII/pleine largeur divulgués, ainsi que le XML d’appels d’outils MiniMax mal formé avant la caviardisation/troncature.

  </Tab>
</Tabs>

---

## Piège courant : "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` est basé sur `session.mainKey` (par défaut `"main"`), pas sur l’identifiant de l’agent. Les sessions de groupe/canal reçoivent toujours leurs propres clés ; elles sont donc traitées comme non principales et placées dans un sandbox. Si vous voulez qu’un agent ne soit jamais placé dans un sandbox, définissez `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Tests

Après avoir configuré le sandbox et les outils multi-agents :

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
    - Envoyez un message nécessitant des outils restreints.
    - Vérifiez que l’agent ne peut pas utiliser les outils refusés.

  </Step>
  <Step title="Monitor logs">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Dépannage

<AccordionGroup>
  <Accordion title="Agent not sandboxed despite `mode: 'all'`">
    - Vérifiez s’il existe un `agents.defaults.sandbox.mode` global qui le remplace.
    - La configuration propre à l’agent est prioritaire ; définissez donc `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Tools still available despite deny list">
    - Vérifiez l’ordre de filtrage des outils : global → agent → sandbox → sous-agent.
    - Chaque niveau ne peut que restreindre davantage, pas réaccorder.
    - Vérifiez avec les logs : `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Container not isolated per agent">
    - Définissez `scope: "agent"` dans la configuration de sandbox propre à l’agent.
    - La valeur par défaut est `"session"`, ce qui crée un conteneur par session.

  </Accordion>
</AccordionGroup>

---

## Articles connexes

- [Mode élevé](/fr/tools/elevated)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Configuration du bac à sable](/fr/gateway/config-agents#agentsdefaultssandbox)
- [Bac à sable vs politique des outils vs mode élevé](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) — débogage de « pourquoi est-ce bloqué ? »
- [Bac à sable](/fr/gateway/sandboxing) — référence complète du bac à sable (modes, portées, backends, images)
- [Gestion des sessions](/fr/concepts/session)
