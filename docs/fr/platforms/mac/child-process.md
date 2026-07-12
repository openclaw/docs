---
read_when:
    - Intégration de l’app Mac au cycle de vie du Gateway
summary: Cycle de vie du Gateway sous macOS (launchd)
title: Cycle de vie du Gateway sous macOS
x-i18n:
    generated_at: "2026-07-12T15:36:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

L’app macOS gère le Gateway via **launchd** par défaut et ne lance pas le Gateway en tant que processus enfant. Elle tente d’abord de se connecter à un Gateway déjà en cours d’exécution sur le port configuré ; si aucun n’est accessible, elle active le service launchd au moyen de la CLI `openclaw` externe (sans environnement d’exécution intégré). Cela garantit un démarrage automatique fiable à l’ouverture de session et un redémarrage en cas de plantage.

Le mode processus enfant (Gateway lancé directement par l’application) **n’est pas utilisé** actuellement. Si vous avez besoin d’un couplage plus étroit avec l’interface utilisateur, exécutez manuellement le Gateway dans un terminal.

## Comportement par défaut (launchd)

- L’application installe un LaunchAgent par utilisateur portant le libellé `ai.openclaw.gateway` (ou
  `ai.openclaw.<profile>` lors de l’utilisation de `--profile`/`OPENCLAW_PROFILE`).
- Lorsque le mode local est activé, l’application s’assure que le LaunchAgent est chargé et
  démarre le Gateway si nécessaire.
- Les journaux sont écrits dans le chemin du journal Gateway de launchd (visible dans les paramètres de débogage).

Commandes courantes :

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Remplacez le libellé par `ai.openclaw.<profile>` lors de l’exécution d’un profil nommé.

## Builds de développement non signés

`scripts/restart-mac.sh --no-sign` sert à effectuer rapidement des builds locaux sans clés de signature. Pour empêcher launchd de pointer vers un binaire relais non signé, il écrit
`~/.openclaw/disable-launchagent`.

Les exécutions signées de `scripts/restart-mac.sh` suppriment ce remplacement si le marqueur est présent. Pour le réinitialiser manuellement :

```bash
rm ~/.openclaw/disable-launchagent
```

## Mode connexion uniquement

Pour empêcher l’application macOS d’installer ou de gérer launchd, lancez-la avec
`--attach-only` (ou `--no-launchd`). Cela définit
`~/.openclaw/disable-launchagent`, de sorte que l’application se connecte uniquement à un Gateway déjà en cours d’exécution. Activez ou désactivez le même comportement dans les paramètres de débogage.

## Mode distant

Le mode distant ne démarre jamais de Gateway local. L’application utilise un tunnel SSH vers l’hôte distant et se connecte via ce tunnel.

## Pourquoi nous privilégions launchd

- Démarrage automatique à l’ouverture de session.
- Sémantique intégrée de redémarrage/KeepAlive.
- Journaux et supervision prévisibles.

Si un véritable mode processus enfant s’avère à nouveau nécessaire, il devra être documenté comme un mode distinct, explicite et réservé au développement.

## Liens connexes

- [Application macOS](/fr/platforms/macos)
- [Guide d’exploitation du Gateway](/fr/gateway)
