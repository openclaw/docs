---
read_when:
    - Diagnostic de la connectivité des canaux ou de l’état de santé du Gateway
    - Comprendre les commandes et options CLI de contrôle d’intégrité
summary: Commandes de vérification de l’état et surveillance de l’état du Gateway
title: Vérifications d’état
x-i18n:
    generated_at: "2026-04-30T07:27:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: f34b91ef5d54b0fac7c451e46e07d36520a7d08fb0dce0538c6158d0bc6982b8
    source_path: gateway/health.md
    workflow: 16
---

Guide court pour vérifier la connectivité des canaux sans deviner.

## Vérifications rapides

- `openclaw status` — résumé local : accessibilité/mode du Gateway, indice de mise à jour, ancienneté de l’authentification du canal lié, sessions + activité récente.
- `openclaw status --all` — diagnostic local complet (lecture seule, couleur, sûr à coller pour le débogage).
- `openclaw status --deep` — demande au Gateway en cours d’exécution une sonde d’état en direct (`health` avec `probe:true`), y compris les sondes de canal par compte lorsque c’est pris en charge.
- `openclaw health` — demande au Gateway en cours d’exécution son instantané d’état (WS uniquement ; aucune socket de canal directe depuis la CLI).
- `openclaw health --verbose` — force une sonde d’état en direct et affiche les détails de connexion au Gateway.
- `openclaw health --json` — sortie d’instantané d’état lisible par machine.
- Envoyez `/status` comme message autonome dans WhatsApp/WebChat pour obtenir une réponse d’état sans invoquer l’agent.
- Journaux : suivez `/tmp/openclaw/openclaw-*.log` et filtrez sur `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnostics approfondis

- Identifiants sur disque : `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime doit être récent).
- Magasin de sessions : `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (le chemin peut être remplacé dans la configuration). Le nombre et les destinataires récents sont exposés via `status`.
- Flux de réassociation : `openclaw channels logout && openclaw channels login --verbose` lorsque les codes d’état 409–515 ou `loggedOut` apparaissent dans les journaux. (Remarque : le flux de connexion par QR redémarre automatiquement une fois pour l’état 515 après l’appairage.)
- Les diagnostics sont activés par défaut. Le Gateway enregistre les faits opérationnels sauf si `diagnostics.enabled: false` est défini. Les événements mémoire enregistrent les décomptes d’octets RSS/tas, la pression de seuil et la pression de croissance. Les avertissements de vivacité enregistrent le délai de boucle d’événements, l’utilisation de la boucle d’événements, le ratio cœurs CPU, ainsi que les nombres de sessions actives/en attente/en file lorsque le processus est en cours d’exécution mais saturé. Les événements de charge utile surdimensionnée enregistrent ce qui a été rejeté, tronqué ou découpé, ainsi que les tailles et limites lorsqu’elles sont disponibles. Ils n’enregistrent pas le texte du message, le contenu des pièces jointes, le corps du webhook, le corps brut de la requête ou de la réponse, les jetons, les cookies ni les valeurs secrètes. Le même Heartbeat démarre l’enregistreur de stabilité borné, disponible via `openclaw gateway stability` ou le RPC Gateway `diagnostics.stability`. Les sorties fatales du Gateway, les expirations d’arrêt et les échecs de démarrage au redémarrage conservent le dernier instantané de l’enregistreur sous `~/.openclaw/logs/stability/` lorsque des événements existent ; inspectez le paquet enregistré le plus récent avec `openclaw gateway stability --bundle latest`.
- Pour les rapports de bogue, exécutez `openclaw gateway diagnostics export` et joignez le zip généré. L’export combine un résumé Markdown, le paquet de stabilité le plus récent, des métadonnées de journaux nettoyées, des instantanés d’état/de santé du Gateway nettoyés et la forme de la configuration. Il est destiné à être partagé : le texte des discussions, les corps de webhook, les sorties d’outils, les identifiants, les cookies, les identifiants de compte/message et les valeurs secrètes sont omis ou expurgés. Voir [Export de diagnostics](/fr/gateway/diagnostics).

## Configuration du moniteur d’état

- `gateway.channelHealthCheckMinutes` : fréquence à laquelle le Gateway vérifie l’état des canaux. Par défaut : `5`. Définissez `0` pour désactiver globalement les redémarrages du moniteur d’état.
- `gateway.channelStaleEventThresholdMinutes` : durée pendant laquelle un canal connecté peut rester inactif avant que le moniteur d’état le considère comme périmé et le redémarre. Par défaut : `30`. Gardez cette valeur supérieure ou égale à `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour` : plafond glissant d’une heure pour les redémarrages du moniteur d’état par canal/compte. Par défaut : `10`.
- `channels.<provider>.healthMonitor.enabled` : désactive les redémarrages du moniteur d’état pour un canal spécifique tout en laissant la surveillance globale activée.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled` : remplacement multi-compte qui prévaut sur le paramètre au niveau du canal.
- Ces remplacements par canal s’appliquent aux moniteurs de canaux intégrés qui les exposent aujourd’hui : Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram et WhatsApp.

## Quand quelque chose échoue

- `logged out` ou état 409–515 → réassociez avec `openclaw channels logout` puis `openclaw channels login`.
- Gateway inaccessible → démarrez-le : `openclaw gateway --port 18789` (utilisez `--force` si le port est occupé).
- Aucun message entrant → confirmez que le téléphone lié est en ligne et que l’expéditeur est autorisé (`channels.whatsapp.allowFrom`) ; pour les discussions de groupe, assurez-vous que la liste d’autorisation + les règles de mention correspondent (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Commande dédiée « état »

`openclaw health` demande au Gateway en cours d’exécution son instantané d’état (aucune socket de canal
directe depuis la CLI). Par défaut, elle peut retourner un instantané Gateway mis en cache récent ; le
Gateway actualise ensuite ce cache en arrière-plan. `openclaw health --verbose` force
plutôt une sonde en direct. La commande signale les identifiants liés/l’ancienneté de l’authentification lorsqu’ils sont disponibles,
les résumés de sondes par canal, le résumé du magasin de sessions et la durée de la sonde. Elle se termine
avec un code non nul si le Gateway est inaccessible ou si la sonde échoue/expire.

Options :

- `--json` : sortie JSON lisible par machine
- `--timeout <ms>` : remplace le délai d’expiration par défaut de 10 s de la sonde
- `--verbose` : force une sonde en direct et affiche les détails de connexion au Gateway
- `--debug` : alias de `--verbose`

L’instantané d’état inclut : `ok` (booléen), `ts` (horodatage), `durationMs` (temps de sonde), l’état par canal, la disponibilité des agents et le résumé du magasin de sessions.

## Connexe

- [Runbook Gateway](/fr/gateway)
- [Export de diagnostics](/fr/gateway/diagnostics)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
