---
read_when:
    - Vous souhaitez exécuter un tour d’agent depuis des scripts (avec envoi facultatif de la réponse)
summary: Référence de la CLI pour `openclaw agent` (envoyer un tour d’agent via le Gateway)
title: Agent
x-i18n:
    generated_at: "2026-07-12T02:28:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Exécute un tour d’agent via le Gateway. Revient à l’agent intégré si la requête au Gateway échoue ; passez `--local` pour forcer d’emblée l’exécution intégrée.

Fournissez au moins un sélecteur de session : `--to`, `--session-key`, `--session-id` ou `--agent`.

Voir aussi : [Outil d’envoi de l’agent](/fr/tools/agent-send)

## Options

- `-m, --message <text>` : corps du message
- `--message-file <path>` : lire le corps du message depuis un fichier UTF-8
- `-t, --to <dest>` : destinataire utilisé pour dériver la clé de session
- `--session-key <key>` : clé de session explicite à utiliser pour le routage
- `--session-id <id>` : identifiant de session explicite
- `--agent <id>` : identifiant de l’agent ; remplace les liaisons de routage
- `--model <id>` : remplacement du modèle pour cette exécution (`provider/model` ou identifiant du modèle)
- `--thinking <level>` : niveau de réflexion de l’agent (`off`, `minimal`, `low`, `medium`, `high`, ainsi que les niveaux personnalisés pris en charge par le fournisseur, tels que `xhigh`, `adaptive` ou `max`)
- `--verbose <on|off>` : conserver le niveau de verbosité pour la session
- `--channel <channel>` : canal de livraison ; omettez cette option pour utiliser le canal principal de la session
- `--reply-to <target>` : remplacement de la cible de livraison
- `--reply-channel <channel>` : remplacement du canal de livraison
- `--reply-account <id>` : remplacement du compte de livraison
- `--local` : exécuter directement l’agent intégré (après le préchargement du registre des plugins)
- `--deliver` : renvoyer la réponse au canal ou à la cible sélectionnés
- `--timeout <seconds>` : remplacer le délai d’expiration de l’agent (600 par défaut, ou `agents.defaults.timeoutSeconds`) ; `0` désactive le délai d’expiration
- `--json` : produire du JSON

## Exemples

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Remarques

- Fournissez exactement l’une des options `--message` ou `--message-file`. `--message-file` supprime un BOM UTF-8 initial et préserve le contenu multiligne ; les fichiers qui ne sont pas valides en UTF-8 sont rejetés.
- Les commandes précédées d’une barre oblique (par exemple `/compact`) ne peuvent pas être exécutées via `--message`. La CLI les rejette et vous indique à la place la commande dédiée (`openclaw sessions compact <key>` pour la Compaction).
- Les exécutions avec `--local` et celles utilisant le repli intégré sont ponctuelles : les ressources MCP local loopback groupées et les sessions stdio Claude déjà ouvertes pour l’exécution sont arrêtées après la réponse, afin que les appels par script ne laissent pas de processus enfants locaux en cours d’exécution. Les exécutions adossées au Gateway conservent à la place les ressources MCP local loopback détenues par le Gateway dans le processus Gateway en cours d’exécution.
- Lorsque `--agent`, `--channel` et `--to` sont utilisés ensemble, le routage de la session suit le destinataire canonique du canal et `session.dmScope`. Les canaux disposant d’une identité de destinataire stable uniquement pour les envois utilisent une session détenue par le fournisseur et isolée de la session principale de l’agent. `--reply-channel` et `--reply-account` n’affectent que la livraison.
- `--session-key` sélectionne une clé de session explicite. Les clés préfixées par un agent doivent utiliser `agent:<agent-id>:<session-key>`, et `--agent` doit correspondre à l’identifiant d’agent de la clé lorsque les deux sont fournis. Les clés simples qui ne sont pas des sentinelles sont rattachées à `--agent` lorsqu’il est fourni, ou à l’agent par défaut configuré dans le cas contraire ; par exemple, `--agent ops --session-key incident-42` route vers `agent:ops:incident-42`. Les clés littérales `global` et `unknown` restent sans portée uniquement lorsqu’aucune option `--agent` n’est fournie.
- `--json` réserve stdout à la réponse JSON ; les diagnostics du Gateway, des plugins et du repli intégré sont envoyés vers stderr afin que les scripts puissent analyser directement stdout.
- Le JSON du repli intégré inclut `meta.transport: "embedded"` et `meta.fallbackFrom: "gateway"` afin que les scripts puissent détecter une exécution de repli.
- Si le Gateway accepte une exécution, mais que la CLI atteint son délai d’expiration en attendant la réponse finale, le repli intégré utilise un nouvel identifiant de session ou d’exécution `gateway-fallback-*` et signale `meta.fallbackReason: "gateway_timeout"` ainsi que les champs de la session de repli, au lieu d’entrer en concurrence avec la transcription détenue par le Gateway ou de remplacer silencieusement la session d’origine.
- `SIGTERM`/`SIGINT` interrompent une requête adossée au Gateway en attente ; si le Gateway a déjà accepté l’exécution, la CLI envoie également `chat.abort` pour cet identifiant d’exécution avant de quitter. Les exécutions avec `--local` et celles utilisant le repli intégré reçoivent le même signal, mais n’envoient pas `chat.abort`. Si la clé interne de déduplication des exécutions possède déjà une exécution active pour cette session, la réponse signale `status: "in_flight"` et la CLI hors JSON affiche un diagnostic sur stderr au lieu d’une réponse vide. Pour les enveloppes cron/systemd externes, conservez un mécanisme de secours d’arrêt forcé tel que `timeout -k 60 600 openclaw agent ...`, afin que le superviseur puisse récupérer le processus si l’arrêt ne peut pas se terminer proprement.
- Lorsque cette commande déclenche la régénération de `models.json`, les identifiants du fournisseur gérés par SecretRef sont conservés sous forme de marqueurs non secrets (par exemple des noms de variables d’environnement, `secretref-env:ENV_VAR_NAME` ou `secretref-managed`), et jamais sous forme de secrets résolus en texte brut. Les marqueurs écrits proviennent de l’instantané de configuration source actif, et non des valeurs secrètes résolues lors de l’exécution.

