---
read_when:
    - Vous voulez comprendre comment OpenClaw assemble le contexte du modèle
    - Vous basculez entre le moteur hérité et un moteur Plugin
    - Vous créez un plugin de moteur de contexte
sidebarTitle: Context engine
summary: 'Moteur de contexte : assemblage de contexte enfichable, Compaction et cycle de vie des sous-agents'
title: Moteur de contexte
x-i18n:
    generated_at: "2026-06-27T17:23:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

Un **moteur de contexte** contrôle la manière dont OpenClaw construit le contexte du modèle pour chaque exécution : quels messages inclure, comment résumer l’historique plus ancien et comment gérer le contexte au-delà des limites des sous-agents.

OpenClaw est fourni avec un moteur `legacy` intégré et l’utilise par défaut - la plupart des utilisateurs n’ont jamais besoin de le modifier. Installez et sélectionnez un moteur Plugin uniquement lorsque vous voulez un comportement différent d’assemblage, de Compaction ou de rappel entre sessions.

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

    Redémarrez le Gateway après l’installation et la configuration.

  </Step>
  <Step title="Revenir à legacy (facultatif)">
    Définissez `contextEngine` sur `"legacy"` (ou supprimez entièrement la clé - `"legacy"` est la valeur par défaut).
  </Step>
</Steps>

## Fonctionnement

Chaque fois qu’OpenClaw exécute un prompt de modèle, le moteur de contexte intervient à quatre points du cycle de vie :

<AccordionGroup>
  <Accordion title="1. Ingestion">
    Appelé lorsqu’un nouveau message est ajouté à la session. Le moteur peut stocker ou indexer le message dans son propre magasin de données.
  </Accordion>
  <Accordion title="2. Assemblage">
    Appelé avant chaque exécution du modèle. Le moteur renvoie un ensemble ordonné de messages (et un `systemPromptAddition` facultatif) qui tiennent dans le budget de jetons.
  </Accordion>
  <Accordion title="3. Compaction">
    Appelé lorsque la fenêtre de contexte est pleine, ou lorsque l’utilisateur exécute `/compact`. Le moteur résume l’historique plus ancien pour libérer de l’espace.
  </Accordion>
  <Accordion title="4. Après le tour">
    Appelé après la fin d’une exécution. Le moteur peut persister l’état, déclencher une Compaction en arrière-plan ou mettre à jour les index.
  </Accordion>
</AccordionGroup>

Pour le harnais Codex non-ACP intégré, OpenClaw applique le même cycle de vie en projetant le contexte assemblé dans les instructions développeur de Codex et le prompt du tour courant. Codex reste propriétaire de son historique de fil natif et de son compacteur natif.

### Cycle de vie des sous-agents (facultatif)

OpenClaw appelle deux hooks facultatifs du cycle de vie des sous-agents :

<ParamField path="prepareSubagentSpawn" type="method">
  Prépare l’état de contexte partagé avant le démarrage d’une exécution enfant. Le hook reçoit les clés de session parent/enfant, `contextMode` (`isolated` ou `fork`), les identifiants/fichiers de transcription disponibles et un TTL facultatif. S’il renvoie un handle de rollback, OpenClaw l’appelle lorsque le lancement échoue après une préparation réussie. Les lancements natifs de sous-agents qui demandent `lightContext` et se résolvent en `contextMode="isolated"` ignorent intentionnellement ce hook afin que l’enfant démarre à partir du contexte d’amorçage léger sans état de pré-lancement géré par le moteur de contexte.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Nettoie lorsqu’une session de sous-agent se termine ou est balayée.
</ParamField>

### Ajout au prompt système

La méthode `assemble` peut renvoyer une chaîne `systemPromptAddition`. OpenClaw l’ajoute en préfixe au prompt système de l’exécution. Cela permet aux moteurs d’injecter des consignes dynamiques de rappel, des instructions de récupération ou des indices sensibles au contexte sans nécessiter de fichiers d’espace de travail statiques.

## Le moteur legacy

Le moteur `legacy` intégré préserve le comportement d’origine d’OpenClaw :

