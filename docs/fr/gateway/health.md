---
read_when:
    - Diagnostic de la connectivité des canaux ou de l’état du Gateway
    - Comprendre les commandes et options de la CLI de vérification de l’état
summary: Commandes de vérification de l’état et surveillance de l’état du Gateway
title: Contrôles d’intégrité
x-i18n:
    generated_at: "2026-07-12T15:24:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6cc015fcd8dc002eafac95fb3e7aa0b6f3be5b9995e94438e2fed539a561931d
    source_path: gateway/health.md
    workflow: 16
---

Guide concis pour vérifier la connectivité des canaux sans faire de suppositions.

## Vérifications rapides

- `openclaw status` - résumé local : accessibilité/mode du Gateway, indication de mise à jour, ancienneté de l’authentification du canal lié, sessions et activité récente.
- `openclaw status --all` - diagnostic local complet (lecture seule, en couleur, peut être collé sans risque à des fins de débogage).
- `openclaw status --deep` - demande au Gateway en cours d’exécution d’effectuer une sonde en direct (`health` avec `probe:true`), y compris des sondes de canal par compte lorsque cette fonction est prise en charge.
- `openclaw status --usage` - affiche des instantanés de l’utilisation et des quotas des fournisseurs de modèles.
- `openclaw health` - demande au Gateway en cours d’exécution son instantané d’intégrité (WS uniquement ; aucun socket de canal direct depuis la CLI).
- `openclaw health --verbose` (alias `--debug`) - force une sonde d’intégrité en direct et affiche les détails de connexion au Gateway.
- `openclaw health --json` - sortie de l’instantané d’intégrité lisible par une machine.
- Envoyez `/status` comme commande de discussion autonome dans n’importe quel canal pour obtenir une réponse d’état sans appeler l’agent.
- Journaux : suivez `/tmp/openclaw/openclaw-*.log` et filtrez sur `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Pour Discord et les autres fournisseurs de discussion, les lignes de session n’indiquent pas si le socket est actif.
`openclaw sessions`, `sessions.list` du Gateway et l’outil `sessions_list` de l’agent
lisent l’état des conversations enregistré. Un fournisseur peut se reconnecter et afficher un état
de canal sain avant qu’une nouvelle ligne de session ne soit matérialisée. Utilisez les commandes
d’état et d’intégrité du canal ci-dessus pour vérifier la connectivité en direct.

## Diagnostics approfondis

- Identifiants sur le disque : `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (la date de modification doit être récente).
- Stockage des sessions : `ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Le nombre et les destinataires récents sont affichés par `status`.
- Procédure de réassociation : `openclaw channels logout && openclaw channels login --verbose` lorsque les codes d’état 409-515 ou `loggedOut` apparaissent dans les journaux. La procédure de connexion par code QR redémarre automatiquement une fois pour l’état 515 après l’association.
- Les diagnostics sont activés par défaut (`diagnostics.enabled: false` les désactive). Les événements de mémoire enregistrent le nombre d’octets RSS/du tas ainsi que la pression liée aux seuils et à la croissance ; une pression mémoire critique est consignée par le journaliseur du Gateway et, lorsque `diagnostics.memoryPressureSnapshot: true` est défini, écrit également un paquet de stabilité pré-OOM (statistiques du tas V8, compteurs cgroup Linux lorsqu’ils sont disponibles, nombre de ressources actives, plus grands fichiers de session/transcription selon leur chemin relatif expurgé). Les avertissements d’activité enregistrent le délai et l’utilisation de la boucle d’événements, le ratio de cœurs de processeur et le nombre de sessions actives/en attente/dans la file d’attente lorsque le processus est en cours d’exécution, mais saturé. Les événements de charge utile surdimensionnée enregistrent ce qui a été rejeté/tronqué/fragmenté ainsi que les tailles et les limites, mais jamais le texte des messages, le contenu des pièces jointes, le corps des webhooks, le corps brut des requêtes/réponses, les jetons, les cookies ou les valeurs secrètes.
- Le même Heartbeat alimente l’enregistreur de stabilité limité : `openclaw gateway stability` (ou le RPC `diagnostics.stability` du Gateway). Les arrêts fatals du Gateway, les dépassements de délai d’arrêt, les échecs de démarrage après redémarrage et, lorsque `diagnostics.memoryPressureSnapshot: true`, la pression mémoire critique conservent le dernier instantané sous `~/.openclaw/logs/stability/`. Inspectez le paquet le plus récent avec `openclaw gateway stability --bundle latest`.
- Pour les rapports de bogue, exécutez `openclaw gateway diagnostics export` et joignez le fichier zip généré : un résumé Markdown, le paquet de stabilité le plus récent, des métadonnées de journal assainies, des instantanés assainis de l’état et de l’intégrité du Gateway, ainsi que la structure de la configuration. Le texte des discussions, le corps des webhooks, les sorties des outils, les identifiants, les cookies, les identifiants de compte/message et les valeurs secrètes sont omis ou expurgés. Consultez [Exportation des diagnostics](/fr/gateway/diagnostics).

## Configuration du moniteur d’intégrité

- `gateway.channelHealthCheckMinutes` : fréquence à laquelle le Gateway vérifie l’intégrité des canaux. Valeur par défaut : `5`. Définissez `0` pour désactiver globalement les redémarrages du moniteur d’intégrité.
- `gateway.channelStaleEventThresholdMinutes` : durée pendant laquelle un canal connecté peut rester inactif avant que le moniteur d’intégrité ne le considère comme obsolète et ne le redémarre. Valeur par défaut : `30`. Conservez une valeur supérieure ou égale à `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour` : plafond glissant sur une heure des redémarrages effectués par le moniteur d’intégrité pour chaque canal/compte. Valeur par défaut : `10`.
- `channels.<provider>.healthMonitor.enabled` : désactive les redémarrages du moniteur d’intégrité pour un canal donné tout en laissant la surveillance globale activée.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled` : remplacement pour les configurations à plusieurs comptes, prioritaire sur le paramètre au niveau du canal.
- Ces remplacements par canal s’appliquent aux canaux intégrés qui les proposent actuellement : Discord, Google Chat, iMessage, IRC, Microsoft Teams, Signal, Slack, Telegram et WhatsApp.

