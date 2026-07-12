---
read_when:
    - Débogage des indicateurs d’état de l’app Mac
summary: Comment l’app macOS indique les états de santé du Gateway et des canaux
title: Vérifications de l’état (macOS)
x-i18n:
    generated_at: "2026-07-12T15:30:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# Contrôles d’intégrité sur macOS

Comment consulter l’état d’intégrité des canaux associés depuis l’application de la barre des menus.

## Barre des menus

Point d’état :

- Vert : associé + sonde opérationnelle.
- Orange : associé, mais une sonde de canal signale un état dégradé/non connecté.
- Rouge : pas encore associé.

La ligne secondaire affiche « associé · authentification 12 min » ou indique la cause de l’échec.
« Exécuter le contrôle d’intégrité maintenant » dans le menu déclenche une sonde à la demande.

## Réglages

- L’onglet Général affiche une carte d’intégrité : point d’état, ligne de résumé (état de l’association +
  ancienneté de l’authentification) et ligne facultative détaillant l’échec, avec les boutons **Réessayer maintenant** et
  **Ouvrir les journaux**.
- L’**onglet Canaux** présente l’état et les commandes de chaque canal (code QR de connexion,
  déconnexion, sonde, dernière déconnexion/erreur) pour WhatsApp et Telegram.

## Fonctionnement de la sonde

L’application appelle la RPC `health` du Gateway via sa connexion WebSocket
existante (sans exécuter de commande CLI) toutes les ~60 s et à la demande. La RPC charge
les identifiants et indique l’état sans envoyer de messages. L’application met en cache séparément le dernier
instantané valide et la dernière erreur afin que l’interface se charge instantanément et
ne clignote pas en mode hors ligne.

## En cas de doute

Utilisez le flux CLI décrit dans [Intégrité du Gateway](/fr/gateway/health) (`openclaw status`,
`openclaw status --deep`, `openclaw health --json`) et suivez
`/tmp/openclaw/openclaw-*.log`, en filtrant sur `web-heartbeat` / `web-reconnect`.

## Voir aussi

- [Intégrité du Gateway](/fr/gateway/health)
- [Application macOS](/fr/platforms/macos)
