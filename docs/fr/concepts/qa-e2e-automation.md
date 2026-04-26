---
read_when:
    - Étendre qa-lab ou qa-channel
    - Ajouter des scénarios QA adossés au dépôt
    - Créer une automatisation QA plus réaliste autour du tableau de bord Gateway
summary: Structure de l’automatisation QA privée pour qa-lab, qa-channel, les scénarios amorcés et les rapports de protocole
title: Automatisation QA E2E
x-i18n:
    generated_at: "2026-04-26T11:27:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3803f2bc5cdf2368c3af59b412de8ef732708995a54f7771d3f6f16e8be0592b
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

La pile QA privée est conçue pour exercer OpenClaw d’une manière plus réaliste,
façonnée comme un canal, qu’un simple test unitaire ne peut le faire.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces DM, canal, fil,
  réaction, modification et suppression.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `qa/` : ressources d’amorçage adossées au dépôt pour la tâche de lancement et les
  scénarios QA de référence.

Le flux opérateur QA actuel est un site QA à deux volets :

- Gauche : tableau de bord Gateway (Control UI) avec l’agent.
- Droite : QA Lab, affichant la transcription de type Slack et le plan du scénario.

Lancez-le avec :

```bash
pnpm qa:lab:up
```

Cela build le site QA, démarre la voie Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut donner à l’agent une mission QA,
observer le comportement réel du canal et enregistrer ce qui a fonctionné, échoué ou
est resté bloqué.

Pour une itération plus rapide sur l’UI de QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté par bind mount :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` conserve les services Docker sur une image prébuildée et monte par bind
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
rebuild ce bundle à chaque changement, et le navigateur se recharge automatiquement lorsque le hash des ressources de QA Lab change.

Pour un smoke local de trace OpenTelemetry, exécutez :

```bash
pnpm qa:otel:smoke
```

Ce script démarre un récepteur local de traces OTLP/HTTP, exécute le
scénario QA `otel-trace-smoke` avec le Plugin `diagnostics-otel` activé, puis
décode les spans protobuf exportés et vérifie la structure critique pour la release :
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` et `openclaw.message.delivery` doivent être présents ;
les appels modèle ne doivent pas exporter `StreamAbandoned` sur les tours réussis ; les ID de diagnostic bruts et
les attributs `openclaw.content.*` doivent rester hors de la trace. Il écrit
`otel-smoke-summary.json` à côté des artefacts de la suite QA.

Pour une voie smoke Matrix sur transport réel, exécutez :

```bash
pnpm openclaw qa matrix
```

Cette voie provisionne un homeserver Tuwunel jetable dans Docker, enregistre
des utilisateurs temporaires driver, SUT et observateur, crée une salle privée, puis exécute
le vrai Plugin Matrix dans un enfant Gateway QA. La voie de transport en direct garde
la configuration enfant limitée au transport testé, de sorte que Matrix s’exécute sans
`qa-channel` dans la configuration enfant. Elle écrit les artefacts de rapport structurés et
un journal stdout/stderr combiné dans le répertoire de sortie Matrix QA sélectionné. Pour
capturer aussi la sortie externe de build/lancement de `scripts/run-node.mjs`, définissez
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` vers un fichier journal local au dépôt.
La progression Matrix est affichée par défaut. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` borne
l’exécution complète, et `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` borne le nettoyage afin qu’un démontage Docker bloqué rapporte la commande exacte de récupération au lieu de se figer.

Pour une voie smoke Telegram sur transport réel, exécutez :

```bash
pnpm openclaw qa telegram
```

Cette voie cible un vrai groupe Telegram privé au lieu de provisionner un
serveur jetable. Elle nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, ainsi que deux bots distincts dans le même
groupe privé. Le bot SUT doit avoir un nom d’utilisateur Telegram, et l’observation
bot à bot fonctionne au mieux lorsque les deux bots ont le mode Bot-to-Bot Communication activé dans `@BotFather`.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez des artefacts sans code de sortie en échec.
Le rapport et le résumé Telegram incluent le RTT par réponse, depuis la requête
d’envoi de message du driver jusqu’à la réponse observée du SUT, en commençant par le canari.

Avant d’utiliser des identifiants en direct mutualisés, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le doctor vérifie l’environnement du broker Convex, valide les paramètres des endpoints et vérifie
la joignabilité admin/list lorsque le secret mainteneur est présent. Il n’indique que l’état
présent/absent des secrets.

