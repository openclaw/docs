---
read_when:
    - Diagnostic de la connectivité des canaux ou de la santé de Gateway
    - Comprendre les commandes CLI de vérification de santé et leurs options
summary: Commandes de vérification de santé et surveillance de la santé de Gateway
title: Vérifications de santé
x-i18n:
    generated_at: "2026-04-23T07:03:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5ddcbe6fa913c5ba889f78cb417124c96b562cf8939410b1d6f66042dfb51a9f
    source_path: gateway/health.md
    workflow: 15
---

# Vérifications de santé (CLI)

Guide court pour vérifier la connectivité des canaux sans tâtonner.

## Vérifications rapides

- `openclaw status` — résumé local : joignabilité/mode de Gateway, indication de mise à jour, ancienneté de l’authentification des canaux liés, sessions + activité récente.
- `openclaw status --all` — diagnostic local complet (lecture seule, couleur, sûr à coller pour le débogage).
- `openclaw status --deep` — demande à la passerelle en cours d’exécution une sonde de santé live (`health` avec `probe:true`), y compris des sondes de canaux par compte lorsque c’est pris en charge.
- `openclaw health` — demande à la passerelle en cours d’exécution son instantané de santé (WS uniquement ; pas de sockets de canal directs depuis la CLI).
- `openclaw health --verbose` — force une sonde de santé live et affiche les détails de connexion Gateway.
- `openclaw health --json` — sortie d’instantané de santé lisible par machine.
- Envoyez `/status` comme message autonome dans WhatsApp/WebChat pour obtenir une réponse de statut sans invoquer l’agent.
- Journaux : suivez `/tmp/openclaw/openclaw-*.log` et filtrez sur `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnostics approfondis

- Identifiants sur disque : `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (la date de modification devrait être récente).
- Magasin de sessions : `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (le chemin peut être surchargé dans la configuration). Le nombre et les destinataires récents sont exposés via `status`.
- Flux de reliaison : `openclaw channels logout && openclaw channels login --verbose` lorsque les codes de statut 409–515 ou `loggedOut` apparaissent dans les journaux. (Remarque : le flux de connexion par QR redémarre automatiquement une fois pour le statut 515 après l’appairage.)
- Les diagnostics sont activés par défaut. La passerelle enregistre des faits opérationnels sauf si `diagnostics.enabled: false` est défini. Les événements mémoire enregistrent les comptes d’octets RSS/heap, la pression de seuil et la pression de croissance. Les événements de charge utile surdimensionnée enregistrent ce qui a été rejeté, tronqué ou découpé, ainsi que les tailles et limites lorsqu’elles sont disponibles. Ils n’enregistrent pas le texte des messages, le contenu des pièces jointes, le corps Webhook, le corps brut des requêtes ou réponses, les jetons, les cookies ou les valeurs secrètes. Le même Heartbeat démarre l’enregistreur de stabilité borné, disponible via `openclaw gateway stability` ou le RPC Gateway `diagnostics.stability`. Les sorties fatales de Gateway, les délais d’arrêt dépassés et les échecs de démarrage lors d’un redémarrage conservent le dernier instantané de l’enregistreur sous `~/.openclaw/logs/stability/` lorsque des événements existent ; inspectez le bundle enregistré le plus récent avec `openclaw gateway stability --bundle latest`.
- Pour les rapports de bug, exécutez `openclaw gateway diagnostics export` et joignez le zip généré. L’export combine un résumé Markdown, le bundle de stabilité le plus récent, des métadonnées de journal assainies, des instantanés assainis de statut/santé Gateway et la forme de la configuration. Il est conçu pour être partagé : le texte du chat, les corps Webhook, les sorties d’outils, les identifiants, les cookies, les identifiants de compte/message et les valeurs secrètes sont omis ou masqués.

## Configuration du moniteur de santé

- `gateway.channelHealthCheckMinutes` : fréquence à laquelle la passerelle vérifie la santé des canaux. Par défaut : `5`. Définissez `0` pour désactiver globalement les redémarrages du moniteur de santé.
- `gateway.channelStaleEventThresholdMinutes` : durée pendant laquelle un canal connecté peut rester inactif avant que le moniteur de santé ne le considère comme obsolète et ne le redémarre. Par défaut : `30`. Conservez une valeur supérieure ou égale à `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour` : plafond glissant d’une heure pour les redémarrages du moniteur de santé par canal/compte. Par défaut : `10`.
- `channels.<provider>.healthMonitor.enabled` : désactive les redémarrages du moniteur de santé pour un canal spécifique tout en laissant la surveillance globale activée.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled` : surcharge multi-compte qui l’emporte sur le paramètre au niveau du canal.
- Ces surcharges par canal s’appliquent aux moniteurs de canal intégrés qui les exposent aujourd’hui : Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram et WhatsApp.

## En cas d’échec

- `logged out` ou statut 409–515 → reliez avec `openclaw channels logout` puis `openclaw channels login`.
- Gateway inaccessible → démarrez-la : `openclaw gateway --port 18789` (utilisez `--force` si le port est occupé).
- Aucun message entrant → confirmez que le téléphone lié est en ligne et que l’expéditeur est autorisé (`channels.whatsapp.allowFrom`) ; pour les discussions de groupe, assurez-vous que la liste d’autorisation + les règles de mention correspondent (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Commande dédiée « health »

`openclaw health` demande à la passerelle en cours d’exécution son instantané de santé (pas de sockets de canal directs
depuis la CLI). Par défaut, elle peut renvoyer un instantané Gateway mis en cache mais récent ; la
passerelle actualise ensuite ce cache en arrière-plan. `openclaw health --verbose` force
à la place une sonde live. La commande signale l’ancienneté des identifiants/authentifications liés lorsqu’elle est disponible,
les résumés de sondes par canal, le résumé du magasin de sessions et une durée de sonde. Elle quitte
avec un code non nul si la passerelle est inaccessible ou si la sonde échoue/dépasse le délai.

Options :

- `--json` : sortie JSON lisible par machine
- `--timeout <ms>` : surcharge le délai d’expiration de sonde par défaut de 10 s
- `--verbose` : force une sonde live et affiche les détails de connexion Gateway
- `--debug` : alias de `--verbose`

L’instantané de santé inclut : `ok` (booléen), `ts` (horodatage), `durationMs` (temps de sonde), le statut par canal, la disponibilité des agents et le résumé du magasin de sessions.
