---
read_when:
    - Configuration des groupes de diffusion
    - Débogage des réponses multi-agents dans WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Diffuser un message WhatsApp à plusieurs agents
title: Groupes de diffusion
x-i18n:
    generated_at: "2026-04-26T11:22:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7b36710d9cc3eb4e2b8ba3d57031bd020aedbb6a502b400ec02a835a320d609
    source_path: channels/broadcast-groups.md
    workflow: 15
---

<Note>
**Statut :** Expérimental. Ajouté dans 2026.1.9.
</Note>

## Vue d’ensemble

Les groupes de diffusion permettent à plusieurs agents de traiter et de répondre simultanément au même message. Cela vous permet de créer des équipes d’agents spécialisées qui travaillent ensemble dans un seul groupe WhatsApp ou message privé — le tout avec un seul numéro de téléphone.

Portée actuelle : **WhatsApp uniquement** (canal web).

Les groupes de diffusion sont évalués après les listes d’autorisation du canal et les règles d’activation de groupe. Dans les groupes WhatsApp, cela signifie que les diffusions se produisent quand OpenClaw répondrait normalement (par exemple : sur mention, selon les paramètres de votre groupe).

## Cas d’utilisation

<AccordionGroup>
  <Accordion title="1. Équipes d’agents spécialisées">
    Déployez plusieurs agents avec des responsabilités atomiques et ciblées :

    ```
    Group: "Équipe de développement"
    Agents:
      - CodeReviewer (examine les extraits de code)
      - DocumentationBot (génère la documentation)
      - SecurityAuditor (vérifie les vulnérabilités)
      - TestGenerator (suggère des cas de test)
    ```

    Chaque agent traite le même message et fournit son point de vue spécialisé.

  </Accordion>
  <Accordion title="2. Prise en charge multilingue">
    ```
    Group: "Support international"
    Agents:
      - Agent_EN (répond en anglais)
      - Agent_DE (répond en allemand)
      - Agent_ES (répond en espagnol)
    ```
  </Accordion>
  <Accordion title="3. Flux d’assurance qualité">
    ```
    Group: "Support client"
    Agents:
      - SupportAgent (fournit une réponse)
      - QAAgent (vérifie la qualité, répond uniquement si des problèmes sont détectés)
    ```
  </Accordion>
  <Accordion title="4. Automatisation des tâches">
    ```
    Group: "Gestion de projet"
    Agents:
      - TaskTracker (met à jour la base de données des tâches)
      - TimeLogger (journalise le temps passé)
      - ReportGenerator (crée des résumés)
    ```
  </Accordion>
</AccordionGroup>

## Configuration

### Configuration de base

Ajoutez une section `broadcast` de niveau supérieur (à côté de `bindings`). Les clés sont des ID de pair WhatsApp :

