---
read_when:
    - Vous souhaitez une interface utilisateur de terminal pour le Gateway (adaptée à l’accès à distance)
    - Vous souhaitez transmettre l’URL, le jeton et la session depuis des scripts
    - Vous souhaitez exécuter la TUI en mode intégré local sans Gateway
    - Vous souhaitez utiliser `openclaw chat` ou `openclaw tui --local`
summary: Référence de la CLI pour `openclaw tui` (interface utilisateur de terminal intégrée locale ou reposant sur le Gateway)
title: TUI
x-i18n:
    generated_at: "2026-07-12T15:11:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Ouvrez l’interface utilisateur de terminal connectée au Gateway, ou exécutez-la en mode local intégré.

Guide associé : [TUI](/fr/web/tui)

## Options

| Indicateur                   | Valeur par défaut                         | Description                                                                                     |
| ---------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | Utilise l’environnement d’exécution local intégré de l’agent au lieu d’un Gateway.              |
| `--url <url>`                | `gateway.remote.url` de la configuration  | URL WebSocket du Gateway.                                                                       |
| `--token <token>`            | (aucune)                                  | Jeton du Gateway, si requis.                                                                    |
| `--password <pass>`          | (aucun)                                   | Mot de passe du Gateway, si requis.                                                             |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | Empreinte attendue du certificat TLS pour un Gateway `wss://` épinglé.                           |
| `--session <key>`            | `main` (ou `global` si la portée est globale) | Clé de session. Dans un espace de travail d’agent, cet agent est automatiquement sélectionné sauf si un préfixe est indiqué. |
| `--deliver`                  | `false`                                   | Distribue les réponses de l’assistant via les canaux configurés.                                |
| `--thinking <level>`         | (valeur par défaut du modèle)             | Remplace le niveau de réflexion.                                                                |
| `--message <text>`           | (aucun)                                   | Envoie un message initial après la connexion.                                                   |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | Délai d’expiration de l’agent. Les valeurs non valides génèrent un avertissement et sont ignorées. |
| `--history-limit <n>`        | `200`                                     | Nombre d’entrées d’historique à charger lors de la connexion.                                   |

Alias : `openclaw chat` et `openclaw terminal` invoquent cette commande en impliquant `--local`.

## Remarques

- `--local` ne peut pas être combiné avec `--url`, `--token`, `--password` ou `--tls-fingerprint`.
- Lorsque cela est possible, `tui` résout les SecretRefs d’authentification du Gateway configurées pour l’authentification par jeton ou mot de passe (fournisseurs `env`/`file`/`exec`).
- Sans URL ni port explicites, `tui` utilise le port actif du Gateway local enregistré par le Gateway en cours d’exécution. Une valeur explicite pour `--url`, `OPENCLAW_GATEWAY_URL`, `OPENCLAW_GATEWAY_PORT` ou la configuration du Gateway distant reste prioritaire.
- Lorsqu’elle est lancée depuis le répertoire d’un espace de travail d’agent configuré, la TUI sélectionne automatiquement cet agent comme valeur par défaut de la clé de session (sauf si `--session` est explicitement défini sur `agent:<id>:...`).
- Pour afficher le nom d’hôte du Gateway dans le pied de page des connexions non locales reposant sur une URL, exécutez `openclaw config set tui.footer.showRemoteHost true`. Cette option est désactivée par défaut et n’est jamais affichée pour les connexions en boucle locale ou locales intégrées.
- Le mode local utilise directement l’environnement d’exécution intégré de l’agent. La plupart des outils locaux fonctionnent, mais les fonctionnalités réservées au Gateway ne sont pas disponibles.
- Le mode local ajoute `/auth [provider]` aux commandes de la TUI.
- Les contrôles d’approbation des Plugins s’appliquent toujours en mode local : les outils nécessitant une approbation demandent une décision dans le terminal ; rien n’est approuvé automatiquement et silencieusement.
- Les [objectifs](/fr/tools/goal) de la session apparaissent dans le pied de page et peuvent être gérés avec `/goal`.

## Exemples

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Comparez ma configuration à la documentation et indiquez-moi ce que je dois corriger"
# lorsqu’elle est exécutée dans un espace de travail d’agent, la commande déduit automatiquement cet agent
openclaw tui --session bugfix
```

## Boucle de réparation de la configuration

Utilisez le mode local pour permettre à l’agent intégré d’inspecter la configuration actuelle, de la comparer à la documentation et de vous aider à la réparer depuis le même terminal.

Si `openclaw config validate` échoue déjà, exécutez d’abord `openclaw configure` ou `openclaw doctor --fix` ; `openclaw chat` ne contourne pas le contrôle de configuration non valide.

```bash
openclaw chat
```

Puis, dans la TUI :

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Appliquez des corrections ciblées avec `openclaw config set` ou `openclaw configure`, puis réexécutez `openclaw config validate`. Consultez [TUI](/fr/web/tui) et [Configuration](/fr/cli/config).

## Ressources associées

- [Référence de la CLI](/fr/cli)
- [TUI](/fr/web/tui)
- [Objectif](/fr/tools/goal)
