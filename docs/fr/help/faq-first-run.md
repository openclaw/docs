---
read_when:
    - Nouvelle installation, onboarding bloqué ou erreurs au premier lancement
    - Choisir l'authentification et les abonnements fournisseur
    - Impossible d'accéder à docs.openclaw.ai, impossible d'ouvrir le tableau de bord, installation bloquée
sidebarTitle: First-run FAQ
summary: 'FAQ : démarrage rapide et configuration au premier lancement — installation, onboarding, authentification, abonnements, premiers échecs'
title: 'FAQ : configuration au premier lancement'
x-i18n:
    generated_at: "2026-04-26T11:31:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55d375285eb9f79cfa210b1b591b07b57d8a0a4d38c330062886d1204135ff48
    source_path: help/faq-first-run.md
    workflow: 15
---

  Questions / réponses de démarrage rapide et de première exécution. Pour les opérations quotidiennes, les modèles, l'authentification, les sessions
  et la résolution des problèmes, consultez la [FAQ](/fr/help/faq) principale.

  ## Démarrage rapide et configuration au premier lancement

  <AccordionGroup>
  <Accordion title="Je suis bloqué, quel est le moyen le plus rapide de me débloquer ?">
    Utilisez un agent IA local qui peut **voir votre machine**. C'est bien plus efficace que de demander
    sur Discord, car la plupart des cas de type « je suis bloqué » sont des **problèmes locaux de configuration ou d'environnement** que
    les assistants à distance ne peuvent pas inspecter.

    - **Claude Code** : [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex** : [https://openai.com/codex/](https://openai.com/codex/)

    Ces outils peuvent lire le dépôt, exécuter des commandes, inspecter les journaux et aider à corriger
    la configuration au niveau de votre machine (PATH, services, permissions, fichiers d'authentification). Donnez-leur le **checkout complet des sources** via
    l'installation hackable (git) :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Cela installe OpenClaw **à partir d'un checkout git**, de sorte que l'agent peut lire le code + la documentation et
    raisonner sur la version exacte que vous exécutez. Vous pouvez toujours revenir plus tard à la version stable
    en relançant l'installeur sans `--install-method git`.

    Astuce : demandez à l'agent de **planifier et superviser** la correction (étape par étape), puis de n'exécuter que les
    commandes nécessaires. Cela garde les changements limités et plus faciles à auditer.

    Si vous découvrez un vrai bug ou une correction, veuillez ouvrir une issue GitHub ou envoyer une PR :
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Commencez par ces commandes (partagez les sorties lorsque vous demandez de l'aide) :

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ce qu'elles font :

    - `openclaw status` : instantané rapide de l'état de santé de la gateway / de l'agent + configuration de base.
    - `openclaw models status` : vérifie l'authentification des fournisseurs + la disponibilité des modèles.
    - `openclaw doctor` : valide et répare les problèmes courants de configuration / d'état.

    Autres vérifications CLI utiles : `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Boucle de débogage rapide : [Les 60 premières secondes si quelque chose est cassé](#first-60-seconds-if-something-is-broken).
    Docs d'installation : [Installer](/fr/install), [Drapeaux de l'installeur](/fr/install/installer), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continue d'être ignoré. Que signifient les raisons d'ignoré ?">
    Raisons fréquentes d'ignoré pour Heartbeat :

    - `quiet-hours` : en dehors de la fenêtre d'heures actives configurée
    - `empty-heartbeat-file` : `HEARTBEAT.md` existe mais ne contient qu'une structure vide / uniquement des en-têtes
    - `no-tasks-due` : le mode tâche de `HEARTBEAT.md` est actif mais aucun des intervalles de tâche n'est encore dû
    - `alerts-disabled` : toute la visibilité Heartbeat est désactivée (`showOk`, `showAlerts` et `useIndicator` sont tous désactivés)

    En mode tâche, les horodatages d'échéance ne sont avancés qu'après une véritable exécution de Heartbeat
    terminée. Les exécutions ignorées ne marquent pas les tâches comme terminées.

    Docs : [Heartbeat](/fr/gateway/heartbeat), [Automatisation & tâches](/fr/automation).

  </Accordion>

  <Accordion title="Méthode recommandée pour installer et configurer OpenClaw">
    Le dépôt recommande d'exécuter depuis les sources et d'utiliser l'onboarding :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    L'assistant peut aussi construire automatiquement les assets UI. Après l'onboarding, vous exécutez généralement la Gateway sur le port **18789**.

    Depuis les sources (contributeurs / dev) :

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Si vous n'avez pas encore d'installation globale, exécutez-la via `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Comment ouvrir le tableau de bord après l'onboarding ?">
    L'assistant ouvre votre navigateur avec une URL de tableau de bord propre (sans jeton) juste après l'onboarding et affiche aussi le lien dans le résumé. Gardez cet onglet ouvert ; s'il ne s'est pas lancé, copiez/collez l'URL affichée sur la même machine.
  </Accordion>

  <Accordion title="Comment authentifier le tableau de bord sur localhost par rapport à un accès distant ?">
    **Localhost (même machine) :**

    - Ouvrez `http://127.0.0.1:18789/`.
    - S'il demande une authentification par secret partagé, collez le jeton ou le mot de passe configuré dans les paramètres de l'UI de contrôle.
    - Source du jeton : `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
    - Source du mot de passe : `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Si aucun secret partagé n'est encore configuré, générez un jeton avec `openclaw doctor --generate-gateway-token`.

    **Pas sur localhost :**

    - **Tailscale Serve** (recommandé) : gardez le bind loopback, exécutez `openclaw gateway --tailscale serve`, ouvrez `https://<magicdns>/`. Si `gateway.auth.allowTailscale` vaut `true`, les en-têtes d'identité satisfont l'authentification de l'UI de contrôle / WebSocket (pas de secret partagé à coller, suppose un hôte gateway de confiance) ; les API HTTP nécessitent toujours une authentification par secret partagé, sauf si vous utilisez délibérément l'ingress privé `none` ou l'authentification HTTP trusted-proxy.
      Les mauvaises tentatives d'authentification Serve concurrentes du même client sont sérialisées avant que le limiteur d'échecs d'authentification ne les enregistre ; la deuxième mauvaise tentative peut donc déjà afficher `retry later`.
    - **Bind tailnet** : exécutez `openclaw gateway --bind tailnet --token "<token>"` (ou configurez l'authentification par mot de passe), ouvrez `http://<tailscale-ip>:18789/`, puis collez le secret partagé correspondant dans les paramètres du tableau de bord.
    - **Proxy inverse conscient de l'identité** : gardez la Gateway derrière un trusted proxy non loopback, configurez `gateway.auth.mode: "trusted-proxy"`, puis ouvrez l'URL du proxy.
    - **Tunnel SSH** : `ssh -N -L 18789:127.0.0.1:18789 user@host` puis ouvrez `http://127.0.0.1:18789/`. L'authentification par secret partagé s'applique toujours via le tunnel ; collez le jeton ou le mot de passe configuré si demandé.

    Voir [Tableau de bord](/fr/web/dashboard) et [Surfaces Web](/fr/web) pour les détails sur les modes de bind et l'authentification.

  </Accordion>

  <Accordion title="Pourquoi existe-t-il deux configurations d'approbation exec pour les approbations dans le chat ?">
    Elles contrôlent des couches différentes :

    - `approvals.exec` : transfère les invites d'approbation vers des destinations de chat
    - `channels.<channel>.execApprovals` : fait de ce canal un client d'approbation natif pour les approbations exec

    La politique exec de l'hôte reste le véritable garde-fou d'approbation. La configuration du chat contrôle seulement où les invites d'approbation
    apparaissent et comment les personnes peuvent y répondre.

    Dans la plupart des configurations, vous n'avez **pas** besoin des deux :

    - Si le chat prend déjà en charge les commandes et les réponses, `/approve` dans le même chat fonctionne via le chemin partagé.
    - Si un canal natif pris en charge peut déduire les approbateurs en toute sécurité, OpenClaw active désormais automatiquement les approbations natives DM-first lorsque `channels.<channel>.execApprovals.enabled` n'est pas défini ou vaut `"auto"`.
    - Lorsque des cartes / boutons d'approbation natifs sont disponibles, cette UI native est le chemin principal ; l'agent ne doit inclure une commande manuelle `/approve` que si le résultat de l'outil indique que les approbations dans le chat sont indisponibles ou qu'une approbation manuelle est le seul chemin.
    - Utilisez `approvals.exec` uniquement lorsque les invites doivent aussi être transférées vers d'autres chats ou des salons ops explicites.
    - Utilisez `channels.<channel>.execApprovals.target: "channel"` ou `"both"` uniquement lorsque vous voulez explicitement que les invites d'approbation soient renvoyées dans le salon / sujet d'origine.
    - Les approbations de Plugin sont encore distinctes : elles utilisent par défaut `/approve` dans le même chat, un transfert facultatif `approvals.plugin`, et seuls certains canaux natifs conservent en plus une gestion native des approbations de Plugin.

    En version courte : le transfert sert au routage, la configuration du client natif sert à une UX plus riche spécifique au canal.
    Voir [Approbations Exec](/fr/tools/exec-approvals).

  </Accordion>

  <Accordion title="De quel runtime ai-je besoin ?">
    Node **>= 22** est requis. `pnpm` est recommandé. Bun est **déconseillé** pour la Gateway.
  </Accordion>

  <Accordion title="Est-ce que cela fonctionne sur Raspberry Pi ?">
    Oui. La Gateway est légère — la documentation indique que **512 Mo à 1 Go de RAM**, **1 cœur** et environ **500 Mo**
    de disque suffisent pour un usage personnel, et précise qu'un **Raspberry Pi 4 peut l'exécuter**.

    Si vous voulez plus de marge (journaux, médias, autres services), **2 Go sont recommandés**, mais ce
    n'est pas un minimum strict.

    Astuce : un petit Pi / VPS peut héberger la Gateway, et vous pouvez associer des **nœuds** sur votre ordinateur portable / téléphone pour
    l'écran / la caméra / le canvas local ou l'exécution de commandes. Voir [Nœuds](/fr/nodes).

  </Accordion>

  <Accordion title="Des conseils pour les installations sur Raspberry Pi ?">
    En bref : cela fonctionne, mais attendez-vous à quelques aspérités.

    - Utilisez un OS **64 bits** et gardez Node >= 22.
    - Préférez l'**installation hackable (git)** afin de pouvoir voir les journaux et mettre à jour rapidement.
    - Démarrez sans canaux / Skills, puis ajoutez-les un par un.
    - Si vous rencontrez d'étranges problèmes binaires, il s'agit généralement d'un problème de **compatibilité ARM**.

    Docs : [Linux](/fr/platforms/linux), [Installer](/fr/install).

  </Accordion>

  <Accordion title="C'est bloqué sur wake up my friend / l'onboarding ne se lance pas. Que faire ?">
    Cet écran dépend du fait que la Gateway soit joignable et authentifiée. Le TUI envoie aussi
    automatiquement « Wake up, my friend! » au premier lancement. Si vous voyez cette ligne **sans réponse**
    et que les tokens restent à 0, l'agent ne s'est jamais exécuté.

    1. Redémarrez la Gateway :

    ```bash
    openclaw gateway restart
    ```

    2. Vérifiez l'état + l'authentification :

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Si cela bloque toujours, exécutez :

    ```bash
    openclaw doctor
    ```

    Si la Gateway est distante, assurez-vous que le tunnel / la connexion Tailscale est actif et que l'UI
    pointe vers la bonne Gateway. Voir [Accès distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Puis-je migrer mon installation vers une nouvelle machine (Mac mini) sans refaire l'onboarding ?">
    Oui. Copiez le **répertoire d'état** et l'**espace de travail**, puis exécutez Doctor une fois. Cela
    conserve votre bot « exactement pareil » (mémoire, historique de session, authentification et état
    des canaux) tant que vous copiez **les deux** emplacements :

    1. Installez OpenClaw sur la nouvelle machine.
    2. Copiez `$OPENCLAW_STATE_DIR` (par défaut : `~/.openclaw`) depuis l'ancienne machine.
    3. Copiez votre espace de travail (par défaut : `~/.openclaw/workspace`).
    4. Exécutez `openclaw doctor` et redémarrez le service Gateway.

    Cela préserve la configuration, les profils d'authentification, les identifiants WhatsApp, les sessions et la mémoire. Si vous êtes en
    mode distant, rappelez-vous que l'hôte gateway possède le magasin de sessions et l'espace de travail.

    **Important :** si vous ne committez / poussez que votre espace de travail vers GitHub, vous sauvegardez
    **la mémoire + les fichiers de bootstrap**, mais **pas** l'historique de session ni l'authentification. Ceux-ci se trouvent
    sous `~/.openclaw/` (par exemple `~/.openclaw/agents/<agentId>/sessions/`).

    Liens associés : [Migration](/fr/install/migrating), [Où vivent les choses sur le disque](#where-things-live-on-disk),
    [Espace de travail de l'agent](/fr/concepts/agent-workspace), [Doctor](/fr/gateway/doctor),
    [Mode distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Où puis-je voir les nouveautés de la dernière version ?">
    Consultez le changelog GitHub :
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Les entrées les plus récentes sont en haut. Si la section du haut est marquée **Unreleased**, la section datée suivante
    est la dernière version publiée. Les entrées sont regroupées par **Highlights**, **Changes** et
    **Fixes** (plus sections docs / autres si nécessaire).

  </Accordion>

  <Accordion title="Impossible d'accéder à docs.openclaw.ai (erreur SSL)">
    Certaines connexions Comcast / Xfinity bloquent incorrectement `docs.openclaw.ai` via Xfinity
    Advanced Security. Désactivez-le ou ajoutez `docs.openclaw.ai` à la liste d'autorisation, puis réessayez.
    Merci de nous aider à le débloquer en le signalant ici : [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Si vous ne pouvez toujours pas accéder au site, la documentation est répliquée sur GitHub :
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Différence entre stable et beta">
    **Stable** et **beta** sont des **dist-tags npm**, pas des lignes de code séparées :

    - `latest` = stable
    - `beta` = build anticipé pour les tests

    En général, une release stable arrive d'abord sur **beta**, puis une étape de
    promotion explicite déplace cette même version vers `latest`. Les mainteneurs peuvent aussi
    publier directement sur `latest` si nécessaire. C'est pourquoi beta et stable peuvent
    pointer vers la **même version** après promotion.

    Voir ce qui a changé :
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Pour les commandes d'installation en une ligne et la différence entre beta et dev, voir l'accordéon ci-dessous.

  </Accordion>

  <Accordion title="Comment installer la version beta et quelle est la différence entre beta et dev ?">
    **Beta** est le dist-tag npm `beta` (peut correspondre à `latest` après promotion).
    **Dev** est la tête mobile de `main` (git) ; lorsqu'il est publié, il utilise le dist-tag npm `dev`.

    Commandes en une ligne (macOS/Linux) :

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Installeur Windows (PowerShell) :
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Plus de détails : [Canaux de développement](/fr/install/development-channels) et [Drapeaux de l'installeur](/fr/install/installer).

  </Accordion>

  <Accordion title="Comment essayer les derniers éléments ?">
    Deux options :

    1. **Canal dev (checkout git) :**

    ```bash
    openclaw update --channel dev
    ```

    Cela bascule sur la branche `main` et met à jour depuis les sources.

    2. **Installation hackable (depuis le site de l'installeur) :**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Cela vous donne un dépôt local que vous pouvez modifier, puis mettre à jour via git.

    Si vous préférez un clone propre à la main, utilisez :

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Docs : [Mise à jour](/fr/cli/update), [Canaux de développement](/fr/install/development-channels),
    [Installer](/fr/install).

  </Accordion>

  <Accordion title="Combien de temps prennent généralement l'installation et l'onboarding ?">
    Ordre de grandeur :

    - **Installation :** 2 à 5 minutes
    - **Onboarding :** 5 à 15 minutes selon le nombre de canaux / modèles que vous configurez

    Si cela bloque, utilisez [Installeur bloqué](#quick-start-and-first-run-setup)
    et la boucle de débogage rapide dans [Je suis bloqué](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="L'installeur est bloqué ? Comment obtenir plus de retours ?">
    Relancez l'installeur avec une **sortie verbeuse** :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Installation beta avec sortie verbeuse :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Pour une installation hackable (git) :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Équivalent Windows (PowerShell) :

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Plus d'options : [Drapeaux de l'installeur](/fr/install/installer).

  </Accordion>

  <Accordion title="Sous Windows, l'installation indique git not found ou openclaw not recognized">
    Deux problèmes Windows fréquents :

    **1) Erreur npm spawn git / git not found**

    - Installez **Git for Windows** et assurez-vous que `git` est dans votre PATH.
    - Fermez et rouvrez PowerShell, puis relancez l'installeur.

    **2) openclaw is not recognized après l'installation**

    - Votre dossier global bin npm n'est pas dans le PATH.
    - Vérifiez le chemin :

      ```powershell
      npm config get prefix
      ```

    - Ajoutez ce répertoire à votre PATH utilisateur (pas besoin du suffixe `\bin` sous Windows ; sur la plupart des systèmes, c'est `%AppData%\npm`).
    - Fermez et rouvrez PowerShell après avoir mis à jour le PATH.

    Si vous voulez la configuration Windows la plus fluide, utilisez **WSL2** plutôt que Windows natif.
    Docs : [Windows](/fr/platforms/windows).

  </Accordion>

  <Accordion title="Sous Windows, la sortie exec affiche du texte chinois illisible — que dois-je faire ?">
    Il s'agit généralement d'un décalage de page de codes de console dans les shells Windows natifs.

    Symptômes :

    - la sortie `system.run` / `exec` affiche le chinois en mojibake
    - la même commande s'affiche correctement dans un autre profil de terminal

    Contournement rapide dans PowerShell :

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Ensuite, redémarrez la Gateway et réessayez votre commande :

    ```powershell
    openclaw gateway restart
    ```

    Si vous reproduisez toujours cela sur la dernière version d'OpenClaw, suivez / signalez-le dans :

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentation n'a pas répondu à ma question — comment obtenir une meilleure réponse ?">
    Utilisez l'**installation hackable (git)** afin d'avoir localement les sources et la documentation complètes, puis demandez
    à votre bot (ou à Claude/Codex) _depuis ce dossier_ afin qu'il puisse lire le dépôt et répondre précisément.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Plus de détails : [Installer](/fr/install) et [Drapeaux de l'installeur](/fr/install/installer).

  </Accordion>

  <Accordion title="Comment installer OpenClaw sur Linux ?">
    Réponse courte : suivez le guide Linux, puis lancez l'onboarding.

    - Chemin rapide Linux + installation du service : [Linux](/fr/platforms/linux).
    - Procédure complète : [Premiers pas](/fr/start/getting-started).
    - Installation + mises à jour : [Installation et mises à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Comment installer OpenClaw sur un VPS ?">
    N'importe quel VPS Linux fonctionne. Installez sur le serveur, puis utilisez SSH / Tailscale pour accéder à la Gateway.

    Guides : [exe.dev](/fr/install/exe-dev), [Hetzner](/fr/install/hetzner), [Fly.io](/fr/install/fly).
    Accès distant : [Gateway remote](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Où se trouvent les guides d'installation cloud / VPS ?">
    Nous maintenons un **hub d'hébergement** avec les fournisseurs courants. Choisissez-en un et suivez le guide :

    - [Hébergement VPS](/fr/vps) (tous les fournisseurs au même endroit)
    - [Fly.io](/fr/install/fly)
    - [Hetzner](/fr/install/hetzner)
    - [exe.dev](/fr/install/exe-dev)

    Fonctionnement dans le cloud : la **Gateway s'exécute sur le serveur**, et vous y accédez
    depuis votre ordinateur portable / téléphone via l'UI de contrôle (ou Tailscale / SSH). Votre état et votre espace de travail
    vivent sur le serveur, donc considérez l'hôte comme la source de vérité et sauvegardez-le.

    Vous pouvez associer des **nœuds** (Mac/iOS/Android/headless) à cette Gateway cloud pour accéder
    à l'écran / la caméra / le canvas locaux ou exécuter des commandes sur votre ordinateur portable tout en gardant la
    Gateway dans le cloud.

    Hub : [Plateformes](/fr/platforms). Accès distant : [Gateway remote](/fr/gateway/remote).
    Nœuds : [Nodes](/fr/nodes), [CLI Nodes](/fr/cli/nodes).

  </Accordion>

  <Accordion title="Puis-je demander à OpenClaw de se mettre à jour lui-même ?">
    Réponse courte : **possible, non recommandé**. Le flux de mise à jour peut redémarrer la
    Gateway (ce qui coupe la session active), peut nécessiter un checkout git propre, et
    peut demander une confirmation. Plus sûr : exécuter les mises à jour depuis un shell en tant qu'opérateur.

    Utilisez la CLI :

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Si vous devez l'automatiser depuis un agent :

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Docs : [Mise à jour](/fr/cli/update), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Que fait réellement l'onboarding ?">
    `openclaw onboard` est le chemin de configuration recommandé. En **mode local**, il vous guide pour :

    - **Configuration du modèle / de l'authentification** (OAuth fournisseur, clés API, setup-token Anthropic, ainsi que des options de modèle local comme LM Studio)
    - Emplacement de l'**espace de travail** + fichiers de bootstrap
    - **Paramètres Gateway** (bind / port / auth / Tailscale)
    - **Canaux** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus des Plugins de canal inclus comme QQ Bot)
    - **Installation du daemon** (LaunchAgent sur macOS ; unité utilisateur systemd sur Linux/WSL2)
    - **Vérifications d'état** et sélection des **Skills**

    Il avertit aussi si votre modèle configuré est inconnu ou s'il manque l'authentification.

  </Accordion>

  <Accordion title="Ai-je besoin d'un abonnement Claude ou OpenAI pour faire fonctionner cela ?">
    Non. Vous pouvez exécuter OpenClaw avec des **clés API** (Anthropic / OpenAI / autres) ou avec
    des **modèles purement locaux** pour que vos données restent sur votre appareil. Les abonnements (Claude
    Pro/Max ou OpenAI Codex) sont des moyens facultatifs d'authentifier ces fournisseurs.

    Pour Anthropic dans OpenClaw, la distinction pratique est :

    - **Clé API Anthropic** : facturation API Anthropic normale
    - **Authentification Claude CLI / abonnement Claude dans OpenClaw** : le personnel Anthropic
      nous a indiqué que cet usage est de nouveau autorisé, et OpenClaw traite l'usage `claude -p`
      comme validé pour cette intégration tant qu'Anthropic ne publie pas une nouvelle
      politique

    Pour des hôtes gateway de longue durée, les clés API Anthropic restent la configuration la plus
    prévisible. OpenAI Codex OAuth est explicitement pris en charge pour les outils externes
    comme OpenClaw.

    OpenClaw prend aussi en charge d'autres options hébergées de type abonnement, notamment
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** et
    **Z.AI / GLM Coding Plan**.

    Docs : [Anthropic](/fr/providers/anthropic), [OpenAI](/fr/providers/openai),
    [Qwen Cloud](/fr/providers/qwen),
    [MiniMax](/fr/providers/minimax), [Modèles GLM](/fr/providers/glm),
    [Modèles locaux](/fr/gateway/local-models), [Modèles](/fr/concepts/models).

  </Accordion>

  <Accordion title="Puis-je utiliser un abonnement Claude Max sans clé API ?">
    Oui.

    Le personnel Anthropic nous a indiqué que l'usage de type Claude CLI par OpenClaw est de nouveau autorisé ; OpenClaw traite donc l'authentification par abonnement Claude et l'usage `claude -p` comme validés
    pour cette intégration tant qu'Anthropic ne publie pas une nouvelle politique. Si vous souhaitez
    la configuration côté serveur la plus prévisible, utilisez plutôt une clé API Anthropic.

  </Accordion>

  <Accordion title="Prenez-vous en charge l'authentification par abonnement Claude (Claude Pro ou Max) ?">
    Oui.

    Le personnel Anthropic nous a indiqué que cet usage est de nouveau autorisé, donc OpenClaw traite
    la réutilisation de Claude CLI et l'usage `claude -p` comme validés pour cette intégration
    tant qu'Anthropic ne publie pas une nouvelle politique.

    Le setup-token Anthropic reste disponible comme chemin de jeton pris en charge par OpenClaw, mais OpenClaw préfère désormais la réutilisation de Claude CLI et `claude -p` lorsqu'ils sont disponibles.
    Pour les charges de travail de production ou multi-utilisateurs, l'authentification par clé API Anthropic reste le
    choix le plus sûr et le plus prévisible. Si vous voulez d'autres options hébergées de type abonnement
    dans OpenClaw, voir [OpenAI](/fr/providers/openai), [Qwen / Model
    Cloud](/fr/providers/qwen), [MiniMax](/fr/providers/minimax) et [Modèles
    GLM](/fr/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Pourquoi est-ce que je vois HTTP 429 rate_limit_error depuis Anthropic ?">
    Cela signifie que votre **quota / limitation de débit Anthropic** est épuisé pour la fenêtre actuelle. Si vous
    utilisez **Claude CLI**, attendez la réinitialisation de la fenêtre ou passez à une offre supérieure. Si vous
    utilisez une **clé API Anthropic**, vérifiez la console Anthropic
    pour l'usage / la facturation et augmentez les limites si nécessaire.

    Si le message est précisément :
    `Extra usage is required for long context requests`, la requête tente d'utiliser
    la bêta 1M de contexte d'Anthropic (`context1m: true`). Cela ne fonctionne que lorsque votre
    identifiant est éligible à la facturation long contexte (facturation par clé API ou
    chemin OpenClaw de connexion Claude avec Extra Usage activé).

    Astuce : définissez un **modèle de repli** afin qu'OpenClaw puisse continuer à répondre pendant qu'un fournisseur est limité en débit.
    Voir [Models](/fr/cli/models), [OAuth](/fr/concepts/oauth), et
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/fr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock est-il pris en charge ?">
    Oui. OpenClaw inclut un fournisseur **Amazon Bedrock (Converse)**. Avec les marqueurs d'environnement AWS présents, OpenClaw peut découvrir automatiquement le catalogue Bedrock streaming/texte et le fusionner comme fournisseur implicite `amazon-bedrock` ; sinon, vous pouvez activer explicitement `plugins.entries.amazon-bedrock.config.discovery.enabled` ou ajouter une entrée de fournisseur manuelle. Voir [Amazon Bedrock](/fr/providers/bedrock) et [Model providers](/fr/providers/models). Si vous préférez un flux géré par clé, un proxy compatible OpenAI devant Bedrock reste une option valide.
  </Accordion>

  <Accordion title="Comment fonctionne l'authentification Codex ?">
    OpenClaw prend en charge **OpenAI Code (Codex)** via OAuth (connexion ChatGPT). Utilisez
    `openai-codex/gpt-5.5` pour Codex OAuth via le runner PI par défaut. Utilisez
    `openai/gpt-5.5` pour un accès direct par clé API OpenAI. GPT-5.5 peut aussi utiliser
    l'abonnement/OAuth via `openai-codex/gpt-5.5` ou des exécutions natives Codex app-server
    avec `openai/gpt-5.5` et `agentRuntime.id: "codex"`.
    Voir [Model providers](/fr/concepts/model-providers) et [Onboarding (CLI)](/fr/start/wizard).
  </Accordion>

  <Accordion title="Pourquoi OpenClaw mentionne-t-il encore openai-codex ?">
    `openai-codex` est l'id de fournisseur et de profil d'authentification pour OAuth ChatGPT/Codex.
    C'est aussi le préfixe explicite de modèle PI pour Codex OAuth :

    - `openai/gpt-5.5` = chemin actuel direct par clé API OpenAI dans PI
    - `openai-codex/gpt-5.5` = chemin Codex OAuth dans PI
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = chemin natif Codex app-server
    - `openai-codex:...` = id de profil d'authentification, pas une référence de modèle

    Si vous voulez le chemin direct de facturation/limitation OpenAI Platform, définissez
    `OPENAI_API_KEY`. Si vous voulez l'authentification par abonnement ChatGPT/Codex, connectez-vous avec
    `openclaw models auth login --provider openai-codex` et utilisez
    les références de modèle `openai-codex/*` pour les exécutions PI.

  </Accordion>

  <Accordion title="Pourquoi les limites Codex OAuth peuvent-elles différer de ChatGPT web ?">
    Codex OAuth utilise des fenêtres de quota dépendantes de l'offre et gérées par OpenAI. En pratique,
    ces limites peuvent différer de l'expérience du site/app ChatGPT, même lorsque
    les deux sont liés au même compte.

    OpenClaw peut afficher les fenêtres actuellement visibles d'usage/quota du fournisseur dans
    `openclaw models status`, mais il n'invente ni ne normalise les
    droits ChatGPT web en accès API direct. Si vous voulez le chemin direct de facturation/limitation OpenAI Platform,
    utilisez `openai/*` avec une clé API.

  </Accordion>

  <Accordion title="Prenez-vous en charge l'authentification par abonnement OpenAI (Codex OAuth) ?">
    Oui. OpenClaw prend entièrement en charge **OpenAI Code (Codex) subscription OAuth**.
    OpenAI autorise explicitement l'usage OAuth par abonnement dans des outils/workflows externes
    comme OpenClaw. L'onboarding peut exécuter le flux OAuth pour vous.

    Voir [OAuth](/fr/concepts/oauth), [Model providers](/fr/concepts/model-providers), et [Onboarding (CLI)](/fr/start/wizard).

  </Accordion>

  <Accordion title="Comment configurer Gemini CLI OAuth ?">
    Gemini CLI utilise un **flux d'authentification de Plugin**, pas un client id ni un secret dans `openclaw.json`.

    Étapes :

    1. Installez Gemini CLI localement afin que `gemini` soit dans le `PATH`
       - Homebrew : `brew install gemini-cli`
       - npm : `npm install -g @google/gemini-cli`
    2. Activez le Plugin : `openclaw plugins enable google`
    3. Connectez-vous : `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modèle par défaut après connexion : `google-gemini-cli/gemini-3-flash-preview`
    5. Si les requêtes échouent, définissez `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` sur l'hôte gateway

    Cela stocke les jetons OAuth dans les profils d'authentification sur l'hôte gateway. Détails : [Model providers](/fr/concepts/model-providers).

  </Accordion>

  <Accordion title="Un modèle local convient-il pour des discussions occasionnelles ?">
    En général non. OpenClaw a besoin d'un grand contexte + d'une sécurité robuste ; les petites cartes tronquent et laissent fuiter. Si vous le devez vraiment, exécutez le build de modèle **le plus grand** possible localement (LM Studio) et voir [/gateway/local-models](/fr/gateway/local-models). Les modèles plus petits/quantifiés augmentent le risque d'injection de prompt - voir [Security](/fr/gateway/security).
  </Accordion>

  <Accordion title="Comment garder le trafic des modèles hébergés dans une région spécifique ?">
    Choisissez des endpoints épinglés à une région. OpenRouter expose des options hébergées aux États-Unis pour MiniMax, Kimi et GLM ; choisissez la variante hébergée aux États-Unis pour conserver les données dans la région. Vous pouvez toujours lister Anthropic/OpenAI à côté de ceux-ci en utilisant `models.mode: "merge"` afin que les replis restent disponibles tout en respectant le fournisseur régional que vous sélectionnez.
  </Accordion>

  <Accordion title="Dois-je acheter un Mac Mini pour installer ceci ?">
    Non. OpenClaw fonctionne sur macOS ou Linux (Windows via WSL2). Un Mac mini est facultatif - certaines personnes
    en achètent un comme hôte toujours actif, mais un petit VPS, serveur domestique ou boîtier de classe Raspberry Pi fonctionne aussi.

    Vous n'avez besoin d'un Mac **que pour les outils macOS uniquement**. Pour iMessage, utilisez [BlueBubbles](/fr/channels/bluebubbles) (recommandé) - le serveur BlueBubbles fonctionne sur n'importe quel Mac, et la Gateway peut fonctionner sur Linux ou ailleurs. Si vous voulez d'autres outils uniquement macOS, exécutez la Gateway sur un Mac ou associez un nœud macOS.

    Docs : [BlueBubbles](/fr/channels/bluebubbles), [Nodes](/fr/nodes), [Mode distant Mac](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Ai-je besoin d'un Mac mini pour la prise en charge d'iMessage ?">
    Vous avez besoin d'un **appareil macOS** connecté à Messages. Il ne doit **pas** forcément s'agir d'un Mac mini -
    n'importe quel Mac convient. **Utilisez [BlueBubbles](/fr/channels/bluebubbles)** (recommandé) pour iMessage - le serveur BlueBubbles fonctionne sur macOS, tandis que la Gateway peut fonctionner sur Linux ou ailleurs.

    Configurations courantes :

    - Exécuter la Gateway sur Linux/VPS, et exécuter le serveur BlueBubbles sur n'importe quel Mac connecté à Messages.
    - Tout exécuter sur le Mac si vous voulez la configuration la plus simple sur une seule machine.

    Docs : [BlueBubbles](/fr/channels/bluebubbles), [Nodes](/fr/nodes),
    [Mode distant Mac](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Si j'achète un Mac mini pour exécuter OpenClaw, puis-je le connecter à mon MacBook Pro ?">
    Oui. Le **Mac mini peut exécuter la Gateway**, et votre MacBook Pro peut se connecter comme
    **nœud** (appareil compagnon). Les nœuds n'exécutent pas la Gateway - ils fournissent des
    capacités supplémentaires comme l'écran/la caméra/le canvas et `system.run` sur cet appareil.

    Schéma courant :

    - Gateway sur le Mac mini (toujours actif).
    - Le MacBook Pro exécute l'app macOS ou un hôte de nœud et s'associe à la Gateway.
    - Utilisez `openclaw nodes status` / `openclaw nodes list` pour le voir.

    Docs : [Nodes](/fr/nodes), [CLI Nodes](/fr/cli/nodes).

  </Accordion>

  <Accordion title="Puis-je utiliser Bun ?">
    Bun est **déconseillé**. Nous constatons des bugs d'exécution, en particulier avec WhatsApp et Telegram.
    Utilisez **Node** pour des gateways stables.

    Si vous voulez quand même expérimenter avec Bun, faites-le sur une gateway non production
    sans WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram : que faut-il mettre dans allowFrom ?">
    `channels.telegram.allowFrom` correspond à **l'id Telegram de l'expéditeur humain** (numérique). Ce n'est pas le nom d'utilisateur du bot.

    La configuration demande uniquement des ids utilisateur numériques. Si vous avez déjà d'anciennes entrées `@username` dans la configuration, `openclaw doctor --fix` peut essayer de les résoudre.

    Plus sûr (sans bot tiers) :

    - Envoyez un DM à votre bot, puis exécutez `openclaw logs --follow` et lisez `from.id`.

    API officielle Bot :

    - Envoyez un DM à votre bot, puis appelez `https://api.telegram.org/bot<bot_token>/getUpdates` et lisez `message.from.id`.

    Tiers (moins privé) :

    - Envoyez un DM à `@userinfobot` ou `@getidsbot`.

    Voir [/channels/telegram](/fr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Plusieurs personnes peuvent-elles utiliser un seul numéro WhatsApp avec différentes instances OpenClaw ?">
    Oui, via le **routage multi-agent**. Liez le **DM** WhatsApp de chaque expéditeur (peer `kind: "direct"`, expéditeur E.164 comme `+15551234567`) à un `agentId` différent, afin que chaque personne ait son propre espace de travail et son propre magasin de sessions. Les réponses continuent d'être envoyées depuis le **même compte WhatsApp**, et le contrôle d'accès DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) est global par compte WhatsApp. Voir [Routage multi-agent](/fr/concepts/multi-agent) et [WhatsApp](/fr/channels/whatsapp).
  </Accordion>

  <Accordion title='Puis-je exécuter un agent "chat rapide" et un agent "Opus pour le code" ?'>
    Oui. Utilisez le routage multi-agent : donnez à chaque agent son propre modèle par défaut, puis liez les routes entrantes (compte fournisseur ou peers spécifiques) à chaque agent. Un exemple de configuration se trouve dans [Routage multi-agent](/fr/concepts/multi-agent). Voir aussi [Models](/fr/concepts/models) et [Configuration](/fr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew fonctionne-t-il sur Linux ?">
    Oui. Homebrew prend en charge Linux (Linuxbrew). Configuration rapide :

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Si vous exécutez OpenClaw via systemd, assurez-vous que le PATH du service inclut `/home/linuxbrew/.linuxbrew/bin` (ou votre préfixe brew) afin que les outils installés avec `brew` soient résolus dans les shells non login.
    Les builds récents préfixent aussi les répertoires bin utilisateur courants sur les services Linux systemd (par exemple `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) et respectent `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` et `FNM_DIR` lorsqu'ils sont définis.

  </Accordion>

  <Accordion title="Différence entre l'installation git hackable et l'installation npm">
    - **Installation hackable (git) :** checkout complet des sources, modifiable, idéal pour les contributeurs.
      Vous exécutez les builds localement et pouvez corriger le code/la documentation.
    - **Installation npm :** installation CLI globale, sans dépôt, idéale pour « simplement l'exécuter ».
      Les mises à jour proviennent des dist-tags npm.

    Docs : [Premiers pas](/fr/start/getting-started), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Puis-je passer plus tard entre les installations npm et git ?">
    Oui. Utilisez `openclaw update --channel ...` lorsque OpenClaw est déjà installé.
    Cela **ne supprime pas vos données** - cela change seulement l'installation du code OpenClaw.
    Votre état (`~/.openclaw`) et votre espace de travail (`~/.openclaw/workspace`) restent intacts.

    De npm vers git :

    ```bash
    openclaw update --channel dev
    ```

    De git vers npm :

    ```bash
    openclaw update --channel stable
    ```

    Ajoutez `--dry-run` pour prévisualiser d'abord le changement de mode prévu. Le programme de mise à jour exécute
    des suivis Doctor, actualise les sources de Plugin pour le canal cible, et
    redémarre la gateway sauf si vous transmettez `--no-restart`.

    L'installeur peut aussi forcer l'un ou l'autre mode :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Conseils de sauvegarde : voir [Stratégie de sauvegarde](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Dois-je exécuter la Gateway sur mon ordinateur portable ou sur un VPS ?">
    Réponse courte : **si vous voulez une fiabilité 24 h/24 et 7 j/7, utilisez un VPS**. Si vous voulez la
    friction la plus faible et que les mises en veille/redémarrages ne vous dérangent pas, exécutez-la localement.

    **Ordinateur portable (Gateway locale)**

    - **Avantages :** pas de coût serveur, accès direct aux fichiers locaux, fenêtre de navigateur visible.
    - **Inconvénients :** veille / pertes réseau = déconnexions, mises à jour / redémarrages de l'OS interrompent, doit rester éveillé.

    **VPS / cloud**

    - **Avantages :** toujours actif, réseau stable, pas de problème de veille d'ordinateur portable, plus facile à maintenir en fonctionnement.
    - **Inconvénients :** souvent headless (utiliser des captures d'écran), accès uniquement aux fichiers distants, vous devez passer par SSH pour les mises à jour.

    **Remarque spécifique à OpenClaw :** WhatsApp/Telegram/Slack/Mattermost/Discord fonctionnent tous très bien depuis un VPS. Le seul véritable compromis est le **navigateur headless** par rapport à une fenêtre visible. Voir [Browser](/fr/tools/browser).

    **Valeur par défaut recommandée :** VPS si vous avez déjà eu des déconnexions de gateway. Le mode local est excellent lorsque vous utilisez activement le Mac et souhaitez un accès aux fichiers locaux ou une automatisation UI avec un navigateur visible.

  </Accordion>

  <Accordion title="Dans quelle mesure est-il important d'exécuter OpenClaw sur une machine dédiée ?">
    Ce n'est pas obligatoire, mais **recommandé pour la fiabilité et l'isolation**.

    - **Hôte dédié (VPS/Mac mini/Pi) :** toujours actif, moins d'interruptions dues à la veille / aux redémarrages, permissions plus propres, plus facile à maintenir en fonctionnement.
    - **Ordinateur portable / de bureau partagé :** tout à fait acceptable pour les tests et l'utilisation active, mais attendez-vous à des pauses lorsque la machine se met en veille ou se met à jour.

    Si vous voulez le meilleur des deux mondes, gardez la Gateway sur un hôte dédié et associez votre ordinateur portable comme **nœud** pour les outils locaux d'écran / caméra / exec. Voir [Nodes](/fr/nodes).
    Pour des conseils de sécurité, lisez [Security](/fr/gateway/security).

  </Accordion>

  <Accordion title="Quelles sont les exigences minimales pour un VPS et quel OS recommandez-vous ?">
    OpenClaw est léger. Pour une Gateway basique + un canal de chat :

    - **Minimum absolu :** 1 vCPU, 1 Go de RAM, ~500 Mo de disque.
    - **Recommandé :** 1 à 2 vCPU, 2 Go de RAM ou plus pour avoir de la marge (journaux, médias, canaux multiples). Les outils Node et l'automatisation du navigateur peuvent être gourmands en ressources.

    OS : utilisez **Ubuntu LTS** (ou toute version moderne de Debian/Ubuntu). Le parcours d'installation Linux y est le mieux testé.

    Docs : [Linux](/fr/platforms/linux), [Hébergement VPS](/fr/vps).

  </Accordion>

  <Accordion title="Puis-je exécuter OpenClaw dans une VM et quelles sont les exigences ?">
    Oui. Traitez une VM comme un VPS : elle doit être toujours active, joignable, et disposer de suffisamment de
    RAM pour la Gateway et tous les canaux que vous activez.

    Recommandations de base :

    - **Minimum absolu :** 1 vCPU, 1 Go de RAM.
    - **Recommandé :** 2 Go de RAM ou plus si vous exécutez plusieurs canaux, de l'automatisation du navigateur ou des outils média.
    - **OS :** Ubuntu LTS ou une autre version moderne de Debian/Ubuntu.

    Si vous êtes sous Windows, **WSL2 est la configuration de type VM la plus simple** et offre la meilleure
    compatibilité des outils. Voir [Windows](/fr/platforms/windows), [Hébergement VPS](/fr/vps).
    Si vous exécutez macOS dans une VM, voir [VM macOS](/fr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Liens associés

- [FAQ](/fr/help/faq) — la FAQ principale (modèles, sessions, gateway, sécurité, plus)
- [Vue d'ensemble de l'installation](/fr/install)
- [Premiers pas](/fr/start/getting-started)
- [Résolution des problèmes](/fr/help/troubleshooting)