## Surveillance de la disponibilité

Les services externes de surveillance de la disponibilité doivent utiliser le point de terminaison dédié `/health`, et non `/v1/chat/completions`.

- **À UTILISER :** `GET /health` - réponse instantanée, aucune session créée, aucun appel au LLM, renvoie `{"ok":true,"status":"live"}`
- **À NE PAS UTILISER :** `/v1/chat/completions` pour les vérifications d’intégrité - chaque requête crée une session d’agent complète avec un instantané des Skills, l’assemblage du contexte et des appels au LLM

Lorsqu’aucun en-tête `x-openclaw-session-key` ni champ `user` n’est fourni, `/v1/chat/completions` génère une nouvelle session aléatoire pour chaque requête. Les services de surveillance qui envoient une requête toutes les 15 minutes créent environ 96 sessions/jour, chacune consommant 4-22KB. Au fil du temps, cela gonfle le stockage des sessions et peut entraîner un dépassement de la fenêtre de contexte.

### Exemples de configuration de services de surveillance

- **BetterStack :** définissez l’URL de vérification d’intégrité sur `https://<your-gateway-host>:<port>/health`
- **UptimeRobot :** ajoutez un nouveau moniteur HTTP avec l’URL `https://<your-gateway-host>:<port>/health`
- **Générique :** toute requête HTTP GET vers `/health` renvoie 200 avec `{"ok":true}` lorsque le Gateway est sain

## En cas d’échec

- `logged out` ou état 409-515 -> réassociez avec `openclaw channels logout`, puis `openclaw channels login`.
- Gateway inaccessible -> démarrez-le : `openclaw gateway --port 18789` (utilisez `--force` si le port est occupé).
- Aucun message entrant -> vérifiez que le téléphone associé est en ligne et que l’expéditeur est autorisé (`channels.whatsapp.allowFrom`) ; pour les discussions de groupe, assurez-vous que les règles de liste d’autorisation et de mention correspondent (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Commande « health » dédiée

`openclaw health` demande au Gateway en cours d’exécution son instantané d’intégrité (aucun socket de canal
direct depuis la CLI). Par défaut, elle renvoie un instantané récent mis en cache par le Gateway et celui-ci
actualise ce cache en arrière-plan ; `--verbose` force à la place une sonde en direct.
La commande indique les identifiants associés et l’ancienneté de l’authentification lorsqu’ils sont disponibles, les résumés des sondes par canal,
le résumé du stockage des sessions et la durée de la sonde. Elle renvoie un code de sortie différent de zéro si le Gateway est
inaccessible ou si la sonde échoue ou dépasse le délai imparti.

Options :

- `--json` : sortie JSON lisible par une machine
- `--timeout <ms>` : remplace le délai d’expiration par défaut de 10s de la sonde
- `--verbose` : force une sonde en direct et affiche les détails de connexion au Gateway
- `--debug` : alias de `--verbose`

L’instantané d’intégrité comprend : `ok` (booléen), `ts` (horodatage), `durationMs` (durée de la sonde), l’état de chaque canal, la disponibilité de l’agent et le résumé du stockage des sessions.

## Pages connexes

- [Guide d’exploitation du Gateway](/fr/gateway)
- [Exportation des diagnostics](/fr/gateway/diagnostics)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
