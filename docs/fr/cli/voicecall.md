---
read_when:
    - Vous utilisez le Plugin d’appel vocal et voulez les points d’entrée CLI
    - Vous voulez des exemples rapides pour `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Référence CLI pour `openclaw voicecall` (surface de commande du Plugin voice-call)
title: Appel vocal
x-i18n:
    generated_at: "2026-04-25T13:44:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` est une commande fournie par un Plugin. Elle n’apparaît que si le Plugin d’appel vocal est installé et activé.

Documentation principale :

- Plugin d’appel vocal : [Appel vocal](/fr/plugins/voice-call)

## Commandes courantes

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` affiche par défaut des vérifications de préparation lisibles par des humains. Utilisez `--json` pour les scripts :

```bash
openclaw voicecall setup --json
```

Pour les fournisseurs externes (`twilio`, `telnyx`, `plivo`), la configuration doit résoudre une URL Webhook publique à partir de `publicUrl`, d’un tunnel ou d’une exposition Tailscale. Un repli de service loopback/privé est rejeté, car les opérateurs ne peuvent pas l’atteindre.

`smoke` exécute les mêmes vérifications de préparation. Il ne passera pas de véritable appel téléphonique sauf si `--to` et `--yes` sont tous deux présents :

```bash
openclaw voicecall smoke --to "+15555550123"        # essai à blanc
openclaw voicecall smoke --to "+15555550123" --yes  # appel notify réel
```

## Exposition des Webhooks (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Remarque de sécurité : n’exposez le point de terminaison Webhook qu’aux réseaux de confiance. Préférez Tailscale Serve à Funnel lorsque c’est possible.

## Lié

- [Référence CLI](/fr/cli)
- [Plugin d’appel vocal](/fr/plugins/voice-call)
