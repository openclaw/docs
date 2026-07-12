---
read_when:
    - Vous souhaitez comprendre comment OpenClaw assemble le contexte du modèle
    - Vous basculez entre le moteur hérité et un moteur de Plugin
    - Vous développez un plugin de moteur de contexte
sidebarTitle: Context engine
summary: 'Moteur de contexte : assemblage de contexte extensible, compaction et cycle de vie des sous-agents'
title: Moteur de contexte
x-i18n:
    generated_at: "2026-07-12T15:14:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 05cb5eb01f002001354dc63b77cdb86f3e9f3bc51722bd943ac20c9e1566dc60
    source_path: concepts/context-engine.md
    workflow: 16
---

Un **moteur de contexte** contrôle la manière dont OpenClaw construit le contexte du modèle pour chaque exécution : quels messages inclure, comment résumer l’historique ancien et comment gérer le contexte au-delà des limites des sous-agents.

OpenClaw est fourni avec un moteur `legacy` intégré et l’utilise par défaut. Installez et sélectionnez un moteur de Plugin uniquement si vous souhaitez un comportement différent pour l’assemblage, la compaction ou le rappel intersession.

## Démarrage rapide

<Steps>
  <Step title="Vérifier quel moteur est actif">
    ```bash
    openclaw doctor
    # ou inspectez directement la configuration :
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Installer un moteur de Plugin">
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
          contextEngine: "lossless-claw", // doit correspondre à l’identifiant de moteur enregistré par le Plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // La configuration propre au Plugin se place ici (consultez sa documentation)
          },
        },
      },
    }
    ```

    Redémarrez le Gateway après l’installation et la configuration.

  </Step>
  <Step title="Revenir au moteur legacy (facultatif)">
    Définissez `contextEngine` sur `"legacy"` (ou supprimez entièrement la clé — `"legacy"` est la valeur par défaut).
  </Step>
</Steps>

## Fonctionnement

Chaque fois qu’OpenClaw exécute une invite de modèle, le moteur de contexte intervient à quatre étapes du cycle de vie :

<AccordionGroup>
  <Accordion title="1. Ingestion">
    Appelée lorsqu’un nouveau message est ajouté à la session. Le moteur peut stocker ou indexer le message dans son propre magasin de données.
  </Accordion>
  <Accordion title="2. Assemblage">
    Appelée avant chaque exécution du modèle. Le moteur renvoie un ensemble ordonné de messages (et un `systemPromptAddition` facultatif) respectant le budget de jetons.
  </Accordion>
  <Accordion title="3. Compaction">
    Appelée lorsque la fenêtre de contexte est pleine ou lorsque l’utilisateur exécute `/compact`. Le moteur résume l’historique ancien afin de libérer de l’espace.
  </Accordion>
  <Accordion title="4. Après le tour">
    Appelée après la fin d’une exécution. Le moteur peut conserver l’état, déclencher une compaction en arrière-plan ou mettre à jour les index.
  </Accordion>
</AccordionGroup>

Les moteurs peuvent également implémenter une méthode facultative `maintain()` pour la maintenance de la transcription (réécritures sûres via `runtimeContext.rewriteTranscriptEntries()`) après l’amorçage, un tour réussi ou une compaction. Définissez `info.turnMaintenanceMode: "background"` pour l’exécuter comme tâche différée plutôt que de bloquer la réponse.

Pour le banc d’exécution Codex non-ACP inclus, OpenClaw applique le même cycle de vie en projetant le contexte assemblé dans les instructions destinées au développeur Codex et dans l’invite du tour actuel. Codex reste responsable de son historique de fil natif et de son compacteur natif.

### Cycle de vie des sous-agents (facultatif)

OpenClaw appelle deux hooks facultatifs du cycle de vie des sous-agents :

