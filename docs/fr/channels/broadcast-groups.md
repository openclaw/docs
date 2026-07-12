---
read_when:
    - Configuration des groupes de diffusion
    - Débogage des réponses multi-agents dans WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Diffuser un message WhatsApp à plusieurs agents
title: Groupes de diffusion
x-i18n:
    generated_at: "2026-07-12T15:02:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Statut :** Expérimental. Ajouté dans la version 2026.1.9. WhatsApp (canal web) uniquement.
</Note>

## Vue d’ensemble

Les groupes de diffusion exécutent **plusieurs agents** pour le même message entrant. Chaque agent traite le message dans sa propre session isolée et publie sa propre réponse. Un même numéro WhatsApp peut ainsi héberger une équipe d’agents spécialisés dans une seule discussion de groupe ou un seul message privé.

Les groupes de diffusion sont évalués après les listes d’autorisation des canaux et les règles d’activation des groupes. Dans les groupes WhatsApp, la diffusion se produit lorsqu’OpenClaw répondrait normalement (par exemple, lors d’une mention, selon les paramètres de votre groupe). Elle modifie uniquement **les agents exécutés**, jamais l’admissibilité d’un message au traitement.

Le parcours d’assurance qualité WhatsApp en direct comprend `whatsapp-broadcast-group-fanout`, qui vérifie qu’un message de groupe mentionnant le service peut produire des réponses visibles distinctes de deux agents configurés.

## Configuration

### Configuration de base

Ajoutez une section `broadcast` de premier niveau (à côté de `bindings`). Les clés sont les identifiants de pairs WhatsApp et les valeurs sont des tableaux d’identifiants d’agents :

