---
read_when:
    - Vous souhaitez une interface utilisateur de terminal pour le Gateway (adaptée à l’accès distant)
    - Vous souhaitez transmettre l’URL, le jeton et la session depuis des scripts
    - Vous souhaitez exécuter la TUI en mode intégré local sans Gateway
    - Vous souhaitez utiliser openclaw chat ou openclaw tui --local
summary: Référence de la CLI pour `openclaw tui` (interface utilisateur de terminal intégrée locale ou adossée au Gateway)
title: TUI
x-i18n:
    generated_at: "2026-07-12T02:28:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Ouvrez l’interface utilisateur du terminal connectée au Gateway, ou exécutez-la en mode local
intégré.

Guide associé : [TUI](/fr/web/tui)

## Options

| Option                       | Valeur par défaut                        | Description                                                                                     |
| ---------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | S’exécute avec le moteur d’exécution local intégré de l’agent plutôt qu’avec un Gateway.         |
| `--url <url>`                | `gateway.remote.url` de la configuration  | URL WebSocket du Gateway.                                                                       |
| `--token <token>`            | (aucune)                                  | Jeton du Gateway, si nécessaire.                                                                |
| `--password <pass>`          | (aucun)                                   | Mot de passe du Gateway, si nécessaire.                                                         |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | Empreinte attendue du certificat TLS pour un Gateway `wss://` épinglé.                           |
| `--session <key>`            | `main` (ou `global` si la portée est globale) | Clé de session. Dans un espace de travail d’agent, cet agent est sélectionné automatiquement, sauf si la clé comporte un préfixe. |
| `--deliver`                  | `false`                                   | Distribue les réponses de l’assistant via les canaux configurés.                                |
| `--thinking <level>`         | (valeur par défaut du modèle)             | Remplace le niveau de réflexion.                                                                |
| `--message <text>`           | (aucun)                                   | Envoie un message initial après la connexion.                                                   |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | Délai d’expiration de l’agent. Les valeurs non valides génèrent un avertissement et sont ignorées. |
| `--history-limit <n>`        | `200`                                     | Nombre d’entrées d’historique à charger lors de la connexion.                                   |

Les alias `openclaw chat` et `openclaw terminal` appellent cette commande en
impliquant `--local`.

## Remarques

- `--local` ne peut pas être combiné avec `--url`, `--token`, `--password` ou `--tls-fingerprint`.
- Lorsque cela est possible, `tui` résout les SecretRefs d’authentification du Gateway configurées pour l’authentification
  par jeton ou mot de passe (fournisseurs `env`/`file`/`exec`).
- Sans URL ni port explicite, `tui` utilise le port local actif du Gateway
  enregistré par le Gateway en cours d’exécution. Les paramètres explicites `--url`, `OPENCLAW_GATEWAY_URL`,
  `OPENCLAW_GATEWAY_PORT` et la configuration du Gateway distant restent prioritaires.
- Lorsqu’elle est lancée depuis le répertoire d’un espace de travail d’agent configuré, la TUI sélectionne automatiquement
  cet agent comme valeur par défaut de la clé de session (sauf si `--session` est explicitement
  défini sous la forme `agent:<id>:...`).
- Pour afficher le nom d’hôte du Gateway dans le pied de page pour les connexions non locales
  reposant sur une URL, exécutez `openclaw config set tui.footer.showRemoteHost true`. Cette option est désactivée par
  défaut et n’est jamais affichée pour les connexions local loopback ou locales intégrées.
- Le mode local utilise directement le moteur d’exécution intégré de l’agent. La plupart des outils locaux fonctionnent,
  mais les fonctionnalités réservées au Gateway ne sont pas disponibles.
- Le mode local ajoute `/auth [provider]` aux commandes de la TUI.
- Les mécanismes d’approbation des Plugins s’appliquent toujours en mode local : les outils nécessitant une approbation
  demandent une décision dans le terminal ; rien n’est approuvé automatiquement et silencieusement.
- Les [objectifs](/fr/tools/goal) de session apparaissent dans le pied de page et peuvent être gérés avec
  `/goal`.

## Exemples

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare ma configuration à la documentation et indique-moi les corrections à apporter"
# lors de l’exécution dans un espace de travail d’agent, déduit automatiquement cet agent
openclaw tui --session bugfix
```

## Boucle de réparation de la configuration

Utilisez le mode local pour permettre à l’agent intégré d’inspecter la configuration actuelle, de la comparer
à la documentation et de vous aider à la réparer depuis le même terminal.

Si `openclaw config validate` échoue déjà, exécutez d’abord `openclaw configure` ou
`openclaw doctor --fix` ; `openclaw chat` ne contourne pas la protection contre les
configurations non valides.

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

Appliquez des corrections ciblées avec `openclaw config set` ou `openclaw configure`, puis
réexécutez `openclaw config validate`. Consultez [TUI](/fr/web/tui) et
[Configuration](/fr/cli/config).

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [TUI](/fr/web/tui)
- [Objectif](/fr/tools/goal)
