---
read_when:
    - Vous souhaitez jumeler rapidement une application Node mobile avec un Gateway
    - Vous avez besoin de la sortie setup-code pour le partage distant/manuel
summary: Référence CLI pour `openclaw qr` (générer le QR d’appairage mobile + le code de configuration)
title: QR
x-i18n:
    generated_at: "2026-07-04T17:57:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
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

- `--remote` : privilégie `gateway.remote.url` ; s’il n’est pas défini, `gateway.tailscale.mode=serve|funnel` peut tout de même fournir l’URL publique distante
- `--url <url>` : remplace l’URL de Gateway utilisée dans la charge utile
- `--public-url <url>` : remplace l’URL publique utilisée dans la charge utile
- `--token <token>` : remplace le jeton Gateway auprès duquel le flux d’amorçage s’authentifie
- `--password <password>` : remplace le mot de passe Gateway auprès duquel le flux d’amorçage s’authentifie
- `--setup-code-only` : affiche uniquement le code de configuration
- `--no-ascii` : ignore le rendu QR ASCII
- `--json` : émet du JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notes

- `--token` et `--password` sont mutuellement exclusifs.
- Le code de configuration lui-même transporte désormais un `bootstrapToken` opaque à courte durée de vie, et non le jeton/mot de passe Gateway partagé.
- L’amorçage intégré par code de configuration renvoie un jeton `node` principal avec `scopes: []`, ainsi qu’un jeton de transfert `operator` limité pour l’intégration mobile de confiance.
- Le jeton opérateur transféré est limité à `operator.approvals`, `operator.read`, `operator.talk.secrets` et `operator.write` ; les portées de mutation d’appairage et `operator.admin` nécessitent toujours un appairage opérateur approuvé distinct ou un flux de jeton distinct.
- L’appairage mobile échoue de manière fermée pour les URL Gateway Tailscale/publiques en `ws://`. Les adresses LAN privées et les hôtes Bonjour `.local` restent pris en charge via `ws://`, mais les routes mobiles Tailscale/publiques doivent utiliser Tailscale Serve/Funnel ou une URL Gateway en `wss://`.
- Avec `--remote`, OpenClaw exige soit `gateway.remote.url`, soit
  `gateway.tailscale.mode=serve|funnel`.
- Avec `--remote`, si des identifiants distants effectivement actifs sont configurés comme SecretRefs et que vous ne passez pas `--token` ou `--password`, la commande les résout à partir de l’instantané Gateway actif. Si Gateway est indisponible, la commande échoue rapidement.
- Sans `--remote`, les SecretRefs d’authentification Gateway locale sont résolus lorsqu’aucune substitution d’authentification CLI n’est passée :
  - `gateway.auth.token` se résout lorsque l’authentification par jeton peut l’emporter (`gateway.auth.mode="token"` explicite ou mode déduit où aucune source de mot de passe ne l’emporte).
  - `gateway.auth.password` se résout lorsque l’authentification par mot de passe peut l’emporter (`gateway.auth.mode="password"` explicite ou mode déduit sans jeton gagnant provenant de l’authentification/de l’environnement).
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés (y compris comme SecretRefs) et que `gateway.auth.mode` n’est pas défini, la résolution du code de configuration échoue jusqu’à ce que le mode soit défini explicitement.
- Note sur le décalage de version de Gateway : ce chemin de commande nécessite une passerelle qui prend en charge `secrets.resolve` ; les passerelles plus anciennes renvoient une erreur de méthode inconnue.
- Les applications iOS et Android officielles d’OpenClaw se connectent automatiquement lorsque leurs
  métadonnées de code de configuration correspondent. Si une demande reste en attente (par exemple, pour un
  client non officiel ou des métadonnées non concordantes), examinez-la et approuvez-la avec :
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Connexe

- [Référence CLI](/fr/cli)
- [Appairage](/fr/cli/pairing)
