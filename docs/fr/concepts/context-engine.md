---
read_when:
    - Vous souhaitez comprendre comment OpenClaw assemble le contexte du modèle
    - Vous basculez entre l’ancien moteur et un moteur de Plugin
    - Vous créez un plugin de moteur de contexte
sidebarTitle: Context engine
summary: 'Moteur de contexte : assemblage de contexte extensible, Compaction et cycle de vie des sous-agents'
title: Moteur de contexte
x-i18n:
    generated_at: "2026-06-30T14:00:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

Un **moteur de contexte** contrôle la façon dont OpenClaw construit le contexte du modèle pour chaque exécution : quels messages inclure, comment résumer l'historique plus ancien et comment gérer le contexte au-delà des limites des sous-agents.

OpenClaw est fourni avec un moteur `legacy` intégré et l'utilise par défaut - la plupart des utilisateurs n'ont jamais besoin de changer cela. Installez et sélectionnez un moteur de plugin uniquement lorsque vous souhaitez un comportement différent d'assemblage, de compaction ou de rappel intersessions.

## Démarrage rapide

<Steps>
  <Step title="Vérifier quel moteur est actif">
    ```bash
    openclaw doctor
    # ou inspecter directement la config :
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Installer un moteur de plugin">
    Les plugins de moteur de contexte s'installent comme n'importe quel autre plugin OpenClaw.

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
          contextEngine: "lossless-claw", // doit correspondre à l'id de moteur enregistré du plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // La config propre au plugin va ici (voir la documentation du plugin)
          },
        },
      },
    }
    ```

    Redémarrez le gateway après l'installation et la configuration.

  </Step>
  <Step title="Revenir à legacy (facultatif)">
    Définissez `contextEngine` sur `"legacy"` (ou supprimez entièrement la clé - `"legacy"` est la valeur par défaut).
  </Step>
</Steps>

## Fonctionnement

Chaque fois qu'OpenClaw exécute une invite de modèle, le moteur de contexte intervient à quatre points du cycle de vie :

<AccordionGroup>
  <Accordion title="1. Ingestion">
    Appelé lorsqu'un nouveau message est ajouté à la session. Le moteur peut stocker ou indexer le message dans son propre magasin de données.
  </Accordion>
  <Accordion title="2. Assembler">
    Appelé avant chaque exécution du modèle. Le moteur renvoie un ensemble ordonné de messages (et un `systemPromptAddition` facultatif) qui tient dans le budget de tokens.
  </Accordion>
  <Accordion title="3. Compacter">
    Appelé lorsque la fenêtre de contexte est pleine, ou lorsque l'utilisateur exécute `/compact`. Le moteur résume l'historique plus ancien pour libérer de l'espace.
  </Accordion>
  <Accordion title="4. Après le tour">
    Appelé après la fin d'une exécution. Le moteur peut persister l'état, déclencher une compaction en arrière-plan ou mettre à jour les index.
  </Accordion>
</AccordionGroup>

Pour le harnais Codex non-ACP intégré, OpenClaw applique le même cycle de vie en projetant le contexte assemblé dans les instructions développeur de Codex et l'invite du tour courant. Codex reste propriétaire de son historique de fil natif et de son compacteur natif.

### Cycle de vie des sous-agents (facultatif)

OpenClaw appelle deux hooks facultatifs du cycle de vie des sous-agents :

<ParamField path="prepareSubagentSpawn" type="method">
  Prépare l'état de contexte partagé avant le démarrage d'une exécution enfant. Le hook reçoit les clés de session parent/enfant, `contextMode` (`isolated` ou `fork`), les ids/fichiers de transcript disponibles et un TTL facultatif. S'il renvoie un handle de rollback, OpenClaw l'appelle lorsque le démarrage échoue après une préparation réussie. Les démarrages de sous-agent natifs qui demandent `lightContext` et se résolvent en `contextMode="isolated"` ignorent intentionnellement ce hook afin que l'enfant démarre depuis le contexte d'amorçage léger sans état de pré-démarrage géré par le moteur de contexte.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Nettoie lorsqu'une session de sous-agent se termine ou est balayée.
</ParamField>

### Ajout à l'invite système

La méthode `assemble` peut renvoyer une chaîne `systemPromptAddition`. OpenClaw l'ajoute au début de l'invite système pour l'exécution. Cela permet aux moteurs d'injecter des indications de rappel dynamiques, des instructions de récupération ou des conseils sensibles au contexte sans nécessiter de fichiers d'espace de travail statiques.

