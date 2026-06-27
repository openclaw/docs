---
read_when:
    - Vous voulez associer rapidement une application de nœud mobile à un Gateway
    - Vous avez besoin de la sortie setup-code pour le partage à distance/manuel
summary: Référence CLI pour `openclaw qr` (générer le QR code d’appairage mobile + le code de configuration)
title: QR
x-i18n:
    generated_at: "2026-06-27T17:21:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Générez un QR d’appairage mobile et un code de configuration à partir de votre configuration actuelle du Gateway.

## Utilisation

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Options

- `--remote` : préférer `gateway.remote.url` ; si elle n’est pas définie, `gateway.tailscale.mode=serve|funnel` peut tout de même fournir l’URL publique distante
- `--url <url>` : remplacer l’URL du gateway utilisée dans la charge utile
- `--public-url <url>` : remplacer l’URL publique utilisée dans la charge utile
- `--token <token>` : remplacer le jeton gateway auprès duquel le flux d’amorçage s’authentifie
- `--password <password>` : remplacer le mot de passe gateway auprès duquel le flux d’amorçage s’authentifie
- `--setup-code-only` : afficher uniquement le code de configuration
- `--no-ascii` : ignorer le rendu QR ASCII
- `--json` : émettre du JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notes

- `--token` et `--password` sont mutuellement exclusifs.
- Le code de configuration lui-même contient désormais un `bootstrapToken` opaque et de courte durée, et non le jeton/mot de passe gateway partagé.
- L’amorçage intégré par code de configuration renvoie un jeton `node` principal avec `scopes: []`, plus un jeton de transfert `operator` borné pour l’intégration mobile de confiance.
- Le jeton operator transmis est limité à `operator.approvals`, `operator.read`, `operator.talk.secrets` et `operator.write` ; `operator.admin` et `operator.pairing` nécessitent un flux d’appairage operator ou de jeton approuvé distinct.
- L’appairage mobile échoue en mode fermé pour les URL gateway Tailscale/publiques en `ws://`. Les adresses LAN privées et les hôtes Bonjour `.local` restent pris en charge via `ws://`, mais les routes mobiles Tailscale/publiques doivent utiliser Tailscale Serve/Funnel ou une URL gateway `wss://`.
- Avec `--remote`, OpenClaw exige soit `gateway.remote.url`, soit
  `gateway.tailscale.mode=serve|funnel`.
- Avec `--remote`, si des identifiants distants effectivement actifs sont configurés comme SecretRefs et que vous ne passez pas `--token` ni `--password`, la commande les résout depuis l’instantané actif du gateway. Si le gateway est indisponible, la commande échoue rapidement.
- Sans `--remote`, les SecretRefs d’authentification du gateway local sont résolus lorsqu’aucun remplacement d’authentification CLI n’est passé :
  - `gateway.auth.token` est résolu lorsque l’authentification par jeton peut l’emporter (`gateway.auth.mode="token"` explicite ou mode déduit lorsqu’aucune source de mot de passe ne l’emporte).
  - `gateway.auth.password` est résolu lorsque l’authentification par mot de passe peut l’emporter (`gateway.auth.mode="password"` explicite ou mode déduit sans jeton gagnant depuis auth/env).
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés (y compris via SecretRefs) et que `gateway.auth.mode` n’est pas défini, la résolution du code de configuration échoue jusqu’à ce que le mode soit défini explicitement.
- Note sur le décalage de version du Gateway : ce chemin de commande nécessite un gateway qui prend en charge `secrets.resolve` ; les gateways plus anciens renvoient une erreur de méthode inconnue.
- Après l’analyse, approuvez l’appairage de l’appareil avec :
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Connexe

- [Référence CLI](/fr/cli)
- [Appairage](/fr/cli/pairing)