- **Ingestion** : no-op (le gestionnaire de session gère directement la persistance des messages).
- **Assemblage** : pass-through (le pipeline existant sanitize → validate → limit dans le runtime gère l’assemblage du contexte).
- **Compaction** : délègue à la Compaction de synthèse intégrée, qui crée un résumé unique des messages plus anciens et conserve les messages récents intacts.
- **Après le tour** : no-op.

Le moteur legacy n’enregistre pas d’outils et ne fournit pas de `systemPromptAddition`.

Lorsqu’aucun `plugins.slots.contextEngine` n’est défini (ou qu’il est défini sur `"legacy"`), ce moteur est utilisé automatiquement.

## Moteurs Plugin

Un Plugin peut enregistrer un moteur de contexte avec l’API Plugin :

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
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

La fabrique `ctx` inclut des valeurs facultatives `config`, `agentDir` et `workspaceDir` afin que les Plugins puissent initialiser l’état par agent ou par espace de travail avant l’exécution du premier hook de cycle de vie.

Activez-le ensuite dans la configuration :

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

Membres obligatoires :

| Membre             | Type      | Objectif                                                  |
| ------------------ | --------- | --------------------------------------------------------- |
| `info`             | Propriété | Identifiant du moteur, nom, version, et s’il possède la Compaction |
| `ingest(params)`   | Méthode   | Stocker un message unique                                 |
| `assemble(params)` | Méthode   | Construire le contexte pour une exécution de modèle (renvoie `AssembleResult`) |
| `compact(params)`  | Méthode   | Résumer/réduire le contexte                               |

`assemble` renvoie un `AssembleResult` avec :

<ParamField path="messages" type="Message[]" required>
  Les messages ordonnés à envoyer au modèle.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  L’estimation par le moteur du nombre total de jetons dans le contexte assemblé. OpenClaw l’utilise pour les décisions de seuil de Compaction et les rapports de diagnostic.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Ajouté en préfixe au prompt système.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Contrôle quelle estimation de jetons le runner utilise pour les pré-vérifications préventives de débordement. La valeur par défaut est `"assembled"`, ce qui signifie que seule l’estimation du prompt assemblé est vérifiée - approprié pour les moteurs qui renvoient un contexte fenêtré et autonome. Définissez sur `"preassembly_may_overflow"` uniquement lorsque votre vue assemblée peut masquer un risque de débordement dans la transcription sous-jacente ; le runner prend alors le maximum entre l’estimation assemblée et l’estimation de l’historique de session avant assemblage (non fenêtrée) pour décider s’il faut lancer une Compaction préventive. Dans tous les cas, les messages que vous renvoyez restent ce que le modèle voit - `promptAuthority` n’affecte que la pré-vérification.
</ParamField>

`compact` renvoie un `CompactResult`. Lorsque la Compaction fait pivoter la transcription active, `result.sessionId` et `result.sessionFile` identifient la session successeur que la prochaine nouvelle tentative ou le prochain tour doit utiliser.

Membres facultatifs :

| Membre                         | Type    | Objectif                                                                                                        |
| ------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Méthode | Initialiser l’état du moteur pour une session. Appelé une fois lorsque le moteur voit une session pour la première fois (par exemple, import d’historique). |
| `ingestBatch(params)`          | Méthode | Ingérer un tour terminé sous forme de lot. Appelé après la fin d’une exécution, avec tous les messages de ce tour en une seule fois. |
| `afterTurn(params)`            | Méthode | Travail de cycle de vie post-exécution (persister l’état, déclencher une Compaction en arrière-plan). |
| `prepareSubagentSpawn(params)` | Méthode | Configurer l’état partagé pour une session enfant avant son démarrage. |
| `onSubagentEnded(params)`      | Méthode | Nettoyer après la fin d’un sous-agent. |
| `dispose()`                    | Méthode | Libérer les ressources. Appelé pendant l’arrêt du Gateway ou le rechargement du Plugin - pas par session. |

### Paramètres de runtime

Les hooks de cycle de vie qui s’exécutent dans OpenClaw reçoivent un objet `runtimeSettings` facultatif. Il s’agit d’une surface d’API interne versionnée, en lecture seule, entre producteur et consommateur : OpenClaw la produit pour le moteur de contexte sélectionné, et le moteur de contexte la consomme dans les hooks de cycle de vie. Elle n’est pas rendue directement aux utilisateurs et ne crée pas de surface de reporting dédiée.

