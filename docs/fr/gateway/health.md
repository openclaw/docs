---
read_when:
    - Diagnostiquer la connectivité des canaux ou l’état du gateway
    - Comprendre les commandes CLI et les options de vérification d’état
summary: Commandes de vérification d’état et surveillance de l’état du gateway
title: Vérifications d’état
x-i18n:
    generated_at: "2026-04-25T13:47:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d00e842dc0d67d71ac6e6547ebb7e3cd2b476562a7cde0f81624c6e20d67683
    source_path: gateway/health.md
    workflow: 15
---

Guide rapide pour vérifier la connectivité des canaux sans tâtonner.

## Vérifications rapides

- `openclaw status` — résumé local : accessibilité/mode du gateway, indication de mise à jour, âge de l’authentification des canaux liés, sessions + activité récente.
- `openclaw status --all` — diagnostic local complet (lecture seule, en couleur, sûr à coller pour le débogage).
- `openclaw status --deep` — interroge le gateway en cours d’exécution pour une sonde d’état en direct (`health` avec `probe:true`), y compris des sondes de canal par compte lorsque prises en charge.
- `openclaw health` — interroge le gateway en cours d’exécution pour obtenir son instantané d’état (WS uniquement ; pas de sockets de canal directs depuis la CLI).
- `openclaw health --verbose` — force une sonde d’état en direct et affiche les détails de connexion du gateway.
- `openclaw health --json` — sortie d’instantané d’état lisible par machine.
- Envoyez `/status` comme message autonome dans WhatsApp/WebChat pour obtenir une réponse d’état sans invoquer l’agent.
- Journaux : suivez `/tmp/openclaw/openclaw-*.log` et filtrez sur `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnostic approfondi

- Identifiants sur disque : `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (`mtime` doit être récent).
- Magasin de sessions : `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (le chemin peut être remplacé dans la configuration). Le nombre et les destinataires récents sont exposés via `status`.
- Flux de reconnexion : `openclaw channels logout && openclaw channels login --verbose` lorsque des codes d’état 409–515 ou `loggedOut` apparaissent dans les journaux. (Remarque : le flux de connexion par QR redémarre automatiquement une fois pour le statut 515 après l’appairage.)
- Les diagnostics sont activés par défaut. Le gateway enregistre les faits opérationnels sauf si `diagnostics.enabled: false` est défini. Les événements mémoire enregistrent les nombres d’octets RSS/heap, la pression de seuil et la pression de croissance. Les événements de payload surdimensionné enregistrent ce qui a été rejeté, tronqué ou découpé, ainsi que les tailles et limites lorsqu’elles sont disponibles. Ils n’enregistrent pas le texte du message, le contenu des pièces jointes, le corps du Webhook, le corps brut de la requête ou de la réponse, les tokens, les cookies ou les valeurs secrètes. Le même Heartbeat démarre le recorder de stabilité borné, disponible via `openclaw gateway stability` ou la RPC Gateway `diagnostics.stability`. Les sorties fatales du Gateway, les timeouts d’arrêt et les échecs de démarrage lors du redémarrage persistent le dernier instantané du recorder sous `~/.openclaw/logs/stability/` lorsque des événements existent ; inspectez le plus récent bundle enregistré avec `openclaw gateway stability --bundle latest`.
- Pour les signalements de bugs, exécutez `openclaw gateway diagnostics export` et joignez le zip généré. L’export combine un résumé Markdown, le plus récent bundle de stabilité, des métadonnées de journaux assainies, des instantanés assainis du statut/de l’état du Gateway, et la forme de la configuration. Il est destiné au partage : le texte des discussions, les corps Webhook, les sorties d’outils, les identifiants, les cookies, les identifiants de compte/message et les valeurs secrètes sont omis ou masqués. Voir [Export de diagnostics](/fr/gateway/diagnostics).

## Configuration du moniteur d’état

- `gateway.channelHealthCheckMinutes` : fréquence à laquelle le gateway vérifie l’état des canaux. Par défaut : `5`. Définissez `0` pour désactiver globalement les redémarrages du moniteur d’état.
- `gateway.channelStaleEventThresholdMinutes` : durée pendant laquelle un canal connecté peut rester inactif avant que le moniteur d’état ne le considère comme obsolète et ne le redémarre. Par défaut : `30`. Conservez cette valeur supérieure ou égale à `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour` : plafond glissant sur une heure pour les redémarrages du moniteur d’état par canal/compte. Par défaut : `10`.
- `channels.<provider>.healthMonitor.enabled` : désactive les redémarrages du moniteur d’état pour un canal spécifique tout en laissant la surveillance globale activée.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled` : remplacement multi-compte qui l’emporte sur le paramètre au niveau du canal.
- Ces remplacements par canal s’appliquent aux moniteurs de canal intégrés qui les exposent aujourd’hui : Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram et WhatsApp.

## En cas d’échec

- `logged out` ou statut 409–515 → reliez à nouveau avec `openclaw channels logout` puis `openclaw channels login`.
- Gateway inaccessible → démarrez-le : `openclaw gateway --port 18789` (utilisez `--force` si le port est occupé).
- Aucun message entrant → confirmez que le téléphone lié est en ligne et que l’expéditeur est autorisé (`channels.whatsapp.allowFrom`) ; pour les discussions de groupe, assurez-vous que la liste d’autorisation + les règles de mention correspondent (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Commande dédiée « health »

`openclaw health` interroge le gateway en cours d’exécution pour obtenir son instantané d’état (pas de sockets de canal directs depuis la CLI). Par défaut, il peut renvoyer un instantané mis en cache récent du gateway ; le gateway actualise alors ce cache en arrière-plan. `openclaw health --verbose` force à la place une sonde en direct. La commande signale l’âge des identifiants/authentification liés lorsque disponible, les résumés de sondes par canal, le résumé du magasin de sessions et une durée de sonde. Elle se termine avec un code non nul si le gateway est inaccessible ou si la sonde échoue/expire.

Options :

- `--json` : sortie JSON lisible par machine
- `--timeout <ms>` : remplace le timeout de sonde par défaut de 10 s
- `--verbose` : force une sonde en direct et affiche les détails de connexion du gateway
- `--debug` : alias de `--verbose`

L’instantané d’état inclut : `ok` (booléen), `ts` (horodatage), `durationMs` (temps de sonde), le statut par canal, la disponibilité de l’agent et le résumé du magasin de sessions.

## Connexes

- [Runbook Gateway](/fr/gateway)
- [Export de diagnostics](/fr/gateway/diagnostics)
- [Dépannage Gateway](/fr/gateway/troubleshooting)