- conversations de groupe : JID du groupe (par ex. `120363403215116621@g.us`)
- messages privés : numéro de téléphone au format E.164 (par ex. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Résultat :** Quand OpenClaw répondrait dans cette conversation, il exécutera les trois agents.

### Stratégie de traitement

Contrôlez la manière dont les agents traitent les messages :

<Tabs>
  <Tab title="parallel (par défaut)">
    Tous les agents traitent simultanément :

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    Les agents traitent dans l’ordre (l’un attend que le précédent ait terminé) :

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

### Exemple complet

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## Fonctionnement

### Flux des messages

<Steps>
  <Step title="Arrivée d’un message entrant">
    Un message de groupe WhatsApp ou un message privé arrive.
  </Step>
  <Step title="Vérification de la diffusion">
    Le système vérifie si l’ID du pair se trouve dans `broadcast`.
  </Step>
  <Step title="Si présent dans la liste de diffusion">
    - Tous les agents listés traitent le message.
    - Chaque agent dispose de sa propre clé de session et d’un contexte isolé.
    - Les agents traitent en parallèle (par défaut) ou de manière séquentielle.

  </Step>
  <Step title="Si absent de la liste de diffusion">
    Le routage normal s’applique (premier binding correspondant).
  </Step>
</Steps>

<Note>
Les groupes de diffusion ne contournent pas les listes d’autorisation du canal ni les règles d’activation de groupe (mentions/commandes/etc.). Ils modifient uniquement _quels agents s’exécutent_ lorsqu’un message peut être traité.
</Note>

### Isolation des sessions

Chaque agent d’un groupe de diffusion conserve des éléments complètement séparés :

- **Clés de session** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Historique de conversation** (un agent ne voit pas les messages des autres agents)
- **Espace de travail** (sandboxes distincts si configurés)
- **Accès aux outils** (listes d’autorisation/interdiction différentes)
- **Mémoire/contexte** (`IDENTITY.md`, `SOUL.md`, etc. distincts)
- **Tampon de contexte du groupe** (messages récents du groupe utilisés pour le contexte) est partagé par pair, donc tous les agents de diffusion voient le même contexte lorsqu’ils sont déclenchés

Cela permet à chaque agent d’avoir :

- Des personnalités différentes
- Un accès aux outils différent (par ex., lecture seule vs lecture-écriture)
- Des modèles différents (par ex., opus vs sonnet)
- Des Skills différents installés

### Exemple : sessions isolées

Dans le groupe `120363403215116621@g.us` avec les agents `["alfred", "baerbel"]` :

<Tabs>
  <Tab title="Contexte d’Alfred">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [message utilisateur, réponses précédentes d’alfred]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Contexte de Bärbel">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [message utilisateur, réponses précédentes de baerbel]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Bonnes pratiques

<AccordionGroup>
  <Accordion title="1. Gardez les agents ciblés">
    Concevez chaque agent avec une responsabilité unique et claire :

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Bien :** Chaque agent a une seule tâche. ❌ **À éviter :** Un agent générique « dev-helper ».

  </Accordion>
  <Accordion title="2. Utilisez des noms explicites">
    Faites en sorte qu’il soit clair ce que fait chaque agent :

    ```json
    {
      "agents": {
        "security-scanner": { "name": "Security Scanner" },
        "code-formatter": { "name": "Code Formatter" },
        "test-generator": { "name": "Test Generator" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. Configurez des accès aux outils différents">
    Donnez aux agents uniquement les outils dont ils ont besoin :

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // Lecture seule
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // Lecture-écriture
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. Surveillez les performances">
    Avec de nombreux agents, envisagez de :

    - Utiliser `"strategy": "parallel"` (par défaut) pour la rapidité
    - Limiter les groupes de diffusion à 5-10 agents
    - Utiliser des modèles plus rapides pour les agents les plus simples

  </Accordion>
  <Accordion title="5. Gérez les échecs avec souplesse">
    Les agents échouent indépendamment. L’erreur d’un agent ne bloque pas les autres :

    ```
    Message → [Agent A ✓, Agent B ✗ erreur, Agent C ✓]
    Result: Agent A et C répondent, Agent B journalise l’erreur
    ```

  </Accordion>
</AccordionGroup>

## Compatibilité

### Fournisseurs

Les groupes de diffusion fonctionnent actuellement avec :

- ✅ WhatsApp (implémenté)
- 🚧 Telegram (prévu)
- 🚧 Discord (prévu)
- 🚧 Slack (prévu)

### Routage

Les groupes de diffusion fonctionnent avec le routage existant :

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A` : seul alfred répond (routage normal).
- `GROUP_B` : agent1 ET agent2 répondent (diffusion).

<Note>
**Priorité :** `broadcast` a priorité sur `bindings`.
</Note>

## Dépannage

<AccordionGroup>
  <Accordion title="Les agents ne répondent pas">
    **Vérifiez :**

    1. Les ID d’agent existent dans `agents.list`.
    2. Le format de l’ID du pair est correct (par ex. `120363403215116621@g.us`).
    3. Les agents ne figurent pas dans des listes d’interdiction.

    **Débogage :**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Un seul agent répond">
    **Cause :** L’ID du pair est peut-être dans `bindings`, mais pas dans `broadcast`.

    **Correctif :** Ajoutez-le à la configuration de diffusion ou supprimez-le des bindings.

  </Accordion>
  <Accordion title="Problèmes de performances">
    Si c’est lent avec de nombreux agents :

    - Réduisez le nombre d’agents par groupe.
    - Utilisez des modèles plus légers (sonnet au lieu d’opus).
    - Vérifiez le temps de démarrage du sandbox.

  </Accordion>
</AccordionGroup>

## Exemples

<AccordionGroup>
  <Accordion title="Exemple 1 : équipe de revue de code">
    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": [
          "code-formatter",
          "security-scanner",
          "test-coverage",
          "docs-checker"
        ]
      },
      "agents": {
        "list": [
          {
            "id": "code-formatter",
            "workspace": "~/agents/formatter",
            "tools": { "allow": ["read", "write"] }
          },
          {
            "id": "security-scanner",
            "workspace": "~/agents/security",
            "tools": { "allow": ["read", "exec"] }
          },
          {
            "id": "test-coverage",
            "workspace": "~/agents/testing",
            "tools": { "allow": ["read", "exec"] }
          },
          { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
        ]
      }
    }
    ```

    **L’utilisateur envoie :** Extrait de code.

    **Réponses :**

    - code-formatter: "Indentation corrigée et annotations de type ajoutées"
    - security-scanner: "⚠️ Vulnérabilité d’injection SQL à la ligne 12"
    - test-coverage: "La couverture est de 45 %, des tests manquent pour les cas d’erreur"
    - docs-checker: "Docstring manquante pour la fonction `process_data`"

  </Accordion>
  <Accordion title="Exemple 2 : prise en charge multilingue">
    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "+15555550123": ["detect-language", "translator-en", "translator-de"]
      },
      "agents": {
        "list": [
          { "id": "detect-language", "workspace": "~/agents/lang-detect" },
          { "id": "translator-en", "workspace": "~/agents/translate-en" },
          { "id": "translator-de", "workspace": "~/agents/translate-de" }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## Référence API

### Schéma de configuration

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Champs

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  Comment traiter les agents. `parallel` exécute tous les agents simultanément ; `sequential` les exécute dans l’ordre du tableau.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID de groupe WhatsApp, numéro E.164 ou autre ID de pair. La valeur est le tableau des ID d’agent qui doivent traiter les messages.
</ParamField>

## Limites

1. **Nombre maximal d’agents :** Pas de limite stricte, mais 10+ agents peuvent être lents.
2. **Contexte partagé :** Les agents ne voient pas les réponses des autres (par conception).
3. **Ordre des messages :** Les réponses parallèles peuvent arriver dans n’importe quel ordre.
4. **Limites de débit :** Tous les agents comptent dans les limites de débit de WhatsApp.

## Améliorations futures

Fonctionnalités prévues :

- [ ] Mode de contexte partagé (les agents voient les réponses des autres)
- [ ] Coordination des agents (les agents peuvent se signaler entre eux)
- [ ] Sélection dynamique des agents (choisir les agents selon le contenu du message)
- [ ] Priorités d’agent (certains agents répondent avant les autres)

## Connexe

- [Routage des canaux](/fr/channels/channel-routing)
- [Groupes](/fr/channels/groups)
- [Outils de sandbox multi-agent](/fr/tools/multi-agent-sandbox-tools)
- [Appairage](/fr/channels/pairing)
- [Gestion des sessions](/fr/concepts/session)
