---
read_when:
    - Vous souhaitez associer rapidement une application Node mobile à un Gateway
    - Vous avez besoin de la sortie setup-code pour le partage à distance/manuel
summary: Référence CLI pour `openclaw qr` (générer le code QR d’appairage mobile + le code de configuration)
title: QR
x-i18n:
    generated_at: "2026-07-03T13:27:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2a0d71fb7be0734a015084bfb5edef74953310d384964eab9cccbabf7c497e3
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Générez un QR d’appairage mobile et un code de configuration à partir de votre configuration Gateway actuelle.

## Utilisation

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Options

- `--remote` : préférer `gateway.remote.url` ; si cette valeur n’est pas définie, `gateway.tailscale.mode=serve|funnel` peut tout de même fournir l’URL publique distante
- `--url <url>` : remplacer l’URL du Gateway utilisée dans la charge utile
- `--public-url <url>` : remplacer l’URL publique utilisée dans la charge utile
- `--token <token>` : remplacer le jeton Gateway auprès duquel le flux d’amorçage s’authentifie
- `--password <password>` : remplacer le mot de passe Gateway auprès duquel le flux d’amorçage s’authentifie
- `--setup-code-only` : afficher uniquement le code de configuration
- `--no-ascii` : ignorer le rendu ASCII du QR
- `--json` : émettre du JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notes

- `--token` et `--password` sont mutuellement exclusifs.
- Le code de configuration lui-même transporte désormais un `bootstrapToken` opaque à courte durée de vie, et non le jeton/mot de passe Gateway partagé.
- L’amorçage intégré par code de configuration renvoie un jeton `node` principal avec `scopes: []`, plus un jeton de transfert `operator` borné pour l’onboarding mobile approuvé.
- Le jeton opérateur transféré est limité à `operator.approvals`, `operator.read`, `operator.talk.secrets` et `operator.write` ; les portées de mutation d’appairage et `operator.admin` nécessitent toujours un appairage opérateur approuvé séparé ou un flux de jeton distinct.
- L’appairage mobile échoue de manière fermée pour les URL Gateway Tailscale/publiques en `ws://`. Les adresses LAN privées et les hôtes Bonjour `.local` restent pris en charge via `ws://`, mais les routes mobiles Tailscale/publiques doivent utiliser Tailscale Serve/Funnel ou une URL Gateway en `wss://`.
- Avec `--remote`, OpenClaw nécessite soit `gateway.remote.url`, soit
  `gateway.tailscale.mode=serve|funnel`.
- Avec `--remote`, si les identifiants distants effectivement actifs sont configurés comme SecretRefs et que vous ne passez pas `--token` ni `--password`, la commande les résout depuis l’instantané Gateway actif. Si Gateway est indisponible, la commande échoue rapidement.
- Sans `--remote`, les SecretRefs d’authentification du Gateway local sont résolues lorsqu’aucun remplacement d’authentification CLI n’est fourni :
  - `gateway.auth.token` est résolu lorsque l’authentification par jeton peut l’emporter (`gateway.auth.mode="token"` explicite ou mode inféré où aucune source de mot de passe ne l’emporte).
  - `gateway.auth.password` est résolu lorsque l’authentification par mot de passe peut l’emporter (`gateway.auth.mode="password"` explicite ou mode inféré sans jeton gagnant provenant de l’authentification/de l’environnement).
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés (y compris avec des SecretRefs) et que `gateway.auth.mode` n’est pas défini, la résolution du code de configuration échoue jusqu’à ce que le mode soit défini explicitement.
- Note sur le décalage de version du Gateway : ce chemin de commande nécessite un Gateway qui prend en charge `secrets.resolve` ; les anciens Gateway renvoient une erreur de méthode inconnue.
- Après la numérisation, approuvez l’appairage de l’appareil avec :
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Associé

- [Référence CLI](/fr/cli)
- [Appairage](/fr/cli/pairing)
