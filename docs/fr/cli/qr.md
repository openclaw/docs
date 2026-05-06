---
read_when:
    - Vous souhaitez associer rapidement une application Node mobile à un Gateway
    - Vous avez besoin de la sortie setup-code pour le partage distant/manuel
summary: Référence CLI pour `openclaw qr` (générer le code QR d’appairage mobile + le code de configuration)
title: QR
x-i18n:
    generated_at: "2026-05-06T07:17:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Générez un QR d’association mobile et un code de configuration à partir de votre configuration Gateway actuelle.

## Utilisation

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Options

- `--remote` : privilégie `gateway.remote.url` ; si elle n’est pas définie, `gateway.tailscale.mode=serve|funnel` peut tout de même fournir l’URL publique distante
- `--url <url>` : remplace l’URL du gateway utilisée dans la charge utile
- `--public-url <url>` : remplace l’URL publique utilisée dans la charge utile
- `--token <token>` : remplace le jeton de gateway auprès duquel le flux d’amorçage s’authentifie
- `--password <password>` : remplace le mot de passe de gateway auprès duquel le flux d’amorçage s’authentifie
- `--setup-code-only` : affiche uniquement le code de configuration
- `--no-ascii` : ignore le rendu QR ASCII
- `--json` : émet du JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notes

- `--token` et `--password` sont mutuellement exclusifs.
- Le code de configuration lui-même transporte désormais un `bootstrapToken` opaque à courte durée de vie, et non le jeton/mot de passe partagé du gateway.
- Dans le flux d’amorçage node/opérateur intégré, le jeton principal du node arrive toujours avec `scopes: []`.
- Si le transfert d’amorçage émet également un jeton opérateur, il reste limité à la liste d’autorisation d’amorçage : `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Les vérifications de portée d’amorçage sont préfixées par rôle. Cette liste d’autorisation opérateur ne satisfait que les requêtes opérateur ; les rôles non opérateur nécessitent toujours des portées sous leur propre préfixe de rôle.
- L’association mobile refuse par défaut les URL de gateway Tailscale/publiques en `ws://`. Les adresses LAN privées et les hôtes Bonjour `.local` restent pris en charge via `ws://`, mais les routes mobiles Tailscale/publiques doivent utiliser Tailscale Serve/Funnel ou une URL de gateway en `wss://`.
- Avec `--remote`, OpenClaw exige soit `gateway.remote.url`, soit
  `gateway.tailscale.mode=serve|funnel`.
- Avec `--remote`, si des identifiants distants effectivement actifs sont configurés comme SecretRefs et que vous ne passez pas `--token` ni `--password`, la commande les résout depuis l’instantané de gateway actif. Si le gateway est indisponible, la commande échoue rapidement.
- Sans `--remote`, les SecretRefs d’authentification du gateway local sont résolues lorsqu’aucun remplacement d’authentification CLI n’est passé :
  - `gateway.auth.token` est résolu lorsque l’authentification par jeton peut l’emporter (`gateway.auth.mode="token"` explicite ou mode déduit où aucune source de mot de passe ne l’emporte).
  - `gateway.auth.password` est résolu lorsque l’authentification par mot de passe peut l’emporter (`gateway.auth.mode="password"` explicite ou mode déduit sans jeton gagnant depuis l’authentification/l’environnement).
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés (y compris comme SecretRefs) et que `gateway.auth.mode` n’est pas défini, la résolution du code de configuration échoue jusqu’à ce que le mode soit défini explicitement.
- Note sur le décalage de version de Gateway : ce chemin de commande nécessite un gateway qui prend en charge `secrets.resolve` ; les gateways plus anciens renvoient une erreur de méthode inconnue.
- Après l’analyse, approuvez l’association de l’appareil avec :
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Articles connexes

- [Référence CLI](/fr/cli)
- [Association](/fr/cli/pairing)