Pour une voie smoke Discord sur transport réel, exécutez :

```bash
pnpm openclaw qa discord
```

Cette voie cible un vrai canal privé de guilde Discord avec deux bots : un
bot driver contrôlé par le harness et un bot SUT démarré par la Gateway enfant
OpenClaw via le Plugin Discord intégré. Elle nécessite
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
et `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` lors de l’utilisation d’identifiants via l’environnement.
La voie vérifie le traitement des mentions dans le canal et contrôle que le bot SUT a
enregistré la commande native `/help` auprès de Discord.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez des artefacts sans code de sortie en échec.

Les voies de transport en direct partagent maintenant un contrat plus petit unique au lieu que chacune invente
sa propre forme de liste de scénarios :

`qa-channel` reste la large suite synthétique de comportement produit et ne fait pas partie
de la matrice de couverture du transport en direct.

| Voie     | Canari | Contrôle par mention | Blocage allowlist | Réponse de niveau supérieur | Reprise après redémarrage | Suivi de fil | Isolation de fil | Observation des réactions | Commande d’aide | Enregistrement de commande native |
| -------- | ------ | -------------------- | ----------------- | --------------------------- | ------------------------- | ------------ | ---------------- | ------------------------- | --------------- | -------------------------------- |
| Matrix   | x      | x                    | x                 | x                           | x                         | x            | x                | x                         |                 |                                  |
| Telegram | x      | x                    |                   |                             |                           |              |                  |                           | x               |                                  |
| Discord  | x      | x                    |                   |                             |                           |              |                  |                           |                 | x                                |

Cela conserve `qa-channel` comme la large suite de comportement produit tandis que Matrix,
Telegram et les futurs transports en direct partagent une checklist explicite unique de contrat de transport.

Pour une voie sur VM Linux jetable sans faire entrer Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un invité Multipass neuf, installe les dépendances, build OpenClaw
dans l’invité, exécute `qa suite`, puis recopie le rapport QA normal et le
résumé dans `.artifacts/qa-e2e/...` sur l’hôte.
Cela réutilise le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
Les exécutions de suite sur l’hôte et dans Multipass exécutent plusieurs scénarios sélectionnés en parallèle
avec des workers Gateway isolés par défaut. `qa-channel` utilise par défaut une concurrence de
4, plafonnée par le nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster
le nombre de workers, ou `--concurrency 1` pour une exécution sérielle.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez des artefacts sans code de sortie en échec.
Les exécutions en direct transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour l’invité :
clés de fournisseur via l’environnement, chemin de config du fournisseur QA live et
`CODEX_HOME` lorsqu’il est présent. Gardez `--output-dir` sous la racine du dépôt pour que l’invité
puisse réécrire via l’espace de travail monté.

## Ressources d’amorçage adossées au dépôt

Les ressources d’amorçage se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Elles sont volontairement dans git pour que le plan QA soit visible à la fois pour les humains et pour l’agent.

`qa-lab` doit rester un exécuteur Markdown générique. Chaque fichier Markdown de scénario
est la source de vérité pour une exécution de test et doit définir :

- les métadonnées du scénario
- des métadonnées facultatives de catégorie, capacité, voie et risque
- des références de documentation et de code
- des exigences facultatives de Plugin
- un patch facultatif de configuration Gateway
- le `qa-flow` exécutable

La surface d’exécution réutilisable qui soutient `qa-flow` peut rester générique
et transverse. Par exemple, les scénarios Markdown peuvent combiner des helpers côté transport
avec des helpers côté navigateur qui pilotent la Control UI embarquée via la
jonction Gateway `browser.request` sans ajouter d’exécuteur spécialisé.

Les fichiers de scénario doivent être regroupés par capacité produit plutôt que par dossier d’arborescence source. Gardez les ID de scénario stables lorsque les fichiers changent de place ; utilisez `docsRefs` et `codeRefs`
pour la traçabilité de l’implémentation.

La liste de référence doit rester suffisamment large pour couvrir :

- le chat DM et de canal
- le comportement des fils
- le cycle de vie des actions de message
- les callbacks Cron
- le rappel mémoire
- le changement de modèle
- le transfert vers sous-agent
- la lecture du dépôt et de la documentation
- une petite tâche de build comme Lobster Invaders