- discussions de groupe : JID du groupe (par exemple `120363403215116621@g.us`)
- messages privés : numéro de téléphone E.164 de l’expéditeur (par exemple `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Résultat :** lorsqu’OpenClaw répondrait dans cette discussion, il exécute les trois agents.

Chaque identifiant d’agent répertorié doit exister dans `agents.list` : la validation de la configuration signale les identifiants inconnus et l’environnement d’exécution les ignore en émettant l’avertissement `Broadcast agent <id> not found in agents.list; skipping`.

### Stratégie de traitement

`broadcast.strategy` définit la manière dont les agents traitent le message :

| Stratégie            | Comportement                                                                        |
| -------------------- | ----------------------------------------------------------------------------------- |
| `parallel` (défaut)  | Tous les agents traitent le message simultanément ; les réponses arrivent sans ordre défini. |
| `sequential`         | Les agents traitent le message dans l’ordre du tableau ; chacun attend que le précédent ait terminé. |

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

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
    Un message de groupe ou privé WhatsApp arrive.
  </Step>
  <Step title="Routage et admission">
    OpenClaw applique les listes d’autorisation des canaux, les règles d’activation des groupes et la propriété des liaisons ACP configurées.
  </Step>
  <Step title="Vérification de la diffusion">
    Si aucune liaison ACP configurée ne possède la route, OpenClaw vérifie si l’identifiant du pair figure dans `broadcast`.
  </Step>
  <Step title="Si la diffusion s’applique">
    - Tous les agents répertoriés traitent le message.
    - Chaque agent possède sa propre clé de session et son propre contexte isolé.
    - Les agents traitent le message en parallèle (par défaut) ou séquentiellement.
    - Les pièces jointes audio sont transcrites une seule fois avant la distribution, afin que les agents partagent une même transcription au lieu d’effectuer des appels STT distincts.

  </Step>
  <Step title="Si la diffusion ne s’applique pas">
    OpenClaw transmet le message à la route ordinaire ou à la route de session ACP configurée sélectionnée pendant le routage.
  </Step>
</Steps>

<Note>
Les groupes de diffusion ne contournent pas les listes d’autorisation des canaux ni les règles d’activation des groupes (mentions, commandes, etc.). Ils modifient uniquement _les agents exécutés_ lorsqu’un message est admissible au traitement.
</Note>

### Isolation des sessions

Chaque agent d’un groupe de diffusion conserve des éléments entièrement distincts :

- **Clés de session** (`agent:alfred:whatsapp:group:120363...` par rapport à `agent:baerbel:whatsapp:group:120363...`)
- **Historique de conversation** (un agent ne voit pas les réponses des autres agents)
- **Espace de travail** (environnements isolés distincts s’ils sont configurés)
- **Accès aux outils** (listes d’autorisation et de refus différentes)
- **Mémoire/contexte** (`IDENTITY.md`, `SOUL.md`, etc. distincts)

Une exception est volontairement partagée : le **tampon de contexte du groupe** (les messages récents du groupe utilisés comme contexte) est partagé par pair, afin que tous les agents de diffusion voient le même contexte lorsqu’ils sont déclenchés. Il est effacé une seule fois après la fin de la distribution.

Chaque agent peut ainsi disposer de personnalités, modèles, Skills et accès aux outils différents (par exemple, lecture seule par rapport à lecture-écriture).

### Exemple : sessions isolées

Dans le groupe `120363403215116621@g.us` avec les agents `["alfred", "baerbel"]` :

<Tabs>
  <Tab title="Contexte d’Alfred">
    ```text
    Session : agent:alfred:whatsapp:group:120363403215116621@g.us
    Historique : [message de l’utilisateur, réponses précédentes d’alfred]
    Espace de travail : ~/openclaw-alfred/
    Outils : lecture, écriture, exécution
    ```
  </Tab>
  <Tab title="Contexte de Baerbel">
    ```text
    Session : agent:baerbel:whatsapp:group:120363403215116621@g.us
    Historique : [message de l’utilisateur, réponses précédentes de baerbel]
    Espace de travail : ~/openclaw-baerbel/
    Outils : lecture seule
    ```
  </Tab>
</Tabs>

## Cas d’utilisation

- **Équipes d’agents spécialisés** : un groupe de développement dans lequel `code-reviewer`, `security-auditor`, `test-generator` et `docs-checker` répondent chacun au même message selon leur propre domaine.
- **Assistance multilingue** : une seule discussion d’assistance dans laquelle `support-en`, `support-de` et `support-es` répondent dans leurs langues respectives.
- **Assurance qualité** : `support-agent` répond tandis que `qa-agent` examine la réponse et ne répond que s’il détecte des problèmes.
- **Automatisation des tâches** : `task-tracker`, `time-logger` et `report-generator` traitent tous la même mise à jour d’état.

## Bonnes pratiques

<AccordionGroup>
  <Accordion title="1. Maintenir des agents spécialisés">
    Attribuez à chaque agent une responsabilité unique et claire (`formatter`, `linter`, `tester`) plutôt que de recourir à un agent générique "dev-helper".
  </Accordion>
  <Accordion title="2. Utiliser des identifiants et des noms descriptifs">
    ```json
    {
      "agents": {
        "list": [
          { "id": "security-scanner", "name": "Security Scanner" },
          { "id": "code-formatter", "name": "Code Formatter" },
          { "id": "test-generator", "name": "Test Generator" }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="3. Configurer différents accès aux outils">
    ```json
    {
      "agents": {
        "list": [
          { "id": "reviewer", "tools": { "allow": ["read", "exec"] } },
          { "id": "fixer", "tools": { "allow": ["read", "write", "edit", "exec"] } }
        ]
      }
    }
    ```

    `reviewer` dispose d’un accès en lecture seule. `fixer` peut lire et écrire.

  </Accordion>
  <Accordion title="4. Surveiller les performances">
    Avec de nombreux agents, privilégiez `"strategy": "parallel"` (valeur par défaut), limitez les groupes de diffusion à quelques agents et utilisez des modèles plus rapides pour les agents les plus simples.
  </Accordion>
  <Accordion title="5. Maintenir les échecs isolés">
    Les agents échouent indépendamment. L’erreur d’un agent est journalisée (`Broadcast agent <id> failed: ...`) et ne bloque pas les autres.
  </Accordion>
</AccordionGroup>

## Compatibilité

### Fournisseurs

Les groupes de diffusion ne sont actuellement mis en œuvre que pour WhatsApp (canal web). Les autres canaux ignorent la configuration `broadcast`.

### Routage

Les groupes de diffusion fonctionnent parallèlement au routage existant :

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
**Priorité :** `broadcast` est prioritaire sur les liaisons de route ordinaires. Les liaisons ACP configurées (`bindings[].type="acp"`) sont exclusives : lorsqu’une liaison correspond, OpenClaw transmet le message à la session ACP configurée au lieu d’effectuer une diffusion distribuée.
</Note>

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="Les agents ne répondent pas">
    **Vérifiez les points suivants :**

    1. Les identifiants des agents existent dans `agents.list` (la validation de la configuration rejette les identifiants inconnus).
    2. Le format de l’identifiant du pair est correct (JID de groupe tel que `120363403215116621@g.us`, ou numéro E.164 tel que `+15551234567` pour les messages privés).
    3. Le message a franchi les contrôles habituels (les règles de mention et d’activation restent applicables).

    **Débogage :**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    Une distribution réussie journalise `Broadcasting message to <n> agents (<strategy>)`.

  </Accordion>
  <Accordion title="Un seul agent répond">
    **Cause :** l’identifiant du pair peut figurer dans les liaisons de route ordinaires, mais pas dans `broadcast`, ou il peut correspondre à une liaison ACP configurée exclusive.

    **Solution :** ajoutez les pairs liés à une route ordinaire à la configuration de diffusion, ou supprimez/modifiez la liaison ACP configurée si vous souhaitez une diffusion distribuée.

  </Accordion>
  <Accordion title="Problèmes de performances">
    En cas de lenteur avec de nombreux agents : réduisez le nombre d’agents par groupe, utilisez des modèles plus légers et vérifiez le temps de démarrage de l’environnement isolé.
  </Accordion>
</AccordionGroup>

## Exemples

<AccordionGroup>
  <Accordion title="Exemple 1 : équipe de révision de code">
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

    Un extrait de code publié dans le groupe produit quatre réponses : des corrections de mise en forme, un problème de sécurité, une lacune de couverture et une remarque sur la documentation.

  </Accordion>
  <Accordion title="Exemple 2 : chaîne de traitement multilingue">
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

## Référence de l’API

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
  JID du groupe WhatsApp ou numéro de téléphone E.164. La valeur est le tableau des identifiants des agents qui doivent tous traiter les messages provenant de ce pair.
</ParamField>

## Limites

1. **Nombre maximal d’agents :** aucune limite stricte, mais de nombreux agents (10+) peuvent ralentir le traitement.
2. **Contexte partagé :** les agents ne voient pas les réponses des autres agents (par conception).
3. **Ordre des messages :** les réponses parallèles peuvent arriver dans n’importe quel ordre.
4. **Limites de débit :** toutes les réponses proviennent d’un seul compte WhatsApp ; la réponse de chaque agent est donc comptabilisée dans les mêmes limites de débit WhatsApp.

## Voir aussi

- [Routage des canaux](/fr/channels/channel-routing)
- [Groupes](/fr/channels/groups)
- [Outils de bac à sable multi-agents](/fr/tools/multi-agent-sandbox-tools)
- [Appairage](/fr/channels/pairing)
- [Gestion des sessions](/fr/concepts/session)
