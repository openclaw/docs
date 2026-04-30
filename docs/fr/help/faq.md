---
read_when:
    - Répondre aux questions courantes sur la configuration, l’installation, la prise en main ou l’assistance à l’exécution
    - Triage des problèmes signalés par les utilisateurs avant un débogage plus approfondi
summary: Questions fréquentes sur l’installation, la configuration et l’utilisation d’OpenClaw
title: Foire aux questions
x-i18n:
    generated_at: "2026-04-30T07:31:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c09be6571e048b71e4e02288b22b51e70102872675dfc7bef133b955a06f6ac9
    source_path: help/faq.md
    workflow: 16
---

Réponses rapides et dépannage plus approfondi pour les configurations réelles (développement local, VPS, multi-agent, OAuth/clés d’API, basculement de modèles). Pour les diagnostics d’exécution, consultez [Dépannage](/fr/gateway/troubleshooting). Pour la référence complète de configuration, consultez [Configuration](/fr/gateway/configuration).

## Les 60 premières secondes si quelque chose ne fonctionne pas

1. **État rapide (première vérification)**

   ```bash
   openclaw status
   ```

   Résumé local rapide : système d’exploitation + mise à jour, accessibilité du gateway/service, agents/sessions, configuration du fournisseur + problèmes d’exécution (lorsque le Gateway est accessible).

2. **Rapport à coller (sûr à partager)**

   ```bash
   openclaw status --all
   ```

   Diagnostic en lecture seule avec fin de journal (tokens masqués).

3. **État du démon + port**

   ```bash
   openclaw gateway status
   ```

   Affiche l’exécution du superviseur par rapport à l’accessibilité RPC, l’URL cible de la sonde, et quelle configuration le service a probablement utilisée.

4. **Sondes approfondies**

   ```bash
   openclaw status --deep
   ```

   Exécute une sonde d’état du Gateway en direct, y compris les sondes de canal lorsqu’elles sont prises en charge
   (nécessite un Gateway accessible). Consultez [Santé](/fr/gateway/health).

5. **Suivre le dernier journal**

   ```bash
   openclaw logs --follow
   ```

   Si RPC est indisponible, utilisez en remplacement :

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Les journaux de fichiers sont distincts des journaux de service ; consultez [Journalisation](/fr/logging) et [Dépannage](/fr/gateway/troubleshooting).

6. **Exécuter le doctor (réparations)**

   ```bash
   openclaw doctor
   ```

   Répare/migre la configuration/l’état + exécute des contrôles de santé. Consultez [Doctor](/fr/gateway/doctor).

7. **Instantané du Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Demande au Gateway en cours d’exécution un instantané complet (WS uniquement). Consultez [Santé](/fr/gateway/health).

## Démarrage rapide et configuration initiale

La FAQ de première exécution — installation, intégration, routes d’authentification, abonnements, échecs initiaux —
se trouve dans la [FAQ de première exécution](/fr/help/faq-first-run).

## Qu’est-ce qu’OpenClaw ?

