---
read_when:
    - Étendre qa-lab ou qa-channel
    - Ajouter des scénarios QA adossés au dépôt
    - Construire une automatisation QA plus réaliste autour du tableau de bord Gateway
summary: Structure d’automatisation QA privée pour qa-lab, qa-channel, les scénarios initialisés et les rapports de protocole
title: Automatisation QA E2E
x-i18n:
    generated_at: "2026-04-25T13:45:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a49e0954845355667617c85340281b6dc1b043857a76d7b303cc0a8b2845a75
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

La pile QA privée est destinée à exercer OpenClaw de manière plus réaliste,
dans une forme proche des canaux, qu’un simple test unitaire ne peut le faire.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces DM, canal, fil,
  réaction, modification et suppression.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `qa/` : ressources d’initialisation adossées au dépôt pour la tâche de démarrage et les
  scénarios QA de base.

Le flux opérateur QA actuel est un site QA à deux volets :

- Gauche : tableau de bord Gateway (Control UI) avec l’agent.
- Droite : QA Lab, affichant la transcription façon Slack et le plan de scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut donner à l’agent une
mission QA, observer le comportement réel du canal et enregistrer ce qui a fonctionné, échoué
ou est resté bloqué.

Pour des itérations plus rapides sur l’interface QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté par liaison :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` conserve les services Docker sur une image préconstruite et monte par liaison
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle à chaque changement, et le navigateur se recharge automatiquement lorsque le hash
des ressources QA Lab change.

Pour une voie de smoke Matrix sur transport réel, exécutez :

```bash
pnpm openclaw qa matrix
```

Cette voie provisionne un homeserver Tuwunel jetable dans Docker, enregistre
des utilisateurs temporaires driver, SUT et observateur, crée une salle privée, puis exécute
le vrai Plugin Matrix dans un enfant Gateway QA. La voie de transport réel garde
la configuration enfant limitée au transport testé, de sorte que Matrix s’exécute sans
`qa-channel` dans la configuration enfant. Elle écrit les artefacts de rapport structurés et
un journal combiné stdout/stderr dans le répertoire de sortie Matrix QA sélectionné. Pour
capturer également la sortie de construction/lancement externe de `scripts/run-node.mjs`,
définissez `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` vers un fichier journal local au dépôt.
La progression Matrix est affichée par défaut. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` limite
l’exécution complète, et `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` limite le nettoyage afin
qu’un démontage Docker bloqué signale la commande de récupération exacte au lieu de bloquer.

Pour une voie de smoke Telegram sur transport réel, exécutez :

```bash
pnpm openclaw qa telegram
```

Cette voie cible un vrai groupe privé Telegram au lieu de provisionner un
serveur jetable. Elle nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, ainsi que deux bots distincts dans le même
groupe privé. Le bot SUT doit avoir un nom d’utilisateur Telegram, et l’observation
bot-à-bot fonctionne mieux lorsque les deux bots ont le mode de communication Bot-to-Bot
activé dans `@BotFather`.
La commande se termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez des artefacts sans code de sortie en échec.
Le rapport et le résumé Telegram incluent le RTT par réponse, du message driver
envoyé à la réponse SUT observée, à partir du canari.

Avant d’utiliser des identifiants live mutualisés, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le doctor vérifie l’environnement du broker Convex, valide les paramètres de point de terminaison,
et vérifie l’accessibilité admin/list lorsque le secret de mainteneur est présent. Il
signale uniquement l’état défini/manquant des secrets.

Pour une voie de smoke Discord sur transport réel, exécutez :

```bash
pnpm openclaw qa discord
```