- `schemaVersion` : actuellement `1`
- `runtime` : hôte OpenClaw, mode de runtime (`normal`, `fallback` ou `degraded`) et identifiants de harnais/runtime facultatifs
- `contextEngineSelection` : identifiant du moteur de contexte sélectionné et source de sélection
- `executionHost` : identifiant et libellé de l’hôte pour la surface qui invoque le hook
- `model` : modèle demandé, modèle résolu, fournisseur et famille de modèle facultative
- `limits` : budget de jetons du prompt et nombre maximal de jetons de sortie lorsque connus
- `diagnostics` : codes fermés de fallback et de raison dégradée lorsque connus

Les champs qui peuvent être inconnus sont représentés par `null` ; les champs discriminateurs comme le mode de runtime et la source de sélection restent non nullables. Les anciens moteurs restent compatibles : si un moteur legacy strict rejette `runtimeSettings` comme propriété inconnue, OpenClaw réessaie l’appel de cycle de vie sans celui-ci au lieu de mettre le moteur en quarantaine.

### Exigences de l’hôte

Les moteurs de contexte peuvent déclarer des exigences de capacité de l’hôte sur `info.hostRequirements`. OpenClaw vérifie ces exigences avant de démarrer l’opération et échoue de manière fermée avec une erreur descriptive lorsque le runtime sélectionné ne peut pas les satisfaire.

Pour les exécutions d’agent, déclarez `assemble-before-prompt` lorsque le moteur doit contrôler le prompt réel du modèle via `assemble()` :

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

Les exécutions d’agent natives Codex et intégrées à OpenClaw satisfont `assemble-before-prompt`. Les backends CLI génériques ne le font pas, donc les moteurs qui l’exigent sont rejetés avant le démarrage du processus CLI.

### Isolation des défaillances

OpenClaw isole le moteur Plugin sélectionné du chemin de réponse principal. Si un moteur non legacy est absent, échoue à la validation du contrat, lance une erreur pendant la création de la fabrique ou lance une erreur depuis une méthode de cycle de vie, OpenClaw met ce moteur en quarantaine pour le processus Gateway courant et rétrograde le travail du moteur de contexte vers le moteur `legacy` intégré. L’erreur est journalisée avec l’opération échouée afin que l’opérateur puisse réparer, mettre à jour ou désactiver le Plugin sans que l’agent devienne silencieux.

Les échecs d’exigences de l’hôte sont différents : lorsqu’un moteur déclare qu’un runtime
ne dispose pas d’une capacité requise, OpenClaw échoue en mode fermé avant de démarrer l’exécution. Cela
protège les moteurs qui corrompraient l’état s’ils s’exécutaient dans un hôte non pris en charge.

### ownsCompaction

`ownsCompaction` contrôle si l’auto-compaction intégrée en cours de tentative du runtime OpenClaw reste activée pour l’exécution :