<ParamField path="prepareSubagentSpawn" type="method">
  Préparez l’état de contexte partagé avant le démarrage d’une exécution enfant. Le hook reçoit les clés de session parent/enfant, `contextMode` (`isolated` ou `fork`), les identifiants/fichiers de transcription disponibles et une durée de vie facultative. S’il renvoie un gestionnaire d’annulation, OpenClaw l’appelle lorsque la création échoue après une préparation réussie. Les créations natives de sous-agents qui demandent `lightContext` et sont résolues avec `contextMode="isolated"` ignorent intentionnellement ce hook afin que l’enfant démarre à partir du contexte d’amorçage léger, sans état de précréation géré par le moteur de contexte.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Effectuez le nettoyage lorsqu’une session de sous-agent se termine ou est purgée.
</ParamField>

### Ajout à l’invite système

La méthode `assemble` peut renvoyer une chaîne `systemPromptAddition`. OpenClaw la préfixe à l’invite système de l’exécution. Cela permet aux moteurs d’injecter des consignes de rappel dynamiques, des instructions de récupération ou des indications tenant compte du contexte sans nécessiter de fichiers statiques dans l’espace de travail.

## Le moteur legacy

Le moteur `legacy` intégré préserve le comportement d’origine d’OpenClaw :

- **Ingestion** : aucune opération (le gestionnaire de session prend directement en charge la persistance des messages).
- **Assemblage** : transmission directe (le pipeline existant de nettoyage → validation → limitation dans l’environnement d’exécution gère l’assemblage du contexte).
- **Compaction** : délègue à la compaction par résumé intégrée, qui crée un résumé unique des messages anciens et conserve les messages récents intacts.
- **Après le tour** : aucune opération.

Le moteur legacy n’enregistre aucun outil et ne fournit aucun `systemPromptAddition`.

Lorsque `plugins.slots.contextEngine` n’est pas défini (ou est défini sur `"legacy"`), ce moteur est utilisé automatiquement.

## Moteurs de Plugin

