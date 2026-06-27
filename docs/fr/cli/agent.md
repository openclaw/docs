---
read_when:
    - Vous voulez exécuter un tour d’agent depuis des scripts (avec livraison facultative de la réponse)
summary: Référence CLI pour `openclaw agent` (envoyer un tour d’agent via le Gateway)
title: Agent
x-i18n:
    generated_at: "2026-06-27T17:17:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Exécuter un tour d’agent via le Gateway (utilisez `--local` pour le mode embarqué).
Utilisez `--agent <id>` pour cibler directement un agent configuré.

Passez au moins un sélecteur de session :

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

Associé :

- Outil d’envoi Agent : [Envoi Agent](/fr/tools/agent-send)

## Options

- `-m, --message <text>` : corps du message
- `--message-file <path>` : lire le corps du message depuis un fichier UTF-8
- `-t, --to <dest>` : destinataire utilisé pour dériver la clé de session
- `--session-key <key>` : clé de session explicite à utiliser pour le routage
- `--session-id <id>` : id de session explicite
- `--agent <id>` : id d’agent ; remplace les liaisons de routage
- `--model <id>` : modèle de remplacement pour cette exécution (`provider/model` ou id de modèle)
- `--thinking <level>` : niveau de réflexion de l’agent (`off`, `minimal`, `low`, `medium`, `high`, plus les niveaux personnalisés pris en charge par le fournisseur, comme `xhigh`, `adaptive` ou `max`)
- `--verbose <on|off>` : persister le niveau détaillé pour la session
- `--channel <channel>` : canal de livraison ; omettez-le pour utiliser le canal de session principal
- `--reply-to <target>` : remplacement de la cible de livraison
- `--reply-channel <channel>` : remplacement du canal de livraison
- `--reply-account <id>` : remplacement du compte de livraison
- `--local` : exécuter directement l’agent embarqué (après le préchargement du registre de plugins)
- `--deliver` : renvoyer la réponse au canal/à la cible sélectionnés
- `--timeout <seconds>` : remplacer le délai d’expiration de l’agent (600 par défaut ou valeur de configuration)
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

## Notes

- Passez exactement l’une des options `--message` ou `--message-file`. `--message-file` préserve le contenu multiligne du fichier après suppression d’un éventuel BOM UTF-8, et rejette les fichiers qui ne sont pas du UTF-8 valide.
- Le mode Gateway revient à l’agent embarqué lorsque la requête au Gateway échoue. Utilisez `--local` pour forcer l’exécution embarquée dès le départ.
- `--local` précharge tout de même d’abord le registre de plugins, afin que les fournisseurs, outils et canaux fournis par les plugins restent disponibles pendant les exécutions embarquées.
- Les exécutions `--local` et les exécutions de secours embarquées sont traitées comme des exécutions ponctuelles. Les ressources MCP de bouclage groupées et les sessions stdio Claude chaudes ouvertes pour ce processus local sont supprimées après la réponse, afin que les invocations scriptées ne gardent pas de processus enfants locaux en vie.
- Les exécutions appuyées par Gateway laissent les ressources MCP de bouclage appartenant au Gateway sous le processus Gateway en cours d’exécution ; les anciens clients peuvent encore envoyer l’indicateur de nettoyage historique, mais le Gateway l’accepte comme une absence d’opération de compatibilité.
- `--channel`, `--reply-channel` et `--reply-account` affectent la livraison de la réponse, pas le routage de session.
- `--session-key` sélectionne une clé de session explicite. Les clés préfixées par l’agent doivent utiliser `agent:<agent-id>:<session-key>`, et `--agent` doit correspondre à l’id d’agent de la clé lorsque les deux sont fournis. Les clés nues non sentinelles sont limitées à `--agent` lorsqu’il est fourni, ou à l’agent par défaut configuré sinon ; par exemple, `--agent ops --session-key incident-42` route vers `agent:ops:incident-42`. Les littéraux `global` et `unknown` restent non limités uniquement lorsqu’aucun `--agent` n’est fourni ; dans ce cas, le secours embarqué et la propriété du stockage utilisent l’agent par défaut configuré.
- `--json` réserve stdout à la réponse JSON. Les diagnostics du Gateway, des plugins et du secours embarqué sont routés vers stderr afin que les scripts puissent analyser stdout directement.
- Le JSON du secours embarqué inclut `meta.transport: "embedded"` et `meta.fallbackFrom: "gateway"` afin que les scripts puissent distinguer les exécutions de secours des exécutions Gateway.
- Si le Gateway accepte une exécution d’agent mais que la CLI dépasse le délai d’attente en attendant la réponse finale, le secours embarqué utilise un nouvel id explicite de session/exécution `gateway-fallback-*` et signale `meta.fallbackReason: "gateway_timeout"` plus les champs de session de secours. Cela évite de créer une course avec le verrou de transcription appartenant au Gateway ou de remplacer silencieusement la session de conversation routée d’origine.
- Pour les exécutions appuyées par Gateway, `SIGTERM` et `SIGINT` interrompent la requête CLI en attente. Si le Gateway a déjà accepté l’exécution, la CLI envoie aussi `chat.abort` pour cet id d’exécution accepté avant de quitter. Les exécutions locales `--local` et les exécutions de secours embarquées reçoivent le même signal d’abandon, mais n’envoient pas `chat.abort`. Si un `--run-id` en double atteint le Gateway alors que l’exécution d’agent d’origine est toujours active, la réponse en double signale `status: "in_flight"` et la CLI non JSON imprime un diagnostic stderr au lieu d’une réponse vide. Pour les enveloppes cron/systemd externes, conservez un garde-fou externe d’arrêt forcé comme `timeout -k 60 600 openclaw agent ...` afin que le superviseur puisse toujours récupérer le processus si l’arrêt ne peut pas se vider.
- Lorsque cette commande déclenche la régénération de `models.json`, les identifiants de fournisseur gérés par SecretRef sont persistés sous forme de marqueurs non secrets (par exemple des noms de variables d’environnement, `secretref-env:ENV_VAR_NAME` ou `secretref-managed`), et non en texte clair de secret résolu.
- Les écritures de marqueurs font autorité sur la source : OpenClaw persiste les marqueurs depuis l’instantané de configuration source actif, et non depuis les valeurs secrètes d’exécution résolues.

