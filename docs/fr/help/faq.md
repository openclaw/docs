---
read_when:
    - Répondre aux questions courantes sur la configuration, l’installation, la prise en main ou l’assistance à l’exécution
    - Trier les problèmes signalés par les utilisateurs avant un débogage plus approfondi
summary: Questions fréquentes sur l’installation, la configuration et l’utilisation d’OpenClaw
title: Foire aux questions
x-i18n:
    generated_at: "2026-05-12T00:58:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57e42ea34d4f53cb9e6f0e9c175fd553a67e70aaca08a09be28f0bde43414bc8
    source_path: help/faq.md
    workflow: 16
---

Réponses rapides et dépannage approfondi pour les configurations réelles (développement local, VPS, multi-agent, OAuth/clés API, basculement de modèle). Pour les diagnostics d’exécution, consultez [Dépannage](/fr/gateway/troubleshooting). Pour la référence complète de configuration, consultez [Configuration](/fr/gateway/configuration).

## Les 60 premières secondes si quelque chose est cassé

1. **État rapide (première vérification)**

   ```bash
   openclaw status
   ```

   Résumé local rapide : OS + mise à jour, accessibilité du gateway/service, agents/sessions, configuration des fournisseurs + problèmes d’exécution (quand le Gateway est accessible).

2. **Rapport à coller (sûr à partager)**

   ```bash
   openclaw status --all
   ```

   Diagnostic en lecture seule avec fin des journaux (tokens masqués).

3. **État du démon + du port**

   ```bash
   openclaw gateway status
   ```

   Affiche l’exécution du superviseur par rapport à l’accessibilité RPC, l’URL cible de la sonde et la configuration que le service a probablement utilisée.

4. **Sondes approfondies**

   ```bash
   openclaw status --deep
   ```

   Exécute une sonde de santé en direct du Gateway, y compris les sondes de canaux lorsqu’elles sont prises en charge
   (nécessite un Gateway accessible). Consultez [Santé](/fr/gateway/health).

5. **Suivre le dernier journal**

   ```bash
   openclaw logs --follow
   ```

   Si RPC est indisponible, utilisez en recours :

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Les journaux de fichiers sont séparés des journaux de service ; consultez [Journalisation](/fr/logging) et [Dépannage](/fr/gateway/troubleshooting).

