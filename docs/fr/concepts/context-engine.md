---
read_when:
    - Vous souhaitez comprendre comment OpenClaw assemble le contexte du modèle
    - Vous basculez entre le moteur hérité et un moteur Plugin
    - Vous créez un plugin de moteur de contexte
sidebarTitle: Context engine
summary: 'Moteur de contexte : assemblage de contexte enfichable, Compaction et cycle de vie des sous-agents'
title: Moteur de contexte
x-i18n:
    generated_at: "2026-05-02T07:04:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7477dd1d48f9633586dce67204912a810e0931d7bc9f2d6719ba465fe19681b
    source_path: concepts/context-engine.md
    workflow: 16
---

Un **moteur de contexte** contrôle la façon dont OpenClaw construit le contexte du modèle pour chaque exécution : quels messages inclure, comment résumer l'historique plus ancien et comment gérer le contexte aux frontières des sous-agents.

OpenClaw est fourni avec un moteur `legacy` intégré et l'utilise par défaut — la plupart des utilisateurs n'ont jamais besoin de le changer. Installez et sélectionnez un moteur plugin uniquement si vous souhaitez un comportement différent pour l'assemblage, la compaction ou le rappel entre sessions.

## Démarrage rapide

<Steps>
  <Step title="Vérifier quel moteur est actif">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Installer un moteur plugin">
    Les plugins de moteur de contexte s'installent comme tout autre plugin OpenClaw.

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

    Redémarrez le Gateway après l'installation et la configuration.

  </Step>
  <Step title="Revenir à legacy (facultatif)">
    Définissez `contextEngine` sur `"legacy"` (ou supprimez entièrement la clé — `"legacy"` est la valeur par défaut).
  </Step>
</Steps>

## Fonctionnement

Chaque fois qu'OpenClaw exécute un prompt de modèle, le moteur de contexte intervient à quatre points du cycle de vie :

<AccordionGroup>
  <Accordion title="1. Ingestion">
    Appelé lorsqu'un nouveau message est ajouté à la session. Le moteur peut stocker ou indexer le message dans son propre stockage de données.
  </Accordion>
  <Accordion title="2. Assemblage">
    Appelé avant chaque exécution du modèle. Le moteur renvoie un ensemble ordonné de messages (et un `systemPromptAddition` facultatif) qui tient dans le budget de jetons.
  </Accordion>
  <Accordion title="3. Compacter">
    Appelé lorsque la fenêtre de contexte est pleine, ou lorsque l'utilisateur exécute `/compact`. Le moteur résume l'historique plus ancien pour libérer de l'espace.
  </Accordion>
  <Accordion title="4. Après le tour">
    Appelé après la fin d'une exécution. Le moteur peut persister l'état, déclencher une compaction en arrière-plan ou mettre à jour les index.
  </Accordion>
</AccordionGroup>

Pour le harnais Codex non-ACP intégré, OpenClaw applique le même cycle de vie en projetant le contexte assemblé dans les instructions développeur de Codex et le prompt du tour courant. Codex conserve toujours son historique de fil natif et son compacteur natif.

### Cycle de vie des sous-agents (facultatif)

OpenClaw appelle deux hooks facultatifs du cycle de vie des sous-agents :

<ParamField path="prepareSubagentSpawn" type="method">
  Prépare l'état de contexte partagé avant le démarrage d'une exécution enfant. Le hook reçoit les clés de session parent/enfant, `contextMode` (`isolated` ou `fork`), les identifiants/fichiers de transcription disponibles et un TTL facultatif. S'il renvoie un handle de rollback, OpenClaw l'appelle lorsque le lancement échoue après une préparation réussie.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Nettoie lorsqu'une session de sous-agent se termine ou est balayée.
</ParamField>

### Ajout au prompt système

La méthode `assemble` peut renvoyer une chaîne `systemPromptAddition`. OpenClaw la préfixe au prompt système de l'exécution. Cela permet aux moteurs d'injecter des consignes de rappel dynamique, des instructions de récupération ou des indices sensibles au contexte sans nécessiter de fichiers d'espace de travail statiques.

## Le moteur legacy

Le moteur `legacy` intégré préserve le comportement d'origine d'OpenClaw :

