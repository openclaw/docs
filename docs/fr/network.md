---
read_when:
    - Vous avez besoin de la vue d’ensemble de l’architecture réseau et de la sécurité
    - Vous diagnostiquez l’accès local ou via le tailnet, ou l’appairage
    - Vous recherchez la liste canonique des documents sur la mise en réseau
summary: 'Hub réseau : interfaces du Gateway, appairage, découverte et sécurité'
title: Réseau
x-i18n:
    generated_at: "2026-07-12T02:46:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

Ce hub regroupe les principaux documents expliquant comment OpenClaw connecte, associe et sécurise
les appareils sur localhost, le LAN et le tailnet.

## Modèle principal

La plupart des opérations transitent par le Gateway (`openclaw gateway`), un processus unique de longue durée qui gère les connexions aux canaux et le plan de contrôle WebSocket.

- **local loopback en priorité** : le WS du Gateway utilise par défaut `ws://127.0.0.1:18789`.
  Les liaisons hors local loopback refusent de démarrer sans méthode d’authentification valide pour le Gateway :
  authentification par jeton secret partagé ou mot de passe, ou déploiement hors local loopback
  `trusted-proxy` correctement configuré.
- **Un Gateway par hôte** est recommandé. Pour assurer l’isolation, exécutez plusieurs Gateway avec des profils et des ports distincts ([Plusieurs Gateway](/fr/gateway/multiple-gateways)).
- **L’hôte Canvas** est servi sur le même port que le Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`) et protégé par l’authentification du Gateway lorsqu’il est lié au-delà du local loopback.
- **L’accès distant** s’effectue généralement par un tunnel SSH ou un VPN Tailscale ([Accès distant](/fr/gateway/remote)).

Références principales :

- [Architecture du Gateway](/fr/concepts/architecture)
- [Protocole du Gateway](/fr/gateway/protocol)
- [Guide d’exploitation du Gateway](/fr/gateway)
- [Interfaces web et modes de liaison](/fr/web)

## Association et identité

- [Présentation de l’association (messages privés et Node)](/fr/channels/pairing)
- [Association de Node gérée par le Gateway](/fr/gateway/pairing)
- [CLI des appareils (association et rotation des jetons)](/fr/cli/devices)
- [CLI d’association (approbations des messages privés)](/fr/cli/pairing)

Confiance locale :

- Les connexions directes en local loopback (sans en-têtes transférés ou de proxy) peuvent être
  automatiquement approuvées pour l’association afin de fluidifier l’expérience utilisateur sur un même hôte.
- OpenClaw dispose également d’un chemin restreint d’auto-connexion locale au backend ou au conteneur pour
  les flux d’assistance fiables utilisant un secret partagé.
- Les clients du tailnet et du LAN, y compris les liaisons tailnet sur le même hôte, nécessitent toujours
  une approbation explicite de l’association.

## Découverte et transports

- [Découverte et transports](/fr/gateway/discovery)
- [Bonjour / mDNS](/fr/gateway/bonjour)
- [Accès distant (SSH)](/fr/gateway/remote)
- [Tailscale](/fr/gateway/tailscale)

## Node et transports

- [Présentation des Node](/fr/nodes)
- [Protocole de pont (anciens Node, historique)](/fr/gateway/bridge-protocol)
- [Guide d’exploitation des Node : iOS](/fr/platforms/ios)
- [Guide d’exploitation des Node : Android](/fr/platforms/android)

## Sécurité

- [Présentation de la sécurité](/fr/gateway/security)
- [Référence de configuration du Gateway](/fr/gateway/configuration)
- [Dépannage](/fr/gateway/troubleshooting)
- [Diagnostic](/fr/gateway/doctor)

## Ressources connexes

- [Guide d’exploitation du Gateway](/fr/gateway)
- [Accès distant](/fr/gateway/remote)
