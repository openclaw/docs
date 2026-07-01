---
read_when:
    - Configuration des groupes de diffusion
    - Déboguer les réponses multi-agents dans WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Diffuser un message WhatsApp à plusieurs agents
title: Groupes de diffusion
x-i18n:
    generated_at: "2026-07-01T05:39:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97e8c2ade5d12a437864e6aca0d475e586289f71155188afed216881ebf89f88
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Statut :** Expérimental. Ajouté dans 2026.1.9.
</Note>

## Présentation

Les groupes de diffusion permettent à plusieurs agents de traiter le même message et d’y répondre simultanément. Cela vous permet de créer des équipes d’agents spécialisés qui travaillent ensemble dans un seul groupe WhatsApp ou message privé, le tout avec un seul numéro de téléphone.

Périmètre actuel : **WhatsApp uniquement** (canal web).

Les groupes de diffusion sont évalués après les listes d’autorisation de canal et les règles d’activation de groupe. Dans les groupes WhatsApp, cela signifie que les diffusions se produisent lorsque OpenClaw répondrait normalement (par exemple : lors d’une mention, selon vos paramètres de groupe).

La voie QA WhatsApp en direct inclut `whatsapp-broadcast-group-fanout`, qui vérifie qu’un message de groupe mentionné peut produire des réponses visibles distinctes de deux agents configurés.

## Cas d’utilisation

<AccordionGroup>
  <Accordion title="1. Équipes d’agents spécialisés">
    Déployez plusieurs agents avec des responsabilités atomiques et ciblées :

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Chaque agent traite le même message et fournit son point de vue spécialisé.

  </Accordion>
  <Accordion title="2. Prise en charge multilingue">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Workflows d’assurance qualité">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Automatisation des tâches">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## Configuration

### Configuration de base

Ajoutez une section `broadcast` de premier niveau (à côté de `bindings`). Les clés sont des identifiants de pairs WhatsApp :

