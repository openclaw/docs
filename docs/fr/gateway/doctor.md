---
read_when:
    - Ajouter ou modifier des migrations Doctor
    - Introduire des changements de configuration cassants
sidebarTitle: Doctor
summary: 'Commande Doctor : vérifications d’état, migrations de configuration et étapes de réparation'
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:28:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 592a9f886e0e6dcbfeb41a09c765ab289f3ed16ed360be37ff9fbefba920754f
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` est l’outil de réparation + migration d’OpenClaw. Il corrige la configuration/l’état obsolètes, vérifie l’état de santé et fournit des étapes de réparation exploitables.

## Démarrage rapide

```bash
openclaw doctor
```

### Modes headless et d’automatisation

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Accepte les valeurs par défaut sans invite (y compris les étapes de réparation de redémarrage/service/sandbox lorsque c’est applicable).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Applique les réparations recommandées sans invite (réparations + redémarrages lorsque c’est sûr).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Applique aussi les réparations agressives (écrase les configurations personnalisées de superviseur).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Exécute sans invite et applique uniquement les migrations sûres (normalisation de configuration + déplacements d’état sur disque). Ignore les actions de redémarrage/service/sandbox qui nécessitent une confirmation humaine. Les migrations d’état héritées s’exécutent automatiquement lorsqu’elles sont détectées.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Analyse les services système pour détecter des installations Gateway supplémentaires (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si vous voulez examiner les modifications avant écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Ce qu’il fait (résumé)

<AccordionGroup>
  <Accordion title="État de santé, interface et mises à jour">
    - Mise à jour préalable facultative pour les installations git (interactif uniquement).
    - Vérification de fraîcheur du protocole UI (reconstruit l’interface Control UI lorsque le schéma de protocole est plus récent).
    - Vérification d’état de santé + invite au redémarrage.
    - Résumé de l’état des Skills (éligibles/manquants/bloqués) et état des plugins.

  </Accordion>
  <Accordion title="Configuration et migrations">
    - Normalisation de configuration pour les valeurs héritées.
    - Migration de configuration Talk depuis les anciens champs plats `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
    - Vérifications de migration Browser pour les anciennes configurations d’extension Chrome et l’état de préparation Chrome MCP.
    - Avertissements de remplacement de fournisseur OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avertissements de masquage OAuth Codex (`models.providers.openai-codex`).
    - Vérification des prérequis TLS OAuth pour les profils OAuth OpenAI Codex.
    - Migration d’état hérité sur disque (sessions/agent dir/authentification WhatsApp).
    - Migration de clés de contrat de manifeste de plugin héritées (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration du magasin Cron hérité (`jobId`, `schedule.cron`, champs de livraison/charge utile de niveau supérieur, `provider` dans la charge utile, tâches de secours Webhook simples `notify: true`).
    - Migration de politique d’exécution d’agent héritée vers `agents.defaults.agentRuntime` et `agents.list[].agentRuntime`.

  </Accordion>
  <Accordion title="État et intégrité">
    - Inspection des fichiers de verrou de session et nettoyage des verrous obsolètes.
    - Réparation des transcriptions de session pour les branches dupliquées de réécriture de prompt créées par les builds 2026.4.24 concernés.
    - Vérifications d’intégrité et de permissions de l’état (sessions, transcriptions, répertoire d’état).
    - Vérifications des permissions du fichier de configuration (`chmod 600`) lors d’une exécution locale.
    - État de santé de l’authentification des modèles : vérifie l’expiration OAuth, peut rafraîchir les tokens proches de l’expiration et signale les états de cooldown/désactivation des profils d’authentification.
    - Détection d’un répertoire d’espace de travail supplémentaire (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services et superviseurs">
    - Réparation d’image sandbox lorsque le sandboxing est activé.
    - Migration de services hérités et détection de gateways supplémentaires.
    - Migration d’état hérité du canal Matrix (en mode `--fix` / `--repair`).
    - Vérifications d’exécution Gateway (service installé mais non lancé ; libellé launchd mis en cache).
    - Avertissements d’état des canaux (sondés depuis la gateway en cours d’exécution).
    - Audit de configuration de superviseur (launchd/systemd/schtasks) avec réparation facultative.
    - Vérifications des bonnes pratiques d’exécution Gateway (Node vs Bun, chemins de gestionnaire de version).
    - Diagnostics de collision de port Gateway (par défaut `18789`).

  </Accordion>
  <Accordion title="Authentification, sécurité et appairage">
    - Avertissements de sécurité pour les politiques DM ouvertes.
    - Vérifications d’authentification Gateway pour le mode token local (propose la génération de token lorsqu’aucune source de token n’existe ; n’écrase pas les configurations token SecretRef).
    - Détection des problèmes d’appairage d’appareil (premières demandes d’appairage en attente, mises à niveau de rôle/périmètre en attente, dérive obsolète du cache local de token d’appareil, et dérive d’authentification des enregistrements appairés).

  </Accordion>
  <Accordion title="Espace de travail et shell">
    - Vérification de linger systemd sous Linux.
    - Vérification de taille des fichiers bootstrap d’espace de travail (avertissements de troncature/proximité de limite pour les fichiers de contexte).
    - Vérification de l’état des complétions shell et installation/mise à niveau automatique.
    - Vérification de l’état de préparation du fournisseur d’embeddings pour la recherche Memory (modèle local, clé API distante ou binaire QMD).
    - Vérifications d’installation source (incohérence d’espace de travail pnpm, ressources UI manquantes, binaire tsx manquant).
    - Écrit la configuration mise à jour + les métadonnées d’assistant.

  </Accordion>
</AccordionGroup>

## Backfill et réinitialisation de l’interface Dreams

La scène Dreams de l’interface Control inclut les actions **Backfill**, **Reset** et **Clear Grounded** pour le workflow grounded de Dreaming. Ces actions utilisent des méthodes RPC de type doctor de gateway, mais elles **ne** font **pas** partie de la réparation/migration CLI `openclaw doctor`.

Ce qu’elles font :

- **Backfill** analyse les fichiers historiques `memory/YYYY-MM-DD.md` dans l’espace de travail actif, exécute la passe de journal REM grounded et écrit des entrées de backfill réversibles dans `DREAMS.md`.
- **Reset** supprime uniquement ces entrées de journal de backfill marquées de `DREAMS.md`.
- **Clear Grounded** supprime uniquement les entrées préparées de court terme uniquement grounded provenant de la relecture historique et n’ayant pas encore accumulé de rappel live ni de support quotidien.

Ce qu’elles ne font **pas** à elles seules :

- elles ne modifient pas `MEMORY.md`
- elles n’exécutent pas les migrations doctor complètes
- elles ne préparent pas automatiquement les candidats grounded dans le magasin live de promotion à court terme à moins que vous n’exécutiez d’abord explicitement le chemin CLI préparé

Si vous voulez que la relecture historique grounded influence la voie normale de promotion deep, utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela prépare des candidats durables grounded dans le magasin Dreaming à court terme tout en gardant `DREAMS.md` comme surface de revue.

## Comportement détaillé et justification

<AccordionGroup>
  <Accordion title="0. Mise à jour facultative (installations git)">
    S’il s’agit d’un checkout git et que doctor s’exécute en mode interactif, il propose une mise à jour (fetch/rebase/build) avant d’exécuter doctor.
  </Accordion>
  <Accordion title="1. Normalisation de configuration">
    Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction` sans remplacement spécifique à un canal), doctor les normalise vers le schéma actuel.

    Cela inclut les anciens champs plats Talk. La configuration Talk publique actuelle est `talk.provider` + `talk.providers.<provider>`. Doctor réécrit les anciennes formes `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` dans la table de fournisseurs.

  </Accordion>
  <Accordion title="2. Migrations de clés de configuration héritées">
    Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s’exécuter et demandent d’exécuter `openclaw doctor`.

    Doctor va :

    - Expliquer quelles clés héritées ont été trouvées.
    - Afficher la migration appliquée.
    - Réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

    La Gateway exécute aussi automatiquement les migrations doctor au démarrage lorsqu’elle détecte un format de configuration hérité, afin que les configurations obsolètes soient réparées sans intervention manuelle. Les migrations du magasin de tâches Cron sont gérées par `openclaw doctor --fix`.

    Migrations actuelles :

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de niveau supérieur
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - ancien `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` et `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` et `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` et `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` et `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Pour les canaux avec des `accounts` nommés mais des valeurs persistantes de canal à compte unique au niveau supérieur, déplacer ces valeurs à portée de compte dans le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut conserver une cible nommée/par défaut correspondante existante)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - suppression de `browser.relayBindHost` (ancien paramètre de relais d’extension)

    Les avertissements doctor incluent aussi des recommandations sur les comptes par défaut pour les canaux multi-comptes :

    - Si au moins deux entrées `channels.<channel>.accounts` sont configurées sans `channels.<channel>.defaultAccount` ni `accounts.default`, doctor avertit que le routage de secours peut choisir un compte inattendu.
    - Si `channels.<channel>.defaultAccount` est défini sur un identifiant de compte inconnu, doctor avertit et liste les identifiants de compte configurés.

  </Accordion>
  <Accordion title="2b. Remplacements de fournisseur OpenCode">
    Si vous avez ajouté manuellement `models.providers.opencode`, `opencode-zen` ou `opencode-go`, cela remplace le catalogue OpenCode intégré provenant de `@mariozechner/pi-ai`. Cela peut forcer des modèles vers la mauvaise API ou remettre les coûts à zéro. Doctor avertit afin que vous puissiez supprimer le remplacement et rétablir le routage API par modèle + les coûts.
  </Accordion>
  <Accordion title="2c. Migration Browser et état de préparation Chrome MCP">
    Si votre configuration Browser pointe encore vers le chemin supprimé de l’extension Chrome, doctor la normalise vers le modèle actuel d’attachement Chrome MCP local à l’hôte :

    - `browser.profiles.*.driver: "extension"` devient `"existing-session"`
    - `browser.relayBindHost` est supprimé

    Doctor audite aussi le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile: "user"` ou un profil `existing-session` configuré :

    - vérifie si Google Chrome est installé sur le même hôte pour les profils par défaut en connexion automatique
    - vérifie la version détectée de Chrome et avertit lorsqu’elle est inférieure à Chrome 144
    - rappelle d’activer le débogage à distance dans la page inspect du navigateur (par exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    Doctor ne peut pas activer ce paramètre côté Chrome pour vous. Le Chrome MCP local à l’hôte exige toujours :

    - un navigateur basé sur Chromium 144+ sur l’hôte gateway/node
    - le navigateur exécuté localement
    - le débogage à distance activé dans ce navigateur
    - l’approbation de la première invite de consentement d’attachement dans le navigateur

    L’état de préparation ici concerne uniquement les prérequis d’attachement local. `existing-session` conserve les limites actuelles des routes Chrome MCP ; les routes avancées comme `responsebody`, l’export PDF, l’interception de téléchargement et les actions par lots nécessitent toujours un navigateur géré ou un profil CDP brut.

    Cette vérification ne s’applique **pas** à Docker, au sandbox, au navigateur distant ni aux autres flux headless. Ceux-ci continuent d’utiliser un CDP brut.

  </Accordion>
  <Accordion title="2d. Prérequis TLS OAuth">
    Lorsqu’un profil OAuth OpenAI Codex est configuré, doctor sonde le point de terminaison d’autorisation OpenAI pour vérifier que la pile TLS locale Node/OpenSSL peut valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificat expiré ou certificat autosigné), doctor affiche une procédure de correction spécifique à la plateforme. Sur macOS avec un Node Homebrew, la correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute même si la gateway est saine.
  </Accordion>
  <Accordion title="2e. Remplacements de fournisseur Codex OAuth">
    Si vous avez précédemment ajouté des paramètres de transport OpenAI hérités sous `models.providers.openai-codex`, ils peuvent masquer le chemin du fournisseur Codex OAuth intégré que les versions récentes utilisent automatiquement. Doctor avertit lorsqu’il voit ces anciens paramètres de transport en même temps que Codex OAuth afin que vous puissiez supprimer ou réécrire le remplacement de transport obsolète et retrouver le comportement intégré de routage/secours. Les proxys personnalisés et les remplacements limités aux en-têtes restent pris en charge et ne déclenchent pas cet avertissement.
  </Accordion>
  <Accordion title="2f. Avertissements de route du plugin Codex">
    Lorsque le plugin Codex intégré est activé, doctor vérifie aussi si les références de modèle principal `openai-codex/*` se résolvent encore via le runner PI par défaut. Cette combinaison est valide lorsque vous voulez une authentification Codex OAuth/abonnement via PI, mais elle est facile à confondre avec le harnais natif de serveur d’application Codex. Doctor avertit et indique la forme explicite du serveur d’application : `openai/*` plus `agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor ne répare pas cela automatiquement car les deux routes sont valides :

    - `openai-codex/*` + PI signifie « utiliser l’authentification Codex OAuth/abonnement via le runner OpenClaw normal. »
    - `openai/*` + `runtime: "codex"` signifie « exécuter le tour intégré via le serveur d’application Codex natif. »
    - `/codex ...` signifie « contrôler ou lier une conversation Codex native depuis le chat. »
    - `/acp ...` ou `runtime: "acp"` signifie « utiliser l’adaptateur ACP/acpx externe. »

    Si l’avertissement apparaît, choisissez la route voulue et modifiez la configuration manuellement. Conservez l’avertissement tel quel lorsque PI Codex OAuth est intentionnel.

  </Accordion>
  <Accordion title="3. Migrations d’état héritées (disposition disque)">
    Doctor peut migrer les anciennes dispositions sur disque vers la structure actuelle :

    - Magasin de sessions + transcriptions :
      - de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
    - Répertoire d’agent :
      - de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
    - État d’authentification WhatsApp (Baileys) :
      - depuis l’ancien `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
      - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (identifiant de compte par défaut : `default`)

    Ces migrations sont faites au mieux et idempotentes ; doctor émet des avertissements lorsqu’il laisse des dossiers hérités derrière lui comme sauvegardes. La Gateway/le CLI migrent aussi automatiquement les anciennes sessions + le répertoire d’agent au démarrage afin que l’historique/l’authentification/les modèles arrivent dans le chemin par agent sans exécution manuelle de doctor. L’authentification WhatsApp n’est intentionnellement migrée que via `openclaw doctor`. La normalisation du fournisseur/de la table de fournisseurs Talk compare désormais par égalité structurelle, de sorte que les différences d’ordre de clés seules ne déclenchent plus de changements répétés sans effet de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrations héritées du manifeste de plugin">
    Doctor analyse tous les manifestes de plugins installés à la recherche de clés de capacité obsolètes au niveau supérieur (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Lorsqu’elles sont trouvées, il propose de les déplacer dans l’objet `contracts` et de réécrire le fichier manifeste sur place. Cette migration est idempotente ; si la clé `contracts` contient déjà les mêmes valeurs, la clé héritée est supprimée sans dupliquer les données.
  </Accordion>
  <Accordion title="3b. Migrations héritées du magasin Cron">
    Doctor vérifie aussi le magasin de tâches Cron (`~/.openclaw/cron/jobs.json` par défaut, ou `cron.store` s’il est remplacé) à la recherche d’anciennes formes de tâches que le planificateur accepte encore pour des raisons de compatibilité.

    Nettoyages Cron actuels :

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - champs de charge utile de niveau supérieur (`message`, `model`, `thinking`, ...) → `payload`
    - champs de livraison de niveau supérieur (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de livraison `provider` dans la charge utile → `delivery.channel` explicite
    - anciennes tâches simples de secours Webhook `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

    Doctor ne migre automatiquement les tâches `notify: true` que lorsqu’il peut le faire sans changer le comportement. Si une tâche combine un ancien secours notify avec un mode de livraison non Webhook existant, doctor avertit et laisse cette tâche à une revue manuelle.

  </Accordion>
  <Accordion title="3c. Nettoyage des verrous de session">
    Doctor analyse chaque répertoire de session d’agent à la recherche de fichiers de verrou d’écriture obsolètes — fichiers laissés derrière lorsqu’une session s’est terminée anormalement. Pour chaque fichier de verrou trouvé, il signale : le chemin, le PID, si le PID est encore vivant, l’âge du verrou, et s’il est considéré comme obsolète (PID mort ou plus de 30 minutes). En mode `--fix` / `--repair`, il supprime automatiquement les fichiers de verrou obsolètes ; sinon, il affiche une note et vous demande de relancer avec `--fix`.
  </Accordion>
  <Accordion title="3d. Réparation des branches de transcription de session">
    Doctor analyse les fichiers JSONL de session d’agent pour détecter la forme de branche dupliquée créée par le bug de réécriture de transcription de prompt de 2026.4.24 : un tour utilisateur abandonné avec le contexte d’exécution interne OpenClaw et un frère actif contenant le même prompt utilisateur visible. En mode `--fix` / `--repair`, doctor sauvegarde chaque fichier concerné à côté de l’original et réécrit la transcription vers la branche active afin que l’historique gateway et les lecteurs de Memory ne voient plus de tours dupliqués.
  </Accordion>
  <Accordion title="4. Vérifications d’intégrité de l’état (persistance de session, routage et sécurité)">
    Le répertoire d’état est le tronc cérébral opérationnel. S’il disparaît, vous perdez les sessions, identifiants d’accès, journaux et configuration (sauf si vous avez des sauvegardes ailleurs).

    Doctor vérifie :

    - **Répertoire d’état manquant** : avertit d’une perte d’état catastrophique, propose de recréer le répertoire et rappelle qu’il ne peut pas récupérer les données manquantes.
    - **Permissions du répertoire d’état** : vérifie l’accès en écriture ; propose de réparer les permissions (et émet une indication `chown` lorsqu’une incohérence propriétaire/groupe est détectée).
    - **Répertoire d’état synchronisé par le cloud sous macOS** : avertit lorsque l’état se résout sous iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...` car les chemins synchronisés peuvent provoquer des E/S plus lentes et des courses de verrouillage/synchronisation.
    - **Répertoire d’état sur SD ou eMMC sous Linux** : avertit lorsque l’état se résout vers une source de montage `mmcblk*`, car les E/S aléatoires sur SD ou eMMC peuvent être plus lentes et user plus vite sous les écritures de sessions et d’identifiants d’accès.
    - **Répertoires de session manquants** : `sessions/` et le répertoire du magasin de sessions sont nécessaires pour persister l’historique et éviter les plantages `ENOENT`.
    - **Incohérence de transcription** : avertit lorsque des entrées de session récentes ont des fichiers de transcription manquants.
    - **Session principale « JSONL sur 1 ligne »** : signale lorsque la transcription principale n’a qu’une ligne (l’historique ne s’accumule pas).
    - **Multiples répertoires d’état** : avertit lorsque plusieurs dossiers `~/.openclaw` existent dans différents répertoires personnels ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut se fragmenter entre installations).
    - **Rappel du mode distant** : si `gateway.mode=remote`, doctor rappelle qu’il faut l’exécuter sur l’hôte distant (l’état s’y trouve).
    - **Permissions du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est lisible par le groupe/le monde et propose de le restreindre à `600`.

  </Accordion>
  <Accordion title="5. État de santé de l’authentification des modèles (expiration OAuth)">
    Doctor inspecte les profils OAuth dans le magasin d’authentification, avertit lorsque les tokens approchent de l’expiration/sont expirés, et peut les rafraîchir lorsque c’est sûr. Si le profil OAuth/token Anthropic est obsolète, il suggère une clé API Anthropic ou le chemin du token de configuration Anthropic. Les invites de rafraîchissement n’apparaissent qu’en mode interactif (TTY) ; `--non-interactive` ignore les tentatives de rafraîchissement.

    Lorsqu’un rafraîchissement OAuth échoue de façon permanente (par exemple `refresh_token_reused`, `invalid_grant`, ou lorsqu’un fournisseur vous demande de vous reconnecter), doctor indique qu’une réauthentification est requise et affiche la commande exacte `openclaw models auth login --provider ...` à exécuter.

    Doctor signale aussi les profils d’authentification temporairement inutilisables à cause de :

    - cooldowns courts (limitations de débit/délais d’attente/échecs d’authentification)
    - désactivations plus longues (échecs de facturation/crédit)

  </Accordion>
  <Accordion title="6. Validation du modèle de hooks">
    Si `hooks.gmail.model` est défini, doctor valide la référence du modèle par rapport au catalogue et à l’allowlist, et avertit lorsqu’elle ne se résoudra pas ou n’est pas autorisée.
  </Accordion>
  <Accordion title="7. Réparation d’image sandbox">
    Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de construire ou de basculer vers les anciens noms si l’image actuelle est manquante.
  </Accordion>
  <Accordion title="7b. Dépendances d’exécution des plugins intégrés">
    Doctor vérifie les dépendances d’exécution uniquement pour les plugins intégrés actifs dans la configuration actuelle ou activés par la valeur par défaut de leur manifeste intégré, par exemple `plugins.entries.discord.enabled: true`, l’ancien `channels.discord.enabled: true`, ou un fournisseur intégré activé par défaut. S’il en manque, doctor signale les packages et les installe en mode `openclaw doctor --fix` / `openclaw doctor --repair`. Les plugins externes continuent d’utiliser `openclaw plugins install` / `openclaw plugins update` ; doctor n’installe pas les dépendances pour des chemins de plugin arbitraires.

    La Gateway et le CLI local peuvent aussi réparer à la demande les dépendances d’exécution des plugins intégrés actifs avant d’importer un plugin intégré. Ces installations sont limitées à la racine d’installation d’exécution du plugin, s’exécutent avec les scripts désactivés, n’écrivent pas de verrou package, et sont protégées par un verrou de racine d’installation afin que les démarrages concurrents du CLI ou de la Gateway ne modifient pas le même arbre `node_modules` au même moment.

  </Accordion>
  <Accordion title="8. Migrations de service Gateway et conseils de nettoyage">
    Doctor détecte les anciens services gateway (launchd/systemd/schtasks) et propose de les supprimer puis d’installer le service OpenClaw en utilisant le port gateway actuel. Il peut aussi analyser la présence de services supplémentaires ressemblant à une gateway et afficher des conseils de nettoyage. Les services gateway OpenClaw nommés par profil sont considérés comme de première classe et ne sont pas signalés comme « supplémentaires ».
  </Accordion>
  <Accordion title="8b. Migration Matrix au démarrage">
    Lorsqu’un compte de canal Matrix présente une migration d’état héritée en attente ou exploitable, doctor (en mode `--fix` / `--repair`) crée un instantané pré-migration puis exécute les étapes de migration au mieux : migration de l’état Matrix hérité et préparation de l’état chiffré hérité. Les deux étapes ne sont pas fatales ; les erreurs sont journalisées et le démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`), cette vérification est entièrement ignorée.
  </Accordion>
  <Accordion title="8c. Appairage d’appareil et dérive d’authentification">
    Doctor inspecte désormais l’état d’appairage des appareils dans le cadre du passage normal de vérification d’état.

    Ce qu’il signale :

    - demandes d’appairage initial en attente
    - mises à niveau de rôle en attente pour des appareils déjà appairés
    - mises à niveau de périmètre en attente pour des appareils déjà appairés
    - réparations d’incohérence de clé publique lorsque l’identifiant d’appareil correspond toujours mais que l’identité de l’appareil ne correspond plus à l’enregistrement approuvé
    - enregistrements appairés sans token actif pour un rôle approuvé
    - tokens appairés dont les périmètres dérivent en dehors de la base approuvée d’appairage
    - entrées locales mises en cache de token d’appareil pour la machine actuelle qui précèdent une rotation de token côté gateway ou portent des métadonnées de périmètre obsolètes

    Doctor n’approuve pas automatiquement les demandes d’appairage ni ne fait tourner automatiquement les tokens d’appareil. Il affiche à la place les étapes exactes suivantes :

    - inspecter les demandes en attente avec `openclaw devices list`
    - approuver la demande exacte avec `openclaw devices approve <requestId>`
    - faire tourner un nouveau token avec `openclaw devices rotate --device <deviceId> --role <role>`
    - supprimer puis réapprouver un enregistrement obsolète avec `openclaw devices remove <deviceId>`

    Cela corrige le cas fréquent « déjà appairé mais reçoit encore pairing required » : doctor distingue maintenant l’appairage initial des mises à niveau de rôle/périmètre en attente et de la dérive d’un token/identité d’appareil obsolète.

  </Accordion>
  <Accordion title="9. Avertissements de sécurité">
    Doctor émet des avertissements lorsqu’un fournisseur est ouvert aux DM sans allowlist, ou lorsqu’une politique est configurée d’une manière dangereuse.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    En cas d’exécution comme service utilisateur systemd, doctor s’assure que lingering est activé afin que la gateway reste active après la déconnexion.
  </Accordion>
  <Accordion title="11. État de l’espace de travail (Skills, plugins et répertoires hérités)">
    Doctor affiche un résumé de l’état de l’espace de travail pour l’agent par défaut :

    - **État des Skills** : nombre de Skills éligibles, avec exigences manquantes et bloqués par allowlist.
    - **Répertoires d’espace de travail hérités** : avertit lorsque `~/openclaw` ou d’autres anciens répertoires d’espace de travail existent à côté de l’espace de travail actuel.
    - **État des plugins** : nombre de plugins activés/désactivés/en erreur ; liste les identifiants de plugin pour toute erreur ; signale les capacités des plugins intégrés.
    - **Avertissements de compatibilité de plugin** : signale les plugins présentant des problèmes de compatibilité avec l’environnement d’exécution actuel.
    - **Diagnostics de plugins** : expose les avertissements ou erreurs de chargement émis par le registre de plugins.

  </Accordion>
  <Accordion title="11b. Taille des fichiers bootstrap">
    Doctor vérifie si les fichiers bootstrap de l’espace de travail (par exemple `AGENTS.md`, `CLAUDE.md` ou d’autres fichiers de contexte injectés) sont proches ou au-delà du budget de caractères configuré. Il signale, pour chaque fichier, le nombre brut de caractères vs le nombre injecté, le pourcentage de troncature, la cause de la troncature (`max/file` ou `max/total`) et le total injecté en fraction du budget total. Lorsque les fichiers sont tronqués ou proches de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars` et `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Complétion shell">
    Doctor vérifie si la complétion par tabulation est installée pour le shell actuel (zsh, bash, fish ou PowerShell) :

    - Si le profil shell utilise un modèle lent de complétion dynamique (`source <(openclaw completion ...)`), doctor le met à niveau vers la variante plus rapide fondée sur un fichier en cache.
    - Si la complétion est configurée dans le profil mais que le fichier cache est manquant, doctor régénère automatiquement le cache.
    - Si aucune complétion n’est configurée, doctor propose de l’installer (mode interactif uniquement ; ignoré avec `--non-interactive`).

    Exécutez `openclaw completion --write-state` pour régénérer manuellement le cache.

  </Accordion>
  <Accordion title="12. Vérifications d’authentification Gateway (token local)">
    Doctor vérifie l’état de préparation de l’authentification par token de la gateway locale.

    - Si le mode token a besoin d’un token et qu’aucune source n’existe, doctor propose d’en générer un.
    - Si `gateway.auth.token` est géré par SecretRef mais indisponible, doctor avertit et ne l’écrase pas avec du texte brut.
    - `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucun token SecretRef n’est configuré.

  </Accordion>
  <Accordion title="12b. Réparations en lecture seule compatibles SecretRef">
    Certains flux de réparation doivent inspecter les identifiants d’accès configurés sans affaiblir le comportement d’échec rapide à l’exécution.

    - `openclaw doctor --fix` utilise désormais le même modèle récapitulatif SecretRef en lecture seule que les commandes de la famille status pour les réparations de configuration ciblées.
    - Exemple : la réparation Telegram `allowFrom` / `groupAllowFrom` `@username` tente d’utiliser les identifiants du bot configurés lorsqu’ils sont disponibles.
    - Si le token du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, doctor signale que l’identifiant d’accès est configuré mais indisponible et ignore l’autorésolution au lieu de planter ou de signaler à tort le token comme manquant.

  </Accordion>
  <Accordion title="13. Vérification d’état Gateway + redémarrage">
    Doctor exécute une vérification d’état et propose de redémarrer la gateway lorsqu’elle semble en mauvais état.
  </Accordion>
  <Accordion title="13b. État de préparation de la recherche Memory">
    Doctor vérifie si le fournisseur d’embeddings configuré pour la recherche Memory est prêt pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

    - **Backend QMD** : vérifie si le binaire `qmd` est disponible et peut démarrer. Sinon, affiche des indications de correction incluant le package npm et une option manuelle de chemin du binaire.
    - **Fournisseur local explicite** : vérifie la présence d’un fichier de modèle local ou d’une URL de modèle distante/téléchargeable reconnue. S’il manque, suggère de basculer vers un fournisseur distant.
    - **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie la présence d’une clé API dans l’environnement ou le magasin d’authentification. Affiche des indications de correction exploitables si elle manque.
    - **Fournisseur auto** : vérifie d’abord la disponibilité du modèle local, puis essaie chaque fournisseur distant dans l’ordre de sélection automatique.

    Lorsqu’un résultat de sonde gateway est disponible (la gateway était saine au moment de la vérification), doctor le recoupe avec la configuration visible par le CLI et signale toute divergence.

    Utilisez `openclaw memory status --deep` pour vérifier l’état de préparation des embeddings à l’exécution.

  </Accordion>
  <Accordion title="14. Avertissements d’état des canaux">
    Si la gateway est saine, doctor exécute une sonde d’état des canaux et signale les avertissements avec des corrections suggérées.
  </Accordion>
  <Accordion title="15. Audit + réparation de la configuration du superviseur">
    Doctor vérifie la configuration de superviseur installée (launchd/systemd/schtasks) pour détecter des valeurs par défaut manquantes ou obsolètes (par exemple les dépendances `network-online` de systemd et le délai de redémarrage). Lorsqu’il détecte une incohérence, il recommande une mise à jour et peut réécrire le fichier service/la tâche selon les valeurs par défaut actuelles.

    Remarques :

    - `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
    - `openclaw doctor --yes` accepte les invites de réparation par défaut.
    - `openclaw doctor --repair` applique les corrections recommandées sans invite.
    - `openclaw doctor --repair --force` écrase les configurations personnalisées du superviseur.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` garde doctor en lecture seule pour le cycle de vie du service gateway. Il continue de signaler l’état du service et d’exécuter les réparations hors service, mais ignore l’installation/le démarrage/le redémarrage/bootstrap du service, les réécritures de configuration du superviseur et le nettoyage des anciens services, car un superviseur externe gère ce cycle de vie.
    - Si l’authentification par token exige un token et que `gateway.auth.token` est géré par SecretRef, l’installation/réparation du service par doctor valide le SecretRef mais ne persiste pas les valeurs résolues en texte brut du token dans les métadonnées d’environnement du service superviseur.
    - Si l’authentification par token exige un token et que le token SecretRef configuré n’est pas résolu, doctor bloque le chemin d’installation/réparation avec des indications exploitables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation/réparation jusqu’à ce que le mode soit explicitement défini.
    - Pour les unités systemd utilisateur Linux, les vérifications de dérive de token par doctor incluent désormais à la fois les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
    - Les réparations de service par doctor refusent de réécrire, arrêter ou redémarrer un service gateway issu d’un ancien binaire OpenClaw lorsque la configuration a été écrite pour la dernière fois par une version plus récente. Voir [Dépannage Gateway](/fr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostics d’exécution + de port Gateway">
    Doctor inspecte l’environnement d’exécution du service (PID, dernier statut de sortie) et avertit lorsque le service est installé mais pas réellement en cours d’exécution. Il vérifie aussi les collisions de port sur le port gateway (par défaut `18789`) et signale les causes probables (gateway déjà en cours, tunnel SSH).
  </Accordion>
  <Accordion title="17. Bonnes pratiques d’exécution Gateway">
    Doctor avertit lorsque le service gateway s’exécute sur Bun ou sur un chemin Node géré par un gestionnaire de version (`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram nécessitent Node, et les chemins de gestionnaire de version peuvent se casser après une mise à niveau parce que le service ne charge pas l’initialisation de votre shell. Doctor propose de migrer vers une installation Node système lorsqu’elle est disponible (Homebrew/apt/choco).
  </Accordion>
  <Accordion title="18. Écriture de config + métadonnées d’assistant">
    Doctor persiste les modifications de configuration et appose des métadonnées d’assistant pour enregistrer l’exécution de doctor.
  </Accordion>
  <Accordion title="19. Conseils pour l’espace de travail (sauvegarde + système Memory)">
    Doctor suggère un système Memory pour l’espace de travail lorsqu’il manque et affiche un conseil de sauvegarde si l’espace de travail n’est pas déjà sous git.

    Voir [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet sur la structure d’espace de travail et la sauvegarde git (GitHub ou GitLab privé recommandé).

  </Accordion>
</AccordionGroup>

## Lié

- [Runbook Gateway](/fr/gateway)
- [Dépannage Gateway](/fr/gateway/troubleshooting)