- **Ingestion** : no-op (le gestionnaire de session gère directement la persistance des messages).
- **Assemblage** : pass-through (le pipeline existant sanitize → validate → limit dans le runtime gère l'assemblage du contexte).
- **Compaction** : délègue à la compaction de résumé intégrée, qui crée un résumé unique des messages plus anciens et conserve les messages récents intacts.
- **Après le tour** : no-op.

Le moteur legacy n'enregistre pas d'outils et ne fournit pas de `systemPromptAddition`.

Quand aucun `plugins.slots.contextEngine` n'est défini (ou qu'il est défini sur `"legacy"`), ce moteur est utilisé automatiquement.

## Moteurs plugins

Un plugin peut enregistrer un moteur de contexte avec l'API du plugin :

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

La factory `ctx` inclut des valeurs facultatives `config`, `agentDir` et `workspaceDir`
afin que les plugins puissent initialiser l'état par agent ou par espace de travail avant
l'exécution du premier hook du cycle de vie.

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

### L'interface ContextEngine

Membres requis :

| Membre             | Type      | Objectif                                                       |
| ------------------ | --------- | -------------------------------------------------------------- |
| `info`             | Propriété | Identifiant du moteur, nom, version et s'il possède la compaction |
| `ingest(params)`   | Méthode   | Stocker un seul message                                        |
| `assemble(params)` | Méthode   | Construire le contexte pour une exécution de modèle (renvoie `AssembleResult`) |
| `compact(params)`  | Méthode   | Résumer/réduire le contexte                                    |

`assemble` renvoie un `AssembleResult` avec :

<ParamField path="messages" type="Message[]" required>
  Les messages ordonnés à envoyer au modèle.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  L'estimation du moteur du nombre total de jetons dans le contexte assemblé. OpenClaw l'utilise pour les décisions de seuil de compaction et les rapports de diagnostic.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Préfixé au prompt système.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Contrôle quelle estimation de jetons l'exécuteur utilise pour les précontrôles
  préventifs de dépassement. La valeur par défaut est `"assembled"`, ce qui signifie
  que seule l'estimation du prompt assemblé est vérifiée — approprié pour les moteurs
  qui renvoient un contexte fenêtré et autonome. Définissez sur
  `"preassembly_may_overflow"` uniquement lorsque votre vue assemblée peut masquer un
  risque de dépassement dans la transcription sous-jacente ; l'exécuteur prend alors
  le maximum entre l'estimation assemblée et l'estimation de l'historique de session
  avant assemblage (non fenêtrée) lorsqu'il décide s'il faut compacter préventivement.
  Dans tous les cas, les messages que vous renvoyez restent ce que le modèle voit —
  `promptAuthority` n'affecte que le précontrôle.
</ParamField>

`compact` renvoie un `CompactResult`. Lorsque la compaction effectue une rotation de la
transcription active, `result.sessionId` et `result.sessionFile` identifient la session
successeur que la prochaine nouvelle tentative ou le prochain tour doit utiliser.

Membres facultatifs :

