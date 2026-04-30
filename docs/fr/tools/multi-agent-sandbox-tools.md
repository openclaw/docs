---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Bac à sable par agent + restrictions d’outils, priorité et exemples
title: Bac à sable et outils multi-agents
x-i18n:
    generated_at: "2026-04-30T07:52:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedb36301f670bcd8956dbeb81788acfc96627e39401e34434c2348fcb10f155
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Chaque agent dans une configuration multi-agent peut remplacer la politique globale de bac à sable et d’outils. Cette page couvre la configuration par agent, les règles de priorité et des exemples.

<CardGroup cols={3}>
  <Card title="Bac à sable" href="/fr/gateway/sandboxing">
    Backends et modes — référence complète du bac à sable.
  </Card>
  <Card title="Bac à sable vs politique des outils vs mode élevé" href="/fr/gateway/sandbox-vs-tool-policy-vs-elevated">
    Déboguer « pourquoi ceci est-il bloqué ? »
  </Card>
  <Card title="Mode élevé" href="/fr/tools/elevated">
    Exécution élevée pour les expéditeurs de confiance.
  </Card>
</CardGroup>

<Warning>
L’authentification est limitée à l’agent : chaque agent possède son propre magasin d’authentification `agentDir` dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Ne réutilisez jamais `agentDir` entre agents. Les agents peuvent lire les profils d’authentification de l’agent par défaut/principal lorsqu’ils n’ont pas de profil local, mais les jetons d’actualisation OAuth ne sont pas clonés dans les magasins des agents secondaires. Si vous copiez des identifiants manuellement, copiez uniquement les profils statiques portables `api_key` ou `token`.
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

    - Agent `main` : s’exécute sur l’hôte, accès complet aux outils.
    - Agent `family` : s’exécute dans Docker (un conteneur par agent), uniquement l’outil `read`.

  </Accordion>
  <Accordion title="Exemple 2 : agent de travail avec bac à sable partagé">
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
  <Accordion title="Exemple 2b : profil de codage global + agent limité à la messagerie">
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

    - Les agents par défaut obtiennent les outils de codage.
    - L’agent `support` est limité à la messagerie (+ outil Slack).

  </Accordion>
  <Accordion title="Exemple 3 : modes de bac à sable différents par agent">
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

Lorsque des configurations globales (`agents.defaults.*`) et propres à un agent (`agents.list[].*`) existent toutes les deux :

### Configuration du bac à sable

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
`agents.list[].sandbox.{docker,browser,prune}.*` remplace `agents.defaults.sandbox.{docker,browser,prune}.*` pour cet agent (ignoré lorsque la portée du bac à sable se résout en `"shared"`).
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
  <Step title="Politique d’outils du bac à sable">
    `tools.sandbox.tools` ou `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Politique d’outils de sous-agent">
    `tools.subagents.tools`, le cas échéant.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Règles de priorité">
    - Chaque niveau peut restreindre davantage les outils, mais ne peut pas réautoriser des outils refusés à des niveaux précédents.
    - Si `agents.list[].tools.sandbox.tools` est défini, il remplace `tools.sandbox.tools` pour cet agent.
    - Si `agents.list[].tools.profile` est défini, il remplace `tools.profile` pour cet agent.
    - Les clés d’outils de fournisseur acceptent soit `provider` (par exemple `google-antigravity`), soit `provider/model` (par exemple `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Comportement d’une liste d’autorisation vide">
    Si une liste d’autorisation explicite dans cette chaîne ne laisse aucun outil appelable à l’exécution, OpenClaw s’arrête avant de soumettre le prompt au modèle. C’est intentionnel : un agent configuré avec un outil manquant tel que `agents.list[].tools.allow: ["query_db"]` doit échouer clairement jusqu’à ce que le plugin qui enregistre `query_db` soit activé, au lieu de continuer comme agent uniquement textuel.
  </Accordion>
</AccordionGroup>

Les politiques d’outils prennent en charge les raccourcis `group:*`, qui s’étendent en plusieurs outils. Consultez [Groupes d’outils](/fr/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) pour la liste complète.

Les remplacements de mode élevé par agent (`agents.list[].tools.elevated`) peuvent restreindre davantage l’exécution élevée pour des agents spécifiques. Consultez [Mode élevé](/fr/tools/elevated) pour plus de détails.

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
Les configurations héritées `agent.*` sont migrées par `openclaw doctor` ; préférez désormais `agents.defaults` + `agents.list`.
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
  <Tab title="Exécution sûre (aucune modification de fichiers)">
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

    `sessions_history` dans ce profil renvoie toujours une vue de rappel limitée et assainie plutôt qu’un vidage brut de transcription. Le rappel de l’assistant retire les balises de réflexion, l’échafaudage `<relevant-memories>`, les charges utiles XML d’appels d’outils en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués), l’échafaudage d’appels d’outils rétrogradé, les jetons de contrôle de modèle ASCII/pleine chasse divulgués et le XML d’appels d’outils MiniMax mal formé avant la rédaction/troncature.

  </Tab>
</Tabs>

---

## Piège courant : "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` est basé sur `session.mainKey` (par défaut `"main"`), et non sur l’identifiant de l’agent. Les sessions de groupe/canal obtiennent toujours leurs propres clés, elles sont donc traitées comme non principales et seront placées en bac à sable. Si vous voulez qu’un agent ne soit jamais placé en bac à sable, définissez `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Tests

Après avoir configuré le bac à sable et les outils multi-agent :

<Steps>
  <Step title="Vérifier la résolution des agents">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Vérifier les conteneurs de bac à sable">
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
  <Accordion title="Agent non placé en bac à sable malgré `mode: 'all'`">
    - Vérifiez s’il existe un `agents.defaults.sandbox.mode` global qui le remplace.
    - La configuration propre à l’agent est prioritaire, définissez donc `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Outils toujours disponibles malgré la liste de refus">
    - Vérifiez l’ordre de filtrage des outils : global → agent → bac à sable → sous-agent.
    - Chaque niveau peut seulement restreindre davantage, pas réautoriser.
    - Vérifiez avec les journaux : `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Conteneur non isolé par agent">
    - Définissez `scope: "agent"` dans la configuration de bac à sable propre à l’agent.
    - La valeur par défaut est `"session"`, qui crée un conteneur par session.

  </Accordion>
</AccordionGroup>

---

## Connexe

- [Mode élevé](/fr/tools/elevated)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Configuration du bac à sable](/fr/gateway/config-agents#agentsdefaultssandbox)
- [Bac à sable vs politique des outils vs mode élevé](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) — débogage de « pourquoi ceci est-il bloqué ? »
- [Mise en bac à sable](/fr/gateway/sandboxing) — référence complète du bac à sable (modes, portées, backends, images)
- [Gestion des sessions](/fr/concepts/session)
