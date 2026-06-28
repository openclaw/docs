---
read_when:
    - Vous avez besoin de la vue d’ensemble de l’architecture réseau et de la sécurité
    - Vous déboguez l’accès local ou tailnet, ou le jumelage
    - Vous voulez la liste canonique de la documentation réseau
summary: 'Hub réseau : surfaces du Gateway, appairage, découverte et sécurité'
title: Réseau
x-i18n:
    generated_at: "2026-05-06T07:29:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0ff6c4ee46005aeac1612ea40f1ce3d5824aa507d0842788dbf4bffbaccfcc
    source_path: network.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Ce hub relie les documents principaux expliquant comment OpenClaw connecte, associe et sécurise les appareils sur localhost, le LAN et le réseau tailnet.

## Modèle central

La plupart des opérations passent par le Gateway (`openclaw gateway`), un unique processus de longue durée qui possède les connexions de canaux et le plan de contrôle WebSocket.

- **Loopback d'abord** : le WS du Gateway utilise par défaut `ws://127.0.0.1:18789`.
  Les liaisons non-loopback nécessitent un chemin d'authentification Gateway valide : authentification par jeton/mot de passe à secret partagé, ou déploiement non-loopback `trusted-proxy` correctement configuré.
- **Un Gateway par hôte** est recommandé. Pour l'isolation, exécutez plusieurs gateways avec des profils et ports isolés ([Gateways multiples](/fr/gateway/multiple-gateways)).
- **L'hôte Canvas** est servi sur le même port que le Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), protégé par l'authentification Gateway lorsqu'il est lié au-delà du loopback.
- **L'accès distant** se fait généralement via un tunnel SSH ou le VPN Tailscale ([Accès distant](/fr/gateway/remote)).

Références clés :

- [Architecture du Gateway](/fr/concepts/architecture)
- [Protocole du Gateway](/fr/gateway/protocol)
- [Runbook du Gateway](/fr/gateway)
- [Surfaces Web + modes de liaison](/fr/web)

## Association + identité

- [Vue d'ensemble de l'association (DM + nœuds)](/fr/channels/pairing)
- [Association de nœuds détenue par le Gateway](/fr/gateway/pairing)
- [CLI des appareils (association + rotation de jetons)](/fr/cli/devices)
- [CLI d'association (approbations par DM)](/fr/cli/pairing)

Confiance locale :

- Les connexions directes en local loopback peuvent être approuvées automatiquement pour l'association afin de garder une expérience fluide sur le même hôte.
- OpenClaw dispose aussi d'un chemin étroit d'auto-connexion locale au backend/conteneur pour les flux d'assistants à secret partagé de confiance.
- Les clients tailnet et LAN, y compris les liaisons tailnet sur le même hôte, nécessitent toujours une approbation explicite de l'association.

## Découverte + transports

- [Découverte et transports](/fr/gateway/discovery)
- [Bonjour / mDNS](/fr/gateway/bonjour)
- [Accès distant (SSH)](/fr/gateway/remote)
- [Tailscale](/fr/gateway/tailscale)

## Nœuds + transports

- [Vue d'ensemble des nœuds](/fr/nodes)
- [Protocole de pont (nœuds hérités, historique)](/fr/gateway/bridge-protocol)
- [Runbook des nœuds : iOS](/fr/platforms/ios)
- [Runbook des nœuds : Android](/fr/platforms/android)

## Sécurité

- [Vue d'ensemble de la sécurité](/fr/gateway/security)
- [Référence de configuration du Gateway](/fr/gateway/configuration)
- [Dépannage](/fr/gateway/troubleshooting)
- [Doctor](/fr/gateway/doctor)

## Associés

- [Runbook du Gateway](/fr/gateway)
- [Accès distant](/fr/gateway/remote)