<AccordionGroup>
  <Accordion title="Qu’est-ce qu’OpenClaw, en un paragraphe ?">
    OpenClaw est un assistant IA personnel que vous exécutez sur vos propres appareils. Il répond sur les surfaces de messagerie que vous utilisez déjà (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, et des plugins de canal intégrés comme QQ Bot) et peut aussi gérer la voix + un Canvas en direct sur les plateformes prises en charge. Le **Gateway** est le plan de contrôle toujours actif ; l’assistant est le produit.
  </Accordion>

  <Accordion title="Proposition de valeur">
    OpenClaw n’est pas « juste un wrapper Claude ». C’est un **plan de contrôle local-first** qui vous permet d’exécuter un
    assistant capable sur **votre propre matériel**, joignable depuis les applications de chat que vous utilisez déjà, avec
    des sessions avec état, de la mémoire et des outils, sans céder le contrôle de vos flux de travail à un SaaS
    hébergé.

    Points forts :

    - **Vos appareils, vos données :** exécutez le Gateway où vous voulez (Mac, Linux, VPS) et gardez
      l’espace de travail + l’historique de session en local.
    - **De vrais canaux, pas un bac à sable web :** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc.,
      plus la voix mobile et Canvas sur les plateformes prises en charge.
    - **Indépendant du modèle :** utilisez Anthropic, OpenAI, MiniMax, OpenRouter, etc., avec un routage
      par agent et un basculement.
    - **Option locale uniquement :** exécutez des modèles locaux afin que **toutes les données puissent rester sur votre appareil** si vous le souhaitez.
    - **Routage multi-agent :** agents distincts par canal, compte ou tâche, chacun avec son propre
      espace de travail et ses propres valeurs par défaut.
    - **Open source et modifiable :** inspectez, étendez et auto-hébergez sans verrouillage fournisseur.

    Docs : [Gateway](/fr/gateway), [Canaux](/fr/channels), [Multi-agent](/fr/concepts/multi-agent),
    [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Je viens de le configurer, que dois-je faire en premier ?">
    Bons premiers projets :

    - Créer un site web (WordPress, Shopify ou un simple site statique).
    - Prototyper une application mobile (plan, écrans, plan d’API).
    - Organiser les fichiers et dossiers (nettoyage, nommage, étiquetage).
    - Connecter Gmail et automatiser les résumés ou les relances.

    Il peut gérer de grandes tâches, mais il fonctionne mieux lorsque vous les divisez en phases et
    utilisez des sous-agents pour le travail parallèle.

  </Accordion>

  <Accordion title="Quels sont les cinq principaux cas d’utilisation quotidiens d’OpenClaw ?">
    Les gains quotidiens ressemblent généralement à ceci :

    - **Briefings personnels :** résumés de votre boîte de réception, de votre calendrier et des actualités qui vous intéressent.
    - **Recherche et rédaction :** recherches rapides, résumés et premiers jets pour des e-mails ou des documents.
    - **Rappels et relances :** notifications et listes de vérification pilotées par Cron ou Heartbeat.
    - **Automatisation du navigateur :** remplissage de formulaires, collecte de données et répétition de tâches web.
    - **Coordination multi-appareils :** envoyez une tâche depuis votre téléphone, laissez le Gateway l’exécuter sur un serveur, puis récupérez le résultat dans le chat.

  </Accordion>

  <Accordion title="OpenClaw peut-il aider à la génération de leads, la prospection, les publicités et les blogs pour un SaaS ?">
    Oui pour **la recherche, la qualification et la rédaction**. Il peut analyser des sites, créer des listes restreintes,
    résumer des prospects et rédiger des brouillons de prospection ou de textes publicitaires.

    Pour **les campagnes de prospection ou de publicité**, gardez un humain dans la boucle. Évitez le spam, respectez les lois locales et
    les politiques des plateformes, et relisez tout avant envoi. Le schéma le plus sûr consiste à laisser
    OpenClaw rédiger et à approuver vous-même.

    Docs : [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Quels sont les avantages par rapport à Claude Code pour le développement web ?">
    OpenClaw est un **assistant personnel** et une couche de coordination, pas un remplacement d’IDE. Utilisez
    Claude Code ou Codex pour la boucle de codage directe la plus rapide dans un dépôt. Utilisez OpenClaw lorsque vous
    voulez une mémoire durable, un accès multi-appareils et une orchestration d’outils.

    Avantages :

    - **Mémoire persistante + espace de travail** entre les sessions
    - **Accès multi-plateforme** (WhatsApp, Telegram, TUI, WebChat)
    - **Orchestration d’outils** (navigateur, fichiers, planification, hooks)
    - **Gateway toujours actif** (exécution sur un VPS, interaction depuis n’importe où)
    - **Nodes** pour navigateur/écran/caméra/exécution locaux

    Showcase : [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills et automatisation

<AccordionGroup>
  <Accordion title="Comment personnaliser des skills sans garder le dépôt modifié ?">
    Utilisez des remplacements gérés au lieu de modifier la copie du dépôt. Placez vos changements dans `~/.openclaw/skills/<name>/SKILL.md` (ou ajoutez un dossier via `skills.load.extraDirs` dans `~/.openclaw/openclaw.json`). La priorité est `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → intégré → `skills.load.extraDirs`, donc les remplacements gérés l’emportent toujours sur les skills intégrés sans toucher à git. Si la skill doit être installée globalement mais visible uniquement pour certains agents, conservez la copie partagée dans `~/.openclaw/skills` et contrôlez la visibilité avec `agents.defaults.skills` et `agents.list[].skills`. Seules les modifications destinées à l’amont doivent vivre dans le dépôt et être envoyées sous forme de PR.
  </Accordion>

  <Accordion title="Puis-je charger des skills depuis un dossier personnalisé ?">
    Oui. Ajoutez des répertoires supplémentaires via `skills.load.extraDirs` dans `~/.openclaw/openclaw.json` (priorité la plus basse). La priorité par défaut est `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → intégré → `skills.load.extraDirs`. `clawhub` installe par défaut dans `./skills`, qu’OpenClaw traite comme `<workspace>/skills` lors de la session suivante. Si la skill ne doit être visible que par certains agents, associez cela à `agents.defaults.skills` ou `agents.list[].skills`.
  </Accordion>

  <Accordion title="Comment utiliser différents modèles pour différentes tâches ?">
    Aujourd’hui, les modèles pris en charge sont :

    - **Tâches Cron** : les tâches isolées peuvent définir un remplacement `model` par tâche.
    - **Sous-agents** : acheminez les tâches vers des agents distincts avec des modèles par défaut différents.
    - **Changement à la demande** : utilisez `/model` pour changer le modèle de la session actuelle à tout moment.

    Consultez [Tâches Cron](/fr/automation/cron-jobs), [Routage multi-agent](/fr/concepts/multi-agent) et [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Le bot se fige pendant un travail lourd. Comment le déléguer ?">
    Utilisez des **sous-agents** pour les tâches longues ou parallèles. Les sous-agents s’exécutent dans leur propre session,
    renvoient un résumé et gardent votre chat principal réactif.

    Demandez à votre bot de « spawn a sub-agent for this task » ou utilisez `/subagents`.
    Utilisez `/status` dans le chat pour voir ce que fait le Gateway en ce moment (et s’il est occupé).

    Astuce sur les tokens : les tâches longues et les sous-agents consomment tous deux des tokens. Si le coût vous préoccupe, définissez un
    modèle moins cher pour les sous-agents via `agents.defaults.subagents.model`.

    Docs : [Sous-agents](/fr/tools/subagents), [Tâches en arrière-plan](/fr/automation/tasks).

  </Accordion>

  <Accordion title="Comment fonctionnent les sessions de sous-agent liées à un fil sur Discord ?">
    Utilisez les liaisons de fils. Vous pouvez lier un fil Discord à une cible de sous-agent ou de session afin que les messages de suivi dans ce fil restent sur cette session liée.

    Flux de base :

    - Lancez avec `sessions_spawn` en utilisant `thread: true` (et éventuellement `mode: "session"` pour un suivi persistant).
    - Ou liez manuellement avec `/focus <target>`.
    - Utilisez `/agents` pour inspecter l’état de liaison.
    - Utilisez `/session idle <duration|off>` et `/session max-age <duration|off>` pour contrôler l’annulation automatique du focus.
    - Utilisez `/unfocus` pour détacher le fil.

    Configuration requise :

    - Valeurs globales par défaut : `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Remplacements Discord : `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Liaison automatique au lancement : définissez `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Docs : [Sous-agents](/fr/tools/subagents), [Discord](/fr/channels/discord), [Référence de configuration](/fr/gateway/configuration-reference), [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Un sous-agent a terminé, mais la mise à jour de fin est partie au mauvais endroit ou n’a jamais été publiée. Que dois-je vérifier ?">
    Vérifiez d’abord la route du demandeur résolue :

    - La livraison d’un sous-agent en mode achèvement préfère tout fil lié ou toute route de conversation lorsqu’il en existe une.
    - Si l’origine de l’achèvement ne transporte qu’un canal, OpenClaw se replie sur la route stockée de la session demandeuse (`lastChannel` / `lastTo` / `lastAccountId`) afin que la livraison directe puisse quand même réussir.
    - Si aucune route liée ni route stockée utilisable n’existe, la livraison directe peut échouer et le résultat retombe sur la livraison de session en file d’attente au lieu d’être publié immédiatement dans le chat.
    - Les cibles invalides ou obsolètes peuvent toujours forcer un repli en file d’attente ou un échec de livraison finale.
    - Si la dernière réponse visible de l’assistant enfant est le token silencieux exact `NO_REPLY` / `no_reply`, ou exactement `ANNOUNCE_SKIP`, OpenClaw supprime intentionnellement l’annonce au lieu de publier une progression antérieure obsolète.
    - Si l’enfant a expiré après uniquement des appels d’outils, l’annonce peut condenser cela en un court résumé de progression partielle au lieu de rejouer la sortie brute des outils.

    Débogage :

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs : [Sous-agents](/fr/tools/subagents), [Tâches en arrière-plan](/fr/automation/tasks), [Outils de session](/fr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron ou les rappels ne se déclenchent pas. Que dois-je vérifier ?">
    Cron s’exécute dans le processus Gateway. Si le Gateway ne fonctionne pas en continu,
    les tâches planifiées ne s’exécuteront pas.

    Liste de vérification :

    - Confirmez que cron est activé (`cron.enabled`) et que `OPENCLAW_SKIP_CRON` n’est pas défini.
    - Vérifiez que le Gateway fonctionne 24 h/24 et 7 j/7 (pas de veille/redémarrages).
    - Vérifiez les paramètres de fuseau horaire pour la tâche (`--tz` par rapport au fuseau horaire de l’hôte).

    Débogage :

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs : [Tâches Cron](/fr/automation/cron-jobs), [Automatisation et tâches](/fr/automation).

  </Accordion>

  <Accordion title="Cron s’est déclenché, mais rien n’a été envoyé au canal. Pourquoi ?">
    Vérifiez d’abord le mode de livraison :

    - `--no-deliver` / `delivery.mode: "none"` signifie qu’aucun envoi de repli par le runner n’est attendu.
    - Une cible d’annonce manquante ou invalide (`channel` / `to`) signifie que le runner a ignoré la livraison sortante.
    - Les échecs d’authentification du canal (`unauthorized`, `Forbidden`) signifient que le runner a tenté de livrer, mais que les identifiants l’en ont empêché.
    - Un résultat isolé silencieux (`NO_REPLY` / `no_reply` uniquement) est traité comme intentionnellement non livrable, donc le runner supprime aussi la livraison de repli mise en file d’attente.

    Pour les tâches Cron isolées, l’agent peut toujours envoyer directement avec l’outil `message`
    lorsqu’une route de chat est disponible. `--announce` contrôle uniquement le chemin de repli
    du runner pour le texte final que l’agent n’a pas déjà envoyé.

    Débogage :

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentation : [Tâches Cron](/fr/automation/cron-jobs), [Tâches en arrière-plan](/fr/automation/tasks).

  </Accordion>

  <Accordion title="Pourquoi une exécution Cron isolée a-t-elle changé de modèle ou réessayé une fois ?">
    Il s’agit généralement du chemin de changement de modèle en direct, pas d’une planification en double.

    Le Cron isolé peut conserver un transfert de modèle au moment de l’exécution et réessayer lorsque l’exécution
    active lève `LiveSessionModelSwitchError`. La nouvelle tentative conserve le fournisseur/modèle
    changé, et si le changement incluait un nouveau remplacement de profil d’authentification, Cron
    le conserve aussi avant de réessayer.

    Règles de sélection associées :

    - Le remplacement de modèle du hook Gmail l’emporte en premier lorsqu’il s’applique.
    - Puis le `model` par tâche.
    - Puis tout remplacement de modèle de session Cron stocké.
    - Puis la sélection normale du modèle de l’agent/par défaut.

    La boucle de nouvelle tentative est bornée. Après la tentative initiale plus 2 nouvelles tentatives de changement,
    Cron abandonne au lieu de boucler indéfiniment.

    Débogage :

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentation : [Tâches Cron](/fr/automation/cron-jobs), [CLI Cron](/fr/cli/cron).

  </Accordion>

  <Accordion title="Comment installer des Skills sur Linux ?">
    Utilisez les commandes natives `openclaw skills` ou déposez les Skills dans votre espace de travail. L’interface utilisateur macOS Skills n’est pas disponible sur Linux.
    Parcourez les Skills sur [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    `openclaw skills install` natif écrit dans le répertoire `skills/`
    de l’espace de travail actif. Installez la CLI `clawhub` séparée uniquement si vous voulez publier ou
    synchroniser vos propres Skills. Pour des installations partagées entre agents, placez le Skill sous
    `~/.openclaw/skills` et utilisez `agents.defaults.skills` ou
    `agents.list[].skills` si vous voulez restreindre les agents qui peuvent le voir.

  </Accordion>

  <Accordion title="OpenClaw peut-il exécuter des tâches selon un planning ou en continu en arrière-plan ?">
    Oui. Utilisez le planificateur Gateway :

    - **Tâches Cron** pour les tâches planifiées ou récurrentes (persistent après les redémarrages).
    - **Heartbeat** pour les vérifications périodiques de la « session principale ».
    - **Tâches isolées** pour les agents autonomes qui publient des résumés ou livrent vers des chats.

    Documentation : [Tâches Cron](/fr/automation/cron-jobs), [Automatisation et tâches](/fr/automation),
    [Heartbeat](/fr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Puis-je exécuter depuis Linux des Skills réservés à Apple macOS ?">
    Pas directement. Les Skills macOS sont limités par `metadata.openclaw.os` plus les binaires requis, et les Skills apparaissent dans le prompt système uniquement lorsqu’ils sont éligibles sur l’**hôte Gateway**. Sur Linux, les Skills réservés à `darwin` (comme `apple-notes`, `apple-reminders`, `things-mac`) ne se chargeront pas sauf si vous remplacez le filtrage.

    Trois modèles sont pris en charge :

    **Option A - exécuter le Gateway sur un Mac (le plus simple).**
    Exécutez le Gateway là où les binaires macOS existent, puis connectez-vous depuis Linux en [mode distant](#gateway-ports-already-running-and-remote-mode) ou via Tailscale. Les Skills se chargent normalement, car l’hôte Gateway est macOS.

    **Option B - utiliser un Node macOS (sans SSH).**
    Exécutez le Gateway sur Linux, associez un Node macOS (application de barre de menus), et définissez **Node Run Commands** sur « Toujours demander » ou « Toujours autoriser » sur le Mac. OpenClaw peut traiter les Skills réservés à macOS comme éligibles lorsque les binaires requis existent sur le Node. L’agent exécute ces Skills via l’outil `nodes`. Si vous choisissez « Toujours demander », approuver « Toujours autoriser » dans le prompt ajoute cette commande à la liste d’autorisation.

    **Option C - mandater les binaires macOS via SSH (avancé).**
    Gardez le Gateway sur Linux, mais faites résoudre les binaires CLI requis vers des wrappers SSH qui s’exécutent sur un Mac. Remplacez ensuite le Skill pour autoriser Linux afin qu’il reste éligible.

    1. Créez un wrapper SSH pour le binaire (exemple : `memo` pour Apple Notes) :

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Placez le wrapper dans le `PATH` sur l’hôte Linux (par exemple `~/bin/memo`).
    3. Remplacez les métadonnées du Skill (espace de travail ou `~/.openclaw/skills`) pour autoriser Linux :

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Démarrez une nouvelle session pour que l’instantané des Skills s’actualise.

  </Accordion>

  <Accordion title="Avez-vous une intégration Notion ou HeyGen ?">
    Pas intégrée aujourd’hui.

    Options :

    - **Skill / Plugin personnalisé :** le mieux pour un accès fiable aux API (Notion/HeyGen ont tous deux des API).
    - **Automatisation de navigateur :** fonctionne sans code, mais est plus lente et plus fragile.

    Si vous voulez conserver le contexte par client (flux de travail d’agence), un modèle simple est :

    - Une page Notion par client (contexte + préférences + travail actif).
    - Demandez à l’agent de récupérer cette page au début d’une session.

    Si vous voulez une intégration native, ouvrez une demande de fonctionnalité ou créez un Skill
    ciblant ces API.

    Installer des Skills :

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Les installations natives arrivent dans le répertoire `skills/` de l’espace de travail actif. Pour des Skills partagés entre agents, placez-les dans `~/.openclaw/skills/<name>/SKILL.md`. Si seuls certains agents doivent voir une installation partagée, configurez `agents.defaults.skills` ou `agents.list[].skills`. Certains Skills attendent des binaires installés via Homebrew ; sur Linux, cela signifie Linuxbrew (voir l’entrée FAQ Homebrew Linux ci-dessus). Consultez [Skills](/fr/tools/skills), [Configuration des Skills](/fr/tools/skills-config) et [ClawHub](/fr/tools/clawhub).

  </Accordion>

  <Accordion title="Comment utiliser mon Chrome existant déjà connecté avec OpenClaw ?">
    Utilisez le profil de navigateur `user` intégré, qui s’attache via Chrome DevTools MCP :

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Si vous voulez un nom personnalisé, créez un profil MCP explicite :

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ce chemin peut utiliser le navigateur local de l’hôte ou un Node de navigateur connecté. Si le Gateway s’exécute ailleurs, exécutez soit un hôte Node sur la machine du navigateur, soit utilisez CDP distant à la place.

    Limites actuelles de `existing-session` / `user` :

    - les actions sont pilotées par des références, pas par des sélecteurs CSS
    - les téléversements nécessitent `ref` / `inputRef` et prennent actuellement en charge un fichier à la fois
    - `responsebody`, l’export PDF, l’interception des téléchargements et les actions par lot nécessitent encore un navigateur géré ou un profil CDP brut

  </Accordion>
</AccordionGroup>

## Sandboxing et mémoire

<AccordionGroup>
  <Accordion title="Existe-t-il une documentation dédiée au sandboxing ?">
    Oui. Consultez [Sandboxing](/fr/gateway/sandboxing). Pour la configuration propre à Docker (Gateway complet dans Docker ou images de sandbox), consultez [Docker](/fr/install/docker).
  </Accordion>

  <Accordion title="Docker semble limité - comment activer toutes les fonctionnalités ?">
    L’image par défaut privilégie la sécurité et s’exécute avec l’utilisateur `node`, donc elle n’inclut pas
    les paquets système, Homebrew, ni les navigateurs intégrés. Pour une configuration plus complète :

    - Persistez `/home/node` avec `OPENCLAW_HOME_VOLUME` afin que les caches soient conservés.
    - Intégrez les dépendances système dans l’image avec `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Installez les navigateurs Playwright via la CLI intégrée :
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Définissez `PLAYWRIGHT_BROWSERS_PATH` et assurez-vous que le chemin est persistant.

    Documentation : [Docker](/fr/install/docker), [Navigateur](/fr/tools/browser).

  </Accordion>

  <Accordion title="Puis-je garder les messages privés personnels tout en rendant les groupes publics/sandboxés avec un seul agent ?">
    Oui - si votre trafic privé correspond à des **messages privés** et votre trafic public à des **groupes**.

    Utilisez `agents.defaults.sandbox.mode: "non-main"` afin que les sessions de groupe/canal (clés non principales) s’exécutent dans le backend de sandbox configuré, tandis que la session principale de messages privés reste sur l’hôte. Docker est le backend par défaut si vous n’en choisissez pas. Restreignez ensuite les outils disponibles dans les sessions sandboxées via `tools.sandbox.tools`.

    Guide de configuration + exemple de configuration : [Groupes : messages privés personnels + groupes publics](/fr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Référence de configuration clé : [Configuration du Gateway](/fr/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Comment monter un dossier hôte dans la sandbox ?">
    Définissez `agents.defaults.sandbox.docker.binds` sur `["host:path:mode"]` (par exemple, `"/home/user/src:/src:ro"`). Les montages globaux et par agent fusionnent ; les montages par agent sont ignorés lorsque `scope: "shared"`. Utilisez `:ro` pour tout élément sensible et n’oubliez pas que les montages contournent les murs du système de fichiers de la sandbox.

    OpenClaw valide les sources de montage à la fois par rapport au chemin normalisé et au chemin canonique résolu via l’ancêtre existant le plus profond. Cela signifie que les échappements par parent symbolique échouent toujours en mode fermé même lorsque le dernier segment du chemin n’existe pas encore, et que les vérifications de racine autorisée s’appliquent toujours après la résolution des liens symboliques.

    Consultez [Sandboxing](/fr/gateway/sandboxing#custom-bind-mounts) et [Sandbox vs stratégie d’outil vs privilège élevé](/fr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) pour des exemples et des notes de sécurité.

  </Accordion>

  <Accordion title="Comment fonctionne la mémoire ?">
    La mémoire OpenClaw n’est constituée que de fichiers Markdown dans l’espace de travail de l’agent :

    - Notes quotidiennes dans `memory/YYYY-MM-DD.md`
    - Notes long terme sélectionnées dans `MEMORY.md` (sessions principales/privées uniquement)

    OpenClaw exécute aussi un **vidage de mémoire silencieux avant Compaction** pour rappeler au modèle
    d’écrire des notes durables avant l’auto-Compaction. Cela s’exécute uniquement lorsque l’espace de travail
    est inscriptible (les sandboxes en lecture seule l’ignorent). Consultez [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="La mémoire continue d’oublier des choses. Comment les faire persister ?">
    Demandez au bot d’**écrire le fait en mémoire**. Les notes long terme appartiennent à `MEMORY.md`,
    le contexte court terme va dans `memory/YYYY-MM-DD.md`.

    C’est encore un domaine que nous améliorons. Il est utile de rappeler au modèle de stocker les souvenirs ;
    il saura quoi faire. S’il continue d’oublier, vérifiez que le Gateway utilise le même
    espace de travail à chaque exécution.

    Documentation : [Mémoire](/fr/concepts/memory), [Espace de travail de l’agent](/fr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La mémoire persiste-t-elle indéfiniment ? Quelles sont les limites ?">
    Les fichiers de mémoire vivent sur disque et persistent jusqu’à ce que vous les supprimiez. La limite est votre
    stockage, pas le modèle. Le **contexte de session** reste limité par la fenêtre de contexte
    du modèle, donc les longues conversations peuvent être compactées ou tronquées. C’est pourquoi
    la recherche mémoire existe - elle ne ramène dans le contexte que les parties pertinentes.

    Documentation : [Mémoire](/fr/concepts/memory), [Contexte](/fr/concepts/context).

  </Accordion>

  <Accordion title="La recherche de mémoire sémantique nécessite-t-elle une clé API OpenAI ?">
    Seulement si vous utilisez les **embeddings OpenAI**. L’OAuth Codex couvre le chat/les complétions et
    ne donne **pas** accès aux embeddings ; ainsi, **se connecter avec Codex (OAuth ou la
    connexion CLI Codex)** n’aide pas pour la recherche de mémoire sémantique. Les embeddings OpenAI
    nécessitent toujours une vraie clé API (`OPENAI_API_KEY` ou `models.providers.openai.apiKey`).

    Si vous ne définissez pas explicitement de fournisseur, OpenClaw sélectionne automatiquement un fournisseur lorsqu’il
    peut résoudre une clé API (profils d’authentification, `models.providers.*.apiKey` ou variables d’environnement).
    Il préfère OpenAI si une clé OpenAI est résolue, sinon Gemini si une clé Gemini
    est résolue, puis Voyage, puis Mistral. Si aucune clé distante n’est disponible, la recherche de
    mémoire reste désactivée jusqu’à ce que vous la configuriez. Si vous avez un chemin de modèle local
    configuré et présent, OpenClaw
    préfère `local`. Ollama est pris en charge lorsque vous définissez explicitement
    `memorySearch.provider = "ollama"`.

    Si vous préférez rester en local, définissez `memorySearch.provider = "local"` (et éventuellement
    `memorySearch.fallback = "none"`). Si vous voulez des embeddings Gemini, définissez
    `memorySearch.provider = "gemini"` et fournissez `GEMINI_API_KEY` (ou
    `memorySearch.remote.apiKey`). Nous prenons en charge les modèles d’embedding **OpenAI, Gemini, Voyage, Mistral, Ollama ou locaux**
    ; consultez [Mémoire](/fr/concepts/memory) pour les détails de configuration.

  </Accordion>
</AccordionGroup>

## Où les éléments résident sur le disque

<AccordionGroup>
  <Accordion title="Toutes les données utilisées avec OpenClaw sont-elles enregistrées localement ?">
    Non : **l’état d’OpenClaw est local**, mais **les services externes voient toujours ce que vous leur envoyez**.

    - **Local par défaut :** les sessions, les fichiers mémoire, la configuration et l’espace de travail résident sur l’hôte Gateway
      (`~/.openclaw` + le répertoire de votre espace de travail).
    - **Distant par nécessité :** les messages que vous envoyez aux fournisseurs de modèles (Anthropic/OpenAI/etc.) sont transmis à
      leurs API, et les plateformes de chat (WhatsApp/Telegram/Slack/etc.) stockent les données de messages sur leurs
      serveurs.
    - **Vous contrôlez l’empreinte :** l’utilisation de modèles locaux garde les prompts sur votre machine, mais le trafic des canaux
      passe toujours par les serveurs du canal.

    Connexe : [Espace de travail de l’agent](/fr/concepts/agent-workspace), [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Où OpenClaw stocke-t-il ses données ?">
    Tout réside sous `$OPENCLAW_STATE_DIR` (par défaut : `~/.openclaw`) :

    | Chemin                                                          | Objectif                                                           |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuration principale (JSON5)                                   |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Import OAuth hérité (copié dans les profils d’authentification à la première utilisation) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profils d’authentification (OAuth, clés API et `keyRef`/`tokenRef` facultatifs) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Charge utile secrète facultative sauvegardée dans un fichier pour les fournisseurs SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Fichier de compatibilité hérité (entrées `api_key` statiques nettoyées) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | État du fournisseur (p. ex. `whatsapp/<accountId>/creds.json`)     |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | État par agent (agentDir + sessions)                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historique et état de conversation (par agent)                     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Métadonnées de session (par agent)                                 |

    Chemin hérité pour agent unique : `~/.openclaw/agent/*` (migré par `openclaw doctor`).

    Votre **espace de travail** (AGENTS.md, fichiers mémoire, skills, etc.) est séparé et configuré via `agents.defaults.workspace` (par défaut : `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Où AGENTS.md / SOUL.md / USER.md / MEMORY.md doivent-ils résider ?">
    Ces fichiers résident dans l’**espace de travail de l’agent**, pas dans `~/.openclaw`.

    - **Espace de travail (par agent)** : `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` facultatif.
      La racine en minuscules `memory.md` est uniquement une entrée de réparation héritée ; `openclaw doctor --fix`
      peut la fusionner dans `MEMORY.md` lorsque les deux fichiers existent.
    - **Répertoire d’état (`~/.openclaw`)** : configuration, état des canaux/fournisseurs, profils d’authentification, sessions, journaux,
      et skills partagés (`~/.openclaw/skills`).

    L’espace de travail par défaut est `~/.openclaw/workspace`, configurable via :

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si le bot « oublie » après un redémarrage, vérifiez que le Gateway utilise le même
    espace de travail à chaque lancement (et souvenez-vous : le mode distant utilise l’**espace de travail de l’hôte gateway**,
    pas celui de votre ordinateur portable local).

    Astuce : si vous voulez un comportement ou une préférence durable, demandez au bot de **l’écrire dans
    AGENTS.md ou MEMORY.md** plutôt que de vous appuyer sur l’historique du chat.

    Consultez [Espace de travail de l’agent](/fr/concepts/agent-workspace) et [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Stratégie de sauvegarde recommandée">
    Placez votre **espace de travail d’agent** dans un dépôt git **privé** et sauvegardez-le dans un emplacement
    privé (par exemple GitHub privé). Cela capture la mémoire + les fichiers AGENTS/SOUL/USER
    et vous permet de restaurer plus tard « l’esprit » de l’assistant.

    Ne validez **rien** sous `~/.openclaw` (identifiants, sessions, jetons ou charges utiles de secrets chiffrées).
    Si vous avez besoin d’une restauration complète, sauvegardez séparément l’espace de travail et le répertoire d’état
    (voir la question sur la migration ci-dessus).

    Documentation : [Espace de travail de l’agent](/fr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Comment désinstaller complètement OpenClaw ?">
    Consultez le guide dédié : [Désinstaller](/fr/install/uninstall).
  </Accordion>

  <Accordion title="Les agents peuvent-ils travailler en dehors de l’espace de travail ?">
    Oui. L’espace de travail est le **cwd par défaut** et l’ancre mémoire, pas un bac à sable strict.
    Les chemins relatifs se résolvent dans l’espace de travail, mais les chemins absolus peuvent accéder à d’autres
    emplacements de l’hôte sauf si le sandboxing est activé. Si vous avez besoin d’isolation, utilisez
    [`agents.defaults.sandbox`](/fr/gateway/sandboxing) ou des paramètres de sandbox par agent. Si vous
    voulez qu’un dépôt soit le répertoire de travail par défaut, faites pointer le
    `workspace` de cet agent vers la racine du dépôt. Le dépôt OpenClaw est seulement le code source ; gardez
    l’espace de travail séparé sauf si vous voulez intentionnellement que l’agent y travaille.

    Exemple (dépôt comme cwd par défaut) :

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Mode distant : où se trouve le magasin de sessions ?">
    L’état de session appartient à l’**hôte gateway**. Si vous êtes en mode distant, le magasin de sessions qui vous intéresse se trouve sur la machine distante, pas sur votre ordinateur portable local. Consultez [Gestion des sessions](/fr/concepts/session).
  </Accordion>
</AccordionGroup>

## Bases de la configuration

<AccordionGroup>
  <Accordion title="Quel est le format de la configuration ? Où se trouve-t-elle ?">
    OpenClaw lit une configuration **JSON5** facultative depuis `$OPENCLAW_CONFIG_PATH` (par défaut : `~/.openclaw/openclaw.json`) :

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Si le fichier est absent, il utilise des valeurs par défaut raisonnablement sûres (notamment un espace de travail par défaut `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='J’ai défini gateway.bind: "lan" (ou "tailnet") et maintenant rien n’écoute / l’interface indique non autorisé'>
    Les liaisons non-loopback **nécessitent un chemin d’authentification gateway valide**. En pratique, cela signifie :

    - authentification par secret partagé : jeton ou mot de passe
    - `gateway.auth.mode: "trusted-proxy"` derrière un proxy inverse tenant compte de l’identité correctement configuré

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Remarques :

    - `gateway.remote.token` / `.password` n’activent **pas** l’authentification du gateway local à eux seuls.
    - Les chemins d’appel locaux peuvent utiliser `gateway.remote.*` comme solution de repli uniquement lorsque `gateway.auth.*` n’est pas défini.
    - Pour l’authentification par mot de passe, définissez plutôt `gateway.auth.mode: "password"` avec `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue fermée (pas de masquage par repli distant).
    - Les configurations Control UI avec secret partagé s’authentifient via `connect.params.auth.token` ou `connect.params.auth.password` (stocké dans les paramètres de l’application/de l’interface). Les modes porteurs d’identité comme Tailscale Serve ou `trusted-proxy` utilisent plutôt des en-têtes de requête. Évitez de placer des secrets partagés dans les URL.
    - Avec `gateway.auth.mode: "trusted-proxy"`, les proxys inverses local loopback sur le même hôte nécessitent explicitement `gateway.auth.trustedProxy.allowLoopback = true` et une entrée loopback dans `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Pourquoi ai-je maintenant besoin d’un jeton sur localhost ?">
    OpenClaw applique l’authentification gateway par défaut, y compris sur loopback. Dans le chemin normal par défaut, cela signifie une authentification par jeton : si aucun chemin d’authentification explicite n’est configuré, le démarrage du gateway se résout en mode jeton et en génère automatiquement un, l’enregistrant dans `gateway.auth.token`, de sorte que **les clients WS locaux doivent s’authentifier**. Cela empêche d’autres processus locaux d’appeler le Gateway.

    Si vous préférez un autre chemin d’authentification, vous pouvez choisir explicitement le mode mot de passe (ou, pour les proxys inverses tenant compte de l’identité, `trusted-proxy`). Si vous voulez **vraiment** ouvrir loopback, définissez explicitement `gateway.auth.mode: "none"` dans votre configuration. Doctor peut générer un jeton pour vous à tout moment : `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Dois-je redémarrer après avoir modifié la configuration ?">
    Le Gateway surveille la configuration et prend en charge le rechargement à chaud :

    - `gateway.reload.mode: "hybrid"` (par défaut) : applique à chaud les changements sûrs, redémarre pour les changements critiques
    - `hot`, `restart`, `off` sont également pris en charge

  </Accordion>

  <Accordion title="Comment désactiver les slogans amusants de la CLI ?">
    Définissez `cli.banner.taglineMode` dans la configuration :

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off` : masque le texte du slogan mais conserve la ligne de titre/version de la bannière.
    - `default` : utilise `All your chats, one OpenClaw.` à chaque fois.
    - `random` : slogans amusants/saisonniers en rotation (comportement par défaut).
    - Si vous ne voulez aucune bannière, définissez la variable d’environnement `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Comment activer la recherche web (et la récupération web) ?">
    `web_fetch` fonctionne sans clé API. `web_search` dépend du
    fournisseur sélectionné :

    - Les fournisseurs adossés à une API comme Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity et Tavily nécessitent leur configuration normale de clé API.
    - Ollama Web Search ne nécessite pas de clé, mais utilise votre hôte Ollama configuré et requiert `ollama signin`.
    - DuckDuckGo ne nécessite pas de clé, mais c’est une intégration non officielle basée sur HTML.
    - SearXNG ne nécessite pas de clé/peut être auto-hébergé ; configurez `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recommandé :** exécutez `openclaw configure --section web` et choisissez un fournisseur.
    Alternatives par variable d’environnement :

    - Brave : `BRAVE_API_KEY`
    - Exa : `EXA_API_KEY`
    - Firecrawl : `FIRECRAWL_API_KEY`
    - Gemini : `GEMINI_API_KEY`
    - Grok : `XAI_API_KEY`
    - Kimi : `KIMI_API_KEY` ou `MOONSHOT_API_KEY`
    - MiniMax Search : `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY`
    - Perplexity : `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`
    - SearXNG : `SEARXNG_BASE_URL`
    - Tavily : `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    La configuration de recherche web propre au fournisseur réside désormais sous `plugins.entries.<plugin>.config.webSearch.*`.
    Les anciens chemins de fournisseur `tools.web.search.*` se chargent encore temporairement pour la compatibilité, mais ils ne doivent pas être utilisés pour les nouvelles configurations.
    La configuration de repli de récupération web Firecrawl réside sous `plugins.entries.firecrawl.config.webFetch.*`.

    Notes :

    - Si vous utilisez des listes d’autorisation, ajoutez `web_search`/`web_fetch`/`x_search` ou `group:web`.
    - `web_fetch` est activé par défaut (sauf désactivation explicite).
    - Si `tools.web.fetch.provider` est omis, OpenClaw détecte automatiquement le premier fournisseur de repli de récupération prêt à partir des identifiants disponibles. Aujourd’hui, le fournisseur intégré est Firecrawl.
    - Les démons lisent les variables d’environnement depuis `~/.openclaw/.env` (ou depuis l’environnement du service).

    Docs : [Outils web](/fr/tools/web).

  </Accordion>

  <Accordion title="config.apply a effacé ma configuration. Comment récupérer et éviter cela ?">
    `config.apply` remplace la **configuration entière**. Si vous envoyez un objet partiel, tout
    le reste est supprimé.

    La version actuelle d’OpenClaw protège contre de nombreux écrasements accidentels :

    - Les écritures de configuration détenues par OpenClaw valident la configuration complète après changement avant l’écriture.
    - Les écritures détenues par OpenClaw invalides ou destructrices sont rejetées et enregistrées sous `openclaw.json.rejected.*`.
    - Si une modification directe casse le démarrage ou le rechargement à chaud, le Gateway restaure la dernière configuration connue comme valide et enregistre le fichier rejeté sous `openclaw.json.clobbered.*`.
    - L’agent principal reçoit un avertissement de démarrage après la récupération afin de ne pas réécrire aveuglément la mauvaise configuration.

    Récupérer :

    - Vérifiez `openclaw logs --follow` pour `Config auto-restored from last-known-good`, `Config write rejected:` ou `config reload restored last-known-good config`.
    - Inspectez le plus récent `openclaw.json.clobbered.*` ou `openclaw.json.rejected.*` à côté de la configuration active.
    - Conservez la configuration restaurée active si elle fonctionne, puis recopiez uniquement les clés voulues avec `openclaw config set` ou `config.patch`.
    - Exécutez `openclaw config validate` et `openclaw doctor`.
    - Si vous n’avez aucune dernière configuration connue comme valide ni charge utile rejetée, restaurez depuis une sauvegarde, ou réexécutez `openclaw doctor` et reconfigurez les canaux/modèles.
    - Si cela était inattendu, signalez un bogue et incluez votre dernière configuration connue ou toute sauvegarde.
    - Un agent de codage local peut souvent reconstruire une configuration fonctionnelle à partir des journaux ou de l’historique.

    L’éviter :

    - Utilisez `openclaw config set` pour les petits changements.
    - Utilisez `openclaw configure` pour les modifications interactives.
    - Utilisez d’abord `config.schema.lookup` lorsque vous n’êtes pas sûr d’un chemin exact ou de la forme d’un champ ; il renvoie un nœud de schéma superficiel ainsi que des résumés des enfants immédiats pour l’exploration.
    - Utilisez `config.patch` pour les modifications RPC partielles ; réservez `config.apply` au remplacement de la configuration complète uniquement.
    - Si vous utilisez l’outil `gateway` réservé au propriétaire depuis une exécution d’agent, il rejettera toujours les écritures vers `tools.exec.ask` / `tools.exec.security` (y compris les anciens alias `tools.bash.*` qui se normalisent vers les mêmes chemins d’exécution protégés).

    Docs : [Configuration](/fr/cli/config), [Configurer](/fr/cli/configure), [Dépannage du Gateway](/fr/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/fr/gateway/doctor).

  </Accordion>

  <Accordion title="Comment exécuter un Gateway central avec des workers spécialisés sur plusieurs appareils ?">
    Le schéma courant est **un Gateway** (par exemple Raspberry Pi) plus des **nœuds** et des **agents** :

    - **Gateway (central) :** possède les canaux (Signal/WhatsApp), le routage et les sessions.
    - **Nœuds (appareils) :** les Mac/iOS/Android se connectent comme périphériques et exposent des outils locaux (`system.run`, `canvas`, `camera`).
    - **Agents (workers) :** cerveaux/espaces de travail séparés pour des rôles spéciaux (par exemple « ops Hetzner », « Données personnelles »).
    - **Sous-agents :** lancent du travail en arrière-plan depuis un agent principal lorsque vous voulez du parallélisme.
    - **TUI :** se connecte au Gateway et change d’agents/sessions.

    Docs : [Nœuds](/fr/nodes), [Accès distant](/fr/gateway/remote), [Routage multi-agent](/fr/concepts/multi-agent), [Sous-agents](/fr/tools/subagents), [TUI](/fr/web/tui).

  </Accordion>

  <Accordion title="Le navigateur OpenClaw peut-il s’exécuter en mode headless ?">
    Oui. C’est une option de configuration :

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    La valeur par défaut est `false` (avec interface visible). Le mode headless est plus susceptible de déclencher des contrôles anti-bot sur certains sites. Consultez [Navigateur](/fr/tools/browser).

    Le mode headless utilise le **même moteur Chromium** et fonctionne pour la plupart des automatisations (formulaires, clics, scraping, connexions). Les principales différences :

    - Aucune fenêtre de navigateur visible (utilisez des captures d’écran si vous avez besoin de visuels).
    - Certains sites sont plus stricts concernant l’automatisation en mode headless (CAPTCHA, anti-bot).
      Par exemple, X/Twitter bloque souvent les sessions headless.

  </Accordion>

  <Accordion title="Comment utiliser Brave pour contrôler le navigateur ?">
    Définissez `browser.executablePath` sur votre binaire Brave (ou tout navigateur basé sur Chromium) et redémarrez le Gateway.
    Consultez les exemples complets de configuration dans [Navigateur](/fr/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways distants et nœuds

<AccordionGroup>
  <Accordion title="Comment les commandes se propagent-elles entre Telegram, le Gateway et les nœuds ?">
    Les messages Telegram sont gérés par le **gateway**. Le gateway exécute l’agent et
    appelle seulement ensuite les nœuds via le **Gateway WebSocket** lorsqu’un outil de nœud est nécessaire :

    Telegram → Gateway → Agent → `node.*` → Nœud → Gateway → Telegram

    Les nœuds ne voient pas le trafic entrant du fournisseur ; ils reçoivent uniquement des appels RPC de nœud.

  </Accordion>

  <Accordion title="Comment mon agent peut-il accéder à mon ordinateur si le Gateway est hébergé à distance ?">
    Réponse courte : **associez votre ordinateur comme nœud**. Le Gateway s’exécute ailleurs, mais il peut
    appeler les outils `node.*` (écran, caméra, système) sur votre machine locale via le Gateway WebSocket.

    Configuration typique :

    1. Exécutez le Gateway sur l’hôte toujours allumé (VPS/serveur domestique).
    2. Placez l’hôte Gateway et votre ordinateur sur le même tailnet.
    3. Assurez-vous que le WS du Gateway est joignable (liaison tailnet ou tunnel SSH).
    4. Ouvrez l’app macOS localement et connectez-vous en mode **Distant via SSH** (ou tailnet direct)
       afin qu’elle puisse s’enregistrer comme nœud.
    5. Approuvez le nœud sur le Gateway :

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Aucun pont TCP séparé n’est requis ; les nœuds se connectent via le Gateway WebSocket.

    Rappel de sécurité : associer un nœud macOS autorise `system.run` sur cette machine. Associez
    uniquement des appareils auxquels vous faites confiance, et consultez [Sécurité](/fr/gateway/security).

    Docs : [Nœuds](/fr/nodes), [Protocole Gateway](/fr/gateway/protocol), [Mode distant macOS](/fr/platforms/mac/remote), [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale est connecté, mais je ne reçois aucune réponse. Que faire ?">
    Vérifiez les bases :

    - Le Gateway est en cours d’exécution : `openclaw gateway status`
    - Santé du Gateway : `openclaw status`
    - Santé des canaux : `openclaw channels status`

    Vérifiez ensuite l’authentification et le routage :

    - Si vous utilisez Tailscale Serve, assurez-vous que `gateway.auth.allowTailscale` est correctement défini.
    - Si vous vous connectez via un tunnel SSH, confirmez que le tunnel local est actif et pointe vers le bon port.
    - Confirmez que vos listes d’autorisation (DM ou groupe) incluent votre compte.

    Docs : [Tailscale](/fr/gateway/tailscale), [Accès distant](/fr/gateway/remote), [Canaux](/fr/channels).

  </Accordion>

  <Accordion title="Deux instances OpenClaw peuvent-elles communiquer entre elles (local + VPS) ?">
    Oui. Il n’existe pas de pont « bot-à-bot » intégré, mais vous pouvez le câbler de quelques
    manières fiables :

    **Le plus simple :** utilisez un canal de discussion normal auquel les deux bots peuvent accéder (Telegram/Slack/WhatsApp).
    Faites envoyer un message par le bot A au bot B, puis laissez le bot B répondre normalement.

    **Pont CLI (générique) :** exécutez un script qui appelle l’autre Gateway avec
    `openclaw agent --message ... --deliver`, en ciblant une discussion où l’autre bot
    écoute. Si un bot est sur un VPS distant, pointez votre CLI vers ce Gateway distant
    via SSH/Tailscale (voir [Accès distant](/fr/gateway/remote)).

    Exemple de schéma (à exécuter depuis une machine qui peut joindre le Gateway cible) :

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Astuce : ajoutez un garde-fou afin que les deux bots ne bouclent pas indéfiniment (mentions
    uniquement, listes d’autorisation de canal, ou règle « ne pas répondre aux messages de bot »).

    Docs : [Accès distant](/fr/gateway/remote), [CLI agent](/fr/cli/agent), [Envoi par agent](/fr/tools/agent-send).

  </Accordion>

  <Accordion title="Ai-je besoin de VPS séparés pour plusieurs agents ?">
    Non. Un seul Gateway peut héberger plusieurs agents, chacun avec son propre espace de travail, ses modèles par défaut
    et son routage. C’est la configuration normale, beaucoup moins chère et plus simple que d’exécuter
    un VPS par agent.

    Utilisez des VPS séparés uniquement lorsque vous avez besoin d’une isolation forte (frontières de sécurité) ou de configurations
    très différentes que vous ne voulez pas partager. Sinon, conservez un seul Gateway et
    utilisez plusieurs agents ou sous-agents.

  </Accordion>

  <Accordion title="Y a-t-il un avantage à utiliser un nœud sur mon ordinateur portable personnel plutôt que SSH depuis un VPS ?">
    Oui - les nœuds sont le moyen de première classe pour joindre votre ordinateur portable depuis un Gateway distant, et ils
    débloquent davantage qu’un accès shell. Le Gateway s’exécute sur macOS/Linux (Windows via WSL2) et est
    léger (un petit VPS ou une machine de classe Raspberry Pi convient ; 4 Go de RAM suffisent largement), donc une configuration
    courante est un hôte toujours allumé plus votre ordinateur portable comme nœud.

    - **Aucun SSH entrant requis.** Les nœuds se connectent en sortie au Gateway WebSocket et utilisent l’association d’appareil.
    - **Contrôles d’exécution plus sûrs.** `system.run` est limité par les listes d’autorisation/approbations de nœud sur cet ordinateur portable.
    - **Plus d’outils d’appareil.** Les nœuds exposent `canvas`, `camera` et `screen` en plus de `system.run`.
    - **Automatisation locale du navigateur.** Gardez le Gateway sur un VPS, mais exécutez Chrome localement via un hôte de nœud sur l’ordinateur portable, ou attachez-vous au Chrome local sur l’hôte via Chrome MCP.

    SSH convient pour un accès shell ponctuel, mais les nœuds sont plus simples pour les workflows d’agent continus et
    l’automatisation d’appareil.

    Docs : [Nœuds](/fr/nodes), [CLI des nœuds](/fr/cli/nodes), [Navigateur](/fr/tools/browser).

  </Accordion>

  <Accordion title="Les nœuds exécutent-ils un service gateway ?">
    Non. Un seul **gateway** doit s’exécuter par hôte, sauf si vous exécutez intentionnellement des profils isolés (voir [Gateways multiples](/fr/gateway/multiple-gateways)). Les nœuds sont des périphériques qui se connectent
    au gateway (nœuds iOS/Android, ou « mode nœud » macOS dans l’app de barre de menus). Pour les hôtes de nœud
    headless et le contrôle CLI, consultez [CLI d’hôte de nœud](/fr/cli/node).

    Un redémarrage complet est requis pour les changements de `gateway`, `discovery` et `canvasHost`.

  </Accordion>

  <Accordion title="Existe-t-il un moyen API / RPC d’appliquer la configuration ?">
    Oui.

    - `config.schema.lookup` : inspecte une sous-arborescence de configuration avec son nœud de schéma superficiel, l’indice d’interface correspondant et les résumés des enfants immédiats avant l’écriture
    - `config.get` : récupère l’instantané courant + le hash
    - `config.patch` : mise à jour partielle sûre (préférée pour la plupart des modifications RPC) ; recharge à chaud lorsque c’est possible et redémarre lorsque c’est nécessaire
    - `config.apply` : valide + remplace la configuration complète ; recharge à chaud lorsque c’est possible et redémarre lorsque c’est nécessaire
    - L’outil d’exécution `gateway` réservé au propriétaire refuse toujours de réécrire `tools.exec.ask` / `tools.exec.security` ; les anciens alias `tools.bash.*` se normalisent vers les mêmes chemins d’exécution protégés

  </Accordion>

  <Accordion title="Configuration minimale raisonnable pour une première installation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Cela définit votre espace de travail et limite les personnes pouvant déclencher le bot.

  </Accordion>

  <Accordion title="Comment configurer Tailscale sur un VPS et se connecter depuis mon Mac ?">
    Étapes minimales :

    1. **Installer + se connecter sur le VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Installer + se connecter sur votre Mac**
       - Utilisez l’application Tailscale et connectez-vous au même tailnet.
    3. **Activer MagicDNS (recommandé)**
       - Dans la console d’administration Tailscale, activez MagicDNS afin que le VPS dispose d’un nom stable.
    4. **Utiliser le nom d’hôte du tailnet**
       - SSH : `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS : `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Si vous voulez l’interface de contrôle sans SSH, utilisez Tailscale Serve sur le VPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Cela garde le gateway lié au loopback et expose HTTPS via Tailscale. Voir [Tailscale](/fr/gateway/tailscale).

  </Accordion>

  <Accordion title="Comment connecter un nœud Mac à un Gateway distant (Tailscale Serve) ?">
    Serve expose l’**interface de contrôle du Gateway + WS**. Les nœuds se connectent via le même point de terminaison Gateway WS.

    Configuration recommandée :

    1. **Assurez-vous que le VPS + le Mac sont sur le même tailnet**.
    2. **Utilisez l’application macOS en mode distant** (la cible SSH peut être le nom d’hôte du tailnet).
       L’application établira un tunnel vers le port du Gateway et se connectera comme nœud.
    3. **Approuvez le nœud** sur le gateway :

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentation : [Protocole Gateway](/fr/gateway/protocol), [Découverte](/fr/gateway/discovery), [Mode distant macOS](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Dois-je installer sur un deuxième ordinateur portable ou simplement ajouter un nœud ?">
    Si vous avez seulement besoin d’**outils locaux** (écran/caméra/exec) sur le deuxième ordinateur portable, ajoutez-le comme
    **nœud**. Cela conserve un seul Gateway et évite de dupliquer la configuration. Les outils de nœud locaux sont
    actuellement réservés à macOS, mais nous prévoyons de les étendre à d’autres systèmes d’exploitation.

    Installez un deuxième Gateway uniquement lorsque vous avez besoin d’une **isolation stricte** ou de deux bots entièrement séparés.

    Documentation : [Nœuds](/fr/nodes), [CLI des nœuds](/fr/cli/nodes), [Gateways multiples](/fr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables d’environnement et chargement de .env

<AccordionGroup>
  <Accordion title="Comment OpenClaw charge-t-il les variables d’environnement ?">
    OpenClaw lit les variables d’environnement du processus parent (shell, launchd/systemd, CI, etc.) et charge également :

    - `.env` depuis le répertoire de travail courant
    - un `.env` de secours global depuis `~/.openclaw/.env` (aussi appelé `$OPENCLAW_STATE_DIR/.env`)

    Aucun des fichiers `.env` ne remplace les variables d’environnement existantes.

    Vous pouvez aussi définir des variables d’environnement inline dans la configuration (appliquées uniquement si elles sont absentes de l’environnement du processus) :

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Voir [/environment](/fr/help/environment) pour la précédence et les sources complètes.

  </Accordion>

  <Accordion title="J’ai démarré le Gateway via le service et mes variables d’environnement ont disparu. Que faire ?">
    Deux corrections courantes :

    1. Placez les clés manquantes dans `~/.openclaw/.env` afin qu’elles soient récupérées même lorsque le service n’hérite pas de l’environnement de votre shell.
    2. Activez l’importation du shell (commodité optionnelle) :

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Cela exécute votre shell de connexion et importe uniquement les clés attendues manquantes (sans jamais remplacer). Équivalents en variables d’environnement :
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='J’ai défini COPILOT_GITHUB_TOKEN, mais l’état des modèles affiche "Shell env: off." Pourquoi ?'>
    `openclaw models status` indique si l’**importation de l’environnement du shell** est activée. "Shell env: off"
    ne signifie **pas** que vos variables d’environnement sont manquantes - cela signifie simplement qu’OpenClaw ne chargera pas
    automatiquement votre shell de connexion.

    Si le Gateway s’exécute comme service (launchd/systemd), il n’héritera pas de votre
    environnement de shell. Corrigez cela de l’une des façons suivantes :

    1. Placez le jeton dans `~/.openclaw/.env` :

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Ou activez l’importation du shell (`env.shellEnv.enabled: true`).
    3. Ou ajoutez-le au bloc `env` de votre configuration (s’applique uniquement s’il est absent).

    Redémarrez ensuite le gateway et revérifiez :

    ```bash
    openclaw models status
    ```

    Les jetons Copilot sont lus depuis `COPILOT_GITHUB_TOKEN` (ainsi que `GH_TOKEN` / `GITHUB_TOKEN`).
    Voir [/concepts/model-providers](/fr/concepts/model-providers) et [/environment](/fr/help/environment).

  </Accordion>
</AccordionGroup>

## Sessions et chats multiples

<AccordionGroup>
  <Accordion title="Comment démarrer une nouvelle conversation ?">
    Envoyez `/new` ou `/reset` comme message autonome. Voir [Gestion des sessions](/fr/concepts/session).
  </Accordion>

  <Accordion title="Les sessions se réinitialisent-elles automatiquement si je n’envoie jamais /new ?">
    Les sessions peuvent expirer après `session.idleMinutes`, mais cela est **désactivé par défaut** (valeur par défaut **0**).
    Définissez-le sur une valeur positive pour activer l’expiration en cas d’inactivité. Lorsqu’elle est activée, le message **suivant**
    après la période d’inactivité démarre un nouvel identifiant de session pour cette clé de chat.
    Cela ne supprime pas les transcriptions - cela démarre simplement une nouvelle session.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Existe-t-il un moyen de créer une équipe d’instances OpenClaw (un PDG et de nombreux agents) ?">
    Oui, via le **routage multi-agent** et les **sous-agents**. Vous pouvez créer un agent coordinateur
    et plusieurs agents travailleurs avec leurs propres espaces de travail et modèles.

    Cela dit, il vaut mieux considérer cela comme une **expérience amusante**. C’est gourmand en jetons et souvent
    moins efficace que d’utiliser un seul bot avec des sessions séparées. Le modèle typique que nous
    envisageons est un bot auquel vous parlez, avec différentes sessions pour le travail parallèle. Ce
    bot peut également générer des sous-agents si nécessaire.

    Documentation : [Routage multi-agent](/fr/concepts/multi-agent), [Sous-agents](/fr/tools/subagents), [CLI des agents](/fr/cli/agents).

  </Accordion>

  <Accordion title="Pourquoi le contexte a-t-il été tronqué au milieu d’une tâche ? Comment l’éviter ?">
    Le contexte de session est limité par la fenêtre du modèle. Les longues discussions, les sorties d’outils volumineuses ou de nombreux
    fichiers peuvent déclencher une compaction ou une troncature.

    Ce qui aide :

    - Demandez au bot de résumer l’état actuel et de l’écrire dans un fichier.
    - Utilisez `/compact` avant les longues tâches, et `/new` lorsque vous changez de sujet.
    - Gardez le contexte important dans l’espace de travail et demandez au bot de le relire.
    - Utilisez des sous-agents pour le travail long ou parallèle afin que le chat principal reste plus petit.
    - Choisissez un modèle avec une fenêtre de contexte plus grande si cela arrive souvent.

  </Accordion>

  <Accordion title="Comment réinitialiser complètement OpenClaw tout en le gardant installé ?">
    Utilisez la commande de réinitialisation :

    ```bash
    openclaw reset
    ```

    Réinitialisation complète non interactive :

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Puis relancez la configuration :

    ```bash
    openclaw onboard --install-daemon
    ```

    Notes :

    - L’onboarding propose également **Réinitialiser** s’il détecte une configuration existante. Voir [Onboarding (CLI)](/fr/start/wizard).
    - Si vous avez utilisé des profils (`--profile` / `OPENCLAW_PROFILE`), réinitialisez chaque répertoire d’état (les valeurs par défaut sont `~/.openclaw-<profile>`).
    - Réinitialisation dev : `openclaw gateway --dev --reset` (dev uniquement ; efface la configuration dev + les identifiants + les sessions + l’espace de travail).

  </Accordion>

  <Accordion title='J’obtiens des erreurs "context too large" - comment réinitialiser ou compacter ?'>
    Utilisez l’une de ces options :

    - **Compacter** (conserve la conversation mais résume les anciens tours) :

      ```
      /compact
      ```

      ou `/compact <instructions>` pour guider le résumé.

    - **Réinitialiser** (nouvel ID de session pour la même clé de chat) :

      ```
      /new
      /reset
      ```

    Si cela continue :

    - Activez ou ajustez **l’élagage des sessions** (`agents.defaults.contextPruning`) pour réduire les anciennes sorties d’outils.
    - Utilisez un modèle avec une fenêtre de contexte plus grande.

    Documentation : [Compaction](/fr/concepts/compaction), [Élagage des sessions](/fr/concepts/session-pruning), [Gestion des sessions](/fr/concepts/session).

  </Accordion>

  <Accordion title='Pourquoi vois-je "LLM request rejected: messages.content.tool_use.input field required" ?'>
    Il s’agit d’une erreur de validation du fournisseur : le modèle a émis un bloc `tool_use` sans le champ
    `input` requis. Cela signifie généralement que l’historique de session est obsolète ou corrompu (souvent après de longs fils
    ou une modification d’outil/de schéma).

    Correction : démarrez une nouvelle session avec `/new` (message autonome).

  </Accordion>

  <Accordion title="Pourquoi est-ce que je reçois des messages heartbeat toutes les 30 minutes ?">
    Les heartbeats s’exécutent toutes les **30 m** par défaut (**1 h** lorsque l’authentification OAuth est utilisée). Ajustez-les ou désactivez-les :

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    Si `HEARTBEAT.md` existe mais est effectivement vide (uniquement des lignes vides et des en-têtes
    markdown comme `# Heading`), OpenClaw ignore l’exécution du heartbeat pour économiser des appels API.
    Si le fichier est absent, le heartbeat s’exécute quand même et le modèle décide quoi faire.

    Les remplacements par agent utilisent `agents.list[].heartbeat`. Documentation : [Heartbeat](/fr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Dois-je ajouter un "compte de bot" à un groupe WhatsApp ?'>
    Non. OpenClaw s’exécute sur **votre propre compte**, donc si vous êtes dans le groupe, OpenClaw peut le voir.
    Par défaut, les réponses de groupe sont bloquées jusqu’à ce que vous autorisiez les expéditeurs (`groupPolicy: "allowlist"`).

    Si vous voulez que **vous seul** puissiez déclencher des réponses de groupe :

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Comment obtenir le JID d’un groupe WhatsApp ?">
    Option 1 (la plus rapide) : suivez les journaux et envoyez un message de test dans le groupe :

    ```bash
    openclaw logs --follow --json
    ```

    Recherchez `chatId` (ou `from`) se terminant par `@g.us`, comme :
    `1234567890-1234567890@g.us`.

    Option 2 (si déjà configuré/autorisé) : listez les groupes depuis la configuration :

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentation : [WhatsApp](/fr/channels/whatsapp), [Annuaire](/fr/cli/directory), [Journaux](/fr/cli/logs).

  </Accordion>

  <Accordion title="Pourquoi OpenClaw ne répond-il pas dans un groupe ?">
    Deux causes courantes :

    - Le filtrage par mention est activé (par défaut). Vous devez @mentionner le bot (ou correspondre à `mentionPatterns`).
    - Vous avez configuré `channels.whatsapp.groups` sans `"*"` et le groupe n’est pas autorisé.

    Voir [Groupes](/fr/channels/groups) et [Messages de groupe](/fr/channels/group-messages).

  </Accordion>

  <Accordion title="Les groupes/fils partagent-ils le contexte avec les DM ?">
    Les chats directs sont regroupés dans la session principale par défaut. Les groupes/canaux ont leurs propres clés de session, et les sujets Telegram / fils Discord sont des sessions séparées. Voir [Groupes](/fr/channels/groups) et [Messages de groupe](/fr/channels/group-messages).
  </Accordion>

  <Accordion title="Combien d’espaces de travail et d’agents puis-je créer ?">
    Aucune limite stricte. Des dizaines (voire des centaines) conviennent, mais surveillez :

    - **Croissance du disque :** les sessions + transcriptions se trouvent sous `~/.openclaw/agents/<agentId>/sessions/`.
    - **Coût en jetons :** plus d’agents signifie plus d’utilisation simultanée de modèles.
    - **Charge d’exploitation :** profils d’authentification, espaces de travail et routage des canaux par agent.

    Conseils :

    - Gardez un espace de travail **actif** par agent (`agents.defaults.workspace`).
    - Élaguez les anciennes sessions (supprimez les fichiers JSONL ou les entrées de stockage) si le disque grossit.
    - Utilisez `openclaw doctor` pour repérer les espaces de travail isolés et les incohérences de profil.

  </Accordion>

  <Accordion title="Can I run multiple bots or chats at the same time (Slack), and how should I set that up?">
    Oui. Utilisez **le routage multi-agent** pour exécuter plusieurs agents isolés et acheminer les messages entrants par
    canal/compte/pair. Slack est pris en charge comme canal et peut être lié à des agents spécifiques.

    L'accès au navigateur est puissant, mais ne permet pas de « faire tout ce qu'un humain peut faire » : les protections anti-bot, les CAPTCHA et la MFA peuvent
    encore bloquer l'automatisation. Pour le contrôle de navigateur le plus fiable, utilisez Chrome MCP local sur l'hôte,
    ou utilisez CDP sur la machine qui exécute réellement le navigateur.

    Configuration recommandée :

    - Hôte Gateway toujours actif (VPS/Mac mini).
    - Un agent par rôle (liaisons).
    - Canal ou canaux Slack liés à ces agents.
    - Navigateur local via Chrome MCP ou un Node si nécessaire.

    Docs : [Routage multi-agent](/fr/concepts/multi-agent), [Slack](/fr/channels/slack),
    [Navigateur](/fr/tools/browser), [Nodes](/fr/nodes).

  </Accordion>
</AccordionGroup>

## Modèles, basculement et profils d'authentification

Les questions-réponses sur les modèles — valeurs par défaut, sélection, alias, changement, basculement, profils d'authentification —
se trouvent dans la [FAQ des modèles](/fr/help/faq-models).

## Gateway : ports, « déjà en cours d'exécution » et mode distant

<AccordionGroup>
  <Accordion title="What port does the Gateway use?">
    `gateway.port` contrôle le port multiplexé unique pour WebSocket + HTTP (interface de contrôle, hooks, etc.).

    Priorité :

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Why does openclaw gateway status say "Runtime: running" but "Connectivity probe: failed"?'>
    Parce que « running » correspond à la vue du **superviseur** (launchd/systemd/schtasks). La sonde de connectivité correspond à la CLI qui se connecte réellement au WebSocket du Gateway.

    Utilisez `openclaw gateway status` et fiez-vous à ces lignes :

    - `Probe target:` (l'URL réellement utilisée par la sonde)
    - `Listening:` (ce qui est réellement lié au port)
    - `Last gateway error:` (cause racine fréquente lorsque le processus est vivant, mais que le port n'écoute pas)

  </Accordion>

  <Accordion title='Why does openclaw gateway status show "Config (cli)" and "Config (service)" different?'>
    Vous modifiez un fichier de configuration alors que le service en utilise un autre (souvent une incompatibilité `--profile` / `OPENCLAW_STATE_DIR`).

    Correction :

    ```bash
    openclaw gateway install --force
    ```

    Exécutez cette commande depuis le même `--profile` / environnement que celui que le service doit utiliser.

  </Accordion>

  <Accordion title='What does "another gateway instance is already listening" mean?'>
    OpenClaw impose un verrou d'exécution en liant immédiatement l'écouteur WebSocket au démarrage (`ws://127.0.0.1:18789` par défaut). Si la liaison échoue avec `EADDRINUSE`, il lève `GatewayLockError` indiquant qu'une autre instance est déjà à l'écoute.

    Correction : arrêtez l'autre instance, libérez le port, ou exécutez avec `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="How do I run OpenClaw in remote mode (client connects to a Gateway elsewhere)?">
    Définissez `gateway.mode: "remote"` et indiquez une URL WebSocket distante, éventuellement avec des identifiants distants à secret partagé :

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Notes :

    - `openclaw gateway` ne démarre que lorsque `gateway.mode` est `local` (ou si vous passez le drapeau de remplacement).
    - L'application macOS surveille le fichier de configuration et change de mode à chaud lorsque ces valeurs changent.
    - `gateway.remote.token` / `.password` sont uniquement des identifiants distants côté client ; ils n'activent pas à eux seuls l'authentification du Gateway local.

  </Accordion>

  <Accordion title='The Control UI says "unauthorized" (or keeps reconnecting). What now?'>
    Le chemin d'authentification de votre Gateway et la méthode d'authentification de l'interface ne correspondent pas.

    Faits (issus du code) :

    - L'interface de contrôle conserve le jeton dans `sessionStorage` pour la session de l'onglet de navigateur courant et l'URL de Gateway sélectionnée, de sorte que les actualisations dans le même onglet continuent de fonctionner sans rétablir la persistance de jeton longue durée dans localStorage.
    - Sur `AUTH_TOKEN_MISMATCH`, les clients approuvés peuvent tenter une relance bornée avec un jeton d'appareil mis en cache lorsque le Gateway renvoie des indications de relance (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Cette relance avec jeton mis en cache réutilise maintenant les portées approuvées mises en cache et stockées avec le jeton d'appareil. Les appelants avec `deviceToken` explicite / `scopes` explicites conservent toujours l'ensemble de portées demandé au lieu d'hériter des portées mises en cache.
    - En dehors de ce chemin de relance, la priorité d'authentification à la connexion est d'abord jeton/mot de passe partagé explicite, puis `deviceToken` explicite, puis jeton d'appareil stocké, puis jeton d'amorçage.
    - Les vérifications de portée du jeton d'amorçage sont préfixées par rôle. La liste d'autorisation d'opérateur d'amorçage intégrée ne satisfait que les requêtes d'opérateur ; les rôles node ou autres rôles non-operator ont toujours besoin de portées sous leur propre préfixe de rôle.

    Correction :

    - Le plus rapide : `openclaw dashboard` (affiche + copie l'URL du tableau de bord, tente de l'ouvrir ; affiche une indication SSH si l'environnement est sans interface graphique).
    - Si vous n'avez pas encore de jeton : `openclaw doctor --generate-gateway-token`.
    - Si c'est distant, créez d'abord un tunnel : `ssh -N -L 18789:127.0.0.1:18789 user@host` puis ouvrez `http://127.0.0.1:18789/`.
    - Mode à secret partagé : définissez `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, puis collez le secret correspondant dans les paramètres de l'interface de contrôle.
    - Mode Tailscale Serve : assurez-vous que `gateway.auth.allowTailscale` est activé et que vous ouvrez l'URL Serve, pas une URL brute loopback/tailnet qui contourne les en-têtes d'identité Tailscale.
    - Mode proxy approuvé : assurez-vous de passer par le proxy configuré sensible à l'identité, pas par une URL brute du Gateway. Les proxys local loopback du même hôte nécessitent aussi `gateway.auth.trustedProxy.allowLoopback = true`.
    - Si l'incompatibilité persiste après l'unique relance, faites une rotation/réapprouvez le jeton d'appareil appairé :
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Si cet appel de rotation indique qu'il a été refusé, vérifiez deux points :
      - les sessions d'appareils appairés ne peuvent faire pivoter que leur **propre** appareil, sauf si elles disposent aussi de `operator.admin`
      - les valeurs `--scope` explicites ne peuvent pas dépasser les portées opérateur actuelles de l'appelant
    - Toujours bloqué ? Exécutez `openclaw status --all` et suivez le [Dépannage](/fr/gateway/troubleshooting). Consultez [Tableau de bord](/fr/web/dashboard) pour les détails d'authentification.

  </Accordion>

  <Accordion title="I set gateway.bind tailnet but it cannot bind and nothing listens">
    La liaison `tailnet` choisit une IP Tailscale depuis vos interfaces réseau (100.64.0.0/10). Si la machine n'est pas sur Tailscale (ou si l'interface est inactive), il n'y a rien à lier.

    Correction :

    - Démarrez Tailscale sur cet hôte (afin qu'il ait une adresse 100.x), ou
    - Passez à `gateway.bind: "loopback"` / `"lan"`.

    Note : `tailnet` est explicite. `auto` préfère loopback ; utilisez `gateway.bind: "tailnet"` lorsque vous voulez une liaison réservée au tailnet.

  </Accordion>

  <Accordion title="Can I run multiple Gateways on the same host?">
    Généralement non : un Gateway peut exécuter plusieurs canaux de messagerie et agents. Utilisez plusieurs Gateways uniquement lorsque vous avez besoin de redondance (ex. : bot de secours) ou d'une isolation stricte.

    Oui, mais vous devez isoler :

    - `OPENCLAW_CONFIG_PATH` (configuration par instance)
    - `OPENCLAW_STATE_DIR` (état par instance)
    - `agents.defaults.workspace` (isolation de l'espace de travail)
    - `gateway.port` (ports uniques)

    Configuration rapide (recommandée) :

    - Utilisez `openclaw --profile <name> ...` par instance (crée automatiquement `~/.openclaw-<name>`).
    - Définissez un `gateway.port` unique dans la configuration de chaque profil (ou passez `--port` pour les exécutions manuelles).
    - Installez un service par profil : `openclaw --profile <name> gateway install`.

    Les profils suffixent aussi les noms de service (`ai.openclaw.<profile>` ; anciens `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guide complet : [Gateways multiples](/fr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='What does "invalid handshake" / code 1008 mean?'>
    Le Gateway est un **serveur WebSocket**, et il attend que le tout premier message
    soit une trame `connect`. S'il reçoit autre chose, il ferme la connexion
    avec le **code 1008** (violation de politique).

    Causes fréquentes :

    - Vous avez ouvert l'URL **HTTP** dans un navigateur (`http://...`) au lieu d'un client WS.
    - Vous avez utilisé le mauvais port ou chemin.
    - Un proxy ou un tunnel a supprimé les en-têtes d'authentification ou envoyé une requête qui n'est pas destinée au Gateway.

    Corrections rapides :

    1. Utilisez l'URL WS : `ws://<host>:18789` (ou `wss://...` si HTTPS).
    2. N'ouvrez pas le port WS dans un onglet de navigateur normal.
    3. Si l'authentification est activée, incluez le jeton/mot de passe dans la trame `connect`.

    Si vous utilisez la CLI ou la TUI, l'URL doit ressembler à ceci :

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Détails du protocole : [protocole du Gateway](/fr/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Journalisation et débogage

<AccordionGroup>
  <Accordion title="Where are logs?">
    Journaux de fichier (structurés) :

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Vous pouvez définir un chemin stable via `logging.file`. Le niveau du journal de fichier est contrôlé par `logging.level`. La verbosité de la console est contrôlée par `--verbose` et `logging.consoleLevel`.

    Suivi de journal le plus rapide :

    ```bash
    openclaw logs --follow
    ```

    Journaux de service/superviseur (lorsque le Gateway s'exécute via launchd/systemd) :

    - macOS : `$OPENCLAW_STATE_DIR/logs/gateway.log` et `gateway.err.log` (par défaut : `~/.openclaw/logs/...` ; les profils utilisent `~/.openclaw-<profile>/logs/...`)
    - Linux : `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows : `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Consultez [Dépannage](/fr/gateway/troubleshooting) pour en savoir plus.

  </Accordion>

  <Accordion title="How do I start/stop/restart the Gateway service?">
    Utilisez les assistants du Gateway :

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Si vous exécutez le Gateway manuellement, `openclaw gateway --force` peut récupérer le port. Consultez [Gateway](/fr/gateway).

  </Accordion>

  <Accordion title="I closed my terminal on Windows - how do I restart OpenClaw?">
    Il existe **deux modes d'installation Windows** :

    **1) WSL2 (recommandé) :** le Gateway s'exécute dans Linux.

    Ouvrez PowerShell, entrez dans WSL, puis redémarrez :

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Si vous n'avez jamais installé le service, démarrez-le au premier plan :

    ```bash
    openclaw gateway run
    ```

    **2) Windows natif (non recommandé) :** le Gateway s'exécute directement dans Windows.

    Ouvrez PowerShell et exécutez :

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Si vous l'exécutez manuellement (sans service), utilisez :

    ```powershell
    openclaw gateway run
    ```

    Docs : [Windows (WSL2)](/fr/platforms/windows), [guide d'exploitation du service Gateway](/fr/gateway).

  </Accordion>

  <Accordion title="The Gateway is up but replies never arrive. What should I check?">
    Commencez par un rapide bilan de santé :

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causes fréquentes :

    - Authentification du modèle non chargée sur l'**hôte du Gateway** (vérifiez `models status`).
    - Appairage/liste d'autorisation du canal bloquant les réponses (vérifiez la configuration du canal + les journaux).
    - WebChat/tableau de bord ouvert sans le bon jeton.

    Si vous êtes en distant, confirmez que la connexion tunnel/Tailscale est active et que le
    WebSocket du Gateway est joignable.

    Docs : [Canaux](/fr/channels), [Dépannage](/fr/gateway/troubleshooting), [Accès distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - what now?'>
    Cela signifie généralement que l'interface a perdu la connexion WebSocket. Vérifiez :

    1. Le Gateway est-il en cours d’exécution ? `openclaw gateway status`
    2. Le Gateway est-il sain ? `openclaw status`
    3. L’UI a-t-elle le bon jeton ? `openclaw dashboard`
    4. Si l’accès est distant, le tunnel/lien Tailscale est-il actif ?

    Puis suivez les journaux :

    ```bash
    openclaw logs --follow
    ```

    Documentation : [Tableau de bord](/fr/web/dashboard), [Accès distant](/fr/gateway/remote), [Dépannage](/fr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands échoue. Que dois-je vérifier ?">
    Commencez par les journaux et l’état du canal :

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Puis faites correspondre l’erreur :

    - `BOT_COMMANDS_TOO_MUCH` : le menu Telegram contient trop d’entrées. OpenClaw réduit déjà jusqu’à la limite de Telegram et réessaie avec moins de commandes, mais certaines entrées de menu doivent encore être supprimées. Réduisez les commandes de plugin/skill/personnalisées, ou désactivez `channels.telegram.commands.native` si vous n’avez pas besoin du menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, ou des erreurs réseau similaires : si vous êtes sur un VPS ou derrière un proxy, confirmez que le HTTPS sortant est autorisé et que le DNS fonctionne pour `api.telegram.org`.

    Si le Gateway est distant, assurez-vous de consulter les journaux sur l’hôte du Gateway.

    Documentation : [Telegram](/fr/channels/telegram), [Dépannage des canaux](/fr/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI n’affiche aucune sortie. Que dois-je vérifier ?">
    Vérifiez d’abord que le Gateway est joignable et que l’agent peut s’exécuter :

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Dans la TUI, utilisez `/status` pour voir l’état actuel. Si vous attendez des réponses dans un canal
    de discussion, assurez-vous que la livraison est activée (`/deliver on`).

    Documentation : [TUI](/fr/web/tui), [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Comment arrêter complètement puis démarrer le Gateway ?">
    Si vous avez installé le service :

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Cela arrête/démarre le **service supervisé** (launchd sur macOS, systemd sur Linux).
    Utilisez cela lorsque le Gateway s’exécute en arrière-plan comme démon.

    Si vous l’exécutez au premier plan, arrêtez avec Ctrl-C, puis :

    ```bash
    openclaw gateway run
    ```

    Documentation : [Guide d’exploitation du service Gateway](/fr/gateway).

  </Accordion>

  <Accordion title="ELI5 : openclaw gateway restart contre openclaw gateway">
    - `openclaw gateway restart` : redémarre le **service en arrière-plan** (launchd/systemd).
    - `openclaw gateway` : exécute le gateway **au premier plan** pour cette session de terminal.

    Si vous avez installé le service, utilisez les commandes gateway. Utilisez `openclaw gateway` lorsque
    vous voulez une exécution ponctuelle au premier plan.

  </Accordion>

  <Accordion title="Le moyen le plus rapide d’obtenir plus de détails lorsqu’un problème survient">
    Démarrez le Gateway avec `--verbose` pour obtenir plus de détails dans la console. Inspectez ensuite le fichier journal pour les erreurs d’authentification de canal, de routage de modèle et de RPC.
  </Accordion>
</AccordionGroup>

## Médias et pièces jointes

<AccordionGroup>
  <Accordion title="Mon skill a généré une image/un PDF, mais rien n’a été envoyé">
    Les pièces jointes sortantes depuis l’agent doivent inclure une ligne `MEDIA:<path-or-url>` (sur sa propre ligne). Consultez [Configuration de l’assistant OpenClaw](/fr/start/openclaw) et [Envoi par l’agent](/fr/tools/agent-send).

    Envoi par la CLI :

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Vérifiez aussi :

    - Le canal cible prend en charge les médias sortants et n’est pas bloqué par des listes d’autorisation.
    - Le fichier respecte les limites de taille du fournisseur (les images sont redimensionnées à 2048 px maximum).
    - `tools.fs.workspaceOnly=true` limite les envois par chemin local à l’espace de travail, au dossier temporaire/stockage de médias et aux fichiers validés par le bac à sable.
    - `tools.fs.workspaceOnly=false` permet à `MEDIA:` d’envoyer des fichiers locaux de l’hôte que l’agent peut déjà lire, mais seulement pour les médias et les types de documents sûrs (images, audio, vidéo, PDF et documents Office). Les fichiers texte brut et les fichiers ressemblant à des secrets restent bloqués.

    Consultez [Images](/fr/nodes/images).

  </Accordion>
</AccordionGroup>

## Sécurité et contrôle d’accès

<AccordionGroup>
  <Accordion title="Est-il sûr d’exposer OpenClaw aux messages privés entrants ?">
    Traitez les messages privés entrants comme des entrées non fiables. Les valeurs par défaut sont conçues pour réduire le risque :

    - Le comportement par défaut sur les canaux prenant en charge les messages privés est le **pairing** :
      - Les expéditeurs inconnus reçoivent un code d’association ; le bot ne traite pas leur message.
      - Approuvez avec : `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Les demandes en attente sont plafonnées à **3 par canal** ; vérifiez `openclaw pairing list --channel <channel> [--account <id>]` si un code n’est pas arrivé.
    - Ouvrir les messages privés publiquement nécessite une activation explicite (`dmPolicy: "open"` et liste d’autorisation `"*"`).

    Exécutez `openclaw doctor` pour faire ressortir les politiques de messages privés risquées.

  </Accordion>

  <Accordion title="L’injection de prompt concerne-t-elle uniquement les bots publics ?">
    Non. L’injection de prompt concerne le **contenu non fiable**, pas seulement les personnes qui peuvent envoyer un message privé au bot.
    Si votre assistant lit du contenu externe (recherche/récupération web, pages de navigateur, e-mails,
    documents, pièces jointes, journaux collés), ce contenu peut inclure des instructions qui tentent
    de détourner le modèle. Cela peut arriver même si **vous êtes le seul expéditeur**.

    Le risque le plus important apparaît lorsque les outils sont activés : le modèle peut être piégé pour
    exfiltrer du contexte ou appeler des outils en votre nom. Réduisez la portée des dégâts en :

    - utilisant un agent « lecteur » en lecture seule ou sans outils pour résumer le contenu non fiable
    - gardant `web_search` / `web_fetch` / `browser` désactivés pour les agents avec outils activés
    - traitant aussi le texte de fichier/document décodé comme non fiable : OpenResponses
      `input_file` et l’extraction des pièces jointes médias encapsulent tous deux le texte extrait dans
      des marqueurs explicites de frontière de contenu externe au lieu de transmettre le texte brut du fichier
    - appliquant un bac à sable et des listes d’autorisation d’outils strictes

    Détails : [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Mon bot doit-il avoir sa propre adresse e-mail, son propre compte GitHub ou son propre numéro de téléphone ?">
    Oui, pour la plupart des configurations. Isoler le bot avec des comptes et numéros de téléphone séparés
    réduit la portée des dégâts si quelque chose se passe mal. Cela facilite aussi la rotation
    des identifiants ou la révocation d’accès sans affecter vos comptes personnels.

    Commencez petit. Donnez accès uniquement aux outils et comptes dont vous avez réellement besoin, puis élargissez
    plus tard si nécessaire.

    Documentation : [Sécurité](/fr/gateway/security), [Pairing](/fr/channels/pairing).

  </Accordion>

  <Accordion title="Puis-je lui donner de l’autonomie sur mes SMS, et est-ce sûr ?">
    Nous ne recommandons **pas** l’autonomie complète sur vos messages personnels. Le modèle le plus sûr est :

    - Garder les messages privés en **mode pairing** ou avec une liste d’autorisation stricte.
    - Utiliser un **numéro ou compte séparé** si vous voulez qu’il envoie des messages en votre nom.
    - Le laisser rédiger, puis **approuver avant l’envoi**.

    Si vous voulez expérimenter, faites-le sur un compte dédié et gardez-le isolé. Consultez
    [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Puis-je utiliser des modèles moins chers pour des tâches d’assistant personnel ?">
    Oui, **si** l’agent sert uniquement au chat et que l’entrée est fiable. Les niveaux plus petits sont
    plus vulnérables au détournement d’instructions, évitez-les donc pour les agents avec outils activés
    ou lors de la lecture de contenu non fiable. Si vous devez utiliser un modèle plus petit, verrouillez
    les outils et exécutez-le dans un bac à sable. Consultez [Sécurité](/fr/gateway/security).
  </Accordion>

  <Accordion title="J’ai exécuté /start dans Telegram mais je n’ai pas reçu de code d’association">
    Les codes d’association sont envoyés **uniquement** lorsqu’un expéditeur inconnu envoie un message au bot et que
    `dmPolicy: "pairing"` est activé. `/start` seul ne génère pas de code.

    Vérifiez les demandes en attente :

    ```bash
    openclaw pairing list telegram
    ```

    Si vous voulez un accès immédiat, ajoutez votre identifiant d’expéditeur à la liste d’autorisation ou définissez `dmPolicy: "open"`
    pour ce compte.

  </Accordion>

  <Accordion title="WhatsApp : va-t-il envoyer des messages à mes contacts ? Comment fonctionne le pairing ?">
    Non. La politique de messages privés par défaut de WhatsApp est le **pairing**. Les expéditeurs inconnus reçoivent seulement un code d’association et leur message n’est **pas traité**. OpenClaw répond seulement aux discussions qu’il reçoit ou aux envois explicites que vous déclenchez.

    Approuvez le pairing avec :

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Listez les demandes en attente :

    ```bash
    openclaw pairing list whatsapp
    ```

    Invite de numéro de téléphone de l’assistant de configuration : elle sert à définir votre **liste d’autorisation/propriétaire** afin que vos propres messages privés soient autorisés. Elle n’est pas utilisée pour l’envoi automatique. Si vous l’exécutez sur votre numéro WhatsApp personnel, utilisez ce numéro et activez `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Commandes de chat, abandon de tâches et « il ne s’arrête pas »

<AccordionGroup>
  <Accordion title="Comment empêcher les messages système internes d’apparaître dans le chat ?">
    La plupart des messages internes ou d’outils n’apparaissent que lorsque **verbose**, **trace** ou **reasoning** est activé
    pour cette session.

    Corrigez dans le chat où vous les voyez :

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Si cela reste bruyant, vérifiez les paramètres de session dans l’UI de contrôle et définissez verbose
    sur **inherit**. Confirmez aussi que vous n’utilisez pas un profil de bot avec `verboseDefault` défini
    sur `on` dans la configuration.

    Documentation : [Réflexion et verbose](/fr/tools/thinking), [Sécurité](/fr/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Comment arrêter/annuler une tâche en cours ?">
    Envoyez l’un de ces messages **comme message autonome** (sans slash) :

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Ce sont des déclencheurs d’abandon (pas des commandes slash).

    Pour les processus en arrière-plan (depuis l’outil exec), vous pouvez demander à l’agent d’exécuter :

    ```
    process action:kill sessionId:XXX
    ```

    Vue d’ensemble des commandes slash : consultez [Commandes slash](/fr/tools/slash-commands).

    La plupart des commandes doivent être envoyées comme un message **autonome** commençant par `/`, mais quelques raccourcis (comme `/status`) fonctionnent aussi en ligne pour les expéditeurs autorisés.

  </Accordion>

  <Accordion title='Comment envoyer un message Discord depuis Telegram ? (« Messagerie inter-contexte refusée »)'>
    OpenClaw bloque la messagerie **inter-fournisseurs** par défaut. Si un appel d’outil est lié
    à Telegram, il n’enverra pas à Discord sauf si vous l’autorisez explicitement.

    Activez la messagerie inter-fournisseurs pour l’agent :

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Redémarrez le gateway après avoir modifié la configuration.

  </Accordion>

  <Accordion title='Pourquoi ai-je l’impression que le bot « ignore » les messages envoyés en rafale ?'>
    Le mode de file d’attente contrôle la manière dont les nouveaux messages interagissent avec une exécution en cours. Utilisez `/queue` pour changer de mode :

    - `steer` - met en file d’attente tous les guidages en attente pour la prochaine frontière de modèle dans l’exécution actuelle
    - `queue` - guidage hérité un par un
    - `followup` - exécute les messages un par un
    - `collect` - regroupe les messages et répond une fois
    - `steer-backlog` - guide maintenant, puis traite l’arriéré
    - `interrupt` - abandonne l’exécution actuelle et recommence

    Le mode par défaut est `steer`. Vous pouvez ajouter des options comme `debounce:0.5s cap:25 drop:summarize` pour les modes de suivi. Consultez [File d’attente des commandes](/fr/concepts/queue) et [File d’attente de guidage](/fr/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Divers

<AccordionGroup>
  <Accordion title='Quel est le modèle par défaut pour Anthropic avec une clé API ?'>
    Dans OpenClaw, les identifiants et la sélection du modèle sont séparés. Définir `ANTHROPIC_API_KEY` (ou stocker une clé API Anthropic dans les profils d’authentification) active l’authentification, mais le modèle par défaut réel est celui que vous configurez dans `agents.defaults.model.primary` (par exemple, `anthropic/claude-sonnet-4-6` ou `anthropic/claude-opus-4-6`). Si vous voyez `No credentials found for profile "anthropic:default"`, cela signifie que le Gateway n’a pas pu trouver les identifiants Anthropic dans le fichier `auth-profiles.json` attendu pour l’agent en cours d’exécution.
  </Accordion>
</AccordionGroup>

---

Toujours bloqué ? Demandez de l’aide sur [Discord](https://discord.com/invite/clawd) ou ouvrez une [discussion GitHub](https://github.com/openclaw/openclaw/discussions).

## Associé

- [FAQ du premier lancement](/fr/help/faq-first-run) — installation, intégration, authentification, abonnements, premiers échecs
- [FAQ sur les modèles](/fr/help/faq-models) — sélection du modèle, basculement, profils d’authentification
- [Dépannage](/fr/help/troubleshooting) — triage par symptôme
