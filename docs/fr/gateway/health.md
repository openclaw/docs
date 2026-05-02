---
read_when:
    - Diagnostiquer la connectivité des canaux ou l’état du Gateway
    - Comprendre les commandes et options CLI de contrôle d’intégrité
summary: Commandes de contrôle d’intégrité et surveillance de l’intégrité du Gateway
title: Contrôles d’intégrité
x-i18n:
    generated_at: "2026-05-02T07:06:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf1e0073a09592c6502f697e615f44d0f1a960caf4599888a8b72f22098c1e91
    source_path: gateway/health.md
    workflow: 16
---

Petit guide pour vérifier la connectivité des canaux sans supposer.

## Vérifications rapides

- `openclaw status` — résumé local : accessibilité/mode du Gateway, indication de mise à jour, âge de l’authentification du canal lié, sessions + activité récente.
- `openclaw status --all` — diagnostic local complet (lecture seule, couleur, sûr à coller pour le débogage).
- `openclaw status --deep` — demande au Gateway en cours d’exécution une sonde d’état en direct (`health` avec `probe:true`), y compris les sondes de canal par compte lorsqu’elles sont prises en charge.
- `openclaw health` — demande au Gateway en cours d’exécution son instantané d’état (WS uniquement ; pas de sockets de canal directes depuis la CLI).
- `openclaw health --verbose` — force une sonde d’état en direct et affiche les détails de connexion au Gateway.
- `openclaw health --json` — sortie d’instantané d’état lisible par machine.
- Envoyez `/status` comme message autonome dans WhatsApp/WebChat pour obtenir une réponse de statut sans invoquer l’agent.
- Journaux : suivez `/tmp/openclaw/openclaw-*.log` et filtrez sur `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Pour Discord et les autres fournisseurs de discussion, les lignes de session ne sont pas un indicateur de disponibilité des sockets.
`openclaw sessions`, Gateway `sessions.list` et l’outil d’agent `sessions_list`
lisent l’état de conversation stocké. Un fournisseur peut se reconnecter et afficher un état de canal sain
avant qu’une nouvelle ligne de session soit matérialisée. Utilisez les commandes d’état de canal et
de santé ci-dessus pour les vérifications de connectivité en direct.

## Diagnostics approfondis

- Identifiants sur disque : `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime doit être récent).
- Magasin de sessions : `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (le chemin peut être remplacé dans la configuration). Le nombre et les destinataires récents sont exposés via `status`.
- Flux de reconnexion : `openclaw channels logout && openclaw channels login --verbose` lorsque les codes de statut 409–515 ou `loggedOut` apparaissent dans les journaux. (Remarque : le flux de connexion par QR redémarre automatiquement une fois pour le statut 515 après l’association.)
- Les diagnostics sont activés par défaut. Le Gateway enregistre les faits opérationnels sauf si `diagnostics.enabled: false` est défini. Les événements mémoire enregistrent les nombres d’octets RSS/tas, la pression de seuil et la pression de croissance. Les avertissements de disponibilité enregistrent le délai de boucle d’événements, l’utilisation de la boucle d’événements, le ratio des cœurs CPU et les nombres de sessions actives/en attente/en file lorsque le processus s’exécute mais est saturé. Les événements de charge utile surdimensionnée enregistrent ce qui a été rejeté, tronqué ou découpé, ainsi que les tailles et limites lorsqu’elles sont disponibles. Ils n’enregistrent pas le texte du message, le contenu des pièces jointes, le corps du Webhook, le corps brut de requête ou de réponse, les jetons, les cookies ni les valeurs secrètes. Le même Heartbeat lance l’enregistreur de stabilité borné, disponible via `openclaw gateway stability` ou le RPC Gateway `diagnostics.stability`. Les sorties fatales du Gateway, les délais d’arrêt et les échecs de démarrage après redémarrage persistent le dernier instantané de l’enregistreur sous `~/.openclaw/logs/stability/` lorsque des événements existent ; inspectez le dernier lot enregistré avec `openclaw gateway stability --bundle latest`.
- Pour les rapports de bogue, exécutez `openclaw gateway diagnostics export` et joignez le zip généré. L’export combine un résumé Markdown, le dernier lot de stabilité, des métadonnées de journal assainies, des instantanés de statut/santé Gateway assainis et la forme de la configuration. Il est destiné au partage : le texte de discussion, les corps de Webhook, les sorties d’outils, les identifiants, les cookies, les identifiants de compte/message et les valeurs secrètes sont omis ou caviardés. Consultez [Export des diagnostics](/fr/gateway/diagnostics).

## Configuration du moniteur de santé

- `gateway.channelHealthCheckMinutes` : fréquence à laquelle le Gateway vérifie la santé du canal. Par défaut : `5`. Définissez `0` pour désactiver globalement les redémarrages du moniteur de santé.
- `gateway.channelStaleEventThresholdMinutes` : durée pendant laquelle un canal connecté peut rester inactif avant que le moniteur de santé le considère comme périmé et le redémarre. Par défaut : `30`. Gardez cette valeur supérieure ou égale à `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour` : limite glissante d’une heure pour les redémarrages du moniteur de santé par canal/compte. Par défaut : `10`.
- `channels.<provider>.healthMonitor.enabled` : désactive les redémarrages du moniteur de santé pour un canal spécifique tout en laissant la surveillance globale activée.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled` : remplacement multi-compte qui prévaut sur le réglage au niveau du canal.
- Ces remplacements par canal s’appliquent aux moniteurs de canal intégrés qui les exposent aujourd’hui : Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram et WhatsApp.

## En cas d’échec

- `logged out` ou statut 409–515 → reconnectez avec `openclaw channels logout` puis `openclaw channels login`.
- Gateway inaccessible → démarrez-le : `openclaw gateway --port 18789` (utilisez `--force` si le port est occupé).
- Aucun message entrant → confirmez que le téléphone lié est en ligne et que l’expéditeur est autorisé (`channels.whatsapp.allowFrom`) ; pour les discussions de groupe, assurez-vous que la liste d’autorisation + les règles de mention correspondent (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Commande « health » dédiée

`openclaw health` demande au Gateway en cours d’exécution son instantané d’état (pas de sockets de canal
directes depuis la CLI). Par défaut, elle peut renvoyer un instantané Gateway mis en cache récent ; le
Gateway actualise ensuite ce cache en arrière-plan. `openclaw health --verbose` force
plutôt une sonde en direct. La commande signale les identifiants liés/l’âge d’authentification lorsqu’ils sont disponibles,
les résumés de sonde par canal, le résumé du magasin de sessions et une durée de sonde. Elle se termine
avec un code non nul si le Gateway est inaccessible ou si la sonde échoue/expire.

Options :

- `--json` : sortie JSON lisible par machine
- `--timeout <ms>` : remplace le délai d’expiration par défaut de 10 s de la sonde
- `--verbose` : force une sonde en direct et affiche les détails de connexion au Gateway
- `--debug` : alias de `--verbose`

L’instantané d’état inclut : `ok` (booléen), `ts` (horodatage), `durationMs` (durée de la sonde), l’état par canal, la disponibilité de l’agent et le résumé du magasin de sessions.

## Associés

- [Runbook Gateway](/fr/gateway)
- [Export des diagnostics](/fr/gateway/diagnostics)
- [Dépannage Gateway](/fr/gateway/troubleshooting)
