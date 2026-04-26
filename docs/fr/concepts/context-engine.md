---
read_when:
    - Vous souhaitez comprendre comment OpenClaw assemble le contexte du modèle
    - Vous basculez entre le moteur hérité et un moteur Plugin
    - Vous créez un Plugin de moteur de contexte
sidebarTitle: Context engine
summary: 'Moteur de contexte : assemblage de contexte extensible, Compaction et cycle de vie des sous-agents'
title: Moteur de contexte
x-i18n:
    generated_at: "2026-04-26T11:26:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a362f26cde3abca7c15487fa43a411f21e3114491e27a752ca06454add60481
    source_path: concepts/context-engine.md
    workflow: 15
---

Un **moteur de contexte** contrôle la manière dont OpenClaw construit le contexte du modèle pour chaque exécution : quels messages inclure, comment résumer l’historique ancien et comment gérer le contexte au-delà des frontières des sous-agents.

OpenClaw est livré avec un moteur intégré `legacy` et l’utilise par défaut — la plupart des utilisateurs n’ont jamais besoin de changer cela. Installez et sélectionnez un moteur Plugin uniquement si vous voulez un assemblage, une Compaction ou un rappel intersession différents.

## Démarrage rapide

<Steps>
  <Step title="Vérifier quel moteur est actif">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Installer un moteur Plugin">
    Les Plugins de moteur de contexte s’installent comme n’importe quel autre Plugin OpenClaw.

    <Tabs>
      <Tab title="Depuis npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Depuis un chemin local">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Activer et sélectionner le moteur">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    Redémarrez le gateway après l’installation et la configuration.

  </Step>
  <Step title="Revenir à legacy (facultatif)">
    Définissez `contextEngine` sur `"legacy"` (ou supprimez complètement la clé — `"legacy"` est la valeur par défaut).
  </Step>
</Steps>

## Fonctionnement

Chaque fois qu’OpenClaw exécute un prompt de modèle, le moteur de contexte intervient à quatre points du cycle de vie :

<AccordionGroup>
  <Accordion title="1. Ingestion">
    Appelé lorsqu’un nouveau message est ajouté à la session. Le moteur peut stocker ou indexer le message dans son propre magasin de données.
  </Accordion>
  <Accordion title="2. Assemblage">
    Appelé avant chaque exécution du modèle. Le moteur renvoie un ensemble ordonné de messages (et un `systemPromptAddition` facultatif) qui tient dans le budget de tokens.
  </Accordion>
  <Accordion title="3. Compaction">
    Appelé lorsque la fenêtre de contexte est pleine, ou lorsque l’utilisateur exécute `/compact`. Le moteur résume l’historique ancien pour libérer de l’espace.
  </Accordion>
  <Accordion title="4. Après le tour">
    Appelé après la fin d’une exécution. Le moteur peut persister l’état, déclencher une Compaction en arrière-plan ou mettre à jour des index.
  </Accordion>
</AccordionGroup>

Pour le harness Codex non-ACP inclus, OpenClaw applique le même cycle de vie en projetant le contexte assemblé dans les instructions développeur Codex et le prompt du tour en cours. Codex conserve néanmoins son historique de fil natif et son compacteur natif.

### Cycle de vie des sous-agents (facultatif)

OpenClaw appelle deux hooks facultatifs du cycle de vie des sous-agents :

<ParamField path="prepareSubagentSpawn" type="method">
  Prépare l’état de contexte partagé avant le démarrage d’une exécution enfant. Le hook reçoit les clés de session parent/enfant, `contextMode` (`isolated` ou `fork`), les identifiants/fichiers de transcript disponibles et un TTL facultatif. S’il renvoie un handle de rollback, OpenClaw l’appelle lorsque le lancement échoue après que la préparation a réussi.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Nettoie lorsqu’une session de sous-agent se termine ou est balayée.
</ParamField>

### Ajout au prompt système

La méthode `assemble` peut renvoyer une chaîne `systemPromptAddition`. OpenClaw la préfixe au prompt système de l’exécution. Cela permet aux moteurs d’injecter dynamiquement des indications de rappel, des instructions de récupération ou des indices sensibles au contexte sans nécessiter de fichiers statiques dans l’espace de travail.

