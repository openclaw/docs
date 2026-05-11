---
read_when:
    - Vous voulez exécuter un tour d’agent depuis des scripts (avec envoi facultatif de la réponse)
summary: Référence CLI pour `openclaw agent` (envoyer un tour d’agent via le Gateway)
title: Agent
x-i18n:
    generated_at: "2026-05-11T20:25:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae5c2f895cadf70a6253e49a3c7c698a04840a24231076cf8ef5bab340162f52
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Exécutez un tour d’agent via le Gateway (utilisez `--local` pour le mode intégré).
Utilisez `--agent <id>` pour cibler directement un agent configuré.

Passez au moins un sélecteur de session :

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Lié :

- Outil d’envoi à l’agent : [Envoi à l’agent](/fr/tools/agent-send)

## Options

- `-m, --message <text>` : corps du message requis
- `-t, --to <dest>` : destinataire utilisé pour dériver la clé de session
- `--session-id <id>` : id de session explicite
- `--agent <id>` : id d’agent ; remplace les liaisons de routage
- `--model <id>` : remplacement du modèle pour cette exécution (`provider/model` ou id de modèle)
- `--thinking <level>` : niveau de réflexion de l’agent (`off`, `minimal`, `low`, `medium`, `high`, plus les niveaux personnalisés pris en charge par le fournisseur, tels que `xhigh`, `adaptive` ou `max`)
- `--verbose <on|off>` : conserve le niveau détaillé pour la session
- `--channel <channel>` : canal de livraison ; omettez-le pour utiliser le canal principal de la session
- `--reply-to <target>` : remplacement de la cible de livraison
- `--reply-channel <channel>` : remplacement du canal de livraison
- `--reply-account <id>` : remplacement du compte de livraison
- `--local` : exécute directement l’agent intégré (après le préchargement du registre des Plugins)
- `--deliver` : renvoie la réponse au canal ou à la cible sélectionné
- `--timeout <seconds>` : remplace le délai d’expiration de l’agent (par défaut 600 ou valeur de configuration)
- `--json` : produit du JSON

## Exemples

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Notes

- Le mode Gateway se rabat sur l’agent intégré lorsque la requête Gateway échoue. Utilisez `--local` pour forcer dès le départ l’exécution intégrée.
- `--local` précharge tout de même d’abord le registre des Plugins, afin que les fournisseurs, outils et canaux fournis par les Plugins restent disponibles pendant les exécutions intégrées.
- `--local` et les exécutions de repli intégrées sont traitées comme des exécutions ponctuelles. Les ressources de loopback MCP groupées et les sessions stdio Claude chaudes ouvertes pour ce processus local sont arrêtées après la réponse, afin que les invocations scriptées ne conservent pas de processus enfants locaux actifs.
- Les exécutions adossées au Gateway laissent les ressources de loopback MCP détenues par le Gateway sous le processus Gateway en cours ; les anciens clients peuvent encore envoyer l’indicateur de nettoyage historique, mais le Gateway l’accepte comme un no-op de compatibilité.
- `--channel`, `--reply-channel` et `--reply-account` affectent la livraison de la réponse, pas le routage de session.
- `--json` réserve stdout à la réponse JSON. Les diagnostics du Gateway, des Plugins et du repli intégré sont routés vers stderr afin que les scripts puissent analyser stdout directement.
- Le JSON de repli intégré inclut `meta.transport: "embedded"` et `meta.fallbackFrom: "gateway"` afin que les scripts puissent distinguer les exécutions de repli des exécutions Gateway.
- Si le Gateway accepte une exécution d’agent mais que la CLI expire en attendant la réponse finale, le repli intégré utilise un nouvel id de session/exécution explicite `gateway-fallback-*` et signale `meta.fallbackReason: "gateway_timeout"` ainsi que les champs de session de repli. Cela évite les courses avec le verrou de transcription détenu par le Gateway ou le remplacement silencieux de la session de conversation routée d’origine.
- Lorsque cette commande déclenche la régénération de `models.json`, les identifiants de fournisseurs gérés par SecretRef sont persistés sous forme de marqueurs non secrets (par exemple des noms de variables d’environnement, `secretref-env:ENV_VAR_NAME` ou `secretref-managed`), et non sous forme de texte secret résolu.
- Les écritures de marqueurs font autorité depuis la source : OpenClaw persiste les marqueurs depuis l’instantané de configuration source actif, pas depuis les valeurs secrètes d’exécution résolues.

## État de livraison JSON

Lorsque `--json --deliver` est utilisé, la réponse JSON de la CLI peut inclure `deliveryStatus` au niveau supérieur afin que les scripts puissent distinguer les envois livrés, supprimés, partiels et échoués :

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

`deliveryStatus.status` vaut `sent`, `suppressed`, `partial_failed` ou `failed`. `suppressed` signifie que la livraison n’a intentionnellement pas été envoyée, par exemple parce qu’un hook d’envoi de message l’a annulée ou parce qu’il n’y avait aucun résultat visible ; cela reste un résultat terminal sans nouvelle tentative. `partial_failed` signifie qu’au moins une charge utile a été envoyée avant qu’une charge utile ultérieure échoue. `failed` signifie qu’aucun envoi durable n’a été terminé ou que le contrôle préalable de livraison a échoué.

Les réponses CLI adossées au Gateway préservent également la forme brute du résultat Gateway, où le même objet est disponible à `result.deliveryStatus`.

Champs courants :

- `requested` : toujours `true` lorsque l’objet est présent.
- `attempted` : `true` après l’exécution du chemin d’envoi durable ; `false` pour les échecs de contrôle préalable ou l’absence de charges utiles visibles.
- `succeeded` : `true`, `false` ou `"partial"` ; `"partial"` va avec `status: "partial_failed"`.
- `reason` : une raison en minuscules snake-case provenant de la livraison durable ou de la validation de contrôle préalable. Les raisons connues incluent `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` et `no_delivery_target` ; les envois durables échoués peuvent aussi signaler l’étape échouée. Traitez les valeurs inconnues comme opaques, car l’ensemble peut s’étendre.
- `resultCount` : nombre de résultats d’envoi du canal lorsqu’il est disponible.
- `sentBeforeError` : `true` lorsqu’un échec partiel a envoyé au moins une charge utile avant l’erreur.
- `error` : booléen `true` pour les envois échoués ou partiellement échoués.
- `errorMessage` : inclus uniquement lorsqu’un message d’erreur de livraison sous-jacent est capturé. Les échecs de contrôle préalable portent `error` et `reason`, mais pas `errorMessage`.
- `payloadOutcomes` : résultats facultatifs par charge utile avec `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` ou les métadonnées de hook lorsqu’elles sont disponibles.

## Lié

- [Référence CLI](/fr/cli)
- [Exécution de l’agent](/fr/concepts/agent)