6. **Exécuter le doctor (réparations)**

   ```bash
   openclaw doctor
   ```

   Répare/migre la configuration/l’état + exécute des vérifications de santé. Consultez [Doctor](/fr/gateway/doctor).

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
    OpenClaw est un assistant IA personnel que vous exécutez sur vos propres appareils. Il répond sur les surfaces de messagerie que vous utilisez déjà (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat et les plugins de canaux intégrés comme QQ Bot) et peut aussi fournir de la voix + un Canvas en direct sur les plateformes prises en charge. Le **Gateway** est le plan de contrôle toujours actif ; l’assistant est le produit.
  </Accordion>

  <Accordion title="Proposition de valeur">
    OpenClaw n’est pas « juste un wrapper Claude ». C’est un **plan de contrôle local-first** qui vous permet d’exécuter un
    assistant capable sur **votre propre matériel**, accessible depuis les applications de chat que vous utilisez déjà, avec
    des sessions avec état, de la mémoire et des outils, sans remettre le contrôle de vos workflows à un SaaS
    hébergé.

    Points forts :

    - **Vos appareils, vos données :** exécutez le Gateway où vous voulez (Mac, Linux, VPS) et gardez
      l’espace de travail + l’historique des sessions en local.
    - **De vrais canaux, pas un bac à sable web :** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      plus la voix mobile et Canvas sur les plateformes prises en charge.
    - **Indépendant des modèles :** utilisez Anthropic, OpenAI, MiniMax, OpenRouter, etc., avec routage
      par agent et basculement.
    - **Option local uniquement :** exécutez des modèles locaux afin que **toutes les données puissent rester sur votre appareil** si vous le souhaitez.
    - **Routage multi-agent :** séparez les agents par canal, compte ou tâche, chacun avec son propre
      espace de travail et ses propres valeurs par défaut.
    - **Open source et modifiable :** inspectez, étendez et auto-hébergez sans verrouillage fournisseur.

    Docs : [Gateway](/fr/gateway), [Canaux](/fr/channels), [Multi-agent](/fr/concepts/multi-agent),
    [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Je viens de le configurer - que dois-je faire en premier ?">
    Bons premiers projets :

    - Créer un site web (WordPress, Shopify ou un simple site statique).
    - Prototyper une application mobile (plan, écrans, plan d’API).
    - Organiser des fichiers et dossiers (nettoyage, nommage, étiquetage).
    - Connecter Gmail et automatiser des résumés ou des suivis.

    Il peut gérer de grandes tâches, mais il fonctionne mieux lorsque vous les divisez en phases et
    utilisez des sous-agents pour le travail en parallèle.

  </Accordion>

  <Accordion title="Quels sont les cinq principaux cas d’utilisation quotidiens d’OpenClaw ?">
    Les gains quotidiens ressemblent généralement à ceci :

    - **Briefings personnels :** résumés de la boîte de réception, du calendrier et des actualités qui vous intéressent.
    - **Recherche et rédaction :** recherches rapides, résumés et premières ébauches pour des e-mails ou des docs.
    - **Rappels et suivis :** relances et listes de contrôle pilotées par Cron ou Heartbeat.
    - **Automatisation du navigateur :** remplir des formulaires, collecter des données et répéter des tâches web.
    - **Coordination entre appareils :** envoyez une tâche depuis votre téléphone, laissez le Gateway l’exécuter sur un serveur et recevez le résultat dans le chat.

  </Accordion>

  <Accordion title="OpenClaw peut-il aider pour la génération de prospects, la prospection, les publicités et les blogs pour un SaaS ?">
    Oui pour la **recherche, la qualification et la rédaction**. Il peut analyser des sites, créer des listes restreintes,
    résumer des prospects et rédiger des brouillons de prospection ou de textes publicitaires.

    Pour les **campagnes de prospection ou publicitaires**, gardez un humain dans la boucle. Évitez le spam, respectez les lois locales et
    les politiques des plateformes, et relisez tout avant l’envoi. Le schéma le plus sûr consiste à laisser
    OpenClaw rédiger et vous approuver.

    Docs : [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Quels sont les avantages par rapport à Claude Code pour le développement web ?">
    OpenClaw est un **assistant personnel** et une couche de coordination, pas un remplaçant d’IDE. Utilisez
    Claude Code ou Codex pour la boucle de codage directe la plus rapide dans un dépôt. Utilisez OpenClaw lorsque vous
    voulez une mémoire durable, un accès multi-appareil et une orchestration d’outils.

    Avantages :

    - **Mémoire persistante + espace de travail** entre les sessions
    - **Accès multiplateforme** (WhatsApp, Telegram, TUI, WebChat)
    - **Orchestration d’outils** (navigateur, fichiers, planification, hooks)
    - **Gateway toujours actif** (exécutez-le sur un VPS, interagissez depuis n’importe où)
    - **Nodes** pour navigateur/écran/caméra/exec locaux

    Vitrine : [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills et automatisation

<AccordionGroup>
  <Accordion title="Comment personnaliser les Skills sans garder le dépôt modifié ?">
    Utilisez des remplacements gérés au lieu de modifier la copie du dépôt. Placez vos changements dans `~/.openclaw/skills/<name>/SKILL.md` (ou ajoutez un dossier via `skills.load.extraDirs` dans `~/.openclaw/openclaw.json`). La précédence est `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → intégrés → `skills.load.extraDirs`, donc les remplacements gérés l’emportent toujours sur les Skills intégrés sans toucher à git. Si vous devez installer le Skill globalement mais le rendre visible seulement pour certains agents, gardez la copie partagée dans `~/.openclaw/skills` et contrôlez la visibilité avec `agents.defaults.skills` et `agents.list[].skills`. Seules les modifications dignes d’être intégrées en amont devraient vivre dans le dépôt et être envoyées comme PR.
  </Accordion>

  <Accordion title="Puis-je charger des Skills depuis un dossier personnalisé ?">
    Oui. Ajoutez des répertoires supplémentaires via `skills.load.extraDirs` dans `~/.openclaw/openclaw.json` (précédence la plus basse). La précédence par défaut est `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → intégrés → `skills.load.extraDirs`. `clawhub` installe dans `./skills` par défaut, ce qu’OpenClaw traite comme `<workspace>/skills` à la session suivante. Si le Skill ne doit être visible que pour certains agents, associez cela à `agents.defaults.skills` ou `agents.list[].skills`.
  </Accordion>

  <Accordion title="Comment utiliser différents modèles pour différentes tâches ?">
    Aujourd’hui, les schémas pris en charge sont :

    - **Tâches Cron** : les tâches isolées peuvent définir un remplacement `model` par tâche.
    - **Sous-agents** : routez les tâches vers des agents séparés avec différents modèles par défaut.
    - **Changement à la demande** : utilisez `/model` pour changer le modèle de la session actuelle à tout moment.

    Consultez [Tâches Cron](/fr/automation/cron-jobs), [Routage multi-agent](/fr/concepts/multi-agent) et [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Le bot se fige pendant un travail lourd. Comment le décharger ?">
    Utilisez des **sous-agents** pour les tâches longues ou parallèles. Les sous-agents s’exécutent dans leur propre session,
    renvoient un résumé et gardent votre chat principal réactif.

    Demandez à votre bot de « lancer un sous-agent pour cette tâche » ou utilisez `/subagents`.
    Utilisez `/status` dans le chat pour voir ce que fait le Gateway en ce moment (et s’il est occupé).

    Astuce tokens : les tâches longues et les sous-agents consomment tous deux des tokens. Si le coût est un sujet, définissez un
    modèle moins cher pour les sous-agents via `agents.defaults.subagents.model`.

    Docs : [Sous-agents](/fr/tools/subagents), [Tâches en arrière-plan](/fr/automation/tasks).

  </Accordion>

  <Accordion title="Comment fonctionnent les sessions de sous-agent liées à un fil sur Discord ?">
    Utilisez les liaisons de fils. Vous pouvez lier un fil Discord à une cible de sous-agent ou de session afin que les messages de suivi dans ce fil restent sur cette session liée.

    Flux de base :

    - Lancez avec `sessions_spawn` en utilisant `thread: true` (et éventuellement `mode: "session"` pour un suivi persistant).
    - Ou liez manuellement avec `/focus <target>`.
    - Utilisez `/agents` pour inspecter l’état de liaison.
    - Utilisez `/session idle <duration|off>` et `/session max-age <duration|off>` pour contrôler l’auto-unfocus.
    - Utilisez `/unfocus` pour détacher le fil.

    Configuration requise :

    - Valeurs par défaut globales : `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Remplacements Discord : `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Liaison automatique au lancement : `channels.discord.threadBindings.spawnSessions` vaut `true` par défaut ; définissez-le sur `false` pour désactiver les lancements de sessions liées à un fil.

    Docs : [Sous-agents](/fr/tools/subagents), [Discord](/fr/channels/discord), [Référence de configuration](/fr/gateway/configuration-reference), [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Un sous-agent a terminé, mais la mise à jour de fin est allée au mauvais endroit ou n’a jamais été publiée. Que vérifier ?">
    Vérifiez d’abord la route demandeur résolue :

    - La livraison d’un sous-agent en mode fin préfère toute route de fil ou de conversation liée lorsqu’il en existe une.
    - Si l’origine de fin ne porte qu’un canal, OpenClaw se rabat sur la route stockée de la session demandeuse (`lastChannel` / `lastTo` / `lastAccountId`) afin que la livraison directe puisse encore réussir.
    - Si ni une route liée ni une route stockée utilisable n’existe, la livraison directe peut échouer et le résultat revient à une livraison de session en file d’attente au lieu d’être publié immédiatement dans le chat.
    - Des cibles invalides ou obsolètes peuvent toujours forcer un retour à la file d’attente ou un échec final de livraison.
    - Si la dernière réponse visible de l’assistant enfant est le token silencieux exact `NO_REPLY` / `no_reply`, ou exactement `ANNOUNCE_SKIP`, OpenClaw supprime intentionnellement l’annonce au lieu de publier une progression antérieure obsolète.
    - Si l’enfant a expiré après seulement des appels d’outils, l’annonce peut condenser cela en un court résumé de progression partielle au lieu de rejouer la sortie brute des outils.

    Débogage :

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs : [Sous-agents](/fr/tools/subagents), [Tâches en arrière-plan](/fr/automation/tasks), [Outils de session](/fr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron ou les rappels ne se déclenchent pas. Que vérifier ?">
    Cron s’exécute dans le processus Gateway. Si le Gateway ne fonctionne pas en continu,
    les tâches planifiées ne s’exécuteront pas.

    Liste de vérification :

    - Confirmez que cron est activé (`cron.enabled`) et que `OPENCLAW_SKIP_CRON` n’est pas défini.
    - Vérifiez que le Gateway fonctionne 24 h/24, 7 j/7 (pas de veille/redémarrages).
    - Vérifiez les paramètres de fuseau horaire de la tâche (`--tz` par rapport au fuseau horaire de l’hôte).

    Débogage :

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs : [Tâches Cron](/fr/automation/cron-jobs), [Automatisation](/fr/automation).

  </Accordion>

  <Accordion title="Cron s’est déclenché, mais rien n’a été envoyé au canal. Pourquoi ?">
    Vérifiez d’abord le mode de livraison :

    - `--no-deliver` / `delivery.mode: "none"` signifie qu’aucun envoi de repli par le runner n’est attendu.
    - Une cible d’annonce manquante ou invalide (`channel` / `to`) signifie que le runner a ignoré la livraison sortante.
    - Les échecs d’authentification du canal (`unauthorized`, `Forbidden`) signifient que le runner a tenté de livrer, mais que les identifiants l’en ont empêché.
    - Un résultat isolé silencieux (`NO_REPLY` / `no_reply` uniquement) est traité comme volontairement non livrable ; le runner supprime donc aussi la livraison de repli mise en file d’attente.

    Pour les tâches cron isolées, l’agent peut toujours envoyer directement avec l’outil `message`
    lorsqu’une route de discussion est disponible. `--announce` contrôle uniquement le chemin de
    repli du runner pour le texte final que l’agent n’a pas déjà envoyé.

    Débogage :

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs : [Tâches Cron](/fr/automation/cron-jobs), [Tâches en arrière-plan](/fr/automation/tasks).

  </Accordion>

  <Accordion title="Pourquoi une exécution cron isolée a-t-elle changé de modèle ou réessayé une fois ?">
    Il s’agit généralement du chemin de changement de modèle en direct, pas d’une planification en double.

    Le cron isolé peut persister un transfert de modèle d’exécution et réessayer lorsque l’exécution
    active lève `LiveSessionModelSwitchError`. La nouvelle tentative conserve le fournisseur/modèle
    basculé et, si le changement transportait un nouveau remplacement de profil d’authentification, cron
    le persiste aussi avant de réessayer.

    Règles de sélection associées :

    - Le remplacement de modèle du hook Gmail l’emporte d’abord lorsqu’il s’applique.
    - Puis le `model` par tâche.
    - Puis tout remplacement de modèle stocké pour la session cron.
    - Puis la sélection normale du modèle de l’agent/par défaut.

    La boucle de nouvelle tentative est bornée. Après la tentative initiale plus 2 nouvelles tentatives de changement,
    cron abandonne au lieu de boucler indéfiniment.

    Débogage :

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs : [Tâches Cron](/fr/automation/cron-jobs), [CLI cron](/fr/cli/cron).

  </Accordion>

  <Accordion title="Comment installer des Skills sous Linux ?">
    Utilisez les commandes natives `openclaw skills` ou déposez les Skills dans votre espace de travail. L’interface Skills macOS n’est pas disponible sous Linux.
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
    de l’espace de travail actif. Installez le CLI `clawhub` séparé uniquement si vous voulez publier ou
    synchroniser vos propres Skills. Pour des installations partagées entre agents, placez le Skill sous
    `~/.openclaw/skills` et utilisez `agents.defaults.skills` ou
    `agents.list[].skills` si vous voulez restreindre les agents qui peuvent le voir.

  </Accordion>

  <Accordion title="OpenClaw peut-il exécuter des tâches selon un planning ou en continu en arrière-plan ?">
    Oui. Utilisez le planificateur Gateway :

    - **Tâches Cron** pour les tâches planifiées ou récurrentes (persistent après les redémarrages).
    - **Heartbeat** pour les vérifications périodiques de la « session principale ».
    - **Tâches isolées** pour les agents autonomes qui publient des résumés ou livrent vers des discussions.

    Docs : [Tâches Cron](/fr/automation/cron-jobs), [Automatisation](/fr/automation),
    [Heartbeat](/fr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Puis-je exécuter depuis Linux des Skills réservés à Apple macOS ?">
    Pas directement. Les Skills macOS sont contrôlés par `metadata.openclaw.os` ainsi que par les binaires requis, et les Skills n’apparaissent dans le prompt système que lorsqu’ils sont éligibles sur l’**hôte Gateway**. Sous Linux, les Skills réservés à `darwin` (comme `apple-notes`, `apple-reminders`, `things-mac`) ne se chargeront pas, sauf si vous remplacez ce filtrage.

    Trois modèles sont pris en charge :

    **Option A - exécuter le Gateway sur un Mac (le plus simple).**
    Exécutez le Gateway là où les binaires macOS existent, puis connectez-vous depuis Linux en [mode distant](#gateway-ports-already-running-and-remote-mode) ou via Tailscale. Les Skills se chargent normalement, car l’hôte Gateway est macOS.

    **Option B - utiliser un nœud macOS (sans SSH).**
    Exécutez le Gateway sous Linux, associez un nœud macOS (application de barre de menus), puis définissez **Commandes d’exécution du nœud** sur « Toujours demander » ou « Toujours autoriser » sur le Mac. OpenClaw peut considérer les Skills réservés à macOS comme éligibles lorsque les binaires requis existent sur le nœud. L’agent exécute ces Skills via l’outil `nodes`. Si vous choisissez « Toujours demander », approuver « Toujours autoriser » dans le prompt ajoute cette commande à la liste d’autorisation.

    **Option C - proxifier les binaires macOS via SSH (avancé).**
    Gardez le Gateway sous Linux, mais faites résoudre les binaires CLI requis vers des wrappers SSH qui s’exécutent sur un Mac. Remplacez ensuite le Skill pour autoriser Linux afin qu’il reste éligible.

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

    4. Démarrez une nouvelle session afin que l’instantané des Skills soit actualisé.

  </Accordion>

  <Accordion title="Avez-vous une intégration Notion ou HeyGen ?">
    Pas intégrée aujourd’hui.

    Options :

    - **Skill / plugin personnalisé :** idéal pour un accès API fiable (Notion/HeyGen disposent tous deux d’API).
    - **Automatisation du navigateur :** fonctionne sans code, mais elle est plus lente et plus fragile.

    Si vous voulez conserver le contexte par client (flux de travail d’agence), un modèle simple consiste à utiliser :

    - Une page Notion par client (contexte + préférences + travail actif).
    - Demandez à l’agent de récupérer cette page au début d’une session.

    Si vous voulez une intégration native, ouvrez une demande de fonctionnalité ou créez un Skill
    ciblant ces API.

    Installer des Skills :

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Les installations natives arrivent dans le répertoire `skills/` de l’espace de travail actif. Pour des Skills partagés entre agents, placez-les dans `~/.openclaw/skills/<name>/SKILL.md`. Si seuls certains agents doivent voir une installation partagée, configurez `agents.defaults.skills` ou `agents.list[].skills`. Certains Skills attendent des binaires installés via Homebrew ; sous Linux, cela signifie Linuxbrew (voir l’entrée FAQ Homebrew Linux ci-dessus). Voir [Skills](/fr/tools/skills), [Configuration des Skills](/fr/tools/skills-config) et [ClawHub](/fr/clawhub).

  </Accordion>

  <Accordion title="Comment utiliser mon Chrome existant déjà connecté avec OpenClaw ?">
    Utilisez le profil de navigateur intégré `user`, qui s’attache via Chrome DevTools MCP :

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Si vous voulez un nom personnalisé, créez un profil MCP explicite :

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ce chemin peut utiliser le navigateur local de l’hôte ou un nœud navigateur connecté. Si le Gateway s’exécute ailleurs, exécutez un hôte de nœud sur la machine du navigateur ou utilisez plutôt un CDP distant.

    Limites actuelles de `existing-session` / `user` :

    - les actions sont pilotées par `ref`, pas par des sélecteurs CSS
    - les téléversements nécessitent `ref` / `inputRef` et prennent actuellement en charge un seul fichier à la fois
    - `responsebody`, l’export PDF, l’interception de téléchargements et les actions par lots nécessitent toujours un navigateur géré ou un profil CDP brut

  </Accordion>
</AccordionGroup>

## Bac à sable et mémoire

<AccordionGroup>
  <Accordion title="Existe-t-il une documentation dédiée au bac à sable ?">
    Oui. Voir [Bac à sable](/fr/gateway/sandboxing). Pour la configuration propre à Docker (Gateway complet dans Docker ou images de bac à sable), voir [Docker](/fr/install/docker).
  </Accordion>

  <Accordion title="Docker semble limité - comment activer toutes les fonctionnalités ?">
    L’image par défaut privilégie la sécurité et s’exécute en tant qu’utilisateur `node`; elle n’inclut donc pas
    les paquets système, Homebrew ni les navigateurs inclus. Pour une configuration plus complète :

    - Persistez `/home/node` avec `OPENCLAW_HOME_VOLUME` afin que les caches survivent.
    - Intégrez les dépendances système dans l’image avec `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Installez les navigateurs Playwright via le CLI inclus :
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Définissez `PLAYWRIGHT_BROWSERS_PATH` et assurez-vous que le chemin est persistant.

    Docs : [Docker](/fr/install/docker), [Navigateur](/fr/tools/browser).

  </Accordion>

  <Accordion title="Puis-je garder les messages privés personnels tout en rendant les groupes publics/en bac à sable avec un seul agent ?">
    Oui - si votre trafic privé correspond à des **messages privés** et votre trafic public à des **groupes**.

    Utilisez `agents.defaults.sandbox.mode: "non-main"` afin que les sessions de groupe/canal (clés non principales) s’exécutent dans le backend de bac à sable configuré, tandis que la session principale de messages privés reste sur l’hôte. Docker est le backend par défaut si vous n’en choisissez pas un. Restreignez ensuite les outils disponibles dans les sessions en bac à sable via `tools.sandbox.tools`.

    Guide de configuration + exemple de configuration : [Groupes : messages privés personnels + groupes publics](/fr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Référence de configuration clé : [Configuration Gateway](/fr/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Comment monter un dossier hôte dans le bac à sable ?">
    Définissez `agents.defaults.sandbox.docker.binds` sur `["host:path:mode"]` (par exemple, `"/home/user/src:/src:ro"`). Les montages globaux et par agent sont fusionnés ; les montages par agent sont ignorés lorsque `scope: "shared"`. Utilisez `:ro` pour tout élément sensible et gardez à l’esprit que les montages contournent les parois du système de fichiers du bac à sable.

    OpenClaw valide les sources de montage à la fois par rapport au chemin normalisé et au chemin canonique résolu via l’ancêtre existant le plus profond. Cela signifie que les échappements par parent symbolique échouent toujours fermés même lorsque le dernier segment de chemin n’existe pas encore, et que les vérifications de racine autorisée s’appliquent toujours après la résolution des liens symboliques.

    Voir [Bac à sable](/fr/gateway/sandboxing#custom-bind-mounts) et [Bac à sable vs politique des outils vs privilèges élevés](/fr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) pour des exemples et des notes de sécurité.

  </Accordion>

  <Accordion title="Comment fonctionne la mémoire ?">
    La mémoire d’OpenClaw se compose simplement de fichiers Markdown dans l’espace de travail de l’agent :

    - Notes quotidiennes dans `memory/YYYY-MM-DD.md`
    - Notes de long terme organisées dans `MEMORY.md` (sessions principales/privées uniquement)

    OpenClaw exécute aussi un **vidage de mémoire silencieux avant Compaction** pour rappeler au modèle
    d’écrire des notes durables avant la compaction automatique. Cela ne s’exécute que lorsque l’espace de travail
    est accessible en écriture (les bacs à sable en lecture seule l’ignorent). Voir [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="La mémoire oublie sans cesse des choses. Comment les rendre persistantes ?">
    Demandez au bot d’**écrire le fait en mémoire**. Les notes de long terme vont dans `MEMORY.md`,
    le contexte de court terme va dans `memory/YYYY-MM-DD.md`.

    C’est encore un domaine que nous améliorons. Il est utile de rappeler au modèle de stocker les souvenirs ;
    il saura quoi faire. S’il continue d’oublier, vérifiez que le Gateway utilise le même
    espace de travail à chaque exécution.

    Docs : [Mémoire](/fr/concepts/memory), [Espace de travail de l’agent](/fr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La mémoire persiste-t-elle indéfiniment ? Quelles sont les limites ?">
    Les fichiers mémoire résident sur disque et persistent jusqu’à ce que vous les supprimiez. La limite est votre
    stockage, pas le modèle. Le **contexte de session** reste toutefois limité par la fenêtre de contexte
    du modèle ; les longues conversations peuvent donc être compactées ou tronquées. C’est pourquoi
    la recherche mémoire existe : elle ne remet dans le contexte que les parties pertinentes.

    Docs : [Mémoire](/fr/concepts/memory), [Contexte](/fr/concepts/context).

  </Accordion>

  <Accordion title="La recherche de mémoire sémantique nécessite-t-elle une clé d’API OpenAI ?">
    Seulement si vous utilisez les **embeddings OpenAI**. Codex OAuth couvre le chat/les complétions et
    ne donne **pas** accès aux embeddings ; ainsi, **se connecter avec Codex (OAuth ou la
    connexion CLI Codex)** n’aide pas pour la recherche de mémoire sémantique. Les embeddings OpenAI
    nécessitent toujours une véritable clé d’API (`OPENAI_API_KEY` ou `models.providers.openai.apiKey`).

    Si vous ne définissez pas explicitement de fournisseur, OpenClaw sélectionne automatiquement un fournisseur lorsqu’il
    peut résoudre une clé d’API (profils d’authentification, `models.providers.*.apiKey` ou variables d’environnement).
    Il préfère OpenAI si une clé OpenAI est résolue, sinon Gemini si une clé Gemini
    est résolue, puis Voyage, puis Mistral. Si aucune clé distante n’est disponible, la recherche de mémoire
    reste désactivée jusqu’à ce que vous la configuriez. Si vous avez configuré un chemin de modèle local
    et qu’il est présent, OpenClaw
    préfère `local`. Ollama est pris en charge lorsque vous définissez explicitement
    `memorySearch.provider = "ollama"`.

    Si vous préférez rester en local, définissez `memorySearch.provider = "local"` (et éventuellement
    `memorySearch.fallback = "none"`). Si vous voulez des embeddings Gemini, définissez
    `memorySearch.provider = "gemini"` et fournissez `GEMINI_API_KEY` (ou
    `memorySearch.remote.apiKey`). Nous prenons en charge les modèles d’embedding **OpenAI, Gemini, Voyage, Mistral, Ollama ou locaux**
    ; consultez [Mémoire](/fr/concepts/memory) pour les détails de configuration.

  </Accordion>
</AccordionGroup>

## Où les éléments se trouvent sur le disque

<AccordionGroup>
  <Accordion title="Toutes les données utilisées avec OpenClaw sont-elles enregistrées localement ?">
    Non ; **l’état d’OpenClaw est local**, mais **les services externes voient toujours ce que vous leur envoyez**.

    - **Local par défaut :** les sessions, fichiers de mémoire, la configuration et l’espace de travail résident sur l’hôte Gateway
      (`~/.openclaw` + le répertoire de votre espace de travail).
    - **Distant par nécessité :** les messages que vous envoyez aux fournisseurs de modèles (Anthropic/OpenAI/etc.) sont transmis à
      leurs API, et les plateformes de chat (WhatsApp/Telegram/Slack/etc.) stockent les données des messages sur leurs
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
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Charge utile secrète optionnelle basée sur fichier pour les fournisseurs SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Fichier de compatibilité hérité (entrées `api_key` statiques nettoyées) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | État du fournisseur (par ex. `whatsapp/<accountId>/creds.json`)    |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | État par agent (agentDir + sessions)                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historique et état des conversations (par agent)                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Métadonnées des sessions (par agent)                               |

    Chemin hérité à agent unique : `~/.openclaw/agent/*` (migré par `openclaw doctor`).

    Votre **espace de travail** (AGENTS.md, fichiers de mémoire, Skills, etc.) est séparé et configuré via `agents.defaults.workspace` (par défaut : `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Où AGENTS.md / SOUL.md / USER.md / MEMORY.md doivent-ils se trouver ?">
    Ces fichiers résident dans l’**espace de travail de l’agent**, pas dans `~/.openclaw`.

    - **Espace de travail (par agent)** : `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` facultatif.
      Le fichier racine en minuscules `memory.md` est uniquement une entrée de réparation héritée ; `openclaw doctor --fix`
      peut le fusionner dans `MEMORY.md` lorsque les deux fichiers existent.
    - **Répertoire d’état (`~/.openclaw`)** : configuration, état des canaux/fournisseurs, profils d’authentification, sessions, journaux
      et Skills partagés (`~/.openclaw/skills`).

    L’espace de travail par défaut est `~/.openclaw/workspace`, configurable via :

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si le bot « oublie » après un redémarrage, vérifiez que le Gateway utilise le même
    espace de travail à chaque lancement (et souvenez-vous : le mode distant utilise l’espace de travail de
    **l’hôte Gateway**, pas celui de votre ordinateur portable local).

    Astuce : si vous voulez un comportement ou une préférence durable, demandez au bot de **l’écrire dans
    AGENTS.md ou MEMORY.md** plutôt que de vous fier à l’historique de chat.

    Voir [Espace de travail de l’agent](/fr/concepts/agent-workspace) et [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Stratégie de sauvegarde recommandée">
    Placez votre **espace de travail de l’agent** dans un dépôt git **privé** et sauvegardez-le dans un emplacement
    privé (par exemple GitHub privé). Cela capture la mémoire + les fichiers AGENTS/SOUL/USER,
    et vous permet de restaurer plus tard « l’esprit » de l’assistant.

    Ne validez **rien** sous `~/.openclaw` (identifiants, sessions, jetons ou charges utiles de secrets chiffrées).
    Si vous avez besoin d’une restauration complète, sauvegardez séparément l’espace de travail et le répertoire d’état
    (voir la question sur la migration ci-dessus).

    Docs : [Espace de travail de l’agent](/fr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Comment désinstaller complètement OpenClaw ?">
    Consultez le guide dédié : [Désinstallation](/fr/install/uninstall).
  </Accordion>

  <Accordion title="Les agents peuvent-ils travailler en dehors de l’espace de travail ?">
    Oui. L’espace de travail est le **cwd par défaut** et l’ancre de mémoire, pas un sandbox strict.
    Les chemins relatifs se résolvent dans l’espace de travail, mais les chemins absolus peuvent accéder à d’autres
    emplacements de l’hôte sauf si le sandboxing est activé. Si vous avez besoin d’isolation, utilisez
    [`agents.defaults.sandbox`](/fr/gateway/sandboxing) ou les paramètres de sandbox par agent. Si vous
    voulez qu’un dépôt soit le répertoire de travail par défaut, pointez le
    `workspace` de cet agent vers la racine du dépôt. Le dépôt OpenClaw n’est que le code source ; gardez
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
    L’état de session appartient à l’**hôte Gateway**. Si vous êtes en mode distant, le magasin de sessions qui vous intéresse se trouve sur la machine distante, pas sur votre ordinateur portable local. Voir [Gestion des sessions](/fr/concepts/session).
  </Accordion>
</AccordionGroup>

## Bases de la configuration

<AccordionGroup>
  <Accordion title="Quel est le format de la configuration ? Où se trouve-t-elle ?">
    OpenClaw lit une configuration **JSON5** facultative depuis `$OPENCLAW_CONFIG_PATH` (par défaut : `~/.openclaw/openclaw.json`) :

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Si le fichier est absent, il utilise des valeurs par défaut relativement sûres (notamment un espace de travail par défaut `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='J’ai défini gateway.bind: "lan" (ou "tailnet") et maintenant rien n’écoute / l’UI indique non autorisé'>
    Les liaisons non-loopback **nécessitent un chemin d’authentification gateway valide**. En pratique, cela signifie :

    - authentification par secret partagé : jeton ou mot de passe
    - `gateway.auth.mode: "trusted-proxy"` derrière un reverse proxy sensible à l’identité correctement configuré

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

    - `gateway.remote.token` / `.password` n’activent **pas** à eux seuls l’authentification gateway locale.
    - Les chemins d’appel locaux peuvent utiliser `gateway.remote.*` comme solution de repli uniquement lorsque `gateway.auth.*` n’est pas défini.
    - Pour l’authentification par mot de passe, définissez plutôt `gateway.auth.mode: "password"` plus `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue en mode fermé (aucun masquage par repli distant).
    - Les configurations Control UI à secret partagé s’authentifient via `connect.params.auth.token` ou `connect.params.auth.password` (stocké dans les paramètres de l’application/de l’UI). Les modes porteurs d’identité tels que Tailscale Serve ou `trusted-proxy` utilisent plutôt les en-têtes de requête. Évitez de placer des secrets partagés dans les URL.
    - Avec `gateway.auth.mode: "trusted-proxy"`, les reverse proxies loopback sur le même hôte nécessitent `gateway.auth.trustedProxy.allowLoopback = true` explicite et une entrée loopback dans `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Pourquoi ai-je maintenant besoin d’un jeton sur localhost ?">
    OpenClaw applique l’authentification Gateway par défaut, y compris sur loopback. Dans le chemin par défaut normal, cela signifie une authentification par jeton : si aucun chemin d’authentification explicite n’est configuré, le démarrage du Gateway se résout en mode jeton et génère un jeton uniquement valable à l’exécution pour ce démarrage, donc **les clients WS locaux doivent s’authentifier**. Configurez explicitement `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` ou `OPENCLAW_GATEWAY_PASSWORD` lorsque les clients ont besoin d’un secret stable entre les redémarrages. Cela empêche d’autres processus locaux d’appeler le Gateway.

    Si vous préférez un autre chemin d’authentification, vous pouvez choisir explicitement le mode mot de passe (ou, pour les reverse proxies sensibles à l’identité, `trusted-proxy`). Si vous voulez **vraiment** un loopback ouvert, définissez explicitement `gateway.auth.mode: "none"` dans votre configuration. Doctor peut générer un jeton pour vous à tout moment : `openclaw doctor --generate-gateway-token`.

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
    `web_fetch` fonctionne sans clé d’API. `web_search` dépend du fournisseur
    sélectionné :

    - Les fournisseurs adossés à une API tels que Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity et Tavily nécessitent leur configuration normale de clé d’API.
    - Ollama Web Search ne nécessite pas de clé, mais utilise votre hôte Ollama configuré et nécessite `ollama signin`.
    - DuckDuckGo ne nécessite pas de clé, mais c’est une intégration non officielle basée sur HTML.
    - SearXNG ne nécessite pas de clé/est auto-hébergé ; configurez `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recommandé :** exécutez `openclaw configure --section web` et choisissez un fournisseur.
    Autres options d’environnement :

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

    La configuration de recherche web propre à chaque fournisseur se trouve désormais sous `plugins.entries.<plugin>.config.webSearch.*`.
    Les anciens chemins de fournisseur `tools.web.search.*` se chargent encore temporairement pour compatibilité, mais ils ne doivent pas être utilisés pour les nouvelles configurations.
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

    OpenClaw protège actuellement contre de nombreux écrasements accidentels :

    - Les écritures de configuration appartenant à OpenClaw valident toute la configuration après modification avant l’écriture.
    - Les écritures invalides ou destructrices appartenant à OpenClaw sont rejetées et enregistrées sous `openclaw.json.rejected.*`.
    - Si une modification directe casse le démarrage ou le rechargement à chaud, le Gateway échoue en mode fermé ou ignore le rechargement ; il ne réécrit pas `openclaw.json`.
    - `openclaw doctor --fix` prend en charge la réparation et peut restaurer la dernière configuration connue comme fonctionnelle tout en enregistrant le fichier rejeté sous `openclaw.json.clobbered.*`.

    Récupérer :

    - Consultez `openclaw logs --follow` pour `Invalid config at`, `Config write rejected:` ou `config reload skipped (invalid config)`.
    - Inspectez le plus récent `openclaw.json.clobbered.*` ou `openclaw.json.rejected.*` à côté de la configuration active.
    - Exécutez `openclaw config validate` et `openclaw doctor --fix`.
    - Recopiez uniquement les clés prévues avec `openclaw config set` ou `config.patch`.
    - Si vous n’avez aucune dernière configuration connue comme fonctionnelle ni charge utile rejetée, restaurez depuis une sauvegarde, ou relancez `openclaw doctor` et reconfigurez les canaux/modèles.
    - Si cela était inattendu, signalez un bug et incluez votre dernière configuration connue ou toute sauvegarde.
    - Un agent de codage local peut souvent reconstruire une configuration fonctionnelle à partir des journaux ou de l’historique.

    L’éviter :

    - Utilisez `openclaw config set` pour les petites modifications.
    - Utilisez `openclaw configure` pour les modifications interactives.
    - Utilisez d’abord `config.schema.lookup` lorsque vous n’êtes pas sûr d’un chemin exact ou de la forme d’un champ ; il renvoie un nœud de schéma superficiel ainsi que des résumés des enfants immédiats pour l’exploration.
    - Utilisez `config.patch` pour les modifications RPC partielles ; réservez `config.apply` au remplacement complet de la configuration.
    - Si vous utilisez l’outil `gateway` réservé au propriétaire depuis une exécution d’agent, il rejettera toujours les écritures vers `tools.exec.ask` / `tools.exec.security` (y compris les alias hérités `tools.bash.*` qui se normalisent vers les mêmes chemins exec protégés).

    Docs : [Configuration](/fr/cli/config), [Configurer](/fr/cli/configure), [Dépannage du Gateway](/fr/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/fr/gateway/doctor).

  </Accordion>

  <Accordion title="Comment exécuter un Gateway central avec des workers spécialisés sur plusieurs appareils ?">
    Le schéma courant est **un Gateway** (par exemple Raspberry Pi) plus des **nœuds** et des **agents** :

    - **Gateway (central) :** possède les canaux (Signal/WhatsApp), le routage et les sessions.
    - **Nœuds (appareils) :** les Macs/iOS/Android se connectent comme périphériques et exposent des outils locaux (`system.run`, `canvas`, `camera`).
    - **Agents (workers) :** cerveaux/espaces de travail séparés pour des rôles particuliers (par exemple « Ops Hetzner », « Données personnelles »).
    - **Sous-agents :** lancent du travail en arrière-plan depuis un agent principal lorsque vous voulez du parallélisme.
    - **TUI :** connectez-vous au Gateway et changez d’agents/sessions.

    Docs : [Nœuds](/fr/nodes), [Accès distant](/fr/gateway/remote), [Routage multi-agent](/fr/concepts/multi-agent), [Sous-agents](/fr/tools/subagents), [TUI](/fr/web/tui).

  </Accordion>

  <Accordion title="Le navigateur OpenClaw peut-il fonctionner sans interface graphique ?">
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

    La valeur par défaut est `false` (avec interface graphique). Le mode sans interface graphique est plus susceptible de déclencher des contrôles anti-bot sur certains sites. Voir [Navigateur](/fr/tools/browser).

    Le mode sans interface graphique utilise le **même moteur Chromium** et fonctionne pour la plupart des automatisations (formulaires, clics, scraping, connexions). Les principales différences :

    - Aucune fenêtre de navigateur visible (utilisez des captures d’écran si vous avez besoin de visuels).
    - Certains sites sont plus stricts concernant l’automatisation en mode sans interface graphique (CAPTCHA, anti-bot).
      Par exemple, X/Twitter bloque souvent les sessions sans interface graphique.

  </Accordion>

  <Accordion title="Comment utiliser Brave pour contrôler le navigateur ?">
    Définissez `browser.executablePath` sur le binaire Brave (ou tout navigateur basé sur Chromium) et redémarrez le Gateway.
    Consultez les exemples de configuration complets dans [Navigateur](/fr/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways distants et nœuds

<AccordionGroup>
  <Accordion title="Comment les commandes se propagent-elles entre Telegram, le gateway et les nœuds ?">
    Les messages Telegram sont gérés par le **gateway**. Le gateway exécute l’agent et
    appelle seulement ensuite les nœuds via le **WebSocket Gateway** lorsqu’un outil de nœud est nécessaire :

    Telegram → Gateway → Agent → `node.*` → Nœud → Gateway → Telegram

    Les nœuds ne voient pas le trafic fournisseur entrant ; ils reçoivent seulement des appels RPC de nœud.

  </Accordion>

  <Accordion title="Comment mon agent peut-il accéder à mon ordinateur si le Gateway est hébergé à distance ?">
    Réponse courte : **associez votre ordinateur comme nœud**. Le Gateway s’exécute ailleurs, mais il peut
    appeler les outils `node.*` (écran, caméra, système) sur votre machine locale via le WebSocket Gateway.

    Configuration typique :

    1. Exécutez le Gateway sur l’hôte toujours actif (VPS/serveur domestique).
    2. Placez l’hôte Gateway et votre ordinateur sur le même tailnet.
    3. Assurez-vous que le WS Gateway est joignable (liaison tailnet ou tunnel SSH).
    4. Ouvrez l’app macOS localement et connectez-vous en mode **Remote over SSH** (ou tailnet direct)
       afin qu’elle puisse s’enregistrer comme nœud.
    5. Approuvez le nœud sur le Gateway :

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Aucun pont TCP séparé n’est requis ; les nœuds se connectent via le WebSocket Gateway.

    Rappel de sécurité : associer un nœud macOS autorise `system.run` sur cette machine. Associez
    uniquement des appareils de confiance et consultez [Sécurité](/fr/gateway/security).

    Docs : [Nœuds](/fr/nodes), [Protocole Gateway](/fr/gateway/protocol), [Mode distant macOS](/fr/platforms/mac/remote), [Sécurité](/fr/gateway/security).

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
    Oui. Il n’existe pas de pont « bot-à-bot » intégré, mais vous pouvez le mettre en place de quelques
    manières fiables :

    **Le plus simple :** utilisez un canal de discussion normal auquel les deux bots peuvent accéder (Telegram/Slack/WhatsApp).
    Faites envoyer un message par le bot A au bot B, puis laissez le bot B répondre comme d’habitude.

    **Pont CLI (générique) :** exécutez un script qui appelle l’autre Gateway avec
    `openclaw agent --message ... --deliver`, en ciblant une discussion où l’autre bot
    écoute. Si un bot est sur un VPS distant, pointez votre CLI vers ce Gateway distant
    via SSH/Tailscale (voir [Accès distant](/fr/gateway/remote)).

    Exemple de schéma (à exécuter depuis une machine pouvant atteindre le Gateway cible) :

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Astuce : ajoutez un garde-fou afin que les deux bots ne bouclent pas indéfiniment (mention uniquement, listes
    d’autorisation de canal, ou règle « ne pas répondre aux messages de bots »).

    Docs : [Accès distant](/fr/gateway/remote), [CLI d’agent](/fr/cli/agent), [Envoi d’agent](/fr/tools/agent-send).

  </Accordion>

  <Accordion title="Ai-je besoin de VPS séparés pour plusieurs agents ?">
    Non. Un Gateway peut héberger plusieurs agents, chacun avec son propre espace de travail, ses valeurs par défaut de modèle
    et son routage. C’est la configuration normale, beaucoup moins chère et plus simple que d’exécuter
    un VPS par agent.

    Utilisez des VPS séparés uniquement lorsque vous avez besoin d’une isolation forte (frontières de sécurité) ou de configurations très
    différentes que vous ne voulez pas partager. Sinon, conservez un seul Gateway et
    utilisez plusieurs agents ou sous-agents.

  </Accordion>

  <Accordion title="Y a-t-il un avantage à utiliser un nœud sur mon ordinateur portable personnel plutôt que SSH depuis un VPS ?">
    Oui - les nœuds sont la méthode de premier ordre pour atteindre votre ordinateur portable depuis un Gateway distant, et ils
    débloquent plus que l’accès shell. Le Gateway fonctionne sur macOS/Linux (Windows via WSL2) et est
    léger (un petit VPS ou une machine de classe Raspberry Pi convient ; 4 Go de RAM suffisent), donc une configuration
    courante est un hôte toujours actif plus votre ordinateur portable comme nœud.

    - **Aucun SSH entrant requis.** Les nœuds se connectent vers le WebSocket Gateway et utilisent l’association d’appareil.
    - **Contrôles d’exécution plus sûrs.** `system.run` est soumis aux listes d’autorisation/approbations de nœud sur cet ordinateur portable.
    - **Plus d’outils d’appareil.** Les nœuds exposent `canvas`, `camera` et `screen` en plus de `system.run`.
    - **Automatisation locale du navigateur.** Gardez le Gateway sur un VPS, mais exécutez Chrome localement via un hôte de nœud sur l’ordinateur portable, ou attachez-vous au Chrome local de l’hôte via Chrome MCP.

    SSH convient pour un accès shell ponctuel, mais les nœuds sont plus simples pour les workflows d’agent continus et
    l’automatisation d’appareil.

    Docs : [Nœuds](/fr/nodes), [CLI des nœuds](/fr/cli/nodes), [Navigateur](/fr/tools/browser).

  </Accordion>

  <Accordion title="Les nœuds exécutent-ils un service gateway ?">
    Non. Un seul **gateway** doit s’exécuter par hôte, sauf si vous exécutez intentionnellement des profils isolés (voir [Gateways multiples](/fr/gateway/multiple-gateways)). Les nœuds sont des périphériques qui se connectent
    au gateway (nœuds iOS/Android, ou « mode nœud » macOS dans l’app de la barre de menus). Pour les hôtes de nœud
    sans interface graphique et le contrôle CLI, voir [CLI d’hôte de nœud](/fr/cli/node).

    Un redémarrage complet est requis pour les changements de `gateway`, `discovery` et de surface de plugin hébergé.

  </Accordion>

  <Accordion title="Existe-t-il une méthode API / RPC pour appliquer la configuration ?">
    Oui.

    - `config.schema.lookup` : inspecter un sous-arbre de configuration avec son nœud de schéma superficiel, l’indication d’interface correspondante et les résumés de ses enfants immédiats avant d’écrire
    - `config.get` : récupérer l’instantané actuel + le hash
    - `config.patch` : mise à jour partielle sûre (préférée pour la plupart des modifications RPC) ; recharge à chaud quand c’est possible et redémarre quand c’est nécessaire
    - `config.apply` : valider + remplacer toute la configuration ; recharge à chaud quand c’est possible et redémarre quand c’est nécessaire
    - L’outil d’exécution `gateway` réservé au propriétaire refuse toujours de réécrire `tools.exec.ask` / `tools.exec.security` ; les anciens alias `tools.bash.*` sont normalisés vers les mêmes chemins d’exécution protégés

  </Accordion>

  <Accordion title="Configuration minimale saine pour une première installation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Cela définit votre espace de travail et limite les personnes pouvant déclencher le bot.

  </Accordion>

  <Accordion title="Comment configurer Tailscale sur un VPS et me connecter depuis mon Mac ?">
    Étapes minimales :

    1. **Installer + se connecter sur le VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Installer + se connecter sur votre Mac**
       - Utilisez l’app Tailscale et connectez-vous au même tailnet.
    3. **Activer MagicDNS (recommandé)**
       - Dans la console d’administration Tailscale, activez MagicDNS afin que le VPS ait un nom stable.
    4. **Utiliser le nom d’hôte du tailnet**
       - SSH : `ssh user@your-vps.tailnet-xxxx.ts.net`
       - WS du Gateway : `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Si vous voulez l’interface de contrôle sans SSH, utilisez Tailscale Serve sur le VPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Cela garde le Gateway lié au loopback et expose HTTPS via Tailscale. Voir [Tailscale](/fr/gateway/tailscale).

  </Accordion>

  <Accordion title="Comment connecter un nœud Mac à un Gateway distant (Tailscale Serve) ?">
    Serve expose l’**interface de contrôle du Gateway + WS**. Les nœuds se connectent via le même point de terminaison WS du Gateway.

    Configuration recommandée :

    1. **Assurez-vous que le VPS + le Mac sont sur le même tailnet**.
    2. **Utilisez l’app macOS en mode distant** (la cible SSH peut être le nom d’hôte du tailnet).
       L’app créera un tunnel vers le port du Gateway et se connectera comme nœud.
    3. **Approuvez le nœud** sur le Gateway :

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Docs : [Protocole du Gateway](/fr/gateway/protocol), [Découverte](/fr/gateway/discovery), [mode distant macOS](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Dois-je installer sur un deuxième ordinateur portable ou simplement ajouter un nœud ?">
    Si vous avez seulement besoin d’**outils locaux** (écran/caméra/exec) sur le deuxième ordinateur portable, ajoutez-le comme
    **nœud**. Cela conserve un seul Gateway et évite de dupliquer la configuration. Les outils de nœud local sont
    actuellement disponibles uniquement sur macOS, mais nous prévoyons de les étendre à d’autres systèmes d’exploitation.

    Installez un deuxième Gateway uniquement si vous avez besoin d’une **isolation stricte** ou de deux bots entièrement séparés.

    Docs : [Nœuds](/fr/nodes), [CLI des nœuds](/fr/cli/nodes), [Gateways multiples](/fr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables d’environnement et chargement de .env

<AccordionGroup>
  <Accordion title="Comment OpenClaw charge-t-il les variables d’environnement ?">
    OpenClaw lit les variables d’environnement depuis le processus parent (shell, launchd/systemd, CI, etc.) et charge en plus :

    - `.env` depuis le répertoire de travail actuel
    - un fichier `.env` global de secours depuis `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

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

    Voir [/environment](/fr/help/environment) pour la priorité complète et les sources.

  </Accordion>

  <Accordion title="J’ai démarré le Gateway via le service et mes variables d’environnement ont disparu. Que faire ?">
    Deux corrections courantes :

    1. Placez les clés manquantes dans `~/.openclaw/.env` afin qu’elles soient récupérées même lorsque le service n’hérite pas de l’environnement de votre shell.
    2. Activez l’import du shell (commodité optionnelle) :

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
    `openclaw models status` indique si l’**import de l’environnement shell** est activé. "Shell env: off"
    ne signifie **pas** que vos variables d’environnement sont manquantes : cela signifie simplement qu’OpenClaw ne chargera pas
    automatiquement votre shell de connexion.

    Si le Gateway s’exécute comme service (launchd/systemd), il n’héritera pas de l’environnement
    de votre shell. Corrigez cela avec l’une de ces options :

    1. Placez le jeton dans `~/.openclaw/.env` :

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Ou activez l’import du shell (`env.shellEnv.enabled: true`).
    3. Ou ajoutez-le au bloc `env` de votre configuration (s’applique uniquement s’il est manquant).

    Puis redémarrez le Gateway et vérifiez à nouveau :

    ```bash
    openclaw models status
    ```

    Les jetons Copilot sont lus depuis `COPILOT_GITHUB_TOKEN` (aussi `GH_TOKEN` / `GITHUB_TOKEN`).
    Voir [/concepts/model-providers](/fr/concepts/model-providers) et [/environment](/fr/help/environment).

  </Accordion>
</AccordionGroup>

## Sessions et chats multiples

<AccordionGroup>
  <Accordion title="Comment démarrer une nouvelle conversation ?">
    Envoyez `/new` ou `/reset` comme message autonome. Voir [Gestion des sessions](/fr/concepts/session).
  </Accordion>

  <Accordion title="Les sessions se réinitialisent-elles automatiquement si je n’envoie jamais /new ?">
    Les sessions peuvent expirer après `session.idleMinutes`, mais c’est **désactivé par défaut** (valeur par défaut **0**).
    Définissez une valeur positive pour activer l’expiration après inactivité. Quand elle est activée, le **prochain**
    message après la période d’inactivité démarre un nouvel identifiant de session pour cette clé de chat.
    Cela ne supprime pas les transcriptions : cela démarre simplement une nouvelle session.

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
    et plusieurs agents de travail avec leurs propres espaces de travail et modèles.

    Cela dit, il vaut mieux voir cela comme une **expérience amusante**. C’est gourmand en jetons et souvent
    moins efficace que d’utiliser un seul bot avec des sessions séparées. Le modèle typique que nous
    imaginons est un bot auquel vous parlez, avec différentes sessions pour le travail en parallèle. Ce
    bot peut aussi lancer des sous-agents si nécessaire.

    Docs : [Routage multi-agent](/fr/concepts/multi-agent), [Sous-agents](/fr/tools/subagents), [CLI des agents](/fr/cli/agents).

  </Accordion>

  <Accordion title="Pourquoi le contexte a-t-il été tronqué en plein milieu de la tâche ? Comment l’éviter ?">
    Le contexte de session est limité par la fenêtre du modèle. Les longs chats, les sorties d’outils volumineuses ou de nombreux
    fichiers peuvent déclencher une Compaction ou une troncature.

    Ce qui aide :

    - Demandez au bot de résumer l’état actuel et de l’écrire dans un fichier.
    - Utilisez `/compact` avant les longues tâches, et `/new` lorsque vous changez de sujet.
    - Conservez le contexte important dans l’espace de travail et demandez au bot de le relire.
    - Utilisez des sous-agents pour les travaux longs ou parallèles afin que le chat principal reste plus petit.
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

    - L’onboarding propose aussi **Reset** s’il détecte une configuration existante. Voir [Onboarding (CLI)](/fr/start/wizard).
    - Si vous avez utilisé des profils (`--profile` / `OPENCLAW_PROFILE`), réinitialisez chaque répertoire d’état (les valeurs par défaut sont `~/.openclaw-<profile>`).
    - Réinitialisation de développement : `openclaw gateway --dev --reset` (développement uniquement ; efface la configuration de développement + les identifiants + les sessions + l’espace de travail).

  </Accordion>

  <Accordion title='J’obtiens des erreurs "context too large" : comment réinitialiser ou compacter ?'>
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

    - Activez ou ajustez l’**élagage des sessions** (`agents.defaults.contextPruning`) pour réduire les anciennes sorties d’outils.
    - Utilisez un modèle avec une fenêtre de contexte plus grande.

    Docs : [Compaction](/fr/concepts/compaction), [Élagage des sessions](/fr/concepts/session-pruning), [Gestion des sessions](/fr/concepts/session).

  </Accordion>

  <Accordion title='Pourquoi est-ce que je vois "LLM request rejected: messages.content.tool_use.input field required" ?'>
    Il s’agit d’une erreur de validation du fournisseur : le modèle a émis un bloc `tool_use` sans le champ
    `input` requis. Cela signifie généralement que l’historique de session est obsolète ou corrompu (souvent après de longs fils
    ou un changement d’outil/de schéma).

    Correction : démarrez une nouvelle session avec `/new` (message autonome).

  </Accordion>

  <Accordion title="Pourquoi est-ce que je reçois des messages Heartbeat toutes les 30 minutes ?">
    Les Heartbeats s’exécutent toutes les **30 min** par défaut (**1 h** avec l’authentification OAuth). Ajustez-les ou désactivez-les :

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
    markdown comme `# Heading`), OpenClaw ignore l’exécution du Heartbeat pour économiser des appels API.
    Si le fichier est manquant, le Heartbeat s’exécute quand même et le modèle décide quoi faire.

    Les remplacements par agent utilisent `agents.list[].heartbeat`. Docs : [Heartbeat](/fr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Dois-je ajouter un "compte de bot" à un groupe WhatsApp ?'>
    Non. OpenClaw s’exécute sur **votre propre compte**, donc si vous êtes dans le groupe, OpenClaw peut le voir.
    Par défaut, les réponses de groupe sont bloquées jusqu’à ce que vous autorisiez les expéditeurs (`groupPolicy: "allowlist"`).

    Si vous voulez que **vous seul** puissiez déclencher les réponses de groupe :

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
    Option 1 (la plus rapide) : suivez les logs et envoyez un message de test dans le groupe :

    ```bash
    openclaw logs --follow --json
    ```

    Cherchez `chatId` (ou `from`) se terminant par `@g.us`, comme :
    `1234567890-1234567890@g.us`.

    Option 2 (si déjà configuré/autorisé) : listez les groupes depuis la configuration :

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Docs : [WhatsApp](/fr/channels/whatsapp), [Répertoire](/fr/cli/directory), [Logs](/fr/cli/logs).

  </Accordion>

  <Accordion title="Pourquoi OpenClaw ne répond-il pas dans un groupe ?">
    Deux causes courantes :

    - Le filtrage par mention est activé (par défaut). Vous devez @mentionner le bot (ou correspondre à `mentionPatterns`).
    - Vous avez configuré `channels.whatsapp.groups` sans `"*"` et le groupe n’est pas dans la liste d’autorisation.

    Voir [Groupes](/fr/channels/groups) et [Messages de groupe](/fr/channels/group-messages).

  </Accordion>

  <Accordion title="Les groupes/fils partagent-ils le contexte avec les messages privés ?">
    Les chats directs se replient par défaut sur la session principale. Les groupes/canaux ont leurs propres clés de session, et les sujets Telegram / fils Discord sont des sessions séparées. Voir [Groupes](/fr/channels/groups) et [Messages de groupe](/fr/channels/group-messages).
  </Accordion>

  <Accordion title="Combien d’espaces de travail et d’agents puis-je créer ?">
    Pas de limites strictes. Des dizaines (voire des centaines) conviennent, mais surveillez :

    - **Croissance du disque :** les sessions + transcriptions se trouvent sous `~/.openclaw/agents/<agentId>/sessions/`.
    - **Coût en tokens :** plus d’agents signifie davantage d’utilisation simultanée des modèles.
    - **Surcharge opérationnelle :** profils d’authentification, espaces de travail et routage des canaux par agent.

    Conseils :

    - Conservez un seul espace de travail **actif** par agent (`agents.defaults.workspace`).
    - Éliminez les anciennes sessions (supprimez les fichiers JSONL ou les entrées stockées) si le disque grossit.
    - Utilisez `openclaw doctor` pour repérer les espaces de travail orphelins et les incohérences de profils.

  </Accordion>

  <Accordion title="Puis-je exécuter plusieurs bots ou discussions en même temps (Slack), et comment dois-je configurer cela ?">
    Oui. Utilisez le **routage multi-agent** pour exécuter plusieurs agents isolés et router les messages entrants par
    canal/compte/paire. Slack est pris en charge comme canal et peut être lié à des agents spécifiques.

    L’accès au navigateur est puissant, mais ne permet pas de « faire tout ce qu’un humain peut faire » : les mécanismes anti-bot, les CAPTCHA et l’authentification MFA peuvent
    toujours bloquer l’automatisation. Pour le contrôle de navigateur le plus fiable, utilisez Chrome MCP local sur l’hôte,
    ou utilisez CDP sur la machine qui exécute réellement le navigateur.

    Configuration recommandée :

    - Hôte Gateway toujours actif (VPS/Mac mini).
    - Un agent par rôle (liaisons).
    - Canal(aux) Slack liés à ces agents.
    - Navigateur local via Chrome MCP ou un nœud si nécessaire.

    Documentation : [Routage multi-agent](/fr/concepts/multi-agent), [Slack](/fr/channels/slack),
    [Navigateur](/fr/tools/browser), [Nœuds](/fr/nodes).

  </Accordion>
</AccordionGroup>

## Modèles, basculement et profils d’authentification

Les questions-réponses sur les modèles — valeurs par défaut, sélection, alias, changement, basculement, profils d’authentification —
se trouvent dans la [FAQ sur les modèles](/fr/help/faq-models).

## Gateway : ports, « déjà en cours d’exécution » et mode distant

<AccordionGroup>
  <Accordion title="Quel port le Gateway utilise-t-il ?">
    `gateway.port` contrôle le port multiplexé unique pour WebSocket + HTTP (interface de contrôle, hooks, etc.).

    Priorité :

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Pourquoi openclaw gateway status indique-t-il "Runtime: running" mais "Connectivity probe: failed" ?'>
    Parce que « running » correspond à la vue du **superviseur** (launchd/systemd/schtasks). La sonde de connectivité correspond à la connexion réelle de la CLI au WebSocket du Gateway.

    Utilisez `openclaw gateway status` et fiez-vous à ces lignes :

    - `Probe target:` (l’URL réellement utilisée par la sonde)
    - `Listening:` (ce qui est réellement lié au port)
    - `Last gateway error:` (cause racine fréquente lorsque le processus est vivant mais que le port n’écoute pas)

  </Accordion>

  <Accordion title='Pourquoi openclaw gateway status affiche-t-il "Config (cli)" et "Config (service)" différents ?'>
    Vous modifiez un fichier de configuration alors que le service en exécute un autre (souvent une incohérence `--profile` / `OPENCLAW_STATE_DIR`).

    Correctif :

    ```bash
    openclaw gateway install --force
    ```

    Exécutez cette commande depuis le même `--profile` / environnement que vous voulez que le service utilise.

  </Accordion>

  <Accordion title='Que signifie "another gateway instance is already listening" ?'>
    OpenClaw impose un verrou d’exécution en liant immédiatement l’écouteur WebSocket au démarrage (`ws://127.0.0.1:18789` par défaut). Si la liaison échoue avec `EADDRINUSE`, il lève `GatewayLockError`, indiquant qu’une autre instance écoute déjà.

    Correctif : arrêtez l’autre instance, libérez le port, ou exécutez avec `openclaw gateway --port <port>`.

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

    Remarques :

    - `openclaw gateway` ne démarre que lorsque `gateway.mode` vaut `local` (ou si vous passez l’indicateur de remplacement).
    - L’application macOS surveille le fichier de configuration et change de mode en direct lorsque ces valeurs changent.
    - `gateway.remote.token` / `.password` sont uniquement des identifiants distants côté client ; ils n’activent pas à eux seuls l’authentification du Gateway local.

  </Accordion>

  <Accordion title='L’interface de contrôle indique "unauthorized" (ou se reconnecte en boucle). Que faire ?'>
    Le chemin d’authentification de votre Gateway et la méthode d’authentification de l’interface ne correspondent pas.

    Faits (d’après le code) :

    - L’interface de contrôle conserve le token dans `sessionStorage` pour la session de l’onglet de navigateur actuel et l’URL de Gateway sélectionnée ; les actualisations dans le même onglet continuent donc de fonctionner sans rétablir une persistance de token de longue durée dans localStorage.
    - Sur `AUTH_TOKEN_MISMATCH`, les clients de confiance peuvent tenter une nouvelle tentative bornée avec un token d’appareil mis en cache lorsque le Gateway renvoie des indications de nouvelle tentative (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Cette nouvelle tentative avec token mis en cache réutilise désormais les portées approuvées mises en cache avec le token d’appareil. Les appelants `deviceToken` explicites / `scopes` explicites conservent toujours l’ensemble de portées demandé au lieu d’hériter des portées mises en cache.
    - En dehors de ce chemin de nouvelle tentative, la priorité d’authentification de connexion est d’abord le token/mot de passe partagé explicite, puis le `deviceToken` explicite, puis le token d’appareil stocké, puis le token d’amorçage.
    - Les vérifications de portée du token d’amorçage sont préfixées par rôle. La liste d’autorisation d’opérateur d’amorçage intégrée ne satisfait que les requêtes d’opérateur ; les nœuds ou autres rôles non opérateur ont toujours besoin de portées sous leur propre préfixe de rôle.

    Correctif :

    - Le plus rapide : `openclaw dashboard` (affiche + copie l’URL du tableau de bord, essaie de l’ouvrir ; affiche un indice SSH si l’environnement est sans interface).
    - Si vous n’avez pas encore de token : `openclaw doctor --generate-gateway-token`.
    - Si c’est distant, créez d’abord un tunnel : `ssh -N -L 18789:127.0.0.1:18789 user@host` puis ouvrez `http://127.0.0.1:18789/`.
    - Mode secret partagé : définissez `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, puis collez le secret correspondant dans les paramètres de l’interface de contrôle.
    - Mode Tailscale Serve : assurez-vous que `gateway.auth.allowTailscale` est activé et que vous ouvrez l’URL Serve, et non une URL loopback/tailnet brute qui contourne les en-têtes d’identité Tailscale.
    - Mode proxy de confiance : assurez-vous de passer par le proxy configuré sensible à l’identité, et non par une URL brute du Gateway. Les proxys local loopback du même hôte nécessitent également `gateway.auth.trustedProxy.allowLoopback = true`.
    - Si l’incohérence persiste après la nouvelle tentative unique, faites tourner/réapprouvez le token d’appareil appairé :
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Si cet appel de rotation indique qu’il a été refusé, vérifiez deux choses :
      - les sessions d’appareil appairé ne peuvent faire tourner que leur **propre** appareil, sauf si elles disposent aussi de `operator.admin`
      - les valeurs `--scope` explicites ne peuvent pas dépasser les portées opérateur actuelles de l’appelant
    - Toujours bloqué ? Exécutez `openclaw status --all` et suivez le [dépannage](/fr/gateway/troubleshooting). Consultez [Tableau de bord](/fr/web/dashboard) pour les détails d’authentification.

  </Accordion>

  <Accordion title="J’ai défini gateway.bind sur tailnet, mais il ne peut pas se lier et rien n’écoute">
    La liaison `tailnet` choisit une IP Tailscale depuis vos interfaces réseau (100.64.0.0/10). Si la machine n’est pas sur Tailscale (ou si l’interface est désactivée), il n’y a rien à quoi se lier.

    Correctif :

    - Démarrez Tailscale sur cet hôte (afin qu’il ait une adresse 100.x), ou
    - Passez à `gateway.bind: "loopback"` / `"lan"`.

    Remarque : `tailnet` est explicite. `auto` préfère loopback ; utilisez `gateway.bind: "tailnet"` lorsque vous voulez une liaison limitée à tailnet.

  </Accordion>

  <Accordion title="Puis-je exécuter plusieurs Gateways sur le même hôte ?">
    Généralement non : un Gateway peut exécuter plusieurs canaux de messagerie et agents. Utilisez plusieurs Gateways uniquement lorsque vous avez besoin de redondance (ex. : bot de secours) ou d’une isolation stricte.

    Oui, mais vous devez isoler :

    - `OPENCLAW_CONFIG_PATH` (configuration par instance)
    - `OPENCLAW_STATE_DIR` (état par instance)
    - `agents.defaults.workspace` (isolation de l’espace de travail)
    - `gateway.port` (ports uniques)

    Configuration rapide (recommandée) :

    - Utilisez `openclaw --profile <name> ...` par instance (crée automatiquement `~/.openclaw-<name>`).
    - Définissez un `gateway.port` unique dans chaque configuration de profil (ou passez `--port` pour les exécutions manuelles).
    - Installez un service par profil : `openclaw --profile <name> gateway install`.

    Les profils suffixent aussi les noms de services (`ai.openclaw.<profile>` ; anciennement `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guide complet : [Plusieurs gateways](/fr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Que signifie "invalid handshake" / code 1008 ?'>
    Le Gateway est un **serveur WebSocket**, et il s’attend à ce que le tout premier message
    soit une trame `connect`. S’il reçoit autre chose, il ferme la connexion
    avec le **code 1008** (violation de politique).

    Causes fréquentes :

    - Vous avez ouvert l’URL **HTTP** dans un navigateur (`http://...`) au lieu d’un client WS.
    - Vous avez utilisé le mauvais port ou chemin.
    - Un proxy ou un tunnel a supprimé les en-têtes d’authentification ou envoyé une requête non-Gateway.

    Correctifs rapides :

    1. Utilisez l’URL WS : `ws://<host>:18789` (ou `wss://...` en HTTPS).
    2. N’ouvrez pas le port WS dans un onglet de navigateur normal.
    3. Si l’authentification est activée, incluez le token/mot de passe dans la trame `connect`.

    Si vous utilisez la CLI ou la TUI, l’URL devrait ressembler à ceci :

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Détails du protocole : [Protocole Gateway](/fr/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Journalisation et débogage

<AccordionGroup>
  <Accordion title="Où se trouvent les journaux ?">
    Journaux de fichiers (structurés) :

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Vous pouvez définir un chemin stable via `logging.file`. Le niveau de journalisation du fichier est contrôlé par `logging.level`. La verbosité de la console est contrôlée par `--verbose` et `logging.consoleLevel`.

    Suivi rapide des journaux :

    ```bash
    openclaw logs --follow
    ```

    Journaux de service/superviseur (lorsque le gateway s’exécute via launchd/systemd) :

    - macOS : `$OPENCLAW_STATE_DIR/logs/gateway.log` et `gateway.err.log` (par défaut : `~/.openclaw/logs/...` ; les profils utilisent `~/.openclaw-<profile>/logs/...`)
    - Linux : `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows : `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Consultez [Dépannage](/fr/gateway/troubleshooting) pour plus d’informations.

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

    Documentation : [Windows (WSL2)](/fr/platforms/windows), [Runbook du service Gateway](/fr/gateway).

  </Accordion>

  <Accordion title="Le Gateway est actif, mais les réponses n’arrivent jamais. Que dois-je vérifier ?">
    Commencez par un rapide bilan de santé :

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causes fréquentes :

    - Authentification du modèle non chargée sur l’**hôte Gateway** (vérifiez `models status`).
    - Association du canal/liste d’autorisation bloquant les réponses (vérifiez la configuration du canal + les journaux).
    - WebChat/Dashboard est ouvert sans le bon jeton.

    Si vous êtes à distance, confirmez que la connexion tunnel/Tailscale est active et que le
    WebSocket Gateway est accessible.

    Docs : [Canaux](/fr/channels), [Dépannage](/fr/gateway/troubleshooting), [Accès distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title='"Déconnecté du Gateway : aucune raison" - que faire maintenant ?'>
    Cela signifie généralement que l’interface utilisateur a perdu la connexion WebSocket. Vérifiez :

    1. Le Gateway est-il en cours d’exécution ? `openclaw gateway status`
    2. Le Gateway est-il sain ? `openclaw status`
    3. L’interface utilisateur a-t-elle le bon jeton ? `openclaw dashboard`
    4. À distance, le lien tunnel/Tailscale est-il actif ?

    Ensuite, suivez les journaux :

    ```bash
    openclaw logs --follow
    ```

    Docs : [Dashboard](/fr/web/dashboard), [Accès distant](/fr/gateway/remote), [Dépannage](/fr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands échoue. Que dois-je vérifier ?">
    Commencez par les journaux et l’état du canal :

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Puis faites correspondre l’erreur :

    - `BOT_COMMANDS_TOO_MUCH` : le menu Telegram contient trop d’entrées. OpenClaw réduit déjà jusqu’à la limite Telegram et réessaie avec moins de commandes, mais certaines entrées de menu doivent encore être supprimées. Réduisez les commandes de Plugin/Skills/personnalisées, ou désactivez `channels.telegram.commands.native` si vous n’avez pas besoin du menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, ou des erreurs réseau similaires : si vous êtes sur un VPS ou derrière un proxy, confirmez que le HTTPS sortant est autorisé et que DNS fonctionne pour `api.telegram.org`.

    Si le Gateway est distant, assurez-vous de consulter les journaux sur l’hôte Gateway.

    Docs : [Telegram](/fr/channels/telegram), [Dépannage des canaux](/fr/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI n’affiche aucune sortie. Que dois-je vérifier ?">
    Confirmez d’abord que le Gateway est accessible et que l’agent peut s’exécuter :

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Dans la TUI, utilisez `/status` pour voir l’état actuel. Si vous attendez des réponses dans un canal de discussion,
    assurez-vous que la livraison est activée (`/deliver on`).

    Docs : [TUI](/fr/web/tui), [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Comment arrêter complètement puis démarrer le Gateway ?">
    Si vous avez installé le service :

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Cela arrête/démarre le **service supervisé** (launchd sur macOS, systemd sur Linux).
    Utilisez ceci quand le Gateway s’exécute en arrière-plan comme démon.

    Si vous l’exécutez au premier plan, arrêtez avec Ctrl-C, puis :

    ```bash
    openclaw gateway run
    ```

    Docs : [Guide opérationnel du service Gateway](/fr/gateway).

  </Accordion>

  <Accordion title="ELI5 : openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart` : redémarre le **service en arrière-plan** (launchd/systemd).
    - `openclaw gateway` : exécute le gateway **au premier plan** pour cette session de terminal.

    Si vous avez installé le service, utilisez les commandes gateway. Utilisez `openclaw gateway` quand
    vous voulez une exécution ponctuelle au premier plan.

  </Accordion>

  <Accordion title="Le moyen le plus rapide d’obtenir plus de détails quand quelque chose échoue">
    Démarrez le Gateway avec `--verbose` pour obtenir davantage de détails dans la console. Inspectez ensuite le fichier journal pour les erreurs d’authentification de canal, de routage de modèle et RPC.
  </Accordion>
</AccordionGroup>

## Médias et pièces jointes

<AccordionGroup>
  <Accordion title="Mon Skill a généré une image/PDF, mais rien n’a été envoyé">
    Les pièces jointes sortantes de l’agent doivent inclure une ligne `MEDIA:<path-or-url>` (sur sa propre ligne). Consultez [Configuration de l’assistant OpenClaw](/fr/start/openclaw) et [Envoi par l’agent](/fr/tools/agent-send).

    Envoi avec la CLI :

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Vérifiez également :

    - Le canal cible prend en charge les médias sortants et n’est pas bloqué par des listes d’autorisation.
    - Le fichier respecte les limites de taille du fournisseur (les images sont redimensionnées à 2048 px max).
    - `tools.fs.workspaceOnly=true` limite les envois de chemins locaux à l’espace de travail, au répertoire temporaire/media-store et aux fichiers validés par le bac à sable.
    - `tools.fs.workspaceOnly=false` permet à `MEDIA:` d’envoyer des fichiers locaux à l’hôte que l’agent peut déjà lire, mais seulement pour les médias et les types de documents sûrs (images, audio, vidéo, PDF et documents Office). Le texte brut et les fichiers ressemblant à des secrets restent bloqués.

    Voir [Images](/fr/nodes/images).

  </Accordion>
</AccordionGroup>

## Sécurité et contrôle d’accès

<AccordionGroup>
  <Accordion title="Est-il sûr d’exposer OpenClaw aux DM entrants ?">
    Traitez les DM entrants comme des entrées non fiables. Les valeurs par défaut sont conçues pour réduire le risque :

    - Le comportement par défaut sur les canaux compatibles DM est l’**association** :
      - Les expéditeurs inconnus reçoivent un code d’association ; le bot ne traite pas leur message.
      - Approuvez avec : `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Les requêtes en attente sont limitées à **3 par canal** ; vérifiez `openclaw pairing list --channel <channel> [--account <id>]` si un code n’est pas arrivé.
    - Ouvrir publiquement les DM nécessite une activation explicite (`dmPolicy: "open"` et liste d’autorisation `"*"`).

    Exécutez `openclaw doctor` pour faire apparaître les politiques DM risquées.

  </Accordion>

  <Accordion title="L’injection de prompt est-elle seulement un problème pour les bots publics ?">
    Non. L’injection de prompt concerne le **contenu non fiable**, pas seulement qui peut envoyer un DM au bot.
    Si votre assistant lit du contenu externe (recherche/récupération web, pages de navigateur, e-mails,
    docs, pièces jointes, journaux collés), ce contenu peut inclure des instructions qui tentent
    de détourner le modèle. Cela peut se produire même si **vous êtes le seul expéditeur**.

    Le plus grand risque survient lorsque des outils sont activés : le modèle peut être trompé et amené à
    exfiltrer le contexte ou à appeler des outils en votre nom. Réduisez le rayon d’impact en :

    - utilisant un agent « lecteur » en lecture seule ou sans outils pour résumer le contenu non fiable
    - gardant `web_search` / `web_fetch` / `browser` désactivés pour les agents avec outils
    - traitant aussi le texte décodé des fichiers/documents comme non fiable : OpenResponses
      `input_file` et l’extraction des pièces jointes multimédias enveloppent toutes deux le texte extrait dans
      des marqueurs explicites de frontière de contenu externe au lieu de transmettre le texte brut du fichier
    - utilisant le bac à sable et des listes d’autorisation d’outils strictes

    Détails : [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Mon bot doit-il avoir sa propre adresse e-mail, son propre compte GitHub ou son propre numéro de téléphone ?">
    Oui, pour la plupart des configurations. Isoler le bot avec des comptes et numéros de téléphone séparés
    réduit le rayon d’impact si quelque chose tourne mal. Cela facilite aussi la rotation
    des identifiants ou la révocation d’accès sans affecter vos comptes personnels.

    Commencez petit. Donnez accès uniquement aux outils et comptes dont vous avez réellement besoin, puis étendez
    plus tard si nécessaire.

    Docs : [Sécurité](/fr/gateway/security), [Association](/fr/channels/pairing).

  </Accordion>

  <Accordion title="Puis-je lui donner de l’autonomie sur mes SMS, et est-ce sûr ?">
    Nous ne recommandons **pas** une autonomie complète sur vos messages personnels. Le schéma le plus sûr est :

    - Gardez les DM en **mode association** ou avec une liste d’autorisation stricte.
    - Utilisez un **numéro ou compte séparé** si vous voulez qu’il envoie des messages en votre nom.
    - Laissez-le rédiger, puis **approuvez avant l’envoi**.

    Si vous voulez expérimenter, faites-le sur un compte dédié et gardez-le isolé. Voir
    [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Puis-je utiliser des modèles moins chers pour les tâches d’assistant personnel ?">
    Oui, **si** l’agent est uniquement en discussion et que l’entrée est fiable. Les niveaux plus petits sont
    plus susceptibles au détournement d’instructions ; évitez-les donc pour les agents avec outils
    ou lors de la lecture de contenu non fiable. Si vous devez utiliser un modèle plus petit, verrouillez
    les outils et exécutez-le dans un bac à sable. Voir [Sécurité](/fr/gateway/security).
  </Accordion>

  <Accordion title="J’ai exécuté /start dans Telegram mais je n’ai pas reçu de code d’association">
    Les codes d’association sont envoyés **uniquement** lorsqu’un expéditeur inconnu envoie un message au bot et que
    `dmPolicy: "pairing"` est activé. `/start` seul ne génère pas de code.

    Vérifiez les requêtes en attente :

    ```bash
    openclaw pairing list telegram
    ```

    Si vous voulez un accès immédiat, ajoutez votre ID d’expéditeur à la liste d’autorisation ou définissez `dmPolicy: "open"`
    pour ce compte.

  </Accordion>

  <Accordion title="WhatsApp : enverra-t-il des messages à mes contacts ? Comment fonctionne l’association ?">
    Non. La politique DM WhatsApp par défaut est l’**association**. Les expéditeurs inconnus reçoivent seulement un code d’association et leur message n’est **pas traité**. OpenClaw ne répond qu’aux discussions qu’il reçoit ou aux envois explicites que vous déclenchez.

    Approuvez l’association avec :

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Listez les requêtes en attente :

    ```bash
    openclaw pairing list whatsapp
    ```

    Invite de numéro de téléphone dans l’assistant : il sert à définir votre **liste d’autorisation/propriétaire** afin que vos propres DM soient autorisés. Il n’est pas utilisé pour l’envoi automatique. Si vous utilisez votre numéro WhatsApp personnel, utilisez ce numéro et activez `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Commandes de discussion, abandon des tâches et « ça ne s’arrête pas »

<AccordionGroup>
  <Accordion title="Comment empêcher les messages système internes de s’afficher dans la discussion ?">
    La plupart des messages internes ou d’outils n’apparaissent que lorsque **verbose**, **trace** ou **reasoning** est activé
    pour cette session.

    Corrigez dans la discussion où vous le voyez :

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Si c’est toujours bruyant, vérifiez les paramètres de session dans l’interface de contrôle et définissez verbose
    sur **hériter**. Confirmez aussi que vous n’utilisez pas un profil de bot avec `verboseDefault` défini
    sur `on` dans la configuration.

    Docs : [Réflexion et verbose](/fr/tools/thinking), [Sécurité](/fr/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Comment arrêter/annuler une tâche en cours ?">
    Envoyez n’importe lequel de ces messages **comme message autonome** (sans slash) :

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

    Vue d’ensemble des commandes slash : voir [Commandes slash](/fr/tools/slash-commands).

    La plupart des commandes doivent être envoyées comme message **autonome** commençant par `/`, mais quelques raccourcis (comme `/status`) fonctionnent aussi en ligne pour les expéditeurs en liste d’autorisation.

  </Accordion>

  <Accordion title='Comment envoyer un message Discord depuis Telegram ? ("Messagerie inter-contexte refusée")'>
    OpenClaw bloque par défaut la messagerie **inter-fournisseurs**. Si un appel d’outil est lié
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

  <Accordion title='Pourquoi ai-je l’impression que le bot "ignore" les messages envoyés en rafale ?'>
    Le mode file d’attente contrôle la façon dont les nouveaux messages interagissent avec une exécution en cours. Utilisez `/queue` pour changer de mode :

    - `steer` - mettre en file toute l’orientation en attente pour la prochaine limite de modèle dans l’exécution actuelle
    - `queue` - orientation héritée un élément à la fois
    - `followup` - exécuter les messages un par un
    - `collect` - regrouper les messages et répondre une fois
    - `steer-backlog` - orienter maintenant, puis traiter l’arriéré
    - `interrupt` - abandonner l’exécution actuelle et repartir de zéro

    Le mode par défaut est `steer`. Vous pouvez ajouter des options comme `debounce:0.5s cap:25 drop:summarize` pour les modes de suivi. Voir [File de commandes](/fr/concepts/queue) et [File de guidage](/fr/concepts/queue-steering).

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

## Articles connexes

- [FAQ de première exécution](/fr/help/faq-first-run) — installation, intégration, authentification, abonnements, échecs initiaux
- [FAQ sur les modèles](/fr/help/faq-models) — sélection du modèle, basculement, profils d’authentification
- [Dépannage](/fr/help/troubleshooting) — triage par symptôme en premier
