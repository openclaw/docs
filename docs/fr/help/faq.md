---
read_when:
    - Réponses aux questions fréquentes d’assistance concernant la configuration, l’installation, l’intégration ou l’exécution
    - Trier les problèmes signalés par les utilisateurs avant un débogage approfondi
summary: Questions fréquentes sur l’installation, la configuration et l’utilisation d’OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-07-12T15:29:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 80b94b9d403d04cde5c734927502393417d5f1bfd50c2505b6b4fdcfcdc9f524
    source_path: help/faq.md
    workflow: 16
---

Réponses rapides et dépannage approfondi pour les configurations réelles (développement local, VPS, multi-agent, clés OAuth/API, basculement de modèle). Pour les diagnostics d’exécution, consultez [Dépannage](/fr/gateway/troubleshooting). Pour la référence complète de la configuration, consultez [Configuration](/fr/gateway/configuration).

## Les 60 premières secondes en cas de problème

<Steps>
  <Step title="État rapide">
    ```bash
    openclaw status
    ```
    Résumé local rapide : système d’exploitation + mise à jour, accessibilité du Gateway/service, agents/sessions, configuration du fournisseur + problèmes d’exécution (lorsque le Gateway est accessible).
  </Step>
  <Step title="Rapport à copier-coller (partage sans risque)">
    ```bash
    openclaw status --all
    ```
    Diagnostic en lecture seule avec la fin du journal (jetons masqués).
  </Step>
  <Step title="État du démon et du port">
    ```bash
    openclaw gateway status
    ```
    Affiche l’exécution du superviseur par rapport à l’accessibilité RPC, l’URL cible de la sonde et la configuration probablement utilisée par le service.
  </Step>
  <Step title="Sondes approfondies">
    ```bash
    openclaw status --deep
    ```
    Sonde en direct de l’état du Gateway, y compris les sondes de canaux lorsqu’elles sont prises en charge (nécessite un Gateway accessible). Consultez [État de santé](/fr/gateway/health).
  </Step>
  <Step title="Suivre le dernier journal">
    ```bash
    openclaw logs --follow
    ```
    Si RPC est indisponible, utilisez à la place :
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    Les journaux de fichiers sont distincts des journaux de service ; consultez [Journalisation](/fr/logging) et [Dépannage](/fr/gateway/troubleshooting).
  </Step>
  <Step title="Exécuter le docteur (réparations)">
    ```bash
    openclaw doctor
    ```
    Répare/migre la configuration et l’état, puis exécute les vérifications d’état. Consultez [Docteur](/fr/gateway/doctor).
  </Step>
  <Step title="Instantané du Gateway (WS uniquement)">
    ```bash
    openclaw health --json
    openclaw health --verbose   # affiche l’URL cible + le chemin de configuration en cas d’erreur
    ```
    Demande un instantané complet au Gateway en cours d’exécution. Consultez [État de santé](/fr/gateway/health).
  </Step>
</Steps>

## Démarrage rapide et configuration initiale

La FAQ de première exécution — installation, intégration, routes d’authentification, abonnements, échecs initiaux — se trouve dans la [FAQ de première exécution](/fr/help/faq-first-run).

## Qu’est-ce qu’OpenClaw ?