## État de livraison JSON

Lorsque `--json --deliver` est utilisé, la réponse JSON de la CLI peut inclure `deliveryStatus` au niveau supérieur, afin que les scripts puissent distinguer les envois livrés, supprimés, partiels et échoués :

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

`deliveryStatus.status` vaut `sent`, `suppressed`, `partial_failed` ou `failed`. `suppressed` signifie que la livraison n’a volontairement pas été envoyée, par exemple parce qu’un hook d’envoi de message l’a annulée ou qu’il n’y avait aucun résultat visible ; c’est tout de même un résultat terminal sans nouvelle tentative. `partial_failed` signifie qu’au moins une charge utile a été envoyée avant l’échec d’une charge utile ultérieure. `failed` signifie qu’aucun envoi durable ne s’est terminé ou que la prévalidation de livraison a échoué.

Les réponses CLI appuyées par Gateway préservent aussi la forme brute du résultat Gateway, où le même objet est disponible à `result.deliveryStatus`.

Champs courants :

- `requested` : toujours `true` lorsque l’objet est présent.
- `attempted` : `true` après l’exécution du chemin d’envoi durable ; `false` pour les échecs de prévalidation ou l’absence de charges utiles visibles.
- `succeeded` : `true`, `false` ou `"partial"` ; `"partial"` va avec `status: "partial_failed"`.
- `reason` : une raison snake-case en minuscules issue de la livraison durable ou de la validation de prévalidation. Les raisons connues incluent `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` et `no_delivery_target` ; les envois durables échoués peuvent aussi signaler l’étape échouée. Traitez les valeurs inconnues comme opaques, car l’ensemble peut s’étendre.
- `resultCount` : nombre de résultats d’envoi au canal lorsqu’il est disponible.
- `sentBeforeError` : `true` lorsqu’un échec partiel a envoyé au moins une charge utile avant l’erreur.
- `error` : booléen `true` pour les envois échoués ou partiellement échoués.
- `errorMessage` : inclus uniquement lorsqu’un message d’erreur de livraison sous-jacent est capturé. Les échecs de prévalidation portent `error` et `reason`, mais pas `errorMessage`.
- `payloadOutcomes` : résultats facultatifs par charge utile avec `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` ou les métadonnées de hook lorsqu’elles sont disponibles.

## Associé

- [Référence CLI](/fr/cli)
- [Exécution de l’agent](/fr/concepts/agent)