## Le moteur legacy

Le moteur intégré `legacy` préserve le comportement d’origine d’OpenClaw :

- **Ingestion** : no-op (le gestionnaire de session s’occupe directement de la persistance des messages).
- **Assemblage** : passage direct (le pipeline existant sanitize → validate → limit du runtime gère l’assemblage du contexte).
- **Compact** : délègue à la Compaction intégrée par résumé, qui crée un résumé unique des anciens messages et conserve intacts les messages récents.
- **Après le tour** : no-op.

Le moteur legacy n’enregistre pas d’outils et ne fournit pas de `systemPromptAddition`.

Lorsque `plugins.slots.contextEngine` n’est pas défini (ou est défini sur `"legacy"`), ce moteur est utilisé automatiquement.

## Moteurs Plugin

Un Plugin peut enregistrer un moteur de contexte en utilisant l’API Plugin :

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

Puis activez-le dans la config :

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### L’interface ContextEngine

Membres requis :

| Membre             | Type     | But                                                      |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Propriété | Identifiant, nom, version du moteur, et s’il possède la Compaction |
| `ingest(params)`   | Méthode   | Stocker un message unique                                |
| `assemble(params)` | Méthode   | Construire le contexte pour une exécution de modèle (renvoie `AssembleResult`) |
| `compact(params)`  | Méthode   | Résumer/réduire le contexte                              |

`assemble` renvoie un `AssembleResult` avec :

<ParamField path="messages" type="Message[]" required>
  Les messages ordonnés à envoyer au modèle.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  L’estimation du moteur du nombre total de tokens dans le contexte assemblé. OpenClaw l’utilise pour les décisions de seuil de Compaction et pour les rapports de diagnostic.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Préfixé au prompt système.
</ParamField>

Membres facultatifs :

| Membre                         | Type   | But                                                                                                         |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Méthode | Initialiser l’état du moteur pour une session. Appelé une fois lorsque le moteur voit une session pour la première fois (par ex. importer l’historique). |
| `ingestBatch(params)`          | Méthode | Ingérer un tour terminé comme lot. Appelé après la fin d’une exécution, avec tous les messages de ce tour en une seule fois. |
| `afterTurn(params)`            | Méthode | Travail de cycle de vie post-exécution (persister l’état, déclencher une Compaction en arrière-plan). |
| `prepareSubagentSpawn(params)` | Méthode | Configurer l’état partagé pour une session enfant avant son démarrage. |
| `onSubagentEnded(params)`      | Méthode | Nettoyer après la fin d’un sous-agent.                                                                     |
| `dispose()`                    | Méthode | Libérer les ressources. Appelé pendant l’arrêt du gateway ou le rechargement du Plugin — pas par session. |

### ownsCompaction

