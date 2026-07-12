---
read_when:
    - Vous souhaitez une découverte sur réseau étendu (DNS-SD) via Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Référence de la CLI pour `openclaw dns` (utilitaires de découverte sur réseau étendu)
title: DNS
x-i18n:
    generated_at: "2026-07-12T15:13:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

Utilitaires DNS pour la découverte sur réseau étendu (Tailscale + CoreDNS). Actuellement compatibles uniquement avec macOS et CoreDNS installé via Homebrew.

Voir aussi :

- Découverte du Gateway : [Découverte](/fr/gateway/discovery)
- Configuration de la découverte sur réseau étendu : [Configuration](/fr/gateway/configuration)

## `dns setup`

Planifiez ou appliquez la configuration de CoreDNS pour la découverte DNS-SD unicast.

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| Option              | Effet                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| `--domain <domain>` | Domaine de découverte sur réseau étendu (par exemple `openclaw.internal`).                                 |
| `--apply`           | Installe/met à jour la configuration de CoreDNS et (re)démarre le service. Nécessite sudo, macOS uniquement. |

Sans `--domain`, OpenClaw utilise `discovery.wideArea.domain` provenant de la configuration.

Sans `--apply`, la commande affiche uniquement :

- Le domaine de découverte résolu et le chemin du fichier de zone
- Les adresses IP actuelles du tailnet
- La configuration de découverte `openclaw.json` recommandée
- Les valeurs du serveur de noms et du domaine Split DNS de Tailscale à définir dans la console d’administration Tailscale

Avec `--apply` (macOS uniquement, nécessite CoreDNS installé via Homebrew) :

- Initialise le fichier de zone s’il est manquant
- Ajoute la section d’importation CoreDNS si elle est manquante
- Redémarre le service brew `coredns`

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Découverte](/fr/gateway/discovery)
