---
read_when:
    - Nouvelle installation, configuration initiale bloquée ou erreurs au premier lancement
    - Choisir l’authentification et les abonnements aux fournisseurs
    - Impossible d’accéder à docs.openclaw.ai, impossible d’ouvrir le tableau de bord, installation bloquée
sidebarTitle: First-run FAQ
summary: 'FAQ : démarrage rapide et configuration au premier lancement — installation, intégration, authentification, abonnements, échecs initiaux'
title: 'FAQ : configuration au premier démarrage'
x-i18n:
    generated_at: "2026-05-07T13:19:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 347a09ebdbdf564389b406de3d5d47d097ead33d33eed4a68880bfbcaf82e048
    source_path: help/faq-first-run.md
    workflow: 16
---

  Démarrage rapide et questions-réponses de première exécution. Pour les opérations courantes, les modèles, l’authentification, les sessions
  et le dépannage, consultez la [FAQ](/fr/help/faq) principale.

  ## Démarrage rapide et configuration de première exécution

  <AccordionGroup>
  <Accordion title="Je suis bloqué, moyen le plus rapide de me débloquer">
    Utilisez un agent d’IA local qui peut **voir votre machine**. C’est beaucoup plus efficace que de demander
    dans Discord, car la plupart des cas « je suis bloqué » sont des **problèmes de configuration locale ou d’environnement**
    que les aides à distance ne peuvent pas inspecter.

    - **Claude Code** : [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex** : [https://openai.com/codex/](https://openai.com/codex/)

    Ces outils peuvent lire le dépôt, exécuter des commandes, inspecter les journaux et aider à corriger votre configuration
    au niveau de la machine (PATH, services, permissions, fichiers d’authentification). Donnez-leur le **checkout source complet** via
    l’installation modifiable (git) :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Cela installe OpenClaw **depuis un checkout git**, afin que l’agent puisse lire le code + la documentation et
    raisonner sur la version exacte que vous exécutez. Vous pouvez toujours revenir à la version stable plus tard
    en relançant l’installeur sans `--install-method git`.

    Astuce : demandez à l’agent de **planifier et superviser** le correctif (étape par étape), puis d’exécuter uniquement les
    commandes nécessaires. Cela garde les changements limités et plus faciles à auditer.

    Si vous découvrez un vrai bogue ou un correctif, veuillez ouvrir une issue GitHub ou envoyer une PR :
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Commencez par ces commandes (partagez les sorties lorsque vous demandez de l’aide) :

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ce qu’elles font :

    - `openclaw status` : instantané rapide de la santé du Gateway/de l’agent + configuration de base.
    - `openclaw models status` : vérifie l’authentification du fournisseur + la disponibilité des modèles.
    - `openclaw doctor` : valide et répare les problèmes courants de configuration/d’état.

    Autres vérifications CLI utiles : `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Boucle de débogage rapide : [Les 60 premières secondes si quelque chose est cassé](/fr/help/faq#first-60-seconds-if-something-is-broken).
    Documentation d’installation : [Installer](/fr/install), [Options de l’installeur](/fr/install/installer), [Mettre à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continue de sauter des exécutions. Que signifient les raisons de saut ?">
    Raisons courantes de saut de Heartbeat :

    - `quiet-hours` : en dehors de la fenêtre d’heures actives configurée
    - `empty-heartbeat-file` : `HEARTBEAT.md` existe mais ne contient qu’une structure vide ou uniquement des en-têtes
    - `no-tasks-due` : le mode tâches de `HEARTBEAT.md` est actif, mais aucun intervalle de tâche n’est encore arrivé à échéance
    - `alerts-disabled` : toute la visibilité Heartbeat est désactivée (`showOk`, `showAlerts` et `useIndicator` sont tous désactivés)

    En mode tâches, les horodatages d’échéance ne sont avancés qu’après la fin
    d’une véritable exécution Heartbeat. Les exécutions sautées ne marquent pas les tâches comme terminées.

    Documentation : [Heartbeat](/fr/gateway/heartbeat), [Automatisation et tâches](/fr/automation).

  </Accordion>

  <Accordion title="Méthode recommandée pour installer et configurer OpenClaw">
    Le dépôt recommande d’exécuter depuis les sources et d’utiliser l’onboarding :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    L’assistant peut aussi construire automatiquement les ressources de l’interface utilisateur. Après l’onboarding, vous exécutez généralement le Gateway sur le port **18789**.

    Depuis les sources (contributeurs/développement) :

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Si vous n’avez pas encore d’installation globale, exécutez-le via `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Comment ouvrir le tableau de bord après l’onboarding ?">
    L’assistant ouvre votre navigateur avec une URL de tableau de bord propre (sans jeton) juste après l’onboarding et affiche aussi le lien dans le résumé. Gardez cet onglet ouvert ; s’il ne s’est pas lancé, copiez/collez l’URL affichée sur la même machine.
  </Accordion>

  <Accordion title="Comment authentifier le tableau de bord sur localhost ou à distance ?">
    **Localhost (même machine) :**

    - Ouvrez `http://127.0.0.1:18789/`.
    - S’il demande une authentification par secret partagé, collez le jeton ou le mot de passe configuré dans les paramètres de Control UI.
    - Source du jeton : `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
    - Source du mot de passe : `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Si aucun secret partagé n’est encore configuré, générez un jeton avec `openclaw doctor --generate-gateway-token`.

    **Pas sur localhost :**

    - **Tailscale Serve** (recommandé) : gardez la liaison sur loopback, exécutez `openclaw gateway --tailscale serve`, ouvrez `https://<magicdns>/`. Si `gateway.auth.allowTailscale` vaut `true`, les en-têtes d’identité satisfont l’authentification Control UI/WebSocket (pas de secret partagé à coller, suppose un hôte Gateway fiable) ; les API HTTP exigent toujours une authentification par secret partagé, sauf si vous utilisez délibérément l’entrée privée `none` ou l’authentification HTTP par proxy fiable.
      Les mauvaises tentatives d’authentification Serve simultanées depuis le même client sont sérialisées avant que le limiteur d’échecs d’authentification les enregistre, de sorte que la deuxième mauvaise tentative peut déjà afficher `retry later`.
    - **Liaison Tailnet** : exécutez `openclaw gateway --bind tailnet --token "<token>"` (ou configurez l’authentification par mot de passe), ouvrez `http://<tailscale-ip>:18789/`, puis collez le secret partagé correspondant dans les paramètres du tableau de bord.
    - **Proxy inverse sensible à l’identité** : gardez le Gateway derrière un proxy fiable, configurez `gateway.auth.mode: "trusted-proxy"`, puis ouvrez l’URL du proxy. Les proxys loopback sur le même hôte exigent `gateway.auth.trustedProxy.allowLoopback = true` explicitement.
    - **Tunnel SSH** : `ssh -N -L 18789:127.0.0.1:18789 user@host` puis ouvrez `http://127.0.0.1:18789/`. L’authentification par secret partagé s’applique toujours via le tunnel ; collez le jeton ou le mot de passe configuré si vous y êtes invité.

    Consultez [Tableau de bord](/fr/web/dashboard) et [Surfaces Web](/fr/web) pour les modes de liaison et les détails d’authentification.

  </Accordion>

  <Accordion title="Pourquoi y a-t-il deux configurations d’approbation exec pour les approbations par chat ?">
    Elles contrôlent des couches différentes :

    - `approvals.exec` : transfère les demandes d’approbation vers les destinations de chat
    - `channels.<channel>.execApprovals` : fait agir ce canal comme client d’approbation natif pour les approbations exec

    La politique exec de l’hôte reste la véritable barrière d’approbation. La configuration du chat contrôle uniquement où les demandes
    d’approbation apparaissent et comment les personnes peuvent y répondre.

    Dans la plupart des configurations, vous n’avez **pas** besoin des deux :

    - Si le chat prend déjà en charge les commandes et les réponses, `/approve` dans le même chat fonctionne via le chemin partagé.
    - Si un canal natif pris en charge peut déduire les approbateurs en toute sécurité, OpenClaw active désormais automatiquement les approbations natives d’abord par DM lorsque `channels.<channel>.execApprovals.enabled` est non défini ou vaut `"auto"`.
    - Lorsque des cartes/boutons d’approbation natifs sont disponibles, cette interface native est le chemin principal ; l’agent ne doit inclure une commande manuelle `/approve` que si le résultat de l’outil indique que les approbations par chat ne sont pas disponibles ou que l’approbation manuelle est le seul chemin.
    - Utilisez `approvals.exec` uniquement lorsque les demandes doivent aussi être transférées vers d’autres chats ou salons d’exploitation explicites.
    - Utilisez `channels.<channel>.execApprovals.target: "channel"` ou `"both"` uniquement lorsque vous voulez explicitement que les demandes d’approbation soient publiées dans le salon/sujet d’origine.
    - Les approbations Plugin sont encore distinctes : elles utilisent par défaut `/approve` dans le même chat, le transfert optionnel `approvals.plugin`, et seuls certains canaux natifs gardent en plus la gestion native des approbations Plugin.

    Version courte : le transfert sert au routage, la configuration du client natif sert à une UX plus riche propre au canal.
    Consultez [Approbations exec](/fr/tools/exec-approvals).

  </Accordion>

  <Accordion title="De quel runtime ai-je besoin ?">
    Node **>= 22** est requis. `pnpm` est recommandé. Bun n’est **pas recommandé** pour le Gateway.
  </Accordion>

  <Accordion title="Est-ce que cela fonctionne sur Raspberry Pi ?">
    Oui. Le Gateway est léger : la documentation indique **512 Mo à 1 Go de RAM**, **1 cœur** et environ **500 Mo**
    de disque comme suffisants pour un usage personnel, et note qu’un **Raspberry Pi 4 peut l’exécuter**.

    Si vous voulez plus de marge (journaux, médias, autres services), **2 Go sont recommandés**, mais ce n’est
    pas un minimum strict.

    Astuce : un petit Pi/VPS peut héberger le Gateway, et vous pouvez associer des **nœuds** sur votre ordinateur portable/téléphone pour
    l’écran/la caméra/le canvas locaux ou l’exécution de commandes. Consultez [Nœuds](/fr/nodes).

  </Accordion>

  <Accordion title="Des conseils pour les installations sur Raspberry Pi ?">
    Version courte : cela fonctionne, mais attendez-vous à quelques aspérités.

    - Utilisez un OS **64 bits** et gardez Node >= 22.
    - Préférez l’**installation modifiable (git)** afin de voir les journaux et de mettre à jour rapidement.
    - Commencez sans canaux/Skills, puis ajoutez-les un par un.
    - Si vous rencontrez des problèmes binaires étranges, c’est généralement un problème de **compatibilité ARM**.

    Documentation : [Linux](/fr/platforms/linux), [Installer](/fr/install).

  </Accordion>

  <Accordion title="C’est bloqué sur wake up my friend / l’onboarding n’éclot pas. Que faire ?">
    Cet écran dépend du fait que le Gateway soit joignable et authentifié. Le TUI envoie aussi
    « Wake up, my friend! » automatiquement lors de la première éclosion. Si vous voyez cette ligne avec **aucune réponse**
    et que les jetons restent à 0, l’agent ne s’est jamais exécuté.

    1. Redémarrez le Gateway :

    ```bash
    openclaw gateway restart
    ```

    2. Vérifiez l’état + l’authentification :

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Si cela reste bloqué, exécutez :

    ```bash
    openclaw doctor
    ```

    Si le Gateway est distant, assurez-vous que le tunnel/la connexion Tailscale est actif et que l’interface utilisateur
    pointe vers le bon Gateway. Consultez [Accès distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Puis-je migrer ma configuration vers une nouvelle machine (Mac mini) sans refaire l’onboarding ?">
    Oui. Copiez le **répertoire d’état** et l’**espace de travail**, puis exécutez Doctor une fois. Cela
    garde votre bot « exactement le même » (mémoire, historique de session, authentification et état des canaux)
    tant que vous copiez **les deux** emplacements :

    1. Installez OpenClaw sur la nouvelle machine.
    2. Copiez `$OPENCLAW_STATE_DIR` (par défaut : `~/.openclaw`) depuis l’ancienne machine.
    3. Copiez votre espace de travail (par défaut : `~/.openclaw/workspace`).
    4. Exécutez `openclaw doctor` et redémarrez le service Gateway.

    Cela préserve la configuration, les profils d’authentification, les identifiants WhatsApp, les sessions et la mémoire. Si vous êtes en
    mode distant, souvenez-vous que l’hôte du gateway possède le magasin de sessions et l’espace de travail.

    **Important :** si vous vous contentez de committer/pousser votre espace de travail vers GitHub, vous sauvegardez
    la **mémoire + les fichiers d’amorçage**, mais **pas** l’historique de session ni l’authentification. Ceux-ci vivent
    sous `~/.openclaw/` (par exemple `~/.openclaw/agents/<agentId>/sessions/`).

    Connexe : [Migrer](/fr/install/migrating), [Où les choses vivent sur le disque](/fr/help/faq#where-things-live-on-disk),
    [Espace de travail de l’agent](/fr/concepts/agent-workspace), [Doctor](/fr/gateway/doctor),
    [Mode distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Où voir les nouveautés de la dernière version ?">
    Consultez le changelog GitHub :
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Les entrées les plus récentes sont en haut. Si la section supérieure est marquée **Unreleased**, la section datée
    suivante est la dernière version livrée. Les entrées sont regroupées par **Points forts**, **Changements** et
    **Correctifs** (plus des sections documentation/autres si nécessaire).

  </Accordion>

  <Accordion title="Impossible d’accéder à docs.openclaw.ai (erreur SSL)">
    Certaines connexions Comcast/Xfinity bloquent incorrectement `docs.openclaw.ai` via Xfinity
    Advanced Security. Désactivez-le ou ajoutez `docs.openclaw.ai` à la liste d’autorisation, puis réessayez.
    Aidez-nous à le débloquer en le signalant ici : [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Si vous ne parvenez toujours pas à accéder au site, les docs sont dupliquées sur GitHub :
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Différence entre stable et bêta">
    **Stable** et **bêta** sont des **dist-tags npm**, pas des lignes de code distinctes :

    - `latest` = stable
    - `beta` = version anticipée pour les tests

    En général, une version stable arrive d’abord sur **beta**, puis une étape de
    promotion explicite déplace cette même version vers `latest`. Les mainteneurs peuvent aussi
    publier directement vers `latest` si nécessaire. C’est pourquoi bêta et stable peuvent
    pointer vers la **même version** après promotion.

    Voir ce qui a changé :
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Pour les commandes d’installation en une ligne et la différence entre bêta et dev, consultez l’accordéon ci-dessous.

  </Accordion>

  <Accordion title="Comment installer la version bêta et quelle est la différence entre bêta et dev ?">
    **Bêta** est le dist-tag npm `beta` (peut correspondre à `latest` après promotion).
    **Dev** est la tête mobile de `main` (git) ; lorsqu’elle est publiée, elle utilise le dist-tag npm `dev`.

    Commandes en une ligne (macOS/Linux) :

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Programme d’installation Windows (PowerShell) :
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Plus de détails : [Canaux de développement](/fr/install/development-channels) et [Options du programme d’installation](/fr/install/installer).

  </Accordion>

  <Accordion title="Comment essayer les tout derniers éléments ?">
    Deux options :

    1. **Canal dev (extraction git) :**

    ```bash
    openclaw update --channel dev
    ```

    Cela bascule vers la branche `main` et met à jour depuis les sources.

    2. **Installation modifiable (depuis le site d’installation) :**

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
    [Installation](/fr/install).

  </Accordion>

  <Accordion title="Combien de temps prennent généralement l’installation et l’onboarding ?">
    Guide approximatif :

    - **Installation :** 2 à 5 minutes
    - **Onboarding :** 5 à 15 minutes selon le nombre de canaux/modèles que vous configurez

    Si cela bloque, utilisez [Programme d’installation bloqué](#quick-start-and-first-run-setup)
    et la boucle de débogage rapide dans [Je suis bloqué](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Programme d’installation bloqué ? Comment obtenir plus de retour ?">
    Relancez le programme d’installation avec une **sortie détaillée** :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Installation bêta avec sortie détaillée :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Pour une installation modifiable (git) :

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

    Plus d’options : [Options du programme d’installation](/fr/install/installer).

  </Accordion>

  <Accordion title="L’installation Windows indique git introuvable ou openclaw non reconnu">
    Deux problèmes Windows courants :

    **1) Erreur npm spawn git / git introuvable**

    - Installez **Git for Windows** et assurez-vous que `git` est dans votre PATH.
    - Fermez puis rouvrez PowerShell, puis relancez le programme d’installation.

    **2) openclaw n’est pas reconnu après l’installation**

    - Le dossier bin global de npm n’est pas dans PATH.
    - Vérifiez le chemin :

      ```powershell
      npm config get prefix
      ```

    - Ajoutez ce répertoire à votre PATH utilisateur (aucun suffixe `\bin` n’est nécessaire sous Windows ; sur la plupart des systèmes, il s’agit de `%AppData%\npm`).
    - Fermez puis rouvrez PowerShell après avoir mis à jour PATH.

    Si vous voulez la configuration Windows la plus fluide, utilisez **WSL2** plutôt que Windows natif.
    Docs : [Windows](/fr/platforms/windows).

  </Accordion>

  <Accordion title="La sortie exec Windows affiche du texte chinois illisible : que dois-je faire ?">
    Il s’agit généralement d’une incompatibilité de page de codes de console dans les shells Windows natifs.

    Symptômes :

    - la sortie `system.run`/`exec` affiche le chinois sous forme de mojibake
    - La même commande s’affiche correctement dans un autre profil de terminal

    Solution de contournement rapide dans PowerShell :

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Puis redémarrez le Gateway et réessayez votre commande :

    ```powershell
    openclaw gateway restart
    ```

    Si vous reproduisez toujours cela sur la dernière version d’OpenClaw, suivez/signalez le problème dans :

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Les docs n’ont pas répondu à ma question : comment obtenir une meilleure réponse ?">
    Utilisez l’**installation modifiable (git)** afin d’avoir les sources et les docs complètes en local, puis demandez
    à votre bot (ou Claude/Codex) _depuis ce dossier_ pour qu’il puisse lire le dépôt et répondre précisément.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Plus de détails : [Installation](/fr/install) et [Options du programme d’installation](/fr/install/installer).

  </Accordion>

  <Accordion title="Comment installer OpenClaw sur Linux ?">
    Réponse courte : suivez le guide Linux, puis lancez l’onboarding.

    - Parcours rapide Linux + installation du service : [Linux](/fr/platforms/linux).
    - Guide complet : [Bien démarrer](/fr/start/getting-started).
    - Programme d’installation + mises à jour : [Installation et mises à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Comment installer OpenClaw sur un VPS ?">
    N’importe quel VPS Linux convient. Installez sur le serveur, puis utilisez SSH/Tailscale pour accéder au Gateway.

    Guides : [exe.dev](/fr/install/exe-dev), [Hetzner](/fr/install/hetzner), [Fly.io](/fr/install/fly).
    Accès distant : [Gateway distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Où sont les guides d’installation cloud/VPS ?">
    Nous maintenons un **hub d’hébergement** avec les fournisseurs courants. Choisissez-en un et suivez le guide :

    - [Hébergement VPS](/fr/vps) (tous les fournisseurs au même endroit)
    - [Fly.io](/fr/install/fly)
    - [Hetzner](/fr/install/hetzner)
    - [exe.dev](/fr/install/exe-dev)

    Fonctionnement dans le cloud : le **Gateway s’exécute sur le serveur**, et vous y accédez
    depuis votre ordinateur portable/téléphone via la Control UI (ou Tailscale/SSH). Votre état + espace de travail
    résident sur le serveur ; considérez donc l’hôte comme la source de vérité et sauvegardez-le.

    Vous pouvez associer des **nodes** (Mac/iOS/Android/headless) à ce Gateway cloud pour accéder
    à l’écran/la caméra/le canevas local ou exécuter des commandes sur votre ordinateur portable tout en gardant le
    Gateway dans le cloud.

    Hub : [Plateformes](/fr/platforms). Accès distant : [Gateway distant](/fr/gateway/remote).
    Nodes : [Nodes](/fr/nodes), [CLI Nodes](/fr/cli/nodes).

  </Accordion>

  <Accordion title="Puis-je demander à OpenClaw de se mettre à jour lui-même ?">
    Réponse courte : **possible, déconseillé**. Le flux de mise à jour peut redémarrer le
    Gateway (ce qui interrompt la session active), peut nécessiter une extraction git propre et
    peut demander une confirmation. Plus sûr : exécutez les mises à jour depuis un shell en tant qu’opérateur.

    Utilisez la CLI :

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Si vous devez automatiser depuis un agent :

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Docs : [Mise à jour](/fr/cli/update), [Mises à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Que fait réellement l’onboarding ?">
    `openclaw onboard` est le parcours de configuration recommandé. En **mode local**, il vous guide dans :

    - **Configuration du modèle/de l’authentification** (OAuth fournisseur, clés API, setup-token Anthropic, plus options de modèles locaux comme LM Studio)
    - Emplacement de l’**espace de travail** + fichiers d’amorçage
    - **Paramètres du Gateway** (bind/port/auth/tailscale)
    - **Canaux** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus des plugins de canal inclus comme QQ Bot)
    - **Installation du daemon** (LaunchAgent sur macOS ; unité utilisateur systemd sur Linux/WSL2)
    - **Contrôles de santé** et sélection des **Skills**

    Il vous avertit aussi si votre modèle configuré est inconnu ou n’a pas d’authentification.

  </Accordion>

  <Accordion title="Ai-je besoin d’un abonnement Claude ou OpenAI pour exécuter ceci ?">
    Non. Vous pouvez exécuter OpenClaw avec des **clés API** (Anthropic/OpenAI/autres) ou avec
    des **modèles uniquement locaux** afin que vos données restent sur votre appareil. Les abonnements (Claude
    Pro/Max ou OpenAI Codex) sont des moyens facultatifs d’authentifier ces fournisseurs.

    Pour Anthropic dans OpenClaw, la séparation pratique est :

    - **Clé API Anthropic** : facturation normale de l’API Anthropic
    - **Claude CLI / authentification par abonnement Claude dans OpenClaw** : le personnel Anthropic
      nous a indiqué que cet usage est de nouveau autorisé, et OpenClaw considère l’utilisation de `claude -p`
      comme approuvée pour cette intégration sauf si Anthropic publie une nouvelle
      politique

    Pour les hôtes de gateway longue durée, les clés API Anthropic restent la configuration la plus
    prévisible. OpenAI Codex OAuth est explicitement pris en charge pour les outils
    externes comme OpenClaw.

    OpenClaw prend aussi en charge d’autres options hébergées de type abonnement, notamment
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** et
    **Z.AI / GLM Coding Plan**.

    Docs : [Anthropic](/fr/providers/anthropic), [OpenAI](/fr/providers/openai),
    [Qwen Cloud](/fr/providers/qwen),
    [MiniMax](/fr/providers/minimax), [Modèles GLM](/fr/providers/glm),
    [Modèles locaux](/fr/gateway/local-models), [Modèles](/fr/concepts/models).

  </Accordion>

  <Accordion title="Puis-je utiliser l’abonnement Claude Max sans clé API ?">
    Oui.

    Le personnel Anthropic nous a indiqué que l’utilisation de Claude CLI dans le style OpenClaw est de nouveau autorisée, donc
    OpenClaw considère l’authentification par abonnement Claude et l’utilisation de `claude -p` comme approuvées
    pour cette intégration sauf si Anthropic publie une nouvelle politique. Si vous souhaitez
    la configuration côté serveur la plus prévisible, utilisez plutôt une clé API Anthropic.

  </Accordion>

  <Accordion title="Prenez-vous en charge l’authentification par abonnement Claude (Claude Pro ou Max) ?">
    Oui.

    Le personnel Anthropic nous a indiqué que cet usage est de nouveau autorisé, donc OpenClaw considère
    la réutilisation de Claude CLI et l’utilisation de `claude -p` comme approuvées pour cette intégration
    sauf si Anthropic publie une nouvelle politique.

    Le setup-token Anthropic reste disponible comme chemin de jeton OpenClaw pris en charge, mais OpenClaw privilégie désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.
    Pour les charges de travail de production ou multi-utilisateurs, l’authentification par clé API Anthropic reste le
    choix le plus sûr et le plus prévisible. Si vous voulez d’autres options hébergées
    de type abonnement dans OpenClaw, consultez [OpenAI](/fr/providers/openai), [Qwen / Model
    Cloud](/fr/providers/qwen), [MiniMax](/fr/providers/minimax) et [Modèles
    GLM](/fr/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Pourquoi vois-je HTTP 429 rate_limit_error d’Anthropic ?">
    Cela signifie que votre **quota/limite de débit Anthropic** est épuisé pour la fenêtre actuelle. Si vous
    utilisez **Claude CLI**, attendez que la fenêtre se réinitialise ou mettez votre forfait à niveau. Si vous
    utilisez une **clé API Anthropic**, consultez la console Anthropic
    pour l’utilisation/la facturation et augmentez les limites si nécessaire.

    Si le message est précisément :
    `Extra usage is required for long context requests`, la requête tente d'utiliser
    la bêta de contexte 1M d'Anthropic (`context1m: true`). Cela ne fonctionne que lorsque vos
    identifiants sont éligibles à la facturation de contexte long (facturation par clé API ou le
    parcours de connexion Claude d'OpenClaw avec Extra Usage activé).

    Astuce : définissez un **modèle de repli** afin qu'OpenClaw puisse continuer à répondre pendant qu'un fournisseur est limité par son quota.
    Consultez [Modèles](/fr/cli/models), [OAuth](/fr/concepts/oauth), et
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/fr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock est-il pris en charge ?">
    Oui. OpenClaw inclut un fournisseur **Amazon Bedrock (Converse)** intégré. Lorsque des marqueurs d'environnement AWS sont présents, OpenClaw peut découvrir automatiquement le catalogue Bedrock streaming/texte et le fusionner comme fournisseur implicite `amazon-bedrock` ; sinon, vous pouvez activer explicitement `plugins.entries.amazon-bedrock.config.discovery.enabled` ou ajouter une entrée de fournisseur manuelle. Consultez [Amazon Bedrock](/fr/providers/bedrock) et [Fournisseurs de modèles](/fr/providers/models). Si vous préférez un flux de clé géré, un proxy compatible OpenAI placé devant Bedrock reste une option valide.
  </Accordion>

  <Accordion title="Comment fonctionne l'authentification Codex ?">
    OpenClaw prend en charge **OpenAI Code (Codex)** via OAuth (connexion ChatGPT). Utilisez
    `openai/gpt-5.5` avec `agentRuntime.id: "codex"` pour la configuration courante :
    authentification par abonnement ChatGPT/Codex plus exécution native du serveur d'application Codex. Utilisez
    `openai-codex/gpt-5.5` uniquement lorsque vous voulez utiliser l'OAuth Codex via le runtime
    Codex par défaut. L'accès direct par clé API OpenAI reste disponible pour les surfaces
    OpenAI API non-agent et pour les modèles d'agent via un profil de clé API
    `openai-codex` ordonné.
    Consultez [Fournisseurs de modèles](/fr/concepts/model-providers) et [Onboarding (CLI)](/fr/start/wizard).
  </Accordion>

  <Accordion title="Pourquoi OpenClaw mentionne-t-il encore openai-codex ?">
    `openai-codex` est l'identifiant du fournisseur et du profil d'authentification pour l'OAuth ChatGPT/Codex.
    Les anciennes configurations l'utilisaient aussi comme préfixe de modèle :

    - `openai/gpt-5.5` = authentification par abonnement ChatGPT/Codex avec runtime Codex natif pour les tours d'agent
    - `openai-codex/gpt-5.5` = route de modèle héritée réparée par `openclaw doctor --fix`
    - `openai/gpt-5.5` plus un profil de clé API `openai-codex` ordonné = authentification par clé API pour un modèle d'agent OpenAI
    - `openai-codex:...` = identifiant de profil d'authentification, pas une référence de modèle

    Si vous voulez le parcours direct de facturation/limites d'OpenAI Platform, définissez
    `OPENAI_API_KEY`. Si vous voulez l'authentification par abonnement ChatGPT/Codex, connectez-vous avec
    `openclaw models auth login --provider openai-codex`. Conservez la référence de modèle sous la forme
    `openai/gpt-5.5` ; les références de modèle `openai-codex/*` sont de la configuration héritée que
    `openclaw doctor --fix` réécrit.

  </Accordion>

  <Accordion title="Pourquoi les limites OAuth de Codex peuvent-elles différer de celles du web ChatGPT ?">
    L'OAuth Codex utilise des fenêtres de quota gérées par OpenAI et dépendantes du forfait. En pratique,
    ces limites peuvent différer de l'expérience du site web/de l'application ChatGPT, même lorsque
    les deux sont liés au même compte.

    OpenClaw peut afficher les fenêtres d'utilisation/quota du fournisseur actuellement visibles dans
    `openclaw models status`, mais il n'invente ni ne normalise les droits ChatGPT-web
    en accès API direct. Si vous voulez le parcours direct de facturation/limites d'OpenAI Platform,
    utilisez `openai/*` avec une clé API.

  </Accordion>

  <Accordion title="Prenez-vous en charge l'authentification par abonnement OpenAI (OAuth Codex) ?">
    Oui. OpenClaw prend entièrement en charge **l'OAuth d'abonnement OpenAI Code (Codex)**.
    OpenAI autorise explicitement l'utilisation de l'OAuth d'abonnement dans des outils/workflows externes
    comme OpenClaw. L'onboarding peut exécuter le flux OAuth pour vous.

    Consultez [OAuth](/fr/concepts/oauth), [Fournisseurs de modèles](/fr/concepts/model-providers), et [Onboarding (CLI)](/fr/start/wizard).

  </Accordion>

  <Accordion title="Comment configurer l'OAuth de Gemini CLI ?">
    Gemini CLI utilise un **flux d'authentification de plugin**, pas un identifiant client ni un secret dans `openclaw.json`.

    Étapes :

    1. Installez Gemini CLI localement afin que `gemini` soit dans `PATH`
       - Homebrew : `brew install gemini-cli`
       - npm : `npm install -g @google/gemini-cli`
    2. Activez le plugin : `openclaw plugins enable google`
    3. Connectez-vous : `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modèle par défaut après connexion : `google-gemini-cli/gemini-3-flash-preview`
    5. Si les requêtes échouent, définissez `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` sur l'hôte du gateway

    Cela stocke les jetons OAuth dans les profils d'authentification sur l'hôte du gateway. Détails : [Fournisseurs de modèles](/fr/concepts/model-providers).

  </Accordion>

  <Accordion title="Un modèle local convient-il pour les discussions informelles ?">
    Généralement non. OpenClaw a besoin d'un grand contexte et d'une sécurité robuste ; les petites cartes tronquent et fuient. Si vous devez le faire, exécutez localement la version de modèle la **plus grande** possible (LM Studio) et consultez [/gateway/local-models](/fr/gateway/local-models). Les modèles plus petits/quantifiés augmentent le risque d'injection de prompt - consultez [Sécurité](/fr/gateway/security).
  </Accordion>

  <Accordion title="Comment garder le trafic des modèles hébergés dans une région spécifique ?">
    Choisissez des endpoints verrouillés par région. OpenRouter expose des options hébergées aux États-Unis pour MiniMax, Kimi et GLM ; choisissez la variante hébergée aux États-Unis pour conserver les données dans la région. Vous pouvez toujours lister Anthropic/OpenAI à côté de celles-ci en utilisant `models.mode: "merge"` afin que les replis restent disponibles tout en respectant le fournisseur régional que vous sélectionnez.
  </Accordion>

  <Accordion title="Dois-je acheter un Mac Mini pour l'installer ?">
    Non. OpenClaw fonctionne sur macOS ou Linux (Windows via WSL2). Un Mac mini est optionnel - certaines personnes
    en achètent un comme hôte toujours actif, mais un petit VPS, un serveur domestique ou une machine de classe Raspberry Pi fonctionne aussi.

    Vous n'avez besoin d'un Mac **que pour les outils réservés à macOS**. Pour iMessage, utilisez [BlueBubbles](/fr/channels/bluebubbles) (recommandé) - le serveur BlueBubbles fonctionne sur n'importe quel Mac, et le Gateway peut fonctionner sur Linux ou ailleurs. Si vous voulez d'autres outils réservés à macOS, exécutez le Gateway sur un Mac ou associez un nœud macOS.

    Documentation : [BlueBubbles](/fr/channels/bluebubbles), [Nœuds](/fr/nodes), [Mode distant Mac](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Ai-je besoin d'un Mac mini pour la prise en charge d'iMessage ?">
    Vous avez besoin **d'un appareil macOS quelconque** connecté à Messages. Il ne doit **pas** nécessairement s'agir d'un Mac mini -
    n'importe quel Mac fonctionne. **Utilisez [BlueBubbles](/fr/channels/bluebubbles)** (recommandé) pour iMessage - le serveur BlueBubbles fonctionne sur macOS, tandis que le Gateway peut fonctionner sur Linux ou ailleurs.

    Configurations courantes :

    - Exécutez le Gateway sur Linux/VPS, et exécutez le serveur BlueBubbles sur n'importe quel Mac connecté à Messages.
    - Exécutez tout sur le Mac si vous voulez la configuration la plus simple sur une seule machine.

    Documentation : [BlueBubbles](/fr/channels/bluebubbles), [Nœuds](/fr/nodes),
    [Mode distant Mac](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Si j'achète un Mac mini pour exécuter OpenClaw, puis-je le connecter à mon MacBook Pro ?">
    Oui. Le **Mac mini peut exécuter le Gateway**, et votre MacBook Pro peut se connecter comme
    **nœud** (appareil compagnon). Les nœuds n'exécutent pas le Gateway - ils fournissent des capacités
    supplémentaires comme l'écran/la caméra/le canevas et `system.run` sur cet appareil.

    Schéma courant :

    - Gateway sur le Mac mini (toujours actif).
    - Le MacBook Pro exécute l'application macOS ou un hôte de nœud et s'associe au Gateway.
    - Utilisez `openclaw nodes status` / `openclaw nodes list` pour le voir.

    Documentation : [Nœuds](/fr/nodes), [CLI des nœuds](/fr/cli/nodes).

  </Accordion>

  <Accordion title="Puis-je utiliser Bun ?">
    Bun n'est **pas recommandé**. Nous observons des bugs de runtime, en particulier avec WhatsApp et Telegram.
    Utilisez **Node** pour des gateways stables.

    Si vous voulez quand même expérimenter avec Bun, faites-le sur un gateway hors production
    sans WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram : que faut-il mettre dans allowFrom ?">
    `channels.telegram.allowFrom` est **l'identifiant utilisateur Telegram de l'expéditeur humain** (numérique). Ce n'est pas le nom d'utilisateur du bot.

    La configuration demande uniquement des identifiants utilisateur numériques. Si vous avez déjà des entrées héritées `@username` dans la configuration, `openclaw doctor --fix` peut essayer de les résoudre.

    Plus sûr (sans bot tiers) :

    - Envoyez un DM à votre bot, puis exécutez `openclaw logs --follow` et lisez `from.id`.

    Bot API officielle :

    - Envoyez un DM à votre bot, puis appelez `https://api.telegram.org/bot<bot_token>/getUpdates` et lisez `message.from.id`.

    Tiers (moins privé) :

    - Envoyez un DM à `@userinfobot` ou `@getidsbot`.

    Consultez [/channels/telegram](/fr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Plusieurs personnes peuvent-elles utiliser un seul numéro WhatsApp avec différentes instances OpenClaw ?">
    Oui, via le **routage multi-agent**. Liez le **DM** WhatsApp de chaque expéditeur (pair `kind: "direct"`, expéditeur E.164 comme `+15551234567`) à un `agentId` différent, afin que chaque personne obtienne son propre espace de travail et magasin de session. Les réponses proviennent toujours du **même compte WhatsApp**, et le contrôle d'accès DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) est global par compte WhatsApp. Consultez [Routage multi-agent](/fr/concepts/multi-agent) et [WhatsApp](/fr/channels/whatsapp).
  </Accordion>

  <Accordion title='Puis-je exécuter un agent de "discussion rapide" et un agent "Opus pour le code" ?'>
    Oui. Utilisez le routage multi-agent : donnez à chaque agent son propre modèle par défaut, puis liez les routes entrantes (compte fournisseur ou pairs spécifiques) à chaque agent. Un exemple de configuration se trouve dans [Routage multi-agent](/fr/concepts/multi-agent). Consultez aussi [Modèles](/fr/concepts/models) et [Configuration](/fr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew fonctionne-t-il sur Linux ?">
    Oui. Homebrew prend en charge Linux (Linuxbrew). Configuration rapide :

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Si vous exécutez OpenClaw via systemd, assurez-vous que le PATH du service inclut `/home/linuxbrew/.linuxbrew/bin` (ou votre préfixe brew) afin que les outils installés avec `brew` soient résolus dans les shells non connectés.
    Les versions récentes ajoutent aussi en tête les répertoires bin utilisateur courants sur les services systemd Linux (par exemple `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) et respectent `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, et `FNM_DIR` lorsqu'ils sont définis.

  </Accordion>

  <Accordion title="Différence entre l'installation git modifiable et l'installation npm">
    - **Installation modifiable (git) :** checkout complet du code source, modifiable, idéal pour les contributeurs.
      Vous exécutez les builds localement et pouvez corriger le code/la documentation.
    - **Installation npm :** installation CLI globale, sans dépôt, idéale pour "simplement l'exécuter".
      Les mises à jour proviennent des dist-tags npm.

    Documentation : [Bien démarrer](/fr/start/getting-started), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Puis-je basculer plus tard entre les installations npm et git ?">
    Oui. Utilisez `openclaw update --channel ...` lorsqu'OpenClaw est déjà installé.
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
    les suivis Doctor, actualise les sources des plugins pour le canal cible, et
    redémarre le gateway sauf si vous passez `--no-restart`.

    Le programme d'installation peut aussi forcer l'un ou l'autre mode :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Conseils de sauvegarde : consultez [Stratégie de sauvegarde](/fr/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Dois-je exécuter le Gateway sur mon ordinateur portable ou sur un VPS ?">
    Réponse courte : **si vous voulez une fiabilité 24/7, utilisez un VPS**. Si vous voulez le
    moins de friction possible et que la veille/les redémarrages ne vous dérangent pas, exécutez-le localement.

    **Ordinateur portable (Gateway local)**

    - **Avantages :** aucun coût de serveur, accès direct aux fichiers locaux, fenêtre de navigateur en direct.
    - **Inconvénients :** mises en veille/coupures réseau = déconnexions, les mises à jour/redémarrages du système interrompent l’exécution, doit rester éveillé.

    **VPS / cloud**

    - **Avantages :** toujours actif, réseau stable, aucun problème de mise en veille de l’ordinateur portable, plus facile à maintenir en fonctionnement.
    - **Inconvénients :** souvent exécuté sans interface graphique (utilisez des captures d’écran), accès aux fichiers à distance uniquement, vous devez utiliser SSH pour les mises à jour.

    **Remarque spécifique à OpenClaw :** WhatsApp/Telegram/Slack/Mattermost/Discord fonctionnent tous très bien depuis un VPS. Le seul vrai compromis est **navigateur sans interface graphique** vs une fenêtre visible. Voir [Navigateur](/fr/tools/browser).

    **Valeur par défaut recommandée :** VPS si vous avez déjà eu des déconnexions du Gateway. Le local est idéal lorsque vous utilisez activement le Mac et voulez accéder aux fichiers locaux ou automatiser l’interface utilisateur avec un navigateur visible.

  </Accordion>

  <Accordion title="Quelle est l’importance d’exécuter OpenClaw sur une machine dédiée ?">
    Ce n’est pas obligatoire, mais **recommandé pour la fiabilité et l’isolation**.

    - **Hôte dédié (VPS/Mac mini/Pi) :** toujours actif, moins d’interruptions dues à la mise en veille ou aux redémarrages, permissions plus propres, plus facile à maintenir en fonctionnement.
    - **Ordinateur portable/de bureau partagé :** tout à fait adapté aux tests et à une utilisation active, mais attendez-vous à des pauses lorsque la machine se met en veille ou se met à jour.

    Si vous voulez le meilleur des deux mondes, gardez le Gateway sur un hôte dédié et associez votre ordinateur portable comme **Node** pour les outils d’écran/caméra/exec locaux. Voir [Nodes](/fr/nodes).
    Pour les conseils de sécurité, lisez [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Quelles sont les exigences minimales pour un VPS et le système d’exploitation recommandé ?">
    OpenClaw est léger. Pour un Gateway de base + un canal de discussion :

    - **Minimum absolu :** 1 vCPU, 1 Go de RAM, ~500 Mo de disque.
    - **Recommandé :** 1-2 vCPU, 2 Go de RAM ou plus pour disposer d’une marge (journaux, médias, plusieurs canaux). Les outils Node et l’automatisation du navigateur peuvent consommer beaucoup de ressources.

    Système d’exploitation : utilisez **Ubuntu LTS** (ou tout Debian/Ubuntu moderne). Le parcours d’installation Linux y est le mieux testé.

    Docs : [Linux](/fr/platforms/linux), [Hébergement VPS](/fr/vps).

  </Accordion>

  <Accordion title="Puis-je exécuter OpenClaw dans une VM et quelles sont les exigences ?">
    Oui. Traitez une VM comme un VPS : elle doit rester toujours active, être joignable et disposer de suffisamment
    de RAM pour le Gateway et tous les canaux que vous activez.

    Recommandations de base :

    - **Minimum absolu :** 1 vCPU, 1 Go de RAM.
    - **Recommandé :** 2 Go de RAM ou plus si vous exécutez plusieurs canaux, l’automatisation du navigateur ou des outils multimédias.
    - **Système d’exploitation :** Ubuntu LTS ou un autre Debian/Ubuntu moderne.

    Si vous êtes sous Windows, **WSL2 est la configuration de type VM la plus simple** et offre la meilleure
    compatibilité avec les outils. Voir [Windows](/fr/platforms/windows), [Hébergement VPS](/fr/vps).
    Si vous exécutez macOS dans une VM, voir [VM macOS](/fr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Connexe

- [FAQ](/fr/help/faq) — la FAQ principale (modèles, sessions, Gateway, sécurité, et plus)
- [Aperçu de l’installation](/fr/install)
- [Bien démarrer](/fr/start/getting-started)
- [Dépannage](/fr/help/troubleshooting)
