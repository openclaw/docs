---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Bac à sable par agent, restrictions d’outils, ordre de priorité et exemples
title: Bac à sable et outils multi-agents
x-i18n:
    generated_at: "2026-07-12T15:58:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Chaque agent d’une configuration multi-agent peut remplacer la sandbox globale et la politique d’outils. Cette page présente la configuration par agent, les règles de priorité et des exemples.

<CardGroup cols={3}>
  <Card title="Mise en sandbox" href="/fr/gateway/sandboxing">
    Backends et modes — référence complète de la sandbox.
  </Card>
  <Card title="Sandbox, politique d’outils et mode élevé" href="/fr/gateway/sandbox-vs-tool-policy-vs-elevated">
    Diagnostiquez « pourquoi est-ce bloqué ? »
  </Card>
  <Card title="Mode élevé" href="/fr/tools/elevated">
    Exécution élevée pour les expéditeurs de confiance.
  </Card>
</CardGroup>

<Warning>
L’authentification est propre à chaque agent : chaque agent possède son propre stockage d’authentification `agentDir` dans `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Ne réutilisez jamais un même `agentDir` pour plusieurs agents. Les agents peuvent consulter les profils d’authentification de l’agent principal/par défaut lorsqu’ils ne disposent pas d’un profil local, mais les jetons d’actualisation OAuth ne sont pas clonés dans les stockages des agents secondaires. Si vous copiez manuellement des identifiants, copiez uniquement les profils statiques portables `api_key` ou `token`.
</Warning>

---

## Exemples de configuration

<AccordionGroup>
  <Accordion title="Exemple 1 : agent personnel et agent familial restreint">
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

    - Agent `main` : s’exécute sur l’hôte et dispose d’un accès complet aux outils.
    - Agent `family` : s’exécute dans Docker (un conteneur par agent) et ne peut utiliser que `read` et l’envoi de messages dans la conversation actuelle.

  </Accordion>
  <Accordion title="Exemple 2 : agent professionnel avec sandbox partagée">
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
  <Accordion title="Exemple 2b : profil global de codage et agent limité à la messagerie">
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

    - Les agents par défaut disposent des outils de codage.
    - L’agent `support` est limité à la messagerie, avec l’outil Slack en plus.

  </Accordion>
  <Accordion title="Exemple 3 : différents modes de sandbox selon l’agent">
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

## Priorité de la configuration

Lorsque des configurations globales (`agents.defaults.*`) et propres à un agent (`agents.list[].*`) coexistent :

### Configuration de la sandbox

Les paramètres propres à l’agent remplacent les paramètres globaux :

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
`agents.list[].sandbox.{docker,browser,prune}.*` remplace `agents.defaults.sandbox.{docker,browser,prune}.*` pour cet agent (ce paramètre est ignoré lorsque la portée de la sandbox est résolue à `"shared"`).
</Note>

### Restrictions des outils

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
  <Step title="Politique d’outils du fournisseur">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Politique d’outils propre à l’agent">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Politique de fournisseur de l’agent">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Politique d’outils de la sandbox">
    `tools.sandbox.tools` ou `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Politique d’outils des sous-agents">
    `tools.subagents.tools`, le cas échéant.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Règles de priorité">
    - Chaque niveau peut restreindre davantage les outils, mais ne peut pas autoriser de nouveau des outils refusés à un niveau antérieur.
    - Si `agents.list[].tools.sandbox.tools` est défini, il remplace `tools.sandbox.tools` pour cet agent.
    - Si `agents.list[].tools.profile` est défini, il remplace `tools.profile` pour cet agent.
    - Les clés d’outils propres au fournisseur acceptent soit `provider` (par exemple `google-antigravity`), soit `provider/model` (par exemple `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Comportement d’une liste d’autorisation vide">
    Si une liste d’autorisation explicite de cette chaîne ne laisse aucun outil appelable à l’exécution, OpenClaw s’arrête avant de soumettre le prompt au modèle. Ce comportement est intentionnel : un agent configuré avec un outil manquant, par exemple `agents.list[].tools.allow: ["query_db"]`, doit échouer explicitement tant que le Plugin qui enregistre `query_db` n’est pas activé, plutôt que de continuer comme agent limité au texte.
  </Accordion>
</AccordionGroup>

Les politiques d’outils prennent en charge les raccourcis `group:*`, qui se développent en plusieurs outils. Consultez les [groupes d’outils](/fr/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) pour obtenir la liste complète.

Les remplacements du mode élevé par agent (`agents.list[].tools.elevated`) peuvent restreindre davantage l’exécution élevée pour certains agents. Consultez le [mode élevé](/fr/tools/elevated) pour plus de détails.

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
Les anciennes clés de configuration `agents.defaults.*`/`agents.list[].*` (telles que `sandbox.perSession`, `agentRuntime`, `embeddedPi`) sont migrées par `openclaw doctor` ; utilisez désormais de préférence `agents.defaults` avec `agents.list`.
</Note>

---

## Exemples de restrictions des outils

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
  <Tab title="Exécution de commandes shell avec les outils de système de fichiers désactivés">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Cette politique désactive les outils de système de fichiers d’OpenClaw, mais `exec` reste un shell et peut écrire des fichiers partout où le système de fichiers de l’hôte ou de la sandbox sélectionné l’autorise. Pour un agent en lecture seule, refusez `exec` et `process`, ou associez l’accès au shell à des contrôles du système de fichiers de la sandbox, tels que `agents.defaults.sandbox.workspaceAccess: "ro"` ou `"none"`.
    </Warning>

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

    Dans ce profil, `sessions_history` renvoie toujours une vue de rappel limitée et assainie plutôt qu’une copie brute de la transcription. Le rappel des réponses de l’assistant supprime les balises de réflexion, la structure `<relevant-memories>`, les charges utiles XML en texte brut des appels d’outils (notamment `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués), les structures d’appels d’outils rétrogradées, les jetons de contrôle du modèle ASCII ou pleine chasse divulgués, ainsi que le XML d’appels d’outils MiniMax mal formé, avant la caviardisation et la troncature.

  </Tab>
