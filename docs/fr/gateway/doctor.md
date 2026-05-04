---
read_when:
    - Ajout ou modification de migrations doctor
    - Présentation des changements de configuration incompatibles
sidebarTitle: Doctor
summary: 'Commande Doctor : vérifications de santé, migrations de configuration et étapes de réparation'
title: Diagnostic
x-i18n:
    generated_at: "2026-05-04T09:37:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bc8615f5e49e8c20785a9dc9779c447fd0d5794c80663d2396b0a20b4187798
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` est l’outil de réparation et de migration pour OpenClaw. Il corrige les configurations/états obsolètes, vérifie l’intégrité et fournit des étapes de réparation exploitables.

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

    Accepte les valeurs par défaut sans invite (y compris les étapes de réparation liées au redémarrage, au service ou au bac à sable le cas échéant).

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

    Applique aussi les réparations agressives (écrase les configurations de superviseur personnalisées).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    S’exécute sans invite et applique uniquement les migrations sûres (normalisation de configuration + déplacements d’état sur disque). Ignore les actions de redémarrage, de service ou de bac à sable qui nécessitent une confirmation humaine. Les migrations d’état héritées s’exécutent automatiquement lorsqu’elles sont détectées.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Analyse les services système pour trouver des installations Gateway supplémentaires (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si vous voulez examiner les modifications avant l’écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Ce qu’il fait (résumé)

<AccordionGroup>
  <Accordion title="Santé, interface utilisateur et mises à jour">
    - Mise à jour préalable facultative pour les installations git (mode interactif uniquement).
    - Vérification de fraîcheur du protocole d’interface utilisateur (reconstruit Control UI lorsque le schéma de protocole est plus récent).
    - Vérification de santé + invite de redémarrage.
    - Résumé d’état des Skills (éligibles/manquants/bloqués) et état des plugins.

  </Accordion>
  <Accordion title="Configuration et migrations">
    - Normalisation de configuration pour les valeurs héritées.
    - Migration de configuration Talk depuis les anciens champs plats `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
    - Vérifications de migration du navigateur pour les anciennes configurations d’extension Chrome et la préparation de Chrome MCP.
    - Avertissements de remplacement du fournisseur OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avertissements de masquage OAuth Codex (`models.providers.openai-codex`).
    - Vérification des prérequis TLS OAuth pour les profils OAuth OpenAI Codex.
    - Avertissements de liste d’autorisation de plugins/outils lorsque `plugins.allow` est restrictive mais que la stratégie d’outils demande encore un caractère générique ou des outils appartenant à un plugin.
    - Migration de l’état hérité sur disque (sessions/répertoire agent/authentification WhatsApp).
    - Migration des clés de contrat de manifeste de Plugin héritées (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration de l’ancien magasin cron (`jobId`, `schedule.cron`, champs de livraison/payload de premier niveau, payload `provider`, jobs de secours Webhook simples `notify: true`).
    - Migration de l’ancienne stratégie d’exécution des agents vers `agents.defaults.agentRuntime` et `agents.list[].agentRuntime`.
    - Nettoyage de configuration de plugin obsolète lorsque les plugins sont activés ; lorsque `plugins.enabled=false`, les références de plugin obsolètes sont traitées comme une configuration de confinement inerte et sont conservées.

  </Accordion>
  <Accordion title="État et intégrité">
    - Inspection des fichiers de verrouillage de session et nettoyage des verrous obsolètes.
    - Réparation des transcriptions de session pour les branches de réécriture de prompt dupliquées créées par les builds 2026.4.24 affectés.
    - Détection des tombstones de récupération au redémarrage de sous-agents bloqués, avec prise en charge de `--fix` pour effacer les indicateurs de récupération abandonnée obsolètes afin que le démarrage ne continue pas à traiter l’enfant comme abandonné au redémarrage.
    - Vérifications d’intégrité d’état et de permissions (sessions, transcriptions, répertoire d’état).
    - Vérifications des permissions du fichier de configuration (chmod 600) lors d’une exécution locale.
    - Santé de l’authentification des modèles : vérifie l’expiration OAuth, peut actualiser les jetons proches de l’expiration et signale les états de cooldown/désactivation des profils d’authentification.
    - Détection de répertoire d’espace de travail supplémentaire (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services et superviseurs">
    - Réparation de l’image du bac à sable lorsque le sandboxing est activé.
    - Migration des services hérités et détection de Gateways supplémentaires.
    - Migration de l’état hérité du canal Matrix (en mode `--fix` / `--repair`).
    - Vérifications d’exécution Gateway (service installé mais non démarré ; libellé launchd mis en cache).
    - Avertissements d’état des canaux (sondés depuis le Gateway en cours d’exécution).
    - Audit de configuration de superviseur (launchd/systemd/schtasks) avec réparation facultative.
    - Nettoyage de l’environnement proxy intégré pour les services Gateway qui ont capturé les valeurs shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` pendant l’installation ou la mise à jour.
    - Vérifications de bonnes pratiques d’exécution Gateway (Node contre Bun, chemins de gestionnaires de versions).
    - Diagnostics de collision de port Gateway (par défaut `18789`).

  </Accordion>
  <Accordion title="Authentification, sécurité et appairage">
    - Avertissements de sécurité pour les stratégies de messages directs ouvertes.
    - Vérifications d’authentification Gateway pour le mode jeton local (propose la génération de jeton lorsqu’aucune source de jeton n’existe ; n’écrase pas les configurations SecretRef de jeton).
    - Détection des problèmes d’appairage d’appareil (demandes de premier appairage en attente, mises à niveau de rôle/portée en attente, dérive du cache local de jetons d’appareil obsolète et dérive d’authentification des enregistrements appairés).

  </Accordion>
  <Accordion title="Espace de travail et shell">
    - Vérification systemd linger sous Linux.
    - Vérification de taille des fichiers d’amorçage de l’espace de travail (avertissements de troncature/proximité de limite pour les fichiers de contexte).
    - Vérification de préparation des Skills pour l’agent par défaut ; signale les compétences autorisées avec bins, env, config ou exigences d’OS manquants, et `--fix` peut désactiver les compétences indisponibles dans `skills.entries`.
    - Vérification de l’état de l’autocomplétion shell et installation/mise à niveau automatique.
    - Vérification de préparation du fournisseur d’embeddings de recherche mémoire (modèle local, clé d’API distante ou binaire QMD).
    - Vérifications d’installation depuis les sources (incompatibilité d’espace de travail pnpm, assets d’interface utilisateur manquants, binaire tsx manquant).
    - Écrit la configuration mise à jour + les métadonnées de l’assistant.

  </Accordion>
</AccordionGroup>

## Remplissage rétroactif et réinitialisation de l’interface Dreams

La scène Dreams de Control UI inclut les actions **Backfill**, **Reset** et **Clear Grounded** pour le workflow de Dreaming ancré. Ces actions utilisent des méthodes RPC de style Gateway doctor, mais elles ne font **pas** partie de la réparation/migration de la CLI `openclaw doctor`.

Ce qu’elles font :

- **Backfill** analyse les fichiers historiques `memory/YYYY-MM-DD.md` dans l’espace de travail actif, exécute la passe de journal REM ancrée et écrit des entrées de remplissage rétroactif réversibles dans `DREAMS.md`.
- **Reset** supprime uniquement ces entrées de journal de remplissage rétroactif marquées dans `DREAMS.md`.
- **Clear Grounded** supprime uniquement les entrées court terme ancrées seulement, préparées à partir de la relecture historique, qui n’ont pas encore accumulé de rappel en direct ni de support quotidien.

Ce qu’elles ne font **pas** seules :

- elles ne modifient pas `MEMORY.md`
- elles n’exécutent pas les migrations complètes de doctor
- elles ne préparent pas automatiquement les candidats ancrés dans le magasin de promotion court terme en direct, sauf si vous exécutez d’abord explicitement le chemin CLI préparé

Si vous voulez que la relecture historique ancrée influence la voie normale de promotion profonde, utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela prépare les candidats durables ancrés dans le magasin de Dreaming court terme tout en gardant `DREAMS.md` comme surface d’examen.

## Comportement détaillé et justification

<AccordionGroup>
  <Accordion title="0. Mise à jour facultative (installations git)">
    S’il s’agit d’un checkout git et que doctor s’exécute en mode interactif, il propose une mise à jour (fetch/rebase/build) avant d’exécuter doctor.
  </Accordion>
  <Accordion title="1. Normalisation de configuration">
    Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction` sans remplacement propre à un canal), doctor les normalise dans le schéma actuel.

    Cela inclut les anciens champs plats Talk. La configuration publique Talk actuelle est `talk.provider` + `talk.providers.<provider>`. Doctor réécrit les anciennes formes `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` dans la carte des fournisseurs.

    Doctor avertit aussi lorsque `plugins.allow` n’est pas vide et que la stratégie d’outils utilise
    des entrées d’outils génériques ou appartenant à un plugin. `tools.allow: ["*"]` ne correspond qu’aux outils
    des plugins réellement chargés ; cela ne contourne pas la liste d’autorisation exclusive
    des plugins.

  </Accordion>
  <Accordion title="2. Migrations de clés de configuration héritées">
    Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s’exécuter et vous demandent d’exécuter `openclaw doctor`.

    Doctor va :

    - Expliquer quelles clés héritées ont été trouvées.
    - Afficher la migration appliquée.
    - Réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

    Le Gateway exécute aussi automatiquement les migrations doctor au démarrage lorsqu’il détecte un format de configuration hérité, afin que les configurations obsolètes soient réparées sans intervention manuelle. Les migrations du magasin de jobs Cron sont gérées par `openclaw doctor --fix`.

    Migrations actuelles :

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - configurations de canaux configurés sans politique de réponse visible → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de niveau supérieur
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - anciens `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - Pour les canaux avec des `accounts` nommés, mais où persistent des valeurs de canal de niveau supérieur à compte unique, déplacer ces valeurs propres au compte dans le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut conserver une cible nommée/par défaut correspondante existante)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - supprimer `agents.defaults.llm` ; utiliser `models.providers.<id>.timeoutSeconds` pour les délais d’expiration de fournisseurs/modèles lents
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - supprimer `browser.relayBindHost` (ancien paramètre de relais d’extension)
    - ancien `models.providers.*.api: "openai"` → `"openai-completions"` (le démarrage du Gateway ignore aussi les fournisseurs dont `api` est défini sur une valeur d’énumération future ou inconnue au lieu d’échouer en mode fermé)

    Les avertissements de doctor incluent aussi des consignes de compte par défaut pour les canaux à plusieurs comptes :

    - Si deux entrées `channels.<channel>.accounts` ou plus sont configurées sans `channels.<channel>.defaultAccount` ni `accounts.default`, doctor avertit que le routage de secours peut choisir un compte inattendu.
    - Si `channels.<channel>.defaultAccount` est défini sur un ID de compte inconnu, doctor avertit et liste les ID de comptes configurés.

  </Accordion>
  <Accordion title="2b. Remplacements de fournisseurs OpenCode">
    Si vous avez ajouté `models.providers.opencode`, `opencode-zen` ou `opencode-go` manuellement, cela remplace le catalogue OpenCode intégré de `@mariozechner/pi-ai`. Cela peut forcer des modèles à utiliser la mauvaise API ou remettre les coûts à zéro. Doctor avertit afin que vous puissiez supprimer le remplacement et restaurer le routage d’API + les coûts par modèle.
  </Accordion>
  <Accordion title="2c. Migration du navigateur et préparation Chrome MCP">
    Si votre configuration de navigateur pointe encore vers le chemin de l’extension Chrome supprimée, doctor la normalise vers le modèle actuel d’attachement Chrome MCP local à l’hôte :

    - `browser.profiles.*.driver: "extension"` devient `"existing-session"`
    - `browser.relayBindHost` est supprimé

    Doctor audite aussi le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile: "user"` ou un profil `existing-session` configuré :

    - vérifie si Google Chrome est installé sur le même hôte pour les profils de connexion automatique par défaut
    - vérifie la version de Chrome détectée et avertit lorsqu’elle est inférieure à Chrome 144
    - vous rappelle d’activer le débogage à distance dans la page d’inspection du navigateur (par exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    Doctor ne peut pas activer le paramètre côté Chrome à votre place. Chrome MCP local à l’hôte nécessite toujours :

    - un navigateur basé sur Chromium 144+ sur l’hôte gateway/node
    - le navigateur exécuté localement
    - le débogage à distance activé dans ce navigateur
    - l’approbation de la première invite de consentement d’attachement dans le navigateur

    La préparation ici concerne uniquement les prérequis d’attachement local. Existing-session conserve les limites actuelles des routes Chrome MCP ; les routes avancées comme `responsebody`, l’export PDF, l’interception des téléchargements et les actions par lots nécessitent toujours un navigateur géré ou un profil CDP brut.

    Cette vérification ne s’applique **pas** à Docker, au sandbox, au navigateur distant ni aux autres flux headless. Ceux-ci continuent d’utiliser CDP brut.

  </Accordion>
  <Accordion title="2d. Prérequis TLS OAuth">
    Lorsqu’un profil OAuth OpenAI Codex est configuré, doctor sonde le point de terminaison d’autorisation OpenAI pour vérifier que la pile TLS Node/OpenSSL locale peut valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificat expiré ou certificat autosigné), doctor affiche des consignes de correction propres à la plateforme. Sur macOS avec un Node Homebrew, la correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute même si le gateway est sain.
  </Accordion>
  <Accordion title="2e. Remplacements du fournisseur OAuth Codex">
    Si vous avez précédemment ajouté d’anciens paramètres de transport OpenAI sous `models.providers.openai-codex`, ils peuvent masquer le chemin du fournisseur OAuth Codex intégré que les versions récentes utilisent automatiquement. Doctor avertit lorsqu’il détecte ces anciens paramètres de transport avec Codex OAuth afin que vous puissiez supprimer ou réécrire le remplacement de transport obsolète et récupérer le comportement de routage/secours intégré. Les proxys personnalisés et les remplacements limités aux en-têtes restent pris en charge et ne déclenchent pas cet avertissement.
  </Accordion>
  <Accordion title="2f. Avertissements de routes du plugin Codex">
    Lorsque le plugin Codex intégré est activé, doctor vérifie aussi si les références de modèle primaire `openai-codex/*` se résolvent encore via le runner PI par défaut. Cette combinaison est valide lorsque vous voulez utiliser l’authentification OAuth/abonnement Codex via PI, mais elle peut facilement être confondue avec le harnais app-server Codex natif. Doctor avertit et pointe vers la forme app-server explicite : `openai/*` plus `agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor ne répare pas cela automatiquement, car les deux routes sont valides :

    - `openai-codex/*` + PI signifie « utiliser l’authentification OAuth/abonnement Codex via le runner OpenClaw normal ».
    - `openai/*` + `agentRuntime.id: "codex"` signifie « exécuter le tour intégré via l’app-server Codex natif ».
    - `/codex ...` signifie « contrôler ou lier une conversation Codex native depuis le chat ».
    - `/acp ...` ou `runtime: "acp"` signifie « utiliser l’adaptateur ACP/acpx externe ».

    Si l’avertissement apparaît, choisissez la route voulue et modifiez la configuration manuellement. Conservez l’avertissement tel quel lorsque PI Codex OAuth est intentionnel.

  </Accordion>
  <Accordion title="3. Migrations d’état héritées (agencement du disque)">
    Doctor peut migrer d’anciens agencements sur disque vers la structure actuelle :

    - Stockage des sessions + transcriptions :
      - de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
    - Répertoire d’agent :
      - de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
    - État d’authentification WhatsApp (Baileys) :
      - depuis l’ancien `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
      - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de compte par défaut : `default`)

    Ces migrations sont effectuées au mieux et sont idempotentes ; doctor émet des avertissements lorsqu’il laisse d’anciens dossiers derrière lui comme sauvegardes. Le Gateway/CLI migre aussi automatiquement l’ancien répertoire des sessions + agent au démarrage afin que l’historique/l’authentification/les modèles arrivent dans le chemin par agent sans exécution manuelle de doctor. L’authentification WhatsApp est intentionnellement migrée uniquement via `openclaw doctor`. La normalisation du fournisseur/de la carte de fournisseurs Talk compare désormais par égalité structurelle, de sorte que les différences dues uniquement à l’ordre des clés ne déclenchent plus de changements `doctor --fix` répétés sans effet.

  </Accordion>
  <Accordion title="3a. Migrations d’anciens manifestes de plugins">
    Doctor analyse tous les manifestes de plugins installés pour rechercher les clés de capacité de niveau supérieur obsolètes (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Lorsqu’il en trouve, il propose de les déplacer dans l’objet `contracts` et de réécrire le fichier manifeste en place. Cette migration est idempotente ; si la clé `contracts` possède déjà les mêmes valeurs, l’ancienne clé est supprimée sans dupliquer les données.
  </Accordion>
  <Accordion title="3b. Migrations d’anciens magasins cron">
    Doctor vérifie aussi le magasin des tâches cron (`~/.openclaw/cron/jobs.json` par défaut, ou `cron.store` lorsqu’il est remplacé) pour détecter d’anciennes formes de tâches que le planificateur accepte encore pour compatibilité.

    Les nettoyages cron actuels incluent :

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - champs de payload de niveau supérieur (`message`, `model`, `thinking`, ...) → `payload`
    - champs de livraison de niveau supérieur (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de livraison `provider` dans le payload → `delivery.channel` explicite
    - simples tâches de secours webhook héritées `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

    Doctor ne migre automatiquement les tâches `notify: true` que lorsqu’il peut le faire sans changer le comportement. Si une tâche combine le secours notify hérité avec un mode de livraison non-webhook existant, doctor avertit et laisse cette tâche pour examen manuel.

    Sous Linux, doctor avertit aussi lorsque le crontab de l’utilisateur appelle encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh`. Ce script local à l’hôte n’est pas maintenu par OpenClaw actuel et peut écrire de faux messages `Gateway inactive` dans `~/.openclaw/logs/whatsapp-health.log` lorsque cron ne peut pas atteindre le bus utilisateur systemd. Supprimez l’entrée crontab obsolète avec `crontab -e` ; utilisez `openclaw channels status --probe`, `openclaw doctor` et `openclaw gateway status` pour les vérifications d’état actuelles.

  </Accordion>
  <Accordion title="3c. Nettoyage des verrous de session">
    Doctor analyse chaque répertoire de session d’agent à la recherche de fichiers de verrouillage d’écriture obsolètes — des fichiers laissés après une fermeture anormale d’une session. Pour chaque fichier de verrouillage trouvé, il signale : le chemin, le PID, si le PID est encore actif, l’âge du verrou et s’il est considéré comme obsolète (PID mort ou plus ancien que 30 minutes). En mode `--fix` / `--repair`, il supprime automatiquement les fichiers de verrouillage obsolètes ; sinon, il affiche une note et vous demande de relancer avec `--fix`.
  </Accordion>
  <Accordion title="3d. Réparation de branche de transcript de session">
    Doctor analyse les fichiers JSONL de session d’agent à la recherche de la forme de branche dupliquée créée par le bug de réécriture du transcript de prompt du 2026.4.24 : un tour utilisateur abandonné avec le contexte d’exécution interne d’OpenClaw, plus un pair actif contenant le même prompt utilisateur visible. En mode `--fix` / `--repair`, doctor sauvegarde chaque fichier affecté à côté de l’original et réécrit le transcript vers la branche active afin que l’historique du Gateway et les lecteurs de mémoire ne voient plus de tours dupliqués.
  </Accordion>
  <Accordion title="4. Vérifications d’intégrité de l’état (persistance de session, routage et sécurité)">
    Le répertoire d’état est le centre nerveux opérationnel. S’il disparaît, vous perdez les sessions, identifiants, journaux et la configuration (sauf si vous avez des sauvegardes ailleurs).

    Doctor vérifie :

    - **Répertoire d’état manquant** : avertit d’une perte d’état catastrophique, propose de recréer le répertoire et rappelle qu’il ne peut pas récupérer les données manquantes.
    - **Autorisations du répertoire d’état** : vérifie l’accès en écriture ; propose de réparer les autorisations (et émet une indication `chown` quand une incompatibilité propriétaire/groupe est détectée).
    - **Répertoire d’état synchronisé avec le cloud sur macOS** : avertit lorsque l’état se trouve sous iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, car les chemins reposant sur la synchronisation peuvent ralentir les E/S et provoquer des courses verrouillage/synchronisation.
    - **Répertoire d’état Linux sur SD ou eMMC** : avertit lorsque l’état se trouve sur une source de montage `mmcblk*`, car les E/S aléatoires reposant sur SD ou eMMC peuvent être plus lentes et s’user plus vite avec les écritures de sessions et d’identifiants.
    - **Répertoires de session manquants** : `sessions/` et le répertoire de stockage des sessions sont requis pour persister l’historique et éviter les plantages `ENOENT`.
    - **Incompatibilité de transcript** : avertit lorsque des entrées de session récentes ont des fichiers de transcript manquants.
    - **Session principale "JSONL sur 1 ligne"** : signale lorsque le transcript principal n’a qu’une seule ligne (l’historique ne s’accumule pas).
    - **Répertoires d’état multiples** : avertit lorsque plusieurs dossiers `~/.openclaw` existent dans différents répertoires personnels ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut être réparti entre installations).
    - **Rappel du mode distant** : si `gateway.mode=remote`, doctor vous rappelle de l’exécuter sur l’hôte distant (l’état s’y trouve).
    - **Autorisations du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est lisible par le groupe ou tous les utilisateurs et propose de le restreindre à `600`.

  </Accordion>
  <Accordion title="5. Santé de l’authentification des modèles (expiration OAuth)">
    Doctor inspecte les profils OAuth dans le magasin d’authentification, avertit lorsque les jetons expirent ou ont expiré, et peut les actualiser lorsque c’est sûr. Si le profil OAuth/jeton Anthropic est obsolète, il suggère une clé API Anthropic ou le chemin setup-token d’Anthropic. Les prompts d’actualisation n’apparaissent que lors d’une exécution interactive (TTY) ; `--non-interactive` ignore les tentatives d’actualisation.

    Lorsqu’une actualisation OAuth échoue définitivement (par exemple `refresh_token_reused`, `invalid_grant`, ou un fournisseur demandant de vous reconnecter), doctor signale qu’une nouvelle authentification est requise et affiche la commande exacte `openclaw models auth login --provider ...` à exécuter.

    Doctor signale également les profils d’authentification temporairement inutilisables pour cause de :

    - courts temps de récupération (limites de débit/délais d’attente/échecs d’authentification)
    - désactivations plus longues (échecs de facturation/crédit)

  </Accordion>
  <Accordion title="6. Validation du modèle des hooks">
    Si `hooks.gmail.model` est défini, doctor valide la référence de modèle par rapport au catalogue et à la liste d’autorisation, et avertit lorsqu’elle ne peut pas être résolue ou n’est pas autorisée.
  </Accordion>
  <Accordion title="7. Réparation de l’image de sandbox">
    Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de construire ou de basculer vers les anciens noms si l’image actuelle est manquante.
  </Accordion>
  <Accordion title="7b. Nettoyage de l’installation des plugins">
    Doctor supprime l’ancien état de staging des dépendances de plugins généré par OpenClaw en mode `openclaw doctor --fix` / `openclaw doctor --repair`. Cela couvre les racines de dépendances générées obsolètes, les anciens répertoires d’étape d’installation, les débris locaux aux packages issus de l’ancien code de réparation des dépendances de plugins intégrés, ainsi que les copies npm gérées orphelines ou récupérées des plugins `@openclaw/*` intégrés qui peuvent masquer le manifeste intégré actuel.

    Doctor peut aussi réinstaller les plugins téléchargeables configurés lorsque la configuration les référence, mais que le registre local de plugins ne les trouve pas. Pour l’externalisation des plugins intégrés du 2026.5.2, doctor installe automatiquement les plugins téléchargeables que la configuration existante utilise déjà, puis s’appuie sur `meta.lastTouchedVersion` pour n’exécuter cette passe de publication qu’une seule fois. Le démarrage du Gateway et le rechargement de la configuration n’exécutent pas de gestionnaires de packages ; les installations de plugins restent des opérations explicites de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrations de service Gateway et indications de nettoyage">
    Doctor détecte les anciens services gateway (launchd/systemd/schtasks) et propose de les supprimer et d’installer le service OpenClaw avec le port Gateway actuel. Il peut aussi rechercher des services supplémentaires de type gateway et afficher des indications de nettoyage. Les services Gateway OpenClaw nommés par profil sont considérés comme de première classe et ne sont pas signalés comme "supplémentaires".

    Sous Linux, si le service Gateway de niveau utilisateur est manquant mais qu’un service Gateway OpenClaw de niveau système existe, doctor n’installe pas automatiquement un second service de niveau utilisateur. Inspectez avec `openclaw gateway status --deep` ou `openclaw doctor --deep`, puis supprimez le doublon ou définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un superviseur système possède le cycle de vie du Gateway.

  </Accordion>
  <Accordion title="8b. Migration de la Matrix de démarrage">
    Lorsqu’un compte de canal Matrix a une migration d’ancien état en attente ou actionnable, doctor (en mode `--fix` / `--repair`) crée un instantané pré-migration, puis exécute les étapes de migration au mieux : migration de l’ancien état Matrix et préparation de l’ancien état chiffré. Les deux étapes sont non fatales ; les erreurs sont journalisées et le démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`), cette vérification est entièrement ignorée.
  </Accordion>
  <Accordion title="8c. Appairage des appareils et dérive d’authentification">
    Doctor inspecte désormais l’état d’appairage des appareils dans le cadre de la passe de santé normale.

    Ce qu’il signale :

    - demandes de premier appairage en attente
    - mises à niveau de rôle en attente pour des appareils déjà appairés
    - mises à niveau de portée en attente pour des appareils déjà appairés
    - réparations d’incompatibilité de clé publique lorsque l’identifiant d’appareil correspond toujours, mais que l’identité de l’appareil ne correspond plus à l’enregistrement approuvé
    - enregistrements appairés sans jeton actif pour un rôle approuvé
    - jetons appairés dont les portées dérivent hors de la base d’appairage approuvée
    - entrées de jeton d’appareil mises en cache localement pour la machine actuelle qui sont antérieures à une rotation de jeton côté Gateway ou portent des métadonnées de portée obsolètes

    Doctor n’approuve pas automatiquement les demandes d’appairage et ne fait pas automatiquement tourner les jetons d’appareil. Il affiche plutôt les étapes suivantes exactes :

    - inspecter les demandes en attente avec `openclaw devices list`
    - approuver la demande exacte avec `openclaw devices approve <requestId>`
    - faire tourner un nouveau jeton avec `openclaw devices rotate --device <deviceId> --role <role>`
    - supprimer et réapprouver un enregistrement obsolète avec `openclaw devices remove <deviceId>`

    Cela ferme le trou courant "déjà appairé mais demande d’appairage encore requise" : doctor distingue désormais le premier appairage des mises à niveau de rôle/portée en attente et de la dérive de jeton/identité d’appareil obsolète.

  </Accordion>
  <Accordion title="9. Avertissements de sécurité">
    Doctor émet des avertissements lorsqu’un fournisseur est ouvert aux messages privés sans liste d’autorisation, ou lorsqu’une politique est configurée de manière dangereuse.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    S’il s’exécute comme service utilisateur systemd, doctor s’assure que linger est activé afin que le Gateway reste actif après la déconnexion.
  </Accordion>
  <Accordion title="11. État de l’espace de travail (Skills, plugins et anciens répertoires)">
    Doctor affiche un résumé de l’état de l’espace de travail pour l’agent par défaut :

    - **État des Skills** : compte les skills éligibles, à exigences manquantes et bloquées par la liste d’autorisation.
    - **Anciens répertoires d’espace de travail** : avertit lorsque `~/openclaw` ou d’autres anciens répertoires d’espace de travail existent à côté de l’espace de travail actuel.
    - **État des plugins** : compte les plugins activés/désactivés/en erreur ; liste les identifiants de plugin pour toute erreur ; signale les capacités des plugins intégrés.
    - **Avertissements de compatibilité des plugins** : signale les plugins qui ont des problèmes de compatibilité avec l’environnement d’exécution actuel.
    - **Diagnostics des plugins** : expose tout avertissement ou erreur de chargement émis par le registre de plugins.

  </Accordion>
  <Accordion title="11b. Taille du fichier de bootstrap">
    Doctor vérifie si les fichiers de bootstrap de l’espace de travail (par exemple `AGENTS.md`, `CLAUDE.md` ou d’autres fichiers de contexte injectés) sont proches ou au-delà du budget de caractères configuré. Il signale, par fichier, le nombre de caractères bruts par rapport au nombre injecté, le pourcentage de troncature, la cause de troncature (`max/file` ou `max/total`) et le total de caractères injectés comme fraction du budget total. Lorsque des fichiers sont tronqués ou proches de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars` et `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Nettoyage des plugins de canal obsolètes">
    Lorsque `openclaw doctor --fix` supprime un plugin de canal manquant, il supprime également la configuration pendante limitée à ce canal qui référençait ce plugin : les entrées `channels.<id>`, les cibles de Heartbeat qui nommaient le canal, et les substitutions `agents.*.models["<channel>/*"]`. Cela évite les boucles de démarrage du Gateway où l’environnement d’exécution du canal a disparu, mais où la configuration demande encore au gateway de s’y lier.
  </Accordion>
  <Accordion title="11c. Complétion shell">
    Doctor vérifie si la complétion par tabulation est installée pour le shell actuel (zsh, bash, fish ou PowerShell) :

    - Si le profil shell utilise un modèle de complétion dynamique lent (`source <(openclaw completion ...)`), doctor le met à niveau vers la variante plus rapide avec fichier mis en cache.
    - Si la complétion est configurée dans le profil mais que le fichier de cache est manquant, doctor régénère automatiquement le cache.
    - Si aucune complétion n’est configurée, doctor propose de l’installer (mode interactif uniquement ; ignoré avec `--non-interactive`).

    Exécutez `openclaw completion --write-state` pour régénérer le cache manuellement.

  </Accordion>
  <Accordion title="12. Vérifications d’authentification du Gateway (jeton local)">
    Doctor vérifie que l’authentification par jeton du Gateway local est prête.

    - Si le mode jeton nécessite un jeton et qu’aucune source de jeton n’existe, doctor propose d’en générer un.
    - Si `gateway.auth.token` est géré par SecretRef mais indisponible, doctor avertit et ne le remplace pas par du texte en clair.
    - `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucun SecretRef de jeton n’est configuré.

  </Accordion>
  <Accordion title="12b. Réparations en lecture seule conscientes de SecretRef">
    Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement runtime fail-fast.

    - `openclaw doctor --fix` utilise désormais le même modèle de résumé SecretRef en lecture seule que les commandes de la famille status pour les réparations de configuration ciblées.
    - Exemple : la réparation `allowFrom` / `groupAllowFrom` `@username` de Telegram essaie d’utiliser les identifiants de bot configurés lorsqu’ils sont disponibles.
    - Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, doctor signale que l’identifiant est configuré-mais-indisponible et ignore la résolution automatique au lieu de planter ou de signaler à tort que le jeton est manquant.

  </Accordion>
  <Accordion title="13. Vérification de l’état du Gateway + redémarrage">
    Le diagnostic exécute une vérification de l’état et propose de redémarrer le Gateway lorsqu’il semble défaillant.
  </Accordion>
  <Accordion title="13b. Préparation de la recherche mémoire">
    Le diagnostic vérifie si le fournisseur d’embeddings de recherche mémoire configuré est prêt pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

    - **Backend QMD** : vérifie si le binaire `qmd` est disponible et peut être démarré. Sinon, affiche des consignes de correction incluant le paquet npm et une option de chemin manuel vers le binaire.
    - **Fournisseur local explicite** : recherche un fichier de modèle local ou une URL de modèle distante/téléchargeable reconnue. S’il manque, suggère de passer à un fournisseur distant.
    - **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé d’API est présente dans l’environnement ou dans le magasin d’authentification. Affiche des indications de correction actionnables si elle manque.
    - **Fournisseur automatique** : vérifie d’abord la disponibilité du modèle local, puis essaie chaque fournisseur distant dans l’ordre de sélection automatique.

    Lorsqu’un résultat de sonde du Gateway mis en cache est disponible (le Gateway était sain au moment de la vérification), le diagnostic compare son résultat avec la configuration visible par la CLI et signale toute divergence. Le diagnostic ne lance pas de nouveau ping d’embeddings dans le chemin par défaut ; utilisez la commande d’état mémoire approfondi lorsque vous voulez une vérification en direct du fournisseur.

    Utilisez `openclaw memory status --deep` pour vérifier la préparation des embeddings à l’exécution.

  </Accordion>
  <Accordion title="14. Avertissements d’état des canaux">
    Si le Gateway est sain, le diagnostic exécute une sonde d’état des canaux et signale les avertissements avec des corrections suggérées.
  </Accordion>
  <Accordion title="15. Audit + réparation de la configuration du superviseur">
    Le diagnostic vérifie la configuration du superviseur installé (launchd/systemd/schtasks) afin de détecter des valeurs par défaut manquantes ou obsolètes (par exemple les dépendances systemd network-online et le délai de redémarrage). Lorsqu’il trouve une incohérence, il recommande une mise à jour et peut réécrire le fichier de service ou la tâche avec les valeurs par défaut actuelles.

    Notes :

    - `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
    - `openclaw doctor --yes` accepte les invites de réparation par défaut.
    - `openclaw doctor --repair` applique les corrections recommandées sans invite.
    - `openclaw doctor --repair --force` écrase les configurations personnalisées du superviseur.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` garde le diagnostic en lecture seule pour le cycle de vie du service Gateway. Il signale toujours l’état du service et exécute les réparations hors service, mais ignore l’installation/le démarrage/le redémarrage/l’amorçage du service, les réécritures de configuration du superviseur et le nettoyage de services hérités, car un superviseur externe possède ce cycle de vie.
    - Sous Linux, le diagnostic ne réécrit pas les métadonnées de commande/point d’entrée tant que l’unité systemd Gateway correspondante est active. Il ignore aussi les unités supplémentaires inactives non héritées semblables au Gateway pendant l’analyse des services dupliqués, afin que les fichiers de services compagnons ne créent pas de bruit de nettoyage.
    - Si l’authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation/la réparation du service par le diagnostic valide la SecretRef mais ne persiste pas les valeurs de jeton en clair résolues dans les métadonnées d’environnement du service superviseur.
    - Le diagnostic détecte les valeurs d’environnement de service gérées par `.env`/SecretRef que d’anciennes installations LaunchAgent, systemd ou Windows Scheduled Task ont intégrées en ligne, et réécrit les métadonnées du service afin que ces valeurs soient chargées depuis la source d’exécution plutôt que depuis la définition du superviseur.
    - Le diagnostic détecte lorsque la commande de service épingle encore un ancien `--port` après des changements de `gateway.port` et réécrit les métadonnées du service vers le port actuel.
    - Si l’authentification par jeton nécessite un jeton et que la SecretRef de jeton configurée n’est pas résolue, le diagnostic bloque le chemin d’installation/de réparation avec des consignes actionnables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, le diagnostic bloque l’installation/la réparation jusqu’à ce que le mode soit défini explicitement.
    - Pour les unités systemd utilisateur sous Linux, les vérifications de dérive de jeton du diagnostic incluent désormais les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
    - Les réparations de service par le diagnostic refusent de réécrire, d’arrêter ou de redémarrer un service Gateway depuis un ancien binaire OpenClaw lorsque la configuration a été écrite pour la dernière fois par une version plus récente. Consultez [Dépannage du Gateway](/fr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostics d’exécution + de port du Gateway">
    Le diagnostic inspecte l’exécution du service (PID, dernier état de sortie) et avertit lorsque le service est installé mais ne s’exécute pas réellement. Il vérifie aussi les collisions de port sur le port du Gateway (par défaut `18789`) et signale les causes probables (Gateway déjà en cours d’exécution, tunnel SSH).
  </Accordion>
  <Accordion title="17. Bonnes pratiques d’exécution du Gateway">
    Le diagnostic avertit lorsque le service Gateway s’exécute sur Bun ou sur un chemin Node géré par version (`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram nécessitent Node, et les chemins de gestionnaires de versions peuvent casser après les mises à niveau, car le service ne charge pas votre initialisation de shell. Le diagnostic propose de migrer vers une installation Node système lorsqu’elle est disponible (Homebrew/apt/choco).

    Les LaunchAgents macOS nouvellement installés ou réparés utilisent un PATH système canonique (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) au lieu de copier le PATH du shell interactif, afin que Volta, asdf, fnm, pnpm et les autres répertoires de gestionnaires de versions ne modifient pas le Node résolu par les processus enfants. Les services Linux conservent toujours les racines d’environnement explicites (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) et les répertoires user-bin stables, mais les répertoires de repli devinés des gestionnaires de versions ne sont écrits dans le PATH du service que lorsque ces répertoires existent sur disque.

  </Accordion>
  <Accordion title="18. Écriture de la configuration + métadonnées de l’assistant">
    Le diagnostic persiste toute modification de configuration et marque les métadonnées de l’assistant pour enregistrer l’exécution du diagnostic.
  </Accordion>
  <Accordion title="19. Conseils d’espace de travail (sauvegarde + système de mémoire)">
    Le diagnostic suggère un système de mémoire d’espace de travail lorsqu’il manque et affiche un conseil de sauvegarde si l’espace de travail n’est pas déjà sous git.

    Consultez [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet de la structure de l’espace de travail et de la sauvegarde git (GitHub ou GitLab privé recommandé).

  </Accordion>
</AccordionGroup>

## Associé

- [Runbook du Gateway](/fr/gateway)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