<AccordionGroup>
  <Accordion title="ownsCompaction : true">
    Le moteur possède le comportement de compaction. OpenClaw désactive l’auto-compaction intégrée du runtime OpenClaw pour cette exécution, et l’implémentation `compact()` du moteur est responsable de `/compact`, de la compaction de récupération après dépassement, ainsi que de toute compaction proactive qu’il souhaite effectuer dans `afterTurn()`. OpenClaw peut toujours exécuter la protection contre le dépassement avant l’invite ; lorsqu’elle prédit que la transcription complète dépassera la limite, le chemin de récupération appelle `compact()` du moteur actif avant de soumettre une autre invite.
  </Accordion>
  <Accordion title="ownsCompaction : false ou non défini">
    L’auto-compaction intégrée du runtime OpenClaw peut toujours s’exécuter pendant l’exécution de l’invite, mais la méthode `compact()` du moteur actif est toujours appelée pour `/compact` et la récupération après dépassement.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` ne signifie **pas** qu’OpenClaw revient automatiquement au chemin de compaction du moteur hérité.
</Warning>

Cela signifie qu’il existe deux modèles de plugin valides :

<Tabs>
  <Tab title="Mode propriétaire">
    Implémentez votre propre algorithme de compaction et définissez `ownsCompaction: true`.
  </Tab>
  <Tab title="Mode délégué">
    Définissez `ownsCompaction: false` et faites appeler `delegateCompactionToRuntime(...)` depuis `openclaw/plugin-sdk/core` par `compact()` pour utiliser le comportement de compaction intégré d’OpenClaw.
  </Tab>
</Tabs>

Un `compact()` sans effet est dangereux pour un moteur actif non propriétaire, car il désactive le chemin normal de compaction `/compact` et de récupération après dépassement pour cet emplacement de moteur.

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
L’emplacement est exclusif au moment de l’exécution : un seul moteur de contexte enregistré est résolu pour une exécution ou une opération de compaction donnée. Les autres plugins `kind: "context-engine"` activés peuvent toujours se charger et exécuter leur code d’enregistrement ; `plugins.slots.contextEngine` sélectionne uniquement l’id du moteur enregistré qu’OpenClaw résout lorsqu’il a besoin d’un moteur de contexte.
</Note>

<Note>
**Désinstallation de plugin :** lorsque vous désinstallez le plugin actuellement sélectionné comme `plugins.slots.contextEngine`, OpenClaw réinitialise l’emplacement à sa valeur par défaut (`legacy`). Le même comportement de réinitialisation s’applique à `plugins.slots.memory`. Aucune modification manuelle de la configuration n’est requise.
</Note>

## Relation avec la compaction et la mémoire

<AccordionGroup>
  <Accordion title="Compaction">
    La compaction est l’une des responsabilités du moteur de contexte. Le moteur hérité délègue à la synthèse intégrée d’OpenClaw. Les moteurs de plugin peuvent implémenter n’importe quelle stratégie de compaction (résumés DAG, récupération vectorielle, etc.).
  </Accordion>
  <Accordion title="Plugins de mémoire">
    Les plugins de mémoire (`plugins.slots.memory`) sont distincts des moteurs de contexte. Les plugins de mémoire fournissent la recherche/récupération ; les moteurs de contexte contrôlent ce que voit le modèle. Ils peuvent fonctionner ensemble : un moteur de contexte peut utiliser les données du plugin de mémoire pendant l’assemblage. Les moteurs de plugin qui veulent utiliser le chemin d’invite de mémoire actif devraient privilégier `buildMemorySystemPromptAddition(...)` depuis `openclaw/plugin-sdk/core`, qui convertit les sections d’invite de mémoire actives en un `systemPromptAddition` prêt à être préfixé. Si un moteur a besoin d’un contrôle de plus bas niveau, il peut toujours extraire les lignes brutes depuis `openclaw/plugin-sdk/memory-host-core` via `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Élagage des sessions">
    La suppression en mémoire des anciens résultats d’outils s’exécute toujours, quel que soit le moteur de contexte actif.
  </Accordion>
</AccordionGroup>

## Conseils

- Utilisez `openclaw doctor` pour vérifier que votre moteur se charge correctement.
- Si vous changez de moteur, les sessions existantes conservent leur historique actuel. Le nouveau moteur prend le relais pour les futures exécutions.
- Les erreurs du moteur sont journalisées et le moteur de plugin sélectionné est mis en quarantaine pour le processus Gateway actuel. OpenClaw revient à `legacy` pour les tours utilisateur afin que les réponses puissent continuer, mais vous devriez tout de même réparer, mettre à jour, désactiver ou désinstaller le plugin défectueux.
- Pour le développement, utilisez `openclaw plugins install -l ./my-engine` afin de lier un répertoire de plugin local sans le copier.

## Associés

- [Compaction](/fr/concepts/compaction) - synthèse des longues conversations
- [Contexte](/fr/concepts/context) - comment le contexte est construit pour les tours d’agent
- [Architecture des plugins](/fr/plugins/architecture) - enregistrement de plugins de moteur de contexte
- [Manifeste de plugin](/fr/plugins/manifest) - champs du manifeste de plugin
- [Plugins](/fr/tools/plugin) - vue d’ensemble des plugins