`ownsCompaction` contrôle si l’auto-Compaction intégrée de Pi pendant la tentative reste activée pour l’exécution :

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Le moteur possède le comportement de Compaction. OpenClaw désactive l’auto-Compaction intégrée de Pi pour cette exécution, et l’implémentation `compact()` du moteur est responsable de `/compact`, de la Compaction de récupération après débordement et de toute Compaction proactive qu’il souhaite effectuer dans `afterTurn()`. OpenClaw peut toujours exécuter la protection préalable au prompt contre le débordement ; lorsqu’il prédit que le transcript complet va déborder, le chemin de récupération appelle `compact()` du moteur actif avant de soumettre un autre prompt.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    L’auto-Compaction intégrée de Pi peut toujours s’exécuter pendant l’exécution du prompt, mais la méthode `compact()` du moteur actif est quand même appelée pour `/compact` et pour la récupération après débordement.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` ne signifie **pas** qu’OpenClaw revient automatiquement au chemin de Compaction du moteur legacy.
</Warning>

Cela signifie qu’il existe deux modèles de Plugin valides :

<Tabs>
  <Tab title="Mode propriétaire">
    Implémentez votre propre algorithme de Compaction et définissez `ownsCompaction: true`.
  </Tab>
  <Tab title="Mode délégation">
    Définissez `ownsCompaction: false` et faites appeler `compact()` à `delegateCompactionToRuntime(...)` depuis `openclaw/plugin-sdk/core` pour utiliser le comportement de Compaction intégré d’OpenClaw.
  </Tab>
</Tabs>

Un `compact()` no-op n’est pas sûr pour un moteur actif non propriétaire, car il désactive le chemin normal de Compaction pour `/compact` et pour la récupération après débordement pour cet emplacement de moteur.

## Référence de configuration

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
L’emplacement est exclusif à l’exécution — un seul moteur de contexte enregistré est résolu pour une exécution donnée ou une opération de Compaction donnée. Les autres Plugins activés de `kind: "context-engine"` peuvent toujours se charger et exécuter leur code d’enregistrement ; `plugins.slots.contextEngine` ne sélectionne que l’identifiant de moteur enregistré qu’OpenClaw résout lorsqu’il a besoin d’un moteur de contexte.
</Note>

<Note>
**Désinstallation du Plugin :** lorsque vous désinstallez le Plugin actuellement sélectionné comme `plugins.slots.contextEngine`, OpenClaw réinitialise l’emplacement à la valeur par défaut (`legacy`). Le même comportement de réinitialisation s’applique à `plugins.slots.memory`. Aucune modification manuelle de la config n’est requise.
</Note>

## Relation avec la Compaction et la mémoire

<AccordionGroup>
  <Accordion title="Compaction">
    La Compaction est l’une des responsabilités du moteur de contexte. Le moteur legacy délègue au résumé intégré d’OpenClaw. Les moteurs Plugin peuvent implémenter n’importe quelle stratégie de Compaction (résumés DAG, récupération vectorielle, etc.).
  </Accordion>
  <Accordion title="Plugins de mémoire">
    Les Plugins de mémoire (`plugins.slots.memory`) sont distincts des moteurs de contexte. Les Plugins de mémoire fournissent la recherche/récupération ; les moteurs de contexte contrôlent ce que le modèle voit. Ils peuvent fonctionner ensemble — un moteur de contexte peut utiliser les données d’un Plugin de mémoire pendant l’assemblage. Les moteurs Plugin qui veulent le chemin de prompt de mémoire active doivent préférer `buildMemorySystemPromptAddition(...)` depuis `openclaw/plugin-sdk/core`, qui convertit les sections actives du prompt mémoire en un `systemPromptAddition` prêt à être préfixé. Si un moteur a besoin d’un contrôle plus bas niveau, il peut toujours extraire les lignes brutes depuis `openclaw/plugin-sdk/memory-host-core` via `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Élagage de session">
    Le trimming des anciens résultats d’outils en mémoire continue de s’exécuter quel que soit le moteur de contexte actif.
  </Accordion>
</AccordionGroup>

## Conseils

- Utilisez `openclaw doctor` pour vérifier que votre moteur se charge correctement.
- Si vous changez de moteur, les sessions existantes conservent leur historique actuel. Le nouveau moteur prend le relais pour les futures exécutions.
- Les erreurs du moteur sont journalisées et remontées dans les diagnostics. Si un moteur Plugin ne parvient pas à s’enregistrer ou si l’identifiant du moteur sélectionné ne peut pas être résolu, OpenClaw ne revient pas automatiquement en arrière ; les exécutions échouent jusqu’à ce que vous corrigiez le Plugin ou que vous redéfinissiez `plugins.slots.contextEngine` sur `"legacy"`.
- Pour le développement, utilisez `openclaw plugins install -l ./my-engine` pour lier un répertoire de Plugin local sans le copier.

## Lié

- [Compaction](/fr/concepts/compaction) — résumé des longues conversations
- [Contexte](/fr/concepts/context) — comment le contexte est construit pour les tours d’agent
- [Architecture des Plugins](/fr/plugins/architecture) — enregistrement des Plugins de moteur de contexte
- [Manifeste de Plugin](/fr/plugins/manifest) — champs du manifeste de Plugin
- [Plugins](/fr/tools/plugin) — vue d’ensemble des Plugins