| Membre                         | Type    | Objectif                                                                                                      |
| ------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Méthode | Initialiser l'état du moteur pour une session. Appelé une fois lorsque le moteur voit une session pour la première fois (par exemple, importer l'historique). |
| `ingestBatch(params)`          | Méthode | Ingérer un tour terminé comme lot. Appelé après la fin d'une exécution, avec tous les messages de ce tour en une seule fois. |
| `afterTurn(params)`            | Méthode | Travail de cycle de vie après exécution (persister l'état, déclencher une compaction en arrière-plan).        |
| `prepareSubagentSpawn(params)` | Méthode | Configurer l'état partagé pour une session enfant avant son démarrage.                                        |
| `onSubagentEnded(params)`      | Méthode | Nettoyer après la fin d'un sous-agent.                                                                        |
| `dispose()`                    | Méthode | Libérer les ressources. Appelé pendant l'arrêt du Gateway ou le rechargement d'un plugin — pas par session.   |

### ownsCompaction

`ownsCompaction` contrôle si l'auto-compaction intégrée en tentative de Pi reste activée pour l'exécution :

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Le moteur possède le comportement de compaction. OpenClaw désactive l'auto-compaction intégrée de Pi pour cette exécution, et l'implémentation `compact()` du moteur est responsable de `/compact`, de la compaction de récupération après dépassement et de toute compaction proactive qu'il souhaite effectuer dans `afterTurn()`. OpenClaw peut toujours exécuter la protection contre le dépassement avant prompt ; lorsqu'elle prédit que la transcription complète dépassera la limite, le chemin de récupération appelle `compact()` du moteur actif avant de soumettre un autre prompt.
  </Accordion>
  <Accordion title="ownsCompaction: false ou non défini">
    L'auto-compaction intégrée de Pi peut toujours s'exécuter pendant l'exécution du prompt, mais la méthode `compact()` du moteur actif est toujours appelée pour `/compact` et la récupération après dépassement.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` ne signifie **pas** qu'OpenClaw revient automatiquement au chemin de compaction du moteur legacy.
</Warning>

Cela signifie qu'il existe deux modèles de plugin valides :

<Tabs>
  <Tab title="Mode avec prise en charge">
    Implémentez votre propre algorithme de compaction et définissez `ownsCompaction: true`.
  </Tab>
  <Tab title="Mode délégation">
    Définissez `ownsCompaction: false` et faites appeler à `compact()` `delegateCompactionToRuntime(...)` depuis `openclaw/plugin-sdk/core` pour utiliser le comportement de compaction intégré d'OpenClaw.
  </Tab>
</Tabs>

Un `compact()` no-op est dangereux pour un moteur actif qui ne possède pas la compaction, car il désactive le chemin normal de compaction `/compact` et de récupération après dépassement pour cet emplacement de moteur.

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
L'emplacement est exclusif à l'exécution — un seul moteur de contexte enregistré est résolu pour une exécution ou une opération de compaction donnée. Les autres plugins activés `kind: "context-engine"` peuvent toujours se charger et exécuter leur code d'enregistrement ; `plugins.slots.contextEngine` sélectionne uniquement l'identifiant de moteur enregistré qu'OpenClaw résout lorsqu'il a besoin d'un moteur de contexte.
</Note>

<Note>
**Désinstallation du plugin :** lorsque vous désinstallez le plugin actuellement sélectionné comme `plugins.slots.contextEngine`, OpenClaw réinitialise l'emplacement à sa valeur par défaut (`legacy`). Le même comportement de réinitialisation s'applique à `plugins.slots.memory`. Aucune modification manuelle de configuration n'est requise.
</Note>

## Relation avec la compaction et la mémoire

<AccordionGroup>
  <Accordion title="Compaction">
    La Compaction est l’une des responsabilités du moteur de contexte. Le moteur hérité délègue à la synthèse intégrée d’OpenClaw. Les moteurs de Plugin peuvent implémenter n’importe quelle stratégie de compaction (résumés DAG, récupération vectorielle, etc.).
  </Accordion>
  <Accordion title="Plugins de mémoire">
    Les plugins de mémoire (`plugins.slots.memory`) sont distincts des moteurs de contexte. Les plugins de mémoire fournissent la recherche/récupération ; les moteurs de contexte contrôlent ce que voit le modèle. Ils peuvent fonctionner ensemble — un moteur de contexte peut utiliser les données du plugin de mémoire pendant l’assemblage. Les moteurs de Plugin qui veulent le chemin d’invite de mémoire active doivent privilégier `buildMemorySystemPromptAddition(...)` depuis `openclaw/plugin-sdk/core`, qui convertit les sections d’invite de mémoire active en un `systemPromptAddition` prêt à être préfixé. Si un moteur a besoin d’un contrôle de plus bas niveau, il peut toujours récupérer les lignes brutes depuis `openclaw/plugin-sdk/memory-host-core` via `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Élagage des sessions">
    La suppression des anciens résultats d’outils en mémoire continue de s’exécuter, quel que soit le moteur de contexte actif.
  </Accordion>
</AccordionGroup>

## Conseils

- Utilisez `openclaw doctor` pour vérifier que votre moteur se charge correctement.
- Si vous changez de moteur, les sessions existantes continuent avec leur historique actuel. Le nouveau moteur prend le relais pour les exécutions futures.
- Les erreurs de moteur sont journalisées et exposées dans les diagnostics. Si un moteur de Plugin ne parvient pas à s’enregistrer ou si l’identifiant du moteur sélectionné ne peut pas être résolu, OpenClaw ne revient pas automatiquement en arrière ; les exécutions échouent jusqu’à ce que vous corrigiez le plugin ou que vous replaciez `plugins.slots.contextEngine` sur `"legacy"`.
- Pour le développement, utilisez `openclaw plugins install -l ./my-engine` pour lier un répertoire de plugin local sans le copier.

## Associés

- [Compaction](/fr/concepts/compaction) — synthèse des longues conversations
- [Contexte](/fr/concepts/context) — comment le contexte est construit pour les tours d’agent
- [Architecture de Plugin](/fr/plugins/architecture) — enregistrement des plugins de moteur de contexte
- [Manifeste de Plugin](/fr/plugins/manifest) — champs du manifeste de plugin
- [Plugins](/fr/tools/plugin) — aperçu des plugins
