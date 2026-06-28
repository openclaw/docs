---
read_when:
    - Intégrer l’application Mac au cycle de vie du Gateway
summary: Cycle de vie du Gateway sur macOS (launchd)
title: Cycle de vie du Gateway sur macOS
x-i18n:
    generated_at: "2026-05-06T07:31:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 543327024f8c635d74ac656923e8e745dc47ca9df0aba5ec51215bd186db2b35
    source_path: platforms/mac/child-process.md
    workflow: 16
    postprocess_version: locale-links-v1
---

L’application macOS **gère le Gateway via launchd** par défaut et ne lance pas
le Gateway comme processus enfant. Elle tente d’abord de s’attacher à un Gateway
déjà en cours d’exécution sur le port configuré ; si aucun n’est joignable, elle active le service launchd
via la CLI externe `openclaw` (aucun runtime intégré). Cela vous donne un
démarrage automatique fiable à la connexion et un redémarrage en cas de plantage.

Le mode processus enfant (Gateway lancé directement par l’application) n’est **pas utilisé** aujourd’hui.
Si vous avez besoin d’un couplage plus étroit avec l’interface utilisateur, exécutez le Gateway manuellement dans un terminal.

## Comportement par défaut (launchd)

- L’application installe un LaunchAgent par utilisateur étiqueté `ai.openclaw.gateway`
  (ou `ai.openclaw.<profile>` lors de l’utilisation de `--profile`/`OPENCLAW_PROFILE` ; l’ancien `com.openclaw.*` est pris en charge).
- Lorsque le mode local est activé, l’application s’assure que le LaunchAgent est chargé et
  démarre le Gateway si nécessaire.
- Les journaux sont écrits dans le chemin des journaux du Gateway launchd (visible dans les paramètres de débogage).

Commandes courantes :

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Remplacez l’étiquette par `ai.openclaw.<profile>` lors de l’exécution d’un profil nommé.

## Builds de développement non signés

`scripts/restart-mac.sh --no-sign` sert aux builds locaux rapides lorsque vous n’avez pas
de clés de signature. Pour empêcher launchd de pointer vers un binaire relais non signé, il :

- Écrit `~/.openclaw/disable-launchagent`.

Les exécutions signées de `scripts/restart-mac.sh` suppriment cette surcharge si le marqueur est
présent. Pour réinitialiser manuellement :

```bash
rm ~/.openclaw/disable-launchagent
```

## Mode attachement uniquement

Pour forcer l’application macOS à **ne jamais installer ni gérer launchd**, lancez-la avec
`--attach-only` (ou `--no-launchd`). Cela définit `~/.openclaw/disable-launchagent`,
de sorte que l’application s’attache uniquement à un Gateway déjà en cours d’exécution. Vous pouvez activer ou désactiver le même
comportement dans les paramètres de débogage.

## Mode distant

Le mode distant ne démarre jamais de Gateway local. L’application utilise un tunnel SSH vers l’hôte
distant et se connecte via ce tunnel.

## Pourquoi nous préférons launchd

- Démarrage automatique à la connexion.
- Sémantique de redémarrage/KeepAlive intégrée.
- Journaux et supervision prévisibles.

Si un véritable mode processus enfant est de nouveau nécessaire un jour, il devrait être documenté comme un
mode distinct, explicite et réservé au développement.

## Associé

- [application macOS](/fr/platforms/macos)
- [Runbook du Gateway](/fr/gateway)