## Voies mock de fournisseur

`qa suite` comporte deux voies mock locales de fournisseur :

- `mock-openai` est le mock OpenClaw sensible au scénario. Il reste la
  voie mock déterministe par défaut pour la QA adossée au dépôt et les gates de parité.
- `aimock` démarre un serveur fournisseur adossé à AIMock pour la couverture expérimentale de protocole,
  fixtures, enregistrement/relecture et chaos. Il est additionnel et ne remplace pas le répartiteur de scénarios `mock-openai`.

L’implémentation des voies fournisseur se trouve sous `extensions/qa-lab/src/providers/`.
Chaque fournisseur possède ses valeurs par défaut, le démarrage du serveur local, la configuration
du modèle Gateway, les besoins de préparation du profil d’authentification et les drapeaux de capacité live/mock. Le code partagé de suite et de Gateway doit passer par le registre des fournisseurs au lieu de brancher sur les noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède une jonction de transport générique pour les scénarios QA Markdown.
`qa-channel` est le premier adaptateur sur cette jonction, mais la cible de conception est plus large :
les futurs canaux réels ou synthétiques doivent se brancher sur le même exécuteur de suite
au lieu d’ajouter un exécuteur QA spécifique à un transport.

Au niveau architecture, la séparation est :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et le reporting.
- l’adaptateur de transport possède la configuration Gateway, l’état de préparation, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- les fichiers de scénario Markdown sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit la surface d’exécution réutilisable qui les exécute.

Les recommandations d’adoption destinées aux mainteneurs pour les nouveaux adaptateurs de canal se trouvent dans
[Testing](/fr/help/testing#adding-a-channel-to-qa).

## Reporting

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie observée du bus.
Le rapport doit répondre à :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Quels scénarios de suivi valent la peine d’être ajoutés

Pour les vérifications de caractère et de style, exécutez le même scénario sur plusieurs
références de modèles live et écrivez un rapport Markdown évalué :

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

La commande exécute des processus enfants locaux de Gateway QA, pas Docker. Les scénarios d’évaluation de caractère
doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires
tels que le chat, l’aide sur l’espace de travail et de petites tâches sur des fichiers. Le modèle candidat
ne doit pas être informé qu’il est en cours d’évaluation. La commande conserve chaque transcription complète,
enregistre des statistiques d’exécution de base, puis demande aux modèles juges en mode rapide avec
un raisonnement `xhigh` lorsque c’est pris en charge de classer les exécutions selon le naturel, l’ambiance et l’humour.
Utilisez `--blind-judge-models` lorsque vous comparez des fournisseurs : l’invite du juge reçoit toujours
chaque transcription et statut d’exécution, mais les références candidates sont remplacées par des étiquettes neutres
comme `candidate-01` ; le rapport remappe les classements vers les références réelles après l’analyse.
Les exécutions candidates utilisent par défaut le niveau de réflexion `high`, avec `medium` pour GPT-5.5 et `xhigh`
pour les anciennes références d’évaluation OpenAI qui le prennent en charge. Remplacez un candidat spécifique en ligne avec
`--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours une valeur de repli globale, et l’ancienne forme `--model-thinking <provider/model=level>` est conservée pour compatibilité.
Les références candidates OpenAI utilisent par défaut le mode rapide afin d’employer le traitement prioritaire lorsque
le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’un
candidat ou juge unique a besoin d’un remplacement. Passez `--fast` uniquement si vous voulez
forcer le mode rapide pour chaque modèle candidat. Les durées des candidats et des juges sont enregistrées
dans le rapport pour l’analyse comparative, mais les invites des juges indiquent explicitement de ne pas classer selon la vitesse.
Les exécutions des modèles candidats et des modèles juges utilisent toutes deux par défaut une concurrence de 16. Réduisez
`--concurrency` ou `--judge-concurrency` lorsque les limites du fournisseur ou la pression sur la Gateway locale
rendent une exécution trop bruitée.
Lorsqu’aucun `--model` candidat n’est passé, l’évaluation de caractère utilise par défaut
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est passé.
Lorsqu’aucun `--judge-model` n’est passé, les juges utilisent par défaut
`openai/gpt-5.5,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Documentation associée

- [Testing](/fr/help/testing)
- [QA Channel](/fr/channels/qa-channel)
- [Dashboard](/fr/web/dashboard)
