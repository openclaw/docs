---
read_when:
    - Diagnostic de la connectivité des canaux ou de l’état du Gateway
    - Comprendre les commandes et options CLI de vérification de l’état
summary: Commandes de vérification de l’état et surveillance de l’état du Gateway
title: Contrôles d’intégrité
x-i18n:
    generated_at: "2026-06-27T17:30:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d6475bef9fead191c11a801151d4fab76c47034d3f30f90a18c15d6e32b5d26
    source_path: gateway/health.md
    workflow: 16
---

Petit guide pour vérifier la connectivité des canaux sans deviner.

## Vérifications rapides

- `openclaw status` — résumé local : joignabilité/mode du Gateway, indication de mise à jour, âge de l’authentification du canal lié, sessions + activité récente.
- `openclaw status --all` — diagnostic local complet (lecture seule, couleur, sûr à coller pour le débogage).
- `openclaw status --deep` — demande au Gateway en cours d’exécution une sonde de santé en direct (`health` avec `probe:true`), y compris des sondes de canal par compte quand elles sont prises en charge.
- `openclaw health` — demande au Gateway en cours d’exécution son instantané de santé (WS uniquement ; aucun socket de canal direct depuis la CLI).
- `openclaw health --verbose` — force une sonde de santé en direct et affiche les détails de connexion au Gateway.
- `openclaw health --json` — sortie d’instantané de santé lisible par machine.
- Envoyez `/status` comme message autonome dans WhatsApp/WebChat pour obtenir une réponse d’état sans invoquer l’agent.
- Journaux : suivez `/tmp/openclaw/openclaw-*.log` et filtrez sur `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Pour Discord et les autres fournisseurs de chat, les lignes de session ne sont pas un indicateur de vivacité du socket.
`openclaw sessions`, `sessions.list` du Gateway et l’outil agent `sessions_list`
lisent l’état de conversation stocké. Un fournisseur peut se reconnecter et afficher un état de canal sain
avant qu’une nouvelle ligne de session soit matérialisée. Utilisez les commandes d’état de canal et
de santé ci-dessus pour les vérifications de connectivité en direct.

## Diagnostics approfondis

- Identifiants sur disque : `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime doit être récent).
- Stockage des sessions : `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (le chemin peut être remplacé dans la configuration). Le nombre et les destinataires récents sont exposés via `status`.
- Flux de reconnexion : `openclaw channels logout && openclaw channels login --verbose` lorsque des codes d’état 409–515 ou `loggedOut` apparaissent dans les journaux. (Remarque : le flux de connexion par QR redémarre automatiquement une fois pour l’état 515 après l’association.)
- Les diagnostics sont activés par défaut. Le Gateway enregistre les faits opérationnels sauf si `diagnostics.enabled: false` est défini. Les événements mémoire enregistrent les nombres d’octets RSS/tas, la pression de seuil et la pression de croissance. La pression mémoire critique est journalisée via le journaliseur du Gateway. Quand `diagnostics.memoryPressureSnapshot: true` est défini, la pression mémoire critique écrit aussi un bundle de stabilité pré-OOM avec les statistiques de tas V8, les compteurs cgroup Linux lorsqu’ils sont disponibles, le nombre de ressources actives et les plus gros fichiers de session/transcription par chemin relatif expurgé. Les avertissements de vivacité enregistrent le délai de la boucle d’événements, l’utilisation de la boucle d’événements, le ratio de cœurs CPU et les nombres de sessions actives/en attente/en file quand le processus fonctionne mais est saturé. Les événements de charge utile surdimensionnée enregistrent ce qui a été rejeté, tronqué ou découpé, ainsi que les tailles et limites lorsqu’elles sont disponibles. Ils n’enregistrent pas le texte du message, le contenu des pièces jointes, le corps du Webhook, le corps brut de requête ou de réponse, les jetons, les cookies ni les valeurs secrètes. Le même Heartbeat démarre l’enregistreur de stabilité borné, disponible via `openclaw gateway stability` ou le RPC Gateway `diagnostics.stability`. Les sorties fatales du Gateway, les expirations de délai d’arrêt et les échecs de démarrage après redémarrage persistent le dernier instantané de l’enregistreur sous `~/.openclaw/logs/stability/` quand des événements existent ; la pression mémoire critique le fait aussi uniquement quand `diagnostics.memoryPressureSnapshot: true` est défini. Inspectez le bundle enregistré le plus récent avec `openclaw gateway stability --bundle latest`.
- Pour les rapports de bug, exécutez `openclaw gateway diagnostics export` et joignez le zip généré. L’export combine un résumé Markdown, le bundle de stabilité le plus récent, des métadonnées de journaux nettoyées, des instantanés d’état/santé du Gateway nettoyés et la forme de la configuration. Il est conçu pour être partagé : le texte de chat, les corps de Webhook, les sorties d’outils, les identifiants, les cookies, les identifiants de compte/message et les valeurs secrètes sont omis ou expurgés. Voir [Export des diagnostics](/fr/gateway/diagnostics).

## Configuration du moniteur de santé

- `gateway.channelHealthCheckMinutes` : fréquence à laquelle le Gateway vérifie la santé des canaux. Par défaut : `5`. Définissez `0` pour désactiver globalement les redémarrages du moniteur de santé.
- `gateway.channelStaleEventThresholdMinutes` : durée pendant laquelle un canal connecté peut rester inactif avant que le moniteur de santé le considère comme obsolète et le redémarre. Par défaut : `30`. Gardez cette valeur supérieure ou égale à `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour` : plafond glissant d’une heure pour les redémarrages du moniteur de santé par canal/compte. Par défaut : `10`.
- `channels.<provider>.healthMonitor.enabled` : désactive les redémarrages du moniteur de santé pour un canal spécifique tout en laissant la surveillance globale activée.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled` : remplacement multi-compte prioritaire sur le réglage au niveau du canal.
- Ces remplacements par canal s’appliquent aux moniteurs de canal intégrés qui les exposent aujourd’hui : Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram et WhatsApp.

