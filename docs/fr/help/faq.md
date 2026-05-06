---
read_when:
    - Réponses aux questions courantes de configuration, d’installation, d’onboarding ou de prise en charge à l’exécution
    - Triage des problèmes signalés par les utilisateurs avant un débogage plus approfondi
summary: Questions fréquentes sur l’installation, la configuration et l’utilisation d’OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-05-06T17:56:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d5724af921ab660da3d4453779f269bda440fb27518638541312e489f203318
    source_path: help/faq.md
    workflow: 16
---

Réponses rapides et dépannage plus approfondi pour les configurations réelles (développement local, VPS, multi-agent, OAuth/clés d’API, basculement de modèle). Pour les diagnostics d’exécution, consultez [Dépannage](/fr/gateway/troubleshooting). Pour la référence complète de configuration, consultez [Configuration](/fr/gateway/configuration).

## Les 60 premières secondes si quelque chose est cassé

1. **État rapide (première vérification)**

   ```bash
   openclaw status
   ```

   Résumé local rapide : OS + mise à jour, accessibilité du gateway/service, agents/sessions, configuration du fournisseur + problèmes d’exécution (quand le gateway est accessible).

2. **Rapport à coller (sûr à partager)**

   ```bash
   openclaw status --all
   ```

   Diagnostic en lecture seule avec fin des logs (jetons masqués).

3. **État du daemon + du port**

   ```bash
   openclaw gateway status
   ```

   Affiche l’exécution du superviseur par rapport à l’accessibilité RPC, l’URL cible de la sonde, et la configuration que le service a probablement utilisée.

4. **Sondes approfondies**

   ```bash
   openclaw status --deep
   ```

   Exécute une sonde de santé Gateway en direct, y compris les sondes de canal lorsqu’elles sont prises en charge
   (nécessite un Gateway accessible). Voir [Santé](/fr/gateway/health).

5. **Suivre le dernier log**

   ```bash
   openclaw logs --follow
   ```

   Si RPC est indisponible, utilisez plutôt :

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Les logs de fichiers sont séparés des logs de service ; voir [Journalisation](/fr/logging) et [Dépannage](/fr/gateway/troubleshooting).

6. **Exécuter le doctor (réparations)**

   ```bash
   openclaw doctor
   ```

   Répare/migre la configuration/l’état + exécute des contrôles de santé. Voir [Doctor](/fr/gateway/doctor).

7. **Instantané Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Demande au Gateway en cours d’exécution un instantané complet (WS uniquement). Voir [Santé](/fr/gateway/health).

## Démarrage rapide et configuration initiale

La FAQ de première exécution — installation, intégration, routes d’authentification, abonnements, échecs initiaux —
se trouve dans la [FAQ de première exécution](/fr/help/faq-first-run).

## Qu’est-ce qu’OpenClaw ?

