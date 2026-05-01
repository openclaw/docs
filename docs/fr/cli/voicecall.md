---
read_when:
    - Vous utilisez le Plugin voice-call et voulez les points d’entrée CLI
    - Vous voulez des exemples rapides pour `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Référence CLI pour `openclaw voicecall` (surface de commandes du Plugin voice-call)
title: Appel vocal
x-i18n:
    generated_at: "2026-05-01T07:13:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` est une commande fournie par un plugin. Elle n’apparaît que si le plugin d’appel vocal est installé et activé.

Lorsque le Gateway est en cours d’exécution, les commandes opérationnelles (`call`, `start`,
`continue`, `speak`, `dtmf`, `end` et `status`) sont envoyées au runtime
d’appel vocal de ce Gateway. Si aucun Gateway n’est joignable, elles basculent vers un runtime
CLI autonome.

Documentation principale :

- Plugin d’appel vocal : [Appel vocal](/fr/plugins/voice-call)

## Commandes courantes

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` affiche par défaut des vérifications de préparation lisibles par un humain. Utilisez `--json` pour les
scripts :

```bash
openclaw voicecall setup --json
```

`status` affiche les appels actifs au format JSON par défaut. Passez `--call-id <id>` pour inspecter
un appel.

Pour les fournisseurs externes (`twilio`, `telnyx`, `plivo`), la configuration doit résoudre une URL
Webhook publique depuis `publicUrl`, un tunnel ou une exposition Tailscale. Un repli de service
en loopback/privé est refusé, car les opérateurs ne peuvent pas l’atteindre.

`smoke` exécute les mêmes vérifications de préparation. Il ne passera pas de véritable appel téléphonique
sauf si `--to` et `--yes` sont tous les deux présents :

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## Exposer les Webhooks (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Note de sécurité : exposez le point de terminaison Webhook uniquement aux réseaux auxquels vous faites confiance. Préférez Tailscale Serve à Funnel lorsque c’est possible.

## Connexe

- [Référence CLI](/fr/cli)
- [Plugin d’appel vocal](/fr/plugins/voice-call)