Cette voie cible un vrai canal privé de guilde Discord avec deux bots : un
bot driver contrôlé par le harnais et un bot SUT démarré par le Gateway enfant
OpenClaw via le Plugin Discord intégré. Elle nécessite
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`,
et `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` lors de l’utilisation d’identifiants via l’environnement.
La voie vérifie la gestion des mentions de canal et contrôle que le bot SUT a
enregistré la commande native `/help` auprès de Discord.
La commande se termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez des artefacts sans code de sortie en échec.

Les voies de transport live partagent désormais un contrat unique plus petit au lieu que chacune invente
sa propre forme de liste de scénarios :

`qa-channel` reste la suite large de comportement produit synthétique et ne fait pas partie
de la matrice de couverture des transports live.

| Voie     | Canari | Restriction par mention | Blocage de liste d’autorisation | Réponse de premier niveau | Reprise après redémarrage | Suivi de fil | Isolation de fil | Observation des réactions | Commande help | Enregistrement de commande native |
| -------- | ------ | ----------------------- | ------------------------------- | ------------------------- | ------------------------- | ------------ | ---------------- | ------------------------- | ------------- | --------------------------------- |
| Matrix   | x      | x                       | x                               | x                         | x                         | x            | x                | x                         |               |                                   |
| Telegram | x      | x                       |                                 |                           |                           |              |                  |                           | x             |                                   |
| Discord  | x      | x                       |                                 |                           |                           |              |                  |                           |               | x                                 |

Cela maintient `qa-channel` comme la suite large de comportement produit tandis que Matrix,
Telegram et les futurs transports live partagent une liste de vérification explicite du contrat de transport.

Pour une voie Linux VM jetable sans introduire Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un invité Multipass neuf, installe les dépendances, construit OpenClaw
dans l’invité, exécute `qa suite`, puis copie le rapport QA normal et le résumé dans
`.artifacts/qa-e2e/...` sur l’hôte.
La commande réutilise le même comportement de sélection de scénario que `qa suite` sur l’hôte.
Les exécutions de suite sur l’hôte et dans Multipass exécutent plusieurs scénarios sélectionnés en parallèle
avec des workers Gateway isolés par défaut. `qa-channel` utilise par défaut une concurrence de
4, plafonnée par le nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster
le nombre de workers, ou `--concurrency 1` pour une exécution sérielle.
La commande se termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez des artefacts sans code de sortie en échec.
Les exécutions live transmettent les entrées d’authentification QA prises en charge et pratiques pour
l’invité : clés de fournisseur basées sur l’environnement, chemin de configuration du fournisseur live QA, et
`CODEX_HOME` lorsqu’il est présent. Gardez `--output-dir` sous la racine du dépôt afin que l’invité
puisse écrire en retour via l’espace de travail monté.

## Ressources d’initialisation adossées au dépôt

Les ressources d’initialisation se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Elles sont intentionnellement dans git afin que le plan QA soit visible à la fois pour les humains et pour
l’agent.

`qa-lab` doit rester un exécuteur Markdown générique. Chaque fichier Markdown de scénario est
la source de vérité pour une exécution de test et doit définir :

- les métadonnées du scénario
- des métadonnées facultatives de catégorie, capacité, voie et risque
- des références de documentation et de code
- des exigences facultatives de Plugin
- un patch facultatif de configuration Gateway
- le `qa-flow` exécutable

La surface d’exécution réutilisable qui sous-tend `qa-flow` peut rester générique
et transversale. Par exemple, les scénarios Markdown peuvent combiner des assistants côté transport
avec des assistants côté navigateur qui pilotent le Control UI embarqué via la
couture Gateway `browser.request` sans ajouter d’exécuteur à cas particulier.

Les fichiers de scénario doivent être regroupés par capacité produit plutôt que par dossier
de l’arborescence source. Gardez les identifiants de scénario stables lorsque les fichiers sont déplacés ;
utilisez `docsRefs` et `codeRefs` pour la traçabilité de l’implémentation.

La liste de base doit rester suffisamment large pour couvrir :

- le chat DM et canal
- le comportement des fils
- le cycle de vie des actions de message
- les callbacks cron
- le rappel mémoire
- le changement de modèle
- le handoff de sous-agent
- la lecture du dépôt et de la documentation
- une petite tâche de build comme Lobster Invaders

## Voies de mock de fournisseur

`qa suite` dispose de deux voies locales de mock de fournisseur :

- `mock-openai` est le mock OpenClaw sensible au scénario. Il reste la
  voie de mock déterministe par défaut pour la QA adossée au dépôt et les portes de parité.
- `aimock` démarre un serveur de fournisseur adossé à AIMock pour la couverture expérimentale
  de protocole, fixtures, enregistrement/relecture et chaos. Il est additif et ne remplace
  pas le répartiteur de scénarios `mock-openai`.

L’implémentation des voies de fournisseur se trouve sous `extensions/qa-lab/src/providers/`.
Chaque fournisseur possède ses propres valeurs par défaut, démarrage de serveur local, configuration
de modèle Gateway, besoins de préparation des profils d’authentification, et indicateurs de capacité live/mock. Le code partagé de la suite et du gateway doit passer par le registre
des fournisseurs au lieu de brancher sur les noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède une couture de transport générique pour les scénarios QA Markdown.
`qa-channel` est le premier adaptateur sur cette couture, mais la cible de conception est plus large :
les futurs canaux réels ou synthétiques devraient se brancher sur le même exécuteur de suite
au lieu d’ajouter un exécuteur QA spécifique au transport.

Au niveau architecture, la séparation est la suivante :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et les rapports.
- l’adaptateur de transport possède la configuration Gateway, l’état de préparation, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- les fichiers de scénario Markdown sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit la surface d’exécution réutilisable qui les exécute.

Les consignes d’adoption destinées aux mainteneurs pour les nouveaux adaptateurs de canal se trouvent dans
[Testing](/fr/help/testing#adding-a-channel-to-qa).

## Rapports

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie du bus observé.
Le rapport doit répondre à :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Quels scénarios de suivi valent la peine d’être ajoutés

Pour les vérifications de caractère et de style, exécutez le même scénario sur plusieurs références de modèle live
et écrivez un rapport Markdown évalué :

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

La commande exécute des processus enfants QA Gateway locaux, pas Docker. Les scénarios d’évaluation de caractère
doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires
tels que le chat, l’aide sur l’espace de travail et de petites tâches sur fichiers. Le modèle candidat
ne doit pas être informé qu’il est en cours d’évaluation. La commande conserve chaque transcription complète,
enregistre les statistiques de base de l’exécution, puis demande aux modèles juges en mode rapide avec
un raisonnement `xhigh` lorsqu’il est pris en charge de classer les exécutions selon le naturel, l’ambiance et l’humour.
Utilisez `--blind-judge-models` lorsque vous comparez des fournisseurs : l’invite du juge reçoit toujours
chaque transcription et l’état d’exécution, mais les références candidates sont remplacées par des libellés neutres
tels que `candidate-01` ; le rapport remappe les classements vers les vraies références après analyse.
Les exécutions candidates utilisent par défaut un niveau de réflexion `high`, avec `medium` pour GPT-5.4 et `xhigh`
pour les anciennes références d’évaluation OpenAI qui le prennent en charge. Remplacez un candidat spécifique en ligne avec
`--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours un
repli global, et l’ancienne forme `--model-thinking <provider/model=level>` est
conservée pour compatibilité.
Les références candidates OpenAI utilisent par défaut le mode rapide afin que le traitement prioritaire soit utilisé lorsque
le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’un
candidat ou juge unique a besoin d’un remplacement. Transmettez `--fast` uniquement lorsque vous voulez
forcer le mode rapide pour chaque modèle candidat. Les durées des candidats et des juges sont
enregistrées dans le rapport pour l’analyse de benchmark, mais les invites des juges indiquent explicitement
de ne pas classer selon la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux par défaut une concurrence de 16. Réduisez
`--concurrency` ou `--judge-concurrency` lorsque les limites du fournisseur ou la pression sur le Gateway local
rendent une exécution trop bruyante.
Lorsqu’aucun `--model` candidat n’est transmis, l’évaluation de caractère utilise par défaut
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est transmis.
Lorsqu’aucun `--judge-model` n’est transmis, les juges utilisent par défaut
`openai/gpt-5.4,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Documentation connexe

- [Testing](/fr/help/testing)
- [QA Channel](/fr/channels/qa-channel)
- [Tableau de bord](/fr/web/dashboard)