</Tabs>

---

## Piège courant : "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` compare la clé de session à celle de la session principale (toujours `"main"` ; `session.mainKey` n’est pas configurable par l’utilisateur, et OpenClaw avertit puis ignore toute autre valeur), et non à l’identifiant de l’agent. Les sessions de groupe ou de canal disposent toujours de leurs propres clés ; elles sont donc considérées comme non principales et placées dans une sandbox. Si vous souhaitez qu’un agent ne soit jamais placé dans une sandbox, définissez `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Tests

Après avoir configuré la sandbox et les outils pour plusieurs agents :

<Steps>
  <Step title="Vérifier la résolution des agents">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Vérifier les conteneurs de sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Tester les restrictions des outils">
    - Envoyez un message nécessitant des outils restreints.
    - Vérifiez que l’agent ne peut pas utiliser les outils refusés.

  </Step>
  <Step title="Surveiller les journaux">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="L’agent n’est pas placé dans une sandbox malgré `mode: 'all'`">
    - Vérifiez s’il existe un paramètre global `agents.defaults.sandbox.mode` qui le remplace.
    - La configuration propre à l’agent est prioritaire ; définissez donc `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Outils toujours disponibles malgré la liste de refus">
    - Consultez l’[ordre de filtrage complet](#tool-restrictions) : profil → profil du fournisseur → politique globale → politique du fournisseur → politique de l’agent → politique du fournisseur de l’agent → bac à sable → sous-agent.
    - Chaque niveau peut uniquement ajouter des restrictions, jamais rétablir des autorisations.
    - Consultez [Bac à sable, politique des outils et mode élevé](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour un débogage étape par étape.

  </Accordion>
  <Accordion title="Conteneur non isolé par agent">
    - La valeur par défaut de `scope` est `"agent"` (un conteneur par identifiant d’agent).
    - Définissez `scope: "session"` pour utiliser un conteneur par session, ou `scope: "shared"` pour réutiliser un conteneur entre plusieurs agents.

  </Accordion>
</AccordionGroup>

---

## Pages connexes

- [Mode élevé](/fr/tools/elevated)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Configuration du bac à sable](/fr/gateway/config-agents#agentsdefaultssandbox)
- [Bac à sable, politique des outils et mode élevé](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) — débogage de « pourquoi ceci est-il bloqué ? »
- [Mise en bac à sable](/fr/gateway/sandboxing) — référence complète du bac à sable (modes, portées, backends, images)
- [Gestion des sessions](/fr/concepts/session)