## Surveillance de disponibilité

Les services externes de surveillance de disponibilité doivent utiliser le point de terminaison dédié `/health`, pas `/v1/chat/completions`.

- **À utiliser :** `GET /health` — réponse instantanée, aucune session créée, aucun appel LLM, renvoie `{"ok":true,"status":"live"}`
- **NE PAS utiliser :** `/v1/chat/completions` pour les vérifications de santé — chaque requête crée une session agent complète avec instantané de skill, assemblage du contexte et appels LLM

Quand aucun en-tête `x-openclaw-session-key` ni champ `user` n’est fourni, `/v1/chat/completions` génère une nouvelle session aléatoire pour chaque requête. Les services de surveillance qui interrogent toutes les 15 minutes créent environ 96 sessions/jour, chacune consommant 4–22 Ko. Avec le temps, cela fait grossir le stockage des sessions et peut entraîner un dépassement de la fenêtre de contexte.

### Exemples de configuration de service de surveillance

- **BetterStack :** définissez l’URL de vérification de santé sur `https://<your-gateway-host>:<port>/health`
- **UptimeRobot :** ajoutez un nouveau moniteur HTTP avec l’URL `https://<your-gateway-host>:<port>/health`
- **Générique :** tout HTTP GET vers `/health` renvoie 200 avec `{"ok":true}` quand le Gateway est sain

## Quand quelque chose échoue

- `logged out` ou état 409–515 → reliez avec `openclaw channels logout` puis `openclaw channels login`.
- Gateway injoignable → démarrez-le : `openclaw gateway --port 18789` (utilisez `--force` si le port est occupé).
- Aucun message entrant → confirmez que le téléphone lié est en ligne et que l’expéditeur est autorisé (`channels.whatsapp.allowFrom`) ; pour les discussions de groupe, assurez-vous que la liste d’autorisation + les règles de mention correspondent (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Commande « health » dédiée

`openclaw health` demande au Gateway en cours d’exécution son instantané de santé (aucun socket de canal direct
depuis la CLI). Par défaut, elle peut renvoyer un instantané Gateway mis en cache récent ; le
Gateway actualise ensuite ce cache en arrière-plan. `openclaw health --verbose` force
plutôt une sonde en direct. La commande signale les identifiants liés/l’âge d’authentification quand ils sont disponibles,
les résumés de sonde par canal, le résumé du stockage des sessions et une durée de sonde. Elle se termine
avec un code non nul si le Gateway est injoignable ou si la sonde échoue/expire.

Options :

- `--json` : sortie JSON lisible par machine
- `--timeout <ms>` : remplace le délai d’expiration de sonde par défaut de 10 s
- `--verbose` : force une sonde en direct et affiche les détails de connexion au Gateway
- `--debug` : alias de `--verbose`

L’instantané de santé inclut : `ok` (booléen), `ts` (horodatage), `durationMs` (temps de sonde), l’état par canal, la disponibilité de l’agent et le résumé du stockage des sessions.

## Associé

- [Runbook Gateway](/fr/gateway)
- [Export des diagnostics](/fr/gateway/diagnostics)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