<AccordionGroup>
  <Accordion title="Qu’est-ce qu’OpenClaw, en un paragraphe ?">
    OpenClaw est un assistant IA personnel que vous exécutez sur vos propres appareils. Il répond sur les surfaces de messagerie que vous utilisez déjà (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, et des plugins de canaux intégrés comme QQ Bot) et peut aussi gérer la voix + un Canvas en direct sur les plateformes prises en charge. Le **Gateway** est le plan de contrôle toujours actif ; l’assistant est le produit.
  </Accordion>

  <Accordion title="Proposition de valeur">
    OpenClaw n’est pas « juste un wrapper Claude ». C’est un **plan de contrôle axé local** qui vous permet d’exécuter un
    assistant performant sur **votre propre matériel**, accessible depuis les applications de chat que vous utilisez déjà, avec
    des sessions avec état, de la mémoire et des outils, sans confier le contrôle de vos workflows à un
    SaaS hébergé.

    Points forts :

    - **Vos appareils, vos données :** exécutez le Gateway où vous voulez (Mac, Linux, VPS) et gardez
      l’espace de travail + l’historique des sessions en local.
    - **De vrais canaux, pas un bac à sable web :** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      plus la voix mobile et Canvas sur les plateformes prises en charge.
    - **Indépendant du modèle :** utilisez Anthropic, OpenAI, MiniMax, OpenRouter, etc., avec un routage
      et un basculement par agent.
    - **Option locale uniquement :** exécutez des modèles locaux afin que **toutes les données puissent rester sur votre appareil** si vous le souhaitez.
    - **Routage multi-agent :** séparez les agents par canal, compte ou tâche, chacun avec son propre
      espace de travail et ses propres paramètres par défaut.
    - **Open source et modifiable :** inspectez, étendez et auto-hébergez sans verrouillage fournisseur.

    Docs : [Gateway](/fr/gateway), [Canaux](/fr/channels), [Multi-agent](/fr/concepts/multi-agent),
    [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Je viens de le configurer : que dois-je faire en premier ?">
    Bons premiers projets :

    - Créer un site web (WordPress, Shopify ou un simple site statique).
    - Prototyper une application mobile (plan, écrans, plan d’API).
    - Organiser des fichiers et dossiers (nettoyage, nommage, étiquetage).
    - Connecter Gmail et automatiser des résumés ou des suivis.

    Il peut gérer de grandes tâches, mais fonctionne mieux lorsque vous les découpez en phases et
    utilisez des sous-agents pour le travail en parallèle.

  </Accordion>

  <Accordion title="Quels sont les cinq principaux cas d’utilisation quotidiens d’OpenClaw ?">
    Les gains quotidiens ressemblent généralement à ceci :

    - **Briefings personnels :** résumés de la boîte de réception, du calendrier et des actualités qui vous intéressent.
    - **Recherche et rédaction :** recherche rapide, résumés et premières versions pour les e-mails ou les docs.
    - **Rappels et suivis :** relances et listes de contrôle pilotées par cron ou heartbeat.
    - **Automatisation du navigateur :** remplir des formulaires, collecter des données et répéter des tâches web.
    - **Coordination entre appareils :** envoyez une tâche depuis votre téléphone, laissez le Gateway l’exécuter sur un serveur, et récupérez le résultat dans le chat.

  </Accordion>

  <Accordion title="OpenClaw peut-il aider avec la génération de leads, la prospection, les publicités et les blogs pour un SaaS ?">
    Oui pour **la recherche, la qualification et la rédaction**. Il peut analyser des sites, créer des listes restreintes,
    résumer des prospects et rédiger des brouillons de messages de prospection ou de publicités.

    Pour **les campagnes de prospection ou publicitaires**, gardez un humain dans la boucle. Évitez le spam, respectez les lois locales et
    les politiques des plateformes, et relisez tout avant l’envoi. Le modèle le plus sûr consiste à laisser
    OpenClaw rédiger et à approuver vous-même.

    Docs : [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Quels sont les avantages par rapport à Claude Code pour le développement web ?">
    OpenClaw est un **assistant personnel** et une couche de coordination, pas un remplacement d’IDE. Utilisez
    Claude Code ou Codex pour la boucle de codage directe la plus rapide dans un dépôt. Utilisez OpenClaw lorsque vous
    voulez une mémoire durable, un accès multi-appareils et une orchestration d’outils.

    Avantages :

    - **Mémoire + espace de travail persistants** entre les sessions
    - **Accès multiplateforme** (WhatsApp, Telegram, TUI, WebChat)
    - **Orchestration d’outils** (navigateur, fichiers, planification, hooks)
    - **Gateway toujours actif** (exécution sur un VPS, interaction depuis n’importe où)
    - **Nodes** pour navigateur/écran/caméra/exec locaux

    Showcase : [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills et automatisation

<AccordionGroup>
  <Accordion title="Comment personnaliser les skills sans garder le dépôt modifié ?">
    Utilisez des surcharges gérées au lieu de modifier la copie du dépôt. Placez vos changements dans `~/.openclaw/skills/<name>/SKILL.md` (ou ajoutez un dossier via `skills.load.extraDirs` dans `~/.openclaw/openclaw.json`). La précédence est `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → intégré → `skills.load.extraDirs`, donc les surcharges gérées l’emportent toujours sur les skills intégrés sans toucher à git. Si vous avez besoin que le skill soit installé globalement mais visible seulement pour certains agents, gardez la copie partagée dans `~/.openclaw/skills` et contrôlez la visibilité avec `agents.defaults.skills` et `agents.list[].skills`. Seules les modifications dignes d’être envoyées en amont doivent vivre dans le dépôt et partir sous forme de PR.
  </Accordion>

  <Accordion title="Puis-je charger des skills depuis un dossier personnalisé ?">
    Oui. Ajoutez des répertoires supplémentaires via `skills.load.extraDirs` dans `~/.openclaw/openclaw.json` (précédence la plus basse). La précédence par défaut est `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → intégré → `skills.load.extraDirs`. `clawhub` installe dans `./skills` par défaut, qu’OpenClaw traite comme `<workspace>/skills` à la session suivante. Si le skill ne doit être visible que par certains agents, associez cela à `agents.defaults.skills` ou `agents.list[].skills`.
  </Accordion>

  <Accordion title="Comment utiliser différents modèles pour différentes tâches ?">
    Aujourd’hui, les modèles pris en charge sont :

    - **Tâches cron** : les tâches isolées peuvent définir une surcharge `model` par tâche.
    - **Sous-agents** : routez les tâches vers des agents séparés avec différents modèles par défaut.
    - **Changement à la demande** : utilisez `/model` pour changer le modèle de la session actuelle à tout moment.

    Voir [Tâches cron](/fr/automation/cron-jobs), [Routage multi-agent](/fr/concepts/multi-agent), et [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Le bot se fige pendant un travail lourd. Comment le décharger ?">
    Utilisez des **sous-agents** pour les tâches longues ou parallèles. Les sous-agents s’exécutent dans leur propre session,
    renvoient un résumé et gardent votre chat principal réactif.

    Demandez à votre bot de « générer un sous-agent pour cette tâche » ou utilisez `/subagents`.
    Utilisez `/status` dans le chat pour voir ce que fait le Gateway en ce moment (et s’il est occupé).

    Astuce jetons : les tâches longues et les sous-agents consomment tous deux des jetons. Si le coût est un sujet, définissez un
    modèle moins cher pour les sous-agents via `agents.defaults.subagents.model`.

    Docs : [Sous-agents](/fr/tools/subagents), [Tâches en arrière-plan](/fr/automation/tasks).

  </Accordion>

  <Accordion title="Comment fonctionnent les sessions de sous-agent liées à un fil sur Discord ?">
    Utilisez les liaisons de fils. Vous pouvez lier un fil Discord à un sous-agent ou à une cible de session afin que les messages de suivi dans ce fil restent sur cette session liée.

    Flux de base :

    - Générez avec `sessions_spawn` en utilisant `thread: true` (et éventuellement `mode: "session"` pour un suivi persistant).
    - Ou liez manuellement avec `/focus <target>`.
    - Utilisez `/agents` pour inspecter l’état de la liaison.
    - Utilisez `/session idle <duration|off>` et `/session max-age <duration|off>` pour contrôler l’auto-unfocus.
    - Utilisez `/unfocus` pour détacher le fil.

    Configuration requise :

    - Valeurs par défaut globales : `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Surcharges Discord : `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Liaison automatique à la génération : `channels.discord.threadBindings.spawnSessions` vaut `true` par défaut ; définissez-le sur `false` pour désactiver les générations de sessions liées à un fil.

    Docs : [Sous-agents](/fr/tools/subagents), [Discord](/fr/channels/discord), [Référence de configuration](/fr/gateway/configuration-reference), [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Un sous-agent a terminé, mais la mise à jour de fin est partie au mauvais endroit ou n’a jamais été publiée. Que dois-je vérifier ?">
    Vérifiez d’abord la route du demandeur résolue :

    - La livraison de sous-agent en mode achèvement privilégie tout fil lié ou route de conversation lorsqu’il en existe une.
    - Si l’origine de l’achèvement ne porte qu’un canal, OpenClaw se rabat sur la route enregistrée de la session demandeuse (`lastChannel` / `lastTo` / `lastAccountId`) afin que la livraison directe puisse quand même réussir.
    - Si ni une route liée ni une route enregistrée utilisable n’existe, la livraison directe peut échouer et le résultat se rabat sur la livraison de session en file d’attente au lieu d’être publié immédiatement dans le chat.
    - Les cibles invalides ou obsolètes peuvent encore forcer un repli vers la file d’attente ou un échec de livraison final.
    - Si la dernière réponse assistant visible de l’enfant est le jeton silencieux exact `NO_REPLY` / `no_reply`, ou exactement `ANNOUNCE_SKIP`, OpenClaw supprime intentionnellement l’annonce au lieu de publier une progression antérieure obsolète.
    - Si l’enfant a expiré après seulement des appels d’outils, l’annonce peut condenser cela en un court résumé de progression partielle au lieu de rejouer la sortie brute des outils.

    Débogage :

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs : [Sous-agents](/fr/tools/subagents), [Tâches en arrière-plan](/fr/automation/tasks), [Outils de session](/fr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron ou les rappels ne se déclenchent pas. Que dois-je vérifier ?">
    Cron s’exécute dans le processus Gateway. Si le Gateway ne fonctionne pas en continu,
    les tâches planifiées ne s’exécuteront pas.

    Liste de contrôle :

    - Confirmez que cron est activé (`cron.enabled`) et que `OPENCLAW_SKIP_CRON` n’est pas défini.
    - Vérifiez que le Gateway fonctionne 24/7 (pas de mise en veille/redémarrages).
    - Vérifiez les paramètres de fuseau horaire de la tâche (`--tz` par rapport au fuseau horaire de l’hôte).

    Débogage :

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs : [Tâches cron](/fr/automation/cron-jobs), [Automatisation et tâches](/fr/automation).

  </Accordion>

  <Accordion title="Cron s’est déclenché, mais rien n’a été envoyé au canal. Pourquoi ?">
    Vérifiez d’abord le mode de livraison :

    - `--no-deliver` / `delivery.mode: "none"` signifie qu’aucun envoi de secours par le runner n’est attendu.
    - Une cible d’annonce manquante ou non valide (`channel` / `to`) signifie que le runner a ignoré la livraison sortante.
    - Les échecs d’authentification du canal (`unauthorized`, `Forbidden`) signifient que le runner a essayé de livrer, mais que les identifiants l’ont bloqué.
    - Un résultat isolé silencieux (`NO_REPLY` / `no_reply` uniquement) est traité comme intentionnellement non livrable ; le runner supprime donc aussi la livraison de secours mise en file d’attente.

    Pour les tâches Cron isolées, l’agent peut toujours envoyer directement avec l’outil `message`
    lorsqu’une route de chat est disponible. `--announce` ne contrôle que le chemin de secours
    du runner pour le texte final que l’agent n’a pas déjà envoyé.

    Débogage :

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs : [Tâches Cron](/fr/automation/cron-jobs), [Tâches en arrière-plan](/fr/automation/tasks).

  </Accordion>

  <Accordion title="Pourquoi une exécution Cron isolée a-t-elle changé de modèle ou réessayé une fois ?">
    Il s’agit généralement du chemin de changement de modèle en direct, et non d’une planification en double.

    Cron isolé peut persister un transfert de modèle au runtime et réessayer lorsque l’exécution
    active lance `LiveSessionModelSwitchError`. La nouvelle tentative conserve le fournisseur/modèle
    choisi, et si le changement incluait un nouveau remplacement de profil d’authentification, Cron
    le persiste aussi avant de réessayer.

    Règles de sélection associées :

    - Le remplacement de modèle du hook Gmail est prioritaire lorsqu’il s’applique.
    - Puis `model` par tâche.
    - Puis tout remplacement de modèle stocké pour la session Cron.
    - Puis la sélection normale du modèle agent/par défaut.

    La boucle de nouvelle tentative est bornée. Après la tentative initiale plus 2 nouvelles tentatives de changement,
    Cron abandonne au lieu de boucler indéfiniment.

    Débogage :

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs : [Tâches Cron](/fr/automation/cron-jobs), [CLI Cron](/fr/cli/cron).

  </Accordion>

  <Accordion title="Comment installer des Skills sur Linux ?">
    Utilisez les commandes natives `openclaw skills` ou déposez les Skills dans votre espace de travail. L’interface Skills de macOS n’est pas disponible sur Linux.
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

    La commande native `openclaw skills install` écrit dans le répertoire `skills/`
    de l’espace de travail actif. Installez le CLI `clawhub` séparé seulement si vous voulez publier ou
    synchroniser vos propres Skills. Pour des installations partagées entre agents, placez le Skill sous
    `~/.openclaw/skills` et utilisez `agents.defaults.skills` ou
    `agents.list[].skills` si vous voulez limiter les agents qui peuvent le voir.

  </Accordion>

  <Accordion title="OpenClaw peut-il exécuter des tâches selon un planning ou en continu en arrière-plan ?">
    Oui. Utilisez le planificateur du Gateway :

    - **Tâches Cron** pour les tâches planifiées ou récurrentes (persistantes après les redémarrages).
    - **Heartbeat** pour les vérifications périodiques de la « session principale ».
    - **Tâches isolées** pour les agents autonomes qui publient des résumés ou livrent dans les chats.

    Docs : [Tâches Cron](/fr/automation/cron-jobs), [Automatisation et tâches](/fr/automation),
    [Heartbeat](/fr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Puis-je exécuter des Skills réservés à Apple macOS depuis Linux ?">
    Pas directement. Les Skills macOS sont limités par `metadata.openclaw.os` ainsi que par les binaires requis, et les Skills n’apparaissent dans le prompt système que lorsqu’ils sont éligibles sur l’**hôte Gateway**. Sur Linux, les Skills réservés à `darwin` (comme `apple-notes`, `apple-reminders`, `things-mac`) ne se chargeront pas sauf si vous remplacez ce filtrage.

    Trois modèles sont pris en charge :

    **Option A - exécuter le Gateway sur un Mac (le plus simple).**
    Exécutez le Gateway là où les binaires macOS existent, puis connectez-vous depuis Linux en [mode distant](#gateway-ports-already-running-and-remote-mode) ou via Tailscale. Les Skills se chargent normalement, car l’hôte Gateway est macOS.

    **Option B - utiliser un Node macOS (sans SSH).**
    Exécutez le Gateway sur Linux, associez un Node macOS (application de barre de menus), puis définissez **Node Run Commands** sur « Toujours demander » ou « Toujours autoriser » sur le Mac. OpenClaw peut traiter les Skills réservés à macOS comme éligibles lorsque les binaires requis existent sur le Node. L’agent exécute ces Skills via l’outil `nodes`. Si vous choisissez « Toujours demander », approuver « Toujours autoriser » dans le prompt ajoute cette commande à la liste d’autorisation.

    **Option C - mandater les binaires macOS via SSH (avancé).**
    Gardez le Gateway sur Linux, mais faites en sorte que les binaires CLI requis se résolvent vers des wrappers SSH qui s’exécutent sur un Mac. Remplacez ensuite le Skill pour autoriser Linux afin qu’il reste éligible.

    1. Créez un wrapper SSH pour le binaire (exemple : `memo` pour Apple Notes) :

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Placez le wrapper dans `PATH` sur l’hôte Linux (par exemple `~/bin/memo`).
    3. Remplacez les métadonnées du Skill (espace de travail ou `~/.openclaw/skills`) pour autoriser Linux :

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Démarrez une nouvelle session afin d’actualiser l’instantané des Skills.

  </Accordion>

  <Accordion title="Avez-vous une intégration Notion ou HeyGen ?">
    Pas intégrée aujourd’hui.

    Options :

    - **Skill / Plugin personnalisé :** idéal pour un accès fiable à l’API (Notion et HeyGen ont tous deux des API).
    - **Automatisation de navigateur :** fonctionne sans code, mais est plus lente et plus fragile.

    Si vous voulez conserver le contexte par client (workflows d’agence), un modèle simple consiste à utiliser :

    - Une page Notion par client (contexte + préférences + travail actif).
    - Demandez à l’agent de récupérer cette page au début d’une session.

    Si vous voulez une intégration native, ouvrez une demande de fonctionnalité ou créez un Skill
    ciblant ces API.

    Installer des Skills :

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Les installations natives arrivent dans le répertoire `skills/` de l’espace de travail actif. Pour des Skills partagés entre agents, placez-les dans `~/.openclaw/skills/<name>/SKILL.md`. Si seuls certains agents doivent voir une installation partagée, configurez `agents.defaults.skills` ou `agents.list[].skills`. Certains Skills attendent des binaires installés via Homebrew ; sur Linux, cela signifie Linuxbrew (voir l’entrée de FAQ Homebrew Linux ci-dessus). Voir [Skills](/fr/tools/skills), [configuration des Skills](/fr/tools/skills-config) et [ClawHub](/fr/tools/clawhub).

  </Accordion>

  <Accordion title="Comment utiliser mon Chrome déjà connecté avec OpenClaw ?">
    Utilisez le profil de navigateur `user` intégré, qui se rattache via Chrome DevTools MCP :

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

    - les actions sont pilotées par `ref`, pas par sélecteur CSS
    - les téléversements nécessitent `ref` / `inputRef` et prennent actuellement en charge un seul fichier à la fois
    - `responsebody`, l’export PDF, l’interception des téléchargements et les actions par lot nécessitent encore un navigateur géré ou un profil CDP brut

  </Accordion>
</AccordionGroup>

## Bac à sable et mémoire

<AccordionGroup>
  <Accordion title="Existe-t-il une doc dédiée au bac à sable ?">
    Oui. Voir [Bac à sable](/fr/gateway/sandboxing). Pour la configuration propre à Docker (Gateway complet dans Docker ou images de bac à sable), voir [Docker](/fr/install/docker).
  </Accordion>

  <Accordion title="Docker semble limité - comment activer toutes les fonctionnalités ?">
    L’image par défaut privilégie la sécurité et s’exécute en tant qu’utilisateur `node` ; elle n’inclut donc pas
    les paquets système, Homebrew ni les navigateurs intégrés. Pour une configuration plus complète :

    - Persistez `/home/node` avec `OPENCLAW_HOME_VOLUME` afin que les caches survivent.
    - Intégrez les dépendances système dans l’image avec `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Installez les navigateurs Playwright via le CLI intégré :
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Définissez `PLAYWRIGHT_BROWSERS_PATH` et assurez-vous que le chemin est persisté.

    Docs : [Docker](/fr/install/docker), [Navigateur](/fr/tools/browser).

  </Accordion>

  <Accordion title="Puis-je garder les DM personnels, mais rendre les groupes publics/en bac à sable avec un seul agent ?">
    Oui - si votre trafic privé correspond aux **DM** et votre trafic public aux **groupes**.

    Utilisez `agents.defaults.sandbox.mode: "non-main"` afin que les sessions de groupe/canal (clés non principales) s’exécutent dans le backend de bac à sable configuré, tandis que la session DM principale reste sur l’hôte. Docker est le backend par défaut si vous n’en choisissez pas. Limitez ensuite les outils disponibles dans les sessions en bac à sable via `tools.sandbox.tools`.

    Guide de configuration + exemple : [Groupes : DM personnels + groupes publics](/fr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Référence de configuration clé : [Configuration du Gateway](/fr/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Comment lier un dossier hôte dans le bac à sable ?">
    Définissez `agents.defaults.sandbox.docker.binds` sur `["host:path:mode"]` (par ex. `"/home/user/src:/src:ro"`). Les liaisons globales et par agent sont fusionnées ; les liaisons par agent sont ignorées lorsque `scope: "shared"`. Utilisez `:ro` pour tout ce qui est sensible et rappelez-vous que les liaisons contournent les limites du système de fichiers du bac à sable.

    OpenClaw valide les sources de liaison à la fois par rapport au chemin normalisé et au chemin canonique résolu via l’ancêtre existant le plus profond. Cela signifie que les échappements par parent symlink échouent toujours de manière fermée même lorsque le dernier segment du chemin n’existe pas encore, et les vérifications de racine autorisée s’appliquent toujours après la résolution des symlinks.

    Voir [Bac à sable](/fr/gateway/sandboxing#custom-bind-mounts) et [Bac à sable vs politique d’outil vs élévation](/fr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) pour des exemples et des notes de sécurité.

  </Accordion>

  <Accordion title="Comment fonctionne la mémoire ?">
    La mémoire OpenClaw est simplement constituée de fichiers Markdown dans l’espace de travail de l’agent :

    - Notes quotidiennes dans `memory/YYYY-MM-DD.md`
    - Notes long terme organisées dans `MEMORY.md` (sessions principales/privées uniquement)

    OpenClaw exécute aussi un **flush mémoire pré-Compaction silencieux** pour rappeler au modèle
    d’écrire des notes durables avant l’auto-Compaction. Cela ne s’exécute que lorsque l’espace de travail
    est accessible en écriture (les bacs à sable en lecture seule l’ignorent). Voir [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="La mémoire oublie sans cesse des choses. Comment les faire persister ?">
    Demandez au bot d’**écrire le fait en mémoire**. Les notes long terme vont dans `MEMORY.md`,
    le contexte court terme va dans `memory/YYYY-MM-DD.md`.

    C’est encore un domaine que nous améliorons. Il est utile de rappeler au modèle de stocker les souvenirs ;
    il saura quoi faire. S’il continue d’oublier, vérifiez que le Gateway utilise le même
    espace de travail à chaque exécution.

    Docs : [Mémoire](/fr/concepts/memory), [Espace de travail de l’agent](/fr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La mémoire persiste-t-elle indéfiniment ? Quelles sont les limites ?">
    Les fichiers de mémoire vivent sur disque et persistent jusqu’à ce que vous les supprimiez. La limite est votre
    stockage, pas le modèle. Le **contexte de session** reste limité par la fenêtre de contexte
    du modèle ; les longues conversations peuvent donc être compactées ou tronquées. C’est pourquoi
    la recherche mémoire existe : elle ne réinjecte dans le contexte que les parties pertinentes.

    Docs : [Mémoire](/fr/concepts/memory), [Contexte](/fr/concepts/context).

  </Accordion>

  <Accordion title="La recherche sémantique en mémoire nécessite-t-elle une clé d’API OpenAI ?">
    Seulement si vous utilisez des **embeddings OpenAI**. Codex OAuth couvre le chat/les complétions et
    n’accorde **pas** l’accès aux embeddings ; donc **se connecter avec Codex (OAuth ou la
    connexion CLI Codex)** n’aide pas pour la recherche sémantique en mémoire. Les embeddings OpenAI
    nécessitent toujours une vraie clé d’API (`OPENAI_API_KEY` ou `models.providers.openai.apiKey`).

    Si vous ne définissez pas explicitement de fournisseur, OpenClaw sélectionne automatiquement un fournisseur lorsqu’il
    peut résoudre une clé d’API (profils d’authentification, `models.providers.*.apiKey` ou variables d’environnement).
    Il préfère OpenAI si une clé OpenAI est résolue, sinon Gemini si une clé Gemini
    est résolue, puis Voyage, puis Mistral. Si aucune clé distante n’est disponible, la recherche
    en mémoire reste désactivée jusqu’à ce que vous la configuriez. Si vous avez un chemin de modèle local
    configuré et présent, OpenClaw
    préfère `local`. Ollama est pris en charge lorsque vous définissez explicitement
    `memorySearch.provider = "ollama"`.

    Si vous préférez rester en local, définissez `memorySearch.provider = "local"` (et éventuellement
    `memorySearch.fallback = "none"`). Si vous voulez utiliser les embeddings Gemini, définissez
    `memorySearch.provider = "gemini"` et fournissez `GEMINI_API_KEY` (ou
    `memorySearch.remote.apiKey`). Nous prenons en charge les modèles d’embedding **OpenAI, Gemini, Voyage, Mistral, Ollama ou locaux** -
    consultez [Mémoire](/fr/concepts/memory) pour les détails de configuration.

  </Accordion>
</AccordionGroup>

## Où se trouvent les éléments sur le disque

<AccordionGroup>
  <Accordion title="Toutes les données utilisées avec OpenClaw sont-elles enregistrées localement ?">
    Non - **l’état d’OpenClaw est local**, mais **les services externes voient toujours ce que vous leur envoyez**.

    - **Local par défaut :** les sessions, fichiers de mémoire, la configuration et l’espace de travail résident sur l’hôte du Gateway
      (`~/.openclaw` + votre répertoire d’espace de travail).
    - **Distant par nécessité :** les messages que vous envoyez aux fournisseurs de modèles (Anthropic/OpenAI/etc.) sont transmis à
      leurs API, et les plateformes de chat (WhatsApp/Telegram/Slack/etc.) stockent les données de message sur leurs
      serveurs.
    - **Vous contrôlez l’empreinte :** utiliser des modèles locaux garde les prompts sur votre machine, mais le trafic des canaux
      passe toujours par les serveurs du canal.

    Voir aussi : [Espace de travail de l’agent](/fr/concepts/agent-workspace), [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Où OpenClaw stocke-t-il ses données ?">
    Tout se trouve sous `$OPENCLAW_STATE_DIR` (par défaut : `~/.openclaw`) :

    | Chemin                                                          | Objectif                                                           |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuration principale (JSON5)                                   |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Import OAuth hérité (copié dans les profils d’authentification à la première utilisation) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profils d’authentification (OAuth, clés d’API et `keyRef`/`tokenRef` facultatifs) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Charge utile secrète facultative basée sur fichier pour les fournisseurs SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Fichier de compatibilité hérité (entrées `api_key` statiques nettoyées) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | État des fournisseurs (par ex. `whatsapp/<accountId>/creds.json`)  |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | État par agent (agentDir + sessions)                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historique et état des conversations (par agent)                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Métadonnées de session (par agent)                                 |

    Chemin hérité à agent unique : `~/.openclaw/agent/*` (migré par `openclaw doctor`).

    Votre **espace de travail** (AGENTS.md, fichiers de mémoire, Skills, etc.) est séparé et configuré via `agents.defaults.workspace` (par défaut : `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Où doivent résider AGENTS.md / SOUL.md / USER.md / MEMORY.md ?">
    Ces fichiers résident dans l’**espace de travail de l’agent**, pas dans `~/.openclaw`.

    - **Espace de travail (par agent)** : `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` facultatif.
      La racine minuscule `memory.md` est uniquement une entrée de réparation héritée ; `openclaw doctor --fix`
      peut la fusionner dans `MEMORY.md` lorsque les deux fichiers existent.
    - **Répertoire d’état (`~/.openclaw`)** : configuration, état des canaux/fournisseurs, profils d’authentification, sessions, journaux,
      et Skills partagées (`~/.openclaw/skills`).

    L’espace de travail par défaut est `~/.openclaw/workspace`, configurable via :

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si le bot « oublie » après un redémarrage, confirmez que le Gateway utilise le même
    espace de travail à chaque lancement (et rappelez-vous : le mode distant utilise l’espace de travail de
    l’**hôte gateway**, pas celui de votre ordinateur portable local).

    Astuce : si vous voulez un comportement ou une préférence durable, demandez au bot de **l’écrire dans
    AGENTS.md ou MEMORY.md** plutôt que de vous fier à l’historique de chat.

    Consultez [Espace de travail de l’agent](/fr/concepts/agent-workspace) et [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Stratégie de sauvegarde recommandée">
    Placez votre **espace de travail d’agent** dans un dépôt git **privé** et sauvegardez-le dans un emplacement
    privé (par exemple GitHub privé). Cela capture les fichiers mémoire + AGENTS/SOUL/USER
    et vous permet de restaurer « l’esprit » de l’assistant plus tard.

    Ne validez **rien** sous `~/.openclaw` (identifiants, sessions, jetons ou charges utiles de secrets chiffrés).
    Si vous avez besoin d’une restauration complète, sauvegardez l’espace de travail et le répertoire d’état
    séparément (voir la question sur la migration ci-dessus).

    Documentation : [Espace de travail de l’agent](/fr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Comment désinstaller complètement OpenClaw ?">
    Consultez le guide dédié : [Désinstaller](/fr/install/uninstall).
  </Accordion>

  <Accordion title="Les agents peuvent-ils fonctionner en dehors de l’espace de travail ?">
    Oui. L’espace de travail est le **cwd par défaut** et l’ancre mémoire, pas un bac à sable strict.
    Les chemins relatifs se résolvent dans l’espace de travail, mais les chemins absolus peuvent accéder à d’autres
    emplacements hôtes sauf si le sandboxing est activé. Si vous avez besoin d’isolation, utilisez
    [`agents.defaults.sandbox`](/fr/gateway/sandboxing) ou les paramètres de sandbox par agent. Si vous
    voulez qu’un dépôt soit le répertoire de travail par défaut, faites pointer le
    `workspace` de cet agent vers la racine du dépôt. Le dépôt OpenClaw n’est que du code source ; gardez
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
    L’état de session appartient à l’**hôte gateway**. Si vous êtes en mode distant, le magasin de sessions qui vous concerne se trouve sur la machine distante, pas sur votre ordinateur portable local. Consultez [Gestion des sessions](/fr/concepts/session).
  </Accordion>
</AccordionGroup>

## Bases de la configuration

<AccordionGroup>
  <Accordion title="Quel est le format de la configuration ? Où se trouve-t-elle ?">
    OpenClaw lit une configuration **JSON5** facultative depuis `$OPENCLAW_CONFIG_PATH` (par défaut : `~/.openclaw/openclaw.json`) :

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Si le fichier est absent, il utilise des valeurs par défaut relativement sûres (notamment un espace de travail par défaut de `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='J’ai défini gateway.bind: "lan" (ou "tailnet") et maintenant rien n’écoute / l’interface utilisateur indique non autorisé'>
    Les liaisons non-loopback **nécessitent un chemin d’authentification gateway valide**. En pratique, cela signifie :

    - authentification par secret partagé : jeton ou mot de passe
    - `gateway.auth.mode: "trusted-proxy"` derrière un proxy inverse correctement configuré et sensible à l’identité

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

    Notes :

    - `gateway.remote.token` / `.password` n’activent **pas** à eux seuls l’authentification du gateway local.
    - Les chemins d’appel locaux peuvent utiliser `gateway.remote.*` comme solution de repli uniquement lorsque `gateway.auth.*` n’est pas défini.
    - Pour l’authentification par mot de passe, définissez plutôt `gateway.auth.mode: "password"` plus `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue fermée (aucun masquage par repli distant).
    - Les configurations d’interface de contrôle à secret partagé s’authentifient via `connect.params.auth.token` ou `connect.params.auth.password` (stockés dans les paramètres de l’application/l’interface utilisateur). Les modes porteurs d’identité comme Tailscale Serve ou `trusted-proxy` utilisent plutôt les en-têtes de requête. Évitez de placer des secrets partagés dans les URL.
    - Avec `gateway.auth.mode: "trusted-proxy"`, les proxies inverses local loopback sur le même hôte nécessitent explicitement `gateway.auth.trustedProxy.allowLoopback = true` et une entrée loopback dans `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Pourquoi ai-je maintenant besoin d’un jeton sur localhost ?">
    OpenClaw applique par défaut l’authentification du gateway, y compris sur loopback. Dans le chemin par défaut normal, cela signifie l’authentification par jeton : si aucun chemin d’authentification explicite n’est configuré, le démarrage du gateway se résout en mode jeton et génère un jeton uniquement pour cette exécution, donc **les clients WS locaux doivent s’authentifier**. Configurez explicitement `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` ou `OPENCLAW_GATEWAY_PASSWORD` lorsque les clients ont besoin d’un secret stable entre les redémarrages. Cela empêche d’autres processus locaux d’appeler le Gateway.

    Si vous préférez un autre chemin d’authentification, vous pouvez choisir explicitement le mode mot de passe (ou, pour les proxies inverses sensibles à l’identité, `trusted-proxy`). Si vous voulez **vraiment** un loopback ouvert, définissez explicitement `gateway.auth.mode: "none"` dans votre configuration. Doctor peut générer un jeton pour vous à tout moment : `openclaw doctor --generate-gateway-token`.

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
    - `random` : slogans amusants/saisonniers tournants (comportement par défaut).
    - Si vous ne voulez aucune bannière, définissez la variable d’environnement `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Comment activer la recherche web (et la récupération web) ?">
    `web_fetch` fonctionne sans clé d’API. `web_search` dépend du
    fournisseur sélectionné :

    - Les fournisseurs adossés à une API tels que Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity et Tavily nécessitent leur configuration normale de clé d’API.
    - Ollama Web Search est sans clé, mais utilise votre hôte Ollama configuré et nécessite `ollama signin`.
    - DuckDuckGo est sans clé, mais c’est une intégration non officielle basée sur HTML.
    - SearXNG est sans clé/auto-hébergé ; configurez `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recommandé :** exécutez `openclaw configure --section web` et choisissez un fournisseur.
    Alternatives d’environnement :

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

    La configuration de recherche web propre à chaque fournisseur se trouve maintenant sous `plugins.entries.<plugin>.config.webSearch.*`.
    Les anciens chemins de fournisseur `tools.web.search.*` sont encore chargés temporairement pour compatibilité, mais ils ne doivent pas être utilisés pour les nouvelles configurations.
    La configuration de repli de récupération web Firecrawl se trouve sous `plugins.entries.firecrawl.config.webFetch.*`.

    Notes :

    - Si vous utilisez des listes d’autorisation, ajoutez `web_search`/`web_fetch`/`x_search` ou `group:web`.
    - `web_fetch` est activé par défaut (sauf désactivation explicite).
    - Si `tools.web.fetch.provider` est omis, OpenClaw détecte automatiquement le premier fournisseur de repli de récupération prêt à partir des identifiants disponibles. Aujourd’hui, le fournisseur intégré est Firecrawl.
    - Les daemons lisent les variables d’environnement depuis `~/.openclaw/.env` (ou l’environnement du service).

    Docs : [Outils web](/fr/tools/web).

  </Accordion>

  <Accordion title="config.apply a effacé ma configuration. Comment la récupérer et éviter cela ?">
    `config.apply` remplace la **configuration entière**. Si vous envoyez un objet partiel, tout
    le reste est supprimé.

    La version actuelle d’OpenClaw protège contre de nombreux écrasements accidentels :

    - Les écritures de configuration détenues par OpenClaw valident toute la configuration après modification avant l’écriture.
    - Les écritures invalides ou destructrices détenues par OpenClaw sont rejetées et enregistrées sous `openclaw.json.rejected.*`.
    - Si une modification directe casse le démarrage ou le rechargement à chaud, le Gateway échoue en mode fermé ou ignore le rechargement ; il ne réécrit pas `openclaw.json`.
    - `openclaw doctor --fix` détient la réparation et peut restaurer la dernière configuration valide connue tout en enregistrant le fichier rejeté sous `openclaw.json.clobbered.*`.

    Récupérer :

    - Consultez `openclaw logs --follow` pour `Invalid config at`, `Config write rejected:` ou `config reload skipped (invalid config)`.
    - Inspectez le plus récent `openclaw.json.clobbered.*` ou `openclaw.json.rejected.*` à côté de la configuration active.
    - Exécutez `openclaw config validate` et `openclaw doctor --fix`.
    - Recopiez uniquement les clés voulues avec `openclaw config set` ou `config.patch`.
    - Si vous n’avez aucune dernière configuration valide connue ni charge utile rejetée, restaurez depuis une sauvegarde, ou relancez `openclaw doctor` puis reconfigurez les canaux/modèles.
    - Si cela était inattendu, signalez un bug et incluez votre dernière configuration connue ou toute sauvegarde.
    - Un agent de codage local peut souvent reconstruire une configuration fonctionnelle à partir des journaux ou de l’historique.

    L’éviter :

    - Utilisez `openclaw config set` pour les petites modifications.
    - Utilisez `openclaw configure` pour les modifications interactives.
    - Utilisez d’abord `config.schema.lookup` lorsque vous n’êtes pas sûr d’un chemin exact ou de la forme d’un champ ; il renvoie un nœud de schéma superficiel ainsi que des résumés des enfants immédiats pour l’exploration.
    - Utilisez `config.patch` pour les modifications RPC partielles ; réservez `config.apply` au remplacement complet de la configuration.
    - Si vous utilisez l’outil `gateway` réservé au propriétaire depuis une exécution d’agent, il rejettera toujours les écritures vers `tools.exec.ask` / `tools.exec.security` (y compris les anciens alias `tools.bash.*` qui se normalisent vers les mêmes chemins d’exécution protégés).

    Docs : [Configuration](/fr/cli/config), [Configurer](/fr/cli/configure), [Dépannage du Gateway](/fr/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/fr/gateway/doctor).

  </Accordion>

  <Accordion title="Comment exécuter un Gateway central avec des workers spécialisés sur plusieurs appareils ?">
    Le modèle courant est **un Gateway** (par exemple Raspberry Pi) plus **des nodes** et **des agents** :

    - **Gateway (central) :** détient les canaux (Signal/WhatsApp), le routage et les sessions.
    - **Nodes (appareils) :** les Macs/iOS/Android se connectent comme périphériques et exposent des outils locaux (`system.run`, `canvas`, `camera`).
    - **Agents (workers) :** cerveaux/espaces de travail séparés pour des rôles spéciaux (par exemple « ops Hetzner », « Données personnelles »).
    - **Sous-agents :** lancent du travail en arrière-plan depuis un agent principal lorsque vous voulez du parallélisme.
    - **TUI :** se connecte au Gateway et permet de changer d’agents/sessions.

    Docs : [Nodes](/fr/nodes), [Accès distant](/fr/gateway/remote), [Routage multi-agent](/fr/concepts/multi-agent), [Sous-agents](/fr/tools/subagents), [TUI](/fr/web/tui).

  </Accordion>

  <Accordion title="Le navigateur OpenClaw peut-il fonctionner en mode headless ?">
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

    La valeur par défaut est `false` (avec interface graphique). Le mode headless est plus susceptible de déclencher des contrôles anti-bot sur certains sites. Voir [Navigateur](/fr/tools/browser).

    Le mode headless utilise le **même moteur Chromium** et fonctionne pour la plupart des automatisations (formulaires, clics, scraping, connexions). Les principales différences :

    - Aucune fenêtre de navigateur visible (utilisez des captures d’écran si vous avez besoin de visuels).
    - Certains sites sont plus stricts concernant l’automatisation en mode headless (CAPTCHA, anti-bot).
      Par exemple, X/Twitter bloque souvent les sessions headless.

  </Accordion>

  <Accordion title="Comment utiliser Brave pour contrôler le navigateur ?">
    Définissez `browser.executablePath` sur votre binaire Brave (ou tout navigateur basé sur Chromium) et redémarrez le Gateway.
    Consultez les exemples de configuration complets dans [Navigateur](/fr/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways et nodes distants

<AccordionGroup>
  <Accordion title="Comment les commandes se propagent-elles entre Telegram, le gateway et les nodes ?">
    Les messages Telegram sont gérés par le **gateway**. Le gateway exécute l’agent puis
    appelle seulement ensuite les nodes via le **WebSocket du Gateway** lorsqu’un outil de node est nécessaire :

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Les nodes ne voient pas le trafic fournisseur entrant ; ils reçoivent uniquement des appels RPC de node.

  </Accordion>

  <Accordion title="Comment mon agent peut-il accéder à mon ordinateur si le Gateway est hébergé à distance ?">
    Réponse courte : **appariez votre ordinateur comme node**. Le Gateway s’exécute ailleurs, mais il peut
    appeler les outils `node.*` (écran, caméra, système) sur votre machine locale via le WebSocket du Gateway.

    Configuration typique :

    1. Exécutez le Gateway sur l’hôte toujours allumé (VPS/serveur domestique).
    2. Placez l’hôte du Gateway et votre ordinateur sur le même tailnet.
    3. Assurez-vous que le WS du Gateway est joignable (liaison tailnet ou tunnel SSH).
    4. Ouvrez l’app macOS localement et connectez-vous en mode **Distant via SSH** (ou tailnet direct)
       afin qu’elle puisse s’enregistrer comme node.
    5. Approuvez le node sur le Gateway :

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Aucun pont TCP séparé n’est requis ; les nodes se connectent via le WebSocket du Gateway.

    Rappel de sécurité : apparier un node macOS autorise `system.run` sur cette machine. Appariez uniquement
    des appareils de confiance, et consultez [Sécurité](/fr/gateway/security).

    Docs : [Nodes](/fr/nodes), [Protocole du Gateway](/fr/gateway/protocol), [mode distant macOS](/fr/platforms/mac/remote), [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale est connecté mais je ne reçois aucune réponse. Que faire maintenant ?">
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
    Oui. Il n’existe pas de pont « bot à bot » intégré, mais vous pouvez le mettre en place de quelques
    manières fiables :

    **Le plus simple :** utilisez un canal de discussion normal auquel les deux bots peuvent accéder (Telegram/Slack/WhatsApp).
    Faites envoyer un message par le Bot A au Bot B, puis laissez le Bot B répondre comme d’habitude.

    **Pont CLI (générique) :** exécutez un script qui appelle l’autre Gateway avec
    `openclaw agent --message ... --deliver`, en ciblant une discussion où l’autre bot
    écoute. Si un bot est sur un VPS distant, pointez votre CLI vers ce Gateway distant
    via SSH/Tailscale (voir [Accès distant](/fr/gateway/remote)).

    Exemple de modèle (à exécuter depuis une machine pouvant atteindre le Gateway cible) :

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Conseil : ajoutez une garde-fou pour que les deux bots ne bouclent pas indéfiniment (mention uniquement, listes
    d’autorisation de canaux, ou règle « ne pas répondre aux messages de bot »).

    Docs : [Accès distant](/fr/gateway/remote), [CLI d’agent](/fr/cli/agent), [Envoi par agent](/fr/tools/agent-send).

  </Accordion>

  <Accordion title="Ai-je besoin de VPS séparés pour plusieurs agents ?">
    Non. Un Gateway peut héberger plusieurs agents, chacun avec son propre espace de travail, ses valeurs par défaut de modèle
    et son routage. C’est la configuration normale, beaucoup moins chère et plus simple que d’exécuter
    un VPS par agent.

    Utilisez des VPS séparés uniquement lorsque vous avez besoin d’une isolation forte (frontières de sécurité) ou de configurations très
    différentes que vous ne voulez pas partager. Sinon, gardez un seul Gateway et
    utilisez plusieurs agents ou sous-agents.

  </Accordion>

  <Accordion title="Y a-t-il un avantage à utiliser un node sur mon ordinateur portable personnel plutôt que SSH depuis un VPS ?">
    Oui - les nodes sont la méthode de première classe pour atteindre votre ordinateur portable depuis un Gateway distant, et ils
    débloquent plus qu’un accès shell. Le Gateway s’exécute sur macOS/Linux (Windows via WSL2) et est
    léger (un petit VPS ou une machine de classe Raspberry Pi convient ; 4 Go de RAM suffisent largement), donc une configuration courante
    consiste à utiliser un hôte toujours allumé plus votre ordinateur portable comme node.

    - **Aucun SSH entrant requis.** Les nodes se connectent sortant au WebSocket du Gateway et utilisent l’appairage d’appareils.
    - **Contrôles d’exécution plus sûrs.** `system.run` est encadré par les listes d’autorisation/approbations du node sur cet ordinateur portable.
    - **Plus d’outils d’appareil.** Les nodes exposent `canvas`, `camera` et `screen` en plus de `system.run`.
    - **Automatisation locale du navigateur.** Gardez le Gateway sur un VPS, mais exécutez Chrome localement via un hôte de node sur l’ordinateur portable, ou attachez-vous au Chrome local sur l’hôte via Chrome MCP.

    SSH convient pour un accès shell ponctuel, mais les nodes sont plus simples pour les workflows d’agent continus et
    l’automatisation d’appareils.

    Docs : [Nodes](/fr/nodes), [CLI Nodes](/fr/cli/nodes), [Navigateur](/fr/tools/browser).

  </Accordion>

  <Accordion title="Les nodes exécutent-ils un service gateway ?">
    Non. Un seul **gateway** doit s’exécuter par hôte, sauf si vous exécutez intentionnellement des profils isolés (voir [Gateways multiples](/fr/gateway/multiple-gateways)). Les nodes sont des périphériques qui se connectent
    au gateway (nodes iOS/Android, ou « mode node » macOS dans l’app de barre de menus). Pour les hôtes de node
    headless et le contrôle CLI, voir [CLI d’hôte Node](/fr/cli/node).

    Un redémarrage complet est requis pour les modifications de `gateway`, `discovery` et `canvasHost`.

  </Accordion>

  <Accordion title="Existe-t-il une API / méthode RPC pour appliquer la configuration ?">
    Oui.

    - `config.schema.lookup` : inspecter un sous-arbre de configuration avec son nœud de schéma superficiel, l’indication d’interface correspondante et les résumés des enfants immédiats avant d’écrire
    - `config.get` : récupérer l’instantané actuel + le hachage
    - `config.patch` : mise à jour partielle sûre (préférée pour la plupart des modifications RPC) ; recharge à chaud quand c’est possible et redémarre quand c’est nécessaire
    - `config.apply` : valider + remplacer toute la configuration ; recharge à chaud quand c’est possible et redémarre quand c’est nécessaire
    - L’outil d’exécution `gateway` réservé au propriétaire refuse toujours de réécrire `tools.exec.ask` / `tools.exec.security` ; les anciens alias `tools.bash.*` sont normalisés vers les mêmes chemins exec protégés

  </Accordion>

  <Accordion title="Configuration saine minimale pour une première installation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Cela définit votre espace de travail et limite les personnes qui peuvent déclencher le bot.

  </Accordion>

  <Accordion title="Comment configurer Tailscale sur un VPS et me connecter depuis mon Mac ?">
    Étapes minimales :

    1. **Installer + se connecter sur le VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Installer + se connecter sur votre Mac**
       - Utilisez l’application Tailscale et connectez-vous au même tailnet.
    3. **Activer MagicDNS (recommandé)**
       - Dans la console d’administration Tailscale, activez MagicDNS afin que le VPS ait un nom stable.
    4. **Utiliser le nom d’hôte du tailnet**
       - SSH : `ssh user@your-vps.tailnet-xxxx.ts.net`
       - WS du Gateway : `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Si vous voulez l’interface de contrôle sans SSH, utilisez Tailscale Serve sur le VPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Cela garde le Gateway lié au loopback et expose HTTPS via Tailscale. Consultez [Tailscale](/fr/gateway/tailscale).

  </Accordion>

  <Accordion title="Comment connecter un nœud Mac à un Gateway distant (Tailscale Serve) ?">
    Serve expose l’**interface de contrôle du Gateway + WS**. Les nœuds se connectent via le même point de terminaison WS du Gateway.

    Configuration recommandée :

    1. **Assurez-vous que le VPS + le Mac sont sur le même tailnet**.
    2. **Utilisez l’application macOS en mode distant** (la cible SSH peut être le nom d’hôte du tailnet).
       L’application établira un tunnel vers le port du Gateway et se connectera comme nœud.
    3. **Approuvez le nœud** sur le Gateway :

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Docs : [protocole du Gateway](/fr/gateway/protocol), [découverte](/fr/gateway/discovery), [mode distant macOS](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Dois-je installer sur un deuxième ordinateur portable ou simplement ajouter un nœud ?">
    Si vous avez seulement besoin d’**outils locaux** (écran/caméra/exec) sur le deuxième ordinateur portable, ajoutez-le comme
    **nœud**. Cela conserve un seul Gateway et évite de dupliquer la configuration. Les outils de nœud local sont
    actuellement uniquement disponibles sur macOS, mais nous prévoyons de les étendre à d’autres OS.

    Installez un deuxième Gateway uniquement si vous avez besoin d’une **isolation stricte** ou de deux bots complètement distincts.

    Docs : [nœuds](/fr/nodes), [CLI des nœuds](/fr/cli/nodes), [plusieurs Gateways](/fr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables d’environnement et chargement de .env

<AccordionGroup>
  <Accordion title="Comment OpenClaw charge-t-il les variables d’environnement ?">
    OpenClaw lit les variables d’environnement du processus parent (shell, launchd/systemd, CI, etc.) et charge en plus :

    - `.env` depuis le répertoire de travail actuel
    - un `.env` global de secours depuis `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Aucun des fichiers `.env` ne remplace les variables d’environnement existantes.

    Vous pouvez aussi définir des variables d’environnement en ligne dans la configuration (appliquées uniquement si elles sont absentes de l’environnement du processus) :

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Consultez [/environment](/fr/help/environment) pour la précédence complète et les sources.

  </Accordion>

  <Accordion title="J’ai démarré le Gateway via le service et mes variables d’environnement ont disparu. Que faire ?">
    Deux corrections courantes :

    1. Mettez les clés manquantes dans `~/.openclaw/.env` afin qu’elles soient récupérées même lorsque le service n’hérite pas de l’environnement de votre shell.
    2. Activez l’import depuis le shell (fonction pratique opt-in) :

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

    Cela exécute votre shell de connexion et importe uniquement les clés attendues manquantes (ne remplace jamais). Équivalents en variables d’environnement :
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='J’ai défini COPILOT_GITHUB_TOKEN, mais l’état des modèles affiche "Shell env: off." Pourquoi ?'>
    `openclaw models status` indique si l’**import depuis le shell** est activé. "Shell env: off"
    ne signifie **pas** que vos variables d’environnement sont manquantes - cela signifie seulement qu’OpenClaw ne chargera pas
    automatiquement votre shell de connexion.

    Si le Gateway s’exécute comme service (launchd/systemd), il n’héritera pas de votre
    environnement de shell. Corrigez cela de l’une de ces façons :

    1. Mettez le jeton dans `~/.openclaw/.env` :

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Ou activez l’import depuis le shell (`env.shellEnv.enabled: true`).
    3. Ou ajoutez-le au bloc `env` de votre configuration (s’applique uniquement s’il est manquant).

    Redémarrez ensuite le Gateway et vérifiez à nouveau :

    ```bash
    openclaw models status
    ```

    Les jetons Copilot sont lus depuis `COPILOT_GITHUB_TOKEN` (également `GH_TOKEN` / `GITHUB_TOKEN`).
    Consultez [/concepts/model-providers](/fr/concepts/model-providers) et [/environment](/fr/help/environment).

  </Accordion>
</AccordionGroup>

## Sessions et conversations multiples

<AccordionGroup>
  <Accordion title="Comment démarrer une nouvelle conversation ?">
    Envoyez `/new` ou `/reset` comme message autonome. Consultez [gestion des sessions](/fr/concepts/session).
  </Accordion>

  <Accordion title="Les sessions se réinitialisent-elles automatiquement si je n’envoie jamais /new ?">
    Les sessions peuvent expirer après `session.idleMinutes`, mais cela est **désactivé par défaut** (valeur par défaut **0**).
    Définissez une valeur positive pour activer l’expiration en cas d’inactivité. Quand elle est activée, le **message suivant**
    après la période d’inactivité démarre un nouvel identifiant de session pour cette clé de conversation.
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
    Oui, via le **routage multi-agent** et les **sous-agents**. Vous pouvez créer un agent
    coordinateur et plusieurs agents d’exécution avec leurs propres espaces de travail et modèles.

    Cela dit, il vaut mieux voir cela comme une **expérience amusante**. Cela consomme beaucoup de tokens et est souvent
    moins efficace que d’utiliser un seul bot avec des sessions séparées. Le modèle type que nous
    envisageons est un bot auquel vous parlez, avec différentes sessions pour le travail en parallèle. Ce
    bot peut aussi lancer des sous-agents si nécessaire.

    Documentation : [Routage multi-agent](/fr/concepts/multi-agent), [Sous-agents](/fr/tools/subagents), [CLI des agents](/fr/cli/agents).

  </Accordion>

  <Accordion title="Pourquoi le contexte a-t-il été tronqué au milieu d’une tâche ? Comment l’éviter ?">
    Le contexte de session est limité par la fenêtre du modèle. Les longues conversations, les sorties d’outils volumineuses ou de nombreux
    fichiers peuvent déclencher une Compaction ou une troncature.

    Ce qui aide :

    - Demandez au bot de résumer l’état actuel et de l’écrire dans un fichier.
    - Utilisez `/compact` avant les longues tâches, et `/new` lorsque vous changez de sujet.
    - Conservez le contexte important dans l’espace de travail et demandez au bot de le relire.
    - Utilisez des sous-agents pour les travaux longs ou parallèles afin que la conversation principale reste plus petite.
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

    Remarques :

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

    - **Réinitialiser** (nouvel ID de session pour la même clé de conversation) :

      ```
      /new
      /reset
      ```

    Si cela continue :

    - Activez ou ajustez **l’élagage de session** (`agents.defaults.contextPruning`) pour réduire les anciennes sorties d’outils.
    - Utilisez un modèle avec une fenêtre de contexte plus grande.

    Documentation : [Compaction](/fr/concepts/compaction), [Élagage de session](/fr/concepts/session-pruning), [Gestion des sessions](/fr/concepts/session).

  </Accordion>

  <Accordion title='Pourquoi vois-je "LLM request rejected: messages.content.tool_use.input field required" ?'>
    Il s’agit d’une erreur de validation du fournisseur : le modèle a émis un bloc `tool_use` sans le champ
    `input` requis. Cela signifie généralement que l’historique de session est obsolète ou corrompu (souvent après de longs fils
    ou une modification d’outil/de schéma).

    Correction : démarrez une nouvelle session avec `/new` (message autonome).

  </Accordion>

  <Accordion title="Pourquoi est-ce que je reçois des messages Heartbeat toutes les 30 minutes ?">
    Les Heartbeats s’exécutent par défaut toutes les **30m** (**1h** avec l’authentification OAuth). Ajustez-les ou désactivez-les :

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

    Si `HEARTBEAT.md` existe mais est effectivement vide (seulement des lignes vides et des en-têtes
    markdown comme `# Heading`), OpenClaw ignore l’exécution Heartbeat pour économiser des appels API.
    Si le fichier est manquant, le Heartbeat s’exécute quand même et le modèle décide quoi faire.

    Les remplacements par agent utilisent `agents.list[].heartbeat`. Documentation : [Heartbeat](/fr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Dois-je ajouter un "compte bot" à un groupe WhatsApp ?'>
    Non. OpenClaw s’exécute sur **votre propre compte**, donc si vous êtes dans le groupe, OpenClaw peut le voir.
    Par défaut, les réponses de groupe sont bloquées jusqu’à ce que vous autorisiez des expéditeurs (`groupPolicy: "allowlist"`).

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

    Documentation : [WhatsApp](/fr/channels/whatsapp), [Répertoire](/fr/cli/directory), [Journaux](/fr/cli/logs).

  </Accordion>

  <Accordion title="Pourquoi OpenClaw ne répond-il pas dans un groupe ?">
    Deux causes fréquentes :

    - Le filtrage par mention est activé (par défaut). Vous devez @mentionner le bot (ou correspondre à `mentionPatterns`).
    - Vous avez configuré `channels.whatsapp.groups` sans `"*"` et le groupe n’est pas autorisé.

    Voir [Groupes](/fr/channels/groups) et [Messages de groupe](/fr/channels/group-messages).

  </Accordion>

  <Accordion title="Les groupes/fils partagent-ils le contexte avec les messages directs ?">
    Les conversations directes sont fusionnées dans la session principale par défaut. Les groupes/canaux ont leurs propres clés de session, et les sujets Telegram / fils Discord sont des sessions séparées. Voir [Groupes](/fr/channels/groups) et [Messages de groupe](/fr/channels/group-messages).
  </Accordion>

  <Accordion title="Combien d’espaces de travail et d’agents puis-je créer ?">
    Aucune limite stricte. Des dizaines (voire des centaines) ne posent pas de problème, mais surveillez :

    - **Croissance du disque :** les sessions + transcriptions se trouvent sous `~/.openclaw/agents/<agentId>/sessions/`.
    - **Coût en tokens :** plus d’agents signifie plus d’utilisation concurrente des modèles.
    - **Surcharge opérationnelle :** profils d’authentification, espaces de travail et routage des canaux par agent.

    Conseils :

    - Gardez un seul espace de travail **actif** par agent (`agents.defaults.workspace`).
    - Élaguez les anciennes sessions (supprimez les fichiers JSONL ou les entrées de stockage) si le disque grossit.
    - Utilisez `openclaw doctor` pour repérer les espaces de travail isolés et les incohérences de profils.

  </Accordion>

  <Accordion title="Puis-je exécuter plusieurs bots ou conversations en même temps (Slack), et comment dois-je configurer cela ?">
    Oui. Utilisez le **routage multi-agent** pour exécuter plusieurs agents isolés et router les messages entrants par
    canal/compte/pair. Slack est pris en charge comme canal et peut être lié à des agents spécifiques.

    L’accès au navigateur est puissant, mais ne permet pas de « faire tout ce qu’un humain peut faire » : les protections anti-bot, les CAPTCHA et la MFA peuvent
    toujours bloquer l’automatisation. Pour le contrôle de navigateur le plus fiable, utilisez Chrome MCP local sur l’hôte,
    ou utilisez CDP sur la machine qui exécute réellement le navigateur.

    Configuration recommandée :

    - Hôte Gateway toujours actif (VPS/Mac mini).
    - Un agent par rôle (liaisons).
    - Canal(aux) Slack liés à ces agents.
    - Navigateur local via Chrome MCP ou un Node si nécessaire.

    Docs : [Routage multi-agent](/fr/concepts/multi-agent), [Slack](/fr/channels/slack),
    [Navigateur](/fr/tools/browser), [Nodes](/fr/nodes).

  </Accordion>
</AccordionGroup>

## Modèles, basculement et profils d’authentification

Les questions-réponses sur les modèles — valeurs par défaut, sélection, alias, changement, basculement, profils d’authentification —
se trouvent dans la [FAQ sur les modèles](/fr/help/faq-models).

## Gateway : ports, « déjà en cours d’exécution » et mode distant

<AccordionGroup>
  <Accordion title="Quel port le Gateway utilise-t-il ?">
    `gateway.port` contrôle le port multiplexé unique pour WebSocket + HTTP (Control UI, hooks, etc.).

    Priorité :

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Pourquoi openclaw gateway status indique-t-il "Runtime: running" mais "Connectivity probe: failed" ?'>
    Parce que « running » correspond à la vue du **superviseur** (launchd/systemd/schtasks). La sonde de connectivité correspond à la CLI qui se connecte réellement au WebSocket du gateway.

    Utilisez `openclaw gateway status` et fiez-vous à ces lignes :

    - `Probe target:` (l’URL réellement utilisée par la sonde)
    - `Listening:` (ce qui est réellement lié au port)
    - `Last gateway error:` (cause racine courante lorsque le processus est vivant mais que le port n’écoute pas)

  </Accordion>

  <Accordion title='Pourquoi openclaw gateway status affiche-t-il "Config (cli)" et "Config (service)" différents ?'>
    Vous modifiez un fichier de configuration tandis que le service en exécute un autre (souvent une incohérence `--profile` / `OPENCLAW_STATE_DIR`).

    Correction :

    ```bash
    openclaw gateway install --force
    ```

    Exécutez cette commande depuis le même `--profile` / environnement que celui que vous voulez que le service utilise.

  </Accordion>

  <Accordion title='Que signifie "another gateway instance is already listening" ?'>
    OpenClaw impose un verrou d’exécution en liant immédiatement l’écouteur WebSocket au démarrage (`ws://127.0.0.1:18789` par défaut). Si la liaison échoue avec `EADDRINUSE`, il lève `GatewayLockError`, indiquant qu’une autre instance écoute déjà.

    Correction : arrêtez l’autre instance, libérez le port ou lancez avec `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Comment exécuter OpenClaw en mode distant (le client se connecte à un Gateway ailleurs) ?">
    Définissez `gateway.mode: "remote"` et pointez vers une URL WebSocket distante, éventuellement avec des identifiants distants à secret partagé :

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

    - `openclaw gateway` ne démarre que lorsque `gateway.mode` vaut `local` (ou si vous passez l’indicateur de remplacement).
    - L’app macOS surveille le fichier de configuration et change de mode à chaud lorsque ces valeurs changent.
    - `gateway.remote.token` / `.password` sont uniquement des identifiants distants côté client ; ils n’activent pas l’authentification du gateway local à eux seuls.

  </Accordion>

  <Accordion title='La Control UI indique "unauthorized" (ou continue de se reconnecter). Que faire ?'>
    Le chemin d’authentification de votre gateway et la méthode d’authentification de l’UI ne correspondent pas.

    Faits (d’après le code) :

    - La Control UI conserve le token dans `sessionStorage` pour la session de l’onglet de navigateur courant et l’URL de gateway sélectionnée ; les actualisations du même onglet continuent donc de fonctionner sans restaurer une persistance de token longue durée dans localStorage.
    - Sur `AUTH_TOKEN_MISMATCH`, les clients approuvés peuvent tenter une unique nouvelle tentative bornée avec un token d’appareil mis en cache lorsque le gateway renvoie des indications de nouvelle tentative (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Cette nouvelle tentative avec token mis en cache réutilise désormais les scopes approuvés mis en cache stockés avec le token d’appareil. Les appelants `deviceToken` explicite / `scopes` explicites conservent toujours l’ensemble de scopes demandé au lieu d’hériter des scopes mis en cache.
    - En dehors de ce chemin de nouvelle tentative, la priorité de l’authentification de connexion est : token/mot de passe partagé explicite d’abord, puis `deviceToken` explicite, puis token d’appareil stocké, puis token d’amorçage.
    - Les vérifications de portée du token d’amorçage sont préfixées par rôle. La liste d’autorisation opérateur d’amorçage intégrée ne satisfait que les requêtes opérateur ; les rôles Node ou autres rôles non opérateur ont toujours besoin de scopes sous leur propre préfixe de rôle.

    Correction :

    - Le plus rapide : `openclaw dashboard` (affiche + copie l’URL du tableau de bord, essaie de l’ouvrir ; affiche un indice SSH si sans affichage).
    - Si vous n’avez pas encore de token : `openclaw doctor --generate-gateway-token`.
    - Si distant, créez d’abord un tunnel : `ssh -N -L 18789:127.0.0.1:18789 user@host` puis ouvrez `http://127.0.0.1:18789/`.
    - Mode secret partagé : définissez `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, puis collez le secret correspondant dans les paramètres de la Control UI.
    - Mode Tailscale Serve : assurez-vous que `gateway.auth.allowTailscale` est activé et que vous ouvrez l’URL Serve, pas une URL loopback/tailnet brute qui contourne les en-têtes d’identité Tailscale.
    - Mode proxy approuvé : assurez-vous de passer par le proxy configuré tenant compte de l’identité, et non par une URL de gateway brute. Les proxys local loopback du même hôte ont aussi besoin de `gateway.auth.trustedProxy.allowLoopback = true`.
    - Si l’incohérence persiste après l’unique nouvelle tentative, faites une rotation/réapprobation du token d’appareil appairé :
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Si cet appel de rotation indique qu’il a été refusé, vérifiez deux choses :
      - les sessions d’appareil appairé ne peuvent faire tourner que leur **propre** appareil, sauf si elles ont aussi `operator.admin`
      - les valeurs `--scope` explicites ne peuvent pas dépasser les scopes opérateur actuels de l’appelant
    - Toujours bloqué ? Exécutez `openclaw status --all` et suivez le [dépannage](/fr/gateway/troubleshooting). Consultez [Tableau de bord](/fr/web/dashboard) pour les détails d’authentification.

  </Accordion>

  <Accordion title="J’ai défini gateway.bind sur tailnet, mais il ne peut pas se lier et rien n’écoute">
    La liaison `tailnet` choisit une IP Tailscale parmi vos interfaces réseau (100.64.0.0/10). Si la machine n’est pas sur Tailscale (ou si l’interface est inactive), il n’y a rien à quoi se lier.

    Correction :

    - Démarrez Tailscale sur cet hôte (pour qu’il ait une adresse 100.x), ou
    - Passez à `gateway.bind: "loopback"` / `"lan"`.

    Note : `tailnet` est explicite. `auto` privilégie loopback ; utilisez `gateway.bind: "tailnet"` lorsque vous voulez une liaison limitée au tailnet.

  </Accordion>

  <Accordion title="Puis-je exécuter plusieurs Gateways sur le même hôte ?">
    Généralement non : un seul Gateway peut exécuter plusieurs canaux de messagerie et agents. N’utilisez plusieurs Gateways que lorsque vous avez besoin de redondance (ex. : bot de secours) ou d’isolation stricte.

    Oui, mais vous devez isoler :

    - `OPENCLAW_CONFIG_PATH` (configuration par instance)
    - `OPENCLAW_STATE_DIR` (état par instance)
    - `agents.defaults.workspace` (isolation des espaces de travail)
    - `gateway.port` (ports uniques)

    Configuration rapide (recommandée) :

    - Utilisez `openclaw --profile <name> ...` par instance (crée automatiquement `~/.openclaw-<name>`).
    - Définissez un `gateway.port` unique dans chaque configuration de profil (ou passez `--port` pour les exécutions manuelles).
    - Installez un service par profil : `openclaw --profile <name> gateway install`.

    Les profils suffixent aussi les noms de service (`ai.openclaw.<profile>` ; ancien `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guide complet : [Plusieurs gateways](/fr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Que signifie "invalid handshake" / code 1008 ?'>
    Le Gateway est un **serveur WebSocket**, et il s’attend à ce que le tout premier message
    soit une trame `connect`. S’il reçoit autre chose, il ferme la connexion
    avec le **code 1008** (violation de politique).

    Causes courantes :

    - Vous avez ouvert l’URL **HTTP** dans un navigateur (`http://...`) au lieu d’un client WS.
    - Vous avez utilisé le mauvais port ou chemin.
    - Un proxy ou tunnel a supprimé les en-têtes d’authentification ou envoyé une requête non Gateway.

    Corrections rapides :

    1. Utilisez l’URL WS : `ws://<host>:18789` (ou `wss://...` si HTTPS).
    2. N’ouvrez pas le port WS dans un onglet de navigateur normal.
    3. Si l’authentification est activée, incluez le token/mot de passe dans la trame `connect`.

    Si vous utilisez la CLI ou la TUI, l’URL doit ressembler à :

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Détails du protocole : [protocole Gateway](/fr/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Journalisation et débogage

<AccordionGroup>
  <Accordion title="Où sont les journaux ?">
    Journaux de fichiers (structurés) :

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Vous pouvez définir un chemin stable via `logging.file`. Le niveau des journaux de fichier est contrôlé par `logging.level`. La verbosité de la console est contrôlée par `--verbose` et `logging.consoleLevel`.

    Suivi des journaux le plus rapide :

    ```bash
    openclaw logs --follow
    ```

    Journaux de service/superviseur (lorsque le gateway s’exécute via launchd/systemd) :

    - macOS : `$OPENCLAW_STATE_DIR/logs/gateway.log` et `gateway.err.log` (par défaut : `~/.openclaw/logs/...` ; les profils utilisent `~/.openclaw-<profile>/logs/...`)
    - Linux : `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows : `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Consultez le [dépannage](/fr/gateway/troubleshooting) pour en savoir plus.

  </Accordion>

  <Accordion title="Comment démarrer/arrêter/redémarrer le service Gateway ?">
    Utilisez les assistants gateway :

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Si vous exécutez le gateway manuellement, `openclaw gateway --force` peut récupérer le port. Consultez [Gateway](/fr/gateway).

  </Accordion>

  <Accordion title="J’ai fermé mon terminal sous Windows : comment redémarrer OpenClaw ?">
    Il existe **deux modes d’installation Windows** :

    **1) WSL2 (recommandé) :** le Gateway s’exécute dans Linux.

    Ouvrez PowerShell, entrez dans WSL, puis redémarrez :

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Si vous n’avez jamais installé le service, démarrez-le au premier plan :

    ```bash
    openclaw gateway run
    ```

    **2) Windows natif (non recommandé) :** le Gateway s’exécute directement dans Windows.

    Ouvrez PowerShell et exécutez :

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Si vous l’exécutez manuellement (sans service), utilisez :

    ```powershell
    openclaw gateway run
    ```

    Docs : [Windows (WSL2)](/fr/platforms/windows), [runbook du service Gateway](/fr/gateway).

  </Accordion>

  <Accordion title="Le Gateway est actif, mais les réponses n’arrivent jamais. Que dois-je vérifier ?">
    Commencez par un rapide balayage de santé :

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causes courantes :

    - Authentification du modèle non chargée sur l'**hôte du Gateway** (vérifiez `models status`).
    - Appairage/liste d'autorisation du canal bloquant les réponses (vérifiez la configuration du canal + les journaux).
    - WebChat/Dashboard est ouvert sans le bon jeton.

    Si vous êtes à distance, vérifiez que la connexion tunnel/Tailscale est active et que le
    WebSocket du Gateway est joignable.

    Docs : [Canaux](/fr/channels), [Dépannage](/fr/gateway/troubleshooting), [Accès à distance](/fr/gateway/remote).

  </Accordion>

  <Accordion title='"Déconnecté du Gateway : aucune raison" - que faire maintenant ?'>
    Cela signifie généralement que l'interface utilisateur a perdu la connexion WebSocket. Vérifiez :

    1. Le Gateway est-il en cours d'exécution ? `openclaw gateway status`
    2. Le Gateway est-il sain ? `openclaw status`
    3. L'interface utilisateur a-t-elle le bon jeton ? `openclaw dashboard`
    4. À distance, le lien tunnel/Tailscale est-il actif ?

    Puis suivez les journaux :

    ```bash
    openclaw logs --follow
    ```

    Docs : [Dashboard](/fr/web/dashboard), [Accès à distance](/fr/gateway/remote), [Dépannage](/fr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands échoue. Que dois-je vérifier ?">
    Commencez par les journaux et l'état du canal :

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Puis faites correspondre l'erreur :

    - `BOT_COMMANDS_TOO_MUCH` : le menu Telegram comporte trop d'entrées. OpenClaw réduit déjà la liste à la limite de Telegram et réessaie avec moins de commandes, mais certaines entrées de menu doivent encore être supprimées. Réduisez les commandes de plugins/Skills/personnalisées, ou désactivez `channels.telegram.commands.native` si vous n'avez pas besoin du menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, ou des erreurs réseau similaires : si vous êtes sur un VPS ou derrière un proxy, vérifiez que le HTTPS sortant est autorisé et que DNS fonctionne pour `api.telegram.org`.

    Si le Gateway est distant, assurez-vous de consulter les journaux sur l'hôte du Gateway.

    Docs : [Telegram](/fr/channels/telegram), [Dépannage des canaux](/fr/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI n'affiche aucune sortie. Que dois-je vérifier ?">
    Vérifiez d'abord que le Gateway est joignable et que l'agent peut s'exécuter :

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Dans la TUI, utilisez `/status` pour voir l'état actuel. Si vous attendez des réponses dans un canal
    de discussion, assurez-vous que la livraison est activée (`/deliver on`).

    Docs : [TUI](/fr/web/tui), [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Comment arrêter complètement puis démarrer le Gateway ?">
    Si vous avez installé le service :

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Cela arrête/démarre le **service supervisé** (launchd sur macOS, systemd sur Linux).
    Utilisez ceci lorsque le Gateway s'exécute en arrière-plan comme démon.

    Si vous l'exécutez au premier plan, arrêtez avec Ctrl-C, puis :

    ```bash
    openclaw gateway run
    ```

    Docs : [Guide d'exploitation du service Gateway](/fr/gateway).

  </Accordion>

  <Accordion title="ELI5 : openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart` : redémarre le **service en arrière-plan** (launchd/systemd).
    - `openclaw gateway` : exécute le Gateway **au premier plan** pour cette session de terminal.

    Si vous avez installé le service, utilisez les commandes gateway. Utilisez `openclaw gateway` lorsque
    vous voulez une exécution ponctuelle au premier plan.

  </Accordion>

  <Accordion title="Le moyen le plus rapide d'obtenir plus de détails en cas d'échec">
    Démarrez le Gateway avec `--verbose` pour obtenir plus de détails dans la console. Inspectez ensuite le fichier journal pour les erreurs d'authentification du canal, de routage des modèles et de RPC.
  </Accordion>
</AccordionGroup>

## Médias et pièces jointes

<AccordionGroup>
  <Accordion title="Mon Skill a généré une image/un PDF, mais rien n'a été envoyé">
    Les pièces jointes sortantes de l'agent doivent inclure une ligne `MEDIA:<path-or-url>` (sur sa propre ligne). Consultez [Configuration de l'assistant OpenClaw](/fr/start/openclaw) et [Envoi par l'agent](/fr/tools/agent-send).

    Envoi avec la CLI :

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Vérifiez aussi :

    - Le canal cible prend en charge les médias sortants et n'est pas bloqué par des listes d'autorisation.
    - Le fichier respecte les limites de taille du fournisseur (les images sont redimensionnées à 2048 px maximum).
    - `tools.fs.workspaceOnly=true` limite les envois de chemins locaux à l'espace de travail, au répertoire temporaire/media-store et aux fichiers validés par le bac à sable.
    - `tools.fs.workspaceOnly=false` permet à `MEDIA:` d'envoyer des fichiers locaux de l'hôte que l'agent peut déjà lire, mais uniquement pour les médias et les types de documents sûrs (images, audio, vidéo, PDF et documents Office). Les fichiers texte brut et les fichiers ressemblant à des secrets restent bloqués.

    Voir [Images](/fr/nodes/images).

  </Accordion>
</AccordionGroup>

## Sécurité et contrôle d'accès

<AccordionGroup>
  <Accordion title="Est-il sûr d'exposer OpenClaw aux DM entrants ?">
    Traitez les DM entrants comme des entrées non fiables. Les valeurs par défaut sont conçues pour réduire les risques :

    - Le comportement par défaut sur les canaux prenant en charge les DM est l'**appairage** :
      - Les expéditeurs inconnus reçoivent un code d'appairage ; le bot ne traite pas leur message.
      - Approuvez avec : `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Les demandes en attente sont limitées à **3 par canal** ; vérifiez `openclaw pairing list --channel <channel> [--account <id>]` si un code n'est pas arrivé.
    - Ouvrir publiquement les DM nécessite une adhésion explicite (`dmPolicy: "open"` et liste d'autorisation `"*"`).

    Exécutez `openclaw doctor` pour faire ressortir les politiques de DM risquées.

  </Accordion>

  <Accordion title="L'injection de prompt concerne-t-elle seulement les bots publics ?">
    Non. L'injection de prompt concerne le **contenu non fiable**, pas seulement qui peut envoyer un DM au bot.
    Si votre assistant lit du contenu externe (recherche/récupération web, pages de navigateur, e-mails,
    documents, pièces jointes, journaux collés), ce contenu peut inclure des instructions qui tentent
    de détourner le modèle. Cela peut arriver même si **vous êtes le seul expéditeur**.

    Le risque le plus important apparaît lorsque les outils sont activés : le modèle peut être piégé et amené à
    exfiltrer le contexte ou à appeler des outils en votre nom. Réduisez le périmètre d'impact en :

    - utilisant un agent « lecteur » en lecture seule ou sans outils pour résumer le contenu non fiable
    - gardant `web_search` / `web_fetch` / `browser` désactivés pour les agents avec outils activés
    - traitant aussi le texte de fichiers/documents décodés comme non fiable : OpenResponses
      `input_file` et l'extraction de pièces jointes multimédias encapsulent tous deux le texte extrait dans
      des marqueurs de frontière explicites pour contenu externe, au lieu de transmettre le texte brut du fichier
    - utilisant le bac à sable et des listes d'autorisation d'outils strictes

    Détails : [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Mon bot doit-il avoir son propre e-mail, compte GitHub ou numéro de téléphone ?">
    Oui, pour la plupart des configurations. Isoler le bot avec des comptes et numéros de téléphone séparés
    réduit le périmètre d'impact si quelque chose se passe mal. Cela facilite aussi la rotation
    des identifiants ou la révocation d'accès sans affecter vos comptes personnels.

    Commencez modestement. Donnez accès uniquement aux outils et comptes dont vous avez réellement besoin, puis étendez
    plus tard si nécessaire.

    Docs : [Sécurité](/fr/gateway/security), [Appairage](/fr/channels/pairing).

  </Accordion>

  <Accordion title="Puis-je lui donner de l'autonomie sur mes SMS, et est-ce sûr ?">
    Nous ne recommandons **pas** une autonomie complète sur vos messages personnels. Le modèle le plus sûr est :

    - Garder les DM en **mode appairage** ou avec une liste d'autorisation stricte.
    - Utiliser un **numéro ou compte séparé** si vous voulez qu'il envoie des messages en votre nom.
    - Le laisser rédiger, puis **approuver avant l'envoi**.

    Si vous voulez expérimenter, faites-le sur un compte dédié et gardez-le isolé. Voir
    [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Puis-je utiliser des modèles moins chers pour des tâches d'assistant personnel ?">
    Oui, **si** l'agent sert uniquement au chat et que l'entrée est fiable. Les niveaux plus petits sont
    plus susceptibles au détournement d'instructions ; évitez-les donc pour les agents avec outils activés
    ou lors de la lecture de contenu non fiable. Si vous devez utiliser un modèle plus petit, verrouillez
    les outils et exécutez dans un bac à sable. Voir [Sécurité](/fr/gateway/security).
  </Accordion>

  <Accordion title="J'ai exécuté /start dans Telegram mais je n'ai pas reçu de code d'appairage">
    Les codes d'appairage sont envoyés **uniquement** lorsqu'un expéditeur inconnu envoie un message au bot et que
    `dmPolicy: "pairing"` est activé. `/start` seul ne génère pas de code.

    Vérifiez les demandes en attente :

    ```bash
    openclaw pairing list telegram
    ```

    Si vous voulez un accès immédiat, ajoutez votre identifiant d'expéditeur à la liste d'autorisation ou définissez `dmPolicy: "open"`
    pour ce compte.

  </Accordion>

  <Accordion title="WhatsApp : va-t-il envoyer des messages à mes contacts ? Comment fonctionne l'appairage ?">
    Non. La politique de DM WhatsApp par défaut est l'**appairage**. Les expéditeurs inconnus reçoivent seulement un code d'appairage et leur message n'est **pas traité**. OpenClaw répond uniquement aux discussions qu'il reçoit ou aux envois explicites que vous déclenchez.

    Approuvez l'appairage avec :

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Listez les demandes en attente :

    ```bash
    openclaw pairing list whatsapp
    ```

    Invite du numéro de téléphone dans l'assistant : elle sert à définir votre **liste d'autorisation/propriétaire** afin que vos propres DM soient autorisés. Elle n'est pas utilisée pour l'envoi automatique. Si vous l'exécutez sur votre numéro WhatsApp personnel, utilisez ce numéro et activez `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Commandes de chat, abandon de tâches et « il ne s'arrête pas »

<AccordionGroup>
  <Accordion title="Comment empêcher les messages système internes de s'afficher dans le chat ?">
    La plupart des messages internes ou d'outils n'apparaissent que lorsque **verbose**, **trace** ou **reasoning** est activé
    pour cette session.

    Corrigez dans le chat où vous les voyez :

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Si c'est toujours bruyant, vérifiez les paramètres de session dans la Control UI et définissez verbose
    sur **inherit**. Vérifiez aussi que vous n'utilisez pas un profil de bot avec `verboseDefault` défini
    sur `on` dans la configuration.

    Docs : [Réflexion et verbose](/fr/tools/thinking), [Sécurité](/fr/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Comment arrêter/annuler une tâche en cours ?">
    Envoyez l'un de ces messages **comme message autonome** (sans slash) :

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

    Ce sont des déclencheurs d'abandon (pas des commandes slash).

    Pour les processus en arrière-plan (depuis l'outil exec), vous pouvez demander à l'agent d'exécuter :

    ```
    process action:kill sessionId:XXX
    ```

    Aperçu des commandes slash : voir [Commandes slash](/fr/tools/slash-commands).

    La plupart des commandes doivent être envoyées sous forme de message **autonome** commençant par `/`, mais quelques raccourcis (comme `/status`) fonctionnent aussi en ligne pour les expéditeurs sur liste d'autorisation.

  </Accordion>

  <Accordion title='Comment envoyer un message Discord depuis Telegram ? ("Messagerie inter-contexte refusée")'>
    OpenClaw bloque par défaut la messagerie **inter-fournisseurs**. Si un appel d'outil est lié
    à Telegram, il n'enverra pas à Discord sauf si vous l'autorisez explicitement.

    Activez la messagerie inter-fournisseurs pour l'agent :

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

    Redémarrez le Gateway après avoir modifié la configuration.

  </Accordion>

  <Accordion title='Pourquoi ai-je l'impression que le bot "ignore" les messages en rafale ?'>
    Le mode de file d'attente contrôle la façon dont les nouveaux messages interagissent avec une exécution en cours. Utilisez `/queue` pour changer de mode :

    - `steer` - mettre en file toutes les instructions de pilotage en attente pour la prochaine frontière de modèle dans l'exécution actuelle
    - `queue` - pilotage hérité un par un
    - `followup` - exécuter les messages un par un
    - `collect` - regrouper les messages et répondre une seule fois
    - `steer-backlog` - piloter maintenant, puis traiter l'arriéré
    - `interrupt` - abandonner l'exécution actuelle et recommencer à zéro

    Le mode par défaut est `steer`. Vous pouvez ajouter des options comme `debounce:0.5s cap:25 drop:summarize` pour les modes de suivi. Consultez [File d’attente des commandes](/fr/concepts/queue) et [File d’attente de pilotage](/fr/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Divers

<AccordionGroup>
  <Accordion title='Quel est le modèle par défaut pour Anthropic avec une clé API ?'>
    Dans OpenClaw, les identifiants et la sélection du modèle sont séparés. Définir `ANTHROPIC_API_KEY` (ou stocker une clé API Anthropic dans les profils d’authentification) active l’authentification, mais le modèle par défaut réel est celui que vous configurez dans `agents.defaults.model.primary` (par exemple, `anthropic/claude-sonnet-4-6` ou `anthropic/claude-opus-4-6`). Si vous voyez `No credentials found for profile "anthropic:default"`, cela signifie que le Gateway n’a pas pu trouver les identifiants Anthropic dans le fichier `auth-profiles.json` attendu pour l’agent en cours d’exécution.
  </Accordion>
</AccordionGroup>

---

Toujours bloqué ? Posez votre question sur [Discord](https://discord.com/invite/clawd) ou ouvrez une [discussion GitHub](https://github.com/openclaw/openclaw/discussions).

## Connexe

- [FAQ du premier lancement](/fr/help/faq-first-run) — installation, intégration, authentification, abonnements, premiers échecs
- [FAQ des modèles](/fr/help/faq-models) — sélection de modèle, basculement, profils d’authentification
- [Dépannage](/fr/help/troubleshooting) — triage par symptôme