## État de la livraison JSON

Avec `--json --deliver`, la réponse JSON de la CLI inclut le champ de premier niveau `deliveryStatus`, afin que les scripts puissent distinguer les envois livrés, supprimés, partiels et échoués :

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

Les réponses de la CLI adossées au Gateway préservent également la structure brute du résultat du Gateway dans `result.deliveryStatus`.

`deliveryStatus.status` prend l’une des valeurs suivantes :

| État             | Signification                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sent`           | Livraison terminée.                                                                                                                                                             |
| `suppressed`     | La livraison n’a intentionnellement pas été envoyée (par exemple, un hook d’envoi de message l’a annulée ou aucun résultat visible n’était disponible). État final, sans reprise. |
| `partial_failed` | Au moins une charge utile a été envoyée avant l’échec d’une charge utile ultérieure.                                                                                            |
| `failed`         | Aucun envoi durable n’a abouti, ou les contrôles préalables à la livraison ont échoué.                                                                                           |

Champs courants :

- `requested` : toujours `true` lorsque l’objet est présent.
- `attempted` : `true` dès que le chemin d’envoi durable a été exécuté ; `false` en cas d’échec des contrôles préalables ou en l’absence de charges utiles visibles.
- `succeeded` : `true`, `false` ou `"partial"` ; `"partial"` est associé à `status: "partial_failed"`.
- `reason` : motif en minuscules au format snake_case issu de la livraison durable ou de la validation préalable. Les valeurs connues incluent `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` et `no_delivery_target` ; les échecs d’envois durables peuvent également indiquer l’étape ayant échoué. Traitez les valeurs inconnues comme opaques, car cet ensemble peut s’étendre.
- `resultCount` : nombre de résultats d’envoi du canal, lorsqu’il est disponible.
- `sentBeforeError` : `true` lorsqu’un échec partiel a envoyé au moins une charge utile avant de rencontrer une erreur.
- `error` : `true` pour les envois échoués ou partiellement échoués.
- `errorMessage` : présent uniquement lorsqu’un message d’erreur de livraison sous-jacent a été capturé. Les échecs des contrôles préalables comportent `error`/`reason`, mais pas `errorMessage`.
- `payloadOutcomes` : résultats facultatifs par charge utile, avec `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` ou les métadonnées du hook lorsqu’elles sont disponibles.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Environnement d’exécution de l’agent](/fr/concepts/agent)