<AccordionGroup>
  <Accordion title="Qu’est-ce qu’OpenClaw, en un paragraphe ?">
    OpenClaw est un assistant IA personnel que vous exécutez sur vos propres appareils. Il répond sur les services de messagerie que vous utilisez déjà (Discord, Google Chat, iMessage, Mattermost, Signal, Slack, Telegram, WebChat, WhatsApp et les plugins de canaux intégrés tels que QQ Bot) et peut également proposer la voix ainsi qu’un Canvas en direct sur les plateformes prises en charge. Le **Gateway** est le plan de contrôle toujours actif ; l’assistant est le produit.
  </Accordion>

  <Accordion title="Proposition de valeur">
    OpenClaw n’est pas « seulement une surcouche pour Claude ». C’est un **plan de contrôle privilégiant le local** qui exécute un assistant performant sur **votre propre matériel**, accessible depuis les applications de discussion que vous utilisez déjà, avec des sessions avec état, une mémoire et des outils, sans confier vos flux de travail à un SaaS hébergé.

    - **Vos appareils, vos données** : exécutez le Gateway où vous le souhaitez (Mac, Linux, VPS) et conservez localement l’espace de travail et l’historique des sessions.
    - **De vrais canaux, pas un bac à sable web** : Discord/iMessage/Signal/Slack/Telegram/WhatsApp/etc., plus la voix sur mobile et Canvas sur les plateformes prises en charge.
    - **Indépendant du modèle** : utilisez Anthropic, MiniMax, OpenAI, OpenRouter, etc., avec un routage et un basculement par agent.
    - **Option entièrement locale** : exécutez des modèles locaux afin que toutes les données puissent rester sur votre appareil.
    - **Routage multi-agent** : séparez les agents par canal, compte ou tâche, chacun avec son propre espace de travail et ses propres valeurs par défaut.
    - **Open source et modifiable** : inspectez, étendez et auto-hébergez sans dépendance envers un fournisseur.

    Documentation : [Gateway](/fr/gateway), [Canaux](/fr/channels), [Multi-agent](/fr/concepts/multi-agent), [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Je viens de le configurer : que dois-je faire en premier ?">
    Bons premiers projets : créer un site web (WordPress, Shopify ou un site statique) ; prototyper une application mobile (structure, écrans, plan d’API) ; organiser des fichiers et des dossiers ; connecter Gmail et automatiser les résumés ou les suivis.

    Il peut gérer des tâches importantes, mais fonctionne mieux lorsqu’elles sont divisées en phases avec des sous-agents pour le travail en parallèle.

  </Accordion>

  <Accordion title="Quels sont les cinq principaux cas d’usage quotidiens d’OpenClaw ?">
    - **Briefings personnels** : résumés de votre boîte de réception, de votre calendrier et des actualités qui vous intéressent.
    - **Recherche et rédaction** : recherches rapides, résumés et premières versions d’e-mails ou de documents.
    - **Rappels et suivis** : notifications et listes de contrôle pilotées par Cron ou Heartbeat.
    - **Automatisation du navigateur** : remplir des formulaires, collecter des données, répéter des tâches web.
    - **Coordination entre appareils** : envoyez une tâche depuis votre téléphone, laissez le Gateway l’exécuter sur un serveur et récupérez le résultat dans la discussion.

  </Accordion>

  <Accordion title="OpenClaw peut-il aider à générer des prospects, mener des campagnes de prospection et de publicité, et rédiger des blogs pour un SaaS ?">
    Oui, pour la **recherche, la qualification et la rédaction** : analyser des sites, établir des listes restreintes, résumer les prospects, rédiger des ébauches de messages de prospection ou de textes publicitaires.

    Pour les **campagnes de prospection ou de publicité**, gardez un humain dans la boucle. Évitez le spam, respectez les lois locales et les politiques des plateformes, et vérifiez tout avant l’envoi. Laissez OpenClaw préparer les brouillons ; vous les approuvez.

    Documentation : [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Quels sont les avantages par rapport à Claude Code pour le développement web ?">
    OpenClaw est un **assistant personnel** et une couche de coordination, pas un remplacement d’IDE. Utilisez Claude Code ou Codex pour bénéficier de la boucle de développement directe la plus rapide dans un dépôt. Utilisez OpenClaw pour la mémoire persistante, l’accès entre appareils et l’orchestration des outils.

    - Mémoire persistante et espace de travail conservés entre les sessions.
    - Accès multiplateforme (Telegram, WhatsApp, TUI, WebChat).
    - Orchestration des outils (navigateur, fichiers, planification, hooks).
    - Gateway toujours actif (exécutez-le sur un VPS et interagissez depuis n’importe où).
    - Nodes pour le navigateur, l’écran, la caméra et l’exécution en local.

    Présentation : [https://openclaw.ai/showcase](https://openclaw.ai/showcase).

  </Accordion>
</AccordionGroup>

## Skills et automatisation

<AccordionGroup>
  <Accordion title="Comment personnaliser les Skills sans conserver de modifications dans le dépôt ?">
    Utilisez des remplacements gérés plutôt que de modifier la copie du dépôt. Placez les modifications dans `~/.openclaw/skills/<name>/SKILL.md` (ou ajoutez un dossier via `skills.load.extraDirs` dans `~/.openclaw/openclaw.json`). Ordre de priorité : `<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> intégrés -> `skills.load.extraDirs`, afin que les remplacements gérés aient priorité sur les Skills intégrés sans modifier git. Pour effectuer une installation globale tout en limitant la visibilité à certains agents, conservez la copie partagée dans `~/.openclaw/skills` et contrôlez la visibilité avec `agents.defaults.skills` / `agents.list[].skills`. Seules les modifications dignes d’être intégrées en amont doivent être proposées sous forme de PR pour la copie du dépôt.
  </Accordion>

  <Accordion title="Puis-je charger des Skills depuis un dossier personnalisé ?">
    Oui : ajoutez des répertoires via `skills.load.extraDirs` dans `~/.openclaw/openclaw.json` (priorité la plus faible dans l’ordre ci-dessus). `clawhub` installe par défaut dans `./skills`, qu’OpenClaw traite comme `<workspace>/skills` lors de la session suivante. Pour limiter la visibilité à certains agents, combinez cela avec `agents.defaults.skills` ou `agents.list[].skills`.
  </Accordion>

  <Accordion title="Comment utiliser différents modèles ou paramètres pour différentes tâches ?">
    Modèles pris en charge :

    - **Tâches Cron** : les tâches isolées peuvent définir un remplacement de `model` par tâche.
    - **Agents** : acheminez les tâches vers des agents distincts avec différents modèles par défaut, niveaux de réflexion et paramètres de flux.
    - **Changement à la demande** : `/model` change à tout moment le modèle de la session actuelle.

    Exemple — même modèle, paramètres différents par agent :

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    Placez les valeurs par défaut partagées par modèle dans `agents.defaults.models["provider/model"].params`, puis les remplacements propres à chaque agent directement dans `agents.list[].params`. Ne dupliquez pas le même modèle dans `agents.list[].models["provider/model"].params` imbriqué ; ce chemin est destiné au catalogue de modèles par agent et aux remplacements d’exécution.

    Consultez [Tâches Cron](/fr/automation/cron-jobs), [Routage multi-agent](/fr/concepts/multi-agent), [Configuration](/fr/gateway/config-agents), [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Le bot se fige pendant un travail intensif. Comment le décharger ?">
    Utilisez des **sous-agents** pour les tâches longues ou parallèles : ils s’exécutent dans leur propre session, renvoient un résumé et maintiennent la réactivité de votre discussion principale. Demandez au bot de « créer un sous-agent pour cette tâche », ou utilisez `/subagents`. Utilisez `/status` pour savoir si le Gateway est actuellement occupé.

    Les tâches longues et les sous-agents consomment tous deux des jetons ; définissez un modèle moins coûteux pour les sous-agents via `agents.defaults.subagents.model` si le coût est important.

    Documentation : [Sous-agents](/fr/tools/subagents), [Tâches en arrière-plan](/fr/automation/tasks).

  </Accordion>

  <Accordion title="Comment fonctionnent les sessions de sous-agents liées à un fil sur Discord ?">
    Liez un fil Discord à un sous-agent ou à une cible de session afin que les messages de suivi qui y sont envoyés restent dans cette session liée.

    - Créez-le avec `sessions_spawn` en utilisant `thread: true` (éventuellement `mode: "session"` pour un suivi persistant).
    - Ou effectuez la liaison manuellement avec `/focus <target>`.
    - `/agents` inspecte l’état de la liaison.
    - `/session idle <duration|off>` et `/session max-age <duration|off>` contrôlent la suppression automatique du focus.
    - `/unfocus` détache le fil.

    Configuration : `session.threadBindings.enabled` (commutateur global), `session.threadBindings.idleHours` (valeur par défaut `24`, `0` désactive), `session.threadBindings.maxAgeHours` (valeur par défaut `0` = aucune limite stricte) et remplacements par canal `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`. `channels.discord.threadBindings.spawnSessions` contrôle la liaison automatique lors de la création (valeur par défaut `true`).

    Documentation : [Sous-agents](/fr/tools/subagents), [Discord](/fr/channels/discord), [Référence de configuration](/fr/gateway/configuration-reference), [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Un sous-agent a terminé, mais la notification de fin a été envoyée au mauvais endroit ou n’a jamais été publiée. Que dois-je vérifier ?">
    Vérifiez la route résolue du demandeur :

    - La remise d’un sous-agent en mode achèvement privilégie un fil lié ou une route de conversation lorsqu’il en existe.
    - Si l’origine de l’achèvement ne contient qu’un canal, OpenClaw se rabat sur la route enregistrée de la session du demandeur (`lastChannel` / `lastTo` / `lastAccountId`) afin que la remise directe puisse tout de même réussir.
    - En l’absence de route liée et de route enregistrée exploitable, la remise directe peut échouer et le résultat est alors placé dans la file d’attente de remise de la session au lieu d’être publié immédiatement.
    - Les cibles non valides ou obsolètes peuvent également imposer le recours à la file d’attente ou provoquer l’échec final de la remise.
    - Si la dernière réponse visible de l’assistant enfant est exactement `NO_REPLY` / `no_reply` ou `ANNOUNCE_SKIP`, OpenClaw supprime intentionnellement l’annonce au lieu de publier une ancienne progression obsolète.

    Débogage : `openclaw tasks show <lookup>`, où `<lookup>` est un identifiant de tâche, un identifiant d’exécution ou une clé de session.

    Documentation : [Sous-agents](/fr/tools/subagents), [Tâches en arrière-plan](/fr/automation/tasks), [Outils de session](/fr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron ou les rappels ne se déclenchent pas. Que dois-je vérifier ?">
    Cron s’exécute dans le processus du Gateway ; il ne se déclenche pas si le Gateway ne fonctionne pas en continu.

    - Vérifiez que Cron est activé (`cron.enabled`) et que `OPENCLAW_SKIP_CRON` n’est pas défini.
    - Vérifiez que le Gateway fonctionne 24 h/24 et 7 j/7 (sans mise en veille ni redémarrage).
    - Vérifiez le fuseau horaire de la tâche (`--tz` par rapport au fuseau horaire de l’hôte).

    Débogage :
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentation : [Tâches Cron](/fr/automation/cron-jobs), [Automatisation](/fr/automation).

  </Accordion>

  <Accordion title="Cron s’est déclenché, mais rien n’a été envoyé au canal. Pourquoi ?">
    Vérifiez le mode de livraison :

    - `--no-deliver` / `delivery.mode: "none"` : aucun envoi de secours par le programme d’exécution n’est attendu.
    - Cible d’annonce manquante ou non valide (`channel` / `to`) : le programme d’exécution a ignoré la livraison sortante.
    - Échecs d’authentification du canal (`unauthorized`, `Forbidden`) : le programme d’exécution a tenté d’effectuer la livraison, mais les identifiants l’ont bloquée.
    - Un résultat isolé silencieux (`NO_REPLY` / `no_reply` uniquement) est considéré comme intentionnellement non livrable ; la livraison de secours mise en file d’attente est donc également supprimée.

    Pour les tâches Cron isolées, l’agent peut toujours effectuer un envoi direct avec l’outil `message` lorsqu’une route de discussion est disponible. `--announce` contrôle uniquement la livraison de secours par le programme d’exécution du texte final que l’agent n’a pas déjà envoyé lui-même.

    Débogage :
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    Documentation : [Tâches Cron](/fr/automation/cron-jobs), [Tâches en arrière-plan](/fr/automation/tasks).

  </Accordion>

  <Accordion title="Pourquoi une exécution Cron isolée a-t-elle changé de modèle ou effectué une nouvelle tentative ?">
    Il s’agit du chemin de changement de modèle en direct, et non d’une planification en double. Une exécution Cron isolée conserve un transfert de modèle à l’exécution et réessaie lorsque l’exécution active lève `LiveSessionModelSwitchError`, en conservant le fournisseur/modèle sélectionné (ainsi que toute substitution de profil d’authentification sélectionnée) avant la nouvelle tentative.

    Ordre de priorité de sélection du modèle : d’abord la substitution de modèle du hook Gmail (`hooks.gmail.model`), puis le `model` propre à la tâche, ensuite toute substitution de modèle enregistrée pour la session Cron, puis la sélection normale du modèle de l’agent/par défaut.

    La boucle de nouvelle tentative est limitée à la tentative initiale plus 2 nouvelles tentatives après changement ; Cron abandonne ensuite au lieu de boucler indéfiniment.

    Débogage :
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentation : [Tâches Cron](/fr/automation/cron-jobs), [CLI cron](/fr/cli/cron).

  </Accordion>

  <Accordion title="Comment installer des Skills sous Linux ?">
    Utilisez les commandes natives `openclaw skills` ou déposez les Skills dans votre espace de travail ; l’interface utilisateur Skills de macOS n’est pas disponible sous Linux. Parcourez les Skills sur [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    Par défaut, la commande native `openclaw skills install` écrit dans le répertoire `skills/` de l’espace de travail actif. Ajoutez `--global` pour installer dans le répertoire partagé et géré des Skills pour tous les agents locaux. Installez la CLI `clawhub` séparée uniquement pour publier ou synchroniser vos propres Skills. Utilisez `agents.defaults.skills` ou `agents.list[].skills` pour restreindre les agents qui voient les Skills partagées.

  </Accordion>

  <Accordion title="OpenClaw peut-il exécuter des tâches selon un calendrier ou continuellement en arrière-plan ?">
    Oui, au moyen du planificateur du Gateway :

    - **Tâches Cron** pour les tâches planifiées ou récurrentes (elles persistent après les redémarrages).
    - **Heartbeat** pour les vérifications périodiques de la session principale.
    - **Tâches isolées** pour les agents autonomes qui publient des résumés ou les livrent dans des discussions.

    Documentation : [Tâches Cron](/fr/automation/cron-jobs), [Automatisation](/fr/automation), [Heartbeat](/fr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Puis-je exécuter depuis Linux des Skills réservées à Apple macOS ?">
    Pas directement. Les Skills macOS sont filtrées par `metadata.openclaw.os` ainsi que par les binaires requis, et ne sont chargées que lorsqu’elles sont admissibles sur l’**hôte du Gateway**. Sous Linux, les Skills réservées à `darwin` (`apple-notes`, `apple-reminders`, `things-mac`) ne se chargeront pas, sauf si vous remplacez ce filtrage.

    Trois méthodes sont prises en charge :

    **Option A - exécuter le Gateway sur un Mac (la plus simple)**. Exécutez le Gateway là où se trouvent les binaires macOS, puis connectez-vous depuis Linux en [mode distant](#gateway-ports-already-running-and-remote-mode) ou via Tailscale. Les Skills se chargent normalement, car l’hôte du Gateway utilise macOS.

    **Option B - utiliser un Node macOS (sans SSH)**. Exécutez le Gateway sous Linux, associez un Node macOS (application de barre des menus), puis définissez **Node Run Commands** sur "Always Ask" ou "Always Allow" sur le Mac. OpenClaw considère les Skills réservées à macOS comme admissibles lorsque les binaires requis existent sur le Node ; l’agent les exécute au moyen de l’outil `nodes`. Avec "Always Ask", l’approbation de "Always Allow" dans l’invite ajoute cette commande à la liste d’autorisation.

    **Option C - utiliser des mandataires SSH pour les binaires macOS (avancé)**. Conservez le Gateway sous Linux, mais faites en sorte que les binaires CLI requis soient résolus vers des scripts enveloppe SSH qui s’exécutent sur un Mac, puis remplacez la Skill pour autoriser Linux afin qu’elle reste admissible.

    1. Créez un script enveloppe SSH pour le binaire (exemple : `memo` pour Apple Notes) :
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. Placez le script enveloppe dans le `PATH` de l’hôte Linux (par exemple `~/bin/memo`).
    3. Remplacez les métadonnées de la Skill (dans l’espace de travail ou `~/.openclaw/skills`) afin d’autoriser Linux :
       ```markdown
       ---
       name: apple-notes
       description: Gérer Apple Notes au moyen de la CLI memo sous macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```
    4. Démarrez une nouvelle session afin d’actualiser l’instantané des Skills.

  </Accordion>

  <Accordion title="Existe-t-il une intégration Notion ou HeyGen ?">
    Elle n’est pas intégrée actuellement. Options :

    - **Skill / Plugin personnalisé** : le meilleur choix pour un accès fiable aux API (les deux services disposent d’API).
    - **Automatisation du navigateur** : fonctionne sans code, mais est plus lente et plus fragile.

    Pour un contexte par client de type agence : conservez une page Notion par client (contexte + préférences + travail en cours) et demandez à l’agent de récupérer cette page au début d’une session.

    Pour une intégration native, ouvrez une demande de fonctionnalité ou créez une Skill qui utilise ces API.

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Les installations natives sont placées dans le répertoire `skills/` de l’espace de travail actif ; utilisez `--global` pour tous les agents locaux, ou configurez `agents.defaults.skills` / `agents.list[].skills` pour limiter la visibilité. Certaines Skills nécessitent des binaires installés par Homebrew ; sous Linux, cela signifie Linuxbrew.

    Consultez [Skills](/fr/tools/skills), [Configuration des Skills](/fr/tools/skills-config), [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="Comment utiliser mon profil Chrome existant déjà connecté avec OpenClaw ?">
    Utilisez le profil de navigateur `user` intégré, qui se connecte au moyen de Chrome DevTools MCP :

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Pour utiliser un nom personnalisé, créez un profil MCP explicite :

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Celui-ci peut utiliser le navigateur de l’hôte local ou un Node de navigateur connecté. Si le Gateway s’exécute ailleurs, exécutez un hôte de Node sur la machine du navigateur ou utilisez plutôt CDP à distance.

    Limites actuelles des profils `existing-session` / `user` par rapport au profil `openclaw` géré :

    - `click`, `type`, `hover`, `scrollIntoView`, `drag` et `select` nécessitent des références d’instantané, et non des sélecteurs CSS.
    - Les hooks de téléversement nécessitent `ref` ou `inputRef`, un fichier à la fois, sans `element` CSS.
    - `responsebody`, l’exportation au format PDF, l’interception des téléchargements et les actions par lots nécessitent toujours le chemin du navigateur géré.

    Consultez [Navigateur](/fr/tools/browser#existing-session-via-chrome-devtools-mcp) pour obtenir la comparaison complète.

  </Accordion>
</AccordionGroup>

## Mise en bac à sable et mémoire

<AccordionGroup>
  <Accordion title="Existe-t-il une documentation dédiée à la mise en bac à sable ?">
    Oui : [Mise en bac à sable](/fr/gateway/sandboxing). Pour la configuration propre à Docker (Gateway complet dans Docker ou images de bac à sable), consultez [Docker](/fr/install/docker).
  </Accordion>

  <Accordion title="Docker semble limité : comment activer toutes les fonctionnalités ?">
    L’image par défaut privilégie la sécurité et s’exécute sous l’utilisateur `node` ; elle exclut donc les paquets système, Homebrew et les navigateurs intégrés. Pour une configuration plus complète :

    - Rendez `/home/node` persistant avec `OPENCLAW_HOME_VOLUME` afin que les caches survivent.
    - Intégrez les dépendances système dans l’image avec `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Installez les navigateurs Playwright au moyen de la CLI intégrée : `node /app/node_modules/playwright-core/cli.js install chromium`.
    - Définissez `PLAYWRIGHT_BROWSERS_PATH` et rendez ce chemin persistant.

    Documentation : [Docker](/fr/install/docker), [Navigateur](/fr/tools/browser).

  </Accordion>

  <Accordion title="Puis-je conserver les messages privés comme personnels, tout en rendant les groupes publics et isolés avec un seul agent ?">
    Oui, si le trafic privé correspond aux **messages privés** et le trafic public aux **groupes**. Définissez `agents.defaults.sandbox.mode: "non-main"` afin que les sessions de groupe/canal (clés non principales) s’exécutent dans le moteur de bac à sable configuré, tandis que la session principale de messages privés reste sur l’hôte. Docker est le moteur par défaut une fois la mise en bac à sable activée. Limitez les outils disponibles dans les sessions isolées au moyen de `tools.sandbox.tools`.

    Procédure de configuration : [Groupes : messages privés personnels + groupes publics](/fr/channels/groups#pattern-personal-dms-public-groups-single-agent). Référence principale : [Configuration du Gateway](/fr/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="Comment monter un dossier de l’hôte dans le bac à sable ?">
    Définissez `agents.defaults.sandbox.docker.binds` sur `["host:container:mode"]` (par exemple `"/home/user/src:/src:ro"`). Les montages globaux et propres à chaque agent sont fusionnés ; les montages propres à chaque agent sont ignorés lorsque `scope: "shared"`. Utilisez `:ro` pour tout contenu sensible ; les montages contournent les barrières du système de fichiers du bac à sable.

    OpenClaw valide les sources des montages à la fois par rapport au chemin normalisé et au chemin canonique résolu à travers l’ancêtre existant le plus profond ; les échappements via un parent qui est un lien symbolique échouent donc de manière sécurisée, même lorsque le dernier segment du chemin n’existe pas encore.

    Consultez [Mise en bac à sable](/fr/gateway/sandboxing#custom-bind-mounts) et [Bac à sable, stratégie des outils et mode élevé](/fr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Comment fonctionne la mémoire ?">
    La mémoire d’OpenClaw est constituée de fichiers Markdown dans l’espace de travail de l’agent : notes quotidiennes dans `memory/YYYY-MM-DD.md`, notes organisées à long terme dans `MEMORY.md` (sessions principales/privées uniquement).

    OpenClaw effectue également un **vidage silencieux de la mémoire avant la Compaction** avant que la Compaction ne résume la conversation, afin de rappeler au modèle d’écrire d’abord des notes durables. Cette opération ne s’exécute que lorsque l’espace de travail est accessible en écriture (les bacs à sable en lecture seule l’ignorent) ; désactivez-la avec `agents.defaults.compaction.memoryFlush.enabled: false`. Consultez [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="La mémoire ne cesse d’oublier des éléments. Comment les rendre persistants ?">
    Demandez au bot d’**écrire le fait dans la mémoire** : les notes à long terme sont enregistrées dans `MEMORY.md`, le contexte à court terme dans `memory/YYYY-MM-DD.md`. Rappeler au modèle d’enregistrer les souvenirs résout généralement le problème. S’il continue à les oublier, vérifiez que le Gateway utilise le même espace de travail à chaque exécution.

    Documentation : [Mémoire](/fr/concepts/memory), [Espace de travail de l’agent](/fr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La mémoire persiste-t-elle indéfiniment ? Quelles sont les limites ?">
    Les fichiers de mémoire résident sur le disque et persistent jusqu’à leur suppression ; la limite correspond à votre espace de stockage, et non au modèle. Le **contexte de session** reste limité par la fenêtre de contexte du modèle ; les longues conversations peuvent donc être compactées ou tronquées. C’est pourquoi la recherche en mémoire existe : elle ne réintègre dans le contexte que les parties pertinentes.

    Documentation : [Mémoire](/fr/concepts/memory), [Contexte](/fr/concepts/context).

  </Accordion>

  <Accordion title="La recherche sémantique en mémoire nécessite-t-elle une clé API OpenAI ?">
    Uniquement si vous utilisez les **plongements OpenAI**, qui constituent le fournisseur par défaut. L’OAuth Codex couvre les discussions/complétions et **n’accorde pas** l’accès aux plongements ; se connecter avec Codex (OAuth ou connexion par la CLI Codex) n’active donc pas la recherche sémantique en mémoire. Les plongements OpenAI nécessitent toujours une véritable clé API (`OPENAI_API_KEY` ou `models.providers.openai.apiKey`).

    Pour rester en local, définissez `agents.defaults.memorySearch.provider: "local"` (GGUF/llama.cpp). Autres fournisseurs pris en charge : Bedrock, DeepInfra, Gemini (`GEMINI_API_KEY` ou `memorySearch.remote.apiKey`), GitHub Copilot, LM Studio, Mistral, Ollama, compatible avec OpenAI et Voyage. Consultez [Mémoire](/fr/concepts/memory) et [Recherche en mémoire](/fr/concepts/memory-search) pour les détails de configuration.

  </Accordion>
</AccordionGroup>

## Emplacement des éléments sur le disque

<AccordionGroup>
  <Accordion title="Toutes les données utilisées avec OpenClaw sont-elles enregistrées localement ?">
    Non : **l'état propre à OpenClaw est local**, mais **les services externes voient toujours ce que vous leur envoyez**.

    - **Local par défaut** : les sessions, les fichiers de mémoire, la configuration et l'espace de travail se trouvent sur l'hôte du Gateway (`~/.openclaw` ainsi que le répertoire de votre espace de travail).
    - **Distant par nécessité** : les messages envoyés aux fournisseurs de modèles (Anthropic/OpenAI/etc.) sont transmis à leurs API, et les plateformes de discussion (Slack/Telegram/WhatsApp/etc.) stockent les données des messages sur leurs serveurs.
    - **Vous contrôlez l'empreinte** : les modèles locaux conservent les prompts sur votre machine, mais le trafic des canaux transite toujours par les serveurs du canal.

    Voir aussi : [Espace de travail de l'agent](/fr/concepts/agent-workspace), [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Où OpenClaw stocke-t-il ses données ?">
    Tout se trouve sous `$OPENCLAW_STATE_DIR` (par défaut : `~/.openclaw`) :

    | Chemin                                                             | Utilité                                                            |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | Configuration principale (JSON5)                                   |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | Import OAuth hérité (copié dans les profils d'authentification lors de la première utilisation) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | Profils d'authentification (OAuth, clés API, `keyRef`/`tokenRef` facultatifs) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | Charge utile facultative de secrets stockée dans un fichier pour les fournisseurs SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | Fichier de compatibilité hérité (entrées `api_key` statiques supprimées) |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | État des fournisseurs (par exemple `whatsapp/<accountId>/creds.json`) |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | État par agent (agentDir + artefacts de session hérités/archivés)   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/openclaw-agent.sqlite`  | État SQLite par agent, notamment les lignes de session et les transcriptions |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | Sources de migration des sessions héritées et artefacts d'archive/d'assistance |

    L'ancien chemin mono-agent `~/.openclaw/agent/*` est migré par `openclaw doctor`.

    Votre **espace de travail** (AGENTS.md, fichiers de mémoire, Skills, etc.) est distinct et configuré via `agents.defaults.workspace` (par défaut : `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Où doivent se trouver AGENTS.md / SOUL.md / USER.md / MEMORY.md ?">
    Ces fichiers se trouvent dans **l'espace de travail de l'agent**, et non dans `~/.openclaw`.

    - **Espace de travail (par agent)** : `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `memory/YYYY-MM-DD.md`, et éventuellement `HEARTBEAT.md`. Le fichier racine `memory.md` en minuscules sert uniquement d'entrée de réparation héritée ; `openclaw doctor --fix` peut le fusionner dans `MEMORY.md` lorsque les deux existent.
    - **Répertoire d'état (`~/.openclaw`)** : configuration, état des canaux/fournisseurs, profils d'authentification, sessions, journaux, Skills partagées (`~/.openclaw/skills`).

    L'espace de travail par défaut est `~/.openclaw/workspace` et peut être configuré :

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si le bot « oublie » après un redémarrage, vérifiez que le Gateway utilise le même espace de travail à chaque lancement (le mode distant utilise l'espace de travail de **l'hôte du Gateway**, et non celui de votre ordinateur portable local).

    Conseil : pour conserver durablement un comportement ou une préférence, demandez au bot de **l'écrire dans AGENTS.md ou MEMORY.md** plutôt que de vous fier à l'historique de discussion.

    Consultez [Espace de travail de l'agent](/fr/concepts/agent-workspace) et [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Puis-je agrandir SOUL.md ?">
    Oui. `SOUL.md` est l'un des fichiers d'initialisation de l'espace de travail injectés dans le contexte de l'agent. La limite d'injection par fichier est de `20000` caractères par défaut ; le budget total d'initialisation pour l'ensemble des fichiers est de `60000` caractères.

    Modifiez les valeurs par défaut partagées :

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    Vous pouvez également remplacer ces valeurs pour un agent sous `agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars`.

    Utilisez `/context` pour vérifier les tailles brutes et injectées, ainsi que la présence éventuelle d'une troncature. Limitez `SOUL.md` à la voix, au positionnement et à la personnalité ; placez les règles de fonctionnement dans `AGENTS.md` et les faits durables dans la mémoire.

    Consultez [Contexte](/fr/concepts/context) et [Configuration de l'agent](/fr/gateway/config-agents).

  </Accordion>

  <Accordion title="Stratégie de sauvegarde recommandée">
    Placez votre **espace de travail d’agent** dans un dépôt git **privé** et sauvegardez-le dans un emplacement privé (par exemple, un dépôt GitHub privé). Cela enregistre la mémoire ainsi que les fichiers AGENTS/SOUL/USER et vous permet de restaurer ultérieurement l’« esprit » de l’assistant.

    Ne validez **aucun** élément situé sous `~/.openclaw` (identifiants, sessions, jetons, charges utiles chiffrées contenant des secrets). Pour une restauration complète, sauvegardez séparément l’espace de travail et le répertoire d’état.

    Documentation : [Espace de travail de l’agent](/fr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Comment désinstaller complètement OpenClaw ?">
    Consultez [Désinstallation](/fr/install/uninstall).
  </Accordion>

  <Accordion title="Les agents peuvent-ils travailler en dehors de l’espace de travail ?">
    Oui. L’espace de travail est le **cwd par défaut** et le point d’ancrage de la mémoire, pas un bac à sable strict. Les chemins relatifs sont résolus dans l’espace de travail ; les chemins absolus peuvent accéder à d’autres emplacements de l’hôte, sauf si le bac à sable est activé. Pour l’isolation, utilisez [`agents.defaults.sandbox`](/fr/gateway/sandboxing) ou les paramètres de bac à sable propres à chaque agent. Pour utiliser un dépôt comme répertoire de travail par défaut, faites pointer le paramètre `workspace` de cet agent vers la racine du dépôt : le dépôt OpenClaw lui-même ne contient que le code source, conservez donc l’espace de travail séparément, sauf si vous souhaitez délibérément que l’agent travaille dedans.

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

  <Accordion title="Mode distant : où se trouve le stockage des sessions ?">
    L’état des sessions appartient à l’**hôte du Gateway**. En mode distant, le stockage des sessions qui vous intéresse se trouve sur la machine distante, et non sur votre ordinateur portable local. Consultez [Gestion des sessions](/fr/concepts/session).
  </Accordion>
</AccordionGroup>

## Principes de base de la configuration

<AccordionGroup>
  <Accordion title="Quel est le format de la configuration ? Où se trouve-t-elle ?">
    OpenClaw lit une configuration **JSON5** facultative depuis `$OPENCLAW_CONFIG_PATH` (valeur par défaut : `~/.openclaw/openclaw.json`). Si le fichier est absent, il utilise des valeurs par défaut relativement sûres, notamment un espace de travail par défaut situé dans `~/.openclaw/workspace`.
  </Accordion>

  <Accordion title='J’ai défini gateway.bind: "lan" (ou "tailnet") et maintenant rien n’écoute / l’interface indique que je ne suis pas autorisé'>
    Les liaisons qui ne sont pas en boucle locale **nécessitent un chemin d’authentification du Gateway valide** : authentification par secret partagé (jeton ou mot de passe), ou `gateway.auth.mode: "trusted-proxy"` derrière un proxy inverse correctement configuré et tenant compte de l’identité.

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

    - `gateway.remote.token` / `.password` n’activent **pas** à eux seuls l’authentification locale du Gateway ; les chemins d’appel locaux peuvent utiliser `gateway.remote.*` comme solution de repli uniquement lorsque `gateway.auth.*` n’est pas défini.
    - Pour l’authentification par mot de passe, définissez `gateway.auth.mode: "password"` ainsi que `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Si `gateway.auth.token` / `.password` est explicitement configuré via SecretRef et n’est pas résolu, la résolution échoue de manière sécurisée (sans masquage par une solution de repli distante).
    - Les configurations de l’interface de contrôle utilisant un secret partagé s’authentifient via `connect.params.auth.token` ou `connect.params.auth.password` (stocké dans les paramètres de l’application/de l’interface). Les modes transmettant l’identité, tels que Tailscale Serve ou `trusted-proxy`, utilisent plutôt les en-têtes de requête : évitez de placer des secrets partagés dans les URL.
    - Avec `gateway.auth.mode: "trusted-proxy"`, les proxys inverses en boucle locale sur le même hôte nécessitent explicitement `gateway.auth.trustedProxy.allowLoopback = true` et une entrée de boucle locale dans `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Pourquoi ai-je désormais besoin d’un jeton sur localhost ?">
    OpenClaw impose par défaut l’authentification du Gateway, y compris en boucle locale. Si aucun chemin d’authentification explicite n’est configuré, le démarrage sélectionne le mode par jeton et génère un jeton limité à l’exécution pour ce démarrage ; les clients WS locaux doivent donc s’authentifier. Cela empêche d’autres processus locaux d’appeler le Gateway.

    Configurez explicitement `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` ou `OPENCLAW_GATEWAY_PASSWORD` lorsque les clients ont besoin d’un secret stable entre les redémarrages. Vous pouvez également choisir le mode par mot de passe, ou `trusted-proxy` pour les proxys inverses tenant compte de l’identité. Pour une boucle locale ouverte, définissez explicitement `gateway.auth.mode: "none"`. `openclaw doctor --generate-gateway-token` génère un jeton à tout moment.

  </Accordion>

  <Accordion title="Dois-je redémarrer après avoir modifié la configuration ?">
    Le Gateway surveille la configuration et prend en charge le rechargement à chaud : `gateway.reload.mode: "hybrid"` (valeur par défaut) applique à chaud les modifications sûres et redémarre pour les modifications critiques. `hot`, `restart` et `off` sont également pris en charge. La plupart des modifications apportées à `tools.*`, à la politique `agents.*`, à `session.*` et à `messages.*` s’appliquent immédiatement sans aucune action de rechargement ; les modifications de liaison ou de port dans `gateway.*` nécessitent un redémarrage.
  </Accordion>

  <Accordion title="Comment désactiver les slogans humoristiques de la CLI ?">
    Définissez `cli.banner.taglineMode` :

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off` : masque le texte du slogan, mais conserve la ligne du titre et de la version de la bannière.
    - `default` : utilise toujours `All your chats, one OpenClaw.`.
    - `random` : affiche en alternance des slogans humoristiques ou saisonniers (comportement par défaut).
    - Pour ne pas afficher de bannière du tout, définissez la variable d’environnement `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Comment activer la recherche web (et la récupération web) ?">
    `web_fetch` fonctionne sans clé API. `web_search` dépend du fournisseur sélectionné :

    | Fournisseur | Sans clé | Variable(s) d’environnement |
    | --- | --- | --- |
    | Brave | Non | `BRAVE_API_KEY` |
    | DuckDuckGo | Oui (non officiel, basé sur HTML) | - |
    | Exa | Non | `EXA_API_KEY` |
    | Firecrawl | Non | `FIRECRAWL_API_KEY` |
    | Gemini | Non | `GEMINI_API_KEY` |
    | Grok | Non (OAuth xAI ou clé) | `XAI_API_KEY` |
    | Kimi | Non | `KIMI_API_KEY` ou `MOONSHOT_API_KEY` |
    | MiniMax Search | Non | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY` |
    | Ollama Web Search | Oui (nécessite `ollama signin`) | - |
    | Perplexity | Non | `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY` |
    | SearXNG | Oui (auto-hébergé) | `SEARXNG_BASE_URL` |
    | Tavily | Non | `TAVILY_API_KEY` |

    Grok peut également réutiliser l’OAuth xAI de l’authentification du modèle (`openclaw onboard --auth-choice xai-oauth`).

    **Recommandation** : exécutez `openclaw configure --section web` et choisissez un fournisseur.

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
    ```
    ```json5
        web: {
          search: {
            enabled: true,
            provider: "brave",
            maxResults: 5,
          },
          fetch: {
    ```
    ```json5
            enabled: true,
    ```
    ```json5
            provider: "firecrawl", // facultatif ; omettez-le pour la détection automatique
    ```
    ```json5
          },
    ```
    ```json5
        },
      },
    }
    ```
    La configuration de recherche web propre à chaque fournisseur se trouve sous `plugins.entries.<plugin>.config.webSearch.*`. Les anciens chemins de fournisseur `tools.web.search.*` sont toujours chargés à des fins de compatibilité, mais ne doivent pas être utilisés dans les nouvelles configurations. La configuration de repli de récupération web de Firecrawl se trouve sous `plugins.entries.firecrawl.config.webFetch.*`.

    - Listes d’autorisation : ajoutez `web_search`/`web_fetch`/`x_search`, ou `group:web` pour les trois.
    - `web_fetch` est activé par défaut.
    - Si `tools.web.fetch.provider` est omis, OpenClaw détecte automatiquement le premier fournisseur de repli prêt pour la récupération parmi les identifiants disponibles ; le plugin Firecrawl officiel fournit ce mécanisme de repli.
    - Les démons lisent les variables d’environnement depuis `~/.openclaw/.env` (ou l’environnement du service).

    Documentation : [Outils web](/fr/tools/web).

  </Accordion>

  <Accordion title="config.apply a effacé ma configuration. Comment la récupérer et éviter que cela se reproduise ?">
    `config.apply` remplace la **configuration entière** ; un objet partiel supprime tout le reste.

    La version actuelle d’OpenClaw protège contre la plupart des écrasements accidentels :

    - Les écritures de configuration effectuées par OpenClaw valident l’intégralité de la configuration résultante avant l’écriture.
    - Les écritures invalides ou destructrices effectuées par OpenClaw sont rejetées et enregistrées sous `openclaw.json.rejected.*`.
    - Une modification directe qui empêche le démarrage ou le rechargement à chaud entraîne la fermeture sécurisée du Gateway ou l’abandon du rechargement ; elle ne réécrit pas `openclaw.json`.
    - `openclaw doctor --fix` prend en charge la réparation, peut restaurer la dernière configuration valide connue et enregistre le fichier rejeté sous `openclaw.json.clobbered.*`.

    Récupération :

    - Consultez `openclaw logs --follow` pour rechercher `Invalid config at`, `Config write rejected:` ou `config reload skipped (invalid config)`.
    - Examinez le fichier `openclaw.json.clobbered.*` ou `openclaw.json.rejected.*` le plus récent à côté de la configuration active.
    - Exécutez `openclaw config validate` et `openclaw doctor --fix`.
    - Recopiez uniquement les clés voulues avec `openclaw config set` ou `config.patch`.
    - En l’absence de dernière configuration valide connue ou de charge utile rejetée : restaurez à partir d’une sauvegarde, ou réexécutez `openclaw doctor` et reconfigurez les canaux/modèles.
    - En cas de perte inattendue : signalez un bug en joignant votre dernière configuration connue ou une sauvegarde. Un agent de programmation local peut souvent reconstruire une configuration fonctionnelle à partir des journaux ou de l’historique.

    Pour éviter cela : utilisez `openclaw config set` pour les petites modifications, `openclaw configure` pour les modifications interactives, `config.schema.lookup` pour examiner un chemin inconnu (renvoie un nœud de schéma superficiel ainsi que des résumés de ses enfants immédiats) et `config.patch` pour les modifications RPC partielles ; réservez `config.apply` au remplacement de la configuration complète. L’outil d’exécution `gateway` destiné aux agents refuse de réécrire `tools.exec.ask` / `tools.exec.security`, même via les anciens alias `tools.bash.*`.

    Documentation : [Configuration](/fr/cli/config), [Configurer](/fr/cli/configure), [Dépannage du Gateway](/fr/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/fr/gateway/doctor).

  </Accordion>

  <Accordion title="Comment exécuter un Gateway central avec des workers spécialisés sur plusieurs appareils ?">
    Modèle courant : **un Gateway** (par exemple un Raspberry Pi), accompagné de **Nodes** et d’**agents**.

    - **Gateway (central)** : gère les canaux (Signal/WhatsApp), le routage et les sessions.
    - **Nodes (appareils)** : les Mac et appareils iOS/Android se connectent comme périphériques et exposent des outils locaux (`system.run`, `canvas`, `camera`).
    - **Agents (workers)** : cerveaux/espaces de travail distincts pour des rôles spécialisés (par exemple, opérations ou données personnelles).
    - **Sous-agents** : lancent des tâches en arrière-plan depuis un agent principal afin de les exécuter en parallèle.
    - **TUI** : permet de se connecter au Gateway et de changer d’agent ou de session.

    Documentation : [Nodes](/fr/nodes), [Accès à distance](/fr/gateway/remote), [Routage multi-agent](/fr/concepts/multi-agent), [Sous-agents](/fr/tools/subagents), [TUI](/fr/web/tui).

  </Accordion>

  <Accordion title="Le navigateur OpenClaw peut-il fonctionner en mode headless ?">
    Oui :

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

    La valeur par défaut est `false` (avec interface graphique). Le mode headless est plus susceptible de déclencher les contrôles anti-bot sur certains sites (X/Twitter bloque souvent les sessions headless). Il utilise le même moteur Chromium et fonctionne pour la plupart des automatisations ; la principale différence est l’absence de fenêtre de navigateur visible (utilisez des captures d’écran pour les éléments visuels). Consultez [Navigateur](/fr/tools/browser).

  </Accordion>

  <Accordion title="Comment utiliser Brave pour contrôler le navigateur ?">
    Définissez `browser.executablePath` sur le chemin de votre exécutable Brave (ou de tout navigateur basé sur Chromium), puis redémarrez le Gateway. Consultez [Navigateur](/fr/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways distants et nœuds

<AccordionGroup>
  <Accordion title="Comment les commandes se propagent-elles entre Telegram, le Gateway et les nœuds ?">
    Les messages Telegram sont traités par le **Gateway**, qui exécute l’agent et n’appelle les nœuds via le **WebSocket du Gateway** que lorsqu’un outil de nœud est nécessaire :

    Telegram -> Gateway -> Agent -> `node.*` -> Nœud -> Gateway -> Telegram

    Les nœuds ne voient pas le trafic entrant du fournisseur ; ils reçoivent uniquement les appels RPC de nœud.

  </Accordion>

  <Accordion title="Comment mon agent peut-il accéder à mon ordinateur si le Gateway est hébergé à distance ?">
    Associez votre ordinateur en tant que **nœud**. Le Gateway s’exécute ailleurs, mais peut appeler les outils `node.*` (écran, caméra, système) sur votre machine locale via le WebSocket du Gateway.

    1. Exécutez le Gateway sur l’hôte toujours actif (VPS/serveur domestique).
    2. Placez l’hôte du Gateway et votre ordinateur sur le même tailnet.
    3. Assurez-vous que le WS du Gateway est accessible (liaison au tailnet ou tunnel SSH).
    4. Ouvrez localement l’application macOS et connectez-vous en mode **Remote over SSH** (ou directement via le tailnet) afin qu’elle s’enregistre comme nœud.
    5. Approuvez le nœud :
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Aucun pont TCP distinct n’est requis ; les nœuds se connectent via le WebSocket du Gateway.

    Rappel de sécurité : l’association d’un nœud macOS autorise `system.run` sur cette machine. Associez uniquement des appareils auxquels vous faites confiance ; consultez [Sécurité](/fr/gateway/security).

    Documentation : [Nœuds](/fr/nodes), [Protocole du Gateway](/fr/gateway/protocol), [Mode distant de macOS](/fr/platforms/mac/remote), [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale est connecté, mais je ne reçois aucune réponse. Que faire ?">
    Vérifiez les éléments de base :

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    Vérifiez ensuite l’authentification et le routage : si vous utilisez Tailscale Serve, confirmez que `gateway.auth.allowTailscale` est correctement défini ; si vous vous connectez au moyen d’un tunnel SSH, confirmez que le tunnel est actif et pointe vers le bon port ; confirmez que les listes d’autorisation de vos messages privés/groupes incluent votre compte.

    Documentation : [Tailscale](/fr/gateway/tailscale), [Accès à distance](/fr/gateway/remote), [Canaux](/fr/channels).

  </Accordion>

  <Accordion title="Deux instances OpenClaw peuvent-elles communiquer entre elles (locale + VPS) ?">
    Oui, bien qu’il n’existe pas de pont intégré entre bots.

    **Solution la plus simple** : utilisez un canal de discussion normal auquel les deux bots peuvent accéder (Slack/Telegram/WhatsApp). Faites en sorte que le bot A envoie un message au bot B, puis laissez le bot B répondre normalement.

    **Pont CLI (générique)** : exécutez un script qui appelle l’autre Gateway avec `openclaw agent --message ... --deliver`, en ciblant une discussion dans laquelle l’autre bot est à l’écoute. Si l’un des bots se trouve sur un VPS distant, faites pointer votre CLI vers ce Gateway distant via SSH/Tailscale (consultez [Accès à distance](/fr/gateway/remote)) :

    ```bash
    openclaw agent --message "Bonjour du bot local" --deliver --channel telegram --reply-to <chat-id>
    ```

    Ajoutez une protection afin que les deux bots ne bouclent pas indéfiniment (réponse uniquement aux mentions, listes d’autorisation des canaux ou règle « ne pas répondre aux messages des bots »).

    Documentation : [Accès à distance](/fr/gateway/remote), [CLI de l’agent](/fr/cli/agent), [Envoi par l’agent](/fr/tools/agent-send).

  </Accordion>

  <Accordion title="Ai-je besoin de VPS distincts pour plusieurs agents ?">
    Non. Un seul Gateway héberge plusieurs agents, chacun disposant de son propre espace de travail, de ses modèles par défaut et de son routage : il s’agit de la configuration normale, bien moins coûteuse et plus simple qu’un VPS par agent. Utilisez des VPS distincts uniquement pour une isolation stricte (périmètres de sécurité) ou pour des configurations très différentes que vous ne souhaitez pas partager.
  </Accordion>

  <Accordion title="Y a-t-il un avantage à utiliser un Node sur mon ordinateur portable personnel plutôt que SSH depuis un VPS ?">
    Oui : les Nodes constituent le moyen privilégié d’accéder à votre ordinateur portable depuis un Gateway distant et offrent bien plus qu’un accès à l’interpréteur de commandes. Le Gateway s’exécute sous macOS/Linux (Windows via WSL2) et reste léger (un petit VPS ou une machine de la catégorie Raspberry Pi convient ; 4 GB de RAM suffisent largement). Une configuration courante consiste donc à utiliser un hôte toujours actif et votre ordinateur portable comme Node.

    - **Aucune connexion SSH entrante requise** - les Nodes se connectent au WebSocket du Gateway au moyen de l’association d’appareils.
    - **Contrôles d’exécution plus sûrs** - `system.run` est soumis aux listes d’autorisation et aux approbations du Node sur cet ordinateur portable.
    - **Davantage d’outils d’appareil** - les Nodes exposent `canvas`, `camera` et `screen` en plus de `system.run`.
    - **Automatisation locale du navigateur** - conservez le Gateway sur un VPS, mais exécutez Chrome localement par l’intermédiaire d’un hôte Node, ou connectez-vous au Chrome local via Chrome MCP.

    SSH convient pour un accès ponctuel à l’interpréteur de commandes ; les Nodes sont plus simples pour les flux de travail continus des agents et l’automatisation des appareils.

    Documentation : [Nodes](/fr/nodes), [CLI des Nodes](/fr/cli/nodes), [Navigateur](/fr/tools/browser).

  </Accordion>

  <Accordion title="Les Nodes exécutent-ils un service Gateway ?">
    Non. Un seul **Gateway** doit s’exécuter par hôte, sauf si vous exécutez intentionnellement des profils isolés (consultez [Plusieurs Gateway](/fr/gateway/multiple-gateways)). Les Nodes sont des périphériques qui se connectent au Gateway (Nodes iOS/Android ou « mode Node » macOS dans l’application de la barre des menus). Pour les hôtes Node sans interface graphique et le contrôle par CLI, consultez [CLI de l’hôte Node](/fr/cli/node).

    Un redémarrage complet est requis pour les modifications de `gateway`, de `discovery` et des surfaces des plugins hébergés.

  </Accordion>

  <Accordion title="Existe-t-il un moyen d’appliquer la configuration via une API ou RPC ?">
    Oui :

    - `config.schema.lookup` : inspecte une sous-arborescence de configuration avec son nœud de schéma superficiel, l’indication d’interface correspondante et les résumés de ses enfants immédiats avant l’écriture.
    - `config.get` : récupère l’instantané actuel et son hachage.
    - `config.patch` : mise à jour partielle sûre (préférée pour la plupart des modifications RPC) ; recharge à chaud lorsque cela est possible et redémarre lorsque cela est nécessaire.
    - `config.apply` : valide et remplace l’intégralité de la configuration ; recharge à chaud lorsque cela est possible et redémarre lorsque cela est nécessaire.
    - L’outil d’exécution `gateway` destiné aux agents refuse toujours de réécrire `tools.exec.ask` / `tools.exec.security` ; les anciens alias `tools.bash.*` sont normalisés vers les mêmes chemins protégés.

  </Accordion>

  <Accordion title="Configuration minimale raisonnable pour une première installation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Définit votre espace de travail et limite les personnes autorisées à déclencher le bot.

  </Accordion>

  <Accordion title="Comment configurer Tailscale sur un VPS et me connecter depuis mon Mac ?">
    1. **Installez Tailscale et connectez-vous sur le VPS** :
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. **Installez Tailscale et connectez-vous sur votre Mac** à l’aide de l’application Tailscale, sur le même tailnet.
    3. **Activez MagicDNS** dans la console d’administration Tailscale afin que le VPS dispose d’un nom stable.
    4. **Utilisez le nom d’hôte du tailnet** : SSH `ssh user@your-vps.tailnet-xxxx.ts.net` ; WS du Gateway `ws://your-vps.tailnet-xxxx.ts.net:18789`.

    Pour accéder à l’interface de contrôle sans SSH, utilisez Tailscale Serve sur le VPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Cela maintient le Gateway lié à l’interface de bouclage et expose HTTPS via Tailscale. Consultez [Tailscale](/fr/gateway/tailscale).

  </Accordion>

  <Accordion title="Comment connecter un nœud Mac à un Gateway distant (Tailscale Serve) ?">
    Serve expose l’**interface de contrôle du Gateway + WS** ; les nœuds se connectent via le même point de terminaison WS du Gateway.

    1. Vérifiez que le VPS et le Mac se trouvent sur le même tailnet.
    2. Utilisez l’application macOS en mode distant (la cible SSH peut être le nom d’hôte du tailnet) : elle établit un tunnel vers le port du Gateway et se connecte en tant que nœud.
    3. Approuvez le nœud :
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentation : [Protocole du Gateway](/fr/gateway/protocol), [Découverte](/fr/gateway/discovery), [mode distant de macOS](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Dois-je effectuer l’installation sur un deuxième ordinateur portable ou simplement ajouter un nœud ?">
    Pour utiliser **uniquement des outils locaux** (écran/caméra/exec) sur le deuxième ordinateur portable, ajoutez-le en tant que **nœud** : un seul Gateway, sans configuration dupliquée. Les outils de nœud locaux sont actuellement disponibles uniquement sous macOS. Installez un deuxième Gateway uniquement pour une **isolation stricte** ou pour deux bots entièrement distincts.

    Documentation : [Nœuds](/fr/nodes), [CLI des nœuds](/fr/cli/nodes), [Plusieurs Gateway](/fr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables d’environnement et chargement des fichiers .env

<AccordionGroup>
  <Accordion title="Comment OpenClaw charge-t-il les variables d’environnement ?">
    OpenClaw lit les variables d’environnement du processus parent (shell, launchd/systemd, CI, etc.) et charge également :

    - le fichier `.env` du répertoire de travail actuel ;
    - un fichier `.env` global de secours depuis `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`).

    Aucun des fichiers `.env` ne remplace les variables d’environnement existantes. Les clés d’identification des fournisseurs constituent une exception pour le fichier `.env` de l’espace de travail : les clés telles que `GEMINI_API_KEY`, `XAI_API_KEY` ou `MISTRAL_API_KEY` (ainsi que les autres variables d’environnement d’authentification des fournisseurs intégrés) sont ignorées dans le fichier `.env` de l’espace de travail et doivent être définies dans l’environnement du processus, dans `~/.openclaw/.env` ou dans la configuration `env`.

    Les variables d’environnement intégrées à la configuration ne s’appliquent que si elles sont absentes de l’environnement du processus :

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Consultez [/environment](/fr/help/environment) pour connaître l’ordre de priorité complet et toutes les sources.

  </Accordion>

  <Accordion title="J’ai démarré le Gateway via le service et mes variables d’environnement ont disparu. Que faire ?">
    Deux solutions :

    1. Placez les clés manquantes dans `~/.openclaw/.env` afin qu’elles soient chargées même lorsque le service n’hérite pas de l’environnement de votre shell.
    2. Activez l’importation depuis le shell (fonction pratique facultative) :
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
       Cette option exécute votre shell de connexion et importe uniquement les clés attendues manquantes (sans jamais remplacer les clés existantes). Variables d’environnement équivalentes : `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='J’ai défini COPILOT_GITHUB_TOKEN, mais l’état des modèles affiche "Shell env: off." Pourquoi ?'>
    `openclaw models status` indique si l’**importation depuis l’environnement du shell** est activée. "Shell env: off" ne signifie **pas** que vos variables d’environnement sont absentes : cela signifie simplement qu’OpenClaw ne chargera pas automatiquement votre shell de connexion.

    Si le Gateway s’exécute en tant que service (launchd/systemd), il n’héritera pas de l’environnement de votre shell. Pour résoudre ce problème, placez le jeton dans `~/.openclaw/.env`, activez `env.shellEnv.enabled: true` ou ajoutez-le à la configuration `env` (cela s’applique uniquement s’il est absent), puis redémarrez le Gateway et vérifiez de nouveau :

    ```bash
    openclaw models status
    ```

    Les jetons Copilot sont recherchés dans cet ordre : `OPENCLAW_GITHUB_TOKEN`, puis `COPILOT_GITHUB_TOKEN`, puis `GH_TOKEN`, puis `GITHUB_TOKEN`.

    Consultez [/concepts/model-providers](/fr/concepts/model-providers) et [/environment](/fr/help/environment).

  </Accordion>
</AccordionGroup>

## Sessions et conversations multiples

<AccordionGroup>
  <Accordion title="Comment démarrer une nouvelle conversation ?">
    Envoyez `/new` ou `/reset` comme message autonome. Consultez [Gestion des sessions](/fr/concepts/session).
  </Accordion>

  <Accordion title="Les sessions sont-elles réinitialisées automatiquement si je n’envoie jamais /new ?">
    Oui. La stratégie de réinitialisation par défaut est **quotidienne** : une nouvelle session commence à une heure locale configurée sur l’hôte du Gateway (`session.reset.atHour`, valeur par défaut `4`, 0-23), en fonction de l’heure de démarrage de la session actuelle. Pour utiliser plutôt une réinitialisation fondée sur l’inactivité, définissez `mode: "idle"` et `session.reset.idleMinutes`, ce qui fait expirer une session après une période d’inactivité (selon la dernière interaction réelle, et non les événements système Heartbeat/Cron/exec).

    ```json5
    {
      session: {
        reset: { mode: "daily", atHour: 4 },
        resetByType: {
          group: { mode: "idle", idleMinutes: 120 },
          thread: { mode: "daily", atHour: 6 },
        },
        resetByChannel: {
          discord: { mode: "idle", idleMinutes: 10080 },
        },
      },
    }
    ```

    `resetByType` prend en charge `direct` (ancien alias `dm`), `group` et `thread`. L’ancien paramètre de premier niveau `session.idleMinutes` fonctionne toujours comme alias de compatibilité pour une valeur par défaut en mode inactif lorsqu’aucun bloc `session.reset`/`resetByType` n’est défini. Les sessions associées à une session CLI active appartenant au fournisseur ne sont pas interrompues par la réinitialisation quotidienne implicite par défaut. Consultez [Gestion des sessions](/fr/concepts/session) pour connaître le cycle de vie complet.

  </Accordion>

  <Accordion title="Est-il possible de créer une équipe d’instances OpenClaw (un PDG et plusieurs agents) ?">
    Oui, grâce au **routage multi-agent** et aux **sous-agents** : un agent coordinateur et plusieurs agents de travail disposant de leurs propres espaces de travail et modèles.

    Il vaut mieux considérer cela comme une expérience ludique : cette approche consomme beaucoup de jetons et est souvent moins efficace qu’un seul bot utilisant des sessions distinctes. Le modèle habituel consiste à utiliser un bot avec lequel vous dialoguez, différentes sessions pour le travail en parallèle et des sous-agents créés selon les besoins.

    Documentation : [Routage multi-agent](/fr/concepts/multi-agent), [Sous-agents](/fr/tools/subagents), [CLI des agents](/fr/cli/agents).

  </Accordion>

  <Accordion title="Pourquoi le contexte a-t-il été tronqué en cours de tâche ? Comment l’éviter ?">
    Le contexte de la session est limité par la fenêtre du modèle. Les conversations longues, les sorties d’outils volumineuses ou les nombreux fichiers peuvent déclencher une Compaction ou une troncation.

    - Demandez au bot de résumer l’état actuel et de l’écrire dans un fichier.
    - Utilisez `/compact` avant les tâches longues et `/new` lorsque vous changez de sujet.
    - Conservez le contexte important dans l’espace de travail et demandez au bot de le relire.
    - Utilisez des sous-agents pour les travaux longs ou parallèles afin de réduire la taille de la conversation principale.
    - Choisissez un modèle doté d’une fenêtre de contexte plus grande si cela se produit souvent.

  </Accordion>

  <Accordion title="Comment réinitialiser complètement OpenClaw tout en le conservant installé ?">
    ```bash
    openclaw reset
    ```

    Réinitialisation complète non interactive :

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Relancez ensuite la configuration :

    ```bash
    openclaw onboard --install-daemon
    ```

    L’intégration propose également **Réinitialiser** si elle détecte une configuration existante ; consultez [Intégration (CLI)](/fr/start/wizard). Si vous avez utilisé des profils (`--profile` / `OPENCLAW_PROFILE`), réinitialisez chaque répertoire d’état (par défaut `~/.openclaw-<profile>`). Réinitialisation réservée au développement : `openclaw gateway --dev --reset` efface la configuration de développement, les identifiants, les sessions et l’espace de travail.

  </Accordion>

  <Accordion title='Je rencontre des erreurs "context too large" : comment réinitialiser ou effectuer une Compaction ?'>
    - **Compaction** (conserve la conversation et résume les échanges plus anciens) : `/compact` ou `/compact <instructions>` pour orienter le résumé.
    - **Réinitialisation** (nouvel identifiant de session pour la même clé de conversation) : `/new` ou `/reset`.

    Si le problème persiste, ajustez l’**élagage des sessions** (`agents.defaults.contextPruning`) pour supprimer les anciennes sorties d’outils ou utilisez un modèle doté d’une fenêtre de contexte plus grande.

    Documentation : [Compaction](/fr/concepts/compaction), [Élagage des sessions](/fr/concepts/session-pruning), [Gestion des sessions](/fr/concepts/session).

  </Accordion>

  <Accordion title='Pourquoi le message "LLM request rejected: messages.content.tool_use.input field required" s’affiche-t-il ?'>
    Erreur de validation du fournisseur : le modèle a généré un bloc `tool_use` sans le champ `input` requis. Cela signifie généralement que l’historique de la session est obsolète ou corrompu (souvent après de longues discussions ou une modification d’outil/de schéma).

    Solution : démarrez une nouvelle session avec `/new` (message autonome).

  </Accordion>

  <Accordion title="Pourquoi est-ce que je reçois des messages Heartbeat toutes les 30 minutes ?">
    Les Heartbeat s’exécutent toutes les **30m** par défaut, ou toutes les **1h** lorsque le mode d’authentification déterminé est l’authentification OAuth/par jeton d’Anthropic (y compris la réutilisation de Claude CLI) et que `heartbeat.every` n’est pas défini. Pour ajuster la fréquence ou les désactiver :

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // ou "0m" pour désactiver
          },
        },
      },
    }
    ```

    Si `HEARTBEAT.md` existe, mais est effectivement vide (uniquement des lignes vides, des commentaires Markdown/HTML, des titres ATX, des marqueurs de bloc délimité ou des éléments de liste vides), OpenClaw ignore l’exécution du Heartbeat afin d’économiser des appels d’API. Si le fichier est absent, le Heartbeat s’exécute tout de même et le modèle décide de l’action à entreprendre.

    Les remplacements propres à chaque agent utilisent `agents.list[].heartbeat`. Documentation : [Heartbeat](/fr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Dois-je ajouter un "compte de bot" à un groupe WhatsApp ?'>
    Non. OpenClaw fonctionne avec **votre propre compte** : si vous appartenez au groupe, OpenClaw peut le voir. Par défaut, les réponses dans les groupes sont bloquées jusqu’à ce que vous autorisiez les expéditeurs (`groupPolicy: "allowlist"`).

    Pour limiter les réponses dans les groupes à vous seul :

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
    Méthode la plus rapide : suivez les journaux et envoyez un message de test dans le groupe.

    ```bash
    openclaw logs --follow --json
    ```

    Recherchez `chatId` (ou `from`) se terminant par `@g.us`, par exemple `1234567890-1234567890@g.us`.

    Si les groupes sont déjà configurés ou ajoutés à la liste d’autorisation, affichez-les depuis la configuration :

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentation : [WhatsApp](/fr/channels/whatsapp), [Annuaire](/fr/cli/directory), [Journaux](/fr/cli/logs).

  </Accordion>

  <Accordion title="Pourquoi OpenClaw ne répond-il pas dans un groupe ?">
    Deux causes courantes : le filtrage par mention est activé par défaut (vous devez @mentionner le bot ou correspondre à `mentionPatterns`), ou vous avez configuré `channels.whatsapp.groups` sans `"*"` et le groupe ne figure pas dans la liste d’autorisation.

    Consultez [Groupes](/fr/channels/groups) et [Messages de groupe](/fr/channels/group-messages).

  </Accordion>

  <Accordion title="Les groupes/fils de discussion partagent-ils leur contexte avec les messages privés ?">
    Les conversations directes sont regroupées dans la session principale par défaut. Les groupes/canaux possèdent leurs propres clés de session, et les sujets Telegram/fils de discussion Discord constituent des sessions distinctes. Consultez [Groupes](/fr/channels/groups) et [Messages de groupe](/fr/channels/group-messages).
  </Accordion>

  <Accordion title="Combien d’espaces de travail et d’agents puis-je créer ?">
    Il n’existe aucune limite stricte : plusieurs dizaines, voire plusieurs centaines, conviennent, mais surveillez les éléments suivants :

    - **Croissance de l’espace disque** : les sessions actives et les transcriptions sont stockées dans la base de données SQLite propre à chaque agent ; les anciens artefacts ou les archives peuvent encore s’accumuler sous `~/.openclaw/agents/<agentId>/sessions/`.
    - **Coût en jetons** : davantage d’agents implique une utilisation simultanée accrue des modèles.
    - **Charge opérationnelle** : profils d’authentification, espaces de travail et routage des canaux propres à chaque agent.

    Conservez un espace de travail **actif** par agent (`agents.defaults.workspace`), élaguez les anciennes sessions avec `openclaw sessions cleanup` si l’espace disque augmente (ne modifiez pas manuellement l’état SQLite actif) et utilisez `openclaw doctor` pour repérer les espaces de travail parasites et les incohérences de profils.

  </Accordion>

  <Accordion title="Puis-je exécuter plusieurs bots ou conversations simultanément (Slack), et comment dois-je les configurer ?">
    Oui, grâce au **routage multi-agent** : exécutez plusieurs agents isolés et routez les messages entrants selon le canal, le compte ou le pair. Slack est pris en charge comme canal et peut être associé à des agents précis.

    L’accès au navigateur est puissant, mais ne permet pas de « faire tout ce qu’un humain peut faire » : les protections anti-bot, les CAPTCHA et l’authentification multifacteur peuvent toujours bloquer l’automatisation. Pour un contrôle plus fiable, utilisez Chrome MCP localement sur l’hôte ou CDP sur la machine qui exécute réellement le navigateur.

    Configuration recommandée : hôte du Gateway toujours actif (VPS/Mac mini), un agent par rôle (liaisons), canal ou canaux Slack liés à ces agents, et navigateur local via Chrome MCP ou un Node si nécessaire.

    Documentation : [Routage multi-agent](/fr/concepts/multi-agent), [Slack](/fr/channels/slack), [Navigateur](/fr/tools/browser), [Nodes](/fr/nodes).

  </Accordion>
</AccordionGroup>

## Modèles, basculement et profils d’authentification

La FAQ sur les modèles — valeurs par défaut, sélection, alias, changement, basculement, profils d’authentification — se trouve dans la [FAQ sur les modèles](/fr/help/faq-models).

## Gateway : ports, « déjà en cours d’exécution » et mode distant

<AccordionGroup>
  <Accordion title="Quel port le Gateway utilise-t-il ?">
    `gateway.port` contrôle le port multiplexé unique pour WebSocket + HTTP (interface de contrôle, hooks, etc.). Ordre de priorité :

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > valeur par défaut 18789
    ```

  </Accordion>

  <Accordion title='Pourquoi openclaw gateway status indique-t-il "Runtime: running", mais "Connectivity probe: failed" ?'>
    « Running » correspond au point de vue du **superviseur** (launchd/systemd/schtasks) ; la sonde de connectivité correspond à la CLI qui se connecte réellement au WebSocket du Gateway. Fiez-vous à ces lignes de `openclaw gateway status` : `Probe target:` (l’URL utilisée par la sonde), `Listening:` (ce qui écoute réellement sur le port), `Last gateway error:` (cause racine courante lorsque le processus est actif, mais que le port n’est pas en écoute).
  </Accordion>

  <Accordion title='Pourquoi openclaw gateway status affiche-t-il des valeurs différentes pour "Config (cli)" et "Config (service)" ?'>
    Vous modifiez un fichier de configuration tandis que le service en utilise un autre (souvent en raison d’une divergence de `--profile` / `OPENCLAW_STATE_DIR`).

    Pour corriger le problème, exécutez cette commande avec le même `--profile` / environnement que celui que le service doit utiliser :

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='Que signifie "another gateway instance is already listening" ?'>
    OpenClaw applique un verrou d’exécution en liant immédiatement l’écouteur WebSocket au démarrage (`ws://127.0.0.1:18789` par défaut). Si la liaison échoue avec `EADDRINUSE`, il lève `GatewayLockError` (« another gateway instance is already listening »).

    Solution : arrêtez l’autre instance, libérez le port ou exécutez `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Comment exécuter OpenClaw en mode distant (le client se connecte à un Gateway situé ailleurs) ?">
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

    - `openclaw gateway` ne démarre que lorsque `gateway.mode` vaut `local` (ou si vous transmettez une option de remplacement).
    - L’application macOS surveille le fichier de configuration et change de mode à chaud lorsque ces valeurs changent.
    - `gateway.remote.token` / `.password` sont uniquement des identifiants distants côté client ; ils n’activent pas à eux seuls l’authentification du Gateway local.

  </Accordion>

  <Accordion title='L’interface de contrôle indique "unauthorized" (ou continue de se reconnecter). Que faire ?'>
    Le chemin d’authentification de votre Gateway et la méthode d’authentification de l’interface ne correspondent pas.

    Faits (issus du code) :

    - L’interface de contrôle conserve le jeton dans `sessionStorage`, limité à l’onglet actuel du navigateur et à l’URL du Gateway sélectionnée ; les actualisations dans le même onglet continuent donc de fonctionner sans persistance durable du jeton dans localStorage.
    - En cas de `AUTH_TOKEN_MISMATCH`, les clients de confiance peuvent effectuer une tentative supplémentaire limitée avec un jeton d’appareil mis en cache lorsque le Gateway renvoie des indications de nouvelle tentative (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Cette nouvelle tentative avec le jeton mis en cache réutilise les portées approuvées mises en cache avec le jeton d’appareil ; les appelants fournissant explicitement `deviceToken` / `scopes` conservent les portées demandées au lieu d’hériter de celles du cache.
    - En dehors de ce chemin de nouvelle tentative, l’ordre de priorité de l’authentification à la connexion est le suivant : jeton partagé ou mot de passe explicite, puis `deviceToken` explicite, puis jeton d’appareil enregistré, puis jeton d’amorçage.
    - L’amorçage intégré par code de configuration renvoie un jeton d’appareil Node avec `scopes: []`, ainsi qu’un jeton limité de transfert à l’opérateur pour l’intégration mobile de confiance. Le transfert à l’opérateur peut lire la configuration native au moment de la configuration, mais n’accorde ni les portées de modification de l’association ni `operator.admin`.

    Solution :

    - Méthode la plus rapide : `openclaw dashboard` (affiche et copie l’URL du tableau de bord, puis tente de l’ouvrir ; affiche une indication SSH en mode sans interface graphique).
    - Aucun jeton pour le moment : `openclaw doctor --generate-gateway-token`.
    - À distance : créez d’abord un tunnel avec `ssh -N -L 18789:127.0.0.1:18789 user@host`, puis ouvrez `http://127.0.0.1:18789/`.
    - Mode à secret partagé : définissez `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, puis collez le secret correspondant dans les paramètres de l’interface de contrôle.
    - Mode Tailscale Serve : vérifiez que `gateway.auth.allowTailscale` est activé et que vous ouvrez l’URL Serve, et non une URL loopback/tailnet brute qui contourne les en-têtes d’identité Tailscale.
    - Mode proxy de confiance : vérifiez que vous passez par le proxy configuré avec gestion des identités. Les proxys loopback sur le même hôte nécessitent également `gateway.auth.trustedProxy.allowLoopback = true`.
    - Si la divergence persiste après l’unique nouvelle tentative : renouvelez et réapprouvez le jeton de l’appareil associé :
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - Renouvellement refusé : les sessions d’appareils associés ne peuvent renouveler que le jeton de leur **propre** appareil, sauf si elles disposent également de `operator.admin`, et les valeurs `--scope` explicites ne peuvent pas dépasser les portées d’opérateur actuelles de l’appelant.
    - Toujours bloqué : exécutez `openclaw status --all` et consultez le [Dépannage](/fr/gateway/troubleshooting). Consultez le [Tableau de bord](/fr/web/dashboard) pour les détails d’authentification.

  </Accordion>

  <Accordion title="J’ai défini gateway.bind sur tailnet, mais il écoute uniquement sur loopback">
    La liaison `tailnet` sélectionne une adresse IP Tailscale parmi vos interfaces réseau (100.64.0.0/10). Si la machine n’est pas connectée à Tailscale (ou si l’interface est inactive), le Gateway revient à loopback au lieu d’exposer une autre interface réseau.

    Solution : démarrez Tailscale sur cet hôte et redémarrez le Gateway, ou passez explicitement à `gateway.bind: "loopback"` / `"lan"`.

    `tailnet` est explicite ; `auto` privilégie loopback. Utilisez `gateway.bind: "tailnet"` pour limiter l’exposition hors loopback au Tailnet tout en conservant l’écouteur `127.0.0.1` requis sur le même hôte.

  </Accordion>

  <Accordion title="Puis-je exécuter plusieurs Gateways sur le même hôte ?">
    Généralement non : un Gateway peut gérer plusieurs canaux de messagerie et agents. N’utilisez plusieurs Gateways que pour la redondance (par exemple, un bot de secours) ou une isolation stricte, et isolez chacun avec ses propres `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `agents.defaults.workspace` et un `gateway.port` unique.

    Recommandation : utilisez `openclaw --profile <name> ...` pour chaque instance (crée automatiquement `~/.openclaw-<name>`), un `gateway.port` unique dans la configuration de chaque profil (ou `--port` pour les exécutions manuelles), ainsi qu’un service par profil avec `openclaw --profile <name> gateway install`.

    Les profils ajoutent également un suffixe aux noms des services : launchd `ai.openclaw.<profile>`, systemd `openclaw-gateway-<profile>.service`, Windows `OpenClaw Gateway (<profile>)`. L’unité systemd non qualifiée `openclaw-gateway` n’existe que pour le profil par défaut ; l’ancien nom d’unité systemd antérieur au changement de nom, `clawdbot-gateway`, est migré automatiquement.

    Guide complet : [Gateways multiples](/fr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Que signifie "invalid handshake" / le code 1008 ?'>
    Le Gateway est un **serveur WebSocket** et attend une trame `connect` comme premier message. Tout autre message ferme la connexion avec le **code 1008** (violation de la politique).

    Causes courantes : vous avez ouvert l’URL **HTTP** dans un navigateur au lieu d’utiliser un client WS, utilisé le mauvais port ou chemin, ou un proxy/tunnel a supprimé les en-têtes d’authentification ou envoyé une requête ne provenant pas du Gateway.

    Solution : utilisez l’URL WS (`ws://<host>:18789` ou `wss://...` via HTTPS), n’ouvrez pas le port WS dans un onglet de navigateur normal et incluez le jeton ou le mot de passe dans la trame `connect` lorsque l’authentification est activée. Exemple avec la CLI/TUI :

    ```bash
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Détails du protocole : [Protocole du Gateway](/fr/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Journalisation et débogage

<AccordionGroup>
  <Accordion title="Où se trouvent les journaux ?">
    Journaux dans un fichier (structurés) : `/tmp/openclaw/openclaw-YYYY-MM-DD.log`. Définissez un chemin stable via `logging.file`, le niveau de journalisation du fichier via `logging.level` et la verbosité de la console via `--verbose` et `logging.consoleLevel`.

    Commande la plus rapide pour les suivre :

    ```bash
    openclaw logs --follow
    ```

    Journaux du service/superviseur (lorsque le Gateway s’exécute via launchd/systemd) :

    - Sortie standard de launchd sous macOS : `~/Library/Logs/openclaw/gateway.log` (les profils utilisent `gateway-<profile>.log` ; la sortie d’erreur standard est supprimée).
    - Linux : `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`.
    - Windows : `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`.

    Consultez le [Dépannage](/fr/gateway/troubleshooting) pour en savoir plus.

  </Accordion>

  <Accordion title="Comment démarrer, arrêter ou redémarrer le service Gateway ?">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Si vous exécutez le Gateway manuellement, `openclaw gateway --force` peut récupérer le port. Consultez [Gateway](/fr/gateway).

  </Accordion>

  <Accordion title="J’ai fermé mon terminal sous Windows : comment redémarrer OpenClaw ?">
    Trois modes d’installation sous Windows :

    **1) Configuration locale du Windows Hub** : l’application native gère un Gateway WSL local appartenant à l’application. Ouvrez **OpenClaw Companion** depuis le menu Démarrer ou la zone de notification, puis utilisez **Gateway Setup** ou l’onglet Connections.

    **2) Gateway WSL2 manuel** : le Gateway s’exécute dans Linux.
    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```
    Si vous n’avez jamais installé le service, démarrez-le au premier plan : `openclaw gateway run`.

    **3) CLI/Gateway Windows natif** : s’exécute directement sous Windows.
    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```
    Si vous l’exécutez manuellement (sans service) : `openclaw gateway run`.

    Documentation : [Windows](/fr/platforms/windows), [Guide opérationnel du service Gateway](/fr/gateway).

  </Accordion>

  <Accordion title="Le Gateway est actif, mais les réponses n’arrivent jamais. Que dois-je vérifier ?">
    Vérification rapide de l’état :

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causes courantes : l’authentification du modèle n’est pas chargée sur l’**hôte du Gateway** (vérifiez `models status`), l’association du canal ou la liste d’autorisation bloque les réponses (vérifiez la configuration du canal et les journaux), ou WebChat/le tableau de bord est ouvert sans le bon jeton. En cas d’accès distant, vérifiez que le tunnel ou la connexion Tailscale est actif et que le WebSocket du Gateway est accessible.

    Documentation : [Canaux](/fr/channels), [Dépannage](/fr/gateway/troubleshooting), [Accès distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" : que faire ?'>
    Cela signifie généralement que l’interface a perdu la connexion WebSocket. Vérifiez : le Gateway est-il en cours d’exécution (`openclaw gateway status`) ? Est-il opérationnel (`openclaw status`) ? L’interface dispose-t-elle du bon jeton (`openclaw dashboard`) ? En cas d’accès distant, le tunnel ou la liaison Tailscale est-il actif ?

    Consultez ensuite les journaux en temps réel :

    ```bash
    openclaw logs --follow
    ```

    Documentation : [Tableau de bord](/fr/web/dashboard), [Accès distant](/fr/gateway/remote), [Dépannage](/fr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands échoue. Que dois-je vérifier ?">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Faites ensuite correspondre l’erreur :

    - `BOT_COMMANDS_TOO_MUCH` : le menu Telegram comporte trop d’entrées. OpenClaw réduit déjà le nombre d’entrées à la limite de Telegram et réessaie avec moins de commandes, mais certaines entrées du menu peuvent tout de même être omises. Réduisez les commandes de plugins, de Skills ou personnalisées, ou désactivez `channels.telegram.commands.native` si vous n’avez pas besoin du menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` ou erreurs réseau similaires : sur un VPS ou derrière un proxy, vérifiez que les connexions HTTPS sortantes sont autorisées et que la résolution DNS fonctionne pour `api.telegram.org`.

    Si le Gateway est distant, consultez les journaux sur l’hôte du Gateway.

    Documentation : [Telegram](/fr/channels/telegram), [Dépannage des canaux](/fr/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI n’affiche aucune sortie. Que dois-je vérifier ?">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Dans la TUI, utilisez `/status` pour afficher l’état actuel. Si vous attendez des réponses dans un canal de discussion, vérifiez que la distribution est activée (`/deliver on`).

    Documentation : [TUI](/fr/web/tui), [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Comment arrêter complètement le Gateway, puis le redémarrer ?">
    Si vous avez installé le service (launchd sous macOS, systemd sous Linux) :

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Au premier plan, arrêtez-le avec Ctrl-C, puis exécutez `openclaw gateway run`.

    Documentation : [Guide d’exploitation du service Gateway](/fr/gateway).

  </Accordion>

  <Accordion title="Explication simple : openclaw gateway restart ou openclaw gateway">
    `openclaw gateway restart` redémarre le **service en arrière-plan** (launchd/systemd). `openclaw gateway` exécute le Gateway **au premier plan** pour cette session de terminal. Utilisez les sous-commandes du Gateway si vous avez installé le service ; utilisez l’exécution directe au premier plan pour une utilisation ponctuelle.
  </Accordion>

  <Accordion title="Moyen le plus rapide d’obtenir plus de détails en cas d’échec">
    Démarrez le Gateway avec `--verbose` pour obtenir davantage de détails dans la console, puis examinez le fichier journal pour rechercher les erreurs d’authentification des canaux, de routage des modèles et de RPC.
  </Accordion>
</AccordionGroup>

## Médias et pièces jointes

<AccordionGroup>
  <Accordion title="Ma Skill a généré une image ou un PDF, mais rien n’a été envoyé">
    Les pièces jointes sortantes de l’agent doivent utiliser des champs de média structurés tels que `media`, `mediaUrl`, `path` ou `filePath`. Consultez [Configuration de l’assistant OpenClaw](/fr/start/openclaw) et [Envoi par l’agent](/fr/tools/agent-send).

    ```bash
    openclaw message send --target +15555550123 --message "Voici le fichier" --media /path/to/file.png
    ```

    Vérifiez également que le canal cible prend en charge les médias sortants et n’est pas bloqué par des listes d’autorisation ; que le fichier respecte les limites de taille du fournisseur (les images sont redimensionnées pour que leur côté maximal ne dépasse pas 2048px) ; `tools.fs.workspaceOnly=true` limite les envois depuis des chemins locaux aux fichiers de l’espace de travail, du stockage temporaire/de médias et validés par le bac à sable ; `tools.fs.workspaceOnly=false` (valeur par défaut) permet aux envois structurés de médias locaux d’utiliser les fichiers locaux de l’hôte que l’agent peut déjà lire, pour les médias ainsi que les types de documents sûrs (images, audio, vidéo, PDF, documents Office et documents texte validés tels que Markdown/MD, TXT, JSON, YAML/YML). Il ne s’agit pas d’un détecteur de secrets : un fichier `secret.txt` ou `config.json` lisible par l’agent peut être joint si son extension et son contenu satisfont à la validation. Conservez les fichiers sensibles hors des chemins accessibles à l’agent, ou gardez `tools.fs.workspaceOnly=true` pour imposer des restrictions plus strictes aux envois depuis des chemins locaux.

    Consultez [Images](/fr/nodes/images).

  </Accordion>
</AccordionGroup>

## Sécurité et contrôle d’accès

<AccordionGroup>
  <Accordion title="Est-il sûr d’exposer OpenClaw aux messages privés entrants ?">
    Traitez les messages privés entrants comme des données non fiables. Les valeurs par défaut réduisent les risques :

    - Le comportement par défaut des canaux prenant en charge les messages privés est l’**appairage** : les expéditeurs inconnus reçoivent un code d’appairage et leur message n’est pas traité. Approuvez-les avec `openclaw pairing approve --channel <channel> [--account <id>] <code>`. Le nombre de demandes en attente est limité à **3 par canal** ; consultez `openclaw pairing list --channel <channel> [--account <id>]` si aucun code n’est arrivé.
    - L’ouverture publique des messages privés nécessite une activation explicite (`dmPolicy: "open"` et liste d’autorisation `"*"`).

    Exécutez `openclaw doctor` pour détecter les politiques de messages privés risquées.

  </Accordion>

  <Accordion title="L’injection de prompt ne concerne-t-elle que les bots publics ?">
    Non. L’injection de prompt concerne le **contenu non fiable**, et pas seulement les personnes autorisées à envoyer des messages privés au bot. Si votre assistant lit du contenu externe (recherche/récupération sur le Web, pages de navigateur, e-mails, documents, pièces jointes, journaux collés), ce contenu peut contenir des instructions visant à détourner le modèle, même si vous êtes le seul expéditeur.

    Le risque est maximal lorsque des outils sont activés : le modèle peut être manipulé afin d’exfiltrer le contexte ou d’appeler des outils en votre nom. Réduisez l’étendue des conséquences :

    - utilisez un agent « lecteur » en lecture seule ou sans outils pour résumer le contenu non fiable
    - désactivez `web_search` / `web_fetch` / `browser` pour les agents ayant accès aux outils
    - traitez également comme non fiable le texte décodé des fichiers et documents : l’extraction de `input_file` d’OpenResponses et celle des pièces jointes multimédias encadrent toutes deux le texte extrait par des marqueurs explicites de délimitation du contenu externe au lieu de transmettre directement le texte brut du fichier
    - utilisez un bac à sable et des listes d’autorisation d’outils strictes

    Détails : [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="OpenClaw est-il moins sûr parce qu’il utilise TypeScript/Node au lieu de Rust/WASM ?">
    Le langage et l’environnement d’exécution comptent, mais ils ne constituent pas le risque principal pour un agent personnel. Les risques concrets concernent l’exposition du Gateway, les personnes autorisées à envoyer des messages au bot, l’injection de prompt, la portée des outils, la gestion des identifiants, l’accès au navigateur, l’accès à l’exécution de commandes et la confiance accordée aux Skills/plugins tiers.

    Rust et WASM peuvent offrir une isolation plus forte pour certaines catégories de code, mais ils ne résolvent pas l’injection de prompt, les mauvaises listes d’autorisation, l’exposition publique du Gateway, les outils dotés d’autorisations excessives ni un profil de navigateur déjà connecté à des comptes sensibles. Considérez les mesures suivantes comme les principaux contrôles : gardez le Gateway privé ou authentifié, utilisez l’appairage et des listes d’autorisation pour les messages privés/groupes, refusez les outils risqués ou exécutez-les dans un bac à sable pour les données non fiables, n’installez que des plugins et Skills de confiance, puis exécutez `openclaw security audit --deep` après toute modification de la configuration.

    Détails : [Sécurité](/fr/gateway/security), [Mise en bac à sable](/fr/gateway/sandboxing).

  </Accordion>

  <Accordion title="J’ai vu des signalements d’instances OpenClaw exposées. Que dois-je vérifier ?">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Une configuration de référence plus sûre : Gateway lié à `loopback`, ou exposé uniquement par un accès privé authentifié (tailnet, tunnel SSH, authentification par jeton/mot de passe ou proxy de confiance correctement configuré) ; messages privés en mode `pairing` ou `allowlist` ; groupes placés sur liste d’autorisation et soumis à l’obligation de mention, sauf si tous les membres sont de confiance ; outils à haut risque (`exec`, `browser`, `gateway`, `cron`) refusés ou strictement limités pour les agents qui lisent du contenu non fiable ; mise en bac à sable activée lorsque l’exécution d’outils nécessite de réduire l’étendue des conséquences.

    Les liaisons publiques sans authentification, les messages privés/groupes ouverts avec des outils et le contrôle du navigateur exposé sont les problèmes à corriger en premier. Détails : [openclaw security audit](/fr/gateway/security#openclaw-security-audit).

  </Accordion>

  <Accordion title="Les Skills ClawHub et les plugins tiers sont-ils sûrs à installer ?">
    Traitez les Skills et plugins tiers comme du code auquel vous choisissez d’accorder votre confiance. Les pages des Skills ClawHub affichent l’état de l’analyse avant l’installation, mais ces analyses ne constituent pas une frontière de sécurité complète. OpenClaw n’exécute pas de blocage local intégré du code dangereux lors de l’installation ou de la mise à jour des plugins/Skills ; utilisez la stratégie `security.installPolicy` gérée par l’opérateur pour les décisions locales d’autorisation ou de blocage.

    Approche plus sûre : privilégiez les auteurs de confiance et les versions épinglées, lisez la Skill ou le plugin avant de l’activer, limitez strictement les listes d’autorisation de plugins/Skills, exécutez les processus traitant des données non fiables dans un bac à sable avec un minimum d’outils et évitez d’accorder au code tiers un accès étendu au système de fichiers, à l’exécution de commandes, au navigateur ou aux secrets.

    Détails : [Skills](/fr/tools/skills), [Plugins](/fr/tools/plugin), [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Mon bot doit-il disposer de sa propre adresse e-mail, de son propre compte GitHub ou de son propre numéro de téléphone ?">
    Oui, pour la plupart des configurations. Isoler le bot avec des comptes et des numéros de téléphone distincts réduit l’étendue des conséquences en cas de problème et facilite la rotation des identifiants ou la révocation des accès sans affecter vos comptes personnels.

    Commencez avec un périmètre réduit : n’accordez l’accès qu’aux outils et aux comptes dont vous avez réellement besoin, puis élargissez-le ultérieurement si nécessaire.

    Documentation : [Sécurité](/fr/gateway/security), [Appairage](/fr/channels/pairing).

  </Accordion>

  <Accordion title="Puis-je lui donner une autonomie sur mes SMS, et est-ce sûr ?">
    Nous ne recommandons **pas** une autonomie totale sur vos messages personnels. Approche la plus sûre : conservez les messages privés en **mode d’appairage** ou utilisez une liste d’autorisation stricte, utilisez un **numéro ou un compte distinct** s’il doit envoyer des messages en votre nom, et laissez-le préparer des brouillons que vous **approuvez avant l’envoi**.

    Pour expérimenter, utilisez un compte dédié et isolé. Consultez [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Puis-je utiliser des modèles moins chers pour les tâches d’un assistant personnel ?">
    Oui, **si** l’agent est limité à la discussion et que les données d’entrée sont fiables. Les modèles des gammes inférieures sont plus vulnérables au détournement par des instructions ; évitez-les donc pour les agents ayant accès à des outils ou lisant du contenu non fiable. Si vous devez utiliser un modèle plus petit, restreignez les outils et exécutez-le dans un bac à sable. Consultez [Sécurité](/fr/gateway/security).
  </Accordion>

  <Accordion title="J’ai exécuté /start dans Telegram, mais je n’ai pas reçu de code d’appairage">
    Les codes d’appairage sont envoyés **uniquement** lorsqu’un expéditeur inconnu envoie un message au bot et que `dmPolicy: "pairing"` est activé ; `/start` seul ne génère aucun code.

    Consultez les demandes en attente :

    ```bash
    openclaw pairing list telegram
    ```

    Pour obtenir un accès immédiat, ajoutez votre identifiant d’expéditeur à la liste d’autorisation ou définissez `dmPolicy: "open"` pour ce compte.

  </Accordion>

  <Accordion title="WhatsApp : enverra-t-il des messages à mes contacts ? Comment fonctionne l’appairage ?">
    Non. La politique par défaut des messages privés WhatsApp est l’**appairage**. Les expéditeurs inconnus reçoivent uniquement un code d’appairage ; leur message n’est **pas traité**. OpenClaw répond uniquement aux discussions qu’il reçoit ou aux envois explicites que vous déclenchez.

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    L’invite de numéro de téléphone de l’assistant de configuration définit votre **liste d’autorisation/propriétaire** afin d’autoriser vos propres messages privés ; elle n’est pas utilisée pour l’envoi automatique. Avec votre numéro WhatsApp personnel, utilisez ce numéro et activez `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Commandes de discussion, interruption des tâches et « il ne s’arrête pas »

<AccordionGroup>
  <Accordion title="Comment empêcher les messages système internes d’apparaître dans la discussion ?">
    La plupart des messages internes ou des messages d’outils n’apparaissent que lorsque le mode **détaillé**, **trace** ou **raisonnement** est activé pour cette session.

    Corrigez ce réglage dans la discussion où ils apparaissent :

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    Si le bruit persiste : vérifiez les paramètres de la session dans l’interface de contrôle et définissez le mode détaillé sur **hériter** ; vérifiez que vous n’utilisez pas un profil de bot comportant `verboseDefault: "on"` dans la configuration.

    Documentation : [Réflexion et mode détaillé](/fr/tools/thinking), [Sécurité](/fr/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Comment arrêter ou annuler une tâche en cours ?">
    Envoyez l’un des éléments suivants **comme message autonome** (sans barre oblique) pour déclencher une interruption : `stop`, `stop action`, `stop current action`, `stop run`, `stop current run`, `stop agent`, `stop the agent`, `stop openclaw`, `openclaw stop`, `stop don't do anything`, `stop do not do anything`, `stop doing anything`, `do not do that`, `please stop`, `stop please`, `abort`, `esc`, `exit`, `interrupt`, `halt`. Les déclencheurs courants dans d’autres langues (français, allemand, espagnol, chinois, japonais, hindi, arabe et russe) fonctionnent également.

    Pour les processus en arrière-plan démarrés par l’outil exec, demandez à l’agent d’exécuter :

    ```text
    process action:kill sessionId:XXX
    ```

    La plupart des commandes slash doivent être envoyées sous forme de **message autonome** commençant par `/`, mais quelques raccourcis (comme `/status`) fonctionnent également au sein d’un message pour les expéditeurs figurant sur la liste d’autorisation. Consultez [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title='Comment envoyer un message Discord depuis Telegram ? (« Messagerie intercontexte refusée »)'>
    OpenClaw bloque par défaut la messagerie **entre fournisseurs**. Si un appel d’outil est lié à Telegram, il n’enverra pas de message à Discord sauf si vous l’autorisez explicitement — cette modification prend effet immédiatement, sans redémarrage du Gateway :

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[depuis {channel}] " },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title='Pourquoi ai-je l’impression que le bot « ignore » les messages envoyés en rafale ?'>
    Par défaut, les invites reçues pendant une exécution sont dirigées vers l’exécution active. Utilisez `/queue` pour choisir le comportement de l’exécution active :

    - `steer` (par défaut) — guide l’exécution active à la prochaine limite du modèle.
    - `followup` — met les messages en file d’attente et les exécute un par un après la fin de l’exécution en cours.
    - `collect` — met les messages compatibles en file d’attente et répond une seule fois après la fin de l’exécution en cours.
    - `interrupt` — interrompt l’exécution en cours et en démarre une nouvelle.

    Ajoutez des options aux modes de mise en file d’attente, comme `debounce:0.5s cap:25 drop:summarize`. Consultez [File d’attente des commandes](/fr/concepts/queue) et [File d’attente de guidage](/fr/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Divers

<AccordionGroup>
  <Accordion title='Quel est le modèle par défaut d’Anthropic avec une clé API ?'>
    Les identifiants et la sélection du modèle sont distincts. Définir `ANTHROPIC_API_KEY` (ou stocker une clé API Anthropic dans les profils d’authentification) active l’authentification, mais le modèle réellement utilisé par défaut est celui que vous configurez dans `agents.defaults.model.primary` (par exemple `anthropic/claude-sonnet-4-6` ou `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` signifie que le Gateway n’a pas trouvé les identifiants Anthropic dans le fichier `auth-profiles.json` attendu pour l’agent en cours d’exécution.
  </Accordion>
</AccordionGroup>

---

Toujours bloqué ? Posez votre question sur [Discord](https://discord.com/invite/clawd) ou ouvrez une [discussion GitHub](https://github.com/openclaw/openclaw/discussions).

## Pages connexes

- [FAQ sur la première exécution](/fr/help/faq-first-run) — installation, intégration initiale, authentification, abonnements et premiers échecs
- [FAQ sur les modèles](/fr/help/faq-models) — sélection du modèle, basculement, profils d’authentification
- [Dépannage](/fr/help/troubleshooting) — triage fondé d’abord sur les symptômes
