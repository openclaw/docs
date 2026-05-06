---
read_when:
    - Vous voulez la découverte sur réseau étendu (DNS-SD) via Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Référence CLI pour `openclaw dns` (outils d’aide à la découverte à grande échelle)
title: DNS
x-i18n:
    generated_at: "2026-05-06T09:02:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

Assistants DNS pour la découverte étendue (Tailscale + CoreDNS). Actuellement centré sur macOS + Homebrew CoreDNS.

Connexe :

- Découverte du Gateway : [Découverte](/fr/gateway/discovery)
- Configuration de la découverte étendue : [Configuration](/fr/gateway/configuration)

## Configuration

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Planifier ou appliquer la configuration de CoreDNS pour la découverte DNS-SD unicast.

Options :

- `--domain <domain>` : domaine de découverte étendue (par exemple `openclaw.internal`)
- `--apply` : installer ou mettre à jour la configuration de CoreDNS et redémarrer le service (nécessite sudo ; macOS uniquement)

Ce qu’elle affiche :

- domaine de découverte résolu
- chemin du fichier de zone
- adresses IP actuelles du réseau Tailscale
- configuration de découverte `openclaw.json` recommandée
- les valeurs de serveur de noms/domaine Split DNS Tailscale à définir

Notes :

- Sans `--apply`, la commande est uniquement un assistant de planification et affiche la configuration recommandée.
- Si `--domain` est omis, OpenClaw utilise `discovery.wideArea.domain` depuis la configuration.
- `--apply` prend actuellement en charge uniquement macOS et s’attend à Homebrew CoreDNS.
- `--apply` initialise le fichier de zone si nécessaire, garantit que la strophe d’importation CoreDNS existe, et redémarre le service brew `coredns`.

## Connexe

- [Référence CLI](/fr/cli)
- [Découverte](/fr/gateway/discovery)