Un Plugin peut enregistrer un moteur de contexte à l’aide de l’API de Plugin :

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Stockez le message dans votre magasin de données
      return { ingested: true };
    },

    async assemble({
      sessionId,
      sessionKey,
      messages,
      tokenBudget,
      availableTools,
      citationsMode,
    }) {
      // Renvoyez des messages qui respectent le budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Résumez le contexte ancien
      return { ok: true, compacted: true };
    },
  }));
}
```

La fabrique `ctx` inclut des valeurs facultatives `config`, `agentDir` et `workspaceDir`
afin que les Plugins puissent initialiser un état propre à l’agent ou à l’espace de travail avant l’exécution du
premier hook du cycle de vie.

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

| Membre             | Type      | Objectif                                                        |
| ------------------ | --------- | --------------------------------------------------------------- |
| `info`             | Propriété | Identifiant, nom et version du moteur, et gestion de la compaction |
| `ingest(params)`   | Méthode   | Stocker un message unique                                      |
| `assemble(params)` | Méthode   | Construire le contexte pour une exécution du modèle (renvoie `AssembleResult`) |
| `compact(params)`  | Méthode   | Résumer/réduire le contexte                                    |

`assemble` renvoie un `AssembleResult` comprenant :

<ParamField path="messages" type="Message[]" required>
  Les messages ordonnés à envoyer au modèle.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  L’estimation par le moteur du nombre total de jetons dans le contexte assemblé. OpenClaw l’utilise pour les décisions relatives au seuil de compaction et les rapports de diagnostic.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Préfixé à l’invite système.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Contrôle l’estimation du nombre de jetons utilisée par l’exécuteur pour les
  vérifications préventives de dépassement. La valeur par défaut est `"assembled"`, ce qui signifie que seule
  l’estimation de l’invite assemblée est vérifiée pour les moteurs qui ne gèrent pas la compaction.
  Les moteurs qui définissent `ownsCompaction: true` gèrent eux-mêmes l’admission de leurs invites ;
  OpenClaw ignore donc par défaut la vérification générique préalable à l’invite. Définissez
  `"preassembly_may_overflow"` uniquement lorsque votre vue assemblée peut masquer un risque de dépassement
  dans la transcription sous-jacente ; l’exécuteur conserve alors la vérification générique
  active et utilise le maximum entre l’estimation assemblée et l’estimation de
  l’historique de session avant assemblage (sans fenêtrage) pour décider s’il faut
  effectuer une compaction préventive. Dans tous les cas, les messages que vous renvoyez restent ceux que
  voit le modèle — `promptAuthority` affecte uniquement la vérification préalable.
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  Cycle de vie de projection facultatif pour les hôtes dotés de fils persistants côté backend (par exemple, le serveur d’application Codex). `mode: "thread_bootstrap"` avec un `epoch` stable demande à l’hôte d’injecter le contexte assemblé une seule fois par époque et de réutiliser le fil du backend jusqu’au changement de l’époque, plutôt que de le reprojeter à chaque tour. Omettez ce champ pour une projection normale à chaque tour.
</ParamField>

`compact` renvoie un `CompactResult`. Lorsque la compaction modifie l’identité de la session
active, `result.sessionTarget` (un `ContextEngineSessionTarget` typé contenant
l’identité de la session et la portée du magasin) identifie la session successeure que la
prochaine nouvelle tentative ou le prochain tour doit utiliser ; `result.sessionId` reproduit l’identifiant du successeur.

Membres facultatifs :

| Membre                         | Type    | Objectif                                                                                                                                                        |
| ------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Méthode | Initialiser l’état du moteur pour une session. Appelée une fois lorsque le moteur rencontre une session pour la première fois (par exemple, pour importer l’historique). |
| `maintain(params)`             | Méthode | Maintenance de la transcription après l’amorçage, un tour réussi ou une compaction. Utilisez `runtimeContext.rewriteTranscriptEntries()` pour des réécritures sûres. |
| `ingestBatch(params)`          | Méthode | Ingérer un tour terminé sous forme de lot. Appelée après la fin d’une exécution, avec tous les messages de ce tour simultanément.                                |
| `afterTurn(params)`            | Méthode | Tâches du cycle de vie postérieures à l’exécution (conserver l’état, déclencher une compaction en arrière-plan).                                                 |
| `prepareSubagentSpawn(params)` | Méthode | Configurer l’état partagé d’une session enfant avant son démarrage.                                                                                              |
| `onSubagentEnded(params)`      | Méthode | Effectuer le nettoyage après la fin d’un sous-agent.                                                                                                            |
| `dispose()`                    | Méthode | Libérer les ressources. Appelée lors de l’arrêt du Gateway ou du rechargement du Plugin — pas pour chaque session.                                               |

### Paramètres d’exécution

Les hooks du cycle de vie exécutés dans OpenClaw reçoivent un objet
`runtimeSettings` facultatif. Il s’agit d’une surface d’API interne
producteur/consommateur, versionnée et en lecture seule : OpenClaw la produit pour le moteur de contexte
sélectionné, et le moteur de contexte la consomme dans les hooks du cycle de vie. Elle n’est pas
présentée directement aux utilisateurs et ne crée aucune surface de rapport dédiée.

- `schemaVersion` : actuellement `1`
- `runtime` : hôte OpenClaw, mode d’exécution (`normal`, `fallback` ou
  `degraded`) et identifiants facultatifs du banc d’exécution/de l’environnement d’exécution
- `contextEngineSelection` : identifiant du moteur de contexte sélectionné et source de la sélection
- `executionHost` : identifiant et libellé de l’hôte pour la surface qui appelle le hook
- `model` : modèle demandé, modèle résolu, fournisseur et famille de modèles facultative
- `limits` : budget de jetons de l’invite et nombre maximal de jetons de sortie lorsqu’ils sont connus
- `diagnostics` : codes de motif fermés de repli et de fonctionnement dégradé lorsqu’ils sont connus

Les champs dont la valeur peut être inconnue sont représentés par `null` ; les champs discriminants tels que le mode d’exécution et la source de sélection restent non nullables. Les anciens moteurs restent compatibles : si un moteur hérité strict rejette `runtimeSettings` en tant que propriété inconnue, OpenClaw réessaie l’appel de cycle de vie sans cette propriété au lieu de placer le moteur en quarantaine.

### Exigences de l’hôte

Les moteurs de contexte peuvent déclarer des exigences relatives aux capacités de l’hôte dans `info.hostRequirements`.
OpenClaw vérifie ces exigences avant de démarrer l’opération et échoue de manière fermée avec une erreur descriptive lorsque le runtime sélectionné ne peut pas les satisfaire.

Pour les exécutions d’agent, déclarez `assemble-before-prompt` lorsque le moteur doit contrôler l’invite réelle du modèle au moyen de `assemble()` :

```ts
info: {
  id: "my-context-engine",
  name: "Mon moteur de contexte",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Utilisez le runtime Codex natif ou le runtime intégré d’OpenClaw, ou sélectionnez le moteur de contexte hérité.",
    },
  },
}
```

Les exécutions d’agent avec Codex natif et le runtime intégré d’OpenClaw satisfont `assemble-before-prompt`.
Les backends CLI génériques ne le satisfont pas ; les moteurs qui l’exigent sont donc rejetés avant le démarrage du processus CLI.

### Isolation des défaillances

OpenClaw isole le moteur de Plugin sélectionné du chemin principal de réponse. Si un moteur non hérité est absent, échoue à la validation du contrat, lève une exception lors de la création de la fabrique ou depuis une méthode de cycle de vie, OpenClaw place ce moteur en quarantaine pour le processus Gateway en cours et rétrograde les opérations du moteur de contexte vers le moteur `legacy` intégré. L’erreur est consignée avec l’opération ayant échoué afin que l’opérateur puisse réparer, mettre à jour ou désactiver le Plugin sans que l’agent cesse de répondre.

Les échecs liés aux exigences de l’hôte sont différents : lorsqu’un moteur déclare qu’un runtime ne dispose pas d’une capacité requise, OpenClaw échoue de manière fermée avant de démarrer l’exécution. Cela protège les moteurs qui corrompraient l’état s’ils s’exécutaient sur un hôte non pris en charge.

### ownsCompaction

`ownsCompaction` détermine si la Compaction automatique intégrée au runtime OpenClaw pendant une tentative reste activée pour l’exécution :

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Le moteur contrôle le comportement de Compaction. OpenClaw désactive la Compaction automatique intégrée au runtime OpenClaw et la vérification générique de dépassement avant l’invite pour cette exécution. L’implémentation `compact()` du moteur est alors responsable de `/compact`, de la Compaction de récupération après un dépassement du fournisseur et de toute Compaction proactive qu’elle souhaite effectuer dans `afterTurn()`. OpenClaw exécute toujours la protection contre les dépassements avant l’invite lorsque le moteur renvoie `promptAuthority: "preassembly_may_overflow"` depuis `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false ou non défini">
    La Compaction automatique intégrée au runtime OpenClaw peut toujours s’exécuter pendant le traitement de l’invite, mais la méthode `compact()` du moteur actif reste appelée pour `/compact` et la récupération après dépassement.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` ne signifie **pas** qu’OpenClaw revient automatiquement au chemin de Compaction du moteur hérité.
</Warning>

Il existe donc deux modèles de Plugin valides :

<Tabs>
  <Tab title="Mode propriétaire">
    Implémentez votre propre algorithme de Compaction et définissez `ownsCompaction: true`.
  </Tab>
  <Tab title="Mode délégué">
    Définissez `ownsCompaction: false` et faites en sorte que `compact()` appelle `delegateCompactionToRuntime(...)` depuis `openclaw/plugin-sdk/core` pour utiliser le comportement de Compaction intégré d’OpenClaw.
  </Tab>
</Tabs>

Une méthode `compact()` sans effet est dangereuse pour un moteur actif non propriétaire, car elle désactive le chemin normal de Compaction de `/compact` et de récupération après dépassement pour cet emplacement de moteur.

## Référence de configuration

```json5
{
  plugins: {
    slots: {
      // Sélectionnez le moteur de contexte actif. Valeur par défaut : "legacy".
      // Définissez l’identifiant d’un Plugin pour utiliser un moteur de Plugin.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
L’emplacement est exclusif lors de l’exécution : un seul moteur de contexte enregistré est résolu pour une exécution ou une opération de Compaction donnée. Les autres Plugins `kind: "context-engine"` activés peuvent toujours être chargés et exécuter leur code d’enregistrement ; `plugins.slots.contextEngine` sélectionne uniquement l’identifiant du moteur enregistré qu’OpenClaw résout lorsqu’il a besoin d’un moteur de contexte.
</Note>

<Note>
**Désinstallation d’un Plugin :** lorsque vous désinstallez le Plugin actuellement sélectionné dans `plugins.slots.contextEngine`, OpenClaw réinitialise l’emplacement à sa valeur par défaut (`legacy`). Le même comportement de réinitialisation s’applique à `plugins.slots.memory`. Aucune modification manuelle de la configuration n’est requise.
</Note>

## Relation avec la Compaction et la mémoire

<AccordionGroup>
  <Accordion title="Compaction">
    La Compaction est l’une des responsabilités du moteur de contexte. Le moteur hérité délègue à la synthèse intégrée d’OpenClaw. Les moteurs de Plugin peuvent mettre en œuvre n’importe quelle stratégie de Compaction (résumés DAG, récupération vectorielle, etc.).
  </Accordion>
  <Accordion title="Plugins de mémoire">
    Les Plugins de mémoire (`plugins.slots.memory`) sont distincts des moteurs de contexte. Les Plugins de mémoire fournissent la recherche et la récupération ; les moteurs de contexte contrôlent ce que voit le modèle. Ils peuvent fonctionner ensemble : un moteur de contexte peut utiliser les données d’un Plugin de mémoire pendant l’assemblage. Les moteurs de Plugin qui souhaitent utiliser le chemin actif d’invite de mémoire doivent privilégier `buildMemorySystemPromptAddition(...)` depuis `openclaw/plugin-sdk/core`, qui convertit les sections actives de l’invite de mémoire en un `systemPromptAddition` prêt à être ajouté au début. Si un moteur nécessite un contrôle de plus bas niveau, il peut toujours extraire les lignes brutes depuis `openclaw/plugin-sdk/memory-host-core` au moyen de `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Élagage de session">
    La suppression en mémoire des anciens résultats d’outils continue de s’exécuter quel que soit le moteur de contexte actif.
  </Accordion>
</AccordionGroup>

## Conseils

- Utilisez `openclaw doctor` pour vérifier que votre moteur se charge correctement.
- Si vous changez de moteur, les sessions existantes conservent leur historique actuel. Le nouveau moteur prend en charge les exécutions futures.
- Les erreurs du moteur sont consignées et le moteur de Plugin sélectionné est placé en quarantaine pour le processus Gateway en cours. OpenClaw revient à `legacy` pour les tours utilisateur afin que les réponses puissent continuer, mais vous devez tout de même réparer, mettre à jour, désactiver ou désinstaller le Plugin défaillant.
- Pour le développement, utilisez `openclaw plugins install -l ./my-engine` afin de lier un répertoire de Plugin local sans le copier.

## Voir aussi

- [Compaction](/fr/concepts/compaction) - synthèse des longues conversations
- [Contexte](/fr/concepts/context) - création du contexte pour les tours d’agent
- [Architecture des Plugins](/fr/plugins/architecture) - enregistrement des Plugins de moteur de contexte
- [Manifeste de Plugin](/fr/plugins/manifest) - champs du manifeste de Plugin
- [Plugins](/fr/tools/plugin) - présentation des Plugins
