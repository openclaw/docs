---
read_when:
    - Débogage des indicateurs d’état de l’app Mac
summary: Comment l’application macOS indique les états de santé du Gateway et des canaux
title: Contrôles d’intégrité (macOS)
x-i18n:
    generated_at: "2026-07-12T02:48:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# Contrôles d’état sur macOS

Comment consulter l’état de santé des canaux liés depuis l’application de la barre des menus.

## Barre des menus

Point d’état :

- Vert : lié + sonde opérationnelle.
- Orange : lié, mais la sonde d’un canal signale un état dégradé ou non connecté.
- Rouge : pas encore lié.

La ligne secondaire affiche « lié · authentification 12 min » ou indique la cause de l’échec.
L’option « Exécuter le contrôle d’état maintenant » du menu déclenche une sonde à la demande.

## Réglages

- L’onglet Général affiche une carte d’état : point d’état, ligne récapitulative (état de la liaison +
  ancienneté de l’authentification) et, éventuellement, une ligne détaillant l’échec, avec les boutons **Réessayer maintenant** et
  **Ouvrir les journaux**.
- L’**onglet Canaux** affiche l’état et les commandes de chaque canal (code QR de connexion,
  déconnexion, sonde, dernière déconnexion/erreur) pour WhatsApp et Telegram.

## Fonctionnement de la sonde

L’application appelle le RPC `health` du Gateway via sa connexion WebSocket
existante (sans exécuter une commande CLI dans un shell) toutes les ~60 s et à la demande. Le RPC charge
les identifiants et indique l’état sans envoyer de messages. L’application met en cache séparément le dernier
instantané valide et la dernière erreur afin que l’interface se charge instantanément et
ne scintille pas en mode hors ligne.

## En cas de doute

Utilisez la procédure CLI décrite dans [État de santé du Gateway](/fr/gateway/health) (`openclaw status`,
`openclaw status --deep`, `openclaw health --json`) et suivez
`/tmp/openclaw/openclaw-*.log`, en filtrant sur `web-heartbeat` / `web-reconnect`.

## Voir aussi

- [État de santé du Gateway](/fr/gateway/health)
- [Application macOS](/fr/platforms/macos)
