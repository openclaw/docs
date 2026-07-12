---
read_when:
    - Nouvelle installation, intégration bloquée ou erreurs au premier démarrage
    - Choisir l’authentification et les abonnements aux fournisseurs
    - Impossible d’accéder à docs.openclaw.ai, impossible d’ouvrir le tableau de bord, installation bloquée
sidebarTitle: First-run FAQ
summary: 'FAQ : démarrage rapide et configuration du premier lancement — installation, intégration, authentification, abonnements, échecs initiaux'
title: 'FAQ : configuration initiale'
x-i18n:
    generated_at: "2026-07-12T15:30:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8f5234a5ae52fd57a89b3140473049c37f8495875e4a5d9a89d87e55d8fb2f7e
    source_path: help/faq-first-run.md
    workflow: 16
---

  Questions-réponses sur le démarrage rapide et la première exécution. Pour les opérations quotidiennes, les modèles, l’authentification, les sessions
  et la résolution des problèmes, consultez la [FAQ](/fr/help/faq) principale.

  ## Démarrage rapide et configuration initiale

  <AccordionGroup>
  <Accordion title="Je suis bloqué, quel est le moyen le plus rapide de me débloquer ?">
    Utilisez un agent d’IA local capable de **voir votre machine**. La plupart des cas où
    « je suis bloqué » sont dus à des **problèmes locaux de configuration ou d’environnement**
    qu’un assistant distant ne peut pas examiner ; cette approche est donc plus efficace
    que de demander de l’aide sur Discord.

    - **Claude Code** : [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex** : [https://openai.com/codex/](https://openai.com/codex/)

    Donnez à l’agent accès à l’intégralité du code source extrait à l’aide de l’installation
    modifiable (git), afin qu’il puisse lire le code et la documentation, et raisonner sur
    la version exacte que vous exécutez :

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Demandez à l’agent de planifier et de superviser la correction étape par étape, puis
    d’exécuter uniquement les commandes nécessaires : les petits diffs sont plus faciles à auditer.

    Partagez les sorties suivantes lorsque vous demandez de l’aide, sur Discord ou dans une issue GitHub :

    | Commande | Affiche |
    | --- | --- |
    | `openclaw status` | État du Gateway/de l’agent et aperçu de la configuration de base |
    | `openclaw status --all` | Diagnostic complet en lecture seule, prêt à être copié-collé |
    | `openclaw models status` | Authentification du fournisseur et disponibilité des modèles |
    | `openclaw doctor` | Valide et corrige les problèmes courants de configuration et d’état |
    | `openclaw logs --follow` | Suivi des journaux en direct |
    | `openclaw gateway status --deep` | Vérification approfondie de l’état du Gateway, de la configuration et des plugins |
    | `openclaw health --verbose` | Rapport d’état détaillé |

    Vous avez trouvé un véritable bug ou une correction ? Créez une issue ou envoyez une PR :
    [Issues](https://github.com/openclaw/openclaw/issues) /
    [Pull requests](https://github.com/openclaw/openclaw/pulls).

    Boucle de débogage rapide : [Les 60 premières secondes en cas de problème](/fr/help/faq#first-60-seconds-if-something-is-broken).
    Documentation d’installation : [Installation](/fr/install), [Options du programme d’installation](/fr/install/installer), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Le Heartbeat est constamment ignoré. Que signifient les motifs d’omission ?">
    | Motif d’omission | Signification |
    | --- | --- |
    | `quiet-hours` | En dehors de la plage d’heures actives configurée |
    | `empty-heartbeat-file` | `HEARTBEAT.md` existe, mais ne contient qu’une structure vide composée de lignes blanches, de commentaires, d’en-têtes, de délimiteurs de bloc ou d’une liste de contrôle vide |
    | `no-tasks-due` | Le mode tâche est actif, mais aucun intervalle de tâche n’est encore arrivé à échéance |
    | `alerts-disabled` | Toute la visibilité du Heartbeat est désactivée (`showOk`, `showAlerts` et `useIndicator` sont tous désactivés) |

    En mode tâche, les horodatages d’échéance n’avancent qu’après l’exécution complète
    d’un véritable Heartbeat. Les exécutions ignorées ne marquent pas les tâches comme terminées.

    Documentation : [Heartbeat](/fr/gateway/heartbeat), [Automatisation](/fr/automation).

  </Accordion>

  <Accordion title="Méthode recommandée pour installer et configurer OpenClaw">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Depuis le code source (contributeurs/développeurs) :

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Pas encore d’installation globale ? Exécutez plutôt `pnpm openclaw onboard`. Si les ressources
    de Control UI sont absentes, l’intégration initiale tente de les compiler elle-même, avec
    `pnpm ui:build` comme solution de repli.

  </Accordion>

  <Accordion title="Comment ouvrir le tableau de bord après l’intégration initiale ?">
    Juste après la configuration, l’intégration initiale ouvre votre navigateur sur une URL
    propre du tableau de bord, sans jeton, et affiche le lien dans le récapitulatif. Gardez
    cet onglet ouvert ; s’il ne s’est pas lancé, copiez-collez l’URL affichée sur la même machine.
  </Accordion>

  <Accordion title="Comment authentifier le tableau de bord en localhost ou à distance ?">
    **Localhost (même machine) :**

    - Ouvrez `http://127.0.0.1:18789/`.
    - Si une authentification par secret partagé est demandée, collez le jeton ou le mot de passe configuré dans les paramètres de Control UI.
    - Source du jeton : `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
    - Source du mot de passe : `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Aucun secret partagé n’est encore configuré ? Exécutez `openclaw doctor --generate-gateway-token` (ou `openclaw doctor --fix --generate-gateway-token`).

    **Hors de localhost :**

    - **Tailscale Serve** (recommandé) : conservez la liaison sur l’interface de bouclage, exécutez `openclaw gateway --tailscale serve`, puis ouvrez `https://<magicdns>/`. Avec `gateway.auth.allowTailscale: true`, les en-têtes d’identité satisfont l’authentification de Control UI/WebSocket sans avoir à coller de secret partagé, en supposant que l’hôte du Gateway est approuvé ; les API HTTP nécessitent toujours une authentification par secret partagé, sauf si vous utilisez délibérément `none` pour une entrée privée ou une authentification HTTP par proxy de confiance.
      Les tentatives Serve simultanées avec une authentification incorrecte provenant du même client sont sérialisées avant leur enregistrement par le limiteur d’échecs d’authentification ; une deuxième tentative incorrecte peut donc déjà afficher `retry later`.
    - **Liaison Tailnet** : exécutez `openclaw gateway --bind tailnet --token "<token>"` (ou configurez l’authentification par mot de passe), ouvrez `http://<tailscale-ip>:18789/`, puis collez le secret partagé correspondant dans les paramètres du tableau de bord.
    - **Proxy inverse tenant compte de l’identité** : conservez le Gateway derrière un proxy de confiance, définissez `gateway.auth.mode: "trusted-proxy"`, puis ouvrez l’URL du proxy. Les proxys sur le même hôte utilisant l’interface de bouclage nécessitent explicitement `gateway.auth.trustedProxy.allowLoopback: true`.
    - **Tunnel SSH** : `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`, puis ouvrez `http://127.0.0.1:18789/`. L’authentification par secret partagé reste applicable via le tunnel ; collez le jeton ou le mot de passe configuré si cela vous est demandé.

    Consultez [Tableau de bord](/fr/web/dashboard) et [Interfaces web](/fr/web) pour obtenir des détails sur les modes de liaison et l’authentification.

  </Accordion>

  <Accordion title="Pourquoi existe-t-il deux configurations d’approbation d’exécution pour les approbations par chat ?">
    Elles contrôlent des couches différentes :

    - `approvals.exec` — transmet les demandes d’approbation vers les destinations de chat.
    - `channels.<channel>.execApprovals` — fait de ce canal un client d’approbation natif pour les approbations d’exécution.

    La politique d’exécution de l’hôte reste le véritable mécanisme de contrôle des approbations ;
    la configuration du chat détermine uniquement où les demandes apparaissent et comment les personnes y répondent.

    Vous avez rarement besoin des deux :

    - Si le chat prend déjà en charge les commandes et les réponses, `/approve` dans ce même chat fonctionne via le chemin partagé.
    - Lorsqu’un canal natif pris en charge peut déterminer les approbateurs de manière sûre, OpenClaw active automatiquement les approbations natives privilégiant les messages privés si `channels.<channel>.execApprovals.enabled` n’est pas défini ou vaut `"auto"`.
    - Lorsque des cartes ou boutons d’approbation natifs sont disponibles, cette interface est prioritaire ; ne mentionnez une commande manuelle `/approve` que si le résultat de l’outil indique que les approbations par chat sont indisponibles.
    - Utilisez `approvals.exec` uniquement lorsque les invites doivent également parvenir à d’autres chats ou à des salons d’exploitation explicites.
    - Utilisez `channels.<channel>.execApprovals.target: "channel"` ou `"both"` uniquement lorsque vous souhaitez que les invites d’approbation soient republiées dans le salon ou le sujet d’origine.
    - Les approbations de Plugin sont distinctes : `/approve` dans le même chat par défaut, transfert facultatif via `approvals.plugin`, et seuls certains canaux natifs conservent également leur gestion native pour celles-ci.

    En bref : le transfert sert au routage, tandis que la configuration du client natif permet une expérience utilisateur plus riche et propre à chaque canal.
    Consultez [Approbations d’exécution](/fr/tools/exec-approvals).

  </Accordion>

  <Accordion title="De quel environnement d’exécution ai-je besoin ?">
    Node **22.19+** est requis (Node 24 recommandé). `pnpm` est le gestionnaire de paquets du dépôt.
    Bun n’est **pas recommandé** pour le Gateway.
  </Accordion>

  <Accordion title="Fonctionne-t-il sur Raspberry Pi ?">
    Oui, mais vérifiez d’abord la RAM : les Pi 5 et Pi 4 (2 GB+) offrent le meilleur compromis ; le Pi 3B+ (1 GB) fonctionne, mais lentement ; le Pi Zero 2 W (512 MB) n’est pas recommandé.

    | Modèle | RAM | Adéquation |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | Idéal |
    | Pi 4 | 4 GB | Bon |
    | Pi 4 | 2 GB | Correct, ajoutez de l’espace d’échange |
    | Pi 4 | 1 GB | Limité |
    | Pi 3B+ | 1 GB | Lent |
    | Pi Zero 2 W | 512 MB | Non recommandé |

    Minimum absolu : 1 GB de RAM, 1 cœur, 500 MB d’espace disque libre et un système d’exploitation 64 bits. Comme le Pi exécute uniquement
    le Gateway (les modèles font appel à des API cloud), même un Pi modeste peut gérer la charge.

    Un petit Pi/VPS peut également héberger uniquement le Gateway pendant que vous associez des **nœuds** sur votre
    ordinateur portable ou téléphone pour accéder localement à l’écran, à la caméra ou au canevas, ou pour exécuter des commandes. Consultez [Nœuds](/fr/nodes).

    Guide de configuration complet : [Raspberry Pi](/fr/install/raspberry-pi).

  </Accordion>

  <Accordion title="Des conseils pour les installations sur Raspberry Pi ?">
    - Utilisez un système d’exploitation **64 bits** ; n’utilisez pas Raspberry Pi OS 32 bits.
    - Ajoutez de l’espace d’échange sur les cartes de 2 GB ou moins.
    - Préférez un **SSD USB** à une carte SD pour de meilleures performances et une plus grande longévité.
    - Préférez l’installation modifiable (git) afin de pouvoir consulter les journaux et effectuer rapidement les mises à jour.
    - Commencez sans canaux ni Skills, puis ajoutez-les un par un.
    - Les échecs inhabituels de fichiers binaires (« exec format error ») sont généralement dus à l’absence d’une version ARM64 pour l’outil facultatif d’une compétence.

    Guide complet : [Raspberry Pi](/fr/install/raspberry-pi). Consultez également [Linux](/fr/platforms/linux).

  </Accordion>

  <Accordion title="L’écran reste bloqué sur wake up my friend / l’intégration initiale n’éclot pas. Que faire ?">
    Cet écran nécessite que le Gateway soit accessible et authentifié. La TUI envoie également
    « Réveille-toi, mon ami ! » automatiquement lors de la première éclosion lorsqu’un fournisseur de modèles est configuré. Si
    vous avez ignoré la configuration du modèle ou de l’authentification, l’intégration initiale affiche une note « Authentification du modèle manquante » et ouvre la
    TUI sans rien envoyer — ajoutez un fournisseur avec `openclaw configure --section model`.
    Si vous voyez la ligne de réveil **sans réponse** et que le nombre de jetons reste à 0, l’agent ne s’est jamais exécuté.

    1. Redémarrez le Gateway :

    ```bash
    openclaw gateway restart
    ```

    2. Vérifiez l’état et l’authentification :

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Le blocage persiste ? Exécutez :

    ```bash
    openclaw doctor
    ```

    Si le Gateway est distant, vérifiez que la connexion au tunnel/Tailscale est active et que l’interface utilisateur
    pointe vers le bon Gateway. Consultez [Accès à distance](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Puis-je migrer ma configuration vers une nouvelle machine sans recommencer l’intégration initiale ?">
    Oui. Copiez le **répertoire d’état** et l’**espace de travail**, puis exécutez Doctor une fois :

    1. Installez OpenClaw sur la nouvelle machine.
    2. Copiez `$OPENCLAW_STATE_DIR` (valeur par défaut : `~/.openclaw`) depuis l’ancienne machine.
    3. Copiez votre espace de travail (valeur par défaut : `~/.openclaw/workspace`).
    4. Exécutez `openclaw doctor`, puis redémarrez le service Gateway.

    Cela conserve la configuration, les profils d’authentification, les identifiants WhatsApp, les sessions et la mémoire : votre bot reste
    exactement identique, à condition de copier **les deux** emplacements. En mode distant, l’hôte du
    Gateway possède le stockage des sessions et l’espace de travail.

    **Important :** si vous validez et envoyez uniquement votre espace de travail vers GitHub, vous sauvegardez
    **la mémoire et les fichiers d’amorçage**, mais pas l’historique des sessions ni l’authentification. Ceux-ci se trouvent sous
    `~/.openclaw/` (par exemple `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`).

    Voir aussi : [Migration](/fr/install/migrating), [Emplacement des éléments sur le disque](/fr/help/faq#where-things-live-on-disk),
    [Espace de travail de l’agent](/fr/concepts/agent-workspace), [Doctor](/fr/gateway/doctor),
    [Mode distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Où puis-je voir les nouveautés de la dernière version ?">
    Consultez le journal des modifications sur GitHub :
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Les entrées les plus récentes figurent en haut. Si la première section est **Non publiée**, la section datée
    suivante correspond à la dernière version publiée. Les entrées sont regroupées sous **Points forts**, **Modifications**
    et **Correctifs** (ainsi que dans des sections consacrées à la documentation ou autres, si nécessaire).

  </Accordion>

  <Accordion title="Impossible d’accéder à docs.openclaw.ai (erreur SSL)">
    Certaines connexions Comcast/Xfinity bloquent incorrectement `docs.openclaw.ai` via Xfinity
    Advanced Security. Désactivez cette fonctionnalité ou ajoutez `docs.openclaw.ai` à la liste d’autorisation, puis réessayez. Aidez-nous
    à faire lever ce blocage : [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Toujours bloqué ? La documentation est répliquée sur GitHub :
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Différence entre les versions stable et bêta">
    **Stable** et **bêta** sont des **dist-tags npm**, et non des branches de code distinctes :

    - `latest` = stable
    - `beta` = version préliminaire destinée aux tests (revient à `latest` lorsque la version bêta est absente ou antérieure à la version stable actuelle)

    Une version stable passe généralement d’abord par **bêta**, puis une étape de promotion explicite
    déplace cette même version vers `latest` sans modifier son numéro de version. Les mainteneurs
    peuvent également publier directement vers `latest`. C’est pourquoi les versions bêta et stable peuvent pointer vers la
    **même version** après la promotion.

    Consultez les modifications : [CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md).

    Pour les commandes d’installation en une ligne et la différence entre bêta et dev, consultez l’accordéon suivant.

  </Accordion>

  <Accordion title="Comment installer la version bêta et quelle est la différence entre bêta et dev ?">
    **Bêta** correspond au dist-tag npm `beta` (il peut correspondre à `latest` après la promotion).
    **Dev** correspond à la tête évolutive de `main` (git) ; lorsqu’elle est publiée sur npm, elle utilise le dist-tag `dev`.

    Commandes en une ligne (macOS/Linux) :

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Programme d’installation Windows (PowerShell) : `iwr -useb https://openclaw.ai/install.ps1 | iex`

    Plus de détails : [Canaux de développement](/fr/install/development-channels) et [Options du programme d’installation](/fr/install/installer).

  </Accordion>

  <Accordion title="Comment essayer les toutes dernières modifications ?">
    Deux possibilités :

    1. **Canal dev (installation existante) :**

    ```bash
    openclaw update --channel dev
    ```

    Cette commande bascule vers une copie de travail git de `main`, la rebase sur le dépôt en amont, effectue la compilation et installe
    la CLI depuis cette copie de travail.

    2. **Installation modifiable (git) sur une nouvelle machine :**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Il est préférable d’effectuer un clonage manuel :

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentation : [Mise à jour](/fr/cli/update), [Canaux de développement](/fr/install/development-channels), [Installation](/fr/install).

  </Accordion>

  <Accordion title="Combien de temps prennent généralement l’installation et la configuration initiale ?">
    Estimation approximative :

    - **Installation :** 2-5 minutes.
    - **Configuration initiale QuickStart :** quelques minutes (Gateway en boucle locale, jeton automatique, espace de travail par défaut).
    - **Configuration initiale avancée/complète :** plus longue lorsque la connexion au fournisseur, l’association d’un canal, l’installation du démon, les téléchargements réseau ou les Skills nécessitent une configuration supplémentaire.

    L’assistant présente cette estimation dès le début. Ignorez les étapes facultatives et revenez-y plus tard avec
    `openclaw configure`.

    Le processus est bloqué ? Consultez [Je suis bloqué](#quick-start-and-first-run-setup) ci-dessus.

  </Accordion>

  <Accordion title="Le programme d’installation est bloqué ? Comment obtenir plus d’informations ?">
    Relancez-le avec `--verbose` :

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1` ne possède pas d’option détaillée dédiée ; encadrez-le plutôt avec `Set-PSDebug -Trace 1` /
    `-Trace 0`. Référence complète des options : [Options du programme d’installation](/fr/install/installer).

  </Accordion>

  <Accordion title="Sous Windows, l’installation indique que git est introuvable ou qu’openclaw n’est pas reconnu">
    Deux problèmes courants sous Windows :

    **1) Erreur npm spawn git / git introuvable**

    - Installez **Git for Windows** et vérifiez que `git` figure dans PATH.
    - Fermez puis rouvrez PowerShell, puis relancez le programme d’installation.

    **2) openclaw n’est pas reconnu après l’installation**

    - Le dossier global des exécutables npm ne figure pas dans PATH.
    - Vérifiez-le avec : `npm config get prefix`.
    - Ajoutez ce répertoire au PATH de votre utilisateur (aucun suffixe `\bin` n’est nécessaire ; sur la plupart des systèmes, il s’agit de `%AppData%\npm`).
    - Fermez puis rouvrez PowerShell.

    Vous préférez une application de bureau ? Utilisez **Windows Hub**. Pour une configuration exclusivement dans le terminal, le programme
    d’installation PowerShell et les méthodes de Gateway sous WSL2 sont tous deux pris en charge. Documentation : [Windows](/fr/platforms/windows).

  </Accordion>

  <Accordion title="Sous Windows, la sortie d’exec affiche du texte chinois illisible : que faire ?">
    Il s’agit généralement d’une incompatibilité de page de codes de la console dans les interpréteurs de commandes Windows natifs.

    Symptômes : la sortie de `system.run`/`exec` affiche le chinois sous forme de caractères corrompus ; la même commande
    s’affiche correctement dans un autre profil de terminal.

    Solution de contournement dans PowerShell :

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Redémarrez ensuite le Gateway et réessayez :

    ```powershell
    openclaw gateway restart
    ```

    Le problème se reproduit toujours avec la dernière version d’OpenClaw ? Suivez-le ou signalez-le ici : [Issue #30640](https://github.com/openclaw/openclaw/issues/30640).

  </Accordion>

  <Accordion title="La documentation n’a pas répondu à ma question : comment obtenir une meilleure réponse ?">
    Utilisez l’installation modifiable (git) afin de disposer localement de l’intégralité du code source et de la documentation, puis interrogez
    votre bot (ou Claude/Codex) **depuis ce dossier** afin qu’il puisse lire le dépôt et répondre précisément.

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Plus de détails : [Installation](/fr/install) et [Options du programme d’installation](/fr/install/installer).

  </Accordion>

  <Accordion title="Comment installer OpenClaw sous Linux ?">
    - Parcours rapide sous Linux et installation du service : [Linux](/fr/platforms/linux).
    - Procédure complète : [Prise en main](/fr/start/getting-started).
    - Programme d’installation et mises à jour : [Installation et mises à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Comment installer OpenClaw sur un VPS ?">
    N’importe quel VPS Linux convient. Effectuez l’installation sur le serveur, puis accédez au Gateway via SSH/Tailscale.

    Guides : [exe.dev](/fr/install/exe-dev), [Hetzner](/fr/install/hetzner), [Fly.io](/fr/install/fly).
    Accès distant : [Gateway distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Où se trouvent les guides d’installation dans le cloud ou sur un VPS ?">
    Portail d’hébergement regroupant les fournisseurs courants :

    - [Hébergement sur VPS](/fr/vps) (tous les fournisseurs au même endroit)
    - [Fly.io](/fr/install/fly)
    - [Hetzner](/fr/install/hetzner)
    - [exe.dev](/fr/install/exe-dev)

    Dans le cloud, le **Gateway s’exécute sur le serveur** et vous y accédez depuis votre ordinateur portable ou votre téléphone
    au moyen de l’interface de contrôle (ou de Tailscale/SSH). Votre état et votre espace de travail résident sur le serveur ; considérez donc
    l’hôte comme la source de vérité et sauvegardez-le.

    Associez des **Nodes** (Mac/iOS/Android/sans interface) à ce Gateway dans le cloud pour utiliser localement
    l’écran, la caméra ou le canevas, ou exécuter des commandes sur votre ordinateur portable tandis que le Gateway reste dans
    le cloud.

    Portail : [Plateformes](/fr/platforms). Accès distant : [Gateway distant](/fr/gateway/remote).
    Nodes : [Nodes](/fr/nodes), [CLI des Nodes](/fr/cli/nodes).

  </Accordion>

  <Accordion title="Puis-je demander à OpenClaw de se mettre à jour lui-même ?">
    C’est possible, mais déconseillé. Le processus de mise à jour peut redémarrer le Gateway, ce qui interrompt la
    session active, peut nécessiter une copie de travail git propre et peut demander une confirmation.
    Il est plus sûr que l’opérateur exécute les mises à jour depuis un interpréteur de commandes.

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Automatisation depuis un agent :

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentation : [Mise à jour](/fr/cli/update), [Mettre à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Que fait réellement la configuration initiale ?">
    `openclaw onboard` est le parcours de configuration recommandé. En **mode local**, il vous guide à travers les étapes suivantes :

    1. **Modèle/authentification** - OAuth du fournisseur, clés d’API ou authentification manuelle (y compris des options locales telles que LM Studio) ; sélection d’un modèle par défaut.
    2. **Espace de travail** - emplacement et fichiers d’initialisation.
    3. **Gateway** - port, adresse de liaison, mode d’authentification, exposition via Tailscale.
    4. **Canaux** - canaux de discussion intégrés et fournis par des plugins officiels : iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, entre autres.
    5. **Démon** - LaunchAgent (macOS), unité utilisateur systemd (Linux/WSL2) ou tâche planifiée Windows native.
    6. **Contrôle d’intégrité** - démarre le Gateway et vérifie qu’il fonctionne.
    7. **Skills** - installe les Skills recommandés et les dépendances facultatives.

    Il indique dès le début la durée estimée et vous avertit si votre modèle configuré est inconnu
    ou si son authentification est manquante. Présentation complète : [Configuration initiale (CLI)](/fr/start/wizard).

  </Accordion>

  <Accordion title="Ai-je besoin d’un abonnement Claude ou OpenAI pour utiliser OpenClaw ?">
    Non. Utilisez OpenClaw avec des **clés d’API** (Anthropic/OpenAI/autres) ou des **modèles exclusivement locaux**
    afin que vos données restent sur votre appareil. Les abonnements (Claude Pro/Max, ChatGPT/Codex) constituent
    des moyens facultatifs de s’authentifier auprès de ces fournisseurs.

    Pour Anthropic : une **clé d’API** offre une facturation standard à l’usage ; la **CLI Claude**
    réutilise une connexion Claude Code existante sur le même hôte. Anthropic considère actuellement
    le mode non interactif `claude -p` de la CLI Claude comme une utilisation de l’Agent SDK ou une utilisation programmatique
    qui reste décomptée des limites de votre formule d’abonnement ; consultez la documentation de facturation actuelle d’Anthropic
    avant de vous fier au comportement de l’abonnement. Pour les hôtes de Gateway à longue durée de vie et les automatisations
    partagées, une clé d’API Anthropic constitue un choix plus prévisible.

    L’authentification OAuth OpenAI Codex (abonnement ChatGPT/Codex) est entièrement prise en charge pour les modèles d’agents.
    OpenClaw prend également en charge des options hébergées de type abonnement, notamment **Qwen Cloud
    Coding Plan**, **MiniMax Coding Plan** et **Z.AI / GLM Coding Plan**.

    Documentation : [Anthropic](/fr/providers/anthropic), [OpenAI](/fr/providers/openai),
    [Qwen Cloud](/fr/providers/qwen), [MiniMax](/fr/providers/minimax), [Z.AI (GLM)](/fr/providers/zai),
    [Modèles locaux](/fr/gateway/local-models), [Modèles](/fr/concepts/models).

  </Accordion>

  <Accordion title="Puis-je utiliser un abonnement Claude Max sans clé d’API ?">
    Oui. OpenClaw prend en charge la réutilisation de la CLI Claude pour les formules Pro/Max/Team/Enterprise. Anthropic
    considère actuellement le mode `claude -p` utilisé par OpenClaw comme une utilisation incluse dans l’abonnement et soumise
    aux limites de votre formule, et non comme une allocation gratuite distincte ; consultez
    [Anthropic](/fr/providers/anthropic) pour connaître les informations de facturation actuelles et accéder aux liens vers
    les propres articles d’assistance d’Anthropic. Pour une configuration côté serveur aussi prévisible que possible, utilisez plutôt une
    clé d’API Anthropic.
  </Accordion>

  <Accordion title="Prenez-vous en charge l’authentification par abonnement Claude (Claude Pro ou Max) ?">
    Oui, par réutilisation de la CLI Claude. Le traitement de la facturation par Anthropic pour l’utilisation de `claude -p`/Agent SDK
    a évolué au fil du temps ; consultez [Anthropic](/fr/providers/anthropic) pour connaître la situation actuelle et
    accéder aux liens datés vers les articles d’assistance d’Anthropic avant de vous fier à un comportement
    de facturation particulier.

    L’authentification par jeton de configuration Anthropic reste également prise en charge, mais OpenClaw privilégie
    la réutilisation de la CLI Claude et `claude -p` lorsqu’ils sont disponibles. Pour les charges de travail de production ou
    multi-utilisateurs, une clé d’API Anthropic reste le choix le plus sûr et le plus prévisible. Autres
    options hébergées de type abonnement : [OpenAI](/fr/providers/openai), [Qwen Cloud](/fr/providers/qwen),
    [MiniMax](/fr/providers/minimax), [Z.AI (GLM)](/fr/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

  <AccordionGroup>
  <Accordion title="Pourquoi l’erreur HTTP 429 rate_limit_error d’Anthropic s’affiche-t-elle ?">
    Votre **quota/limite de débit Anthropic** est épuisé pour la fenêtre actuelle. Avec la **CLI
    Claude**, attendez la réinitialisation de la fenêtre ou passez à une offre supérieure. Avec une **clé API Anthropic**,
    vérifiez l’utilisation et la facturation dans la console Anthropic, puis augmentez les limites si nécessaire.

    Si le message est précisément `Extra usage is required for long context requests`,
    la requête tente d’utiliser la fenêtre de contexte de 1M d’Anthropic (un modèle Claude 4.x
    1M compatible avec la disponibilité générale, ou l’ancienne configuration `params.context1m: true`), et votre identifiant actuel ne
    permet pas la facturation du contexte long.

    Définissez un **modèle de secours** afin qu’OpenClaw continue de répondre lorsqu’un fournisseur est soumis à une limitation de débit.
    Consultez [Modèles](/fr/cli/models), [OAuth](/fr/concepts/oauth) et
    [Utilisation supplémentaire requise par Anthropic 429 pour le contexte long](/fr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock est-il pris en charge ?">
    Oui. OpenClaw comprend un fournisseur **Amazon Bedrock (Converse)** intégré. Lorsque des marqueurs d’environnement AWS
    sont présents (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, `AWS_BEARER_TOKEN_BEDROCK`),
    OpenClaw active automatiquement le fournisseur Bedrock implicite pour la découverte des modèles ; sinon,
    définissez `plugins.entries.amazon-bedrock.config.discovery.enabled: true` ou ajoutez manuellement
    une entrée de fournisseur. Consultez [Amazon Bedrock](/fr/providers/bedrock) et [Fournisseurs de modèles](/fr/providers/models).
    Un proxy compatible avec OpenAI placé devant Bedrock reste une option valable si vous préférez un flux de clés géré.
  </Accordion>

  <Accordion title="Comment fonctionne l’authentification Codex ?">
    OpenClaw prend en charge **OpenAI Codex** via OAuth (connexion à ChatGPT). Une nouvelle
    configuration sans modèle principal utilise exactement `openai/gpt-5.6-sol` pour
    l’authentification par abonnement ChatGPT/Codex ainsi que l’exécution native du serveur d’application Codex.
    Une réauthentification conserve un modèle explicite existant, notamment
    `openai/gpt-5.5`. Si l’espace de travail Codex ne propose pas GPT-5.6, sélectionnez
    explicitement `openai/gpt-5.5` ; OpenClaw ne passe pas silencieusement à une version inférieure. Les anciennes
    références de modèles préfixées par Codex constituent une ancienne configuration réparée par `openclaw doctor
    --fix`. L’accès direct avec une clé API OpenAI reste disponible pour les surfaces de l’API OpenAI
    hors agents et, par l’intermédiaire d’un profil de clé API `openai` ordonné, également pour les modèles
    d’agents. Consultez [Fournisseurs de modèles](/fr/concepts/model-providers) et
    [Intégration initiale (CLI)](/fr/start/wizard).
  </Accordion>

  <Accordion title="Pourquoi OpenClaw mentionne-t-il encore l’ancien préfixe OpenAI Codex ?">
    `openai` est l’identifiant actuel du fournisseur et du profil d’authentification pour les clés API OpenAI et
    OAuth ChatGPT/Codex : OpenAI Codex y est intégré. Vous pouvez encore voir l’ancien
    préfixe `openai-codex` dans d’anciennes configurations et des avertissements de migration :

    - `openai/gpt-5.6-sol` = nouvelle configuration d’abonnement ChatGPT/Codex avec l’environnement d’exécution Codex natif pour les tours d’agent.
    - `openai/gpt-5.5` = sélection explicitement prise en charge pour les configurations existantes ou les comptes sans accès à GPT-5.6.
    - Anciennes références de modèles `openai-codex/*` = ancienne route réparée par `openclaw doctor --fix`.
    - `openai/gpt-5.5` avec un profil de clé API `openai` ordonné = authentification par clé API pour un modèle d’agent OpenAI.
    - Anciens identifiants de profil d’authentification `openai-codex` = anciens identifiants migrés par `openclaw doctor --fix`.

    Vous souhaitez une facturation directe via OpenAI Platform ? Définissez `OPENAI_API_KEY`. Vous souhaitez une authentification
    par abonnement ChatGPT/Codex ? Exécutez `openclaw models auth login --provider openai`. Conservez
    les références de modèles sous le fournisseur canonique `openai/*`. Une nouvelle configuration d’abonnement
    utilise exactement `openai/gpt-5.6-sol` ; doctor répare les anciennes références préfixées par Codex
    sans mettre à niveau une sélection explicite de `openai/gpt-5.5`.

  </Accordion>

  <Accordion title="Pourquoi les limites OAuth de Codex peuvent-elles différer de celles de ChatGPT sur le Web ?">
    OAuth Codex utilise des fenêtres de quota gérées par OpenAI et dépendantes de l’offre, qui peuvent différer de
    l’expérience du site Web ou de l’application ChatGPT, même avec le même compte.

    `openclaw models status` affiche les fenêtres d’utilisation et de quota du fournisseur actuellement visibles, mais
    n’invente ni ne transforme les droits de ChatGPT sur le Web en accès direct à l’API. Pour la
    voie de facturation et de limitation directe d’OpenAI Platform, utilisez `openai/*` avec une clé API.

  </Accordion>

  <Accordion title="L’authentification par abonnement OpenAI (OAuth Codex) est-elle prise en charge ?">
    Oui, entièrement. OpenAI autorise explicitement l’utilisation d’OAuth avec un abonnement dans des
    outils et flux de travail externes comme OpenClaw. L’intégration initiale peut exécuter le flux OAuth pour vous.

    Consultez [OAuth](/fr/concepts/oauth), [Fournisseurs de modèles](/fr/concepts/model-providers) et [Intégration initiale (CLI)](/fr/start/wizard).

  </Accordion>

  <Accordion title="Comment configurer OAuth pour la CLI Gemini ?">
    La CLI Gemini utilise un **flux d’authentification de Plugin**, et non un identifiant client ou un secret dans `openclaw.json`.

    1. Installez localement la CLI Gemini afin que `gemini` soit disponible dans `PATH` :
       - Homebrew : `brew install gemini-cli`
       - npm : `npm install -g @google/gemini-cli`
    2. Activez le Plugin : `openclaw plugins enable google`
    3. Connectez-vous : `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modèle par défaut après la connexion : `google/gemini-3.1-pro-preview` (environnement d’exécution `google-gemini-cli`)
    5. Les requêtes échouent après la connexion ? Définissez `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte du Gateway, puis réessayez.

    Les jetons OAuth sont stockés dans les profils d’authentification sur l’hôte du Gateway. Détails : [Google](/fr/providers/google), [Fournisseurs de modèles](/fr/concepts/model-providers).

  </Accordion>

  <Accordion title="Un modèle local convient-il aux conversations informelles ?">
    Généralement non. OpenClaw nécessite un contexte étendu et une sécurité robuste ; les petites cartes tronquent le contexte
    et omettent les filtres de sécurité côté fournisseur. Si vous devez en utiliser un, exécutez localement la version de modèle
    la **plus grande** possible (LM Studio) — consultez [Modèles locaux](/fr/gateway/local-models). Les modèles plus petits ou quantifiés
    augmentent le risque d’injection de prompt — consultez [Sécurité](/fr/gateway/security).
  </Accordion>

  <Accordion title="Comment conserver le trafic des modèles hébergés dans une région précise ?">
    Choisissez des points de terminaison rattachés à une région. OpenRouter propose des options hébergées aux États-Unis pour MiniMax, Kimi
    et GLM ; choisissez la variante hébergée aux États-Unis afin de conserver les données dans la région. Vous pouvez toujours répertorier
    Anthropic/OpenAI en parallèle avec `models.mode: "merge"` afin que les solutions de secours restent
    disponibles tout en respectant le fournisseur régional que vous sélectionnez.
  </Accordion>

  <Accordion title="Dois-je acheter un Mac Mini pour installer ceci ?">
    Non. OpenClaw fonctionne sous macOS ou Linux (Windows via WSL2). Un Mac mini est un choix populaire
    d’hôte toujours actif, mais un petit VPS, un serveur domestique ou une machine de catégorie Raspberry Pi convient également.

    Vous n’avez besoin d’un Mac **que pour les outils réservés à macOS**. Pour iMessage, utilisez [iMessage](/fr/channels/imessage)
    avec `imsg` sur n’importe quel Mac connecté à Messages ; si le Gateway s’exécute sous Linux ou ailleurs,
    définissez `channels.imessage.cliPath` sur un wrapper SSH qui exécute `imsg` sur ce Mac. Pour les autres
    outils réservés à macOS, exécutez le Gateway sur un Mac ou associez un Node macOS.

    Documentation : [iMessage](/fr/channels/imessage), [Nodes](/fr/nodes), [Mode distant Mac](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Ai-je besoin d’un Mac mini pour la prise en charge d’iMessage ?">
    Vous avez besoin d’**un appareil macOS** connecté à Messages, pas nécessairement d’un Mac mini : n’importe quel
    Mac convient. Utilisez [iMessage](/fr/channels/imessage) avec `imsg` ; le Gateway peut s’exécuter sur ce
    Mac ou ailleurs avec un `cliPath` utilisant un wrapper SSH.

    Configurations courantes :

    - Gateway sous Linux/VPS, avec `channels.imessage.cliPath` défini sur un wrapper SSH qui exécute `imsg` sur un Mac connecté à Messages.
    - Tout sur un seul Mac pour la configuration mono-machine la plus simple.

    Documentation : [iMessage](/fr/channels/imessage), [Nodes](/fr/nodes), [Mode distant Mac](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Si j’achète un Mac mini pour exécuter OpenClaw, puis-je le connecter à mon MacBook Pro ?">
    Oui. Le **Mac mini peut exécuter le Gateway**, et votre MacBook Pro s’y connecte en tant que **Node**
    (appareil compagnon). Les Nodes n’exécutent pas le Gateway : ils ajoutent des fonctionnalités telles que
    l’écran, la caméra, le canevas et `system.run` sur cet appareil.

    Configuration courante : le Gateway s’exécute sur le Mac mini toujours actif ; le MacBook Pro exécute l’application macOS ou un
    hôte Node et s’associe au Gateway. Vérifiez avec `openclaw nodes status` / `openclaw nodes list`.

    Documentation : [Nodes](/fr/nodes), [CLI des Nodes](/fr/cli/nodes).

  </Accordion>

  <Accordion title="Puis-je utiliser Bun ?">
    Ce n’est pas recommandé : Bun présente des bogues d’exécution, en particulier avec WhatsApp et Telegram. Utilisez
    **Node** pour des Gateway stables. Si vous souhaitez tout de même expérimenter, faites-le sur un
    Gateway hors production sans WhatsApp/Telegram.
  </Accordion>

  <Accordion title="Telegram : que faut-il renseigner dans allowFrom ?">
    `channels.telegram.allowFrom` correspond à l’**identifiant utilisateur Telegram numérique de l’expéditeur humain**,
    et non au nom d’utilisateur du bot. La configuration demande uniquement des identifiants utilisateur numériques ; `openclaw doctor --fix`
    peut tenter de résoudre les anciennes entrées `@username`.

    Méthode plus sûre (sans bot tiers) : envoyez un message privé à votre bot, exécutez `openclaw logs --follow`, puis lisez `from.id`.

    API Bot officielle : envoyez un message privé à votre bot, appelez `https://api.telegram.org/bot<bot_token>/getUpdates`, puis lisez `message.from.id`.

    Service tiers (moins confidentiel) : envoyez un message privé à `@userinfobot` ou `@getidsbot`.

    Consultez [Contrôle d’accès Telegram](/fr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Plusieurs personnes peuvent-elles utiliser un même numéro WhatsApp avec différentes instances d’OpenClaw ?">
    Oui, grâce au **routage multi-agent**. Associez le message privé WhatsApp de chaque expéditeur (`peer: { kind: "direct", id: "+15551234567" }`) à un `agentId` différent, afin que chaque personne dispose de son propre espace de travail et stockage de sessions. Les réponses proviennent toujours du **même compte WhatsApp** ; le contrôle d’accès aux messages privés (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) est global pour chaque compte. Consultez [Routage multi-agent](/fr/concepts/multi-agent) et [WhatsApp](/fr/channels/whatsapp).
  </Accordion>

  <Accordion title='Puis-je exécuter un agent de « conversation rapide » et un agent « Opus pour la programmation » ?'>
    Oui. Utilisez le routage multi-agent : attribuez à chaque agent son propre modèle par défaut, puis associez les routes
    entrantes (compte du fournisseur ou pairs précis) à chaque agent. Exemple de configuration :
    [Routage multi-agent](/fr/concepts/multi-agent). Consultez également [Modèles](/fr/concepts/models) et
    [Configuration](/fr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew fonctionne-t-il sous Linux ?">
    Oui, via Linuxbrew :

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Pour exécuter OpenClaw via systemd : vérifiez que le PATH du service inclut
    `/home/linuxbrew/.linuxbrew/bin` (ou votre préfixe brew), afin que les outils installés par `brew`
    soient trouvés dans les shells sans connexion. Les versions récentes ajoutent également au début du PATH les répertoires bin utilisateur courants pour les services
    systemd sous Linux (par exemple `~/.local/bin`, `~/.npm-global/bin`,
    `~/.local/share/pnpm`, `~/.bun/bin`) et respectent `PNPM_HOME`, `NPM_CONFIG_PREFIX`,
    `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` et `FNM_DIR` lorsqu’ils sont définis.

  </Accordion>

  <Accordion title="Différence entre l’installation git modifiable et l’installation npm">
    - **Installation modifiable (git) :** extraction complète du code source, modifiable, idéale pour les contributeurs. Vous compilez localement et pouvez modifier le code ou la documentation.
    - **Installation npm :** installation globale de la CLI, sans dépôt, idéale pour « simplement l’exécuter ». Les mises à jour proviennent des balises de distribution npm.

    Documentation : [Bien démarrer](/fr/start/getting-started), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Puis-je passer ultérieurement d’une installation npm à une installation git, et inversement ?">
    Oui, avec `openclaw update --channel ...` sur une installation existante. Cela **ne
    supprime pas vos données** : seule l’installation du code d’OpenClaw change. L’état (`~/.openclaw`) et
    l’espace de travail (`~/.openclaw/workspace`) restent intacts.

    De npm vers git :

    ```bash
    openclaw update --channel dev
    ```

    De git vers npm :

    ```bash
    openclaw update --channel stable
    ```

    Ajoutez `--dry-run` pour prévisualiser d’abord le changement de mode prévu. Le programme de mise à jour exécute les opérations de suivi de Doctor, actualise les sources des plugins pour le canal cible et redémarre le Gateway, sauf si vous utilisez `--no-restart`.

    Le programme d’installation peut également imposer l’un ou l’autre mode :

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Conseils de sauvegarde : [Emplacement des éléments sur le disque](/fr/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Dois-je exécuter le Gateway sur mon ordinateur portable ou sur un VPS ?">
    Vous recherchez une fiabilité 24 h/24 et 7 j/7 ? Utilisez un **VPS**. Vous souhaitez une configuration aussi simple que possible et les mises en veille/redémarrages ne vous gênent pas ? Exécutez-le localement.

    **Ordinateur portable (Gateway local)**

    - **Avantages :** aucun coût de serveur, accès direct aux fichiers locaux, fenêtre de navigateur visible.
    - **Inconvénients :** les mises en veille et interruptions réseau le déconnectent, les mises à jour et redémarrages du système d’exploitation l’interrompent, la machine doit rester active.

    **VPS / cloud**

    - **Avantages :** fonctionnement permanent, réseau stable, aucun problème de mise en veille d’un ordinateur portable, maintien en fonctionnement plus simple.
    - **Inconvénients :** souvent sans interface graphique (utilisez des captures d’écran), accès aux fichiers uniquement à distance, SSH requis pour les mises à jour.

    WhatsApp/Telegram/Slack/Mattermost/Discord fonctionnent tous correctement depuis un VPS : le véritable compromis concerne l’utilisation d’un navigateur sans interface graphique plutôt que d’une fenêtre visible. Consultez [Navigateur](/fr/tools/browser).

    Recommandation par défaut : utilisez un VPS si vous avez déjà subi des déconnexions du Gateway ; l’exécution locale est idéale lorsque vous utilisez activement le Mac et souhaitez accéder aux fichiers locaux ou automatiser une interface de navigateur visible.

  </Accordion>

  <Accordion title="Dans quelle mesure est-il important d’exécuter OpenClaw sur une machine dédiée ?">
    Ce n’est pas obligatoire, mais c’est recommandé pour la fiabilité et l’isolation.

    - **Hôte dédié (VPS/Mac mini/Raspberry Pi) :** fonctionnement permanent, moins d’interruptions dues aux mises en veille ou redémarrages, autorisations plus simples, maintien en fonctionnement plus facile.
    - **Ordinateur portable/de bureau partagé :** convient aux tests et à une utilisation active, mais attendez-vous à des interruptions lorsque la machine se met en veille ou effectue des mises à jour.

    Pour bénéficier du meilleur des deux approches, conservez le Gateway sur un hôte dédié et associez votre ordinateur portable en tant que **nœud** pour utiliser les outils locaux d’écran, de caméra et d’exécution. Consultez [Nœuds](/fr/nodes) et [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Quelle est la configuration minimale requise pour un VPS et quel système d’exploitation est recommandé ?">
    - **Minimum absolu :** 1 vCPU, 1 GB de RAM, environ 500 MB d’espace disque.
    - **Recommandé :** 1 à 2 vCPU, 2 GB+ de RAM pour disposer d’une marge suffisante (journaux, médias, plusieurs canaux). Les outils Node et l’automatisation du navigateur peuvent consommer beaucoup de ressources.

    Système d’exploitation : **Ubuntu LTS** (ou toute version moderne de Debian/Ubuntu), qui constitue le parcours d’installation Linux le mieux testé.

    Documentation : [Linux](/fr/platforms/linux), [Hébergement sur VPS](/fr/vps).

  </Accordion>

  <Accordion title="Puis-je exécuter OpenClaw dans une machine virtuelle et quelle est la configuration requise ?">
    Oui. Considérez une machine virtuelle comme un VPS : elle doit rester active en permanence, être accessible et disposer de suffisamment de RAM pour le Gateway et tous les canaux que vous activez.

    - **Minimum absolu :** 1 vCPU, 1 GB de RAM.
    - **Recommandé :** 2 GB+ de RAM pour plusieurs canaux, l’automatisation du navigateur ou les outils multimédias.
    - **Système d’exploitation :** Ubuntu LTS ou une autre version moderne de Debian/Ubuntu.

    Sous Windows, utilisez **Windows Hub** pour la configuration du bureau, ou WSL2 pour disposer d’une machine virtuelle Gateway de type Linux offrant une large compatibilité avec les outils. Consultez [Windows](/fr/platforms/windows) et [Hébergement sur VPS](/fr/vps).
    Pour exécuter macOS dans une machine virtuelle, consultez [Machine virtuelle macOS](/fr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Pages connexes

- [FAQ](/fr/help/faq) - la FAQ principale (modèles, sessions, Gateway, sécurité, etc.)
- [Vue d’ensemble de l’installation](/fr/install)
- [Bien démarrer](/fr/start/getting-started)
- [Dépannage](/fr/help/troubleshooting)
