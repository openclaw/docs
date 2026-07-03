---
read_when:
    - Réponses aux questions courantes d’assistance sur la configuration, l’installation, l’intégration ou l’exécution
    - Trier les problèmes signalés par les utilisateurs avant un débogage plus approfondi
summary: Questions fréquentes sur l’installation, la configuration et l’utilisation d’OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-07-03T13:28:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d55385d187c20dfce05022b76fcaa054c19fc22e46da66d4a24e2538dd95708
    source_path: help/faq.md
    workflow: 16
---

Réponses rapides et dépannage plus approfondi pour les configurations réelles (développement local, VPS, multi-agent, clés OAuth/API, basculement de modèle). Pour les diagnostics d’exécution, consultez [Dépannage](/fr/gateway/troubleshooting). Pour la référence complète de configuration, consultez [Configuration](/fr/gateway/configuration).

## Les 60 premières secondes si quelque chose est cassé

1. **État rapide (première vérification)**

   ```bash
   openclaw status
   ```

   Résumé local rapide : OS + mise à jour, accessibilité du gateway/service, agents/sessions, configuration des fournisseurs + problèmes d’exécution (quand le Gateway est accessible).

2. **Rapport prêt à coller (sûr à partager)**

   ```bash
   openclaw status --all
   ```

   Diagnostic en lecture seule avec fin des journaux (tokens expurgés).

3. **État du démon + port**

   ```bash
   openclaw gateway status
   ```

   Affiche l’exécution du superviseur par rapport à l’accessibilité RPC, l’URL cible de la sonde et la configuration que le service a probablement utilisée.

4. **Sondes approfondies**

   ```bash
   openclaw status --deep
   ```

   Exécute une sonde de santé Gateway en direct, y compris les sondes de canaux lorsqu’elles sont prises en charge
   (nécessite un Gateway accessible). Consultez [Santé](/fr/gateway/health).

5. **Suivre le dernier journal**

   ```bash
   openclaw logs --follow
   ```

   Si RPC est indisponible, utilisez à la place :

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

## Démarrage rapide et configuration au premier lancement

La FAQ du premier lancement — installation, intégration, routes d’authentification, abonnements, échecs initiaux —
se trouve dans la [FAQ du premier lancement](/fr/help/faq-first-run).

## Qu’est-ce qu’OpenClaw ?