## Le moteur legacy

Le moteur `legacy` intégré préserve le comportement d'origine d'OpenClaw :

- **Ingestion** : no-op (le gestionnaire de session gère directement la persistance des messages).
- **Assembler** : passage direct (le pipeline existant sanitize → validate → limit du runtime gère l'assemblage du contexte).
- **Compacter** : délègue à la compaction de résumé intégrée, qui crée un résumé unique des messages plus anciens et conserve les messages récents intacts.
- **Après le tour** : no-op.

Le moteur legacy n'enregistre pas d'outils et ne fournit pas de `systemPromptAddition`.

Lorsqu'aucun `plugins.slots.contextEngine` n'est défini (ou lorsqu'il est défini sur `"legacy"`), ce moteur est utilisé automatiquement.

## Moteurs de plugin

Un plugin peut enregistrer un moteur de contexte avec l'API de plugin :

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

La fabrique `ctx` inclut des valeurs facultatives `config`, `agentDir` et `workspaceDir`
afin que les plugins puissent initialiser un état par agent ou par espace de travail avant
l'exécution du premier hook de cycle de vie.

Activez-le ensuite dans la config :

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

### L'interface ContextEngine

Membres requis :

| Membre             | Type     | Objectif                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Propriété | Id, nom, version du moteur, et s'il possède la compaction |
| `ingest(params)`   | Méthode   | Stocker un message unique                                   |
| `assemble(params)` | Méthode   | Construire le contexte pour une exécution de modèle (renvoie `AssembleResult`) |
| `compact(params)`  | Méthode   | Résumer/réduire le contexte                                 |

`assemble` renvoie un `AssembleResult` avec :

<ParamField path="messages" type="Message[]" required>
  Les messages ordonnés à envoyer au modèle.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  L'estimation du moteur du nombre total de tokens dans le contexte assemblé. OpenClaw l'utilise pour les décisions de seuil de compaction et le reporting de diagnostic.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Ajouté au début de l'invite système.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Contrôle l'estimation de tokens que le runner utilise pour les précontrôles
  d'overflow préventifs. La valeur par défaut est `"assembled"`, ce qui signifie que seule
  l'estimation de l'invite assemblée est vérifiée pour les moteurs qui ne possèdent pas la compaction.
  Les moteurs qui définissent `ownsCompaction: true` gèrent leur propre admission d'invite,
  donc OpenClaw ignore par défaut le précontrôle générique avant invite. Définissez
  `"preassembly_may_overflow"` uniquement lorsque votre vue assemblée peut masquer un risque
  d'overflow dans le transcript sous-jacent ; le runner garde alors le précontrôle générique
  actif et prend le maximum entre l'estimation assemblée et l'estimation de l'historique de session
  pré-assemblage (sans fenêtrage) lorsqu'il décide s'il faut compacter préventivement.
  Dans tous les cas, les messages que vous renvoyez restent ceux que le modèle
  voit - `promptAuthority` n'affecte que le précontrôle.
</ParamField>

`compact` renvoie un `CompactResult`. Lorsque la compaction fait tourner le
transcript actif, `result.sessionId` et `result.sessionFile` identifient la session
successeur que la prochaine nouvelle tentative ou le prochain tour doit utiliser.

Membres facultatifs :

| Membre                         | Type   | Objectif                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Méthode | Initialiser l'état du moteur pour une session. Appelée une fois lorsque le moteur voit une session pour la première fois (par exemple, importer l'historique). |
| `ingestBatch(params)`          | Méthode | Ingérer un tour terminé sous forme de lot. Appelée après la fin d'une exécution, avec tous les messages de ce tour en une seule fois.     |
| `afterTurn(params)`            | Méthode | Travail de cycle de vie post-exécution (persister l'état, déclencher une compaction en arrière-plan).                                         |
| `prepareSubagentSpawn(params)` | Méthode | Configurer l'état partagé pour une session enfant avant son démarrage.                                                       |
| `onSubagentEnded(params)`      | Méthode | Nettoyer après la fin d'un sous-agent.                                                                                 |
| `dispose()`                    | Méthode | Libérer les ressources. Appelée pendant l'arrêt du Gateway ou le rechargement d'un plugin - pas par session.                           |

### Paramètres d'exécution

Les hooks de cycle de vie exécutés dans OpenClaw reçoivent un objet
`runtimeSettings` facultatif. Il s'agit d'une surface d'API interne
producteur/consommateur versionnée et en lecture seule : OpenClaw le produit pour le moteur de contexte sélectionné,
et le moteur de contexte le consomme dans les hooks de cycle de vie. Il n'est pas
rendu directement aux utilisateurs et ne crée pas de surface de reporting dédiée.

- `schemaVersion` : actuellement `1`
- `runtime` : hôte OpenClaw, mode runtime (`normal`, `fallback` ou
  `degraded`), et ids facultatifs de harnais/runtime
- `contextEngineSelection` : id du moteur de contexte sélectionné et source de sélection
- `executionHost` : id et libellé de l'hôte pour la surface qui invoque le hook
- `model` : modèle demandé, modèle résolu, fournisseur et famille de modèle facultative
- `limits` : budget de tokens de l'invite et nombre maximal de tokens de sortie lorsqu'ils sont connus
- `diagnostics` : codes fermés de raison de fallback et de dégradation lorsqu'ils sont connus

Les champs qui peuvent être inconnus sont représentés par `null` ; les champs discriminants tels
que le mode runtime et la source de sélection restent non nullables. Les moteurs plus anciens restent
compatibles : si un moteur legacy strict rejette `runtimeSettings` en tant que propriété
inconnue, OpenClaw réessaie l'appel de cycle de vie sans celui-ci au lieu de mettre
le moteur en quarantaine.

### Exigences de l'hôte

Les moteurs de contexte peuvent déclarer des exigences de capacités d'hôte sur `info.hostRequirements`.
OpenClaw vérifie ces exigences avant de démarrer l'opération et échoue de façon fermée
avec une erreur descriptive lorsque le runtime sélectionné ne peut pas les satisfaire.

Pour les exécutions d'agent, déclarez `assemble-before-prompt` lorsque le moteur doit contrôler
l'invite réelle du modèle via `assemble()` :

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

Les exécutions d'agent Codex natif et OpenClaw intégré satisfont `assemble-before-prompt`.
Les backends CLI génériques ne le font pas ; les moteurs qui l'exigent sont donc rejetés avant le
démarrage du processus CLI.

### Isolation des échecs

OpenClaw isole le moteur de Plugin sélectionné du chemin de réponse principal. Si un
moteur non hérité est manquant, échoue à la validation du contrat, lève une exception pendant la
création de la fabrique, ou lève une exception depuis une méthode de cycle de vie, OpenClaw met ce moteur
en quarantaine pour le processus Gateway actuel et rétrograde le travail du moteur de contexte vers le
moteur `legacy` intégré. L’erreur est journalisée avec l’opération échouée afin que
l’opérateur puisse réparer, mettre à jour ou désactiver le Plugin sans que l’agent devienne
silencieux.

Les échecs liés aux exigences de l’hôte sont différents : lorsqu’un moteur déclare qu’un runtime
ne dispose pas d’une capacité requise, OpenClaw échoue en mode fermé avant de démarrer l’exécution. Cela
protège les moteurs qui corrompraient l’état s’ils s’exécutaient dans un hôte non pris en charge.

### ownsCompaction

`ownsCompaction` contrôle si l’auto-Compaction intégrée en cours de tentative du runtime OpenClaw reste activée pour l’exécution :

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Le moteur possède le comportement de Compaction. OpenClaw désactive l’auto-Compaction intégrée du runtime OpenClaw et la prévérification générique de dépassement avant l’invite pour cette exécution, et l’implémentation `compact()` du moteur est responsable de `/compact`, de la Compaction de récupération en cas de dépassement du fournisseur, ainsi que de toute Compaction proactive qu’elle souhaite effectuer dans `afterTurn()`. OpenClaw exécute toujours la protection contre le dépassement avant l’invite lorsque le moteur renvoie `promptAuthority: "preassembly_may_overflow"` depuis `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false ou non défini">
    L’auto-Compaction intégrée du runtime OpenClaw peut toujours s’exécuter pendant l’exécution de l’invite, mais la méthode `compact()` du moteur actif est toujours appelée pour `/compact` et la récupération en cas de dépassement.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` ne signifie **pas** qu’OpenClaw revient automatiquement au chemin de Compaction du moteur hérité.
</Warning>

Cela signifie qu’il existe deux modèles de Plugin valides :

<Tabs>
  <Tab title="Mode propriétaire">
    Implémentez votre propre algorithme de Compaction et définissez `ownsCompaction: true`.
  </Tab>
  <Tab title="Mode délégué">
    Définissez `ownsCompaction: false` et faites appeler `delegateCompactionToRuntime(...)` depuis `openclaw/plugin-sdk/core` par `compact()` afin d’utiliser le comportement de Compaction intégré d’OpenClaw.
  </Tab>
</Tabs>

Un `compact()` sans effet est dangereux pour un moteur actif non propriétaire, car il désactive le chemin normal de Compaction `/compact` et de récupération en cas de dépassement pour cet emplacement de moteur.

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
L’emplacement est exclusif à l’exécution : un seul moteur de contexte enregistré est résolu pour une exécution ou une opération de Compaction donnée. Les autres Plugins `kind: "context-engine"` activés peuvent toujours se charger et exécuter leur code d’enregistrement ; `plugins.slots.contextEngine` sélectionne uniquement l’identifiant du moteur enregistré qu’OpenClaw résout lorsqu’il a besoin d’un moteur de contexte.
</Note>

<Note>
**Désinstallation du Plugin :** lorsque vous désinstallez le Plugin actuellement sélectionné comme `plugins.slots.contextEngine`, OpenClaw réinitialise l’emplacement à sa valeur par défaut (`legacy`). Le même comportement de réinitialisation s’applique à `plugins.slots.memory`. Aucune modification manuelle de la configuration n’est requise.
</Note>

## Relation avec la Compaction et la mémoire

<AccordionGroup>
  <Accordion title="Compaction">
    La Compaction est l’une des responsabilités du moteur de contexte. Le moteur hérité délègue à la synthèse intégrée d’OpenClaw. Les moteurs de Plugin peuvent implémenter n’importe quelle stratégie de Compaction (résumés DAG, récupération vectorielle, etc.).
  </Accordion>
  <Accordion title="Plugins de mémoire">
    Les Plugins de mémoire (`plugins.slots.memory`) sont distincts des moteurs de contexte. Les Plugins de mémoire fournissent la recherche/récupération ; les moteurs de contexte contrôlent ce que le modèle voit. Ils peuvent fonctionner ensemble : un moteur de contexte peut utiliser les données d’un Plugin de mémoire pendant l’assemblage. Les moteurs de Plugin qui veulent le chemin actif d’invite de mémoire doivent privilégier `buildMemorySystemPromptAddition(...)` depuis `openclaw/plugin-sdk/core`, qui convertit les sections actives d’invite de mémoire en un `systemPromptAddition` prêt à être préfixé. Si un moteur a besoin d’un contrôle de plus bas niveau, il peut toujours extraire les lignes brutes depuis `openclaw/plugin-sdk/memory-host-core` via `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Élagage de session">
    La suppression des anciens résultats d’outils en mémoire s’exécute toujours, quel que soit le moteur de contexte actif.
  </Accordion>
</AccordionGroup>

## Conseils

- Utilisez `openclaw doctor` pour vérifier que votre moteur se charge correctement.
- Si vous changez de moteur, les sessions existantes continuent avec leur historique actuel. Le nouveau moteur prend le relais pour les futures exécutions.
- Les erreurs de moteur sont journalisées et le moteur de Plugin sélectionné est mis en quarantaine pour le processus Gateway actuel. OpenClaw revient à `legacy` pour les tours utilisateur afin que les réponses puissent continuer, mais vous devez tout de même réparer, mettre à jour, désactiver ou désinstaller le Plugin défectueux.
- Pour le développement, utilisez `openclaw plugins install -l ./my-engine` afin de lier un répertoire de Plugin local sans le copier.

## Liens connexes

- [Compaction](/fr/concepts/compaction) - synthèse des longues conversations
- [Contexte](/fr/concepts/context) - comment le contexte est construit pour les tours d’agent
- [Architecture de Plugin](/fr/plugins/architecture) - enregistrement des Plugins de moteur de contexte
- [Manifeste de Plugin](/fr/plugins/manifest) - champs du manifeste de Plugin
- [Plugins](/fr/tools/plugin) - vue d’ensemble des Plugins