- discussions de groupe : JID de groupe (par ex. `120363403215116621@g.us`)
- messages privés : numéro de téléphone E.164 (par ex. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Résultat :** Quand OpenClaw répondrait dans cette discussion, il exécutera les trois agents.

### Stratégie de traitement

Contrôlez la façon dont les agents traitent les messages :

<Tabs>
  <Tab title="parallel (par défaut)">
    Tous les agents traitent le message simultanément :

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
    Les agents traitent le message dans l’ordre (chacun attend que le précédent ait terminé) :

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
  <Step title="Routage et admission">
    OpenClaw applique les listes d’autorisation de canal, les règles d’activation de groupe et la propriété de liaison ACP configurée.
  </Step>
  <Step title="Vérification de la diffusion">
    Si aucune liaison ACP configurée ne possède la route, OpenClaw vérifie si l’ID du pair se trouve dans `broadcast`.
  </Step>
  <Step title="Si la diffusion s’applique">
    - Tous les agents listés traitent le message.
    - Chaque agent possède sa propre clé de session et son propre contexte isolé.
    - Les agents traitent le message en parallèle (par défaut) ou séquentiellement.

  </Step>
  <Step title="Si la diffusion ne s’applique pas">
    OpenClaw distribue la route ordinaire ou la route de session ACP configurée sélectionnée pendant le routage.
  </Step>
</Steps>

<Note>
Les groupes de diffusion ne contournent pas les listes d’autorisation de canal ni les règles d’activation de groupe (mentions/commandes/etc.). Ils changent uniquement _les agents exécutés_ lorsqu’un message est admissible au traitement.
</Note>

### Isolation des sessions

Chaque agent d’un groupe de diffusion conserve des éléments complètement séparés :

- **Clés de session** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Historique de conversation** (l’agent ne voit pas les messages des autres agents)
- **Espace de travail** (bacs à sable séparés si configurés)
- **Accès aux outils** (listes d’autorisation/refus différentes)
- **Mémoire/contexte** (IDENTITY.md, SOUL.md, etc. séparés)
- **Tampon de contexte de groupe** (messages récents du groupe utilisés comme contexte) partagé par pair, de sorte que tous les agents de diffusion voient le même contexte lorsqu’ils sont déclenchés

Cela permet à chaque agent d’avoir :

- Des personnalités différentes
- Des accès aux outils différents (par ex. lecture seule vs lecture-écriture)
- Des modèles différents (par ex. opus vs sonnet)
- Des Skills différents installés

### Exemple : sessions isolées

Dans le groupe `120363403215116621@g.us` avec les agents `["alfred", "baerbel"]` :

<Tabs>
  <Tab title="Contexte d’Alfred">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Contexte de Bärbel">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Bonnes pratiques

<AccordionGroup>
  <Accordion title="1. Garder les agents ciblés">
    Concevez chaque agent avec une responsabilité unique et claire :

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Bon :** Chaque agent a une seule tâche. ❌ **Mauvais :** Un agent générique "dev-helper".

  </Accordion>
  <Accordion title="2. Utiliser des noms descriptifs">
    Rendez clair ce que fait chaque agent :

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
  <Accordion title="3. Configurer des accès aux outils différents">
    Donnez aux agents uniquement les outils dont ils ont besoin :

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` est en lecture seule. `fixer` peut lire et écrire.

  </Accordion>
  <Accordion title="4. Surveiller les performances">
    Avec de nombreux agents, envisagez :

    - D’utiliser `"strategy": "parallel"` (par défaut) pour la rapidité
    - De limiter les groupes de diffusion à 5 à 10 agents
    - D’utiliser des modèles plus rapides pour les agents plus simples

  </Accordion>
  <Accordion title="5. Gérer les échecs avec élégance">
    Les agents échouent indépendamment. L’erreur d’un agent ne bloque pas les autres :

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
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

- `GROUP_A` : Seul alfred répond (routage normal).
- `GROUP_B` : agent1 ET agent2 répondent (diffusion).

<Note>
**Priorité :** `broadcast` est prioritaire sur les liaisons de route ordinaires. Les liaisons ACP configurées (`bindings[].type="acp"`) sont exclusives : lorsqu’une correspondance existe, OpenClaw distribue à la session ACP configurée au lieu d’une diffusion en éventail.
</Note>

## Dépannage

<AccordionGroup>
  <Accordion title="Les agents ne répondent pas">
    **Vérifiez :**

    1. Les ID d’agent existent dans `agents.list`.
    2. Le format de l’ID du pair est correct (par ex. `120363403215116621@g.us`).
    3. Les agents ne figurent pas dans des listes de refus.

    **Débogage :**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Un seul agent répond">
    **Cause :** L’ID du pair peut être dans les liaisons de route ordinaires mais pas dans `broadcast`, ou il peut correspondre à une liaison ACP configurée exclusive.

    **Correction :** Ajoutez les pairs liés à une route ordinaire à la configuration de diffusion, ou supprimez/modifiez la liaison ACP configurée si une diffusion en éventail est souhaitée.

  </Accordion>
  <Accordion title="Problèmes de performances">
    Si le traitement est lent avec de nombreux agents :

    - Réduisez le nombre d’agents par groupe.
    - Utilisez des modèles plus légers (sonnet au lieu d’opus).
    - Vérifiez le temps de démarrage du bac à sable.

  </Accordion>
</AccordionGroup>

## Exemples

<AccordionGroup>
  <Accordion title="Exemple 1 : Équipe de revue de code">
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

    - code-formatter : "Fixed indentation and added type hints"
    - security-scanner : "⚠️ SQL injection vulnerability in line 12"
    - test-coverage : "Coverage is 45%, missing tests for error cases"
    - docs-checker : "Missing docstring for function `process_data`"

  </Accordion>
  <Accordion title="Exemple 2 : Prise en charge multilingue">
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
  Méthode de traitement des agents. `parallel` exécute tous les agents simultanément ; `sequential` les exécute dans l’ordre du tableau.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID de groupe WhatsApp, numéro E.164 ou autre ID de pair. La valeur est le tableau des ID d’agents qui doivent traiter les messages.
</ParamField>

## Limitations

1. **Nombre maximal d’agents :** Aucune limite stricte, mais 10 agents ou plus peuvent être lents.
2. **Contexte partagé :** Les agents ne voient pas les réponses des autres agents (par conception).
3. **Ordre des messages :** Les réponses parallèles peuvent arriver dans n’importe quel ordre.
4. **Limites de débit :** Tous les agents comptent dans les limites de débit de WhatsApp.

## Améliorations futures

Fonctionnalités prévues :

- [ ] Mode de contexte partagé (les agents voient les réponses des autres agents)
- [ ] Coordination des agents (les agents peuvent se signaler entre eux)
- [ ] Sélection dynamique des agents (choisir les agents en fonction du contenu du message)
- [ ] Priorités des agents (certains agents répondent avant d’autres)

## Articles liés

- [Routage des canaux](/fr/channels/channel-routing)
- [Groupes](/fr/channels/groups)
- [Outils de bac à sable multi-agent](/fr/tools/multi-agent-sandbox-tools)
- [Appairage](/fr/channels/pairing)
- [Gestion des sessions](/fr/concepts/session)