<AccordionGroup>
  <Accordion title="Qu’est-ce qu’OpenClaw, en un paragraphe ?">
    OpenClaw est un assistant IA personnel que vous exécutez sur vos propres appareils. Il répond sur les surfaces de messagerie que vous utilisez déjà (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat et les plugins de canaux inclus tels que QQ Bot) et peut aussi faire de la voix + un Canvas en direct sur les plateformes prises en charge. Le **Gateway** est le plan de contrôle toujours actif ; l’assistant est le produit.
  </Accordion>

  <Accordion title="Proposition de valeur">
    OpenClaw n’est pas « juste un wrapper Claude ». C’est un **plan de contrôle local-first** qui vous permet d’exécuter un
    assistant performant sur **votre propre matériel**, accessible depuis les applications de chat que vous utilisez déjà, avec
    des sessions avec état, de la mémoire et des outils, sans céder le contrôle de vos workflows à un SaaS
    hébergé.

    Points forts :

    - **Vos appareils, vos données :** exécutez le Gateway où vous voulez (Mac, Linux, VPS) et conservez
      l’espace de travail + l’historique des sessions en local.
    - **De vrais canaux, pas un bac à sable web :** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      plus la voix mobile et Canvas sur les plateformes prises en charge.
    - **Agnostique au modèle :** utilisez Anthropic, OpenAI, MiniMax, OpenRouter, etc., avec un routage
      par agent et un basculement.
    - **Option local uniquement :** exécutez des modèles locaux afin que **toutes les données puissent rester sur votre appareil** si vous le souhaitez.
    - **Routage multi-agent :** séparez les agents par canal, compte ou tâche, chacun avec son propre
      espace de travail et ses valeurs par défaut.
    - **Open source et modifiable :** inspectez, étendez et auto-hébergez sans verrouillage fournisseur.

    Documentation : [Gateway](/fr/gateway), [Canaux](/fr/channels), [Multi-agent](/fr/concepts/multi-agent),
    [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Je viens de le configurer : que dois-je faire en premier ?">
    Bons premiers projets :

    - Créer un site web (WordPress, Shopify ou un simple site statique).
    - Prototyper une application mobile (plan, écrans, plan d’API).
    - Organiser des fichiers et dossiers (nettoyage, nommage, étiquetage).
    - Connecter Gmail et automatiser des résumés ou des suivis.

    Il peut gérer de grandes tâches, mais il fonctionne mieux quand vous les découpez en phases et
    utilisez des sous-agents pour le travail en parallèle.

  </Accordion>

  <Accordion title="Quels sont les cinq principaux cas d’utilisation quotidiens d’OpenClaw ?">
    Les gains du quotidien ressemblent généralement à ceci :

    - **Briefings personnels :** résumés de boîte de réception, de calendrier et des actualités qui vous intéressent.
    - **Recherche et rédaction :** recherches rapides, résumés et premiers brouillons pour des e-mails ou des documents.
    - **Rappels et suivis :** relances et listes de contrôle pilotées par Cron ou Heartbeat.
    - **Automatisation du navigateur :** remplir des formulaires, collecter des données et répéter des tâches web.
    - **Coordination multi-appareils :** envoyez une tâche depuis votre téléphone, laissez le Gateway l’exécuter sur un serveur, puis récupérez le résultat dans le chat.

  </Accordion>

  <Accordion title="OpenClaw peut-il aider avec la génération de prospects, la prospection, les publicités et les blogs pour un SaaS ?">
    Oui pour **la recherche, la qualification et la rédaction**. Il peut analyser des sites, créer des listes restreintes,
    résumer des prospects et rédiger des brouillons de prospection ou de textes publicitaires.

    Pour **les campagnes de prospection ou publicitaires**, gardez un humain dans la boucle. Évitez le spam, respectez les lois locales et
    les politiques des plateformes, et relisez tout avant l’envoi. Le modèle le plus sûr consiste à laisser
    OpenClaw rédiger et à approuver vous-même.

    Documentation : [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Quels sont les avantages par rapport à Claude Code pour le développement web ?">
    OpenClaw est un **assistant personnel** et une couche de coordination, pas un remplacement d’IDE. Utilisez
    Claude Code ou Codex pour la boucle de codage directe la plus rapide dans un dépôt. Utilisez OpenClaw quand vous
    voulez une mémoire durable, un accès multi-appareils et l’orchestration d’outils.

    Avantages :

    - **Mémoire persistante + espace de travail** entre les sessions
    - **Accès multiplateforme** (WhatsApp, Telegram, TUI, WebChat)
    - **Orchestration d’outils** (navigateur, fichiers, planification, hooks)
    - **Gateway toujours actif** (exécuté sur un VPS, interaction depuis n’importe où)
    - **Nodes** pour le navigateur/l’écran/la caméra/l’exécution en local

    Showcase : [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills et automatisation

<AccordionGroup>
  <Accordion title="Comment personnaliser les Skills sans garder le dépôt modifié ?">
    Utilisez des remplacements gérés au lieu de modifier la copie du dépôt. Placez vos changements dans `~/.openclaw/skills/<name>/SKILL.md` (ou ajoutez un dossier via `skills.load.extraDirs` dans `~/.openclaw/openclaw.json`). La priorité est `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → inclus → `skills.load.extraDirs`, donc les remplacements gérés priment toujours sur les skills inclus sans toucher à git. Si vous avez besoin que le skill soit installé globalement mais visible seulement par certains agents, gardez la copie partagée dans `~/.openclaw/skills` et contrôlez la visibilité avec `agents.defaults.skills` et `agents.list[].skills`. Seules les modifications dignes d’être intégrées en amont doivent vivre dans le dépôt et partir en PR.
  </Accordion>

  <Accordion title="Puis-je charger des Skills depuis un dossier personnalisé ?">
    Oui. Ajoutez des répertoires supplémentaires via `skills.load.extraDirs` dans `~/.openclaw/openclaw.json` (priorité la plus basse). La priorité par défaut est `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → inclus → `skills.load.extraDirs`. `clawhub` installe dans `./skills` par défaut, qu’OpenClaw traite comme `<workspace>/skills` à la session suivante. Si le skill doit seulement être visible par certains agents, associez cela à `agents.defaults.skills` ou `agents.list[].skills`.
  </Accordion>

  <Accordion title="Comment utiliser différents modèles ou réglages pour différentes tâches ?">
    Aujourd’hui, les modèles pris en charge sont :

    - **Tâches Cron** : les tâches isolées peuvent définir un remplacement de `model` par tâche.
    - **Agents** : routez les tâches vers des agents séparés avec différents modèles par défaut, niveaux de réflexion et paramètres de flux.
    - **Changement à la demande** : utilisez `/model` pour changer le modèle de la session actuelle à tout moment.

    Par exemple, utilisez le même modèle avec des réglages par agent différents :

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

    Placez les valeurs par défaut partagées par modèle dans `agents.defaults.models["provider/model"].params`, puis placez les remplacements propres à chaque agent dans `agents.list[].params` à plat. Ne définissez pas d’entrées imbriquées séparées `agents.list[].models["provider/model"].params` pour le même modèle ; `agents.list[].models` sert au catalogue de modèles par agent et aux remplacements d’exécution.

    Consultez [Tâches Cron](/fr/automation/cron-jobs), [Routage multi-agent](/fr/concepts/multi-agent), [Configuration](/fr/gateway/config-agents) et [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Le bot se fige pendant les travaux lourds. Comment décharger cela ?">
    Utilisez des **sous-agents** pour les tâches longues ou parallèles. Les sous-agents s’exécutent dans leur propre session,
    renvoient un résumé et gardent votre chat principal réactif.

    Demandez à votre bot de « créer un sous-agent pour cette tâche » ou utilisez `/subagents`.
    Utilisez `/status` dans le chat pour voir ce que fait le Gateway en ce moment (et s’il est occupé).

    Astuce tokens : les tâches longues et les sous-agents consomment tous deux des tokens. Si le coût vous préoccupe, définissez un
    modèle moins cher pour les sous-agents via `agents.defaults.subagents.model`.

    Documentation : [Sous-agents](/fr/tools/subagents), [Tâches en arrière-plan](/fr/automation/tasks).

  </Accordion>

  <Accordion title="Comment fonctionnent les sessions de sous-agent liées aux fils sur Discord ?">
    Utilisez les liaisons de fils. Vous pouvez lier un fil Discord à une cible de sous-agent ou de session afin que les messages de suivi dans ce fil restent sur cette session liée.

    Flux de base :

    - Créez avec `sessions_spawn` en utilisant `thread: true` (et éventuellement `mode: "session"` pour un suivi persistant).
    - Ou liez manuellement avec `/focus <target>`.
    - Utilisez `/agents` pour inspecter l’état de liaison.
    - Utilisez `/session idle <duration|off>` et `/session max-age <duration|off>` pour contrôler l’annulation automatique du focus.
    - Utilisez `/unfocus` pour détacher le fil.

    Configuration requise :

    - Valeurs globales par défaut : `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Remplacements Discord : `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Liaison automatique à la création : `channels.discord.threadBindings.spawnSessions` vaut `true` par défaut ; définissez-le sur `false` pour désactiver les créations de sessions liées à un fil.

    Documentation : [Sous-agents](/fr/tools/subagents), [Discord](/fr/channels/discord), [Référence de configuration](/fr/gateway/configuration-reference), [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Un sous-agent a terminé, mais la mise à jour d’achèvement est allée au mauvais endroit ou n’a jamais été publiée. Que dois-je vérifier ?">
    Vérifiez d’abord la route demandeur résolue :

    - La livraison d’un sous-agent en mode achèvement préfère tout fil lié ou toute route de conversation lorsqu’il en existe une.
    - Si l’origine de l’achèvement ne transporte qu’un canal, OpenClaw se rabat sur la route stockée de la session demandeur (`lastChannel` / `lastTo` / `lastAccountId`) afin que la livraison directe puisse quand même réussir.
    - Si aucune route liée ni route stockée utilisable n’existe, la livraison directe peut échouer et le résultat se rabat sur la livraison de session mise en file au lieu d’être publié immédiatement dans le chat.
    - Les cibles invalides ou obsolètes peuvent toujours forcer un repli vers la file ou un échec de livraison final.
    - Si la dernière réponse visible de l’assistant enfant est le token silencieux exact `NO_REPLY` / `no_reply`, ou exactement `ANNOUNCE_SKIP`, OpenClaw supprime intentionnellement l’annonce au lieu de publier une progression antérieure obsolète.
    - La sortie tool/toolResult n’est pas promue en texte de résultat enfant ; le résultat est la dernière réponse visible de l’assistant enfant.

    Déboguer :

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
    - Vérifiez que le Gateway fonctionne 24 h/24 et 7 j/7 (pas de mise en veille/redémarrages).
    - Vérifiez les paramètres de fuseau horaire de la tâche (`--tz` par rapport au fuseau horaire de l’hôte).

    Déboguer :

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs : [Tâches Cron](/fr/automation/cron-jobs), [Automatisation](/fr/automation).

  </Accordion>

  <Accordion title="Cron s’est déclenché, mais rien n’a été envoyé au canal. Pourquoi ?">
    Vérifiez d’abord le mode de livraison :

    - `--no-deliver` / `delivery.mode: "none"` signifie qu’aucun envoi de repli par l’exécuteur n’est attendu.
    - Une cible d’annonce manquante ou invalide (`channel` / `to`) signifie que l’exécuteur a ignoré la livraison sortante.
    - Les échecs d’authentification du canal (`unauthorized`, `Forbidden`) signifient que l’exécuteur a essayé de livrer, mais que les identifiants l’ont bloqué.
    - Un résultat isolé silencieux (`NO_REPLY` / `no_reply` uniquement) est traité comme intentionnellement non livrable, donc l’exécuteur supprime aussi la livraison de repli mise en file d’attente.

    Pour les tâches cron isolées, l’agent peut toujours envoyer directement avec l’outil `message`
    lorsqu’une route de discussion est disponible. `--announce` contrôle uniquement le chemin de repli
    de l’exécuteur pour le texte final que l’agent n’a pas déjà envoyé.

    Déboguer :

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs : [Tâches Cron](/fr/automation/cron-jobs), [Tâches en arrière-plan](/fr/automation/tasks).

  </Accordion>

  <Accordion title="Pourquoi une exécution cron isolée a-t-elle changé de modèle ou réessayé une fois ?">
    Il s’agit généralement du chemin de changement de modèle en direct, et non d’une planification en double.

    Cron isolé peut conserver un transfert de modèle d’exécution et réessayer lorsque l’exécution
    active lève `LiveSessionModelSwitchError`. La nouvelle tentative conserve le fournisseur/modèle
    changé, et si le changement transportait un nouveau remplacement de profil d’authentification, cron
    le conserve aussi avant de réessayer.

    Règles de sélection associées :

    - Le remplacement de modèle du hook Gmail l’emporte d’abord lorsqu’il s’applique.
    - Puis le `model` par tâche.
    - Puis tout remplacement de modèle de session cron stocké.
    - Puis la sélection normale du modèle de l’agent/par défaut.

    La boucle de nouvelle tentative est bornée. Après la tentative initiale plus 2 nouvelles tentatives de changement,
    cron abandonne au lieu de boucler indéfiniment.

    Déboguer :

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs : [Tâches Cron](/fr/automation/cron-jobs), [CLI cron](/fr/cli/cron).

  </Accordion>

  <Accordion title="Comment installer des Skills sous Linux ?">
    Utilisez les commandes natives `openclaw skills` ou déposez les Skills dans votre espace de travail. L’interface utilisateur Skills macOS n’est pas disponible sous Linux.
    Parcourez les Skills sur [https://clawhub.ai](https://clawhub.ai).

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

    `openclaw skills install` natif écrit par défaut dans le répertoire `skills/`
    de l’espace de travail actif. Ajoutez `--global` pour installer dans le répertoire
    de Skills géré partagé pour tous les agents locaux. Installez la CLI `clawhub`
    séparée seulement si vous voulez publier ou synchroniser vos propres Skills. Utilisez
    `agents.defaults.skills` ou `agents.list[].skills` si vous voulez restreindre
    les agents qui peuvent voir les Skills partagés.

  </Accordion>

  <Accordion title="OpenClaw peut-il exécuter des tâches selon un planning ou en continu en arrière-plan ?">
    Oui. Utilisez le planificateur Gateway :

    - **Tâches Cron** pour les tâches planifiées ou récurrentes (persistent après les redémarrages).
    - **Heartbeat** pour les vérifications périodiques de la « session principale ».
    - **Tâches isolées** pour les agents autonomes qui publient des résumés ou livrent aux discussions.

    Docs : [Tâches Cron](/fr/automation/cron-jobs), [Automatisation](/fr/automation),
    [Heartbeat](/fr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Puis-je exécuter des Skills Apple réservés à macOS depuis Linux ?">
    Pas directement. Les Skills macOS sont contrôlés par `metadata.openclaw.os` plus les binaires requis, et les Skills n’apparaissent dans le prompt système que lorsqu’ils sont éligibles sur l’**hôte Gateway**. Sous Linux, les Skills réservés à `darwin` (comme `apple-notes`, `apple-reminders`, `things-mac`) ne se chargeront pas sauf si vous remplacez le contrôle d’éligibilité.

    Trois modèles sont pris en charge :

    **Option A - exécuter le Gateway sur un Mac (le plus simple).**
    Exécutez le Gateway là où les binaires macOS existent, puis connectez-vous depuis Linux en [mode distant](#gateway-ports-already-running-and-remote-mode) ou via Tailscale. Les Skills se chargent normalement car l’hôte Gateway est macOS.

    **Option B - utiliser un nœud macOS (sans SSH).**
    Exécutez le Gateway sous Linux, associez un nœud macOS (application de barre de menus), et définissez **Commandes d’exécution du nœud** sur « Toujours demander » ou « Toujours autoriser » sur le Mac. OpenClaw peut traiter les Skills réservés à macOS comme éligibles lorsque les binaires requis existent sur le nœud. L’agent exécute ces Skills via l’outil `nodes`. Si vous choisissez « Toujours demander », approuver « Toujours autoriser » dans le prompt ajoute cette commande à la liste d’autorisation.

    **Option C - mandater les binaires macOS via SSH (avancé).**
    Gardez le Gateway sous Linux, mais faites en sorte que les binaires CLI requis se résolvent vers des wrappers SSH qui s’exécutent sur un Mac. Remplacez ensuite le Skill pour autoriser Linux afin qu’il reste éligible.

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

    - **Skill / Plugin personnalisé :** idéal pour un accès API fiable (Notion/HeyGen ont tous deux des API).
    - **Automatisation du navigateur :** fonctionne sans code, mais est plus lente et plus fragile.

    Si vous voulez conserver le contexte par client (flux de travail d’agence), un modèle simple consiste à utiliser :

    - Une page Notion par client (contexte + préférences + travail actif).
    - Demandez à l’agent de récupérer cette page au début d’une session.

    Si vous voulez une intégration native, ouvrez une demande de fonctionnalité ou créez un Skill
    ciblant ces API.

    Installer des Skills :

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Les installations natives arrivent dans le répertoire `skills/` de l’espace de travail actif. Pour des Skills partagés entre tous les agents locaux, utilisez `openclaw skills install @owner/<skill-slug> --global` (ou placez-les manuellement dans `~/.openclaw/skills/<name>/SKILL.md`). Si seuls certains agents doivent voir une installation partagée, configurez `agents.defaults.skills` ou `agents.list[].skills`. Certains Skills attendent des binaires installés via Homebrew ; sous Linux, cela signifie Linuxbrew (voir l’entrée FAQ Homebrew Linux ci-dessus). Voir [Skills](/fr/tools/skills), [Configuration des Skills](/fr/tools/skills-config) et [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="Comment utiliser mon Chrome déjà connecté avec OpenClaw ?">
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

    Ce chemin peut utiliser le navigateur hôte local ou un nœud de navigateur connecté. Si le Gateway s’exécute ailleurs, exécutez soit un hôte de nœud sur la machine du navigateur, soit utilisez plutôt CDP distant.

    Limites actuelles de `existing-session` / `user` :

    - les actions sont pilotées par `ref`, et non par des sélecteurs CSS
    - les téléversements nécessitent `ref` / `inputRef` et ne prennent actuellement en charge qu’un fichier à la fois
    - `responsebody`, l’export PDF, l’interception de téléchargements et les actions par lot nécessitent encore un navigateur géré ou un profil CDP brut

  </Accordion>
</AccordionGroup>

## Sandboxing et mémoire

<AccordionGroup>
  <Accordion title="Existe-t-il une doc dédiée au sandboxing ?">
    Oui. Voir [Sandboxing](/fr/gateway/sandboxing). Pour la configuration propre à Docker (Gateway complet dans Docker ou images de sandbox), voir [Docker](/fr/install/docker).
  </Accordion>

  <Accordion title="Docker semble limité - comment activer toutes les fonctionnalités ?">
    L’image par défaut privilégie la sécurité et s’exécute en tant qu’utilisateur `node`, elle n’inclut donc pas
    les paquets système, Homebrew ni les navigateurs groupés. Pour une configuration plus complète :

    - Persistez `/home/node` avec `OPENCLAW_HOME_VOLUME` afin que les caches survivent.
    - Intégrez les dépendances système dans l’image avec `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Installez les navigateurs Playwright via la CLI groupée :
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Définissez `PLAYWRIGHT_BROWSERS_PATH` et assurez-vous que le chemin est persisté.

    Docs : [Docker](/fr/install/docker), [Navigateur](/fr/tools/browser).

  </Accordion>

  <Accordion title="Puis-je garder les messages directs personnels tout en rendant les groupes publics/sandboxés avec un seul agent ?">
    Oui - si votre trafic privé est constitué de **messages directs** et votre trafic public de **groupes**.

    Utilisez `agents.defaults.sandbox.mode: "non-main"` afin que les sessions de groupe/canal (clés non principales) s’exécutent dans le backend de sandbox configuré, tandis que la session principale de messages directs reste sur l’hôte. Docker est le backend par défaut si vous n’en choisissez pas. Ensuite, restreignez les outils disponibles dans les sessions sandboxées via `tools.sandbox.tools`.

    Guide de configuration + exemple de config : [Groupes : messages directs personnels + groupes publics](/fr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Référence de configuration clé : [Configuration du Gateway](/fr/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Comment lier un dossier hôte dans le sandbox ?">
    Définissez `agents.defaults.sandbox.docker.binds` sur `["host:path:mode"]` (par ex., `"/home/user/src:/src:ro"`). Les montages globaux et par agent sont fusionnés ; les montages par agent sont ignorés lorsque `scope: "shared"`. Utilisez `:ro` pour tout élément sensible et souvenez-vous que les montages contournent les parois du système de fichiers du sandbox.

    OpenClaw valide les sources de montage à la fois par rapport au chemin normalisé et au chemin canonique résolu via l’ancêtre existant le plus profond. Cela signifie que les échappements par parent symlink échouent toujours en fermeture, même lorsque le dernier segment du chemin n’existe pas encore, et que les vérifications de racine autorisée s’appliquent toujours après la résolution des symlinks.

    Voir [Sandboxing](/fr/gateway/sandboxing#custom-bind-mounts) et [Sandbox vs politique des outils vs privilèges élevés](/fr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) pour des exemples et des notes de sécurité.

  </Accordion>

  <Accordion title="Comment fonctionne la mémoire ?">
    La mémoire OpenClaw est simplement constituée de fichiers Markdown dans l’espace de travail de l’agent :

    - Notes quotidiennes dans `memory/YYYY-MM-DD.md`
    - Notes de long terme organisées dans `MEMORY.md` (sessions principales/privées uniquement)

    OpenClaw exécute aussi une **vidange mémoire silencieuse avant Compaction** pour rappeler au modèle
    d’écrire des notes durables avant la compaction automatique. Cela ne s’exécute que lorsque l’espace de travail
    est accessible en écriture (les sandbox en lecture seule l’ignorent). Voir [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="La mémoire continue d’oublier des éléments. Comment les rendre persistants ?">
    Demandez au bot d’**écrire le fait en mémoire**. Les notes à long terme vont dans `MEMORY.md`,
    le contexte à court terme va dans `memory/YYYY-MM-DD.md`.

    C’est encore un domaine que nous améliorons. Il est utile de rappeler au modèle de stocker les souvenirs ;
    il saura quoi faire. S’il continue d’oublier, vérifiez que le Gateway utilise le même
    espace de travail à chaque exécution.

    Docs : [Mémoire](/fr/concepts/memory), [Espace de travail de l’agent](/fr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La mémoire persiste-t-elle indéfiniment ? Quelles sont les limites ?">
    Les fichiers de mémoire résident sur le disque et persistent jusqu’à ce que vous les supprimiez. La limite est votre
    stockage, pas le modèle. Le **contexte de session** reste limité par la fenêtre
    de contexte du modèle ; les longues conversations peuvent donc être compactées ou tronquées. C’est pourquoi
    la recherche en mémoire existe : elle ne réinjecte dans le contexte que les parties pertinentes.

    Docs : [Mémoire](/fr/concepts/memory), [Contexte](/fr/concepts/context).

  </Accordion>

  <Accordion title="La recherche sémantique en mémoire nécessite-t-elle une clé API OpenAI ?">
    Seulement si vous utilisez les **embeddings OpenAI**. L’OAuth Codex couvre les discussions/complétions et
    ne donne **pas** accès aux embeddings ; ainsi, **se connecter avec Codex (OAuth ou la
    connexion CLI Codex)** n’aide pas pour la recherche sémantique en mémoire. Les embeddings OpenAI
    nécessitent toujours une vraie clé API (`OPENAI_API_KEY` ou `models.providers.openai.apiKey`).

    Si vous ne définissez pas explicitement de fournisseur, OpenClaw utilise les embeddings OpenAI. Les configurations
    héritées qui indiquent encore `memorySearch.provider = "auto"` se résolvent aussi vers OpenAI.
    Si aucune clé API OpenAI n’est disponible, la recherche sémantique en mémoire reste indisponible
    jusqu’à ce que vous configuriez une clé ou choisissiez explicitement un autre fournisseur.

    Si vous préférez rester en local, définissez `memorySearch.provider = "local"` (et éventuellement
    `memorySearch.fallback = "none"`). Si vous voulez des embeddings Gemini, définissez
    `memorySearch.provider = "gemini"` et fournissez `GEMINI_API_KEY` (ou
    `memorySearch.remote.apiKey`). Nous prenons en charge les modèles d’embedding **OpenAI, compatibles OpenAI, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra ou locaux** :
    consultez [Mémoire](/fr/concepts/memory) pour les détails de configuration.

  </Accordion>
</AccordionGroup>

## Où les éléments résident sur le disque

<AccordionGroup>
  <Accordion title="Toutes les données utilisées avec OpenClaw sont-elles enregistrées localement ?">
    Non : **l’état d’OpenClaw est local**, mais **les services externes voient toujours ce que vous leur envoyez**.

    - **Local par défaut :** les sessions, fichiers de mémoire, la configuration et l’espace de travail résident sur l’hôte du Gateway
      (`~/.openclaw` + votre répertoire d’espace de travail).
    - **Distant par nécessité :** les messages que vous envoyez aux fournisseurs de modèles (Anthropic/OpenAI/etc.) vont vers
      leurs API, et les plateformes de discussion (WhatsApp/Telegram/Slack/etc.) stockent les données de messages sur leurs
      serveurs.
    - **Vous contrôlez l’empreinte :** utiliser des modèles locaux garde les prompts sur votre machine, mais le trafic des canaux
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
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Charge utile de secrets facultative adossée à un fichier pour les fournisseurs SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Fichier de compatibilité hérité (entrées `api_key` statiques nettoyées) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | État des fournisseurs (par ex. `whatsapp/<accountId>/creds.json`)  |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | État par agent (agentDir + sessions)                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historique et état des conversations (par agent)                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Métadonnées de session (par agent)                                 |

    Chemin hérité à agent unique : `~/.openclaw/agent/*` (migré par `openclaw doctor`).

    Votre **espace de travail** (AGENTS.md, fichiers de mémoire, Skills, etc.) est séparé et configuré via `agents.defaults.workspace` (par défaut : `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Où AGENTS.md / SOUL.md / USER.md / MEMORY.md doivent-ils résider ?">
    Ces fichiers résident dans l’**espace de travail de l’agent**, pas dans `~/.openclaw`.

    - **Espace de travail (par agent)** : `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` facultatif.
      La racine en minuscules `memory.md` sert uniquement d’entrée de réparation héritée ; `openclaw doctor --fix`
      peut la fusionner dans `MEMORY.md` lorsque les deux fichiers existent.
    - **Répertoire d’état (`~/.openclaw`)** : configuration, état des canaux/fournisseurs, profils d’authentification, sessions, journaux,
      et Skills partagés (`~/.openclaw/skills`).

    L’espace de travail par défaut est `~/.openclaw/workspace`, configurable via :

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si le bot « oublie » après un redémarrage, confirmez que le Gateway utilise le même
    espace de travail à chaque lancement (et souvenez-vous : le mode distant utilise l’espace de travail de
    **l’hôte gateway**, pas celui de votre ordinateur portable local).

    Conseil : si vous voulez un comportement ou une préférence durable, demandez au bot de **l’écrire dans
    AGENTS.md ou MEMORY.md** plutôt que de vous appuyer sur l’historique de discussion.

    Voir [Espace de travail de l’agent](/fr/concepts/agent-workspace) et [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Puis-je agrandir SOUL.md ?">
    Oui. `SOUL.md` est l’un des fichiers d’amorçage de l’espace de travail injectés dans le
    contexte de l’agent. La limite d’injection par fichier par défaut est de `20000` caractères,
    et le budget total d’amorçage entre les fichiers est de `60000` caractères.

    Modifiez les valeurs par défaut partagées dans votre configuration OpenClaw :

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

    Ou remplacez-les pour un agent :

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    Utilisez `/context` pour vérifier les tailles brutes par rapport aux tailles injectées et savoir si une troncature a eu lieu.
    Gardez `SOUL.md` centré sur la voix, la posture et la personnalité ; mettez les règles de fonctionnement
    dans `AGENTS.md` et les faits durables en mémoire.

    Voir [Contexte](/fr/concepts/context) et [Configuration de l’agent](/fr/gateway/config-agents).

  </Accordion>

  <Accordion title="Stratégie de sauvegarde recommandée">
    Placez votre **espace de travail de l’agent** dans un dépôt git **privé** et sauvegardez-le dans un emplacement
    privé (par exemple GitHub privé). Cela capture les fichiers mémoire + AGENTS/SOUL/USER
    et vous permet de restaurer plus tard « l’esprit » de l’assistant.

    Ne commitez **rien** sous `~/.openclaw` (identifiants, sessions, jetons ou charges utiles de secrets chiffrés).
    Si vous avez besoin d’une restauration complète, sauvegardez séparément l’espace de travail et le répertoire d’état
    (voir la question sur la migration ci-dessus).

    Docs : [Espace de travail de l’agent](/fr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Comment désinstaller complètement OpenClaw ?">
    Consultez le guide dédié : [Désinstaller](/fr/install/uninstall).
  </Accordion>

  <Accordion title="Les agents peuvent-ils travailler en dehors de l’espace de travail ?">
    Oui. L’espace de travail est le **cwd par défaut** et l’ancre de mémoire, pas un bac à sable strict.
    Les chemins relatifs se résolvent dans l’espace de travail, mais les chemins absolus peuvent accéder à d’autres
    emplacements de l’hôte sauf si le sandboxing est activé. Si vous avez besoin d’isolation, utilisez
    [`agents.defaults.sandbox`](/fr/gateway/sandboxing) ou les paramètres de sandbox par agent. Si vous
    voulez qu’un dépôt soit le répertoire de travail par défaut, faites pointer le
    `workspace` de cet agent vers la racine du dépôt. Le dépôt OpenClaw n’est que le code source ; gardez
    l’espace de travail séparé sauf si vous voulez intentionnellement que l’agent travaille dedans.

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
    L’état de session appartient à **l’hôte gateway**. Si vous êtes en mode distant, le magasin de sessions qui vous concerne se trouve sur la machine distante, pas sur votre ordinateur portable local. Voir [Gestion des sessions](/fr/concepts/session).
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

  <Accordion title='J’ai défini gateway.bind: "lan" (ou "tailnet") et maintenant rien n’écoute / l’interface indique non autorisé'>
    Les liaisons hors loopback **nécessitent un chemin d’authentification gateway valide**. En pratique, cela signifie :

    - authentification par secret partagé : jeton ou mot de passe
    - `gateway.auth.mode: "trusted-proxy"` derrière un proxy inverse tenant compte de l’identité et correctement configuré

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

    - `gateway.remote.token` / `.password` n’activent **pas** l’authentification gateway locale à eux seuls.
    - Les chemins d’appel locaux peuvent utiliser `gateway.remote.*` comme solution de repli uniquement lorsque `gateway.auth.*` n’est pas défini.
    - Pour l’authentification par mot de passe, définissez plutôt `gateway.auth.mode: "password"` avec `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue de manière fermée (aucun repli distant ne masque l’échec).
    - Les configurations Control UI à secret partagé s’authentifient via `connect.params.auth.token` ou `connect.params.auth.password` (stocké dans les paramètres de l’application/de l’interface). Les modes porteurs d’identité comme Tailscale Serve ou `trusted-proxy` utilisent plutôt les en-têtes de requête. Évitez de placer des secrets partagés dans les URL.
    - Avec `gateway.auth.mode: "trusted-proxy"`, les proxys inverses loopback sur le même hôte nécessitent explicitement `gateway.auth.trustedProxy.allowLoopback = true` et une entrée loopback dans `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Pourquoi ai-je maintenant besoin d’un jeton sur localhost ?">
    OpenClaw applique l’authentification gateway par défaut, y compris sur loopback. Dans le chemin normal par défaut, cela signifie une authentification par jeton : si aucun chemin d’authentification explicite n’est configuré, le démarrage du gateway se résout en mode jeton et génère un jeton valable uniquement pour cette exécution, donc **les clients WS locaux doivent s’authentifier**. Configurez explicitement `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` ou `OPENCLAW_GATEWAY_PASSWORD` lorsque les clients ont besoin d’un secret stable entre les redémarrages. Cela empêche d’autres processus locaux d’appeler le Gateway.

    Si vous préférez un autre chemin d’authentification, vous pouvez choisir explicitement le mode mot de passe (ou, pour les proxys inverses sensibles à l’identité, `trusted-proxy`). Si vous voulez **vraiment** ouvrir le local loopback, définissez explicitement `gateway.auth.mode: "none"` dans votre configuration. Doctor peut générer un jeton pour vous à tout moment : `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Dois-je redémarrer après avoir modifié la configuration ?">
    Le Gateway surveille la configuration et prend en charge le rechargement à chaud :

    - `gateway.reload.mode: "hybrid"` (par défaut) : applique à chaud les modifications sûres, redémarre pour les modifications critiques
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
    `web_fetch` fonctionne sans clé API. `web_search` dépend du fournisseur sélectionné :

    - Les fournisseurs adossés à une API comme Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity et Tavily nécessitent leur configuration de clé API habituelle.
    - Grok peut réutiliser OAuth xAI depuis l’authentification du modèle, ou se rabattre sur `XAI_API_KEY` / la configuration web-search du plugin.
    - Ollama Web Search ne nécessite pas de clé, mais utilise votre hôte Ollama configuré et nécessite `ollama signin`.
    - DuckDuckGo ne nécessite pas de clé, mais c’est une intégration non officielle basée sur HTML.
    - SearXNG ne nécessite pas de clé/peut être auto-hébergé ; configurez `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recommandé :** exécutez `openclaw configure --section web` et choisissez un fournisseur.
    Alternatives par variables d’environnement :

    - Brave : `BRAVE_API_KEY`
    - Exa : `EXA_API_KEY`
    - Firecrawl : `FIRECRAWL_API_KEY`
    - Gemini : `GEMINI_API_KEY`
    - Grok : OAuth xAI, `XAI_API_KEY`
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

    La configuration web-search propre au fournisseur se trouve désormais sous `plugins.entries.<plugin>.config.webSearch.*`.
    Les anciens chemins de fournisseur `tools.web.search.*` se chargent encore temporairement pour compatibilité, mais ils ne doivent pas être utilisés pour les nouvelles configurations.
    La configuration de repli web-fetch Firecrawl se trouve sous `plugins.entries.firecrawl.config.webFetch.*`.

    Notes :

    - Si vous utilisez des listes d’autorisation, ajoutez `web_search`/`web_fetch`/`x_search` ou `group:web`.
    - `web_fetch` est activé par défaut (sauf désactivation explicite).
    - Si `tools.web.fetch.provider` est omis, OpenClaw détecte automatiquement le premier fournisseur de repli de récupération prêt à partir des identifiants disponibles. Le plugin Firecrawl officiel fournit ce repli.
    - Les démons lisent les variables d’environnement depuis `~/.openclaw/.env` (ou depuis l’environnement du service).

    Docs : [Outils web](/fr/tools/web).

  </Accordion>

  <Accordion title="config.apply a effacé ma configuration. Comment la récupérer et éviter cela ?">
    `config.apply` remplace la **configuration entière**. Si vous envoyez un objet partiel, tout le reste est supprimé.

    La version actuelle d’OpenClaw protège contre de nombreux écrasements accidentels :

    - Les écritures de configuration appartenant à OpenClaw valident toute la configuration après modification avant l’écriture.
    - Les écritures appartenant à OpenClaw invalides ou destructrices sont rejetées et enregistrées sous `openclaw.json.rejected.*`.
    - Si une modification directe casse le démarrage ou le rechargement à chaud, le Gateway échoue en mode fermé ou ignore le rechargement ; il ne réécrit pas `openclaw.json`.
    - `openclaw doctor --fix` prend en charge la réparation et peut restaurer la dernière bonne configuration connue tout en enregistrant le fichier rejeté sous `openclaw.json.clobbered.*`.

    Récupération :

    - Vérifiez `openclaw logs --follow` pour `Invalid config at`, `Config write rejected:` ou `config reload skipped (invalid config)`.
    - Inspectez le plus récent `openclaw.json.clobbered.*` ou `openclaw.json.rejected.*` à côté de la configuration active.
    - Exécutez `openclaw config validate` et `openclaw doctor --fix`.
    - Recopiez uniquement les clés souhaitées avec `openclaw config set` ou `config.patch`.
    - Si vous n’avez ni dernière bonne configuration connue ni charge utile rejetée, restaurez depuis une sauvegarde, ou relancez `openclaw doctor` et reconfigurez les canaux/modèles.
    - Si ce comportement était inattendu, signalez un bug et incluez votre dernière configuration connue ou toute sauvegarde.
    - Un agent de codage local peut souvent reconstruire une configuration fonctionnelle à partir des journaux ou de l’historique.

    Pour l’éviter :

    - Utilisez `openclaw config set` pour les petites modifications.
    - Utilisez `openclaw configure` pour les modifications interactives.
    - Utilisez d’abord `config.schema.lookup` lorsque vous n’êtes pas sûr du chemin exact ou de la forme du champ ; il renvoie un nœud de schéma superficiel ainsi que des résumés des enfants immédiats pour explorer.
    - Utilisez `config.patch` pour les modifications RPC partielles ; réservez `config.apply` au remplacement complet de la configuration.
    - Si vous utilisez l’outil `gateway` destiné aux agents depuis une exécution d’agent, il rejettera toujours les écritures vers `tools.exec.ask` / `tools.exec.security` (y compris les alias hérités `tools.bash.*` qui se normalisent vers les mêmes chemins d’exécution protégés).

    Docs : [Configuration](/fr/cli/config), [Configurer](/fr/cli/configure), [Dépannage du Gateway](/fr/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/fr/gateway/doctor).

  </Accordion>

  <Accordion title="Comment exécuter un Gateway central avec des workers spécialisés sur plusieurs appareils ?">
    Le schéma courant est **un Gateway** (par exemple Raspberry Pi) plus des **nœuds** et des **agents** :

    - **Gateway (central) :** possède les canaux (Signal/WhatsApp), le routage et les sessions.
    - **Nœuds (appareils) :** les Mac/iOS/Android se connectent comme périphériques et exposent des outils locaux (`system.run`, `canvas`, `camera`).
    - **Agents (workers) :** cerveaux/espaces de travail séparés pour des rôles spécialisés (par exemple « opérations Hetzner », « données personnelles »).
    - **Sous-agents :** lancent du travail en arrière-plan depuis un agent principal lorsque vous voulez du parallélisme.
    - **TUI :** se connecte au Gateway et permet de changer d’agent/session.

    Docs : [Nœuds](/fr/nodes), [Accès distant](/fr/gateway/remote), [Routage multi-agent](/fr/concepts/multi-agent), [Sous-agents](/fr/tools/subagents), [TUI](/fr/web/tui).

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

    La valeur par défaut est `false` (avec interface). Le mode headless est plus susceptible de déclencher les contrôles anti-bot sur certains sites. Voir [Navigateur](/fr/tools/browser).

    Le mode headless utilise le **même moteur Chromium** et fonctionne pour la plupart des automatisations (formulaires, clics, scraping, connexions). Les principales différences :

    - Aucune fenêtre de navigateur visible (utilisez des captures d’écran si vous avez besoin de visuels).
    - Certains sites sont plus stricts avec l’automatisation en mode headless (CAPTCHA, anti-bot).
      Par exemple, X/Twitter bloque souvent les sessions headless.

  </Accordion>

  <Accordion title="Comment utiliser Brave pour le contrôle du navigateur ?">
    Définissez `browser.executablePath` sur votre binaire Brave (ou tout navigateur basé sur Chromium) et redémarrez le Gateway.
    Consultez les exemples complets de configuration dans [Navigateur](/fr/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways distants et nœuds

<AccordionGroup>
  <Accordion title="Comment les commandes se propagent-elles entre Telegram, le Gateway et les nœuds ?">
    Les messages Telegram sont traités par le **Gateway**. Le Gateway exécute l’agent et
    appelle ensuite seulement les nœuds via le **Gateway WebSocket** lorsqu’un outil de nœud est nécessaire :

    Telegram → Gateway → Agent → `node.*` → Nœud → Gateway → Telegram

    Les nœuds ne voient pas le trafic fournisseur entrant ; ils reçoivent uniquement des appels RPC de nœud.

  </Accordion>

  <Accordion title="Comment mon agent peut-il accéder à mon ordinateur si le Gateway est hébergé à distance ?">
    Réponse courte : **associez votre ordinateur comme nœud**. Le Gateway s’exécute ailleurs, mais il peut
    appeler les outils `node.*` (écran, caméra, système) sur votre machine locale via le Gateway WebSocket.

    Configuration typique :

    1. Exécutez le Gateway sur l’hôte toujours actif (VPS/serveur domestique).
    2. Placez l’hôte du Gateway et votre ordinateur sur le même tailnet.
    3. Assurez-vous que le WS du Gateway est joignable (liaison tailnet ou tunnel SSH).
    4. Ouvrez l’application macOS localement et connectez-vous en mode **Distant via SSH** (ou tailnet direct)
       afin qu’elle puisse s’enregistrer comme nœud.
    5. Approuvez le nœud sur le Gateway :

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Aucun pont TCP séparé n’est requis ; les nœuds se connectent via le Gateway WebSocket.

    Rappel de sécurité : associer un nœud macOS autorise `system.run` sur cette machine. Associez uniquement
    des appareils auxquels vous faites confiance, et consultez [Sécurité](/fr/gateway/security).

    Docs : [Nœuds](/fr/nodes), [Protocole du Gateway](/fr/gateway/protocol), [Mode distant macOS](/fr/platforms/mac/remote), [Sécurité](/fr/gateway/security).

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
    Oui. Il n’existe pas de pont « bot-à-bot » intégré, mais vous pouvez le câbler de quelques
    manières fiables :

    **Le plus simple :** utilisez un canal de discussion normal auquel les deux bots peuvent accéder (Telegram/Slack/WhatsApp).
    Faites envoyer un message par le Bot A au Bot B, puis laissez le Bot B répondre comme d’habitude.

    **Pont CLI (générique) :** exécutez un script qui appelle l’autre Gateway avec
    `openclaw agent --message ... --deliver`, en ciblant une discussion où l’autre bot
    écoute. Si un bot se trouve sur un VPS distant, pointez votre CLI vers ce Gateway distant
    via SSH/Tailscale (voir [Accès distant](/fr/gateway/remote)).

    Exemple de schéma (à exécuter depuis une machine pouvant joindre le Gateway cible) :

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Astuce : ajoutez une garde pour éviter que les deux bots bouclent sans fin (mention uniquement, listes
    d’autorisation de canal, ou règle « ne pas répondre aux messages de bot »).

    Docs : [Accès distant](/fr/gateway/remote), [CLI d’agent](/fr/cli/agent), [Envoi par agent](/fr/tools/agent-send).

  </Accordion>

  <Accordion title="Ai-je besoin de VPS séparés pour plusieurs agents ?">
    Non. Un seul Gateway peut héberger plusieurs agents, chacun avec son propre espace de travail, ses modèles par défaut
    et son routage. C’est la configuration normale, et elle est beaucoup moins chère et plus simple que d’exécuter
    un VPS par agent.

    Utilisez des VPS séparés uniquement si vous avez besoin d’une isolation stricte (frontières de sécurité) ou de configurations très
    différentes que vous ne voulez pas partager. Sinon, gardez un seul Gateway et
    utilisez plusieurs agents ou sous-agents.

  </Accordion>

  <Accordion title="Y a-t-il un avantage à utiliser un nœud sur mon ordinateur portable personnel plutôt que SSH depuis un VPS ?">
    Oui - les nœuds sont la méthode de premier ordre pour accéder à votre ordinateur portable depuis un Gateway distant, et ils
    offrent plus qu’un accès shell. Le Gateway s’exécute sur macOS/Linux (Windows via WSL2) et est
    léger (un petit VPS ou une machine de classe Raspberry Pi convient ; 4 Go de RAM suffisent largement), donc une configuration courante
    consiste à utiliser un hôte toujours actif avec votre ordinateur portable comme nœud.

    - **Aucun SSH entrant requis.** Les nœuds se connectent sortants au WebSocket du Gateway et utilisent l’appairage d’appareils.
    - **Contrôles d’exécution plus sûrs.** `system.run` est contrôlé par les listes d’autorisation/approbations du nœud sur cet ordinateur portable.
    - **Plus d’outils d’appareil.** Les nœuds exposent `canvas`, `camera` et `screen` en plus de `system.run`.
    - **Automatisation de navigateur local.** Gardez le Gateway sur un VPS, mais exécutez Chrome localement via un hôte de nœud sur l’ordinateur portable, ou attachez-vous à Chrome local sur l’hôte via Chrome MCP.

    SSH convient pour un accès shell ponctuel, mais les nœuds sont plus simples pour les workflows d’agent continus et
    l’automatisation d’appareils.

    Docs : [Nœuds](/fr/nodes), [CLI des nœuds](/fr/cli/nodes), [Navigateur](/fr/tools/browser).

  </Accordion>

  <Accordion title="Les nœuds exécutent-ils un service gateway ?">
    Non. Un seul **gateway** doit s’exécuter par hôte, sauf si vous exécutez intentionnellement des profils isolés (voir [Gateways multiples](/fr/gateway/multiple-gateways)). Les nœuds sont des périphériques qui se connectent
    au gateway (nœuds iOS/Android, ou « mode nœud » macOS dans l’application de barre de menus). Pour les hôtes de nœuds
    sans interface graphique et le contrôle CLI, voir [CLI d’hôte Node](/fr/cli/node).

    Un redémarrage complet est requis pour les changements de `gateway`, `discovery` et de surface de Plugin hébergé.

  </Accordion>

  <Accordion title="Existe-t-il une méthode API / RPC pour appliquer la configuration ?">
    Oui.

    - `config.schema.lookup` : inspecter un sous-arbre de configuration avec son nœud de schéma superficiel, l’indication d’interface correspondante et les résumés des enfants immédiats avant écriture
    - `config.get` : récupérer l’instantané actuel + le hachage
    - `config.patch` : mise à jour partielle sûre (préférée pour la plupart des modifications RPC) ; recharge à chaud quand c’est possible et redémarre quand c’est requis
    - `config.apply` : valider + remplacer toute la configuration ; recharge à chaud quand c’est possible et redémarre quand c’est requis
    - L’outil d’exécution `gateway` destiné à l’agent refuse toujours de réécrire `tools.exec.ask` / `tools.exec.security` ; les alias hérités `tools.bash.*` se normalisent vers les mêmes chemins exec protégés

  </Accordion>

  <Accordion title="Configuration minimale raisonnable pour une première installation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Cela définit votre espace de travail et limite les personnes qui peuvent déclencher le bot.

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
       - Dans la console d’administration Tailscale, activez MagicDNS afin que le VPS ait un nom stable.
    4. **Utiliser le nom d’hôte du tailnet**
       - SSH : `ssh user@your-vps.tailnet-xxxx.ts.net`
       - WS du Gateway : `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Si vous voulez l’interface de contrôle sans SSH, utilisez Tailscale Serve sur le VPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Cela garde le gateway lié au loopback et expose HTTPS via Tailscale. Voir [Tailscale](/fr/gateway/tailscale).

  </Accordion>

  <Accordion title="Comment connecter un nœud Mac à un Gateway distant (Tailscale Serve) ?">
    Serve expose l’**interface de contrôle du Gateway + WS**. Les nœuds se connectent via le même point de terminaison WS du Gateway.

    Configuration recommandée :

    1. **Assurez-vous que le VPS + le Mac sont sur le même tailnet**.
    2. **Utilisez l’application macOS en mode distant** (la cible SSH peut être le nom d’hôte du tailnet).
       L’application établira un tunnel vers le port du Gateway et se connectera comme nœud.
    3. **Approuvez le nœud** sur le gateway :

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Docs : [Protocole du Gateway](/fr/gateway/protocol), [Discovery](/fr/gateway/discovery), [Mode distant macOS](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Dois-je installer sur un deuxième ordinateur portable ou simplement ajouter un nœud ?">
    Si vous avez seulement besoin d’**outils locaux** (screen/camera/exec) sur le deuxième ordinateur portable, ajoutez-le comme
    **nœud**. Cela conserve un seul Gateway et évite de dupliquer la configuration. Les outils de nœud local sont
    actuellement uniquement disponibles sur macOS, mais nous prévoyons de les étendre à d’autres systèmes d’exploitation.

    Installez un deuxième Gateway uniquement si vous avez besoin d’une **isolation forte** ou de deux bots entièrement séparés.

    Docs : [Nœuds](/fr/nodes), [CLI des nœuds](/fr/cli/nodes), [Gateways multiples](/fr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables d’environnement et chargement de .env

<AccordionGroup>
  <Accordion title="Comment OpenClaw charge-t-il les variables d’environnement ?">
    OpenClaw lit les variables d’environnement depuis le processus parent (shell, launchd/systemd, CI, etc.) et charge en plus :

    - `.env` depuis le répertoire de travail actuel
    - un `.env` de repli global depuis `~/.openclaw/.env` (c.-à-d. `$OPENCLAW_STATE_DIR/.env`)

    Aucun des fichiers `.env` ne remplace les variables d’environnement existantes.
    Les variables d’identifiants de fournisseur sont une exception pour le `.env` de l’espace de travail : les clés comme
    `GEMINI_API_KEY`, `XAI_API_KEY` ou `MISTRAL_API_KEY` sont ignorées depuis le `.env`
    de l’espace de travail et doivent résider dans l’environnement du processus, `~/.openclaw/.env` ou la configuration `env`.

    Vous pouvez aussi définir des variables d’environnement inline dans la configuration (appliquées seulement si elles manquent dans l’environnement du processus) :

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

  <Accordion title="J’ai lancé le Gateway via le service et mes variables d’environnement ont disparu. Que faire ?">
    Deux corrections courantes :

    1. Placez les clés manquantes dans `~/.openclaw/.env` afin qu’elles soient récupérées même quand le service n’hérite pas de l’environnement de votre shell.
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

    Cela exécute votre shell de connexion et importe seulement les clés attendues manquantes (sans jamais remplacer). Équivalents en variables d’environnement :
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='J’ai défini COPILOT_GITHUB_TOKEN, mais l’état des modèles affiche "Shell env: off." Pourquoi ?'>
    `openclaw models status` indique si l’**import de l’environnement shell** est activé. "Shell env: off"
    ne signifie **pas** que vos variables d’environnement sont manquantes - cela signifie seulement qu’OpenClaw ne chargera pas
    automatiquement votre shell de connexion.

    Si le Gateway s’exécute comme service (launchd/systemd), il n’héritera pas de votre environnement
    shell. Corrigez cela de l’une de ces façons :

    1. Placez le jeton dans `~/.openclaw/.env` :

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Ou activez l’import du shell (`env.shellEnv.enabled: true`).
    3. Ou ajoutez-le au bloc `env` de votre configuration (s’applique seulement s’il manque).

    Ensuite, redémarrez le gateway et vérifiez à nouveau :

    ```bash
    openclaw models status
    ```

    Les jetons Copilot sont lus depuis `COPILOT_GITHUB_TOKEN` (ainsi que `GH_TOKEN` / `GITHUB_TOKEN`).
    Voir [/concepts/model-providers](/fr/concepts/model-providers) et [/environment](/fr/help/environment).

  </Accordion>
</AccordionGroup>

## Sessions et conversations multiples

<AccordionGroup>
  <Accordion title="Comment démarrer une nouvelle conversation ?">
    Envoyez `/new` ou `/reset` comme message autonome. Voir [Gestion des sessions](/fr/concepts/session).
  </Accordion>

  <Accordion title="Les sessions se réinitialisent-elles automatiquement si je n’envoie jamais /new ?">
    Les sessions peuvent expirer après `session.idleMinutes`, mais c’est **désactivé par défaut** (valeur par défaut **0**).
    Définissez une valeur positive pour activer l’expiration après inactivité. Quand elle est activée, le **prochain**
    message après la période d’inactivité démarre un nouvel identifiant de session pour cette clé de chat.
    Cela ne supprime pas les transcriptions - cela démarre simplement une nouvelle session.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Existe-t-il un moyen de créer une équipe d’instances OpenClaw (un CEO et de nombreux agents) ?">
    Oui, via le **routage multi-agent** et les **sous-agents**. Vous pouvez créer un agent coordinateur
    et plusieurs agents travailleurs avec leurs propres espaces de travail et modèles.

    Cela dit, il vaut mieux voir cela comme une **expérience amusante**. C’est gourmand en jetons et souvent
    moins efficace que d’utiliser un seul bot avec des sessions séparées. Le modèle typique que nous
    envisageons est un bot auquel vous parlez, avec différentes sessions pour le travail en parallèle. Ce
    bot peut aussi lancer des sous-agents quand c’est nécessaire.

    Docs : [Routage multi-agent](/fr/concepts/multi-agent), [Sous-agents](/fr/tools/subagents), [CLI des agents](/fr/cli/agents).

  </Accordion>

  <Accordion title="Pourquoi le contexte a-t-il été tronqué au milieu d’une tâche ? Comment l’éviter ?">
    Le contexte de session est limité par la fenêtre du modèle. Les longues conversations, les sorties d’outils volumineuses ou de nombreux
    fichiers peuvent déclencher une Compaction ou une troncature.

    Ce qui aide :

    - Demandez au bot de résumer l’état actuel et de l’écrire dans un fichier.
    - Utilisez `/compact` avant les longues tâches, et `/new` quand vous changez de sujet.
    - Gardez le contexte important dans l’espace de travail et demandez au bot de le relire.
    - Utilisez des sous-agents pour les travaux longs ou parallèles afin que la conversation principale reste plus petite.
    - Choisissez un modèle avec une fenêtre de contexte plus grande si cela se produit souvent.

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

    - L’onboarding propose aussi **Réinitialiser** s’il détecte une configuration existante. Voir [Onboarding (CLI)](/fr/start/wizard).
    - Si vous avez utilisé des profils (`--profile` / `OPENCLAW_PROFILE`), réinitialisez chaque répertoire d’état (par défaut `~/.openclaw-<profile>`).
    - Réinitialisation dev : `openclaw gateway --dev --reset` (dev uniquement ; efface la configuration dev + les identifiants + les sessions + l’espace de travail).

  </Accordion>

  <Accordion title='J’obtiens des erreurs "context too large" - comment réinitialiser ou compacter ?'>
    Utilisez l’une de ces options :

    - **Compacter** (conserve la conversation mais résume les tours plus anciens) :

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

    - Activez ou ajustez le **pruning de session** (`agents.defaults.contextPruning`) pour réduire les anciennes sorties d’outils.
    - Utilisez un modèle avec une fenêtre de contexte plus grande.

    Docs : [Compaction](/fr/concepts/compaction), [Pruning de session](/fr/concepts/session-pruning), [Gestion des sessions](/fr/concepts/session).

  </Accordion>

  <Accordion title='Pourquoi vois-je "LLM request rejected: messages.content.tool_use.input field required" ?'>
    Il s’agit d’une erreur de validation du fournisseur : le modèle a émis un bloc `tool_use` sans le champ
    `input` requis. Cela signifie généralement que l’historique de session est obsolète ou corrompu (souvent après de longs fils
    ou un changement d’outil/schéma).

    Correction : démarrez une nouvelle session avec `/new` (message autonome).

  </Accordion>

  <Accordion title="Pourquoi reçois-je des messages Heartbeat toutes les 30 minutes ?">
    Les Heartbeats s’exécutent toutes les **30m** par défaut (**1h** avec l’authentification OAuth). Ajustez-les ou désactivez-les :

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

    Si `HEARTBEAT.md` existe mais est effectivement vide (uniquement des lignes vides,
    des commentaires Markdown/HTML, des titres Markdown comme `# Heading`, des marqueurs de clôture,
    ou des ébauches de listes de contrôle vides), OpenClaw ignore l’exécution du heartbeat pour économiser des appels API.
    Si le fichier est absent, le heartbeat s’exécute quand même et le modèle décide quoi faire.

    Les remplacements par agent utilisent `agents.list[].heartbeat`. Docs : [Heartbeat](/fr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Dois-je ajouter un « compte bot » à un groupe WhatsApp ?'>
    Non. OpenClaw fonctionne sur **votre propre compte**, donc si vous êtes dans le groupe, OpenClaw peut le voir.
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

    Cherchez `chatId` (ou `from`) se terminant par `@g.us`, comme :
    `1234567890-1234567890@g.us`.

    Option 2 (si déjà configuré/autorisé) : listez les groupes depuis la configuration :

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Docs : [WhatsApp](/fr/channels/whatsapp), [Annuaire](/fr/cli/directory), [Journaux](/fr/cli/logs).

  </Accordion>

  <Accordion title="Pourquoi OpenClaw ne répond-il pas dans un groupe ?">
    Deux causes courantes :

    - Le filtrage par mention est activé (par défaut). Vous devez @mentionner le bot (ou correspondre à `mentionPatterns`).
    - Vous avez configuré `channels.whatsapp.groups` sans `"*"` et le groupe n’est pas dans la liste d’autorisation.

    Voir [Groupes](/fr/channels/groups) et [Messages de groupe](/fr/channels/group-messages).

  </Accordion>

  <Accordion title="Les groupes/fils partagent-ils le contexte avec les MP ?">
    Les discussions directes se replient par défaut sur la session principale. Les groupes/canaux ont leurs propres clés de session, et les sujets Telegram / fils Discord sont des sessions séparées. Voir [Groupes](/fr/channels/groups) et [Messages de groupe](/fr/channels/group-messages).
  </Accordion>

  <Accordion title="Combien d’espaces de travail et d’agents puis-je créer ?">
    Aucune limite stricte. Des dizaines (même des centaines) conviennent, mais surveillez :

    - **Croissance du disque :** les sessions + transcriptions résident sous `~/.openclaw/agents/<agentId>/sessions/`.
    - **Coût en tokens :** plus d’agents signifie plus d’utilisation simultanée du modèle.
    - **Surcharge opérationnelle :** profils d’authentification, espaces de travail et routage des canaux par agent.

    Conseils :

    - Gardez un espace de travail **actif** par agent (`agents.defaults.workspace`).
    - Purgez les anciennes sessions (supprimez les JSONL ou les entrées de stockage) si le disque grossit.
    - Utilisez `openclaw doctor` pour repérer les espaces de travail orphelins et les incohérences de profil.

  </Accordion>

  <Accordion title="Puis-je exécuter plusieurs bots ou discussions en même temps (Slack), et comment dois-je configurer cela ?">
    Oui. Utilisez le **routage multi-agent** pour exécuter plusieurs agents isolés et router les messages entrants par
    canal/compte/interlocuteur. Slack est pris en charge comme canal et peut être associé à des agents spécifiques.

    L’accès au navigateur est puissant, mais ne permet pas de « faire tout ce qu’un humain peut faire » : les systèmes anti-bot, CAPTCHA et MFA peuvent
    toujours bloquer l’automatisation. Pour le contrôle de navigateur le plus fiable, utilisez Chrome MCP local sur l’hôte,
    ou utilisez CDP sur la machine qui exécute réellement le navigateur.

    Configuration recommandée :

    - Hôte Gateway toujours actif (VPS/Mac mini).
    - Un agent par rôle (associations).
    - Canal(aux) Slack associé(s) à ces agents.
    - Navigateur local via Chrome MCP ou un nœud si nécessaire.

    Docs : [Routage multi-agent](/fr/concepts/multi-agent), [Slack](/fr/channels/slack),
    [Navigateur](/fr/tools/browser), [Nœuds](/fr/nodes).

  </Accordion>
</AccordionGroup>

## Modèles, basculement et profils d’authentification

La FAQ des modèles — valeurs par défaut, sélection, alias, changement, basculement, profils d’authentification —
se trouve dans la [FAQ des modèles](/fr/help/faq-models).

## Gateway : ports, « déjà en cours d’exécution » et mode distant

<AccordionGroup>
  <Accordion title="Quel port le Gateway utilise-t-il ?">
    `gateway.port` contrôle le port multiplexé unique pour WebSocket + HTTP (UI de contrôle, hooks, etc.).

    Priorité :

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Pourquoi openclaw gateway status indique-t-il « Runtime: running » mais « Connectivity probe: failed » ?'>
    Parce que « running » est la vue du **superviseur** (launchd/systemd/schtasks). La sonde de connectivité est la CLI qui se connecte réellement au WebSocket du Gateway.

    Utilisez `openclaw gateway status` et fiez-vous à ces lignes :

    - `Probe target:` (l’URL réellement utilisée par la sonde)
    - `Listening:` (ce qui est réellement lié au port)
    - `Last gateway error:` (cause racine courante lorsque le processus est vivant mais que le port n’écoute pas)

  </Accordion>

  <Accordion title='Pourquoi openclaw gateway status affiche-t-il des valeurs différentes pour « Config (cli) » et « Config (service) » ?'>
    Vous modifiez un fichier de configuration tandis que le service en utilise un autre (souvent une incohérence `--profile` / `OPENCLAW_STATE_DIR`).

    Correctif :

    ```bash
    openclaw gateway install --force
    ```

    Exécutez cela depuis le même `--profile` / environnement que vous voulez que le service utilise.

  </Accordion>

  <Accordion title='Que signifie « another gateway instance is already listening » ?'>
    OpenClaw impose un verrou d’exécution en liant immédiatement l’écouteur WebSocket au démarrage (`ws://127.0.0.1:18789` par défaut). Si la liaison échoue avec `EADDRINUSE`, il lance `GatewayLockError` indiquant qu’une autre instance écoute déjà.

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

    Notes :

    - `openclaw gateway` ne démarre que lorsque `gateway.mode` vaut `local` (ou si vous passez le drapeau de remplacement).
    - L’application macOS surveille le fichier de configuration et change de mode à chaud lorsque ces valeurs changent.
    - `gateway.remote.token` / `.password` sont uniquement des identifiants distants côté client ; ils n’activent pas à eux seuls l’authentification du Gateway local.

  </Accordion>

  <Accordion title='L’UI de contrôle indique « unauthorized » (ou continue de se reconnecter). Que faire ?'>
    Votre chemin d’authentification Gateway et la méthode d’authentification de l’UI ne correspondent pas.

    Faits (issus du code) :

    - L’UI de contrôle conserve le token dans `sessionStorage` pour la session d’onglet de navigateur courante et l’URL Gateway sélectionnée, donc les actualisations dans le même onglet continuent de fonctionner sans restaurer une persistance de token long terme dans localStorage.
    - Sur `AUTH_TOKEN_MISMATCH`, les clients de confiance peuvent tenter une nouvelle tentative bornée avec un token d’appareil en cache lorsque le Gateway renvoie des indications de nouvelle tentative (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Cette nouvelle tentative avec token en cache réutilise maintenant les portées approuvées en cache stockées avec le token d’appareil. Les appelants avec `deviceToken` explicite / `scopes` explicites conservent toujours l’ensemble de portées demandé au lieu d’hériter des portées en cache.
    - En dehors de ce chemin de nouvelle tentative, la priorité de l’authentification de connexion est d’abord token/mot de passe partagé explicite, puis `deviceToken` explicite, puis token d’appareil stocké, puis token d’amorçage.
    - L’amorçage par code de configuration intégré renvoie un token d’appareil de nœud avec `scopes: []` plus un token de transfert opérateur borné pour l’onboarding mobile de confiance. Le transfert opérateur peut lire la configuration native au moment de la configuration, mais n’accorde pas les portées de mutation d’appairage ni `operator.admin`.

    Correctif :

    - Le plus rapide : `openclaw dashboard` (affiche + copie l’URL du tableau de bord, tente de l’ouvrir ; affiche une indication SSH si sans interface graphique).
    - Si vous n’avez pas encore de token : `openclaw doctor --generate-gateway-token`.
    - Si distant, créez d’abord un tunnel : `ssh -N -L 18789:127.0.0.1:18789 user@host` puis ouvrez `http://127.0.0.1:18789/`.
    - Mode secret partagé : définissez `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, puis collez le secret correspondant dans les paramètres de l’UI de contrôle.
    - Mode Tailscale Serve : assurez-vous que `gateway.auth.allowTailscale` est activé et que vous ouvrez l’URL Serve, pas une URL brute de boucle locale/tailnet qui contourne les en-têtes d’identité Tailscale.
    - Mode proxy de confiance : assurez-vous de passer par le proxy configuré et conscient de l’identité, pas par une URL Gateway brute. Les proxys en boucle locale sur le même hôte nécessitent aussi `gateway.auth.trustedProxy.allowLoopback = true`.
    - Si l’incohérence persiste après l’unique nouvelle tentative, faites tourner/réapprouver le token d’appareil appairé :
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Si cet appel de rotation indique qu’il a été refusé, vérifiez deux choses :
      - les sessions d’appareil appairé ne peuvent faire tourner que leur **propre** appareil, sauf si elles ont aussi `operator.admin`
      - les valeurs `--scope` explicites ne peuvent pas dépasser les portées opérateur courantes de l’appelant
    - Toujours bloqué ? Exécutez `openclaw status --all` et suivez [Dépannage](/fr/gateway/troubleshooting). Voir [Tableau de bord](/fr/web/dashboard) pour les détails d’authentification.

  </Accordion>

  <Accordion title="J’ai défini gateway.bind sur tailnet, mais il ne peut pas se lier et rien n’écoute">
    La liaison `tailnet` choisit une IP Tailscale depuis vos interfaces réseau (100.64.0.0/10). Si la machine n’est pas sur Tailscale (ou si l’interface est désactivée), il n’y a rien à quoi se lier.

    Correctif :

    - Démarrez Tailscale sur cet hôte (pour qu’il ait une adresse 100.x), ou
    - Passez à `gateway.bind: "loopback"` / `"lan"`.

    Note : `tailnet` est explicite. `auto` préfère la boucle locale ; utilisez `gateway.bind: "tailnet"` lorsque vous voulez une liaison uniquement tailnet.

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

    Les profils suffixent aussi les noms de service (`ai.openclaw.<profile>` ; anciens `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guide complet : [Plusieurs gateways](/fr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Que signifie « invalid handshake » / code 1008 ?'>
    Le Gateway est un **serveur WebSocket**, et il s’attend à ce que le tout premier message
    soit une trame `connect`. S’il reçoit autre chose, il ferme la connexion
    avec le **code 1008** (violation de politique).

    Causes courantes :

    - Vous avez ouvert l’URL **HTTP** dans un navigateur (`http://...`) au lieu d’un client WS.
    - Vous avez utilisé le mauvais port ou chemin.
    - Un proxy ou tunnel a supprimé les en-têtes d’authentification ou envoyé une requête non-Gateway.

    Correctifs rapides :

    1. Utilisez l’URL WS : `ws://<host>:18789` (ou `wss://...` si HTTPS).
    2. N’ouvrez pas le port WS dans un onglet de navigateur normal.
    3. Si l’authentification est activée, incluez le token/mot de passe dans la trame `connect`.

    Si vous utilisez la CLI ou le TUI, l’URL doit ressembler à :

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Détails du protocole : [Protocole Gateway](/fr/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Journalisation et débogage

<AccordionGroup>
  <Accordion title="Où sont les journaux ?">
    Journaux de fichiers (structurés) :

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Vous pouvez définir un chemin stable via `logging.file`. Le niveau des journaux fichier est contrôlé par `logging.level`. La verbosité de la console est contrôlée par `--verbose` et `logging.consoleLevel`.

    Suivi des journaux le plus rapide :

    ```bash
    openclaw logs --follow
    ```

    Journaux du service/superviseur (quand le Gateway s’exécute via launchd/systemd) :

    - stdout launchd macOS : `~/Library/Logs/openclaw/gateway.log` (les profils utilisent `gateway-<profile>.log` ; stderr est supprimé)
    - Linux : `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows : `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Consultez [Dépannage](/fr/gateway/troubleshooting) pour en savoir plus.

  </Accordion>

  <Accordion title="Comment démarrer/arrêter/redémarrer le service Gateway ?">
    Utilisez les assistants du Gateway :

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Si vous exécutez le Gateway manuellement, `openclaw gateway --force` peut récupérer le port. Consultez [Gateway](/fr/gateway).

  </Accordion>

  <Accordion title="J’ai fermé mon terminal sous Windows : comment redémarrer OpenClaw ?">
    Il existe **trois modes d’installation Windows** :

    **1) Configuration locale Windows Hub :** l’application native gère un Gateway WSL local appartenant à l’application.

    Ouvrez **OpenClaw Companion** depuis le menu Démarrer ou la zone de notification, puis utilisez
    **Configuration du Gateway** ou l’onglet Connexions.

    **2) Gateway WSL2 manuel :** le Gateway s’exécute dans Linux.

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

    **3) CLI/Gateway Windows natif :** le Gateway s’exécute directement dans Windows.

    Ouvrez PowerShell et exécutez :

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Si vous l’exécutez manuellement (sans service), utilisez :

    ```powershell
    openclaw gateway run
    ```

    Documentation : [Windows](/fr/platforms/windows), [Guide d’exploitation du service Gateway](/fr/gateway).

  </Accordion>

  <Accordion title="Le Gateway est actif, mais les réponses n’arrivent jamais. Que dois-je vérifier ?">
    Commencez par un contrôle rapide de l’état :

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causes courantes :

    - Authentification du modèle non chargée sur l’**hôte du Gateway** (vérifiez `models status`).
    - Appairage/liste d’autorisation du canal bloquant les réponses (vérifiez la configuration du canal et les journaux).
    - WebChat/Dashboard est ouvert sans le bon jeton.

    Si vous êtes à distance, vérifiez que la connexion par tunnel/Tailscale est active et que le
    WebSocket du Gateway est accessible.

    Documentation : [Canaux](/fr/channels), [Dépannage](/fr/gateway/troubleshooting), [Accès distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title='"Déconnecté du Gateway : aucune raison" : que faire ?'>
    Cela signifie généralement que l’interface utilisateur a perdu la connexion WebSocket. Vérifiez :

    1. Le Gateway est-il en cours d’exécution ? `openclaw gateway status`
    2. Le Gateway est-il sain ? `openclaw status`
    3. L’interface utilisateur dispose-t-elle du bon jeton ? `openclaw dashboard`
    4. Si vous êtes à distance, le lien tunnel/Tailscale est-il actif ?

    Puis suivez les journaux :

    ```bash
    openclaw logs --follow
    ```

    Documentation : [Dashboard](/fr/web/dashboard), [Accès distant](/fr/gateway/remote), [Dépannage](/fr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands échoue. Que dois-je vérifier ?">
    Commencez par les journaux et l’état du canal :

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Puis faites correspondre l’erreur :

    - `BOT_COMMANDS_TOO_MUCH` : le menu Telegram contient trop d’entrées. OpenClaw limite déjà le menu à la limite Telegram et réessaie avec moins de commandes, mais certaines entrées de menu doivent encore être supprimées. Réduisez les commandes de plugins/Skills/personnalisées, ou désactivez `channels.telegram.commands.native` si vous n’avez pas besoin du menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, ou erreurs réseau similaires : si vous êtes sur un VPS ou derrière un proxy, vérifiez que le HTTPS sortant est autorisé et que le DNS fonctionne pour `api.telegram.org`.

    Si le Gateway est distant, assurez-vous de consulter les journaux sur l’hôte du Gateway.

    Documentation : [Telegram](/fr/channels/telegram), [Dépannage des canaux](/fr/channels/troubleshooting).

  </Accordion>

  <Accordion title="Le TUI n’affiche aucune sortie. Que dois-je vérifier ?">
    Vérifiez d’abord que le Gateway est accessible et que l’agent peut s’exécuter :

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Dans le TUI, utilisez `/status` pour voir l’état actuel. Si vous attendez des réponses dans un
    canal de discussion, assurez-vous que la livraison est activée (`/deliver on`).

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

  <Accordion title="Explication simple : openclaw gateway restart ou openclaw gateway">
    - `openclaw gateway restart` : redémarre le **service en arrière-plan** (launchd/systemd).
    - `openclaw gateway` : exécute le Gateway **au premier plan** pour cette session de terminal.

    Si vous avez installé le service, utilisez les commandes Gateway. Utilisez `openclaw gateway` lorsque
    vous voulez une exécution ponctuelle au premier plan.

  </Accordion>

  <Accordion title="Le moyen le plus rapide d’obtenir plus de détails en cas d’échec">
    Démarrez le Gateway avec `--verbose` pour obtenir plus de détails dans la console. Inspectez ensuite le fichier journal pour les erreurs d’authentification des canaux, de routage des modèles et de RPC.
  </Accordion>
</AccordionGroup>

## Médias et pièces jointes

<AccordionGroup>
  <Accordion title="Mon Skill a généré une image/un PDF, mais rien n’a été envoyé">
    Les pièces jointes sortantes de l’agent doivent utiliser des champs média structurés tels que `media`, `mediaUrl`, `path` ou `filePath`. Consultez [Configuration de l’assistant OpenClaw](/fr/start/openclaw) et [Envoi par l’agent](/fr/tools/agent-send).

    Envoi via la CLI :

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Vérifiez aussi :

    - Le canal cible prend en charge les médias sortants et n’est pas bloqué par des listes d’autorisation.
    - Le fichier respecte les limites de taille du fournisseur (les images sont redimensionnées à 2048 px maximum).
    - `tools.fs.workspaceOnly=true` limite les envois par chemin local à l’espace de travail, au stockage temporaire/média et aux fichiers validés par le bac à sable.
    - `tools.fs.workspaceOnly=false` permet aux envois de médias locaux structurés d’utiliser les fichiers locaux de l’hôte que l’agent peut déjà lire, mais uniquement pour les médias et les types de documents sûrs (images, audio, vidéo, PDF, documents Office et documents texte validés tels que Markdown/MD, TXT, JSON, YAML et YML). Ce n’est pas un scanner de secrets : un fichier `secret.txt` ou `config.json` lisible par l’agent peut être joint lorsque l’extension et la validation du contenu correspondent. Gardez les fichiers sensibles hors des chemins lisibles par l’agent, ou conservez `tools.fs.workspaceOnly=true` pour des envois par chemin local plus stricts.

    Consultez [Images](/fr/nodes/images).

  </Accordion>
</AccordionGroup>

## Sécurité et contrôle d’accès

<AccordionGroup>
  <Accordion title="Est-il sûr d’exposer OpenClaw aux DM entrants ?">
    Traitez les DM entrants comme des entrées non fiables. Les valeurs par défaut sont conçues pour réduire le risque :

    - Le comportement par défaut sur les canaux compatibles DM est **l’appairage** :
      - Les expéditeurs inconnus reçoivent un code d’appairage ; le bot ne traite pas leur message.
      - Approuvez avec : `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Les demandes en attente sont limitées à **3 par canal** ; vérifiez `openclaw pairing list --channel <channel> [--account <id>]` si un code n’est pas arrivé.
    - L’ouverture publique des DM nécessite une adhésion explicite (`dmPolicy: "open"` et liste d’autorisation `"*"`).

    Exécutez `openclaw doctor` pour détecter les politiques de DM risquées.

  </Accordion>

  <Accordion title="L’injection de prompt concerne-t-elle uniquement les bots publics ?">
    Non. L’injection de prompt concerne le **contenu non fiable**, pas seulement les personnes qui peuvent envoyer un DM au bot.
    Si votre assistant lit du contenu externe (recherche/récupération web, pages de navigateur, e-mails,
    documentation, pièces jointes, journaux collés), ce contenu peut inclure des instructions qui tentent
    de détourner le modèle. Cela peut se produire même si **vous êtes le seul expéditeur**.

    Le plus grand risque survient lorsque les outils sont activés : le modèle peut être piégé pour
    exfiltrer le contexte ou appeler des outils en votre nom. Réduisez le périmètre d’impact en :

    - utilisant un agent « lecteur » en lecture seule ou sans outils pour résumer le contenu non fiable
    - gardant `web_search` / `web_fetch` / `browser` désactivés pour les agents avec outils activés
    - traitant aussi le texte décodé des fichiers/documents comme non fiable : OpenResponses
      `input_file` et l’extraction des pièces jointes média encadrent tous deux le texte extrait avec
      des marqueurs explicites de limite de contenu externe au lieu de transmettre le texte brut du fichier
    - utilisant le bac à sable et des listes d’autorisation d’outils strictes

    Détails : [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="OpenClaw est-il moins sûr parce qu’il utilise TypeScript/Node au lieu de Rust/WASM ?">
    Le langage et le runtime comptent, mais ils ne constituent pas le risque principal pour un agent
    personnel. Les risques pratiques d’OpenClaw sont l’exposition du Gateway, les personnes qui peuvent envoyer des messages au
    bot, l’injection de prompt, le périmètre des outils, la gestion des identifiants, l’accès au navigateur, l’accès exec
    et la confiance accordée aux Skills ou plugins tiers.

    Rust et WASM peuvent fournir une isolation plus forte pour certaines classes de code, mais
    ils ne résolvent pas l’injection de prompt, les mauvaises listes d’autorisation, l’exposition publique du Gateway,
    les outils trop larges ou un profil de navigateur déjà connecté à des
    comptes sensibles. Traitez ces éléments comme les contrôles principaux :

    - gardez le Gateway privé ou authentifié
    - utilisez l’appairage et les listes d’autorisation pour les DM et les groupes
    - refusez ou isolez dans un bac à sable les outils risqués pour les entrées non fiables
    - installez uniquement des plugins et Skills de confiance
    - exécutez `openclaw security audit --deep` après les changements de configuration

    Détails : [Sécurité](/fr/gateway/security), [Bac à sable](/fr/gateway/sandboxing).

  </Accordion>

  <Accordion title="J’ai vu des signalements concernant des instances OpenClaw exposées. Que dois-je vérifier ?">
    Vérifiez d’abord votre déploiement réel :

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Une base plus sûre est :

    - Gateway lié à `loopback`, ou exposé uniquement via un accès privé authentifié
      tel qu’un tailnet, un tunnel SSH, une authentification par jeton/mot de passe ou un proxy de confiance
      correctement configuré
    - DM en mode `pairing` ou `allowlist`
    - groupes dans une liste d’autorisation et soumis à mention sauf si chaque membre est fiable
    - outils à haut risque (`exec`, `browser`, `gateway`, `cron`) refusés ou strictement
      limités pour les agents qui lisent du contenu non fiable
    - bac à sable activé lorsque l’exécution d’outils nécessite un périmètre d’impact plus réduit

    Les liaisons publiques sans authentification, les DM/groupes ouverts avec outils et le contrôle
    de navigateur exposé sont les constats à corriger en premier. Détails :
    [Liste de contrôle d’audit de sécurité](/fr/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="Les Skills ClawHub et les plugins tiers sont-ils sûrs à installer ?">
    Traitez les Skills et plugins tiers comme du code auquel vous choisissez de faire confiance.
    Les pages Skills de ClawHub affichent l’état d’analyse avant l’installation, mais les analyses ne constituent pas une
    frontière de sécurité complète. OpenClaw n’exécute pas de blocage local intégré du
    code dangereux pendant les flux d’installation/mise à jour de plugins ou de Skills ; utilisez
    `security.installPolicy` détenu par l’opérateur pour les décisions locales d’autorisation/blocage.

    Modèle plus sûr :

    - privilégiez les auteurs de confiance et les versions épinglées
    - lisez le Skill ou le plugin avant de l’activer
    - gardez les listes d’autorisation de plugins et de Skills étroites
    - exécutez les workflows d’entrées non fiables dans un bac à sable avec un minimum d’outils
    - évitez de donner à du code tiers un accès large au système de fichiers, à exec, au navigateur ou aux secrets

    Détails : [Skills](/fr/tools/skills), [Plugins](/fr/tools/plugin),
    [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Mon bot doit-il avoir sa propre adresse e-mail, son propre compte GitHub ou son propre numéro de téléphone ?">
    Oui, pour la plupart des configurations. Isoler le bot avec des comptes et des numéros de téléphone
    séparés réduit le périmètre d’impact si un problème survient. Cela facilite aussi la rotation
    des identifiants ou la révocation de l’accès sans affecter vos comptes personnels.

    Commencez petit. Donnez accès uniquement aux outils et aux comptes dont vous avez réellement besoin, puis étendez
    plus tard si nécessaire.

    Docs : [Sécurité](/fr/gateway/security), [Appairage](/fr/channels/pairing).

  </Accordion>

  <Accordion title="Puis-je lui donner de l’autonomie sur mes SMS, et est-ce sûr ?">
    Nous ne recommandons **pas** l’autonomie complète sur vos messages personnels. Le modèle le plus sûr est le suivant :

    - Gardez les messages privés en **mode d’appairage** ou dans une liste d’autorisation stricte.
    - Utilisez un **numéro ou compte distinct** si vous voulez qu’il envoie des messages en votre nom.
    - Laissez-le rédiger, puis **approuvez avant l’envoi**.

    Si vous voulez expérimenter, faites-le sur un compte dédié et gardez-le isolé. Voir
    [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Puis-je utiliser des modèles moins chers pour les tâches d’assistant personnel ?">
    Oui, **si** l’agent est limité au chat et que l’entrée est fiable. Les niveaux plus petits sont
    plus sensibles au détournement d’instructions ; évitez-les donc pour les agents dotés d’outils
    ou lors de la lecture de contenu non fiable. Si vous devez utiliser un modèle plus petit, verrouillez
    les outils et exécutez-le dans un bac à sable. Voir [Sécurité](/fr/gateway/security).
  </Accordion>

  <Accordion title="J’ai exécuté /start dans Telegram, mais je n’ai pas reçu de code d’appairage">
    Les codes d’appairage sont envoyés **uniquement** lorsqu’un expéditeur inconnu envoie un message au bot et que
    `dmPolicy: "pairing"` est activé. `/start` seul ne génère pas de code.

    Vérifiez les demandes en attente :

    ```bash
    openclaw pairing list telegram
    ```

    Si vous voulez un accès immédiat, ajoutez votre identifiant d’expéditeur à la liste d’autorisation ou définissez `dmPolicy: "open"`
    pour ce compte.

  </Accordion>

  <Accordion title="WhatsApp : enverra-t-il des messages à mes contacts ? Comment fonctionne l’appairage ?">
    Non. La stratégie de messages privés WhatsApp par défaut est **pairing**. Les expéditeurs inconnus reçoivent seulement un code d’appairage, et leur message n’est **pas traité**. OpenClaw répond uniquement aux discussions qu’il reçoit ou aux envois explicites que vous déclenchez.

    Approuvez l’appairage avec :

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Listez les demandes en attente :

    ```bash
    openclaw pairing list whatsapp
    ```

    Invite de numéro de téléphone de l’assistant : elle sert à définir votre **liste d’autorisation/propriétaire** afin que vos propres messages privés soient autorisés. Elle n’est pas utilisée pour l’envoi automatique. Si vous l’exécutez sur votre numéro WhatsApp personnel, utilisez ce numéro et activez `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Commandes de chat, abandon de tâches et « il ne s’arrête pas »

<AccordionGroup>
  <Accordion title="Comment empêcher les messages système internes d’apparaître dans le chat ?">
    La plupart des messages internes ou d’outils n’apparaissent que lorsque **verbose**, **trace** ou **reasoning** est activé
    pour cette session.

    Corrigez cela dans le chat où vous le voyez :

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Si cela reste trop bruyant, vérifiez les paramètres de session dans l’interface Control UI et définissez verbose
    sur **inherit**. Confirmez aussi que vous n’utilisez pas un profil de bot avec `verboseDefault` défini
    sur `on` dans la configuration.

    Docs : [Réflexion et verbose](/fr/tools/thinking), [Sécurité](/fr/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Comment arrêter/annuler une tâche en cours ?">
    Envoyez l’un des messages suivants **comme message autonome** (sans barre oblique) :

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

    La plupart des commandes doivent être envoyées comme message **autonome** commençant par `/`, mais quelques raccourcis (comme `/status`) fonctionnent aussi en ligne pour les expéditeurs figurant dans la liste d’autorisation.

  </Accordion>

  <Accordion title='Comment envoyer un message Discord depuis Telegram ? (« Messagerie intercontexte refusée »)'>
    OpenClaw bloque par défaut la messagerie **interfournisseurs**. Si un appel d’outil est lié
    à Telegram, il n’enverra rien à Discord sauf si vous l’autorisez explicitement.

    Activez la messagerie interfournisseurs pour l’agent :

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

  <Accordion title='Pourquoi ai-je l’impression que le bot « ignore » les messages envoyés en rafale ?'>
    Par défaut, les invites envoyées pendant une exécution sont dirigées vers l’exécution active. Utilisez `/queue` pour choisir le comportement de l’exécution active :

    - `steer` - guider l’exécution active à la prochaine frontière de modèle
    - `followup` - mettre les messages en file d’attente et les exécuter un par un après la fin de l’exécution actuelle
    - `collect` - mettre les messages compatibles en file d’attente et répondre une fois après la fin de l’exécution actuelle
    - `interrupt` - abandonner l’exécution actuelle et repartir de zéro

    Le mode par défaut est `steer`. Vous pouvez ajouter des options comme `debounce:0.5s cap:25 drop:summarize` pour les modes mis en file d’attente. Voir [File de commandes](/fr/concepts/queue) et [File de pilotage](/fr/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Divers

<AccordionGroup>
  <Accordion title='Quel est le modèle par défaut pour Anthropic avec une clé API ?'>
    Dans OpenClaw, les identifiants et la sélection du modèle sont séparés. Définir `ANTHROPIC_API_KEY` (ou stocker une clé API Anthropic dans les profils d’authentification) active l’authentification, mais le modèle par défaut réel est celui que vous configurez dans `agents.defaults.model.primary` (par exemple, `anthropic/claude-sonnet-4-6` ou `anthropic/claude-opus-4-6`). Si vous voyez `No credentials found for profile "anthropic:default"`, cela signifie que le Gateway n’a pas trouvé d’identifiants Anthropic dans le fichier `auth-profiles.json` attendu pour l’agent en cours d’exécution.
  </Accordion>
</AccordionGroup>

---

Toujours bloqué ? Demandez dans [Discord](https://discord.com/invite/clawd) ou ouvrez une [discussion GitHub](https://github.com/openclaw/openclaw/discussions).

## Connexe

- [FAQ de première exécution](/fr/help/faq-first-run) — installation, intégration, authentification, abonnements, premiers échecs
- [FAQ sur les modèles](/fr/help/faq-models) — sélection du modèle, basculement, profils d’authentification
- [Dépannage](/fr/help/troubleshooting) — triage par symptôme
